import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import http from '../lib/http';

/* ─── Skaner natijasi modal ─────────────────────────────────────── */
function ScanResultModal({ state, onClose, onNavigate }) {
    if (state.status === 'idle') return null;

    return (
        <>
            {/* Backdrop */}
            <div
                style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 9998,
                    animation: 'fadeIn 0.15s ease'
                }}
                onClick={onClose}
            />

            {/* Modal */}
            <div style={{
                position: 'fixed', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'white', borderRadius: 20,
                padding: '28px 32px', zIndex: 9999,
                width: 360, maxWidth: '90vw',
                boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                animation: 'slideUp 0.2s ease'
            }}>

                {/* Loading */}
                {state.status === 'loading' && (
                    <div style={{ textAlign: 'center', padding: '16px 0' }}>
                        <div style={{
                            width: 48, height: 48, borderRadius: '50%',
                            border: '3px solid #e2e8f0', borderTopColor: '#6366f1',
                            animation: 'spin 0.7s linear infinite',
                            margin: '0 auto 14px'
                        }} />
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>
                            🔍 Skaner qilindi: <code style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: 6 }}>{state.code}</code>
                        </div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Bemor izlanmoqda...</div>
                    </div>
                )}

                {/* Topildi */}
                {state.status === 'found' && state.patient && (
                    <div>
                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                            <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Bemor topildi!</div>
                        </div>

                        {/* Bemor ma'lumotlari */}
                        <div style={{
                            background: '#f8faff', borderRadius: 14, padding: '16px 18px',
                            border: '1.5px solid #e0e7ff', marginBottom: 18
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <div style={{
                                    width: 48, height: 48, borderRadius: '50%',
                                    background: state.patient.gender === 'female' ? '#fce7f3' : '#dbeafe',
                                    color: state.patient.gender === 'female' ? '#db2777' : '#2563eb',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 800, fontSize: 18, flexShrink: 0
                                }}>
                                    {(state.patient.firstName || '?')[0].toUpperCase()}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a' }}>
                                        {state.patient.firstName} {state.patient.lastName}
                                    </div>
                                    {state.patient.phone && (
                                        <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                                            📞 {state.patient.phone}
                                        </div>
                                    )}
                                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, fontFamily: 'monospace', fontWeight: 700 }}>
                                        🪪 {state.patient.cardNo}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={onClose} style={{
                                flex: 1, padding: '10px', borderRadius: 10,
                                border: '1.5px solid #e2e8f0', background: 'white',
                                cursor: 'pointer', fontWeight: 600, fontSize: 13,
                                fontFamily: 'inherit', color: '#475569'
                            }}>Yopish</button>
                            <button onClick={() => onNavigate(state.patient._id)} style={{
                                flex: 2, padding: '10px', borderRadius: 10,
                                border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                                cursor: 'pointer', fontWeight: 700, fontSize: 14,
                                fontFamily: 'inherit', color: 'white',
                                boxShadow: '0 4px 14px rgba(99,102,241,0.3)'
                            }}>
                                👤 Profilni ochish
                            </button>
                        </div>
                    </div>
                )}

                {/* Topilmadi */}
                {state.status === 'notfound' && (
                    <div style={{ textAlign: 'center', padding: '8px 0' }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>❌</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Bemor topilmadi</div>
                        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>
                            Karta raqami: <code style={{ background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>{state.code}</code>
                        </div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 20, lineHeight: 1.5 }}>
                            Bu karta raqami bazada topilmadi.<br />Bemorni avval ro'yxatdan o'tkaring.
                        </div>
                        <button onClick={onClose} style={{
                            padding: '10px 28px', borderRadius: 10,
                            border: '1.5px solid #e2e8f0', background: 'white',
                            cursor: 'pointer', fontWeight: 700, fontSize: 14,
                            fontFamily: 'inherit', color: '#475569'
                        }}>Yopish</button>
                    </div>
                )}

                {/* Xatolik */}
                {state.status === 'error' && (
                    <div style={{ textAlign: 'center', padding: '8px 0' }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Xatolik yuz berdi</div>
                        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
                            Server bilan aloqa muammosi. Qayta urinib ko'ring.
                        </div>
                        <button onClick={onClose} style={{
                            padding: '10px 28px', borderRadius: 10,
                            border: 'none', background: '#0f172a',
                            cursor: 'pointer', fontWeight: 700, fontSize: 14,
                            fontFamily: 'inherit', color: 'white'
                        }}>Yopish</button>
                    </div>
                )}
            </div>

            <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { opacity:0; transform:translate(-50%,-46%) } to { opacity:1; transform:translate(-50%,-50%) } }
        @keyframes spin { to { transform:rotate(360deg) } }
      `}</style>
        </>
    );
}

/* ─── Global Scanner Provider ───────────────────────────────────── */
export default function BarcodeScannerProvider() {
    const navigate = useNavigate();
    const [state, setState] = useState({ status: 'idle', code: '', patient: null });

    const handleScan = useCallback(async (code) => {
        // Faqat raqamlardan iborat (barcode)
        const numericCode = code.replace(/\D/g, '');
        if (numericCode.length < 4) return;

        setState({ status: 'loading', code: numericCode, patient: null });

        try {
            // cardNo "C" bilan boshlanishi mumkin yoki toza raqam
            const res = await http.get('/patients', {
                params: { cardNo: numericCode, limit: 1 }
            });

            const items = res?.items || [];

            // Topa olmaganida "C" prefiksi bilan ham qidirish
            if (items.length === 0) {
                const res2 = await http.get('/patients', {
                    params: { cardNo: `C${numericCode}`, limit: 1 }
                });
                const items2 = res2?.items || [];
                if (items2.length > 0) {
                    setState({ status: 'found', code: numericCode, patient: items2[0] });
                    return;
                }
            }

            if (items.length > 0) {
                setState({ status: 'found', code: numericCode, patient: items[0] });
            } else {
                setState({ status: 'notfound', code: numericCode, patient: null });
            }
        } catch (e) {
            console.error('Barcode scan error:', e);
            setState({ status: 'error', code: numericCode, patient: null });
        }
    }, []);

    const handleNavigate = useCallback((patientId) => {
        setState({ status: 'idle', code: '', patient: null });
        navigate(`/patients/${patientId}`);
    }, [navigate]);

    const handleClose = useCallback(() => {
        setState({ status: 'idle', code: '', patient: null });
    }, []);

    // Global barcode scanner
    useBarcodeScanner(handleScan, {
        minLength: 4,
        maxGap: 60, // ms — skanerlar odatda 30-50ms da yozadi
    });

    return (
        <ScanResultModal
            state={state}
            onClose={handleClose}
            onNavigate={handleNavigate}
        />
    );
}
