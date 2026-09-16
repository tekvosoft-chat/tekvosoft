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
    maxWidth: 880,
    margin: "auto",
    textAlign: "center"
  },
  gifFrame: {
    position: "relative",
    width: 260,
    height: 200,
    margin: "0 auto",
    borderRadius: 20,
    overflow: "hidden",
    background: "#171717",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
    animation: "$wobble 3.2s ease-in-out infinite",
    [theme.breakpoints.down("xs")]: { width: 220, height: 170 },
    "& img": { width: "100%", height: "100%", objectFit: "cover" }
  },
  bigEmoji: {
    fontSize: 88,
    lineHeight: "200px",
    [theme.breakpoints.down("xs")]: { lineHeight: "170px" }
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
  plans: {
    marginTop: theme.spacing(4),
    display: "grid",
    gap: theme.spacing(2),
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    textAlign: "left"
  },
  plan: {
    display: "block",
    width: "100%",
    textAlign: "left",
    padding: theme.spacing(2.5),
    borderRadius: 16,
    border: "1.5px solid #262626",
    background: "#141414",
    color: "#fff",
    transition: "border-color .15s, transform .15s",
    "&:hover": { borderColor: "#525252", transform: "translateY(-2px)" }
  },
  planActive: { borderColor: "#fff !important", background: "#1c1c1c" },
  planName: { fontSize: 16, fontWeight: 700 },
  planPrice: { fontSize: 26, fontWeight: 800, margin: theme.spacing(1, 0) },
  planPer: { fontSize: 13, fontWeight: 500, color: "#a3a3a3" },
  planFeature: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
    color: "#d4d4d4",
    marginTop: 4,
    "& svg": { fontSize: 16, color: "#fff" }
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

const FunGif = ({ kind, fallback }) => {
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

  return (
    <div className={classes.gifFrame}>
      {gif && !failed ? (
        <img src={gif.url} alt="" onError={() => setFailed(true)} />
      ) : (
        failed && <div className={classes.bigEmoji}>{fallback}</div>
      )}
    </div>
  );
};

const Emojis = ({ list }) => {
  const classes = useStyles();
  return (
    <div className={classes.emojis} aria-hidden="true">
      {list.map((emoji, index) => (
        <span key={emoji} style={{ animationDelay: `${index * 0.15}s` }}>
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

  const selectedPlan = useMemo(
    () => plans.find(plan => plan.id === planId),
    [plans, planId]
  );

  const choose = async () => {
    if (!planId) return;
    setLoading(true);
    try {
      const { data } = await api.post("/subscription/plan", { planId });
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
          <FunGif kind="thanks" fallback="🥳" />
          <Emojis list={THANKS_EMOJIS} />
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
        <FunGif kind="paywall" fallback="💸" />
        <Emojis list={PAYWALL_EMOJIS} />
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
          <div className={classes.plans}>
            {plans.map(plan => (
              <ButtonBase
                key={plan.id}
                className={`${classes.plan}${plan.id === planId ? ` ${classes.planActive}` : ""}`}
                onClick={() => setPlanId(plan.id)}
              >
                <div className={classes.planName}>{plan.name}</div>
                <div className={classes.planPrice}>
                  {safeValueFormat(plan.value, plan.currency)}{" "}
                  <span className={classes.planPer}>
                    {i18n.t("paywall.perMonth")}
                  </span>
                </div>
                <div className={classes.planFeature}>
                  <CheckRoundedIcon />
                  {i18n.t("paywall.users", { count: plan.users })}
                </div>
                <div className={classes.planFeature}>
                  <CheckRoundedIcon />
                  {i18n.t("paywall.connections", { count: plan.connections })}
                </div>
                <div className={classes.planFeature}>
                  <CheckRoundedIcon />
                  {i18n.t("paywall.queues", { count: plan.queues })}
                </div>
              </ButtonBase>
            ))}
          </div>
        )}

        <div className={classes.actions}>
          {isAdmin && (
            <Button
              className={classes.pay}
              variant="contained"
              disabled={!selectedPlan || loading}
              onClick={choose}
            >
              {loading ? (
                <CircularProgress size={22} />
              ) : (
                i18n.t("paywall.pay", {
                  value: selectedPlan
                    ? safeValueFormat(selectedPlan.value, selectedPlan.currency)
                    : ""
                })
              )}
            </Button>
          )}
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
