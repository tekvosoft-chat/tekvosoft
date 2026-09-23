import { Request, Response } from "express";
import AppError from "../errors/AppError";
import { Op } from "sequelize";
import Contact from "../models/Contact";
import Ticket from "../models/Ticket";
import Queue from "../models/Queue";
import Tag from "../models/Tag";
import User from "../models/User";
import Message from "../models/Message";
import TicketJourney from "../models/TicketJourney";
import { cacheLayer } from "../libs/cache";
import TicketNote from "../models/TicketNote";
import ShowTicketService from "../services/TicketServices/ShowTicketService";
import UpdateTicketService from "../services/TicketServices/UpdateTicketService";
import {
  ticketTagAdd,
  ticketTagRemove
} from "../services/TicketTagServices/TicketTagServices";
import {
  analyzeContact,
  analyzeTicket,
  suggestQueues
} from "../services/AiServices/TicketCopilot";

/** Copiloto de IA: sugere para o atendente e aplica o que ele aceitar. */
export const ticketAnalysis = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;
  const ticket = await ShowTicketService(
    Number(req.params.ticketId),
    companyId
  );
  const analysis = await analyzeTicket(ticket, req.query.force === "true");
  return res.json(analysis);
};

export const applySuggestion = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId, id: userId } = req.user;
  const ticketId = Number(req.params.ticketId);
  const ticket = await ShowTicketService(ticketId, companyId);
  const { queueId, tagId, note } = req.body || {};

  if (queueId) {
    await UpdateTicketService({
      ticketId,
      ticketData: { queueId: Number(queueId) },
      companyId,
      reqUserId: Number(userId),
      journeyByAi: true
    });
  }
  if (tagId) {
    // um card fica numa coluna só: sai das outras antes de entrar na nova,
    // igual ao arrastar no Kanban. O ticket vem com as tags sem o campo
    // "kanban", por isso as colunas são consultadas à parte.
    const columns = await Tag.findAll({
      where: { companyId, kanban: 1 },
      attributes: ["id"]
    });
    const isColumn = new Set(columns.map(column => column.id));
    const leaving = (ticket.tags || []).filter(
      tag => isColumn.has(tag.id) && tag.id !== Number(tagId)
    );
    await Promise.all(
      leaving.map(tag => ticketTagRemove(ticketId, tag.id, companyId))
    );
    if (!(ticket.tags || []).some(tag => tag.id === Number(tagId))) {
      await ticketTagAdd(ticketId, Number(tagId), companyId, true);
    }
  }
  if (note) {
    await TicketNote.create({
      note: String(note).slice(0, 1000),
      userId: Number(userId),
      contactId: ticket.contactId,
      ticketId
    } as TicketNote);
  }

  return res.json({ ok: true });
};

export const contactSummary = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;
  const contact = await Contact.findOne({
    where: { id: Number(req.params.contactId), companyId }
  });
  if (!contact) throw new AppError("ERR_NO_CONTACT_FOUND", 404);
  const summary = await analyzeContact(contact, req.query.force === "true");
  return res.json(summary);
};

export const queueSuggestions = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;
  const queues = await suggestQueues(companyId, String(req.body?.about || ""));
  return res.json(queues);
};

/**
 * Mapa da conversa com um contato: como começou, por onde passou (filas,
 * colunas do Kanban, responsáveis), o que a IA moveu e como está agora.
 * Sai tudo do que já está gravado — não gasta IA.
 */
export const contactJourney = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;
  const contactId = Number(req.params.contactId);
  const contact = await Contact.findOne({
    where: { id: contactId, companyId },
    attributes: ["id", "name", "number", "profilePicUrl"]
  });
  if (!contact) throw new AppError("ERR_NO_CONTACT_FOUND", 404);

  const tickets = await Ticket.findAll({
    where: { contactId, companyId },
    order: [["createdAt", "DESC"]],
    limit: 6,
    attributes: ["id", "uuid", "status", "createdAt", "updatedAt", "queueId"],
    include: [
      { model: Queue, as: "queue", attributes: ["id", "name", "color"] },
      { model: User, as: "user", attributes: ["id", "name"] },
      { model: Tag, as: "tags", attributes: ["id", "name", "color"] }
    ]
  });

  const steps = await TicketJourney.findAll({
    where: { ticketId: tickets.map(t => t.id) },
    order: [["createdAt", "ASC"]],
    include: [{ model: User, as: "user", attributes: ["id", "name"] }]
  });

  const firstMessages = await Promise.all(
    tickets.map(ticket =>
      Message.findOne({
        where: { ticketId: ticket.id, fromMe: false, body: { [Op.ne]: "" } },
        order: [["createdAt", "ASC"]],
        attributes: ["body", "createdAt"]
      })
    )
  );
  const lastMessages = await Promise.all(
    tickets.map(ticket =>
      Message.findOne({
        where: { ticketId: ticket.id, body: { [Op.ne]: "" } },
        order: [["createdAt", "DESC"]],
        attributes: ["body", "fromMe", "createdAt"]
      })
    )
  );

  const summary = await cacheLayer.get(`ai:contact:${contactId}`);

  return res.json({
    contact,
    summary: summary ? JSON.parse(summary) : null,
    tickets: tickets.map((ticket, index) => ({
      id: ticket.id,
      uuid: ticket.uuid,
      status: ticket.status,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      queue: ticket.queue,
      user: ticket.user,
      tags: ticket.tags,
      first: firstMessages[index]
        ? {
            body: String(firstMessages[index].body || "").slice(0, 160),
            at: firstMessages[index].createdAt
          }
        : null,
      last: lastMessages[index]
        ? {
            body: String(lastMessages[index].body || "").slice(0, 160),
            fromMe: lastMessages[index].fromMe,
            at: lastMessages[index].createdAt
          }
        : null,
      steps: steps
        .filter(step => step.ticketId === ticket.id)
        .map(step => ({
          kind: step.kind,
          from: step.fromValue,
          to: step.toValue,
          byAi: step.byAi,
          user: step.user?.name,
          at: step.createdAt
        }))
    }))
  });
};
