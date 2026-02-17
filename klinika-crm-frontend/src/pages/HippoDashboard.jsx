import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, Calendar, Clock, CreditCard,
    MoreHorizontal, Search
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
        <div className="space-y-8 font-['Outfit'] text-[#0F172A]">

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* 1. Bugungi bemorlar */}
                <div className="bg-white p-6 rounded-[18px] shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.04)] transition-shadow cursor-pointer border border-transparent hover:border-blue-50">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-blue-50 p-3 rounded-2xl">
                            <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        {/* Mock trend */}
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">↑ 12%</span>
                    </div>
                    <div className="text-3xl font-bold mb-1 font-['Inter']">{stats.todayPatients}</div>
                    <div className="text-sm text-gray-400 font-medium">Bugungi bemorlar</div>
                </div>

                {/* 2. Qabullar */}
                <div className="bg-white p-6 rounded-[18px] shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.04)] transition-shadow cursor-pointer border border-transparent hover:border-emerald-50">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-emerald-50 p-3 rounded-2xl">
                            <Calendar className="h-6 w-6 text-emerald-600" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold mb-1 font-['Inter']">{stats.todayAppts}</div>
                    <div className="text-sm text-gray-400 font-medium flex items-center gap-2">
                        Qabullar <span className="w-1 h-1 rounded-full bg-gray-300"></span> <span className="text-emerald-600">{stats.todayDone} tasi yakunlandi</span>
                    </div>
                </div>

                {/* 3. Kutilmoqda */}
                <div className="bg-white p-6 rounded-[18px] shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.04)] transition-shadow cursor-pointer border border-transparent hover:border-amber-50">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-amber-50 p-3 rounded-2xl">
                            <Clock className="h-6 w-6 text-amber-500" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold mb-1 font-['Inter']">{stats.todayPending}</div>
                    <div className="text-sm text-gray-400 font-medium">Kutilmoqda (O'rtacha 15 daq)</div>
                </div>

                {/* 4. Bugungi Tushum */}
                <div className="bg-white p-6 rounded-[18px] shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.04)] transition-shadow cursor-pointer border border-transparent hover:border-purple-50">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-purple-50 p-3 rounded-2xl">
                            <CreditCard className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold mb-1 font-['Inter']">
                        {stats.revenue.toLocaleString()} <span className="text-sm font-normal text-gray-400">so'm</span>
                    </div>
                    <div className="text-sm text-gray-400 font-medium">Bugungi tushum</div>
                </div>
            </div>

            {/* Middle Section: Chart & Doctor List */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Chart Section (Left - 70% roughly, usually col-span-8) */}
                <div className="lg:col-span-8 bg-white p-6 rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Tashriflar dinamikasi</h3>
                            <p className="text-sm text-gray-400">Oxirgi 7 kunlik statistika</p>
                        </div>
                        <Button variant="ghost" size="icon" className="text-gray-400"><MoreHorizontal /></Button>
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.chartData}>
                                <defs>
                                    <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
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
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorBlue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Doctor List (Right - 30%) */}
                <div className="lg:col-span-4 bg-white p-6 rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-900">Band doktorlar</h3>
                        <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-600 font-medium" onClick={() => navigate('/doctors')}>Barchasi</Button>
                    </div>

                    <div className="space-y-6">
                        {stats.doctors.length === 0 ? (
                            <div className="text-center text-gray-400 py-10">Ma'lumot yo'q</div>
                        ) : stats.doctors.map((doc, i) => (
                            <div key={i} className="group">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-sm">
                                            {doc.name ? doc.name[0] : 'D'}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors cursor-pointer" onClick={() => navigate(`/doctors`)}>Dr. {doc.name || doc.fullName}</div>
                                            <div className="text-xs text-gray-400">{doc.specialty || 'Terapevt'}</div>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-slate-600">{doc.busyPercentage}%</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                        style={{ width: `${doc.busyPercentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Section: Appointments Table */}
            <div className="bg-white rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.02)] overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-900">Bugungi qabullar</h3>
                    <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-600 font-medium" onClick={() => navigate('/appointments')}>Barchasini ko'rish</Button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                <th className="px-6 py-4 font-medium pl-8">Vaqt</th>
                                <th className="px-6 py-4 font-medium">Bemor ismi</th>
                                <th className="px-6 py-4 font-medium">Shifokor</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium text-right pr-8">Amallar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {stats.todayAppointmentsList.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-10 text-center text-gray-400">Bugun uchun qabullar yo'q</td>
                                </tr>
                            ) : stats.todayAppointmentsList.map((appt, i) => (
                                <tr key={i} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4 pl-8 font-bold text-slate-700 font-['Inter']">
                                        {formatTime(appt.startsAt || appt.createdAt)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-800 text-sm">{appt.patient?.name || appt.patientName || 'Noma\'lum'}</div>
                                        <div className="text-xs text-gray-400">{appt.service?.name || 'Konsultatsiya'}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        Dr. {appt.doctor?.name || 'Tayinlanmagan'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {getStatusBadge(appt.status)}
                                    </td>
                                    <td className="px-6 py-4 text-right pr-8">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-gray-300 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all bg-white shadow-sm border border-gray-100"
                                            onClick={() => navigate(`/appointments`)}
                                        >
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
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
