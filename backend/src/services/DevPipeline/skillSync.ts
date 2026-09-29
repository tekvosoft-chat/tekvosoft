import fs from "fs";
import path from "path";
import DevSkill from "../../models/DevSkill";
import { loadDevConfig } from "./config";
import { openRepo } from "./repo";
import { Workspace } from "./workspace";
import { logger } from "../../utils/logger";

// Diretório canônico no repositório para versionar as skills
const SKILLS_DIR = "backend/src/services/DevPipeline/skills-data";

const stamp = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    d.getFullYear().toString() +
    p(d.getMonth() + 1) +
    p(d.getDate()) +
    p(d.getHours()) +
    p(d.getMinutes()) +
    p(d.getSeconds())
  );
};

const savePatchFile = async (slug: string, patch: string): Promise<string> => {
  // Arquivo local só para referência/baixa quando não há PR (mesmo padrão do pipeline: vira patch)
  const outDir = path.resolve(__dirname, "../../../private/dev-pipeline");
  await fs.promises.mkdir(outDir, { recursive: true });
  const file = path.join(outDir, `skills-sync-${stamp()}-${slug}.patch`);
  await fs.promises.writeFile(file, patch, "utf8");
  return file;
};

// JSON mínimo que a IA consome (sem ids/tenant/metadados sensíveis).
const skillToFile = (skill: DevSkill) => ({
  slug: skill.slug,
  name: skill.name,
  description: skill.description || "",
  content: skill.content || "",
  costUsd: Number(skill.costUsd || 0),
  updatedAt: new Date().toISOString()
});

/**
 * Exporta uma skill aprovada para o repositório (PR automático) ou salva um
 * patch unificado quando não há token. Melhor esforço: falha aqui não bloqueia
 * o fluxo de aprovação/atualização.
 */
export const exportSkill = async (skill: DevSkill): Promise<void> => {
  try {
    if (!skill || skill.status !== "active") return; // só skills aprovadas

    const config = await loadDevConfig();
    const repo = openRepo(config);
    if (!repo) {
      logger.warn(
        "DevPipeline: export de skill sem repositório (_devGithubRepo não configurado)"
      );
      return;
    }

    const baseSha = await repo.head();
    const filePath = `${SKILLS_DIR}/${skill.slug}.json`;
    const content = `${JSON.stringify(skillToFile(skill), null, 2)}\n`;

    // Monta as mudanças em memória, em cima do commit base
    const workspace = new Workspace(repo, baseSha);
    await workspace.apply([
      { path: filePath, op: "create", search: "", replace: content }
    ]);
    const changes = await workspace.changes();
    if (!changes.length) {
      logger.info(
        { slug: skill.slug, filePath },
        "DevPipeline: export de skill sem mudanças"
      );
      return;
    }

    const branch = `skills/sync-${stamp()}`;
    if (repo.canPublish) {
      const title = `Sync DevPipeline skills: ${skill.slug}`;
      const body = [
        `Atualiza/adiciona a skill '${skill.slug}' em ${SKILLS_DIR}.`,
        "Conteúdo proposto:",
        "\n```json\n" + content.trimEnd() + "\n```"
      ]
        .filter(Boolean)
        .join("\n\n");
      const message = `DevPipeline: sync skill '${skill.slug}'`;
      const pr = await repo.publish({
        baseSha,
        branch,
        title,
        body,
        message,
        changes
      });
      logger.info(
        { slug: skill.slug, url: pr.url, number: pr.number },
        "DevPipeline: PR de skills aberto"
      );
    } else {
      const patch = await workspace.diff();
      const out = await savePatchFile(skill.slug, patch);
      logger.info(
        { slug: skill.slug, file: out, reason: repo.kind === "local" ? "local" : "no_token" },
        "DevPipeline: skills patch salvo (sem PR)"
      );
    }
  } catch (error) {
    logger.warn({ error, slug: skill?.slug }, "DevPipeline: export de skill falhou");
  }
};

/**
 * Importa skills do diretório canônico no repositório (somente leitura).
 * Cria por slug quando ainda não existem no banco; nunca sobrescreve
 * conteúdo existente (o painel/DB é a fonte de edição).
 */
export const importSkillsFromRepo = async (): Promise<void> => {
  try {
    const config = await loadDevConfig();
    const repo = openRepo(config);
    if (!repo) {
      logger.info(
        "DevPipeline: sem repositório para importar skills (configure _devGithubRepo ou DEV_PIPELINE_REPO_PATH)"
      );
      return;
    }

    const sha = await repo.head();
    const files = await repo.list(sha);
    const prefix = `${SKILLS_DIR}/`;
    const items = files.filter(
      f => f.path.startsWith(prefix) && f.path.endsWith(".json")
    );

    // eslint-disable-next-line no-restricted-syntax
    for (const item of items) {
      try {
        const raw = await repo.read(sha, item.path);
        if (!raw) continue;
        const data = JSON.parse(raw) as {
          slug?: string;
          name?: string;
          title?: string;
          description?: string;
          content?: string;
          body?: string;
          costUsd?: number;
          cost?: number;
        };
        const slug = String(
          (data.slug || path.posix.basename(item.path, ".json") || "").trim()
        );
        const name = String((data.name || data.title || "").trim());
        const content = String((data.content || data.body || "").trim());
        const description = String((data.description || "").trim());
        const costUsd = Number(data.costUsd || data.cost || 0) || 0;
        if (!slug || !name || !content) {
          logger.warn(
            { path: item.path },
            "DevPipeline: skill no repositório ignorada (faltam slug/name/content)"
          );
          // eslint-disable-next-line no-continue
          continue;
        }
        const existing = await DevSkill.findOne({ where: { slug } });
        if (existing) continue; // não sobrescreve quem já existe no banco
        await DevSkill.create({
          slug,
          name,
          description,
          content,
          status: "active",
          source: "repo",
          costUsd
        });
        logger.info({ slug }, "DevPipeline: skill importada do repositório");
      } catch (err) {
        logger.warn({ path: item.path, err }, "DevPipeline: skill JSON inválido");
      }
    }
  } catch (error) {
    logger.warn({ error }, "DevPipeline: import de skills falhou");
  }
};
