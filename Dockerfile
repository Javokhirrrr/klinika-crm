# ─────────────────────────────────────────────────────
# Klinika CRM — Backend Dockerfile (Multi-stage)
# ─────────────────────────────────────────────────────

# ─── 1. Dependencies stage ────────────────────────────
FROM node:18-alpine AS deps

WORKDIR /app

# Tizim bog'liqliklari (native modullar uchun)
RUN apk add --no-cache python3 make g++

# Faqat package fayllarini ko'chirish (layer cache uchun)
COPY package*.json ./
RUN npm install --omit=dev --ignore-scripts

# ─── 2. Development stage ─────────────────────────────
FROM node:18-alpine AS development

WORKDIR /app

COPY package*.json ./
RUN npm install --ignore-scripts

COPY . .

EXPOSE 5000

CMD ["npm", "run", "dev"]

# ─── 3. Production stage ──────────────────────────────
FROM node:18-alpine AS production

# Xavfsizlik: root bo'lmagan foydalanuvchi
RUN addgroup -g 1001 -S nodejs && \
  adduser  -S nodeuser -u 1001

WORKDIR /app

# Faqat kerakli fayllarni ko'chirish
COPY --from=deps /app/node_modules ./node_modules
COPY --chown=nodeuser:nodejs . .

# uploads papkasini yaratish
RUN mkdir -p uploads logs && \
  chown -R nodeuser:nodejs uploads logs

# Root bo'lmagan foydalanuvchiga o'tish
USER nodeuser

# Port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r)=>{process.exit(r.statusCode===200?0:1)})"

# Ishga tushirish
CMD ["node", "src/index.js"]