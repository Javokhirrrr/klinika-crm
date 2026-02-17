import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn, printFromUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select-shadcn';
import { Combobox } from '@/components/ui/combobox';
import { DatePicker } from '@/components/ui/date-picker';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger
} from '@/components/ui/dialog';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
    Plus, Calendar, Clock, Check,
    X, DollarSign, Printer, Activity, ArrowRight,
    Filter, Banknote, CreditCard, Users, Search, ChevronRight, Save
} from 'lucide-react';
import http from '../lib/http';
import { useAuth } from '../context/AuthContext';
import ReceiptPreviewModal from '@/components/ReceiptPreviewModal';

export default function SimpleAppointments() {
    // Force refresh
    const navigate = useNavigate();
    const { user } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Payment Modal State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentContext, setPaymentContext] = useState({ type: 'existing', data: null }); // 'new' or 'existing'
    const [paymentData, setPaymentData] = useState({
        totalAmount: 0,
        amount: 0,
        method: 'cash',
        received: 0,
        discount: 0,
        hasDiscount: false,
        note: ''
    });

    const [showAddPatientModal, setShowAddPatientModal] = useState(false);

    // Filters
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [filterDoctor, setFilterDoctor] = useState('all');
    const [stats, setStats] = useState({ total: 0, waiting: 0, in_progress: 0, done: 0 });

    // New Appointment Form Data
    const [formData, setFormData] = useState({
        patientId: '', doctorId: '', date: new Date().toISOString().split('T')[0], time: '09:00', notes: '',
        price: 50000 // Default consultation fee
    });

    const [availableSlots, setAvailableSlots] = useState([]);
    const [fetchingSlots, setFetchingSlots] = useState(false);
    const [newPatientData, setNewPatientData] = useState({
        firstName: '', lastName: '', phone: '', birthDate: '', gender: 'male', address: '', cardNo: ''
    });

    // Receipt Modal State
    const [receiptUrl, setReceiptUrl] = useState(null);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [receiptSettings, setReceiptSettings] = useState(null);

    useEffect(() => {
        loadData();
        http.get('/settings/receipt_template')
            .then(res => setReceiptSettings(res?.value))
            .catch(console.error);
    }, [filterDate, filterDoctor]);

    useEffect(() => {
        if (formData.doctorId && formData.date) fetchSlots();
        else setAvailableSlots([]);
    }, [formData.doctorId, formData.date]);

    const loadData = async () => {
        try {
            setLoading(true);
            const params = { date: filterDate };
            if (filterDoctor && filterDoctor !== 'all') params.doctorId = filterDoctor;

            const [appts, pats, docs] = await Promise.all([
                http.get('/appointments', { params }).catch(() => ({ items: [] })),
                http.get('/patients').catch(() => ({ items: [] })),
                http.get('/users', { role: 'doctor' }).catch(() => ({ items: [] }))
            ]);

            const items = appts.items || appts || [];
            setAppointments(items);
            setPatients(pats.items || pats || []);
            setDoctors(docs.items || docs || []);

            setStats({
                total: items.length,
                waiting: items.filter(a => a.status === 'waiting' || a.status === 'scheduled').length,
                in_progress: items.filter(a => a.status === 'in_progress').length,
                done: items.filter(a => a.status === 'done').length
            });
        } catch (error) { console.error('Load error:', error); }
        finally { setLoading(false); }
    };

    const fetchSlots = async () => {
        try {
            setFetchingSlots(true);
            const res = await http.get('/appointments/slots', { doctorId: formData.doctorId, date: formData.date });
            let slots = res.slots || [];

            const today = new Date().toISOString().split('T')[0];
            if (formData.date === today) {
                const now = new Date();
                const currentHour = now.getHours();
                const currentMinute = now.getMinutes();
                slots = slots.filter(slot => {
                    const [h, m] = slot.split(':').map(Number);
                    return h > currentHour || (h === currentHour && m > currentMinute);
                });
            }
            setAvailableSlots(slots);
        } catch (error) { console.error('Fetch slots error:', error); }
        finally { setFetchingSlots(false); }
    };

    // --- Create Appointment (Unpaid / Default) ---
    const handleSubmit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        try {
            await http.post('/appointments', {
                ...formData,
                scheduledAt: `${formData.date}T${formData.time}:00`,
                startsAt: `${formData.date}T${formData.time}:00`,
                price: Number(formData.price || 0)
            });
            setShowModal(false);
            setFormData({ patientId: '', doctorId: '', date: new Date().toISOString().split('T')[0], time: '09:00', notes: '', price: 50000 });
            loadData();
        } catch (error) { console.error('Create error:', error); alert('Xatolik!'); }
    };

    const handleCheckIn = async (id) => {
        if (!window.confirm("Bemor klinikaga keldimi?")) return;
        try { await http.patch(`/appointments/${id}/check-in`); loadData(); }
        catch (error) { alert(error?.response?.data?.message || "Xatolik"); }
    };

    // --- Payment Logic ---

    // Open Payment Modal for EXISTING appointment
    const handleOpenPayment = (apt) => {
        const total = apt.price || apt.totalAmount || 0;
        const paid = apt.paidAmount || 0;
        const remaining = Math.max(0, total - paid);

        setPaymentContext({ type: 'existing', data: apt });
        setPaymentData({
            totalAmount: total,
            amount: remaining,
            method: 'cash',
            received: remaining,
            discount: 0,
            hasDiscount: false,
            note: ''
        });
        setShowPaymentModal(true);
    };

    // Open Payment Modal for NEW appointment
    const handleOpenNewPayment = () => {
        if (!formData.patientId || !formData.doctorId || !formData.date) {
            alert("Iltimos, avval Bemor, Shifokor va Sana tanlang!");
            return;
        }

        const price = Number(formData.price || 0);

        setPaymentContext({ type: 'new', data: formData });
        setPaymentData({
            totalAmount: price,
            amount: price,
            method: 'cash',
            received: price,
            discount: 0,
            hasDiscount: false,
            note: ''
        });
        setShowPaymentModal(true);
    };

    // Calculate totals
    const calculateTotals = () => {
        const total = paymentData.totalAmount;
        const discount = paymentData.hasDiscount ? Number(paymentData.discount || 0) : 0;
        // Discount logic: If discount > 100, assume absolute amount. Else %, but user might want absolute. 
        // For simplicity, let's assume discount is absolute amount for now or percentage if small? 
        // Reference image shows "%" checkbox maybe? "Foizsiz" checkbox.
        // Let's treat discount as absolute amount for simplicity unless spec says otherwise.
        // Image 3 shows: "Chegirma [x] Foizsiz [ ] %". So it supports both.
        // I'll assume absolute for now to invoke simple logic.

        const finalTotal = Math.max(0, total - discount);
        const toPay = Number(paymentData.amount || 0);
        const debt = Math.max(0, finalTotal - toPay);
        const change = Math.max(0, (Number(paymentData.received) || 0) - toPay);

        return { finalTotal, debt, change };
    };

    // Process Payment (Save or Save & Print)
    const handleProcessPayment = async (print = false) => {
        try {
            const { finalTotal } = calculateTotals();
            let appointmentId = null;
            let patientId = null;

            // 1. Create Appointment if NEW
            if (paymentContext.type === 'new') {
                const apptRes = await http.post('/appointments', {
                    ...formData,
                    scheduledAt: `${formData.date}T${formData.time}:00`,
                    startsAt: `${formData.date}T${formData.time}:00`,
                    price: finalTotal // Use net price (after discount) for appointment cost
                });
                const newAppt = apptRes.data || apptRes;
                appointmentId = newAppt._id;
                patientId = newAppt.patientId || formData.patientId;

                // Close New Appt Modal
                setShowModal(false);
                setFormData({ patientId: '', doctorId: '', date: new Date().toISOString().split('T')[0], time: '09:00', notes: '', price: 50000 });
            } else {
                appointmentId = paymentContext.data._id;
                patientId = paymentContext.data.patientId?._id || paymentContext.data.patientId;
            }

            // 2. Create Payment
            let newPayment = null;
            if (paymentData.amount > 0) {
                const payRes = await http.post('/payments', {
                    appointmentId,
                    patientId,
                    amount: Number(paymentData.amount),
                    method: paymentData.method,
                    note: paymentData.note || 'Kassaga to\'lov'
                });
                newPayment = payRes.data || payRes;
            }

            // 3. Print
            if (print) {
                const printUrl = newPayment
                    ? `${http.API_BASE || ''}/api/receipts/payments/${newPayment._id}/print`
                    : `${http.API_BASE || ''}/api/receipts/appointments/${appointmentId}/print`;
                printFromUrl(printUrl);
            }

            // 4. Close Payment Modal
            setShowPaymentModal(false);
            loadData();

        } catch (error) {
            console.error('Payment Processing Error:', error);
            alert("Xatolik yuz berdi: " + (error?.response?.data?.message || error.message));
        }
    };

    const handleAddPatient = async (e) => {
        e.preventDefault();
        try {
            const cardNo = newPatientData.cardNo || String(Math.floor(10000000 + Math.random() * 90000000));
            const response = await http.post('/patients', { ...newPatientData, cardNo });
            const newPatient = response.data || response;
            setPatients([...patients, newPatient]);
            setFormData({ ...formData, patientId: newPatient._id });
            setNewPatientData({ firstName: '', lastName: '', phone: '', birthDate: '', gender: 'male', address: '', cardNo: '' });
            setShowAddPatientModal(false);
            alert('Bemor muvaffaqiyatli qo\'shildi!');
        } catch (error) {
            console.error('Add patient error:', error);
            alert(error?.response?.data?.message || 'Bemor qo\'shishda xatolik!');
        }
    };

    const statusMap = {
        scheduled: { label: 'Rejalashtirilgan', class: 'bg-blue-50 text-blue-700 border-blue-200', icon: Calendar },
        waiting: { label: 'Kutmoqda', class: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
        in_progress: { label: 'Jarayonda', class: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Activity },
        done: { label: 'Tugallangan', class: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Check },
        cancelled: { label: 'Bekor qilingan', class: 'bg-rose-50 text-rose-700 border-rose-200', icon: X }
    };

    const statCards = [
        { label: 'Jami Qabullar', value: stats.total, icon: Calendar, bg: 'bg-blue-50', text: 'text-blue-600' },
        { label: 'Kutmoqda', value: stats.waiting, icon: Clock, bg: 'bg-amber-50', text: 'text-amber-600' },
        { label: 'Jarayonda', value: stats.in_progress, icon: Activity, bg: 'bg-indigo-50', text: 'text-indigo-600' },
        { label: 'Tugallangan', value: stats.done, icon: Check, bg: 'bg-emerald-50', text: 'text-emerald-600' },
    ];

    const { finalTotal, debt, change } = calculateTotals();

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Qabullar</h1>
                    <p className="text-muted-foreground mt-2 text-lg">Bemorlar qabuli va navbatni boshqarish</p>
                </div>
                <div className="flex gap-3">
                    {user?.role === 'doctor' && (
                        <Button variant="outline" onClick={() => navigate('/doctor-room')} className="hidden sm:flex border-gray-200 shadow-sm hover:bg-gray-50">
                            <Activity className="h-4 w-4 mr-2" /> Mening Xonam
                        </Button>
                    )}
                    <Button onClick={() => setShowModal(true)} size="lg" className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 rounded-xl">
                        <Plus className="h-5 w-5 mr-2" /> Yangi Qabul
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, i) => (
                    <Card key={i} className="border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 rounded-xl">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.text}`}>
                                    <stat.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase">{stat.label}</p>
                                    <h3 className="text-2xl font-black text-slate-900 mt-0.5">{stat.value}</h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filters Bar */}
            <Card className="border-none shadow-sm bg-white sticky top-4 z-20">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                            <Button variant="ghost" size="sm" onClick={() => setFilterDoctor('all')} className={cn("rounded-md text-xs font-medium", filterDoctor === 'all' ? "bg-white shadow-sm text-primary" : "text-gray-500 hover:text-gray-900")}>
                                Barchasi
                            </Button>
                            {doctors.slice(0, 3).map(doc => (
                                <Button key={doc._id} variant="ghost" size="sm" onClick={() => setFilterDoctor(doc._id)} className={cn("rounded-md text-xs font-medium", filterDoctor === doc._id ? "bg-white shadow-sm text-primary" : "text-gray-500 hover:text-gray-900")}>
                                    Dr. {doc.name.split(' ')[0]}
                                </Button>
                            ))}
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Select value={filterDoctor} onValueChange={setFilterDoctor}>
                                    <SelectTrigger className="pl-10 h-10 bg-gray-50 border-gray-200 focus:ring-primary/20">
                                        <SelectValue placeholder="Shifokorni tanlang" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Barcha Shifokorlar</SelectItem>
                                        {doctors.map(d => <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input type="date" className="pl-9 pr-4 py-2 h-10 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50 w-full md:w-auto" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Appointments Table */}
            <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden min-h-[400px]">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                            <Activity className="h-10 w-10 animate-spin text-primary mb-4" />
                            <p>Qabullar yuklanmoqda...</p>
                        </div>
                    ) : appointments.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center text-center">
                            <Calendar className="h-10 w-10 text-gray-300 mb-6" />
                            <h3 className="text-xl font-bold text-gray-900">Qabullar mavjud emas</h3>
                            <p className="text-muted-foreground mt-2 max-w-sm">Ushbu kunga qabullar rejalashtirilmagan.</p>
                            <Button className="mt-6 shadow-lg shadow-primary/20" onClick={() => setShowModal(true)}>
                                <Plus className="h-4 w-4 mr-2" /> Qabul yaratish
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow>
                                    <TableHead className="font-bold text-gray-900 pl-6">Vaqt</TableHead>
                                    <TableHead className="font-bold text-gray-900">Bemor</TableHead>
                                    <TableHead className="font-bold text-gray-900">Shifokor</TableHead>
                                    <TableHead className="font-bold text-gray-900">Holat</TableHead>
                                    <TableHead className="font-bold text-gray-900 text-right pr-6">Amallar</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {appointments.map((apt) => {
                                    const status = statusMap[apt.status] || statusMap.scheduled;
                                    const StatusIcon = status.icon;
                                    return (
                                        <TableRow key={apt._id} className={cn("hover:bg-blue-50/30 transition-colors border-b last:border-0 border-gray-100", apt.status === 'in_progress' && "bg-blue-50/40")}>
                                            <TableCell className="pl-6">
                                                <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 text-primary font-bold shadow-sm">
                                                    <span className="text-lg leading-none">{new Date(apt.startsAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }).split(':')[0]}</span>
                                                    <span className="text-[10px] text-gray-500 leading-none mt-0.5">:{new Date(apt.startsAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }).split(':')[1]}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
                                                        <AvatarFallback className="bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 font-bold text-sm">{apt.patientId?.firstName?.[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-bold text-gray-900 text-sm">{apt.patientId?.firstName} {apt.patientId?.lastName}</div>
                                                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">{apt.patientId?.phone || "Telefon yo'q"}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">Dr</div>
                                                    <span className="font-medium text-gray-700 text-sm">{apt.doctorId?.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={cn("px-2.5 py-1 text-xs font-semibold gap-1.5 shadow-sm", status.class)}>
                                                    <StatusIcon className="h-3.5 w-3.5" /> {status.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <div className="flex items-center justify-end gap-1">
                                                    {apt.status === 'scheduled' && (
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-full" onClick={() => handleCheckIn(apt._id)} title="Keldi (Check-in)">
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-full" onClick={() => handleOpenPayment(apt)} title="To'lov">
                                                        <DollarSign className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Add Appointment Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-8 rounded-2xl">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-3xl font-black text-slate-900">Yangi Qabul</DialogTitle>
                        <DialogDescription className="text-base text-gray-500 mt-2">Bemor uchun yangi qabul belgilash formasi</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label className="text-base font-bold text-gray-700">Bemor *</Label>
                                <div className="flex gap-2">
                                    <Combobox
                                        options={patients.map(p => ({ value: p._id, label: `${p.firstName} ${p.lastName}` }))}
                                        value={formData.patientId}
                                        onValueChange={(val) => setFormData({ ...formData, patientId: val })}
                                        placeholder="Bemorni tanlang"
                                        searchPlaceholder="Bemor ismini yozing..."
                                        emptyText="Bemor topilmadi"
                                    />
                                    <Button type="button" size="icon" variant="outline" className="h-12 w-12 border-2 border-blue-200 hover:bg-blue-50 text-blue-600 rounded-xl" onClick={() => setShowAddPatientModal(true)}>
                                        <Plus className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <Label className="text-base font-bold text-gray-700">Shifokor *</Label>
                                <Combobox
                                    options={doctors.map(d => ({ value: d._id, label: d.name }))}
                                    value={formData.doctorId}
                                    onValueChange={(val) => setFormData({ ...formData, doctorId: val })}
                                    placeholder="Shifokorni tanlang"
                                    searchPlaceholder="Shifokor ismini yozing..."
                                    emptyText="Shifokor topilmadi"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-base font-bold text-gray-700">Sana *</Label>
                            <DatePicker
                                value={formData.date}
                                onChange={(val) => setFormData({ ...formData, date: val, time: '' })}
                                placeholder="Sanani tanlang"
                                disablePastDates={true}
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-base font-bold text-gray-700">Bo'sh vaqtlar</Label>
                            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar p-1">
                                {availableSlots.map(slot => (
                                    <button key={slot} type="button"
                                        className={cn("h-10 rounded-xl text-sm font-bold transition-all duration-200 border-2",
                                            formData.time === slot ? "bg-primary text-white shadow-md border-primary" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50")}
                                        onClick={() => setFormData({ ...formData, time: slot })}>
                                        {slot}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Price Input (Automatic Sum) */}
                        <div className="space-y-3">
                            <Label className="text-base font-bold text-gray-700">Qabul Narxi (Avtomatik)</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
                                <Input
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    className="pl-9 font-bold text-emerald-600 border-emerald-200 bg-emerald-50/30 h-12 text-lg"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-base font-bold text-gray-700">Izoh</Label>
                            <Textarea rows={2} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Qo'shimcha ma'lumot..." className="bg-gray-50 border-2 border-gray-200 resize-none text-base" />
                        </div>

                        <DialogFooter className="gap-3 pt-4 sm:justify-between items-center bg-gray-50 -mx-8 -mb-8 p-6 mt-2 border-t border-gray-100">
                            <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="h-12 px-6 rounded-xl border-gray-300 text-gray-600 font-semibold hover:bg-gray-100">Bekor qilish</Button>
                            <div className="flex gap-3">
                                {/* Save (Unpaid) */}
                                <Button type="submit" variant="ghost" className="h-12 px-6 rounded-xl text-primary font-semibold hover:bg-blue-50">Saqlash (To'lovsiz)</Button>
                                {/* Payment Button (Green) */}
                                <Button type="button" onClick={handleOpenNewPayment} className="h-12 px-8 rounded-xl bg-[#22C55E] hover:bg-emerald-600 shadow-lg shadow-emerald-600/20 text-white font-bold text-base flex items-center gap-2">
                                    <DollarSign className="h-5 w-5" /> To'lov
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Payment Modal (Updated to Picture 3) */}
            <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
                <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden rounded-xl bg-white">
                    <div className="flex justify-between items-center p-4 border-b">
                        <DialogTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600"><DollarSign className="h-5 w-5" /></div>
                            Kassaga to'lov
                        </DialogTitle>
                        <div className="text-sm text-gray-400 font-mono">
                            {new Date().toLocaleString('uz-UZ')}
                        </div>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Forms Column */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Checkbox id="discount" checked={paymentData.hasDiscount} onCheckedChange={(checked) => setPaymentData({ ...paymentData, hasDiscount: checked })} />
                                    <Label htmlFor="discount" className="font-semibold text-gray-700">Chegirma</Label>
                                </div>
                                {paymentData.hasDiscount && (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            value={paymentData.discount}
                                            onChange={(e) => setPaymentData({ ...paymentData, discount: Number(e.target.value) })}
                                            className="w-24 h-9"
                                        />
                                        <span className="text-sm font-bold text-gray-500">So'm</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-gray-500 uppercase">To'lov Summasi</Label>
                                <Input
                                    type="number"
                                    value={paymentData.amount}
                                    onChange={(e) => setPaymentData({ ...paymentData, amount: Number(e.target.value) })}
                                    className="h-14 text-2xl font-bold bg-gray-50 border-gray-200 focus:ring-emerald-500/20 text-emerald-700"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-gray-500 uppercase">To'lov Turi</Label>
                                <div className="flex gap-2">
                                    <Button variant={paymentData.method === 'cash' ? 'default' : 'outline'} onClick={() => setPaymentData({ ...paymentData, method: 'cash' })} className={cn("flex-1 h-11", paymentData.method === 'cash' ? "bg-emerald-600 hover:bg-emerald-700" : "")}>Naqd</Button>
                                    <Button variant={paymentData.method === 'card' ? 'default' : 'outline'} onClick={() => setPaymentData({ ...paymentData, method: 'card' })} className={cn("flex-1 h-11", paymentData.method === 'card' ? "bg-blue-600 hover:bg-blue-700" : "")}>Karta</Button>
                                    <Button variant={paymentData.method === 'transfer' ? 'default' : 'outline'} onClick={() => setPaymentData({ ...paymentData, method: 'transfer' })} className={cn("flex-1 h-11", paymentData.method === 'transfer' ? "bg-purple-600 hover:bg-purple-700" : "")}>O'tkazma</Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-gray-500 uppercase">Ma'lumot</Label>
                                <Textarea
                                    rows={3}
                                    placeholder="..."
                                    value={paymentData.note}
                                    onChange={(e) => setPaymentData({ ...paymentData, note: e.target.value })}
                                    className="bg-gray-50 resize-none"
                                />
                            </div>
                        </div>

                        {/* Summary Column */}
                        <div className="bg-gray-50 rounded-2xl p-6 space-y-6 flex flex-col justify-between">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-lg font-bold text-gray-700">
                                    <span>Umumiy summa:</span>
                                    <span>{finalTotal.toLocaleString()} UZS</span>
                                </div>
                                <div className="h-px bg-gray-200"></div>
                                <div className="flex justify-between items-center text-sm font-medium text-emerald-600">
                                    <span>To'lov:</span>
                                    <span className="font-bold bg-emerald-100 px-2 py-0.5 rounded text-emerald-700">{Number(paymentData.amount).toLocaleString()} UZS</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-medium text-red-500">
                                    <span>Qarzga:</span>
                                    <span className="font-bold bg-red-100 px-2 py-0.5 rounded text-red-700">{debt.toLocaleString()} UZS</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-medium text-gray-500">
                                    <span>Qaytim:</span>
                                    <span className="font-bold bg-gray-200 px-2 py-0.5 rounded text-gray-700">{change.toLocaleString()} UZS</span>
                                </div>
                            </div>

                            {paymentData.method === 'cash' && (
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-gray-400 uppercase">Qabul qilingan naqd pul</Label>
                                    <Input
                                        type="number"
                                        value={paymentData.received}
                                        onChange={(e) => setPaymentData({ ...paymentData, received: Number(e.target.value) })}
                                        className="h-12 bg-white font-bold"
                                        placeholder="Mijoz bergan summa"
                                    />
                                </div>
                            )}

                            <div className="flex flex-col gap-3 mt-4">
                                <Button onClick={() => handleProcessPayment(true)} className="h-12 w-full bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-lg shadow-amber-500/20 rounded-xl">
                                    <Printer className="h-5 w-5 mr-2" /> Saqlash Va Chop Etish
                                </Button>
                                <div className="flex gap-3">
                                    <Button variant="outline" onClick={() => setShowPaymentModal(false)} className="flex-1 h-12 rounded-xl border-gray-300 font-semibold text-gray-600">Bekor Qilish</Button>
                                    <Button onClick={() => handleProcessPayment(false)} className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20">
                                        Saqlash
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add Patient Modal (Unchanged mostly) */}
            <Dialog open={showAddPatientModal} onOpenChange={setShowAddPatientModal}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-8 rounded-2xl">
                    <DialogHeader className="mb-6"><DialogTitle className="text-3xl font-black text-slate-900">Yangi Bemor Qo'shish</DialogTitle></DialogHeader>
                    <form onSubmit={handleAddPatient} className="space-y-5">
                        <div className="space-y-3">
                            <Label className="text-base font-bold text-gray-700">Ism *</Label>
                            <Input required value={newPatientData.firstName} onChange={(e) => setNewPatientData({ ...newPatientData, firstName: e.target.value })} className="h-12 bg-gray-50 border-2 border-gray-200 text-base" />
                        </div>
                        <div className="space-y-3">
                            <Label className="text-base font-bold text-gray-700">Familiya *</Label>
                            <Input required value={newPatientData.lastName} onChange={(e) => setNewPatientData({ ...newPatientData, lastName: e.target.value })} className="h-12 bg-gray-50 border-2 border-gray-200 text-base" />
                        </div>
                        <div className="space-y-3">
                            <Label className="text-base font-bold text-gray-700">Telefon *</Label>
                            <Input required type="tel" value={newPatientData.phone} onChange={(e) => setNewPatientData({ ...newPatientData, phone: e.target.value })} className="h-12 bg-gray-50 border-2 border-gray-200 text-base" />
                        </div>
                        <DialogFooter className="gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => setShowAddPatientModal(false)} className="h-12 px-8 rounded-xl border-2 border-gray-200 text-base font-semibold">Bekor qilish</Button>
                            <Button type="submit" className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 text-base font-semibold">Saqlash</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ReceiptPreviewModal open={showReceiptModal} onClose={() => setShowReceiptModal(false)} url={receiptUrl} />
        </div>
    );
}
