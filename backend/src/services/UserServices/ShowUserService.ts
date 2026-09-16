import User from "../../models/User";
import AppError from "../../errors/AppError";
import Queue from "../../models/Queue";
import Company from "../../models/Company";
import Plan from "../../models/Plan";
import { PLAN_FEATURES } from "../../helpers/PlanFeatures";

const ShowUserService = async (
  id: string | number,
  requestUserId: string | number = null
): Promise<User> => {
  const requestUser = requestUserId ? await User.findByPk(requestUserId) : null;
  const user = await User.findByPk(id, {
    attributes: [
      "name",
      "id",
      "email",
      "companyId",
      "profile",
      "profileImage",
      "super",
      "active",
      "appTheme",
      "tokenVersion"
    ],
    include: [
      {
        model: Queue,
        as: "queues",
        attributes: ["id", "name", "color"]
      },
      {
        model: Company,
        as: "company",
        // createdAt: o banner de teste grátis compara cadastro e vencimento
        attributes: ["id", "name", "dueDate", "createdAt", "planId"],
        // recursos do plano: a tela esconde o que não está incluído
        include: [{ model: Plan, attributes: ["id", "name", ...PLAN_FEATURES] }]
      }
    ],
    order: [[{ model: Queue, as: "queues" }, "name", "ASC"]]
  });

  if (!user) {
    throw new AppError("ERR_NO_USER_FOUND", 404);
  }

  if (
    requestUser &&
    requestUser.super === false &&
    user.companyId !== requestUser.companyId
  ) {
    throw new AppError("ERR_FORBIDDEN", 403);
  }

  return user;
};

export default ShowUserService;
