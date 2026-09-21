import { Router } from "express";
import isAuth from "../middleware/isAuth";
import isCompliant from "../middleware/isCompliant";
import * as GroupController from "../controllers/GroupController";

const groupRoutes = Router();

groupRoutes.get("/groups/:ticketId", isAuth, isCompliant, GroupController.show);

groupRoutes.get(
  "/groups/:ticketId/picture",
  isAuth,
  isCompliant,
  GroupController.participantPicture
);

groupRoutes.post(
  "/groups/:ticketId/leave",
  isAuth,
  isCompliant,
  GroupController.leave
);

groupRoutes.post(
  "/groups/:ticketId/join",
  isAuth,
  isCompliant,
  GroupController.join
);

export default groupRoutes;
