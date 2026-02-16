import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import http from "../lib/http";
import api from "../services/api";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

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
          if (!u && !at) {
            const res = await api.get('/api/auth/me');
            const data = res.data;
            // if (!res.ok) throw new Error(`me ${res.status}`); // api.get throws on error automatically

            // const data = await res.json().catch(() => null);
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
      await api.post('/api/auth/logout').catch(() => { });
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
