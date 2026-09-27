import { Point, writeApi } from "../db/influx.js";
import { pool } from "../db/postgres.js";

let intervalId = null;

/**
 * @param {import('socket.io').Server} io
 */
export function startPowerEstimator(io) {
  if (intervalId) clearInterval(intervalId);
  intervalId = setInterval(() => {
    tick(io).catch((e) => console.warn("[powerEstimator]", e.message));
  }, 10_000);
}

export function stopPowerEstimator() {
  if (intervalId) clearInterval(intervalId);
  intervalId = null;
}

/**
 * @param {import('socket.io').Server} io
 */
async function tick(io) {
  if (!pool || !writeApi) return;
  const homes = await pool.query("SELECT id FROM homes");
  for (const row of homes.rows) {
    const homeId = row.id;
    const sum = await pool.query(
      `SELECT COALESCE(SUM(rated_watts), 0)::int AS watts
       FROM devices
       WHERE home_id = $1::uuid
         AND (is_active = true OR always_on = true)`,
      [homeId]
    );
    const watts = sum.rows[0]?.watts ?? 0;
    const voltage = 230;
    const current = voltage > 0 ? watts / voltage : 0;

    const p = new Point("power_reading")
      .tag("home_id", homeId)
      .tag("source", "estimated")
      .floatField("watts", watts)
      .timestamp(new Date());
    writeApi.writePoint(p);
    await writeApi.flush().catch(() => {});

    io.to(`home:${homeId}`).emit("power:update", {
      watts,
      voltage,
      current,
      source: "estimated",
      timestamp: new Date().toISOString(),
    });
  }
}
