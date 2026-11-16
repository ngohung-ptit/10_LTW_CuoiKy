import { Router } from "express";
import {
  getMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
} from "../controllers/movieController.js";
import { verifyToken, requireAdmin } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/", getMovies);
router.get("/:id", getMovieById);
router.post("/", verifyToken, requireAdmin, createMovie);
router.put("/:id", verifyToken, requireAdmin, updateMovie);
router.delete("/:id", verifyToken, requireAdmin, deleteMovie);

export default router;

