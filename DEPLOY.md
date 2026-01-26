# StreamFlix Deployment Guide

## Server Requirements
- Ubuntu 22.04 or later
- Node.js 20 LTS
- PM2 (process manager)
- Nginx (reverse proxy)
- Certbot (SSL certificates)

## Initial Server Setup

### 1. Connect to Server
```bash
ssh root@46.224.125.147
```

### 2. Update System
```bash
apt update && apt upgrade -y
```

### 3. Install Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

### 4. Install PM2
```bash
npm install -g pm2
```

### 5. Install Nginx and Certbot
```bash
apt install -y nginx certbot python3-certbot-nginx
```

### 6. Create App User
```bash
useradd -m -s /bin/bash streamflix
mkdir -p /var/www/streamflix
chown streamflix:streamflix /var/www/streamflix
```

### 7. Clone Repository
```bash
su - streamflix
cd /var/www/streamflix
git clone https://github.com/YOUR_USERNAME/streamflix.git .
```

### 8. Install Dependencies and Build
```bash
npm install
npm run build
```

### 9. Create Environment File
```bash
cp .env.example .env.local
nano .env.local  # Add your TMDB API key and session secret
```

### 10. Seed Users
```bash
npm run seed
```

### 11. Configure PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 12. Configure Nginx
Create `/etc/nginx/sites-available/streamflix`:
```nginx
server {
    listen 80;
    server_name mikky.vip www.mikky.vip;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
ln -s /etc/nginx/sites-available/streamflix /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 13. Configure SSL with Let's Encrypt
```bash
certbot --nginx -d mikky.vip -d www.mikky.vip
```

### 14. Configure DNS (Namecheap)
In Namecheap DNS settings for mikky.vip:
- A Record: @ -> 46.224.125.147
- A Record: www -> 46.224.125.147

## Updating the App

```bash
su - streamflix
cd /var/www/streamflix
git pull
npm install
npm run build
pm2 restart streamflix
```

## Useful Commands

- View logs: `pm2 logs streamflix`
- Restart app: `pm2 restart streamflix`
- Stop app: `pm2 stop streamflix`
- App status: `pm2 status`

## Predefined Users
- mikky / mikky
- raggi / raggi
- bego / bego
