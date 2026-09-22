import { QueryInterface, DataTypes } from "sequelize";

/** Perfil do usuário: bio e frase de status (aparecem no chat interno). */
export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("Users", "bio", {
      type: DataTypes.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn("Users", "statusText", {
      type: DataTypes.STRING(80),
      allowNull: true
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("Users", "statusText");
    await queryInterface.removeColumn("Users", "bio");
  }
};
