export const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

export async function authFetch(url, options = {}) {
  const token = localStorage.getItem("access_token");
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem("access_token");
    window.location.href = "/login";
  }
  return res;
}
