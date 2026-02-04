import { useState, useEffect } from 'react';
import { FiUsers, FiCalendar, FiDollarSign, FiClock, FiPlus, FiSearch, FiBell, FiActivity } from 'react-icons/fi';
import http from '../lib/http';
import '../styles/design-system.css';
import './ReceptionDashboard.css';

export default function ReceptionDashboard() {
    const [stats, setStats] = useState({
        todayPatients: 0,
        todayAppointments: 0,
        todayRevenue: 0,
        waitingQueue: 0
    });
    const [todayAppointments, setTodayAppointments] = useState([]);
    const [recentPatients, setRecentPatients] = useState([]);
    const [quickActions, setQuickActions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
        // Auto-refresh every 30 seconds
        const interval = setInterval(loadDashboardData, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const today = new Date().toISOString().split('T')[0];

            // Parallel requests
            const [patientsRes, appointmentsRes, paymentsRes, queueRes] = await Promise.all([
                http.get('/patients', { createdAt: today }),
                http.get('/appointments', { date: today }),
                http.get('/payments', { date: today }),
                http.get('/queue/current')
            ]);

            setStats({
                todayPatients: patientsRes.total || 0,
                todayAppointments: appointmentsRes.total || 0,
                todayRevenue: paymentsRes.items?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
                waitingQueue: queueRes.queue?.filter(q => q.status === 'waiting').length || 0
            });

            setTodayAppointments(appointmentsRes.items?.slice(0, 5) || []);
            setRecentPatients(patientsRes.items?.slice(0, 5) || []);
        } catch (error) {
            console.error('Dashboard load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ icon: Icon, label, value, color, trend }) => (
        <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: `var(--${color}-light)` }}>
                <Icon style={{ color: `var(--${color})` }} />
            </div>
            <div className="stat-content">
                <div className="stat-label">{label}</div>
                <div className="stat-value">{value}</div>
                {trend && <div className="stat-trend">{trend}</div>}
            </div>
        </div>
    );

    const QuickActionButton = ({ icon: Icon, label, onClick, color = 'primary' }) => (
        <button className={`quick-action-btn btn-${color}`} onClick={onClick}>
            <Icon size={24} />
            <span>{label}</span>
        </button>
    );

    return (
        <div className="reception-dashboard">
            {/* Header */}
            <div className="dashboard-header">
                <div>
                    <h1>Resepshn Paneli</h1>
                    <p className="text-muted">Bugungi ish kuni: {new Date().toLocaleDateString('uz-UZ', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-ghost">
                        <FiBell />
                        <span className="notification-badge">3</span>
                    </button>
                    <div className="current-time">
                        {new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions-section">
                <h2>Tezkor Amallar</h2>
                <div className="quick-actions-grid">
                    <QuickActionButton
                        icon={FiPlus}
                        label="Yangi Bemor"
                        onClick={() => window.location.href = '/patients?action=new'}
                        color="primary"
                    />
                    <QuickActionButton
                        icon={FiCalendar}
                        label="Qabul Belgilash"
                        onClick={() => window.location.href = '/appointments?action=new'}
                        color="success"
                    />
                    <QuickActionButton
                        icon={FiSearch}
                        label="Bemor Qidirish"
                        onClick={() => document.getElementById('patient-search')?.focus()}
                        color="secondary"
                    />
                    <QuickActionButton
                        icon={FiDollarSign}
                        label="To'lov Qabul"
                        onClick={() => window.location.href = '/payments?action=new'}
                        color="warning"
                    />
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <StatCard
                    icon={FiUsers}
                    label="Bugungi Bemorlar"
                    value={stats.todayPatients}
                    color="primary"
                    trend="+12% kechagiga nisbatan"
                />
                <StatCard
                    icon={FiCalendar}
                    label="Bugungi Qabullar"
                    value={stats.todayAppointments}
                    color="success"
                    trend="5 ta tugallangan"
                />
                <StatCard
                    icon={FiDollarSign}
                    label="Bugungi Tushum"
                    value={`${stats.todayRevenue.toLocaleString('uz-UZ')} so'm`}
                    color="warning"
                    trend="+8% o'sish"
                />
                <StatCard
                    icon={FiClock}
                    label="Navbatda"
                    value={stats.waitingQueue}
                    color="danger"
                    trend="Real-time"
                />
            </div>

            {/* Main Content Grid */}
            <div className="content-grid">
                {/* Today's Appointments */}
                <div className="card">
                    <div className="card-header">
                        <h3>Bugungi Qabullar</h3>
                        <button className="btn btn-ghost btn-sm" onClick={() => window.location.href = '/appointments'}>
                            Barchasi
                        </button>
                    </div>
                    <div className="card-body p-0">
                        {loading ? (
                            <div className="loading-state">Yuklanmoqda...</div>
                        ) : todayAppointments.length === 0 ? (
                            <div className="empty-state">
                                <FiCalendar size={48} />
                                <p>Bugun qabullar yo'q</p>
                            </div>
                        ) : (
                            <div className="appointments-timeline">
                                {todayAppointments.map((apt) => (
                                    <div key={apt._id} className="appointment-item">
                                        <div className="appointment-time">
                                            {new Date(apt.startsAt).toLocaleTimeString('uz-UZ', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                        <div className="appointment-indicator" />
                                        <div className="appointment-details">
                                            <div className="appointment-patient">
                                                {apt.patientId?.firstName} {apt.patientId?.lastName}
                                            </div>
                                            <div className="appointment-doctor text-muted">
                                                {apt.doctorId?.firstName} {apt.doctorId?.lastName}
                                            </div>
                                        </div>
                                        <div className="appointment-status">
                                            <span className={`badge badge-${apt.status === 'completed' ? 'success' :
                                                    apt.status === 'in_progress' ? 'warning' :
                                                        'gray'
                                                }`}>
                                                {apt.status === 'completed' ? 'Tugallangan' :
                                                    apt.status === 'in_progress' ? 'Jarayonda' :
                                                        'Kutilmoqda'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Patients */}
                <div className="card">
                    <div className="card-header">
                        <h3>Oxirgi Bemorlar</h3>
                        <button className="btn btn-ghost btn-sm" onClick={() => window.location.href = '/patients'}>
                            Barchasi
                        </button>
                    </div>
                    <div className="card-body p-0">
                        {loading ? (
                            <div className="loading-state">Yuklanmoqda...</div>
                        ) : recentPatients.length === 0 ? (
                            <div className="empty-state">
                                <FiUsers size={48} />
                                <p>Bemorlar yo'q</p>
                            </div>
                        ) : (
                            <div className="patients-list">
                                {recentPatients.map((patient) => (
                                    <div key={patient._id} className="patient-item">
                                        <div className="patient-avatar">
                                            {patient.firstName?.[0]}{patient.lastName?.[0]}
                                        </div>
                                        <div className="patient-info">
                                            <div className="patient-name">
                                                {patient.firstName} {patient.lastName}
                                            </div>
                                            <div className="patient-phone text-muted">
                                                {patient.phone}
                                            </div>
                                        </div>
                                        <div className="patient-actions">
                                            <button
                                                className="btn btn-sm btn-ghost"
                                                onClick={() => window.location.href = `/patients/${patient._id}`}
                                            >
                                                Ko'rish
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Activity Feed */}
            <div className="card">
                <div className="card-header">
                    <h3>
                        <FiActivity style={{ marginRight: '8px' }} />
                        So'nggi Faoliyat
                    </h3>
                </div>
                <div className="card-body">
                    <div className="activity-feed">
                        <div className="activity-item">
                            <div className="activity-icon bg-success">
                                <FiUsers />
                            </div>
                            <div className="activity-content">
                                <div className="activity-title">Yangi bemor qo'shildi</div>
                                <div className="activity-time text-muted">5 daqiqa oldin</div>
                            </div>
                        </div>
                        <div className="activity-item">
                            <div className="activity-icon bg-primary">
                                <FiCalendar />
                            </div>
                            <div className="activity-content">
                                <div className="activity-title">Qabul belgilandi</div>
                                <div className="activity-time text-muted">12 daqiqa oldin</div>
                            </div>
                        </div>
                        <div className="activity-item">
                            <div className="activity-icon bg-warning">
                                <FiDollarSign />
                            </div>
                            <div className="activity-content">
                                <div className="activity-title">To'lov qabul qilindi</div>
                                <div className="activity-time text-muted">25 daqiqa oldin</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
