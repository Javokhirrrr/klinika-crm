// src/pages/Analytics.jsx
import React, { useState, useEffect } from 'react';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import http from '../lib/http';
import { PageLoading } from '../components/LoadingStates';
import { useToast } from '../components/Toast';

const COLORS = ['#2563eb', '#0ea5a4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Analytics() {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    const [revenueData, setRevenueData] = useState([]);
    const [patientData, setPatientData] = useState([]);
    const [doctorData, setDoctorData] = useState([]);
    const [serviceData, setServiceData] = useState([]);
    const [summary, setSummary] = useState({});

    useEffect(() => {
        loadAnalytics();
    }, [dateRange]);

    async function loadAnalytics() {
        setLoading(true);
        try {
            const [revenue, patients, doctors, services, dashSummary] = await Promise.all([
                http.get('/analytics/financial-report', {
                    startDate: dateRange.start,
                    endDate: dateRange.end,
                    groupBy: 'day'
                }),
                http.get('/analytics/patient-stats'),
                http.get('/analytics/doctor-performance', {
                    startDate: dateRange.start,
                    endDate: dateRange.end
                }),
                http.get('/analytics/service-stats'),
                http.get('/analytics/dashboard-stats')
            ]);

            // Format revenue data
            const formattedRevenue = (revenue.revenue || []).map(item => ({
                date: `${item._id.day}/${item._id.month}`,
                revenue: item.total,
                count: item.count,
                cash: item.cash || 0,
                card: item.card || 0
            }));

            setRevenueData(formattedRevenue);
            setPatientData(patients.patientsByGender || []);
            setDoctorData(doctors.performance || []);
            setServiceData(services.services || []);
            setSummary(dashSummary.stats || {});
        } catch (error) {
            console.error('Analytics load error:', error);
            toast.error('Ma\'lumotlarni yuklashda xatolik');
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <PageLoading message="Analitika yuklanmoqda..." />;
    }

    return (
        <div className="page">
            <div style={styles.header}>
                <h1>Analitika va Hisobotlar</h1>

                {/* Date Range Picker */}
                <div style={styles.dateRange}>
                    <input
                        type="date"
                        value={dateRange.start}
                        onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                        className="input"
                        style={{ width: 'auto' }}
                    />
                    <span style={{ padding: '0 8px' }}>—</span>
                    <input
                        type="date"
                        value={dateRange.end}
                        onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                        className="input"
                        style={{ width: 'auto' }}
                    />
                </div>
            </div>

            {/* Summary Cards */}
            <div style={styles.summaryGrid}>
                <div className="card" style={styles.summaryCard}>
                    <div style={styles.summaryIcon}>💰</div>
                    <div>
                        <div style={styles.summaryLabel}>Jami Daromad</div>
                        <div style={styles.summaryValue}>{(summary.totalRevenue || 0).toLocaleString()} so'm</div>
                    </div>
                </div>

                <div className="card" style={styles.summaryCard}>
                    <div style={styles.summaryIcon}>👥</div>
                    <div>
                        <div style={styles.summaryLabel}>Jami Bemorlar</div>
                        <div style={styles.summaryValue}>{summary.totalPatients || 0}</div>
                    </div>
                </div>

                <div className="card" style={styles.summaryCard}>
                    <div style={styles.summaryIcon}>📅</div>
                    <div>
                        <div style={styles.summaryLabel}>Jami Qabullar</div>
                        <div style={styles.summaryValue}>{summary.totalAppointments || 0}</div>
                    </div>
                </div>

                <div className="card" style={styles.summaryCard}>
                    <div style={styles.summaryIcon}>⏳</div>
                    <div>
                        <div style={styles.summaryLabel}>Bugungi Navbat</div>
                        <div style={styles.summaryValue}>{summary.todayQueue || 0}</div>
                    </div>
                </div>
            </div>

            {/* Revenue Chart */}
            <div className="card" style={{ marginTop: 24 }}>
                <h2 style={styles.chartTitle}>Daromad Dinamikasi</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={revenueData}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: 12 }} />
                        <YAxis stroke="#6b7280" style={{ fontSize: 12 }} />
                        <Tooltip
                            contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }}
                            formatter={(value) => `${value.toLocaleString()} so'm`}
                        />
                        <Legend />
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#2563eb"
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                            name="Daromad"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginTop: 24 }}>
                {/* Payment Methods */}
                <div className="card">
                    <h2 style={styles.chartTitle}>To'lov Usullari</h2>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={revenueData.reduce((acc, item) => {
                                    const cash = acc.find(a => a.name === 'Naqd');
                                    const card = acc.find(a => a.name === 'Karta');
                                    if (cash) cash.value += item.cash;
                                    if (card) card.value += item.card;
                                    return acc;
                                }, [
                                    { name: 'Naqd', value: 0 },
                                    { name: 'Karta', value: 0 }
                                ])}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {COLORS.map((color, index) => (
                                    <Cell key={`cell-${index}`} fill={color} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `${value.toLocaleString()} so'm`} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Patient Gender Distribution */}
                <div className="card">
                    <h2 style={styles.chartTitle}>Bemorlar (Jins bo'yicha)</h2>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={patientData.map(item => ({
                            gender: item._id === 'male' ? 'Erkak' : item._id === 'female' ? 'Ayol' : 'Noma\'lum',
                            count: item.count
                        }))}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="gender" stroke="#6b7280" />
                            <YAxis stroke="#6b7280" />
                            <Tooltip />
                            <Bar dataKey="count" fill="#10b981" name="Soni" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Doctor Performance Table */}
            <div className="card" style={{ marginTop: 24 }}>
                <h2 style={styles.chartTitle}>Shifokorlar Samaradorligi</h2>
                <div className="table-wrapper">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Shifokor</th>
                                <th>Jami Qabullar</th>
                                <th>Tugallangan</th>
                                <th>Samaradorlik</th>
                            </tr>
                        </thead>
                        <tbody>
                            {doctorData.map((doctor, idx) => (
                                <tr key={idx}>
                                    <td style={{ fontWeight: 600 }}>{doctor.doctorName}</td>
                                    <td>{doctor.totalAppointments}</td>
                                    <td>{doctor.completedAppointments}</td>
                                    <td>
                                        <span className="badge success">
                                            {doctor.completionRate?.toFixed(1)}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {doctorData.length === 0 && (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', color: '#6b7280' }}>
                                        Ma'lumot topilmadi
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

const styles = {
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 16
    },
    dateRange: {
        display: 'flex',
        alignItems: 'center',
        gap: 8
    },
    summaryGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 16
    },
    summaryCard: {
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: 20
    },
    summaryIcon: {
        fontSize: 40,
        width: 64,
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f3f4f6',
        borderRadius: 12,
        flexShrink: 0
    },
    summaryLabel: {
        fontSize: 13,
        color: '#6b7280',
        marginBottom: 4
    },
    summaryValue: {
        fontSize: 24,
        fontWeight: 700,
        color: '#111827'
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: 600,
        marginBottom: 16,
        color: '#111827'
    }
};
