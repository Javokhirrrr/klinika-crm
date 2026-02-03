import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import http from "../lib/http";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

const RAW_API_URL = (import.meta.env.VITE_API_URL || "").trim().replace(/\/+$/, "");
const API_BASE = RAW_API_URL ? `${RAW_API_URL}/api` : "http://localhost:5000/api";

/* ===============================
   Helpers
   =============================== */
function safeGetJSON(key) {
  const raw = localStorage.getItem(key);
  if (!raw || raw === "undefined" || raw === "null") {
    localStorage.removeItem(key);
    return null;
  }
  try { return JSON.parse(raw); } catch { localStorage.removeItem(key); return null; }
}

function parseJwt(token) {
  try {
    if (!token) return null;
    const [, payload] = token.split(".");
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch { return null; }
}

const emailsAllow = (import.meta.env.VITE_ADMIN_EMAILS || "")
  .toLowerCase().split(",").map(s => s.trim()).filter(Boolean);
const phonesAllow = (import.meta.env.VITE_ADMIN_PHONES || "")
  .split(",").map(s => s.trim()).filter(Boolean);

/* ===============================
   AuthProvider
   =============================== */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [org, setOrg] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [cookieAuthed, setCookieAuthed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const u = safeGetJSON("user");
        const o = safeGetJSON("org");
        const at = localStorage.getItem("accessToken") || null;
        if (u) setUser(u);
        if (o) setOrg(o);
        if (at) setAccessToken(at);

        if (!u && !at) {
          const res = await fetch(`${API_BASE}/auth/me`, {
            method: "GET",
            credentials: "include",
            headers: { Accept: "application/json" },
          });
          if (!res.ok) throw new Error(`me ${res.status}`);

          const data = await res.json().catch(() => null);
          const usr = data?.user || data?.data?.user || data?.profile || null;
          const tok = data?.accessToken || data?.token || data?.access_token || null;
          const org = data?.org || null;

          if (!cancelled && usr) {
            setUser(usr);
            setCookieAuthed(true);
            if (tok) {
              setAccessToken(tok);
              localStorage.setItem("accessToken", tok);
            }
            if (org) {
              setOrg(org);
              localStorage.setItem("org", JSON.stringify(org));
            }
            localStorage.setItem("user", JSON.stringify(usr));
          }
        }
      } catch (e) {
        console.warn("Auth bootstrap skipped:", e?.message || e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* ===============================
     login / logout
     =============================== */
  const login = ({ user, accessToken, refreshToken, org }) => {
    const u = user && typeof user === "object" ? user : null;
    setUser(u);
    setCookieAuthed(Boolean(u) && !accessToken);
    setAccessToken(accessToken || null);
    if (org) setOrg(org || null);

    if (u) localStorage.setItem("user", JSON.stringify(u));
    else localStorage.removeItem("user");

    if (accessToken) localStorage.setItem("accessToken", accessToken);
    else localStorage.removeItem("accessToken");

    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
    if (org) localStorage.setItem("org", JSON.stringify(org));
    else localStorage.removeItem("org");
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
      }).catch(() => { });
    } finally {
      setUser(null);
      setOrg(null);
      setAccessToken(null);
      setCookieAuthed(false);
      localStorage.removeItem("user");
      localStorage.removeItem("org");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    }
  };

  /* ===============================
     Role / admin aniqlash
     =============================== */
  const roleFromUser = user?.role;
  const roleFromToken = parseJwt(accessToken)?.role;
  const role = roleFromUser || roleFromToken || "user";

  const email = (user?.email || user?.mail || "").toLowerCase();
  const phone = (user?.phone || user?.tel || "").trim();
  const isAllowlisted = (email && emailsAllow.includes(email)) || (phone && phonesAllow.includes(phone));
  const isAdmin = role === "admin" || role === "platform" || isAllowlisted;

  /* ===============================
     Context qiymati
     =============================== */
  // Fix: Push tokens to http helper
  useEffect(() => {
    const rt = localStorage.getItem("refreshToken") || "";
    http.setTokens(accessToken || "", rt);
  }, [accessToken]);

  // Fix: Listen for token refresh from http helper
  useEffect(() => {
    http.setOnAuthChange(({ accessToken: at, refreshToken: rt }) => {
      if (at) {
        setAccessToken(at);
        localStorage.setItem("accessToken", at);
      }
      if (rt) {
        localStorage.setItem("refreshToken", rt);
      }
    });
  }, []);

  const value = useMemo(() => ({
    user, org, accessToken, loading, login, logout,
    isAuthed: Boolean(accessToken) || cookieAuthed,
    isAdmin,
  }), [user, org, accessToken, cookieAuthed, loading, isAdmin]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
