import React, { useContext } from "react";
import { Redirect, useHistory } from "react-router-dom";
import { makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import LockRoundedIcon from "@material-ui/icons/LockRounded";

import { AuthContext } from "../../context/Auth/AuthContext";
import { planAllows } from "../../helpers/planFeatures";
import { i18n } from "../../translate/i18n";

/**
 * Mostra a tela só se o plano da empresa inclui o recurso; senão, um aviso
 * explicando que o recurso não faz parte do plano contratado.
 */
const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    root: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing(1.5),
      padding: theme.spacing(4, 2),
      textAlign: "center"
    },
    icon: {
      width: 72,
      height: 72,
      borderRadius: 22,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: t.brand.contrastText,
      background: `linear-gradient(135deg, ${t.brand.main}, ${t.brand.hover})`,
      boxShadow: `0 12px 30px -12px ${t.brand.main}`,
      "& svg": { fontSize: 36 }
    },
    title: {
      fontSize: "1.25rem",
      fontWeight: 800,
      color: theme.palette.text.primary
    },
    text: {
      maxWidth: 420,
      fontSize: "0.9375rem",
      color: theme.palette.text.secondary
    }
  };
});

export const PlanLocked = ({ feature }) => {
  const classes = useStyles();
  const history = useHistory();
  return (
    <div className={classes.root}>
      <span className={classes.icon}>
        <LockRoundedIcon />
      </span>
      <div className={classes.title}>
        {i18n.t("planFeatures.lockedTitle", {
          feature: i18n.t(`planFeatures.names.${feature}`)
        })}
      </div>
      <div className={classes.text}>{i18n.t("planFeatures.lockedText")}</div>
      <Button
        variant="contained"
        color="primary"
        onClick={() => history.push("/financeiro")}
      >
        {i18n.t("planFeatures.lockedAction")}
      </Button>
    </div>
  );
};

/** Tela exclusiva do super admin (dono da plataforma). */
export const superOnly = Component => {
  const OnlySuper = props => {
    const { user } = useContext(AuthContext);
    if (user && !user.super) return <Redirect to="/" />;
    return <Component {...props} />;
  };
  OnlySuper.displayName = "SuperOnly";
  return OnlySuper;
};

const withPlanFeature = (Component, feature) => {
  const Gated = props => {
    const { user } = useContext(AuthContext);
    if (!planAllows(user, feature)) return <PlanLocked feature={feature} />;
    return <Component {...props} />;
  };
  Gated.displayName = `WithPlan(${feature})`;
  return Gated;
};

export default withPlanFeature;
