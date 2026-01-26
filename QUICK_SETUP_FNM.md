# Quick Server Setup Guide (using fnm)

## Step 1: Run the Setup Commands

Copy and paste this entire block into your server terminal:

```bash
# Update system
apt update && apt upgrade -y

# Install Git
apt install -y git

# Install fnm (Fast Node Manager)
curl -o- https://fnm.vercel.app/install | bash

# Load fnm in current shell
export PATH="$HOME/.local/share/fnm:$PATH"
eval "$(fnm env)"

# Install Node.js 24
fnm install 24
fnm use 24
fnm default 24

# Install PM2
npm install -g pm2

# Install Nginx
apt install -y nginx
systemctl enable nginx
systemctl start nginx

# Install Certbot (for SSL)
apt install -y certbot python3-certbot-nginx

# Install build tools
apt install -y build-essential python3

# Configure fnm for all shells (important for PM2)
echo '' >> ~/.bashrc
echo '# fnm' >> ~/.bashrc
echo 'export PATH="$HOME/.local/share/fnm:$PATH"' >> ~/.bashrc
echo 'eval "$(fnm env)"' >> ~/.bashrc

# Verify installations
echo "=== Installation Summary ==="
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "PM2: $(pm2 --version)"
echo "Nginx: $(nginx -v 2>&1 | head -1)"
echo "Git: $(git --version)"
```

## Step 2: Verify Everything is Installed

Run this to check:

```bash
# Reload shell to get fnm
source ~/.bashrc

node --version    # Should show v24.x.x
npm --version     # Should show 11.x.x
pm2 --version     # Should show version number
nginx -v          # Should show nginx version
git --version     # Should show git version
```

## Important Note for PM2

Since we're using fnm, we need to make sure PM2 can find Node.js. When we configure PM2, we'll use the full path to node:

```bash
# Get the node path
which node
# This will show something like: /root/.local/share/fnm/node-versions/v24.13.0/installation/bin/node
```

We'll use this path in the PM2 config.

## Step 3: Test Services

```bash
# Check Nginx is running
systemctl status nginx

# Test Nginx locally
curl http://localhost
```

## Once All Checks Pass

You're ready to deploy! Let me know when you've run the setup and I'll guide you through the deployment steps.
