import { QueryInterface, DataTypes } from "sequelize";

/**
 * Assistente de IA por fila: liga/desliga e a configuração (nome da IA,
 * sobre a empresa, tom de voz, instruções e quando passar para um humano).
 */
export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("Queues", "aiEnabled", {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    await queryInterface.addColumn("Queues", "aiConfig", {
      type: DataTypes.TEXT,
      allowNull: true
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("Queues", "aiEnabled");
    await queryInterface.removeColumn("Queues", "aiConfig");
  }
};
