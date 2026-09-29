import Setting from "../../models/Setting";
import { logger } from "../../utils/logger";
import { LlmUsage } from "./llm";

/**
 * Quanto custou cada chamada, para a tela mostrar em reais.
 *
 * Preço de tabela dos provedores em US$ por milhão de tokens: entrada,
 * saída, leitura de cache e gravação de cache. É estimativa (o provedor
 * pode mudar o preço, e a fatura dele é a palavra final), por isso a tela
 * mostra "≈ R$". Modelo fora da tabela conta tokens, mas não custo.
 * O nome é comparado pelo começo: "gpt-5-mini-2025-08-07" cai em
 * "gpt-5-mini", e a chave mais longa vence ("gpt-5-mini" antes de "gpt-5").
 */
const PRICES: Record<string, [number, number, number, number]> = {
  "claude-fable-5": [10, 50, 0.25, 12.5],
  "claude-opus-5-5": [4, 20, 0.2, 5],
  "claude-opus-5": [5, 25, 0.5, 6.25],
  "claude-opus-4": [5, 25, 0.5, 6.25],
  "claude-sonnet-5": [2, 10, 0.2, 2.5],
  "claude-sonnet-4": [3, 15, 0.3, 3.75],
  "claude-haiku-4-5": [1, 5, 0.1, 1.25],
  "gpt-5-nano": [0.05, 0.4, 0.005, 0],
  "gpt-5-mini": [0.25, 2, 0.025, 0],
  "gpt-5": [1.25, 10, 0.125, 0],
  "gpt-4.1-nano": [0.1, 0.4, 0.025, 0],
  "gpt-4.1-mini": [0.4, 1.6, 0.1, 0],
  "gpt-4.1": [2, 8, 0.5, 0],
  "gpt-4o-mini": [0.15, 0.6, 0.075, 0],
  "gpt-4o": [2.5, 10, 1.25, 0],
  "o4-mini": [1.1, 4.4, 0.275, 0],
  o3: [2, 8, 0.5, 0]
};

const KEYS = Object.keys(PRICES).sort((a, b) => b.length - a.length);

export const priceOf = (model: string) => {
  const key = KEYS.find(name => String(model || "").startsWith(name));
  return key ? PRICES[key] : null;
};

/** Custo em US$ de uma chamada; null quando o modelo não está na tabela. */
export const costOf = (model: string, usage: LlmUsage): number | null => {
  const price = priceOf(model);
  if (!price) return null;
  const [input, output, cacheRead, cacheWrite] = price;
  return (
    (usage.input * input +
      usage.output * output +
      usage.cacheRead * cacheRead +
      (usage.cacheWrite || 0) * cacheWrite) /
    1e6
  );
};

// ---------------------------------------------------------------------------
// cotação do dólar

const FALLBACK_RATE = 5.5;
const RATE_TTL = 12 * 60 * 60 * 1000;
let cachedRate: { rate: number; at: number } | null = null;

export interface UsdBrl {
  rate: number;
  source: "manual" | "auto" | "default";
}

/**
 * Cotação usada para converter. Manual (Configurações) manda; sem ela, a
 * cotação do dia na AwesomeAPI (pública, sem chave), guardada por 12 horas.
 * Sem internet, um valor padrão: o custo continua aparecendo.
 */
export const usdToBrl = async (): Promise<UsdBrl> => {
  const manual = await Setting.findOne({
    where: { companyId: 1, key: "_devUsdBrl" }
  });
  const typed = parseFloat(String(manual?.value || "").replace(",", "."));
  if (typed > 0) return { rate: typed, source: "manual" };

  if (cachedRate && Date.now() - cachedRate.at < RATE_TTL) {
    return { rate: cachedRate.rate, source: "auto" };
  }
  try {
    const res = await fetch(
      "https://economia.awesomeapi.com.br/json/last/USD-BRL",
      { signal: AbortSignal.timeout(5000) }
    );
    const data = await res.json();
    const rate = parseFloat(data?.USDBRL?.bid);
    if (rate > 0) {
      cachedRate = { rate, at: Date.now() };
      return { rate, source: "auto" };
    }
  } catch (error) {
    logger.warn({ error }, "DevPipeline: cotação do dólar indisponível");
  }
  return {
    rate: cachedRate?.rate || FALLBACK_RATE,
    source: cachedRate ? "auto" : "default"
  };
};
