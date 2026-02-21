import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, Calendar, Clock, TrendingUp,
    ArrowUpRight, ArrowDownRight, RefreshCw,
    UserCheck, Activity, DollarSign, Stethoscope,
    CheckCircle2, XCircle, Timer, ChevronRight,
    BarChart3, Eye
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import http from '../lib/http';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';

// ─── Formatters ─────────────────────────────────────────────────────────────
const fmt = (n) => Number(n || 0).toLocaleString('uz-UZ');
const fmtTime = (d) => {
    if (!d) return '--:--';
    return new Date(d).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
};
const fmtDate = (d) => {
    if (!d) return '---';
    return new Date(d).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short' });
};

// ─── Status Badge ────────────────────────────────────────────────────────────
function StatusPill({ status }) {
    const map = {
        done: { label: 'Yakunlandi', bg: '#E8F5E9', color: '#2E7D32', dot: '#4CAF50' },
        completed: { label: 'Yakunlandi', bg: '#E8F5E9', color: '#2E7D32', dot: '#4CAF50' },
        progress: { label: 'Qabulda', bg: '#E3F2FD', color: '#1565C0', dot: '#2196F3' },
        in_progress: { label: 'Qabulda', bg: '#E3F2FD', color: '#1565C0', dot: '#2196F3' },
        pending: { label: 'Kutilmoqda', bg: '#FFF8E1', color: '#F57F17', dot: '#FFC107' },
        scheduled: { label: 'Kutilmoqda', bg: '#FFF8E1', color: '#F57F17', dot: '#FFC107' },
        waiting: { label: 'Kutilmoqda', bg: '#FFF8E1', color: '#F57F17', dot: '#FFC107' },
        cancelled: { label: 'Bekor qilindi', bg: '#FFEBEE', color: '#C62828', dot: '#F44336' },
    };
    const cfg = map[status?.toLowerCase()] || { label: status || '---', bg: '#F5F5F5', color: '#616161', dot: '#9E9E9E' };
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: cfg.bg, color: cfg.color,
            padding: '4px 12px', borderRadius: 20,
            fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap'
        }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
            {cfg.label}
        </span>
    );
}

// ─── Avatar initials ─────────────────────────────────────────────────────────
function AvatarInitials({ name, size = 36, bg = '#E3F2FD', color = '#1565C0' }) {
    const initials = (name || 'N').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%',
            background: bg, color, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontWeight: 800, fontSize: size * 0.35,
            flexShrink: 0, border: '2px solid rgba(255,255,255,0.8)'
        }}>
            {initials}
        </div>
    );
}

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, trend, trendPositive, accent }) {
    const colors = {
        blue: { bg: '#EFF6FF', icon: '#3B82F6', card: '#ffffff' },
        green: { bg: '#F0FDF4', icon: '#22C55E', card: '#ffffff' },
        amber: { bg: '#FFFBEB', icon: '#F59E0B', card: '#ffffff' },
        purple: { bg: '#F5F3FF', icon: '#A855F7', card: '#ffffff' },
    };
    const c = colors[accent] || colors.blue;

    return (
        <div style={{
            background: c.card,
            borderRadius: 20,
            padding: '24px 20px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            border: '1px solid rgba(0,0,0,0.04)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            textAlign: 'center', gap: 8,
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'default',
        }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}
        >
            <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: c.bg, display: 'flex', alignItems: 'center',
                justifyContent: 'center', marginBottom: 4
            }}>
                {React.cloneElement(icon, { size: 24, color: c.icon })}
            </div>
            <div style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, letterSpacing: 0.2 }}>{label}</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: '#0F172A', lineHeight: 1.1, fontFamily: 'Outfit, sans-serif' }}>
                {value}
            </div>
            {sub && (
                <div style={{
                    fontSize: 12, fontWeight: 700, padding: '3px 12px',
                    borderRadius: 20, background: c.bg, color: c.icon
                }}>{sub}</div>
            )}
            {trend != null && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 12, fontWeight: 700,
                    color: trendPositive ? '#16A34A' : '#DC2626',
                    background: trendPositive ? '#F0FDF4' : '#FFF1F2',
                    padding: '3px 10px', borderRadius: 20
                }}>
                    {trendPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                    {trend}
                </div>
            )}
        </div>
    );
}

// ─── Progress Bar (Doctor Busyness) ─────────────────────────────────────────
function DoctorBar({ name, specialty, percent, count }) {
    const pct = Math.min(percent, 100);
    const colorMap = pct >= 80 ? '#EF4444' : pct >= 50 ? '#3B82F6' : '#22C55E';
    const bgMap = pct >= 80 ? '#FEF2F2' : pct >= 50 ? '#EFF6FF' : '#F0FDF4';

    return (
        <div style={{ padding: '14px 16px', background: '#FAFBFC', borderRadius: 14, border: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#1E293B' }}>Dr. {name}</div>
                    {specialty && <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>{specialty}</div>}
                </div>
                <div style={{
                    background: bgMap, color: colorMap,
                    fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 20
                }}>{count} ta / {pct}%</div>
            </div>
            <div style={{ height: 7, background: '#E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                    height: '100%', width: `${pct}%`, background: colorMap,
                    borderRadius: 4, transition: 'width 1s ease'
                }} />
            </div>
        </div>
    );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: '#fff', borderRadius: 12, padding: '10px 16px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)', border: '1px solid #F1F5F9'
        }}>
            <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4, fontWeight: 600 }}>{label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
                {payload[0].value} <span style={{ fontSize: 12, fontWeight: 500, color: '#94A3B8' }}>qabul</span>
            </div>
        </div>
    );
}

// ─── Avatar colors ────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
    { bg: '#DBEAFE', color: '#1D4ED8' },
    { bg: '#FCE7F3', color: '#9D174D' },
    { bg: '#D1FAE5', color: '#065F46' },
    { bg: '#FEF3C7', color: '#92400E' },
    { bg: '#EDE9FE', color: '#5B21B6' },
];

// ─── Main Dashboard Component ────────────────────────────────────────────────
export default function HippoDashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({
        todayPatients: 0, todayAppts: 0, todayDone: 0,
        todayPending: 0, revenue: 0,
        chartData: [], doctors: [], todayList: [],
        patientsTrend: '+0%', revenueTrend: '+0%',
    });

    const load = useCallback(async (isRefresh = false) => {
        try {
            isRefresh ? setRefreshing(true) : setLoading(true);

            const [p, a, d, py] = await Promise.all([
                http.get('/patients?limit=1000').catch(() => ({})),
                http.get('/appointments?limit=1000').catch(() => ({})),
                http.get('/doctors').catch(() => ({})),
                http.get('/payments?limit=1000').catch(() => ({})),
            ]);

            const pItems = Array.isArray(p?.items) ? p.items : (Array.isArray(p) ? p : []);
            const aItems = Array.isArray(a?.items) ? a.items : (Array.isArray(a) ? a : []);
            const dItems = Array.isArray(d?.items) ? d.items : (Array.isArray(d) ? d : []);
            const pyItems = Array.isArray(py?.items) ? py.items : (Array.isArray(py) ? py : []);

            const now = new Date();
            const today = now.toISOString().split('T')[0];
            const isToday = (val) => !!val && new Date(val).toISOString().split('T')[0] === today;
            const dateOf = (x) => x.startsAt || x.startAt || x.appointmentDate || x.createdAt;

            const todayAppts = aItems.filter(x => isToday(dateOf(x)));
            const todayDone = todayAppts.filter(x => ['done', 'completed'].includes(x.status?.toLowerCase())).length;
            const todayPending = todayAppts.filter(x => ['pending', 'scheduled', 'waiting'].includes((x.status || 'pending').toLowerCase())).length;
            const todayPatients = pItems.filter(x => isToday(x.createdAt)).length;
            const revenue = pyItems.filter(x => isToday(x.createdAt)).reduce((s, x) => s + Number(x.amount || 0), 0);

            // Yesterday trend for patients
            const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
            const yStr = yesterday.toISOString().split('T')[0];
            const yPatients = pItems.filter(x => new Date(x.createdAt).toISOString().split('T')[0] === yStr).length;
            const pTrend = yPatients > 0 ? Math.round(((todayPatients - yPatients) / yPatients) * 100) : 0;

            // 30-day chart
            const chartData = [];
            for (let i = 29; i >= 0; i--) {
                const d2 = new Date(now); d2.setDate(d2.getDate() - i);
                const ds = d2.toISOString().split('T')[0];
                const dayN = d2.toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short' });
                const cnt = aItems.filter(x => {
                    const v = dateOf(x);
                    return v && new Date(v).toISOString().split('T')[0] === ds;
                }).length;
                chartData.push({ name: dayN, value: cnt, shortName: d2.toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short' }) });
            }

            // Doctor busyness
            const doctors = dItems.map(doc => {
                const docAppts = aItems.filter(x =>
                    (x.doctorId === doc._id || x.doctor?._id === doc._id) && isToday(dateOf(x))
                );
                return {
                    ...doc,
                    todayCount: docAppts.length,
                    busyPct: Math.min(Math.round((docAppts.length / 8) * 100), 100),
                };
            }).sort((a, b) => b.busyPct - a.busyPct).slice(0, 5);

            // Today's list sorted by time
            const todayList = todayAppts
                .sort((a, b) => new Date(dateOf(a)) - new Date(dateOf(b)))
                .slice(0, 8);

            setStats({
                todayPatients, todayAppts: todayAppts.length, todayDone,
                todayPending, revenue, chartData, doctors, todayList,
                patientsTrend: `${pTrend >= 0 ? '+' : ''}${pTrend}%`,
                revenueTrend: '+0%',
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    if (loading) {
        return (
            <div style={{
                minHeight: '80vh', display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexDirection: 'column', gap: 16
            }}>
                <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    border: '4px solid #EFF6FF', borderTopColor: '#3B82F6',
                    animation: 'spin 0.8s linear infinite'
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <div style={{ fontSize: 15, color: '#94A3B8', fontWeight: 600 }}>Ma'lumotlar yuklanmoqda...</div>
            </div>
        );
    }

    // Last 7 days for the area chart display
    const displayChart = stats.chartData.slice(-7);

    return (
        <div style={{ fontFamily: "'Outfit', 'Inter', sans-serif", color: '#0F172A', paddingBottom: 40 }} className="dash-root">

            {/* ── Page Header ──────────────────────────────────────────────────── */}
            <div className="dash-header">
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: -0.5 }}>
                        Boshqaruv paneli
                    </h1>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B', fontWeight: 500 }} className="dash-date">
                        {new Date().toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                        onClick={() => load(true)}
                        disabled={refreshing}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '9px 14px', borderRadius: 12, border: '1.5px solid #E2E8F0',
                            background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13,
                            color: '#64748B', transition: 'all 0.2s',
                        }}
                    >
                        <RefreshCw size={15} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
                        <span className="dash-btn-text">Yangilash</span>
                    </button>
                    <button
                        onClick={() => navigate('/appointments')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '9px 16px', borderRadius: 12, border: 'none',
                            background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                            color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 13,
                            boxShadow: '0 4px 14px rgba(59,130,246,0.4)',
                        }}
                    >
                        <Calendar size={15} />
                        <span className="dash-btn-text">Yangi qabul</span>
                    </button>
                </div>
            </div>

            {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
            <div className="kpi-grid" style={{ marginBottom: 28 }}>
                <KpiCard
                    icon={<Users />}
                    label="Bugungi bemorlar"
                    value={stats.todayPatients}
                    trend={stats.patientsTrend}
                    trendPositive={!stats.patientsTrend.startsWith('-')}
                    accent="blue"
                />
                <KpiCard
                    icon={<Calendar />}
                    label="Qabullar"
                    value={stats.todayAppts}
                    sub={`${stats.todayDone} tasi yakunlandi`}
                    accent="green"
                />
                <KpiCard
                    icon={<Clock />}
                    label="Kutilmoxda"
                    value={stats.todayPending}
                    sub="O'rtacha kutish: 12 daq"
                    accent="amber"
                />
                <KpiCard
                    icon={<TrendingUp />}
                    label="Bugungi tushum"
                    value={`${fmt(stats.revenue)}`}
                    sub="so'm"
                    accent="purple"
                />
            </div>

            {/* ── Main Grid ─────────────────────────────────────────────────────── */}
            <div className="dash-main-grid">

                {/* LEFT COLUMN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                    {/* Chart Card */}
                    <div style={{
                        background: '#fff', borderRadius: 20, padding: '28px 28px 20px',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <div>
                                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                                    Tashriflar dinamikasi
                                </h3>
                                <p style={{ fontSize: 12, color: '#94A3B8', margin: '4px 0 0', fontWeight: 500 }}>
                                    So'nggi 7 kun
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/reports')}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    fontSize: 13, fontWeight: 600, color: '#3B82F6',
                                    background: '#EFF6FF', border: 'none', borderRadius: 10,
                                    padding: '7px 14px', cursor: 'pointer'
                                }}
                            >
                                <BarChart3 size={14} /> Hisobot
                            </button>
                        </div>
                        <div style={{ height: 240 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={displayChart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.18} />
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false} tickLine={false}
                                        tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 600 }}
                                        dy={8}
                                    />
                                    <YAxis
                                        axisLine={false} tickLine={false}
                                        tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 600 }}
                                        allowDecimals={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area
                                        type="monotone" dataKey="value"
                                        stroke="#3B82F6" strokeWidth={3}
                                        fill="url(#grad1)"
                                        activeDot={{ r: 6, strokeWidth: 3, stroke: '#fff', fill: '#3B82F6' }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Today Appointments Table */}
                    <div style={{
                        background: '#fff', borderRadius: 20, padding: '24px 28px',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <div>
                                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                                    Bugungi qabul ro'yxati
                                </h3>
                                <p style={{ fontSize: 12, color: '#94A3B8', margin: '4px 0 0', fontWeight: 500 }}>
                                    Jami {stats.todayAppts} ta qabul
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/appointments')}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    fontSize: 13, fontWeight: 600, color: '#3B82F6',
                                    background: '#EFF6FF', border: 'none', borderRadius: 10,
                                    padding: '7px 14px', cursor: 'pointer'
                                }}
                            >
                                <Eye size={14} /> Barchasi
                            </button>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px' }}>
                                <thead>
                                    <tr>
                                        {['Vaqt', 'Bemor', 'Shifokor', 'Xizmat', 'Status'].map(h => (
                                            <th key={h} style={{
                                                textAlign: 'left', padding: '8px 12px',
                                                fontSize: 11, fontWeight: 700, color: '#94A3B8',
                                                textTransform: 'uppercase', letterSpacing: 0.8,
                                                borderBottom: '2px solid #F8FAFC'
                                            }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.todayList.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} style={{ textAlign: 'center', padding: '32px 0', color: '#CBD5E1', fontSize: 14, fontWeight: 600 }}>
                                                Bugun hozircha qabullar yo'q
                                            </td>
                                        </tr>
                                    ) : stats.todayList.map((appt, i) => {
                                        const ac = AVATAR_COLORS[i % AVATAR_COLORS.length];
                                        const patientName = appt.patient?.name || appt.patientName || 'Noma\'lum';
                                        const doctorName = appt.doctor?.name || appt.doctorName || '---';
                                        const service = appt.service?.name || appt.serviceName || '---';
                                        return (
                                            <tr key={appt._id || i}
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => navigate('/appointments')}
                                                onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <td style={{ padding: '12px 12px', fontSize: 13, fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>
                                                    {fmtTime(appt.startsAt || appt.startAt || appt.appointmentDate || appt.createdAt)}
                                                </td>
                                                <td style={{ padding: '12px 12px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <AvatarInitials name={patientName} size={34} bg={ac.bg} color={ac.color} />
                                                        <span style={{ fontWeight: 700, fontSize: 14, color: '#1E293B' }}>{patientName}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px 12px', fontSize: 13, color: '#64748B', fontWeight: 600 }}>
                                                    {doctorName !== '---' ? `Dr. ${doctorName}` : '---'}
                                                </td>
                                                <td style={{ padding: '12px 12px', fontSize: 13, color: '#64748B', fontWeight: 500, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {service}
                                                </td>
                                                <td style={{ padding: '12px 12px' }}>
                                                    <StatusPill status={appt.status} />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                    {/* Band doktorlar */}
                    <div style={{
                        background: '#fff', borderRadius: 20, padding: '24px 20px',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Band doktorlar</h3>
                            <button
                                onClick={() => navigate('/doctors')}
                                style={{
                                    fontSize: 12, color: '#3B82F6', background: 'none',
                                    border: 'none', cursor: 'pointer', fontWeight: 700,
                                    display: 'flex', alignItems: 'center', gap: 4
                                }}
                            >
                                Barchasi <ChevronRight size={13} />
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {stats.doctors.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '24px 0', color: '#CBD5E1', fontSize: 13, fontWeight: 600 }}>
                                    Bugun band doktorlar yo'q
                                </div>
                            ) : stats.doctors.map((doc, i) => (
                                <DoctorBar
                                    key={doc._id || i}
                                    name={doc.name || doc.fullName || 'Shifokor'}
                                    specialty={doc.specialty || doc.department?.name}
                                    percent={doc.busyPct}
                                    count={doc.todayCount}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Status Summary */}
                    <div style={{
                        background: '#fff', borderRadius: 20, padding: '24px 20px',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)'
                    }}>
                        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: '0 0 16px' }}>
                            Holat xulosasi
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {[
                                { label: 'Yakunlandi', count: stats.todayDone, status: 'done', icon: <CheckCircle2 size={16} color="#22C55E" /> },
                                { label: 'Kutilmoqda', count: stats.todayPending, status: 'pending', icon: <Timer size={16} color="#F59E0B" /> },
                                { label: 'Qabulda', count: stats.todayAppts - stats.todayDone - stats.todayPending, status: 'progress', icon: <Activity size={16} color="#3B82F6" /> },
                                { label: 'Bekor qilindi', count: stats.todayList.filter(x => x.status?.toLowerCase() === 'cancelled').length, status: 'cancelled', icon: <XCircle size={16} color="#EF4444" /> },
                            ].map((item, i) => (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '10px 14px', borderRadius: 12, background: '#FAFBFC',
                                    border: '1px solid #F1F5F9'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        {item.icon}
                                        <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{item.label}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontSize: 16, fontWeight: 800, color: '#1E293B' }}>{Math.max(0, item.count)}</span>
                                        <StatusPill status={item.status} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div style={{
                        background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                        borderRadius: 20, padding: '22px 20px',
                        boxShadow: '0 8px 24px rgba(59,130,246,0.35)'
                    }}>
                        <h3 style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: '0 0 16px' }}>
                            Tezkor harakatlar
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {[
                                { label: '+ Yangi bemor qo\'shish', icon: <Users size={15} />, path: '/patients' },
                                { label: '+ Yangi qabul yaratish', icon: <Calendar size={15} />, path: '/appointments' },
                                { label: '💊 Navbat boshqaruvi', icon: <Stethoscope size={15} />, path: '/queue' },
                                { label: '📊 Hisobotlar', icon: <BarChart3 size={15} />, path: '/reports' },
                            ].map((item, i) => (
                                <button
                                    key={i}
                                    onClick={() => navigate(item.path)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        width: '100%', padding: '11px 14px',
                                        background: 'rgba(255,255,255,0.15)',
                                        border: '1px solid rgba(255,255,255,0.25)',
                                        borderRadius: 12, cursor: 'pointer',
                                        color: '#fff', fontSize: 13, fontWeight: 700,
                                        transition: 'background 0.2s',
                                        backdropFilter: 'blur(4px)',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                                >
                                    {item.icon} {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                </div>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .kpi-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 16px;
                }
                .dash-main-grid {
                    display: grid;
                    grid-template-columns: 1fr 320px;
                    gap: 24px;
                }
                .dash-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                    flex-wrap: wrap;
                    gap: 12px;
                }
                @media (max-width: 1100px) {
                    .dash-main-grid { grid-template-columns: 1fr !important; }
                }
                @media (max-width: 900px) {
                    .kpi-grid { grid-template-columns: repeat(2, 1fr) !important; }
                }
                @media (max-width: 480px) {
                    .kpi-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
                    .dash-date { display: none; }
                    .dash-btn-text { display: none; }
                }
            `}</style>
        </div>
    );
}
