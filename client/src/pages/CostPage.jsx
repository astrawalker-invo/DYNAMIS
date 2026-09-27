import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { realApi } from "../api/axios";
import { useHomeId } from "../hooks/useHomeId";
import { formatCost } from "../utils/formatters";
import { CostCards } from "../components/dashboard/CostCards";
import { CardSkeleton } from "../components/common/LoadingSkeleton";

export function CostPage() {
  const homeId = useHomeId();
  const [devices, setDevices] = useState([]);
  const [tariff, setTariff] = useState(8.5);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!homeId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [dRes, cRes] = await Promise.all([
          realApi.get(`/api/home/${homeId}/devices`),
          realApi.get(`/api/home/${homeId}/cost`),
        ]);
        if (!cancelled) {
          setDevices(dRes.data.devices || []);
          setTariff(Number(cRes.data.tariff_rate ?? 8.5));
        }
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

  const chartData = devices.map((d) => {
    const kwhDay = ((d.rated_watts || 0) * (d.is_active ? 8 : 0)) / 1000;
    return {
      name: d.name,
      cost: kwhDay * tariff,
    };
  });

  if (!homeId) return <p className="text-gray-500 text-sm">No home assigned.</p>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <h1 className="text-xl font-semibold">Cost</h1>
      <CostCards />
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
        <h2 className="text-sm font-medium text-gray-400 mb-2">
          Cost by device (today, est.)
        </h2>
        {loading ? (
          <CardSkeleton className="h-56" />
        ) : chartData.length === 0 ? (
          <p className="text-gray-500 text-sm">No devices.</p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 9 }} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    background: "#111827",
                    border: "1px solid #374151",
                    borderRadius: 8,
                  }}
                  formatter={(v) => [formatCost(v), "Est."]}
                />
                <Bar dataKey="cost" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <p className="text-xs text-gray-500 mt-3">
          Tariff: {tariff} ₹/kWh · Projected monthly uses ~30× today&apos;s snapshot
          (rough).
        </p>
      </div>
    </div>
  );
}
