import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";

import { initInfluxDB } from "./db/influx.js";
import { testPostgres, pool } from "./db/postgres.js";
import { initMqttClient, getMqttConnected } from "./mqtt/mqttClient.js";
import { registerMqttSubscriber } from "./mqtt/subscriber.js";
import { startPowerEstimator } from "./services/powerEstimator.js";
import { DemoReplayService } from "./demo/DemoReplayService.js";
import { setupSocket } from "./socket/socketManager.js";

import authRouter from "./api/auth.js";
import homeRouter from "./api/home.js";
import adminRouter from "./api/admin.js";

const port = Number(process.env.PORT || 5000);
const clientOrigin = process.env.CLIENT_URL || "http://localhost:5173";

const app = express();
app.use(cors({ origin: clientOrigin, credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "iot-energy-server",
    mqtt: getMqttConnected(),
    postgres: Boolean(pool),
  });
});

app.use("/api/auth", authRouter);
app.use("/api/home", homeRouter);
app.use("/api/admin", adminRouter);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: clientOrigin, credentials: true },
});

setupSocket(io);
registerMqttSubscriber(io);
initMqttClient();

async function startup() {
  console.log("--- IoT Energy Server startup ---");

  const pgOk = await testPostgres();
  const influxOk = await initInfluxDB();
  if (!influxOk) {
    console.warn("[Startup] InfluxDB not fully configured — history APIs may be empty");
  }

  const enablePowerEstimator = process.env.ENABLE_POWER_ESTIMATOR === "true";
  if (enablePowerEstimator) {
    startPowerEstimator(io);
    console.log("[Startup] Power estimator enabled (estimated power data)");
  } else {
    console.log("[Startup] Power estimator disabled (live MQTT power only)");
  }

  const demoReplay = new DemoReplayService(io);
  demoReplay.start();

  httpServer.listen(port, () => {
    console.log(`[HTTP] Listening on http://localhost:${port}`);
    console.log(`[CORS] ${clientOrigin}`);
    console.log(`[Socket.io] Ready (rooms: home:{uuid}, demo:{socketId})`);
    console.log(`[PostgreSQL] ${pgOk ? "OK" : "unavailable"}`);
    console.log(`[InfluxDB] ${influxOk ? "OK" : "degraded"}`);
    console.log(`[MQTT] ${getMqttConnected() ? "connected" : "offline / demo-only"}`);
  });
}

startup().catch((err) => {
  console.error("[Startup] Fatal:", err);
  process.exit(1);
});
