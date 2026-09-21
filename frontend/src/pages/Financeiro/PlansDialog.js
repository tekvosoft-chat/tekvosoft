import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import CheckCircleRoundedIcon from "@material-ui/icons/CheckCircleRounded";
import RemoveCircleOutlineRoundedIcon from "@material-ui/icons/RemoveCircleOutlineRounded";

import { safeValueFormat } from "../../helpers/safeValueFormat";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    plans: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: theme.spacing(1.5),
      paddingBottom: theme.spacing(1)
    },
    plan: {
      display: "flex",
      flexDirection: "column",
      gap: theme.spacing(1),
      padding: theme.spacing(2),
      borderRadius: t.radius.lg,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface
    },
    planCurrent: {
      borderColor: t.brand.main,
      boxShadow: `0 0 0 1px ${t.brand.main}`
    },
    planTop: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8
    },
    planName: {
      fontSize: "1rem",
      fontWeight: 700,
      color: theme.palette.text.primary
    },
    planTag: {
      height: 22,
      padding: "0 8px",
      borderRadius: 999,
      fontSize: "0.6875rem",
      fontWeight: 700,
      color: t.brand.text,
      backgroundColor: t.brand.textSoft,
      display: "inline-flex",
      alignItems: "center"
    },
    planPrice: {
      display: "flex",
      alignItems: "baseline",
      gap: 4,
      fontSize: "1.5rem",
      fontWeight: 700,
      letterSpacing: "-0.02em",
      color: theme.palette.text.primary
    },
    planCycle: {
      fontSize: "0.8125rem",
      fontWeight: 500,
      color: theme.palette.text.secondary
    },
    planList: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      margin: 0,
      padding: 0,
      listStyle: "none"
    },
    planItem: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontSize: "0.8125rem",
      color: theme.palette.text.primary,
      "& svg": { fontSize: 16, color: t.semantic.success, flex: "none" }
    },
    planItemOff: {
      color: theme.palette.text.disabled,
      textDecoration: "line-through",
      "& svg": { color: theme.palette.text.disabled }
    },
    planBtn: {
      marginTop: "auto",
      borderRadius: 999,
      textTransform: "none",
      fontWeight: 700
    }
  };
});

export const planFeatures = (plan, f) => [
  [true, f("planUsers", { count: plan.users })],
  [true, f("planConnections", { count: plan.connections })],
  [true, f("planQueues", { count: plan.queues })],
  [!!plan.useKanban, "Kanban"],
  [!!plan.useInternalChat, f("planChat")],
  [!!plan.useSchedules, f("planSchedules")],
  [!!plan.useExternalApi, f("planApi")]
];

/** Benefícios do plano atual lado a lado com os outros planos. */
const PlansDialog = ({
  open,
  plans,
  currentId,
  canChoose,
  choosing,
  onChoose,
  onClose
}) => {
  const classes = useStyles();
  const f = (key, opts) => i18n.t(`financePage.${key}`, opts);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{f("plansDialogTitle")}</DialogTitle>
      <DialogContent>
        <div className={classes.plans}>
          {plans.map(plan => {
            const current = plan.id === currentId;
            return (
              <div
                key={plan.id}
                className={`${classes.plan}${current ? ` ${classes.planCurrent}` : ""}`}
              >
                <div className={classes.planTop}>
                  <span className={classes.planName}>{plan.name}</span>
                  {current && (
                    <span className={classes.planTag}>{f("planCurrent")}</span>
                  )}
                </div>
                {plan.value !== undefined && (
                  <div className={classes.planPrice}>
                    {safeValueFormat(plan.value, plan.currency || "BRL")}
                    <span className={classes.planCycle}>{f("perMonth")}</span>
                  </div>
                )}
                <ul className={classes.planList}>
                  {planFeatures(plan, f).map(([on, label]) => (
                    <li
                      key={label}
                      className={`${classes.planItem}${on ? "" : ` ${classes.planItemOff}`}`}
                    >
                      {on ? (
                        <CheckCircleRoundedIcon />
                      ) : (
                        <RemoveCircleOutlineRoundedIcon />
                      )}
                      {label}
                    </li>
                  ))}
                </ul>
                {canChoose && (
                  <Button
                    variant={current ? "outlined" : "contained"}
                    color="primary"
                    disableElevation
                    disabled={current || !!choosing}
                    className={classes.planBtn}
                    onClick={() => onChoose(plan)}
                  >
                    {current
                      ? f("planYours")
                      : choosing === plan.id
                        ? f("planChoosing")
                        : f("planChoose")}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{f("close")}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PlansDialog;
