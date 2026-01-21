
import { useEffect, useMemo, useState } from "react";
import http from "../../lib/http.js";
import { useAuth } from "../../context/AuthContext.jsx";

/**
 * Doctor App — shifokor uchun navbat paneli
 * - Bugungi qabul ro'yxati (faqat shu doktorga)
 * - START / FINISH amallari
 */
export default function DoctorApp(){
  const { user } = useAuth();
  const [date, setDate] = useState(()=> new Date().toISOString().slice(0,10));
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const allowed = ["admin","doctor"];

  async function load(){
    setLoading(true); setError("");
    try{
      const r = await http.get("/appointments", { page:1, limit:500, doctorId: user?.id, date });
      setItems(r.items || []);
    } catch(e){
      setError(e?.response?.data?.message || "Ma'lumot yuklanmadi");
    } finally {
      setLoading(false);
    }
  }
  useEffect(()=>{ if(user?.id) load(); /* eslint-disable-next-line */ }, [user?.id, date]);

  const waiting = useMemo(()=> items.filter(a => ["scheduled","waiting"].includes(a.status)), [items]);
  const inprog  = useMemo(()=> items.filter(a => a.status === "in_progress"), [items]);
  const done    = useMemo(()=> items.filter(a => a.status === "done"), [items]);

  async function start(a){
    try{
      await http.post(`/appointments/${a._id || a.id}/start`);
      load();
    } catch(e){ alert(e?.response?.data?.message || "Boshlashda xatolik"); }
  }
  async function finish(a){
    try{
      await http.post(`/appointments/${a._id || a.id}/finish`);
      load();
    } catch(e){ alert(e?.response?.data?.message || "Yakunlashda xatolik"); }
  }

  if (!allowed.includes(user?.role)) {
    return <div className="page"><div className="card">403 — ruxsat yo'q (Doctor)</div></div>;
  }

  return (
    <div className="page">
      <div className="hdr">
        <div>
          <h1>Doktor paneli</h1>
          <p className="muted">Bugungi qabul</p>
        </div>
        <div className="actions">
          <input type="date" className="input" value={date} onChange={e=>setDate(e.target.value)} />
          <button className="btn" onClick={load} disabled={loading}>{loading ? "Yuklanmoqda..." : "Yangilash"}</button>
        </div>
      </div>

      {error && <div className="alert">{error}</div>}

      <div className="cols">
        <Col title="Navbat" items={waiting} actionLabel="Boshlash" onAction={start} />
        <Col title="Jarayonda" items={inprog} actionLabel="Yakunlash" onAction={finish} accent />
        <Col title="Yakunlangan" items={done} />
      </div>

      <style>{css}</style>
    </div>
  );
}

function Col({ title, items, actionLabel, onAction, accent=false }){
  return (
    <section className={"card" + (accent ? " accent" : "")}>
      <div className="title">{title}</div>
      <div className="list">
        {items.map((a) => (
          <div key={a._id || a.id} className="row">
            <div className="meta">
              <div className="time">{a.startAt ? new Date(a.startAt).toLocaleTimeString() : "—"}</div>
              <div className="muted">{String(a.patientId).slice(-6)} · {String(a.doctorId).slice(-6)}</div>
            </div>
            {onAction && <button className="btn" onClick={()=>onAction(a)}>{actionLabel}</button>}
          </div>
        ))}
        {items.length === 0 && <div className="muted">Bo'sh</div>}
      </div>
    </section>
  );
}

const css = `
.page{padding:16px}
.hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.muted{color:#6b7280}
.btn{border:1px solid #e5e7eb;background:#fff;border-radius:10px;padding:9px 12px;cursor:pointer;font-weight:700}
.input{border:1px solid #e5e7eb;border-radius:10px;padding:9px 10px}
.card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:12px}
.cols{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
.card .title{font-weight:900;margin-bottom:8px}
.row{display:flex;align-items:center;justify-content:space-between;border:1px dashed #e5e7eb;border-radius:10px;padding:10px;margin-bottom:8px}
.accent{border-color:#dbeafe;background:#f8fafc}
@media (max-width: 1100px){ .cols{grid-template-columns:1fr} }
.alert{background:#fff7ed;border:1px solid #fed7aa;padding:10px;border-radius:10px;margin-bottom:10px}
`;
