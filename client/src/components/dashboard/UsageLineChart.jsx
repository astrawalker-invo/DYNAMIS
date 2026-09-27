import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { realApi } from "../../api/axios";
import { useHomeId } from "../../hooks/useHomeId";
import { formatCost, formatWatts } from "../../utils/formatters";
import { CardSkeleton } from "../common/LoadingSkeleton";

const tooltipStyle = {
  backgroundColor: "#111827",
  border: "1px solid #374151",
  borderRadius: "8px",
};

export function UsageLineChart({ range = "24h" }) {
  const homeId = useHomeId();
  const [mode, setMode] = useState("watts");
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
        const rows = (data.points || []).map((p) => ({
          t: new Date(p.time).getTime(),
          label: new Date(p.time).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          watts: Number(p.watts) || 0,
          rupees: ((Number(p.watts) || 0) / 1000) * 8.5,
        }));
        if (!cancelled) setPoints(rows);
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

  if (loading) return <CardSkeleton className="h-[320px]" />;

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 relative">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-gray-200">Usage</h3>
        <div className="flex gap-1 text-xs">
          <button
            type="button"
            className={`px-2 py-1 rounded ${mode === "watts" ? "bg-blue-600" : "bg-gray-800"}`}
            onClick={() => setMode("watts")}
          >
            Watts
          </button>
          <button
            type="button"
            className={`px-2 py-1 rounded ${mode === "rupees" ? "bg-green-600" : "bg-gray-800"}`}
            onClick={() => setMode("rupees")}
          >
            ₹ (est.)
          </button>
        </div>
      </div>
      {points.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
          No data yet — connect hardware or use demo mode.
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points}>
              <defs>
                <linearGradient id="cgrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={mode === "watts" ? "#60a5fa" : "#34d399"}
                    stopOpacity={0.5}
                  />
                  <stop
                    offset="100%"
                    stopColor={mode === "watts" ? "#1e3a8a" : "#064e3b"}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="label" tick={{ fill: "#9ca3af", fontSize: 10 }} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v) =>
                  mode === "watts" ? formatWatts(v) : formatCost(v)
                }
              />
              <Area
                type="monotone"
                dataKey={mode === "watts" ? "watts" : "rupees"}
                stroke={mode === "watts" ? "#60a5fa" : "#34d399"}
                fillOpacity={1}
                fill="url(#cgrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      <p className="text-[10px] text-amber-400 mt-2">~ Estimated (no CT sensor)</p>
    </div>
  );
}
