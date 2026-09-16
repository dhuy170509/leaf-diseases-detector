# 🤖 Auto-Training System

This system allows the leaf disease detector to **automatically retrain models** with new user-provided data.

## Features

✅ **Incremental Learning** - Add new disease samples and retrain
✅ **Transfer Learning** - Use pre-trained models as base
✅ **Version Control** - Track all training sessions
✅ **Progress Tracking** - Real-time training status
✅ **Multi-Model Support** - Retrain all 6 H5 models simultaneously

## API Endpoints

### 1. Upload Training Data
```bash
POST /api/training/upload-data
```

**Parameters:**
- `image` (file) - Image file of diseased leaf
- `diseaseLabel` (string) - Disease name/class

**Example:**
```bash
curl -X POST http://localhost:8765/api/training/upload-data \
  -F "image=@leaf_sample.jpg" \
  -F "diseaseLabel=powdery_mildew"
```

**Response:**
```json
{
  "success": true,
  "message": "Training image uploaded",
  "diseaseLabel": "powdery_mildew",
  "filename": "1704067234_leaf_sample.jpg",
  "timestamp": "2025-11-05T20:07:14.123Z"
}
```

### 2. Start Model Retraining
```bash
POST /api/training/retrain
```

**Parameters:**
- `epochs` (int, optional) - Number of training epochs (default: 5)
- `models` (array, optional) - Models to retrain (default: all)

**Example:**
```bash
curl -X POST http://localhost:8765/api/training/retrain \
  -H "Content-Type: application/json" \
  -d '{
    "epochs": 10,
    "models": ["efficientnet_merged.h5"]
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Training started",
  "statusUrl": "/api/training/status",
  "estimatedTime": 600000,
  "timestamp": "2025-11-05T20:07:14.123Z"
}
```

### 3. Check Training Status
```bash
GET /api/training/status
```

**Response:**
```json
{
  "success": true,
  "training": true,
  "progress": {
    "status": "training",
    "model": "efficientnet_merged.h5",
    "progress": 45,
    "startTime": 1704067234000,
    "estimatedTime": 600000,
    "elapsedTime": 270000,
    "remainingTime": 330000
  }
}
```

### 4. Get Training Statistics
```bash
GET /api/training/stats
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalSessions": 5,
    "totalEpochs": 25,
    "bestAccuracy": 0.9234,
    "lastSession": {
      "timestamp": "2025-11-05T19:30:00.000Z",
      "model": "leaf_disease_model.h5",
      "epochs": 5,
      "final_accuracy": 0.8954,
      "samples": 150,
      "classes": 8
    }
  }
}
```

### 5. Count Training Data
```bash
GET /api/training/data-count
```

**Response:**
```json
{
  "success": true,
  "dataCounts": {
    "powdery_mildew": 25,
    "leaf_spot": 18,
    "rust": 12,
    "healthy": 45
  },
  "totalImages": 100,
  "readyForTraining": true
}
```

## Usage Flow

### Step 1: Collect Training Data
```bash
# Upload multiple disease samples
for img in disease_samples/*.jpg; do
  curl -X POST http://localhost:8765/api/training/upload-data \
    -F "image=@$img" \
    -F "diseaseLabel=powdery_mildew"
done
```

### Step 2: Check Data Status
```bash
curl http://localhost:8765/api/training/data-count
```

### Step 3: Start Training
```bash
curl -X POST http://localhost:8765/api/training/retrain \
  -H "Content-Type: application/json" \
  -d '{"epochs": 10}'
```

### Step 4: Monitor Progress
```bash
# Check status every 10 seconds
watch -n 10 'curl -s http://localhost:8765/api/training/status | jq'
```

### Step 5: View Results
```bash
curl http://localhost:8765/api/training/stats
```

## Directory Structure

```
training_data/
├── powdery_mildew/
│   ├── 1704067234_sample1.jpg
│   ├── 1704067235_sample2.jpg
│   └── ...
├── leaf_spot/
│   ├── 1704067236_sample1.jpg
│   └── ...
└── healthy/
    └── ...

model/
├── efficientnet_merged.h5
├── plant_disease_model.h5_retrained.h5  ← After retraining
├── training_history.json
└── auto_train.py
```

## Training History

All training sessions are logged in `model/training_history.json`:

```json
{
  "created_at": "2025-11-05T20:00:00.000Z",
  "training_sessions": [
    {
      "timestamp": "2025-11-05T20:07:14.123Z",
      "model": "plant_disease_model.h5",
      "epochs": 5,
      "final_accuracy": 0.8954,
      "samples": 150,
      "classes": 8
    }
  ],
  "total_epochs": 15,
  "best_accuracy": 0.9234
}
```

## Automatic Features

✅ **Auto-save retrained models** - Models saved as `*_retrained.h5`
✅ **Early stopping** - Prevents overfitting
✅ **Data augmentation** - Rotation, zoom, shift for better generalization
✅ **Class balancing** - Equal weight for all disease classes
✅ **Progress tracking** - Real-time stdout/stderr capture

## Performance

- **Training time**: ~1-2 minutes per epoch per model (GPU dependent)
- **Data requirements**: Minimum 5-10 images per disease class
- **Model size**: ~50-65 MB each

## Best Practices

1. **Collect diverse data** - Different angles, lighting, plant varieties
2. **Label accurately** - Use correct disease names
3. **Use sufficient samples** - At least 20-50 images per class
4. **Monitor accuracy** - Check `/api/training/stats` regularly
5. **Backup models** - Keep previous versions before retraining

## Troubleshooting

**Issue: "No training data uploaded yet"**
- Upload images first using `/api/training/upload-data`

**Issue: Training takes too long**
- Reduce `epochs` parameter
- Use GPU acceleration (configure TensorFlow)

**Issue: Low accuracy after training**
- Add more training samples
- Ensure labels are correct
- Check data quality

## Example: Web UI Integration

```html
<!-- Upload Form -->
<form id="uploadForm">
  <input type="file" id="imageInput" accept="image/*" required>
  <input type="text" id="diseaseLabel" placeholder="Disease name" required>
  <button type="submit">Upload Training Data</button>
</form>

<script>
document.getElementById('uploadForm').onsubmit = async (e) => {
  e.preventDefault();
  
  const formData = new FormData();
  formData.append('image', document.getElementById('imageInput').files[0]);
  formData.append('diseaseLabel', document.getElementById('diseaseLabel').value);
  
  const res = await fetch('/api/training/upload-data', {
    method: 'POST',
    body: formData
  });
  
  const data = await res.json();
  alert(data.message);
};

// Monitor Training
async function checkTrainingStatus() {
  const res = await fetch('/api/training/status');
  const data = await res.json();
  
  if (data.training) {
    console.log(`Training: ${data.progress.progress}%`);
    setTimeout(checkTrainingStatus, 5000);
  } else {
    console.log('Training complete!');
  }
}
</script>
```

## References

- [TensorFlow Transfer Learning](https://www.tensorflow.org/tutorials/images/transfer_learning)
- [Keras Data Augmentation](https://keras.io/api/preprocessing/image/)
- [Model Training Best Practices](https://keras.io/guides/training_with_built_in_methods/)
