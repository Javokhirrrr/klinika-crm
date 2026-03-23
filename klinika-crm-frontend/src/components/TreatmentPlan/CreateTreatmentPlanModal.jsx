import { useState, useEffect } from 'react';
import { FiX, FiPlus, FiTrash2, FiSave } from 'react-icons/fi';
import { treatmentPlanApi } from '../../api/treatmentPlan';
import http from '../../lib/http';
import './TreatmentPlan.css';

export default function CreateTreatmentPlanModal({ patient, onClose, onSave }) {
    const [loading, setLoading] = useState(false);
    const [doctors, setDoctors] = useState([]);
    const [services, setServices] = useState([]);
    const [patients, setPatients] = useState([]);
    const [selectedPatientId, setSelectedPatientId] = useState(patient?._id || patient?.id || '');
    
    const [form, setForm] = useState({
        diagnosis: '',
        doctorId: '',
        notes: ''
    });

    const [items, setItems] = useState([]);

    useEffect(() => {
        loadDependencies();
    }, []);

    const loadDependencies = async () => {
        try {
            // Load Doctors
            const docsRes = await http.get('/doctors', { limit: 200 });
            setDoctors(Array.isArray(docsRes.items) ? docsRes.items : (Array.isArray(docsRes) ? docsRes : []));
            
            // Load Services
            const srvRes = await http.get('/services', { limit: 200 });
            setServices(Array.isArray(srvRes.items) ? srvRes.items : (Array.isArray(srvRes) ? srvRes : []));

            // Load Patients if no patient provided
            if (!patient) {
                const patRes = await http.get('/patients', { limit: 500 });
                setPatients(Array.isArray(patRes.items) ? patRes.items : (Array.isArray(patRes) ? patRes : []));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddItem = () => {
        setItems([
            ...items, 
            { serviceId: '', tooth: '', price: 0, quantity: 1, discount: 0 }
        ]);
    };

    const handleRemoveItem = (index) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        
        // Auto-fill price when service selected
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
            await treatmentPlanApi.createPlan({
                patientId: pId,
                doctorId: form.doctorId,
                diagnosis: form.diagnosis,
                notes: form.notes,
                items: validItems
            });
            onSave();
        } catch (err) {
            alert(err?.response?.data?.message || "Xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                    <h2 className="text-xl font-bold text-slate-800 m-0">Yangi Davolash Rejasi</h2>
                    <button type="button" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" onClick={onClose}>
                        <FiX size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
                    <div className="form-group" style={{ marginBottom: 12 }}>
                        <label>Bemor *</label>
                        {patient ? (
                            <input type="text" className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 border-slate-200" disabled value={`${patient.firstName} ${patient.lastName}`} />
                        ) : (
                            <select className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white border-slate-200 p-2 rounded-md focus:ring-2 focus:ring-blue-500/50 w-full" required value={selectedPatientId} onChange={e => setSelectedPatientId(e.target.value)}>
                                <option value="">Tanlang...</option>
                                {patients.map(p => (
                                    <option key={p._id} value={p._id}>{p.firstName} {p.lastName} {p.phone ? `(${p.phone})` : ''}</option>
                                ))}
                            </select>
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
                                    <option key={d._id} value={d._id}>{d.firstName} {d.lastName}</option>
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
                                    <div>Xizmat</div>
                                    <div>Tish (ixtiyoriy)</div>
                                    <div>Narxi</div>
                                    <div>Soni</div>
                                    <div>Chegirma</div>
                                    <div></div>
                                </div>
                                {items.map((it, idx) => (
                                    <div key={idx} className="service-item-row">
                                        <select className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                            value={it.serviceId} onChange={e => handleItemChange(idx, 'serviceId', e.target.value)} required>
                                            <option value="">Tanlang</option>
                                            {services.map(s => (
                                                <option key={s._id || s.id} value={s._id || s.id}>{s.name} ({s.price} so'm)</option>
                                            ))}
                                        </select>
                                        <input type="text" className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Misol: 11,12" 
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
                        {items.length === 0 && <div style={{ marginTop: 8, fontSize: '0.85rem', color: '#6b7280' }}>Hali xizmat qo'shilmagan. Yuqoridagi tugmani bosing.</div>}
                    </div>

                    <div className="form-group" style={{ marginTop: 12 }}>
                        <label>Umumiy Izoh (Ichki uchun)</label>
                        <textarea className="flex w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]" rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}></textarea>
                    </div>

                    <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-200">
                        <div className="flex items-center gap-3 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-lg">
                            <span className="text-sm uppercase tracking-wider text-slate-400 font-medium">Jami:</span>
                            <span className="text-xl font-bold">{grandTotal.toLocaleString()} so'm</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button type="button" className="px-6 py-2.5 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 hover:text-slate-900 transition-colors bg-white shadow-sm" onClick={onClose} disabled={loading}>Bekor qilish</button>
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

