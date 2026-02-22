# ─────────────────────────────────────────────────────
# Klinika CRM — Frontend Dockerfile (Multi-stage)
# ─────────────────────────────────────────────────────

# ─── 1. Build stage ───────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

# Faqat package fayllarini ko'chirish (layer cache)
COPY package*.json ./
RUN npm ci --ignore-scripts

# Manba kodini ko'chirish
COPY . .

# Build argumentlari (docker-compose yoki CI da beriladi)
ARG VITE_API_URL=https://klinika-crm-production.up.railway.app
ARG VITE_ADMIN_EMAILS=jubaydullayev765@gmail.com
ARG VITE_ADMIN_PHONES=772644602

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_ADMIN_EMAILS=$VITE_ADMIN_EMAILS
ENV VITE_ADMIN_PHONES=$VITE_ADMIN_PHONES

# Production build
RUN npm run build

# ─── 2. Production Nginx stage ────────────────────────
FROM nginx:1.25-alpine AS production

# Xavfsizlik: nginx foydalanuvchisi
RUN adduser -D -H -u 101 -s /sbin/nologin nginx 2>/dev/null || true

# Build qilingan fayllarni ko'chirish
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx konfiguratsiyasi
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -qO- http://localhost/health || exit 1

# Nginx ishga tushirish
CMD ["nginx", "-g", "daemon off;"]
