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
        if (s === 'done' || s === 'completed') return <span className="text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl text-xs font-semibold">Yakunlandi</span>;
        if (s === 'cancelled') return <span className="text-red-500 bg-red-50 px-3 py-1 rounded-xl text-xs font-semibold">Bekor qilindi</span>;
        if (s === 'pending' || s === 'scheduled') return <span className="text-amber-600 bg-amber-50 px-3 py-1 rounded-xl text-xs font-semibold">Kutilmoqda</span>;
        if (s === 'progress') return <span className="text-blue-600 bg-blue-50 px-3 py-1 rounded-xl text-xs font-semibold">Qabulda</span>;
        return <span className="text-gray-500 bg-gray-100 px-3 py-1 rounded-xl text-xs font-semibold">{status}</span>;
    };

    if (loading) return <div className="p-10 text-center text-gray-400">Yuklanmoqda...</div>;

    return (
        <div className="space-y-8 font-['Outfit'] text-[#0F172A] pb-10">
            {/* Custom Dashboard Header matching Image 2 */}
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
                <div className="bg-white p-6 py-8 rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-transparent hover:border-blue-50 transition-all flex flex-col items-center text-center">
                    <div className="bg-blue-50 p-4 rounded-full mb-4">
                        <Users className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="text-gray-400 font-medium mb-2">Bugungi bemorlar</div>
                    <div className="text-4xl font-bold text-slate-900 mb-2 font-['Inter']">{stats.todayPatients}</div>
                    <span className="bg-emerald-50 text-emerald-600 text-xs font-bold px-3 py-1 rounded-full">+12%</span>
                </div>

                {/* 2. Qabullar */}
                <div className="bg-white p-6 py-8 rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-transparent hover:border-emerald-50 transition-all flex flex-col items-center text-center">
                    <div className="bg-emerald-50 p-4 rounded-full mb-4">
                        <Calendar className="h-8 w-8 text-emerald-600" />
                    </div>
                    <div className="text-gray-400 font-medium mb-2">Qabullar</div>
                    <div className="text-4xl font-bold text-slate-900 mb-2 font-['Inter']">{stats.todayAppts}</div>
                    <div className="text-xs text-emerald-600 font-medium bg-emerald-50 px-3 py-1 rounded-full">{stats.todayDone} tasi yakunlandi</div>
                </div>

                {/* 3. Kutilmoqda */}
                <div className="bg-white p-6 py-8 rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-transparent hover:border-amber-50 transition-all flex flex-col items-center text-center">
                    <div className="bg-amber-50 p-4 rounded-full mb-4">
                        <Clock className="h-8 w-8 text-amber-500" />
                    </div>
                    <div className="text-gray-400 font-medium mb-2">Kutilmoqda</div>
                    <div className="text-4xl font-bold text-slate-900 mb-2 font-['Inter']">{stats.todayPending}</div>
                    <div className="text-xs text-gray-400 font-medium">O'rtacha kutish: 12 daq</div>
                </div>

                {/* 4. Bugungi Tushum */}
                <div className="bg-white p-6 py-8 rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-transparent hover:border-purple-50 transition-all flex flex-col items-center text-center">
                    <div className="bg-purple-50 p-4 rounded-full mb-4">
                        <CreditCard className="h-8 w-8 text-purple-600" />
                    </div>
                    <div className="text-gray-400 font-medium mb-2">Bugungi tushum</div>
                    <div className="text-3xl font-bold text-slate-900 mb-2 font-['Inter'] whitespace-nowrap">
                        {stats.revenue.toLocaleString()} <span className="text-lg text-gray-400">so'm</span>
                    </div>
                    <span className="text-xs text-gray-300">Kunlik statistika</span>
                </div>
            </div>

            {/* Middle Section: Chart & Doctor List */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Chart Section (Left - 66%) */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-slate-900">Tashriflar dinamikasi</h3>
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                                    itemStyle={{ color: '#0F172A', fontWeight: 'bold' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#3B82F6"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorBlue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Doctor List (Right - 33%) */}
                <div className="bg-white p-8 rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-lg font-bold text-slate-900">Band doktorlar</h3>
                    </div>

                    <div className="space-y-6">
                        {stats.doctors.length === 0 ? (
                            <div className="text-center text-gray-400 py-10">Ma'lumot yo'q</div>
                        ) : stats.doctors.map((doc, i) => (
                            <div key={i} className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-center mb-3">
                                    <div className="font-bold text-slate-800 text-sm">Dr. {doc.name || doc.fullName}</div>
                                    <span className="text-sm font-bold text-blue-600">{doc.busyPercentage}%</span>
                                </div>
                                <div className="h-2 w-full bg-blue-50 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-600 rounded-full"
                                        style={{ width: `${doc.busyPercentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Section: Appointments Table and Statuses? 
                Image 2 shows: Left Table, Right Status List. 
                I'll keep it simple: Full width table for better usability, but styled like the image.
            */}
            <div className="bg-white rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.02)] overflow-hidden p-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-900">Bugungi qabul ro'yxati</h3>
                    <Button variant="ghost" className="text-blue-600 hover:bg-blue-50">Barchasini ko'rish</Button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left">
                                <th className="pb-4 pl-4 text-gray-400 font-medium text-sm">Vaqt</th>
                                <th className="pb-4 text-gray-400 font-medium text-sm">Bemor</th>
                                <th className="pb-4 text-gray-400 font-medium text-sm">Shifokor</th>
                                <th className="pb-4 text-gray-400 font-medium text-sm">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {stats.todayAppointmentsList.length === 0 ? (
                                <tr><td colSpan="4" className="py-8 text-center text-gray-400">Bugun qabullar yo'q</td></tr>
                            ) : stats.todayAppointmentsList.map((appt, i) => (
                                <tr key={i} className="group hover:bg-gray-50/50">
                                    <td className="py-4 pl-4 font-bold text-slate-700">
                                        {formatTime(appt.startsAt || appt.createdAt)}
                                    </td>
                                    <td className="py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                                                {(appt.patient?.name || appt.patientName || 'N')[0]}
                                            </div>
                                            <span className="font-bold text-slate-800 text-sm">{appt.patient?.name || appt.patientName || 'Noma\'lum'}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 text-sm font-medium text-gray-600">
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
    );
}
