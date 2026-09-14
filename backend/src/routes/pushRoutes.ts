import express from "express";
import isAuth from "../middleware/isAuth";

import * as PushController from "../controllers/PushController";

const pushRoutes = express.Router();

pushRoutes.get("/push/public-key", isAuth, PushController.publicKey);
pushRoutes.post("/push/subscriptions", isAuth, PushController.subscribe);
pushRoutes.put("/push/subscriptions", isAuth, PushController.updatePreferences);
pushRoutes.delete("/push/subscriptions", isAuth, PushController.unsubscribe);

export default pushRoutes;
