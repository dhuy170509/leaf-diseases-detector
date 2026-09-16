# 🚀 3 Cách Deploy - Chọn 1

## ✨ Cách 1: **Local + Tunnel (Nhanh Nhất - 5 phút)**

Server đang chạy ở `http://localhost:8765`

### Share ngay với bạn bè trên WiFi:
```
http://192.168.1.3:8765
```

### Share qua internet (không cần password):
```powershell
npm install -g @railway/cli
railway login
railway init
railway up --detach
```

✅ **Xong!** Render sẽ cho URL public

---

## 🎯 Cách 2: **GitHub + Render (Recommended - 10 phút)**

### Step 1: Tạo GitHub Repo
```powershell
git init
git add .
git commit -m "Leaf disease detector - ready to deploy"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/leaf-disease-detector
git push -u origin main
```

### Step 2: Deploy on Render
1. Vào https://render.com
2. Click "New Web Service"
3. Connect GitHub → Select repo
4. Configure:
   - Build: `npm install && npm run build`
   - Start: `npm start`
   - Plan: **Free**

✅ **URL:** `https://leaf-disease-detector.onrender.com`

**Lưu ý:** Models sẽ không có (file quá lớn)

---

## 🌟 Cách 3: **Full Features + Models (Tốt Nhất - 20 phút)**

### Step 1: Upload Models lên HuggingFace

#### A. Web UI (Easiest)
1. Vào https://huggingface.co
2. Sign up / Login
3. Click "New Model"
4. Upload files từ `model/` folder
5. Copy URLs

#### B. Command Line
```powershell
# Install
pip install huggingface-hub

# Edit script
Edit upload_models_huggingface.py
# Set: HF_USERNAME, HF_TOKEN

# Run
python upload_models_huggingface.py
```

### Step 2: Update Download Script
Edit `utils/downloadModels.js` - thay URLs:
```javascript
const MODELS = [
  {
    name: 'efficientnetb0_notop.h5',
    url: 'https://huggingface.co/YOUR_USERNAME/leaf-disease-detector/resolve/main/efficientnetb0_notop.h5'
  },
  // ... other models
];
```

### Step 3: Push + Deploy
```powershell
git add .
git commit -m "Add model download support"
git push

# Deploy on Render (same as Cách 2)
```

✅ **Result:** Public URL với **đầy đủ 4 models**

---

## 📊 Comparison

| | **Cách 1** | **Cách 2** | **Cách 3** |
|--|-----------|-----------|-----------|
| **Setup Time** | 5 min | 10 min | 20 min |
| **Models** | ❌ No | ❌ No | ✅ Yes |
| **AI Features** | ⚠️ Partial | ⚠️ Partial | ✅ Full |
| **Public** | ✅ Yes | ✅ Yes | ✅ Yes |
| **24/7** | ❌ Cần PC on | ✅ Yes | ✅ Yes |
| **Free** | ✅ Yes | ✅ Yes | ✅ Yes |

---

## 🎯 **QUICK START**

### Để share **ngay lập tức:**
```
✅ Already running at: http://192.168.1.3:8765
```

### Để share **trên internet (no models):**
```powershell
railway login
railway init
railway up
# Copy URL → Share!
```

### Để share **fully functional (with all models):**
```
1. Upload models to HuggingFace (20 min)
2. Update downloadModels.js (5 min)
3. Deploy to Render (5 min)
4. Share public URL! ✅
```

---

**Bạn chọn cách nào?** 🚀
