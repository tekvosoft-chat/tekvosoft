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

subscriptionRoutes.post(
  "/subscription/plan",
  isAuth,
  SubscriptionController.choosePlan
);

subscriptionRoutes.get(
  "/subscription/gifs",
  isAuth,
  SubscriptionController.gifs
);

subscriptionRoutes.delete(
  "/subscription/card",
  isAuth,
  SubscriptionController.removeCard
);

subscriptionRoutes.put(
  "/subscription/auto-renew",
  isAuth,
  SubscriptionController.setAutoRenew
);

subscriptionRoutes.put(
  "/subscription/address",
  isAuth,
  SubscriptionController.updateAddress
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
