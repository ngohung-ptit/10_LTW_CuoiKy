import mongoose from "mongoose";
import { buildRoomBaseId, generateUniqueId } from "../utils/idGenerator.js";
import { applyStringIdSchema } from "./schemaOptions.js";

const roomSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    rows: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    columns: {
      type: Number,
      required: true,
      min: 4,
      max: 16,
    },
    vipRows: {
      type: [String],
      default: [],
    },
  },
  {
    collection: "rooms",
    timestamps: true,
    _id: false,
  }
);

applyStringIdSchema(roomSchema, {
  generateId: async (doc) => {
    if (!doc.name) return undefined;
    const baseId = buildRoomBaseId(doc.name);
    return generateUniqueId(baseId, (id) => Room.exists({ _id: id }));
  },
});

export const Room = mongoose.models.Room || mongoose.model("Room", roomSchema);
