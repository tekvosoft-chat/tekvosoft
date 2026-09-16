import express from "express";
import isAuth from "../middleware/isAuth";

import * as SubscriptionController from "../controllers/SubscriptionController";

const subscriptionRoutes = express.Router();
subscriptionRoutes.post(
  "/subscription",
  isAuth,
  SubscriptionController.createSubscription
);
subscriptionRoutes.get(
  "/subscription/methods",
  isAuth,
  SubscriptionController.methods
);

subscriptionRoutes.delete(
  "/subscription/card",
  isAuth,
  SubscriptionController.removeCard
);

subscriptionRoutes.post(
  "/subscription/ticketz/webhook/:type?",
  SubscriptionController.webhook
);

subscriptionRoutes.post(
  "/subscription/asaas/webhook",
  SubscriptionController.asaasWebhookRoute
);

export default subscriptionRoutes;
