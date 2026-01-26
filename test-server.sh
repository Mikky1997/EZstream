#!/bin/bash

# Server Test Script
# Run this after SSH'ing into your server

echo "=== Server Test Script ==="
echo ""

echo "1. Checking OS..."
cat /etc/os-release | grep PRETTY_NAME
echo ""

echo "2. Checking system info..."
uname -a
echo ""

echo "3. Checking disk space..."
df -h | head -2
echo ""

echo "4. Checking memory..."
free -h
echo ""

echo "5. Checking Node.js..."
if command -v node &> /dev/null; then
    echo "Node.js version: $(node --version)"
else
    echo "Node.js: NOT INSTALLED"
fi
echo ""

echo "6. Checking Git..."
if command -v git &> /dev/null; then
    echo "Git version: $(git --version)"
else
    echo "Git: NOT INSTALLED"
fi
echo ""

echo "7. Checking Nginx..."
if command -v nginx &> /dev/null; then
    echo "Nginx version: $(nginx -v 2>&1)"
else
    echo "Nginx: NOT INSTALLED"
fi
echo ""

echo "8. Checking PM2..."
if command -v pm2 &> /dev/null; then
    echo "PM2 version: $(pm2 --version)"
else
    echo "PM2: NOT INSTALLED"
fi
echo ""

echo "9. Testing network connectivity..."
ping -c 2 google.com > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "Network: OK"
else
    echo "Network: FAILED"
fi
echo ""

echo "10. Checking ports 80 and 443..."
if netstat -tuln 2>/dev/null | grep -q ':80 '; then
    echo "Port 80: IN USE"
else
    echo "Port 80: AVAILABLE"
fi

if netstat -tuln 2>/dev/null | grep -q ':443 '; then
    echo "Port 443: IN USE"
else
    echo "Port 443: AVAILABLE"
fi
echo ""

echo "=== Test Complete ==="
echo ""
echo "If all checks pass, you're ready to deploy!"
