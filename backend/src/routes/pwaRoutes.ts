import express from "express";
import * as PwaController from "../controllers/PwaController";
import { loginGifs } from "../services/MessageServices/ExpressionsService";

const pwaRoutes = express.Router();

pwaRoutes.get("/manifest.json", PwaController.manifest);
pwaRoutes.get("/favicon.ico", PwaController.favicon);
// ícone do app na cor do tema (manifesto e ícone do iPhone)
pwaRoutes.get("/pwa-icon.png", PwaController.icon);

// GIFs da tela de login (sem autenticação)
pwaRoutes.get("/login-gifs", async (req, res) => res.json(await loginGifs()));

export default pwaRoutes;
