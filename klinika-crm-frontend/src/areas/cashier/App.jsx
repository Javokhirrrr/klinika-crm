
import { useEffect, useMemo, useState } from "react";
import http from "../../lib/http.js";
import { useAuth } from "../../context/AuthContext";

/**
 * Cashier App — kassir uchun sodda panel
 * - Bugungi yakunlangan (done) qabulni ko'rsatadi
 * - To'lov qabul qilish: amount + method
 * - Invoice PDF ni ochish
 */
export default function CashierApp() {
  const { user } = useAuth();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [services, setServices] = useState([]);
  const [svcMap, setSvcMap] = useState(new Map());

  const [modal, setModal] = useState({ open: false, appt: null, amount: "", method: "cash", note: "" });
  const allowed = ["admin", "accountant", "reception"];

  useEffect(() => {
    (async () => {
      try {
        const s = await http.get("/services", { page: 1, limit: 1000 }).catch(() => ({ items: [] }));
        setServices(s.items || []);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    const m = new Map();
    for (const s of services) m.set(String(s._id || s.id), s);
    setSvcMap(m);
  }, [services]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await http.get("/appointments", { page: 1, limit: 500, status: "done", date });
      setItems(res.items || []);
    } catch (e) {
      setError(e?.response?.data?.message || "Ma'lumot yuklanmadi");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [date]);

  function calcAmount(appt) {
    const ids = appt?.serviceIds || [];
    let sum = 0;
    for (const id of ids) {
      const s = svcMap.get(String(id));
      if (s) sum += Number(s.price || 0);
    }
    return sum;
  }

  function openPay(a) {
    const amt = calcAmount(a);
    setModal({ open: true, appt: a, amount: String(amt || 0), method: "cash", note: "" });
  }

  async function takePayment() {
    const a = modal.appt;
    if (!a) return;
    const body = {
      patientId: a.patientId,
      appointmentId: a._id || a.id,
      amount: Number(modal.amount || 0),
      method: modal.method,
      note: modal.note || "",
    };
    try {
      await http.post("/payments", body);
      setModal({ open: false, appt: null, amount: "", method: "cash", note: "" });
      load();
      alert("To'lov qabul qilindi ✅");
    } catch (e) {
      alert(e?.response?.data?.message || "To'lovni qabul qilishda xatolik");
    }
  }

  function openInvoice(a) {
    // Token interceptor mavjud; lekin ko'rsatish uchun bevosita yangi oynada PDF:
    const id = a._id || a.id;
    const base = (import.meta.env.VITE_API_URL ?? "http://localhost:5000/api").replace(/\/+$/,"");
    window.open(`${base}/invoices/${id}/pdf`, "_blank", "noopener");
  }

  if (!allowed.includes(user?.role)) {
    return <div className="page"><div className="card">403 — ruxsat yo'q (Cashier)</div></div>;
  }

  return (
    <div className="page">
      <div className="hdr">
        <div>
          <h1>Kassa</h1>
          <p className="muted">Yakunlangan qabul bo'yicha to'lovlarni qabul qiling</p>
        </div>
        <div className="actions">
          <input type="date" className="input" value={date} onChange={(e)=>setDate(e.target.value)} />
          <button className="btn" onClick={load} disabled={loading}>{loading ? "Yuklanmoqda..." : "Yangilash"}</button>
        </div>
      </div>

      {error && <div className="alert">{error}</div>}

      <section className="card">
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Vaqt</th>
                <th>Bemor</th>
                <th>Doctor</th>
                <th>Xizmatlar</th>
                <th style={{textAlign:"right"}}>Summa</th>
                <th style={{width:220}}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((a, i) => {
                const sum = calcAmount(a);
                return (
                  <tr key={a._id || a.id}>
                    <td>{i+1}</td>
                    <td>{a.startAt ? new Date(a.startAt).toLocaleTimeString() : "—"}</td>
                    <td>{String(a.patientId).slice(-6)}</td>
                    <td>{String(a.doctorId).slice(-6)}</td>
                    <td>{(a.serviceIds || []).length}</td>
                    <td className="num">{sum.toLocaleString("uz-UZ")}</td>
                    <td style={{textAlign:"right"}}>
                      <button className="btn" onClick={()=>openInvoice(a)}>Invoice</button>{" "}
                      <button className="btn primary" onClick={()=>openPay(a)}>To'lov qabul qilish</button>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr><td colSpan={7} style={{textAlign:"center", padding:12}} className="muted">Ma'lumot yo'q</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modal.open && (
        <div className="modal">
          <div className="modalCard">
            <div className="modalHdr">
              <div className="title">To'lov qabul qilish</div>
              <button className="btn" onClick={()=>setModal({ open:false, appt:null, amount:"", method:"cash", note:"" })}>✕</button>
            </div>
            <div className="grid">
              <label className="lbl">Summasi</label>
              <input className="input" value={modal.amount} onChange={e=>setModal(s=>({...s, amount:e.target.value}))} />

              <label className="lbl">Usul</label>
              <select className="input" value={modal.method} onChange={e=>setModal(s=>({...s, method:e.target.value}))}>
                <option value="cash">Naqd</option>
                <option value="card">Karta</option>
                <option value="transfer">O'tkazma</option>
                <option value="online">Onlayn</option>
              </select>

              <label className="lbl">Izoh</label>
              <input className="input" placeholder="ixtiyoriy" value={modal.note} onChange={e=>setModal(s=>({...s, note:e.target.value}))} />
            </div>
            <div className="modalFtr">
              <button className="btn" onClick={()=>setModal({ open:false, appt:null, amount:"", method:"cash", note:"" })}>Bekor qilish</button>
              <button className="btn primary" onClick={takePayment}>Tasdiqlash</button>
            </div>
          </div>
        </div>
      )}

      <style>{css}</style>
    </div>
  );
}

const css = `
.page{padding:16px}
.hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.muted{color:#6b7280}
.btn{border:1px solid #e5e7eb;background:#fff;border-radius:10px;padding:9px 12px;cursor:pointer;font-weight:700}
.btn.primary{background:#2563eb;border-color:#2563eb;color:#fff}
.input{border:1px solid #e5e7eb;border-radius:10px;padding:9px 10px}
.card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:12px}
.tableWrap{overflow:auto}
.table{width:100%;border-collapse:collapse}
.table th,.table td{border-bottom:1px solid #f1f5f9;padding:10px;vertical-align:middle;text-align:left}
.table .num{text-align:right}
.alert{background:#fff7ed;border:1px solid #fed7aa;padding:10px;border-radius:10px;margin-bottom:10px}

.modal{position:fixed;inset:0;background:rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;z-index:50}
.modalCard{background:#fff;border-radius:14px;border:1px solid #e5e7eb;min-width:360px;max-width:520px;width:96%;padding:12px}
.modalHdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
.title{font-weight:900}
.grid{display:grid;grid-template-columns:120px 1fr;gap:8px;align-items:center;margin:12px 0}
.lbl{color:#6b7280}
.modalFtr{display:flex;gap:8px;justify-content:flex-end}
`;
