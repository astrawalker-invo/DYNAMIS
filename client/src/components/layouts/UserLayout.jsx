import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { useLiveDataStore } from "../../store/liveDataStore";
import { useSocket } from "../../hooks/useSocket";

const nav = [
  ["Dashboard", "/dashboard"],
  ["Devices", "/dashboard/devices"],
  ["Usage", "/dashboard/usage"],
  ["Cost", "/dashboard/cost"],
  ["Alerts", "/dashboard/alerts"],
  ["Settings", "/dashboard/settings"],
];

export function UserLayout() {
  useSocket();
  const user = useAuthStore((s) => s.user);
  const isAdmin = useAuthStore((s) => s.user?.role === "admin");
  const logout = useAuthStore((s) => s.logout);
  const connected = useLiveDataStore((s) => s.connected);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div
        className={`fixed inset-0 z-30 bg-black/50 transition-opacity duration-300 md:hidden ${
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      />
      <div className="md:flex">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-72 transform border-r border-slate-800 bg-slate-900 p-6 transition duration-300 md:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-sky-400">Navigation</p>
              <h2 className="mt-2 text-xl font-semibold text-white">MPC Control</h2>
            </div>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-800 text-slate-300 transition hover:bg-slate-700 md:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2">
            {nav.map(([label, to]) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/dashboard"}
                className={({ isActive }) =>
                  `block rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-sky-500 text-slate-950 shadow-sm shadow-sky-500/20"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`
                }
                onClick={() => setSidebarOpen(false)}
              >
                {label}
              </NavLink>
            ))}
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setSidebarOpen(false);
                navigate("/admin");
              }}
              className="mt-6 w-full rounded-2xl bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
            >
              Admin Panel
            </button>
          )}

          <div className="mt-10 rounded-3xl border border-slate-800 bg-slate-950/90 p-4 text-sm text-slate-400">
            <p className="font-medium text-slate-200">Quick stats</p>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="rounded-2xl bg-slate-900/95 p-3">Live sensor sync</div>
              <div className="rounded-2xl bg-slate-900/95 p-3">Energy monitoring</div>
            </div>
          </div>
        </aside>

        <div className="md:pl-72">
          <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/95 px-4 py-3 backdrop-blur-xl md:px-6">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-200 transition hover:border-slate-700 hover:bg-slate-800 md:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
              >
                <span className="text-lg">☰</span>
              </button>

              <div className="flex-1 text-center">
                <p className="text-xs uppercase tracking-[0.32em] text-sky-400">Platform</p>
                <p className="text-lg font-semibold text-white">MPC Dashboard</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-900/90 px-3 py-2 text-sm text-slate-300">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      connected ? "bg-emerald-400 animate-pulse" : "bg-slate-600"
                    }`}
                  />
                  <span>{connected ? "Live" : "Offline"}</span>
                </div>

                <div className="hidden min-w-[170px] flex-col items-end gap-1 text-right sm:flex">
                  <span className="text-sm font-semibold text-white truncate">{user?.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      navigate("/login");
                    }}
                    className="text-sky-400 transition hover:text-sky-300"
                  >
                    Logout
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-200 transition hover:border-slate-700 hover:bg-slate-800 sm:hidden"
                  aria-label="Logout"
                >
                  ↗
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 overflow-auto pb-24 md:pb-6">
            <Outlet />
          </main>
        </div>
      </div>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-slate-800 bg-slate-950 flex justify-around py-2 text-[10px] text-slate-400">
        {nav.slice(0, 5).map(([label, to]) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 ${isActive ? "text-sky-400" : ""}`
            }
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
            {label.split(" ")[0]}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
