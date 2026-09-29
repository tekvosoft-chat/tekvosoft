/**
 * Contrato comum aos provedores de IA do pipeline (Claude e OpenAI).
 *
 * Cada agente manda: um contexto estável (regras do projeto + mapa do
 * repositório), o papel dele, a conversa e o formato JSON da resposta. O
 * contexto vai sempre primeiro e byte a byte igual: é ele que o provedor
 * guarda em cache entre um pedido e outro, e por isso a segunda chamada de
 * uma tarefa paga só uma fração dele.
 */
export type Effort = "low" | "medium" | "high";

export interface LlmUsage {
  // entrada cobrada inteira
  input: number;
  output: number;
  // entrada lida do cache: sai bem mais barata
  cacheRead: number;
  // entrada gravada no cache (o Claude cobra um pouco mais por ela)
  cacheWrite: number;
}

/** Imagem já reduzida, em base64, para a IA enxergar. */
export interface LlmImage {
  mediaType: "image/png" | "image/jpeg" | "image/gif" | "image/webp";
  data: string;
}

export interface LlmTurn {
  role: "user" | "assistant";
  content: string;
  // só em mensagem da pessoa: prints e rascunhos que acompanham o texto
  images?: LlmImage[];
  // resposta original do provedor, devolvida igual na rodada seguinte
  // (o Claude precisa receber os blocos de raciocínio como vieram)
  raw?: unknown;
}

export interface LlmRequest {
  apiKey: string;
  model: string;
  context: string;
  system: string;
  messages: LlmTurn[];
  schema: Record<string, unknown>;
  schemaName: string;
  effort: Effort;
  maxTokens: number;
}

export interface LlmResult {
  text: string;
  raw?: unknown;
  usage: LlmUsage;
  model: string;
}

/** Erro do provedor, já com o código que a tela sabe traduzir. */
export class LlmError extends Error {
  code: string;

  detail: string;

  constructor(code: string, detail = "") {
    super(detail ? `${code}: ${detail}` : code);
    this.code = code;
    this.detail = detail;
  }
}

/** Resposta em JSON do agente; fora do formato vira erro legível. */
export const parseJson = <T>(text: string): T => {
  try {
    return JSON.parse(text) as T;
  } catch {
    // alguns modelos embrulham em ```json mesmo com formato fixo
    const inner = text.match(/\{[\s\S]*\}/);
    if (inner) {
      try {
        return JSON.parse(inner[0]) as T;
      } catch {
        // cai no erro abaixo
      }
    }
    throw new LlmError("ERR_DEV_AI_FORMAT", text.slice(0, 200));
  }
};
