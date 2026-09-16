# 🗳️ Model Voting & Feedback System - Leaf Disease Detector

## Overview

The Leaf Disease Detector now includes an intelligent **voting and feedback system** where:

1. **All 3 AI model predictions are displayed** with individual voting buttons
2. **Users vote** for the correct disease diagnosis  
3. **Model accuracy is tracked** based on user feedback
4. **Poor-performing models get lower voting weights** in future ensemble predictions
5. **High-performing models get boosted weights** for better consensus

This creates a **self-improving system** where models adapt to user feedback over time.

---

## 🎯 How It Works

### Step 1: View All Predictions

When you upload a leaf image, you see predictions from all 3 models:

```
📋 Chi tiết dự đoán của từng model - 🗳️ Bỏ phiếu cho kết quả đúng:

┌─────────────────────────────┐    ┌─────────────────────────────┐    ┌─────────────────────────────┐
│     🧠 ResNet50            │    │   📊 MobileNetV2           │    │  🔬 InceptionV3            │
│ Chẩn đoán: Brown Spot Rice │    │ Chẩn đoán: Sheath Blight   │    │ Chẩn đoán: Early Blight    │
│ Độ tin cậy: 79.5%          │    │ Độ tin cậy: 61.8%          │    │ Độ tin cậy: 71.3%          │
│ Thời gian: 45ms            │    │ Thời gian: 32ms            │    │ Thời gian: 55ms            │
│                             │    │                             │    │                             │
│ [✅ Model này ĐÚNG]         │    │ [✅ Model này ĐÚNG]         │    │ [✅ Model này ĐÚNG]         │
└─────────────────────────────┘    └─────────────────────────────┘    └─────────────────────────────┘
```

### Step 2: Click Voting Button

Click **"✅ Model này ĐÚNG"** on whichever model made the correct prediction:

```
ResNet50 predicts: Brown Spot Rice ✓ CORRECT
MobileNetV2 predicts: Sheath Blight ✗
InceptionV3 predicts: Early Blight ✗

→ User clicks "✅ Model này ĐÚNG" on ResNet50
```

### Step 3: Feedback Processing

The system records:
- Which model was voted as correct
- Model accuracy is updated
- Voting weights are recalculated
- Success message shows new model weight

```
✅ ResNet50 was correct!
Model Accuracy: 85.2%
Voting Weight: 1.3x (⬆️ increased from 1.0x)
```

### Step 4: Future Predictions

On the next prediction, the ensemble uses **updated weights**:

```
OLD VOTING (Equal weight):
ResNet50 (79.5%) × 1.0 = 79.5
MobileNetV2 (61.8%) × 1.0 = 61.8
InceptionV3 (71.3%) × 1.0 = 71.3
→ Winner: ResNet50 (79.5)

NEW VOTING (ResNet50 boosted after correct vote):
ResNet50 (79.5%) × 1.3 = 103.4 ⬆️
MobileNetV2 (61.8%) × 0.9 = 55.6 ⬇️
InceptionV3 (71.3%) × 1.0 = 71.3
→ Winner: ResNet50 (103.4) - MORE CONFIDENT
```

---

## 📊 Model Accuracy Tracking

### Performance Metrics

Each model tracks:
- **Total Predictions**: Number of times model was voted on
- **Correct Predictions**: Times user confirmed model was right
- **Accuracy**: `Correct / Total` (0-100%)
- **Voting Weight**: Multiplier for future ensemble voting (0.5x - 1.5x)
- **Recent Accuracy**: Weighted towards recent votes (more important)

### Example Leaderboard

```
🏆 Model Performance Leaderboard
================================
🥇 1. ResNet50
   Accuracy: 87.3% (131/150)
   Weight: 1.3x
   
🥈 2. InceptionV3
   Accuracy: 82.5% (124/150)
   Weight: 1.1x
   
🥉 3. MobileNetV2
   Accuracy: 71.4% (107/150)
   Weight: 0.9x
```

---

## ⚖️ Voting Weight Calculation

Weights are dynamically adjusted based on accuracy:

| Accuracy | Weight | Status |
|----------|--------|--------|
| ≥ 90% | 1.5x | 🟢 Excellent - Maximum boost |
| 80-90% | 1.3x | 🟢 Very Good |
| 70-80% | 1.1x | 🟡 Good |
| 60-70% | 1.0x | 🟡 Average (baseline) |
| 50-60% | 0.9x | 🟠 Below Average |
| 40-50% | 0.7x | 🔴 Poor - Reduced weight |
| < 40% | 0.5x | 🔴 Very Poor - Minimum weight |

---

## 🔗 API Endpoints

### 1. POST /api/feedback - Record User Vote

**Request:**
```json
{
  "modelName": "ResNet50",
  "predictedDisease": "brown_spot_rice",
  "userSelectedDisease": "brown_spot_rice",
  "imageFilename": "leaf-image.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "feedback": {
    "modelName": "ResNet50",
    "isCorrect": true,
    "message": "✅ ResNet50 was correct!",
    "modelAccuracy": "87.3%",
    "modelWeight": "1.3x"
  }
}
```

### 2. GET /api/models/performance - Leaderboard

**Request:**
```
GET /api/models/performance
```

**Response:**
```json
{
  "success": true,
  "summary": "🏆 Model Performance Leaderboard\n...",
  "models": [
    {
      "modelName": "ResNet50",
      "totalPredictions": 150,
      "correctPredictions": 131,
      "accuracy": 0.873,
      "votingWeight": 1.3,
      "lastUpdated": "2025-11-01T13:15:00.000Z",
      "recentAccuracy": 0.88
    },
    ...
  ],
  "leaderboard": [
    {
      "rank": 1,
      "medal": "🥇",
      "modelName": "ResNet50",
      ...
    },
    ...
  ]
}
```

### 3. GET /api/models/weights - Current Weights

**Request:**
```
GET /api/models/weights
```

**Response:**
```json
{
  "success": true,
  "weights": {
    "ResNet50": 1.3,
    "MobileNetV2": 0.9,
    "InceptionV3": 1.1
  },
  "description": "Current voting weights for ensemble model predictions"
}
```

---

## 🎮 User Interface

### Voting Buttons

Each model shows a prominent **voting button**:

```html
<button onclick="window.voteForModel('ResNet50', 'brown_spot_rice')">
  ✅ Model này ĐÚNG
</button>
```

Button styling:
- 🟢 Green gradient background (`#10b981` → `#059669`)
- Responsive (full-width on mobile)
- Smooth hover animation
- Shows feedback after click

### Feedback Display

After voting, a success message appears:

```
┌─────────────────────────────────────────────────────────┐
│ ✅ ResNet50 was correct!                               │
│ Model Accuracy: 87.3% | Voting Weight: 1.3x            │
│                                                         │
│ (Auto-hides after 5 seconds)                            │
└─────────────────────────────────────────────────────────┘
```

---

## 📈 Example Workflow

### Initial State (All Models Equal)

```
Image: Leaf with brown spots

ResNet50:     Brown Spot Rice (79.5%) × 1.0 weight = 79.5 votes ✓ WINNER
MobileNetV2:  Sheath Blight (61.8%) × 1.0 weight = 61.8 votes
InceptionV3:  Early Blight (71.3%) × 1.0 weight = 71.3 votes

Final Diagnosis: Brown Spot Rice (79.5%)
```

### After User Votes ResNet50

```
💾 Feedback recorded:
   Model: ResNet50
   Predicted: Brown Spot Rice ✓
   User confirmed: Brown Spot Rice ✓
   Result: CORRECT ✓

📊 Updated Statistics:
   ResNet50: 1/1 correct (100%)
   Voting Weight: 1.3x (promoted from 1.0x)
```

### Next Prediction (Improved)

```
New Image: Similar brown spot leaf

ResNet50:     Brown Spot Rice (78.2%) × 1.3 weight = 101.7 votes ✓ STRONGER
MobileNetV2:  Bacterial Blight (68.5%) × 1.0 weight = 68.5 votes
InceptionV3:  Powdery Mildew (62.1%) × 1.0 weight = 62.1 votes

Final Diagnosis: Brown Spot Rice (78.2%) - MORE CONFIDENT
```

### After 150 Predictions

```
📊 Final Leaderboard:

🥇 ResNet50
   131 correct out of 150 (87.3% accuracy)
   Voting Weight: 1.3x
   Role: Primary model - gets 30% boost
   
🥈 InceptionV3
   124 correct out of 150 (82.5% accuracy)
   Voting Weight: 1.1x
   Role: Secondary model - gets 10% boost

🥉 MobileNetV2
   107 correct out of 150 (71.4% accuracy)
   Voting Weight: 0.9x
   Role: Tertiary model - gets 10% penalty
```

---

## 🔍 Viewing Performance

### In Web Interface

Click "🏆 Leaderboard" button to see:
- Current rankings
- Accuracy percentages
- Voting weights
- Total predictions per model

### Via API

```bash
# Get leaderboard
curl http://localhost:8765/api/models/performance

# Get current weights
curl http://localhost:8765/api/models/weights
```

---

## 💡 Key Benefits

### 1. **Self-Improving System**
- Models improve based on real user feedback
- Weights automatically adjust
- No manual tuning needed

### 2. **Transparency**
- Users see all model predictions
- Can verify which model was correct
- Understand why ensemble voted that way

### 3. **Accountability**
- Each model tracked individually
- Performance metrics visible
- Poor models are automatically deprioritized

### 4. **Better Accuracy**
- Ensemble voting improves over time
- High-performing models get more influence
- Reduces mistakes from low-confidence predictions

### 5. **Data-Driven Decisions**
- Real usage data informs model weights
- Adapts to local crops/diseases
- Learns from agricultural experts' feedback

---

## 🛠️ Technical Implementation

### Model Performance Service

Located in: `server/src/services/modelPerformanceService.ts`

**Key Functions:**

```typescript
// Record user feedback
recordFeedback(feedback: PredictionFeedback): Promise<void>

// Get all model performances
getModelPerformances(): ModelPerformance[]

// Get leaderboard (sorted by accuracy)
getLeaderboard(): ModelPerformance[]

// Get current voting weights
getVotingWeights(): { [modelName: string]: number }

// Get performance summary
getPerformanceSummary(): string
```

### Database Schema

Tracks for each model:
- `modelName` - ResNet50, MobileNetV2, InceptionV3
- `totalPredictions` - Number of times voted on
- `correctPredictions` - Number of times confirmed correct
- `accuracy` - Calculated percentage
- `votingWeight` - Multiplier for ensemble
- `lastUpdated` - Timestamp of last update
- `recentAccuracy` - Weighted recent performance

---

## 📱 Mobile Experience

On mobile devices:
- Voting buttons stack vertically
- Each model card is full-width
- Touch-friendly button size (44px minimum)
- Feedback pops up without overlay
- Auto-scroll to feedback message

---

## ⚙️ Configuration

### Voting Weight Thresholds

Adjust in `modelPerformanceService.ts`:

```typescript
private calculateVotingWeight(model: ModelPerformance): number {
  const accuracy = Math.max(0.3, model.accuracy);
  
  if (accuracy >= 0.9) return 1.5;    // ← Excellent
  else if (accuracy >= 0.8) return 1.3;
  else if (accuracy >= 0.7) return 1.1;
  // ... etc
}
```

### Minimum Accuracy

Current minimum weight: **0.5x** (very poor models still contribute)

To prevent terrible models from influencing:
```typescript
const accuracy = Math.max(0.3, model.accuracy); // Set to 0.5 for strict filter
```

---

## 📊 Example: Real-World Usage

### Week 1: Initial Training
- 50 farmers upload leaf images
- Each votes on which AI was correct
- ResNet50: 43/50 correct (86%)
- MobileNetV2: 38/50 correct (76%)
- InceptionV3: 41/50 correct (82%)

**Weights Assigned:**
- ResNet50: 1.3x 🏆
- InceptionV3: 1.1x
- MobileNetV2: 0.9x

### Week 2: Improved Performance
- Same 50 farmers, new images
- Ensemble now uses new weights
- ResNet50 given more influence → fewer mistakes
- Accuracy improved by ~3%

### Month 1: Mature System
- 1000+ predictions recorded
- Each model's accuracy stabilized
- Weights reflect true capabilities
- New farmers benefit from collected wisdom

---

## 🔐 Security & Privacy

### Data Collected

- Which model was voted as correct
- Disease prediction and user confirmation
- Timestamp
- User IP (for analytics only)
- Image filename (not image itself)

### No Personal Data

- No photos stored from votes
- No user identification
- Aggregated statistics only
- Can be reset anytime with `POST /api/models/reset`

---

## 📞 Support

### Common Questions

**Q: Why did a model's weight decrease?**  
A: Users voted it wrong more often. The system deprioritizes it automatically.

**Q: Can I override the voting?**  
A: The system respects all votes equally. Each farmer's vote counts the same.

**Q: What if all 3 models are wrong?**  
A: Vote for the "closest" one. System learns that this image type is hard.

**Q: How long until weights stabilize?**  
A: ~100-200 votes per model for stable weights (varies by disease diversity).

---

## 🚀 Future Enhancements

- [ ] Retrain models using collected feedback data
- [ ] Per-crop accuracy tracking
- [ ] Seasonal performance adjustments
- [ ] Geographic performance zones
- [ ] Model confidence calibration
- [ ] Active learning (flag uncertain cases)
- [ ] Continuous model updates

---

**Last Updated**: November 1, 2025  
**System Version**: 3.0 with Voting & Feedback  
**Status**: 🟢 Active and Learning
