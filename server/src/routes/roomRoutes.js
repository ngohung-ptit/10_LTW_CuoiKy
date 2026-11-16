import { Router } from "express";
import {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
} from "../controllers/roomController.js";
import { verifyToken, requireAdmin } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/", getRooms);
router.get("/:id", getRoomById);
router.post("/", verifyToken, requireAdmin, createRoom);
router.put("/:id", verifyToken, requireAdmin, updateRoom);

export default router;

