import { Router } from "express";
import {
  getShows,
  getShowById,
  createShow,
  deleteShow,
} from "../controllers/showController.js";
import { verifyToken, requireAdmin } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/", getShows);
router.get("/:id", getShowById);
router.post("/", verifyToken, requireAdmin, createShow);
router.delete("/:id", verifyToken, requireAdmin, deleteShow);

export default router;

