import { Payment } from '../models/Payment.js';
import { Appointment } from '../models/Appointment.js';
import { Settings } from '../models/Settings.js';
import { Patient } from '../models/Patient.js';
import { Service } from '../models/Service.js';

// Default settings
const defaultSettings = {
    title: 'KLINIKA CRM',
    address: 'Toshkent sh., Yunusobod t-ni',
    phone: '+998 90 123 45 67',
    footer: 'Xizmatlar uchun rahmat!\nSalomat bo\'ling!',
    showLogo: true,
    showDebt: true
};

const getSettings = async () => {
    try {
        const s = await Settings.findOne({ key: 'receipt_template' });
        return s && s.value ? s.value : defaultSettings;
    } catch (e) {
        return defaultSettings;
    }
};

const formatMoney = (amount) => {
    return Number(amount || 0).toLocaleString('uz-UZ') + ' UZS';
};

const formatDate = (date) => {
    const d = new Date(date || new Date());
    const dateStr = d.toISOString().split('T')[0];
    const timeStr = d.toTimeString().split(' ')[0].substring(0, 5);
    return `${dateStr} ${timeStr}`;
};

const generateHtml = (data, settings) => {
    const { paymentId, appointmentId, patientName, patientId, serviceName, amount, method, oldDebt, totalDebt, date } = data;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Chek ${paymentId || appointmentId}</title>
    <style>
        body { margin: 0; padding: 0; font-family: 'Courier New', Courier, monospace; font-size: 12px; color: #000; background: #fff; }
        .receipt-container { width: 78mm; padding: 5px; margin: 0 auto; box-sizing: border-box; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .flex { display: flex; justify-content: space-between; align-items: flex-start; }
        .mb-1 { margin-bottom: 4px; }
        .mb-2 { margin-bottom: 8px; }
        .mt-1 { margin-top: 4px; }
        .dotted-line { text-align: center; margin: 5px 0; overflow: hidden; white-space: nowrap; color: #999; letter-spacing: -2px; }
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="receipt-container">
        <div class="text-center mb-2">
            <div class="font-bold" style="font-size: 16px;">${settings.title}</div>
            <div>${settings.address}</div>
            <div>Tel: ${settings.phone}</div>
        </div>

        <div class="dotted-line">----------------------------------------</div>

        <div class="flex">
            <span>Sotuv:</span>
            <span class="font-bold">№ ${String(paymentId || appointmentId).slice(-6).toUpperCase()}</span>
        </div>
        <div class="flex">
            <span>Vaqt:</span>
            <span>${formatDate(date)}</span>
        </div>
        <div class="flex">
            <span>Bemor:</span>
            <span class="font-bold text-right" style="max-width: 60%; word-break: break-all;">${patientName}</span>
        </div>
        <div class="text-right" style="font-size: 10px; color: #666;">ID: ${String(patientId).slice(-6).toUpperCase()}</div>

        <div class="dotted-line">----------------------------------------</div>

        <div class="mb-2">
            <div class="font-bold mb-1">${serviceName}</div>
            <div class="flex">
                <span>1 x ${Number(amount).toLocaleString()}</span>
                <span class="font-bold">${formatMoney(amount)}</span>
            </div>
        </div>

        <div class="dotted-line">----------------------------------------</div>

        ${settings.showDebt ? `
        <div class="flex">
            <span>Eski qarz:</span>
            <span class="font-bold">${formatMoney(oldDebt)}</span>
        </div>
        ` : ''}

        <div class="flex" style="font-weight: bold; font-size: 14px; margin-top: 5px;">
            <span>JAMI:</span>
            <span>${formatMoney(amount)}</span>
        </div>

        <div class="flex mt-1">
            <span>To'lov (${method}):</span>
            <span>${formatMoney(amount)}</span>
        </div>

        ${settings.showDebt ? `
        <div class="flex mt-1 pt-1" style="border-top: 1px dashed #ccc">
            <span>Jami qarz:</span>
            <span class="font-bold">${formatMoney(totalDebt)}</span>
        </div>
        ` : ''}

        <div class="dotted-line">----------------------------------------</div>

        <div class="text-center mt-2" style="white-space: pre-wrap;">${settings.footer}</div>
        <div class="text-center mt-1" style="font-size: 10px;">System by SoftMasters</div>
    </div>
</body>
</html>
    `;
};

export async function printPayment(req, res) {
    try {
        const { id } = req.params;
        const payment = await Payment.findById(id).populate('patientId');

        if (!payment) return res.status(404).send('Payment not found');

        const settings = await getSettings();
        const patient = payment.patientId;

        // Debt calculation logic (simplified for now)
        // Ensure balance exists
        const currentBalance = patient.balance || 0;
        // If balance < 0, it is debt.
        // Assuming payment just happened, "Old Debt" was (currentBalance - amount) if balance increased by payment amount.
        // But usually payment logic updates balance: balance += payment.amount.
        // So debt before payment = -(currentBalance - payment.amount).
        // Example: Debt -100. Pay 50. New Balance -50.
        // Old Debt (displayed positive) = -(-50 - 50) = -(-100) = 100. Correct.
        // Example 2: Prepaid 0. Pay 50. New Balance 50.
        // Old Debt = -(50 - 50) = 0. Correct.

        const oldDebt = -(currentBalance - payment.amount);
        const totalDebt = -currentBalance;

        const html = generateHtml({
            paymentId: payment._id,
            appointmentId: payment.appointmentId,
            patientName: `${patient.firstName} ${patient.lastName}`,
            patientId: patient._id,
            serviceName: payment.note || "Tibbiy Xizmat",
            amount: payment.amount,
            method: payment.method === 'card' ? 'Karta' : payment.method === 'transfer' ? "O'tkazma" : 'Naqd',
            oldDebt: oldDebt < 0 ? 0 : oldDebt, // Show 0 if user has credit
            totalDebt: totalDebt < 0 ? 0 : totalDebt, // Show 0 if user has credit
            date: payment.createdAt
        }, settings);

        // Allow inline scripts for this response (for window.print())
        res.set('Content-Security-Policy', "script-src 'self' 'unsafe-inline'");
        res.send(html);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error generating receipt');
    }
}

export async function printAppointment(req, res) {
    try {
        const { id } = req.params;
        const appointment = await Appointment.findById(id)
            .populate('patientId')
            .populate({ path: 'serviceIds', model: 'Service' });

        if (!appointment) return res.status(404).send('Appointment not found');

        const settings = await getSettings();
        const patient = appointment.patientId;

        const amount = appointment.price || 0;
        const serviceName = appointment.serviceIds && appointment.serviceIds.length > 0
            ? appointment.serviceIds.map(s => s.name).join(', ')
            : "Konsultatsiya";

        const currentBalance = patient.balance || 0;
        const totalDebt = -currentBalance;

        const html = generateHtml({
            paymentId: null,
            appointmentId: appointment._id,
            patientName: `${patient.firstName} ${patient.lastName}`,
            patientId: patient._id,
            serviceName: serviceName,
            amount: amount,
            method: appointment.isPaid ? 'To\'langan' : 'Kutilmoqda',
            oldDebt: totalDebt < 0 ? 0 : totalDebt,
            totalDebt: totalDebt < 0 ? 0 : totalDebt,
            date: appointment.startAt || appointment.createdAt
        }, settings);

        // Allow inline scripts for this response (for window.print())
        res.set('Content-Security-Policy', "script-src 'self' 'unsafe-inline'");
        res.send(html);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error generating receipt');
    }
}
