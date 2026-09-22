import AppError from "../../errors/AppError";
import { GetCompanySetting } from "../../helpers/CheckSettings";
import Contact from "../../models/Contact";
import ContactTag from "../../models/ContactTag";
import Tag from "../../models/Tag";
import Ticket from "../../models/Ticket";
import TicketTag from "../../models/TicketTag";
import ShowContactService from "../ContactServices/ShowContactService";
import { websocketUpdateContact } from "../ContactServices/UpdateContactService";
import ShowTicketService from "../TicketServices/ShowTicketService";
import { websocketUpdateTicket } from "../TicketServices/UpdateTicketService";

interface Request {
  tags: Tag[];
  ticketId?: number;
  contactId?: number;
  companyId?: number;
}

const SyncTicketTags = async ({
  tags,
  ticketId,
  companyId
}: Request): Promise<Ticket | null> => {
  const ticket = await ShowTicketService(ticketId, companyId);
  const tagsMode = await GetCompanySetting(companyId, "tagsMode", "ticket");

  // só tags da própria empresa (antes gravava qualquer id enviado)
  const ids = (tags || []).map(t => Number(t?.id)).filter(Boolean);
  const valid = ids.length
    ? await Tag.findAll({ where: { id: ids, companyId: ticket.companyId } })
    : [];
  const byId = new Map(valid.map(tag => [tag.id, tag]));
  const chosen = ids.filter(id => byId.has(id));

  if (["ticket", "both"].includes(tagsMode)) {
    const before = await TicketTag.findAll({
      where: { ticketId },
      attributes: ["tagId"]
    });
    const had = new Set(before.map(tt => tt.tagId));
    await TicketTag.destroy({ where: { ticketId } });
    await TicketTag.bulkCreate(chosen.map(tagId => ({ tagId, ticketId })));

    // acrescentou uma coluna do Kanban que tem fila: o atendimento passa para
    // ela, como quando o card é arrastado no Kanban
    const added = chosen
      .filter(id => !had.has(id))
      .map(id => byId.get(id))
      .filter(tag => tag.kanban && tag.queueId);
    const target = added[added.length - 1];
    if (target && ticket.queueId !== target.queueId) {
      await ticket.update({ queueId: target.queueId });
    }
  } else if (tagsMode === "contact") {
    await ContactTag.destroy({ where: { contactId: ticket.contactId } });
    await ContactTag.bulkCreate(
      chosen.map(tagId => ({ tagId, contactId: ticket.contactId }))
    );
  }

  await ticket.reload();
  websocketUpdateTicket(ticket);

  return ticket;
};

const SyncContactTags = async ({
  tags,
  contactId,
  companyId
}: Request): Promise<Contact | null> => {
  const tagsMode = await GetCompanySetting(companyId, "tagsMode", "ticket");

  if (!["contact", "both"].includes(tagsMode)) {
    throw new AppError("ERR_INVALID_TAGMODE", 400);
  }

  const contact = await ShowContactService(contactId);

  const tagList = tags.map(t => ({ tagId: t.id, contactId }));

  await ContactTag.destroy({ where: { contactId } });
  await ContactTag.bulkCreate(tagList);

  await contact.reload();
  websocketUpdateContact(contact);

  return contact;
};

const SyncTags = async (req: Request): Promise<Ticket | Contact> => {
  if (req.ticketId) {
    return SyncTicketTags(req);
  }

  if (req.contactId) {
    return SyncContactTags(req);
  }

  throw new AppError("ERR_NO_TICKET_OR_CONTACT", 400);
};

export default SyncTags;
