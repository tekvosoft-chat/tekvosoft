import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/core/styles";
import IconButton from "@material-ui/core/IconButton";
import Button from "@material-ui/core/Button";
import CreateOutlinedIcon from "@material-ui/icons/CreateOutlined";
import Typography from "@material-ui/core/Typography";
import CloseRoundedIcon from "@material-ui/icons/CloseRounded";
import SendIcon from "@material-ui/icons/Send";
import InsertDriveFileOutlinedIcon from "@material-ui/icons/InsertDriveFileOutlined";
import AudiotrackOutlinedIcon from "@material-ui/icons/AudiotrackOutlined";

import { i18n } from "../../translate/i18n";
import DocumentAnnotator from "../DocumentAnnotator";

/**
 * Prévia dos arquivos antes de enviar.
 *
 * Antes, ao escolher uma foto, a barra de digitar era trocada por uma linha
 * com o NOME do arquivo ("IMG_4821.jpg") entre um X e uma seta — não dava
 * para ver qual foto era, nem conferir se era a certa antes de mandar para o
 * cliente. Agora a imagem aparece grande, vídeo e áudio tocam ali mesmo, e
 * documentos mostram nome e tamanho. Com vários arquivos, uma fileira de
 * miniaturas permite trocar a prévia e tirar um arquivo sem desistir dos
 * outros.
 *
 * Só apresenta: quem envia continua sendo o componente que já enviava.
 */
const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    root: {
      flex: "none",
      width: "100%",
      display: "flex",
      flexDirection: "column",
      gap: theme.spacing(1),
      padding: theme.spacing(1, 1.5, 1.25),
      paddingBottom: `calc(${theme.spacing(1.25)}px + var(--safe-bottom, 0px))`,
      borderTop: `1px solid ${t.border}`,
      animation: "tkvPreviewIn .2s ease-out"
    },
    header: {
      display: "flex",
      alignItems: "center",
      gap: theme.spacing(1)
    },
    headerText: {
      flex: 1,
      minWidth: 0,
      fontSize: "0.875rem",
      fontWeight: 600,
      color: theme.palette.text.primary,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    annotate: {
      position: "absolute",
      top: 10,
      right: 10,
      zIndex: 2,
      borderRadius: 999,
      padding: "4px 12px",
      textTransform: "none",
      fontWeight: 700,
      color: "#FFFFFF",
      backgroundColor: "rgba(0, 0, 0, 0.55)",
      backdropFilter: "blur(6px)",
      "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.7)" }
    },
    stage: {
      position: "relative",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "min(calc(var(--vh, 100vh) * 0.42), 320px)",
      borderRadius: t.radius.lg,
      overflow: "hidden",
      backgroundColor: t.isDark ? "#0B0A10" : "#1A1626"
    },
    stageMedia: {
      maxWidth: "100%",
      maxHeight: "100%",
      objectFit: "contain",
      display: "block"
    },
    doc: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: theme.spacing(1),
      padding: theme.spacing(2),
      color: "#FFFFFF",
      textAlign: "center",
      "& svg": { fontSize: 56, opacity: 0.9 }
    },
    docName: {
      fontSize: "0.9375rem",
      fontWeight: 600,
      maxWidth: 280,
      overflowWrap: "anywhere"
    },
    docSize: { fontSize: "0.75rem", opacity: 0.7 },
    footer: {
      display: "flex",
      alignItems: "center",
      gap: theme.spacing(1)
    },
    strip: {
      flex: 1,
      minWidth: 0,
      display: "flex",
      gap: theme.spacing(0.75),
      overflowX: "auto",
      padding: "4px 2px",
      scrollbarWidth: "none",
      "&::-webkit-scrollbar": { display: "none" }
    },
    thumb: {
      position: "relative",
      flex: "none",
      width: 56,
      height: 56,
      padding: 0,
      borderRadius: t.radius.md,
      overflow: "hidden",
      border: "2px solid transparent",
      backgroundColor: t.surfaceSunken,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: theme.palette.text.secondary,
      "& img, & video": {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block"
      }
    },
    thumbActive: { borderColor: "var(--tkv-accent)" },
    thumbRemove: {
      position: "absolute",
      top: 2,
      right: 2,
      width: 20,
      height: 20,
      padding: 0,
      borderRadius: "50%",
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      color: "#FFFFFF",
      "& svg": { fontSize: 14 },
      "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.8)" }
    },
    send: {
      flex: "none",
      width: 52,
      height: 52,
      marginLeft: "auto",
      borderRadius: "50%",
      backgroundColor: "var(--tkv-accent)",
      color: "var(--tkv-accent-text, #FFFFFF)",
      boxShadow: theme.shadows[4],
      "&:hover": {
        backgroundColor: "var(--tkv-accent)",
        filter: "brightness(0.95)"
      },
      "&.Mui-disabled": {
        backgroundColor: "var(--tkv-accent)",
        color: "var(--tkv-accent-text, #FFFFFF)",
        opacity: 0.5
      }
    },
    progress: { width: "100%" }
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

const MediaPreview = ({
  files,
  onRemove,
  onReplace,
  onClear,
  onSend,
  loading,
  disabled,
  progress,
  accent,
  accentText = "#FFFFFF",
  className
}) => {
  const classes = useStyles();
  const [selected, setSelected] = useState(0);
  const [annotating, setAnnotating] = useState(null);

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

  if (!files.length) return null;

  const current = files[selected] || files[0];
  const currentUrl = urls[selected] || urls[0];
  const kind = kindOf(current);

  const title =
    files.length === 1
      ? current.name
      : `${files.length} ${i18n.t("mediaPreview.files")}`;

  return (
    <div
      className={`${classes.root}${className ? ` ${className}` : ""}`}
      style={{ "--tkv-accent": accent, "--tkv-accent-text": accentText }}
    >
      <div className={classes.header}>
        <IconButton
          size="small"
          onClick={onClear}
          disabled={loading}
          aria-label={i18n.t("common.cancel")}
        >
          <CloseRoundedIcon />
        </IconButton>
        <Typography component="p" className={classes.headerText}>
          {title}
        </Typography>
      </div>

      <div className={classes.stage}>
        {onReplace && !loading && (kind === "image" || isPdf(current)) && (
          <Button
            size="small"
            className={classes.annotate}
            startIcon={<CreateOutlinedIcon />}
            onClick={() =>
              setAnnotating({
                index: selected,
                url: URL.createObjectURL(current),
                type: isPdf(current) ? "pdf" : "image",
                name: current.name
              })
            }
          >
            {i18n.t("annotator.annotate")}
          </Button>
        )}
        {kind === "image" && (
          <img
            className={classes.stageMedia}
            src={currentUrl}
            alt={current.name}
          />
        )}
        {kind === "video" && (
          <video
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
      </div>

      {loading && progress && (
        <div className={classes.progress}>{progress}</div>
      )}

      <div className={classes.footer}>
        <div className={classes.strip}>
          {files.length > 1 &&
            files.map((file, i) => {
              const k = kindOf(file);
              return (
                <div
                  key={`${file.name}-${i}`}
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
                  {onRemove && !loading && (
                    <IconButton
                      className={classes.thumbRemove}
                      aria-label={i18n.t("mediaPreview.remove")}
                      onClick={e => {
                        e.stopPropagation();
                        onRemove(i);
                      }}
                    >
                      <CloseRoundedIcon />
                    </IconButton>
                  )}
                </div>
              );
            })}
        </div>
        <IconButton
          className={classes.send}
          onClick={onSend}
          disabled={loading || disabled}
          aria-label={i18n.t("mediaPreview.send")}
        >
          <SendIcon />
        </IconButton>
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
    </div>
  );
};

MediaPreview.propTypes = {
  files: PropTypes.array.isRequired,
  onRemove: PropTypes.func,
  onReplace: PropTypes.func,
  onClear: PropTypes.func.isRequired,
  onSend: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  progress: PropTypes.node,
  accent: PropTypes.string.isRequired,
  accentText: PropTypes.string
};

export default MediaPreview;
