import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, Calendar, Clock, CreditCard,
    MoreHorizontal, Search
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '../context/AuthContext';
import http from '../lib/http';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function HippoDashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        todayPatients: 0,
        todayAppts: 0,
        todayDone: 0,
        todayPending: 0,
        revenue: 0,
        chartData: [],
        doctors: [],
        todayAppointmentsList: []
    });

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                const [p, a, d, py] = await Promise.all([
                    http.get('/patients?limit=1000').catch(() => ({ items: [] })),
                    http.get('/appointments?limit=1000').catch(() => ({ items: [] })),
                    http.get('/doctors').catch(() => ({ items: [] })),
                    http.get('/payments?limit=1000').catch(() => ({ items: [] }))
                ]);

                const pItems = Array.isArray(p?.items) ? p.items : (Array.isArray(p) ? p : []);
                const aItems = Array.isArray(a?.items) ? a.items : (Array.isArray(a) ? a : []);
                const dItems = Array.isArray(d?.items) ? d.items : (Array.isArray(d) ? d : []);
                const pyItems = Array.isArray(py?.items) ? py.items : (Array.isArray(py) ? py : []);

                // Today's date
                const now = new Date();
                const today = now.toISOString().split('T')[0];
                const isToday = (d) => !!d && new Date(d).toISOString().split('T')[0] === today;

                // KPIs
                const todayPatients = pItems.filter(x => isToday(x.createdAt)).length;
                const todayAppts = aItems.filter(x => isToday(x.startsAt || x.startAt || x.createdAt)).length;
                const todayDone = aItems.filter(x => isToday(x.startsAt || x.startAt || x.createdAt) && (x.status === 'done' || x.status === 'completed')).length;
                const todayPending = aItems.filter(x => isToday(x.startsAt || x.startAt || x.createdAt) && (x.status === 'pending' || x.status === 'scheduled' || !x.status)).length;
                const revenue = pyItems.filter(x => isToday(x.createdAt)).reduce((s, x) => s + Number(x.amount || 0), 0);

                // Chart Data (Last 7 days)
                const chartData = [];
                for (let i = 6; i >= 0; i--) {
                    const date = new Date(now);
                    date.setDate(date.getDate() - i);
                    const dateStr = date.toISOString().split('T')[0];
                    const dayName = date.toLocaleDateString('uz-UZ', { weekday: 'short' });

                    const count = aItems.filter(x => {
                        const d = x.startsAt || x.startAt || x.createdAt;
                        return d && new Date(d).toISOString().split('T')[0] === dateStr;
                    }).length;

                    chartData.push({ name: dayName, value: count });
                }

                // Doctor Busyness (Mock or calculated)
                const doctorsWithInfo = dItems.map(doc => {
                    const docAppts = aItems.filter(x => (x.doctorId === doc._id || x.doctor?._id === doc._id) && isToday(x.startsAt || x.startAt || x.createdAt));
                    const busyPercentage = Math.min(Math.round((docAppts.length / 10) * 100), 100); // Assume 10 is max capacity
                    return { ...doc, busyPercentage, todayCount: docAppts.length };
                }).sort((a, b) => b.busyPercentage - a.busyPercentage).slice(0, 5);

                // Today's Appointments List
                const todayList = aItems
                    .filter(x => isToday(x.startsAt || x.startAt || x.createdAt))
                    .sort((a, b) => new Date(a.startsAt || a.createdAt) - new Date(b.startsAt || b.createdAt))
                    .slice(0, 5);

                setStats({
                    todayPatients, todayAppts, todayDone, todayPending,
                    revenue, chartData, doctors: doctorsWithInfo, todayAppointmentsList: todayList
                });
            } catch (e) { console.error(e); } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const formatTime = (dateStr) => {
        if (!dateStr) return '--:--';
        return new Date(dateStr).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    };

    const getStatusBadge = (status) => {
        const s = status?.toLowerCase() || 'pending';
        // Mockup colors: Qabulda -> Green, Kutilmoqda -> Yellow, Bekor -> Red
        if (s === 'done' || s === 'completed') return <span className="text-blue-700 bg-blue-100 px-4 py-1.5 rounded-full text-xs font-bold shadow-sm">Yakunlandi</span>;
        if (s === 'cancelled') return <span className="text-red-600 bg-red-100 px-4 py-1.5 rounded-full text-xs font-bold shadow-sm">Bekor qilindi</span>;
        if (s === 'pending' || s === 'scheduled') return <span className="text-amber-700 bg-amber-100 px-4 py-1.5 rounded-full text-xs font-bold shadow-sm">Kutilmoqda</span>;
        if (s === 'progress') return <span className="text-emerald-700 bg-emerald-100 px-4 py-1.5 rounded-full text-xs font-bold shadow-sm">Qabulda</span>;
        return <span className="text-slate-600 bg-slate-100 px-4 py-1.5 rounded-full text-xs font-bold shadow-sm">{status}</span>;
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400 font-medium">Yuklanmoqda...</div>;

    return (
        <div className="space-y-8 font-['Outfit'] text-[#0F172A] pb-10">
            {/* Custom Dashboard Header from Image 2 */}
            <div className="bg-white p-5 rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">KLINIKA PRO</h1>
                <div className="flex items-center gap-4">
                    <Button
                        onClick={() => navigate('/patients')}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl px-6 h-11 shadow-lg shadow-blue-200"
                    >
                        + Yangi Bemor
                    </Button>
                    <div className="h-10 w-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shadow-sm">
                        <Avatar className="h-full w-full">
                            <AvatarFallback className="bg-transparent text-blue-900 font-bold">
                                {user?.name?.[0] || 'A'}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* 1. Bugungi bemorlar */}
                <div className="bg-white p-6 py-8 rounded-[24px] shadow-[0_10px_30px_rgba(30,64,175,0.03)] border border-transparent hover:border-blue-50 transition-all flex flex-col items-center text-center group hover:bg-white/90 backdrop-blur-sm hover:shadow-[0_20px_40px_rgba(30,64,175,0.06)]">
                    <div className="bg-blue-50 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-blue-100">
                        <Users className="h-7 w-7 text-blue-600" />
                    </div>
                    <div className="text-slate-400 font-medium mb-1 text-sm tracking-wide">Bugungi bemorlar</div>
                    <div className="text-4xl font-bold text-slate-800 mb-2 font-['Outfit'] tracking-tight">{stats.todayPatients}</div>
                    <span className="bg-emerald-50 text-emerald-600 text-[11px] font-bold px-3 py-1.5 rounded-full border border-emerald-100">+12%</span>
                </div>

                {/* 2. Qabullar */}
                <div className="bg-white p-6 py-8 rounded-[24px] shadow-[0_10px_30px_rgba(16,185,129,0.03)] border border-transparent hover:border-emerald-50 transition-all flex flex-col items-center text-center group hover:bg-white/90 backdrop-blur-sm hover:shadow-[0_20px_40px_rgba(16,185,129,0.06)]">
                    <div className="bg-emerald-50 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-emerald-100">
                        <Calendar className="h-7 w-7 text-emerald-600" />
                    </div>
                    <div className="text-slate-400 font-medium mb-1 text-sm tracking-wide">Qabullar</div>
                    <div className="text-4xl font-bold text-slate-800 mb-2 font-['Outfit'] tracking-tight">{stats.todayAppts}</div>
                    <div className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">{stats.todayDone} tasi yakunlandi</div>
                </div>

                {/* 3. Kutilmoqda */}
                <div className="bg-white p-6 py-8 rounded-[24px] shadow-[0_10px_30px_rgba(245,158,11,0.03)] border border-transparent hover:border-amber-50 transition-all flex flex-col items-center text-center group hover:bg-white/90 backdrop-blur-sm hover:shadow-[0_20px_40px_rgba(245,158,11,0.06)]">
                    <div className="bg-amber-50 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-amber-100">
                        <Clock className="h-7 w-7 text-amber-500" />
                    </div>
                    <div className="text-slate-400 font-medium mb-1 text-sm tracking-wide">Kutilmoqda</div>
                    <div className="text-4xl font-bold text-slate-800 mb-2 font-['Outfit'] tracking-tight">{stats.todayPending}</div>
                    <div className="text-[11px] text-slate-400 font-medium bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">O'rtacha kutish: 12 daq</div>
                </div>

                {/* 4. Bugungi Tushum */}
                <div className="bg-white p-6 py-8 rounded-[24px] shadow-[0_10px_30px_rgba(124,58,237,0.03)] border border-transparent hover:border-purple-50 transition-all flex flex-col items-center text-center group hover:bg-white/90 backdrop-blur-sm hover:shadow-[0_20px_40px_rgba(124,58,237,0.06)]">
                    <div className="bg-purple-50 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-purple-100">
                        <CreditCard className="h-7 w-7 text-purple-600" />
                    </div>
                    <div className="text-slate-400 font-medium mb-1 text-sm tracking-wide">Bugungi tushum</div>
                    <div className="text-3xl font-bold text-slate-800 mb-2 font-['Outfit'] tracking-tight whitespace-nowrap">
                        {stats.revenue.toLocaleString()} <span className="text-lg text-slate-400 font-normal">so'm</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">Kunlik statistika</span>
                </div>
            </div>

            {/* Main Content Grid: Left (Chart+Table), Right (Docs+Status) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column Container */}
                <div className="lg:col-span-2 bg-white rounded-[24px] p-8 shadow-[0_10px_40px_rgba(0,0,0,0.02)] border border-slate-100/50 flex flex-col gap-10">

                    {/* 1. Chart Section */}
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800 tracking-tight">Tashriflar dinamikasi</h3>
                        </div>
                        <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}
                                        itemStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                                        cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#3B82F6"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorBlue)"
                                        activeDot={{ r: 6, strokeWidth: 3, stroke: '#fff', fill: '#3B82F6' }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 2. Table Section */}
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800 tracking-tight">Bugungi qabul ro'yxati</h3>
                        </div>
                        <div className="overflow-hidden rounded-xl border border-slate-100">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr className="text-left">
                                        <th className="py-4 pl-4 text-slate-500 font-semibold text-xs uppercase tracking-wider">Vaqt</th>
                                        <th className="py-4 text-slate-500 font-semibold text-xs uppercase tracking-wider">Bemor</th>
                                        <th className="py-4 text-slate-500 font-semibold text-xs uppercase tracking-wider">Shifokor</th>
                                        <th className="py-4 text-slate-500 font-semibold text-xs uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {stats.todayAppointmentsList.length === 0 ? (
                                        <tr><td colSpan="4" className="py-8 text-center text-slate-400">Bugun qabullar yo'q</td></tr>
                                    ) : stats.todayAppointmentsList.map((appt, i) => (
                                        <tr key={i} className="group hover:bg-blue-50/30 transition-colors">
                                            <td className="py-4 pl-4 font-bold text-slate-700 font-['Inter'] text-sm">
                                                {formatTime(appt.startsAt || appt.createdAt)}
                                            </td>
                                            <td className="py-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8 bg-white border border-slate-200">
                                                        <AvatarFallback className="bg-slate-50 text-slate-600 text-xs font-bold">
                                                            {(appt.patient?.name || appt.patientName || 'N')[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-bold text-slate-800 text-sm">
                                                        {appt.patient?.name || appt.patientName || 'Noma\'lum'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 text-sm font-medium text-slate-500">
                                                Dr. {appt.doctor?.name || '---'}
                                            </td>
                                            <td className="py-4">
                                                {getStatusBadge(appt.status)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>

                {/* Right Column Container */}
                <div className="bg-white rounded-[24px] p-8 shadow-[0_10px_40px_rgba(0,0,0,0.02)] border border-slate-100/50 flex flex-col gap-10 h-fit">

                    {/* 1. Doctor List */}
                    <div>
                        <div className="mb-6 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800 tracking-tight">Band doktorlar</h3>
                        </div>
                        <div className="space-y-5">
                            {stats.doctors.length === 0 ? (
                                <div className="text-center text-slate-400 py-6">Ma'lumot yo'q</div>
                            ) : stats.doctors.map((doc, i) => (
                                <div key={i} className="group p-4 rounded-2xl bg-white border border-slate-100 hover:border-blue-100 hover:shadow-sm transition-all shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="font-bold text-slate-800 text-sm">Dr. {doc.name || doc.fullName}</div>
                                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{doc.busyPercentage}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-600 rounded-full shadow-[0_2px_4px_rgba(37,99,235,0.2)]"
                                            style={{ width: `${doc.busyPercentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 2. Status Section */}
                    <div>
                        <div className="flex justify-between items-center mb-4 pt-4 border-t border-slate-50">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</h3>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</h3>
                        </div>
                        <div className="space-y-4">
                            {stats.todayAppointmentsList.slice(0, 4).map((appt, i) => (
                                <div key={i} className="flex justify-between items-center group">
                                    <span className="font-bold text-slate-700 text-sm group-hover:text-blue-600 transition-colors">
                                        {appt.patient?.name?.split(' ')[0] || 'Noma\'lum'}
                                    </span>
                                    <div>{getStatusBadge(appt.status)}</div>
                                </div>
                            ))}
                            {stats.todayAppointmentsList.length === 0 && (
                                <div className="text-slate-400 text-sm text-center">Bugun holatlar yo'q</div>
                            )}
                        </div>
                    </div>

                </div>
            </div>

        </div>
    );
}
