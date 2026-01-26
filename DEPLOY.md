# MikkyStream Deployment Guide

Complete guide for deploying MikkyStream on a Linux server with Nginx and PM2.

## Server Requirements

- Ubuntu 22.04+ or Debian 11+
- Node.js 20 LTS
- 1GB+ RAM
- Nginx (reverse proxy)
- PM2 (process manager)

## Quick Deploy

### 1. Server Setup

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PM2 globally
npm install -g pm2

# Install Nginx
apt install -y nginx
```

### 2. Application Setup

```bash
# Create app directory
mkdir -p /var/www/mikkystream
cd /var/www/mikkystream

# Clone repository
git clone https://github.com/yourusername/mikkystream.git .

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
nano .env.local  # Add your TMDB API key and JWT secret

# Build the application
npm run build

# Seed demo users (optional)
npm run seed
```

### 3. PM2 Configuration

```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Enable startup on boot
pm2 startup
```

### 4. Nginx Configuration

Create `/etc/nginx/sites-available/mikkystream`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

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
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Cache static assets
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:

```bash
ln -s /etc/nginx/sites-available/mikkystream /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 5. SSL with Let's Encrypt

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 6. Cloudflare (Optional)

For enhanced performance and security:

1. Add your domain to Cloudflare
2. Update nameservers at your registrar
3. In Cloudflare Dashboard:
   - SSL/TLS → Full (strict)
   - Speed → Enable Auto Minify
   - Speed → Enable Brotli
   - Caching → Browser Cache TTL: 4 hours

Add Cloudflare IPs to Nginx for real visitor IPs:

```nginx
# Add inside server block
set_real_ip_from 173.245.48.0/20;
set_real_ip_from 103.21.244.0/22;
set_real_ip_from 103.22.200.0/22;
set_real_ip_from 103.31.4.0/22;
set_real_ip_from 141.101.64.0/18;
set_real_ip_from 108.162.192.0/18;
set_real_ip_from 190.93.240.0/20;
set_real_ip_from 188.114.96.0/20;
set_real_ip_from 197.234.240.0/22;
set_real_ip_from 198.41.128.0/17;
set_real_ip_from 162.158.0.0/15;
set_real_ip_from 104.16.0.0/13;
set_real_ip_from 104.24.0.0/14;
set_real_ip_from 172.64.0.0/13;
set_real_ip_from 131.0.72.0/22;
real_ip_header CF-Connecting-IP;
```

## Updating

```bash
cd /var/www/mikkystream
git pull
npm install
npm run build
pm2 restart mikkystream
```

## Useful Commands

| Command | Description |
|---------|-------------|
| `pm2 status` | Check app status |
| `pm2 logs mikkystream` | View logs |
| `pm2 restart mikkystream` | Restart app |
| `pm2 stop mikkystream` | Stop app |
| `pm2 monit` | Real-time monitoring |

## Troubleshooting

**App not starting:**
```bash
pm2 logs mikkystream --lines 50
```

**Nginx errors:**
```bash
nginx -t
tail -f /var/log/nginx/error.log
```

**Database issues:**
```bash
# Check database file exists
ls -la /var/www/mikkystream/data/
```
