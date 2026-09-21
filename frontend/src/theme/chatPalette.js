/**
 * Cores e fundo da conversa a partir do tema da empresa.
 *
 * Antes a conversa copiava o WhatsApp (verde e bege) qualquer que fosse o
 * tema. Agora ela segue a paleta escolhida em Configurações > Aparência:
 * o balão das minhas mensagens é um tom claro (ou profundo, no escuro) da
 * cor principal, o botão de enviar é a própria cor, e o papel de parede é
 * desenhado com essas cores.
 *
 * Os fundos são desenhados aqui mesmo, em SVG, e não baixados de um banco de
 * imagens: uma foto de paisagem nunca combina com todas as cores (nem com a
 * cor personalizada), pesa centenas de KB e fica cortada de jeitos diferentes
 * no celular e no computador. O desenho vetorial se ajusta a qualquer tela,
 * pesa poucos KB e usa exatamente as cores do tema.
 */
import { contrastRatio, darken, hexToRgb, lighten, rgbToHex } from "./tokens";
import doodleLight from "../assets/wa-background.png";
import doodleDark from "../assets/wa-background-dark.png";

export const WALLPAPERS = ["landscape", "waves", "gradient", "doodle", "plain"];
export const DEFAULT_WALLPAPER = "doodle";

/**
 * Cores sólidas oferecidas como fundo (além das imagens e GIFs de
 * /backgrounds). Valor salvo: "color:#RRGGBB" ou "bg:<id da imagem>".
 */
export const SOLID_COLORS = [
  "#EFEAE2",
  "#DCEBF7",
  "#E3F2E1",
  "#F6E7F0",
  "#FFF4D6",
  "#1F2933",
  "#0B141A",
  "#111827",
  "#2B2141",
  "#123B36"
];

/** Mistura duas cores. weight é quanto de `b` entra (0..1). */
export const mix = (a, b, weight) => {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  return rgbToHex({
    r: x.r + (y.r - x.r) * weight,
    g: x.g + (y.g - x.g) * weight,
    b: x.b + (y.b - x.b) * weight
  });
};

const svgUrl = svg =>
  `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    svg.replace(/\s{2,}/g, " ")
  )}")`;

// garante leitura do texto no balão, mesmo com cor personalizada extrema
const keepReadable = (bg, text, target) => {
  let color = bg;
  const lightText =
    contrastRatio(text, "#000000") > contrastRatio(text, "#FFFFFF");
  for (let i = 0; i < 30 && contrastRatio(color, text) < target; i += 1) {
    color = lightText ? darken(color, 0.02) : lighten(color, 0.02);
  }
  return color;
};

// montanhas em camadas, com sol (claro) ou lua e estrelas (escuro)
const landscapeSvg = ({ brand, accent, isDark }) => {
  const ink = "#0A0910";
  const paper = "#FFFFFF";
  const tone = w => (isDark ? mix(brand, ink, w) : mix(brand, paper, w));
  const skyTop = isDark ? mix(brand, ink, 0.86) : mix(brand, paper, 0.9);
  const skyBottom = isDark ? mix(accent, ink, 0.74) : mix(accent, paper, 0.8);
  const orb = isDark ? mix(accent, paper, 0.7) : mix(accent, paper, 0.45);
  const stars = isDark
    ? Array.from({ length: 46 }, (_, i) => {
        const x = (i * 331) % 1440;
        const y = (i * 197) % 430;
        const r = 0.8 + ((i * 7) % 5) * 0.35;
        const o = 0.25 + ((i * 13) % 6) * 0.1;
        return `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="${o}"/>`;
      }).join("")
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMax slice">
    <defs>
      <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${skyTop}"/>
        <stop offset="1" stop-color="${skyBottom}"/>
      </linearGradient>
      <radialGradient id="g" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="${orb}" stop-opacity="0.55"/>
        <stop offset="1" stop-color="${orb}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1440" height="900" fill="url(#s)"/>
    ${stars}
    <circle cx="1040" cy="300" r="190" fill="url(#g)"/>
    <circle cx="1040" cy="300" r="${isDark ? 54 : 78}" fill="${orb}" opacity="${isDark ? 0.9 : 0.75}"/>
    ${isDark ? `<circle cx="1062" cy="288" r="50" fill="${skyTop}" opacity="0.9"/>` : ""}
    <path d="M0 560 L140 470 L260 520 L420 390 L560 500 L700 430 L860 520 L1010 410 L1160 500 L1300 440 L1440 500 L1440 900 L0 900Z" fill="${tone(isDark ? 0.8 : 0.78)}"/>
    <path d="M0 640 C160 580 280 600 420 560 C600 510 700 600 880 580 C1060 560 1180 520 1440 590 L1440 900 L0 900Z" fill="${tone(isDark ? 0.72 : 0.66)}"/>
    <path d="M0 730 C200 680 360 700 560 670 C760 640 940 720 1120 700 C1260 685 1360 660 1440 670 L1440 900 L0 900Z" fill="${tone(isDark ? 0.64 : 0.55)}"/>
    <path d="M0 820 C240 780 480 800 720 780 C960 760 1200 800 1440 770 L1440 900 L0 900Z" fill="${tone(isDark ? 0.56 : 0.45)}"/>
  </svg>`;
};

// ondas que sobem do rodapé, sobre um céu em degradê
const wavesSvg = ({ brand, accent, isDark }) => {
  const ink = "#0A0910";
  const paper = "#FFFFFF";
  const base = isDark ? mix(brand, ink, 0.88) : mix(brand, paper, 0.92);
  const top = isDark ? mix(accent, ink, 0.84) : mix(accent, paper, 0.88);
  const w = (c, amount) =>
    isDark ? mix(c, ink, amount) : mix(c, paper, amount);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMax slice">
    <defs>
      <linearGradient id="b" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${top}"/>
        <stop offset="1" stop-color="${base}"/>
      </linearGradient>
    </defs>
    <rect width="1440" height="900" fill="url(#b)"/>
    <path d="M0 520 C240 440 480 600 720 520 C960 440 1200 600 1440 520 L1440 900 L0 900Z" fill="${w(accent, isDark ? 0.8 : 0.8)}" opacity="0.8"/>
    <path d="M0 610 C260 540 520 690 780 610 C1040 530 1240 660 1440 600 L1440 900 L0 900Z" fill="${w(brand, isDark ? 0.74 : 0.72)}" opacity="0.85"/>
    <path d="M0 710 C220 650 500 780 760 710 C1020 640 1240 760 1440 700 L1440 900 L0 900Z" fill="${w(brand, isDark ? 0.66 : 0.6)}" opacity="0.9"/>
    <path d="M0 810 C300 760 540 850 820 800 C1100 750 1260 830 1440 800 L1440 900 L0 900Z" fill="${w(brand, isDark ? 0.58 : 0.5)}"/>
  </svg>`;
};

export function buildChatPalette({ brand, accent, isDark, wallpaper, base }) {
  const custom =
    typeof wallpaper === "string" &&
    (wallpaper.startsWith("bg:") || wallpaper.startsWith("color:"));
  const style = custom
    ? wallpaper
    : WALLPAPERS.includes(wallpaper)
      ? wallpaper
      : DEFAULT_WALLPAPER;
  const secondary = accent || brand;
  const ink = "#0A0A0A";
  const text = base.text;

  // No escuro, só o balão das minhas mensagens leva a cor do tema; fundo,
  // barras, campo de digitar e balão recebido ficam em preto e cinza puros.
  const bubbleOut = keepReadable(
    isDark ? mix(brand, "#121212", 0.6) : mix(brand, "#FFFFFF", 0.82),
    text,
    isDark ? 7 : 9
  );
  const quoteOut = isDark
    ? mix(bubbleOut, ink, 0.22)
    : mix(bubbleOut, brand, 0.08);
  let wallpaperColor = isDark ? "#0B0B0B" : mix(brand, "#F4F2EE", 0.9);

  let wallpaperImage = "none";
  let wallpaperSize = "cover";
  let wallpaperBlend = "normal";
  if (style.startsWith("bg:")) {
    // imagem ou GIF escolhido: um véu leve deixa os balões legíveis
    const id = style.slice(3).replace(/[^a-z0-9-]/gi, "");
    const veil = isDark ? "rgba(8, 8, 8, 0.28)" : "rgba(255, 255, 255, 0.12)";
    wallpaperImage = `linear-gradient(${veil}, ${veil}), url(/backgrounds/${id}.webp)`;
    wallpaperColor = isDark ? "#0B0B0B" : "#E9E4DC";
  } else if (style.startsWith("color:")) {
    const hex = style.slice(6);
    if (/^#[0-9a-f]{6}$/i.test(hex)) wallpaperColor = hex;
  } else if (style === "landscape") {
    wallpaperImage = svgUrl(landscapeSvg({ brand, accent: secondary, isDark }));
  } else if (style === "waves") {
    wallpaperImage = svgUrl(wavesSvg({ brand, accent: secondary, isDark }));
  } else if (style === "gradient") {
    const a = isDark ? mix(brand, ink, 0.62) : mix(brand, "#FFFFFF", 0.7);
    const b = isDark
      ? mix(secondary, ink, 0.66)
      : mix(secondary, "#FFFFFF", 0.72);
    const c = isDark ? mix(brand, ink, 0.8) : mix(brand, "#FFFFFF", 0.86);
    wallpaperImage = [
      `radial-gradient(at 12% 18%, ${a} 0, transparent 52%)`,
      `radial-gradient(at 88% 12%, ${b} 0, transparent 48%)`,
      `radial-gradient(at 70% 92%, ${a} 0, transparent 50%)`,
      `radial-gradient(at 20% 88%, ${b} 0, transparent 46%)`,
      `linear-gradient(160deg, ${c}, ${wallpaperColor})`
    ].join(", ");
  } else if (style === "doodle") {
    // os rabiscos do WhatsApp, pintados na cor do tema
    wallpaperImage = `url(${isDark ? doodleDark : doodleLight})`;
    wallpaperSize = "auto";
    wallpaperBlend = "luminosity";
  }

  return {
    ...base,
    wallpaper: wallpaperColor,
    wallpaperStyle: style,
    wallpaperImage,
    wallpaperSize,
    wallpaperBlend,
    bubbleOut,
    quoteOut,
    bubbleIn: isDark ? "#1F1F1F" : "#FFFFFF",
    quoteIn: isDark ? "#171717" : mix(brand, "#F5F5F7", 0.94),
    bar: isDark ? "#1A1A1A" : mix(brand, "#F2F1F5", 0.94),
    input: isDark ? "#262626" : "#FFFFFF",
    datePill: isDark ? "#1A1A1A" : "#FFFFFF",
    // sombra macia e um brilho leve no balão enviado: dá volume sem pesar
    bubbleShadow: isDark
      ? "0 1px 2px rgba(0, 0, 0, 0.45)"
      : "0 1px 1px rgba(20, 16, 40, 0.06), 0 2px 8px rgba(20, 16, 40, 0.07)",
    bubbleOutSheen: isDark
      ? "linear-gradient(160deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0) 55%)"
      : "linear-gradient(160deg, rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0) 55%)",
    accent: brand,
    accentHover: isDark ? lighten(brand, 0.07) : darken(brand, 0.07)
  };
}
