// src/pages/Services.jsx
import { useEffect, useState } from "react";
import http from "../lib/http.js";

const emptyCreate = {
  name: "",
  description: "",
  price: "",
  durationMinutes: "",
};

export default function Services() {
  // Ro'yxat holati
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Filtr/pagination
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Yaratish formasi
  const [createForm, setCreateForm] = useState(emptyCreate);
  const [createBusy, setCreateBusy] = useState(false);
  const [createMsg, setCreateMsg] = useState("");

  // Tahrirlash holati
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(emptyCreate);
  const [editBusy, setEditBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await http.get("/services", { search, page, limit });
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // Agar qidiruv faqat tugma bilan bo'lsin desangiz,
    // dependency faqat [page] qoldiring va "Qidirish" bosilganda load() chaqiring.
  }, [search, page]);

  async function createService() {
    setCreateBusy(true);
    setCreateMsg("");
    try {
      const payload = {
        name: createForm.name.trim(),
        description: createForm.description?.trim() || "",
        price: Number(createForm.price),
        durationMinutes: parseInt(createForm.durationMinutes, 10),
      };
      if (!payload.name) throw new Error("Nomi majburiy");
      if (!Number.isFinite(payload.price)) throw new Error("Narx noto‘g‘ri");
      if (!Number.isInteger(payload.durationMinutes) || payload.durationMinutes <= 0) {
        throw new Error("Davomiylik noto‘g‘ri");
      }

      const res = await http.post("/services", payload);
      if (res?.id) {
        // Yangi xizmatni olib ro'yxatga qo'shamiz
        const just = await http.get(`/services/${res.id}`);
        setItems(prev => [just, ...prev]);
        setTotal(t => t + 1);
      } else {
        await load();
      }
      setCreateForm(emptyCreate);
      setCreateMsg("Xizmat muvaffaqiyatli qo‘shildi");
    } catch (e) {
      setCreateMsg(e?.response?.data?.message || e.message || "Xatolik");
    } finally {
      setCreateBusy(false);
    }
  }

  function startEdit(svc) {
    setEditId(svc._id);
    setEditForm({
      name: svc.name || "",
      description: svc.description || "",
      price: svc.price ?? "",
      durationMinutes: svc.durationMinutes ?? "",
    });
  }

  function cancelEdit() {
    setEditId(null);
    setEditForm(emptyCreate);
  }

  async function saveEdit(id) {
    setEditBusy(true);
    try {
      const payload = {
        name: editForm.name.trim(),
        description: editForm.description?.trim() || "",
        price: Number(editForm.price),
        durationMinutes: parseInt(editForm.durationMinutes, 10),
      };
      if (!payload.name) throw new Error("Nomi majburiy");
      if (!Number.isFinite(payload.price)) throw new Error("Narx noto‘g‘ri");
      if (!Number.isInteger(payload.durationMinutes) || payload.durationMinutes <= 0) {
        throw new Error("Davomiylik noto‘g‘ri");
      }

      const updated = await http.put(`/services/${id}`, payload);
      setItems(prev => prev.map(x => (x._id === id ? updated : x)));
      cancelEdit();
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "Tahrirlashda xatolik");
    } finally {
      setEditBusy(false);
    }
  }

  async function remove(id) {
    if (!confirm("Ushbu xizmatni o‘chirasizmi?")) return;
    try {
      await http.del(`/services/${id}`);
      setItems(prev => prev.filter(x => x._id !== id));
      setTotal(t => Math.max(0, t - 1));
    } catch (e) {
      alert(e?.response?.data?.message || "O‘chirishda xatolik");
    }
  }

  return (
    <div className="page">
      <h1>Xizmatlar</h1>

      {/* Qidiruv */}
      <div className="card">
        <div className="row" style={{ gap: 8 }}>
          <input
            className="input"
            placeholder="Nomi/tavsif bo‘yicha qidirish"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className="btn" onClick={() => { setPage(1); load(); }}>
            Qidirish
          </button>
        </div>
      </div>

      {/* Yangi xizmat */}
      <div className="card">
        <h3>Yangi xizmat</h3>
        <div className="row" style={{ gap: 8 }}>
          <input
            className="input"
            placeholder="Nomi"
            value={createForm.name}
            onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
          />
          <input
            className="input"
            type="number"
            min="0"
            step="1000"
            placeholder="Narx (so‘m)"
            value={createForm.price}
            onChange={e => setCreateForm({ ...createForm, price: e.target.value })}
          />
          <input
            className="input"
            type="number"
            min="1"
            step="1"
            placeholder="Davomiylik (daq)"
            value={createForm.durationMinutes}
            onChange={e => setCreateForm({ ...createForm, durationMinutes: e.target.value })}
          />
          <input
            className="input"
            placeholder="Tavsif (ixtiyoriy)"
            value={createForm.description}
            onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
          />
          <button className="btn primary" disabled={createBusy} onClick={createService}>
            {createBusy ? "..." : "Qo‘shish"}
          </button>
        </div>
        {createMsg && <div style={{ marginTop: 8, color: "#8aa0b6" }}>{createMsg}</div>}
      </div>

      {/* Jadval */}
      <div className="card">
        {loading ? (
          <div>Yuklanmoqda...</div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nomi</th>
                    <th>Narx</th>
                    <th>Davomiylik</th>
                    <th>Tavsif</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center" }}>
                        Xizmatlar topilmadi
                      </td>
                    </tr>
                  ) : (
                    items.map(svc => {
                      const isEdit = editId === svc._id;
                      return (
                        <tr key={svc._id}>
                          <td>
                            {isEdit ? (
                              <input
                                className="input"
                                value={editForm.name}
                                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                              />
                            ) : (
                              svc.name
                            )}
                          </td>
                          <td>
                            {isEdit ? (
                              <input
                                className="input"
                                type="number"
                                min="0"
                                step="1000"
                                value={editForm.price}
                                onChange={e => setEditForm({ ...editForm, price: e.target.value })}
                              />
                            ) : (
                              `${svc.price?.toLocaleString?.() || svc.price} so‘m`
                            )}
                          </td>
                          <td>
                            {isEdit ? (
                              <input
                                className="input"
                                type="number"
                                min="1"
                                step="1"
                                value={editForm.durationMinutes}
                                onChange={e => setEditForm({ ...editForm, durationMinutes: e.target.value })}
                              />
                            ) : (
                              `${svc.durationMinutes} daq`
                            )}
                          </td>
                          <td style={{ maxWidth: 420 }}>
                            {isEdit ? (
                              <input
                                className="input"
                                value={editForm.description}
                                onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                              />
                            ) : (
                              svc.description
                            )}
                          </td>
                          <td style={{ whiteSpace: "nowrap" }}>
                            {isEdit ? (
                              <>
                                <button
                                  className="btn primary"
                                  disabled={editBusy}
                                  onClick={() => saveEdit(svc._id)}
                                >
                                  Saqlash
                                </button>{" "}
                                <button className="btn" onClick={cancelEdit}>
                                  Bekor qilish
                                </button>
                              </>
                            ) : (
                              <>
                                <button className="btn" onClick={() => startEdit(svc)}>
                                  Tahrirlash
                                </button>{" "}
                                <button className="btn" onClick={() => remove(svc._id)}>
                                  O‘chirish
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 12 }}>
              <span className="badge">Jami: {total}</span>
              <button
                className="btn"
                style={{ marginLeft: 8 }}
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                Oldingi
              </button>
              <button
                className="btn"
                style={{ marginLeft: 8 }}
                disabled={(page * limit) >= total}
                onClick={() => setPage(p => p + 1)}
              >
                Keyingi
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
