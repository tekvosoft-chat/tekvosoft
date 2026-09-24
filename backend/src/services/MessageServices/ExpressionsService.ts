import fs from "fs";
import { buffer as juntarStream } from "stream/consumers";
import path from "path";
import { Op } from "sequelize";

import AppError from "../../errors/AppError";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import { GetCompanySetting } from "../../helpers/CheckSettings";
import { getPublicPath } from "../../helpers/GetPublicPath";
import saveMediaToFile from "../../helpers/saveMediaFile";
import { convertMedia } from "../../helpers/mediaConversion";
import { sendWhatsappFile } from "../WbotServices/SendWhatsAppMedia";
import { logger } from "../../utils/logger";

/**
 * NOTA SOBRE O ENVIO: figurinha e GIF vão para o WhatsApp como caminho de
 * arquivo (`{ url: ... }`), nunca como Buffer. O Baileys roda numa thread
 * separada e o Buffer chega do outro lado como Uint8Array comum — lá dentro
 * `Buffer.isBuffer()` dá falso, ele tenta ler `item.url` e o envio morre com
 * "Cannot read properties of undefined (reading 'toString')". O arquivo já
 * está salvo em disco antes disso, então basta passar o caminho.
 */
import { cacheLayer } from "../../libs/cache";

/**
 * Figurinhas e GIFs no chat, como no WhatsApp.
 *
 * Figurinhas: as que já passaram pelas conversas da empresa (recebidas ou
 * enviadas), sem repetir a mesma figurinha. Enviar reaproveita o arquivo
 * que já está salvo e manda como figurinha de verdade, não como imagem.
 *
 * GIFs: busca no GIPHY com a chave configurada em Configurações. A chave
 * fica no servidor; o GIF é baixado do GIPHY e enviado como vídeo em loop,
 * que é como o WhatsApp representa GIFs.
 */

const findSticker = (node: unknown, depth = 0): Record<string, unknown> => {
  if (!node || typeof node !== "object" || depth > 5) return null;
  const obj = node as Record<string, unknown>;
  if (obj.stickerMessage && typeof obj.stickerMessage === "object") {
    return obj.stickerMessage as Record<string, unknown>;
  }
  return Object.values(obj).reduce<Record<string, unknown>>(
    (found, value) => found || findSticker(value, depth + 1),
    null
  );
};

export const listStickers = async (
  companyId: number
): Promise<{ id: string; mediaUrl: string }[]> => {
  const rows = await Message.findAll({
    where: {
      companyId,
      isDeleted: false,
      mediaType: "image",
      mediaUrl: { [Op.iLike]: "%.webp" }
    },
    attributes: ["id", "mediaUrl", "dataJson"],
    order: [["createdAt", "DESC"]],
    limit: 400
  });

  const seen = new Set<string>();
  const stickers: { id: string; mediaUrl: string }[] = [];

  rows.forEach(row => {
    if (stickers.length >= 80) return;
    let sticker: Record<string, unknown> = null;
    try {
      sticker = findSticker(JSON.parse(row.dataJson || "null"));
    } catch (error) {
      sticker = null;
    }
    if (!sticker) return;
    const hash = sticker.fileSha256 ? JSON.stringify(sticker.fileSha256) : "";
    const key = hash || row.getDataValue("mediaUrl");
    if (seen.has(key)) return;
    seen.add(key);
    stickers.push({ id: row.id, mediaUrl: row.mediaUrl });
  });

  return stickers;
};

export const sendSticker = async (
  ticket: Ticket,
  messageId: string,
  companyId: number,
  quotedMsg?: Message
): Promise<void> => {
  const message = await Message.findOne({
    where: { id: messageId, companyId }
  });
  if (!message || !message.getDataValue("mediaUrl")) {
    throw new AppError("ERR_STICKER_NOT_FOUND", 404);
  }

  const raw: string = message.getDataValue("mediaUrl");
  const isRemote = /^https?:\/\//.test(raw);
  const localPath = path.join(getPublicPath(), raw);

  if (!isRemote && !fs.existsSync(localPath)) {
    throw new AppError("ERR_STICKER_NOT_FOUND", 404);
  }

  await sendWhatsappFile(
    ticket,
    { mediaUrl: raw, mimetype: "image/webp", filename: "sticker.webp" },
    {
      sticker: isRemote ? { url: raw } : { url: localPath }
    },
    quotedMsg
  );
};

const giphyKey = async (companyId: number): Promise<string> => {
  const own = await GetCompanySetting(companyId, "giphyApiKey", "");
  if (own) return own;
  return GetCompanySetting(1, "giphyApiKey", "");
};

type GiphyImage = { url?: string; mp4?: string; webp?: string };
type GiphyGif = {
  id: string;
  title?: string;
  images?: Record<string, GiphyImage>;
};

export const searchGifs = async (
  companyId: number,
  query: string,
  offset = 0
): Promise<{
  configured: boolean;
  gifs: { id: string; preview: string; title: string }[];
}> => {
  const key = await giphyKey(companyId);
  if (!key) return { configured: false, gifs: [] };

  const params = new URLSearchParams({
    api_key: key,
    limit: "24",
    offset: String(Math.max(0, offset)),
    rating: "pg-13",
    lang: "pt"
  });
  const endpoint = query
    ? `https://api.giphy.com/v1/gifs/search?${params}&q=${encodeURIComponent(query)}`
    : `https://api.giphy.com/v1/gifs/trending?${params}`;

  const response = await fetch(endpoint);
  if (!response.ok) {
    logger.warn({ status: response.status }, "GIPHY: busca falhou");
    throw new AppError("ERR_GIPHY_UNAVAILABLE", 502);
  }
  const body = (await response.json()) as { data?: GiphyGif[] };

  return {
    configured: true,
    gifs: (body.data || [])
      .map(gif => ({
        id: gif.id,
        title: gif.title || "",
        preview:
          gif.images?.fixed_width_small?.webp ||
          gif.images?.fixed_width_small?.url ||
          gif.images?.fixed_width?.url ||
          ""
      }))
      .filter(gif => gif.preview)
  };
};

export const sendGif = async (
  ticket: Ticket,
  gifId: string,
  companyId: number,
  quotedMsg?: Message
): Promise<void> => {
  if (!/^[A-Za-z0-9]+$/.test(String(gifId || ""))) {
    throw new AppError("ERR_INVALID_GIF", 400);
  }
  const key = await giphyKey(companyId);
  if (!key) throw new AppError("ERR_GIPHY_NOT_CONFIGURED", 400);

  const info = await fetch(
    `https://api.giphy.com/v1/gifs/${gifId}?api_key=${encodeURIComponent(key)}`
  );
  if (!info.ok) throw new AppError("ERR_GIPHY_UNAVAILABLE", 502);
  const { data } = (await info.json()) as { data?: GiphyGif };

  const mp4 =
    data?.images?.original_mp4?.mp4 ||
    data?.images?.original?.mp4 ||
    data?.images?.fixed_height?.mp4;
  // só baixa do próprio GIPHY
  if (!mp4 || !/^https:\/\/[a-z0-9.-]*giphy\.com\//i.test(mp4)) {
    throw new AppError("ERR_INVALID_GIF", 400);
  }

  const download = await fetch(mp4);
  if (!download.ok) throw new AppError("ERR_GIPHY_UNAVAILABLE", 502);
  const buffer = Buffer.from(await download.arrayBuffer());
  if (buffer.length > 15 * 1024 * 1024) {
    throw new AppError("ERR_FILESIZE_OVER_LIMIT", 400);
  }

  const filename = `gif-${gifId}.mp4`;
  const mediaUrl = await saveMediaToFile(
    { data: buffer, mimetype: "video/mp4", filename },
    { destination: ticket }
  );

  await sendWhatsappFile(
    ticket,
    { mediaUrl, mimetype: "video/mp4", filename },
    {
      video: { url: path.join(getPublicPath(), mediaUrl) },
      gifPlayback: true,
      mimetype: "video/mp4"
    },
    quotedMsg
  );
};

/**
 * KLIPY (klipy.com): o mesmo acervo de GIFs e figurinhas que o Discord usa.
 *
 * A chave é gratuita e fica em Configurações > Serviços externos
 * ("klipyApiKey"). Quando ela existe, é a fonte preferida de GIFs; sem ela,
 * o sistema continua usando o GIPHY.
 *
 * Formato das rotas: https://api.klipy.com/api/v1/<chave>/<tipo>/<ação>
 *   tipo  = gifs | stickers        ação = trending | search | items
 */
const KLIPY_BASE = "https://api.klipy.com/api/v1";

type KlipyFile = { url?: string; width?: number; height?: number };
type KlipySizes = Record<string, Record<string, KlipyFile>>;
type KlipyItem = {
  slug?: string;
  title?: string;
  type?: string;
  file?: KlipySizes;
};

const klipyKey = async (companyId: number): Promise<string> => {
  const own = await GetCompanySetting(companyId, "klipyApiKey", "");
  if (own) return own;
  return GetCompanySetting(1, "klipyApiKey", "");
};

const pickKlipyFile = (
  item: KlipyItem,
  sizes: string[],
  formats: string[]
): string | null => {
  for (const size of sizes) {
    const group = item.file?.[size];
    if (!group) continue;
    for (const format of formats) {
      const url = group[format]?.url;
      if (url) return url;
    }
  }
  return null;
};

const klipyList = async (
  companyId: number,
  kind: "gifs" | "stickers",
  query: string,
  page = 1
): Promise<{
  configured: boolean;
  items: { id: string; preview: string; title: string; provider: string }[];
}> => {
  const key = await klipyKey(companyId);
  if (!key) return { configured: false, items: [] };

  const params = new URLSearchParams({
    customer_id: `company-${companyId}`,
    page: String(Math.max(1, page)),
    per_page: "24",
    content_filter: "medium",
    locale: "br"
  });
  if (query) params.set("q", query);

  const url = `${KLIPY_BASE}/${encodeURIComponent(key)}/${kind}/${
    query ? "search" : "trending"
  }?${params}`;

  const response = await fetch(url);
  if (!response.ok) {
    logger.warn({ status: response.status }, "KLIPY: busca falhou");
    throw new AppError("ERR_KLIPY_UNAVAILABLE", 502);
  }
  const body = (await response.json()) as {
    data?: { data?: KlipyItem[] };
  };

  const items = (body.data?.data || [])
    .filter(item => item?.slug && item?.file)
    .map(item => ({
      id: `klipy:${kind}:${item.slug}`,
      title: item.title || "",
      provider: "klipy",
      preview:
        pickKlipyFile(item, ["sm", "xs", "md"], ["webp", "gif", "png"]) || ""
    }))
    .filter(item => item.preview);

  return { configured: true, items };
};

/** Baixa o arquivo de um item do KLIPY pelo identificador do nosso sistema. */
const klipyItemFile = async (
  companyId: number,
  id: string,
  formats: string[]
): Promise<{ url: string; kind: "gifs" | "stickers" }> => {
  const [, kind, slug] = id.split(":");
  if (!["gifs", "stickers"].includes(kind) || !slug) {
    throw new AppError("ERR_INVALID_GIF", 400);
  }
  const key = await klipyKey(companyId);
  if (!key) throw new AppError("ERR_KLIPY_NOT_CONFIGURED", 400);

  const response = await fetch(
    `${KLIPY_BASE}/${encodeURIComponent(key)}/${kind}/items?slugs=${encodeURIComponent(slug)}`
  );
  if (!response.ok) throw new AppError("ERR_KLIPY_UNAVAILABLE", 502);
  const body = (await response.json()) as { data?: { data?: KlipyItem[] } };
  const item = (body.data?.data || [])[0];
  const url = item && pickKlipyFile(item, ["md", "hd", "sm"], formats);
  if (!url || !/^https:\/\//.test(url)) {
    throw new AppError("ERR_INVALID_GIF", 400);
  }
  return { url, kind: kind as "gifs" | "stickers" };
};

const downloadMedia = async (url: string): Promise<Buffer> => {
  const download = await fetch(url);
  if (!download.ok) throw new AppError("ERR_KLIPY_UNAVAILABLE", 502);
  const buffer = Buffer.from(await download.arrayBuffer());
  if (buffer.length > 15 * 1024 * 1024) {
    throw new AppError("ERR_FILESIZE_OVER_LIMIT", 400);
  }
  return buffer;
};

/**
 * GIFs escolhidos do KLIPY para momentos do sistema (aviso de pagamento
 * vencido e agradecimento). Busca os arquivos pela API uma vez por dia.
 */
const FUN_GIFS: Record<string, string[]> = {
  paywall: [
    "pay-me-money",
    "sauron-pay-up-1",
    "dog-puppy-65",
    "ok-okay-369",
    "sad-monkey-14"
  ],
  thanks: [
    "iceage-possum",
    "smiling-smiling-cat-4",
    "keanu-reeves-voll-gerne-2"
  ],
  // aviso de "sistema atualizado"
  update: [
    "happy-tears-tears-of-joy-1",
    "monkey-birthday-1",
    "excited-im-so-excited-22",
    "gifs-engracados-1",
    "cat-kitty-699",
    "happy-dance-gif-4"
  ]
};

export const funGifs = async (
  kind: string
): Promise<{ id: string; url: string }[]> => {
  const slugs = FUN_GIFS[kind];
  if (!slugs) return [];

  const cacheKey = `fun:gifs:${kind}`;
  const cached = await cacheLayer.get(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (error) {
      // busca de novo
    }
  }

  const key = await klipyKey(1);
  if (!key) return [];

  try {
    const response = await fetch(
      `${KLIPY_BASE}/${encodeURIComponent(key)}/gifs/items?slugs=${slugs.join(",")}`
    );
    if (!response.ok) return [];
    const body = (await response.json()) as { data?: { data?: KlipyItem[] } };
    const gifs = (body.data?.data || [])
      .map(item => ({
        id: item.slug || "",
        url:
          pickKlipyFile(item, ["md", "hd", "sm"], ["webp", "gif", "mp4"]) || ""
      }))
      .filter(gif => gif.url);
    if (gifs.length) {
      await cacheLayer.set(cacheKey, JSON.stringify(gifs), "EX", 24 * 3600);
    }
    return gifs;
  } catch (error) {
    logger.warn("KLIPY: GIFs divertidos indisponíveis");
    return [];
  }
};

/** Envia um GIF ou figurinha do KLIPY para a conversa. */
/**
 * GIF (ou webm) virando mp4 de verdade, com o ffmpeg que ja vem no projeto.
 * Largura e altura viram numeros pares porque o H.264 exige isso, e `-an`
 * evita o ffmpeg reclamar de um audio que o GIF nao tem.
 */
const paraMp4 = async (entrada: Buffer): Promise<Buffer> => {
  const convertido = await convertMedia(
    entrada,
    "mp4",
    "-movflags +faststart -pix_fmt yuv420p -vf scale=trunc(iw/2)*2:trunc(ih/2)*2 -c:v libx264 -an",
    "video/mp4"
  );
  return juntarStream(convertido.data);
};

export const sendKlipy = async (
  ticket: Ticket,
  id: string,
  companyId: number,
  quotedMsg?: Message
): Promise<void> => {
  const isSticker = id.startsWith("klipy:stickers:");
  const { url } = await klipyItemFile(
    companyId,
    id,
    isSticker ? ["webp", "png", "gif"] : ["mp4", "webm", "gif"]
  );
  const buffer = await downloadMedia(url);

  if (isSticker) {
    const filename = "sticker.webp";
    const mediaUrl = await saveMediaToFile(
      { data: buffer, mimetype: "image/webp", filename },
      { destination: ticket }
    );
    await sendWhatsappFile(
      ticket,
      { mediaUrl, mimetype: "image/webp", filename },
      { sticker: { url: path.join(getPublicPath(), mediaUrl) } },
      quotedMsg
    );
    return;
  }

  // O KLIPY nem sempre tem mp4 no mesmo tamanho do item: no `md` costuma vir
  // só .gif ou .webm. O arquivo saía daqui com nome e mimetype de mp4 mesmo
  // assim, e o WhatsApp recusava o envio inteiro — ele só toca mp4/H.264 com
  // gifPlayback. Converte antes de mandar.
  const enviar = /\.mp4(\?|$)/i.test(url) ? buffer : await paraMp4(buffer);

  const filename = `gif-${id.split(":").pop()}.mp4`;
  const mediaUrl = await saveMediaToFile(
    { data: enviar, mimetype: "video/mp4", filename },
    { destination: ticket }
  );
  await sendWhatsappFile(
    ticket,
    { mediaUrl, mimetype: "video/mp4", filename },
    {
      video: { url: path.join(getPublicPath(), mediaUrl) },
      gifPlayback: true,
      mimetype: "video/mp4"
    },
    quotedMsg
  );
};

/**
 * Busca de GIFs e figurinhas para o painel de expressões: usa o KLIPY quando
 * há chave; senão, cai no GIPHY (GIFs) ou nas figurinhas das conversas.
 */
export const searchExpressions = async (
  companyId: number,
  kind: "gifs" | "stickers",
  query: string,
  page = 1
): Promise<{
  configured: boolean;
  provider: string;
  items: { id: string; preview: string; title: string; provider: string }[];
}> => {
  try {
    const klipy = await klipyList(companyId, kind, query, page);
    if (klipy.configured) {
      return { configured: true, provider: "klipy", items: klipy.items };
    }
  } catch (error) {
    logger.warn("KLIPY indisponível, tentando o GIPHY");
  }

  if (kind === "gifs") {
    const giphy = await searchGifs(companyId, query, (page - 1) * 24);
    return {
      configured: giphy.configured,
      provider: "giphy",
      items: giphy.gifs.map(gif => ({
        id: gif.id,
        preview: gif.preview,
        title: gif.title,
        provider: "giphy"
      }))
    };
  }

  return { configured: false, provider: "none", items: [] };
};

/**
 * GIFs da tela de login (pública): uma seleção leve e sempre "livre" (g),
 * com temas de atendimento e comemoração. Usa a chave do GIPHY da
 * instalação e guarda o resultado por 6 horas.
 */
const LOGIN_THEMES = [
  "customer service",
  "happy team",
  "thank you",
  "celebration office",
  "texting",
  "high five"
];

export const loginGifs = async (): Promise<{
  configured: boolean;
  gifs: { id: string; url: string }[];
}> => {
  const cached = await cacheLayer.get("login:gifs");
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (error) {
      // recalcula
    }
  }
  const key = await GetCompanySetting(1, "giphyApiKey", "");
  if (!key) return { configured: false, gifs: [] };

  const seen = new Set<string>();
  const gifs: { id: string; url: string }[] = [];
  await Promise.all(
    LOGIN_THEMES.map(async theme => {
      try {
        const params = new URLSearchParams({
          api_key: key,
          q: theme,
          limit: "6",
          rating: "g"
        });
        const response = await fetch(
          `https://api.giphy.com/v1/gifs/search?${params}`
        );
        if (!response.ok) return;
        const body = (await response.json()) as { data?: GiphyGif[] };
        (body.data || []).forEach(gif => {
          const url =
            gif.images?.fixed_width?.webp || gif.images?.fixed_width?.url;
          if (url && !seen.has(gif.id)) {
            seen.add(gif.id);
            gifs.push({ id: gif.id, url });
          }
        });
      } catch (error) {
        logger.warn("GIPHY: GIFs do login indisponíveis");
      }
    })
  );

  const result = { configured: true, gifs: gifs.slice(0, 30) };
  if (gifs.length) {
    await cacheLayer.set("login:gifs", JSON.stringify(result), "EX", 6 * 3600);
  }
  return result;
};
