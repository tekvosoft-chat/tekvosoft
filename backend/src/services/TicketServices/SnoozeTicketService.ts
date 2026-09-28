import { Op } from "sequelize";
import AppError from "../../errors/AppError";
import CheckTicketAccess from "../../helpers/CheckTicketAccess";
import Ticket from "../../models/Ticket";
import { logger } from "../../utils/logger";
import ShowTicketService from "./ShowTicketService";
import { websocketUpdateTicket } from "./UpdateTicketService";

/**
 * Adiar: a conversa sai das listas até a hora escolhida e volta sozinha,
 * pelo job de cada minuto, ou antes, se o cliente escrever.
 *
 * "Até o cliente responder" grava uma data que o relógio nunca alcança; só
 * a próxima mensagem dele (CreateMessageService) tira o adiamento.
 */
export const SNOOZE_UNTIL_REPLY = new Date("9999-12-31T23:59:59.000Z");

interface Request {
  ticketId: string | number;
  companyId: number;
  user: { id: number; profile: string };
  // "reply", uma data ISO no futuro, ou null para tirar o adiamento
  until: string | null;
}

const SnoozeTicketService = async ({
  ticketId,
  companyId,
  user,
  until
}: Request): Promise<Ticket> => {
  const ticket = await ShowTicketService(ticketId, companyId);
  CheckTicketAccess(user, ticket);

  let snoozedUntil: Date = null;
  if (until === "reply") {
    snoozedUntil = SNOOZE_UNTIL_REPLY;
  } else if (until) {
    snoozedUntil = new Date(until);
    if (
      Number.isNaN(snoozedUntil.getTime()) ||
      snoozedUntil.getTime() <= Date.now()
    ) {
      throw new AppError("ERR_INVALID_SNOOZE", 400);
    }
  }

  if (snoozedUntil && ticket.status === "closed") {
    throw new AppError("ERR_INVALID_SNOOZE", 400);
  }

  await ticket.update({ snoozedUntil }, { silent: true });
  // as listas tiram a conversa ao ver o snoozedUntil no evento
  websocketUpdateTicket(ticket);

  return ticket;
};

// job de cada minuto: quem chegou na hora volta para o topo da lista
export const WakeSnoozedTicketsService = async (): Promise<void> => {
  const due = await Ticket.findAll({
    attributes: ["id", "companyId"],
    where: { snoozedUntil: { [Op.lte]: new Date() } }
  });

  // eslint-disable-next-line no-restricted-syntax
  for (const { id, companyId } of due) {
    try {
      const ticket = await ShowTicketService(id, companyId);

      await ticket.update({ snoozedUntil: null });
      websocketUpdateTicket(ticket);
    } catch (error) {
      logger.warn(
        { ticketId: id, message: error?.message },
        "WakeSnoozedTickets: não consegui trazer a conversa de volta"
      );
    }
  }
};

export default SnoozeTicketService;
