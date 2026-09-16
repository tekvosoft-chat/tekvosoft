import React, { useEffect, useMemo, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";

import { openApi } from "../../services/api";
import { i18n } from "../../translate/i18n";

/**
 * Metade direita do login: colunas de GIFs rolando sem parar sobre a cor da
 * marca, com uma frase de boas-vindas por cima.
 *
 * Os GIFs vêm do GIPHY (a mesma chave de Configurações > Serviços externos).
 * Sem chave ou sem internet, as colunas mostram cartões animados de conversa
 * — a tela nunca fica vazia.
 */
const FALLBACK = [
  { emoji: "💬", text: "Oi! Posso ajudar?" },
  { emoji: "🚀", text: "Atendimento rápido" },
  { emoji: "✅", text: "Pedido confirmado" },
  { emoji: "😍", text: "Amei o atendimento!" },
  { emoji: "📅", text: "Agendado para amanhã" },
  { emoji: "🎉", text: "Venda fechada" },
  { emoji: "🤝", text: "Equipe conectada" },
  { emoji: "⭐", text: "Nota 5 recebida" },
  { emoji: "📦", text: "Saiu para entrega" }
];

const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    root: {
      position: "relative",
      height: "100%",
      overflow: "hidden",
      background: `linear-gradient(160deg, ${t.brand.main} 0%, ${t.brand.hover} 55%, #120A2A 100%)`
    },
    columns: {
      position: "absolute",
      inset: "-10% -6%",
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: 16,
      transform: "rotate(-6deg)",
      opacity: 0.95
    },
    column: {
      display: "flex",
      flexDirection: "column",
      gap: 16,
      animation: "$up 60s linear infinite",
      willChange: "transform",
      "@media (prefers-reduced-motion: reduce)": { animation: "none" }
    },
    down: { animationName: "$down", animationDuration: "70s" },
    slow: { animationDuration: "80s" },
    tile: {
      flex: "none",
      width: "100%",
      borderRadius: 20,
      overflow: "hidden",
      backgroundColor: "rgba(255,255,255,0.08)",
      boxShadow: "0 18px 40px -18px rgba(0,0,0,0.55)",
      "& img": {
        display: "block",
        width: "100%",
        height: "auto",
        minHeight: 120,
        objectFit: "cover"
      }
    },
    fake: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      padding: "26px 14px",
      minHeight: 150,
      color: "#FFFFFF",
      background: "rgba(255,255,255,0.12)",
      backdropFilter: "blur(4px)",
      textAlign: "center",
      fontWeight: 700,
      fontSize: "0.9375rem",
      "& span": {
        fontSize: 44,
        animation: "$bounce 2.4s ease-in-out infinite"
      }
    },
    shade: {
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(180deg, rgba(10,6,24,0.15) 0%, rgba(10,6,24,0) 35%, rgba(10,6,24,0.75) 100%)",
      pointerEvents: "none"
    },
    caption: {
      position: "absolute",
      left: 40,
      right: 40,
      bottom: 48,
      color: "#FFFFFF",
      animation: "$fade .8s ease both .3s"
    },
    title: {
      fontSize: "2.25rem",
      fontWeight: 800,
      lineHeight: 1.1,
      letterSpacing: "-0.03em",
      textShadow: "0 4px 24px rgba(0,0,0,0.35)"
    },
    text: { marginTop: 12, fontSize: "1.0625rem", opacity: 0.9, maxWidth: 460 },
    credit: {
      position: "absolute",
      right: 14,
      top: 14,
      fontSize: "0.6875rem",
      color: "rgba(255,255,255,0.7)"
    },
    "@keyframes up": {
      from: { transform: "translateY(0)" },
      to: { transform: "translateY(-50%)" }
    },
    "@keyframes down": {
      from: { transform: "translateY(-50%)" },
      to: { transform: "translateY(0)" }
    },
    "@keyframes bounce": {
      "0%, 100%": { transform: "translateY(0) scale(1)" },
      "50%": { transform: "translateY(-8px) scale(1.08)" }
    },
    "@keyframes fade": {
      from: { opacity: 0, transform: "translateY(12px)" },
      to: { opacity: 1, transform: "none" }
    }
  };
});

const GifShowcase = () => {
  const classes = useStyles();
  const [gifs, setGifs] = useState([]);

  useEffect(() => {
    let alive = true;
    openApi
      .get("/login-gifs")
      .then(({ data }) => alive && setGifs(data?.gifs || []))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // três colunas; cada uma repete a própria lista para o laço não ter emenda
  const columns = useMemo(() => {
    const source = gifs.length >= 6 ? gifs : null;
    return [0, 1, 2].map(col => {
      const items = source
        ? source.filter((_, i) => i % 3 === col)
        : FALLBACK.filter((_, i) => i % 3 === col);
      return [...items, ...items];
    });
  }, [gifs]);

  const usingGifs = gifs.length >= 6;

  return (
    <div className={classes.root} aria-hidden="true">
      <div className={classes.columns}>
        {columns.map((items, col) => (
          <div
            key={col}
            className={`${classes.column}${col === 1 ? ` ${classes.down}` : ""}${col === 2 ? ` ${classes.slow}` : ""}`}
          >
            {items.map((item, i) =>
              usingGifs ? (
                <div key={`${item.id}-${i}`} className={classes.tile}>
                  <img src={item.url} alt="" loading="lazy" />
                </div>
              ) : (
                <div
                  key={`${item.text}-${i}`}
                  className={`${classes.tile} ${classes.fake}`}
                >
                  <span style={{ animationDelay: `${(i % 5) * 0.35}s` }}>
                    {item.emoji}
                  </span>
                  {item.text}
                </div>
              )
            )}
          </div>
        ))}
      </div>
      <div className={classes.shade} />
      {usingGifs && <div className={classes.credit}>Powered by GIPHY</div>}
      <div className={classes.caption}>
        <div className={classes.title}>{i18n.t("loginShowcase.title")}</div>
        <div className={classes.text}>{i18n.t("loginShowcase.text")}</div>
      </div>
    </div>
  );
};

export default GifShowcase;
