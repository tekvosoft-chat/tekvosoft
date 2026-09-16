import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core";
import ButtonBase from "@material-ui/core/ButtonBase";
import IconButton from "@material-ui/core/IconButton";
import GetAppRoundedIcon from "@material-ui/icons/GetAppRounded";

import DocumentAnnotator from "../DocumentAnnotator";
import { downloadFile } from "../../helpers/downloadFile";
import { i18n } from "../../translate/i18n";

/**
 * Cartão de PDF dentro da conversa, no formato do WhatsApp: ícone vermelho,
 * nome do arquivo, tipo e tamanho. O documento só é aberto (e só aí é
 * baixado de verdade) quando a pessoa toca no cartão — antes disso a
 * conversa não gasta banda montando pré-visualização.
 */
const MAX_UNRANGED_BYTES = 10 * 1024 * 1024; // 10 MB

const humanSize = bytes => {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
};

const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    card: {
      width: "100%",
      minWidth: 240,
      maxWidth: 320,
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 8px 10px 10px",
      borderRadius: 12,
      textAlign: "left",
      backgroundColor: t.isDark
        ? "rgba(255, 255, 255, 0.06)"
        : "rgba(11, 20, 26, 0.05)",
      transition: "background-color .15s ease",
      "&:hover": {
        backgroundColor: t.isDark
          ? "rgba(255, 255, 255, 0.1)"
          : "rgba(11, 20, 26, 0.09)"
      }
    },
    icon: {
      flex: "none",
      width: 40,
      height: 44,
      borderRadius: 6,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
      color: "#FFFFFF",
      backgroundColor: "#E5453A",
      fontSize: "0.5625rem",
      fontWeight: 800,
      letterSpacing: "0.04em",
      "&::before": {
        content: "''",
        width: 16,
        height: 16,
        borderRadius: 3,
        border: "2px solid rgba(255,255,255,0.9)",
        borderTopRightRadius: 0
      }
    },
    texts: { flex: 1, minWidth: 0 },
    name: {
      fontSize: "0.875rem",
      lineHeight: 1.25,
      color: t.chat.text,
      display: "-webkit-box",
      WebkitLineClamp: 2,
      WebkitBoxOrient: "vertical",
      overflow: "hidden",
      wordBreak: "break-word"
    },
    meta: {
      marginTop: 3,
      fontSize: "0.6875rem",
      color: t.chat.meta,
      textTransform: "uppercase",
      letterSpacing: "0.02em"
    },
    download: {
      flex: "none",
      width: 34,
      height: 34,
      color: t.chat.icon,
      "& svg": { fontSize: 20 }
    }
  };
});

function PdfPreview({ url, fileName, ticketId }) {
  const classes = useStyles();
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState(null);
  const [tooBig, setTooBig] = useState(false);

  // só um HEAD: descobre o tamanho para mostrar no cartão
  useEffect(() => {
    if (!url) return undefined;
    let alive = true;
    fetch(url, { method: "HEAD" })
      .then(res => {
        if (!alive) return;
        const length = res.headers.get("Content-Length");
        const ranges = res.headers.get("Accept-Ranges");
        const bytes = length ? parseInt(length, 10) : null;
        setSize(bytes);
        setTooBig(
          (!ranges || ranges === "none") &&
            bytes !== null &&
            bytes > MAX_UNRANGED_BYTES
        );
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [url]);

  const name = fileName || url?.split("/").pop() || "PDF";

  return (
    <>
      <ButtonBase
        className={classes.card}
        onClick={() => !tooBig && setOpen(true)}
        title={tooBig ? i18n.t("annotator.previewUnavailable") : name}
      >
        <span className={classes.icon}>PDF</span>
        <span className={classes.texts}>
          <span className={classes.name}>{name}</span>
          <span className={classes.meta}>
            PDF{size ? ` · ${humanSize(size)}` : ""}
          </span>
        </span>
        <IconButton
          className={classes.download}
          aria-label={i18n.t("annotator.download")}
          onClick={event => {
            event.stopPropagation();
            downloadFile(url);
          }}
        >
          <GetAppRoundedIcon />
        </IconButton>
      </ButtonBase>
      {open && (
        <DocumentAnnotator
          open={open}
          onClose={() => setOpen(false)}
          src={url}
          type="pdf"
          fileName={name}
          ticketId={ticketId}
        />
      )}
    </>
  );
}

export default PdfPreview;
