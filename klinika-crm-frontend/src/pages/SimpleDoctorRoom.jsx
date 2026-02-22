import { useState, useEffect, useRef, useCallback } from 'react';
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
    Play, CheckCircle, Stethoscope, Phone, Cake,
    Bell, List, X, Plus, Minus
} from 'lucide-react';
import http from '../lib/http';
import { useAuth } from '../context/AuthContext';

// ─── Ovozli xabar ─────────────────────────────────────────────────────────────
function speak(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'uz-UZ'; u.rate = 0.9;
    window.speechSynthesis.speak(u);
}

export default function SimpleDoctorRoom() {
    const { user } = useAuth();

    // ─── State ─────────────────────────────────────────────────────────────────
    const [appointments, setAppointments] = useState([]);
    const [queueEntries, setQueueEntries] = useState([]);  // ← navbat
    const [selectedApt, setSelectedApt] = useState(null);
    const [services, setServices] = useState([]);
    const [addedServices, setAddedServices] = useState([]);  // qo'shilgan xizmatlar
    const [diagnosis, setDiagnosis] = useState('');
    const [prescription, setPrescription] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('queue');  // queue | visit
    const [saving, setSaving] = useState(false);
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctorId, setSelectedDoctorId] = useState('');
    const [myDoctorId, setMyDoctorId] = useState('');
    const [notify, setNotify] = useState(null);   // bildirishnoma
    const [calledNotif, setCalledNotif] = useState(null);   // "chaqirildi" banner
    const prevCalledRef = useRef(new Set());

    // ─── Toast ─────────────────────────────────────────────────────────────────
    const toast = useCallback((msg, type = 'success') => {
        setNotify({ msg, type });
        setTimeout(() => setNotify(null), 4000);
    }, []);

    // ─── Data load ─────────────────────────────────────────────────────────────
    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [servRes, docRes] = await Promise.all([
                http.get('/services').catch(() => ({ items: [] })),
                http.get('/doctors', { params: { limit: 100 } }).catch(() => ({ items: [] })),
            ]);
            setServices(servRes.items || servRes || []);
            const docList = docRes.doctors || docRes.items || [];
            setDoctors(docList);

            const role = (user?.role || '').toLowerCase();
            if (role === 'doctor') {
                let myPr = docList.find(d => d.userId && String(d.userId) === String(user._id || user.id));
                if (!myPr) {
                    const r = await http.get('/doctors', { params: { userId: user._id || user.id, limit: 1 } }).catch(() => ({ items: [] }));
                    myPr = (r.items || [])[0];
                }
                if (myPr) { setMyDoctorId(myPr._id); setSelectedDoctorId(myPr._id); }
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [user]);

    useEffect(() => { loadData(); }, [loadData]);

    // ─── Appointments ──────────────────────────────────────────────────────────
    const fetchAppointments = useCallback(async (doctorId) => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const params = { date: today };
            if (doctorId) params.doctorId = doctorId;
            const res = await http.get('/appointments', { params });
            setAppointments(res.items || res || []);
        } catch (e) { console.error(e); }
    }, []);

    // ─── Queue entries (navbat) ────────────────────────────────────────────────
    const fetchQueue = useCallback(async (doctorId) => {
        try {
            const res = await http.get('/queue/current');
            let entries = res?.queue || res?.data?.queue || res || [];
            if (!Array.isArray(entries)) entries = [];

            // Agar doctorId bor bo'lsa, faqat shu shifokornikini ko'rsat
            if (doctorId) entries = entries.filter(e =>
                (e.doctorId?._id || e.doctorId) === doctorId
            );

            // Chaqirilgan bemorlarni aniqlash (bildirishnoma)
            entries
                .filter(e => e.status === 'called')
                .forEach(e => {
                    const key = e._id + '-called';
                    if (!prevCalledRef.current.has(key)) {
                        prevCalledRef.current.add(key);
                        const name = `${e.patientId?.firstName || ''} ${e.patientId?.lastName || ''}`.trim();
                        setCalledNotif({ name, queueNumber: e.queueNumber, doctor: e.doctorId?.firstName });
                        speak(`${e.queueNumber || ''}-raqamli ${name}, shifokor xonasiga kiring`);
                        setTimeout(() => setCalledNotif(null), 8000);
                    }
                });

            setQueueEntries(entries);
        } catch (e) { console.error('Queue fetch error:', e); }
    }, []);

    useEffect(() => {
        const docId = selectedDoctorId || null;
        fetchAppointments(docId);
        fetchQueue(docId);
        const iv = setInterval(() => { fetchAppointments(docId); fetchQueue(docId); }, 10000);
        return () => clearInterval(iv);
    }, [selectedDoctorId, fetchAppointments, fetchQueue]);

    // ─── Queue actions ─────────────────────────────────────────────────────────
    const callQueuePatient = async (entry) => {
        try {
            await http.post(`/queue/${entry._id}/call`);
            const name = `${entry.patientId?.firstName || ''} ${entry.patientId?.lastName || ''}`.trim();
            speak(`${entry.queueNumber || ''}-raqamli ${name}, shifokor xonasiga kiring`);
            toast(`${name} chaqirildi 📢`);
            fetchQueue(selectedDoctorId || null);
        } catch (e) { toast(e?.response?.data?.message || 'Xatolik', 'error'); }
    };

    const startQueueService = async (entry) => {
        try {
            await http.post(`/queue/${entry._id}/start`);
            toast('Xizmat boshlandi ▶');
            fetchQueue(selectedDoctorId || null);
            // Appointmentga o'tish
            const pat = entry.patientId?._id || entry.patientId;
            const matchApt = appointments.find(a =>
                (a.patientId?._id || a.patientId) === pat &&
                ['scheduled', 'waiting'].includes(a.status)
            );
            if (matchApt) handleSelectAppointment(matchApt);
        } catch (e) { toast(e?.response?.data?.message || 'Xatolik', 'error'); }
    };

    const completeQueueService = async (entryId) => {
        try {
            await http.post(`/queue/${entryId}/complete`);
            toast('Xizmat yakunlandi ✅');
            fetchQueue(selectedDoctorId || null);
        } catch (e) { toast(e?.response?.data?.message || 'Xatolik', 'error'); }
    };

    // ─── Appointment actions ───────────────────────────────────────────────────
    const handleSelectAppointment = (apt) => {
        setSelectedApt(apt);
        setAddedServices(apt.serviceIds || []);
        setDiagnosis('');
        setPrescription('');
        setActiveTab('visit');
    };

    const updateStatus = async (id, status) => {
        try {
            await http.patch(`/appointments/${id}/update-status`, { status });
            setAppointments(prev => prev.map(a => a._id === id ? { ...a, status } : a));
            if (selectedApt?._id === id) setSelectedApt(prev => ({ ...prev, status }));
        } catch (e) { toast(e?.response?.data?.message || 'Statusni yangilashda xatolik', 'error'); }
    };

    // Xizmat qo'shish/olib tashlash
    const toggleService = (service) => {
        setAddedServices(prev =>
            prev.find(s => (s._id || s) === (service._id || service))
                ? prev.filter(s => (s._id || s) !== (service._id || service))
                : [...prev, service]
        );
    };

    const calcTotal = () => addedServices.reduce((sum, s) => sum + (s.price || 0), 0);

    const handleFinalize = async () => {
        if (!selectedApt) return;
        if (!diagnosis) { toast('Tashxis kiritish majburiy!', 'error'); return; }
        try {
            setSaving(true);
            await http.patch(`/appointments/${selectedApt._id}/update-status`, { status: 'done' });
            if (addedServices.length > 0) {
                await http.put(`/appointments/${selectedApt._id}`, {
                    serviceIds: addedServices.map(s => s._id || s),
                    price: calcTotal(),
                    notes: prescription || selectedApt.notes || ''
                }).catch(() => { });
            }
            await http.post('/doctor-room/complete', {
                appointmentId: selectedApt._id,
                diagnosis, prescription,
                services: addedServices.map(s => s._id || s),
            }).catch(async () => {
                await http.put(`/appointments/${selectedApt._id}`, {
                    notes: `Tashxis: ${diagnosis}\nRetsept: ${prescription}`
                }).catch(() => { });
            });
            toast('Qabul yakunlandi va saqlandi! ✅');
            fetchAppointments(selectedDoctorId || null);
            setSelectedApt(null); setDiagnosis(''); setPrescription(''); setAddedServices([]);
            setActiveTab('queue');
        } catch (e) { toast('Xatolik!', 'error'); console.error(e); }
        finally { setSaving(false); }
    };

    // ─── Computed ──────────────────────────────────────────────────────────────
    const scheduledAppts = appointments.filter(a => a.status === 'scheduled');
    const waitingAppts = appointments.filter(a => a.status === 'waiting');
    const inProgressAppts = appointments.filter(a => a.status === 'in_progress');
    const doneAppts = appointments.filter(a => a.status === 'done');
    const pendingAppts = [...inProgressAppts, ...waitingAppts, ...scheduledAppts];

    const queueWaiting = queueEntries.filter(e => e.status === 'waiting');
    const queueCalled = queueEntries.filter(e => e.status === 'called');
    const queueInService = queueEntries.filter(e => e.status === 'in_service');

    const stats = {
        total: appointments.length,
        waiting: waitingAppts.length + scheduledAppts.length,
        queueWaiting: queueWaiting.length,
        in_progress: inProgressAppts.length,
        done: doneAppts.length,
    };

    const PRIORITY = {
        emergency: { label: 'Favqulodda', color: '#ef4444' },
        urgent: { label: 'Shoshilinch', color: '#f59e0b' },
        normal: { label: 'Oddiy', color: '#10b981' },
    };

    // ─── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 animate-fade-in pb-10">

            {/* ── Toast notification ── */}
            {notify && (
                <div style={{
                    position: 'fixed', top: 16, right: 16, zIndex: 9999,
                    padding: '12px 20px', borderRadius: 14,
                    background: notify.type === 'error' ? '#fef2f2' : '#f0fdf4',
                    color: notify.type === 'error' ? '#dc2626' : '#15803d',
                    border: `1px solid ${notify.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
                    fontWeight: 600, fontSize: 14,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                }}>
                    {notify.type === 'error' ? '❌' : '✅'} {notify.msg}
                </div>
            )}

            {/* ── Chaqirildi banneri ── */}
            {calledNotif && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9998,
                    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                    color: '#fff', padding: '18px 24px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    boxShadow: '0 4px 32px rgba(99,102,241,0.4)',
                    animation: 'slideDown 0.4s ease',
                }}>
                    <div>
                        <div style={{ fontSize: 13, opacity: 0.85 }}>🔔 Yangi bemor chaqirildi!</div>
                        <div style={{ fontSize: 20, fontWeight: 800 }}>
                            {calledNotif.queueNumber} — {calledNotif.name}
                        </div>
                        {calledNotif.doctor && (
                            <div style={{ fontSize: 13, opacity: 0.8 }}>
                                Dr. {calledNotif.doctor} xonasiga kiring
                            </div>
                        )}
                    </div>
                    <button onClick={() => setCalledNotif(null)}
                        style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10, padding: '8px 16px', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>
                        ✕ Yopish
                    </button>
                </div>
            )}

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-gray-900">Shifokor Xonasi</h1>
                    <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-lg">
                        {user?.role === 'doctor' ? `Xush kelibsiz, Dr. ${user?.name}` : "Bemorlar qabuli va ko'rik jarayoni"}
                    </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    {user?.role !== 'doctor' && (
                        <div className="w-full sm:w-72">
                            <Combobox
                                options={[{ value: '', label: '👥 Barcha shifokorlar' },
                                ...doctors.map(d => ({ value: d._id, label: `${d.firstName || ''} ${d.lastName || ''}`.trim() }))
                                ]}
                                value={selectedDoctorId}
                                onValueChange={val => setSelectedDoctorId(val || '')}
                                placeholder="👥 Barcha shifokorlar"
                                searchPlaceholder="Shifokor ismini yozing..."
                                emptyText="Shifokor topilmadi"
                            />
                        </div>
                    )}
                    <Badge variant="outline" className="px-4 py-2 text-sm font-semibold bg-white shadow-sm border-gray-200">
                        <Calendar className="h-4 w-4 mr-2 text-primary" />
                        {new Date().toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </Badge>
                </div>
            </div>

            {/* ── Stats ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Jami qabul', val: stats.total, icon: Calendar, bg: 'bg-sky-50', iconBg: 'bg-sky-100', color: 'text-sky-600' },
                    { label: 'Navbatda', val: stats.queueWaiting, icon: List, bg: 'bg-amber-50', iconBg: 'bg-amber-100', color: 'text-amber-600' },
                    { label: 'Qabulda', val: stats.in_progress, icon: Activity, bg: 'bg-blue-50', iconBg: 'bg-blue-100', color: 'text-blue-600' },
                    { label: 'Yakunlandi', val: stats.done, icon: CheckCircle, bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', color: 'text-emerald-600' },
                ].map((s, i) => {
                    const Icon = s.icon;
                    return (
                        <Card key={i} className={cn('border-0', s.bg)}>
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', s.iconBg)}>
                                    <Icon className={cn('h-5 w-5', s.color)} />
                                </div>
                                <div>
                                    <div className="text-xs font-medium text-muted-foreground">{s.label}</div>
                                    <div className="text-2xl font-bold">{s.val}</div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* ── Main Layout ── */}
            <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">

                {/* ─ LEFT: Navbat + Appointmentlar ─ */}
                <Card className="h-fit">
                    <CardContent className="p-0">

                        {/* Tab: Navbat | Appointments */}
                        <div className="flex border-b">
                            {[
                                { id: 'queue', label: `📋 Navbat (${queueWaiting.length + queueCalled.length + queueInService.length})` },
                                { id: 'apts', label: `📅 Qabullar (${pendingAppts.length})` },
                            ].map(t => (
                                <button key={t.id}
                                    onClick={() => setActiveTab(prev => prev === 'visit' ? 'visit' : t.id)}
                                    style={{
                                        flex: 1, padding: '12px 8px', fontWeight: 700, fontSize: 12,
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        borderBottom: activeTab === t.id ? '2px solid #6366f1' : '2px solid transparent',
                                        color: activeTab === t.id ? '#6366f1' : '#64748b',
                                        fontFamily: 'inherit',
                                    }}>
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        <ScrollArea className="max-h-[620px]">
                            <div className="p-3 space-y-2">

                                {/* ═══ NAVBAT TAB ═══ */}
                                {(activeTab === 'queue' || activeTab === 'visit') && (
                                    <>
                                        {/* ─ Navbat yo'q ─ */}
                                        {queueEntries.length === 0 && (
                                            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                                                <div style={{ fontSize: 44, marginBottom: 8 }}>🎉</div>
                                                <div style={{ fontSize: 15, fontWeight: 700 }}>Navbat bo'sh</div>
                                                <div style={{ fontSize: 12, marginTop: 4 }}>Yangi bemor qo'shilganda ko'rinadi</div>
                                            </div>
                                        )}

                                        {/* ─── Barcha navbatdagi bemorlar bitta ro'yhatta ─── */}
                                        {[
                                            ...queueInService.map(e => ({ ...e, _step: 3 })),
                                            ...queueCalled.map(e => ({ ...e, _step: 2 })),
                                            ...queueWaiting.map((e, idx) => ({ ...e, _step: 1, _idx: idx })),
                                        ].map(e => {
                                            const pri = PRIORITY[e.priority] || PRIORITY.normal;
                                            const waitMins = e.joinedAt ? Math.floor((Date.now() - new Date(e.joinedAt)) / 60000) : 0;
                                            const name = `${e.patientId?.firstName || ''} ${e.patientId?.lastName || ''}`.trim();

                                            // ─ Rang va stil ─
                                            const stepStyles = {
                                                3: { bg: '#f0fdf4', border: '#86efac', badgeBg: '#dcfce7', badgeColor: '#15803d', badgeText: '🩺 Xizmatda', numColor: '#10b981' },
                                                2: { bg: '#fffbeb', border: '#fbbf24', badgeBg: '#fef3c7', badgeColor: '#d97706', badgeText: '📢 Chaqirildi', numColor: '#f59e0b' },
                                                1: { bg: '#fff', border: '#e2e8f0', badgeBg: null, badgeColor: pri.color, badgeText: pri.label, numColor: '#1e293b' },
                                            }[e._step];

                                            return (
                                                <div key={e._id} style={{
                                                    borderRadius: 14, padding: '14px 16px',
                                                    background: stepStyles.bg,
                                                    border: `1.5px solid ${stepStyles.border}`,
                                                    borderLeft: e._step === 1 ? `5px solid ${pri.color}` : `1.5px solid ${stepStyles.border}`,
                                                    ...(e._step === 2 ? { animation: 'pulseBorder 1.5s ease infinite' } : {}),
                                                    marginBottom: 4,
                                                }}>
                                                    {/* Bemor nomi + badge */}
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <span style={{
                                                                fontWeight: 900, fontSize: 20,
                                                                color: stepStyles.numColor,
                                                                minWidth: 36,
                                                            }}>#{e.queueNumber}</span>
                                                            {e._step === 1 && (
                                                                <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
                                                                    {e._idx + 1}-o'rin
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span style={{
                                                            fontSize: 11, fontWeight: 700,
                                                            background: stepStyles.badgeBg || (e.priority === 'emergency' ? '#fef2f2' : e.priority === 'urgent' ? '#fffbeb' : '#f0fdf4'),
                                                            color: stepStyles.badgeColor,
                                                            borderRadius: 8, padding: '3px 10px',
                                                        }}>
                                                            {stepStyles.badgeText}
                                                        </span>
                                                    </div>

                                                    {/* Ism */}
                                                    <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 2 }}>
                                                        {name || '—'}
                                                    </div>
                                                    {e.patientId?.phone && (
                                                        <div style={{ fontSize: 12, color: '#64748b' }}>📞 {e.patientId.phone}</div>
                                                    )}
                                                    {e._step === 1 && (
                                                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>⏱️ {waitMins} daqiqa kutdi</div>
                                                    )}

                                                    {/* ─ Ketma-ket tugmalar ─ */}
                                                    <div style={{ marginTop: 10 }}>

                                                        {/* 1-QADAM: Chaqirish (waiting) */}
                                                        {e._step === 1 && (
                                                            <button onClick={() => callQueuePatient(e)}
                                                                style={{
                                                                    width: '100%', padding: '10px 0', borderRadius: 10,
                                                                    border: 'none',
                                                                    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                                                                    color: '#fff', fontWeight: 800, fontSize: 13,
                                                                    cursor: 'pointer', fontFamily: 'inherit',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                                                    boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
                                                                    letterSpacing: 0.3,
                                                                }}>
                                                                📢 Chaqirish
                                                            </button>
                                                        )}

                                                        {/* 2-QADAM: Boshlash (called → in_service) */}
                                                        {e._step === 2 && (
                                                            <button onClick={() => startQueueService(e)}
                                                                style={{
                                                                    width: '100%', padding: '10px 0', borderRadius: 10,
                                                                    border: 'none',
                                                                    background: 'linear-gradient(135deg,#f59e0b,#d97706)',
                                                                    color: '#fff', fontWeight: 800, fontSize: 13,
                                                                    cursor: 'pointer', fontFamily: 'inherit',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                                                    boxShadow: '0 4px 12px rgba(245,158,11,0.4)',
                                                                    animation: 'pulseBtn 1.2s ease infinite',
                                                                    letterSpacing: 0.3,
                                                                }}>
                                                                ▶ Qabulni Boshlash
                                                            </button>
                                                        )}

                                                        {/* 3-QADAM: Yakunlash (in_service → complete) */}
                                                        {e._step === 3 && (
                                                            <button onClick={() => completeQueueService(e._id)}
                                                                style={{
                                                                    width: '100%', padding: '10px 0', borderRadius: 10,
                                                                    border: 'none',
                                                                    background: 'linear-gradient(135deg,#10b981,#059669)',
                                                                    color: '#fff', fontWeight: 800, fontSize: 13,
                                                                    cursor: 'pointer', fontFamily: 'inherit',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                                                    boxShadow: '0 4px 12px rgba(16,185,129,0.35)',
                                                                    letterSpacing: 0.3,
                                                                }}>
                                                                ✅ Yakunlash
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </>
                                )}

                                {/* ═══ QABULLAR TAB ═══ */}
                                {activeTab === 'apts' && (
                                    <>

                                        {inProgressAppts.map(apt => (
                                            <button key={apt._id} className="w-full p-4 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 text-left transition-all hover:shadow-md relative overflow-hidden"
                                                onClick={() => handleSelectAppointment(apt)}>
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-mono font-bold text-blue-700">
                                                        {new Date(apt.startsAt || apt.scheduledAt || apt.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <Badge className="animate-pulse bg-blue-500 text-white border-0 text-xs">
                                                        <Activity className="w-3 h-3 mr-1" /> Qabulda
                                                    </Badge>
                                                </div>
                                                <div className="text-base font-bold text-gray-900">{apt.patientId?.firstName} {apt.patientId?.lastName}</div>
                                                {apt.patientId?.phone && <div className="text-xs text-blue-600/70 mt-1 flex items-center gap-1"><Phone className="w-3 h-3" />{apt.patientId.phone}</div>}
                                            </button>
                                        ))}

                                        {waitingAppts.map(apt => (
                                            <button key={apt._id}
                                                className={cn('w-full p-4 rounded-xl border text-left transition-all hover:shadow-md relative overflow-hidden',
                                                    selectedApt?._id === apt._id ? 'border-amber-400 bg-amber-50 ring-1 ring-amber-200' : 'border-amber-100 bg-white hover:border-amber-300')}
                                                onClick={() => handleSelectAppointment(apt)}>
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400" />
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-mono font-semibold text-amber-700">
                                                        {new Date(apt.startsAt || apt.scheduledAt || apt.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">Kutmoqda</Badge>
                                                </div>
                                                <div className="text-sm font-bold text-gray-800">{apt.patientId?.firstName} {apt.patientId?.lastName}</div>
                                                {apt.patientId?.phone && <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Phone className="w-3 h-3" />{apt.patientId.phone}</div>}
                                            </button>
                                        ))}

                                        {scheduledAppts.map(apt => (
                                            <button key={apt._id}
                                                className={cn('w-full p-4 rounded-xl border text-left relative overflow-hidden hover:shadow-md',
                                                    selectedApt?._id === apt._id ? 'border-gray-300 bg-gray-50 ring-1 ring-gray-200' : 'border-gray-100 bg-white hover:border-gray-300')}
                                                onClick={() => handleSelectAppointment(apt)}>
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-300" />
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-mono text-gray-500">
                                                        {new Date(apt.startsAt || apt.scheduledAt || apt.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <Badge className="bg-gray-100 text-gray-500 border-0 text-xs">Rejalashtirilgan</Badge>
                                                </div>
                                                <div className="text-sm font-bold text-gray-700">{apt.patientId?.firstName} {apt.patientId?.lastName}</div>
                                                {apt.patientId?.phone && <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Phone className="w-3 h-3" />{apt.patientId.phone}</div>}
                                            </button>
                                        ))}

                                        {doneAppts.length > 0 && (
                                            <>
                                                <Separator className="my-2" />
                                                <div className="text-xs font-semibold text-muted-foreground uppercase px-2">Yakunlanganlar ({doneAppts.length})</div>
                                                {doneAppts.slice(0, 5).map(apt => (
                                                    <div key={apt._id} className="p-3 rounded-xl opacity-50 bg-gray-50">
                                                        <div className="text-sm font-bold">{apt.patientId?.firstName} {apt.patientId?.lastName}</div>
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
                                    </>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* ─ RIGHT: Work Area ─ */}
                <div className="space-y-4">
                    {!selectedApt ? (
                        <Card>
                            <CardContent className="py-20 flex flex-col items-center text-muted-foreground">
                                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
                                    <User className="h-12 w-12 opacity-40" />
                                </div>
                                <h2 className="text-xl font-semibold text-foreground mb-1">Bemor tanlanmagan</h2>
                                <p className="text-center max-w-sm text-sm">
                                    Navbatdagi bemorni chaqiring yoki ro'yxatdan tanlang
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {/* Patient Header */}
                            <Card className="border-none shadow-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                                <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6 relative z-10">
                                    <Avatar className="h-20 w-20 ring-4 ring-white/30 shadow-xl">
                                        <AvatarFallback className="bg-white/10 backdrop-blur-md text-white text-2xl font-bold">
                                            {selectedApt.patientId?.firstName?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 text-center sm:text-left">
                                        <h2 className="text-2xl font-bold tracking-tight">
                                            {selectedApt.patientId?.firstName} {selectedApt.patientId?.lastName}
                                        </h2>
                                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-2 text-sm font-medium text-white/90">
                                            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full">
                                                <Phone className="h-3.5 w-3.5" /> {selectedApt.patientId?.phone}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="shrink-0 flex gap-2">
                                        {selectedApt.status === 'in_progress' ? (
                                            <Button variant="secondary" className="bg-white text-indigo-600 hover:bg-white/90 font-bold shadow-lg h-12 px-6" disabled>
                                                <Activity className="h-5 w-5 mr-2 animate-pulse" /> Qabul Jarayoni
                                            </Button>
                                        ) : (
                                            <Button size="lg" className="bg-white text-indigo-600 hover:bg-white/90 font-bold shadow-lg h-12 px-8"
                                                onClick={() => updateStatus(selectedApt._id, 'in_progress')}>
                                                <Play className="h-5 w-5 mr-2 fill-current" /> Qabulni Boshlash
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="icon" className="h-12 w-12 text-white hover:bg-white/10"
                                            onClick={() => { setSelectedApt(null); setActiveTab('queue'); }}>
                                            <X className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Tabs */}
                            <div className="flex gap-1 p-1.5 bg-gray-100/80 backdrop-blur rounded-xl border border-gray-200">
                                {[
                                    { id: 'visit', label: '🩺 Joriy Qabul', icon: Activity },
                                    { id: 'history', label: '📄 Tibbiy Tarix', icon: FileText },
                                ].map(t => (
                                    <button key={t.id}
                                        className={cn('flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-bold transition-all duration-300',
                                            activeTab === t.id ? 'bg-white shadow-md text-primary ring-1 ring-black/5' : 'text-muted-foreground hover:text-gray-900 hover:bg-white/50')}
                                        onClick={() => setActiveTab(t.id)}>
                                        {t.label}
                                    </button>
                                ))}
                            </div>

                            {/* Visit Tab */}
                            {activeTab === 'visit' && (
                                <div className="space-y-4">
                                    {/* Tashxis + Retsept */}
                                    <Card>
                                        <CardContent className="p-5 space-y-4">
                                            <div className="space-y-2">
                                                <Label className="flex items-center gap-2"><Stethoscope className="h-4 w-4" /> Tashxis *</Label>
                                                <Textarea rows={3} placeholder="Bemor shikoyatlari va asosiy tashxis..."
                                                    value={diagnosis} onChange={e => setDiagnosis(e.target.value)} className="text-base" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="flex items-center gap-2"><FileText className="h-4 w-4" /> Retsept va Tavsiyalar</Label>
                                                <Textarea rows={4} placeholder="Dori-darmonlar ro'yxati va qabul qilish tartibi..."
                                                    value={prescription} onChange={e => setPrescription(e.target.value)} />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Xizmatlar — qo'shish */}
                                    <Card>
                                        <CardHeader className="p-5 pb-3">
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <DollarSign className="h-4 w-4" /> Xizmatlar
                                                {addedServices.length > 0 && (
                                                    <Badge className="ml-auto bg-indigo-100 text-indigo-700 border-0">
                                                        {addedServices.length} ta · {calcTotal().toLocaleString()} so'm
                                                    </Badge>
                                                )}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-5 pt-0">
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                {services.map(service => {
                                                    const isSelected = addedServices.find(s => (s._id || s) === (service._id || service));
                                                    return (
                                                        <button key={service._id}
                                                            className={cn('relative p-3 rounded-xl border text-left transition-all text-sm',
                                                                isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/50')}
                                                            onClick={() => toggleService(service)}>
                                                            <div className="font-medium text-xs leading-tight">{service.name}</div>
                                                            <div className="text-emerald-600 font-bold mt-1 text-xs">{service.price?.toLocaleString()} so'm</div>
                                                            {isSelected && (
                                                                <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                                                                    <CheckCircle className="h-3.5 w-3.5 text-white" />
                                                                </div>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {/* Tanlangan xizmatlar ro'yhati */}
                                            {addedServices.length > 0 && (
                                                <div className="mt-4 space-y-1.5">
                                                    <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Qo'shilgan xizmatlar:</div>
                                                    {addedServices.map(s => (
                                                        <div key={s._id || s} className="flex items-center justify-between bg-indigo-50 rounded-lg px-3 py-2">
                                                            <div className="text-sm font-medium">{s.name || '—'}</div>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-emerald-600 font-bold text-sm">{(s.price || 0).toLocaleString()} so'm</span>
                                                                <button onClick={() => toggleService(s)}
                                                                    className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center hover:bg-red-200 transition-colors">
                                                                    <X className="h-3.5 w-3.5 text-red-500" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <div className="flex justify-between items-center pt-2 border-t">
                                                        <span className="font-bold text-sm">Jami:</span>
                                                        <span className="font-bold text-indigo-600 text-lg">{calcTotal().toLocaleString()} so'm</span>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Footer: Saqlash */}
                                    {selectedApt.status === 'in_progress' && (
                                        <Card className="sticky bottom-4 shadow-xl">
                                            <CardContent className="p-4 flex items-center justify-between">
                                                <div>
                                                    <div className="text-sm text-muted-foreground">Jami xizmatlar:</div>
                                                    <div className="text-xl font-bold text-indigo-600">{calcTotal().toLocaleString()} so'm</div>
                                                </div>
                                                <div className="flex gap-3">
                                                    <Button variant="outline" size="icon"><Printer className="h-4 w-4" /></Button>
                                                    <Button onClick={handleFinalize} disabled={saving}
                                                        className="min-w-[200px] bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                                                        <Save className="h-4 w-4 mr-2" />
                                                        {saving ? 'Saqlanmoqda...' : 'Saqlash va Yakunlash'}
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            )}

                            {/* History Tab */}
                            {activeTab === 'history' && (
                                <Card>
                                    <CardContent className="p-5">
                                        {!selectedApt.patientId?.medicalHistory?.length ? (
                                            <div className="py-8 flex flex-col items-center text-muted-foreground">
                                                <FileText className="h-12 w-12 mb-3 opacity-30" />
                                                <p>Tibbiy tarix topilmadi</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {[...selectedApt.patientId.medicalHistory].reverse().map((record, idx) => (
                                                    <Card key={idx} className="bg-muted/30">
                                                        <CardContent className="p-4">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <span className="font-bold">{new Date(record.date).toLocaleDateString('uz-UZ')}</span>
                                                                <span className="text-sm text-muted-foreground">Dr. {record.doctorName || 'Shifokor'}</span>
                                                            </div>
                                                            <div className="mb-2"><span className="font-semibold text-primary mr-2">Tashxis:</span>{record.diagnosis}</div>
                                                            <div><span className="font-semibold mr-2">Retsept:</span><span className="text-muted-foreground">{record.prescription}</span></div>
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

            <style>{`
                @keyframes slideDown { from{transform:translateY(-100%)} to{transform:translateY(0)} }
                @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
            `}</style>
        </div >
    );
}
