import crypto from "crypto";
import fs from "fs";
import path from "path";
import multer from "multer";

// anexos dos chamados de suporte: pasta privada (não é servida em /public)
// e nome aleatório, sem dar para adivinhar
const privateFolder = __dirname.endsWith("/dist")
  ? path.resolve(__dirname, "..", "private")
  : path.resolve(__dirname, "..", "..", "private");
const directory = path.join(privateFolder, "support");

export default {
  directory,

  limits: {
    fileSize: 20 * 1024 * 1024,
    files: 10
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
