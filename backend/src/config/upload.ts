import path from "path";
import multer from "multer";

const publicFolder = __dirname.endsWith("/dist")
  ? path.resolve(__dirname, "..", "public")
  : path.resolve(__dirname, "..", "..", "public");

export default {
  directory: publicFolder,

  // teto por arquivo e por envio: impede alguém de encher o disco do
  // servidor com um upload gigante (o WhatsApp aceita até ~100 MB)
  limits: {
    fileSize: Number(process.env.UPLOAD_MAX_MB || 100) * 1024 * 1024,
    files: 30
  },

  storage: multer.diskStorage({
    destination: publicFolder,
    filename(req, file, cb) {
      const fileName = new Date().getTime() + path.extname(file.originalname);

      return cb(null, fileName);
    }
  })
};
