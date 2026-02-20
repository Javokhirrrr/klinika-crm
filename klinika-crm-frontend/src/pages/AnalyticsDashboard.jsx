import { useState, useEffect } from "react";
import http from "../lib/http";

/* ─── Micro chart (SVG sparkline) ───────────────────────────────── */
function Sparkline({ data = [], color = "#3b82f6", height = 48 }) {
    if (!data.length) return null;
    const max = Math.max(...data, 1);
    const w = 200, h = height;
    const pts = data.map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - (v / max) * h;
        return `${x},${y}`;
    }).join(" ");
    return (
        <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
            <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

/* ─── Bar chart ─────────────────────────────────────────────────── */
function BarChart({ data = [], labelKey = "_id", valueKey = "total", color = "#3b82f6", formatVal }) {
    const max = Math.max(...data.map(d => d[valueKey] || 0), 1);
    return (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120, padding: "0 4px" }}>
            {data.slice(-12).map((d, i) => {
                const pct = ((d[valueKey] || 0) / max) * 100;
                const label = typeof d[labelKey] === "object"
                    ? `${d[labelKey].m || d[labelKey].month || ""}/${String(d[labelKey].y || d[labelKey].year || "").slice(-2)}`
                    : String(d[labelKey] || "").slice(0, 6);
                return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                        <div style={{ fontSize: 9, color: "#94a3b8", whiteSpace: "nowrap" }}>
                            {formatVal ? formatVal(d[valueKey]) : ""}
                        </div>
                        <div style={{
                            width: "100%", background: color, borderRadius: "4px 4px 0 0",
                            height: `${Math.max(pct, 2)}%`, transition: "height .4s ease",
                            opacity: 0.85
                        }} />
                        <div style={{ fontSize: 9, color: "#94a3b8", textAlign: "center", whiteSpace: "nowrap" }}>{label}</div>
                    </div>
                );
            })}
        </div>
    );
}

/* ─── Donut chart ───────────────────────────────────────────────── */
function DonutChart({ data = [], colors = ["#3b82f6", "#ec4899"] }) {
    const total = data.reduce((s, d) => s + (d.count || 0), 0) || 1;
    let offset = 0;
    const r = 40, circumference = 2 * Math.PI * r;
    return (
        <svg width={100} height={100} viewBox="0 0 100 100">
            {data.map((d, i) => {
                const pct = (d.count || 0) / total;
                const dash = pct * circumference;
                const el = (
                    <circle key={i} r={r} cx={50} cy={50}
                        fill="none" stroke={colors[i] || "#ddd"} strokeWidth={14}
                        strokeDasharray={`${dash} ${circumference - dash}`}
                        strokeDashoffset={-offset * circumference}
                        transform="rotate(-90 50 50)"
                    />
                );
                offset += pct;
                return el;
            })}
        </svg>
    );
}

/* ─── Number formatter ──────────────────────────────────────────── */
const fmtSum = v => {
    if (!v) return "0";
    if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + " mln";
    if (v >= 1_000) return (v / 1_000).toFixed(0) + " ming";
    return String(v);
};

/* ─── Icons ─────────────────────────────────────────────────────── */
const I = {
    Wallet: () => <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 12V7H5a2 2 0 0 1 0-4h11v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4z" /></svg>,
    Users: () => <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx={9} cy={7} r={4} /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    Calendar: () => <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x={3} y={4} width={18} height={18} rx={2} /><line x1={16} y1={2} x2={16} y2={6} /><line x1={8} y1={2} x2={8} y2={6} /><line x1={3} y1={10} x2={21} y2={10} /></svg>,
    Queue: () => <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1={8} y1={6} x2={21} y2={6} /><line x1={8} y1={12} x2={21} y2={12} /><line x1={8} y1={18} x2={21} y2={18} /><line x1={3} y1={6} x2={3.01} y2={6} /><line x1={3} y1={12} x2={3.01} y2={12} /><line x1={3} y1={18} x2={3.01} y2={18} /></svg>,
    TrendUp: () => <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>,
    Star: () => <svg width={15} height={15} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>,
    Refresh: () => <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>,
};

/* ─── MAIN ──────────────────────────────────────────────────────── */
export default function AnalyticsDashboard() {
    const [stats, setStats] = useState(null);
    const [financial, setFinancial] = useState([]);
    const [patientSt, setPatientSt] = useState(null);
    const [performance, setPerformance] = useState([]);
    const [topSvc, setTopSvc] = useState([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState("month"); // day | month

    useEffect(() => { loadAll(); }, []);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [s, f, p, perf, top] = await Promise.allSettled([
                http.get("/analytics/dashboard-stats"),
                http.get("/analytics/financial-report", { params: { groupBy: "month" } }),
                http.get("/analytics/patient-stats"),
                http.get("/analytics/doctor-performance"),
                http.get("/payments/reports/top-services", { params: { limit: 8 } }),
            ]);
            if (s.status === "fulfilled") setStats(s.value);
            if (f.status === "fulfilled") setFinancial(f.value?.revenue || []);
            if (p.status === "fulfilled") setPatientSt(p.value);
            if (perf.status === "fulfilled") setPerformance(perf.value?.performance || []);
            if (top.status === "fulfilled") setTopSvc(top.value?.rows || []);
        } catch { }
        finally { setLoading(false); }
    };

    const st = stats?.stats || {};
    const recentPay = stats?.recentPayments || [];
    const monthlyRev = stats?.monthlyRevenue || financial;

    /* Stat cards */
    const CARDS = [
        { label: "Jami daromad", value: fmtSum(st.totalRevenue) + " so'm", icon: I.Wallet, grad: "linear-gradient(135deg,#0ea5e9,#6366f1)", spark: monthlyRev.map(r => r.total || 0) },
        { label: "Bemorlar", value: (st.totalPatients || 0).toLocaleString(), icon: I.Users, grad: "linear-gradient(135deg,#ec4899,#f43f5e)", spark: [] },
        { label: "Qabullar", value: (st.totalAppointments || 0).toLocaleString(), icon: I.Calendar, grad: "linear-gradient(135deg,#22c55e,#16a34a)", spark: [] },
        { label: "Bugungi navbat", value: (st.todayQueue || 0).toLocaleString(), icon: I.Queue, grad: "linear-gradient(135deg,#f59e0b,#ea580c)", spark: [] },
    ];

    const genderData = patientSt?.patientsByGender || [];
    const genderColors = { male: "#3b82f6", erkak: "#3b82f6", female: "#ec4899", ayol: "#ec4899" };

    return (
        <div style={S.page}>
            {/* Header */}
            <div style={S.hdr}>
                <div>
                    <h1 style={S.title}>📊 Analitika</h1>
                    <p style={S.sub}>Klinika statistikasi va hisobotlar</p>
                </div>
                <button style={S.refreshBtn} onClick={loadAll} title="Yangilash">
                    <I.Refresh /> Yangilash
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: 80 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#6366f1", animation: "spin .7s linear infinite", margin: "0 auto 14px" }} />
                    <div style={{ color: "#94a3b8", fontWeight: 600 }}>Yuklanmoqda...</div>
                    <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
                </div>
            ) : (
                <>
                    {/* ── Stat Cards ─────────────────────────────────────── */}
                    <div style={S.grid4}>
                        {CARDS.map((c, i) => {
                            const Icon = c.icon;
                            return (
                                <div key={i} style={S.statCard}
                                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(0,0,0,0.1)"; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"; }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                                        <div>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{c.label}</div>
                                            <div style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.03em" }}>{c.value}</div>
                                        </div>
                                        <div style={{ width: 44, height: 44, borderRadius: 12, background: c.grad, display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0, boxShadow: "0 4px 14px rgba(0,0,0,0.15)" }}>
                                            <Icon />
                                        </div>
                                    </div>
                                    {c.spark.length > 1 && (
                                        <div style={{ opacity: 0.6 }}>
                                            <Sparkline data={c.spark} color="#6366f1" height={36} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* ── Revenue Chart + Gender ──────────────────────────── */}
                    <div style={S.row2}>
                        {/* Revenue Bar Chart */}
                        <div style={{ ...S.card, flex: 2 }}>
                            <div style={S.cardHdr}>
                                <span style={S.cardTitle}>💰 Oylik daromad</span>
                                <span style={{ fontSize: 12, color: "#64748b" }}>So'mda</span>
                            </div>
                            <div style={{ padding: "16px 20px 20px" }}>
                                {monthlyRev.length > 0 ? (
                                    <BarChart
                                        data={monthlyRev}
                                        labelKey="_id"
                                        valueKey="total"
                                        color="#6366f1"
                                        formatVal={v => v >= 1_000_000 ? (v / 1_000_000).toFixed(1) + "M" : v >= 1000 ? (v / 1000).toFixed(0) + "K" : String(v)}
                                    />
                                ) : (
                                    <div style={{ textAlign: "center", padding: "32px 0", color: "#94a3b8", fontSize: 14 }}>Ma'lumot yo'q</div>
                                )}
                            </div>
                        </div>

                        {/* Gender Donut */}
                        <div style={{ ...S.card, flex: 1 }}>
                            <div style={S.cardHdr}>
                                <span style={S.cardTitle}>👥 Bemorlar jinsi</span>
                            </div>
                            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                                {genderData.length > 0 ? (
                                    <>
                                        <DonutChart
                                            data={genderData}
                                            colors={genderData.map(d => genderColors[(d._id || "").toLowerCase()] || "#94a3b8")}
                                        />
                                        <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
                                            {genderData.map((d, i) => (
                                                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: genderColors[(d._id || "").toLowerCase()] || "#94a3b8" }} />
                                                        <span style={{ fontSize: 13, color: "#475569", textTransform: "capitalize" }}>{d._id || "Noma'lum"}</span>
                                                    </div>
                                                    <span style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{d.count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ textAlign: "center", padding: "32px 0", color: "#94a3b8", fontSize: 14 }}>Ma'lumot yo'q</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Doctor Performance ──────────────────────────────── */}
                    <div style={{ ...S.card, marginBottom: 20 }}>
                        <div style={S.cardHdr}>
                            <span style={S.cardTitle}>👨‍⚕️ Shifokorlar samaradorligi</span>
                        </div>
                        {performance.length === 0 ? (
                            <div style={{ padding: "32px", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>Ma'lumot yo'q</div>
                        ) : (
                            <div style={{ overflowX: "auto" }}>
                                <table style={S.table}>
                                    <thead>
                                        <tr>
                                            {["#", "Shifokor", "Jami qabullar", "Bajarilgan", "Samaradorlik"].map(h => (
                                                <th key={h} style={S.th}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {performance.slice(0, 10).map((p, i) => (
                                            <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}
                                                onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                                                onMouseLeave={e => e.currentTarget.style.background = ""}
                                            >
                                                <td style={{ ...S.td, fontWeight: 700, color: "#94a3b8", width: 36 }}>{i + 1}</td>
                                                <td style={S.td}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: `hsl(${(i * 47) % 360},65%,55%)`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 13 }}>
                                                            {(p.doctorName || "?")[0]}
                                                        </div>
                                                        <span style={{ fontWeight: 600, color: "#1e293b" }}>{p.doctorName || "Noma'lum"}</span>
                                                    </div>
                                                </td>
                                                <td style={{ ...S.td, textAlign: "center", fontWeight: 700 }}>{p.totalAppointments}</td>
                                                <td style={{ ...S.td, textAlign: "center" }}>
                                                    <span style={{ padding: "2px 10px", borderRadius: 20, background: "#d1fae5", color: "#065f46", fontSize: 12, fontWeight: 700 }}>{p.completedAppointments}</span>
                                                </td>
                                                <td style={{ ...S.td }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                        <div style={{ flex: 1, height: 6, borderRadius: 3, background: "#f1f5f9", overflow: "hidden" }}>
                                                            <div style={{ height: "100%", borderRadius: 3, width: `${(p.completionRate || 0).toFixed(0)}%`, background: p.completionRate >= 70 ? "#22c55e" : p.completionRate >= 40 ? "#f59e0b" : "#ef4444", transition: "width .5s ease" }} />
                                                        </div>
                                                        <span style={{ fontSize: 12, fontWeight: 700, color: "#475569", minWidth: 36 }}>{(p.completionRate || 0).toFixed(0)}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* ── Top Services + Recent Payments ─────────────────── */}
                    <div style={S.row2}>
                        {/* Top xizmatlar */}
                        <div style={{ ...S.card, flex: 1 }}>
                            <div style={S.cardHdr}>
                                <span style={S.cardTitle}>⭐ Top xizmatlar</span>
                            </div>
                            {topSvc.length === 0 ? (
                                <div style={{ padding: "32px", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>Ma'lumot yo'q</div>
                            ) : (
                                <div style={{ padding: "8px 0" }}>
                                    {topSvc.map((s, i) => {
                                        const maxSold = topSvc[0]?.sold || 1;
                                        return (
                                            <div key={i} style={{ padding: "10px 20px", borderBottom: "1px solid #f8fafc", display: "flex", alignItems: "center", gap: 12 }}>
                                                <div style={{ width: 28, height: 28, borderRadius: 8, background: `hsl(${(i * 47) % 360},65%,92%)`, color: `hsl(${(i * 47) % 360},55%,40%)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, flexShrink: 0 }}>{i + 1}</div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                                                    <div style={{ height: 4, borderRadius: 2, background: "#f1f5f9" }}>
                                                        <div style={{ height: "100%", borderRadius: 2, width: `${(s.sold / maxSold) * 100}%`, background: "linear-gradient(90deg,#6366f1,#8b5cf6)" }} />
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: "right", flexShrink: 0 }}>
                                                    <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>{s.sold} ta</div>
                                                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{fmtSum(s.revenue)} so'm</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* So'nggi to'lovlar */}
                        <div style={{ ...S.card, flex: 1 }}>
                            <div style={S.cardHdr}>
                                <span style={S.cardTitle}>💳 So'nggi to'lovlar</span>
                            </div>
                            {recentPay.length === 0 ? (
                                <div style={{ padding: "32px", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>Ma'lumot yo'q</div>
                            ) : (
                                <div style={{ padding: "8px 0" }}>
                                    {recentPay.map((p, i) => {
                                        const name = p.patientId ? `${p.patientId.firstName || ""} ${p.patientId.lastName || ""}`.trim() : "Bemor";
                                        const methodColors = { cash: "#22c55e", card: "#3b82f6", transfer: "#f59e0b", online: "#a855f7" };
                                        const methodLabels = { cash: "Naqd", card: "Karta", transfer: "O'tkazma", online: "Online" };
                                        return (
                                            <div key={i} style={{ padding: "10px 20px", borderBottom: "1px solid #f8fafc", display: "flex", alignItems: "center", gap: 12 }}>
                                                <div style={{ width: 36, height: 36, borderRadius: "50%", background: `hsl(${(i * 53) % 360},65%,92%)`, color: `hsl(${(i * 53) % 360},55%,40%)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                                                    {(name[0] || "?").toUpperCase()}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name || "Noma'lum"}</div>
                                                    <span style={{ padding: "1px 8px", borderRadius: 20, background: `${methodColors[p.method] || "#94a3b8"}22`, color: methodColors[p.method] || "#94a3b8", fontSize: 11, fontWeight: 700 }}>
                                                        {methodLabels[p.method] || p.method}
                                                    </span>
                                                </div>
                                                <span style={{ fontSize: 14, fontWeight: 900, color: "#22c55e", flexShrink: 0 }}>
                                                    +{fmtSum(p.amount)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Top Visitors ────────────────────────────────────── */}
                    {(patientSt?.topPatients || []).length > 0 && (
                        <div style={{ ...S.card, marginBottom: 20 }}>
                            <div style={S.cardHdr}>
                                <span style={S.cardTitle}>🏆 Ko'p tashrif buyuruvchi bemorlar</span>
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, padding: "16px 20px" }}>
                                {(patientSt.topPatients || []).slice(0, 8).map((p, i) => (
                                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", borderRadius: 12, background: "#f8fafc", border: "1px solid #f1f5f9" }}>
                                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: `hsl(${(i * 47) % 360},65%,55%)`, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                                            {i + 1}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{p.name || "Noma'lum"}</div>
                                            <div style={{ fontSize: 11, color: "#94a3b8" }}>{p.visits} ta tashrif</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
        </div>
    );
}

/* ─── Styles ─────────────────────────────────────────────────────── */
const S = {
    page: { padding: "28px 32px", maxWidth: 1280, margin: "0 auto", fontFamily: "'Inter',sans-serif" },
    hdr: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 },
    title: { fontSize: 24, fontWeight: 900, color: "#0f172a", margin: "0 0 2px", letterSpacing: "-0.02em" },
    sub: { fontSize: 14, color: "#64748b", margin: 0 },
    refreshBtn: { display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "white", color: "#475569", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" },
    grid4: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 18, marginBottom: 22 },
    statCard: { background: "white", borderRadius: 18, padding: "20px", border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", transition: "transform .15s,box-shadow .15s", cursor: "default" },
    row2: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 18, marginBottom: 20 },
    card: { background: "white", borderRadius: 16, border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", overflow: "hidden" },
    cardHdr: { padding: "14px 20px", borderBottom: "1.5px solid #f1f5f9", background: "#fafbff", display: "flex", justifyContent: "space-between", alignItems: "center" },
    cardTitle: { fontSize: 15, fontWeight: 800, color: "#0f172a" },
    table: { width: "100%", borderCollapse: "collapse" },
    th: { padding: "10px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", background: "#fafbff", borderBottom: "1.5px solid #f1f5f9" },
    td: { padding: "12px 20px", fontSize: 14, color: "#374151" },
};
