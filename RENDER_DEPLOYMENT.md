# 🚀 Render.com'ga Deploy Qilish (Bepul)

> **Maqsad:** Klinika CRM'ni Render.com'ga bepul deploy qilish

---

## 📋 **KERAK BO'LADI:**

- ✅ GitHub account (bor)
- ✅ GitHub repository (bor)
- ✅ Render.com account (yaratamiz)
- ✅ MongoDB Atlas account (yaratamiz)

---

## 1️⃣ **MONGODB ATLAS (Bepul Database)**

### **A. Account yaratish:**

1. https://www.mongodb.com/cloud/atlas ga o'ting
2. "Try Free" tugmasini bosing
3. Email, parol kiriting
4. Email'ni tasdiqlang

### **B. Cluster yaratish:**

1. "Create a Deployment" → "M0 FREE"
2. **Provider:** AWS
3. **Region:** Frankfurt (Germany) - O'zbekistondan eng yaqin
4. **Cluster Name:** klinika-crm
5. "Create Deployment"

### **C. Database User yaratish:**

1. **Username:** klinika_admin
2. **Password:** (kuchli parol yarating va saqlang!)
3. "Create Database User"

### **D. Network Access:**

1. "Network Access" → "Add IP Address"
2. "Allow Access from Anywhere" (0.0.0.0/0)
3. "Confirm"

### **E. Connection String olish:**

1. "Database" → "Connect"
2. "Drivers" → "Node.js"
3. Connection string'ni nusxalang:
   ```
   mongodb+srv://klinika_admin:<password>@klinika-crm.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. `<password>` ni o'z parolingiz bilan almashtiring
5. Database nomi qo'shing: `/klinika_crm_prod`

**Final string:**
```
mongodb+srv://klinika_admin:YOUR_PASSWORD@klinika-crm.xxxxx.mongodb.net/klinika_crm_prod?retryWrites=true&w=majority
```

---

## 2️⃣ **RENDER.COM ACCOUNT**

### **A. Ro'yxatdan o'tish:**

1. https://render.com ga o'ting
2. "Get Started" → "Sign Up"
3. **GitHub bilan kirish** (tavsiya)
4. Render'ga GitHub access bering

---

## 3️⃣ **BACKEND DEPLOY QILISH**

### **A. Web Service yaratish:**

1. Render Dashboard → "New" → "Web Service"
2. GitHub repository'ni tanlang: `klinika-crm`
3. **Name:** klinika-crm-backend
4. **Region:** Frankfurt (EU Central)
5. **Branch:** main
6. **Root Directory:** (bo'sh qoldiring)
7. **Runtime:** Node
8. **Build Command:**
   ```bash
   npm install
   ```
9. **Start Command:**
   ```bash
   node src/index.js
   ```
10. **Instance Type:** Free

### **B. Environment Variables:**

"Advanced" → "Add Environment Variable":

```env
NODE_ENV=production
PORT=10000
MONGO_URI=mongodb+srv://klinika_admin:YOUR_PASSWORD@klinika-crm.xxxxx.mongodb.net/klinika_crm_prod?retryWrites=true&w=majority
JWT_ACCESS_SECRET=your_very_long_random_secret_here_min_32_characters_12345678
JWT_REFRESH_SECRET=another_very_long_random_secret_here_min_32_characters_87654321
JWT_ACCESS_EXPIRES=30m
JWT_REFRESH_EXPIRES=30d
CORS_ORIGINS=https://klinika-crm-frontend.onrender.com
PUBLIC_URL=https://klinika-crm-frontend.onrender.com
PUBLIC_BASE_URL=https://klinika-crm-backend.onrender.com
ORG_CODE_BASE=150000
```

**Secret yaratish:**
```bash
# Git Bash'da:
openssl rand -base64 48
```

### **C. Deploy qilish:**

1. "Create Web Service"
2. Deploy boshlandi! (5-10 daqiqa)
3. Log'larni kuzating

### **D. URL:**

Deploy tugagach:
```
https://klinika-crm-backend.onrender.com
```

**Test qiling:**
```
https://klinika-crm-backend.onrender.com/api/health
```

Natija:
```json
{"ok": true}
```

---

## 4️⃣ **FRONTEND DEPLOY QILISH**

### **A. Frontend'ni alohida deploy qilish:**

#### **Variant 1: Render.com (Static Site)**

1. Render Dashboard → "New" → "Static Site"
2. Repository: `klinika-crm`
3. **Name:** klinika-crm-frontend
4. **Branch:** main
5. **Root Directory:** `klinika-crm-frontend`
6. **Build Command:**
   ```bash
   npm install && npm run build
   ```
7. **Publish Directory:** `dist`

**Environment Variables:**
```env
VITE_API_URL=https://klinika-crm-backend.onrender.com
```

8. "Create Static Site"

#### **Variant 2: Vercel (Tavsiya - Tezroq)**

1. https://vercel.com
2. "Import Project" → GitHub
3. Repository: `klinika-crm`
4. **Root Directory:** `klinika-crm-frontend`
5. **Framework Preset:** Vite
6. **Environment Variables:**
   ```env
   VITE_API_URL=https://klinika-crm-backend.onrender.com
   ```
7. "Deploy"

---

## 5️⃣ **ADMIN USER YARATISH**

Backend deploy bo'lgach:

### **A. Render Shell orqali:**

1. Backend service → "Shell" tab
2. Quyidagi commandni ishga tushiring:

```bash
node scripts/seedAdmin.js admin@clinic.uz SecurePassword123 "Admin User"
```

### **B. Yoki MongoDB Atlas orqali:**

1. MongoDB Atlas → "Browse Collections"
2. Database: `klinika_crm_prod`
3. Collection: `users`
4. "Insert Document"

```json
{
  "name": "Admin User",
  "email": "admin@clinic.uz",
  "passwordHash": "$2a$10$...", 
  "role": "admin",
  "isActive": true,
  "isDeleted": false,
  "createdAt": {"$date": "2026-01-21T00:00:00.000Z"}
}
```

**Password hash yaratish:**
```bash
# Node.js console'da:
const bcrypt = require('bcryptjs');
bcrypt.hash('admin123', 10).then(console.log);
```

---

## 6️⃣ **CORS SOZLASH**

Backend'da CORS'ni yangilang:

### **A. Render Environment Variables:**

```env
CORS_ORIGINS=https://klinika-crm-frontend.onrender.com,https://klinika-crm-frontend.vercel.app
```

### **B. Redeploy:**

1. Backend service → "Manual Deploy" → "Deploy latest commit"

---

## 7️⃣ **TEST QILISH**

### **A. Frontend ochish:**

```
https://klinika-crm-frontend.onrender.com
# yoki
https://klinika-crm-frontend.vercel.app
```

### **B. Login:**

```
Email: admin@clinic.uz
Parol: admin123
```

### **C. Tekshirish:**

- ✅ Login ishlayaptimi?
- ✅ Dashboard ma'lumotlar ko'rsatyaptimi?
- ✅ API so'rovlar ishlayaptimi?

---

## 8️⃣ **CUSTOM DOMAIN (Ixtiyoriy)**

### **A. Domain sotib oling:**

1. Namecheap.com - ~$10/yil
2. Domain: `klinika-crm.uz` yoki `.com`

### **B. Render'da sozlang:**

1. Frontend service → "Settings" → "Custom Domain"
2. Domain kiriting: `klinika-crm.uz`
3. DNS records qo'shing (Render ko'rsatadi)

### **C. Namecheap DNS:**

```
CNAME: www → klinika-crm-frontend.onrender.com
A: @ → Render IP
```

---

## ⚠️ **MUHIM ESLATMALAR:**

### **Bepul Tier Cheklovlari:**

```
⚠️ Cold Start: 50 sekund kutish (faol bo'lmasa)
⚠️ 750 soat/oy (bir service uchun)
⚠️ Sekinroq (shared resources)
✅ SSL bepul
✅ Automatic deploys
✅ Production uchun yetarli (kichik loyihalar)
```

### **Yaxshilash:**

Agar loyiha o'ssa:
1. Render Starter ($7/mo) - Cold start yo'q
2. Yoki Hetzner VPS ($5/mo) - To'liq nazorat

---

## 🔄 **YANGILASH (Git Push)**

Kelajakda kod o'zgarsa:

```bash
# Local'da:
git add .
git commit -m "feat: New feature"
git push

# Render avtomatik deploy qiladi! 🎉
```

---

## 💰 **XARAJATLAR:**

### **Bepul Tier:**
```
MongoDB Atlas (M0):    $0/mo
Render Backend (Free): $0/mo
Vercel Frontend:       $0/mo
Domain (ixtiyoriy):    $10/yil
─────────────────────────────
JAMI:                  $0/mo
```

### **Production Tier:**
```
MongoDB Atlas (M10):   $10/mo
Render Starter:        $7/mo
Vercel Pro:            $20/mo (ixtiyoriy)
Domain:                $10/yil
─────────────────────────────
JAMI:                  ~$17-37/mo
```

---

## 🆘 **TROUBLESHOOTING:**

### **Backend ishlamasa:**

1. Render Logs'ni tekshiring
2. Environment variables to'g'rimi?
3. MongoDB connection string to'g'rimi?
4. Port 10000 ishlatilganmi? (Render default)

### **Frontend API'ga ulanmasa:**

1. CORS sozlamalari to'g'rimi?
2. VITE_API_URL to'g'rimi?
3. Backend ishlayaptimi?

---

## ✅ **TAYYOR!**

Sizning Klinika CRM tizimingiz endi internetda! 🎉

**URL'lar:**
- Frontend: https://klinika-crm-frontend.onrender.com
- Backend: https://klinika-crm-backend.onrender.com
- API Docs: https://klinika-crm-backend.onrender.com/api/docs

**Login:**
- Email: admin@clinic.uz
- Parol: admin123

---

**Omad! 🚀**
