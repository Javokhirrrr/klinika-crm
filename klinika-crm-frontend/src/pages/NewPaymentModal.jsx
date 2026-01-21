import { useState, useEffect, useRef } from "react";
import http from "../lib/http";

export default function NewPaymentModal({ open, onClose, onSaved }) {
  // Form State
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("completed");
  const [loading, setLoading] = useState(false);

  // Patient Search State
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState([]);      // Displayed list
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Cache for default (recent) patients
  const [recentPatients, setRecentPatients] = useState([]);

  const searchTimeout = useRef(null);
  const dropdownRef = useRef(null);

  // Reset & Load Recent
  useEffect(() => {
    if (open) {
      setAmount("");
      setMethod("cash");
      setNote("");
      setStatus("completed");
      setQuery("");
      setPatients([]);
      setSelectedPatient(null);
      setLoading(false);

      // Load recent patients immediately
      loadRecent();
    }
  }, [open]);

  const loadRecent = async () => {
    try {
      setSearching(true);
      const res = await http.get("/patients", { limit: 20, sort: "-createdAt" });
      const items = res.items || [];
      setRecentPatients(items);
      setPatients(items); // Show recent by default
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search Logic
  useEffect(() => {
    // If empty query, show recent patients
    if (!query.trim()) {
      setPatients(recentPatients);
      return;
    }

    // If query matches selected, don't search
    if (selectedPatient) {
      const fullName = `${selectedPatient.firstName} ${selectedPatient.lastName}`.trim();
      if (query === fullName) return;
    }

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await http.get("/patients", { q: query, limit: 10 });
        setPatients(res.items || []);
        setShowDropdown(true);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setSearching(false);
      }
    }, 400);
  }, [query]);

  // Select Item
  const handleSelect = (p) => {
    setSelectedPatient(p);
    setQuery(`${p.firstName} ${p.lastName}`.trim());
    setShowDropdown(false);
  };

  // Submit
  const savePayment = async () => {
    if (!selectedPatient?._id) {
      alert("Iltimos, bemorni tanlang (qidiruv orqali)!");
      return;
    }
    if (!amount || amount <= 0) {
      alert("To'g'ri summa kiriting!");
      return;
    }

    setLoading(true);
    try {
      const res = await http.post("/payments", {
        patientId: selectedPatient._id,
        amount: Number(amount),
        method,
        note,
        status,
      });
      onSaved(res);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Xatolik: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal} className="animate-pop">
        <div style={styles.header}>
          <h2 style={styles.title}>Yangi to'lov</h2>
          <button onClick={onClose} style={styles.closeBtn}>&times;</button>
        </div>

        <div style={styles.body}>
          {/* Patient Search */}
          <div style={styles.group} ref={dropdownRef}>
            <label style={styles.label}>Bemor <span style={{ color: "red" }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedPatient(null); // yozishni boshlaganda tanlovni ochiramiz
                  setShowDropdown(true);
                }}
                placeholder="Ism yoki telefon raqami..."
                style={styles.input}
              />
              {searching && <div style={styles.spinner}></div>}

              {showDropdown && patients.length > 0 && (
                <ul style={styles.dropdown}>
                  {patients.map((p) => (
                    <li
                      key={p._id}
                      onClick={() => handleSelect(p)}
                      style={styles.dropdownItem}
                      onMouseEnter={(e) => e.target.style.background = "#f3f4f6"}
                      onMouseLeave={(e) => e.target.style.background = "white"}
                    >
                      <div style={{ fontWeight: 600 }}>{p.firstName} {p.lastName}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>{p.phone || "Telefon yo'q"}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {!selectedPatient && query && !searching && showDropdown && patients.length === 0 && (
              <small style={{ color: "#ef4444", marginTop: 4 }}>Bemor topilmadi</small>
            )}
          </div>

          {/* Amount */}
          <div style={styles.group}>
            <label style={styles.label}>Summa (so'm) <span style={{ color: "red" }}>*</span></label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              style={{ ...styles.input, fontSize: 18, fontWeight: 600 }}
            />
          </div>

          {/* Method */}
          <div style={styles.group}>
            <label style={styles.label}>To'lov turi</label>
            <div style={styles.methodsGrid}>
              {['cash', 'card', 'transfer', 'online'].map(m => (
                <div
                  key={m}
                  onClick={() => setMethod(m)}
                  style={{
                    ...styles.methodCard,
                    ...(method === m ? styles.methodActive(m) : {})
                  }}
                >
                  {getMethodIcon(m)}
                  <span>{getMethodLabel(m)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status */}
          <div style={styles.group}>
            <label style={styles.label}>Holati</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={styles.input}
            >
              <option value="completed">✅ Tasdiqlangan</option>
              <option value="pending">⏳ Kutilmoqda</option>
            </select>
          </div>

          {/* Note */}
          <div style={styles.group}>
            <label style={styles.label}>Izoh (ixtiyoriy)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={styles.textarea}
              placeholder="..."
            ></textarea>
          </div>
        </div>

        <div style={styles.footer}>
          <button style={styles.btnCancel} onClick={onClose}>Bekor qilish</button>
          <button
            style={styles.btnSave}
            onClick={savePayment}
            disabled={loading}
          >
            {loading ? "Saqlanmoqda..." : "Saqlash"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Helpers ---
function getMethodLabel(m) {
  switch (m) {
    case 'cash': return "Naqd";
    case 'card': return "Karta";
    case 'transfer': return "O'tkazma";
    case 'online': return "Onlayn";
    default: return m;
  }
}
function getMethodIcon(m) {
  switch (m) {
    case 'cash': return "💵";
    case 'card': return "💳";
    case 'transfer': return "🏦";
    case 'online': return "🌐";
    default: return "💰";
  }
}


const styles = {
  overlay: {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.5)",
    backdropFilter: "blur(5px)", // Glass effect
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modal: {
    background: "#fff",
    width: "480px",
    maxWidth: "95vw",
    borderRadius: "16px",
    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    animation: "popIn 0.2s ease-out"
  },
  header: {
    padding: "20px 24px",
    borderBottom: "1px solid #f3f4f6",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#f9fafb"
  },
  title: {
    margin: 0, fontSize: "18px", fontWeight: "700", color: "#111827"
  },
  closeBtn: {
    background: "transparent", border: "none", fontSize: "24px", lineHeight: 1, cursor: "pointer", color: "#9ca3af"
  },
  body: {
    padding: "24px",
    display: "flex", flexDirection: "column", gap: "20px"
  },
  group: {
    display: "flex", flexDirection: "column", gap: "6px"
  },
  label: {
    fontSize: "13px", fontWeight: "600", color: "#374151"
  },
  input: {
    width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", transition: "border-color 0.2s",
  },
  textarea: {
    width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", minHeight: "80px", resize: "vertical"
  },
  spinner: {
    position: "absolute", right: 10, top: 12, width: 16, height: 16, border: "2px solid #e5e7eb", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.6s linear infinite"
  },
  dropdown: {
    position: "absolute", top: "100%", left: 0, right: 0,
    background: "white", border: "1px solid #e5e7eb", borderRadius: "8px",
    marginTop: "4px", padding: 0, listStyle: "none",
    maxHeight: "200px", overflowY: "auto",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", zIndex: 10
  },
  dropdownItem: {
    padding: "10px 12px", borderBottom: "1px solid #f3f4f6", cursor: "pointer", display: "flex", flexDirection: "column", gap: 2
  },
  methodsGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px"
  },
  methodCard: {
    border: "1px solid #e5e7eb", borderRadius: "8px", padding: "10px 4px",
    display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
    cursor: "pointer", fontSize: "12px", fontWeight: "500", color: "#6b7280",
    transition: "all 0.2s"
  },
  methodActive: (m) => {
    let color = "#3b82f6"; // blue default
    if (m === 'cash') color = "#10b981";
    if (m === 'pending') color = "#f59e0b";
    return {
      borderColor: color,
      background: `${color}10`, // 10% opacity hex
      color: color,
      fontWeight: "700"
    };
  },
  footer: {
    padding: "16px 24px", background: "#f9fafb", borderTop: "1px solid #f3f4f6",
    display: "flex", justifyContent: "flex-end", gap: "12px"
  },
  btnCancel: {
    padding: "10px 20px", borderRadius: "8px", border: "1px solid #d1d5db", background: "white", cursor: "pointer", fontWeight: "500", color: "#374151"
  },
  btnSave: {
    padding: "10px 24px", borderRadius: "8px", border: "none", background: "#2563eb", cursor: "pointer", fontWeight: "600", color: "white", boxShadow: "0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px 0 rgba(0,0,0,0.06)"
  }
};
