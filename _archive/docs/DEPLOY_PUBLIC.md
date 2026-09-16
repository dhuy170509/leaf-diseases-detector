# 🚀 Deploy Leaf Disease Detector - 3 Cách Miễn Phí

## 🌟 Cách 1: Railway.app (Recommended - Nhanh nhất)

### Step 1: Cài đặt Railway CLI
```powershell
npm install -g @railway/cli
```

### Step 2: Login Railway
```powershell
railway login
```

### Step 3: Deploy
```powershell
cd d:\huy\leaf-disease-detector-1
railway init
railway up
```

✅ **Xong!** Sẽ có public URL tự động

---

## 🌟 Cách 2: Render.com

### Step 1: Tạo account
- Vào: https://render.com
- Sign up with GitHub

### Step 2: New Web Service
- Click "New +" → "Web Service"
- Connect GitHub repo
- Build: `npm install && npm run build`
- Start: `npm start`
- Port: `8765`

✅ **Xong!** Có public `.onrender.com` domain

---

## 🌟 Cách 3: Vercel (Fastest)

### Step 1: Cài Vercel CLI
```powershell
npm install -g vercel
```

### Step 2: Deploy
```powershell
vercel
```

Follow prompts → Done!

✅ **Public URL** sẽ hiển thị

---

## 📊 So sánh

| Platform | Setup Time | Free Tier | URL | Restart |
|----------|-----------|-----------|-----|---------|
| **Railway** | 2 min | $5/month | `.railway.app` | Auto |
| **Render** | 5 min | ✅ Forever | `.onrender.com` | Auto |
| **Vercel** | 1 min | ✅ Forever | `.vercel.app` | Auto |

---

## 🎯 Khuyến nghị

✅ **Render.com** - Miễn phí vĩnh viễn, Web Service
✅ **Vercel** - Siêu nhanh setup, tính năng tuyệt vời

---

## ⚠️ Lưu ý

1. Server port phải là **8765** hoặc configurable
2. Database SQLite sẽ reset khi restart (tạm ổn)
3. Để persistent data → dùng **PostgreSQL** (free tier)

---

## 📋 Một lần setup hoàn chỉnh

**Railway:**
```powershell
npm install -g @railway/cli
railway login
railway init
# Chọn Node.js
# Chọn yes để deploy
railway up
# ✅ Done! URL sẽ in ra
```

**Copy URL share với bất kỳ ai!** 🎉
