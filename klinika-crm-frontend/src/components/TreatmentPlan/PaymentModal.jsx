import React, { useState, useEffect } from 'react';
import { FiX, FiPrinter, FiDollarSign } from 'react-icons/fi';
import http from '../../lib/http';
import ReceiptPreviewModal from '../ReceiptPreviewModal';

export default function PaymentModal({ plan, onClose, onSuccess }) {
    const [amount, setAmount] = useState('');
    const [lastPayment, setLastPayment] = useState(null);
    const [receiptUrl, setReceiptUrl] = useState(null);
    const [method, setMethod] = useState('cash');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [cashDesks, setCashDesks] = useState([]);
    const [cashDeskId, setCashDeskId] = useState('');

    // Qoldiq summani avtomatik to'ldirish (foydalanuvchi qo'lda yozib o'tirmasin)
    useEffect(() => {
        const rem = (plan.totalCost || 0) - (plan.paidAmount || 0);
        if (rem > 0) setAmount(String(rem));
    }, [plan]);

    useEffect(() => {
        http.get('/cash-desks', { limit: 50 }).then(res => {
            const items = res.desks || res.items || (Array.isArray(res) ? res : []);
            setCashDesks(items);
            if (items.length > 0) setCashDeskId(items[0]._id || items[0].id);
        }).catch(() => {});
    }, []);

    useEffect(() => {
        if (lastPayment && !receiptUrl) {
            const timer = setTimeout(() => {
                onSuccess();
            }, 1200); // Darhol yopiladi (tezkor UI uchun)
            return () => clearTimeout(timer);
        }
    }, [lastPayment, receiptUrl, onSuccess]);

    const remaining = (plan.totalCost || 0) - (plan.paidAmount || 0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount || Number(amount) <= 0) return alert("Summa kiritilishi shart");
        setLoading(true);
        try {
            if (plan._isAppointment) {
                // Qabul to'lovi — oddiy /payments endpointi
                await http.post('/payments', {
                    appointmentId: plan._id,
                    patientId: plan.patientId?._id || plan.patientId,
                    amount: Number(amount),
                    method,
                    cashDeskId: cashDeskId || undefined,
                    note: note || 'Kassaga to\'lov',
                });
            } else {
                // Davolash rejasi to'lovi
                await http.post(`/treatment-plans/${plan._id || plan.id}/payments`, {
                    amount: Number(amount),
                    method,
                    cashDeskId: cashDeskId || undefined,
                    note,
                });
            }
            setLastPayment({ amount: Number(amount), method });
        } catch (err) {
            alert(err?.response?.data?.message || err?.message || "Xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };

    const openReceipt = () => {
        const base = http.API_BASE || '';
        const url = `${base}/api/receipts/treatment-plans/${plan._id || plan.id}/print?amount=${lastPayment?.amount}&method=${lastPayment?.method}`;
        setReceiptUrl(url);
    };

    // ─── To'lov muvaffaqiyatli — chek ekrani ──────────────────────────────────
    if (lastPayment) {
        return (
            <>
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                        <div className="p-8 text-center">
                            <div className="text-5xl mb-4 animate-bounce">✅</div>
                            <h3 className="text-xl font-bold text-slate-800 mb-1">To'lov qabul qilindi!</h3>
                            <p className="text-slate-500 text-sm mb-2">{plan.diagnosis}</p>
                            <p className="text-2xl font-black text-emerald-600 mb-6">{lastPayment.amount.toLocaleString()} so'm</p>
                            <p className="text-xs text-slate-400 mb-4">Oyna avtomat yopiladi...</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={openReceipt}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-700 transition-colors"
                                >
                                    <FiPrinter /> Chek chiqarish
                                </button>
                                <button
                                    onClick={() => onSuccess()}
                                    className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                                >
                                    Yopish
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                {receiptUrl && (
                    <ReceiptPreviewModal
                        url={receiptUrl}
                        open={!!receiptUrl}
                        onClose={() => { setReceiptUrl(null); onSuccess(); }}
                    />
                )}
            </>
        );
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 m-0">To'lov Qabul Qilish</h2>
                        <p className="text-sm text-slate-500 m-0 mt-0.5">{plan.diagnosis}</p>
                    </div>
                    <button type="button" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" onClick={onClose}>
                        <FiX size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Moliyaviy holat */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-slate-50 rounded-xl p-3 text-center">
                            <div className="text-xs text-slate-500 mb-1">Jami</div>
                            <div className="text-sm font-bold text-slate-800">{(plan.totalCost || 0).toLocaleString()}</div>
                        </div>
                        <div className="bg-emerald-50 rounded-xl p-3 text-center">
                            <div className="text-xs text-emerald-600 mb-1">To'langan</div>
                            <div className="text-sm font-bold text-emerald-700">{(plan.paidAmount || 0).toLocaleString()}</div>
                        </div>
                        <div className={`${remaining > 0 ? 'bg-red-50' : 'bg-emerald-50'} rounded-xl p-3 text-center`}>
                            <div className={`text-xs mb-1 ${remaining > 0 ? 'text-red-500' : 'text-emerald-500'}`}>Qoldiq</div>
                            <div className={`text-sm font-bold ${remaining > 0 ? 'text-red-700' : 'text-emerald-700'}`}>{remaining.toLocaleString()}</div>
                        </div>
                    </div>

                    {remaining <= 0 ? (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center text-emerald-700 font-medium">
                            ✅ To'liq to'langan!
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Summa (so'm) *</label>
                                <input
                                    type="number"
                                    min="1"
                                    max={remaining}
                                    required
                                    autoFocus
                                    className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder={`Maksimal: ${remaining.toLocaleString()} so'm`}
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                />
                                <div className="flex gap-2 mt-2">
                                    {[remaining, Math.round(remaining / 2)].filter(v => v > 0).map(v => (
                                        <button key={v} type="button" onClick={() => setAmount(String(v))}
                                            className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-md hover:bg-blue-100 transition-colors">
                                            {v.toLocaleString()}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">To'lov usuli</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={method}
                                    onChange={e => setMethod(e.target.value)}
                                >
                                    <option value="cash">💵 Naqd pul</option>
                                    <option value="card">💳 Karta</option>
                                    <option value="transfer">🏦 O'tkazma</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">🏦 Kassa (qaysi kassaga tushsin?)</label>
                                {cashDesks.length > 0 ? (
                                    <select
                                        className="flex h-10 w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={cashDeskId}
                                        onChange={e => setCashDeskId(e.target.value)}
                                    >
                                        <option value="">— Kassani tanlang —</option>
                                        {cashDesks.map(d => (
                                            <option key={d._id || d.id} value={d._id || d.id}>
                                                {d.name} ({d.type === 'cash' ? '💵 Naqd' : d.type === 'card' ? '💳 Karta' : d.type === 'bank' ? '🏦 Bank' : '🛡️ Sug\'urta'}) — {(d.balance || 0).toLocaleString()} so'm
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="text-sm font-semibold text-red-600 bg-red-50 p-2.5 rounded-md border border-red-200">
                                        ⚠️ Sizda hali Kassa yaratilmagan. To'lov qabul qilish uchun chap menyudan "Kassa" bo'limiga o'tib kassa yarating.
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Izoh (ixtiyoriy)</label>
                                <input
                                    type="text"
                                    className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Masalan: 1-bo'lib to'lov"
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                />
                            </div>
                        </>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button type="button" className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors" onClick={onClose}>
                            Yopish
                        </button>
                        {remaining > 0 && (
                            <button type="submit" disabled={loading}
                                className="flex-1 py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                <FiDollarSign /> {loading ? "Kuting..." : "Tasdiqlash"}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
