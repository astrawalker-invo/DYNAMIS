import { Router } from "express";
import Joi from "joi";
import { verifyToken, requireRole } from "../middleware/auth.js";
import { pool } from "../db/postgres.js";
import { queryApi, bucketReal } from "../db/influx.js";
import { runFlux } from "../utils/flux.js";
import bcrypt from "bcryptjs";
import { invalidateHomeMotionCache } from "../services/motionService.js";
import { invalidateNilmThresholdCache } from "../services/nilmService.js";

const router = Router();

router.use(verifyToken, requireRole("admin"));

router.get("/homes", async (_req, res) => {
  if (!pool) return res.status(503).json({ error: "Database unavailable" });
  try {
    const r = await pool.query(`
      SELECT h.*,
        COALESCE((
          SELECT SUM(d.rated_watts)::int FROM devices d
          WHERE d.home_id = h.id AND (d.is_active OR d.always_on)
        ), 0) AS estimate_watts
      FROM homes h
      ORDER BY h.name
    `);
    res.json({ homes: r.rows });
  } catch (e) {
    console.warn("[admin/homes]", e.message);
    res.status(500).json({ error: "Failed to list homes" });
  }
});

router.get("/users", async (_req, res) => {
  if (!pool) return res.status(503).json({ error: "Database unavailable" });
  try {
    const r = await pool.query(`
      SELECT id, name, email, role, home_id, created_at
      FROM users WHERE deleted_at IS NULL
      ORDER BY created_at DESC
    `);
    res.json({ users: r.rows });
  } catch (e) {
    console.warn("[admin/users]", e.message);
    res.status(500).json({ error: "Failed to list users" });
  }
});

const createUserSchema = Joi.object({
  name: Joi.string().min(1).max(120).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid("admin", "user", "demo").required(),
  home_id: Joi.string().uuid().allow(null).optional(),
});

router.post("/users", async (req, res) => {
  const { error, value } = createUserSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });
  if (!pool) return res.status(503).json({ error: "Database unavailable" });
  try {
    const hash = bcrypt.hashSync(value.password, 10);
    const ins = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, home_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, home_id, created_at`,
      [value.name, value.email.toLowerCase(), hash, value.role, value.home_id || null]
    );
    res.status(201).json({ user: ins.rows[0] });
  } catch (e) {
    if (e.code === "23505") return res.status(409).json({ error: "Email exists" });
    console.warn("[admin/users POST]", e.message);
    res.status(500).json({ error: "Create failed" });
  }
});

const updateUserSchema = Joi.object({
  name: Joi.string().min(1).max(120).optional(),
  role: Joi.string().valid("admin", "user", "demo").optional(),
  home_id: Joi.string().uuid().allow(null).optional(),
});

router.put("/users/:id", async (req, res) => {
  const { id } = req.params;
  const { error, value } = updateUserSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });
  if (!pool) return res.status(503).json({ error: "Database unavailable" });
  try {
    const fields = [];
    const vals = [];
    let i = 1;
    if (value.name != null) {
      fields.push(`name = $${i++}`);
      vals.push(value.name);
    }
    if (value.role != null) {
      fields.push(`role = $${i++}`);
      vals.push(value.role);
    }
    if (value.home_id !== undefined) {
      fields.push(`home_id = $${i++}`);
      vals.push(value.home_id);
    }
    if (!fields.length) return res.status(400).json({ error: "No fields" });
    vals.push(id);
    const r = await pool.query(
      `UPDATE users SET ${fields.join(", ")} WHERE id = $${i}::uuid AND deleted_at IS NULL
       RETURNING id, name, email, role, home_id, created_at`,
      vals
    );
    if (!r.rowCount) return res.status(404).json({ error: "Not found" });
    res.json({ user: r.rows[0] });
  } catch (e) {
    console.warn("[admin/users PUT]", e.message);
    res.status(500).json({ error: "Update failed" });
  }
});

router.delete("/users/:id", async (req, res) => {
  const { id } = req.params;
  if (!pool) return res.status(503).json({ error: "Database unavailable" });
  try {
    const r = await pool.query(
      `UPDATE users SET deleted_at = NOW() WHERE id = $1::uuid AND deleted_at IS NULL RETURNING id`,
      [id]
    );
    if (!r.rowCount) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (e) {
    console.warn("[admin/users DELETE]", e.message);
    res.status(500).json({ error: "Delete failed" });
  }
});

router.get("/analytics", async (_req, res) => {
  if (!queryApi) return res.json({ totals: [] });
  const fluxQ = `
from(bucket: "${bucketReal}")
  |> range(start: -7d)
  |> filter(fn: (r) => r["_measurement"] == "power_reading" and r["_field"] == "watts")
  |> group(columns: ["home_id"])
  |> sum()
`;
  try {
    const rows = await runFlux(queryApi, fluxQ);
    const totals = rows.map((row) => ({
      home_id: row.home_id,
      sum_watts_window: row._value,
    }));
    res.json({ totals });
  } catch (e) {
    console.warn("[admin/analytics]", e.message);
    res.status(500).json({ error: "Analytics query failed" });
  }
});

router.get("/devices", async (_req, res) => {
  if (!pool) return res.status(503).json({ error: "Database unavailable" });
  try {
    const r = await pool.query(`
      SELECT d.*, h.name AS home_name
      FROM devices d
      JOIN homes h ON h.id = d.home_id
      ORDER BY h.name, d.room, d.name
    `);
    res.json({ devices: r.rows });
  } catch (e) {
    console.warn("[admin/devices]", e.message);
    res.status(500).json({ error: "Failed to list devices" });
  }
});

router.get("/alerts", async (_req, res) => {
  if (!pool) return res.status(503).json({ error: "Database unavailable" });
  try {
    const r = await pool.query(`
      SELECT a.*, h.name AS home_name
      FROM alerts a
      LEFT JOIN homes h ON h.id = a.home_id
      ORDER BY a.created_at DESC
      LIMIT 200
    `);
    res.json({ alerts: r.rows });
  } catch (e) {
    console.warn("[admin/alerts]", e.message);
    res.status(500).json({ error: "Failed to load alerts" });
  }
});

const settingsSchema = Joi.object({
  tariff_rate: Joi.number().min(0).max(9999).optional(),
  motion_timeout_mins: Joi.number().integer().min(1).max(1440).optional(),
  nilm_threshold_watts: Joi.number().integer().min(1).max(100000).optional(),
  ldr_enabled: Joi.boolean().optional(),
  motion_enabled: Joi.boolean().optional(),
});

router.put("/settings/:homeId", async (req, res) => {
  const { homeId } = req.params;
  const { error, value } = settingsSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });
  if (!pool) return res.status(503).json({ error: "Database unavailable" });
  try {
    const fields = [];
    const vals = [];
    let i = 1;
    for (const k of [
      "tariff_rate",
      "motion_timeout_mins",
      "nilm_threshold_watts",
      "ldr_enabled",
      "motion_enabled",
    ]) {
      if (value[k] !== undefined) {
        fields.push(`${k} = $${i++}`);
        vals.push(value[k]);
      }
    }
    if (!fields.length) return res.status(400).json({ error: "No fields" });
    vals.push(homeId);
    const r = await pool.query(
      `UPDATE homes SET ${fields.join(", ")} WHERE id = $${i}::uuid RETURNING *`,
      vals
    );
    if (!r.rowCount) return res.status(404).json({ error: "Home not found" });
    invalidateHomeMotionCache(homeId);
    invalidateNilmThresholdCache(homeId);
    res.json({ home: r.rows[0] });
  } catch (e) {
    console.warn("[admin/settings]", e.message);
    res.status(500).json({ error: "Update failed" });
  }
});

export default router;
