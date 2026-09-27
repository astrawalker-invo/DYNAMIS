import { useLiveDataStore } from "../../store/liveDataStore";
import { formatCost } from "../../utils/formatters";

export function CostCards() {
  const cost = useLiveDataStore((s) => s.cost);

  const cards = [
    { label: "Today", value: cost.today, icon: "☀️", kwh: cost.today / 8.5 },
    { label: "This week", value: cost.week, icon: "📅", kwh: cost.week / 8.5 },
    { label: "This month", value: cost.month, icon: "🗓️", kwh: cost.month / 8.5 },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-xl border border-gray-800 bg-gray-900 p-4 flex flex-col gap-1 transition-transform duration-300 hover:scale-[1.02]"
        >
          <div className="flex items-center justify-between text-gray-400 text-sm">
            <span>{c.label}</span>
            <span>{c.icon}</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {formatCost(c.value)}{" "}
            <span className="text-xs font-normal text-amber-400">~ Est.</span>
          </div>
          <div className="text-xs text-gray-500">
            ≈ {(c.kwh || 0).toFixed(2)} kWh (rough)
          </div>
        </div>
      ))}
    </div>
  );
}
