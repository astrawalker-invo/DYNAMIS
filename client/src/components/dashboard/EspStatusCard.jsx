import { useLiveDataStore } from "../../store/liveDataStore";
import { formatLux, formatVoltage, formatWatts } from "../../utils/formatters";

function prettyTime(timestamp) {
  if (!timestamp) return "—";
  try {
    return new Date(timestamp).toLocaleTimeString();
  } catch {
    return "—";
  }
}

export function EspStatusCard() {
  const ldr = useLiveDataStore((s) => s.ldr);
  const power = useLiveDataStore((s) => s.power);

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">ESP bridge status</h3>
          <p className="text-sm text-gray-500">Live sensor values from the ESP/MQTT bridge</p>
        </div>
        <span className="text-xs uppercase tracking-[0.2em] text-gray-400">Live</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-800 bg-gray-950 p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-3">LDR / Voltage</div>
          <div className="space-y-3 text-sm text-gray-300">
            <div className="flex justify-between">
              <span>Illuminance</span>
              <span>{formatLux(ldr.lux)}</span>
            </div>
            <div className="flex justify-between">
              <span>Relay</span>
              <span>{ldr.relay || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span>Voltage</span>
              <span>{formatVoltage(ldr.voltage_estimated)}</span>
            </div>
            <div className="flex justify-between">
              <span>Mode</span>
              <span>{ldr.action || "full"}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Last update</span>
              <span>{prettyTime(ldr.timestamp)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-950 p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-3">Power / Source</div>
          <div className="space-y-3 text-sm text-gray-300">
            <div className="flex justify-between">
              <span>Usage</span>
              <span>{formatWatts(power.watts)}</span>
            </div>
            <div className="flex justify-between">
              <span>Voltage</span>
              <span>{formatVoltage(power.voltage)}</span>
            </div>
            <div className="flex justify-between">
              <span>Source</span>
              <span>{power.source || "unknown"}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Last update</span>
              <span>{prettyTime(power.timestamp)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
