import { useLiveDataStore } from "../../store/liveDataStore";
import { formatLux, formatVoltage } from "../../utils/formatters";

const MIN = 180;
const MAX = 240;

export function VoltageStatusBar() {
  const ldr = useLiveDataStore((s) => s.ldr);
  const v = ldr.voltage_estimated || 220;
  const pct = Math.max(0, Math.min(100, ((v - MIN) / (MAX - MIN)) * 100));
  const action = ldr.action || "full";
  const color =
    action === "dim" ? "bg-orange-500" : action === "medium" ? "bg-amber-400" : "bg-blue-500";
  const label =
    action === "dim"
      ? `Auto-dimmed — ${formatLux(ldr.lux)}`
      : action === "medium"
        ? `Balanced — ${formatLux(ldr.lux)}`
        : `Full voltage — ${formatLux(ldr.lux)}`;

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 h-full flex flex-col justify-between">
      <div>
        <div className="text-sm text-gray-400 mb-3">Voltage (estimated)</div>
        <div className="relative h-3 rounded-full bg-gray-800 overflow-hidden">
          <div
            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${color}`}
            style={{ width: `${pct}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded shadow"
            style={{ left: `calc(${pct}% - 2px)` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-gray-500 mt-1">
          <span>{MIN}V</span>
          <span>{MAX}V</span>
        </div>
      </div>
      <div>
        <div className="mt-4 text-2xl font-semibold text-white">{formatVoltage(v)}</div>
        <div className="text-xs text-gray-400 mt-1">{label}</div>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-gray-800 bg-gray-950 px-3 py-1 text-xs text-gray-400">
          <span className="h-2 w-2 rounded-full bg-slate-500" />
          {formatLux(ldr.lux)} lux
        </div>
      </div>
    </div>
  );
}
