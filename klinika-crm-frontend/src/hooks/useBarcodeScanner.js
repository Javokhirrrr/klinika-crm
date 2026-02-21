/**
 * useBarcodeScanner — Global barcode scanner hook
 *
 * Barcode skanerlar klaviatura kabi ishlaydi:
 * - Raqamlarni juda tez (< 50ms oraliq) yozadi
 * - Oxirida Enter bosadi
 *
 * Bu hook shu xatti-harakatni ushlab, onScan(code) chaqiradi.
 */
import { useEffect, useRef } from 'react';

export function useBarcodeScanner(onScan, options = {}) {
    const {
        minLength = 4,        // Minimal kod uzunligi
        maxGap = 80,          // Belgilar orasidagi maksimal vaqt (ms) — skaner tezligi
        prefix = null,        // Ba'zi skanerlar maxsus prefiks yuboradi (ixtiyoriy)
    } = options;

    const bufferRef = useRef('');
    const lastTimeRef = useRef(0);
    const timerRef = useRef(null);

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Input, textarea yoki contenteditable ichida bo'lsa — ignore
            const tag = (e.target?.tagName || '').toUpperCase();
            const isEditable = tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable;
            if (isEditable) return;

            const now = Date.now();
            const gap = now - lastTimeRef.current;
            lastTimeRef.current = now;

            // Vaqt oraliq katta bo'lsa — bufer yangi so'z uchun tozalanadi
            if (gap > maxGap + 100) {
                bufferRef.current = '';
            }

            if (e.key === 'Enter') {
                const code = bufferRef.current.trim();
                bufferRef.current = '';

                if (code.length >= minLength) {
                    // Prefix tekshirish (ixtiyoriy)
                    const finalCode = prefix
                        ? (code.startsWith(prefix) ? code.slice(prefix.length) : code)
                        : code;

                    if (finalCode.length >= minLength) {
                        e.preventDefault();
                        onScan(finalCode);
                    }
                }
                return;
            }

            // Faqat raqam va harf — maxsus tugmalar emas
            if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
                // Agar vaqt qisqa bo'lsa — skaner deb hisoblanadi (yoki birinchi belgi)
                if (gap <= maxGap || bufferRef.current.length === 0) {
                    bufferRef.current += e.key;
                } else {
                    // Qo'lda yozish — buferni tozala
                    bufferRef.current = e.key;
                }

                // Timeout: agar Enter kelmasa ham, 300ms dan keyin tozala
                clearTimeout(timerRef.current);
                timerRef.current = setTimeout(() => {
                    bufferRef.current = '';
                }, 300);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            clearTimeout(timerRef.current);
        };
    }, [onScan, minLength, maxGap, prefix]);
}
