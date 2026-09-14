import webpush from "web-push";
import { Op } from "sequelize";

import Setting from "../../models/Setting";
import PushSubscription from "../../models/PushSubscription";
import User from "../../models/User";
import UserQueue from "../../models/UserQueue";
import Message from "../../models/Message";
import { GetCompanySetting } from "../../helpers/CheckSettings";
import { cacheLayer } from "../../libs/cache";
import { logger } from "../../utils/logger";

/**
 * Notificações push do PWA, como as do WhatsApp: chegam com o app fechado,
 * com o nome e a foto de quem mandou.
 *
 * As chaves VAPID (que identificam este servidor para os serviços de push do
 * Chrome, Firefox e Apple) são criadas na primeira vez e ficam nas
 * configurações da empresa principal. A pública já era uma configuração
 * pública do sistema (vapidPublicKey); a privada começa com "_", o que a
 * esconde da tela de configurações dos administradores, e nunca sai do servidor.
 */

let vapidReady: Promise<string> | null = null;

const ensureVapid = (): Promise<string> => {
  if (!vapidReady) {
    vapidReady = (async () => {
      const [pub, priv] = await Promise.all([
        Setting.findOne({ where: { companyId: 1, key: "vapidPublicKey" } }),
        Setting.findOne({ where: { companyId: 1, key: "_vapidPrivateKey" } })
      ]);

      let publicKey = pub?.value;
      let privateKey = priv?.value;

      if (!publicKey || !privateKey) {
        const keys = webpush.generateVAPIDKeys();
        publicKey = keys.publicKey;
        privateKey = keys.privateKey;
        const save = async (row: Setting | null, key: string, value: string) =>
          row
            ? row.update({ value })
            : Setting.create({ companyId: 1, key, value } as Setting);
        await save(pub, "vapidPublicKey", publicKey);
        await save(priv, "_vapidPrivateKey", privateKey);
        logger.info("WebPush: chaves VAPID criadas");
      }

      const contact =
        process.env.VAPID_SUBJECT || "mailto:suporte@tekvosoft.com";
      webpush.setVapidDetails(contact, publicKey, privateKey);
      return publicKey;
    })().catch(error => {
      vapidReady = null;
      throw error;
    });
  }
  return vapidReady;
};

export const getVapidPublicKey = (): Promise<string> => ensureVapid();

export type PushPayload = {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  url?: string;
};

export const sendPushToUsers = async (
  companyId: number,
  userIds: number[],
  payload: PushPayload
): Promise<void> => {
  if (!userIds.length) return;
  await ensureVapid();

  const subscriptions = await PushSubscription.findAll({
    where: { companyId, userId: { [Op.in]: userIds } }
  });

  await Promise.all(
    subscriptions.map(async sub => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth }
          },
          JSON.stringify({ ...payload, silent: sub.silent }),
          { TTL: 60 * 60 * 6, urgency: "high" }
        );
      } catch (error) {
        // aparelho desinstalou o app ou revogou a permissão: esquece a inscrição
        if (error?.statusCode === 404 || error?.statusCode === 410) {
          await sub.destroy();
        } else {
          logger.warn(
            { statusCode: error?.statusCode, message: error?.message },
            "WebPush: falha ao enviar notificação"
          );
        }
      }
    })
  );
};

const MEDIA_LABEL: Record<string, string> = {
  image: "📷 Foto",
  video: "🎥 Vídeo",
  audio: "🎤 Áudio",
  document: "📎 Documento",
  application: "📎 Documento",
  sticker: "Figurinha",
  locationMessage: "📍 Localização",
  contactMessage: "🪪 Contato"
};

const previewOf = (message: Message): string => {
  const body = (message.body || "").trim();
  if (body.startsWith('{"ticketzvCard"')) return MEDIA_LABEL.contactMessage;
  const label = MEDIA_LABEL[message.mediaType];
  if (label && message.mediaType !== "chat") {
    const caption = body && !/\.[a-z0-9]{2,5}$/i.test(body) ? body : "";
    return caption ? `${label} · ${caption}` : label;
  }
  return body.length > 180 ? `${body.slice(0, 177)}…` : body;
};

/**
 * Mesma regra do aviso dentro do app: o atendente do ticket; sem atendente,
 * quem é das filas do ticket; sem fila, os administradores.
 */
const recipientsOf = async (message: Message): Promise<number[]> => {
  const { ticket } = message;

  if (ticket.userId) return [ticket.userId];

  if (ticket.queueId) {
    const rows = await UserQueue.findAll({
      where: { queueId: ticket.queueId },
      attributes: ["userId"]
    });
    return [...new Set(rows.map(row => row.userId))];
  }

  const admins = await User.findAll({
    where: { companyId: ticket.companyId, profile: "admin" },
    attributes: ["id"]
  });
  return admins.map(admin => admin.id);
};

export const notifyNewMessage = async (message: Message): Promise<void> => {
  if (!message?.ticket || message.fromMe || message.read) return;
  if (message.mediaType === "reactionMessage") return;

  // mensagens antigas (sincronização, reprocessamento) não viram notificação
  const created = new Date(message.createdAt).getTime();
  if (Number.isFinite(created) && Date.now() - created > 5 * 60 * 1000) return;

  // a mesma mensagem pode ser gravada mais de uma vez: notifica só uma
  const dedupeKey = `push:msg:${message.ticketId}:${message.id}`;
  if (await cacheLayer.get(dedupeKey)) return;
  await cacheLayer.set(dedupeKey, "1", "EX", 60 * 60);

  const { ticket } = message;
  const { contact } = ticket;

  if (ticket.isGroup) {
    const groups = await GetCompanySetting(
      ticket.companyId,
      "soundGroupNotifications",
      "disabled"
    );
    if (groups !== "enabled") return;
  }

  const userIds = await recipientsOf(message);
  if (!userIds.length) return;

  const preview = previewOf(message);
  const sender = message.contact?.name;

  await sendPushToUsers(ticket.companyId, userIds, {
    title: contact?.name || contact?.number || "Nova mensagem",
    body:
      ticket.isGroup && sender && sender !== contact?.name
        ? `${sender}: ${preview}`
        : preview,
    icon: contact?.profilePicUrl || undefined,
    tag: `ticket-${ticket.id}`,
    url: `/tickets/${ticket.uuid}`
  });
};
