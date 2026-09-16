import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { getPublicPath } from "../helpers/GetPublicPath";
import { getIO } from "../libs/socket";

import AppError from "../errors/AppError";

import CreateService from "../services/ScheduleServices/CreateService";
import ListService from "../services/ScheduleServices/ListService";
import UpdateService from "../services/ScheduleServices/UpdateService";
import ShowService from "../services/ScheduleServices/ShowService";
import DeleteService from "../services/ScheduleServices/DeleteService";

type IndexQuery = {
  searchParam?: string;
  contactId?: number | string;
  userId?: number | string;
  pageNumber?: string | number;
  startDate?: string;
  endDate?: string;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { contactId, userId, pageNumber, searchParam, startDate, endDate } =
    req.query as IndexQuery;
  const { companyId } = req.user;

  const { schedules, count, hasMore } = await ListService({
    searchParam,
    contactId,
    userId,
    pageNumber,
    companyId,
    startDate,
    endDate
  });

  return res.json({ schedules, count, hasMore });
};

/**
 * Imagem ou arquivo do agendamento: o multer grava em public/ com nome
 * provisório; aqui ele vai para media/<empresa>/schedules/ com um nome único.
 */
const moveScheduleMedia = (
  file: Express.Multer.File | undefined,
  companyId: number
): { mediaPath: string; mediaName: string } | null => {
  if (!file) return null;
  const folder = path.join("media", String(companyId), "schedules");
  const absoluteFolder = path.join(getPublicPath(), folder);
  fs.mkdirSync(absoluteFolder, { recursive: true });
  const safeName = `${Date.now()}-${file.originalname.replace(/[^\w.-]+/g, "_")}`;
  fs.renameSync(file.path, path.join(absoluteFolder, safeName));
  return {
    mediaPath: path.join(folder, safeName).split(path.sep).join("/"),
    mediaName: file.originalname
  };
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { body, sendAt, contactId, saveMessage } = req.body;
  const { companyId } = req.user;
  const userId = Number(req.user.id);
  const media = moveScheduleMedia(req.file, companyId);

  const schedule = await CreateService({
    body,
    sendAt,
    contactId,
    companyId,
    userId,
    saveMessage: saveMessage === true || saveMessage === "true",
    ...(media || {})
  });

  const io = getIO();
  io.to(`company-${companyId}-mainchannel`).emit(
    `company-${companyId}-schedule`,
    {
      action: "create",
      schedule
    }
  );

  return res.status(200).json(schedule);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { scheduleId } = req.params;
  const { companyId } = req.user;

  const schedule = await ShowService(scheduleId, companyId);

  return res.status(200).json(schedule);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  if (req.user.profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const { scheduleId } = req.params;
  const scheduleData = { ...req.body };
  const { companyId } = req.user;
  const media = moveScheduleMedia(req.file, companyId);
  if (media) {
    Object.assign(scheduleData, media);
  } else if (req.body.removeMedia === "true") {
    scheduleData.mediaPath = null;
    scheduleData.mediaName = null;
  }

  const schedule = await UpdateService({
    scheduleData,
    id: scheduleId,
    companyId
  });

  const io = getIO();
  io.to(`company-${companyId}-mainchannel`).emit(
    `company-${companyId}-schedule`,
    {
      action: "update",
      schedule
    }
  );

  return res.status(200).json(schedule);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { scheduleId } = req.params;
  const { companyId } = req.user;

  await DeleteService(scheduleId, companyId);

  const io = getIO();
  io.emit("schedule", {
    action: "delete",
    scheduleId
  });

  return res.status(200).json({ message: "Schedule deleted" });
};
