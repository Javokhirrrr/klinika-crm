// Doctor Room - Queue System Integration
import React, { useState, useEffect } from 'react';
import { queueAPI } from '../api/newFeatures';
import { Toast } from '../components/UIComponents';
import http from '../lib/http';

export default function DoctorRoom() {
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState({
    waiting: [],
    called: [],
    inService: [],
    completed: [],
  });
  const [stats, setStats] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadQueue();
    loadStats();
    const interval = setInterval(loadQueue, 5000); // 5 soniyada yangilanish
    return () => clearInterval(interval);
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const hideToast = () => {
    setToast(null);
  };

  const loadStats = async () => {
    try {
      // Hozircha birinchi shifokorni olish (keyinchalik current user doctor ID)
      const currentDoctorId = queue.inService[0]?.doctorId?._id ||
        queue.waiting[0]?.doctorId?._id;

      if (currentDoctorId) {
        const { data } = await http.get(`/queue/doctor/${currentDoctorId}/stats`);
        setStats(data);
      }
    } catch (err) {
      console.error('Load stats error:', err);
    }
  };

  const loadQueue = async () => {
    try {
      const { data } = await queueAPI.getCurrent();
      const all = data.queue || [];

      setQueue({
        waiting: all.filter(q => q.status === 'waiting'),
        called: all.filter(q => q.status === 'called'),
        inService: all.filter(q => q.status === 'in_service'),
        completed: all.filter(q => q.status === 'completed'),
      });
    } catch (error) {
      console.error('Load queue error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = async (id) => {
    try {
      await queueAPI.call(id);
      showToast('Bemor chaqirildi!', 'success');
      await loadQueue();
    } catch (error) {
      console.error('Call error:', error);
      showToast('Xatolik: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  const handleStart = async (id) => {
    try {
      await queueAPI.startService(id);
      showToast('Qabul boshlandi!', 'success');
      await loadQueue();
    } catch (error) {
      console.error('Start error:', error);
      showToast('Xatolik: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  const handleComplete = async (id) => {
    try {
      await queueAPI.complete(id);
      showToast('Qabul tugallandi!', 'success');
      await loadQueue();
    } catch (error) {
      console.error('Complete error:', error);
      showToast('Xatolik: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  if (loading) {
    return <div style={styles.loading}>Yuklanmoqda...</div>;
  }

  const allWaiting = [...queue.waiting, ...queue.called];
  const allActive = queue.inService;
  const allCompleted = queue.completed;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Shifokor Xonasi</h1>
          <p style={styles.date}>{new Date().toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        {stats && (
          <div style={styles.statsCard}>
            <div style={styles.statItem}>
              <div style={styles.statValue}>{stats.avgServiceTime} daq</div>
              <div style={styles.statLabel}>O'rtacha xizmat vaqti</div>
            </div>
            <div style={styles.statDivider}></div>
            <div style={styles.statItem}>
              <div style={styles.statValue}>{stats.totalPatients}</div>
              <div style={styles.statLabel}>Jami bemorlar (30 kun)</div>
            </div>
          </div>
        )}
      </div>

      <div style={styles.grid}>
        {/* Navbatda */}
        <div style={styles.column}>
          <div style={styles.columnHeader}>
            <h2 style={styles.columnTitle}>Navbatda</h2>
            <span style={styles.count}>{allWaiting.length}</span>
          </div>

          {allWaiting.length === 0 ? (
            <div style={styles.empty}>Bemorlar yo'q</div>
          ) : (
            allWaiting.map(entry => (
              <div key={entry._id} style={styles.card}>
                <div style={styles.cardTop}>
                  <div style={styles.queueNumber}>№{entry.queueNumber}</div>
                  <strong style={styles.name}>
                    {entry.patientId?.firstName} {entry.patientId?.lastName}
                  </strong>
                  {entry.status === 'called' && (
                    <span style={styles.badgeCalled}>Chaqirildi</span>
                  )}
                </div>
                <div style={styles.info}>{entry.patientId?.phone}</div>
                <div style={styles.info}>
                  Shifokor: {entry.doctorId?.firstName} {entry.doctorId?.lastName}
                </div>
                <div style={styles.info}>Kutish: ~{entry.estimatedWaitTime || 0} daq</div>

                {entry.status === 'waiting' ? (
                  <button
                    onClick={() => handleCall(entry._id)}
                    style={styles.btnCall}
                  >
                    📞 Chaqirish
                  </button>
                ) : (
                  <button
                    onClick={() => handleStart(entry._id)}
                    style={styles.btnStart}
                  >
                    ▶️ Boshlash
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Qabulda */}
        <div style={styles.column}>
          <div style={styles.columnHeader}>
            <h2 style={styles.columnTitle}>Qabulda</h2>
            <span style={styles.count}>{allActive.length}</span>
          </div>

          {allActive.length === 0 ? (
            <div style={styles.empty}>Bemorlar yo'q</div>
          ) : (
            allActive.map(entry => (
              <div key={entry._id} style={styles.cardActive}>
                <div style={styles.cardTop}>
                  <div style={styles.queueNumber}>№{entry.queueNumber}</div>
                  <strong style={styles.name}>
                    {entry.patientId?.firstName} {entry.patientId?.lastName}
                  </strong>
                  <span style={styles.badge}>Jarayonda</span>
                </div>
                <div style={styles.info}>{entry.patientId?.phone}</div>
                <div style={styles.info}>
                  Shifokor: {entry.doctorId?.firstName} {entry.doctorId?.lastName}
                </div>
                <div style={styles.info}>
                  Boshlandi: {entry.serviceStartedAt ? new Date(entry.serviceStartedAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : '-'}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <button
                    onClick={() => {
                      // Open payment modal
                      const amount = prompt('To\'lov summasi (so\'m):');
                      if (amount && !isNaN(amount)) {
                        http.post('/payments', {
                          patientId: entry.patientId._id,
                          amount: parseFloat(amount),
                          method: 'cash',
                          status: 'completed'
                        }).then(() => {
                          alert('To\'lov qabul qilindi!');
                        }).catch(err => {
                          alert('Xatolik: ' + (err.response?.data?.message || err.message));
                        });
                      }
                    }}
                    style={{
                      ...styles.btnComplete,
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      flex: 1
                    }}
                  >
                    💳 To'lov
                  </button>
                  <button
                    onClick={() => handleComplete(entry._id)}
                    style={{ ...styles.btnComplete, flex: 1 }}
                  >
                    ✅ Tugatish
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Tugallangan */}
        <div style={styles.column}>
          <div style={styles.columnHeader}>
            <h2 style={styles.columnTitle}>Tugallangan</h2>
            <span style={styles.count}>{allCompleted.length}</span>
          </div>

          {allCompleted.length === 0 ? (
            <div style={styles.empty}>Bemorlar yo'q</div>
          ) : (
            allCompleted.slice(0, 10).map(entry => (
              <div key={entry._id} style={styles.cardDone}>
                <div style={styles.cardTop}>
                  <div style={styles.queueNumber}>№{entry.queueNumber}</div>
                  <strong style={styles.name}>
                    {entry.patientId?.firstName} {entry.patientId?.lastName}
                  </strong>
                  <span style={styles.badgeDone}>Tugallandi</span>
                </div>
                <div style={styles.info}>{entry.patientId?.phone}</div>
                <div style={styles.info}>
                  Tugallandi: {entry.completedAt ? new Date(entry.completedAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : '-'}
                </div>
              </div>
            ))
          )}
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
    padding: '40px',
    maxWidth: '1600px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px',
  },
  statsCard: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px 32px',
    borderRadius: '12px',
    display: 'flex',
    gap: '32px',
    boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
  },
  statItem: {
    textAlign: 'center',
  },
  statValue: {
    fontSize: '32px',
    fontWeight: 700,
    color: 'white',
    marginBottom: '4px',
  },
  statLabel: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: 500,
  },
  statDivider: {
    width: '2px',
    background: 'rgba(255, 255, 255, 0.3)',
  },
  loading: {
    textAlign: 'center',
    padding: '100px',
    fontSize: '18px',
    color: '#666',
  },
  title: {
    fontSize: '32px',
    fontWeight: 700,
    margin: 0,
    marginBottom: '8px',
    color: '#111',
  },
  date: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '40px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '32px',
  },
  column: {
    background: '#fff',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    padding: '24px',
  },
  columnHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '2px solid #e5e7eb',
  },
  columnTitle: {
    fontSize: '20px',
    fontWeight: 700,
    margin: 0,
    color: '#111',
  },
  count: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#3b82f6',
  },
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#999',
    fontSize: '16px',
  },
  card: {
    background: '#f9fafb',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '16px',
  },
  cardActive: {
    background: '#fef3c7',
    border: '2px solid #fbbf24',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '16px',
  },
  cardDone: {
    background: '#f0fdf4',
    border: '2px solid #d1fae5',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '16px',
    opacity: 0.7,
  },
  cardTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
    flexWrap: 'wrap',
  },
  queueNumber: {
    background: '#3b82f6',
    color: 'white',
    padding: '6px 14px',
    borderRadius: '6px',
    fontSize: '18px',
    fontWeight: 700,
  },
  name: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#111',
    flex: 1,
  },
  badge: {
    background: '#fbbf24',
    color: '#78350f',
    padding: '4px 12px',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 600,
  },
  badgeCalled: {
    background: '#dbeafe',
    color: '#1e40af',
    padding: '4px 12px',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 600,
  },
  badgeDone: {
    background: '#d1fae5',
    color: '#065f46',
    padding: '4px 12px',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 600,
  },
  info: {
    fontSize: '15px',
    color: '#666',
    marginBottom: '8px',
  },
  btnCall: {
    width: '100%',
    padding: '14px',
    marginTop: '12px',
    background: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  btnStart: {
    width: '100%',
    padding: '14px',
    marginTop: '12px',
    background: '#8b5cf6',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  btnComplete: {
    width: '100%',
    padding: '14px',
    marginTop: '12px',
    background: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 700,
    cursor: 'pointer',
  },
};
