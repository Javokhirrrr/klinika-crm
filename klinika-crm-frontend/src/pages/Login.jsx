// src/pages/Login.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import http from "../lib/http";

const RAW_API_BASE = (import.meta.env.VITE_API_URL || "").trim().replace(/\/+$/,"");
const API_BASE = RAW_API_BASE; // devda bo'sh bo'lishi mumkin
const api = (path) => (API_BASE ? `${API_BASE}${path}` : `/api${path}`);

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();

  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const payload = emailOrPhone.includes("@")
        ? { email: emailOrPhone.trim(), password }
        : { phone: emailOrPhone.trim(), password };

      const res = await fetch(api('/auth/login'), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // agar backend cookie ham bersa
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Login failed");
      }

      const accessToken  = data.accessToken  || data.token         || data.access_token  || null;
      const refreshToken = data.refreshToken || data.refresh_token || null;
      const user         = data.user || data.data?.user || data.profile || null;
      const org          = data.org || null;

      // 🔴 MUHIM: tokenlarni http.js ga yozib qo'yamiz
      if (!accessToken) {
        throw new Error("Access token olinmadi (backend javobini tekshiring).");
      }
      http.setTokens(accessToken, refreshToken || "");

      // Auth kontekstni yangilash (ui uchun)
      login({ user, accessToken, refreshToken, org });

      nav("/dashboard", { replace: true });
    } catch (ex) {
      setErr(ex?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-shell">
      <section className="auth-side">
        <div className="brandX">
          <div className="logoDot" />
          <div className="brand-title">Klinika <span className="brandAccent">CRM</span></div>
          <div className="brand-sub">Kirish</div>
        </div>

        <form onSubmit={submit} className="glass-card">
          <label className="label">Email yoki Telefon</label>
          <input
            className="inputX"
            value={emailOrPhone}
            onChange={(e) => setEmailOrPhone(e.target.value)}
            placeholder="email@example.com yoki +99890..."
            autoComplete="username"
            required
          />

          <label className="label">Parol</label>
          <input
            className="inputX"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />

          {err && <div className="errorX">{err}</div>}

          <button className="btnX primary" type="submit" disabled={busy} style={{ marginTop: 10 }}>
            {busy ? "Yuklanmoqda…" : "Kirish"}
          </button>

          <div className="mutedX" style={{ marginTop: 10 }}>
            Hali ro'yhatdan o'tmadizmi? <Link to="/register">Ro‘yxatdan o‘tish</Link>
          </div>
        </form>
      </section>

      <aside className="hero-panel">
        <div className="hero-inner">
          <h1 className="hero-title">Soddalashtirilgan klinika boshqaruvi</h1>
          <p className="hero-text">Qabulni rejalashtiring, bemorlar va to‘lovlarni yuriting, hisobotlarni avtomatik oling.</p>
          <div className="hero-figure"><div className="card" /></div>
        </div>
      </aside>
    </div>
  );
}
