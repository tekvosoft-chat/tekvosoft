import { Op, fn, col, WhereOptions, literal, QueryTypes } from "sequelize";
import Ticket from "../../models/Ticket";
import Queue from "../../models/Queue";
import { GetCompanySetting } from "../../helpers/CheckSettings";
import User from "../../models/User";
import TicketTraking from "../../models/TicketTraking";
import sequelize from "../../database";
import {
  listCounterSerie,
  TicketCounterSeries
} from "../CounterServices/ListCounterSerie";

type TicketTrackingStatistics = {
  avgWaitTime: number;
  avgServiceTime: number;
  totalClosed: number;
  newContacts: number;
};

export type DashboardDateRange = {
  date_from?: string;
  date_to?: string;
  hour_from?: string;
  hour_to?: string;
  tz?: string;
};

type TicketsStatisticsData = {
  ticketCounters: {
    create: TicketCounterSeries;
    accept: TicketCounterSeries;
    transfer: TicketCounterSeries;
    close: TicketCounterSeries;
  };
  ticketStatistics: {
    avgWaitTime: number;
    avgServiceTime: number;
    totalClosed: number;
  };
};

type UserStatistics = {
  id: number;
  name: string;
  avgWaitTime: number;
  avgServiceTime: number;
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
  averageRating: number;
  online: boolean;
};

type UserReportData = {
  start: string;
  end: string;
  userReport: UserStatistics[];
};

export async function calculateTicketStatistics(
  companyId: number,
  start: Date,
  end: Date
): Promise<TicketTrackingStatistics> {
  const ticketStatistics = (await TicketTraking.findOne({
    attributes: [
      [fn("AVG", col("waitTime")), "avgWaitTime"],
      [fn("AVG", col("serviceTime")), "avgServiceTime"],
      [fn("COUNT", col("id")), "totalClosed"]
    ],
    where: {
      companyId,
      createdAt: {
        [Op.between]: [start, end]
      },
      finishedAt: {
        [Op.between]: [start, end]
      }
    },
    raw: true
  })) as unknown as TicketTrackingStatistics;

  // force to numbers
  ticketStatistics.avgWaitTime = Number(ticketStatistics.avgWaitTime) || null;
  ticketStatistics.avgServiceTime =
    Number(ticketStatistics.avgServiceTime) || null;
  ticketStatistics.totalClosed = Number(ticketStatistics.totalClosed) || null;

  const countContactsQuery = `
  SELECT COUNT(*) AS count FROM (SELECT FROM (
    SELECT 
        t.id AS "ticketId",
        t."contactId",
        c."createdAt"
    FROM 
        "TicketTraking" tt
    JOIN 
        "Tickets" t ON tt."ticketId" = t.id
    JOIN 
        "Contacts" c ON t."contactId" = c.id
    WHERE 
        (tt."createdAt" BETWEEN :startDate AND :endDate)
        AND (tt."companyId" = :companyId)
        AND (tt."finishedAt" BETWEEN :startDate AND :endDate)
        AND (c."createdAt" BETWEEN :startDate AND :endDate)
  ) counters_list GROUP BY "contactId") counters_totals
  `;

  const newContacts = (await sequelize.query(countContactsQuery, {
    replacements: {
      companyId,
      startDate: start,
      endDate: end
    },
    type: QueryTypes.SELECT
  })) as unknown as [{ count: number }];

  ticketStatistics.newContacts = Number(newContacts[0]?.count) || null;

  return ticketStatistics;
}

export async function ticketsStatusSummary(companyId: number) {
  const where: WhereOptions<Ticket> = {
    companyId,
    status: {
      [Op.or]: ["open", "pending"]
    }
  };

  const groupsEnabled =
    (await GetCompanySetting(companyId, "groupsTab", "disabled")) === "enabled";

  if (groupsEnabled) {
    where.isGroup = false;
  }

  const ticketsSummary = await Ticket.findAll({
    attributes: ["status", "queueId", [fn("COUNT", "*"), "count"]],
    where,
    include: [
      {
        model: Queue,
        attributes: ["id", "name", "color"],
        required: false
      }
    ],
    group: ["status", "queueId", "queue.id", "queue.name"]
  });

  return ticketsSummary;
}

export async function usersStatusSummary(companyId) {
  const usersSummary = await User.findAll({
    attributes: [
      "id",
      "name",
      [
        literal(`(
          SELECT COUNT(*)
          FROM "UserSocketSessions"
          WHERE "UserSocketSessions"."userId" = "User"."id"
            AND "UserSocketSessions"."active" = true
        ) > 0`),
        "online"
      ],
      [fn("COUNT", col("tickets.id")), "openTicketsCount"]
    ],
    where: {
      companyId
    },
    include: [
      {
        model: Ticket,
        as: "tickets",
        attributes: [],
        where: {
          status: "open"
        },
        required: false
      }
    ],
    group: ["User.id"]
  });

  return usersSummary;
}

export async function userReport(companyId: number, start: Date, end: Date) {
  const result = await User.findAll({
    attributes: [
      "id",
      "name",
      "profileImage",
      [fn("AVG", col("tickets.ticketTrakings.waitTime")), "avgWaitTime"],
      [fn("AVG", col("tickets.ticketTrakings.serviceTime")), "avgServiceTime"],
      [fn("COUNT", col("tickets.id")), "totalTickets"],
      [
        literal(`(
          SELECT COUNT(*)
          FROM "TicketTraking" AS tt
          JOIN "Tickets" AS t ON tt."ticketId" = t.id
          WHERE t."userId" = "User"."id"
            AND tt."startedAt" < :endDate
            AND (tt."finishedAt" > :endDate OR tt."finishedAt" IS NULL)
        )`),
        "openTickets"
      ],
      [
        literal(`(
          SELECT COUNT(*)
          FROM "TicketTraking" AS tt
          JOIN "Tickets" AS t ON tt."ticketId" = t.id
          WHERE t."userId" = "User"."id"
            AND tt."finishedAt" BETWEEN :startDate AND :endDate
        )`),
        "closedTickets"
      ],
      [
        literal(`(
          SELECT AVG("rate")
          FROM "UserRatings"
          WHERE "UserRatings"."userId" = "User"."id"
            AND "UserRatings"."createdAt" BETWEEN :startDate AND :endDate
        )`),
        "averageRating"
      ],
      [
        literal(`(
          SELECT COUNT(*)>0
          FROM "UserSocketSessions"
          WHERE "UserSocketSessions"."userId" = "User"."id"
            AND "UserSocketSessions"."active" = true
        )`),
        "online"
      ]
    ],
    where: {
      companyId
    },
    include: [
      {
        model: Ticket,
        as: "tickets",
        attributes: [],
        required: false,
        include: [
          {
            model: TicketTraking,
            as: "ticketTrakings",
            attributes: [],
            where: {
              [Op.or]: [
                {
                  startedAt: { [Op.between]: [start, end] }
                },
                {
                  finishedAt: { [Op.between]: [start, end] }
                },
                {
                  startedAt: { [Op.lt]: end },
                  finishedAt: { [Op.gt]: end }
                },
                {
                  startedAt: { [Op.lt]: end },
                  finishedAt: null
                }
              ]
            }
          }
        ]
      }
    ],
    replacements: {
      startDate: start,
      endDate: end
    },
    group: ["User.id"]
  });

  return result as unknown[] as UserStatistics[];
}

export async function statusSummaryService(companyId: number) {
  return {
    ticketsStatusSummary: await ticketsStatusSummary(companyId),
    usersStatusSummary: await usersStatusSummary(companyId)
  };
}

export async function ticketsStatisticsService(
  companyId: number,
  params: DashboardDateRange
): Promise<TicketsStatisticsData> {
  let start: Date;
  let end = new Date();
  const tz = params.tz || "Z";

  if (params.date_from && params.date_to) {
    start = new Date(
      `${params.date_from}T${params?.hour_from || "00:00:00"}${tz}`
    );
    end = new Date(`${params.date_to}T${params?.hour_to || "23:59:59"}${tz}`);
  } else {
    throw new Error("Invalid date range");
  }

  return {
    ticketCounters: {
      create: await listCounterSerie(companyId, "ticket-create", start, end),
      accept: await listCounterSerie(companyId, "ticket-accept", start, end),
      transfer: await listCounterSerie(
        companyId,
        "ticket-transfer",
        start,
        end
      ),
      close: await listCounterSerie(companyId, "ticket-close", start, end)
    },
    ticketStatistics: await calculateTicketStatistics(companyId, start, end)
  };
}

export async function usersReportService(
  companyId: number,
  params: DashboardDateRange
): Promise<UserReportData> {
  let start: Date;
  let end = new Date();
  const tz = params.tz || "Z";

  if (params.date_from && params.date_to) {
    start = new Date(`${params.date_from}T00:00:00${tz}`);
    end = new Date(`${params.date_to}T23:59:59${tz}`);
  } else {
    throw new Error("Invalid date range");
  }

  return {
    start: params.date_from,
    end: params.date_to,
    userReport: await userReport(companyId, start, end)
  };
}

/**
 * Indicadores extras do painel do admin, no período escolhido:
 * volume de mensagens, horários de pico, atendimentos por fila, avaliações,
 * base de contatos, conexões e agendamentos pendentes.
 */
export async function insightsService(
  companyId: number,
  params: DashboardDateRange
) {
  const tz = params.tz || "Z";
  if (!params.date_from || !params.date_to) {
    throw new Error("Invalid date range");
  }
  const start = new Date(`${params.date_from}T00:00:00${tz}`);
  const end = new Date(`${params.date_to}T23:59:59${tz}`);
  const replacements = { companyId, start, end };
  const q = <T extends object>(sql: string): Promise<T[]> =>
    sequelize.query<T>(sql, { replacements, type: QueryTypes.SELECT });

  const [messages] = await q<{ received: string; sent: string }>(`
    SELECT
      COUNT(*) FILTER (WHERE NOT "fromMe") AS received,
      COUNT(*) FILTER (WHERE "fromMe") AS sent
    FROM "Messages"
    WHERE "companyId" = :companyId
      AND "createdAt" BETWEEN :start AND :end
      AND COALESCE("mediaType", '') <> 'reactionMessage'
  `);

  const hours = await q<{ hour: number; count: string }>(`
    SELECT EXTRACT(HOUR FROM "createdAt" AT TIME ZONE 'America/Sao_Paulo')::int AS hour,
           COUNT(*) AS count
    FROM "Messages"
    WHERE "companyId" = :companyId
      AND "createdAt" BETWEEN :start AND :end
      AND NOT "fromMe"
    GROUP BY 1
  `);

  const byQueue = await q<{
    name: string;
    color: string;
    count: string;
  }>(`
    SELECT COALESCE(q."name", '') AS name, COALESCE(q."color", '') AS color,
           COUNT(*) AS count
    FROM "Tickets" t
    LEFT JOIN "Queues" q ON q."id" = t."queueId"
    WHERE t."companyId" = :companyId
      AND t."createdAt" BETWEEN :start AND :end
    GROUP BY q."name", q."color"
    ORDER BY count DESC
    LIMIT 8
  `);

  const [rating] = await q<{ avg: string; count: string }>(`
    SELECT AVG("rate") AS avg, COUNT(*) AS count
    FROM "UserRatings"
    WHERE "companyId" = :companyId
      AND "createdAt" BETWEEN :start AND :end
  `);

  const [base] = await q<{
    contacts: string;
    connections: string;
    connected: string;
    schedules: string;
  }>(`
    SELECT
      (SELECT COUNT(*) FROM "Contacts" WHERE "companyId" = :companyId AND NOT "isGroup") AS contacts,
      (SELECT COUNT(*) FROM "Whatsapps" WHERE "companyId" = :companyId) AS connections,
      (SELECT COUNT(*) FROM "Whatsapps" WHERE "companyId" = :companyId AND "status" = 'CONNECTED') AS connected,
      (SELECT COUNT(*) FROM "Schedules" WHERE "companyId" = :companyId AND "sentAt" IS NULL AND "sendAt" >= NOW()) AS schedules
  `);

  const peak = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: Number(hours.find(h => Number(h.hour) === hour)?.count || 0)
  }));

  return {
    messagesReceived: Number(messages?.received || 0),
    messagesSent: Number(messages?.sent || 0),
    peakHours: peak,
    ticketsByQueue: byQueue.map(item => ({
      name: item.name,
      color: item.color,
      count: Number(item.count)
    })),
    ratingAverage: rating?.avg ? Number(Number(rating.avg).toFixed(1)) : null,
    ratingCount: Number(rating?.count || 0),
    contactsTotal: Number(base?.contacts || 0),
    connectionsTotal: Number(base?.connections || 0),
    connectionsOnline: Number(base?.connected || 0),
    schedulesPending: Number(base?.schedules || 0)
  };
}
