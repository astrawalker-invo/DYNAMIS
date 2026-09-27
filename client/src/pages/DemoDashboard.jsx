import { useEffect } from "react";
import { realApi } from "../api/axios";
import { useHomeId } from "../hooks/useHomeId";
import { useLiveDataStore } from "../store/liveDataStore";
import { DemoProgressBar } from "../components/dashboard/DemoProgressBar";
import { LivePowerMeter } from "../components/dashboard/LivePowerMeter";
import { VoltageStatusBar } from "../components/dashboard/VoltageStatusBar";
import { MotionStatusGrid } from "../components/dashboard/MotionStatusGrid";
import { DeviceList } from "../components/dashboard/DeviceList";
import { NILMAlertFeed } from "../components/dashboard/NILMAlertFeed";
import { CostCards } from "../components/dashboard/CostCards";
import { UsageLineChart } from "../components/dashboard/UsageLineChart";
import { DeviceTimeline } from "../components/dashboard/DeviceTimeline";
import { AlwaysOnCard } from "../components/dashboard/AlwaysOnCard";

export function DemoDashboard() {
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <DemoProgressBar />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div title="Not available in demo">
          <LivePowerMeter />
        </div>
        <VoltageStatusBar />
        <CostCards />
      </div>
      <MotionStatusGrid />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <UsageLineChart />
        <NILMAlertFeed />
      </div>
      <DeviceList />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DeviceTimeline />
        <AlwaysOnCard />
      </div>
    </div>
  );
}
