import mongoose from "mongoose";
import { buildShowBaseId, generateUniqueId } from "../utils/idGenerator.js";
import { applyStringIdSchema } from "./schemaOptions.js";

const showSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      trim: true,
    },
    movieId: {
      type: String,
      ref: "Movie",
      required: true,
      index: true,
    },
    roomId: {
      type: String,
      ref: "Room",
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
    time: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      default: 75000,
      min: 1,
    },
    vipPrice: {
      type: Number,
      required: true,
      default: 95000,
      min: 1,
    },
  },
  {
    collection: "shows",
    timestamps: true,
    _id: false,
  }
);

showSchema.virtual("movie", {
  ref: "Movie",
  localField: "movieId",
  foreignField: "_id",
  justOne: true,
});

showSchema.virtual("room", {
  ref: "Room",
  localField: "roomId",
  foreignField: "_id",
  justOne: true,
});

showSchema.index({ roomId: 1, date: 1, time: 1 });

applyStringIdSchema(showSchema, {
  generateId: async (doc) => {
    if (!doc.date || !doc.movieId || !doc.roomId) return undefined;
    const baseId = buildShowBaseId(doc);
    return generateUniqueId(baseId, (id) => Show.exists({ _id: id }));
  },
});

export const Show = mongoose.models.Show || mongoose.model("Show", showSchema);
