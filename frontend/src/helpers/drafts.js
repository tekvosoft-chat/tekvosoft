import { useEffect, useState } from "react";

/**
 * Rascunhos da barra de envio: o texto digitado e não enviado fica guardado
 * por conversa (e por usuário, para ninguém ver o rascunho de outra pessoa
 * no mesmo aparelho) e volta quando a conversa é reaberta — mesmo depois de
 * fechar o app. Some ao enviar, ao apagar o texto ou depois de 30 dias.
 */
const PREFIX = "tkv:draft:";
const EVENT = "tkv:draft";
const MAX_AGE = 30 * 24 * 60 * 60 * 1000;

const keyOf = (scope, id) =>
  `${PREFIX}${localStorage.getItem("userId") || "0"}:${scope}:${id}`;

export const getDraft = (scope, id) => {
  if (!id) return "";
  try {
    const raw = localStorage.getItem(keyOf(scope, id));
    if (!raw) return "";
    const { text, at } = JSON.parse(raw);
    if (!text || Date.now() - at > MAX_AGE) {
      localStorage.removeItem(keyOf(scope, id));
      return "";
    }
    return text;
  } catch (err) {
    return "";
  }
};

export const saveDraft = (scope, id, text) => {
  if (!id) return;
  try {
    const key = keyOf(scope, id);
    const value = String(text || "");
    if (value.trim()) {
      localStorage.setItem(
        key,
        JSON.stringify({ text: value, at: Date.now() })
      );
    } else if (localStorage.getItem(key) !== null) {
      localStorage.removeItem(key);
    } else {
      return;
    }
  } catch (err) {
    return; // armazenamento cheio ou bloqueado: segue sem rascunho
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { scope, id } }));
};

export const clearDraft = (scope, id) => saveDraft(scope, id, "");

/** Rascunho de uma conversa, atualizado quando muda (lista de conversas). */
export const useDraft = (scope, id) => {
  const [draft, setDraft] = useState(() => getDraft(scope, id));
  useEffect(() => {
    setDraft(getDraft(scope, id));
    const onChange = event => {
      const detail = event.detail || {};
      if (detail.scope === scope && String(detail.id) === String(id)) {
        setDraft(getDraft(scope, id));
      }
    };
    // outra aba do mesmo navegador
    const onStorage = event => {
      if (event.key === keyOf(scope, id)) setDraft(getDraft(scope, id));
    };
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, [scope, id]);
  return draft;
};
