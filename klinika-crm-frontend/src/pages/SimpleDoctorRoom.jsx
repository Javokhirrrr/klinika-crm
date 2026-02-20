import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    User, Calendar, DollarSign, FileText,
    Printer, Save, Clock, Activity,
    Play, CheckCircle, Stethoscope, Phone, Cake
} from 'lucide-react';
import http from '../lib/http';
import { useAuth } from '../context/AuthContext';

export default function SimpleDoctorRoom() {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [services, setServices] = useState([]);
    const [selectedServices, setSelectedServices] = useState([]);
    const [diagnosis, setDiagnosis] = useState('');
    const [prescription, setPrescription] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('visit');
    const [saving, setSaving] = useState(false);
    const [doctors, setDoctors] = useState([]);
    // selectedDoctorId = Doctor profil _id (appointments.doctorId bilan mos)
    const [selectedDoctorId, setSelectedDoctorId] = useState('');
    const [myDoctorProfileId, setMyDoctorProfileId] = useState(''); // doctor roli uchun

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            setLoading(true);

            const [servRes, docRes] = await Promise.all([
                http.get('/services').catch(() => ({ items: [] })),
                http.get('/doctors', { params: { limit: 100 } }).catch(() => ({ items: [] })),
            ]);

            setServices(servRes.items || servRes || []);
            const docList = docRes.items || docRes || [];
            setDoctors(docList);

            const role = (user?.role || '').toLowerCase();

            if (role === 'doctor') {
                // Doctor roli: o'z profilini topish
                const myProfile = docList.find(d => d.userId && String(d.userId) === String(user._id || user.id));
                if (myProfile) {
                    setMyDoctorProfileId(myProfile._id);
                    setSelectedDoctorId(myProfile._id);
                    await fetchAppointments(myProfile._id);
                } else {
                    // Fallback: /doctors?userId bilan qidirish
                    const myRes = await http.get('/doctors', { params: { userId: user._id || user.id, limit: 1 } }).catch(() => ({ items: [] }));
                    const myProf = (myRes.items || [])[0];
                    if (myProf) {
                        setMyDoctorProfileId(myProf._id);
                        setSelectedDoctorId(myProf._id);
                        await fetchAppointments(myProf._id);
                    } else {
                        // Doctor profili yo'q — barcha bugungi qabullarni ko'rsat
                        await fetchAppointments(null);
                    }
                }
            } else {
                // Admin/owner: doctorId yo'q = BARCHA bugungi qabullar
                await fetchAppointments(null);
            }
        } catch (error) { console.error('Load error:', error); }
        finally { setLoading(false); }
    };

    const fetchAppointments = async (doctorId) => {
        try {
            const today = new Date().toISOString().split('T')[0];
            // doctorId bo'lsa filter, bo'lmasa barcha bugungi qabullar
            const params = { date: today };
            if (doctorId) params.doctorId = doctorId;

            const res = await http.get('/appointments', { params });
            const appts = res.items || res || [];
            console.log('[DoctorRoom] fetched', appts.length, 'appointments, doctorId:', doctorId, 'params:', params);
            setAppointments(appts);
        } catch (error) { console.error('Fetch appts error:', error); }
    };

    // DoctorId o'zgarganda qayta yuklash
    useEffect(() => {
        fetchAppointments(selectedDoctorId || null);
    }, [selectedDoctorId]);

    const handleSelectAppointment = (apt) => {
        setSelectedAppointment(apt);
        setSelectedServices([]);
        setDiagnosis('');
        setPrescription('');
        setActiveTab('visit');
    };

    const updateStatus = async (id, status) => {
        try {
            await http.patch(`/appointments/${id}/update-status`, { status });
            setAppointments(prev => prev.map(a => a._id === id ? { ...a, status } : a));
            if (selectedAppointment?._id === id) setSelectedAppointment(prev => ({ ...prev, status }));
        } catch (error) { alert(error?.response?.data?.message || 'Statusni yangilashda xatolik'); }
    };

    const handleAddService = (service) => {
        setSelectedServices(prev =>
            prev.find(s => s._id === service._id) ? prev.filter(s => s._id !== service._id) : [...prev, service]
        );
    };

    const calculateTotal = () => selectedServices.reduce((sum, s) => sum + (s.price || 0), 0);

    const handleFinalize = async () => {
        if (!selectedAppointment) return;
        if (!diagnosis) return alert('Tashxis kiritish majburiy');
        try {
            setSaving(true);

            // 1. Appointment statusini "done" ga o'zgartirish
            await http.patch(`/appointments/${selectedAppointment._id}/update-status`, { status: 'done' });

            // 2. Agar xizmatlar tanlangan bo'lsa, appointmentni yangilash
            if (selectedServices.length > 0) {
                await http.put(`/appointments/${selectedAppointment._id}`, {
                    serviceIds: selectedServices.map(s => s._id),
                    price: calculateTotal(),
                    notes: prescription || selectedAppointment.notes || ''
                }).catch(() => { }); // xatolik bo'lsa ham davom et
            }

            // 3. Tibbiy tarixga saqlash (doctor-room/complete orqali)
            await http.post('/doctor-room/complete', {
                appointmentId: selectedAppointment._id,
                diagnosis,
                prescription,
                services: selectedServices.map(s => s._id),
                notes: ''
            }).catch(async (err) => {
                // Agar doctor-room/complete 403 qaytarsa (doctor roli yo'q),
                // appointmentga notes sifatida saqlaymiz
                console.warn('doctor-room/complete failed, saving to notes:', err);
                await http.put(`/appointments/${selectedAppointment._id}`, {
                    notes: `Tashxis: ${diagnosis}\nRetsept: ${prescription}`
                }).catch(() => { });
            });

            alert('Qabul yakunlandi va bemor tarixiga saqlandi!');
            const docId = selectedDoctorId || user?._id;
            if (docId) fetchAppointments(docId);
            setSelectedAppointment(null);
            setDiagnosis('');
            setPrescription('');
            setSelectedServices([]);
        } catch (error) {
            console.error('Finalize error:', error);
            alert('Xatolik yuz berdi!');
        } finally { setSaving(false); }
    };

    // Statuslar bo'yicha guruhlar:
    // scheduled = Yangi qabul (resepshen yaratdi, bemor hali kelmagan)
    // waiting   = Bemor keldi (check-in qilindi, navbat kutmoqda)
    // in_progress = Shifokor qabulni boshladi
    // done      = Qabul yakunlandi
    const scheduledAppts = appointments.filter(a => a.status === 'scheduled');
    const waitingAppts = appointments.filter(a => a.status === 'waiting');
    const inProgressAppts = appointments.filter(a => a.status === 'in_progress');
    const doneAppts = appointments.filter(a => a.status === 'done');
    const pendingAppts = [...inProgressAppts, ...waitingAppts, ...scheduledAppts]; // navbatda ko'rinadiganlar
    const stats = { total: appointments.length, waiting: waitingAppts.length + scheduledAppts.length, in_progress: inProgressAppts.length, done: doneAppts.length };

    const statCards = [
        { label: 'Jami', value: stats.total, icon: Calendar, bg: 'bg-sky-50', iconBg: 'bg-sky-100', color: 'text-sky-600' },
        { label: 'Kutmoqda', value: stats.waiting, icon: Clock, bg: 'bg-amber-50', iconBg: 'bg-amber-100', color: 'text-amber-600' },
        { label: 'Jarayonda', value: stats.in_progress, icon: Activity, bg: 'bg-blue-50', iconBg: 'bg-blue-100', color: 'text-blue-600' },
        { label: 'Yakunlandi', value: stats.done, icon: CheckCircle, bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', color: 'text-emerald-600' },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Shifokor Xonasi</h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        {user?.role === 'doctor' ? `Xush kelibsiz, Dr. ${user?.name}` : "Bemorlar qabuli va ko'rik jarayoni"}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {user?.role !== 'doctor' && (
                        <div className="w-72">
                            <Combobox
                                options={[
                                    { value: '', label: '👥 Barcha shifokorlar' },
                                    ...doctors.map(d => ({
                                        value: d._id,
                                        label: [d.firstName, d.lastName].filter(Boolean).join(' ') || d.name || '(Ism kiritilmagan)'
                                    }))
                                ]}
                                value={selectedDoctorId}
                                onValueChange={(val) => setSelectedDoctorId(val || '')}
                                placeholder="👥 Barcha shifokorlar"
                                searchPlaceholder="Shifokor ismini yozing..."
                                emptyText="Shifokor topilmadi"
                            />
                        </div>
                    )}
                    <Badge variant="outline" className="px-4 py-2 text-sm font-semibold bg-white shadow-sm border-gray-200">
                        <Calendar className="h-4 w-4 mr-2 text-primary" /> {new Date().toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </Badge>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((s, i) => {
                    const Icon = s.icon;
                    return (
                        <Card key={i} className={cn("border-0", s.bg)}>
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", s.iconBg)}>
                                    <Icon className={cn("h-5 w-5", s.color)} />
                                </div>
                                <div>
                                    <div className="text-xs font-medium text-muted-foreground">{s.label}</div>
                                    <div className="text-2xl font-bold">{s.value}</div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Main Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
                {/* Left: Appointments Sidebar */}
                <Card className="h-fit">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base">Bugungi navbat ({pendingAppts.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2">
                        <ScrollArea className="max-h-[600px]">
                            <div className="space-y-1.5">

                                {/* 🔵 IN PROGRESS — Hozir qabulda */}
                                {inProgressAppts.map(apt => (
                                    <button key={apt._id}
                                        className="w-full p-4 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 text-left transition-all hover:shadow-md group relative overflow-hidden"
                                        onClick={() => handleSelectAppointment(apt)}>
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-mono font-bold text-blue-700 bg-white/50 px-2 py-0.5 rounded">
                                                {new Date(apt.startsAt || apt.scheduledAt || apt.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <Badge className="animate-pulse bg-blue-500 text-white border-0 shadow-sm text-xs">
                                                <Activity className="w-3 h-3 mr-1" /> Qabulda
                                            </Badge>
                                        </div>
                                        <div className="text-base font-bold text-gray-900">{apt.patientId?.firstName} {apt.patientId?.lastName}</div>
                                        {apt.patientId?.phone && <div className="text-xs text-blue-600/70 mt-1 flex items-center gap-1"><Phone className="w-3 h-3" /> {apt.patientId.phone}</div>}
                                    </button>
                                ))}

                                {/* 🟡 WAITING — Bemor keldi, navbat kutmoqda */}
                                {waitingAppts.map(apt => (
                                    <button key={apt._id}
                                        className={cn(
                                            "w-full p-4 rounded-xl border text-left transition-all hover:shadow-md group relative overflow-hidden",
                                            selectedAppointment?._id === apt._id
                                                ? "border-amber-400 bg-amber-50 ring-1 ring-amber-200 shadow-sm"
                                                : "border-amber-100 bg-white shadow-sm hover:border-amber-300 hover:bg-amber-50"
                                        )}
                                        onClick={() => handleSelectAppointment(apt)}>
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400"></div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-mono font-semibold text-amber-700">
                                                {new Date(apt.startsAt || apt.scheduledAt || apt.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">Kutmoqda</Badge>
                                        </div>
                                        <div className="text-sm font-bold text-gray-800">{apt.patientId?.firstName} {apt.patientId?.lastName}</div>
                                        {apt.patientId?.phone && <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Phone className="w-3 h-3" /> {apt.patientId.phone}</div>}
                                    </button>
                                ))}

                                {/* ⚪ SCHEDULED — Rejalashtirilgan (bemor hali kelmagan) */}
                                {scheduledAppts.map(apt => (
                                    <button key={apt._id}
                                        className={cn(
                                            "w-full p-4 rounded-xl border text-left transition-all hover:shadow-md group relative overflow-hidden",
                                            selectedAppointment?._id === apt._id
                                                ? "border-gray-300 bg-gray-50 ring-1 ring-gray-200 shadow-sm"
                                                : "border-gray-100 bg-white shadow-sm hover:border-gray-300 hover:bg-gray-50"
                                        )}
                                        onClick={() => handleSelectAppointment(apt)}>
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-300"></div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-mono font-semibold text-gray-500">
                                                {new Date(apt.startsAt || apt.scheduledAt || apt.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <Badge className="bg-gray-100 text-gray-500 border-0 text-xs">Rejalashtirilgan</Badge>
                                        </div>
                                        <div className="text-sm font-bold text-gray-700">{apt.patientId?.firstName} {apt.patientId?.lastName}</div>
                                        {apt.patientId?.phone && <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Phone className="w-3 h-3" /> {apt.patientId.phone}</div>}
                                    </button>
                                ))}

                                {/* ✅ DONE — Yakunlanganlar */}
                                {doneAppts.length > 0 && (
                                    <>
                                        <Separator className="my-2" />
                                        <div className="text-xs font-semibold text-muted-foreground uppercase px-3 mb-1">Yakunlanganlar ({doneAppts.length})</div>
                                        {doneAppts.slice(0, 5).map(apt => (
                                            <div key={apt._id} className="p-3 rounded-xl opacity-50 bg-gray-50">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm font-mono">
                                                        {new Date(apt.startsAt || apt.scheduledAt || apt.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Bajarildi</Badge>
                                                </div>
                                                <div className="text-sm font-medium">{apt.patientId?.firstName} {apt.patientId?.lastName}</div>
                                            </div>
                                        ))}
                                    </>
                                )}

                                {pendingAppts.length === 0 && doneAppts.length === 0 && (
                                    <div className="py-8 text-center text-muted-foreground text-sm">
                                        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                        Bugun uchun qabul yo'q
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Right: Work Area */}
                <div className="space-y-4">
                    {!selectedAppointment ? (
                        <Card>
                            <CardContent className="py-20 flex flex-col items-center text-muted-foreground">
                                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
                                    <User className="h-12 w-12 opacity-40" />
                                </div>
                                <h2 className="text-xl font-semibold text-foreground mb-1">Bemor tanlanmagan</h2>
                                <p className="text-center max-w-sm">
                                    Navbatdagi bemorni tanlang va "Qabulni boshlash" tugmasini bosing.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {/* Patient Header */}
                            <Card className="border-none shadow-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                                <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6 relative z-10">
                                    <Avatar className="h-20 w-20 ring-4 ring-white/30 shadow-xl">
                                        <AvatarFallback className="bg-white/10 backdrop-blur-md text-white text-2xl font-bold">
                                            {selectedAppointment.patientId?.firstName?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 text-center sm:text-left">
                                        <h2 className="text-2xl font-bold tracking-tight">
                                            {selectedAppointment.patientId?.firstName} {selectedAppointment.patientId?.lastName}
                                        </h2>
                                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-2 text-sm font-medium text-white/90">
                                            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full"><Phone className="h-3.5 w-3.5" /> {selectedAppointment.patientId?.phone}</span>
                                            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full"><Cake className="h-3.5 w-3.5" /> {selectedAppointment.patientId?.dob ? new Date(selectedAppointment.patientId.dob).getFullYear() : 'N/A'} yil ({new Date().getFullYear() - new Date(selectedAppointment.patientId?.dob).getFullYear() || '-'} yosh)</span>
                                        </div>
                                    </div>
                                    <div className="shrink-0">
                                        {selectedAppointment.status === 'in_progress' ? (
                                            <Button variant="secondary" className="bg-white text-indigo-600 hover:bg-white/90 font-bold shadow-lg h-12 px-6" disabled>
                                                <Activity className="h-5 w-5 mr-2 animate-pulse" /> Qabul Jarayoni
                                            </Button>
                                        ) : (
                                            <Button size="lg" className="bg-white text-indigo-600 hover:bg-white/90 font-bold shadow-lg h-12 px-8 transition-transform hover:scale-105" onClick={() => updateStatus(selectedAppointment._id, 'in_progress')}>
                                                <Play className="h-5 w-5 mr-2 fill-current" /> Qabulni Boshlash
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Tabs */}
                            <div className="flex gap-1 p-1.5 bg-gray-100/80 backdrop-blur rounded-xl border border-gray-200">
                                <button className={cn("flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-bold transition-all duration-300",
                                    activeTab === 'visit'
                                        ? "bg-white shadow-md text-primary scale-100 ring-1 ring-black/5"
                                        : "text-muted-foreground hover:text-gray-900 hover:bg-white/50"
                                )} onClick={() => setActiveTab('visit')}>
                                    <Activity className="h-4 w-4" /> Joriy Qabul
                                </button>
                                <button className={cn("flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-bold transition-all duration-300",
                                    activeTab === 'history'
                                        ? "bg-white shadow-md text-primary scale-100 ring-1 ring-black/5"
                                        : "text-muted-foreground hover:text-gray-900 hover:bg-white/50"
                                )} onClick={() => setActiveTab('history')}>
                                    <FileText className="h-4 w-4" /> Tibbiy Tarix
                                </button>
                            </div>

                            {activeTab === 'visit' ? (
                                <div className="space-y-4">
                                    <Card>
                                        <CardContent className="p-5 space-y-4">
                                            <div className="space-y-2">
                                                <Label className="flex items-center gap-2"><Stethoscope className="h-4 w-4" /> Tashxis</Label>
                                                <Textarea rows={3} placeholder="Bemor shikoyatlari va asosiy tashxis..."
                                                    value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} className="text-base" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="flex items-center gap-2"><FileText className="h-4 w-4" /> Retsept va Tavsiyalar</Label>
                                                <Textarea rows={4} placeholder="Dori-darmonlar ro'yxati va qabul qilish tartibi..."
                                                    value={prescription} onChange={(e) => setPrescription(e.target.value)} />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="p-5 pb-3">
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <DollarSign className="h-4 w-4" /> Xizmatlar
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-5 pt-0">
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                {services.map(service => {
                                                    const isSelected = selectedServices.find(s => s._id === service._id);
                                                    return (
                                                        <button key={service._id}
                                                            className={cn(
                                                                "relative p-3 rounded-xl border text-left transition-all text-sm",
                                                                isSelected
                                                                    ? "border-primary bg-primary/5 shadow-sm"
                                                                    : "border-border hover:border-primary/50"
                                                            )}
                                                            onClick={() => handleAddService(service)}>
                                                            <div className="font-medium">{service.name}</div>
                                                            <div className="text-emerald-600 font-bold mt-1">{service.price?.toLocaleString()} so'm</div>
                                                            {isSelected && (
                                                                <CheckCircle className="absolute top-2 right-2 h-5 w-5 text-primary" />
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Footer */}
                                    {selectedAppointment.status === 'in_progress' && (
                                        <Card className="sticky bottom-4">
                                            <CardContent className="p-4 flex items-center justify-between">
                                                <div>
                                                    <div className="text-sm text-muted-foreground">Jami xizmatlar:</div>
                                                    <div className="text-xl font-bold">{calculateTotal().toLocaleString()} so'm</div>
                                                </div>
                                                <div className="flex gap-3">
                                                    <Button variant="outline" size="icon"><Printer className="h-4 w-4" /></Button>
                                                    <Button variant="success" onClick={handleFinalize} disabled={saving} className="min-w-[200px]">
                                                        <Save className="h-4 w-4" /> {saving ? 'Saqlanmoqda...' : 'Saqlash va Yakunlash'}
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            ) : (
                                <Card>
                                    <CardContent className="p-5">
                                        {!selectedAppointment.patientId?.medicalHistory?.length ? (
                                            <div className="py-8 flex flex-col items-center text-muted-foreground">
                                                <FileText className="h-12 w-12 mb-3 opacity-30" />
                                                <p>Tibbiy tarix topilmadi</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {[...selectedAppointment.patientId.medicalHistory].reverse().map((record, idx) => (
                                                    <Card key={idx} className="bg-muted/30">
                                                        <CardContent className="p-4">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <span className="font-bold">{new Date(record.date).toLocaleDateString('uz-UZ')}</span>
                                                                <span className="text-sm text-muted-foreground">Dr. {record.doctorName || 'Shifokor'}</span>
                                                            </div>
                                                            <div className="mb-2">
                                                                <span className="font-semibold text-primary mr-2">Tashxis:</span>{record.diagnosis}
                                                            </div>
                                                            <div>
                                                                <span className="font-semibold mr-2">Retsept:</span>
                                                                <span className="text-muted-foreground">{record.prescription}</span>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
