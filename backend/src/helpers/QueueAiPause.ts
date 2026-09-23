import { cacheLayer } from "../libs/cache";

/**
 * Silêncio da IA num atendimento.
 *
 * A IA se cala quando passa a vez para a equipe (o cliente pediu uma pessoa,
 * ou caiu na regra de transferência da fila). Fica aqui, e não dentro do
 * agente, porque quem move o atendimento (UpdateTicketService) precisa
 * desfazer esse silêncio — e importar o agente de volta fecharia um ciclo.
 *
 * O silêncio acaba quando o atendimento muda de fila: fila nova, assistente
 * novo, conversa recomeça. Enquanto continuar na mesma fila, a IA respeita o
 * pedido do cliente e não volta a falar por cima da equipe.
 */
const PAUSE_DAYS = 7;

const pausedKey = (ticketId: number) => `ai:paused:${ticketId}`;

export const pauseQueueAi = (ticketId: number) =>
  cacheLayer.set(pausedKey(ticketId), "1", "EX", PAUSE_DAYS * 24 * 3600);

export const resumeQueueAi = (ticketId: number) =>
  cacheLayer.del(pausedKey(ticketId));

export const isQueueAiPaused = async (ticketId: number): Promise<boolean> =>
  !!(await cacheLayer.get(pausedKey(ticketId)));
