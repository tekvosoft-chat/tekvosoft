import OpenAI from "openai";
import { Op } from "sequelize";
import Ticket from "../../models/Ticket";
import Queue from "../../models/Queue";
import Message from "../../models/Message";
import Company from "../../models/Company";
import { GetCompanySetting } from "../../helpers/CheckSettings";
import { logger } from "../../utils/logger";
import Tag from "../../models/Tag";
import TicketTag from "../../models/TicketTag";
import SendWhatsAppMessage from "../WbotServices/SendWhatsAppMessage";
import { isQueueAiPaused, pauseQueueAi } from "../../helpers/QueueAiPause";

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
 *
 * IMPORTAÇÃO TARDIA: mover o ticket, mexer nas colunas e marcar na agenda são
 * carregados dentro das funções, e não no topo. Quem chama este módulo é o
 * wbotMessageListener; importar UpdateTicketService de volta fecha um ciclo e
 * o Node entrega o módulo pela metade — na prática a IA parava de responder
 * exatamente quando ia agendar ("scheduleFromChat is not defined").
 */

export type QueueAiConfig = {
  name?: string;
  about?: string;
  tone?: string;
  instructions?: string;
  handoff?: string;
  handoffMessage?: string;
  /** para quem o atendimento vai quando a IA passa a vez (opcional) */
  handoffUserId?: number | string;
  /** coluna do Kanban enquanto a IA conversa (opcional) */
  kanbanTagId?: number | string;
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
  friendly:
    "simpático, acolhedor e próximo, com no máximo um emoji quando fizer sentido",
  formal: "formal, educado e objetivo, sem gírias nem emojis",
  casual: "descontraído e leve, como uma conversa de WhatsApp entre conhecidos",
  sales:
    "consultivo e persuasivo, focado em entender a necessidade e conduzir para a compra"
};

export const parseAiConfig = (raw?: string | null): QueueAiConfig => {
  if (!raw) return {};
  try {
    const value = JSON.parse(raw);
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
};

/**
 * A única ferramenta da IA: marcar na agenda. Sem ela a IA "combinava" um
 * horário que não existia em lugar nenhum — agora, quando diz que vai
 * agendar, o compromisso aparece de fato na Agenda do app.
 */
const TOOLS: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "agendar_compromisso",
      description:
        "Marca um compromisso na agenda da empresa. Use SEMPRE que combinar com o cliente uma reunião, visita, ligação, demonstração, instalação ou retorno em data e hora definidas. Confirme a data e a hora com o cliente antes de chamar.",
      parameters: {
        type: "object",
        properties: {
          titulo: {
            type: "string",
            description:
              "Título curto, ex.: 'Reunião de apresentação com João (Padaria Boa Praça)'"
          },
          inicio: {
            type: "string",
            description:
              "Data e hora de início no formato AAAA-MM-DDTHH:MM, no horário local do cliente"
          },
          duracao_minutos: {
            type: "integer",
            description: "Duração em minutos (padrão 60)"
          },
          observacao: {
            type: "string",
            description: "O que foi combinado, em uma frase"
          }
        },
        required: ["titulo", "inicio"]
      }
    }
  }
];

const runTool = async (
  call: OpenAI.Chat.ChatCompletionMessageToolCall,
  ticket: Ticket
): Promise<string> => {
  if (call.function?.name !== "agendar_compromisso") {
    return JSON.stringify({ ok: false, erro: "ferramenta desconhecida" });
  }
  let args: Record<string, unknown> = {};
  try {
    args = JSON.parse(call.function.arguments || "{}");
  } catch {
    return JSON.stringify({ ok: false, erro: "não entendi os dados" });
  }

  // carregado aqui dentro, e não no topo: ver a nota em "importação tardia"
  const { default: scheduleFromChat } =
    await import("../CalendarServices/ScheduleFromChat");
  const result = await scheduleFromChat({
    ticket,
    title: String(args.titulo || ""),
    when: String(args.inicio || ""),
    minutes: Number(args.duracao_minutos) || 60,
    note: String(args.observacao || "")
  });

  if (result.ok !== true) {
    return JSON.stringify({
      ok: false,
      erro: result.reason,
      instrucao: "Peça ao cliente uma data e hora válidas e tente de novo."
    });
  }
  return JSON.stringify({
    ok: true,
    marcado_para: result.whenLabel,
    instrucao: "Confirme para o cliente, com data e hora, em uma frase."
  });
};

/**
 * Passa a vez para a equipe: além de avisar o cliente, o atendimento sai de
 * "Aguardando" e entra em "Atendendo", que é onde alguém de verdade olha.
 */
const handOff = async (ticket: Ticket, config: QueueAiConfig) => {
  await pauseQueueAi(ticket.id);
  await SendWhatsAppMessage({
    body:
      config.handoffMessage?.trim() ||
      "Certo! Vou chamar alguém da nossa equipe para continuar o seu atendimento. 😊",
    ticket
  });
  try {
    const { default: UpdateTicketService } =
      await import("../TicketServices/UpdateTicketService");
    await UpdateTicketService({
      ticketData: {
        status: "open",
        chatbot: false,
        ...(config.handoffUserId
          ? { userId: Number(config.handoffUserId) }
          : {})
      },
      ticketId: ticket.id,
      companyId: ticket.companyId
    });
  } catch (error) {
    logger.warn(
      { ticketId: ticket.id, error: error?.message },
      "QueueAiAgent: não consegui abrir o atendimento para a equipe"
    );
  }
};

/**
 * Enquanto a IA conversa, o card vai para a coluna de quem está sendo
 * atendido — assim o Kanban mostra a conversa viva, não parada na entrada.
 */
const moveToTalkingColumn = async (ticket: Ticket, config: QueueAiConfig) => {
  try {
    const columns = await Tag.findAll({
      where: { companyId: ticket.companyId, kanban: 1 },
      attributes: ["id", "name"]
    });
    if (!columns.length) return;

    const target = config.kanbanTagId
      ? columns.find(tag => tag.id === Number(config.kanbanTagId))
      : columns.find(tag => /em atendimento/i.test(tag.name));
    if (!target) return;

    const current = await TicketTag.findAll({
      where: { ticketId: ticket.id },
      attributes: ["tagId"]
    });
    const isColumn = new Set(columns.map(column => column.id));
    if (current.some(tag => tag.tagId === target.id)) return;

    const { ticketTagAdd, ticketTagRemove } =
      await import("../TicketTagServices/TicketTagServices");
    await Promise.all(
      current
        .filter(tag => isColumn.has(tag.tagId))
        .map(tag => ticketTagRemove(ticket.id, tag.tagId, ticket.companyId))
    );
    await ticketTagAdd(ticket.id, target.id, ticket.companyId, true);
  } catch (error) {
    logger.warn(
      { ticketId: ticket.id, error: error?.message },
      "QueueAiAgent: não consegui mover o card no Kanban"
    );
  }
};

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
    "- Para marcar reunião, visita, ligação, demonstração ou retorno, use a ferramenta agendar_compromisso. Nunca diga que agendou sem ter usado a ferramenta; se ela falhar, peça outra data.",
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
  if (await isQueueAiPaused(ticket.id)) return;

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
    ...history.reverse().map(m => ({
      role: (m.fromMe ? "assistant" : "user") as "assistant" | "user",
      content: String(m.body || "").slice(0, 2000)
    }))
  ];

  try {
    const client = new OpenAI({ apiKey, baseURL: provider.baseURL });
    const ask = () =>
      client.chat.completions.create({
        model,
        messages,
        tools: TOOLS,
        temperature: 0.4,
        max_tokens: 400
      });

    let completion = await ask();
    let choice = completion.choices?.[0]?.message;

    // a IA pediu para marcar na agenda: marca de verdade e devolve o
    // resultado para ela confirmar com o cliente na própria resposta
    if (choice?.tool_calls?.length) {
      messages.push(choice as OpenAI.Chat.ChatCompletionMessageParam);
      // eslint-disable-next-line no-restricted-syntax
      for (const call of choice.tool_calls) {
        const result = await runTool(call, ticket);
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: result
        });
      }
      completion = await ask();
      choice = completion.choices?.[0]?.message;
    }

    const reply = choice?.content?.trim();
    if (!reply) return;

    await ticket.reload();
    // alguém da equipe aceitou enquanto a IA pensava
    if (ticket.userId || ticket.status !== "pending") return;

    if (reply.includes(HANDOFF_TOKEN)) {
      await handOff(ticket, config);
      return;
    }

    await SendWhatsAppMessage({ body: reply, ticket });
    // enquanto a IA conversa, o card fica na coluna de quem está sendo atendido
    await moveToTalkingColumn(ticket, config);
  } catch (error) {
    logger.warn(
      { ticketId: ticket.id, error: error?.message },
      "QueueAiAgent: falha ao gerar resposta"
    );
  }
};
