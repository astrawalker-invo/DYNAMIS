import { useLiveDataStore } from "../../store/liveDataStore";

const zones = [
  { key: "zone1", label: "Zone 1" },
  { key: "zone2", label: "Zone 2" },
  { key: "zone3", label: "Zone 3" },
  { key: "zone4", label: "Zone 4" },
];

export function GrayskullStatusGrid() {
  const grayskull = useLiveDataStore((s) => s.grayskull);
  const hasAnyData = zones.some((zone) => grayskull[zone.key]?.timestamp);

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Grayskull occupancy</h3>
          <p className="text-sm text-gray-500">Live zone occupancy from Grayskull vision data</p>
        </div>
        <span className="text-xs uppercase tracking-[0.2em] text-gray-400">Live</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {zones.map(({ key, label }) => {
          const entry = grayskull[key] || { detected: false, confidence: 0, timestamp: null };
          return (
            <div
              key={key}
              className="rounded-xl border border-gray-800 bg-gray-950 p-4 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-white">{label}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    entry.detected
                      ? "bg-green-500/20 text-green-400 animate-pulse"
                      : "bg-gray-800 text-gray-400"
                  }`}
                >
                  {entry.detected ? "Detected" : "Clear"}
                </span>
              </div>
              <div className="text-sm text-gray-400 space-y-2">
                <div className="flex items-center justify-between">
                  <span>Confidence</span>
                  <span>{Math.round((entry.confidence || 0) * 100)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last update</span>
                  <span>{entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString() : "—"}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {!hasAnyData && (
        <div className="mt-4 rounded-xl border border-dashed border-slate-700 bg-slate-950 p-4 text-sm text-slate-400">
          Waiting for Grayskull vision updates. Your active detection feed will appear here once data arrives.
        </div>
      )}
    </div>
  );
}
