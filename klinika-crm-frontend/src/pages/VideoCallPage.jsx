// VideoCallPage.jsx — appointment meetingLink ni olib Google Meet ga redirect qiladi
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import http from '../lib/http';

export default function VideoCallPage() {
    const { appointmentId } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading'); // loading | redirecting | error
    const [link, setLink] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!appointmentId) { setStatus('error'); setError('Appointment ID topilmadi'); return; }
        start();
    }, [appointmentId]);

    const start = async () => {
        try {
            setStatus('loading');
            // Avval appointment dan meetingLink olishga urinamiz
            const apt = await http.get(`/appointments/${appointmentId}`);
            const existing = apt?.appointment?.meetingLink || apt?.meetingLink;

            let meetUrl = existing;

            if (!meetUrl) {
                // Yo'q bo'lsa — yaratish
                const data = await http.post(`/appointments/${appointmentId}/meeting`);
                meetUrl = data?.meetingLink;
            }

            if (!meetUrl) {
                setStatus('error');
                setError('Google Meet URL yaratishda xatolik yuz berdi');
                return;
            }

            setLink(meetUrl);
            setStatus('redirecting');

            // Darhol yangi tabda ochish
            window.open(meetUrl, '_blank');

            // 2 soniyadan keyin orqaga qaytish
            setTimeout(() => navigate(-1), 2000);

        } catch (e) {
            console.error('VideoCallPage error:', e);
            setStatus('error');
            setError(e?.response?.data?.message || 'Xatolik yuz berdi');
        }
    };

    // ─── UI ───────────────────────────────────
    const s = {
        page: {
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            fontFamily: "'Inter', system-ui, sans-serif",
        },
        card: {
            background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 24, padding: '48px 40px', width: 420, maxWidth: '90vw',
            textAlign: 'center', color: '#fff',
        },
    };

    if (status === 'loading') return (
        <div style={s.page}>
            <div style={s.card}>
                <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#818cf8',
                    animation: 'spin 0.8s linear infinite', margin: '0 auto 20px',
                }} />
                <div style={{ fontSize: 18, fontWeight: 700 }}>Google Meet tayyorlanmoqda...</div>
                <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 8 }}>
                    Bir soniya kuting
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        </div>
    );

    if (status === 'redirecting') return (
        <div style={s.page}>
            <div style={s.card}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎥</div>
                <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
                    Google Meet ochildi!
                </div>
                <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 24, lineHeight: 1.6 }}>
                    Yangi tabda Google Meet ochildi.<br />
                    Agar ochilmagan bo'lsa — quyidagi tugmani bosing.
                </div>

                <a
                    href={link} target="_blank" rel="noreferrer"
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '12px 28px', borderRadius: 12,
                        background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                        color: '#fff', fontWeight: 700, fontSize: 15,
                        textDecoration: 'none', marginBottom: 16,
                    }}
                >
                    🔗 Google Meet ga o'tish
                </a>

                <div style={{ fontSize: 11, color: '#475569', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {link}
                </div>

                <button
                    onClick={() => navigate(-1)}
                    style={{
                        display: 'block', width: '100%', marginTop: 20,
                        padding: '10px', background: 'none',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: 10, color: '#94a3b8',
                        cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
                    }}
                >
                    ← Orqaga
                </button>
            </div>
        </div>
    );

    // Error
    return (
        <div style={s.page}>
            <div style={s.card}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Xatolik</div>
                <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 24 }}>{error}</div>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        padding: '10px 28px', borderRadius: 10,
                        border: 'none', background: 'rgba(255,255,255,0.1)',
                        color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
                    }}
                >
                    ← Orqaga
                </button>
            </div>
        </div>
    );
}
