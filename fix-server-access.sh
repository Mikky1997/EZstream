#!/bin/bash
# Complete fix script for server access issues

set -e

echo "=========================================="
echo "Fixing Server Access"
echo "=========================================="
echo ""

# Step 1: Check if app is listening
echo "1. Checking if app is listening on port 3000..."
if netstat -tuln | grep -q :3000 || ss -tuln | grep -q :3000; then
    echo "✓ Port 3000 is listening"
else
    echo "✗ Port 3000 is NOT listening - restarting app..."
    cd /var/www/mikkystream
    pm2 restart mikkystream
    sleep 3
fi
echo ""

# Step 2: Test localhost
echo "2. Testing localhost:3000..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|301\|302"; then
    echo "✓ App is responding on localhost:3000"
else
    echo "✗ App is NOT responding - checking logs..."
    pm2 logs mikkystream --lines 30 --nostream
    echo ""
    echo "Trying to restart..."
    cd /var/www/mikkystream
    pm2 restart mikkystream
    sleep 5
fi
echo ""

# Step 3: Check and fix firewall
echo "3. Checking firewall..."
if command -v ufw &> /dev/null; then
    ufw_status=$(ufw status | head -1)
    if echo "$ufw_status" | grep -q "Status: active"; then
        echo "Firewall is active - opening ports..."
        ufw allow 80/tcp
        ufw allow 443/tcp
        ufw allow 3000/tcp
        echo "✓ Ports opened"
    else
        echo "✓ Firewall is inactive"
    fi
else
    echo "UFW not installed, checking iptables..."
fi
echo ""

# Step 4: Update Nginx to accept IP
echo "4. Updating Nginx config to accept IP requests..."
if [ -f /etc/nginx/sites-available/mikkystream ]; then
    # Backup
    cp /etc/nginx/sites-available/mikkystream /etc/nginx/sites-available/mikkystream.backup.$(date +%Y%m%d_%H%M%S)
    
    # Check if already has IP
    if ! grep -q "46.224.125.147\|_" /etc/nginx/sites-available/mikkystream; then
        # Update server_name line
        sed -i 's/server_name mikky.vip www.mikky.vip;/server_name mikky.vip www.mikky.vip 46.224.125.147 _;/' /etc/nginx/sites-available/mikkystream
        echo "✓ Updated Nginx config"
    else
        echo "✓ Nginx already configured for IP access"
    fi
    
    # Test and reload
    if nginx -t; then
        systemctl reload nginx
        echo "✓ Nginx reloaded"
    else
        echo "✗ Nginx config test failed!"
        exit 1
    fi
else
    echo "✗ Nginx config file not found!"
fi
echo ""

# Step 5: Final test
echo "5. Final checks..."
echo "PM2 Status:"
pm2 status
echo ""
echo "Ports listening:"
netstat -tuln | grep -E ':(80|3000)' || ss -tuln | grep -E ':(80|3000)'
echo ""
echo "Testing localhost:3000..."
curl -I http://localhost:3000 2>&1 | head -3
echo ""
echo "Testing Nginx..."
curl -I http://localhost 2>&1 | head -3
echo ""

echo "=========================================="
echo "Fix Complete!"
echo "=========================================="
echo ""
echo "Try accessing:"
echo "  http://46.224.125.147"
echo "  http://46.224.125.147:3000"
echo ""
