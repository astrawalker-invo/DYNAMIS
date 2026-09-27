import { Point, writeApi } from "../db/influx.js";

/**
 * @param {import('socket.io').Server} io
 * @param {string} homeId
 * @param {{ watts: number, source?: string, voltage?: number, current?: number, timestamp?: string }} data
 */
export async function handlePowerMqttMessage(io, homeId, data) {
  const watts = Number(data.watts);
  if (Number.isNaN(watts)) return;

  const voltage = Number(data.voltage ?? 230);
  const current = Number(data.current ?? (voltage > 0 ? watts / voltage : 0));
  const source = data.source || "mqtt";
  const timestamp = data.timestamp || new Date().toISOString();

  if (writeApi) {
    const point = new Point("power_reading")
      .tag("home_id", homeId)
      .tag("source", source)
      .floatField("watts", watts)
      .floatField("voltage", voltage)
      .floatField("current", current)
      .timestamp(new Date(timestamp));

    writeApi.writePoint(point);
    await writeApi.flush().catch(() => {});
  }

  io.to(`home:${homeId}`).emit("power:update", {
    watts,
    voltage,
    current,
    source,
    timestamp,
  });
}

export function invalidateNilmThresholdCache(homeId) {
  // preserved for admin cache invalidation and future NILM features
}
