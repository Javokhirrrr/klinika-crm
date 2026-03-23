import { useState, useEffect } from 'react';
import { FiX, FiPlus, FiTrash2, FiSave } from 'react-icons/fi';
import { treatmentPlanApi } from '../../api/treatmentPlan';
import http from '../../lib/http';
import './TreatmentPlan.css';

export default function CreateTreatmentPlanModal({ patient, onClose, onSave }) {
    const [loading, setLoading] = useState(false);
    const [doctors, setDoctors] = useState([]);
    const [services, setServices] = useState([]);
    
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
            const docsRes = await http.get('/users?role=doctor');
            setDoctors(Array.isArray(docsRes.items) ? docsRes.items : (Array.isArray(docsRes) ? docsRes : []));
            
            // Load Services
            const srvRes = await http.get('/services');
            setServices(Array.isArray(srvRes.items) ? srvRes.items : (Array.isArray(srvRes) ? srvRes : []));
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
                patientId: patient._id || patient.id,
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
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" style={{ maxWidth: '800px', width: '95vw' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Yangi Davolash Rejasi</h2>
                    <button className="modal-close" onClick={onClose}><FiX /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-group" style={{ marginBottom: 12 }}>
                        <label>Bemor</label>
                        <input type="text" className="form-input" disabled value={`${patient.firstName} ${patient.lastName}`} />
                    </div>

                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                        <div className="form-group">
                            <label>Diagnoz / Reja Nomi *</label>
                            <input type="text" className="form-input" required 
                                value={form.diagnosis} onChange={e => setForm({...form, diagnosis: e.target.value})} 
                                placeholder="Masalan: Yuqori jag' implantatsiyasi" />
                        </div>
                        <div className="form-group">
                            <label>Mas'ul Shifokor *</label>
                            <select className="form-select" required value={form.doctorId} onChange={e => setForm({...form, doctorId: e.target.value})}>
                                <option value="">Tanlang...</option>
                                {doctors.map(d => (
                                    <option key={d._id} value={d._id}>{d.firstName} {d.lastName}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label style={{ margin: 0 }}>Muolaja Bosqichlari (Xizmatlar) *</label>
                            <button type="button" className="btn-secondary" onClick={handleAddItem} style={{ padding: '4px 8px', fontSize: '0.8rem' }}>
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
                                        <select className="form-select" 
                                            value={it.serviceId} onChange={e => handleItemChange(idx, 'serviceId', e.target.value)} required>
                                            <option value="">Tanlang</option>
                                            {services.map(s => (
                                                <option key={s._id || s.id} value={s._id || s.id}>{s.name} ({s.price} so'm)</option>
                                            ))}
                                        </select>
                                        <input type="text" className="form-input" placeholder="Misol: 11,12" 
                                            value={it.tooth} onChange={e => handleItemChange(idx, 'tooth', e.target.value)} />
                                        <input type="number" className="form-input" min="0" 
                                            value={it.price} onChange={e => handleItemChange(idx, 'price', e.target.value)} required />
                                        <input type="number" className="form-input" min="1" 
                                            value={it.quantity} onChange={e => handleItemChange(idx, 'quantity', e.target.value)} required />
                                        <input type="number" className="form-input" min="0" 
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
                        <textarea className="form-textarea" rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}></textarea>
                    </div>

                    <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
                        <div className="grand-total-display">
                            <span className="grand-total-label">Jami:</span>
                            <span className="grand-total-value">{grandTotal.toLocaleString()} so'm</span>
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading} style={{ padding: '10px 20px' }}>Bekor qilish</button>
                            <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <FiSave /> {loading ? "Saqlanmoqda..." : "Rejani Saqlash"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
