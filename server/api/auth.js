import { Router } from "express";
import Joi from "joi";
import bcrypt from "bcryptjs";
import { pool } from "../db/postgres.js";
import { signToken } from "../middleware/auth.js";

const router = Router();

const DEMO_HOME_ID =
  process.env.DEMO_HOME_ID || "bbbbbbbb-0000-0000-0000-000000000002";
const REAL_HOME_ID = "aaaaaaaa-0000-0000-0000-000000000001";
const FALLBACK_HASH =
  "$2b$10$eYGjjrcX1E48Mna273oZ2OgjkFlojtdO3DxypPDj4GwjZfv.NQ.JS";
const fallbackUsers = [
  {
    id: "11111111-0000-0000-0000-000000000001",
    name: "Admin User",
    email: "admin@energy.com",
    role: "admin",
    home_id: REAL_HOME_ID,
    password_hash: FALLBACK_HASH,
  },
  {
    id: "11111111-0000-0000-0000-000000000002",
    name: "Ravi Kumar",
    email: "ravi@energy.com",
    role: "user",
    home_id: REAL_HOME_ID,
    password_hash: FALLBACK_HASH,
  },
  {
    id: "11111111-0000-0000-0000-000000000003",
    name: "Priya Singh",
    email: "priya@energy.com",
    role: "user",
    home_id: REAL_HOME_ID,
    password_hash: FALLBACK_HASH,
  },
  {
    id: "11111111-0000-0000-0000-000000000004",
    name: "Demo Guest",
    email: "demo@energy.com",
    role: "demo",
    home_id: null,
    password_hash: FALLBACK_HASH,
  },
];

router.post("/register", async (req, res) => {
  const schema = Joi.object({
    name: Joi.string().min(1).max(120).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
  });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });
  if (!pool) return res.status(503).json({ error: "Database unavailable" });

  try {
    const hash = bcrypt.hashSync(value.password, 10);
    const ins = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, home_id)
       VALUES ($1, $2, $3, 'user', NULL)
       RETURNING id, name, email, role, home_id`,
      [value.name, value.email.toLowerCase(), hash]
    );
    const u = ins.rows[0];
    const token = signToken(
      {
        sub: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        home_id: u.home_id,
      },
      "7d"
    );
    res.status(201).json({ token, user: u });
  } catch (e) {
    if (e.code === "23505") {
      return res.status(409).json({ error: "Email already registered" });
    }
    console.warn("[auth/register]", e.message);
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });

  try {
    if (!pool) {
      const u = fallbackUsers.find((x) => x.email === value.email.toLowerCase());
      if (!u || !bcrypt.compareSync(value.password, u.password_hash)) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const expiry = u.role === "demo" ? "30m" : "7d";
      const token = signToken(
        {
          sub: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          home_id: u.home_id,
          demo_home_id: u.role === "demo" ? DEMO_HOME_ID : undefined,
        },
        expiry
      );
      return res.json({
        token,
        user: {
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          home_id: u.home_id,
          demo_home_id: u.role === "demo" ? DEMO_HOME_ID : null,
        },
      });
    }

    const r = await pool.query(
      `SELECT id, name, email, password_hash, role, home_id
       FROM users WHERE email = $1 AND deleted_at IS NULL`,
      [value.email.toLowerCase()]
    );
    const u = r.rows[0];
    if (!u || !bcrypt.compareSync(value.password, u.password_hash)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const expiry = u.role === "demo" ? "30m" : "7d";
    const token = signToken(
      {
        sub: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        home_id: u.home_id,
        demo_home_id: u.role === "demo" ? DEMO_HOME_ID : undefined,
      },
      expiry
    );
    res.json({
      token,
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        home_id: u.home_id,
        demo_home_id: u.role === "demo" ? DEMO_HOME_ID : null,
      },
    });
  } catch (e) {
    console.warn("[auth/login]", e.message);
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/demo", async (_req, res) => {
  try {
    if (!pool) {
      const u = fallbackUsers.find((x) => x.email === "demo@energy.com");
      const token = signToken(
        {
          sub: u.id,
          name: u.name,
          email: u.email,
          role: "demo",
          home_id: null,
          demo_home_id: DEMO_HOME_ID,
        },
        process.env.JWT_DEMO_EXPIRY || "30m"
      );
      return res.json({
        token,
        demo_home_id: DEMO_HOME_ID,
        user: {
          id: u.id,
          name: u.name,
          email: u.email,
          role: "demo",
          home_id: null,
          demo_home_id: DEMO_HOME_ID,
        },
      });
    }

    const r = await pool.query(
      `SELECT id, name, email, role, home_id
       FROM users WHERE email = 'demo@energy.com' AND deleted_at IS NULL`
    );
    const u = r.rows[0];
    if (!u) return res.status(404).json({ error: "Demo user not seeded" });
    const token = signToken(
      {
        sub: u.id,
        name: u.name,
        email: u.email,
        role: "demo",
        home_id: null,
        demo_home_id: DEMO_HOME_ID,
      },
      process.env.JWT_DEMO_EXPIRY || "30m"
    );
    res.json({
      token,
      demo_home_id: DEMO_HOME_ID,
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        role: "demo",
        home_id: null,
        demo_home_id: DEMO_HOME_ID,
      },
    });
  } catch (e) {
    console.warn("[auth/demo]", e.message);
    res.status(500).json({ error: "Demo login failed" });
  }
});

export default router;
