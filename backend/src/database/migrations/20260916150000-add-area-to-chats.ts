import { QueryInterface, DataTypes } from "sequelize";

/** Chat interno por áreas da empresa (como os servidores do Discord). */
export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("Chats", "area", {
      type: DataTypes.STRING,
      allowNull: true
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("Chats", "area");
  }
};
