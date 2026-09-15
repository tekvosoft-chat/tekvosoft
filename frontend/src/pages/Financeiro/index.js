import React, { useContext, useEffect, useMemo, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import EventRoundedIcon from "@material-ui/icons/EventRounded";
import CheckCircleRoundedIcon from "@material-ui/icons/CheckCircleRounded";
import ScheduleRoundedIcon from "@material-ui/icons/ScheduleRounded";
import ErrorOutlineRoundedIcon from "@material-ui/icons/ErrorOutlineRounded";
import ReceiptRoundedIcon from "@material-ui/icons/ReceiptRounded";
import moment from "moment";

import MainContainer from "../../components/MainContainer";
import SubscriptionModal from "../../components/SubscriptionModal";
import BoxLoader from "../../components/ui/BoxLoader";
import EmptyState from "../../components/ui/EmptyState";
import api from "../../services/api";
import { safeValueFormat } from "../../helpers/safeValueFormat";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import { i18n } from "../../translate/i18n";

/**
 * Financeiro: as cobranças em cartões, em vez da tabela.
 *
 * O que a pessoa quer saber ao abrir esta tela é "quanto falta" e "tem algo
 * para pagar?". Então no topo fica a situação da assinatura com os dias
 * restantes, logo abaixo a próxima cobrança em destaque, e depois o
 * histórico — cada fatura com o valor grande, o vencimento e um aviso em
 * linguagem simples (faltam 5 dias, vence hoje, venceu há 2 dias).
 * As rotas e o pagamento continuam os mesmos.
 */
const DAY = 24 * 60 * 60 * 1000;
const CYCLE_DAYS = 30;

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
  return {
    page: {
      overflowY: "auto",
      ...theme.scrollbarStyles,
      // a página rola inteira: nenhum bloco pode ser espremido pela altura
      "& > div > *": { flexShrink: 0 }
    },
    head: { display: "flex", flexDirection: "column", gap: 2 },
    title: {
      fontSize: "1.5rem",
      fontWeight: 700,
      letterSpacing: "-0.02em",
      color: theme.palette.text.primary
    },
    subtitle: { fontSize: "0.9375rem", color: theme.palette.text.secondary },

    // ── assinatura ──
    hero: {
      position: "relative",
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      gap: theme.spacing(3),
      padding: theme.spacing(3),
      borderRadius: t.radius.xl,
      color: t.brand.contrastText,
      background: `linear-gradient(135deg, ${t.brand.main} 0%, ${t.brand.hover} 100%)`,
      boxShadow: `0 16px 40px -18px ${t.brand.main}`,
      animation: "$rise .45s ease both",
      "&::after": {
        content: "''",
        position: "absolute",
        right: -60,
        top: -60,
        width: 220,
        height: 220,
        borderRadius: "50%",
        background: "rgba(255, 255, 255, 0.10)"
      },
      [theme.breakpoints.down("xs")]: {
        flexDirection: "column",
        alignItems: "flex-start",
        gap: theme.spacing(2),
        padding: theme.spacing(2.5)
      }
    },
    heroWarn: {
      background: `linear-gradient(135deg, ${sem.danger} 0%, #8E1330 100%)`,
      boxShadow: `0 16px 40px -18px ${sem.danger}`
    },
    ring: {
      position: "relative",
      flex: "none",
      width: 116,
      height: 116,
      zIndex: 1,
      "& svg": { width: "100%", height: "100%", transform: "rotate(-90deg)" },
      [theme.breakpoints.down("xs")]: { width: 96, height: 96 }
    },
    ringLabel: {
      position: "absolute",
      inset: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      lineHeight: 1
    },
    ringNum: {
      fontSize: "2.25rem",
      fontWeight: 800,
      letterSpacing: "-0.03em",
      [theme.breakpoints.down("xs")]: { fontSize: "1.875rem" }
    },
    ringUnit: { fontSize: "0.75rem", opacity: 0.85, marginTop: 4 },
    heroText: { position: "relative", zIndex: 1, flex: 1, minWidth: 0 },
    heroTitle: {
      fontSize: "1.25rem",
      fontWeight: 700,
      lineHeight: 1.3,
      [theme.breakpoints.down("xs")]: { fontSize: "1.125rem" }
    },
    heroSub: { marginTop: 6, fontSize: "0.9375rem", opacity: 0.9 },
    heroBtn: {
      marginTop: theme.spacing(2),
      backgroundColor: "#FFFFFF",
      color: t.brand.main,
      fontWeight: 700,
      "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.9)" }
    },

    // ── resumo ──
    stats: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: theme.spacing(1.5),
      [theme.breakpoints.down("xs")]: { gap: theme.spacing(1) }
    },
    stat: {
      padding: theme.spacing(1.75, 2),
      borderRadius: t.radius.lg,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface,
      animation: "$rise .45s ease both",
      [theme.breakpoints.down("xs")]: { padding: theme.spacing(1.25) }
    },
    statLabel: {
      fontSize: "0.75rem",
      fontWeight: 600,
      color: theme.palette.text.secondary
    },
    statValue: {
      marginTop: 2,
      fontSize: "1.25rem",
      fontWeight: 700,
      color: theme.palette.text.primary,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      [theme.breakpoints.down("xs")]: { fontSize: "1rem" }
    },

    sectionTitle: {
      marginTop: theme.spacing(1),
      fontSize: "0.8125rem",
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      color: theme.palette.text.secondary
    },

    // ── faturas ──
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
      gap: theme.spacing(1.5),
      paddingBottom: theme.spacing(2)
    },
    card: {
      position: "relative",
      display: "flex",
      flexDirection: "column",
      gap: theme.spacing(1.5),
      padding: theme.spacing(2),
      paddingLeft: theme.spacing(2.5),
      borderRadius: t.radius.lg,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface,
      overflow: "hidden",
      transition: "transform .18s ease, box-shadow .18s ease",
      animation: "$rise .4s ease both",
      "&::before": {
        content: "''",
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 5
      },
      "&:hover": {
        transform: "translateY(-2px)",
        boxShadow: "0 10px 28px -16px rgba(12, 10, 20, 0.35)"
      }
    },
    featured: {
      borderColor: t.brand.border,
      boxShadow: `0 0 0 3px ${t.brand.soft}`
    },
    accent_paid: { "&::before": { backgroundColor: sem.success } },
    accent_open: { "&::before": { backgroundColor: t.brand.main } },
    accent_soon: { "&::before": { backgroundColor: sem.warning } },
    accent_overdue: { "&::before": { backgroundColor: sem.danger } },
    cardTop: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: theme.spacing(1)
    },
    detail: {
      fontSize: "0.875rem",
      fontWeight: 600,
      color: theme.palette.text.primary,
      wordBreak: "break-word"
    },
    number: { fontSize: "0.75rem", color: theme.palette.text.secondary },
    value: {
      fontSize: "1.75rem",
      fontWeight: 800,
      letterSpacing: "-0.02em",
      color: theme.palette.text.primary,
      lineHeight: 1.1
    },
    pill: {
      flex: "none",
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      padding: "3px 10px",
      borderRadius: t.radius.pill,
      fontSize: "0.75rem",
      fontWeight: 700,
      whiteSpace: "nowrap",
      "& svg": { fontSize: 15 }
    },
    tone_paid: { backgroundColor: sem.successSoft, color: sem.success },
    tone_open: { backgroundColor: t.brand.textSoft, color: t.brand.text },
    tone_soon: { backgroundColor: sem.warningSoft, color: sem.warning },
    tone_overdue: { backgroundColor: sem.dangerSoft, color: sem.danger },
    cardFoot: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: theme.spacing(1),
      paddingTop: theme.spacing(1.5),
      borderTop: `1px dashed ${t.border}`
    },
    due: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontSize: "0.8125rem",
      color: theme.palette.text.secondary,
      "& svg": { fontSize: 18 }
    },
    center: { display: "flex", justifyContent: "center", padding: 24 },
    "@keyframes rise": {
      from: { opacity: 0, transform: "translateY(8px)" },
      to: { opacity: 1, transform: "none" }
    }
  };
});

// o número cabe dentro do anel mesmo com vencimentos muito distantes
const digitsSize = length =>
  length <= 2 ? undefined : length === 3 ? "1.75rem" : "1.25rem";

const Ring = ({ days, classes }) => {
  const size = 116;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const ratio = Math.max(0, Math.min(1, days / CYCLE_DAYS));
  return (
    <div className={classes.ring}>
      <svg viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - ratio)}
          style={{ transition: "stroke-dashoffset .8s ease" }}
        />
      </svg>
      <div className={classes.ringLabel}>
        <span
          className={classes.ringNum}
          style={{ fontSize: digitsSize(String(Math.abs(days)).length) }}
        >
          {Math.abs(days)}
        </span>
        <span className={classes.ringUnit}>
          {i18n.t("financePage.days", { count: Math.abs(days) })}
        </span>
      </div>
    </div>
  );
};

const Invoices = () => {
  const classes = useStyles();
  const { user } = useContext(AuthContext);
  const f = (key, opts) => i18n.t(`financePage.${key}`, opts);

  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [paying, setPaying] = useState(null);

  // a rota devolve todas as faturas da empresa de uma vez
  useEffect(() => {
    let alive = true;
    api
      .get("/invoices/all")
      .then(({ data }) => alive && setInvoices(Array.isArray(data) ? data : []))
      .catch(err => alive && toastError(err))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

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

  const unpaid = sorted.filter(inv => inv.status !== "paid");
  const next = unpaid[0];
  const currency = invoices[0]?.currency;
  const openTotal = unpaid.reduce(
    (sum, inv) => sum + Number(inv.value || 0),
    0
  );
  const paidCount = invoices.length - unpaid.length;

  const companyDue = user?.company?.dueDate;
  const companyDays =
    companyDue && moment(companyDue).isValid() ? daysUntil(companyDue) : null;
  const overdue = companyDays !== null && companyDays < 0;

  const hint = invoice => {
    const kind = situationOf(invoice);
    if (kind === "paid") return f("paid");
    const days = daysUntil(invoice.dueDate);
    if (days === 0) return f("dueToday");
    if (days === 1) return f("dueTomorrow");
    if (days > 0) return f("daysLeft", { count: days });
    return f("overdueFor", { count: Math.abs(days) });
  };

  const icon = kind =>
    kind === "paid" ? (
      <CheckCircleRoundedIcon />
    ) : kind === "overdue" ? (
      <ErrorOutlineRoundedIcon />
    ) : (
      <ScheduleRoundedIcon />
    );

  return (
    <MainContainer className={classes.page}>
      <SubscriptionModal
        open={!!paying}
        onClose={() => setPaying(null)}
        aria-labelledby="form-dialog-title"
        Invoice={paying || []}
        contactId={null}
      />

      <div className={classes.head}>
        <Typography component="h1" className={classes.title}>
          {f("title")}
        </Typography>
        <Typography className={classes.subtitle}>{f("subtitle")}</Typography>
      </div>

      {companyDays !== null && (
        <div
          className={`${classes.hero}${overdue ? ` ${classes.heroWarn}` : ""}`}
        >
          <Ring days={companyDays} classes={classes} />
          <div className={classes.heroText}>
            <div className={classes.heroTitle}>
              {overdue
                ? f("heroOverdue", { count: Math.abs(companyDays) })
                : companyDays === 0
                  ? f("heroToday")
                  : f("heroOk", { count: companyDays })}
            </div>
            <div className={classes.heroSub}>
              {overdue
                ? f("heroOverdueSub")
                : f("heroSub", {
                    date: moment(companyDue).format("LL")
                  })}
            </div>
            {next && (
              <Button
                variant="contained"
                className={classes.heroBtn}
                onClick={() => setPaying(next)}
              >
                {f("payNow")}
              </Button>
            )}
          </div>
        </div>
      )}

      <div className={classes.stats}>
        <div className={classes.stat}>
          <div className={classes.statLabel}>{f("statOpen")}</div>
          <div className={classes.statValue}>
            {currency ? safeValueFormat(openTotal, currency) : openTotal}
          </div>
        </div>
        <div className={classes.stat}>
          <div className={classes.statLabel}>{f("statPending")}</div>
          <div className={classes.statValue}>{unpaid.length}</div>
        </div>
        <div className={classes.stat}>
          <div className={classes.statLabel}>{f("statPaid")}</div>
          <div className={classes.statValue}>{paidCount}</div>
        </div>
      </div>

      <Typography component="h2" className={classes.sectionTitle}>
        {f("history")}
      </Typography>

      {!loading && invoices.length === 0 ? (
        <EmptyState
          icon={<ReceiptRoundedIcon />}
          title={f("emptyTitle")}
          description={f("emptyText")}
        />
      ) : (
        <div className={classes.grid}>
          {sorted.map((invoice, index) => {
            const kind = situationOf(invoice);
            return (
              <div
                key={invoice.id}
                className={`${classes.card} ${classes[`accent_${kind}`]}${
                  next && invoice.id === next.id ? ` ${classes.featured}` : ""
                }`}
                style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
              >
                <div className={classes.cardTop}>
                  <div>
                    <div className={classes.detail}>
                      {invoice.detail || f("invoice")}
                    </div>
                    <div className={classes.number}>
                      {f("number", { id: invoice.id })}
                    </div>
                  </div>
                  <span
                    className={`${classes.pill} ${classes[`tone_${kind}`]}`}
                  >
                    {icon(kind)}
                    {hint(invoice)}
                  </span>
                </div>
                <div className={classes.value}>
                  {safeValueFormat(invoice.value, invoice.currency)}
                </div>
                <div className={classes.cardFoot}>
                  <span className={classes.due}>
                    <EventRoundedIcon />
                    {f(kind === "paid" ? "dueWas" : "dueOn", {
                      date: moment(invoice.dueDate).format("L")
                    })}
                  </span>
                  {kind === "paid" ? (
                    <Button size="small" disabled>
                      {f("paidBtn")}
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      variant={
                        kind === "overdue" || kind === "soon"
                          ? "contained"
                          : "outlined"
                      }
                      color="primary"
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
      {loading && (
        <div className={classes.center}>
          <BoxLoader size={48} />
        </div>
      )}
    </MainContainer>
  );
};

export default Invoices;
