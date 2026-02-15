# 📋 Bemor Kartotekasi Tizimi (Patient Medical Records System)

## 🎯 Umumiy Ko'rinish

Klinika CRM tizimiga to'liq **Bemor Kartotekasi** moduli qo'shildi. Bu modul bemorlarning barcha tibbiy ma'lumotlarini, kasallik tarixini, to'lovlarini va qabullarini bitta joyda boshqarish imkonini beradi.

## ✨ Asosiy Xususiyatlar

### 1. **360-Degree Patient View** 
Bemorning to'liq ma'lumotlari bir sahifada:
- 📊 Statistika (tashriflar, tashxislar, to'lovlar, balans)
- 👤 Shaxsiy ma'lumotlar
- 🏥 Kasallik tarixi
- 💰 To'lovlar tarixi
- 📅 Qabullar tarixi

### 2. **Medical History (Kasallik Tarixi)**
- ✅ Tashxislar va alomatlar
- ✅ Retseptlar va tavsiyalar
- ✅ Tahlil natijalari
- ✅ Fayllar (Rentgen, tahlillar)
- ✅ Keyingi ko'rik sanasi
- ✅ Holat tracking (Faol/Hal qilindi/Davom etmoqda)

### 3. **Payment & Loyalty System**
- 💳 To'lovlar tarixi
- 🎁 Loyallik ballari (har 10,000 so'mga 1 ball)
- 🏆 Membership darajalari (Bronze, Silver, Gold, Platinum)
- 📊 Balans va qarz tracking
- 💰 Chegirma foizlari

### 4. **Enhanced Patient Model**
```javascript
{
  // Shaxsiy ma'lumotlar
  firstName, lastName, phone, email, dob, gender,
  bloodType, allergies, chronicDiseases,
  
  // Kasallik tarixi
  medicalHistory: [{
    date, doctorId, diagnosis, symptoms,
    prescription, labResults, notes,
    files: [{ type, filename, url }],
    followUpDate, status
  }],
  
  // Loyallik va balans
  loyaltyPoints, balance, discountPercent,
  membershipLevel,
  
  // To'lovlar tarixi
  paymentHistory: [{
    date, amount, paymentMethod,
    description, receiptNumber
  }]
}
```

## 🚀 API Endpoints

### Bemor CRUD
```
GET    /api/patients              - Bemorlar ro'yxati
POST   /api/patients              - Yangi bemor
GET    /api/patients/:id          - Bemor ma'lumotlari
PUT    /api/patients/:id          - Bemorni yangilash
DELETE /api/patients/:id          - Bemorni o'chirish (soft delete)
```

### Kasallik Tarixi
```
GET    /api/patients/:id/history                    - Kasallik tarixi
POST   /api/patients/:id/medical-record             - Yangi tashxis qo'shish
PUT    /api/patients/:id/medical-record/:recordId   - Tashxisni yangilash
DELETE /api/patients/:id/medical-record/:recordId   - Tashxisni o'chirish
```

### To'lovlar
```
GET    /api/patients/:id/payment-history  - To'lovlar tarixi
POST   /api/patients/:id/payment           - Yangi to'lov qo'shish
```

### To'liq Profil
```
GET    /api/patients/:id/full-profile      - 360-degree view
```

## 📱 Frontend Sahifalar

### 1. **Patient Profile** (`/patients/:id`)
- **Tabs:**
  - Umumiy Ma'lumot
  - Kasallik Tarixi
  - To'lovlar
  - Qabullar

- **Funksiyalar:**
  - Tashxis qo'shish modali
  - To'lov qo'shish modali
  - Fayllarni yuklash va ko'rish
  - Statistika kartochalari

### 2. **SimplePatients** (`/patients`)
- Bemorlar ro'yxati
- Qidiruv va filterlar
- Kartochkaga bosish → To'liq profil

## 🎨 Dizayn Xususiyatlari

### Yumshoq Pastel Ranglar
- 🟣 Avatar: `#a5b4fc` → `#c4b5fd`
- 🟢 Faol: `#d1fae5` / `#047857`
- 🔴 Nofaol: `#fecaca` / `#b91c1c`
- 🟡 Kutilmoqda: `#fef3c7` / `#92400e`

### Responsive Dizayn
- Desktop: Grid layout
- Tablet: 2 ustunli
- Mobile: 1 ustunli

## 💻 Ishlatish

### Backend
```bash
cd "c:\Users\user\Desktop\Klinika Crm"
npm run dev
```

### Frontend
```bash
cd "c:\Users\user\Desktop\Klinika Crm\klinika-crm-frontend"
npm run dev
```

### Brauzerda
```
http://localhost:5173/patients
```

## 📊 Workflow

### 1. Bemor Ro'yxatdan O'tkazish
```
Registratura → Bemorlar → Yangi Bemor → Ma'lumotlarni kiritish → Saqlash
```

### 2. Tashxis Qo'shish
```
Bemor Profili → Tashxis Qo'shish → Ma'lumotlarni kiritish → Saqlash
```

### 3. To'lov Qo'shish
```
Bemor Profili → To'lov Qo'shish → Summa va usul → Saqlash
→ Avtomatik loyallik ballari qo'shiladi
```

### 4. Kasallik Tarixini Ko'rish
```
Bemor Profili → Kasallik Tarixi tab → Barcha tashxislar ro'yxati
```

## 🔐 Xavfsizlik

- ✅ JWT autentifikatsiya
- ✅ Org-level data isolation
- ✅ Soft delete (ma'lumotlar saqlanadi)
- ✅ Input validation (Joi)

## 📈 Kelajakdagi Rejalar

### Mobil Ilova (Bemorlar uchun)
- [ ] Onlayn yozilish
- [ ] Tahlillarni ko'rish
- [ ] Push bildirishnomalar
- [ ] Shifokorni baholash

### Qo'shimcha Funksiyalar
- [ ] Fayllarni drag & drop yuklash
- [ ] QR kod generatsiya
- [ ] Email bildirishnomalar
- [ ] SMS eslatmalar
- [ ] Tahlil natijalarini PDF export

## 🐛 Muammolarni Hal Qilish

### Backend ishlamasa:
```bash
# Loglarni tekshiring
npm run dev

# MongoDB ulanishini tekshiring
# .env faylida MONGODB_URI to'g'riligini tekshiring
```

### Frontend ishlamasa:
```bash
# Node modules ni qayta o'rnating
rm -rf node_modules package-lock.json
npm install

# Cache ni tozalang
npm run dev -- --force
```

## 📞 Yordam

Muammo yuzaga kelsa:
1. Console loglarni tekshiring (F12)
2. Network tab'ni tekshiring
3. Backend terminalda xatolarni ko'ring

## ✅ Tayyor!

Endi sizda to'liq **Bemor Kartotekasi** tizimi bor:
- ✅ Backend API (MongoDB + Express)
- ✅ Frontend UI (React + Modern Design)
- ✅ Medical Records tracking
- ✅ Payment & Loyalty system
- ✅ 360-degree patient view

**Omad tilaymiz! 🎉**
