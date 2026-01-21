# Klinika CRM - Deployment Guide

This guide covers deploying Klinika CRM to production environments.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Docker Deployment](#docker-deployment)
- [Manual Deployment](#manual-deployment)
- [Database Setup](#database-setup)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Server:** Ubuntu 20.04+ or similar Linux distribution
- **Docker:** 20.10+ and Docker Compose 2.0+
- **Node.js:** 18+ (for manual deployment)
- **MongoDB:** 4.4+ (if not using Docker)
- **Redis:** 6+ (recommended for caching)
- **Domain:** Configured with DNS pointing to your server
- **SSL Certificate:** Let's Encrypt or similar

---

## Environment Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd klinika-crm
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
nano .env
```

**Critical settings for production:**

```env
NODE_ENV=production
PORT=5000

# Strong JWT secrets (generate with: openssl rand -hex 32)
JWT_ACCESS_SECRET=<your-strong-secret>
JWT_REFRESH_SECRET=<your-strong-secret>

# Production MongoDB
MONGO_URI=mongodb://username:password@localhost:27017/klinika_crm

# Redis
REDIS_URL=redis://localhost:6379

# CORS (your frontend domain)
CORS_ORIGINS=https://yourdomain.com

# Public URLs
PUBLIC_URL=https://yourdomain.com
PUBLIC_BASE_URL=https://api.yourdomain.com
```

---

## Docker Deployment

### Production Deployment

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down
```

### Development Deployment

```bash
# Use development compose file
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

### Useful Docker Commands

```bash
# Rebuild containers
docker-compose build --no-cache

# View running containers
docker-compose ps

# Execute commands in container
docker-compose exec api npm run seed:admin

# View container logs
docker-compose logs -f api

# Restart specific service
docker-compose restart api
```

---

## Manual Deployment

### 1. Install Dependencies

```bash
npm ci --only=production
```

### 2. Build Frontend

```bash
cd klinika-crm-frontend
npm ci
npm run build
cd ..
```

### 3. Start with PM2

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start src/index.js --name klinika-crm

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup

# View logs
pm2 logs klinika-crm

# Monitor
pm2 monit
```

### 4. Setup Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/klinika-crm

server {
    listen 80;
    server_name api.yourdomain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # Proxy to Node.js
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Static files
    location /uploads {
        alias /path/to/klinika-crm/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/klinika-crm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Database Setup

### MongoDB

#### Using Docker

Already configured in `docker-compose.yml`.

#### Manual Setup

```bash
# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Create database user
mongosh
```

```javascript
use klinika_crm
db.createUser({
  user: "klinika_user",
  pwd: "strong_password",
  roles: [{ role: "readWrite", db: "klinika_crm" }]
})
```

### Redis

```bash
# Install Redis
sudo apt-get install redis-server

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Test connection
redis-cli ping
```

### Seed Admin User

```bash
npm run seed:admin
```

---

## SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal (already configured)
sudo certbot renew --dry-run
```

---

## Monitoring

### Health Checks

```bash
# API health
curl https://api.yourdomain.com/api/health

# Detailed system health
curl https://api.yourdomain.com/api/system/health
```

### PM2 Monitoring

```bash
# View status
pm2 status

# View logs
pm2 logs klinika-crm

# Monitor resources
pm2 monit
```

### Docker Monitoring

```bash
# Container stats
docker stats

# View logs
docker-compose logs -f
```

---

## Backup Strategy

### Database Backup

```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mongodb"
mkdir -p $BACKUP_DIR

mongodump --uri="mongodb://username:password@localhost:27017/klinika_crm" \
  --out="$BACKUP_DIR/backup_$DATE"

# Keep only last 7 days
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} +
EOF

chmod +x backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

### File Uploads Backup

```bash
# Sync uploads to backup location
rsync -avz /path/to/klinika-crm/uploads /backups/uploads
```

---

## Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs klinika-crm --lines 100

# Or with Docker
docker-compose logs api

# Check environment variables
printenv | grep NODE_ENV
```

### Database Connection Issues

```bash
# Test MongoDB connection
mongosh "mongodb://username:password@localhost:27017/klinika_crm"

# Check MongoDB status
sudo systemctl status mongod
```

### High Memory Usage

```bash
# Restart application
pm2 restart klinika-crm

# Or with Docker
docker-compose restart api

# Monitor memory
pm2 monit
```

### Port Already in Use

```bash
# Find process using port 5000
sudo lsof -i :5000

# Kill process
sudo kill -9 <PID>
```

---

## Security Checklist

- [ ] Strong JWT secrets configured
- [ ] MongoDB authentication enabled
- [ ] Firewall configured (UFW or iptables)
- [ ] SSL certificate installed
- [ ] Environment variables secured
- [ ] Regular backups configured
- [ ] Monitoring setup
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Security headers enabled

---

## Performance Optimization

### Enable Redis Caching

Ensure Redis is running and `REDIS_URL` is configured in `.env`.

### Database Indexes

Indexes are automatically created by Mongoose schemas, but verify:

```javascript
// In MongoDB shell
use klinika_crm
db.patients.getIndexes()
db.appointments.getIndexes()
```

### PM2 Cluster Mode

```bash
# Start in cluster mode (use all CPU cores)
pm2 start src/index.js -i max --name klinika-crm
```

---

## Updating the Application

```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm ci --only=production

# Restart application
pm2 restart klinika-crm

# Or with Docker
docker-compose down
docker-compose build
docker-compose up -d
```

---

For additional help, refer to the [README.md](README.md) or open an issue.
