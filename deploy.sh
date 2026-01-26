#!/bin/bash

# MikkyStream Deployment Script
# Run this on your server after cloning the repository

set -e

echo "=========================================="
echo "MikkyStream Deployment"
echo "=========================================="
echo ""

# Load fnm
export PATH="$HOME/.local/share/fnm:$PATH"
eval "$(fnm env)"
fnm use 24

# Get node path for PM2
NODE_PATH=$(fnm which 24)
echo "Node.js path: $NODE_PATH"
echo ""

# Navigate to app directory
cd /var/www/mikkystream

echo "1. Installing dependencies..."
npm install
echo "✓ Dependencies installed"
echo ""

echo "2. Building application..."
npm run build
echo "✓ Build complete"
echo ""

echo "3. Creating data directory..."
mkdir -p data
echo "✓ Data directory created"
echo ""

echo "4. Seeding users..."
npm run seed
echo "✓ Users seeded"
echo ""

echo "5. Starting with PM2..."
# Create a wrapper script for PM2 that loads fnm
cat > /var/www/mikkystream/start.sh << 'EOF'
#!/bin/bash
export PATH="$HOME/.local/share/fnm:$PATH"
eval "$(fnm env)"
fnm use 24
cd /var/www/mikkystream
npm start
EOF

chmod +x /var/www/mikkystream/start.sh

# Update ecosystem.config.js to use the wrapper
cat > /var/www/mikkystream/ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'mikkystream',
      script: '/var/www/mikkystream/start.sh',
      cwd: '/var/www/mikkystream',
      interpreter: '/bin/bash',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
    },
  ],
};
EOF

pm2 start ecosystem.config.js
pm2 save
pm2 startup
echo "✓ PM2 configured and started"
echo ""

echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Your app should be running on http://localhost:3000"
echo ""
echo "Next steps:"
echo "  1. Configure Nginx (see DEPLOY_NOW.md)"
echo "  2. Set up SSL with Certbot"
echo "  3. Configure DNS"
echo ""
