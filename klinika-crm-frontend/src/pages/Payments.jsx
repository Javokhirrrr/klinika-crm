import { useState, useEffect } from "react";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import http from "../lib/http";
import NewPaymentModal from "../pages/NewPaymentModal";

// ─── Icons ─────────────────────────────────────────────────────────────────────
const WalletIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={22} height={22}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
  </svg>
);
const TrendingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={22} height={22}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
  </svg>
);
const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={22} height={22}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
);
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={18} height={18}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" width={18} height={18}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);
const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={18} height={18}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);
const FilterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={17} height={17}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
  </svg>
);

// ─── Helpers ───────────────────────────────────────────────────────────────────
const todayLocal = () => format(new Date(), 'yyyy-MM-dd');
const monthAgo = () => {
  const d = new Date(); d.setMonth(d.getMonth() - 1);
  return format(d, 'yyyy-MM-dd');
};
const fmt = (n) => new Intl.NumberFormat('uz-UZ').format(n || 0) + " so'm";
const fmtDate = (s) => {
  if (!s) return "—";
  try { return format(new Date(s), 'dd.MM.yy HH:mm', { locale: uz }); }
  catch { return "—"; }
};

// ─── Method & Status configs ───────────────────────────────────────────────────
const METHOD = {
  cash: { label: "Naqd", icon: "💵", color: "#059669", bg: "#d1fae5", border: "#a7f3d0" },
  card: { label: "Karta", icon: "💳", color: "#2563eb", bg: "#dbeafe", border: "#bfdbfe" },
  transfer: { label: "O'tkazma", icon: "🏦", color: "#7c3aed", bg: "#ede9fe", border: "#ddd6fe" },
  online: { label: "Onlayn", icon: "🌐", color: "#d97706", bg: "#fef3c7", border: "#fde68a" },
};
const STATUS = {
  completed: { label: "Tasdiqlangan", color: "#15803d", bg: "#dcfce7", dot: "#22c55e" },
  pending: { label: "Kutilmoqda", color: "#b45309", bg: "#ffedd5", dot: "#f59e0b" },
  failed: { label: "Bekor qilingan", color: "#b91c1c", bg: "#fee2e2", dot: "#ef4444" },
};

export default function Payments() {
  const [openNewModal, setOpenNewModal] = useState(false);
  const [dateRange, setDateRange] = useState({ from: monthAgo(), to: todayLocal() });
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState("all");
  const [status, setStatus] = useState("all");
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ todaySum: 0, monthSum: 0 });
  const [page, setPage] = useState(1);
  const limit = 15;
  const [totalDocs, setTotalDocs] = useState(0);

  useEffect(() => { loadPayments(); loadStats(); }, [page, dateRange, method, status]);

  useEffect(() => {
    const t = setTimeout(() => { page === 1 ? loadPayments() : setPage(1); }, 450);
    return () => clearTimeout(t);
  }, [search]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const params = { page, limit, from: dateRange.from, to: dateRange.to, sort: "-createdAt" };
      if (search) params.q = search;
      if (method !== 'all') params.method = method;
      if (status !== 'all') params.status = status;
      const res = await http.get("/payments", params);
      setPayments(res.items || []);
      setTotalDocs(res.total || 0);
    } catch { } finally { setLoading(false); }
  };

  const loadStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const [tRes, mRes] = await Promise.all([
        http.get("/payments/reports/revenue", { from: today, to: today }),
        http.get("/payments/reports/revenue", { from: monthStart, to: today }),
      ]);
      setStats({
        todaySum: tRes?.rows?.reduce((a, r) => a + (r.total || 0), 0) || 0,
        monthSum: mRes?.rows?.reduce((a, r) => a + (r.total || 0), 0) || 0,
      });
    } catch { }
  };

  const totalPages = Math.ceil(totalDocs / limit);
  const allMethods = [
    { val: "all", label: "Barchasi" },
    { val: "cash", label: "💵 Naqd" },
    { val: "card", label: "💳 Karta" },
    { val: "transfer", label: "🏦 O'tkazma" },
    { val: "online", label: "🌐 Onlayn" },
  ];
  const allStatuses = [
    { val: "all", label: "Barchasi" },
    { val: "completed", label: "✅ Tasdiqlangan" },
    { val: "pending", label: "⏳ Kutilmoqda" },
    { val: "failed", label: "❌ Bekor" },
  ];

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1400, margin: "0 auto", fontFamily: "'Inter', sans-serif", color: "#111827" }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 4px", letterSpacing: "-0.03em", color: "#0f172a" }}>
            💰 Moliya
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>To'lovlar monitoringi va hisob-kitoblar</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => alert("Export funksiyasi tez orada!")}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "white", cursor: "pointer", fontWeight: 600, fontSize: 13, color: "#475569", transition: "all .15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#cbd5e1"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
          >
            <DownloadIcon /> Excel
          </button>
          <button
            onClick={() => setOpenNewModal(true)}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)", color: "white", cursor: "pointer", fontWeight: 700, fontSize: 14, boxShadow: "0 4px 14px rgba(37,99,235,0.35)", transition: "all .15s" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(37,99,235,0.4)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(37,99,235,0.35)"; }}
          >
            <PlusIcon /> Yangi to'lov
          </button>
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginBottom: 24 }}>
        {[
          { icon: "☀️", label: "Bugungi tushum", value: fmt(stats.todaySum), grad: "linear-gradient(135deg,#667eea,#764ba2)", light: "#f0f0ff" },
          { icon: "📈", label: "Bu oylik tushum", value: fmt(stats.monthSum), grad: "linear-gradient(135deg,#f093fb,#f5576c)", light: "#fff0f6" },
          { icon: "📋", label: "Filtrdagi operatsiyalar", value: `${totalDocs} ta`, grad: "linear-gradient(135deg,#4facfe,#00f2fe)", light: "#f0faff" },
        ].map((s, i) => (
          <div key={i} style={{ background: "white", borderRadius: 16, padding: "20px 22px", display: "flex", alignItems: "center", gap: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9", transition: "transform .15s, box-shadow .15s" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.09)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)"; }}
          >
            <div style={{ width: 46, height: 46, borderRadius: 12, background: s.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div style={{ background: "white", borderRadius: 14, padding: "16px 20px", marginBottom: 20, border: "1px solid #f1f5f9", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        {/* Search */}
        <div style={{ display: "flex", alignItems: "center", gap: 9, background: "#f8fafc", borderRadius: 9, padding: "8px 13px", border: "1.5px solid #e2e8f0", flex: "1 1 260px", maxWidth: 340, color: "#94a3b8" }}>
          <SearchIcon />
          <input
            type="text"
            placeholder="Bemor ismi yoki telefon..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ border: "none", background: "transparent", outline: "none", fontSize: 14, width: "100%", color: "#1e293b" }}
          />
        </div>

        {/* Date range */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", borderRadius: 9, padding: "7px 12px", border: "1.5px solid #e2e8f0" }}>
          <CalendarIcon />
          <input type="date" value={dateRange.from} onChange={e => setDateRange({ ...dateRange, from: e.target.value })} style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, color: "#374151", fontFamily: "inherit" }} />
          <span style={{ color: "#cbd5e1", fontWeight: 600 }}>—</span>
          <input type="date" value={dateRange.to} onChange={e => setDateRange({ ...dateRange, to: e.target.value })} style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, color: "#374151", fontFamily: "inherit" }} />
        </div>

        {/* Method pills */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {allMethods.map(m => (
            <button key={m.val} onClick={() => setMethod(m.val)}
              style={{ padding: "6px 13px", borderRadius: 20, border: `1.5px solid ${method === m.val ? "#2563eb" : "#e2e8f0"}`, background: method === m.val ? "#2563eb" : "white", color: method === m.val ? "white" : "#475569", fontWeight: 600, fontSize: 12, cursor: "pointer", transition: "all .12s" }}
            >{m.label}</button>
          ))}
        </div>

        {/* Status pills */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {allStatuses.map(s => (
            <button key={s.val} onClick={() => setStatus(s.val)}
              style={{ padding: "6px 13px", borderRadius: 20, border: `1.5px solid ${status === s.val ? "#0891b2" : "#e2e8f0"}`, background: status === s.val ? "#0891b2" : "white", color: status === s.val ? "white" : "#475569", fontWeight: 600, fontSize: 12, cursor: "pointer", transition: "all .12s" }}
            >{s.label}</button>
          ))}
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div style={{ background: "white", borderRadius: 16, border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", overflow: "hidden" }}>
        {/* Table header info */}
        <div style={{ padding: "14px 22px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>
            Jami: <span style={{ color: "#0f172a" }}>{totalDocs}</span> ta to'lov
          </span>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>
            {dateRange.from} → {dateRange.to}
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 700 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["#", "Sana & Vaqt", "Bemor", "Summa", "To'lov turi", "Holat", "Izoh"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "12px 18px", fontWeight: 700, color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ padding: 48, textAlign: "center" }}>
                  <LoadingSpinner />
                </td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan="7" style={{ padding: "56px 24px", textAlign: "center" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>💸</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#64748b" }}>To'lovlar topilmadi</div>
                  <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>Boshqa sana yoki filter bilan qidiring</div>
                </td></tr>
              ) : payments.map((p, idx) => {
                const pInfo = p.patientId || {};
                const pName = pInfo.firstName ? `${pInfo.firstName} ${pInfo.lastName || ""}`.trim() : "—";
                const pPhone = pInfo.phone || "";
                const m = METHOD[p.method] || { label: p.method, icon: "💰", color: "#64748b", bg: "#f1f5f9" };
                const st = STATUS[p.status] || { label: p.status, color: "#64748b", bg: "#f1f5f9", dot: "#94a3b8" };

                return (
                  <tr key={p._id}
                    style={{ borderBottom: "1px solid #f8fafc", transition: "background .1s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#fafbff"}
                    onMouseLeave={e => e.currentTarget.style.background = ""}
                  >
                    {/* # */}
                    <td style={{ padding: "14px 18px", color: "#94a3b8", fontWeight: 600, fontSize: 12 }}>
                      {(page - 1) * limit + idx + 1}
                    </td>
                    {/* Date */}
                    <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                      <span style={{ fontWeight: 600, color: "#374151" }}>{fmtDate(p.createdAt)}</span>
                    </td>
                    {/* Patient */}
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#667eea,#764ba2)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                          {pName !== "—" ? pName[0].toUpperCase() : "?"}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 13 }}>{pName}</div>
                          {pPhone && <div style={{ fontSize: 11, color: "#94a3b8" }}>{pPhone}</div>}
                        </div>
                      </div>
                    </td>
                    {/* Amount */}
                    <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#059669", letterSpacing: "-0.01em" }}>
                        {new Intl.NumberFormat('uz-UZ').format(p.amount || 0)} so'm
                      </span>
                    </td>
                    {/* Method */}
                    <td style={{ padding: "14px 18px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, background: m.bg, color: m.color, fontWeight: 700, fontSize: 12, border: `1px solid ${m.border || m.bg}` }}>
                        {m.icon} {m.label}
                      </span>
                    </td>
                    {/* Status */}
                    <td style={{ padding: "14px 18px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 12px", borderRadius: 8, background: st.bg, color: st.color, fontWeight: 600, fontSize: 12 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: st.dot, display: "inline-block" }} />
                        {st.label}
                      </span>
                    </td>
                    {/* Note */}
                    <td style={{ padding: "14px 18px" }}>
                      <span style={{ fontSize: 12, color: "#94a3b8", maxWidth: 160, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={p.note}>
                        {p.note || "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: "14px 22px", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: "#94a3b8" }}>
              {(page - 1) * limit + 1}–{Math.min(page * limit, totalDocs)} / {totalDocs}
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <PageBtn disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>← Oldingi</PageBtn>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pg = page <= 3 ? i + 1 : page + i - 2;
                if (pg < 1 || pg > totalPages) return null;
                return (
                  <PageBtn key={pg} active={pg === page} onClick={() => setPage(pg)}>{pg}</PageBtn>
                );
              })}
              <PageBtn disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Keyingi →</PageBtn>
            </div>
          </div>
        )}
      </div>

      <NewPaymentModal
        open={openNewModal}
        onClose={() => setOpenNewModal(false)}
        onSaved={() => { loadPayments(); loadStats(); setOpenNewModal(false); }}
      />
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────
function PageBtn({ children, onClick, disabled, active }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ padding: "6px 12px", borderRadius: 8, border: `1.5px solid ${active ? "#2563eb" : "#e2e8f0"}`, background: active ? "#2563eb" : "white", color: active ? "white" : disabled ? "#cbd5e1" : "#374151", fontWeight: 600, fontSize: 13, cursor: disabled ? "not-allowed" : "pointer", transition: "all .12s" }}
    >{children}</button>
  );
}

function LoadingSpinner() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, color: "#94a3b8" }}>
      <div style={{ width: 36, height: 36, border: "3px solid #e2e8f0", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <span style={{ fontSize: 14, fontWeight: 600 }}>Yuklanmoqda...</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
