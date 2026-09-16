import express from "express";
import multer from "multer";
import uploadConfig from "../config/upload";
import isAuth from "../middleware/isAuth";
import planFeature from "../middleware/planFeature";

import * as ScheduleController from "../controllers/ScheduleController";

const scheduleRoutes = express.Router();
const upload = multer(uploadConfig);

scheduleRoutes.get(
  "/schedules",
  isAuth,
  planFeature("useSchedules"),
  ScheduleController.index
);

scheduleRoutes.post(
  "/schedules",
  isAuth,
  planFeature("useSchedules"),
  upload.single("media"),
  ScheduleController.store
);

scheduleRoutes.put(
  "/schedules/:scheduleId",
  isAuth,
  planFeature("useSchedules"),
  upload.single("media"),
  ScheduleController.update
);

scheduleRoutes.get(
  "/schedules/:scheduleId",
  isAuth,
  planFeature("useSchedules"),
  ScheduleController.show
);

scheduleRoutes.delete(
  "/schedules/:scheduleId",
  isAuth,
  planFeature("useSchedules"),
  ScheduleController.remove
);

export default scheduleRoutes;
