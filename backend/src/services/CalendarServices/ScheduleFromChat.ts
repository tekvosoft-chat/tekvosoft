import { DateTime } from "luxon";
import CalendarEvent from "../../models/CalendarEvent";
import Ticket from "../../models/Ticket";
import User from "../../models/User";
import { getIO } from "../../libs/socket";
import { logger } from "../../utils/logger";

/**
 * Marca um compromisso na agenda do app a partir de uma conversa.
 *
 * Serve para quando a IA combina um horário com o cliente: em vez de só
 * escrever "combinado, terça às 10h", o compromisso passa a existir de fato
 * na Agenda, ligado ao contato, com lembrete — a equipe vê e é avisada.
 *
 * A data chega como o modelo escreveu ("2026-09-24T10:00", "2026-09-24 10:00").
 * Ela é lida no fuso da operação, nunca em UTC, senão a reunião das 10h
 * apareceria às 7h na tela de quem marcou.
 */
const ZONE = process.env.TZ || "America/Sao_Paulo";
const MAX_DAYS_AHEAD = 365;

export type ScheduleFromChatResult =
  | { ok: true; event: CalendarEvent; whenLabel: string }
  | { ok: false; reason: string };

export const parseWhen = (value: string): DateTime | null => {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const tries = [
    () => DateTime.fromISO(raw, { zone: ZONE }),
    () => DateTime.fromFormat(raw, "yyyy-MM-dd HH:mm", { zone: ZONE }),
    () => DateTime.fromFormat(raw, "dd/MM/yyyy HH:mm", { zone: ZONE })
  ];
  // eslint-disable-next-line no-restricted-syntax
  for (const attempt of tries) {
    const parsed = attempt();
    if (parsed.isValid) return parsed;
  }
  return null;
};

const scheduleFromChat = async ({
  ticket,
  title,
  when,
  minutes = 60,
  note
}: {
  ticket: Ticket;
  title: string;
  when: string;
  minutes?: number;
  note?: string;
}): Promise<ScheduleFromChatResult> => {
  const start = parseWhen(when);
  if (!start) return { ok: false, reason: "data não entendida" };

  const now = DateTime.now().setZone(ZONE);
  if (start < now.minus({ minutes: 5 })) {
    return { ok: false, reason: "data no passado" };
  }
  if (start > now.plus({ days: MAX_DAYS_AHEAD })) {
    return { ok: false, reason: "data muito distante" };
  }

  const duration = Math.min(Math.max(Number(minutes) || 60, 15), 8 * 60);

  // dono do compromisso: quem atende, ou o primeiro administrador da empresa
  let ownerId = ticket.userId;
  if (!ownerId) {
    const admin = await User.findOne({
      where: { companyId: ticket.companyId, profile: "admin" },
      order: [["id", "ASC"]],
      attributes: ["id"]
    });
    ownerId = admin?.id;
  }
  if (!ownerId) return { ok: false, reason: "sem usuário para receber" };

  const event = await CalendarEvent.create({
    companyId: ticket.companyId,
    userId: ownerId,
    type: "event",
    title:
      String(title || "")
        .trim()
        .slice(0, 200) || "Compromisso",
    description: [note, `Combinado no atendimento #${ticket.id}.`]
      .filter(Boolean)
      .join("\n")
      .slice(0, 2000),
    startAt: start.toJSDate(),
    endAt: start.plus({ minutes: duration }).toJSDate(),
    allDay: false,
    color: "#3F51B5",
    contactId: ticket.contactId,
    participantIds: [],
    remindMinutes: 30
  } as never);

  try {
    getIO().to(`user-${ownerId}`).emit(`company-${ticket.companyId}-calendar`, {
      action: "create",
      event
    });
  } catch (error) {
    logger.warn(
      { eventId: event.id, error: error?.message },
      "ScheduleFromChat: não consegui avisar a tela da agenda"
    );
  }

  const whenLabel = start
    .setLocale("pt-BR")
    .toFormat("cccc, d 'de' LLLL 'às' HH:mm");
  logger.info(
    { eventId: event.id, ticketId: ticket.id, start: event.startAt },
    "Compromisso marcado a partir da conversa"
  );
  return { ok: true, event, whenLabel };
};

export default scheduleFromChat;
