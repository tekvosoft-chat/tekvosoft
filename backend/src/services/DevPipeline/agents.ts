import { Op } from "sequelize";
import DevTask, { DevCheck, DevFeedback } from "../../models/DevTask";
import DevTaskEvent from "../../models/DevTaskEvent";
import { DevConfig } from "./config";
import { LlmResult, LlmTurn, parseJson } from "./llm";
import { callOpenRouter } from "./llmOpenRouter";
import { RepoSource, branchName, buildRepoMap, canRead } from "./repo";
import { Workspace } from "./workspace";
import { costOf } from "./pricing";
import { imagesOf, taskImages } from "./images";
import { AgentSlot, OPENROUTER_MODELS, slotsFor } from "./models";
import { browserReady, cleanPlan, runBrowserTest } from "./testRunner";
import {
  markUsed,
  saveLesson,
  skillIndex,
  skillsFor,
  skillsText
} from "./skills";
import {
  CONTEXT_INTRO,
  MAP_HELP,
  TRIAGE,
  TRIAGE_SCHEMA,
  TriageReply,
  DEVELOPER,
  DEVELOPER_SCHEMA,
  DeveloperReply,
  REVIEWER,
  REVIEWER_SCHEMA,
  ReviewerReply,
  LEARNER,
  LEARNER_SCHEMA,
  LearnerReply,
  TESTER_PLAN,
  TESTER_PLAN_SCHEMA,
  TesterPlanReply,
  TESTER_JUDGE,
  TESTER_JUDGE_SCHEMA,
  TesterJudgeReply
} from "./prompts";

/**
 * As etapas do pipeline. Cada uma é uma conversa curta com um agente, com
 * limites fixos de rodadas: o custo de uma tarefa é previsível.
 *
 *  triagem: 1 chamada (2 se pedir para ver arquivos). Já sai com a
 *    prioridade e a dificuldade: um pedido só faz os papéis.
 *  desenvolvedor: lê só os arquivos que a triagem apontou (grandes vêm como
 *    índice, e ele pede os trechos); edita por search/replace; a sintaxe é
 *    conferida sem IA e o erro volta para ele antes de gastar o revisor.
 *  revisor: vê o diff e, quando cabem, os arquivos alterados completos;
 *    nunca o repositório inteiro.
 *  PR: sem IA; a descrição é montada com o que os agentes já escreveram.
 *  testador: depois do merge, com a versão no ar, planeja um teste de
 *    tela, o navegador executa (fotos e vídeo) e ele confere as fotos.
 *  aprendiz: só roda quando houve correção (da pessoa, do revisor, edição
 *    que falhou) e transforma a lição em skill para as próximas tarefas.
 *
 * Modelos: cada agente tem o seu, fixo em models.ts (OpenRouter), e a
 * dificuldade que a triagem deu escolhe o do desenvolvedor e o do revisor.
 *
 * Skills: a triagem vê só o índice e escolhe; os outros recebem inteiras
 * só as escolhidas. Imagens: até 4, reduzidas, para triagem e código (e
 * para o revisor quando a tarefa é de interface).
 */

export class DevError extends Error {
  code: string;

  detail: string;

  constructor(code: string, detail = "") {
    super(detail ? `${code}: ${detail}` : code);
    this.code = code;
    this.detail = detail;
  }
}

/** A pessoa cancelou a tarefa no meio: a etapa para sem erro. */
export class Cancelled extends Error {}

export interface RunContext {
  task: DevTask;
  config: DevConfig;
  repo: RepoSource;
  say(
    agent: string,
    kind: string,
    content: string,
    meta?: Record<string, unknown>
  ): Promise<void>;
  isCancelled(): Promise<boolean>;
}

const unique = <T>(items: T[]) => [...new Set(items)];

const cleanPath = (file: string) =>
  String(file || "")
    .trim()
    .replace(/^\.\//, "");

// ---------------------------------------------------------------------------
// contexto comum (AGENTS.md + mapa), guardado por commit

const contexts = new Map<string, string>();

const projectContext = async (
  repo: RepoSource,
  sha: string
): Promise<string> => {
  // o commit do GitHub não muda; a pasta local muda a cada save
  const key = repo.kind === "github" ? `${repo.label}:${sha}` : "";
  if (key && contexts.has(key)) return contexts.get(key);

  const [files, rules] = await Promise.all([
    repo.list(sha),
    repo.read(sha, "AGENTS.md")
  ]);
  const text = [
    CONTEXT_INTRO,
    "## Regras do projeto (AGENTS.md)",
    rules || "(o repositório não tem AGENTS.md)",
    "## Mapa do repositório",
    MAP_HELP,
    buildRepoMap(files)
  ].join("\n\n");

  if (key) {
    if (contexts.size >= 4) contexts.delete(contexts.keys().next().value);
    contexts.set(key, text);
  }
  return text;
};

// arquivos do commit (o do GitHub não muda; a pasta local, sim)
const trees = new Map<string, Set<string>>();

/** Caminhos citados que não existem no commit. */
const missingFiles = async (
  repo: RepoSource,
  sha: string,
  files: string[]
): Promise<string[]> => {
  const key = repo.kind === "github" ? `${repo.label}:${sha}` : "";
  let known = key ? trees.get(key) : null;
  if (!known) {
    known = new Set((await repo.list(sha)).map(file => file.path));
    if (key) {
      if (trees.size >= 4) trees.delete(trees.keys().next().value);
      trees.set(key, known);
    }
  }
  return unique(files.map(cleanPath))
    .filter(file => canRead(file) && !known.has(file))
    .slice(0, 8);
};

// ---------------------------------------------------------------------------
// uma chamada a um agente, com a conta de tokens da tarefa

interface Asked<T> {
  data: T;
  result: LlmResult;
  meta: Record<string, unknown>;
}

interface Question {
  // vaga do agente: escolhe o modelo (models.ts)
  slot: AgentSlot;
  context: string;
  system: string;
  messages: LlmTurn[];
  schema: Record<string, unknown>;
  schemaName: string;
  maxTokens: number;
  // quanto esperar: a triagem desiste bem antes do desenvolvedor
  timeoutMs: number;
}

const ask = async <T>(
  ctx: RunContext,
  question: Question
): Promise<Asked<T>> => {
  if (await ctx.isCancelled()) throw new Cancelled();
  const { task, config } = ctx;
  if (task.tokensIn + task.tokensOut >= config.tokenLimit) {
    throw new DevError("ERR_DEV_TOKEN_LIMIT", String(config.tokenLimit));
  }

  // modelo, reservas e esforço vêm da vaga do agente (models.ts)
  const chosen = OPENROUTER_MODELS[question.slot];
  const result = await callOpenRouter({
    apiKey: config.apiKey,
    model: chosen.model,
    fallbacks: chosen.fallbacks,
    context: question.context,
    system: question.system,
    messages: question.messages,
    schema: question.schema,
    schemaName: question.schemaName,
    effort: chosen.effort,
    maxTokens: question.maxTokens,
    timeoutMs: question.timeoutMs
  });
  const { usage } = result;
  // o OpenRouter diz quanto cobrou; sem isso, a tabela de preços
  const cost = result.cost ?? costOf(result.model, usage);
  await task.update({
    tokensIn: task.tokensIn + usage.input + usage.cacheWrite,
    tokensOut: task.tokensOut + usage.output,
    tokensCached: task.tokensCached + usage.cacheRead,
    costUsd: (task.costUsd || 0) + (cost || 0)
  });
  return {
    data: parseJson<T>(result.text),
    result,
    meta: { model: result.model, slot: question.slot, usage, cost }
  };
};

const MINUTE = 60 * 1000;

/** Resultado das buscas no código, no formato que o agente lê. */
const searchCode = async (
  repo: RepoSource,
  sha: string,
  queries: string[]
): Promise<string> => {
  const parts = await Promise.all(
    queries.map(async query => {
      const lines = await repo.search(sha, query).catch(() => null);
      if (lines === null) {
        return `### busca "${query}"\n(busca indisponível aqui: use o mapa e peça os arquivos)`;
      }
      return `### busca "${query}"\n${lines.length ? lines.join("\n") : "(nada encontrado)"}`;
    })
  );
  return parts.join("\n\n");
};

const imagesLine = (count: number) =>
  count
    ? `${count} imagem(ns) anexada(s) vêm junto com esta mensagem: são parte do pedido.`
    : "";

const lastEvent = (task: DevTask, agent: string, kind: string) =>
  DevTaskEvent.findOne({
    where: { taskId: task.id, agent, kind },
    order: [["id", "DESC"]]
  });

const feedbackLine = (item: DevFeedback) => {
  const who = {
    human: "pessoa",
    tester: "testador, na tela",
    reviewer: `revisor · ${item.severity || "major"}`
  }[item.from];
  return `- [${who}]${item.path ? ` ${item.path}:` : ""} ${item.text}`;
};

// ---------------------------------------------------------------------------
// 1. triagem + prioridade

export const triage = async (
  ctx: RunContext
): Promise<"ready" | "questions"> => {
  const { task, repo } = ctx;
  const sha = await repo.head();
  const context = await projectContext(repo, sha);

  const request = [
    `# Pedido #${task.id}${task.source === "help" ? " (de um cliente, pela Ajuda)" : ""}`,
    `Título: ${task.title}`,
    task.description || "(sem descrição)"
  ];
  if (task.spec) request.push(`## Análise anterior\n${task.spec}`);
  if (task.questions?.length) {
    request.push(
      `## Perguntas feitas antes\n${task.questions.map(q => `- ${q}`).join("\n")}`
    );
  }
  if (task.feedback?.length) {
    request.push(
      `## O que a pessoa respondeu ou pediu\n${task.feedback.map(feedbackLine).join("\n")}`
    );
  }
  const index = await skillIndex();
  if (index) request.push(`## Skills do time disponíveis\n${index}`);
  const images = await taskImages(task);
  if (images.length) request.push(imagesLine(images.length));

  const messages: LlmTurn[] = [
    { role: "user", content: request.join("\n\n"), images }
  ];
  // resposta curta de propósito: a triagem que escreve demais trava e gasta
  const question = (): Question => ({
    slot: "triage",
    context,
    system: TRIAGE,
    messages,
    schema: TRIAGE_SCHEMA,
    schemaName: "triage",
    maxTokens: 8000,
    timeoutMs: 3 * MINUTE
  });
  let reply = await ask<TriageReply>(ctx, question());

  const peekList = unique((reply.data.peek || []).map(cleanPath)).filter(
    canRead
  );
  const searchList = unique(
    (reply.data.search || []).map(query => String(query).trim())
  ).filter(Boolean);
  if (
    reply.data.status === "need_files" &&
    (peekList.length || searchList.length)
  ) {
    const peek = peekList.slice(0, 6);
    const queries = searchList.slice(0, 4);
    await ctx.say("triage", "read", peek.join("\n"), {
      ...reply.meta,
      queries
    });
    const workspace = new Workspace(repo, sha);
    const views = await Promise.all(peek.map(file => workspace.view(file)));
    const found = queries.length ? await searchCode(repo, sha, queries) : "";
    messages.push(
      { role: "assistant", content: reply.result.text },
      {
        role: "user",
        content: `${[...views, found].filter(Boolean).join("\n\n")}\n\nAgora feche a triagem: status "ready" ou "questions".`
      }
    );
    reply = await ask<TriageReply>(ctx, question());
  }

  // caminho que não existe: a IA deduziu pelo nome da tela ou da rota (já
  // aconteceu com /tags, que só redireciona para o Kanban). Uma chance de
  // corrigir ou perguntar, sem nova leitura de código
  const missing =
    reply.data.status === "ready"
      ? await missingFiles(repo, sha, reply.data.files || [])
      : [];
  if (missing.length) {
    messages.push(
      { role: "assistant", content: reply.result.text },
      {
        role: "user",
        content: `Estes caminhos não existem no repositório: ${missing.join(", ")}. Arquivo novo que a tarefa cria: mantenha e diga na spec. Senão, corrija pelo mapa; se o pedido fala de tela ou função que não existe mais, status "questions" e pergunte. Responda com status "ready" ou "questions".`
      }
    );
    reply = await ask<TriageReply>(ctx, question());
  }

  const data = reply.data;
  if (data.status === "questions" && data.questions?.length) {
    const questions = data.questions.slice(0, 3);
    await task.update({ questions, feedback: [] });
    await ctx.say("triage", "question", questions.join("\n"), reply.meta);
    return "questions";
  }
  if (!String(data.spec || "").trim()) {
    throw new DevError("ERR_DEV_AI_FORMAT", "triagem sem especificação");
  }

  const files = unique((data.files || []).map(cleanPath).filter(canRead)).slice(
    0,
    8
  );
  // só skills que existem e estão em uso (a IA pode inventar um slug)
  const chosen = await skillsFor(data.skills || [], !!data.design);
  const skills = chosen.map(skill => skill.slug);
  const difficulty = ["easy", "medium", "hard"].includes(data.difficulty)
    ? data.difficulty
    : "medium";
  await task.update({
    design: !!data.design,
    skills,
    title: String(data.title || task.title).slice(0, 200),
    spec: data.spec,
    acceptance: (data.acceptance || []).slice(0, 6),
    files,
    kind: data.kind,
    difficulty,
    risk: data.risk,
    priority: data.priority,
    priorityReason: data.priorityReason,
    // o nome já aparece no cartão; depois do PR aberto, não muda mais
    ...(task.prUrl
      ? {}
      : { branch: branchName(task.id, data.kind, data.branch || data.title) }),
    questions: [],
    feedback: []
  });
  await ctx.say("triage", "spec", data.spec, {
    ...reply.meta,
    title: task.title,
    acceptance: task.acceptance,
    files,
    kind: data.kind,
    difficulty,
    risk: data.risk,
    branch: task.branch,
    design: !!data.design,
    skills: chosen.map(skill => skill.name)
  });
  await ctx.say("priority", "priority", data.priorityReason, {
    priority: data.priority
  });
  return "ready";
};

// ---------------------------------------------------------------------------
// 2. desenvolvedor

const MAX_TURNS = 8;
const MAX_READS = 3;
const MAX_FIXES = 2;
const FIRST_MESSAGE_CHARS = 100000;

const editErrors = (errors: string[]) =>
  `Estas edições não foram aplicadas (as demais foram):\n${errors
    .map(error => `- ${error}`)
    .join(
      "\n"
    )}\n\nMande de novo só as que falharam, corrigidas (action "edit"). Para ver o arquivo como está agora, use action "read".`;

const syntaxErrors = async (workspace: Workspace, checks: DevCheck[]) => {
  const parts = await Promise.all(
    checks.map(async check => {
      const line = Number(check.message.match(/^linha (\d+)/)?.[1] || 1);
      const around = await workspace.range(
        check.path,
        Math.max(1, line - 6),
        line + 6
      );
      return `- ${check.path}: ${check.message}\n${around}`;
    })
  );
  return `A verificação de sintaxe achou erros nos arquivos que você alterou (suas edições já estão aplicadas):\n\n${parts.join(
    "\n\n"
  )}\n\nCorrija com novas edições (action "edit"), copiando o search do arquivo como está agora.`;
};

export const develop = async (ctx: RunContext): Promise<void> => {
  const { task, repo } = ctx;
  const previous = task.changes || [];
  // sem alteração ainda, parte do commit mais novo; com alteração (ajuste
  // pedido pelo revisor ou pela pessoa), continua do mesmo commit base
  const baseSha =
    previous.length && task.baseSha ? task.baseSha : await repo.head();
  const context = await projectContext(repo, baseSha);
  const workspace = new Workspace(repo, baseSha, previous);

  const paths = unique([
    ...previous.map(change => change.path),
    ...(task.files || [])
  ])
    .filter(canRead)
    .slice(0, 10);
  let budget = FIRST_MESSAGE_CHARS;
  const views: string[] = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const file of paths) {
    const view = await workspace.view(file, budget > 0);
    budget -= view.length;
    views.push(view);
  }

  const skills = await skillsFor(task.skills, task.design);
  // conta uso uma vez por tarefa (a primeira rodada de código)
  if (!previous.length) await markUsed(skills);
  const images = await taskImages(task);

  const feedback = task.feedback || [];
  const intro = [
    `# Tarefa #${task.id}: ${task.title}`,
    task.spec || task.description,
    `## Critérios de aceite\n${(task.acceptance || []).map(item => `- ${item}`).join("\n")}`,
    task.design
      ? "Esta tarefa mexe em interface: siga as regras de design (computador e celular)."
      : "",
    skillsText(skills),
    imagesLine(images.length),
    feedback.length
      ? `## Ajustes pedidos\n${feedback.map(feedbackLine).join("\n")}`
      : "",
    previous.length
      ? "Os arquivos abaixo já estão com as suas alterações anteriores."
      : "",
    `## Arquivos\n\n${views.join("\n\n") || "(a triagem não apontou arquivos: peça o que precisar)"}`,
    'Responda com action "read" ou "edit".'
  ]
    .filter(Boolean)
    .join("\n\n");

  const messages: LlmTurn[] = [{ role: "user", content: intro, images }];
  let reads = 0;
  let fixes = 0;
  let delivered = false;
  // fácil vai no modelo barato; média, difícil ou arriscada, no forte
  const { developer: slot } = slotsFor(task);

  for (let turn = 0; turn < MAX_TURNS; turn += 1) {
    const reply = await ask<DeveloperReply>(ctx, {
      slot,
      context,
      system: DEVELOPER,
      messages,
      schema: DEVELOPER_SCHEMA,
      schemaName: "developer",
      maxTokens: 64000,
      timeoutMs: 12 * MINUTE
    });
    messages.push({ role: "assistant", content: reply.result.text });
    const data = reply.data;

    if (data.action === "read") {
      const wanted = (data.reads || []).filter(item => item.path).slice(0, 8);
      const queries = unique(
        (data.queries || []).map(query => String(query).trim())
      )
        .filter(Boolean)
        .slice(0, 4);
      if ((!wanted.length && !queries.length) || reads >= MAX_READS) {
        messages.push({
          role: "user",
          content:
            'Limite de leituras atingido: entregue as edições agora (action "edit") com o que você já viu.'
        });
      } else {
        reads += 1;

        await ctx.say(
          "developer",
          "read",
          wanted
            .map(item =>
              item.from || item.to
                ? `${item.path} (${item.from || 1}–${item.to || "fim"})`
                : item.path
            )
            .join("\n"),
          { ...reply.meta, queries }
        );

        const parts = await Promise.all(
          wanted.map(item =>
            canRead(cleanPath(item.path))
              ? workspace.range(item.path, item.from, item.to)
              : Promise.resolve(`### ${item.path}\n(leitura não permitida)`)
          )
        );
        if (queries.length) {
          parts.push(await searchCode(repo, baseSha, queries));
        }
        messages.push({
          role: "user",
          content: `${parts.join("\n\n")}\n\nContinue: peça mais trechos ou entregue as edições.`
        });
      }
    } else {
      delivered = true;

      const { applied, errors } = await workspace.apply(data.edits || []);

      const checks = errors.length ? [] : await workspace.check();

      await ctx.say("developer", "edits", data.plan || "", {
        ...reply.meta,
        files: applied,
        errors,
        checks,
        notes: data.notes
      });
      if ((!errors.length && !checks.length) || fixes >= MAX_FIXES) break;
      fixes += 1;
      messages.push({
        role: "user",
        content: errors.length
          ? editErrors(errors)
          : await syntaxErrors(workspace, checks)
      });
    }
  }

  const changes = await workspace.changes();
  if (!delivered || !changes.length) throw new DevError("ERR_DEV_NO_CHANGES");
  await task.update({
    baseSha,
    changes,
    diff: await workspace.diff(),
    checks: await workspace.check(),
    feedback: []
  });
};

// ---------------------------------------------------------------------------
// 3. revisor

const MAX_DIFF_CHARS = 200000;
const FULL_FILES_CHARS = 30000;

export const review = async (ctx: RunContext): Promise<boolean> => {
  const { task, config, repo } = ctx;
  if (!task.diff) throw new DevError("ERR_DEV_NO_CHANGES");
  if (task.diff.length > MAX_DIFF_CHARS) throw new DevError("ERR_DEV_TOO_BIG");

  const context = await projectContext(repo, task.baseSha);
  const round = task.reviewRound + 1;
  const checks = task.checks || [];
  const developer = await lastEvent(task, "developer", "edits");
  const notes = String(developer?.meta?.notes || "");
  const skills = await skillsFor(task.skills, task.design);
  const images = task.design ? await taskImages(task) : [];

  // arquivo inteiro como ficou deixa o revisor achar import faltando e
  // variável que não existe; só quando cabe (senão, só o diff)
  const written = (task.changes || []).filter(change => change.op !== "delete");
  const fullSize = written.reduce(
    (sum, change) => sum + change.content.length,
    0
  );
  const fullFiles =
    written.length && fullSize <= FULL_FILES_CHARS
      ? `## Arquivos alterados, como ficaram\n\n${written
          .map(change => `### ${change.path}\n${change.content}`)
          .join("\n\n")}`
      : "";

  const content = [
    `# Tarefa #${task.id}: ${task.title}`,
    task.spec || task.description,
    `## Critérios de aceite\n${(task.acceptance || []).map(item => `- ${item}`).join("\n")}`,
    task.design
      ? "Tarefa de interface: confira também as regras de design."
      : "",
    skillsText(skills),
    imagesLine(images.length),
    notes ? `## Notas do desenvolvedor\n${notes}` : "",
    `## Verificação automática de sintaxe\n${
      checks.length
        ? checks.map(check => `- ${check.path}: ${check.message}`).join("\n")
        : "Sem erros de sintaxe nos arquivos alterados."
    }`,
    `## Diff (rodada ${round} de ${config.reviewRounds + 1})\n\`\`\`diff\n${task.diff}\n\`\`\``,
    fullFiles
  ]
    .filter(Boolean)
    .join("\n\n");

  // difícil ou arriscada: revisão por outra família de modelo
  const reply = await ask<ReviewerReply>(ctx, {
    slot: slotsFor(task).reviewer,
    context,
    system: REVIEWER,
    messages: [{ role: "user", content, images }],
    schema: REVIEWER_SCHEMA,
    schemaName: "review",
    maxTokens: 16000,
    timeoutMs: 8 * MINUTE
  });
  const comments = reply.data.comments || [];
  const blocking = comments.filter(comment => comment.severity !== "minor");
  // erro de sintaxe barra sempre; pedido de mudança sem nada grave, não
  const approved =
    !checks.length && (reply.data.verdict === "approve" || !blocking.length);

  const feedback: DevFeedback[] = approved
    ? []
    : [
        ...blocking.map(comment => ({
          from: "reviewer" as const,
          path: comment.path,
          severity: comment.severity,
          text: comment.message
        })),
        ...checks.map(check => ({
          from: "reviewer" as const,
          path: check.path,
          severity: "blocker",
          text: `erro de sintaxe: ${check.message}`
        }))
      ];

  await task.update({
    reviewRound: round,
    verdict: approved ? "approve" : "request_changes",
    feedback
  });
  await ctx.say("reviewer", "review", reply.data.summary || "", {
    ...reply.meta,
    verdict: approved ? "approve" : "request_changes",
    comments,
    round
  });
  return approved;
};

// ---------------------------------------------------------------------------
// 4. PR (sem IA)

/** Qual modelo cada agente usou nesta demanda (o último de cada um). */
const modelsUsed = async (task: DevTask): Promise<string> => {
  const events = await DevTaskEvent.findAll({
    where: {
      taskId: task.id,
      agent: { [Op.in]: ["triage", "developer", "reviewer"] }
    },
    order: [["id", "ASC"]],
    attributes: ["agent", "meta"]
  });
  const last: Record<string, string> = {};
  events.forEach(event => {
    const model = String(event.meta?.model || "");
    if (model) last[event.agent] = model;
  });
  const names: Record<string, string> = {
    triage: "triagem da Xereta",
    developer: "código do Zé Commit",
    reviewer: "revisão da Dona Lupa"
  };
  return Object.keys(names)
    .filter(agent => last[agent])
    .map(agent => `${names[agent]} (${last[agent]})`)
    .join(", ");
};

const prBody = async (task: DevTask) => {
  const [developer, reviewer] = await Promise.all([
    lastEvent(task, "developer", "edits"),
    lastEvent(task, "reviewer", "review")
  ]);
  const plans = await DevTaskEvent.findAll({
    where: { taskId: task.id, agent: "developer", kind: "edits" },
    order: [["id", "ASC"]],
    attributes: ["content"]
  });
  const minor = ((reviewer?.meta?.comments as ReviewerReply["comments"]) || [])
    .filter(comment => comment.severity === "minor")
    .map(
      comment =>
        `- ${comment.path ? `\`${comment.path}\`: ` : ""}${comment.message}`
    );
  const notes = String(developer?.meta?.notes || "");

  return [
    `## Tarefa #${task.id}`,
    task.spec || task.description,
    task.acceptance?.length
      ? `### Critérios de aceite\n${task.acceptance.map(item => `- [ ] ${item}`).join("\n")}`
      : "",
    `### O que foi feito\n${plans
      .map(plan => plan.content)
      .filter(Boolean)
      .join("\n\n")}`,
    notes ? `### Notas do desenvolvedor\n${notes}` : "",
    reviewer
      ? `### Code review da IA (rodada ${task.reviewRound})\n${reviewer.content}${minor.length ? `\n\nSugestões que não bloqueiam:\n${minor.join("\n")}` : ""}`
      : "",
    "---",
    `Gerado pelo pipeline de IA do vuup.me: ${await modelsUsed(task)}. Tokens: ${task.tokensIn} de entrada, ${task.tokensOut} de saída, ${task.tokensCached} lidos do cache (≈ US$ ${(task.costUsd || 0).toFixed(2)}).`,
    "Nada disto foi executado ainda: revise antes do merge. Depois do merge, com a versão no ar, o Clique testa a tela e mostra fotos e vídeo na demanda."
  ]
    .filter(Boolean)
    .join("\n\n");
};

/**
 * Na primeira publicação, a branch não pode já existir: o mesmo número de
 * demanda aparece em outro ambiente (o de teste e o de produção têm bancos
 * separados), e o commit iria parar em cima do trabalho de outra demanda.
 */
const freeBranch = async (repo: RepoSource, branch: string) => {
  let candidate = branch;
  for (let n = 2; n < 20 && (await repo.branchExists(candidate)); n += 1) {
    candidate = `${branch}-${n}`;
  }
  return candidate;
};

export const publish = async (ctx: RunContext): Promise<void> => {
  const { task, repo } = ctx;
  if (!task.changes?.length) throw new DevError("ERR_DEV_NO_CHANGES");
  const planned = task.branch || branchName(task.id, task.kind, task.title);
  const branch =
    repo.canPublish && !task.prUrl ? await freeBranch(repo, planned) : planned;

  if (!repo.canPublish) {
    await task.update({ branch });
    await ctx.say("system", "patch", "", {
      branch,
      reason: repo.kind === "local" ? "local" : "no_token"
    });
    return;
  }

  const pr = await repo.publish({
    baseSha: task.baseSha,
    branch,
    title: task.title,
    body: await prBody(task),
    message: `${task.title}\n\nTarefa #${task.id} do pipeline de IA do vuup.me.`,
    changes: task.changes
  });
  await task.update({ branch, prUrl: pr.url, prNumber: pr.number });
  await ctx.say("system", "pr", pr.url, { number: pr.number, branch });
};

// ---------------------------------------------------------------------------
// 5. aprendiz (Sabichão): correções viram skills

/**
 * O que deu errado desde a última lição: comentários da pessoa, bloqueios
 * do revisor, edições que não aplicaram e erros de sintaxe. Sem nada disso
 * não há o que aprender, e nenhuma chamada é feita (a não ser que a pessoa
 * peça, pelo botão).
 */
const lessonSignals = async (task: DevTask): Promise<string[]> => {
  const last = await lastEvent(task, "learner", "learn");
  const events = await DevTaskEvent.findAll({
    where: { taskId: task.id, id: { [Op.gt]: last?.id || 0 } },
    order: [["id", "ASC"]]
  });
  const signals: string[] = [];
  events.forEach(event => {
    const meta = (event.meta || {}) as {
      verdict?: string;
      comments?: ReviewerReply["comments"];
      errors?: string[];
      checks?: DevCheck[];
    };
    if (event.agent === "human" && event.kind === "comment" && event.content) {
      signals.push(`- A pessoa pediu/corrigiu: ${event.content}`);
    }
    if (event.agent === "reviewer" && meta.verdict === "request_changes") {
      (meta.comments || [])
        .filter(comment => comment.severity !== "minor")
        .forEach(comment =>
          signals.push(
            `- O revisor barrou (${comment.severity}) ${comment.path}: ${comment.message}`
          )
        );
    }
    if (event.agent === "tester" && meta.verdict === "fail") {
      ((meta as { findings?: TesterJudgeReply["findings"] }).findings || [])
        .filter(finding => !finding.ok)
        .forEach(finding =>
          signals.push(
            `- O teste de tela reprovou: ${finding.check} (${finding.note})`
          )
        );
    }
    if (event.agent === "developer" && event.kind === "edits") {
      (meta.errors || []).forEach(error =>
        signals.push(`- Edição que não aplicou: ${error}`)
      );
      (meta.checks || []).forEach(check =>
        signals.push(`- Erro de sintaxe: ${check.path}: ${check.message}`)
      );
    }
  });
  return signals.slice(0, 30);
};

export const learn = async (
  ctx: RunContext,
  manual = false
): Promise<number> => {
  const { task, config } = ctx;
  const signals = await lessonSignals(task);
  if (!signals.length && !manual) return 0;

  const [used, index] = await Promise.all([
    skillsFor(task.skills, task.design),
    skillIndex()
  ]);
  const content = [
    `# Demanda #${task.id}: ${task.title}`,
    task.spec || task.description,
    `## O que deu errado ou foi corrigido\n${
      signals.length
        ? signals.join("\n")
        : "(nenhuma correção: só registre se a demanda revelou um padrão útil do projeto)"
    }`,
    used.length
      ? `## Skills usadas nesta demanda\n\n${used
          .map(skill => `### ${skill.slug} — ${skill.name}\n${skill.content}`)
          .join("\n\n")}`
      : "",
    `## Todas as skills\n${index || "(nenhuma)"}`
  ]
    .filter(Boolean)
    .join("\n\n");

  const before = task.costUsd || 0;
  const reply = await ask<LearnerReply>(ctx, {
    slot: "learner",
    context: CONTEXT_INTRO,
    system: LEARNER,
    messages: [{ role: "user", content }],
    schema: LEARNER_SCHEMA,
    schemaName: "learner",
    maxTokens: 8000,
    timeoutMs: 4 * MINUTE
  });
  const lessons = (reply.data.lessons || [])
    .filter(lesson => String(lesson.content || "").trim())
    .slice(0, 2);
  // pedido de cliente pode trazer instrução disfarçada: o que se aprende
  // com ele espera o super aprovar, mesmo com o aprendizado automático
  const active = config.autoLearn && task.source !== "help";
  const costEach = lessons.length
    ? ((task.costUsd || 0) - before) / lessons.length
    : 0;
  const saved = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const lesson of lessons) {
    const skill = await saveLesson(lesson, {
      source: "agent",
      active,
      fromTaskId: task.id,
      costUsd: costEach
    });
    saved.push({
      id: skill.id,
      name: skill.name,
      status: skill.status,
      action: skill.replacesId ? "update" : "create",
      reason: lesson.reason
    });
  }
  await ctx.say("learner", "learn", saved.map(item => item.reason).join("\n"), {
    ...reply.meta,
    skills: saved
  });
  return saved.length;
};

/** PR mergeado no GitHub: a tarefa está concluída. */
// ---------------------------------------------------------------------------
// 6. testador (Clique): teste de tela no sistema no ar

const TEST_DIFF_CHARS = 12000;
// telas de quem não está logado: o testador já entra logado
const PUBLIC_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password"
];

/** Telas que o testador pode abrir: as rotas do frontend. */
const appRoutes = async (repo: RepoSource, sha: string): Promise<string> => {
  const source = await repo
    .read(sha, "frontend/src/routes/index.js")
    .catch(() => null);
  const routes = unique(
    [...String(source || "").matchAll(/path="([^"]+)"/g)].map(match => match[1])
  ).filter(route => !PUBLIC_ROUTES.includes(route));
  return routes.join(" ") || "/";
};

export type TestOutcome = "pass" | "fail" | "unclear" | "skipped";

/**
 * Planeja (uma vez por versão do código), roda no navegador e confere.
 * Sem navegador configurado, ou quando a mudança não aparece na tela, o
 * teste é pulado com o motivo.
 */
export const test = async (ctx: RunContext): Promise<TestOutcome> => {
  const { task, repo } = ctx;
  if (!browserReady()) {
    await task.update({ testVerdict: "skipped" });
    await ctx.say("tester", "test_skip", "", { reason: "no_browser" });
    return "skipped";
  }

  let plan = task.testPlan;
  if (!plan) {
    const sha = await repo.head();
    const diff = String(task.diff || "");
    const content = [
      `# Tarefa #${task.id}: ${task.title}`,
      task.spec || task.description,
      `## Critérios de aceite\n${(task.acceptance || [])
        .map(item => `- ${item}`)
        .join("\n")}`,
      task.design ? "Tarefa de interface: teste também no celular." : "",
      `## Arquivos alterados\n${(task.changes || [])
        .map(change => `- ${change.path} (${change.op})`)
        .join("\n")}`,
      `## Diff${diff.length > TEST_DIFF_CHARS ? " (cortado)" : ""}\n\`\`\`diff\n${diff.slice(
        0,
        TEST_DIFF_CHARS
      )}\n\`\`\``,
      `## Telas do sistema (rotas)\n${await appRoutes(repo, sha)}`
    ]
      .filter(Boolean)
      .join("\n\n");
    // o contexto curto basta: o roteiro sai do diff e das rotas, não do
    // mapa do repositório inteiro
    const reply = await ask<TesterPlanReply>(ctx, {
      slot: "tester",
      context: CONTEXT_INTRO,
      system: TESTER_PLAN,
      messages: [{ role: "user", content }],
      schema: TESTER_PLAN_SCHEMA,
      schemaName: "test_plan",
      maxTokens: 6000,
      timeoutMs: 3 * MINUTE
    });
    plan = cleanPlan(reply.data);
    await task.update({ testPlan: plan });
    await ctx.say("tester", "test_plan", plan.reason, {
      ...reply.meta,
      needed: plan.needed,
      devices: plan.devices,
      steps: plan.steps,
      checks: plan.checks
    });
  }
  if (!plan.needed) {
    await task.update({ testVerdict: "skipped" });
    return "skipped";
  }

  const run = await runBrowserTest(plan);
  const shots = run.captures.filter(file => file.mimetype.startsWith("image/"));
  const videos = run.captures.filter(file =>
    file.mimetype.startsWith("video/")
  );
  await task.update({
    attachments: [...(task.attachments || []), ...run.captures]
  });
  await ctx.say("tester", "test_run", "", {
    url: run.url,
    images: shots.map(file => file.id),
    videos: videos.map(file => file.id),
    log: run.log,
    blocked: run.blocked,
    pageErrors: run.pageErrors
  });

  const photos = shots.slice(0, 8);
  const noteOf = (id: string) =>
    run.log.find(entry => entry.shot === id)?.note || "";
  const content = [
    `# Tarefa #${task.id}: ${task.title}`,
    task.spec || task.description,
    `## O que as fotos precisam mostrar (checks)\n${plan.checks
      .map(check => `- ${check}`)
      .join("\n")}`,
    `## Passos\n${run.log
      .map(
        entry =>
          `- [${entry.device}] ${entry.step}. ${entry.action} ${entry.target}: ${
            entry.ok ? "ok" : `FALHOU (${entry.error})`
          }`
      )
      .join("\n")}`,
    run.pageErrors.length
      ? `## Erros de JavaScript na página\n${run.pageErrors
          .map(error => `- ${error}`)
          .join("\n")}`
      : "",
    `## Fotos, na ordem\n${photos
      .map(
        (file, index) =>
          `${index + 1}. ${file.name}${noteOf(file.id) ? `: ${noteOf(file.id)}` : ""}`
      )
      .join("\n")}`
  ]
    .filter(Boolean)
    .join("\n\n");
  const judge = await ask<TesterJudgeReply>(ctx, {
    slot: "tester",
    context: CONTEXT_INTRO,
    system: TESTER_JUDGE,
    messages: [{ role: "user", content, images: await imagesOf(photos) }],
    schema: TESTER_JUDGE_SCHEMA,
    schemaName: "test_result",
    maxTokens: 4000,
    timeoutMs: 3 * MINUTE
  });
  const verdict = ["pass", "fail", "unclear"].includes(judge.data.verdict)
    ? judge.data.verdict
    : "unclear";
  await task.update({ testVerdict: verdict });
  await ctx.say("tester", "test_result", judge.data.summary || "", {
    ...judge.meta,
    verdict,
    findings: (judge.data.findings || []).slice(0, 6)
  });
  return verdict;
};

/** O que o testador reprovou, como pedido de ajuste ao desenvolvedor. */
export const testFeedback = async (task: DevTask): Promise<DevFeedback[]> => {
  const result = await lastEvent(task, "tester", "test_result");
  const findings = (result?.meta?.findings ||
    []) as TesterJudgeReply["findings"];
  return findings
    .filter(finding => !finding.ok)
    .map(finding => ({
      from: "tester" as const,
      text: `${finding.check}: ${finding.note}`
    }));
};

/**
 * PR mergeado no GitHub? Devolve o commit do merge (os testes esperam a
 * versão com ele entrar no ar), ou null enquanto não foi.
 */
export const pullMerged = async (
  task: DevTask,
  repo: RepoSource
): Promise<string | null> => {
  if (!task.prNumber || repo.kind !== "github") return null;
  const state = await repo.pull(task.prNumber);
  if (!state?.merged) return null;
  return state.mergeSha || "merged";
};

// tarefas paradas em "rodando" quando o servidor caiu
export const unfinishedTasks = () =>
  DevTask.findAll({
    where: { status: { [Op.in]: ["queued", "running"] } },
    attributes: ["id", "priority"]
  });
