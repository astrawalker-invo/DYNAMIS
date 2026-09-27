import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const features = [
  {
    title: "Smart power insights",
    description: "Track energy, voltage, and usage trends from real-time sensor streams.",
  },
  {
    title: "Vision-enabled occupancy",
    description: "See zone detection and occupancy status from Grayskull vision data.",
  },
  {
    title: "LDR & ESP harmony",
    description: "Integrated light sensing with ESP bridge controls and automated reports.",
  },
  {
    title: "Low-touch operations",
    description: "A modern dashboard built for fast decision making and clear alerts.",
  },
];

const team = [
  { name: "Aditi Sharma", role: "Product Lead" },
  { name: "Rohan Patel", role: "Frontend Engineer" },
  { name: "Priya Singh", role: "ML Engineer" },
  { name: "Vikram Joshi", role: "IoT Architect" },
  { name: "Sana Kapoor", role: "Design Lead" },
];

export function LandingPage() {
  const navigate = useNavigate();
  const loginDemo = useAuthStore((s) => s.loginDemo);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % team.length);
    }, 6000);
    return () => window.clearInterval(interval);
  }, []);

  const activeMember = team[activeIndex];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-sky-500/20 to-transparent blur-3xl opacity-80" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-6">
            <span className="inline-flex rounded-full bg-sky-500/10 px-4 py-1 text-sm font-medium text-sky-300 ring-1 ring-sky-400/10">
              Built for energy teams and smart homes
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Intelligent energy control with vision, sensors, and live analytics.
            </h1>
            <p className="max-w-2xl text-lg text-slate-400 sm:text-xl">
              Monitor voltage, occupancy, light, and power in one modern platform. Connect your hardware,
              visualize live data, and make smarter decisions with a responsive dashboard.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:-translate-y-0.5 hover:bg-sky-400"
                onClick={() => navigate("/login")}
              >
                Login to Dashboard
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-500"
                onClick={async () => {
                  await loginDemo();
                  navigate("/demo");
                }}
              >
                Try Demo
              </button>
            </div>

            <div className="mt-10 relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/90 p-6 shadow-xl shadow-black/20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.30),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.25),_transparent_30%)]" />
              <div className="relative flex h-64 flex-col justify-between">
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span className="rounded-full bg-slate-900/80 px-3 py-1">Live data stream</span>
                  <span className="rounded-full bg-slate-900/80 px-3 py-1">Secure edge sync</span>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="space-y-3 rounded-[1.5rem] border border-slate-800/80 bg-slate-950/90 p-4 shadow-inner shadow-slate-900/40">
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.32em] text-sky-300">
                      <span>Power</span>
                      <span>Connectivity</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-2xl bg-slate-900/95 p-3 text-white">
                        <p className="text-2xl font-semibold">3.2 kW</p>
                        <p className="mt-1 text-xs text-slate-400">Current draw</p>
                      </div>
                      <div className="rounded-2xl bg-slate-900/95 p-3 text-white">
                        <p className="text-2xl font-semibold">99.7%</p>
                        <p className="mt-1 text-xs text-slate-400">Mesh uptime</p>
                      </div>
                    </div>
                  </div>
                  <div className="relative h-24 overflow-hidden rounded-[1.75rem] border border-slate-800/90 bg-slate-950/90">
                    <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-slate-700" />
                    <div className="absolute right-0 top-2/3 h-0.5 w-24 animate-pulse rounded-full bg-sky-400/80" />
                    <div className="absolute left-6 top-8 h-2 w-2 rounded-full bg-sky-300 shadow-[0_0_20px_rgba(56,189,248,0.5)] animate-ping" />
                    <div className="absolute left-24 top-4 h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.5)] animate-pulse" />
                    <div className="absolute left-40 top-14 h-2 w-2 rounded-full bg-fuchsia-300 shadow-[0_0_20px_rgba(192,132,252,0.5)] animate-pulse" />
                    <div className="absolute left-56 top-6 h-2 w-2 rounded-full bg-sky-300 shadow-[0_0_20px_rgba(56,189,248,0.5)] animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <div className="rounded-3xl bg-slate-950 p-6 ring-1 ring-white/10">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-sky-300">Platform overview</p>
                  <h2 className="mt-3 text-2xl font-semibold text-white">All-in-one edge intelligence</h2>
                </div>
                <div className="rounded-2xl bg-slate-900/90 px-4 py-2 text-sm text-slate-300">
                  Live now
                </div>
              </div>
              <div className="mt-6 space-y-4">
                {features.map((feature) => (
                  <div key={feature.title} className="rounded-3xl border border-slate-800/80 bg-slate-900/90 p-4 transition hover:border-sky-400/30 hover:bg-slate-900">
                    <h3 className="text-base font-semibold text-white">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 rounded-[2rem] border border-white/10 bg-slate-900/95 p-8 shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Meet the team</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">Built by people who understand smart home workflows.</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-400">
              Collaborate with a platform designed for real deployments, real sensors, and real action.
            </p>
          </div>

          <div className="mt-8 flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-slate-800/80 bg-slate-950/90 p-8 shadow-xl shadow-black/20">
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-sky-500/15 to-transparent" />
              <div className="relative z-10 space-y-4">
                <p className="text-sm uppercase tracking-[0.32em] text-sky-300">Team spotlight</p>
                <div className="rounded-[1.75rem] border border-slate-800/90 bg-slate-900/95 p-6 shadow-inner shadow-slate-950/40">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-slate-400">{activeMember.role}</p>
                      <p className="mt-2 text-2xl font-semibold text-white">{activeMember.name}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-800/90 px-4 py-2 text-sm text-slate-300">
                      {activeIndex + 1}/{team.length}
                    </div>
                  </div>
                  <p className="mt-5 text-sm leading-6 text-slate-400">
                    {activeMember.name} brings deep experience in smart home systems, sensor integration, and user-facing design for reliable energy management.
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 text-slate-200 transition hover:border-sky-400 hover:text-white"
                    onClick={() => setActiveIndex((current) => (current - 1 + team.length) % team.length)}
                    aria-label="Previous team member"
                  >
                    ←
                  </button>
                  <div className="flex gap-2">
                    {team.map((_, index) => (
                      <button
                        key={index}
                        type="button"
                        className={`h-2 w-8 rounded-full transition ${index === activeIndex ? "bg-sky-400" : "bg-slate-700/80"}`}
                        onClick={() => setActiveIndex(index)}
                        aria-label={`Select team member ${index + 1}`}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 text-slate-200 transition hover:border-sky-400 hover:text-white"
                    onClick={() => setActiveIndex((current) => (current + 1) % team.length)}
                    aria-label="Next team member"
                  >
                    →
                  </button>
                </div>
              </div>
            </div>
            <div className="hidden h-56 w-56 shrink-0 rounded-[2rem] bg-gradient-to-br from-sky-500/20 via-slate-900/80 to-fuchsia-500/15 p-4 text-slate-200 shadow-2xl shadow-sky-500/10 lg:block">
              <div className="relative flex h-full items-center justify-center overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/90 p-6">
                <div className="absolute inset-0 opacity-50 blur-2xl bg-gradient-to-br from-sky-400 via-indigo-500 to-fuchsia-400" />
                <div className="relative z-10 grid h-full w-full grid-cols-2 gap-3">
                  <div className="animate-bounce rounded-3xl bg-slate-800/80 p-3 text-center text-xs uppercase tracking-[0.24em] text-slate-300">Edge</div>
                  <div className="animate-pulse rounded-3xl bg-slate-800/80 p-3 text-center text-xs uppercase tracking-[0.24em] text-slate-300">Vision</div>
                  <div className="animate-pulse rounded-3xl bg-slate-900/95 p-3 text-center text-xs uppercase tracking-[0.24em] text-slate-300">Sensors</div>
                  <div className="animate-bounce rounded-3xl bg-slate-900/95 p-3 text-center text-xs uppercase tracking-[0.24em] text-slate-300">Alerts</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
