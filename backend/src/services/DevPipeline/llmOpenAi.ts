import OpenAI from "openai";
import { LlmError, LlmRequest, LlmResult } from "./llm";

/**
 * Pipeline de IA pela OpenAI (Chat Completions).
 *
 * O contexto do projeto abre a mensagem de sistema: a OpenAI guarda em
 * cache, sozinha, todo começo de pedido igual a um anterior (acima de 1024
 * tokens), então a segunda chamada da tarefa já sai mais barata. A resposta
 * vem num JSON com formato fixo (json_schema estrito).
 */

// modelos de raciocínio aceitam reasoning_effort; os outros recusam o campo
const REASONING = /^(o\d|gpt-5)/;

const translateError = (error: unknown): LlmError => {
  if (error instanceof LlmError) return error;
  if (
    error instanceof OpenAI.AuthenticationError ||
    error instanceof OpenAI.PermissionDeniedError
  ) {
    return new LlmError("ERR_DEV_AI_AUTH");
  }
  if (error instanceof OpenAI.NotFoundError) {
    return new LlmError("ERR_DEV_AI_MODEL", error.message);
  }
  if (error instanceof OpenAI.RateLimitError) {
    return new LlmError("ERR_DEV_AI_RATE_LIMIT");
  }
  if (error instanceof OpenAI.APIConnectionError) {
    return new LlmError("ERR_DEV_AI_OFFLINE");
  }
  if (error instanceof OpenAI.APIError) {
    return new LlmError("ERR_DEV_AI_FAILED", error.message);
  }
  return new LlmError("ERR_DEV_AI_FAILED", String(error));
};

export const callOpenAi = async (request: LlmRequest): Promise<LlmResult> => {
  const client = new OpenAI({
    apiKey: request.apiKey,
    maxRetries: 3,
    timeout: 15 * 60 * 1000
  });

  // prompt_cache_key manda todos os agentes do pipeline para o mesmo cache:
  // sem ela, a OpenAI pode atender a triagem numa máquina e o desenvolvedor
  // em outra, e o contexto do projeto é cobrado cheio de novo (a SDK desta
  // versão ainda não tem o campo nos tipos, a API aceita)
  const cacheKey = { prompt_cache_key: "vuup-dev-pipeline" } as Record<
    string,
    string
  >;

  try {
    const completion = await client.chat.completions.create({
      ...cacheKey,
      model: request.model,
      max_completion_tokens: request.maxTokens,
      ...(REASONING.test(request.model)
        ? { reasoning_effort: request.effort }
        : {}),
      response_format: {
        type: "json_schema",
        json_schema: {
          name: request.schemaName,
          schema: request.schema,
          strict: true
        }
      },
      messages: [
        { role: "system", content: `${request.context}\n\n${request.system}` },
        ...request.messages.map(turn =>
          turn.role === "user" && turn.images?.length
            ? {
                role: "user" as const,
                content: [
                  ...turn.images.map(image => ({
                    type: "image_url" as const,
                    image_url: {
                      url: `data:${image.mediaType};base64,${image.data}`
                    }
                  })),
                  { type: "text" as const, text: turn.content }
                ]
              }
            : { role: turn.role, content: turn.content }
        )
      ]
    });

    const choice = completion.choices?.[0];
    if (choice?.message?.refusal) {
      throw new LlmError("ERR_DEV_AI_REFUSAL", choice.message.refusal);
    }
    if (choice?.finish_reason === "length") {
      throw new LlmError("ERR_DEV_AI_TRUNCATED");
    }

    const usage = completion.usage;
    const cached = usage?.prompt_tokens_details?.cached_tokens || 0;
    return {
      text: choice?.message?.content || "",
      model: completion.model,
      usage: {
        input: (usage?.prompt_tokens || 0) - cached,
        output: usage?.completion_tokens || 0,
        cacheRead: cached,
        cacheWrite: 0
      }
    };
  } catch (error) {
    throw translateError(error);
  }
};
