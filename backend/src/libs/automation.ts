import axios from "axios";
import { logger } from "../utils/logger";
import GetPublicSettingService from "../services/SettingServices/GetPublicSettingService";

/**
 * Avisos para o n8n, que monta e envia os e-mails automáticos.
 *
 * O backend só conta o que aconteceu (com os dados prontos para o texto);
 * o visual e o envio ficam no fluxo "Tekvosoft · E-mails" do n8n. Sem
 * N8N_WEBHOOK_URL no .env nada é enviado — e a verificação de navegador
 * novo fica desligada, para ninguém ficar sem conseguir entrar.
 */
export type AutomationEvent =
  | "company.welcome"
  | "payment.confirmed"
  | "subscription.due_soon"
  | "auth.password_reset"
  | "auth.password_changed"
  | "auth.device_code";

export const automationEnabled = (): boolean => !!process.env.N8N_WEBHOOK_URL;

export const appUrl = (): string =>
  (process.env.FRONTEND_URL || "").replace(/\/+$/, "");

/**
 * Manda o aviso. Com `wait`, espera o n8n confirmar o envio e devolve se
 * deu certo (código de acesso); sem, segue sem travar quem chamou.
 */
export const notifyAutomation = async (
  event: AutomationEvent,
  data: Record<string, unknown>,
  { wait = false }: { wait?: boolean } = {}
): Promise<boolean> => {
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) return false;

  const send = async () => {
    const appName =
      (await GetPublicSettingService({ key: "appName" }).catch(() => null)) ||
      "Tekvosoft";
    await axios.post(
      url,
      {
        event,
        sentAt: new Date().toISOString(),
        app: {
          name: appName,
          url: appUrl(),
          // GIFs e logo dos e-mails (precisam estar num endereço público)
          assetsUrl: (
            process.env.EMAIL_ASSETS_URL || `${appUrl()}/email`
          ).replace(/\/+$/, "")
        },
        data
      },
      {
        timeout: wait ? 20000 : 10000,
        headers: { "x-tekvosoft-secret": process.env.N8N_WEBHOOK_SECRET || "" }
      }
    );
  };

  if (!wait) {
    send().catch(error =>
      logger.warn({ event, message: error?.message }, "n8n: aviso não enviado")
    );
    return true;
  }

  try {
    await send();
    return true;
  } catch (error) {
    logger.warn({ event, message: error?.message }, "n8n: aviso não enviado");
    return false;
  }
};
