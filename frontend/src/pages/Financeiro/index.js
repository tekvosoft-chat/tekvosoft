import React, { useContext, useEffect, useMemo, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import ButtonBase from "@material-ui/core/ButtonBase";
import IconButton from "@material-ui/core/IconButton";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import Switch from "@material-ui/core/Switch";
import Typography from "@material-ui/core/Typography";
import ArrowForwardRoundedIcon from "@material-ui/icons/ArrowForwardRounded";
import AccountBalanceWalletOutlinedIcon from "@material-ui/icons/AccountBalanceWalletOutlined";
import EventAvailableOutlinedIcon from "@material-ui/icons/EventAvailableOutlined";
import FlashOnRoundedIcon from "@material-ui/icons/FlashOnRounded";
import TrendingUpRoundedIcon from "@material-ui/icons/TrendingUpRounded";
import MoreHorizRoundedIcon from "@material-ui/icons/MoreHorizRounded";
import InfoOutlinedIcon from "@material-ui/icons/InfoOutlined";
import SyncRoundedIcon from "@material-ui/icons/SyncRounded";
import ErrorOutlineRoundedIcon from "@material-ui/icons/ErrorOutlineRounded";
import ScheduleRoundedIcon from "@material-ui/icons/ScheduleRounded";
import moment from "moment";

import MainContainer from "../../components/MainContainer";
import PaymentDialog from "../../components/PaymentDialog";
import ConfirmationModal from "../../components/ConfirmationModal";
import PageLoader from "../../components/ui/PageLoader";
import api from "../../services/api";
import { safeValueFormat } from "../../helpers/safeValueFormat";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import { i18n } from "../../translate/i18n";
import { alpha } from "../../theme/tokens";
import CardBrand, { lastDigitsOf } from "./CardBrand";
import AddressDialog from "./AddressDialog";
import PlansDialog from "./PlansDialog";
import Paywall from "../../components/Paywall";

/**
 * Minha Assinatura (menu Financeiro).
 *
 * Duas colunas: à esquerda o plano (assinatura atual, valor, vencimento,
 * sugestão de upgrade) e o histórico de pagamento; à direita a renovação
 * (cartão salvo e renovação automática) e o endereço de cobrança. Fatura
 * em aberto aparece numa faixa no topo, com o botão de pagar.
 */
const DAY = 24 * 60 * 60 * 1000;
const HISTORY_PREVIEW = 4;

const daysUntil = date =>
  Math.round(
    (moment(date).startOf("day").valueOf() -
      moment().startOf("day").valueOf()) /
      DAY
  );

const situationOf = invoice => {
  if (invoice.status === "paid") return "paid";
  const days = daysUntil(invoice.dueDate);
  if (days < 0) return "overdue";
  if (days <= 3) return "soon";
  return "open";
};

const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  const sem = t.semantic;
  const dark = !!t.isDark;
  const box = {
    borderRadius: t.radius.lg,
    border: `1px solid ${t.border}`,
    backgroundColor: dark ? alpha("#FFFFFF", 0.02) : t.surfaceSunken
  };
  return {
    page: {
      overflowY: "auto",
      ...theme.scrollbarStyles,
      "& > div > *": { flexShrink: 0 }
    },
    head: { display: "flex", flexDirection: "column", gap: 4 },
    title: {
      fontSize: "1.875rem",
      fontWeight: 800,
      letterSpacing: "-0.02em",
      color: t.brand.text,
      [theme.breakpoints.down("xs")]: { fontSize: "1.5rem" }
    },
    subtitle: { fontSize: "0.9375rem", color: theme.palette.text.secondary },

    layout: {
      display: "grid",
      gridTemplateColumns: "minmax(0, 1.45fr) minmax(0, 1fr)",
      alignItems: "start",
      gap: theme.spacing(3),
      paddingBottom: theme.spacing(3),
      [theme.breakpoints.down("sm")]: { gridTemplateColumns: "minmax(0, 1fr)" }
    },
    column: {
      display: "flex",
      flexDirection: "column",
      gap: theme.spacing(3),
      minWidth: 0
    },
    panel: {
      borderRadius: t.radius.xl,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface,
      overflow: "hidden",
      animation: "$rise .45s ease both"
    },
    panelBody: {
      padding: theme.spacing(3),
      [theme.breakpoints.down("xs")]: { padding: theme.spacing(2) }
    },
    panelHead: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: theme.spacing(1),
      marginBottom: theme.spacing(2.5)
    },
    panelTitle: {
      fontSize: "1.25rem",
      fontWeight: 700,
      color: theme.palette.text.primary
    },
    ghostBtn: {
      height: 38,
      padding: "0 16px",
      borderRadius: t.radius.md,
      border: `1px solid ${t.borderStrong}`,
      textTransform: "none",
      fontWeight: 600,
      whiteSpace: "nowrap",
      color: theme.palette.text.primary,
      "& .MuiButton-startIcon, & .MuiButton-endIcon": {
        "& svg": { fontSize: 18 }
      }
    },

    // ── faixa de fatura em aberto ──
    alert: {
      display: "flex",
      alignItems: "center",
      gap: theme.spacing(1.5),
      padding: theme.spacing(1.5, 2),
      borderRadius: t.radius.lg,
      border: `1px solid ${t.brand.border}`,
      backgroundColor: t.brand.textSoft,
      color: theme.palette.text.primary,
      animation: "$rise .4s ease both",
      "& > svg": { color: t.brand.text, flex: "none" },
      [theme.breakpoints.down("xs")]: { flexWrap: "wrap" }
    },
    alertWarn: {
      borderColor: alpha(sem.warning, 0.4),
      backgroundColor: sem.warningSoft,
      "& > svg": { color: sem.warning }
    },
    alertDanger: {
      borderColor: alpha(sem.danger, 0.4),
      backgroundColor: sem.dangerSoft,
      "& > svg": { color: sem.danger }
    },
    alertText: { flex: 1, minWidth: 0, fontSize: "0.9375rem" },
    alertStrong: { fontWeight: 700 },

    // ── assinatura atual ──
    hero: {
      position: "relative",
      minHeight: 156,
      padding: theme.spacing(4, 4.5),
      overflow: "hidden",
      borderBottom: `1px solid ${t.border}`,
      background: `linear-gradient(120deg, ${alpha(t.brand.main, dark ? 0.26 : 0.16)} 0%, ${alpha(t.brand.main, dark ? 0.08 : 0.05)} 100%)`,
      [theme.breakpoints.down("xs")]: { padding: theme.spacing(3, 2.5) }
    },
    heroArt: {
      position: "absolute",
      right: -8,
      top: "50%",
      transform: "translateY(-50%) rotate(12deg)",
      fontSize: 210,
      color: t.brand.main,
      opacity: dark ? 0.85 : 0.7,
      filter: `drop-shadow(0 18px 30px ${alpha(t.brand.main, 0.45)})`,
      pointerEvents: "none",
      [theme.breakpoints.down("xs")]: {
        fontSize: 150,
        right: -30,
        opacity: 0.35
      }
    },
    heroText: { position: "relative", zIndex: 1, maxWidth: "70%" },
    overline: {
      fontSize: "0.75rem",
      fontWeight: 600,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: theme.palette.text.secondary
    },
    planName: {
      margin: theme.spacing(1.25, 0, 1),
      fontSize: "2rem",
      fontWeight: 700,
      lineHeight: 1.15,
      letterSpacing: "-0.02em",
      color: t.brand.text,
      [theme.breakpoints.down("xs")]: { fontSize: "1.625rem" }
    },
    heroActions: {
      display: "flex",
      alignItems: "center",
      flexWrap: "wrap",
      gap: theme.spacing(2)
    },
    changeBtn: {
      height: 34,
      padding: "0 14px",
      borderRadius: t.radius.pill,
      textTransform: "none",
      fontWeight: 700
    },
    linkBtn: {
      gap: 6,
      fontSize: "0.8125rem",
      fontWeight: 600,
      color: theme.palette.text.primary,
      "& svg": { fontSize: 16, transition: "transform .15s ease" },
      "&:hover svg": { transform: "translateX(3px)" }
    },
    stats: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: theme.spacing(2),
      [theme.breakpoints.down("xs")]: { gap: theme.spacing(1) }
    },
    stat: {
      ...box,
      display: "flex",
      alignItems: "center",
      gap: theme.spacing(1.5),
      padding: theme.spacing(1.75, 2),
      [theme.breakpoints.down("xs")]: { padding: theme.spacing(1.25) }
    },
    statIcon: {
      flex: "none",
      width: 32,
      height: 32,
      borderRadius: t.radius.sm,
      border: `1px solid ${t.border}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: theme.palette.text.secondary,
      "& svg": { fontSize: 18 }
    },
    statLabel: { fontSize: "0.875rem", color: theme.palette.text.secondary },
    statValue: {
      fontSize: "1rem",
      fontWeight: 700,
      color: theme.palette.text.primary,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    },
    statDanger: { color: sem.danger },

    upgrade: {
      ...box,
      marginTop: theme.spacing(2),
      display: "flex",
      alignItems: "center",
      gap: theme.spacing(2),
      padding: theme.spacing(3),
      background: `linear-gradient(120deg, ${alpha(t.brand.main, dark ? 0.1 : 0.06)} 0%, transparent 70%)`,
      [theme.breakpoints.down("xs")]: {
        flexDirection: "column",
        alignItems: "flex-start",
        padding: theme.spacing(2)
      }
    },
    upgradeText: { flex: 1, minWidth: 0 },
    upgradeName: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      margin: theme.spacing(1, 0),
      fontSize: "1.25rem",
      fontWeight: 700,
      color: t.brand.text,
      "& svg": { fontSize: 20 }
    },
    upgradeDesc: {
      marginTop: theme.spacing(1),
      fontSize: "0.9375rem",
      lineHeight: 1.45,
      color: theme.palette.text.secondary
    },
    pill: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      height: 24,
      padding: "0 10px",
      borderRadius: t.radius.pill,
      fontSize: "0.75rem",
      fontWeight: 600,
      whiteSpace: "nowrap",
      "& svg": { fontSize: 14 }
    },
    tone_paid: {
      color: sem.success,
      backgroundColor: sem.successSoft,
      border: `1px solid ${alpha(sem.success, 0.35)}`
    },
    tone_open: {
      color: t.brand.text,
      backgroundColor: t.brand.textSoft,
      border: `1px solid ${t.brand.textBorder}`
    },
    tone_soon: {
      color: sem.warning,
      backgroundColor: sem.warningSoft,
      border: `1px solid ${alpha(sem.warning, 0.35)}`
    },
    tone_overdue: {
      color: sem.danger,
      backgroundColor: sem.dangerSoft,
      border: `1px solid ${alpha(sem.danger, 0.35)}`
    },

    // ── histórico ──
    rows: { display: "flex", flexDirection: "column" },
    row: {
      display: "flex",
      alignItems: "center",
      gap: theme.spacing(1.5),
      padding: theme.spacing(1.5, 0),
      "& + &": { borderTop: `1px solid ${t.border}` }
    },
    rowText: { flex: 1, minWidth: 0 },
    rowTitle: {
      fontSize: "0.9375rem",
      fontWeight: 700,
      color: theme.palette.text.primary,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    rowSub: {
      marginTop: 2,
      fontSize: "0.875rem",
      color: theme.palette.text.secondary
    },
    rowSide: {
      display: "flex",
      alignItems: "center",
      gap: theme.spacing(1),
      flex: "none",
      [theme.breakpoints.down("xs")]: {
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 4
      }
    },
    payBtn: {
      height: 28,
      borderRadius: t.radius.pill,
      textTransform: "none",
      fontWeight: 700
    },
    empty: {
      padding: theme.spacing(2, 0),
      fontSize: "0.9375rem",
      color: theme.palette.text.secondary
    },

    // ── renovação ──
    cardRow: {
      ...box,
      display: "flex",
      alignItems: "center",
      gap: theme.spacing(1.5),
      padding: theme.spacing(2)
    },
    cardLogo: {
      flex: "none",
      width: 56,
      height: 44,
      borderRadius: t.radius.md,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#141414",
      border: `1px solid ${dark ? "#2A2A2A" : "#141414"}`
    },
    cardText: { flex: 1, minWidth: 0 },
    cardNumber: {
      fontSize: "0.9375rem",
      fontWeight: 700,
      letterSpacing: "0.04em",
      color: theme.palette.text.primary
    },
    cardSub: { fontSize: "0.8125rem", color: theme.palette.text.secondary },
    moreBtn: {
      width: 36,
      height: 36,
      borderRadius: t.radius.md,
      border: `1px solid ${t.borderStrong}`
    },
    noCard: {
      ...box,
      borderStyle: "dashed",
      padding: theme.spacing(2),
      display: "flex",
      alignItems: "center",
      gap: theme.spacing(1.5),
      [theme.breakpoints.down("xs")]: {
        flexDirection: "column",
        alignItems: "flex-start"
      }
    },
    switchRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: theme.spacing(1),
      padding: theme.spacing(2, 0),
      borderBottom: `1px solid ${t.border}`,
      fontSize: "0.9375rem",
      fontWeight: 600,
      color: theme.palette.text.primary
    },
    note: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      paddingTop: theme.spacing(1.5),
      fontSize: "0.8125rem",
      color: theme.palette.text.secondary,
      "& svg": { fontSize: 16, flex: "none" }
    },

    // ── endereço ──
    address: {
      ...box,
      padding: theme.spacing(2),
      fontSize: "0.9375rem",
      lineHeight: 1.5,
      color: theme.palette.text.primary
    },
    addressEmpty: { color: theme.palette.text.secondary },

    center: { display: "flex", justifyContent: "center", padding: 48 },
    "@keyframes rise": {
      from: { opacity: 0, transform: "translateY(8px)" },
      to: { opacity: 1, transform: "none" }
    }
  };
});

const formatCep = cep =>
  String(cep || "")
    .replace(/\D/g, "")
    .replace(/^(\d{5})(\d{3})$/, "$1-$2");

const Financeiro = () => {
  const classes = useStyles();
  const { user } = useContext(AuthContext);
  const f = (key, opts) => i18n.t(`financePage.${key}`, opts);
  const isAdmin = user?.profile === "admin";

  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [plans, setPlans] = useState([]);
  const [methods, setMethods] = useState(null);
  const [paying, setPaying] = useState(null);
  const [plansOpen, setPlansOpen] = useState(false);
  const [addressOpen, setAddressOpen] = useState(false);
  const [cardMenu, setCardMenu] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [showAll, setShowAll] = useState(false);
  // troca de plano em tela cheia (com GIF); guarda qual plano já vem marcado
  const [changer, setChanger] = useState(null);
  const [planChanged, setPlanChanged] = useState(false);

  const loadInvoices = () =>
    api
      .get("/invoices/all")
      .then(({ data }) => setInvoices(Array.isArray(data) ? data : []));

  const loadMethods = () =>
    api
      .get("/subscription/methods")
      .then(({ data }) => setMethods(data || null))
      .catch(() => {});

  useEffect(() => {
    loadInvoices()
      .catch(err => toastError(err))
      .finally(() => setLoading(false));
    // planos e cartão recarregam quando a aba volta ao foco: o que o dono
    // da plataforma liberar aparece sem sair e entrar de novo
    const load = () => {
      api
        .get("/plans/listpublic")
        .then(({ data }) => setPlans(Array.isArray(data) ? data : []))
        .catch(() => {});
      loadMethods();
    };
    load();
    const onFocus = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const company = user?.company;
  const currentPlan = useMemo(
    () => plans.find(p => p.id === company?.planId) || company?.plan || null,
    [plans, company]
  );
  // próximo degrau: o plano público mais barato acima do atual
  const nextPlan = useMemo(() => {
    const value = Number(currentPlan?.value);
    if (!currentPlan || Number.isNaN(value)) return null;
    return (
      plans
        .filter(p => p.id !== currentPlan.id && Number(p.value) > value)
        .sort((a, b) => Number(a.value) - Number(b.value))[0] || null
    );
  }, [plans, currentPlan]);

  const sorted = useMemo(() => {
    const rank = { overdue: 0, soon: 1, open: 2, paid: 3 };
    return [...invoices].sort((a, b) => {
      const ra = rank[situationOf(a)];
      const rb = rank[situationOf(b)];
      if (ra !== rb) return ra - rb;
      if (ra === 3) return new Date(b.dueDate) - new Date(a.dueDate);
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  }, [invoices]);
  const next = sorted.find(inv => inv.status !== "paid");
  const lastPaid = sorted.find(inv => inv.status === "paid");

  const dueDate =
    company?.dueDate && moment(company.dueDate).isValid()
      ? company.dueDate
      : null;
  const expired = dueDate && daysUntil(dueDate) < 0;

  const hint = invoice => {
    const kind = situationOf(invoice);
    if (kind === "paid") return f("statusPaid");
    const days = daysUntil(invoice.dueDate);
    if (days === 0) return f("dueToday");
    if (days === 1) return f("dueTomorrow");
    if (days > 0) return f("daysLeft", { count: days });
    return f("overdueFor", { count: Math.abs(days) });
  };

  const toggleAutoRenew = async enabled => {
    setMethods(m => ({
      ...m,
      savedCard: { ...m.savedCard, autoRenew: enabled }
    }));
    try {
      const { data } = await api.put("/subscription/auto-renew", { enabled });
      setMethods(m => ({ ...m, savedCard: data }));
    } catch (err) {
      toastError(err);
      loadMethods();
    }
  };

  const removeCard = async () => {
    try {
      await api.delete("/subscription/card");
      loadMethods();
    } catch (err) {
      toastError(err);
    }
  };

  const card = methods?.savedCard;
  const address = methods?.address;
  const history = showAll ? sorted : sorted.slice(0, HISTORY_PREVIEW);
  const nextKind = next && situationOf(next);

  if (loading && !invoices.length) {
    return (
      <MainContainer className={classes.page}>
        <PageLoader />
      </MainContainer>
    );
  }

  return (
    <MainContainer className={classes.page}>
      <PaymentDialog
        open={!!paying}
        invoice={paying}
        onClose={() => setPaying(null)}
        onPaid={() => {
          setPaying(null);
          loadInvoices().catch(() => {});
          loadMethods();
        }}
      />
      <PlansDialog
        open={plansOpen}
        plans={
          currentPlan && !plans.some(p => p.id === currentPlan.id)
            ? [currentPlan, ...plans]
            : plans
        }
        currentId={currentPlan?.id}
        canChoose={false}
        onClose={() => setPlansOpen(false)}
      />
      <AddressDialog
        open={addressOpen}
        address={address}
        onClose={() => setAddressOpen(false)}
        onSaved={saved => {
          setMethods(m => ({ ...m, address: saved }));
          setAddressOpen(false);
        }}
      />
      <ConfirmationModal
        title={f("cardRemove")}
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        onConfirm={removeCard}
      >
        {f("cardRemoveConfirm")}
      </ConfirmationModal>

      {changer && (
        <Paywall
          user={user}
          mode="change"
          preselect={changer.preselect}
          onChanged={() => setPlanChanged(true)}
          onClose={() => {
            // trocou de plano: recarrega para o sistema todo pegar os limites
            if (planChanged) window.location.reload();
            else setChanger(null);
          }}
        />
      )}

      <div className={classes.head}>
        <Typography component="h1" className={classes.title}>
          {f("pageTitle")}
        </Typography>
        <Typography className={classes.subtitle}>
          {f("pageSubtitle")}
        </Typography>
      </div>

      {next && (
        <div
          className={`${classes.alert}${
            nextKind === "overdue"
              ? ` ${classes.alertDanger}`
              : nextKind === "soon"
                ? ` ${classes.alertWarn}`
                : ""
          }`}
        >
          {nextKind === "overdue" ? (
            <ErrorOutlineRoundedIcon />
          ) : (
            <ScheduleRoundedIcon />
          )}
          <span className={classes.alertText}>
            <span className={classes.alertStrong}>
              {f("alertOpen", {
                value: safeValueFormat(next.value, next.currency)
              })}
            </span>{" "}
            · {hint(next)}
          </span>
          <Button
            variant="contained"
            color="primary"
            disableElevation
            className={classes.payBtn}
            onClick={() => setPaying(next)}
          >
            {f("payNow")}
          </Button>
        </div>
      )}

      <div className={classes.layout}>
        {/* ── coluna do plano ── */}
        <div className={classes.column}>
          <section className={classes.panel}>
            <div className={classes.hero}>
              <FlashOnRoundedIcon className={classes.heroArt} />
              <div className={classes.heroText}>
                <div className={classes.overline}>{f("currentPlan")}</div>
                <div className={classes.planName}>
                  {currentPlan?.name || f("noPlan")}
                </div>
                <div className={classes.heroActions}>
                  {isAdmin && plans.length > 0 && (
                    <Button
                      variant="contained"
                      color="primary"
                      disableElevation
                      className={classes.changeBtn}
                      onClick={() => setChanger({})}
                    >
                      {f("changePlan")}
                    </Button>
                  )}
                  <ButtonBase
                    className={classes.linkBtn}
                    onClick={() => setPlansOpen(true)}
                  >
                    {f("planBenefits")}
                    <ArrowForwardRoundedIcon />
                  </ButtonBase>
                </div>
              </div>
            </div>

            <div className={classes.panelBody}>
              <div className={classes.stats}>
                <div className={classes.stat}>
                  <span className={classes.statIcon}>
                    <AccountBalanceWalletOutlinedIcon />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div className={classes.statLabel}>
                      {lastPaid ? f("valuePaid") : f("planValue")}
                    </div>
                    <div className={classes.statValue}>
                      {lastPaid
                        ? safeValueFormat(lastPaid.value, lastPaid.currency)
                        : currentPlan?.value !== undefined
                          ? safeValueFormat(
                              currentPlan.value,
                              currentPlan.currency || "BRL"
                            )
                          : "—"}
                    </div>
                  </div>
                </div>
                <div className={classes.stat}>
                  <span className={classes.statIcon}>
                    <EventAvailableOutlinedIcon />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div className={classes.statLabel}>
                      {expired ? f("expiredOn") : f("expiresOn")}
                    </div>
                    <div
                      className={`${classes.statValue}${expired ? ` ${classes.statDanger}` : ""}`}
                    >
                      {dueDate ? moment(dueDate).format("DD/MM/YYYY") : "—"}
                    </div>
                  </div>
                </div>
              </div>

              {nextPlan && (
                <div className={classes.upgrade}>
                  <div className={classes.upgradeText}>
                    <div className={classes.overline}>{f("upgradeTitle")}</div>
                    <div className={classes.upgradeName}>
                      {nextPlan.name}
                      <TrendingUpRoundedIcon />
                    </div>
                    <span className={`${classes.pill} ${classes.tone_paid}`}>
                      {safeValueFormat(
                        nextPlan.value,
                        nextPlan.currency || "BRL"
                      )}
                      {f("perMonth")}
                    </span>
                    <div className={classes.upgradeDesc}>
                      {f("upgradeText", {
                        users: nextPlan.users,
                        connections: nextPlan.connections
                      })}
                    </div>
                  </div>
                  {isAdmin && (
                    <Button
                      className={classes.ghostBtn}
                      endIcon={<ArrowForwardRoundedIcon />}
                      onClick={() => setChanger({ preselect: nextPlan.id })}
                    >
                      {f("upgradeBtn")}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </section>

          <section className={classes.panel}>
            <div className={classes.panelBody}>
              <div className={classes.panelHead}>
                <Typography component="h2" className={classes.panelTitle}>
                  {f("historyTitle")}
                </Typography>
                {sorted.length > HISTORY_PREVIEW && (
                  <Button
                    className={classes.ghostBtn}
                    endIcon={<ArrowForwardRoundedIcon />}
                    onClick={() => setShowAll(v => !v)}
                  >
                    {showAll ? f("seeLess") : f("seeAll")}
                  </Button>
                )}
              </div>
              {sorted.length === 0 ? (
                <div className={classes.empty}>{f("emptyText")}</div>
              ) : (
                <div className={classes.rows}>
                  {history.map(invoice => {
                    const kind = situationOf(invoice);
                    return (
                      <div key={invoice.id} className={classes.row}>
                        <div className={classes.rowText}>
                          <div className={classes.rowTitle}>
                            {(invoice.detail || f("invoice")).split(" - ")[0]}
                          </div>
                          <div className={classes.rowSub}>
                            {moment(invoice.dueDate).format("DD/MM/YYYY")} ·{" "}
                            {safeValueFormat(invoice.value, invoice.currency)}
                          </div>
                        </div>
                        <div className={classes.rowSide}>
                          <span
                            className={`${classes.pill} ${classes[`tone_${kind}`]}`}
                          >
                            {hint(invoice)}
                          </span>
                          {kind !== "paid" && (
                            <Button
                              size="small"
                              color="primary"
                              variant={
                                kind === "open" ? "outlined" : "contained"
                              }
                              disableElevation
                              className={classes.payBtn}
                              onClick={() => setPaying(invoice)}
                            >
                              {f("pay")}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ── coluna de pagamento ── */}
        <div className={classes.column}>
          <section className={classes.panel}>
            <div className={classes.panelBody}>
              <div className={classes.panelHead}>
                <Typography component="h2" className={classes.panelTitle}>
                  {f("renewalTitle")}
                </Typography>
              </div>

              {card?.hasCard ? (
                <div className={classes.cardRow}>
                  <span className={classes.cardLogo}>
                    <CardBrand label={card.label} />
                  </span>
                  <div className={classes.cardText}>
                    <div className={classes.cardNumber}>
                      •••• {lastDigitsOf(card.label)}
                    </div>
                    <div className={classes.cardSub}>
                      {card.expiry
                        ? f("cardExpires", { date: card.expiry })
                        : f("cardSaved")}
                    </div>
                  </div>
                  <span
                    className={`${classes.pill} ${
                      card.autoRenew ? classes.tone_paid : classes.tone_soon
                    }`}
                  >
                    {card.autoRenew ? f("cardActive") : f("cardPaused")}
                  </span>
                  {isAdmin && (
                    <IconButton
                      className={classes.moreBtn}
                      aria-label={f("cardMenu")}
                      onClick={e => setCardMenu(e.currentTarget)}
                    >
                      <MoreHorizRoundedIcon fontSize="small" />
                    </IconButton>
                  )}
                  <Menu
                    anchorEl={cardMenu}
                    open={!!cardMenu}
                    onClose={() => setCardMenu(null)}
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    transformOrigin={{ vertical: "top", horizontal: "right" }}
                    getContentAnchorEl={null}
                  >
                    <MenuItem
                      onClick={() => {
                        setCardMenu(null);
                        setConfirmRemove(true);
                      }}
                    >
                      {f("cardRemove")}
                    </MenuItem>
                  </Menu>
                </div>
              ) : (
                <div className={classes.noCard}>
                  <div className={classes.cardText}>
                    <div className={classes.cardNumber}>{f("noCard")}</div>
                    <div className={classes.cardSub}>{f("noCardNote")}</div>
                  </div>
                  {next && isAdmin && (
                    <Button
                      className={classes.ghostBtn}
                      onClick={() => setPaying(next)}
                    >
                      {f("addCard")}
                    </Button>
                  )}
                </div>
              )}

              <div className={classes.switchRow}>
                {card?.hasCard && card.autoRenew
                  ? f("autoRenewOn")
                  : f("autoRenewOff")}
                <Switch
                  color="primary"
                  checked={!!(card?.hasCard && card.autoRenew)}
                  disabled={!card?.hasCard || !isAdmin}
                  onChange={e => toggleAutoRenew(e.target.checked)}
                />
              </div>
              <div className={classes.note}>
                <InfoOutlinedIcon />
                {f("cardNote")}
              </div>
            </div>
          </section>

          <section className={classes.panel}>
            <div className={classes.panelBody}>
              <div className={classes.panelHead}>
                <Typography component="h2" className={classes.panelTitle}>
                  {f("addressTitle")}
                </Typography>
                {isAdmin && (
                  <Button
                    className={classes.ghostBtn}
                    startIcon={<SyncRoundedIcon />}
                    onClick={() => setAddressOpen(true)}
                  >
                    {f("addressUpdate")}
                  </Button>
                )}
              </div>
              <div className={classes.address}>
                {address?.postalCode ? (
                  <>
                    {(address.street || address.number) && (
                      <div>
                        {[
                          address.street,
                          address.number &&
                            (address.street
                              ? address.number
                              : f("addressNumber", { number: address.number })),
                          address.complement
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                    )}
                    {(address.district || address.city) && (
                      <div>
                        {[
                          address.district,
                          [address.city, address.state]
                            .filter(Boolean)
                            .join("/")
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                    )}
                    <div>{formatCep(address.postalCode)}</div>
                  </>
                ) : (
                  <span className={classes.addressEmpty}>
                    {f("addressEmpty")}
                  </span>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </MainContainer>
  );
};

export default Financeiro;
