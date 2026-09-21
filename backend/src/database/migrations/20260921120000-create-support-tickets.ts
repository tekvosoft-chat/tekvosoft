import { QueryInterface, DataTypes } from "sequelize";

/**
 * Chamados de suporte: o cliente abre pela tela de Ajuda (com anexos) e o
 * dono da plataforma responde pelo kanban de suporte.
 */
export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable("SupportTickets", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      companyId: {
        type: DataTypes.INTEGER,
        references: { model: "Companies", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      userId: {
        type: DataTypes.INTEGER,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true
      },
      subject: { type: DataTypes.STRING(160), allowNull: false },
      category: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "question"
      },
      priority: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: "normal"
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "open"
      },
      unreadBySupport: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      unreadByClient: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      lastMessageAt: { type: DataTypes.DATE, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });

    await queryInterface.createTable("SupportMessages", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      ticketId: {
        type: DataTypes.INTEGER,
        references: { model: "SupportTickets", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      userId: {
        type: DataTypes.INTEGER,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true
      },
      fromSupport: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      // "message" (texto/anexos) ou "status" (o suporte mudou a etapa)
      kind: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: "message"
      },
      body: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
      attachments: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: []
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });

    await queryInterface.addIndex("SupportTickets", ["companyId", "status"]);
    await queryInterface.addIndex("SupportTickets", ["lastMessageAt"]);
    await queryInterface.addIndex("SupportMessages", ["ticketId", "createdAt"]);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("SupportMessages");
    await queryInterface.dropTable("SupportTickets");
  }
};
