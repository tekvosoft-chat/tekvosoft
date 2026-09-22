import { QueryInterface, DataTypes } from "sequelize";

/**
 * Navegadores liberados por código no e-mail (entrada por navegador novo).
 */
export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable("UserDevices", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      userId: {
        type: DataTypes.INTEGER,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      deviceHash: { type: DataTypes.STRING(64), allowNull: false },
      label: { type: DataTypes.STRING(120), allowNull: true },
      ip: { type: DataTypes.STRING(64), allowNull: true },
      lastSeenAt: { type: DataTypes.DATE, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });
    await queryInterface.addIndex("UserDevices", ["userId", "deviceHash"], {
      unique: true,
      name: "user_devices_user_device"
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("UserDevices");
  }
};
