import { Request, Response } from "express";
import { QueryTypes } from "sequelize";

import sequelize from "../database";
import User from "../models/User";
import SystemMetricsService from "../services/SuperServices/SystemMetricsService";
import PlatformOverviewService, {
  PlatformRevenueService
} from "../services/SuperServices/PlatformOverviewService";

/** Painel do super admin (rotas protegidas por isSuper). */
export const system = async (req: Request, res: Response): Promise<Response> =>
  res.json(await SystemMetricsService());

export const overview = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const companyId = Number(req.query.companyId) || undefined;
  return res.json(await PlatformOverviewService(companyId));
};

/** Recebimentos: quando cada cliente paga de novo. */
export const revenue = async (req: Request, res: Response): Promise<Response> =>
  res.json(await PlatformRevenueService());

export const companyUsers = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const companyId = Number(req.params.companyId);

  const users = await User.findAll({
    where: { companyId },
    attributes: [
      "id",
      "name",
      "email",
      "profile",
      "profileImage",
      "active",
      "super",
      "createdAt"
    ],
    order: [
      ["profile", "ASC"],
      ["name", "ASC"]
    ]
  });

  const stats = await sequelize.query<Record<string, any>>(
    `SELECT u.id,
            EXISTS (SELECT 1 FROM "UserSocketSessions" s
                     WHERE s."userId" = u.id AND s.active = true) AS online,
            (SELECT COUNT(*) FROM "Tickets" t
              WHERE t."userId" = u.id AND t.status = 'open') AS open,
            (SELECT COUNT(*) FROM "Messages" m
              JOIN "Tickets" t ON t.id = m."ticketId"
             WHERE t."userId" = u.id AND m."fromMe" = true
               AND m."createdAt" >= now() - interval '30 days') AS sent30d
       FROM "Users" u WHERE u."companyId" = :companyId`,
    { type: QueryTypes.SELECT, replacements: { companyId } }
  );
  const byId: Record<number, Record<string, any>> = {};
  stats.forEach(row => {
    byId[Number(row.id)] = row;
  });

  return res.json(
    users.map(user => ({
      ...user.toJSON(),
      online: !!byId[user.id]?.online,
      ticketsOpen: Number(byId[user.id]?.open || 0),
      sent30d: Number(byId[user.id]?.sent30d || 0)
    }))
  );
};
