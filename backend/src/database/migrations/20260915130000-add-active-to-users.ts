import { QueryInterface, DataTypes } from "sequelize";

/**
 * Usuário ativo ou inativo. Inativo não entra no sistema e perde a sessão,
 * mas continua existindo (atendimentos e histórico ficam com o nome dele).
 */
export default {
  up: (queryInterface: QueryInterface) =>
    queryInterface.addColumn("Users", "active", {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }),

  down: (queryInterface: QueryInterface) =>
    queryInterface.removeColumn("Users", "active")
};
