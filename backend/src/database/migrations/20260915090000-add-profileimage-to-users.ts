import { QueryInterface, DataTypes } from "sequelize";

/** Foto de perfil do usuário (caminho do arquivo em public/). */
export default {
  up: (queryInterface: QueryInterface) =>
    queryInterface.addColumn("Users", "profileImage", {
      type: DataTypes.STRING,
      allowNull: true
    }),

  down: (queryInterface: QueryInterface) =>
    queryInterface.removeColumn("Users", "profileImage")
};
