import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";

const RAW_API_URL = (import.meta.env.VITE_API_URL || "").trim().replace(/\/+$/, "");
const API_BASE = RAW_API_URL ? `${RAW_API_URL}/api` : "http://localhost:5000/api";

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const nav = useNavigate();
    const token = searchParams.get("token");

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [busy, setBusy] = useState(false);
    const [success, setSuccess] = useState(false);
    const [err, setErr] = useState("");

    useEffect(() => {
        if (!token) {
            setErr("Token topilmadi. Parolni tiklash havolasini qayta tekshiring.");
        }
    }, [token]);

    async function submit(e) {
        e.preventDefault();
        setErr("");
        setSuccess(false);

        if (newPassword !== confirmPassword) {
            setErr("Parollar mos kelmadi");
            return;
        }

        if (newPassword.length < 6) {
            setErr("Parol kamida 6 ta belgidan iborat bo'lishi kerak");
            return;
        }

        setBusy(true);
        try {
            const res = await fetch(`${API_BASE}/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data?.message || "Parolni tiklash amalga oshmadi");
            }
            setSuccess(true);
            setTimeout(() => nav("/login"), 2000);
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
                    <div className="brand-sub">Yangi parol</div>
                </div>

                <form className="glass-card" onSubmit={submit}>
                    {!success ? (
                        <>
                            <label className="label">Yangi parol</label>
                            <input
                                className="inputX"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                disabled={!token}
                            />

                            <label className="label">Parolni tasdiqlang</label>
                            <input
                                className="inputX"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                disabled={!token}
                            />

                            {err && <div className="errorX">{err}</div>}

                            <button
                                className="btnX primary"
                                type="submit"
                                disabled={busy || !token}
                                style={{ marginTop: 10 }}
                            >
                                {busy ? "Saqlanmoqda…" : "Parolni yangilash"}
                            </button>
                        </>
                    ) : (
                        <div className="successX" style={{ textAlign: "center" }}>
                            <p style={{ marginBottom: 16 }}>
                                ✅ Parol muvaffaqiyatli yangilandi!
                            </p>
                            <p className="mutedX">
                                Kirish sahifasiga yo'naltirilmoqda...
                            </p>
                        </div>
                    )}

                    <div className="mutedX" style={{ marginTop: 16, textAlign: "center" }}>
                        <Link to="/login">← Kirish sahifasiga qaytish</Link>
                    </div>
                </form>
            </section>

            <aside className="hero-panel variant">
                <div className="hero-inner">
                    <h1 className="hero-title">Yangi parol yarating</h1>
                    <p className="hero-text">Kuchli parol yarating va uni eslab qoling.</p>
                    <div className="hero-figure tall" />
                </div>
            </aside>
        </div>
    );
}
