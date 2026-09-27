import { useEffect, useState } from "react";
import { realApi } from "../../api/axios";
import { CardSkeleton } from "../../components/common/LoadingSkeleton";

export function AdminDevicesPage() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const { data } = await realApi.get("/api/admin/devices");
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
  }, []);

  if (loading) return <CardSkeleton className="min-h-[200px]" />;

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <h1 className="text-xl font-semibold">All devices</h1>
      <div className="rounded-xl border border-gray-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-900 text-gray-500">
            <tr>
              <th className="text-left p-3">Home</th>
              <th className="text-left p-3">Device</th>
              <th className="text-left p-3">Room</th>
              <th className="text-left p-3">W</th>
              <th className="text-left p-3">Active</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((d) => (
              <tr key={d.id} className="border-t border-gray-800">
                <td className="p-3">{d.home_name}</td>
                <td className="p-3">{d.name}</td>
                <td className="p-3 capitalize">{d.room}</td>
                <td className="p-3">{d.rated_watts}</td>
                <td className="p-3">{d.is_active ? "yes" : "no"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
