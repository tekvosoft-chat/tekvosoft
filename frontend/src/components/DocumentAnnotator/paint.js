/**
 * Anotações: formato, desenho em SVG (tela) e em canvas (arquivo final).
 *
 * As coordenadas ficam numa escala própria: a largura da página vale 1000 e
 * a altura acompanha a proporção. Assim um traço tem a mesma espessura
 * relativa numa foto de 4000px e num PDF de 595pt, e o zoom não mexe nos
 * dados.
 */
export const BASE = 1000;

export const TOOLS = [
  "pan",
  "pen",
  "highlight",
  "underline",
  "strike",
  "text",
  "eraser"
];

export const COLORS = [
  "#FFD400",
  "#22C55E",
  "#3B82F6",
  "#EF4444",
  "#A855F7",
  "#111827"
];

export const DEFAULT_COLORS = {
  pen: "#EF4444",
  highlight: "#FFD400",
  underline: "#3B82F6",
  strike: "#EF4444",
  text: "#111827"
};

export const SIZES = { thin: 2.5, medium: 5, thick: 10 };

export const LINE_WIDTH = 3.2;
export const TEXT_SIZE = 24;
export const HIGHLIGHT_OPACITY = 0.38;

// traço suave: curvas entre os pontos médios
export const penPath = points => {
  if (!points.length) return "";
  if (points.length === 1) {
    const [x, y] = points[0];
    return `M${x} ${y} L${x + 0.1} ${y + 0.1}`;
  }
  let d = `M${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length - 1; i += 1) {
    const [x, y] = points[i];
    const [nx, ny] = points[i + 1];
    d += ` Q${x} ${y} ${(x + nx) / 2} ${(y + ny) / 2}`;
  }
  const last = points[points.length - 1];
  d += ` L${last[0]} ${last[1]}`;
  return d;
};

export const normRect = ({ x0, y0, x1, y1 }) => ({
  x: Math.min(x0, x1),
  y: Math.min(y0, y1),
  w: Math.abs(x1 - x0),
  h: Math.abs(y1 - y0)
});

/** Desenha as anotações num contexto 2D. scale = pixels por unidade. */
export const paintAnnotations = (ctx, annotations, scale) => {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  annotations.forEach(a => {
    if (a.type === "pen") {
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = a.color;
      const path = new Path2D(penPath(a.points));
      ctx.save();
      ctx.scale(scale, scale);
      ctx.lineWidth = a.size;
      ctx.stroke(path);
      ctx.restore();
    } else if (a.type === "highlight") {
      const r = normRect(a);
      ctx.globalAlpha = HIGHLIGHT_OPACITY;
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = a.color;
      ctx.fillRect(r.x * scale, r.y * scale, r.w * scale, r.h * scale);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    } else if (a.type === "underline" || a.type === "strike") {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = a.color;
      ctx.lineWidth = LINE_WIDTH * scale;
      ctx.beginPath();
      ctx.moveTo(a.x0 * scale, a.y0 * scale);
      ctx.lineTo(a.x1 * scale, a.y0 * scale);
      ctx.stroke();
    } else if (a.type === "text") {
      ctx.globalAlpha = 1;
      ctx.fillStyle = a.color;
      ctx.font = `600 ${TEXT_SIZE * scale}px ${getComputedStyle(document.body).fontFamily}`;
      ctx.textBaseline = "top";
      String(a.text)
        .split("\n")
        .forEach((line, i) => {
          ctx.fillText(line, a.x * scale, (a.y + i * TEXT_SIZE * 1.25) * scale);
        });
    }
  });
  ctx.restore();
};

export const canvasToBlob = (canvas, type = "image/png", quality) =>
  new Promise(resolve => canvas.toBlob(resolve, type, quality));
