// src/lib/http.js
const RAW = (import.meta.env.VITE_API_URL || "").trim().replace(/\/+$/, "");
// Devda VITE_API_URL bo'sh bo'lsa → relative /api ishlatamiz (Vite proxy)
const API_BASE = RAW || ""; // "" => fetch("/api/...")

let accessToken = localStorage.getItem("accessToken") || "";
let refreshToken = localStorage.getItem("refreshToken") || "";
let onAuthChange = () => { };

function setTokens(at, rt = "") {
  accessToken = at || "";
  refreshToken = rt || "";
  onAuthChange({ accessToken, refreshToken });
}

function setOnAuthChange(cb) {
  onAuthChange = typeof cb === "function" ? cb : () => { };
}

async function request(path, opts = {}) {
  const url = API_BASE ? `${API_BASE}${path}` : `/api${path}`;

  // Always get fresh token from localStorage
  const currentToken = localStorage.getItem("accessToken") || accessToken;

  const res = await fetch(url, {
    method: opts.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
      ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
    },
    body: opts.body ? (typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body)) : undefined,
    credentials: "include", // cookie bo'lsa ham ishlasin
  });

  // JSON bo'lsa o'qib qo'yamiz
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => ({})) : await res.text().catch(() => "");

  // 401 bo'lsa refresh qilib 1 marotaba qayta urinib ko'ramiz
  if (res.status === 401 && refreshToken) {
    const ok = await tryRefresh();
    if (ok) {
      // Get fresh token after refresh
      const freshToken = localStorage.getItem("accessToken") || accessToken;

      const retry = await fetch(url, {
        method: opts.method || "GET",
        headers: {
          "Content-Type": "application/json",
          ...(opts.headers || {}),
          ...(freshToken ? { Authorization: `Bearer ${freshToken}` } : {}),
        },
        body: opts.body ? (typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body)) : undefined,
        credentials: "include",
      });
      const retryData = retry.headers.get("content-type")?.includes("application/json")
        ? await retry.json().catch(() => ({}))
        : await retry.text().catch(() => "");
      if (!retry.ok) throw retryData || { message: "Request failed" };
      return retryData;
    }
  }

  if (!res.ok) throw data || { message: "Request failed" };
  return data;
}

async function tryRefresh() {
  try {
    // Check if we have a refresh token
    const currentRefreshToken = localStorage.getItem("refreshToken") || refreshToken;

    if (!currentRefreshToken) {
      console.warn('⚠️ No refresh token available, cannot refresh access token');
      handleAuthFailure();
      return false;
    }

    const url = API_BASE ? `${API_BASE}/auth/refresh` : `/api/auth/refresh`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ refreshToken: currentRefreshToken }),
    });

    const j = await r.json().catch(() => ({}));

    if (r.ok && j?.accessToken) {
      accessToken = j.accessToken;
      localStorage.setItem("accessToken", j.accessToken);
      onAuthChange({ accessToken, refreshToken: currentRefreshToken });
      return true;
    } else {
      console.warn('⚠️ Token refresh failed:', j?.message || 'Unknown error');
      handleAuthFailure();
      return false;
    }
  } catch (error) {
    console.error('❌ Token refresh error:', error);
    handleAuthFailure();
    return false;
  }
}

function handleAuthFailure() {
  // Clear all auth data
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  localStorage.removeItem("org");
  accessToken = "";
  refreshToken = "";

  // Redirect to login if not already there
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

export default {
  get: (path, query) => {
    if (query && typeof query === "object") {
      const search = new URLSearchParams();
      Object.keys(query).forEach((key) => {
        const val = query[key];
        if (val !== undefined && val !== null && val !== "") {
          search.append(key, val);
        }
      });
      const qs = search.toString();
      if (qs) {
        path += (path.includes("?") ? "&" : "?") + qs;
      }
    }
    return request(path);
  },
  post: (p, body) => request(p, { method: "POST", body }),
  put: (p, body) => request(p, { method: "PUT", body }),
  patch: (p, body) => request(p, { method: "PATCH", body }),
  del: (p) => request(p, { method: "DELETE" }),
  setTokens,
  setOnAuthChange,
  API_BASE, // kerak bo'lsa tashqarida ko'rish uchun
};
