import moment from "moment";

/**
 * Base da Agenda (no desenho do Google Agenda, que um dia vai sincronizar
 * com ela): tipos de item, cores, feriados e contas de data.
 *
 * Tudo vira um "item" com o mesmo formato, venha de onde vier:
 *   { key, kind, title, start, end, allDay, color, ...extra }
 * kind: event | call | reminder (tabela CalendarEvents), message (mensagem
 * agendada, tabela Schedules) e holiday (feriado, calculado aqui).
 */
export const LAYERS = [
  { id: "message", label: "Mensagens agendadas", color: "#039BE5" },
  { id: "call", label: "Ligações do chat", color: "#8E24AA" },
  { id: "event", label: "Eventos", color: "#3F51B5" },
  { id: "reminder", label: "Lembretes", color: "#F4511E" }
];
export const HOLIDAY_LAYER = {
  id: "holiday",
  label: "Feriados no Brasil",
  color: "#0B8043"
};
export const ALL_LAYERS = [...LAYERS, HOLIDAY_LAYER];
export const layerColor = id =>
  (ALL_LAYERS.find(layer => layer.id === id) || LAYERS[2]).color;

// paleta do Google Agenda para o evento escolher a própria cor
export const EVENT_COLORS = [
  "#D50000",
  "#E67C73",
  "#F4511E",
  "#F6BF26",
  "#33B679",
  "#0B8043",
  "#039BE5",
  "#3F51B5",
  "#7986CB",
  "#8E24AA",
  "#616161"
];

export const REMINDER_OPTIONS = [
  { value: "", label: "Sem lembrete" },
  { value: 0, label: "Na hora" },
  { value: 5, label: "5 minutos antes" },
  { value: 10, label: "10 minutos antes" },
  { value: 15, label: "15 minutos antes" },
  { value: 30, label: "30 minutos antes" },
  { value: 60, label: "1 hora antes" },
  { value: 120, label: "2 horas antes" },
  { value: 1440, label: "1 dia antes" }
];

export const TYPE_LABEL = {
  event: "Evento",
  call: "Ligação no chat",
  reminder: "Lembrete",
  message: "Mensagem agendada",
  holiday: "Feriado"
};

export const upperFirst = text => text.charAt(0).toUpperCase() + text.slice(1);
export const dayKey = date => moment(date).format("YYYY-MM-DD");

// ── feriados nacionais (e os pontos facultativos mais conhecidos) ──
const easter = year => {
  // algoritmo de Meeus/Jones/Butcher
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return moment({ year, month: month - 1, day });
};

const holidayCache = {};
export const brazilHolidays = year => {
  if (holidayCache[year]) return holidayCache[year];
  const fixed = [
    ["01-01", "Confraternização Universal"],
    ["04-21", "Tiradentes"],
    ["05-01", "Dia do Trabalho"],
    ["09-07", "Independência do Brasil"],
    ["10-12", "Nossa Senhora Aparecida"],
    ["11-02", "Finados"],
    ["11-15", "Proclamação da República"],
    ["11-20", "Dia da Consciência Negra"],
    ["12-25", "Natal"]
  ].map(([md, title]) => [moment(`${year}-${md}`, "YYYY-MM-DD"), title]);
  const e = easter(year);
  const moving = [
    [e.clone().subtract(48, "days"), "Carnaval"],
    [e.clone().subtract(47, "days"), "Carnaval"],
    [e.clone().subtract(2, "days"), "Sexta-feira Santa"],
    [e.clone(), "Páscoa"],
    [e.clone().add(60, "days"), "Corpus Christi"]
  ];
  holidayCache[year] = [...fixed, ...moving].map(([date, title]) => ({
    key: `h-${date.format("YYYY-MM-DD")}-${title}`,
    kind: "holiday",
    title,
    start: date.clone().startOf("day"),
    end: date.clone().endOf("day"),
    allDay: true,
    color: HOLIDAY_LAYER.color
  }));
  return holidayCache[year];
};

// ── transformações para o formato único ──
export const fromEvent = event => ({
  key: `e-${event.id}`,
  kind: event.type || "event",
  title: event.title,
  start: moment(event.startAt),
  end: moment(event.endAt),
  allDay: !!event.allDay,
  color: event.color || layerColor(event.type || "event"),
  raw: event
});

const MESSAGE_STATUS = {
  PENDENTE: "pending",
  AGENDADA: "pending",
  ENVIADA: "sent",
  ERRO: "error"
};
export const messageStatus = status =>
  MESSAGE_STATUS[String(status || "").toUpperCase()] || "pending";

export const fromSchedule = schedule => ({
  key: `s-${schedule.id}`,
  kind: "message",
  title: schedule.contact?.name || "Mensagem agendada",
  start: moment(schedule.sendAt),
  end: moment(schedule.sendAt).add(30, "minutes"),
  allDay: false,
  color:
    messageStatus(schedule.status) === "error"
      ? "#D50000"
      : layerColor("message"),
  status: messageStatus(schedule.status),
  raw: schedule
});

// item de dia inteiro ou que atravessa dias aparece como faixa cheia
export const isBar = item => item.allDay || !item.start.isSame(item.end, "day");

export const timeLabel = date => moment(date).format("HH:mm");

export const rangeLabel = item => {
  if (item.allDay) {
    return item.start.isSame(item.end, "day")
      ? "Dia inteiro"
      : `${item.start.format("D [de] MMM")} – ${item.end.format("D [de] MMM")}`;
  }
  if (item.kind === "message" || item.kind === "reminder") {
    return timeLabel(item.start);
  }
  return `${timeLabel(item.start)} – ${timeLabel(item.end)}`;
};

/**
 * Itens de horário lado a lado quando se sobrepõem (visão semana/dia):
 * devolve cada item com a coluna e o total de colunas do seu grupo.
 */
export const layoutDay = items => {
  const sorted = [...items].sort(
    (a, b) => a.start - b.start || b.end - b.start - (a.end - a.start)
  );
  const placed = [];
  let group = [];
  let groupEnd = null;
  const flush = () => {
    const columns = [];
    group.forEach(item => {
      let col = columns.findIndex(end => end <= item.start);
      if (col === -1) {
        col = columns.length;
        columns.push(item.end);
      } else {
        columns[col] = item.end;
      }
      placed.push({ item, col });
    });
    const total = columns.length;
    placed.slice(placed.length - group.length).forEach(p => {
      p.total = total;
    });
    group = [];
    groupEnd = null;
  };
  sorted.forEach(item => {
    // item muito curto ocupa pelo menos 30 minutos na tela
    const end = moment.max(item.end, item.start.clone().add(30, "minutes"));
    const shaped = { ...item, end };
    if (groupEnd && shaped.start >= groupEnd) flush();
    group.push(shaped);
    groupEnd = groupEnd ? moment.max(groupEnd, end) : end;
  });
  if (group.length) flush();
  return placed;
};

export const WEEKDAYS_SHORT = [
  "SEG.",
  "TER.",
  "QUA.",
  "QUI.",
  "SEX.",
  "SÁB.",
  "DOM."
];
