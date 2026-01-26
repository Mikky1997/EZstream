# SSH Connection Troubleshooting

## Issue: Permission Denied

This usually means:
1. Password authentication is disabled (SSH keys required)
2. Wrong password
3. Server requires SSH key authentication

## Solutions:

### Option 1: Check if you have SSH keys from Hetzner
When you created the server on Hetzner, you might have downloaded SSH keys. Check:
- Your Downloads folder for files like `id_rsa` or `id_ed25519`
- Hetzner Cloud Console → Your Server → Access → SSH Keys

### Option 2: Try with verbose output to see what's happening
```powershell
ssh -v root@46.224.125.147
```

### Option 3: Access via Hetzner Console (Web-based)
1. Go to https://console.hetzner.cloud/
2. Login to your account
3. Click on your server
4. Click "Console" tab
5. This gives you web-based terminal access

### Option 4: Enable Password Authentication (if you have console access)
If you can access via Hetzner Console, run:
```bash
# Edit SSH config
nano /etc/ssh/sshd_config

# Find and change:
PasswordAuthentication yes
PubkeyAuthentication yes

# Restart SSH service
systemctl restart sshd
```

### Option 5: Use SSH Key (Recommended)
If you have the private key file:
```powershell
ssh -i path/to/your/private/key root@46.224.125.147
```

## Next Steps:
1. Try accessing via Hetzner Console first
2. Once in, we can enable password auth or set up SSH keys
3. Then proceed with deployment
