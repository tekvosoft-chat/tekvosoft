import { QueryInterface, DataTypes } from "sequelize";

/**
 * Pipeline de IA, segunda leva:
 *
 *  - DevSkills: o que o time sabe, em pedaços que os agentes consomem só
 *    quando servem para a tarefa. Nasce de semente (padrão do projeto), da
 *    pessoa (ensinando) ou do agente que aprende com as correções. Uma
 *    melhoria de skill existente entra como proposta com replacesId.
 *  - custo em dólar por demanda (costUsd); a tela converte para reais;
 *  - design: a triagem marca quando a tarefa mexe em interface;
 *  - skills escolhidas e imagens anexadas à demanda.
 */
module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable("DevSkills", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      slug: { type: DataTypes.STRING(80), allowNull: false },
      name: { type: DataTypes.STRING(120), allowNull: false },
      description: { type: DataTypes.STRING(300), allowNull: false },
      content: { type: DataTypes.TEXT, allowNull: false },
      source: { type: DataTypes.STRING(20), allowNull: false },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "active"
      },
      replacesId: {
        type: DataTypes.INTEGER,
        references: { model: "DevSkills", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: true
      },
      fromTaskId: {
        type: DataTypes.INTEGER,
        references: { model: "DevTasks", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true
      },
      reason: { type: DataTypes.TEXT, allowNull: true },
      uses: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      lastUsedAt: { type: DataTypes.DATE, allowNull: true },
      costUsd: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });
    await queryInterface.addIndex("DevSkills", ["status"], {
      name: "dev_skills_status"
    });

    await queryInterface.addColumn("DevTasks", "costUsd", {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0
    });
    await queryInterface.addColumn("DevTasks", "design", {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    await queryInterface.addColumn("DevTasks", "skills", {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    });
    await queryInterface.addColumn("DevTasks", "attachments", {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("DevTasks", "attachments");
    await queryInterface.removeColumn("DevTasks", "skills");
    await queryInterface.removeColumn("DevTasks", "design");
    await queryInterface.removeColumn("DevTasks", "costUsd");
    await queryInterface.dropTable("DevSkills");
  }
};
