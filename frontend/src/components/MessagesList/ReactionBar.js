import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { makeStyles } from "@material-ui/core/styles";
import ButtonBase from "@material-ui/core/ButtonBase";
import Dialog from "@material-ui/core/Dialog";
import AddRoundedIcon from "@material-ui/icons/AddRounded";
import "emoji-mart/css/emoji-mart.css";
import { Picker } from "emoji-mart";
import { emojiMartI18n } from "../../helpers/emojiMartI18n";

/**
 * Barra de reações que "salta" da mensagem.
 *
 * Computador: abre ao clicar no rostinho que aparece ao passar o mouse.
 * Celular: abre ao segurar a mensagem, com as ações mais usadas embaixo
 * (responder, copiar, encaminhar, mais). Cada emoji entra com um pequeno
 * atraso em relação ao anterior, como no WhatsApp.
 */
export const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

const MARGIN = 8;

const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  const surface = t.isDark ? t.surfaceRaised : "#FFFFFF";
  return {
    layer: {
      position: "fixed",
      inset: 0,
      zIndex: theme.zIndex.modal + 1,
      WebkitTapHighlightColor: "transparent"
    },
    // fundo escurece e desfoca de leve, como no WhatsApp
    dim: {
      backgroundColor: "rgba(10, 9, 16, 0.22)",
      backdropFilter: "blur(2px)",
      animation: "$fade .2s ease both"
    },
    bar: {
      position: "fixed",
      display: "flex",
      alignItems: "center",
      gap: 2,
      padding: 4,
      borderRadius: 999,
      backgroundColor: surface,
      boxShadow:
        "0 10px 30px rgba(12, 10, 20, 0.22), 0 1px 3px rgba(12, 10, 20, 0.12)",
      transformOrigin: "var(--origin, 50% 100%)",
      animation: "$barIn .32s cubic-bezier(.34, 1.56, .64, 1) both"
    },
    // barra de reações mais enxuta (estava bem maior que a do WhatsApp)
    emoji: {
      width: 36,
      height: 36,
      borderRadius: "50%",
      fontSize: 23,
      lineHeight: 1,
      fontFamily:
        "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif",
      transition:
        "transform .16s cubic-bezier(.34, 1.56, .64, 1), background-color .15s",
      animation: "$emojiIn .38s cubic-bezier(.34, 1.56, .64, 1) both",
      "&:hover, &.Mui-focusVisible": {
        transform: "translateY(-4px) scale(1.28)",
        backgroundColor: t.surfaceHover
      },
      "&:active": { transform: "scale(0.9)" },
      [theme.breakpoints.down("xs")]: { width: 38, height: 38, fontSize: 25 }
    },
    mine: { backgroundColor: t.brand.textSoft },
    plus: {
      width: 32,
      height: 32,
      marginLeft: 2,
      borderRadius: "50%",
      color: theme.palette.text.secondary,
      backgroundColor: t.surfaceSunken,
      animation: "$emojiIn .38s cubic-bezier(.34, 1.56, .64, 1) both",
      "&:hover": { backgroundColor: t.surfaceHover }
    },
    actions: {
      position: "fixed",
      minWidth: 188,
      padding: "4px 0",
      borderRadius: 12,
      backgroundColor: surface,
      boxShadow: "0 10px 30px rgba(12, 10, 20, 0.22)",
      transformOrigin: "var(--origin, 50% 0%)",
      animation: "$barIn .3s cubic-bezier(.2, .9, .3, 1.2) both",
      animationDelay: "40ms"
    },
    action: {
      width: "100%",
      display: "flex",
      justifyContent: "space-between",
      gap: 16,
      padding: "9px 14px",
      fontSize: "0.9375rem",
      color: theme.palette.text.primary,
      transition: "background-color .15s ease",
      "& + $action": { borderTop: `1px solid ${t.border}` },
      "& svg": { fontSize: 18, color: theme.palette.text.secondary }
    },
    actionDanger: {
      color: t.semantic.danger,
      "& svg": { color: t.semantic.danger }
    },
    "@keyframes fade": { from: { opacity: 0 }, to: { opacity: 1 } },
    "@keyframes barIn": {
      from: { opacity: 0, transform: "scale(.5) translateY(8px)" },
      to: { opacity: 1, transform: "none" }
    },
    "@keyframes emojiIn": {
      from: { opacity: 0, transform: "translateY(10px) scale(.3)" },
      to: { opacity: 1, transform: "none" }
    }
  };
});

const ReactionBar = ({
  open,
  anchor,
  align = "left",
  current,
  actions = [],
  dim = false,
  onPick,
  onClose
}) => {
  const classes = useStyles();
  const barRef = useRef(null);
  const actionsRef = useRef(null);
  const [pos, setPos] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  // posiciona acima da mensagem (ou abaixo, se não houver espaço) sem sair
  // da tela; as ações ficam do outro lado
  useLayoutEffect(() => {
    if (!open || !anchor) {
      setPos(null);
      return;
    }
    // tamanho de layout (offset*): o getBoundingClientRect pegaria a barra
    // ainda encolhida pela animação de entrada e a posição sairia errada
    const bar = barRef.current;
    const list = actionsRef.current;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const barW = bar?.offsetWidth || 300;
    const barH = bar?.offsetHeight || 50;
    const listH = list?.offsetHeight || 0;
    const listW = list?.offsetWidth || 0;

    const clampX = (x, w) => Math.max(MARGIN, Math.min(vw - w - MARGIN, x));
    const barLeft = clampX(
      align === "right" ? anchor.right - barW : anchor.left,
      barW
    );
    const above = anchor.top - barH - MARGIN >= MARGIN + 40;
    const barTop = above
      ? anchor.top - barH - MARGIN
      : Math.min(vh - barH - listH - MARGIN * 3, anchor.bottom + MARGIN);

    let listTop = null;
    if (listH) {
      const below = anchor.bottom + MARGIN;
      listTop =
        below + listH <= vh - MARGIN
          ? below
          : Math.max(MARGIN, (above ? barTop : barTop + barH) - listH - MARGIN);
      if (!above && listTop < barTop + barH + MARGIN) {
        listTop = barTop + barH + MARGIN;
      }
    }
    setPos({
      barLeft,
      barTop: Math.max(MARGIN, barTop),
      listLeft: clampX(
        align === "right" ? anchor.right - listW : anchor.left,
        listW
      ),
      listTop,
      origin: `${Math.round(
        align === "right" ? barW - 24 : 24
      )}px ${above ? "100%" : "0%"}`
    });
  }, [open, anchor, align, actions.length]);

  useEffect(() => {
    if (!open) return undefined;
    // capture + preventDefault: fecha só a barra, não a conversa junto
    const onKey = e => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      onClose();
    };
    const onScroll = () => onClose();
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, onClose]);

  if (!open && !pickerOpen) return null;

  const pick = emoji => {
    if (navigator.vibrate) navigator.vibrate(8);
    onPick(emoji);
    onClose();
  };

  return createPortal(
    <>
      {open && (
        <div
          className={`${classes.layer}${dim ? ` ${classes.dim}` : ""}`}
          onPointerDown={e => {
            if (e.target === e.currentTarget) onClose();
          }}
          onContextMenu={e => e.preventDefault()}
        >
          <div
            ref={barRef}
            className={classes.bar}
            role="toolbar"
            style={{
              left: pos?.barLeft ?? -9999,
              top: pos?.barTop ?? -9999,
              "--origin": pos?.origin
            }}
          >
            {QUICK_REACTIONS.map((emoji, i) => (
              <ButtonBase
                key={emoji}
                className={`${classes.emoji}${current === emoji ? ` ${classes.mine}` : ""}`}
                style={{ animationDelay: `${40 + i * 35}ms` }}
                aria-label={emoji}
                onClick={() => pick(current === emoji ? "" : emoji)}
              >
                {emoji}
              </ButtonBase>
            ))}
            <ButtonBase
              className={classes.plus}
              style={{
                animationDelay: `${40 + QUICK_REACTIONS.length * 35}ms`
              }}
              aria-label="+"
              onClick={() => {
                setPickerOpen(true);
                onClose();
              }}
            >
              <AddRoundedIcon />
            </ButtonBase>
          </div>

          {actions.length > 0 && (
            <div
              ref={actionsRef}
              className={classes.actions}
              style={{
                left: pos?.listLeft ?? -9999,
                top: pos?.listTop ?? -9999
              }}
            >
              {actions.map(item => (
                <ButtonBase
                  key={item.key}
                  className={`${classes.action}${item.danger ? ` ${classes.actionDanger}` : ""}`}
                  onClick={() => {
                    onClose();
                    item.onClick();
                  }}
                >
                  <span>{item.label}</span>
                  {item.icon}
                </ButtonBase>
              ))}
            </div>
          )}
        </div>
      )}
      <Dialog open={pickerOpen} onClose={() => setPickerOpen(false)}>
        <Picker
          i18n={emojiMartI18n()}
          perLine={window.innerWidth < 420 ? 8 : 12}
          showPreview={false}
          showSkinTones={false}
          onSelect={e => {
            setPickerOpen(false);
            onPick(e.native);
          }}
        />
      </Dialog>
    </>,
    document.body
  );
};

export default ReactionBar;
