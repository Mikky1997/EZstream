# Cloudflare Setup Guide for MikkyStream

## Step 1: Create Cloudflare Account

1. Go to [cloudflare.com](https://www.cloudflare.com)
2. Sign up for a free account
3. Verify your email

## Step 2: Add Your Domain

1. Click **"Add a Site"** or **"Add Site"**
2. Enter your domain: `mikky.vip`
3. Select the **Free** plan (or Pro if you want)
4. Click **Continue**

## Step 3: Cloudflare Will Scan Your DNS

Cloudflare will automatically detect your DNS records. You should see:
- A Record: `@` → `46.224.125.147`
- A Record: `www` → `46.224.125.147`

**Verify these are correct!** If they're missing or wrong, add them:
- Type: `A`
- Name: `@` (or leave blank for root domain)
- IPv4 address: `46.224.125.147`
- Proxy status: 🟠 Proxied (orange cloud)

- Type: `A`
- Name: `www`
- IPv4 address: `46.224.125.147`
- Proxy status: 🟠 Proxied (orange cloud)

## Step 4: Update Nameservers in Namecheap

Cloudflare will give you 2 nameservers, something like:
- `alex.ns.cloudflare.com`
- `sue.ns.cloudflare.com`

**In Namecheap:**
1. Go to your domain management
2. Click on `mikky.vip`
3. Go to **"Nameservers"** section
4. Select **"Custom DNS"**
5. Replace the nameservers with Cloudflare's nameservers
6. Click **Save**

**Important:** DNS propagation can take 24-48 hours, but usually works within a few minutes.

## Step 5: Configure Cloudflare SSL

1. In Cloudflare dashboard, go to **SSL/TLS**
2. Set encryption mode to **"Full"** or **"Full (strict)"**
   - **Full**: Works with Let's Encrypt certificates
   - **Full (strict)**: Requires Cloudflare's own certificate (recommended)
3. Enable **"Always Use HTTPS"** (redirects HTTP to HTTPS)
4. Enable **"Automatic HTTPS Rewrites"**

## Step 6: Configure Cloudflare Settings

### Speed Settings:
- **Auto Minify**: Enable for CSS, HTML, and JavaScript
- **Brotli**: Enable (better compression)

### Caching:
- **Caching Level**: Standard
- **Browser Cache TTL**: 4 hours (or longer)

### Security:
- **Security Level**: Medium (or High)
- **Challenge Passage**: 30 minutes
- **Browser Integrity Check**: ON

## Step 7: Update Your Server (Important!)

Since Cloudflare proxies your traffic, you need to:

1. **Get Cloudflare IP ranges** (optional but recommended for security)
2. **Update Nginx** to trust Cloudflare headers

### Option A: Trust Cloudflare (Simpler)

Update your Nginx config to use Cloudflare's real IP:

```bash
nano /etc/nginx/sites-available/mikkystream
```

Add this at the top of the `server` block (before `location /`):

```nginx
# Cloudflare real IP
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

Then reload:
```bash
nginx -t
systemctl reload nginx
```

### Option B: Use Cloudflare's SSL (Recommended)

Since Cloudflare provides free SSL, you can:

1. In Cloudflare dashboard → **SSL/TLS** → **Origin Server**
2. Click **"Create Certificate"**
3. Copy the certificate and key
4. Save them on your server:

```bash
mkdir -p /etc/nginx/ssl
nano /etc/nginx/ssl/mikky.vip.crt
# Paste the certificate, save

nano /etc/nginx/ssl/mikky.vip.key
# Paste the private key, save
```

Then update Nginx to use Cloudflare's certificate:

```nginx
server {
    listen 443 ssl http2;
    server_name mikky.vip www.mikky.vip;
    
    ssl_certificate /etc/nginx/ssl/mikky.vip.crt;
    ssl_certificate_key /etc/nginx/ssl/mikky.vip.key;
    
    # ... rest of config
}
```

## Step 8: Wait for DNS Propagation

After updating nameservers:
1. Check if DNS propagated: [whatsmydns.net](https://www.whatsmydns.net)
2. Enter `mikky.vip` and check if it shows Cloudflare nameservers
3. Once propagated, your site will go through Cloudflare

## Step 9: Verify Everything Works

1. Visit `https://mikky.vip` - should work
2. Check browser - should show Cloudflare SSL
3. Test login - should work
4. Check Cloudflare dashboard - should show traffic

## Troubleshooting

**Site not loading after Cloudflare:**
- Wait 5-10 minutes for DNS propagation
- Check Cloudflare DNS records are correct
- Verify nameservers are updated in Namecheap

**SSL errors:**
- Make sure SSL mode is "Full" or "Full (strict)"
- Check origin certificate is installed (if using Cloudflare SSL)

**Login not working:**
- Make sure `FORCE_SECURE_COOKIES=true` in `.env.local`
- Check Cloudflare SSL mode is not "Flexible" (should be "Full")

## Benefits You Get

✅ **Free CDN** - Faster loading worldwide
✅ **DDoS Protection** - Automatic protection
✅ **Free SSL** - Always encrypted
✅ **Analytics** - See your traffic stats
✅ **Caching** - Reduced server load
✅ **Security** - Bot protection, WAF (on paid plans)
