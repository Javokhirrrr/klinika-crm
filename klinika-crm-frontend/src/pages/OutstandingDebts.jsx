import { useState, useEffect } from "react";
import http from "../lib/http";

/* ─── Icons ─────────────────────────────────────────────────────── */
const AlertIcon = () => (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <circle cx={12} cy={12} r={10} /><line x1={12} y1={8} x2={12} y2={12} /><line x1={12} y1={16} x2={12.01} y2={16} />
    </svg>
);
const UserIcon = () => (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx={12} cy={7} r={4} />
    </svg>
);
const PhoneIcon = () => (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.71 3.48C1.68 2.48 2.33 1.6 3.3 1.38l3-.7a2 2 0 0 1 2 1l1.27 3.49a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45l3.49 1.27a2 2 0 0 1 1.04 2.46z" />
    </svg>
);
const RefreshIcon = () => (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
);
const WhatsappIcon = () => (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12.05 2.002A9.923 9.923 0 0 0 2.05 12c0 1.75.45 3.39 1.23 4.82L2 22l5.31-1.27A9.923 9.923 0 0 0 12.05 22c5.51 0 9.95-4.49 9.95-10S17.56 2.002 12.05 2.002zm0 18c-1.55 0-3.07-.41-4.39-1.2l-.31-.19-3.16.76.79-3.08-.21-.32a7.99 7.99 0 0 1-1.17-4.24c0-4.41 3.59-8 8-8a8 8 0 0 1 8 8c0 4.41-3.59 8-8 8z" />
    </svg>
);

/* ─── Helper ─────────────────────────────────────────────────────── */
const fmtSum = v => {
    if (!v) return "0";
    return Number(v).toLocaleString("uz-UZ");
};

/* ─── Debt Row ──────────────────────────────────────────────────── */
function DebtRow({ item, idx }) {
    const [expanded, setExpanded] = useState(false);
    const debtPct = item.charges > 0 ? Math.min((item.debt / item.charges) * 100, 100) : 0;
    const severity = item.debt > 500_000 ? "high" : item.debt > 100_000 ? "medium" : "low";
    const sevColor = { high: "#dc2626", medium: "#d97706", low: "#059669" };
    const sevBg = { high: "#fee2e2", medium: "#fef3c7", low: "#d1fae5" };

    return (
        <tr style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer", transition: "background .1s" }}
            onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
            onMouseLeave={e => e.currentTarget.style.background = ""}
            onClick={() => setExpanded(!expanded)}
        >
            <td style={S.td}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: sevColor[severity], flexShrink: 0 }} />
                    <span style={{ fontWeight: 700, fontSize: 13, color: "#94a3b8" }}>{idx + 1}</span>
                </div>
            </td>
            <td style={S.td}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: `hsl(${(idx * 47) % 360},60%,90%)`, color: `hsl(${(idx * 47) % 360},50%,40%)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                        {(item.patientName || "?")[0].toUpperCase()}
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>{item.patientName || "Noma'lum"}</div>
                        {item.phone && (
                            <div style={{ fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}>
                                <PhoneIcon /> {item.phone}
                            </div>
                        )}
                    </div>
                </div>
            </td>
            <td style={{ ...S.td, textAlign: "right" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#64748b" }}>{fmtSum(item.charges)} so'm</span>
            </td>
            <td style={{ ...S.td, textAlign: "right" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#22c55e" }}>{fmtSum(item.paid)} so'm</span>
            </td>
            <td style={{ ...S.td }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, height: 6, borderRadius: 3, background: "#f1f5f9", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${debtPct}%`, borderRadius: 3, background: sevColor[severity], transition: "width .5s" }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: sevColor[severity], minWidth: 32 }}>{debtPct.toFixed(0)}%</span>
                </div>
            </td>
            <td style={{ ...S.td, textAlign: "right" }}>
                <span style={{ padding: "4px 12px", borderRadius: 20, background: sevBg[severity], color: sevColor[severity], fontWeight: 800, fontSize: 14 }}>
                    {fmtSum(item.debt)} so'm
                </span>
            </td>
            <td style={{ ...S.td }}>
                {item.phone && (
                    <a
                        href={`https://t.me/+${item.phone.replace(/\D/g, "")}`}
                        target="_blank" rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: "#e7f5ff", color: "#0088cc", textDecoration: "none", fontSize: 12, fontWeight: 600, border: "1px solid #bfdbfe" }}
                        title="Telegram orqali bog'lanish"
                    >
                        📩 Xabar
                    </a>
                )}
            </td>
        </tr>
    );
}

/* ─── MAIN ──────────────────────────────────────────────────────── */
export default function OutstandingDebts() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("debt"); // debt | charges | paid
    const [page, setPage] = useState(1);
    const PER_PAGE = 20;

    useEffect(() => { loadDebts(); }, []);

    const loadDebts = async () => {
        setLoading(true);
        try {
            const res = await http.get("/payments/reports/outstanding-debts");
            const rawRows = res?.rows || [];
            // Fetch patient details
            const withPatients = await Promise.allSettled(
                rawRows.map(async r => {
                    try {
                        const p = await http.get(`/patients/${r.patientId}`);
                        return {
                            ...r,
                            patientName: `${p.firstName || ""} ${p.lastName || ""}`.trim() || "Noma'lum",
                            phone: p.phone || "",
                        };
                    } catch {
                        return { ...r, patientName: "Noma'lum", phone: "" };
                    }
                })
            );
            setRows(withPatients.map(r => r.value || r.reason || {}));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const filtered = rows
        .filter(r => {
            if (!search) return true;
            const s = search.toLowerCase();
            return (r.patientName || "").toLowerCase().includes(s) ||
                (r.phone || "").includes(s);
        })
        .sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0));

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const totalDebt = rows.reduce((s, r) => s + (r.debt || 0), 0);
    const totalCharge = rows.reduce((s, r) => s + (r.charges || 0), 0);
    const totalPaid = rows.reduce((s, r) => s + (r.paid || 0), 0);
    const highRisk = rows.filter(r => r.debt > 500_000).length;

    return (
        <div style={S.page}>
            {/* Header */}
            <div style={S.hdr}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 16, background: "linear-gradient(135deg,#dc2626,#ef4444)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", boxShadow: "0 4px 14px rgba(220,38,38,0.3)" }}>
                        <AlertIcon />
                    </div>
                    <div>
                        <h1 style={S.title}>💸 Qarzdor bemorlar</h1>
                        <p style={S.sub}>To'lash kerak bo'lgan qoldiqlar</p>
                    </div>
                </div>
                <button style={S.refreshBtn} onClick={loadDebts}><RefreshIcon /> Yangilash</button>
            </div>

            {/* Stats */}
            <div style={S.statsRow}>
                {[
                    { label: "Jami qarz", value: fmtSum(totalDebt) + " so'm", icon: "💸", color: "#dc2626", bg: "#fee2e2" },
                    { label: "Jami hisob", value: fmtSum(totalCharge) + " so'm", icon: "🧾", color: "#d97706", bg: "#fef3c7" },
                    { label: "Jami to'langan", value: fmtSum(totalPaid) + " so'm", icon: "✅", color: "#059669", bg: "#d1fae5" },
                    { label: "Yuqori xavfli", value: highRisk + " ta bemor", icon: "⚠️", color: "#7c3aed", bg: "#ede9fe" },
                    { label: "Jami qarzdor", value: rows.length + " ta", icon: "👥", color: "#0369a1", bg: "#e0f2fe" },
                ].map((s, i) => (
                    <div key={i} style={{ ...S.statCard, borderLeft: `4px solid ${s.color}` }}
                        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 10px 24px rgba(0,0,0,0.1)"; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"; }}
                    >
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginBottom: 10 }}>{s.icon}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{s.label}</div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: s.color, letterSpacing: "-0.02em" }}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Controls */}
            <div style={S.controls}>
                <input
                    type="text"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    placeholder="🔍 Bemor nomi yoki telefon..."
                    style={S.searchInput}
                />
                <div style={{ display: "flex", gap: 8 }}>
                    {[
                        { key: "debt", label: "Qarz bo'yicha" },
                        { key: "charges", label: "Hisob bo'yicha" },
                        { key: "paid", label: "To'lov bo'yicha" },
                    ].map(s => (
                        <button key={s.key}
                            style={{ ...S.sortBtn, ...(sortBy === s.key ? S.sortBtnActive : {}) }}
                            onClick={() => setSortBy(s.key)}
                        >{s.label}</button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div style={S.tableWrap}>
                {loading ? (
                    <div style={{ padding: "64px", textAlign: "center" }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #fee2e2", borderTopColor: "#dc2626", animation: "spin .7s linear infinite", margin: "0 auto 14px" }} />
                        <div style={{ color: "#94a3b8", fontWeight: 600 }}>Yuklanmoqda...</div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: "64px", textAlign: "center" }}>
                        <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: "#374151" }}>
                            {rows.length === 0 ? "Qarzdor bemorlar yo'q!" : "Qidiruv natijasi topilmadi"}
                        </div>
                        <div style={{ fontSize: 14, color: "#94a3b8", marginTop: 4 }}>
                            {rows.length === 0 ? "Barcha to'lovlar amalga oshirilgan" : "Boshqa so'z bilan qidiring"}
                        </div>
                    </div>
                ) : (
                    <>
                        <div style={{ padding: "10px 20px", background: "#fafbff", borderBottom: "1px solid #f1f5f9", fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                            {filtered.length} ta qarzdor bemor topildi
                        </div>
                        <div style={{ overflowX: "auto" }}>
                            <table style={S.table}>
                                <thead>
                                    <tr>
                                        {["#", "Bemor", "Jami hisob", "To'langan", "Qoldiq %", "Qarz", "Amal"].map(h => (
                                            <th key={h} style={S.th}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {paged.map((item, i) => (
                                        <DebtRow key={item.patientId || i} item={item} idx={(page - 1) * PER_PAGE + i} />
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, padding: "16px", borderTop: "1px solid #f1f5f9" }}>
                                <button style={S.pageBtn} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹</button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => Math.abs(p - page) < 3).map(p => (
                                    <button key={p} style={{ ...S.pageBtn, ...(p === page ? { background: "#0f172a", color: "white", borderColor: "#0f172a" } : {}) }} onClick={() => setPage(p)}>{p}</button>
                                ))}
                                <button style={S.pageBtn} disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>›</button>
                            </div>
                        )}
                    </>
                )}
            </div>

            <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
        </div>
    );
}

const S = {
    page: { padding: "28px 32px", maxWidth: 1280, margin: "0 auto", fontFamily: "'Inter',sans-serif" },
    hdr: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 },
    title: { fontSize: 24, fontWeight: 900, color: "#0f172a", margin: "0 0 2px", letterSpacing: "-0.02em" },
    sub: { fontSize: 14, color: "#64748b", margin: 0 },
    refreshBtn: { display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "white", color: "#475569", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" },
    statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginBottom: 20 },
    statCard: { background: "white", borderRadius: 14, padding: "16px 18px", border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", transition: "transform .15s,box-shadow .15s", cursor: "default" },
    controls: { display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" },
    searchInput: { flex: 1, minWidth: 200, padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 14, outline: "none", fontFamily: "inherit", color: "#1e293b" },
    sortBtn: { padding: "8px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "white", color: "#475569", cursor: "pointer", fontWeight: 600, fontSize: 12, fontFamily: "inherit", transition: "all .12s" },
    sortBtnActive: { background: "#0f172a", color: "white", borderColor: "#0f172a" },
    tableWrap: { background: "white", borderRadius: 16, border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", overflow: "hidden" },
    table: { width: "100%", borderCollapse: "collapse" },
    th: { padding: "10px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", background: "#fafbff", borderBottom: "1.5px solid #f1f5f9", whiteSpace: "nowrap" },
    td: { padding: "12px 16px", fontSize: 14, color: "#374151", verticalAlign: "middle" },
    pageBtn: { width: 34, height: 34, borderRadius: 8, border: "1.5px solid #e2e8f0", background: "white", cursor: "pointer", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit", transition: "all .1s" },
};
