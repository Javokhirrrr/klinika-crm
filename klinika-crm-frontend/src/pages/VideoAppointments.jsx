// Video Qabullar sahifasi
// Barcha telemedicine qabullar — video boshlanishi uchun
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Plus, PhoneCall, Calendar, Clock, User, Search } from 'lucide-react';
import http from '../lib/http';
import { useAuth } from '../context/AuthContext';

const STATUS_LABEL = {
    scheduled: { l: 'Rejalashtirilgan', c: '#6366f1', bg: '#eef2ff' },
    waiting: { l: 'Kutmoqda', c: '#f59e0b', bg: '#fef3c7' },
    in_progress: { l: 'Jarayonda', c: '#10b981', bg: '#d1fae5' },
    done: { l: 'Tugallangan', c: '#64748b', bg: '#f1f5f9' },
    cancelled: { l: 'Bekor qilingan', c: '#ef4444', bg: '#fef2f2' },
};

export default function VideoAppointments() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Barcha telemedicine qabullarni olish
            const res = await http.get('/appointments', { limit: 200 });
            const items = (res.items || res || []).filter(a =>
                a.appointmentType === 'telemedicine' && a.status !== 'cancelled'
            );
            setAppointments(items);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const startVideoCall = async (apt) => {
        navigate(`/video-call/${apt._id}`);
    };

    const filtered = appointments.filter(a => {
        if (!search) return true;
        const q = search.toLowerCase();
        const pat = a.patient || a.patientId || {};
        const name = `${pat.firstName || ''} ${pat.lastName || ''}`.toLowerCase();
        return name.includes(q);
    });

    const upcoming = filtered.filter(a => a.status === 'scheduled' || a.status === 'waiting');
    const past = filtered.filter(a => a.status === 'done' || a.status === 'in_progress');

    return (
        <div style={styles.page}>
            {/* Header */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>🎥 Video Qabul</h1>
                    <p style={styles.subtitle}>Onlayn konsultatsiyalar — Jitsi Meet orqali</p>
                </div>
                <button
                    onClick={() => navigate('/appointments')}
                    style={styles.newBtn}
                    title="Yangi video qabul yaratish uchun Qabullar sahifasiga o'ting"
                >
                    <Plus size={18} />
                    Yangi Video Qabul
                </button>
            </div>

            {/* Qidirish */}
            <div style={styles.searchBox}>
                <Search size={16} style={{ color: '#94a3b8' }} />
                <input
                    type="text"
                    placeholder="Bemor ismi bo'yicha qidiring..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={styles.searchInput}
                />
            </div>

            {loading ? (
                <div style={styles.empty}>
                    <div style={styles.spinner} />
                    <p style={{ color: '#94a3b8', marginTop: 12 }}>Yuklanmoqda...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div style={styles.emptyCard}>
                    <div style={{ fontSize: 64 }}>🎥</div>
                    <h3 style={{ color: '#1e293b', fontWeight: 700, margin: '12px 0 8px' }}>
                        Video qabul yo'q
                    </h3>
                    <p style={{ color: '#64748b', marginBottom: 20, textAlign: 'center' }}>
                        Yangi qabul yaratib, <strong>"🎥 Video"</strong> turini tanlang
                    </p>
                    <button onClick={() => navigate('/appointments')} style={styles.newBtn}>
                        <Plus size={18} /> Qabullar sahifasiga o'tish
                    </button>
                </div>
            ) : (
                <div style={styles.content}>
                    {/* Kutayotgan/kelgusi */}
                    {upcoming.length > 0 && (
                        <div style={styles.section}>
                            <div style={styles.sectionTitle}>
                                <PhoneCall size={16} color="#6366f1" />
                                Kelgusi Video Qabullar ({upcoming.length})
                            </div>
                            <div style={styles.grid}>
                                {upcoming.map(apt => <AppointmentCard key={apt._id} apt={apt} onStart={startVideoCall} />)}
                            </div>
                        </div>
                    )}

                    {/* O'tgan */}
                    {past.length > 0 && (
                        <div style={styles.section}>
                            <div style={styles.sectionTitle}>
                                <Calendar size={16} color="#94a3b8" />
                                O'tgan Qabullar ({past.length})
                            </div>
                            <div style={styles.grid}>
                                {past.map(apt => <AppointmentCard key={apt._id} apt={apt} onStart={startVideoCall} isPast />)}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Qanday ishlaydi */}
            {!loading && (
                <div style={styles.howTo}>
                    <div style={styles.howToTitle}>📋 Qanday ishlaydi?</div>
                    <div style={styles.steps}>
                        {[
                            { n: '1', t: 'Qabullar sahifasida "Yangi Qabul"', d: 'Qabul turini 🎥 Video deb tanlang' },
                            { n: '2', t: 'Havola yarating', d: '"Video Boshlash" tugmasini bosing' },
                            { n: '3', t: 'Bemorga yuboring', d: 'Havolani Telegram yoki SMS orqali yuboring' },
                            { n: '4', t: 'Qo\'ng\'iroq qiling', d: 'Vaqt kelganda havolaga bosing' },
                        ].map(s => (
                            <div key={s.n} style={styles.step}>
                                <div style={styles.stepNum}>{s.n}</div>
                                <div>
                                    <div style={styles.stepTitle}>{s.t}</div>
                                    <div style={styles.stepDesc}>{s.d}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

function AppointmentCard({ apt, onStart, isPast }) {
    const patient = apt.patient || apt.patientId || {};
    const doctor = apt.doctor || apt.doctorId || {};
    const status = STATUS_LABEL[apt.status] || STATUS_LABEL.scheduled;

    const dateStr = apt.date || (apt.startAt ? new Date(apt.startAt).toLocaleDateString('uz-UZ') : '—');
    const timeStr = apt.startAt
        ? new Date(apt.startAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
        : apt.time || '—';

    return (
        <div style={{
            ...cardStyles.card,
            opacity: isPast ? 0.75 : 1,
            borderLeft: `4px solid ${status.c}`,
        }}>
            {/* Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <span style={{
                    ...cardStyles.badge,
                    color: status.c,
                    background: status.bg,
                }}>
                    {status.l}
                </span>
                <span style={cardStyles.timeTag}>
                    <Calendar size={12} /> {dateStr}  <Clock size={12} /> {timeStr}
                </span>
            </div>

            {/* Bemor */}
            <div style={cardStyles.personRow}>
                <div style={{ ...cardStyles.avatar, background: '#eef2ff', color: '#6366f1' }}>
                    {(patient.firstName || 'B')[0].toUpperCase()}
                </div>
                <div>
                    <div style={cardStyles.name}>
                        {patient.firstName} {patient.lastName}
                    </div>
                    <div style={cardStyles.sub}>Bemor</div>
                </div>
            </div>

            {/* Shifokor */}
            {(doctor.firstName || doctor.lastName) && (
                <div style={cardStyles.personRow}>
                    <div style={{ ...cardStyles.avatar, background: '#f0fdf4', color: '#16a34a' }}>
                        {(doctor.firstName || 'S')[0].toUpperCase()}
                    </div>
                    <div>
                        <div style={cardStyles.name}>
                            Dr. {doctor.firstName} {doctor.lastName}
                        </div>
                        <div style={cardStyles.sub}>{doctor.spec || 'Shifokor'}</div>
                    </div>
                </div>
            )}

            {/* Mavjud meeting link */}
            {apt.meetingLink && (
                <div style={cardStyles.linkBox}>
                    <span style={cardStyles.linkText}>{apt.meetingLink}</span>
                </div>
            )}

            {/* Video boshlash tugmasi */}
            <button
                onClick={() => onStart(apt)}
                style={{
                    ...cardStyles.startBtn,
                    background: isPast
                        ? 'linear-gradient(135deg, #64748b, #475569)'
                        : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                }}
            >
                <Video size={18} />
                {isPast ? 'Qayta ulanish' : 'Video Boshlash'}
            </button>
        </div>
    );
}

const styles = {
    page: {
        padding: '24px',
        maxWidth: 1100,
        fontFamily: "'Inter', system-ui, sans-serif",
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 800,
        color: '#0f172a',
        margin: 0,
    },
    subtitle: {
        color: '#64748b',
        margin: '4px 0 0',
        fontSize: 15,
    },
    newBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 20px',
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        border: 'none',
        borderRadius: 12,
        color: '#fff',
        fontSize: 14,
        fontWeight: 700,
        cursor: 'pointer',
    },
    searchBox: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: '10px 16px',
        marginBottom: 24,
    },
    searchInput: {
        border: 'none',
        outline: 'none',
        fontSize: 14,
        color: '#1e293b',
        flex: 1,
        background: 'transparent',
    },
    empty: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 80,
    },
    spinner: {
        width: 40,
        height: 40,
        border: '4px solid #e2e8f0',
        borderTopColor: '#6366f1',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
    },
    emptyCard: {
        background: '#fff',
        borderRadius: 20,
        padding: 48,
        textAlign: 'center',
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: 24,
    },
    content: {
        display: 'flex',
        flexDirection: 'column',
        gap: 32,
        marginBottom: 32,
    },
    section: {},
    sectionTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontWeight: 700,
        fontSize: 16,
        color: '#1e293b',
        marginBottom: 16,
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 16,
    },
    howTo: {
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 20,
        padding: 24,
    },
    howToTitle: {
        fontWeight: 700,
        fontSize: 16,
        color: '#1e293b',
        marginBottom: 16,
    },
    steps: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 16,
    },
    step: {
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
    },
    stepNum: {
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: '#6366f1',
        color: '#fff',
        fontWeight: 800,
        fontSize: 14,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    stepTitle: {
        fontWeight: 700,
        fontSize: 13,
        color: '#1e293b',
    },
    stepDesc: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
};

const cardStyles = {
    card: {
        background: '#fff',
        borderRadius: 16,
        padding: 20,
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        transition: 'box-shadow 0.2s',
    },
    badge: {
        padding: '4px 10px',
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 700,
    },
    timeTag: {
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 12,
        color: '#94a3b8',
    },
    personRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize: 16,
        flexShrink: 0,
    },
    name: {
        fontWeight: 700,
        fontSize: 14,
        color: '#1e293b',
    },
    sub: {
        fontSize: 12,
        color: '#94a3b8',
    },
    linkBox: {
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 11,
        color: '#6366f1',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    linkText: {},
    startBtn: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '12px',
        border: 'none',
        borderRadius: 12,
        color: '#fff',
        fontSize: 14,
        fontWeight: 700,
        cursor: 'pointer',
        marginTop: 4,
    },
};
