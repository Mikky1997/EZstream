#!/bin/bash
# GitHub Authentication Setup Script for Server

echo "=== GitHub SSH Key Setup ==="
echo ""
echo "This script will help you set up SSH authentication for GitHub."
echo ""

# Check if SSH key already exists
if [ -f ~/.ssh/id_ed25519 ]; then
    echo "SSH key already exists at ~/.ssh/id_ed25519"
    read -p "Do you want to use the existing key? (y/n): " use_existing
    if [ "$use_existing" != "y" ]; then
        echo "Generating new SSH key..."
        ssh-keygen -t ed25519 -C "mikkystream-server" -f ~/.ssh/id_ed25519 -N ""
    fi
else
    echo "Generating new SSH key..."
    ssh-keygen -t ed25519 -C "mikkystream-server" -f ~/.ssh/id_ed25519 -N ""
fi

echo ""
echo "=== Your Public SSH Key ==="
echo "Copy this key and add it to GitHub:"
echo ""
cat ~/.ssh/id_ed25519.pub
echo ""
echo ""
echo "=== Next Steps ==="
echo "1. Go to: https://github.com/settings/keys"
echo "2. Click 'New SSH key'"
echo "3. Title: mikkystream-server"
echo "4. Paste the key above"
echo "5. Click 'Add SSH key'"
echo ""
echo "After adding the key, test the connection:"
echo "  ssh -T git@github.com"
echo ""
echo "Then clone the repository:"
echo "  git clone git@github.com:Mikky1997/mikkystream.git ."
