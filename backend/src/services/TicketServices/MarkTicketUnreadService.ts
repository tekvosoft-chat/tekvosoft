import { WASocket, proto } from "libzapitu-rf";
import CheckTicketAccess from "../../helpers/CheckTicketAccess";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import { logger } from "../../utils/logger";
import ShowTicketService from "./ShowTicketService";
import { websocketUpdateTicket } from "./UpdateTicketService";

interface Request {
  ticketId: string | number;
  companyId: number;
  user: { id: number; profile: string };
}

/**
 * "Marcar como não lida": a última mensagem do cliente volta a contar como
 * não lida e a conversa ganha a bolinha de novo. No WhatsApp do celular a
 * conversa também fica marcada, como quando alguém faz isso por lá.
 */
const MarkTicketUnreadService = async ({
  ticketId,
  companyId,
  user
}: Request): Promise<Ticket> => {
  const ticket = await ShowTicketService(ticketId, companyId);
  CheckTicketAccess(user, ticket);

  const last = await Message.findOne({
    where: { ticketId: ticket.id, fromMe: false },
    order: [
      ["createdAt", "DESC"],
      ["id", "DESC"]
    ]
  });
  if (last?.read) {
    await last.update({ read: false });
  }

  const unread = await Message.count({
    where: { ticketId: ticket.id, fromMe: false, read: false }
  });
  // não mexe na ordem da lista: só a bolinha aparece
  await ticket.update(
    { unreadMessages: Math.max(unread, 1) },
    { silent: true }
  );

  if (ticket.channel === "whatsapp" && last?.dataJson) {
    try {
      const info: proto.IWebMessageInfo = JSON.parse(last.dataJson);
      const wbot = await GetTicketWbot(ticket);
      if (wbot && info?.key?.remoteJid) {
        await (wbot as WASocket).chatModify(
          { markRead: false, lastMessages: [info] },
          info.key.remoteJid
        );
      }
    } catch (error) {
      // o sistema já marcou; o celular é só um extra
      logger.warn(
        { ticketId: ticket.id, message: error?.message },
        "MarkTicketUnread: o WhatsApp não aceitou marcar como não lida"
      );
    }
  }

  websocketUpdateTicket(ticket);
  return ticket;
};

export default MarkTicketUnreadService;
