import crypto from "crypto";
import moment from "moment";
import { Op, Sequelize } from "sequelize";
import AppError from "../../errors/AppError";
import User from "../../models/User";
import UserDevice from "../../models/UserDevice";
import { cacheLayer } from "../../libs/cache";
import { appUrl, automationEnabled } from "../../libs/automation";
import {
  sendDeviceCodeEmail,
  sendPasswordChangedEmail,
  sendPasswordResetEmail
} from "../AutomationServices/EmailEvents";

/**
 * Segurança do acesso por e-mail:
 *
 * - Navegador novo: depois da senha certa, um código de 6 dígitos vai para
 *   o e-mail da pessoa. Com o código, o navegador fica liberado (e deixa de
 *   pedir enquanto for usado ao menos uma vez a cada 90 dias).
 * - Esqueci minha senha: link de uso único, válido por 30 minutos. Trocar a
 *   senha derruba as sessões abertas em outros aparelhos.
 *
 * Os códigos e links ficam no Redis só como hash.
 */
type AccessContext = { ip?: string; device?: string };

type Challenge = {
  userId: number;
  deviceHash: string;
  codeHash: string;
  attempts: number;
  sends: number;
  sentAt: number;
};

const TRUST_DAYS = 90;
const CODE_TTL = 10 * 60;
const MAX_ATTEMPTS = 5;
const MAX_SENDS = 4;
const RESEND_AFTER_MS = 30 * 1000;
const RESET_TTL = 30 * 60;

const sha = (value: string) =>
  crypto.createHash("sha256").update(value).digest("hex");

const sameHash = (a: string, b: string) =>
  a.length === b.length &&
  crypto.timingSafeEqual(
    new Uint8Array(Buffer.from(a)),
    new Uint8Array(Buffer.from(b))
  );

const challengeKey = (id: string) => `auth:device:${id}`;
const resetKey = (hash: string) => `auth:reset:${hash}`;

// o navegador manda um identificador aleatório que ele mesmo guardou
const deviceHashOf = (deviceId: unknown) => {
  const id = String(deviceId || "").trim();
  return /^[A-Za-z0-9_-]{16,100}$/.test(id) ? sha(id) : "";
};

const newCode = () => String(crypto.randomInt(0, 1000000)).padStart(6, "0");

const maskEmail = (email: string) => {
  const [name, domain] = String(email).split("@");
  if (!domain) return email;
  const visible = name.slice(0, Math.min(2, name.length));
  return `${visible}${"•".repeat(Math.max(2, Math.min(name.length - visible.length, 6)))}@${domain}`;
};

/** Pede código em navegador novo? Só com o n8n configurado para enviar. */
export const deviceCheckEnabled = (): boolean =>
  automationEnabled() && process.env.LOGIN_EMAIL_CODE !== "false";

export const isTrustedDevice = async (
  userId: number,
  deviceId: unknown
): Promise<boolean> => {
  const deviceHash = deviceHashOf(deviceId);
  if (!deviceHash) return false;
  const device = await UserDevice.findOne({
    where: {
      userId,
      deviceHash,
      lastSeenAt: { [Op.gte]: moment().subtract(TRUST_DAYS, "days").toDate() }
    }
  });
  if (!device) return false;
  await device.update({ lastSeenAt: new Date() });
  return true;
};

const trustDevice = async (
  userId: number,
  deviceHash: string,
  context: AccessContext
) => {
  if (!deviceHash) return;
  const [device] = await UserDevice.findOrCreate({
    where: { userId, deviceHash },
    defaults: { userId, deviceHash } as UserDevice
  });
  await device.update({
    label: (context.device || "").slice(0, 120),
    ip: (context.ip || "").slice(0, 64),
    lastSeenAt: new Date()
  });
};

const sendCode = async (
  user: User,
  challengeId: string,
  context: AccessContext
) => {
  // quem já tem a senha não pode usar isso para lotar o e-mail de alguém
  const countKey = `auth:device:count:${user.id}`;
  const count = Number((await cacheLayer.get(countKey)) || 0);
  if (count >= 10) throw new AppError("ERR_TOO_MANY_ATTEMPTS", 429);
  await cacheLayer.set(countKey, String(count + 1), "EX", 3600);

  const code = newCode();
  if (!(await sendDeviceCodeEmail(user, code, context))) {
    throw new AppError("ERR_CODE_NOT_SENT", 503);
  }
  return sha(`${challengeId}:${code}`);
};

/** Senha certa num navegador novo: manda o código e devolve o desafio. */
export const startDeviceChallenge = async (
  user: User,
  deviceId: unknown,
  context: AccessContext
): Promise<{ challengeId: string; email: string }> => {
  const challengeId = crypto.randomBytes(24).toString("hex");
  const codeHash = await sendCode(user, challengeId, context);
  const challenge: Challenge = {
    userId: user.id,
    deviceHash: deviceHashOf(deviceId),
    codeHash,
    attempts: 0,
    sends: 1,
    sentAt: Date.now()
  };
  await cacheLayer.set(
    challengeKey(challengeId),
    JSON.stringify(challenge),
    "EX",
    CODE_TTL
  );
  return { challengeId, email: maskEmail(user.email) };
};

const loadChallenge = async (challengeId: unknown): Promise<Challenge> => {
  const id = String(challengeId || "");
  const raw = /^[a-f0-9]{48}$/.test(id)
    ? await cacheLayer.get(challengeKey(id))
    : null;
  if (!raw) throw new AppError("ERR_CODE_EXPIRED", 400);
  return JSON.parse(raw);
};

export const resendDeviceCode = async (
  challengeId: string,
  context: AccessContext
): Promise<void> => {
  const challenge = await loadChallenge(challengeId);
  if (challenge.sends >= MAX_SENDS) {
    throw new AppError("ERR_TOO_MANY_ATTEMPTS", 429);
  }
  if (Date.now() - challenge.sentAt < RESEND_AFTER_MS) {
    throw new AppError("ERR_WAIT_TO_RESEND", 429);
  }
  const user = await User.findByPk(challenge.userId);
  if (!user) throw new AppError("ERR_CODE_EXPIRED", 400);

  const codeHash = await sendCode(user, challengeId, context);
  await cacheLayer.set(
    challengeKey(challengeId),
    JSON.stringify({
      ...challenge,
      codeHash,
      attempts: 0,
      sends: challenge.sends + 1,
      sentAt: Date.now()
    }),
    "EX",
    CODE_TTL
  );
};

/** Confere o código; certo, libera o navegador e devolve quem é. */
export const verifyDeviceCode = async (
  challengeId: string,
  code: unknown,
  deviceId: unknown,
  context: AccessContext
): Promise<number> => {
  const challenge = await loadChallenge(challengeId);
  const deviceHash = deviceHashOf(deviceId);
  const given = sha(`${challengeId}:${String(code || "").replace(/\D/g, "")}`);

  if (
    deviceHash !== challenge.deviceHash ||
    !sameHash(given, challenge.codeHash)
  ) {
    const attempts = challenge.attempts + 1;
    if (attempts >= MAX_ATTEMPTS) {
      await cacheLayer.del(challengeKey(challengeId));
      throw new AppError("ERR_CODE_EXPIRED", 400);
    }
    await cacheLayer.set(
      challengeKey(challengeId),
      JSON.stringify({ ...challenge, attempts }),
      "KEEPTTL"
    );
    throw new AppError("ERR_CODE_INVALID", 400);
  }

  await cacheLayer.del(challengeKey(challengeId));
  await trustDevice(challenge.userId, deviceHash, context);
  return challenge.userId;
};

/** Esqueci minha senha: manda o link (sem contar se o e-mail existe). */
export const requestPasswordReset = async (
  email: unknown,
  context: AccessContext
): Promise<void> => {
  if (!automationEnabled()) throw new AppError("ERR_EMAIL_DISABLED", 503);
  const address = String(email || "")
    .trim()
    .toLowerCase();
  if (!address) return;

  const user = await User.findOne({
    where: Sequelize.where(
      Sequelize.fn("LOWER", Sequelize.col("email")),
      address
    )
  });
  if (!user || user.active === false) return;

  const token = crypto.randomBytes(32).toString("base64url");
  await cacheLayer.set(resetKey(sha(token)), String(user.id), "EX", RESET_TTL);
  await sendPasswordResetEmail(
    user,
    `${appUrl()}/reset-password?token=${token}`,
    context
  );
};

export const resetPassword = async (
  token: unknown,
  password: unknown,
  context: AccessContext
): Promise<void> => {
  const value = String(password || "");
  if (value.length < 6) throw new AppError("ERR_PASSWORD_TOO_SHORT", 400);

  const key = resetKey(sha(String(token || "")));
  const userId = await cacheLayer.get(key);
  if (!userId) throw new AppError("ERR_RESET_LINK_EXPIRED", 400);
  const user = await User.findByPk(Number(userId));
  if (!user) throw new AppError("ERR_RESET_LINK_EXPIRED", 400);

  await cacheLayer.del(key);
  // tokenVersion novo: quem estava logado em outro aparelho sai
  await user.update({
    password: value,
    tokenVersion: (user.tokenVersion || 0) + 1
  });
  sendPasswordChangedEmail(user, context);
};
