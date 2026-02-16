import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Users, Calendar, DollarSign, TrendingUp,
    UserPlus, CalendarPlus, Activity, Clock, ArrowUpRight, Plus
} from 'lucide-react';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import http from '../lib/http';
import { useAuth } from '../context/AuthContext';

export default function SimpleDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalPatients: 0, totalAppointments: 0, todayAppointments: 0,
        totalRevenue: 0, todayRevenue: 0, pendingAppointments: 0
    });
    const [recentAppointments, setRecentAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [revenueData, setRevenueData] = useState([]);
    const [appointmentData, setAppointmentData] = useState([]);

    useEffect(() => { loadDashboard(); }, []);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            const [patients, appointments, payments] = await Promise.all([
                http.get('/patients').catch(() => ({ items: [] })),
                http.get('/appointments').catch(() => ({ items: [] })),
                http.get('/payments').catch(() => ({ items: [] }))
            ]);

            const patientsRes = patients && patients.items ? patients.items : (Array.isArray(patients) ? patients : []);
            const appointmentsRes = appointments && appointments.items ? appointments.items : (Array.isArray(appointments) ? appointments : []);
            const paymentsRes = payments && payments.items ? payments.items : (Array.isArray(payments) ? payments : []);

            const pItems = Array.isArray(patientsRes) ? patientsRes : [];
            const aItems = Array.isArray(appointmentsRes) ? appointmentsRes : [];
            const payItems = Array.isArray(paymentsRes) ? paymentsRes : [];
            const today = new Date().toISOString().split('T')[0];

            const todayAppts = aItems.filter(a => a.date?.startsWith(today)).length;
            const pendingAppts = aItems.filter(a => a.status === 'waiting' || a.status === 'scheduled').length;
            const totalRev = payItems.reduce((sum, p) => sum + (p.amount || 0), 0);
            const todayRev = payItems.filter(p => p.createdAt?.startsWith(today)).reduce((sum, p) => sum + (p.amount || 0), 0);

            setStats({
                totalPatients: pItems.length,
                totalAppointments: aItems.length,
                todayAppointments: todayAppts,
                totalRevenue: totalRev,
                todayRevenue: todayRev,
                pendingAppointments: pendingAppts
            });

            setRecentAppointments(aItems.slice(0, 6));

            // Last 7 days data
            const last7 = Array.from({ length: 7 }, (_, i) => {
                const d = new Date(); d.setDate(d.getDate() - (6 - i));
                return d.toISOString().split('T')[0];
            });

            setRevenueData(last7.map(date => ({
                name: new Date(date).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' }),
                revenue: payItems.filter(p => p.createdAt?.startsWith(date)).reduce((s, p) => s + (p.amount || 0), 0) / 1000
            })));

            setAppointmentData(last7.map(date => ({
                name: new Date(date).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' }),
                count: aItems.filter(a => a.date?.startsWith(date)).length
            })));
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const statusPieData = [
        { name: 'Kutmoqda', value: stats.pendingAppointments || 1, color: '#3b82f6' },
        { name: 'Bajarildi', value: Math.max(0, stats.totalAppointments - stats.pendingAppointments) || 1, color: '#93c5fd' },
    ];

    const fmt = (n) => {
        if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
        if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
        return n.toString();
    };

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
                        Xush kelibsiz, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">{user?.name || 'Foydalanuvchi'}</span> 👋
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Bugungi kun statistikasi va rejalaringiz bilan tanishing.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-white rounded-xl border shadow-sm text-sm font-medium text-gray-600 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        {new Date().toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                    <Button onClick={() => navigate('/appointments')} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5">
                        <Plus className="w-5 h-5 mr-2" /> Yangi Qabul
                    </Button>
                </div>
            </div>

            {/* Stat Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Bemorlar', value: fmt(stats.totalPatients), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', chart: statusPieData },
                    { label: 'Jami Qabullar', value: fmt(stats.totalAppointments), icon: Calendar, color: 'text-violet-600', bg: 'bg-violet-50', chart: null },
                    { label: 'Jami Tushum', value: fmt(stats.totalRevenue), sub: `Bugun: ${fmt(stats.todayRevenue)}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', chart: null },
                    { label: 'Bugungi Qabullar', value: stats.todayAppointments, sub: `Kutmoqda: ${stats.pendingAppointments}`, icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50', chart: null },
                ].map((stat, i) => (
                    <Card key={i} className="border-none shadow-md hover:shadow-xl transition-all duration-300 group bg-white/80 backdrop-blur-sm relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 ${stat.bg.replace('bg-', 'bg-current ')} text-current ${stat.color}`}></div>
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                                    <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{stat.value}</h3>
                                    {stat.sub && (
                                        <p className="text-xs font-medium text-muted-foreground mt-2 bg-gray-100/80 inline-block px-2 py-1 rounded-md">
                                            {stat.sub}
                                        </p>
                                    )}
                                </div>
                                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} shadow-sm group-hover:scale-110 transition-transform`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                            </div>
                            {stat.chart && (
                                <div className="h-10 w-full mt-4 opacity-50">
                                    {/* Tiny sparkline or chart placeholder could go here */}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area - Charts and Tables */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Charts Section */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <Card className="border-none shadow-lg bg-white/90 backdrop-blur">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <TrendingUp className="w-5 h-5 text-primary" />
                                    Qabullar Dinamikasi
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={appointmentData}>
                                        <defs>
                                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                                        <Tooltip
                                            cursor={{ fill: '#f1f5f9' }}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.1)' }}
                                        />
                                        <Bar dataKey="count" fill="url(#colorCount)" radius={[6, 6, 0, 0]} barSize={28} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-lg bg-white/90 backdrop-blur">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <DollarSign className="w-5 h-5 text-emerald-600" />
                                    Moliyaviy Ko'rsatkichlar
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={250}>
                                    <LineChart data={revenueData}>
                                        <defs>
                                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.1)' }}
                                        />
                                        <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Appointments */}
                    <Card className="border-none shadow-lg bg-white overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between border-b bg-gray-50/50 px-6 py-4">
                            <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-gray-500" />
                                <CardTitle className="text-lg">So'nggi Qabullar</CardTitle>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => navigate('/appointments')} className="text-primary hover:text-primary/80">
                                Barchasini ko'rish <ArrowUpRight className="h-4 w-4 ml-1" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-gray-100">
                                {recentAppointments.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground">Qabullar mavjud emas</div>
                                ) : (
                                    recentAppointments.map((apt) => (
                                        <div key={apt._id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center text-primary font-bold shadow-sm">
                                                    {apt.patientId?.firstName?.[0]}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{apt.patientId?.firstName} {apt.patientId?.lastName}</p>
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(apt.startsAt || apt.date).toLocaleString('uz-UZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge
                                                className={cn(
                                                    "px-3 py-1 rounded-full font-normal capitalize",
                                                    apt.status === 'done' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                                                        apt.status === 'in_progress' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' :
                                                            'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                )}
                                            >
                                                {apt.status === 'done' ? 'Bajarildi' : apt.status === 'in_progress' ? 'Jarayonda' : 'Kutmoqda'}
                                            </Badge>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Column - Quick Actions & Notifications */}
                <div className="space-y-6">
                    <Card className="border-none shadow-lg bg-gradient-to-br from-white to-blue-50/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Activity className="w-5 h-5 text-primary" />
                                Tezkor Amallar
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 pt-2">
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: 'Yangi Bemor', icon: UserPlus, bg: 'bg-blue-100 text-blue-600', path: '/patients' },
                                    { label: 'Qabul', icon: CalendarPlus, bg: 'bg-violet-100 text-violet-600', path: '/appointments' },
                                    { label: "To'lov", icon: DollarSign, bg: 'bg-emerald-100 text-emerald-600', path: '/payments' },
                                    { label: 'Hisobot', icon: TrendingUp, bg: 'bg-amber-100 text-amber-600', path: '/reports' },
                                    { label: 'Xona', icon: Activity, bg: 'bg-rose-100 text-rose-600', path: '/doctor-room' },
                                    { label: 'Sozlamalar', icon: Users, bg: 'bg-gray-100 text-gray-600', path: '/system' }
                                ].map((action, i) => (
                                    <button
                                        key={i}
                                        onClick={() => navigate(action.path)}
                                        className="flex flex-col items-center justify-center p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 group"
                                    >
                                        <div className={`p-3 rounded-full mb-3 ${action.bg} group-hover:scale-110 transition-transform duration-300`}>
                                            <action.icon className="w-5 h-5" />
                                        </div>
                                        <span className="text-xs font-semibold text-gray-700 group-hover:text-primary transition-colors">
                                            {action.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Can add another card here for Notifications or Calendar summary */}
                    <Card className="border-none shadow-md bg-white">
                        <CardContent className="p-5 flex flex-col items-center justify-center h-48 text-center space-y-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                <Clock className="w-6 h-6 text-gray-400" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900">Ish tartibi</h4>
                                <p className="text-xs text-muted-foreground mt-1 px-4">
                                    Bugungi ish kuningiz 09:00 dan 18:00 gacha davom etadi.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
