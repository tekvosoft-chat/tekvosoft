import { Router } from "express";
import multer from "multer";
import uploadConfig from "../config/upload";
import * as WebchatController from "../controllers/WebchatController";

const upload = multer(uploadConfig);

/**
 * Rotas do canal do site. Sem `isAuth`: quem visita o site não tem login —
 * o token da caixa de entrada é o que diz para onde a conversa vai.
 */
const webchatRoutes = Router();

webchatRoutes.get("/webchat/:token/config", WebchatController.config);
webchatRoutes.post("/webchat/:token/session", WebchatController.session);
webchatRoutes.post("/webchat/:token/messages", WebchatController.store);
webchatRoutes.get("/webchat/:token/messages", WebchatController.index);
webchatRoutes.post(
  "/webchat/:token/upload",
  upload.array("medias"),
  WebchatController.upload
);
webchatRoutes.post("/webchat/:token/close", WebchatController.close);

export default webchatRoutes;
