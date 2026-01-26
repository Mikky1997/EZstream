# Quick Server Setup Guide

## Step 1: Run the Setup Script

Copy and paste this entire block into your server terminal:

```bash
# Update system
apt update && apt upgrade -y

# Install Git
apt install -y git

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PM2
npm install -g pm2

# Install Nginx
apt install -y nginx
systemctl enable nginx
systemctl start nginx

# Install Certbot (for SSL)
apt install -y certbot python3-certbot-nginx

# Install build tools
apt install -y build-essential python3

# Verify installations
echo "=== Installation Summary ==="
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "PM2: $(pm2 --version)"
echo "Nginx: $(nginx -v 2>&1 | head -1)"
echo "Git: $(git --version)"
```

## Step 2: Verify Everything is Installed

Run this to check:

```bash
node --version    # Should show v20.x.x
npm --version     # Should show 10.x.x
pm2 --version     # Should show version number
nginx -v          # Should show nginx version
git --version     # Should show git version
```

## Step 3: Test Services

```bash
# Check Nginx is running
systemctl status nginx

# Test Nginx locally
curl http://localhost
```

## Once All Checks Pass

You're ready to deploy! Let me know when you've run the setup and I'll guide you through the deployment steps.
