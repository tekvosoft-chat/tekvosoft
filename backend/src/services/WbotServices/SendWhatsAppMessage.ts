import { WAMessage } from "libzapitu-rf";
import * as Sentry from "@sentry/node";
import AppError from "../../errors/AppError";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";

import formatBody from "../../helpers/Mustache";
import { verifyMediaMessage, verifyMessage } from "./wbotMessageListener";
import User from "../../models/User";
import { getJidOf } from "./getJidOf";
import Whatsapp from "../../models/Whatsapp";

interface Request {
  body: string;
  ticket: Ticket;
  userId?: number;
  quotedMsg?: Message;
  // false: a pessoa fechou a prévia do link antes de enviar
  linkPreview?: boolean;
}

const SendWhatsAppMessage = async ({
  body,
  ticket,
  userId,
  quotedMsg,
  linkPreview
}: Request): Promise<WAMessage> => {
  let options = {};

  const connection = await Whatsapp.findByPk(ticket.whatsappId);

  if (!connection) {
    throw new AppError("ERR_WAPP_NOT_FOUND");
  }

  if (connection.status !== "CONNECTED") {
    throw new AppError("ERR_WAPP_NOT_INITIALIZED");
  }

  const wbot = await GetTicketWbot(ticket);

  if (quotedMsg) {
    const chatMessage = await Message.findOne({
      where: {
        id: quotedMsg.id
      }
    });

    // Monta o objeto "quoted" completo para o Baileys: tenta usar o JSON salvo,
    // e se não houver ou estiver inválido, constrói a chave e um conteúdo mínimo.
    let quoted: any = null;

    // 1) tentar o JSON salvo no banco
    try {
      const saved = chatMessage?.dataJson ? JSON.parse(chatMessage.dataJson) : null;
      if (saved?.key && saved?.message) {
        quoted = { key: saved.key, message: saved.message };
      }
    } catch {
      // JSON inválido — cai para a construção manual
    }

    // 2) construção manual (fallback)
    if (!quoted) {
      const key = {
        remoteJid: getJidOf(ticket),
        fromMe: !!(chatMessage?.fromMe ?? quotedMsg.fromMe),
        id: quotedMsg.id
      };

      const bodyText = (chatMessage?.body ?? quotedMsg.body ?? "").slice(0, 4096);
      const mediaType = chatMessage?.mediaType ?? quotedMsg.mediaType ?? "chat";

      // para garantir que a citação apareça, caímos para um conteúdo textual mínimo
      // quando não der para mapear a mídia seguramente.
      let message: any = { conversation: bodyText };

      // quando possível, indica o tipo base da mídia (sem depender de campos binários)
      if (!bodyText) {
        if (mediaType === "image") message = { imageMessage: {} };
        else if (mediaType === "video") message = { videoMessage: {} };
        else if (mediaType === "application" || mediaType === "document") message = { documentMessage: {} };
        else if (mediaType === "audio") message = { audioMessage: {} };
        else if (mediaType === "sticker") message = { stickerMessage: {} };
      }

      quoted = { key, message };
    }

    options = { quoted };
  }

  try {
    const user = userId && (await User.findByPk(userId));
    const formattedBody = formatBody(body, ticket, user);
    const sentMessage = await wbot.sendMessage(
      getJidOf(ticket),
      {
        text: formattedBody,
        // null desliga a prévia que o Baileys gera sozinho
        ...(linkPreview === false ? { linkPreview: null } : {})
      },
      {
        ...options
      }
    );

    wbot.cacheMessage(sentMessage);

    if (sentMessage?.message?.extendedTextMessage?.thumbnailDirectPath) {
      await verifyMediaMessage(sentMessage, ticket, ticket.contact, { wbot });
    } else {
      await verifyMessage(sentMessage, ticket, ticket.contact);
    }
    return sentMessage;
  } catch (err) {
    Sentry.captureException(err);
    console.log(err);
    throw new AppError("ERR_SENDING_WAPP_MSG");
  }
};

export default SendWhatsAppMessage;
