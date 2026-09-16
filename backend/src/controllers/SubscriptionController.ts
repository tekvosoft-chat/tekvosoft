import { Request, Response } from "express";
import Plan from "../models/Plan";
import Company from "../models/Company";
import Invoices from "../models/Invoices";
import { funGifs } from "../services/MessageServices/ExpressionsService";
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

/**
 * O admin escolhe o plano na tela de pagamento (teste acabou ou renovação):
 * a empresa passa para o plano e a fatura em aberto fica com o valor dele.
 */
export const choosePlan = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId, profile } = req.user;
  if (profile !== "admin") throw new AppError("ERR_NO_PERMISSION", 403);

  const plan = await Plan.findByPk(req.body?.planId);
  if (!plan) throw new AppError("ERR_NO_PLAN_FOUND", 404);

  const company = await Company.findByPk(companyId);
  await company.update({ planId: plan.id });

  const today = new Date().toISOString().slice(0, 10);
  let invoice = await Invoices.findOne({
    where: { companyId, status: "open" },
    order: [["id", "DESC"]]
  });

  const detail = `${plan.name} - ${company.name}`;
  if (invoice) {
    await invoice.update({
      value: plan.value,
      detail,
      currency: plan.currency || "BRL",
      txId: null,
      payGw: null,
      payGwData: null
    });
  } else {
    invoice = await Invoices.create({
      companyId,
      value: plan.value,
      detail,
      status: "open",
      dueDate: today,
      currency: plan.currency || "BRL"
    });
  }

  return res.json(invoice);
};

/** GIFs do aviso de pagamento e do agradecimento. */
export const gifs = async (req: Request, res: Response): Promise<Response> =>
  res.json(await funGifs(String(req.query.kind || "")));

export const webhook = async (
  req: Request,
  res: Response
): Promise<Response> => {
  return payGatewayReceiveWebhook(req, res);
};
