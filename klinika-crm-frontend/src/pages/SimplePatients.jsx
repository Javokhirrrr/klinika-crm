import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiSearch, FiPhone, FiCalendar, FiDollarSign, FiEdit, FiTrash2 } from 'react-icons/fi';
import http from '../lib/http';
import '../styles/design-system.css';
import './SimplePatients.css';

export default function SimplePatients() {
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        birthDate: '',
        gender: 'male'
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
            await http.post('/patients', formData);
            setShowModal(false);
            setFormData({ firstName: '', lastName: '', phone: '', birthDate: '', gender: 'male' });
            loadPatients();
        } catch (error) {
            console.error('Create error:', error);
        }
    };

    const filteredPatients = patients.filter(p =>
        `${p.firstName} ${p.lastName} ${p.phone}`.toLowerCase().includes(search.toLowerCase())
    );

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

            {/* Search */}
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
                            onClick={() => navigate(`/patients/${patient._id}`)}
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
        </div>
    );
}
