import { useState, useEffect, useRef } from 'react';

// Token bilan fetch — cross-origin iframe auth muammosini hal qiladi
async function fetchReceiptHtml(url) {
    const token = localStorage.getItem('accessToken') || '';

    // URL da /api/ yo'q bo'lsa qo'shish
    const finalUrl = url.includes('/api/')
        ? url
        : url.replace(/(https?:\/\/[^/]+)/, '$1/api');

    // Avval token bilan so'rov
    const res = await fetch(finalUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
    });

    if (!res.ok) {
        // Backup: tokenni query param sifatida
        const urlWithToken = finalUrl.includes('?')
            ? `${finalUrl}&token=${token}`
            : `${finalUrl}?token=${token}`;
        const res2 = await fetch(urlWithToken, { credentials: 'include' });
        if (!res2.ok) throw new Error(`Receipt ${res2.status}`);
        return res2.text();
    }
    return res.text();
}

export default function ReceiptPreviewModal({ url, open, onClose }) {
    const [html, setHtml] = useState('');
    const [loadError, setLoadError] = useState(null);
    const iframeRef = useRef(null);

    // 1. URL yoki open o'zgarganda HTML yuklash
    useEffect(() => {
        if (!open || !url) return;
        setHtml('');
        setLoadError(null);

        fetchReceiptHtml(url)
            .then(text => setHtml(text))
            .catch(err => {
                console.error('Receipt load error:', err);
                setLoadError(err.message);
            });
    }, [open, url]);

    // 2. HTML tayyor bo'lganda print dialog ochish
    useEffect(() => {
        if (!html || !iframeRef.current) return;

        const iframe = iframeRef.current;
        const timer = setTimeout(() => {
            try {
                iframe.contentWindow?.focus();
                iframe.contentWindow?.print();
            } catch (e) {
                console.error('Print trigger error:', e);
            }
        }, 600);

        // Print tugagandan keyin yopish
        const win = iframe.contentWindow;
        if (win) {
            win.onafterprint = () => { onClose(); };
        }

        return () => clearTimeout(timer);
    }, [html]);

    if (!open) return null;

    // Xatolik bo'lsa — ko'rinadigan modal ko'rsatamiz
    if (loadError) {
        return (
            <div style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <div style={{
                    background: '#fff', borderRadius: 16, padding: '32px 40px',
                    maxWidth: 400, textAlign: 'center',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
                    <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8, color: '#1e293b' }}>
                        Chek yuklanmadi
                    </div>
                    <div style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>
                        {loadError}
                    </div>
                    <button onClick={onClose} style={{
                        padding: '10px 28px', borderRadius: 10, border: 'none',
                        background: '#6366f1', color: '#fff', fontWeight: 700,
                        fontSize: 14, cursor: 'pointer',
                    }}>
                        Yopish
                    </button>
                </div>
            </div>
        );
    }

    // HTML yuklanmoqda — yashirin iframe (print avtomatik ishga tushadi)
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0, opacity: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 9998 }}>
            <iframe
                ref={iframeRef}
                srcDoc={html || '<html><body></body></html>'}
                title="Receipt"
                style={{ width: '80mm', height: '1200px', border: 'none' }}
            />
        </div>
    );
}
