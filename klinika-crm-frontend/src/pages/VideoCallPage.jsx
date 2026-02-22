// Video Qabul sahifasi — Jitsi Meet embed
// URL: /video-call/:appointmentId
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, Phone, Copy, ExternalLink, CheckCircle, Loader } from 'lucide-react';
import http from '../lib/http';

export default function VideoCallPage() {
    const { appointmentId } = useParams();
    const navigate = useNavigate();

    const [meetingData, setMeetingData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [callActive, setCallActive] = useState(false);
    const jitsiRef = useRef(null);

    useEffect(() => {
        getMeetingRoom();
    }, [appointmentId]);

    // Jitsi Meet ni yuklash
    useEffect(() => {
        if (!callActive || !meetingData?.roomName) return;

        // Oldingi instansiyani tozalash
        if (jitsiRef.current) {
            try { jitsiRef.current.dispose(); } catch (_) { }
        }

        const domain = 'meet.jit.si';
        const options = {
            roomName: meetingData.roomName,
            parentNode: document.getElementById('jitsi-container'),
            width: '100%',
            height: '100%',
            configOverwrite: {
                startWithAudioMuted: false,
                startWithVideoMuted: false,
                disableDeepLinking: true,
                enableWelcomePage: false,
                prejoinPageEnabled: false,
                toolbarButtons: [
                    'microphone', 'camera', 'closedcaptions', 'desktop',
                    'fullscreen', 'fodeviceselection', 'hangup', 'chat',
                    'recording', 'livestreaming', 'etherpad',
                    'sharedvideo', 'settings', 'raisehand', 'videoquality',
                    'filmstrip', 'participants-pane', 'tileview',
                ],
            },
            interfaceConfigOverwrite: {
                DEFAULT_BACKGROUND: '#1e293b',
                TOOLBAR_ALWAYS_VISIBLE: true,
                SHOW_JITSI_WATERMARK: false,
                SHOW_WATERMARK_FOR_GUESTS: false,
                SHOW_BRAND_WATERMARK: false,
                APP_NAME: 'Klinika Video Qabul',
                NATIVE_APP_NAME: 'Klinika CRM',
                LANG_DETECTION: false,
            },
            userInfo: {
                displayName: 'Shifokor',
            },
        };

        // Jitsi API ni dinamik yuklash
        if (!window.JitsiMeetExternalAPI) {
            const script = document.createElement('script');
            script.src = `https://${domain}/external_api.js`;
            script.onload = () => {
                jitsiRef.current = new window.JitsiMeetExternalAPI(domain, options);
            };
            document.head.appendChild(script);
        } else {
            jitsiRef.current = new window.JitsiMeetExternalAPI(domain, options);
        }

        return () => {
            if (jitsiRef.current) {
                try { jitsiRef.current.dispose(); } catch (_) { }
            }
        };
    }, [callActive, meetingData]);

    const getMeetingRoom = async () => {
        try {
            setLoading(true);
            const data = await http.post(`/appointments/${appointmentId}/meeting`);
            setMeetingData(data);
        } catch (err) {
            console.error('Meeting room error:', err);
        } finally {
            setLoading(false);
        }
    };

    const copyLink = () => {
        if (!meetingData?.meetingLink) return;
        navigator.clipboard.writeText(meetingData.meetingLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
    };

    const openExternal = () => {
        if (meetingData?.meetingLink) {
            window.open(meetingData.meetingLink, '_blank');
        }
    };

    if (loading) {
        return (
            <div style={styles.loading}>
                <Loader size={40} style={{ animation: 'spin 1s linear infinite', color: '#6366f1' }} />
                <p style={{ color: '#64748b', marginTop: 16 }}>Video xona tayyorlanmoqda...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            {/* Sarlavha */}
            {!callActive && (
                <div style={styles.setupCard}>
                    <div style={styles.iconWrap}>
                        <Video size={48} color="#6366f1" />
                    </div>

                    <h1 style={styles.title}>Video Qabul</h1>
                    <p style={styles.subtitle}>
                        Bemor bilan videomurojaatni boshlash uchun "Boshlash" tugmasini bosing
                    </p>

                    {meetingData && (
                        <>
                            {/* Havola nusxalash */}
                            <div style={styles.linkBox}>
                                <span style={styles.linkText} title={meetingData.meetingLink}>
                                    {meetingData.meetingLink}
                                </span>
                                <button onClick={copyLink} style={styles.copyBtn} title="Nusxa olish">
                                    {copied ? <CheckCircle size={18} color="#10b981" /> : <Copy size={18} />}
                                </button>
                            </div>

                            {copied && (
                                <div style={styles.copiedMsg}>✅ Havola nusxa olindi! Bemorga yuboring.</div>
                            )}

                            {/* Amallar */}
                            <div style={styles.actions}>
                                <button onClick={() => setCallActive(true)} style={styles.startBtn}>
                                    <Video size={20} />
                                    Qo'ng'iroqni boshlash
                                </button>

                                <button onClick={openExternal} style={styles.externalBtn}>
                                    <ExternalLink size={18} />
                                    Yangi oynada ochish
                                </button>

                                <button onClick={copyLink} style={styles.shareBtn}>
                                    <Copy size={18} />
                                    Bemorga havola yuborish
                                </button>
                            </div>

                            {/* Ko'rsatmalar */}
                            <div style={styles.instructions}>
                                <div style={styles.instrTitle}>📋 Ko'rsatmalar</div>
                                <div style={styles.instrItem}>1. "Nusxa olish" tugmasini bosing</div>
                                <div style={styles.instrItem}>2. Havolani bemorga Telegram yoki SMS orqali yuboring</div>
                                <div style={styles.instrItem}>3. "Qo'ng'iroqni boshlash" tugmasini bosing</div>
                                <div style={styles.instrItem}>4. Bemor havolani bosib qo'ng'iroqqa kiradi</div>
                            </div>
                        </>
                    )}

                    <button onClick={() => navigate(-1)} style={styles.backBtn}>
                        ← Orqaga
                    </button>
                </div>
            )}

            {/* Jitsi Meet aktiv bo'lganda */}
            {callActive && (
                <div style={styles.callWrapper}>
                    <div style={styles.callHeader}>
                        <div style={styles.callTitle}>🎥 Video Qabul — Jonli</div>
                        <div style={styles.callActions}>
                            <button onClick={copyLink} style={styles.callCopyBtn}>
                                {copied ? '✅ Nusxa olindi' : '📋 Havola nusxalash'}
                            </button>
                            <button onClick={() => setCallActive(false)} style={styles.endCallBtn}>
                                <Phone size={16} style={{ transform: 'rotate(135deg)' }} />
                                Chiqish
                            </button>
                        </div>
                    </div>
                    <div id="jitsi-container" style={styles.jitsiContainer} />
                </div>
            )}
        </div>
    );
}

const styles = {
    page: {
        minHeight: '100vh',
        background: '#0f172a',
        fontFamily: "'Inter', system-ui, sans-serif",
        display: 'flex',
        flexDirection: 'column',
    },
    loading: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0f172a',
    },
    setupCard: {
        maxWidth: 520,
        margin: '40px auto',
        padding: 32,
        background: 'rgba(255,255,255,0.04)',
        borderRadius: 24,
        border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
    },
    iconWrap: {
        width: 96,
        height: 96,
        background: 'rgba(99,102,241,0.1)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid rgba(99,102,241,0.3)',
    },
    title: {
        fontSize: 28,
        fontWeight: 800,
        color: '#fff',
        margin: 0,
    },
    subtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
        margin: 0,
        lineHeight: 1.6,
    },
    linkBox: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: '12px 16px',
        width: '100%',
    },
    linkText: {
        flex: 1,
        fontSize: 13,
        color: '#818cf8',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    copyBtn: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 4,
        color: 'rgba(255,255,255,0.5)',
        flexShrink: 0,
    },
    copiedMsg: {
        fontSize: 13,
        color: '#10b981',
        fontWeight: 600,
    },
    actions: {
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        width: '100%',
    },
    startBtn: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '14px 24px',
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        border: 'none',
        borderRadius: 14,
        color: '#fff',
        fontSize: 16,
        fontWeight: 700,
        cursor: 'pointer',
    },
    externalBtn: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '12px 24px',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 14,
        color: '#cbd5e1',
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer',
    },
    shareBtn: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '12px 24px',
        background: 'rgba(16,185,129,0.1)',
        border: '1px solid rgba(16,185,129,0.3)',
        borderRadius: 14,
        color: '#34d399',
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer',
    },
    instructions: {
        background: 'rgba(99,102,241,0.05)',
        border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: 16,
        padding: 20,
        width: '100%',
    },
    instrTitle: {
        fontWeight: 700,
        color: '#818cf8',
        marginBottom: 12,
        fontSize: 14,
    },
    instrItem: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.6)',
        marginBottom: 8,
        lineHeight: 1.5,
    },
    backBtn: {
        background: 'none',
        border: 'none',
        color: 'rgba(255,255,255,0.4)',
        cursor: 'pointer',
        fontSize: 14,
        padding: '8px 0',
    },
    // Call active mode
    callWrapper: {
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
    },
    callHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 20px',
        background: '#1e293b',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        flexShrink: 0,
    },
    callTitle: {
        color: '#fff',
        fontWeight: 700,
        fontSize: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
    },
    callActions: {
        display: 'flex',
        gap: 8,
    },
    callCopyBtn: {
        padding: '8px 16px',
        background: 'rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: 8,
        color: '#fff',
        fontSize: 13,
        cursor: 'pointer',
    },
    endCallBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 16px',
        background: '#ef4444',
        border: 'none',
        borderRadius: 8,
        color: '#fff',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
    },
    jitsiContainer: {
        flex: 1,
        width: '100%',
        background: '#000',
    },
};
