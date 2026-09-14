import { QueryInterface, DataTypes } from "sequelize";

/**
 * Inscrições de notificação push (PWA / navegador). Uma linha por aparelho
 * em que a pessoa ativou as notificações; o endpoint é único por aparelho.
 */
export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable("PushSubscriptions", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Companies", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      endpoint: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true
      },
      p256dh: {
        type: DataTypes.STRING,
        allowNull: false
      },
      auth: {
        type: DataTypes.STRING,
        allowNull: false
      },
      silent: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      userAgent: {
        type: DataTypes.STRING,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE
      }
    });

    await queryInterface.addIndex("PushSubscriptions", ["userId"]);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("PushSubscriptions");
  }
};
