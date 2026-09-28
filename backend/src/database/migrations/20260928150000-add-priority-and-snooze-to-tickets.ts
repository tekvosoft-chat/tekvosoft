import { QueryInterface, DataTypes, Op } from "sequelize";

/**
 * Menu de contexto da lista de conversas: prioridade e "adiar".
 *
 * priority vai de 0 (nenhuma) a 4 (urgente). snoozedUntil esconde a conversa
 * das listas até a hora marcada; "até o cliente responder" grava uma data no
 * ano 9999, que só a próxima mensagem dele apaga. O índice parcial cobre só
 * as conversas adiadas, que são poucas: é por ele que o job de cada minuto
 * acha quem precisa voltar.
 */
module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("Tickets", "priority", {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    });
    await queryInterface.addColumn("Tickets", "snoozedUntil", {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    });
    await queryInterface.addIndex("Tickets", ["snoozedUntil"], {
      name: "tickets_snoozed_until",
      where: { snoozedUntil: { [Op.ne]: null } }
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeIndex("Tickets", "tickets_snoozed_until");
    await queryInterface.removeColumn("Tickets", "snoozedUntil");
    await queryInterface.removeColumn("Tickets", "priority");
  }
};
