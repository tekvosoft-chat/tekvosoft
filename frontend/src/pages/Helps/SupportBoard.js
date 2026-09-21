import React, { useCallback, useEffect, useMemo, useState } from "react";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import ButtonBase from "@material-ui/core/ButtonBase";
import InputBase from "@material-ui/core/InputBase";
import SearchRoundedIcon from "@material-ui/icons/SearchRounded";
import AttachFileRoundedIcon from "@material-ui/icons/AttachFileRounded";
import { toast } from "react-toastify";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import PageLoader from "../../components/ui/PageLoader";
import TicketThread from "./TicketThread";
import {
  STATUSES,
  ago,
  categoryOf,
  priorityOf,
  toneStyle,
  useSupportLive
} from "./supportShared";

/**
 * Kanban de suporte (só o super admin): os chamados de todas as empresas
 * por etapa. Arrastar um cartão muda a etapa (e o cliente vê a mudança na
 * conversa); tocar abre a conversa para responder. Os resolvidos mostram
 * só os mais recentes.
 */
const RESOLVED_SHOWN = 30;

const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    toolbar: {
      display: "flex",
      alignItems: "center",
      gap: theme.spacing(1),
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
      borderRadius: t.radius.pill,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface,
      color: theme.palette.text.secondary,
      [theme.breakpoints.down("xs")]: { maxWidth: "none", minWidth: 0 }
    },
    summary: {
      fontSize: "0.875rem",
      color: theme.palette.text.secondary,
      "& b": { color: theme.palette.text.primary }
    },
    board: {
      display: "grid",
      gridTemplateColumns: "repeat(4, minmax(250px, 1fr))",
      gap: theme.spacing(1.5),
      alignItems: "start",
      overflowX: "auto",
      paddingBottom: theme.spacing(2),
      ...theme.scrollbarStyles,
      // celular: uma coluna por vez, deslizando para o lado
      [theme.breakpoints.down("xs")]: {
        gridTemplateColumns: "repeat(4, 86vw)",
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
      maxHeight: "calc(var(--vh, 100vh) - 230px)",
      borderRadius: t.radius.lg,
      backgroundColor: t.surfaceSunken,
      border: `1px solid ${t.border}`,
      transition: "border-color .15s ease, background-color .15s ease",
      [theme.breakpoints.down("xs")]: {
        maxHeight: "calc(var(--vh, 100vh) - 250px)"
      }
    },
    columnOver: {
      borderColor: t.brand.main,
      backgroundColor: t.brand.textSoft
    },
    colHead: {
      flex: "none",
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: theme.spacing(1.5, 1.75, 1)
    },
    dot: { width: 10, height: 10, borderRadius: "50%", flex: "none" },
    colTitle: {
      flex: 1,
      fontSize: "0.875rem",
      fontWeight: 700,
      color: theme.palette.text.primary
    },
    colCount: {
      minWidth: 24,
      height: 22,
      padding: "0 7px",
      borderRadius: t.radius.pill,
      fontSize: "0.75rem",
      fontWeight: 700,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      color: theme.palette.text.secondary,
      backgroundColor: t.surface
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
      borderRadius: t.radius.md,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface,
      textAlign: "left",
      cursor: "grab",
      transition: "box-shadow .15s ease, transform .15s ease, opacity .15s",
      "&:hover": { boxShadow: "0 8px 20px -12px rgba(0,0,0,.45)" },
      "&:active": { cursor: "grabbing" }
    },
    dragging: { opacity: 0.4, transform: "scale(.98)" },
    unread: {
      position: "absolute",
      top: 12,
      right: 12,
      width: 9,
      height: 9,
      borderRadius: "50%",
      backgroundColor: t.brand.main,
      boxShadow: `0 0 0 3px ${t.brand.textSoft}`
    },
    company: {
      paddingRight: 16,
      fontSize: "0.75rem",
      fontWeight: 600,
      color: t.brand.text,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    subject: {
      fontSize: "0.9063rem",
      fontWeight: 700,
      lineHeight: 1.3,
      color: theme.palette.text.primary,
      display: "-webkit-box",
      WebkitLineClamp: 2,
      WebkitBoxOrient: "vertical",
      overflow: "hidden"
    },
    preview: {
      fontSize: "0.8125rem",
      color: theme.palette.text.secondary,
      display: "-webkit-box",
      WebkitLineClamp: 2,
      WebkitBoxOrient: "vertical",
      overflow: "hidden"
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
      borderRadius: t.radius.pill,
      fontSize: "0.6875rem",
      fontWeight: 700
    },
    clip: {
      display: "inline-flex",
      alignItems: "center",
      gap: 2,
      "& svg": { fontSize: 14 }
    },
    time: { marginLeft: "auto" },
    empty: {
      padding: theme.spacing(3, 1),
      textAlign: "center",
      fontSize: "0.8125rem",
      color: theme.palette.text.disabled
    },
    more: {
      width: "100%",
      minHeight: 34,
      borderRadius: t.radius.md,
      fontSize: "0.8125rem",
      fontWeight: 600,
      color: t.brand.text
    }
  };
});

const SupportBoard = () => {
  const classes = useStyles();
  const theme = useTheme();
  const [tickets, setTickets] = useState(null);
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);
  const [allResolved, setAllResolved] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/support/tickets");
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      toastError(err);
      setTickets([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useSupportLive(() => load());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (tickets || []).filter(
      t =>
        !q ||
        `${t.subject} ${t.company?.name || ""} ${t.user?.name || ""} #${t.id}`
          .toLowerCase()
          .includes(q)
    );
  }, [tickets, query]);

  const columns = useMemo(() => {
    const by = Object.fromEntries(STATUSES.map(s => [s.key, []]));
    filtered.forEach(t => (by[t.status] || by.open).push(t));
    // alta prioridade e não lidos sobem dentro da coluna
    const rank = t =>
      (t.unreadBySupport ? 0 : 2) + (t.priority === "high" ? 0 : 1);
    Object.keys(by).forEach(key => {
      if (key !== "resolved") by[key].sort((a, b) => rank(a) - rank(b));
    });
    return by;
  }, [filtered]);

  const move = async (ticketId, status) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket || ticket.status === status) return;
    setTickets(prev =>
      prev.map(t => (t.id === ticketId ? { ...t, status } : t))
    );
    try {
      await api.put(`/support/tickets/${ticketId}`, { status });
      const label = STATUSES.find(s => s.key === status)?.label;
      toast.success(`#${ticketId} em “${label}” · o cliente foi avisado`, {
        autoClose: 2500
      });
    } catch (err) {
      toastError(err);
      load();
    }
  };

  if (!tickets) return <PageLoader />;

  const waitingOnMe = (tickets || []).filter(
    t => t.status !== "resolved" && t.unreadBySupport
  ).length;

  return (
    <>
      <div className={classes.toolbar}>
        <label className={classes.search}>
          <SearchRoundedIcon fontSize="small" />
          <InputBase
            fullWidth
            placeholder="Buscar por assunto, empresa ou #número"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </label>
        <span className={classes.summary}>
          <b>{waitingOnMe}</b>{" "}
          {waitingOnMe === 1 ? "chamado espera" : "chamados esperam"} sua
          resposta
        </span>
      </div>

      <div className={classes.board}>
        {STATUSES.map(status => {
          const list = columns[status.key];
          const shown =
            status.key === "resolved" && !allResolved
              ? list.slice(0, RESOLVED_SHOWN)
              : list;
          const tone = toneStyle(theme, status.tone);
          return (
            <div
              key={status.key}
              className={`${classes.column}${overCol === status.key ? ` ${classes.columnOver}` : ""}`}
              onDragOver={e => {
                e.preventDefault();
                setOverCol(status.key);
              }}
              onDragLeave={() => setOverCol(null)}
              onDrop={e => {
                e.preventDefault();
                setOverCol(null);
                const id = Number(e.dataTransfer.getData("text/plain"));
                if (id) move(id, status.key);
              }}
            >
              <div className={classes.colHead}>
                <span
                  className={classes.dot}
                  style={{ backgroundColor: tone.color }}
                />
                <span className={classes.colTitle}>{status.label}</span>
                <span className={classes.colCount}>{list.length}</span>
              </div>
              <div className={classes.cards}>
                {shown.length === 0 && (
                  <div className={classes.empty}>
                    {status.key === "open"
                      ? "Nenhum chamado novo 🎉"
                      : "Nada por aqui"}
                  </div>
                )}
                {shown.map(ticket => {
                  const priority = priorityOf(ticket.priority);
                  const category = categoryOf(ticket.category);
                  return (
                    <ButtonBase
                      key={ticket.id}
                      component="div"
                      draggable
                      onDragStart={e => {
                        e.dataTransfer.setData("text/plain", String(ticket.id));
                        e.dataTransfer.effectAllowed = "move";
                        setDragId(ticket.id);
                      }}
                      onDragEnd={() => setDragId(null)}
                      className={`${classes.card}${dragId === ticket.id ? ` ${classes.dragging}` : ""}`}
                      onClick={() => setOpenId(ticket.id)}
                    >
                      {ticket.unreadBySupport && (
                        <span className={classes.unread} title="Não lido" />
                      )}
                      <span className={classes.company}>
                        {ticket.company?.name || "—"}
                        {ticket.user?.name ? ` · ${ticket.user.name}` : ""}
                      </span>
                      <span className={classes.subject}>{ticket.subject}</span>
                      {ticket.preview?.body && (
                        <span className={classes.preview}>
                          {ticket.preview.fromSupport ? "Você: " : ""}
                          {ticket.preview.body}
                        </span>
                      )}
                      <span className={classes.foot}>
                        {ticket.priority !== "normal" && (
                          <span
                            className={classes.chip}
                            style={toneStyle(theme, priority.tone)}
                          >
                            {priority.label}
                          </span>
                        )}
                        <span>
                          {category.emoji} {category.label}
                        </span>
                        {ticket.preview?.attachments > 0 && (
                          <span className={classes.clip}>
                            <AttachFileRoundedIcon />
                            {ticket.preview.attachments}
                          </span>
                        )}
                        <span className={classes.time}>
                          #{ticket.id} · {ago(ticket.lastMessageAt)}
                        </span>
                      </span>
                    </ButtonBase>
                  );
                })}
                {status.key === "resolved" &&
                  list.length > RESOLVED_SHOWN &&
                  !allResolved && (
                    <ButtonBase
                      className={classes.more}
                      onClick={() => setAllResolved(true)}
                    >
                      Ver todos ({list.length})
                    </ButtonBase>
                  )}
              </div>
            </div>
          );
        })}
      </div>

      <TicketThread
        ticketId={openId}
        isSuper
        onClose={() => {
          setOpenId(null);
          load();
        }}
      />
    </>
  );
};

export default SupportBoard;
