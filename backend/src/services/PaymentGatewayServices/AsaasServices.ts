import { Request, Response } from "express";

import AppError from "../../errors/AppError";
import Company from "../../models/Company";
import Invoices from "../../models/Invoices";
import Setting from "../../models/Setting";
import GetSuperSettingService from "../SettingServices/GetSuperSettingService";
import { logger } from "../../utils/logger";
import { processInvoicePaid } from "./PaymentGatewayServices";
import { cacheLayer } from "../../libs/cache";

/**
 * Asaas: cartão de crédito e boleto.
 *
 * O Pix continua pela Efí; o Asaas entra para o que a Efí não cobre aqui:
 * boleto e cartão — inclusive guardando o cartão do cliente (tokenização)
 * para cobrar sozinho todo mês.
 *
 * Configuração (Configurações > Formas de pagamento, só o super admin):
 *   _asaasApiKey      chave de API da conta Asaas
 *   _asaasEnv         "sandbox" para testes, "production" para valer
 *   _asaasWebhookToken  token que o Asaas envia no cabeçalho asaas-access-token
 *
 * Por empresa (guardado nas configurações da própria empresa):
 *   asaasCustomerId   id do cliente no Asaas
 *   asaasCardToken    cartão salvo (token), nunca o número
 *   asaasCardLabel    "VISA •••• 1234", só para mostrar na tela
 *   asaasCardExpiry   "09/34", validade do cartão salvo (só para mostrar)
 *   asaasAutoRenew    "disabled" pausa a cobrança automática no cartão
 *   billingAddress    endereço de cobrança (JSON), tela Minha Assinatura
 */
const BASES = {
  sandbox: "https://api-sandbox.asaas.com/v3",
  production: "https://api.asaas.com/v3"
};

export type AsaasMethod = "CREDIT_CARD" | "BOLETO" | "PIX";

const asaasConfig = async () => {
  const apiKey = await GetSuperSettingService({ key: "_asaasApiKey" });
  const env = (await GetSuperSettingService({ key: "_asaasEnv" })) || "sandbox";
  return { apiKey, base: BASES[env] || BASES.sandbox };
};

export const asaasEnabled = async (): Promise<boolean> => {
  const { apiKey } = await asaasConfig();
  return !!apiKey;
};

const asaasRequest = async (
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<any> => {
  const { apiKey, base } = await asaasConfig();
  if (!apiKey) throw new AppError("ERR_ASAAS_NOT_CONFIGURED", 400);

  const response = await fetch(`${base}${path}`, {
    method: options.method || "GET",
    headers: {
      access_token: apiKey,
      "Content-Type": "application/json",
      "User-Agent": "Tekvosoft"
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    logger.error({ path, status: response.status, data }, "Asaas: erro");
    const description = data?.errors?.[0]?.description;
    throw new AppError(description || "ERR_ASAAS_REQUEST_FAILED", 400);
  }
  return data;
};

const companySetting = async (
  companyId: number,
  key: string
): Promise<string> => {
  const setting = await Setting.findOne({ where: { companyId, key } });
  return setting?.value || "";
};

const saveCompanySetting = async (
  companyId: number,
  key: string,
  value: string
): Promise<void> => {
  const setting = await Setting.findOne({ where: { companyId, key } });
  if (setting) {
    await setting.update({ value });
    return;
  }
  await Setting.create({ companyId, key, value });
};

/**
 * Garante o cliente da empresa dentro do Asaas (cria na primeira vez).
 * O CPF/CNPJ vem do formulário de pagamento e fica guardado para as
 * próximas cobranças.
 */
const ensureCustomer = async (
  company: Company,
  cpfCnpj?: string
): Promise<string> => {
  const saved = await companySetting(company.id, "asaasCustomerId");
  if (saved) return saved;

  const informed = String(cpfCnpj || "").replace(/\D/g, "");
  const stored = await companySetting(company.id, "asaasDocument");
  const document = informed || stored;
  if (!document) {
    throw new AppError("ERR_DOCUMENT_REQUIRED", 400);
  }
  await saveCompanySetting(company.id, "asaasDocument", document);
  const customer = await asaasRequest("/customers", {
    method: "POST",
    body: {
      name: company.name,
      email: company.email || undefined,
      mobilePhone: String(company.phone || "").replace(/\D/g, "") || undefined,
      cpfCnpj: document || undefined,
      externalReference: `company-${company.id}`,
      notificationDisabled: false
    }
  });

  await saveCompanySetting(company.id, "asaasCustomerId", customer.id);
  return customer.id;
};

const dueDateFor = (invoice: Invoices): string => {
  const today = new Date();
  const due = invoice.dueDate ? new Date(invoice.dueDate) : today;
  const chosen = due > today ? due : today;
  return chosen.toISOString().slice(0, 10);
};

type ChargeResult = {
  method: AsaasMethod;
  status: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  identificationField?: string;
  pixCopyPaste?: string;
  cardSaved?: boolean;
  cardLabel?: string;
};

/** Cria a cobrança no Asaas e guarda os dados na fatura. */
export const asaasCreateCharge = async (
  invoice: Invoices,
  company: Company,
  method: AsaasMethod,
  extra: {
    creditCard?: Record<string, string>;
    creditCardHolderInfo?: Record<string, string>;
    remoteIp?: string;
    saveCard?: boolean;
    cpfCnpj?: string;
  } = {}
): Promise<ChargeResult> => {
  const customer = await ensureCustomer(company, extra.cpfCnpj);
  const savedToken = await companySetting(company.id, "asaasCardToken");

  const body: Record<string, unknown> = {
    customer,
    billingType: method,
    value: Number(invoice.value),
    dueDate: dueDateFor(invoice),
    description: invoice.detail || `Assinatura ${company.name}`,
    externalReference: `invoice-${invoice.id}`
  };

  if (method === "CREDIT_CARD") {
    if (extra.creditCard) {
      body.creditCard = extra.creditCard;
      body.creditCardHolderInfo = extra.creditCardHolderInfo;
    } else if (savedToken) {
      body.creditCardToken = savedToken;
    } else {
      throw new AppError("ERR_CARD_REQUIRED", 400);
    }
    body.remoteIp = extra.remoteIp;
  }

  const payment = await asaasRequest("/payments", { method: "POST", body });

  await invoice.update({
    txId: payment.id,
    payGw: "asaas",
    payGwData: JSON.stringify({
      method,
      status: payment.status,
      invoiceUrl: payment.invoiceUrl,
      bankSlipUrl: payment.bankSlipUrl
    })
  });

  // cartão salvo: as próximas cobranças saem sozinhas, sem pedir os dados
  let cardLabel = "";
  const token = payment?.creditCard?.creditCardToken;
  if (method === "CREDIT_CARD" && extra.saveCard && token) {
    cardLabel = `${payment.creditCard.creditCardBrand || "Cartão"} •••• ${
      payment.creditCard.creditCardNumber || ""
    }`.trim();
    await saveCompanySetting(company.id, "asaasCardToken", token);
    await saveCompanySetting(company.id, "asaasCardLabel", cardLabel);
    const month = String(extra.creditCard?.expiryMonth || "").padStart(2, "0");
    const year = String(extra.creditCard?.expiryYear || "").slice(-2);
    await saveCompanySetting(
      company.id,
      "asaasCardExpiry",
      /^\d{2}$/.test(year) && month !== "00" ? `${month}/${year}` : ""
    );
    // primeiro pagamento no cartão: o CEP e o número do titular viram o
    // endereço de cobrança, se a empresa ainda não tinha um
    const holder = extra.creditCardHolderInfo;
    if (
      holder?.postalCode &&
      !(await companySetting(company.id, "billingAddress"))
    ) {
      await saveCompanySetting(
        company.id,
        "billingAddress",
        JSON.stringify({
          postalCode: String(holder.postalCode).replace(/\D/g, "").slice(0, 8),
          number: String(holder.addressNumber || "").slice(0, 20)
        })
      );
    }
  }

  let pixCopyPaste = "";
  if (method === "PIX") {
    const qr = await asaasRequest(`/payments/${payment.id}/pixQrCode`).catch(
      () => null
    );
    pixCopyPaste = qr?.payload || "";
  }

  if (["RECEIVED", "CONFIRMED"].includes(payment.status)) {
    await processInvoicePaid(invoice);
  }

  return {
    method,
    status: payment.status,
    invoiceUrl: payment.invoiceUrl,
    bankSlipUrl: payment.bankSlipUrl,
    identificationField: payment.identificationField,
    pixCopyPaste,
    cardSaved: !!cardLabel,
    cardLabel
  };
};

/** Rota usada pela tela de pagamento do cliente. */
export const asaasCreateSubscription = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const {
    invoiceId,
    method,
    creditCard,
    creditCardHolderInfo,
    saveCard,
    cpfCnpj
  } = req.body;
  const { companyId } = req.user;

  const invoice = await Invoices.findOne({
    where: { id: invoiceId, companyId },
    include: { model: Company, as: "company" }
  });
  if (!invoice) throw new AppError("ERR_INVOICE_NOT_FOUND", 404);

  const company = invoice.company || (await Company.findByPk(companyId));
  const result = await asaasCreateCharge(
    invoice,
    company,
    method === "BOLETO" ? "BOLETO" : "CREDIT_CARD",
    {
      creditCard,
      creditCardHolderInfo,
      cpfCnpj: cpfCnpj || creditCardHolderInfo?.cpfCnpj,
      saveCard: !!saveCard,
      remoteIp: (req.headers["x-forwarded-for"] as string) || req.ip
    }
  );

  return res.json(result);
};

/** Cartão salvo da empresa (para a tela mostrar "cobrança automática"). */
export const asaasSavedCard = async (companyId: number) => ({
  label: await companySetting(companyId, "asaasCardLabel"),
  hasCard: !!(await companySetting(companyId, "asaasCardToken")),
  expiry: await companySetting(companyId, "asaasCardExpiry"),
  autoRenew: (await companySetting(companyId, "asaasAutoRenew")) !== "disabled"
});

export const asaasRemoveCard = async (companyId: number): Promise<void> => {
  await saveCompanySetting(companyId, "asaasCardToken", "");
  await saveCompanySetting(companyId, "asaasCardLabel", "");
  await saveCompanySetting(companyId, "asaasCardExpiry", "");
};

/** Liga ou pausa a cobrança automática no cartão salvo. */
export const asaasSetAutoRenew = async (
  companyId: number,
  enabled: boolean
): Promise<void> =>
  saveCompanySetting(
    companyId,
    "asaasAutoRenew",
    enabled ? "enabled" : "disabled"
  );

export type BillingAddress = {
  postalCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  district?: string;
  city?: string;
  state?: string;
};

export const getBillingAddress = async (
  companyId: number
): Promise<BillingAddress | null> => {
  try {
    return (
      JSON.parse(await companySetting(companyId, "billingAddress")) || null
    );
  } catch {
    return null;
  }
};

export const saveBillingAddress = async (
  companyId: number,
  address: BillingAddress
): Promise<void> =>
  saveCompanySetting(companyId, "billingAddress", JSON.stringify(address));

/** Confere no Asaas se uma fatura já foi paga. */
export const asaasCheckStatus = async (invoice: Invoices): Promise<boolean> => {
  try {
    const payment = await asaasRequest(`/payments/${invoice.txId}`);
    if (
      ["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"].includes(payment.status)
    ) {
      await processInvoicePaid(invoice);
      return true;
    }
  } catch (error) {
    logger.error(error, "asaasCheckStatus");
  }
  return false;
};

/** Aviso do Asaas quando a cobrança é paga (ou vence). */
export const asaasWebhook = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const expected = await GetSuperSettingService({ key: "_asaasWebhookToken" });
  if (expected && req.headers["asaas-access-token"] !== expected) {
    throw new AppError("ERR_UNAUTHORIZED", 401);
  }

  const { event, payment } = req.body || {};
  if (!payment?.id) return res.json({ ok: true });

  const invoice = await Invoices.findOne({
    where: { txId: payment.id },
    include: { model: Company, as: "company" }
  });

  if (!invoice) {
    logger.debug(
      { payment: payment.id },
      "asaasWebhook: fatura não encontrada"
    );
    return res.json({ ok: true });
  }

  if (
    ["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"].includes(event) &&
    invoice.status !== "paid"
  ) {
    // SEGURANÇA: o aviso só dispara a conferência. Quem confirma o pagamento
    // é o próprio Asaas (consulta pela API) — um aviso falso não libera plano
    await asaasCheckStatus(invoice);
  }

  return res.json({ ok: true });
};

/**
 * Cobrança automática no cartão salvo: roda todo dia e cobra as faturas que
 * vencem hoje (ou já venceram) das empresas que deixaram o cartão guardado.
 */
export const asaasChargeSavedCards = async (): Promise<void> => {
  if (!(await asaasEnabled())) return;

  const invoices = await Invoices.findAll({
    where: { status: "open" },
    include: { model: Company, as: "company" }
  });

  const today = new Date().toISOString().slice(0, 10);

  for (const invoice of invoices) {
    const due = invoice.dueDate
      ? new Date(invoice.dueDate).toISOString().slice(0, 10)
      : null;
    if (!due || due > today) continue;

    // já existe cobrança no cartão para esta fatura: o Asaas cuida dela
    let lastMethod = "";
    try {
      lastMethod = invoice.payGwData
        ? JSON.parse(invoice.payGwData)?.method || ""
        : "";
    } catch {
      lastMethod = "";
    }
    if (lastMethod === "CREDIT_CARD") continue;

    // trava do dia: se um Pix foi gerado antes, a fatura tinha txId e o
    // cartão salvo nunca era cobrado. Agora cobra, sem repetir no mesmo dia.
    const guard = `asaas:autocharge:${invoice.id}:${today}`;

    if (await cacheLayer.get(guard).catch(() => null)) continue;

    const company = invoice.company;
    if (!company) continue;

    const token = await companySetting(company.id, "asaasCardToken");
    if (!token) continue;

    // renovação automática pausada na tela Minha Assinatura

    if ((await companySetting(company.id, "asaasAutoRenew")) === "disabled")
      continue;

    try {
      await cacheLayer.set(guard, "1", "EX", 172800).catch(() => {});

      await asaasCreateCharge(invoice, company, "CREDIT_CARD", {});
      logger.info(
        { invoice: invoice.id, company: company.id },
        "Asaas: cobrança automática no cartão salvo"
      );
    } catch (error) {
      logger.error(
        { invoice: invoice.id, error: error.message },
        "Asaas: falha na cobrança automática"
      );
    }
  }
};
