import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import IconButton from "@material-ui/core/IconButton";
import ClearIcon from "@material-ui/icons/Clear";

import api from "../../services/api";
import { i18n } from "../../translate/i18n";

/**
 * Prévia do link que está sendo digitado, como no WhatsApp: aparece em cima
 * da caixa de texto antes de enviar. O X fecha a prévia e a mensagem sai
 * sem ela (quem recebe também não vê o cartão).
 */

const URL_RE = /\b((?:https?:\/\/|www\.)[^\s<>"]+)/i;

export const firstUrl = text => {
  const match = String(text || "").match(URL_RE);
  return match ? match[1].replace(/[.,;:!?)\]}'"]+$/, "") : null;
};

// um pedido por link enquanto a página estiver aberta
const requests = new Map();
const fetchPreview = url => {
  if (!requests.has(url)) {
    requests.set(
      url,
      api
        .get("/link-preview", { params: { url } })
        .then(({ data }) => data || null)
        .catch(() => {
          requests.delete(url);
          return null;
        })
    );
  }
  return requests.get(url);
};

export const useLinkPreview = text => {
  const url = firstUrl(text);
  const [state, setState] = useState({ url: null, preview: null });

  useEffect(() => {
    if (!url) {
      setState({ url: null, preview: null });
      return undefined;
    }
    let alive = true;
    setState(prev => (prev.url === url ? prev : { url, preview: undefined }));
    // espera a pessoa parar de digitar o endereço
    const timer = setTimeout(() => {
      fetchPreview(url).then(preview => alive && setState({ url, preview }));
    }, 500);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [url]);

  return state;
};

const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    wrapper: {
      display: "flex",
      width: "100%",
      alignItems: "center",
      gap: 6,
      padding: "10px 12px 2px",
      animation: "$slide .3s cubic-bezier(.3, 1.35, .5, 1) both",
      [theme.breakpoints.down("xs")]: { padding: "6px 6px 0" }
    },
    "@keyframes slide": {
      from: { opacity: 0, transform: "translateY(12px) scale(.97)" },
      to: { opacity: 1, transform: "none" }
    },
    card: {
      flex: 1,
      minWidth: 0,
      display: "flex",
      alignItems: "stretch",
      minHeight: 64,
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: t.chat.input,
      border: `1px solid ${t.border}`
    },
    thumb: {
      flex: "none",
      width: 72,
      objectFit: "cover",
      backgroundColor: t.surfaceHover
    },
    text: {
      flex: 1,
      minWidth: 0,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      gap: 2,
      padding: "8px 12px"
    },
    title: {
      fontSize: "0.875rem",
      fontWeight: 600,
      lineHeight: 1.3,
      color: t.chat.text,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    description: {
      fontSize: "0.8125rem",
      lineHeight: 1.35,
      color: t.chat.meta,
      display: "-webkit-box",
      WebkitLineClamp: 2,
      WebkitBoxOrient: "vertical",
      overflow: "hidden"
    },
    site: {
      fontSize: "0.75rem",
      color: t.chat.meta,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    loading: {
      fontSize: "0.8125rem",
      color: t.chat.meta,
      animation: "$pulse 1.2s ease-in-out infinite"
    },
    "@keyframes pulse": { "50%": { opacity: 0.45 } },
    close: {
      flex: "none",
      [theme.breakpoints.down("xs")]: {
        padding: 6,
        "& svg": { fontSize: 20 }
      }
    }
  };
});

const LinkPreviewBar = ({ state, onClose }) => {
  const classes = useStyles();
  const [imageFailed, setImageFailed] = useState(false);
  const { url, preview } = state;

  useEffect(() => setImageFailed(false), [preview?.image]);

  // sem link, ou página sem prévia: nada aparece
  if (!url || preview === null) return null;

  return (
    <div className={classes.wrapper}>
      <div className={classes.card}>
        {preview?.image && !imageFailed && (
          <img
            className={classes.thumb}
            src={preview.image}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
          />
        )}
        <div className={classes.text}>
          {preview === undefined ? (
            <span className={classes.loading}>
              {i18n.t("messagesInput.linkPreview.loading")}
            </span>
          ) : (
            <>
              {preview.title && (
                <div className={classes.title}>{preview.title}</div>
              )}
              {preview.description && (
                <div className={classes.description}>{preview.description}</div>
              )}
              <div className={classes.site}>{preview.site}</div>
            </>
          )}
        </div>
      </div>
      <IconButton
        className={classes.close}
        onClick={onClose}
        aria-label={i18n.t("messagesInput.linkPreview.remove")}
      >
        <ClearIcon />
      </IconButton>
    </div>
  );
};

export default LinkPreviewBar;
