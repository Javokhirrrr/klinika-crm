# 🚂 Railway.app'ga Deploy Qilish - To'liq Qo'llanma

> **Maqsad:** Klinika CRM'ni Railway.app'ga deploy qilish

---

## 📋 **KERAK BO'LADI:**

- ✅ GitHub account (bor)
- ✅ GitHub repository (bor)
- ✅ Railway.app account (yaratamiz)
- ✅ Kredit karta (ixtiyoriy - bepul tier uchun kerak emas)

---

## 🎯 **AFZALLIKLARI:**

```
✅ Node.js + MongoDB - Bir joyda
✅ Cold start yo'q (Render'dan tezroq)
✅ Avtomatik deploy (GitHub push)
✅ Environment variables
✅ Custom domain
✅ SSL bepul
✅ Database backup
✅ Logs va monitoring
```

---

## 1️⃣ **RAILWAY ACCOUNT YARATISH**

### **A. Ro'yxatdan o'tish:**

1. https://railway.app ga o'ting
2. "Login" → "Login with GitHub"
3. GitHub'ga ruxsat bering
4. Email'ni tasdiqlang

### **B. Kredit olish:**

```
🎁 Yangi foydalanuvchilar: $5 bepul kredit
🎁 GitHub Student Pack: $10/oy (agar student bo'lsangiz)
```

---

## 2️⃣ **YANGI PROYEKT YARATISH**

### **A. New Project:**

1. Dashboard → "New Project"
2. "Deploy from GitHub repo"
3. Repository tanlang: `klinika-crm`
4. Railway GitHub'ga access so'raydi - "Authorize"

---

## 3️⃣ **MONGODB QURISH**

### **A. Database qo'shish:**

1. Proyekt ichida → "New" → "Database" → "Add MongoDB"
2. Railway avtomatik MongoDB container yaratadi
3. 1-2 daqiqa kutish

### **B. Connection String olish:**

1. MongoDB service → "Variables" tab
2. `MONGO_URL` ni nusxalang:
   ```
   mongodb://mongo:XXXXX@monorail.proxy.rlwy.net:12345
   ```

**Yoki:**

1. "Connect" tab
2. Connection string ko'rsatiladi

---

## 4️⃣ **BACKEND DEPLOY QILISH**

### **A. Backend Service yaratish:**

1. Proyekt → "New" → "GitHub Repo"
2. Repository: `klinika-crm`
3. **Root Directory:** `/` (yoki bo'sh)
4. Railway avtomatik detect qiladi

### **B. Settings sozlash:**

1. Service → "Settings" tab
2. **Service Name:** `klinika-backend`
3. **Start Command:**
   ```bash
   node src/index.js
   ```
4. **Build Command:** (avtomatik: `npm install`)
5. **Watch Paths:** `/src/**` (ixtiyoriy)

### **C. Environment Variables:**

1. Service → "Variables" tab
2. "New Variable" → "Add Reference" → MongoDB'dan `MONGO_URL` tanlang
3. Qo'shimcha variables qo'shing:

```env
NODE_ENV=production
PORT=3000
MONGO_URI=${{MongoDB.MONGO_URL}}
JWT_ACCESS_SECRET=your_very_long_random_secret_here_min_32_characters_12345678
JWT_REFRESH_SECRET=another_very_long_random_secret_here_min_32_characters_87654321
JWT_ACCESS_EXPIRES=30m
JWT_REFRESH_EXPIRES=30d
CORS_ORIGINS=${{Frontend.RAILWAY_PUBLIC_DOMAIN}}
PUBLIC_URL=${{Frontend.RAILWAY_PUBLIC_DOMAIN}}
PUBLIC_BASE_URL=${{Backend.RAILWAY_PUBLIC_DOMAIN}}
ORG_CODE_BASE=150000
```

**Secret yaratish:**
```bash
# Git Bash'da:
openssl rand -base64 48
```

### **D. Deploy:**

1. Railway avtomatik deploy boshlaydi
2. "Deployments" tabda progress ko'ring
3. 3-5 daqiqa kutish

### **E. Public URL olish:**

1. Service → "Settings" → "Networking"
2. "Generate Domain"
3. URL: `klinika-backend.up.railway.app`

---

## 5️⃣ **FRONTEND DEPLOY QILISH**

### **Variant A: Railway'da (Tavsiya)**

#### **A. Frontend Service yaratish:**

1. Proyekt → "New" → "GitHub Repo"
2. Repository: `klinika-crm`
3. **Root Directory:** `klinika-crm-frontend`

#### **B. Settings:**

1. **Service Name:** `klinika-frontend`
2. **Build Command:**
   ```bash
   npm install && npm run build
   ```
3. **Start Command:**
   ```bash
   npx serve dist -s -p $PORT
   ```

**Yoki Nginx bilan:**

`klinika-crm-frontend/` papkasida `Dockerfile` yarating:

```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### **C. Environment Variables:**

```env
VITE_API_URL=https://klinika-backend.up.railway.app
```

#### **D. Generate Domain:**

1. Settings → Networking → "Generate Domain"
2. URL: `klinika-frontend.up.railway.app`

---

### **Variant B: Vercel (Tezroq - Tavsiya)**

1. https://vercel.com
2. "Import Project" → GitHub
3. Repository: `klinika-crm`
4. **Root Directory:** `klinika-crm-frontend`
5. **Framework:** Vite
6. **Environment Variables:**
   ```env
   VITE_API_URL=https://klinika-backend.up.railway.app
   ```
7. "Deploy"

---

## 6️⃣ **ADMIN USER YARATISH**

### **A. Railway CLI orqali:**

#### **1. Railway CLI o'rnatish:**

```bash
# Windows (PowerShell):
iwr https://railway.app/install.ps1 | iex

# Yoki npm orqali:
npm install -g @railway/cli
```

#### **2. Login:**

```bash
railway login
```

#### **3. Proyektga ulaning:**

```bash
cd "C:\Users\user\Desktop\Klinika Crm"
railway link
```

Proyektingizni tanlang.

#### **4. Admin yaratish:**

```bash
railway run node scripts/seedAdmin.js admin@clinic.uz admin123 "Admin User"
```

---

### **B. MongoDB GUI orqali:**

#### **1. MongoDB Compass o'rnatish:**

1. https://www.mongodb.com/try/download/compass
2. Download va install

#### **2. Railway MongoDB'ga ulaning:**

1. Railway → MongoDB service → "Connect" tab
2. Connection string nusxalang
3. MongoDB Compass'da "New Connection"
4. String paste qiling
5. "Connect"

#### **3. Admin user qo'shish:**

1. Database: `klinika_crm` (yoki yarating)
2. Collection: `users`
3. "Add Data" → "Insert Document"

```json
{
  "name": "Admin User",
  "email": "admin@clinic.uz",
  "passwordHash": "$2a$10$YourHashedPasswordHere",
  "role": "admin",
  "isActive": true,
  "isDeleted": false,
  "createdAt": {"$date": "2026-01-21T00:00:00.000Z"}
}
```

**Password hash yaratish:**

```bash
# Node.js console:
node
> const bcrypt = require('bcryptjs');
> bcrypt.hash('admin123', 10).then(console.log);
```

---

## 7️⃣ **CORS VA URL SOZLASH**

### **A. Backend Environment Variables yangilash:**

Railway → Backend service → Variables:

```env
CORS_ORIGINS=https://klinika-frontend.up.railway.app,https://klinika-crm.vercel.app
PUBLIC_URL=https://klinika-frontend.up.railway.app
PUBLIC_BASE_URL=https://klinika-backend.up.railway.app
```

### **B. Redeploy:**

Variables o'zgargach, Railway avtomatik redeploy qiladi.

---

## 8️⃣ **CUSTOM DOMAIN (Ixtiyoriy)**

### **A. Domain sotib oling:**

1. Namecheap.com - ~$10/yil
2. Domain: `klinika-crm.uz` yoki `.com`

### **B. Railway'da sozlang:**

#### **Backend:**

1. Backend service → Settings → Networking
2. "Custom Domain" → Domain kiriting: `api.klinika-crm.uz`
3. Railway DNS records ko'rsatadi

#### **Frontend:**

1. Frontend service → Settings → Networking
2. "Custom Domain" → `klinika-crm.uz` va `www.klinika-crm.uz`

### **C. Namecheap DNS:**

```
CNAME: api → klinika-backend.up.railway.app
CNAME: www → klinika-frontend.up.railway.app
A: @ → (Railway IP)
```

---

## 9️⃣ **MONITORING VA LOGS**

### **A. Logs ko'rish:**

1. Service → "Deployments" tab
2. Oxirgi deployment → "View Logs"
3. Real-time logs ko'ring

### **B. Metrics:**

1. Service → "Metrics" tab
2. CPU, RAM, Network ko'ring

### **C. Alerts sozlash:**

1. Proyekt Settings → "Notifications"
2. Email yoki Slack qo'shing
3. Deploy failures uchun alert

---

## 🔟 **BACKUP VA RESTORE**

### **A. MongoDB Backup:**

#### **1. Avtomatik backup (Railway Pro):**

Railway Pro plan'da avtomatik backup bor.

#### **2. Manual backup:**

```bash
# Railway CLI orqali:
railway run mongodump --uri="$MONGO_URI" --out=./backup

# Yoki MongoDB Compass orqali export
```

### **B. Restore:**

```bash
railway run mongorestore --uri="$MONGO_URI" ./backup
```

---

## 1️⃣1️⃣ **SCALING VA OPTIMIZATION**

### **A. Vertical Scaling:**

1. Service → Settings → "Resources"
2. RAM va CPU oshiring (Pro plan)

### **B. Horizontal Scaling:**

Railway avtomatik load balancing qiladi (Enterprise plan).

### **C. Caching:**

Redis qo'shish:

1. Proyekt → "New" → "Database" → "Redis"
2. Backend'ga Redis URL qo'shing

---

## 1️⃣2️⃣ **CI/CD (Avtomatik Deploy)**

### **A. GitHub Push → Avtomatik Deploy:**

Railway avtomatik sozlangan! Faqat:

```bash
git add .
git commit -m "feat: New feature"
git push

# Railway avtomatik deploy qiladi! 🎉
```

### **B. Deploy Triggers:**

1. Service → Settings → "Deploy Triggers"
2. Branch tanlang: `main`
3. Watch Paths: `/src/**`

### **C. Preview Deployments:**

Pull Request'lar uchun avtomatik preview environment.

---

## 💰 **XARAJATLAR HISOBI**

### **Bepul Tier ($5 kredit/oy):**

```
Backend (Node.js):     ~$3/mo
Frontend (Static):     ~$1/mo
MongoDB:               ~$5/mo
─────────────────────────────
JAMI:                  ~$9/mo

$5 kredit bilan:       ~$4/mo to'lash kerak
```

### **MongoDB Atlas bilan:**

```
Backend:               ~$3/mo
Frontend:              ~$1/mo
MongoDB Atlas (M0):    $0 (bepul)
─────────────────────────────
JAMI:                  ~$4/mo

$5 kredit bilan:       $0 (bepul!) ✅
```

### **Optimization:**

Frontend'ni Vercel'da host qilsangiz:

```
Backend (Railway):     ~$3/mo
Frontend (Vercel):     $0 (bepul)
MongoDB Atlas:         $0 (bepul)
─────────────────────────────
JAMI:                  ~$3/mo

$5 kredit bilan:       $0 (bepul!) ✅✅
```

---

## 🎯 **TAVSIYA QILINGAN SETUP:**

### **Eng Arzon (Bepul):**

```
✅ Backend: Railway ($3/mo)
✅ Frontend: Vercel (bepul)
✅ Database: MongoDB Atlas M0 (bepul)
─────────────────────────────
JAMI: $3/mo - $5 kredit = $0 (BEPUL!) 🎉
```

### **Eng Yaxshi Performance:**

```
✅ Backend: Railway ($3-5/mo)
✅ Frontend: Vercel Pro ($20/mo)
✅ Database: MongoDB Atlas M10 ($10/mo)
─────────────────────────────
JAMI: ~$33-35/mo
```

---

## ⚠️ **MUHIM ESLATMALAR:**

### **1. Environment Variables:**

```
✅ Barcha secretlarni Railway Variables'da saqlang
❌ .env faylini GitHub'ga yuklamang
✅ ${{SERVICE.VARIABLE}} sintaksisidan foydalaning
```

### **2. Database:**

```
✅ MongoDB Atlas (bepul) ishlatish tavsiya etiladi
✅ Railway MongoDB faqat test uchun
⚠️ Production uchun MongoDB Atlas M10+ kerak
```

### **3. Monitoring:**

```
✅ Railway Logs'ni kuzating
✅ Error alerts sozlang
✅ Uptime monitoring (UptimeRobot) qo'shing
```

---

## 🆘 **TROUBLESHOOTING:**

### **Deploy failed:**

1. Logs'ni tekshiring
2. `package.json` scripts to'g'rimi?
3. Environment variables to'g'rimi?
4. Port `process.env.PORT` ishlatyapsizmi?

### **Database connection error:**

1. `MONGO_URI` to'g'rimi?
2. MongoDB service ishlayaptimi?
3. Network access ochiqmi?

### **Frontend API'ga ulanmayapti:**

1. CORS sozlamalari to'g'rimi?
2. `VITE_API_URL` to'g'rimi?
3. Backend public domain generatsiya qilinganmi?

---

## ✅ **TAYYOR!**

Sizning Klinika CRM tizimingiz Railway.app'da! 🎉

**URL'lar:**
- Frontend: https://klinika-frontend.up.railway.app
- Backend: https://klinika-backend.up.railway.app
- API Docs: https://klinika-backend.up.railway.app/api/docs

**Login:**
- Email: admin@clinic.uz
- Parol: admin123

---

## 📞 **YORDAM:**

Railway Support:
- 📧 Email: team@railway.app
- 💬 Discord: https://discord.gg/railway
- 📚 Docs: https://docs.railway.app

---

**Omad! 🚀**
