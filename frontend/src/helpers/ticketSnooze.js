import { i18n } from "../translate/i18n";

/**
 * Conversa adiada (Ticket.snoozedUntil). "Até o cliente responder" o servidor
 * grava no ano 9999: o relógio nunca chega lá, só a próxima mensagem dele.
 */
export const isSnoozed = ticket =>
  !!ticket?.snoozedUntil &&
  new Date(ticket.snoozedUntil).getTime() > Date.now();

export const isSnoozedUntilReply = ticket =>
  !!ticket?.snoozedUntil &&
  new Date(ticket.snoozedUntil).getUTCFullYear() >= 9999;

const dayAt = (base, days, hours) =>
  new Date(base.getFullYear(), base.getMonth(), base.getDate() + days, hours);

// opções prontas do "Adiar", com a hora já calculada
export const snoozePresets = (now = new Date()) => {
  // segunda-feira que vem (hoje sendo segunda, a da outra semana)
  const toMonday = (8 - now.getDay()) % 7 || 7;
  return [
    { key: "reply", until: "reply" },
    { key: "hour", until: new Date(now.getTime() + 60 * 60 * 1000) },
    { key: "tomorrow", until: dayAt(now, 1, 9) },
    { key: "nextWeek", until: dayAt(now, toMonday, 9) }
  ];
};

const locale = () => {
  const lang = String(i18n.language || "pt");
  return { pt: "pt-BR", pt_PT: "pt-PT" }[lang] || lang.replace("_", "-");
};

// "ter., 29/09, 09:00" no idioma do sistema
export const formatSnooze = date =>
  new Intl.DateTimeFormat(locale(), {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(date));

// valor para <input type="datetime-local"> (hora local, sem fuso)
export const toLocalInput = date => {
  const d = new Date(date);
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};
