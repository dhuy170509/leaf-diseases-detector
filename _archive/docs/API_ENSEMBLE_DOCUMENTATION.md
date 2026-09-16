# API Documentation - Leaf Disease Detector Ensemble Models

## Base URL
```
http://localhost:8765
http://192.168.1.3:8765  (Network)
```

---

## 🧠 Ensemble Prediction Endpoint

### POST `/api/predict`

Analyze a leaf image using ensemble learning (3 AI models).

#### Request

```bash
curl -X POST http://localhost:8765/api/predict \
  -F "image=@leaf-sample.jpg" \
  -F "plantPart=leaves" \
  -F "environmentalCondition=humid" \
  -F "urgencyLevel=normal"
```

#### Form Parameters

| Parameter | Type | Required | Description | Values |
|-----------|------|----------|-------------|--------|
| image | file | ✅ | Leaf/plant image | JPEG, PNG (max 10MB) |
| plantPart | string | ❌ | Plant part to analyze | leaves, stem, root, flower, fruit, whole |
| environmentalCondition | string | ❌ | Growing condition | normal, humid, dry, hot, cold |
| diseaseHistory | string | ❌ | Disease history | none, past, current, recurring |
| urgencyLevel | string | ❌ | How urgent | low, normal, urgent, critical |
| region | string | ❌ | Growing region | Any region name |

#### Response (Success - 200 OK)

```json
{
  "success": true,
  "prediction": {
    "prediction": "Bệnh đốm nâu lúa",
    "confidence": 0.795,
    "severity": "SEVERE",
    "processingTime": 127,
    "ensembleData": {
      "finalDisease": "Bệnh đốm nâu lúa",
      "finalConfidence": 0.795,
      "confidencePercentage": "79.5%",
      "severity": "SEVERE",
      "confidenceLevel": "HIGH",
      "unanimousVote": false,
      "recommendedTreatment": "Phun Mancozeb 80% WP (3g/l) + bón kali (KCl 50kg/ha)",
      "modelBreakdown": [
        {
          "modelName": "ResNet50",
          "disease": "brown_spot_rice",
          "confidence": "79.5%",
          "executionTime": "45ms"
        },
        {
          "modelName": "MobileNetV2",
          "disease": "sheath_blight_rice",
          "confidence": "61.8%",
          "executionTime": "32ms"
        },
        {
          "modelName": "InceptionV3",
          "disease": "early_blight_tomato",
          "confidence": "71.3%",
          "executionTime": "55ms"
        }
      ],
      "modelsUsed": 3,
      "modelNames": ["ResNet50", "MobileNetV2", "InceptionV3"]
    }
  },
  "imageInfo": {
    "filename": "leaf-sample.jpg",
    "size": 45823,
    "contentType": "image/jpeg"
  },
  "timestamp": "2025-11-01T13:15:42.123Z"
}
```

#### Confidence Levels

| Level | Confidence | Interpretation |
|-------|-----------|-----------------|
| VERY_HIGH | 90-100% | ✅ Extremely reliable |
| HIGH | 80-90% | ✅ Highly reliable |
| MEDIUM | 60-80% | 👍 Reasonably reliable |
| LOW | 40-60% | ⚠️ May need verification |
| VERY_LOW | 0-40% | ❌ Unreliable - get expert help |

#### Severity Levels

| Severity | Confidence | Meaning |
|----------|-----------|---------|
| CRITICAL | >85% | 🔴 Immediate intervention required |
| SEVERE | >75% | 🟠 Quick treatment needed |
| MODERATE | >65% | 🟡 Standard treatment sufficient |
| MILD | >55% | 🟢 Light intervention appropriate |
| SUSPECTED | <55% | ❓ Need expert confirmation |
| HEALTHY | - | ✅ No disease detected |

#### Response (Error - 400 Bad Request)

```json
{
  "error": "No image provided",
  "message": "Please upload an image file using the 'image' field"
}
```

#### Response (Server Error - 500)

```json
{
  "success": false,
  "error": "An error occurred while processing the image",
  "message": "Error details here",
  "processingTime": 50
}
```

---

## 🌤️ Weather Endpoints

### GET `/api/weather`

Get weather forecast for specific coordinates or auto-detect location.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| lat | number | ✅* | Latitude (-90 to 90) |
| lon | number | ✅* | Longitude (-180 to 180) |
| days | number | ❌ | Number of days to forecast (1-7, default: 3) |
| auto | boolean | ❌ | Auto-detect from IP if no coords |

*Either provide (lat, lon) OR set auto=true

#### Examples

```bash
# Specific location
curl "http://localhost:8765/api/weather?lat=21.0285&lon=105.8542&days=5"

# Auto-detect from IP
curl "http://localhost:8765/api/weather?auto=true&days=7"
```

#### Response

```json
{
  "success": true,
  "location": {
    "lat": 21.0285,
    "lon": 105.8542,
    "name": "Hanoi, Vietnam"
  },
  "source": "windy-api",
  "generatedAt": "2025-11-01T13:15:42Z",
  "daily": [
    {
      "date": "2025-11-01",
      "temp": {
        "min": 18,
        "max": 28,
        "avg": 23
      },
      "humidity": 0.75,
      "windSpeed": 3.2,
      "precipitationProbability": 0.4,
      "confidence": 0.92
    },
    {
      "date": "2025-11-02",
      "temp": {
        "min": 19,
        "max": 29,
        "avg": 24
      },
      "humidity": 0.68,
      "windSpeed": 2.8,
      "precipitationProbability": 0.2,
      "confidence": 0.88
    }
  ]
}
```

### GET `/api/weather/detect`

Get only the detected location without forecast.

```bash
curl "http://localhost:8765/api/weather/detect"
```

#### Response

```json
{
  "location": {
    "lat": 21.0285,
    "lon": 105.8542,
    "name": "Hanoi, Vietnam"
  },
  "source": "ip-geolocation",
  "accuracy": "approximate"
}
```

---

## 📚 Disease Database Endpoints

### GET `/api/diseases`

Get all diseases in the database.

```bash
curl "http://localhost:8765/api/diseases"
```

#### Response

```json
{
  "diseases": [
    {
      "id": "blast_rice",
      "name": "Bệnh đạo ôn lúa",
      "crop": "Lúa",
      "scientificName": "Magnaporthe oryzae",
      "description": "...",
      "symptoms": ["Đốm nâu hình thoi trên lá", "..."],
      "treatment": "...",
      "prevention": "..."
    },
    // ... more diseases
  ]
}
```

### GET `/api/diseases/search`

Search diseases by name or keyword.

```bash
curl "http://localhost:8765/api/diseases/search?q=đốm"
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| q | string | ✅ | Search query (disease name, crop, symptom) |

#### Response

```json
{
  "diseases": [
    {
      "id": "brown_spot_rice",
      "name": "Bệnh đốm nâu lúa",
      // ... disease data
    }
  ],
  "query": "đốm",
  "count": 15
}
```

### GET `/api/diseases/:id`

Get specific disease information.

```bash
curl "http://localhost:8765/api/diseases/blast_rice"
```

#### Response

```json
{
  "disease": {
    "id": "blast_rice",
    "name": "Bệnh đạo ôn lúa",
    "crop": "Lúa",
    "scientificName": "Magnaporthe oryzae",
    "description": "Bệnh nấm nghiêm trọng nhất trên lúa...",
    "causes": "Nấm Magnaporthe oryzae, thời tiết ẩm ướt...",
    "symptoms": [
      "Đốm nâu hình thoi trên lá",
      "Viền vàng quanh đốm bệnh",
      "Cổ bông gãy đổ",
      "Hạt lúa bị khô, lép"
    ],
    "treatment": "Phun Tricyclazole 75% WP (2-3g/l)...",
    "prevention": "Sử dụng giống kháng bệnh, luân canh...",
    "riskFactors": {
      "humidity": 0.85,
      "temperature": [25, 28],
      "rainfall": "high"
    }
  }
}
```

---

## 💬 Chatbot Endpoint

### POST `/api/chat`

Get AI-powered responses about plant diseases.

```bash
curl -X POST http://localhost:8765/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Làm thế nào để chữa bệnh đốm nâu lúa?"}'
```

#### Request

```json
{
  "message": "Làm thế nào để chữa bệnh đốm nâu lúa?"
}
```

#### Response

```json
{
  "message": "Để chữa bệnh đốm nâu lúa, bạn có thể: 1. Phun Mancozeb 80% WP... 2. Bón phân kali... 3. Duy trì độ ẩm hợp lý...",
  "timestamp": "2025-11-01T13:15:42Z",
  "source": "openai"
}
```

---

## 🏥 Health Check Endpoint

### GET `/api/health` or `/health`

Check server status and system information.

```bash
curl "http://localhost:8765/health"
```

#### Response

```json
{
  "status": "khỏe mạnh",
  "timestamp": "2025-11-01T13:15:42.123Z",
  "uptime": 3661.234,
  "memory": {
    "rss": 125412352,
    "heapTotal": 87654321,
    "heapUsed": 45234567,
    "external": 1234567,
    "arrayBuffers": 567890
  },
  "version": "1.0.0"
}
```

---

## 📊 Error Codes & Responses

### Common HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Prediction completed |
| 400 | Bad Request | Missing required field |
| 404 | Not Found | Endpoint doesn't exist |
| 500 | Server Error | Internal processing error |

### Error Response Format

```json
{
  "success": false,
  "error": "Error title",
  "message": "Detailed error message"
}
```

---

## 🔗 Integration Examples

### Python

```python
import requests

url = "http://localhost:8765/api/predict"
files = {"image": open("leaf.jpg", "rb")}
data = {
    "plantPart": "leaves",
    "environmentalCondition": "humid",
    "urgencyLevel": "normal"
}

response = requests.post(url, files=files, data=data)
result = response.json()

print(f"Disease: {result['prediction']['ensembleData']['finalDisease']}")
print(f"Confidence: {result['prediction']['ensembleData']['confidencePercentage']}")
print(f"Treatment: {result['prediction']['ensembleData']['recommendedTreatment']}")
```

### JavaScript (Fetch)

```javascript
const formData = new FormData();
formData.append("image", document.getElementById("imageInput").files[0]);
formData.append("plantPart", "leaves");
formData.append("environmentalCondition", "humid");

fetch("http://localhost:8765/api/predict", {
  method: "POST",
  body: formData
})
.then(res => res.json())
.then(data => {
  const ensemble = data.prediction.ensembleData;
  console.log("Final Disease:", ensemble.finalDisease);
  console.log("Confidence:", ensemble.confidencePercentage);
  console.log("Models Breakdown:", ensemble.modelBreakdown);
});
```

### cURL

```bash
# Simple prediction
curl -X POST http://localhost:8765/api/predict \
  -F "image=@photo.jpg" \
  -F "plantPart=leaves"

# With all parameters
curl -X POST http://localhost:8765/api/predict \
  -F "image=@photo.jpg" \
  -F "plantPart=leaves" \
  -F "environmentalCondition=humid" \
  -F "diseaseHistory=past" \
  -F "urgencyLevel=urgent" \
  -F "region=hanoi"

# Get weather
curl "http://localhost:8765/api/weather?lat=21.0285&lon=105.8542&days=5"

# Search diseases
curl "http://localhost:8765/api/diseases/search?q=bệnh%20đốm"
```

---

## 🔐 Security Notes

- ✅ No image storage on server (processed immediately)
- ✅ HTTPS recommended for production
- ✅ Rate limiting recommended for public APIs
- ✅ Input validation on all endpoints
- ✅ Error messages don't expose system details

---

## 📈 Rate Limiting Recommendations

For production deployment:
- Prediction: 10 requests/minute per IP
- Weather: 20 requests/minute per IP
- Disease Search: 50 requests/minute per IP
- Chatbot: 5 requests/minute per IP

---

## 📝 Response Timing

Typical processing times:
- Image prediction: 100-200ms
- Ensemble voting: 50-150ms
- Weather forecast: 500-2000ms (API dependent)
- Database query: 10-50ms

Total end-to-end: **150-300ms** for predictions

---

## 🧬 Ensemble Model Details

Each prediction uses 3 models in parallel:

```
ResNet50      → 45-55ms   → Brown/red spot detection
MobileNetV2   → 30-40ms   → Texture pattern detection
InceptionV3   → 50-60ms   → Multi-scale feature detection
                ├─────────
                Final: 50-60ms (parallel, not sequential)
```

---

**Last Updated**: November 1, 2025  
**API Version**: 3.0  
**Models**: 3 Ensemble (ResNet50, MobileNetV2, InceptionV3)
