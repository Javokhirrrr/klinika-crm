import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
    DollarSign, Calendar, Check, X, Activity, PieChart, Users, TrendingUp, Filter, Search
} from 'lucide-react';
import { commissionAPI } from '../api/newFeatures';
import { useAuth } from '../context/AuthContext';

export default function SimpleCommissions() {
    const { user } = useAuth();
    const isAdmin = ['owner', 'admin', 'accountant'].includes(user?.role);
    const [activeTab, setActiveTab] = useState(isAdmin ? 'all' : 'my');
    const [earnings, setEarnings] = useState(null);
    const [commissions, setCommissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [dates, setDates] = useState({ start: '', end: '' });

    useEffect(() => { loadData(); }, [activeTab, filter, dates]);

    const loadData = async () => {
        try {
            setLoading(true);
            const params = { limit: 50 };
            if (filter !== 'all') params.status = filter;
            if (dates.start) params.startDate = dates.start;
            if (dates.end) params.endDate = dates.end;
            if (activeTab === 'my') {
                const { data } = await commissionAPI.getMyEarnings();
                setEarnings(data.earnings);
                const { data: list } = await commissionAPI.getMyHistory(params);
                setCommissions(list.commissions);
            } else {
                const { data: list } = await commissionAPI.getAll(params);
                setCommissions(list.commissions);
            }
        } catch (error) { console.error('Load error:', error); }
        finally { setLoading(false); }
    };

    const handleApprove = async (id) => {
        if (!window.confirm("Tasdiqlaysizmi?")) return;
        try { await commissionAPI.approve(id); alert("Tasdiqlandi!"); loadData(); }
        catch (error) { alert("Xatolik: " + error.message); }
    };

    const handlePay = async (id) => {
        const method = window.prompt("To'lov turi (cash/card)?", "cash");
        if (!method) return;
        try { await commissionAPI.pay(id, { paymentMethod: method }); alert("To'landi!"); loadData(); }
        catch (error) { alert("Xatolik: " + error.message); }
    };

    const handleCancel = async (id) => {
        const reason = window.prompt("Bekor qilish sababi?");
        if (!reason) return;
        try { await commissionAPI.cancel(id, { reason }); alert("Bekor qilindi!"); loadData(); }
        catch (error) { alert("Xatolik: " + error.message); }
    };

    const statusMap = {
        pending: { label: 'Kutilmoqda', class: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
        approved: { label: 'Tasdiqlandi', class: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
        paid: { label: "To'landi", class: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
        cancelled: { label: 'Bekor qilindi', class: 'bg-rose-100 text-rose-700 hover:bg-rose-200' }
    };

    const earningCards = earnings ? [
        { label: 'Kutilmoqda', value: earnings.pending?.amount || 0, icon: Activity, gradient: 'from-amber-500 to-orange-600', bg: 'bg-amber-50', text: 'text-amber-600' },
        { label: 'Tasdiqlandi', value: earnings.approved?.amount || 0, icon: Check, gradient: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50', text: 'text-blue-600' },
        { label: "To'landi", value: earnings.paid?.amount || 0, icon: DollarSign, gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50', text: 'text-emerald-600' },
    ] : [];

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                        Ulushlar va Bonuslar
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        {activeTab === 'my' ? 'Shaxsiy daromadlar statistikasi' : 'Klinika xodimlari ulushlari va to\'lovlar'}
                    </p>
                </div>

                {isAdmin && (
                    <div className="flex p-1 bg-gray-100/80 backdrop-blur rounded-xl border border-gray-200 shadow-sm">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={cn(
                                "px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2",
                                activeTab === 'all'
                                    ? "bg-white text-primary shadow-md transform scale-105"
                                    : "text-muted-foreground hover:text-gray-900 hover:bg-gray-200/50"
                            )}
                        >
                            <Users className="w-4 h-4" /> Barchasi
                        </button>
                        <button
                            onClick={() => setActiveTab('my')}
                            className={cn(
                                "px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2",
                                activeTab === 'my'
                                    ? "bg-white text-primary shadow-md transform scale-105"
                                    : "text-muted-foreground hover:text-gray-900 hover:bg-gray-200/50"
                            )}
                        >
                            <Activity className="w-4 h-4" /> O'zimniki
                        </button>
                    </div>
                )}
            </div>

            {/* Earnings Cards */}
            {activeTab === 'my' && earnings && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {earningCards.map((stat, i) => (
                        <Card key={i} className="border-none shadow-md hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
                            <div className={`absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 rounded-full opacity-10 bg-gradient-to-br ${stat.gradient}`}></div>
                            <CardContent className="p-6 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className={`p-4 rounded-2xl ${stat.bg} ${stat.text} shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                                        <stat.icon className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                                        <h3 className="text-3xl font-extrabold text-gray-900 mt-1">
                                            {stat.value.toLocaleString()} <span className="text-sm text-muted-foreground font-medium">so'm</span>
                                        </h3>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Filters Bar */}
            <Card className="border-none shadow-sm bg-white sticky top-4 z-20">
                <CardContent className="p-5">
                    <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between">
                        {/* Status Filters */}
                        <div className="flex items-center gap-2 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 scrollbar-hide">
                            {[
                                { id: 'all', label: 'Barchasi' },
                                { id: 'pending', label: 'Kutilmoqda' },
                                { id: 'approved', label: 'Tasdiqlangan' },
                                { id: 'paid', label: "To'langan" }
                            ].map(status => (
                                <button
                                    key={status.id}
                                    onClick={() => setFilter(status.id)}
                                    className={cn(
                                        "px-6 py-3 rounded-xl text-base font-semibold whitespace-nowrap transition-all shadow-sm",
                                        filter === status.id
                                            ? "bg-primary text-primary-foreground shadow-md transform scale-105"
                                            : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                                    )}
                                >
                                    {status.label}
                                </button>
                            ))}
                        </div>

                        {/* Date Filters */}
                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto bg-gray-50 p-2 rounded-2xl border border-gray-100">
                            <div className="relative w-full sm:w-auto group">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-primary transition-colors" />
                                <input
                                    type="date"
                                    className="w-full sm:w-40 pl-12 pr-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white transition-all hover:border-gray-300"
                                    value={dates.start}
                                    onChange={(e) => setDates({ ...dates, start: e.target.value })}
                                />
                            </div>
                            <span className="text-gray-400 font-bold hidden sm:block">→</span>
                            <div className="relative w-full sm:w-auto group">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-primary transition-colors" />
                                <input
                                    type="date"
                                    className="w-full sm:w-40 pl-12 pr-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white transition-all hover:border-gray-300"
                                    value={dates.end}
                                    onChange={(e) => setDates({ ...dates, end: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Main Content */}
            <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                            <Activity className="h-10 w-10 animate-spin text-primary mb-4" />
                            <p>Ma'lumotlar yuklanmoqda...</p>
                        </div>
                    ) : commissions.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center text-center">
                            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                <PieChart className="h-10 w-10 text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Ma'lumotlar topilmadi</h3>
                            <p className="text-muted-foreground mt-2 max-w-sm">
                                Ushbu sanalar yoki filter bo'yicha hech qanday ulush va bonuslar mavjud emas.
                            </p>
                            <Button variant="outline" className="mt-6" onClick={() => { setFilter('all'); setDates({ start: '', end: '' }) }}>
                                Filterni tozalash
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow>
                                    <TableHead className="font-bold text-gray-900">Sana</TableHead>
                                    {activeTab === 'all' && <TableHead className="font-bold text-gray-900">Xodim</TableHead>}
                                    <TableHead className="font-bold text-gray-900">Bemor</TableHead>
                                    <TableHead className="font-bold text-gray-900">Hisoblangan Summa</TableHead>
                                    <TableHead className="font-bold text-gray-900 text-center">Holat</TableHead>
                                    {isAdmin && <TableHead className="font-bold text-gray-900 text-right">Amallar</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {commissions.map((c) => {
                                    const status = statusMap[c.status] || statusMap.pending;
                                    return (
                                        <TableRow key={c._id} className="hover:bg-blue-50/30 transition-colors border-b last:border-0 border-gray-100">
                                            <TableCell>
                                                <div className="flex items-center gap-3 font-medium text-gray-700">
                                                    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500">
                                                        <Calendar className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-gray-900">
                                                            {new Date(c.createdAt).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long' })}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {new Date(c.createdAt).toLocaleDateString('uz-UZ', { year: 'numeric' })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {activeTab === 'all' && (
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-9 w-9 ring-2 ring-white shadow-sm">
                                                            <AvatarFallback className="bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 font-bold text-xs">
                                                                {c.userId?.name?.[0]}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="font-bold text-gray-900">{c.userId?.name || 'N/A'}</div>
                                                            <div className="text-xs text-muted-foreground capitalize bg-gray-100 px-1.5 py-0.5 rounded-md inline-block mt-0.5">
                                                                {c.userId?.role}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            )}

                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 font-bold text-xs">
                                                        {c.patientId?.firstName?.[0]}
                                                    </div>
                                                    <span className="font-medium text-gray-700">
                                                        {c.patientId ? `${c.patientId.firstName} ${c.patientId.lastName}` : '-'}
                                                    </span>
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <div>
                                                    <div className="text-lg font-black text-emerald-600 flex items-baseline gap-1">
                                                        {c.amount?.toLocaleString()} <span className="text-xs font-semibold text-emerald-500">so'm</span>
                                                    </div>
                                                    <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                                                        <PieChart className="h-3 w-3" /> {c.percentage}% ulush
                                                    </div>
                                                </div>
                                            </TableCell>

                                            <TableCell className="text-center">
                                                <Badge className={cn("px-3 py-1 text-xs font-semibold shadow-sm border-0", status.class)}>
                                                    {status.label}
                                                </Badge>
                                            </TableCell>

                                            {isAdmin && (
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {c.status === 'pending' && (
                                                            <Button size="sm" className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 shadow-none border border-emerald-200"
                                                                onClick={() => handleApprove(c._id)} title="Tasdiqlash">
                                                                <Check className="h-4 w-4 mr-1" /> Tasdiqlash
                                                            </Button>
                                                        )}
                                                        {c.status === 'approved' && (
                                                            <Button size="sm" className="bg-blue-50 text-blue-600 hover:bg-blue-100 shadow-none border border-blue-200"
                                                                onClick={() => handlePay(c._id)} title="To'lash">
                                                                <DollarSign className="h-4 w-4 mr-1" /> To'lash
                                                            </Button>
                                                        )}
                                                        {['pending', 'approved'].includes(c.status) && (
                                                            <Button size="icon" variant="ghost" className="h-9 w-9 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                                                                onClick={() => handleCancel(c._id)} title="Bekor qilish">
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
