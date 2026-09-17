import React, { useContext, useEffect, useMemo, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import ButtonBase from "@material-ui/core/ButtonBase";
import CircularProgress from "@material-ui/core/CircularProgress";
import CheckRoundedIcon from "@material-ui/icons/CheckRounded";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";
import { SocketContext } from "../../context/Socket/SocketContext";
import { safeValueFormat } from "../../helpers/safeValueFormat";
import PaymentDialog from "../PaymentDialog";

const DAY = 24 * 60 * 60 * 1000;

/** Empresa com o acesso vencido (fim do dia do vencimento já passou). */
export const isCompanyExpired = user => {
  const company = user?.company;
  const companyId = Number(user?.companyId ?? company?.id ?? 0);
  if (!company?.dueDate || user?.super || companyId === 1) return false;
  const due = new Date(company.dueDate);
  if (Number.isNaN(due.getTime())) return false;
  due.setHours(23, 59, 59, 999);
  return Date.now() > due.getTime();
};

const PAYWALL_EMOJIS = ["💸", "🥺", "🙏", "💰", "😅"];
const THANKS_EMOJIS = ["🎉", "🥳", "💚", "🙌", "✨"];

const useStyles = makeStyles(theme => ({
  root: {
    position: "fixed",
    inset: 0,
    zIndex: theme.zIndex.modal - 1,
    overflowY: "auto",
    background: "#0a0a0a",
    color: "#fff",
    display: "flex",
    justifyContent: "center",
    padding: theme.spacing(4, 2),
    paddingTop: "calc(var(--safe-top, 0px) + 24px)"
  },
  inner: {
    width: "100%",
    maxWidth: 1080,
    margin: "auto",
    textAlign: "center"
  },
  // o GIF é o centro da tela: grande, com brilho e emojis flutuando em volta
  hero: {
    position: "relative",
    width: "min(520px, 88vw)",
    margin: "0 auto"
  },
  gifFrame: {
    position: "relative",
    width: "100%",
    aspectRatio: "4 / 3",
    margin: "0 auto",
    borderRadius: 28,
    overflow: "hidden",
    background: "#171717",
    boxShadow:
      "0 30px 80px -20px rgba(255,255,255,0.18), 0 0 0 1px rgba(255,255,255,0.08)",
    animation: "$wobble 4s ease-in-out infinite",
    "& img": { width: "100%", height: "100%", objectFit: "cover" }
  },
  bigEmoji: {
    fontSize: 120,
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  floatEmoji: {
    position: "absolute",
    fontSize: 38,
    filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.5))",
    animation: "$bounce 2.4s ease-in-out infinite",
    pointerEvents: "none",
    [theme.breakpoints.down("xs")]: { fontSize: 28 }
  },
  emojis: {
    marginTop: theme.spacing(2),
    fontSize: 28,
    letterSpacing: 6,
    "& span": {
      display: "inline-block",
      animation: "$bounce 1.4s ease-in-out infinite"
    }
  },
  title: {
    margin: theme.spacing(2, 0, 1),
    fontSize: 30,
    fontWeight: 800,
    letterSpacing: "-0.02em",
    [theme.breakpoints.down("xs")]: { fontSize: 24 }
  },
  subtitle: {
    margin: "0 auto",
    maxWidth: 520,
    color: "#a3a3a3",
    fontSize: 15
  },
  plansTitle: {
    marginTop: theme.spacing(6),
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "#737373"
  },
  plans: {
    marginTop: theme.spacing(2),
    display: "grid",
    gap: theme.spacing(2),
    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
    alignItems: "stretch",
    textAlign: "left"
  },
  plan: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    width: "100%",
    textAlign: "left",
    alignItems: "stretch",
    padding: theme.spacing(3, 2.5, 2.5),
    borderRadius: 20,
    border: "1.5px solid #262626",
    background: "#111",
    color: "#fff",
    transition: "border-color .2s, transform .2s, box-shadow .2s",
    animation: "$rise .45s cubic-bezier(.2, .8, .2, 1) both",
    "&:hover": {
      borderColor: "#525252",
      transform: "translateY(-4px)",
      boxShadow: "0 20px 40px -20px rgba(0,0,0,0.8)"
    }
  },
  planActive: {
    borderColor: "#fff !important",
    background: "linear-gradient(180deg, #1c1c1c, #111)"
  },
  planPopular: {
    position: "absolute",
    top: -11,
    left: "50%",
    transform: "translateX(-50%)",
    padding: "3px 12px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.04em",
    color: "#0a0a0a",
    background: "#fff",
    whiteSpace: "nowrap"
  },
  planName: { fontSize: 17, fontWeight: 700 },
  planPrice: { fontSize: 30, fontWeight: 800, margin: theme.spacing(1, 0, 2) },
  planPer: { fontSize: 13, fontWeight: 500, color: "#a3a3a3" },
  planFeature: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13.5,
    color: "#d4d4d4",
    padding: "5px 0",
    borderTop: "1px solid #1f1f1f",
    "& svg": { fontSize: 17, color: "#22c55e", flex: "none" }
  },
  planFeatureOff: {
    color: "#525252",
    textDecoration: "line-through",
    "& svg": { color: "#404040" }
  },
  planPick: {
    marginTop: "auto",
    paddingTop: theme.spacing(2)
  },
  planPickBtn: {
    width: "100%",
    height: 42,
    borderRadius: 999,
    fontWeight: 700,
    textTransform: "none",
    color: "#fff",
    border: "1.5px solid #404040",
    "&:hover": { borderColor: "#fff", background: "rgba(255,255,255,0.06)" }
  },
  planPickBtnOn: {
    color: "#0a0a0a",
    background: "#fff",
    borderColor: "#fff",
    "&:hover": { background: "#e5e5e5" }
  },
  "@keyframes rise": {
    from: { opacity: 0, transform: "translateY(16px)" },
    to: { opacity: 1, transform: "none" }
  },
  actions: {
    marginTop: theme.spacing(4),
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: theme.spacing(1.5)
  },
  pay: {
    minWidth: 260,
    height: 50,
    borderRadius: 999,
    background: "#fff",
    color: "#0a0a0a",
    fontWeight: 700,
    fontSize: 16,
    textTransform: "none",
    "&:hover": { background: "#e5e5e5" },
    "&.Mui-disabled": { background: "#404040", color: "#737373" }
  },
  logout: { color: "#a3a3a3", textTransform: "none" },
  "@keyframes wobble": {
    "0%, 100%": { transform: "rotate(-2deg)" },
    "50%": { transform: "rotate(2deg) scale(1.02)" }
  },
  "@keyframes bounce": {
    "0%, 100%": { transform: "translateY(0)" },
    "50%": { transform: "translateY(-8px)" }
  }
}));

const FunGif = ({ kind, fallback, emojis }) => {
  const classes = useStyles();
  const [gif, setGif] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api
      .get("/subscription/gifs", { params: { kind } })
      .then(({ data }) => {
        if (Array.isArray(data) && data.length) {
          setGif(data[Math.floor(Math.random() * data.length)]);
        } else setFailed(true);
      })
      .catch(() => setFailed(true));
  }, [kind]);

  const spots = [
    { top: "-6%", left: "-5%" },
    { top: "12%", right: "-7%" },
    { bottom: "-7%", left: "8%" },
    { bottom: "4%", right: "-5%" },
    { top: "-9%", right: "22%" }
  ];
  return (
    <div className={classes.hero}>
      <div className={classes.gifFrame}>
        {gif && !failed ? (
          <img src={gif.url} alt="" onError={() => setFailed(true)} />
        ) : (
          failed && <div className={classes.bigEmoji}>{fallback}</div>
        )}
      </div>
      {(emojis || []).map((emoji, i) => (
        <span
          key={emoji}
          className={classes.floatEmoji}
          style={{ ...spots[i % spots.length], animationDelay: `${i * 0.3}s` }}
          aria-hidden="true"
        >
          {emoji}
        </span>
      ))}
    </div>
  );
};

/**
 * Tela cheia de quando o período (teste ou assinatura) acabou.
 * Admin escolhe o plano e paga ali mesmo; usuário comum só é avisado.
 * Com `voluntary`, é aberta de propósito durante o teste (tem botão de fechar).
 */
const Paywall = ({ user, voluntary = false, onClose }) => {
  const classes = useStyles();
  const { handleLogout } = useContext(AuthContext);
  const socketManager = useContext(SocketContext);
  const isAdmin = user?.profile === "admin";

  const [plans, setPlans] = useState([]);
  const [planId, setPlanId] = useState(user?.company?.planId || null);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    api
      .get("/plans/listpublic")
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : [];
        setPlans(list);
        setPlanId(current =>
          list.some(plan => plan.id === current) ? current : list[0]?.id
        );
      })
      .catch(() => {});
  }, [isAdmin]);

  // Pix é confirmado pelo webhook: o aviso chega pelo socket
  useEffect(() => {
    const companyId = user?.companyId;
    if (!companyId) return undefined;
    const socket = socketManager.GetSocket(companyId);
    const onPayment = data => {
      if (data?.action === "CONCLUIDA") {
        setInvoice(null);
        setPaid(true);
      }
    };
    socket.on(`company-${companyId}-payment`, onPayment);
    return () => socket.off(`company-${companyId}-payment`, onPayment);
  }, [socketManager, user?.companyId]);

  // do mais barato ao mais caro; o do meio ganha o selo de mais escolhido
  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => Number(a.value) - Number(b.value)),
    [plans]
  );
  const popularIndex = Math.floor((sortedPlans.length - 1) / 2);

  const choose = async id => {
    const target = id || planId;
    if (!target) return;
    setLoading(true);
    try {
      const { data } = await api.post("/subscription/plan", {
        planId: target
      });
      setInvoice(data);
    } catch (err) {
      toastError(err);
    }
    setLoading(false);
  };

  if (paid) {
    return (
      <div className={classes.root}>
        <div className={classes.inner}>
          <FunGif kind="thanks" fallback="🥳" emojis={THANKS_EMOJIS} />
          <h1 className={classes.title}>{i18n.t("paywall.thanksTitle")}</h1>
          <p className={classes.subtitle}>{i18n.t("paywall.thanksText")}</p>
          <div className={classes.actions}>
            <Button
              className={classes.pay}
              variant="contained"
              onClick={() => window.location.reload()}
            >
              {i18n.t("paywall.continue")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const daysAgo = user?.company?.dueDate
    ? Math.max(
        0,
        Math.floor((Date.now() - new Date(user.company.dueDate)) / DAY)
      )
    : 0;

  return (
    <div className={classes.root}>
      <div className={classes.inner}>
        <FunGif kind="paywall" fallback="💸" emojis={PAYWALL_EMOJIS} />
        <h1 className={classes.title}>
          {voluntary
            ? i18n.t("paywall.voluntaryTitle")
            : i18n.t("paywall.title")}
        </h1>
        <p className={classes.subtitle}>
          {voluntary
            ? i18n.t("paywall.voluntaryText")
            : isAdmin
              ? i18n.t("paywall.adminText", { count: daysAgo })
              : i18n.t("paywall.userText")}
        </p>

        {isAdmin && plans.length > 0 && (
          <>
            <div className={classes.plansTitle}>
              {i18n.t("paywall.choosePlan", "Escolha o seu plano")}
            </div>
            <div className={classes.plans}>
              {sortedPlans.map((plan, index) => {
                const on = plan.id === planId;
                const features = [
                  [true, i18n.t("paywall.users", { count: plan.users })],
                  [
                    true,
                    i18n.t("paywall.connections", { count: plan.connections })
                  ],
                  [true, i18n.t("paywall.queues", { count: plan.queues })],
                  [plan.useKanban, "Kanban"],
                  [plan.useInternalChat, "Chat interno"],
                  [plan.useSchedules, "Agendamentos"],
                  [plan.useExternalApi, "API de integração"]
                ];
                return (
                  <ButtonBase
                    key={plan.id}
                    component="div"
                    className={`${classes.plan}${on ? ` ${classes.planActive}` : ""}`}
                    style={{ animationDelay: `${index * 80}ms` }}
                    onClick={() => setPlanId(plan.id)}
                  >
                    {index === popularIndex && sortedPlans.length > 2 && (
                      <span className={classes.planPopular}>
                        {i18n.t("paywall.popular", "MAIS ESCOLHIDO")}
                      </span>
                    )}
                    <div className={classes.planName}>{plan.name}</div>
                    <div className={classes.planPrice}>
                      {safeValueFormat(plan.value, plan.currency)}{" "}
                      <span className={classes.planPer}>
                        {i18n.t("paywall.perMonth")}
                      </span>
                    </div>
                    {features.map(([enabled, label]) => (
                      <div
                        key={label}
                        className={`${classes.planFeature}${enabled === false ? ` ${classes.planFeatureOff}` : ""}`}
                      >
                        <CheckRoundedIcon />
                        {label}
                      </div>
                    ))}
                    <div className={classes.planPick}>
                      <Button
                        className={`${classes.planPickBtn}${on ? ` ${classes.planPickBtnOn}` : ""}`}
                        disabled={loading}
                        onClick={e => {
                          e.stopPropagation();
                          setPlanId(plan.id);
                          choose(plan.id);
                        }}
                      >
                        {loading && on ? (
                          <CircularProgress size={18} />
                        ) : (
                          i18n.t("paywall.subscribe", "Assinar este plano")
                        )}
                      </Button>
                    </div>
                  </ButtonBase>
                );
              })}
            </div>
          </>
        )}

        <div className={classes.actions}>
          {voluntary ? (
            <Button className={classes.logout} onClick={onClose}>
              {i18n.t("paywall.later")}
            </Button>
          ) : (
            <Button className={classes.logout} onClick={handleLogout}>
              {i18n.t("paywall.logout")}
            </Button>
          )}
        </div>
      </div>

      <PaymentDialog
        open={!!invoice}
        invoice={invoice}
        onClose={() => setInvoice(null)}
        onPaid={() => {
          setInvoice(null);
          setPaid(true);
        }}
      />
    </div>
  );
};

export default Paywall;
