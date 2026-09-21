import { Request, Response } from "express";
import SendWhatsAppLocation from "../services/WbotServices/SendWhatsAppLocation";
import fs from "fs";
import AppError from "../errors/AppError";

import SetTicketMessagesAsRead from "../helpers/SetTicketMessagesAsRead";
import { getIO } from "../libs/socket";
import Queue from "../models/Queue";
import User from "../models/User";
import Whatsapp from "../models/Whatsapp";

import ListMessagesService from "../services/MessageServices/ListMessagesService";
import ListPreviousMessagesService from "../services/MessageServices/ListPreviousMessagesService";
import {
  listStickers,
  searchGifs,
  sendGif,
  sendSticker,
  sendKlipy,
  searchExpressions
} from "../services/MessageServices/ExpressionsService";
import ShowTicketService from "../services/TicketServices/ShowTicketService";
import DeleteWhatsAppMessage from "../services/WbotServices/DeleteWhatsAppMessage";
import SendWhatsAppMedia from "../services/WbotServices/SendWhatsAppMedia";
import SendWhatsAppMessage from "../services/WbotServices/SendWhatsAppMessage";
import CheckContactNumber from "../services/WbotServices/CheckNumber";
import EditWhatsAppMessage from "../services/WbotServices/EditWhatsAppMessage";

import { logger } from "../utils/logger";
import { MessageData } from "../helpers/SendMessage";
import Message from "../models/Message";
import Contact from "../models/Contact";
import Ticket from "../models/Ticket";
import OldMessage from "../models/OldMessage";
import ForwardMessageService from "../services/MessageServices/ForwardMessageService";
import TranscribeMessageService from "../services/MessageServices/TranscribeMessageService";
import { getWbot } from "../libs/wbot";
import { verifyMessage } from "../services/WbotServices/wbotMessageListener";
import { getJidOf } from "../services/WbotServices/getJidOf";
import ShowContactService from "../services/ContactServices/ShowContactService";
import { verifyContact } from "../services/WbotServices/verifyContact";
import EnsureSameCompany from "../helpers/EnsureSameCompany";

type IndexQuery = {
  nextId?: string;
  markAsRead: string;
  minUpdatedAt?: string;
};

type ForwardData = {
  contactId: number;
  ticketId: number;
  messageId: string;
  queueId: number;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;
  const { nextId, markAsRead, minUpdatedAt } = req.query as IndexQuery;
  const { companyId, profile } = req.user;
  const queues: number[] = [];

  if (profile !== "admin") {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Queue, as: "queues" }]
    });
    user.queues.forEach(queue => {
      queues.push(queue.id);
    });
  }

  const {
    count,
    messages,
    ticket,
    hasMore,
    nextId: responseNextId
  } = await ListMessagesService({
    nextId,
    ticketId,
    companyId,
    queues,
    minUpdatedAt
  });

  if (ticket.channel === "whatsapp" && markAsRead === "true") {
    SetTicketMessagesAsRead(ticket);
  }

  return res.json({ count, messages, ticket, hasMore, nextId: responseNextId });
};

/** Mensagens dos atendimentos anteriores do mesmo contato. */
export const previous = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { ticketId } = req.params;
  const { before, peek } = req.query as { before?: string; peek?: string };
  const { companyId, profile } = req.user;
  const queues: number[] = [];

  if (profile !== "admin") {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Queue, as: "queues" }]
    });
    user.queues.forEach(queue => queues.push(queue.id));
  }

  const result = await ListPreviousMessagesService({
    ticketId,
    companyId,
    queues,
    before,
    peek: peek === "true"
  });

  return res.json(result);
};

export const historyByMessageId = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { messageId } = req.params;
  const { companyId } = req.user;

  const message = await Message.findOne({
    where: {
      id: messageId,
      companyId
    },
    attributes: ["id"],
    include: [
      {
        model: Ticket,
        as: "ticket",
        attributes: [
          "id",
          "companyId",
          "status",
          "userId",
          "queueId",
          "isGroup"
        ]
      }
    ]
  });

  if (!message) {
    throw new AppError("ERR_MESSAGE_NOT_FOUND", 404);
  }

  const ticket = message.ticket as Ticket;

  if (ticket.companyId !== companyId) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const oldMessages = await OldMessage.findAll({
    where: {
      messageId
    },
    order: [["createdAt", "ASC"]]
  });

  return res.json({ oldMessages });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;
  const { body, quotedMsg }: MessageData = req.body;
  const medias = req.files as Express.Multer.File[];
  // legenda de cada foto/vídeo, na mesma ordem dos arquivos
  const captions: string[] = []
    .concat(req.body?.captions ?? [])
    .map((caption: unknown) => String(caption ?? "").slice(0, 3000));
  const { companyId } = req.user;
  const userId = Number(req.user.id) || null;

  const ticket = await ShowTicketService(ticketId, companyId);
  const { channel } = ticket;
  if (channel === "whatsapp") {
    await SetTicketMessagesAsRead(ticket);
    if (!ticket.isGroup) {
      const contact = await ShowContactService(ticket.contactId, companyId);
      if (!contact.number.includes("@") && !contact.whatsappLidMap) {
        await verifyContact(
          { id: `${contact.number}@s.whatsapp.net`, name: contact.name },
          getWbot(ticket.whatsappId),
          companyId
        );
        await ticket.reload();
      }
    }
  }

  if (medias) {
    if (channel === "whatsapp") {
      await Promise.all(
        medias.map(async (media: Express.Multer.File, index: number) => {
          await SendWhatsAppMedia({
            media,
            ticket,
            caption: captions[index] || undefined
          });
          fs.unlinkSync(media.path);
        })
      );
    }
  } else if (channel === "whatsapp") {
    await SendWhatsAppMessage({ body, ticket, userId, quotedMsg });
  }

  return res.send();
};

export const react = async (req: Request, res: Response): Promise<Response> => {
  const { messageId } = req.params;
  const { companyId } = req.user;
  const { ticketId, emoji } = req.body;

  const message = await Message.findOne({
    where: {
      id: messageId,
      ticketId
    }
  });

  if (!message) {
    throw new AppError("ERR_MESSAGE_NOT_FOUND", 404);
  }

  const ticket = await ShowTicketService(ticketId, companyId);
  const wbot = getWbot(ticket.whatsappId);

  if (!wbot) {
    throw new AppError("ERR_WHATSAPP_NOT_FOUND", 500);
  }

  const msg = JSON.parse(message.dataJson);

  const sentMessage = await wbot.sendMessage(getJidOf(ticket), {
    react: {
      text: emoji,
      key: msg.key
    }
  });

  if (!sentMessage) {
    throw new AppError("ERR_WHATSAPP_MESSAGE_NOT_SENT", 500);
  }

  await verifyMessage(sentMessage, ticket, ticket.contact);
  return res.send();
};

export const edit = async (req: Request, res: Response): Promise<Response> => {
  const { messageId } = req.params;
  const { companyId } = req.user;
  const userId = Number(req.user.id) || null;
  const { body }: MessageData = req.body;

  const { ticketId, message } = await EditWhatsAppMessage({
    messageId,
    companyId,
    userId,
    body
  });

  const io = getIO();
  io.to(ticketId.toString()).emit(`company-${companyId}-appMessage`, {
    action: "update",
    message
  });

  return res.send();
};

export const transcribe = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { messageId } = req.params;
  const { companyId } = req.user;

  const message = await TranscribeMessageService({ messageId, companyId });

  const io = getIO();
  io.to(message.ticketId.toString()).emit(`company-${companyId}-appMessage`, {
    action: "update",
    message
  });

  return res.json(message);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { messageId } = req.params;
  const { companyId } = req.user;

  EnsureSameCompany(await Message.findByPk(messageId), companyId);

  const message = await DeleteWhatsAppMessage(messageId);

  const io = getIO();
  io.to(message.ticketId.toString()).emit(`company-${companyId}-appMessage`, {
    action: "update",
    message
  });

  return res.send();
};

export const forward = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { contactId, ticketId, messageId, queueId }: ForwardData = req.body;
  const { companyId } = req.user;

  const user = await User.findByPk(req.user.id, {
    include: [{ model: Queue, as: "queues" }]
  });

  if (
    user.profile !== "admin" &&
    queueId &&
    !user.queues.find(q => q.id === queueId)
  ) {
    throw new AppError("ERR_FORBIDDEN", 403);
  }

  const message = await Message.findOne({
    where: {
      id: messageId,
      ticketId
    },
    include: [
      {
        model: Ticket,
        as: "ticket",
        include: [
          {
            model: Whatsapp,
            as: "whatsapp"
          }
        ]
      },
      "contact"
    ]
  });

  if (!message) {
    throw new AppError("ERR_MESSAGE_NOT_FOUND", 404);
  }

  const contact = await Contact.findByPk(contactId);

  if (!contact) {
    throw new AppError("ERR_CONTACT_NOT_FOUND", 404);
  }

  const queue = queueId && (await Queue.findByPk(queueId));

  if (queueId && !queue) {
    throw new AppError("ERR_QUEUE_NOT_FOUND", 404);
  }

  if (
    message.companyId !== companyId ||
    contact.companyId !== companyId ||
    (queue && queue.companyId !== companyId)
  ) {
    throw new AppError("ERR_ACCESS_DENIED", 403);
  }

  const forwarded = await ForwardMessageService(user, message, contact, queue);

  // o atendimento de destino: a tela usa para mandar a legenda em seguida
  return res.json({ ticketId: forwarded?.ticketId ?? null });
};

export const send = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const messageData: MessageData = req.body;
  const medias = req.files as Express.Multer.File[];

  if (messageData.number === undefined) {
    throw new AppError("ERR_SYNTAX", 400);
  }
  const whatsapp = await Whatsapp.findByPk(whatsappId);

  if (!whatsapp) {
    throw new AppError("ERR_WHATSAPP_NOT_FOUND", 404);
  }

  try {
    let { number } = messageData;
    const { body, linkPreview } = messageData;
    const saveOnTicket = !!messageData.saveOnTicket;

    if (!number.includes("@")) {
      const numberToTest = messageData.number;

      const { companyId } = whatsapp;

      const CheckValidNumber = await CheckContactNumber(
        numberToTest,
        companyId,
        whatsapp
      );
      number = CheckValidNumber.jid.replace(/\D/g, "");
    }

    if (medias) {
      await Promise.all(
        medias.map(async (media: Express.Multer.File) => {
          await req.app.get("queues").messageQueue.add(
            "SendMessage",
            {
              whatsappId,
              data: {
                number,
                body: media.originalname,
                mediaPath: media.path,
                saveOnTicket
              }
            },
            { removeOnComplete: true, removeOnFail: 100, attempts: 3 }
          );
        })
      );
    } else {
      req.app.get("queues").messageQueue.add(
        "SendMessage",
        {
          whatsappId,
          data: {
            number,
            body,
            linkPreview,
            saveOnTicket
          }
        },

        { removeOnComplete: true, removeOnFail: 100, attempts: 3 }
      );
    }

    return res.send({ mensagem: "Message added to queue" });
  } catch (err) {
    const error = { errType: typeof err, serialized: JSON.stringify(err), err };
    if (err?.message) {
      console.error(error, `MessageController.send: ${err.message}`);
    } else {
      logger.error(
        error,
        "MessageController.send: Failed to put message on queue"
      );
    }
    throw new AppError("ERR_INTERNAL", 500);
  }
};

/** Figurinhas já usadas nas conversas da empresa. */
export const stickers = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;
  return res.json({ stickers: await listStickers(companyId) });
};

/** Busca de GIFs (GIPHY) com a chave das configurações. */
export const gifs = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const query = String(req.query.q || "").slice(0, 60);
  const offset = Number(req.query.offset) || 0;
  return res.json(await searchGifs(companyId, query, offset));
};

/** Envia uma figurinha (messageId) ou um GIF (gifId) para o atendimento. */
/** Busca de GIFs e figurinhas (KLIPY, com o GIPHY como reserva). */
export const expressions = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;
  const { q, page, kind } = req.query as {
    q?: string;
    page?: string;
    kind?: string;
  };

  const result = await searchExpressions(
    companyId,
    kind === "stickers" ? "stickers" : "gifs",
    (q || "").trim(),
    Number(page) || 1
  );

  return res.json(result);
};

export const sendExpression = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { ticketId } = req.params;
  const { companyId } = req.user;
  const { stickerMessageId, gifId, quotedMsgId } = req.body || {};

  const ticket = await ShowTicketService(ticketId, companyId);
  if (ticket.channel !== "whatsapp") {
    throw new AppError("ERR_CHANNEL_NOT_SUPPORTED", 400);
  }

  // a mensagem que a pessoa escolheu responder na tela
  const quotedMsg = quotedMsgId
    ? await Message.findOne({
        where: { id: String(quotedMsgId), companyId }
      })
    : null;

  if (stickerMessageId) {
    await sendSticker(ticket, String(stickerMessageId), companyId, quotedMsg);
  } else if (gifId && String(gifId).startsWith("klipy:")) {
    await sendKlipy(ticket, String(gifId), companyId, quotedMsg);
  } else if (gifId) {
    await sendGif(ticket, String(gifId), companyId, quotedMsg);
  } else {
    throw new AppError("ERR_SYNTAX", 400);
  }

  return res.send();
};

/** Envia a localização escolhida no mapa para o cliente. */
export const sendLocation = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { ticketId } = req.params;
  const { companyId } = req.user;
  const { latitude, longitude, name, address } = req.body || {};

  const ticket = await ShowTicketService(ticketId, companyId);
  if (ticket.channel !== "whatsapp") {
    throw new AppError("ERR_CHANNEL_NOT_SUPPORTED", 400);
  }

  await SendWhatsAppLocation({
    ticket,
    latitude: Number(latitude),
    longitude: Number(longitude),
    name: name ? String(name).slice(0, 120) : undefined,
    address: address ? String(address).slice(0, 240) : undefined
  });

  return res.send();
};
