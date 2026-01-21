
import { useEffect, useMemo, useState } from "react";
import http from "../../lib/http.js";
import { useAuth } from "../../context/AuthContext.jsx";

/**
 * Director App — direktor/owner uchun ko'rsatkichlar
 * - Daromad bo'yicha kunlik/oylik kesim
 * - Eng ko'p sotilgan xizmatlar
 */
export default function DirectorApp(){
  const { user } = useAuth();
  const allowed = ["admin","accountant","owner"];

  const today = new Date();
  const startDefault = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0,10);
  const [from, setFrom] = useState(startDefault);
  const [to, setTo]     = useState(today.toISOString().slice(0,10));

  const [rev, setRev] = useState({ rows: [] });
  const [top, setTop] = useState({ rows: [] });
  const [loading, setLoading] = useState(false);

  async function load(){
    setLoading(true);
    try{
      const r1 = await http.get("/payments/reports/revenue", { from, to, groupBy: "day" });
      const r2 = await http.get("/payments/reports/top-services", { from, to, limit: 10 });
      setRev(r1 || { rows: [] });
      setTop(r2 || { rows: [] });
    } finally { setLoading(false); }
  }
  useEffect(()=>{ load(); /* eslint-disable-next-line */ }, []);

  const total = useMemo(()=> (rev.rows || []).reduce((s, r)=> s + Number(r.total || 0), 0), [rev]);

  if (!allowed.includes(user?.role)) {
    return <div className="page"><div className="card">403 — ruxsat yo'q (Director)</div></div>;
  }

  return (
    <div className="page">
      <div className="hdr">
        <div>
          <h1>Direktor paneli</h1>
          <p className="muted">Daromad va xizmatlar bo'yicha tahlil</p>
        </div>
        <div className="actions">
          <input type="date" className="input" value={from} onChange={e=>setFrom(e.target.value)} />
          <input type="date" className="input" value={to}   onChange={e=>setTo(e.target.value)} />
          <button className="btn" onClick={load} disabled={loading}>{loading ? "Yuklanmoqda..." : "Hisoblash"}</button>
        </div>
      </div>

      <section className="grid">
        <div className="card">
          <div className="kpiTitle">Umumiy daromad</div>
          <div className="kpiVal">{Number(total).toLocaleString("uz-UZ")} so'm</div>
          <div className="muted">{from} → {to}</div>
        </div>
        <div className="card">
          <div className="kpiTitle">Kunlar bo'yicha</div>
          <div className="tableWrap">
            <table className="table">
              <thead><tr><th>Sana</th><th className="num">Summa</th></tr></thead>
              <tbody>
                {(rev.rows || []).map((r, i) => (
                  <tr key={i}>
                    <td>
                      {r._id?.y}-{String(r._id?.m).padStart(2,"0")}{r._id?.d ? "-" + String(r._id?.d).padStart(2,"0") : ""}
                    </td>
                    <td className="num">{Number(r.total || 0).toLocaleString("uz-UZ")}</td>
                  </tr>
                ))}
                {(rev.rows || []).length === 0 && <tr><td colSpan={2} className="muted" style={{textAlign:"center"}}>Ma'lumot yo'q</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="kpiTitle">Eng ko'p sotilgan xizmatlar (Top 10)</div>
          <div className="tableWrap">
            <table className="table">
              <thead><tr><th>Xizmat</th><th className="num">Soni</th><th className="num">Daromad</th></tr></thead>
              <tbody>
                {(top.rows || []).map((r) => (
                  <tr key={r._id}>
                    <td>{r.name}</td>
                    <td className="num">{Number(r.sold || 0).toLocaleString("uz-UZ")}</td>
                    <td className="num">{Number(r.revenue || 0).toLocaleString("uz-UZ")}</td>
                  </tr>
                ))}
                {(top.rows || []).length === 0 && <tr><td colSpan={3} className="muted" style={{textAlign:"center"}}>Ma'lumot yo'q</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <style>{css}</style>
    </div>
  );
}

const css = `
.page{padding:16px}
.hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.muted{color:#6b7280}
.btn{border:1px solid #e5e7eb;background:#fff;border-radius:10px;padding:9px 12px;cursor:pointer;font-weight:700}
.input{border:1px solid #e5e7eb;border-radius:10px;padding:9px 10px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:12px}
.kpiTitle{font-weight:900;margin-bottom:6px}
.kpiVal{font-size:28px;font-weight:900}
.tableWrap{overflow:auto;margin-top:8px}
.table{width:100%;border-collapse:collapse}
.table th,.table td{border-bottom:1px solid #f1f5f9;padding:10px;vertical-align:middle;text-align:left}
.table .num{text-align:right}
@media (max-width: 1100px){ .grid{grid-template-columns:1fr} }
`;
