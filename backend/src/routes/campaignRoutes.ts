import express from "express";
import isAuth from "../middleware/isAuth";
import planFeature from "../middleware/planFeature";

import * as CampaignController from "../controllers/CampaignController";
import multer from "multer";
import uploadConfig from "../config/upload";

const upload = multer(uploadConfig);

const routes = express.Router();

routes.get(
  "/campaigns/list",
  isAuth,
  planFeature("useCampaigns"),
  CampaignController.findList
);

routes.get(
  "/campaigns",
  isAuth,
  planFeature("useCampaigns"),
  CampaignController.index
);

routes.get(
  "/campaigns/:id",
  isAuth,
  planFeature("useCampaigns"),
  CampaignController.show
);

routes.post(
  "/campaigns",
  isAuth,
  planFeature("useCampaigns"),
  CampaignController.store
);

routes.put(
  "/campaigns/:id",
  isAuth,
  planFeature("useCampaigns"),
  CampaignController.update
);

routes.delete(
  "/campaigns/:id",
  isAuth,
  planFeature("useCampaigns"),
  CampaignController.remove
);

routes.post(
  "/campaigns/:id/cancel",
  isAuth,
  planFeature("useCampaigns"),
  CampaignController.cancel
);

routes.post(
  "/campaigns/:id/restart",
  isAuth,
  planFeature("useCampaigns"),
  CampaignController.restart
);

routes.post(
  "/campaigns/:id/media-upload",
  isAuth,
  planFeature("useCampaigns"),
  upload.array("file"),
  CampaignController.mediaUpload
);

routes.delete(
  "/campaigns/:id/media-upload",
  isAuth,
  planFeature("useCampaigns"),
  CampaignController.deleteMedia
);

export default routes;
