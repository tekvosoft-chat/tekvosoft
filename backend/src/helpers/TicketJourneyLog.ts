import TicketJourney from "../models/TicketJourney";
import { logger } from "../utils/logger";

/**
 * Anota um passo do atendimento (fila, coluna, responsável, situação).
 * Nunca derruba quem chamou: é registro, não regra de negócio.
 */
export const logTicketJourney = async (entry: {
  ticketId: number;
  companyId: number;
  kind: "queue" | "tag" | "user" | "status" | "ai";
  from?: string | null;
  to?: string | null;
  byAi?: boolean;
  userId?: number | null;
}): Promise<void> => {
  try {
    await TicketJourney.create({
      ticketId: entry.ticketId,
      companyId: entry.companyId,
      kind: entry.kind,
      fromValue: entry.from ? String(entry.from).slice(0, 120) : null,
      toValue: entry.to ? String(entry.to).slice(0, 120) : null,
      byAi: !!entry.byAi,
      userId: entry.userId || null
    } as TicketJourney);
  } catch (error) {
    logger.warn(
      { ticketId: entry.ticketId, message: error?.message },
      "não consegui anotar o passo do atendimento"
    );
  }
};
