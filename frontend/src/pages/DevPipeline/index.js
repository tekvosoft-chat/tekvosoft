import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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

import api from "../../services/api";
import toastError from "../../errors/toastError";
import MainContainer from "../../components/MainContainer";
import PageLoader from "../../components/ui/PageLoader";
import { AuthContext } from "../../context/Auth/AuthContext";
import NewTaskDialog from "./NewTaskDialog";
import TaskDrawer from "./TaskDrawer";
import StatsPanel from "./StatsPanel";
import SkillsPanel from "./SkillsPanel";
import {
  CANCELLED,
  STAGES,
  brl,
  compact,
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
 * aprova), desenvolvimento, code review e PR. Tocar num cartão abre a
 * conversa dos agentes, a especificação e o código.
 */
const DONE_SHOWN = 20;
const TABS = ["summary", "board", "skills"];

const useStyles = makeStyles(theme => {
  const tkv = theme.palette.tkv;
  return {
    page: { overflowY: "auto", ...theme.scrollbarStyles },
    head: {
      display: "flex",
      alignItems: "flex-start",
      gap: theme.spacing(1.5),
      marginBottom: theme.spacing(1.5),
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
      margin: "2px 0 0",
      fontSize: "0.875rem",
      color: theme.palette.text.secondary
    },
    tabs: {
      display: "flex",
      alignItems: "center",
      gap: 4,
      marginBottom: theme.spacing(1.5),
      borderBottom: `1px solid ${tkv.border}`
    },
    tab: {
      height: 40,
      padding: "0 14px",
      gap: 6,
      fontSize: "0.9063rem",
      fontWeight: 700,
      color: theme.palette.text.secondary,
      borderBottom: "2px solid transparent"
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
    newButton: {
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
      marginBottom: theme.spacing(1.5)
    },
    setupChip: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      minHeight: 30,
      padding: "4px 12px",
      borderRadius: tkv.radius.pill,
      fontSize: "0.8125rem",
      fontWeight: 600,
      "& svg": { fontSize: 17 }
    },
    setupLink: {
      marginLeft: 4,
      fontWeight: 700,
      color: "inherit",
      textDecoration: "underline"
    },
    toolbar: {
      display: "flex",
      alignItems: "center",
      gap: theme.spacing(1),
      marginBottom: theme.spacing(1.5),
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
      [theme.breakpoints.down("xs")]: { marginLeft: 0, width: "100%" }
    },
    // celular: atalhos para cada coluna (o quadro desliza para o lado)
    jump: {
      display: "none",
      gap: 6,
      overflowX: "auto",
      margin: theme.spacing(0, -1, 1),
      padding: theme.spacing(0, 1),
      scrollbarWidth: "none",
      "&::-webkit-scrollbar": { display: "none" },
      [theme.breakpoints.down("xs")]: { display: "flex" }
    },
    jumpItem: {
      flex: "none",
      height: 32,
      padding: "0 12px",
      borderRadius: tkv.radius.pill,
      border: `1px solid ${tkv.border}`,
      fontSize: "0.8125rem",
      fontWeight: 600,
      color: theme.palette.text.secondary,
      backgroundColor: tkv.surface,
      gap: 6
    },
    jumpCount: { fontWeight: 800, color: theme.palette.text.primary },
    board: {
      display: "grid",
      gridAutoFlow: "column",
      gridAutoColumns: "minmax(240px, 1fr)",
      gap: theme.spacing(1.5),
      alignItems: "start",
      overflowX: "auto",
      paddingBottom: theme.spacing(2),
      ...theme.scrollbarStyles,
      [theme.breakpoints.down("xs")]: {
        gridAutoColumns: "86vw",
        scrollSnapType: "x mandatory",
        margin: theme.spacing(0, -1),
        padding: theme.spacing(0, 1, 2),
        "& > *": { scrollSnapAlign: "center" }
      }
    },
    column: {
      display: "flex",
      flexDirection: "column",
      minHeight: 200,
      maxHeight: "calc(var(--vh, 100vh) - 250px)",
      borderRadius: tkv.radius.lg,
      backgroundColor: tkv.surfaceSunken,
      border: `1px solid ${tkv.border}`,
      [theme.breakpoints.down("xs")]: {
        maxHeight: "calc(var(--vh, 100vh) - 300px)"
      }
    },
    colHead: {
      flex: "none",
      padding: theme.spacing(1.5, 1.75, 1)
    },
    colTop: { display: "flex", alignItems: "center", gap: 8 },
    dot: { width: 10, height: 10, borderRadius: "50%", flex: "none" },
    colTitle: {
      flex: 1,
      fontSize: "0.875rem",
      fontWeight: 700,
      color: theme.palette.text.primary
    },
    colHint: {
      marginTop: 2,
      fontSize: "0.75rem",
      lineHeight: 1.35,
      color: theme.palette.text.secondary
    },
    colCount: {
      minWidth: 24,
      height: 22,
      padding: "0 7px",
      borderRadius: tkv.radius.pill,
      fontSize: "0.75rem",
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
      gap: 8,
      padding: theme.spacing(0.5, 1, 1.25),
      ...theme.scrollbarStyles
    },
    card: {
      position: "relative",
      display: "flex",
      flexDirection: "column",
      alignItems: "stretch",
      gap: 6,
      width: "100%",
      padding: theme.spacing(1.5),
      borderRadius: tkv.radius.md,
      border: `1px solid ${tkv.border}`,
      backgroundColor: tkv.surface,
      textAlign: "left",
      transition: "box-shadow .15s ease",
      "&:hover": { boxShadow: "0 8px 20px -12px rgba(0,0,0,.45)" }
    },
    // é a vez da pessoa: o cartão ganha uma borda para achar de longe
    cardMine: { borderColor: tkv.semantic.warning },
    cardError: { borderColor: tkv.semantic.danger },
    origin: {
      fontSize: "0.75rem",
      fontWeight: 600,
      color: tkv.brand.text,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    cardTitle: {
      fontSize: "0.9063rem",
      fontWeight: 700,
      lineHeight: 1.3,
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
      gap: 6,
      fontSize: "0.78rem",
      fontWeight: 600
    },
    foot: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      flexWrap: "wrap",
      fontSize: "0.75rem",
      color: theme.palette.text.secondary
    },
    chip: {
      display: "inline-flex",
      alignItems: "center",
      height: 20,
      padding: "0 7px",
      borderRadius: tkv.radius.pill,
      fontSize: "0.6875rem",
      fontWeight: 700
    },
    tokens: { marginLeft: "auto", whiteSpace: "nowrap" },
    empty: {
      padding: theme.spacing(3, 1),
      textAlign: "center",
      fontSize: "0.8125rem",
      color: theme.palette.text.disabled
    },
    more: {
      width: "100%",
      minHeight: 34,
      borderRadius: tkv.radius.md,
      fontSize: "0.8125rem",
      fontWeight: 600,
      color: tkv.brand.text
    }
  };
});

const SetupStrip = ({ setup }) => {
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

  return (
    <div className={classes.setup}>
      {setup.hasKey ? (
        <span className={classes.setupChip} style={ok}>
          <MemoryRoundedIcon />
          {t(`setup.provider.${setup.provider}`)} · {setup.model}
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
  const line = statusLine(task);
  const lineTone = toneStyle(theme, line.tone);
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
      <span className={classes.origin}>
        #{task.id} · {origin}
      </span>
      <span className={classes.cardTitle}>{task.title}</span>
      {line.text && (
        <span className={classes.line} style={{ color: lineTone.color }}>
          {line.running && <CircularProgress size={12} color="inherit" />}
          {line.text}
        </span>
      )}
      <span className={classes.foot}>
        <span className={classes.chip} style={toneStyle(theme, priority.tone)}>
          {t(`priority.${priority.key}`)}
        </span>
        {task.kind && (
          <span className={classes.chip} style={toneStyle(theme, "neutral")}>
            {t(`kind.${task.kind}`)}
          </span>
        )}
        {task.reviewRound > 0 &&
          !["done", "cancelled"].includes(task.stage) && (
            <span>{t("round", { count: task.reviewRound })}</span>
          )}
        {totalTokens(task) > 0 && (
          <span
            className={classes.tokens}
            title={t("tokens", { count: compact(totalTokens(task)) })}
          >
            {brl(task.costUsd)}
          </span>
        )}
      </span>
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
  // três abas: resumo (números e gráficos), quadro (as colunas) e skills.
  // A escolhida sobrevive ao recarregar; a primeira visita abre no resumo
  const [tab, setTab] = useState(() => {
    try {
      const saved = localStorage.getItem("tkv:devTab");
      return TABS.includes(saved) ? saved : "summary";
    } catch {
      return "summary";
    }
  });
  const boardRef = useRef(null);
  const jumped = useRef(false);

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

  // celular: o quadro abre na coluna da primeira demanda que espera você
  // (ou na primeira que tem alguma), não sempre em "Início"
  const isPhone = useMediaQuery(theme.breakpoints.down("xs"));
  useEffect(() => {
    if (
      jumped.current ||
      !isPhone ||
      tab !== "board" ||
      !tasks?.length ||
      !boardRef.current
    ) {
      return;
    }
    jumped.current = true;
    const keys = STAGES.map(stage => stage.key);
    const open = tasks.filter(task => keys.includes(task.stage));
    const target = open.find(task => statusLine(task).mine) || open[0];
    const index = target ? keys.indexOf(target.stage) : -1;
    if (index > 0) {
      boardRef.current.children[index]?.scrollIntoView({
        inline: "center",
        block: "nearest"
      });
    }
  }, [tasks, isPhone, tab]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (tasks || []).filter(
      task =>
        !q ||
        `${task.title} ${task.company?.name || ""} #${task.id}`
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

  const jumpTo = index => {
    const column = boardRef.current?.children?.[index];
    column?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest"
    });
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

      <SetupStrip setup={setup} />

      <div className={classes.tabs} role="tablist">
        {[
          ["summary", t("stats.title")],
          ["board", t("tabs.board")],
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

          <div className={classes.jump}>
            {stages.map((stage, index) => (
              <ButtonBase
                key={stage.key}
                className={classes.jumpItem}
                onClick={() => jumpTo(index)}
              >
                {t(`stages.${stage.key}`)}
                <span className={classes.jumpCount}>
                  {columns[stage.key].length}
                </span>
              </ButtonBase>
            ))}
          </div>

          <div className={classes.board} ref={boardRef}>
            {stages.map(stage => {
              const list = columns[stage.key];
              const shown =
                stage.key === "done" && !allDone
                  ? list.slice(0, DONE_SHOWN)
                  : list;
              const tone = toneStyle(theme, stage.tone);
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
                    {shown.length === 0 && (
                      <div className={classes.empty}>{t("empty")}</div>
                    )}
                    {shown.map(task => (
                      <TaskCard key={task.id} task={task} onOpen={setOpenId} />
                    ))}
                    {stage.key === "done" &&
                      list.length > DONE_SHOWN &&
                      !allDone && (
                        <ButtonBase
                          className={classes.more}
                          onClick={() => setAllDone(true)}
                        >
                          {t("showAll", { count: list.length })}
                        </ButtonBase>
                      )}
                  </div>
                </section>
              );
            })}
          </div>
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
        onClose={() => setOpenId(null)}
        onChanged={load}
      />
    </MainContainer>
  );
};

export default DevPipeline;
