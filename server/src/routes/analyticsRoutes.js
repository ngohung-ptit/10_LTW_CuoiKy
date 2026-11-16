import { Router } from "express";
import {
  getDashboardStats,
  getRevenueByMovie,
  getRevenueByDate,
} from "../controllers/analyticsController.js";
import { verifyToken, requireAdmin } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/dashboard", verifyToken, requireAdmin, getDashboardStats);
router.get("/by-movie", verifyToken, requireAdmin, getRevenueByMovie);
router.get("/by-date", verifyToken, requireAdmin, getRevenueByDate);

export default router;

