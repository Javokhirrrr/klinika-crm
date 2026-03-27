import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiClipboard, FiPlus, FiUser, FiDollarSign, FiX, FiPrinter } from 'react-icons/fi';
import { treatmentPlanApi } from '../api/treatmentPlan';
import CreateTreatmentPlanModal from '../components/TreatmentPlan/CreateTreatmentPlanModal';
import ReceiptPreviewModal from '../components/ReceiptPreviewModal';
import http from '../lib/http';
import '../components/TreatmentPlan/TreatmentPlan.css';

import PaymentModal from '../components/TreatmentPlan/PaymentModal';

export default function GlobalTreatmentPlans() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('active');
    const [showModal, setShowModal] = useState(false);
    const [paymentPlan, setPaymentPlan] = useState(null);
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
        <div className="flex flex-col gap-6 w-full pb-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex flex-col gap-1.5">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2 m-0">
                        <FiClipboard className="text-blue-600" /> Davolash Rejalari
                    </h2>
                    <p className="text-sm text-slate-500 m-0">Klinikadagi barcha bemorlarning davolash jarayonlari</p>
                </div>
                <button 
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 sm:w-auto w-full gap-2"
                    onClick={() => setShowModal(true)}
                >
                    <FiPlus /> Yangi Davolash Rejasi
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row justify-between gap-4 items-center">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <label className="text-sm font-medium text-slate-700 whitespace-nowrap">Holat:</label>
                    <select 
                        className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors sm:w-[200px]"
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Barcha Holatlar</option>
                        <option value="active">Faol</option>
                        <option value="completed">Tugallangan</option>
                        <option value="cancelled">Bekor qilingan</option>
                    </select>
                </div>
                <button 
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 px-6 py-2 text-sm font-medium shadow-sm transition-colors w-full sm:w-auto"
                    onClick={loadPlans}
                >
                    Yangilash
                </button>
            </div>

            {/* Plans List */}
            <div className="w-full">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-slate-200">
                        <div className="w-8 h-8 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin mb-4"></div>
                        <p className="text-slate-500 font-medium">Yuklanmoqda...</p>
                    </div>
                ) : plans.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <FiClipboard size={28} className="text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-700 m-0">Rejalar topilmadi</h3>
                        <p className="text-sm text-slate-500 mt-1">Tanlangan holat bo'yicha ma'lumot yo'q</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 16 }}>
                        {plans.map(plan => {
                            const paid = plan.paidAmount || 0;
                            const total = plan.totalCost || 0;
                            const remaining = total - paid;
                            const payPct = total > 0 ? Math.round((paid / total) * 100) : 0;

                            return (
                                <div key={plan._id} className="plan-card" style={{ cursor: 'default' }}>
                                    {/* Card Header */}
                                    <div className="plan-header" style={{ marginBottom: 12 }}>
                                        <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => navigate(`/patients/${plan.patientId?._id || plan.patientId?.id}`)}>
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

                                    {/* Progress */}
                                    <div className="plan-progress-container" style={{ marginBottom: 12 }}>
                                        <div className="plan-progress-header">
                                            <span className="plan-progress-label">Bajarilish holati</span>
                                            <span className="plan-progress-text">{plan.progress || 0}% Bajarildi</span>
                                        </div>
                                        <div className="plan-progress-bar">
                                            <div className={`plan-progress-fill ${plan.progress === 100 ? 'completed' : ''}`} style={{ width: `${plan.progress || 0}%` }}></div>
                                        </div>
                                    </div>

                                    {/* Payment Progress */}
                                    <div style={{ marginBottom: 12 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6b7280', marginBottom: 4 }}>
                                            <span>To'lov holati</span>
                                            <span style={{ fontWeight: 600, color: remaining > 0 ? '#dc2626' : '#16a34a' }}>
                                                {remaining > 0 ? `Qoldiq: ${remaining.toLocaleString()} so'm` : '✅ To\'liq to\'langan'}
                                            </span>
                                        </div>
                                        <div style={{ height: 5, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${payPct}%`, background: remaining > 0 ? '#f59e0b' : '#16a34a', borderRadius: 4, transition: 'width 0.5s ease' }} />
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="plan-footer" style={{ borderTop: '1px solid #f1f5f9', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: 11, color: '#9ca3af' }}>Jami</div>
                                            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{total.toLocaleString()} so'm</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <span style={{ fontSize: 11, color: '#6b7280', alignSelf: 'center' }}>
                                                {new Date(plan.createdAt).toLocaleDateString('uz-UZ')}
                                            </span>
                                            {plan.status !== 'cancelled' && (
                                                <button
                                                    onClick={() => setPaymentPlan(plan)}
                                                    style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: 5,
                                                        padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                                                        border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                                                        background: remaining > 0 ? '#16a34a' : '#f0fdf4',
                                                        color: remaining > 0 ? '#fff' : '#15803d',
                                                    }}
                                                >
                                                    <FiDollarSign />
                                                    {remaining > 0 ? "To'lov qabul qilish" : "To'lovlar"}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {showModal && (
                <CreateTreatmentPlanModal 
                    patient={null}
                    onClose={() => setShowModal(false)}
                    onSave={() => {
                        setShowModal(false);
                        loadPlans();
                    }}
                />
            )}

            {paymentPlan && (
                <PaymentModal
                    plan={paymentPlan}
                    onClose={() => setPaymentPlan(null)}
                    onSuccess={() => {
                        setPaymentPlan(null);
                        loadPlans();
                    }}
                />
            )}
        </div>
    );
}
