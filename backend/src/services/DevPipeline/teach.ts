import DevSkill from "../../models/DevSkill";
import { loadDevConfig } from "./config";
import { LlmError, parseJson } from "./llm";
import { callOpenRouter } from "./llmOpenRouter";
import { OPENROUTER_MODELS } from "./models";
import { costOf } from "./pricing";
import { saveLesson } from "./skills";
import {
  CONTEXT_INTRO,
  LEARNER_SCHEMA,
  LearnerReply,
  TEACHER
} from "./prompts";

// o que já se sabe vai inteiro, para a IA completar a skill certa em vez de
// criar outra parecida; com teto, porque isso é token em toda lição
const KNOWN_CHARS = 30000;

/**
 * O super ensina escrevendo do jeito dele (regra, preferência, explicação)
 * e a IA organiza numa skill: nova, ou uma versão melhor de uma existente.
 * Uma chamada curta, com pouco esforço. Entra em uso direto: foi ele que
 * escreveu.
 */
export const teachSkill = async (text: string): Promise<DevSkill> => {
  const config = await loadDevConfig();
  if (!config.apiKey) throw new LlmError("ERR_DEV_AI_NOT_CONFIGURED");

  const active = await DevSkill.findAll({
    where: { status: "active" },
    order: [["slug", "ASC"]]
  });
  let known = "";
  // eslint-disable-next-line no-restricted-syntax
  for (const skill of active) {
    const block = `### ${skill.slug} — ${skill.name}\nQuando usar: ${skill.description}\n${skill.content}\n\n`;
    if (known.length + block.length > KNOWN_CHARS) break;
    known += block;
  }

  // o mesmo modelo do Sabichão
  const chosen = OPENROUTER_MODELS.learner;
  const result = await callOpenRouter({
    apiKey: config.apiKey,
    model: chosen.model,
    fallbacks: chosen.fallbacks,
    timeoutMs: 4 * 60 * 1000,
    context: CONTEXT_INTRO,
    system: TEACHER,
    messages: [
      {
        role: "user",
        content: `## O que o dono do produto quer ensinar\n${text}\n\n## Skills que já existem\n${known || "(nenhuma)"}`
      }
    ],
    schema: LEARNER_SCHEMA,
    schemaName: "teach",
    effort: chosen.effort,
    maxTokens: 8000
  });
  const lesson = parseJson<LearnerReply>(result.text).lessons?.[0];
  if (!lesson || !String(lesson.content || "").trim()) {
    throw new LlmError("ERR_DEV_AI_FORMAT", "sem skill na resposta");
  }
  return saveLesson(lesson, {
    source: "human",
    active: true,
    costUsd: result.cost ?? (costOf(result.model, result.usage) || 0)
  });
};
