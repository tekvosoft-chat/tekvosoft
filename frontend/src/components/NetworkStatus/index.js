import React, { useCallback, useContext, useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";

import axios from "axios";

import api from "../../services/api";
import { SocketContext } from "../../context/Socket/SocketContext";
import { i18n } from "../../translate/i18n";

/**
 * Aviso de internet.
 *
 * Pílula fininha no topo, uma para cada situação (carregando, enviando,
 * conexão lenta, reconectando, servidor sem resposta, conectado de novo).
 * Some sozinha quando passa.
 * Sem    → a tela toda, com o cabo desligado se mexendo e um texto leve.
 *          É desenho feito em SVG de propósito: sem internet, um GIF da web
 *          não carregaria.
 */

const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    // ── lenta ──
    pill: {
      position: "fixed",
      top: "calc(var(--safe-top, 0px) + 8px)",
      left: "50%",
      zIndex: theme.zIndex.snackbar + 2,
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      height: 28,
      padding: "0 12px",
      borderRadius: 999,
      fontSize: "0.75rem",
      fontWeight: 600,
      color: theme.palette.text.secondary,
      backgroundColor: t.surface,
      border: `1px solid ${t.border}`,
      boxShadow: "0 6px 20px -10px rgba(12, 10, 20, 0.45)",
      pointerEvents: "none",
      animation: "$pillIn .3s cubic-bezier(.3, 1.2, .5, 1) both"
    },
    "@keyframes pillIn": {
      from: { opacity: 0, transform: "translate(-50%, -12px)" },
      to: { opacity: 1, transform: "translate(-50%, 0)" }
    },
    bars: {
      display: "inline-flex",
      alignItems: "flex-end",
      gap: 2,
      height: 12
    },
    bar: {
      width: 3,
      borderRadius: 1,
      backgroundColor: t.semantic.warning || theme.palette.text.secondary,
      animation: "$barBlink 1.1s ease-in-out infinite"
    },

    // carregando, enviando, reconectando: um giro discreto
    spinner: {
      width: 12,
      height: 12,
      borderRadius: "50%",
      border: `2px solid ${t.border}`,
      borderTopColor: theme.palette.text.secondary,
      animation: "$spin .8s linear infinite"
    },
    "@keyframes spin": { to: { transform: "rotate(360deg)" } },
    // servidor sem resposta
    warnDot: {
      width: 8,
      height: 8,
      borderRadius: "50%",
      backgroundColor: t.semantic.danger,
      animation: "$barBlink 1.1s ease-in-out infinite"
    },
    "@keyframes barBlink": {
      "0%, 100%": { opacity: 0.25 },
      "50%": { opacity: 1 }
    },

    // ── sem internet ──
    screen: {
      position: "fixed",
      inset: 0,
      zIndex: theme.zIndex.modal + 5,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: theme.spacing(3),
      textAlign: "center",
      backgroundColor: t.surfaceSunken,
      animation: "$screenIn .32s ease both"
    },
    "@keyframes screenIn": {
      from: { opacity: 0 },
      to: { opacity: 1 }
    },
    box: {
      width: "100%",
      maxWidth: 380,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: theme.spacing(1.5),
      padding: theme.spacing(4, 3),
      borderRadius: t.radius.xl,
      backgroundColor: t.surface,
      border: `1px solid ${t.border}`,
      boxShadow: "0 24px 60px -30px rgba(12, 10, 20, 0.5)",
      animation: "$boxIn .4s cubic-bezier(.3, 1.2, .5, 1) both"
    },
    "@keyframes boxIn": {
      from: { opacity: 0, transform: "translateY(16px) scale(.97)" },
      to: { opacity: 1, transform: "none" }
    },
    art: { width: 132, height: 100, color: theme.palette.text.secondary },
    arc1: { animation: "$arcFade 2.2s ease-in-out infinite" },
    arc2: { animation: "$arcFade 2.2s ease-in-out .25s infinite" },
    arc3: { animation: "$arcFade 2.2s ease-in-out .5s infinite" },
    slash: { animation: "$slashIn .6s ease-out both", animationDelay: ".25s" },
    "@keyframes arcFade": {
      "0%, 100%": { opacity: 0.14 },
      "45%": { opacity: 0.5 }
    },
    "@keyframes slashIn": {
      from: { strokeDasharray: 96, strokeDashoffset: 96 },
      to: { strokeDasharray: 96, strokeDashoffset: 0 }
    },
    title: {
      fontSize: "1.25rem",
      fontWeight: 700,
      letterSpacing: "-0.01em",
      color: theme.palette.text.primary
    },
    text: {
      fontSize: "0.9375rem",
      lineHeight: 1.5,
      color: theme.palette.text.secondary
    },
    retry: {
      marginTop: theme.spacing(1),
      borderRadius: 999,
      textTransform: "none",
      fontWeight: 700,
      padding: "6px 22px",
      backgroundColor: t.brand.main,
      color: t.brand.contrastText,
      "&:hover": { backgroundColor: t.brand.hover }
    },
    // ── voltou ──
    back: {
      position: "fixed",
      top: "calc(var(--safe-top, 0px) + 8px)",
      left: "50%",
      zIndex: theme.zIndex.snackbar + 2,
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      height: 28,
      padding: "0 14px",
      borderRadius: 999,
      fontSize: "0.75rem",
      fontWeight: 700,
      color: t.semantic.success,
      backgroundColor: t.surface,
      border: `1px solid ${t.border}`,
      boxShadow: "0 6px 20px -10px rgba(12, 10, 20, 0.45)",
      pointerEvents: "none",
      animation: "$pillIn .3s cubic-bezier(.3, 1.2, .5, 1) both"
    }
  };
});

const BAR_HEIGHTS = [5, 8, 11];

// pedidos que naturalmente demoram (transcrição, IA, QR Code, exportação):
// não contam como internet lenta
const LONG_BY_NATURE = /transcri|\/ai\/|\/export|\/whatsappsession|\/backup/i;

/**
 * Situação da conexão, da mais grave para a mais leve:
 *   reconnecting → o tempo real caiu e está voltando
 *   server       → o servidor não respondeu (a internet está ok)
 *   slow         → um pedido demorando demais, ou rede 2G
 *   sending      → enviando arquivo
 *   loading      → carregando algo que já passou do normal
 *   back         → tudo certo de novo (aparece por 2 segundos)
 * Pedido cancelado (busca trocada, tela fechada) não conta: antes cada um
 * deles acendia "conexão lenta", e o aviso não saía da tela.
 */
const NetworkStatus = () => {
  const classes = useStyles();
  const socketManager = useContext(SocketContext);
  const n = key => i18n.t(`network.${key}`);

  const [offline, setOffline] = useState(
    typeof navigator !== "undefined" && navigator.onLine === false
  );
  const [status, setStatus] = useState(null);
  const [justBack, setJustBack] = useState(false);
  const live = React.useRef({
    pending: new Map(),
    serverTroubleAt: 0,
    wsIssueSince: 0,
    backUntil: 0,
    lastBad: false
  });

  // sem internet: o navegador avisa, e a volta mostra um "voltamos" rapidinho.
  // Sem rede, as partes do app que carregam sob demanda falham e a tela
  // ficaria em branco — por isso o erro de carregamento também cai aqui.
  useEffect(() => {
    const chunkFailed = reason => {
      const text = String(reason?.message || reason || "");
      return /ChunkLoadError|Loading chunk|dynamically imported module/i.test(
        text
      );
    };
    const onRejection = event => {
      if (chunkFailed(event?.reason) && navigator.onLine === false) {
        setOffline(true);
      }
    };
    const onError = event => {
      if (chunkFailed(event?.error || event?.message)) {
        if (navigator.onLine === false) setOffline(true);
      }
    };
    window.addEventListener("unhandledrejection", onRejection);
    window.addEventListener("error", onError);
    const goOffline = () => setOffline(true);
    const goOnline = () => {
      setOffline(wasOffline => {
        if (wasOffline) {
          setJustBack(true);
          setTimeout(() => setJustBack(false), 2600);
        }
        return false;
      });
    };
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("unhandledrejection", onRejection);
      window.removeEventListener("error", onError);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  // pedidos ao servidor: quanto tempo cada um está levando e como terminou
  useEffect(() => {
    const state = live.current;
    const req = api.interceptors.request.use(config => {
      const upload =
        (typeof FormData !== "undefined" && config.data instanceof FormData) ||
        !!config.onUploadProgress;
      if (!LONG_BY_NATURE.test(config.url || "")) {
        state.pending.set(config, { at: Date.now(), upload });
      }
      return config;
    });
    const res = api.interceptors.response.use(
      response => {
        state.pending.delete(response.config);
        state.serverTroubleAt = 0;
        return response;
      },
      error => {
        if (error?.config) state.pending.delete(error.config);
        const canceled =
          axios.isCancel(error) ||
          error?.code === "ERR_CANCELED" ||
          error?.name === "CanceledError";
        if (!canceled) {
          if (error?.request && !error?.response) {
            if (navigator.onLine === false) setOffline(true);
            else state.serverTroubleAt = Date.now();
          } else if ([502, 503, 504].includes(error?.response?.status)) {
            state.serverTroubleAt = Date.now();
          }
        }
        return Promise.reject(error);
      }
    );
    return () => {
      api.interceptors.request.eject(req);
      api.interceptors.response.eject(res);
    };
  }, []);

  // tempo real: caiu (e está tentando voltar) ou voltou
  useEffect(() => {
    if (!socketManager?.subscribeWsConnectionIssue) return undefined;
    const unsubscribe = socketManager.subscribeWsConnectionIssue(active => {
      const state = live.current;
      if (active) {
        if (!state.wsIssueSince) state.wsIssueSince = Date.now();
      } else {
        state.wsIssueSince = 0;
      }
    });
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [socketManager]);

  // decide o aviso a cada meio segundo (a tela só muda quando ele muda)
  useEffect(() => {
    const tick = setInterval(() => {
      const state = live.current;
      const now = Date.now();
      let requests = [...state.pending.values()];
      // pedido esquecido há mais de um minuto não prende o aviso na tela
      state.pending.forEach((info, config) => {
        if (now - info.at > 60000) state.pending.delete(config);
      });
      requests = requests.filter(info => now - info.at <= 60000);
      const conn = navigator.connection;
      const weak = conn && ["slow-2g", "2g"].includes(conn.effectiveType || "");

      let next = null;
      if (state.wsIssueSince && now - state.wsIssueSince > 4000) {
        next = "reconnecting";
      } else if (state.serverTroubleAt && now - state.serverTroubleAt < 10000) {
        next = "server";
      } else if (weak || requests.some(i => !i.upload && now - i.at > 8000)) {
        next = "slow";
      } else if (requests.some(i => i.upload && now - i.at > 800)) {
        next = "sending";
      } else if (requests.some(i => !i.upload && now - i.at > 2500)) {
        next = "loading";
      }

      const bad = ["reconnecting", "server", "slow"].includes(next);
      if (!next && state.lastBad) state.backUntil = now + 2000;
      state.lastBad = bad;
      if (!next && now < state.backUntil) next = "back";

      setStatus(prev => (prev === next ? prev : next));
    }, 500);
    return () => clearInterval(tick);
  }, []);

  const retry = useCallback(() => {
    if (navigator.onLine === false) return;
    window.location.reload();
  }, []);

  if (offline) {
    return (
      <div className={classes.screen} role="alert">
        <div className={classes.box}>
          <svg className={classes.art} viewBox="0 0 120 92" aria-hidden="true">
            {/* wi-fi com as ondas piscando e um risco por cima */}
            <g fill="none" stroke="currentColor" strokeLinecap="round">
              <path
                className={classes.arc3}
                d="M18 40c23-22 61-22 84 0"
                strokeWidth="7"
                opacity="0.25"
              />
              <path
                className={classes.arc2}
                d="M33 55c15-14 39-14 54 0"
                strokeWidth="7"
                opacity="0.35"
              />
              <path
                className={classes.arc1}
                d="M47 69c7-7 19-7 26 0"
                strokeWidth="7"
                opacity="0.5"
              />
            </g>
            <circle cx="60" cy="81" r="5" fill="currentColor" opacity="0.6" />
            <path
              className={classes.slash}
              d="M24 78L96 24"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              opacity="0.75"
            />
          </svg>
          <div className={classes.title}>{n("offlineTitle")}</div>
          <div className={classes.text}>{n("offlineText")}</div>
          <Button className={classes.retry} onClick={retry} disableElevation>
            {n("retry")}
          </Button>
        </div>
      </div>
    );
  }

  if (justBack) {
    return (
      <div className={classes.back} role="status">
        {n("backOnline")}
      </div>
    );
  }

  if (!status) return null;

  if (status === "back") {
    return (
      <div className={classes.back} role="status">
        {n("reconnected")}
      </div>
    );
  }

  return (
    <div className={classes.pill} role="status">
      {status === "slow" ? (
        <span className={classes.bars}>
          {BAR_HEIGHTS.map((height, index) => (
            <span
              key={height}
              className={classes.bar}
              style={{ height, animationDelay: `${index * 160}ms` }}
            />
          ))}
        </span>
      ) : status === "server" ? (
        <span className={classes.warnDot} />
      ) : (
        <span className={classes.spinner} />
      )}
      {n(status)}
    </div>
  );
};

export default NetworkStatus;
