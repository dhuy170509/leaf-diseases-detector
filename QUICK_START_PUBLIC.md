# 🚀 Quick Start: Public AI Website

## What I Built For You

✅ **Professional Web UI** - Modern, responsive design with animations
✅ **Local AI Inference** - All models in `D:\huy\leaf-disease-detector-1`
✅ **Public HTTPS URL** - Instant internet access via Cloudflare Tunnel
✅ **One-Click Launcher** - No configuration needed

---

## 🎯 Launch Your Public Website (3 Steps)

### Step 1: Make sure your models are in place
Place your AI models anywhere in: `D:\huy\leaf-disease-detector-1\`

Supported formats:
- TensorFlow SavedModel (folder with `saved_model.pb`)
- Keras `.h5` or `.hdf5` files
- PyTorch `.pt` or `.pth` files
- ONNX `.onnx` files

### Step 2: Run the launcher
Open PowerShell in this folder and run:

```powershell
.\start_public_server.ps1
```

**That's it!** The script will:
1. Start your local API server
2. Install Cloudflare Tunnel (if needed)
3. Generate a public HTTPS URL
4. Show you the URL (looks like: `https://xxx-yyy-zzz.trycloudflare.com`)

### Step 3: Share your URL
Copy the URL from the terminal and share it with anyone!

Your website will be at: `https://your-url.trycloudflare.com/web/`

---

## 🌐 What People Will See

**Beautiful modern interface with:**
- 🍃 Hero section with AI branding
- 📤 Drag & drop image upload
- 🖼️ Live image preview
- 🎯 Real-time prediction results
- 📊 Confidence visualization
- 📱 Mobile-responsive design
- 🌙 Dark theme

**API Endpoints:**
- `GET /health` - Check server status
- `POST /predict` - Single image prediction
- `POST /batch_predict` - Multiple images

---

## 🔄 Keep Server Running 24/7

### Option 1: Task Scheduler (Recommended)

1. Open Task Scheduler → Create Task
2. Name: `AI Leaf Detector`
3. Triggers: At system startup
4. Actions: Start program
   - Program: `powershell.exe`
   - Arguments: `-ExecutionPolicy Bypass -File "D:\huy\leaf-disease-detector-1\start_public_server.ps1"`
5. ✅ Run whether user is logged on or not
6. ✅ Restart every 1 minute on failure

### Option 2: Keep PowerShell Window Open
Just don't close the PowerShell window where you ran the script.

---

## 📝 Important Notes

### No Models? No Problem!
If you don't have models yet, the website will show:
**"CHƯA CÓ CƠ SỞ DỮ LIỆU"**

This is the expected behavior per your requirements.

### Free Tunnel URL
The Cloudflare Tunnel URL is:
- ✅ FREE forever
- ✅ HTTPS enabled
- ✅ No port forwarding needed
- ✅ DDoS protection included
- ⚠️ URL changes each time you restart

### Want a Custom Domain?
For a permanent custom domain (e.g., `leafai.yourdomain.com`):

1. Create a free Cloudflare account
2. Add your domain to Cloudflare
3. Run: `cloudflared tunnel login`
4. Create named tunnel: `cloudflared tunnel create my-leaf-ai`
5. Route DNS: `cloudflared tunnel route dns my-leaf-ai leafai.yourdomain.com`
6. Create config file (see DEPLOYMENT_FREE_DOMAIN_GUIDE.md)

---

## 🎨 Web UI Features

**Upload Section:**
- Click or drag & drop images
- Instant preview
- File type validation
- Size limits

**Results Section:**
- Classification label
- Confidence percentage with color coding:
  - 🟢 Green: >80% confidence
  - 🟡 Yellow: 50-80% confidence
  - 🔴 Red: <50% confidence
- Visual progress bar
- Models used in ensemble
- Real-time status updates

**Responsive Design:**
- Desktop: Side-by-side layout
- Tablet/Mobile: Stacked layout
- Touch-friendly controls
- Optimized for all screen sizes

---

## 🛠️ Troubleshooting

### Script won't run
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Port 8000 already in use
Change port in `api_server.py`:
```python
uvicorn.run("api_server:app", host="0.0.0.0", port=8080, reload=False)
```

### Can't install cloudflared automatically
Download manually from:
https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/

Extract `cloudflared.exe` to `C:\Windows\System32\`

### Models not loading
Check console output for errors. Common issues:
- Model files corrupted
- Incompatible model versions
- Missing dependencies (install: `pip install -r local_inference_requirements.txt`)

---

## 📊 System Requirements

**Minimum:**
- Windows 10/11
- 4GB RAM
- Python 3.8+
- Internet connection (for Cloudflare Tunnel)

**Recommended:**
- 8GB+ RAM
- SSD storage
- Stable internet connection

---

## 🔒 Security

**What's Protected:**
- ✅ No direct port exposure to internet
- ✅ Cloudflare DDoS protection
- ✅ HTTPS encryption
- ✅ Local model execution only

**What's Public:**
- ⚠️ Anyone with URL can upload images
- ⚠️ No authentication required (by design)
- ⚠️ API endpoints are public

To add authentication, modify `api_server.py` with FastAPI security middleware.

---

## 🚀 Ready to Launch?

Run this command now:

```powershell
.\start_public_server.ps1
```

**Your AI website will be live in 10 seconds!** 🎉

---

Questions? The script output will guide you. Check logs if anything goes wrong.
