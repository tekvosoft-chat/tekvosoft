import { WAMessage } from "libzapitu-rf";
import * as Sentry from "@sentry/node";
import AppError from "../../errors/AppError";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import Ticket from "../../models/Ticket";
import { verifyMessage } from "./wbotMessageListener";
import { getJidOf } from "./getJidOf";

interface Request {
  ticket: Ticket;
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

/** Envia uma localização (pino no mapa) para o cliente, como no WhatsApp. */
const SendWhatsAppLocation = async ({
  ticket,
  latitude,
  longitude,
  name,
  address
}: Request): Promise<WAMessage> => {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new AppError("ERR_INVALID_LOCATION", 400);
  }
  const wbot = await GetTicketWbot(ticket);
  try {
    const sentMessage = await wbot.sendMessage(getJidOf(ticket), {
      location: {
        degreesLatitude: latitude,
        degreesLongitude: longitude,
        name: name || undefined,
        address: address || undefined
      }
    });
    wbot.cacheMessage(sentMessage);
    await verifyMessage(sentMessage, ticket, ticket.contact);
    return sentMessage;
  } catch (err) {
    Sentry.captureException(err);
    throw new AppError("ERR_SENDING_WAPP_MSG");
  }
};

export default SendWhatsAppLocation;
