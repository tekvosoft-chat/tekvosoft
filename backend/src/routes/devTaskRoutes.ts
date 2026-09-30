import { Router } from "express";
import multer from "multer";
import devFiles from "../config/devFiles";

import isAuth from "../middleware/isAuth";
import isSuper from "../middleware/isSuper";
import * as DevTaskController from "../controllers/DevTaskController";
import * as DevSkillController from "../controllers/DevSkillController";

// pipeline de desenvolvimento com IA: só o super admin
const devTaskRoutes = Router();
const guard = [isAuth, isSuper];
const upload = multer(devFiles);

devTaskRoutes.get("/dev-tasks/setup", ...guard, DevTaskController.setup);
devTaskRoutes.get("/dev-tasks/stats", ...guard, DevTaskController.stats);
devTaskRoutes.get("/dev-tasks", ...guard, DevTaskController.index);
devTaskRoutes.post(
  "/dev-tasks",
  ...guard,
  upload.array("files"),
  DevTaskController.store
);
devTaskRoutes.post(
  "/dev-tasks/from-support/:ticketId",
  ...guard,
  DevTaskController.fromSupport
);
devTaskRoutes.get("/dev-tasks/:id", ...guard, DevTaskController.show);
devTaskRoutes.put("/dev-tasks/:id", ...guard, DevTaskController.update);
devTaskRoutes.delete("/dev-tasks/:id", ...guard, DevTaskController.remove);
devTaskRoutes.get("/dev-tasks/:id/patch", ...guard, DevTaskController.patch);
devTaskRoutes.get(
  "/dev-tasks/:id/files/:fileId",
  ...guard,
  DevTaskController.file
);
devTaskRoutes.post(
  "/dev-tasks/:id/learn",
  ...guard,
  DevTaskController.learnNow
);
devTaskRoutes.post(
  "/dev-tasks/:id/approve",
  ...guard,
  DevTaskController.approve
);
devTaskRoutes.post("/dev-tasks/:id/retry", ...guard, DevTaskController.retry);
devTaskRoutes.post(
  "/dev-tasks/:id/comments",
  ...guard,
  upload.array("files"),
  DevTaskController.comment
);
devTaskRoutes.post(
  "/dev-tasks/:id/publish",
  ...guard,
  DevTaskController.publish
);
devTaskRoutes.post("/dev-tasks/:id/test", ...guard, DevTaskController.runTests);
devTaskRoutes.post("/dev-tasks/:id/done", ...guard, DevTaskController.finish);
devTaskRoutes.post("/dev-tasks/:id/cancel", ...guard, DevTaskController.cancel);

// skills que os agentes consomem (e o Sabichão alimenta)
devTaskRoutes.get("/dev-skills", ...guard, DevSkillController.index);
devTaskRoutes.post("/dev-skills", ...guard, DevSkillController.store);
devTaskRoutes.post("/dev-skills/teach", ...guard, DevSkillController.teach);
devTaskRoutes.put("/dev-skills/:id", ...guard, DevSkillController.update);
devTaskRoutes.delete("/dev-skills/:id", ...guard, DevSkillController.remove);
devTaskRoutes.post(
  "/dev-skills/:id/approve",
  ...guard,
  DevSkillController.approve
);

export default devTaskRoutes;
