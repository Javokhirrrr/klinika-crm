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
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger
} from '@/components/ui/dialog';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
    Plus, Calendar, Clock, Check,
    X, DollarSign, Printer, Activity, ArrowRight,
    Filter, Banknote, CreditCard, Users, Search, ChevronRight
} from 'lucide-react';
import http from '../lib/http';
import { useAuth } from '../context/AuthContext';
import Receipt from '@/components/Receipt';
import ReceiptPreviewModal from '@/components/ReceiptPreviewModal';

export default function SimpleAppointments() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showAddPatientModal, setShowAddPatientModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [filterDoctor, setFilterDoctor] = useState('all');
    const [stats, setStats] = useState({ total: 0, waiting: 0, in_progress: 0, done: 0 });
    const [formData, setFormData] = useState({
        patientId: '', doctorId: '', date: new Date().toISOString().split('T')[0], time: '09:00', notes: ''
    });
    const [paymentData, setPaymentData] = useState({ amount: 0, method: 'cash', received: 0 });
    const [availableSlots, setAvailableSlots] = useState([]);
    const [fetchingSlots, setFetchingSlots] = useState(false);
    const [newPatientData, setNewPatientData] = useState({
        firstName: '', lastName: '', phone: '', birthDate: '', gender: 'male', address: '', cardNo: ''
    });

    // New Appointment Payment State
    const [includePayment, setIncludePayment] = useState(false);
    const [newApptPayment, setNewApptPayment] = useState({ amount: '', method: 'cash' });

    // Receipt Modal State
    const [receiptUrl, setReceiptUrl] = useState(null);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [receiptSettings, setReceiptSettings] = useState(null);

    useEffect(() => {
        loadData();
        // Load receipt settings
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

            // Bugungi sana tanlangan bo'lsa, o'tgan vaqtlarni filtrlash
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await http.post('/appointments', {
                ...formData,
                scheduledAt: `${formData.date}T${formData.time}:00`,
                startsAt: `${formData.date}T${formData.time}:00`
            });
            setShowModal(false);
            setFormData({ patientId: '', doctorId: '', date: new Date().toISOString().split('T')[0], time: '09:00', notes: '' });
            loadData();
        } catch (error) { console.error('Create error:', error); alert('Xatolik!'); }
    };

    const handleSaveAndPrint = async () => {
        if (!formData.patientId || !formData.doctorId || !formData.date) {
            alert("Barcha maydonlarni to'ldiring!");
            return;
        }

        try {
            // 1. Create Appointment
            const apptRes = await http.post('/appointments', {
                ...formData,
                scheduledAt: `${formData.date}T${formData.time}:00`,
                startsAt: `${formData.date}T${formData.time}:00`
            });
            const newAppt = apptRes.data || apptRes;

            let newPayment = null;
            // 2. Create Payment if included
            if (includePayment && newApptPayment.amount > 0) {
                const payRes = await http.post('/payments', {
                    appointmentId: newAppt._id,
                    patientId: newAppt.patientId || formData.patientId,
                    amount: Number(newApptPayment.amount),
                    method: newApptPayment.method,
                    note: 'Qabul vaqtida to\'lov'
                });
                newPayment = payRes.data || payRes;
            }

            // 3. Print (Server-side via iframe)
            const printUrl = newPayment
                ? `${http.API_BASE || ''}/api/receipts/payments/${newPayment._id}/print`
                : `${http.API_BASE || ''}/api/receipts/appointments/${newAppt._id}/print`;

            printFromUrl(printUrl);

            // 4. Cleanup
            setShowModal(false);
            setFormData({ patientId: '', doctorId: '', date: new Date().toISOString().split('T')[0], time: '09:00', notes: '' });
            setIncludePayment(false);
            setNewApptPayment({ amount: '', method: 'cash' });
            loadData();
        } catch (error) {
            console.error('Save & Print error:', error);
            alert("Xatolik yuz berdi! " + (error?.response?.data?.message || ''));
        }
    };

    const handleCheckIn = async (id) => {
        if (!window.confirm("Bemor klinikaga keldimi?")) return;
        try { await http.patch(`/appointments/${id}/check-in`); loadData(); }
        catch (error) { alert(error?.response?.data?.message || "Xatolik"); }
    };

    const handleOpenPayment = (apt) => {
        setSelectedAppointment(apt);
        // Default to remaining amount or total amount
        const amountToPay = (apt.totalAmount || 0) - (apt.paidAmount || 0);
        setPaymentData({ amount: amountToPay, method: 'cash', received: amountToPay });
        setShowPaymentModal(true);
    };

    const handlePayment = async () => {
        try {
            await http.post('/payments', {
                appointmentId: selectedAppointment._id,
                patientId: selectedAppointment.patientId._id,
                amount: paymentData.amount,
                method: paymentData.method
            });
            setShowPaymentModal(false);
            loadData();
        } catch (error) { console.error('Payment error:', error); alert("To'lov xatolik!"); }
    };

    const handleAddPatient = async (e) => {
        e.preventDefault();
        try {
            // Generate 8-digit card number if not provided
            const cardNo = newPatientData.cardNo || String(Math.floor(10000000 + Math.random() * 90000000));

            const response = await http.post('/patients', {
                ...newPatientData,
                cardNo
            });

            // Add new patient to list and select it
            const newPatient = response.data || response;
            setPatients([...patients, newPatient]);
            setFormData({ ...formData, patientId: newPatient._id });

            // Reset and close
            setNewPatientData({ firstName: '', lastName: '', phone: '', birthDate: '', gender: 'male', address: '', cardNo: '' });
            setShowAddPatientModal(false);

            alert('Bemor muvaffaqiyatli qo\'shildi!');
        } catch (error) {
            console.error('Add patient error:', error);
            alert(error?.response?.data?.message || 'Bemor qo\'shishda xatolik!');
        }
    };

    const calculateChange = () => paymentData.received - paymentData.amount;

    const statusMap = {
        scheduled: { label: 'Rejalashtirilgan', class: 'bg-blue-50 text-blue-700 border-blue-200', icon: Calendar },
        waiting: { label: 'Kutmoqda', class: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
        in_progress: { label: 'Jarayonda', class: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Activity },
        done: { label: 'Tugallangan', class: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Check },
        cancelled: { label: 'Bekor qilingan', class: 'bg-rose-50 text-rose-700 border-rose-200', icon: X }
    };

    const statCards = [
        { label: 'Jami Qabullar', value: stats.total, icon: Calendar, gradient: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50', text: 'text-blue-600' },
        { label: 'Kutmoqda', value: stats.waiting, icon: Clock, gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-50', text: 'text-amber-600' },
        { label: 'Jarayonda', value: stats.in_progress, icon: Activity, gradient: 'from-indigo-500 to-purple-500', bg: 'bg-indigo-50', text: 'text-indigo-600' },
        { label: 'Tugallangan', value: stats.done, icon: Check, gradient: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50', text: 'text-emerald-600' },
    ];

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

            {/* Stats Cards - Ixcham */}
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
                                    <h3 className="text-2xl font-black text-slate-900 mt-0.5">
                                        {stat.value}
                                    </h3>
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
                            <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-100">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setFilterDoctor('all')}
                                    className={cn("rounded-md text-xs font-medium", filterDoctor === 'all' ? "bg-white shadow-sm text-primary" : "text-gray-500 hover:text-gray-900")}
                                >
                                    Barchasi
                                </Button>
                                {doctors.slice(0, 3).map(doc => (
                                    <Button
                                        key={doc._id}
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setFilterDoctor(doc._id)}
                                        className={cn("rounded-md text-xs font-medium", filterDoctor === doc._id ? "bg-white shadow-sm text-primary" : "text-gray-500 hover:text-gray-900")}
                                    >
                                        Dr. {doc.name.split(' ')[0]}
                                    </Button>
                                ))}
                            </div>
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
                                <input
                                    type="date"
                                    className="pl-9 pr-4 py-2 h-10 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50 w-full md:w-auto"
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                />
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
                            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                <Calendar className="h-10 w-10 text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Qabullar mavjud emas</h3>
                            <p className="text-muted-foreground mt-2 max-w-sm">
                                Ushbu kunga qabullar rejalashtirilmagan. Yangi qabul qo'shish uchun tugmani bosing.
                            </p>
                            <Button className="mt-6 shadow-lg shadow-primary/20" onClick={() => setShowModal(true)}>
                                <Plus className="h-4 w-4 mr-2" /> Qabul yaratish
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow>
                                    <TableHead className="font-bold text-gray-900 pl-6">Vaqt</TableHead>
                                    <TableHead className="font-bold text-gray-900">
                                        <div className="flex items-center gap-2">
                                            Bemor
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-6 w-6 rounded-full hover:bg-blue-100 hover:text-blue-600"
                                                onClick={() => navigate('/patients')}
                                                title="Yangi bemor qo'shish"
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableHead>
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
                                        <TableRow key={apt._id} className={cn(
                                            "hover:bg-blue-50/30 transition-colors border-b last:border-0 border-gray-100",
                                            apt.status === 'in_progress' && "bg-blue-50/40"
                                        )}>
                                            <TableCell className="pl-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 text-primary font-bold shadow-sm">
                                                        <span className="text-lg leading-none">
                                                            {new Date(apt.startsAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }).split(':')[0]}
                                                        </span>
                                                        <span className="text-[10px] text-gray-500 leading-none mt-0.5">
                                                            :{new Date(apt.startsAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }).split(':')[1]}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
                                                        <AvatarFallback className="bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 font-bold text-sm">
                                                            {apt.patientId?.firstName?.[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-bold text-gray-900 text-sm">
                                                            {apt.patientId?.firstName} {apt.patientId?.lastName}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                            {apt.patientId?.phone || "Telefon yo'q"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                                        Dr
                                                    </div>
                                                    <span className="font-medium text-gray-700 text-sm">
                                                        {apt.doctorId?.name}
                                                    </span>
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <Badge variant="outline" className={cn("px-2.5 py-1 text-xs font-semibold gap-1.5 shadow-sm", status.class)}>
                                                    <StatusIcon className="h-3.5 w-3.5" />
                                                    {status.label}
                                                </Badge>
                                            </TableCell>

                                            <TableCell className="text-right pr-6">
                                                <div className="flex items-center justify-end gap-1">
                                                    {apt.status === 'scheduled' && (
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-full"
                                                            onClick={() => handleCheckIn(apt._id)} title="Keldi (Check-in)">
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-full"
                                                        onClick={() => handleOpenPayment(apt)} title="To'lov">
                                                        <DollarSign className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-full" title="Bekor qilish">
                                                        <X className="h-4 w-4" />
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

            {/* Add Appointment Modal - Kattaroq */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto p-8 rounded-2xl">
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
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="outline"
                                        className="h-12 w-12 border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300 text-blue-600 rounded-xl"
                                        onClick={() => setShowAddPatientModal(true)}
                                        title="Yangi bemor qo'shish"
                                    >
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
                            {!formData.doctorId ? (
                                <div className="p-5 rounded-xl bg-blue-50/50 border-2 border-blue-100 text-blue-700 text-base flex items-center justify-center gap-2 h-24">
                                    <Activity className="h-5 w-5" /> Avval shifokorni tanlang
                                </div>
                            ) : fetchingSlots ? (
                                <div className="p-8 text-center bg-gray-50 rounded-xl text-muted-foreground animate-pulse text-base">Vaqtlar yuklanmoqda...</div>
                            ) : availableSlots.length === 0 ? (
                                <div className="p-5 rounded-xl bg-red-50 border-2 border-red-100 text-red-700 text-base text-center">Ushbu kunga bo'sh vaqtlar qolmagan</div>
                            ) : (
                                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar p-1">
                                    {availableSlots.map(slot => (
                                        <button key={slot} type="button"
                                            className={cn(
                                                "h-12 rounded-xl text-base font-bold transition-all duration-200 border-2",
                                                formData.time === slot
                                                    ? "bg-primary text-white shadow-md transform scale-105 border-primary"
                                                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-primary/50 hover:text-primary"
                                            )}
                                            onClick={() => setFormData({ ...formData, time: slot })}>
                                            {slot}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            <Label className="text-base font-bold text-gray-700">Izoh</Label>
                            <Textarea rows={2} value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Qo'shimcha ma'lumot..."
                                className="bg-gray-50 border-2 border-gray-200 focus:ring-primary/20 resize-none text-base"
                            />
                        </div>

                        {/* Payment Toggle Section */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-bold text-gray-700 flex items-center gap-2 cursor-pointer" onClick={() => setIncludePayment(!includePayment)}>
                                    <div className={cn("w-5 h-5 rounded border flex items-center justify-center transition-colors", includePayment ? "bg-primary border-primary text-white" : "border-gray-400 bg-white")}>
                                        {includePayment && <Check className="h-3.5 w-3.5" />}
                                    </div>
                                    To'lovni kiritish
                                </Label>
                                {includePayment && (
                                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                                        To'lov faollashtirildi
                                    </span>
                                )}
                            </div>

                            {includePayment && (
                                <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 fade-in duration-200">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-gray-600">Summa</Label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
                                            <Input
                                                type="number"
                                                value={newApptPayment.amount}
                                                onChange={(e) => setNewApptPayment({ ...newApptPayment, amount: e.target.value })}
                                                placeholder="0"
                                                className="pl-9 font-bold text-emerald-600 border-emerald-200 focus:ring-emerald-200"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-gray-600">Usul</Label>
                                        <Select value={newApptPayment.method} onValueChange={(val) => setNewApptPayment({ ...newApptPayment, method: val })}>
                                            <SelectTrigger className="border-gray-200">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="cash">💵 Naqd</SelectItem>
                                                <SelectItem value="card">💳 Karta</SelectItem>
                                                <SelectItem value="transfer">🏦 O'tkazma</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="gap-3 pt-4 sm:justify-between">
                            <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="h-12 px-6 rounded-xl border-2 border-gray-200 text-base font-semibold">Bekor qilish</Button>
                            <div className="flex gap-3">
                                <Button type="submit" className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 text-base font-semibold">Saqlash</Button>
                                <Button type="button" onClick={handleSaveAndPrint} className="h-12 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/25 text-base font-semibold text-white">
                                    <Printer className="h-5 w-5 mr-2" /> Saqlash va Chop etish
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Payment Modal */}
            <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
                <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden rounded-2xl bg-white">
                    <div className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-b border-primary/10">
                        <DialogTitle className="text-xl font-bold text-gray-900">To'lov Qabul Qilish</DialogTitle>
                        {selectedAppointment && (
                            <div className="flex items-center gap-4 mt-6">
                                <Avatar className="h-14 w-14 ring-4 ring-white shadow-md">
                                    <AvatarFallback className="bg-primary text-white text-lg font-bold">
                                        {selectedAppointment.patientId?.firstName?.[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-bold text-lg text-gray-900">
                                        {selectedAppointment.patientId?.firstName} {selectedAppointment.patientId?.lastName}
                                    </div>
                                    <div className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {new Date(selectedAppointment.startsAt).toLocaleDateString('uz-UZ')}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Amount */}
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-700">To'lov Summasi</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-primary" />
                                <Input type="number" value={paymentData.amount}
                                    onChange={(e) => setPaymentData({ ...paymentData, amount: Number(e.target.value) })}
                                    className="pl-12 h-16 text-3xl font-bold bg-gray-50 border-gray-200 focus:ring-primary/20" />
                            </div>
                        </div>

                        {/* Payment method */}
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-700">To'lov turi</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <button type="button"
                                    onClick={() => setPaymentData({ ...paymentData, method: 'cash' })}
                                    className={cn(
                                        "h-14 rounded-xl flex items-center justify-center gap-2 font-medium transition-all duration-200 border-2",
                                        paymentData.method === 'cash'
                                            ? "border-emerald-500 bg-emerald-50/50 text-emerald-700 shadow-sm"
                                            : "border-gray-100 bg-white text-gray-600 hover:bg-gray-50"
                                    )}>
                                    <Banknote className="h-5 w-5" /> Naqd
                                </button>
                                <button type="button"
                                    onClick={() => setPaymentData({ ...paymentData, method: 'card' })}
                                    className={cn(
                                        "h-14 rounded-xl flex items-center justify-center gap-2 font-medium transition-all duration-200 border-2",
                                        paymentData.method === 'card'
                                            ? "border-blue-500 bg-blue-50/50 text-blue-700 shadow-sm"
                                            : "border-gray-100 bg-white text-gray-600 hover:bg-gray-50"
                                    )}>
                                    <CreditCard className="h-5 w-5" /> Karta
                                </button>
                            </div>
                        </div>

                        {/* Cash change */}
                        {paymentData.method === 'cash' && (
                            <div className="animate-in slide-in-from-top-2 fade-in duration-300">
                                <div className="space-y-3">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-gray-700">Qabul qilingan</Label>
                                        <Input type="number" value={paymentData.received}
                                            onChange={(e) => setPaymentData({ ...paymentData, received: Number(e.target.value) })}
                                            className="h-12 text-xl font-semibold bg-white border-gray-200" placeholder="0" />
                                    </div>
                                    <div className={cn(
                                        "p-4 rounded-xl text-center border-2 transition-colors duration-300",
                                        calculateChange() >= 0
                                            ? "bg-emerald-50/50 border-emerald-100"
                                            : "bg-red-50/50 border-red-100"
                                    )}>
                                        <div className={cn("text-xs font-semibold uppercase tracking-wider", calculateChange() >= 0 ? "text-emerald-600" : "text-red-500")}>
                                            Qaytim
                                        </div>
                                        <div className={cn("text-3xl font-black mt-1", calculateChange() >= 0 ? "text-emerald-600" : "text-red-600")}>
                                            {calculateChange().toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 pt-0 flex gap-3">
                        <Button variant="outline" onClick={() => setShowPaymentModal(false)} className="flex-1 h-12 rounded-xl border-gray-200">Bekor qilish</Button>
                        <Button onClick={handlePayment} className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 text-white"
                            disabled={paymentData.method === 'cash' && calculateChange() < 0}>
                            <Printer className="h-5 w-5 mr-2" /> To'lovni tasdiqlash
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add Patient Modal */}
            <Dialog open={showAddPatientModal} onOpenChange={setShowAddPatientModal}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-8 rounded-2xl">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-3xl font-black text-slate-900">Yangi Bemor Qo'shish</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddPatient} className="space-y-5">
                        <div className="space-y-3">
                            <Label className="text-base font-bold text-gray-700">Bemor Karta Raqami</Label>
                            <Input
                                type="text"
                                value={newPatientData.cardNo}
                                onChange={(e) => setNewPatientData({ ...newPatientData, cardNo: e.target.value })}
                                placeholder="Avtomatik generatsiya qilingan"
                                className="h-12 bg-gray-50 border-2 border-gray-200 text-base"
                            />
                            <p className="text-sm text-gray-500">Avtomatik generatsiya qilingan</p>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-3">
                                <Label className="text-base font-bold text-gray-700">Ism *</Label>
                                <Input
                                    required
                                    value={newPatientData.firstName}
                                    onChange={(e) => setNewPatientData({ ...newPatientData, firstName: e.target.value })}
                                    className="h-12 bg-gray-50 border-2 border-gray-200 text-base"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-base font-bold text-gray-700">Familiya *</Label>
                                <Input
                                    required
                                    value={newPatientData.lastName}
                                    onChange={(e) => setNewPatientData({ ...newPatientData, lastName: e.target.value })}
                                    className="h-12 bg-gray-50 border-2 border-gray-200 text-base"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-base font-bold text-gray-700">Telefon *</Label>
                            <Input
                                required
                                type="tel"
                                value={newPatientData.phone}
                                onChange={(e) => setNewPatientData({ ...newPatientData, phone: e.target.value })}
                                placeholder="+998 90 123 45 67"
                                className="h-12 bg-gray-50 border-2 border-gray-200 text-base"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-3">
                                <Label className="text-base font-bold text-gray-700">Tug'ilgan sana</Label>
                                <DatePicker
                                    value={newPatientData.birthDate}
                                    onChange={(val) => setNewPatientData({ ...newPatientData, birthDate: val })}
                                    placeholder="Sanani tanlang"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-base font-bold text-gray-700">Jins</Label>
                                <Combobox
                                    options={[
                                        { value: 'male', label: 'Erkak' },
                                        { value: 'female', label: 'Ayol' }
                                    ]}
                                    value={newPatientData.gender}
                                    onValueChange={(val) => setNewPatientData({ ...newPatientData, gender: val })}
                                    placeholder="Jinsni tanlang"
                                    searchPlaceholder="Qidirish..."
                                    emptyText="Topilmadi"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-base font-bold text-gray-700">Manzil</Label>
                            <Textarea
                                rows={3}
                                value={newPatientData.address}
                                onChange={(e) => setNewPatientData({ ...newPatientData, address: e.target.value })}
                                className="bg-gray-50 border-2 border-gray-200 text-base resize-none"
                            />
                        </div>

                        <DialogFooter className="gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => setShowAddPatientModal(false)} className="h-12 px-8 rounded-xl border-2 border-gray-200 text-base font-semibold">
                                Bekor qilish
                            </Button>
                            <Button type="submit" className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 text-base font-semibold">
                                Saqlash
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            {/* Receipt Preview Modal */}
            <ReceiptPreviewModal
                open={showReceiptModal}
                onClose={() => setShowReceiptModal(false)}
                url={receiptUrl}
            />
        </div>
    );
}
