# Server Testing & Deployment Guide

## Step 1: Test Server Connection

### Test SSH Connection
```bash
ssh root@46.224.125.147
```
When prompted, enter password: `HJd4Td3xLmevsinLbmqV`

### If SSH works, run these test commands:

```bash
# Check OS version
cat /etc/os-release

# Check system info
uname -a

# Check disk space
df -h

# Check memory
free -h

# Check if Node.js is installed (if not, we'll install it)
node --version || echo "Node.js not installed"

# Check if git is installed
git --version || echo "Git not installed"

# Check network connectivity
ping -c 3 google.com

# Check if ports 80 and 443 are available
netstat -tuln | grep -E ':(80|443)'
```

## Step 2: Install Required Software (if needed)

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PM2 (process manager)
npm install -g pm2

# Install Nginx
apt install -y nginx

# Install Certbot (for SSL)
apt install -y certbot python3-certbot-nginx

# Install Git (if not installed)
apt install -y git

# Verify installations
node --version
npm --version
pm2 --version
nginx -v
git --version
```

## Step 3: Test Server is Ready

```bash
# Check if services are running
systemctl status nginx

# Test Nginx
curl http://localhost

# Check firewall (if enabled)
ufw status || iptables -L
```

## Step 4: Prepare for Deployment

Once all tests pass, we'll proceed with deployment!
