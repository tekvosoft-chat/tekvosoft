import { Router } from "express";

import isAuth from "../middleware/isAuth";
import isSuper from "../middleware/isSuper";
import * as SuperDashboardController from "../controllers/SuperDashboardController";

const superRoutes = Router();

superRoutes.get(
  "/super/system",
  isAuth,
  isSuper,
  SuperDashboardController.system
);
superRoutes.get(
  "/super/overview",
  isAuth,
  isSuper,
  SuperDashboardController.overview
);
superRoutes.get(
  "/super/revenue",
  isAuth,
  isSuper,
  SuperDashboardController.revenue
);

superRoutes.get(
  "/super/companies/:companyId/users",
  isAuth,
  isSuper,
  SuperDashboardController.companyUsers
);

superRoutes.get(
  "/super/companies/:companyId/billing",
  isAuth,
  isSuper,
  SuperDashboardController.companyBilling
);

export default superRoutes;
