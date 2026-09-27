import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { Point, demoWriteApi } from "../db/influx.js";
import { broadcastDemo } from "../socket/socketManager.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const DEMO_HOME_ID =
  process.env.DEMO_HOME_ID || "bbbbbbbb-0000-0000-0000-000000000002";
const TARIFF = 8.5;
/** Simulated seconds advanced per wall second (120 ≈ 24h replay in 12 min). */
const SIM_SPEED = 120;

function loadDataset() {
  const path = join(__dirname, "data", "recorded_day.json");
  return JSON.parse(readFileSync(path, "utf8"));
}

function sortByT(arr) {
  return [...arr].sort((a, b) => a.t - b.t);
}

function interpolateSeries(points, tSec) {
  const s = sortByT(points);
  if (!s.length) return null;
  if (tSec <= s[0].t) return s[0];
  const last = s[s.length - 1];
  if (tSec >= last.t) return last;
  for (let i = 0; i < s.length - 1; i++) {
    const a = s[i];
    const b = s[i + 1];
    if (tSec >= a.t && tSec <= b.t) {
      const r = (tSec - a.t) / (b.t - a.t);
      const out = { ...a };
      for (const k of Object.keys(b)) {
        if (k === "t") continue;
        const va = a[k];
        const vb = b[k];
        if (typeof va === "number" && typeof vb === "number") {
          out[k] = va + (vb - va) * r;
        } else if (typeof va === "string" && typeof vb === "string") {
          out[k] = r < 0.5 ? va : vb;
        }
      }
      out.t = tSec;
      return out;
    }
  }
  return last;
}

function occupancyByRoomAt(motion, tSec) {
  const rooms = ["bedroom", "living", "kitchen"];
  const state = Object.fromEntries(rooms.map((r) => [r, false]));
  const sorted = sortByT(motion).filter((ev) => ev.t <= tSec);
  for (const ev of sorted) {
    if (rooms.includes(ev.room)) state[ev.room] = ev.occupied;
  }
  return state;
}

function voltageActionFromLux(lux) {
  if (lux > 700) return "dim";
  if (lux >= 300) return "medium";
  return "full";
}

export class DemoReplayService {
  /**
   * @param {import('socket.io').Server} io
   */
  constructor(io) {
    this.io = io;
    this.dataset = loadDataset();
    this.startedAt = Date.now();
    this.intervals = [];
    this.emittedNilmTs = new Set();
    this.prevSimT = null;
  }

  getSimT() {
    const wall = (Date.now() - this.startedAt) / 1000;
    return (wall * SIM_SPEED) % 86400;
  }

  async writeDemoPoint(measurement, fields, tags = {}) {
    if (!demoWriteApi) return;
    let p = new Point(measurement).tag("home_id", DEMO_HOME_ID);
    for (const [k, v] of Object.entries(tags)) {
      p = p.tag(k, String(v));
    }
    for (const [k, v] of Object.entries(fields)) {
      if (typeof v === "number") p = p.floatField(k, v);
      else if (typeof v === "boolean") p = p.booleanField(k, v);
      else p = p.stringField(k, String(v));
    }
    p.timestamp(new Date());
    demoWriteApi.writePoint(p);
    await demoWriteApi.flush().catch(() => {});
  }

  broadcast(event, payload) {
    broadcastDemo(this.io, event, payload);
  }

  _replayLDR = async () => {
    const t = this.getSimT();
    const row = interpolateSeries(this.dataset.ldr, t);
    if (!row) return;
    const action = voltageActionFromLux(row.lux);
    const ts = new Date().toISOString();
    this.broadcast("ldr:update", {
      lux: Math.round(row.lux),
      relay: row.relay,
      voltage_estimated: Math.round(row.voltage_estimated),
      action,
      timestamp: ts,
    });
    await this.writeDemoPoint(
      "ldr_reading",
      { lux: row.lux, voltage_estimated: row.voltage_estimated, relay: row.relay },
      {}
    );
  };

  _replayMotion = async () => {
    const t = this.getSimT();
    const occ = occupancyByRoomAt(this.dataset.motion, t);
    const ts = new Date().toISOString();
    for (const [room, occupied] of Object.entries(occ)) {
      this.broadcast("motion:update", {
        room,
        occupied,
        lights: occupied,
        appliances: occupied,
        timestamp: ts,
      });
      await this.writeDemoPoint(
        "motion_event",
        { occupied },
        { room }
      );
    }
  };

  _replayPower = async () => {
    const t = this.getSimT();
    const row = interpolateSeries(this.dataset.power, t);
    if (!row) return;
    const watts = Math.round(row.watts);
    const voltage = 230;
    const current = voltage > 0 ? watts / voltage : 0;
    const ts = new Date().toISOString();
    this.broadcast("power:update", {
      watts,
      voltage,
      current,
      source: "estimated",
      timestamp: ts,
    });
    await this.writeDemoPoint("power_reading", { watts }, { source: "estimated" });
  };

  _replayNILM = () => {
    const t = this.getSimT();
    const prev = this.prevSimT;
    if (prev == null) {
      const past = this.dataset.nilm.filter((ev) => ev.t <= t).sort((a, b) => b.t - a.t)[0];
      const seed = past || this.dataset.nilm[0];
      if (seed) {
        this.broadcast("nilm:alert", {
          device: seed.device,
          watts: seed.watts,
          confidence: Math.min(seed.confidence, 0.65),
          status: seed.status,
          source: "estimated",
          timestamp: new Date().toISOString(),
        });
        this.emittedNilmTs.add(seed.t);
      }
      this.prevSimT = t;
      return;
    }

    const wrapped = prev > t;
    if (wrapped) this.emittedNilmTs.clear();
    for (const ev of this.dataset.nilm) {
      const crossed =
        (!wrapped && ev.t > prev && ev.t <= t) ||
        (wrapped && (ev.t > prev || ev.t <= t));
      if (crossed && !this.emittedNilmTs.has(ev.t)) {
        this.emittedNilmTs.add(ev.t);
        this.broadcast("nilm:alert", {
          device: ev.device,
          watts: ev.watts,
          confidence: Math.min(ev.confidence, 0.65),
          status: ev.status,
          source: "estimated",
          timestamp: new Date().toISOString(),
        });
      }
    }
    this.prevSimT = t;
  };

  _replayCost = () => {
    const t = this.getSimT();
    const row = interpolateSeries(this.dataset.power, t);
    if (!row) return;
    const p = row.watts;
    const today = (p / 1000) * TARIFF * 8;
    const week = today * 5.2;
    const month = today * 22;
    this.broadcast("cost:update", {
      today,
      week,
      month,
      currency: "INR",
    });
  };

  _replayDemoTick = () => {
    const pct = (this.getSimT() / 86400) * 100;
    this.broadcast("demo:tick", { progress_percent: Math.min(100, pct) });
  };

  start() {
    if (this.intervals.length) return;
    this.startedAt = Date.now();
    this.intervals.push(setInterval(() => this._replayLDR(), 3000));
    this.intervals.push(setInterval(() => this._replayMotion(), 15_000));
    this.intervals.push(setInterval(() => this._replayPower(), 2000));
    this.intervals.push(setInterval(() => this._replayNILM(), 2000));
    this.intervals.push(setInterval(() => this._replayCost(), 60_000));
    this.intervals.push(setInterval(() => this._replayDemoTick(), 1000));
    void this._replayLDR();
    void this._replayMotion();
    void this._replayPower();
    void this._replayCost();
    void this._replayDemoTick();
    console.log("[DemoReplayService] Started (demo_energy + demo:* rooms only)");
  }

  stop() {
    for (const id of this.intervals) clearInterval(id);
    this.intervals = [];
    console.log("[DemoReplayService] Stopped");
  }
}
