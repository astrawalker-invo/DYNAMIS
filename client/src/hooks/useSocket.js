import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/authStore";
import { useLiveDataStore } from "../store/liveDataStore";
import { useDemoStore } from "../store/demoStore";

const url = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || "http://localhost:5000";

export function useSocket() {
  const token = useAuthStore((s) => s.token);
  const isDemo = useAuthStore((s) => s.isDemo);
  const socketRef = useRef(null);
  const lostToast = useRef(null);

  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      useLiveDataStore.getState().setConnected(false);
      return;
    }

    const socket = io(url, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30_000,
      randomizationFactor: 0.5,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      useLiveDataStore.getState().setConnected(true);
      if (lostToast.current) {
        toast.dismiss(lostToast.current);
        lostToast.current = null;
      }
      toast.success("Connected to live server", { duration: 3000 });
    });

    socket.on("disconnect", () => {
      useLiveDataStore.getState().setConnected(false);
      if (!lostToast.current) {
        lostToast.current = toast.error("Connection lost — retrying…", {
          duration: Infinity,
        });
      }
    });

    socket.on("connect_error", () => {
      useLiveDataStore.getState().setConnected(false);
    });

    socket.on("power:update", (p) => {
      useLiveDataStore.getState().setPower(p);
    });
    socket.on("ldr:update", (l) => {
      useLiveDataStore.getState().setLdr(l);
    });
    socket.on("motion:update", (m) => {
      useLiveDataStore.getState().setMotion(m);
    });
    socket.on("vision:update", (v) => {
      useLiveDataStore.getState().setGrayskull(v);
    });
    socket.on("nilm:alert", (a) => {
      useLiveDataStore.getState().addNilmAlert(a);
      toast(`NILM: ${a.device} ~${a.watts}W`, {
        icon: "⚡",
        style: { background: "#1f2937", color: "#fbbf24" },
      });
    });
    socket.on("cost:update", (c) => {
      useLiveDataStore.getState().setCost(c);
    });
    socket.on("demo:tick", (d) => {
      if (isDemo) useDemoStore.getState().setProgress(d.progress_percent ?? 0);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, isDemo]);
}
