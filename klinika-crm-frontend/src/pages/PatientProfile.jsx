// src/pages/PatientProfile.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FiUser, FiPhone, FiMail, FiCalendar, FiMapPin, FiHeart,
    FiFileText, FiDollarSign, FiClock, FiActivity, FiAlertCircle,
    FiPlus, FiEdit2, FiTrash2, FiDownload, FiUpload, FiX
} from 'react-icons/fi';
import http from '../lib/http';
import './PatientProfile.css';

export default function PatientProfile() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // overview, history, payments, appointments

    // Modals
    const [showMedicalRecordModal, setShowMedicalRecordModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);

    useEffect(() => {
        loadProfile();
    }, [id]);

    async function loadProfile() {
        try {
            setLoading(true);
            const result = await http.get(`/patients/${id}/full-profile`);
            setData(result);
        } catch (error) {
            console.error('Load profile error:', error);
            alert('Xatolik yuz berdi');
        } finally {
            setLoading(false);
        }
    }

    async function addMedicalRecord(formData) {
        try {
            await http.post(`/patients/${id}/medical-record`, formData);
            await loadProfile();
            setShowMedicalRecordModal(false);
        } catch (error) {
            alert(error?.response?.data?.message || 'Xatolik');
        }
    }

    async function addPayment(formData) {
        try {
            await http.post(`/patients/${id}/payment`, formData);
            await loadProfile();
            setShowPaymentModal(false);
        } catch (error) {
            alert(error?.response?.data?.message || 'Xatolik');
        }
    }

    if (loading) {
        return (
            <div className="patient-profile-page">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Yuklanmoqda...</p>
                </div>
            </div>
        );
    }

    if (!data || !data.patient) {
        return (
            <div className="patient-profile-page">
                <div className="empty-state">
                    <FiUser size={64} />
                    <h3>Bemor topilmadi</h3>
                    <button className="btn-primary" onClick={() => navigate('/patients')}>
                        Orqaga
                    </button>
                </div>
            </div>
        );
    }

    const { patient, appointments, statistics } = data;

    return (
        <div className="patient-profile-page">
            {/* Header */}
            <div className="profile-header">
                <button className="btn-back" onClick={() => navigate('/patients')}>
                    ← Orqaga
                </button>
                <div className="header-content">
                    <div className="patient-avatar-large">
                        {patient.avatar ? (
                            <img src={patient.avatar} alt={patient.firstName} />
                        ) : (
                            <div className="avatar-placeholder-large">
                                {patient.firstName?.[0]}{patient.lastName?.[0]}
                            </div>
                        )}
                    </div>
                    <div className="patient-main-info">
                        <h1>{patient.firstName} {patient.lastName}</h1>
                        <div className="patient-meta">
                            {patient.cardNo && <span className="card-badge">📋 {patient.cardNo}</span>}
                            {patient.membershipLevel && (
                                <span className={`membership-badge ${patient.membershipLevel}`}>
                                    ⭐ {patient.membershipLevel.toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div className="patient-contacts">
                            {patient.phone && (
                                <div className="contact-item">
                                    <FiPhone /> {patient.phone}
                                </div>
                            )}
                            {patient.email && (
                                <div className="contact-item">
                                    <FiMail /> {patient.email}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="header-actions">
                        <button className="btn-primary" onClick={() => navigate(`/patients/${id}/edit`)}>
                            <FiEdit2 /> Tahrirlash
                        </button>
                        <button className="btn-secondary" onClick={() => setShowMedicalRecordModal(true)}>
                            <FiPlus /> Tashxis Qo'shish
                        </button>
                        <button className="btn-secondary" onClick={() => setShowPaymentModal(true)}>
                            <FiDollarSign /> To'lov Qo'shish
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon visits">
                        <FiActivity />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{statistics.totalVisits || 0}</div>
                        <div className="stat-label">Tashriflar</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon records">
                        <FiFileText />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{statistics.totalMedicalRecords || 0}</div>
                        <div className="stat-label">Tashxislar</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon payments">
                        <FiDollarSign />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{(statistics.totalPaid || 0).toLocaleString()} so'm</div>
                        <div className="stat-label">To'langan</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon balance">
                        <FiAlertCircle />
                    </div>
                    <div className="stat-content">
                        <div className={`stat-value ${(statistics.balance || 0) < 0 ? 'negative' : 'positive'}`}>
                            {(statistics.balance || 0).toLocaleString()} so'm
                        </div>
                        <div className="stat-label">Balans</div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="profile-tabs">
                <button
                    className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    <FiUser /> Umumiy Ma'lumot
                </button>
                <button
                    className={`tab ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    <FiFileText /> Kasallik Tarixi ({statistics.totalMedicalRecords || 0})
                </button>
                <button
                    className={`tab ${activeTab === 'payments' ? 'active' : ''}`}
                    onClick={() => setActiveTab('payments')}
                >
                    <FiDollarSign /> To'lovlar ({statistics.totalPayments || 0})
                </button>
                <button
                    className={`tab ${activeTab === 'appointments' ? 'active' : ''}`}
                    onClick={() => setActiveTab('appointments')}
                >
                    <FiCalendar /> Qabullar ({appointments.total || 0})
                </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {activeTab === 'overview' && (
                    <OverviewTab patient={patient} />
                )}

                {activeTab === 'history' && (
                    <MedicalHistoryTab
                        history={patient.medicalHistory || []}
                        onEdit={setEditingRecord}
                        onRefresh={loadProfile}
                    />
                )}

                {activeTab === 'payments' && (
                    <PaymentsTab
                        history={patient.paymentHistory || []}
                        balance={statistics.balance}
                        loyaltyPoints={statistics.loyaltyPoints}
                    />
                )}

                {activeTab === 'appointments' && (
                    <AppointmentsTab appointments={appointments.items || []} />
                )}
            </div>

            {/* Medical Record Modal */}
            {showMedicalRecordModal && (
                <MedicalRecordModal
                    onClose={() => setShowMedicalRecordModal(false)}
                    onSave={addMedicalRecord}
                />
            )}

            {/* Payment Modal */}
            {showPaymentModal && (
                <PaymentModal
                    onClose={() => setShowPaymentModal(false)}
                    onSave={addPayment}
                />
            )}
        </div>
    );
}

// ===== OVERVIEW TAB =====
function OverviewTab({ patient }) {
    const calculateAge = (dob) => {
        if (!dob) return null;
        const diff = Date.now() - new Date(dob).getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    };

    return (
        <div className="overview-grid">
            <div className="info-card">
                <h3>Shaxsiy Ma'lumotlar</h3>
                <div className="info-rows">
                    <InfoRow label="Ism Familiya" value={`${patient.firstName} ${patient.lastName || ''}`} />
                    <InfoRow label="Tug'ilgan Sana" value={patient.dob ? new Date(patient.dob).toLocaleDateString('uz-UZ') : '—'} />
                    <InfoRow label="Yosh" value={patient.dob ? `${calculateAge(patient.dob)} yosh` : '—'} />
                    <InfoRow label="Jinsi" value={patient.gender === 'male' ? 'Erkak' : patient.gender === 'female' ? 'Ayol' : '—'} />
                    <InfoRow label="Qon Guruhi" value={patient.bloodType || '—'} />
                    <InfoRow label="Telefon" value={patient.phone || '—'} />
                    <InfoRow label="Email" value={patient.email || '—'} />
                    <InfoRow label="Manzil" value={patient.address || '—'} />
                </div>
            </div>

            <div className="info-card">
                <h3>Tibbiy Ma'lumotlar</h3>
                <div className="info-rows">
                    <InfoRow label="Allergiyalar" value={patient.allergies?.length ? patient.allergies.join(', ') : 'Yo\'q'} />
                    <InfoRow label="Surunkali Kasalliklar" value={patient.chronicDiseases?.length ? patient.chronicDiseases.join(', ') : 'Yo\'q'} />
                    <InfoRow label="Shikoyat" value={patient.complaint || '—'} />
                </div>
            </div>

            {patient.emergencyContact?.name && (
                <div className="info-card">
                    <h3>Favqulodda Aloqa</h3>
                    <div className="info-rows">
                        <InfoRow label="Ism" value={patient.emergencyContact.name} />
                        <InfoRow label="Munosabat" value={patient.emergencyContact.relationship || '—'} />
                        <InfoRow label="Telefon" value={patient.emergencyContact.phone || '—'} />
                    </div>
                </div>
            )}

            {patient.insuranceInfo?.provider && (
                <div className="info-card">
                    <h3>Sug'urta Ma'lumotlari</h3>
                    <div className="info-rows">
                        <InfoRow label="Provayder" value={patient.insuranceInfo.provider} />
                        <InfoRow label="Polisiya Raqami" value={patient.insuranceInfo.policyNumber || '—'} />
                        <InfoRow label="Amal Qilish Muddati" value={patient.insuranceInfo.validUntil ? new Date(patient.insuranceInfo.validUntil).toLocaleDateString('uz-UZ') : '—'} />
                    </div>
                </div>
            )}
        </div>
    );
}

function InfoRow({ label, value }) {
    return (
        <div className="info-row">
            <span className="info-label">{label}:</span>
            <span className="info-value">{value}</span>
        </div>
    );
}

// ===== MEDICAL HISTORY TAB =====
function MedicalHistoryTab({ history, onEdit, onRefresh }) {
    if (history.length === 0) {
        return (
            <div className="empty-state">
                <FiFileText size={48} />
                <p>Kasallik tarixi yo'q</p>
            </div>
        );
    }

    return (
        <div className="history-list">
            {history.map((record, index) => (
                <div key={record._id || index} className="history-card">
                    <div className="history-header">
                        <div className="history-date">
                            <FiCalendar />
                            {new Date(record.date).toLocaleDateString('uz-UZ', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </div>
                        {record.doctorId && (
                            <div className="history-doctor">
                                👨‍⚕️ {record.doctorId.firstName} {record.doctorId.lastName}
                                {record.doctorId.spec && <span className="doctor-spec">({record.doctorId.spec})</span>}
                            </div>
                        )}
                        <span className={`status-badge ${record.status}`}>
                            {record.status === 'active' ? 'Faol' : record.status === 'resolved' ? 'Hal qilindi' : 'Davom etmoqda'}
                        </span>
                    </div>

                    <div className="history-body">
                        {record.diagnosis && (
                            <div className="history-field">
                                <strong>Tashxis:</strong> {record.diagnosis}
                            </div>
                        )}
                        {record.symptoms && (
                            <div className="history-field">
                                <strong>Alomatlar:</strong> {record.symptoms}
                            </div>
                        )}
                        {record.prescription && (
                            <div className="history-field">
                                <strong>Retsept:</strong> {record.prescription}
                            </div>
                        )}
                        {record.labResults && (
                            <div className="history-field">
                                <strong>Tahlil Natijalari:</strong> {record.labResults}
                            </div>
                        )}
                        {record.notes && (
                            <div className="history-field">
                                <strong>Izohlar:</strong> {record.notes}
                            </div>
                        )}
                        {record.followUpDate && (
                            <div className="history-field">
                                <strong>Keyingi Ko'rik:</strong> {new Date(record.followUpDate).toLocaleDateString('uz-UZ')}
                            </div>
                        )}
                    </div>

                    {record.files && record.files.length > 0 && (
                        <div className="history-files">
                            <strong>Fayllar:</strong>
                            {record.files.map((file, idx) => (
                                <a key={idx} href={file.url} target="_blank" rel="noopener noreferrer" className="file-link">
                                    <FiDownload /> {file.filename || `File ${idx + 1}`}
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

// ===== PAYMENTS TAB =====
function PaymentsTab({ history, balance, loyaltyPoints }) {
    return (
        <div className="payments-container">
            <div className="payments-summary">
                <div className="summary-card">
                    <div className="summary-label">Balans</div>
                    <div className={`summary-value ${balance < 0 ? 'negative' : 'positive'}`}>
                        {balance.toLocaleString()} so'm
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-label">Loyallik Ballari</div>
                    <div className="summary-value">{loyaltyPoints || 0} ball</div>
                </div>
            </div>

            {history.length === 0 ? (
                <div className="empty-state">
                    <FiDollarSign size={48} />
                    <p>To'lovlar tarixi yo'q</p>
                </div>
            ) : (
                <div className="payments-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Sana</th>
                                <th>Summa</th>
                                <th>Usul</th>
                                <th>Tavsif</th>
                                <th>Chek №</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((payment, index) => (
                                <tr key={payment._id || index}>
                                    <td>{new Date(payment.date).toLocaleDateString('uz-UZ')}</td>
                                    <td className="amount">{payment.amount.toLocaleString()} so'm</td>
                                    <td>
                                        <span className={`payment-method ${payment.paymentMethod}`}>
                                            {payment.paymentMethod === 'cash' ? 'Naqd' :
                                                payment.paymentMethod === 'card' ? 'Karta' :
                                                    payment.paymentMethod === 'transfer' ? 'O\'tkazma' : 'Sug\'urta'}
                                        </span>
                                    </td>
                                    <td>{payment.description || '—'}</td>
                                    <td>{payment.receiptNumber || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ===== APPOINTMENTS TAB =====
function AppointmentsTab({ appointments }) {
    if (appointments.length === 0) {
        return (
            <div className="empty-state">
                <FiCalendar size={48} />
                <p>Qabullar yo'q</p>
            </div>
        );
    }

    return (
        <div className="appointments-list">
            {appointments.map((apt) => (
                <div key={apt._id} className="appointment-card">
                    <div className="appointment-date">
                        <FiCalendar />
                        {new Date(apt.date).toLocaleDateString('uz-UZ', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </div>
                    {apt.doctorId && (
                        <div className="appointment-doctor">
                            👨‍⚕️ {apt.doctorId.firstName} {apt.doctorId.lastName}
                            {apt.doctorId.spec && <span> - {apt.doctorId.spec}</span>}
                        </div>
                    )}
                    <span className={`status-badge ${apt.status}`}>
                        {apt.status === 'pending' ? 'Kutilmoqda' :
                            apt.status === 'confirmed' ? 'Tasdiqlangan' :
                                apt.status === 'completed' ? 'Yakunlangan' : apt.status}
                    </span>
                </div>
            ))}
        </div>
    );
}

// ===== MEDICAL RECORD MODAL =====
function MedicalRecordModal({ onClose, onSave }) {
    const [form, setForm] = useState({
        diagnosis: '',
        symptoms: '',
        prescription: '',
        labResults: '',
        notes: '',
        followUpDate: '',
        status: 'active'
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(form);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Yangi Tashxis Qo'shish</h2>
                    <button className="modal-close" onClick={onClose}><FiX /></button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-group">
                        <label>Tashxis *</label>
                        <input
                            type="text"
                            className="form-input"
                            value={form.diagnosis}
                            onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Alomatlar</label>
                        <textarea
                            className="form-textarea"
                            rows={3}
                            value={form.symptoms}
                            onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label>Retsept</label>
                        <textarea
                            className="form-textarea"
                            rows={3}
                            value={form.prescription}
                            onChange={(e) => setForm({ ...form, prescription: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label>Tahlil Natijalari</label>
                        <textarea
                            className="form-textarea"
                            rows={2}
                            value={form.labResults}
                            onChange={(e) => setForm({ ...form, labResults: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label>Izohlar</label>
                        <textarea
                            className="form-textarea"
                            rows={2}
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Keyingi Ko'rik Sanasi</label>
                            <input
                                type="date"
                                className="form-input"
                                value={form.followUpDate}
                                onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Holat</label>
                            <select
                                className="form-select"
                                value={form.status}
                                onChange={(e) => setForm({ ...form, status: e.target.value })}
                            >
                                <option value="active">Faol</option>
                                <option value="ongoing">Davom etmoqda</option>
                                <option value="resolved">Hal qilindi</option>
                            </select>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Bekor qilish
                        </button>
                        <button type="submit" className="btn-primary">
                            💾 Saqlash
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ===== PAYMENT MODAL =====
function PaymentModal({ onClose, onSave }) {
    const [form, setForm] = useState({
        amount: '',
        paymentMethod: 'cash',
        description: '',
        receiptNumber: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...form,
            amount: Number(form.amount)
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Yangi To'lov Qo'shish</h2>
                    <button className="modal-close" onClick={onClose}><FiX /></button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-group">
                        <label>Summa (so'm) *</label>
                        <input
                            type="number"
                            className="form-input"
                            value={form.amount}
                            onChange={(e) => setForm({ ...form, amount: e.target.value })}
                            required
                            min="0"
                        />
                    </div>

                    <div className="form-group">
                        <label>To'lov Usuli *</label>
                        <select
                            className="form-select"
                            value={form.paymentMethod}
                            onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                            required
                        >
                            <option value="cash">Naqd</option>
                            <option value="card">Karta</option>
                            <option value="transfer">O'tkazma</option>
                            <option value="insurance">Sug'urta</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Tavsif</label>
                        <input
                            type="text"
                            className="form-input"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="Xizmat nomi yoki izoh"
                        />
                    </div>

                    <div className="form-group">
                        <label>Chek Raqami</label>
                        <input
                            type="text"
                            className="form-input"
                            value={form.receiptNumber}
                            onChange={(e) => setForm({ ...form, receiptNumber: e.target.value })}
                            placeholder="Ixtiyoriy"
                        />
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Bekor qilish
                        </button>
                        <button type="submit" className="btn-primary">
                            💰 To'lov Qo'shish
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
