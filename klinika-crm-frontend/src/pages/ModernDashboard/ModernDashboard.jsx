import React, { useState, useEffect } from 'react';
import { FiUsers, FiCalendar, FiDollarSign, FiClock } from 'react-icons/fi';
import DashboardHeader from '../../components/DashboardHeader/DashboardHeader';
import FilterBar from '../../components/FilterBar/FilterBar';
import MetricCard from '../../components/MetricCard/MetricCard';
import { dashboardAPI } from '../../services/api';
import './ModernDashboard.css';

const ModernDashboard = () => {
    const [filters, setFilters] = useState({
        date: 'today',
        doctor: 'all',
        department: 'all',
        mode: 'real-time'
    });

    const [metrics, setMetrics] = useState({
        patients: { value: 0, trend: 'up', trendValue: '+0%', loading: true },
        appointments: { value: 0, trend: 'up', trendValue: '+0%', loading: true },
        revenue: { value: '0', trend: 'up', trendValue: '+0%', loading: true },
        waiting: { value: 0, trend: 'down', trendValue: '0%', loading: true }
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch dashboard data
    useEffect(() => {
        fetchDashboardData();
    }, [filters]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch all data in parallel
            const [metricsData, appointmentsData, revenueData, queueData] = await Promise.all([
                dashboardAPI.getMetrics(filters).catch(() => null),
                dashboardAPI.getTodayAppointments().catch(() => []),
                dashboardAPI.getRevenue(filters.date).catch(() => ({ total: 0 })),
                dashboardAPI.getWaitingQueue().catch(() => [])
            ]);

            // Calculate metrics
            const todayPatients = metricsData?.patients || appointmentsData?.length || 0;
            const todayAppointments = appointmentsData?.length || 0;
            const todayRevenue = revenueData?.total || 0;
            const waitingCount = queueData?.length || 0;

            // Format revenue
            const formatRevenue = (amount) => {
                if (amount >= 1000000) {
                    return `${(amount / 1000000).toFixed(1)}M`;
                } else if (amount >= 1000) {
                    return `${(amount / 1000).toFixed(0)}K`;
                }
                return amount.toString();
            };

            // Update metrics
            setMetrics({
                patients: {
                    value: todayPatients,
                    trend: 'up',
                    trendValue: metricsData?.patientsTrend || '+12%',
                    loading: false
                },
                appointments: {
                    value: todayAppointments,
                    trend: 'up',
                    trendValue: metricsData?.appointmentsTrend || '+8%',
                    loading: false
                },
                revenue: {
                    value: formatRevenue(todayRevenue),
                    trend: 'up',
                    trendValue: metricsData?.revenueTrend || '+15%',
                    loading: false
                },
                waiting: {
                    value: waitingCount,
                    trend: waitingCount > 5 ? 'up' : 'down',
                    trendValue: metricsData?.waitingTrend || '-3%',
                    loading: false
                }
            });

            setLoading(false);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
            setLoading(false);

            // Set default values on error
            setMetrics({
                patients: { value: 0, trend: 'up', trendValue: '+0%', loading: false },
                appointments: { value: 0, trend: 'up', trendValue: '+0%', loading: false },
                revenue: { value: '0', trend: 'up', trendValue: '+0%', loading: false },
                waiting: { value: 0, trend: 'down', trendValue: '0%', loading: false }
            });
        }
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
    };

    // Get user name from localStorage
    const userName = JSON.parse(localStorage.getItem('user') || '{}')?.name || 'Doctor';

    return (
        <div className="modern-dashboard">
            <DashboardHeader
                userName={userName}
                greeting="Salom"
                statusText="Tizim faol"
            />

            <FilterBar onFilterChange={handleFilterChange} />

            {error && (
                <div className="error-message">
                    <p>{error}</p>
                    <button onClick={fetchDashboardData} className="retry-btn">
                        Qayta urinish
                    </button>
                </div>
            )}

            <div className="metrics-grid">
                <MetricCard
                    title="Bugungi Bemorlar"
                    value={metrics.patients.value}
                    trend={metrics.patients.trend}
                    trendValue={metrics.patients.trendValue}
                    badge="normal"
                    icon={FiUsers}
                    color="primary"
                />

                <MetricCard
                    title="Bugungi Qabullar"
                    value={metrics.appointments.value}
                    trend={metrics.appointments.trend}
                    trendValue={metrics.appointments.trendValue}
                    badge="active"
                    icon={FiCalendar}
                    color="success"
                />

                <MetricCard
                    title="Bugungi Daromad"
                    value={metrics.revenue.value}
                    unit="UZS"
                    trend={metrics.revenue.trend}
                    trendValue={metrics.revenue.trendValue}
                    badge="high"
                    icon={FiDollarSign}
                    color="warning"
                />

                <MetricCard
                    title="Kutayotganlar"
                    value={metrics.waiting.value}
                    trend={metrics.waiting.trend}
                    trendValue={metrics.waiting.trendValue}
                    badge="waiting"
                    icon={FiClock}
                    color="primary"
                />
            </div>

            <div className="charts-grid">
                <div className="chart-card">
                    <div className="chart-header">
                        <h3 className="chart-title">Daromad Tahlili</h3>
                        <p className="chart-subtitle">Bugungi xizmatlar bo'yicha taqsimot</p>
                    </div>
                    <div className="chart-placeholder">
                        <p>📊 Donut Chart</p>
                        <p className="placeholder-text">Backend'dan ma'lumot yuklanmoqda...</p>
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-header">
                        <h3 className="chart-title">Bemorlar Statistikasi</h3>
                        <p className="chart-subtitle">Haftalik bemorlar soni</p>
                    </div>
                    <div className="chart-placeholder">
                        <p>📈 Line Chart</p>
                        <p className="placeholder-text">Backend'dan ma'lumot yuklanmoqda...</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModernDashboard;
