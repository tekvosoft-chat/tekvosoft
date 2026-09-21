import { useEffect, useState } from "react";

/**
 * Vibração (feedback tátil) no celular e no app instalado (PWA).
 *
 * Android: usa a vibração do aparelho (Vibration API), com um padrão para
 * cada situação. iPhone: o Safari não tem essa API; a partir do iOS 17.4 o
 * "switch" nativo dá um toque tátil ao ser acionado, e é isso que usamos
 * (um toque por pulso do padrão). No computador não faz nada.
 *
 * Ligada por padrão; cada pessoa desliga no próprio aparelho.
 */
const KEY = "tkv:haptics";
const EVENT = "tkv:haptics";

export const PATTERNS = {
  tap: 8, // toque em botão
  selection: 5, // trocar aba, marcar opção
  open: [6, 28, 10], // abriu janela, painel ou menu
  send: [6, 40, 14], // mensagem enviada
  success: [12, 70, 20],
  warning: [22, 90, 22],
  error: [35, 60, 35, 60, 45],
  notify: [18, 110, 18], // mensagem nova chegou
  longPress: 16, // segurou (reações)
  swipe: 10, // arrastou para responder
  refreshReady: 12, // puxou o suficiente para atualizar
  refreshDone: [8, 50, 8] // terminou de atualizar
};

export const isHapticsOn = () => {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch (err) {
    return true;
  }
};

export const setHapticsOn = on => {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch (err) {
    // sem armazenamento: vale só até recarregar
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: !!on }));
  if (on) haptic("success");
};

export const useHaptics = () => {
  const [on, setOn] = useState(isHapticsOn);
  useEffect(() => {
    const onChange = event => setOn(event.detail);
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);
  return [on, setHapticsOn];
};

const canVibrate =
  typeof navigator !== "undefined" && typeof navigator.vibrate === "function";

const isIOS =
  typeof navigator !== "undefined" &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

export const isTouchDevice = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(pointer: coarse)")?.matches;

// iOS 17.4+: acionar um <input type="checkbox" switch> dá um toque tátil
const iosTick = () => {
  try {
    const label = document.createElement("label");
    label.setAttribute("aria-hidden", "true");
    label.style.display = "none";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.setAttribute("switch", "");
    label.appendChild(input);
    document.body.appendChild(label);
    label.click();
    document.body.removeChild(label);
  } catch (err) {
    // sem suporte: segue sem vibrar
  }
};

let last = 0;

/** Vibra com o padrão da situação (nome em PATTERNS ou milissegundos). */
export const haptic = (kind = "tap") => {
  if (!isHapticsOn() || document.hidden) return;
  const pattern = typeof kind === "string" ? PATTERNS[kind] : kind;
  if (pattern === undefined) return;

  // toques em sequência muito rápida viram um só
  const now = Date.now();
  if (now - last < 35) return;
  last = now;

  if (canVibrate) {
    try {
      navigator.vibrate(pattern);
    } catch (err) {
      // o navegador bloqueou (sem interação ainda)
    }
    return;
  }
  if (!isIOS) return;
  // iPhone: um toque por pulso (posições pares do padrão), no tempo dele
  const steps = Array.isArray(pattern) ? pattern : [pattern];
  let delay = 0;
  steps.forEach((ms, i) => {
    if (i % 2 === 0) setTimeout(iosTick, delay);
    delay += ms;
  });
};
