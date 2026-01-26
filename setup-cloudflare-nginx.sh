#!/bin/bash
# Update Nginx config for Cloudflare

echo "Updating Nginx config for Cloudflare..."

# Backup current config
cp /etc/nginx/sites-available/mikkystream /etc/nginx/sites-available/mikkystream.backup.$(date +%Y%m%d_%H%M%S)

# Read current config
CONFIG_FILE="/etc/nginx/sites-available/mikkystream"

# Check if Cloudflare real IP is already configured
if grep -q "CF-Connecting-IP" "$CONFIG_FILE"; then
    echo "Cloudflare real IP already configured!"
    exit 0
fi

# Create temp file with Cloudflare config
cat > /tmp/cloudflare_nginx_config.txt << 'EOF'
    # Cloudflare real IP configuration
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
EOF

# Insert Cloudflare config after server_name line
sed -i '/server_name/r /tmp/cloudflare_nginx_config.txt' "$CONFIG_FILE"

# Test and reload
if nginx -t; then
    systemctl reload nginx
    echo "✓ Nginx updated for Cloudflare!"
    echo ""
    echo "Your server is now configured to:"
    echo "  - Trust Cloudflare's real IP headers"
    echo "  - Show correct visitor IPs in logs"
else
    echo "✗ Nginx config test failed! Restoring backup..."
    cp /etc/nginx/sites-available/mikkystream.backup.* /etc/nginx/sites-available/mikkystream
    exit 1
fi

rm /tmp/cloudflare_nginx_config.txt

echo ""
echo "Next steps:"
echo "1. Make sure DNS nameservers are updated in Namecheap"
echo "2. Wait 5-10 minutes for DNS propagation"
echo "3. Visit https://mikky.vip to verify it works"
echo "4. Check Cloudflare dashboard for traffic"
