import { QueryInterface, DataTypes } from "sequelize";

/**
 * Descrição da fila: em uma frase, o que ela resolve.
 *
 * É o que a recepção inteligente lê para decidir para onde mandar quem
 * chegou — e ajuda a própria equipe a lembrar para que serve cada fila.
 */
module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("Queues", "description", {
      type: DataTypes.STRING(300),
      allowNull: true
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("Queues", "description");
  }
};
