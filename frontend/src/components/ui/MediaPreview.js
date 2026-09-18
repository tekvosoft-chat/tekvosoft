import React, { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import Dialog from "@material-ui/core/Dialog";
import Slide from "@material-ui/core/Slide";
import Grow from "@material-ui/core/Grow";
import IconButton from "@material-ui/core/IconButton";
import InputBase from "@material-ui/core/InputBase";
import CircularProgress from "@material-ui/core/CircularProgress";
import CloseRoundedIcon from "@material-ui/icons/CloseRounded";
import SendRoundedIcon from "@material-ui/icons/SendRounded";
import CreateOutlinedIcon from "@material-ui/icons/CreateOutlined";
import DeleteOutlineRoundedIcon from "@material-ui/icons/DeleteOutlineRounded";
import AddRoundedIcon from "@material-ui/icons/AddRounded";
import ChevronLeftRoundedIcon from "@material-ui/icons/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@material-ui/icons/ChevronRightRounded";
import InsertDriveFileOutlinedIcon from "@material-ui/icons/InsertDriveFileOutlined";
import AudiotrackOutlinedIcon from "@material-ui/icons/AudiotrackOutlined";

import { i18n } from "../../translate/i18n";
import DocumentAnnotator from "../DocumentAnnotator";

/**
 * Prévia dos anexos antes de enviar, no jeito do WhatsApp.
 *
 * Abre em tela cheia no celular (e grande no computador), com fundo escuro
 * para a foto aparecer como o cliente vai ver. Embaixo fica o campo de
 * legenda — cada foto tem a sua — e o botão de enviar; acima dele, as
 * miniaturas com o "+" para juntar mais arquivos. No topo: fechar, desenhar
 * sobre a imagem e tirar o arquivo atual.
 *
 * Só apresenta: quem envia continua sendo o componente que chamou, que
 * recebe as legendas em `onSend(event, captions)`.
 */
const useStyles = makeStyles(theme => {
  return {
    paper: {
      backgroundColor: "#0b0a10",
      color: "#fff",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      [theme.breakpoints.up("sm")]: {
        width: "min(920px, calc(100vw - 64px))",
        height: "min(760px, calc(var(--vh, 100vh) - 64px))",
        maxWidth: "none",
        maxHeight: "none",
        borderRadius: 20
      }
    },
    backdrop: {
      backgroundColor: "rgba(8, 7, 12, 0.72)",
      backdropFilter: "blur(6px)"
    },
    top: {
      flex: "none",
      display: "flex",
      alignItems: "center",
      gap: 4,
      padding: theme.spacing(1, 1),
      paddingTop: `calc(${theme.spacing(1)}px + var(--safe-top, 0px))`,
      [theme.breakpoints.up("sm")]: { paddingTop: theme.spacing(1) },
      "& .MuiIconButton-root": {
        color: "#fff",
        transition: "background-color .15s ease, transform .12s ease",
        "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
        "&:active": { transform: "scale(0.9)" }
      }
    },
    title: {
      flex: 1,
      minWidth: 0,
      padding: "0 6px",
      display: "flex",
      flexDirection: "column"
    },
    titleMain: {
      fontSize: 15,
      fontWeight: 600,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    titleSub: { fontSize: 12, color: "rgba(255,255,255,0.6)" },
    stage: {
      position: "relative",
      flex: 1,
      minHeight: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: theme.spacing(1, 2),
      touchAction: "pan-y"
    },
    stageMedia: {
      maxWidth: "100%",
      maxHeight: "100%",
      objectFit: "contain",
      display: "block",
      borderRadius: 10,
      boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
      animation: "$enter .22s ease"
    },
    "@keyframes enter": {
      from: { opacity: 0, transform: "scale(.96)" },
      to: { opacity: 1, transform: "none" }
    },
    nav: {
      position: "absolute",
      top: "50%",
      marginTop: -22,
      width: 44,
      height: 44,
      color: "#fff",
      backgroundColor: "rgba(255,255,255,0.12)",
      backdropFilter: "blur(6px)",
      "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" },
      [theme.breakpoints.down("xs")]: { display: "none" }
    },
    navPrev: { left: 12 },
    navNext: { right: 12 },
    doc: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 10,
      padding: theme.spacing(4),
      borderRadius: 20,
      backgroundColor: "rgba(255,255,255,0.06)",
      textAlign: "center",
      maxWidth: 360,
      "& > svg": { fontSize: 64, color: "rgba(255,255,255,0.8)" }
    },
    docName: { fontSize: 15, fontWeight: 600, wordBreak: "break-word" },
    docSize: { fontSize: 13, color: "rgba(255,255,255,0.6)" },
    bottom: {
      flex: "none",
      display: "flex",
      flexDirection: "column",
      gap: 10,
      padding: theme.spacing(1, 1.5, 1.5),
      paddingBottom: `calc(${theme.spacing(1.5)}px + var(--safe-bottom, 0px))`,
      background:
        "linear-gradient(to top, rgba(11,10,16,1) 60%, rgba(11,10,16,0))"
    },
    strip: {
      display: "flex",
      gap: 8,
      overflowX: "auto",
      padding: "4px 2px",
      scrollbarWidth: "none",
      "&::-webkit-scrollbar": { display: "none" }
    },
    // miniaturas sem moldura: a escolhida ganha um anel branco por dentro,
    // como no WhatsApp (antes cada uma tinha um quadrado em volta)
    thumb: {
      position: "relative",
      flex: "none",
      width: 50,
      height: 50,
      borderRadius: 10,
      overflow: "hidden",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.08)",
      opacity: 0.55,
      transition:
        "opacity .2s ease, box-shadow .2s ease, transform .2s cubic-bezier(.34, 1.4, .64, 1)",
      "& img, & video": { width: "100%", height: "100%", objectFit: "cover" },
      "& svg": { color: "rgba(255,255,255,0.8)" },
      "&:active": { transform: "scale(0.94)" }
    },
    thumbActive: {
      opacity: 1,
      boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.95)",
      transform: "translateY(-1px)"
    },
    addTile: {
      opacity: 0.85,
      backgroundColor: "rgba(255,255,255,0.06)",
      boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.18)",
      "&:hover": {
        opacity: 1,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.4)"
      }
    },
    composer: {
      display: "flex",
      alignItems: "flex-end",
      gap: 8
    },
    captionPill: {
      flex: 1,
      minWidth: 0,
      display: "flex",
      alignItems: "center",
      minHeight: 46,
      padding: "4px 16px",
      borderRadius: 23,
      backgroundColor: "rgba(255,255,255,0.1)",
      border: "1px solid rgba(255,255,255,0.08)",
      transition: "background-color .15s ease, border-color .15s ease",
      "&:focus-within": {
        backgroundColor: "rgba(255,255,255,0.14)",
        borderColor: "rgba(255,255,255,0.25)"
      }
    },
    caption: {
      flex: 1,
      color: "#fff",
      // 16px: abaixo disso o iPhone dá zoom ao focar
      fontSize: 16,
      "& textarea": { maxHeight: 110, overflowY: "auto !important" },
      "& textarea::placeholder": { color: "rgba(255,255,255,0.55)", opacity: 1 }
    },
    send: {
      position: "relative",
      flex: "none",
      width: 50,
      height: 50,
      color: "var(--tkv-accent-text)",
      backgroundColor: "var(--tkv-accent)",
      boxShadow: "0 8px 20px -6px var(--tkv-accent)",
      transition: "transform .12s ease, filter .15s ease",
      "&:hover": {
        backgroundColor: "var(--tkv-accent)",
        filter: "brightness(1.08)"
      },
      "&:active": { transform: "scale(0.9)" },
      "&.Mui-disabled": {
        color: "var(--tkv-accent-text)",
        backgroundColor: "var(--tkv-accent)",
        opacity: 0.6
      }
    },
    count: {
      position: "absolute",
      top: -4,
      right: -4,
      minWidth: 20,
      height: 20,
      padding: "0 5px",
      borderRadius: 10,
      fontSize: 11,
      fontWeight: 700,
      lineHeight: "20px",
      color: "var(--tkv-accent)",
      backgroundColor: "#fff"
    },
    progress: { padding: "0 4px" },
    hiddenInput: { display: "none" }
  };
});

const kindOf = file => {
  const type = (file?.type || "").split("/")[0];
  return ["image", "video", "audio"].includes(type) ? type : "document";
};

const humanSize = bytes => {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isPdf = file =>
  file?.type === "application/pdf" || /\.pdf$/i.test(file?.name || "");

const SlideUp = React.forwardRef((props, ref) => (
  <Slide direction="up" ref={ref} {...props} />
));

const MediaPreview = ({
  files,
  onRemove,
  onReplace,
  onAdd,
  onClear,
  onSend,
  loading,
  disabled,
  progress,
  accent,
  accentText = "#FFFFFF",
  withCaption = false
}) => {
  const classes = useStyles();
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("xs"));
  const [selected, setSelected] = useState(0);
  const [annotating, setAnnotating] = useState(null);
  // legenda de cada arquivo, pela chave do arquivo (sobrevive a remoções)
  const [captions, setCaptions] = useState({});
  const addInputRef = useRef(null);
  const captionRef = useRef(null);
  const touchX = useRef(null);

  // endereços locais para exibir os arquivos sem enviá-los; liberados ao sair
  const urls = useMemo(
    () =>
      files.map(f =>
        kindOf(f) === "document" ? null : URL.createObjectURL(f)
      ),
    [files]
  );
  useEffect(() => () => urls.forEach(u => u && URL.revokeObjectURL(u)), [urls]);

  useEffect(() => {
    if (selected > files.length - 1) setSelected(Math.max(0, files.length - 1));
  }, [files.length, selected]);

  // no computador o cursor já vai para a legenda
  useEffect(() => {
    if (!isPhone && withCaption && files.length) {
      setTimeout(() => captionRef.current?.focus(), 250);
    }
  }, [isPhone, withCaption, files.length, selected]);

  if (!files.length) return null;

  const current = files[selected] || files[0];
  const currentUrl = urls[selected] || urls[0];
  const kind = kindOf(current);
  const keyOf = file => `${file.name}-${file.size}-${file.lastModified}`;
  const captionOf = file => captions[keyOf(file)] || "";

  const go = delta =>
    setSelected(i => Math.max(0, Math.min(files.length - 1, i + delta)));

  const send = event => {
    if (loading || disabled) return;
    onSend(
      event,
      files.map(file => captionOf(file).trim())
    );
  };

  const title =
    files.length === 1
      ? current.name
      : i18n.t("mediaPreview.position", {
          current: selected + 1,
          total: files.length
        });

  return (
    <Dialog
      open
      fullScreen={isPhone}
      onClose={loading ? undefined : onClear}
      TransitionComponent={isPhone ? SlideUp : Grow}
      transitionDuration={{ enter: 240, exit: 180 }}
      classes={{ paper: classes.paper }}
      BackdropProps={{ className: classes.backdrop }}
      PaperProps={{
        style: { "--tkv-accent": accent, "--tkv-accent-text": accentText }
      }}
    >
      <div className={classes.top}>
        <IconButton
          onClick={onClear}
          disabled={loading}
          aria-label={i18n.t("common.cancel")}
        >
          <CloseRoundedIcon />
        </IconButton>
        <div className={classes.title}>
          <span className={classes.titleMain}>{title}</span>
          {kind === "document" && (
            <span className={classes.titleSub}>{humanSize(current.size)}</span>
          )}
        </div>
        {onReplace && !loading && (kind === "image" || isPdf(current)) && (
          <IconButton
            aria-label={i18n.t("annotator.annotate")}
            onClick={() =>
              setAnnotating({
                index: selected,
                url: URL.createObjectURL(current),
                type: isPdf(current) ? "pdf" : "image",
                name: current.name
              })
            }
          >
            <CreateOutlinedIcon />
          </IconButton>
        )}
        {onRemove && !loading && files.length > 1 && (
          <IconButton
            aria-label={i18n.t("mediaPreview.remove")}
            onClick={() => onRemove(selected)}
          >
            <DeleteOutlineRoundedIcon />
          </IconButton>
        )}
      </div>

      <div
        className={classes.stage}
        onTouchStart={e => {
          touchX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={e => {
          if (touchX.current === null) return;
          const dx = (e.changedTouches[0]?.clientX ?? 0) - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        }}
      >
        {files.length > 1 && selected > 0 && (
          <IconButton
            className={`${classes.nav} ${classes.navPrev}`}
            onClick={() => go(-1)}
            aria-label="anterior"
          >
            <ChevronLeftRoundedIcon />
          </IconButton>
        )}
        {kind === "image" && (
          <img
            key={currentUrl}
            className={classes.stageMedia}
            src={currentUrl}
            alt={current.name}
          />
        )}
        {kind === "video" && (
          <video
            key={currentUrl}
            className={classes.stageMedia}
            src={currentUrl}
            controls
            playsInline
            preload="metadata"
          />
        )}
        {kind === "audio" && (
          <div className={classes.doc}>
            <AudiotrackOutlinedIcon />
            <span className={classes.docName}>{current.name}</span>
            <audio src={currentUrl} controls preload="metadata" />
          </div>
        )}
        {kind === "document" && (
          <div className={classes.doc}>
            <InsertDriveFileOutlinedIcon />
            <span className={classes.docName}>{current.name}</span>
            <span className={classes.docSize}>{humanSize(current.size)}</span>
          </div>
        )}
        {files.length > 1 && selected < files.length - 1 && (
          <IconButton
            className={`${classes.nav} ${classes.navNext}`}
            onClick={() => go(1)}
            aria-label="próximo"
          >
            <ChevronRightRoundedIcon />
          </IconButton>
        )}
      </div>

      <div className={classes.bottom}>
        {loading && progress && (
          <div className={classes.progress}>{progress}</div>
        )}

        {(files.length > 1 || onAdd) && (
          <div className={classes.strip}>
            {files.map((file, i) => {
              const k = kindOf(file);
              return (
                <div
                  key={`${keyOf(file)}-${i}`}
                  role="button"
                  tabIndex={0}
                  className={`${classes.thumb}${i === selected ? ` ${classes.thumbActive}` : ""}`}
                  onClick={() => setSelected(i)}
                  onKeyDown={e => e.key === "Enter" && setSelected(i)}
                  aria-label={file.name}
                  aria-pressed={i === selected}
                >
                  {k === "image" && <img src={urls[i]} alt="" />}
                  {k === "video" && (
                    <video src={urls[i]} muted preload="metadata" />
                  )}
                  {k === "audio" && <AudiotrackOutlinedIcon />}
                  {k === "document" && <InsertDriveFileOutlinedIcon />}
                </div>
              );
            })}
            {onAdd && !loading && (
              <div
                role="button"
                tabIndex={0}
                className={`${classes.thumb} ${classes.addTile}`}
                onClick={() => addInputRef.current?.click()}
                aria-label={i18n.t("mediaPreview.add")}
              >
                <AddRoundedIcon />
                <input
                  ref={addInputRef}
                  type="file"
                  multiple
                  className={classes.hiddenInput}
                  onChange={e => {
                    const added = Array.from(e.target.files || []);
                    e.target.value = "";
                    if (added.length) {
                      onAdd(added);
                      setSelected(files.length);
                    }
                  }}
                />
              </div>
            )}
          </div>
        )}

        <div className={classes.composer}>
          {withCaption && kind !== "audio" ? (
            <div className={classes.captionPill}>
              <InputBase
                inputRef={captionRef}
                multiline
                maxRows={5}
                className={classes.caption}
                placeholder={i18n.t("mediaPreview.captionPlaceholder")}
                value={captionOf(current)}
                disabled={loading}
                onChange={e => {
                  const value = e.target.value;
                  setCaptions(prev => ({ ...prev, [keyOf(current)]: value }));
                }}
                onKeyDown={e => {
                  // computador: Enter envia, Shift+Enter quebra a linha
                  if (!isPhone && e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(e);
                  }
                }}
              />
            </div>
          ) : (
            <div style={{ flex: 1 }} />
          )}
          <IconButton
            className={classes.send}
            onClick={send}
            disabled={loading || disabled}
            aria-label={i18n.t("mediaPreview.send")}
          >
            {loading ? (
              <CircularProgress size={22} style={{ color: "inherit" }} />
            ) : (
              <SendRoundedIcon />
            )}
            {files.length > 1 && !loading && (
              <span className={classes.count}>{files.length}</span>
            )}
          </IconButton>
        </div>
      </div>

      {annotating && (
        <DocumentAnnotator
          open
          src={annotating.url}
          type={annotating.type}
          fileName={annotating.name}
          onClose={() => {
            URL.revokeObjectURL(annotating.url);
            setAnnotating(null);
          }}
          onSave={file => onReplace(annotating.index, file)}
        />
      )}
    </Dialog>
  );
};

MediaPreview.propTypes = {
  files: PropTypes.array.isRequired,
  onRemove: PropTypes.func,
  onReplace: PropTypes.func,
  onAdd: PropTypes.func,
  onClear: PropTypes.func.isRequired,
  onSend: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  progress: PropTypes.node,
  accent: PropTypes.string,
  accentText: PropTypes.string,
  withCaption: PropTypes.bool
};

export default MediaPreview;
