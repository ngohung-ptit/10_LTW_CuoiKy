import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const TicketSeat = sequelize.define(
  "TicketSeat",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    ticketId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    showId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    seatId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "ticket_seats",
    timestamps: true,
  }
);

