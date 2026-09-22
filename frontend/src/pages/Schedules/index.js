import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import moment from "moment";
import clsx from "clsx";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import Button from "@material-ui/core/Button";
import ButtonBase from "@material-ui/core/ButtonBase";
import IconButton from "@material-ui/core/IconButton";
import InputBase from "@material-ui/core/InputBase";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import Checkbox from "@material-ui/core/Checkbox";
import Popover from "@material-ui/core/Popover";
import Fab from "@material-ui/core/Fab";
import Tooltip from "@material-ui/core/Tooltip";
import AddRoundedIcon from "@material-ui/icons/AddRounded";
import ArrowDropDownRoundedIcon from "@material-ui/icons/ArrowDropDownRounded";
import ChevronLeftRoundedIcon from "@material-ui/icons/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@material-ui/icons/ChevronRightRounded";
import MenuRoundedIcon from "@material-ui/icons/MenuRounded";
import SearchRoundedIcon from "@material-ui/icons/SearchRounded";
import CloseRoundedIcon from "@material-ui/icons/CloseRounded";
import TodayRoundedIcon from "@material-ui/icons/TodayRounded";
import EventRoundedIcon from "@material-ui/icons/EventRounded";
import CallRoundedIcon from "@material-ui/icons/CallRounded";
import AlarmRoundedIcon from "@material-ui/icons/AlarmRounded";
import ScheduleRoundedIcon from "@material-ui/icons/ScheduleRounded";

import MainContainer from "../../components/MainContainer";
import ScheduleModal from "../../components/ScheduleModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { SocketContext } from "../../context/Socket/SocketContext";
import { AuthContext } from "../../context/Auth/AuthContext";
import MiniMonth from "./MiniMonth";
import MonthView from "./MonthView";
import TimeGridView from "./TimeGridView";
import ListView from "./ListView";
import EventDialog from "./EventDialog";
import EventPopover from "./EventPopover";
import {
  ALL_LAYERS,
  HOLIDAY_LAYER,
  LAYERS,
  brazilHolidays,
  dayKey,
  fromEvent,
  fromSchedule,
  upperFirst
} from "./calendarShared";

/**
 * Agenda, no desenho do Google Agenda (que um dia vai sincronizar com ela).
 *
 * Não é só mensagem agendada: eventos, ligações do chat interno e
 * lembretes entram no mesmo calendário, cada um com sua cor e sua camada
 * para ligar/desligar na lateral — como "Minhas agendas" no Google. Os
 * feriados nacionais aparecem como uma agenda à parte.
 *
 * Computador: lateral (Criar, mês pequeno, agendas) + mês/semana/dia/lista.
 * Celular: lista por padrão, trocas de visão no topo e botão de criar.
 */
const VIEWS = [
  { id: "day", label: "Dia", key: "d" },
  { id: "week", label: "Semana", key: "w" },
  { id: "month", label: "Mês", key: "m" },
  { id: "list", label: "Lista", key: "a" }
];
const LAYERS_KEY = "tkv:calendar:layers";
const VIEW_KEY = "tkv:calendar:view";

const getUrlParam = param =>
  new URLSearchParams(window.location.search).get(param);

const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    page: { overflow: "hidden" },
    root: {
      flex: 1,
      minHeight: 0,
      display: "flex",
      gap: theme.spacing(2),
      [theme.breakpoints.down("xs")]: { gap: 0 }
    },
    side: {
      flex: "none",
      width: 248,
      display: "flex",
      flexDirection: "column",
      gap: theme.spacing(2.5),
      overflowY: "auto",
      paddingRight: 4,
      transition: "margin .2s ease, opacity .2s ease",
      ...theme.scrollbarStylesSoft
    },
    sideHidden: { marginLeft: -264, opacity: 0, pointerEvents: "none" },
    create: {
      alignSelf: "flex-start",
      height: 52,
      padding: "0 18px 0 14px",
      gap: 10,
      borderRadius: 16,
      fontSize: "0.9375rem",
      fontWeight: 600,
      color: theme.palette.text.primary,
      backgroundColor: t.surface,
      boxShadow: "0 1px 3px rgba(0,0,0,.18), 0 4px 10px -2px rgba(0,0,0,.12)",
      transition: "box-shadow .15s ease, background-color .15s ease",
      "&:hover": {
        boxShadow: "0 2px 6px rgba(0,0,0,.22), 0 8px 18px -4px rgba(0,0,0,.18)",
        backgroundColor: t.surfaceHover
      },
      "& svg": { fontSize: 26 }
    },
    group: { display: "flex", flexDirection: "column" },
    groupTitle: {
      padding: "0 8px 6px",
      fontSize: "0.875rem",
      fontWeight: 600,
      color: theme.palette.text.primary
    },
    layer: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      width: "100%",
      padding: "2px 8px 2px 2px",
      borderRadius: 8,
      fontSize: "0.875rem",
      color: theme.palette.text.primary,
      justifyContent: "flex-start",
      "&:hover": { backgroundColor: t.surfaceHover },
      "& .MuiCheckbox-root": { padding: 6 }
    },
    main: {
      flex: 1,
      minWidth: 0,
      display: "flex",
      flexDirection: "column",
      gap: 12
    },
    bar: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      minHeight: 48,
      [theme.breakpoints.down("xs")]: { gap: 4, minHeight: 44 }
    },
    today: {
      height: 36,
      padding: "0 16px",
      borderRadius: t.radius.pill,
      border: `1px solid ${t.borderStrong || t.border}`,
      textTransform: "none",
      fontWeight: 600
    },
    heading: {
      margin: "0 8px",
      fontSize: "1.375rem",
      fontWeight: 500,
      color: theme.palette.text.primary,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      [theme.breakpoints.down("xs")]: {
        margin: 0,
        fontSize: "1.125rem",
        fontWeight: 700,
        display: "inline-flex",
        alignItems: "center"
      }
    },
    grow: { flex: 1 },
    search: {
      height: 36,
      width: 240,
      padding: "0 10px",
      borderRadius: t.radius.pill,
      backgroundColor: t.surfaceSunken,
      fontSize: "0.875rem",
      [theme.breakpoints.down("xs")]: { width: "100%" }
    },
    viewButton: {
      height: 36,
      padding: "0 8px 0 16px",
      borderRadius: t.radius.pill,
      border: `1px solid ${t.borderStrong || t.border}`,
      textTransform: "none",
      fontWeight: 600
    },
    mobileViews: {
      display: "flex",
      gap: 6,
      padding: "0 0 8px",
      overflowX: "auto"
    },
    mobileView: {
      height: 30,
      padding: "0 14px",
      borderRadius: t.radius.pill,
      border: `1px solid ${t.border}`,
      fontSize: "0.8125rem",
      fontWeight: 600,
      color: theme.palette.text.secondary,
      whiteSpace: "nowrap"
    },
    mobileViewOn: {
      color: t.brand.text,
      backgroundColor: t.brand.textSoft,
      borderColor: t.brand.textBorder
    },
    fab: {
      position: "fixed",
      right: 16,
      bottom: "calc(var(--mobile-nav-space, 0px) + 16px)",
      zIndex: theme.zIndex.appBar,
      borderRadius: 16,
      width: 56,
      height: 56
    },
    miniPopover: { padding: 12, width: 280 }
  };
});

const rangeOf = (view, cursor) => {
  if (view === "day")
    return [cursor.clone().startOf("day"), cursor.clone().endOf("day")];
  if (view === "week")
    return [cursor.clone().startOf("isoWeek"), cursor.clone().endOf("isoWeek")];
  if (view === "list")
    return [
      cursor.clone().startOf("day"),
      cursor.clone().add(45, "days").endOf("day")
    ];
  return [
    cursor.clone().startOf("month").startOf("isoWeek"),
    cursor.clone().endOf("month").endOf("isoWeek")
  ];
};

const readLayers = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(LAYERS_KEY) || "null");
    if (Array.isArray(saved)) return new Set(saved);
  } catch (err) {
    // sem armazenamento: todas ligadas
  }
  return new Set(ALL_LAYERS.map(layer => layer.id));
};

const Schedules = () => {
  const classes = useStyles();
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("xs"));
  const { user } = useContext(AuthContext);
  const socketManager = useContext(SocketContext);

  const [view, setView] = useState(() => {
    try {
      return localStorage.getItem(VIEW_KEY) || (isPhone ? "list" : "month");
    } catch (err) {
      return isPhone ? "list" : "month";
    }
  });
  const [cursor, setCursor] = useState(() => moment().startOf("day"));
  const [layers, setLayers] = useState(readLayers);
  const [events, setEvents] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [users, setUsers] = useState([]);
  const [sideOpen, setSideOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [createAnchor, setCreateAnchor] = useState(null);
  const [viewAnchor, setViewAnchor] = useState(null);
  const [miniAnchor, setMiniAnchor] = useState(null);
  const [dialog, setDialog] = useState({ open: false });
  const [scheduleModal, setScheduleModal] = useState({ open: false });
  const [contactId, setContactId] = useState(+getUrlParam("contactId") || "");
  const [popover, setPopover] = useState({ item: null, anchor: null });
  const [deleting, setDeleting] = useState(null);

  const [rangeStart, rangeEnd] = useMemo(
    () => rangeOf(view, cursor),
    [view, cursor]
  );

  const load = useCallback(async () => {
    const params = {
      start: rangeStart.toISOString(),
      end: rangeEnd.toISOString()
    };
    try {
      const [calendar, messages] = await Promise.all([
        api.get("/calendar/events", { params }),
        api.get("/schedules/", {
          params: { startDate: params.start, endDate: params.end }
        })
      ]);
      setEvents(calendar.data || []);
      setSchedules(messages.data?.schedules || []);
    } catch (err) {
      toastError(err);
    }
  }, [rangeStart, rangeEnd]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    api
      .get("/users/list")
      .then(({ data }) => setUsers(data || []))
      .catch(() => {});
  }, []);

  // aberta a partir de um contato (?contactId=): já abre o agendamento
  useEffect(() => {
    if (contactId) setScheduleModal({ open: true });
  }, [contactId]);

  // mudanças de qualquer pessoa chegam na hora
  useEffect(() => {
    const socket = socketManager.GetSocket(user.companyId);
    const reload = () => load();
    socket.on(`company-${user.companyId}-calendar`, reload);
    socket.on(`company-${user.companyId}-schedule`, reload);
    return () => socket.disconnect();
  }, [socketManager, user.companyId, load]);

  useEffect(() => {
    try {
      localStorage.setItem(LAYERS_KEY, JSON.stringify([...layers]));
      localStorage.setItem(VIEW_KEY, view);
    } catch (err) {
      // sem armazenamento: vale só nesta visita
    }
  }, [layers, view]);

  const items = useMemo(() => {
    const years = new Set([rangeStart.year(), rangeEnd.year()]);
    const all = [
      ...events.map(fromEvent),
      ...schedules.map(fromSchedule),
      ...[...years].flatMap(year => brazilHolidays(year))
    ].filter(item => layers.has(item.kind));
    const q = search.trim().toLowerCase();
    return q
      ? all.filter(item =>
          `${item.title} ${item.raw?.body || ""} ${item.raw?.description || ""}`
            .toLowerCase()
            .includes(q)
        )
      : all;
  }, [events, schedules, layers, search, rangeStart, rangeEnd]);

  const busyDays = useMemo(
    () =>
      new Set(
        items.filter(i => i.kind !== "holiday").map(i => dayKey(i.start))
      ),
    [items]
  );

  const step = direction => {
    const unit = { day: "day", week: "week", month: "month", list: "month" }[
      view
    ];
    setCursor(c => c.clone().add(direction, unit));
  };

  const heading = useMemo(() => {
    if (view === "day")
      return upperFirst(cursor.format("D [de] MMMM [de] YYYY"));
    if (view === "week") {
      const a = cursor.clone().startOf("isoWeek");
      const b = cursor.clone().endOf("isoWeek");
      return a.month() === b.month()
        ? `${a.format("D")} – ${b.format("D [de] MMM [de] YYYY")}`
        : `${a.format("D [de] MMM")} – ${b.format("D [de] MMM [de] YYYY")}`;
    }
    return upperFirst(cursor.format(isPhone ? "MMMM YYYY" : "MMMM [de] YYYY"));
  }, [view, cursor, isPhone]);

  const openCreate = (type, start) => {
    setCreateAnchor(null);
    if (type === "message") {
      setScheduleModal({
        open: true,
        defaultSendAt: (
          start || moment().add(1, "hour").startOf("hour")
        ).format("YYYY-MM-DDTHH:mm")
      });
      return;
    }
    setDialog({ open: true, preset: { type, start } });
  };

  const onEdit = item => {
    setPopover({ item: null, anchor: null });
    if (item.kind === "message") {
      setScheduleModal({ open: true, scheduleId: item.raw.id });
    } else {
      setDialog({ open: true, editing: item.raw });
    }
  };

  const confirmDelete = async () => {
    const item = deleting;
    setDeleting(null);
    try {
      if (item.kind === "message")
        await api.delete(`/schedules/${item.raw.id}`);
      else await api.delete(`/calendar/events/${item.raw.id}`);
      load();
    } catch (err) {
      toastError(err);
    }
  };

  // atalhos do Google Agenda: T hoje, D/W/M/A trocam a visão, setas
  useEffect(() => {
    const onKey = e => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (
        e.target.closest?.(
          "input, textarea, [contenteditable='true'], [role=dialog]"
        )
      )
        return;
      const key = e.key.toLowerCase();
      if (key === "t") setCursor(moment().startOf("day"));
      else if (key === "j" || e.key === "ArrowRight") step(1);
      else if (key === "k" || e.key === "ArrowLeft") step(-1);
      else {
        const found = VIEWS.find(v => v.key === key);
        if (found) setView(found.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const createMenu = (
    <Menu
      anchorEl={createAnchor}
      open={!!createAnchor}
      onClose={() => setCreateAnchor(null)}
      getContentAnchorEl={null}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
    >
      <MenuItem onClick={() => openCreate("event")}>
        <ListItemIcon>
          <EventRoundedIcon fontSize="small" />
        </ListItemIcon>
        Evento
      </MenuItem>
      <MenuItem onClick={() => openCreate("call")}>
        <ListItemIcon>
          <CallRoundedIcon fontSize="small" />
        </ListItemIcon>
        Ligação no chat interno
      </MenuItem>
      <MenuItem onClick={() => openCreate("reminder")}>
        <ListItemIcon>
          <AlarmRoundedIcon fontSize="small" />
        </ListItemIcon>
        Lembrete
      </MenuItem>
      <MenuItem onClick={() => openCreate("message")}>
        <ListItemIcon>
          <ScheduleRoundedIcon fontSize="small" />
        </ListItemIcon>
        Mensagem agendada
      </MenuItem>
    </Menu>
  );

  const layerRow = layer => (
    <ButtonBase
      key={layer.id}
      className={classes.layer}
      onClick={() =>
        setLayers(prev => {
          const next = new Set(prev);
          if (next.has(layer.id)) next.delete(layer.id);
          else next.add(layer.id);
          return next;
        })
      }
    >
      <Checkbox
        size="small"
        checked={layers.has(layer.id)}
        style={{ color: layer.color }}
        tabIndex={-1}
      />
      {layer.label}
    </ButtonBase>
  );

  const sidebar = (
    <aside className={clsx(classes.side, !sideOpen && classes.sideHidden)}>
      <ButtonBase
        className={classes.create}
        onClick={e => setCreateAnchor(e.currentTarget)}
      >
        <AddRoundedIcon />
        Criar
        <ArrowDropDownRoundedIcon style={{ fontSize: 20 }} />
      </ButtonBase>
      <MiniMonth value={cursor} onChange={setCursor} busyDays={busyDays} />
      <div className={classes.group}>
        <span className={classes.groupTitle}>Minhas agendas</span>
        {LAYERS.map(layerRow)}
      </div>
      <div className={classes.group}>
        <span className={classes.groupTitle}>Outras agendas</span>
        {layerRow(HOLIDAY_LAYER)}
      </div>
    </aside>
  );

  const days =
    view === "week"
      ? Array.from({ length: 7 }, (_, i) =>
          cursor.clone().startOf("isoWeek").add(i, "day")
        )
      : [cursor.clone().startOf("day")];

  return (
    <MainContainer className={classes.page}>
      <div className={classes.root}>
        {!isPhone && sidebar}
        <section className={classes.main}>
          <div className={classes.bar}>
            {!isPhone && (
              <IconButton
                onClick={() => setSideOpen(o => !o)}
                aria-label="Menu da agenda"
              >
                <MenuRoundedIcon />
              </IconButton>
            )}
            {searchOpen ? (
              <InputBase
                autoFocus
                className={classes.search}
                placeholder="Pesquisar na agenda"
                value={search}
                onChange={e => setSearch(e.target.value)}
                startAdornment={
                  <SearchRoundedIcon
                    fontSize="small"
                    style={{ marginRight: 6 }}
                  />
                }
                endAdornment={
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSearch("");
                      setSearchOpen(false);
                    }}
                  >
                    <CloseRoundedIcon fontSize="small" />
                  </IconButton>
                }
              />
            ) : (
              <>
                {isPhone ? (
                  <Tooltip title="Hoje">
                    <IconButton
                      onClick={() => setCursor(moment().startOf("day"))}
                    >
                      <TodayRoundedIcon />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Button
                    className={classes.today}
                    onClick={() => setCursor(moment().startOf("day"))}
                  >
                    Hoje
                  </Button>
                )}
                <IconButton
                  size={isPhone ? "small" : "medium"}
                  onClick={() => step(-1)}
                  aria-label="Anterior"
                >
                  <ChevronLeftRoundedIcon />
                </IconButton>
                <IconButton
                  size={isPhone ? "small" : "medium"}
                  onClick={() => step(1)}
                  aria-label="Próximo"
                >
                  <ChevronRightRoundedIcon />
                </IconButton>
                {isPhone ? (
                  <ButtonBase
                    className={classes.heading}
                    onClick={e => setMiniAnchor(e.currentTarget)}
                  >
                    {heading}
                    <ArrowDropDownRoundedIcon />
                  </ButtonBase>
                ) : (
                  <span className={classes.heading}>{heading}</span>
                )}
                <span className={classes.grow} />
                <IconButton
                  onClick={() => setSearchOpen(true)}
                  aria-label="Pesquisar"
                >
                  <SearchRoundedIcon />
                </IconButton>
                {!isPhone && (
                  <Button
                    className={classes.viewButton}
                    endIcon={<ArrowDropDownRoundedIcon />}
                    onClick={e => setViewAnchor(e.currentTarget)}
                  >
                    {VIEWS.find(v => v.id === view)?.label}
                  </Button>
                )}
              </>
            )}
          </div>

          {isPhone && (
            <div className={classes.mobileViews}>
              {["list", "day", "week", "month"].map(id => (
                <ButtonBase
                  key={id}
                  className={clsx(
                    classes.mobileView,
                    view === id && classes.mobileViewOn
                  )}
                  onClick={() => setView(id)}
                >
                  {VIEWS.find(v => v.id === id).label}
                </ButtonBase>
              ))}
            </div>
          )}

          {view === "month" && (
            <MonthView
              cursor={cursor}
              items={items}
              isPhone={isPhone}
              onCreate={start => openCreate("event", start)}
              onOpen={(item, anchor) => setPopover({ item, anchor })}
              onMore={day => {
                setCursor(day);
                setView("day");
              }}
            />
          )}
          {(view === "week" || view === "day") && (
            <TimeGridView
              days={days}
              items={items}
              isPhone={isPhone}
              onCreate={start => openCreate("event", start)}
              onOpen={(item, anchor) => setPopover({ item, anchor })}
            />
          )}
          {view === "list" && (
            <ListView
              start={rangeStart}
              end={rangeEnd}
              items={items}
              onOpen={(item, anchor) => setPopover({ item, anchor })}
            />
          )}
        </section>
      </div>

      {isPhone && (
        <Fab
          color="primary"
          className={classes.fab}
          onClick={e => setCreateAnchor(e.currentTarget)}
          aria-label="Criar"
        >
          <AddRoundedIcon />
        </Fab>
      )}

      {createMenu}

      <Menu
        anchorEl={viewAnchor}
        open={!!viewAnchor}
        onClose={() => setViewAnchor(null)}
        getContentAnchorEl={null}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {VIEWS.map(v => (
          <MenuItem
            key={v.id}
            selected={view === v.id}
            onClick={() => {
              setView(v.id);
              setViewAnchor(null);
            }}
          >
            <span style={{ flex: 1, minWidth: 120 }}>{v.label}</span>
            <span style={{ opacity: 0.5, fontSize: 12 }}>
              {v.key.toUpperCase()}
            </span>
          </MenuItem>
        ))}
      </Menu>

      <Popover
        open={!!miniAnchor}
        anchorEl={miniAnchor}
        onClose={() => setMiniAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <div className={classes.miniPopover}>
          <MiniMonth
            value={cursor}
            busyDays={busyDays}
            onChange={day => {
              setCursor(day);
              setMiniAnchor(null);
            }}
          />
        </div>
      </Popover>

      <EventPopover
        item={popover.item}
        anchorEl={popover.anchor}
        users={users}
        isPhone={isPhone}
        onClose={() => setPopover({ item: null, anchor: null })}
        onEdit={onEdit}
        onDelete={item => {
          setPopover({ item: null, anchor: null });
          setDeleting(item);
        }}
      />

      <EventDialog
        open={dialog.open}
        preset={dialog.preset}
        editing={dialog.editing}
        onClose={changed => {
          setDialog({ open: false });
          if (changed) load();
        }}
      />

      {scheduleModal.open && (
        <ScheduleModal
          open={scheduleModal.open}
          onClose={() => {
            setScheduleModal({ open: false });
            setContactId("");
          }}
          reload={load}
          scheduleId={scheduleModal.scheduleId}
          contactId={contactId}
          cleanContact={() => setContactId("")}
          defaultSendAt={scheduleModal.defaultSendAt}
        />
      )}

      <ConfirmationModal
        title="Excluir da agenda?"
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
      >
        {deleting ? `"${deleting.title}" será excluído.` : ""}
      </ConfirmationModal>
    </MainContainer>
  );
};

export default Schedules;
