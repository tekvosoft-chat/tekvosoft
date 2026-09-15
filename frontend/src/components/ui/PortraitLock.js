import React, { useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import ScreenRotationRoundedIcon from "@material-ui/icons/ScreenRotationRounded";

import { i18n } from "../../translate/i18n";

/**
 * O celular fica sempre em pé.
 *
 * Onde o sistema deixa (app instalado no Android), a tela é travada na
 * vertical. Onde não deixa (Safari, iPhone), deitar o aparelho cobre o app
 * com um aviso para girar de volta — o layout do celular não foi feito para
 * a horizontal. Tablets e computadores não são afetados: o aviso só aparece
 * em tela de toque com pouca altura.
 */
const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    root: {
      display: "none",
      "@media (orientation: landscape) and (max-height: 520px) and (pointer: coarse)":
        {
          display: "flex"
        },
      position: "fixed",
      inset: 0,
      zIndex: 20000,
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
      padding: 24,
      textAlign: "center",
      color: t.brand.contrastText,
      background: `linear-gradient(135deg, ${t.brand.main}, ${t.brand.hover})`
    },
    icon: {
      width: 72,
      height: 72,
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255, 255, 255, 0.16)",
      animation: "$turn 1.8s ease-in-out infinite",
      "& svg": { fontSize: 40 }
    },
    title: { fontSize: "1.125rem", fontWeight: 700 },
    text: { fontSize: "0.875rem", opacity: 0.85, maxWidth: 320 },
    "@keyframes turn": {
      "0%, 20%": { transform: "rotate(0deg)" },
      "60%, 100%": { transform: "rotate(-90deg)" }
    }
  };
});

const PortraitLock = () => {
  const classes = useStyles();

  useEffect(() => {
    const lock = () => {
      try {
        const standalone = window.matchMedia(
          "(display-mode: standalone)"
        ).matches;
        if (standalone && window.screen?.orientation?.lock) {
          window.screen.orientation.lock("portrait").catch(() => {});
        }
      } catch (err) {
        // navegador sem suporte: o aviso cobre o caso
      }
    };
    lock();
    document.addEventListener("visibilitychange", lock);
    return () => document.removeEventListener("visibilitychange", lock);
  }, []);

  return (
    <div className={classes.root} role="alert" aria-live="polite">
      <span className={classes.icon}>
        <ScreenRotationRoundedIcon />
      </span>
      <span className={classes.title}>{i18n.t("orientation.title")}</span>
      <span className={classes.text}>{i18n.t("orientation.text")}</span>
    </div>
  );
};

export default PortraitLock;
