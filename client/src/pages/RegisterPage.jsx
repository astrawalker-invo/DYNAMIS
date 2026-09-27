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

export function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    if (password.length < 8) {
      setErr("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setErr("Passwords do not match");
      return;
    }
    try {
      await register(name, email, password);
      toast.success("Account created");
      navigate("/dashboard");
    } catch (ex) {
      setErr(ex.response?.data?.error || "Registration failed");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <form
          onSubmit={onSubmit}
          className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-10 shadow-2xl shadow-black/25"
        >
          <div className="mb-8">
            <h2 className="text-3xl font-semibold text-white">Create account</h2>
            <p className="mt-2 text-sm text-slate-400">Start using energy insights, device status, and occupancy controls today.</p>
          </div>

          {err && <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300 mb-6">{err}</p>}

          <div className="space-y-5">
            <Field icon="👤" label="Full name">
              <input
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Field>
            <Field icon="📧" label="Email address">
              <input
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
              />
            </Field>
            <Field icon="🔒" label="Password">
              <input
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
              />
            </Field>
            <Field icon="✅" label="Confirm password">
              <input
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                type="password"
                required
              />
            </Field>
          </div>

          <button
            type="submit"
            className="mt-8 w-full rounded-2xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-400"
          >
            Register
          </button>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link className="text-sky-300 hover:text-sky-200" to="/login">
              Login
            </Link>
          </p>
        </form>

        <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/95 to-slate-950/85 p-10 shadow-2xl shadow-black/30">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.35em] text-sky-300">Welcome aboard</p>
            <h3 className="text-4xl font-semibold text-white">Your smart home control center</h3>
            <p className="text-base leading-7 text-slate-400">
              Register once and access live visuals, zone awareness, and power intelligence across your deployed sensors.
            </p>
            <div className="grid gap-4">
              <div className="rounded-3xl border border-slate-800/80 bg-slate-950/80 p-5">
                <p className="text-sm text-slate-400">Fast setup</p>
                <p className="mt-2 text-white">Connect devices, assign home IDs, and start receiving data instantly.</p>
              </div>
              <div className="rounded-3xl border border-slate-800/80 bg-slate-950/80 p-5">
                <p className="text-sm text-slate-400">Secure access</p>
                <p className="mt-2 text-white">Keep your account safe while the dashboard remains simple and responsive.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
