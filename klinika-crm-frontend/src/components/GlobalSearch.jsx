import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, User, CreditCard, Phone } from 'lucide-react';
import http from '../lib/http';

/**
 * GlobalSearch — Header da joylashgan global qidiruv
 * FISH, telefon, karta raqami bo'yicha qidiradi
 */
export default function GlobalSearch() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);
    const containerRef = useRef(null);
    const timerRef = useRef(null);
    const navigate = useNavigate();

    // Ctrl+K yoki / bilan ochish
    useEffect(() => {
        const onKey = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setOpen(o => !o);
            }
            if (e.key === 'Escape') {
                setOpen(false);
                setQuery('');
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    // Ochilganda focus
    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 50);
    }, [open]);

    // Tashqari bosganda yopish
    useEffect(() => {
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Debounced search
    const search = useCallback((q) => {
        clearTimeout(timerRef.current);
        if (!q || q.length < 2) { setResults([]); setLoading(false); return; }
        setLoading(true);
        timerRef.current = setTimeout(async () => {
            try {
                const res = await http.get('/patients', { params: { q, limit: 8 } });
                setResults(res?.items || []);
            } catch {
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 300);
    }, []);

    const handleChange = (e) => {
        const q = e.target.value;
        setQuery(q);
        search(q);
    };

    const handleSelect = (patient) => {
        navigate(`/patients/${patient._id}`);
        setOpen(false);
        setQuery('');
        setResults([]);
    };

    const clear = () => { setQuery(''); setResults([]); inputRef.current?.focus(); };

    return (
        <div ref={containerRef} style={{ position: 'relative' }}>
            {/* Trigger button */}
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '7px 14px',
                    background: '#f8fafc',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: 12,
                    cursor: 'pointer',
                    color: '#94a3b8',
                    fontSize: 13,
                    fontFamily: 'inherit',
                    transition: 'all 0.15s',
                    minWidth: 200,
                    justifyContent: 'space-between',
                }}
                title="Qidirish (Ctrl+K)"
            >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Search size={14} />
                    Qidirish...
                </span>
                <span style={{
                    background: '#e2e8f0', color: '#64748b',
                    fontSize: 11, fontWeight: 700,
                    padding: '1px 6px', borderRadius: 5, letterSpacing: 0.5,
                }}>⌘K</span>
            </button>

            {/* Dropdown */}
            {open && (
                <div style={{
                    position: 'fixed',
                    top: 60, left: '50%', transform: 'translateX(-50%)',
                    width: 520, maxWidth: '95vw',
                    background: '#fff',
                    borderRadius: 20,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
                    border: '1px solid #e2e8f0',
                    zIndex: 9999,
                    overflow: 'hidden',
                    animation: 'gsSlideDown 0.15s ease',
                }}>
                    {/* Input */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '14px 18px',
                        borderBottom: '1px solid #f1f5f9',
                    }}>
                        <Search size={18} color="#6366f1" />
                        <input
                            ref={inputRef}
                            value={query}
                            onChange={handleChange}
                            placeholder="FISH, telefon, karta raqami..."
                            style={{
                                flex: 1, border: 'none', outline: 'none',
                                fontSize: 15, color: '#0f172a',
                                fontFamily: 'inherit', background: 'transparent',
                            }}
                        />
                        {query && (
                            <button onClick={clear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Results */}
                    <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                        {loading && (
                            <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontSize: 13 }}>
                                <div style={{
                                    width: 24, height: 24, border: '2px solid #e2e8f0',
                                    borderTopColor: '#6366f1', borderRadius: '50%',
                                    animation: 'spin 0.7s linear infinite', margin: '0 auto 8px',
                                }} />
                                Qidirilmoqda...
                            </div>
                        )}

                        {!loading && query.length >= 2 && results.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
                                <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                                <div style={{ fontSize: 14, fontWeight: 600 }}>"{query}" topilmadi</div>
                                <div style={{ fontSize: 12, marginTop: 4 }}>FISH, telefon yoki karta raqami bilan qidiring</div>
                            </div>
                        )}

                        {!loading && results.map((p, i) => {
                            const name = [p.firstName, p.lastName].filter(Boolean).join(' ');
                            const initials = (p.firstName?.[0] || '?').toUpperCase();
                            const age = p.dob || p.birthDate
                                ? (new Date().getFullYear() - new Date(p.dob || p.birthDate).getFullYear()) + ' yosh'
                                : '';
                            return (
                                <button
                                    key={p._id}
                                    onClick={() => handleSelect(p)}
                                    style={{
                                        width: '100%', display: 'flex', alignItems: 'center',
                                        gap: 14, padding: '12px 18px',
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        fontFamily: 'inherit', textAlign: 'left',
                                        borderBottom: i < results.length - 1 ? '1px solid #f8fafc' : 'none',
                                        transition: 'background 0.1s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#f8faff'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                >
                                    {/* Avatar */}
                                    <div style={{
                                        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                                        background: p.gender === 'female' ? '#fce7f3' : '#dbeafe',
                                        color: p.gender === 'female' ? '#db2777' : '#2563eb',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 800, fontSize: 16,
                                    }}>
                                        {initials}
                                    </div>

                                    {/* Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{name}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2, flexWrap: 'wrap' }}>
                                            {p.phone && (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: '#64748b' }}>
                                                    <Phone size={11} /> {p.phone}
                                                </span>
                                            )}
                                            {p.cardNo && (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: '#6366f1', fontFamily: 'monospace', fontWeight: 700 }}>
                                                    <CreditCard size={11} /> {p.cardNo}
                                                </span>
                                            )}
                                            {age && (
                                                <span style={{ fontSize: 12, color: '#94a3b8' }}>{age}</span>
                                            )}
                                        </div>
                                    </div>

                                    <span style={{ fontSize: 11, color: '#c7d2fe', fontWeight: 600 }}>→</span>
                                </button>
                            );
                        })}

                        {/* Empty state */}
                        {!loading && !query && (
                            <div style={{ padding: '20px 18px 16px' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
                                    Qidiruv bo'yicha
                                </div>
                                {[
                                    { icon: <User size={14} />, label: 'Ism yoki familiya bo\'yicha', ex: 'Sardor Alimov' },
                                    { icon: <Phone size={14} />, label: 'Telefon raqam bo\'yicha', ex: '+998 90 123 45 67' },
                                    { icon: <CreditCard size={14} />, label: 'Karta raqami bo\'yicha', ex: 'C12345678' },
                                ].map((tip, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', color: '#64748b', fontSize: 13 }}>
                                        <span style={{ color: '#6366f1' }}>{tip.icon}</span>
                                        <span>{tip.label}</span>
                                        <code style={{ marginLeft: 'auto', fontSize: 11, color: '#94a3b8', background: '#f1f5f9', padding: '2px 8px', borderRadius: 6 }}>{tip.ex}</code>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        padding: '10px 18px',
                        borderTop: '1px solid #f1f5f9',
                        fontSize: 11, color: '#94a3b8',
                    }}>
                        <span>↑↓ navigatsiya &nbsp; Enter qidirish</span>
                        <span>Esc — yopish</span>
                    </div>

                    <style>{`
                        @keyframes gsSlideDown {
                            from { opacity: 0; transform: translateX(-50%) translateY(-8px); }
                            to   { opacity: 1; transform: translateX(-50%) translateY(0); }
                        }
                        @keyframes spin { to { transform: rotate(360deg); } }
                    `}</style>
                </div>
            )}
        </div>
    );
}
