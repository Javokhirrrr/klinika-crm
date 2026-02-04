import { useState, useEffect } from 'react';
import { FiPlus, FiDollarSign, FiGrid } from 'react-icons/fi';
import http from '../lib/http';
import '../styles/simple-pages.css';

export default function SimpleServices() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadServices();
    }, []);

    const loadServices = async () => {
        try {
            setLoading(true);
            const res = await http.get('/services');
            setServices(res.items || res || []);
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
                    <h1>Xizmatlar</h1>
                    <p className="text-muted">Jami: {services.length} ta xizmat</p>
                </div>
                <button className="btn btn-primary btn-lg">
                    <FiPlus />
                    Yangi Xizmat
                </button>
            </div>

            {loading ? (
                <div className="loading-state">Yuklanmoqda...</div>
            ) : services.length === 0 ? (
                <div className="empty-state">
                    <FiGrid size={64} />
                    <p>Xizmatlar yo'q</p>
                </div>
            ) : (
                <div className="cards-grid">
                    {services.map((service) => (
                        <div key={service._id} className="simple-card">
                            <div style={{ marginBottom: '1rem' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>
                                    {service.name}
                                </h3>
                                {service.description && (
                                    <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', margin: 0 }}>
                                        {service.description}
                                    </p>
                                )}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>
                                    <FiDollarSign />
                                    {service.price?.toLocaleString()}
                                </div>
                                <span className="badge badge-info">{service.category || 'Umumiy'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
