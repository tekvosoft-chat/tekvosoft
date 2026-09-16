import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import ButtonBase from "@material-ui/core/ButtonBase";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import IconButton from "@material-ui/core/IconButton";
import Switch from "@material-ui/core/Switch";
import TextField from "@material-ui/core/TextField";
import MenuItem from "@material-ui/core/MenuItem";
import Typography from "@material-ui/core/Typography";
import AddRoundedIcon from "@material-ui/icons/AddRounded";
import EditOutlinedIcon from "@material-ui/icons/EditOutlined";
import DeleteOutlineRoundedIcon from "@material-ui/icons/DeleteOutlineRounded";
import CheckRoundedIcon from "@material-ui/icons/CheckRounded";
import CloseRoundedIcon from "@material-ui/icons/CloseRounded";
import AutoAwesomeIcon from "@material-ui/icons/WbIncandescentOutlined";

import ConfirmationModal from "../ConfirmationModal";
import BoxLoader from "../ui/BoxLoader";
import usePlans from "../../hooks/usePlans";
import { safeValueFormat } from "../../helpers/safeValueFormat";
import { PLAN_FEATURES } from "../../helpers/planFeatures";
import { i18n } from "../../translate/i18n";

/**
 * Planos em cartões, como uma página de preços.
 *
 * Cada plano tem limites (usuários, conexões, filas), valor e os recursos
 * incluídos — Kanban, chat interno, agendamentos, campanhas e API. Os
 * modelos prontos criam planos típicos com um toque (dá para ajustar antes
 * de salvar).
 */
const TEMPLATES = [
  {
    key: "start",
    name: "Start",
    users: 2,
    connections: 1,
    queues: 2,
    value: 97,
    features: {
      useKanban: true,
      useInternalChat: true,
      useSchedules: false,
      useCampaigns: false,
      useExternalApi: false
    }
  },
  {
    key: "pro",
    name: "Profissional",
    users: 5,
    connections: 2,
    queues: 5,
    value: 197,
    features: {
      useKanban: true,
      useInternalChat: true,
      useSchedules: true,
      useCampaigns: false,
      useExternalApi: false
    }
  },
  {
    key: "business",
    name: "Business",
    users: 15,
    connections: 5,
    queues: 10,
    value: 397,
    features: {
      useKanban: true,
      useInternalChat: true,
      useSchedules: true,
      useCampaigns: true,
      useExternalApi: true
    }
  },
  {
    key: "enterprise",
    name: "Enterprise",
    users: 50,
    connections: 15,
    queues: 30,
    value: 897,
    features: {
      useKanban: true,
      useInternalChat: true,
      useSchedules: true,
      useCampaigns: true,
      useExternalApi: true
    }
  }
];

const EMPTY = {
  name: "",
  users: 1,
  connections: 1,
  queues: 1,
  value: 0,
  currency: "BRL",
  isPublic: true,
  ...Object.fromEntries(PLAN_FEATURES.map(f => [f, true]))
};

const CURRENCIES = [
  "BRL",
  "USD",
  "EUR",
  "PYG",
  "ARS",
  "MXN",
  "COP",
  "CLP",
  "PEN"
];

const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    root: {
      display: "flex",
      flexDirection: "column",
      gap: theme.spacing(2.5),
      padding: theme.spacing(1, 0)
    },
    head: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 12
    },
    title: {
      fontSize: "1.125rem",
      fontWeight: 800,
      color: theme.palette.text.primary
    },
    sub: { fontSize: "0.875rem", color: theme.palette.text.secondary },
    pill: { borderRadius: 999, textTransform: "none", fontWeight: 700 },
    sectionTitle: {
      fontSize: "0.8125rem",
      fontWeight: 800,
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      color: theme.palette.text.secondary
    },
    templates: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
      gap: 10
    },
    template: {
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      gap: 2,
      padding: theme.spacing(1.5, 2),
      borderRadius: t.radius.lg,
      border: `1px dashed ${t.brand.textBorder}`,
      backgroundColor: t.brand.textSoft,
      textAlign: "left",
      "&:hover": { borderStyle: "solid" }
    },
    templateName: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontWeight: 800,
      color: t.brand.text,
      "& svg": { fontSize: 18 }
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
      gap: theme.spacing(2)
    },
    card: {
      position: "relative",
      display: "flex",
      flexDirection: "column",
      gap: theme.spacing(1.5),
      padding: theme.spacing(2.5, 2.25),
      borderRadius: t.radius.xl,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface,
      animation: "$rise .35s ease both",
      transition: "transform .18s ease, box-shadow .18s ease",
      "&:hover": {
        transform: "translateY(-3px)",
        boxShadow: `0 18px 40px -24px ${t.brand.main}`
      }
    },
    featured: {
      borderColor: t.brand.main,
      boxShadow: `0 0 0 1px ${t.brand.main}`
    },
    ribbon: {
      position: "absolute",
      top: -11,
      left: 18,
      padding: "3px 10px",
      borderRadius: 999,
      fontSize: "0.6875rem",
      fontWeight: 800,
      color: t.brand.contrastText,
      backgroundColor: t.brand.main
    },
    planName: {
      fontSize: "1.125rem",
      fontWeight: 800,
      color: theme.palette.text.primary
    },
    badge: {
      marginLeft: 8,
      padding: "1px 8px",
      borderRadius: 999,
      fontSize: "0.6875rem",
      fontWeight: 700,
      backgroundColor: t.surfaceSunken,
      color: theme.palette.text.secondary
    },
    price: { display: "flex", alignItems: "baseline", gap: 4 },
    priceValue: {
      fontSize: "1.875rem",
      fontWeight: 800,
      letterSpacing: "-0.03em",
      color: theme.palette.text.primary
    },
    priceUnit: { fontSize: "0.8125rem", color: theme.palette.text.secondary },
    limits: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 },
    limit: {
      padding: "8px 4px",
      borderRadius: 10,
      textAlign: "center",
      backgroundColor: t.surfaceSunken
    },
    limitValue: {
      fontSize: "1rem",
      fontWeight: 800,
      color: theme.palette.text.primary
    },
    limitLabel: { fontSize: "0.6875rem", color: theme.palette.text.secondary },
    features: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      margin: 0,
      padding: 0,
      listStyle: "none"
    },
    feature: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontSize: "0.875rem",
      color: theme.palette.text.primary,
      "& svg": { fontSize: 18 }
    },
    on: { color: t.semantic.success },
    off: {
      color: theme.palette.text.disabled,
      textDecoration: "line-through",
      "& svg": { color: theme.palette.text.disabled }
    },
    actions: { display: "flex", gap: 8, marginTop: "auto" },
    formGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12,
      [theme.breakpoints.down("xs")]: { gridTemplateColumns: "1fr" }
    },
    switchRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      padding: "6px 0",
      borderBottom: `1px solid ${t.border}`
    },
    switchText: { display: "flex", flexDirection: "column" },
    switchHint: { fontSize: "0.75rem", color: theme.palette.text.secondary },
    center: { display: "flex", justifyContent: "center", padding: 32 },
    "@keyframes rise": {
      from: { opacity: 0, transform: "translateY(8px)" },
      to: { opacity: 1, transform: "none" }
    }
  };
});

const PlanForm = ({ open, initial, onClose, onSave, saving }) => {
  const classes = useStyles();
  const [form, setForm] = useState(EMPTY);
  const p = key => i18n.t(`plansPage.${key}`);

  useEffect(() => {
    if (open) setForm({ ...EMPTY, ...initial });
  }, [open, initial]);

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const valid = form.name.trim().length >= 2;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      scroll="paper"
    >
      <DialogTitle>{form.id ? p("edit") : p("new")}</DialogTitle>
      <DialogContent
        dividers
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
      >
        <div className={classes.formGrid}>
          <TextField
            label={p("form.name")}
            variant="outlined"
            size="small"
            value={form.name}
            onChange={e => set("name", e.target.value)}
            autoFocus
          />
          <TextField
            label={p("form.value")}
            variant="outlined"
            size="small"
            type="number"
            inputProps={{ min: 0, step: "0.01" }}
            value={form.value}
            onChange={e => set("value", e.target.value)}
          />
          <TextField
            label={p("form.users")}
            variant="outlined"
            size="small"
            type="number"
            inputProps={{ min: 0 }}
            value={form.users}
            onChange={e => set("users", e.target.value)}
          />
          <TextField
            label={p("form.connections")}
            variant="outlined"
            size="small"
            type="number"
            inputProps={{ min: 0 }}
            value={form.connections}
            onChange={e => set("connections", e.target.value)}
          />
          <TextField
            label={p("form.queues")}
            variant="outlined"
            size="small"
            type="number"
            inputProps={{ min: 0 }}
            value={form.queues}
            onChange={e => set("queues", e.target.value)}
          />
          <TextField
            select
            label={p("form.currency")}
            variant="outlined"
            size="small"
            value={form.currency || "BRL"}
            onChange={e => set("currency", e.target.value)}
          >
            {CURRENCIES.map(c => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>
        </div>
        <div>
          <Typography className={classes.sectionTitle}>
            {p("featuresTitle")}
          </Typography>
          {PLAN_FEATURES.map(feature => (
            <div key={feature} className={classes.switchRow}>
              <span className={classes.switchText}>
                <span>{i18n.t(`planFeatures.names.${feature}`)}</span>
                <span className={classes.switchHint}>
                  {i18n.t(`planFeatures.hints.${feature}`)}
                </span>
              </span>
              <Switch
                color="primary"
                checked={form[feature] !== false}
                onChange={e => set(feature, e.target.checked)}
              />
            </div>
          ))}
          <div className={classes.switchRow} style={{ borderBottom: "none" }}>
            <span className={classes.switchText}>
              <span>{p("form.public")}</span>
              <span className={classes.switchHint}>{p("form.publicHint")}</span>
            </span>
            <Switch
              color="primary"
              checked={form.isPublic !== false}
              onChange={e => set("isPublic", e.target.checked)}
            />
          </div>
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{i18n.t("common.cancel")}</Button>
        <Button
          variant="contained"
          color="primary"
          disabled={!valid || saving}
          onClick={() => onSave(form)}
        >
          {i18n.t("common.save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const PlansManager = () => {
  const classes = useStyles();
  const { list, save, update, remove } = usePlans();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const p = (key, opts) => i18n.t(`plansPage.${key}`, opts);

  const load = async () => {
    try {
      setPlans(await list());
    } catch (e) {
      toast.error(p("loadError"));
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async form => {
    setSaving(true);
    const data = {
      ...form,
      users: Number(form.users) || 0,
      connections: Number(form.connections) || 0,
      queues: Number(form.queues) || 0,
      value: Number(String(form.value).replace(",", ".")) || 0
    };
    try {
      if (form.id) await update(data);
      else await save(data);
      toast.success(p("saved"));
      setEditing(null);
      await load();
    } catch (e) {
      toast.error(p("saveError"));
    }
    setSaving(false);
  };

  const featuredId =
    plans.length > 2
      ? [...plans].sort((a, b) => a.value - b.value)[
          Math.floor(plans.length / 2)
        ]?.id
      : null;

  return (
    <div className={classes.root}>
      <div className={classes.head}>
        <div>
          <Typography className={classes.title}>{p("title")}</Typography>
          <Typography className={classes.sub}>{p("subtitle")}</Typography>
        </div>
        <Button
          variant="contained"
          color="primary"
          className={classes.pill}
          startIcon={<AddRoundedIcon />}
          onClick={() => setEditing({})}
        >
          {p("new")}
        </Button>
      </div>

      <div>
        <Typography
          className={classes.sectionTitle}
          style={{ marginBottom: 8 }}
        >
          {p("templatesTitle")}
        </Typography>
        <div className={classes.templates}>
          {TEMPLATES.map(tpl => (
            <ButtonBase
              key={tpl.key}
              className={classes.template}
              onClick={() =>
                setEditing({
                  name: plans.some(pl => pl.name === tpl.name)
                    ? `${tpl.name} 2`
                    : tpl.name,
                  users: tpl.users,
                  connections: tpl.connections,
                  queues: tpl.queues,
                  value: tpl.value,
                  currency: "BRL",
                  isPublic: true,
                  ...tpl.features
                })
              }
            >
              <span className={classes.templateName}>
                <AutoAwesomeIcon />
                {tpl.name}
              </span>
              <span className={classes.sub}>{p(`templates.${tpl.key}`)}</span>
            </ButtonBase>
          ))}
        </div>
      </div>

      {loading ? (
        <div className={classes.center}>
          <BoxLoader />
        </div>
      ) : (
        <div className={classes.grid}>
          {plans.map((plan, index) => (
            <div
              key={plan.id}
              className={`${classes.card}${plan.id === featuredId ? ` ${classes.featured}` : ""}`}
              style={{ animationDelay: `${index * 40}ms` }}
            >
              {plan.id === featuredId && (
                <span className={classes.ribbon}>{p("popular")}</span>
              )}
              <div>
                <span className={classes.planName}>{plan.name}</span>
                <span className={classes.badge}>
                  {plan.isPublic ? p("public") : p("private")}
                </span>
              </div>
              <div className={classes.price}>
                <span className={classes.priceValue}>
                  {safeValueFormat(plan.value, plan.currency || "BRL")}
                </span>
                <span className={classes.priceUnit}>{p("perMonth")}</span>
              </div>
              <div className={classes.limits}>
                {["users", "connections", "queues"].map(key => (
                  <div key={key} className={classes.limit}>
                    <div className={classes.limitValue}>{plan[key]}</div>
                    <div className={classes.limitLabel}>{p(`form.${key}`)}</div>
                  </div>
                ))}
              </div>
              <ul className={classes.features}>
                {PLAN_FEATURES.map(feature => {
                  const on = plan[feature] !== false;
                  return (
                    <li
                      key={feature}
                      className={`${classes.feature}${on ? "" : ` ${classes.off}`}`}
                    >
                      {on ? (
                        <CheckRoundedIcon className={classes.on} />
                      ) : (
                        <CloseRoundedIcon />
                      )}
                      {i18n.t(`planFeatures.names.${feature}`)}
                    </li>
                  );
                })}
              </ul>
              <div className={classes.actions}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="primary"
                  className={classes.pill}
                  startIcon={<EditOutlinedIcon />}
                  onClick={() => setEditing(plan)}
                >
                  {p("editShort")}
                </Button>
                <IconButton
                  onClick={() => setRemoving(plan)}
                  aria-label={p("delete")}
                >
                  <DeleteOutlineRoundedIcon />
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      )}

      <PlanForm
        open={!!editing}
        initial={editing || {}}
        onClose={() => setEditing(null)}
        onSave={handleSave}
        saving={saving}
      />
      <ConfirmationModal
        title={p("deleteTitle", { name: removing?.name })}
        open={!!removing}
        onClose={() => setRemoving(null)}
        onConfirm={async () => {
          try {
            await remove(removing.id);
            toast.success(p("deleted"));
            await load();
          } catch (e) {
            toast.error(p("deleteError"));
          }
          setRemoving(null);
        }}
      >
        {p("deleteText")}
      </ConfirmationModal>
    </div>
  );
};

export default PlansManager;
