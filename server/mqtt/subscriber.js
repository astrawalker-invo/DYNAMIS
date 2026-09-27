import Joi from "joi";
import { subscribe } from "./mqttClient.js";
import { handleLdrMessage } from "../services/ldrService.js";
import { handleMotionMessage, handleVisionMessage } from "../services/motionService.js";
import { handlePowerMqttMessage } from "../services/nilmService.js";

const ldrSchema = Joi.object({
  lux: Joi.number().required(),
  relay: Joi.alternatives().try(Joi.string(), Joi.number()).optional(),
  voltage_estimated: Joi.number().optional(),
  timestamp: Joi.string().optional(),
});

const motionSchema = Joi.object({
  occupied: Joi.boolean().required(),
  timestamp: Joi.string().optional(),
});

const visionSchema = Joi.object({
  person_detected: Joi.boolean().required(),
  confidence: Joi.number().min(0).max(1).optional(),
  timestamp: Joi.string().optional(),
});

const powerSchema = Joi.object({
  watts: Joi.number().required(),
  source: Joi.string().optional(),
  timestamp: Joi.string().optional(),
});

const nilmSchema = Joi.object({
  device: Joi.string().optional(),
  watts: Joi.number().optional(),
  confidence: Joi.number().optional(),
  status: Joi.string().optional(),
  source: Joi.string().optional(),
  timestamp: Joi.string().optional(),
});

function parseJson(buf) {
  try {
    return JSON.parse(buf.toString("utf8"));
  } catch {
    return null;
  }
}

function parseHomeId(topic, segments) {
  const parts = topic.split("/");
  const idx = parts.indexOf("home");
  if (idx < 0 || !parts[idx + 1]) return null;
  return parts[idx + 1];
}

function parseRoom(topic) {
  const parts = topic.split("/");
  return parts[parts.length - 1] || "";
}

/**
 * @param {import('socket.io').Server} io
 */
export function registerMqttSubscriber(io) {
  subscribe("home/+/ldr", (topic, payload) => {
    const data = parseJson(payload);
    if (!data) return;
    const { error, value } = ldrSchema.validate(data, { stripUnknown: true });
    if (error) {
      console.warn("[MQTT] ldr validation:", error.message);
      return;
    }
    const homeId = parseHomeId(topic, []);
    if (!homeId) return;
    handleLdrMessage(io, homeId, value).catch((e) =>
      console.warn("[MQTT] ldr handler:", e.message)
    );
  });

  subscribe("home/+/motion/+", (topic, payload) => {
    const data = parseJson(payload);
    if (!data) return;
    const { error, value } = motionSchema.validate(data, { stripUnknown: true });
    if (error) {
      console.warn("[MQTT] motion validation:", error.message);
      return;
    }
    const homeId = parseHomeId(topic, []);
    const room = parseRoom(topic);
    if (!homeId || !room) return;
    handleMotionMessage(io, homeId, room, value).catch((e) =>
      console.warn("[MQTT] motion handler:", e.message)
    );
  });

  subscribe("home/+/vision/+", (topic, payload) => {
    const data = parseJson(payload);
    if (!data) return;
    const { error, value } = visionSchema.validate(data, { stripUnknown: true });
    if (error) {
      console.warn("[MQTT] vision validation:", error.message);
      return;
    }
    const homeId = parseHomeId(topic, []);
    const room = parseRoom(topic);
    if (!homeId || !room) return;
    handleVisionMessage(io, homeId, room, value).catch((e) =>
      console.warn("[MQTT] vision handler:", e.message)
    );
  });

  subscribe("home/+/power", (topic, payload) => {
    const data = parseJson(payload);
    if (!data) return;
    const { error, value } = powerSchema.validate(data, { stripUnknown: true });
    if (error) {
      console.warn("[MQTT] power validation:", error.message);
      return;
    }
    const homeId = parseHomeId(topic, []);
    if (!homeId) return;
    handlePowerMqttMessage(io, homeId, value).catch((e) =>
      console.warn("[MQTT] power/nilm handler:", e.message)
    );
  });

  subscribe("home/+/energy/sensor", (topic, payload) => {
    const data = parseJson(payload);
    if (!data) return;
    const homeId = parseHomeId(topic, []);
    if (!homeId) return;

    if (data.lux !== undefined || data.voltage_estimated !== undefined) {
      const { error, value } = ldrSchema.validate(data, { stripUnknown: true });
      if (error) {
        console.warn("[MQTT] energy/sensor->ldr validation:", error.message);
        return;
      }
      handleLdrMessage(io, homeId, value).catch((e) =>
        console.warn("[MQTT] energy/sensor->ldr handler:", e.message)
      );
      return;
    }

    if (data.watts !== undefined || data.power !== undefined) {
      if (data.power !== undefined && data.watts === undefined) data.watts = data.power;
      const { error, value } = powerSchema.validate(data, { stripUnknown: true });
      if (error) {
        console.warn("[MQTT] energy/sensor->power validation:", error.message);
        return;
      }
      handlePowerMqttMessage(io, homeId, value).catch((e) =>
        console.warn("[MQTT] energy/sensor->power handler:", e.message)
      );
      return;
    }

    if (data.occupied !== undefined && data.room) {
      const { error, value } = motionSchema.validate(data, { stripUnknown: true });
      if (error) {
        console.warn("[MQTT] energy/sensor->motion validation:", error.message);
        return;
      }
      handleMotionMessage(io, homeId, data.room, value).catch((e) =>
        console.warn("[MQTT] energy/sensor->motion handler:", e.message)
      );
      return;
    }

    if (data.person_detected !== undefined && data.room) {
      const { error, value } = visionSchema.validate(data, { stripUnknown: true });
      if (error) {
        console.warn("[MQTT] energy/sensor->vision validation:", error.message);
        return;
      }
      handleVisionMessage(io, homeId, data.room, value).catch((e) =>
        console.warn("[MQTT] energy/sensor->vision handler:", e.message)
      );
      return;
    }

    if (data.device !== undefined && data.watts !== undefined) {
      const { error, value } = nilmSchema.validate(data, { stripUnknown: true });
      if (error) {
        console.warn("[MQTT] energy/sensor->nilm validation:", error.message);
        return;
      }
      io.to(`home:${homeId}`).emit("nilm:alert", {
        device: value.device,
        watts: value.watts,
        confidence: value.confidence,
        status: value.status,
        source: value.source || "mqtt",
        timestamp: value.timestamp || new Date().toISOString(),
      });
      return;
    }

    console.warn("[MQTT] energy/sensor payload not mapped:", data);
  });

  subscribe("home/+/nilm", (topic, payload) => {
    const data = parseJson(payload);
    if (!data) return;
    const { error, value } = nilmSchema.validate(data, { stripUnknown: true });
    if (error) {
      console.warn("[MQTT] nilm validation:", error.message);
      return;
    }
    const homeId = parseHomeId(topic, []);
    if (!homeId) return;
    io.to(`home:${homeId}`).emit("nilm:alert", {
      device: value.device,
      watts: value.watts,
      confidence: value.confidence,
      status: value.status,
      source: value.source || "mqtt",
      timestamp: value.timestamp || new Date().toISOString(),
    });
  });
}
