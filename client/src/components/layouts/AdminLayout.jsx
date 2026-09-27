import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useLiveDataStore } from "../../store/liveDataStore";
import { useSocket } from "../../hooks/useSocket";

const nav = [
  ["Overview", "/admin"],
  ["Users", "/admin/users"],
  ["Devices", "/admin/devices"],
  ["Analytics", "/admin/analytics"],
  ["Alerts", "/admin/alerts"],
  ["Settings", "/admin/settings"],
];

export function AdminLayout() {
  useSocket();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const connected = useLiveDataStore((s) => s.connected);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col md:flex-row">
      <aside className="md:w-56 border-b md:border-b-0 md:border-r border-gray-800 bg-gray-900 p-4 flex md:flex-col gap-2 md:gap-1 overflow-x-auto shrink-0">
        {nav.map(([label, to]) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/admin"}
            className={({ isActive }) =>
              `px-3 py-2 rounded-lg text-sm whitespace-nowrap ${
                isActive
                  ? "bg-amber-600 text-white"
                  : "text-gray-300 hover:bg-gray-800"
              }`
            }
          >
            {label}
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="text-left px-3 py-2 rounded-lg text-sm text-blue-300 hover:bg-gray-800"
        >
          User dashboard
        </button>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-gray-800 flex items-center justify-between px-4 bg-gray-900/80">
          <div className="flex items-center gap-2">
            <span className="rounded bg-amber-500/20 text-amber-300 text-xs px-2 py-0.5 border border-amber-500/40">
              Admin
            </span>
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                connected ? "bg-green-400" : "bg-gray-500"
              }`}
            />
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-400">{user?.name}</span>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="text-blue-400 hover:underline"
            >
              Logout
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
