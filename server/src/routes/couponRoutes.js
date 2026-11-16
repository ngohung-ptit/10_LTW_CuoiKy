import { Router } from "express";
import {
  getCoupons,
  verifyCoupon,
  createCoupon,
} from "../controllers/couponController.js";
import { verifyToken, requireAdmin } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/", getCoupons);
router.post("/verify", verifyCoupon);
router.post("/", verifyToken, requireAdmin, createCoupon);

export default router;

