import { useLiveDataStore } from "../../store/liveDataStore";
import { formatRelTime } from "../../utils/formatters";

export function NILMAlertFeed({ unlimited = false }) {
  const alerts = useLiveDataStore((s) => s.nilmAlerts);

  return (
    <div
      className={`rounded-xl border border-gray-800 bg-gray-900 p-4 flex flex-col ${
        unlimited ? "" : "max-h-[300px]"
      } overflow-hidden`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-200">NILM feed</h3>
        <span className="text-xs uppercase tracking-[0.2em] text-gray-500">Alerts</span>
      </div>
      <div className={`space-y-2 overflow-y-auto pr-1 ${unlimited ? "" : "max-h-[240px]"}`}>
        {alerts.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-700 bg-gray-950 p-4 text-sm text-gray-500">
            No device events yet. NILM alerts will appear here when load changes are detected.
          </div>
        )}
        {alerts.map((a) => (
          <div
            key={a.id || `${a.device}-${a.timestamp}`}
            className="rounded-lg border border-gray-800 bg-gray-950/80 p-3 transition-all hover:border-blue-500/40"
          >
            <div className="flex justify-between gap-2">
              <span className="font-medium text-gray-200">{a.device}</span>
              <span className="text-xs text-gray-500">{formatRelTime(a.timestamp)}</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {a.status?.toUpperCase?.() || ""} · {a.watts}W
            </div>
            <div className="mt-3 h-1.5 rounded bg-gray-800 overflow-hidden">
              <div
                className={`h-full rounded ${
                  (a.confidence || 0) >= 0.8
                    ? "bg-green-500"
                    : (a.confidence || 0) >= 0.6
                      ? "bg-amber-400"
                      : "bg-red-400"
                }`}
                style={{ width: `${Math.round((a.confidence || 0) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-gray-500">
              <span>Confidence {(a.confidence * 100).toFixed(0)}%</span>
              <span className="text-amber-400">
                {a.source === "mqtt" ? "Live NILM event" : "~ Estimated"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
