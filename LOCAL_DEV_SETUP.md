# 🚀 Lokal Development Setup

> Klinika CRM'ni lokal kompyuterda ishga tushirish qo'llanmasi

---

## 📋 Kerakli Narsalar

- ✅ Node.js (v18+)
- ✅ MongoDB (lokal yoki Atlas)
- ✅ Git

---

## 🔧 1. BACKEND ISHGA TUSHIRISH

### Terminal 1: Backend

```bash
# 1. Backend papkasiga kiring
cd "c:\Users\user\Desktop\Klinika Crm"

# 2. Environment variables tekshiring
# .env faylida quyidagilar bo'lishi kerak:
# PORT=5000
# MONGO_URI=mongodb+srv://...
# JWT_ACCESS_SECRET=...
# JWT_REFRESH_SECRET=...

# 3. Dependencies o'rnatish (birinchi marta)
npm install

# 4. Backend'ni ishga tushiring
npm run dev
```

**Natija:**
```
✅ Server running on http://localhost:5000
✅ MongoDB connected
```

---

## 🎨 2. FRONTEND ISHGA TUSHIRISH

### Terminal 2: Frontend

```bash
# 1. Frontend papkasiga kiring
cd "c:\Users\user\Desktop\Klinika Crm\klinika-crm-frontend"

# 2. Environment variables tekshiring
# .env faylida:
# VITE_API_URL=http://localhost:5000

# 3. Dependencies o'rnatish (birinchi marta)
npm install

# 4. Frontend'ni ishga tushiring
npm run dev
```

**Natija:**
```
✅ VITE v5.x.x ready in xxx ms
✅ Local: http://localhost:5173
✅ Network: use --host to expose
```

---

## 🌐 3. BROWSER'DA OCHISH

### Frontend:
```
http://localhost:5173
```

### Backend API:
```
http://localhost:5000/api
```

### API Test:
```
http://localhost:5000/api/health
```

---

## 🔑 4. LOGIN QILISH

### Test User (agar mavjud bo'lsa):
```
Email: admin@klinika.uz
Password: admin123
```

### Yoki yangi user yaratish:
```
POST http://localhost:5173/register
```

---

## 🐛 5. MUAMMOLARNI HAL QILISH

### ❌ Backend ishlamasa:

**Muammo:** `ECONNREFUSED MongoDB`
```bash
# MongoDB Atlas connection string tekshiring
# .env faylida MONGO_URI to'g'ri bo'lishi kerak
```

**Muammo:** `Port 5000 already in use`
```bash
# Boshqa port ishlatish
# .env faylida: PORT=5001
# Frontend .env faylida: VITE_API_URL=http://localhost:5001
```

---

### ❌ Frontend ishlamasa:

**Muammo:** `Cannot connect to backend`
```bash
# Backend ishlab turganini tekshiring
# Browser console'da error'larni ko'ring
# VITE_API_URL to'g'ri bo'lishi kerak
```

**Muammo:** `CORS error`
```bash
# Backend src/index.js faylida CORS sozlamalari:
# app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
```

---

## 📊 6. DEVELOPMENT WORKFLOW

### Hot Reload:

**Backend:**
- Kod o'zgarganda avtomatik restart (nodemon)
- `npm run dev` ishlatilsa

**Frontend:**
- Kod o'zgarganda avtomatik reload (Vite)
- Browser avtomatik yangilanadi

---

## 🔄 7. TERMINAL COMMANDS

### Backend Terminal:
```bash
# Ishga tushirish
npm run dev

# Production mode
npm start

# Logs ko'rish
# Terminal'da ko'rsatiladi
```

### Frontend Terminal:
```bash
# Ishga tushirish
npm run dev

# Build qilish
npm run build

# Preview (build'dan keyin)
npm run preview
```

---

## 📁 8. FOLDER STRUCTURE

```
Klinika Crm/
├── src/                    # Backend
│   ├── index.js           # Server entry
│   ├── controllers/       # API controllers
│   ├── models/            # MongoDB models
│   └── routes/            # API routes
├── klinika-crm-frontend/  # Frontend
│   ├── src/
│   │   ├── pages/         # React pages
│   │   ├── components/    # React components
│   │   └── index.css      # Styles
│   └── .env               # Frontend env
└── .env                   # Backend env
```

---

## 🎯 9. QUICK START (Tez Boshlash)

### PowerShell (2 ta terminal):

**Terminal 1 (Backend):**
```powershell
cd "c:\Users\user\Desktop\Klinika Crm"
npm run dev
```

**Terminal 2 (Frontend):**
```powershell
cd "c:\Users\user\Desktop\Klinika Crm\klinika-crm-frontend"
npm run dev
```

**Browser:**
```
http://localhost:5173
```

---

## ✅ 10. TEKSHIRISH

### Backend ishlayaptimi?
```bash
curl http://localhost:5000/api/health
# yoki browser'da: http://localhost:5000/api/health
```

### Frontend ishlayaptimi?
```
Browser: http://localhost:5173
```

### API ishlayaptimi?
```
Browser console'da:
fetch('http://localhost:5000/api/health').then(r => r.json()).then(console.log)
```

---

## 🔐 11. ENVIRONMENT VARIABLES

### Backend (.env):
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://your-connection-string
JWT_ACCESS_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
```

### Frontend (.env):
```env
VITE_API_URL=http://localhost:5000
```

---

## 📝 12. NOTES

- ✅ Backend port: **5000**
- ✅ Frontend port: **5173** (Vite default)
- ✅ Hot reload: **enabled**
- ✅ CORS: **configured**
- ✅ MongoDB: **Atlas yoki local**

---

## 🚨 IMPORTANT

1. **Backend birinchi ishga tushiring**, keyin frontend
2. **MongoDB connection** to'g'ri bo'lishi kerak
3. **Environment variables** to'ldirilgan bo'lishi kerak
4. **Port 5000 va 5173** bo'sh bo'lishi kerak

---

**Muvaffaqiyatli development!** 🎉
