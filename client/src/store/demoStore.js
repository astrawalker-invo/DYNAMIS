import { create } from "zustand";

export const useDemoStore = create((set) => ({
  progressPercent: 0,
  setProgress: (progressPercent) => set({ progressPercent }),
}));
