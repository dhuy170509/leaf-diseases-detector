# Configuration Template for Deployment

## Your Information

### HuggingFace Account
```
Username: _________________
Token: _________________
Repo URL: https://huggingface.co/YOUR_USERNAME/leaf-disease-detector
```

### Model URLs (After Upload)
```
1. EfficientNetB0:
   https://huggingface.co/YOUR_USERNAME/leaf-disease-detector/resolve/main/efficientnetb0_notop.h5

2. Plant Disease:
   https://huggingface.co/YOUR_USERNAME/leaf-disease-detector/resolve/main/plant_disease_model.h5

3. Mango Disease:
   https://huggingface.co/YOUR_USERNAME/leaf-disease-detector/resolve/main/mango_model.h5
```

### GitHub Account
```
Username: _________________
Repo URL: https://github.com/YOUR_USERNAME/leaf-disease-detector
```

### Render.com
```
Service Name: leaf-disease-detector
Public URL: https://leaf-disease-detector.onrender.com
```

---

## Commands to Run

### 1. Upload to HuggingFace
```powershell
huggingface-cli login
# Paste your token

huggingface-cli upload YOUR_USERNAME/leaf-disease-detector D:\huy\leaf-disease-detector-1\model\ --repo-type model
```

### 2. Update Configuration
Edit `utils/downloadModels.js` - replace all `USERNAME` with your HuggingFace username

### 3. Push to GitHub
```powershell
cd D:\huy\leaf-disease-detector-1
git init
git config user.name "Your Name"
git config user.email "your@email.com"
git add .
git commit -m "Leaf disease detector - full deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/leaf-disease-detector
git push -u origin main
```

### 4. Deploy to Render
Visit https://render.com → New Web Service → Connect GitHub

---

## Troubleshooting

**Models not downloading?**
- Check URLs are correct in `downloadModels.js`
- Verify HuggingFace files are public
- Check internet connection

**Deploy fails?**
- Verify `npm install && npm run build` works locally
- Check `package.json` has correct scripts
- Check port is 8765 or configurable

**Still issues?**
- Save this file with your info
- Share with me for help! 📧
