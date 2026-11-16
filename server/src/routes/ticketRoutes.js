import { Router } from "express";
import {
  createTicket,
  getMyTickets,
  cancelTicket,
} from "../controllers/ticketController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/", verifyToken, createTicket);
router.get("/my-tickets", verifyToken, getMyTickets);
router.patch("/:id/cancel", verifyToken, cancelTicket);

export default router;

