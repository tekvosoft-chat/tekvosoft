import { useEffect, useState } from "react";

/**
 * O que a lista de conversas está mostrando, escolhido no menu lateral
 * (Conversas > Todas, Não atendidas, Resolvidas, Grupos, uma caixa de
 * entrada ou uma fila) ou nos filtros da própria tela.
 *
 * Fica fora da URL de propósito: abrir uma conversa troca a rota para
 * /tickets/<uuid>, e o filtro escolhido não pode se perder nisso. Um
 * estado só, compartilhado por evento, mantém o destaque do menu e a lista
 * sempre combinando. A sessão guarda a escolha para o recarregar da página.
 *
 *   view:  "all" | "pending" | "closed" | "groups"
 *   queue: id da fila ou null
 *   inbox: id da caixa de entrada (conexão) ou null
 */
const EVENT = "tkv:tickets-nav";
const KEY = "tkv:ticketsNav";
export const DEFAULT_NAV = { view: "all", queue: null, inbox: null };

const read = () => {
  try {
    return { ...DEFAULT_NAV, ...JSON.parse(sessionStorage.getItem(KEY)) };
  } catch {
    return { ...DEFAULT_NAV };
  }
};

let current = read();

export const getTicketsNav = () => current;

export const setTicketsNav = next => {
  current = { ...DEFAULT_NAV, ...next };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    // sem armazenamento, só não sobrevive ao recarregar
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: current }));
};

export const sameNav = (a, b) =>
  a.view === b.view &&
  (a.queue || null) === (b.queue || null) &&
  (a.inbox || null) === (b.inbox || null);

export const useTicketsNav = () => {
  const [nav, setNav] = useState(current);
  useEffect(() => {
    const onChange = event => setNav(event.detail);
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);
  return nav;
};
