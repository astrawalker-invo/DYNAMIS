import { create } from "zustand";
import { realApi } from "../api/axios";
import { decodeJwtPayload } from "../utils/jwt";

const STORAGE_KEY = "energy_auth";

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { token: null, user: null };
    return JSON.parse(raw);
  } catch {
    return { token: null, user: null };
  }
}

function persist(token, user) {
  if (token && user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

const persisted = loadPersisted();

export const useAuthStore = create((set, get) => ({
  token: persisted.token,
  user: persisted.user,
  isAuthenticated: Boolean(persisted.token),
  isDemo: persisted.user?.role === "demo",

  login: async (email, password) => {
    const { data } = await realApi.post("/api/auth/login", { email, password });
    const user = {
      ...data.user,
      demo_home_id: data.user?.demo_home_id ?? null,
    };
    persist(data.token, user);
    set({
      token: data.token,
      user,
      isAuthenticated: true,
      isDemo: user.role === "demo",
    });
  },

  loginDemo: async () => {
    const { data } = await realApi.post("/api/auth/demo");
    const user = {
      ...data.user,
      demo_home_id: data.demo_home_id,
    };
    persist(data.token, user);
    set({
      token: data.token,
      user,
      isAuthenticated: true,
      isDemo: true,
    });
  },

  register: async (name, email, password) => {
    const { data } = await realApi.post("/api/auth/register", {
      name,
      email,
      password,
    });
    const user = data.user;
    persist(data.token, user);
    set({
      token: data.token,
      user,
      isAuthenticated: true,
      isDemo: false,
    });
  },

  logout: () => {
    persist(null, null);
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      isDemo: false,
    });
  },

  isAdmin: () => get().user?.role === "admin",

  bootstrapFromStorage: () => {
    const { token, user } = loadPersisted();
    if (token && user) {
      set({
        token,
        user,
        isAuthenticated: true,
        isDemo: user.role === "demo",
      });
    }
  },

  roleFromToken: () => {
    const p = decodeJwtPayload(get().token);
    return p?.role || get().user?.role;
  },
}));
