// Clean Dashboard - Exactly like the reference design
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StatusBadge, LoadingSpinner } from '../components/UIComponents';
import http from '../lib/http';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [recentPatients, setRecentPatients] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [appointmentsRes, paymentsRes, patientsRes, servicesRes] = await Promise.all([
        http.get('/appointments?limit=1000'),
        http.get('/payments?limit=1000'),
        http.get('/patients?limit=5&sort=-createdAt'),
        http.get('/services'),
      ]);

      const allAppointments = appointmentsRes.items || [];
      const allPayments = paymentsRes.items || [];
      const allServices = servicesRes.items || [];

      setRecentPatients(patientsRes.items || []);

      // Calculate real stats from database
      const totalRevenue = allPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const pendingPayments = allAppointments.filter(a => !a.isPaid && a.status === 'completed');
      const dueAmount = pendingPayments.reduce((sum, a) => sum + (a.price || a.service?.price || 0), 0);

      setStats({
        totalAppointments: allAppointments.length,
        totalServices: allServices.length,
        totalTransactions: allPayments.length,
        revenue: totalRevenue,
        netRevenue: totalRevenue,
        pendingOrders: pendingPayments.length,
        dueAmount: dueAmount,
        overdueAmount: 0, // Can be calculated based on date
      });

      // Generate chart data from last 7 days payments
      const last7Days = [];
      const dayNames = ['Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan', 'Yak'];

      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const dayPayments = allPayments.filter(p => {
          const pDate = new Date(p.createdAt).toISOString().split('T')[0];
          return pDate === dateStr;
        });

        const dayRevenue = dayPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

        last7Days.push({
          day: dayNames[date.getDay()],
          value: dayRevenue / 1000, // Convert to thousands for better chart display
        });
      }

      setChartData(last7Days);

    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <LoadingSpinner size={40} />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Hisobotlar</h1>
      </div>

      {/* Top Stats - 3 Circles */}
      <div style={styles.topStats}>
        <div style={styles.circleCard}>
          <div style={{ ...styles.circle, background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M3 3h18v18H3z" />
              <path d="M9 9h6v6H9z" />
            </svg>
          </div>
          <div style={styles.circleInfo}>
            <div style={styles.circleLabel}>QABULLAR</div>
            <div style={styles.circleValue}>{stats.totalAppointments}</div>
          </div>
        </div>

        <div style={styles.circleCard}>
          <div style={{ ...styles.circle, background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <div style={styles.circleInfo}>
            <div style={styles.circleLabel}>XIZMATLAR</div>
            <div style={styles.circleValue}>{stats.totalServices}</div>
          </div>
        </div>

        <div style={styles.circleCard}>
          <div style={{ ...styles.circle, background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v8M8 12h8" />
            </svg>
          </div>
          <div style={styles.circleInfo}>
            <div style={styles.circleLabel}>TRANZAKSIYALAR</div>
            <div style={styles.circleValue}>{stats.totalTransactions}</div>
          </div>
        </div>
      </div>

      {/* KPI Section */}
      <div style={styles.kpiSection}>
        <h2 style={styles.sectionTitle}>Asosiy Ko'rsatkichlar</h2>

        <div style={styles.kpiGrid}>
          <div style={styles.kpiCard}>
            <div style={styles.kpiLabel}>DAROMAD</div>
            <div style={styles.kpiValue}>{(stats.revenue || 0).toLocaleString()} so'm</div>
          </div>

          <div style={styles.kpiCard}>
            <div style={styles.kpiLabel}>SALDO</div>
            <div style={styles.kpiValue}>{(stats.netRevenue || 0).toLocaleString()} so'm</div>
          </div>

          <div style={styles.kpiCard}>
            <div style={styles.kpiLabel}>KUTILMOQDA</div>
            <div style={styles.kpiValue}>{stats.pendingOrders || 0} ta</div>
          </div>

          <div style={styles.kpiCard}>
            <div style={styles.kpiLabel}>TO'LANISHI KERAK</div>
            <div style={styles.kpiValue}>{(stats.dueAmount || 0).toLocaleString()} so'm</div>
          </div>

          <div style={styles.kpiCard}>
            <div style={styles.kpiLabel}>MUDDATI O'TGAN</div>
            <div style={styles.kpiValue}>{(stats.overdueAmount || 0).toLocaleString()} so'm</div>
          </div>
        </div>

        {/* Chart */}
        <div style={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="0" stroke="#f3f4f6" vertical={false} />
              <XAxis
                dataKey="day"
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                axisLine={false}
                tickLine={false}
                ticks={[0, 20, 40, 60, 80, 100]}
              />
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Latest Patients */}
      <div style={styles.latestSection}>
        <div style={styles.latestHeader}>
          <h2 style={styles.sectionTitle}>So'nggi Bemorlar</h2>
          <button onClick={() => navigate('/patients')} style={styles.viewAllBtn}>
            Barchasini Ko'rish
          </button>
        </div>

        <div style={styles.patientsList}>
          {recentPatients.length === 0 ? (
            <div style={styles.emptyState}>
              <p>Bemorlar topilmadi</p>
            </div>
          ) : (
            recentPatients.map((patient) => (
              <div key={patient._id} style={styles.patientItem}>
                <div style={styles.patientDate}>
                  {new Date(patient.createdAt || Date.now()).toLocaleDateString('uz-UZ', {
                    day: '2-digit',
                    month: 'short',
                  })}
                </div>

                <div style={styles.patientName}>
                  {patient.firstName} {patient.lastName}
                </div>

                <div style={styles.patientStats}>
                  <div style={styles.patientOrders}>
                    - qabul
                  </div>
                  <div style={styles.patientAmount}>
                    - so'm
                  </div>
                </div>

                <div style={styles.patientBadge}>
                  <span style={styles.badge}>Onboarded</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '32px',
    maxWidth: '1200px',
    margin: '0 auto',
    background: '#fafafa',
    minHeight: '100vh',
  },
  header: {
    marginBottom: '32px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 600,
    margin: 0,
    color: '#111827',
  },
  topStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
    marginBottom: '32px',
  },
  circleCard: {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    border: '1px solid #f3f4f6',
  },
  circle: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  circleInfo: {
    flex: 1,
  },
  circleLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#6b7280',
    letterSpacing: '0.5px',
    marginBottom: '4px',
  },
  circleValue: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#111827',
  },
  kpiSection: {
    background: 'white',
    padding: '32px',
    borderRadius: '12px',
    marginBottom: '32px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    border: '1px solid #f3f4f6',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    margin: 0,
    marginBottom: '24px',
    color: '#111827',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  },
  kpiCard: {
    background: '#f9fafb',
    padding: '16px',
    borderRadius: '8px',
  },
  kpiLabel: {
    fontSize: '10px',
    fontWeight: 600,
    color: '#6b7280',
    letterSpacing: '0.5px',
    marginBottom: '8px',
  },
  kpiValue: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#111827',
  },
  chartContainer: {
    marginTop: '24px',
    paddingTop: '24px',
    borderTop: '1px solid #f3f4f6',
  },
  latestSection: {
    background: 'white',
    padding: '32px',
    borderRadius: '12px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    border: '1px solid #f3f4f6',
  },
  latestHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  viewAllBtn: {
    background: 'none',
    border: 'none',
    color: '#3b82f6',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
  },
  patientsList: {
    display: 'flex',
    flexDirection: 'column',
  },
  patientItem: {
    display: 'grid',
    gridTemplateColumns: '80px 1fr 240px 100px',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 0',
    borderBottom: '1px solid #f3f4f6',
  },
  patientDate: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#111827',
  },
  patientName: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#3b82f6',
  },
  patientStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  patientOrders: {
    fontSize: '13px',
    color: '#6b7280',
  },
  patientAmount: {
    fontSize: '13px',
    color: '#111827',
  },
  patientBadge: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  badge: {
    background: '#d1fae5',
    color: '#065f46',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500,
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px',
    color: '#9ca3af',
  },
};
