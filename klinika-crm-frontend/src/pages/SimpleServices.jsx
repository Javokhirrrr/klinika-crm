import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
    Plus, Search, Stethoscope, RefreshCw, X, Pencil, Trash2,
    LayoutGrid, Clock, DollarSign, CheckCircle
} from 'lucide-react';
import http from '../lib/http';

export default function SimpleServices() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [catFilter, setCatFilter] = useState('all');

    // Create/Edit modal
    const emptyForm = { _id: null, name: '', description: '', price: '', durationMinutes: 30, category: '' };
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const isEdit = useMemo(() => !!form._id, [form._id]);
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState('');

    useEffect(() => { loadServices(); }, []);

    const loadServices = async () => {
        try {
            setLoading(true);
            const res = await http.get('/services');
            setServices(res.items || res || []);
        } catch (error) { console.error('Load error:', error); }
        finally { setLoading(false); }
    };

    const categories = [...new Set(services.map(s => s.category).filter(Boolean))];

    const filteredServices = services.filter(s => {
        if (catFilter !== 'all' && s.category !== catFilter) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            if (!s.name?.toLowerCase().includes(q) && !s.description?.toLowerCase().includes(q) && !String(s.price).includes(q)) return false;
        }
        return true;
    });

    const hasFilters = searchQuery || catFilter !== 'all';
    const clearFilters = () => { setSearchQuery(''); setCatFilter('all'); };

    function openCreate() {
        setForm({ ...emptyForm });
        setMsg('');
        setShowForm(true);
    }
    function openEdit(service) {
        setForm({ ...emptyForm, ...service, durationMinutes: service.durationMinutes || service.duration || 30 });
        setMsg('');
        setShowForm(true);
    }
    function closeForm() { setShowForm(false); setForm(emptyForm); setMsg(''); }

    async function save() {
        if (!form.name?.trim()) { setMsg("Nomi majburiy!"); return; }
        if (!form.price || Number(form.price) < 0) { setMsg("Narxni kiriting!"); return; }
        if (!form.durationMinutes || Number(form.durationMinutes) < 1) { setMsg("Davomiylikni kiriting!"); return; }
        setBusy(true); setMsg('');
        const payload = {
            name: form.name.trim(),
            description: (form.description || '').trim(),
            price: Number(form.price),
            durationMinutes: Number(form.durationMinutes),
        };
        try {
            if (isEdit) {
                await http.put(`/services/${form._id}`, payload);
            } else {
                await http.post('/services', payload);
            }
            closeForm();
            await loadServices();
        } catch (e) {
            setMsg(e?.response?.data?.message || "Xatolik yuz berdi");
        } finally { setBusy(false); }
    }

    async function del(service) {
        if (!confirm(`"${service.name}" o'chirilsinmi?`)) return;
        try {
            await http.del(`/services/${service._id}`);
            await loadServices();
        } catch (e) { alert(e?.response?.data?.message || "Xatolik"); }
    }

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                            <LayoutGrid className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
                                Xizmatlar
                                <span className="text-sm font-bold text-violet-600 bg-violet-50 px-2.5 py-0.5 rounded-full">{filteredServices.length}</span>
                            </h1>
                            <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">Klinikada mavjud tibbiy xizmatlar</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={loadServices} className="rounded-xl border-gray-200 h-9">
                            <RefreshCw className="h-3.5 w-3.5 sm:mr-1.5" /> <span className="hidden sm:inline">Yangilash</span>
                        </Button>
                        <Button size="sm" onClick={openCreate} className="rounded-xl bg-violet-600 hover:bg-violet-700 shadow-md shadow-violet-600/25 h-9">
                            <Plus className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline">Yangi </span>Xizmat
                        </Button>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 bg-white rounded-2xl border border-gray-200/80 shadow-sm px-5 py-4">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Xizmat nomi yoki narxi..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-9 h-10 text-sm rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white"
                    />
                </div>

                {categories.length > 0 && (
                    <>
                        <div className="h-8 w-px bg-gray-200 hidden md:block" />
                        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100">
                            <button
                                onClick={() => setCatFilter('all')}
                                className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                                    catFilter === 'all' ? "bg-white shadow-sm text-violet-600" : "text-gray-500 hover:text-gray-800")}
                            >
                                Barchasi
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setCatFilter(cat)}
                                    className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap",
                                        catFilter === cat ? "bg-white shadow-sm text-violet-600" : "text-gray-500 hover:text-gray-800")}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </>
                )}

                {hasFilters && (
                    <button onClick={clearFilters} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="animate-pulse bg-white rounded-xl border border-gray-200/80 p-5">
                            <div className="h-10 w-10 bg-gray-100 rounded-xl mb-3" />
                            <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                            <div className="h-3 bg-gray-50 rounded w-1/2 mb-4" />
                            <div className="h-6 bg-gray-50 rounded w-1/3" />
                        </div>
                    ))}
                </div>
            ) : filteredServices.length === 0 ? (
                <div className="py-16 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <LayoutGrid className="h-8 w-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Xizmatlar topilmadi</h3>
                    <p className="text-sm text-gray-400 mt-1">Yangi xizmat qo'shish uchun "Yangi Xizmat" tugmasini bosing</p>
                    {hasFilters && (
                        <Button variant="outline" size="sm" className="mt-4 rounded-xl" onClick={clearFilters}>
                            Filtrlarni tozalash
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredServices.map((service) => (
                        <div key={service._id} className="group bg-white rounded-xl border border-gray-200/80 shadow-sm hover:shadow-lg transition-all duration-300">
                            <div className="p-5">
                                {/* Icon + Actions */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="h-10 w-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Stethoscope className="h-5 w-5" />
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEdit(service)}
                                            className="p-1.5 rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-100 transition-colors" title="Tahrirlash">
                                            <Pencil className="h-3.5 w-3.5" />
                                        </button>
                                        <button onClick={() => del(service)}
                                            className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors" title="O'chirish">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Name + description */}
                                <h3 className="text-base font-bold text-gray-900 group-hover:text-violet-600 transition-colors line-clamp-1">
                                    {service.name}
                                </h3>
                                <p className="text-xs text-gray-400 mt-1 line-clamp-2 min-h-[2rem]">
                                    {service.description || "Tavsif yo'q"}
                                </p>

                                {/* Duration */}
                                {(service.durationMinutes || service.duration) && (
                                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                                        <Clock className="h-3 w-3" />
                                        <span>{service.durationMinutes || service.duration} daqiqa</span>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <span className="text-lg font-black text-emerald-600">
                                    {service.price?.toLocaleString()} <span className="text-xs font-bold text-emerald-500">so'm</span>
                                </span>
                                {service.category && (
                                    <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full uppercase">
                                        {service.category}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            <Dialog open={showForm} onOpenChange={(open) => { if (!open) closeForm(); }}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
                    <div className="bg-gradient-to-r from-violet-600 to-violet-700 p-5">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2.5">
                                <div className="h-9 w-9 rounded-lg bg-white/15 flex items-center justify-center">
                                    {isEdit ? <Pencil className="h-4 w-4 text-white" /> : <Plus className="h-4 w-4 text-white" />}
                                </div>
                                {isEdit ? "Xizmatni tahrirlash" : "Yangi xizmat"}
                            </DialogTitle>
                        </DialogHeader>
                    </div>

                    <div className="p-5 space-y-4">
                        {/* Name */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nomi *</Label>
                            <Input
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                placeholder="Xizmat nomi"
                                className="h-10 rounded-xl border-gray-200"
                            />
                        </div>

                        {/* Price + Duration */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Narx (so'm) *</Label>
                                <Input
                                    type="number"
                                    value={form.price}
                                    onChange={e => setForm({ ...form, price: e.target.value })}
                                    placeholder="0"
                                    className="h-10 rounded-xl border-gray-200"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Davomiylik (daq) *</Label>
                                <Input
                                    type="number"
                                    value={form.durationMinutes}
                                    onChange={e => setForm({ ...form, durationMinutes: e.target.value })}
                                    placeholder="30"
                                    className="h-10 rounded-xl border-gray-200"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tavsif</Label>
                            <Input
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                placeholder="Xizmat haqida qisqacha..."
                                className="h-10 rounded-xl border-gray-200"
                            />
                        </div>
                    </div>

                    {/* Error */}
                    {msg && (
                        <div className="mx-5 mb-2 p-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">
                            ⚠️ {msg}
                        </div>
                    )}

                    {/* Footer */}
                    <div className="border-t border-gray-200 p-4 flex justify-end gap-2 bg-gray-50/50">
                        <Button variant="outline" size="sm" onClick={closeForm} className="rounded-xl px-5">Bekor</Button>
                        <Button size="sm" disabled={busy || !form.name?.trim()} onClick={save}
                            className="rounded-xl px-5 bg-violet-600 hover:bg-violet-700 shadow-md shadow-violet-600/25">
                            {busy ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <CheckCircle className="h-3.5 w-3.5 mr-1.5" />}
                            {busy ? "..." : isEdit ? "Yangilash" : "Saqlash"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
