import { Request, Response } from "express";

import CreateService from "../services/QueueOptionService/CreateService";
import ListService from "../services/QueueOptionService/ListService";
import UpdateService from "../services/QueueOptionService/UpdateService";
import ShowService from "../services/QueueOptionService/ShowService";
import DeleteService from "../services/QueueOptionService/DeleteService";

import { head } from "lodash";
import fs from "fs";
import path from "path";
import AppError from "../errors/AppError";
import QueueOption from "../models/QueueOption";
import saveMediaToFile from "../helpers/saveMediaFile";
import EnsureSameCompany from "../helpers/EnsureSameCompany";
import Queue from "../models/Queue";

type FilterList = {
  queueId: string;
  queueOptionId: string;
  parentId: string;
};

// SEGURANÇA: opções de fila por id — confere se a fila é da empresa
const ensureQueueCompany = async (
  queueId: number | string,
  companyId: number
): Promise<void> => {
  EnsureSameCompany(queueId ? await Queue.findByPk(queueId) : null, companyId);
};

const ensureOptionCompany = async (
  queueOptionId: number | string,
  companyId: number
): Promise<void> => {
  const option = queueOptionId
    ? await QueueOption.findOne(
        QueueOption.withTopParentQueue({ where: { id: queueOptionId } })
      )
    : null;
  EnsureSameCompany(option?.topParentQueue, companyId);
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { queueId, queueOptionId, parentId } = req.query as FilterList;

  // Convert the strings to numbers
  const convertedQueueId: number = parseInt(queueId, 10);
  const convertedQueueOptionId = parseInt(queueOptionId, 10);
  const convertedParentId = parseInt(parentId, 10);

  const { companyId } = req.user;
  if (convertedQueueId) await ensureQueueCompany(convertedQueueId, companyId);
  if (convertedQueueOptionId) {
    await ensureOptionCompany(convertedQueueOptionId, companyId);
  }
  if (convertedParentId)
    await ensureOptionCompany(convertedParentId, companyId);

  const queueOptions = await ListService({
    queueId: convertedQueueId,
    queueOptionId: convertedQueueOptionId,
    parentId: convertedParentId
  });

  return res.json(queueOptions);
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const queueOptionData = req.body;
  const { companyId } = req.user;

  if (queueOptionData.parentId) {
    await ensureOptionCompany(queueOptionData.parentId, companyId);
  } else {
    await ensureQueueCompany(queueOptionData.queueId, companyId);
  }

  const queueOption = await CreateService(queueOptionData);

  return res.status(200).json(queueOption);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { queueOptionId } = req.params;

  await ensureOptionCompany(queueOptionId, req.user.companyId);
  const queueOption = await ShowService(queueOptionId);

  return res.status(200).json(queueOption);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { queueOptionId } = req.params;
  const queueOptionData = req.body;

  await ensureOptionCompany(queueOptionId, req.user.companyId);
  // não deixa "mover" a opção para a fila de outra empresa
  delete queueOptionData.queueId;
  delete queueOptionData.parentId;

  const queueOption = await UpdateService(queueOptionId, queueOptionData);

  return res.status(200).json(queueOption);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { queueOptionId } = req.params;

  await ensureOptionCompany(queueOptionId, req.user.companyId);
  await DeleteService(queueOptionId);

  return res.status(200).json({ message: "Option Delected" });
};

export const mediaUpload = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { queueOptionId } = req.params;
  const files = req.files as Express.Multer.File[];
  const file = head(files);

  await ensureOptionCompany(queueOptionId, req.user.companyId);

  try {
    const queueOption = await QueueOption.findOne(
      QueueOption.withTopParentQueue({
        where: { id: queueOptionId }
      })
    );

    const savedFilePath = await saveMediaToFile(
      {
        data: fs.readFileSync(file.path),
        mimetype: file.mimetype,
        filename: file.originalname
      },
      {
        destination: queueOption.topParentQueue.companyId
      }
    );

    fs.unlinkSync(file.path);

    queueOption.update({
      mediaPath: savedFilePath,
      mediaName: file.originalname
    });

    return res.send({ mensagem: "Arquivo Salvo" });
  } catch (err) {
    throw new AppError(err.message);
  }
};

export const deleteMedia = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { queueOptionId } = req.params;

  await ensureOptionCompany(queueOptionId, req.user.companyId);

  try {
    const queue = await QueueOption.findByPk(queueOptionId);
    const filePath = path.resolve("public", queue.mediaPath);
    const fileExists = fs.existsSync(filePath);
    if (fileExists) {
      fs.unlinkSync(filePath);
    }

    queue.mediaPath = null;
    queue.mediaName = null;
    await queue.save();
    return res.send({ mensagem: "Arquivo excluído" });
  } catch (err) {
    throw new AppError(err.message);
  }
};
