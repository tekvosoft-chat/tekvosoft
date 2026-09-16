import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { toast } from "react-toastify";
import moment from "moment";

import { makeStyles, useTheme } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import Avatar from "@material-ui/core/Avatar";
import Button from "@material-ui/core/Button";
import ButtonBase from "@material-ui/core/ButtonBase";
import IconButton from "@material-ui/core/IconButton";
import InputAdornment from "@material-ui/core/InputAdornment";
import TextField from "@material-ui/core/TextField";
import Tooltip from "@material-ui/core/Tooltip";
import Typography from "@material-ui/core/Typography";
import ChevronLeftRoundedIcon from "@material-ui/icons/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@material-ui/icons/ChevronRightRounded";
import AddRoundedIcon from "@material-ui/icons/AddRounded";
import SearchIcon from "@material-ui/icons/Search";
import EditOutlinedIcon from "@material-ui/icons/EditOutlined";
import DeleteOutlineRoundedIcon from "@material-ui/icons/DeleteOutlineRounded";
import EventRoundedIcon from "@material-ui/icons/EventRounded";

import MainContainer from "../../components/MainContainer";
import ScheduleModal from "../../components/ScheduleModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import BoxLoader from "../../components/ui/BoxLoader";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";
import { SocketContext } from "../../context/Socket/SocketContext";
import { AuthContext } from "../../context/Auth/AuthContext";
import { generateColor } from "../../helpers/colorGenerator";
import { getInitials } from "../../helpers/getInitials";

/**
 * Agendamentos em calendário.
 *
 * A tabela mostrava as mensagens programadas como uma lista sem noção de
 * tempo. Aqui o mês fica à vista: cada dia mostra o que sai nele, com a cor
 * da situação (agendada, enviada, com erro). Tocar num dia abre a agenda
 * daquele dia ao lado (embaixo, no celular), e dá para agendar direto nele.
 */
const STATUS = {
  PENDENTE: "pending",
  AGENDADA: "pending",
  ENVIADA: "sent",
  ERRO: "error"
};
const statusOf = s => STATUS[String(s || "").toUpperCase()] || "pending";

const getUrlParam = param =>
  new URLSearchParams(window.location.search).get(param);

const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  const tone = {
    pending: { bg: t.brand.textSoft, fg: t.brand.text },
    sent: { bg: t.semantic.successSoft, fg: t.semantic.success },
    error: { bg: t.semantic.dangerSoft, fg: t.semantic.danger }
  };
  return {
    page: {
      flex: 1,
      minHeight: 0,
      display: "flex",
      flexDirection: "column",
      gap: theme.spacing(2),
      padding: theme.spacing(0, 0, 2),
      overflow: "auto",
      ...theme.scrollbarStyles
    },
    head: {
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: theme.spacing(1.5)
    },
    title: {
      fontSize: "1.5rem",
      fontWeight: 700,
      letterSpacing: "-0.02em",
      color: theme.palette.text.primary
    },
    subtitle: { fontSize: "0.875rem", color: theme.palette.text.secondary },
    headActions: {
      display: "flex",
      gap: theme.spacing(1),
      flexWrap: "wrap",
      [theme.breakpoints.down("xs")]: { width: "100%" }
    },
    search: {
      minWidth: 240,
      [theme.breakpoints.down("xs")]: { minWidth: 0, flex: 1 }
    },
    toolbar: {
      display: "flex",
      alignItems: "center",
      flexWrap: "wrap",
      gap: theme.spacing(1)
    },
    monthNav: { display: "flex", alignItems: "center", gap: 2 },
    monthLabel: {
      minWidth: 170,
      fontSize: "1.125rem",
      fontWeight: 700,
      whiteSpace: "nowrap",
      color: theme.palette.text.primary,
      [theme.breakpoints.down("xs")]: {
        minWidth: 0,
        flex: 1,
        fontSize: "1rem",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }
    },
    navBtn: {
      border: `1px solid ${t.border}`,
      borderRadius: t.radius.sm,
      width: 36,
      height: 36
    },
    filters: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap",
      marginLeft: "auto",
      // celular: uma linha só, que rola para o lado
      [theme.breakpoints.down("xs")]: {
        marginLeft: 0,
        width: "100%",
        flexWrap: "nowrap",
        overflowX: "auto",
        paddingBottom: 2,
        "& > *": { flex: "none" }
      }
    },
    filter: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      height: 32,
      padding: "0 12px",
      borderRadius: t.radius.pill,
      fontSize: "0.8125rem",
      fontWeight: 600,
      border: `1px solid ${t.border}`,
      color: theme.palette.text.secondary,
      backgroundColor: t.surface
    },
    filterOn: {
      borderColor: t.brand.textBorder,
      backgroundColor: t.brand.textSoft,
      color: t.brand.text
    },
    dot: { width: 8, height: 8, borderRadius: "50%", flex: "none" },
    // ── seletor Mês / Semana / Dia / Lista (como o Google Agenda) ──
    views: {
      position: "relative",
      display: "inline-flex",
      padding: 3,
      borderRadius: t.radius.pill,
      backgroundColor: t.surfaceSunken,
      border: `1px solid ${t.border}`
    },
    viewBtn: {
      position: "relative",
      zIndex: 1,
      height: 30,
      padding: "0 14px",
      borderRadius: t.radius.pill,
      fontSize: "0.8125rem",
      fontWeight: 600,
      color: theme.palette.text.secondary,
      transition: "color .2s ease, background-color .25s ease, box-shadow .25s",
      [theme.breakpoints.down("xs")]: { padding: "0 10px" }
    },
    viewBtnOn: {
      color: t.brand.text,
      backgroundColor: t.surface,
      boxShadow: "0 2px 8px -2px rgba(12, 10, 20, 0.2)"
    },
    // troca de visão entra deslizando
    viewEnter: { animation: "$viewIn .28s cubic-bezier(.2, .8, .2, 1) both" },
    "@keyframes viewIn": {
      from: { opacity: 0, transform: "translateY(8px) scale(.995)" },
      to: { opacity: 1, transform: "none" }
    },
    "@keyframes popIn": {
      from: { opacity: 0, transform: "scale(.9)" },
      to: { opacity: 1, transform: "none" }
    },
    // ── grade de horas (semana e dia) ──
    tg: {
      borderRadius: t.radius.lg,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface,
      overflow: "hidden"
    },
    tgHead: {
      display: "grid",
      borderBottom: `1px solid ${t.border}`,
      paddingRight: 8
    },
    tgHeadDay: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 2,
      padding: theme.spacing(1, 0),
      cursor: "pointer",
      borderRadius: 12,
      transition: "background-color .15s ease",
      "&:hover": { backgroundColor: t.surfaceHover }
    },
    tgHeadName: {
      fontSize: "0.6875rem",
      fontWeight: 700,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: theme.palette.text.secondary
    },
    tgHeadNum: {
      width: 40,
      height: 40,
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "1.375rem",
      fontWeight: 500,
      color: theme.palette.text.primary,
      transition: "background-color .2s ease, transform .2s ease",
      [theme.breakpoints.down("xs")]: {
        width: 30,
        height: 30,
        fontSize: "1rem"
      }
    },
    tgScroll: {
      position: "relative",
      height: "calc(var(--vh, 100vh) - 300px)",
      minHeight: 360,
      overflowY: "auto",
      scrollBehavior: "smooth",
      ...theme.scrollbarStyles,
      [theme.breakpoints.down("xs")]: {
        height: "calc(var(--vh, 100vh) - 330px)"
      }
    },
    tgBody: { position: "relative", display: "grid" },
    tgHours: { position: "relative" },
    tgHour: {
      height: 52,
      position: "relative",
      "& span": {
        position: "absolute",
        top: -7,
        right: 8,
        fontSize: "0.6875rem",
        color: theme.palette.text.secondary
      }
    },
    tgCol: {
      position: "relative",
      borderLeft: `1px solid ${t.border}`,
      backgroundImage: `repeating-linear-gradient(to bottom, ${t.border} 0, ${t.border} 1px, transparent 1px, transparent 52px)`
    },
    tgColToday: { backgroundColor: t.brand.soft },
    tgSlot: {
      height: 26,
      cursor: "pointer",
      transition: "background-color .12s ease",
      "&:hover": { backgroundColor: t.brand.textSoft }
    },
    tgEvent: {
      position: "absolute",
      left: 3,
      right: 3,
      minHeight: 22,
      padding: "3px 7px",
      borderRadius: 8,
      overflow: "hidden",
      fontSize: "0.75rem",
      fontWeight: 600,
      lineHeight: 1.3,
      cursor: "pointer",
      borderLeft: "3px solid currentColor",
      boxShadow: "0 2px 6px -2px rgba(12, 10, 20, 0.2)",
      animation: "$popIn .25s ease both",
      transition: "transform .15s ease, box-shadow .15s ease",
      "&:hover": {
        zIndex: 2,
        transform: "translateY(-1px) scale(1.02)",
        boxShadow: "0 8px 18px -6px rgba(12, 10, 20, 0.35)"
      },
      [theme.breakpoints.down("xs")]: {
        padding: "2px 4px",
        fontSize: "0.625rem"
      }
    },
    tgEventText: {
      display: "block",
      fontWeight: 400,
      opacity: 0.85,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    },
    nowLine: {
      position: "absolute",
      left: 0,
      right: 0,
      height: 2,
      zIndex: 3,
      backgroundColor: t.semantic.danger,
      pointerEvents: "none",
      "&::before": {
        content: '""',
        position: "absolute",
        left: -6,
        top: -5,
        width: 12,
        height: 12,
        borderRadius: "50%",
        backgroundColor: t.semantic.danger,
        animation: "$nowPulse 2s ease-in-out infinite"
      }
    },
    "@keyframes nowPulse": {
      "0%, 100%": { transform: "scale(1)" },
      "50%": { transform: "scale(1.35)" }
    },
    body: {
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr) 340px",
      gap: theme.spacing(2),
      alignItems: "start",
      [theme.breakpoints.down("sm")]: { gridTemplateColumns: "minmax(0, 1fr)" }
    },
    card: {
      borderRadius: t.radius.lg,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface,
      overflow: "hidden"
    },
    weekdays: {
      display: "grid",
      gridTemplateColumns: "repeat(7, 1fr)",
      borderBottom: `1px solid ${t.border}`
    },
    weekday: {
      padding: theme.spacing(1, 0),
      textAlign: "center",
      fontSize: "0.6875rem",
      fontWeight: 700,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: theme.palette.text.secondary
    },
    grid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)" },
    day: {
      position: "relative",
      display: "flex",
      flexDirection: "column",
      alignItems: "stretch",
      justifyContent: "flex-start",
      gap: 3,
      minHeight: 128,
      padding: 6,
      borderRight: `1px solid ${t.border}`,
      borderBottom: `1px solid ${t.border}`,
      textAlign: "left",
      transition: "background-color .15s ease",
      "&:nth-child(7n)": { borderRight: "none" },
      "& $chip": { animation: "$popIn .25s ease both" },
      "& $dayNumber": {
        transition: "transform .15s ease, background-color .15s"
      },
      "&:hover $dayNumber": { transform: "scale(1.12)" },
      "&:hover": { backgroundColor: t.surfaceHover },
      [theme.breakpoints.down("xs")]: {
        minHeight: 52,
        alignItems: "center",
        padding: "6px 0",
        borderRight: "none",
        borderBottom: "none"
      }
    },
    outside: { "& $dayNumber": { color: theme.palette.text.disabled } },
    selectedDay: {
      backgroundColor: t.brand.textSoft,
      "&:hover": { backgroundColor: t.brand.textSoft }
    },
    dayNumber: {
      width: 26,
      height: 26,
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "0.8125rem",
      fontWeight: 600,
      color: theme.palette.text.primary
    },
    today: {
      backgroundColor: t.brand.main,
      color: `${t.brand.contrastText} !important`
    },
    chip: {
      display: "flex",
      alignItems: "center",
      gap: 4,
      padding: "2px 6px",
      borderRadius: 6,
      fontSize: "0.6875rem",
      fontWeight: 600,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      transition: "transform .12s ease",
      "&:hover": { transform: "translateX(2px)" }
    },
    more: {
      fontSize: "0.6875rem",
      fontWeight: 600,
      color: theme.palette.text.secondary,
      paddingLeft: 6
    },
    dots: { display: "flex", gap: 3, height: 6 },
    miniDot: { width: 6, height: 6, borderRadius: "50%" },
    panel: {
      position: "sticky",
      top: 0,
      [theme.breakpoints.down("sm")]: { position: "static" }
    },
    panelHead: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: theme.spacing(1),
      padding: theme.spacing(2, 2, 1.5),
      borderBottom: `1px solid ${t.border}`
    },
    panelTitle: {
      fontSize: "1rem",
      fontWeight: 700,
      color: theme.palette.text.primary
    },
    panelSub: { fontSize: "0.8125rem", color: theme.palette.text.secondary },
    events: {
      display: "flex",
      flexDirection: "column",
      gap: theme.spacing(1),
      padding: theme.spacing(1.5),
      maxHeight: "calc(var(--vh, 100vh) - 280px)",
      overflowY: "auto",
      ...theme.scrollbarStyles,
      [theme.breakpoints.down("sm")]: { maxHeight: "none" }
    },
    event: {
      display: "flex",
      gap: theme.spacing(1.25),
      padding: theme.spacing(1.25),
      borderRadius: t.radius.md,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface
    },
    eventTime: {
      flex: "none",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      width: 52,
      paddingTop: 2,
      fontSize: "0.9375rem",
      fontWeight: 700,
      color: theme.palette.text.primary
    },
    eventBody: { flex: 1, minWidth: 0 },
    eventWho: { display: "flex", alignItems: "center", gap: 8, minWidth: 0 },
    eventAvatar: { width: 26, height: 26, fontSize: 11, color: "#FFFFFF" },
    eventName: {
      flex: 1,
      minWidth: 0,
      fontSize: "0.875rem",
      fontWeight: 600,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      color: theme.palette.text.primary
    },
    eventText: {
      marginTop: 4,
      fontSize: "0.8125rem",
      color: theme.palette.text.secondary,
      display: "-webkit-box",
      WebkitLineClamp: 2,
      WebkitBoxOrient: "vertical",
      overflow: "hidden",
      whiteSpace: "pre-wrap"
    },
    eventFoot: {
      display: "flex",
      alignItems: "center",
      gap: 4,
      marginTop: 6
    },
    status: {
      display: "inline-flex",
      alignItems: "center",
      height: 22,
      padding: "0 8px",
      borderRadius: t.radius.pill,
      fontSize: "0.6875rem",
      fontWeight: 700
    },
    empty: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: theme.spacing(1),
      padding: theme.spacing(4, 2),
      textAlign: "center",
      color: theme.palette.text.secondary
    },
    emptyIcon: {
      width: 48,
      height: 48,
      borderRadius: t.radius.md,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.brand.textSoft,
      color: t.brand.text
    },
    dayGroupTitle: {
      padding: theme.spacing(1.5, 0.5, 0.5),
      fontSize: "0.75rem",
      fontWeight: 700,
      letterSpacing: "0.04em",
      color: theme.palette.text.secondary
    },
    loading: {
      display: "flex",
      justifyContent: "center",
      padding: theme.spacing(6)
    },
    ...Object.fromEntries(
      Object.entries(tone).map(([k, v]) => [
        `tone_${k}`,
        { backgroundColor: v.bg, color: v.fg }
      ])
    ),
    ...Object.fromEntries(
      Object.entries(tone).map(([k, v]) => [
        `dot_${k}`,
        { backgroundColor: v.fg }
      ])
    )
  };
});

const Schedules = () => {
  const classes = useStyles();
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("xs"));
  const { user } = useContext(AuthContext);
  const socketManager = useContext(SocketContext);
  const locale = i18n.language || "pt-BR";
  const t = key => i18n.t(`schedules.calendar.${key}`);
  // "setembro de 2026" -> "Setembro de 2026" (sem capitalizar o "de")
  const upperFirst = text => text.charAt(0).toUpperCase() + text.slice(1);

  const [month, setMonth] = useState(() => moment().startOf("month"));
  const [selected, setSelected] = useState(() => moment().startOf("day"));
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState("month");
  const [modal, setModal] = useState({ open: false });
  const [deleting, setDeleting] = useState(null);
  const [contactId, setContactId] = useState(+getUrlParam("contactId") || "");

  // primeira e última célula visíveis (semanas completas)
  const range = useMemo(() => {
    if (view === "week") {
      return {
        start: selected.clone().startOf("week"),
        end: selected.clone().endOf("week")
      };
    }
    if (view === "day") {
      return {
        start: selected.clone().startOf("day"),
        end: selected.clone().endOf("day")
      };
    }
    const start = month.clone().startOf("month").startOf("week");
    const end = month.clone().endOf("month").endOf("week");
    return { start, end };
  }, [month, selected, view]);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/schedules/", {
        params: {
          searchParam: search,
          startDate: range.start.toISOString(),
          endDate: range.end.toISOString()
        }
      });
      setSchedules(data.schedules || []);
    } catch (err) {
      toastError(err);
    }
    setLoading(false);
  }, [search, range]);

  useEffect(() => {
    const timer = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  // aberto a partir de um contato (?contactId=): já abre o formulário
  useEffect(() => {
    if (contactId) setModal({ open: true });
  }, [contactId]);

  useEffect(() => {
    const socket = socketManager.GetSocket(user.companyId);
    const onSchedule = () => load();
    socket.on(`company-${user.companyId}-schedule`, onSchedule);
    return () => socket.disconnect();
  }, [socketManager, user.companyId, load]);

  const visible = useMemo(
    () =>
      schedules.filter(s => filter === "all" || statusOf(s.status) === filter),
    [schedules, filter]
  );

  const byDay = useMemo(() => {
    const map = {};
    visible.forEach(s => {
      const key = moment(s.sendAt).format("YYYY-MM-DD");
      (map[key] = map[key] || []).push(s);
    });
    Object.values(map).forEach(list =>
      list.sort((a, b) => new Date(a.sendAt) - new Date(b.sendAt))
    );
    return map;
  }, [visible]);

  const counts = useMemo(() => {
    const inMonth = schedules.filter(s =>
      moment(s.sendAt).isSame(month, "month")
    );
    return {
      all: inMonth.length,
      pending: inMonth.filter(s => statusOf(s.status) === "pending").length,
      sent: inMonth.filter(s => statusOf(s.status) === "sent").length,
      error: inMonth.filter(s => statusOf(s.status) === "error").length
    };
  }, [schedules, month]);

  const days = useMemo(() => {
    const list = [];
    const monthStart = month.clone().startOf("month").startOf("week");
    const monthEnd = month.clone().endOf("month").endOf("week");
    const cursor = monthStart.clone();
    const range = { end: monthEnd };
    while (cursor.isSameOrBefore(range.end, "day")) {
      list.push(cursor.clone());
      cursor.add(1, "day");
    }
    return list;
  }, [month]);

  const weekdayNames = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, {
      weekday: isPhone ? "narrow" : "short"
    });
    return days.slice(0, 7).map(d => fmt.format(d.toDate()).replace(".", ""));
  }, [days, locale, isPhone]);

  const monthName = upperFirst(
    new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(
      month.toDate()
    )
  );
  const dayTitle = upperFirst(
    new Intl.DateTimeFormat(locale, {
      weekday: "long",
      day: "numeric",
      month: "long"
    }).format(selected.toDate())
  );

  // anterior/próximo conforme a visão: mês, semana ou dia
  const goStep = delta => {
    if (view === "week" || view === "day") {
      const next = selected
        .clone()
        .add(delta, view === "week" ? "week" : "day");
      setSelected(next.startOf("day"));
      setMonth(next.clone().startOf("month"));
      return;
    }
    goMonth(delta);
  };

  const openDay = day => {
    pickDay(day);
    setView("day");
  };

  const goMonth = delta => {
    const next = month.clone().add(delta, "month");
    setMonth(next);
    setSelected(
      next.isSame(moment(), "month") ? moment().startOf("day") : next.clone()
    );
  };

  const goToday = () => {
    setMonth(moment().startOf("month"));
    setSelected(moment().startOf("day"));
  };

  const pickDay = day => {
    setSelected(day.clone().startOf("day"));
    if (!day.isSame(month, "month")) setMonth(day.clone().startOf("month"));
  };

  const newOnDay = (day, hour, minute = 0) => {
    const base = day.clone();
    const now = moment();
    const suggested =
      hour !== undefined
        ? base.clone().hour(hour).minute(minute)
        : base.isSame(now, "day")
          ? now.clone().add(1, "hour").startOf("hour")
          : base.clone().hour(9).minute(0);
    setModal({
      open: true,
      defaultSendAt: suggested.format("YYYY-MM-DDTHH:mm")
    });
  };

  const remove = async schedule => {
    try {
      await api.delete(`/schedules/${schedule.id}`);
      toast.success(i18n.t("schedules.toasts.deleted"));
      load();
    } catch (err) {
      toastError(err);
    }
    setDeleting(null);
  };

  const statusChip = s => {
    const kind = statusOf(s.status);
    return (
      <span className={`${classes.status} ${classes[`tone_${kind}`]}`}>
        {t(kind)}
      </span>
    );
  };

  const EventCard = ({ s }) => (
    <div className={classes.event}>
      <div className={classes.eventTime}>
        {moment(s.sendAt).format("HH:mm")}
      </div>
      <div className={classes.eventBody}>
        <div className={classes.eventWho}>
          <Avatar
            className={classes.eventAvatar}
            src={s.contact?.profilePicUrl || undefined}
            style={{ backgroundColor: generateColor(s.contact?.number) }}
          >
            {getInitials(s.contact?.name || "")}
          </Avatar>
          <span className={classes.eventName}>{s.contact?.name || "—"}</span>
        </div>
        <div className={classes.eventText}>{s.body}</div>
        <div className={classes.eventFoot}>
          {statusChip(s)}
          <span style={{ flex: 1 }} />
          <Tooltip title={i18n.t("common.edit")}>
            <IconButton
              size="small"
              onClick={() => setModal({ open: true, scheduleId: s.id })}
            >
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={i18n.t("common.delete")}>
            <IconButton size="small" onClick={() => setDeleting(s)}>
              <DeleteOutlineRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </div>
      </div>
    </div>
  );

  const Empty = ({ text, day }) => (
    <div className={classes.empty}>
      <span className={classes.emptyIcon}>
        <EventRoundedIcon />
      </span>
      <Typography style={{ fontSize: "0.875rem" }}>{text}</Typography>
      {day && (
        <Button
          size="small"
          color="primary"
          startIcon={<AddRoundedIcon />}
          onClick={() => newOnDay(day)}
        >
          {t("scheduleThisDay")}
        </Button>
      )}
    </div>
  );

  const selectedEvents = byDay[selected.format("YYYY-MM-DD")] || [];

  const monthView = (
    <div className={classes.card}>
      <div className={classes.weekdays}>
        {weekdayNames.map((name, i) => (
          <div key={i} className={classes.weekday}>
            {name}
          </div>
        ))}
      </div>
      <div className={classes.grid}>
        {days.map(day => {
          const key = day.format("YYYY-MM-DD");
          const events = byDay[key] || [];
          const isSel = day.isSame(selected, "day");
          const isToday = day.isSame(moment(), "day");
          const max = 2;
          return (
            <ButtonBase
              key={key}
              component="div"
              className={[
                classes.day,
                !day.isSame(month, "month") ? classes.outside : "",
                isSel ? classes.selectedDay : ""
              ].join(" ")}
              onClick={() => pickDay(day)}
              onDoubleClick={() => newOnDay(day)}
              aria-label={`${day.format("L")}: ${events.length}`}
            >
              <span
                className={`${classes.dayNumber}${isToday ? ` ${classes.today}` : ""}`}
                onClick={e => {
                  e.stopPropagation();
                  openDay(day);
                }}
                role="button"
              >
                {day.date()}
              </span>
              {isPhone ? (
                <span className={classes.dots}>
                  {events.slice(0, 3).map(s => (
                    <span
                      key={s.id}
                      className={`${classes.miniDot} ${classes[`dot_${statusOf(s.status)}`]}`}
                    />
                  ))}
                </span>
              ) : (
                <>
                  {events.slice(0, max).map(s => (
                    <span
                      key={s.id}
                      className={`${classes.chip} ${classes[`tone_${statusOf(s.status)}`]}`}
                      title={`${moment(s.sendAt).format("HH:mm")} · ${s.contact?.name || ""}`}
                    >
                      {moment(s.sendAt).format("HH:mm")} {s.contact?.name}
                    </span>
                  ))}
                  {events.length > max && (
                    <span className={classes.more}>
                      +{events.length - max} {t("more")}
                    </span>
                  )}
                </>
              )}
            </ButtonBase>
          );
        })}
      </div>
    </div>
  );

  const dayPanel = (
    <div className={`${classes.card} ${classes.panel}`}>
      <div className={classes.panelHead}>
        <div>
          <Typography className={classes.panelTitle}>{dayTitle}</Typography>
          <Typography className={classes.panelSub}>
            {selectedEvents.length
              ? i18n.t("schedules.calendar.count", {
                  count: selectedEvents.length
                })
              : t("noEventsDay")}
          </Typography>
        </div>
        <Tooltip title={t("scheduleThisDay")}>
          <IconButton color="primary" onClick={() => newOnDay(selected)}>
            <AddRoundedIcon />
          </IconButton>
        </Tooltip>
      </div>
      <div className={classes.events}>
        {selectedEvents.length ? (
          selectedEvents.map(s => <EventCard key={s.id} s={s} />)
        ) : (
          <Empty text={t("noEventsDay")} day={selected} />
        )}
      </div>
    </div>
  );

  const monthDays = Object.keys(byDay)
    .filter(key => moment(key).isSame(month, "month"))
    .sort();

  const listView = (
    <div className={classes.card} style={{ padding: 12 }}>
      {monthDays.length === 0 ? (
        <Empty text={t("noEvents")} />
      ) : (
        monthDays.map(key => (
          <div key={key}>
            <div className={classes.dayGroupTitle}>
              {new Intl.DateTimeFormat(locale, {
                weekday: "long",
                day: "numeric",
                month: "long"
              }).format(moment(key).toDate())}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {byDay[key].map(s => (
                <EventCard key={s.id} s={s} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );

  const HOUR_H = 52;
  const gridRef = React.useRef(null);
  // abre a grade perto do horário comercial (ou da hora atual)
  useEffect(() => {
    if (view !== "week" && view !== "day") return;
    const el = gridRef.current;
    if (!el) return;
    const hour = Math.max(0, Math.min(moment().hour(), 16) - 1);
    el.scrollTop = Math.max(0, (hour < 7 ? 7 : hour) * HOUR_H);
  }, [view, loading]);

  const renderTimeGrid = list => {
    const cols = `${isPhone ? 36 : 56}px repeat(${list.length}, minmax(0, 1fr))`;
    const now = moment();
    const dayFmt = new Intl.DateTimeFormat(locale, {
      weekday: isPhone && list.length > 1 ? "narrow" : "short"
    });
    return (
      <div className={classes.tg}>
        <div className={classes.tgHead} style={{ gridTemplateColumns: cols }}>
          <span />
          {list.map(day => {
            const isToday = day.isSame(now, "day");
            return (
              <div
                key={day.format("YYYY-MM-DD")}
                className={classes.tgHeadDay}
                onClick={() => openDay(day)}
                role="button"
              >
                <span className={classes.tgHeadName}>
                  {dayFmt.format(day.toDate()).replace(".", "")}
                </span>
                <span
                  className={`${classes.tgHeadNum}${isToday ? ` ${classes.today}` : ""}`}
                >
                  {day.date()}
                </span>
              </div>
            );
          })}
        </div>
        <div className={classes.tgScroll} ref={gridRef}>
          <div className={classes.tgBody} style={{ gridTemplateColumns: cols }}>
            <div className={classes.tgHours}>
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} className={classes.tgHour}>
                  {h > 0 && <span>{String(h).padStart(2, "0")}:00</span>}
                </div>
              ))}
            </div>
            {list.map(day => {
              const key = day.format("YYYY-MM-DD");
              const events = byDay[key] || [];
              const isToday = day.isSame(now, "day");
              return (
                <div
                  key={key}
                  className={`${classes.tgCol}${isToday ? ` ${classes.tgColToday}` : ""}`}
                >
                  {Array.from({ length: 48 }, (_, i) => (
                    <div
                      key={i}
                      className={classes.tgSlot}
                      onClick={() =>
                        newOnDay(day, Math.floor(i / 2), i % 2 ? 30 : 0)
                      }
                    />
                  ))}
                  {events.map((s, index) => {
                    const at = moment(s.sendAt);
                    const top = (at.hours() + at.minutes() / 60) * HOUR_H;
                    return (
                      <div
                        key={s.id}
                        className={`${classes.tgEvent} ${classes[`tone_${statusOf(s.status)}`]}`}
                        style={{
                          top,
                          height: HOUR_H * 0.85,
                          animationDelay: `${index * 40}ms`
                        }}
                        title={`${at.format("HH:mm")} · ${s.contact?.name || ""}`}
                        onClick={e => {
                          e.stopPropagation();
                          setModal({ open: true, scheduleId: s.id });
                        }}
                      >
                        {at.format("HH:mm")} {s.contact?.name}
                        {(view === "day" || !isPhone) && s.body && (
                          <span className={classes.tgEventText}>{s.body}</span>
                        )}
                      </div>
                    );
                  })}
                  {isToday && (
                    <div
                      className={classes.nowLine}
                      style={{
                        top: (now.hours() + now.minutes() / 60) * HOUR_H
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const weekDays = Array.from({ length: 7 }, (_, i) =>
    selected.clone().startOf("week").add(i, "day")
  );
  const rangeLabel =
    view === "week"
      ? upperFirst(
          `${new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(weekDays[0].toDate())} – ${new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(weekDays[6].toDate())}`
        )
      : view === "day"
        ? dayTitle
        : monthName;

  const viewButton = (key, label) => (
    <ButtonBase
      key={key}
      className={`${classes.viewBtn}${view === key ? ` ${classes.viewBtnOn}` : ""}`}
      onClick={() => setView(key)}
    >
      {label}
    </ButtonBase>
  );

  const filterButton = (key, label) => (
    <ButtonBase
      key={key}
      className={`${classes.filter}${filter === key ? ` ${classes.filterOn}` : ""}`}
      onClick={() => setFilter(key)}
    >
      {key !== "all" && (
        <span className={`${classes.dot} ${classes[`dot_${key}`]}`} />
      )}
      {label} · {counts[key]}
    </ButtonBase>
  );

  return (
    <MainContainer>
      <ConfirmationModal
        title={i18n.t("schedules.confirmationModal.deleteTitle")}
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => remove(deleting)}
      >
        {i18n.t("schedules.confirmationModal.deleteMessage")}
      </ConfirmationModal>
      <ScheduleModal
        open={modal.open}
        onClose={() => {
          setModal({ open: false });
          setContactId("");
        }}
        reload={load}
        scheduleId={modal.scheduleId}
        contactId={contactId}
        cleanContact={() => setContactId("")}
        defaultSendAt={modal.defaultSendAt}
      />

      <div className={classes.page}>
        <div className={classes.head}>
          <div>
            <Typography component="h1" className={classes.title}>
              {i18n.t("schedules.title")}
            </Typography>
            <Typography className={classes.subtitle}>
              {t("subtitle")}
            </Typography>
          </div>
          <div className={classes.headActions}>
            <TextField
              className={classes.search}
              variant="outlined"
              size="small"
              placeholder={i18n.t("contacts.searchPlaceholder")}
              value={search}
              onChange={e => setSearch(e.target.value)}
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
              onClick={() => newOnDay(selected)}
            >
              {i18n.t("schedules.buttons.add")}
            </Button>
          </div>
        </div>

        <div className={classes.toolbar}>
          <div className={classes.monthNav}>
            <IconButton
              className={classes.navBtn}
              onClick={() => goStep(-1)}
              aria-label={t("previous")}
            >
              <ChevronLeftRoundedIcon />
            </IconButton>
            <IconButton
              className={classes.navBtn}
              onClick={() => goStep(1)}
              aria-label={t("next")}
            >
              <ChevronRightRoundedIcon />
            </IconButton>
          </div>
          <Typography className={classes.monthLabel}>{rangeLabel}</Typography>
          <Button size="small" variant="outlined" onClick={goToday}>
            {t("today")}
          </Button>
          <div className={classes.views} role="tablist">
            {viewButton("month", t("month"))}
            {viewButton("week", i18n.t("schedules.calendar.week", "Semana"))}
            {viewButton("day", i18n.t("schedules.calendar.day", "Dia"))}
            {viewButton("list", t("list"))}
          </div>
          <div className={classes.filters}>
            {filterButton("all", t("all"))}
            {filterButton("pending", t("pending"))}
            {filterButton("sent", t("sent"))}
            {filterButton("error", t("error"))}
          </div>
        </div>

        {loading ? (
          <div className={classes.loading}>
            <BoxLoader />
          </div>
        ) : (
          <div key={view} className={classes.viewEnter}>
            {view === "list" ? (
              listView
            ) : view === "week" ? (
              renderTimeGrid(weekDays)
            ) : view === "day" ? (
              <div className={classes.body}>
                {renderTimeGrid([selected])}
                {dayPanel}
              </div>
            ) : (
              <div className={classes.body}>
                {monthView}
                {dayPanel}
              </div>
            )}
          </div>
        )}
      </div>
    </MainContainer>
  );
};

export default Schedules;
