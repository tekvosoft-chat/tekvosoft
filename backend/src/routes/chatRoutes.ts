import express from "express";
import multer from "multer";
import isAuth from "../middleware/isAuth";
import planFeature from "../middleware/planFeature";
import uploadConfig from "../config/upload";
import * as ChatController from "../controllers/ChatController";

const upload = multer(uploadConfig);

const routes = express.Router();

routes.get(
  "/chats",
  isAuth,
  planFeature("useInternalChat"),
  ChatController.index
);

routes.get(
  "/chats/:id",
  isAuth,
  planFeature("useInternalChat"),
  ChatController.show
);

routes.get(
  "/chats/:id/messages",
  isAuth,
  planFeature("useInternalChat"),
  ChatController.messages
);

routes.post(
  "/chats/:id/messages",
  isAuth,
  planFeature("useInternalChat"),
  upload.array("medias"),
  ChatController.saveMessage
);

routes.post(
  "/chats/:id/read",
  isAuth,
  planFeature("useInternalChat"),
  ChatController.checkAsRead
);

routes.post(
  "/chats",
  isAuth,
  planFeature("useInternalChat"),
  ChatController.store
);

routes.put(
  "/chats/:id",
  isAuth,
  planFeature("useInternalChat"),
  ChatController.update
);

routes.delete(
  "/chats/:id",
  isAuth,
  planFeature("useInternalChat"),
  ChatController.remove
);

export default routes;
