import { QueryInterface, DataTypes } from "sequelize";

/**
 * Mensagem privada: fica dentro da conversa, mas só a equipe vê.
 *
 * Serve para combinar algo entre atendentes sem sair da conversa do cliente
 * — o que está marcado assim nunca é enviado ao WhatsApp.
 */
module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("Messages", "isPrivate", {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("Messages", "isPrivate");
  }
};
