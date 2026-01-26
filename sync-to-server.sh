#!/bin/bash
# Quick sync script - commits and pushes changes, then updates server

set -e

echo "=========================================="
echo "Syncing MikkyStream to Server"
echo "=========================================="
echo ""

# Step 1: Add all changes
echo "1. Staging changes..."
git add app/layout.tsx scripts/seed-users.ts public/
echo "✓ Changes staged"
echo ""

# Step 2: Commit
echo "2. Committing changes..."
git commit -m "Add favicon, Open Graph meta tags, and new users (shehab, sayed, medo, salwa, marioma)"
echo "✓ Changes committed"
echo ""

# Step 3: Push to GitHub
echo "3. Pushing to GitHub..."
git push origin main
echo "✓ Pushed to GitHub"
echo ""

# Step 4: Instructions for server
echo "=========================================="
echo "Next: Update your server"
echo "=========================================="
echo ""
echo "SSH to your server and run:"
echo ""
echo "  cd /var/www/mikkystream"
echo "  git pull"
echo "  npm install"
echo "  npm run build"
echo "  npm run seed"
echo "  pm2 restart mikkystream"
echo ""
echo "Or run this one-liner on your server:"
echo ""
echo "  cd /var/www/mikkystream && git pull && npm install && npm run build && npm run seed && pm2 restart mikkystream"
echo ""
