import crypto from "crypto";
import mongoose from "mongoose";
import { applyStringIdSchema } from "./schemaOptions.js";

const seatItemSchema = new mongoose.Schema(
  {
    seatId: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const ticketSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      trim: true,
    },
    userId: {
      type: String,
      ref: "User",
      required: true,
      index: true,
    },
    showId: {
      type: String,
      ref: "Show",
      required: true,
      index: true,
    },
    movieId: {
      type: String,
      ref: "Movie",
      required: true,
      index: true,
    },
    roomName: {
      type: String,
      default: "",
    },
    seats: {
      type: [seatItemSchema],
      default: [],
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    couponCode: {
      type: String,
      ref: "Coupon",
      default: null,
    },
    status: {
      type: String,
      enum: ["confirmed", "cancelled"],
      default: "confirmed",
      index: true,
    },
    qrCode: {
      type: String,
      default: null,
    },
  },
  {
    collection: "tickets",
    timestamps: true,
    _id: false,
  }
);

ticketSchema.virtual("show", {
  ref: "Show",
  localField: "showId",
  foreignField: "_id",
  justOne: true,
});

ticketSchema.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "_id",
  justOne: true,
});

ticketSchema.index(
  { showId: 1, "seats.seatId": 1 },
  {
    unique: true,
    partialFilterExpression: { status: "confirmed" },
  }
);

applyStringIdSchema(ticketSchema, {
  generateId: () => `UDU-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
  transform: (ret) => {
    const rawSeats = Array.isArray(ret.seats) ? ret.seats : [];
    ret.seatDetails = rawSeats;
    ret.seats = rawSeats.map((item) => (typeof item === "string" ? item : item.seatId));
    return ret;
  },
});

export const Ticket = mongoose.models.Ticket || mongoose.model("Ticket", ticketSchema);
