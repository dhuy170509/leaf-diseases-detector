# Model Management Guide

## Models Hosted on HuggingFace Hub

All AI models are hosted on HuggingFace Hub at:
**[https://huggingface.co/huyhuy07/leaf-disease-detector-models](https://huggingface.co/huyhuy07/leaf-disease-detector-models)**

### Available Models (8 Total)

#### H5 Models (7)
1. **best_leaf_ai.h5** (50.8 MB) - Premium model with best accuracy
2. **efficientnet_merged.h5** (47.1 MB) - EfficientNet architecture
3. **efficientnetb0_notop.h5** (15.93 MB) - Lightweight EfficientNetB0
4. **leaf_disease_model.h5** (47.02 MB) - Custom leaf disease model
5. **leaf_disease_modhel.h5** (46.97 MB) - Leaf disease variant model
6. **mango_model.h5** (46.79 MB) - Specialized mango disease model
7. **plant_disease_model.h5** (37.87 MB) - General plant disease model

#### PyTorch Model (1)
8. **mobilenetv2_leaf_offline_15ep.pth** (9.15 MB) - MobileNetV2 model trained for 15 epochs, optimized for mobile/edge deployment

## Automatic Model Download

Models are automatically downloaded on first run when the server starts:

```bash
npm start
```

This will:
1. Run `model/download_models.py` script
2. Download missing models from HuggingFace Hub
3. Cache models locally for faster subsequent runs
4. Start the Node.js server on port 8765

## Manual Model Download

To manually download all models:

```bash
# Activate Python virtual environment
& .venv/Scripts/Activate.ps1

# Run download script
python model/download_models.py
```

## Upload Models to HuggingFace

To upload updated models to HuggingFace Hub:

```bash
# Activate Python virtual environment
& .venv/Scripts/Activate.ps1

# Run upload script
python upload_models_to_huggingface.py
```

**Requirements:**
- HuggingFace account with API token
- Token saved in environment or home directory: `~/.huggingface/token`

## Model Information

### H5 Models (Keras/TensorFlow)
- Format: `.h5` (HDF5)
- Framework: TensorFlow/Keras
- Supported architectures: ResNet50, MobileNetV2, InceptionV3, EfficientNet
- Used for ensemble voting system
- Fast inference on CPU/GPU

### PyTorch Model
- Format: `.pth` (PyTorch checkpoint)
- Architecture: MobileNetV2
- Training: 15 epochs with offline data
- Benefits: 
  - Lightweight (9.15 MB)
  - Optimized for mobile/edge devices
  - Compatible with TorchScript for deployment
  - Efficient inference on ARM devices

## Architecture

### Ensemble Voting System
The application uses an ensemble of 7 H5 models + 1 PyTorch model:

1. Models make independent predictions
2. Results are aggregated through voting
3. Final prediction = most common diagnosis
4. Confidence = average confidence across all models
5. Improved accuracy through diversity

### Disease Classes

Supported plant diseases:
- Rice: Blast, Brown Spot, Bacterial Blight, Sheath Blight, Leaf Scald, Stem Rot
- Coffee: Leaf Rust, Berry Disease, Anthracnose, Root Rot
- Black Pepper: Anthracnose, Leaf Spot
- Citrus: Canker, Scab, Leaf Spots
- Mango: Anthracnose, Powdery Mildew, Leaf Spots
- Tomato: Early Blight, Late Blight, Bacterial Spot, Leaf Mold, Septoria Leaf Spot, Spider Mites, Yellow Leaf Curl Virus
- Wheat: Leaf Rust, Septoria, Powdery Mildew, Fusarium Head Blight
- Potato: Early Blight, Late Blight, Scab
- And more...

## API Endpoints

### Prediction Endpoint
```bash
POST /api/predict
Content-Type: multipart/form-data

Parameters:
- image: Image file (PNG, JPG, WEBP)
- plant_type: Optional plant type (rice, mango, tomato, etc.)
- region: Optional region (Vietnam, Thailand, etc.)
```

Response includes:
- Final disease diagnosis from ensemble voting
- Confidence level
- Severity level (Low, Medium, High, Critical)
- Model breakdown (individual predictions from each model)
- Expert explanations and recommendations
- Treatment methods and prevention tips

## Troubleshooting

### Models Not Downloaded
```bash
# Clear cache and re-download
rm model/*.h5
rm model/*.pth
npm start
```

### HuggingFace Download Issues
```bash
# Check internet connection
ping huggingface.co

# Install required package
pip install huggingface-hub

# Manually download a model
python -c "from huggingface_hub import hf_hub_download; hf_hub_download('huyhuy07/leaf-disease-detector-models', 'best_leaf_ai.h5', local_dir='model')"
```

### PyTorch Model Loading Issues
- Ensure PyTorch is installed: `pip install torch torchvision`
- Check model file integrity: `ls -lh model/mobilenetv2_leaf_offline_15ep.pth`

## Performance Metrics

### Model Accuracy
- Ensemble system: ~92-96% accuracy (varies by crop type)
- Individual models: 85-91% accuracy
- PyTorch MobileNetV2: ~88-92% accuracy

### Inference Speed
- H5 models: 150-300ms per image
- PyTorch model: 100-200ms per image (optimized)
- Ensemble voting: 1000-1500ms for all 8 models

### File Sizes
Total model storage: ~312 MB
- H5 models: ~302.5 MB
- PyTorch model: ~9.15 MB

## References

- HuggingFace Hub: https://huggingface.co
- TensorFlow Documentation: https://www.tensorflow.org
- PyTorch Documentation: https://pytorch.org
- MobileNetV2 Paper: https://arxiv.org/abs/1801.04381

---

**Last Updated:** November 29, 2025
**Repository:** https://huggingface.co/huyhuy07/leaf-disease-detector-models
