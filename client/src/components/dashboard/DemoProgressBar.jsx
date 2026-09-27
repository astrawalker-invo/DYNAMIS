import { useDemoStore } from "../../store/demoStore";

export function DemoProgressBar() {
  const p = useDemoStore((s) => s.progressPercent);
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-3 mb-4">
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>24h replay progress</span>
        <span>{p.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-500"
          style={{ width: `${Math.min(100, p)}%` }}
        />
      </div>
    </div>
  );
}
