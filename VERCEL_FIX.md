# Vercel Deployment Fix

## Muammo
Vercel'da `FUNCTION_INVOCATION_FAILED` xatoligi - `vercel.json` konfiguratsiyasi noto'g'ri edi.

## Yechim
`vercel.json` faylini to'g'riladik:
- `buildCommand`, `outputDirectory`, `installCommand` fieldlarini olib tashladik
- Faqat `rewrites` va `headers` qoldirdik
- Environment variables Vercel dashboard'da sozlanadi

## Vercel'da Deploy Qilish

### 1. Vercel Dashboard
1. [vercel.com](https://vercel.com) ga kiring
2. Proyektingizni toping
3. **Settings** → **General**:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
   - **Root Directory**: `klinika-crm-frontend`

### 2. Environment Variables
**Settings** → **Environment Variables** → Qo'shing:
```
VITE_API_URL=https://your-backend-url.railway.app
VITE_APP_NAME=Klinika CRM
VITE_TZ=Asia/Tashkent
```

### 3. Redeploy
**Deployments** → Latest → **"Redeploy"**

## Yoki Yangi Deploy
Agar yangi deploy qilsangiz:
1. Vercel → **"Add New Project"**
2. **"Import Git Repository"** → `klinika-crm`
3. **Root Directory**: `klinika-crm-frontend`
4. **Framework**: Vite (avtomatik detect)
5. Environment variables qo'shing
6. **Deploy**

## Tekshirish
Deploy tugagach:
- Vercel URL'ga o'ting
- Login page ochilishi kerak
- Agar backend hali deploy qilinmagan bo'lsa, API xatoliklari bo'ladi (bu normal)

## Keyingi Qadam
Backend'ni Railway'ga deploy qiling va `VITE_API_URL` ni yangilang.
