import { Op, Sequelize } from "sequelize";
import Contact from "../../models/Contact";
import Schedule from "../../models/Schedule";
import User from "../../models/User";

interface Request {
  searchParam?: string;
  contactId?: number | string;
  userId?: number | string;
  companyId?: number;
  pageNumber?: string | number;
  // calendário: agendamentos com envio dentro do intervalo (ISO)
  startDate?: string;
  endDate?: string;
}

interface Response {
  schedules: Schedule[];
  count: number;
  hasMore: boolean;
}

const ListService = async ({
  searchParam,
  contactId = "",
  userId = "",
  pageNumber = "1",
  companyId,
  startDate,
  endDate
}: Request): Promise<Response> => {
  let whereCondition = {};
  const byRange = !!(startDate && endDate);
  // no calendário o mês inteiro vem de uma vez
  const limit = byRange ? 1000 : 20;
  const offset = limit * (+pageNumber - 1);

  if (searchParam) {
    whereCondition = {
      [Op.or]: [
        {
          "$Schedule.body$": Sequelize.where(
            Sequelize.fn("LOWER", Sequelize.col("Schedule.body")),
            "LIKE",
            `%${searchParam.toLowerCase()}%`
          )
        },
        {
          "$Contact.name$": Sequelize.where(
            Sequelize.fn("LOWER", Sequelize.col("contact.name")),
            "LIKE",
            `%${searchParam.toLowerCase()}%`
          )
        }
      ]
    };
  }

  if (contactId !== "") {
    whereCondition = {
      ...whereCondition,
      contactId
    };
  }

  if (userId !== "") {
    whereCondition = {
      ...whereCondition,
      userId
    };
  }

  whereCondition = {
    ...whereCondition,
    companyId: {
      [Op.eq]: companyId
    }
  };

  if (byRange) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      whereCondition = {
        ...whereCondition,
        sendAt: { [Op.between]: [start, end] }
      };
    }
  }

  const { count, rows: schedules } = await Schedule.findAndCountAll({
    where: whereCondition,
    limit,
    offset,
    order: byRange ? [["sendAt", "ASC"]] : [["createdAt", "DESC"]],
    include: [
      {
        model: Contact,
        as: "contact",
        attributes: ["id", "name", "number", "profilePicUrl"]
      },
      { model: User, as: "user", attributes: ["id", "name"] }
    ]
  });

  const hasMore = count > offset + schedules.length;

  return {
    schedules,
    count,
    hasMore
  };
};

export default ListService;
