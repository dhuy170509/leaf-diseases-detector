# Free Domain Deployment Guide for Local AI Website

## ⚠️ IMPORTANT NOTICE

**Freenom Status (December 2025):** Freenom has significantly restricted new registrations. Many TLDs (.tk, .ml, .ga, .cf, .gq) are currently unavailable or suspended. This guide provides the process, but you may encounter availability issues.

**If domain registration fails → Alternative solution provided at the end**

---

## 1. CHOSEN FREE DOMAIN NAME

**Primary Choice:** `leafai.tk`
**Alternatives:**
- `leafai.ml`
- `leafai.ga`
- `leafai.cf`
- `leafai.gq`
- `aileaf.tk`
- `leafscan.tk`

**Final Public URL:** `https://www.leafai.tk/web/`

---

## 2. FREENOM REGISTRATION STEPS

### Step 2.1: Check Domain Availability

1. Visit: https://www.freenom.com
2. Enter domain: `leafai.tk` in search box
3. Click "Check Availability"
4. If available: Click "Get it now!" → "Checkout"
5. If unavailable: Try alternatives listed above

### Step 2.2: Configure Registration

1. Period: Select **"12 Months @ FREE"**
2. Forward URL: Leave empty (we'll use custom DNS)
3. Click "Continue"

### Step 2.3: Account Creation

1. Enter email address
2. Complete CAPTCHA verification
3. Create account or login
4. Verify email (check spam folder)
5. Complete registration

### Step 2.4: Access Domain Management

1. Login to Freenom
2. Go to "Services" → "My Domains"
3. Click "Manage Domain" next to your domain
4. You'll configure DNS here after Cloudflare setup

---

## 3. CLOUDFLARE SETUP (Free SSL + Tunnel)

### Step 3.1: Add Site to Cloudflare

1. Visit: https://dash.cloudflare.com
2. Create account (free) if needed
3. Click "Add a Site"
4. Enter: `leafai.tk` (your domain)
5. Select: **"Free"** plan → Continue
6. Cloudflare will show nameservers (e.g., `ns1.cloudflare.com`, `ns2.cloudflare.com`)
7. **Copy these nameservers** (you'll need them)

### Step 3.2: Update Freenom Nameservers

1. Back to Freenom → "Manage Domain" → "Management Tools" → "Nameservers"
2. Select "Use custom nameservers"
3. Enter Cloudflare nameservers:
   - Nameserver 1: `ns1.cloudflare.com` (or the one Cloudflare gave you)
   - Nameserver 2: `ns2.cloudflare.com`
4. Click "Change Nameservers"
5. **Wait 5-60 minutes** for DNS propagation
6. Cloudflare will email when site is "Active"

### Step 3.3: Enable SSL in Cloudflare

1. In Cloudflare dashboard → Select your domain
2. Go to "SSL/TLS" → "Overview"
3. Set mode to: **"Flexible"** (free HTTPS)
4. Go to "SSL/TLS" → "Edge Certificates"
5. Enable:
   - ✅ Always Use HTTPS
   - ✅ Automatic HTTPS Rewrites

---

## 4. CLOUDFLARE TUNNEL SETUP (No Port Forwarding)

### Step 4.1: Install Cloudflared

**Windows Installation:**
```powershell
# Download cloudflared
Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile "C:\Windows\System32\cloudflared.exe"

# Verify installation
cloudflared --version
```

### Step 4.2: Authenticate with Cloudflare

```powershell
cloudflared tunnel login
```
- Browser opens → Select your domain (leafai.tk) → Authorize
- Credentials saved to: `C:\Users\<username>\.cloudflared\cert.pem`

### Step 4.3: Create Named Tunnel

```powershell
cloudflared tunnel create leafai-tunnel
```
- Returns tunnel UUID (save this!)
- Creates: `C:\Users\<username>\.cloudflared\<UUID>.json`

### Step 4.4: Create Tunnel Configuration

Create file: `C:\Users\<username>\.cloudflared\config.yml`

```yaml
tunnel: <YOUR_TUNNEL_UUID>
credentials-file: C:\Users\<username>\.cloudflared\<YOUR_TUNNEL_UUID>.json

ingress:
  - hostname: leafai.tk
    service: http://localhost:8000
  - hostname: www.leafai.tk
    service: http://localhost:8000
  - service: http_status:404
```

**Replace `<YOUR_TUNNEL_UUID>` with actual UUID from Step 4.3**

### Step 4.5: Route DNS to Tunnel

```powershell
cloudflared tunnel route dns leafai-tunnel leafai.tk
cloudflared tunnel route dns leafai-tunnel www.leafai.tk
```

This automatically creates CNAME records in Cloudflare DNS.

---

## 5. DNS RECORDS (Auto-created by Tunnel)

**Cloudflare DNS Panel should show:**

| Type  | Name | Target                              | Proxy |
|-------|------|-------------------------------------|-------|
| CNAME | @    | `<uuid>.cfargotunnel.com`          | ✅ ON |
| CNAME | www  | `<uuid>.cfargotunnel.com`          | ✅ ON |

**If not auto-created, add manually:**
- Type: CNAME
- Name: @ (for root) or www (for subdomain)
- Target: `<your-tunnel-uuid>.cfargotunnel.com`
- Proxy status: ✅ Proxied (orange cloud)

---

## 6. START YOUR AI SERVER

### Step 6.1: Run FastAPI Server

```powershell
# Activate venv
& D:/huy/leaf-disease-detector-1/.venv/Scripts/Activate.ps1

# Start API server
python api_server.py
```

Server runs on `http://localhost:8000`

### Step 6.2: Start Cloudflare Tunnel

**New PowerShell window:**
```powershell
cloudflared tunnel run leafai-tunnel
```

---

## 7. KEEP SERVER ONLINE 24/7

### Option A: Windows Task Scheduler

**Create Task for API Server:**
1. Open Task Scheduler → "Create Task"
2. General:
   - Name: `LeafAI API Server`
   - ✅ Run whether user is logged on or not
   - ✅ Run with highest privileges
3. Triggers:
   - New → At system startup
4. Actions:
   - New → Start a program
   - Program: `D:/huy/leaf-disease-detector-1/.venv/Scripts/python.exe`
   - Arguments: `D:/huy/leaf-disease-detector-1/api_server.py`
   - Start in: `D:/huy/leaf-disease-detector-1`
5. Conditions:
   - ✅ Start only if on AC power (uncheck for laptop)
6. Settings:
   - ✅ If task fails, restart every: 1 minute

**Create Task for Cloudflare Tunnel:**
1. Create Task → Name: `LeafAI Cloudflare Tunnel`
2. Same settings as above, but Actions:
   - Program: `C:\Windows\System32\cloudflared.exe`
   - Arguments: `tunnel run leafai-tunnel`
   - Start in: `C:\Users\<username>\.cloudflared`

### Option B: NSSM (Windows Service)

**Install NSSM:**
```powershell
# Download NSSM
Invoke-WebRequest -Uri "https://nssm.cc/release/nssm-2.24.zip" -OutFile "$env:TEMP\nssm.zip"
Expand-Archive "$env:TEMP\nssm.zip" -DestinationPath "$env:TEMP"
Copy-Item "$env:TEMP\nssm-2.24\win64\nssm.exe" -Destination "C:\Windows\System32\"
```

**Create API Service:**
```powershell
nssm install LeafAI-API "D:/huy/leaf-disease-detector-1/.venv/Scripts/python.exe"
nssm set LeafAI-API AppParameters "D:/huy/leaf-disease-detector-1/api_server.py"
nssm set LeafAI-API AppDirectory "D:/huy/leaf-disease-detector-1"
nssm set LeafAI-API AppStdout "D:/huy/leaf-disease-detector-1/logs/api.log"
nssm set LeafAI-API AppStderr "D:/huy/leaf-disease-detector-1/logs/api_error.log"
nssm start LeafAI-API
```

**Create Tunnel Service:**
```powershell
nssm install LeafAI-Tunnel "C:\Windows\System32\cloudflared.exe"
nssm set LeafAI-Tunnel AppParameters "tunnel run leafai-tunnel"
nssm set LeafAI-Tunnel AppDirectory "C:\Users\<username>\.cloudflared"
nssm start LeafAI-Tunnel
```

---

## 8. VERIFY DEPLOYMENT

### Test Health Endpoint
```powershell
curl https://leafai.tk/health
```

**Expected Response:**
- If models loaded: `{"status":"ready","models":["SavedModel:xxx",...]}`
- If no models: `{"status":"CHƯA CÓ CƠ SỞ DỮ LIỆU","models":[]}`

### Test Web UI
Open browser: `https://leafai.tk/web/`

**Expected:** Upload form, responsive UI

### Test Prediction
Upload an image → Click "Predict"

**Expected Response:**
- If models exist: `label`, `confidence`, `models_used`
- If no models: `CHƯA CÓ CƠ SỞ DỮ LIỆU`

---

## 9. FINAL PUBLIC URLS

✅ **Website:** `https://leafai.tk/web/`
✅ **API Health:** `https://leafai.tk/health`
✅ **API Predict:** `https://leafai.tk/predict` (POST)
✅ **API Batch:** `https://leafai.tk/batch_predict` (POST)

**Share with anyone** - No authentication required, fully public.

---

## 10. TROUBLESHOOTING

### Domain shows "CHƯA CÓ CƠ SỞ DỮ LIỆU"
✅ **Normal** - This means no models in `D:\huy\leaf-disease-detector-1`

**Solution:** Place models in workspace:
- SavedModel folders (with `saved_model.pb`)
- Keras `.h5` or `.hdf5` files
- PyTorch `.pt` or `.pth` files
- ONNX `.onnx` files

### Tunnel Not Connecting
```powershell
# Check tunnel status
cloudflared tunnel info leafai-tunnel

# Check tunnel logs
cloudflared tunnel run leafai-tunnel --loglevel debug
```

### SSL Not Working
- Check Cloudflare SSL mode is "Flexible"
- Ensure proxy (orange cloud) is ON in DNS records
- Wait 5-10 minutes for SSL propagation

### Server Stops After Restart
- Verify Task Scheduler tasks are enabled
- Check task runs with highest privileges
- Review logs in `D:/huy/leaf-disease-detector-1/logs/`

---

## 11. ALTERNATIVE: FREENOM NOT WORKING

**If Freenom registration fails (common issue):**

### Use FREE Cloudflare Tunnel URL (No Custom Domain)

```powershell
# Quick tunnel (temporary URL)
cloudflared tunnel --url http://localhost:8000
```

**Gives:** `https://random-words-xyz.trycloudflare.com`
- ✅ Free HTTPS
- ✅ Public access
- ❌ URL changes on restart
- ❌ Not branded

### Alternative Free Domains:
1. **afraid.org** - Free DNS with subdomains
2. **duckdns.org** - Free dynamic DNS
3. **noip.com** - Free tier with 3 hostnames

### Recommended: Use Cloudflare Pages (Alternative Approach)
Deploy static UI to Pages (free), API stays local with tunnel - but requires more setup.

---

## 12. SECURITY NOTES

⚠️ **Your local machine is publicly accessible**
- Firewall rules apply
- Windows Defender active
- No direct port exposure (tunnel only)
- Cloudflare DDoS protection active

✅ **Safe practices:**
- Keep Windows updated
- Monitor API logs
- Set rate limiting if traffic spikes
- Use Cloudflare firewall rules if needed

---

## 13. MODEL REQUIREMENTS

**To avoid "CHƯA CÓ CƠ SỞ DỮ LIỆU":**

Place models in `D:\huy\leaf-disease-detector-1\` (or subfolders):
- SavedModel: Folder with `saved_model.pb`
- Keras: `.h5` or `.hdf5` files
- PyTorch: `.pt` or `.pth` files (saved via `torch.save()` or `torch.jit.save()`)
- ONNX: `.onnx` files

**Model will auto-load on server start.**

---

## SUMMARY

1. ✅ Domain: `leafai.tk` (or alternative from Freenom)
2. ✅ Freenom: Register 12 months free
3. ✅ Cloudflare: Free SSL + Tunnel (no port forwarding)
4. ✅ DNS: CNAME to tunnel (auto or manual)
5. ✅ 24/7: Task Scheduler or NSSM service
6. ✅ Public URL: `https://leafai.tk/web/`

**If Freenom fails:** Use temporary Cloudflare tunnel URL or alternative free DNS providers.

---

**Your AI website is now publicly accessible with HTTPS!** 🚀
