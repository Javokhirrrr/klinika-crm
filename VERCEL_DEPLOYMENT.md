# Vercel Deployment Guide

## Frontend Deployment (klinika-crm-frontend)

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy Frontend
```bash
cd klinika-crm-frontend
vercel
```

### 4. Set Environment Variables

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add the following:

- `VITE_API_URL` - Your backend API URL (e.g., `https://your-backend.com/api`)
- `VITE_APP_NAME` - `Klinika CRM`
- `VITE_TZ` - `Asia/Tashkent`
- `VITE_ADMIN_EMAILS` - Admin emails
- `VITE_ADMIN_PHONES` - Admin phones

### 5. Redeploy
After setting environment variables, redeploy:
```bash
vercel --prod
```

## Backend Deployment

For backend, you have several options:

1. **Railway** - See [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md)
2. **Render** - See [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)
3. **AWS EC2** - See [AWS_EC2_DEPLOYMENT.md](AWS_EC2_DEPLOYMENT.md)

## Important Notes

- Frontend is deployed as a static site on Vercel
- Backend needs to be deployed separately (Railway, Render, or your own server)
- Make sure to update CORS settings in backend to allow your Vercel domain
- MongoDB connection string should be set in backend environment variables
