import { useState, useEffect } from 'react';
import { FiPlus, FiSearch, FiPhone, FiCalendar, FiDollarSign, FiFilter, FiDownload, FiX } from 'react-icons/fi';
import http from '../lib/http';
import '../styles/design-system.css';
import './SimplePatients.css';

export default function SimplePatients() {
    const [patients, setPatients] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [filterGender, setFilterGender] = useState('all');
    const [filterDebt, setFilterDebt] = useState('all');
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        birthDate: '',
        gender: 'male',
        address: ''
    });

    useEffect(() => {
        loadPatients();
    }, []);

    const loadPatients = async () => {
        try {
            setLoading(true);
            const res = await http.get('/patients');
            setPatients(res.items || res || []);
        } catch (error) {
            console.error('Load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const newPatient = await http.post('/patients', formData);

            // Generate patient card
            if (newPatient._id) {
                generatePatientCard(newPatient);
            }

            setShowModal(false);
            setFormData({ firstName: '', lastName: '', phone: '', birthDate: '', gender: 'male', address: '' });
            loadPatients();
        } catch (error) {
            console.error('Create error:', error);
            alert('Xatolik yuz berdi!');
        }
    };

    const generatePatientCard = (patient) => {
        // Generate patient ID card number
        const cardNumber = `P${Date.now().toString().slice(-8)}`;

        // Create printable card
        const cardHTML = `
            <div style="width: 350px; padding: 20px; border: 2px solid #007AFF; border-radius: 12px; font-family: Arial;">
                <div style="text-align: center; margin-bottom: 15px;">
                    <h2 style="margin: 0; color: #007AFF;">BEMOR KARTOCHKASI</h2>
                    <p style="margin: 5px 0; font-size: 14px; color: #666;">Klinika CRM</p>
                </div>
                <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <div style="font-size: 24px; font-weight: bold; text-align: center; color: #007AFF;">
                        ${cardNumber}
                    </div>
                </div>
                <div style="margin-bottom: 10px;">
                    <strong>Ism:</strong> ${patient.firstName} ${patient.lastName}
                </div>
                <div style="margin-bottom: 10px;">
                    <strong>Telefon:</strong> ${patient.phone}
                </div>
                <div style="margin-bottom: 10px;">
                    <strong>Tug'ilgan sana:</strong> ${patient.birthDate ? new Date(patient.birthDate).toLocaleDateString('uz-UZ') : 'N/A'}
                </div>
                <div style="margin-bottom: 10px;">
                    <strong>Jins:</strong> ${patient.gender === 'male' ? 'Erkak' : 'Ayol'}
                </div>
                <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd; text-align: center; font-size: 12px; color: #666;">
                    Ushbu kartochkani har safar klinikaga kelganingizda ko'rsating
                </div>
            </div>
        `;

        // Open print window
        const printWindow = window.open('', '', 'width=400,height=600');
        printWindow.document.write(cardHTML);
        printWindow.document.close();
        printWindow.print();
    };

    const handleViewDetails = async (patient) => {
        try {
            // Load patient details with history
            const [appointments, payments] = await Promise.all([
                http.get('/appointments', { patientId: patient._id }).catch(() => ({ items: [] })),
                http.get('/payments', { patientId: patient._id }).catch(() => ({ items: [] }))
            ]);

            setSelectedPatient({
                ...patient,
                appointments: appointments.items || appointments || [],
                payments: payments.items || payments || []
            });
            setShowDetailsModal(true);
        } catch (error) {
            console.error('Load details error:', error);
        }
    };

    const filteredPatients = patients.filter(p => {
        const matchesSearch = `${p.firstName} ${p.lastName} ${p.phone}`.toLowerCase().includes(search.toLowerCase());
        const matchesGender = filterGender === 'all' || p.gender === filterGender;
        const matchesDebt = filterDebt === 'all' ||
            (filterDebt === 'has_debt' && p.debt > 0) ||
            (filterDebt === 'no_debt' && (!p.debt || p.debt === 0));

        return matchesSearch && matchesGender && matchesDebt;
    });

    const calculateAge = (birthDate) => {
        if (!birthDate) return '-';
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    return (
        <div className="simple-page">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1>Bemorlar</h1>
                    <p className="text-muted">Jami: {patients.length} ta bemor</p>
                </div>
                <button className="btn btn-primary btn-lg" onClick={() => setShowModal(true)}>
                    <FiPlus />
                    Yangi Bemor
                </button>
            </div>

            {/* Filters */}
            <div className="filters-bar">
                <div className="search-box">
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Bemor qidirish (ism, telefon)..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="filters">
                    <select
                        className="filter-select"
                        value={filterGender}
                        onChange={(e) => setFilterGender(e.target.value)}
                    >
                        <option value="all">Barcha jinslar</option>
                        <option value="male">Erkak</option>
                        <option value="female">Ayol</option>
                    </select>

                    <select
                        className="filter-select"
                        value={filterDebt}
                        onChange={(e) => setFilterDebt(e.target.value)}
                    >
                        <option value="all">Barcha bemorlar</option>
                        <option value="has_debt">Qarzdorlar</option>
                        <option value="no_debt">Qarzi yo'q</option>
                    </select>
                </div>
            </div>

            {/* Patients Grid */}
            {loading ? (
                <div className="loading-state">Yuklanmoqda...</div>
            ) : filteredPatients.length === 0 ? (
                <div className="empty-state">
                    <FiSearch size={64} />
                    <p>Bemorlar topilmadi</p>
                </div>
            ) : (
                <div className="patients-grid">
                    {filteredPatients.map((patient) => (
                        <div
                            key={patient._id}
                            className="patient-card"
                            onClick={() => handleViewDetails(patient)}
                        >
                            <div className="patient-avatar">
                                {patient.firstName?.[0]}{patient.lastName?.[0]}
                            </div>
                            <div className="patient-info">
                                <h3 className="patient-name">
                                    {patient.firstName} {patient.lastName}
                                </h3>
                                <div className="patient-details">
                                    <div className="detail-item">
                                        <FiPhone size={14} />
                                        <span>{patient.phone}</span>
                                    </div>
                                    <div className="detail-item">
                                        <FiCalendar size={14} />
                                        <span>{calculateAge(patient.birthDate)} yosh</span>
                                    </div>
                                    {patient.debt > 0 && (
                                        <div className="detail-item debt">
                                            <FiDollarSign size={14} />
                                            <span>Qarz: {patient.debt?.toLocaleString()} so'm</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Patient Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Yangi Bemor</h2>
                            <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Ism *</label>
                                    <input
                                        type="text"
                                        className="input"
                                        required
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Familiya *</label>
                                    <input
                                        type="text"
                                        className="input"
                                        required
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Telefon *</label>
                                    <input
                                        type="tel"
                                        className="input"
                                        required
                                        placeholder="+998 90 123 45 67"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Tug'ilgan sana</label>
                                    <input
                                        type="date"
                                        className="input"
                                        value={formData.birthDate}
                                        onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Jins</label>
                                    <select
                                        className="input"
                                        value={formData.gender}
                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                    >
                                        <option value="male">Erkak</option>
                                        <option value="female">Ayol</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Manzil</label>
                                    <textarea
                                        className="input"
                                        rows="2"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Bekor qilish
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    <FiDownload />
                                    Saqlash va Kartochka
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Patient Details Modal */}
            {showDetailsModal && selectedPatient && (
                <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
                    <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{selectedPatient.firstName} {selectedPatient.lastName}</h2>
                            <button className="close-btn" onClick={() => setShowDetailsModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            {/* Patient Info */}
                            <div className="patient-info-section">
                                <h3>Asosiy Ma'lumotlar</h3>
                                <div className="info-grid">
                                    <div className="info-item">
                                        <span className="info-label">Telefon:</span>
                                        <span className="info-value">{selectedPatient.phone}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Yosh:</span>
                                        <span className="info-value">{calculateAge(selectedPatient.birthDate)} yosh</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Jins:</span>
                                        <span className="info-value">{selectedPatient.gender === 'male' ? 'Erkak' : 'Ayol'}</span>
                                    </div>
                                    {selectedPatient.debt > 0 && (
                                        <div className="info-item">
                                            <span className="info-label">Qarz:</span>
                                            <span className="info-value" style={{ color: 'var(--danger)', fontWeight: 700 }}>
                                                {selectedPatient.debt?.toLocaleString()} so'm
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Appointments History */}
                            <div className="history-section">
                                <h3>Qabullar Tarixi ({selectedPatient.appointments?.length || 0})</h3>
                                {selectedPatient.appointments?.length > 0 ? (
                                    <div className="history-list">
                                        {selectedPatient.appointments.map((apt) => (
                                            <div key={apt._id} className="history-item">
                                                <div className="history-date">
                                                    {new Date(apt.startsAt).toLocaleDateString('uz-UZ')}
                                                </div>
                                                <div className="history-content">
                                                    <div><strong>Shifokor:</strong> {apt.doctorId?.name || 'N/A'}</div>
                                                    {apt.diagnosis && <div><strong>Tashxis:</strong> {apt.diagnosis}</div>}
                                                    {apt.prescription && <div><strong>Retsept:</strong> {apt.prescription}</div>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted">Qabullar tarixi yo'q</p>
                                )}
                            </div>

                            {/* Payments History */}
                            <div className="history-section">
                                <h3>To'lovlar Tarixi ({selectedPatient.payments?.length || 0})</h3>
                                {selectedPatient.payments?.length > 0 ? (
                                    <div className="history-list">
                                        {selectedPatient.payments.map((payment) => (
                                            <div key={payment._id} className="history-item">
                                                <div className="history-date">
                                                    {new Date(payment.createdAt).toLocaleDateString('uz-UZ')}
                                                </div>
                                                <div className="history-content">
                                                    <div style={{ fontWeight: 700, color: 'var(--success)' }}>
                                                        {payment.amount?.toLocaleString()} so'm
                                                    </div>
                                                    <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                                                        {payment.method === 'cash' ? 'Naqd' : 'Karta'}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted">To'lovlar tarixi yo'q</p>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => generatePatientCard(selectedPatient)}
                            >
                                <FiDownload />
                                Kartochka Chop Etish
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
