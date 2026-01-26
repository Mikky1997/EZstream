#!/bin/bash

# MikkyStream Server Setup Script (using fnm)
# Run this on your server to install all required software

set -e  # Exit on error

echo "=========================================="
echo "MikkyStream Server Setup (with fnm)"
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

# Install fnm and Node.js 24
echo "3. Installing fnm and Node.js 24..."
if ! command -v fnm &> /dev/null; then
    # Install fnm
    curl -o- https://fnm.vercel.app/install | bash
    
    # Load fnm in current shell
    export PATH="$HOME/.local/share/fnm:$PATH"
    eval "$(fnm env)"
    
    # Install Node.js 24
    fnm install 24
    fnm use 24
    fnm default 24
    
    echo "✓ fnm and Node.js installed: $(node --version)"
else
    echo "✓ fnm already installed"
    export PATH="$HOME/.local/share/fnm:$PATH"
    eval "$(fnm env)"
    fnm install 24
    fnm use 24
    echo "✓ Node.js: $(node --version)"
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

# Install build tools
echo "7. Installing build tools..."
apt install -y build-essential python3
echo "✓ Build tools installed"
echo ""

# Configure fnm for PM2 (important for production)
echo "8. Configuring fnm for PM2..."
# Add fnm to bashrc so it's available in all shells
if ! grep -q "fnm" ~/.bashrc; then
    echo '' >> ~/.bashrc
    echo '# fnm' >> ~/.bashrc
    echo 'export PATH="$HOME/.local/share/fnm:$PATH"' >> ~/.bashrc
    echo 'eval "$(fnm env)"' >> ~/.bashrc
    echo "✓ fnm added to ~/.bashrc"
fi
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
