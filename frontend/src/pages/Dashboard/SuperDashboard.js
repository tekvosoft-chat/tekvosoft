import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { toast } from "react-toastify";
import moment from "moment";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis
} from "recharts";

import { makeStyles, useTheme } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";
import Typography from "@material-ui/core/Typography";
import ButtonBase from "@material-ui/core/ButtonBase";
import Button from "@material-ui/core/Button";
import InputBase from "@material-ui/core/InputBase";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import TextField from "@material-ui/core/TextField";
import Collapse from "@material-ui/core/Collapse";
import MemoryRoundedIcon from "@material-ui/icons/MemoryRounded";
import StorageRoundedIcon from "@material-ui/icons/StorageRounded";
import DnsRoundedIcon from "@material-ui/icons/DnsRounded";
import SpeedRoundedIcon from "@material-ui/icons/SpeedRounded";
import BusinessRoundedIcon from "@material-ui/icons/BusinessRounded";
import PeopleAltRoundedIcon from "@material-ui/icons/PeopleAltRounded";
import WhatsAppIcon from "@material-ui/icons/WhatsApp";
import ForumRoundedIcon from "@material-ui/icons/ForumRounded";
import ChatBubbleRoundedIcon from "@material-ui/icons/ChatBubbleRounded";
import FolderRoundedIcon from "@material-ui/icons/FolderRounded";
import SearchRoundedIcon from "@material-ui/icons/SearchRounded";
import ExpandMoreRoundedIcon from "@material-ui/icons/ExpandMoreRounded";
import PersonAddRoundedIcon from "@material-ui/icons/PersonAddRounded";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import BoxLoader from "../../components/ui/BoxLoader";
import PageLoader from "../../components/ui/PageLoader";
import UserAvatar from "../../components/ui/UserAvatar";
import CompaniesManager from "../../components/CompaniesManager";
import Revenue from "./Revenue";
import { i18n } from "../../translate/i18n";

/**
 * Painel do super admin (o dono da plataforma).
 *
 * Três abas: a plataforma ao vivo (servidor e uso de cada cliente), a
 * gestão das empresas (que saiu de Configurações) e o painel da própria
 * empresa. O servidor é consultado a cada 3 s e o uso das empresas a cada
 * 15 s, então os números andam sozinhos na tela.
 */
const SYSTEM_EVERY = 3000;
const OVERVIEW_EVERY = 15000;
const SAMPLES = 40;

const bytes = value => {
  const n = Number(value || 0);
  if (n < 1024) return `${n} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let v = n / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(v >= 100 ? 0 : 1).replace(".", ",")} ${units[i]}`;
};

const duration = seconds => {
  const s = Number(seconds || 0);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}min`;
  return `${m}min`;
};

const pct = (used, total) =>
  total > 0 ? Math.min(100, (used / total) * 100) : 0;

const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  const sem = t.semantic;
  return {
    container: {
      paddingTop: theme.spacing(3),
      paddingBottom: theme.spacing(4),
      display: "flex",
      flexDirection: "column",
      gap: theme.spacing(2.5),
      [theme.breakpoints.down("xs")]: {
        paddingTop: theme.spacing(2),
        paddingLeft: theme.spacing(1.5),
        paddingRight: theme.spacing(1.5)
      }
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
      fontWeight: 800,
      letterSpacing: "-0.02em",
      color: theme.palette.text.primary
    },
    live: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      fontSize: "0.8125rem",
      color: theme.palette.text.secondary
    },
    liveDot: {
      position: "relative",
      width: 8,
      height: 8,
      borderRadius: "50%",
      backgroundColor: sem.success,
      "&::after": {
        content: "''",
        position: "absolute",
        inset: 0,
        borderRadius: "50%",
        backgroundColor: sem.success,
        animation: "$pulse 1.6s ease-out infinite"
      }
    },
    tabs: {
      display: "inline-flex",
      padding: 4,
      gap: 4,
      borderRadius: 999,
      backgroundColor: t.surfaceSunken,
      border: `1px solid ${t.border}`,
      maxWidth: "100%",
      overflowX: "auto"
    },
    tab: {
      height: 36,
      padding: "0 16px",
      borderRadius: 999,
      fontSize: "0.875rem",
      fontWeight: 700,
      whiteSpace: "nowrap",
      color: theme.palette.text.secondary
    },
    tabOn: {
      backgroundColor: t.surface,
      color: t.brand.text,
      boxShadow: theme.shadows[2]
    },
    sectionTitle: {
      fontSize: "1.0625rem",
      fontWeight: 700,
      color: theme.palette.text.primary,
      marginBottom: theme.spacing(1)
    },
    grid4: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: theme.spacing(1.5),
      [theme.breakpoints.down("sm")]: { gridTemplateColumns: "repeat(2, 1fr)" }
    },
    grid6: {
      display: "grid",
      gridTemplateColumns: "repeat(6, 1fr)",
      gap: theme.spacing(1.5),
      [theme.breakpoints.down("md")]: { gridTemplateColumns: "repeat(3, 1fr)" },
      [theme.breakpoints.down("xs")]: { gridTemplateColumns: "repeat(2, 1fr)" }
    },
    card: {
      position: "relative",
      overflow: "hidden",
      padding: theme.spacing(2),
      borderRadius: t.radius.lg,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface,
      animation: "$rise .35s ease both",
      [theme.breakpoints.down("xs")]: { padding: theme.spacing(1.5) }
    },
    cardHead: { display: "flex", alignItems: "center", gap: 10 },
    icon: {
      flex: "none",
      width: 36,
      height: 36,
      borderRadius: 10,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      // cor de apoio por cartão: o painel deixa de ser todo da mesma cor
      backgroundColor: `var(--tile-tone, ${t.brand.main})`,
      color: "#FFFFFF",
      boxShadow: `0 8px 18px -12px var(--tile-tone, ${t.brand.main})`,
      "& svg": { fontSize: 20 }
    },
    label: {
      fontSize: "0.8125rem",
      fontWeight: 600,
      color: theme.palette.text.secondary
    },
    value: {
      marginTop: 10,
      fontSize: "1.625rem",
      fontWeight: 800,
      letterSpacing: "-0.02em",
      color: theme.palette.text.primary,
      fontVariantNumeric: "tabular-nums",
      [theme.breakpoints.down("xs")]: { fontSize: "1.25rem" }
    },
    sub: {
      fontSize: "0.75rem",
      color: theme.palette.text.secondary,
      fontVariantNumeric: "tabular-nums"
    },
    bar: {
      marginTop: 10,
      height: 8,
      borderRadius: 999,
      backgroundColor: t.surfaceSunken,
      overflow: "hidden"
    },
    barFill: {
      height: "100%",
      borderRadius: 999,
      transition: "width .6s ease, background-color .3s ease"
    },
    spark: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: 44,
      opacity: 0.9
    },
    charts: {
      display: "grid",
      gridTemplateColumns: "3fr 2fr",
      gap: theme.spacing(1.5),
      [theme.breakpoints.down("sm")]: { gridTemplateColumns: "1fr" }
    },
    chartHead: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 8
    },
    chips: { display: "flex", gap: 6, flexWrap: "wrap" },
    chip: {
      height: 28,
      padding: "0 10px",
      borderRadius: 999,
      fontSize: "0.75rem",
      fontWeight: 700,
      color: theme.palette.text.secondary,
      border: `1px solid ${t.border}`
    },
    chipOn: {
      color: t.brand.contrastText,
      backgroundColor: t.brand.main,
      borderColor: t.brand.main
    },
    search: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      height: 40,
      minWidth: 240,
      padding: "0 14px",
      borderRadius: 999,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface,
      color: theme.palette.text.secondary,
      [theme.breakpoints.down("xs")]: { minWidth: 0, flex: 1 }
    },
    companies: {
      display: "flex",
      flexDirection: "column",
      gap: theme.spacing(1.25)
    },
    company: {
      borderRadius: t.radius.lg,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface,
      overflow: "hidden",
      animation: "$rise .35s ease both"
    },
    companyRow: {
      width: "100%",
      display: "grid",
      gridTemplateColumns:
        "minmax(200px, 1.4fr) repeat(3, minmax(120px, 1fr)) repeat(3, 90px) 32px",
      alignItems: "center",
      gap: theme.spacing(2),
      padding: theme.spacing(1.75, 2),
      textAlign: "left",
      [theme.breakpoints.down("md")]: {
        gridTemplateColumns: "1fr 1fr",
        gap: theme.spacing(1.25)
      }
    },
    companyName: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      minWidth: 0,
      [theme.breakpoints.down("md")]: { gridColumn: "1 / -1" }
    },
    companyAvatar: {
      flex: "none",
      width: 40,
      height: 40,
      borderRadius: 12,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 800,
      color: t.brand.contrastText,
      background: `linear-gradient(135deg, ${t.brand.main}, ${t.brand.hover})`
    },
    ellipsis: {
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    },
    strong: {
      fontSize: "0.9375rem",
      fontWeight: 700,
      color: theme.palette.text.primary
    },
    status: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "1px 8px",
      borderRadius: 999,
      fontSize: "0.6875rem",
      fontWeight: 700
    },
    statusOn: { backgroundColor: sem.successSoft, color: sem.success },
    statusOff: { backgroundColor: sem.dangerSoft, color: sem.danger },
    usage: { display: "flex", flexDirection: "column", gap: 4, minWidth: 0 },
    usageTop: {
      display: "flex",
      justifyContent: "space-between",
      gap: 6,
      fontSize: "0.75rem",
      color: theme.palette.text.secondary
    },
    mini: {
      height: 6,
      borderRadius: 999,
      backgroundColor: t.surfaceSunken,
      overflow: "hidden"
    },
    stat: {
      textAlign: "right",
      [theme.breakpoints.down("md")]: { textAlign: "left" }
    },
    statValue: {
      fontSize: "1rem",
      fontWeight: 800,
      color: theme.palette.text.primary,
      fontVariantNumeric: "tabular-nums"
    },
    chevron: {
      transition: "transform .2s ease",
      color: theme.palette.text.secondary
    },
    chevronOpen: { transform: "rotate(180deg)" },
    users: {
      borderTop: `1px solid ${t.border}`,
      backgroundColor: t.canvas,
      padding: theme.spacing(1.5, 2, 2)
    },
    usersHead: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      marginBottom: 10
    },
    userGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
      gap: theme.spacing(1)
    },
    user: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: 10,
      borderRadius: t.radius.md,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface
    },
    userOff: { opacity: 0.55 },
    avatarWrap: { position: "relative", flex: "none" },
    onlineDot: {
      position: "absolute",
      right: 0,
      bottom: 0,
      width: 11,
      height: 11,
      borderRadius: "50%",
      border: `2px solid ${t.surface}`
    },
    badge: {
      padding: "0 7px",
      borderRadius: 999,
      fontSize: "0.625rem",
      fontWeight: 800,
      textTransform: "uppercase",
      backgroundColor: t.brand.textSoft,
      color: t.brand.text
    },
    center: { display: "flex", justifyContent: "center", padding: 40 },
    // carregando a visão geral: uma animação só, maior, no meio da tela
    pageLoading: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "calc(var(--vh, 100vh) - 220px)"
    },
    "@keyframes rise": {
      from: { opacity: 0, transform: "translateY(8px)" },
      to: { opacity: 1, transform: "none" }
    },
    "@keyframes pulse": {
      from: { transform: "scale(1)", opacity: 0.6 },
      to: { transform: "scale(3)", opacity: 0 }
    }
  };
});

const toneFor = (theme, value) => {
  const sem = theme.palette.tkv.semantic;
  if (value >= 90) return sem.danger;
  if (value >= 70) return sem.warning;
  return theme.palette.tkv.brand.main;
};

const Sparkline = ({ data, color, className }) => {
  if (data.length < 3) return null;
  const w = 200;
  const h = 44;
  const step = w / (data.length - 1);
  const points = data.map((v, i) => [
    i * step,
    h - (Math.min(100, v) / 100) * (h - 6) - 3
  ]);
  const line = points
    .map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L${w} ${h} L0 ${h} Z`;
  return (
    <svg
      className={className}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d={area} fill={color} opacity="0.12" />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};

const ServerCard = ({
  icon,
  label,
  value,
  sub,
  percent,
  samples,
  classes,
  theme,
  delay,
  tone
}) => {
  const color = toneFor(theme, percent ?? 0);
  return (
    <div
      className={classes.card}
      style={{
        animationDelay: `${delay}ms`,
        paddingBottom: samples ? 44 : undefined,
        "--tile-tone": tone
      }}
    >
      <div className={classes.cardHead}>
        <span className={classes.icon}>{icon}</span>
        <span className={classes.label}>{label}</span>
      </div>
      <div className={classes.value}>{value}</div>
      <div className={classes.sub}>{sub}</div>
      {percent !== undefined && (
        <div className={classes.bar}>
          <div
            className={classes.barFill}
            style={{ width: `${percent}%`, backgroundColor: color }}
          />
        </div>
      )}
      {samples && (
        <Sparkline data={samples} color={color} className={classes.spark} />
      )}
    </div>
  );
};

const Tile = ({ icon, label, value, sub, classes, delay, tone }) => (
  <div
    className={classes.card}
    style={{ animationDelay: `${delay}ms`, "--tile-tone": tone }}
  >
    <div className={classes.cardHead}>
      <span className={classes.icon}>{icon}</span>
      <span className={classes.label}>{label}</span>
    </div>
    <div className={classes.value}>{value}</div>
    {sub && <div className={classes.sub}>{sub}</div>}
  </div>
);

const NewAdminDialog = ({ company, onClose, onCreated }) => {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [saving, setSaving] = useState(false);
  const s = key => i18n.t(`superDashboard.${key}`);
  const valid =
    form.name.trim().length >= 2 &&
    /\S+@\S+\.\S+/.test(form.email) &&
    form.password.length >= 5;

  const submit = async () => {
    setSaving(true);
    try {
      await api.post("/users", {
        ...form,
        profile: "admin",
        companyId: company.id
      });
      toast.success(s("adminCreated"));
      onCreated();
      onClose();
    } catch (err) {
      toastError(err);
    }
    setSaving(false);
  };

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        {s("newAdmin")} · {company.name}
      </DialogTitle>
      <DialogContent
        style={{ display: "flex", flexDirection: "column", gap: 14 }}
      >
        <Typography variant="body2" color="textSecondary">
          {s("newAdminHint")}
        </Typography>
        {["name", "email", "password"].map(field => (
          <TextField
            key={field}
            label={s(`form.${field}`)}
            type={
              field === "password"
                ? "password"
                : field === "email"
                  ? "email"
                  : "text"
            }
            variant="outlined"
            size="small"
            value={form[field]}
            onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
            autoFocus={field === "name"}
          />
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{i18n.t("common.cancel")}</Button>
        <Button
          variant="contained"
          color="primary"
          disabled={!valid || saving}
          onClick={submit}
        >
          {s("create")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const CompanyUsers = ({ company, classes, theme, refreshKey }) => {
  const [users, setUsers] = useState(null);
  const [adding, setAdding] = useState(false);
  const [version, setVersion] = useState(0);
  const s = (key, opts) => i18n.t(`superDashboard.${key}`, opts);

  useEffect(() => {
    let alive = true;
    api
      .get(`/super/companies/${company.id}/users`)
      .then(({ data }) => alive && setUsers(data))
      .catch(err => {
        if (alive) setUsers([]);
        toastError(err);
      });
    return () => {
      alive = false;
    };
  }, [company.id, version, refreshKey]);

  return (
    <div className={classes.users}>
      <div className={classes.usersHead}>
        <span className={classes.label}>
          {s("usersOf", { count: users?.length || 0 })}
        </span>
        <Button
          size="small"
          color="primary"
          startIcon={<PersonAddRoundedIcon />}
          onClick={() => setAdding(true)}
        >
          {s("newAdmin")}
        </Button>
      </div>
      {users === null ? (
        <div className={classes.center} style={{ padding: 16 }}>
          <BoxLoader size={32} />
        </div>
      ) : (
        <div className={classes.userGrid}>
          {users.map(user => (
            <div
              key={user.id}
              className={`${classes.user}${user.active === false ? ` ${classes.userOff}` : ""}`}
            >
              <span className={classes.avatarWrap}>
                <UserAvatar user={user} size={40} />
                <span
                  className={classes.onlineDot}
                  style={{
                    backgroundColor: user.online
                      ? theme.palette.tkv.semantic.success
                      : theme.palette.tkv.borderStrong
                  }}
                  title={user.online ? s("online") : s("offline")}
                />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  className={`${classes.strong} ${classes.ellipsis}`}
                  style={{ fontSize: "0.875rem" }}
                >
                  {user.name}{" "}
                  <span className={classes.badge}>
                    {user.super ? "super" : user.profile}
                  </span>
                </div>
                <div className={`${classes.sub} ${classes.ellipsis}`}>
                  {user.email}
                </div>
                <div className={classes.sub}>
                  {s("userStats", {
                    open: user.ticketsOpen,
                    sent: user.sent30d
                  })}
                  {user.active === false ? ` · ${s("inactive")}` : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {adding && (
        <NewAdminDialog
          company={company}
          onClose={() => setAdding(false)}
          onCreated={() => setVersion(v => v + 1)}
        />
      )}
    </div>
  );
};

const METRICS = ["messages30d", "tickets30d", "storage", "users"];

const Overview = ({ classes, theme }) => {
  const [system, setSystem] = useState(null);
  const [samples, setSamples] = useState({ cpu: [], mem: [] });
  const [overview, setOverview] = useState(null);
  const [metric, setMetric] = useState("messages30d");
  const [query, setQuery] = useState("");
  const [openCompany, setOpenCompany] = useState(null);
  const [tick, setTick] = useState(0);
  const s = (key, opts) => i18n.t(`superDashboard.${key}`, opts);
  const visibleRef = useRef(true);

  useEffect(() => {
    const onVisibility = () => {
      visibleRef.current = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const loadSystem = useCallback(async () => {
    if (!visibleRef.current) return;
    try {
      const { data } = await api.get("/super/system");
      setSystem(data);
      setSamples(prev => ({
        cpu: [...prev.cpu, data.cpu.usage].slice(-SAMPLES),
        mem: [...prev.mem, pct(data.memory.used, data.memory.total)].slice(
          -SAMPLES
        )
      }));
    } catch (err) {
      // o próximo ciclo tenta de novo
    }
  }, []);

  const loadOverview = useCallback(async () => {
    if (!visibleRef.current) return;
    try {
      const { data } = await api.get("/super/overview");
      setOverview(data);
      setTick(t => t + 1);
    } catch (err) {
      toastError(err);
    }
  }, []);

  useEffect(() => {
    loadSystem();
    loadOverview();
    const a = setInterval(loadSystem, SYSTEM_EVERY);
    const b = setInterval(loadOverview, OVERVIEW_EVERY);
    return () => {
      clearInterval(a);
      clearInterval(b);
    };
  }, [loadSystem, loadOverview]);

  const companies = useMemo(() => {
    const list = overview?.companies || [];
    const q = query.trim().toLowerCase();
    return q
      ? list.filter(c => `${c.name} ${c.email || ""}`.toLowerCase().includes(q))
      : list;
  }, [overview, query]);

  const ranking = useMemo(
    () =>
      [...(overview?.companies || [])]
        .sort((a, b) => b[metric] - a[metric])
        .slice(0, 8)
        .map(c => ({
          name: c.name.length > 18 ? `${c.name.slice(0, 17)}…` : c.name,
          value: c[metric]
        })),
    [overview, metric]
  );

  const activity = (overview?.activity || []).map(d => ({
    ...d,
    label: moment(d.day).format("DD/MM")
  }));

  const t = theme.palette.tkv;
  const accents = t.accents || [];
  const totals = overview?.totals;
  const cpu = system?.cpu.usage ?? 0;
  const memPct = system ? pct(system.memory.used, system.memory.total) : 0;
  const diskPct = system ? pct(system.disk.used, system.disk.total) : 0;

  if (!system || !totals) {
    return <PageLoader />;
  }

  return (
    <>
      <div>
        <Typography component="h2" className={classes.sectionTitle}>
          {s("server")}
        </Typography>
        {!system ? (
          <div className={classes.center}>
            <BoxLoader />
          </div>
        ) : (
          <div className={classes.grid4}>
            <ServerCard
              classes={classes}
              tone={accents[0]}
              theme={theme}
              delay={0}
              icon={<SpeedRoundedIcon />}
              label={s("cpu")}
              value={`${cpu.toFixed(1).replace(".", ",")}%`}
              sub={s("cpuSub", {
                cores: system.cpu.cores,
                load: system.cpu.load[0].toFixed(2)
              })}
              percent={cpu}
              samples={samples.cpu}
            />
            <ServerCard
              classes={classes}
              tone={accents[1]}
              theme={theme}
              delay={40}
              icon={<MemoryRoundedIcon />}
              label={s("ram")}
              value={`${memPct.toFixed(0)}%`}
              sub={`${bytes(system.memory.used)} / ${bytes(system.memory.total)}${
                system.container
                  ? ` · ${s("app")} ${bytes(system.container.used)}`
                  : ""
              }`}
              percent={memPct}
              samples={samples.mem}
            />
            <ServerCard
              classes={classes}
              tone={accents[2]}
              theme={theme}
              delay={80}
              icon={<StorageRoundedIcon />}
              label={s("disk")}
              value={`${diskPct.toFixed(0)}%`}
              sub={`${bytes(system.disk.used)} / ${bytes(system.disk.total)} · ${s("free", { size: bytes(system.disk.free) })}`}
              percent={diskPct}
            />
            <ServerCard
              classes={classes}
              tone={accents[3]}
              theme={theme}
              delay={120}
              icon={<DnsRoundedIcon />}
              label={s("database")}
              value={bytes(system.database.size)}
              sub={s("processSub", {
                rss: bytes(system.process.rss),
                uptime: duration(system.process.uptime),
                online: system.usersOnline
              })}
            />
          </div>
        )}
      </div>

      <div>
        <Typography component="h2" className={classes.sectionTitle}>
          {s("platform")}
        </Typography>
        {!totals ? (
          <div className={classes.center}>
            <BoxLoader />
          </div>
        ) : (
          <div className={classes.grid6}>
            <Tile
              classes={classes}
              tone={accents[0]}
              delay={0}
              icon={<BusinessRoundedIcon />}
              label={s("companies")}
              value={totals.activeCompanies}
              sub={s("ofTotal", { total: totals.companies })}
            />
            <Tile
              classes={classes}
              tone={accents[1]}
              delay={30}
              icon={<PeopleAltRoundedIcon />}
              label={s("users")}
              value={totals.users}
              sub={s("onlineNow", { count: totals.online })}
            />
            <Tile
              classes={classes}
              tone={accents[2]}
              delay={60}
              icon={<WhatsAppIcon />}
              label={s("connections")}
              value={`${totals.connected}/${totals.connections}`}
              sub={s("connected")}
            />
            <Tile
              classes={classes}
              tone={accents[3]}
              delay={90}
              icon={<ForumRoundedIcon />}
              label={s("tickets")}
              value={totals.ticketsOpen}
              sub={s("pending", { count: totals.ticketsPending })}
            />
            <Tile
              classes={classes}
              tone={accents[4]}
              delay={120}
              icon={<ChatBubbleRoundedIcon />}
              label={s("messagesToday")}
              value={totals.messagesToday}
              sub={s("last30", { count: totals.messages30d })}
            />
            <Tile
              classes={classes}
              tone={accents[5]}
              delay={150}
              icon={<FolderRoundedIcon />}
              label={s("storage")}
              value={bytes(totals.storage)}
              sub={s("contacts", { count: totals.contacts })}
            />
          </div>
        )}
      </div>

      {overview && (
        <div className={classes.charts}>
          <div className={classes.card}>
            <div className={classes.chartHead}>
              <span className={classes.strong}>{s("activity")}</span>
            </div>
            <div style={{ height: 240 }}>
              <ResponsiveContainer>
                <AreaChart
                  data={activity}
                  margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="superSent" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor={t.brand.main}
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="100%"
                        stopColor={t.brand.main}
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <linearGradient
                      id="superReceived"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={t.semantic.success}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="100%"
                        stopColor={t.semantic.success}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={t.border}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <ChartTooltip
                    contentStyle={{
                      borderRadius: 10,
                      border: `1px solid ${t.border}`,
                      background: t.surface
                    }}
                  />
                  <Area
                    type="monotone"
                    name={s("received")}
                    dataKey="received"
                    stroke={t.semantic.success}
                    fill="url(#superReceived)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    name={s("sent")}
                    dataKey="sent"
                    stroke={t.brand.main}
                    fill="url(#superSent)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className={classes.card}>
            <div className={classes.chartHead}>
              <span className={classes.strong}>{s("ranking")}</span>
              <div className={classes.chips}>
                {METRICS.map(key => (
                  <ButtonBase
                    key={key}
                    className={`${classes.chip}${metric === key ? ` ${classes.chipOn}` : ""}`}
                    onClick={() => setMetric(key)}
                  >
                    {s(`metrics.${key}`)}
                  </ButtonBase>
                ))}
              </div>
            </div>
            <div style={{ height: 240 }}>
              <ResponsiveContainer>
                <BarChart
                  data={ranking}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={t.border}
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => (metric === "storage" ? bytes(v) : v)}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <ChartTooltip
                    formatter={v => (metric === "storage" ? bytes(v) : v)}
                    contentStyle={{
                      borderRadius: 10,
                      border: `1px solid ${t.border}`,
                      background: t.surface
                    }}
                  />
                  <Bar
                    dataKey="value"
                    name={s(`metrics.${metric}`)}
                    fill={t.brand.main}
                    radius={[0, 6, 6, 0]}
                    barSize={16}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {overview && (
        <div>
          <div className={classes.chartHead} style={{ marginBottom: 12 }}>
            <Typography
              component="h2"
              className={classes.sectionTitle}
              style={{ margin: 0 }}
            >
              {s("clients")}
            </Typography>
            <div className={classes.search}>
              <SearchRoundedIcon fontSize="small" />
              <InputBase
                fullWidth
                placeholder={s("search")}
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
          </div>
          <div className={classes.companies}>
            {companies.map((company, index) => {
              const open = openCompany === company.id;
              const usersPct = company.plan?.users
                ? pct(company.users, company.plan.users)
                : 0;
              const connPct = company.plan?.connections
                ? pct(company.connections, company.plan.connections)
                : 0;
              const due = company.dueDate ? moment(company.dueDate) : null;
              const days = due
                ? due.startOf("day").diff(moment().startOf("day"), "days")
                : null;
              return (
                <div
                  key={company.id}
                  className={classes.company}
                  style={{ animationDelay: `${Math.min(index, 10) * 30}ms` }}
                >
                  <ButtonBase
                    component="div"
                    role="button"
                    className={classes.companyRow}
                    onClick={() => setOpenCompany(open ? null : company.id)}
                  >
                    <div className={classes.companyName}>
                      <span className={classes.companyAvatar}>
                        {company.name.slice(0, 1).toUpperCase()}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div
                          className={`${classes.strong} ${classes.ellipsis}`}
                        >
                          {company.name}
                        </div>
                        <div
                          className={classes.sub}
                          style={{
                            display: "flex",
                            gap: 6,
                            alignItems: "center",
                            flexWrap: "wrap"
                          }}
                        >
                          <span
                            className={`${classes.status} ${company.status !== false ? classes.statusOn : classes.statusOff}`}
                          >
                            {company.status !== false
                              ? s("active")
                              : s("blocked")}
                          </span>
                          {company.plan?.name}
                          {days !== null &&
                            ` · ${days >= 0 ? s("dueIn", { count: days }) : s("overdue", { count: -days })}`}
                        </div>
                      </div>
                    </div>
                    <div className={classes.usage}>
                      <div className={classes.usageTop}>
                        <span>{s("users")}</span>
                        <span>
                          {company.users}
                          {company.plan?.users ? `/${company.plan.users}` : ""}
                        </span>
                      </div>
                      <div className={classes.mini}>
                        <div
                          className={classes.barFill}
                          style={{
                            width: `${usersPct}%`,
                            backgroundColor: toneFor(theme, usersPct)
                          }}
                        />
                      </div>
                    </div>
                    <div className={classes.usage}>
                      <div className={classes.usageTop}>
                        <span>{s("connections")}</span>
                        <span>
                          {company.connected}/{company.connections}
                          {company.plan?.connections
                            ? ` (${s("max", { count: company.plan.connections })})`
                            : ""}
                        </span>
                      </div>
                      <div className={classes.mini}>
                        <div
                          className={classes.barFill}
                          style={{
                            width: `${connPct}%`,
                            backgroundColor: toneFor(theme, connPct)
                          }}
                        />
                      </div>
                    </div>
                    <div className={classes.usage}>
                      <div className={classes.usageTop}>
                        <span>{s("storage")}</span>
                        <span>{bytes(company.storage)}</span>
                      </div>
                      <div className={classes.mini}>
                        <div
                          className={classes.barFill}
                          style={{
                            width: `${totals.storage ? pct(company.storage, totals.storage) : 0}%`,
                            backgroundColor: t.semantic.info
                          }}
                        />
                      </div>
                    </div>
                    <div className={classes.stat}>
                      <div className={classes.statValue}>{company.online}</div>
                      <div className={classes.sub}>{s("onlineShort")}</div>
                    </div>
                    <div className={classes.stat}>
                      <div className={classes.statValue}>
                        {company.ticketsOpen}
                      </div>
                      <div className={classes.sub}>{s("openShort")}</div>
                    </div>
                    <div className={classes.stat}>
                      <div className={classes.statValue}>
                        {company.messages30d}
                      </div>
                      <div className={classes.sub}>{s("messagesShort")}</div>
                    </div>
                    <ExpandMoreRoundedIcon
                      className={`${classes.chevron}${open ? ` ${classes.chevronOpen}` : ""}`}
                    />
                  </ButtonBase>
                  <Collapse in={open} unmountOnExit timeout={220}>
                    <CompanyUsers
                      company={company}
                      classes={classes}
                      theme={theme}
                      refreshKey={tick}
                    />
                  </Collapse>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

const SuperDashboard = ({ companyDashboard }) => {
  const classes = useStyles();
  const theme = useTheme();
  const [tab, setTab] = useState("platform");
  const [now, setNow] = useState(moment());
  const s = key => i18n.t(`superDashboard.${key}`);

  useEffect(() => {
    const timer = setInterval(() => setNow(moment()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Container maxWidth="xl" className={classes.container}>
      <div className={classes.head}>
        <div>
          <Typography component="h1" className={classes.title}>
            {s("title")}
          </Typography>
          <span className={classes.live}>
            <span className={classes.liveDot} />
            {s("live")} · {now.format("HH:mm:ss")}
          </span>
        </div>
        <div className={classes.tabs} role="tablist">
          {["platform", "revenue", "companies", "mine"].map(key => (
            <ButtonBase
              key={key}
              role="tab"
              aria-selected={tab === key}
              className={`${classes.tab}${tab === key ? ` ${classes.tabOn}` : ""}`}
              onClick={() => setTab(key)}
            >
              {s(`tabs.${key}`)}
            </ButtonBase>
          ))}
        </div>
      </div>

      {tab === "platform" && <Overview classes={classes} theme={theme} />}
      {tab === "revenue" && <Revenue />}
      {tab === "companies" && (
        <div className={classes.card} style={{ padding: 0 }}>
          <CompaniesManager />
        </div>
      )}
      {tab === "mine" && companyDashboard}
    </Container>
  );
};

export default SuperDashboard;
