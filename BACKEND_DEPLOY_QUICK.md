# Backend Deployment - Tezkor Yo'riqnoma

## 🚀 Eng Oson Yo'l: Railway.app (Tavsiya)

### 1. Railway Account Yaratish
1. [railway.app](https://railway.app) ga o'ting
2. "Login with GitHub" tugmasini bosing
3. GitHub'ga ruxsat bering
4. ✅ $5 bepul kredit olasiz!

### 2. Yangi Proyekt Yaratish
1. Dashboard → **"New Project"**
2. **"Deploy from GitHub repo"**
3. Repository tanlang: `Javokhirrrr/klinika-crm`
4. Railway GitHub'ga access so'raydi → **"Authorize"**

### 3. MongoDB Qo'shish
1. Proyekt ichida → **"New"** → **"Database"** → **"Add MongoDB"**
2. 1-2 daqiqa kuting (avtomatik yaratiladi)
3. MongoDB service → **"Variables"** tab → `MONGO_URL` ni nusxalang

### 4. Environment Variables Sozlash

Backend service → **"Variables"** tab → Quyidagilarni qo'shing:

```env
NODE_ENV=production
PORT=5000
MONGO_URI=${{MongoDB.MONGO_URL}}
JWT_ACCESS_SECRET=<GENERATE_SECRET>
JWT_REFRESH_SECRET=<GENERATE_SECRET>
JWT_ACCESS_EXPIRES=30m
JWT_REFRESH_EXPIRES=30d
CORS_ORIGINS=https://your-frontend.vercel.app
PUBLIC_BASE_URL=${{RAILWAY_PUBLIC_DOMAIN}}
ORG_CODE_BASE=150000
```

**Secret yaratish (Git Bash yoki PowerShell):**
```bash
# Git Bash:
openssl rand -base64 48

# PowerShell:
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 5. Public Domain Yaratish
1. Backend service → **"Settings"** → **"Networking"**
2. **"Generate Domain"** tugmasini bosing
3. URL: `klinika-backend-production.up.railway.app`
4. Bu URL'ni nusxalang!

### 6. Frontend'ni Yangilash

Vercel dashboard'da environment variable qo'shing:
```
VITE_API_URL=https://klinika-backend-production.up.railway.app
```

Keyin Vercel'da **"Redeploy"** qiling.

### 7. Admin User Yaratish

**Variant A: Railway CLI (Oson)**

```bash
# 1. Railway CLI o'rnatish
npm install -g @railway/cli

# 2. Login
railway login

# 3. Proyektga ulaning
cd "C:\Users\user\Desktop\Klinika Crm"
railway link

# 4. Admin yaratish
railway run npm run seed:admin
```

**Variant B: MongoDB Compass (GUI)**

1. [MongoDB Compass](https://www.mongodb.com/try/download/compass) yuklab oling
2. Railway → MongoDB → "Connect" → Connection string nusxalang
3. Compass'da "New Connection" → String paste qiling
4. Database: `klinika_crm` → Collection: `users` yarating
5. `scripts/seedAdmin.js` faylini local ishlatib admin yarating

---

## 💰 Xarajatlar

### Eng Arzon Setup (BEPUL!):
```
✅ Backend: Railway ($3/mo)
✅ Frontend: Vercel (bepul)
✅ Database: MongoDB Atlas M0 (bepul - tavsiya)
─────────────────────────────
JAMI: $3/mo - $5 kredit = BEPUL! 🎉
```

### MongoDB Atlas'ni Ishlatish (Tavsiya):

1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) ga ro'yxatdan o'ting
2. **"Create Free Cluster"** (M0 - bepul)
3. Database User yarating
4. Network Access → **"Allow Access from Anywhere"** (0.0.0.0/0)
5. **"Connect"** → Connection string nusxalang
6. Railway'da `MONGO_URI` ni yangilang

---

## ⚠️ Muhim Eslatmalar

1. **JWT Secrets** - Har doim yangi, kuchli secretlar yarating!
2. **CORS** - Frontend URL'ni to'g'ri kiriting
3. **MongoDB** - Production uchun MongoDB Atlas ishlatish tavsiya etiladi
4. **Monitoring** - Railway logs'ni muntazam tekshiring

---

## 🆘 Muammolar?

### Deploy failed:
- Logs'ni tekshiring: Service → "Deployments" → "View Logs"
- `package.json` scripts to'g'rimi?
- Environment variables to'liqmi?

### Database connection error:
- `MONGO_URI` to'g'rimi?
- MongoDB service ishlayaptimi?
- Network access ochiqmi?

### Frontend API'ga ulanmayapti:
- CORS sozlamalari to'g'rimi?
- Backend public domain yaratilganmi?
- `VITE_API_URL` to'g'ri sozlanganmi?

---

## ✅ Tayyor!

Sizning backend'ingiz Railway'da ishga tushdi! 🎉

**Keyingi qadam:**
1. Frontend'ni Vercel'da deploy qiling
2. `VITE_API_URL` ni Railway backend URL'ga o'zgartiring
3. Login qiling va test qiling!

**Batafsil qo'llanma:** [RAILWAY_DEPLOYMENT.md](file:///C:/Users/user/Desktop/Klinika%20Crm/RAILWAY_DEPLOYMENT.md)
