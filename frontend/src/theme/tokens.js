/**
 * Tekvosoft — tokens do design system.
 *
 * Aqui ficam as decisões visuais cruas: cor, espaço, raio, sombra, tipografia.
 * Nenhum componente importa daqui direto — quem monta o tema do Material-UI é
 * o createAppTheme.js. Assim existe um lugar só para mudar a aparência do
 * produto inteiro.
 *
 * Sobre a cor principal: ela NÃO é fixa. O Tekvosoft é whitelabel e cada
 * instalação escolhe a sua em Configurações > Whitelabel. Por isso o que
 * existe aqui é o roxo da nossa marca como PADRÃO e um conjunto de funções
 * que derivam hover, borda e fundo suave a partir de qualquer cor que venha
 * do banco. Trocar a cor de uma instalação continua funcionando e o sistema
 * segue coerente.
 */

// ─────────────────────────────────────────────────────────────
// Marca
// ─────────────────────────────────────────────────────────────

// Extraído da logo (hue 262°, violeta saturado).
export const BRAND_PURPLE = "#6C24F0";

// No escuro o roxo da logo fica pesado sobre fundo escuro e come o contraste
// do texto em cima dele. Usamos uma versão mais clara do mesmo matiz.
export const BRAND_PURPLE_DARK_MODE = "#A084F7";

// ─────────────────────────────────────────────────────────────
// Utilitários de cor (sem dependência externa de propósito:
// o bundle já é grande e isto é aritmética de 40 linhas)
// ─────────────────────────────────────────────────────────────

const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

export function hexToRgb(hex) {
  if (typeof hex !== "string") return { r: 0, g: 0, b: 0 };
  let h = hex.trim().replace("#", "");
  if (h.length === 3) {
    h = h
      .split("")
      .map(c => c + c)
      .join("");
  }
  if (h.length !== 6 || /[^0-9a-f]/i.test(h)) return { r: 0, g: 0, b: 0 };
  const int = parseInt(h, 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

export function rgbToHex({ r, g, b }) {
  const to = v =>
    Math.round(clamp(v, 0, 255))
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

export function rgbToHsl({ r, g, b }) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return { h: (h * 60) % 360, s, l };
}

export function hslToRgb({ h, s, l }) {
  const hn = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hn / 60) % 2) - 1));
  const m = l - c / 2;
  let rgb;
  if (hn < 60) rgb = [c, x, 0];
  else if (hn < 120) rgb = [x, c, 0];
  else if (hn < 180) rgb = [0, c, x];
  else if (hn < 240) rgb = [0, x, c];
  else if (hn < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  return {
    r: (rgb[0] + m) * 255,
    g: (rgb[1] + m) * 255,
    b: (rgb[2] + m) * 255
  };
}

/** Clareia mantendo o matiz. amount 0..1 */
export function lighten(hex, amount) {
  const hsl = rgbToHsl(hexToRgb(hex));
  return rgbToHex(hslToRgb({ ...hsl, l: clamp(hsl.l + amount) }));
}

/** Escurece mantendo o matiz. amount 0..1 */
export function darken(hex, amount) {
  const hsl = rgbToHsl(hexToRgb(hex));
  return rgbToHex(hslToRgb({ ...hsl, l: clamp(hsl.l - amount) }));
}

/** Cor com transparência — serve para estados sobre qualquer fundo. */
export function alpha(hex, a) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`;
}

/** Luminância relativa (WCAG). */
export function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const ch = v => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

/** Razão de contraste entre duas cores (1 a 21). */
export function contrastRatio(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * Texto legível sobre uma cor de fundo. Escolhe entre branco e um quase-preto
 * pelo contraste real, em vez de chutar pelo brilho — assim funciona também
 * para cores de whitelabel muito claras (amarelo, lima) onde branco sumiria.
 */
/**
 * A cor da marca ajustada para servir de ÍCONE ou TEXTO sobre um fundo.
 * A cor escolhida no tema pode ser escura demais para o modo escuro (ou
 * clara demais para o claro); aqui ela clareia ou escurece, mantendo o
 * matiz, até ter contraste de leitura (4,5:1) com o fundo.
 */
export function readableAccent(color, background, target = 4.5) {
  const towardLight = luminance(background) < 0.4;
  let result = color;
  for (let step = 0; step < 24; step += 1) {
    if (contrastRatio(result, background) >= target) break;
    result = towardLight ? lighten(result, 0.03) : darken(result, 0.03);
  }
  return result;
}

export function readableOn(background) {
  const onWhite = contrastRatio(background, "#FFFFFF");
  const onInk = contrastRatio(background, "#14121C");
  return onWhite >= onInk ? "#FFFFFF" : "#14121C";
}

/**
 * A partir de UMA cor de marca, devolve os estados que o design system usa.
 * É o que mantém tudo coerente mesmo quando a instalação troca o roxo.
 */
export function brandStates(main, isDark) {
  return {
    main,
    hover: isDark ? lighten(main, 0.07) : darken(main, 0.07),
    active: isDark ? lighten(main, 0.13) : darken(main, 0.14),
    contrastText: readableOn(main),
    // fundos suaves: seguem a marca sem virar bloco de cor
    soft: alpha(main, isDark ? 0.18 : 0.1),
    softHover: alpha(main, isDark ? 0.26 : 0.16),
    softActive: alpha(main, isDark ? 0.34 : 0.22),
    border: alpha(main, isDark ? 0.42 : 0.32),
    focusRing: alpha(main, isDark ? 0.45 : 0.28)
  };
}

// ─────────────────────────────────────────────────────────────
// Neutros
// ─────────────────────────────────────────────────────────────
// Os cinzas não são neutros puros: levam uma pitada do matiz da marca.
// É o que faz a interface parecer um produto só, em vez de cinza de sistema
// com detalhes roxos por cima.

export const neutralLight = {
  canvas: "#F6F5FA", // fundo da aplicação
  surface: "#FFFFFF", // cartões, tabelas, modais
  surfaceRaised: "#FFFFFF",
  surfaceSunken: "#F1EFF7", // cabeçalho de tabela, campos, hover sutil
  surfaceHover: "#F4F2FA",
  border: "#E5E2EF",
  borderStrong: "#D2CDE2",
  textPrimary: "#1A1626",
  textSecondary: "#5C5673",
  textTertiary: "#8B85A1",
  textDisabled: "#B4AFC4"
};

export const neutralDark = {
  canvas: "#121019",
  surface: "#1B1826",
  surfaceRaised: "#241F33",
  surfaceSunken: "#16131F",
  surfaceHover: "#272134",
  border: "#322C45",
  borderStrong: "#473F60",
  textPrimary: "#EFECF7",
  textSecondary: "#A8A2BE",
  textTertiary: "#7C7594",
  textDisabled: "#5A5470"
};

/**
 * Leva os neutros para o matiz da cor principal, mantendo saturação e
 * luminosidade.
 *
 * Os cinzas do sistema sempre tiveram uma pitada da cor da marca. Com temas
 * de cor escolhidos pelo cliente, manter essa pitada roxa fixa deixaria um
 * tema verde parecendo "roxo com botão verde". Girando só o matiz, o fundo,
 * as bordas e os textos secundários acompanham a cor escolhida — do jeito
 * que acontece na prévia dos cartões de tema.
 */
export function tintNeutrals(base, brandHex) {
  const hue = rgbToHsl(hexToRgb(brandHex)).h;
  const out = {};
  Object.entries(base).forEach(([key, value]) => {
    const hsl = rgbToHsl(hexToRgb(value));
    // só uma pitada do matiz da marca: antes os cinzas assumiam a cor
    // inteira e o sistema ficava monocromático
    out[key] = rgbToHex(hslToRgb({ ...hsl, h: hue, s: Math.min(hsl.s, 0.06) }));
  });
  return out;
}

/**
 * Paleta de apoio derivada da cor da marca.
 *
 * Serve para os cartões de números, ícones e gráficos não ficarem todos da
 * mesma cor: são matizes vizinhos e complementares da marca, com saturação
 * controlada para continuarem combinando entre si.
 */
export function accentScale(brandHex, isDark) {
  const { h, s } = rgbToHsl(hexToRgb(brandHex));
  const sat = Math.min(0.72, Math.max(0.42, s));
  const light = isDark ? 0.62 : 0.46;
  return [0, 42, 96, 152, 200, 290].map(shift =>
    rgbToHex(hslToRgb({ h: (h + shift) % 360, s: sat, l: light }))
  );
}

// ─────────────────────────────────────────────────────────────
// Temas de cor (Configurações > Aparência)
// ─────────────────────────────────────────────────────────────
// Cada tema define a cor principal no claro e no escuro. No claro ela é
// escura o bastante para texto branco em cima (contraste de pelo menos 4.5);
// no escuro é clara o bastante para aparecer sobre fundo escuro.
// "accent" é só a segunda bolinha da prévia.

export const THEME_PRESETS = [
  {
    id: "tekvosoft",
    light: BRAND_PURPLE,
    dark: BRAND_PURPLE_DARK_MODE,
    accent: "#EC4899"
  },
  { id: "classicBlue", light: "#2563EB", dark: "#7AA2FF", accent: "#F472B6" },
  { id: "forestGreen", light: "#15803D", dark: "#4ADE80", accent: "#F59E0B" },
  { id: "oceanTeal", light: "#0E7490", dark: "#22D3EE", accent: "#F472B6" },
  { id: "sunsetOrange", light: "#C2410C", dark: "#FB923C", accent: "#A855F7" },
  { id: "nightPurple", light: "#7E22CE", dark: "#C084FC", accent: "#22D3EE" },
  { id: "roseRed", light: "#BE185D", dark: "#F472B6", accent: "#F59E0B" },
  { id: "cosmic", light: "#4F46E5", dark: "#818CF8", accent: "#FB7185" }
];

// ─────────────────────────────────────────────────────────────
// Cores semânticas
// ─────────────────────────────────────────────────────────────

export const semanticLight = {
  success: "#12864B",
  successSoft: "#E4F6EC",
  warning: "#B45309",
  warningSoft: "#FDF1E3",
  danger: "#C81E36",
  dangerSoft: "#FCE9EC",
  info: "#1D4ED8",
  infoSoft: "#E8EEFD"
};

export const semanticDark = {
  success: "#43D08A",
  successSoft: "rgba(67, 208, 138, 0.16)",
  warning: "#F7A93B",
  warningSoft: "rgba(247, 169, 59, 0.16)",
  danger: "#FF6B7E",
  dangerSoft: "rgba(255, 107, 126, 0.16)",
  info: "#6E9BFF",
  infoSoft: "rgba(110, 155, 255, 0.16)"
};

// ─────────────────────────────────────────────────────────────
// Conversa do WhatsApp
// ─────────────────────────────────────────────────────────────
// A tela de conversa segue o WhatsApp oficial de propósito: é onde o
// atendente passa o dia, e a pessoa do outro lado está no WhatsApp. Ler as
// mensagens com as mesmas cores, papel de parede e balões do aplicativo tira
// qualquer esforço de tradução visual. O roxo da marca continua no resto do
// sistema — e no chat interno, que é conversa entre a equipe, não com cliente.

export const whatsappLight = {
  wallpaper: "#EFEAE2",
  bubbleOut: "#D9FDD3",
  bubbleIn: "#FFFFFF",
  quoteOut: "#D1F4CC",
  quoteIn: "#F5F6F6",
  text: "#111B21",
  meta: "#667781",
  bar: "#F0F2F5",
  input: "#FFFFFF",
  icon: "#54656F",
  accent: "#00A884",
  accentHover: "#008F72",
  datePill: "#FFFFFF",
  datePillText: "#54656F",
  bubbleShadow: "0 1px 0.5px rgba(11, 20, 26, 0.13)"
};

export const whatsappDark = {
  wallpaper: "#0B141A",
  bubbleOut: "#005C4B",
  bubbleIn: "#202C33",
  quoteOut: "#025144",
  quoteIn: "#1D282F",
  text: "#E9EDEF",
  meta: "rgba(233, 237, 239, 0.6)",
  bar: "#202C33",
  input: "#2A3942",
  icon: "#8696A0",
  accent: "#00A884",
  accentHover: "#06CF9C",
  datePill: "#182229",
  datePillText: "#8696A0",
  bubbleShadow: "0 1px 0.5px rgba(0, 0, 0, 0.35)"
};

// ─────────────────────────────────────────────────────────────
// Forma, espaço, elevação
// ─────────────────────────────────────────────────────────────

export const radius = {
  xs: 6,
  sm: 8,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999
};

// Base 8. O MUI multiplica por isto em theme.spacing(n).
export const SPACING_UNIT = 8;

/**
 * Sombras discretas e tingidas de roxo. O padrão do Material é preto puro e
 * pesado demais para uma interface de trabalho que fica o dia todo aberta.
 */
export function buildShadows(isDark) {
  const c = isDark ? "0, 0, 0" : "26, 22, 38";
  const k = isDark ? 1.9 : 1;
  const s = (y, blur, a1, spread = 0) =>
    `0px ${y}px ${blur}px ${spread}px rgba(${c}, ${(a1 * k).toFixed(3)})`;

  const list = [
    "none",
    `${s(1, 2, 0.05)}, ${s(0, 1, 0.04)}`,
    `${s(2, 4, 0.06)}, ${s(0, 1, 0.04)}`,
    `${s(3, 6, 0.07)}, ${s(0, 1, 0.04)}`,
    `${s(4, 8, 0.07)}, ${s(0, 2, 0.04)}`,
    `${s(6, 12, 0.08)}, ${s(0, 2, 0.04)}`,
    `${s(8, 16, 0.09)}, ${s(0, 2, 0.05)}`,
    `${s(10, 20, 0.1)}, ${s(0, 3, 0.05)}`,
    `${s(12, 24, 0.11)}, ${s(0, 3, 0.05)}`
  ];
  // O MUI exige exatamente 25 posições.
  while (list.length < 25) {
    list.push(list[list.length - 1]);
  }
  return list;
}

// ─────────────────────────────────────────────────────────────
// Tipografia
// ─────────────────────────────────────────────────────────────

export const fontStack = [
  "Inter",
  "-apple-system",
  "BlinkMacSystemFont",
  "Segoe UI",
  "Roboto",
  "Helvetica Neue",
  "Arial",
  "sans-serif"
].join(", ");

export const monoStack = [
  "ui-monospace",
  "SFMono-Regular",
  "SF Mono",
  "Menlo",
  "Consolas",
  "Liberation Mono",
  "monospace"
].join(", ");

// Alturas fixas usadas pelo shell. Ficam aqui porque o conteúdo precisa
// descontá-las e mais de um arquivo faz essa conta.
export const layout = {
  appBarHeight: 56,
  drawerWidth: 264,
  drawerWidthCollapsed: 72,
  bottomNavHeight: 60,
  contentMaxWidth: 1440
};
