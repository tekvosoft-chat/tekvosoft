import api from "../services/api";

/**
 * Memória das conversas abertas nesta aba, para abrir na hora.
 *
 * - O atendimento vem da própria lista (já está carregado quando a pessoa
 *   toca): o cabeçalho aparece sem esperar o servidor.
 * - As últimas mensagens de cada conversa ficam guardadas; ao voltar nela,
 *   aparecem de imediato e a versão do servidor chega por cima.
 * - Ao encostar o dedo no item da lista, a busca das mensagens já começa
 *   (sem marcar como lidas) — quando a tela abre, elas geralmente já estão.
 *
 * Nada vai para o disco; sair da conta limpa tudo.
 */
const MAX_CONVERSATIONS = 40;
const MAX_MESSAGES = 80;

const tickets = new Map();
const messages = new Map();
const inflight = new Map();

export const rememberTicket = ticket => {
  if (ticket?.uuid) tickets.set(String(ticket.uuid), ticket);
};

export const cachedTicket = uuid => tickets.get(String(uuid));

export const rememberMessages = (ticketId, list) => {
  if (!ticketId || !Array.isArray(list) || list.length === 0) return;
  messages.delete(ticketId);
  messages.set(ticketId, list.slice(-MAX_MESSAGES));
  if (messages.size > MAX_CONVERSATIONS) {
    messages.delete(messages.keys().next().value);
  }
};

export const cachedMessages = ticketId => messages.get(ticketId);

export const prefetchMessages = ticketId => {
  if (!ticketId || messages.has(ticketId) || inflight.has(ticketId)) return;
  const request = api
    .get(`/messages/${ticketId}`, { params: { markAsRead: false } })
    .then(({ data }) => rememberMessages(ticketId, data?.messages))
    .catch(() => {})
    .finally(() => inflight.delete(ticketId));
  inflight.set(ticketId, request);
};

export const clearConversationCache = () => {
  tickets.clear();
  messages.clear();
  inflight.clear();
};
