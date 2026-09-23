import { QueryInterface, DataTypes } from "sequelize";

/**
 * Contato que também fica salvo na agenda do celular conectado: quando
 * ligado, o nome escolhido aqui vai para o aparelho e acompanha as trocas
 * de nome.
 */
export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("Contacts", "syncToPhone", {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("Contacts", "syncToPhone");
  }
};
