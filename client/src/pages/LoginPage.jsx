import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/authStore";

function Field({ icon, label, children }) {
  return (
    <label className="block text-sm text-slate-300">
      <div className="mb-2 flex items-center gap-2 text-slate-400">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-800 text-sky-300">
          {icon}
        </span>
        {label}
      </div>
      {children}
    </label>
  );
}

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const login = useAuthStore((s) => s.login);
  const loginDemo = useAuthStore((s) => s.loginDemo);
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      await login(email, password);
      const role = useAuthStore.getState().user?.role;
      navigate(role === "admin" ? "/admin" : "/dashboard");
    } catch {
      setErr("Invalid email or password");
      toast.error("Login failed");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/95 to-slate-950/95 p-10 shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.35em] text-sky-300">Secure login</p>
            <h1 className="text-4xl font-semibold text-white">Welcome back.</h1>
            <p className="max-w-xl text-base leading-7 text-slate-400">
              Access your energy dashboard, live device insights, and occupancy controls with one secure sign in.
            </p>
          </div>
          <div className="mt-10 space-y-4 rounded-3xl border border-slate-800/80 bg-slate-900/90 p-6">
            <div className="rounded-3xl bg-slate-950/90 p-4 text-sm text-slate-300 shadow-inner shadow-black/10">
              <p className="font-medium text-slate-100">For teams</p>
              <p className="mt-2 text-slate-400">Get clear visuals, alerts, and rapid occupancy feedback — no unnecessary complexity.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-800/80 bg-slate-950/80 p-4">
                <p className="text-sm text-slate-400">Real-time sensor status</p>
                <p className="mt-2 text-base font-semibold text-white">Live connected devices</p>
              </div>
              <div className="rounded-3xl border border-slate-800/80 bg-slate-950/80 p-4">
                <p className="text-sm text-slate-400">Simple access</p>
                <p className="mt-2 text-base font-semibold text-white">Fast secure authentication</p>
              </div>
            </div>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-10 shadow-2xl shadow-black/25"
        >
          <div className="mb-8">
            <h2 className="text-3xl font-semibold text-white">Sign in</h2>
            <p className="mt-2 text-sm text-slate-400">Enter your credentials to continue to your dashboard.</p>
          </div>

          {err && <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300 mb-6">{err}</p>}

          <div className="space-y-5">
            <Field icon="📧" label="Email address">
              <input
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                required
              />
            </Field>
            <Field icon="🔒" label="Password">
              <input
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="current-password"
                required
              />
            </Field>
          </div>

          <button
            type="submit"
            className="mt-8 w-full rounded-2xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-400"
          >
            Login
          </button>

          <div className="mt-6 flex flex-col gap-3 text-center text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              className="text-sky-300 hover:text-sky-200"
              onClick={async () => {
                await loginDemo();
                navigate("/demo");
              }}
            >
              Try demo mode
            </button>
            <Link className="text-sky-300 hover:text-sky-200" to="/register">
              Create an account
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
