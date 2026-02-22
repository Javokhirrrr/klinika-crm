import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import http from '../lib/http';
import { io } from 'socket.io-client';

// ─── Priority config ───────────────────────────────────────────────────────────
const PRIORITY = {
    emergency: { label: 'Favqulodda', color: '#ef4444', bg: '#fef2f2', score: 3, icon: '🚨' },
    urgent: { label: 'Shoshilinch', color: '#f59e0b', bg: '#fffbeb', score: 2, icon: '⚡' },
    normal: { label: 'Oddiy', color: '#10b981', bg: '#f0fdf4', score: 1, icon: '🟢' },
};

const STATUS = {
    waiting: { label: 'Kutmoqda', color: '#6366f1', bg: '#eef2ff' },
    called: { label: 'Chaqirildi', color: '#f59e0b', bg: '#fffbeb' },
    in_service: { label: 'Xizmatda', color: '#10b981', bg: '#f0fdf4' },
    completed: { label: 'Tugadi', color: '#64748b', bg: '#f1f5f9' },
    cancelled: { label: 'Bekor', color: '#ef4444', bg: '#fef2f2' },
};

// ─── Smart sort: emergency > urgent > normal, keyin joinedAt ──────────────────
function smartSort(entries) {
    return [...entries].sort((a, b) => {
        const scoreA = PRIORITY[a.priority]?.score ?? 1;
        const scoreB = PRIORITY[b.priority]?.score ?? 1;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return new Date(a.joinedAt) - new Date(b.joinedAt);
    });
}

// ─── Web Speech: ovozli chaqirish ─────────────────────────────────────────────
function speak(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'uz-UZ';
    utt.rate = 0.9;
    window.speechSynthesis.speak(utt);
}

// ─── BACKEND URL ───────────────────────────────────────────────────────────────
const API_URL = import.meta.env.VITE_API_URL || 'https://klinika-crm-production.up.railway.app';

export default function Queue() {
    const navigate = useNavigate();
    const [queue, setQueue] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [qrData, setQrData] = useState(null);
    const [voiceOn, setVoiceOn] = useState(true);
    const [notify, setNotify] = useState(null);
    const [form, setForm] = useState({ patientId: '', doctorId: '', priority: 'normal', notes: '' });
    const socketRef = useRef(null);

    // ─── Data load ─────────────────────────────────────────────────────────────
    const loadQueue = useCallback(async () => {
        try {
            const res = await http.get('/queue/current');
            const raw = res?.queue || res?.data?.queue || res || [];
            const arr = Array.isArray(raw) ? raw : [];
            setQueue(smartSort(arr));
        } catch (e) { console.error('Queue load err:', e); }
    }, []);

    const loadStats = useCallback(async () => {
        try {
            const res = await http.get('/queue/stats');
            setStats(res?.stats || res?.data?.stats || null);
        } catch { /* ignore */ }
    }, []);

    // ─── Socket.io real-time ───────────────────────────────────────────────────
    useEffect(() => {
        loadQueue().then(() => setLoading(false));
        loadStats();

        // Socket ulanish
        const orgId = (() => {
            try { return JSON.parse(localStorage.getItem('user') || '{}').orgId || ''; } catch { return ''; }
        })();

        if (orgId) {
            const socket = io(API_URL, {
                transports: ['websocket', 'polling'],
                auth: { token: localStorage.getItem('token') || '' },
            });
            socketRef.current = socket;
            socket.emit('join:org', orgId);

            socket.on('queue:updated', () => { loadQueue(); loadStats(); });
            socket.on('queue:new-patient', () => { loadQueue(); loadStats(); });
            socket.on('queue:status-changed', () => { loadQueue(); loadStats(); });
            socket.on('queue:patient-called', (data) => {
                loadQueue();
                if (voiceOn && data?.patientName) {
                    speak(`${data.queueNumber}-raqamli bemor, ${data.doctorName} xonasiga kirsin`);
                }
            });
        }

        const fallback = setInterval(() => { loadQueue(); loadStats(); }, 15000);
        return () => {
            clearInterval(fallback);
            socketRef.current?.disconnect();
        };
    }, []);

    const toast = (msg, type = 'success') => {
        setNotify({ msg, type });
        setTimeout(() => setNotify(null), 4000);
    };

    // ─── Actions ───────────────────────────────────────────────────────────────
    const callPatient = async (id, entry) => {
        try {
            await http.post(`/queue/${id}/call`);
            toast('Bemor chaqirildi!');
            if (voiceOn) {
                const name = `${entry?.patientId?.firstName || 'Bemor'} ${entry?.patientId?.lastName || ''}`;
                const doc = entry?.doctorId?.firstName ? `${entry.doctorId.firstName} shifokor xonasiga` : 'shifokor xonasiga';
                speak(`${entry.queueNumber}-raqamli ${name}, ${doc} kirsin`);
            }
            loadQueue();
        } catch (e) { toast(e?.response?.data?.message || 'Xatolik', 'error'); }
    };

    const startService = async (id) => {
        try { await http.post(`/queue/${id}/start`); toast('Xizmat boshlandi'); loadQueue(); }
        catch (e) { toast(e?.response?.data?.message || 'Xatolik', 'error'); }
    };

    const completeService = async (id) => {
        try { await http.post(`/queue/${id}/complete`); toast('Xizmat yakunlandi ✅'); loadQueue(); loadStats(); }
        catch (e) { toast(e?.response?.data?.message || 'Xatolik', 'error'); }
    };

    const cancelEntry = async (id) => {
        if (!confirm('Bemorni navbatdan chiqarishni tasdiqlaysizmi?')) return;
        try { await http.post(`/queue/${id}/cancel`); toast('Bemorni navbatdan chiqarildi'); loadQueue(); }
        catch (e) { toast(e?.response?.data?.message || 'Xatolik', 'error'); }
    };

    const addToQueue = async () => {
        if (!form.patientId) { toast('Bemor tanlang!', 'error'); return; }
        try {
            await http.post('/queue/join', form);
            toast('Bemor navbatga qo\'shildi ✅');
            setShowAdd(false);
            setForm({ patientId: '', doctorId: '', priority: 'normal', notes: '' });
            loadQueue(); loadStats();
        } catch (e) { toast(e?.response?.data?.message || 'Xatolik', 'error'); }
    };

    // ─── Kiosk QR ──────────────────────────────────────────────────────────────
    const openKioskQR = async () => {
        try {
            const orgId = (() => {
                try { return JSON.parse(localStorage.getItem('user') || '{}').orgId || ''; } catch { return ''; }
            })();
            const res = await http.get(`/queue/kiosk-qr?orgId=${orgId}`);
            setQrData(res);
            setShowQR(true);
        } catch {
            // Fallback — QR URL ni yasash
            const orgId = (() => {
                try { return JSON.parse(localStorage.getItem('user') || '{}').orgId || ''; } catch { return ''; }
            })();
            const kioskUrl = `${window.location.origin}/kiosk?orgId=${orgId}`;
            setQrData({ url: kioskUrl, qrImage: null });
            setShowQR(true);
        }
    };

    const openDisplay = () => {
        const orgId = (() => {
            try { return JSON.parse(localStorage.getItem('user') || '{}').orgId || ''; } catch { return ''; }
        })();
        window.open(`/queue-display?orgId=${orgId}`, '_blank', 'fullscreen=yes');
    };

    const loadPatientsAndDoctors = async () => {
        const [pRes, dRes] = await Promise.all([
            http.get('/patients', { params: { limit: 300 } }),
            http.get('/doctors', { params: { limit: 200 } }),
        ]);
        setPatients(pRes?.items || pRes?.patients || []);
        setDoctors(dRes?.doctors || dRes?.items || []);
    };

    // ─── Computed ───────────────────────────────────────────────────────────────
    const waiting = queue.filter(q => q.status === 'waiting');
    const active = queue.filter(q => ['called', 'in_service'].includes(q.status));

    // ─── Render ─────────────────────────────────────────────────────────────────
    const s = {
        page: { padding: 24, maxWidth: 1200, margin: '0 auto', fontFamily: "'Inter',system-ui,sans-serif" },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
        title: { fontSize: 28, fontWeight: 800, color: '#0f172a', margin: 0 },
        sub: { color: '#64748b', margin: '4px 0 0' },
        btnRow: { display: 'flex', gap: 10, flexWrap: 'wrap' },
        btn: (color) => ({
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 18px', borderRadius: 12, border: 'none',
            background: color, color: '#fff', fontWeight: 700, fontSize: 13,
            cursor: 'pointer', fontFamily: 'inherit',
        }),
        btnGhost: {
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 18px', borderRadius: 12,
            border: '1.5px solid #e2e8f0', background: '#fff',
            color: '#475569', fontWeight: 700, fontSize: 13,
            cursor: 'pointer', fontFamily: 'inherit',
        },
        statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12, marginBottom: 24 },
        statCard: {
            background: '#fff', borderRadius: 16, padding: '16px 20px',
            border: '1px solid #e2e8f0', textAlign: 'center',
        },
        section: { marginBottom: 28 },
        secTitle: { fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 },
        grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 12 },
        card: (priority) => ({
            background: '#fff', borderRadius: 16, padding: 18,
            border: `1px solid #e2e8f0`,
            borderLeft: `4px solid ${PRIORITY[priority]?.color || '#6366f1'}`,
            display: 'flex', flexDirection: 'column', gap: 10,
        }),
        badge: (cfg) => ({
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
            color: cfg.color, background: cfg.bg,
        }),
        actRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
        actBtn: (color) => ({
            padding: '7px 14px', borderRadius: 10, border: 'none',
            background: color, color: '#fff', fontWeight: 700, fontSize: 12,
            cursor: 'pointer', fontFamily: 'inherit',
        }),
        overlay: {
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        },
        modal: {
            background: '#fff', borderRadius: 24, width: '100%',
            maxWidth: 480, maxHeight: '90vh', overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
        },
        modalHead: {
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '18px 24px', borderBottom: '1px solid #f1f5f9',
        },
        field: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 },
        label: { fontSize: 13, fontWeight: 600, color: '#374151' },
        input: {
            padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 10,
            fontSize: 14, outline: 'none', fontFamily: 'inherit', color: '#1e293b',
        },
        select: {
            padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 10,
            fontSize: 14, outline: 'none', fontFamily: 'inherit', background: '#fff', color: '#1e293b',
        },
    };

    return (
        <div style={s.page}>
            {/* Notification */}
            {notify && (
                <div style={{
                    position: 'fixed', top: 16, right: 16, zIndex: 9999,
                    padding: '12px 20px', borderRadius: 14,
                    background: notify.type === 'error' ? '#fef2f2' : '#f0fdf4',
                    color: notify.type === 'error' ? '#dc2626' : '#15803d',
                    border: `1px solid ${notify.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
                    fontWeight: 600, fontSize: 14, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    animation: 'fadeIn 0.2s ease',
                }}>
                    {notify.type === 'error' ? '❌' : '✅'} {notify.msg}
                </div>
            )}

            {/* Header */}
            <div style={s.header}>
                <div>
                    <h1 style={s.title}>📋 Navbat Tizimi</h1>
                    <p style={s.sub}>Real-time navbat boshqaruvi · Smart Priority</p>
                </div>
                <div style={s.btnRow}>
                    {/* Voice toggle */}
                    <button style={s.btnGhost} onClick={() => setVoiceOn(v => !v)} title="Ovozli xabar">
                        {voiceOn ? '🔊' : '🔇'} Ovoz {voiceOn ? 'Yoq' : 'O\'ch'}
                    </button>
                    {/* Kiosk QR */}
                    <button style={s.btnGhost} onClick={openKioskQR}>
                        📱 Kiosk QR
                    </button>
                    {/* Tablo */}
                    <button style={{ ...s.btn('#2563eb') }} onClick={openDisplay}>
                        📺 Tablo Ekrani
                    </button>
                    {/* Navbatga qo'shish */}
                    <button style={{ ...s.btn('linear-gradient(135deg,#6366f1,#8b5cf6)') }}
                        onClick={() => { setShowAdd(true); loadPatientsAndDoctors(); }}>
                        ➕ Navbatga qo'shish
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div style={s.statsRow}>
                {[
                    { icon: '⏳', label: 'Kutmoqda', val: waiting.length, color: '#6366f1' },
                    { icon: '🔴', label: 'Xizmatda', val: active.length, color: '#f59e0b' },
                    { icon: '✅', label: "Bugun xizmat ko'rsatildi", val: stats?.servedToday ?? 0, color: '#10b981' },
                    { icon: '⏱️', label: "O'rtacha kutish", val: `${stats?.avgWaitTime ?? 0} daq`, color: '#8b5cf6' },
                    {
                        icon: '🚨', label: 'Favqulodda', color: '#ef4444',
                        val: waiting.filter(q => q.priority === 'emergency').length
                    },
                ].map((s2, i) => (
                    <div key={i} style={{ ...s.statCard, borderTop: `3px solid ${s2.color}` }}>
                        <div style={{ fontSize: 28, marginBottom: 4 }}>{s2.icon}</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: s2.color }}>{s2.val}</div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, lineHeight: 1.4 }}>{s2.label}</div>
                    </div>
                ))}
            </div>

            {/* Active (called / in_service) */}
            {active.length > 0 && (
                <div style={s.section}>
                    <div style={s.secTitle}>
                        🔴 Faol xizmat
                        <span style={{ background: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                            {active.length}
                        </span>
                    </div>
                    <div style={s.grid}>
                        {active.map(entry => <QueueCard key={entry._id} entry={entry} onStart={startService} onComplete={completeService} onCancel={cancelEntry} />)}
                    </div>
                </div>
            )}

            {/* Waiting — Smart sorted */}
            <div style={s.section}>
                <div style={s.secTitle}>
                    ⏳ Navbat kutayotganlar
                    <span style={{ background: '#6366f1', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                        {waiting.length}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 400, color: '#94a3b8', marginLeft: 4 }}>
                        (Smart Priority tartibda)
                    </span>
                </div>
                {waiting.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
                        <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                        <div style={{ fontSize: 16, fontWeight: 600 }}>Navbatda hech kim yo'q</div>
                    </div>
                ) : (
                    <div style={s.grid}>
                        {waiting.map((entry, idx) => (
                            <QueueCard
                                key={entry._id} entry={entry} position={idx + 1}
                                onCall={callPatient} onCancel={cancelEntry}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ─── Modal: Navbatga qo'shish ─── */}
            {showAdd && (
                <div style={s.overlay} onClick={() => setShowAdd(false)}>
                    <div style={s.modal} onClick={e => e.stopPropagation()}>
                        <div style={s.modalHead}>
                            <div style={{ fontSize: 18, fontWeight: 800 }}>➕ Navbatga qo'shish</div>
                            <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>×</button>
                        </div>
                        <div style={{ padding: 24, overflowY: 'auto' }}>
                            {/* Bemor */}
                            <div style={s.field}>
                                <label style={s.label}>👤 Bemor *</label>
                                <select style={s.select} value={form.patientId}
                                    onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))}>
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
                                <label style={s.label}>👨‍⚕️ Shifokor</label>
                                <select style={s.select} value={form.doctorId}
                                    onChange={e => setForm(f => ({ ...f, doctorId: e.target.value }))}>
                                    <option value="">— Shifokorni tanlang —</option>
                                    {doctors.map(d => (
                                        <option key={d._id} value={d._id}>
                                            Dr. {d.firstName} {d.lastName} · {d.spec || ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {/* Priority */}
                            <div style={s.field}>
                                <label style={s.label}>⚡ Muhimlik darajasi</label>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    {Object.entries(PRIORITY).map(([key, cfg]) => (
                                        <button key={key}
                                            onClick={() => setForm(f => ({ ...f, priority: key }))}
                                            style={{
                                                flex: 1, padding: '10px 6px', borderRadius: 10,
                                                border: form.priority === key ? `2px solid ${cfg.color}` : '2px solid #e2e8f0',
                                                background: form.priority === key ? cfg.bg : '#fff',
                                                color: cfg.color, fontWeight: 700, fontSize: 12,
                                                cursor: 'pointer', fontFamily: 'inherit',
                                            }}>
                                            {cfg.icon} {cfg.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {/* Izoh */}
                            <div style={s.field}>
                                <label style={s.label}>📝 Izoh</label>
                                <textarea style={{ ...s.input, minHeight: 64, resize: 'vertical' }}
                                    placeholder="Qo'shimcha ma'lumot..."
                                    value={form.notes}
                                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                            </div>
                        </div>
                        <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10 }}>
                            <button onClick={() => setShowAdd(false)}
                                style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                                Bekor
                            </button>
                            <button onClick={addToQueue}
                                style={{ flex: 2, padding: '12px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', fontSize: 15 }}>
                                ✅ Navbatga qo'shish
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Kiosk QR Modal ─── */}
            {showQR && qrData && (
                <div style={s.overlay} onClick={() => setShowQR(false)}>
                    <div style={{ ...s.modal, maxWidth: 400, padding: 32, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>📱</div>
                        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Kiosk QR Kodi</div>
                        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 24, lineHeight: 1.6 }}>
                            Bemor telefoni bilan quyidagi QR kodni skanerlaydi va<br />
                            navbatga o'zi yoziladi
                        </div>
                        {qrData.qrImage && (
                            <img src={qrData.qrImage} alt="QR" style={{ width: 200, height: 200, margin: '0 auto 16px', display: 'block', borderRadius: 12 }} />
                        )}
                        <div style={{
                            background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10,
                            padding: '10px 16px', fontSize: 12, color: '#6366f1',
                            fontFamily: 'monospace', wordBreak: 'break-all', marginBottom: 20,
                        }}>
                            {qrData.url}
                        </div>
                        <button
                            onClick={() => { navigator.clipboard.writeText(qrData.url); toast('Link nusxalandi!'); }}
                            style={{ ...s.btn('linear-gradient(135deg,#6366f1,#8b5cf6)'), width: '100%', justifyContent: 'center', marginBottom: 8 }}>
                            📋 Linkni nusxalash
                        </button>
                        <button onClick={() => setShowQR(false)} style={{ ...s.btnGhost, width: '100%', justifyContent: 'center' }}>
                            Yopish
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
                @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
            `}</style>
        </div>
    );
}

// ─── Queue Card Component ──────────────────────────────────────────────────────
function QueueCard({ entry, position, onCall, onStart, onComplete, onCancel }) {
    const pri = PRIORITY[entry.priority] || PRIORITY.normal;
    const sts = STATUS[entry.status] || STATUS.waiting;
    const patient = entry.patientId || {};
    const doctor = entry.doctorId || {};

    const waitMins = entry.joinedAt
        ? Math.floor((Date.now() - new Date(entry.joinedAt)) / 60000)
        : 0;

    const isEmerge = entry.priority === 'emergency';

    return (
        <div style={{
            background: '#fff', borderRadius: 16, padding: 18,
            border: '1px solid #e2e8f0',
            borderLeft: `4px solid ${pri.color}`,
            display: 'flex', flexDirection: 'column', gap: 10,
            animation: isEmerge ? 'pulse 1.5s ease infinite' : 'none',
            boxShadow: isEmerge ? '0 0 0 2px rgba(239,68,68,0.2)' : 'none',
        }}>
            {/* Top row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* Queue number */}
                    <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: pri.bg, color: pri.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 900, fontSize: 16, flexShrink: 0,
                    }}>
                        {entry.queueNumber || '?'}
                    </div>
                    {position && (
                        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
                            #{position} navbat
                        </div>
                    )}
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {/* Priority badge */}
                    <span style={{
                        padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                        color: pri.color, background: pri.bg,
                    }}>
                        {pri.icon} {pri.label}
                    </span>
                    {/* Status badge */}
                    <span style={{
                        padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                        color: sts.color, background: sts.bg,
                    }}>
                        {sts.label}
                    </span>
                </div>
            </div>

            {/* Patient */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: '#dbeafe', color: '#2563eb',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 15,
                }}>
                    {(patient.firstName?.[0] || '?').toUpperCase()}
                </div>
                <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>
                        {patient.firstName} {patient.lastName}
                    </div>
                    {patient.phone && (
                        <div style={{ fontSize: 12, color: '#64748b' }}>📞 {patient.phone}</div>
                    )}
                </div>
                <div style={{ marginLeft: 'auto', fontSize: 12, color: '#94a3b8' }}>
                    ⏱️ {waitMins} daq
                </div>
            </div>

            {/* Doctor */}
            {doctor.firstName && (
                <div style={{ fontSize: 12, color: '#64748b', display: 'flex', gap: 6 }}>
                    <span>👨‍⚕️ Dr. {doctor.firstName} {doctor.lastName}</span>
                    {doctor.room && <span>· 🚪 {doctor.room}-xona</span>}
                </div>
            )}

            {/* Notes */}
            {entry.notes && (
                <div style={{ fontSize: 11, color: '#94a3b8', background: '#f8fafc', borderRadius: 8, padding: '6px 10px' }}>
                    📝 {entry.notes}
                </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                {entry.status === 'waiting' && onCall && (
                    <button onClick={() => onCall(entry._id, entry)}
                        style={{
                            flex: 2, padding: '9px', borderRadius: 10, border: 'none',
                            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                            color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                        }}>
                        📢 Chaqirish
                    </button>
                )}
                {entry.status === 'called' && onStart && (
                    <button onClick={() => onStart(entry._id)}
                        style={{
                            flex: 2, padding: '9px', borderRadius: 10, border: 'none',
                            background: 'linear-gradient(135deg,#10b981,#059669)',
                            color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                        }}>
                        ▶ Boshlash
                    </button>
                )}
                {entry.status === 'in_service' && onComplete && (
                    <button onClick={() => onComplete(entry._id)}
                        style={{
                            flex: 2, padding: '9px', borderRadius: 10, border: 'none',
                            background: 'linear-gradient(135deg,#10b981,#059669)',
                            color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                        }}>
                        ✅ Yakunlash
                    </button>
                )}
                {onCancel && (
                    <button onClick={() => onCancel(entry._id)}
                        style={{
                            flex: 1, padding: '9px', borderRadius: 10,
                            border: '1.5px solid #fecaca', background: '#fff',
                            color: '#ef4444', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                        }}>
                        ✕
                    </button>
                )}
            </div>
        </div>
    );
}
