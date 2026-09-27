import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { realApi } from "../../api/axios";
import { CardSkeleton } from "../../components/common/LoadingSkeleton";

export function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    home_id: "",
  });

  async function load() {
    const { data } = await realApi.get("/api/admin/users");
    setUsers(data.users || []);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        await load();
      } catch {
        if (!cancelled) setUsers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function createUser(e) {
    e.preventDefault();
    try {
      await realApi.post("/api/admin/users", {
        ...form,
        home_id: form.home_id || null,
      });
      toast.success("User created");
      setOpen(false);
      setForm({ name: "", email: "", password: "", role: "user", home_id: "" });
      await load();
    } catch (ex) {
      toast.error(ex.response?.data?.error || "Failed");
    }
  }

  if (loading) return <CardSkeleton className="min-h-[200px]" />;

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Users</h1>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="px-3 py-1.5 rounded-lg bg-blue-600 text-sm"
        >
          Add user
        </button>
      </div>
      <div className="rounded-xl border border-gray-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-900 text-gray-500">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Role</th>
              <th className="text-left p-3">Home</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-gray-800">
                <td className="p-3">{u.name}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.role}</td>
                <td className="p-3 text-gray-500">{u.home_id || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={createUser}
            className="w-full max-w-md rounded-xl border border-gray-800 bg-gray-900 p-6 space-y-3"
          >
            <h2 className="font-semibold">New user</h2>
            <input
              required
              placeholder="Name"
              className="w-full rounded-lg bg-gray-950 border border-gray-800 px-3 py-2 text-sm"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              required
              type="email"
              placeholder="Email"
              className="w-full rounded-lg bg-gray-950 border border-gray-800 px-3 py-2 text-sm"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              required
              type="password"
              placeholder="Password (min 8)"
              className="w-full rounded-lg bg-gray-950 border border-gray-800 px-3 py-2 text-sm"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <select
              className="w-full rounded-lg bg-gray-950 border border-gray-800 px-3 py-2 text-sm"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="user">user</option>
              <option value="admin">admin</option>
              <option value="demo">demo</option>
            </select>
            <input
              placeholder="Home UUID (optional)"
              className="w-full rounded-lg bg-gray-950 border border-gray-800 px-3 py-2 text-sm"
              value={form.home_id}
              onChange={(e) => setForm({ ...form, home_id: e.target.value })}
            />
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg bg-gray-800"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="px-3 py-1.5 rounded-lg bg-blue-600">
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
