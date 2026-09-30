import { Op } from "sequelize";
import Setting from "../../models/Setting";

/**
 * Configurações do pipeline (Configurações > Opções > Pipeline de IA).
 *
 * A IA é sempre o OpenRouter, com o modelo de cada agente fixo em models.ts
 * (não se troca pela tela). A chave vem da stack, em OPENROUTER_API_KEY,
 * junto das outras variáveis: não fica no banco nem passa pelo navegador.
 *
 * O resto começa com "_": só o super lê e grava, e fica na empresa 1, como
 * as do gateway de pagamento.
 */
export interface DevConfig {
  apiKey: string;
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

const number = (value: string, fallback: number, min: number, max: number) => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
};

export const loadDevConfig = async (): Promise<DevConfig> => {
  const rows = await Setting.findAll({
    where: { companyId: 1, key: { [Op.like]: "\\_dev%" } }
  });
  const get = (key: string) =>
    String(rows.find(row => row.key === key)?.value || "").trim();

  return {
    apiKey: String(process.env.OPENROUTER_API_KEY || "").trim(),
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
