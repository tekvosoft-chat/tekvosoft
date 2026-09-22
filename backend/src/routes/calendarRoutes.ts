import { Router } from "express";
import isAuth from "../middleware/isAuth";
import * as CalendarController from "../controllers/CalendarController";

const calendarRoutes = Router();

calendarRoutes.get("/calendar/events", isAuth, CalendarController.index);
calendarRoutes.post("/calendar/events", isAuth, CalendarController.store);
calendarRoutes.put(
  "/calendar/events/:eventId",
  isAuth,
  CalendarController.update
);
calendarRoutes.delete(
  "/calendar/events/:eventId",
  isAuth,
  CalendarController.remove
);

export default calendarRoutes;
