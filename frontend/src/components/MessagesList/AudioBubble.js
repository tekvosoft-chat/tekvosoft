import React, { useEffect, useMemo, useRef, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Avatar from "@material-ui/core/Avatar";
import ButtonBase from "@material-ui/core/ButtonBase";
import PlayArrowRoundedIcon from "@material-ui/icons/PlayArrowRounded";
import PauseRoundedIcon from "@material-ui/icons/PauseRounded";
import MicRoundedIcon from "@material-ui/icons/MicRounded";

import { getInitials } from "../../helpers/getInitials";
import api from "../../services/api";

/**
 * Áudio no desenho do WhatsApp: foto com o microfone, play, onda que vai
 * sendo "pintada" conforme toca, tempo e velocidade (1×, 1,5×, 2×).
 *
 * A onda é decorativa — o arquivo não traz a forma do som — mas é sempre a
 * mesma para a mesma mensagem. Tocar em qualquer ponto dela pula para ali.
 * Só um áudio toca por vez.
 */
const PLAY_EVENT = "tkv:audio-play";
const BARS = 36;
const SPEEDS = [1, 1.5, 2];

const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    // nova versão: [tocar] [ondas + tempo] [foto], tudo alinhado ao centro,
    // com espaço embaixo para o horário da mensagem
    root: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      width: 300,
      maxWidth: "100%",
      padding: "8px 6px 18px 4px",
      whiteSpace: "normal",
      [theme.breakpoints.down("xs")]: {
        width: "min(270px, 72vw)",
        gap: 8,
        padding: "6px 4px 18px 2px"
      }
    },
    side: {
      order: 3,
      position: "relative",
      flex: "none",
      width: 46,
      height: 46,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      [theme.breakpoints.down("xs")]: { width: 42, height: 42 }
    },
    avatar: {
      width: "100%",
      height: "100%",
      fontSize: "0.9375rem",
      fontWeight: 700,
      color: "#FFFFFF"
    },
    mic: {
      position: "absolute",
      left: -4,
      bottom: -3,
      width: 18,
      height: 18,
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: t.brand.text,
      backgroundColor: t.chat.bubbleIn,
      "& svg": { fontSize: 14 }
    },
    speed: {
      minWidth: 44,
      height: 28,
      padding: "0 8px",
      borderRadius: 14,
      fontSize: "0.8125rem",
      fontWeight: 700,
      color: "#FFFFFF",
      backgroundColor: "rgba(0, 0, 0, 0.32)"
    },
    play: {
      order: 1,
      flex: "none",
      width: 38,
      height: 38,
      borderRadius: "50%",
      color: t.chat.icon,
      transition: "transform .12s ease",
      "&:active": { transform: "scale(0.9)" },
      "& svg": { fontSize: 34 }
    },
    body: {
      order: 2,
      flex: 1,
      minWidth: 0,
      position: "relative",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      height: 46
    },
    wave: {
      position: "relative",
      height: 28,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      cursor: "pointer",
      touchAction: "none"
    },
    bar: {
      width: 2.5,
      borderRadius: 2,
      backgroundColor: t.chat.meta,
      opacity: 0.55,
      transition: "background-color .15s linear, opacity .15s linear"
    },
    barPlayed: {
      backgroundColor: t.brand.text,
      opacity: 1
    },
    thumb: {
      position: "absolute",
      top: "50%",
      width: 12,
      height: 12,
      marginLeft: -6,
      marginTop: -6,
      borderRadius: "50%",
      backgroundColor: t.brand.text,
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.25)",
      pointerEvents: "none"
    },
    time: {
      position: "absolute",
      left: 0,
      bottom: -12,
      fontSize: "0.6875rem",
      fontVariantNumeric: "tabular-nums",
      color: t.chat.meta
    }
  };
});

const hashBars = seed => {
  let h = 2166136261;
  const text = String(seed || "audio");
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Array.from({ length: BARS }, (_, i) => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    const r = ((h >>> 0) % 1000) / 1000;
    // mais alto no meio, mais baixo nas pontas, como uma fala
    const envelope = 0.45 + 0.55 * Math.sin((Math.PI * (i + 0.5)) / BARS);
    return Math.max(0.18, Math.min(1, (0.25 + r * 0.75) * envelope));
  });
};

const clock = seconds => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

// foto do número conectado (a "minha foto" dos áudios enviados), uma busca
// por conexão enquanto a página estiver aberta
const connectionPictures = new Map();
const useConnectionPicture = whatsappId => {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!whatsappId) return undefined;
    let alive = true;
    if (!connectionPictures.has(whatsappId)) {
      connectionPictures.set(
        whatsappId,
        api
          .get(`/whatsapp/${whatsappId}/profile-picture`)
          .then(({ data }) => data?.url || null)
          .catch(() => null)
      );
    }
    connectionPictures.get(whatsappId).then(value => {
      if (alive) setUrl(value);
    });
    return () => {
      alive = false;
    };
  }, [whatsappId]);
  return url;
};

const AudioBubble = ({
  id,
  src,
  fromMe,
  avatarUrl,
  whatsappId,
  name,
  color
}) => {
  const classes = useStyles();
  const audioRef = useRef(null);
  const waveRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const bars = useMemo(() => hashBars(id || src), [id, src]);
  const ownPicture = useConnectionPicture(fromMe ? whatsappId : null);
  const picture = fromMe ? ownPicture : avatarUrl;

  useEffect(() => {
    const onOtherPlay = event => {
      if (event.detail !== audioRef.current && audioRef.current) {
        audioRef.current.pause();
      }
    };
    window.addEventListener(PLAY_EVENT, onOtherPlay);
    return () => window.removeEventListener(PLAY_EVENT, onOtherPlay);
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      window.dispatchEvent(new CustomEvent(PLAY_EVENT, { detail: audio }));
      audio.playbackRate = speed;
      audio.play().catch(() => setPlaying(false));
    } else {
      audio.pause();
    }
  };

  const seekTo = clientX => {
    const audio = audioRef.current;
    const box = waveRef.current?.getBoundingClientRect();
    if (!audio || !box || !Number.isFinite(audio.duration)) return;
    const ratio = Math.min(1, Math.max(0, (clientX - box.left) / box.width));
    audio.currentTime = ratio * audio.duration;
    setCurrent(audio.currentTime);
  };

  const cycleSpeed = () => {
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const progress = duration > 0 ? Math.min(1, current / duration) : 0;
  const started = playing || current > 0;

  return (
    // foto sempre à esquerda, como no WhatsApp: o horário do balão fica livre
    <div className={classes.root}>
      <audio
        ref={audioRef}
        preload="metadata"
        src={src}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setCurrent(0);
        }}
        onLoadedMetadata={e => setDuration(e.currentTarget.duration)}
        onDurationChange={e => setDuration(e.currentTarget.duration)}
        onTimeUpdate={e => {
          setCurrent(e.currentTarget.currentTime);
          if (!Number.isFinite(duration) || duration <= 0) {
            setDuration(e.currentTarget.duration);
          }
        }}
      />

      <div className={classes.side}>
        {playing ? (
          <ButtonBase className={classes.speed} onClick={cycleSpeed}>
            {String(speed).replace(".", ",")}×
          </ButtonBase>
        ) : (
          <>
            <Avatar
              src={picture || undefined}
              className={classes.avatar}
              style={{ backgroundColor: color }}
            >
              {getInitials(name || "")}
            </Avatar>
            <span className={classes.mic}>
              <MicRoundedIcon />
            </span>
          </>
        )}
      </div>

      <ButtonBase
        className={classes.play}
        onClick={toggle}
        aria-label={playing ? "Pausar áudio" : "Tocar áudio"}
      >
        {playing ? <PauseRoundedIcon /> : <PlayArrowRoundedIcon />}
      </ButtonBase>

      <div className={classes.body}>
        <div
          ref={waveRef}
          className={classes.wave}
          onPointerDown={e => {
            e.currentTarget.setPointerCapture?.(e.pointerId);
            seekTo(e.clientX);
          }}
          onPointerMove={e => {
            if (e.buttons || e.pointerType === "touch") {
              if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
                seekTo(e.clientX);
              }
            }
          }}
        >
          {bars.map((height, i) => (
            <span
              key={i}
              className={`${classes.bar}${
                started && (i + 0.5) / BARS <= progress
                  ? ` ${classes.barPlayed}`
                  : ""
              }`}
              style={{ height: `${Math.round(height * 100)}%` }}
            />
          ))}
          {started && (
            <span
              className={classes.thumb}
              style={{ left: `${progress * 100}%` }}
            />
          )}
        </div>
        <span className={classes.time}>
          {clock(started ? current : duration)}
        </span>
      </div>
    </div>
  );
};

export default AudioBubble;
