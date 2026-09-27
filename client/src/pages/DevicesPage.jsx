import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { realApi } from "../api/axios";
import { useAuthStore } from "../store/authStore";
import { useHomeId } from "../hooks/useHomeId";
import { formatCost } from "../utils/formatters";
import { CardSkeleton } from "../components/common/LoadingSkeleton";

export function DevicesPage() {
  const homeId = useHomeId();
  const isDemo = useAuthStore((s) => s.isDemo);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [room, setRoom] = useState("all");

  useEffect(() => {
    if (!homeId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const { data } = await realApi.get(`/api/home/${homeId}/devices`);
        if (!cancelled) setDevices(data.devices || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [homeId]);

  async function saveWatts(id, rated_watts) {
    if (isDemo) {
      toast.error("Not available in demo");
      return;
    }
    try {
      await realApi.put(`/api/home/${homeId}/devices/${id}`, { rated_watts });
      setDevices((prev) =>
        prev.map((d) => (d.id === id ? { ...d, rated_watts } : d))
      );
      toast.success("Saved");
    } catch {
      toast.error("Save failed");
    }
  }

  if (!homeId) return <p className="text-gray-500 text-sm">No home assigned.</p>;
  if (loading) return <CardSkeleton className="min-h-[240px]" />;

  const rooms = [...new Set(devices.map((d) => d.room))];
  const filtered = devices.filter((d) => {
    const okR = room === "all" || d.room === room;
    const okQ =
      !q ||
      d.name.toLowerCase().includes(q.toLowerCase()) ||
      d.room.toLowerCase().includes(q.toLowerCase());
    return okR && okQ;
  });

  const tariff = 8.5;

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <h1 className="text-xl font-semibold">Devices</h1>
      <div className="flex flex-wrap gap-2">
        <input
          placeholder="Search…"
          className="flex-1 min-w-[160px] rounded-lg bg-gray-900 border border-gray-800 px-3 py-2 text-sm"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="rounded-lg bg-gray-900 border border-gray-800 px-3 py-2 text-sm"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
        >
          <option value="all">All rooms</option>
          {rooms.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <div className="rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-900 text-gray-500">
            <tr>
              <th className="text-left p-3">Device</th>
              <th className="text-left p-3">Room</th>
              <th className="text-left p-3">Rated W</th>
              <th className="text-left p-3">Est. today</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <DeviceRow
                key={d.id}
                d={d}
                tariff={tariff}
                disabled={isDemo}
                onSave={(w) => saveWatts(d.id, w)}
              />
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-amber-400">~ Estimated from rated wattage</p>
    </div>
  );
}

function DeviceRow({ d, tariff, disabled, onSave }) {
  const [val, setVal] = useState(String(d.rated_watts));
  useEffect(() => {
    setVal(String(d.rated_watts));
  }, [d.rated_watts]);
  const cost = ((Number(val) || 0) * (d.is_active ? 8 : 0) * tariff) / 1000;
  return (
    <tr className="border-t border-gray-800">
      <td className="p-3">{d.name}</td>
      <td className="p-3 capitalize text-gray-400">{d.room}</td>
      <td className="p-3">
        <input
          type="number"
          className="w-24 bg-gray-950 border border-gray-800 rounded px-2 py-1 disabled:opacity-50"
          title={disabled ? "Not available in demo" : ""}
          disabled={disabled}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={() => onSave(Number(val))}
        />
      </td>
      <td className="p-3 text-gray-300">
        {formatCost(cost)} <span className="text-[10px] text-amber-400">~ Est.</span>
      </td>
    </tr>
  );
}
