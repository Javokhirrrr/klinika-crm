import { useState, useEffect } from 'react';
import { FiPlus, FiCalendar, FiClock, FiUser, FiCheck, FiX, FiDollarSign, FiPrinter } from 'react-icons/fi';
import http from '../lib/http';
import '../styles/simple-pages.css';

export default function SimpleAppointments() {
    const [appointments, setAppointments] = useState([]);
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [formData, setFormData] = useState({
        patientId: '',
        doctorId: '',
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        notes: ''
    });
    const [paymentData, setPaymentData] = useState({
        amount: 0,
        method: 'cash',
        received: 0
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [appts, pats, docs] = await Promise.all([
                http.get('/appointments').catch(() => ({ items: [] })),
                http.get('/patients').catch(() => ({ items: [] })),
                http.get('/users', { role: 'doctor' }).catch(() => ({ items: [] }))
            ]);
            setAppointments(appts.items || appts || []);
            setPatients(pats.items || pats || []);
            setDoctors(docs.items || docs || []);
        } catch (error) {
            console.error('Load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await http.post('/appointments', {
                ...formData,
                startsAt: `${formData.date}T${formData.time}:00`
            });
            setShowModal(false);
            setFormData({ patientId: '', doctorId: '', date: new Date().toISOString().split('T')[0], time: '09:00', notes: '' });
            loadData();
        } catch (error) {
            console.error('Create error:', error);
            alert('Xatolik yuz berdi!');
        }
    };

    const handleOpenPayment = (apt) => {
        setSelectedAppointment(apt);
        setPaymentData({
            amount: apt.totalAmount || 0,
            method: 'cash',
            received: apt.totalAmount || 0
        });
        setShowPaymentModal(true);
    };

    const handlePayment = async () => {
        try {
            await http.post('/payments', {
                appointmentId: selectedAppointment._id,
                patientId: selectedAppointment.patientId._id,
                amount: paymentData.amount,
                method: paymentData.method
            });

            await http.put(`/appointments/${selectedAppointment._id}`, {
                status: 'completed'
            });

            alert('To\'lov muvaffaqiyatli amalga oshirildi!');
            setShowPaymentModal(false);
            loadData();
        } catch (error) {
            console.error('Payment error:', error);
            alert('To\'lov xatolik!');
        }
    };

    const calculateChange = () => {
        return paymentData.received - paymentData.amount;
    };

    const getStatusBadge = (status) => {
        const badges = {
            scheduled: { label: 'Rejalashtirilgan', class: 'badge badge-info' },
            in_progress: { label: 'Jarayonda', class: 'badge badge-warning' },
            completed: { label: 'Tugallangan', class: 'badge badge-success' },
            cancelled: { label: 'Bekor qilingan', class: 'badge badge-danger' }
        };
        return badges[status] || badges.scheduled;
    };

    return (
        <div className="simple-page">
            <div className="page-header">
                <div>
                    <h1>Qabullar</h1>
                    <p className="text-muted">Jami: {appointments.length} ta qabul</p>
                </div>
                <button className="btn btn-primary btn-lg" onClick={() => setShowModal(true)}>
                    <FiPlus />
                    Yangi Qabul
                </button>
            </div>

            {loading ? (
                <div className="loading-state">Yuklanmoqda...</div>
            ) : appointments.length === 0 ? (
                <div className="empty-state">
                    <FiCalendar size={64} />
                    <p>Qabullar yo'q</p>
                </div>
            ) : (
                <div className="simple-table">
                    <table>
                        <thead>
                            <tr>
                                <th>SANA</th>
                                <th>VAQT</th>
                                <th>BEMOR</th>
                                <th>SHIFOKOR</th>
                                <th>SUMMA</th>
                                <th>HOLAT</th>
                                <th>AMALLAR</th>
                            </tr>
                        </thead>
                        <tbody>
                            {appointments.map((apt) => {
                                const badge = getStatusBadge(apt.status);
                                return (
                                    <tr key={apt._id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <FiCalendar size={16} />
                                                {new Date(apt.startsAt).toLocaleDateString('uz-UZ')}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <FiClock size={16} />
                                                {new Date(apt.startsAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>
                                                {apt.patientId?.firstName} {apt.patientId?.lastName}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <FiUser size={16} />
                                                {apt.doctorId?.name || 'N/A'}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 700, color: 'var(--success)' }}>
                                                {apt.totalAmount?.toLocaleString() || '0'} so'm
                                            </div>
                                        </td>
                                        <td>
                                            <span className={badge.class}>{badge.label}</span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                {apt.status === 'scheduled' && (
                                                    <button
                                                        className="action-btn primary"
                                                        title="To'lov"
                                                        onClick={() => handleOpenPayment(apt)}
                                                    >
                                                        <FiDollarSign />
                                                    </button>
                                                )}
                                                <button className="action-btn danger" title="Bekor qilish">
                                                    <FiX />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add Appointment Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Yangi Qabul</h2>
                            <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Bemor *</label>
                                    <select
                                        className="input"
                                        required
                                        value={formData.patientId}
                                        onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                                    >
                                        <option value="">Tanlang</option>
                                        {patients.map(p => (
                                            <option key={p._id} value={p._id}>
                                                {p.firstName} {p.lastName} - {p.phone}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Shifokor *</label>
                                    <select
                                        className="input"
                                        required
                                        value={formData.doctorId}
                                        onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                                    >
                                        <option value="">Tanlang</option>
                                        {doctors.map(d => (
                                            <option key={d._id} value={d._id}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Sana *</label>
                                        <input
                                            type="date"
                                            className="input"
                                            required
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Vaqt *</label>
                                        <input
                                            type="time"
                                            className="input"
                                            required
                                            value={formData.time}
                                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Izoh</label>
                                    <textarea
                                        className="input"
                                        rows="3"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Bekor qilish
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Saqlash
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPaymentModal && selectedAppointment && (
                <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>To'lov</h2>
                            <button className="close-btn" onClick={() => setShowPaymentModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div style={{ padding: '1rem', background: 'var(--gray-50)', borderRadius: '12px', marginBottom: '1.5rem' }}>
                                <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                                    {selectedAppointment.patientId?.firstName} {selectedAppointment.patientId?.lastName}
                                </div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                                    {new Date(selectedAppointment.startsAt).toLocaleDateString('uz-UZ')}
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Summa *</label>
                                <input
                                    type="number"
                                    className="input"
                                    required
                                    value={paymentData.amount}
                                    onChange={(e) => setPaymentData({ ...paymentData, amount: Number(e.target.value) })}
                                    style={{ fontSize: '1.25rem', fontWeight: 700 }}
                                />
                            </div>

                            <div className="form-group">
                                <label>To'lov usuli *</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <button
                                        type="button"
                                        className={`btn ${paymentData.method === 'cash' ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => setPaymentData({ ...paymentData, method: 'cash' })}
                                    >
                                        💵 Naqd
                                    </button>
                                    <button
                                        type="button"
                                        className={`btn ${paymentData.method === 'card' ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => setPaymentData({ ...paymentData, method: 'card' })}
                                    >
                                        💳 Karta
                                    </button>
                                </div>
                            </div>

                            {paymentData.method === 'cash' && (
                                <>
                                    <div className="form-group">
                                        <label>Qabul qilingan summa</label>
                                        <input
                                            type="number"
                                            className="input"
                                            value={paymentData.received}
                                            onChange={(e) => setPaymentData({ ...paymentData, received: Number(e.target.value) })}
                                            style={{ fontSize: '1.25rem', fontWeight: 700 }}
                                        />
                                    </div>

                                    <div style={{
                                        padding: '1.5rem',
                                        background: calculateChange() >= 0 ? 'var(--success-light)' : 'var(--danger-light)',
                                        borderRadius: '12px',
                                        marginTop: '1rem'
                                    }}>
                                        <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--gray-700)' }}>
                                            Qaytim:
                                        </div>
                                        <div style={{
                                            fontSize: '2rem',
                                            fontWeight: 700,
                                            color: calculateChange() >= 0 ? 'var(--success)' : 'var(--danger)'
                                        }}>
                                            {calculateChange().toLocaleString()} so'm
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setShowPaymentModal(false)}
                            >
                                Bekor qilish
                            </button>
                            <button
                                type="button"
                                className="btn btn-success"
                                onClick={handlePayment}
                                disabled={paymentData.method === 'cash' && calculateChange() < 0}
                            >
                                <FiPrinter />
                                To'lov va Check
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
