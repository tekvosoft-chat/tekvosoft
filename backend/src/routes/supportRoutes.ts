import { Router } from "express";
import multer from "multer";
import isAuth from "../middleware/isAuth";
import supportFiles from "../config/supportFiles";
import * as SupportController from "../controllers/SupportController";

const supportRoutes = Router();
const upload = multer(supportFiles);

supportRoutes.get("/support/tickets", isAuth, SupportController.index);
supportRoutes.get("/support/unread", isAuth, SupportController.unread);
supportRoutes.get("/support/tickets/:id", isAuth, SupportController.show);
supportRoutes.post(
  "/support/tickets",
  isAuth,
  upload.array("files"),
  SupportController.store
);
supportRoutes.post(
  "/support/tickets/:id/messages",
  isAuth,
  upload.array("files"),
  SupportController.reply
);
supportRoutes.put("/support/tickets/:id", isAuth, SupportController.update);
supportRoutes.delete("/support/tickets/:id", isAuth, SupportController.remove);
supportRoutes.get(
  "/support/attachments/:messageId/:attachmentId",
  isAuth,
  SupportController.attachment
);

export default supportRoutes;
