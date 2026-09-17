import "./bootstrap";
import "reflect-metadata";
import "express-async-errors";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import * as Sentry from "@sentry/node";

import "./database";
import path from "path";
import uploadConfig from "./config/upload";
import AppError from "./errors/AppError";
import routes from "./routes";
import { logger } from "./utils/logger";
import { messageQueue, sendScheduledMessages } from "./queues";
import { corsOrigin } from "./helpers/corsOrigin";

class SystemError extends Error {
  code?: string;
}

Sentry.init({ dsn: process.env.SENTRY_DSN });

const app = express();

app.set("queues", {
  messageQueue,
  sendScheduledMessages
});

app.use(
  cors({
    credentials: true,
    origin: corsOrigin,
    exposedHeaders: [
      "Content-Range",
      "X-Content-Range",
      "Date",
      "Accept-Ranges",
      "Content-Length"
    ]
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(Sentry.Handlers.requestHandler());
// não revela a tecnologia do servidor e liga proteções básicas do navegador
app.disable("x-powered-by");
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});
app.get("/public/*", (req, res) => {
  // SEGURANÇA: "..%2f" no endereço saía da pasta pública e baixava qualquer
  // arquivo do servidor (código, certificados). Só serve o que está dentro
  // da pasta de uploads, e nunca arquivos ocultos (.env etc.).
  const baseDir = path.resolve(uploadConfig.directory);
  const filePath = path.resolve(baseDir, `.${path.sep}${req.params[0] || ""}`);
  if (
    !filePath.startsWith(baseDir + path.sep) ||
    filePath.split(path.sep).some(part => part.startsWith("."))
  ) {
    return res.status(404).end();
  }

  if (filePath.endsWith(".aac")) {
    res.setHeader("Content-Type", "audio/aac");
  }

  // SEGURANÇA: arquivos vêm de clientes no WhatsApp. HTML/SVG/XML abertos
  // no navegador rodariam script no domínio do sistema e roubariam a sessão
  // do atendente. Só abre na tela o que é mídia/PDF/texto; o resto baixa, e
  // tudo que não é mídia vai com "sandbox" (sem script, mesmo se aberto).
  const safeInline =
    /\.(pdf|png|jpe?g|gif|webp|bmp|ico|mp4|webm|ogg|oga|opus|mp3|m4a|aac|wav|txt)$/i.test(
      filePath
    );
  if (
    !/\.(png|jpe?g|gif|webp|bmp|ico|mp4|webm|ogg|oga|opus|mp3|m4a|aac|wav|pdf)$/i.test(
      filePath
    )
  ) {
    res.setHeader("Content-Security-Policy", "sandbox; default-src 'none'");
  }
  if (/\.txt$/i.test(filePath)) {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
  }

  // ?inline=1 → serve with Content-Disposition: inline so browsers display
  // the file in-place (e.g. PDF viewer iframe) instead of downloading it.
  if (req.query.inline === "1" && safeInline) {
    res.setHeader("Content-Disposition", "inline");
    return res.sendFile(filePath, err => {
      if (err) {
        const sysErr = err as SystemError;
        if (sysErr.code === "ENOENT") {
          res.status(404).end();
        } else {
          logger.debug(
            { err },
            `Error serving inline file ${req.params[0]}: ${sysErr.message}`
          );
          res.status(500).end();
        }
      }
    });
  }

  res.download(filePath, (err: SystemError) => {
    if (err) {
      if (err.code === "ENOENT") {
        res.status(404).end();
      } else {
        logger.debug(
          { err },
          `Error downloading file ${req.params[0]}: ${err.message}`
        );
        res.status(500).end();
      }
    }
  });
});

app.use((req, _res, next) => {
  const { method, url, query, body, headers } = req;
  logger.trace(
    { method, url, query, body, headers },
    `Incoming request: ${req.method} ${req.url}`
  );
  next();
});

app.use(routes);

app.use(Sentry.Handlers.errorHandler());
app.use(async (err: Error, req: Request, res: Response, _: NextFunction) => {
  if (err instanceof AppError) {
    logger[err.level](err);
    return res.status(err.statusCode).json({ error: err.message });
  }

  logger.error(err);
  return res.status(500).json({ error: "Internal server error" });
});

export default app;
