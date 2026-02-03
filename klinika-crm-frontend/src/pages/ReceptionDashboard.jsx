// Reception Dashboard - Simplified Interface for Reception Staff
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuickActionButton, StatusBadge, LoadingSpinner, Toast } from '../components/UIComponents';
import http from '../lib/http';

export default function ReceptionDashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        todayAppointments: 0,
        waitingPatients: 0,
        todayPayments: 0,
        newPatients: 0,
    });
    const [recentAppointments, setRecentAppointments] = useState([]);
    const [queueStatus, setQueueStatus] = useState([]);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        loadDashboardData();
        const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    const hideToast = () => {
        setToast(null);
    };

    const loadDashboardData = async () => {
        try {
            const today = new Date();
            const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
            const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

            // Load today's appointments
            const appointmentsRes = await http.get('/appointments', {
                from: startOfDay,
                to: endOfDay,
            });
            const appointments = appointmentsRes.items || appointmentsRes || [];
            setRecentAppointments(appointments.slice(0, 5));

            // Load queue status
            const queueRes = await http.get('/queue/current');
            setQueueStatus((queueRes.data?.queue || queueRes.queue || []).filter(q => q.status === 'waiting'));

            // Calculate stats
            const paymentsRes = await http.get('/payments', {
                from: startOfDay,
                to: endOfDay,
            });
            const payments = paymentsRes.items || paymentsRes || [];

            setStats({
                todayAppointments: appointments.length,
                waitingPatients: queueStatus.length,
                todayPayments: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
                newPatients: appointments.filter(a => a.isNewPatient).length,
            });
        } catch (error) {
            console.error('Load dashboard error:', error);
            showToast('Ma\'lumotlarni yuklashda xatolik', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={styles.loading}>
                <LoadingSpinner size={40} />
                <p>Yuklanmoqda...</p>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>Qabulxona</h1>
                    <p style={styles.subtitle}>
                        {new Date().toLocaleDateString('uz-UZ', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </p>
                </div>
                <div style={styles.quickActions}>
                    <QuickActionButton
                        icon="➕"
                        label="Yangi Bemor"
                        onClick={() => navigate('/patients')}
                        variant="primary"
                    />
                    <QuickActionButton
                        icon="📅"
                        label="Yangi Qabul"
                        onClick={() => navigate('/appointments')}
                        variant="success"
                    />
                </div>
            </div>

            {/* Stats Cards */}
            <div style={styles.statsGrid}>
                <div style={{ ...styles.statCard, borderLeft: '4px solid #3b82f6' }}>
                    <div style={styles.statIcon}>📅</div>
                    <div style={styles.statContent}>
                        <div style={styles.statValue}>{stats.todayAppointments}</div>
                        <div style={styles.statLabel}>Bugungi Qabullar</div>
                    </div>
                </div>
                <div style={{ ...styles.statCard, borderLeft: '4px solid #f59e0b' }}>
                    <div style={styles.statIcon}>⏳</div>
                    <div style={styles.statContent}>
                        <div style={styles.statValue}>{stats.waitingPatients}</div>
                        <div style={styles.statLabel}>Navbatda</div>
                    </div>
                </div>
                <div style={{ ...styles.statCard, borderLeft: '4px solid #10b981' }}>
                    <div style={styles.statIcon}>💰</div>
                    <div style={styles.statContent}>
                        <div style={styles.statValue}>{stats.todayPayments.toLocaleString()} so'm</div>
                        <div style={styles.statLabel}>Bugungi To'lovlar</div>
                    </div>
                </div>
                <div style={{ ...styles.statCard, borderLeft: '4px solid #8b5cf6' }}>
                    <div style={styles.statIcon}>👤</div>
                    <div style={styles.statContent}>
                        <div style={styles.statValue}>{stats.newPatients}</div>
                        <div style={styles.statLabel}>Yangi Bemorlar</div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div style={styles.contentGrid}>
                {/* Recent Appointments */}
                <div style={styles.card}>
                    <div style={styles.cardHeader}>
                        <h2 style={styles.cardTitle}>So'nggi Qabullar</h2>
                        <button onClick={() => navigate('/appointments')} style={styles.viewAllBtn}>
                            Barchasi →
                        </button>
                    </div>
                    <div style={styles.cardBody}>
                        {recentAppointments.length === 0 ? (
                            <div style={styles.emptyState}>Qabullar yo'q</div>
                        ) : (
                            <div style={styles.appointmentsList}>
                                {recentAppointments.map(apt => (
                                    <div key={apt._id} style={styles.appointmentItem}>
                                        <div style={styles.appointmentTime}>
                                            {new Date(apt.scheduledAt).toLocaleTimeString('uz-UZ', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                        <div style={styles.appointmentInfo}>
                                            <div style={styles.appointmentPatient}>
                                                {apt.patient?.firstName} {apt.patient?.lastName}
                                            </div>
                                            <div style={styles.appointmentDoctor}>
                                                Dr. {apt.doctor?.firstName} {apt.doctor?.lastName}
                                            </div>
                                        </div>
                                        <StatusBadge status={apt.status} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Queue Status */}
                <div style={styles.card}>
                    <div style={styles.cardHeader}>
                        <h2 style={styles.cardTitle}>Navbat Holati</h2>
                        <button onClick={() => navigate('/queue')} style={styles.viewAllBtn}>
                            Barchasi →
                        </button>
                    </div>
                    <div style={styles.cardBody}>
                        {queueStatus.length === 0 ? (
                            <div style={styles.emptyState}>Navbatda bemorlar yo'q</div>
                        ) : (
                            <div style={styles.queueList}>
                                {queueStatus.slice(0, 5).map(q => (
                                    <div key={q._id} style={styles.queueItem}>
                                        <div style={styles.queueNumber}>№{q.queueNumber}</div>
                                        <div style={styles.queueInfo}>
                                            <div style={styles.queuePatient}>
                                                {q.patientId?.firstName} {q.patientId?.lastName}
                                            </div>
                                            <div style={styles.queueDoctor}>
                                                Dr. {q.doctorId?.firstName} {q.doctorId?.lastName}
                                            </div>
                                        </div>
                                        <div style={styles.queueWait}>~{q.estimatedWaitTime || 0} daq</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Links */}
            <div style={styles.quickLinksGrid}>
                <button onClick={() => navigate('/patients')} style={styles.quickLink}>
                    <span style={styles.quickLinkIcon}>👥</span>
                    <span style={styles.quickLinkLabel}>Bemorlar</span>
                </button>
                <button onClick={() => navigate('/payments')} style={styles.quickLink}>
                    <span style={styles.quickLinkIcon}>💳</span>
                    <span style={styles.quickLinkLabel}>To'lovlar</span>
                </button>
                <button onClick={() => navigate('/services')} style={styles.quickLink}>
                    <span style={styles.quickLinkIcon}>💊</span>
                    <span style={styles.quickLinkLabel}>Xizmatlar</span>
                </button>
                <button onClick={() => navigate('/calendar')} style={styles.quickLink}>
                    <span style={styles.quickLinkIcon}>📆</span>
                    <span style={styles.quickLinkLabel}>Kalendar</span>
                </button>
            </div>

            {/* Toast Notification */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={hideToast}
                />
            )}
        </div>
    );
}

const styles = {
    container: {
        padding: '32px',
        maxWidth: '1400px',
        margin: '0 auto',
        background: 'linear-gradient(135deg, #eff6ff 0%, #f9fafb 100%)',
        minHeight: '100vh',
    },
    loading: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: '16px',
        color: 'var(--gray-600)',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
    },
    title: {
        fontSize: '32px',
        fontWeight: 700,
        margin: 0,
        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    },
    subtitle: {
        fontSize: '14px',
        color: 'var(--gray-600)',
        margin: '4px 0 0 0',
    },
    quickActions: {
        display: 'flex',
        gap: '12px',
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '32px',
    },
    statCard: {
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.2s',
        cursor: 'pointer',
    },
    statIcon: {
        fontSize: '40px',
    },
    statContent: {
        flex: 1,
    },
    statValue: {
        fontSize: '28px',
        fontWeight: 700,
        color: 'var(--gray-900)',
        marginBottom: '4px',
    },
    statLabel: {
        fontSize: '13px',
        color: 'var(--gray-600)',
        fontWeight: 500,
    },
    contentGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '24px',
        marginBottom: '32px',
    },
    card: {
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden',
    },
    cardHeader: {
        padding: '20px 24px',
        borderBottom: '1px solid var(--gray-200)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: '18px',
        fontWeight: 600,
        margin: 0,
        color: 'var(--gray-900)',
    },
    viewAllBtn: {
        background: 'none',
        border: 'none',
        color: 'var(--primary-600)',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'color 0.2s',
    },
    cardBody: {
        padding: '24px',
    },
    emptyState: {
        textAlign: 'center',
        padding: '40px',
        color: 'var(--gray-500)',
    },
    appointmentsList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    appointmentItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '12px',
        background: 'var(--gray-50)',
        borderRadius: '8px',
        transition: 'all 0.2s',
        cursor: 'pointer',
    },
    appointmentTime: {
        fontSize: '16px',
        fontWeight: 700,
        color: 'var(--primary-600)',
        minWidth: '60px',
    },
    appointmentInfo: {
        flex: 1,
    },
    appointmentPatient: {
        fontSize: '15px',
        fontWeight: 600,
        color: 'var(--gray-900)',
        marginBottom: '2px',
    },
    appointmentDoctor: {
        fontSize: '13px',
        color: 'var(--gray-600)',
    },
    queueList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    queueItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        background: 'var(--gray-50)',
        borderRadius: '8px',
    },
    queueNumber: {
        background: 'var(--primary-600)',
        color: 'white',
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '16px',
        fontWeight: 700,
    },
    queueInfo: {
        flex: 1,
    },
    queuePatient: {
        fontSize: '15px',
        fontWeight: 600,
        color: 'var(--gray-900)',
        marginBottom: '2px',
    },
    queueDoctor: {
        fontSize: '13px',
        color: 'var(--gray-600)',
    },
    queueWait: {
        fontSize: '13px',
        color: 'var(--gray-600)',
        fontWeight: 500,
    },
    quickLinksGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '16px',
    },
    quickLink: {
        background: 'white',
        border: '2px solid var(--gray-200)',
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    quickLinkIcon: {
        fontSize: '32px',
    },
    quickLinkLabel: {
        fontSize: '14px',
        fontWeight: 500,
        color: 'var(--gray-700)',
    },
};
