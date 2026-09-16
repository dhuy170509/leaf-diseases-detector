# 🎯 EfficientNetB0 H5 Model - Quick Start

**Status:** ✅ Ready to use  
**Model:** EfficientNetB0 (pre-trained, no top layer)  
**Endpoint:** `POST /api/predict-h5`  
**Server:** `http://192.168.1.3:8765`

---

## 🚀 Quick Test

### Option 1: Using PowerShell Script
```powershell
.\test_h5.ps1
```

### Option 2: Using curl
```bash
# Test available models
curl "http://192.168.1.3:8765/api/models"

# Test prediction (with image)
curl -X POST "http://192.168.1.3:8765/api/predict-h5" \
  -F "image=@your_image.jpg"
```

### Option 3: Using Python
```python
import requests

with open('image.jpg', 'rb') as f:
    response = requests.post(
        'http://192.168.1.3:8765/api/predict-h5',
        files={'image': f}
    )
    
print(response.json()['data'])
```

---

## 📋 Response Format

```json
{
  "success": true,
  "data": {
    "disease": "early_blight_tomato",
    "confidence": 0.92,
    "confidence_percent": "92.0%",
    "is_valid": true,
    "severity": "SEVERE",
    "topk_predictions": [
      {
        "rank": 1,
        "disease": "early_blight_tomato",
        "confidence_percent": "92.0%"
      }
    ],
    "disease_info": {...},
    "model_type": "EfficientNetB0",
    "processing_time_ms": 2500
  }
}
```

---

## 📁 Files

| File | Purpose |
|------|---------|
| `model/efficientnetb0_notop.h5` | Model weights |
| `model/predict_h5.py` | Python prediction script |
| `server/src/services/efficientNetH5Service.ts` | Backend service |
| `server/src/routes/api.ts` | API routes |
| `H5_INTEGRATION_COMPLETE.md` | Full documentation |
| `test_h5.ps1` | PowerShell test script |
| `test_h5.py` | Python test script (needs requests library) |

---

## ✅ What's Included

- ✅ Model loading from H5 file
- ✅ Image preprocessing (224x224)
- ✅ Confidence scoring
- ✅ Top-3 predictions
- ✅ Disease information lookup
- ✅ Error handling & retry logic
- ✅ Processing time tracking
- ✅ JSON output format

---

## 🛠️ Setup Summary

```
Model File: efficientnetb0_notop.h5 ✅
Python Service: predict_h5.py ✅
Backend Service: efficientNetH5Service.ts ✅
API Route: /api/predict-h5 ✅
Server: Running ✅
Database: Connected ✅
```

---

## 📊 Performance

- **Model Loading:** ~1-2 seconds (first prediction)
- **Prediction:** ~1-2 seconds (subsequent predictions)
- **Total Time:** ~2-3 seconds per image

---

## 🎓 Examples

### React Component
```jsx
const [result, setResult] = useState(null);

const handlePredict = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    
    const res = await fetch('http://192.168.1.3:8765/api/predict-h5', {
        method: 'POST',
        body: formData
    });
    
    const { data } = await res.json();
    setResult(data);
};

// Display result
{result && (
    <>
        <p>Disease: {result.disease}</p>
        <p>Confidence: {result.confidence_percent}</p>
        <p>Severity: {result.severity}</p>
    </>
)}
```

### Node.js Backend
```javascript
import FormData from 'form-data';
import fs from 'fs';
import axios from 'axios';

const stream = fs.createReadStream('image.jpg');
const form = new FormData();
form.append('image', stream);

const response = await axios.post(
    'http://192.168.1.3:8765/api/predict-h5',
    form,
    { headers: form.getHeaders() }
);

console.log(response.data.data.disease);
```

---

## 🔧 Configuration

### Image Size
- Default: 224x224 (EfficientNetB0 standard)
- Adjustable in `model/predict_h5.py` line ~45

### Confidence Threshold
- Default: 30% (0.3)
- Adjust in API call or in service

### Top-K Predictions
- Default: 3 predictions
- Adjustable in `model/predict_h5.py`

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Model not found" | Check: `model/efficientnetb0_notop.h5` exists |
| "Connection refused" | Use network IP: `192.168.1.3:8765` instead of localhost |
| "Timeout" | First prediction may take 3-5s while loading model |
| "Python error" | Check: `model/requirements.txt` - TensorFlow installed |
| "Disease not found" | Update: `models/disease_info.json` with your classes |

---

## 🎯 Next Steps

1. ✅ Test with `test_h5.ps1`
2. ✅ Try uploading image at `http://192.168.1.3:8765/test-upload`
3. ✅ Integrate into React app (see examples above)
4. ✅ Fine-tune disease database with your specific diseases
5. ✅ Deploy to production

---

**🎉 Ready to use! Start testing now.**

See `H5_INTEGRATION_COMPLETE.md` for detailed documentation.
