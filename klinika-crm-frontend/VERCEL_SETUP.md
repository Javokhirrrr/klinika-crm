# 🚀 Vercel Environment Variable Setup

> zyra.uz uchun API connection sozlash

---

## 📋 Qadamlar

### 1. Vercel Dashboard'ga Kiring

**URL:** https://vercel.com/dashboard

Login qiling (GitHub account bilan)

---

### 2. Project'ni Toping

**klinika-crm-frontend** projectni oching

---

### 3. Settings'ga O'ting

**Settings** tab → **Environment Variables**

---

### 4. Environment Variable Qo'shing

**Add New** tugmasini bosing

**Name:**
```
VITE_API_URL
```

**Value:**
```
https://wanetta-uncontained-myrtle.ngrok-free.dev
```

**Environments:** (barchasini tanlang)
- ✅ Production
- ✅ Preview
- ✅ Development

**Save** bosing

---

### 5. Redeploy Qiling

**Deployments** tab → **Latest Deployment** → **...** (3 nuqta) → **Redeploy**

**Redeploy** tugmasini bosing

---

### 6. Deployment Tugashini Kuting

Status: **Building** → **Ready**

Odatda 2-3 daqiqa davom etadi

---

### 7. Test Qiling

**zyra.uz** oching

**F12** → **Console** → Xatolar bo'lmasligi kerak

**Login** qiling → Dashboard ochilishi kerak

---

## ✅ Muvaffaqiyat Belgilari

- ✅ Login ishlaydi
- ✅ Dashboard ma'lumotlari yuklanadi
- ✅ Console'da CORS xatosi yo'q
- ✅ Network tab'da API requestlar 200 OK

---

## 🔄 Agar Ishlamasa

### Variant 1: Environment Variable Tekshiring

**Vercel** → **Settings** → **Environment Variables**

`VITE_API_URL` mavjudligini tekshiring

### Variant 2: Qayta Redeploy

**Deployments** → **Redeploy** (yana bir marta)

### Variant 3: Backend Restart

Backend terminal'da:
```bash
# Ctrl+C
npm run dev
```

---

## ⚠️ Ngrok Muammosi

**Ngrok free tier** har 8 soatda yangi URL beradi!

**Har safar ngrok restart qilganingizda:**

1. Yangi URL oling: `https://new-url.ngrok-free.dev`
2. Vercel environment variable yangilang
3. Redeploy qiling

**Tavsiya:** Backend ham Vercel'ga deploy qiling (doimiy URL)

---

## 📸 Screenshot Guide

### Step 1: Vercel Dashboard
![Vercel Projects](vercel-projects.png)

### Step 2: Environment Variables
![Environment Variables](env-vars.png)

### Step 3: Add Variable
![Add Variable](add-var.png)

### Step 4: Redeploy
![Redeploy](redeploy.png)

---

**Muvaffaqiyatli sozlash!** 🎉
