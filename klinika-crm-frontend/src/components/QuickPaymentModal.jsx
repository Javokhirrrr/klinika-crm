// Improved Quick Payment Modal - Better Design
import React, { useState, useEffect } from 'react';
import { QuickActionButton, LoadingSpinner, Toast, StatusBadge } from './UIComponents';
import http from '../lib/http';

export default function QuickPaymentModal({ isOpen, onClose, onSuccess, prefilledPatient = null }) {
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [patients, setPatients] = useState([]);
    const [services, setServices] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    const [formData, setFormData] = useState({
        patientId: prefilledPatient?._id || '',
        patientName: prefilledPatient ? `${prefilledPatient.firstName} ${prefilledPatient.lastName}` : '',
        serviceId: '',
        amount: '',
        paymentMethod: 'cash',
        notes: '',
    });

    useEffect(() => {
        if (isOpen) {
            http.get('/services').then(res => {
                setServices(res.items || []);
            });
        }
    }, [isOpen]);

    const searchPatients = async (query) => {
        if (query.length < 2) return;
        try {
            const res = await http.get(`/patients?q=${query}`);
            setPatients(res.items || []);
        } catch (error) {
            console.error('Search error:', error);
        }
    };

    const handleServiceChange = (serviceId) => {
        const service = services.find(s => s._id === serviceId);
        setFormData(prev => ({
            ...prev,
            serviceId,
            amount: service?.price || '',
        }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await http.post('/payments', {
                patientId: formData.patientId,
                serviceId: formData.serviceId,
                amount: Number(formData.amount),
                paymentMethod: formData.paymentMethod,
                notes: formData.notes,
            });

            setToast({ type: 'success', message: '💰 To\'lov muvaffaqiyatli qabul qilindi!' });
            setTimeout(() => {
                onSuccess();
                onClose();
                resetForm();
            }, 1000);
        } catch (error) {
            setToast({ type: 'error', message: error.response?.data?.message || 'Xatolik yuz berdi' });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            patientId: '',
            patientName: '',
            serviceId: '',
            amount: '',
            paymentMethod: 'cash',
            notes: '',
        });
        setSearchQuery('');
        setPatients([]);
    };

    if (!isOpen) return null;

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div style={styles.header}>
                    <div style={styles.headerContent}>
                        <div style={styles.iconCircle}>💰</div>
                        <div>
                            <h2 style={styles.title}>Tez To'lov Qabul Qilish</h2>
                            <p style={styles.subtitle}>Naqd, karta yoki o'tkazma</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={styles.closeBtn}>×</button>
                </div>

                {/* Body */}
                <div style={styles.body}>
                    {/* Patient Search */}
                    {!formData.patientId && (
                        <div style={styles.formGroup}>
                            <label style={styles.label}>👤 Bemor qidirish</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="Ism, telefon yoki karta raqami..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    searchPatients(e.target.value);
                                }}
                                autoFocus
                                style={styles.searchInput}
                            />

                            {patients.length > 0 && (
                                <div style={styles.patientList}>
                                    {patients.map(patient => (
                                        <div
                                            key={patient._id}
                                            style={styles.patientItem}
                                            onClick={() => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    patientId: patient._id,
                                                    patientName: `${patient.firstName} ${patient.lastName || ''}`,
                                                }));
                                                setPatients([]);
                                                setSearchQuery('');
                                            }}
                                        >
                                            <div style={styles.patientAvatar}>
                                                {patient.firstName[0]}{patient.lastName?.[0] || ''}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={styles.patientName}>
                                                    {patient.firstName} {patient.lastName}
                                                </div>
                                                <div style={styles.patientDetails}>
                                                    {patient.phone} • {patient.cardNo}
                                                </div>
                                            </div>
                                            <span style={{ color: 'var(--primary-600)' }}>→</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Selected Patient */}
                    {formData.patientId && (
                        <div style={styles.selectedPatient}>
                            <div style={styles.selectedPatientInfo}>
                                <div style={styles.selectedAvatar}>
                                    {formData.patientName.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                    <div style={styles.selectedLabel}>Bemor</div>
                                    <div style={styles.selectedName}>{formData.patientName}</div>
                                </div>
                            </div>
                            <button
                                onClick={() => setFormData(prev => ({ ...prev, patientId: '', patientName: '' }))}
                                style={styles.changeBtn}
                            >
                                O'zgartirish
                            </button>
                        </div>
                    )}

                    {/* Service Selection */}
                    <div style={styles.formGroup}>
                        <label style={styles.label}>🏥 Xizmat</label>
                        <select
                            className="input"
                            value={formData.serviceId}
                            onChange={(e) => handleServiceChange(e.target.value)}
                            disabled={!formData.patientId}
                            style={styles.select}
                        >
                            <option value="">Tanlang...</option>
                            {services.map(service => (
                                <option key={service._id} value={service._id}>
                                    {service.name} - {service.price?.toLocaleString()} so'm
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Amount */}
                    <div style={styles.formGroup}>
                        <label style={styles.label}>💵 Summa (so'm)</label>
                        <input
                            type="number"
                            className="input"
                            placeholder="0"
                            value={formData.amount}
                            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                            style={styles.amountInput}
                        />
                    </div>

                    {/* Payment Method */}
                    <div style={styles.formGroup}>
                        <label style={styles.label}>💳 To'lov usuli</label>
                        <div style={styles.paymentMethods}>
                            {[
                                { value: 'cash', label: 'Naqd', icon: '💵' },
                                { value: 'card', label: 'Karta', icon: '💳' },
                                { value: 'transfer', label: 'O\'tkazma', icon: '🏦' },
                            ].map(method => (
                                <button
                                    key={method.value}
                                    onClick={() => setFormData(prev => ({ ...prev, paymentMethod: method.value }))}
                                    style={{
                                        ...styles.methodBtn,
                                        background: formData.paymentMethod === method.value
                                            ? 'linear-gradient(135deg, var(--primary-50), var(--primary-100))'
                                            : 'white',
                                        borderColor: formData.paymentMethod === method.value
                                            ? 'var(--primary-600)'
                                            : 'var(--gray-300)',
                                        borderWidth: formData.paymentMethod === method.value ? '2px' : '1px',
                                    }}
                                >
                                    <span style={{ fontSize: '2rem' }}>{method.icon}</span>
                                    <span style={{
                                        fontWeight: formData.paymentMethod === method.value ? 600 : 500,
                                        color: formData.paymentMethod === method.value ? 'var(--primary-700)' : 'var(--gray-700)',
                                    }}>
                                        {method.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div style={styles.formGroup}>
                        <label style={styles.label}>📝 Izoh (ixtiyoriy)</label>
                        <textarea
                            className="input"
                            placeholder="Qo'shimcha ma'lumot..."
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            rows={2}
                            style={{ resize: 'none' }}
                        />
                    </div>

                    {/* Summary */}
                    {formData.amount && (
                        <div style={styles.summary}>
                            <div style={styles.summaryLabel}>Jami to'lov:</div>
                            <div style={styles.summaryAmount}>
                                {Number(formData.amount).toLocaleString()} <span style={{ fontSize: '1rem' }}>so'm</span>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div style={styles.actions}>
                        <QuickActionButton
                            label="Bekor qilish"
                            onClick={onClose}
                            variant="secondary"
                        />
                        <QuickActionButton
                            label={loading ? <LoadingSpinner size={16} /> : "✅ To'lovni Qabul Qilish"}
                            onClick={handleSubmit}
                            variant="success"
                            size="lg"
                            disabled={!formData.patientId || !formData.amount || loading}
                        />
                    </div>
                </div>

                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )}
            </div>
        </div>
    );
}

const styles = {
    overlay: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 'var(--z-modal)',
        backdropFilter: 'blur(8px)',
    },
    modal: {
        background: 'white',
        borderRadius: 'var(--radius-2xl)',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    },
    header: {
        padding: 'var(--space-6)',
        borderBottom: '1px solid var(--gray-100)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        background: 'white',
        zIndex: 1,
    },
    headerContent: {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-4)',
    },
    iconCircle: {
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--success-500), var(--success-600))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.5rem',
    },
    title: {
        fontSize: '1.25rem',
        fontWeight: 700,
        margin: 0,
        color: 'var(--gray-900)',
    },
    subtitle: {
        fontSize: '0.875rem',
        color: 'var(--gray-500)',
        margin: 0,
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        fontSize: '2rem',
        cursor: 'pointer',
        color: 'var(--gray-400)',
        lineHeight: 1,
        padding: 0,
        width: '32px',
        height: '32px',
    },
    body: {
        padding: 'var(--space-8)',
    },
    formGroup: {
        marginBottom: 'var(--space-5)',
    },
    label: {
        display: 'block',
        fontSize: '0.875rem',
        fontWeight: 600,
        marginBottom: 'var(--space-2)',
        color: 'var(--gray-700)',
    },
    searchInput: {
        fontSize: '1rem',
    },
    patientList: {
        marginTop: 'var(--space-2)',
        border: '1px solid var(--gray-200)',
        borderRadius: 'var(--radius-lg)',
        maxHeight: '250px',
        overflow: 'auto',
        background: 'white',
    },
    patientItem: {
        padding: 'var(--space-4)',
        cursor: 'pointer',
        borderBottom: '1px solid var(--gray-100)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        transition: 'background var(--transition-fast)',
    },
    patientAvatar: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: 'var(--primary-100)',
        color: 'var(--primary-700)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: '0.875rem',
    },
    patientName: {
        fontWeight: 600,
        color: 'var(--gray-900)',
    },
    patientDetails: {
        fontSize: '0.875rem',
        color: 'var(--gray-500)',
    },
    selectedPatient: {
        padding: 'var(--space-5)',
        background: 'linear-gradient(135deg, var(--primary-50), var(--primary-100))',
        borderRadius: 'var(--radius-xl)',
        marginBottom: 'var(--space-5)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        border: '2px solid var(--primary-200)',
    },
    selectedPatientInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
    },
    selectedAvatar: {
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        background: 'var(--primary-600)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: '1rem',
    },
    selectedLabel: {
        fontSize: '0.75rem',
        color: 'var(--primary-700)',
        fontWeight: 600,
    },
    selectedName: {
        fontSize: '1.125rem',
        fontWeight: 700,
        color: 'var(--primary-900)',
    },
    changeBtn: {
        background: 'white',
        border: '2px solid var(--primary-600)',
        color: 'var(--primary-600)',
        padding: 'var(--space-2) var(--space-4)',
        borderRadius: 'var(--radius-lg)',
        cursor: 'pointer',
        fontSize: '0.875rem',
        fontWeight: 600,
        transition: 'all var(--transition-base)',
    },
    select: {
        fontSize: '1rem',
    },
    amountInput: {
        fontSize: '1.75rem',
        fontWeight: 700,
        padding: 'var(--space-4)',
        textAlign: 'center',
        color: 'var(--success-600)',
    },
    paymentMethods: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 'var(--space-3)',
    },
    methodBtn: {
        padding: 'var(--space-5)',
        border: '1px solid',
        borderRadius: 'var(--radius-xl)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-2)',
        transition: 'all var(--transition-base)',
        background: 'white',
    },
    summary: {
        padding: 'var(--space-6)',
        background: 'linear-gradient(135deg, var(--success-50), var(--success-100))',
        borderRadius: 'var(--radius-xl)',
        marginBottom: 'var(--space-6)',
        textAlign: 'center',
        border: '2px solid var(--success-200)',
    },
    summaryLabel: {
        fontSize: '0.875rem',
        color: 'var(--success-700)',
        fontWeight: 600,
        marginBottom: 'var(--space-2)',
    },
    summaryAmount: {
        fontSize: '2.5rem',
        fontWeight: 700,
        color: 'var(--success-900)',
    },
    actions: {
        display: 'flex',
        gap: 'var(--space-3)',
    },
};
