import { Request, Response } from "express";
import AppError from "../errors/AppError";
import { getIO } from "../libs/socket";
import Company from "../models/Company";
import User from "../models/User";

/** Tela de perfil: cada pessoa vê e edita só o próprio perfil. */
const load = (id: number) =>
  User.findByPk(id, {
    attributes: [
      "id",
      "name",
      "email",
      "profile",
      "profileImage",
      "bio",
      "statusText",
      "createdAt",
      "companyId"
    ],
    include: [{ model: Company, as: "company", attributes: ["id", "name"] }]
  });

export const show = async (req: Request, res: Response): Promise<Response> => {
  const user = await load(Number(req.user.id));
  if (!user) throw new AppError("ERR_NOT_FOUND", 404);
  return res.json(user);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const user = await User.findByPk(Number(req.user.id));
  if (!user) throw new AppError("ERR_NOT_FOUND", 404);
  const body = req.body || {};
  await user.update({
    ...(body.bio !== undefined
      ? {
          bio:
            String(body.bio || "")
              .trim()
              .slice(0, 600) || null
        }
      : {}),
    ...(body.statusText !== undefined
      ? {
          statusText:
            String(body.statusText || "")
              .trim()
              .slice(0, 80) || null
        }
      : {})
  });
  // barra lateral e lista de usuários mostram o status na hora
  getIO()
    .to(`company-${user.companyId}-mainchannel`)
    .emit(`company-${user.companyId}-user`, {
      action: "update",
      user: { id: user.id, statusText: user.statusText }
    });
  return res.json(await load(user.id));
};
