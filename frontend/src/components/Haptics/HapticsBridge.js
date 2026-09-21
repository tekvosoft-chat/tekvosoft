import { useEffect } from "react";
import { toast } from "react-toastify";

import { haptic, isTouchDevice } from "../../helpers/haptics";

/**
 * Liga a vibração no app inteiro, sem mexer em cada botão:
 *  - toque em botão, aba, chave ou link → toque leve;
 *  - abriu janela, painel lateral ou menu → vibração de "abrir";
 *  - aviso de sucesso / atenção / erro → o padrão de cada um.
 * Só em aparelho de toque (no computador não faz nada).
 */
const TAPPABLE =
  'button, a[href], [role="button"], [role="tab"], [role="switch"], [role="menuitem"], [role="option"], .MuiButtonBase-root, input[type="checkbox"], input[type="radio"]';

const OVERLAY = /(^|\s)(MuiDialog-root|MuiDrawer-modal|MuiPopover-root)(\s|$)/;

const HapticsBridge = () => {
  useEffect(() => {
    if (!isTouchDevice()) return undefined;

    const onTap = event => {
      if (event.pointerType !== "touch") return;
      const target = event.target.closest?.(TAPPABLE);
      if (
        !target ||
        target.disabled ||
        target.getAttribute("aria-disabled") === "true"
      )
        return;
      const role = target.getAttribute("role");
      haptic(
        role === "tab" || role === "switch" || role === "option"
          ? "selection"
          : "tap"
      );
    };
    document.addEventListener("pointerup", onTap, true);

    // janelas, painéis e menus do Material-UI entram no fim do <body>
    const observer = new MutationObserver(mutations => {
      const opened = mutations.some(m =>
        Array.from(m.addedNodes).some(
          node => node.nodeType === 1 && OVERLAY.test(node.className || "")
        )
      );
      if (opened) haptic("open");
    });
    observer.observe(document.body, { childList: true });

    const unsubscribe = toast.onChange(payload => {
      if (payload.status !== "added") return;
      if (payload.type === "success") haptic("success");
      else if (payload.type === "error") haptic("error");
      else if (payload.type === "warning") haptic("warning");
    });

    return () => {
      document.removeEventListener("pointerup", onTap, true);
      observer.disconnect();
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  return null;
};

export default HapticsBridge;
