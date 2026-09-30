import { Effort } from "./llm";

/**
 * Qual modelo cada agente usa quando o pipeline roda pelo OpenRouter.
 *
 * Um modelo por tarefa, pelo custo que a tarefa pede: ler e resumir
 * (triagem, testes, aprendizado) vai num modelo rápido e barato; escrever
 * código só usa o modelo caro quando a triagem diz que a demanda é média ou
 * difícil. A revisão das difíceis fica com outra família de modelo, que erra
 * em lugares diferentes do desenvolvedor e por isso pega o que ele não viu.
 *
 * "fallbacks": se o principal cair ou estiver lotado, o OpenRouter tenta o
 * próximo da lista; o custo vem certo do mesmo jeito (ele devolve o valor
 * cobrado em cada resposta).
 *
 * Preços de referência em US$ por milhão de tokens (entrada, saída, leitura
 * de cache), da tabela do OpenRouter em 29/09/2026. A tela mostra o preço do
 * dia quando o catálogo do OpenRouter responde; este é só o plano B.
 */
export type AgentSlot =
  | "triage"
  | "developer"
  | "developerHard"
  | "reviewer"
  | "reviewerHard"
  | "tester"
  | "learner";

export interface SlotModel {
  model: string;
  fallbacks: string[];
  effort: Effort;
}

export const SLOTS: AgentSlot[] = [
  "triage",
  "developer",
  "developerHard",
  "reviewer",
  "reviewerHard",
  "tester",
  "learner"
];

export const OPENROUTER_MODELS: Record<AgentSlot, SlotModel> = {
  // lê o pedido, acha os arquivos e escreve pouco: rápido e barato
  triage: {
    model: "openai/gpt-6-luna",
    fallbacks: ["z-ai/glm-5.3-flash"],
    effort: "low"
  },
  // demanda fácil: o barato dá conta, com raciocínio no máximo
  developer: {
    model: "openai/gpt-6-luna",
    fallbacks: ["deepseek/deepseek-v4.1-flash"],
    effort: "high"
  },
  // demanda média ou difícil: o modelo forte em código
  developerHard: {
    model: "openai/gpt-6.1-sol",
    fallbacks: ["openai/gpt-6-sol", "anthropic/claude-sonnet-5.5"],
    effort: "medium"
  },
  reviewer: {
    model: "openai/gpt-6-luna",
    fallbacks: ["z-ai/glm-5.3-flash"],
    effort: "medium"
  },
  // difícil ou arriscada: revisão por outra família (Claude)
  reviewerHard: {
    model: "anthropic/claude-sonnet-5.5",
    fallbacks: ["openai/gpt-6.1-sol"],
    effort: "medium"
  },
  // planeja o teste e confere as fotos: precisa enxergar imagem
  tester: {
    model: "openai/gpt-6-luna",
    fallbacks: ["z-ai/glm-5.3-flash"],
    effort: "low"
  },
  learner: {
    model: "openai/gpt-6-luna",
    fallbacks: ["z-ai/glm-5.3-flash"],
    effort: "low"
  }
};

// [entrada, saída, leitura de cache] em US$ por milhão de tokens
export const REFERENCE_PRICES: Record<string, [number, number, number]> = {
  "openai/gpt-6-luna": [0.1, 0.5, 0.01],
  "openai/gpt-6.1-sol": [2, 10, 0.1],
  "openai/gpt-6-sol": [2, 10, 0.2],
  "anthropic/claude-sonnet-5.5": [2, 10, 0.2],
  "z-ai/glm-5.3-flash": [0.15, 0.5, 0.03],
  "deepseek/deepseek-v4.1-flash": [0.3, 1.2, 0.006]
};

// chave em Configurações que troca o modelo de cada vaga (vazio = padrão)
export const slotSetting = (slot: AgentSlot): string =>
  `_devModel${slot.charAt(0).toUpperCase()}${slot.slice(1)}`;

export type Difficulty = "easy" | "medium" | "hard";

/**
 * Dificuldade da demanda. As antigas não tinham: vale o tamanho que a
 * triagem estimou (S, M, L). Sem nada, média, que é o lado seguro.
 */
export const difficultyOf = (task: {
  difficulty?: string;
  effort?: string;
}): Difficulty => {
  if (["easy", "medium", "hard"].includes(task.difficulty)) {
    return task.difficulty as Difficulty;
  }
  return (
    ({ S: "easy", M: "medium", L: "hard" }[task.effort] as Difficulty) ||
    "medium"
  );
};

/** Quem escreve e quem revisa esta demanda. */
export const slotsFor = (task: {
  difficulty?: string;
  effort?: string;
  risk?: string;
}): { developer: AgentSlot; reviewer: AgentSlot } => {
  const difficulty = difficultyOf(task);
  // risco alto (dinheiro, dados, login, envio de mensagem) conta como difícil
  const hard = difficulty === "hard" || task.risk === "high";
  return {
    developer: difficulty === "easy" && !hard ? "developer" : "developerHard",
    reviewer: hard ? "reviewerHard" : "reviewer"
  };
};
