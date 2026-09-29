import crypto from "crypto";
import fs from "fs";
import path from "path";
import { Jimp } from "jimp";
import devFiles, { DEV_IMAGE_TYPES } from "../../config/devFiles";
import DevTask, { DevAttachment } from "../../models/DevTask";
import { logger } from "../../utils/logger";
import { LlmImage } from "./llm";

/**
 * Imagens da demanda para a IA. Cada imagem custa token (~1 a 1,6 mil por
 * tela), então vão no máximo as 4 mais recentes, reduzidas a 1280 px no
 * lado maior. Print pequeno vai como veio (texto nítido); o grande vira
 * JPEG. O resultado fica em memória: a mesma imagem é lida pela triagem e
 * pelo desenvolvedor sem reprocessar.
 */
const MAX_IMAGES = 4;
const MAX_SIDE = 1280;
const KEEP_BYTES = 1.5 * 1024 * 1024;
// o Claude recusa imagem acima de 5 MB (em base64 ela cresce um terço)
const SEND_LIMIT = 3.5 * 1024 * 1024;

const cache = new Map<string, LlmImage | null>();

export const filePath = (attachment: DevAttachment): string | null => {
  if (!attachment.path) return null;
  const full = path.resolve(devFiles.directory, attachment.path);
  return full.startsWith(`${path.resolve(devFiles.directory)}${path.sep}`)
    ? full
    : null;
};

const prepare = async (attachment: DevAttachment): Promise<LlmImage | null> => {
  const full = filePath(attachment);
  if (!full || !DEV_IMAGE_TYPES.includes(attachment.mimetype)) return null;
  const original = await fs.promises.readFile(full);
  const mediaType = attachment.mimetype as LlmImage["mediaType"];

  try {
    const image = await Jimp.read(original);
    const small =
      image.width <= MAX_SIDE &&
      image.height <= MAX_SIDE &&
      original.length <= KEEP_BYTES;
    if (small) return { mediaType, data: original.toString("base64") };
    image.scaleToFit({ w: MAX_SIDE, h: MAX_SIDE });
    const jpeg = await image.getBuffer("image/jpeg", { quality: 82 });
    return { mediaType: "image/jpeg", data: jpeg.toString("base64") };
  } catch {
    // webp não abre no Jimp: vai como veio, se não for grande demais
    return original.length <= SEND_LIMIT
      ? { mediaType, data: original.toString("base64") }
      : null;
  }
};

export const taskImages = async (task: DevTask): Promise<LlmImage[]> => {
  const list = (task.attachments || []).slice(-MAX_IMAGES);
  const images = await Promise.all(
    list.map(async attachment => {
      if (!cache.has(attachment.id)) {
        const prepared = await prepare(attachment).catch(error => {
          logger.warn({ error, id: attachment.id }, "DevPipeline: imagem");
          return null;
        });
        cache.set(attachment.id, prepared);
      }
      return cache.get(attachment.id);
    })
  );
  return images.filter(Boolean);
};

/** Arquivos que chegaram pelo upload, prontos para guardar na demanda. */
export const attachmentsOf = (
  files: Express.Multer.File[] | undefined,
  eventId?: number
): DevAttachment[] =>
  (files || []).map(file => ({
    id: crypto.randomBytes(8).toString("hex"),
    name: file.originalname.slice(0, 180),
    mimetype: file.mimetype,
    size: file.size,
    path: path.relative(devFiles.directory, file.path),
    eventId
  }));

/** Copia uma imagem de outro lugar (anexo de chamado da Ajuda). */
export const copyImage = async (
  source: string,
  name: string,
  mimetype: string,
  eventId?: number
): Promise<DevAttachment | null> => {
  if (!DEV_IMAGE_TYPES.includes(mimetype)) return null;
  await fs.promises.mkdir(devFiles.directory, { recursive: true });
  const ext = path.extname(name).slice(0, 10);
  const target = `${crypto.randomBytes(16).toString("hex")}${ext}`;
  await fs.promises.copyFile(source, path.join(devFiles.directory, target));
  const stat = await fs.promises.stat(path.join(devFiles.directory, target));
  return {
    id: crypto.randomBytes(8).toString("hex"),
    name: name.slice(0, 180),
    mimetype,
    size: stat.size,
    path: target,
    eventId
  };
};

export const removeImages = async (task: DevTask): Promise<void> => {
  await Promise.all(
    (task.attachments || []).map(attachment => {
      const full = filePath(attachment);
      return full ? fs.promises.unlink(full).catch(() => null) : null;
    })
  );
};

/** Sem o caminho do disco: o que pode ir para o navegador. */
export const publicAttachments = (list: DevAttachment[] = []) =>
  list.map(({ path: _hidden, ...rest }) => rest);
