# 🚀 AWS EC2 - Klinika CRM Deploy Qo'llanmasi

> **Maqsad:** Klinika CRM'ni AWS EC2'da deploy qilish va domenga ulash

---

## 📋 **REJA:**

- [x] AWS Account yaratish
- [x] EC2 Instance yaratish
- [x] Server sozlash
- [x] Proyektni deploy qilish
- [x] Domain ulash
- [x] SSL sozlash

---

## 1️⃣ **AWS ACCOUNT**

### **Ro'yxatdan O'tish:**

1. https://aws.amazon.com
2. "Create an AWS Account"
3. Email, parol
4. Account type: Personal
5. Kredit karta (tekshirish - $1 qaytariladi)
6. Phone verification
7. Support: Basic (Free)

### **Free Tier (12 oy):**

```
✅ 750 soat/oy EC2 t2.micro
✅ 30GB storage
✅ 15GB bandwidth
✅ MongoDB o'rnatish mumkin
```

---

## 2️⃣ **EC2 INSTANCE**

### **Launch Instance:**

```
1. AWS Console → EC2 → Launch Instance
2. Region: Frankfurt (eu-central-1)

Sozlamalar:
- Name: klinika-crm-server
- AMI: Ubuntu Server 22.04 LTS
- Instance type: t2.micro (Free tier)
- Key pair: Create new → klinika-crm-key.pem (SAQLANG!)
- Security group:
  ✅ SSH (22) - My IP
  ✅ HTTP (80) - Anywhere
  ✅ HTTPS (443) - Anywhere
  ✅ Custom TCP (5000) - Anywhere
- Storage: 30GB gp3

3. Launch Instance
4. Public IP nusxalang: 3.123.45.67
```

---

## 3️⃣ **SSH ULANISH**

### **Git Bash (Windows):**

```bash
# Permission
chmod 400 klinika-crm-key.pem

# Connect
ssh -i klinika-crm-key.pem ubuntu@3.123.45.67
```

---

## 4️⃣ **SERVER SOZLASH**

### **A. Tizim:**

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw nginx
```

### **B. Node.js:**

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version
```

### **C. MongoDB:**

```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
   sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

### **D. Firewall:**

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw allow 5000/tcp
sudo ufw enable
```

---

## 5️⃣ **DEPLOY**

### **A. Clone:**

```bash
cd ~
git clone https://github.com/Javokhirrrr/klinika-crm.git
cd klinika-crm
```

### **B. Environment:**

```bash
nano .env
```

```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb://localhost:27017/klinika_crm_prod
JWT_ACCESS_SECRET=your_secret_min_32_chars
JWT_REFRESH_SECRET=another_secret_min_32_chars
JWT_ACCESS_EXPIRES=30m
JWT_REFRESH_EXPIRES=30d
CORS_ORIGINS=https://yourdomain.com
PUBLIC_URL=https://yourdomain.com
PUBLIC_BASE_URL=https://api.yourdomain.com
ORG_CODE_BASE=150000
```

### **C. Install:**

```bash
npm install
cd klinika-crm-frontend
npm install
npm run build
cd ..
```

### **D. PM2:**

```bash
sudo npm install -g pm2
pm2 start src/index.js --name klinika-backend
pm2 startup
pm2 save
```

---

## 6️⃣ **NGINX**

```bash
sudo nano /etc/nginx/sites-available/klinika-crm
```

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /home/ubuntu/klinika-crm/klinika-crm-frontend/dist;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/klinika-crm /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

---

## 7️⃣ **DOMAIN DNS**

Domain provideringizda:

```
A Record:
  @ → 3.123.45.67

A Record:
  www → 3.123.45.67

A Record:
  api → 3.123.45.67
```

---

## 8️⃣ **SSL (HTTPS)**

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

---

## 9️⃣ **ADMIN USER**

```bash
cd ~/klinika-crm
node scripts/seedAdmin.js admin@yourdomain.com SecurePass123 "Admin"
```

---

## 🔟 **TEST**

```
✅ https://api.yourdomain.com/api/health
✅ https://yourdomain.com
✅ Login: admin@yourdomain.com / SecurePass123
```

---

## 💰 **XARAJATLAR**

```
12 oy: $0 (Free Tier)
Domain: $10/yil
Keyin: ~$10-15/mo
```

---

## 🔄 **YANGILASH**

```bash
cd ~/klinika-crm
git pull
npm install
cd klinika-crm-frontend
npm install
npm run build
cd ..
pm2 restart klinika-backend
```

---

## 🆘 **TROUBLESHOOTING**

### **PM2 Logs:**
```bash
pm2 logs klinika-backend
pm2 restart klinika-backend
```

### **Nginx:**
```bash
sudo nginx -t
sudo systemctl restart nginx
sudo tail -f /var/log/nginx/error.log
```

### **MongoDB:**
```bash
sudo systemctl status mongod
sudo tail -f /var/log/mongodb/mongod.log
```

---

**Omad! 🚀**
