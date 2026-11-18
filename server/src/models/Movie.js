import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Movie = sequelize.define(
  "Movie",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    subtitle: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    genre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    age: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "P",
    },
    director: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cast: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    poster: {
      type: DataTypes.TEXT("medium"),
      allowNull: false,
    },
    trailer: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("showing", "upcoming"),
      defaultValue: "showing",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "movies",
    timestamps: true,
  }
);

