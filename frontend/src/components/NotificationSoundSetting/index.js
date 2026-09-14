import React, { useState } from "react";
import { toast } from "react-toastify";
import { makeStyles } from "@material-ui/core/styles";
import {
  Button,
  CircularProgress,
  Switch,
  Typography
} from "@material-ui/core";
import VolumeUpRoundedIcon from "@material-ui/icons/VolumeUpRounded";
import VolumeOffRoundedIcon from "@material-ui/icons/VolumeOffRounded";
import NotificationsActiveRoundedIcon from "@material-ui/icons/NotificationsActiveRounded";
import NotificationsOffRoundedIcon from "@material-ui/icons/NotificationsOffRounded";

import useNotificationSound from "../../hooks/useNotificationSound";
import {
  enablePush,
  isIos,
  isPushActive,
  isStandalone,
  pushPermission,
  pushSupported
} from "../../services/push";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    wrap: {
      display: "flex",
      flexDirection: "column",
      gap: theme.spacing(1.5),
      margin: theme.spacing(0, 3, 3),
      [theme.breakpoints.down("xs")]: { margin: theme.spacing(0, 1.5, 2) }
    },
    root: {
      display: "flex",
      alignItems: "center",
      flexWrap: "wrap",
      gap: theme.spacing(2),
      padding: theme.spacing(2),
      borderRadius: t.radius.lg,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface
    },
    clickable: { cursor: "pointer" },
    icon: {
      flex: "none",
      width: 44,
      height: 44,
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.brand.textSoft,
      color: t.brand.text
    },
    iconOff: {
      backgroundColor: t.surfaceSunken,
      color: theme.palette.text.secondary
    },
    text: { flex: 1, minWidth: 200 },
    title: {
      fontSize: "0.9375rem",
      fontWeight: 600,
      color: theme.palette.text.primary
    },
    description: {
      marginTop: 2,
      fontSize: "0.8125rem",
      color: theme.palette.text.secondary
    },
    on: {
      fontSize: "0.8125rem",
      fontWeight: 600,
      color: t.semantic.success
    }
  };
});

export const pushState = () => {
  if (isPushActive()) return "active";
  if (isIos() && !isStandalone()) return "iosInstall";
  if (!pushSupported()) return "unsupported";
  if (pushPermission() === "denied") return "blocked";
  return "off";
};

export const activatePush = async (silent, onDone) => {
  try {
    await enablePush({ silent });
    toast.success(i18n.t("push.enabledToast"));
  } catch (err) {
    if (err?.message === "denied") toast.error(i18n.t("push.blocked"));
    else toast.error(i18n.t("push.failed"));
  }
  onDone?.();
};

/**
 * Configurações > Aparência: som das notificações e notificações push
 * neste aparelho. As duas escolhas valem só para o aparelho em uso.
 */
const NotificationSoundSetting = () => {
  const classes = useStyles();
  const [on, setOn] = useNotificationSound();
  const [state, setState] = useState(pushState);
  const [busy, setBusy] = useState(false);

  const descriptions = {
    active: i18n.t("push.activeDescription"),
    off: i18n.t("push.description"),
    blocked: i18n.t("push.blocked"),
    unsupported: i18n.t("push.unsupported"),
    iosInstall: i18n.t("push.iosHint")
  };

  return (
    <div className={classes.wrap}>
      <label className={`${classes.root} ${classes.clickable}`}>
        <span className={`${classes.icon}${on ? "" : ` ${classes.iconOff}`}`}>
          {on ? <VolumeUpRoundedIcon /> : <VolumeOffRoundedIcon />}
        </span>
        <span className={classes.text}>
          <Typography
            className={classes.title}
            component="span"
            display="block"
          >
            {i18n.t("notificationSound.title")}
          </Typography>
          <Typography
            className={classes.description}
            component="span"
            display="block"
          >
            {i18n.t("notificationSound.description")}
          </Typography>
        </span>
        <Switch
          color="primary"
          checked={on}
          onChange={e => setOn(e.target.checked)}
          inputProps={{ "aria-label": i18n.t("notificationSound.title") }}
        />
      </label>

      <div className={classes.root}>
        <span
          className={`${classes.icon}${state === "active" ? "" : ` ${classes.iconOff}`}`}
        >
          {state === "active" ? (
            <NotificationsActiveRoundedIcon />
          ) : (
            <NotificationsOffRoundedIcon />
          )}
        </span>
        <span className={classes.text}>
          <Typography
            className={classes.title}
            component="span"
            display="block"
          >
            {i18n.t("push.title")}
          </Typography>
          <Typography
            className={classes.description}
            component="span"
            display="block"
          >
            {descriptions[state]}
          </Typography>
        </span>
        {state === "active" ? (
          <span className={classes.on}>{i18n.t("push.enabled")}</span>
        ) : state === "off" ? (
          <Button
            variant="contained"
            color="primary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await activatePush(!on, () => {
                setBusy(false);
                setState(pushState());
              });
            }}
            startIcon={
              busy ? <CircularProgress size={16} color="inherit" /> : null
            }
          >
            {i18n.t("push.enable")}
          </Button>
        ) : null}
      </div>
    </div>
  );
};

export default NotificationSoundSetting;
