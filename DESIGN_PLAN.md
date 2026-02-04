# 🎨 KLINIKA CRM - TO'LIQ DIZAYN REJASI

## 📋 DIZAYN KONSEPSIYASI: "Modern Medical Hub"

### 🎯 Asosiy Tamoyillar:
1. **Ishonchli** - Tibbiy tizim sifatida
2. **Toza** - Minimal, charchatmaydigan
3. **Professional** - Zamonaviy va puxta
4. **Samarali** - Tez ishlash uchun optimallashtirilgan

---

## 🎨 DIZAYN TIZIMI (Design System)

### 1. RANGLAR PALITRASI

#### Primary Colors (Asosiy):
```css
--primary-500: #007AFF    /* Ishonchli ko'k */
--primary-600: #0066CC    /* Quyuqroq */
--primary-700: #0052A3    /* Eng quyuq */
--primary-100: #E5F2FF    /* Ochiq fon */
```

**Qo'llanilishi:**
- Asosiy tugmalar
- Havolalar
- Muhim elementlar
- Fokus holatlari

#### Medical Colors (Tibbiy):
```css
--medical-500: #00D1B2    /* Tibbiy zumrad */
--medical-100: #E0F9F5    /* Ochiq fon */
```

**Qo'llanilishi:**
- Muvaffaqiyatli holatlar
- Sog'liq ko'rsatkichlari
- Ijobiy natijalar

#### Status Colors (Holat ranglari):
```css
--success: #34C759       /* Muvaffaqiyat */
--warning: #FF9500       /* Ogohlantirish */
--danger: #FF3B30        /* Xavfli/Shoshilinch */
--info: #5AC8FA          /* Ma'lumot */
```

**Qo'llanilishi:**
- Badge'lar
- Statuslar
- Bildirishnomalar

#### Neutral Colors (Neytral):
```css
--gray-900: #1A202C      /* Qora matn */
--gray-700: #4A5568      /* Oddiy matn */
--gray-500: #A0AEC0      /* Muted matn */
--gray-300: #E2E8F0      /* Border */
--gray-100: #F7FAFC      /* Ochiq fon */
--gray-50: #F8FAFC       /* Background */
```

---

### 2. TIPOGRAFIYA

#### Shriftlar:
```css
--font-family: 'Inter', -apple-system, sans-serif;
--font-mono: 'SF Mono', 'Monaco', monospace;
```

**Sabab:**
- Inter - zamonaviy, o'qish uchun qulay
- Raqamlar va jadvallar uchun aniq
- Professional ko'rinish

#### O'lchamlar:
```css
--text-xs: 12px      /* Kichik matn */
--text-sm: 14px      /* Oddiy matn */
--text-base: 16px    /* Asosiy matn */
--text-lg: 18px      /* Katta matn */
--text-xl: 20px      /* Sarlavhalar */
--text-2xl: 24px     /* Katta sarlavhalar */
--text-3xl: 30px     /* Asosiy sarlavhalar */
```

#### Og'irliklar:
```css
--font-normal: 400   /* Oddiy */
--font-medium: 500   /* O'rtacha */
--font-semibold: 600 /* Yarim qalin */
--font-bold: 700     /* Qalin */
```

---

### 3. KOMPONENTLAR

#### A) Tugmalar (Buttons):

**Primary Button:**
```jsx
<button className="btn btn-primary">
  Saqlash
</button>
```
- Ko'k fon (#007AFF)
- Oq matn
- Hover: ko'tarilish effekti
- Active: bosish effekti

**Secondary Button:**
```jsx
<button className="btn btn-secondary">
  Bekor qilish
</button>
```
- Oq fon
- Kulrang border
- Hover: kulrang fon

**Ghost Button:**
```jsx
<button className="btn btn-ghost">
  Ko'rish
</button>
```
- Shaffof fon
- Hover: ochiq kulrang

**Danger Button:**
```jsx
<button className="btn btn-danger">
  O'chirish
</button>
```
- Qizil fon (#FF3B30)
- Oq matn

**O'lchamlar:**
```jsx
<button className="btn btn-sm">Kichik</button>
<button className="btn">Oddiy</button>
<button className="btn btn-lg">Katta</button>
```

---

#### B) Input Maydonlari:

**Oddiy Input:**
```jsx
<input 
  type="text" 
  className="input" 
  placeholder="Ism kiriting"
/>
```

**Fokus holati:**
- Ko'k border
- Ko'k shadow (glow)

**Xatolik holati:**
```jsx
<input className="input input-error" />
```
- Qizil border
- Qizil shadow

**Muvaffaqiyat holati:**
```jsx
<input className="input input-success" />
```
- Yashil border
- Yashil shadow

---

#### C) Badge'lar (Statuslar):

```jsx
<span className="badge badge-success">To'landi</span>
<span className="badge badge-warning">Kutilmoqda</span>
<span className="badge badge-danger">Bekor qilindi</span>
<span className="badge badge-info">Yangi</span>
<span className="badge badge-gray">Arxivlangan</span>
```

**Dizayn:**
- Yumaloq burchaklar
- Kichik padding
- Qalin shrift
- Mos rang sxemasi

---

#### D) Kartalar (Cards):

```jsx
<div className="card">
  <div className="card-header">
    <h3>Sarlavha</h3>
  </div>
  <div className="card-body">
    Kontent
  </div>
  <div className="card-footer">
    Footer
  </div>
</div>
```

**Xususiyatlar:**
- Oq fon
- Yumaloq burchaklar (12px)
- Soya effekti
- Border (kulrang)

---

#### E) Jadvallar (Tables):

```jsx
<table className="table table-compact">
  <thead>
    <tr>
      <th>ISM</th>
      <th>TELEFON</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Ali Valiyev</td>
      <td>+998 90 123 45 67</td>
    </tr>
  </tbody>
</table>
```

**Xususiyatlar:**
- Compact mode (ko'p ma'lumot uchun)
- Hover effekti
- Zebra striping (ixtiyoriy)
- Sticky header

---

## 📱 SAHIFALAR DIZAYNI

### 1. RECEPTION DASHBOARD ✅ (Tayyor)

**Layout:**
```
┌─────────────────────────────────────────┐
│  Header (Sarlavha + Vaqt + Bildirishnoma) │
├─────────────────────────────────────────┤
│  Quick Actions (4 ta katta tugma)       │
├─────────────────────────────────────────┤
│  Stats Cards (4 ta statistika kartasi)  │
├─────────────────────────────────────────┤
│  ┌──────────────┬──────────────┐        │
│  │ Bugungi      │ Oxirgi       │        │
│  │ Qabullar     │ Bemorlar     │        │
│  │ (Timeline)   │ (List)       │        │
│  └──────────────┴──────────────┘        │
├─────────────────────────────────────────┤
│  Activity Feed (So'nggi faoliyat)       │
└─────────────────────────────────────────┘
```

**Elementlar:**
- ✅ Tezkor amallar (Yangi bemor, Qabul, Qidiruv, To'lov)
- ✅ Statistika (Bemorlar, Qabullar, Tushum, Navbat)
- ✅ Timeline (Bugungi qabullar)
- ✅ Bemorlar ro'yxati
- ✅ Faoliyat lenti

---

### 2. DOCTOR ROOM (Shifokor Xonasi)

**Layout:**
```
┌─────────────────────────────────────────┐
│  Bemor Ma'lumotlari (Chap ustun)        │
│  ┌─────────────┐                        │
│  │ Foto        │  Ism: Ali Valiyev      │
│  │             │  Yosh: 35              │
│  └─────────────┘  Tel: +998...          │
├─────────────────────────────────────────┤
│  Tabs: Tibbiy Tarix | Tahlillar | Fayllar│
├─────────────────────────────────────────┤
│  ┌──────────────┬──────────────┐        │
│  │ Xizmatlar    │ To'lov       │        │
│  │ Tanlash      │ Hisoblash    │        │
│  └──────────────┴──────────────┘        │
├─────────────────────────────────────────┤
│  Tashxis va Retsept Yozish              │
└─────────────────────────────────────────┘
```

**Elementlar:**
- Bemor profili (rasm, ism, yosh, telefon)
- Tibbiy tarix (timeline)
- Xizmatlar savatchasi (drag-and-drop)
- To'lov kalkulyatori
- Tashxis maydoni (rich text editor)
- Retsept printlash

---

### 3. QUEUE DISPLAY (Ommaviy Ekran)

**Layout (TV uchun):**
```
┌─────────────────────────────────────────┐
│  🏥 KLINIKA NAVBAT TIZIMI               │
│                          20:45:30       │
├─────────────────────────────────────────┤
│  ┌──────────────┬──────────────┐        │
│  │ TERAPEVT     │ KARDIOLOG    │        │
│  │              │              │        │
│  │ Hozir:       │ Hozir:       │        │
│  │ №15 A.V.     │ №23 M.K.     │        │
│  │              │              │        │
│  │ Navbatda:    │ Navbatda:    │        │
│  │ №16, №17...  │ №24, №25...  │        │
│  └──────────────┴──────────────┘        │
└─────────────────────────────────────────┘
```

**Xususiyatlar:**
- Katta shriftlar (ko'rish uchun qulay)
- Rang kodlash (har bir bo'lim uchun)
- Animatsiya (yangi bemor chaqirilganda)
- Ovozli bildirishnoma
- Real-time yangilanish (3 soniyada)

---

### 4. PATIENTS PROFILE (Bemor Profili)

**Layout:**
```
┌─────────────────────────────────────────┐
│  ← Orqaga    Ali Valiyev    Tahrirlash  │
├─────────────────────────────────────────┤
│  ┌──────┐                               │
│  │ Foto │  Ism: Ali Valiyev             │
│  │      │  Yosh: 35                     │
│  └──────┘  Tel: +998 90 123 45 67       │
│            Qarz: 500,000 so'm           │
├─────────────────────────────────────────┤
│  Tabs: Qabullar | To'lovlar | Tahlillar │
├─────────────────────────────────────────┤
│  ┌──────────────┬──────────────┐        │
│  │ Tibbiy       │ Statistika   │        │
│  │ Tarix        │              │        │
│  │ (Timeline)   │ - Qabullar: 12│        │
│  │              │ - To'lovlar: 8│        │
│  │              │ - Qarz: 500K  │        │
│  └──────────────┴──────────────┘        │
└─────────────────────────────────────────┘
```

**Elementlar:**
- Bemor ma'lumotlari (yuqorida)
- Tablar (Qabullar, To'lovlar, Tahlillar)
- Timeline (tibbiy tarix)
- Statistika kartasi
- Qarz tracking
- Fayllar (rasmlar, PDF)

---

### 5. PAYMENTS & CASHIER (To'lovlar)

**Layout (POS terminaliga o'xshash):**
```
┌─────────────────────────────────────────┐
│  Xizmatlar Savatchasi                   │
│  ┌─────────────────────────────────┐    │
│  │ 1. Konsultatsiya    100,000 ₴   │    │
│  │ 2. EKG              50,000 ₴    │    │
│  │ 3. Qon tahlili      75,000 ₴    │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Jami:              225,000 so'm        │
│  Chegirma:          -25,000 so'm        │
│  ─────────────────────────────────      │
│  TO'LOV:            200,000 so'm        │
│                                         │
│  ┌──────┬──────┬──────┐                 │
│  │ Naqd │ Karta│ Qarz │                 │
│  └──────┴──────┴──────┘                 │
│                                         │
│  [Check Chiqarish]                      │
└─────────────────────────────────────────┘
```

**Xususiyatlar:**
- Xizmatlar savatchasi
- Real-time hisoblash
- Chegirma kiritish
- To'lov usuli (Naqd/Karta/Qarz)
- Check printlash
- Qarz tracking

---

## 🗺️ DIZAYN REJASI (7 KUN)

### KUN 1: DESIGN SYSTEM ✅
- [x] Ranglar palitrasi
- [x] Tipografiya
- [x] Komponentlar (Button, Input, Badge, Card, Table)
- [x] CSS variables
- [x] Utility classes

### KUN 2: RECEPTION DASHBOARD ✅
- [x] Layout yaratish
- [x] Quick Actions
- [x] Stats Cards
- [x] Appointments Timeline
- [x] Recent Patients
- [x] Activity Feed

### KUN 3: DOCTOR ROOM
- [ ] Bemor profili komponenti
- [ ] Tibbiy tarix timeline
- [ ] Xizmatlar savatchasi
- [ ] To'lov kalkulyatori
- [ ] Tashxis maydoni

### KUN 4: QUEUE DISPLAY
- [ ] TV layout (fullscreen)
- [ ] Department kartalar
- [ ] Real-time yangilanish
- [ ] Animatsiyalar
- [ ] Ovozli bildirishnoma

### KUN 5: PATIENTS PROFILE
- [ ] Bemor ma'lumotlari
- [ ] Tablar (Qabullar, To'lovlar, Tahlillar)
- [ ] Timeline
- [ ] Statistika
- [ ] Fayllar

### KUN 6: PAYMENTS & CASHIER
- [ ] Xizmatlar savatchasi
- [ ] Hisoblash komponenti
- [ ] To'lov usullari
- [ ] Check printlash
- [ ] Qarz tracking

### KUN 7: QOLGAN SAHIFALAR
- [ ] Appointments (Kalendar)
- [ ] Reports (Hisobotlar)
- [ ] Settings (Sozlamalar)
- [ ] Polishing va optimizatsiya

---

## 📱 TELEGRAM MINI APP (TMA)

### Layout:
```
┌─────────────────────┐
│  Asosiy  Navbat  ⚙️ │ ← Tab Bar
├─────────────────────┤
│                     │
│  [QR Code Scanner]  │
│                     │
│  Check-in qilish    │
│                     │
├─────────────────────┤
│  Mening Qabullarim  │
│  ┌─────────────────┐│
│  │ 15-Fevral       ││
│  │ Dr. Aliyev      ││
│  │ 14:00           ││
│  └─────────────────┘│
└─────────────────────┘
```

**Xususiyatlar:**
- QR kod orqali check-in
- Qabullar ro'yxati
- Navbat holati
- Bildirishnomalar
- Shifokorlar ro'yxati

---

## 🎯 KEYINGI QADAMLAR

### 1. Design System'ni Import Qilish:
```jsx
// App.jsx yoki index.jsx da
import './styles/design-system.css';
```

### 2. Reception Dashboard'ni Test Qilish:
```bash
npm run dev
# http://localhost:5173/reception
```

### 3. Qolgan Sahifalarni Ketma-ket Yaratish:
- Doctor Room
- Queue Display
- Patients Profile
- Payments & Cashier

### 4. Figma'da Maketlar Yaratish (Ixtiyoriy):
- Design System asosida
- Har bir sahifa uchun
- Interaktiv prototip

---

## 📚 RESURSLAR

### Shriftlar:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### Ikonlar:
```bash
npm install react-icons
```

### Komponentlar:
- Barcha komponentlar `design-system.css` da
- Utility classes ishlatish
- Consistent dizayn

---

## ✅ XULOSA

**Tayyor:**
- ✅ Design System (to'liq)
- ✅ Reception Dashboard (to'liq)
- ✅ Ranglar, tipografiya, komponentlar

**Keyingi:**
- 🔄 Doctor Room (3-kun)
- 🔄 Queue Display (4-kun)
- 🔄 Patients Profile (5-kun)
- 🔄 Payments & Cashier (6-kun)

**Natija:**
- 🎨 Professional dizayn
- 🚀 Zamonaviy interfeys
- 💪 Ishonchli tizim
- 📱 Responsive layout

---

**Qaysi sahifani keyingi yaratamiz?** 🚀

1. Doctor Room (Shifokor xonasi)
2. Queue Display (Ommaviy ekran)
3. Patients Profile (Bemor profili)
4. Payments & Cashier (To'lovlar)

Tanlang! 👇
