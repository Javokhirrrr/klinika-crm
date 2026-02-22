// Video Qabul sahifasi — Google Meet
// URL: /video-call/:appointmentId
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, Copy, ExternalLink, CheckCircle, Loader, ArrowLeft } from 'lucide-react';
import http from '../lib/http';

export default function VideoCallPage() {
    const { appointmentId } = useParams();
    const navigate = useNavigate();

    const [meetingData, setMeetingData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        getMeetingRoom();
    }, [appointmentId]);

    const getMeetingRoom = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await http.post(`/appointments/${appointmentId}/meeting`);
            setMeetingData(data);
        } catch (err) {
            console.error('Meeting room error:', err);
            setError(err?.response?.data?.message || 'Video xona yaratishda xatolik');
        } finally {
            setLoading(false);
        }
    };

    const copyLink = async () => {
        if (!meetingData?.meetingLink) return;
        try {
            await navigator.clipboard.writeText(meetingData.meetingLink);
        } catch {
            const el = document.createElement('textarea');
            el.value = meetingData.meetingLink;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
    };

    const openGoogleMeet = () => {
        if (meetingData?.meetingLink) {
            window.open(meetingData.meetingLink, '_blank');
        }
    };

    if (loading) {
        return (
            <div style={s.center}>
                <div style={s.spinner} />
                <p style={{ color: '#64748b', marginTop: 16 }}>Google Meet xonasi tayyorlanmoqda...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (error) {
        return (
            <div style={s.center}>
                <div style={{ fontSize: 48 }}>❌</div>
                <p style={{ color: '#ef4444', marginTop: 16, fontWeight: 600 }}>{error}</p>
                <button style={s.backBtn} onClick={() => navigate(-1)}>← Orqaga</button>
            </div>
        );
    }

    return (
        <div style={s.page}>
            <div style={s.card}>

                {/* Google Meet logo + header */}
                <div style={s.header}>
                    <div style={s.logoRow}>
                        {/* Google Meet colors */}
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                            <rect width="48" height="48" rx="12" fill="#00897B" />
                            <path d="M28 20h-8a2 2 0 00-2 2v4a2 2 0 002 2h8l4-4-4-4z" fill="white" />
                            <rect x="16" y="20" width="12" height="8" rx="1" fill="white" opacity="0.9" />
                        </svg>
                        <div>
                            <h1 style={s.title}>Google Meet</h1>
                            <p style={s.subtitle}>Video Qabul tayyor</p>
                        </div>
                    </div>
                </div>

                {/* Meeting link */}
                <div style={s.linkSection}>
                    <div style={s.linkLabel}>🔗 Video xona havolasi</div>
                    <div style={s.linkBox}>
                        <span style={s.linkText}>{meetingData?.meetingLink}</span>
                        <button onClick={copyLink} style={s.iconBtn} title="Nusxa olish">
                            {copied
                                ? <CheckCircle size={18} color="#10b981" />
                                : <Copy size={18} color="#94a3b8" />
                            }
                        </button>
                    </div>
                    {copied && (
                        <div style={s.copiedMsg}>✅ Havola nusxa olindi!</div>
                    )}
                </div>

                {/* Asosiy tugma */}
                <button onClick={openGoogleMeet} style={s.mainBtn}>
                    <svg width="22" height="22" viewBox="0 0 48 48" fill="none">
                        <path d="M28 20h-8a2 2 0 00-2 2v4a2 2 0 002 2h8l4-4-4-4z" fill="white" />
                        <rect x="16" y="20" width="12" height="8" rx="1" fill="white" opacity="0.9" />
                    </svg>
                    Google Meet ni ochish
                    <ExternalLink size={16} />
                </button>

                {/* Kichik tugmalar */}
                <div style={s.row}>
                    <button onClick={copyLink} style={s.outlineBtn}>
                        <Copy size={16} />
                        {copied ? 'Nusxalandi!' : 'Havolani nusxalash'}
                    </button>
                </div>

                {/* Ko'rsatmalar */}
                <div style={s.guide}>
                    <div style={s.guideTitle}>📋 Qanday ishlaydi?</div>
                    <div style={s.guideGrid}>
                        {[
                            { n: '1', t: 'Havolani nusxalang', d: '"Nusxalash" tugmasini bosing' },
                            { n: '2', t: 'Bemorga yuboring', d: 'Telegram yoki SMS orqali havola yuboring' },
                            { n: '3', t: 'Meetni oching', d: '"Google Meet ni ochish" tugmasini bosing' },
                            { n: '4', t: 'Bemor kiradi', d: 'Bemor havolani bosib qo\'shiladi' },
                        ].map(item => (
                            <div key={item.n} style={s.guideStep}>
                                <div style={s.guideNum}>{item.n}</div>
                                <div>
                                    <div style={s.guideT}>{item.t}</div>
                                    <div style={s.guideD}>{item.d}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Orqaga */}
                <button onClick={() => navigate(-1)} style={s.backBtn}>
                    <ArrowLeft size={16} /> Orqaga
                </button>
            </div>
        </div>
    );
}

const s = {
    page: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        fontFamily: "'Inter', system-ui, sans-serif",
    },
    center: {
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: '#0f172a',
    },
    spinner: {
        width: 48, height: 48,
        border: '4px solid #1e293b',
        borderTopColor: '#00897B',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
    },
    card: {
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 24,
        padding: '36px 32px',
        width: '100%',
        maxWidth: 520,
        display: 'flex', flexDirection: 'column', gap: 20,
    },
    header: { display: 'flex', justifyContent: 'center' },
    logoRow: {
        display: 'flex', alignItems: 'center', gap: 16,
    },
    title: { margin: 0, fontSize: 26, fontWeight: 800, color: '#fff' },
    subtitle: { margin: '4px 0 0', fontSize: 14, color: '#64748b' },
    linkSection: { display: 'flex', flexDirection: 'column', gap: 8 },
    linkLabel: { fontSize: 13, fontWeight: 600, color: '#64748b' },
    linkBox: {
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12, padding: '12px 16px',
    },
    linkText: {
        flex: 1, fontSize: 13, color: '#00BCD4',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    },
    iconBtn: {
        background: 'none', border: 'none',
        cursor: 'pointer', padding: 4, flexShrink: 0,
    },
    copiedMsg: { fontSize: 12, color: '#10b981', fontWeight: 600, textAlign: 'center' },
    mainBtn: {
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        padding: '16px 24px',
        background: 'linear-gradient(135deg, #00897B, #00695C)',
        border: 'none', borderRadius: 16,
        color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer',
        boxShadow: '0 4px 24px rgba(0,137,123,0.4)',
    },
    row: { display: 'flex', gap: 10 },
    outlineBtn: {
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: '12px 16px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12, color: '#94a3b8', fontSize: 14, cursor: 'pointer',
    },
    guide: {
        background: 'rgba(0,137,123,0.06)',
        border: '1px solid rgba(0,137,123,0.2)',
        borderRadius: 16, padding: 20,
    },
    guideTitle: { fontWeight: 700, color: '#00BCD4', marginBottom: 16, fontSize: 14 },
    guideGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
    guideStep: { display: 'flex', gap: 10, alignItems: 'flex-start' },
    guideNum: {
        width: 28, height: 28, borderRadius: '50%',
        background: '#00897B', color: '#fff',
        fontWeight: 800, fontSize: 13,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    guideT: { fontWeight: 700, fontSize: 12, color: '#e2e8f0' },
    guideD: { fontSize: 11, color: '#64748b', marginTop: 2, lineHeight: 1.5 },
    backBtn: {
        display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center',
        background: 'none', border: 'none',
        color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
        fontSize: 14, padding: '4px 0',
    },
};
