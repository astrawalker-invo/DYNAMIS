import { useLiveDataStore } from "../../store/liveDataStore";
import { formatWatts, formatVoltage, getWattsColor } from "../../utils/formatters";

const MAX = 3000;

export function LivePowerMeter() {
  const watts = useLiveDataStore((s) => s.power.watts);
  const voltage = useLiveDataStore((s) => s.power.voltage);
  const source = useLiveDataStore((s) => s.power.source);
  const pct = Math.min(100, (watts / MAX) * 100);
  const hasPowerData = watts > 0;
  const color = hasPowerData
    ? getWattsColor(watts) === "green"
      ? "#4ade80"
      : getWattsColor(watts) === "amber"
        ? "#fbbf24"
        : "#f87171"
    : "#64748b";

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-500">
      <div
        className="absolute inset-0 opacity-15 pointer-events-none transition-transform duration-500"
        style={{
          transform: `scale(${1 + (hasPowerData ? watts / 8000 : 0.2)})`,
          boxShadow: `0 0 60px 20px ${color}`,
        }}
      />
      <svg width="200" height="200" viewBox="0 0 200 200" className="relative z-10">
        <circle cx="100" cy="100" r="88" fill="none" stroke="#1f2937" strokeWidth="14" />
        <circle
          cx="100"
          cy="100"
          r="88"
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeDasharray={`${(pct / 100) * 553} 553`}
          strokeLinecap="round"
          transform="rotate(-90 100 100)"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pt-4 text-center">
        <div className="text-3xl font-bold tracking-tight">{formatWatts(watts)}</div>
        <div className="text-xs text-gray-400 mt-1">
          {formatVoltage(voltage)} · {" "}
          <span className="text-amber-300">
            {hasPowerData ? (source === "estimated" ? "Estimated" : "Live device") : "Sensor idle"}
          </span>
        </div>
        {!hasPowerData && (
          <span className="mt-3 px-3 py-1 rounded-full bg-gray-800 text-[10px] uppercase tracking-wide text-gray-400 border border-gray-700">
            Awaiting power data
          </span>
        )}
      </div>
    </div>
  );
}
