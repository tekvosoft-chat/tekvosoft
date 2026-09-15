/**
 * O balão "voa" da barra de envio até a conversa.
 *
 * É só um fantasma visual: um balão com o texto enviado sai da posição do
 * campo e pousa no fim da lista, onde a mensagem de verdade aparece logo em
 * seguida. Nada muda no envio em si. Quem prefere menos movimento no sistema
 * operacional não vê a animação.
 */
export const SEND_FLIGHT_EVENT = "tkv:send-flight";

export const announceSend = (text, inputEl) => {
  if (!text || !inputEl?.getBoundingClientRect) return;
  const rect = inputEl.getBoundingClientRect();
  window.dispatchEvent(
    new CustomEvent(SEND_FLIGHT_EVENT, {
      detail: {
        text,
        rect: {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height
        }
      }
    })
  );
};

export const flyBubble = ({ text, from, list, background, color, shadow }) => {
  if (!list || !from || !document.body.animate) return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  const box = list.getBoundingClientRect();
  const ghost = document.createElement("div");
  ghost.textContent = text.length > 280 ? `${text.slice(0, 280)}…` : text;
  Object.assign(ghost.style, {
    position: "fixed",
    left: "0px",
    top: "0px",
    zIndex: "1400",
    maxWidth: `${Math.min(box.width * 0.8, 520)}px`,
    padding: "7px 10px",
    borderRadius: "10px 10px 2px 10px",
    background,
    color,
    boxShadow: shadow || "0 1px 0.5px rgba(11, 20, 26, 0.13)",
    font: "400 0.9375rem/1.35 inherit",
    fontFamily: getComputedStyle(document.body).fontFamily,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    display: "-webkit-box",
    WebkitLineClamp: "4",
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    pointerEvents: "none",
    willChange: "transform, opacity"
  });
  document.body.appendChild(ghost);

  const width = ghost.offsetWidth;
  const height = ghost.offsetHeight;
  const startX = from.left + 8;
  const startY = from.top + from.height / 2 - height / 2;
  const endX = box.right - width - 20;
  const endY = Math.min(box.bottom, window.innerHeight) - height - 16;

  const animation = ghost.animate(
    [
      {
        transform: `translate(${startX}px, ${startY}px) scale(0.85)`,
        opacity: 0.4
      },
      {
        transform: `translate(${(startX + endX) / 2}px, ${endY - 18}px) scale(1.02)`,
        opacity: 1,
        offset: 0.6
      },
      { transform: `translate(${endX}px, ${endY}px) scale(1)`, opacity: 1 }
    ],
    { duration: 420, easing: "cubic-bezier(.2, .8, .2, 1)", fill: "forwards" }
  );
  animation.onfinish = () => {
    const fade = ghost.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 160,
      delay: 120,
      fill: "forwards"
    });
    fade.onfinish = () => ghost.remove();
  };
  // garantia: nunca deixa o fantasma para trás
  setTimeout(() => ghost.remove(), 1500);
};
