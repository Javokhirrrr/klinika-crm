import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './QueueDisplay.css';

const API_BASE = 'https://klinika-crm-eng-yangi-production.up.railway.app';

// ─── orgId olish: URL → localStorage → form ───────────────────────────────────
function getOrgId() {
    const params = new URLSearchParams(window.location.search);
    const urlOrgId = params.get('orgId');
    if (urlOrgId) return urlOrgId;

    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user?.orgId) return user.orgId;

        const org = JSON.parse(localStorage.getItem('org') || '{}');
        if (org?.id) return org.id;

        const direct = localStorage.getItem('orgId');
        if (direct) return direct;
    } catch { }

    return null;
}

const QueueDisplay = () => {
    const [departments, setDepartments] = useState([]);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [error, setError] = useState(null);
    const [alert, setAlert] = useState(null);
    const [orgIdInput, setOrgIdInput] = useState('');
    const [orgId, setOrgId] = useState(getOrgId);
    const audioRef = useRef(null);
    const lastCalledRef = useRef(new Set());

    // Saat
    useEffect(() => {
        const t = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const fetchQueueData = async (id) => {
        const oid = id || orgId;
        if (!oid) return;
        try {
            const res = await axios.get(`${API_BASE}/api/queue/public/display?orgId=${oid}`, { timeout: 8000 });
            const { departments: newDepts, lastUpdated: lu } = res.data;

            // Yangi chaqirilgan bemorlarni aniqlash
            (newDepts || []).forEach(dept => {
                if (dept.currentPatient) {
                    const key = `${dept.doctorId}-${dept.currentPatient.queueNumber}`;
                    if (!lastCalledRef.current.has(key)) {
                        if (audioRef.current) {
                            audioRef.current.currentTime = 0;
                            audioRef.current.play().catch(() => { });
                        }
                        setAlert({
                            doctorName: dept.doctorName,
                            queueNumber: dept.currentPatient.queueNumber,
                            initials: dept.currentPatient.initials,
                        });
                        lastCalledRef.current.add(key);
                        setTimeout(() => setAlert(null), 10000);

                        // Ovozli xabar
                        if (window.speechSynthesis) {
                            window.speechSynthesis.cancel();
                            const u = new SpeechSynthesisUtterance(
                                `${dept.currentPatient.queueNumber}-raqamli bemor, ${dept.doctorName} xonasiga kirsin`
                            );
                            u.lang = 'uz-UZ'; u.rate = 0.9;
                            window.speechSynthesis.speak(u);
                        }
                    }
                }
            });

            setDepartments(newDepts || []);
            setLastUpdated(lu);
            setError(null);
        } catch (e) {
            console.error('Display fetch error:', e);
            const msg = e?.response?.data?.message || e.message || 'Serverga ulanib bo\'lmadi';
            setError(msg);
        }
    };

    useEffect(() => {
        if (!orgId) return;
        fetchQueueData(orgId);
        const iv = setInterval(() => fetchQueueData(orgId), 5000);
        return () => clearInterval(iv);
    }, [orgId]);

    const handleOrgIdSubmit = (e) => {
        e.preventDefault();
        if (orgIdInput.trim()) {
            const id = orgIdInput.trim();
            setOrgId(id);
            // URL yangilash
            const url = new URL(window.location);
            url.searchParams.set('orgId', id);
            window.history.replaceState({}, '', url);
        }
    };

    const formatTime = (d) => d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const getDeptColor = (spec) => {
        const m = {
            'Terapevt': '#4CAF50', 'Kardiolog': '#2196F3', 'Nevrolog': '#9C27B0',
            'Pediatr': '#FF9800', 'Oftalmolog': '#00BCD4', 'Lor': '#E91E63',
            'Dermatolog': '#795548', 'Ginekolog': '#F06292', 'Urolog': '#3F51B5', 'Endokrinolog': '#009688',
        };
        return m[spec] || '#607D8B';
    };

    // ─── OrgId kiritish formasi ───────────────────────────────────────────────
    if (!orgId) {
        return (
            <div style={{
                minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                fontFamily: "'Inter',system-ui,sans-serif",
            }}>
                <div style={{
                    background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.2)', borderRadius: 24,
                    padding: '40px 36px', width: 400, color: '#fff', textAlign: 'center',
                }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📺</div>
                    <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Tablo Ekrani</h2>
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 24 }}>
                        Navbat tizimini ko'rish uchun Organization ID kiriting
                    </p>
                    <form onSubmit={handleOrgIdSubmit}>
                        <input
                            value={orgIdInput}
                            onChange={e => setOrgIdInput(e.target.value)}
                            placeholder="Organization ID..."
                            style={{
                                width: '100%', padding: '12px 16px', borderRadius: 12,
                                border: '2px solid rgba(255,255,255,0.3)',
                                background: 'rgba(255,255,255,0.15)', color: '#fff',
                                fontSize: 15, outline: 'none', fontFamily: 'inherit',
                                boxSizing: 'border-box', marginBottom: 12,
                            }}
                        />
                        <button type="submit" style={{
                            width: '100%', padding: '12px', borderRadius: 12,
                            border: 'none', background: '#fff', color: '#6366f1',
                            fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit',
                        }}>
                            ▶ Boshlash
                        </button>
                    </form>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 16 }}>
                        Yoki /queue-display?orgId=ID shaklida URL ga kiriting
                    </p>
                </div>
            </div>
        );
    }

    // ─── Asosiy display ────────────────────────────────────────────────────────
    return (
        <div className="queue-display">
            <audio ref={audioRef} src="/sounds/notification.mp3" preload="auto" />

            {/* Header */}
            <div className="display-header">
                <h1>🏥 KLINIKA NAVBAT TIZIMI</h1>
                <div className="header-info">
                    <div className="current-time">{formatTime(currentTime)}</div>
                    <div className="last-updated">
                        {error
                            ? <span style={{ color: '#fca5a5' }}>⚠️ {error}</span>
                            : `Yangilangan: ${lastUpdated ? new Date(lastUpdated).toLocaleTimeString('uz-UZ') : '—'}`
                        }
                    </div>
                </div>
            </div>

            {/* Alert Banner */}
            {alert && (
                <div className="alert-banner">
                    <div className="alert-title">🔔 SIZNING NAVBATINGIZ!</div>
                    <div className="alert-number">№{alert.queueNumber} — {alert.initials}</div>
                    <div className="alert-doctor">{alert.doctorName} xonasiga kiring</div>
                </div>
            )}

            {/* Departments Grid */}
            <div className="departments-grid">
                {departments.length === 0 && !error ? (
                    <div className="empty-state">
                        <div className="empty-icon">📋</div>
                        <div className="empty-text">Hozirda navbat yo'q</div>
                        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>
                            Navbat tizimidan bemor qo'shilganda bu yerda ko'rinadi
                        </div>
                    </div>
                ) : (
                    departments.map((dept, i) => (
                        <div key={i} className="department-card" style={{ borderTop: `6px solid ${getDeptColor(dept.specialization)}` }}>
                            <div className="department-header" style={{ background: getDeptColor(dept.specialization) }}>
                                <h2>{dept.specialization || dept.doctorName}</h2>
                                <div className="doctor-name">Dr. {dept.doctorName}</div>
                            </div>
                            <div className="department-body">
                                {dept.currentPatient ? (
                                    <div className="current-patient">
                                        <div className="patient-label">🟢 Hozir qabulda:</div>
                                        <div className="patient-info">
                                            <div className="patient-number">№{dept.currentPatient.queueNumber}</div>
                                            <div className="patient-initials">{dept.currentPatient.initials}</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="no-current">Hozir: —</div>
                                )}
                                <div className="waiting-section">
                                    <div className="waiting-label">
                                        Navbatda: ({dept.waitingQueue?.length || 0})
                                    </div>
                                    <div className="waiting-list">
                                        {dept.waitingQueue && dept.waitingQueue.length > 0 ? (
                                            dept.waitingQueue.slice(0, 5).map((p, idx) => (
                                                <div key={idx} className={`waiting-item ${idx === 0 ? 'next-patient' : ''}`}>
                                                    <span className="waiting-number">№{p.queueNumber}</span>
                                                    <span className="waiting-initials">{p.initials}</span>
                                                    {idx === 0 && <span className="next-badge">Keyingi</span>}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="no-waiting">Navbat bo'sh</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}

                {/* Agar xatolik bo'lsa, lekin ma'lumot bor − ko'rsatamiz */}
                {error && departments.length === 0 && (
                    <div style={{
                        width: '100%', textAlign: 'center', padding: '60px 20px',
                        color: 'rgba(255,255,255,0.6)',
                    }}>
                        <div style={{ fontSize: 64, marginBottom: 16 }}>📡</div>
                        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Serverga ulanilmoqda...</div>
                        <div style={{ fontSize: 14 }}>5 soniyada qayta urinadi</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QueueDisplay;
