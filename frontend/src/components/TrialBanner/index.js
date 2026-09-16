import React, { useState } from "react";
import Paywall from "../Paywall";
import { makeStyles } from "@material-ui/core/styles";
import ButtonBase from "@material-ui/core/ButtonBase";
import AccessTimeRoundedIcon from "@material-ui/icons/AccessTimeRounded";

import { i18n } from "../../translate/i18n";

const DAY = 24 * 60 * 60 * 1000;
// quem se cadastra sozinho ganha 7 dias (TRIAL_DAYS no backend); a folga
// cobre fuso e o arredondamento do horário do cadastro
const TRIAL_WINDOW_DAYS = 8;

/**
 * Situação do teste grátis da empresa do usuário, ou null se não está em teste.
 *
 * Empresa em teste = vencimento até ~7 dias depois do cadastro. Quando a
 * empresa paga, o vencimento é empurrado para frente e ela sai desta regra —
 * então um cliente pagante nunca vê "teste grátis" quando está perto de
 * renovar. A empresa da instalação (id 1) e o superadmin não entram.
 */
export const getTrialStatus = user => {
  const company = user?.company;
  const companyId = Number(user?.companyId ?? company?.id ?? 0);
  if (!company?.dueDate || user?.super || companyId === 1) return null;

  const due = new Date(company.dueDate).getTime();
  if (Number.isNaN(due)) return null;

  const created = company.createdAt
    ? new Date(company.createdAt).getTime()
    : NaN;
  const daysLeft = Math.ceil((due - Date.now()) / DAY);
  const isTrial = Number.isNaN(created)
    ? daysLeft <= TRIAL_WINDOW_DAYS
    : due - created <= TRIAL_WINDOW_DAYS * DAY;

  return isTrial ? { daysLeft } : null;
};

const useStyles = makeStyles(theme => ({
  root: {
    position: "absolute",
    left: 0,
    right: 0,
    // cobre também a área do notch no iPhone, para a faixa chegar até o topo
    top: 0,
    zIndex: theme.zIndex.drawer + 3,
    boxSizing: "border-box",
    height: "calc(var(--safe-top, 0px) + var(--banner-h, 36px))",
    paddingTop: "var(--safe-top, 0px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing(1.5),
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    backgroundColor: "#FACC15",
    color: "#3F2A00",
    fontSize: "0.8125rem",
    fontWeight: 600,
    boxShadow: "inset 0 -1px 0 rgba(63, 42, 0, 0.12)",
    [theme.breakpoints.down("xs")]: {
      justifyContent: "space-between",
      gap: theme.spacing(1),
      paddingLeft: theme.spacing(1.5),
      paddingRight: theme.spacing(1.5),
      fontSize: "0.75rem"
    }
  },
  urgent: { backgroundColor: "#FB923C", color: "#431407" },
  text: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    minWidth: 0,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    "& svg": { fontSize: 17, flex: "none" }
  },
  cta: {
    flex: "none",
    height: 24,
    padding: "0 12px",
    borderRadius: 999,
    fontSize: "0.75rem",
    fontWeight: 700,
    backgroundColor: "#3F2A00",
    color: "#FDE68A",
    "&:hover": { backgroundColor: "#2A1C00" }
  }
}));

/**
 * Faixa amarela no topo com quanto falta do teste grátis.
 * Fica laranja nos últimos 3 dias. O botão abre a tela de planos e pagamento — só aparece para admin, que é quem pode pagar.
 */
const TrialBanner = ({ user, status }) => {
  const classes = useStyles();
  const [payOpen, setPayOpen] = useState(false);
  if (!status) return null;

  const { daysLeft } = status;
  let text;
  if (daysLeft < 0) text = i18n.t("trialBanner.ended");
  else if (daysLeft === 0) text = i18n.t("trialBanner.today");
  else if (daysLeft === 1) text = i18n.t("trialBanner.tomorrow");
  else text = i18n.t("trialBanner.daysLeft", { count: daysLeft });

  return (
    <div
      className={`${classes.root}${daysLeft <= 3 ? ` ${classes.urgent}` : ""}`}
      role="status"
    >
      <span className={classes.text}>
        <AccessTimeRoundedIcon />
        {text}
      </span>
      {user?.profile === "admin" && (
        <ButtonBase className={classes.cta} onClick={() => setPayOpen(true)}>
          {i18n.t("trialBanner.cta")}
        </ButtonBase>
      )}
      {payOpen && (
        <Paywall user={user} voluntary onClose={() => setPayOpen(false)} />
      )}
    </div>
  );
};

export default TrialBanner;
