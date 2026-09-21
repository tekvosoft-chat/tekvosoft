import React, { useEffect, useRef, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import IconButton from "@material-ui/core/IconButton";
import Tooltip from "@material-ui/core/Tooltip";
import MicRoundedIcon from "@material-ui/icons/MicRounded";
import MicOffRoundedIcon from "@material-ui/icons/MicOffRounded";
import VideocamRoundedIcon from "@material-ui/icons/VideocamRounded";
import VideocamOffRoundedIcon from "@material-ui/icons/VideocamOffRounded";
import ScreenShareRoundedIcon from "@material-ui/icons/ScreenShareRounded";
import StopScreenShareRoundedIcon from "@material-ui/icons/StopScreenShareRounded";
import CallEndRoundedIcon from "@material-ui/icons/CallEndRounded";

import UserAvatar from "../../components/ui/UserAvatar";

/**
 * Palco da chamada: vídeos em grade (quem está sem câmera aparece com a
 * foto), um anel verde em quem está falando e os controles embaixo —
 * microfone, câmera, tela e sair.
 */
const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    stage: {
      flex: "none",
      display: "flex",
      flexDirection: "column",
      gap: theme.spacing(1),
      padding: theme.spacing(1.5, 2),
      backgroundColor: "#0B0B0B",
      borderBottom: `1px solid ${t.border}`,
      [theme.breakpoints.down("xs")]: { padding: theme.spacing(1) }
    },
    grid: {
      display: "grid",
      gap: 8,
      height: "min(46vh, 420px)",
      [theme.breakpoints.down("xs")]: { height: "38vh" }
    },
    tile: {
      position: "relative",
      minWidth: 0,
      minHeight: 0,
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: "#1F1F1F",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "inset 0 0 0 2px transparent",
      transition: "box-shadow .15s ease",
      "& video": {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover"
      }
    },
    contain: { "& video": { objectFit: "contain", backgroundColor: "#000" } },
    mirror: { "& video": { transform: "scaleX(-1)" } },
    speaking: { boxShadow: "inset 0 0 0 3px #23A55A" },
    hidden: { visibility: "hidden" },
    label: {
      position: "absolute",
      left: 8,
      bottom: 8,
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      maxWidth: "calc(100% - 16px)",
      padding: "3px 8px",
      borderRadius: 8,
      fontSize: "0.75rem",
      fontWeight: 600,
      color: "#fff",
      backgroundColor: "rgba(0,0,0,.55)",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      "& svg": { fontSize: 15, color: "#F23F43" }
    },
    controls: {
      display: "flex",
      justifyContent: "center",
      gap: 10
    },
    control: {
      width: 44,
      height: 44,
      color: "#fff",
      backgroundColor: "#2B2B2B",
      "&:hover": { backgroundColor: "#3A3A3A" }
    },
    controlOff: {
      color: "#F23F43",
      backgroundColor: "#fff",
      "&:hover": { backgroundColor: "#eee" }
    },
    hangup: {
      width: 56,
      borderRadius: 22,
      color: "#fff",
      backgroundColor: "#DA373C",
      "&:hover": { backgroundColor: "#A12828" }
    }
  };
});

// alguém falando? (volume do áudio acima de um limite)
const useSpeaking = stream => {
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => {
    const track = stream?.getAudioTracks?.()[0];
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!track || !Ctx) return undefined;
    let ctx;
    let timer;
    try {
      ctx = new Ctx();
      const source = ctx.createMediaStreamSource(new MediaStream([track]));
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      timer = setInterval(() => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setSpeaking(track.enabled && avg > 18);
      }, 180);
    } catch (err) {
      return undefined;
    }
    return () => {
      clearInterval(timer);
      ctx?.close().catch(() => {});
    };
  }, [stream]);
  return speaking;
};

const Tile = ({ stream, name, user, audio, video, screen, self, classes }) => {
  const ref = useRef(null);
  const speaking = useSpeaking(stream);

  useEffect(() => {
    if (ref.current && ref.current.srcObject !== stream) {
      ref.current.srcObject = stream || null;
    }
  }, [stream]);

  const showVideo = !!stream && (video || screen);
  return (
    <div
      className={`${classes.tile}${speaking ? ` ${classes.speaking}` : ""}${
        screen ? ` ${classes.contain}` : ""
      }${self && !screen ? ` ${classes.mirror}` : ""}`}
    >
      {/* o vídeo fica sempre montado: é ele que toca o áudio de quem fala */}
      <video
        ref={ref}
        autoPlay
        playsInline
        muted={self}
        className={showVideo ? undefined : classes.hidden}
      />
      {!showVideo && <UserAvatar user={user} size={64} />}
      <span className={classes.label}>
        {!audio && <MicOffRoundedIcon />}
        {name}
        {screen ? " · tela" : ""}
      </span>
    </div>
  );
};

const columnsFor = count => {
  if (count <= 1) return "1fr";
  if (count <= 4) return "repeat(2, 1fr)";
  return "repeat(3, 1fr)";
};

const CallStage = ({ call, me }) => {
  const classes = useStyles();
  const { local, peers } = call;
  const total = peers.length + 1;

  return (
    <div className={classes.stage}>
      <div
        className={classes.grid}
        style={{ gridTemplateColumns: columnsFor(total) }}
      >
        <Tile
          classes={classes}
          self
          stream={local.stream}
          name={`${me?.name || "Você"} (você)`}
          user={me}
          audio={local.audio}
          video={local.video}
          screen={local.screen}
        />
        {peers.map(peer => (
          <Tile
            key={peer.socketId}
            classes={classes}
            stream={peer.stream}
            name={peer.name}
            user={{ name: peer.name, profileImage: peer.profileImage }}
            audio={peer.audio !== false}
            video={!!peer.video}
            screen={!!peer.screen}
          />
        ))}
      </div>
      <div className={classes.controls}>
        <Tooltip title={local.audio ? "Silenciar" : "Ativar microfone"}>
          <IconButton
            className={`${classes.control}${local.audio ? "" : ` ${classes.controlOff}`}`}
            onClick={call.toggleAudio}
          >
            {local.audio ? <MicRoundedIcon /> : <MicOffRoundedIcon />}
          </IconButton>
        </Tooltip>
        <Tooltip title={local.video ? "Desligar câmera" : "Ligar câmera"}>
          <IconButton
            className={`${classes.control}${local.video ? "" : ` ${classes.controlOff}`}`}
            onClick={call.toggleVideo}
          >
            {local.video ? <VideocamRoundedIcon /> : <VideocamOffRoundedIcon />}
          </IconButton>
        </Tooltip>
        {!!navigator.mediaDevices?.getDisplayMedia && (
          <Tooltip
            title={local.screen ? "Parar de compartilhar" : "Compartilhar tela"}
          >
            <IconButton className={classes.control} onClick={call.toggleScreen}>
              {local.screen ? (
                <StopScreenShareRoundedIcon />
              ) : (
                <ScreenShareRoundedIcon />
              )}
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Sair da chamada">
          <IconButton className={classes.hangup} onClick={call.leave}>
            <CallEndRoundedIcon />
          </IconButton>
        </Tooltip>
      </div>
    </div>
  );
};

export default CallStage;
