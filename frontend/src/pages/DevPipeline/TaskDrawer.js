import React, { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import Button from "@material-ui/core/Button";
import ButtonBase from "@material-ui/core/ButtonBase";
import CircularProgress from "@material-ui/core/CircularProgress";
import Drawer from "@material-ui/core/Drawer";
import IconButton from "@material-ui/core/IconButton";
import InputBase from "@material-ui/core/InputBase";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import TextField from "@material-ui/core/TextField";
import CloseRoundedIcon from "@material-ui/icons/CloseRounded";
import ArrowBackRoundedIcon from "@material-ui/icons/ArrowBackRounded";
import MoreVertRoundedIcon from "@material-ui/icons/MoreVertRounded";
import CheckRoundedIcon from "@material-ui/icons/CheckRounded";
import AddPhotoAlternateOutlinedIcon from "@material-ui/icons/AddPhotoAlternateOutlined";
import GetAppRoundedIcon from "@material-ui/icons/GetAppRounded";
import OpenInNewRoundedIcon from "@material-ui/icons/OpenInNewRounded";
import CallSplitRoundedIcon from "@material-ui/icons/CallSplitRounded";
import moment from "moment";
import { toast } from "react-toastify";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";
import BoxLoader from "../../components/ui/BoxLoader";
import EmptyState from "../../components/ui/EmptyState";
import ConfirmationModal from "../../components/ConfirmationModal";
import {
  Markdown,
  PRIORITIES,
  STAGES,
  brl,
  busy,
  closed,
  compact,
  difficultyOf,
  errorOf,
  priorityOf,
  statusLine,
  t,
  toneStyle,
  totalTokens,
  useDevLive
} from "./shared";
import { AgentAvatar, agentName, agentRole } from "./team";
import {
  DevImages,
  DevVideos,
  IMAGE_TYPES,
  PendingImages,
  pastedImages,
  pickImages
} from "./media";

/**
 * Uma demanda aberta ao lado (no celular, ocupa a tela toda, com uma barra
 * fixa no topo para voltar): em que etapa está, o que espera da pessoa e
 * três abas. Conversa: o que cada agente disse e fez, em ordem (com as
 * fotos e o vídeo do teste de tela), e a caixa para falar com eles.
 * Especificação: a tarefa reescrita pela triagem, que dá para ajustar à
 * mão. Código: o diff.
 */
// falas de uma linha só (decisões e mudanças de etapa)
const LINE_KINDS = [
  "stage",
  "approve",
  "publish",
  "done",
  "cancel",
  "merged",
  "test"
];

const useStyles = makeStyles(theme => {
  const tkv = theme.palette.tkv;
  const mono =
    'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';
  return {
    paper: {
      width: 760,
      maxWidth: "100vw",
      display: "flex",
      flexDirection: "column",
      backgroundColor: tkv.surface,
      [theme.breakpoints.down("xs")]: {
        width: "100%",
        height: "var(--vh, 100vh)",
        maxHeight: "none",
        borderRadius: 0
      }
    },
    // celular: barra fixa no topo, com voltar e o menu sempre à mão
    appBar: {
      flex: "none",
      display: "flex",
      alignItems: "center",
      gap: 4,
      minHeight: 56,
      padding: "0 4px",
      paddingTop: "var(--safe-top, 0px)",
      borderBottom: `1px solid ${tkv.border}`,
      backgroundColor: tkv.surface
    },
    appBarText: {
      flex: 1,
      minWidth: 0,
      fontSize: "0.9375rem",
      fontWeight: 600,
      color: theme.palette.text.secondary,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      "& b": { color: theme.palette.text.primary }
    },
    head: {
      flex: "none",
      backgroundColor: tkv.surface,
      padding: theme.spacing(2, 1.5, 1.5, 2.5),
      borderBottom: `1px solid ${tkv.border}`,
      [theme.breakpoints.down("xs")]: {
        padding: theme.spacing(2, 2, 2)
      }
    },
    headTop: { display: "flex", alignItems: "flex-start", gap: 4 },
    headText: { flex: 1, minWidth: 0 },
    title: {
      fontSize: "1.125rem",
      fontWeight: 700,
      lineHeight: 1.3,
      color: theme.palette.text.primary,
      overflowWrap: "anywhere",
      [theme.breakpoints.down("xs")]: { fontSize: "1.1875rem" }
    },
    meta: {
      marginTop: 4,
      fontSize: "0.8125rem",
      color: theme.palette.text.secondary
    },
    steps: {
      display: "flex",
      gap: 4,
      margin: theme.spacing(1.5, 0, 0),
      padding: 0,
      listStyle: "none",
      overflowX: "auto",
      scrollbarWidth: "none",
      "&::-webkit-scrollbar": { display: "none" }
    },
    step: {
      flex: "1 0 auto",
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "5px 10px 5px 6px",
      borderRadius: tkv.radius.pill,
      fontSize: "0.75rem",
      fontWeight: 600,
      whiteSpace: "nowrap",
      color: theme.palette.text.secondary,
      backgroundColor: tkv.surfaceSunken
    },
    stepDot: {
      display: "grid",
      placeItems: "center",
      width: 18,
      height: 18,
      borderRadius: "50%",
      fontSize: "0.6875rem",
      fontWeight: 800,
      backgroundColor: tkv.surface,
      "& svg": { fontSize: 13 }
    },
    stepDone: { color: tkv.semantic.success },
    stepCurrent: {
      color: tkv.brand.contrastText,
      backgroundColor: tkv.brand.main,
      "& $stepDot": { color: tkv.brand.text }
    },
    chips: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6,
      marginTop: theme.spacing(1.25)
    },
    chip: {
      display: "inline-flex",
      alignItems: "center",
      height: 24,
      padding: "0 9px",
      borderRadius: tkv.radius.pill,
      fontSize: "0.75rem",
      fontWeight: 600,
      whiteSpace: "nowrap",
      border: "1px solid transparent"
    },
    chipButton: { cursor: "pointer" },
    chipOff: {
      color: `${theme.palette.text.secondary} !important`,
      backgroundColor: "transparent !important",
      borderColor: tkv.border
    },
    banner: {
      display: "flex",
      alignItems: "center",
      flexWrap: "wrap",
      gap: theme.spacing(1),
      marginTop: theme.spacing(1.5),
      padding: theme.spacing(1.25, 1.5),
      borderRadius: tkv.radius.md,
      border: "1px solid transparent"
    },
    bannerText: {
      flex: "1 1 220px",
      minWidth: 0,
      display: "flex",
      flexDirection: "column",
      gap: 2,
      fontSize: "0.875rem",
      fontWeight: 700
    },
    bannerLine: { display: "flex", alignItems: "center", gap: 8 },
    bannerHint: {
      fontSize: "0.8125rem",
      fontWeight: 500,
      color: theme.palette.text.secondary
    },
    bannerDetail: {
      fontFamily: mono,
      fontSize: "0.75rem",
      fontWeight: 400,
      color: theme.palette.text.secondary,
      overflowWrap: "anywhere"
    },
    bannerActions: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 8,
      [theme.breakpoints.down("xs")]: {
        width: "100%",
        flexDirection: "column",
        alignItems: "stretch"
      }
    },
    action: {
      borderRadius: tkv.radius.pill,
      textTransform: "none",
      fontWeight: 700,
      boxShadow: "none",
      [theme.breakpoints.down("xs")]: { minHeight: 42 }
    },
    branch: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      maxWidth: "100%",
      height: 24,
      padding: "0 9px",
      borderRadius: tkv.radius.pill,
      border: `1px solid ${tkv.border}`,
      fontFamily: mono,
      fontSize: "0.72rem",
      color: theme.palette.text.secondary,
      "& svg": { fontSize: 14, flex: "none" },
      "& span": {
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    },
    steps2: { margin: "6px 0 0", paddingLeft: 22, "& li": { marginBottom: 3 } },
    stepCode: {
      fontFamily: mono,
      fontSize: "0.75rem",
      overflowWrap: "anywhere"
    },
    verdict: {
      display: "flex",
      gap: 8,
      alignItems: "flex-start",
      marginTop: 6,
      "& > span:last-child": { flex: 1, minWidth: 0 }
    },
    danger: { color: tkv.semantic.danger },
    // no computador o cabeçalho fica parado e só a aba rola; no celular ele
    // ocuparia meia tela, então rola junto e as abas grudam no topo
    scroller: {
      flex: 1,
      minHeight: 0,
      display: "flex",
      flexDirection: "column",
      [theme.breakpoints.down("xs")]: {
        display: "block",
        overflowY: "auto",
        backgroundColor: tkv.surfaceSunken
      }
    },
    tabs: {
      flex: "none",
      display: "flex",
      gap: 4,
      overflowX: "auto",
      scrollbarWidth: "none",
      "&::-webkit-scrollbar": { display: "none" },
      padding: theme.spacing(1, 2, 0),
      borderBottom: `1px solid ${tkv.border}`,
      backgroundColor: tkv.surface,
      [theme.breakpoints.down("xs")]: {
        position: "sticky",
        top: 0,
        zIndex: 2
      }
    },
    tab: {
      flex: "none",
      height: 42,
      padding: "0 12px",
      fontSize: "0.875rem",
      fontWeight: 600,
      color: theme.palette.text.secondary,
      borderBottom: "2px solid transparent"
    },
    tabOn: { color: tkv.brand.text, borderBottomColor: tkv.brand.main },
    body: {
      flex: 1,
      minHeight: 0,
      overflowY: "auto",
      padding: theme.spacing(2, 2.5),
      backgroundColor: tkv.surfaceSunken,
      ...theme.scrollbarStyles,
      [theme.breakpoints.down("xs")]: {
        overflowY: "visible",
        minHeight: "55%",
        padding: theme.spacing(2, 1.5, 3)
      }
    },
    timeline: {
      display: "flex",
      flexDirection: "column",
      gap: theme.spacing(1.75)
    },
    event: {
      display: "flex",
      alignItems: "flex-start",
      gap: 10,
      // celular: a foto sobe para a linha do nome e o balão fica largo
      [theme.breakpoints.down("xs")]: { display: "block" }
    },
    eventAvatar: {
      marginTop: 2,
      [theme.breakpoints.down("xs")]: { display: "none" }
    },
    headAvatar: {
      display: "none",
      alignSelf: "center",
      [theme.breakpoints.down("xs")]: { display: "inline-flex" }
    },
    eventMain: { flex: 1, minWidth: 0 },
    eventHead: {
      display: "flex",
      alignItems: "baseline",
      flexWrap: "wrap",
      gap: 6,
      marginBottom: 4,
      fontSize: "0.8125rem",
      color: theme.palette.text.secondary,
      "& b": { color: theme.palette.text.primary }
    },
    eventTime: { marginLeft: "auto", fontSize: "0.75rem" },
    role: {
      padding: "1px 7px",
      borderRadius: tkv.radius.pill,
      fontSize: "0.6875rem",
      fontWeight: 600,
      backgroundColor: tkv.surfaceSunken
    },
    inputRow: { display: "flex", alignItems: "flex-end", gap: 4 },
    bubble: {
      padding: theme.spacing(1.25, 1.5),
      borderRadius: 14,
      fontSize: "0.9063rem",
      lineHeight: 1.5,
      overflowWrap: "anywhere",
      color: theme.palette.text.primary,
      backgroundColor: tkv.surface,
      border: `1px solid ${tkv.border}`
    },
    bubbleHuman: {
      backgroundColor: tkv.brand.textSoft,
      borderColor: tkv.brand.textBorder
    },
    plain: { whiteSpace: "pre-wrap" },
    markdown: {
      "& p": { margin: "0 0 6px" },
      "& p:last-child": { marginBottom: 0 },
      "& p[data-heading]": { fontWeight: 700, marginTop: 8 },
      "& ul": { margin: "0 0 6px", paddingLeft: 20 },
      "& code": {
        padding: "1px 5px",
        borderRadius: 5,
        fontFamily: mono,
        fontSize: "0.8125rem",
        backgroundColor: tkv.surfaceSunken
      }
    },
    sub: {
      marginTop: 10,
      fontSize: "0.75rem",
      fontWeight: 700,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      color: theme.palette.text.secondary
    },
    files: { display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 },
    file: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      maxWidth: "100%",
      padding: "2px 8px",
      borderRadius: 6,
      fontFamily: mono,
      fontSize: "0.75rem",
      color: theme.palette.text.primary,
      backgroundColor: tkv.surfaceSunken,
      overflowWrap: "anywhere"
    },
    fileOp: { fontFamily: "inherit", fontWeight: 700, fontSize: "0.6875rem" },
    list: { margin: "6px 0 0", paddingLeft: 20, "& li": { marginBottom: 4 } },
    problem: { color: tkv.semantic.danger },
    comment: {
      display: "flex",
      gap: 8,
      alignItems: "flex-start",
      marginTop: 8,
      "& > span:last-child": { flex: 1, minWidth: 0 }
    },
    notes: {
      marginTop: 10,
      padding: theme.spacing(1, 1.25),
      borderRadius: 10,
      fontSize: "0.8438rem",
      whiteSpace: "pre-wrap",
      backgroundColor: tkv.surfaceSunken
    },
    usage: {
      marginTop: 4,
      fontSize: "0.72rem",
      color: theme.palette.text.disabled
    },
    systemLine: {
      alignSelf: "center",
      maxWidth: "100%",
      padding: "4px 12px",
      borderRadius: tkv.radius.pill,
      fontSize: "0.75rem",
      textAlign: "center",
      color: theme.palette.text.secondary,
      backgroundColor: tkv.surface,
      border: `1px solid ${tkv.border}`
    },
    inlineButton: {
      marginTop: 8,
      borderRadius: tkv.radius.pill,
      textTransform: "none",
      fontWeight: 700
    },
    composer: {
      flex: "none",
      padding: theme.spacing(1.25, 1.5),
      paddingBottom: `calc(${theme.spacing(1.25)}px + var(--safe-bottom, 0px))`,
      borderTop: `1px solid ${tkv.border}`,
      backgroundColor: tkv.surface
    },
    input: {
      width: "100%",
      padding: "9px 14px",
      borderRadius: 18,
      border: `1px solid ${tkv.border}`,
      backgroundColor: tkv.surfaceSunken,
      fontSize: "0.9375rem"
    },
    composerRow: {
      display: "flex",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 6,
      marginTop: 8
    },
    composerHint: {
      flex: "1 1 200px",
      fontSize: "0.75rem",
      color: theme.palette.text.secondary,
      [theme.breakpoints.down("xs")]: { flexBasis: "100%" }
    },
    specHead: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: theme.spacing(1)
    },
    specTitle: {
      flex: 1,
      margin: 0,
      fontSize: "1rem",
      fontWeight: 700,
      color: theme.palette.text.primary
    },
    card: {
      padding: theme.spacing(1.5, 1.75),
      marginBottom: theme.spacing(1.5),
      borderRadius: tkv.radius.md,
      border: `1px solid ${tkv.border}`,
      backgroundColor: tkv.surface,
      fontSize: "0.9063rem",
      lineHeight: 1.5,
      color: theme.palette.text.primary
    },
    field: { marginBottom: theme.spacing(1.5), backgroundColor: tkv.surface },
    codeBar: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6,
      marginBottom: theme.spacing(1.5)
    },
    diffFile: {
      marginBottom: theme.spacing(1.5),
      borderRadius: tkv.radius.md,
      border: `1px solid ${tkv.border}`,
      backgroundColor: tkv.surface,
      overflow: "hidden"
    },
    diffName: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: theme.spacing(1, 1.5),
      fontFamily: mono,
      fontSize: "0.8125rem",
      fontWeight: 700,
      borderBottom: `1px solid ${tkv.border}`,
      overflowWrap: "anywhere"
    },
    diff: {
      margin: 0,
      overflowX: "auto",
      fontFamily: mono,
      fontSize: "0.75rem",
      lineHeight: 1.55,
      ...theme.scrollbarStyles
    },
    diffInner: { display: "inline-block", minWidth: "100%" },
    diffLine: { display: "block", padding: "0 12px", whiteSpace: "pre" },
    add: { backgroundColor: tkv.semantic.successSoft },
    del: { backgroundColor: tkv.semantic.dangerSoft },
    hunk: { color: tkv.semantic.info, backgroundColor: tkv.surfaceSunken }
  };
});

const time = date => moment(date).format("DD/MM HH:mm");

const DiffView = ({ diff, changedFiles }) => {
  const classes = useStyles();
  const theme = useTheme();
  const blocks = String(diff || "")
    .split(/\n(?=diff --git )/)
    .filter(Boolean);
  const opOf = name => changedFiles?.find(file => file.path === name)?.op;

  return blocks.map(block => {
    const lines = block.split("\n");
    const name = (lines[0].match(/^diff --git a\/(.+?) b\//) || [])[1] || "";
    const op = opOf(name);
    const body = lines
      .slice(1)
      .filter(
        line =>
          !/^(--- |\+\+\+ |new file mode|deleted file mode|index )/.test(line)
      );
    return (
      <section key={name} className={classes.diffFile}>
        <header className={classes.diffName}>
          {op && (
            <span
              className={classes.chip}
              style={toneStyle(
                theme,
                { create: "success", delete: "danger" }[op] || "info"
              )}
            >
              {t(`code.ops.${op}`)}
            </span>
          )}
          {name}
        </header>
        <pre className={classes.diff}>
          <span className={classes.diffInner}>
            {body.map((line, i) => (
              <span
                // eslint-disable-next-line react/no-array-index-key
                key={i}
                className={clsx(classes.diffLine, {
                  [classes.add]: line.startsWith("+"),
                  [classes.del]: line.startsWith("-"),
                  [classes.hunk]: line.startsWith("@@")
                })}
              >
                {line || " "}
              </span>
            ))}
          </span>
        </pre>
      </section>
    );
  });
};

const TaskDrawer = ({ taskId, setup, onClose, onChanged }) => {
  const classes = useStyles();
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("xs"));
  const [task, setTask] = useState(null);
  const [tab, setTab] = useState("conversation");
  const [text, setText] = useState("");
  const [images, setImages] = useState([]);
  const fileRef = useRef(null);
  const [sending, setSending] = useState(false);
  const [acting, setActing] = useState(false);
  const [approvePriority, setApprovePriority] = useState("normal");
  const [menu, setMenu] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ title: "", spec: "", acceptance: "" });
  const bodyRef = useRef(null);
  const scrollerRef = useRef(null);

  const load = useCallback(async () => {
    if (!taskId) return;
    try {
      const { data } = await api.get(`/dev-tasks/${taskId}`);
      setTask(data);
    } catch (err) {
      toastError(err);
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  useEffect(() => {
    setTask(null);
    setText("");
    setTab("conversation");
    setEditing(false);
    load();
  }, [load]);

  useEffect(() => {
    if (task) setApprovePriority(task.priority);
  }, [task?.id, task?.priority]); // eslint-disable-line react-hooks/exhaustive-deps

  useDevLive(batch => {
    const mine = batch.filter(item => item?.taskId === taskId);
    if (!mine.length) return;
    if (mine.some(item => item.action === "delete")) onClose();
    else load();
  });

  // Rolagem. Computador: a conversa abre na última fala. Celular: o painel
  // abre no topo, com a decisão pendente à vista, e só desce sozinho quando
  // chega fala nova. As outras abas abrem no topo.
  const seen = useRef({ id: null, count: 0, tab: null });
  useEffect(() => {
    const el = isPhone ? scrollerRef.current : bodyRef.current;
    if (!el || !task) return;
    const count = task.events?.length || 0;
    const first = seen.current.id !== task.id;
    const grew = !first && count > seen.current.count;
    const tabChanged = !first && seen.current.tab !== tab;
    seen.current = { id: task.id, count, tab };

    if (tab !== "conversation") {
      if (first || tabChanged) el.scrollTop = 0;
    } else if (isPhone) {
      if (first) el.scrollTop = 0;
      else if (grew) el.scrollTop = el.scrollHeight;
    } else if (first || grew || tabChanged) {
      el.scrollTop = el.scrollHeight;
    }
  }, [task, tab, isPhone]);

  const act = async (path, body = {}, message) => {
    setActing(true);
    try {
      await api.post(`/dev-tasks/${taskId}/${path}`, body);
      if (message) toast.success(message);
      await load();
      onChanged();
    } catch (err) {
      toastError(err);
    }
    setActing(false);
  };

  const send = async rerun => {
    const body = text.trim();
    if ((!body && !images.length) || sending) return;
    setSending(true);
    try {
      const form = new FormData();
      form.append("body", body);
      form.append("rerun", rerun ? "true" : "false");
      images.forEach(file => form.append("files", file));
      await api.post(`/dev-tasks/${taskId}/comments`, form);
      setText("");
      setImages([]);
      if (rerun) toast.success(t("toasts.sent"));
      await load();
      onChanged();
    } catch (err) {
      toastError(err);
    }
    setSending(false);
  };

  const download = async () => {
    try {
      const { data } = await api.get(`/dev-tasks/${taskId}/patch`, {
        responseType: "blob"
      });
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `tarefa-${taskId}.patch`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      toastError(err);
    }
  };

  const remove = async () => {
    try {
      await api.delete(`/dev-tasks/${taskId}`);
      onChanged();
      onClose();
    } catch (err) {
      toastError(err);
    }
  };

  const startEdit = () => {
    setDraft({
      title: task.title || "",
      spec: task.spec || "",
      acceptance: (task.acceptance || []).join("\n")
    });
    setEditing(true);
  };

  const saveEdit = async () => {
    try {
      await api.put(`/dev-tasks/${taskId}`, {
        title: draft.title,
        spec: draft.spec,
        acceptance: draft.acceptance.split("\n")
      });
      setEditing(false);
      await load();
      onChanged();
    } catch (err) {
      toastError(err);
    }
  };

  // ------------------------------------------------------------------ cabeça

  const renderSteps = () => {
    const current = STAGES.findIndex(stage => stage.key === task.stage);
    return (
      <ol className={classes.steps}>
        {STAGES.map((stage, index) => {
          const done =
            task.stage === "done" || (current >= 0 && index < current);
          const now = index === current && task.stage !== "done";
          return (
            <li
              key={stage.key}
              className={clsx(classes.step, {
                [classes.stepDone]: done,
                [classes.stepCurrent]: now
              })}
              aria-current={now ? "step" : undefined}
            >
              <span className={classes.stepDot}>
                {done ? <CheckRoundedIcon /> : index + 1}
              </span>
              {t(`stages.${stage.key}`)}
            </li>
          );
        })}
      </ol>
    );
  };

  const renderBanner = () => {
    const line = statusLine(task);
    const tone = toneStyle(theme, line.tone);
    const error = task.status === "error" ? errorOf(task.error) : null;
    const buttons = [];
    let hint = "";

    const primary = (key, label, onClick, extra = {}) => (
      <Button
        key={key}
        variant="contained"
        color="primary"
        size="small"
        className={classes.action}
        disabled={acting}
        onClick={onClick}
        {...extra}
      >
        {label}
      </Button>
    );
    const secondary = (key, label, onClick, extra = {}) => (
      <Button
        key={key}
        variant="outlined"
        size="small"
        className={classes.action}
        disabled={acting}
        onClick={onClick}
        {...extra}
      >
        {label}
      </Button>
    );

    if (busy(task)) {
      hint = t("hints.running");
      buttons.push(
        secondary("cancel", t("actions.cancel"), () => setConfirm("cancel"), {
          className: clsx(classes.action, classes.danger)
        })
      );
    } else if (task.status === "error") {
      hint = t("hints.error");
      buttons.push(primary("retry", t("actions.retry"), () => act("retry")));
    } else if (task.stage === "intake" && task.status === "waiting") {
      if (task.questions?.length) hint = t("hints.questions");
      else {
        hint = t("hints.notAnalyzed");
        buttons.push(
          primary("analyze", t("actions.analyze"), () => act("retry"))
        );
      }
    } else if (task.stage === "prioritization" && task.status === "waiting") {
      hint = t("hints.approve");
      buttons.push(
        primary("approve", t("actions.approve"), () =>
          act("approve", { priority: approvePriority }, t("toasts.approved"))
        )
      );
    } else if (task.stage === "review" && task.status === "waiting") {
      hint = t("hints.stuck");
      buttons.push(
        primary("publish", t("actions.publish"), () => act("publish"))
      );
    } else if (task.stage === "pr") {
      hint = task.prUrl ? t("hints.pr") : t("hints.patch");
      if (task.prUrl) {
        buttons.push(
          primary("open", t("actions.openPr"), undefined, {
            href: task.prUrl,
            target: "_blank",
            rel: "noopener noreferrer",
            endIcon: <OpenInNewRoundedIcon />
          })
        );
      } else {
        buttons.push(
          primary("download", t("actions.download"), download, {
            startIcon: <GetAppRoundedIcon />
          })
        );
      }
      // o merge manda para os testes sozinho; o botão é para quando a
      // mudança já está no ar por outro caminho (ou o patch foi aplicado)
      if (setup?.browser) {
        buttons.push(
          secondary("test", t("actions.testNow"), () =>
            act("test", {}, t("toasts.testing"))
          )
        );
      }
      buttons.push(secondary("done", t("actions.done"), () => act("done")));
    } else if (task.stage === "tests") {
      if (task.testVerdict === "fail" || task.testVerdict === "unclear") {
        hint =
          task.testVerdict === "fail"
            ? t("hints.testsFailed")
            : t("hints.testsUnclear");
        buttons.push(
          primary("test", t("actions.testAgain"), () =>
            act("test", {}, t("toasts.testing"))
          )
        );
        buttons.push(
          secondary("done", t("actions.doneAnyway"), () => act("done"))
        );
      } else {
        hint = t("hints.testsWaiting");
        buttons.push(
          primary("test", t("actions.testNow"), () =>
            act("test", {}, t("toasts.testing"))
          )
        );
        buttons.push(
          secondary("done", t("actions.doneWithoutTests"), () => act("done"))
        );
      }
    }

    return (
      <div
        className={classes.banner}
        style={{
          backgroundColor: tone.backgroundColor,
          borderColor: tone.backgroundColor
        }}
      >
        <div className={classes.bannerText}>
          <span className={classes.bannerLine} style={{ color: tone.color }}>
            {line.running && <CircularProgress size={14} color="inherit" />}
            {line.text}
          </span>
          {hint && <span className={classes.bannerHint}>{hint}</span>}
          {error?.detail && (
            <span className={classes.bannerDetail}>{error.detail}</span>
          )}
          {task.stage === "prioritization" && task.status === "waiting" && (
            <span className={classes.chips} style={{ marginTop: 6 }}>
              {PRIORITIES.map(item => (
                <ButtonBase
                  key={item.key}
                  className={clsx(classes.chip, classes.chipButton, {
                    [classes.chipOff]: approvePriority !== item.key
                  })}
                  style={toneStyle(theme, item.tone)}
                  aria-pressed={approvePriority === item.key}
                  onClick={() => setApprovePriority(item.key)}
                >
                  {t(`priority.${item.key}`)}
                </ButtonBase>
              ))}
            </span>
          )}
        </div>
        {buttons.length > 0 && (
          <div className={classes.bannerActions}>{buttons}</div>
        )}
      </div>
    );
  };

  // ---------------------------------------------------------------- conversa

  const fileChips = files =>
    files?.length ? (
      <div className={classes.files}>
        {files.map(file => (
          <span key={file} className={classes.file}>
            {file}
          </span>
        ))}
      </div>
    ) : null;

  const usageLine = meta => {
    const usage = meta?.usage;
    if (!usage) return null;
    return (
      <div className={classes.usage}>
        {meta.model} ·{" "}
        {t("tokensDetail", {
          input: compact(usage.input + (usage.cacheWrite || 0)),
          output: compact(usage.output),
          cached: compact(usage.cacheRead)
        })}
        {typeof meta.cost === "number" && ` · ${brl(meta.cost)}`}
      </div>
    );
  };

  const eventTitle = event => {
    const { kind, meta = {}, agent } = event;
    switch (kind) {
      case "read":
        return agent === "triage" ? t("events.readTriage") : t("events.read");
      case "priority":
        return t("events.priority", {
          priority: t(`priority.${meta.priority || "normal"}`)
        });
      case "edits":
        return t("events.edits", { count: meta.files?.length || 0 });
      case "review":
        return meta.verdict === "approve"
          ? t("events.approved")
          : t("events.changes");
      case "pr":
        return t("events.pr", { number: meta.number });
      case "comment":
        return meta.rerun ? t("events.rerun") : t("events.comment");
      case "stuck":
        return t("events.stuckTitle");
      case "learn":
        return meta.skills?.length
          ? t("events.learned", { count: meta.skills.length })
          : t("events.learnedNothing");
      case "test_plan":
        return meta.needed ? t("events.testPlan") : t("events.testNotNeeded");
      case "test_run":
        return t("events.testRun", { count: meta.images?.length || 0 });
      case "test_result":
        return t(`events.testResult.${meta.verdict || "unclear"}`);
      case "test_skip":
        return t("events.testSkip");
      default:
        return i18n.exists(`devPipeline.events.${kind}`)
          ? t(`events.${kind}`)
          : "";
    }
  };

  const eventContent = event => {
    const { kind, meta = {}, content } = event;
    switch (kind) {
      case "spec":
        return (
          <>
            <Markdown text={content} className={classes.markdown} />
            {meta.acceptance?.length > 0 && (
              <>
                <div className={classes.sub}>{t("spec.acceptance")}</div>
                <ul className={classes.list}>
                  {meta.acceptance.map(item => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </>
            )}
            {meta.files?.length > 0 && (
              <>
                <div className={classes.sub}>{t("spec.files")}</div>
                {fileChips(meta.files)}
              </>
            )}
            {meta.skills?.length > 0 && (
              <>
                <div className={classes.sub}>{t("spec.skills")}</div>
                {fileChips(meta.skills)}
              </>
            )}
          </>
        );
      case "question":
        return (
          <>
            <ul className={classes.list} style={{ marginTop: 0 }}>
              {String(content)
                .split("\n")
                .filter(Boolean)
                .map(item => (
                  <li key={item}>{item}</li>
                ))}
            </ul>
            <div className={classes.usage}>{t("events.questionHint")}</div>
          </>
        );
      case "read":
        return (
          <>
            {fileChips(String(content).split("\n").filter(Boolean))}
            {meta.queries?.length > 0 && (
              <>
                <div className={classes.sub}>{t("events.searched")}</div>
                {fileChips(meta.queries.map(query => `“${query}”`))}
              </>
            )}
          </>
        );
      case "learn":
        return meta.skills?.length ? (
          <>
            {meta.skills.map(skill => (
              <div key={skill.id} className={classes.comment}>
                <span
                  className={classes.chip}
                  style={toneStyle(
                    theme,
                    skill.status === "active" ? "success" : "warning"
                  )}
                >
                  {t(`skills.status.${skill.status}`)}
                </span>
                <span>
                  <b>{skill.name}</b>
                  {skill.reason ? ` · ${skill.reason}` : ""}
                </span>
              </div>
            ))}
          </>
        ) : null;
      case "edits":
        return (
          <>
            {content && (
              <Markdown text={content} className={classes.markdown} />
            )}
            {fileChips(meta.files)}
            {meta.errors?.length > 0 && (
              <>
                <div className={clsx(classes.sub, classes.problem)}>
                  {t("events.editErrors")}
                </div>
                <ul className={classes.list}>
                  {meta.errors.map(item => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </>
            )}
            {meta.checks?.length > 0 && (
              <>
                <div className={clsx(classes.sub, classes.problem)}>
                  {t("events.checks")}
                </div>
                <ul className={classes.list}>
                  {meta.checks.map(check => (
                    <li key={`${check.path}${check.message}`}>
                      <code>{check.path}</code> {check.message}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {meta.notes && (
              <div className={classes.notes}>
                <b>{t("events.notes")}:</b> {meta.notes}
              </div>
            )}
          </>
        );
      case "review":
        return (
          <>
            {content && (
              <Markdown text={content} className={classes.markdown} />
            )}
            {(meta.comments || []).map(comment => (
              <div
                key={`${comment.path}${comment.message}`}
                className={classes.comment}
              >
                <span
                  className={classes.chip}
                  style={toneStyle(
                    theme,
                    { blocker: "danger", major: "warning" }[comment.severity] ||
                      "neutral"
                  )}
                >
                  {t(`severity.${comment.severity}`)}
                </span>
                <span>
                  {comment.path && <code>{comment.path}</code>}{" "}
                  {comment.message}
                </span>
              </div>
            ))}
          </>
        );
      case "error": {
        const error = errorOf(content ? `${meta.code}: ${content}` : meta.code);
        return (
          <>
            <div className={classes.problem}>{error.message}</div>
            {error.detail && (
              <div className={classes.bannerDetail}>{error.detail}</div>
            )}
          </>
        );
      }
      case "pr":
        return (
          <Button
            size="small"
            variant="outlined"
            className={classes.inlineButton}
            href={content}
            target="_blank"
            rel="noopener noreferrer"
            startIcon={<CallSplitRoundedIcon />}
          >
            {meta.branch || t("actions.openPr")}
          </Button>
        );
      case "patch":
        return (
          <>
            <div>{t(`events.patchReason.${meta.reason || "no_token"}`)}</div>
            <Button
              size="small"
              variant="outlined"
              className={classes.inlineButton}
              startIcon={<GetAppRoundedIcon />}
              onClick={download}
            >
              {t("actions.download")}
            </Button>
          </>
        );
      case "stuck":
        return t("events.stuck", { count: meta.rounds || 0 });
      case "test_plan":
        return (
          <>
            {content && <div className={classes.plain}>{content}</div>}
            {meta.needed && meta.devices?.length > 0 && (
              <div className={classes.files}>
                {meta.devices.map(device => (
                  <span
                    key={device}
                    className={classes.chip}
                    style={toneStyle(theme, "info")}
                  >
                    {t(`devices.${device}`)}
                  </span>
                ))}
              </div>
            )}
            {meta.needed && meta.checks?.length > 0 && (
              <>
                <div className={classes.sub}>{t("events.testChecks")}</div>
                <ul className={classes.list}>
                  {meta.checks.map(check => (
                    <li key={check}>{check}</li>
                  ))}
                </ul>
              </>
            )}
            {meta.needed && meta.steps?.length > 0 && (
              <>
                <div className={classes.sub}>{t("events.testSteps")}</div>
                <ol className={classes.steps2}>
                  {meta.steps.map((step, index) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <li key={index}>
                      {t(`testActions.${step.action}`)}{" "}
                      {step.target && (
                        <span className={classes.stepCode}>{step.target}</span>
                      )}
                      {step.note ? ` · ${step.note}` : ""}
                    </li>
                  ))}
                </ol>
              </>
            )}
          </>
        );
      case "test_run": {
        const pick = ids =>
          (ids || [])
            .map(id => (task.attachments || []).find(file => file.id === id))
            .filter(Boolean);
        const failed = (meta.log || []).filter(entry => !entry.ok);
        return (
          <>
            <DevImages taskId={task.id} files={pick(meta.images)} whole />
            <DevVideos taskId={task.id} files={pick(meta.videos)} />
            {failed.length > 0 && (
              <>
                <div className={clsx(classes.sub, classes.problem)}>
                  {t("events.testFailedSteps")}
                </div>
                <ul className={classes.list}>
                  {failed.map(entry => (
                    <li key={`${entry.device}-${entry.step}`}>
                      {t(`devices.${entry.device}`)} · {entry.step}.{" "}
                      {t(`testActions.${entry.action}`)}{" "}
                      <span className={classes.stepCode}>{entry.target}</span>:{" "}
                      {entry.error}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {meta.pageErrors?.length > 0 && (
              <>
                <div className={clsx(classes.sub, classes.problem)}>
                  {t("events.testPageErrors")}
                </div>
                <ul className={classes.list}>
                  {meta.pageErrors.map(error => (
                    <li key={error} className={classes.stepCode}>
                      {error}
                    </li>
                  ))}
                </ul>
              </>
            )}
            <div className={classes.usage}>
              {t("events.testSafe", { count: meta.blocked?.length || 0 })}
            </div>
          </>
        );
      }
      case "test_result":
        return (
          <>
            {content && (
              <Markdown text={content} className={classes.markdown} />
            )}
            {(meta.findings || []).map(finding => (
              <div key={finding.check} className={classes.verdict}>
                <span
                  className={classes.chip}
                  style={toneStyle(theme, finding.ok ? "success" : "danger")}
                >
                  {finding.ok ? t("events.testOk") : t("events.testNotOk")}
                </span>
                <span>
                  <b>{finding.check}</b>
                  {finding.note ? ` · ${finding.note}` : ""}
                </span>
              </div>
            ))}
          </>
        );
      case "test_skip":
        return t(`events.testSkipReason.${meta.reason || "no_browser"}`);
      default: {
        // pedido e comentários podem trazer imagens
        const files = (meta.images || [])
          .map(id => (task.attachments || []).find(file => file.id === id))
          .filter(Boolean);
        if (!content && !files.length) return null;
        return (
          <>
            {content && <div className={classes.plain}>{content}</div>}
            <DevImages taskId={task.id} files={files} large />
          </>
        );
      }
    }
  };

  const renderEvent = event => {
    const who =
      event.agent === "human"
        ? event.user?.name || agentName("human")
        : agentName(event.agent);

    if (LINE_KINDS.includes(event.kind)) {
      const text =
        event.kind === "stage"
          ? t("events.stage", { stage: t(`stages.${event.content}`) })
          : `${event.agent === "human" ? `${who}: ` : ""}${t(
              `events.${event.kind}`,
              {
                priority: t(`priority.${event.meta?.priority || "normal"}`),
                number: event.meta?.number
              }
            )}${event.kind === "cancel" && event.content ? ` · ${event.content}` : ""}`;
      return (
        <div key={event.id} className={classes.systemLine}>
          {text} · {time(event.createdAt)}
        </div>
      );
    }

    const content = eventContent(event);
    return (
      <div key={event.id} className={classes.event}>
        <AgentAvatar
          agent={event.agent}
          size={36}
          badge
          className={classes.eventAvatar}
        />
        <div className={classes.eventMain}>
          <div className={classes.eventHead}>
            <span className={classes.headAvatar}>
              <AgentAvatar agent={event.agent} size={24} />
            </span>
            <b>{who}</b>
            {!["human", "system"].includes(event.agent) && (
              <span className={classes.role}>{agentRole(event.agent)}</span>
            )}
            <span>{eventTitle(event)}</span>
            <span className={classes.eventTime}>{time(event.createdAt)}</span>
          </div>
          {content && (
            <div
              className={clsx(classes.bubble, {
                [classes.bubbleHuman]: event.agent === "human"
              })}
            >
              {content}
            </div>
          )}
          {usageLine(event.meta)}
        </div>
      </div>
    );
  };

  // ------------------------------------------------------------ especificação

  // as fotos e vídeos do testador aparecem na conversa, não no pedido
  const requestImages = (task?.attachments || []).filter(
    file => file.kind !== "test"
  );

  const renderSpec = () => {
    if (editing) {
      return (
        <>
          <TextField
            fullWidth
            variant="outlined"
            label={t("spec.title")}
            value={draft.title}
            onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
            className={classes.field}
          />
          <TextField
            fullWidth
            multiline
            minRows={8}
            variant="outlined"
            label={t("spec.spec")}
            value={draft.spec}
            onChange={e => setDraft(d => ({ ...d, spec: e.target.value }))}
            className={classes.field}
          />
          <TextField
            fullWidth
            multiline
            minRows={4}
            variant="outlined"
            label={t("spec.acceptance")}
            helperText={t("spec.acceptanceHint")}
            value={draft.acceptance}
            onChange={e =>
              setDraft(d => ({ ...d, acceptance: e.target.value }))
            }
            className={classes.field}
          />
          <div className={classes.codeBar}>
            <Button
              variant="contained"
              color="primary"
              size="small"
              className={classes.action}
              onClick={saveEdit}
            >
              {t("actions.save")}
            </Button>
            <Button
              size="small"
              className={classes.action}
              onClick={() => setEditing(false)}
            >
              {t("actions.close")}
            </Button>
          </div>
        </>
      );
    }

    return (
      <>
        <div className={classes.specHead}>
          <h3 className={classes.specTitle}>{t("spec.task")}</h3>
          {task.spec && !busy(task) && !closed(task) && (
            <Button size="small" className={classes.action} onClick={startEdit}>
              {t("actions.edit")}
            </Button>
          )}
        </div>
        {task.spec ? (
          <>
            <div className={classes.card}>
              <Markdown text={task.spec} className={classes.markdown} />
            </div>
            {task.acceptance?.length > 0 && (
              <div className={classes.card}>
                <div className={classes.sub} style={{ marginTop: 0 }}>
                  {t("spec.acceptance")}
                </div>
                <ul className={classes.list}>
                  {task.acceptance.map(item => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {task.files?.length > 0 && (
              <div className={classes.card}>
                <div className={classes.sub} style={{ marginTop: 0 }}>
                  {t("spec.files")}
                </div>
                {fileChips(task.files)}
              </div>
            )}
            {task.skills?.length > 0 && (
              <div className={classes.card}>
                <div className={classes.sub} style={{ marginTop: 0 }}>
                  {t("spec.skills")}
                </div>
                {fileChips(task.skills)}
              </div>
            )}
            {requestImages.length > 0 && (
              <div className={classes.card}>
                <div className={classes.sub} style={{ marginTop: 0 }}>
                  {t("images.title")}
                </div>
                <DevImages taskId={task.id} files={requestImages} large />
              </div>
            )}
            {task.priorityReason && (
              <div className={classes.card}>
                <div className={classes.sub} style={{ marginTop: 0 }}>
                  {t("spec.priorityReason")}
                </div>
                {task.priorityReason}
              </div>
            )}
          </>
        ) : (
          <EmptyState
            title={t("spec.empty")}
            description={t("spec.emptyHint")}
          />
        )}
        {task.description && (
          <div className={classes.card}>
            <div className={classes.sub} style={{ marginTop: 0 }}>
              {t("spec.original")}
            </div>
            <div className={classes.plain}>{task.description}</div>
          </div>
        )}
      </>
    );
  };

  // ------------------------------------------------------------------ código

  const renderCode = () => {
    if (!task.diff) {
      return (
        <EmptyState title={t("code.empty")} description={t("code.emptyHint")} />
      );
    }
    return (
      <>
        <div className={classes.codeBar}>
          <Button
            size="small"
            variant="outlined"
            className={classes.action}
            startIcon={<GetAppRoundedIcon />}
            onClick={download}
          >
            {t("actions.download")}
          </Button>
          {task.prUrl && (
            <Button
              size="small"
              variant="outlined"
              className={classes.action}
              href={task.prUrl}
              target="_blank"
              rel="noopener noreferrer"
              endIcon={<OpenInNewRoundedIcon />}
            >
              {t("actions.openPr")}
            </Button>
          )}
          {task.branch && (
            <span className={classes.file}>
              <CallSplitRoundedIcon style={{ fontSize: 14 }} />
              {task.branch}
            </span>
          )}
        </div>
        {task.checks?.length > 0 && (
          <div className={classes.card}>
            <div
              className={clsx(classes.sub, classes.problem)}
              style={{ marginTop: 0 }}
            >
              {t("events.checks")}
            </div>
            <ul className={classes.list}>
              {task.checks.map(check => (
                <li key={`${check.path}${check.message}`}>
                  <code>{check.path}</code> {check.message}
                </li>
              ))}
            </ul>
          </div>
        )}
        <DiffView diff={task.diff} changedFiles={task.changedFiles} />
      </>
    );
  };

  // -------------------------------------------------------------------- tela

  const origin = task
    ? task.source === "help"
      ? `${t("source.help")} · ${task.company?.name || "—"}${
          task.requester?.name ? ` · ${task.requester.name}` : ""
        }`
      : t("source.admin")
    : "";
  const canRerun = task && !busy(task) && task.stage !== "cancelled";
  const rerunTarget =
    task && ["intake", "prioritization"].includes(task.stage)
      ? t("composer.toTriage")
      : t("composer.toDeveloper");

  return (
    <Drawer
      anchor={isPhone ? "bottom" : "right"}
      open={!!taskId}
      onClose={onClose}
      classes={{ paper: classes.paper }}
    >
      {!task ? (
        <div style={{ margin: "auto", padding: 48 }}>
          <BoxLoader size={48} />
        </div>
      ) : (
        <>
          {isPhone && (
            <div className={classes.appBar}>
              <IconButton aria-label={t("actions.close")} onClick={onClose}>
                <ArrowBackRoundedIcon />
              </IconButton>
              <div className={classes.appBarText}>
                <b>#{task.id}</b> · {t(`stages.${task.stage}`)}
              </div>
              <IconButton
                aria-label={t("actions.more")}
                onClick={e => setMenu(e.currentTarget)}
              >
                <MoreVertRoundedIcon />
              </IconButton>
            </div>
          )}
          <div ref={scrollerRef} className={classes.scroller}>
            <div className={classes.head}>
              <div className={classes.headTop}>
                <div className={classes.headText}>
                  <div className={classes.title}>{task.title}</div>
                  <div className={classes.meta}>
                    #{task.id} · {origin} · {time(task.createdAt)}
                    {totalTokens(task) > 0 &&
                      ` · ${brl(task.costUsd)} (${t("tokens", {
                        count: compact(totalTokens(task))
                      })})`}
                  </div>
                </div>
                {!isPhone && (
                  <>
                    <IconButton
                      aria-label={t("actions.more")}
                      onClick={e => setMenu(e.currentTarget)}
                    >
                      <MoreVertRoundedIcon />
                    </IconButton>
                    <IconButton
                      aria-label={t("actions.close")}
                      onClick={onClose}
                    >
                      <CloseRoundedIcon />
                    </IconButton>
                  </>
                )}
              </div>

              {task.stage === "cancelled" ? (
                <div className={classes.chips}>
                  <span
                    className={classes.chip}
                    style={toneStyle(theme, "neutral")}
                  >
                    {t("stages.cancelled")}
                  </span>
                </div>
              ) : (
                renderSteps()
              )}

              <div className={classes.chips}>
                <span
                  className={classes.chip}
                  style={toneStyle(theme, priorityOf(task.priority).tone)}
                >
                  {t(`priority.${task.priority}`)}
                </span>
                {task.kind && (
                  <span
                    className={classes.chip}
                    style={toneStyle(theme, "neutral")}
                  >
                    {t(`kind.${task.kind}`)}
                  </span>
                )}
                {task.design && (
                  <span
                    className={classes.chip}
                    style={toneStyle(theme, "info")}
                  >
                    {t("designChip")}
                  </span>
                )}
                {difficultyOf(task) && (
                  <span
                    className={classes.chip}
                    style={toneStyle(theme, difficultyOf(task).tone)}
                  >
                    {t(`difficulty.${difficultyOf(task).key}`)}
                  </span>
                )}
                {task.risk && (
                  <span
                    className={classes.chip}
                    style={toneStyle(
                      theme,
                      { high: "danger", medium: "warning" }[task.risk] ||
                        "neutral"
                    )}
                  >
                    {t(`risk.${task.risk}`)}
                  </span>
                )}
                {task.reviewRound > 0 && (
                  <span
                    className={classes.chip}
                    style={toneStyle(theme, "neutral")}
                  >
                    {t("round", { count: task.reviewRound })}
                  </span>
                )}
                {task.branch && (
                  <span className={classes.branch} title={task.branch}>
                    <CallSplitRoundedIcon />
                    <span>{task.branch}</span>
                  </span>
                )}
              </div>

              {!closed(task) && renderBanner()}
              {task.stage === "done" && task.prUrl && (
                <div className={classes.codeBar} style={{ marginTop: 12 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    className={classes.action}
                    href={task.prUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    endIcon={<OpenInNewRoundedIcon />}
                  >
                    {t("actions.openPr")}
                  </Button>
                </div>
              )}
            </div>

            <div className={classes.tabs} role="tablist">
              {[
                ["conversation", t("tabs.conversation")],
                ["spec", t("tabs.spec")],
                [
                  "code",
                  task.changedFiles?.length
                    ? `${t("tabs.code")} · ${task.changedFiles.length}`
                    : t("tabs.code")
                ]
              ].map(([key, label]) => (
                <ButtonBase
                  key={key}
                  role="tab"
                  aria-selected={tab === key}
                  className={clsx(classes.tab, {
                    [classes.tabOn]: tab === key
                  })}
                  onClick={() => setTab(key)}
                >
                  {label}
                </ButtonBase>
              ))}
            </div>

            <div ref={bodyRef} className={classes.body}>
              {tab === "conversation" && (
                <div className={classes.timeline}>
                  {task.events.map(renderEvent)}
                </div>
              )}
              {tab === "spec" && renderSpec()}
              {tab === "code" && renderCode()}
            </div>
          </div>

          {tab === "conversation" && task.stage !== "cancelled" && (
            <div className={classes.composer}>
              <PendingImages
                files={images}
                onRemove={index =>
                  setImages(list => list.filter((_, i) => i !== index))
                }
              />
              <div className={classes.inputRow}>
                <IconButton
                  size="small"
                  aria-label={t("images.attach")}
                  title={t("images.attach")}
                  onClick={() => fileRef.current?.click()}
                >
                  <AddPhotoAlternateOutlinedIcon />
                </IconButton>
                <InputBase
                  multiline
                  maxRows={6}
                  className={classes.input}
                  placeholder={t("composer.placeholder")}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onPaste={e => {
                    const pasted = pastedImages(e);
                    if (pasted.length) {
                      e.preventDefault();
                      setImages(list => pickImages(list, pasted));
                    }
                  }}
                />
                <input
                  ref={fileRef}
                  type="file"
                  accept={IMAGE_TYPES.join(",")}
                  multiple
                  hidden
                  onChange={e => {
                    setImages(list => pickImages(list, e.target.files));
                    e.target.value = "";
                  }}
                />
              </div>
              <div className={classes.composerRow}>
                {/* no celular a explicação só aparece quando há o que
                    enviar: sem isso a caixa ocupa um quinto da tela */}
                {(!isPhone || text.trim() || images.length > 0) && (
                  <span className={classes.composerHint}>
                    {canRerun
                      ? t("composer.hint", { target: rerunTarget })
                      : t("composer.busy")}
                  </span>
                )}
                <Button
                  size="small"
                  className={classes.action}
                  disabled={(!text.trim() && !images.length) || sending}
                  onClick={() => send(false)}
                >
                  {t("actions.comment")}
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  className={classes.action}
                  disabled={
                    (!text.trim() && !images.length) || sending || !canRerun
                  }
                  onClick={() => send(true)}
                >
                  {t("actions.rerun")}
                </Button>
              </div>
            </div>
          )}

          <Menu
            anchorEl={menu}
            open={!!menu}
            onClose={() => setMenu(null)}
            getContentAnchorEl={null}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <MenuItem
              onClick={() => {
                setMenu(null);
                act("learn", {}, t("toasts.learning"));
              }}
            >
              {t("actions.learn")}
            </MenuItem>
            {setup?.browser && ["pr", "tests", "done"].includes(task.stage) && (
              <MenuItem
                disabled={busy(task)}
                onClick={() => {
                  setMenu(null);
                  act("test", {}, t("toasts.testing"));
                }}
              >
                {t("actions.testNow")}
              </MenuItem>
            )}
            {!closed(task) && (
              <MenuItem
                onClick={() => {
                  setMenu(null);
                  setConfirm("cancel");
                }}
              >
                {t("actions.cancel")}
              </MenuItem>
            )}
            <MenuItem
              disabled={busy(task)}
              className={classes.danger}
              onClick={() => {
                setMenu(null);
                setConfirm("delete");
              }}
            >
              {t("actions.delete")}
            </MenuItem>
          </Menu>

          <ConfirmationModal
            title={
              confirm === "delete" ? t("confirm.delete") : t("confirm.cancel")
            }
            open={!!confirm}
            onClose={() => setConfirm(null)}
            onConfirm={() => (confirm === "delete" ? remove() : act("cancel"))}
          >
            {confirm === "delete"
              ? t("confirm.deleteText")
              : t("confirm.cancelText")}
          </ConfirmationModal>
        </>
      )}
    </Drawer>
  );
};

export default TaskDrawer;
