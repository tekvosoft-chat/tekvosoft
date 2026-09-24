import { QueryInterface, DataTypes } from "sequelize";

/**
 * Cada caixa de entrada guarda os ajustes do seu canal.
 *
 * O WhatsApp usa as colunas que já existem; os outros canais (site,
 * Instagram, Facebook...) têm cada um os seus campos — cor do widget,
 * domínio, token da página — e eles vivem aqui, sem uma coluna nova por
 * canal. Quem não tem canal definido é WhatsApp, que é o que existia antes.
 */
module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("Whatsapps", "config", {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    });
    await queryInterface.sequelize.query(
      `UPDATE "Whatsapps" SET "channel" = 'whatsapp' WHERE "channel" IS NULL OR "channel" = ''`
    );
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("Whatsapps", "config");
  }
};
