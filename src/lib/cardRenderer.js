/**
 * cardRenderer.js
 * quickchart.io render API yordamida bemor karta HTML ni PNG sifatida qaytaradi.
 * Hech qanday server-side browser (puppeteer) siz ishlaydi.
 */
import axios from 'axios';

/**
 * Bemor kartasi HTML template
 */
function buildCardHTML(patient, clinicName = 'Klinika CRM Tizimi') {
  const cardNo = String(
    patient.cardNo || patient.cardNumber || patient._id || '00000000'
  ).replace(/\D/g, '') || '00000000';

  const fullName = [patient.firstName, patient.lastName].filter(Boolean).join(' ') || "Noma'lum";
  const phone = patient.phone || '\u2014';
  const gender = patient.gender === 'male' ? 'Erkak'
    : patient.gender === 'female' ? 'Ayol' : '\u2014';

  let birthStr = '', ageStr = '';
  if (patient.birthDate) {
    const bd = new Date(patient.birthDate);
    birthStr = bd.toLocaleDateString('uz-UZ');
    const age = new Date().getFullYear() - bd.getFullYear();
    ageStr = age + ' yosh';
  }

  const regDate = patient.createdAt
    ? new Date(patient.createdAt).toLocaleDateString('uz-UZ')
    : new Date().toLocaleDateString('uz-UZ');

  const barcodeUrl = `https://barcodeapi.org/api/code128/${cardNo}?width=2&height=55`;

  const rows = [
    ['Ism Familiya:', fullName],
    ['Telefon:', phone],
    ...(birthStr ? [["Tug'ilgan:", birthStr]] : []),
    ...(ageStr ? [['Yosh:', ageStr]] : []),
    ['Jins:', gender],
    ["Ro'yxat:", regDate],
  ];

  const rowsHTML = rows.map(([l, v]) => `
        <tr>
          <td class="lbl">${l}</td>
          <td class="val">${v}</td>
        </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="uz">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 360px;
    font-family: 'Courier New', Courier, monospace;
    background: #fff;
    padding: 18px 20px 14px;
    color: #000;
  }
  .title {
    font-size: 19px; font-weight: bold;
    text-align: center; letter-spacing: 1px;
    margin-bottom: 3px;
  }
  .sub {
    font-size: 11px; color: #c0392b;
    text-align: center; margin-bottom: 10px;
  }
  .div { border: none; border-top: 1px dashed #aaa; margin: 8px 0; }
  .bc-wrap { text-align: center; margin: 8px 0 2px; }
  .bc-wrap img { max-width: 300px; height: 65px; display: block; margin: 0 auto; }
  .card-no {
    text-align: center; font-size: 20px; font-weight: bold;
    letter-spacing: 4px; margin: 4px 0 10px;
  }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  td { padding: 4px 0; vertical-align: top; }
  td.lbl { color: #555; width: 110px; }
  td.val { font-weight: 700; color: #000; word-break: break-word; }
  .footer {
    font-size: 9px; color: #c0392b; text-align: center;
    margin-top: 8px; border-top: 1px dashed #aaa;
    padding-top: 6px; line-height: 1.5;
  }
</style>
</head>
<body>
  <div class="title">BEMOR KARTASI</div>
  <div class="sub">${clinicName}</div>
  <hr class="div">
  <div class="bc-wrap">
    <img src="${barcodeUrl}" alt="barcode">
  </div>
  <div class="card-no">${cardNo}</div>
  <hr class="div">
  <table>${rowsHTML}</table>
  <div class="footer">
    Har safar klinikaga kelganingizda<br>ushbu kartani ko'rsating!
  </div>
</body>
</html>`;
}

/**
 * quickchart.io render API orqali PNG buffer qaytaradi.
 * Bepul, API key kerak emas.
 */
export async function generatePatientCardPNG(patient, clinicName = 'Klinika CRM Tizimi') {
  const html = buildCardHTML(patient, clinicName);

  // quickchart.io /render endpoint — HTML -> PNG
  const resp = await axios.post(
    'https://quickchart.io/html-to-image',
    { html, width: 400 },
    { responseType: 'arraybuffer', timeout: 20000 }
  );

  return Buffer.from(resp.data);
}
