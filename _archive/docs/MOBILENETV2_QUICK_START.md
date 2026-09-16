# MobileNetV2 + Attention Quick Start Guide

## 🚀 Quick Start (5 minutes)

### Installation
```bash
cd model
pip install -r requirements.txt
```

### Verify Installation
```bash
python -c "import tensorflow; print(f'TensorFlow {tensorflow.__version__}')"
python mobilenetv2_attention_model.py
python segmentation_service.py
```

### Training Pipeline
```bash
# 1. Pre-train on PlantVillage
python transfer_learning_trainer.py \
    --mode pretrain \
    --plantvillage-path /path/to/plantvillage \
    --epochs-pretrain 50

# 2. Fine-tune on local crops
python transfer_learning_trainer.py \
    --mode finetune \
    --local-data-path /path/to/local/crops \
    --epochs-finetune 30
```

### Jupyter Notebook
```bash
cd model/notebooks
jupyter notebook mobilenetv2_attention_training.ipynb
```

## 📊 Model Overview

| Component | Purpose | Input | Output |
|-----------|---------|-------|--------|
| **MobileNetV2** | Base feature extraction | 224×224×3 image | 7×7×1280 features |
| **CBAM Attention** | Focus on disease regions | Features | Refined features |
| **Classification Head** | Disease prediction | Features | 50 disease classes |
| **U-Net Segmentation** | Disease region isolation | 256×256×3 image | 256×256×1 mask |

## 🔄 Transfer Learning Workflow

```
┌─────────────────────────────────────────────────┐
│     ImageNet Pre-trained MobileNetV2            │
│     (Frozen Base Layers)                        │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│   Phase 1: Pre-train on PlantVillage            │
│   • 56K+ images, 50+ diseases                   │
│   • Epochs: 50                                  │
│   • Learning Rate: 1e-4                         │
│   • Output: mobilenetv2_attention_plantvillage  │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│   Phase 2: Fine-tune on Local Data              │
│   • Vietnamese crops (tomato, rice, etc.)       │
│   • Unfreeze top 100 layers                     │
│   • Epochs: 30                                  │
│   • Learning Rate: 1e-5                         │
│   • Output: mobilenetv2_attention_final         │
└─────────────────────────────────────────────────┘
```

## 📁 File Structure

```
model/
├── mobilenetv2_attention_model.py     ✓ MobileNetV2 + CBAM implementation
├── segmentation_service.py             ✓ U-Net segmentation model
├── transfer_learning_trainer.py        ✓ Training pipeline
├── predict_and_show.py                 → Use updated version
├── train.py                            → For RandomForest baseline
├── requirements.txt                    ✓ Updated dependencies
├── notebooks/
│   ├── mobilenetv2_attention_training.ipynb  ✓ Complete tutorial
│   └── training.ipynb                  → Original notebook
└── models/                             → Saved model checkpoints
```

## 💻 Python API Examples

### Load and Use Pre-trained Model
```python
import keras
import numpy as np
from mobilenetv2_attention_model import create_mobilenetv2_attention_model
from segmentation_service import SegmentationService

# Load pre-trained classifier
model = keras.models.load_model('models/mobilenetv2_attention_final.h5')

# Load segmentation model
seg_service = SegmentationService(model_path='models/unet_segmentation.h5')

# Prepare image
image = np.random.rand(224, 224, 3)

# Segment leaf region
segmentation = seg_service.segment_image(image)
masked_image = segmentation['masked_image']

# Predict disease
prediction = model.predict(np.expand_dims(masked_image, 0))
disease_idx = np.argmax(prediction[0])
confidence = prediction[0][disease_idx]

print(f"Disease: {disease_idx}, Confidence: {confidence:.2%}")
```

### Train Custom Model
```python
from transfer_learning_trainer import TransferLearningTrainer

trainer = TransferLearningTrainer(
    num_classes=50,
    output_dir='./my_models',
    include_segmentation=True
)

# Pre-train
trainer.pretrain_on_plantvillage(
    plantvillage_path='/path/to/plantvillage',
    epochs=50,
    batch_size=32
)

# Fine-tune
trainer.finetune_on_local_data(
    local_data_path='/path/to/local/crops',
    epochs=30,
    batch_size=16
)
```

## 🎯 Key Features

### ✅ What's Implemented

1. **MobileNetV2 + CBAM Attention**
   - Channel Attention: Recalibrates feature channels
   - Spatial Attention: Focuses on disease regions
   - Efficient architecture: 50MB model size

2. **U-Net Segmentation**
   - Isolates leaf regions from background
   - Generates disease region heatmaps
   - Optional multi-task learning

3. **Transfer Learning Pipeline**
   - Pre-training on PlantVillage dataset
   - Fine-tuning on local Vietnamese crops
   - Progressive unfreezing of layers

4. **Data Augmentation**
   - Rotation, zoom, shift, flip
   - Brightness/contrast variation
   - Specialized augmentation per phase

5. **Comprehensive Training Tools**
   - Command-line training interface
   - TensorBoard monitoring
   - Model checkpointing & early stopping
   - Detailed evaluation metrics

### 📈 Expected Performance

| Metric | PlantVillage | Local Data | Notes |
|--------|--------------|------------|-------|
| **Accuracy** | 92-97% | 88-95% | After fine-tuning |
| **Precision** | 91-96% | 87-94% | Per-class average |
| **Recall** | 90-96% | 86-93% | Disease detection rate |
| **Inference Time** | 300-500ms | 300-500ms | CPU, single image |
| **Inference Time (GPU)** | <100ms | <100ms | With GPU acceleration |

## 🔧 Configuration Reference

### Default Hyperparameters
```python
CONFIG = {
    'INPUT_SHAPE': (224, 224, 3),
    'BATCH_SIZE': 32,
    'EPOCHS_PRETRAIN': 50,
    'EPOCHS_FINETUNE': 30,
    'LEARNING_RATE_PRETRAIN': 1e-4,
    'LEARNING_RATE_FINETUNE': 1e-5,
    'DROPOUT_RATE': 0.5,
    'NUM_CLASSES': 50,
}
```

### Adjust for Your Environment

**Limited GPU Memory (2-4 GB)**
```python
BATCH_SIZE = 8  # Reduced from 32
EPOCHS_PRETRAIN = 30  # Reduced from 50
LEARNING_RATE_PRETRAIN = 5e-5  # Lower to prevent overfitting
```

**Large GPU Memory (8+ GB)**
```python
BATCH_SIZE = 64  # Increased from 32
EPOCHS_PRETRAIN = 100  # More epochs for better convergence
LEARNING_RATE_PRETRAIN = 2e-4  # Can be more aggressive
```

**CPU Only (No GPU)**
```python
BATCH_SIZE = 4
USE_MIXED_PRECISION = False
NUM_WORKERS = 2
```

## 📊 Dataset Preparation Checklist

### PlantVillage
- [ ] Download from GitHub (spMohanty/PlantVillage-Dataset)
- [ ] Extract to `data/plantvillage/`
- [ ] Verify folder structure: `plantvillage/disease_class/images/`
- [ ] Check total images: 56,000+
- [ ] Classes present: 50+ diseases

### Local Vietnamese Crops
- [ ] Collect images from Gia Lai region
- [ ] Organize by crop: `tomato/`, `rice/`, etc.
- [ ] Organize by disease: `early_blight/`, `healthy/`, etc.
- [ ] Recommended: 50+ images per disease class
- [ ] Verify image quality: Clear, well-lit leaf photos
- [ ] Image resolution: At least 224×224 pixels

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| **Out of Memory** | Reduce batch size, use gradient accumulation |
| **Slow Training** | Enable GPU, reduce image size, use mixed precision |
| **Low Accuracy** | Increase training epochs, verify data quality |
| **Model Won't Load** | Check custom objects, verify model path |
| **Inconsistent Results** | Set random seeds, fix data splitting |

## 📞 Need Help?

1. Check the detailed guide: `MOBILENETV2_ATTENTION_GUIDE.md`
2. Review Jupyter notebook: `notebooks/mobilenetv2_attention_training.ipynb`
3. Run example code: `python mobilenetv2_attention_model.py`
4. Test segmentation: `python segmentation_service.py`

## 🎓 Learning Resources

- **MobileNetV2 Paper**: https://arxiv.org/abs/1801.04381
- **CBAM Paper**: https://arxiv.org/abs/1807.06521
- **Transfer Learning**: https://cs231n.github.io/transfer-learning/
- **TensorFlow Guide**: https://www.tensorflow.org/guide
- **PlantVillage Dataset**: https://github.com/spMohanty/PlantVillage-Dataset

## ✨ Key Innovations

1. **CBAM Attention Mechanism**
   - Sequentially applies channel and spatial attention
   - Focuses on small, unclear, or occluded disease regions
   - Learned attention weights for each image

2. **Segmentation-Aware Classification**
   - Pre-segments leaf region to remove background noise
   - Multi-task learning improves generalization
   - Disease region heatmaps for model interpretation

3. **Efficient Transfer Learning**
   - Progressive fine-tuning strategy
   - Layer-wise learning rate adaptation
   - Minimal overfitting on small local datasets

4. **Production-Ready Implementation**
   - Command-line interface for training
   - Model checkpointing and early stopping
   - Comprehensive evaluation metrics
   - TensorBoard integration

---

**Version**: 1.0  
**Last Updated**: November 2024  
**Status**: ✅ Production Ready
