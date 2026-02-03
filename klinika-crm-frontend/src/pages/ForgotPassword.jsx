import { useState } from "react";
import { Link } from "react-router-dom";

const RAW_API_URL = (import.meta.env.VITE_API_URL || "").trim().replace(/\/+$/, "");
const API_BASE = RAW_API_URL ? `${RAW_API_URL}/api` : "http://localhost:5000/api";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [busy, setBusy] = useState(false);
    const [success, setSuccess] = useState(false);
    const [err, setErr] = useState("");

    async function submit(e) {
        e.preventDefault();
        setErr("");
        setSuccess(false);
        setBusy(true);
        try {
            const res = await fetch(`${API_BASE}/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim() }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data?.message || "Xatolik yuz berdi");
            }
            setSuccess(true);
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
                    <div className="brand-sub">Parolni tiklash</div>
                </div>

                <form className="glass-card" onSubmit={submit}>
                    {!success ? (
                        <>
                            <p className="mutedX" style={{ marginBottom: 16 }}>
                                Email manzilingizni kiriting. Sizga parolni tiklash havolasi yuboriladi.
                            </p>

                            <label className="label">Email</label>
                            <input
                                className="inputX"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="email@example.com"
                                required
                            />

                            {err && <div className="errorX">{err}</div>}

                            <button className="btnX primary" type="submit" disabled={busy} style={{ marginTop: 10 }}>
                                {busy ? "Yuborilmoqda…" : "Yuborish"}
                            </button>
                        </>
                    ) : (
                        <div className="successX" style={{ textAlign: "center" }}>
                            <p style={{ marginBottom: 16 }}>
                                ✅ Agar bu email ro'yxatdan o'tgan bo'lsa, parolni tiklash havolasi yuboriladi.
                            </p>
                            <p className="mutedX">
                                Email'ingizni tekshiring va havolani bosing.
                            </p>
                        </div>
                    )}

                    <div className="mutedX" style={{ marginTop: 16, textAlign: "center" }}>
                        <Link to="/login">← Kirish sahifasiga qaytish</Link>
                    </div>
                </form>
            </section>

            <aside className="hero-panel">
                <div className="hero-inner">
                    <h1 className="hero-title">Parolni unutdingizmi?</h1>
                    <p className="hero-text">Tashvishlanmang! Email manzilingizni kiriting va parolni tiklash havolasini oling.</p>
                    <div className="hero-figure"><div className="card" /></div>
                </div>
            </aside>
        </div>
    );
}
