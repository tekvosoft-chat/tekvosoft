import { Op } from "sequelize";
import Setting from "../../models/Setting";

/**
 * Configurações do pipeline (Configurações > Opções > Pipeline de IA).
 *
 * Todas começam com "_": só o super lê e grava, e ficam na empresa 1, como
 * as do gateway de pagamento. Nada daqui vai para o navegador de cliente
 * nem para o config.json público.
 */
export type DevProvider = "anthropic" | "openai";

export interface DevConfig {
  provider: DevProvider;
  apiKey: string;
  model: string;
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
  openai: "gpt-5"
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

  const provider: DevProvider =
    get("_devAiProvider") === "openai" ? "openai" : "anthropic";

  // sem chave própria, o OpenAI aproveita a do Assistente de IA (se for
  // OpenAI): quem já configurou uma vez não precisa colar de novo
  const openAiKey =
    get("_devOpenAiKey") ||
    ((get("aiAgentProvider") || "openai") === "openai"
      ? get("aiAgentApiKey")
      : "");

  return {
    provider,
    apiKey: provider === "openai" ? openAiKey : get("_devAnthropicKey"),
    model:
      (provider === "openai"
        ? get("_devOpenAiModel")
        : get("_devAnthropicModel")) || DEFAULT_MODELS[provider],
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
