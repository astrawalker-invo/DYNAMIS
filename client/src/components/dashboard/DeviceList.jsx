import { useEffect, useState } from "react";
import { realApi } from "../../api/axios";
import { useAuthStore } from "../../store/authStore";
import { useHomeId } from "../../hooks/useHomeId";
import { formatCost } from "../../utils/formatters";
import { CardSkeleton } from "../common/LoadingSkeleton";

export function DeviceList({ showSearch = false }) {
  const homeId = useHomeId();
  const isDemo = useAuthStore((s) => s.isDemo);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [roomFilter, setRoomFilter] = useState("all");

  useEffect(() => {
    if (!homeId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const { data } = await realApi.get(`/api/home/${homeId}/devices`);
        if (!cancelled) setDevices(data.devices || []);
      } catch {
        if (!cancelled) setDevices([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [homeId]);

  if (loading) return <CardSkeleton className="min-h-[200px]" />;

  const tariff = 8.5;
  const filtered = devices.filter((d) => {
    const okRoom = roomFilter === "all" || d.room === roomFilter;
    const okQ =
      !q ||
      d.name.toLowerCase().includes(q.toLowerCase()) ||
      d.room.toLowerCase().includes(q.toLowerCase());
    return okRoom && okQ;
  });

  const rooms = [...new Set(devices.map((d) => d.room))];

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h3 className="font-semibold text-gray-200">Devices</h3>
        {showSearch && (
          <div className="flex flex-wrap gap-2">
            <input
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm"
              placeholder="Search…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select
              className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-sm"
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
            >
              <option value="all">All rooms</option>
              {rooms.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-800">
              <th className="py-2 pr-2">Device</th>
              <th className="py-2 pr-2">Room</th>
              <th className="py-2 pr-2">Rated W</th>
              <th className="py-2 pr-2">Status</th>
              <th className="py-2">Est. cost today</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => {
              const kwhDay = ((d.rated_watts || 0) * (d.is_active ? 8 : 0)) / 1000;
              const cost = kwhDay * tariff;
              return (
                <tr key={d.id} className="border-b border-gray-800/80">
                  <td className="py-2 pr-2">{d.name}</td>
                  <td className="py-2 pr-2 capitalize text-gray-400">{d.room}</td>
                  <td className="py-2 pr-2">{d.rated_watts}</td>
                  <td className="py-2 pr-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        d.is_active ? "bg-green-500/20 text-green-400" : "bg-gray-800 text-gray-400"
                      }`}
                    >
                      {d.is_active ? "ON" : "OFF"}
                    </span>
                  </td>
                  <td className="py-2 text-gray-300">
                    {formatCost(cost)}{" "}
                    <span className="text-[10px] text-amber-400">~ Est.</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-amber-400 mt-3">
        Power and cost are ~ estimated from rated wattage (no CT meter yet).
      </p>
      {isDemo && (
        <p className="text-xs text-gray-500 mt-1">
          Editing devices is disabled in demo mode.
        </p>
      )}
    </div>
  );
}
