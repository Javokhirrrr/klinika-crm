// src/lib/http.js — with in-memory cache for GET requests
const API_BASE = "https://klinika-crm-eng-yangi-production.up.railway.app";

let accessToken = localStorage.getItem("accessToken") || "";
let refreshToken = localStorage.getItem("refreshToken") || "";
let onAuthChange = () => { };

// ─── Simple in-memory cache ───────────────────────────────────────────────────
const cache = new Map();
const CACHE_TTL = 30_000; // 30 soniya (shu muddat ichida qayta so'rov bo'lmaydi)
const CACHE_SKIP = ['/auth', '/payments', '/appointments']; // bu URL'lar cache bo'lmaydi (appointments real-time)

function shouldCache(path) {
  return !CACHE_SKIP.some(skip => path.includes(skip));
}

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data) {
  cache.set(key, { data, ts: Date.now() });
}

// Cache ni tozalash (POST/PUT/PATCH/DELETE dan keyin)
function invalidateCache(basePath) {
  // /patients ga POST bo'lsa, /patients bilan boshlanadigan cache'larni o'chirish
  for (const key of cache.keys()) {
    if (key.includes(basePath.split('?')[0].split('/').slice(0, 3).join('/'))) {
      cache.delete(key);
    }
  }
}

export function clearAllCache() {
  cache.clear();
}

// ─── In-flight dedupe (bir vaqtda bir xil so'rov kelsa, bitta so'rov yuboriladi) ──
const inFlight = new Map();

// ─── Auth ─────────────────────────────────────────────────────────────────────
function setTokens(at, rt = "") {
  accessToken = at || "";
  refreshToken = rt || "";
  onAuthChange({ accessToken, refreshToken });
}

function setOnAuthChange(cb) {
  onAuthChange = typeof cb === "function" ? cb : () => { };
}

// ─── Core request ─────────────────────────────────────────────────────────────
async function request(path, opts = {}) {
  const apiPath = path.startsWith('/api') ? path : `/api${path}`;
  const url = API_BASE ? `${API_BASE}${apiPath}` : apiPath;
  const isGet = !opts.method || opts.method === "GET";

  // GET — cache va dedupe
  if (isGet && shouldCache(path)) {
    const cached = getCached(url);
    if (cached) return cached;

    // Dedupe: agar shu URL hali so'ralayotgan bo'lsa, kutib tur
    if (inFlight.has(url)) {
      return inFlight.get(url);
    }
  }

  const currentToken = localStorage.getItem("accessToken") || accessToken;

  const fetchPromise = fetch(url, {
    method: opts.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
      ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
    },
    body: opts.body
      ? (typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body))
      : undefined,
    credentials: "include",
  }).then(async (res) => {
    const isJson = res.headers.get("content-type")?.includes("application/json");
    const data = isJson
      ? await res.json().catch(() => ({}))
      : await res.text().catch(() => "");

    // 401 — token yangilash
    if (res.status === 401 && refreshToken) {
      const ok = await tryRefresh();
      if (ok) {
        const freshToken = localStorage.getItem("accessToken") || accessToken;
        const retry = await fetch(url, {
          method: opts.method || "GET",
          headers: {
            "Content-Type": "application/json",
            ...(opts.headers || {}),
            ...(freshToken ? { Authorization: `Bearer ${freshToken}` } : {}),
          },
          body: opts.body
            ? (typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body))
            : undefined,
          credentials: "include",
        });
        const retryData = retry.headers.get("content-type")?.includes("application/json")
          ? await retry.json().catch(() => ({}))
          : await retry.text().catch(() => "");
        if (!retry.ok) throw retryData || { message: "Request failed" };

        // Cache yangi data
        if (isGet && shouldCache(path)) setCache(url, retryData);
        return retryData;
      }
    }

    if (!res.ok) throw data || { message: "Request failed" };

    // GET so'rovlar uchun cache
    if (isGet && shouldCache(path)) setCache(url, data);

    return data;
  }).finally(() => {
    inFlight.delete(url);
  });

  // In-flight ga qo'sh
  if (isGet && shouldCache(path)) {
    inFlight.set(url, fetchPromise);
  }

  // Mutable so'rovlarda cache invalidate qil
  if (!isGet) {
    const base = '/' + path.split('/').filter(Boolean).slice(0, 2).join('/');
    invalidateCache(base);
  }

  return fetchPromise;
}

// ─── Token refresh ────────────────────────────────────────────────────────────
async function tryRefresh() {
  try {
    const currentRefreshToken = localStorage.getItem("refreshToken") || refreshToken;
    if (!currentRefreshToken) {
      handleAuthFailure();
      return false;
    }
    const url = API_BASE ? `${API_BASE}/api/auth/refresh` : `/api/auth/refresh`;
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
    }
    handleAuthFailure();
    return false;
  } catch {
    handleAuthFailure();
    return false;
  }
}

function handleAuthFailure() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  localStorage.removeItem("org");
  accessToken = "";
  refreshToken = "";
  clearAllCache();
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

// ─── Query string builder ─────────────────────────────────────────────────────
function buildQuery(path, query) {
  if (!query || typeof query !== "object") return path;
  const search = new URLSearchParams();
  Object.entries(query).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      // params: { params: {...} } shaklini ham qo'llab-quvvatlash
      if (key === 'params' && typeof val === 'object') {
        Object.entries(val).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== "") search.append(k, v);
        });
      } else {
        search.append(key, val);
      }
    }
  });
  const qs = search.toString();
  return qs ? path + (path.includes("?") ? "&" : "?") + qs : path;
}

// ─── Exports ──────────────────────────────────────────────────────────────────
export default {
  get: (path, query) => request(buildQuery(path, query)),
  post: (p, body) => request(p, { method: "POST", body }),
  put: (p, body) => request(p, { method: "PUT", body }),
  patch: (p, body) => request(p, { method: "PATCH", body }),
  del: (p) => request(p, { method: "DELETE" }),
  setTokens,
  setOnAuthChange,
  clearCache: clearAllCache,
  API_BASE,
};
