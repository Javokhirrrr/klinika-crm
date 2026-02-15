import React, { useEffect, useState } from 'react';
import http from '@/lib/http';

const Receipt = ({ appointment, payment, settings: propSettings }) => {
    const [settings, setSettings] = useState(propSettings || {
        title: 'KLINIKA CRM',
        address: 'Toshkent sh.',
        phone: '',
        footer: 'Xizmatlar uchun rahmat!',
        showLogo: true,
        showDebt: true
    });

    useEffect(() => {
        if (propSettings) {
            setSettings(propSettings);
        } else {
            http.get('/settings/receipt_template')
                .then(res => {
                    if (res && res.value) {
                        setSettings(res.value);
                    }
                })
                .catch(console.error);
        }
    }, [propSettings]);

    if (!appointment) return null;

    const patient = appointment.patient || appointment.patientId || {};
    const doctor = appointment.doctor || appointment.doctorId || {}; // Agar kerak bo'lsa
    const service = appointment.service || appointment.serviceId || {};

    // Sana va vaqt
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];

    // Summa
    const amount = Number(payment?.amount || appointment.price || 0);
    const method = payment?.method === 'card' ? 'Karta' : payment?.method === 'transfer' ? "O'tkazma" : 'Naqd';

    // Qarz (taxminiy hisoblash, agar patient obyektida balance bo'lsa)
    const oldDebt = Number(patient.balance || 0);
    // Agar balance manfiy bo'lsa bu qarz, musbat bo'lsa oldindan to'lov. 
    // Logikani loyihaga moslash kerak. Odatda balance < 0 qarz.
    const debtLabel = oldDebt < 0 ? Math.abs(oldDebt) : 0;
    const totalDebt = debtLabel + (amount - (payment?.amount || 0)); // Bu yerda to'lov to'liq bo'lsa 0 qo'shiladi

    // Chiziq
    const DottedLine = () => <div className="text-center my-1 select-none text-gray-400" style={{ letterSpacing: '-2px' }}>----------------------------------------</div>;

    return (
        <div className="receipt-container font-mono text-xs leading-tight p-2 bg-white text-black" style={{ width: '80mm' }}>
            {/* Header */}
            <div className="text-center mb-2">
                {settings.showLogo && <div className="font-bold text-lg mb-1">{settings.title}</div>}
                {!settings.showLogo && <div className="font-bold text-lg mb-1">{settings.title}</div>}
                {settings.address && <div>{settings.address}</div>}
                {settings.phone && <div>Tel: {settings.phone}</div>}
            </div>

            <DottedLine />

            {/* Info */}
            <div className="flex justify-between">
                <span>Продажа:</span>
                <span className="font-bold">№ {payment?._id?.slice(-6) || appointment._id?.slice(-6)}</span>
            </div>
            <div className="flex justify-between">
                <span>Дата и время:</span>
                <span>{dateStr} {timeStr}</span>
            </div>
            <div className="flex justify-between">
                <span>Клиент:</span>
                <span className="font-bold text-right w-1/2 break-words">{patient.firstName} {patient.lastName}</span>
            </div>
            <div className="flex justify-end text-[10px] text-gray-500">
                ID: {patient._id?.slice(-6)}
            </div>

            <DottedLine />

            {/* Items */}
            <div className="mb-2">
                <div className="font-bold mb-1">{service.name || 'Konsultatsiya'}</div>
                <div className="flex justify-between">
                    <span>1 x {amount.toLocaleString()}</span>
                    <span className="font-bold">{amount.toLocaleString()} UZS</span>
                </div>
            </div>

            <DottedLine />

            {/* Totals */}
            {settings.showDebt && (
                <div className="flex justify-between">
                    <span>Долг до:</span>
                    <span className="font-bold">{debtLabel.toLocaleString()} UZS</span>
                </div>
            )}

            <div className="flex justify-between text-sm font-bold my-1">
                <span>ИТОГО:</span>
                <span>{amount.toLocaleString()} UZS</span>
            </div>

            <div className="flex justify-between">
                <span>Оплата ({method}):</span>
                <span>{amount.toLocaleString()} UZS</span>
            </div>

            {settings.showDebt && (
                <div className="flex justify-between mt-1 pt-1 border-t border-dashed border-gray-400">
                    <span>Итого долг:</span>
                    <span className="font-bold">{totalDebt.toLocaleString()} UZS</span>
                </div>
            )}

            <DottedLine />

            {/* Footer */}
            <div className="text-center mt-2 whitespace-pre-wrap">
                {settings.footer}
            </div>
            <div className="text-center mt-1 text-[10px]">
                System by SoftMasters
            </div>
        </div>
    );
};

export default Receipt;
