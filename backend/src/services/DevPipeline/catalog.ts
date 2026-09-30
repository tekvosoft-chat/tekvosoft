import { logger } from "../../utils/logger";
import { REFERENCE_PRICES } from "./models";

/**
 * Catálogo público do OpenRouter (não usa a chave): preço do dia e o que
 * cada modelo aceita. Serve para duas coisas:
 *
 *  - só mandar "reasoning" para quem raciocina e imagem para quem enxerga.
 *    O pedido vai com require_parameters (só provedor que aceita tudo que
 *    foi pedido), então um parâmetro a mais faria o modelo sumir da rota;
 *  - mostrar na tela quanto cada agente custa.
 *
 * Guardado por 12 horas. Sem internet, vale a tabela de models.ts.
 */
const CATALOG_URL = "https://openrouter.ai/api/v1/models";
const TTL = 12 * 60 * 60 * 1000;

export interface CatalogModel {
  id: string;
  name: string;
  reasoning: boolean;
  vision: boolean;
  // US$ por milhão de tokens: entrada, saída, leitura de cache
  price: [number, number, number];
}

let cached: { at: number; models: Map<string, CatalogModel> } | null = null;
let loading: Promise<Map<string, CatalogModel> | null> | null = null;

const perMillion = (value: unknown) => {
  const parsed = parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? Math.round(parsed * 1e9) / 1e3 : 0;
};

const fetchCatalog = async (): Promise<Map<string, CatalogModel> | null> => {
  try {
    const res = await fetch(CATALOG_URL, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    const models = new Map<string, CatalogModel>();
    (body?.data || []).forEach(
      (item: {
        id: string;
        name: string;
        pricing?: Record<string, string>;
        supported_parameters?: string[];
        architecture?: { input_modalities?: string[] };
      }) => {
        models.set(item.id, {
          id: item.id,
          name: item.name,
          reasoning: (item.supported_parameters || []).includes("reasoning"),
          vision: (item.architecture?.input_modalities || []).includes("image"),
          price: [
            perMillion(item.pricing?.prompt),
            perMillion(item.pricing?.completion),
            perMillion(item.pricing?.input_cache_read)
          ]
        });
      }
    );
    cached = { at: Date.now(), models };
    return models;
  } catch (error) {
    logger.warn({ error }, "DevPipeline: catálogo do OpenRouter indisponível");
    // o velho ainda serve melhor que nada
    return cached?.models || null;
  }
};

export const openRouterCatalog = async (): Promise<Map<
  string,
  CatalogModel
> | null> => {
  if (cached && Date.now() - cached.at < TTL) return cached.models;
  if (!loading) {
    loading = fetchCatalog().finally(() => {
      loading = null;
    });
  }
  return loading;
};

/**
 * O que se sabe de um modelo. Fora do catálogo (sem internet, ou nome
 * digitado errado), os modelos da tabela padrão contam como capazes de
 * raciocinar e enxergar; os outros, não, que é o que não quebra o pedido.
 */
export const modelInfo = async (id: string): Promise<CatalogModel> => {
  const found = (await openRouterCatalog())?.get(id);
  if (found) return found;
  const reference = REFERENCE_PRICES[id];
  return {
    id,
    name: id,
    reasoning: !!reference,
    vision: !!reference,
    price: reference || [0, 0, 0]
  };
};
