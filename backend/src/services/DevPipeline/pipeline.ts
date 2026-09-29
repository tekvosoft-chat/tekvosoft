import path from "path";
import Queue from "bull";
import { Op } from "sequelize";
import { getIO } from "../../libs/socket";
import { logger } from "../../utils/logger";
import DevTask from "../../models/DevTask";
import DevTaskEvent from "../../models/DevTaskEvent";
import SupportTicket from "../../models/SupportTicket";
import SupportMessage from "../../models/SupportMessage";
import supportFiles from "../../config/supportFiles";
import { DevConfig, loadDevConfig } from "./config";
import { RepoSource, openRepo } from "./repo";
import { costOf } from "./pricing";
import { LlmUsage } from "./llm";
import { copyImage } from "./images";
import { ensureDefaultSkills } from "./skills";
import {
  Cancelled,
  DevError,
  RunContext,
  develop,
  learn,
  publish,
  review,
  triage,
  unfinishedTasks
} from "./agents";

/**
 * Orquestra as etapas. Uma fila Bull com uma tarefa por vez: o pipeline
 * nunca dispara vários agentes em paralelo (nem gasta tokens em paralelo).
 * Urgente passa na frente. A tarefa anda sozinha até precisar de alguém:
 * aprovar antes do código, responder uma pergunta ou decidir depois de
 * muitas rodadas de revisão.
 *
 *   intake -> prioritization -> development <-> review -> pr -> done
 */
const connection = process.env.REDIS_URI || "";
export const devPipelineQueue = new Queue("DevPipeline", connection);

const PRIORITY_RANK: Record<string, number> = {
  urgent: 1,
  high: 2,
  normal: 3,
  low: 4
};

// etapas que o cliente vê na conversa da Ajuda (revisão é coisa interna)
const CLIENT_STAGES = [
  "intake",
  "prioritization",
  "development",
  "pr",
  "done",
  "cancelled"
];

export const emitDevTask = (taskId: number, action = "update"): void => {
  try {
    getIO().to("super").emit("dev-task", { action, taskId });
  } catch (error) {
    logger.warn({ error }, "DevPipeline: socket indisponível");
  }
};

export const addDevEvent = async (
  task: DevTask,
  agent: string,
  kind: string,
  content: string,
  meta: Record<string, unknown> = {},
  userId: number = null
): Promise<DevTaskEvent> => {
  const event = await DevTaskEvent.create({
    taskId: task.id,
    agent,
    kind,
    content: content || "",
    meta,
    userId
  });
  emitDevTask(task.id, "event");
  return event;
};

/** Conta para o cliente, na conversa da Ajuda, em que pé está o pedido. */
const notifyClient = async (task: DevTask, stage: string) => {
  if (!task.supportTicketId || !CLIENT_STAGES.includes(stage)) return;
  const ticket = await SupportTicket.findByPk(task.supportTicketId);
  if (!ticket) return;
  await SupportMessage.create({
    ticketId: ticket.id,
    userId: null,
    fromSupport: true,
    kind: "pipeline",
    body: stage
  });
  await ticket.update({ unreadByClient: true, lastMessageAt: new Date() });
  getIO()
    .to("super")
    .to(`company-${ticket.companyId}-mainchannel`)
    .emit("support-ticket", {
      action: "message",
      ticketId: ticket.id,
      companyId: ticket.companyId
    });
};

export const moveDevTask = async (
  task: DevTask,
  stage: string,
  status: string
): Promise<void> => {
  const changed = stage !== task.stage;
  await task.update({
    stage,
    status,
    ...(status === "error" ? {} : { error: null })
  });
  if (changed) {
    await addDevEvent(task, "system", "stage", stage);
    await notifyClient(task, stage).catch(error =>
      logger.warn({ error, taskId: task.id }, "DevPipeline: aviso ao cliente")
    );
  }
  emitDevTask(task.id);
};

/** Põe a tarefa na fila para rodar a etapa em que ela está. */
export const enqueueDevTask = async (task: DevTask): Promise<void> => {
  await task.update({ status: "queued", error: null });
  await devPipelineQueue.add(
    "run",
    { taskId: task.id },
    {
      // um job por tarefa: clicar duas vezes não roda a etapa duas vezes
      jobId: `dev-${task.id}`,
      priority: PRIORITY_RANK[task.priority] || 3,
      removeOnComplete: true,
      removeOnFail: true
    }
  );
  emitDevTask(task.id);
};

const contextOf = (
  task: DevTask,
  config: DevConfig,
  repo: RepoSource
): RunContext => ({
  task,
  config,
  repo,
  say: async (agent, kind, content, meta) => {
    await addDevEvent(task, agent, kind, content, meta);
  },
  isCancelled: async () => {
    const fresh = await DevTask.findByPk(task.id, { attributes: ["stage"] });
    return !fresh || fresh.stage === "cancelled";
  }
});

const errorOf = (error: unknown) => ({
  code: (error as DevError).code || "ERR_DEV_FAILED",
  detail: (error as DevError).detail ?? String((error as Error)?.message || "")
});

const runTask = async (taskId: number): Promise<void> => {
  const task = await DevTask.findByPk(taskId);
  // cancelada, apagada ou já rodando em outro job
  if (!task || task.status !== "queued") return;

  const config = await loadDevConfig();
  const repo = openRepo(config);
  const ctx = contextOf(task, config, repo);

  try {
    if (!config.apiKey) throw new DevError("ERR_DEV_AI_NOT_CONFIGURED");
    if (!repo) throw new DevError("ERR_DEV_NO_REPO");
    await task.update({ status: "running" });
    emitDevTask(task.id);

    // cada volta do laço roda uma etapa; o limite só evita laço infinito
    for (let step = 0; step < 20; step += 1) {
      if (await ctx.isCancelled()) return;

      if (task.stage === "intake") {
        const outcome = await triage(ctx);
        if (outcome === "questions") {
          await moveDevTask(task, "intake", "waiting");
          return;
        }
        if (!config.autoApprove) {
          await moveDevTask(task, "prioritization", "waiting");
          return;
        }

        await moveDevTask(task, "prioritization", "running");

        await moveDevTask(task, "development", "running");
      } else if (task.stage === "prioritization") {
        await moveDevTask(task, "development", "running");
      } else if (task.stage === "development") {
        await develop(ctx);

        await moveDevTask(task, "review", "running");
      } else if (task.stage === "review") {
        const approved = await review(ctx);
        if (approved) {
          await moveDevTask(task, "pr", "running");
        } else if (task.reviewRound <= config.reviewRounds) {
          await moveDevTask(task, "development", "running");
        } else {
          // o revisor ainda não aprova: agora quem decide é a pessoa

          await addDevEvent(task, "system", "stuck", "", {
            rounds: task.reviewRound
          });

          await moveDevTask(task, "review", "waiting");
          return;
        }
      } else if (task.stage === "pr") {
        await publish(ctx);

        await moveDevTask(task, "pr", "waiting");
        // o Sabichão estuda as correções desta rodada; se falhar, a demanda
        // continua pronta (aprender é bônus, não etapa)
        await learn(ctx).catch(error =>
          logger.warn(
            { taskId, ...errorOf(error) },
            "DevPipeline: aprendizado falhou"
          )
        );
        return;
      } else {
        return;
      }
    }
  } catch (error) {
    if (error instanceof Cancelled) return;
    const { code, detail } = errorOf(error);
    logger.warn({ taskId, code, detail }, "DevPipeline: etapa falhou");
    // cancelada enquanto rodava: o erro não interessa mais
    const fresh = await DevTask.findByPk(taskId, { attributes: ["stage"] });
    if (!fresh || fresh.stage === "cancelled") return;
    await task.update({
      status: "error",
      error: detail ? `${code}: ${detail}` : code
    });
    await addDevEvent(task, "system", "error", detail, { code });
    emitDevTask(task.id);
  }
};

/** "Aprender com esta demanda", pedido pela pessoa. */
const learnTask = async (taskId: number): Promise<void> => {
  const task = await DevTask.findByPk(taskId);
  if (!task) return;
  const config = await loadDevConfig();
  try {
    if (!config.apiKey) throw new DevError("ERR_DEV_AI_NOT_CONFIGURED");
    await learn(contextOf(task, config, openRepo(config)), true);
  } catch (error) {
    const { code, detail } = errorOf(error);
    await addDevEvent(task, "system", "error", detail, { code });
  }
  emitDevTask(task.id);
};

export const enqueueLearning = async (task: DevTask): Promise<void> => {
  await devPipelineQueue.add(
    "learn",
    { taskId: task.id },
    { jobId: `learn-${task.id}`, removeOnComplete: true, removeOnFail: true }
  );
};

/**
 * Demandas de antes do custo em dólar: calcula pelo que ficou registrado
 * em cada fala (modelo e tokens). Roda uma vez por demanda.
 */
const backfillCosts = async () => {
  const tasks = await DevTask.findAll({
    where: { costUsd: 0, tokensOut: { [Op.gt]: 0 } },
    attributes: ["id", "costUsd"]
  });
  // eslint-disable-next-line no-restricted-syntax
  for (const task of tasks) {
    const events = await DevTaskEvent.findAll({
      where: { taskId: task.id },
      attributes: ["meta"]
    });
    const total = events.reduce((sum, event) => {
      const meta = (event.meta || {}) as {
        usage?: Omit<LlmUsage, "cacheWrite">;
        model?: string;
      };
      if (!meta.usage || !meta.model) return sum;
      return sum + (costOf(meta.model, { cacheWrite: 0, ...meta.usage }) || 0);
    }, 0);

    if (total > 0) await task.update({ costUsd: total });
  }
};

export const startDevPipeline = async (): Promise<void> => {
  devPipelineQueue.process("run", 1, job => runTask(job.data.taskId));
  devPipelineQueue.process("learn", 1, job => learnTask(job.data.taskId));

  await ensureDefaultSkills().catch(error =>
    logger.warn({ error }, "DevPipeline: skills padrão")
  );
  await backfillCosts().catch(error =>
    logger.warn({ error }, "DevPipeline: custo das demandas antigas")
  );

  // servidor caiu no meio de uma etapa: ela volta para a fila
  const pending = await unfinishedTasks();
  await Promise.all(
    pending.map(async task => {
      await task.update({ status: "queued" });
      await devPipelineQueue.add(
        "run",
        { taskId: task.id },
        {
          jobId: `dev-${task.id}`,
          priority: PRIORITY_RANK[task.priority] || 3,
          removeOnComplete: true,
          removeOnFail: true
        }
      );
    })
  );
  if (pending.length) {
    logger.info(`DevPipeline: ${pending.length} tarefa(s) de volta na fila`);
  }
};

/** Prints que o cliente mandou no chamado: a IA precisa ver também. */
const copySupportImages = async (
  task: DevTask,
  ticket: SupportTicket,
  eventId: number
) => {
  const messages = await SupportMessage.findAll({
    where: { ticketId: ticket.id, fromSupport: false, kind: "message" },
    order: [["createdAt", "ASC"]],
    limit: 10
  });
  const files = messages
    .flatMap(message => message.attachments || [])
    .filter(file => file.mimetype?.startsWith("image/") && file.path)
    .slice(0, 4);
  const copied = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const file of files) {
    const source = path.resolve(supportFiles.directory, file.path);
    if (
      source.startsWith(`${path.resolve(supportFiles.directory)}${path.sep}`)
    ) {
      const item = await copyImage(source, file.name, file.mimetype, eventId);
      if (item) copied.push(item);
    }
  }
  if (!copied.length) return;
  await task.update({ attachments: [...(task.attachments || []), ...copied] });
  const event = await DevTaskEvent.findByPk(eventId);
  await event?.update({
    meta: { ...(event.meta || {}), images: copied.map(item => item.id) }
  });
};

/** Pedido de melhoria que chegou pela Ajuda (ou que o super levou de lá). */
export const createDevTaskFromSupport = async (
  ticket: SupportTicket,
  body: string,
  start: boolean
): Promise<DevTask> => {
  const existing = await DevTask.findOne({
    where: { supportTicketId: ticket.id },
    order: [["id", "DESC"]]
  });
  if (existing && existing.stage !== "cancelled") {
    // ainda não analisada: levar de novo para o pipeline começa a análise
    const untouched =
      existing.stage === "intake" &&
      existing.status === "waiting" &&
      !existing.spec &&
      !existing.questions?.length;
    if (start && untouched) await enqueueDevTask(existing);
    return existing;
  }

  const task = await DevTask.create({
    title: String(ticket.subject || "").slice(0, 200),
    description: String(body || "").slice(0, 10000),
    source: "help",
    companyId: ticket.companyId,
    requesterId: ticket.userId,
    supportTicketId: ticket.id,
    stage: "intake",
    status: "waiting"
  });
  const request = await addDevEvent(
    task,
    "human",
    "request",
    task.description,
    {},
    ticket.userId
  );
  await copySupportImages(task, ticket, request.id).catch(error =>
    logger.warn({ error, taskId: task.id }, "DevPipeline: imagens do chamado")
  );
  await notifyClient(task, "intake").catch(error =>
    logger.warn({ error, taskId: task.id }, "DevPipeline: aviso ao cliente")
  );
  if (start) await enqueueDevTask(task);
  else emitDevTask(task.id, "create");
  return task;
};
