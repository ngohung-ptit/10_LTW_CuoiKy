import { Coupon } from "../models/index.js";

export const getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find({ isActive: true }).select(
      "code title discountPercent maxDiscount"
    );
    res.status(200).json(coupons);
  } catch (error) {
    next(error);
  }
};

export const verifyCoupon = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code || !String(code).trim()) {
      return res.status(400).json({ error: "Vui lòng nhập mã giảm giá." });
    }

    const coupon = await Coupon.findOne({
      _id: String(code).trim().toUpperCase(),
      isActive: true,
    });
    if (!coupon) {
      return res.status(400).json({ error: "Mã giảm giá không hợp lệ hoặc đã hết hạn." });
    }

    res.status(200).json({
      code: coupon.code,
      title: coupon.title,
      discountPercent: coupon.discountPercent,
      maxDiscount: coupon.maxDiscount,
    });
  } catch (error) {
    next(error);
  }
};

export const createCoupon = async (req, res, next) => {
  try {
    const { code, title, discountPercent, maxDiscount } = req.body;
    if (!code || !title) {
      return res.status(400).json({ error: "Vui lòng nhập mã và mô tả mã giảm giá." });
    }

    const normalizedCode = String(code).trim().toUpperCase();
    const coupon = await Coupon.create({
      _id: normalizedCode,
      code: normalizedCode,
      title: String(title).trim(),
      discountPercent: Number(discountPercent) || 10,
      maxDiscount: Number(maxDiscount) || 50000,
    });

    res.status(201).json(coupon);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: "Mã giảm giá này đã tồn tại." });
    }
    next(error);
  }
};
