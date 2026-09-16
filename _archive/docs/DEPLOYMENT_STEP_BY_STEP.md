# 🚀 Step-by-Step: Cách 3 Full Deployment

## Phase 1️⃣ : Upload Models (10 min)

### Option A: Web UI (Easiest - Recommended)

1. **Go to:** https://huggingface.co
2. **Login/Sign up**
3. **Click:** "New Model" → "Create Model"
4. **Fill in:**
   - Model name: `leaf-disease-detector`
   - License: MIT
   - Type: Model (public)
5. **Click:** Create

6. **Upload Files:**
   - Go to: `https://huggingface.co/YOUR_USERNAME/leaf-disease-detector`
   - Click folder icon → Upload files
   - Select from `D:\huy\leaf-disease-detector-1\model\`:
     - `efficientnetb0_notop.h5`
     - `plant_disease_model.h5`
     - `mango_model.h5`

7. **Wait for upload** (may take 5-10 min per file)

8. **Get file URLs:**
   - Go to each file
   - Copy download link
   - Format: `https://huggingface.co/YOUR_USERNAME/leaf-disease-detector/resolve/main/FILENAME`

---

### Option B: Command Line (If Option A fails)

```powershell
# Get HuggingFace token from: https://huggingface.co/settings/tokens

# Login
huggingface-cli login
# Paste token when asked

# Upload all models at once
huggingface-cli upload YOUR_USERNAME/leaf-disease-detector D:\huy\leaf-disease-detector-1\model\ --repo-type model
```

---

## Phase 2️⃣ : Update Configuration (5 min)

### After uploading to HuggingFace:

1. **Open:** `utils/downloadModels.js`
2. **Replace USERNAME with your HuggingFace username**

Example:
```javascript
// BEFORE:
url: 'https://huggingface.co/USERNAME/leaf-disease-detector/resolve/main/efficientnetb0_notop.h5'

// AFTER (if username is "johndoe"):
url: 'https://huggingface.co/johndoe/leaf-disease-detector/resolve/main/efficientnetb0_notop.h5'
```

3. **Test locally:**
```powershell
npm start
# Check if models download successfully
```

---

## Phase 3️⃣ : GitHub Setup (5 min)

```powershell
# Initialize git
git init
git config user.name "Your Name"
git config user.email "your@email.com"

# Add files
git add .

# Commit
git commit -m "Leaf disease detector - full deployment ready"

# Create main branch
git branch -M main

# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/leaf-disease-detector
git push -u origin main
```

---

## Phase 4️⃣ : Deploy to Render (5 min)

1. **Go to:** https://render.com
2. **Sign up/Login** (with GitHub is easiest)
3. **Click:** "New +" → "Web Service"
4. **Connect GitHub:**
   - Select your repo: `leaf-disease-detector`
   - Click "Connect"
5. **Configure:**
   - **Name:** leaf-disease-detector
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Free
6. **Click:** Deploy

✅ **Wait 2-3 minutes...**

---

## ✅ Result: Public URL

Your system will be at:
```
https://leaf-disease-detector.onrender.com
```

✨ **Features:**
- ✅ 4 AI Models
- ✅ Image Upload
- ✅ Camera Capture
- ✅ AI Chatbot
- ✅ Disease Database
- ✅ Weather Integration
- ✅ Public Access (no password)
- ✅ 24/7 Uptime

---

## 🔄 Summary Checklist

- [ ] Phase 1: Upload models to HuggingFace
- [ ] Phase 2: Update URLs in `downloadModels.js`
- [ ] Phase 3: Push code to GitHub
- [ ] Phase 4: Deploy to Render
- [ ] ✅ Share public URL!

---

**Need help with any step? Ask!** 🎉
