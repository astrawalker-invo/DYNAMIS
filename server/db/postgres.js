import pg from "pg";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

export const pool = connectionString
  ? new Pool({ connectionString, max: 10, idleTimeoutMillis: 30000 })
  : null;

export async function testPostgres() {
  if (!pool) {
    console.warn("[PostgreSQL] DATABASE_URL not set — skipping connection test");
    return false;
  }
  try {
    const r = await pool.query("SELECT 1 AS ok");
    console.log("[PostgreSQL] Connection OK");
    return r.rows[0]?.ok === 1;
  } catch (err) {
    console.warn("[PostgreSQL] Connection failed:", err.message);
    return false;
  }
}
