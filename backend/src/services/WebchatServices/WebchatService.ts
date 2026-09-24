import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";
import Whatsapp from "../../models/Whatsapp";
import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import Message from "../../models/Message";
import Queue from "../../models/Queue";
import CreateMessageService from "../MessageServices/CreateMessageService";
import { getIO } from "../../libs/socket";
import { logger } from "../../utils/logger";
import AppError from "../../errors/AppError";
import saveMediaToFile from "../../helpers/saveMediaFile";

/**
 * Canal do site: a bolinha de conversa que o cliente cola na página dele.
 *
 * Quem visita o site não tem telefone nem conta: o widget sorteia um número
 * de sessão, guarda no navegador e manda junto de cada mensagem. Aqui esse
 * número vira um contato (`webchat:<sessão>`) e um atendimento como qualquer
 * outro — a equipe atende na mesma tela do WhatsApp, sem saber a diferença.
 *
 * A caixa de entrada é identificada pelo token dela, que vai dentro do
 * script do site. O token é público por natureza: ele só permite abrir
 * conversa naquela caixa, nunca ler as outras.
 */
export const VISITOR_PREFIX = "webchat:";

export type WebchatConfig = {
  name: string;
  color: string;
  welcomeTitle: string;
  welcomeMessage: string;
  domain: string;
  bubblePosition: string;
  bubbleType: string;
  launcherTitle: string;
  replyTime: string;
  showEmoji: boolean;
  showFiles: boolean;
  allowEndConversation: boolean;
  collectEmail: boolean;
  allowAfterResolved: boolean;
};

const ligado = (valor: unknown, padrao: boolean): boolean =>
  valor === undefined || valor === null ? padrao : !!valor;

/** A caixa de entrada daquele token (e só se for mesmo do canal do site). */
export const inboxByToken = async (token: string): Promise<Whatsapp> => {
  const inbox = await Whatsapp.findOne({
    where: { token: String(token || ""), channel: "webchat" },
    include: [{ model: Queue, as: "queues" }]
  });
  if (!inbox) throw new AppError("ERR_WEBCHAT_INBOX_NOT_FOUND", 404);
  return inbox;
};

export const configOf = (inbox: Whatsapp): WebchatConfig => {
  const config = (inbox.config || {}) as Record<string, unknown>;
  return {
    name: inbox.name,
    color: String(config.color || "#5C59E8"),
    welcomeTitle: String(config.welcomeTitle || "Olá! 👋"),
    welcomeMessage: String(
      config.welcomeMessage ||
        "Estamos por aqui. Escreva sua dúvida que a gente responde."
    ),
    domain: String(config.domain || ""),
    bubblePosition: config.bubblePosition === "left" ? "left" : "right",
    bubbleType: config.bubbleType === "expanded" ? "expanded" : "standard",
    launcherTitle: String(config.launcherTitle || "Fale conosco no chat"),
    replyTime: String(config.replyTime || "minutes"),
    showEmoji: ligado(config.showEmoji, true),
    showFiles: ligado(config.showFiles, true),
    allowEndConversation: ligado(config.allowEndConversation, true),
    collectEmail: ligado(config.collectEmail, false),
    allowAfterResolved: ligado(config.allowAfterResolved, true)
  };
};

/**
 * Contato e atendimento de uma sessão do site. Devolve o atendimento aberto
 * ou cria um novo quando o anterior já foi resolvido.
 */
export const visitorTicket = async (
  inbox: Whatsapp,
  sessionId: string,
  visitor: { name?: string; email?: string } = {}
): Promise<{ ticket: Ticket; contact: Contact }> => {
  const number = `${VISITOR_PREFIX}${sessionId}`;
  const [contact] = await Contact.findOrCreate({
    where: { number, companyId: inbox.companyId },
    defaults: {
      name: visitor.name?.trim() || "Visitante do site",
      number,
      email: visitor.email?.trim() || "",
      channel: "webchat",
      companyId: inbox.companyId
    } as never
  });

  // nome informado depois (formulário do widget) atualiza o contato
  if (visitor.name?.trim() && contact.name === "Visitante do site") {
    await contact.update({ name: visitor.name.trim() });
  }

  let ticket = await Ticket.findOne({
    where: {
      contactId: contact.id,
      companyId: inbox.companyId,
      status: { [Op.ne]: "closed" }
    },
    order: [["updatedAt", "DESC"]]
  });

  if (!ticket) {
    const queue = inbox.queues?.length === 1 ? inbox.queues[0] : null;
    ticket = await Ticket.create({
      status: "pending",
      contactId: contact.id,
      companyId: inbox.companyId,
      whatsappId: inbox.id,
      queueId: queue?.id || null,
      channel: "webchat",
      isGroup: false,
      unreadMessages: 0
    } as never);

    // saudação automática: entra como primeira mensagem da conversa
    const ajustes = configOf(inbox);
    if ((inbox.config as Record<string, unknown>)?.greetingEnabled) {
      await CreateMessageService({
        messageData: {
          id: `webchat-${uuidv4()}`,
          ticketId: ticket.id,
          contactId: contact.id,
          body: ajustes.welcomeMessage,
          fromMe: true,
          read: true,
          ack: 3,
          mediaType: "chat",
          channel: "webchat",
          queueId: ticket.queueId
        },
        companyId: inbox.companyId
      });
    }
  }

  ticket.contact = contact;
  return { ticket, contact };
};

/** Mensagem escrita por quem está no site. */
export const receiveFromVisitor = async (
  inbox: Whatsapp,
  sessionId: string,
  body: string,
  visitor: { name?: string; email?: string } = {}
): Promise<Message> => {
  const text = String(body || "").trim();
  if (!text) throw new AppError("ERR_EMPTY_MESSAGE", 400);

  const { ticket, contact } = await visitorTicket(inbox, sessionId, visitor);

  const message = await CreateMessageService({
    messageData: {
      id: `webchat-${uuidv4()}`,
      ticketId: ticket.id,
      contactId: contact.id,
      body: text.slice(0, 10000),
      fromMe: false,
      read: false,
      ack: 3,
      mediaType: "chat",
      channel: "webchat",
      queueId: ticket.queueId
    },
    companyId: inbox.companyId
  });

  await ticket.update({
    lastMessage: text.slice(0, 255),
    unreadMessages: (ticket.unreadMessages || 0) + 1
  });

  logger.info(
    { inboxId: inbox.id, ticketId: ticket.id },
    "Webchat: mensagem recebida do site"
  );
  return message;
};

/** Arquivo enviado pelo visitante: guardado aqui e visto na conversa. */
export const receiveFileFromVisitor = async (
  inbox: Whatsapp,
  sessionId: string,
  media: Express.Multer.File
): Promise<Message> => {
  const { ticket, contact } = await visitorTicket(inbox, sessionId);
  const stream = fs.createReadStream(media.path);
  const mediaUrl = await saveMediaToFile(
    {
      data: stream,
      mimetype: media.mimetype,
      filename: media.originalname
    },
    { destination: ticket }
  );
  stream.destroy();
  fs.unlinkSync(media.path);

  const kind = String(media.mimetype || "").split("/")[0];
  const message = await CreateMessageService({
    messageData: {
      id: `webchat-${uuidv4()}`,
      ticketId: ticket.id,
      contactId: contact.id,
      body: media.originalname,
      fromMe: false,
      read: false,
      ack: 3,
      mediaType: ["image", "video", "audio"].includes(kind)
        ? kind
        : "application",
      mediaUrl,
      channel: "webchat",
      queueId: ticket.queueId
    },
    companyId: inbox.companyId
  });

  await ticket.update({
    lastMessage: media.originalname,
    unreadMessages: (ticket.unreadMessages || 0) + 1
  });
  return message;
};

/** O visitante deu a conversa por encerrada. */
export const closeVisitorTicket = async (
  inbox: Whatsapp,
  sessionId: string
): Promise<void> => {
  const { ticket } = await visitorTicket(inbox, sessionId);
  await ticket.update({ status: "closed" });
  logger.info(
    { ticketId: ticket.id },
    "Webchat: visitante encerrou a conversa"
  );
};

/** Resposta da equipe indo para o navegador de quem está no site. */
export const sendToVisitor = (ticket: Ticket, message: Message): void => {
  const sessionId = String(ticket.contact?.number || "").replace(
    VISITOR_PREFIX,
    ""
  );
  if (!sessionId) return;
  try {
    getIO()
      .to(`webchat-${sessionId}`)
      .emit("webchat-message", {
        id: message.id,
        body: message.body,
        fromMe: true,
        mediaUrl: message.mediaUrl || null,
        mediaType: message.mediaType || "chat",
        createdAt: message.createdAt
      });
  } catch (error) {
    logger.warn(
      { ticketId: ticket.id, error: error?.message },
      "Webchat: não consegui entregar a resposta ao site"
    );
  }
};

/** Conversa daquela sessão, para o widget montar a tela ao abrir. */
export const historyFor = async (
  inbox: Whatsapp,
  sessionId: string
): Promise<Message[]> => {
  const { ticket } = await visitorTicket(inbox, sessionId);
  return Message.findAll({
    where: {
      ticketId: ticket.id,
      isPrivate: { [Op.not]: true },
      isDeleted: { [Op.not]: true }
    },
    order: [["createdAt", "ASC"]],
    limit: 200,
    attributes: ["id", "body", "fromMe", "mediaUrl", "mediaType", "createdAt"]
  });
};
