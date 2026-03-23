import React, { useState, useEffect, useCallback } from 'react';
import { cashDeskApi } from '../api/cashDesk.js';
import {
  Landmark, Plus, ArrowDownCircle, ArrowUpCircle, ArrowLeftRight,
  TrendingUp, TrendingDown, Wallet, Loader2, X, ChevronDown,
  Banknote, CreditCard, Building2, ShieldCheck, MoreVertical,
  CheckCircle, AlertTriangle, RefreshCw, Eye, Calendar
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => Number(n || 0).toLocaleString('uz-UZ') + ' so\'m';
const fmtShort = (n) => {
  const v = Math.abs(n || 0);
  if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1) + ' mlrd';
  if (v >= 1_000_000)     return (v / 1_000_000).toFixed(1) + ' mln';
  if (v >= 1_000)         return (v / 1_000).toFixed(0) + ' ming';
  return String(v);
};

const TYPE_META = {
  cash:      { label: 'Naqd pul',  icon: Banknote,    color: '#10B981', bg: '#ECFDF5', border: '#6EE7B7' },
  card:      { label: 'Karta/POS', icon: CreditCard,  color: '#3B82F6', bg: '#EFF6FF', border: '#93C5FD' },
  bank:      { label: 'Bank',      icon: Building2,   color: '#8B5CF6', bg: '#F5F3FF', border: '#C4B5FD' },
  insurance: { label: 'Sug\'urta', icon: ShieldCheck, color: '#F59E0B', bg: '#FFFBEB', border: '#FCD34D' },
};

const TX_TYPE_META = {
  income:        { label: 'Kirim',       color: '#10B981', bg: '#ECFDF5', icon: ArrowDownCircle },
  expense:       { label: 'Chiqim',      color: '#EF4444', bg: '#FEF2F2', icon: ArrowUpCircle },
  transfer_out:  { label: 'O\'tkazma',   color: '#F59E0B', bg: '#FFFBEB', icon: ArrowLeftRight },
  transfer_in:   { label: 'Qabul',       color: '#3B82F6', bg: '#EFF6FF', icon: ArrowLeftRight },
  salary_payout: { label: 'Oylik',       color: '#8B5CF6', bg: '#F5F3FF', icon: Banknote },
};

const INCOME_CATEGORIES  = ['payment', 'deposit', 'other_income'];
const EXPENSE_CATEGORIES = ['salary', 'rent', 'utilities', 'supplies', 'equipment', 'marketing', 'other_expense'];

const CAT_LABELS = {
  payment:'Bemor to\'lovi', deposit:'Avans', other_income:'Boshqa kirim',
  salary:'Oylik', rent:'Ijara', utilities:'Kommunal', supplies:'Materiallar',
  equipment:'Jihozlar', marketing:'Reklama', other_expense:'Boshqa chiqim',
  internal_transfer:'Ichki o\'tkazma',
};

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  const colors = type === 'success'
    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
    : 'bg-red-50 border-red-200 text-red-800';
  const Icon = type === 'success' ? CheckCircle : AlertTriangle;
  return (
    <div className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-xl ${colors} animate-in slide-in-from-bottom-4`}>
      <Icon className="h-5 w-5 shrink-0" />
      <span className="font-semibold text-sm">{msg}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X className="h-4 w-4" /></button>
    </div>
  );
}

// ─── New Desk Modal ───────────────────────────────────────────────────────────
function NewDeskModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: '', type: 'cash', currency: 'UZS', description: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const desk = await cashDeskApi.createDesk(form);
      onSave(desk);
      onClose();
    } catch (err) {
      alert(err?.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center">
              <Landmark className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Yangi kassa</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Kassa nomi *</label>
            <input
              required
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm font-medium transition-all"
              placeholder="Masalan: Bosh kassa, POS terminal..."
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Turi *</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(TYPE_META).map(([key, meta]) => {
                const Icon = meta.icon;
                return (
                  <button
                    key={key} type="button"
                    onClick={() => setForm(p => ({ ...p, type: key }))}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                      form.type === key
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Izoh (ixtiyoriy)</label>
            <input
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm font-medium transition-all"
              placeholder="Qo'shimcha ma'lumot..."
            />
          </div>

          <button
            type="submit" disabled={saving}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold text-sm hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Kassa yaratish
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Transaction Modal ─────────────────────────────────────────────────────────
function TxModal({ desks, defaultType, onClose, onSave }) {
  const [form, setForm] = useState({
    cashDeskId: desks[0]?._id || '',
    type: defaultType || 'income',
    amount: '',
    category: defaultType === 'expense' ? 'other_expense' : 'payment',
    description: '',
    relatedDeskId: '',
  });
  const [saving, setSaving] = useState(false);

  const isTransfer = form.type === 'transfer_out';

  const handleTypeChange = (type) => {
    setForm(p => ({
      ...p, type,
      category: type === 'income' ? 'payment' : type === 'expense' ? 'other_expense' : 'internal_transfer'
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) return alert('Summa kiritilishi shart');
    setSaving(true);
    try {
      const result = await cashDeskApi.createTransaction({
        ...form,
        amount: Number(form.amount),
        relatedDeskId: form.relatedDeskId || undefined,
      });
      onSave(result);
      onClose();
    } catch (err) {
      alert(err?.response?.data?.message || 'Xatolik');
    } finally {
      setSaving(false);
    }
  };

  const TX_TYPES = [
    { key: 'income',      label: '+ Kirim',    color: 'emerald' },
    { key: 'expense',     label: '- Chiqim',   color: 'red' },
    { key: 'transfer_out',label: '⇄ O\'tkazma', color: 'amber' },
    { key: 'salary_payout',label:'₽ Oylik',    color: 'purple' },
  ];

  const colorMap = {
    emerald: { active: 'border-emerald-500 bg-emerald-50 text-emerald-700', inactive: 'border-gray-200 text-gray-600 hover:border-gray-300' },
    red:     { active: 'border-red-500 bg-red-50 text-red-700', inactive: 'border-gray-200 text-gray-600 hover:border-gray-300' },
    amber:   { active: 'border-amber-500 bg-amber-50 text-amber-700', inactive: 'border-gray-200 text-gray-600 hover:border-gray-300' },
    purple:  { active: 'border-purple-500 bg-purple-50 text-purple-700', inactive: 'border-gray-200 text-gray-600 hover:border-gray-300' },
  };

  const cats = form.type === 'income' ? INCOME_CATEGORIES :
               form.type === 'expense' ? EXPENSE_CATEGORIES :
               form.type === 'salary_payout' ? ['salary'] : ['internal_transfer'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Yangi tranzaksiya</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Type selector */}
          <div className="grid grid-cols-4 gap-1.5">
            {TX_TYPES.map(({ key, label, color }) => (
              <button
                key={key} type="button"
                onClick={() => handleTypeChange(key)}
                className={`py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                  form.type === key ? colorMap[color].active : colorMap[color.split('-')[0] || 'gray']?.inactive || 'border-gray-200 text-gray-600 hover:border-gray-300'
                } ${form.type === key ? colorMap[color].active : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Kassa */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
              {isTransfer ? 'Qaysi kassadan' : 'Kassa'}
            </label>
            <select
              required
              value={form.cashDeskId}
              onChange={e => setForm(p => ({ ...p, cashDeskId: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm font-semibold bg-white transition-all"
            >
              {desks.map(d => (
                <option key={d._id} value={d._id}>
                  {d.name} — {fmt(d.balance)}
                </option>
              ))}
            </select>
          </div>

          {/* Transfer manzil */}
          {isTransfer && (
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Qaysi kassaga</label>
              <select
                required
                value={form.relatedDeskId}
                onChange={e => setForm(p => ({ ...p, relatedDeskId: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm font-semibold bg-white transition-all"
              >
                <option value="">Tanlang...</option>
                {desks.filter(d => d._id !== form.cashDeskId).map(d => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Summa */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Summa (so'm) *</label>
            <input
              required type="number" min="1"
              value={form.amount}
              onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm font-semibold transition-all"
              placeholder="0"
            />
            {form.amount && (
              <p className="text-xs text-gray-400 mt-1">{fmt(form.amount)}</p>
            )}
          </div>

          {/* Kategoriya */}
          {cats.length > 1 && (
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Kategoriya</label>
              <select
                value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm font-semibold bg-white transition-all"
              >
                {cats.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
              </select>
            </div>
          )}

          {/* Izoh */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Izoh (ixtiyoriy)</label>
            <input
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm font-medium transition-all"
              placeholder="Maqsad yoki izoh..."
            />
          </div>

          <button
            type="submit" disabled={saving}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 text-white font-bold text-sm hover:from-blue-700 hover:to-indigo-600 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Tasdiqlash
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Desk Card ────────────────────────────────────────────────────────────────
function DeskCard({ desk, isSelected, onClick }) {
  const meta = TYPE_META[desk.type] || TYPE_META.cash;
  const Icon = meta.icon;

  return (
    <button
      onClick={onClick}
      className={`relative w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 group ${
        isSelected
          ? 'border-blue-500 shadow-lg shadow-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50'
          : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center"
          style={{ background: meta.bg, border: `1.5px solid ${meta.border}` }}
        >
          <Icon className="h-5 w-5" style={{ color: meta.color }} />
        </div>
        {isSelected && (
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
            <CheckCircle className="h-4 w-4 text-white" />
          </div>
        )}
      </div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{meta.label}</p>
      <p className="text-base font-bold text-gray-900 mb-3 truncate">{desk.name}</p>
      <p className="text-2xl font-black" style={{ color: meta.color }}>
        {fmtShort(desk.balance)}
      </p>
      <p className="text-xs text-gray-400 mt-0.5">so'm</p>
      {desk.description && (
        <p className="text-xs text-gray-400 mt-2 truncate">{desk.description}</p>
      )}
    </button>
  );
}

// ─── Transaction Row ──────────────────────────────────────────────────────────
function TxRow({ tx }) {
  const meta = TX_TYPE_META[tx.type] || TX_TYPE_META.income;
  const Icon = meta.icon;
  const isPositive = tx.type === 'income' || tx.type === 'transfer_in';

  return (
    <div className="flex items-center gap-4 py-3.5 px-4 hover:bg-gray-50 rounded-xl transition-colors group">
      <div
        className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
        style={{ background: meta.bg }}
      >
        <Icon className="h-5 w-5" style={{ color: meta.color }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900">{meta.label}</span>
          {tx.category && (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
              {CAT_LABELS[tx.category] || tx.category}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-400 font-medium">
            {tx.cashDeskId?.name || '—'}
          </span>
          {tx.description && (
            <>
              <span className="text-gray-300">·</span>
              <span className="text-xs text-gray-400 truncate">{tx.description}</span>
            </>
          )}
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className={`text-sm font-black ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
          {isPositive ? '+' : '-'}{fmtShort(tx.amount)}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {new Date(tx.createdAt).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

// ─── Main CashDesk Page ───────────────────────────────────────────────────────
export default function CashDesk() {
  const [desks, setDesks]           = useState([]);
  const [transactions, setTxs]      = useState([]);
  const [stats, setStats]           = useState(null);
  const [selectedDesk, setSelected] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [txLoading, setTxLoading]   = useState(false);
  const [showNewDesk, setShowNewDesk] = useState(false);
  const [showTxModal, setShowTxModal] = useState(null); // 'income' | 'expense' | 'transfer_out'
  const [toast, setToast]           = useState(null);
  const [total, setTotal]           = useState(0);

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  // Load kassalar
  const loadDesks = useCallback(async () => {
    try {
      const data = await cashDeskApi.getDesks();
      setDesks(data.desks || []);
      setTotal(data.total || 0);
    } catch {
      showToast('Kassalarni yuklashda xatolik', 'error');
    }
  }, []);

  // Load tranzaksiyalar
  const loadTx = useCallback(async (deskId) => {
    setTxLoading(true);
    try {
      const params = deskId ? { cashDeskId: deskId, limit: 50 } : { limit: 50 };
      const data = await cashDeskApi.getTransactions(params);
      setTxs(data.transactions || []);
    } catch {
      showToast('Tranzaksiyalarni yuklashda xatolik', 'error');
    } finally {
      setTxLoading(false);
    }
  }, []);

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      const data = await cashDeskApi.getStats();
      setStats(data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadDesks(), loadTx(null), loadStats()]);
      setLoading(false);
    })();
  }, [loadDesks, loadTx, loadStats]);

  const handleDeskClick = (desk) => {
    const newSel = selectedDesk?._id === desk._id ? null : desk;
    setSelected(newSel);
    loadTx(newSel?._id || null);
  };

  const handleNewDesk = (desk) => {
    setDesks(p => [...p, desk]);
    setTotal(p => p + (desk.balance || 0));
    showToast(`"${desk.name}" kassasi yaratildi!`);
  };

  const handleNewTx = ({ transaction, newBalance }) => {
    setTxs(p => [transaction, ...p]);
    setDesks(p => p.map(d =>
      d._id === transaction.cashDeskId?._id || d._id === transaction.cashDeskId
        ? { ...d, balance: newBalance }
        : d
    ));
    // Reload for accuracy
    loadDesks();
    loadStats();
    showToast('Tranzaksiya muvaffaqiyatli qo\'shildi!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
          <p className="text-sm font-semibold text-gray-400">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  const thisMonthIncome  = stats?.monthly?.income  || 0;
  const thisMonthExpense = stats?.monthly?.expense  || 0;
  const thisMonthNet     = stats?.monthly?.net      || 0;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Kassa</h1>
          <p className="text-sm text-gray-400 font-medium mt-0.5">
            Pul oqimini nazorat qiling
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { loadDesks(); loadTx(selectedDesk?._id); loadStats(); }}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowNewDesk(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 text-white font-bold text-sm hover:from-blue-700 hover:to-indigo-600 transition-all shadow-lg shadow-blue-200"
          >
            <Plus className="h-4 w-4" />
            Yangi kassa
          </button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Jami balans */}
        <div className="col-span-1 sm:col-span-2 lg:col-span-1 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-5 text-white shadow-xl shadow-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Jami</span>
          </div>
          <p className="text-3xl font-black">{fmtShort(total)}</p>
          <p className="text-sm text-white/70 mt-1">so'm — barcha kassalar</p>
        </div>

        {/* Oylik kirim */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Bu oy kirim</span>
          </div>
          <p className="text-2xl font-black text-emerald-600">+{fmtShort(thisMonthIncome)}</p>
          <p className="text-sm text-gray-400 mt-1">so'm</p>
        </div>

        {/* Oylik chiqim */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <TrendingDown className="h-5 w-5 text-red-500" />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Bu oy chiqim</span>
          </div>
          <p className="text-2xl font-black text-red-500">-{fmtShort(thisMonthExpense)}</p>
          <p className="text-sm text-gray-400 mt-1">so'm</p>
        </div>

        {/* Sof foyda */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${thisMonthNet >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
              {thisMonthNet >= 0
                ? <TrendingUp className="h-5 w-5 text-emerald-500" />
                : <TrendingDown className="h-5 w-5 text-red-500" />
              }
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sof foyda</span>
          </div>
          <p className={`text-2xl font-black ${thisMonthNet >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {thisMonthNet >= 0 ? '+' : '-'}{fmtShort(Math.abs(thisMonthNet))}
          </p>
          <p className="text-sm text-gray-400 mt-1">so'm</p>
        </div>
      </div>

      {/* ── Kassalar ── */}
      {desks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Landmark className="h-8 w-8 text-gray-300" />
          </div>
          <p className="text-base font-bold text-gray-900 mb-1">Kassa yo'q</p>
          <p className="text-sm text-gray-400 mb-5">Birinchi kassangizni yarating</p>
          <button
            onClick={() => setShowNewDesk(true)}
            className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors"
          >
            Yangi kassa
          </button>
        </div>
      ) : (
        <>
          <div>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
              Kassalar ({desks.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {desks.map(desk => (
                <DeskCard
                  key={desk._id}
                  desk={desk}
                  isSelected={selectedDesk?._id === desk._id}
                  onClick={() => handleDeskClick(desk)}
                />
              ))}
            </div>
          </div>

          {/* ── Tezkor amallar ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">
                Tezkor amallar
                {selectedDesk && (
                  <span className="ml-2 text-sm text-gray-400 font-medium">— {selectedDesk.name}</span>
                )}
              </h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setShowTxModal('income')}
                  className="flex flex-col items-center gap-2 py-5 px-3 rounded-2xl bg-emerald-50 border-2 border-emerald-100 hover:border-emerald-300 hover:bg-emerald-100 transition-all group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform">
                    <ArrowDownCircle className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-sm font-bold text-emerald-700">Kirim</span>
                </button>

                <button
                  onClick={() => setShowTxModal('expense')}
                  className="flex flex-col items-center gap-2 py-5 px-3 rounded-2xl bg-red-50 border-2 border-red-100 hover:border-red-300 hover:bg-red-100 transition-all group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-red-500 flex items-center justify-center shadow-lg shadow-red-200 group-hover:scale-110 transition-transform">
                    <ArrowUpCircle className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-sm font-bold text-red-600">Chiqim</span>
                </button>

                <button
                  onClick={() => setShowTxModal('transfer_out')}
                  disabled={desks.length < 2}
                  className="flex flex-col items-center gap-2 py-5 px-3 rounded-2xl bg-amber-50 border-2 border-amber-100 hover:border-amber-300 hover:bg-amber-100 transition-all group disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-200 group-hover:scale-110 transition-transform">
                    <ArrowLeftRight className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-sm font-bold text-amber-700">O'tkazma</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── Tranzaksiyalar ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">
                So'nggi tranzaksiyalar
                {selectedDesk && (
                  <span className="ml-2 text-sm text-gray-400 font-medium">— {selectedDesk.name}</span>
                )}
              </h2>
              {selectedDesk && (
                <button
                  onClick={() => { setSelected(null); loadTx(null); }}
                  className="text-xs text-blue-500 font-bold hover:underline flex items-center gap-1"
                >
                  <Eye className="h-3 w-3" />
                  Barchasi
                </button>
              )}
            </div>

            <div className="divide-y divide-gray-50">
              {txLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-8 w-8 text-gray-200 mb-3" />
                  <p className="text-sm font-semibold text-gray-400">Tranzaksiyalar yo'q</p>
                </div>
              ) : (
                <div className="p-2">
                  {transactions.map(tx => (
                    <TxRow key={tx._id} tx={tx} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Modals ── */}
      {showNewDesk && (
        <NewDeskModal onClose={() => setShowNewDesk(false)} onSave={handleNewDesk} />
      )}
      {showTxModal && (
        <TxModal
          desks={desks}
          defaultType={showTxModal}
          onClose={() => setShowTxModal(null)}
          onSave={handleNewTx}
        />
      )}

      {/* ── Toast ── */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
