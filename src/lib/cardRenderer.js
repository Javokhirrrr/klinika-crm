/**
 * cardRenderer.js
 * Puppeteer yordamida bemor kartasini PNG rasm sifatida generatsiya qiladi.
 * Xuddi frontend printCard() funksiyasidagi HTML ni screenshot oladi.
 */
import puppeteer from 'puppeteer';

/**
 * Bemor kartasini PNG buffer sifatida qaytaradi
 * @param {Object} patient - Patient lean object
 * @param {string} [clinicName]
 * @returns {Promise<Buffer>} PNG buffer
 */
export async function generatePatientCardPNG(patient, clinicName = 'Klinika CRM Tizimi') {
    const cardNo = String(
        patient.cardNo || patient.cardNumber || patient._id || '00000000'
    ).replace(/\D/g, '') || '00000000';

    const fullName = [patient.firstName, patient.lastName].filter(Boolean).join(' ') || 'Noma\'lum';
    const phone = patient.phone || '—';
    const gender = patient.gender === 'male' ? 'Erkak' : patient.gender === 'female' ? 'Ayol' : '—';

    let birthStr = '—', ageStr = '';
    if (patient.birthDate) {
        const bd = new Date(patient.birthDate);
        birthStr = bd.toLocaleDateString('uz-UZ');
        const age = new Date().getFullYear() - bd.getFullYear();
        ageStr = `${age} yosh`;
    }

    const regDate = patient.createdAt
        ? new Date(patient.createdAt).toLocaleDateString('uz-UZ')
        : new Date().toLocaleDateString('uz-UZ');

    // Barcode URL — barcodeapi.org (tashqi servis, puppeteer yuklab oladi)
    const barcodeUrl = `https://barcodeapi.org/api/code128/${cardNo}?width=2&height=55`;

    // HTML template — frontend SimplePatients.jsx dagi printCard bilan bir xil
    const html = /* html */`<!DOCTYPE html>
<html lang="uz">
<head>
<meta charset="UTF-8">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{
    width:360px;
    font-family:'Courier New',Courier,monospace;
    background:#fff;
    padding:18px 20px;
    color:#000;
  }

  /* Sarlavha */
  .clinic-name{
    font-size:19px;font-weight:bold;
    text-align:center;letter-spacing:1px;
    margin-bottom:3px;
  }
  .clinic-sub{
    font-size:11px;color:#c0392b;
    text-align:center;margin-bottom:10px;
  }

  /* Separator */
  .div{border:none;border-top:1px dashed #aaa;margin:8px 0}

  /* Barcode */
  .bc-wrap{text-align:center;margin:8px 0 4px}
  .bc-wrap img{max-width:300px;height:65px;display:block;margin:0 auto}
  .card-no{
    text-align:center;font-size:20px;font-weight:bold;
    letter-spacing:4px;margin:4px 0 10px;
  }

  /* Info jadval */
  table{width:100%;border-collapse:collapse;font-size:11px}
  td{padding:4px 0;vertical-align:top}
  td.lbl{color:#555;width:110px;font-weight:normal}
  td.val{font-size:11px;font-weight:700;color:#000;word-break:break-word}

  /* Footer */
  .footer{
    font-size:9px;color:#c0392b;
    text-align:center;margin-top:8px;
    border-top:1px dashed #aaa;padding-top:6px;
    line-height:1.5;
  }
</style>
</head>
<body>
  <div class="clinic-name">BEMOR KARTASI</div>
  <div class="clinic-sub">${clinicName}</div>
  <hr class="div">

  <div class="bc-wrap">
    <img src="${barcodeUrl}" alt="barcode">
  </div>
  <div class="card-no">${cardNo}</div>

  <hr class="div">

  <table>
    <tr><td class="lbl">Ism Familiya:</td><td class="val">${fullName}</td></tr>
    <tr><td class="lbl">Telefon:</td><td class="val">${phone}</td></tr>
    ${birthStr !== '—' ? `<tr><td class="lbl">Tug'ilgan:</td><td class="val">${birthStr}</td></tr>` : ''}
    ${ageStr ? `<tr><td class="lbl">Yosh:</td><td class="val">${ageStr}</td></tr>` : ''}
    <tr><td class="lbl">Jins:</td><td class="val">${gender}</td></tr>
    <tr><td class="lbl">Ro'yxat:</td><td class="val">${regDate}</td></tr>
  </table>

  <div class="footer">
    Har safar klinikaga kelganingizda<br>
    ushbu kartani ko'rsating!
  </div>
</body>
</html>`;

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
            ],
        });

        const page = await browser.newPage();

        // Viewport: kartani to'liq sig'diradi
        await page.setViewport({ width: 400, height: 800, deviceScaleFactor: 2 });

        await page.setContent(html, { waitUntil: 'networkidle0', timeout: 15000 });

        // Sahifaning haqiqiy balandligini olish
        const height = await page.evaluate(() => document.body.scrollHeight);
        await page.setViewport({ width: 400, height: height + 10, deviceScaleFactor: 2 });

        const buffer = await page.screenshot({
            type: 'jpeg',
            quality: 92,
            clip: { x: 0, y: 0, width: 400, height: height + 10 },
        });

        return buffer;
    } finally {
        if (browser) await browser.close().catch(() => { });
    }
}
