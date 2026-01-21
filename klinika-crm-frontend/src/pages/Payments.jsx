import { useState, useEffect } from "react";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import http from "../lib/http";
import NewPaymentModal from "../pages/NewPaymentModal";

// --- Icons (Simple SVG) ---
const Icons = {
  Wallet: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 24, height: 24 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
    </svg>
  ),
  TrendingUp: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 24, height: 24 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
  ),
  Calendar: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 24, height: 24 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  ),
  Search: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  ),
  Download: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  ),
  Plus: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 20, height: 20 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
};

// --- Helpers ---
const todayLocal = () => format(new Date(), 'yyyy-MM-dd');
const monthAgo = () => {
  const d = new Date(); d.setMonth(d.getMonth() - 1);
  return format(d, 'yyyy-MM-dd');
};

const formatMoney = (amount) => {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency', currency: 'UZS', maximumFractionDigits: 0
  }).format(amount || 0);
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return format(new Date(dateString), 'dd MMMM, HH:mm', { locale: uz });
};

export default function Payments() {
  const [openNewModal, setOpenNewModal] = useState(false);

  // Filters
  const [dateRange, setDateRange] = useState({ from: monthAgo(), to: todayLocal() });
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState("all");
  const [status, setStatus] = useState("all");

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Dashboard Stats
  const [stats, setStats] = useState({
    todayDocs: 0,
    todaySum: 0,
    monthSum: 0,
  });

  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalDocs, setTotalDocs] = useState(0);

  useEffect(() => {
    loadPayments();
    loadStats();
  }, [page, dateRange, method, status]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      if (page === 1) loadPayments(); else setPage(1);
    }, 500);
    return () => clearTimeout(t);
  }, [search]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const params = {
        page, limit,
        from: dateRange.from,
        to: dateRange.to,
        sort: "-createdAt"
      };
      if (search) params.q = search;
      if (method !== 'all') params.method = method;
      if (status !== 'all') params.status = status;

      const res = await http.get("/payments", params);
      setPayments(res.items || []);
      setTotalDocs(res.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    // 1. Bugungi tushum
    // 2. Oy boshidan tushum
    try {
      const today = new Date().toISOString().split('T')[0];
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

      // Parallel requests for simpler code (though aggregation is better, assume reportRevenue exists)
      const [todayRes, monthRes] = await Promise.all([
        http.get("/payments/reports/revenue", { from: today, to: today }),
        http.get("/payments/reports/revenue", { from: monthStart, to: today, groupBy: 'month' })
      ]);

      // Calculate sums
      // todayRes.rows might be empty or array of { total: X }
      const todaySum = todayRes?.rows?.reduce((acc, r) => acc + (r.total || 0), 0) || 0;
      const monthSum = monthRes?.rows?.reduce((acc, r) => acc + (r.total || 0), 0) || 0;

      setStats({
        todaySum,
        monthSum,
      });

    } catch (e) {
      // Endpoint bo'lmasa yoki xato bo'lsa
      console.log("Stats error:", e);
    }
  };

  const exportToExcel = async () => {
    try {
      await http.get("/payments/export", {
        from: dateRange.from, to: dateRange.to, format: "excel"
      });
      alert("Excelga yuklash funksiyasi hali backendda yoqilgan bo'lishi kerak.");
    } catch (e) {
      alert("Export funksiyasi serverda topilmadi.");
    }
  };

  const totalPages = Math.ceil(totalDocs / limit);

  return (
    <div style={styles.container}>
      {/* Top Header */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Moliya</h1>
          <p style={styles.pageSubtitle}>To'lovlar monitoringi va hisob-kitoblar</p>
        </div>
        <div style={styles.actions}>
          <button style={styles.btnSecondary} onClick={exportToExcel}>
            <Icons.Download />
            <span style={{ marginLeft: 8 }}>Excel</span>
          </button>
          <button style={styles.btnPrimary} onClick={() => setOpenNewModal(true)}>
            <Icons.Plus />
            <span style={{ marginLeft: 8 }}>Kirim qilish</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIconBox(styles.colors.blue)}><Icons.Wallet /></div>
          <div>
            <div style={styles.statLabel}>Bugungi tushum</div>
            <div style={styles.statValue}>{formatMoney(stats.todaySum)}</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIconBox(styles.colors.green)}><Icons.TrendingUp /></div>
          <div>
            <div style={styles.statLabel}>Bu oy (Jami)</div>
            <div style={styles.statValue}>{formatMoney(stats.monthSum)}</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIconBox(styles.colors.purple)}><Icons.Calendar /></div>
          <div>
            <div style={styles.statLabel}>Tanlangan davr</div>
            <div style={styles.statValue}>{payments.length} ta operatsiya</div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div style={styles.filterSection}>
        <div style={styles.searchBox}>
          <Icons.Search />
          <input
            type="text"
            placeholder="Bemor ismi yoki telefon..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filtersRow}>
          <div style={styles.dateControl}>
            <input type="date" value={dateRange.from} onChange={e => setDateRange({ ...dateRange, from: e.target.value })} style={styles.dateInput} />
            <span style={{ color: '#9ca3af' }}>-</span>
            <input type="date" value={dateRange.to} onChange={e => setDateRange({ ...dateRange, to: e.target.value })} style={styles.dateInput} />
          </div>

          <select value={method} onChange={e => setMethod(e.target.value)} style={styles.selectInput}>
            <option value="all">Barcha turlar</option>
            <option value="cash">Naqd</option>
            <option value="card">Karta</option>
            <option value="transfer">O'tkazma</option>
            <option value="online">Onlayn</option>
          </select>

          <select value={status} onChange={e => setStatus(e.target.value)} style={styles.selectInput}>
            <option value="all">Barcha holatlar</option>
            <option value="completed">Tasdiqlangan</option>
            <option value="pending">Kutilmoqda</option>
            <option value="failed">Bekor</option>
          </select>
        </div>
      </div>

      {/* Main Table Card */}
      <div style={styles.tableCard}>
        <div style={styles.tableResponsive}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Sana & Vaqt</th>
                <th style={styles.th}>Bemor</th>
                <th style={styles.th}>To'lov Summasi</th>
                <th style={styles.th}>To'lov turi</th>
                <th style={styles.th}>Holat</th>
                <th style={styles.th}>Izoh</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={styles.loadingTd}>Yuklanmoqda...</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan="6" style={styles.emptyTd}>Ma'lumot topilmadi</td></tr>
              ) : (
                payments.map((p) => {
                  const pInfo = p.patientId || {};
                  const pName = pInfo.firstName ? `${pInfo.firstName} ${pInfo.lastName}` : "—";
                  const pPhone = pInfo.phone || "";

                  return (
                    <tr key={p._id} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={styles.dateText}>{formatDate(p.createdAt)}</div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.patientName}>{pName}</div>
                        <div style={styles.patientPhone}>{pPhone}</div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.amountText}>{formatMoney(p.amount)}</div>
                      </td>
                      <td style={styles.td}>
                        <MethodBadge method={p.method} />
                      </td>
                      <td style={styles.td}>
                        <StatusBadge status={p.status} />
                      </td>
                      <td style={styles.td}>
                        <div style={styles.noteText} title={p.note}>{p.note || "-"}</div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={styles.pagination}>
          <button
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            style={{ ...styles.pageBtn, opacity: page === 1 ? 0.5 : 1 }}
          >
            &lt; Oldingi
          </button>
          <span style={styles.pageInfo}>Sahifa {page} / {totalPages || 1}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            style={{ ...styles.pageBtn, opacity: page >= totalPages ? 0.5 : 1 }}
          >
            Keyingi &gt;
          </button>
        </div>
      </div>

      <NewPaymentModal
        open={openNewModal}
        onClose={() => setOpenNewModal(false)}
        onSaved={() => {
          loadPayments();
          loadStats();
          setOpenNewModal(false);
        }}
      />
    </div>
  );
}

// --- Components ---
const MethodBadge = ({ method }) => {
  const map = {
    cash: { l: "Naqd", c: "#059669", bg: "#d1fae5" },
    card: { l: "Karta", c: "#2563eb", bg: "#dbeafe" },
    transfer: { l: "O'tkazma", c: "#7c3aed", bg: "#ede9fe" },
    online: { l: "Onlayn", c: "#d97706", bg: "#fef3c7" },
  };
  const def = { l: method, c: "#4b5563", bg: "#f3f4f6" };
  const { l, c, bg } = map[method] || def;
  return (
    <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", color: c, background: bg, textTransform: 'capitalize' }}>
      {l}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const map = {
    completed: { l: "Muvaffaqiyatli", c: "#15803d", bg: "#dcfce7" },
    pending: { l: "Kutilmoqda", c: "#b45309", bg: "#ffedd5" },
    failed: { l: "Bekor qilingan", c: "#b91c1c", bg: "#fee2e2" },
  };
  const def = { l: status, c: "#4b5563", bg: "#f3f4f6" };
  const { l, c, bg } = map[status] || def;
  return (
    <span style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "500", color: c, background: bg }}>
      {l}
    </span>
  );
};

// --- Styles ---
const styles = {
  colors: {
    blue: "#3b82f6",
    green: "#10b981",
    purple: "#8b5cf6",
  },
  container: {
    padding: "32px",
    maxWidth: "1400px",
    margin: "0 auto",
    fontFamily: "'Inter', sans-serif",
    color: "#111827",
  },
  pageHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px",
    flexWrap: "wrap", gap: "20px"
  },
  pageTitle: {
    fontSize: "28px", fontWeight: "700", margin: "0 0 8px 0", letterSpacing: "-0.02em"
  },
  pageSubtitle: {
    fontSize: "15px", color: "#6b7280", margin: 0
  },
  actions: {
    display: "flex", gap: "12px"
  },
  btnPrimary: {
    display: "flex", alignItems: "center", background: "#2563eb", color: "white", padding: "10px 20px",
    borderRadius: "10px", border: "none", cursor: "pointer", fontWeight: "600",
    fontSize: "14px", boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.2)",
    transition: "all 0.2s"
  },
  btnSecondary: {
    display: "flex", alignItems: "center", background: "white", color: "#374151", padding: "10px 16px",
    borderRadius: "10px", border: "1px solid #e5e7eb", cursor: "pointer", fontWeight: "500",
    fontSize: "14px",
    transition: "all 0.2s"
  },

  // Stats
  statsGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px", marginBottom: "32px"
  },
  statCard: {
    background: "white", padding: "24px", borderRadius: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)",
    display: "flex", alignItems: "center", gap: "16px",
    border: "1px solid #f3f4f6"
  },
  statIconBox: (color) => ({
    width: "48px", height: "48px", borderRadius: "12px", background: `${color}15`, color: color,
    display: "flex", alignItems: "center", justifyContent: "center"
  }),
  statLabel: {
    fontSize: "13px", fontWeight: "500", color: "#6b7280", marginBottom: "4px"
  },
  statValue: {
    fontSize: "20px", fontWeight: "700", color: "#111827", letterSpacing: "-0.02em"
  },

  // Filter Section
  filterSection: {
    background: "white", padding: "20px", borderRadius: "16px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    marginBottom: "24px",
    display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "center", justifyContent: "space-between",
    border: "1px solid #f3f4f6"
  },
  searchBox: {
    display: "flex", alignItems: "center", gap: "10px", background: "#f9fafb", padding: "10px 14px",
    borderRadius: "10px", border: "1px solid #e5e7eb", flex: "1 1 300px", maxWidth: "400px",
    color: "#6b7280"
  },
  searchInput: {
    border: "none", background: "transparent", outline: "none", fontSize: "14px", width: "100%", color: "#111827"
  },
  filtersRow: {
    display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center"
  },
  dateControl: {
    display: "flex", alignItems: "center", gap: "8px", background: "white", padding: "8px 12px",
    borderRadius: "10px", border: "1px solid #e5e7eb",
    fontSize: "13px"
  },
  dateInput: {
    border: "none", outline: "none", fontSize: "13px", fontFamily: "inherit", color: "#374151"
  },
  selectInput: {
    padding: "8px 12px", borderRadius: "10px", border: "1px solid #e5e7eb", outline: "none",
    background: "white", fontSize: "13px", height: "38px", cursor: "pointer"
  },

  // Table
  tableCard: {
    background: "white", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
    overflow: "hidden", border: "1px solid #f3f4f6"
  },
  tableResponsive: {
    overflowX: "auto"
  },
  table: {
    width: "100%", borderCollapse: "collapse", fontSize: "14px", minWidth: "800px"
  },
  th: {
    textAlign: "left", padding: "16px 24px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb",
    fontWeight: "600", color: "#6b7280", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em"
  },
  tr: {
    borderBottom: "1px solid #f9fafb", transition: "background 0.1s"
  },
  td: {
    padding: "16px 24px", verticalAlign: "middle"
  },
  loadingTd: {
    padding: "40px", textAlign: "center", color: "#6b7280"
  },
  emptyTd: {
    padding: "40px", textAlign: "center", color: "#6b7280", fontStyle: "italic"
  },

  // Cell Contents
  dateText: {
    fontSize: "14px", fontWeight: "500", color: "#111827"
  },
  patientName: {
    fontSize: "14px", fontWeight: "600", color: "#1f2937"
  },
  patientPhone: {
    fontSize: "12px", color: "#6b7280", marginTop: "2px"
  },
  amountText: {
    fontSize: "14px", fontWeight: "700", color: "#111827", fontFamily: "monospace"
  },
  noteText: {
    fontSize: "13px", color: "#6b7280", maxWidth: "200px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
  },

  // Pagination
  pagination: {
    padding: "16px 24px", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "12px",
    background: "white", borderTop: "1px solid #e5e7eb"
  },
  pageInfo: {
    fontSize: "13px", color: "#6b7280", fontWeight: "500"
  },
  pageBtn: {
    padding: "6px 12px", borderRadius: "8px", border: "1px solid #e5e7eb", background: "white",
    cursor: "pointer", fontSize: "13px", fontWeight: "500", color: "#374151",
    transition: "background 0.1s"
  }
};
