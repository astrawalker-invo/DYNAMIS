import { InfluxDB, Point } from "@influxdata/influxdb-client";

const url = process.env.INFLUX_URL || "http://localhost:8086";
const token = process.env.INFLUX_TOKEN || "";
const org = process.env.INFLUX_ORG || "";
export const bucketReal = process.env.INFLUX_BUCKET_REAL || "energy";
export const bucketDemo = process.env.INFLUX_BUCKET_DEMO || "demo_energy";

let influx = null;
let writeApi = null;
let queryApi = null;
let demoWriteApi = null;
let demoQueryApi = null;

async function pingInflux() {
  if (!url || !token || !org) {
    console.warn(
      "[InfluxDB] Missing INFLUX_URL, INFLUX_TOKEN, or INFLUX_ORG — writes/queries disabled"
    );
    return false;
  }
  try {
    const base = url.replace(/\/$/, "");
    const res = await fetch(`${base}/health`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) {
      console.warn(`[InfluxDB] Health check HTTP ${res.status}`);
      return false;
    }
    console.log("[InfluxDB] Connection OK (health check)");
    return true;
  } catch (err) {
    console.warn("[InfluxDB] Connection failed:", err.message);
    return false;
  }
}

export async function initInfluxDB() {
  const ok = await pingInflux();
  if (ok && token && org) {
    influx = new InfluxDB({ url, token });
    writeApi = influx.getWriteApi(org, bucketReal, "ns");
    queryApi = influx.getQueryApi(org);
    demoWriteApi = influx.getWriteApi(org, bucketDemo, "ns");
    demoQueryApi = influx.getQueryApi(org);
  } else {
    console.warn(
      "[InfluxDB] Running without Influx write/query APIs until configured"
    );
  }
  return ok;
}

export {
  influx,
  writeApi,
  queryApi,
  demoWriteApi,
  demoQueryApi,
  Point,
  org,
};

export async function flushWrites() {
  if (writeApi) await writeApi.flush().catch(() => {});
  if (demoWriteApi) await demoWriteApi.flush().catch(() => {});
}
