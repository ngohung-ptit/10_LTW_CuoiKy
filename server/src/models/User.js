import mongoose from "mongoose";
import { buildUserBaseId, generateUniqueId } from "../utils/idGenerator.js";
import { applyStringIdSchema } from "./schemaOptions.js";

const userSchema = new mongoose.Schema(
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
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Địa chỉ email không hợp lệ."],
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["member", "admin"],
      default: "member",
    },
  },
  {
    collection: "users",
    timestamps: true,
    _id: false,
  }
);

applyStringIdSchema(userSchema, {
  generateId: async (doc) => {
    if (!doc.email && !doc.name) return undefined;
    const baseId = buildUserBaseId(doc);
    return generateUniqueId(baseId, (id) => User.exists({ _id: id }));
  },
  transform: (ret) => {
    delete ret.password;
    return ret;
  },
});

export const User = mongoose.models.User || mongoose.model("User", userSchema);
