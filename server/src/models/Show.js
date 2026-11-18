import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import { buildShowBaseId, generateUniqueId } from "../utils/idGenerator.js";

export const Show = sequelize.define(
  "Show",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    movieId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    roomId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    date: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    time: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 75000,
    },
    vipPrice: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 95000,
    },
  },
  {
    tableName: "shows",
    timestamps: true,
  }
);

Show.beforeValidate(async (show) => {
  if (!show.id && show.date && show.movieId && show.roomId) {
    const baseId = buildShowBaseId(show);
    show.id = await generateUniqueId(baseId, (id) => Show.findByPk(id));
  }
});

