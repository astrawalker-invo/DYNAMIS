import { Router } from "express";
import Joi from "joi";
import { verifyToken, blockDemo } from "../middleware/auth.js";
import { pool } from "../db/postgres.js";
import {
  queryApi,
  demoQueryApi,
  bucketReal,
  bucketDemo,
} from "../db/influx.js";
import { runFlux } from "../utils/flux.js";

const router = Router();
const REAL_HOME_ID = "aaaaaaaa-0000-0000-0000-000000000001";
const DEMO_HOME_ID =
  process.env.DEMO_HOME_ID || "bbbbbbbb-0000-0000-0000-000000000002";
const fallbackRealDevices = [
  { id: "d1", home_id: REAL_HOME_ID, name: "Ceiling Fan", type: "fan", room: "bedroom", rated_watts: 75, relay_channel: 1, is_active: true, always_on: false },
  { id: "d2", home_id: REAL_HOME_ID, name: "LED Bulb", type: "light", room: "bedroom", rated_watts: 12, relay_channel: 2, is_active: true, always_on: false },
  { id: "d3", home_id: REAL_HOME_ID, name: "Ceiling Fan", type: "fan", room: "living", rated_watts: 75, relay_channel: 3, is_active: true, always_on: false },
  { id: "d4", home_id: REAL_HOME_ID, name: "Air Cooler", type: "cooler", room: "living", rated_watts: 200, relay_channel: 5, is_active: true, always_on: false },
  { id: "d5", home_id: REAL_HOME_ID, name: "Refrigerator", type: "fridge", room: "kitchen", rated_watts: 150, relay_channel: null, is_active: true, always_on: true },
  { id: "d6", home_id: REAL_HOME_ID, name: "TV", type: "tv", room: "living", rated_watts: 120, relay_channel: 7, is_active: true, always_on: false },
  { id: "d7", home_id: REAL_HOME_ID, name: "Laptop Charger", type: "laptop", room: "bedroom", rated_watts: 65, relay_channel: 8, is_active: true, always_on: false },
];
const fallbackDemoDevices = [
  { id: "dd1", home_id: DEMO_HOME_ID, name: "Ceiling Fan", type: "fan", room: "bedroom", rated_watts: 75, relay_channel: 1, is_active: true, always_on: false },
  { id: "dd2", home_id: DEMO_HOME_ID, name: "LED Bulb", type: "light", room: "bedroom", rated_watts: 12, relay_channel: 2, is_active: true, always_on: false },
  { id: "dd3", home_id: DEMO_HOME_ID, name: "Air Cooler", type: "cooler", room: "living", rated_watts: 200, relay_channel: 3, is_active: true, always_on: false },
  { id: "dd4", home_id: DEMO_HOME_ID, name: "TV", type: "tv", room: "living", rated_watts: 120, relay_channel: 4, is_active: true, always_on: false },
  { id: "dd5", home_id: DEMO_HOME_ID, name: "Refrigerator", type: "fridge", room: "kitchen", rated_watts: 150, relay_channel: null, is_active: true, always_on: true },
];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function assertHomeAccess(req, homeId) {
  if (!UUID_RE.test(homeId)) {
    return { ok: false, status: 400, error: "Invalid home id" };
  }
  if (req.user.role === "admin") return { ok: true };
  if (req.user.role === "demo") {
    if (homeId === req.user.demo_home_id) return { ok: true };
    return { ok: false, status: 403, error: "Demo can only access the demo home" };
  }
  if (!req.user.home_id) {
    return { ok: false, status: 403, error: "No home assigned" };
  }
  if (homeId !== req.user.home_id) {
    return { ok: false, status: 403, error: "Forbidden" };
  }
  return { ok: true };
}

function influxApis(req) {
  const isDemo = req.user.role === "demo";
  return {
    isDemo,
    q: isDemo ? demoQueryApi : queryApi,
    bucket: isDemo ? bucketDemo : bucketReal,
  };
}

router.use(verifyToken);

router.get("/:homeId/devices", async (req, res) => {
  const { homeId } = req.params;
  const gate = assertHomeAccess(req, homeId);
  if (!gate.ok) return res.status(gate.status).json({ error: gate.error });
  if (!pool) {
    const devices = req.user.role === "demo" ? fallbackDemoDevices : fallbackRealDevices;
    return res.json({ devices: devices.filter((d) => d.home_id === homeId) });
  }
  try {
    if (req.user.role === "demo") {
      const r = await pool.query(
        `SELECT id, home_id, name, type, room, rated_watts, relay_channel, is_active, always_on, created_at
         FROM demo_devices WHERE home_id = $1::uuid ORDER BY room, name`,
        [homeId]
      );
      return res.json({ devices: r.rows });
    }
    const r = await pool.query(
      `SELECT id, home_id, name, type, room, rated_watts, relay_channel, is_active, always_on, created_at
       FROM devices WHERE home_id = $1::uuid ORDER BY room, name`,
      [homeId]
    );
    res.json({ devices: r.rows });
  } catch (e) {
    console.warn("[home/devices]", e.message);
    res.status(500).json({ error: "Failed to load devices" });
  }
});

const ratedWattsSchema = Joi.object({
  rated_watts: Joi.number().integer().min(0).max(50000).required(),
});

router.put("/:homeId/devices/:deviceId", blockDemo, async (req, res) => {
  const { homeId, deviceId } = req.params;
  const gate = assertHomeAccess(req, homeId);
  if (!gate.ok) return res.status(gate.status).json({ error: gate.error });
  const { error, value } = ratedWattsSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });
  if (!pool) return res.status(503).json({ error: "Database unavailable" });
  try {
    const r = await pool.query(
      `UPDATE devices SET rated_watts = $3
       WHERE id = $1::uuid AND home_id = $2::uuid
       RETURNING id, home_id, name, type, room, rated_watts, relay_channel, is_active, always_on`,
      [deviceId, homeId, value.rated_watts]
    );
    if (!r.rowCount) return res.status(404).json({ error: "Device not found" });
    res.json({ device: r.rows[0] });
  } catch (e) {
    console.warn("[home/devices PUT]", e.message);
    res.status(500).json({ error: "Update failed" });
  }
});

router.get("/:homeId/power/history", async (req, res) => {
  const { homeId } = req.params;
  const range = req.query.range || "24h";
  const gate = assertHomeAccess(req, homeId);
  if (!gate.ok) return res.status(gate.status).json({ error: gate.error });
  const { q, bucket } = influxApis(req);
  if (!q) return res.json({ points: [] });

  let start = "-24h";
  if (range === "7d") start = "-7d";
  else if (range === "30d") start = "-30d";

  const fluxQ = `
from(bucket: "${bucket}")
  |> range(start: ${start})
  |> filter(fn: (r) => r["_measurement"] == "power_reading" and r["home_id"] == "${homeId}" and r["_field"] == "watts")
  |> sort(columns: ["_time"])
  |> keep(columns: ["_time", "_value"])
`;
  try {
    const rows = await runFlux(q, fluxQ);
    const points = rows.map((row) => ({
      time: row._time,
      watts: row._value,
    }));
    res.json({ points });
  } catch (e) {
    console.warn("[home/power/history]", e.message);
    res.status(500).json({ error: "Influx query failed" });
  }
});

async function meanCostForRange(q, bucket, homeId, start, hours, tariff) {
  if (!q) return 0;
  const fluxQ = `
from(bucket: "${bucket}")
  |> range(start: ${start})
  |> filter(fn: (r) => r["_measurement"] == "power_reading" and r["home_id"] == "${homeId}" and r["_field"] == "watts")
  |> mean()
`;
  const rows = await runFlux(q, fluxQ);
  const meanW = Number(rows[0]?._value || 0);
  const kwh = (meanW * hours) / 1000;
  return kwh * Number(tariff);
}

router.get("/:homeId/cost", async (req, res) => {
  const { homeId } = req.params;
  const gate = assertHomeAccess(req, homeId);
  if (!gate.ok) return res.status(gate.status).json({ error: gate.error });
  const { q, bucket, isDemo } = influxApis(req);
  try {
    let tariff = 8.5;
    if (!pool) {
      const sourceDevices = isDemo ? fallbackDemoDevices : fallbackRealDevices;
      const totalWatts = sourceDevices
        .filter((d) => d.home_id === homeId && (d.is_active || d.always_on))
        .reduce((sum, d) => sum + d.rated_watts, 0);
      const kwhDay = (totalWatts * 8) / 1000;
      const today = kwhDay * tariff;
      const week = today * 7;
      const month = today * 30;
      return res.json({ today, week, month, currency: "INR", tariff_rate: tariff });
    } else if (isDemo) {
      const tr = await pool.query(
        "SELECT tariff_rate FROM demo_homes WHERE id = $1::uuid",
        [homeId]
      );
      tariff = Number(tr.rows[0]?.tariff_rate ?? 8.5);
    } else {
      const tr = await pool.query(
        "SELECT tariff_rate FROM homes WHERE id = $1::uuid",
        [homeId]
      );
      tariff = Number(tr.rows[0]?.tariff_rate ?? 8.5);
    }
    const today = await meanCostForRange(q, bucket, homeId, "-24h", 24, tariff);
    const week = await meanCostForRange(q, bucket, homeId, "-7d", 168, tariff);
    const month = await meanCostForRange(q, bucket, homeId, "-30d", 720, tariff);
    res.json({ today, week, month, currency: "INR", tariff_rate: tariff });
  } catch (e) {
    console.warn("[home/cost]", e.message);
    res.status(500).json({ error: "Cost computation failed" });
  }
});

router.get("/:homeId/nilm/events", async (req, res) => {
  const { homeId } = req.params;
  const gate = assertHomeAccess(req, homeId);
  if (!gate.ok) return res.status(gate.status).json({ error: gate.error });
  if (req.user.role === "demo") return res.json({ alerts: [] });
  if (!pool) return res.status(503).json({ error: "Database unavailable" });
  try {
    const r = await pool.query(
      `SELECT id, home_id, type, message, severity, acknowledged, created_at
       FROM alerts WHERE home_id = $1::uuid AND type = 'nilm'
       ORDER BY created_at DESC LIMIT 50`,
      [homeId]
    );
    res.json({ alerts: r.rows });
  } catch (e) {
    console.warn("[home/nilm/events]", e.message);
    res.status(500).json({ error: "Failed to load alerts" });
  }
});

router.get("/:homeId/motion/events", async (req, res) => {
  const { homeId } = req.params;
  const gate = assertHomeAccess(req, homeId);
  if (!gate.ok) return res.status(gate.status).json({ error: gate.error });
  const { q, bucket } = influxApis(req);
  if (!q) return res.json({ events: [] });
  const fluxQ = `
from(bucket: "${bucket}")
  |> range(start: -7d)
  |> filter(fn: (r) => r["_measurement"] == "motion_event" and r["home_id"] == "${homeId}")
  |> sort(columns: ["_time"], desc: true)
  |> limit(n: 50)
`;
  try {
    const rows = await runFlux(q, fluxQ);
    const events = rows.map((row) => ({
      time: row._time,
      room: row.room,
      occupied:
        row.occupied !== undefined
          ? row.occupied
          : row._field === "occupied"
            ? row._value
            : false,
    }));
    res.json({ events });
  } catch (e) {
    console.warn("[home/motion/events]", e.message);
    res.status(500).json({ error: "Influx query failed" });
  }
});

router.get("/:homeId/ldr/history", async (req, res) => {
  const { homeId } = req.params;
  const gate = assertHomeAccess(req, homeId);
  if (!gate.ok) return res.status(gate.status).json({ error: gate.error });
  const { q, bucket } = influxApis(req);
  if (!q) return res.json({ points: [] });
  const fluxQ = `
from(bucket: "${bucket}")
  |> range(start: -24h)
  |> filter(fn: (r) => r["_measurement"] == "ldr_reading" and r["home_id"] == "${homeId}")
  |> sort(columns: ["_time"])
`;
  try {
    const rows = await runFlux(q, fluxQ);
    res.json({ points: rows });
  } catch (e) {
    console.warn("[home/ldr/history]", e.message);
    res.status(500).json({ error: "Influx query failed" });
  }
});

router.put("/:homeId/alerts/ack", blockDemo, async (req, res) => {
  const { homeId } = req.params;
  const gate = assertHomeAccess(req, homeId);
  if (!gate.ok) return res.status(gate.status).json({ error: gate.error });
  if (!pool) return res.status(503).json({ error: "Database unavailable" });
  try {
    await pool.query(
      `UPDATE alerts SET acknowledged = true
       WHERE home_id = $1::uuid AND acknowledged = false`,
      [homeId]
    );
    res.json({ ok: true });
  } catch (e) {
    console.warn("[home/alerts/ack]", e.message);
    res.status(500).json({ error: "Ack failed" });
  }
});

export default router;
