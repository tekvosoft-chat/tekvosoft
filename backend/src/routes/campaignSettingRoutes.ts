import express from "express";
import isAuth from "../middleware/isAuth";
import planFeature from "../middleware/planFeature";

import * as CampaignSettingController from "../controllers/CampaignSettingController";
import multer from "multer";
import uploadConfig from "../config/upload";

const upload = multer(uploadConfig);

const routes = express.Router();

routes.get(
  "/campaign-settings",
  isAuth,
  planFeature("useCampaigns"),
  CampaignSettingController.index
);

routes.post(
  "/campaign-settings",
  isAuth,
  planFeature("useCampaigns"),
  CampaignSettingController.store
);

export default routes;
