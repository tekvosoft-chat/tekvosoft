import { Request, Response } from "express";
import AppError from "../errors/AppError";
import { getIO } from "../libs/socket";

import AuthUserService, {
  CreateSessionForUser
} from "../services/UserServices/AuthUserService";
import {
  deviceCheckEnabled,
  isTrustedDevice,
  requestPasswordReset,
  resendDeviceCode,
  resetPassword,
  startDeviceChallenge,
  verifyDeviceCode
} from "../services/AuthServices/AccessService";
import { accessContext } from "../helpers/accessContext";
import { SendRefreshToken } from "../helpers/SendRefreshToken";
import { RefreshTokenService } from "../services/AuthServices/RefreshTokenService";
import FindUserFromToken from "../services/AuthServices/FindUserFromToken";
import User from "../models/User";
import { SerializeUser } from "../helpers/SerializeUser";
import { createAccessToken, createRefreshToken } from "../helpers/CreateTokens";
import Company from "../models/Company";
import Setting from "../models/Setting";
import Translation from "../models/Translation";
import { decodeRefreshToken } from "../helpers/DecodeRefreshToken";

type LoginResult = Awaited<ReturnType<typeof AuthUserService>>;

// entrega a sessão: cookie de renovação, aviso às outras abas e o token
const finishLogin = (res: Response, result: LoginResult): Response => {
  const { token, serializedUser, refreshToken } = result;

  SendRefreshToken(res, refreshToken);

  const io = getIO();
  io.to(`user-${serializedUser.id}`).emit(
    `company-${serializedUser.companyId}-auth`,
    {
      action: "update",
      user: {
        id: serializedUser.id,
        email: serializedUser.email,
        companyId: serializedUser.companyId
      }
    }
  );

  return res.status(200).json({
    token,
    user: serializedUser
  });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { email, password, deviceId } = req.body;

  const langs = await Translation.findAll({
    attributes: ["language"],
    group: ["language"]
  });

  const availableLanguages = langs.map(l => l.language.replace(/_/g, "-"));

  const language = (req.acceptsLanguages(availableLanguages) || null)?.replace(
    /-/g,
    "_"
  );

  const result = await AuthUserService({
    email,
    password,
    language
  });

  // senha certa num navegador que a pessoa ainda não liberou: código no
  // e-mail antes de entregar a sessão
  const userId = result.serializedUser.id;
  if (deviceCheckEnabled() && !(await isTrustedDevice(userId, deviceId))) {
    const user = await User.findByPk(userId);
    const challenge = await startDeviceChallenge(
      user,
      deviceId,
      accessContext(req)
    );
    return res.status(200).json({ requiresCode: true, ...challenge });
  }

  return finishLogin(res, result);
};

/** Código do e-mail certo: libera o navegador e entrega a sessão. */
export const verifyDevice = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { challengeId, code, deviceId } = req.body || {};
  const userId = await verifyDeviceCode(
    challengeId,
    code,
    deviceId,
    accessContext(req)
  );
  return finishLogin(res, await CreateSessionForUser(userId));
};

export const resendDevice = async (
  req: Request,
  res: Response
): Promise<Response> => {
  await resendDeviceCode(
    String(req.body?.challengeId || ""),
    accessContext(req)
  );
  return res.json({ ok: true });
};

/** Esqueci minha senha: responde igual exista ou não o e-mail. */
export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<Response> => {
  await requestPasswordReset(req.body?.email, accessContext(req));
  return res.json({ ok: true });
};

export const resetPasswordWithToken = async (
  req: Request,
  res: Response
): Promise<Response> => {
  await resetPassword(req.body?.token, req.body?.password, accessContext(req));
  return res.json({ ok: true });
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const token: string = req.cookies.jrt;

  if (!token) {
    throw new AppError("ERR_UNAUTHORIZED", 401);
  }

  const { user, newToken, refreshToken } = await RefreshTokenService(
    res,
    token
  );

  SendRefreshToken(res, refreshToken);

  return res.json({ token: newToken, user });
};

export const me = async (req: Request, res: Response): Promise<Response> => {
  const token: string = req.cookies.jrt;
  const user = await FindUserFromToken(token);
  const { id, profile, email, super: superAdmin } = user;

  if (!token) {
    throw new AppError("ERR_UNAUTHORIZED", 401);
  }

  return res.json({ id, profile, email, super: superAdmin });
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  res.clearCookie("jrt");

  return res.send();
};

export const impersonate = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const token: string = req.cookies.jrt;
  const { companyId } = req.params;

  if (!token) {
    throw new AppError("ERR_UNAUTHORIZED", 401);
  }

  const currentRefreshTokenData = decodeRefreshToken(token);

  if (currentRefreshTokenData.impersonated) {
    throw new AppError("ERR_ALREADY_IMPERSONATING", 400);
  }

  const user = await User.findOne({
    where: { companyId: Number(companyId), profile: "admin" },
    include: ["queues", { model: Company, include: [{ model: Setting }] }]
  });

  if (!user) {
    throw new AppError("ERR_NO_USER_FOUND", 404);
  }

  const metadata = {
    originalUserId: Number(req.user.id),
    originalCompanyId: Number(req.user.companyId)
  };

  const newToken = createAccessToken(user, {
    impersonated: true,
    ...metadata
  });
  const refreshToken = createRefreshToken(user, {
    impersonated: true,
    ...metadata
  });
  const serializedUser = await SerializeUser(user);

  SendRefreshToken(res, refreshToken);

  const io = getIO();
  io.to(`user-${serializedUser.id}`).emit(
    `company-${serializedUser.companyId}-auth`,
    {
      action: "update",
      user: {
        id: serializedUser.id,
        email: serializedUser.email,
        companyId: serializedUser.companyId,
        impersonated: true
      }
    }
  );

  return res.status(200).json({
    token: newToken,
    user: serializedUser
  });
};

export const backToSuper = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const token: string = req.cookies.jrt;

  if (!token) {
    throw new AppError("ERR_UNAUTHORIZED", 401);
  }

  const refreshTokenData = decodeRefreshToken(token);

  if (!refreshTokenData.impersonated || !refreshTokenData.originalUserId) {
    throw new AppError("ERR_NOT_IMPERSONATING", 400);
  }

  const originalUser = await User.findByPk(refreshTokenData.originalUserId, {
    include: ["queues", { model: Company, include: [{ model: Setting }] }]
  });

  if (!originalUser || !originalUser.super) {
    throw new AppError("ERR_NO_USER_FOUND", 404);
  }

  const newToken = createAccessToken(originalUser);
  const newRefreshToken = createRefreshToken(originalUser);
  const serializedUser = await SerializeUser(originalUser);

  SendRefreshToken(res, newRefreshToken);

  return res.status(200).json({
    token: newToken,
    user: serializedUser
  });
};
