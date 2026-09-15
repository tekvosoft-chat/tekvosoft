import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { getIO } from "../libs/socket";

import AppError from "../errors/AppError";

import CreateUserService from "../services/UserServices/CreateUserService";
import ListUsersService from "../services/UserServices/ListUsersService";
import UpdateUserService from "../services/UserServices/UpdateUserService";
import ShowUserService from "../services/UserServices/ShowUserService";
import DeleteUserService from "../services/UserServices/DeleteUserService";
import SimpleListService from "../services/UserServices/SimpleListService";
import User from "../models/User";
import saveMediaToFile from "../helpers/saveMediaFile";

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as IndexQuery;
  const { companyId, profile } = req.user;

  const { users, count, hasMore } = await ListUsersService({
    searchParam,
    pageNumber,
    companyId,
    profile
  });

  return res.json({ users, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const {
    email,
    password,
    name,
    profile,
    companyId: bodyCompanyId,
    queueIds
  } = req.body;
  let userCompanyId: number | null = null;

  let requestUser: User = null;

  if (req.user !== undefined) {
    const { companyId: cId } = req.user;
    userCompanyId = cId;
    requestUser = await User.findByPk(req.user.id);
  }

  const newUserCompanyId = bodyCompanyId || userCompanyId;

  if (req.user?.profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  } else if (newUserCompanyId !== req.user?.companyId && !requestUser?.super) {
    throw new AppError("ERR_NO_SUPER", 403);
  }

  const user = await CreateUserService({
    email,
    password,
    name,
    profile,
    companyId: newUserCompanyId,
    queueIds
  });

  const io = getIO();
  io.emit(`company-${userCompanyId}-user`, {
    action: "create",
    user
  });

  return res.status(200).json(user);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { userId } = req.params;

  const user = await ShowUserService(userId, req.user.id);

  return res.status(200).json(user);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id: requestUserId, companyId } = req.user;
  const { userId } = req.params;
  const userData = req.body;

  const user = await UpdateUserService({
    userData,
    userId,
    requestUserId: +requestUserId
  });

  const io = getIO();
  io.emit(`company-${companyId}-user`, {
    action: "update",
    user
  });

  return res.status(200).json(user);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { userId } = req.params;
  const { companyId } = req.user;

  if (req.user.profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  if (Number(userId) === 1) {
    throw new AppError("ERR_FORBIDDEN", 403);
  }

  await DeleteUserService(userId, req.user.id);

  const io = getIO();
  io.emit(`company-${companyId}-user`, {
    action: "delete",
    userId
  });

  return res.status(200).json({ message: "User deleted" });
};

export const list = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.query;
  const { companyId: userCompanyId } = req.user;

  if (!req.user.isSuper && companyId && +companyId !== userCompanyId) {
    throw new AppError("ERR_FORBIDDEN", 403);
  }

  const users = await SimpleListService({
    companyId: companyId ? +companyId : userCompanyId
  });

  return res.status(200).json(users);
};

/**
 * Foto de perfil do usuário. Cada pessoa troca a sua; o administrador pode
 * trocar a de qualquer um da empresa. O arquivo vai para a pasta pública, em
 * media-persistant, e o banco guarda só o caminho.
 */
export const updateProfileImage = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id: requestUserId, companyId, profile } = req.user;
  const { userId } = req.params;
  const file = req.file as Express.Multer.File;

  const user = await User.findByPk(userId);

  if (!user || user.companyId !== companyId) {
    throw new AppError("ERR_NO_USER_FOUND", 404);
  }

  if (profile !== "admin" && +requestUserId !== user.id) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  if (req.method === "DELETE") {
    await user.update({ profileImage: null });
  } else {
    if (!file) {
      throw new AppError("ERR_NO_FILE_UPLOADED", 400);
    }
    if (!/^image\//.test(file.mimetype)) {
      throw new AppError("ERR_INVALID_FILE_TYPE", 400);
    }

    const savedPath = await saveMediaToFile(
      {
        data: fs.readFileSync(file.path),
        mimetype: file.mimetype,
        filename: `perfil-${user.id}${path.extname(file.originalname) || ".jpg"}`
      },
      {
        destination: companyId,
        persistant: true,
        baseFolder: "media-persistant"
      }
    );
    fs.unlinkSync(file.path);

    await user.update({ profileImage: savedPath });
  }

  await user.reload({ attributes: ["id", "name", "profileImage"] });

  const io = getIO();
  io.emit(`company-${companyId}-user`, { action: "update", user });

  return res.status(200).json({ profileImage: user.profileImage });
};
