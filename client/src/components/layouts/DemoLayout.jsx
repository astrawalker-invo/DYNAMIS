import { Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useLiveDataStore } from "../../store/liveDataStore";
import { useSocket } from "../../hooks/useSocket";
import { DemoBanner } from "../common/DemoBanner";

export function DemoLayout() {
  useSocket();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const connected = useLiveDataStore((s) => s.connected);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <DemoBanner />
      <header className="h-12 border-b border-gray-800 flex items-center justify-between px-4 bg-gray-900/80">
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`h-2 w-2 rounded-full ${
              connected ? "bg-green-400" : "bg-gray-500"
            }`}
          />
          <span className="text-gray-400">Demo session</span>
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
            Exit
          </button>
        </div>
      </header>
      <main className="flex-1 p-4 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
