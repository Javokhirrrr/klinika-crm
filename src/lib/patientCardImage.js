/**
 * patientCardImage.js
 * PDFKit yordamida bemor kartasini PDF sifatida generatsiya qiladi.
 * Telegram sendDocument orqali PDF sifatida yuboriladi (rasm emas).
 *
 * Agar haqiqiy rasm kerak bo'lsa — canvas yoki puppeteer kerak bo'ladi.
 */

import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

/**
 * Bemor kartasini PDF buffer sifatida qaytaradi
 * @param {Object} patient - Patient mongoose document (lean)
 * @param {string} [clinicName] - Klinika nomi
 * @returns {Promise<Buffer>}
 */
export async function generatePatientCardPDF(patient, clinicName = 'Klinika CRM') {
    return new Promise(async (resolve, reject) => {
        try {
            // QR kod — karta raqami yoki telefon
            const qrData = patient.cardNo || patient.phone || patient._id.toString();
            const qrDataURL = await QRCode.toDataURL(qrData, {
                width: 120,
                margin: 1,
                color: { dark: '#000000', light: '#ffffff' },
            });
            // base64 → buffer
            const qrBuffer = Buffer.from(qrDataURL.split(',')[1], 'base64');

            const doc = new PDFDocument({
                size: [340, 480],  // kichik karta o'lchami (px ~= pt)
                margin: 0,
            });

            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const W = 340;
            const pad = 24;

            // ─── Fon ────────────────────────────────────────────────
            doc.rect(0, 0, W, 480).fill('#ffffff');

            // ─── Sarlavha blok ──────────────────────────────────────
            doc.rect(0, 0, W, 70).fill('#1e293b');

            doc.fillColor('#ffffff')
                .fontSize(20)
                .font('Helvetica-Bold')
                .text('BEMOR KARTASI', pad, 16, { width: W - pad * 2, align: 'center' });

            doc.fillColor('#94a3b8')
                .fontSize(10)
                .font('Helvetica')
                .text(clinicName, pad, 44, { width: W - pad * 2, align: 'center' });

            // ─── Separator ──────────────────────────────────────────
            doc.moveTo(pad, 82).lineTo(W - pad, 82)
                .dash(4, { space: 4 })
                .strokeColor('#cbd5e1').lineWidth(1).stroke().undash();

            // ─── QR kod (o'ng) ──────────────────────────────────────
            const qrSize = 90;
            const qrX = W - pad - qrSize;
            const qrY = 94;
            doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });

            // ─── Bemor ma'lumotlari (chap) ───────────────────────────
            let y = 94;
            const lineH = 22;
            const labelX = pad;
            const valueX = pad + 80;
            const maxW = qrX - pad - 10;

            const field = (label, value) => {
                if (!value) return;
                doc.fillColor('#64748b').fontSize(9).font('Helvetica').text(label, labelX, y, { width: 72 });
                doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold').text(value, valueX, y, { width: maxW });
                y += lineH;
            };

            // To'liq ism
            doc.fillColor('#1e293b')
                .fontSize(13)
                .font('Helvetica-Bold')
                .text(`${patient.firstName} ${patient.lastName || ''}`, labelX, y, {
                    width: maxW,
                });
            y += 24;

            field('Karta №:', patient.cardNo || '—');
            field('Telefon:', patient.phone || '—');

            // Yosh
            let age = '';
            if (patient.birthDate) {
                const yil = new Date().getFullYear() - new Date(patient.birthDate).getFullYear();
                age = `${yil} yosh`;
            }
            if (age) field('Yosh:', age);

            const genderMap = { male: 'Erkak', female: 'Ayol' };
            field('Jins:', genderMap[patient.gender] || '');
            field('Manzil:', patient.address || '');
            field('Qon guruhi:', patient.bloodType || '');

            const regDate = patient.createdAt
                ? new Date(patient.createdAt).toLocaleDateString('uz-UZ')
                : new Date().toLocaleDateString('uz-UZ');
            field("Ro'yxat:", regDate);

            // ─── Separator ──────────────────────────────────────────
            const sepY = 460 - 60;
            doc.moveTo(pad, sepY).lineTo(W - pad, sepY)
                .dash(4, { space: 4 })
                .strokeColor('#cbd5e1').lineWidth(1).stroke().undash();

            // ─── Footer ──────────────────────────────────────────────
            doc.rect(0, 416, W, 64).fill('#f8fafc');

            doc.fillColor('#64748b')
                .fontSize(9)
                .font('Helvetica')
                .text(
                    "Har safar klinikaga kelganingizda ushbu kartani ko'rsating!",
                    pad, 428, { width: W - pad * 2, align: 'center' }
                );

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
}
