import moment from "moment";
import { Op } from "sequelize";
import Company from "../../models/Company";
import Invoices from "../../models/Invoices";
import Plan from "../../models/Plan";
import User from "../../models/User";
import { cacheLayer } from "../../libs/cache";
import {
  appUrl,
  automationEnabled,
  notifyAutomation
} from "../../libs/automation";
import { asaasSavedCard } from "../PaymentGatewayServices/AsaasServices";
import { logger } from "../../utils/logger";

/**
 * Os e-mails automáticos, do lado do backend: junta os dados de cada
 * situação e avisa o n8n (que monta o visual e envia).
 */

const FEATURE_LABELS: Record<string, string> = {
  useKanban: "Kanban de atendimentos",
  useInternalChat: "Chat interno com chamadas de voz e vídeo",
  useSchedules: "Agendamento de mensagens",
  useCampaigns: "Campanhas e disparos",
  useExternalApi: "API para integrações"
};

const RECURRENCE_LABELS: Record<string, string> = {
  MENSAL: "mensal",
  BIMESTRAL: "bimestral",
  TRIMESTRAL: "trimestral",
  SEMESTRAL: "semestral",
  ANUAL: "anual"
};

const money = (value: number, currency = "BRL") => {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency || "BRL"
    }).format(Number(value) || 0);
  } catch {
    return `R$ ${Number(value || 0).toFixed(2)}`;
  }
};

const date = (value: string | Date) =>
  value ? moment(value).format("DD/MM/YYYY") : "";

const planData = (plan: Plan | null, recurrence?: string) => {
  if (!plan) return null;
  return {
    name: plan.name,
    value: Number(plan.value) || 0,
    valueText: money(plan.value, plan.currency),
    recurrence: RECURRENCE_LABELS[recurrence] || "mensal",
    users: plan.users,
    connections: plan.connections,
    queues: plan.queues,
    features: Object.keys(FEATURE_LABELS)
      .filter(key => !!plan.get(key))
      .map(key => FEATURE_LABELS[key])
  };
};

const loadCompany = (companyId: number) =>
  Company.findByPk(companyId, { include: [{ model: Plan }] });

// quem recebe: o e-mail da empresa; sem ele, o administrador mais antigo
const recipient = async (company: Company) => {
  const admin = await User.findOne({
    where: { companyId: company.id, profile: "admin" },
    order: [["id", "ASC"]],
    attributes: ["id", "name", "email"]
  });
  return {
    to: company.email || admin?.email || "",
    name: admin?.name || company.name
  };
};

const links = () => ({
  loginUrl: `${appUrl()}/login`,
  financeUrl: `${appUrl()}/financeiro`,
  forgotUrl: `${appUrl()}/forgot-password`
});

/** Primeiro fluxo: boas-vindas, com o plano e até quando vale. */
export const sendWelcomeEmail = async (companyId: number): Promise<void> => {
  if (!automationEnabled()) return;
  try {
    const company = await loadCompany(companyId);
    if (!company) return;
    const { to, name } = await recipient(company);
    if (!to) return;
    const days = company.dueDate
      ? moment(company.dueDate)
          .startOf("day")
          .diff(moment().startOf("day"), "days")
      : null;
    await notifyAutomation("company.welcome", {
      to,
      name,
      companyName: company.name,
      dueDate: date(company.dueDate),
      daysLeft: days,
      trial: true,
      plan: planData(company.plan, company.recurrence),
      ...links()
    });
  } catch (error) {
    logger.warn(
      { companyId, message: error?.message },
      "e-mail de boas-vindas"
    );
  }
};

/** Segundo fluxo: pagamento confirmado. */
export const sendPaymentConfirmedEmail = async (
  invoice: Invoices
): Promise<void> => {
  if (!automationEnabled()) return;
  try {
    const company = await loadCompany(invoice.companyId);
    if (!company) return;
    const { to, name } = await recipient(company);
    if (!to) return;
    await notifyAutomation("payment.confirmed", {
      to,
      name,
      companyName: company.name,
      invoiceId: invoice.id,
      detail: invoice.detail,
      valueText: money(invoice.value, invoice.currency),
      paidAt: moment().format("DD/MM/YYYY [às] HH:mm"),
      dueDate: date(company.dueDate),
      plan: planData(company.plan, company.recurrence),
      ...links()
    });
  } catch (error) {
    logger.warn(
      { invoiceId: invoice?.id, message: error?.message },
      "e-mail de pagamento confirmado"
    );
  }
};

/**
 * Terceiro fluxo: faltam poucos dias para vencer. Roda todo dia de manhã;
 * os dias de aviso saem de DUE_REMINDER_DAYS (padrão: 3 e 2 dias antes).
 */
export const sendDueReminderEmails = async (): Promise<void> => {
  if (!automationEnabled()) return;
  const today = moment().startOf("day");
  const days = String(process.env.DUE_REMINDER_DAYS || "3,2")
    .split(",")
    .map(d => Number(d.trim()))
    .filter(d => Number.isInteger(d) && d >= 0);
  if (!days.length) return;

  const companies = await Company.findAll({
    where: {
      id: { [Op.ne]: 1 },
      status: true,
      dueDate: {
        [Op.in]: days.map(d => today.clone().add(d, "day").format("YYYY-MM-DD"))
      }
    },
    include: [{ model: Plan }]
  });

  await Promise.all(
    companies.map(async company => {
      try {
        const daysLeft = moment(company.dueDate)
          .startOf("day")
          .diff(today, "days");
        // um aviso por empresa, por vencimento e por dia (mesmo se reiniciar)
        const key = `mail:due:${company.id}:${company.dueDate}:${daysLeft}`;
        if (await cacheLayer.get(key)) return;
        await cacheLayer.set(key, "1", "EX", 4 * 86400);

        const { to, name } = await recipient(company);
        if (!to) return;
        const paid = await Invoices.count({
          where: { companyId: company.id, status: "paid" }
        });
        const card = await asaasSavedCard(company.id).catch(() => null);
        const plan = planData(company.plan, company.recurrence);

        await notifyAutomation("subscription.due_soon", {
          to,
          name,
          companyName: company.name,
          daysLeft,
          dueDate: date(company.dueDate),
          trial: !paid,
          autoRenew: !!(card?.hasCard && card?.autoRenew),
          cardLabel: card?.hasCard ? card.label || "" : "",
          valueText: plan?.valueText || "",
          plan,
          ...links()
        });
      } catch (error) {
        logger.warn(
          { companyId: company.id, message: error?.message },
          "e-mail de vencimento"
        );
      }
    })
  );
};

type AccessContext = { ip?: string; device?: string };

/** Link para criar uma senha nova ("esqueci minha senha"). */
export const sendPasswordResetEmail = (
  user: User,
  resetUrl: string,
  context: AccessContext
): Promise<boolean> =>
  notifyAutomation("auth.password_reset", {
    to: user.email,
    name: user.name,
    resetUrl,
    expiresInMinutes: 30,
    when: moment().format("DD/MM/YYYY [às] HH:mm"),
    ...context,
    ...links()
  });

/** Aviso de segurança: a senha da conta foi trocada. */
export const sendPasswordChangedEmail = (
  user: User,
  context: AccessContext = {}
): Promise<boolean> =>
  notifyAutomation("auth.password_changed", {
    to: user.email,
    name: user.name,
    when: moment().format("DD/MM/YYYY [às] HH:mm"),
    ...context,
    ...links()
  });

/** Código para liberar um navegador novo (espera o envio confirmar). */
export const sendDeviceCodeEmail = (
  user: User,
  code: string,
  context: AccessContext
): Promise<boolean> =>
  notifyAutomation(
    "auth.device_code",
    {
      to: user.email,
      name: user.name,
      code,
      expiresInMinutes: 10,
      when: moment().format("DD/MM/YYYY [às] HH:mm"),
      ...context,
      ...links()
    },
    { wait: true }
  );
