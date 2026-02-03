import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RAW_API_URL = (import.meta.env.VITE_API_URL || "").trim().replace(/\/+$/, "");
const API_BASE = RAW_API_URL ? `${RAW_API_URL}/api` : "http://localhost:5000/api";

export default function Register() {
  const nav = useNavigate();
  const { login } = useAuth();

  const [name, setName] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register-self`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, clinicName, email, password, confirm }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Ro‘yxatdan o‘tish amalga oshmadi");
      }

      // backend qaytaradi: { accessToken, refreshToken, user, org }
      const accessToken = data.accessToken || data.token || data.access_token || null;
      const refreshToken = data.refreshToken || data.refresh_token || null;
      const user = data.user || data.data?.user || null;
      const org = data.org || null;

      // AuthContext ga yozamiz
      login({ user, accessToken, refreshToken, org });

      nav("/dashboard", { replace: true });
    } catch (ex) {
      setErr(ex?.message || "Xatolik");
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
          <div className="brand-sub">Ro‘yxatdan o‘tish</div>
        </div>

        <form className="glass-card" onSubmit={submit}>
          <label className="label">Ism</label>
          <input className="inputX" value={name} onChange={e => setName(e.target.value)} required />

          <label className="label">Klinika nomi</label>
          <input className="inputX" value={clinicName} onChange={e => setClinicName(e.target.value)} required />

          <label className="label">Email</label>
          <input className="inputX" type="email" value={email} onChange={e => setEmail(e.target.value)} required />

          <label className="label">Parol</label>
          <input className="inputX" type="password" value={password} onChange={e => setPassword(e.target.value)} required />

          <label className="label">Parol (tasdiq)</label>
          <input className="inputX" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required />

          {err && <div className="errorX">{err}</div>}

          <button className="btnX primary" type="submit" disabled={busy} style={{ marginTop: 10 }}>
            {busy ? "Yuklanmoqda…" : "Ro‘yxatdan o‘tish"}
          </button>

          <div className="mutedX" style={{ marginTop: 10 }}>
            Akkount bormi? <Link to="/login">Kirish</Link>
          </div>
        </form>
      </section>

      <aside className="hero-panel variant">
        <div className="hero-inner">
          <h1 className="hero-title">Klinikaingizni bir joydan boshqaring</h1>
          <p className="hero-text">Qabul, bemorlar, xizmatlar va to‘lovlar — barchasi bitta tizimda.</p>
          <div className="hero-figure tall" />
        </div>
      </aside>
    </div>
  );
}
