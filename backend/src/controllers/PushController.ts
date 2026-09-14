import { Request, Response } from "express";

import AppError from "../errors/AppError";
import PushSubscription from "../models/PushSubscription";
import { getVapidPublicKey } from "../services/PushServices/WebPushService";

export const publicKey = async (
  _req: Request,
  res: Response
): Promise<Response> => {
  const key = await getVapidPublicKey();
  return res.status(200).json({ publicKey: key });
};

/**
 * Guarda (ou atualiza) a inscrição deste aparelho para o usuário logado.
 * Se outra pessoa entrar no mesmo aparelho, a inscrição passa a ser dela.
 */
export const subscribe = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id: userId, companyId } = req.user;
  const { subscription, silent } = req.body || {};
  const endpoint = subscription?.endpoint;
  const p256dh = subscription?.keys?.p256dh;
  const auth = subscription?.keys?.auth;

  if (
    typeof endpoint !== "string" ||
    !/^https:\/\//.test(endpoint) ||
    typeof p256dh !== "string" ||
    typeof auth !== "string"
  ) {
    throw new AppError("ERR_INVALID_PUSH_SUBSCRIPTION", 400);
  }

  const data = {
    userId: Number(userId),
    companyId,
    endpoint,
    p256dh,
    auth,
    silent: !!silent,
    userAgent: String(req.headers["user-agent"] || "").slice(0, 250)
  };

  const existing = await PushSubscription.findOne({ where: { endpoint } });
  if (existing) {
    await existing.update(data);
  } else {
    await PushSubscription.create(data as PushSubscription);
  }

  return res.status(200).json({ ok: true });
};

export const updatePreferences = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id: userId } = req.user;
  const { endpoint, silent } = req.body || {};
  if (typeof endpoint !== "string") {
    throw new AppError("ERR_INVALID_PUSH_SUBSCRIPTION", 400);
  }
  await PushSubscription.update(
    { silent: !!silent },
    { where: { endpoint, userId: Number(userId) } }
  );
  return res.status(200).json({ ok: true });
};

export const unsubscribe = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id: userId } = req.user;
  const { endpoint } = req.body || {};
  if (typeof endpoint === "string") {
    await PushSubscription.destroy({
      where: { endpoint, userId: Number(userId) }
    });
  }
  return res.status(200).json({ ok: true });
};
