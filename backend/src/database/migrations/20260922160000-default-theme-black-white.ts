import { QueryInterface } from "sequelize";

/**
 * A cor padrão passou a ser preto e branco (marca vuup.me):
 *
 * - quem está no tema padrão ("tekvosoft") tinha o roxo gravado junto;
 *   passa para o preto e branco. Quem escolheu outro tema continua nele.
 * - a cor da instalação (definida pelo super admin) deixa de existir, para
 *   empresas que ainda não escolheram um tema verem o preto e branco.
 */
const MONO = `'{"light":"#111111","dark":"#EDEDED","accent":"#8B8B8B"}'::jsonb`;
// filtro só por texto: a conversão para jsonb roda apenas nas linhas certas
const IS_DEFAULT = `~ '"preset"[[:space:]]*:[[:space:]]*"tekvosoft"'`;

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
      UPDATE "Settings"
         SET "value" = ("value"::jsonb || ${MONO})::text, "updatedAt" = NOW()
       WHERE "key" = 'appTheme' AND "value" ${IS_DEFAULT}
    `);
    await queryInterface.sequelize.query(`
      UPDATE "Users"
         SET "appTheme" = ("appTheme"::jsonb || ${MONO})::text
       WHERE "appTheme" ${IS_DEFAULT}
    `);
    await queryInterface.sequelize.query(`
      DELETE FROM "Settings"
       WHERE "companyId" = 1 AND "key" IN ('primaryColorLight', 'primaryColorDark')
    `);
  },

  down: async () => {
    // não volta para o roxo
  }
};
