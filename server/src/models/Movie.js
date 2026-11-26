import mongoose from "mongoose";
import { buildMovieBaseId } from "../utils/idGenerator.js";
import { applyStringIdSchema } from "./schemaOptions.js";

const movieSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      default: "",
      trim: true,
    },
    genre: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
      max: 360,
    },
    year: {
      type: Number,
      required: true,
      default: () => new Date().getFullYear(),
    },
    age: {
      type: String,
      enum: ["P", "T13", "T16", "T18"],
      default: "P",
    },
    director: {
      type: String,
      default: "",
      trim: true,
    },
    cast: {
      type: String,
      default: "",
      trim: true,
    },
    poster: {
      type: String,
      required: true,
      default: "the-odyssey.jpg",
    },
    trailer: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["showing", "upcoming"],
      default: "showing",
      index: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    collection: "movies",
    timestamps: true,
    _id: false,
  }
);

movieSchema.virtual("shows", {
  ref: "Show",
  localField: "_id",
  foreignField: "movieId",
});

movieSchema.index({ status: 1, createdAt: -1 });

applyStringIdSchema(movieSchema, {
  generateId: (doc) => {
    if (!doc.title) return undefined;
    return buildMovieBaseId(doc.title) || undefined;
  },
});

export const Movie = mongoose.models.Movie || mongoose.model("Movie", movieSchema);
