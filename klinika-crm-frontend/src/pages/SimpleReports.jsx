import { useState, useEffect } from 'react';
import { FiTrendingUp, FiUsers, FiCalendar, FiDollarSign } from 'react-icons/fi';
import http from '../lib/http';
import '../styles/simple-pages.css';

export default function SimpleReports() {
    const [stats, setStats] = useState({
        totalPatients: 0,
        totalAppointments: 0,
        totalRevenue: 0,
        todayRevenue: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            setLoading(true);
            const [patients, appointments, payments] = await Promise.all([
                http.get('/patients').catch(() => ({ items: [] })),
                http.get('/appointments').catch(() => ({ items: [] })),
                http.get('/payments').catch(() => ({ items: [] }))
            ]);

            const pItems = patients.items || patients || [];
            const aItems = appointments.items || appointments || [];
            const payItems = payments.items || payments || [];

            const today = new Date().toISOString().split('T')[0];
            const todayRev = payItems
                .filter(p => p.createdAt?.startsWith(today))
                .reduce((sum, p) => sum + (p.amount || 0), 0);
            const totalRev = payItems.reduce((sum, p) => sum + (p.amount || 0), 0);

            setStats({
                totalPatients: pItems.length,
                totalAppointments: aItems.length,
                totalRevenue: totalRev,
                todayRevenue: todayRev
            });
        } catch (error) {
            console.error('Load error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="simple-page">
            <div className="page-header">
                <div>
                    <h1>Hisobotlar</h1>
                    <p className="text-muted">Umumiy statistika</p>
                </div>
            </div>

            {loading ? (
                <div className="loading-state">Yuklanmoqda...</div>
            ) : (
                <>
                    <div className="stats-cards">
                        <div className="stat-card">
                            <div className="stat-icon primary">
                                <FiUsers />
                            </div>
                            <div className="stat-content">
                                <div className="stat-label">Jami Bemorlar</div>
                                <div className="stat-value">{stats.totalPatients}</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon success">
                                <FiCalendar />
                            </div>
                            <div className="stat-content">
                                <div className="stat-label">Jami Qabullar</div>
                                <div className="stat-value">{stats.totalAppointments}</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon warning">
                                <FiDollarSign />
                            </div>
                            <div className="stat-content">
                                <div className="stat-label">Bugungi Tushum</div>
                                <div className="stat-value">{(stats.todayRevenue / 1000).toFixed(0)}K</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon danger">
                                <FiTrendingUp />
                            </div>
                            <div className="stat-content">
                                <div className="stat-label">Jami Tushum</div>
                                <div className="stat-value">{(stats.totalRevenue / 1000).toFixed(0)}K</div>
                            </div>
                        </div>
                    </div>

                    <div className="simple-card" style={{ padding: '3rem', textAlign: 'center' }}>
                        <FiTrendingUp size={64} style={{ color: 'var(--gray-400)', marginBottom: '1rem' }} />
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                            Batafsil Hisobotlar
                        </h3>
                        <p style={{ color: 'var(--gray-600)' }}>
                            Grafiklar va batafsil tahlillar tez orada qo'shiladi
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
