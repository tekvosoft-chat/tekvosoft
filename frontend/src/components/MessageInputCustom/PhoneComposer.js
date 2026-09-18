import React, { useEffect, useRef, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import ButtonBase from "@material-ui/core/ButtonBase";
import IconButton from "@material-ui/core/IconButton";
import CircularProgress from "@material-ui/core/CircularProgress";
import Collapse from "@material-ui/core/Collapse";
import PhotoCameraOutlinedIcon from "@material-ui/icons/PhotoCameraOutlined";
import PhotoLibraryOutlinedIcon from "@material-ui/icons/PhotoLibraryOutlined";
import InsertDriveFileOutlinedIcon from "@material-ui/icons/InsertDriveFileOutlined";
import FlashOnRoundedIcon from "@material-ui/icons/FlashOnRounded";
import DeleteOutlineRoundedIcon from "@material-ui/icons/DeleteOutlineRounded";
import SendRoundedIcon from "@material-ui/icons/SendRounded";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignature } from "@fortawesome/free-solid-svg-icons";

import RoomOutlinedIcon from "@material-ui/icons/RoomOutlined";
import { i18n } from "../../translate/i18n";

/**
 * Peças da barra de mensagem no celular, no desenho do WhatsApp do iPhone:
 * o painel do "+" (que abre no lugar do teclado) e a gravação de áudio.
 * Só apresentam — quem envia continua sendo o MessageInputCustom.
 * As cores saem da marca, então acompanham o tema escolhido pela empresa.
 */
const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    // ── painel do "+" ──
    attachGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      rowGap: theme.spacing(2),
      padding: theme.spacing(2, 1, 1.5)
    },
    tile: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      gap: 8,
      minWidth: 0,
      padding: theme.spacing(0.5, 0),
      borderRadius: t.radius.md,
      WebkitTapHighlightColor: "transparent",
      "&:active $tileIcon": { transform: "scale(0.92)" }
    },
    tileIcon: {
      width: 58,
      height: 58,
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.brand.textSoft,
      color: t.brand.text,
      transition: "transform .15s ease, background-color .2s ease",
      "& svg": { fontSize: 27 },
      "& .svg-inline--fa": { fontSize: 22 }
    },
    tileOff: {
      "& $tileIcon": {
        backgroundColor: t.chat.input,
        color: theme.palette.text.secondary
      }
    },
    tileLabel: {
      maxWidth: "100%",
      fontSize: "0.75rem",
      fontWeight: 500,
      lineHeight: 1.25,
      textAlign: "center",
      color: t.chat.text
    },
    tileState: {
      display: "block",
      fontSize: "0.6875rem",
      fontWeight: 400,
      color: theme.palette.text.secondary
    },
    hiddenInput: { display: "none" },

    // ── gravação ──
    // uma linha só, como no WhatsApp: lixeira, tempo com o ponto vermelho,
    // a onda e o enviar (antes eram duas linhas e a barra ficava alta)
    rec: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: theme.spacing(1),
      padding: theme.spacing(0.75, 1),
      animation: "$recIn .24s cubic-bezier(.3, 1.2, .5, 1) both"
    },
    "@keyframes recIn": {
      from: { opacity: 0, transform: "translateY(10px)" },
      to: { opacity: 1, transform: "none" }
    },
    recTop: {
      flex: 1,
      minWidth: 0,
      display: "flex",
      alignItems: "center",
      gap: theme.spacing(1.25),
      minHeight: 32
    },
    recTime: {
      flex: "none",
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      minWidth: 62,
      fontSize: "0.9375rem",
      fontVariantNumeric: "tabular-nums",
      color: t.chat.text
    },
    wave: {
      flex: 1,
      minWidth: 0,
      height: 30,
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: 3,
      overflow: "hidden"
    },
    bar: {
      flex: "none",
      width: 3,
      height: "100%",
      borderRadius: 3,
      backgroundColor: t.brand.text,
      opacity: 0.35,
      transform: "scaleY(0.12)",
      transition:
        "transform .16s cubic-bezier(.3, 1.4, .5, 1), opacity .16s ease",
      // as barras mais recentes (à direita) ficam mais fortes
      "&:nth-last-child(-n+14)": { opacity: 0.65 },
      "&:nth-last-child(-n+6)": { opacity: 1 }
    },
    recBottom: { display: "contents" },
    trash: {
      flex: "none",
      color: t.chat.icon,
      transition: "transform .15s ease, color .15s ease",
      "&:active": { transform: "scale(0.88)", color: t.semantic.danger },
      "& svg": { fontSize: 24 }
    },
    liveDot: {
      width: 10,
      height: 10,
      borderRadius: "50%",
      backgroundColor: t.semantic.danger,
      animation: "$pulse 1.2s ease-in-out infinite"
    },
    "@keyframes recRing": {
      "0%": { boxShadow: `0 0 0 0 ${t.brand.main}` },
      "100%": { boxShadow: "0 0 0 14px transparent" }
    },
    "@keyframes pulse": {
      "0%, 100%": { opacity: 1, transform: "scale(1)" },
      "50%": { opacity: 0.35, transform: "scale(0.8)" }
    },
    send: {
      width: 48,
      height: 48,
      padding: 0,
      borderRadius: "50%",
      backgroundColor: t.brand.main,
      color: t.brand.contrastText,
      // anel pulsando enquanto grava
      animation: "$recRing 1.6s ease-out infinite",
      transition: "transform .12s ease",
      "&:active": { transform: "scale(0.9)" },
      "&:hover": { backgroundColor: t.brand.hover },
      "&.Mui-disabled": {
        backgroundColor: t.brand.main,
        color: t.brand.contrastText,
        opacity: 0.6
      },
      "& svg": { fontSize: 24 }
    }
  };
});

const Tile = ({ icon, label, state, off, htmlFor, onClick }) => {
  const classes = useStyles();
  return (
    <ButtonBase
      component={htmlFor ? "label" : "button"}
      htmlFor={htmlFor}
      onClick={onClick}
      disableRipple
      className={`${classes.tile}${off ? ` ${classes.tileOff}` : ""}`}
    >
      <span className={classes.tileIcon}>{icon}</span>
      <span className={classes.tileLabel}>
        {label}
        {state && <span className={classes.tileState}>{state}</span>}
      </span>
    </ButtonBase>
  );
};

export const AttachPanel = ({
  open,
  disabled,
  onFiles,
  onQuickReplies,
  signMessage,
  onToggleSign,
  onLocation
}) => {
  const classes = useStyles();
  const input = (id, props) => (
    <input
      id={id}
      type="file"
      className={classes.hiddenInput}
      disabled={disabled}
      onChange={onFiles}
      {...props}
    />
  );

  // os campos de arquivo ficam fora do painel recolhível: a câmera da barra
  // também aponta para eles, com o painel fechado
  return (
    <>
      {input("camera-button", { accept: "image/*", capture: "environment" })}
      {input("gallery-button", { accept: "image/*,video/*", multiple: true })}
      {input("upload-button", { multiple: true })}
      <Collapse in={open} timeout={220} style={{ width: "100%" }}>
        <div className={classes.attachGrid}>
          <Tile
            htmlFor="camera-button"
            icon={<PhotoCameraOutlinedIcon />}
            label={i18n.t("messagesInput.phone.camera")}
          />
          <Tile
            htmlFor="gallery-button"
            icon={<PhotoLibraryOutlinedIcon />}
            label={i18n.t("messagesInput.phone.gallery")}
          />
          <Tile
            htmlFor="upload-button"
            icon={<InsertDriveFileOutlinedIcon />}
            label={i18n.t("messagesInput.phone.document")}
          />
          {onLocation && (
            <Tile
              onClick={onLocation}
              icon={<RoomOutlinedIcon />}
              label="Localização"
            />
          )}
          <Tile
            onClick={onQuickReplies}
            icon={<FlashOnRoundedIcon />}
            label={i18n.t("messagesInput.phone.quickReplies")}
          />
          <Tile
            onClick={onToggleSign}
            off={!signMessage}
            icon={<FontAwesomeIcon icon={faSignature} />}
            label={i18n.t("messagesInput.phone.signature")}
            state={
              signMessage
                ? i18n.t("messagesInput.phone.on")
                : i18n.t("messagesInput.phone.off")
            }
          />
        </div>
      </Collapse>
    </>
  );
};

const BARS = 34;

/**
 * Onda do áudio sendo gravado. Lê o volume do próprio microfone que o
 * gravador já abriu (um segundo pedido de microfone no iPhone pode silenciar
 * o primeiro). Sem acesso a ele, a onda só respira, sem inventar volume.
 */
const Waveform = ({ recorder }) => {
  const classes = useStyles();
  const bars = useRef([]);

  useEffect(() => {
    const levels = new Array(BARS).fill(0.12);
    let analyser = null;
    let data = null;
    try {
      if (recorder?.context && recorder?.microphone) {
        analyser = recorder.context.createAnalyser();
        analyser.fftSize = 512;
        data = new Uint8Array(analyser.fftSize);
        recorder.microphone.connect(analyser);
      }
    } catch (err) {
      analyser = null;
    }

    let tick = 0;
    const timer = setInterval(() => {
      let level;
      if (analyser) {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i += 1) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        level = Math.min(1, Math.sqrt(sum / data.length) * 4.5);
      } else {
        tick += 1;
        level = 0.25 + 0.18 * Math.sin(tick / 2.2) * Math.sin(tick / 5.3);
      }
      levels.shift();
      levels.push(Math.max(0.12, level));
      bars.current.forEach((el, i) => {
        if (el) el.style.transform = `scaleY(${levels[i]})`;
      });
    }, 90);

    return () => {
      clearInterval(timer);
      try {
        if (analyser) recorder.microphone.disconnect(analyser);
      } catch (err) {
        // o gravador já desligou o microfone
      }
    };
  }, [recorder]);

  return (
    <div className={classes.wave} aria-hidden="true">
      {Array.from({ length: BARS }, (_, i) => (
        <span
          key={i}
          ref={el => {
            bars.current[i] = el;
          }}
          className={classes.bar}
        />
      ))}
    </div>
  );
};

const Elapsed = () => {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const started = Date.now();
    const timer = setInterval(
      () => setSeconds(Math.floor((Date.now() - started) / 1000)),
      250
    );
    return () => clearInterval(timer);
  }, []);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};

export const RecordingPanel = ({ recorder, loading, onCancel, onSend }) => {
  const classes = useStyles();
  return (
    <div className={classes.rec}>
      <IconButton
        className={classes.trash}
        onClick={onCancel}
        disabled={loading}
        aria-label={i18n.t("messagesInput.phone.discardAudio")}
      >
        <DeleteOutlineRoundedIcon />
      </IconButton>
      <div className={classes.recTop}>
        <span className={classes.recTime}>
          <span className={classes.liveDot} />
          <Elapsed />
        </span>
        <Waveform recorder={recorder} />
      </div>
      <div className={classes.recBottom}>
        <IconButton
          className={classes.send}
          onClick={onSend}
          disabled={loading}
          aria-label={i18n.t("messagesInput.phone.sendAudio")}
        >
          {loading ? (
            <CircularProgress size={22} color="inherit" />
          ) : (
            <SendRoundedIcon />
          )}
        </IconButton>
      </div>
    </div>
  );
};
