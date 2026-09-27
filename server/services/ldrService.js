import { Point, writeApi } from "../db/influx.js";
import { publish } from "../mqtt/mqttClient.js";

function voltageActionFromLux(lux) {
  if (lux > 700) return { action: "dim", target: 180 };
  if (lux >= 300) return { action: "medium", target: 210 };
  return { action: "full", target: 220 };
}

/**
 * @param {import('socket.io').Server} io
 * @param {string} homeId
 * @param {{ lux: number, relay?: string, voltage_estimated?: number, timestamp?: string }} data
 */
export async function handleLdrMessage(io, homeId, data) {
  const { lux } = data;
  const { action, target } = voltageActionFromLux(lux);
  const ts = data.timestamp ? new Date(data.timestamp) : new Date();

  if (writeApi) {
    const p = new Point("ldr_reading")
      .tag("home_id", homeId)
      .floatField("lux", lux)
      .floatField("voltage_estimated", data.voltage_estimated ?? target)
      .stringField("relay", data.relay || action)
      .timestamp(ts);
    writeApi.writePoint(p);
    await writeApi.flush().catch(() => {});
  }

  publish(`home/${homeId}/cmd/voltage`, {
    action,
    target,
    reason: "ldr_threshold",
    timestamp: new Date().toISOString(),
  });

  io.to(`home:${homeId}`).emit("ldr:update", {
    lux,
    relay: data.relay || action,
    voltage_estimated: data.voltage_estimated ?? target,
    action,
    timestamp: ts.toISOString(),
  });
}
