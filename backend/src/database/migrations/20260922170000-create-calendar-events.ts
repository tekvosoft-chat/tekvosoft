import { QueryInterface, DataTypes } from "sequelize";

/**
 * Agenda: eventos, ligações do chat interno e lembretes (as mensagens
 * agendadas continuam na tabela Schedules e aparecem juntas na tela).
 * externalId/externalSource ficam prontos para a sincronização com o
 * Google Agenda.
 */
export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable("CalendarEvents", {
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
      type: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "event"
      },
      title: { type: DataTypes.STRING(200), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      startAt: { type: DataTypes.DATE, allowNull: false },
      endAt: { type: DataTypes.DATE, allowNull: false },
      allDay: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      color: { type: DataTypes.STRING(9), allowNull: true },
      chatId: {
        type: DataTypes.INTEGER,
        references: { model: "Chats", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true
      },
      contactId: {
        type: DataTypes.INTEGER,
        references: { model: "Contacts", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true
      },
      participantIds: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: []
      },
      remindMinutes: { type: DataTypes.INTEGER, allowNull: true },
      remindedAt: { type: DataTypes.DATE, allowNull: true },
      externalId: { type: DataTypes.STRING(255), allowNull: true },
      externalSource: { type: DataTypes.STRING(20), allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });
    await queryInterface.addIndex("CalendarEvents", ["companyId", "startAt"], {
      name: "calendar_events_company_start"
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("CalendarEvents");
  }
};
