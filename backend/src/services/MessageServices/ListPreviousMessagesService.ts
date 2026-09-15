import { FindOptions, Op } from "sequelize";
import AppError from "../../errors/AppError";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import Queue from "../../models/Queue";
import ShowTicketService from "../TicketServices/ShowTicketService";
import { GetCompanySetting } from "../../helpers/CheckSettings";

/**
 * Histórico do contato: mensagens dos atendimentos ANTERIORES dele.
 *
 * Quando um atendimento novo começa, a conversa abre vazia; daqui a tela
 * busca o que foi falado antes, em páginas, do mais recente para trás.
 * Segue a mesma regra de visibilidade por fila da listagem normal.
 */
interface Request {
  ticketId: string;
  companyId: number;
  queues?: number[];
  before?: string;
  peek?: boolean;
}

interface Response {
  messages: Message[];
  hasMore: boolean;
  nextBefore: string | null;
  tickets: number;
}

const LIMIT = 60;

const ListPreviousMessagesService = async ({
  ticketId,
  companyId,
  queues = [],
  before,
  peek
}: Request): Promise<Response> => {
  const ticket = await ShowTicketService(ticketId, companyId);
  if (!ticket) {
    throw new AppError("ERR_NO_TICKET_FOUND", 404);
  }

  const previous = await Ticket.findAll({
    where: {
      companyId,
      contactId: ticket.contactId,
      id: { [Op.ne]: ticket.id }
    },
    attributes: ["id"]
  });
  const ticketIds = previous.map(item => item.id);

  if (!ticketIds.length || peek) {
    return {
      messages: [],
      hasMore: false,
      nextBefore: null,
      tickets: ticketIds.length
    };
  }

  const where: FindOptions["where"] = {
    companyId,
    ticketId: { [Op.in]: ticketIds },
    mediaType: {
      [Op.or]: {
        [Op.ne]: "reactionMessage",
        [Op.is]: null
      }
    }
  };

  if (
    queues.length > 0 &&
    (await GetCompanySetting(companyId, "messageVisibility", "message")) ===
      "message"
  ) {
    where["queueId"] = {
      [Op.or]: {
        [Op.in]: queues,
        [Op.eq]: null
      }
    };
  }

  if (before) {
    const date = new Date(before);
    if (Number.isNaN(date.getTime())) {
      throw new AppError("ERR_INVALID_DATE", 400);
    }
    where["createdAt"] = { [Op.lt]: date };
  }

  const messages = await Message.findAll({
    where,
    limit: LIMIT + 1,
    include: [
      "contact",
      {
        model: Message,
        as: "quotedMsg",
        include: ["contact"],
        where: { companyId },
        required: false
      },
      {
        model: Message,
        as: "replies",
        include: ["contact"],
        required: false
      },
      { model: Queue, as: "queue" }
    ],
    order: [["createdAt", "DESC"]]
  });

  const hasMore = messages.length > LIMIT;
  const visible = hasMore ? messages.slice(0, LIMIT) : messages;
  const oldest = visible[visible.length - 1];

  return {
    messages: visible.reverse(),
    hasMore,
    nextBefore: hasMore && oldest ? oldest.createdAt.toISOString() : null,
    tickets: ticketIds.length
  };
};

export default ListPreviousMessagesService;
