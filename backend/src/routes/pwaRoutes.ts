import express from "express";
import * as PwaController from "../controllers/PwaController";
import { loginGifs } from "../services/MessageServices/ExpressionsService";

const pwaRoutes = express.Router();

pwaRoutes.get("/manifest.json", PwaController.manifest);
pwaRoutes.get("/favicon.ico", PwaController.favicon);

// GIFs da tela de login (sem autenticação)
pwaRoutes.get("/login-gifs", async (req, res) => res.json(await loginGifs()));

export default pwaRoutes;
