import { useEffect, useState } from "react";
import { realApi } from "../../api/axios";
import { useHomeId } from "../../hooks/useHomeId";
import { CardSkeleton } from "../common/LoadingSkeleton";

export function DeviceTimeline() {
  const homeId = useHomeId();
  const [devices, setDevices] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!homeId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [devRes, motRes] = await Promise.all([
          realApi.get(`/api/home/${homeId}/devices`),
          realApi.get(`/api/home/${homeId}/motion/events`),
        ]);
        if (!cancelled) {
          setDevices(devRes.data.devices || []);
          setEvents(motRes.data.events || []);
        }
      } catch {
        if (!cancelled) {
          setDevices([]);
          setEvents([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [homeId]);

  if (loading) return <CardSkeleton className="h-[200px]" />;

  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date();
  dayEnd.setHours(23, 59, 59, 999);
  const span = dayEnd - dayStart;

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <h3 className="font-semibold text-gray-200 mb-3">Today (motion log)</h3>
      <div className="text-[10px] text-gray-500 flex justify-between mb-1">
        <span>00:00</span>
        <span>23:59</span>
      </div>
      <div className="space-y-2">
        {devices.slice(0, 8).map((d) => {
          const evs = events.filter(
            (e) => e.room === d.room && new Date(e.time) >= dayStart
          );
          return (
            <div key={d.id} className="flex items-center gap-2 text-xs">
              <div className="w-28 truncate text-gray-400">{d.name}</div>
              <div className="flex-1 h-3 bg-gray-800 rounded relative overflow-hidden">
                {evs.map((e, i) => {
                  const t = new Date(e.time).getTime();
                  const left = ((t - dayStart) / span) * 100;
                  const w = 3;
                  return (
                    <div
                      key={i}
                      className={`absolute top-0 h-full rounded ${
                        e.occupied ? "bg-green-500/70" : "bg-gray-600/50"
                      }`}
                      style={{ left: `${Math.max(0, Math.min(100 - w, left))}%`, width: `${w}%` }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-gray-500 mt-2">
        Segments from motion events (~ estimated occupancy).
      </p>
    </div>
  );
}
