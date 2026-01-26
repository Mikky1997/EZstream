#!/bin/bash

# MikkyStream Server Setup Script
# Run this on your server to install all required software

set -e  # Exit on error

echo "=========================================="
echo "MikkyStream Server Setup"
echo "=========================================="
echo ""

# Update system
echo "1. Updating system packages..."
apt update && apt upgrade -y
echo "✓ System updated"
echo ""

# Install Git (if not installed)
echo "2. Installing Git..."
if ! command -v git &> /dev/null; then
    apt install -y git
    echo "✓ Git installed"
else
    echo "✓ Git already installed: $(git --version)"
fi
echo ""

# Install Node.js 20.x (LTS)
echo "3. Installing Node.js 20.x..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    echo "✓ Node.js installed: $(node --version)"
else
    echo "✓ Node.js already installed: $(node --version)"
fi
echo ""

# Install PM2
echo "4. Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    echo "✓ PM2 installed: $(pm2 --version)"
else
    echo "✓ PM2 already installed: $(pm2 --version)"
fi
echo ""

# Install Nginx
echo "5. Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    systemctl enable nginx
    systemctl start nginx
    echo "✓ Nginx installed and started"
else
    echo "✓ Nginx already installed: $(nginx -v 2>&1 | head -1)"
    systemctl enable nginx
    systemctl start nginx
fi
echo ""

# Install Certbot
echo "6. Installing Certbot (for SSL)..."
if ! command -v certbot &> /dev/null; then
    apt install -y certbot python3-certbot-nginx
    echo "✓ Certbot installed"
else
    echo "✓ Certbot already installed"
fi
echo ""

# Install build tools (needed for some npm packages)
echo "7. Installing build tools..."
apt install -y build-essential python3
echo "✓ Build tools installed"
echo ""

# Summary
echo "=========================================="
echo "Installation Complete!"
echo "=========================================="
echo ""
echo "Installed versions:"
echo "  Node.js: $(node --version)"
echo "  npm: $(npm --version)"
echo "  PM2: $(pm2 --version)"
echo "  Nginx: $(nginx -v 2>&1 | head -1)"
echo "  Git: $(git --version)"
echo ""
echo "Next steps:"
echo "  1. Clone your repository"
echo "  2. Install dependencies: npm install"
echo "  3. Build the app: npm run build"
echo "  4. Set up environment variables"
echo "  5. Configure PM2"
echo "  6. Configure Nginx"
echo "  7. Set up SSL"
echo ""
