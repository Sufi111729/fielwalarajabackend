const RAW_API_BASE = (import.meta.env.VITE_API_BASE_URL || "").trim();
const IS_LOCAL =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
const API_BASE = RAW_API_BASE || (IS_LOCAL ? "http://localhost:8080" : "");

async function parseResponse(res) {
  const raw = await res.text().catch(() => "");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  let res;
  try {
    res = await fetch(url, options);
  } catch {
    throw new Error("Unable to connect backend. Check API URL/backend status.");
  }

  const data = await parseResponse(res);
  if (!res.ok) {
    const nestedMessage =
      Array.isArray(data.errors) && data.errors.length > 0 ? data.errors[0]?.message : "";
    throw new Error(data.message || nestedMessage || `Request failed (${res.status})`);
  }
  return data;
}

export function listUsers() {
  return request("/api/users");
}

export function createUser(payload) {
  return request("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export function updateUser(id, payload) {
  return request(`/api/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export function deleteUser(id) {
  return request(`/api/users/${id}`, {
    method: "DELETE"
  });
}
