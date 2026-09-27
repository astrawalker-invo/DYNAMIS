import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { realApi } from "../api/axios";
import { useAuthStore } from "../store/authStore";
import { useHomeId } from "../hooks/useHomeId";
import { formatRelTime } from "../utils/formatters";
import { NILMAlertFeed } from "../components/dashboard/NILMAlertFeed";
import { CardSkeleton } from "../components/common/LoadingSkeleton";

export function AlertsPage() {
  const homeId = useHomeId();
  const isDemo = useAuthStore((s) => s.isDemo);
  const [filter, setFilter] = useState("all");
  const [nilm, setNilm] = useState([]);
  const [motion, setMotion] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!homeId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [n, m] = await Promise.all([
          isDemo
            ? Promise.resolve({ data: { alerts: [] } })
            : realApi.get(`/api/home/${homeId}/nilm/events`),
          realApi.get(`/api/home/${homeId}/motion/events`),
        ]);
        if (!cancelled) {
          setNilm(n.data.alerts || []);
          setMotion(m.data.events || []);
        }
      } catch {
        if (!cancelled) {
          setNilm([]);
          setMotion([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [homeId, isDemo]);

  async function ackAll() {
    if (isDemo) {
      toast.error("Not available in demo");
      return;
    }
    try {
      await realApi.put(`/api/home/${homeId}/alerts/ack`);
      setNilm((prev) => prev.map((a) => ({ ...a, acknowledged: true })));
      toast.success("Marked acknowledged");
    } catch {
      toast.error("Failed");
    }
  }

  if (!homeId) return <p className="text-gray-500 text-sm">No home assigned.</p>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Alerts</h1>
        <button
          type="button"
          disabled={isDemo}
          title={isDemo ? "Not available in demo" : ""}
          onClick={ackAll}
          className="text-sm px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 disabled:opacity-40"
        >
          Mark NILM alerts acknowledged
        </button>
      </div>
      <div className="flex gap-2 text-xs">
        {["all", "nilm", "motion", "voltage"].map((f) => (
          <button
            key={f}
            type="button"
            className={`px-2 py-1 rounded capitalize ${
              filter === f ? "bg-blue-600" : "bg-gray-800"
            }`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>
      {(filter === "all" || filter === "nilm") && (
        <div>
          <h2 className="text-sm text-gray-400 mb-2">NILM (DB)</h2>
          {loading ? (
            <CardSkeleton />
          ) : nilm.length === 0 ? (
            <p className="text-gray-500 text-sm">No NILM alerts in database.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {nilm.map((a) => (
                <li
                  key={a.id}
                  className="rounded-lg border border-gray-800 bg-gray-900 p-3 flex justify-between gap-2"
                >
                  <span>{a.message}</span>
                  <span className="text-gray-500 shrink-0">
                    {formatRelTime(a.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <h2 className="text-sm text-gray-400 mt-6 mb-2">Live NILM (socket)</h2>
          <NILMAlertFeed unlimited />
        </div>
      )}
      {(filter === "all" || filter === "motion") && (
        <div>
          <h2 className="text-sm text-gray-400 mb-2">Motion log</h2>
          {loading ? (
            <CardSkeleton />
          ) : (
            <ul className="space-y-1 text-sm max-h-80 overflow-y-auto">
              {motion.map((e, i) => (
                <li key={i} className="text-gray-400 flex justify-between gap-2">
                  <span>
                    {e.room} — {String(e.occupied)}
                  </span>
                  <span className="text-gray-600">{formatRelTime(e.time)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
