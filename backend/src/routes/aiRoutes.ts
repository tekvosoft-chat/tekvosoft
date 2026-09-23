import { Router } from "express";
import isAuth from "../middleware/isAuth";
import isAdmin from "../middleware/isAdmin";
import * as AiController from "../controllers/AiController";

const aiRoutes = Router();

aiRoutes.get(
  "/ai/tickets/:ticketId/analysis",
  isAuth,
  AiController.ticketAnalysis
);
aiRoutes.post(
  "/ai/tickets/:ticketId/apply",
  isAuth,
  AiController.applySuggestion
);
aiRoutes.get(
  "/ai/contacts/:contactId/summary",
  isAuth,
  AiController.contactSummary
);
// mapa da conversa: só lê o que já foi gravado, não chama a IA
aiRoutes.get(
  "/ai/contacts/:contactId/journey",
  isAuth,
  AiController.contactJourney
);
// montar as filas é coisa de administrador
aiRoutes.post(
  "/ai/queues/suggest",
  isAuth,
  isAdmin,
  AiController.queueSuggestions
);

export default aiRoutes;
