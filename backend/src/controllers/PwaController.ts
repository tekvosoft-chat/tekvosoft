import { Request, Response } from "express";
import { Jimp } from "jimp";
import GetPublicSettingService from "../services/SettingServices/GetPublicSettingService";
import { PWA_SYMBOL_BASE64 } from "../assets/pwaSymbol";

// cor do tema da empresa (sem "#"), só hexadecimal de 6 dígitos
const parseHex = (value: unknown): string | null => {
  const hex = String(value || "")
    .replace(/^#/, "")
    .toLowerCase();
  return /^[0-9a-f]{6}$/.test(hex) ? hex : null;
};

const iconUrl = (bg: string, size: number, shape: string) =>
  `${process.env.BACKEND_URL || ""}/pwa-icon.png?bg=${bg}&size=${size}&shape=${shape}`;

export const manifest = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const appName = await GetPublicSettingService({ key: "appName" });
  const logoFavicon = await GetPublicSettingService({ key: "appLogoFavicon" });
  // ícone personalizado (whitelabel) tem prioridade sobre a cor do tema
  const bg = logoFavicon ? null : parseHex(req.query.bg);

  const mimes = {
    svg: "image/svg+xml",
    png: "image/png",
    ico: "image/x-icon"
  };

  let mimeFavicon = "image/png";

  if (logoFavicon) {
    const extension = logoFavicon.split(".").pop();
    mimeFavicon = mimes[extension] || "image/x-icon";
  }

  const data = {
    short_name: appName || "vuup.me",
    name: appName || "vuup.me - Atendimento via WhatsApp",
    icons: bg
      ? [
          // app instalado na cor do tema da empresa (quem está logado)
          { src: iconUrl(bg, 192, "any"), sizes: "192x192", type: "image/png" },
          { src: iconUrl(bg, 512, "any"), sizes: "512x512", type: "image/png" },
          {
            src: iconUrl(bg, 512, "full"),
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ]
      : [
          {
            src: logoFavicon
              ? `/backend/public/${logoFavicon}`
              : "/vector/favicon.png",
            sizes: "512x512 192x192 64x64 32x32 24x24 16x16",
            type: mimeFavicon
          }
        ],
    start_url: ".",
    display: "standalone",
    orientation: "any",
    theme_color: "#000000",
    background_color: "#ffffff"
  };

  return res.status(200).json(data);
};

export const favicon = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const logoFavicon = await GetPublicSettingService({ key: "appLogoFavicon" });
  res.redirect(302, `${process.env.BACKEND_URL}/public/${logoFavicon}`);
  return res;
};

/**
 * Ícone do app com o fundo na cor do tema da empresa (o balão fica branco).
 *
 * shape: "full" = quadrado cheio (iPhone e ícone adaptável do Android, que
 * recortam sozinhos); "any" = quadrado arredondado; "tab" = arredondado e
 * com o balão maior, para a aba do navegador ficar do tamanho das outras.
 */
const ICON_SIZES = [32, 48, 64, 96, 128, 180, 192, 256, 512];
const SHAPES: Record<string, { scale: number; radius: number }> = {
  full: { scale: 0.62, radius: 0 },
  any: { scale: 0.7, radius: 0.23 },
  tab: { scale: 0.9, radius: 0.2 }
};
const iconCache = new Map<string, Buffer>();
let symbolImage: Awaited<ReturnType<typeof Jimp.read>> | null = null;

export const icon = async (req: Request, res: Response): Promise<Response> => {
  const bg = parseHex(req.query.bg) || "0a0a0b";
  const wanted = Number(req.query.size) || 192;
  const size = ICON_SIZES.reduce((best, s) =>
    Math.abs(s - wanted) < Math.abs(best - wanted) ? s : best
  );
  const shapeName = SHAPES[String(req.query.shape)]
    ? String(req.query.shape)
    : "any";
  const key = `${bg}:${size}:${shapeName}`;

  let png = iconCache.get(key);
  if (!png) {
    const { scale, radius } = SHAPES[shapeName];
    if (!symbolImage) {
      symbolImage = await Jimp.read(Buffer.from(PWA_SYMBOL_BASE64, "base64"));
    }
    const image = new Jimp({
      width: size,
      height: size,
      color: (parseInt(`${bg}ff`, 16) >>> 0) as number
    });

    // cantos arredondados com borda suave
    if (radius > 0) {
      const r = size * radius;
      const { data } = image.bitmap;
      for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
          const cx = x < r ? r : x > size - 1 - r ? size - 1 - r : x;
          const cy = y < r ? r : y > size - 1 - r ? size - 1 - r : y;
          const dist = Math.hypot(x - cx, y - cy);
          if (dist > r - 1) {
            const alpha = Math.max(0, Math.min(1, r - dist));
            data[(y * size + x) * 4 + 3] = Math.round(alpha * 255);
          }
        }
      }
    }

    const s = Math.round(size * scale);
    const symbol = symbolImage.clone().resize({ w: s, h: s });
    // o topete fica em cima: desce um pouco para parecer centrado
    image.composite(
      symbol,
      Math.round((size - s) / 2),
      Math.round((size - s) / 2 + size * 0.015)
    );
    png = await image.getBuffer("image/png");
    if (iconCache.size > 300) iconCache.clear();
    iconCache.set(key, png);
  }

  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "public, max-age=86400");
  return res.send(png);
};
