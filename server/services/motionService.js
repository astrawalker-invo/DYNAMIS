import { Point, writeApi } from "../db/influx.js";
import { publish } from "../mqtt/mqttClient.js";
import { pool } from "../db/postgres.js";

/** @type {Map<string, { pir: boolean, vision: boolean, unoccupiedSince: number | null, lastEmittedOccupied: boolean | null }>} */
const roomMap = new Map();

/** @type {Map<string, number>} */
const homeMotionTimeoutCache = new Map();

async function getMotionTimeoutMins(homeId) {
  if (homeMotionTimeoutCache.has(homeId)) {
    return homeMotionTimeoutCache.get(homeId);
  }
  if (!pool) return 5;
  try {
    const r = await pool.query(
      "SELECT motion_timeout_mins FROM homes WHERE id = $1::uuid",
      [homeId]
    );
    const mins = r.rows[0]?.motion_timeout_mins ?? 5;
    homeMotionTimeoutCache.set(homeId, mins);
    return mins;
  } catch {
    return 5;
  }
}

export function invalidateHomeMotionCache(homeId) {
  homeMotionTimeoutCache.delete(homeId);
}

function key(homeId, room) {
  return `${homeId}::${room}`;
}

function fusedOccupied(state) {
  return state.pir || state.vision;
}

async function setRoomDevicesActive(homeId, room, active) {
  if (!pool) return;
  await pool.query(
    `UPDATE devices
     SET is_active = $3
     WHERE home_id = $1::uuid
       AND room = $2
       AND COALESCE(always_on, false) = false
       AND relay_channel IS NOT NULL`,
    [homeId, room, active]
  );
}

async function writeMotionInflux(homeId, room, occupied) {
  if (!writeApi) return;
  const p = new Point("motion_event")
    .tag("home_id", homeId)
    .tag("room", room)
    .booleanField("occupied", occupied)
    .timestamp(new Date());
  writeApi.writePoint(p);
  await writeApi.flush().catch(() => {});
}

async function applyOccupancy(io, homeId, room, occupied, reason) {
  const lights = occupied;
  const appliances = occupied;

  if (occupied) {
    publish(`home/${homeId}/cmd/appliances`, {
      room,
      action: "on",
      reason: reason || "occupancy_detected",
      timestamp: new Date().toISOString(),
    });
    await setRoomDevicesActive(homeId, room, true);
  } else {
    publish(`home/${homeId}/cmd/appliances`, {
      room,
      action: "off",
      reason: reason || "no_motion",
      timestamp: new Date().toISOString(),
    });
    await setRoomDevicesActive(homeId, room, false);
  }

  await writeMotionInflux(homeId, room, occupied);

  io.to(`home:${homeId}`).emit("motion:update", {
    room,
    occupied,
    lights,
    appliances,
    timestamp: new Date().toISOString(),
  });
}

/**
 * @param {import('socket.io').Server} io
 * @param {{ pir: boolean, vision: boolean, unoccupiedSince: number | null, lastEmittedOccupied: boolean | null }} state
 * @param {string} homeId
 * @param {string} room
 */
async function reconcile(io, homeId, room, state) {
  const occ = fusedOccupied(state);
  const now = Date.now();

  if (occ) {
    state.unoccupiedSince = null;
    if (state.lastEmittedOccupied !== true) {
      await applyOccupancy(io, homeId, room, true, "occupancy_detected");
      state.lastEmittedOccupied = true;
    }
    return;
  }

  if (state.unoccupiedSince == null) {
    state.unoccupiedSince = now;
  }

  const timeoutMs = (await getMotionTimeoutMins(homeId)) * 60_000;
  if (now - state.unoccupiedSince < timeoutMs) return;
  if (state.lastEmittedOccupied === false) return;

  await applyOccupancy(io, homeId, room, false, "no_motion");
  state.lastEmittedOccupied = false;
}

function getState(homeId, room) {
  const k = key(homeId, room);
  if (!roomMap.has(k)) {
    roomMap.set(k, {
      pir: false,
      vision: false,
      unoccupiedSince: null,
      lastEmittedOccupied: null,
    });
  }
  return roomMap.get(k);
}

/**
 * @param {import('socket.io').Server} io
 */
export async function handleMotionMessage(io, homeId, room, data) {
  const state = getState(homeId, room);
  state.pir = data.occupied;
  await reconcile(io, homeId, room, state);
}

/**
 * @param {import('socket.io').Server} io
 */
export async function handleVisionMessage(io, homeId, room, data) {
  const state = getState(homeId, room);
  state.vision = data.person_detected;

  io.to(`home:${homeId}`).emit("vision:update", {
    room,
    person_detected: data.person_detected,
    confidence: data.confidence ?? 0,
    timestamp: data.timestamp ?? new Date().toISOString(),
  });

  if (room.startsWith("zone")) {
    return;
  }

  await reconcile(io, homeId, room, state);
}
