import { QueryTypes } from "sequelize";

import sequelize from "../../database";
import { cacheLayer } from "../../libs/cache";
import CompaniesStorageService from "../CompanyService/CompaniesStorageService";

/**
 * Uso de cada empresa (cliente) da plataforma: usuários, conexões,
 * atendimentos, mensagens e disco — mais a atividade dos últimos 14 dias.
 * Contas agregadas direto no banco, guardadas 15 s.
 */
type Row = Record<string, any>;

const CACHE_SECONDS = 15;

const byCompany = (rows: Row[]) => {
  const map: Record<number, Row> = {};
  rows.forEach(row => {
    map[Number(row.companyId)] = row;
  });
  return map;
};

const select = (sql: string, replacements: Record<string, any> = {}) =>
  sequelize.query<Row>(sql, { type: QueryTypes.SELECT, replacements });

const PlatformOverviewService = async (companyId?: number) => {
  const cacheKey = `super:overview:${companyId || "all"}`;
  const cached = await cacheLayer.get(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (error) {
      // recalcula
    }
  }

  const [companies, users, online, whatsapps, tickets, messages, contacts] =
    await Promise.all([
      select(`SELECT c.id, c.name, c.email, c.status, c."dueDate", c."createdAt",
                     p.name AS "planName", p.users AS "planUsers",
                     p.connections AS "planConnections"
                FROM "Companies" c
                LEFT JOIN "Plans" p ON p.id = c."planId"
               ORDER BY c.id`),
      select(`SELECT "companyId", COUNT(*) AS total,
                     COUNT(*) FILTER (WHERE profile = 'admin') AS admins,
                     COUNT(*) FILTER (WHERE active = false) AS inactive
                FROM "Users" GROUP BY "companyId"`),
      select(`SELECT u."companyId", COUNT(DISTINCT u.id) AS online
                FROM "UserSocketSessions" s
                JOIN "Users" u ON u.id = s."userId"
               WHERE s.active = true
               GROUP BY u."companyId"`),
      select(`SELECT "companyId", COUNT(*) AS total,
                     COUNT(*) FILTER (WHERE status = 'CONNECTED') AS connected
                FROM "Whatsapps" GROUP BY "companyId"`),
      select(`SELECT "companyId",
                     COUNT(*) FILTER (WHERE status = 'open') AS open,
                     COUNT(*) FILTER (WHERE status = 'pending') AS pending,
                     COUNT(*) FILTER (WHERE "createdAt" >= now() - interval '30 days') AS "last30",
                     MAX("updatedAt") AS "lastActivity"
                FROM "Tickets" GROUP BY "companyId"`),
      select(`SELECT "companyId",
                     COUNT(*) FILTER (WHERE "createdAt" >= date_trunc('day', now())) AS today,
                     COUNT(*) AS "last30"
                FROM "Messages"
               WHERE "createdAt" >= now() - interval '30 days'
               GROUP BY "companyId"`),
      select(
        `SELECT "companyId", COUNT(*) AS total FROM "Contacts" GROUP BY "companyId"`
      )
    ]);

  const activity = await select(
    `SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS day,
            COUNT(*) FILTER (WHERE "fromMe" = true) AS sent,
            COUNT(*) FILTER (WHERE "fromMe" = false) AS received
       FROM "Messages"
      WHERE "createdAt" >= date_trunc('day', now()) - interval '13 days'
        ${companyId ? 'AND "companyId" = :companyId' : ""}
      GROUP BY 1 ORDER BY 1`,
    { companyId }
  );

  const storage = await CompaniesStorageService();
  const u = byCompany(users);
  const o = byCompany(online);
  const w = byCompany(whatsapps);
  const t = byCompany(tickets);
  const m = byCompany(messages);
  const c = byCompany(contacts);

  const list = companies.map(company => {
    const id = Number(company.id);
    return {
      id,
      name: company.name,
      email: company.email,
      status: company.status,
      dueDate: company.dueDate,
      createdAt: company.createdAt,
      plan: company.planName
        ? {
            name: company.planName,
            users: Number(company.planUsers || 0),
            connections: Number(company.planConnections || 0)
          }
        : null,
      users: Number(u[id]?.total || 0),
      admins: Number(u[id]?.admins || 0),
      inactiveUsers: Number(u[id]?.inactive || 0),
      online: Number(o[id]?.online || 0),
      connections: Number(w[id]?.total || 0),
      connected: Number(w[id]?.connected || 0),
      ticketsOpen: Number(t[id]?.open || 0),
      ticketsPending: Number(t[id]?.pending || 0),
      tickets30d: Number(t[id]?.last30 || 0),
      lastActivity: t[id]?.lastActivity || null,
      messagesToday: Number(m[id]?.today || 0),
      messages30d: Number(m[id]?.last30 || 0),
      contacts: Number(c[id]?.total || 0),
      storage: Number(storage[id] || 0)
    };
  });

  const sum = (key: string) =>
    list.reduce((acc, item) => acc + Number((item as Row)[key] || 0), 0);

  // os 14 dias completos, mesmo os sem mensagem
  const days: { day: string; sent: number; received: number }[] = [];
  const found: Record<string, Row> = {};
  activity.forEach(row => {
    found[row.day] = row;
  });
  for (let i = 13; i >= 0; i -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    days.push({
      day: key,
      sent: Number(found[key]?.sent || 0),
      received: Number(found[key]?.received || 0)
    });
  }

  const result = {
    totals: {
      companies: list.length,
      activeCompanies: list.filter(item => item.status !== false).length,
      users: sum("users"),
      online: sum("online"),
      connections: sum("connections"),
      connected: sum("connected"),
      ticketsOpen: sum("ticketsOpen"),
      ticketsPending: sum("ticketsPending"),
      messagesToday: sum("messagesToday"),
      messages30d: sum("messages30d"),
      contacts: sum("contacts"),
      storage: sum("storage")
    },
    companies: list,
    activity: days
  };

  await cacheLayer.set(cacheKey, JSON.stringify(result), "EX", CACHE_SECONDS);
  return result;
};

export default PlatformOverviewService;
