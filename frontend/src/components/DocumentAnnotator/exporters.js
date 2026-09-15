import { PDFDocument } from "pdf-lib";
import { BASE, canvasToBlob, paintAnnotations } from "./paint";

const MAX_SIDE = 4096;

const annotatedName = (name, ext) => {
  const base = String(name || "documento").replace(/\.[^.]+$/, "");
  return `${base}-anotado.${ext}`;
};

/** Foto com as anotações "queimadas" por cima. */
export const exportImage = async ({ src, name, annotations }) => {
  const img = await new Promise((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = "anonymous";
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = src;
  });
  const ratio = Math.min(
    1,
    MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight)
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * ratio);
  canvas.height = Math.round(img.naturalHeight * ratio);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  paintAnnotations(ctx, annotations[0] || [], canvas.width / BASE);
  const blob = await canvasToBlob(canvas, "image/png");
  return new File([blob], annotatedName(name, "png"), { type: "image/png" });
};

/**
 * PDF com as anotações. O texto original continua sendo texto (dá para
 * selecionar e buscar); cada página anotada ganha uma camada transparente
 * com os desenhos por cima.
 */
export const exportPdf = async ({ src, name, annotations, pages }) => {
  const bytes = await fetch(src).then(res => res.arrayBuffer());
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const docPages = doc.getPages();

  for (let index = 0; index < docPages.length; index += 1) {
    const list = annotations[index];
    if (!list || !list.length) continue;
    const page = docPages[index];
    const box = page.getCropBox();
    const angle = ((page.getRotation().angle % 360) + 360) % 360;
    const sideways = angle === 90 || angle === 270;
    const shownWidth = sideways ? box.height : box.width;
    const aspect =
      pages[index]?.aspect ||
      (sideways ? box.width / box.height : box.height / box.width);
    const width = Math.min(2400, Math.round(shownWidth * 3));
    const shown = document.createElement("canvas");
    shown.width = width;
    shown.height = Math.round(width * aspect);
    paintAnnotations(shown.getContext("2d"), list, width / BASE);

    // página girada no arquivo: a camada volta para a posição "de pé"
    let canvas = shown;
    if (angle) {
      canvas = document.createElement("canvas");
      canvas.width = sideways ? shown.height : shown.width;
      canvas.height = sideways ? shown.width : shown.height;
      const ctx = canvas.getContext("2d");
      if (angle === 90) {
        ctx.translate(0, canvas.height);
        ctx.rotate(-Math.PI / 2);
      } else if (angle === 180) {
        ctx.translate(canvas.width, canvas.height);
        ctx.rotate(Math.PI);
      } else if (angle === 270) {
        ctx.translate(canvas.width, 0);
        ctx.rotate(Math.PI / 2);
      }
      ctx.drawImage(shown, 0, 0);
    }
    const blob = await canvasToBlob(canvas, "image/png");
    const png = await doc.embedPng(await blob.arrayBuffer());
    page.drawImage(png, {
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height
    });
  }

  const out = await doc.save();
  return new File([out], annotatedName(name, "pdf"), {
    type: "application/pdf"
  });
};
