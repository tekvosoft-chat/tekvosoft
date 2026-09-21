import React, { useContext, useEffect, useMemo, useState } from "react";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import Button from "@material-ui/core/Button";
import ButtonBase from "@material-ui/core/ButtonBase";
import Drawer from "@material-ui/core/Drawer";
import IconButton from "@material-ui/core/IconButton";
import InputBase from "@material-ui/core/InputBase";
import Switch from "@material-ui/core/Switch";
import TextField from "@material-ui/core/TextField";
import AddRoundedIcon from "@material-ui/icons/AddRounded";
import CloseRoundedIcon from "@material-ui/icons/CloseRounded";
import SearchRoundedIcon from "@material-ui/icons/SearchRounded";
import CheckCircleRoundedIcon from "@material-ui/icons/CheckCircleRounded";
import DeleteOutlineRoundedIcon from "@material-ui/icons/DeleteOutlineRounded";
import LoginRoundedIcon from "@material-ui/icons/ExitToAppRounded";
import PersonOutlineRoundedIcon from "@material-ui/icons/PersonOutlineRounded";
import EventRoundedIcon from "@material-ui/icons/EventRounded";
import moment from "moment";
import { toast } from "react-toastify";
import { head, isArray } from "lodash";

import ConfirmationModal from "../ConfirmationModal";
import ModalUsers from "../ModalUsers";
import { SelectLanguage } from "../SelectLanguage";
import useCompanies from "../../hooks/useCompanies";
import usePlans from "../../hooks/usePlans";
import api from "../../services/api";
import { AuthContext } from "../../context/Auth/AuthContext";
import { safeValueFormat } from "../../helpers/safeValueFormat";
import { i18n } from "../../translate/i18n";

/**
 * Empresas (painel do super admin).
 *
 * A lista mostra cada empresa num cartão com o que importa de relance:
 * plano, se está ativa e quando vence. Tocar abre o editor ao lado (no
 * celular, uma folha que sobe de baixo) dividido em três partes — dados,
 * plano e cobrança — em vez do formulário comprido em cima da tabela.
 * Campanhas saíram: o sistema não usa mais.
 */

const RECURRENCES = [
  ["MENSAL", "Mensal", 1],
  ["BIMESTRAL", "Bimestral", 2],
  ["TRIMESTRAL", "Trimestral", 3],
  ["SEMESTRAL", "Semestral", 6],
  ["ANUAL", "Anual", 12]
];

const EMPTY = {
  name: "",
  email: "",
  phone: "",
  language: "",
  planId: "",
  status: true,
  dueDate: "",
  recurrence: "MENSAL"
};

const formatBytes = bytes => {
  if (!bytes) return "0 MB";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = Number(bytes);
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
};

const daysToDue = dueDate =>
  dueDate
    ? moment(dueDate).startOf("day").diff(moment().startOf("day"), "days")
    : null;

const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  const sem = t.semantic;
  return {
    root: {
      display: "flex",
      flexDirection: "column",
      gap: theme.spacing(2)
    },
    toolbar: {
      display: "flex",
      alignItems: "center",
      gap: theme.spacing(1),
      flexWrap: "wrap"
    },
    search: {
      flex: 1,
      minWidth: 200,
      display: "flex",
      alignItems: "center",
      gap: 8,
      height: 42,
      padding: "0 14px",
      borderRadius: t.radius.pill,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface,
      color: theme.palette.text.secondary,
      [theme.breakpoints.down("xs")]: { minWidth: 0 }
    },
    addBtn: {
      height: 42,
      borderRadius: t.radius.pill,
      textTransform: "none",
      fontWeight: 700,
      [theme.breakpoints.down("xs")]: {
        minWidth: 42,
        width: 42,
        padding: 0,
        "& .MuiButton-startIcon": { margin: 0 },
        "& $addLabel": { display: "none" }
      }
    },
    addLabel: {},
    filters: {
      display: "flex",
      gap: 6,
      overflowX: "auto",
      scrollbarWidth: "none",
      "&::-webkit-scrollbar": { display: "none" },
      "& > *": { flex: "none" }
    },
    filter: {
      height: 32,
      padding: "0 14px",
      borderRadius: t.radius.pill,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface,
      fontSize: "0.8125rem",
      fontWeight: 600,
      color: theme.palette.text.secondary
    },
    filterOn: {
      borderColor: t.brand.textBorder,
      backgroundColor: t.brand.textSoft,
      color: t.brand.text
    },
    count: { marginLeft: 6, opacity: 0.7 },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
      gap: theme.spacing(1.5),
      [theme.breakpoints.down("xs")]: { gridTemplateColumns: "1fr" }
    },
    card: {
      display: "flex",
      flexDirection: "column",
      alignItems: "stretch",
      gap: theme.spacing(1.25),
      padding: theme.spacing(2),
      borderRadius: t.radius.lg,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface,
      textAlign: "left",
      transition: "border-color .15s ease, transform .15s ease",
      animation: "$rise .3s ease both",
      "&:hover": {
        borderColor: t.brand.textBorder,
        transform: "translateY(-2px)"
      }
    },
    "@keyframes rise": {
      from: { opacity: 0, transform: "translateY(6px)" },
      to: { opacity: 1, transform: "none" }
    },
    cardTop: { display: "flex", alignItems: "center", gap: 12, minWidth: 0 },
    avatar: {
      flex: "none",
      width: 42,
      height: 42,
      borderRadius: 12,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 800,
      fontSize: "1.0625rem",
      color: t.brand.text,
      backgroundColor: t.brand.textSoft
    },
    name: {
      fontSize: "0.9688rem",
      fontWeight: 700,
      color: theme.palette.text.primary,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    email: {
      fontSize: "0.8125rem",
      color: theme.palette.text.secondary,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    chips: { display: "flex", flexWrap: "wrap", gap: 6 },
    chip: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      height: 24,
      padding: "0 9px",
      borderRadius: t.radius.pill,
      fontSize: "0.75rem",
      fontWeight: 600,
      whiteSpace: "nowrap",
      "& svg": { fontSize: 14 }
    },
    plain: {
      color: theme.palette.text.secondary,
      backgroundColor: t.surfaceSunken
    },
    brand: { color: t.brand.text, backgroundColor: t.brand.textSoft },
    ok: { color: sem.success, backgroundColor: sem.successSoft },
    soon: { color: sem.warning, backgroundColor: sem.warningSoft },
    late: { color: sem.danger, backgroundColor: sem.dangerSoft },
    empty: {
      padding: theme.spacing(6, 2),
      textAlign: "center",
      color: theme.palette.text.secondary
    },

    // ── editor ──
    drawerPaper: {
      width: 480,
      maxWidth: "100vw",
      display: "flex",
      flexDirection: "column",
      backgroundColor: t.surface,
      [theme.breakpoints.down("xs")]: {
        width: "100%",
        height: "calc(var(--vh, 100vh) - 24px)",
        borderRadius: "22px 22px 0 0"
      }
    },
    edHead: {
      flex: "none",
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: theme.spacing(2, 2, 1.5, 2.5),
      borderBottom: `1px solid ${t.border}`
    },
    edTitle: {
      flex: 1,
      minWidth: 0,
      fontSize: "1.125rem",
      fontWeight: 700,
      color: theme.palette.text.primary,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    edBody: {
      flex: 1,
      minHeight: 0,
      overflowY: "auto",
      padding: theme.spacing(1, 2.5, 3),
      ...theme.scrollbarStyles
    },
    section: {
      paddingTop: theme.spacing(2.5),
      display: "flex",
      flexDirection: "column",
      gap: theme.spacing(1.5)
    },
    sectionTitle: {
      fontSize: "0.75rem",
      fontWeight: 700,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: theme.palette.text.secondary
    },
    two: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: theme.spacing(1.5),
      [theme.breakpoints.down("xs")]: { gridTemplateColumns: "1fr" }
    },
    plans: { display: "flex", flexDirection: "column", gap: 8 },
    plan: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      width: "100%",
      padding: theme.spacing(1.5, 1.75),
      borderRadius: t.radius.md,
      border: `1.5px solid ${t.border}`,
      textAlign: "left",
      justifyContent: "flex-start",
      transition: "border-color .15s ease, background-color .15s ease"
    },
    planOn: {
      borderColor: t.brand.main,
      backgroundColor: t.brand.textSoft
    },
    planCheck: {
      flex: "none",
      width: 22,
      height: 22,
      borderRadius: "50%",
      border: `2px solid ${t.borderStrong}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: t.brand.main,
      "& svg": { fontSize: 24 }
    },
    planCheckOn: { border: "none" },
    planText: { flex: 1, minWidth: 0 },
    planName: {
      fontSize: "0.9375rem",
      fontWeight: 700,
      color: theme.palette.text.primary
    },
    planSub: { fontSize: "0.8125rem", color: theme.palette.text.secondary },
    planPrice: {
      flex: "none",
      fontSize: "0.9375rem",
      fontWeight: 700,
      color: theme.palette.text.primary
    },
    segment: { display: "flex", flexWrap: "wrap", gap: 6 },
    dueRow: { display: "flex", alignItems: "center", gap: 8 },
    plusBtn: {
      flex: "none",
      height: 40,
      borderRadius: t.radius.md,
      textTransform: "none",
      fontWeight: 600,
      whiteSpace: "nowrap"
    },
    switchRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: theme.spacing(1, 1.5),
      borderRadius: t.radius.md,
      border: `1px solid ${t.border}`
    },
    switchLabel: {
      fontSize: "0.9375rem",
      fontWeight: 600,
      color: theme.palette.text.primary
    },
    switchSub: { fontSize: "0.8125rem", color: theme.palette.text.secondary },
    actions: { display: "flex", flexWrap: "wrap", gap: 8 },
    actionBtn: {
      borderRadius: t.radius.pill,
      textTransform: "none",
      fontWeight: 600
    },
    danger: { color: sem.danger, borderColor: sem.dangerSoft },
    edFoot: {
      flex: "none",
      display: "flex",
      justifyContent: "flex-end",
      gap: 8,
      padding: theme.spacing(1.5, 2.5),
      paddingBottom: `calc(${theme.spacing(1.5)}px + var(--safe-bottom, 0px))`,
      borderTop: `1px solid ${t.border}`
    },
    saveBtn: {
      borderRadius: t.radius.pill,
      textTransform: "none",
      fontWeight: 700,
      minWidth: 120
    }
  };
});

const dueTone = (classes, days) =>
  days === null
    ? [classes.plain, "Sem vencimento"]
    : days < 0
      ? [classes.late, `Vencida há ${-days} dia${days === -1 ? "" : "s"}`]
      : days === 0
        ? [classes.soon, "Vence hoje"]
        : days <= 7
          ? [classes.soon, `Vence em ${days} dia${days === 1 ? "" : "s"}`]
          : [classes.ok, `Vence ${moment().add(days, "days").format("DD/MM")}`];

const CompanyEditor = ({
  open,
  initial,
  plans,
  onClose,
  onSave,
  onDelete,
  onImpersonate,
  saving
}) => {
  const classes = useStyles();
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("xs"));
  const [form, setForm] = useState(EMPTY);
  const [usersOpen, setUsersOpen] = useState(false);
  const [firstUser, setFirstUser] = useState({});

  useEffect(() => {
    if (!open) return;
    // campos nulos no banco (empresa sem e-mail ou telefone) viram texto
    // vazio: o editor trabalha só com texto
    const clean = Object.fromEntries(
      Object.entries(initial || {}).map(([key, value]) => [
        key,
        value === null && key in EMPTY ? EMPTY[key] : value
      ])
    );
    setForm({
      ...EMPTY,
      ...clean,
      recurrence: initial?.recurrence || "MENSAL",
      dueDate: initial?.dueDate
        ? moment(initial.dueDate).format("YYYY-MM-DD")
        : ""
    });
  }, [open, initial]);

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const editing = !!form.id;

  const addPeriod = () => {
    const months =
      RECURRENCES.find(([key]) => key === form.recurrence)?.[2] || 1;
    const base =
      form.dueDate && moment(form.dueDate).isAfter(moment())
        ? moment(form.dueDate)
        : moment();
    set("dueDate", base.add(months, "month").format("YYYY-MM-DD"));
  };

  const openUsers = async () => {
    try {
      const { data } = await api.get("/users/list", {
        params: { companyId: form.id }
      });
      if (isArray(data) && data.length) setFirstUser(head(data));
      setUsersOpen(true);
    } catch (err) {
      toast.error(i18n.t("companiesManager.toasts.loadError"));
    }
  };

  const valid =
    String(form.name || "").trim() && String(form.email || "").trim();

  return (
    <Drawer
      anchor={isPhone ? "bottom" : "right"}
      open={open}
      onClose={onClose}
      classes={{ paper: classes.drawerPaper }}
    >
      <div className={classes.edHead}>
        <span className={classes.avatar}>
          {(form.name || "?").trim().charAt(0).toUpperCase()}
        </span>
        <span className={classes.edTitle}>
          {editing ? form.name || "Empresa" : "Nova empresa"}
        </span>
        <IconButton onClick={onClose} aria-label="Fechar">
          <CloseRoundedIcon />
        </IconButton>
      </div>

      <div className={classes.edBody}>
        <div className={classes.section}>
          <span className={classes.sectionTitle}>Dados da empresa</span>
          <TextField
            label={i18n.t("common.name")}
            variant="outlined"
            size="small"
            fullWidth
            value={form.name}
            onChange={e => set("name", e.target.value)}
          />
          <TextField
            label={i18n.t("common.email")}
            variant="outlined"
            size="small"
            fullWidth
            required
            value={form.email}
            onChange={e => set("email", e.target.value)}
          />
          <div className={classes.two}>
            <TextField
              label={i18n.t("common.phone")}
              variant="outlined"
              size="small"
              fullWidth
              value={form.phone}
              onChange={e => set("phone", e.target.value)}
            />
            <SelectLanguage
              variant="outlined"
              margin="dense"
              fullWidth
              value={form.language}
              onChange={e => set("language", e.target.value)}
            />
          </div>
        </div>

        <div className={classes.section}>
          <span className={classes.sectionTitle}>Plano</span>
          <div className={classes.plans}>
            {plans.map(plan => {
              const on = plan.id === form.planId;
              return (
                <ButtonBase
                  key={plan.id}
                  className={`${classes.plan}${on ? ` ${classes.planOn}` : ""}`}
                  onClick={() => set("planId", plan.id)}
                >
                  <span
                    className={`${classes.planCheck}${on ? ` ${classes.planCheckOn}` : ""}`}
                  >
                    {on && <CheckCircleRoundedIcon />}
                  </span>
                  <span className={classes.planText}>
                    <div className={classes.planName}>
                      {plan.name}
                      {plan.isPublic === false ? " · interno" : ""}
                    </div>
                    <div className={classes.planSub}>
                      {plan.users} usuários · {plan.connections} conexões ·{" "}
                      {plan.queues} filas
                    </div>
                  </span>
                  <span className={classes.planPrice}>
                    {safeValueFormat(plan.value, plan.currency || "BRL")}
                  </span>
                </ButtonBase>
              );
            })}
          </div>
        </div>

        <div className={classes.section}>
          <span className={classes.sectionTitle}>Cobrança</span>
          <div className={classes.segment}>
            {RECURRENCES.map(([key, label]) => (
              <ButtonBase
                key={key}
                className={`${classes.filter}${form.recurrence === key ? ` ${classes.filterOn}` : ""}`}
                onClick={() => set("recurrence", key)}
              >
                {label}
              </ButtonBase>
            ))}
          </div>
          <div className={classes.dueRow}>
            <TextField
              label="Vencimento"
              type="date"
              variant="outlined"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={form.dueDate}
              onChange={e => set("dueDate", e.target.value)}
            />
            <Button
              variant="outlined"
              className={classes.plusBtn}
              startIcon={<EventRoundedIcon />}
              onClick={addPeriod}
            >
              +1 período
            </Button>
          </div>
          <div className={classes.switchRow}>
            <div>
              <div className={classes.switchLabel}>
                {form.status ? "Empresa ativa" : "Empresa bloqueada"}
              </div>
              <div className={classes.switchSub}>
                {form.status
                  ? "Usa o sistema normalmente"
                  : "Ninguém da empresa consegue entrar"}
              </div>
            </div>
            <Switch
              color="primary"
              checked={!!form.status}
              onChange={e => set("status", e.target.checked)}
            />
          </div>
        </div>

        {editing && (
          <div className={classes.section}>
            <span className={classes.sectionTitle}>Ações</span>
            <div className={classes.actions}>
              <Button
                variant="outlined"
                className={classes.actionBtn}
                startIcon={<PersonOutlineRoundedIcon />}
                onClick={openUsers}
              >
                Usuário principal
              </Button>
              <Button
                variant="outlined"
                className={classes.actionBtn}
                startIcon={<LoginRoundedIcon />}
                onClick={() => onImpersonate(form)}
              >
                Acessar como esta empresa
              </Button>
              <Button
                variant="outlined"
                className={`${classes.actionBtn} ${classes.danger}`}
                startIcon={<DeleteOutlineRoundedIcon />}
                onClick={() => onDelete(form)}
              >
                Excluir
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className={classes.edFoot}>
        <Button onClick={onClose} className={classes.actionBtn}>
          {i18n.t("common.cancel")}
        </Button>
        <Button
          variant="contained"
          color="primary"
          disableElevation
          className={classes.saveBtn}
          disabled={!valid || saving}
          onClick={() => onSave(form)}
        >
          {saving ? "Salvando…" : i18n.t("common.save")}
        </Button>
      </div>

      {usersOpen && (
        <ModalUsers
          userId={firstUser.id}
          companyId={form.id}
          open={usersOpen}
          onClose={() => {
            setFirstUser({});
            setUsersOpen(false);
          }}
        />
      )}
    </Drawer>
  );
};

const FILTERS = [
  ["all", "Todas"],
  ["active", "Ativas"],
  ["late", "Vencidas"],
  ["blocked", "Bloqueadas"]
];

export default function CompaniesManager({ selectId, onSelectHandled }) {
  const classes = useStyles();
  const { list, save, update, remove } = useCompanies();
  const { list: listPlans } = usePlans();
  const { handleImpersonate } = useContext(AuthContext);

  const [records, setRecords] = useState([]);
  const [plans, setPlans] = useState([]);
  const [storage, setStorage] = useState({});
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmImpersonate, setConfirmImpersonate] = useState(null);

  const load = async () => {
    try {
      setRecords(await list());
    } catch (e) {
      toast.error(i18n.t("companiesManager.toasts.loadError"));
    }
  };

  useEffect(() => {
    load();
    listPlans()
      .then(data => setPlans(Array.isArray(data) ? data : []))
      .catch(() => {});
    api
      .get("/companies/storage")
      .then(({ data }) => setStorage(data || {}))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // veio de "Editar empresa e plano" em Clientes: abre direto nela
  useEffect(() => {
    if (!selectId || !records.length) return;
    const found = records.find(r => r.id === selectId);
    if (found) setEditing(found);
    onSelectHandled?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectId, records]);

  const counts = useMemo(() => {
    const c = { all: records.length, active: 0, late: 0, blocked: 0 };
    records.forEach(r => {
      if (r.status === false) c.blocked += 1;
      else c.active += 1;
      const days = daysToDue(r.dueDate);
      if (days !== null && days < 0) c.late += 1;
    });
    return c;
  }, [records]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records
      .filter(r => {
        if (filter === "active") return r.status !== false;
        if (filter === "blocked") return r.status === false;
        if (filter === "late") {
          const days = daysToDue(r.dueDate);
          return days !== null && days < 0;
        }
        return true;
      })
      .filter(
        r =>
          !q ||
          `${r.name || ""} ${r.email || ""} ${r.phone || ""}`
            .toLowerCase()
            .includes(q)
      )
      .sort((a, b) => String(a.name).localeCompare(String(b.name), "pt-BR"));
  }, [records, query, filter]);

  const handleSave = async form => {
    setSaving(true);
    const data = {
      id: form.id,
      name: String(form.name || "").trim(),
      email: String(form.email || "").trim(),
      phone: form.phone,
      language: form.language,
      planId: form.planId || null,
      status: !!form.status,
      recurrence: form.recurrence,
      dueDate:
        form.dueDate && moment(form.dueDate).isValid() ? form.dueDate : null
    };
    try {
      if (data.id !== undefined) await update(data);
      else await save(data);
      await load();
      setEditing(null);
      toast.success(i18n.t("companiesManager.toasts.operationSuccess"));
    } catch (e) {
      toast.error(i18n.t("companiesManager.toasts.operationErrorDuplicate"));
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    try {
      await remove(confirmDelete.id);
      await load();
      setEditing(null);
      toast.success(i18n.t("companiesManager.toasts.operationSuccess"));
    } catch (e) {
      toast.error(i18n.t("companiesManager.toasts.operationError"));
    }
  };

  return (
    <div className={classes.root}>
      <div className={classes.toolbar}>
        <label className={classes.search}>
          <SearchRoundedIcon fontSize="small" />
          <InputBase
            fullWidth
            placeholder="Buscar empresa, e-mail ou telefone"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </label>
        <Button
          variant="contained"
          color="primary"
          disableElevation
          className={classes.addBtn}
          startIcon={<AddRoundedIcon />}
          onClick={() => setEditing({ ...EMPTY })}
          aria-label="Nova empresa"
        >
          <span className={classes.addLabel}>Nova empresa</span>
        </Button>
      </div>

      <div className={classes.filters}>
        {FILTERS.map(([key, label]) => (
          <ButtonBase
            key={key}
            className={`${classes.filter}${filter === key ? ` ${classes.filterOn}` : ""}`}
            onClick={() => setFilter(key)}
          >
            {label}
            <span className={classes.count}>{counts[key]}</span>
          </ButtonBase>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className={classes.empty}>Nenhuma empresa encontrada.</div>
      ) : (
        <div className={classes.grid}>
          {visible.map((row, index) => {
            const [tone, dueLabel] = dueTone(classes, daysToDue(row.dueDate));
            return (
              <ButtonBase
                key={row.id}
                component="div"
                className={classes.card}
                style={{ animationDelay: `${Math.min(index, 12) * 25}ms` }}
                onClick={() => setEditing(row)}
              >
                <div className={classes.cardTop}>
                  <span className={classes.avatar}>
                    {(row.name || "?").trim().charAt(0).toUpperCase()}
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className={classes.name}>{row.name || "—"}</div>
                    <div className={classes.email}>
                      {row.email || row.phone || "—"}
                    </div>
                  </div>
                </div>
                <div className={classes.chips}>
                  <span className={`${classes.chip} ${classes.brand}`}>
                    {row.plan?.name || "Sem plano"}
                  </span>
                  <span
                    className={`${classes.chip} ${row.status === false ? classes.late : classes.ok}`}
                  >
                    {row.status === false ? "Bloqueada" : "Ativa"}
                  </span>
                  <span className={`${classes.chip} ${tone}`}>{dueLabel}</span>
                  <span className={`${classes.chip} ${classes.plain}`}>
                    {formatBytes(storage[row.id])}
                  </span>
                </div>
              </ButtonBase>
            );
          })}
        </div>
      )}

      <CompanyEditor
        open={!!editing}
        initial={editing}
        plans={plans}
        saving={saving}
        onClose={() => setEditing(null)}
        onSave={handleSave}
        onDelete={form => setConfirmDelete(form)}
        onImpersonate={form => setConfirmImpersonate(form)}
      />

      <ConfirmationModal
        title={i18n.t("companiesManager.confirmationModal.deleteTitle")}
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
      >
        {i18n.t("companiesManager.confirmationModal.deleteMessage")}
      </ConfirmationModal>
      <ConfirmationModal
        title={i18n.t("companiesManager.confirmationModal.impersonateTitle")}
        open={!!confirmImpersonate}
        onClose={() => setConfirmImpersonate(null)}
        onConfirm={() => handleImpersonate(confirmImpersonate.id)}
      >
        {i18n.t("companiesManager.confirmationModal.impersonateMessage")}
      </ConfirmationModal>
    </div>
  );
}
