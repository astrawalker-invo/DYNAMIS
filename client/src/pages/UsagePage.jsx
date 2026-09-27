import { useLiveDataStore } from "../store/liveDataStore";
import { formatWatts } from "../utils/formatters";
import { UsageLineChart } from "../components/dashboard/UsageLineChart";
import { UsageBarChart } from "../components/dashboard/UsageBarChart";

export function UsagePage() {
  const watts = useLiveDataStore((s) => s.power.watts);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <h1 className="text-xl font-semibold">Usage</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <div className="text-gray-500">Live (socket)</div>
          <div className="text-lg font-bold mt-1">{formatWatts(watts)}</div>
          <span className="text-[10px] text-amber-400">~ Estimated</span>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-gray-500">
          Peak / lowest / averages are derived from history once enough points exist
          in InfluxDB.
        </div>
      </div>
      <UsageLineChart />
      <UsageBarChart />
    </div>
  );
}
