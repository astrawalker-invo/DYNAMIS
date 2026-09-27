export function formatWatts(w) {
  const n = Number(w) || 0;
  if (n >= 1000) return `${(n / 1000).toFixed(2)} kW`;
  return `${Math.round(n).toLocaleString()} W`;
}

export function formatCost(rupees) {
  const n = Number(rupees) || 0;
  return `₹ ${n.toFixed(2)}`;
}

export function formatLux(lux) {
  return `${Math.round(Number(lux) || 0)} lux`;
}

export function formatVoltage(v) {
  return `${Math.round(Number(v) || 0)} V`;
}

export function formatRelTime(ts) {
  if (!ts) return "";
  const t = new Date(ts).getTime();
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min${m === 1 ? "" : "s"} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

export function formatKwh(wh) {
  const kwh = Number(wh) / 1000;
  return `${kwh.toFixed(2)} kWh`;
}

export function getWattsColor(w) {
  const n = Number(w) || 0;
  if (n < 500) return "green";
  if (n <= 1500) return "amber";
  return "red";
}
