import { useState, useEffect } from 'react';
import { FiPlus, FiClock, FiBell } from 'react-icons/fi';
import http from '../lib/http';
import { queueAPI } from '../api/newFeatures';
import '../styles/simple-pages.css';

export default function SimpleQueue() {
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadQueue();
        const interval = setInterval(loadQueue, 5000); // Auto-refresh every 5s
        return () => clearInterval(interval);
    }, []);

    const loadQueue = async () => {
        try {
            const res = await queueAPI.getCurrent();
            setQueue(res.data?.queue || []);
            setLoading(false);
        } catch (error) {
            console.error('Load error:', error);
            setLoading(false);
        }
    };

    const handleCall = async (id) => {
        try {
            await queueAPI.call(id);
            loadQueue();
        } catch (error) {
            console.error('Call error:', error);
        }
    };

    const waitingCount = queue.filter(q => q.status === 'waiting').length;

    return (
        <div className="simple-page">
            <div className="page-header">
                <div>
                    <h1>Navbat</h1>
                    <p className="text-muted">Kutmoqda: {waitingCount} ta bemor</p>
                </div>
                <button className="btn btn-primary btn-lg" onClick={() => window.open('/queue-display', '_blank')}>
                    📺 Displey Ekrani
                </button>
            </div>

            {loading ? (
                <div className="loading-state">Yuklanmoqda...</div>
            ) : queue.length === 0 ? (
                <div className="empty-state">
                    <FiClock size={64} />
                    <p>Navbat bo'sh</p>
                </div>
            ) : (
                <div className="cards-grid">
                    {queue.map((item, index) => (
                        <div key={item._id} className="simple-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-600)' }}>
                                    №{index + 1}
                                </div>
                                <span className={`badge ${item.status === 'waiting' ? 'badge-warning' : item.status === 'called' ? 'badge-success' : 'badge-gray'}`}>
                                    {item.status === 'waiting' ? 'Kutmoqda' : item.status === 'called' ? 'Chaqirildi' : 'Tugallandi'}
                                </span>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                    {item.patientId?.firstName} {item.patientId?.lastName}
                                </div>
                                <div style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>
                                    {item.doctorId?.name || 'Shifokor tanlanmagan'}
                                </div>
                            </div>
                            {item.status === 'waiting' && (
                                <button
                                    className="btn btn-success"
                                    style={{ width: '100%' }}
                                    onClick={() => handleCall(item._id)}
                                >
                                    <FiBell />
                                    CHAQIRISH
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
