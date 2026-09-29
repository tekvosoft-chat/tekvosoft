import { Op } from "sequelize";
import DevSkill from "../../models/DevSkill";
import { DEFAULT_SKILLS } from "./defaultSkills";
import { LearnerReply } from "./prompts";
import { exportSkill } from "./skillSync";

/**
 * Skills: o que o time sabe, em pedaços. Economia de token: a triagem vê
 * só o índice (nome + quando usar, uma linha cada) e escolhe; o
 * desenvolvedor e o revisor recebem inteiras só as escolhidas (até 5).
 */
const MAX_PER_TASK = 5;
export const SKILL_LIMITS = { name: 80, description: 300, content: 6000 };

const unique = <T>(items: T[]) => [...new Set(items)];

export const slugify = (text: string): string =>
  String(text || "skill")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "skill";

/** Semeia as skills padrão que ainda não existem (pelo slug). */
export const ensureDefaultSkills = async (): Promise<void> => {
  const existing = await DevSkill.findAll({ attributes: ["slug"] });
  const have = new Set(existing.map(skill => skill.slug));
  const missing = DEFAULT_SKILLS.filter(seed => !have.has(seed.slug));
  if (!missing.length) return;
  await DevSkill.bulkCreate(
    missing.map(seed => ({ ...seed, source: "seed", status: "active" }))
  );
};

export const skillIndex = async (): Promise<string> => {
  const skills = await DevSkill.findAll({
    where: { status: "active" },
    attributes: ["slug", "name", "description"],
    order: [["slug", "ASC"]]
  });
  return skills
    .map(
      skill =>
        `- ${skill.slug}: ${skill.name}. Quando usar: ${skill.description}`
    )
    .join("\n");
};

/** As skills que vão inteiras para a tarefa, na ordem pedida. */
export const skillsFor = async (
  slugs: string[] = [],
  design = false
): Promise<DevSkill[]> => {
  const wanted = unique([...(design ? ["design-ui"] : []), ...slugs]).slice(
    0,
    MAX_PER_TASK
  );
  if (!wanted.length) return [];
  const skills = await DevSkill.findAll({
    where: { slug: { [Op.in]: wanted }, status: "active" }
  });
  return wanted
    .map(slug => skills.find(skill => skill.slug === slug))
    .filter(Boolean);
};

export const skillsText = (skills: DevSkill[]): string =>
  skills.length
    ? `## Skills do time (valem como regra)\n\n${skills
        .map(skill => `### ${skill.name}\n${skill.content}`)
        .join("\n\n")}`
    : "";

export const markUsed = async (skills: DevSkill[]): Promise<void> => {
  if (!skills.length) return;
  await DevSkill.increment("uses", {
    by: 1,
    where: { id: { [Op.in]: skills.map(skill => skill.id) } }
  });
  await DevSkill.update(
    { lastUsedAt: new Date() },
    { where: { id: { [Op.in]: skills.map(skill => skill.id) } } }
  );
};

const clean = (value: unknown, max: number) =>
  String(value || "")
    .trim()
    .slice(0, max);

/**
 * Grava uma lição (do Sabichão ou de um texto ensinado). Nova versão de
 * skill existente não apaga a antiga: ela fica arquivada (ou continua em
 * uso até a proposta ser aprovada), com o histórico preservado.
 */
export const saveLesson = async (
  lesson: LearnerReply["lessons"][number],
  options: {
    source: "agent" | "human";
    active: boolean;
    fromTaskId?: number;
    costUsd?: number;
  }
): Promise<DevSkill> => {
  const status = options.active ? "active" : "proposed";
  const fields = {
    name: clean(lesson.name, SKILL_LIMITS.name) || "Skill",
    description: clean(lesson.description, SKILL_LIMITS.description) || "-",
    content: clean(lesson.content, SKILL_LIMITS.content),
    reason: clean(lesson.reason, 1000),
    source: options.source,
    status,
    fromTaskId: options.fromTaskId || null,
    costUsd: options.costUsd || 0
  };

  const target =
    lesson.action === "update"
      ? await DevSkill.findOne({
          where: { slug: slugify(lesson.slug), status: "active" }
        })
      : null;

  if (target) {
    // versão nova bem menor que a atual quase sempre é resumo que perdeu
    // detalhe: não entra sozinha, vira proposta para o super comparar
    const shrank = fields.content.length < target.content.length * 0.8;
    const active = options.active && !shrank;
    const next = await DevSkill.create({
      ...fields,
      status: active ? "active" : "proposed",
      slug: target.slug,
      replacesId: target.id
    });
    if (active) {
      await target.update({ status: "archived" });
      try {
        await exportSkill(next);
      } catch {
        // exportar é melhor esforço: erro aqui não bloqueia o fluxo
      }
    }
    return next;
  }

  // assunto novo: slug livre entre as skills em uso ou propostas
  const base = slugify(lesson.slug || lesson.name);
  const taken = await DevSkill.findAll({
    where: {
      slug: { [Op.like]: `${base}%` },
      status: { [Op.ne]: "archived" }
    },
    attributes: ["slug"]
  });
  const used = new Set(taken.map(skill => skill.slug));
  let slug = base;
  for (let n = 2; used.has(slug); n += 1) slug = `${base}-${n}`;
  const created = await DevSkill.create({ ...fields, slug });
  if (status === "active") {
    try {
      await exportSkill(created);
    } catch {
      // sincronização com o repositório é melhor esforço
    }
  }
  return created;
};

/** Aprova uma proposta: entra em uso e a versão que ela substitui sai. */
export const approveSkill = async (skill: DevSkill): Promise<DevSkill> => {
  if (skill.replacesId) {
    await DevSkill.update(
      { status: "archived" },
      { where: { id: skill.replacesId, status: "active" } }
    );
  }
  await skill.update({ status: "active" });
  try {
    await exportSkill(skill);
  } catch {
    // erro ao exportar não impede aprovar
  }
  return skill;
};
