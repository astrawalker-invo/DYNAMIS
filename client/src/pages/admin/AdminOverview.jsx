import { useEffect, useState } from "react";
import { realApi } from "../../api/axios";
import { formatWatts } from "../../utils/formatters";
import { CardSkeleton } from "../../components/common/LoadingSkeleton";

export function AdminOverview() {
  const [homes, setHomes] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [h, a, u] = await Promise.all([
          realApi.get("/api/admin/homes"),
          realApi.get("/api/admin/alerts"),
          realApi.get("/api/admin/users"),
        ]);
        if (!cancelled) {
          setHomes(h.data.homes || []);
          setAlerts(a.data.alerts?.slice(0, 8) || []);
          setUserCount((u.data.users || []).length);
        }
      } catch {
        if (!cancelled) {
          setHomes([]);
          setAlerts([]);
          setUserCount(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  const totalWatts = homes.reduce((s, h) => s + (h.estimate_watts || 0), 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <h1 className="text-xl font-semibold">Admin overview</h1>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <Stat label="Homes" value={homes.length} />
        <Stat label="Users" value={userCount} />
        <Stat label="Σ est. power" value={formatWatts(totalWatts)} />
        <Stat label="Alerts (recent)" value={alerts.length} />
      </div>
      <div className="rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-900 text-gray-500">
            <tr>
              <th className="text-left p-3">Home</th>
              <th className="text-left p-3">Est. W</th>
              <th className="text-left p-3">Tariff</th>
            </tr>
          </thead>
          <tbody>
            {homes.map((h) => (
              <tr key={h.id} className="border-t border-gray-800">
                <td className="p-3">{h.name}</td>
                <td className="p-3">{h.estimate_watts}</td>
                <td className="p-3">{h.tariff_rate} ₹/kWh</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <h2 className="text-sm text-gray-400 mb-2">Recent alerts</h2>
        <ul className="space-y-2 text-sm">
          {alerts.map((a) => (
            <li key={a.id} className="rounded-lg border border-gray-800 bg-gray-900 p-3">
              <span className="text-gray-500">{a.home_name || "—"}</span> — {a.message}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-semibold mt-1">{value}</div>
    </div>
  );
}
