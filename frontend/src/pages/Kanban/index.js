import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { useHistory } from "react-router-dom";
import { format, isToday, isYesterday, parseISO } from "date-fns";

import { makeStyles } from "@material-ui/core/styles";
import {
  Avatar,
  Button,
  ButtonBase,
  Divider,
  IconButton,
  InputAdornment,
  ListItemIcon,
  ListSubheader,
  Menu,
  MenuItem,
  TextField,
  Typography
} from "@material-ui/core";
import AddRoundedIcon from "@material-ui/icons/AddRounded";
import SearchIcon from "@material-ui/icons/Search";
import MoreHorizIcon from "@material-ui/icons/MoreHoriz";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import EditOutlinedIcon from "@material-ui/icons/EditOutlined";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import ChatOutlinedIcon from "@material-ui/icons/ChatOutlined";
import InboxOutlinedIcon from "@material-ui/icons/InboxOutlined";
import ViewWeekOutlinedIcon from "@material-ui/icons/ViewWeekOutlined";
import PersonOutlineIcon from "@material-ui/icons/PersonOutline";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";
import { SocketContext } from "../../context/Socket/SocketContext";
import TagModal from "../../components/TagModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import EmptyState from "../../components/ui/EmptyState";
import { alpha, readableOn } from "../../theme/tokens";
import { getInitials } from "../../helpers/getInitials";
import { generateColor } from "../../helpers/colorGenerator";

/**
 * Kanban de atendimentos (substitui a antiga tela de Tarefas).
 *
 * Cada card é um atendimento aberto, apresentado pelo contato: foto, nome,
 * última mensagem, fila e atendente. Cada coluna é uma tag marcada como
 * "kanban" — com o nome e a cor que a equipe escolher. Mover um card de
 * coluna troca a tag do ticket.
 *
 * Nada aqui é regra nova no servidor. Tudo usa o que já existia:
 *   GET    /tags/list                     colunas (tags com kanban = 1)
 *   GET    /tickets?notClosed=true        cards
 *   PUT    /ticket-tags/:ticket/:tag      colocar numa coluna
 *   DELETE /ticket-tags/:ticket/:tag      tirar de uma coluna
 *   POST/PUT/DELETE /tags                 criar, editar, excluir coluna
 * O servidor avisa pelo socket a cada troca de tag, então o quadro de todo
 * mundo se atualiza sozinho.
 *
 * A ORDEM das colunas é preferência de tela, não dado do negócio (a tag não
 * tem campo de posição). Por isso fica guardada neste navegador, por empresa.
 */

const INBOX = "inbox";
const PAGE_SIZE = 40; // tamanho de página do GET /tickets
const MAX_PAGES = 10; // teto de segurança: até 400 atendimentos no quadro

const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    page: {
      flex: 1,
      minHeight: 0,
      display: "flex",
      flexDirection: "column",
      backgroundColor: t.canvas
    },

    // ── cabeçalho ──
    header: {
      flex: "none",
      display: "flex",
      alignItems: "center",
      flexWrap: "wrap",
      gap: theme.spacing(1.5),
      padding: theme.spacing(3, 3, 2),
      [theme.breakpoints.down("xs")]: { padding: theme.spacing(2, 1.5, 1.5) }
    },
    titleBox: { flex: "1 1 280px", minWidth: 0 },
    title: {
      fontSize: "1.375rem",
      fontWeight: 700,
      letterSpacing: "-0.02em",
      color: theme.palette.text.primary,
      lineHeight: 1.25
    },
    subtitle: {
      marginTop: 2,
      fontSize: "0.8125rem",
      color: theme.palette.text.secondary
    },
    headerActions: {
      display: "flex",
      alignItems: "center",
      gap: theme.spacing(1),
      [theme.breakpoints.down("xs")]: { width: "100%" }
    },
    search: {
      width: 260,
      "& .MuiOutlinedInput-root": { backgroundColor: t.surface },
      [theme.breakpoints.down("xs")]: { flex: 1, width: "auto" }
    },

    // ── quadro ──
    // No quadro a rolagem lateral é intencional: é o formato do Kanban.
    // No celular cada coluna ocupa quase a tela toda e "encaixa" ao soltar.
    board: {
      flex: 1,
      minHeight: 0,
      display: "flex",
      alignItems: "stretch",
      gap: theme.spacing(1.5),
      overflowX: "auto",
      overflowY: "hidden",
      padding: theme.spacing(0, 3, 2.5),
      ...theme.scrollbarStyles,
      [theme.breakpoints.down("xs")]: {
        padding: theme.spacing(0, 1.5, 1.5),
        gap: theme.spacing(1),
        scrollSnapType: "x mandatory",
        // em string: o JSS não põe "px" sozinho em scroll-padding, e o valor
        // sem unidade era ignorado — a primeira coluna encostava na borda
        scrollPaddingLeft: "12px"
      }
    },

    lane: {
      flex: "0 0 300px",
      minHeight: 0,
      display: "flex",
      flexDirection: "column",
      borderRadius: t.radius.lg,
      backgroundColor: t.isDark ? t.surfaceSunken : "#EFEDF6",
      border: `1px solid ${t.border}`,
      scrollSnapAlign: "start",
      transition: "box-shadow .15s ease, background-color .15s ease",
      [theme.breakpoints.down("xs")]: { flex: "0 0 86vw" }
    },
    laneHeader: {
      flex: "none",
      display: "flex",
      alignItems: "center",
      gap: theme.spacing(1),
      minHeight: 52,
      padding: theme.spacing(1.25, 1, 1.25, 1.5),
      borderTopLeftRadius: t.radius.lg,
      borderTopRightRadius: t.radius.lg,
      borderTop: "4px solid transparent"
    },
    laneDot: {
      flex: "none",
      width: 10,
      height: 10,
      borderRadius: "50%"
    },
    laneName: {
      flex: 1,
      minWidth: 0,
      fontSize: "0.875rem",
      fontWeight: 700,
      color: theme.palette.text.primary,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    laneCount: {
      flex: "none",
      minWidth: 24,
      height: 22,
      padding: "0 8px",
      borderRadius: t.radius.pill,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "0.75rem",
      fontWeight: 700
    },
    laneBody: {
      flex: 1,
      minHeight: 0,
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
      gap: theme.spacing(1),
      padding: theme.spacing(0.5, 1, 1),
      ...theme.scrollbarStyles
    },
    laneEmpty: {
      margin: theme.spacing(0.5, 0),
      padding: theme.spacing(3, 1.5),
      borderRadius: t.radius.md,
      border: `1.5px dashed ${t.borderStrong}`,
      textAlign: "center",
      fontSize: "0.8125rem",
      color: theme.palette.text.secondary
    },

    // ── card ──
    card: {
      position: "relative",
      display: "block",
      width: "100%",
      textAlign: "left",
      padding: theme.spacing(1.25, 1.25, 1, 1.5),
      borderRadius: t.radius.md,
      backgroundColor: t.surface,
      border: `1px solid ${t.border}`,
      boxShadow: theme.shadows[1],
      cursor: "grab",
      transition:
        "box-shadow .15s ease, transform .15s ease, opacity .15s ease",
      "&:hover": { boxShadow: theme.shadows[3] },
      "&:hover $cardMenu, &:focus-within $cardMenu": { opacity: 1 },
      "&::before": {
        content: '""',
        position: "absolute",
        left: 0,
        top: 10,
        bottom: 10,
        width: 3,
        borderRadius: t.radius.pill,
        backgroundColor: "var(--lane-color)"
      }
    },
    cardDragging: { opacity: 0.45, transform: "rotate(1.5deg)" },
    cardTop: {
      display: "flex",
      alignItems: "center",
      gap: theme.spacing(1.25)
    },
    avatar: {
      width: 36,
      height: 36,
      flex: "none",
      fontSize: "0.75rem",
      fontWeight: 700,
      color: "#FFFFFF"
    },
    cardName: {
      flex: 1,
      minWidth: 0,
      fontSize: "0.875rem",
      fontWeight: 600,
      color: theme.palette.text.primary,
      lineHeight: 1.3,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    cardNumber: {
      fontSize: "0.6875rem",
      color: theme.palette.text.secondary,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    unread: {
      flex: "none",
      minWidth: 20,
      height: 20,
      padding: "0 6px",
      borderRadius: t.radius.pill,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "0.6875rem",
      fontWeight: 700,
      backgroundColor: t.chat.accent,
      color: "#FFFFFF"
    },
    cardMenu: {
      flex: "none",
      marginRight: -6,
      opacity: 0,
      transition: "opacity .12s ease",
      "@media (hover: none)": { opacity: 1 }
    },
    lastMessage: {
      marginTop: theme.spacing(0.75),
      fontSize: "0.8125rem",
      lineHeight: 1.4,
      color: theme.palette.text.secondary,
      display: "-webkit-box",
      WebkitLineClamp: 2,
      WebkitBoxOrient: "vertical",
      overflow: "hidden",
      overflowWrap: "anywhere"
    },
    cardFooter: {
      marginTop: theme.spacing(1),
      display: "flex",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 6
    },
    chip: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      maxWidth: "100%",
      height: 22,
      padding: "0 8px",
      borderRadius: t.radius.pill,
      fontSize: "0.6875rem",
      fontWeight: 600,
      backgroundColor: t.surfaceSunken,
      color: theme.palette.text.secondary,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      "& svg": { fontSize: 13 }
    },
    chipPending: {
      backgroundColor: t.semantic.warningSoft,
      color: t.semantic.warning
    },
    chipOpen: {
      backgroundColor: t.semantic.successSoft,
      color: t.semantic.success
    },
    queueDot: { width: 7, height: 7, borderRadius: "50%", flex: "none" },
    time: {
      marginLeft: "auto",
      fontSize: "0.6875rem",
      color: theme.palette.text.secondary,
      whiteSpace: "nowrap"
    },

    // coluna fantasma para criar outra
    addLane: {
      flex: "0 0 260px",
      alignSelf: "flex-start",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing(1),
      minHeight: 56,
      borderRadius: t.radius.lg,
      border: `1.5px dashed ${t.borderStrong}`,
      color: theme.palette.text.secondary,
      fontSize: "0.875rem",
      fontWeight: 600,
      scrollSnapAlign: "start",
      "&:hover": {
        borderColor: t.brand.main,
        color: t.brand.main,
        backgroundColor: t.brand.soft
      },
      [theme.breakpoints.down("xs")]: { flex: "0 0 60vw" }
    },
    intro: {
      flex: "0 0 320px",
      alignSelf: "flex-start",
      borderRadius: t.radius.lg,
      border: `1.5px dashed ${t.borderStrong}`,
      backgroundColor: t.surface,
      [theme.breakpoints.down("xs")]: { flex: "0 0 86vw" }
    }
  };
});

// "14:02" hoje, "Ontem", "09/09" antes.
const shortTime = value => {
  if (!value) return "";
  const date = typeof value === "string" ? parseISO(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  if (isToday(date)) return format(date, "HH:mm");
  if (isYesterday(date)) return i18n.t("common.yesterday");
  return format(date, "dd/MM");
};

const orderKey = () => `tkv:kanbanOrder:${localStorage.getItem("companyId")}`;

const readOrder = () => {
  try {
    return JSON.parse(localStorage.getItem(orderKey()) || "[]");
  } catch (e) {
    return [];
  }
};

const Kanban = () => {
  const classes = useStyles();
  const history = useHistory();
  const { user } = useContext(AuthContext);
  const socketManager = useContext(SocketContext);

  const [tags, setTags] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [order, setOrder] = useState(readOrder);

  const [laneModal, setLaneModal] = useState({ open: false, tagId: null });
  const [laneToDelete, setLaneToDelete] = useState(null);
  const [laneMenu, setLaneMenu] = useState({ anchor: null, lane: null });
  const [cardMenu, setCardMenu] = useState({ anchor: null, ticket: null });
  const [dragging, setDragging] = useState(null);
  const [overLane, setOverLane] = useState(null);

  const refreshTimer = useRef(null);

  // ── dados ──
  const loadTags = useCallback(async () => {
    try {
      const { data } = await api.get("/tags/list");
      setTags(Array.isArray(data) ? data : []);
    } catch (err) {
      toastError(err);
    }
  }, []);

  const loadTickets = useCallback(async () => {
    const queueIds = JSON.stringify((user?.queues || []).map(q => q.id));
    const all = [];
    let nextUpdatedAt;
    try {
      for (let page = 0; page < MAX_PAGES; page += 1) {
        // eslint-disable-next-line no-await-in-loop
        const { data } = await api.get("/tickets", {
          params: {
            notClosed: true,
            showAll: user?.profile === "admin",
            queueIds,
            nextUpdatedAt
          }
        });
        const batch = data?.tickets || [];
        all.push(...batch);
        if (batch.length < PAGE_SIZE) break;
        nextUpdatedAt = batch[batch.length - 1].updatedAt;
      }
      // a paginação por data pode repetir um ticket na fronteira entre páginas
      const seen = new Set();
      setTickets(all.filter(tk => !seen.has(tk.id) && seen.add(tk.id)));
    } catch (err) {
      toastError(err);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    loadTags();
    loadTickets();
  }, [user, loadTags, loadTickets]);

  // tempo real: qualquer mudança em ticket (inclusive troca de tag) recarrega
  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketManager.GetSocket(companyId);
    const schedule = () => {
      clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(loadTickets, 800);
    };
    const onConnect = () => {
      socket.emit("joinTickets", "open");
      socket.emit("joinTickets", "pending");
    };
    socketManager.onConnect(onConnect);
    socket.on(`company-${companyId}-ticket`, schedule);
    return () => {
      clearTimeout(refreshTimer.current);
      socket.off(`company-${companyId}-ticket`, schedule);
      socket.emit("leaveTickets", "open");
      socket.emit("leaveTickets", "pending");
    };
  }, [socketManager, loadTickets]);

  // ── colunas, na ordem escolhida ──
  const lanes = useMemo(() => {
    const kanbanTags = tags.filter(tg => Number(tg.kanban) === 1);
    const position = id => {
      const i = order.indexOf(id);
      return i === -1 ? Number.MAX_SAFE_INTEGER : i;
    };
    return [...kanbanTags].sort(
      (a, b) => position(a.id) - position(b.id) || a.name.localeCompare(b.name)
    );
  }, [tags, order]);

  const laneIds = useMemo(() => new Set(lanes.map(l => l.id)), [lanes]);

  const laneOf = useCallback(
    ticket => {
      const tag = (ticket.tags || []).find(tg => laneIds.has(tg.id));
      return tag ? tag.id : INBOX;
    },
    [laneIds]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter(tk =>
      [tk.contact?.name, tk.contact?.number, tk.lastMessage]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(q))
    );
  }, [tickets, search]);

  const columns = useMemo(() => {
    const map = new Map([[INBOX, []], ...lanes.map(l => [l.id, []])]);
    filtered.forEach(tk => map.get(laneOf(tk))?.push(tk));
    return map;
  }, [filtered, lanes, laneOf]);

  // ── mover ──
  const moveTicket = async (ticket, toLane) => {
    const current = laneOf(ticket);
    if (current === toLane) return;

    const kanbanTags = (ticket.tags || []).filter(tg => laneIds.has(tg.id));
    const target = lanes.find(l => l.id === toLane);

    // otimista: o card muda de coluna na hora, sem esperar o servidor
    setTickets(prev =>
      prev.map(tk =>
        tk.id !== ticket.id
          ? tk
          : {
              ...tk,
              tags: [
                ...(tk.tags || []).filter(tg => !laneIds.has(tg.id)),
                ...(target ? [target] : [])
              ]
            }
      )
    );

    try {
      for (const tg of kanbanTags) {
        // eslint-disable-next-line no-await-in-loop
        await api.delete(`/ticket-tags/${ticket.id}/${tg.id}`);
      }
      if (target) {
        await api.put(`/ticket-tags/${ticket.id}/${target.id}`);
      }
    } catch (err) {
      toastError(err);
      loadTickets();
    }
  };

  const persistOrder = next => {
    setOrder(next);
    try {
      localStorage.setItem(orderKey(), JSON.stringify(next));
    } catch (e) {}
  };

  const shiftLane = (laneId, delta) => {
    const ids = lanes.map(l => l.id);
    const from = ids.indexOf(laneId);
    const to = from + delta;
    if (from === -1 || to < 0 || to >= ids.length) return;
    [ids[from], ids[to]] = [ids[to], ids[from]];
    persistOrder(ids);
  };

  const deleteLane = async lane => {
    try {
      await api.delete(`/tags/${lane.id}`);
      persistOrder(order.filter(id => id !== lane.id));
      await loadTags();
      loadTickets();
    } catch (err) {
      toastError(err);
    }
  };

  // ── arrastar e soltar (desktop) ──
  const onDragStart = (e, ticket) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(ticket.id));
    setDragging(ticket.id);
  };
  const onDragEnd = () => {
    setDragging(null);
    setOverLane(null);
  };
  const onDrop = (e, laneId) => {
    e.preventDefault();
    const id = Number(e.dataTransfer.getData("text/plain"));
    const ticket = tickets.find(tk => tk.id === id);
    setOverLane(null);
    setDragging(null);
    if (ticket) moveTicket(ticket, laneId);
  };

  // ── pedaços ──
  const renderCard = (ticket, laneColor) => {
    const contact = ticket.contact || {};
    const pending = ticket.status === "pending";
    return (
      <div
        key={ticket.id}
        role="button"
        tabIndex={0}
        draggable
        onDragStart={e => onDragStart(e, ticket)}
        onDragEnd={onDragEnd}
        onClick={() => history.push(`/tickets/${ticket.uuid}`)}
        onKeyDown={e => {
          if (e.key === "Enter") history.push(`/tickets/${ticket.uuid}`);
        }}
        className={`${classes.card}${dragging === ticket.id ? ` ${classes.cardDragging}` : ""}`}
        style={{ "--lane-color": laneColor }}
      >
        <div className={classes.cardTop}>
          <Avatar
            className={classes.avatar}
            src={contact.profilePicUrl}
            style={{ backgroundColor: generateColor(contact.number) }}
          >
            {getInitials(contact.name)}
          </Avatar>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Typography component="p" className={classes.cardName}>
              {contact.name || contact.number}
            </Typography>
            <Typography component="p" className={classes.cardNumber}>
              {contact.number}
            </Typography>
          </div>
          {ticket.unreadMessages > 0 && (
            <span className={classes.unread}>{ticket.unreadMessages}</span>
          )}
          <IconButton
            size="small"
            className={classes.cardMenu}
            aria-label={i18n.t("kanban.moveTo")}
            onClick={e => {
              e.stopPropagation();
              setCardMenu({ anchor: e.currentTarget, ticket });
            }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </div>

        {ticket.lastMessage && (
          <Typography component="p" className={classes.lastMessage}>
            {ticket.lastMessage}
          </Typography>
        )}

        <div className={classes.cardFooter}>
          <span
            className={`${classes.chip} ${pending ? classes.chipPending : classes.chipOpen}`}
          >
            {pending
              ? i18n.t("ticketsList.pendingHeader")
              : i18n.t("ticketsList.assignedHeader")}
          </span>
          {ticket.queue && (
            <span className={classes.chip}>
              <span
                className={classes.queueDot}
                style={{ backgroundColor: ticket.queue.color }}
              />
              {ticket.queue.name}
            </span>
          )}
          <span className={classes.chip}>
            <PersonOutlineIcon />
            {ticket.user?.name || i18n.t("kanban.unassigned")}
          </span>
          <span className={classes.time}>{shortTime(ticket.updatedAt)}</span>
        </div>
      </div>
    );
  };

  const renderLane = ({ id, name, color, editable }) => {
    const cards = columns.get(id) || [];
    const over = overLane === id;
    const laneColor = color || "#8B85A1";
    return (
      <section
        key={id}
        className={classes.lane}
        onDragOver={e => {
          e.preventDefault();
          if (overLane !== id) setOverLane(id);
        }}
        onDragLeave={e => {
          if (!e.currentTarget.contains(e.relatedTarget)) setOverLane(null);
        }}
        onDrop={e => onDrop(e, id)}
        style={
          over
            ? {
                backgroundColor: alpha(laneColor, 0.14),
                boxShadow: `0 0 0 2px ${laneColor}`
              }
            : undefined
        }
        aria-label={name}
      >
        <header
          className={classes.laneHeader}
          style={{
            borderTopColor: laneColor,
            backgroundColor: alpha(laneColor, 0.08)
          }}
        >
          {id === INBOX ? (
            <InboxOutlinedIcon fontSize="small" style={{ color: laneColor }} />
          ) : (
            <span
              className={classes.laneDot}
              style={{ backgroundColor: laneColor }}
            />
          )}
          <Typography component="h2" className={classes.laneName}>
            {name}
          </Typography>
          <span
            className={classes.laneCount}
            style={{ backgroundColor: laneColor, color: readableOn(laneColor) }}
          >
            {cards.length}
          </span>
          {editable && (
            <IconButton
              size="small"
              aria-label={i18n.t("common.actions")}
              onClick={e =>
                setLaneMenu({
                  anchor: e.currentTarget,
                  lane: lanes.find(l => l.id === id)
                })
              }
            >
              <MoreHorizIcon fontSize="small" />
            </IconButton>
          )}
        </header>
        <div className={classes.laneBody}>
          {cards.map(tk => renderCard(tk, laneColor))}
          {!loading && cards.length === 0 && (
            <div className={classes.laneEmpty}>
              {i18n.t("kanban.emptyLane")}
            </div>
          )}
        </div>
      </section>
    );
  };

  const cardTicket = cardMenu.ticket;
  const cardLane = cardTicket ? laneOf(cardTicket) : null;

  return (
    <div className={classes.page}>
      <TagModal
        open={laneModal.open}
        onClose={() => setLaneModal({ open: false, tagId: null })}
        tagId={laneModal.tagId}
        kanban={1}
        reload={loadTags}
      />
      <ConfirmationModal
        title={`${i18n.t("kanban.deleteLaneTitle")} ${laneToDelete?.name || ""}?`}
        open={!!laneToDelete}
        onClose={() => setLaneToDelete(null)}
        onConfirm={() => deleteLane(laneToDelete)}
      >
        {i18n.t("kanban.deleteLaneMessage")}
      </ConfirmationModal>

      {/* menu da coluna */}
      <Menu
        anchorEl={laneMenu.anchor}
        open={Boolean(laneMenu.anchor)}
        onClose={() => setLaneMenu({ anchor: null, lane: null })}
        getContentAnchorEl={null}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem
          onClick={() => {
            setLaneModal({ open: true, tagId: laneMenu.lane.id });
            setLaneMenu({ anchor: null, lane: null });
          }}
        >
          <ListItemIcon>
            <EditOutlinedIcon fontSize="small" />
          </ListItemIcon>
          {i18n.t("kanban.editLane")}
        </MenuItem>
        <MenuItem
          disabled={lanes[0]?.id === laneMenu.lane?.id}
          onClick={() => {
            shiftLane(laneMenu.lane.id, -1);
            setLaneMenu({ anchor: null, lane: null });
          }}
        >
          <ListItemIcon>
            <ChevronLeftIcon fontSize="small" />
          </ListItemIcon>
          {i18n.t("kanban.moveLeft")}
        </MenuItem>
        <MenuItem
          disabled={lanes[lanes.length - 1]?.id === laneMenu.lane?.id}
          onClick={() => {
            shiftLane(laneMenu.lane.id, 1);
            setLaneMenu({ anchor: null, lane: null });
          }}
        >
          <ListItemIcon>
            <ChevronRightIcon fontSize="small" />
          </ListItemIcon>
          {i18n.t("kanban.moveRight")}
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            setLaneToDelete(laneMenu.lane);
            setLaneMenu({ anchor: null, lane: null });
          }}
        >
          <ListItemIcon>
            <DeleteOutlineIcon fontSize="small" />
          </ListItemIcon>
          {i18n.t("kanban.deleteLane")}
        </MenuItem>
      </Menu>

      {/* menu do card: abrir e mover — é o jeito de mover no celular,
          onde arrastar e soltar do navegador não funciona com o dedo */}
      <Menu
        anchorEl={cardMenu.anchor}
        open={Boolean(cardMenu.anchor)}
        onClose={() => setCardMenu({ anchor: null, ticket: null })}
        getContentAnchorEl={null}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem
          onClick={() => {
            const tk = cardMenu.ticket;
            setCardMenu({ anchor: null, ticket: null });
            history.push(`/tickets/${tk.uuid}`);
          }}
        >
          <ListItemIcon>
            <ChatOutlinedIcon fontSize="small" />
          </ListItemIcon>
          {i18n.t("kanban.openConversation")}
        </MenuItem>
        <Divider />
        <ListSubheader disableSticky>{i18n.t("kanban.moveTo")}</ListSubheader>
        {[
          { id: INBOX, name: i18n.t("kanban.inbox"), color: null },
          ...lanes
        ].map(lane => (
          <MenuItem
            key={lane.id}
            selected={cardLane === lane.id}
            onClick={() => {
              const tk = cardMenu.ticket;
              setCardMenu({ anchor: null, ticket: null });
              moveTicket(tk, lane.id);
            }}
          >
            <ListItemIcon>
              <span
                className={classes.laneDot}
                style={{
                  backgroundColor: lane.color || "#8B85A1",
                  marginLeft: 5
                }}
              />
            </ListItemIcon>
            {lane.name}
          </MenuItem>
        ))}
      </Menu>

      <div className={classes.header}>
        <div className={classes.titleBox}>
          <Typography component="h1" className={classes.title}>
            {i18n.t("kanban.title")}
          </Typography>
          <Typography className={classes.subtitle}>
            {i18n.t("kanban.subtitle")}
          </Typography>
        </div>
        <div className={classes.headerActions}>
          <TextField
            className={classes.search}
            placeholder={i18n.t("kanban.searchPlaceholder")}
            value={search}
            onChange={e => setSearch(e.target.value)}
            type="search"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              )
            }}
          />
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddRoundedIcon />}
            onClick={() => setLaneModal({ open: true, tagId: null })}
          >
            {i18n.t("kanban.newLane")}
          </Button>
        </div>
      </div>

      <div className={classes.board}>
        {renderLane({
          id: INBOX,
          name: i18n.t("kanban.inbox"),
          color: null,
          editable: false
        })}

        {lanes.map(lane =>
          renderLane({
            id: lane.id,
            name: lane.name,
            color: lane.color,
            editable: true
          })
        )}

        {!loading && lanes.length === 0 ? (
          <div className={classes.intro}>
            <EmptyState
              icon={<ViewWeekOutlinedIcon />}
              title={i18n.t("kanban.noLanesTitle")}
              description={i18n.t("kanban.noLanesDescription")}
              action={
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddRoundedIcon />}
                  onClick={() => setLaneModal({ open: true, tagId: null })}
                >
                  {i18n.t("kanban.newLane")}
                </Button>
              }
            />
          </div>
        ) : (
          <ButtonBase
            className={classes.addLane}
            onClick={() => setLaneModal({ open: true, tagId: null })}
          >
            <AddRoundedIcon fontSize="small" />
            {i18n.t("kanban.newLane")}
          </ButtonBase>
        )}
      </div>
    </div>
  );
};

export default Kanban;
