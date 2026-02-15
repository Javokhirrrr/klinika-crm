// Improved Quick Appointment Modal - Better Design
import React, { useState } from 'react';
import { QuickActionButton, LoadingSpinner, Toast } from './UIComponents';
import { Combobox } from '@/components/ui/combobox';
import http from '../lib/http';

export default function QuickAppointmentModal({ isOpen, onClose, onSuccess }) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const [formData, setFormData] = useState({
        patientPhone: '',
        patientName: '',
        doctorId: '',
        serviceId: '',
        date: '',
        time: '',
        paymentAmount: '',
        paymentMethod: 'cash',
        makePayment: false,
    });

    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [services, setServices] = useState([]);

    const searchPatient = async (phone) => {
        if (phone.length < 9) return;

        try {
            const res = await http.get(`/patients?q=${phone}`);
            if (res.items?.length > 0) {
                const patient = res.items[0];
                setFormData(prev => ({
                    ...prev,
                    patientId: patient._id,
                    patientName: `${patient.firstName} ${patient.lastName || ''}`,
                }));
                setStep(2);
            }
        } catch (error) {
            console.error('Patient search error:', error);
        }
    };

    React.useEffect(() => {
        if (isOpen) {
            Promise.all([
                http.get('/doctors'),
                http.get('/services'),
            ]).then(([doctorsRes, servicesRes]) => {
                setDoctors(doctorsRes.items || []);
                setServices(servicesRes.items || []);
            });
        }
    }, [isOpen]);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // Create appointment
            const apptRes = await http.post('/appointments', {
                patientId: formData.patientId,
                doctorId: formData.doctorId,
                serviceId: formData.serviceId,
                scheduledAt: `${formData.date}T${formData.time}`,
            });

            // Create payment if selected
            if (formData.makePayment && formData.paymentAmount > 0) {
                await http.post('/payments', {
                    patientId: formData.patientId,
                    appointmentId: apptRes.id,
                    amount: parseFloat(formData.paymentAmount),
                    method: formData.paymentMethod,
                    status: 'completed',
                });
            }

            setToast({ type: 'success', message: 'Qabul va to\'lov muvaffaqiyatli yaratildi!' });
            setTimeout(() => {
                onSuccess();
                onClose();
                resetForm();
            }, 1000);
        } catch (error) {
            setToast({ type: 'error', message: 'Xatolik yuz berdi' });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            patientPhone: '',
            patientName: '',
            doctorId: '',
            serviceId: '',
            date: '',
            time: '',
        });
        setStep(1);
    };

    if (!isOpen) return null;

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div style={styles.header}>
                    <div style={styles.headerContent}>
                        <div style={styles.iconCircle}>⚡</div>
                        <div>
                            <h2 style={styles.title}>Tez Qabul Yaratish</h2>
                            <p style={styles.subtitle}>4 qadamda qabul yarating</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={styles.closeBtn}>×</button>
                </div>

                {/* Progress Steps */}
                <div style={styles.stepsContainer}>
                    {[
                        { num: 1, label: 'Bemor' },
                        { num: 2, label: 'Shifokor' },
                        { num: 3, label: 'Vaqt' },
                    ].map((s) => (
                        <div key={s.num} style={styles.stepWrapper}>
                            <div
                                style={{
                                    ...styles.stepCircle,
                                    background: step >= s.num ? 'var(--primary-600)' : 'var(--gray-200)',
                                    color: step >= s.num ? 'white' : 'var(--gray-500)',
                                }}
                            >
                                {s.num}
                            </div>
                            <span style={{
                                ...styles.stepLabel,
                                color: step >= s.num ? 'var(--primary-600)' : 'var(--gray-400)',
                            }}>
                                {s.label}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Body */}
                <div style={styles.body}>
                    {/* Step 1: Patient */}
                    {step === 1 && (
                        <div style={styles.stepContent}>
                            <div style={styles.stepHeader}>
                                <span style={styles.stepIcon}>👤</span>
                                <h3 style={styles.stepTitle}>Bemor ma'lumotlari</h3>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Telefon raqami</label>
                                <input
                                    type="tel"
                                    className="input"
                                    placeholder="+998 90 123 45 67"
                                    value={formData.patientPhone}
                                    onChange={(e) => {
                                        setFormData({ ...formData, patientPhone: e.target.value });
                                        searchPatient(e.target.value);
                                    }}
                                    autoFocus
                                    style={styles.largeInput}
                                />
                            </div>

                            {formData.patientName && (
                                <div style={styles.successBox}>
                                    <span style={{ fontSize: '1.5rem' }}>✅</span>
                                    <div>
                                        <div style={styles.successTitle}>Bemor topildi!</div>
                                        <div style={styles.successName}>{formData.patientName}</div>
                                    </div>
                                </div>
                            )}

                            <div style={styles.actions}>
                                <QuickActionButton
                                    label="Keyingi →"
                                    onClick={() => setStep(2)}
                                    disabled={!formData.patientId}
                                    size="lg"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 2: Doctor & Service */}
                    {step === 2 && (
                        <div style={styles.stepContent}>
                            <div style={styles.stepHeader}>
                                <span style={styles.stepIcon}>👨‍⚕️</span>
                                <h3 style={styles.stepTitle}>Shifokor va xizmat</h3>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Shifokor</label>
                                <Combobox
                                    options={doctors.map(d => ({ value: d._id, label: `${d.firstName} ${d.lastName} - ${d.specialization || ''}` }))}
                                    value={formData.doctorId}
                                    onValueChange={(val) => setFormData({ ...formData, doctorId: val })}
                                    placeholder="Shifokorni tanlang"
                                    searchPlaceholder="Shifokor ismini yozing..."
                                    emptyText="Shifokor topilmadi"
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Xizmat</label>
                                <Combobox
                                    options={services.map(s => ({ value: s._id, label: `${s.name} - ${s.price?.toLocaleString()} so'm` }))}
                                    value={formData.serviceId}
                                    onValueChange={(val) => setFormData({ ...formData, serviceId: val })}
                                    placeholder="Xizmatni tanlang"
                                    searchPlaceholder="Xizmat nomini yozing..."
                                    emptyText="Xizmat topilmadi"
                                />
                            </div>

                            <div style={styles.actions}>
                                <QuickActionButton
                                    label="← Orqaga"
                                    onClick={() => setStep(1)}
                                    variant="secondary"
                                />
                                <QuickActionButton
                                    label="Keyingi →"
                                    onClick={() => setStep(3)}
                                    disabled={!formData.doctorId || !formData.serviceId}
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 3: Date & Time */}
                    {step === 3 && (
                        <div style={styles.stepContent}>
                            <div style={styles.stepHeader}>
                                <span style={styles.stepIcon}>📅</span>
                                <h3 style={styles.stepTitle}>Sana va vaqt</h3>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Sana</label>
                                <input
                                    type="date"
                                    className="input"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    min={new Date().toISOString().split('T')[0]}
                                    style={styles.dateInput}
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Vaqt</label>
                                <input
                                    type="time"
                                    className="input"
                                    value={formData.time}
                                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                    style={styles.dateInput}
                                />
                            </div>

                            <div style={styles.actions}>
                                <QuickActionButton
                                    label="← Orqaga"
                                    onClick={() => setStep(2)}
                                    variant="secondary"
                                />
                                <QuickActionButton
                                    label="Keyingi →"
                                    onClick={() => setStep(4)}
                                    disabled={!formData.date || !formData.time}
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 4: Payment */}
                    {step === 4 && (
                        <div style={styles.stepContent}>
                            <div style={styles.stepHeader}>
                                <span style={styles.stepIcon}>💳</span>
                                <h3 style={styles.stepTitle}>To'lov</h3>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>
                                    <input
                                        type="checkbox"
                                        checked={formData.makePayment}
                                        onChange={(e) => {
                                            const selectedService = services.find(s => s._id === formData.serviceId);
                                            setFormData({
                                                ...formData,
                                                makePayment: e.target.checked,
                                                paymentAmount: e.target.checked ? selectedService?.price || '' : ''
                                            });
                                        }}
                                        style={{ marginRight: '8px' }}
                                    />
                                    Hozir to'lov qabul qilish
                                </label>
                            </div>

                            {formData.makePayment && (
                                <>
                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Summa</label>
                                        <input
                                            type="number"
                                            className="input"
                                            placeholder="150000"
                                            value={formData.paymentAmount}
                                            onChange={(e) => setFormData({ ...formData, paymentAmount: e.target.value })}
                                            style={styles.largeInput}
                                        />
                                    </div>

                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>To'lov usuli</label>
                                        <select
                                            className="input"
                                            value={formData.paymentMethod}
                                            onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                                            style={styles.select}
                                        >
                                            <option value="cash">Naqd</option>
                                            <option value="card">Karta</option>
                                            <option value="transfer">O'tkazma</option>
                                            <option value="online">Online</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            <div style={styles.actions}>
                                <QuickActionButton
                                    label="← Orqaga"
                                    onClick={() => setStep(3)}
                                    variant="secondary"
                                />
                                <QuickActionButton
                                    label={loading ? <LoadingSpinner size={16} /> : "✅ Yaratish"}
                                    onClick={handleSubmit}
                                    variant="success"
                                    size="lg"
                                    disabled={loading || (formData.makePayment && !formData.paymentAmount)}
                                />
                            </div>
                        </div>
                        </div>
                    )}
            </div>

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
        </div >
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
        maxWidth: '550px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    },
    header: {
        padding: 'var(--space-6)',
        borderBottom: '1px solid var(--gray-100)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
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
        background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
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
    stepsContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: 'var(--space-6)',
        background: 'var(--gray-50)',
    },
    stepWrapper: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-2)',
        flex: 1,
    },
    stepCircle: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: '1rem',
        transition: 'all var(--transition-base)',
    },
    stepLabel: {
        fontSize: '0.75rem',
        fontWeight: 600,
        transition: 'color var(--transition-base)',
    },
    body: {
        padding: 'var(--space-8)',
    },
    stepContent: {
        minHeight: '300px',
    },
    stepHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        marginBottom: 'var(--space-6)',
    },
    stepIcon: {
        fontSize: '2rem',
    },
    stepTitle: {
        fontSize: '1.125rem',
        fontWeight: 600,
        margin: 0,
        color: 'var(--gray-800)',
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
    largeInput: {
        fontSize: '1.25rem',
        fontWeight: 500,
        padding: 'var(--space-4)',
    },
    select: {
        fontSize: '1rem',
    },
    dateInput: {
        fontSize: '1.125rem',
    },
    successBox: {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-4)',
        padding: 'var(--space-4)',
        background: 'linear-gradient(135deg, var(--success-50), var(--success-100))',
        borderRadius: 'var(--radius-xl)',
        border: '2px solid var(--success-200)',
        marginBottom: 'var(--space-6)',
    },
    successTitle: {
        fontSize: '0.875rem',
        color: 'var(--success-700)',
        fontWeight: 600,
    },
    successName: {
        fontSize: '1.125rem',
        fontWeight: 700,
        color: 'var(--success-900)',
    },
    actions: {
        display: 'flex',
        gap: 'var(--space-3)',
        marginTop: 'var(--space-8)',
    },
};
