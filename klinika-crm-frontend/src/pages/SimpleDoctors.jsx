import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
    Plus, Search, Phone, Eye, Wallet,
    X, User, Star, Clock, Stethoscope, RefreshCw, MapPin,
    Pencil, Trash2, ToggleLeft, ToggleRight, UserPlus
} from 'lucide-react';
import http from '../lib/http';
import { useAuth } from '../context/AuthContext';

const fmtPhone = (s) => (s || "").replace(/[^\d+]/g, "");

export default function SimpleDoctors() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [specFilter, setSpecFilter] = useState('all');
    const [showDetails, setShowDetails] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState(null);

    // Create/Edit modal
    const emptyForm = {
        _id: null, firstName: "", lastName: "", phone: "", spec: "",
        room: "", percent: 0, note: "", isActive: true,
        createLoginAccess: false, loginEmail: "", loginPassword: "",
    };
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const isEdit = useMemo(() => !!form._id, [form._id]);
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState("");

    useEffect(() => { loadDoctors(); }, []);

    const loadDoctors = async () => {
        try {
            setLoading(true);
            const res = await http.get('/doctors');
            setDoctors(res.items || res || []);
        } catch (error) { console.error('Load error:', error); }
        finally { setLoading(false); }
    };

    const specializations = [...new Set(doctors.map(d => d.spec).filter(Boolean))];

    const filteredDoctors = doctors
        .filter(doctor => {
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                if (!`${doctor.firstName} ${doctor.lastName}`.toLowerCase().includes(q)
                    && !doctor.spec?.toLowerCase().includes(q)
                    && !doctor.phone?.includes(q)) return false;
            }
            if (statusFilter === 'active' && !doctor.isActive) return false;
            if (statusFilter === 'inactive' && doctor.isActive) return false;
            if (specFilter !== 'all' && doctor.spec !== specFilter) return false;
            return true;
        })
        .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));

    const clearFilters = () => { setSearchQuery(''); setStatusFilter('all'); setSpecFilter('all'); };
    const hasFilters = searchQuery || statusFilter !== 'all' || specFilter !== 'all';

    // Form handlers
    function openCreate() {
        setForm({ ...emptyForm });
        setMsg("");
        setShowForm(true);
    }
    function openEdit(doctor) {
        setForm({ ...emptyForm, ...doctor });
        setMsg("");
        setShowForm(true);
    }
    function closeForm() { setShowForm(false); setForm(emptyForm); setMsg(""); }

    async function save() {
        if (!form.firstName?.trim()) { setMsg("Ism majburiy!"); return; }
        setBusy(true); setMsg("");
        const payload = {
            firstName: form.firstName.trim(),
            lastName: (form.lastName || "").trim(),
            phone: fmtPhone(form.phone),
            spec: (form.spec || "").trim(),
            room: (form.room || "").trim(),
            percent: Number(form.percent || 0),
            note: (form.note || "").trim(),
            isActive: form.isActive,
            createLoginAccess: !isEdit && form.createLoginAccess,
            loginEmail: form.loginEmail,
            loginPassword: form.loginPassword,
        };
        try {
            if (isEdit) {
                await http.put(`/doctors/${form._id}`, payload);
            } else {
                await http.post(`/doctors`, payload);
            }
            closeForm();
            await loadDoctors();
        } catch (e) {
            setMsg(e?.response?.data?.message || "Xatolik yuz berdi");
        } finally { setBusy(false); }
    }

    async function del(doctor) {
        if (!confirm(`"${doctor.firstName} ${doctor.lastName}" o'chirilsinmi?`)) return;
        try {
            await http.del(`/doctors/${doctor._id}`);
            await loadDoctors();
        } catch (e) { alert(e?.response?.data?.message || "Xatolik"); }
    }

    async function toggleActive(doctor) {
        try {
            await http.patch(`/doctors/${doctor._id}/toggle-active`);
            await loadDoctors();
        } catch (e) { alert(e?.response?.data?.message || "Xatolik"); }
    }

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header — compact */}
            {/* Header */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Stethoscope className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
                                Shifokorlar
                                <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">{filteredDoctors.length}</span>
                            </h1>
                            <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">Klinikamizning malakali mutaxassislari</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={loadDoctors} className="rounded-xl border-gray-200 h-9">
                            <RefreshCw className="h-3.5 w-3.5 sm:mr-1.5" /> <span className="hidden sm:inline">Yangilash</span>
                        </Button>
                        <Button size="sm" onClick={openCreate} className="rounded-xl bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/25 h-9">
                            <Plus className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline">Yangi </span>Shifokor
                        </Button>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 bg-white rounded-2xl border border-gray-200/80 shadow-sm px-5 py-4">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Ism, telefon yoki mutaxassislik qidirish..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-10 text-sm rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white"
                    />
                </div>

                {/* Separator */}
                <div className="h-8 w-px bg-gray-200 hidden md:block" />

                {/* Spec filter pills */}
                <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100">
                    <button
                        onClick={() => setSpecFilter('all')}
                        className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                            specFilter === 'all' ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-800")}
                    >
                        Barchasi
                    </button>
                    {specializations.map(spec => (
                        <button
                            key={spec}
                            onClick={() => setSpecFilter(spec)}
                            className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap",
                                specFilter === spec ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-800")}
                        >
                            {spec}
                        </button>
                    ))}
                </div>

                {/* Status filter pills */}
                <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100">
                    {[
                        { key: 'all', label: 'Hammasi' },
                        { key: 'active', label: 'Faol' },
                        { key: 'inactive', label: 'Nofaol' },
                    ].map(item => (
                        <button
                            key={item.key}
                            onClick={() => setStatusFilter(item.key)}
                            className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                                statusFilter === item.key ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-800")}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                {hasFilters && (
                    <button onClick={clearFilters} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Tozalash">
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Doctors Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                        <Card key={i} className="animate-pulse border-none shadow-sm rounded-xl overflow-hidden">
                            <div className="h-16 bg-gray-100" />
                            <CardContent className="p-4 pt-0 relative">
                                <div className="w-14 h-14 rounded-full bg-gray-200 absolute -top-7 left-4 ring-4 ring-white" />
                                <div className="mt-9 space-y-2">
                                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                                    <div className="h-3 bg-gray-50 rounded w-1/2" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : filteredDoctors.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <User className="h-8 w-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Shifokorlar topilmadi</h3>
                    <p className="text-sm text-gray-400 mt-1">Qidiruv so'rovingizga mos keladigan shifokorlar yo'q</p>
                    {hasFilters && (
                        <Button variant="outline" size="sm" className="mt-4 rounded-xl" onClick={clearFilters}>
                            Filtrlarni tozalash
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredDoctors.map((doctor) => (
                        <Card key={doctor._id} className="group border border-gray-200/80 shadow-sm hover:shadow-lg transition-all duration-300 bg-white overflow-hidden flex flex-col h-full rounded-xl">
                            {/* Compact Card Header */}
                            <div className="h-16 relative bg-gradient-to-r from-blue-600 to-indigo-600">
                                <div className="absolute top-2 right-2">
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-full text-[10px] font-bold",
                                        doctor.isActive ? "bg-emerald-400/20 text-emerald-100" : "bg-black/20 text-white/70"
                                    )}>
                                        {doctor.isActive ? 'Faol' : 'Nofaol'}
                                    </span>
                                </div>
                                {/* Action buttons on hover */}
                                <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); openEdit(doctor); }}
                                        className="p-1.5 rounded-lg bg-white/15 hover:bg-white/30 text-white transition-colors" title="Tahrirlash">
                                        <Pencil className="h-3 w-3" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleActive(doctor); }}
                                        className="p-1.5 rounded-lg bg-white/15 hover:bg-white/30 text-white transition-colors" title={doctor.isActive ? "O'chirish" : "Faollashtirish"}>
                                        {doctor.isActive ? <ToggleRight className="h-3 w-3" /> : <ToggleLeft className="h-3 w-3" />}
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); del(doctor); }}
                                        className="p-1.5 rounded-lg bg-white/15 hover:bg-red-400/40 text-white transition-colors" title="O'chirish">
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>

                            <CardContent className="p-4 pt-0 flex-1 flex flex-col relative">
                                {/* Avatar */}
                                <div className="-mt-8 mb-2">
                                    <Avatar className="h-16 w-16 ring-[3px] ring-white shadow-md bg-white">
                                        {doctor.avatar && <AvatarImage src={doctor.avatar} className="object-cover" />}
                                        <AvatarFallback className="bg-gradient-to-br from-gray-50 to-gray-100 text-gray-400 text-xl font-bold">
                                            {doctor.firstName?.[0]}{doctor.lastName?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>

                                {/* Info */}
                                <div className="mb-3 flex-1">
                                    <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                                        {doctor.firstName} {doctor.lastName}
                                    </h3>
                                    <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                                        <Stethoscope className="h-3 w-3 text-blue-500" />
                                        <span className="line-clamp-1">{doctor.spec || "—"}</span>
                                    </div>
                                    {doctor.phone && (
                                        <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
                                            <Phone className="h-3 w-3" />
                                            <span>{doctor.phone}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="pt-3 border-t border-gray-100 grid grid-cols-2 gap-2">
                                    <Button variant="outline" size="sm"
                                        className="w-full h-8 text-xs font-semibold rounded-lg hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                                        onClick={() => { setSelectedDoctor(doctor); setShowDetails(true); }}>
                                        <Eye className="h-3 w-3 mr-1" /> Ko'rish
                                    </Button>
                                    <Button size="sm"
                                        className="w-full h-8 text-xs font-semibold rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border-none shadow-none"
                                        onClick={() => navigate(`/doctors/${doctor._id}/wallet`)}>
                                        <Wallet className="h-3 w-3 mr-1" /> Hamyon
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Details Modal */}
            <Dialog open={showDetails} onOpenChange={setShowDetails}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-2xl bg-white">
                    {selectedDoctor && (
                        <>
                            <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
                                <Button size="icon" variant="ghost" onClick={() => setShowDetails(false)}
                                    className="absolute top-3 right-3 text-white hover:bg-white/20 rounded-full h-8 w-8">
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="px-5 pb-5 -mt-12 relative">
                                <Avatar className="h-24 w-24 ring-4 ring-white shadow-xl bg-white">
                                    {selectedDoctor.avatar && <AvatarImage src={selectedDoctor.avatar} className="object-cover" />}
                                    <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200 text-gray-500 text-3xl font-bold">
                                        {selectedDoctor.firstName?.[0]}{selectedDoctor.lastName?.[0]}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="mt-3">
                                    <h2 className="text-xl font-bold text-gray-900">{selectedDoctor.firstName} {selectedDoctor.lastName}</h2>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                                            <Stethoscope className="h-3 w-3" />
                                            {selectedDoctor.spec || "—"}
                                        </span>
                                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-bold",
                                            selectedDoctor.isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600")}>
                                            {selectedDoctor.isActive ? '✓ Faol' : '✕ Nofaol'}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-5 grid grid-cols-2 gap-3">
                                    {[
                                        { label: "Telefon", value: selectedDoctor.phone || "—", icon: Phone, color: "text-blue-600 bg-blue-50" },
                                        { label: "Kabinet", value: selectedDoctor.room || "—", icon: MapPin, color: "text-emerald-600 bg-emerald-50" },
                                        { label: "Reyting", value: selectedDoctor.rating ? selectedDoctor.rating.toFixed(1) : "—", icon: Star, color: "text-amber-500 bg-amber-50" },
                                        { label: "Tajriba", value: selectedDoctor.experience ? `${selectedDoctor.experience} yil` : "—", icon: Clock, color: "text-purple-600 bg-purple-50" },
                                    ].map((item, i) => {
                                        const Icon = item.icon;
                                        return (
                                            <div key={i} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center mb-2 ${item.color}`}>
                                                    <Icon className="h-4 w-4" />
                                                </div>
                                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{item.label}</p>
                                                <p className="text-sm font-bold text-gray-900 mt-0.5">{item.value}</p>
                                            </div>
                                        );
                                    })}
                                </div>

                                {selectedDoctor.bio && (
                                    <div className="mt-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Ma'lumot</h4>
                                        <p className="text-sm text-gray-600">{selectedDoctor.bio}</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 pt-0 flex gap-2">
                                <Button variant="outline" className="flex-1 h-10 rounded-xl" onClick={() => { setShowDetails(false); openEdit(selectedDoctor); }}>
                                    <Pencil className="h-4 w-4 mr-2" /> Tahrirlash
                                </Button>
                                <Button className="flex-1 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20"
                                    onClick={() => navigate(`/doctors/${selectedDoctor._id}/wallet`)}>
                                    <Wallet className="h-4 w-4 mr-2" /> Hamyon
                                </Button>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Create/Edit Modal */}
            <Dialog open={showForm} onOpenChange={(open) => { if (!open) closeForm(); }}>
                <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
                    {/* Modal Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2.5">
                                <div className="h-9 w-9 rounded-lg bg-white/15 flex items-center justify-center">
                                    {isEdit ? <Pencil className="h-4 w-4 text-white" /> : <UserPlus className="h-4 w-4 text-white" />}
                                </div>
                                {isEdit ? "Shifokorni tahrirlash" : "Yangi shifokor"}
                            </DialogTitle>
                        </DialogHeader>
                    </div>

                    <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                        {/* Ism/Familiya */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ism *</Label>
                                <Input
                                    value={form.firstName}
                                    onChange={e => setForm({ ...form, firstName: e.target.value })}
                                    placeholder="Ism"
                                    className="h-10 rounded-xl border-gray-200"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Familiya</Label>
                                <Input
                                    value={form.lastName}
                                    onChange={e => setForm({ ...form, lastName: e.target.value })}
                                    placeholder="Familiya"
                                    className="h-10 rounded-xl border-gray-200"
                                />
                            </div>
                        </div>

                        {/* Telefon/Mutaxassislik */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Telefon</Label>
                                <Input
                                    value={form.phone}
                                    onChange={e => setForm({ ...form, phone: e.target.value })}
                                    placeholder="+998..."
                                    className="h-10 rounded-xl border-gray-200"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Mutaxassislik</Label>
                                <Input
                                    list="specs_dl"
                                    value={form.spec}
                                    onChange={e => setForm({ ...form, spec: e.target.value })}
                                    placeholder="LOR, Stomatolog..."
                                    className="h-10 rounded-xl border-gray-200"
                                />
                                <datalist id="specs_dl">
                                    {specializations.map(s => <option key={s} value={s} />)}
                                </datalist>
                            </div>
                        </div>

                        {/* Kabinet/Foiz */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Kabinet</Label>
                                <Input
                                    value={form.room}
                                    onChange={e => setForm({ ...form, room: e.target.value })}
                                    placeholder="101"
                                    className="h-10 rounded-xl border-gray-200"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Foiz (%)</Label>
                                <Input
                                    type="number"
                                    value={form.percent}
                                    onChange={e => setForm({ ...form, percent: e.target.value })}
                                    className="h-10 rounded-xl border-gray-200"
                                />
                            </div>
                        </div>

                        {/* Izoh */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Izoh</Label>
                            <Textarea
                                rows={2}
                                value={form.note}
                                onChange={e => setForm({ ...form, note: e.target.value })}
                                placeholder="Ixtiyoriy izoh..."
                                className="rounded-xl border-gray-200 resize-none"
                            />
                        </div>

                        {/* Faol */}
                        <div className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <input type="checkbox" id="isActive" className="h-4 w-4 rounded border-gray-300 text-blue-600"
                                checked={!!form.isActive}
                                onChange={e => setForm({ ...form, isActive: e.target.checked })} />
                            <Label htmlFor="isActive" className="cursor-pointer text-sm font-semibold text-gray-700">Faol shifokor</Label>
                        </div>

                        {/* Login Access */}
                        {!isEdit && (
                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                <div className="flex items-center gap-2.5 p-3 bg-gray-50 border-b border-gray-200">
                                    <input type="checkbox" id="createLoginAccess" className="h-4 w-4 rounded border-gray-300 text-blue-600"
                                        checked={!!form.createLoginAccess}
                                        onChange={e => setForm({ ...form, createLoginAccess: e.target.checked })} />
                                    <Label htmlFor="createLoginAccess" className="cursor-pointer text-sm font-bold">🔐 Login berish</Label>
                                </div>
                                {form.createLoginAccess && (
                                    <div className="p-3 grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email</Label>
                                            <Input type="email" value={form.loginEmail}
                                                onChange={e => setForm({ ...form, loginEmail: e.target.value })}
                                                placeholder="doctor@example.com" className="h-10 rounded-xl border-gray-200" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Parol</Label>
                                            <Input type="password" value={form.loginPassword}
                                                onChange={e => setForm({ ...form, loginPassword: e.target.value })}
                                                placeholder="Kamida 6 belgi" className="h-10 rounded-xl border-gray-200" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
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
                        <Button size="sm" disabled={busy || !form.firstName?.trim()} onClick={save}
                            className="rounded-xl px-5 bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/25">
                            {busy ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                            {busy ? "..." : isEdit ? "Yangilash" : "Saqlash"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
