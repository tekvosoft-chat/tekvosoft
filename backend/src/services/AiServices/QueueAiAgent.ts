import OpenAI from "openai";
import { Op } from "sequelize";
import Ticket from "../../models/Ticket";
import Queue from "../../models/Queue";
import Message from "../../models/Message";
import Company from "../../models/Company";
import { GetCompanySetting } from "../../helpers/CheckSettings";
import { cacheLayer } from "../../libs/cache";
import { logger } from "../../utils/logger";
import SendWhatsAppMessage from "../WbotServices/SendWhatsAppMessage";

/**
 * Assistente de IA das filas.
 *
 * Configuração em Configurações > Opções (provedor, chave e modelo, uma vez
 * para a empresa) e em cada fila (liga/desliga, nome da IA, sobre a empresa,
 * tom de voz, instruções e quando chamar um humano).
 *
 * Enquanto o atendimento está aguardando e ninguém da equipe aceitou, a IA
 * responde o cliente. O que ela recebe a cada mensagem:
 *  - um roteiro de sistema montado com a configuração da fila;
 *  - nome do cliente, nome da empresa, fila, data e hora atuais;
 *  - as últimas mensagens da conversa (cliente e respostas enviadas).
 * Quando o cliente pede uma pessoa (ou cai na regra de transferência), ela
 * avisa, para de responder naquele atendimento e deixa para a equipe.
 */

export type QueueAiConfig = {
  name?: string;
  about?: string;
  tone?: string;
  instructions?: string;
  handoff?: string;
  handoffMessage?: string;
};

const HANDOFF_TOKEN = "[[HUMANO]]";
const HISTORY_SIZE = 20;

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

const TONES: Record<string, string> = {
  friendly: "simpático, acolhedor e próximo, com no máximo um emoji quando fizer sentido",
  formal: "formal, educado e objetivo, sem gírias nem emojis",
  casual: "descontraído e leve, como uma conversa de WhatsApp entre conhecidos",
  sales: "consultivo e persuasivo, focado em entender a necessidade e conduzir para a compra"
};

export const parseAiConfig = (raw?: string | null): QueueAiConfig => {
  if (!raw) return {};
  try {
    const value = JSON.parse(raw);
    return value && typeof value === "object" ? value : {};
  } catch (error) {
    return {};
  }
};

const pausedKey = (ticketId: number) => `ai:paused:${ticketId}`;

/** A equipe assumiu ou a IA passou a vez: não responde mais neste ticket. */
export const pauseQueueAi = (ticketId: number) =>
  cacheLayer.set(pausedKey(ticketId), "1", "EX", 7 * 24 * 3600);

const buildSystemPrompt = (
  config: QueueAiConfig,
  ctx: { company: string; queue: string; contact: string }
): string => {
  const now = new Date().toLocaleString("pt-BR", {
    timeZone: process.env.TZ || "America/Sao_Paulo"
  });
  const name = config.name?.trim() || "Assistente";
  return [
    `Você é ${name}, assistente virtual da empresa "${ctx.company}" e atende clientes pelo WhatsApp na fila "${ctx.queue}".`,
    `Cliente: ${ctx.contact || "não informado"}. Data e hora agora: ${now}.`,
    config.about?.trim()
      ? `\nSOBRE A EMPRESA (use como base de conhecimento; não invente nada além disso):\n${config.about.trim()}`
      : "",
    `\nTOM DE VOZ: ${TONES[config.tone || "friendly"] || TONES.friendly}.`,
    config.instructions?.trim()
      ? `\nINSTRUÇÕES DA EMPRESA:\n${config.instructions.trim()}`
      : "",
    "\nREGRAS:",
    "- Responda em português do Brasil, em mensagens curtas (até 3 frases), como no WhatsApp.",
    "- Nunca invente preços, prazos, políticas ou dados que não estejam nas informações acima; se não souber, diga que vai verificar com a equipe.",
    "- Não peça dados sensíveis (senhas, cartão completo).",
    `- Se o cliente pedir para falar com uma pessoa${
      config.handoff?.trim() ? `, ou se: ${config.handoff.trim()}` : ""
    }, responda apenas com ${HANDOFF_TOKEN}.`
  ]
    .filter(Boolean)
    .join("\n");
};

export const handleQueueAi = async (
  ticket: Ticket,
  incomingText: string
): Promise<void> => {
  const text = (incomingText || "").trim();
  if (!text || !ticket.queueId || ticket.userId) return;
  if (ticket.status !== "pending") return;

  const queue = await Queue.findByPk(ticket.queueId);
  if (!queue?.aiEnabled) return;
  if (await cacheLayer.get(pausedKey(ticket.id))) return;

  const apiKey = await GetCompanySetting(ticket.companyId, "aiAgentApiKey", "");
  if (!apiKey) return;
  const providerName = await GetCompanySetting(
    ticket.companyId,
    "aiAgentProvider",
    "openai"
  );
  const provider = PROVIDERS[providerName] || PROVIDERS.openai;
  const model =
    (await GetCompanySetting(ticket.companyId, "aiAgentModel", "")) ||
    provider.model;

  const config = parseAiConfig(queue.aiConfig);
  const company = await Company.findByPk(ticket.companyId);

  const history = await Message.findAll({
    where: {
      ticketId: ticket.id,
      isDeleted: { [Op.not]: true },
      body: { [Op.ne]: "" }
    },
    order: [["createdAt", "DESC"]],
    limit: HISTORY_SIZE
  });

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: buildSystemPrompt(config, {
        company: company?.name || "",
        queue: queue.name,
        contact: ticket.contact?.name || ""
      })
    },
    ...history
      .reverse()
      .map(m => ({
        role: (m.fromMe ? "assistant" : "user") as "assistant" | "user",
        content: String(m.body || "").slice(0, 2000)
      }))
  ];

  try {
    const client = new OpenAI({ apiKey, baseURL: provider.baseURL });
    const completion = await client.chat.completions.create({
      model,
      messages,
      temperature: 0.4,
      max_tokens: 400
    });
    const reply = completion.choices?.[0]?.message?.content?.trim();
    if (!reply) return;

    await ticket.reload();
    // alguém da equipe aceitou enquanto a IA pensava
    if (ticket.userId || ticket.status !== "pending") return;

    if (reply.includes(HANDOFF_TOKEN)) {
      await pauseQueueAi(ticket.id);
      await SendWhatsAppMessage({
        body:
          config.handoffMessage?.trim() ||
          "Certo! Vou chamar alguém da nossa equipe para continuar o seu atendimento. 😊",
        ticket
      });
      return;
    }

    await SendWhatsAppMessage({ body: reply, ticket });
  } catch (error) {
    logger.warn(
      { ticketId: ticket.id, error: error?.message },
      "QueueAiAgent: falha ao gerar resposta"
    );
  }
};
