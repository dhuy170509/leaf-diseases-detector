# Quick Command Reference

## Environment Setup (Already Done ✅)

```powershell
# 1. Create virtual environment
python -m venv D:\huy\leaf-disease-detector-1\.venv

# 2. Activate (optional - tools handle this)
D:\huy\leaf-disease-detector-1\.venv\Scripts\Activate.ps1

# 3. Install dependencies (Already installed 19 packages)
# See ENVIRONMENT_READY.md for full list
```

---

## Daily Commands

### Test Environment
```powershell
cd d:\huy\leaf-disease-detector-1\model
D:\huy\leaf-disease-detector-1\.venv\Scripts\python.exe test_environment.py
```

### Check Training Script Help
```powershell
D:\huy\leaf-disease-detector-1\.venv\Scripts\python.exe transfer_learning_trainer.py --help
```

---

## Training Commands

### Pre-train on PlantVillage (CPU - 12-24 hrs / GPU - 3-6 hrs)
```powershell
D:\huy\leaf-disease-detector-1\.venv\Scripts\python.exe transfer_learning_trainer.py `
  --mode pretrain `
  --plantvillage-path "D:\datasets\plantvillage" `
  --output-dir "models/plantvillage_pretrained" `
  --epochs-pretrain 50 `
  --batch-size 32
```

### Fine-tune on Local Crops (CPU - 2-4 hrs / GPU - 30 min)
```powershell
D:\huy\leaf-disease-detector-1\.venv\Scripts\python.exe transfer_learning_trainer.py `
  --mode finetune `
  --local-data-path "D:\datasets\local_crops" `
  --pretrained-model "models/plantvillage_pretrained/best_model.h5" `
  --output-dir "models/finetuned" `
  --epochs-finetune 30 `
  --batch-size 32
```

### Train Both Phases (Sequential)
```powershell
D:\huy\leaf-disease-detector-1\.venv\Scripts\python.exe transfer_learning_trainer.py `
  --mode both `
  --plantvillage-path "D:\datasets\plantvillage" `
  --local-data-path "D:\datasets\local_crops" `
  --output-dir "models/complete" `
  --epochs-pretrain 50 `
  --epochs-finetune 30 `
  --batch-size 32
```

---

## Monitoring Training

### TensorBoard (Real-time metrics)
```powershell
# Terminal 1: Start TensorBoard
D:\huy\leaf-disease-detector-1\.venv\Scripts\python.exe -m tensorboard.main --logdir models/logs

# Terminal 2: Open browser
Start-Process http://localhost:6006
```

### Check GPU Usage (if available)
```powershell
# For NVIDIA GPUs
nvidia-smi

# For general system stats
Get-Process | Select-Object Name, CPU, Memory | Sort-Object Memory -Descending | Select-Object -First 10
```

---

## Jupyter Notebook Training

### Start Jupyter
```powershell
D:\huy\leaf-disease-detector-1\.venv\Scripts\python.exe -m jupyter notebook
```

### Open Training Notebook
Open browser to: `http://localhost:8888`  
Navigate to: `model/mobilenetv2_attention_training.ipynb`

---

## Model Inference

### Quick Test
```python
from mobilenetv2_attention_model import create_mobilenetv2_attention_model
from segmentation_service import SegmentationService
import cv2
import numpy as np

# Load model
model = create_mobilenetv2_attention_model((224, 224, 3), num_classes=5)
model.load_weights("models/finetuned/best_model.h5")

# Load image
image = cv2.imread("path/to/leaf_image.jpg")
image = cv2.resize(image, (224, 224))
image = image.astype('float32') / 255.0

# Predict
prediction = model.predict(np.expand_dims(image, axis=0))
disease_class = np.argmax(prediction)

# Segment
segmentation_service = SegmentationService()
mask = segmentation_service.segment_image(image)

print(f"Disease class: {disease_class}")
```

---

## Directory Structure Reference

```
d:\huy\leaf-disease-detector-1\
├── model/
│   ├── mobilenetv2_attention_model.py        (Core model architecture)
│   ├── segmentation_service.py               (U-Net segmentation)
│   ├── transfer_learning_trainer.py          (Training pipeline)
│   ├── test_environment.py                   (Validation script)
│   ├── mobilenetv2_attention_training.ipynb  (Interactive notebook)
│   └── requirements.txt                      (Dependencies)
├── models/                                    (Trained models storage)
│   ├── plantvillage_pretrained/
│   ├── finetuned/
│   └── logs/                                 (TensorBoard logs)
├── server/                                    (API server)
├── client/                                    (Web UI)
└── ENVIRONMENT_READY.md                      (Setup complete indicator)
```

---

## Troubleshooting

### Issue: CUDA not found (using CPU)
```
TensorFlow will automatically use CPU if GPU not available.
To force CPU: set TF_FORCE_GPU_ALLOW_GROWTH=false
To use GPU: Ensure CUDA 11.x and cuDNN are installed
```

### Issue: Out of memory
```
Reduce batch size: --batch-size 16 (from 32)
Reduce model input: Not recommended for accuracy
Use gradient accumulation: Requires code modification
```

### Issue: Slow training
```
Check GPU usage: nvidia-smi
If CPU-bound: Training on CPU is normal (slow but works)
If GPU available: Ensure TensorFlow detects it with:
  D:\...\python.exe -c "import tensorflow as tf; print(tf.config.list_physical_devices('GPU'))"
```

### Issue: Import errors after updates
```
Reinstall packages:
D:\...\python.exe -m pip install --upgrade --force-reinstall numpy tensorflow
```

---

## Important Paths

| Component | Path |
|-----------|------|
| Virtual Environment | `D:\huy\leaf-disease-detector-1\.venv` |
| Python Executable | `D:\huy\leaf-disease-detector-1\.venv\Scripts\python.exe` |
| Model Scripts | `d:\huy\leaf-disease-detector-1\model\` |
| Training Output | `d:\huy\leaf-disease-detector-1\models\` |
| TensorBoard Logs | `d:\huy\leaf-disease-detector-1\models\logs\` |

---

## Useful Tips

1. **Backtick for multiline commands in PowerShell**
   ```powershell
   command `
     --arg1 value1 `
     --arg2 value2
   ```

2. **Save training logs**
   ```powershell
   D:\...\python.exe transfer_learning_trainer.py ... | Tee-Object -FilePath training_$(Get-Date -Format 'yyyyMMdd_HHmmss').log
   ```

3. **Background execution (training)**
   ```powershell
   Start-Process powershell -ArgumentList "-NoProfile -Command `"cd path && python script.py`""
   ```

4. **Check available Python packages**
   ```powershell
   D:\...\python.exe -m pip list
   ```

---

**Last Updated**: 2025-11-02  
**Status**: ✅ Environment Ready  
**Next Action**: Prepare PlantVillage dataset and run pre-training
