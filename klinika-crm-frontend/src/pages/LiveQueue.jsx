// src/pages/LiveQueue.jsx
import { useState, useEffect } from 'react';
import { FiUsers, FiClock, FiPlay, FiCheckCircle, FiSkipForward, FiBell, FiSearch } from 'react-icons/fi';
import http from '../lib/http';
import '../styles/simple-pages.css';
import './LiveQueue.css';

export default function LiveQueue() {
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState('all');

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 30000); // 30s auto-refresh
        return () => clearInterval(interval);
    }, [selectedDoctor]);

    const loadData = async () => {
        try {
            const [appointments, docs] = await Promise.all([
                http.get('/appointments', {
                    status: 'waiting,in_progress',
                    doctorId: selectedDoctor !== 'all' ? selectedDoctor : undefined,
                    date: new Date().toISOString().split('T')[0]
                }),
                http.get('/users', { role: 'doctor' })
            ]);

            // Sort by time
            const items = (appointments.items || appointments || []).sort((a, b) =>
                new Date(a.startAt) - new Date(b.startAt)
            );

            setQueue(items);
            setDoctors(docs.items || docs || []);
        } catch (error) {
            console.error('Queue load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await http.patch(`/appointments/${id}/update-status`, { status });
            loadData();
        } catch (error) {
            alert(error?.response?.data?.message || 'Xatolik');
        }
    };

    const inProgress = queue.filter(q => q.status === 'in_progress');
    const waiting = queue.filter(q => q.status === 'waiting' || q.status === 'scheduled');

    return (
        <div className="simple-page">
            <div className="page-header">
                <div>
                    <h1>Jonli Navbat</h1>
                    <p className="text-muted">Bugungi qabullar va kutish ro'yxati</p>
                </div>
                <div className="header-filters">
                    <FiSearch className="filter-icon" />
                    <select
                        className="filter-select"
                        value={selectedDoctor}
                        onChange={(e) => setSelectedDoctor(e.target.value)}
                    >
                        <option value="all">Barcha shifokorlar</option>
                        {doctors.map(d => (
                            <option key={d._id} value={d._id}>{d.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="queue-grid">
                {/* Current Active Patients */}
                <div className="queue-section active-section">
                    <div className="section-header">
                        <FiPlay className="header-icon" />
                        <h2>Hozir Qabulda</h2>
                        <span className="count-badge">{inProgress.length}</span>
                    </div>

                    {inProgress.length === 0 ? (
                        <div className="empty-queue-card">Hozirda hech kim qabulda emas</div>
                    ) : (
                        <div className="queue-cards">
                            {inProgress.map(p => (
                                <div key={p._id} className="queue-card in-service">
                                    <div className="card-header">
                                        <div className="time">
                                            {new Date(p.startAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div className="doctor-tag">{p.doctorId?.name}</div>
                                    </div>
                                    <div className="patient-name">
                                        {p.patientId?.firstName} {p.patientId?.lastName}
                                    </div>
                                    <div className="card-actions">
                                        <button
                                            className="btn btn-success btn-sm"
                                            onClick={() => updateStatus(p._id, 'done')}
                                        >
                                            <FiCheckCircle /> Yakunlash
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Waiting Patients */}
                <div className="queue-section waiting-section">
                    <div className="section-header">
                        <FiClock className="header-icon" />
                        <h2>Navbatdagilar</h2>
                        <span className="count-badge">{waiting.length}</span>
                    </div>

                    {waiting.length === 0 ? (
                        <div className="empty-queue-card">Kutish ro'yxati bo'sh</div>
                    ) : (
                        <div className="queue-list">
                            {waiting.map((p, idx) => (
                                <div key={p._id} className={`queue-list-item ${idx === 0 ? 'next-in-line' : ''}`}>
                                    <div className="queue-time">
                                        {new Date(p.startAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className="queue-content">
                                        <div className="p-name">{p.patientId?.firstName} {p.patientId?.lastName}</div>
                                        <div className="d-name">{p.doctorId?.name}</div>
                                    </div>
                                    <div className="queue-actions">
                                        {idx === 0 && <span className="next-badge">Navbatdagi</span>}
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => updateStatus(p._id, 'in_progress')}
                                        >
                                            <FiPlay /> Chaqirish
                                        </button>
                                        <button className="btn btn-secondary btn-icon-sm">
                                            <FiBell />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
