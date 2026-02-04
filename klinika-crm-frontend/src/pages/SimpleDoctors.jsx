import { useState, useEffect } from 'react';
import { FiPlus, FiUser, FiPhone, FiMail } from 'react-icons/fi';
import http from '../lib/http';
import '../styles/simple-pages.css';

export default function SimpleDoctors() {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDoctors();
    }, []);

    const loadDoctors = async () => {
        try {
            setLoading(true);
            const res = await http.get('/users', { role: 'doctor' });
            setDoctors(res.items || res || []);
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
                    <h1>Shifokorlar</h1>
                    <p className="text-muted">Jami: {doctors.length} ta shifokor</p>
                </div>
                <button className="btn btn-primary btn-lg">
                    <FiPlus />
                    Yangi Shifokor
                </button>
            </div>

            {loading ? (
                <div className="loading-state">Yuklanmoqda...</div>
            ) : doctors.length === 0 ? (
                <div className="empty-state">
                    <FiUser size={64} />
                    <p>Shifokorlar yo'q</p>
                </div>
            ) : (
                <div className="cards-grid">
                    {doctors.map((doctor) => (
                        <div key={doctor._id} className="simple-card">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                <div style={{
                                    width: '64px',
                                    height: '64px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, var(--primary-500), var(--medical-500))',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '24px',
                                    fontWeight: 700,
                                    color: 'white'
                                }}>
                                    {doctor.name?.[0]}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 0.25rem 0' }}>
                                        {doctor.name}
                                    </h3>
                                    <span className="badge badge-success">Shifokor</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                                    <FiMail size={16} />
                                    {doctor.email}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                                    <FiPhone size={16} />
                                    {doctor.phone || 'N/A'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
