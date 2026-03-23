import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiClipboard, FiPlus, FiUser } from 'react-icons/fi';
import { treatmentPlanApi } from '../api/treatmentPlan';
import '../components/TreatmentPlan/TreatmentPlan.css';

export default function GlobalTreatmentPlans() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('active'); // all, active, completed, cancelled
    const navigate = useNavigate();

    const loadPlans = async () => {
        setLoading(true);
        try {
            const data = await treatmentPlanApi.getPlans(statusFilter === 'all' ? {} : { status: statusFilter });
            setPlans(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPlans();
    }, [statusFilter]);

    return (
        <div className="page">
            <div className="row" style={{ alignItems: "center", marginBottom: 16 }}>
                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FiClipboard /> Davolash Rejalari
                </h2>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
                <div className="row" style={{ gap: 12, alignItems: 'center' }}>
                    <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: 180 }}>
                        <option value="all">Barcha Holatlar</option>
                        <option value="active">Faol</option>
                        <option value="completed">Tugallangan</option>
                        <option value="cancelled">Bekor qilingan</option>
                    </select>
                    <button className="btn" onClick={loadPlans}>Yangilash</button>
                    <span className="muted" style={{ marginLeft: 'auto', fontSize: '0.9rem' }}>
                        * Yangi davolash rejasi tuzish uchun mos bemor profiliga kiring.
                    </span>
                </div>
            </div>

            <div className="card" style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: 8 }}>Yuklanmoqda...</div>
                ) : plans.length === 0 ? (
                    <div className="empty-state" style={{ padding: '60px 0', background: 'white', borderRadius: 8, border: '1px dashed #e5e7eb' }}>
                        <FiClipboard size={48} color="#9ca3af" />
                        <h3 style={{ marginTop: 16, color: '#4b5563' }}>Rejalar topilmadi</h3>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 16 }}>
                        {plans.map(plan => (
                            <div key={plan._id} className="plan-card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/patients/${plan.patientId?._id || plan.patientId?.id}`)}>
                                <div className="plan-header" style={{ marginBottom: 12 }}>
                                    <div>
                                        <h3 className="plan-title">{plan.diagnosis}</h3>
                                        <div className="plan-meta" style={{ marginTop: 6 }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <FiUser /> {plan.patientId?.firstName} {plan.patientId?.lastName}
                                            </span>
                                            <span>👨‍⚕️ {plan.doctorId?.firstName} {plan.doctorId?.lastName}</span>
                                        </div>
                                    </div>
                                    <div className={`plan-status ${plan.status}`}>
                                        {plan.status === 'active' ? 'Faol' : plan.status === 'completed' ? 'Tugallangan' : 'Bekor qilingan'}
                                    </div>
                                </div>

                                <div className="plan-progress-container" style={{ marginBottom: 16 }}>
                                    <div className="plan-progress-header">
                                        <span className="plan-progress-label">Bajarilish holati</span>
                                        <span className="plan-progress-text">{plan.progress || 0}% Bajarildi</span>
                                    </div>
                                    <div className="plan-progress-bar">
                                        <div className={`plan-progress-fill ${plan.progress === 100 ? 'completed' : ''}`} style={{ width: `${plan.progress || 0}%` }}></div>
                                    </div>
                                </div>
                                
                                <div className="plan-footer" style={{ borderTop: 'none', paddingTop: 0 }}>
                                    <div className="plan-totals" style={{ justifyContent: 'space-between', width: '100%' }}>
                                        <div className="plan-total-item">
                                            <span className="plan-total-label">Umumiy Qiymat</span>
                                            <span className="plan-total-val">{plan.totalCost?.toLocaleString()} so'm</span>
                                        </div>
                                        <div className="plan-total-item" style={{ alignItems: 'flex-end' }}>
                                            <span className="plan-total-label">Sana</span>
                                            <span className="plan-total-val" style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                                                {new Date(plan.createdAt).toLocaleDateString('uz-UZ')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
