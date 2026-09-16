# 🧪 Quick Start: Model Voting System Testing

## 📍 Access the System

**URL:** `http://192.168.1.3:8765/test-upload` (or `http://localhost:8765/test-upload`)

---

## 🎬 Complete Workflow

### Step 1: Upload Image
1. Open http://192.168.1.3:8765/test-upload
2. Click **"📸 Mở Camera"** or upload a leaf image
3. Take/select a photo of a diseased leaf

### Step 2: View All Predictions
Page will show:
```
🧠 Ensemble Learning - Dự Đoán Từ 3 AI Models
📋 Chi tiết dự đoán của từng model - 🗳️ Bỏ phiếu cho kết quả đúng:

[ResNet50 Card]  [MobileNetV2 Card]  [InceptionV3 Card]
✅ Model này ĐÚNG ✅ Model này ĐÚNG ✅ Model này ĐÚNG
```

### Step 3: Cast Your Vote
1. **Identify the CORRECT disease** from your knowledge
2. Click **"✅ Model này ĐÚNG"** on the card showing that correct disease
3. **Success!** You'll see:
   ```
   ✅ ResNet50 was correct!
   Model Accuracy: 87.3%
   Voting Weight: 1.3x
   ```

### Step 4: Check Leaderboard
**Console command** (in browser DevTools - F12):
```javascript
window.showModelLeaderboard();
// Shows: 🥇 ResNet50 (87.3%) | 🥈 InceptionV3 (82.5%) | 🥉 MobileNetV2 (71.4%)
```

---

## 🔍 API Testing

### Test 1: Record Feedback

```bash
curl -X POST http://localhost:8765/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "modelName": "ResNet50",
    "predictedDisease": "brown_spot_rice",
    "userSelectedDisease": "brown_spot_rice",
    "imageFilename": "test.jpg"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "feedback": {
    "modelName": "ResNet50",
    "isCorrect": true,
    "message": "✅ ResNet50 was correct!",
    "modelAccuracy": "85.2%",
    "modelWeight": "1.3x"
  }
}
```

### Test 2: Get Leaderboard

```bash
curl http://localhost:8765/api/models/performance
```

**Expected Response:**
```json
{
  "success": true,
  "summary": "🏆 Model Performance Leaderboard\n================================\n🥇 1. ResNet50\n   Accuracy: 87.3%...",
  "models": [...],
  "leaderboard": [
    {
      "rank": 1,
      "medal": "🥇",
      "modelName": "ResNet50",
      "accuracy": 0.873,
      "votingWeight": 1.3,
      ...
    }
  ]
}
```

### Test 3: Get Current Weights

```bash
curl http://localhost:8765/api/models/weights
```

**Expected Response:**
```json
{
  "success": true,
  "weights": {
    "ResNet50": 1.3,
    "MobileNetV2": 0.9,
    "InceptionV3": 1.1
  }
}
```

---

## 🧪 Test Scenarios

### Scenario 1: Correct Vote
1. Upload image
2. See predictions:
   - ResNet50: Brown Spot Rice (79.5%)
   - MobileNetV2: Sheath Blight (61.8%)
   - InceptionV3: Early Blight (71.3%)
3. You KNOW it's Brown Spot Rice
4. Click "✅ Model này ĐÚNG" on ResNet50
5. ✅ Feedback shows ResNet50 vote counted

### Scenario 2: Wrong Model Vote
1. Upload image
2. See predictions (same as above)
3. You vote that InceptionV3 (Early Blight) was correct
4. ✅ System records: InceptionV3 correct, ResNet50/MobileNetV2 wrong
5. Result: InceptionV3 accuracy increases, weight goes up

### Scenario 3: Check Model Performance
1. After 3-5 votes, run:
   ```bash
   curl http://localhost:8765/api/models/performance
   ```
2. See each model's total votes and accuracy
3. Weights should reflect voting results

### Scenario 4: Observe Weight Changes
1. Record initial weights:
   ```bash
   curl http://localhost:8765/api/models/weights
   ```
   Output: `{"ResNet50": 1.0, "MobileNetV2": 1.0, "InceptionV3": 1.0}`

2. Upload image and vote for a model 5 times
3. Check weights again:
   ```bash
   curl http://localhost:8765/api/models/weights
   ```
   Output: `{"ResNet50": 1.3, "MobileNetV2": 0.7, "InceptionV3": 1.0}`

---

## 📊 Metrics to Track

### Per Model:
- **Total Predictions**: How many times voted on
- **Correct**: How many times confirmed right
- **Accuracy**: Correct / Total %
- **Weight**: 0.5x - 1.5x multiplier
- **Last Updated**: Timestamp of last vote

### System:
- **Unanimous Votes**: % of predictions where all 3 agreed
- **Consensus Accuracy**: Accuracy when all 3 agreed (should be high)
- **Average Confidence**: Average confidence across all predictions
- **Top Model**: Currently best-performing model

---

## 🐛 Debugging

### Enable Console Logging
Open DevTools (F12) → Console tab

**Voting attempt:**
```javascript
window.voteForModel('ResNet50', 'brown_spot_rice');
// Console should show: "🗳️ User voting for model: ResNet50"
```

**Check current weights:**
```javascript
fetch('/api/models/weights')
  .then(r => r.json())
  .then(d => console.log(d.weights));
```

**View performance:**
```javascript
fetch('/api/models/performance')
  .then(r => r.json())
  .then(d => console.log(d.leaderboard));
```

---

## ✅ Success Criteria

✓ Web interface shows all 3 model predictions  
✓ Voting buttons appear for each model  
✓ Clicking vote sends feedback to server  
✓ Console shows success message  
✓ `/api/feedback` endpoint returns feedback  
✓ `/api/models/performance` shows updated stats  
✓ `/api/models/weights` shows changed weights  
✓ Weights change based on voting pattern  
✓ Leaderboard reflects voting results  
✓ System gracefully handles edge cases  

---

## 🔄 Example Test Run

### Initial State
```
GET /api/models/weights
{"ResNet50": 1.0, "MobileNetV2": 1.0, "InceptionV3": 1.0}
```

### Vote 1: ResNet50 Correct
```
POST /api/feedback
{"modelName": "ResNet50", "userSelectedDisease": "brown_spot_rice"}
Response: ✅ ResNet50 was correct!

GET /api/models/performance
ResNet50: 1/1 correct (100%)
```

### Vote 2: ResNet50 Correct
```
POST /api/feedback
{"modelName": "ResNet50", "userSelectedDisease": "brown_spot_rice"}
Response: ✅ ResNet50 was correct!

GET /api/models/performance
ResNet50: 2/2 correct (100%)
```

### Vote 3: MobileNetV2 Wrong
```
POST /api/feedback
{"modelName": "MobileNetV2", "userSelectedDisease": "early_blight"}
Response: ❌ MobileNetV2 predicted wrong

GET /api/models/performance
MobileNetV2: 0/1 correct (0%)
```

### Check Final Weights
```
GET /api/models/weights
{
  "ResNet50": 1.3,          ← Boosted (2 correct)
  "MobileNetV2": 0.5,       ← Penalized (0 correct)
  "InceptionV3": 1.0        ← Neutral (no votes)
}
```

---

## 📱 Mobile Testing

1. Open http://192.168.1.3:8765/test-upload on phone
2. Take photo with camera
3. Predictions show vertically stacked
4. Tap voting buttons (full-width)
5. Feedback appears below
6. Can scroll through all models and vote

---

## 🎓 Learning Outcomes

After testing, you should understand:
- ✅ How ensemble learning works
- ✅ How voting systems improve accuracy
- ✅ How machine learning adapts to feedback
- ✅ Why diversity in models matters
- ✅ How to track model performance
- ✅ Real-world AI evaluation

---

## 📞 Troubleshooting

| Issue | Solution |
|-------|----------|
| Voting button doesn't work | Check browser console for errors (F12) |
| No feedback message appears | Check `/api/feedback` endpoint in Network tab |
| Weights don't change | Need multiple votes (1-2 won't show change) |
| Leaderboard shows same weights | Check if you voted - need 1+ vote per model |
| Server error on feedback | Ensure all required fields sent in POST |
| Models all show same prediction | This is valid - models can agree! |

---

**Version**: 1.0  
**Last Updated**: November 1, 2025  
**Status**: Ready for Testing 🟢
