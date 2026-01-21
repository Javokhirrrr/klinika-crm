// Reports & Analytics Page - Comprehensive Dashboard
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LoadingSpinner } from '../components/UIComponents';
import http from '../lib/http';

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month'); // today, week, month, year
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalAppointments: 0,
    totalPatients: 0,
    pendingPayments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
  });

  const [revenueData, setRevenueData] = useState([]);
  const [servicesData, setServicesData] = useState([]);
  const [paymentMethodsData, setPaymentMethodsData] = useState([]);
  const [doctorsData, setDoctorsData] = useState([]);

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const { from, to } = getDateRange();

      // Load all data
      const [appointments, payments, patients] = await Promise.all([
        http.get('/appointments', { from, to }),
        http.get('/payments', { from, to }),
        http.get('/patients'),
      ]);

      const appointmentsList = appointments.items || [];
      const paymentsList = payments.items || [];
      const patientsList = patients.items || [];

      // Calculate stats
      const totalRevenue = paymentsList.reduce((sum, p) => sum + (p.amount || 0), 0);
      const pendingPayments = appointmentsList
        .filter(a => !a.isPaid && a.status === 'completed')
        .reduce((sum, a) => sum + (a.price || a.service?.price || 0), 0);

      setStats({
        totalRevenue,
        totalAppointments: appointmentsList.length,
        totalPatients: patientsList.length,
        pendingPayments,
        completedAppointments: appointmentsList.filter(a => a.status === 'completed').length,
        cancelledAppointments: appointmentsList.filter(a => a.status === 'cancelled').length,
      });

      // Revenue chart data (last 7 days)
      setRevenueData(generateRevenueData(paymentsList));

      // Services data
      setServicesData(generateServicesData(appointmentsList));

      // Payment methods
      setPaymentMethodsData(generatePaymentMethodsData(paymentsList));

      // Doctors performance
      setDoctorsData(generateDoctorsData(appointmentsList));

    } catch (error) {
      console.error('Analytics error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    const now = new Date();
    let from = new Date();

    switch (dateRange) {
      case 'today':
        from.setHours(0, 0, 0, 0);
        break;
      case 'week':
        from.setDate(now.getDate() - 7);
        break;
      case 'month':
        from.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        from.setFullYear(now.getFullYear() - 1);
        break;
    }

    return {
      from: from.toISOString(),
      to: now.toISOString(),
    };
  };

  const generateRevenueData = (payments) => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayPayments = payments.filter(p => {
        const pDate = new Date(p.createdAt).toISOString().split('T')[0];
        return pDate === dateStr;
      });

      const total = dayPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

      last7Days.push({
        date: date.toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short' }),
        revenue: total,
      });
    }
    return last7Days;
  };

  const generateServicesData = (appointments) => {
    const servicesMap = {};

    appointments.forEach(app => {
      const serviceName = app.service?.name || 'Boshqa';
      const price = app.price || app.service?.price || 0;

      if (!servicesMap[serviceName]) {
        servicesMap[serviceName] = { name: serviceName, count: 0, revenue: 0 };
      }

      servicesMap[serviceName].count++;
      servicesMap[serviceName].revenue += price;
    });

    return Object.values(servicesMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  };

  const generatePaymentMethodsData = (payments) => {
    const methodsMap = {
      cash: { name: 'Naqd', value: 0, color: '#10b981' },
      card: { name: 'Karta', value: 0, color: '#3b82f6' },
      transfer: { name: 'O\'tkazma', value: 0, color: '#f59e0b' },
      online: { name: 'Online', value: 0, color: '#8b5cf6' },
    };

    payments.forEach(p => {
      const method = p.method || 'cash';
      if (methodsMap[method]) {
        methodsMap[method].value += p.amount || 0;
      }
    });

    return Object.values(methodsMap).filter(m => m.value > 0);
  };

  const generateDoctorsData = (appointments) => {
    const doctorsMap = {};

    appointments.forEach(app => {
      const doctor = app.doctor || app.doctorId;
      if (!doctor) return;

      const doctorName = `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || 'Noma\'lum';

      if (!doctorsMap[doctorName]) {
        doctorsMap[doctorName] = { name: doctorName, appointments: 0, revenue: 0 };
      }

      doctorsMap[doctorName].appointments++;
      doctorsMap[doctorName].revenue += app.price || app.service?.price || 0;
    });

    return Object.values(doctorsMap).sort((a, b) => b.appointments - a.appointments).slice(0, 5);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
        <LoadingSpinner size={40} />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Hisobotlar va Analiz</h1>
          <p style={styles.subtitle}>Klinika statistikasi va moliyaviy hisobotlar</p>
        </div>

        <div style={styles.dateFilters}>
          <button
            onClick={() => setDateRange('today')}
            style={{ ...styles.filterBtn, ...(dateRange === 'today' ? styles.filterBtnActive : {}) }}
          >
            Bugun
          </button>
          <button
            onClick={() => setDateRange('week')}
            style={{ ...styles.filterBtn, ...(dateRange === 'week' ? styles.filterBtnActive : {}) }}
          >
            Hafta
          </button>
          <button
            onClick={() => setDateRange('month')}
            style={{ ...styles.filterBtn, ...(dateRange === 'month' ? styles.filterBtnActive : {}) }}
          >
            Oy
          </button>
          <button
            onClick={() => setDateRange('year')}
            style={{ ...styles.filterBtn, ...(dateRange === 'year' ? styles.filterBtnActive : {}) }}
          >
            Yil
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            💰
          </div>
          <div style={styles.statInfo}>
            <div style={styles.statLabel}>JAMI DAROMAD</div>
            <div style={styles.statValue}>{stats.totalRevenue.toLocaleString()} so'm</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
            📅
          </div>
          <div style={styles.statInfo}>
            <div style={styles.statLabel}>JAMI QABULLAR</div>
            <div style={styles.statValue}>{stats.totalAppointments}</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
            👥
          </div>
          <div style={styles.statInfo}>
            <div style={styles.statLabel}>JAMI BEMORLAR</div>
            <div style={styles.statValue}>{stats.totalPatients}</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            ⏳
          </div>
          <div style={styles.statInfo}>
            <div style={styles.statLabel}>KUTILAYOTGAN TO'LOVLAR</div>
            <div style={styles.statValue}>{stats.pendingPayments.toLocaleString()} so'm</div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div style={styles.chartsRow}>
        {/* Revenue Chart */}
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>📈 Daromad Dinamikasi (7 kun)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                formatter={(value) => `${value.toLocaleString()} so'm`}
              />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Services Chart */}
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>🏥 Top 5 Xizmatlar</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={servicesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={styles.chartsRow}>
        {/* Payment Methods */}
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>💳 To'lov Usullari</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentMethodsData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {paymentMethodsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value.toLocaleString()} so'm`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Doctors Performance */}
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>👨‍⚕️ Shifokorlar Samaradorligi</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={doctorsData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" stroke="#666" />
              <YAxis dataKey="name" type="category" stroke="#666" width={120} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Bar dataKey="appointments" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Stats */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Tugallangan Qabullar</div>
          <div style={styles.summaryValue}>{stats.completedAppointments}</div>
          <div style={styles.summaryPercent}>
            {stats.totalAppointments > 0
              ? `${((stats.completedAppointments / stats.totalAppointments) * 100).toFixed(1)}%`
              : '0%'}
          </div>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Bekor Qilingan</div>
          <div style={styles.summaryValue}>{stats.cancelledAppointments}</div>
          <div style={styles.summaryPercent}>
            {stats.totalAppointments > 0
              ? `${((stats.cancelledAppointments / stats.totalAppointments) * 100).toFixed(1)}%`
              : '0%'}
          </div>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>O'rtacha Qabul Narxi</div>
          <div style={styles.summaryValue}>
            {stats.totalAppointments > 0
              ? `${Math.round(stats.totalRevenue / stats.totalAppointments).toLocaleString()} so'm`
              : '0 so\'m'}
          </div>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>To'lov Darajasi</div>
          <div style={styles.summaryValue}>
            {(stats.totalRevenue + stats.pendingPayments) > 0
              ? `${((stats.totalRevenue / (stats.totalRevenue + stats.pendingPayments)) * 100).toFixed(1)}%`
              : '0%'}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '32px', maxWidth: '1600px', margin: '0 auto', background: '#fafafa', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' },
  title: { fontSize: '28px', fontWeight: 700, margin: 0, color: '#111' },
  subtitle: { fontSize: '14px', color: '#666', margin: 0, marginTop: '4px' },
  dateFilters: { display: 'flex', gap: '8px' },
  filterBtn: { padding: '10px 20px', border: '2px solid #e5e7eb', borderRadius: '8px', background: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', color: '#666', transition: 'all 0.2s' },
  filterBtnActive: { background: '#3b82f6', color: '#fff', borderColor: '#3b82f6' },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' },
  statCard: { background: '#fff', padding: '24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #f3f4f6' },
  statIcon: { width: '64px', height: '64px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', flexShrink: 0 },
  statInfo: { flex: 1 },
  statLabel: { fontSize: '11px', fontWeight: 700, color: '#666', letterSpacing: '0.5px', marginBottom: '8px' },
  statValue: { fontSize: '24px', fontWeight: 700, color: '#111' },

  chartsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '24px', marginBottom: '24px' },
  chartCard: { background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #f3f4f6' },
  chartTitle: { fontSize: '16px', fontWeight: 700, margin: 0, marginBottom: '20px', color: '#111' },

  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' },
  summaryCard: { background: '#fff', padding: '20px', borderRadius: '12px', textAlign: 'center', border: '1px solid #f3f4f6' },
  summaryLabel: { fontSize: '13px', color: '#666', marginBottom: '8px', fontWeight: 600 },
  summaryValue: { fontSize: '20px', fontWeight: 700, color: '#111', marginBottom: '4px' },
  summaryPercent: { fontSize: '14px', color: '#10b981', fontWeight: 600 },
};
