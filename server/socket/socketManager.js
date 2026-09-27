import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../middleware/auth.js";

/** @type {Set<string>} room names like demo:<socketId> */
const demoRoomNames = new Set();

export function registerDemoRoom(roomName) {
  demoRoomNames.add(roomName);
}

export function unregisterDemoRoom(roomName) {
  demoRoomNames.delete(roomName);
}

/**
 * @param {import('socket.io').Server} io
 * @param {string} event
 * @param {unknown} payload
 */
export function broadcastDemo(io, event, payload) {
  for (const room of demoRoomNames) {
    io.to(room).emit(event, payload);
  }
}

/**
 * @param {import('socket.io').Server} io
 */
export function setupSocket(io) {
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.query?.token ||
      null;
    if (!token) {
      return next(new Error("Unauthorized"));
    }
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      socket.data.user = {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        role: payload.role,
        home_id: payload.home_id ?? null,
        demo_home_id: payload.demo_home_id ?? null,
      };
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const u = socket.data.user;
    if (!u) {
      socket.disconnect(true);
      return;
    }
    if (u.role === "demo") {
      const room = `demo:${socket.id}`;
      socket.join(room);
      registerDemoRoom(room);
      socket.emit("demo:tick", { progress_percent: 0 });
      socket.emit("nilm:alert", {
        device: "Air Cooler",
        watts: 200,
        confidence: 0.65,
        status: "on",
        source: "estimated",
        timestamp: new Date().toISOString(),
      });
      socket.on("disconnect", () => {
        unregisterDemoRoom(room);
      });
    } else if (u.home_id) {
      socket.join(`home:${u.home_id}`);
    } else {
      socket.disconnect(true);
    }
  });
}
