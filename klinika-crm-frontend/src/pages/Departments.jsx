// src/pages/Departments.jsx
import { useEffect, useState } from "react";
import http from "../lib/http";
import "./Departments.css";

const fmtDT = (d) => (d ? new Date(d).toLocaleString('uz-UZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
}) : "—");

export default function Departments() {
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all"); // all, active, inactive
    const [sortBy, setSortBy] = useState("name"); // name, code, doctorCount, createdAt

    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        _id: null,
        name: "",
        code: "",
        description: "",
        headDoctorId: "",
        floor: "",
        building: "",
        phone: "",
        email: "",
        color: "#3b82f6",
        note: "",
        isActive: true
    });

    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState("");

    const [doctors, setDoctors] = useState([]);
    const [selectedDept, setSelectedDept] = useState(null);

    useEffect(() => {
        load();
        loadDoctors();
    }, []);

    async function load() {
        setLoading(true);
        try {
            const data = await http.get("/departments");
            setItems(data.items || []);
            setTotal(data.total || 0);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function loadDoctors() {
        try {
            const data = await http.get("/doctors?limit=500");
            setDoctors(data.items || []);
        } catch (err) {
            console.error(err);
        }
    }

    function openCreate() {
        setForm({
            _id: null,
            name: "",
            code: "",
            description: "",
            headDoctorId: "",
            floor: "",
            building: "",
            phone: "",
            email: "",
            color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
            note: "",
            isActive: true
        });
        setShowForm(true);
        setMsg("");
    }

    function openEdit(row) {
        setForm({
            ...row,
            headDoctorId: row.headDoctorId?._id || ""
        });
        setShowForm(true);
        setMsg("");
    }

    function closeForm() {
        setShowForm(false);
        setMsg("");
    }

    async function save() {
        if (!form.name.trim()) {
            setMsg("Bo'lim nomi majburiy");
            return;
        }

        setBusy(true);
        setMsg("");

        try {
            const payload = {
                name: form.name,
                code: form.code,
                description: form.description,
                headDoctorId: form.headDoctorId || null,
                floor: form.floor,
                building: form.building,
                phone: form.phone,
                email: form.email,
                color: form.color,
                note: form.note,
                isActive: form.isActive
            };

            if (form._id) {
                await http.put(`/departments/${form._id}`, payload);
            } else {
                await http.post("/departments", payload);
            }

            closeForm();
            await load();
        } catch (err) {
            setMsg(err?.response?.data?.message || "Xatolik");
        } finally {
            setBusy(false);
        }
    }

    async function del(row) {
        if (!confirm(`"${row.name}" bo'limini o'chirish?`)) return;

        try {
            await http.del(`/departments/${row._id}`);
            await load();
        } catch (err) {
            alert(err?.response?.data?.message || "Xatolik");
        }
    }

    async function viewDetails(dept) {
        setSelectedDept(dept);
    }

    // Filter and sort items
    const filteredItems = items
        .filter(item => {
            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchName = item.name?.toLowerCase().includes(query);
                const matchCode = item.code?.toLowerCase().includes(query);
                const matchHead = item.headDoctorId
                    ? `${item.headDoctorId.firstName} ${item.headDoctorId.lastName}`.toLowerCase().includes(query)
                    : false;
                if (!matchName && !matchCode && !matchHead) return false;
            }

            // Status filter
            if (statusFilter === "active" && !item.isActive) return false;
            if (statusFilter === "inactive" && item.isActive) return false;

            return true;
        })
        .sort((a, b) => {
            if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
            if (sortBy === "code") return (a.code || "").localeCompare(b.code || "");
            if (sortBy === "doctorCount") return (b.doctorCount || 0) - (a.doctorCount || 0);
            if (sortBy === "createdAt") return new Date(b.createdAt) - new Date(a.createdAt);
            return 0;
        });

    return (
        <div className="departments-page">
            {/* Header */}
            <div className="page-header">
                <div className="header-left">
                    <h1>🏥 Bo'limlar</h1>
                    <span className="total-badge">{filteredItems.length} / {total}</span>
                </div>
                <div className="header-right">
                    <button className="btn-refresh" onClick={load} disabled={loading}>
                        🔄 {loading ? "Yuklanmoqda..." : "Yangilash"}
                    </button>
                    <button className="btn-primary" onClick={openCreate}>
                        ➕ Yangi Bo'lim
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-card">
                <div className="filter-row">
                    <div className="filter-group">
                        <label>🔍 Qidiruv</label>
                        <input
                            type="text"
                            className="filter-input"
                            placeholder="Bo'lim nomi, kod yoki bosh shifokor..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="filter-group">
                        <label>📊 Holat</label>
                        <select
                            className="filter-select"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">Barchasi</option>
                            <option value="active">Faol</option>
                            <option value="inactive">Nofaol</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>🔢 Saralash</label>
                        <select
                            className="filter-select"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="name">Nom bo'yicha</option>
                            <option value="code">Kod bo'yicha</option>
                            <option value="doctorCount">Shifokorlar soni</option>
                            <option value="createdAt">Yaratilgan sana</option>
                        </select>
                    </div>

                    {(searchQuery || statusFilter !== "all") && (
                        <button
                            className="btn-clear-filters"
                            onClick={() => {
                                setSearchQuery("");
                                setStatusFilter("all");
                            }}
                        >
                            ✖ Tozalash
                        </button>
                    )}
                </div>
            </div>

            {/* Departments Grid */}
            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Yuklanmoqda...</p>
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">🏥</div>
                    <h3>Bo'limlar topilmadi</h3>
                    <p>Yangi bo'lim qo'shish uchun yuqoridagi tugmani bosing</p>
                </div>
            ) : (
                <div className="departments-grid">
                    {filteredItems.map((dept) => (
                        <div key={dept._id} className="department-card">
                            {/* Card Header */}
                            <div className="card-header" style={{ borderLeftColor: dept.color || "#3b82f6" }}>
                                <div className="dept-color" style={{ background: dept.color || "#3b82f6" }}></div>
                                <div className="dept-info">
                                    <h3>{dept.name}</h3>
                                    {dept.code && <span className="dept-code">{dept.code}</span>}
                                </div>
                                <div className="dept-status">
                                    <span className={`status-badge ${dept.isActive ? 'active' : 'inactive'}`}>
                                        {dept.isActive ? '✓ Faol' : '✖ Nofaol'}
                                    </span>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="card-body">
                                {dept.description && (
                                    <p className="dept-description">{dept.description}</p>
                                )}

                                <div className="dept-details">
                                    {dept.headDoctorId && (
                                        <div className="detail-item">
                                            <span className="detail-icon">👨‍⚕️</span>
                                            <div className="detail-content">
                                                <span className="detail-label">Bosh Shifokor</span>
                                                <span className="detail-value">
                                                    {dept.headDoctorId.firstName} {dept.headDoctorId.lastName}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="detail-item">
                                        <span className="detail-icon">👥</span>
                                        <div className="detail-content">
                                            <span className="detail-label">Shifokorlar</span>
                                            <span className="detail-value">{dept.doctorCount || 0} ta</span>
                                        </div>
                                    </div>

                                    {(dept.floor || dept.building) && (
                                        <div className="detail-item">
                                            <span className="detail-icon">📍</span>
                                            <div className="detail-content">
                                                <span className="detail-label">Joylashuv</span>
                                                <span className="detail-value">
                                                    {dept.floor && `${dept.floor}`}
                                                    {dept.floor && dept.building && " / "}
                                                    {dept.building && `${dept.building}`}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {dept.phone && (
                                        <div className="detail-item">
                                            <span className="detail-icon">📞</span>
                                            <div className="detail-content">
                                                <span className="detail-label">Telefon</span>
                                                <span className="detail-value">{dept.phone}</span>
                                            </div>
                                        </div>
                                    )}

                                    {dept.email && (
                                        <div className="detail-item">
                                            <span className="detail-icon">📧</span>
                                            <div className="detail-content">
                                                <span className="detail-label">Email</span>
                                                <span className="detail-value">{dept.email}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="card-footer">
                                    <span className="created-date">
                                        📅 {fmtDT(dept.createdAt)}
                                    </span>
                                </div>
                            </div>

                            {/* Card Actions */}
                            <div className="card-actions">
                                <button className="btn-action btn-view" onClick={() => viewDetails(dept)}>
                                    👁 Ko'rish
                                </button>
                                <button className="btn-action btn-edit" onClick={() => openEdit(dept)}>
                                    ✏️ Tahrirlash
                                </button>
                                <button className="btn-action btn-delete" onClick={() => del(dept)}>
                                    🗑 O'chirish
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={closeForm}>
                    <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{form._id ? "✏️ Bo'limni Tahrirlash" : "➕ Yangi Bo'lim"}</h2>
                            <button className="modal-close" onClick={closeForm}>✖</button>
                        </div>

                        <div className="modal-body">
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Bo'lim Nomi *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="Kardiologiya"
                                        autoFocus
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Kod</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={form.code}
                                        onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                        placeholder="CARD"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Rang</label>
                                    <div className="color-picker-wrapper">
                                        <input
                                            type="color"
                                            value={form.color}
                                            onChange={(e) => setForm({ ...form, color: e.target.value })}
                                            className="color-picker"
                                        />
                                        <span className="color-value">{form.color}</span>
                                    </div>
                                </div>

                                <div className="form-group full-width">
                                    <label>Bosh Shifokor</label>
                                    <select
                                        className="form-select"
                                        value={form.headDoctorId}
                                        onChange={(e) => setForm({ ...form, headDoctorId: e.target.value })}
                                    >
                                        <option value="">Tanlanmagan</option>
                                        {doctors.map((doc) => (
                                            <option key={doc._id} value={doc._id}>
                                                {doc.firstName} {doc.lastName} - {doc.spec || "Mutaxassis"}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Qavat</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={form.floor}
                                        onChange={(e) => setForm({ ...form, floor: e.target.value })}
                                        placeholder="2-qavat"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Bino</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={form.building}
                                        onChange={(e) => setForm({ ...form, building: e.target.value })}
                                        placeholder="A Bino"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Telefon</label>
                                    <input
                                        type="tel"
                                        className="form-input"
                                        value={form.phone}
                                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                        placeholder="+998 90 123 45 67"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        placeholder="department@example.com"
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label>Tavsif</label>
                                    <textarea
                                        className="form-textarea"
                                        rows={3}
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        placeholder="Bo'lim haqida qisqacha ma'lumot"
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label>Izoh</label>
                                    <textarea
                                        className="form-textarea"
                                        rows={2}
                                        value={form.note}
                                        onChange={(e) => setForm({ ...form, note: e.target.value })}
                                        placeholder="Qo'shimcha izohlar"
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={!!form.isActive}
                                            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                                        />
                                        <span>Faol</span>
                                    </label>
                                </div>
                            </div>

                            {msg && (
                                <div className="error-message">
                                    ⚠️ {msg}
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={closeForm}>
                                Bekor qilish
                            </button>
                            <button
                                className="btn-primary"
                                disabled={busy || !form.name.trim()}
                                onClick={save}
                            >
                                {busy ? "⏳ Saqlanmoqda..." : "💾 Saqlash"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {selectedDept && (
                <div className="modal-overlay" onClick={() => setSelectedDept(null)}>
                    <div className="modal-container details-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>📋 Bo'lim Tafsilotlari</h2>
                            <button className="modal-close" onClick={() => setSelectedDept(null)}>✖</button>
                        </div>

                        <div className="modal-body">
                            <div className="details-grid">
                                <div className="detail-row">
                                    <span className="detail-label">Nomi:</span>
                                    <span className="detail-value">{selectedDept.name}</span>
                                </div>
                                {selectedDept.code && (
                                    <div className="detail-row">
                                        <span className="detail-label">Kod:</span>
                                        <span className="detail-value">{selectedDept.code}</span>
                                    </div>
                                )}
                                {selectedDept.description && (
                                    <div className="detail-row">
                                        <span className="detail-label">Tavsif:</span>
                                        <span className="detail-value">{selectedDept.description}</span>
                                    </div>
                                )}
                                {selectedDept.headDoctorId && (
                                    <div className="detail-row">
                                        <span className="detail-label">Bosh Shifokor:</span>
                                        <span className="detail-value">
                                            {selectedDept.headDoctorId.firstName} {selectedDept.headDoctorId.lastName}
                                        </span>
                                    </div>
                                )}
                                <div className="detail-row">
                                    <span className="detail-label">Shifokorlar:</span>
                                    <span className="detail-value">{selectedDept.doctorCount || 0} ta</span>
                                </div>
                                {(selectedDept.floor || selectedDept.building) && (
                                    <div className="detail-row">
                                        <span className="detail-label">Joylashuv:</span>
                                        <span className="detail-value">
                                            {selectedDept.floor} {selectedDept.floor && selectedDept.building && "/"} {selectedDept.building}
                                        </span>
                                    </div>
                                )}
                                {selectedDept.phone && (
                                    <div className="detail-row">
                                        <span className="detail-label">Telefon:</span>
                                        <span className="detail-value">{selectedDept.phone}</span>
                                    </div>
                                )}
                                {selectedDept.email && (
                                    <div className="detail-row">
                                        <span className="detail-label">Email:</span>
                                        <span className="detail-value">{selectedDept.email}</span>
                                    </div>
                                )}
                                <div className="detail-row">
                                    <span className="detail-label">Holat:</span>
                                    <span className={`status-badge ${selectedDept.isActive ? 'active' : 'inactive'}`}>
                                        {selectedDept.isActive ? '✓ Faol' : '✖ Nofaol'}
                                    </span>
                                </div>
                                {selectedDept.note && (
                                    <div className="detail-row">
                                        <span className="detail-label">Izoh:</span>
                                        <span className="detail-value">{selectedDept.note}</span>
                                    </div>
                                )}
                                <div className="detail-row">
                                    <span className="detail-label">Yaratilgan:</span>
                                    <span className="detail-value">{fmtDT(selectedDept.createdAt)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setSelectedDept(null)}>
                                Yopish
                            </button>
                            <button className="btn-primary" onClick={() => {
                                setSelectedDept(null);
                                openEdit(selectedDept);
                            }}>
                                ✏️ Tahrirlash
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
