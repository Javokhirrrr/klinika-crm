# 🚂 Railway.app - Qadamma-Qadam Deploy

## 📍 HOZIRGI HOLAT: GitHub Ulash

### 1️⃣ **"Configure GitHub App" tugmasini bosing**

Screenshot'da ko'rinib turgan "⚙️ Configure GitHub App" tugmasini bosing.

### 2️⃣ **GitHub Authorization**

1. GitHub login sahifasi ochiladi
2. Username va parol kiriting (agar kirilmagan bo'lsa)
3. "Authorize Railway" tugmasini bosing

### 3️⃣ **Repository Access**

Railway sizdan so'raydi:

**Variant A: Barcha repository'lar (Tavsiya emas)**
- ⚠️ "All repositories" - Barcha proyektlaringizga access

**Variant B: Faqat kerakli repository (Tavsiya)**
- ✅ "Only select repositories"
- ✅ "klinika-crm" ni tanlang
- ✅ "Install & Authorize"

### 4️⃣ **Repository Tanlash**

Railway'ga qaytasiz:

1. Search box'da "klinika" yozing
2. "klinika-crm" repository paydo bo'ladi
3. Repository'ni bosing

### 5️⃣ **Deploy Boshlash**

Railway avtomatik:
- ✅ Repository'ni clone qiladi
- ✅ `package.json` ni detect qiladi
- ✅ Node.js environment sozlaydi
- ✅ Deploy boshlaydi

---

## 🎯 **KEYINGI QADAM: MongoDB Qo'shish**

Deploy boshlangach:

### 1️⃣ **MongoDB Service Qo'shish**

1. Proyekt sahifasida "New" tugmasini bosing
2. "Database" → "Add MongoDB"
3. Railway avtomatik MongoDB yaratadi (1-2 daqiqa)

### 2️⃣ **Environment Variables Sozlash**

Backend service'ni bosing:
1. "Variables" tab
2. Quyidagilarni qo'shing:

```env
NODE_ENV=production
PORT=3000
MONGO_URI=${{MongoDB.MONGO_URL}}
JWT_ACCESS_SECRET=your_secret_here_min_32_chars
JWT_REFRESH_SECRET=another_secret_here_min_32_chars
JWT_ACCESS_EXPIRES=30m
JWT_REFRESH_EXPIRES=30d
CORS_ORIGINS=*
PUBLIC_BASE_URL=${{RAILWAY_PUBLIC_DOMAIN}}
ORG_CODE_BASE=150000
```

**Secret yaratish:**
```bash
# Git Bash'da:
openssl rand -base64 48
```

### 3️⃣ **Public Domain Yaratish**

1. Backend service → "Settings"
2. "Networking" → "Generate Domain"
3. URL: `klinika-backend.up.railway.app`

---

## 🎨 **FRONTEND DEPLOY (Vercel - Tavsiya)**

Railway'da backend ishlayotganda, frontend'ni Vercel'da deploy qiling:

### 1️⃣ **Vercel'ga O'tish**

1. https://vercel.com
2. "Sign Up with GitHub"
3. GitHub'ga ruxsat bering

### 2️⃣ **Proyekt Import Qilish**

1. "Import Project" → "Import Git Repository"
2. "klinika-crm" ni tanlang
3. "Import"

### 3️⃣ **Sozlamalar**

1. **Framework Preset:** Vite
2. **Root Directory:** `klinika-crm-frontend`
3. **Build Command:** `npm run build`
4. **Output Directory:** `dist`

### 4️⃣ **Environment Variables**

```env
VITE_API_URL=https://klinika-backend.up.railway.app
```

(Railway backend URL'ini kiriting)

### 5️⃣ **Deploy**

"Deploy" tugmasini bosing - 2-3 daqiqa!

---

## 👤 **ADMIN USER YARATISH**

### Variant A: Railway CLI (Tavsiya)

```bash
# 1. Railway CLI o'rnatish
npm install -g @railway/cli

# 2. Login
railway login

# 3. Proyektga ulaning
cd "C:\Users\user\Desktop\Klinika Crm"
railway link

# 4. Admin yaratish
railway run node scripts/seedAdmin.js admin@clinic.uz admin123 "Admin"
```

### Variant B: MongoDB Compass

1. MongoDB Compass yuklab oling
2. Railway MongoDB connection string'ni oling
3. Connect qiling
4. `users` collection yarating
5. Admin user qo'shing

---

## ✅ **TEKSHIRISH**

### 1️⃣ **Backend:**
```
https://klinika-backend.up.railway.app/api/health
```

Natija:
```json
{"ok": true}
```

### 2️⃣ **Frontend:**
```
https://klinika-crm.vercel.app
```

### 3️⃣ **Login:**
```
Email: admin@clinic.uz
Parol: admin123
```

---

## 🆘 **MUAMMO BO'LSA:**

### "No repositories found"
→ "Configure GitHub App" bosing va ruxsat bering

### Deploy failed
→ Logs'ni tekshiring: Service → Deployments → View Logs

### Database connection error
→ Environment variables to'g'rimi tekshiring

---

## 💰 **XARAJATLAR:**

```
Backend (Railway):     ~$3/mo
Frontend (Vercel):     $0 (bepul)
MongoDB (Railway):     ~$5/mo

Railway $5 kredit:     -$5
─────────────────────────────
JAMI:                  ~$3/mo

MongoDB Atlas bilan:   $0 (BEPUL!)
```

---

## 📞 **YORDAM:**

Qadamda qolib qolsangiz:
1. Screenshot yuboring
2. Qaysi qadamda ekanligingizni ayting
3. Error message bormi?

**Omad! 🚀**
