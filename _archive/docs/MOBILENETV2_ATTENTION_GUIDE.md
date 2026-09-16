# MobileNetV2 + Attention Mechanism Implementation Guide

## Overview

This guide implements an advanced deep learning system for leaf disease detection using:
- **MobileNetV2** backbone for efficient inference
- **CBAM (Convolutional Block Attention Module)** for focusing on disease regions
- **U-Net Segmentation** for disease region isolation
- **Transfer Learning** from PlantVillage public dataset
- **Fine-tuning** on local Vietnamese crop data

## Architecture Components

### 1. MobileNetV2 + CBAM Attention

#### Channel Attention (CA)
- **Purpose**: Recalibrate channel-wise feature responses
- **Process**: Applies squeeze-and-excitation operations
- **Benefits**: Identifies which feature channels are most important for disease detection

```
Input → GlobalAveragePooling → FC1 (reduction) → FC2 → Sigmoid → Channel Weights
     ↓
     GlobalMaxPooling → FC1 (reduction) → FC2 ↗
     
Output = Input × (CA_weight + SA_weight)
```

#### Spatial Attention (SA)
- **Purpose**: Generates attention maps along spatial dimension
- **Process**: Computes channel-wise statistics (mean, max)
- **Benefits**: Focuses on specific spatial locations of disease symptoms

```
Input → [AvgPooling, MaxPooling] → Concatenate → Conv(1x1) → Sigmoid → Spatial Weights
Output = Input × Spatial_weights
```

### 2. U-Net Segmentation Model

Separates healthy leaf tissue from diseased regions:
- **Encoder**: 4-layer downsampling with skip connections
- **Decoder**: 4-layer upsampling with feature concatenation
- **Output**: Binary segmentation mask (0=healthy, 1=disease)

Benefits:
- Isolates disease regions for focused analysis
- Removes background noise
- Improves classification accuracy on unclear/occluded areas

### 3. Transfer Learning Pipeline

#### Phase 1: Pre-training on PlantVillage
```
PlantVillage Dataset (56K+ images, 50+ diseases)
           ↓
   ImageNet pretrained MobileNetV2 (frozen base)
           ↓
   Train only top layers with CBAM attention
           ↓
   Fine-tune on PlantVillage images
           ↓
   Output: mobilenetv2_attention_plantvillage.h5
```

#### Phase 2: Fine-tuning on Local Data
```
Pre-trained Model (PlantVillage weights)
           ↓
   Unfreeze top 100 layers
           ↓
   Load local Vietnamese crop data (Tomato, Rice, etc.)
           ↓
   Train with lower learning rate (1e-5)
           ↓
   Output: mobilenetv2_attention_finetuned.h5
```

## Installation

### Requirements
```bash
cd model
pip install -r requirements.txt
```

### Key Dependencies
- TensorFlow >= 2.11.0
- Keras >= 2.11.0
- OpenCV >= 4.5.0
- NumPy, Pandas, Scikit-learn
- Albumentations (data augmentation)
- Matplotlib, Seaborn (visualization)

## Usage Guide

### 1. Training Models

#### Option A: Using Python Script

```bash
# Pre-train on PlantVillage
python transfer_learning_trainer.py \
    --mode pretrain \
    --plantvillage-path /path/to/plantvillage/data \
    --epochs-pretrain 50 \
    --batch-size 32 \
    --output-dir ./models

# Fine-tune on local data
python transfer_learning_trainer.py \
    --mode finetune \
    --local-data-path /path/to/local/crops \
    --pretrained-model ./models/mobilenetv2_attention_plantvillage_*.h5 \
    --epochs-finetune 30 \
    --batch-size 16 \
    --output-dir ./models
```

#### Option B: Using Jupyter Notebook

```bash
jupyter notebook notebooks/mobilenetv2_attention_training.ipynb
```

### 2. Dataset Preparation

#### PlantVillage Dataset Structure
```
plantvillage_data/
├── Apple___Apple_scab/
│   ├── image1.jpg
│   ├── image2.jpg
│   └── ... (100+ images per class)
├── Apple___Black_rot/
├── Tomato___Bacterial_spot/
├── Tomato___Early_blight/
├── Tomato___Late_blight/
├── Rice___Leaf_blast/
├── ... (50+ disease classes)
└── */healthy/
```

**Download**: https://github.com/spMohanty/PlantVillage-Dataset

#### Local Vietnamese Crop Structure
```
local_crops_gia_lai/
├── tomato/
│   ├── early_blight/
│   │   ├── img_001.jpg
│   │   ├── img_002.jpg
│   │   └── ... (20+ images)
│   ├── late_blight/
│   ├── powdery_mildew/
│   ├── bacterial_speck/
│   └── healthy/
├── rice/
│   ├── blast/
│   ├── brown_spot/
│   ├── sheath_blight/
│   └── healthy/
└── ... (other crops)
```

### 3. Model Inference

#### Using Trained Model
```python
from tensorflow import keras
from segmentation_service import SegmentationService
from mobilenetv2_attention_model import create_mobilenetv2_attention_model
import numpy as np
import cv2

# Load models
classifier = keras.models.load_model('mobilenetv2_attention_finetuned.h5')
seg_service = SegmentationService(model_path='unet_segmentation.h5')

# Load and preprocess image
image = cv2.imread('leaf_image.jpg')
image = cv2.resize(image, (224, 224))
image = image.astype(np.float32) / 255.0

# Segment leaf region
segmentation = seg_service.segment_image(image)
masked_image = segmentation['masked_image']

# Classify disease
prediction = classifier.predict(np.expand_dims(masked_image, 0))
disease_class = np.argmax(prediction[0])
confidence = prediction[0][disease_class]

print(f"Disease: {class_labels[disease_class]}")
print(f"Confidence: {confidence:.2%}")
```

## Performance Metrics

### Expected Accuracy
- **PlantVillage dataset**: 92-97% accuracy
- **Local Vietnamese crops**: 88-95% accuracy
- **Inference time**: 300-500ms per image (CPU), <100ms (GPU)

### Model Sizes
- **Classification model**: ~50 MB (H5 format)
- **Segmentation model**: ~30 MB (H5 format)
- **Quantized version**: ~15 MB (for mobile deployment)

## Training Details

### Hyperparameters

#### Pre-training Phase
```python
{
    'optimizer': 'Adam',
    'learning_rate': 1e-4,
    'batch_size': 32,
    'epochs': 50,
    'dropout_rate': 0.5,
    'freeze_base': True,
    'data_augmentation': True
}
```

#### Fine-tuning Phase
```python
{
    'optimizer': 'Adam',
    'learning_rate': 1e-5,
    'batch_size': 16,
    'epochs': 30,
    'dropout_rate': 0.5,
    'freeze_base_layers': 100,
    'data_augmentation': True
}
```

### Data Augmentation

**PlantVillage Pre-training:**
- Random rotation (±30°)
- Width/height shift (±20%)
- Shear transformation (±20%)
- Zoom (±20%)
- Horizontal/vertical flip
- Gaussian noise

**Local Data Fine-tuning:**
- More aggressive augmentation (±40° rotation, ±30% shift)
- Brightness/contrast variation (±30%)
- Reflection-based padding
- Ensures robustness to local variations

### Callbacks
- **EarlyStopping**: Stop if validation loss doesn't improve for 10 epochs
- **ReduceLROnPlateau**: Reduce learning rate by 0.5 if loss plateaus
- **ModelCheckpoint**: Save best model based on validation accuracy
- **TensorBoard**: Monitor training in real-time

## Integration with Server

### Using with Node.js Backend

```typescript
// server/src/services/mobilenetv2Service.ts
import * as tf from '@tensorflow/tfjs-node';
import * as tf_node from '@tensorflow/tfjs-node-gpu';

class MobileNetV2AttentionService {
    private classifier: tf.LayersModel;
    private segmentationModel: tf.LayersModel;
    
    async loadModels() {
        // Load saved models
        this.classifier = await tf.loadLayersModel('file://./models/mobilenetv2_attention.h5');
        this.segmentationModel = await tf.loadLayersModel('file://./models/unet_segmentation.h5');
    }
    
    async predictDisease(imageBuffer: Buffer) {
        // Preprocess image
        const tensor = this.preprocessImage(imageBuffer);
        
        // Get segmentation mask
        const mask = await this.segmentationModel.predict(tensor);
        
        // Classify disease
        const prediction = await this.classifier.predict(tensor);
        
        return this.postprocessPrediction(prediction);
    }
}
```

## Troubleshooting

### Common Issues

**1. Out of Memory (OOM) Error**
- Reduce batch size: 32 → 16 → 8
- Use gradient accumulation
- Enable mixed precision training
- Free GPU memory before training

**2. Poor Accuracy on Local Data**
- Ensure sufficient local training samples (>50 per class)
- Verify image quality and resolution (224×224)
- Check class distribution balance
- Increase fine-tuning epochs
- Adjust learning rate

**3. Slow Inference**
- Use quantization for faster inference
- Convert to TensorFlow Lite for mobile
- Use GPU acceleration if available
- Batch multiple predictions

**4. Attention Maps Not Showing Relevant Regions**
- Increase attention reduction ratio
- Train longer with early stopping relaxed
- Verify training data quality
- Check segmentation mask quality

## Advanced Techniques

### Model Optimization

#### Quantization
```python
import tensorflow as tf

# Post-training quantization
converter = tf.lite.TFLiteConverter.from_saved_model('model_path')
converter.optimizations = [tf.lite.Optimize.DEFAULT]
tflite_model = converter.convert()

with open('model_quantized.tflite', 'wb') as f:
    f.write(tflite_model)
```

#### Knowledge Distillation
- Train larger teacher model (ResNet50)
- Use it to guide smaller student model (MobileNetV2)
- Results: Similar accuracy with 50% fewer parameters

#### Ensemble with Other Models
- Combine MobileNetV2+Attention with other architectures
- Weighted voting based on confidence
- Improved robustness

## Performance Optimization

### For Edge Deployment
1. **Quantization**: 4x smaller model, 3x faster inference
2. **Pruning**: Remove 30-50% of weights while maintaining accuracy
3. **Model distillation**: Compress to 20% original size
4. **TensorFlow Lite**: Format optimized for mobile/edge

### For Server Deployment
1. **GPU acceleration**: 10-20x faster inference
2. **Batch processing**: Process multiple images simultaneously
3. **Caching**: Store predictions for identical images
4. **Load balancing**: Distribute across multiple GPU instances

## Validation and Testing

### Evaluation Metrics
```python
from sklearn.metrics import (
    accuracy_score,
    precision_recall_fscore_support,
    confusion_matrix,
    roc_auc_score,
    classification_report
)

# Evaluate on test set
test_predictions = model.predict(test_images)
y_pred = np.argmax(test_predictions, axis=1)

accuracy = accuracy_score(y_test, y_pred)
precision, recall, f1, _ = precision_recall_fscore_support(y_test, y_pred, average='weighted')

print(f"Accuracy: {accuracy:.4f}")
print(f"Precision: {precision:.4f}")
print(f"Recall: {recall:.4f}")
print(f"F1-Score: {f1:.4f}")
```

### Cross-validation
```python
from sklearn.model_selection import KFold

kfold = KFold(n_splits=5, shuffle=True, random_state=42)
for train_idx, val_idx in kfold.split(X):
    # Train and validate on each fold
    pass
```

## References

### Key Papers
1. **CBAM**: Woo et al., "CBAM: Convolutional Block Attention Module" (ECCV 2018)
2. **MobileNetV2**: Sandler et al., "MobileNetV2: Inverted Residuals" (CVPR 2018)
3. **U-Net**: Ronneberger et al., "U-Net: Convolutional Networks for Biomedical Segmentation" (MICCAI 2015)
4. **Transfer Learning**: Yosinski et al., "How transferable are features in deep neural networks?" (NIPS 2014)

### Datasets
- **PlantVillage**: https://github.com/spMohanty/PlantVillage-Dataset
- **ImageNet**: https://www.image-net.org/
- **Local datasets**: Collected from Gia Lai province crops

### Tools & Libraries
- TensorFlow: https://www.tensorflow.org/
- Keras: https://keras.io/
- OpenCV: https://opencv.org/
- Albumentations: https://albumentations.ai/

## Support & Contribution

For issues, questions, or improvements:
1. Check the troubleshooting section
2. Review Jupyter notebook examples
3. Consult API documentation in code comments
4. Submit issues/PRs to repository

## License

This implementation follows the project's main license (typically MIT).

---

**Last Updated**: November 2024  
**Version**: 1.0  
**Maintainer**: Leaf Disease Detector Team
