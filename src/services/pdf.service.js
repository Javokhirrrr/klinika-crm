import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads', 'receipts');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Generate payment receipt PDF
 */
export async function generatePaymentReceipt(payment, patient, service, doctor, organization) {
    return new Promise(async (resolve, reject) => {
        try {
            // Create PDF document
            const doc = new PDFDocument({
                size: 'A4',
                margin: 50,
                info: {
                    Title: `To'lov cheki #${payment.receiptNumber}`,
                    Author: 'Klinika CRM'
                }
            });

            // Generate filename
            const filename = `receipt_${payment._id}.pdf`;
            const filepath = path.join(uploadsDir, filename);

            // Pipe to file
            const stream = fs.createWriteStream(filepath);
            doc.pipe(stream);

            // Colors
            const primaryColor = '#667eea';
            const textColor = '#333333';
            const lightGray = '#999999';

            // Header
            doc.fillColor(primaryColor)
                .fontSize(24)
                .font('Helvetica-Bold')
                .text('KLINIKA CRM', { align: 'center' });

            doc.moveDown(0.5);
            doc.fillColor(textColor)
                .fontSize(18)
                .text('TO\'LOV CHEKI', { align: 'center' });

            // Line separator
            doc.moveDown(0.5);
            doc.strokeColor(primaryColor)
                .lineWidth(2)
                .moveTo(50, doc.y)
                .lineTo(550, doc.y)
                .stroke();

            // Receipt info
            doc.moveDown();
            doc.fillColor(textColor)
                .fontSize(10)
                .font('Helvetica');

            const receiptInfoY = doc.y;
            doc.text(`Chek #: ${payment.receiptNumber}`, 50, receiptInfoY);
            doc.text(`Sana: ${new Date(payment.createdAt).toLocaleString('uz-UZ', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            })}`, 350, receiptInfoY, { align: 'right' });

            // Patient section
            doc.moveDown(2);
            doc.fillColor(primaryColor)
                .fontSize(12)
                .font('Helvetica-Bold')
                .text('BEMOR MA\'LUMOTLARI');

            doc.moveDown(0.5);
            doc.fillColor(textColor)
                .fontSize(10)
                .font('Helvetica');

            doc.text(`Ism: ${patient.firstName} ${patient.lastName || ''}`);
            doc.text(`Telefon: ${patient.phone}`);
            if (patient.dob) {
                const age = Math.floor((Date.now() - new Date(patient.dob)) / (365.25 * 24 * 60 * 60 * 1000));
                doc.text(`Yosh: ${age} yosh`);
            }

            // Payment details section
            doc.moveDown(2);
            doc.fillColor(primaryColor)
                .fontSize(12)
                .font('Helvetica-Bold')
                .text('TO\'LOV TAFSILOTLARI');

            doc.moveDown(0.5);
            doc.fillColor(textColor)
                .fontSize(10)
                .font('Helvetica');

            doc.text(`Xizmat: ${service?.name || 'Xizmat'}`);
            if (doctor) {
                doc.text(`Shifokor: ${doctor.firstName} ${doctor.lastName}`);
                if (doctor.spec) {
                    doc.text(`Mutaxassislik: ${doctor.spec}`);
                }
            }

            doc.moveDown();
            doc.text(`Narx: ${payment.amount.toLocaleString('uz-UZ')} so'm`);

            // Payment method
            const methodMap = {
                'cash': 'Naqd',
                'card': 'Karta',
                'bank': 'Bank o\'tkazmasi',
                'online': 'Online'
            };
            doc.text(`To'lov usuli: ${methodMap[payment.method] || payment.method}`);

            // Total box
            doc.moveDown();
            doc.fillColor(primaryColor)
                .fontSize(14)
                .font('Helvetica-Bold');

            const totalY = doc.y;
            doc.rect(50, totalY - 5, 500, 30)
                .fillAndStroke(primaryColor, primaryColor);

            doc.fillColor('white')
                .text(`JAMI TO'LANDI: ${payment.amount.toLocaleString('uz-UZ')} so'm`, 60, totalY, {
                    width: 480,
                    align: 'center'
                });

            // QR Code section
            doc.moveDown(2);
            doc.fillColor(textColor)
                .fontSize(10)
                .font('Helvetica')
                .text('Chekni tekshirish uchun QR kodni skanerlang:', { align: 'center' });

            // Generate QR code
            const qrData = JSON.stringify({
                receiptId: payment._id.toString(),
                receiptNumber: payment.receiptNumber,
                amount: payment.amount,
                date: payment.createdAt
            });

            const qrCodeDataURL = await QRCode.toDataURL(qrData, {
                width: 150,
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                }
            });

            const qrBuffer = Buffer.from(qrCodeDataURL.split(',')[1], 'base64');

            doc.moveDown();
            const qrY = doc.y;
            doc.image(qrBuffer, (doc.page.width - 150) / 2, qrY, {
                width: 150,
                height: 150
            });

            // Footer
            doc.moveDown(10);
            doc.fillColor(lightGray)
                .fontSize(9)
                .font('Helvetica')
                .text('Rahmat!', { align: 'center' });

            if (organization?.website) {
                doc.text(organization.website, { align: 'center' });
            }

            if (organization?.phone) {
                doc.text(`Tel: ${organization.phone}`, { align: 'center' });
            }

            // Finalize PDF
            doc.end();

            // Wait for stream to finish
            stream.on('finish', () => {
                resolve(filepath);
            });

            stream.on('error', (error) => {
                reject(error);
            });

        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Delete receipt file
 */
export function deleteReceipt(filepath) {
    try {
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Delete receipt error:', error);
        return false;
    }
}
