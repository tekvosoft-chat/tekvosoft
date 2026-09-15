import fs from "fs";
import path from "path";
import { Op } from "sequelize";

import AppError from "../../errors/AppError";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import { GetCompanySetting } from "../../helpers/CheckSettings";
import { getPublicPath } from "../../helpers/GetPublicPath";
import saveMediaToFile from "../../helpers/saveMediaFile";
import { sendWhatsappFile } from "../WbotServices/SendWhatsAppMedia";
import { logger } from "../../utils/logger";

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
  companyId: number
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
      sticker: isRemote ? { url: raw } : fs.readFileSync(localPath)
    }
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
  companyId: number
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
    { video: buffer, gifPlayback: true, mimetype: "video/mp4" }
  );
};
