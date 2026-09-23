import OpenAI from "openai";
import { Op } from "sequelize";
import Ticket from "../../models/Ticket";
import Queue from "../../models/Queue";
import Message from "../../models/Message";
import Company from "../../models/Company";
import { GetCompanySetting } from "../../helpers/CheckSettings";
import { logger } from "../../utils/logger";
import { parseAiConfig } from "./QueueAiAgent";

/**
 * Recepção inteligente: quem chega é recebido pela IA e já cai na fila certa.
 *
 * No lugar do menu numerado ("[1] Comercial, [2] Suporte..."), a pessoa
 * escreve o que precisa com as próprias palavras e a IA escolhe a fila lendo
 * a descrição de cada uma. Quando não dá para decidir, ela faz UMA pergunta
 * curta e espera a resposta — só transfere quando tem certeza.
 *
 * Liga e desliga em Filas & Chatbot (ajuste "smartReception" da empresa).
 * Enquanto está desligada, nada aqui roda e o menu de sempre continua valendo.
 *
 * Gasto: um pedido pequeno por mensagem, e só enquanto o atendimento ainda
 * não tem fila. Assim que transfere, a recepção sai de cena.
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

const HISTORY = 10;
const CHARS = 400;

export type ReceptionResult = {
  queueId: number | null;
  message: string;
};

/** A recepção está ligada para esta empresa? */
export const smartReceptionEnabled = async (
  companyId: number
): Promise<boolean> =>
  (await GetCompanySetting(companyId, "smartReception", "disabled")) ===
  "enabled";

/** O que a IA lê de cada fila: a descrição, ou o "sobre" do assistente. */
const queueLine = (queue: Queue): string => {
  const about =
    queue.description?.trim() ||
    parseAiConfig(queue.aiConfig).about?.trim() ||
    "";
  return `${queue.id} = ${queue.name}${about ? `: ${about}` : ""}`;
};

const transcript = async (ticketId: number): Promise<string> => {
  const messages = await Message.findAll({
    where: {
      ticketId,
      isDeleted: { [Op.not]: true },
      isPrivate: { [Op.not]: true },
      body: { [Op.ne]: "" }
    },
    order: [["createdAt", "DESC"]],
    limit: HISTORY,
    attributes: ["body", "fromMe"]
  });
  return messages
    .reverse()
    .map(
      message =>
        `${message.fromMe ? "Recepção" : "Cliente"}: ${String(
          message.body || ""
        ).slice(0, CHARS)}`
    )
    .join("\n");
};

/**
 * Decide a fila a partir da conversa. Devolve null em queueId quando ainda
 * falta informação — aí a mensagem é a pergunta que falta fazer.
 */
export const decideQueue = async (
  ticket: Ticket,
  queues: Queue[],
  incoming: string
): Promise<ReceptionResult | null> => {
  const apiKey = await GetCompanySetting(ticket.companyId, "aiAgentApiKey", "");
  if (!apiKey || !queues.length) return null;

  const providerName = await GetCompanySetting(
    ticket.companyId,
    "aiAgentProvider",
    "openai"
  );
  const provider = PROVIDERS[providerName] || PROVIDERS.openai;
  const model =
    (await GetCompanySetting(ticket.companyId, "aiAgentModel", "")) ||
    provider.model;

  const company = await Company.findByPk(ticket.companyId, {
    attributes: ["name"]
  });
  const lines = await transcript(ticket.id);
  const greeting = await GetCompanySetting(
    ticket.companyId,
    "smartReceptionGreeting",
    ""
  );

  const system = [
    `Você é a recepção do WhatsApp da empresa "${company?.name || ""}".`,
    "Seu único trabalho é entender o que a pessoa precisa e escolher a fila certa.",
    "Responda SOMENTE em JSON, em português do Brasil:",
    '{"queueId": número da fila escolhida ou null, "message": "o que dizer agora, 1 ou 2 frases curtas"}',
    "Escolha a fila assim que der para entender o assunto — não faça perguntas demais.",
    "Se ainda não der para decidir, use queueId null e faça UMA pergunta curta.",
    "Ao escolher uma fila, avise em uma frase que está encaminhando, sem prometer prazo.",
    "Nunca invente preços, prazos ou políticas. Nunca cite números de fila para o cliente.",
    greeting ? `Tom e orientações da empresa: ${greeting}` : ""
  ]
    .filter(Boolean)
    .join(" ");

  // a mensagem que acabou de chegar pode ainda não estar gravada: garante que
  // ela esteja no fim da conversa, que é o que mais pesa na decisão
  const last = String(incoming || "").trim();
  const history =
    last && !lines.trimEnd().endsWith(last)
      ? `${lines}${lines ? "\n" : ""}Cliente: ${last.slice(0, CHARS)}`
      : lines;

  const user = [
    `Cliente: ${ticket.contact?.name || "não informado"}`,
    "",
    "Filas disponíveis (id = nome: o que resolve):",
    queues.map(queueLine).join("\n"),
    "",
    "Conversa até agora (a última linha é o que a pessoa acabou de dizer):",
    history || `Cliente: ${last}`
  ].join("\n");

  try {
    const client = new OpenAI({ apiKey, baseURL: provider.baseURL });
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.2,
      max_tokens: 200,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ]
    });
    const raw = completion.choices?.[0]?.message?.content || "{}";
    const data = JSON.parse(raw);
    const queueId = Number(data.queueId) || null;
    return {
      queueId: queues.some(queue => queue.id === queueId) ? queueId : null,
      message: String(data.message || "").slice(0, 600)
    };
  } catch (error) {
    logger.warn(
      { ticketId: ticket.id, error: error?.message },
      "SmartReception: não consegui decidir a fila"
    );
    return null;
  }
};
