import { useState, useEffect } from 'react';
import { queueAPI } from '../api/newFeatures';
import http from '../lib/http';
import { Combobox } from '@/components/ui/combobox';
import './Queue.css';

export default function Queue() {
    const [queue, setQueue] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Add Queue Modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [formData, setFormData] = useState({
        patientId: '',
        doctorId: '',
        priority: 'normal'
    });

    useEffect(() => {
        loadQueue();
        loadStats();

        // Auto-refresh every 5 seconds
        const interval = setInterval(() => {
            loadQueue();
            loadStats();
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const loadQueue = async () => {
        try {
            const { data } = await queueAPI.getCurrent();
            setQueue(data.queue);
        } catch (err) {
            console.error('Load queue error:', err);
        }
    };

    const loadStats = async () => {
        try {
            const { data } = await queueAPI.getStats();
            setStats(data.stats);
        } catch (err) {
            console.error('Load stats error:', err);
        }
    };

    const handleCall = async (id) => {
        try {
            setLoading(true);
            await queueAPI.call(id);
            setSuccess('Bemor chaqirildi');
            loadQueue();
            setTimeout(() => setSuccess(''), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Xatolik');
        } finally {
            setLoading(false);
        }
    };

    const handleStart = async (id) => {
        try {
            setLoading(true);
            await queueAPI.startService(id);
            setSuccess('Xizmat boshlandi');
            loadQueue();
            setTimeout(() => setSuccess(''), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Xatolik');
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = async (id) => {
        try {
            setLoading(true);
            await queueAPI.complete(id);
            setSuccess('Xizmat yakunlandi');
            loadQueue();
            loadStats();
            setTimeout(() => setSuccess(''), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Xatolik');
        } finally {
            setLoading(false);
        }
    };

    const loadPatients = async () => {
        try {
            const res = await http.get('/patients');
            setPatients(res.items || res || []);
        } catch (err) {
            console.error('Load patients error:', err);
        }
    };

    const loadDoctors = async () => {
        try {
            const res = await http.get('/doctors');
            setDoctors(res.items || res || []);
        } catch (err) {
            console.error('Load doctors error:', err);
        }
    };

    const handleAddToQueue = async () => {
        if (!formData.patientId || !formData.doctorId) {
            setError('Iltimos, bemor va shifokorni tanlang');
            return;
        }

        try {
            setLoading(true);
            await queueAPI.join({
                patientId: formData.patientId,
                doctorId: formData.doctorId,
                priority: formData.priority
            });
            setSuccess('Bemor navbatga qo\'shildi');
            setShowAddModal(false);
            setFormData({ patientId: '', doctorId: '', priority: 'normal' });
            loadQueue();
            loadStats();
            setTimeout(() => setSuccess(''), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Xatolik');
        } finally {
            setLoading(false);
        }
    };

    const getPriorityBadge = (priority) => {
        const badges = {
            normal: { text: 'Oddiy', class: 'priority-normal' },
            urgent: { text: 'Shoshilinch', class: 'priority-urgent' },
            emergency: { text: 'Favqulodda', class: 'priority-emergency' },
        };
        const badge = badges[priority] || badges.normal;
        return <span className={`priority-badge ${badge.class}`}>{badge.text}</span>;
    };

    const getStatusBadge = (status) => {
        const badges = {
            waiting: { text: 'Kutmoqda', class: 'status-waiting' },
            called: { text: 'Chaqirildi', class: 'status-called' },
            in_service: { text: 'Xizmatda', class: 'status-service' },
        };
        const badge = badges[status] || { text: status, class: 'status-waiting' };
        return <span className={`status-badge ${badge.class}`}>{badge.text}</span>;
    };

    const waitingQueue = queue.filter(q => q.status === 'waiting');
    const activeQueue = queue.filter(q => ['called', 'in_service'].includes(q.status));

    return (
        <div className="queue-page">
            <div className="page-header">
                <div>
                    <h1>📋 Navbat</h1>
                    <p>Bemorlar navbati va xizmat ko'rsatish</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto' }}>
                    <button
                        className="btn btn-success"
                        onClick={() => {
                            setShowAddModal(true);
                            loadPatients();
                            loadDoctors();
                        }}
                        style={{
                            background: '#10b981',
                            color: 'white',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '0.75rem',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: '500'
                        }}
                    >
                        + Navbatga qo'shish
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => {
                            const org = JSON.parse(localStorage.getItem('org') || '{}');
                            const orgId = org.id || localStorage.getItem('orgId');
                            window.open(`/queue-display?orgId=${orgId}`, '_blank', 'fullscreen=yes');
                        }}
                        style={{
                            background: '#2563eb',
                            color: 'white',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '0.75rem',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: '500'
                        }}
                    >
                        📺 Displey Ekranini Ochish
                    </button>
                </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {/* Stats */}
            {stats && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">⏳</div>
                        <div className="stat-info">
                            <div className="stat-label">Kutmoqda</div>
                            <div className="stat-value">{stats.currentlyWaiting}</div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">✅</div>
                        <div className="stat-info">
                            <div className="stat-label">Bugun xizmat ko'rsatildi</div>
                            <div className="stat-value">{stats.servedToday}</div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">⏱️</div>
                        <div className="stat-info">
                            <div className="stat-label">O'rtacha kutish vaqti</div>
                            <div className="stat-value">{stats.avgWaitTime} daq</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Active Queue */}
            {activeQueue.length > 0 && (
                <div className="active-section">
                    <h2>🔴 Faol xizmat</h2>
                    <div className="queue-list">
                        {activeQueue.map((entry) => (
                            <div key={entry._id} className="queue-item active">
                                <div className="queue-number">{entry.queueNumber}</div>
                                <div className="queue-patient">
                                    <div className="patient-name">
                                        {entry.patientId?.firstName} {entry.patientId?.lastName}
                                    </div>
                                    <div className="patient-phone">{entry.patientId?.phone}</div>
                                </div>
                                <div className="queue-priority">
                                    {getPriorityBadge(entry.priority)}
                                </div>
                                <div className="queue-status">
                                    {getStatusBadge(entry.status)}
                                </div>
                                <div className="queue-actions">
                                    {entry.status === 'called' && (
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => handleStart(entry._id)}
                                            disabled={loading}
                                        >
                                            Boshlash
                                        </button>
                                    )}
                                    {entry.status === 'in_service' && (
                                        <button
                                            className="btn btn-success btn-sm"
                                            onClick={() => handleComplete(entry._id)}
                                            disabled={loading}
                                        >
                                            Yakunlash
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Waiting Queue */}
            <div className="waiting-section">
                <h2>⏳ Kutayotganlar ({waitingQueue.length})</h2>
                {waitingQueue.length === 0 ? (
                    <p className="no-data">Navbatda hech kim yo'q</p>
                ) : (
                    <div className="queue-list">
                        {waitingQueue.map((entry) => (
                            <div key={entry._id} className={`queue-item ${entry.priority}`}>
                                <div className="queue-number">{entry.queueNumber}</div>
                                <div className="queue-patient">
                                    <div className="patient-name">
                                        {entry.patientId?.firstName} {entry.patientId?.lastName}
                                    </div>
                                    <div className="patient-phone">{entry.patientId?.phone}</div>
                                </div>
                                <div className="queue-priority">
                                    {getPriorityBadge(entry.priority)}
                                </div>
                                <div className="queue-wait">
                                    ~{entry.estimatedWaitTime || 0} daq
                                </div>
                                <div className="queue-actions">
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => handleCall(entry._id)}
                                        disabled={loading}
                                    >
                                        Chaqirish
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add to Queue Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>➕ Navbatga qo'shish</h3>
                            <button onClick={() => setShowAddModal(false)} className="close-btn">×</button>
                        </div>

                        <div className="modal-body">
                            <div className="form-group">
                                <label>👤 Bemor *</label>
                                <Combobox
                                    options={patients.map(p => ({ value: p._id, label: `${p.firstName} ${p.lastName} - ${p.phone}` }))}
                                    value={formData.patientId}
                                    onValueChange={(val) => setFormData({ ...formData, patientId: val })}
                                    placeholder="Bemorni tanlang"
                                    searchPlaceholder="Bemor ismini yozing..."
                                    emptyText="Bemor topilmadi"
                                />
                            </div>

                            <div className="form-group">
                                <label>👨‍⚕️ Shifokor *</label>
                                <Combobox
                                    options={doctors.map(d => ({ value: d._id, label: `${d.firstName} ${d.lastName} - ${d.spec || ''}` }))}
                                    value={formData.doctorId}
                                    onValueChange={(val) => setFormData({ ...formData, doctorId: val })}
                                    placeholder="Shifokorni tanlang"
                                    searchPlaceholder="Shifokor ismini yozing..."
                                    emptyText="Shifokor topilmadi"
                                />
                            </div>

                            <div className="form-group">
                                <label>⚡ Muhimlik darajasi</label>
                                <select
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                    className="form-control"
                                >
                                    <option value="normal">Oddiy</option>
                                    <option value="urgent">Shoshilinch</option>
                                    <option value="emergency">Favqulodda</option>
                                </select>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button onClick={() => setShowAddModal(false)} className="btn btn-secondary">
                                Bekor qilish
                            </button>
                            <button
                                onClick={handleAddToQueue}
                                className="btn btn-success"
                                disabled={loading || !formData.patientId || !formData.doctorId}
                            >
                                ✅ Navbatga qo'shish
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
