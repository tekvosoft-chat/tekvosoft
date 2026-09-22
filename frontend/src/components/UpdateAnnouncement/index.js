import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import IconButton from "@material-ui/core/IconButton";
import Button from "@material-ui/core/Button";
import CloseRoundedIcon from "@material-ui/icons/CloseRounded";

import api from "../../services/api";

const SEEN_KEY = "tkv:lastSeenVersion";
const CHECK_EVERY = 5 * 60 * 1000;

const fetchVersion = () =>
  fetch(`/gitinfo.json?t=${Date.now()}`, { cache: "no-store" })
    .then(r => r.json())
    .then(data => (data?.commitHash !== "custom" && data?.commitHash) || null)
    .catch(() => null);

/**
 * Pega a versão nova de verdade: apaga o cache do navegador (Cache Storage),
 * pede ao service worker do PWA para se atualizar e recarrega a página sem
 * reaproveitar nada guardado.
 */
export const applyUpdate = async () => {
  try {
    if (window.caches?.keys) {
      const keys = await window.caches.keys();
      await Promise.all(keys.map(key => window.caches.delete(key)));
    }
    const registrations =
      (await navigator.serviceWorker?.getRegistrations?.()) || [];
    await Promise.all(registrations.map(reg => reg.update().catch(() => {})));
  } catch (e) {
    // sem cache ou service worker: só recarrega
  }
  const url = new URL(window.location.href);
  url.searchParams.set("v", Date.now().toString(36));
  window.location.replace(url.toString());
};

const TITLES = [
  "Tem novidade fresquinha no ar! 🎉",
  "Atualizamos o sistema pra você ✨",
  "O vuup.me acabou de ficar melhor 🚀",
  "Saiu do forno uma atualização 🍞",
  "Trabalhamos enquanto você descansava 😎"
];

// "feat(chat): melhora a busca" → "Melhora a busca"
const humanize = message =>
  String(message || "")
    .replace(/^\w+(\([^)]*\))?!?:\s*/, "")
    .replace(/^./, c => c.toUpperCase())
    .trim();

const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    card: {
      position: "fixed",
      right: 20,
      bottom: 20,
      zIndex: theme.zIndex.snackbar,
      width: 300,
      borderRadius: 20,
      overflow: "hidden",
      color: theme.palette.text.primary,
      backgroundColor: t.surface,
      border: `1px solid ${t.border}`,
      boxShadow: "0 24px 60px -16px rgba(12, 10, 20, 0.45)",
      animation: "$pop .45s cubic-bezier(.3, 1.5, .5, 1) both",
      [theme.breakpoints.down("xs")]: {
        left: 12,
        right: 12,
        width: "auto",
        bottom: "calc(var(--mobile-nav-space, 0px) + 12px)"
      }
    },
    "@keyframes pop": {
      from: { opacity: 0, transform: "translateY(24px) scale(.92)" },
      to: { opacity: 1, transform: "none" }
    },
    // o GIF aparece inteiro (sem corte): altura segue a proporção dele, com
    // limite; se sobrar espaço dos lados, o fundo é o próprio GIF desfocado
    gif: {
      position: "relative",
      minHeight: 120,
      maxHeight: 240,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      fontSize: 64,
      backgroundColor: t.surfaceSunken
    },
    gifBlur: {
      position: "absolute",
      inset: -20,
      width: "calc(100% + 40px)",
      height: "calc(100% + 40px)",
      objectFit: "cover",
      filter: "blur(18px) brightness(0.8)",
      transform: "scale(1.1)"
    },
    gifImg: {
      position: "relative",
      display: "block",
      width: "100%",
      height: "auto",
      maxHeight: 240,
      objectFit: "contain"
    },
    close: {
      position: "absolute",
      top: 8,
      right: 8,
      color: "#fff",
      backgroundColor: "rgba(0,0,0,0.35)",
      "&:hover": { backgroundColor: "rgba(0,0,0,0.5)" }
    },
    body: { padding: theme.spacing(1.75, 2, 2) },
    title: { fontSize: 15.5, fontWeight: 700, letterSpacing: "-0.01em" },
    text: {
      marginTop: 6,
      fontSize: 12.5,
      lineHeight: 1.4,
      color: theme.palette.text.secondary,
      display: "-webkit-box",
      WebkitLineClamp: 3,
      WebkitBoxOrient: "vertical",
      overflow: "hidden"
    },
    ok: {
      marginTop: theme.spacing(1.5),
      width: "100%",
      borderRadius: 999,
      textTransform: "none",
      fontWeight: 700
    }
  };
});

/**
 * Aviso de "sistema atualizado": aparece uma vez quando entra uma versão
 * nova (o deploy grava o commit em /gitinfo.json). Na primeira visita de
 * alguém não aparece — só quando algo mudou desde a última vez.
 */
const UpdateAnnouncement = () => {
  const classes = useStyles();
  const [info, setInfo] = useState(null);
  const [gif, setGif] = useState(null);
  // versão nova publicada enquanto o app está aberto (principalmente o PWA,
  // que fica dias sem recarregar): avisa e oferece atualizar na hora
  const [pending, setPending] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    let boot = null;
    let stop = false;
    const check = async () => {
      const version = await fetchVersion();
      if (stop || !version) return;
      if (!boot) boot = version;
      else if (version !== boot) setPending(true);
    };
    check();
    const timer = setInterval(check, CHECK_EVERY);
    const onVisible = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", check);
    return () => {
      stop = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", check);
    };
  }, []);
  const [title] = useState(
    () => TITLES[Math.floor(Math.random() * TITLES.length)]
  );

  useEffect(() => {
    let alive = true;
    fetch(`/gitinfo.json?t=${Date.now()}`, { cache: "no-store" })
      .then(r => r.json())
      .then(data => {
        const version = data?.commitHash;
        if (!alive || !version || version === "custom") return;
        let seen = null;
        try {
          seen = localStorage.getItem(SEEN_KEY);
          if (!seen) localStorage.setItem(SEEN_KEY, version);
        } catch (e) {
          return;
        }
        if (!seen || seen === version) return;
        setInfo(data);
        api
          .get("/subscription/gifs", { params: { kind: "update" } })
          .then(({ data: gifs }) => {
            if (alive && Array.isArray(gifs) && gifs.length) {
              setGif(gifs[Math.floor(Math.random() * gifs.length)]);
            }
          })
          .catch(() => {});
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (pending) {
    return (
      <div className={classes.card} role="alertdialog" aria-label="Atualização">
        <div className={classes.gif}>🚀</div>
        <div className={classes.body}>
          <div className={classes.title}>Tem versão nova do sistema!</div>
          <div className={classes.text}>
            Toque em atualizar para limpar o cache e carregar a versão mais
            recente. Leva só um segundo e nada do que você fez se perde.
          </div>
          <Button
            variant="contained"
            color="primary"
            className={classes.ok}
            disabled={updating}
            onClick={() => {
              setUpdating(true);
              applyUpdate();
            }}
          >
            {updating ? "Atualizando…" : "Atualizar agora"}
          </Button>
        </div>
      </div>
    );
  }

  if (!info) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(SEEN_KEY, info.commitHash);
    } catch (e) {
      // sem armazenamento: aparece de novo na próxima visita
    }
    setInfo(null);
  };

  const detail = humanize(info.commitMessage);

  return (
    <div className={classes.card} role="dialog" aria-label="Atualização">
      <div className={classes.gif}>
        {gif ? (
          <>
            <img
              src={gif.url}
              alt=""
              aria-hidden="true"
              className={classes.gifBlur}
            />
            <img src={gif.url} alt="" className={classes.gifImg} />
          </>
        ) : (
          "🎉"
        )}
      </div>
      <IconButton
        size="small"
        className={classes.close}
        onClick={dismiss}
        aria-label="Fechar"
      >
        <CloseRoundedIcon fontSize="small" />
      </IconButton>
      <div className={classes.body}>
        <div className={classes.title}>{title}</div>
        <div className={classes.text}>
          {detail
            ? `O que mudou: ${detail}`
            : "Estamos sempre melhorando o sistema para o seu atendimento ficar mais rápido e fácil."}
        </div>
        <Button
          variant="contained"
          color="primary"
          className={classes.ok}
          onClick={dismiss}
        >
          Oba, valeu! 🙌
        </Button>
      </div>
    </div>
  );
};

export default UpdateAnnouncement;
