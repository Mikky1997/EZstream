#!/bin/bash
# MikkyStream Deployment Script
# Run this on your Hetzner server as root

set -e

echo "================================"
echo "MikkyStream Deployment Script"
echo "================================"

# Update system
echo "[1/10] Updating system..."
apt update && apt upgrade -y

# Install Node.js 20
echo "[2/10] Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install build dependencies for better-sqlite3
echo "[3/10] Installing build dependencies..."
apt install -y build-essential python3

# Install PM2
echo "[4/10] Installing PM2..."
npm install -g pm2

# Install Nginx and Certbot
echo "[5/10] Installing Nginx and Certbot..."
apt install -y nginx certbot python3-certbot-nginx git

# Create app directory
echo "[6/10] Setting up app directory..."
mkdir -p /var/www/mikkystream
cd /var/www/mikkystream

# Clone repository
echo "[7/10] Cloning repository..."
if [ -d ".git" ]; then
    git pull
else
    git clone https://github.com/Mikky1997/mikkystream.git .
fi

# Install dependencies and build
echo "[8/10] Installing dependencies and building..."
npm install
npm run build

# Create environment file
echo "[9/10] Creating environment file..."
if [ ! -f ".env.local" ]; then
    cat > .env.local << 'ENVEOF'
# Add your TMDB API key here
TMDB_API_KEY=your_tmdb_api_key_here

# Session secret - change this to a random string
SESSION_SECRET=mikkystream-session-secret-change-me

# Database path
DATABASE_PATH=/var/www/mikkystream/data/mikkystream.db
ENVEOF
    echo "IMPORTANT: Edit /var/www/mikkystream/.env.local and add your TMDB API key!"
fi

# Seed users
echo "[10/10] Seeding users..."
npm run seed

# Configure PM2
echo "Configuring PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Configure Nginx
echo "Configuring Nginx..."
cat > /etc/nginx/sites-available/mikkystream << 'NGINXEOF'
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
        proxy_read_timeout 86400;
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/mikkystream /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo ""
echo "================================"
echo "Deployment Complete!"
echo "================================"
echo ""
echo "NEXT STEPS:"
echo "1. Edit /var/www/mikkystream/.env.local and add your TMDB API key"
echo "2. Run: pm2 restart mikkystream"
echo "3. Configure DNS: Point mikky.vip to 46.224.125.147"
echo "4. Enable SSL: certbot --nginx -d mikky.vip -d www.mikky.vip"
echo ""
echo "Test users:"
echo "  - mikky / mikky"
echo "  - raggi / raggi"
echo "  - bego / bego"
echo ""
echo "IMPORTANT: Change your server password!"
echo ""
