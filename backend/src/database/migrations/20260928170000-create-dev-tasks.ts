import { QueryInterface, DataTypes } from "sequelize";

/**
 * Pipeline de desenvolvimento com IA (painel do super admin).
 *
 * DevTasks é a demanda: nasce de um pedido (do super ou de um cliente pela
 * Ajuda) e anda pelas etapas intake -> prioritization -> development ->
 * review -> pr -> done. DevTaskEvents é a conversa entre os agentes
 * (triagem, desenvolvedor, revisor) e as pessoas: tudo que cada um disse,
 * com o modelo usado e os tokens gastos.
 *
 * changes guarda o conteúdo final de cada arquivo alterado, por cima do
 * commit baseSha: é o que vira o commit do PR.
 */
module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable("DevTasks", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      title: { type: DataTypes.STRING(200), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
      source: { type: DataTypes.STRING(20), allowNull: false },
      companyId: {
        type: DataTypes.INTEGER,
        references: { model: "Companies", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true
      },
      requesterId: {
        type: DataTypes.INTEGER,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true
      },
      supportTicketId: {
        type: DataTypes.INTEGER,
        references: { model: "SupportTickets", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true
      },
      stage: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "intake"
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "waiting"
      },
      priority: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: "normal"
      },
      priorityReason: { type: DataTypes.TEXT, allowNull: true },
      kind: { type: DataTypes.STRING(20), allowNull: true },
      effort: { type: DataTypes.STRING(2), allowNull: true },
      risk: { type: DataTypes.STRING(10), allowNull: true },
      spec: { type: DataTypes.TEXT, allowNull: true },
      acceptance: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
      files: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
      questions: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
      feedback: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
      baseSha: { type: DataTypes.STRING(64), allowNull: true },
      changes: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
      diff: { type: DataTypes.TEXT, allowNull: true },
      checks: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
      reviewRound: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      verdict: { type: DataTypes.STRING(20), allowNull: true },
      branch: { type: DataTypes.STRING(120), allowNull: true },
      prUrl: { type: DataTypes.STRING(300), allowNull: true },
      prNumber: { type: DataTypes.INTEGER, allowNull: true },
      error: { type: DataTypes.TEXT, allowNull: true },
      tokensIn: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      tokensOut: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      tokensCached: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });
    await queryInterface.addIndex("DevTasks", ["stage"], {
      name: "dev_tasks_stage"
    });

    await queryInterface.createTable("DevTaskEvents", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      taskId: {
        type: DataTypes.INTEGER,
        references: { model: "DevTasks", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      agent: { type: DataTypes.STRING(20), allowNull: false },
      kind: { type: DataTypes.STRING(20), allowNull: false },
      content: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
      meta: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
      userId: {
        type: DataTypes.INTEGER,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });
    await queryInterface.addIndex("DevTaskEvents", ["taskId"], {
      name: "dev_task_events_task_id"
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("DevTaskEvents");
    await queryInterface.dropTable("DevTasks");
  }
};
