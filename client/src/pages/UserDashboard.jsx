import { useEffect } from "react";
import { realApi } from "../api/axios";
import { useHomeId } from "../hooks/useHomeId";
import { useLiveDataStore } from "../store/liveDataStore";
import { LivePowerMeter } from "../components/dashboard/LivePowerMeter";
import { VoltageStatusBar } from "../components/dashboard/VoltageStatusBar";
import { GrayskullStatusGrid } from "../components/dashboard/GrayskullStatusGrid";
import { DeviceList } from "../components/dashboard/DeviceList";
import { NILMAlertFeed } from "../components/dashboard/NILMAlertFeed";
import { CostCards } from "../components/dashboard/CostCards";
import { UsageLineChart } from "../components/dashboard/UsageLineChart";
import { EspStatusCard } from "../components/dashboard/EspStatusCard";
import { DeviceTimeline } from "../components/dashboard/DeviceTimeline";
import { AlwaysOnCard } from "../components/dashboard/AlwaysOnCard";

export function UserDashboard() {
  const homeId = useHomeId();
  const setDevices = useLiveDataStore((s) => s.setDevices);
  const setCost = useLiveDataStore((s) => s.setCost);

  useEffect(() => {
    if (!homeId) return;
    let cancelled = false;
    (async () => {
      try {
        const [devicesRes, costRes] = await Promise.all([
          realApi.get(`/api/home/${homeId}/devices`),
          realApi.get(`/api/home/${homeId}/cost`),
        ]);
        if (!cancelled) {
          setDevices(devicesRes.data.devices || []);
          setCost(costRes.data || { today: 0, week: 0, month: 0 });
        }
      } catch {
        if (!cancelled) {
          setDevices([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [homeId, setDevices, setCost]);

  if (!homeId) {
    return (
      <div className="text-slate-400 text-sm p-6">
        No home is assigned to your account yet. Ask an admin to link your user to a home.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-0">
      <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/95 to-slate-950/95 p-6 shadow-2xl shadow-slate-950/40">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-300">User dashboard</p>
            <h1 className="text-3xl font-semibold text-white">Live energy and occupancy control</h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-400">
              A polished, modern dashboard that keeps your sensor, power, and vision data in one place.
            </p>
          </div>
          <div className="inline-flex items-center gap-3 rounded-3xl border border-slate-800/80 bg-slate-950/90 px-4 py-3 text-sm text-slate-300 shadow-inner shadow-black/20">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            Live data is updating automatically
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <LivePowerMeter />
        <VoltageStatusBar />
        <CostCards />
      </div>

      <GrayskullStatusGrid />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <UsageLineChart />
        <NILMAlertFeed />
        <EspStatusCard />
      </div>

      <DeviceList />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DeviceTimeline />
        <AlwaysOnCard />
      </div>
    </div>
  );
}
