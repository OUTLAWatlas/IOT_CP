require("dotenv").config();

const http = require("http");
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");
const { initMqtt } = require("./services/mqttService");
const { initTelegramBot } = require("./services/telegramBot");
const apiRoutes = require("./routes/apiRoutes");

// ── Express ──────────────────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

// ── Socket.io ────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);
  socket.on("disconnect", () =>
    console.log(`[WS] Client disconnected: ${socket.id}`)
  );
});

// ── Services ─────────────────────────────────────────────────────────────────
const mqttClient = initMqtt(io);
const telegramBot = initTelegramBot(mqttClient);

// Expose mqttClient + telegramBot to routes via app.locals
app.locals.mqttClient = mqttClient;
app.locals.telegramBot = telegramBot;

// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/api", apiRoutes);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

// ── Start ────────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT, 10) || 5000;

server.listen(PORT, () => {
  console.log(`[SERVER] Listening on http://localhost:${PORT}`);
});
