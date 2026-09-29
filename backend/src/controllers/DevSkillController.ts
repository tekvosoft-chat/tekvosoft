import { Request, Response } from "express";

import AppError from "../errors/AppError";
import DevSkill from "../models/DevSkill";
import DevTask from "../models/DevTask";
import { getIO } from "../libs/socket";
import {
  SKILL_LIMITS,
  approveSkill,
  saveLesson
} from "../services/DevPipeline/skills";
import { teachSkill } from "../services/DevPipeline/teach";
import { LlmError } from "../services/DevPipeline/llm";
import { exportSkill } from "../services/DevPipeline/skillSync";

/**
 * Skills do pipeline de IA (só o super): o que o time sabe, para os
 * agentes consumirem. Ele escreve, ensina com texto livre (a IA organiza),
 * aprova o que o Sabichão aprendeu e arquiva o que não serve mais.
 */

const text = (value: unknown, max: number) =>
  String(value || "")
    .trim()
    .slice(0, max);

const emit = () => {
  getIO().to("super").emit("dev-skill", { action: "update" });
};

const load = async (id: string) => {
  const skill = await DevSkill.findByPk(id);
  if (!skill) throw new AppError("ERR_NOT_FOUND", 404);
  return skill;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const skills = await DevSkill.findAll({
    include: [
      { model: DevTask, as: "fromTask", attributes: ["id", "title"] },
      { model: DevSkill, as: "replaces", attributes: ["id", "name", "content"] }
    ],
    order: [["updatedAt", "DESC"]]
  });
  return res.json(skills);
};

/** Skill escrita à mão: entra em uso na hora. */
export const store = async (req: Request, res: Response): Promise<Response> => {
  const name = text(req.body.name, SKILL_LIMITS.name);
  const content = text(req.body.content, SKILL_LIMITS.content);
  if (!name || !content) throw new AppError("ERR_DEV_SKILL_REQUIRED", 400);
  const skill = await saveLesson(
    {
      action: "create",
      slug: name,
      name,
      description: text(req.body.description, SKILL_LIMITS.description),
      content,
      reason: ""
    },
    { source: "human", active: true }
  );
  emit();
  return res.status(201).json(skill);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const skill = await load(req.params.id);
  const changes: Partial<DevSkill> = {};
  if (req.body.name !== undefined) {
    changes.name = text(req.body.name, SKILL_LIMITS.name) || skill.name;
  }
  if (req.body.description !== undefined) {
    changes.description = text(req.body.description, SKILL_LIMITS.description);
  }
  if (req.body.content !== undefined) {
    changes.content =
      text(req.body.content, SKILL_LIMITS.content) || skill.content;
  }
  // arquivar e reativar; proposta só entra em uso pelo aprovar
  if (["active", "archived"].includes(req.body.status)) {
    if (skill.status === "proposed" && req.body.status === "active") {
      throw new AppError("ERR_DEV_INVALID_STAGE", 409);
    }
    changes.status = req.body.status;
  }
  await skill.update(changes);
  if (skill.status === "active") {
    try {
      await exportSkill(skill);
    } catch {
      // sincronização com o repositório é melhor esforço
    }
  }
  emit();
  return res.json(skill);
};

export const approve = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const skill = await load(req.params.id);
  if (skill.status !== "proposed") {
    throw new AppError("ERR_DEV_INVALID_STAGE", 409);
  }
  await approveSkill(skill);
  emit();
  return res.json(skill);
};

/** Semente não some (voltaria ao reiniciar): vai para o arquivo. */
export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const skill = await load(req.params.id);
  if (skill.source === "seed") await skill.update({ status: "archived" });
  else await skill.destroy();
  emit();
  return res.status(204).send();
};

export const teach = async (req: Request, res: Response): Promise<Response> => {
  const body = text(req.body.text, 8000);
  if (!body) throw new AppError("ERR_DEV_SKILL_REQUIRED", 400);
  try {
    const skill = await teachSkill(body);
    emit();
    return res.status(201).json(skill);
  } catch (error) {
    // erro da IA vira código que a tela traduz (chave recusada, sem saldo...)
    if (error instanceof LlmError) {
      throw new AppError(error.code, 400);
    }
    throw error;
  }
};
