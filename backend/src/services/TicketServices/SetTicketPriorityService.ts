import AppError from "../../errors/AppError";
import CheckTicketAccess from "../../helpers/CheckTicketAccess";
import Ticket from "../../models/Ticket";
import ShowTicketService from "./ShowTicketService";
import { websocketUpdateTicket } from "./UpdateTicketService";

// 0 nenhuma, 1 baixa, 2 média, 3 alta, 4 urgente
const MAX_PRIORITY = 4;

interface Request {
  ticketId: string | number;
  companyId: number;
  user: { id: number; profile: string };
  priority: unknown;
}

const SetTicketPriorityService = async ({
  ticketId,
  companyId,
  user,
  priority
}: Request): Promise<Ticket> => {
  const level = Number(priority);
  if (!Number.isInteger(level) || level < 0 || level > MAX_PRIORITY) {
    throw new AppError("ERR_INVALID_PRIORITY", 400);
  }

  const ticket = await ShowTicketService(ticketId, companyId);
  CheckTicketAccess(user, ticket);

  // mudar a prioridade não é atividade na conversa: ela não sobe na lista
  await ticket.update({ priority: level }, { silent: true });
  websocketUpdateTicket(ticket);

  return ticket;
};

export default SetTicketPriorityService;
