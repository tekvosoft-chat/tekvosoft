import AppError from "../../errors/AppError";
import CheckContactOpenTickets from "../../helpers/CheckContactOpenTickets";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import Ticket from "../../models/Ticket";
import ShowContactService from "../ContactServices/ShowContactService";
import { getIO } from "../../libs/socket";
import FindOrCreateATicketTrakingService from "./FindOrCreateATicketTrakingService";
import Contact from "../../models/Contact";
import Whatsapp from "../../models/Whatsapp";
import { incrementCounter } from "../CounterServices/IncrementCounter";

interface Request {
  contactId: number;
  userId: number;
  companyId: number;
  queueId?: number;
  // caixa de entrada escolhida no "nova conversa"; sem ela, a padrão
  whatsappId?: number;
}

const CreateTicketService = async ({
  contactId,
  userId,
  queueId,
  companyId,
  whatsappId
}: Request): Promise<Ticket> => {
  let defaultWhatsapp: Whatsapp;
  if (whatsappId) {
    defaultWhatsapp = await Whatsapp.findByPk(whatsappId);
    // só dá para começar conversa por WhatsApp conectado da própria empresa
    if (
      !defaultWhatsapp ||
      defaultWhatsapp.companyId !== companyId ||
      (defaultWhatsapp.channel || "whatsapp") !== "whatsapp" ||
      defaultWhatsapp.status !== "CONNECTED"
    ) {
      throw new AppError("ERR_INBOX_UNAVAILABLE");
    }
  } else {
    defaultWhatsapp = await GetDefaultWhatsApp(companyId);
  }

  let ticket = await CheckContactOpenTickets(
    contactId,
    defaultWhatsapp.id,
    true
  );

  const include = [
    {
      model: Contact,
      as: "contact",
      include: ["tags", "extraInfo"]
    },
    "queue",
    "whatsapp",
    "user",
    "tags"
  ];

  if (ticket) {
    if (ticket.status === "open" && ticket.userId === userId) {
      await ticket.reload({
        include
      });
      return ticket;
    }
    throw new AppError("ERR_OTHER_OPEN_TICKET");
  }

  const { isGroup } = await ShowContactService(contactId, companyId);

  ticket = await Ticket.create({
    contactId,
    companyId,
    queueId,
    whatsappId: defaultWhatsapp.id,
    status: "open",
    isGroup,
    userId
  });

  if (!ticket) {
    throw new AppError("ERR_CREATING_TICKET");
  }

  await FindOrCreateATicketTrakingService({
    ticketId: ticket.id,
    companyId: ticket.companyId,
    whatsappId: ticket.whatsappId,
    userId: ticket.userId
  });

  incrementCounter(ticket.companyId, "ticket-create");

  await ticket.reload({
    include
  });

  const io = getIO();

  io.to(ticket.id.toString()).emit("ticket", {
    action: "update",
    ticket
  });

  return ticket;
};

export default CreateTicketService;
