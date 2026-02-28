const RAW_API_BASE = (import.meta.env.VITE_API_BASE_URL || "").trim();
const IS_LOCAL =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
const LOCAL_API_BASE = "http://localhost:8080";

function getApiBases() {
  const bases = [];
  if (RAW_API_BASE) bases.push(RAW_API_BASE);
  if (IS_LOCAL && !bases.includes(LOCAL_API_BASE)) bases.push(LOCAL_API_BASE);
  return bases;
}

async function postJson(path, payload) {
  const bases = getApiBases();

  if (bases.length === 0) {
    throw new Error("Auth API not configured. Set VITE_API_BASE_URL to your backend URL.");
  }

  let lastError = "";

  for (const base of bases) {
    let res;
    try {
      res = await fetch(`${base}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch {
      lastError = `Unable to connect to ${base}`;
      continue;
    }

    const raw = await res.text().catch(() => "");
    let data = {};
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch {
        data = {};
      }
    }

    if (!res.ok) {
      if (res.status === 404) {
        lastError = `Auth endpoint not found at ${base}${path}`;
        continue;
      }
      throw new Error(data.message || `Request failed (${res.status}) at ${base}${path}`);
    }

    return data;
  }

  throw new Error(lastError || "Auth request failed.");
}

export function signup(payload) {
  return postJson("/api/auth/signup", payload);
}

export function sendSignupOtp(payload) {
  return postJson("/api/auth/signup/send-otp", payload);
}

export function verifySignupOtp(payload) {
  return postJson("/api/auth/signup/verify-otp", payload);
}

export function completeSignup(payload) {
  return postJson("/api/auth/signup/complete", payload);
}

export function login(payload) {
  return postJson("/api/auth/login", payload);
}

export function verifyEmail(token) {
  return postJson("/api/auth/verify-email", { token });
}

export function resendVerification(email) {
  return postJson("/api/auth/resend-verification", { email });
}
