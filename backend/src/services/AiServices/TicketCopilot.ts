import OpenAI from "openai";
import { Op } from "sequelize";
import Ticket from "../../models/Ticket";
import Message from "../../models/Message";
import Queue from "../../models/Queue";
import Tag from "../../models/Tag";
import Contact from "../../models/Contact";
import Company from "../../models/Company";
import { GetCompanySetting } from "../../helpers/CheckSettings";
import { cacheLayer } from "../../libs/cache";
import { logger } from "../../utils/logger";
import AppError from "../../errors/AppError";

/**
 * Copiloto do atendente (usa a mesma chave do "Assistente de IA das filas").
 *
 * Lê a conversa e devolve, num pedido só: assunto, resumo, clima, próximo
 * passo, três sugestões de resposta e para qual fila e coluna do Kanban o
 * atendimento deveria ir. Quem decide continua sendo a pessoa: o sistema só
 * sugere, e mover é um clique.
 *
 * Economia de tokens (é o gasto do cliente):
 *  - modelo pequeno (gpt-4o-mini por padrão) e resposta em JSON curta;
 *  - só as últimas mensagens, cada uma cortada em 240 caracteres;
 *  - resultado guardado no Redis por conversa até chegar mensagem nova, e
 *    o resumo do contato por 24 horas.
 */
const PROVIDERS: Record<string, { baseURL: string; model: string }> = {
  openai: { baseURL: "https://api.openai.com/v1", model: "gpt-4o-mini" },
  groq: {
    baseURL: "https://api.groq.com/openai/v1",
    model: "llama-3.3-70b-versatile"
  },
  gemini: {
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    model: "gemini-2.0-flash"
  }
};

const HISTORY = 16;
const CHARS = 240;

type Analysis = {
  subject: string;
  summary: string;
  sentiment: "good" | "neutral" | "bad";
  sentimentReason: string;
  nextStep: string;
  replies: string[];
  queueId: number | null;
  queueName?: string;
  tagId: number | null;
  tagName?: string;
  at: number;
};

const clientOf = async (companyId: number) => {
  const apiKey = await GetCompanySetting(companyId, "aiAgentApiKey", "");
  if (!apiKey) throw new AppError("ERR_AI_NOT_CONFIGURED", 400);
  const providerName = await GetCompanySetting(
    companyId,
    "aiAgentProvider",
    "openai"
  );
  const provider = PROVIDERS[providerName] || PROVIDERS.openai;
  const model =
    (await GetCompanySetting(companyId, "aiAgentModel", "")) || provider.model;
  return {
    client: new OpenAI({ apiKey, baseURL: provider.baseURL }),
    model
  };
};

const ask = async (
  companyId: number,
  system: string,
  user: string,
  maxTokens = 500
): Promise<Record<string, unknown>> => {
  const { client, model } = await clientOf(companyId);
  const completion = await client.chat.completions.create({
    model,
    temperature: 0.3,
    max_tokens: maxTokens,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user }
    ]
  });
  const raw = completion.choices?.[0]?.message?.content || "{}";
  try {
    return JSON.parse(raw);
  } catch {
    logger.warn({ companyId, raw }, "TicketCopilot: resposta fora do formato");
    return {};
  }
};

const transcript = async (ticketId: number) => {
  const messages = await Message.findAll({
    where: {
      ticketId,
      isDeleted: { [Op.not]: true },
      body: { [Op.ne]: "" }
    },
    order: [["createdAt", "DESC"]],
    limit: HISTORY,
    attributes: ["body", "fromMe", "mediaType"]
  });
  return messages
    .reverse()
    .map(m => {
      const who = m.fromMe ? "Atendente" : "Cliente";
      const body =
        m.mediaType && m.mediaType !== "chat" && !m.body
          ? `[${m.mediaType}]`
          : String(m.body || "").slice(0, CHARS);
      return `${who}: ${body}`;
    })
    .join("\n");
};

const listOf = async (companyId: number) => {
  const [queues, tags] = await Promise.all([
    Queue.findAll({
      where: { companyId },
      attributes: ["id", "name"],
      order: [["name", "ASC"]]
    }),
    Tag.findAll({
      where: { companyId, kanban: 1 },
      attributes: ["id", "name"],
      order: [["name", "ASC"]]
    })
  ]);
  return { queues, tags };
};

const cacheKey = (ticketId: number, stamp: string) =>
  `ai:copilot:${ticketId}:${stamp}`;

/** Análise da conversa aberta (com cache até chegar mensagem nova). */
export const analyzeTicket = async (
  ticket: Ticket,
  force = false
): Promise<Analysis> => {
  const last = await Message.findOne({
    where: { ticketId: ticket.id },
    order: [["createdAt", "DESC"]],
    attributes: ["id"]
  });
  const key = cacheKey(ticket.id, last?.id || "novo");
  if (!force) {
    const cached = await cacheLayer.get(key);
    if (cached) return JSON.parse(cached);
  }

  const { queues, tags } = await listOf(ticket.companyId);
  const company = await Company.findByPk(ticket.companyId, {
    attributes: ["name"]
  });
  const lines = await transcript(ticket.id);
  if (!lines) throw new AppError("ERR_AI_NO_MESSAGES", 400);

  const system = [
    "Você ajuda um atendente de WhatsApp de uma empresa brasileira.",
    "Leia a conversa e responda SOMENTE em JSON, em português do Brasil, com as chaves:",
    '{"subject":"assunto em até 5 palavras","summary":"resumo em até 2 frases",',
    '"sentiment":"good|neutral|bad","sentimentReason":"até 8 palavras",',
    '"nextStep":"o que o atendente deve fazer agora, até 15 palavras",',
    '"replies":["3 respostas prontas, curtas, tom do atendente, até 220 caracteres cada"],',
    '"queueId":número ou null,"tagId":número ou null}',
    "queueId: a fila mais adequada da lista. tagId: a coluna do Kanban mais adequada.",
    "Use null quando nenhuma servir. Nunca invente preços, prazos ou dados."
  ].join(" ");

  const user = [
    `Empresa: ${company?.name || ""}`,
    `Cliente: ${ticket.contact?.name || ""}`,
    `Filas: ${queues.map(q => `${q.id}=${q.name}`).join(", ") || "nenhuma"}`,
    `Colunas do Kanban: ${tags.map(t => `${t.id}=${t.name}`).join(", ") || "nenhuma"}`,
    "",
    "Conversa (mais antiga primeiro):",
    lines
  ].join("\n");

  const data = await ask(ticket.companyId, system, user);
  const queueId = Number(data.queueId) || null;
  const tagId = Number(data.tagId) || null;
  const analysis: Analysis = {
    subject: String(data.subject || "").slice(0, 60),
    summary: String(data.summary || "").slice(0, 400),
    sentiment: ["good", "neutral", "bad"].includes(String(data.sentiment))
      ? (data.sentiment as Analysis["sentiment"])
      : "neutral",
    sentimentReason: String(data.sentimentReason || "").slice(0, 80),
    nextStep: String(data.nextStep || "").slice(0, 160),
    replies: (Array.isArray(data.replies) ? data.replies : [])
      .slice(0, 3)
      .map(r => String(r).slice(0, 400)),
    queueId: queues.some(q => q.id === queueId) ? queueId : null,
    queueName: queues.find(q => q.id === queueId)?.name,
    tagId: tags.some(t => t.id === tagId) ? tagId : null,
    tagName: tags.find(t => t.id === tagId)?.name,
    at: Date.now()
  };

  await cacheLayer.set(key, JSON.stringify(analysis), "EX", 12 * 3600);
  return analysis;
};

/** Resumo do contato para a ficha dele (cache de 24 horas). */
export const analyzeContact = async (
  contact: Contact,
  force = false
): Promise<Record<string, unknown>> => {
  const key = `ai:contact:${contact.id}`;
  if (!force) {
    const cached = await cacheLayer.get(key);
    if (cached) return JSON.parse(cached);
  }

  const tickets = await Ticket.findAll({
    where: { contactId: contact.id, companyId: contact.companyId },
    order: [["updatedAt", "DESC"]],
    limit: 3,
    attributes: ["id"]
  });
  if (!tickets.length) throw new AppError("ERR_AI_NO_MESSAGES", 400);

  const parts = await Promise.all(tickets.map(t => transcript(t.id)));
  const lines = parts.filter(Boolean).join("\n---\n").slice(0, 6000);
  if (!lines) throw new AppError("ERR_AI_NO_MESSAGES", 400);

  const system = [
    "Você resume o histórico de um cliente no WhatsApp de uma empresa.",
    "Responda SOMENTE em JSON, em português do Brasil:",
    '{"about":"sobre o que o cliente fala com a empresa, até 2 frases",',
    '"sentiment":"good|neutral|bad","sentimentReason":"até 8 palavras",',
    '"topics":["até 4 assuntos, 2 palavras cada"],"alert":"algo que a equipe precisa saber, ou vazio"}'
  ].join(" ");

  const data = await ask(
    contact.companyId,
    system,
    `Cliente: ${contact.name}\n\nConversas (mais recentes):\n${lines}`,
    350
  );
  const result = {
    about: String(data.about || "").slice(0, 400),
    sentiment: ["good", "neutral", "bad"].includes(String(data.sentiment))
      ? data.sentiment
      : "neutral",
    sentimentReason: String(data.sentimentReason || "").slice(0, 80),
    topics: (Array.isArray(data.topics) ? data.topics : [])
      .slice(0, 4)
      .map(t => String(t).slice(0, 30)),
    alert: String(data.alert || "").slice(0, 160),
    at: Date.now()
  };
  await cacheLayer.set(key, JSON.stringify(result), "EX", 24 * 3600);
  return result;
};

/** Sugestões de filas para quem está montando o atendimento do zero. */
export const suggestQueues = async (
  companyId: number,
  about: string
): Promise<Record<string, unknown>[]> => {
  const company = await Company.findByPk(companyId, { attributes: ["name"] });
  const existing = await Queue.findAll({
    where: { companyId },
    attributes: ["name"]
  });

  const system = [
    "Você organiza o atendimento por WhatsApp de empresas brasileiras.",
    'Responda SOMENTE em JSON: {"queues":[{"name":"até 20 caracteres",',
    '"color":"#RRGGBB","greetingMessage":"saudação curta da fila",',
    '"about":"o que essa fila resolve, 1 frase","instructions":"2 instruções para a IA dessa fila"}]}',
    "De 4 a 6 filas, sem repetir as que já existem, cores diferentes entre si."
  ].join(" ");

  const data = await ask(
    companyId,
    system,
    [
      `Empresa: ${company?.name || ""}`,
      `Negócio: ${String(about || "").slice(0, 400) || "não informado"}`,
      `Filas que já existem: ${existing.map(q => q.name).join(", ") || "nenhuma"}`
    ].join("\n"),
    700
  );

  const list = Array.isArray(data.queues) ? data.queues : [];
  return list.slice(0, 6).map((queue: Record<string, unknown>) => ({
    name: String(queue.name || "").slice(0, 30),
    color: /^#[0-9a-f]{6}$/i.test(String(queue.color))
      ? String(queue.color)
      : "#5C59E8",
    greetingMessage: String(queue.greetingMessage || "").slice(0, 400),
    about: String(queue.about || "").slice(0, 300),
    instructions: String(queue.instructions || "").slice(0, 500)
  }));
};
