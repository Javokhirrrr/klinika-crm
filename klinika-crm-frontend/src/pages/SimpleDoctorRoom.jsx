import { useState, useEffect } from 'react';
import { FiUser, FiCalendar, FiDollarSign, FiFileText, FiPrinter, FiSave } from 'react-icons/fi';
import http from '../lib/http';
import '../styles/simple-pages.css';
import './SimpleDoctorRoom.css';

export default function SimpleDoctorRoom() {
    const [appointments, setAppointments] = useState([]);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [services, setServices] = useState([]);
    const [selectedServices, setSelectedServices] = useState([]);
    const [diagnosis, setDiagnosis] = useState('');
    const [prescription, setPrescription] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [appts, servs] = await Promise.all([
                http.get('/appointments', { status: 'scheduled' }).catch(() => ({ items: [] })),
                http.get('/services').catch(() => ({ items: [] }))
            ]);
            setAppointments(appts.items || appts || []);
            setServices(servs.items || servs || []);
        } catch (error) {
            console.error('Load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAppointment = (apt) => {
        setSelectedAppointment(apt);
        setSelectedServices([]);
        setDiagnosis('');
        setPrescription('');
    };

    const handleAddService = (service) => {
        if (!selectedServices.find(s => s._id === service._id)) {
            setSelectedServices([...selectedServices, service]);
        }
    };

    const handleRemoveService = (serviceId) => {
        setSelectedServices(selectedServices.filter(s => s._id !== serviceId));
    };

    const calculateTotal = () => {
        return selectedServices.reduce((sum, s) => sum + (s.price || 0), 0);
    };

    const handleSave = async () => {
        if (!selectedAppointment) return;

        try {
            // Update appointment with diagnosis and prescription
            await http.put(`/appointments/${selectedAppointment._id}`, {
                diagnosis,
                prescription,
                services: selectedServices.map(s => s._id),
                status: 'completed'
            });

            alert('Qabul saqlandi!');
            loadData();
            setSelectedAppointment(null);
        } catch (error) {
            console.error('Save error:', error);
            alert('Xatolik yuz berdi!');
        }
    };

    return (
        <div className="simple-page doctor-room">
            <div className="page-header">
                <div>
                    <h1>Shifokor Xonasi</h1>
                    <p className="text-muted">Bugungi qabullar</p>
                </div>
            </div>

            <div className="doctor-room-layout">
                {/* Left: Appointments List */}
                <div className="appointments-sidebar">
                    <h3>Bugungi Qabullar</h3>
                    {loading ? (
                        <div className="loading-state">Yuklanmoqda...</div>
                    ) : appointments.length === 0 ? (
                        <div className="empty-state">
                            <FiCalendar size={48} />
                            <p>Qabullar yo'q</p>
                        </div>
                    ) : (
                        <div className="appointments-list">
                            {appointments.map((apt) => (
                                <div
                                    key={apt._id}
                                    className={`appointment-item ${selectedAppointment?._id === apt._id ? 'active' : ''}`}
                                    onClick={() => handleSelectAppointment(apt)}
                                >
                                    <div className="appointment-time">
                                        {new Date(apt.startsAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className="appointment-patient">
                                        {apt.patientId?.firstName} {apt.patientId?.lastName}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Patient Details & Work Area */}
                <div className="work-area">
                    {!selectedAppointment ? (
                        <div className="empty-state">
                            <FiUser size={64} />
                            <p>Qabulni tanlang</p>
                        </div>
                    ) : (
                        <>
                            {/* Patient Info */}
                            <div className="patient-card">
                                <div className="patient-avatar">
                                    {selectedAppointment.patientId?.firstName?.[0]}
                                    {selectedAppointment.patientId?.lastName?.[0]}
                                </div>
                                <div className="patient-info">
                                    <h2>{selectedAppointment.patientId?.firstName} {selectedAppointment.patientId?.lastName}</h2>
                                    <div className="patient-details">
                                        <span>📞 {selectedAppointment.patientId?.phone}</span>
                                        <span>🎂 {selectedAppointment.patientId?.birthDate ? new Date(selectedAppointment.patientId.birthDate).toLocaleDateString('uz-UZ') : 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Services */}
                            <div className="section">
                                <h3>Xizmatlar</h3>
                                <div className="services-grid">
                                    {services.map((service) => (
                                        <button
                                            key={service._id}
                                            className={`service-btn ${selectedServices.find(s => s._id === service._id) ? 'selected' : ''}`}
                                            onClick={() => handleAddService(service)}
                                        >
                                            <div className="service-name">{service.name}</div>
                                            <div className="service-price">{service.price?.toLocaleString()} so'm</div>
                                        </button>
                                    ))}
                                </div>

                                {selectedServices.length > 0 && (
                                    <div className="selected-services">
                                        <h4>Tanlangan xizmatlar:</h4>
                                        {selectedServices.map((service) => (
                                            <div key={service._id} className="selected-service-item">
                                                <span>{service.name}</span>
                                                <span>{service.price?.toLocaleString()} so'm</span>
                                                <button onClick={() => handleRemoveService(service._id)}>×</button>
                                            </div>
                                        ))}
                                        <div className="total">
                                            <strong>Jami:</strong>
                                            <strong>{calculateTotal().toLocaleString()} so'm</strong>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Diagnosis */}
                            <div className="section">
                                <h3>Tashxis</h3>
                                <textarea
                                    className="input"
                                    rows="4"
                                    placeholder="Tashxis kiriting..."
                                    value={diagnosis}
                                    onChange={(e) => setDiagnosis(e.target.value)}
                                />
                            </div>

                            {/* Prescription */}
                            <div className="section">
                                <h3>Retsept</h3>
                                <textarea
                                    className="input"
                                    rows="6"
                                    placeholder="Retsept kiriting..."
                                    value={prescription}
                                    onChange={(e) => setPrescription(e.target.value)}
                                />
                            </div>

                            {/* Actions */}
                            <div className="actions">
                                <button className="btn btn-secondary">
                                    <FiPrinter />
                                    Chop etish
                                </button>
                                <button className="btn btn-primary btn-lg" onClick={handleSave}>
                                    <FiSave />
                                    Saqlash
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
