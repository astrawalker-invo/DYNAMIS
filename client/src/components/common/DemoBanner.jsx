import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { jwtExpMs } from "../../utils/jwt";

function formatMmSs(ms) {
  if (ms <= 0) return "00:00";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function DemoBanner() {
  const token = useAuthStore((s) => s.token);
  const navigate = useNavigate();
  const expMs = useMemo(() => jwtExpMs(token), [token]);
  const [left, setLeft] = useState(0);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      if (!expMs) return;
      const l = expMs - Date.now();
      setLeft(l);
      if (l <= 0) setExpired(true);
    }, 500);
    return () => clearInterval(t);
  }, [expMs]);

  return (
    <>
      <div className="sticky top-0 z-50 bg-yellow-400 text-gray-900 text-sm px-4 py-2 flex flex-wrap items-center justify-between gap-2 shadow">
        <span className="font-medium">
          DEMO MODE — Viewing pre-recorded data. No real devices connected.
        </span>
        <span className="font-mono font-semibold">Session: {formatMmSs(left)}</span>
      </div>
      {expired &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full text-center">
              <h2 className="text-lg font-semibold text-white mb-2">
                Demo session expired
              </h2>
              <p className="text-gray-400 text-sm mb-4">
                Sign in again or start a new demo from the landing page.
              </p>
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-blue-600 text-white"
                onClick={() => {
                  useAuthStore.getState().logout();
                  navigate("/login");
                }}
              >
                OK
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
