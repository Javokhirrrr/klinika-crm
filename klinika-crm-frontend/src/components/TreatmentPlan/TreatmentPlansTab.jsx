import { useState, useEffect } from 'react';
import { FiPlus } from 'react-icons/fi';
import { treatmentPlanApi } from '../../api/treatmentPlan';
import CreateTreatmentPlanModal from './CreateTreatmentPlanModal';
import './TreatmentPlan.css';

function TreatmentPlanCard({ plan, onStatusChange }) {
    const handleCheck = async (item) => {
        const newStatus = item.status === 'completed' ? 'planned' : 'completed';
        try {
            await treatmentPlanApi.updateItemStatus(plan._id, item._id, newStatus);
            onStatusChange();
        } catch (e) {
            console.error(e);
            alert("Xatolik yuz berdi");
        }
    };

    return (
        <div className="plan-card">
            <div className="plan-header">
                <div>
                    <h3 className="plan-title">{plan.diagnosis}</h3>
                    <div className="plan-meta">
                        <span>👨‍⚕️ {plan.doctorId?.firstName} {plan.doctorId?.lastName}</span>
                        <span>📅 {new Date(plan.createdAt).toLocaleDateString('uz-UZ')}</span>
                    </div>
                </div>
                <div className={`plan-status ${plan.status}`}>
                    {plan.status === 'active' ? 'Faol' : plan.status === 'completed' ? 'Tugallangan' : 'Bekor qilingan'}
                </div>
            </div>

            <div className="plan-progress-container">
                <div className="plan-progress-bar">
                    <div className="plan-progress-fill" style={{ width: `${plan.progress || 0}%`, background: plan.progress === 100 ? '#10b981' : '#3b82f6' }}></div>
                </div>
                <div className="plan-progress-text">{plan.progress || 0}% Bajarildi</div>
            </div>

            <table className="plan-items-table">
                <thead>
                    <tr>
                        <th style={{ width: 40 }}></th>
                        <th>Muolaja (Xizmat)</th>
                        <th>Tish</th>
                        <th style={{ textAlign: 'right' }}>Narxi</th>
                    </tr>
                </thead>
                <tbody>
                    {plan.items?.map(it => (
                        <tr key={it._id} style={{ opacity: it.status === 'completed' ? 0.6 : 1 }}>
                            <td>
                                <input 
                                    type="checkbox" 
                                    className="item-checkbox" 
                                    checked={it.status === 'completed'} 
                                    onChange={() => handleCheck(it)}
                                />
                            </td>
                            <td style={{ textDecoration: it.status === 'completed' ? 'line-through' : 'none' }}>
                                <strong>{it.name}</strong>
                                {it.quantity > 1 && <span style={{ fontSize: '0.8rem', color: '#6b7280', marginLeft: 6 }}>x{it.quantity}</span>}
                            </td>
                            <td>{it.tooth ? <span style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 4, fontSize: '0.8rem' }}>{it.tooth}</span> : '—'}</td>
                            <td style={{ textAlign: 'right', fontWeight: 500 }}>
                                {it.totalAmount?.toLocaleString()} so'm
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="plan-footer">
                <div className="plan-totals">
                    <div className="plan-total-item">
                        <span className="plan-total-label">Umumiy Qiymat</span>
                        <span className="plan-total-val">{plan.totalCost?.toLocaleString()} so'm</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function TreatmentPlansTab({ patient }) {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const loadPlans = async () => {
        setLoading(true);
        try {
            const data = await treatmentPlanApi.getPlans({ patientId: patient._id || patient.id });
            setPlans(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (patient) loadPlans();
    }, [patient]);

    return (
        <div className="treatment-plans-tab">
            <div className="plan-header-actions">
                <button className="btn-primary" onClick={() => setShowModal(true)}>
                    <FiPlus /> Yangi Davolash Rejasi
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>Yuklanmoqda...</div>
            ) : plans.length === 0 ? (
                <div className="empty-state" style={{ padding: '40px 0', border: '1px dashed #e5e7eb', borderRadius: 8, marginTop: 16 }}>
                    <p style={{ margin: 0, color: '#6b7280' }}>Davolash rejalari topilmadi</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {plans.map(plan => (
                        <TreatmentPlanCard key={plan._id} plan={plan} onStatusChange={loadPlans} />
                    ))}
                </div>
            )}

            {showModal && (
                <CreateTreatmentPlanModal 
                    patient={patient} 
                    onClose={() => setShowModal(false)}
                    onSave={() => {
                        setShowModal(false);
                        loadPlans();
                    }}
                />
            )}
        </div>
    );
}
