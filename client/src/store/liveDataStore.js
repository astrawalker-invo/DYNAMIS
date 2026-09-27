import { create } from "zustand";

const initialMotion = {
  bedroom: { occupied: false, lights: false, appliances: false },
  living: { occupied: false, lights: false, appliances: false },
  kitchen: { occupied: false, lights: false, appliances: false },
};

const initialGrayskull = {
  zone1: { detected: false, confidence: 0, timestamp: null },
  zone2: { detected: false, confidence: 0, timestamp: null },
  zone3: { detected: false, confidence: 0, timestamp: null },
  zone4: { detected: false, confidence: 0, timestamp: null },
};

export const useLiveDataStore = create((set) => ({
  power: { watts: 0, voltage: 230, current: 0, source: "mqtt", timestamp: null },
  ldr: {
    lux: 0,
    relay: "full",
    voltage_estimated: 220,
    action: "",
    timestamp: null,
  },
  motion: { ...initialMotion },
  grayskull: { ...initialGrayskull },
  nilmAlerts: [],
  cost: { today: 0, week: 0, month: 0 },
  devices: [],
  connected: false,

  setPower: (p) => set({ power: { ...p } }),
  setLdr: (l) => set({ ldr: { ...l } }),
  setMotion: (partial) =>
    set((s) => ({
      motion: {
        ...s.motion,
        [partial.room]: {
          occupied: partial.occupied,
          lights: partial.lights ?? partial.occupied,
          appliances: partial.appliances ?? partial.occupied,
        },
      },
    })),
  setGrayskull: (partial) =>
    set((s) => ({
      grayskull: {
        ...s.grayskull,
        [partial.room]: {
          detected: partial.person_detected,
          confidence: partial.confidence ?? 0,
          timestamp: partial.timestamp ?? new Date().toISOString(),
        },
      },
    })),
  addNilmAlert: (a) =>
    set((s) => ({
      nilmAlerts: [{ ...a, id: `${Date.now()}` }, ...s.nilmAlerts].slice(0, 20),
    })),

  setCost: (c) => set({ cost: { ...c } }),
  setDevices: (devices) => set({ devices }),
  setConnected: (connected) => set({ connected }),
  resetMotion: () => set({ motion: { ...initialMotion } }),
}));
