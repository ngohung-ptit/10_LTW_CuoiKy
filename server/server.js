import http from "http";
import { Server } from "socket.io";
import app from "./src/app.js";
import { connectDB } from "./src/config/database.js";
import { getJwtSecret } from "./src/config/env.js";
import "./src/models/index.js";

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  socket.on("disconnect", () => {});
});

const startServer = async () => {
  try {
    getJwtSecret();
    const conn = await connectDB();
    console.log(`MongoDB connected successfully (database: ${conn.name}).`);

    server.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Unable to start server:", error);
    process.exit(1);
  }
};

startServer();
