import { useState, useEffect, useRef } from "react";
import http from "../lib/http";

/* ─── Icons ─────────────────────────────────────────────────────── */
const XIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
  </svg>
);

/* ─── Method config ──────────────────────────────────────────────── */
const METHODS = [
  { val: "cash", label: "Naqd", icon: "💵", color: "#059669", activeBg: "#d1fae5", activeBorder: "#34d399" },
  { val: "card", label: "Karta", icon: "💳", color: "#2563eb", activeBg: "#dbeafe", activeBorder: "#60a5fa" },
  { val: "transfer", label: "O'tkazma", icon: "🏦", color: "#7c3aed", activeBg: "#ede9fe", activeBorder: "#a78bfa" },
];

/* ─── Helpers ────────────────────────────────────────────────────── */
const fmt = (n) => new Intl.NumberFormat('uz-UZ').format(n || 0);

export default function NewPaymentModal({ open, onClose, onSaved }) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [note, setNote] = useState("");
  const [discount, setDiscount] = useState({ enabled: false, pct: 0, abs: 0 });
  const [debt, setDebt] = useState(false);
  const [given, setGiven] = useState(""); // Bemor qancha berdi
  const [loading, setLoading] = useState(false);

  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState([]);
  const [selected, setSelected] = useState(null);
  const [searching, setSearching] = useState(false);
  const [showDrop, setShowDrop] = useState(false);
  const [recent, setRecent] = useState([]);

  const searchRef = useRef(null);
  const dropRef = useRef(null);
  const amtRef = useRef(null);

  /* ── Reset on open ─── */
  useEffect(() => {
    if (!open) return;
    setAmount(""); setMethod("cash"); setNote(""); setDiscount({ enabled: false, pct: 0, abs: 0 });
    setDebt(false); setGiven(""); setQuery(""); setSelected(null); setLoading(false);
    loadRecent();
  }, [open]);

  const loadRecent = async () => {
    try {
      setSearching(true);
      const res = await http.get("/patients", { limit: 20, sort: "-createdAt" });
      const items = res.items || [];
      setRecent(items); setPatients(items);
    } catch { } finally { setSearching(false); }
  };

  /* ── Close dropdown on outside click ─── */
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setShowDrop(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Patient search ─── */
  useEffect(() => {
    if (!query.trim()) { setPatients(recent); return; }
    if (selected && `${selected.firstName} ${selected.lastName}`.trim() === query) return;
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await http.get("/patients", { q: query, limit: 10 });
        setPatients(res.items || []);
        setShowDrop(true);
      } catch { } finally { setSearching(false); }
    }, 380);
    return () => clearTimeout(t);
  }, [query]);

  /* ── Calculations ─── */
  const totalAmt = Number(amount) || 0;
  const discAmt = discount.enabled
    ? (discount.pct > 0 ? Math.round(totalAmt * discount.pct / 100) : (discount.abs || 0))
    : 0;
  const toPay = Math.max(0, totalAmt - discAmt);
  const givenAmt = Number(given) || 0;
  const change = givenAmt > toPay ? givenAmt - toPay : 0;
  const remaining = givenAmt < toPay && givenAmt > 0 ? toPay - givenAmt : 0;

  /* ── Submit ─── */
  const handleSave = async () => {
    if (!selected?._id) { alert("Iltimos, bemorni tanlang!"); return; }
    if (!totalAmt || totalAmt <= 0) { alert("To'g'ri summa kiriting!"); return; }

    setLoading(true);
    try {
      const res = await http.post("/payments", {
        patientId: selected._id,
        amount: toPay,
        method,
        note,
        status: debt ? "pending" : "completed",
        discount: discAmt,
        given: givenAmt,
        change,
      });
      onSaved?.(res);
      onClose?.();
    } catch (err) {
      alert("Xatolik: " + (err?.message || "Noma'lum xato"));
    } finally { setLoading(false); }
  };

  /* ── Print receipt ─── */
  const handlePrint = async () => {
    await handleSave();
    // Print logic can be added here
  };

  if (!open) return null;

  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose?.()}>
      <div style={S.modal}>

        {/* Header */}
        <div style={S.header}>
          <div>
            <div style={S.headerTitle}>Yangi to'lov</div>
            <div style={S.headerSub}>To'lov ma'lumotlarini kiriting</div>
          </div>
          <button style={S.closeBtn} onClick={onClose} aria-label="Yopish">
            <XIcon />
          </button>
        </div>

        {/* Body */}
        <div style={S.body}>

          {/* ─ Bemor ─ */}
          <div style={S.group} ref={dropRef}>
            <label style={S.label}>
              <UserIcon /> Bemor <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <div style={{ position: "relative" }}>
              <div style={{ position: "relative" }}>
                <span style={S.inputIcon}><SearchIcon /></span>
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={e => { setQuery(e.target.value); setSelected(null); setShowDrop(true); }}
                  onFocus={() => setShowDrop(true)}
                  placeholder="Ism yoki telefon bilan qidiring..."
                  style={{ ...S.input, paddingLeft: 38, borderColor: selected ? "#22c55e" : undefined }}
                />
                {searching && <div style={S.spinner} />}
              </div>

              {showDrop && patients.length > 0 && (
                <ul style={S.dropdown}>
                  {patients.slice(0, 8).map(p => (
                    <li key={p._id} style={S.dropItem}
                      onClick={() => { setSelected(p); setQuery(`${p.firstName} ${p.lastName || ""}`.trim()); setShowDrop(false); }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f0f9ff"}
                      onMouseLeave={e => e.currentTarget.style.background = ""}
                    >
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#667eea,#764ba2)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                        {p.firstName?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{p.firstName} {p.lastName}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>{p.phone || "Telefon yo'q"}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {selected && (
              <div style={S.selectedBadge}>
                ✅ {selected.firstName} {selected.lastName} — {selected.phone || "tel yo'q"}
              </div>
            )}
          </div>

          {/* ─ Jami summa ─ */}
          <div style={S.group}>
            <label style={S.label}>Jami summa (so'm) <span style={{ color: "#ef4444" }}>*</span></label>
            <div style={{ position: "relative" }}>
              <input
                ref={amtRef}
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0"
                style={{ ...S.input, fontSize: 20, fontWeight: 800, textAlign: "right", paddingRight: 60, color: "#0f172a" }}
              />
              <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 13, fontWeight: 700, color: "#94a3b8" }}>so'm</span>
            </div>
            {totalAmt > 0 && (
              <div style={{ fontSize: 13, color: "#64748b", textAlign: "right" }}>
                {fmt(totalAmt)} so'm
              </div>
            )}
          </div>

          {/* ─ Chegirma ─ */}
          <div style={S.group}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <label style={{ ...S.checkboxRow, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={discount.enabled}
                  onChange={e => setDiscount(d => ({ ...d, enabled: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: "#2563eb", cursor: "pointer" }}
                />
                <span style={{ ...S.label, margin: 0 }}>Chegirma</span>
              </label>
              {discount.enabled && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
                    <input
                      type="number"
                      value={discount.pct || ""}
                      onChange={e => setDiscount(d => ({ ...d, pct: Number(e.target.value), abs: 0 }))}
                      placeholder="10"
                      min={0} max={100}
                      style={{ ...S.input, width: 70, textAlign: "center", padding: "8px" }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#64748b" }}>%</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
                    <input
                      type="number"
                      value={discount.abs || ""}
                      onChange={e => setDiscount(d => ({ ...d, abs: Number(e.target.value), pct: 0 }))}
                      placeholder="0"
                      min={0}
                      style={{ ...S.input, width: "100%", textAlign: "right", padding: "8px" }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#64748b" }}>so'm</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ─ To'lanishi lozim ─ */}
          {totalAmt > 0 && (
            <div style={S.summaryBox}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Jami summa:</span>
                <span style={{ fontWeight: 700, color: "#374151" }}>{fmt(totalAmt)} so'm</span>
              </div>
              {discAmt > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: "#dc2626", fontWeight: 500 }}>Chegirma:</span>
                  <span style={{ fontWeight: 700, color: "#dc2626" }}>−{fmt(discAmt)} so'm</span>
                </div>
              )}
              <div style={{ height: 1, background: "#e2e8f0", margin: "8px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#374151" }}>To'lanishi lozim:</span>
                <span style={{ fontSize: 20, fontWeight: 900, color: "#16a34a" }}>{fmt(toPay)} so'm</span>
              </div>
            </div>
          )}

          {/* ─ To'lov turi ─ */}
          <div style={S.group}>
            <label style={S.label}>To'lov usuli</label>
            <div style={{ display: "flex", gap: 8 }}>
              {METHODS.map(m => {
                const isActive = method === m.val;
                return (
                  <button key={m.val} onClick={() => setMethod(m.val)}
                    style={{
                      flex: 1, padding: "10px 8px", borderRadius: 10,
                      border: `2px solid ${isActive ? m.activeBorder : "#e2e8f0"}`,
                      background: isActive ? m.activeBg : "white",
                      color: isActive ? m.color : "#64748b",
                      fontWeight: isActive ? 800 : 600, fontSize: 13,
                      cursor: "pointer", transition: "all .12s",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{m.icon}</span>
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ─ Bemor qancha berdi ─ */}
          {method === "cash" && toPay > 0 && (
            <div style={S.group}>
              <label style={S.label}>Bemor qancha berdi?</label>
              <div style={{ position: "relative" }}>
                <input
                  type="number"
                  value={given}
                  onChange={e => setGiven(e.target.value)}
                  placeholder={fmt(toPay)}
                  style={{ ...S.input, textAlign: "right", paddingRight: 60 }}
                />
                <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>so'm</span>
              </div>
              {/* Quick fill buttons */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[toPay, 50000, 100000, 200000, 500000].filter((v, i, arr) => arr.indexOf(v) === i).slice(0, 5).map(v => (
                  <button key={v} onClick={() => setGiven(String(v))}
                    style={{ padding: "4px 10px", borderRadius: 20, border: "1.5px solid #e2e8f0", background: given == v ? "#dbeafe" : "white", color: given == v ? "#2563eb" : "#64748b", fontWeight: 600, fontSize: 11, cursor: "pointer" }}
                  >{fmt(v)}</button>
                ))}
              </div>
              {/* Qaytim / Qarz */}
              {givenAmt > 0 && (
                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  {change > 0 && (
                    <div style={{ flex: 1, padding: "8px 12px", borderRadius: 8, background: "#d1fae5", color: "#065f46", fontWeight: 700, fontSize: 13, textAlign: "center" }}>
                      Qaytim: {fmt(change)} so'm
                    </div>
                  )}
                  {remaining > 0 && (
                    <div style={{ flex: 1, padding: "8px 12px", borderRadius: 8, background: "#fee2e2", color: "#991b1b", fontWeight: 700, fontSize: 13, textAlign: "center" }}>
                      Qarz: {fmt(remaining)} so'm
                    </div>
                  )}
                  {givenAmt === toPay && (
                    <div style={{ flex: 1, padding: "8px 12px", borderRadius: 8, background: "#d1fae5", color: "#065f46", fontWeight: 700, fontSize: 13, textAlign: "center" }}>
                      ✅ To'liq to'langan
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ─ Izoh ─ */}
          <div style={S.group}>
            <label style={S.label}>Izoh (ixtiyoriy)</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Qo'shimcha ma'lumot..."
              rows={2}
              style={{ ...S.input, resize: "vertical", minHeight: 64, lineHeight: 1.5, fontFamily: "inherit" }}
            />
          </div>

          {/* ─ Qarzga qoldirish ─ */}
          <label style={{ ...S.checkboxRow, cursor: "pointer", padding: "10px 12px", borderRadius: 10, background: debt ? "#fff7ed" : "#f8fafc", border: `1.5px solid ${debt ? "#fed7aa" : "#e2e8f0"}`, transition: "all .12s" }}>
            <input
              type="checkbox"
              checked={debt}
              onChange={e => setDebt(e.target.checked)}
              style={{ width: 17, height: 17, accentColor: "#f59e0b", cursor: "pointer" }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: debt ? "#92400e" : "#475569" }}>💳 Qarzga qoldirish</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>To'lov holati "Kutilmoqda" bo'ladi</div>
            </div>
          </label>
        </div>

        {/* Footer */}
        <div style={S.footer}>
          <button style={S.btnCancel} onClick={onClose}
            onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
            onMouseLeave={e => e.currentTarget.style.background = "white"}
          >
            Bekor qilish
          </button>
          <button style={S.btnSecondary} onClick={handleSave} disabled={loading}>
            💾 Faqat saqlash
          </button>
          <button style={{ ...S.btnPrimary, opacity: loading ? 0.8 : 1 }} onClick={handlePrint} disabled={loading}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => e.currentTarget.style.transform = ""}
          >
            {loading ? "Saqlanmoqda..." : "🖨️ Saqlash va Chop etish"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────── */
const S = {
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(15,23,42,0.55)",
    backdropFilter: "blur(6px)",
    zIndex: 9999,
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "16px",
  },
  modal: {
    background: "white",
    width: "100%",
    maxWidth: 470,
    borderRadius: 20,
    boxShadow: "0 25px 60px rgba(0,0,0,0.18), 0 8px 20px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    maxHeight: "90vh",
    overflowY: "auto",
    animation: "modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1) both",
  },
  header: {
    padding: "20px 22px 18px",
    borderBottom: "1.5px solid #f1f5f9",
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    background: "linear-gradient(135deg, #f8fafc 0%, #fff 100%)",
    borderRadius: "20px 20px 0 0",
    flexShrink: 0,
  },
  headerTitle: { fontSize: 18, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" },
  headerSub: { fontSize: 13, color: "#94a3b8", marginTop: 2 },
  closeBtn: {
    background: "#f1f5f9", border: "none", borderRadius: 10,
    width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", color: "#64748b", flexShrink: 0,
    transition: "all .12s",
  },
  body: {
    padding: "20px 22px",
    display: "flex", flexDirection: "column", gap: 18,
    overflowY: "auto",
  },
  group: { display: "flex", flexDirection: "column", gap: 8 },
  label: {
    fontSize: 13, fontWeight: 700, color: "#374151",
    display: "flex", alignItems: "center", gap: 5,
  },
  input: {
    width: "100%", padding: "10px 13px",
    borderRadius: 10, border: "1.5px solid #e2e8f0",
    fontSize: 14, outline: "none", fontFamily: "'Inter', sans-serif",
    transition: "border-color .15s, box-shadow .15s",
    boxSizing: "border-box",
    color: "#1e293b",
  },
  spinner: {
    position: "absolute", right: 12, top: "50%", marginTop: -8,
    width: 16, height: 16,
    border: "2.5px solid #e2e8f0", borderTopColor: "#2563eb",
    borderRadius: "50%", animation: "spin 0.7s linear infinite",
  },
  dropdown: {
    position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
    background: "white", border: "1.5px solid #e2e8f0", borderRadius: 12,
    padding: "4px 0", listStyle: "none", margin: 0,
    maxHeight: 220, overflowY: "auto",
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 100,
  },
  dropItem: {
    padding: "9px 14px", cursor: "pointer",
    display: "flex", alignItems: "center", gap: 10,
    transition: "background .1s",
    borderBottom: "1px solid #f8fafc",
  },
  selectedBadge: {
    fontSize: 12, fontWeight: 600, color: "#15803d",
    background: "#dcfce7", borderRadius: 8, padding: "5px 11px",
    border: "1px solid #86efac",
  },
  summaryBox: {
    background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
    border: "1.5px solid #86efac",
    borderRadius: 12, padding: "14px 16px",
  },
  checkboxRow: {
    display: "flex", alignItems: "center", gap: 10,
  },
  footer: {
    padding: "16px 22px",
    borderTop: "1.5px solid #f1f5f9",
    display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap",
    background: "#f8fafc",
    borderRadius: "0 0 20px 20px",
    flexShrink: 0,
  },
  btnCancel: {
    padding: "10px 16px", borderRadius: 10, border: "1.5px solid #e2e8f0",
    background: "white", cursor: "pointer", fontWeight: 600, fontSize: 13, color: "#475569", transition: "all .12s",
  },
  btnSecondary: {
    padding: "10px 16px", borderRadius: 10, border: "1.5px solid #bfdbfe",
    background: "#eff6ff", cursor: "pointer", fontWeight: 700, fontSize: 13, color: "#1d4ed8",
  },
  btnPrimary: {
    padding: "10px 20px", borderRadius: 10, border: "none",
    background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
    cursor: "pointer", fontWeight: 800, fontSize: 13, color: "white",
    boxShadow: "0 4px 14px rgba(22,163,74,0.35)", transition: "all .15s",
  },
};
