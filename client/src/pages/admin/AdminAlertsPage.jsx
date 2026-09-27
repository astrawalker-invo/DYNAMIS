import { useEffect, useState } from "react";
import { realApi } from "../../api/axios";
import { formatRelTime } from "../../utils/formatters";
import { CardSkeleton } from "../../components/common/LoadingSkeleton";

export function AdminAlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const { data } = await realApi.get("/api/admin/alerts");
        if (!cancelled) setAlerts(data.alerts || []);
      } catch {
        if (!cancelled) setAlerts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <CardSkeleton className="min-h-[200px]" />;

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <h1 className="text-xl font-semibold">All alerts</h1>
      <ul className="space-y-2 text-sm">
        {alerts.map((a) => (
          <li
            key={a.id}
            className="rounded-lg border border-gray-800 bg-gray-900 p-3 flex justify-between gap-2"
          >
            <div>
              <div className="text-gray-500 text-xs">
                {a.home_name} · {a.type} · {a.severity}
              </div>
              <div>{a.message}</div>
            </div>
            <div className="text-gray-600 shrink-0">{formatRelTime(a.created_at)}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
