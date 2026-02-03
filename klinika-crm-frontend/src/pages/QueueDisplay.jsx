import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './QueueDisplay.css';

const QueueDisplay = () => {
    const [departments, setDepartments] = useState([]);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [error, setError] = useState(null);
    const [alert, setAlert] = useState(null);
    const audioRef = useRef(null);
    const lastCalledRef = useRef(new Set()); // Track called patients

    const getOrgId = () => {
        const params = new URLSearchParams(window.location.search);
        const urlOrgId = params.get('orgId');
        if (urlOrgId) return urlOrgId;

        try {
            const org = JSON.parse(localStorage.getItem('org') || '{}');
            return org.id || localStorage.getItem('orgId');
        } catch {
            return localStorage.getItem('orgId');
        }
    };

    const orgId = getOrgId();

    const fetchQueueData = async () => {
        if (!orgId) {
            setError('Organization ID topilmadi. URL\'ga ?orgId=... qo\'shing');
            return;
        }

        try {
            const response = await axios.get(`http://localhost:5000/api/queue/public/display?orgId=${orgId}`);
            const { departments: newDepartments, lastUpdated } = response.data;

            // Check for newly called patients
            newDepartments.forEach(dept => {
                if (dept.currentPatient) {
                    const key = `${dept.doctorId}-${dept.currentPatient.queueNumber}`;

                    if (!lastCalledRef.current.has(key)) {
                        // Play sound
                        if (audioRef.current) {
                            audioRef.current.currentTime = 0;
                            audioRef.current.play().catch(err => console.error('Sound error:', err));
                        }

                        // Show alert
                        setAlert({
                            doctorName: dept.doctorName,
                            queueNumber: dept.currentPatient.queueNumber,
                            initials: dept.currentPatient.initials
                        });

                        lastCalledRef.current.add(key);

                        // Auto-hide after 10 seconds
                        setTimeout(() => setAlert(null), 10000);
                    }
                }
            });

            setDepartments(newDepartments);
            setLastUpdated(lastUpdated);
            setError(null);
        } catch (error) {
            console.error('Error fetching queue data:', error);
            setError('Ma\'lumotlarni yuklashda xatolik');
        }
    };

    // Update current time
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Fetch data every 3 seconds
    useEffect(() => {
        if (!orgId) return;

        fetchQueueData();
        const interval = setInterval(fetchQueueData, 3000); // Every 3 seconds

        return () => clearInterval(interval);
    }, [orgId]);

    const formatTime = (date) => {
        return date.toLocaleTimeString('uz-UZ', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const getDepartmentColor = (spec) => {
        const colors = {
            'Terapevt': '#4CAF50',
            'Kardiolog': '#2196F3',
            'Nevrolog': '#9C27B0',
            'Pediatr': '#FF9800',
            'Oftalmolog': '#00BCD4',
            'Lor': '#E91E63',
            'Dermatolog': '#795548',
            'Ginekolog': '#F06292',
            'Urolog': '#3F51B5',
            'Endokrinolog': '#009688'
        };
        return colors[spec] || '#607D8B';
    };

    return (
        <div className="queue-display">
            <audio ref={audioRef} src="/sounds/notification.mp3" preload="auto" />

            {/* Header */}
            <div className="display-header">
                <h1>🏥 KLINIKA NAVBAT TIZIMI</h1>
                <div className="header-info">
                    <div className="current-time">{formatTime(currentTime)}</div>
                    <div className="last-updated">
                        Yangilangan: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString('uz-UZ') : '-'}
                    </div>
                </div>
            </div>

            {error && (
                <div className="error-message">⚠️ {error}</div>
            )}

            {/* Alert Banner */}
            {alert && (
                <div className="alert-banner">
                    <div className="alert-title">🔔 SIZNING NAVBATINGIZ!</div>
                    <div className="alert-number">№{alert.queueNumber} {alert.initials}</div>
                    <div className="alert-doctor">{alert.doctorName}</div>
                </div>
            )}

            {/* Departments Grid */}
            <div className="departments-grid">
                {departments.length === 0 && !error ? (
                    <div className="empty-state">
                        <div className="empty-icon">📋</div>
                        <div className="empty-text">Hozirda navbat yo'q</div>
                    </div>
                ) : (
                    departments.map((dept, index) => (
                        <div key={index} className="department-card" style={{
                            borderTop: `6px solid ${getDepartmentColor(dept.specialization)}`
                        }}>
                            <div className="department-header" style={{
                                background: getDepartmentColor(dept.specialization)
                            }}>
                                <h2>{dept.specialization || dept.doctorName}</h2>
                                <div className="doctor-name">{dept.doctorName}</div>
                            </div>

                            <div className="department-body">
                                {dept.currentPatient ? (
                                    <div className="current-patient">
                                        <div className="patient-label">Hozir:</div>
                                        <div className="patient-info">
                                            <div className="patient-number">№{dept.currentPatient.queueNumber}</div>
                                            <div className="patient-initials">{dept.currentPatient.initials}</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="no-current">Hozir: -</div>
                                )}

                                <div className="waiting-section">
                                    <div className="waiting-label">
                                        Navbatda: ({dept.waitingQueue?.length || 0})
                                    </div>
                                    <div className="waiting-list">
                                        {dept.waitingQueue && dept.waitingQueue.length > 0 ? (
                                            dept.waitingQueue.slice(0, 5).map((patient, idx) => (
                                                <div key={idx} className={`waiting-item ${idx === 0 ? 'next-patient' : ''}`}>
                                                    <span className="waiting-number">№{patient.queueNumber}</span>
                                                    <span className="waiting-initials">{patient.initials}</span>
                                                    {idx === 0 && <span className="next-badge">Keyingi</span>}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="no-waiting">Navbat yo'q</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default QueueDisplay;
