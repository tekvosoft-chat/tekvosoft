import { QueryInterface } from "sequelize";

/**
 * A marca mudou de Tekvosoft para vuup.me. O nome do app gravado nas
 * configurações só é trocado se ainda for o antigo — nome personalizado
 * (whitelabel) fica como está.
 */
export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
      UPDATE "Settings"
         SET "value" = 'vuup.me', "updatedAt" = NOW()
       WHERE "key" = 'appName'
         AND LOWER(TRIM("value")) IN ('tekvosoft', 'tekvosoft - atendimento via whatsapp')
    `);
  },

  down: async () => {
    // não volta para a marca antiga
  }
};
