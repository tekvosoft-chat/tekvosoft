import { Request, Response } from "express";

import AppError from "../errors/AppError";
import Company from "../models/Company";
import DevTask, { DevFeedback } from "../models/DevTask";
import DevTaskEvent from "../models/DevTaskEvent";
import SupportMessage from "../models/SupportMessage";
import SupportTicket from "../models/SupportTicket";
import User from "../models/User";
import { loadDevConfig } from "../services/DevPipeline/config";
import { openRepo } from "../services/DevPipeline/repo";
import { pullMerged, testFeedback } from "../services/DevPipeline/agents";
import { OPENROUTER_MODELS, SLOTS } from "../services/DevPipeline/models";
import { modelInfo } from "../services/DevPipeline/catalog";
import { browserReady } from "../services/DevPipeline/testRunner";
import { usdToBrl } from "../services/DevPipeline/pricing";
import {
  attachmentsOf,
  filePath,
  publicAttachments,
  removeImages
} from "../services/DevPipeline/images";
import DevSkill from "../models/DevSkill";
import {
  addDevEvent,
  createDevTaskFromSupport,
  emitDevTask,
  enqueueDevTask,
  enqueueLearning,
  mergedDevTask,
  moveDevTask
} from "../services/DevPipeline/pipeline";
import { logger } from "../utils/logger";

/**
 * Painel do pipeline de IA (só o super). A tarefa anda sozinha entre as
 * etapas; daqui saem as decisões de gente: aprovar para desenvolvimento,
 * responder o agente, pedir ajuste, publicar, concluir ou cancelar.
 */

const PRIORITIES = ["urgent", "high", "normal", "low"];

// o quadro não precisa do código alterado nem do diff: vão só no detalhe
const LIST_ATTRIBUTES = [
  "id",
  "title",
  "source",
  "companyId",
  "requesterId",
  "supportTicketId",
  "stage",
  "status",
  "priority",
  "kind",
  "effort",
  "difficulty",
  "risk",
  "questions",
  "reviewRound",
  "verdict",
  "branch",
  "prUrl",
  "prNumber",
  "error",
  "tokensIn",
  "tokensOut",
  "tokensCached",
  "costUsd",
  "design",
  "testVerdict",
  "createdAt",
  "updatedAt"
];

const people = [
  { model: Company, as: "company", attributes: ["id", "name"] },
  { model: User, as: "requester", attributes: ["id", "name"] }
];

const load = async (id: string | number) => {
  const task = await DevTask.findByPk(id, { include: people });
  if (!task) throw new AppError("ERR_NOT_FOUND", 404);
  return task;
};

const busy = (task: DevTask) => ["queued", "running"].includes(task.status);
const closed = (task: DevTask) => ["done", "cancelled"].includes(task.stage);

const text = (value: unknown, max: number) =>
  String(value || "")
    .trim()
    .slice(0, max);

const userOf = (req: Request) => Number(req.user.id);

/** Quem usa qual modelo, com o preço do dia (catálogo do OpenRouter). */
const teamModels = async () =>
  Promise.all(
    SLOTS.map(async slot => {
      const { model, fallbacks, effort } = OPENROUTER_MODELS[slot];
      const info = await modelInfo(model);
      return {
        slot,
        model,
        name: info.name,
        fallbacks,
        effort,
        vision: info.vision,
        // US$ por milhão de tokens: entrada, saída, leitura de cache
        price: info.price
      };
    })
  );

/** O que está configurado: a tela avisa o que falta antes de alguém tentar. */
export const setup = async (req: Request, res: Response): Promise<Response> => {
  const config = await loadDevConfig();
  const repo = openRepo(config);
  return res.json({
    models: await teamModels(),
    // navegador do testador: sem ele, a demanda conclui no merge
    browser: browserReady(),
    hasKey: !!config.apiKey,
    repo: repo
      ? { kind: repo.kind, label: repo.label, canPublish: repo.canPublish }
      : null,
    autoApprove: config.autoApprove,
    autoTriage: config.autoTriage,
    autoLearn: config.autoLearn,
    reviewRounds: config.reviewRounds,
    tokenLimit: config.tokenLimit,
    usdBrl: await usdToBrl()
  });
};

type Files = Express.Multer.File[] | undefined;

// o multipart manda tudo como texto: "false" também é verdadeiro
const truthy = (value: unknown) => value === true || value === "true";

export const index = async (req: Request, res: Response): Promise<Response> => {
  const tasks = await DevTask.findAll({
    attributes: LIST_ATTRIBUTES,
    include: people,
    order: [["updatedAt", "DESC"]],
    limit: 300
  });
  return res.json(tasks);
};

// conferência de PR no GitHub: no máximo uma por minuto por tarefa
const lastPullCheck = new Map<number, number>();

const syncPull = async (task: DevTask) => {
  if (task.stage !== "pr" || !task.prNumber || busy(task)) return;
  if (Date.now() - (lastPullCheck.get(task.id) || 0) < 60000) return;
  lastPullCheck.set(task.id, Date.now());
  const repo = openRepo(await loadDevConfig());
  const mergeSha = repo ? await pullMerged(task, repo) : null;
  // aceito: vai para os testes (ou conclui, sem navegador)
  if (mergeSha) await mergedDevTask(task, mergeSha, repo);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const task = await load(req.params.id);
  await syncPull(task).catch(error =>
    logger.warn({ error, taskId: task.id }, "DevPipeline: conferir PR")
  );
  const events = await DevTaskEvent.findAll({
    where: { taskId: task.id },
    include: [{ model: User, as: "user", attributes: ["id", "name"] }],
    order: [["id", "ASC"]]
  });
  const { changes, attachments, ...data } = task.toJSON() as DevTask;
  return res.json({
    ...data,
    attachments: publicAttachments(attachments),
    changedFiles: (changes || []).map(change => ({
      path: change.path,
      op: change.op
    })),
    events
  });
};

/** Demanda aberta pelo super: a triagem já começa. */
export const store = async (req: Request, res: Response): Promise<Response> => {
  const title = text(req.body.title, 200);
  const description = text(req.body.description, 10000);
  if (!title) throw new AppError("ERR_DEV_TITLE_REQUIRED", 400);

  const task = await DevTask.create({
    title,
    description,
    source: "admin",
    companyId: req.user.companyId,
    requesterId: userOf(req),
    priority: PRIORITIES.includes(req.body.priority)
      ? req.body.priority
      : "normal",
    stage: "intake",
    status: "waiting"
  });
  const request = await addDevEvent(
    task,
    "human",
    "request",
    description || title,
    {},
    userOf(req)
  );
  const images = attachmentsOf(req.files as Files, request.id);
  if (images.length) {
    await task.update({ attachments: images });
    await request.update({
      meta: { images: images.map(image => image.id) }
    });
  }
  await enqueueDevTask(task);
  emitDevTask(task.id, "create");
  return res.status(201).json(task);
};

/** Ajuste feito à mão na especificação, nos critérios ou na prioridade. */
export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const task = await load(req.params.id);
  if (busy(task)) throw new AppError("ERR_DEV_BUSY", 409);

  const changes: Partial<DevTask> = {};
  if (req.body.title !== undefined) {
    changes.title = text(req.body.title, 200) || task.title;
  }
  if (req.body.spec !== undefined) changes.spec = text(req.body.spec, 20000);
  if (Array.isArray(req.body.acceptance)) {
    changes.acceptance = req.body.acceptance
      .map((item: unknown) => text(item, 500))
      .filter(Boolean)
      .slice(0, 12);
  }
  if (PRIORITIES.includes(req.body.priority)) {
    changes.priority = req.body.priority;
  }
  await task.update(changes);
  emitDevTask(task.id);
  return res.json(task);
};

/** Priorização aprovada: o código começa. */
export const approve = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const task = await load(req.params.id);
  if (task.stage !== "prioritization" || busy(task)) {
    throw new AppError("ERR_DEV_INVALID_STAGE", 409);
  }
  const priority = PRIORITIES.includes(req.body.priority)
    ? req.body.priority
    : task.priority;
  await task.update({ priority, reviewRound: 0, verdict: null, feedback: [] });
  await addDevEvent(task, "human", "approve", "", { priority }, userOf(req));
  await moveDevTask(task, "development", "queued");
  await enqueueDevTask(task);
  return res.json(task);
};

/** Roda de novo a etapa que falhou (ou a triagem que ainda não rodou). */
export const retry = async (req: Request, res: Response): Promise<Response> => {
  const task = await load(req.params.id);
  const allowed =
    task.status === "error" ||
    (task.stage === "intake" && task.status === "waiting");
  if (!allowed) throw new AppError("ERR_DEV_INVALID_STAGE", 409);
  await enqueueDevTask(task);
  return res.json(task);
};

/**
 * Comentário da pessoa na conversa. Com rerun, ele vira instrução: volta
 * para a triagem (antes do código) ou para o desenvolvedor (depois).
 */
export const comment = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const task = await load(req.params.id);
  const body = text(req.body.body, 5000);
  const files = req.files as Files;
  if (!body && !files?.length) {
    throw new AppError("ERR_DEV_COMMENT_REQUIRED", 400);
  }
  const rerun = truthy(req.body.rerun);
  if (rerun && (busy(task) || task.stage === "cancelled")) {
    throw new AppError("ERR_DEV_BUSY", 409);
  }

  // imagem do comentário entra na demanda: os próximos agentes enxergam
  const event = await addDevEvent(
    task,
    "human",
    "comment",
    body,
    { rerun },
    userOf(req)
  );
  const images = attachmentsOf(files, event.id);
  if (images.length) {
    await task.update({
      attachments: [...(task.attachments || []), ...images]
    });
    await event.update({
      meta: { rerun, images: images.map(image => image.id) }
    });
  }
  if (!rerun) return res.json(task);

  const feedback: DevFeedback[] = [
    ...(task.feedback || []),
    {
      from: "human",
      text: body || "Veja a imagem que anexei nesta mensagem."
    }
  ];
  if (["intake", "prioritization"].includes(task.stage)) {
    await task.update({ feedback });
    await moveDevTask(task, "intake", "queued");
  } else {
    // teste reprovado: o que o Clique viu na tela vai junto com o pedido
    const tested = task.stage === "tests" ? await testFeedback(task) : [];
    await task.update({
      feedback: [...tested, ...feedback],
      reviewRound: 0,
      verdict: null,
      // código novo, teste novo
      testPlan: null,
      testVerdict: null
    });
    await moveDevTask(task, "development", "queued");
  }
  await enqueueDevTask(task);
  return res.json(task);
};

/** O revisor não aprovou depois de todas as rodadas; a pessoa publica assim. */
export const publish = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const task = await load(req.params.id);
  if (task.stage !== "review" || task.status !== "waiting") {
    throw new AppError("ERR_DEV_INVALID_STAGE", 409);
  }
  await addDevEvent(task, "human", "publish", "", {}, userOf(req));
  await moveDevTask(task, "pr", "queued");
  await enqueueDevTask(task);
  return res.json(task);
};

/**
 * Roda o teste de tela agora: depois do merge, quando a versão já subiu e a
 * conferência automática não percebeu (versão feita à mão), ou no ambiente
 * de dev, depois de aplicar o patch. Rodar de novo reaproveita o roteiro.
 */
export const runTests = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const task = await load(req.params.id);
  if (busy(task) || !["pr", "tests", "done"].includes(task.stage)) {
    throw new AppError("ERR_DEV_INVALID_STAGE", 409);
  }
  if (!browserReady()) throw new AppError("ERR_DEV_TEST_NO_BROWSER", 409);
  // o testador tinha achado que não precisava: quem pediu quer ver
  const plan = task.testPlan?.needed === false ? null : task.testPlan;
  await task.update({ testPlan: plan, testVerdict: null });
  await addDevEvent(task, "human", "test", "", {}, userOf(req));
  await moveDevTask(task, "tests", "queued");
  await enqueueDevTask(task);
  return res.json(task);
};

export const finish = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const task = await load(req.params.id);
  if (busy(task) || closed(task)) {
    throw new AppError("ERR_DEV_INVALID_STAGE", 409);
  }
  await addDevEvent(task, "human", "done", "", {}, userOf(req));
  await moveDevTask(task, "done", "idle");
  return res.json(task);
};

/** Cancela; se um agente estiver rodando, ele para antes da próxima chamada. */
export const cancel = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const task = await load(req.params.id);
  if (closed(task)) throw new AppError("ERR_DEV_INVALID_STAGE", 409);
  await addDevEvent(
    task,
    "human",
    "cancel",
    text(req.body.reason, 1000),
    {},
    userOf(req)
  );
  await moveDevTask(task, "cancelled", "idle");
  return res.json(task);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const task = await load(req.params.id);
  if (busy(task)) throw new AppError("ERR_DEV_BUSY", 409);
  await removeImages(task);
  await task.destroy();
  emitDevTask(task.id, "delete");
  return res.status(204).send();
};

/** Imagem anexada, só para o super (a pasta não é pública). */
export const file = async (
  req: Request,
  res: Response
): Promise<Response | void> => {
  const task = await load(req.params.id);
  const attachment = (task.attachments || []).find(
    item => item.id === req.params.fileId
  );
  const full = attachment && filePath(attachment);
  if (!full) throw new AppError("ERR_NOT_FOUND", 404);
  res.setHeader("Content-Type", attachment.mimetype);
  res.setHeader("Cache-Control", "private, max-age=86400");
  return res.sendFile(full);
};

/** "Aprender com esta demanda": o Sabichão estuda e propõe skills. */
export const learnNow = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const task = await load(req.params.id);
  await enqueueLearning(task);
  return res.json({ ok: true });
};

const weekOf = (date: Date) => {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  // semana começa na segunda
  day.setDate(day.getDate() - ((day.getDay() + 6) % 7));
  return day.toISOString().slice(0, 10);
};

/**
 * Números do quadro: quantas concluíram, quantas faltam, quanto já custou
 * (demandas + skills ensinadas) e quem abriu. As semanas são as últimas 8.
 */
export const stats = async (req: Request, res: Response): Promise<Response> => {
  const [tasks, doneEvents, skillsCost, usdBrl, proposedSkills] =
    await Promise.all([
      DevTask.findAll({
        attributes: [
          "id",
          "stage",
          "source",
          "companyId",
          "costUsd",
          "tokensIn",
          "tokensOut",
          "createdAt"
        ],
        include: [{ model: Company, as: "company", attributes: ["id", "name"] }]
      }),
      DevTaskEvent.findAll({
        where: { agent: "system", kind: "stage", content: "done" },
        attributes: ["taskId", "createdAt"]
      }),
      DevSkill.sum("costUsd"),
      usdToBrl(),
      DevSkill.count({ where: { status: "proposed" } })
    ]);

  const count = (stage: string) =>
    tasks.filter(task => task.stage === stage).length;
  const open = tasks.filter(
    task => !["done", "cancelled"].includes(task.stage)
  );
  const doneTasks = tasks.filter(task => task.stage === "done");
  const tasksCost = tasks.reduce((sum, task) => sum + (task.costUsd || 0), 0);

  // quem abriu: o time (super) ou cada empresa cliente
  const openers = new Map<string, { name: string; count: number }>();
  tasks.forEach(task => {
    const key = task.source === "help" ? `c${task.companyId}` : "team";
    const name = task.source === "help" ? task.company?.name || "—" : "";
    const item = openers.get(key) || { name, count: 0 };
    item.count += 1;
    openers.set(key, item);
  });
  const byOpener = [...openers.entries()]
    .map(([key, item]) => ({ key, ...item }))
    .sort((a, b) => b.count - a.count);

  const weeks: string[] = [];
  const start = new Date();
  for (let i = 7; i >= 0; i -= 1) {
    const day = new Date(start);
    day.setDate(day.getDate() - i * 7);
    weeks.push(weekOf(day));
  }
  const doneAt = new Map<number, Date>();
  doneEvents.forEach(event => doneAt.set(event.taskId, event.createdAt));
  const weekly = weeks.map(week => ({
    week,
    created: tasks.filter(task => weekOf(task.createdAt) === week).length,
    done: doneTasks.filter(
      task => doneAt.has(task.id) && weekOf(doneAt.get(task.id)) === week
    ).length,
    costUsd: tasks
      .filter(task => weekOf(task.createdAt) === week)
      .reduce((sum, task) => sum + (task.costUsd || 0), 0)
  }));

  return res.json({
    total: tasks.length,
    done: doneTasks.length,
    open: open.length,
    cancelled: count("cancelled"),
    waitingApproval: count("prioritization"),
    bySource: {
      team: tasks.filter(task => task.source !== "help").length,
      help: tasks.filter(task => task.source === "help").length
    },
    byOpener: byOpener.slice(0, 6),
    weekly,
    costUsd: tasksCost + (skillsCost || 0),
    skillsCostUsd: skillsCost || 0,
    doneCostUsd: doneTasks.reduce((sum, task) => sum + (task.costUsd || 0), 0),
    tokens: tasks.reduce(
      (sum, task) => sum + (task.tokensIn || 0) + (task.tokensOut || 0),
      0
    ),
    usdBrl,
    proposedSkills
  });
};

/** O diff como arquivo, para aplicar com git apply quando não há PR. */
export const patch = async (req: Request, res: Response): Promise<Response> => {
  const task = await load(req.params.id);
  if (!task.diff) throw new AppError("ERR_NOT_FOUND", 404);
  res.setHeader("Content-Type", "text/x-diff; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="tarefa-${task.id}.patch"`
  );
  return res.send(`${task.diff}\n`);
};

/** O super leva um chamado da Ajuda para o pipeline. */
export const fromSupport = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const ticket = await SupportTicket.findByPk(req.params.ticketId);
  if (!ticket) throw new AppError("ERR_NOT_FOUND", 404);
  const messages = await SupportMessage.findAll({
    where: { ticketId: ticket.id, kind: "message", fromSupport: false },
    order: [["createdAt", "ASC"]],
    limit: 5
  });
  const body = messages
    .map(message => message.body)
    .filter(Boolean)
    .join("\n\n");
  const task = await createDevTaskFromSupport(
    ticket,
    body || ticket.subject,
    true
  );
  return res.status(201).json(task);
};
