# 🚀 Backend Vercel Deploy (Alternative)

> Ngrok o'rniga doimiy backend URL

---

## ❓ Nega Kerak?

**Ngrok muammolari:**
- ❌ Har 8 soatda yangi URL
- ❌ Har safar Vercel'da yangilash kerak
- ❌ Production uchun mos emas

**Vercel afzalliklari:**
- ✅ Doimiy URL
- ✅ Avtomatik deploy
- ✅ Free tier yetarli

---

## 📋 Qadamlar

### 1. vercel.json Yaratish

**Backend papkada:**

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/index.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 2. package.json Tekshirish

**Kerakli scripts:**

```json
{
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  }
}
```

### 3. Vercel CLI O'rnatish

```bash
npm install -g vercel
```

### 4. Deploy Qilish

```bash
cd "c:\Users\user\Desktop\Klinika Crm"
vercel
```

**Savollar:**
- Set up and deploy? **Y**
- Which scope? **Your account**
- Link to existing project? **N**
- Project name? **klinika-crm-backend**
- Directory? **./src**
- Override settings? **N**

### 5. Environment Variables

**Vercel Dashboard** → **klinika-crm-backend** → **Settings** → **Environment Variables**

Qo'shing:
```
MONGO_URI=mongodb+srv://...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
CORS_ORIGINS=https://zyra.uz
```

### 6. Production Deploy

```bash
vercel --prod
```

**Natija:**
```
✅ Production: https://klinika-crm-backend.vercel.app
```

### 7. Frontend Yangilash

**Vercel** → **klinika-crm-frontend** → **Environment Variables**

```
VITE_API_URL=https://klinika-crm-backend.vercel.app
```

**Redeploy** qiling

---

## ✅ Test

**Browser Console:**
```javascript
fetch('https://klinika-crm-backend.vercel.app/api/health')
  .then(r => r.json())
  .then(console.log)
```

**Natija:**
```json
{"ok": true, "time": "2024-..."}
```

---

## 🔄 Avtomatik Deploy

**GitHub bilan bog'lash:**

1. **Vercel Dashboard** → **klinika-crm-backend**
2. **Settings** → **Git**
3. **Connect Git Repository**
4. **GitHub** → **Javokhirrrr/klinika-crm**

**Keyin:**
- `git push` → Avtomatik deploy ✅

---

## 📝 Checklist

- [ ] vercel.json yaratildi
- [ ] Vercel CLI o'rnatildi
- [ ] Backend deploy qilindi
- [ ] Environment variables qo'shildi
- [ ] Production deploy qilindi
- [ ] Frontend yangilandi
- [ ] Test qilindi
- [ ] GitHub bog'landi

---

**Doimiy backend URL!** 🎉
