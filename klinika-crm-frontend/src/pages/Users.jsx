import { useEffect, useState } from "react";
import http from "../lib/http.js";

const emptyForm = { name: "", email: "", phone: "", role: "reception", password: "" };

export default function Users() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const params = { page, limit };
    if (search) params.search = search;
    if (role) params.role = role;
    const data = await http.get("/users", params);
    setItems(data.items || []);
    setTotal(data.total || 0);
  }
  useEffect(() => { load(); }, [page, role]);

  async function create() {
    setBusy(true); setMsg("");
    try {
      await http.post("/users", form);
      setForm(emptyForm);
      await load();
      setMsg("User created");
    } catch (e) {
      setMsg(e?.response?.data?.message || "Error");
    } finally { setBusy(false); }
  }

  async function disable(id) {
    await http.put(`/users/${id}`, { isActive: false });
    await load();
  }
  async function enable(id) {
    await http.put(`/users/${id}`, { isActive: true });
    await load();
  }
  async function remove(id) {
    if (!confirm("Delete user?")) return;
    await http.del(`/users/${id}`);
    await load();
  }
  async function restore(id) {
    await http.post(`/users/${id}/restore`);
    await load();
  }

  return (
    <div className="page">
      <h1>Users</h1>

      <div className="card">
        <div className="row">
          <input className="input" placeholder="Search name/email/phone" value={search} onChange={e => setSearch(e.target.value)} />
          <select className="input" value={role} onChange={e => setRole(e.target.value)}>
            <option value="">role</option>
            <option value="admin">admin</option>
            <option value="reception">reception</option>
            <option value="doctor">doctor</option>
            <option value="accountant">accountant</option>
          </select>
          <button className="btn" onClick={() => { setPage(1); load(); }}>Apply</button>
        </div>
      </div>

      <div className="card">
        <h3>New user</h3>
        <div className="row">
          <input className="input" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input className="input" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <input className="input" placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
            <option value="reception">reception</option><option value="doctor">doctor</option><option value="accountant">accountant</option><option value="admin">admin</option>
          </select>
          <input className="input" type="password" placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          <button className="btn primary" disabled={busy} onClick={create}>Create</button>
        </div>
        {msg && <div style={{ marginTop: 8 }}>{msg}</div>}
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {items.map(u => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.isActive ? "active" : "disabled"}{u.isDeleted ? " / deleted" : ""}</td>
                  <td>
                    {u.isActive
                      ? <button className="btn" onClick={() => disable(u._id)}>Disable</button>
                      : <button className="btn" onClick={() => enable(u._id)}>Enable</button>}
                    {" "}
                    {!u.isDeleted
                      ? <button className="btn" onClick={() => remove(u._id)}>Delete</button>
                      : <button className="btn" onClick={() => restore(u._id)}>Restore</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 12 }}>
          <span className="badge">Total: {total}</span>
          <button className="btn" style={{ marginLeft: 8 }} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
          <button className="btn" style={{ marginLeft: 8 }} disabled={(page * limit) >= total} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      </div>
    </div>
  );
}
