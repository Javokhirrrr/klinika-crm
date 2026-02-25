import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    DollarSign, Users, TrendingUp, Search, Download,
    Edit, Percent, Award, ChevronLeft, ChevronRight,
    CheckCircle, XCircle, Loader2
} from 'lucide-react';
import http from '../lib/http';

// ─── helpers ─────────────────────────────────────────────────────────────────

const fmt = (n) => (Number(n) || 0).toLocaleString('uz-UZ');

function yymm(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(yyyymm) {
    const [y, m] = yyyymm.split('-');
    const months = [
        'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
        'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
    ];
    return `${months[Number(m) - 1]} ${y}`;
}

const ROLE_LABELS = {
    doctor: { label: 'Shifokor', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
    reception: { label: 'Qabulxona', cls: 'bg-purple-100 text-purple-700 border-purple-200' },
    accountant: { label: 'Buxgalter', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
    admin: { label: 'Admin', cls: 'bg-rose-100 text-rose-700 border-rose-200' },
    owner: { label: 'Direktor', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    nurse: { label: 'Hamshira', cls: 'bg-pink-100 text-pink-700 border-pink-200' },
    cashier: { label: 'Kassir', cls: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
};

const AVATAR_COLORS = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500',
    'bg-purple-500', 'bg-orange-500', 'bg-indigo-500',
    'bg-teal-500', 'bg-pink-500',
];

function getAvatarColor(name = '') {
    return AVATAR_COLORS[name.length % AVATAR_COLORS.length];
}

function getInitials(name = '') {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?';
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SimpleSalaries() {
    const today = new Date();
    const [month, setMonth] = useState(yymm(today));
    const [salaries, setSalaries] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // edit modal
    const [editEmp, setEditEmp] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');

    // ── Load data ──────────────────────────────────────────────────────────────
    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [salRes, sumRes] = await Promise.all([
                http.get('/salaries', { month }),
                http.get('/salaries/summary', { month }),
            ]);
            setSalaries(salRes.salaries || []);
            setSummary(sumRes.summary || null);
        } catch (e) {
            console.error('Salary load error:', e);
            // Fall back to /users if salary endpoint fails
            try {
                const usersRes = await http.get('/users', { limit: 1000 });
                const users = usersRes.items || usersRes || [];
                setSalaries(users.map(u => ({
                    userId: u._id,
                    name: u.name,
                    email: u.email,
                    role: u.role,
                    baseSalary: u.baseSalary || 0,
                    kpiBonus: u.kpiBonus || 0,
                    kpiCriteria: u.kpiCriteria || '',
                    commission: 0,
                    commissionRate: u.commissionRate || 0,
                    totalSalary: (u.baseSalary || 0) + (u.kpiBonus || 0),
                    workDays: 0,
                    expectedWorkDays: 0,
                })));
            } catch (_) { /* ignore */ }
        } finally {
            setLoading(false);
        }
    }, [month]);

    useEffect(() => { load(); }, [load]);

    // ── Month navigation ───────────────────────────────────────────────────────
    const shiftMonth = (delta) => {
        const [y, m] = month.split('-').map(Number);
        const d = new Date(y, m - 1 + delta, 1);
        setMonth(yymm(d));
    };

    // ── Edit modal ─────────────────────────────────────────────────────────────
    const openEdit = (emp) => {
        setEditEmp(emp);
        setEditForm({
            baseSalary: emp.baseSalary || 0,
            kpiBonus: emp.kpiBonus || 0,
            kpiCriteria: emp.kpiCriteria || '',
            commissionRate: emp.commissionRate || 0,
            commissionEnabled: emp.commissionRate > 0,
        });
        setSaveMsg('');
    };

    const handleSave = async () => {
        setSaving(true);
        setSaveMsg('');
        try {
            await http.put(`/salaries/${editEmp.userId}`, {
                baseSalary: Number(editForm.baseSalary) || 0,
                kpiBonus: Number(editForm.kpiBonus) || 0,
                kpiCriteria: editForm.kpiCriteria || '',
                commissionRate: editForm.commissionEnabled ? (Number(editForm.commissionRate) || 0) : 0,
                commissionEnabled: !!editForm.commissionEnabled,
            });
            setSaveMsg('ok');
            setEditEmp(null);
            await load();
        } catch (e) {
            setSaveMsg('err');
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    // ── Filtered list ──────────────────────────────────────────────────────────
    const filtered = salaries.filter(emp => {
        const s = search.toLowerCase();
        const role = ROLE_LABELS[emp.role]?.label || emp.role || '';
        return (emp.name || '').toLowerCase().includes(s) || role.toLowerCase().includes(s);
    });

    // ── Summary stats ──────────────────────────────────────────────────────────
    const totalFund = summary?.totalSalary ?? filtered.reduce((a, e) => a + (e.totalSalary || 0), 0);
    const activeCount = summary?.employeeCount ?? salaries.length;
    const avgSalary = activeCount > 0 ? Math.round(totalFund / activeCount) : 0;

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6 animate-fade-in pb-10">

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-3">
                        Xodimlar Maoshlari
                        <Badge variant="secondary" className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-bold border border-emerald-100">
                            {salaries.length} Xodim
                        </Badge>
                    </h1>
                    <p className="text-muted-foreground mt-1">Oylik maoshlarni boshqarish va hisoblash</p>
                </div>

                {/* Month navigator */}
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => shiftMonth(-1)}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="px-5 py-2 rounded-lg border bg-white shadow-sm font-semibold text-gray-800 min-w-[150px] text-center">
                        {monthLabel(month)}
                    </div>
                    <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => shiftMonth(1)}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="ml-2 hidden md:flex items-center gap-2 text-sm">
                        <Download className="h-4 w-4" /> Eksport
                    </Button>
                </div>
            </div>

            {/* ── Stats cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Total Fund */}
                <Card className="border-none shadow-md bg-gradient-to-br from-indigo-500 to-purple-600 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16" />
                    <CardContent className="p-6 relative z-10 flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-xl">
                            <DollarSign className="h-7 w-7 text-white" />
                        </div>
                        <div>
                            <p className="text-indigo-100 text-sm font-medium">Jami Maosh Fondi</p>
                            <h3 className="text-2xl font-bold">{fmt(totalFund)} <span className="text-base opacity-80">so'm</span></h3>
                        </div>
                    </CardContent>
                </Card>

                {/* Active employees */}
                <Card className="border-none shadow-sm bg-white">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <Users className="h-7 w-7" />
                        </div>
                        <div>
                            <p className="text-muted-foreground text-sm font-medium">Faol Xodimlar</p>
                            <h3 className="text-2xl font-bold text-gray-900">{activeCount}</h3>
                        </div>
                    </CardContent>
                </Card>

                {/* Average salary */}
                <Card className="border-none shadow-sm bg-white">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <TrendingUp className="h-7 w-7" />
                        </div>
                        <div>
                            <p className="text-muted-foreground text-sm font-medium">O'rtacha Maosh</p>
                            <h3 className="text-2xl font-bold text-gray-900">{fmt(avgSalary)} <span className="text-sm text-gray-400 font-normal">so'm</span></h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── Search ── */}
            <Card className="border-none shadow-sm bg-white sticky top-4 z-20">
                <CardContent className="p-4">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Xodim yoki lavozim bo'yicha qidirish..."
                            className="pl-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* ── Main table ── */}
            <Card className="border-none shadow-xl bg-white overflow-hidden">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-20 text-muted-foreground">
                            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
                            Yuklanmoqda...
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-20 text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <Users className="h-10 w-10 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Xodimlar topilmadi</h3>
                            <p className="text-muted-foreground">Qidiruv so'rovingiz bo'yicha hech narsa topilmadi.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gray-50/80">
                                    <TableRow>
                                        <TableHead className="pl-6 font-bold text-gray-900">Xodim</TableHead>
                                        <TableHead className="font-bold text-gray-900">Lavozim</TableHead>
                                        <TableHead className="font-bold text-gray-900 text-right">Fix Maosh</TableHead>
                                        <TableHead className="font-bold text-gray-900 text-right">
                                            <span className="flex items-center justify-end gap-1"><Award className="h-3.5 w-3.5 text-amber-500" />KPI Bonus</span>
                                        </TableHead>
                                        <TableHead className="font-bold text-gray-900 text-right">
                                            <span className="flex items-center justify-end gap-1"><Percent className="h-3.5 w-3.5 text-blue-500" />Komissiya</span>
                                        </TableHead>
                                        <TableHead className="font-bold text-gray-900 text-right">Jami Maosh</TableHead>
                                        <TableHead className="font-bold text-gray-900 text-center">Davomat</TableHead>
                                        <TableHead className="text-right pr-6 font-bold text-gray-900">Amallar</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.map(emp => {
                                        const rs = ROLE_LABELS[emp.role] || { label: emp.role, cls: 'bg-gray-100 text-gray-700' };
                                        const isDoctor = emp.role === 'doctor';
                                        return (
                                            <TableRow key={emp.userId} className="hover:bg-blue-50/30 transition-colors border-b last:border-0 border-gray-100">
                                                {/* Name */}
                                                <TableCell className="pl-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-10 w-10 border border-gray-200 shadow-sm">
                                                            <AvatarFallback className={cn('font-bold text-xs text-white', getAvatarColor(emp.name))}>
                                                                {getInitials(emp.name)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="font-bold text-gray-900">{emp.name}</div>
                                                            <div className="text-xs text-muted-foreground">{emp.email || '—'}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* Role */}
                                                <TableCell>
                                                    <Badge variant="secondary" className={cn('px-2.5 py-0.5 font-semibold border text-xs', rs.cls)}>
                                                        {rs.label}
                                                    </Badge>
                                                </TableCell>

                                                {/* Base salary */}
                                                <TableCell className="text-right">
                                                    <span className="font-semibold text-gray-700">{fmt(emp.baseSalary)}</span>
                                                    <span className="text-xs text-gray-400 ml-1">so'm</span>
                                                </TableCell>

                                                {/* KPI Bonus */}
                                                <TableCell className="text-right">
                                                    {emp.kpiBonus > 0 ? (
                                                        <span className="font-semibold text-amber-600">+{fmt(emp.kpiBonus)} <span className="text-xs font-normal text-gray-400">so'm</span></span>
                                                    ) : (
                                                        <span className="text-gray-300">—</span>
                                                    )}
                                                </TableCell>

                                                {/* Commission */}
                                                <TableCell className="text-right">
                                                    {isDoctor ? (
                                                        emp.commissionRate > 0 ? (
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-xs text-blue-500 font-medium">{emp.commissionRate}%</span>
                                                                {emp.commission > 0 && (
                                                                    <span className="font-semibold text-blue-700">+{fmt(emp.commission)} <span className="text-xs font-normal text-gray-400">so'm</span></span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-300">—</span>
                                                        )
                                                    ) : (
                                                        <span className="text-gray-200 text-xs">Mavjud emas</span>
                                                    )}
                                                </TableCell>

                                                {/* Total */}
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                                                            <DollarSign className="h-3.5 w-3.5" />
                                                        </div>
                                                        <span className="font-bold text-gray-900">{fmt(emp.totalSalary)}</span>
                                                        <span className="text-xs font-normal text-muted-foreground">so'm</span>
                                                    </div>
                                                </TableCell>

                                                {/* Attendance */}
                                                <TableCell className="text-center">
                                                    {emp.expectedWorkDays > 0 ? (
                                                        <span className={cn(
                                                            'text-sm font-semibold',
                                                            emp.workDays >= emp.expectedWorkDays ? 'text-emerald-600' : 'text-amber-600'
                                                        )}>
                                                            {emp.workDays}/{emp.expectedWorkDays}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-300 text-sm">—</span>
                                                    )}
                                                </TableCell>

                                                {/* Actions */}
                                                <TableCell className="text-right pr-6">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="hover:bg-blue-50 text-blue-600 gap-1.5"
                                                        onClick={() => openEdit(emp)}
                                                    >
                                                        <Edit className="h-3.5 w-3.5" /> Tahrirlash
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── Edit Modal ── */}
            <Dialog open={!!editEmp} onOpenChange={v => !v && setEditEmp(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <div className={cn('h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-bold', getAvatarColor(editEmp?.name))}>
                                {getInitials(editEmp?.name)}
                            </div>
                            {editEmp?.name}
                        </DialogTitle>
                        <DialogDescription>
                            {ROLE_LABELS[editEmp?.role]?.label || editEmp?.role} · {monthLabel(month)} uchun maosh sozlamalari
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 py-2">
                        {/* Base Salary */}
                        <div className="space-y-2">
                            <Label className="font-semibold flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-emerald-500" />
                                Fix Oylik Maosh (so'm)
                            </Label>
                            <Input
                                type="number"
                                min={0}
                                value={editForm.baseSalary}
                                onChange={e => setEditForm(f => ({ ...f, baseSalary: e.target.value }))}
                                placeholder="Masalan: 3000000"
                                className="text-right font-mono"
                            />
                        </div>

                        {/* KPI Bonus */}
                        <div className="space-y-2">
                            <Label className="font-semibold flex items-center gap-2">
                                <Award className="h-4 w-4 text-amber-500" />
                                KPI Bonus (so'm)
                            </Label>
                            <Input
                                type="number"
                                min={0}
                                value={editForm.kpiBonus}
                                onChange={e => setEditForm(f => ({ ...f, kpiBonus: e.target.value }))}
                                placeholder="Masalan: 500000"
                                className="text-right font-mono"
                            />
                        </div>

                        {/* KPI Criteria */}
                        <div className="space-y-2">
                            <Label className="font-semibold flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                KPI Mezonlari (tavsif)
                            </Label>
                            <Input
                                value={editForm.kpiCriteria}
                                onChange={e => setEditForm(f => ({ ...f, kpiCriteria: e.target.value }))}
                                placeholder="Masalan: Oyda 100 ta bemor, 95% ijobiy baho..."
                            />
                        </div>

                        {/* Commission — only for doctors */}
                        {editEmp?.role === 'doctor' && (
                            <div className="space-y-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
                                <div className="flex items-center justify-between">
                                    <Label className="font-semibold flex items-center gap-2 text-blue-700">
                                        <Percent className="h-4 w-4" />
                                        Komissiya (Foizga ishlash)
                                    </Label>
                                    <button
                                        type="button"
                                        onClick={() => setEditForm(f => ({ ...f, commissionEnabled: !f.commissionEnabled }))}
                                        className={cn(
                                            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none',
                                            editForm.commissionEnabled ? 'bg-blue-600' : 'bg-gray-200'
                                        )}
                                    >
                                        <span className={cn(
                                            'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
                                            editForm.commissionEnabled ? 'translate-x-6' : 'translate-x-1'
                                        )} />
                                    </button>
                                </div>
                                {editForm.commissionEnabled && (
                                    <div className="space-y-1">
                                        <Label className="text-sm text-blue-600">Foiz miqdori (%)</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                min={0}
                                                max={100}
                                                value={editForm.commissionRate}
                                                onChange={e => setEditForm(f => ({ ...f, commissionRate: e.target.value }))}
                                                placeholder="Masalan: 20"
                                                className="text-right font-mono bg-white"
                                            />
                                            <span className="text-lg font-bold text-blue-600">%</span>
                                        </div>
                                        <p className="text-xs text-blue-500 mt-1">
                                            Shifokor har bir xizmatdan ushbu foiz miqdorida daromad oladi
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Summary preview */}
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                            <p className="text-xs text-emerald-600 font-medium mb-1">Taxminiy jami maosh:</p>
                            <p className="text-xl font-bold text-emerald-700">
                                {fmt(
                                    (Number(editForm.baseSalary) || 0) +
                                    (Number(editForm.kpiBonus) || 0) +
                                    (editEmp?.commission || 0)
                                )}
                                <span className="text-sm font-normal text-emerald-500 ml-1">so'm</span>
                            </p>
                            {editEmp?.commission > 0 && (
                                <p className="text-xs text-emerald-500 mt-0.5">
                                    + {fmt(editEmp.commission)} so'm komissiya ({editEmp.commissionRate}%)
                                </p>
                            )}
                        </div>

                        {/* Error msg */}
                        {saveMsg === 'err' && (
                            <div className="flex items-center gap-2 text-red-600 text-sm">
                                <XCircle className="h-4 w-4" /> Saqlashda xatolik yuz berdi
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setEditEmp(null)}>Bekor qilish</Button>
                        <Button onClick={handleSave} disabled={saving} className="gap-2 bg-slate-900 hover:bg-slate-800">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                            Saqlash
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
