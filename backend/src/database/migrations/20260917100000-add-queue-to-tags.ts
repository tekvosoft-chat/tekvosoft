import { QueryInterface, DataTypes } from "sequelize";

/** Coluna do Kanban ligada a uma fila: mover o card muda a fila do ticket. */
export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("Tags", "queueId", {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "Queues", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("Tags", "queueId");
  }
};
