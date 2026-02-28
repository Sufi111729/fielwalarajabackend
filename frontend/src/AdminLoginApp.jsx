import { useState } from "react";
import TopNav from "./components/TopNav";
import AppFooter from "./components/AppFooter";

export default function AdminLoginApp() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (username === "admin" && password === "admin") {
      localStorage.setItem("fwr_admin_session", "true");
      window.location.href = "/users";
      return;
    }

    setError("Invalid admin credentials.");
  };

  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-7xl p-4 md:p-6">
        <section className="mb-5 border-b border-slate-200 bg-white px-4 py-8 md:px-6 md:py-10">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-2xl font-bold leading-tight text-slate-900 md:text-4xl">Admin Login</h1>
            <p className="mt-3 text-base text-slate-600 md:text-lg">Use admin panel credentials to access user CRUD.</p>
          </div>
        </section>

        <section className="mx-auto max-w-md panel">
          <form onSubmit={onSubmit} className="space-y-3">
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" className="btn-primary">Login</button>
          </form>
          {error ? <p className="mt-3 rounded bg-rose-50 p-2 text-sm text-rose-700">{error}</p> : null}
        </section>
      </main>
      <AppFooter />
    </>
  );
}
