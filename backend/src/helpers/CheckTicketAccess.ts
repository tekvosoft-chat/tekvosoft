import AppError from "../errors/AppError";
import Ticket from "../models/Ticket";

interface Actor {
  id: number;
  profile: string;
}

/**
 * Quem pode mexer num atendimento: o admin sempre; os outros, só nos que
 * estão aguardando ou que são deles.
 */
const CheckTicketAccess = (user: Actor, ticket: Ticket): void => {
  if (
    user.profile !== "admin" &&
    ticket.status !== "pending" &&
    ticket.userId !== user.id
  ) {
    throw new AppError("ERR_FORBIDDEN", 403);
  }
};

export default CheckTicketAccess;
