import crypto from "crypto";
import fs from "fs";
import path from "path";
import multer from "multer";

// imagens das demandas do pipeline de IA: pasta privada (não é servida em
// /public), nome aleatório, e só imagem: é o que a IA consegue enxergar
const privateFolder = __dirname.endsWith("/dist")
  ? path.resolve(__dirname, "..", "private")
  : path.resolve(__dirname, "..", "..", "private");
const directory = path.join(privateFolder, "dev-pipeline");

export const DEV_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp"
];

export default {
  directory,

  limits: {
    fileSize: 8 * 1024 * 1024,
    files: 6
  },

  fileFilter(
    req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
  ) {
    cb(null, DEV_IMAGE_TYPES.includes(file.mimetype));
  },

  storage: multer.diskStorage({
    destination(req, file, cb) {
      fs.mkdirSync(directory, { recursive: true });
      cb(null, directory);
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname).slice(0, 10);
      cb(null, `${crypto.randomBytes(16).toString("hex")}${ext}`);
    }
  })
};
