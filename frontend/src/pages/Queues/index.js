import React, { useContext, useEffect, useReducer, useState } from "react";

import { makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import ButtonBase from "@material-ui/core/ButtonBase";
import IconButton from "@material-ui/core/IconButton";
import Tooltip from "@material-ui/core/Tooltip";
import Typography from "@material-ui/core/Typography";
import AddRoundedIcon from "@material-ui/icons/AddRounded";
import AccountTreeOutlinedIcon from "@material-ui/icons/AccountTreeOutlined";
import EditOutlinedIcon from "@material-ui/icons/EditOutlined";
import DeleteOutlineRoundedIcon from "@material-ui/icons/DeleteOutlineRounded";
import AndroidRoundedIcon from "@material-ui/icons/AndroidRounded";
import ScheduleRoundedIcon from "@material-ui/icons/ScheduleRounded";
import PeopleAltOutlinedIcon from "@material-ui/icons/PeopleAltOutlined";
import WhatsAppIcon from "@material-ui/icons/WhatsApp";
import ForumOutlinedIcon from "@material-ui/icons/ForumOutlined";
import FormatQuoteRoundedIcon from "@material-ui/icons/FormatQuoteRounded";

import MainContainer from "../../components/MainContainer";
import EmptyState from "../../components/ui/EmptyState";
import PageLoader from "../../components/ui/PageLoader";
import QueueModal from "../../components/QueueModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import { i18nToast } from "../../helpers/i18nToast";
import { i18n } from "../../translate/i18n";
import toastError from "../../errors/toastError";
import api from "../../services/api";
import { SocketContext } from "../../context/Socket/SocketContext";
import { alpha, readableOn } from "../../theme/tokens";

/**
 * Filas & Chatbot em cartões.
 *
 * Cada fila vira um cartão na cor dela: a saudação aparece como um balão de
 * conversa (é o que o cliente recebe), e embaixo ficam os números que
 * importam — opções do chatbot, atendentes, conexões e atendimentos na fila.
 * Tocar no cartão abre a edição de sempre.
 */
const reducer = (state, action) => {
  if (action.type === "LOAD_QUEUES") return action.payload;
  if (action.type === "UPDATE_QUEUES") {
    const queue = action.payload;
    const i = state.findIndex(q => q.id === queue.id);
    if (i === -1) return [...state, queue];
    const next = [...state];
    next[i] = queue;
    return next;
  }
  if (action.type === "DELETE_QUEUE") {
    return state.filter(q => q.id !== action.payload);
  }
  return state;
};

const hasSchedules = schedules =>
  !!schedules &&
  ((Array.isArray(schedules.weeklyRules) && schedules.weeklyRules.length > 0) ||
    (Array.isArray(schedules) && schedules.length > 0));

const safeColor = color =>
  /^#[0-9a-f]{6}$/i.test(color || "") ? color : "#7C3AED";

const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    page: {
      overflowY: "auto",
      ...theme.scrollbarStyles,
      "& > div > *": { flexShrink: 0 }
    },
    head: {
      display: "flex",
      alignItems: "center",
      flexWrap: "wrap",
      gap: theme.spacing(1.5)
    },
    titleBox: { flex: 1, minWidth: 200 },
    title: {
      fontSize: "1.5rem",
      fontWeight: 700,
      letterSpacing: "-0.02em",
      color: theme.palette.text.primary
    },
    subtitle: { fontSize: "0.875rem", color: theme.palette.text.secondary },
    add: {
      height: 42,
      borderRadius: 999,
      padding: "0 18px",
      fontWeight: 700,
      textTransform: "none"
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
      gap: theme.spacing(2),
      paddingBottom: theme.spacing(2),
      [theme.breakpoints.down("xs")]: {
        gridTemplateColumns: "1fr",
        gap: theme.spacing(1.25)
      }
    },
    card: {
      position: "relative",
      display: "flex",
      flexDirection: "column",
      alignItems: "stretch",
      textAlign: "left",
      borderRadius: t.radius.xl,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface,
      overflow: "hidden",
      transition:
        "transform .18s ease, box-shadow .18s ease, border-color .18s",
      animation: "$rise .35s ease both",
      "&:hover": {
        transform: "translateY(-2px)",
        borderColor: "var(--queue-soft-border)",
        boxShadow: "0 14px 32px -20px var(--queue)"
      }
    },
    band: {
      position: "relative",
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: theme.spacing(2, 2, 1.75),
      background: "linear-gradient(135deg, var(--queue-soft), transparent 85%)"
    },
    badgeIcon: {
      flex: "none",
      width: 46,
      height: 46,
      borderRadius: 14,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "1.25rem",
      fontWeight: 800,
      color: "var(--queue-text)",
      backgroundColor: "var(--queue)",
      boxShadow: "0 6px 16px -8px var(--queue)"
    },
    nameBox: { flex: 1, minWidth: 0 },
    name: {
      fontSize: "1.0625rem",
      fontWeight: 700,
      color: theme.palette.text.primary,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    },
    tags: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 },
    tag: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      padding: "2px 8px",
      borderRadius: 999,
      fontSize: "0.6875rem",
      fontWeight: 700,
      color: theme.palette.text.secondary,
      backgroundColor: t.surfaceSunken,
      "& svg": { fontSize: 13 }
    },
    tagOn: {
      color: "var(--queue-strong)",
      backgroundColor: "var(--queue-soft)"
    },
    body: { padding: theme.spacing(0, 2, 1.5) },
    greeting: {
      position: "relative",
      padding: "10px 12px 10px 34px",
      borderRadius: "16px 16px 16px 6px",
      backgroundColor: t.surfaceSunken,
      fontSize: "0.8125rem",
      lineHeight: 1.45,
      color: theme.palette.text.primary,
      display: "-webkit-box",
      WebkitLineClamp: 3,
      WebkitBoxOrient: "vertical",
      overflow: "hidden",
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
      minHeight: 58
    },
    quote: {
      position: "absolute",
      left: 8,
      top: 8,
      fontSize: 18,
      color: "var(--queue-strong)"
    },
    greetingEmpty: { color: theme.palette.text.secondary, fontStyle: "italic" },
    stats: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      borderTop: `1px solid ${t.border}`,
      marginTop: "auto"
    },
    stat: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 2,
      padding: "10px 4px",
      "& + $stat": { borderLeft: `1px solid ${t.border}` },
      "& svg": { fontSize: 18, color: theme.palette.text.secondary }
    },
    statValue: {
      fontSize: "1rem",
      fontWeight: 800,
      color: theme.palette.text.primary,
      fontVariantNumeric: "tabular-nums"
    },
    statLabel: { fontSize: "0.6875rem", color: theme.palette.text.secondary },
    actions: {
      position: "absolute",
      top: 10,
      right: 10,
      display: "flex",
      gap: 2
    },
    action: {
      width: 32,
      height: 32,
      backgroundColor: t.surface,
      boxShadow: "0 1px 3px rgba(12, 10, 20, 0.12)",
      "&:hover": { backgroundColor: t.surfaceHover }
    },
    newCard: {
      minHeight: 220,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      borderRadius: t.radius.xl,
      border: `2px dashed ${t.borderStrong}`,
      color: t.brand.text,
      fontWeight: 700,
      "&:hover": {
        backgroundColor: t.brand.textSoft,
        borderColor: t.brand.text
      },
      [theme.breakpoints.down("xs")]: { minHeight: 90, flexDirection: "row" }
    },
    newIcon: {
      width: 48,
      height: 48,
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.brand.textSoft,
      "& svg": { fontSize: 28 }
    },
    center: { display: "flex", justifyContent: "center", padding: 40 },
    "@keyframes rise": {
      from: { opacity: 0, transform: "translateY(8px)" },
      to: { opacity: 1, transform: "none" }
    }
  };
});

const Queues = () => {
  const classes = useStyles();
  const [queues, dispatch] = useReducer(reducer, []);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [queueModalOpen, setQueueModalOpen] = useState(false);
  const [selectedQueue, setSelectedQueue] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const socketManager = useContext(SocketContext);
  const q = (key, opts) => i18n.t(`queuesPage.${key}`, opts);

  const loadStats = () =>
    api
      .get("/queues/stats")
      .then(({ data }) => setStats(data || {}))
      .catch(() => {});

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/queue");
        dispatch({ type: "LOAD_QUEUES", payload: data });
      } catch (err) {
        toastError(err);
      }
      setLoading(false);
    })();
    loadStats();
  }, []);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketManager.GetSocket(companyId);
    const onQueue = data => {
      if (data.action === "update" || data.action === "create") {
        dispatch({ type: "UPDATE_QUEUES", payload: data.queue });
        loadStats();
      }
      if (data.action === "delete") {
        dispatch({ type: "DELETE_QUEUE", payload: data.queueId });
      }
    };
    socket.on(`company-${companyId}-queue`, onQueue);
    return () => socket.disconnect();
  }, [socketManager]);

  const openNew = () => {
    setSelectedQueue(null);
    setQueueModalOpen(true);
  };

  const openEdit = queue => {
    setSelectedQueue(queue);
    setQueueModalOpen(true);
  };

  const handleDeleteQueue = async queueId => {
    try {
      await api.delete(`/queue/${queueId}`);
      i18nToast.success("queues.toasts.deleted");
    } catch (err) {
      toastError(err);
    }
    setSelectedQueue(null);
  };

  return (
    <MainContainer className={classes.page}>
      <ConfirmationModal
        title={
          selectedQueue &&
          `${i18n.t("queues.confirmationModal.deleteTitle")} ${selectedQueue.name}?`
        }
        open={confirmModalOpen}
        onClose={() => {
          setConfirmModalOpen(false);
          setSelectedQueue(null);
        }}
        onConfirm={() => handleDeleteQueue(selectedQueue.id)}
      >
        {i18n.t("queues.confirmationModal.deleteMessage")}
      </ConfirmationModal>
      <QueueModal
        open={queueModalOpen}
        onClose={() => {
          setQueueModalOpen(false);
          setSelectedQueue(null);
          loadStats();
        }}
        queueId={selectedQueue?.id}
      />

      <div className={classes.head}>
        <div className={classes.titleBox}>
          <Typography component="h1" className={classes.title}>
            {i18n.t("queues.title")}
          </Typography>
          <Typography className={classes.subtitle}>{q("subtitle")}</Typography>
        </div>
        <Button
          variant="contained"
          color="primary"
          className={classes.add}
          startIcon={<AddRoundedIcon />}
          onClick={openNew}
        >
          {i18n.t("queues.buttons.add")}
        </Button>
      </div>

      {loading ? (
        <PageLoader />
      ) : queues.length === 0 ? (
        <EmptyState
          icon={<AccountTreeOutlinedIcon />}
          title={q("emptyTitle")}
          description={q("emptyText")}
          action={
            <Button color="primary" variant="contained" onClick={openNew}>
              {i18n.t("queues.buttons.add")}
            </Button>
          }
        />
      ) : (
        <div className={classes.grid}>
          {queues.map((queue, index) => {
            const color = safeColor(queue.color);
            const info = stats[queue.id] || {};
            const vars = {
              "--queue": color,
              "--queue-text": readableOn(color),
              "--queue-soft": alpha(color, 0.16),
              "--queue-soft-border": alpha(color, 0.5),
              "--queue-strong": color,
              animationDelay: `${Math.min(index, 10) * 35}ms`
            };
            return (
              <ButtonBase
                key={queue.id}
                component="div"
                role="button"
                className={classes.card}
                style={vars}
                onClick={() => openEdit(queue)}
              >
                <div className={classes.band}>
                  <span className={classes.badgeIcon}>
                    {(queue.name || "?").slice(0, 1).toUpperCase()}
                  </span>
                  <div className={classes.nameBox}>
                    <div className={classes.name}>{queue.name}</div>
                    <div className={classes.tags}>
                      <span
                        className={`${classes.tag}${info.options ? ` ${classes.tagOn}` : ""}`}
                      >
                        <AndroidRoundedIcon />
                        {info.options
                          ? q("chatbot", { count: info.options })
                          : q("noChatbot")}
                      </span>
                      {hasSchedules(queue.schedules) && (
                        <span className={`${classes.tag} ${classes.tagOn}`}>
                          <ScheduleRoundedIcon />
                          {q("hours")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className={classes.actions}>
                  <Tooltip title={q("edit")}>
                    <IconButton
                      size="small"
                      className={classes.action}
                      onClick={e => {
                        e.stopPropagation();
                        openEdit(queue);
                      }}
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={q("delete")}>
                    <IconButton
                      size="small"
                      className={classes.action}
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedQueue(queue);
                        setConfirmModalOpen(true);
                      }}
                    >
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </div>

                <div className={classes.body}>
                  <div
                    className={`${classes.greeting}${queue.greetingMessage ? "" : ` ${classes.greetingEmpty}`}`}
                  >
                    <FormatQuoteRoundedIcon className={classes.quote} />
                    {queue.greetingMessage || q("noGreeting")}
                  </div>
                </div>

                <div className={classes.stats}>
                  <div className={classes.stat}>
                    <PeopleAltOutlinedIcon />
                    <span className={classes.statValue}>
                      {info.users ?? "–"}
                    </span>
                    <span className={classes.statLabel}>{q("users")}</span>
                  </div>
                  <div className={classes.stat}>
                    <WhatsAppIcon />
                    <span className={classes.statValue}>
                      {info.connections ?? "–"}
                    </span>
                    <span className={classes.statLabel}>
                      {q("connections")}
                    </span>
                  </div>
                  <div className={classes.stat}>
                    <ForumOutlinedIcon />
                    <span className={classes.statValue}>
                      {info.open ?? "–"}
                      {info.pending ? ` + ${info.pending}` : ""}
                    </span>
                    <span className={classes.statLabel}>{q("tickets")}</span>
                  </div>
                </div>
              </ButtonBase>
            );
          })}
          <ButtonBase className={classes.newCard} onClick={openNew}>
            <span className={classes.newIcon}>
              <AddRoundedIcon />
            </span>
            {q("new")}
          </ButtonBase>
        </div>
      )}
    </MainContainer>
  );
};

export default Queues;
