import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Room = sequelize.define(
  "Room",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    rows: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    columns: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    vipRows: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      get() {
        const raw = this.getDataValue("vipRows");
        if (Array.isArray(raw)) return raw;
        if (typeof raw === "string") {
          try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        }
        return [];
      },
      set(val) {
        this.setDataValue("vipRows", Array.isArray(val) ? val : []);
      },
    },
  },
  {
    tableName: "rooms",
    timestamps: true,
  }
);
