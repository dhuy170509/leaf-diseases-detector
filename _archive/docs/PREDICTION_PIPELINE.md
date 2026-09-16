🌿 LEAF DISEASE DETECTION - COMPLETE PREDICTION PIPELINE
═══════════════════════════════════════════════════════════════════

📊 PREDICTION FLOW:

1️⃣  USER UPLOADS IMAGE
    └─ Web UI: http://localhost:8765/test-upload
       └─ Image → Browser form submission (multipart/form-data)

2️⃣  SERVER RECEIVES IMAGE
    └─ Endpoint: POST /api/predict
       └─ Middleware: multer (memory storage, 10MB limit)
       └─ Image buffer → predictController

3️⃣  CONTROLLER PROCESSES REQUEST
    └─ File: server/src/controllers/predictController.ts
       ├─ Extract image buffer & metadata
       ├─ Call: predictWithEnsemble(image) → mlModelsService
       └─ Call: predictImage(imageData) → modelService

4️⃣  ENSEMBLE VOTING (3 AI Models)
    └─ File: server/src/services/mlModelsService.ts
       ├─ ResNet50: Feature extraction + voting
       ├─ MobileNetV2: Texture pattern detection
       ├─ InceptionV3: Complex feature analysis
       └─ Result: unanimousVote flag + final disease

5️⃣  PIXEL-BY-PIXEL ANALYSIS
    └─ File: server/src/services/modelService.ts
       ├─ analyzeImagePixelByPixel() → pixelAnalysisService
       │   └─ Color distribution analysis
       │   └─ Disease marker detection
       │   └─ Spatial pattern recognition
       ├─ detectCrop() → cropDetectionService
       ├─ getDiseasesByCrop() → vietnamDiseaseDatabase
       └─ Confidence calculation from multiple factors

6️⃣  GENERATE DETAILED ANALYSIS
    └─ File: server/src/services/analysisService.ts
       ├─ generateDetailedAnalysis()
       │   └─ Treatment strategy
       │   └─ Disease progression
       │   └─ Economic impact assessment
       └─ formatAnalysisReport()

7️⃣  SAVE TO DATABASE
    └─ File: server/src/services/databaseService.ts
       └─ Save: userId, imageFilename, prediction, confidence, etc.

8️⃣  RETURN RESPONSE
    └─ Content-Type check
       ├─ HTML form: Beautiful HTML results page
       └─ API call: JSON response with:
           ├─ prediction.prediction: Disease name
           ├─ prediction.confidence: Confidence score
           ├─ prediction.modelInfo: Model metadata
           ├─ ensembleData: 3-model voting breakdown
           ├─ imageInfo: File metadata
           └─ timestamp: Processing time

9️⃣  DISPLAY RESULTS
    └─ Frontend: React components
       ├─ PredictionView.tsx: Main result display
       ├─ ResultsChart.tsx: Confidence visualization
       └─ Common components: Loading, error handling

═════════════════════════════════════════════════════════════════════

🔧 KEY DEPENDENCIES:
✅ pixelAnalysisService.ts - Jimp image processing
✅ mlModelsService.ts - 3-model ensemble
✅ modelService.ts - Unified prediction interface
✅ analysisService.ts - Detailed diagnosis
✅ vietnamDiseaseDatabase.ts - Disease info lookup
✅ cropDetectionService.ts - Crop type detection
✅ databaseService.ts - SQLite storage

📁 IMPORTANT FILES:
- Server entry: server/src/index.ts (port 8765)
- Routes: server/src/routes/api.ts
- Controllers: server/src/controllers/predictController.ts
- Services: server/src/services/*.ts
- Client: client/src/components/upload/ImageUploader.tsx

🚀 STARTING SYSTEM:
npm start              # From root directory

📝 TESTING:
1. POST http://localhost:8765/api/predict (form data with 'image' file)
2. GET http://localhost:8765/test-upload (web form)
3. GET http://localhost:8765/ (API info)

✨ RESPONSE STRUCTURE:
{
  success: true,
  prediction: {
    prediction: "Disease name",
    confidence: 0.85,
    crop: "Cà chua",
    isHealthy: false,
    symptoms: ["Triệu chứng 1", ...],
    treatment: ["Xử lí 1", ...],
    severity: "MODERATE",
    modelInfo: {
      name: "...",
      modelsUsed: 3,
      totalModels: 3
    },
    ensembleData: {
      finalDisease: "...",
      finalConfidence: 0.87,
      unanimousVote: true,
      modelBreakdown: [...]
    }
  },
  timestamp: "2025-11-02T..."
}

═════════════════════════════════════════════════════════════════════
