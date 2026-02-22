// Public sahifa — QR skanerlangandan keyin bemor ko'radi
// URL: /queue-status?id=xxx&org=yyy
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import http from '../lib/http';

const STATUS_CONFIG = {
    waiting: { emoji: '⏳', label: 'Kutmoqdasiz', color: '#f59e0b', bg: '#fef3c7', pulse: true },
    called: { emoji: '📢', label: 'Chaqirildi! Kiring!', color: '#10b981', bg: '#d1fae5', pulse: true },
    in_service: { emoji: '🩺', label: 'Qabul davom etmoqda', color: '#6366f1', bg: '#e0e7ff', pulse: false },
    completed: { emoji: '✅', label: 'Qabul yakunlandi', color: '#22c55e', bg: '#f0fdf4', pulse: false },
    cancelled: { emoji: '❌', label: 'Bekor qilindi', color: '#ef4444', bg: '#fef2f2', pulse: false },
    no_show: { emoji: '⚠️', label: 'Kelmadi', color: '#f97316', bg: '#fff7ed', pulse: false },
};

export default function QueueStatusPage() {
    const [params] = useSearchParams();
    const queueId = params.get('id');
    const orgId = params.get('org');

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [lastUpdated, setLastUpdated] = useState(null);

    const fetchStatus = async () => {
        if (!queueId) { setError('Noto\'g\'ri havola'); setLoading(false); return; }
        try {
            const res = await http.get(`/queue/public/status/${queueId}${orgId ? `?org=${orgId}` : ''}`);
            setData(res);
            setLastUpdated(new Date());
            setError('');
        } catch (e) {
            setError('Navbat topilmadi yoki muddati tugagan');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        // Har 15 soniyada yangilash
        const interval = setInterval(fetchStatus, 15000);
        return () => clearInterval(interval);
    }, [queueId]);

    const cfg = data ? (STATUS_CONFIG[data.status] || STATUS_CONFIG.waiting) : null;

    return (
        <div style={styles.page}>
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.logo}>🏥 Navbat Holati</div>
                {lastUpdated && (
                    <div style={styles.lastUpdated}>
                        Yangilandi: {lastUpdated.toLocaleTimeString('uz-UZ')}
                    </div>
                )}
            </div>

            <div style={styles.container}>
                {loading ? (
                    <div style={styles.center}>
                        <div style={styles.spinner} />
                        <p style={{ color: '#64748b', marginTop: 16 }}>Yuklanmoqda...</p>
                    </div>
                ) : error ? (
                    <div style={styles.errorCard}>
                        <div style={{ fontSize: 48, marginBottom: 12 }}>😔</div>
                        <h2 style={{ color: '#ef4444', marginBottom: 8 }}>{error}</h2>
                        <p style={{ color: '#64748b' }}>QR-kodni qayta skanerlang</p>
                    </div>
                ) : data ? (
                    <div style={styles.card}>
                        {/* Navbat raqami */}
                        <div style={{ ...styles.queueBadge, background: cfg.bg, borderColor: cfg.color }}>
                            <div style={styles.queueLabel}>Navbat raqamingiz</div>
                            <div style={{ ...styles.queueNumber, color: cfg.color }}>
                                #{data.queueNumber}
                            </div>
                        </div>

                        {/* Holat */}
                        <div style={{
                            ...styles.statusCard,
                            background: cfg.bg,
                            border: `2px solid ${cfg.color}`,
                            animation: cfg.pulse ? 'pulse 2s infinite' : 'none',
                        }}>
                            <div style={styles.statusEmoji}>{cfg.emoji}</div>
                            <div style={{ ...styles.statusLabel, color: cfg.color }}>
                                {data.statusLabel || cfg.label}
                            </div>
                        </div>

                        {/* Kutish ma'lumoti */}
                        {data.status === 'waiting' && (
                            <div style={styles.infoGrid}>
                                <div style={styles.infoCard}>
                                    <div style={styles.infoValue}>{data.aheadCount}</div>
                                    <div style={styles.infoLabel}>Sizdan oldin</div>
                                </div>
                                <div style={styles.infoCard}>
                                    <div style={styles.infoValue}>~{data.estimatedWaitMinutes}</div>
                                    <div style={styles.infoLabel}>Taxminiy kutish (daq)</div>
                                </div>
                            </div>
                        )}

                        {/* Chaqirildi holati */}
                        {data.status === 'called' && (
                            <div style={styles.alertCard}>
                                <div style={{ fontSize: 32 }}>🚶</div>
                                <div style={{ fontWeight: 700, fontSize: 18, color: '#10b981' }}>
                                    Xonaga kiring!
                                </div>
                                {data.doctor?.room && (
                                    <div style={{ fontSize: 24, fontWeight: 800, color: '#1e293b' }}>
                                        {data.doctor.room}-xona
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Shifokor ma'lumoti */}
                        {data.doctor && (
                            <div style={styles.doctorCard}>
                                <div style={styles.doctorIcon}>👨‍⚕️</div>
                                <div>
                                    <div style={styles.doctorName}>{data.doctor.name}</div>
                                    {data.doctor.spec && (
                                        <div style={styles.doctorSpec}>{data.doctor.spec}</div>
                                    )}
                                    {data.doctor.room && (
                                        <div style={styles.doctorRoom}>🚪 {data.doctor.room}-xona</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Qo'shilgan vaqt */}
                        {data.joinedAt && (
                            <div style={styles.timeInfo}>
                                Navbatga qo'shilgan:{' '}
                                {new Date(data.joinedAt).toLocaleTimeString('uz-UZ', {
                                    hour: '2-digit', minute: '2-digit'
                                })}
                            </div>
                        )}

                        {/* Yangilash tugmasi */}
                        <button onClick={fetchStatus} style={styles.refreshBtn}>
                            🔄 Yangilash
                        </button>
                    </div>
                ) : null}
            </div>

            <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.02); opacity: 0.9; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}

const styles = {
    page: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        fontFamily: "'Inter', 'Outfit', system-ui, sans-serif",
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
    },
    logo: {
        fontSize: 18,
        fontWeight: 700,
        color: '#fff',
    },
    lastUpdated: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
    },
    container: {
        maxWidth: 480,
        margin: '40px auto',
        padding: '0 16px',
    },
    center: {
        textAlign: 'center',
        padding: 80,
    },
    spinner: {
        width: 48,
        height: 48,
        border: '4px solid rgba(255,255,255,0.1)',
        borderTopColor: '#6366f1',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto',
    },
    errorCard: {
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
        padding: 40,
        textAlign: 'center',
        border: '1px solid rgba(239,68,68,0.3)',
    },
    card: {
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
    },
    queueBadge: {
        borderRadius: 20,
        padding: '24px 32px',
        textAlign: 'center',
        border: '2px solid',
    },
    queueLabel: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    queueNumber: {
        fontSize: 72,
        fontWeight: 900,
        lineHeight: 1,
    },
    statusCard: {
        borderRadius: 20,
        padding: '24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
    },
    statusEmoji: {
        fontSize: 48,
    },
    statusLabel: {
        fontSize: 22,
        fontWeight: 700,
    },
    infoGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
    },
    infoCard: {
        background: 'rgba(255,255,255,0.07)',
        borderRadius: 16,
        padding: 20,
        textAlign: 'center',
        border: '1px solid rgba(255,255,255,0.1)',
    },
    infoValue: {
        fontSize: 40,
        fontWeight: 800,
        color: '#fff',
    },
    infoLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
        marginTop: 4,
    },
    alertCard: {
        background: '#d1fae5',
        borderRadius: 20,
        padding: 24,
        textAlign: 'center',
        border: '2px solid #10b981',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
    },
    doctorCard: {
        background: 'rgba(255,255,255,0.07)',
        borderRadius: 16,
        padding: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        border: '1px solid rgba(255,255,255,0.1)',
    },
    doctorIcon: {
        fontSize: 36,
        flexShrink: 0,
    },
    doctorName: {
        fontSize: 16,
        fontWeight: 700,
        color: '#fff',
    },
    doctorSpec: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.6)',
    },
    doctorRoom: {
        fontSize: 13,
        color: '#6366f1',
        fontWeight: 600,
        marginTop: 4,
    },
    timeInfo: {
        textAlign: 'center',
        fontSize: 13,
        color: 'rgba(255,255,255,0.4)',
    },
    refreshBtn: {
        width: '100%',
        padding: '14px',
        background: 'rgba(99,102,241,0.2)',
        border: '1px solid rgba(99,102,241,0.4)',
        borderRadius: 12,
        color: '#818cf8',
        fontSize: 15,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
};
