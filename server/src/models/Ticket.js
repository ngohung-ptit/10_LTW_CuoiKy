import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Ticket = sequelize.define(
  "Ticket",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    showId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    movieId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    roomName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    total: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    discount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    couponCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("confirmed", "cancelled"),
      defaultValue: "confirmed",
    },
    qrCode: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "tickets",
    timestamps: true,
  }
);
