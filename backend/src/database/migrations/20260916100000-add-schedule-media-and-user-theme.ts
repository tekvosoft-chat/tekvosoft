import { QueryInterface, DataTypes } from "sequelize";

/**
 * - Agendamento com imagem/arquivo (caminho em public/ e nome original).
 * - Tema de cores por usuário: cada admin escolhe a cor, o modo e o fundo
 *   das conversas só para si, em vez de valer para a empresa toda.
 */
export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("Schedules", "mediaPath", {
      type: DataTypes.STRING,
      allowNull: true
    });
    await queryInterface.addColumn("Schedules", "mediaName", {
      type: DataTypes.STRING,
      allowNull: true
    });
    await queryInterface.addColumn("Users", "appTheme", {
      type: DataTypes.TEXT,
      allowNull: true
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("Schedules", "mediaPath");
    await queryInterface.removeColumn("Schedules", "mediaName");
    await queryInterface.removeColumn("Users", "appTheme");
  }
};
