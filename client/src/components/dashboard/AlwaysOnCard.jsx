import { useMemo } from "react";
import { useLiveDataStore } from "../../store/liveDataStore";
import { formatCost, formatWatts } from "../../utils/formatters";

export function AlwaysOnCard() {
  const devices = useLiveDataStore((s) => s.devices);

  const { baseline, monthly } = useMemo(() => {
    const always = (devices || []).filter((d) => d.always_on);
    const sum = always.reduce((a, d) => a + (d.rated_watts || 0), 0);
    const kwhMonth = (sum * 24 * 30) / 1000;
    const tariff = 8.5;
    return { baseline: sum, monthly: kwhMonth * tariff };
  }, [devices]);

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <h3 className="font-semibold text-gray-200 mb-2">Always-on baseline</h3>
      <div className="text-2xl font-bold">{formatWatts(baseline)}</div>
      <p className="text-xs text-gray-500 mt-1">
        Sum of devices marked always_on (from your device list).
      </p>
      <ul className="mt-3 text-sm text-gray-400 space-y-1 max-h-28 overflow-y-auto">
        {(devices || [])
          .filter((d) => d.always_on)
          .map((d) => (
            <li key={d.id}>
              {d.name}{" "}
              <span className="text-gray-600">({d.rated_watts}W)</span>
            </li>
          ))}
      </ul>
      <div className="mt-3 text-sm text-amber-300">
        Est. monthly cost: {formatCost(monthly)}{" "}
        <span className="text-[10px]">~ Estimated</span>
      </div>
    </div>
  );
}
