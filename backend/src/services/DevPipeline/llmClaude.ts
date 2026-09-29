import Anthropic from "@anthropic-ai/sdk";
import { LlmError, LlmRequest, LlmResult } from "./llm";

/**
 * Pipeline de IA pelo Claude (API da Anthropic).
 *
 *  - saída em JSON garantida pelo formato fixo (output_config.format);
 *  - o contexto do projeto vai num bloco de sistema marcado para cache, e o
 *    cache automático cobre também a conversa: a rodada seguinte relê tudo
 *    pelo preço de leitura de cache;
 *  - raciocínio adaptativo com esforço por etapa (triagem gasta pouco,
 *    código gasta mais);
 *  - streaming, porque a etapa de código pode escrever bastante e um pedido
 *    longo sem streaming estoura o tempo limite;
 *  - se o modelo recusar por segurança, a própria API repete o pedido no
 *    modelo recomendado para aquele caso (fallbacks: "default").
 */

// modelos com a troca automática em caso de recusa
const WITH_FALLBACK = ["claude-opus-5", "claude-fable-5-1"];

// Haiku 4.5 e modelos antigos não aceitam esforço nem raciocínio adaptativo
const isLegacy = (model: string) =>
  /haiku|claude-3|sonnet-4-5|sonnet-4-2|opus-4-[015]/.test(model);

const translateError = (error: unknown): LlmError => {
  if (error instanceof LlmError) return error;
  if (
    error instanceof Anthropic.AuthenticationError ||
    error instanceof Anthropic.PermissionDeniedError
  ) {
    return new LlmError("ERR_DEV_AI_AUTH");
  }
  if (error instanceof Anthropic.NotFoundError) {
    return new LlmError("ERR_DEV_AI_MODEL", error.message);
  }
  if (error instanceof Anthropic.RateLimitError) {
    return new LlmError("ERR_DEV_AI_RATE_LIMIT");
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return new LlmError("ERR_DEV_AI_OFFLINE");
  }
  if (error instanceof Anthropic.APIError) {
    return new LlmError("ERR_DEV_AI_FAILED", error.message);
  }
  return new LlmError("ERR_DEV_AI_FAILED", String(error));
};

export const callClaude = async (request: LlmRequest): Promise<LlmResult> => {
  const client = new Anthropic({
    apiKey: request.apiKey,
    maxRetries: 3,
    timeout: 15 * 60 * 1000
  });
  const legacy = isLegacy(request.model);
  const fallback = WITH_FALLBACK.includes(request.model);

  try {
    const stream = client.beta.messages.stream({
      model: request.model,
      max_tokens: request.maxTokens,
      system: [
        {
          type: "text",
          text: request.context,
          cache_control: { type: "ephemeral" }
        },
        { type: "text", text: request.system }
      ],
      messages: request.messages.map(turn => {
        if (turn.raw) {
          return {
            role: turn.role,
            content: turn.raw as Anthropic.Beta.BetaContentBlockParam[]
          };
        }
        if (!turn.images?.length) {
          return { role: turn.role, content: turn.content };
        }
        // imagens antes do texto: o modelo lê a tela e depois o pedido
        const content: Anthropic.Beta.BetaContentBlockParam[] = [
          ...turn.images.map(image => ({
            type: "image" as const,
            source: {
              type: "base64" as const,
              media_type: image.mediaType,
              data: image.data
            }
          })),
          { type: "text" as const, text: turn.content }
        ];
        return { role: turn.role, content };
      }),
      cache_control: { type: "ephemeral" },
      output_config: {
        format: { type: "json_schema", schema: request.schema },
        ...(legacy ? {} : { effort: request.effort })
      },
      ...(legacy ? {} : { thinking: { type: "adaptive" as const } }),
      ...(fallback
        ? {
            betas: ["server-side-fallback-2026-07-01"],
            fallbacks: "default" as const
          }
        : {})
    });
    const message = await stream.finalMessage();

    if (message.stop_reason === "refusal") {
      throw new LlmError(
        "ERR_DEV_AI_REFUSAL",
        message.stop_details?.category || ""
      );
    }
    if (message.stop_reason === "max_tokens") {
      throw new LlmError("ERR_DEV_AI_TRUNCATED");
    }

    const text = message.content
      .map(block => (block.type === "text" ? block.text : ""))
      .join("");
    const { usage } = message;
    return {
      text,
      raw: message.content,
      model: message.model,
      usage: {
        input: usage.input_tokens || 0,
        output: usage.output_tokens || 0,
        cacheRead: usage.cache_read_input_tokens || 0,
        cacheWrite: usage.cache_creation_input_tokens || 0
      }
    };
  } catch (error) {
    throw translateError(error);
  }
};
