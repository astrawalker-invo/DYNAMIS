import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { realApi } from "../../api/axios";
import { CardSkeleton } from "../../components/common/LoadingSkeleton";

export function AdminSettingsPage() {
  const [homes, setHomes] = useState([]);
  const [homeId, setHomeId] = useState("");
  const [form, setForm] = useState({
    tariff_rate: 8.5,
    motion_timeout_mins: 5,
    nilm_threshold_watts: 500,
    ldr_enabled: true,
    motion_enabled: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const { data } = await realApi.get("/api/admin/homes");
        const hs = data.homes || [];
        if (!cancelled) {
          setHomes(hs);
          if (hs[0]) {
            setHomeId(hs[0].id);
            setForm({
              tariff_rate: Number(hs[0].tariff_rate),
              motion_timeout_mins: hs[0].motion_timeout_mins,
              nilm_threshold_watts: hs[0].nilm_threshold_watts,
              ldr_enabled: hs[0].ldr_enabled,
              motion_enabled: hs[0].motion_enabled,
            });
          }
        }
      } catch {
        if (!cancelled) setHomes([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const h = homes.find((x) => x.id === homeId);
    if (!h) return;
    setForm({
      tariff_rate: Number(h.tariff_rate),
      motion_timeout_mins: h.motion_timeout_mins,
      nilm_threshold_watts: h.nilm_threshold_watts,
      ldr_enabled: h.ldr_enabled,
      motion_enabled: h.motion_enabled,
    });
  }, [homeId, homes]);

  async function save(e) {
    e.preventDefault();
    if (!homeId) return;
    try {
      await realApi.put(`/api/admin/settings/${homeId}`, form);
      toast.success("Saved");
    } catch {
      toast.error("Save failed");
    }
  }

  if (loading) return <CardSkeleton className="min-h-[240px]" />;

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-semibold">Home settings</h1>
      <label className="text-xs text-gray-500">Home</label>
      <select
        className="w-full rounded-lg bg-gray-900 border border-gray-800 px-3 py-2 text-sm"
        value={homeId}
        onChange={(e) => setHomeId(e.target.value)}
      >
        {homes.map((h) => (
          <option key={h.id} value={h.id}>
            {h.name}
          </option>
        ))}
      </select>
      <form
        onSubmit={save}
        className="space-y-3 rounded-xl border border-gray-800 bg-gray-900 p-4"
      >
        <div>
          <label className="text-xs text-gray-500">Tariff (₹/kWh)</label>
          <input
            type="number"
            step="0.01"
            className="w-full mt-1 rounded-lg bg-gray-950 border border-gray-800 px-3 py-2 text-sm"
            value={form.tariff_rate}
            onChange={(e) =>
              setForm({ ...form, tariff_rate: parseFloat(e.target.value) || 0 })
            }
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Motion timeout (minutes)</label>
          <input
            type="number"
            className="w-full mt-1 rounded-lg bg-gray-950 border border-gray-800 px-3 py-2 text-sm"
            value={form.motion_timeout_mins}
            onChange={(e) =>
              setForm({
                ...form,
                motion_timeout_mins: parseInt(e.target.value, 10) || 1,
              })
            }
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">NILM threshold (W)</label>
          <input
            type="number"
            className="w-full mt-1 rounded-lg bg-gray-950 border border-gray-800 px-3 py-2 text-sm"
            value={form.nilm_threshold_watts}
            onChange={(e) =>
              setForm({
                ...form,
                nilm_threshold_watts: parseInt(e.target.value, 10) || 1,
              })
            }
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.ldr_enabled}
            onChange={(e) => setForm({ ...form, ldr_enabled: e.target.checked })}
          />
          LDR enabled
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.motion_enabled}
            onChange={(e) => setForm({ ...form, motion_enabled: e.target.checked })}
          />
          Motion enabled
        </label>
        <button
          type="submit"
          className="w-full py-2 rounded-lg bg-blue-600 text-sm font-medium"
        >
          Save
        </button>
      </form>
    </div>
  );
}
