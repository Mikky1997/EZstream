# MikkyStream Deployment Steps

## Step 1: Get the Correct Node.js Path

Run this on your server to get the permanent node path:

```bash
# Get the actual node path (not the temporary one)
fnm which 24
# OR
ls -la ~/.local/share/fnm/node-versions/v24.13.0/installation/bin/node
```

Save this path - we'll need it for PM2 config.

## Step 2: Clone Your Repository

```bash
# Create app directory
mkdir -p /var/www/mikkystream
cd /var/www/mikkystream

# Clone your repo (replace with your actual GitHub URL)
git clone https://github.com/Mikky1997/mikkystream.git .

# If repo is private, you'll need to set up SSH keys or use a token
```

## Step 3: Install Dependencies and Build

```bash
cd /var/www/mikkystream

# Make sure fnm is loaded
export PATH="$HOME/.local/share/fnm:$PATH"
eval "$(fnm env)"
fnm use 24

# Install dependencies
npm install

# Build the app
npm run build
```

## Step 4: Create Environment File

```bash
cd /var/www/mikkystream

# Create .env.local file
nano .env.local
```

Add these lines (replace with your actual values):
```
TMDB_API_KEY=your_tmdb_api_key_here
SESSION_SECRET=your_random_secret_string_here
DATABASE_PATH=/var/www/mikkystream/data/mikkystream.db
```

Press `Ctrl+X`, then `Y`, then `Enter` to save.

## Step 5: Seed Users

```bash
cd /var/www/mikkystream
npm run seed
```

## Step 6: Configure PM2

First, get your node path:
```bash
NODE_PATH=$(fnm which 24)
echo $NODE_PATH
```

Then update the PM2 config. We'll create it:

```bash
cd /var/www/mikkystream
nano ecosystem.config.js
```

Use this config (replace NODE_PATH with the actual path from above):
```javascript
module.exports = {
  apps: [
    {
      name: 'streamflix',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/streamflix',
      interpreter: '/root/.local/share/fnm/node-versions/v24.13.0/installation/bin/node',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        PATH: '/root/.local/share/fnm/node-versions/v24.13.0/installation/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
    },
  ],
};
```

## Step 7: Start with PM2

```bash
cd /var/www/mikkystream
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Step 8: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/mikkystream
```

Paste this:
```nginx
server {
    listen 80;
    server_name mikky.vip www.mikky.vip;

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
    }
}
```

Enable the site:
```bash
ln -s /etc/nginx/sites-available/mikkystream /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

## Step 9: Set Up SSL (HTTPS)

```bash
certbot --nginx -d mikky.vip -d www.mikky.vip
```

## Step 10: Configure DNS (Namecheap)

In Namecheap DNS settings:
- A Record: @ → 46.224.125.147
- A Record: www → 46.224.125.147

Wait a few minutes for DNS to propagate, then your site should be live!
