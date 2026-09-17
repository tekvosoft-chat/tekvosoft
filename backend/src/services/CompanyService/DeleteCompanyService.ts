import fs from "fs";
import { join } from "path";
import { QueryTypes } from "sequelize";
import Company from "../../models/Company";
import AppError from "../../errors/AppError";
import { getPublicPath } from "../../helpers/GetPublicPath";
import sequelize from "../../database";

// tabelas cuja ligação com a empresa é "SET NULL": sem apagar à mão, os
// registros ficavam soltos no banco depois de excluir a empresa
const ORPHAN_TABLES = [
  "Messages",
  "TicketTraking",
  "UserRatings",
  "WhatsappLidMaps"
];

const DeleteCompanyService = async (id: string): Promise<void> => {
  const company = await Company.findOne({
    where: { id }
  });

  if (!company) {
    throw new AppError("ERR_NO_COMPANY_FOUND", 404);
  }

  const companyId = company.id;

  await sequelize.transaction(async transaction => {
    const run = (sql: string, replacements: Record<string, unknown>) =>
      sequelize.query(sql, { replacements, transaction, type: QueryTypes.RAW });

    for (const table of ORPHAN_TABLES) {
      // eslint-disable-next-line no-await-in-loop
      await run(`DELETE FROM "${table}" WHERE "companyId" = :companyId`, {
        companyId
      });
    }

    await run(`DELETE FROM "Settings" WHERE "companyId" = :companyId`, {
      companyId
    });

    const users = (await sequelize.query<{ id: number }>(
      `SELECT "id" FROM "Users" WHERE "companyId" = :companyId`,
      { replacements: { companyId }, transaction, type: QueryTypes.SELECT }
    )) as { id: number }[];
    const whatsapps = (await sequelize.query<{ id: number }>(
      `SELECT "id" FROM "Whatsapps" WHERE "companyId" = :companyId`,
      { replacements: { companyId }, transaction, type: QueryTypes.SELECT }
    )) as { id: number }[];

    // tickets, contatos, filas, tags, agendamentos… saem em cascata
    await company.destroy({ transaction });

    if (users.length) {
      await run(`DELETE FROM "Users" WHERE "id" IN (:ids)`, {
        ids: users.map(u => u.id)
      });
    }
    if (whatsapps.length) {
      await run(`DELETE FROM "Whatsapps" WHERE "id" IN (:ids)`, {
        ids: whatsapps.map(w => w.id)
      });
    }
  });

  // arquivos da empresa: a pasta pode nem existir (empresa sem mídia)
  try {
    fs.rmSync(join(getPublicPath(), "media", String(companyId)), {
      recursive: true,
      force: true
    });
  } catch (error) {
    // sem pasta ou sem permissão: os dados do banco já foram removidos
  }
};

export default DeleteCompanyService;
