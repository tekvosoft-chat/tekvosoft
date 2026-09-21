import { QueryInterface, DataTypes } from "sequelize";

/**
 * Chat interno no estilo Discord: conversa avulsa entre duas pessoas
 * ("direct") ou grupo ("group", as salas). Grupo público aparece na busca
 * da empresa para qualquer um entrar. As conversas que já existiam viram
 * grupos privados: ninguém novo passa a vê-las sem ser convidado.
 */
export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("Chats", "kind", {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "group"
    });
    await queryInterface.addColumn("Chats", "isPublic", {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    await queryInterface.addColumn("Chats", "description", {
      type: DataTypes.TEXT,
      allowNull: true
    });
    await queryInterface.addIndex("Chats", ["companyId", "kind"]);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeIndex("Chats", ["companyId", "kind"]);
    await queryInterface.removeColumn("Chats", "description");
    await queryInterface.removeColumn("Chats", "isPublic");
    await queryInterface.removeColumn("Chats", "kind");
  }
};
