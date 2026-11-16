import { Router } from "express";
import authRoutes from "./authRoutes.js";
import movieRoutes from "./movieRoutes.js";
import roomRoutes from "./roomRoutes.js";
import showRoutes from "./showRoutes.js";
import ticketRoutes from "./ticketRoutes.js";
import analyticsRoutes from "./analyticsRoutes.js";
import couponRoutes from "./couponRoutes.js";

const apiRouter = Router();

apiRouter.use("/auth", authRoutes);
apiRouter.use("/movies", movieRoutes);
apiRouter.use("/rooms", roomRoutes);
apiRouter.use("/shows", showRoutes);
apiRouter.use("/tickets", ticketRoutes);
apiRouter.use("/analytics", analyticsRoutes);
apiRouter.use("/coupons", couponRoutes);

export default apiRouter;
