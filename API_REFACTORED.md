# API Documentation - Leaf Disease Detector v2

## Overview
This API uses an **Adapter Pattern** architecture with multiple AI models for robust disease detection.

### Architecture
- **Primary Model**: best_model.weights.h5 (257.7 MB)
- **Fallback Models**: 5 additional models for redundancy
- **Framework**: TensorFlow/Keras
- **Input Size**: 224x224 RGB images
- **Output**: Disease class + confidence + probability distribution

---

## Endpoints

### 1. **Predict Disease** (POST)
Predict disease from an uploaded leaf image.

**URL**: `POST /api/predict`

**Headers**:
```
Content-Type: multipart/form-data
```

**Request Body**:
```json
{
  "image": <binary file>,           // Required: Image file
  "plantPart": "leaves",             // Optional: leaves|stem|root|flower|fruit|whole
  "environmentalCondition": "normal", // Optional: normal|humid|dry|hot|cold
  "diseaseHistory": "none",          // Optional: none|past|current|recurring
  "treatmentAttempted": "none",      // Optional: treatment name or none
  "urgencyLevel": "normal",          // Optional: low|normal|urgent|critical
  "region": "unknown"                // Optional: Location name
}
```

**Successful Response** (200 OK):
```json
{
  "success": true,
  "prediction": {
    "disease": "Bệnh rỉ sét",
    "confidence": 0.92,
    "severity": "HIGH"
  },
  "diseaseInfo": {
    "name": "Bệnh rỉ sét lá cà chua",
    "aliases": ["Rust", "Leaf Rust"],
    "symptoms": "Vết màu cam trên mặt dưới lá",
    "treatment": "Sử dụng fungicide chứa sulfur",
    "prevention": "Tăng thông thoáng, giảm độ ẩm",
    "severity": "MEDIUM",
    "economicImpact": "Làm giảm năng suất 30-40%"
  },
  "modelUsed": "best_model",
  "confidence": 0.92,
  "confidenceLevel": "VERY_HIGH",
  "processingTime": 1234,
  "modelBreakdown": [
    {
      "modelName": "best_model",
      "disease": "Bệnh rỉ sét",
      "confidence": 0.92,
      "executionTime": 1200
    }
  ]
}
```

**Error Response** (400/500):
```json
{
  "error": "No image provided",
  "message": "Please upload an image file using the 'image' field"
}
```

**Status Codes**:
- `200` - Prediction successful
- `400` - Bad request (missing image, invalid format)
- `413` - Payload too large
- `500` - Server error

---

### 2. **Get Available Models** (GET)
Get list of all available models.

**URL**: `GET /api/models`

**Response** (200 OK):
```json
{
  "availableModels": [
    {
      "name": "best_model",
      "filename": "best_model.weights.h5",
      "size": 257.7,
      "description": "Best general model for disease detection",
      "framework": "tensorflow",
      "priority": 1,
      "enabled": true
    },
    {
      "name": "best_mtl_model",
      "filename": "best_mtl_model.weights.h5",
      "size": 67.1,
      "description": "Multi-task learning model",
      "framework": "tensorflow",
      "priority": 2,
      "enabled": true
    }
  ],
  "totalModels": 6,
  "primaryModel": "best_model",
  "fallbackModels": ["best_mtl_model", "best_mtl_model_phase1"]
}
```

---

### 3. **Get Model Status** (GET)
Get current status of all models.

**URL**: `GET /api/models/status`

**Response** (200 OK):
```json
{
  "primary": {
    "name": "best_model",
    "filename": "best_model.weights.h5",
    "size": 257.7,
    "isLoaded": true
  },
  "fallbacks": [
    {
      "name": "best_mtl_model",
      "isLoaded": true
    }
  ],
  "total": 6,
  "status": "operational",
  "timestamp": "2025-12-18T16:56:41Z"
}
```

---

### 4. **Get Disease Info** (GET)
Get detailed information about a specific disease.

**URL**: `GET /api/diseases/:name`

**Parameters**:
- `name` (string): Disease name or Vietnamese name

**Response** (200 OK):
```json
{
  "name": "Bệnh rỉ sét lá cà chua",
  "aliases": ["Rust", "Leaf Rust", "Early Leaf Spot"],
  "commonNames": "Tomato Rust",
  "symptoms": "Vết màu cam trên mặt dưới lá, dần chuyển thành nâu đen",
  "causes": "Nấm Puccinia spp.",
  "treatment": "Sử dụng fungicide chứa sulfur hoặc copper",
  "prevention": "Tăng thông thoáng, tránh tưới nước trên lá",
  "severity": "MEDIUM",
  "economicImpact": "Giảm năng suất 20-30%",
  "affectedCrops": ["Cà chua", "Tiêu", "Dâu tây"]
}
```

---

### 5. **Health Check** (GET)
Check server and model status.

**URL**: `GET /health`

**Response** (200 OK):
```json
{
  "status": "healthy",
  "timestamp": "2025-12-18T16:56:41Z",
  "uptime": 3600,
  "database": "connected",
  "models": {
    "total": 6,
    "loaded": 6,
    "primary": "best_model"
  }
}
```

---

## Error Handling

### Common Errors

**Missing Image**
```json
{
  "error": "No image provided",
  "message": "Please upload an image file using the 'image' field",
  "status": 400
}
```

**Invalid Image Format**
```json
{
  "error": "Invalid image format",
  "message": "Supported formats: JPEG, PNG, WebP",
  "status": 400
}
```

**All Models Failed**
```json
{
  "error": "Prediction failed",
  "message": "All models failed to predict. Please try again.",
  "status": 500,
  "modelStatus": {
    "primary": "failed",
    "fallbacks": ["failed", "failed"]
  }
}
```

---

## Model Details

### Best Model (Primary)
- **File**: best_model.weights.h5
- **Size**: 257.7 MB
- **Input**: 224x224 RGB
- **Output**: 10 disease classes + probabilities
- **Accuracy**: ~92-95%
- **Latency**: ~1-2 seconds

### Multi-Task Learning Model
- **File**: best_mtl_model.weights.h5
- **Size**: 67.1 MB
- **Capabilities**: Disease classification + leaf segmentation
- **Accuracy**: ~88-91%
- **Latency**: ~1.5-2.5 seconds

### EfficientNet B0
- **File**: efficientnetb0_notop.h5
- **Size**: 16.7 MB
- **Advantages**: Lightweight, fast
- **Accuracy**: ~85-88%
- **Latency**: ~0.8-1 second

---

## Usage Examples

### cURL Example
```bash
# Upload image and predict
curl -X POST http://192.168.1.11:8765/api/predict \
  -F "image=@leaf_image.jpg" \
  -F "plantPart=leaves" \
  -F "urgencyLevel=urgent"
```

### Python Example
```python
import requests

url = "http://192.168.1.11:8765/api/predict"
files = {"image": open("leaf_image.jpg", "rb")}
data = {
    "plantPart": "leaves",
    "urgencyLevel": "normal"
}

response = requests.post(url, files=files, data=data)
print(response.json())
```

### JavaScript/Fetch Example
```javascript
const formData = new FormData();
formData.append('image', imageFile);
formData.append('plantPart', 'leaves');
formData.append('urgencyLevel', 'normal');

fetch('http://192.168.1.11:8765/api/predict', {
    method: 'POST',
    body: formData
})
.then(r => r.json())
.then(data => console.log(data));
```

---

## Response Time SLA

| Scenario | Target Time | Max Time |
|----------|------------|----------|
| Single prediction | 1-2s | 5s |
| With full analysis | 2-3s | 8s |
| Model fallback | 2-4s | 10s |
| Health check | <100ms | 500ms |

---

## Rate Limiting

- **Free tier**: 100 requests/hour
- **Premium**: Unlimited
- **Concurrent requests**: 10 max

---

## Best Practices

1. **Image Quality**
   - Use clear, well-lit images
   - Avoid blurry or rotated images
   - Capture multiple angles if possible

2. **Context Information**
   - Provide plant part information for better diagnosis
   - Include environmental conditions if known
   - Specify urgency level for prioritization

3. **Error Handling**
   - Implement retry logic with exponential backoff
   - Cache results when possible
   - Monitor model fallback events

---

## Support & Issues

For issues or questions:
- GitHub: https://github.com/phamthinhu2992/leaf-disease-detector
- Email: support@leafdisease.io
- Documentation: https://docs.leafdisease.io

