import { Request, Response } from "express";
import moment from "moment";
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
  asaasSavedCard,
  asaasSetAutoRenew,
  getBillingAddress,
  saveBillingAddress
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
  const [enabled, card, address] = await Promise.all([
    paymentMethods(),
    asaasSavedCard(companyId),
    getBillingAddress(companyId)
  ]);
  return res.json({ ...enabled, savedCard: card, address });
};

/** Renovação automática no cartão salvo: liga ou pausa. */
export const setAutoRenew = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId, profile } = req.user;
  if (profile !== "admin") throw new AppError("ERR_NO_PERMISSION", 403);
  await asaasSetAutoRenew(companyId, req.body?.enabled === true);
  return res.json(await asaasSavedCard(companyId));
};

/** Endereço de cobrança da empresa (tela Minha Assinatura). */
export const updateAddress = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId, profile } = req.user;
  if (profile !== "admin") throw new AppError("ERR_NO_PERMISSION", 403);

  const schema = Yup.object().shape({
    postalCode: Yup.string()
      .matches(/^\d{8}$/)
      .required(),
    street: Yup.string().max(200),
    number: Yup.string().max(20).required(),
    complement: Yup.string().max(100),
    district: Yup.string().max(100),
    city: Yup.string().max(100),
    state: Yup.string().max(2)
  });
  const body = req.body || {};
  const address = {
    postalCode: String(body.postalCode || "").replace(/\D/g, ""),
    street: String(body.street || "").trim(),
    number: String(body.number || "").trim(),
    complement: String(body.complement || "").trim(),
    district: String(body.district || "").trim(),
    city: String(body.city || "").trim(),
    state: String(body.state || "")
      .trim()
      .toUpperCase()
  };
  if (!(await schema.isValid(address))) {
    throw new AppError("ERR_INVALID_ADDRESS", 400);
  }

  await saveBillingAddress(companyId, address);
  return res.json(address);
};

export const removeCard = async (
  req: Request,
  res: Response
): Promise<Response> => {
  // SEGURANÇA: só o admin mexe na cobrança da empresa
  if (req.user.profile !== "admin")
    throw new AppError("ERR_NO_PERMISSION", 403);
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
  // SEGURANÇA: só planos públicos (ou o que a empresa já tem). Sem isso,
  // dava para escolher um plano interno/cortesia de valor menor.
  if (!plan.isPublic && company.planId !== plan.id) {
    throw new AppError("ERR_NO_PLAN_FOUND", 404);
  }
  const current = company.planId ? await Plan.findByPk(company.planId) : null;
  const downgrade = !!current && Number(plan.value) < Number(current.value);
  await company.update({ planId: plan.id });

  const today = moment().format("YYYY-MM-DD");
  // Downgrade no meio do período: nada a pagar agora. A próxima cobrança
  // sai no vencimento atual, já com o valor menor. Upgrade (ou acesso já
  // vencido) continua cobrando hoje.
  const renewal =
    company.dueDate && moment(company.dueDate).format("YYYY-MM-DD") > today
      ? moment(company.dueDate).format("YYYY-MM-DD")
      : today;
  const dueDate = downgrade ? renewal : today;

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
      payGwData: null,
      ...(downgrade ? { dueDate } : {})
    });
  } else {
    invoice = await Invoices.create({
      companyId,
      value: plan.value,
      detail,
      status: "open",
      dueDate,
      currency: plan.currency || "BRL"
    });
  }

  const invoiceDue = moment(invoice.dueDate).format("YYYY-MM-DD");
  return res.json({ ...invoice.toJSON(), payNow: invoiceDue <= today });
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
