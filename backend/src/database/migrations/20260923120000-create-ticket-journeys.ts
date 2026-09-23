import { QueryInterface, DataTypes } from "sequelize";

/**
 * Por onde o atendimento passou: trocas de fila, de coluna do Kanban, de
 * responsável e de situação — e quais delas foram feitas pela IA. É o que
 * monta o mapa da conversa na ficha do contato.
 */
export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable("TicketJourneys", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      ticketId: {
        type: DataTypes.INTEGER,
        references: { model: "Tickets", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      companyId: {
        type: DataTypes.INTEGER,
        references: { model: "Companies", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      userId: {
        type: DataTypes.INTEGER,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true
      },
      kind: { type: DataTypes.STRING(12), allowNull: false },
      fromValue: { type: DataTypes.STRING(120), allowNull: true },
      toValue: { type: DataTypes.STRING(120), allowNull: true },
      byAi: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      createdAt: { type: DataTypes.DATE, allowNull: false }
    });
    await queryInterface.addIndex("TicketJourneys", ["ticketId", "createdAt"], {
      name: "ticket_journeys_ticket"
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("TicketJourneys");
  }
};
