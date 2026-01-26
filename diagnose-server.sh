#!/bin/bash
# Server diagnostic script - run this on your server

echo "=========================================="
echo "MikkyStream Server Diagnostics"
echo "=========================================="
echo ""

echo "1. Checking PM2 status..."
pm2 status
echo ""

echo "2. Checking if app is listening on port 3000..."
netstat -tuln | grep 3000 || ss -tuln | grep 3000 || echo "Port 3000 not found"
echo ""

echo "3. Testing localhost:3000..."
curl -I http://localhost:3000 2>&1 | head -5 || echo "Cannot connect to localhost:3000"
echo ""

echo "4. Checking Nginx status..."
systemctl status nginx --no-pager | head -10
echo ""

echo "5. Checking if Nginx is listening on port 80..."
netstat -tuln | grep :80 || ss -tuln | grep :80 || echo "Port 80 not found"
echo ""

echo "6. Testing Nginx locally..."
curl -I http://localhost 2>&1 | head -5 || echo "Cannot connect to localhost"
echo ""

echo "7. Checking firewall status..."
ufw status 2>/dev/null || iptables -L -n | head -10 || echo "Firewall check failed"
echo ""

echo "8. Checking PM2 logs (last 10 lines)..."
pm2 logs mikkystream --lines 10 --nostream
echo ""

echo "9. Checking Nginx config..."
nginx -t
echo ""

echo "10. Current Nginx server_name config..."
grep -A 2 "server_name" /etc/nginx/sites-available/mikkystream || echo "Config file not found"
echo ""

echo "=========================================="
echo "Diagnostics Complete"
echo "=========================================="
