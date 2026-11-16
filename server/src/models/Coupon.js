import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Coupon = sequelize.define(
  "Coupon",
  {
    code: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    discountPercent: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
    },
    maxDiscount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 50000,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "coupons",
    timestamps: true,
  }
);

