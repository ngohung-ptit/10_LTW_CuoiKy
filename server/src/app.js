import express from "express";
import cors from "cors";
import apiRouter from "./routes/index.js";
import { errorHandler } from "./middlewares/errorMiddleware.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "*",
    credentials: true,
  })
);

app.use(express.json({ limit: "3mb" }));

app.use("/api", apiRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Đường dẫn không tồn tại." });
});

app.use(errorHandler);

export default app;

