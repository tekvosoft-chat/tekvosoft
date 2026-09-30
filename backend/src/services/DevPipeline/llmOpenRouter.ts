import OpenAI from "openai";
import { LlmError, LlmRequest, LlmResult } from "./llm";
import { modelInfo } from "./catalog";

/**
 * Pipeline de IA pelo OpenRouter: uma chave só e o modelo certo para cada
 * agente (models.ts). A API é a mesma da OpenAI, então vai pela SDK dela.
 *
 *  - resposta em JSON com formato fixo, e require_parameters: o OpenRouter
 *    só manda para provedor que garante o formato (e o raciocínio pedido);
 *  - "models": se o principal falhar, os de reserva, na ordem;
 *  - o contexto do projeto abre a mensagem de sistema, marcado para cache
 *    (Claude e Gemini precisam da marca; OpenAI, DeepSeek e GLM guardam
 *    sozinhos o começo igual de um pedido);
 *  - usage.include: a resposta traz quanto custou, em dólar, já com o
 *    desconto do cache. É esse o valor que vai para a demanda;
 *  - data_collection "deny": só provedor que não guarda nem treina com o
 *    que recebe. Vai código, pedido de cliente e, no teste, foto do sistema
 *    no ar (que pode mostrar conversa de cliente).
 */
const BASE_URL = "https://openrouter.ai/api/v1";

const translateError = (error: unknown): LlmError => {
  if (error instanceof LlmError) return error;
  if (error instanceof OpenAI.APIConnectionTimeoutError) {
    return new LlmError("ERR_DEV_AI_TIMEOUT");
  }
  if (error instanceof OpenAI.APIConnectionError) {
    return new LlmError("ERR_DEV_AI_OFFLINE");
  }
  if (error instanceof OpenAI.APIError) {
    const detail = String(error.message || "").slice(0, 300);
    switch (error.status) {
      case 401:
      case 403:
        return new LlmError("ERR_DEV_AI_AUTH", detail);
      // sem crédito na conta ou limite da chave estourado
      case 402:
        return new LlmError("ERR_DEV_AI_CREDITS", detail);
      case 404:
        return new LlmError("ERR_DEV_AI_MODEL", detail);
      case 408:
        return new LlmError("ERR_DEV_AI_TIMEOUT", detail);
      case 429:
        return new LlmError("ERR_DEV_AI_RATE_LIMIT", detail);
      default:
        return new LlmError("ERR_DEV_AI_FAILED", detail);
    }
  }
  return new LlmError("ERR_DEV_AI_FAILED", String(error));
};

type Part =
  | { type: "text"; text: string; cache_control?: { type: "ephemeral" } }
  | { type: "image_url"; image_url: { url: string } };

interface OpenRouterUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  cost?: number;
  prompt_tokens_details?: {
    cached_tokens?: number;
    cache_write_tokens?: number;
  };
}

export const callOpenRouter = async (
  request: LlmRequest
): Promise<LlmResult> => {
  const client = new OpenAI({
    apiKey: request.apiKey,
    baseURL: BASE_URL,
    // uma repetição só: quem cai é trocado pelos modelos de reserva
    maxRetries: 1,
    timeout: request.timeoutMs || 10 * 60 * 1000,
    // aparecem no painel do OpenRouter: dá para saber de onde veio o gasto
    defaultHeaders: {
      "HTTP-Referer": "https://vuup.me",
      "X-Title": "vuup.me · pipeline de IA"
    }
  });
  const info = await modelInfo(request.model);

  const messages = request.messages.map(turn => {
    if (turn.role !== "user" || !turn.images?.length) {
      return { role: turn.role, content: turn.content };
    }
    // modelo sem visão recusaria o pedido: a imagem fica de fora, avisada
    if (!info.vision) {
      return {
        role: turn.role,
        content: `${turn.content}\n\n(${turn.images.length} imagem(ns) anexada(s) não enviada(s): este modelo não lê imagem.)`
      };
    }
    const content: Part[] = [
      ...turn.images.map(image => ({
        type: "image_url" as const,
        image_url: { url: `data:${image.mediaType};base64,${image.data}` }
      })),
      { type: "text", text: turn.content }
    ];
    return { role: turn.role, content };
  });

  const system: Part[] = [
    {
      type: "text",
      text: request.context,
      cache_control: { type: "ephemeral" }
    },
    { type: "text", text: request.system }
  ];

  const body = {
    model: request.model,
    models: [request.model, ...(request.fallbacks || [])].filter(
      (model, index, list) => model && list.indexOf(model) === index
    ),
    max_tokens: request.maxTokens,
    ...(info.reasoning ? { reasoning: { effort: request.effort } } : {}),
    usage: { include: true },
    provider: { require_parameters: true, data_collection: "deny" },
    response_format: {
      type: "json_schema",
      json_schema: {
        name: request.schemaName,
        schema: request.schema,
        strict: true
      }
    },
    messages: [{ role: "system", content: system }, ...messages]
  };

  try {
    // os campos próprios do OpenRouter (models, provider, usage, reasoning)
    // não existem nos tipos da SDK; ela manda o corpo como veio
    const completion = (await client.chat.completions.create(
      body as unknown as OpenAI.Chat.ChatCompletionCreateParamsNonStreaming
    )) as OpenAI.Chat.ChatCompletion & { usage?: OpenRouterUsage };

    const choice = completion.choices?.[0] as
      | (OpenAI.Chat.ChatCompletion.Choice & { error?: { message?: string } })
      | undefined;
    // o provedor pode falhar no meio e o OpenRouter devolver 200 com o erro
    if (choice?.error) {
      throw new LlmError("ERR_DEV_AI_FAILED", choice.error.message || "");
    }
    if (choice?.message?.refusal) {
      throw new LlmError("ERR_DEV_AI_REFUSAL", choice.message.refusal);
    }
    if (choice?.finish_reason === "length") {
      throw new LlmError("ERR_DEV_AI_TRUNCATED");
    }
    const text = choice?.message?.content || "";
    if (!text.trim()) {
      throw new LlmError("ERR_DEV_AI_FORMAT", "resposta vazia");
    }

    const usage: OpenRouterUsage = completion.usage || {};
    const cached = usage.prompt_tokens_details?.cached_tokens || 0;
    const written = usage.prompt_tokens_details?.cache_write_tokens || 0;
    return {
      text,
      model: completion.model || request.model,
      cost: typeof usage.cost === "number" ? usage.cost : undefined,
      usage: {
        input: Math.max(0, (usage.prompt_tokens || 0) - cached - written),
        output: usage.completion_tokens || 0,
        cacheRead: cached,
        cacheWrite: written
      }
    };
  } catch (error) {
    throw translateError(error);
  }
};
