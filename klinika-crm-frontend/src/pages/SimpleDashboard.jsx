import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FiUsers, FiCalendar, FiDollarSign, FiClock,
    FiPlus, FiSearch, FiActivity, FiTrendingUp,
    FiCheckCircle, FiAlertCircle
} from 'react-icons/fi';
import http from '../lib/http';
import '../styles/design-system.css';
import './SimpleDashboard.css';

export default function SimpleDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        todayPatients: 0,
        todayAppointments: 0,
        todayRevenue: 0,
        waitingQueue: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
        const interval = setInterval(loadStats, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadStats = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const [patients, appointments, payments, queue] = await Promise.all([
                http.get('/patients', { createdAt: today }).catch(() => ({ total: 0 })),
                http.get('/appointments', { date: today }).catch(() => ({ total: 0 })),
                http.get('/payments', { date: today }).catch(() => ({ items: [] })),
                http.get('/queue/current').catch(() => ({ queue: [] }))
            ]);

            setStats({
                todayPatients: patients.total || 0,
                todayAppointments: appointments.total || 0,
                todayRevenue: payments.items?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
                waitingQueue: queue.queue?.filter(q => q.status === 'waiting').length || 0
            });
        } catch (error) {
            console.error('Stats error:', error);
        } finally {
            setLoading(false);
        }
    };

    const quickActions = [
        {
            icon: FiPlus,
            title: 'Yangi Bemor',
            description: 'Bemor qo\'shish',
            color: 'primary',
            path: '/patients?action=new'
        },
        {
            icon: FiCalendar,
            title: 'Qabul Belgilash',
            description: 'Yangi qabul',
            color: 'success',
            path: '/appointments?action=new'
        },
        {
            icon: FiDollarSign,
            title: 'To\'lov Qabul',
            description: 'To\'lov olish',
            color: 'warning',
            path: '/payments?action=new'
        },
        {
            icon: FiSearch,
            title: 'Bemor Qidirish',
            description: 'Tez qidiruv',
            color: 'info',
            path: '/patients'
        }
    ];

    const statsCards = [
        {
            icon: FiUsers,
            label: 'Bugungi Bemorlar',
            value: stats.todayPatients,
            color: 'primary',
            path: '/patients'
        },
        {
            icon: FiCalendar,
            label: 'Bugungi Qabullar',
            value: stats.todayAppointments,
            color: 'success',
            path: '/appointments'
        },
        {
            icon: FiDollarSign,
            label: 'Bugungi Tushum',
            value: `${(stats.todayRevenue / 1000).toFixed(0)}K`,
            color: 'warning',
            path: '/payments'
        },
        {
            icon: FiClock,
            label: 'Navbatda',
            value: stats.waitingQueue,
            color: 'danger',
            path: '/queue'
        }
    ];

    return (
        <div className="simple-dashboard">
            {/* Header */}
            <div className="dashboard-header">
                <div>
                    <h1>Bosh Sahifa</h1>
                    <p className="text-muted">
                        {new Date().toLocaleDateString('uz-UZ', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long'
                        })}
                    </p>
                </div>
                <div className="current-time">
                    {new Date().toLocaleTimeString('uz-UZ', {
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="section">
                <h2 className="section-title">Tezkor Amallar</h2>
                <div className="quick-actions">
                    {quickActions.map((action, index) => (
                        <button
                            key={index}
                            className={`quick-action-card ${action.color}`}
                            onClick={() => navigate(action.path)}
                        >
                            <action.icon size={32} />
                            <div className="action-text">
                                <div className="action-title">{action.title}</div>
                                <div className="action-desc">{action.description}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats */}
            <div className="section">
                <h2 className="section-title">Bugungi Statistika</h2>
                <div className="stats-grid">
                    {statsCards.map((stat, index) => (
                        <div
                            key={index}
                            className={`stat-card ${stat.color}`}
                            onClick={() => navigate(stat.path)}
                        >
                            <div className="stat-icon">
                                <stat.icon size={24} />
                            </div>
                            <div className="stat-content">
                                <div className="stat-label">{stat.label}</div>
                                <div className="stat-value">{stat.value}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Sections */}
            <div className="main-sections">
                {/* Bemorlar */}
                <div className="section-card" onClick={() => navigate('/patients')}>
                    <div className="section-header">
                        <FiUsers size={24} />
                        <h3>Bemorlar</h3>
                    </div>
                    <p>Bemorlar bazasi va ma'lumotlar</p>
                    <div className="section-action">
                        Ko'rish →
                    </div>
                </div>

                {/* Qabullar */}
                <div className="section-card" onClick={() => navigate('/appointments')}>
                    <div className="section-header">
                        <FiCalendar size={24} />
                        <h3>Qabullar</h3>
                    </div>
                    <p>Qabullar jadvali va rejalashtirish</p>
                    <div className="section-action">
                        Ko'rish →
                    </div>
                </div>

                {/* To'lovlar */}
                <div className="section-card" onClick={() => navigate('/payments')}>
                    <div className="section-header">
                        <FiDollarSign size={24} />
                        <h3>To'lovlar</h3>
                    </div>
                    <p>Moliyaviy operatsiyalar va hisobotlar</p>
                    <div className="section-action">
                        Ko'rish →
                    </div>
                </div>

                {/* Navbat */}
                <div className="section-card" onClick={() => navigate('/queue')}>
                    <div className="section-header">
                        <FiClock size={24} />
                        <h3>Navbat</h3>
                    </div>
                    <p>Navbat tizimi va boshqaruv</p>
                    <div className="section-action">
                        Ko'rish →
                    </div>
                </div>

                {/* Davomat */}
                <div className="section-card" onClick={() => navigate('/attendance')}>
                    <div className="section-header">
                        <FiCheckCircle size={24} />
                        <h3>Davomat</h3>
                    </div>
                    <p>Xodimlar davomati va ish vaqti</p>
                    <div className="section-action">
                        Ko'rish →
                    </div>
                </div>

                {/* Hisobotlar */}
                <div className="section-card" onClick={() => navigate('/reports')}>
                    <div className="section-header">
                        <FiTrendingUp size={24} />
                        <h3>Hisobotlar</h3>
                    </div>
                    <p>Tahlil va statistika</p>
                    <div className="section-action">
                        Ko'rish →
                    </div>
                </div>
            </div>
        </div>
    );
}
