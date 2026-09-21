import React, { useEffect, useRef, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import ArrowDownwardRoundedIcon from "@material-ui/icons/ArrowDownwardRounded";
import RefreshRoundedIcon from "@material-ui/icons/RefreshRounded";

import { haptic } from "../../helpers/haptics";

/**
 * Puxar para atualizar (celular e app instalado).
 *
 * Com a lista no topo, arrastar para baixo puxa um círculo que acompanha o
 * dedo (com resistência). Passou do ponto: vibra e o círculo fica na cor do
 * tema; soltou: gira e recarrega a tela aberta. Antes do ponto, soltar só
 * volta. Não atua dentro das conversas (lá, puxar no topo carrega as
 * mensagens antigas), de janelas, painéis e campos de texto.
 */
const THRESHOLD = 72;
const MAX = 130;
const MIN_SPIN = 650;

const BLOCKED =
  "[data-no-pull], .MuiDialog-root, .MuiDrawer-modal, .MuiPopover-root, input, textarea, select, [contenteditable='true'], .yarl__root";

const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    wrap: {
      position: "fixed",
      left: 0,
      right: 0,
      top: 0,
      zIndex: theme.zIndex.modal - 20,
      display: "flex",
      justifyContent: "center",
      pointerEvents: "none"
    },
    circle: {
      width: 40,
      height: 40,
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: theme.palette.text.secondary,
      backgroundColor: t.surfaceRaised || t.surface,
      boxShadow: "0 4px 14px rgba(0, 0, 0, 0.25)",
      transition: "color .15s ease, background-color .15s ease",
      "& svg": { fontSize: 24 }
    },
    ready: { color: t.brand.contrastText, backgroundColor: t.brand.main },
    spin: { "& svg": { animation: "$spin .7s linear infinite" } },
    "@keyframes spin": { to: { transform: "rotate(360deg)" } },
    settle: { transition: "transform .25s ease, opacity .25s ease" }
  };
});

const scrollerOf = element => {
  let el = element;
  while (el && el !== document.body) {
    const style = window.getComputedStyle(el);
    if (
      /(auto|scroll)/.test(style.overflowY) &&
      el.scrollHeight > el.clientHeight + 1
    ) {
      return el;
    }
    el = el.parentElement;
  }
  return document.scrollingElement;
};

const PullToRefresh = ({ onRefresh }) => {
  const classes = useStyles();
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const busy = useRef(false);
  const refreshRef = useRef(onRefresh);
  refreshRef.current = onRefresh;

  useEffect(() => {
    // sem o "puxar" do próprio navegador (senão os dois disparam juntos)
    const root = document.documentElement;
    const previous = root.style.overscrollBehaviorY;
    root.style.overscrollBehaviorY = "contain";

    let start = null;
    let pulling = false;
    let distance = 0;
    let armed = false;

    const onStart = event => {
      if (busy.current || event.touches.length !== 1) return;
      if (root.classList.contains("kb-open")) return;
      if (root.dataset.inCall) return;
      const target = event.target;
      if (target.closest?.(BLOCKED)) return;
      const scroller = scrollerOf(target);
      if (scroller && scroller.scrollTop > 0) return;
      const touch = event.touches[0];
      start = { x: touch.clientX, y: touch.clientY, scroller };
      pulling = false;
      distance = 0;
      armed = false;
    };

    const onMove = event => {
      if (!start) return;
      const touch = event.touches[0];
      const dy = touch.clientY - start.y;
      const dx = Math.abs(touch.clientX - start.x);
      if (!pulling) {
        // gesto de lado (voltar, arrastar mensagem) ou para cima: não é nosso
        if (dx > 10 && dx > dy) {
          start = null;
          return;
        }
        if (dy < 0 || (start.scroller && start.scroller.scrollTop > 0)) {
          start = null;
          return;
        }
        if (dy > 8) {
          pulling = true;
          setDragging(true);
        } else {
          return;
        }
      }
      if (event.cancelable) event.preventDefault();
      // resistência: quanto mais puxa, menos anda
      distance = Math.min(MAX, (dy - 8) * 0.5);
      setPull(distance);
      if (!armed && distance >= THRESHOLD) {
        armed = true;
        haptic("refreshReady");
      } else if (armed && distance < THRESHOLD) {
        armed = false;
      }
    };

    const onEnd = async () => {
      if (!start) return;
      start = null;
      if (!pulling) return;
      pulling = false;
      setDragging(false);
      if (distance < THRESHOLD) {
        setPull(0);
        return;
      }
      busy.current = true;
      setRefreshing(true);
      setPull(THRESHOLD);
      const began = Date.now();
      try {
        await refreshRef.current?.();
      } catch (err) {
        // a tela mostra o próprio erro
      }
      const wait = Math.max(0, MIN_SPIN - (Date.now() - began));
      setTimeout(() => {
        haptic("refreshDone");
        setRefreshing(false);
        setPull(0);
        busy.current = false;
      }, wait);
    };

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd);
    document.addEventListener("touchcancel", onEnd);
    return () => {
      root.style.overscrollBehaviorY = previous;
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", onEnd);
    };
  }, []);

  if (!pull && !refreshing) return null;

  const ready = refreshing || pull >= THRESHOLD;
  const progress = Math.min(1, pull / THRESHOLD);
  return (
    <div
      className={`${classes.wrap}${dragging ? "" : ` ${classes.settle}`}`}
      style={{
        transform: `translateY(calc(var(--safe-top, 0px) + ${pull - 44}px))`,
        opacity: Math.min(1, progress * 1.4)
      }}
      aria-hidden="true"
    >
      <div
        className={`${classes.circle}${ready ? ` ${classes.ready}` : ""}${
          refreshing ? ` ${classes.spin}` : ""
        }`}
      >
        {refreshing ? (
          <RefreshRoundedIcon />
        ) : (
          <ArrowDownwardRoundedIcon
            style={{ transform: `rotate(${ready ? 180 : progress * 150}deg)` }}
          />
        )}
      </div>
    </div>
  );
};

export default PullToRefresh;
