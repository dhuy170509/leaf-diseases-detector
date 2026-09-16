# 🌍 Deploy to Render.com - Full Functionality

## Step 1: Chuẩn bị Repository

### Tạo `.gitignore` để exclude không cần thiết:
```
node_modules/
.venv/
__pycache__/
*.pyc
.env
.env.local
.DS_Store
Thumbs.db
*.log
.next/
out/
.cache/
dist/
build/
```

### Tạo `render.yaml` - Configuration cho Render:
```yaml
services:
  - type: web
    name: leaf-disease-detector
    env: node
    plan: free
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 8765
```

## Step 2: Push lên GitHub

```bash
git init
git add .
git commit -m "Leaf disease detector - full deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/leaf-disease-detector.git
git push -u origin main
```

## Step 3: Deploy trên Render

1. Vào: https://render.com
2. Click "New +" → "Web Service"
3. Chọn GitHub repo
4. Configure:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Environment:** Node.js
   - **Plan:** Free

✅ Deploy! URL sẽ là: `https://leaf-disease-detector.onrender.com`

---

## ⚠️ File Size Issue

Nếu models H5 quá lớn (tổng > 500MB), dùng **Model Hosting Service**:

### Option A: HuggingFace Hub (Free)
```bash
pip install huggingface-hub
huggingface-cli upload YOUR_USERNAME/leaf-disease-detector model/ --repo-type model
```
Rồi download khi app start.

### Option B: AWS S3 (Free Tier)
Upload models lên S3, app download on-demand.

### Option C: Google Drive (Free)
```python
# Download models from Google Drive khi start
from google.colab import files
gdown.download(drive_url, 'model.h5', quiet=False)
```

---

## 🚀 Recommended Solution

**Kết hợp:**
1. Code + Frontend → Render (free)
2. Models H5 → HuggingFace Hub (free)
3. App auto-download models on first run

---

## 📝 Modify `server/src/index.ts` để download models:

```typescript
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

async function ensureModelsExist() {
  const models = [
    {
      name: 'efficientnetb0_notop.h5',
      url: 'https://huggingface.co/USERNAME/leaf-disease-detector/resolve/main/efficientnetb0_notop.h5'
    },
    {
      name: 'plant_disease_model.h5',
      url: 'https://huggingface.co/USERNAME/leaf-disease-detector/resolve/main/plant_disease_model.h5'
    },
    {
      name: 'mango_model.h5',
      url: 'https://huggingface.co/USERNAME/leaf-disease-detector/resolve/main/mango_model.h5'
    }
  ];

  for (const model of models) {
    const modelPath = path.join('model', model.name);
    if (!fs.existsSync(modelPath)) {
      console.log(`📥 Downloading ${model.name}...`);
      const response = await fetch(model.url);
      const buffer = await response.buffer();
      fs.writeFileSync(modelPath, buffer);
      console.log(`✅ Downloaded ${model.name}`);
    }
  }
}

// Call before starting server
app.listen(PORT, async () => {
  await ensureModelsExist();
  console.log(`🚀 Server ready!`);
});
```

---

## ✅ Final Result

**Public URL:** `https://leaf-disease-detector.onrender.com`

### Features:
- ✅ 4 AI models (Ensemble, EfficientNet, Plant, Mango)
- ✅ Image upload/camera capture
- ✅ Real-time predictions
- ✅ Disease database
- ✅ AI chatbot
- ✅ Weather integration
- ✅ **NO PASSWORD** - Public access
- ✅ **Available 24/7** - Production deployment

**Share this URL with anyone!** 🌍
