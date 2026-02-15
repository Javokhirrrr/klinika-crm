# 🏥 Klinika CRM - Shifokorlar Moduli

## 📋 Yangi Funksiyalar

### ✅ **PRIORITET 1 - Asosiy Funksiyalar**

#### **1. Doctor Wallet (Hamyon Tizimi)**
Shifokorlarning daromadini kuzatish va boshqarish tizimi.

**Backend API:**
```
GET    /api/doctors/:id/wallet              # Hamyon ma'lumotlari
GET    /api/doctors/:id/wallet/transactions # Tranzaksiyalar tarixi
GET    /api/doctors/:id/wallet/stats        # Statistika
POST   /api/doctors/:id/wallet/withdrawal   # Pul yechish
POST   /api/doctors/:id/wallet/bonus        # Bonus berish
POST   /api/doctors/:id/wallet/penalty      # Jarima berish
```

**Frontend:**
- `/doctors/:id/wallet` - Hamyon sahifasi
- Balans ko'rsatish
- Tranzaksiyalar tarixi
- Pul yechish, bonus va jarima modallari

**Xususiyatlar:**
- ✅ Joriy balans
- ✅ Jami topgan daromad
- ✅ Yechib olingan summa
- ✅ Bonuslar va jarimalar
- ✅ Oylik statistika
- ✅ Tranzaksiyalar tarixi

---

#### **2. Doctor Services (Xizmatlar Bog'lanishi)**
Har bir shifokorga maxsus xizmatlar va narxlarni biriktirish.

**Backend API:**
```
GET    /api/doctors/:id/services              # Shifokor xizmatlari
POST   /api/doctors/:id/services              # Xizmat qo'shish
DELETE /api/doctors/:id/services/:serviceId   # Xizmat o'chirish
PATCH  /api/doctors/:id/services/:serviceId   # Xizmat yangilash
GET    /api/services/:serviceId/doctors       # Xizmat ko'rsatuvchi shifokorlar
```

**Xususiyatlar:**
- ✅ Shifokorga xizmatlar biriktirish
- ✅ Har bir xizmat uchun maxsus narx
- ✅ Xizmatlarni faollashtirish/o'chirish

---

#### **3. Real-time Status (Bandlik Holati)**
Shifokorlarning real-time holati: bo'sh, band, tanaffus, offline.

**Backend API:**
```
GET    /api/doctors/:id/status     # Shifokor holati
PATCH  /api/doctors/:id/status     # Holatni o'zgartirish
GET    /api/doctors/status/all     # Barcha shifokorlar holati
```

**Frontend:**
- `/doctors/status` - Real-time Status Board
- Avtomatik yangilanish (10 soniyada)
- Holatlar bo'yicha guruhlash
- Tezkor status o'zgartirish

**Holatlar:**
- ✅ Available (Bo'sh) - Yangi bemorlarni qabul qilishga tayyor
- 🔴 Busy (Band) - Hozir bemor bilan
- ☕ Break (Tanaffus) - Dam olish vaqti
- ⚫ Offline - Ishda emas

---

#### **4. Departments (Bo'limlar Tizimi)**
Klinika bo'limlarini boshqarish va shifokorlarni guruhlash.

**Backend API:**
```
GET    /api/departments              # Bo'limlar ro'yxati
POST   /api/departments              # Yangi bo'lim
GET    /api/departments/:id          # Bo'lim ma'lumotlari
PUT    /api/departments/:id          # Bo'limni yangilash
DELETE /api/departments/:id          # Bo'limni o'chirish
GET    /api/departments/:id/doctors  # Bo'lim shifokorlari
```

**Frontend:**
- `/departments` - Bo'limlar boshqaruvi
- CRUD operatsiyalar
- Rang kodlash
- Bosh shifokor tayinlash

**Xususiyatlar:**
- ✅ Bo'lim nomi va kodi
- ✅ Bosh shifokor
- ✅ Joylashuv (qavat, bino)
- ✅ Aloqa ma'lumotlari
- ✅ Rang kodlash (kalendar uchun)

---

#### **5. Push Notifications (Bildirishnomalar)**
Telegram va SMS orqali avtomatik bildirishnomalar.

**Funksiyalar:**
- ✅ Yangi qabul haqida shifokorga xabar
- ✅ Qabul bekor qilinganda xabar
- ✅ Kunlik jadval eslatmasi
- ✅ Bemor uchun qabul eslatmasi
- ✅ To'lov tasdiqlash xabari

**Sozlash:**
1. `.env` faylida konfiguratsiya:
```bash
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token_here

# SMS Provider (Eskiz.uz)
SMS_PROVIDER_URL=https://notify.eskiz.uz/api/message/sms/send
SMS_PROVIDER_API_KEY=your_api_key_here
SMS_FROM=Klinika
```

2. Telegram Bot yaratish:
   - [@BotFather](https://t.me/BotFather) ga murojaat qiling
   - `/newbot` buyrug'i bilan yangi bot yarating
   - Tokenni `.env` ga qo'shing

3. SMS Provider (Eskiz.uz):
   - [eskiz.uz](https://eskiz.uz) da ro'yxatdan o'ting
   - API kalitni oling
   - `.env` ga qo'shing

---

#### **6. Doctor Analytics (Analitika)**
Shifokorlar ishlash ko'rsatkichlari va statistika.

**Backend API:**
```
GET /api/analytics/doctors        # Umumiy analitika
GET /api/analytics/doctors/:id    # Shifokor analitikasi
```

**Frontend:**
- `/analytics/doctors` - Analitika dashboard

**Ko'rsatkichlar:**
- ✅ Top shifokorlar (qabullar bo'yicha)
- ✅ Bo'limlar statistikasi
- ✅ Holatlar taqsimoti
- ✅ Mutaxassisliklar bo'yicha
- ✅ Daromad statistikasi
- ✅ Oylik tendensiya
- ✅ Eng ko'p ko'rsatiladigan xizmatlar

---

### ✅ **PRIORITET 2 - Qo'shimcha Funksiyalar**

#### **7. Work History (Ish Tarixi)**
Doctor modelida mavjud:
```javascript
workHistory: [{
  organization: String,
  position: String,
  startDate: Date,
  endDate: Date,
  description: String,
  isCurrent: Boolean
}]
```

#### **8. Achievements (Yutuqlar)**
Doctor modelida mavjud:
```javascript
achievements: [{
  title: String,
  description: String,
  date: Date,
  icon: String
}]
```

---

## 🚀 Foydalanish

### Backend Ishga Tushirish

```bash
cd "c:\Users\user\Desktop\Klinika Crm"
npm run dev
```

### Frontend Ishga Tushirish

```bash
cd "c:\Users\user\Desktop\Klinika Crm\klinika-crm-frontend"
npm run dev
```

### Ma'lumotlar Bazasi

MongoDB ishga tushirilgan bo'lishi kerak:
```bash
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl start mongod
```

---

## 📱 Telegram Bot Sozlash

### 1. Bot Yaratish

1. Telegram'da [@BotFather](https://t.me/BotFather) ni oching
2. `/newbot` buyrug'ini yuboring
3. Bot nomini kiriting (masalan: "Klinika CRM Bot")
4. Bot username'ini kiriting (masalan: "klinika_crm_bot")
5. Tokenni nusxalang

### 2. Konfiguratsiya

`.env` faylida:
```bash
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

### 3. Webhook Sozlash (Production)

```javascript
import { setWebhook } from './src/lib/telegramBot.js';

await setWebhook('https://your-domain.com/api/telegram/webhook');
```

---

## 📨 SMS Sozlash (Eskiz.uz)

### 1. Ro'yxatdan O'tish

1. [eskiz.uz](https://eskiz.uz) saytiga kiring
2. Ro'yxatdan o'ting
3. API kalitni oling

### 2. Konfiguratsiya

`.env` faylida:
```bash
SMS_PROVIDER_URL=https://notify.eskiz.uz/api/message/sms/send
SMS_PROVIDER_API_KEY=your_api_key_here
SMS_FROM=Klinika
```

### 3. Test Qilish

```javascript
import { sendSMS } from './src/lib/sms.js';

const result = await sendSMS('+998901234567', 'Test xabar');
console.log(result);
```

---

## 🎨 Frontend Sahifalar

| Sahifa | URL | Tavsif |
|--------|-----|--------|
| Shifokorlar | `/doctors` | Shifokorlar ro'yxati va boshqaruvi |
| Hamyon | `/doctors/:id/wallet` | Shifokor hamyoni |
| Bo'limlar | `/departments` | Bo'limlar boshqaruvi |
| Analitika | `/analytics/doctors` | Shifokorlar analitikasi |
| Status Board | `/doctors/status` | Real-time bandlik holati |

---

## 🔧 Texnik Ma'lumotlar

### Backend Stack
- Node.js + Express.js
- MongoDB + Mongoose
- JWT Authentication
- Axios (HTTP client)

### Frontend Stack
- React.js + Vite
- React Router v6
- Axios
- CSS Modules

### Yangi Modellar
- `DoctorWallet` - Hamyon tizimi
- `Department` - Bo'limlar
- `Doctor` (kengaytirilgan) - Services, Status, Work History, Achievements

### Yangi Controllerlar
- `doctorWallet.controller.js`
- `doctorStatus.controller.js`
- `doctorServices.controller.js`
- `departments.controller.js`
- `doctorAnalytics.controller.js`

### Yangi Servislar
- `notification.service.js` - Push bildirishnomalar
- `sms.js` - SMS yuborish
- `telegramBot.js` - Telegram bot

---

## 📞 Yordam

Savollar bo'lsa:
1. Backend loglarini tekshiring: `npm run dev`
2. Frontend loglarini tekshiring: Browser Console (F12)
3. MongoDB ulanishini tekshiring
4. `.env` faylini tekshiring

---

## 🎉 Tayyor!

Barcha funksiyalar ishga tayyor. Tizimni test qiling va foydalaning!

**Keyingi qadamlar:**
1. FullCalendar integratsiya (kalendar ko'rinishi)
2. Drag & Drop appointments
3. Charts (Recharts/Chart.js)
4. Mobil ilova (React Native)
5. QR-kod skanerlash

---

**Yaratilgan:** 2026-02-09  
**Versiya:** 2.0.0  
**Muallif:** Klinika CRM Team
