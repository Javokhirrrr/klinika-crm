// src/pages/Doctors.jsx
import { useEffect, useMemo, useState } from "react";
import http from "../lib/http";

const fmtPhone = (s) => (s || "").replace(/[^\d+]/g, "");
const fmtDT = (d) => (d ? new Date(d).toLocaleString() : "—");

// ⬇️ API bazaviy URL (nisbiy URL’larni to‘liq qilamiz)
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/* --------------------- Doctor Preview (modal) — PDF only --------------------- */
function DoctorPreviewModal({ open, doctorId, onClose }) {
  const [tab, setTab] = useState("general"); // general | certs | schedule
  const [busy, setBusy] = useState(false);

  const [row, setRow] = useState(null);
  const [certs, setCerts] = useState([]); // [{id,name,url,uploadedAt}]
  const [week, setWeek] = useState({
    mon: { start: "", end: "" }, tue: { start: "", end: "" }, wed: { start: "", end: "" },
    thu: { start: "", end: "" }, fri: { start: "", end: "" }, sat: { start: "", end: "" }, sun: { start: "", end: "" },
  });

  useEffect(() => { if (open) setTab("general"); }, [open]);

  function extractCerts(resp) {
    const arr0 = resp?.items ?? resp?.files ?? resp?.rows ?? resp?.data ?? resp ?? [];
    const arr = Array.isArray(arr0) ? arr0 : (Array.isArray(arr0?.items) ? arr0.items : []);
    return (arr || []).map(c => {
      const id = c._id || c.id;
      const nm = c.name || c.filename || c.originalName || "certificate.pdf";
      const rel = c.url || c.path || c.downloadUrl || null;
      const url = rel
        ? (/^https?:/i.test(rel) ? rel : `${API_BASE}${rel.startsWith("/") ? "" : "/"}${rel}`)
        : `${API_BASE}/doctors/${doctorId}/certificates/${id}`;
      return { id, name: nm, url, uploadedAt: c.uploadedAt || c.createdAt || null };
    });
  }

  async function loadAll() {
    if (!open || !doctorId) return;
    setBusy(true);
    try {
      const d = await http.get(`/doctors/${doctorId}`).catch(() => null);
      if (d) setRow(d);

      // CERTS
      try {
        const r = await http.get(`/doctors/${doctorId}/certificates`);
        const list = extractCerts(r).filter(x => /\.pdf$/i.test(x.name));
        setCerts(list);
      } catch { setCerts([]); }

      // SCHEDULE
      try {
        const r = await http.get(`/doctors/${doctorId}/schedule`);
        const w = r.week || r || {};
        setWeek({
          mon: w.mon || { start: "", end: "" }, tue: w.tue || { start: "", end: "" },
          wed: w.wed || { start: "", end: "" }, thu: w.thu || { start: "", end: "" },
          fri: w.fri || { start: "", end: "" }, sat: w.sat || { start: "", end: "" },
          sun: w.sun || { start: "", end: "" },
        });
      } catch { }
    } finally { setBusy(false); }
  }

  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, [open, doctorId]);

  async function onUpload(e) {
    const files = Array.from(e.target.files || []);
    const pdfs = files.filter(f => f.type === "application/pdf" || /\.pdf$/i.test(f.name));
    if (!pdfs.length) { alert("Faqat PDF fayl yuklang."); e.target.value = ""; return; }

    const fd = new FormData();
    // Ko‘pchilik backendlar 'files' yoki 'file' qabul qiladi; ikkalasini ham jo‘natamiz:
    pdfs.forEach(f => fd.append("files", f));
    pdfs.forEach(f => fd.append("file", f));

    try {
      setBusy(true);
      await http.raw.post(`/doctors/${doctorId}/certificates`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // qayta yuklab, faqat pdflarni ko‘rsatamiz
      const r = await http.get(`/doctors/${doctorId}/certificates`);
      const list = extractCerts(r).filter(x => /\.pdf$/i.test(x.name));
      setCerts(list);
    } catch (ex) {
      alert(ex?.response?.data?.message || "Yuklashda xatolik (faqat PDF).");
    } finally { setBusy(false); e.target.value = ""; }
  }

  async function delCert(id) {
    if (!confirm("Sertifikat o‘chirilsinmi?")) return;
    await http.del(`/doctors/${doctorId}/certificates/${id}`).catch(() => { });
    try {
      const r = await http.get(`/doctors/${doctorId}/certificates`);
      const list = extractCerts(r).filter(x => /\.pdf$/i.test(x.name));
      setCerts(list);
    } catch { }
  }

  async function saveSchedule() {
    setBusy(true);
    try {
      await http.put(`/doctors/${doctorId}/schedule`, { week });
      alert("Ish vaqtlari saqlandi");
    } catch (e) {
      alert(e?.response?.data?.message || "Saqlashda xatolik");
    } finally { setBusy(false); }
  }

  if (!open) return null;

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.38)", display: "grid", placeItems: "center", zIndex: 60 }}>
      <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: 980, maxWidth: "96vw", maxHeight: "94vh", display: "flex", flexDirection: "column", padding: 0 }}>
        {/* Header */}
        <div className="row" style={{ padding: "12px 14px", alignItems: "center", borderBottom: "1px solid #e5e7eb" }}>
          <button className="btn" onClick={onClose}>←</button>
          <h2 style={{ margin: 0 }}>{(row?.firstName || "") + " " + (row?.lastName || "")}</h2>
          <span className="badge" style={{ marginLeft: 10 }}>{row?.spec || "Mutaxassislik yo‘q"}</span>
          <span style={{ marginLeft: "auto" }} className={`badge ${row?.isActive ? "success" : ""}`}>{row?.isActive ? "Faol" : "Nofaol"}</span>
        </div>

        {/* Tabs */}
        <div className="row" style={{ gap: 8, padding: "8px 12px", borderBottom: "1px solid #e5e7eb", flexWrap: "wrap" }}>
          {["general", "certs", "schedule"].map(k => (
            <button key={k} className="btn" onClick={() => setTab(k)}
              style={{ background: tab === k ? "#111827" : "#fff", color: tab === k ? "#fff" : "#111827" }}>
              {k === "general" ? "Umumiy" : k === "certs" ? "Sertifikatlar (PDF)" : "Ish vaqti"}
            </button>
          ))}
          {busy && <span className="muted">Yuklanmoqda…</span>}
        </div>

        {/* Body */}
        <div style={{ padding: 14, overflow: "auto" }}>
          {tab === "general" && (
            <div className="card" style={{ padding: 14 }}>
              <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
                <div><div className="muted" style={{ fontSize: 12 }}>Telefon</div><div style={{ fontWeight: 700 }}>{row?.phone || "—"}</div></div>
                <div><div className="muted" style={{ fontSize: 12 }}>Kabinet</div><div style={{ fontWeight: 700 }}>{row?.room || "—"}</div></div>
                <div><div className="muted" style={{ fontSize: 12 }}>Foiz</div><div style={{ fontWeight: 700 }}>{Number(row?.percent || 0)}%</div></div>
                <div><div className="muted" style={{ fontSize: 12 }}>Yaratilgan</div><div style={{ fontWeight: 700 }}>{fmtDT(row?.createdAt)}</div></div>
              </div>
              {!!row?.note && <div style={{ marginTop: 10 }}><div className="muted" style={{ fontSize: 12 }}>Izoh</div><div>{row.note}</div></div>}
            </div>
          )}

          {tab === "certs" && (
            <div className="card" style={{ padding: 14 }}>
              <div className="row" style={{ gap: 8, alignItems: "center" }}>
                <b>Sertifikatlar (faqat PDF)</b>
                <span className="muted">({certs.length})</span>
                <span style={{ flex: 1 }} />
                <label className="btn">
                  PDF yuklash
                  <input type="file" multiple accept="application/pdf,.pdf" onChange={onUpload} style={{ display: "none" }} />
                </label>
              </div>

              <table className="table" style={{ marginTop: 10 }}>
                <thead>
                  <tr>
                    <th>Nomi</th>
                    <th>Yuklangan</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {certs.length === 0 ? (
                    <tr><td colSpan={3} style={{ textAlign: "center" }}>PDF sertifikatlar yo‘q</td></tr>
                  ) : certs.map(c => (
                    <tr key={c.id}>
                      <td>{c.name}</td>
                      <td>{fmtDT(c.uploadedAt)}</td>
                      <td style={{ textAlign: "right" }}>
                        <div className="row" style={{ gap: 6, justifyContent: "flex-end" }}>
                          <a className="btn" href={c.url} target="_blank" rel="noreferrer">Ochish</a>
                          <button className="btn danger" onClick={() => delCert(c.id)}>O‘chirish</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "schedule" && (
            <div className="card" style={{ padding: 14 }}>
              <b>Haftalik ish jadvali</b>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10, marginTop: 10 }}>
                {[
                  ["mon", "Dushanba"], ["tue", "Seshanba"], ["wed", "Chorshanba"], ["thu", "Payshanba"],
                  ["fri", "Juma"], ["sat", "Shanba"], ["sun", "Yakshanba"],
                ].map(([k, label]) => (
                  <div key={k} className="card" style={{ padding: 10 }}>
                    <div className="muted" style={{ marginBottom: 6, fontWeight: 700 }}>{label}</div>
                    <div className="row" style={{ gap: 6, alignItems: "center" }}>
                      <input className="input" type="time" value={week[k].start || ""} onChange={e => setWeek(w => ({ ...w, [k]: { ...w[k], start: e.target.value } }))} />
                      <span>—</span>
                      <input className="input" type="time" value={week[k].end || ""} onChange={e => setWeek(w => ({ ...w, [k]: { ...w[k], end: e.target.value } }))} />
                      <button className="btn" onClick={() => setWeek(w => ({ ...w, [k]: { start: "", end: "" } }))}>Tozalash</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="row" style={{ gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
                <button className="btn" onClick={saveSchedule} disabled={busy}>{busy ? "…" : "Saqlash"}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* --------------------- Doctors main page --------------------- */
export default function Doctors() {
  // --------- filter state ----------
  const [q, setQ] = useState("");
  const [spec, setSpec] = useState("");
  const [active, setActive] = useState("");  // "", "true", "false"
  const [room, setRoom] = useState("");
  const [percentMin, setPercentMin] = useState("");
  const [percentMax, setPercentMax] = useState("");
  const [hasPhone, setHasPhone] = useState(false);

  const [specs, setSpecs] = useState([]);

  // --------- table state ----------
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(false);

  // --------- modal (create/edit) ----------
  const emptyForm = { _id: null, firstName: "", lastName: "", phone: "", spec: "", room: "", percent: 0, note: "", isActive: true };
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const isEdit = useMemo(() => !!form._id, [form._id]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  // --------- preview modal ----------
  const [showPreview, setShowPreview] = useState(false);
  const [previewId, setPreviewId] = useState(null);

  async function loadSpecs() {
    try {
      const r = await http.get("/doctors/specs/list");
      setSpecs(r.items || r || []);
    } catch { setSpecs([]); }
  }

  async function load() {
    setLoading(true);
    try {
      const data = await http.get("/doctors", {
        page, limit,
        q: q || undefined,
        spec: spec || undefined,
        active: active || undefined,
        room: room || undefined,
        percentMin: percentMin || undefined,
        percentMax: percentMax || undefined,
        hasPhone: hasPhone ? 1 : undefined,
        sort: "createdAt:desc"
      });
      setItems(data.items || []);
      setTotal(data.total || 0);
    } finally { setLoading(false); }
  }

  useEffect(() => { loadSpecs(); }, []);
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, q, spec, active, room, percentMin, percentMax, hasPhone]);

  function openCreate() {
    setForm(emptyForm);
    setShowForm(true);
    setMsg("");
  }
  function openEdit(row) {
    setForm({ ...row });
    setShowForm(true);
    setMsg("");
  }
  function closeForm() { setShowForm(false); setForm(emptyForm); setMsg(""); }

  async function save() {
    setBusy(true); setMsg("");
    const payload = {
      firstName: form.firstName,
      lastName: form.lastName,
      phone: fmtPhone(form.phone),
      spec: form.spec,
      room: form.room,
      percent: Number(form.percent || 0),
      note: form.note,
      isActive: form.isActive,
    };
    try {
      if (isEdit) {
        await http.put(`/doctors/${form._id}`, payload);
      } else {
        await http.post(`/doctors`, payload);
      }
      closeForm();
      setPage(1);
      await load();
      await loadSpecs();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Xatolik");
    } finally { setBusy(false); }
  }

  async function del(row) {
    if (!confirm(`"${row.firstName} ${row.lastName}" o‘chirilsinmi?`)) return;
    await http.del(`/doctors/${row._id}`);
    if (items.length === 1 && page > 1) setPage(p => p - 1);
    await load();
  }

  async function toggle(row) {
    await http.patch(`/doctors/${row._id}/toggle-active`);
    await load();
  }

  function openPreview(row) {
    setPreviewId(row._id);
    setShowPreview(true);
  }

  function resetFilters() {
    setQ(""); setSpec(""); setActive("");
    setRoom(""); setPercentMin(""); setPercentMax("");
    setHasPhone(false);
    setPage(1);
  }

  return (
    <div className="page">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Shifokorlar</h1>
        <span className="muted">({total})</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button className="btn" onClick={() => setPage(1)}>Yangilash</button>
          <button className="btn primary" onClick={openCreate}>Yangi shifokor</button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginTop: 12 }}>
        <h3>Filtrlash</h3>
        <div className="row" style={{ gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input className="input" placeholder="Ism / familiya / telefon" value={q} onChange={e => setQ(e.target.value)} style={{ minWidth: 240 }} />
          <select className="input" value={spec} onChange={e => setSpec(e.target.value)} style={{ minWidth: 180 }}>
            <option value="">Mutaxassislik (hammasi)</option>
            {specs.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="input" value={active} onChange={e => setActive(e.target.value)} style={{ minWidth: 160 }}>
            <option value="">Status (hammasi)</option>
            <option value="true">Faol</option>
            <option value="false">Nofaol</option>
          </select>
          <input className="input" placeholder="Kabinet" value={room} onChange={e => setRoom(e.target.value)} style={{ width: 120 }} />
          <input className="input" type="number" placeholder="% min" value={percentMin} onChange={e => setPercentMin(e.target.value)} style={{ width: 100 }} />
          <input className="input" type="number" placeholder="% max" value={percentMax} onChange={e => setPercentMax(e.target.value)} style={{ width: 100 }} />
          <label className="row" style={{ gap: 6, alignItems: "center" }}>
            <input type="checkbox" checked={hasPhone} onChange={(e) => setHasPhone(e.target.checked)} />
            <span className="muted">Telefon bor</span>
          </label>
          <button className="btn" onClick={() => setPage(1)}>Qo‘llash</button>
          <button className="btn" onClick={resetFilters}>Tozalash</button>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? <div>Yuklanmoqda...</div> : (
          <>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>F.I.Sh</th>
                    <th>Telefon</th>
                    <th>Mutaxassislik</th>
                    <th>Kabinet</th>
                    <th>%</th>
                    <th>Holat</th>
                    <th>Yaratilgan</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {(items || []).map(row => (
                    <tr key={row._id}>
                      <td style={{ fontWeight: 600 }}>
                        <button
                          className="linkish"
                          onClick={() => openPreview(row)}
                          style={{ background: "none", border: "none", padding: 0, color: "#2563eb", cursor: "pointer" }}
                          title="Profil"
                        >
                          {row.firstName} {row.lastName}
                        </button>
                      </td>
                      <td>{row.phone || "—"}</td>
                      <td>{row.spec || "—"}</td>
                      <td>{row.room || "—"}</td>
                      <td>{Number(row.percent || 0)}%</td>
                      <td>
                        <span className={`badge ${row.isActive ? "success" : ""}`}>
                          {row.isActive ? "Faol" : "Nofaol"}
                        </span>
                      </td>
                      <td>{fmtDT(row.createdAt)}</td>
                      <td style={{ textAlign: "right" }}>
                        <div className="row" style={{ gap: 6, justifyContent: "flex-end" }}>
                          <button className="btn" onClick={() => toggle(row)}>
                            {row.isActive ? "O‘chirish (inactive)" : "Faollashtirish"}
                          </button>
                          <button className="btn" onClick={() => openEdit(row)}>Tahrirlash</button>
                          <button className="btn danger" onClick={() => del(row)}>O‘chirish</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!items || items.length === 0) && (
                    <tr><td colSpan={8} style={{ textAlign: "center" }}>Ma’lumot topilmadi</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ marginLeft: "auto" }}>
                <button className="btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ marginRight: 8 }}>Oldingi</button>
                <button className="btn" disabled={page * limit >= total} onClick={() => setPage(p => p + 1)}>Keyingi</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="modal-backdrop" onClick={closeForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ minWidth: 680 }}>
            <h3 style={{ marginTop: 0 }}>{isEdit ? "Shifokorni tahrirlash" : "Yangi shifokor"}</h3>
            <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 220px" }}>
                <label className="muted">Ism</label>
                <input className="input" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} placeholder="Majburiy" />
              </div>
              <div style={{ flex: "1 1 220px" }}>
                <label className="muted">Familiya</label>
                <input className="input" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
              </div>
              <div style={{ flex: "1 1 220px" }}>
                <label className="muted">Telefon</label>
                <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+998..." />
              </div>
              <div style={{ flex: "1 1 220px" }}>
                <label className="muted">Mutaxassislik</label>
                <input className="input" list="specs_list" value={form.spec} onChange={e => setForm({ ...form, spec: e.target.value })} placeholder="Masalan: LOR" />
                <datalist id="specs_list">
                  {specs.map(s => <option key={s} value={s} />)}
                </datalist>
              </div>
              <div style={{ flex: "0 0 120px" }}>
                <label className="muted">Kabinet</label>
                <input className="input" value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} />
              </div>
              <div style={{ flex: "0 0 120px" }}>
                <label className="muted">Foiz (%)</label>
                <input className="input" type="number" value={form.percent} onChange={e => setForm({ ...form, percent: e.target.value })} />
              </div>
              <div style={{ flex: "1 1 100%" }}>
                <label className="muted">Izoh</label>
                <textarea className="input" rows={2} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="ixtiyoriy" />
              </div>
              <div style={{ flex: "1 1 100%", display: "flex", alignItems: "center", gap: 8 }}>
                <input id="isActive" type="checkbox" checked={!!form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
                <label htmlFor="isActive">Faol</label>
              </div>
            </div>
            {msg && <div className="muted" style={{ marginTop: 8 }}>{msg}</div>}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
              <button className="btn" onClick={closeForm}>Bekor qilish</button>
              <button className="btn primary" disabled={busy || !form.firstName?.trim()} onClick={save}>
                {busy ? "..." : "Saqlash"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      <DoctorPreviewModal open={showPreview} doctorId={previewId} onClose={() => setShowPreview(false)} />
    </div>
  );
}
