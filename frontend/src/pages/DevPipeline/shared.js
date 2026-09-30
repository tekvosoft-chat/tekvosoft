import React, { useContext, useEffect, useRef } from "react";

import { i18n } from "../../translate/i18n";
import { SocketContext } from "../../context/Socket/SocketContext";

export const t = (key, values) => i18n.t(`devPipeline.${key}`, values);

/** Etapas do quadro, na ordem em que a tarefa anda. */
export const STAGES = [
  { key: "intake", tone: "info" },
  { key: "prioritization", tone: "warning" },
  { key: "development", tone: "brand" },
  { key: "review", tone: "success" },
  { key: "pr", tone: "brand" },
  { key: "tests", tone: "info" },
  { key: "done", tone: "success" }
];
export const CANCELLED = { key: "cancelled", tone: "neutral" };
export const stageOf = key =>
  STAGES.find(stage => stage.key === key) || CANCELLED;

export const PRIORITIES = [
  { key: "urgent", tone: "danger" },
  { key: "high", tone: "warning" },
  { key: "normal", tone: "info" },
  { key: "low", tone: "neutral" }
];
export const priorityOf = key =>
  PRIORITIES.find(priority => priority.key === key) || PRIORITIES[2];
export const priorityRank = key =>
  Math.max(
    0,
    PRIORITIES.findIndex(priority => priority.key === key)
  );

/**
 * Dificuldade que a triagem deu: escolhe o modelo do desenvolvedor e do
 * revisor. Demanda antiga não tem; vale o tamanho estimado (S, M, L).
 */
export const DIFFICULTIES = [
  { key: "easy", tone: "success" },
  { key: "medium", tone: "warning" },
  { key: "hard", tone: "danger" }
];
export const difficultyOf = task => {
  const key =
    task?.difficulty || { S: "easy", M: "medium", L: "hard" }[task?.effort];
  return DIFFICULTIES.find(item => item.key === key) || null;
};

export const busy = task => ["queued", "running"].includes(task?.status);
export const closed = task => ["done", "cancelled"].includes(task?.stage);

/** Cor de um tom (os mesmos da Ajuda: marca, info, aviso, sucesso, perigo). */
export const toneStyle = (theme, tone) => {
  const tkv = theme.palette.tkv;
  const sem = tkv.semantic;
  switch (tone) {
    case "success":
      return { color: sem.success, backgroundColor: sem.successSoft };
    case "warning":
      return { color: sem.warning, backgroundColor: sem.warningSoft };
    case "danger":
      return { color: sem.danger, backgroundColor: sem.dangerSoft };
    case "info":
      return { color: sem.info, backgroundColor: sem.infoSoft };
    case "neutral":
      return {
        color: theme.palette.text.secondary,
        backgroundColor: tkv.surfaceSunken
      };
    default:
      return { color: tkv.brand.text, backgroundColor: tkv.brand.textSoft };
  }
};

/** 12400 -> "12,4 mil" (no idioma da pessoa). */
export const compact = value => {
  try {
    return new Intl.NumberFormat(i18n.language?.replace("_", "-") || "pt", {
      notation: "compact",
      maximumFractionDigits: 1
    }).format(value || 0);
  } catch {
    return String(value || 0);
  }
};

export const totalTokens = task =>
  (task?.tokensIn || 0) + (task?.tokensOut || 0);

// ---------------------------------------------------------------------------
// custo em reais: o backend guarda em dólar (preço de tabela do provedor) e
// manda a cotação no /dev-tasks/setup; a página guarda aqui para todos usarem

let usdRate = 5.5;
export const setUsdRate = rate => {
  if (rate > 0) usdRate = rate;
};
export const getUsdRate = () => usdRate;

const money = value =>
  new Intl.NumberFormat(i18n.language?.replace("_", "-") || "pt", {
    style: "currency",
    currency: "BRL"
  }).format(value);

/** US$ -> "≈ R$ 1,07"; centavo quebrado vira "< R$ 0,01". */
export const brl = (usd, { approx = true } = {}) => {
  const value = (usd || 0) * usdRate;
  if (value > 0 && value < 0.01) return `< ${money(0.01)}`;
  return `${approx ? "≈ " : ""}${money(value)}`;
};

/** "ERR_DEV_AI_AUTH: detalhe" -> texto traduzido + detalhe. */
export const errorOf = raw => {
  const text = String(raw || "");
  const cut = text.indexOf(": ");
  const code = cut > 0 ? text.slice(0, cut) : text;
  const detail = cut > 0 ? text.slice(cut + 2) : "";
  const known = i18n.exists(`devPipeline.errors.${code}`);
  return {
    code,
    message: known ? t(`errors.${code}`) : t("errors.ERR_DEV_FAILED"),
    detail: known ? detail : text
  };
};

/**
 * O que a tarefa espera agora, numa linha: é o que o cartão mostra e o que
 * diz à pessoa se é a vez dela.
 */
export const statusLine = task => {
  if (task.status === "error") {
    return { tone: "danger", text: errorOf(task.error).message };
  }
  if (task.status === "queued")
    return { tone: "neutral", text: t("line.queued") };
  if (task.status === "running") {
    return {
      tone: "brand",
      text: t(`line.running.${task.stage}`),
      running: true
    };
  }
  if (task.stage === "cancelled")
    return { tone: "neutral", text: t("line.cancelled") };
  if (task.stage === "done") return { tone: "success", text: t("line.done") };
  if (task.stage === "intake") {
    return task.questions?.length
      ? { tone: "warning", text: t("line.questions"), mine: true }
      : { tone: "warning", text: t("line.notAnalyzed"), mine: true };
  }
  if (task.stage === "prioritization") {
    return { tone: "warning", text: t("line.approve"), mine: true };
  }
  if (task.stage === "review") {
    return { tone: "warning", text: t("line.stuck"), mine: true };
  }
  if (task.stage === "pr") {
    return task.prNumber
      ? {
          tone: "success",
          text: t("line.pr", { number: task.prNumber }),
          mine: true
        }
      : { tone: "success", text: t("line.patch"), mine: true };
  }
  if (task.stage === "tests") {
    // reprovado ou sem conclusão: a pessoa decide; antes disso, o Clique
    // espera a versão nova subir, sem precisar de ninguém
    if (task.testVerdict === "fail") {
      return { tone: "danger", text: t("line.testsFailed"), mine: true };
    }
    if (task.testVerdict === "unclear") {
      return { tone: "warning", text: t("line.testsUnclear"), mine: true };
    }
    return { tone: "info", text: t("line.testsWaiting") };
  }
  return { tone: "neutral", text: "" };
};

/**
 * Recarrega a tela quando o pipeline anda (evento "dev-task" na sala do
 * super). As mudanças chegam em rajada (cada fala de agente é um evento):
 * junta tudo que chegar em 400 ms numa recarga só.
 */
export const useDevLive = onChange => {
  const socketManager = useContext(SocketContext);
  const latest = useRef(onChange);
  latest.current = onChange;

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketManager.GetSocket(companyId);
    let timer = null;
    let pending = [];
    const handler = data => {
      pending.push(data);
      clearTimeout(timer);
      timer = setTimeout(() => {
        const batch = pending;
        pending = [];
        latest.current(batch);
      }, 400);
    };
    socket.on("dev-task", handler);
    return () => {
      clearTimeout(timer);
      socket.off?.("dev-task", handler);
      socket.disconnect();
    };
  }, [socketManager]);
};

// ---------------------------------------------------------------------------
// markdown simples (títulos, listas, `código` e **negrito**) sem HTML cru:
// o texto vem da IA e de clientes, então tudo vira elemento React

const inline = (text, keyBase) =>
  String(text)
    .split(/(`[^`]+`|\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part, i) => {
      const key = `${keyBase}-${i}`;
      if (part.startsWith("`") && part.endsWith("`")) {
        return <code key={key}>{part.slice(1, -1)}</code>;
      }
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={key}>{part.slice(2, -2)}</strong>;
      }
      return <React.Fragment key={key}>{part}</React.Fragment>;
    });

export const Markdown = ({ text, className }) => {
  const blocks = [];
  let list = null;
  const flush = () => {
    if (list) blocks.push(list);
    list = null;
  };

  String(text || "")
    .split("\n")
    .forEach((line, i) => {
      const heading = line.match(/^(#{1,4})\s+(.*)$/);
      const bullet = line.match(/^\s*(?:[-*]|\d+[.)])\s+(.*)$/);
      if (heading) {
        flush();
        blocks.push(
          <p key={i} data-heading>
            {inline(heading[2], i)}
          </p>
        );
      } else if (bullet) {
        if (!list) list = { key: i, items: [] };
        list.items.push(<li key={i}>{inline(bullet[1], i)}</li>);
      } else if (line.trim()) {
        flush();
        blocks.push(<p key={i}>{inline(line, i)}</p>);
      } else {
        flush();
      }
    });
  flush();

  return (
    <div className={className}>
      {blocks.map(block =>
        block.items ? <ul key={`l${block.key}`}>{block.items}</ul> : block
      )}
    </div>
  );
};
