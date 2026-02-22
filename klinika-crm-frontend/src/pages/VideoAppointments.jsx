// Video Qabullar sahifasi — to'liq qayta yozilgan
// Sahifaning o'zida yaratish modali bor
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Plus, Calendar, Clock, Search, X, User, ChevronDown } from 'lucide-react';
import http from '../lib/http';

const STATUS_CONFIG = {
    scheduled: { l: 'Rejalashtirilgan', c: '#6366f1', bg: '#eef2ff' },
    waiting: { l: 'Kutmoqda', c: '#f59e0b', bg: '#fef3c7' },
    in_progress: { l: 'Jarayonda', c: '#10b981', bg: '#d1fae5' },
    done: { l: 'Tugallangan', c: '#64748b', bg: '#f1f5f9' },
    cancelled: { l: 'Bekor qilingan', c: '#ef4444', bg: '#fef2f2' },
};

export default function VideoAppointments() {
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        patientId: '', doctorId: '', serviceIds: [],
        date: new Date().toISOString().split('T')[0],
        time: '10:00', notes: '', price: 0,
    });

    const [notify, setNotify] = useState(null);

    // Sahifaga qaytganda refresh (orqaga bosganda data yo'qolmaslik uchun)
    useEffect(() => {
        loadData();
        const onFocus = () => loadData();
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, []);


    const loadData = async () => {
        setLoading(true);
        try {
            const [apptRes, patRes, docRes, svcRes] = await Promise.all([
                http.get('/appointments', { limit: 300 }),
                http.get('/patients', { limit: 300 }),
                http.get('/doctors', { limit: 200 }),
                http.get('/services', { limit: 200 }),
            ]);
            // Faqat telemedicine
            const all = apptRes.items || apptRes || [];
            setAppointments(all.filter(a => a.appointmentType === 'telemedicine'));
            setPatients(patRes.patients || patRes.items || patRes || []);
            setDoctors(docRes.doctors || docRes.items || docRes || []);
            setServices(svcRes.services || svcRes.items || svcRes || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const openModal = () => {
        setForm({
            patientId: '', doctorId: '', serviceIds: [],
            date: new Date().toISOString().split('T')[0],
            time: '10:00', notes: '', price: 0,
        });
        setShowModal(true);
    };

    const handleCreate = async () => {
        if (!form.patientId) return alert('Bemor tanlang!');
        setSaving(true);
        try {
            await http.post('/appointments', {
                ...form,
                appointmentType: 'telemedicine',
                scheduledAt: `${form.date}T${form.time}:00`,
                startsAt: `${form.date}T${form.time}:00`,
            });
            setShowModal(false);
            loadData();
        } catch (e) {
            alert(e?.response?.data?.message || 'Xatolik yuz berdi');
        } finally { setSaving(false); }
    };

    const showNotify = (type, msg) => {
        setNotify({ type, msg });
        setTimeout(() => setNotify(null), 5000);
    };

    const startCall = async (apt) => {
        const link = apt.meetingLink;
        if (link) {
            // Link bor — to'g'ri oching va Telegram xabar yuborish
            window.open(link, '_blank');
            try {
                await http.post(`/appointments/${apt._id}/meeting`);
                showNotify('success', 'Google Meet ochildi. Bemor Telegram ga link yuborildi!');
            } catch {
                showNotify('info', 'Google Meet ochildi (Telegram yuborilmadi).');
            }
        } else {
            // Link yo'q — backend dan yaratib olish
            try {
                const data = await http.post(`/appointments/${apt._id}/meeting`);
                const url = data?.meetingLink;
                if (url) {
                    window.open(url, '_blank');
                    showNotify('success', 'Google Meet yaratildi va bemorga Telegram orqali yuborildi!');
                    loadData();
                } else {
                    showNotify('error', 'Google Meet URL yaratishda xatolik');
                }
            } catch (e) {
                showNotify('error', e?.response?.data?.message || 'Xatolik yuz berdi');
            }
        }
    };

    const filtered = appointments.filter(a => {
        if (!search) return true;
        const pat = a.patient || a.patientId || {};
        return `${pat.firstName || ''} ${pat.lastName || ''}`.toLowerCase().includes(search.toLowerCase());
    });

    const upcoming = filtered.filter(a => ['scheduled', 'waiting', 'in_progress'].includes(a.status));
    const past = filtered.filter(a => ['done', 'cancelled'].includes(a.status));

    const selectedService = services.find(s => form.serviceIds[0] === s._id);

    return (
        <div style={s.page}>

            {/* ─── Header ───────────────────────────────────── */}
            <div style={s.header}>
                <div>
                    <h1 style={s.title}>🎥 Video Qabul</h1>
                    <p style={s.subtitle}>Google Meet orqali onlayn konsultatsiya</p>
                </div>
                <button style={s.addBtn} onClick={openModal}>
                    <Plus size={18} /> Yangi Video Qabul
                </button>
            </div>

            {/* ─── Notification ─────────────────────────────── */}
            {notify && (
                <div style={{
                    padding: '12px 18px', borderRadius: 12, marginBottom: 16,
                    fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10,
                    background: notify.type === 'success' ? '#f0fdf4' : notify.type === 'error' ? '#fef2f2' : '#eff6ff',
                    color: notify.type === 'success' ? '#15803d' : notify.type === 'error' ? '#dc2626' : '#1d4ed8',
                    border: `1px solid ${notify.type === 'success' ? '#bbf7d0' : notify.type === 'error' ? '#fecaca' : '#bfdbfe'}`,
                    animation: 'fadeIn 0.2s ease',
                }}>
                    {notify.type === 'success' ? '✅' : notify.type === 'error' ? '❌' : 'ℹ️'}
                    {notify.msg}
                </div>
            )}

            {/* ─── Search ───────────────────────────────────── */}
            <div style={s.searchRow}>
                <Search size={16} color="#94a3b8" />
                <input
                    type="text"
                    placeholder="Bemor ismi bo'yicha..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={s.searchInput}
                />
                <span style={s.countBadge}>{filtered.length} ta</span>
            </div>

            {/* ─── Content ──────────────────────────────────── */}
            {loading ? (
                <div style={s.center}>
                    <div style={s.spinner} />
                    <p style={{ color: '#94a3b8', marginTop: 12 }}>Yuklanmoqda...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div style={s.emptyCard}>
                    <span style={{ fontSize: 56 }}>🎥</span>
                    <h3 style={s.emptyTitle}>Video qabul hali yo'q</h3>
                    <p style={s.emptyText}>
                        Yuqoridagi <strong>"+ Yangi Video Qabul"</strong> tugmasini bosing
                    </p>
                    <button style={s.addBtn} onClick={openModal}>
                        <Plus size={18} /> Yangi Video Qabul yaratish
                    </button>
                </div>
            ) : (
                <>
                    {upcoming.length > 0 && (
                        <div style={s.section}>
                            <div style={s.sectionHead}>
                                📅 Kelgusi qabullar
                                <span style={s.secCount}>{upcoming.length}</span>
                            </div>
                            <div style={s.grid}>
                                {upcoming.map(a => (
                                    <AptCard key={a._id} apt={a} onStart={startCall} />
                                ))}
                            </div>
                        </div>
                    )}
                    {past.length > 0 && (
                        <div style={s.section}>
                            <div style={s.sectionHead}>
                                ✅ O'tgan qabullar
                                <span style={s.secCount}>{past.length}</span>
                            </div>
                            <div style={s.grid}>
                                {past.map(a => (
                                    <AptCard key={a._id} apt={a} onStart={startCall} isPast />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ─── Qanday ishlaydi ──────────────────────────── */}
            <div style={s.howBox}>
                <div style={s.howTitle}>📋 Qanday ishlaydi?</div>
                <div style={s.howGrid}>
                    {[
                        { n: '1', t: 'Yangi qabul', d: '"+ Yangi Video Qabul" tugmasini bosing' },
                        { n: '2', t: 'Bemor tanlang', d: 'Bemor, shifokor va vaqtni belgilang' },
                        { n: '3', t: 'Link yuboring', d: 'Video xona yaratib, bemorga havola yuboring' },
                        { n: '4', t: 'Qo\'ng\'iroq', d: '"Video Boshlash" tugmasini bosing' },
                    ].map(item => (
                        <div key={item.n} style={s.howStep}>
                            <div style={s.howNum}>{item.n}</div>
                            <div>
                                <div style={s.howStepT}>{item.t}</div>
                                <div style={s.howStepD}>{item.d}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ─── Modal: Yangi Video Qabul ─────────────────── */}
            {showModal && (
                <div style={s.overlay} onClick={() => setShowModal(false)}>
                    <div style={s.modal} onClick={e => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div style={s.modalHead}>
                            <div style={s.modalTitle}>🎥 Yangi Video Qabul</div>
                            <button onClick={() => setShowModal(false)} style={s.closeBtn}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Form */}
                        <div style={s.formBody}>
                            {/* Bemor */}
                            <div style={s.field}>
                                <label style={s.label}>Bemor *</label>
                                <select
                                    style={s.select}
                                    value={form.patientId}
                                    onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))}
                                >
                                    <option value="">— Bemorni tanlang —</option>
                                    {patients.map(p => (
                                        <option key={p._id} value={p._id}>
                                            {p.firstName} {p.lastName} · {p.phone || ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Shifokor */}
                            <div style={s.field}>
                                <label style={s.label}>Shifokor</label>
                                <select
                                    style={s.select}
                                    value={form.doctorId}
                                    onChange={e => setForm(f => ({ ...f, doctorId: e.target.value }))}
                                >
                                    <option value="">— Shifokorni tanlang —</option>
                                    {doctors.map(d => (
                                        <option key={d._id} value={d._id}>
                                            Dr. {d.firstName} {d.lastName} · {d.spec || ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Xizmat */}
                            <div style={s.field}>
                                <label style={s.label}>Xizmat (ixtiyoriy)</label>
                                <select
                                    style={s.select}
                                    value={form.serviceIds[0] || ''}
                                    onChange={e => {
                                        const svc = services.find(sv => sv._id === e.target.value);
                                        setForm(f => ({
                                            ...f,
                                            serviceIds: e.target.value ? [e.target.value] : [],
                                            price: svc?.price || f.price,
                                        }));
                                    }}
                                >
                                    <option value="">— Xizmatni tanlang —</option>
                                    {services.map(sv => (
                                        <option key={sv._id} value={sv._id}>
                                            {sv.name} · {sv.price?.toLocaleString()} so'm
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Sana + Vaqt */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div style={s.field}>
                                    <label style={s.label}>Sana *</label>
                                    <input
                                        type="date"
                                        style={s.input}
                                        value={form.date}
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                                    />
                                </div>
                                <div style={s.field}>
                                    <label style={s.label}>Vaqt *</label>
                                    <input
                                        type="time"
                                        style={s.input}
                                        value={form.time}
                                        onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                                    />
                                </div>
                            </div>

                            {/* Narx */}
                            <div style={s.field}>
                                <label style={s.label}>Narx (so'm)</label>
                                <input
                                    type="number"
                                    style={s.input}
                                    value={form.price}
                                    placeholder="0"
                                    onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                                />
                            </div>

                            {/* Izoh */}
                            <div style={s.field}>
                                <label style={s.label}>Izoh</label>
                                <textarea
                                    style={{ ...s.input, resize: 'vertical', minHeight: 70 }}
                                    value={form.notes}
                                    placeholder="Qo'shimcha ma'lumot..."
                                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                />
                            </div>

                            {/* Info banner */}
                            <div style={s.infoBanner}>
                                <Video size={16} color="#6366f1" />
                                <span>Saqlangandan so'ng "Video Boshlash" tugmasi paydo bo'ladi. Havola avtomatik generatsiya qilinadi.</span>
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={s.modalFoot}>
                            <button style={s.cancelBtn} onClick={() => setShowModal(false)}>
                                Bekor qilish
                            </button>
                            <button
                                style={{ ...s.saveBtn, opacity: saving ? 0.7 : 1 }}
                                onClick={handleCreate}
                                disabled={saving}
                            >
                                {saving ? '⏳ Saqlanmoqda...' : '🎥 Video Qabul Yaratish'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
            `}</style>
        </div>
    );
}

// ─── Appointment Card ─────────────────────────────────────────────────────────
function AptCard({ apt, onStart, isPast }) {
    const patient = apt.patient || apt.patientId || {};
    const doctor = apt.doctor || apt.doctorId || {};
    const st = STATUS_CONFIG[apt.status] || STATUS_CONFIG.scheduled;
    const timeStr = apt.startAt
        ? new Date(apt.startAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
        : apt.time || '—';

    return (
        <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 20,
            border: '1px solid #e2e8f0',
            borderLeft: `4px solid ${st.c}`,
            display: 'flex', flexDirection: 'column', gap: 12,
            opacity: isPast ? 0.8 : 1,
        }}>
            {/* Top row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ ...c.badge, color: st.c, background: st.bg }}>{st.l}</span>
                <span style={c.time}>
                    <Calendar size={12} /> {apt.date || '—'} &nbsp;
                    <Clock size={12} /> {timeStr}
                </span>
            </div>

            {/* Bemor */}
            <div style={c.row}>
                <div style={{ ...c.ava, background: '#eef2ff', color: '#6366f1' }}>
                    {(patient.firstName || 'B')[0]?.toUpperCase()}
                </div>
                <div>
                    <div style={c.name}>{patient.firstName} {patient.lastName}</div>
                    <div style={c.sub}>{patient.phone || 'Bemor'}</div>
                </div>
            </div>

            {/* Shifokor */}
            {(doctor.firstName || doctor.lastName) && (
                <div style={c.row}>
                    <div style={{ ...c.ava, background: '#f0fdf4', color: '#16a34a' }}>
                        {(doctor.firstName || 'S')[0]?.toUpperCase()}
                    </div>
                    <div>
                        <div style={c.name}>Dr. {doctor.firstName} {doctor.lastName}</div>
                        <div style={c.sub}>{doctor.spec || 'Shifokor'}</div>
                    </div>
                </div>
            )}

            {/* Mavjud link */}
            {apt.meetingLink && (
                <div style={c.linkBox} title={apt.meetingLink}>
                    🔗 {apt.meetingLink}
                </div>
            )}

            {/* Tugma */}
            <button
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '11px 16px',
                    background: isPast
                        ? 'linear-gradient(135deg,#64748b,#475569)'
                        : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                    border: 'none', borderRadius: 12,
                    color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                }}
                onClick={() => onStart(apt)}
            >
                <Video size={18} />
                {isPast ? 'Qayta ulanish' : 'Video Boshlash'}
            </button>
        </div>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
    page: { padding: 24, maxWidth: 1100, fontFamily: "'Inter',system-ui,sans-serif" },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
    title: { fontSize: 28, fontWeight: 800, color: '#0f172a', margin: 0 },
    subtitle: { color: '#64748b', margin: '4px 0 0', fontSize: 15 },
    addBtn: {
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '11px 22px',
        background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
        border: 'none', borderRadius: 12,
        color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
    },
    searchRow: {
        display: 'flex', alignItems: 'center', gap: 10,
        background: '#fff', border: '1px solid #e2e8f0',
        borderRadius: 12, padding: '10px 16px', marginBottom: 24,
    },
    searchInput: { border: 'none', outline: 'none', flex: 1, fontSize: 14, background: 'transparent' },
    countBadge: { background: '#f1f5f9', color: '#64748b', fontWeight: 700, fontSize: 12, padding: '3px 10px', borderRadius: 20 },
    center: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 80 },
    spinner: { width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' },
    emptyCard: {
        background: '#fff', borderRadius: 20, padding: '48px 32px',
        border: '1px dashed #cbd5e1',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        marginBottom: 24, textAlign: 'center',
    },
    emptyTitle: { fontSize: 18, fontWeight: 700, color: '#1e293b', margin: 0 },
    emptyText: { color: '#64748b', margin: 0, lineHeight: 1.6 },
    section: { marginBottom: 28 },
    sectionHead: { display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: 16, color: '#1e293b', marginBottom: 16 },
    secCount: { background: '#6366f1', color: '#fff', fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 20 },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 },
    howBox: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 20, padding: 24, marginTop: 16 },
    howTitle: { fontWeight: 700, fontSize: 16, color: '#1e293b', marginBottom: 16 },
    howGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16 },
    howStep: { display: 'flex', gap: 12, alignItems: 'flex-start' },
    howNum: { width: 32, height: 32, borderRadius: '50%', background: '#6366f1', color: '#fff', fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    howStepT: { fontWeight: 700, fontSize: 13, color: '#1e293b' },
    howStepD: { fontSize: 12, color: '#64748b', marginTop: 2, lineHeight: 1.5 },
    // Modal
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
    modal: { background: '#fff', borderRadius: 24, width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.2s ease' },
    modalHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f1f5f9' },
    modalTitle: { fontSize: 20, fontWeight: 800, color: '#0f172a' },
    closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 },
    formBody: { padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 },
    field: { display: 'flex', flexDirection: 'column', gap: 6 },
    label: { fontSize: 13, fontWeight: 600, color: '#374151' },
    input: { padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', color: '#1e293b', fontFamily: 'inherit' },
    select: { padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', color: '#1e293b', fontFamily: 'inherit', background: '#fff' },
    infoBanner: { display: 'flex', alignItems: 'flex-start', gap: 10, background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#4338ca', lineHeight: 1.5 },
    modalFoot: { display: 'flex', gap: 12, padding: '16px 24px', borderTop: '1px solid #f1f5f9' },
    cancelBtn: { flex: 1, padding: '12px', background: '#f1f5f9', border: 'none', borderRadius: 12, color: '#64748b', fontWeight: 700, fontSize: 14, cursor: 'pointer' },
    saveBtn: { flex: 2, padding: '12px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' },
};

const c = {
    badge: { padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700 },
    time: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#94a3b8' },
    row: { display: 'flex', alignItems: 'center', gap: 10 },
    ava: { width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, flexShrink: 0 },
    name: { fontWeight: 700, fontSize: 14, color: '#1e293b' },
    sub: { fontSize: 12, color: '#94a3b8' },
    linkBox: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 12px', fontSize: 11, color: '#6366f1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
};
