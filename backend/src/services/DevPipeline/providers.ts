import { DevProvider } from "./config";
import { LlmError, LlmRequest, LlmResult } from "./llm";
import { callClaude } from "./llmClaude";
import { callOpenAi } from "./llmOpenAi";

/** Manda o pedido para o provedor escolhido em Configurações. */
export const callLlm = async (
  provider: DevProvider,
  request: LlmRequest
): Promise<LlmResult> => {
  if (!request.apiKey) throw new LlmError("ERR_DEV_AI_NOT_CONFIGURED");
  return provider === "openai" ? callOpenAi(request) : callClaude(request);
};
