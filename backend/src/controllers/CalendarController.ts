import { Request, Response } from "express";
import { Op, Sequelize } from "sequelize";
import AppError from "../errors/AppError";
import CalendarEvent from "../models/CalendarEvent";
import Chat from "../models/Chat";
import ChatUser from "../models/ChatUser";
import Contact from "../models/Contact";
import User from "../models/User";
import { getIO } from "../libs/socket";

/**
 * Agenda da equipe: eventos, ligações do chat interno e lembretes.
 *
 * Cada pessoa vê o que criou e aquilo para que foi convidada. Só quem criou
 * (ou um administrador) altera ou exclui. As mudanças chegam na hora para
 * o dono e os convidados.
 */
const TYPES = ["event", "call", "reminder"];
const REMINDERS = [null, 0, 5, 10, 15, 30, 60, 120, 1440];

const include = [
  { model: User, as: "user", attributes: ["id", "name", "profileImage"] },
  { model: Chat, as: "chat", attributes: ["id", "uuid", "title", "kind"] },
  { model: Contact, as: "contact", attributes: ["id", "name", "number"] }
];

const visibleTo = (userId: number) => ({
  [Op.or]: [
    { userId },
    Sequelize.literal(
      `"CalendarEvent"."participantIds" @> '[${Number(userId)}]'`
    )
  ]
});

const notify = (event: CalendarEvent, action: string) => {
  const io = getIO();
  const people = new Set<number>([
    event.userId,
    ...((event.participantIds || []) as number[])
  ]);
  people.forEach(id => {
    if (!id) return;
    io.to(`user-${id}`).emit(`company-${event.companyId}-calendar`, {
      action,
      event: action === "delete" ? { id: event.id } : event
    });
  });
};

// valida e normaliza o que veio do formulário
const readBody = async (
  body: Record<string, unknown>,
  companyId: number,
  userId: number
) => {
  const type = TYPES.includes(String(body.type)) ? String(body.type) : "event";
  const title = String(body.title || "")
    .trim()
    .slice(0, 200);
  if (!title) throw new AppError("ERR_CALENDAR_TITLE", 400);

  const allDay = !!body.allDay;
  const startAt = new Date(String(body.startAt || ""));
  let endAt = new Date(String(body.endAt || body.startAt || ""));
  if (Number.isNaN(startAt.getTime())) {
    throw new AppError("ERR_CALENDAR_DATE", 400);
  }
  if (Number.isNaN(endAt.getTime()) || endAt < startAt) {
    endAt = new Date(
      startAt.getTime() + (type === "reminder" ? 0 : 30 * 60000)
    );
  }

  // convidados: só gente da mesma empresa (e sem repetir o dono)
  const ids = Array.isArray(body.participantIds)
    ? [...new Set(body.participantIds.map(Number).filter(Boolean))]
    : [];
  const users = ids.length
    ? await User.findAll({
        where: { id: ids, companyId },
        attributes: ["id"]
      })
    : [];
  const participantIds = users.map(u => u.id).filter(id => id !== userId);

  // ligação: a sala precisa ser da empresa e ter o dono como membro
  let chatId: number | null = null;
  if (body.chatId) {
    const chat = await Chat.findOne({
      where: { id: Number(body.chatId), companyId },
      attributes: ["id"]
    });
    const member =
      chat &&
      (await ChatUser.count({ where: { chatId: chat.id, userId } })) > 0;
    if (!chat || !member) throw new AppError("ERR_CALENDAR_CHAT", 400);
    chatId = chat.id;
  }

  let contactId: number | null = null;
  if (body.contactId) {
    const contact = await Contact.findOne({
      where: { id: Number(body.contactId), companyId },
      attributes: ["id"]
    });
    contactId = contact ? contact.id : null;
  }

  const remind =
    body.remindMinutes === null || body.remindMinutes === ""
      ? null
      : Number(body.remindMinutes);

  return {
    type,
    title,
    description: String(body.description || "").slice(0, 4000) || null,
    startAt,
    endAt,
    allDay,
    color: /^#[0-9a-f]{6}$/i.test(String(body.color || ""))
      ? String(body.color)
      : null,
    chatId,
    contactId,
    participantIds,
    remindMinutes: REMINDERS.includes(remind) ? remind : 10
  };
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { companyId, id: userId } = req.user;
  const start = new Date(String(req.query.start || ""));
  const end = new Date(String(req.query.end || ""));
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new AppError("ERR_CALENDAR_DATE", 400);
  }
  const events = await CalendarEvent.findAll({
    where: {
      companyId,
      startAt: { [Op.lt]: end },
      endAt: { [Op.gte]: start },
      ...visibleTo(Number(userId))
    },
    include,
    order: [["startAt", "ASC"]],
    limit: 2000
  });
  return res.json(events);
};

const findEditable = async (req: Request) => {
  const { companyId, id: userId, profile } = req.user;
  const event = await CalendarEvent.findOne({
    where: { id: Number(req.params.eventId), companyId }
  });
  if (!event) throw new AppError("ERR_NOT_FOUND", 404);
  if (event.userId !== Number(userId) && profile !== "admin") {
    throw new AppError("ERR_FORBIDDEN", 403);
  }
  return event;
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { companyId, id } = req.user;
  const userId = Number(id);
  const data = await readBody(req.body || {}, companyId, userId);
  const created = await CalendarEvent.create({
    ...data,
    companyId,
    userId
  } as CalendarEvent);
  const event = await CalendarEvent.findByPk(created.id, { include });
  notify(event, "create");
  return res.status(201).json(event);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;
  const event = await findEditable(req);
  const data = await readBody(req.body || {}, companyId, event.userId);
  const before = new Set<number>(event.participantIds || []);
  // mudou o horário: o lembrete vale de novo
  const moved = new Date(data.startAt).getTime() !== event.startAt.getTime();
  await event.update({ ...data, ...(moved ? { remindedAt: null } : {}) });
  await event.reload({ include });
  notify(event, "update");
  // quem saiu da lista de convidados some com o evento
  before.forEach(pid => {
    if (!(event.participantIds || []).includes(pid)) {
      getIO()
        .to(`user-${pid}`)
        .emit(`company-${companyId}-calendar`, {
          action: "delete",
          event: { id: event.id }
        });
    }
  });
  return res.json(event);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const event = await findEditable(req);
  await event.destroy();
  notify(event, "delete");
  return res.json({ ok: true });
};
