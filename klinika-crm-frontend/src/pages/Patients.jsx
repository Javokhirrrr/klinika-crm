// src/pages/Patients.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import http from "../lib/http";

/* =============================== helpers =============================== */
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");
const fmtDT = (d) => (d ? new Date(d).toLocaleString() : "—");
const fmtMoney = (n) => `${Number(n || 0).toLocaleString("uz-UZ")} UZS`;
const ageFromDob = (dob) => {
  if (!dob) return "";
  const d = new Date(dob);
  const diff = Date.now() - d.getTime();
  const age = new Date(diff).getUTCFullYear() - 1970;
  return age < 0 || isNaN(age) ? "" : age;
};
const splitFullName = (full = "") => {
  const parts = String(full).trim().split(/\s+/);
  const firstName = parts.shift() || "";
  const lastName = parts.join(" ");
  return { firstName, lastName };
};
const nameOf = (u) =>
  `${u?.firstName || ""} ${u?.lastName || ""}`.trim() ||
  u?.name || u?.title || "";

/* =============================== small UI =============================== */
function StatCard({ icon = null, title, value }) {
  return (
    <div className="card" style={{ padding: 14, display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 10 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: "#F1F5F9", display: "grid", placeItems: "center", fontWeight: 700 }}>{icon || "📊"}</div>
      <div>
        <div className="muted" style={{ fontSize: 12 }}>{title}</div>
        <div style={{ fontSize: 18, fontWeight: 800 }}>{value}</div>
      </div>
    </div>
  );
}

/* =============================== Preview (patient dashboard) =============================== */
function PatientPreviewModal({ open, patient, onClose }) {
  const [tab, setTab] = useState("general"); // general | appts | pays
  const [loading, setLoading] = useState(false);
  const [appts, setAppts] = useState([]);
  const [pays, setPays] = useState([]);
  const [serviceMap, setServiceMap] = useState({}); // {serviceId: {name, price}}
  const [doctorMap, setDoctorMap] = useState({});   // {doctorId: doctorObj}

  useEffect(() => { if (open) setTab("general"); }, [open]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!open || !patient?._id) return;
      setLoading(true);
      try {
        // 1) Qabullar
        const ar = await http.get("/appointments", {
          patientId: patient._id,
          page: 1,
          limit: 300,
          sort: "startsAt:desc",
        }).catch(() => ({ items: [] }));
        const A = ar.items || ar || [];
        if (!ignore) setAppts(A);

        // 2) To‘lovlar
        const pr = await http.get("/payments", {
          patientId: patient._id,
          page: 1,
          limit: 500,
          sort: "-createdAt",
        }).catch(() => ({ items: [] }));
        const P = pr.items || pr || [];
        if (!ignore) setPays(P);

        // 3) Xizmatlar (id -> name/price)
        const sIds = [...new Set(
          A.flatMap(a =>
            (Array.isArray(a.services) && a.services.length ? a.services : (a.serviceIds || []))
              .map(s => (typeof s === "object" ? (s._id || s.id) : s))
              .filter(Boolean)
          )
        )];
        if (sIds.length) {
          const sr = await http.get("/services", { ids: sIds.join(","), page: 1, limit: sIds.length }).catch(() => ({ items: [] }));
          const S = sr.items || sr || [];
          const sMap = {};
          S.forEach(s => { sMap[s._id || s.id] = { price: Number(s.price || 0), name: s.name || "Xizmat" }; });
          if (!ignore) setServiceMap(sMap);
        } else if (!ignore) setServiceMap({});

        // 4) Shifokorlar (populate bo‘lmasa ham nomini chiqaramiz)
        const dIds = [...new Set(
          A.map(a => {
            const d = a.doctor ?? a.doctorId;
            if (!d) return null;
            return typeof d === "object" ? (d._id || d.id) : d;
          }).filter(Boolean)
        )];
        if (dIds.length) {
          const results = await Promise.all(dIds.map(async (id) => {
            try { return [id, await http.get(`/doctors/${id}`)]; }
            catch { try { return [id, await http.get(`/users/${id}`)]; } catch { return [id, null]; } }
          }));
          const dMap = {};
          for (const [id, obj] of results) if (obj) dMap[id] = obj;
          if (!ignore) setDoctorMap(dMap);
        } else if (!ignore) setDoctorMap({});
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [open, patient?._id]);

  // Hisob-kitoblar
  const totalServicesAmount = useMemo(() => {
    const sumAppt = (a) => {
      const arr = Array.isArray(a.services) && a.services.length ? a.services : (a.serviceIds || []);
      let s = 0;
      for (const it of arr) {
        if (typeof it === "object") s += Number(it.price ?? it.amount ?? 0) || 0;
        else s += Number(serviceMap[it]?.price || 0);
      }
      if (!s) s = Number(a.total ?? a.totalPrice ?? a.price ?? a.amount ?? 0) || 0;
      return s;
    };
    return appts.reduce((t, a) => t + sumAppt(a), 0);
  }, [appts, serviceMap]);

  const totalPaymentsAmount = useMemo(
    () => pays.reduce((s, p) => s + Number(p.amount || 0), 0),
    [pays]
  );

  const debt = Math.max(0, totalServicesAmount - totalPaymentsAmount);
  const lastVisit = appts.length ? (appts[0].startsAt || appts[0].startAt || appts[0].createdAt) : null;

  if (!open) return null;

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.38)", display: "grid", placeItems: "center", zIndex: 60 }}>
      <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: 1100, maxWidth: "96vw", maxHeight: "94vh", display: "flex", flexDirection: "column", padding: 0 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderBottom: "1px solid #e5e7eb" }}>
          <button className="btn" onClick={onClose} title="Orqaga">←</button>
          <h2 style={{ margin: 0 }}>{(patient?.firstName || "") + " " + (patient?.lastName || "") || "Bemor"}</h2>
          <div className="badge" style={{ marginLeft: 10 }}>Qarz: <b style={{ marginLeft: 6 }}>{fmtMoney(debt)}</b></div>
          {!!lastVisit && <div className="badge" style={{ marginLeft: 10 }}>Oxirgi tashrif: <b style={{ marginLeft: 6 }}>{fmtDT(lastVisit)}</b></div>}
          {loading && <span className="muted" style={{ marginLeft: "auto" }}>Yuklanmoqda…</span>}
        </div>

        {/* Tabs */}
        <div className="row" style={{ gap: 10, padding: "8px 12px", borderBottom: "1px solid #e5e7eb", flexWrap: "wrap" }}>
          {["general", "appts", "pays"].map(k => (
            <button
              key={k}
              className="btn"
              onClick={() => setTab(k)}
              style={{ background: tab === k ? "#111827" : "#fff", color: tab === k ? "#fff" : "#111827" }}
            >
              {k === "general" ? "Umumiy" : k === "appts" ? "Qabullar" : "To‘lovlar"}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: 14, overflow: "auto" }}>
          {tab === "general" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {/* Left — patient info */}
              <div className="card" style={{ padding: 14 }}>
                <div className="muted" style={{ marginBottom: 10, fontWeight: 700 }}>Ma’lumot</div>
                <div style={{ display: "grid", rowGap: 8 }}>
                  <div><b>Telefon:</b> <span className="muted">{patient?.phone || "Kiritilmagan"}</span></div>
                  <div><b>Jins:</b> <span className="muted">{patient?.gender === "male" ? "Erkak" : patient?.gender === "female" ? "Ayol" : (patient?.gender || "Kiritilmagan")}</span></div>
                  <div><b>Yosh:</b> <span className="muted">{ageFromDob(patient?.dob) || "—"}</span></div>
                  <div><b>Karta №:</b> <span className="muted">{patient?.cardNo || "—"}</span></div>
                  <div><b>Yaratilgan:</b> <span className="muted">{fmtDT(patient?.createdAt)}</span></div>
                  {!!patient?.complaint && <div><b>Shikoyati:</b> <span className="muted">{patient.complaint}</span></div>}
                </div>
              </div>

              {/* Right — stats */}
              <div style={{ display: "grid", gap: 12 }}>
                <StatCard icon="💰" title="Umumiy to‘lovlar" value={fmtMoney(totalPaymentsAmount)} />
                <StatCard icon="🧾" title="Umumiy hisob (xizmatlar yig‘indisi)" value={fmtMoney(totalServicesAmount)} />
                <StatCard icon="📅" title="Qabullar soni" value={appts.length} />
              </div>
            </div>
          )}

          {tab === "appts" && (
            <div className="card" style={{ padding: 12 }}>
              {appts.length === 0 ? (
                <div>Qabul topilmadi</div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Sana/Vaqt</th>
                      <th>Holat</th>
                      <th>Shifokor</th>
                      <th>Xizmatlar</th>
                      <th>Jami</th>
                      <th>Izoh</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appts.map((a) => {
                      const svcArr = Array.isArray(a.services) && a.services.length ? a.services : (a.serviceIds || []);
                      const count = svcArr.length || 0;
                      const total =
                        (Array.isArray(a.services) && a.services.length
                          ? a.services.reduce((s, x) => s + Number(x.price ?? x.amount ?? 0), 0)
                          : (a.serviceIds || []).reduce((s, id) => s + Number(serviceMap[id]?.price || 0), 0))
                        || Number(a.total ?? a.price ?? a.amount ?? 0) || 0;

                      // Shifokor nomi (populate → object; aks holda doctorMap)
                      const docId =
                        typeof a.doctor === "object" ? (a.doctor._id || a.doctor.id)
                          : (a.doctorId || a.doctor || null);
                      const docObj =
                        typeof a.doctor === "object" ? a.doctor
                          : (doctorMap[docId] || null);
                      const doctorName = nameOf(docObj) || "—";

                      return (
                        <tr key={a._id}>
                          <td>{fmtDT(a.startsAt || a.startAt || a.createdAt)}</td>
                          <td>{a.status === "waiting" ? "Navbat" : a.status === "in_progress" ? "Jarayonda" : a.status === "done" ? "To‘lov kutilmoqda" : a.status || "—"}</td>
                          <td>{doctorName}</td>
                          <td>{count}</td>
                          <td>{fmtMoney(total)}</td>
                          <td className="muted">{a.note || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === "pays" && (
            <div className="card" style={{ padding: 12 }}>
              {pays.length === 0 ? (
                <div>To‘lovlar topilmadi</div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Sana/Vaqt</th>
                      <th>Summa</th>
                      <th>Usul</th>
                      <th>Qabul ID</th>
                      <th>Izoh</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pays.map((p) => (
                      <tr key={p._id}>
                        <td>{fmtDT(p.createdAt)}</td>
                        <td>{fmtMoney(p.amount)}</td>
                        <td>{p.method}</td>
                        <td className="muted">{p.appointmentId || "—"}</td>
                        <td className="muted">{p.note || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =============================== PATIENTS PAGE =============================== */
export default function Patients() {
  // list state
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // filters (bitta qidiruv katagi + qo‘shimcha)
  const [q, setQ] = useState("");
  const [gender, setGender] = useState("");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [cardNo, setCardNo] = useState("");
  const [hasPhone, setHasPhone] = useState(false);

  // add modal
  const [openAdd, setOpenAdd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ fullName: "", phone: "", age: "", gender: "", complaint: "", cardNo: "" });

  // edit modal
  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ fullName: "", phone: "", age: "", gender: "", complaint: "", cardNo: "" });

  // preview modal
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPatient, setPreviewPatient] = useState(null);

  // debounced search
  const timer = useRef(null);
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setPage(1);
      load();
    }, 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, gender, ageMin, ageMax, cardNo, hasPhone]);

  useEffect(() => { load(); }, [page]);

  async function load() {
    setLoading(true);
    setMsg("");
    try {
      const data = await http.get("/patients", {
        page,
        limit,
        q,                                   // ism/fam/telefon/karta — bitta qidiruv
        gender: gender || undefined,
        ageMin: ageMin || undefined,
        ageMax: ageMax || undefined,
        cardNo: cardNo || undefined,
        hasPhone: hasPhone ? 1 : undefined,
      });
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
      setItems([]);
      setTotal(0);
      setMsg(e?.response?.data?.message || "Yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }

  function resetFilters() {
    setQ(""); setGender(""); setAgeMin(""); setAgeMax("");
    setCardNo(""); setHasPhone(false); setPage(1);
  }

  // CREATE
  async function create() {
    setBusy(true);
    setMsg("");
    try {
      const { firstName, lastName } = splitFullName(form.fullName);
      let dob;
      if (form.age) {
        const a = parseInt(form.age, 10);
        if (!isNaN(a) && a > 0 && a < 130) {
          const d = new Date();
          d.setHours(0, 0, 0, 0);
          d.setMonth(5); d.setDate(1); d.setFullYear(d.getFullYear() - a);
          dob = d.toISOString();
        }
      }
      const payload = {
        firstName, lastName,
        phone: form.phone || undefined,
        dob, gender: form.gender || undefined,
        complaint: form.complaint || undefined,
        cardNo: form.cardNo || undefined,
      };
      const created = await http.post("/patients", payload);
      setOpenAdd(false);
      setForm({ fullName: "", phone: "", age: "", gender: "", complaint: "", cardNo: "" });
      setPage(1);
      await load();
      setMsg(`Bemor qo‘shildi: ${(created?.firstName || "")} ${(created?.lastName || "")}`.trim());
    } catch (e) {
      setMsg(e?.response?.data?.message || "Yaratishda xatolik");
    } finally {
      setBusy(false);
    }
  }

  // EDIT
  function openEditModal(p) {
    setEditId(p._id);
    setEditForm({
      fullName: `${p.firstName || ""} ${p.lastName || ""}`.trim(),
      phone: p.phone || "",
      age: ageFromDob(p.dob) || "",
      gender: p.gender || "",
      complaint: p.complaint || p.notes || "",
      cardNo: p.cardNo || "",
    });
    setOpenEdit(true);
  }
  async function saveEdit() {
    if (!editId) return;
    setBusy(true);
    setMsg("");
    try {
      const { firstName, lastName } = splitFullName(editForm.fullName);
      let dob;
      if (editForm.age) {
        const a = parseInt(editForm.age, 10);
        if (!isNaN(a) && a > 0 && a < 130) {
          const d = new Date();
          d.setHours(0, 0, 0, 0);
          d.setMonth(5); d.setDate(1); d.setFullYear(d.getFullYear() - a);
          dob = d.toISOString();
        }
      }
      const payload = {
        firstName, lastName,
        phone: editForm.phone || undefined,
        dob, gender: editForm.gender || undefined,
        complaint: editForm.complaint || undefined,
        cardNo: editForm.cardNo || undefined,
      };
      const upd = await http.put(`/patients/${editId}`, payload);
      setItems((prev) => prev.map((x) => (x._id === editId ? { ...x, ...upd } : x)));
      setOpenEdit(false); setEditId(null);
      setMsg("Ma’lumotlar yangilandi");
    } catch (e) {
      setMsg(e?.response?.data?.message || "Tahrirlashda xatolik");
    } finally {
      setBusy(false);
    }
  }

  // DELETE
  async function remove(id) {
    if (!confirm("Ushbu bemorni o‘chirishni tasdiqlaysizmi?")) return;
    try {
      await http.del(`/patients/${id}`);
      setItems((prev) => prev.filter((x) => x._id !== id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (e) {
      setMsg(e?.response?.data?.message || "O‘chirishda xatolik");
    }
  }

  // PREVIEW
  function openPreview(p) {
    setPreviewPatient(p);
    setPreviewOpen(true);
  }

  const pageMax = useMemo(() => Math.ceil(Math.max(1, total) / limit), [total, limit]);

  return (
    <div className="page">
      <div className="row" style={{ alignItems: "center", marginBottom: 8 }}>
        <h2 style={{ margin: 0 }}>Bemorlar</h2>
        <button className="btn primary" style={{ marginLeft: "auto" }} onClick={() => setOpenAdd(true)}>
          Yangi bemor
        </button>
      </div>

      {/* FILTRLAR */}
      <div className="card">
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <input className="input" placeholder="Qidiruv: ism/familiya/telefon/karta №"
            value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: "1 1 420px" }} />
          <select className="input" value={gender} onChange={(e) => setGender(e.target.value)} style={{ width: 160 }}>
            <option value="">Jins: hammasi</option>
            <option value="male">Erkak</option>
            <option value="female">Ayol</option>
            <option value="other">Boshqa</option>
          </select>
          <input className="input" type="number" placeholder="Yosh min" value={ageMin} onChange={(e) => setAgeMin(e.target.value)} style={{ width: 120 }} />
          <input className="input" type="number" placeholder="Yosh max" value={ageMax} onChange={(e) => setAgeMax(e.target.value)} style={{ width: 120 }} />
          <input className="input" placeholder="Karta №" value={cardNo} onChange={(e) => setCardNo(e.target.value)} style={{ width: 160 }} />
          <label className="row" style={{ gap: 6, alignItems: "center" }}>
            <input type="checkbox" checked={hasPhone} onChange={(e) => setHasPhone(e.target.checked)} />
            <span className="muted">Telefon bor</span>
          </label>
          <button className="btn" onClick={resetFilters}>Tozalash</button>
          <button className="btn" onClick={load}>Yangilash</button>
        </div>
      </div>

      {/* JADVAL */}
      <div className="card">
        {loading ? (
          <div>Yuklanmoqda...</div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>F.I.Sh</th>
                    <th>Telefon</th>
                    <th>Yosh</th>
                    <th>Jins</th>
                    <th>Karta №</th>
                    <th>Shikoyati</th>
                    <th>Yaratilgan</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: "center" }}>Bemorlar topilmadi</td></tr>
                  ) : items.map((p) => (
                    <tr key={p._id}>
                      <td>
                        <button
                          className="linkish"
                          onClick={() => openPreview(p)}
                          style={{ background: "none", border: "none", padding: 0, color: "#2563eb", cursor: "pointer" }}
                          title="Bemor premyeri"
                        >
                          {(p.firstName || "") + " " + (p.lastName || "")}
                        </button>
                      </td>
                      <td>{p.phone || "—"}</td>
                      <td>{ageFromDob(p.dob) || "—"}</td>
                      <td>{p.gender === "male" ? "Erkak" : p.gender === "female" ? "Ayol" : p.gender || "—"}</td>
                      <td>{p.cardNo || "—"}</td>
                      <td className="muted" style={{ maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.complaint || p.notes || "—"}
                      </td>
                      <td>{fmtDate(p.createdAt)}</td>
                      <td className="row" style={{ gap: 6, justifyContent: "flex-end" }}>
                        <button className="btn" onClick={() => openEditModal(p)}>Tahrirlash</button>
                        <button className="btn" onClick={() => remove(p._id)} style={{ background: "#FEE2E2", borderColor: "#fecaca", color: "#B91C1C" }}>
                          O'chirish
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="row" style={{ gap: 8, marginTop: 12, alignItems: "center" }}>
              <span className="badge">Jami: {total}</span>
              <button className="btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Oldingi</button>
              <span className="muted">Sahifa {page} / {pageMax}</span>
              <button className="btn" disabled={page >= pageMax} onClick={() => setPage(p => p + 1)}>Keyingi</button>
            </div>
          </>
        )}
      </div>

      {/* ADD MODAL */}
      {!openAdd ? null : (
        <div onClick={() => setOpenAdd(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.35)", display: "grid", placeItems: "center", zIndex: 40 }}>
          <div className="card" style={{ width: 720, maxWidth: "95vw", padding: 16 }} onClick={(e) => e.stopPropagation()}>
            <h3>Yangi bemor</h3>
            <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
              <input className="input" placeholder="Ism Familiya" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} style={{ flex: "1 1 280px" }} />
              <input className="input" placeholder="Telefon (+998…)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={{ width: 200 }} />
              <input className="input" type="number" placeholder="Yoshi" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} style={{ width: 120 }} />
              <select className="input" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} style={{ width: 160 }}>
                <option value="">Jins</option>
                <option value="male">Erkak</option>
                <option value="female">Ayol</option>
                <option value="other">Boshqa</option>
              </select>
              <input className="input" placeholder="Karta № (ixtiyoriy)" value={form.cardNo} onChange={(e) => setForm({ ...form, cardNo: e.target.value })} style={{ width: 180 }} />
              <textarea className="input" rows={3} placeholder="Shikoyati" value={form.complaint} onChange={(e) => setForm({ ...form, complaint: e.target.value })} style={{ flex: "1 1 100%" }} />
            </div>
            <div className="row" style={{ gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
              <button className="btn" onClick={() => setOpenAdd(false)}>Bekor qilish</button>
              <button className="btn primary" disabled={busy} onClick={create}>{busy ? "…" : "Saqlash"}</button>
            </div>
            {!!msg && <div className="muted" style={{ marginTop: 8 }}>{msg}</div>}
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {!openEdit ? null : (
        <div onClick={() => setOpenEdit(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.35)", display: "grid", placeItems: "center", zIndex: 41 }}>
          <div className="card" style={{ width: 720, maxWidth: "95vw", padding: 16 }} onClick={(e) => e.stopPropagation()}>
            <h3>Bemorni tahrirlash</h3>
            <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
              <input className="input" placeholder="Ism Familiya" value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} style={{ flex: "1 1 280px" }} />
              <input className="input" placeholder="Telefon (+998…)" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} style={{ width: 200 }} />
              <input className="input" type="number" placeholder="Yoshi" value={editForm.age} onChange={(e) => setEditForm({ ...editForm, age: e.target.value })} style={{ width: 120 }} />
              <select className="input" value={editForm.gender} onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })} style={{ width: 160 }}>
                <option value="">Jins</option>
                <option value="male">Erkak</option>
                <option value="female">Ayol</option>
                <option value="other">Boshqa</option>
              </select>
              <input className="input" placeholder="Karta № (ixtiyoriy)" value={editForm.cardNo} onChange={(e) => setEditForm({ ...editForm, cardNo: e.target.value })} style={{ width: 180 }} />
              <textarea className="input" rows={3} placeholder="Shikoyati" value={editForm.complaint} onChange={(e) => setEditForm({ ...editForm, complaint: e.target.value })} style={{ flex: "1 1 100%" }} />
            </div>
            <div className="row" style={{ gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
              <button className="btn" onClick={() => setOpenEdit(false)}>Bekor qilish</button>
              <button className="btn primary" disabled={busy} onClick={saveEdit}>{busy ? "…" : "Saqlash"}</button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      <PatientPreviewModal open={previewOpen} patient={previewPatient} onClose={() => setPreviewOpen(false)} />

      {!!msg && <div className="muted" style={{ marginTop: 10 }}>{msg}</div>}
    </div>
  );
}
