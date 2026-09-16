import { Request, Response } from "express";
import * as Yup from "yup";
import AppError from "../errors/AppError";
import {
  payGatewayCreateSubscription,
  payGatewayReceiveWebhook,
  paymentMethods,
  payGatewayAsaasWebhook
} from "../services/PaymentGatewayServices/PaymentGatewayServices";
import {
  asaasRemoveCard,
  asaasSavedCard
} from "../services/PaymentGatewayServices/AsaasServices";

export const createSubscription = async (
  req: Request,
  res: Response
): Promise<Response> => {
  // cartão e boleto mandam a fatura e a forma; o Pix manda o resumo do plano
  if (!["CREDIT_CARD", "BOLETO"].includes(req.body?.method)) {
    const schema = Yup.object().shape({
      price: Yup.string().required(),
      users: Yup.string().required(),
      connections: Yup.string().required()
    });

    if (!(await schema.isValid(req.body))) {
      throw new AppError("Validation fails", 400);
    }
  }

  return payGatewayCreateSubscription(req, res);
};

/** Formas de pagamento ligadas + cartão salvo da empresa. */
export const methods = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;
  const [enabled, card] = await Promise.all([
    paymentMethods(),
    asaasSavedCard(companyId)
  ]);
  return res.json({ ...enabled, savedCard: card });
};

export const removeCard = async (
  req: Request,
  res: Response
): Promise<Response> => {
  await asaasRemoveCard(req.user.companyId);
  return res.json({ ok: true });
};

export const asaasWebhookRoute = async (
  req: Request,
  res: Response
): Promise<Response> => payGatewayAsaasWebhook(req, res);

export const webhook = async (
  req: Request,
  res: Response
): Promise<Response> => {
  return payGatewayReceiveWebhook(req, res);
};
