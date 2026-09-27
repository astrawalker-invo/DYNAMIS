import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { realApi } from "../../api/axios";
import { useHomeId } from "../../hooks/useHomeId";
import { formatCost } from "../../utils/formatters";
import { CardSkeleton } from "../common/LoadingSkeleton";

export function UsageBarChart() {
  const homeId = useHomeId();
  const [range, setRange] = useState("7d");
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!homeId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const { data } = await realApi.get(`/api/home/${homeId}/power/history`, {
          params: { range },
        });
        const raw = data.points || [];
        const buckets = bucketByDay(raw);
        if (!cancelled) setPoints(buckets);
      } catch {
        if (!cancelled) setPoints([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [homeId, range]);

  const data = useMemo(() => points, [points]);

  if (loading) return <CardSkeleton className="h-[300px]" />;

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-gray-200">Daily energy (est.)</h3>
        <div className="flex gap-1 text-xs">
          <button
            type="button"
            className={`px-2 py-1 rounded ${range === "7d" ? "bg-blue-600" : "bg-gray-800"}`}
            onClick={() => setRange("7d")}
          >
            7d
          </button>
          <button
            type="button"
            className={`px-2 py-1 rounded ${range === "30d" ? "bg-blue-600" : "bg-gray-800"}`}
            onClick={() => setRange("30d")}
          >
            30d
          </button>
        </div>
      </div>
      {data.length === 0 ? (
        <div className="h-56 flex items-center justify-center text-gray-500 text-sm">
          No historical data yet.
        </div>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="day" tick={{ fill: "#9ca3af", fontSize: 10 }} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111827",
                  border: "1px solid #374151",
                  borderRadius: 8,
                }}
                formatter={(v, _n, item) => {
                  const cost = item?.payload?.cost;
                  return [
                    `${Number(v).toFixed(2)} kWh` +
                      (cost != null ? ` · ${formatCost(cost)}` : ""),
                    "~ Est.",
                  ];
                }}
              />
              <Bar dataKey="kwh" fill="url(#barGrad)" radius={[4, 4, 0, 0]} />
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#1e3a8a" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function bucketByDay(points) {
  const map = new Map();
  for (const p of points) {
    const d = new Date(p.time);
    const key = d.toDateString();
    if (!map.has(key)) map.set(key, { sum: 0, n: 0, date: d });
    const b = map.get(key);
    b.sum += Number(p.watts) || 0;
    b.n += 1;
  }
  const tariff = 8.5;
  return [...map.values()].map((b) => {
    const avg = b.n ? b.sum / b.n : 0;
    const kwh = (avg * 24) / 1000;
    return {
      day: b.date.toLocaleDateString(undefined, { day: "2-digit", month: "short" }),
      kwh,
      cost: kwh * tariff,
    };
  });
}
