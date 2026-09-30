import { Op } from "sequelize";
import Setting from "../../models/Setting";
import {
  AgentSlot,
  OPENROUTER_MODELS,
  SLOTS,
  SlotModel,
  slotSetting
} from "./models";

/**
 * Configurações do pipeline (Configurações > Opções > Pipeline de IA).
 *
 * Todas começam com "_": só o super lê e grava, e ficam na empresa 1, como
 * as do gateway de pagamento. Nada daqui vai para o navegador de cliente
 * nem para o config.json público.
 */
export type DevProvider = "anthropic" | "openai" | "openrouter";

export interface DevConfig {
  provider: DevProvider;
  apiKey: string;
  // modelo único (Claude e OpenAI); no OpenRouter, o da triagem
  model: string;
  // no OpenRouter, cada agente com o seu (models.ts, ou o que o super trocou)
  models: Record<AgentSlot, SlotModel>;
  githubRepo: string;
  githubToken: string;
  githubBranch: string;
  autoApprove: boolean;
  autoTriage: boolean;
  // o Sabichão já põe em uso o que aprende (pedido de cliente sempre espera)
  autoLearn: boolean;
  reviewRounds: number;
  tokenLimit: number;
}

export const DEFAULT_MODELS: Record<DevProvider, string> = {
  anthropic: "claude-opus-5",
  openai: "gpt-5",
  openrouter: OPENROUTER_MODELS.triage.model
};

const number = (value: string, fallback: number, min: number, max: number) => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
};

export const loadDevConfig = async (): Promise<DevConfig> => {
  const rows = await Setting.findAll({
    where: {
      companyId: 1,
      [Op.or]: [
        { key: { [Op.like]: "\\_dev%" } },
        { key: { [Op.in]: ["aiAgentProvider", "aiAgentApiKey"] } }
      ]
    }
  });
  const get = (key: string) =>
    String(rows.find(row => row.key === key)?.value || "").trim();

  // a chave do OpenRouter pode vir da tela ou da stack (OPENROUTER_API_KEY):
  // quem sobe pelo Portainer deixa o segredo junto das outras variáveis
  const openRouterKey =
    get("_devOpenRouterKey") || String(process.env.OPENROUTER_API_KEY || "");

  // sem escolha salva, o OpenRouter manda quando tem chave (é o mais barato:
  // cada agente no modelo que a tarefa dele pede); senão, o Claude de antes
  const chosen = get("_devAiProvider");
  let provider: DevProvider;
  if (["anthropic", "openai", "openrouter"].includes(chosen)) {
    provider = chosen as DevProvider;
  } else {
    provider = openRouterKey ? "openrouter" : "anthropic";
  }

  // sem chave própria, o OpenAI aproveita a do Assistente de IA (se for
  // OpenAI): quem já configurou uma vez não precisa colar de novo
  const openAiKey =
    get("_devOpenAiKey") ||
    ((get("aiAgentProvider") || "openai") === "openai"
      ? get("aiAgentApiKey")
      : "");

  const models = Object.fromEntries(
    SLOTS.map(slot => {
      const base = OPENROUTER_MODELS[slot];
      const typed = get(slotSetting(slot));
      return [slot, typed ? { ...base, model: typed } : base];
    })
  ) as Record<AgentSlot, SlotModel>;

  let apiKey = get("_devAnthropicKey");
  let model = get("_devAnthropicModel");
  if (provider === "openai") {
    apiKey = openAiKey;
    model = get("_devOpenAiModel");
  } else if (provider === "openrouter") {
    apiKey = openRouterKey;
    model = models.triage.model;
  }

  return {
    provider,
    apiKey,
    model: model || DEFAULT_MODELS[provider],
    models,
    githubRepo: get("_devGithubRepo").replace(
      /^(https?:\/\/github\.com\/)?(.+?)(\.git)?\/?$/,
      "$2"
    ),
    githubToken: get("_devGithubToken"),
    githubBranch: get("_devGithubBranch") || "main",
    autoApprove: get("_devAutoApprove") === "enabled",
    autoTriage: get("_devAutoTriage") === "enabled",
    autoLearn: get("_devAutoLearn") !== "disabled",
    reviewRounds: number(get("_devReviewRounds"), 2, 0, 5),
    tokenLimit: number(get("_devTokenLimit"), 400000, 20000, 5000000)
  };
};

/**
 * Modelo, reservas e esforço de uma vaga. Claude e OpenAI usam um modelo só
 * para tudo (o de Configurações), com o esforço que a etapa pede.
 */
export const modelFor = (
  config: DevConfig,
  slot: AgentSlot,
  effort: SlotModel["effort"]
): SlotModel => {
  if (config.provider === "openrouter") return config.models[slot];
  return { model: config.model, fallbacks: [], effort };
};
