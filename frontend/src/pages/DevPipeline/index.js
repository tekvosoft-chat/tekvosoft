import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { Link as RouterLink, useHistory, useLocation } from "react-router-dom";
import clsx from "clsx";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import Button from "@material-ui/core/Button";
import ButtonBase from "@material-ui/core/ButtonBase";
import CircularProgress from "@material-ui/core/CircularProgress";
import InputBase from "@material-ui/core/InputBase";
import Switch from "@material-ui/core/Switch";
import AddRoundedIcon from "@material-ui/icons/AddRounded";
import SearchRoundedIcon from "@material-ui/icons/SearchRounded";
import MemoryRoundedIcon from "@material-ui/icons/MemoryRounded";
import AccountTreeRoundedIcon from "@material-ui/icons/AccountTreeRounded";
import WarningRoundedIcon from "@material-ui/icons/WarningRounded";
import CallSplitRoundedIcon from "@material-ui/icons/CallSplitRounded";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import MainContainer from "../../components/MainContainer";
import PageLoader from "../../components/ui/PageLoader";
import { AuthContext } from "../../context/Auth/AuthContext";
import NewTaskDialog from "./NewTaskDialog";
import TaskDrawer from "./TaskDrawer";
import StatsPanel from "./StatsPanel";
import SkillsPanel from "./SkillsPanel";
import TeamPanel from "./TeamPanel";
import { AgentAvatar, workerOf } from "./team";
import {
  CANCELLED,
  STAGES,
  brl,
  compact,
  difficultyOf,
  setUsdRate,
  priorityOf,
  priorityRank,
  statusLine,
  t,
  toneStyle,
  totalTokens,
  useDevLive
} from "./shared";

/**
 * Pipeline de IA (só o super admin): um quadro tipo Jira com as demandas de
 * melhoria e correção. Cada uma passa por triagem, priorização (a pessoa
 * aprova), desenvolvimento, code review, PR e testes. Tocar num cartão abre
 * a conversa dos agentes, a especificação e o código.
 *
 * No computador, as colunas lado a lado (as vazias ficam estreitas, para
 * sobrar espaço às que têm cartão). No celular, uma coluna por vez, na
 * largura toda: as etapas viram abas no topo e a página rola normalmente.
 */
const DONE_SHOWN = 20;
const TABS = ["summary", "board", "team", "skills"];

const useStyles = makeStyles(theme => {
  const tkv = theme.palette.tkv;
  return {
    page: { overflowY: "auto", ...theme.scrollbarStyles },
    head: {
      display: "flex",
      alignItems: "flex-start",
      gap: theme.spacing(1.5),
      marginBottom: theme.spacing(2),
      flexWrap: "wrap"
    },
    headText: { flex: 1, minWidth: 220 },
    title: {
      margin: 0,
      fontSize: "1.375rem",
      fontWeight: 800,
      letterSpacing: "-0.01em",
      color: theme.palette.text.primary
    },
    subtitle: {
      margin: "4px 0 0",
      maxWidth: 720,
      fontSize: "0.875rem",
      lineHeight: 1.5,
      color: theme.palette.text.secondary,
      [theme.breakpoints.down("xs")]: { display: "none" }
    },
    newButton: {
      height: 42,
      padding: "0 20px",
      borderRadius: tkv.radius.pill,
      textTransform: "none",
      fontWeight: 700,
      boxShadow: "none",
      [theme.breakpoints.down("xs")]: { width: "100%" }
    },
    setup: {
      display: "flex",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: theme.spacing(2)
    },
    setupChip: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      minHeight: 30,
      maxWidth: "100%",
      padding: "4px 12px",
      borderRadius: tkv.radius.pill,
      fontSize: "0.8125rem",
      fontWeight: 600,
      "& svg": { fontSize: 17, flex: "none" }
    },
    setupLink: {
      marginLeft: 4,
      fontWeight: 700,
      color: "inherit",
      textDecoration: "underline"
    },
    setupButton: {
      font: "inherit",
      fontWeight: 700,
      textDecoration: "underline",
      color: "inherit",
      marginLeft: 4
    },
    // a página é uma coluna flex: sem flex none, faixa que rola para o
    // lado encolhe e corta os botões pela metade (era o que acontecia com
    // as etapas no celular)
    tabs: {
      flex: "none",
      display: "flex",
      alignItems: "center",
      gap: 4,
      marginBottom: theme.spacing(2),
      borderBottom: `1px solid ${tkv.border}`,
      overflowX: "auto",
      scrollbarWidth: "none",
      "&::-webkit-scrollbar": { display: "none" }
    },
    tab: {
      flex: "none",
      height: 42,
      padding: "0 14px",
      gap: 6,
      fontSize: "0.9063rem",
      fontWeight: 700,
      color: theme.palette.text.secondary,
      borderBottom: "2px solid transparent",
      [theme.breakpoints.down("xs")]: { padding: "0 10px" }
    },
    tabOn: { color: tkv.brand.text, borderBottomColor: tkv.brand.main },
    tabBadge: {
      minWidth: 20,
      height: 20,
      padding: "0 6px",
      borderRadius: tkv.radius.pill,
      fontSize: "0.72rem",
      fontWeight: 800,
      display: "inline-grid",
      placeItems: "center",
      color: "#fff",
      backgroundColor: tkv.semantic.warning
    },
    toolbar: {
      display: "flex",
      alignItems: "center",
      gap: theme.spacing(1.5),
      marginBottom: theme.spacing(2),
      flexWrap: "wrap"
    },
    search: {
      flex: 1,
      minWidth: 220,
      maxWidth: 420,
      display: "flex",
      alignItems: "center",
      gap: 8,
      height: 42,
      padding: "0 14px",
      borderRadius: tkv.radius.pill,
      border: `1px solid ${tkv.border}`,
      backgroundColor: tkv.surface,
      color: theme.palette.text.secondary,
      [theme.breakpoints.down("xs")]: {
        maxWidth: "none",
        minWidth: 0,
        flexBasis: "100%"
      }
    },
    toggle: {
      display: "inline-flex",
      alignItems: "center",
      fontSize: "0.8125rem",
      color: theme.palette.text.secondary,
      cursor: "pointer"
    },
    summary: {
      marginLeft: "auto",
      fontSize: "0.875rem",
      color: theme.palette.text.secondary,
      "& b": { color: theme.palette.text.primary },
      [theme.breakpoints.down("xs")]: { marginLeft: 0 }
    },
    // celular: as etapas viram abas (uma coluna por vez, na largura toda)
    stagePicker: {
      flex: "none",
      position: "sticky",
      top: 0,
      zIndex: 2,
      display: "flex",
      gap: 6,
      overflowX: "auto",
      margin: theme.spacing(0, -2, 1.5),
      padding: theme.spacing(1, 2),
      backgroundColor: theme.palette.background.default,
      scrollbarWidth: "none",
      "&::-webkit-scrollbar": { display: "none" }
    },
    stageChip: {
      flex: "none",
      height: 36,
      padding: "0 14px",
      gap: 8,
      borderRadius: tkv.radius.pill,
      border: `1px solid ${tkv.border}`,
      fontSize: "0.875rem",
      fontWeight: 600,
      color: theme.palette.text.secondary,
      backgroundColor: tkv.surface
    },
    stageChipOn: {
      color: tkv.brand.contrastText,
      backgroundColor: tkv.brand.main,
      borderColor: tkv.brand.main,
      "& $stageCount": {
        color: tkv.brand.main,
        backgroundColor: tkv.brand.contrastText
      }
    },
    stageCount: {
      minWidth: 22,
      height: 22,
      padding: "0 6px",
      borderRadius: tkv.radius.pill,
      display: "inline-grid",
      placeItems: "center",
      fontSize: "0.75rem",
      fontWeight: 800,
      color: theme.palette.text.primary,
      backgroundColor: tkv.surfaceSunken
    },
    stageMine: {
      width: 8,
      height: 8,
      borderRadius: "50%",
      backgroundColor: tkv.semantic.warning
    },
    phoneHint: {
      margin: theme.spacing(0, 0, 1.5),
      fontSize: "0.8125rem",
      lineHeight: 1.45,
      color: theme.palette.text.secondary
    },
    phoneList: {
      display: "flex",
      flexDirection: "column",
      gap: theme.spacing(1.25),
      paddingBottom: theme.spacing(3)
    },
    board: {
      flex: "none",
      display: "grid",
      gridAutoFlow: "column",
      gap: theme.spacing(2),
      alignItems: "start",
      overflowX: "auto",
      paddingBottom: theme.spacing(2),
      ...theme.scrollbarStyles
    },
    column: {
      display: "flex",
      flexDirection: "column",
      minHeight: 220,
      maxHeight: "calc(var(--vh, 100vh) - 270px)",
      borderRadius: tkv.radius.lg,
      backgroundColor: tkv.surfaceSunken,
      border: `1px solid ${tkv.border}`
    },
    // coluna sem cartão: faixa fina, nome de baixo para cima
    columnEmpty: {
      alignItems: "center",
      gap: theme.spacing(1.25),
      padding: theme.spacing(2, 0),
      minHeight: 260
    },
    emptyTitle: {
      writingMode: "vertical-rl",
      transform: "rotate(180deg)",
      fontSize: "0.9063rem",
      fontWeight: 700,
      whiteSpace: "nowrap",
      color: theme.palette.text.secondary
    },
    colHead: {
      flex: "none",
      padding: theme.spacing(1.75, 2, 1.25)
    },
    colTop: { display: "flex", alignItems: "center", gap: 8 },
    dot: { width: 10, height: 10, borderRadius: "50%", flex: "none" },
    colTitle: {
      flex: 1,
      minWidth: 0,
      fontSize: "0.9375rem",
      fontWeight: 700,
      color: theme.palette.text.primary,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    },
    colHint: {
      marginTop: 4,
      fontSize: "0.78rem",
      lineHeight: 1.4,
      color: theme.palette.text.secondary
    },
    colCount: {
      minWidth: 26,
      height: 24,
      padding: "0 8px",
      borderRadius: tkv.radius.pill,
      fontSize: "0.78rem",
      fontWeight: 700,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      color: theme.palette.text.secondary,
      backgroundColor: tkv.surface
    },
    cards: {
      flex: 1,
      minHeight: 0,
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
      gap: theme.spacing(1.25),
      padding: theme.spacing(0.5, 1.5, 1.5),
      ...theme.scrollbarStyles
    },
    card: {
      position: "relative",
      display: "flex",
      flexDirection: "column",
      alignItems: "stretch",
      gap: 8,
      width: "100%",
      padding: theme.spacing(1.75),
      borderRadius: tkv.radius.md,
      border: `1px solid ${tkv.border}`,
      backgroundColor: tkv.surface,
      textAlign: "left",
      transition: "box-shadow .15s ease, border-color .15s ease",
      "&:hover": { boxShadow: "0 8px 20px -12px rgba(0,0,0,.45)" },
      [theme.breakpoints.down("xs")]: { padding: theme.spacing(1.75, 2) }
    },
    // é a vez da pessoa: o cartão ganha uma borda para achar de longe
    cardMine: { borderColor: tkv.semantic.warning },
    cardError: { borderColor: tkv.semantic.danger },
    cardTop: { display: "flex", alignItems: "center", gap: 8 },
    origin: {
      flex: 1,
      minWidth: 0,
      fontSize: "0.75rem",
      fontWeight: 600,
      color: tkv.brand.text,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    cost: {
      flex: "none",
      fontSize: "0.75rem",
      fontWeight: 600,
      color: theme.palette.text.secondary,
      whiteSpace: "nowrap"
    },
    cardTitle: {
      fontSize: "0.9375rem",
      fontWeight: 700,
      lineHeight: 1.35,
      color: theme.palette.text.primary,
      display: "-webkit-box",
      WebkitLineClamp: 3,
      WebkitBoxOrient: "vertical",
      overflow: "hidden",
      overflowWrap: "anywhere"
    },
    line: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontSize: "0.8125rem",
      fontWeight: 600
    },
    chips: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      flexWrap: "wrap"
    },
    chip: {
      display: "inline-flex",
      alignItems: "center",
      height: 22,
      padding: "0 8px",
      borderRadius: tkv.radius.pill,
      fontSize: "0.72rem",
      fontWeight: 700,
      whiteSpace: "nowrap"
    },
    round: { fontSize: "0.75rem", color: theme.palette.text.secondary },
    branch: {
      display: "flex",
      alignItems: "center",
      gap: 4,
      minWidth: 0,
      fontFamily:
        'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
      fontSize: "0.72rem",
      color: theme.palette.text.secondary,
      "& svg": { fontSize: 14, flex: "none" },
      "& span": {
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    },
    empty: {
      padding: theme.spacing(3, 1),
      textAlign: "center",
      fontSize: "0.8125rem",
      color: theme.palette.text.disabled
    },
    more: {
      width: "100%",
      minHeight: 38,
      borderRadius: tkv.radius.md,
      fontSize: "0.8125rem",
      fontWeight: 600,
      color: tkv.brand.text
    }
  };
});

const SetupStrip = ({ setup, onTeam }) => {
  const classes = useStyles();
  const theme = useTheme();
  if (!setup) return null;

  const link = (
    <RouterLink
      to="/settings?section=devPipeline"
      className={classes.setupLink}
    >
      {t("setup.open")}
    </RouterLink>
  );
  const warn = toneStyle(theme, "warning");
  const ok = toneStyle(theme, "neutral");

  let repo;
  if (!setup.repo) {
    repo = (
      <span className={classes.setupChip} style={warn}>
        <WarningRoundedIcon /> {t("setup.noRepo")} {link}
      </span>
    );
  } else if (setup.repo.kind === "local") {
    repo = (
      <span className={classes.setupChip} style={toneStyle(theme, "info")}>
        <AccountTreeRoundedIcon /> {t("setup.local")}
      </span>
    );
  } else {
    repo = (
      <span
        className={classes.setupChip}
        style={setup.repo.canPublish ? ok : toneStyle(theme, "info")}
      >
        <AccountTreeRoundedIcon />
        {setup.repo.canPublish
          ? t("setup.github", { repo: setup.repo.label })
          : t("setup.readOnly", { repo: setup.repo.label })}
      </span>
    );
  }

  // OpenRouter: cada agente com o seu modelo; o time mostra quem usa qual
  const perAgent = setup.provider === "openrouter" && setup.models?.length;
  return (
    <div className={classes.setup}>
      {setup.hasKey ? (
        <span className={classes.setupChip} style={ok}>
          <MemoryRoundedIcon />
          {perAgent
            ? t("setup.perAgent")
            : `${t(`setup.provider.${setup.provider}`)} · ${setup.model}`}
          {perAgent && (
            <ButtonBase className={classes.setupButton} onClick={onTeam}>
              {t("setup.seeTeam")}
            </ButtonBase>
          )}
        </span>
      ) : (
        <span className={classes.setupChip} style={warn}>
          <WarningRoundedIcon /> {t("setup.noKey")} {link}
        </span>
      )}
      {repo}
    </div>
  );
};

const TaskCard = ({ task, onOpen }) => {
  const classes = useStyles();
  const theme = useTheme();
  const priority = priorityOf(task.priority);
  const difficulty = difficultyOf(task);
  const line = statusLine(task);
  const lineTone = toneStyle(theme, line.tone);
  const worker = line.running ? workerOf(task.stage) : null;
  const origin =
    task.source === "help"
      ? `${t("source.help")} · ${task.company?.name || "—"}`
      : t("source.admin");

  return (
    <ButtonBase
      component="div"
      className={clsx(classes.card, {
        [classes.cardMine]: line.mine,
        [classes.cardError]: task.status === "error"
      })}
      onClick={() => onOpen(task.id)}
    >
      <span className={classes.cardTop}>
        <span className={classes.origin}>
          #{task.id} · {origin}
        </span>
        {totalTokens(task) > 0 && (
          <span
            className={classes.cost}
            title={t("tokens", { count: compact(totalTokens(task)) })}
          >
            {brl(task.costUsd)}
          </span>
        )}
      </span>
      <span className={classes.cardTitle}>{task.title}</span>
      {line.text && (
        <span className={classes.line} style={{ color: lineTone.color }}>
          {worker ? (
            <AgentAvatar agent={worker} size={20} />
          ) : (
            line.running && <CircularProgress size={12} color="inherit" />
          )}
          {line.text}
        </span>
      )}
      <span className={classes.chips}>
        <span className={classes.chip} style={toneStyle(theme, priority.tone)}>
          {t(`priority.${priority.key}`)}
        </span>
        {difficulty && (
          <span
            className={classes.chip}
            style={toneStyle(theme, difficulty.tone)}
          >
            {t(`difficulty.${difficulty.key}`)}
          </span>
        )}
        {task.kind && (
          <span className={classes.chip} style={toneStyle(theme, "neutral")}>
            {t(`kind.${task.kind}`)}
          </span>
        )}
        {task.reviewRound > 0 &&
          !["done", "cancelled"].includes(task.stage) && (
            <span className={classes.round}>
              {t("round", { count: task.reviewRound })}
            </span>
          )}
      </span>
      {task.branch && (
        <span className={classes.branch} title={task.branch}>
          <CallSplitRoundedIcon />
          <span>{task.branch}</span>
        </span>
      )}
    </ButtonBase>
  );
};

const DevPipeline = () => {
  const classes = useStyles();
  const theme = useTheme();
  const history = useHistory();
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState(null);
  const [setup, setSetup] = useState(null);
  const [query, setQuery] = useState("");
  const [showCancelled, setShowCancelled] = useState(false);
  const [allDone, setAllDone] = useState(false);
  const [creating, setCreating] = useState(false);
  const [stats, setStats] = useState(null);
  const [skillCounts, setSkillCounts] = useState(null);
  // celular: qual etapa está à vista (null = a escolhida sozinha)
  const [phoneStage, setPhoneStage] = useState(null);
  // quatro abas: resumo (números e gráficos), quadro (as colunas), time
  // (agentes e modelos) e skills. A escolhida sobrevive ao recarregar; a
  // primeira visita abre no resumo
  const [tab, setTab] = useState(() => {
    try {
      const saved = localStorage.getItem("tkv:devTab");
      return TABS.includes(saved) ? saved : "summary";
    } catch {
      return "summary";
    }
  });

  // ?task=12 abre direto (link vindo do chamado na Ajuda)
  const openId =
    Number(new URLSearchParams(location.search).get("task")) || null;
  const setOpenId = id => history.replace({ search: id ? `?task=${id}` : "" });

  const load = useCallback(async () => {
    try {
      const [{ data: list }, { data: config }, { data: numbers }] =
        await Promise.all([
          api.get("/dev-tasks"),
          api.get("/dev-tasks/setup"),
          api.get("/dev-tasks/stats")
        ]);
      // a cotação vem antes de pôr as demandas na tela: o custo sai em reais
      setUsdRate(config?.usdBrl?.rate);
      setSetup(config);
      setStats(numbers);
      setTasks(Array.isArray(list) ? list : []);
    } catch (err) {
      toastError(err);
      setTasks([]);
    }
  }, []);

  useEffect(() => {
    if (user?.super) load();
  }, [load, user]);

  useDevLive(() => load());

  const isPhone = useMediaQuery(theme.breakpoints.down("xs"));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (tasks || []).filter(
      task =>
        !q ||
        `${task.title} ${task.company?.name || ""} #${task.id} ${task.branch || ""}`
          .toLowerCase()
          .includes(q)
    );
  }, [tasks, query]);

  const stages = showCancelled ? [...STAGES, CANCELLED] : STAGES;

  const columns = useMemo(() => {
    const by = Object.fromEntries(
      [...STAGES, CANCELLED].map(stage => [stage.key, []])
    );
    filtered.forEach(task => (by[task.stage] || by.intake).push(task));
    // dentro da coluna: o que espera a pessoa primeiro, depois a prioridade
    const rank = task =>
      (statusLine(task).mine || task.status === "error" ? 0 : 10) +
      priorityRank(task.priority);
    Object.keys(by).forEach(key => {
      if (!["done", "cancelled"].includes(key)) {
        by[key].sort((a, b) => rank(a) - rank(b));
      }
    });
    return by;
  }, [filtered]);

  // celular: abre na etapa da primeira demanda que espera você (ou na
  // primeira que tem alguma), não sempre em "Início"
  const autoStage = useMemo(() => {
    const open = STAGES.filter(stage => stage.key !== "done");
    const mine = open.find(stage =>
      columns[stage.key].some(
        task => statusLine(task).mine || task.status === "error"
      )
    );
    const any = open.find(stage => columns[stage.key].length);
    return (mine || any || STAGES[0]).key;
  }, [columns]);
  const shownStage =
    phoneStage && stages.some(stage => stage.key === phoneStage)
      ? phoneStage
      : autoStage;

  if (!user?.super) return null;
  if (!tasks) return <PageLoader />;

  const waiting = tasks.filter(
    task => statusLine(task).mine || task.status === "error"
  ).length;
  const running = tasks.filter(task => task.status === "running").length;

  // a aba Skills conta na hora; antes de abrir, vale o número do resumo
  const proposedSkills = skillCounts
    ? skillCounts.proposed
    : stats?.proposedSkills || 0;

  const chooseTab = key => {
    setTab(key);
    try {
      localStorage.setItem("tkv:devTab", key);
    } catch {
      // sem armazenamento, só não lembra a aba
    }
  };

  const renderCards = (stageKey, list) => {
    const shown =
      stageKey === "done" && !allDone ? list.slice(0, DONE_SHOWN) : list;
    return (
      <>
        {shown.length === 0 && (
          <div className={classes.empty}>{t("empty")}</div>
        )}
        {shown.map(task => (
          <TaskCard key={task.id} task={task} onOpen={setOpenId} />
        ))}
        {stageKey === "done" && list.length > DONE_SHOWN && !allDone && (
          <ButtonBase className={classes.more} onClick={() => setAllDone(true)}>
            {t("showAll", { count: list.length })}
          </ButtonBase>
        )}
      </>
    );
  };

  const renderBoard = () => {
    if (isPhone) {
      const list = columns[shownStage] || [];
      return (
        <>
          <div className={classes.stagePicker} role="tablist">
            {stages.map(stage => {
              const count = columns[stage.key].length;
              const mine = columns[stage.key].some(
                task => statusLine(task).mine || task.status === "error"
              );
              return (
                <ButtonBase
                  key={stage.key}
                  role="tab"
                  aria-selected={shownStage === stage.key}
                  className={clsx(classes.stageChip, {
                    [classes.stageChipOn]: shownStage === stage.key
                  })}
                  onClick={() => setPhoneStage(stage.key)}
                >
                  {mine && <span className={classes.stageMine} />}
                  {t(`stages.${stage.key}`)}
                  <span className={classes.stageCount}>{count}</span>
                </ButtonBase>
              );
            })}
          </div>
          <p className={classes.phoneHint}>{t(`stageHints.${shownStage}`)}</p>
          <div className={classes.phoneList}>
            {renderCards(shownStage, list)}
          </div>
        </>
      );
    }

    // coluna vazia vira uma faixa fina com o nome na vertical (como no
    // Jira): o espaço vai para as que têm cartão e o quadro inteiro cabe
    const template = stages
      .map(stage => (columns[stage.key].length ? "minmax(300px, 1fr)" : "56px"))
      .join(" ");
    return (
      <div className={classes.board} style={{ gridTemplateColumns: template }}>
        {stages.map(stage => {
          const list = columns[stage.key];
          const tone = toneStyle(theme, stage.tone);
          if (!list.length) {
            return (
              <section
                key={stage.key}
                className={clsx(classes.column, classes.columnEmpty)}
                title={t(`stageHints.${stage.key}`)}
                aria-label={`${t(`stages.${stage.key}`)}: ${t("empty")}`}
              >
                <span
                  className={classes.dot}
                  style={{ backgroundColor: tone.color }}
                />
                <span className={classes.colCount}>0</span>
                <span className={classes.emptyTitle}>
                  {t(`stages.${stage.key}`)}
                </span>
              </section>
            );
          }
          return (
            <section key={stage.key} className={classes.column}>
              <div className={classes.colHead}>
                <div className={classes.colTop}>
                  <span
                    className={classes.dot}
                    style={{ backgroundColor: tone.color }}
                  />
                  <span className={classes.colTitle}>
                    {t(`stages.${stage.key}`)}
                  </span>
                  <span className={classes.colCount}>{list.length}</span>
                </div>
                <div className={classes.colHint}>
                  {t(`stageHints.${stage.key}`)}
                </div>
              </div>
              <div className={classes.cards}>
                {renderCards(stage.key, list)}
              </div>
            </section>
          );
        })}
      </div>
    );
  };

  return (
    <MainContainer className={classes.page}>
      <div className={classes.head}>
        <div className={classes.headText}>
          <h1 className={classes.title}>{t("title")}</h1>
          <p className={classes.subtitle}>{t("subtitle")}</p>
        </div>
        <Button
          variant="contained"
          color="primary"
          className={classes.newButton}
          startIcon={<AddRoundedIcon />}
          onClick={() => setCreating(true)}
        >
          {t("newTask")}
        </Button>
      </div>

      <SetupStrip setup={setup} onTeam={() => chooseTab("team")} />

      <div className={classes.tabs} role="tablist">
        {[
          ["summary", t("stats.title")],
          ["board", t("tabs.board")],
          ["team", t("tabs.team")],
          ["skills", t("tabs.skills")]
        ].map(([key, label]) => (
          <ButtonBase
            key={key}
            role="tab"
            aria-selected={tab === key}
            className={clsx(classes.tab, { [classes.tabOn]: tab === key })}
            onClick={() => chooseTab(key)}
          >
            {label}
            {/* o que espera você no quadro; propostas nas skills */}
            {key === "board" && waiting > 0 && (
              <span className={classes.tabBadge}>{waiting}</span>
            )}
            {key === "skills" && proposedSkills > 0 && (
              <span className={classes.tabBadge}>{proposedSkills}</span>
            )}
          </ButtonBase>
        ))}
      </div>

      {tab === "summary" && <StatsPanel stats={stats} />}

      {tab === "team" && <TeamPanel setup={setup} />}

      {tab === "skills" && <SkillsPanel onCounts={setSkillCounts} />}

      {tab === "board" && (
        <>
          <div className={classes.toolbar}>
            <label className={classes.search}>
              <SearchRoundedIcon fontSize="small" />
              <InputBase
                fullWidth
                placeholder={t("search")}
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </label>
            <label className={classes.toggle}>
              <Switch
                size="small"
                color="primary"
                checked={showCancelled}
                onChange={e => setShowCancelled(e.target.checked)}
              />
              {t("showCancelled")}
            </label>
            <span className={classes.summary}>
              {t("summary", { waiting, running })}
            </span>
          </div>

          {renderBoard()}
        </>
      )}

      <NewTaskDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={task => {
          setCreating(false);
          load();
          setOpenId(task.id);
        }}
      />
      <TaskDrawer
        taskId={openId}
        setup={setup}
        onClose={() => setOpenId(null)}
        onChanged={load}
      />
    </MainContainer>
  );
};

export default DevPipeline;
