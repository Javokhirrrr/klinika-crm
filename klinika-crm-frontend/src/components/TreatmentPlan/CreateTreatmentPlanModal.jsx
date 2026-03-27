import { useState, useEffect } from 'react';
import { FiX, FiPlus, FiTrash2, FiSave, FiSearch } from 'react-icons/fi';
import { treatmentPlanApi } from '../../api/treatmentPlan';
import http from '../../lib/http';
import './TreatmentPlan.css';

export default function CreateTreatmentPlanModal({ 
    patient, 
    defaultDiagnosis, 
    defaultDoctorId, 
    defaultItems, 
    onClose, 
    onSave 
}) {
    const [loading, setLoading] = useState(false);
    const [doctors, setDoctors] = useState([]);
    const [services, setServices] = useState([]);
    const [patients, setPatients] = useState([]);
    const [patientSearch, setPatientSearch] = useState('');
    const [showPatientDropdown, setShowPatientDropdown] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(patient || null);
    const [selectedPatientId, setSelectedPatientId] = useState(patient?._id || patient?.id || '');
    
    const [advanceAmount, setAdvanceAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [cashDeskId, setCashDeskId] = useState('');
    const [cashDesks, setCashDesks] = useState([]);

    const [form, setForm] = useState({ 
        diagnosis: defaultDiagnosis || '', 
        doctorId: defaultDoctorId || '', 
        notes: '' 
    });
    const [items, setItems] = useState(defaultItems || []);

    useEffect(() => {
        loadDependencies();
    }, []);

    const loadDependencies = async () => {
        try {
            const [docsRes, srvRes, desksRes] = await Promise.all([
                http.get('/doctors', { limit: 200 }),
                http.get('/services', { limit: 200 }),
                http.get('/cash-desks', { limit: 200 }).catch(() => []) 
            ]);
            setDoctors(Array.isArray(docsRes?.items) ? docsRes.items : (Array.isArray(docsRes) ? docsRes : []));
            setServices(Array.isArray(srvRes?.items) ? srvRes.items : (Array.isArray(srvRes) ? srvRes : []));
            const dData = Array.isArray(desksRes?.items) ? desksRes.items : (Array.isArray(desksRes?.data) ? desksRes.data : (Array.isArray(desksRes) ? desksRes : []));
            setCashDesks(dData);
            if (dData.length > 0) setCashDeskId(dData[0]._id || dData[0].id);

            if (!patient) {
                const patRes = await http.get('/patients', { limit: 500 });
                const pats = Array.isArray(patRes?.items) ? patRes.items
                    : Array.isArray(patRes?.data) ? patRes.data
                    : Array.isArray(patRes) ? patRes : [];
                setPatients(pats);
            }
        } catch (err) {
            console.error('loadDependencies error:', err);
        }
    };

    const filteredPatients = patientSearch.trim().length > 0
        ? patients.filter(p => {
            const full = `${p.firstName || ''} ${p.lastName || ''} ${p.phone || ''}`.toLowerCase();
            return full.includes(patientSearch.toLowerCase());
        })
        : patients.slice(0, 50);

    const handleSelectPatient = (p) => {
        setSelectedPatient(p);
        setSelectedPatientId(p._id || p.id);
        setPatientSearch(`${p.firstName} ${p.lastName}`);
        setShowPatientDropdown(false);
    };

    const handleAddItem = () => {
        setItems([...items, { serviceId: '', tooth: '', price: 0, quantity: 1, discount: 0 }]);
    };

    const handleRemoveItem = (index) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        if (field === 'serviceId') {
            const svc = services.find(s => s._id === value || s.id === value);
            if (svc) {
                newItems[index].price = svc.price || 0;
                newItems[index].name = svc.name;
            }
        }
        setItems(newItems);
    };

    const calculateItemTotal = (item) => {
        const base = (Number(item.price) || 0) * (Number(item.quantity) || 1);
        return Math.max(0, base - (Number(item.discount) || 0));
    };

    const grandTotal = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const pId = patient?._id || patient?.id || selectedPatientId;
        if (!pId) return alert("Bemorni tanlash majburiy!");
        if (!form.diagnosis.trim()) return alert("Diagnozni kiritish majburiy!");
        if (!form.doctorId) return alert("Mas'ul shifokorni tanlang!");
        if (items.length === 0) return alert("Kamida 1 ta xizmat qo'shing!");
        const validItems = items.filter(it => it.serviceId).map(it => ({
            serviceId: it.serviceId,
            name: it.name || "Xizmat",
            tooth: it.tooth,
            price: Number(it.price) || 0,
            quantity: Number(it.quantity) || 1,
            discount: Number(it.discount) || 0,
        }));
        if (validItems.length === 0) return alert("Xizmatlarni to'g'ri tanlang!");
        setLoading(true);
        try {
            const planRes = await treatmentPlanApi.createPlan({
                patientId: pId,
                doctorId: form.doctorId,
                diagnosis: form.diagnosis,
                notes: form.notes,
                items: validItems
            });
            
            if (advanceAmount && Number(advanceAmount) > 0) {
                if (!cashDeskId) {
                    alert("To'lov uchun kassa tanlanmagan! Reja saqlandi, lekin to'lov qo'shilmadi.");
                } else {
                    const planId = planRes._id || planRes.id;
                    await treatmentPlanApi.addPayment(planId, {
                        amount: Number(advanceAmount),
                        method: paymentMethod,
                        cashDeskId: cashDeskId,
                        note: `Oldindan to'lov (Davolash rejasi)`
                    });
                }
            }
            
            onSave();
        } catch (err) {
            alert(err?.response?.data?.message || err?.message || "Xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 sm:p-6" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-4xl max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                    <h2 className="text-xl font-bold text-slate-800 m-0">Yangi Davolash Rejasi</h2>
                    <button type="button" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" onClick={onClose}>
                        <FiX size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
                    {/* Bemor tanlash */}
                    <div className="form-group" style={{ marginBottom: 12 }}>
                        <label>Bemor *</label>
                        {patient ? (
                            <input type="text" className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm" disabled value={`${patient.firstName} ${patient.lastName}`} />
                        ) : (
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'relative' }}>
                                    <FiSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', zIndex: 1 }} />
                                    <input
                                        type="text"
                                        className="flex h-10 w-full rounded-md border border-slate-300 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        style={{ paddingLeft: 34, paddingRight: 12 }}
                                        placeholder={patients.length === 0 ? "Yuklanmoqda..." : `Bemorni qidiring... (${patients.length} ta)`}
                                        value={patientSearch}
                                        onFocus={() => setShowPatientDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowPatientDropdown(false), 200)}
                                        onChange={e => {
                                            setPatientSearch(e.target.value);
                                            setSelectedPatientId('');
                                            setSelectedPatient(null);
                                            setShowPatientDropdown(true);
                                        }}
                                        autoComplete="off"
                                    />
                                </div>
                                {showPatientDropdown && filteredPatients.length > 0 && (
                                    <div style={{
                                        position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999,
                                        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8,
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: 220, overflowY: 'auto', marginTop: 4
                                    }}>
                                        {filteredPatients.map(p => (
                                            <div
                                                key={p._id}
                                                onMouseDown={() => handleSelectPatient(p)}
                                                style={{
                                                    padding: '10px 16px', cursor: 'pointer', fontSize: 13,
                                                    borderBottom: '1px solid #f1f5f9',
                                                    display: 'flex', justifyContent: 'space-between',
                                                    background: selectedPatientId === (p._id || p.id) ? '#eff6ff' : '#fff'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                                onMouseLeave={e => e.currentTarget.style.background = selectedPatientId === (p._id || p.id) ? '#eff6ff' : '#fff'}
                                            >
                                                <span style={{ fontWeight: 600 }}>{p.firstName} {p.lastName}</span>
                                                <span style={{ color: '#94a3b8', fontSize: 12 }}>{p.phone || p.cardNo || ''}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {selectedPatientId && (
                                    <div style={{ marginTop: 4, fontSize: 12, color: '#16a34a' }}>
                                        ✅ {selectedPatient?.firstName} {selectedPatient?.lastName} tanlandi
                                    </div>
                                )}
                                {!selectedPatientId && patients.length === 0 && (
                                    <div style={{ marginTop: 4, fontSize: 12, color: '#f59e0b' }}>
                                        ⏳ Bemorlar ro'yxati yuklanmoqda...
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                        <div className="form-group">
                            <label>Diagnoz / Reja Nomi *</label>
                            <input type="text" className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required 
                                value={form.diagnosis} onChange={e => setForm({...form, diagnosis: e.target.value})} 
                                placeholder="Masalan: Yuqori jag' implantatsiyasi" />
                        </div>
                        <div className="form-group">
                            <label>Mas'ul Shifokor *</label>
                            <select className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required value={form.doctorId} onChange={e => setForm({...form, doctorId: e.target.value})}>
                                <option value="">Tanlang...</option>
                                {doctors.map(d => (
                                    <option key={d._id} value={d._id}>{d.firstName || ''} {d.lastName || ''} {d.name || ''}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <div className="flex justify-between items-center mb-4">
                            <label className="m-0 font-medium tracking-tight text-slate-800">Muolaja Bosqichlari (Xizmatlar) *</label>
                            <button type="button" className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-medium text-sm hover:bg-blue-100 transition-colors" onClick={handleAddItem}>
                                <FiPlus /> Xizmat qo'shish
                            </button>
                        </div>
                        {items.length > 0 && (
                            <div className="service-items-wrapper">
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: 8, padding: '0 8px 8px', fontSize: '0.8rem', fontWeight: 600, color: '#4b5563' }}>
                                    <div>Xizmat</div><div>Tish (ixtiyoriy)</div><div>Narxi</div><div>Soni</div><div>Chegirma</div><div></div>
                                </div>
                                {items.map((it, idx) => (
                                    <div key={idx} className="service-item-row">
                                        <select className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                            value={it.serviceId} onChange={e => handleItemChange(idx, 'serviceId', e.target.value)} required>
                                            <option value="">Tanlang</option>
                                            {services.map(s => (
                                                <option key={s._id || s.id} value={s._id || s.id}>{s.name} ({(s.price || 0).toLocaleString()} so'm)</option>
                                            ))}
                                        </select>
                                        <input type="text" className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="11,12" 
                                            value={it.tooth} onChange={e => handleItemChange(idx, 'tooth', e.target.value)} />
                                        <input type="number" className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" min="0" 
                                            value={it.price} onChange={e => handleItemChange(idx, 'price', e.target.value)} required />
                                        <input type="number" className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" min="1" 
                                            value={it.quantity} onChange={e => handleItemChange(idx, 'quantity', e.target.value)} required />
                                        <input type="number" className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" min="0" 
                                            value={it.discount} onChange={e => handleItemChange(idx, 'discount', e.target.value)} />
                                        <button type="button" className="remove-btn" onClick={() => handleRemoveItem(idx)}>
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        {items.length === 0 && <div style={{ marginTop: 8, fontSize: '0.85rem', color: '#6b7280' }}>Hali xizmat qo'shilmagan.</div>}
                    </div>

                    <div className="form-group" style={{ marginTop: 12 }}>
                        <label>Umumiy Izoh</label>
                        <textarea className="flex w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]" rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}></textarea>
                    </div>

                    <div className="form-group" style={{ marginTop: 16, padding: 16, border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc' }}>
                        <label className="flex items-center gap-2 mb-2 cursor-pointer font-medium text-slate-800">
                            <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" 
                                checked={advanceAmount !== ''} 
                                onChange={e => {
                                    if(e.target.checked) setAdvanceAmount(grandTotal > 0 ? grandTotal.toString() : '');
                                    else setAdvanceAmount('');
                                }} 
                            />
                            Bemor to'lovini ham shu yerning o'zida qabul qilish
                        </label>
                        
                        {advanceAmount !== '' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 12 }}>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1 block uppercase tracking-wider">To'lov summasi</label>
                                    <input type="number" className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                        value={advanceAmount} onChange={e => setAdvanceAmount(e.target.value)} min="0" placeholder="0" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1 block uppercase tracking-wider">To'lov usuli</label>
                                    <select className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                                        <option value="cash">Naqd pul</option>
                                        <option value="card">Plastik karta</option>
                                        <option value="transfer">Pul o'tkazma</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1 block uppercase tracking-wider">Kassa</label>
                                    <select className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={cashDeskId} onChange={e => setCashDeskId(e.target.value)}>
                                        <option value="">Tanlang...</option>
                                        {cashDesks.map(d => (
                                            <option key={d._id} value={d._id}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-200">
                        <div className="flex items-center gap-3 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-lg">
                            <span className="text-sm uppercase tracking-wider text-slate-400 font-medium">Jami:</span>
                            <span className="text-xl font-bold">{grandTotal.toLocaleString()} so'm</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button type="button" className="px-6 py-2.5 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors bg-white shadow-sm" onClick={onClose} disabled={loading}>Bekor qilish</button>
                            <button type="submit" className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-md flex items-center gap-2 disabled:opacity-50" disabled={loading}>
                                <FiSave /> {loading ? "Saqlanmoqda..." : "Rejani Saqlash"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
