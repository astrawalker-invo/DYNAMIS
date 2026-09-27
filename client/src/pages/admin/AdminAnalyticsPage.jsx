import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { realApi } from "../../api/axios";
import { CardSkeleton } from "../../components/common/LoadingSkeleton";

export function AdminAnalyticsPage() {
  const [totals, setTotals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const { data } = await realApi.get("/api/admin/analytics");
        if (!cancelled) setTotals(data.totals || []);
      } catch {
        if (!cancelled) setTotals([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const chartData = totals.map((t) => ({
    home: (t.home_id || "").slice(0, 8),
    sum: t.sum_watts_window || 0,
  }));

  if (loading) return <CardSkeleton className="h-72" />;

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <h1 className="text-xl font-semibold">Analytics</h1>
      <p className="text-sm text-gray-500">
        7-day summed power_reading.watts from Influx (per home tag).
      </p>
      {chartData.length === 0 ? (
        <p className="text-gray-500 text-sm">No Influx data yet.</p>
      ) : (
        <div className="h-72 rounded-xl border border-gray-800 bg-gray-900 p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="home" tick={{ fill: "#9ca3af", fontSize: 10 }} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  background: "#111827",
                  border: "1px solid #374151",
                  borderRadius: 8,
                }}
              />
              <Legend />
              <Bar dataKey="sum" name="Σ W (7d window)" fill="#60a5fa" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
