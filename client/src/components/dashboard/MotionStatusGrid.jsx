import { useLiveDataStore } from "../../store/liveDataStore";

const rooms = [
  { key: "bedroom", label: "Bedroom" },
  { key: "living", label: "Living Room" },
  { key: "kitchen", label: "Kitchen" },
];

export function MotionStatusGrid() {
  const motion = useLiveDataStore((s) => s.motion);
  const hasAnyData = rooms.some((room) => motion[room.key]?.occupied || motion[room.key]?.lights || motion[room.key]?.appliances);

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Motion & occupancy</h3>
          <p className="text-sm text-gray-500">Room occupancy and auto-control status</p>
        </div>
        <span className="text-xs uppercase tracking-[0.2em] text-gray-400">Live</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {rooms.map(({ key, label }) => {
          const m = motion[key] || {
            occupied: false,
            lights: false,
            appliances: false,
          };
          return (
            <div
              key={key}
              className="rounded-xl border border-gray-800 bg-gray-950 p-4 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-white">{label}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    m.occupied
                      ? "bg-green-500/20 text-green-400 animate-pulse"
                      : "bg-gray-800 text-gray-400"
                  }`}
                >
                  {m.occupied ? "Occupied" : "No motion"}
                </span>
              </div>
              <div className="flex flex-col gap-2 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-3 w-3 rounded-full ${
                      m.lights ? "bg-yellow-400" : "bg-gray-700"
                    }`}
                  />
                  Lights
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`h-3 w-3 rounded-full ${
                      m.appliances ? "bg-blue-400" : "bg-gray-700"
                    }`}
                  />
                  Appliances
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {!hasAnyData && (
        <div className="mt-4 rounded-xl border border-dashed border-gray-700 bg-gray-950 p-4 text-sm text-gray-500">
          No motion sensor data available yet. Make sure your motion sensors are connected and publishing to MQTT.
        </div>
      )}
    </div>
  );
}
