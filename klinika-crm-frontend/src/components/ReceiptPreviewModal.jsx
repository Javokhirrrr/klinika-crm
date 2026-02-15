import { useState, useEffect, useRef } from 'react';

export default function ReceiptPreviewModal({ url, open, onClose }) {
    const [html, setHtml] = useState('');
    const iframeRef = useRef(null);
    const [isPrinting, setIsPrinting] = useState(false);

    // 1. Fetch HTML when URL changes and open is true
    useEffect(() => {
        if (open && url) {
            setHtml(''); // Reset
            setIsPrinting(true);

            fetch(url)
                .then(res => res.text())
                .then(text => {
                    setHtml(text);
                })
                .catch(err => {
                    console.error("Receipt load error:", err);
                    alert("Chekni yuklashda xatolik yuz berdi");
                    onClose();
                });
        }
    }, [open, url]);

    // 2. Auto-print when HTML is ready
    useEffect(() => {
        if (!html || !iframeRef.current) return;

        const iframe = iframeRef.current;

        // Function to trigger print
        const triggerPrint = () => {
            try {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
            } catch (e) {
                console.error("Print error:", e);
                // Fallback or alert if blocked
            }
        };

        // Small delay to ensure styles/images load (if any)
        const timer = setTimeout(() => {
            triggerPrint();
        }, 500);

        // Cleanup
        // We can try to detect when printing is done, but it's tricky.
        // We will just rely on the user. If they cancel, they stay on the page.
        // The parent (SimplePayments) keeps 'open' true.
        // If they click 'Print' again, the parent updates 'url' (or same url).
        // If same URL, we need to ensure this effect runs again?
        // No, 'open'/state management in parent is simple. 
        // We should explicitly call onClose() after some time? 
        // No, let's keep it mounted until parent closes it or we decide to.
        // Actually, better to reset 'open' so the next click works properly if logic depends on it.
        // But we can't detect print completion reliably.
        // So we will trigger onClose after a delay, HOPEFULLY after the dialog appears.
        // If we close 'open', the iframe unmounts. If iframe unmounts, print dialog might close in some browsers?
        // SAFE BET: Keep it open. The user doesn't see it (hidden).
        // But we need to handle "Re-print same receipt". 
        // Parent: setReceiptUrl(url); setShow(true).
        // If we call onClose(), parent sets show(false).

        // Listen for afterprint in the iframe window
        const iframeWin = iframe.contentWindow;
        if (iframeWin) {
            iframeWin.onafterprint = () => {
                onClose();
            };
        }

        return () => clearTimeout(timer);
    }, [html]);

    if (!open) return null;

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0, opacity: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            <iframe
                ref={iframeRef}
                srcDoc={html}
                title="Receipt"
                style={{ width: '80mm', height: '1000px', border: 'none' }}
            />
        </div>
    );
}
