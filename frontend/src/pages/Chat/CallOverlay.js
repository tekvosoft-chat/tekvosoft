import React, { useEffect, useMemo, useRef, useState } from "react";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import Dialog from "@material-ui/core/Dialog";
import IconButton from "@material-ui/core/IconButton";
import Tooltip from "@material-ui/core/Tooltip";
import Typography from "@material-ui/core/Typography";
import MicRoundedIcon from "@material-ui/icons/MicRounded";
import MicOffRoundedIcon from "@material-ui/icons/MicOffRounded";
import VideocamRoundedIcon from "@material-ui/icons/VideocamRounded";
import VideocamOffRoundedIcon from "@material-ui/icons/VideocamOffRounded";
import VolumeUpRoundedIcon from "@material-ui/icons/VolumeUpRounded";
import CallEndRoundedIcon from "@material-ui/icons/CallEndRounded";

import UserAvatar from "../../components/ui/UserAvatar";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    paper: {
      borderRadius: t.radius.lg,
      backgroundColor: t.surface,
      backgroundImage: "none",
      [theme.breakpoints.down("xs")]: { borderRadius: 0 }
    },
    wrapper: {
      position: "relative",
      width: "min(680px, 92vw)",
      height: "min(520px, 80vh)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing(2),
      padding: theme.spacing(3, 2, 8),
      [theme.breakpoints.down("xs")]: {
        width: "100vw",
        height: "100vh",
        paddingBottom: `calc(${theme.spacing(3)}px + var(--safe-bottom, 0px))`
      }
    },
    name: {
      fontSize: "1.125rem",
      fontWeight: 800,
      color: theme.palette.text.primary
    },
    status: {
      fontSize: "0.875rem",
      color: theme.palette.text.secondary
    },
    timer: {
      fontSize: "0.8125rem",
      color: theme.palette.text.secondary
    },
    controls: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing(1.5),
      padding: theme.spacing(1.5),
      borderTop: `1px solid ${t.border}`,
      backgroundColor: t.surface,
      [theme.breakpoints.down("xs")]: {
        paddingBottom: `calc(${theme.spacing(1.5)}px + var(--safe-bottom, 0px))`
      }
    },
    round: {
      width: 54,
      height: 54,
      borderRadius: t.radius.pill,
      color: theme.palette.text.primary,
      backgroundColor: t.surfaceSunken,
      "&:hover": { backgroundColor: t.surfaceHover }
    },
    roundOn: {
      color: t.brand.contrastText,
      backgroundColor: t.brand.main,
      "&:hover": { backgroundColor: t.brand.hover }
    },
    hang: {
      width: 58,
      height: 58,
      borderRadius: t.radius.pill,
      color: t.brand.contrastText,
      backgroundColor: t.semantic.danger,
      "&:hover": { backgroundColor: t.semantic.dangerHover || t.semantic.danger }
    },
    center: { textAlign: "center" }
  };
});

const formatTime = secs => {
  const s = Math.max(0, Math.floor(secs));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
};

const CallOverlay = ({ call, me, chat }) => {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("xs"));
  const classes = useStyles();
  const [speaker, setSpeaker] = useState(false);
  const [open, setOpen] = useState(true);
  const timerRef = useRef(null);
  const startRef = useRef(null);
  const [elapsed, setElapsed] = useState(0);

  const direct = useMemo(() => chat?.kind === "direct", [chat?.kind]);
  const otherUser = useMemo(() =>
    direct ? (chat?.users || []).find(u => u.userId !== me?.id)?.user : null,
  [chat, direct, me?.id]);

  // status da chamada (mapeado a partir do hook atual)
  const status = call.joining
    ? i18n.t("chat.calls.status.connecting")
    : call.peers.length > 0
    ? i18n.t("chat.calls.status.inCall")
    : i18n.t("chat.calls.status.ringing");

  // inicia/paralisa o cronômetro quando entra/saí do estado "em chamada"
  useEffect(() => {
    const inCall = call.peers.length > 0;
    if (inCall && !startRef.current) {
      startRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
      }, 1000);
    }
    if (!inCall) {
      startRef.current = null;
      setElapsed(0);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call.peers.length]);

  // o modal não fecha ao tocar fora/esc pressionado
  const handleClose = (event, reason) => {
    if (reason === "backdropClick" || reason === "escapeKeyDown") return;
    setOpen(false);
  };

  if (!open) return null;

  return (
    <Dialog
      open
      onClose={handleClose}
      fullScreen={isPhone}
      classes={{ paper: classes.paper }}
      keepMounted
      aria-labelledby="chat-call-overlay"
    >
      <div className={classes.wrapper}>
        <div className={classes.center}>
          <UserAvatar user={direct ? otherUser : { name: chat?.title }} size={92} />
          <Typography className={classes.name} component="div" style={{ marginTop: 12 }}>
            {direct ? otherUser?.name : chat?.title}
          </Typography>
          <Typography className={classes.status} component="div">
            {status}
          </Typography>
          {call.peers.length > 0 && (
            <Typography className={classes.timer} component="div">
              {formatTime(elapsed)}
            </Typography>
          )}
        </div>

        <div className={classes.controls}>
          <Tooltip title={call.local.audio ? i18n.t("chat.calls.controls.mute") : i18n.t("chat.calls.controls.unmute")}>
            <IconButton
              className={`${classes.round}${call.local.audio ? "" : " " + classes.roundOn}`}
              onClick={call.toggleAudio}
              aria-label={call.local.audio ? i18n.t("chat.calls.controls.mute") : i18n.t("chat.calls.controls.unmute")}
            >
              {call.local.audio ? <MicRoundedIcon /> : <MicOffRoundedIcon />}
            </IconButton>
          </Tooltip>

          {call.local.hasCamera && (
            <Tooltip title={call.local.video ? i18n.t("chat.calls.controls.cameraOff") : i18n.t("chat.calls.controls.cameraOn") }>
              <IconButton
                className={`${classes.round}${call.local.video ? " " + classes.roundOn : ""}`}
                onClick={call.toggleVideo}
                aria-label={call.local.video ? i18n.t("chat.calls.controls.cameraOff") : i18n.t("chat.calls.controls.cameraOn")}
              >
                {call.local.video ? <VideocamRoundedIcon /> : <VideocamOffRoundedIcon />}
              </IconButton>
            </Tooltip>
          )}

          {/* viva-voz quando fizer sentido (mobile em geral) */}
          {isPhone && (
            <Tooltip title={i18n.t("chat.calls.controls.speaker")}>
              <IconButton
                className={`${classes.round}${speaker ? " " + classes.roundOn : ""}`}
                onClick={() => setSpeaker(s => !s)}
                aria-label={i18n.t("chat.calls.controls.speaker")}
              >
                <VolumeUpRoundedIcon />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title={i18n.t("chat.calls.controls.end")}>
            <IconButton className={classes.hang} onClick={call.leave} aria-label={i18n.t("chat.calls.controls.end") }>
              <CallEndRoundedIcon />
            </IconButton>
          </Tooltip>
        </div>
      </div>
    </Dialog>
  );
};

export default CallOverlay;
