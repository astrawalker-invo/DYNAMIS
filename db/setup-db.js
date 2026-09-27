#!/usr/bin/env node
import "dotenv/config";
import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("[ERROR] DATABASE_URL not set in .env");
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function setupDatabase() {
  const client = await pool.connect();
  try {
    console.log("[DB Setup] Connected to PostgreSQL");

    // Read and execute schema
    const schemaPath = path.join(__dirname, "postgres", "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf-8");
    console.log("[DB Setup] Executing schema.sql...");
    await client.query(schema);
    console.log("[DB Setup] ✓ Schema created");

    // Read and execute seed
    const seedPath = path.join(__dirname, "postgres", "seed.sql");
    const seed = fs.readFileSync(seedPath, "utf-8");
    console.log("[DB Setup] Executing seed.sql...");
    await client.query(seed);
    console.log("[DB Setup] ✓ Seed data inserted");

    console.log("[DB Setup] Database setup complete!");
  } catch (err) {
    console.error("[ERROR] Database setup failed:", err.message);
    process.exit(1);
  } finally {
    await client.release();
    await pool.end();
  }
}

setupDatabase();
