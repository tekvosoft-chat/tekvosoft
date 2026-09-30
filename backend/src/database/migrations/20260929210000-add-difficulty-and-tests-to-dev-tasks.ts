import { QueryInterface, DataTypes } from "sequelize";

/**
 * Pipeline de IA, terceira leva:
 *
 *  - difficulty: a triagem diz se a demanda é fácil, média ou difícil. É o
 *    que escolhe o modelo do desenvolvedor e do revisor (o caro só entra
 *    quando precisa);
 *  - testes: depois do merge, o testador confere a mudança no sistema no ar
 *    com um navegador, e guarda fotos e vídeo. testPlan é o roteiro que ele
 *    escreveu, testVerdict o resultado (pass, fail, unclear ou skipped) e
 *    mergeSha o commit do merge, para saber quando a versão com ele subiu.
 */
module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("DevTasks", "difficulty", {
      type: DataTypes.STRING(10),
      allowNull: true
    });
    await queryInterface.addColumn("DevTasks", "testPlan", {
      type: DataTypes.JSONB,
      allowNull: true
    });
    await queryInterface.addColumn("DevTasks", "testVerdict", {
      type: DataTypes.STRING(10),
      allowNull: true
    });
    await queryInterface.addColumn("DevTasks", "mergeSha", {
      type: DataTypes.STRING(64),
      allowNull: true
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("DevTasks", "mergeSha");
    await queryInterface.removeColumn("DevTasks", "testVerdict");
    await queryInterface.removeColumn("DevTasks", "testPlan");
    await queryInterface.removeColumn("DevTasks", "difficulty");
  }
};
