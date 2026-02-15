import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Combobox } from '@/components/ui/combobox';
import {
    Plus, DollarSign, Calendar, Printer, Banknote, CreditCard,
    TrendingUp, Search, RefreshCw, X, Wallet, User, CheckCircle
} from 'lucide-react';
import http from '../lib/http';
import Receipt from '../components/Receipt';
import ReceiptPreviewModal from '@/components/ReceiptPreviewModal';

export default function SimplePayments() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ today: 0, total: 0 });
    const [searchQuery, setSearchQuery] = useState('');
    const [methodFilter, setMethodFilter] = useState('all');

    // Create modal
    const [showCreate, setShowCreate] = useState(false);
    const [patients, setPatients] = useState([]);
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [form, setForm] = useState({ amount: '', method: 'cash', note: '' });
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState('');
    const amountRef = useRef(null);
    const [receiptSettings, setReceiptSettings] = useState(null);

    // Receipt Modal State
    const [receiptUrl, setReceiptUrl] = useState(null);
    const [showReceiptModal, setShowReceiptModal] = useState(false);

    useEffect(() => {
        loadPayments();
        // Load receipt settings
        http.get('/settings/receipt_template')
            .then(res => setReceiptSettings(res?.value))
            .catch(console.error);
    }, []);

    const loadPayments = async () => {
        try {
            setLoading(true);
            const res = await http.get('/payments');
            const items = res.items || res || [];
            const sortedItems = items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setPayments(sortedItems);

            const today = new Date().toISOString().split('T')[0];
            const todayTotal = items
                .filter(p => p.createdAt?.startsWith(today))
                .reduce((sum, p) => sum + (p.amount || 0), 0);
            const total = items.reduce((sum, p) => sum + (p.amount || 0), 0);
            setStats({ today: todayTotal, total });
        } catch (error) { console.error('Load error:', error); }
        finally { setLoading(false); }
    };

    // Filter payments
    const filteredPayments = payments.filter(p => {
        if (methodFilter !== 'all' && p.method !== methodFilter) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const name = `${p.patientId?.firstName || ''} ${p.patientId?.lastName || ''}`.toLowerCase();
            if (!name.includes(q) && !p.patientId?.phone?.includes(q) && !String(p.amount).includes(q)) return false;
        }
        return true;
    });

    const hasFilters = searchQuery || methodFilter !== 'all';
    const clearFilters = () => { setSearchQuery(''); setMethodFilter('all'); };

    // Load patients for modal
    const loadPatients = async () => {
        try {
            const res = await http.get('/patients', { limit: 1000 });
            setPatients(res.items || res || []);
        } catch (e) { console.error(e); }
    };

    function openCreate() {
        setShowCreate(true);
        setForm({ amount: '', method: 'cash', note: '' });
        setSelectedPatientId('');
        setMsg('');
        loadPatients();
    }

    function closeCreate() { setShowCreate(false); setMsg(''); }

    function save() {
        if (!selectedPatientId) { setMsg("Bemorni tanlang!"); return; }
        if (!form.amount || Number(form.amount) <= 0) { setMsg("Summani kiriting!"); return; }
        setBusy(true); setMsg('');
        try {
            http.post('/payments', {
                patientId: selectedPatientId,
                amount: Number(form.amount),
                method: form.method,
                note: form.note || '',
            }).then(() => {
                closeCreate();
                loadPayments();
            });
        } catch (e) {
            setMsg(e?.response?.data?.message || "Xatolik yuz berdi");
        } finally { setBusy(false); }
    }

    const handlePrint = (payment) => {
        const url = `${http.API_BASE || ''}/api/receipts/payments/${payment._id}/print`;
        setReceiptUrl(url);
        setShowReceiptModal(true);
    };

    const fmtDate = (d) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('uz-UZ');
    };
    const fmtTime = (d) => {
        if (!d) return '';
        return new Date(d).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Wallet className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
                                To'lovlar
                                <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">{filteredPayments.length}</span>
                            </h1>
                            <p className="text-xs text-gray-400 mt-0.5">Moliyaviy tushumlar va to'lovlar tarixi</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={loadPayments} className="rounded-xl border-gray-200 h-9">
                            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Yangilash
                        </Button>
                        <Button size="sm" onClick={openCreate} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/25 h-9">
                            <Plus className="h-4 w-4 mr-1.5" /> Yangi To'lov
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Bugungi tushum</p>
                        <p className="text-2xl font-black text-gray-900">{stats.today.toLocaleString()} <span className="text-sm font-bold text-emerald-600">so'm</span></p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Jami tushum</p>
                        <p className="text-2xl font-black text-gray-900">{stats.total.toLocaleString()} <span className="text-sm font-bold text-blue-600">so'm</span></p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 bg-white rounded-2xl border border-gray-200/80 shadow-sm px-5 py-4">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Bemor ismi, telefon yoki summa..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-9 h-10 text-sm rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white"
                    />
                </div>

                <div className="h-8 w-px bg-gray-200 hidden md:block" />

                <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100">
                    {[
                        { key: 'all', label: 'Barchasi' },
                        { key: 'cash', label: '💵 Naqd' },
                        { key: 'card', label: '💳 Karta' },
                        { key: 'transfer', label: '🏦 O\'tkazma' },
                    ].map(item => (
                        <button
                            key={item.key}
                            onClick={() => setMethodFilter(item.key)}
                            className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap",
                                methodFilter === item.key ? "bg-white shadow-sm text-emerald-600" : "text-gray-500 hover:text-gray-800")}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                {hasFilters && (
                    <button onClick={clearFilters} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Tozalash">
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-400 animate-pulse">Yuklanmoqda...</div>
                ) : filteredPayments.length === 0 ? (
                    <div className="py-16 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <DollarSign className="h-8 w-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">To'lovlar topilmadi</h3>
                        <p className="text-sm text-gray-400 mt-1">Hozircha hech qanday to'lov yo'q</p>
                        {hasFilters && (
                            <Button variant="outline" size="sm" className="mt-4 rounded-xl" onClick={clearFilters}>
                                Filtrlarni tozalash
                            </Button>
                        )}
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50/80 border-b border-gray-200">
                                <TableHead className="font-bold text-gray-500 text-xs uppercase tracking-wider pl-5 w-10">#</TableHead>
                                <TableHead className="font-bold text-gray-500 text-xs uppercase tracking-wider">Sana</TableHead>
                                <TableHead className="font-bold text-gray-500 text-xs uppercase tracking-wider">Bemor</TableHead>
                                <TableHead className="font-bold text-gray-500 text-xs uppercase tracking-wider">Summa</TableHead>
                                <TableHead className="font-bold text-gray-500 text-xs uppercase tracking-wider">To'lov usuli</TableHead>
                                <TableHead className="font-bold text-gray-500 text-xs uppercase tracking-wider">Izoh</TableHead>
                                <TableHead className="font-bold text-gray-500 text-xs uppercase tracking-wider text-right pr-5">Amallar</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPayments.map((payment, idx) => (
                                <TableRow key={payment._id} className="hover:bg-emerald-50/30 transition-colors border-b last:border-0 border-gray-100">
                                    <TableCell className="pl-5 text-xs font-bold text-gray-400">{idx + 1}</TableCell>
                                    <TableCell>
                                        <div className="text-sm font-semibold text-gray-900">{fmtDate(payment.createdAt)}</div>
                                        <div className="text-[11px] text-gray-400">{fmtTime(payment.createdAt)}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm font-semibold text-gray-900">
                                            {payment.patientId?.firstName} {payment.patientId?.lastName}
                                        </div>
                                        <div className="text-[11px] text-gray-400">{payment.patientId?.phone || '—'}</div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg text-sm border border-emerald-100">
                                            {payment.amount?.toLocaleString()} so'm
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className={cn(
                                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold",
                                            payment.method === 'cash' ? "bg-green-50 text-green-700 border border-green-200"
                                                : payment.method === 'card' ? "bg-purple-50 text-purple-700 border border-purple-200"
                                                    : "bg-blue-50 text-blue-700 border border-blue-200"
                                        )}>
                                            {payment.method === 'cash' ? <><Banknote className="h-3 w-3" /> Naqd</> :
                                                payment.method === 'card' ? <><CreditCard className="h-3 w-3" /> Karta</> :
                                                    <><DollarSign className="h-3 w-3" /> O'tkazma</>}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-xs text-gray-500">{payment.note || '—'}</span>
                                    </TableCell>
                                    <TableCell className="text-right pr-5">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg" onClick={() => handlePrint(payment)}>
                                                <Printer className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}

                            {/* Totals row */}
                            <TableRow className="bg-gray-50/80 border-t-2 border-gray-200 font-bold">
                                <TableCell className="pl-5"></TableCell>
                                <TableCell colSpan={2} className="text-sm font-bold text-gray-700">
                                    Jami: {filteredPayments.length} ta to'lov
                                </TableCell>
                                <TableCell>
                                    <span className="font-black text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg text-sm border border-emerald-200">
                                        {filteredPayments.reduce((s, p) => s + (p.amount || 0), 0).toLocaleString()} so'm
                                    </span>
                                </TableCell>
                                <TableCell colSpan={3}></TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                )}
            </div>

            {/* Create Payment Modal */}
            <Dialog open={showCreate} onOpenChange={(open) => { if (!open) closeCreate(); }}>
                <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-5">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2.5">
                                <div className="h-9 w-9 rounded-lg bg-white/15 flex items-center justify-center">
                                    <Plus className="h-4 w-4 text-white" />
                                </div>
                                Yangi to'lov
                            </DialogTitle>
                        </DialogHeader>
                    </div>

                    <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
                        {/* Patient - Combobox like appointments */}
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Bemor *</Label>
                            <Combobox
                                options={patients.map(p => ({
                                    value: p._id,
                                    label: `${p.firstName} ${p.lastName}${p.phone ? ' — ' + p.phone : ''}`
                                }))}
                                value={selectedPatientId}
                                onValueChange={(val) => {
                                    setSelectedPatientId(val);
                                    if (val) setTimeout(() => amountRef.current?.focus(), 100);
                                }}
                                placeholder="Bemorni tanlang"
                                searchPlaceholder="Bemor ismini yozing..."
                                emptyText="Bemor topilmadi"
                            />
                        </div>

                        {/* Amount */}
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Summa (so'm) *</Label>
                            <Input
                                ref={amountRef}
                                type="number"
                                value={form.amount}
                                onChange={e => setForm({ ...form, amount: e.target.value })}
                                placeholder="0"
                                className="h-12 rounded-xl border-gray-200 text-lg font-bold"
                            />
                        </div>

                        {/* Method */}
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">To'lov usuli</Label>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { key: 'cash', label: 'Naqd', icon: '💵' },
                                    { key: 'card', label: 'Karta', icon: '💳' },
                                    { key: 'transfer', label: "O'tkazma", icon: '🏦' },
                                ].map(m => (
                                    <button
                                        key={m.key}
                                        onClick={() => setForm({ ...form, method: m.key })}
                                        className={cn(
                                            "p-3 rounded-xl border-2 text-center transition-all",
                                            form.method === m.key
                                                ? "border-emerald-500 bg-emerald-50"
                                                : "border-gray-200 bg-white hover:border-gray-300"
                                        )}
                                    >
                                        <div className="text-2xl mb-1">{m.icon}</div>
                                        <div className={cn("text-xs font-bold",
                                            form.method === m.key ? "text-emerald-700" : "text-gray-600"
                                        )}>
                                            {m.label}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Note */}
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Izoh</Label>
                            <Input
                                value={form.note}
                                onChange={e => setForm({ ...form, note: e.target.value })}
                                placeholder="Ixtiyoriy izoh..."
                                className="h-10 rounded-xl border-gray-200"
                            />
                        </div>
                    </div>

                    {/* Error */}
                    {msg && (
                        <div className="mx-5 mb-2 p-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">
                            ⚠️ {msg}
                        </div>
                    )}

                    {/* Footer */}
                    <div className="border-t border-gray-200 p-4 flex justify-between items-center bg-gray-50/50">
                        <div className="text-sm text-gray-500">
                            {form.amount ? (
                                <span className="font-bold text-emerald-600">{Number(form.amount).toLocaleString()} so'm</span>
                            ) : '—'}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={closeCreate} className="rounded-xl px-5">Bekor</Button>
                            <Button size="sm" disabled={busy || !selectedPatientId || !form.amount} onClick={save}
                                className="rounded-xl px-5 bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/25">
                                {busy ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <CheckCircle className="h-3.5 w-3.5 mr-1.5" />}
                                {busy ? "..." : "To'lovni saqlash"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <ReceiptPreviewModal
                open={showReceiptModal}
                onClose={() => setShowReceiptModal(false)}
                url={receiptUrl}
            />
        </div >
    );
}
