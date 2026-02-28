import { useEffect, useMemo, useState } from "react";
import TopNav from "./components/TopNav";
import AppFooter from "./components/AppFooter";
import { createUser, deleteUser, listUsers, updateUser } from "./lib/usersApi";

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  mobile: "",
  password: "",
  emailVerified: false
};

export default function UsersCrudApp() {
  const [users, setUsers] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (localStorage.getItem("fwr_admin_session") !== "true") {
      window.location.href = "/admin";
      return;
    }
    loadUsers();
  }, []);

  const submitLabel = useMemo(() => (editingId ? "Update User" : "Create User"), [editingId]);

  const resetNotice = () => {
    setMessage("");
    setError("");
  };

  const loadUsers = async () => {
    resetNotice();
    try {
      setBusy(true);
      const res = await listUsers();
      setUsers(res.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    resetNotice();
    try {
      setBusy(true);
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        mobile: form.mobile,
        password: form.password || undefined,
        emailVerified: form.emailVerified
      };

      if (editingId) {
        await updateUser(editingId, payload);
        setMessage("User updated successfully.");
      } else {
        await createUser(payload);
        setMessage("User created successfully.");
      }

      setForm(initialForm);
      setEditingId(null);
      await loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const onEdit = (user) => {
    setEditingId(user.id);
    setForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      mobile: user.mobile || "",
      password: "",
      emailVerified: !!user.emailVerified
    });
  };

  const onDelete = async (userId) => {
    resetNotice();
    try {
      setBusy(true);
      await deleteUser(userId);
      setMessage("User deleted successfully.");
      if (editingId === userId) {
        setEditingId(null);
        setForm(initialForm);
      }
      await loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const onCancelEdit = () => {
    setEditingId(null);
    setForm(initialForm);
  };

  const logoutAdmin = () => {
    localStorage.removeItem("fwr_admin_session");
    window.location.href = "/admin";
  };

  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-7xl p-4 md:p-6">
        <section className="mb-5 border-b border-slate-200 bg-white px-4 py-8 md:px-6 md:py-10">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-2xl font-bold leading-tight text-slate-900 md:text-4xl">User Management (CRUD)</h1>
            <p className="mt-3 text-base text-slate-600 md:text-lg">Create, update, list and delete users from frontend.</p>
            <button type="button" className="btn-muted mt-3" onClick={logoutAdmin}>Admin Logout</button>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="panel">
            <h2 className="text-lg font-semibold text-slate-900">{editingId ? "Edit User" : "Create User"}</h2>
            <form onSubmit={onSubmit} className="mt-3 space-y-3">
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="First name" value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} required />
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Last name" value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} required />
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" type="tel" placeholder="Mobile (10-15 digits)" value={form.mobile} onChange={(e) => setForm((p) => ({ ...p, mobile: e.target.value.replace(/\D/g, "").slice(0, 15) }))} />
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" type="password" placeholder={editingId ? "New password (optional)" : "Password (min 8)"} value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} minLength={editingId ? 0 : 8} required={!editingId} />

              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={form.emailVerified} onChange={(e) => setForm((p) => ({ ...p, emailVerified: e.target.checked }))} />
                Email Verified
              </label>

              <div className="flex gap-2">
                <button type="submit" className="btn-primary" disabled={busy}>{busy ? "Please wait..." : submitLabel}</button>
                {editingId ? (
                  <button type="button" className="btn-muted" onClick={onCancelEdit}>
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>
          </div>

          <div className="panel">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Users</h2>
              <button type="button" className="btn-muted" onClick={loadUsers} disabled={busy}>Refresh</button>
            </div>

            <div className="max-h-[520px] overflow-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-100 text-left">
                  <tr>
                    <th className="px-3 py-2">ID</th>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Mobile</th>
                    <th className="px-3 py-2">Verified</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-4 text-center text-slate-500">No users found.</td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="border-t border-slate-200">
                        <td className="px-3 py-2">{u.id}</td>
                        <td className="px-3 py-2">{u.fullName}</td>
                        <td className="px-3 py-2">{u.email}</td>
                        <td className="px-3 py-2">{u.mobile || "-"}</td>
                        <td className="px-3 py-2">{u.emailVerified ? "Yes" : "No"}</td>
                        <td className="px-3 py-2">
                          <div className="flex gap-2">
                            <button type="button" className="btn-muted" onClick={() => onEdit(u)}>Edit</button>
                            <button type="button" className="btn-danger" onClick={() => onDelete(u.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {message ? <p className="mt-4 rounded bg-emerald-50 p-2 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-4 rounded bg-rose-50 p-2 text-sm text-rose-700">{error}</p> : null}
      </main>
      <AppFooter />
    </>
  );
}
