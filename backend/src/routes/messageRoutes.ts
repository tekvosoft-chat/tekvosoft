import { Router } from "express";
import multer from "multer";
import isAuth from "../middleware/isAuth";
import uploadConfig from "../config/upload";
import tokenAuth from "../middleware/tokenAuth";
import planFeature from "../middleware/planFeature";

import * as MessageController from "../controllers/MessageController";
import isCompliant from "../middleware/isCompliant";

const messageRoutes = Router();

const upload = multer(uploadConfig);

messageRoutes.post(
  "/messages/forward",
  isAuth,
  isCompliant,
  MessageController.forward
);

// antes de /messages/:ticketId, senão "stickers" vira um id de atendimento
messageRoutes.get(
  "/messages/stickers",
  isAuth,
  isCompliant,
  MessageController.stickers
);

messageRoutes.get("/gifs/search", isAuth, isCompliant, MessageController.gifs);

messageRoutes.get(
  "/link-preview",
  isAuth,
  isCompliant,
  MessageController.linkPreview
);

messageRoutes.get(
  "/expressions/search",
  isAuth,
  isCompliant,
  MessageController.expressions
);

messageRoutes.post(
  "/messages/:ticketId/location",
  isAuth,
  isCompliant,
  MessageController.sendLocation
);

messageRoutes.post(
  "/messages/:ticketId/expression",
  isAuth,
  isCompliant,
  MessageController.sendExpression
);

messageRoutes.get(
  "/messages/:ticketId",
  isAuth,
  isCompliant,
  MessageController.index
);

messageRoutes.get(
  "/messages/:ticketId/previous",
  isAuth,
  isCompliant,
  MessageController.previous
);

messageRoutes.get(
  "/messages/:messageId/history",
  isAuth,
  isCompliant,
  MessageController.historyByMessageId
);

messageRoutes.post(
  "/messages/:ticketId",
  isAuth,
  isCompliant,
  upload.array("medias"),
  MessageController.store
);

messageRoutes.post(
  "/messages/edit/:messageId",
  isAuth,
  isCompliant,
  MessageController.edit
);

messageRoutes.post(
  "/messages/react/:messageId",
  isAuth,
  isCompliant,
  MessageController.react
);

messageRoutes.post(
  "/messages/:messageId/transcribe",
  isAuth,
  isCompliant,
  MessageController.transcribe
);

messageRoutes.delete(
  "/messages/:messageId",
  isAuth,
  isCompliant,
  MessageController.remove
);

messageRoutes.post(
  "/api/messages/send",
  tokenAuth,
  planFeature("useExternalApi"),
  isCompliant,
  upload.array("medias"),
  MessageController.send
);

/* * /
messageRoutes.get("/api/messages/sendGammu",
  basicAuth,
  MessageController.sendGammu);
);
/* */

export default messageRoutes;
