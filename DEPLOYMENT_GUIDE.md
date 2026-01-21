# 🚀 Klinika CRM - Production Deployment Guide

> **Maqsad:** Klinika CRM tizimini production serverga deploy qilish

---

## 📋 **QADAMLAR RO'YXATI**

- [ ] 1. Server tanlash va sotib olish
- [ ] 2. Domain sotib olish
- [ ] 3. Server sozlash
- [ ] 4. Docker o'rnatish
- [ ] 5. Proyektni serverga yuklash
- [ ] 6. Environment variables sozlash
- [ ] 7. SSL sertifikat o'rnatish
- [ ] 8. Deploy qilish
- [ ] 9. Monitoring sozlash
- [ ] 10. Backup sozlash

---

## 1️⃣ **SERVER TANLASH**

### **Tavsiya: Hetzner (Arzon) yoki DigitalOcean (Ishonchli)**

#### **Hetzner:**
1. https://www.hetzner.com ga o'ting
2. "Cloud" → "Cloud Servers" → "Add Server"
3. **Location:** Nuremberg, Germany (O'zbekistondan tez)
4. **Image:** Ubuntu 22.04
5. **Type:** CX21 (4GB RAM, 2 vCPU) - €4.51/mo
6. **SSH Key:** Qo'shing (yoki parol yarating)
7. "Create & Buy Now"

#### **DigitalOcean:**
1. https://www.digitalocean.com ga o'ting
2. "Create" → "Droplets"
3. **Region:** Frankfurt (Evropa)
4. **Image:** Ubuntu 22.04 LTS
5. **Size:** Basic - $12/mo (2GB RAM)
6. **SSH Key:** Qo'shing
7. "Create Droplet"

---

## 2️⃣ **DOMAIN SOTIB OLISH**

### **Tavsiya: Namecheap yoki Cloudflare**

#### **Namecheap:**
1. https://www.namecheap.com
2. Domain qidiring (masalan: `klinika-crm.uz` yoki `.com`)
3. Sotib oling (~$10/yil)

#### **Domain sozlash:**
```
A Record:
  Host: @
  Value: [SERVER_IP_ADDRESS]
  TTL: Automatic

A Record:
  Host: www
  Value: [SERVER_IP_ADDRESS]
  TTL: Automatic
```

---

## 3️⃣ **SERVERGA ULANISH**

### **SSH orqali ulanish:**

```bash
# Windows (PowerShell yoki Git Bash)
ssh root@YOUR_SERVER_IP

# Birinchi marta ulanayotganingizda "yes" deb javob bering
```

---

## 4️⃣ **SERVER SOZLASH**

### **A. Tizimni yangilash:**

```bash
# Paketlarni yangilash
apt update && apt upgrade -y

# Zarur paketlar
apt install -y curl git ufw
```

### **B. Firewall sozlash:**

```bash
# UFW firewall yoqish
ufw allow OpenSSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
ufw status
```

### **C. Docker o'rnatish:**

```bash
# Docker o'rnatish scripti
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Docker Compose o'rnatish
apt install -y docker-compose-plugin

# Tekshirish
docker --version
docker compose version
```

### **D. Yangi user yaratish (xavfsizlik uchun):**

```bash
# Yangi user yaratish
adduser klinika
usermod -aG sudo klinika
usermod -aG docker klinika

# SSH ruxsat berish
mkdir -p /home/klinika/.ssh
cp ~/.ssh/authorized_keys /home/klinika/.ssh/
chown -R klinika:klinika /home/klinika/.ssh
chmod 700 /home/klinika/.ssh
chmod 600 /home/klinika/.ssh/authorized_keys

# Yangi user bilan ulanish
exit
ssh klinika@YOUR_SERVER_IP
```

---

## 5️⃣ **PROYEKTNI SERVERGA YUKLASH**

### **Variant 1: Git orqali (Tavsiya)**

```bash
# Proyekt papkasini yaratish
cd ~
mkdir -p apps
cd apps

# GitHub'dan clone qilish (avval GitHub'ga push qiling)
git clone https://github.com/YOUR_USERNAME/klinika-crm.git
cd klinika-crm
```

### **Variant 2: SCP orqali (Git bo'lmasa)**

```bash
# Local kompyuterdan (Windows PowerShell)
scp -r "C:\Users\user\Desktop\Klinika Crm" klinika@YOUR_SERVER_IP:~/apps/klinika-crm
```

---

## 6️⃣ **ENVIRONMENT VARIABLES SOZLASH**

### **Production .env yaratish:**

```bash
cd ~/apps/klinika-crm

# Production .env yaratish
nano .env.production
```

**Quyidagi ma'lumotlarni kiriting:**

```env
# === Server ===
NODE_ENV=production
PORT=5000

# === MongoDB ===
MONGO_URI=mongodb://mongodb:27017/klinika_crm_prod

# === JWT Secrets (YANGI SECRET YARATING!) ===
JWT_ACCESS_SECRET=YOUR_VERY_LONG_RANDOM_SECRET_HERE_MIN_32_CHARS
JWT_REFRESH_SECRET=YOUR_ANOTHER_VERY_LONG_RANDOM_SECRET_HERE
JWT_ACCESS_EXPIRES=30m
JWT_REFRESH_EXPIRES=30d

# === CORS (Sizning domeningiz) ===
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# === Frontend URL ===
PUBLIC_URL=https://yourdomain.com
WEBAPP_URL=https://yourdomain.com/twa

# === Backend URL ===
PUBLIC_BASE_URL=https://api.yourdomain.com

# === Organization ===
ORG_CODE_BASE=150000

# === Telegram Bot (ixtiyoriy) ===
# TELEGRAM_BOT_TOKEN=your_bot_token_here
```

**Secret yaratish:**
```bash
# Random secret yaratish
openssl rand -base64 48
```

---

## 7️⃣ **DOCKER COMPOSE PRODUCTION FILE**

### **docker-compose.prod.yml yaratish:**

```bash
nano docker-compose.prod.yml
```

```yaml
version: '3.8'

services:
  # MongoDB
  mongodb:
    image: mongo:7
    container_name: klinika-mongodb
    restart: always
    volumes:
      - mongodb_data:/data/db
      - mongodb_config:/data/configdb
    environment:
      MONGO_INITDB_DATABASE: klinika_crm_prod
    networks:
      - klinika-network
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend API
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: klinika-backend
    restart: always
    env_file:
      - .env.production
    depends_on:
      mongodb:
        condition: service_healthy
    networks:
      - klinika-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Frontend
  frontend:
    build:
      context: ./klinika-crm-frontend
      dockerfile: Dockerfile
      args:
        VITE_API_URL: https://api.yourdomain.com
    container_name: klinika-frontend
    restart: always
    networks:
      - klinika-network

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: klinika-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - certbot_data:/var/www/certbot:ro
    depends_on:
      - backend
      - frontend
    networks:
      - klinika-network

  # Certbot for SSL
  certbot:
    image: certbot/certbot
    container_name: klinika-certbot
    volumes:
      - certbot_data:/var/www/certbot
      - ./nginx/ssl:/etc/letsencrypt
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"

volumes:
  mongodb_data:
  mongodb_config:
  certbot_data:

networks:
  klinika-network:
    driver: bridge
```

---

## 8️⃣ **NGINX SOZLASH**

### **Nginx config yaratish:**

```bash
mkdir -p nginx
nano nginx/nginx.conf
```

```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:5000;
    }

    upstream frontend {
        server frontend:80;
    }

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com api.yourdomain.com;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$host$request_uri;
        }
    }

    # Frontend HTTPS
    server {
        listen 443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;

        ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }

    # Backend API HTTPS
    server {
        listen 443 ssl http2;
        server_name api.yourdomain.com;

        ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

        location / {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # WebSocket support
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }
}
```

---

## 9️⃣ **SSL SERTIFIKAT OLISH**

### **Let's Encrypt bilan bepul SSL:**

```bash
# Avval HTTP rejimida ishga tushiring
docker compose -f docker-compose.prod.yml up -d nginx

# SSL sertifikat olish
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  -d yourdomain.com \
  -d www.yourdomain.com \
  -d api.yourdomain.com \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email

# Nginx'ni qayta yuklash
docker compose -f docker-compose.prod.yml restart nginx
```

---

## 🔟 **DEPLOY QILISH**

### **Barcha containerlarni ishga tushirish:**

```bash
cd ~/apps/klinika-crm

# Build va ishga tushirish
docker compose -f docker-compose.prod.yml up -d --build

# Loglarni ko'rish
docker compose -f docker-compose.prod.yml logs -f

# Statusni tekshirish
docker compose -f docker-compose.prod.yml ps
```

### **Admin user yaratish:**

```bash
# Backend containerga kirish
docker exec -it klinika-backend sh

# Admin yaratish
node scripts/seedAdmin.js admin@yourdomain.com SecurePassword123 "Admin User"

# Chiqish
exit
```

---

## 1️⃣1️⃣ **MONITORING SOZLASH**

### **A. Docker stats ko'rish:**

```bash
docker stats
```

### **B. Uptime monitoring (UptimeRobot - Bepul):**

1. https://uptimerobot.com ga ro'yxatdan o'ting
2. "Add New Monitor" bosing
3. URL: `https://yourdomain.com`
4. Interval: 5 minutes
5. Alert: Email ga xabar yuborish

### **C. Loglarni saqlash:**

```bash
# Log rotation sozlash
nano /etc/docker/daemon.json
```

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

```bash
systemctl restart docker
```

---

## 1️⃣2️⃣ **BACKUP SOZLASH**

### **Avtomatik backup scripti:**

```bash
nano ~/backup-klinika.sh
```

```bash
#!/bin/bash

# Backup papkasi
BACKUP_DIR=~/backups
DATE=$(date +%Y%m%d_%H%M%S)

# Papka yaratish
mkdir -p $BACKUP_DIR

# MongoDB backup
docker exec klinika-mongodb mongodump \
  --db klinika_crm_prod \
  --out /tmp/backup

docker cp klinika-mongodb:/tmp/backup \
  $BACKUP_DIR/mongodb_$DATE

# Eski backuplarni o'chirish (30 kundan eski)
find $BACKUP_DIR -type d -mtime +30 -exec rm -rf {} +

echo "Backup completed: $BACKUP_DIR/mongodb_$DATE"
```

```bash
chmod +x ~/backup-klinika.sh

# Cron job qo'shish (har kuni soat 2:00 da)
crontab -e

# Quyidagini qo'shing:
0 2 * * * /home/klinika/backup-klinika.sh >> /home/klinika/backup.log 2>&1
```

---

## 1️⃣3️⃣ **YANGILASH (UPDATE)**

### **Yangi versiyani deploy qilish:**

```bash
cd ~/apps/klinika-crm

# Yangi kodni olish
git pull origin main

# Rebuild va restart
docker compose -f docker-compose.prod.yml up -d --build

# Loglarni tekshirish
docker compose -f docker-compose.prod.yml logs -f backend
```

---

## 🔧 **TROUBLESHOOTING**

### **Container ishlamasa:**

```bash
# Loglarni ko'rish
docker compose -f docker-compose.prod.yml logs backend
docker compose -f docker-compose.prod.yml logs frontend
docker compose -f docker-compose.prod.yml logs mongodb

# Container qayta ishga tushirish
docker compose -f docker-compose.prod.yml restart backend

# Barcha containerlarni qayta build qilish
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build
```

### **MongoDB ulanmasa:**

```bash
# MongoDB statusini tekshirish
docker exec -it klinika-mongodb mongosh

# Ichida:
show dbs
use klinika_crm_prod
show collections
```

### **SSL muammosi:**

```bash
# Sertifikat yangilash
docker compose -f docker-compose.prod.yml run --rm certbot renew

# Nginx restart
docker compose -f docker-compose.prod.yml restart nginx
```

---

## 📊 **XARAJATLAR HISOBI**

### **Hetzner (Tavsiya):**
```
Server (CX21):        €4.51/mo  (~$5)
Domain (.com):        $10/year  (~$1/mo)
Backup space:         €3/mo     (ixtiyoriy)
------------------------
JAMI:                 ~$6-9/mo
```

### **DigitalOcean:**
```
Droplet (Basic):      $12/mo
Domain:               $1/mo
Backups:              $2.40/mo (20% of droplet)
------------------------
JAMI:                 ~$15/mo
```

---

## ✅ **TAYYOR!**

Sizning Klinika CRM tizimingiz production serverda ishlayapti! 🎉

**Tekshirish:**
- ✅ https://yourdomain.com - Frontend
- ✅ https://api.yourdomain.com/health - Backend health check
- ✅ Login: admin@yourdomain.com

---

## 📞 **YORDAM**

Muammo bo'lsa:
1. Loglarni tekshiring: `docker compose logs -f`
2. Container statusini ko'ring: `docker compose ps`
3. Firewall tekshiring: `ufw status`
4. DNS sozlamalarini tekshiring

**Omad! 🚀**
