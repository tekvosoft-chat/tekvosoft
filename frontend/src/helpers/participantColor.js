// Cor do nome de cada participante do grupo, como no WhatsApp: tons suaves
// e sempre a mesma cor para a mesma pessoa. No escuro, tons claros; no
// claro, a versão mais fechada do mesmo tom (para ler bem no balão branco).
const DARK = [
  "#53BDEB",
  "#06CF9C",
  "#FC9775",
  "#FFD279",
  "#A5B337",
  "#FF72A1",
  "#E26AB6",
  "#8B9FF5",
  "#25D366",
  "#FFBC38",
  "#DFA0FF",
  "#79D8C9",
  "#F15C6D",
  "#7FB5FF"
];
const LIGHT = [
  "#027EB5",
  "#008069",
  "#C4532D",
  "#B88600",
  "#667A00",
  "#D42A66",
  "#AD2F81",
  "#5E47DE",
  "#1FA855",
  "#C75300",
  "#9747FF",
  "#008A86",
  "#D62C3C",
  "#3B6DD6"
];

export const participantColor = (key, isDark) => {
  const text = String(key || "");
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  const palette = isDark ? DARK : LIGHT;
  return palette[hash % palette.length];
};
