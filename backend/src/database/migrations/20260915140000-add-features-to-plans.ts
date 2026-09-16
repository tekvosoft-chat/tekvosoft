import { QueryInterface, DataTypes } from "sequelize";

/**
 * Recursos de cada plano. Tudo nasce ligado: os planos que já existem
 * continuam com tudo o que tinham; o super admin desliga o que não entra.
 */
const FEATURES = [
  "useKanban",
  "useInternalChat",
  "useSchedules",
  "useCampaigns",
  "useExternalApi"
];

export default {
  up: async (queryInterface: QueryInterface) => {
    for (const feature of FEATURES) {
      // eslint-disable-next-line no-await-in-loop
      await queryInterface.addColumn("Plans", feature, {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      });
    }
  },

  down: async (queryInterface: QueryInterface) => {
    for (const feature of FEATURES) {
      // eslint-disable-next-line no-await-in-loop
      await queryInterface.removeColumn("Plans", feature);
    }
  }
};
