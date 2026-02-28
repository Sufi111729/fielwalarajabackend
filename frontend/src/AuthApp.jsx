import { useMemo, useState } from "react";
import TopNav from "./components/TopNav";
import AppFooter from "./components/AppFooter";
import { completeSignup, login, resendVerification, sendSignupOtp, verifySignupOtp } from "./lib/authApi";

function modeFromUrl() {
  const mode = new URLSearchParams(window.location.search).get("mode");
  return mode === "login" ? "login" : "signup";
}

function setModeUrl(mode) {
  const url = new URL(window.location.href);
  url.searchParams.set("mode", mode);
  window.history.replaceState({}, "", url.toString());
}

export default function AuthApp() {
  const [mode, setMode] = useState(modeFromUrl());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [signupStep, setSignupStep] = useState(1);
  const [signupForm, setSignupForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    otp: "",
    mobile: "",
    password: ""
  });
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });

  const heading = useMemo(() => (mode === "login" ? "Login" : "Create Account"), [mode]);

  const resetNotice = () => {
    setMessage("");
    setError("");
  };

  const switchMode = (nextMode) => {
    resetNotice();
    setMode(nextMode);
    setModeUrl(nextMode);
  };

  const onSendOtp = async (e) => {
    e.preventDefault();
    resetNotice();
    try {
      setBusy(true);
      const res = await sendSignupOtp({
        firstName: signupForm.firstName,
        lastName: signupForm.lastName,
        email: signupForm.email
      });
      const normalizedEmail = (res.email || signupForm.email || "").trim().toLowerCase();
      setSignupForm((p) => ({ ...p, email: normalizedEmail }));
      setMessage(res.message || `OTP sent to ${normalizedEmail}.`);
      setSignupStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const onVerifyOtp = async (e) => {
    e.preventDefault();
    resetNotice();
    try {
      setBusy(true);
      const res = await verifySignupOtp({ email: signupForm.email, otp: signupForm.otp });
      setMessage(res.message || "OTP verified.");
      setSignupStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const onCompleteSignup = async (e) => {
    e.preventDefault();
    resetNotice();
    try {
      setBusy(true);
      const res = await completeSignup({
        firstName: signupForm.firstName,
        lastName: signupForm.lastName,
        email: signupForm.email,
        mobile: signupForm.mobile,
        password: signupForm.password
      });
      setMessage(res.message || "Account created successfully.");
      switchMode("login");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const onResendOtp = async (e) => {
    e.preventDefault();
    resetNotice();
    try {
      setBusy(true);
      const res = await resendVerification(signupForm.email);
      const normalizedEmail = (res.email || signupForm.email || "").trim().toLowerCase();
      setSignupForm((p) => ({ ...p, email: normalizedEmail }));
      setMessage(res.message || `OTP resent to ${normalizedEmail}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const onLogin = async (e) => {
    e.preventDefault();
    resetNotice();
    try {
      setBusy(true);
      const res = await login(loginForm);
      localStorage.setItem("fwr_auth_token", res.token || "");
      localStorage.setItem("fwr_auth_email", res.email || "");
      window.location.href = "/";
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-7xl p-4 md:p-6">
        <section className="mb-5 border-b border-slate-200 bg-white px-4 py-8 md:px-6 md:py-10">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-2xl font-bold leading-tight text-slate-900 md:text-4xl">{heading}</h1>
            <p className="mt-3 text-base text-slate-600 md:text-lg">
              {mode === "login"
                ? "Login with your verified email and password."
                : "Create account in 3 steps: Details, OTP verification, then mobile and password."}
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-xl panel">
          <h2 className="text-lg font-semibold text-slate-900">{mode === "login" ? "Login" : "Sign Up"}</h2>

          {mode === "signup" ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                Step {signupStep} of 3
              </div>

              {signupStep === 1 ? (
                <form className="space-y-3" onSubmit={onSendOtp}>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="First name"
                    value={signupForm.firstName}
                    onChange={(e) => setSignupForm((p) => ({ ...p, firstName: e.target.value }))}
                    required
                  />
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Last name"
                    value={signupForm.lastName}
                    onChange={(e) => setSignupForm((p) => ({ ...p, lastName: e.target.value }))}
                    required
                  />
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    type="email"
                    placeholder="Email"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm((p) => ({ ...p, email: e.target.value }))}
                    required
                  />
                  <button type="submit" className="btn-primary" disabled={busy}>
                    {busy ? "Please wait..." : "Send OTP"}
                  </button>
                </form>
              ) : null}

              {signupStep === 2 ? (
                <>
                  <form className="space-y-3" onSubmit={onVerifyOtp}>
                    <input
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      placeholder="Enter 6-digit OTP"
                      value={signupForm.otp}
                      onChange={(e) => setSignupForm((p) => ({ ...p, otp: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
                      required
                    />
                    <button type="submit" className="btn-primary" disabled={busy}>
                      {busy ? "Please wait..." : "Verify OTP"}
                    </button>
                  </form>
                  <form onSubmit={onResendOtp}>
                    <button type="submit" className="btn-muted" disabled={busy}>
                      {busy ? "Please wait..." : "Resend OTP"}
                    </button>
                  </form>
                </>
              ) : null}

              {signupStep === 3 ? (
                <form className="space-y-3" onSubmit={onCompleteSignup}>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    type="tel"
                    inputMode="numeric"
                    placeholder="Mobile number"
                    value={signupForm.mobile}
                    onChange={(e) => setSignupForm((p) => ({ ...p, mobile: e.target.value.replace(/\D/g, "").slice(0, 15) }))}
                    minLength={10}
                    maxLength={15}
                    required
                  />
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    type="password"
                    placeholder="Password (min 8 chars)"
                    value={signupForm.password}
                    onChange={(e) => setSignupForm((p) => ({ ...p, password: e.target.value }))}
                    minLength={8}
                    required
                  />
                  <button type="submit" className="btn-primary" disabled={busy}>
                    {busy ? "Please wait..." : "Create Account"}
                  </button>
                </form>
              ) : null}

              <p className="text-sm text-slate-600">
                Already have an account?{" "}
                <button type="button" className="text-red-600 hover:underline" onClick={() => switchMode("login")}>
                  Login
                </button>
              </p>
            </div>
          ) : null}

          {mode === "login" ? (
            <form className="mt-4 space-y-3" onSubmit={onLogin}>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                type="email"
                placeholder="Email"
                value={loginForm.email}
                onChange={(e) => setLoginForm((p) => ({ ...p, email: e.target.value }))}
                required
              />
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
                required
              />
              <button type="submit" className="btn-primary" disabled={busy}>
                {busy ? "Please wait..." : "Login"}
              </button>
              <p className="text-sm text-slate-600">
                New user?{" "}
                <button type="button" className="text-red-600 hover:underline" onClick={() => switchMode("signup")}>
                  Create account
                </button>
              </p>
            </form>
          ) : null}

          {message ? <p className="mt-4 rounded bg-emerald-50 p-2 text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="mt-4 rounded bg-rose-50 p-2 text-sm text-rose-700">{error}</p> : null}
        </section>
      </main>
      <AppFooter />
    </>
  );
}
