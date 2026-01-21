# 🏥 Klinika CRM

> **Professional Clinic Management System** - To'liq funksional klinika boshqaruv tizimi

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green.svg)](https://www.mongodb.com/)

---

## 📋 **Loyiha Haqida**

Klinika CRM - bu zamonaviy klinikalar uchun mo'ljallangan to'liq funksional boshqaruv tizimi. Bemorlar, shifokorlar, uchrashuvlar, to'lovlar va boshqa barcha klinika jarayonlarini boshqarish uchun qulay interfeys va kuchli backend.

### **Asosiy Xususiyatlar:**

- ✅ **Bemorlar boshqaruvi** - To'liq bemor ma'lumotlari bazasi
- ✅ **Uchrashuvlar tizimi** - Shifokor uchrashuvlarini rejalashtirish
- ✅ **To'lovlar va hisob-kitob** - Moliyaviy operatsiyalar
- ✅ **Navbat tizimi** - Real-time navbat boshqaruvi
- ✅ **Davomat nazorati** - Xodimlar davomati
- ✅ **Komissiya hisoblash** - Shifokorlar uchun avtomatik hisoblash
- ✅ **Analytics va Hisobotlar** - Keng qamrovli tahlil
- ✅ **Telegram Bot** - Bildirishnomalar va integratsiya
- ✅ **Multi-language** - O'zbek, Rus, Ingliz tillari

---

## 🚀 **Texnologiyalar**

### **Backend:**
- Node.js 18+
- Express.js
- MongoDB 7.0
- Mongoose ODM
- JWT Authentication
- Socket.IO (Real-time)
- Telegram Bot API

### **Frontend:**
- React 18
- Vite
- React Router v6
- Axios
- i18next (Multi-language)
- CSS3 (Modern UI)

### **DevOps:**
- Docker & Docker Compose
- Nginx (Reverse Proxy)
- Let's Encrypt SSL
- PM2 (Process Manager)

---

## 📦 **O'rnatish**

### **1. Repository'ni clone qiling:**

```bash
git clone https://github.com/YOUR_USERNAME/klinika-crm.git
cd klinika-crm
```

### **2. Environment variables sozlang:**

```bash
# Backend
cp .env.example .env
# .env faylini tahrirlang va o'z ma'lumotlaringizni kiriting

# Frontend
cd klinika-crm-frontend
cp .env.example .env
# VITE_API_URL ni sozlang
```

### **3. Dependencies o'rnating:**

```bash
# Backend
npm install

# Frontend
cd klinika-crm-frontend
npm install
```

### **4. MongoDB ishga tushiring:**

```bash
# Docker bilan (tavsiya):
docker run -d -p 27017:27017 --name klinika-mongodb mongo:7

# Yoki local MongoDB ishlatish
```

### **5. Admin user yarating:**

```bash
node scripts/seedAdmin.js admin@clinic.uz admin123 "Admin User"
```

### **6. Ishga tushiring:**

```bash
# Backend (terminal 1)
npm run dev

# Frontend (terminal 2)
cd klinika-crm-frontend
npm run dev
```

**Tayyor!** 🎉
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- API Docs: http://localhost:5000/api/docs

---

## 🐳 **Docker bilan ishga tushirish**

### **Development:**

```bash
docker-compose -f docker-compose.dev.yml up -d
```

### **Production:**

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## 📚 **Dokumentatsiya**

- 📖 [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Production'ga deploy qilish
- 🖥️ [Server Recommendations](./SERVER_RECOMMENDATIONS.md) - Server tanlash
- 📝 [Next Steps](./NEXT_STEPS.md) - Keyingi qadamlar
- 🔧 [API Documentation](http://localhost:5000/api/docs) - Swagger API docs

---

## 🔑 **Default Login**

```
Email: admin@clinic.uz
Parol: admin123
```

**⚠️ MUHIM:** Production'da parolni o'zgartiring!

---

## 📁 **Loyiha Strukturasi**

```
klinika-crm/
├── src/
│   ├── config/          # Konfiguratsiya
│   ├── controllers/     # Business logic
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middlewares/     # Express middlewares
│   ├── services/        # Business services
│   ├── socket/          # WebSocket handlers
│   └── index.js         # Entry point
├── klinika-crm-frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── api/         # API calls
│   │   ├── store/       # State management
│   │   └── App.jsx      # Main app
│   └── public/
├── scripts/             # Utility scripts
├── swagger/             # API documentation
├── docker-compose.yml   # Docker config
└── README.md
```

---

## 🧪 **Test Ma'lumotlar**

Test ma'lumotlar yaratish:

```bash
# Barcha test ma'lumotlarni yaratish
node scripts/seedTestData.js

# Test ma'lumotlarni tozalash
node scripts/cleanTestData.js
```

Bu yaratadi:
- ✅ 8 ta xizmat
- ✅ 3 ta shifokor
- ✅ 5 ta bemor
- ✅ 5 ta uchrashov
- ✅ 3 ta to'lov
- ✅ 15 ta davomat yozuvi
- ✅ 3 ta navbat yozuvi
- ✅ 3 ta komissiya yozuvi

---

## 🛠️ **Development**

### **Backend development:**

```bash
npm run dev          # Development server
npm run start        # Production server
npm run lint         # Code linting
```

### **Frontend development:**

```bash
cd klinika-crm-frontend
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build
```

---

## 🚢 **Production Deployment**

To'liq deployment qo'llanmasi: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

### **Qisqacha:**

1. VPS server sotib oling (Hetzner/DigitalOcean)
2. Domain sotib oling
3. Server'ga SSH orqali ulaning
4. Docker o'rnating
5. Repository'ni clone qiling
6. Environment variables sozlang
7. SSL sertifikat o'rnating
8. Deploy qiling

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## 📊 **Xususiyatlar**

### **Bemorlar:**
- CRUD operatsiyalar
- Tibbiy tarix
- Qidiruv va filter
- Export (Excel/PDF)

### **Uchrashuvlar:**
- Kalendar ko'rinishi
- Status tracking
- Eslatmalar (Telegram)
- Recurring appointments

### **To'lovlar:**
- Naqd/Karta/Transfer
- Installment rejalar
- Invoice yaratish
- Moliyaviy hisobotlar

### **Navbat:**
- Real-time yangilanish
- Ommaviy ekran
- Department bo'yicha
- Priority tizimi

### **Analytics:**
- Daromad statistikasi
- Shifokor performance
- Bemor demographics
- Custom hisobotlar

---

## 🔒 **Xavfsizlik**

- ✅ JWT Authentication
- ✅ Password hashing (bcrypt)
- ✅ Input sanitization
- ✅ Rate limiting
- ✅ CORS protection
- ✅ Helmet.js security headers
- ✅ Environment variables

---

## 🤝 **Contributing**

Contributions are welcome! Please:

1. Fork qiling
2. Feature branch yarating (`git checkout -b feature/AmazingFeature`)
3. Commit qiling (`git commit -m 'Add some AmazingFeature'`)
4. Push qiling (`git push origin feature/AmazingFeature`)
5. Pull Request oching

---

## 📝 **License**

MIT License - [LICENSE](LICENSE) faylini ko'ring

---

## 👨‍💻 **Muallif**

**Sizning Ismingiz**
- GitHub: [@yourusername](https://github.com/Javokhirrrr)
- Email: your.email@example.com

---

## 🙏 **Minnatdorchilik**

- [Express.js](https://expressjs.com/)
- [React](https://react.dev/)
- [MongoDB](https://www.mongodb.com/)
- [Docker](https://www.docker.com/)

---

## 📞 **Qo'llab-quvvatlash**

Muammo bo'lsa yoki savol tug'ilsa:

1. [Issues](https://github.com/yourusername/klinika-crm/issues) ochish
2. [Discussions](https://github.com/yourusername/klinika-crm/discussions) da muhokama qilish
3. Email yuborish

---

## 🗺️ **Roadmap**

- [ ] Mobile app (React Native)
- [ ] SMS notifications
- [ ] WhatsApp integration
- [ ] Advanced reporting
- [ ] Multi-clinic support
- [ ] Patient portal
- [ ] Telemedicine features

---

**⭐ Agar loyiha yoqsa, star bering!**

---

Made with ❤️ in Uzbekistan 🇺🇿
