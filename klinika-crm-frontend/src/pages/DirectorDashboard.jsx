// Director Dashboard - Analytics and Management Interface
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner, Toast } from '../components/UIComponents';
import http from '../lib/http';

export default function DirectorDashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalExpenses: 0,
        profit: 0,
        totalPatients: 0,
        totalAppointments: 0,
        activeStaff: 0,
    });
    const [revenueData, setRevenueData] = useState([]);
    const [topDoctors, setTopDoctors] = useState([]);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        loadDashboardData();
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
            const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

            // Load financial data
            const paymentsRes = await http.get('/payments', {
                from: thirtyDaysAgo.toISOString(),
                to: today.toISOString(),
            });
            const payments = paymentsRes.items || paymentsRes || [];
            const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

            // Load appointments
            const appointmentsRes = await http.get('/appointments', {
                from: thirtyDaysAgo.toISOString(),
                to: today.toISOString(),
            });
            const appointments = appointmentsRes.items || appointmentsRes || [];

            // Load patients
            const patientsRes = await http.get('/patients');
            const patients = patientsRes.items || patientsRes || [];

            // Load doctors
            const doctorsRes = await http.get('/doctors');
            const doctors = doctorsRes.items || doctorsRes || [];

            setStats({
                totalRevenue,
                totalExpenses: totalRevenue * 0.3, // Placeholder
                profit: totalRevenue * 0.7, // Placeholder
                totalPatients: patients.length,
                totalAppointments: appointments.length,
                activeStaff: doctors.length,
            });

            setTopDoctors(doctors.slice(0, 5));
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
                    <h1 style={styles.title}>Direktor Paneli</h1>
                    <p style={styles.subtitle}>
                        {new Date().toLocaleDateString('uz-UZ', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </p>
                </div>
            </div>

            {/* Financial Stats */}
            <div style={styles.financialSection}>
                <h2 style={styles.sectionTitle}>Moliyaviy Ko'rsatkichlar (30 kun)</h2>
                <div style={styles.financialGrid}>
                    <div style={{ ...styles.financialCard, background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
                        <div style={styles.financialIcon}>💰</div>
                        <div style={styles.financialContent}>
                            <div style={styles.financialLabel}>Jami Daromad</div>
                            <div style={styles.financialValue}>{stats.totalRevenue.toLocaleString()} so'm</div>
                        </div>
                    </div>
                    <div style={{ ...styles.financialCard, background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
                        <div style={styles.financialIcon}>📉</div>
                        <div style={styles.financialContent}>
                            <div style={styles.financialLabel}>Xarajatlar</div>
                            <div style={styles.financialValue}>{stats.totalExpenses.toLocaleString()} so'm</div>
                        </div>
                    </div>
                    <div style={{ ...styles.financialCard, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                        <div style={styles.financialIcon}>📈</div>
                        <div style={styles.financialContent}>
                            <div style={styles.financialLabel}>Foyda</div>
                            <div style={styles.financialValue}>{stats.profit.toLocaleString()} so'm</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                    <div style={styles.statIcon}>👥</div>
                    <div style={styles.statContent}>
                        <div style={styles.statValue}>{stats.totalPatients}</div>
                        <div style={styles.statLabel}>Jami Bemorlar</div>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statIcon}>📅</div>
                    <div style={styles.statContent}>
                        <div style={styles.statValue}>{stats.totalAppointments}</div>
                        <div style={styles.statLabel}>Qabullar (30 kun)</div>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statIcon}>⚕️</div>
                    <div style={styles.statContent}>
                        <div style={styles.statValue}>{stats.activeStaff}</div>
                        <div style={styles.statLabel}>Faol Shifokorlar</div>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statIcon}>📊</div>
                    <div style={styles.statContent}>
                        <div style={styles.statValue}>
                            {stats.totalAppointments > 0 ? Math.round(stats.totalAppointments / 30) : 0}
                        </div>
                        <div style={styles.statLabel}>Kunlik O'rtacha</div>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div style={styles.contentGrid}>
                {/* Top Doctors */}
                <div style={styles.card}>
                    <div style={styles.cardHeader}>
                        <h2 style={styles.cardTitle}>Eng Faol Shifokorlar</h2>
                        <button onClick={() => navigate('/doctors')} style={styles.viewAllBtn}>
                            Barchasi →
                        </button>
                    </div>
                    <div style={styles.cardBody}>
                        {topDoctors.length === 0 ? (
                            <div style={styles.emptyState}>Ma'lumot yo'q</div>
                        ) : (
                            <div style={styles.doctorsList}>
                                {topDoctors.map((doctor, index) => (
                                    <div key={doctor._id} style={styles.doctorItem}>
                                        <div style={styles.doctorRank}>#{index + 1}</div>
                                        <div style={styles.doctorInfo}>
                                            <div style={styles.doctorName}>
                                                Dr. {doctor.firstName} {doctor.lastName}
                                            </div>
                                            <div style={styles.doctorSpecialty}>{doctor.specialty || 'Umumiy'}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div style={styles.card}>
                    <div style={styles.cardHeader}>
                        <h2 style={styles.cardTitle}>Tezkor Havolalar</h2>
                    </div>
                    <div style={styles.cardBody}>
                        <div style={styles.quickActionsList}>
                            <button onClick={() => navigate('/reports')} style={styles.quickActionBtn}>
                                <span style={styles.quickActionIcon}>📄</span>
                                <span style={styles.quickActionLabel}>Hisobotlar</span>
                            </button>
                            <button onClick={() => navigate('/salaries')} style={styles.quickActionBtn}>
                                <span style={styles.quickActionIcon}>💰</span>
                                <span style={styles.quickActionLabel}>Maoshlar</span>
                            </button>
                            <button onClick={() => navigate('/users')} style={styles.quickActionBtn}>
                                <span style={styles.quickActionIcon}>👤</span>
                                <span style={styles.quickActionLabel}>Foydalanuvchilar</span>
                            </button>
                            <button onClick={() => navigate('/system')} style={styles.quickActionBtn}>
                                <span style={styles.quickActionIcon}>⚙️</span>
                                <span style={styles.quickActionLabel}>Sozlamalar</span>
                            </button>
                            <button onClick={() => navigate('/attendance')} style={styles.quickActionBtn}>
                                <span style={styles.quickActionIcon}>⏰</span>
                                <span style={styles.quickActionLabel}>Davomat</span>
                            </button>
                            <button onClick={() => navigate('/commissions')} style={styles.quickActionBtn}>
                                <span style={styles.quickActionIcon}>💵</span>
                                <span style={styles.quickActionLabel}>Foizlar</span>
                            </button>
                        </div>
                    </div>
                </div>
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
    financialSection: {
        marginBottom: '32px',
    },
    sectionTitle: {
        fontSize: '20px',
        fontWeight: 600,
        marginBottom: '16px',
        color: 'var(--gray-900)',
    },
    financialGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
    },
    financialCard: {
        padding: '24px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        color: 'white',
    },
    financialIcon: {
        fontSize: '48px',
    },
    financialContent: {
        flex: 1,
    },
    financialLabel: {
        fontSize: '14px',
        opacity: 0.9,
        marginBottom: '4px',
    },
    financialValue: {
        fontSize: '24px',
        fontWeight: 700,
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
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
        borderLeft: '4px solid var(--primary-600)',
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
    },
    cardBody: {
        padding: '24px',
    },
    emptyState: {
        textAlign: 'center',
        padding: '40px',
        color: 'var(--gray-500)',
    },
    doctorsList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    doctorItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        background: 'var(--gray-50)',
        borderRadius: '8px',
    },
    doctorRank: {
        background: 'var(--primary-600)',
        color: 'white',
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        fontWeight: 700,
    },
    doctorInfo: {
        flex: 1,
    },
    doctorName: {
        fontSize: '15px',
        fontWeight: 600,
        color: 'var(--gray-900)',
        marginBottom: '2px',
    },
    doctorSpecialty: {
        fontSize: '13px',
        color: 'var(--gray-600)',
    },
    quickActionsList: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
    },
    quickActionBtn: {
        background: 'var(--gray-50)',
        border: '2px solid var(--gray-200)',
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    quickActionIcon: {
        fontSize: '28px',
    },
    quickActionLabel: {
        fontSize: '13px',
        fontWeight: 500,
        color: 'var(--gray-700)',
    },
};
