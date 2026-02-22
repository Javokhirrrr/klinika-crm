// Kiosk — Bemor telefoni yoki klinika ekranidan navbatga yozilish
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import http from '../lib/http';

export default function KioskPage() {
    const [params] = useSearchParams();
    const orgId = params.get('orgId') || '';

    const [step, setStep] = useState('search');  // search | confirm | done
    const [query, setQuery] = useState('');
    const [patients, setPatients] = useState([]);
    const [selected, setSelected] = useState(null);
    const [doctors, setDoctors] = useState([]);
    const [doctorId, setDoctorId] = useState('');
    const [priority, setPriority] = useState('normal');
    const [queueNum, setQueueNum] = useState(null);
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(30);

    // Qidiruv
    useEffect(() => {
        if (query.length < 2) { setPatients([]); return; }
        const t = setTimeout(async () => {
            try {
                const res = await http.get('/patients', { params: { q: query, limit: 8 } });
                setPatients(res?.items || []);
            } catch { setPatients([]); }
        }, 400);
        return () => clearTimeout(t);
    }, [query]);

    // Shifokorlar
    useEffect(() => {
        http.get('/doctors', { params: { limit: 100 } })
            .then(res => setDoctors(res?.doctors || res?.items || []))
            .catch(() => { });
    }, []);

    // Done bosqichida 30 soniya countdown
    useEffect(() => {
        if (step !== 'done') return;
        setTimer(30);
        const iv = setInterval(() => {
            setTimer(t => {
                if (t <= 1) {
                    clearInterval(iv);
                    reset();
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(iv);
    }, [step]);

    const reset = () => {
        setStep('search'); setQuery(''); setPatients([]);
        setSelected(null); setDoctorId(''); setPriority('normal'); setQueueNum(null);
    };

    const joinQueue = async () => {
        if (!selected) return;
        setLoading(true);
        try {
            const res = await http.post('/queue/join', {
                patientId: selected._id,
                doctorId: doctorId || undefined,
                priority,
            });
            setQueueNum(res?.queueEntry?.queueNumber || '—');
            setStep('done');
        } catch (e) {
            alert(e?.response?.data?.message || 'Xatolik, qayta urinib ko\'ring');
        } finally {
            setLoading(false);
        }
    };

    // ─── Styles ───────────────────────────────────────────────────────────────
    const s = {
        page: {
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
            fontFamily: "'Inter', system-ui, sans-serif", padding: 20,
        },
        card: {
            background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 28, padding: '40px 36px',
            width: '100%', maxWidth: 500, color: '#fff',
        },
        title: { fontSize: 28, fontWeight: 900, textAlign: 'center', marginBottom: 6 },
        sub: { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: 28 },
        input: {
            width: '100%', padding: '14px 18px', borderRadius: 14,
            border: '2px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.1)', color: '#fff',
            fontSize: 16, outline: 'none', fontFamily: 'inherit',
            boxSizing: 'border-box',
        },
        resultItem: (active) => ({
            padding: '14px 18px', borderRadius: 12, cursor: 'pointer',
            background: active ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)',
            border: `1px solid ${active ? '#6366f1' : 'transparent'}`,
            marginBottom: 6, transition: 'all 0.15s',
        }),
        btn: (color) => ({
            width: '100%', padding: '16px', borderRadius: 14, border: 'none',
            background: color, color: '#fff', fontWeight: 800, fontSize: 16,
            cursor: 'pointer', fontFamily: 'inherit', marginTop: 8,
        }),
        select: {
            width: '100%', padding: '14px 18px', borderRadius: 14,
            border: '2px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.1)', color: '#fff',
            fontSize: 15, fontFamily: 'inherit', outline: 'none',
            boxSizing: 'border-box', marginBottom: 14,
        },
    };

    const PRIORITY_opts = [
        { value: 'normal', label: '🟢 Oddiy navbat' },
        { value: 'urgent', label: '⚡ Shoshilinch' },
        { value: 'emergency', label: '🚨 Favqulodda' },
    ];

    // ─── Step: Done ─────────────────────────────────────────────────────────
    if (step === 'done') return (
        <div style={s.page}>
            <div style={{ ...s.card, textAlign: 'center' }}>
                <div style={{ fontSize: 72, marginBottom: 16 }}>🎟️</div>
                <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
                    Navbat raqamingiz:
                </div>
                <div style={{
                    fontSize: 80, fontWeight: 900, color: '#a5f3fc',
                    lineHeight: 1, marginBottom: 16,
                }}>
                    {queueNum}
                </div>
                <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', marginBottom: 8, lineHeight: 1.6 }}>
                    Siz navbatga yozildingiz!<br />
                    Chaqirilishingizni kuting.
                </div>
                {selected && (
                    <div style={{
                        background: 'rgba(255,255,255,0.08)', borderRadius: 12,
                        padding: '14px 18px', marginBottom: 24, fontSize: 14,
                        color: 'rgba(255,255,255,0.8)',
                    }}>
                        <div>👤 {selected.firstName} {selected.lastName}</div>
                        {selected.phone && <div>📞 {selected.phone}</div>}
                    </div>
                )}
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>
                    {timer} soniyada avtomatik yangilanadi
                </div>
                <button onClick={reset} style={s.btn('linear-gradient(135deg,#6366f1,#8b5cf6)')}>
                    🔄 Yangi navbat
                </button>
            </div>
        </div>
    );

    // ─── Step: Confirm ───────────────────────────────────────────────────────
    if (step === 'confirm') return (
        <div style={s.page}>
            <div style={s.card}>
                <div style={s.title}>✅ Tasdiqlash</div>
                <div style={s.sub}>Ma'lumotlarni tekshiring</div>

                {selected && (
                    <div style={{
                        background: 'rgba(255,255,255,0.1)', borderRadius: 14,
                        padding: '16px 18px', marginBottom: 20,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                                width: 48, height: 48, borderRadius: 12,
                                background: '#6366f1', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', fontWeight: 900, fontSize: 20, flexShrink: 0,
                            }}>
                                {(selected.firstName?.[0] || '?').toUpperCase()}
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 16 }}>
                                    {selected.firstName} {selected.lastName}
                                </div>
                                {selected.phone && (
                                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                                        📞 {selected.phone}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Shifokor */}
                <div style={{ marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                    👨‍⚕️ Shifokor (ixtiyoriy)
                </div>
                <select style={s.select} value={doctorId}
                    onChange={e => setDoctorId(e.target.value)}>
                    <option value="">— Shifokorni tanlang —</option>
                    {doctors.map(d => (
                        <option key={d._id} value={d._id}>
                            Dr. {d.firstName} {d.lastName}
                        </option>
                    ))}
                </select>

                {/* Priority */}
                <div style={{ marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                    ⚡ Holat
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                    {PRIORITY_opts.map(o => (
                        <button key={o.value}
                            onClick={() => setPriority(o.value)}
                            style={{
                                flex: 1, padding: '10px 6px', borderRadius: 12, cursor: 'pointer',
                                border: priority === o.value ? '2px solid #a5f3fc' : '2px solid rgba(255,255,255,0.15)',
                                background: priority === o.value ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.05)',
                                color: '#fff', fontWeight: 700, fontSize: 12, fontFamily: 'inherit',
                            }}>
                            {o.label}
                        </button>
                    ))}
                </div>

                <button onClick={joinQueue} disabled={loading}
                    style={s.btn(loading ? '#475569' : 'linear-gradient(135deg,#10b981,#059669)')}>
                    {loading ? '⏳ Yuklanmoqda...' : '✅ Navbatga yozilish'}
                </button>
                <button onClick={() => setStep('search')}
                    style={{ ...s.btn('rgba(255,255,255,0.1)'), marginTop: 8 }}>
                    ← Orqaga
                </button>
            </div>
        </div>
    );

    // ─── Step: Search ────────────────────────────────────────────────────────
    return (
        <div style={s.page}>
            <div style={s.card}>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <div style={{ fontSize: 52 }}>🏥</div>
                    <div style={s.title}>Navbat Olish</div>
                    <div style={s.sub}>Ism yoki telefon raqam bilan qidiring</div>
                </div>

                <input
                    style={s.input}
                    placeholder="Ism, familiya yoki telefon..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    autoFocus
                />

                {patients.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                        {patients.map(p => (
                            <div
                                key={p._id}
                                style={s.resultItem(selected?._id === p._id)}
                                onClick={() => { setSelected(p); setStep('confirm'); }}
                            >
                                <div style={{ fontWeight: 700, fontSize: 15 }}>
                                    {p.firstName} {p.lastName}
                                </div>
                                {p.phone && (
                                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>
                                        📞 {p.phone}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {query.length >= 2 && patients.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.5)' }}>
                        <div style={{ fontSize: 40, marginBottom: 8 }}>🔍</div>
                        <div>"{query}" topilmadi</div>
                        <div style={{ fontSize: 12, marginTop: 6 }}>
                            Avval registraturaga murojaat qiling
                        </div>
                    </div>
                )}

                {query.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
                        Qidiruv boshlanishini kuting...
                    </div>
                )}
            </div>
        </div>
    );
}
