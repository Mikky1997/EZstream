#!/bin/bash
# SSL Setup Script for MikkyStream

echo "=========================================="
echo "Setting up SSL for MikkyStream"
echo "=========================================="
echo ""

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    echo "Installing Certbot..."
    apt update
    apt install -y certbot python3-certbot-nginx
fi

echo "Requesting SSL certificate..."
echo "This will set up HTTPS for mikky.vip and www.mikky.vip"
echo ""

# Request certificate
certbot --nginx -d mikky.vip -d www.mikky.vip --non-interactive --agree-tos --email admin@mikky.vip --redirect

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "SSL Setup Complete!"
    echo "=========================================="
    echo ""
    echo "Your site is now available at:"
    echo "  https://mikky.vip"
    echo "  https://www.mikky.vip"
    echo ""
    echo "After SSL is set up, update .env.local:"
    echo "  FORCE_SECURE_COOKIES=true"
    echo ""
    echo "Then restart PM2:"
    echo "  pm2 restart mikkystream"
    echo ""
else
    echo ""
    echo "SSL setup failed. Make sure:"
    echo "  1. DNS is pointing to this server (46.224.125.147)"
    echo "  2. Ports 80 and 443 are open in firewall"
    echo "  3. Nginx is running"
    echo ""
fi
