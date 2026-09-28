import express from "express";
import isAuth from "../middleware/isAuth";

import * as TicketController from "../controllers/TicketController";
import isCompliant from "../middleware/isCompliant";

const ticketRoutes = express.Router();

ticketRoutes.get("/tickets", isAuth, isCompliant, TicketController.index);

ticketRoutes.get(
  "/tickets/:ticketId",
  isAuth,
  isCompliant,
  TicketController.show
);

ticketRoutes.get(
  "/tickets/u/:uuid",
  isAuth,
  isCompliant,
  TicketController.showFromUUID
);

ticketRoutes.post("/tickets", isAuth, isCompliant, TicketController.store);

ticketRoutes.put(
  "/tickets/:ticketId",
  isAuth,
  isCompliant,
  TicketController.update
);

// menu de contexto da lista de conversas
ticketRoutes.put(
  "/tickets/:ticketId/priority",
  isAuth,
  isCompliant,
  TicketController.setPriority
);

ticketRoutes.put(
  "/tickets/:ticketId/snooze",
  isAuth,
  isCompliant,
  TicketController.snooze
);

ticketRoutes.put(
  "/tickets/:ticketId/unread",
  isAuth,
  isCompliant,
  TicketController.markUnread
);

ticketRoutes.delete(
  "/tickets/:ticketId",
  isAuth,
  isCompliant,
  TicketController.remove
);

export default ticketRoutes;
