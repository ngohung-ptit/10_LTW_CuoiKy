import mongoose from "mongoose";
import { applyStringIdSchema } from "./schemaOptions.js";

const couponSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      uppercase: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    discountPercent: {
      type: Number,
      required: true,
      default: 10,
      min: 1,
      max: 100,
    },
    maxDiscount: {
      type: Number,
      required: true,
      default: 50000,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    collection: "coupons",
    timestamps: true,
    _id: false,
  }
);

couponSchema.pre("validate", function () {
  if (!this._id && this.code) {
    this._id = String(this.code).trim().toUpperCase();
  }
  if (!this.code && this._id) {
    this.code = String(this._id).trim().toUpperCase();
  }
});

applyStringIdSchema(couponSchema, {
  transform: (ret) => {
    ret.code = ret.code || ret.id;
    return ret;
  },
});

export const Coupon = mongoose.models.Coupon || mongoose.model("Coupon", couponSchema);
