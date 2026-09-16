# 🌐 Cloudflare Tunnel HTTPS Setup Guide

## Quick Start (Recommended)

### Option 1: Using Cloudflare Dashboard (No Terminal Needed)

1. **Go to Cloudflare Dashboard**
   - Visit: https://dash.cloudflare.com
   - Sign in or create account (free)

2. **Select Your Domain**
   - Choose your domain from the left sidebar
   - If you don't have a domain, point one to Cloudflare first

3. **Navigate to Tunnels**
   - Click "Networks" → "Tunnels" in the left menu
   - Click "Create a tunnel"
   - Choose "Cloudflared" as connector type
   - Name it: `leaf-disease-detector`
   - Click "Save tunnel"

4. **Copy Installation Command**
   - You'll see a command like:
   ```
   cloudflared service install <TOKEN>
   ```
   - Run this in PowerShell (Admin)

5. **Configure Routing**
   - Public hostname: `leaf-disease-detector.yourdomain.com`
   - Service: `http://localhost:8765`
   - Click "Save route"

6. **Done!**
   - Your server is now at: `https://leaf-disease-detector.yourdomain.com`

---

### Option 2: Quick Setup with Cloudflare Free Subdomain

If you don't have a domain, use Cloudflare's free tunnel domain:

```powershell
# 1. Download cloudflared
cd C:\Temp
curl -L -o cloudflared.exe https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe

# 2. Authenticate
.\cloudflared.exe login

# 3. Create tunnel
.\cloudflared.exe tunnel create leaf-disease-detector

# 4. Get tunnel ID (note it down)
.\cloudflared.exe tunnel list

# 5. Create config file at C:\Users\<YourUsername>\.cloudflared\config.yml
# Content:
tunnel: <YOUR_TUNNEL_ID>
credentials-file: C:\Users\<YourUsername>\.cloudflared\<TUNNEL_ID>.json

ingress:
  - hostname: leaf-disease-detector.pages.dev
    service: http://localhost:8765
  - service: http_status:404

# 6. Run tunnel
.\cloudflared.exe tunnel run leaf-disease-detector
```

---

### Option 3: Keep It Simple - Port Forwarding

If you just want quick HTTPS without Cloudflare Tunnel:

```bash
# Using ngrok (faster, simpler)
npm install -g ngrok

# Login at https://ngrok.com and get auth token
ngrok config add-authtoken YOUR_TOKEN

# Run it
ngrok http 8765

# You'll get: https://xxxx-xx-xxx-xx-xx.ngrok.io
```

---

## Current Server Status

✅ **Local Server Running:**
- HTTP: http://localhost:8765
- Network: http://192.168.1.3:8765
- Test UI: http://192.168.1.3:8765/test-upload

---

## Why HTTPS with Tunnel?

1. **Security** - Encrypted connection
2. **Remote Access** - Share globally with https://your-domain.com
3. **Mobile Apps** - Can integrate with native apps
4. **SSL Certificate** - Automatic, free
5. **Stable URL** - Better than IP addresses

---

## After Setup

### Access Your System

**Locally (Network):**
```
http://192.168.1.3:8765
```

**Globally (HTTPS):**
```
https://leaf-disease-detector.yourdomain.com
```

### Share with Others

Send them:
```
https://leaf-disease-detector.yourdomain.com/test-upload
```

They can:
1. Upload leaf images
2. Get AI predictions
3. Vote for best model
4. See improvements over time

---

## Troubleshooting

### Tunnel won't start
```powershell
# Clear credentials
Remove-Item -Path $env:USERPROFILE\.cloudflared -Recurse -Force

# Re-authenticate
cloudflared login
```

### Server not responding through tunnel
```powershell
# Check if local server is running
curl http://localhost:8765/health

# Restart tunnel
cloudflared tunnel run leaf-disease-detector
```

### Connection refused
```bash
# Make sure server is running on 8765
netstat -ano | findstr :8765

# If not running, start it
cd d:\huy\leaf-disease-detector-1
npm start
```

---

## Advanced: Auto-Start Tunnel on Boot

### Windows Service Install

```powershell
# Run as Administrator
cd C:\Temp

# Install cloudflared as service
.\cloudflared.exe service install YOUR_AUTH_TOKEN

# Start service
net start cloudflared

# Check status
net start cloudflared
```

---

## Alternative: Using Vercel/Netlify

If you want even simpler setup:

```bash
# Deploy to Vercel (free)
npx vercel

# Deploy to Netlify (free)
npx netlify-cli deploy
```

Both give you automatic HTTPS without extra steps.

---

## Next Steps

1. **Choose Your Method** (Cloudflare Dashboard is easiest)
2. **Setup HTTPS URL**
3. **Test the Link** from mobile phone
4. **Share with Farmers** for validation
5. **Monitor Performance** through voting system
6. **Collect Feedback** to improve models

---

## Support

- Cloudflare Docs: https://developers.cloudflare.com/cloudflare-one/connections/connect-applications/
- ngrok Docs: https://ngrok.com/docs
- Vercel Docs: https://vercel.com/docs

Good luck! 🚀
