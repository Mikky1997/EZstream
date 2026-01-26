#!/bin/bash
# Script to temporarily allow IP access for testing

echo "Updating Nginx config to allow IP access..."

# Backup current config
cp /etc/nginx/sites-available/mikkystream /etc/nginx/sites-available/mikkystream.backup

# Update config to accept IP requests
cat > /etc/nginx/sites-available/mikkystream << 'NGINXEOF'
server {
    listen 80;
    server_name mikky.vip www.mikky.vip 46.224.125.147 _;

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

# Test and reload
nginx -t && systemctl reload nginx

echo "Done! You can now access the site at:"
echo "  http://46.224.125.147"
echo ""
echo "To restore original config later, run:"
echo "  cp /etc/nginx/sites-available/mikkystream.backup /etc/nginx/sites-available/mikkystream"
echo "  nginx -t && systemctl reload nginx"
