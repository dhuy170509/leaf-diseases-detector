/**
 * New Model Service - Load and Manage Latest Models
 * Supports: .h5, .weights.h5, .keras, .tflite models
 * 
 * Models:
 * - best_model.weights.h5 (Best general model - 257.7 MB)
 * - best_mtl_model.weights.h5 (Multi-task learning - 67.1 MB)
 * - best_mtl_model_phase1.weights.h5 (Phase 1 - 64.2 MB)
 * - best_mtl_model_phase2.weights.h5 (Phase 2 - 36.5 MB)
 * - efficientnetb0_notop.h5 (EfficientNet - 16.7 MB)
 * - segmentation_multi_task_model.keras (Segmentation - 257.9 MB)
 * - segmentation_multi_task_model.tflite (TFLite - 85.6 MB)
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

const execAsync = promisify(exec);

interface ModelInfo {
    name: string;
    filename: string;
    type: 'h5' | 'weights.h5' | 'keras' | 'tflite';
    size: number; // MB
    description: string;
    isLoaded: boolean;
}

interface PredictionResult {
    modelName: string;
    disease: string;
    confidence: number;
    executionTime: number;
    diseaseProbabilities?: { [key: string]: number };
}

const MODEL_DIR = path.join(process.cwd(), 'model');

class NewModelService {
    private models: Map<string, ModelInfo> = new Map();
    private pythonScriptPath: string;
    private AVAILABLE_MODELS = [
        {
            name: 'best_model',
            filename: 'best_model.weights.h5',
            size: 257.7,
            description: 'Best general model for disease detection',
            primary: true
        },
        {
            name: 'best_mtl_model',
            filename: 'best_mtl_model.weights.h5',
            size: 67.1,
            description: 'Multi-task learning model',
            primary: false
        },
        {
            name: 'best_mtl_model_phase1',
            filename: 'best_mtl_model_phase1.weights.h5',
            size: 64.2,
            description: 'MTL Phase 1 model',
            primary: false
        },
        {
            name: 'best_mtl_model_phase2',
            filename: 'best_mtl_model_phase2.weights.h5',
            size: 36.5,
            description: 'MTL Phase 2 model',
            primary: false
        },
        {
            name: 'efficientnetb0',
            filename: 'efficientnetb0_notop (1).h5',
            size: 16.7,
            description: 'EfficientNet B0 backbone',
            primary: false
        },
        {
            name: 'segmentation_mtl',
            filename: 'segmentation_multi_task_model.keras',
            size: 257.9,
            description: 'Segmentation with multi-task learning',
            primary: false
        }
    ];

    constructor() {
        this.pythonScriptPath = path.join(MODEL_DIR, 'unified_predict.py');
    }

    async initialize(): Promise<void> {
        await this.createPythonPredictionScript();
        await this.scanAvailableModels();
    }

    private async scanAvailableModels(): Promise<void> {
        console.log('[INFO] Scanning available models...');

        for (const modelConfig of this.AVAILABLE_MODELS) {
            const modelPath = path.join(MODEL_DIR, modelConfig.filename);
            if (fs.existsSync(modelPath)) {
                const stats = fs.statSync(modelPath);
                this.models.set(modelConfig.name, {
                    name: modelConfig.name,
                    filename: modelConfig.filename,
                    type: this.getModelType(modelConfig.filename),
                    size: Math.round((stats.size / (1024 * 1024)) * 10) / 10,
                    description: modelConfig.description,
                    isLoaded: false
                });
                console.log(`[OK] Found model: ${modelConfig.name} (${modelConfig.size} MB)`);
            }
        }

        console.log(`[OK] Total models available: ${this.models.size}`);
    }

    private getModelType(filename: string): 'h5' | 'weights.h5' | 'keras' | 'tflite' {
        if (filename.endsWith('.tflite')) return 'tflite';
        if (filename.endsWith('.keras')) return 'keras';
        if (filename.endsWith('.weights.h5')) return 'weights.h5';
        return 'h5';
    }

    async predictWithBestModel(imageBuffer: Buffer): Promise<PredictionResult | null> {
        // Use best_model as primary
        const bestModel = this.models.get('best_model');
        if (!bestModel) {
            console.log('[WARN] best_model not found, trying alternatives...');
            return this.predictWithFallback(imageBuffer);
        }

        return this.predictWithModel('best_model', imageBuffer);
    }

    async predictWithFallback(imageBuffer: Buffer): Promise<PredictionResult | null> {
        // Try models in priority order
        const priority = ['best_mtl_model', 'best_mtl_model_phase1', 'efficientnetb0'];

        for (const modelName of priority) {
            if (this.models.has(modelName)) {
                console.log(`[INFO] Trying model: ${modelName}`);
                const result = await this.predictWithModel(modelName, imageBuffer);
                if (result) {
                    return result;
                }
            }
        }

        return null;
    }

    private async predictWithModel(
        modelName: string,
        imageBuffer: Buffer
    ): Promise<PredictionResult | null> {
        let tempImagePath: string | null = null;

        try {
            const startTime = Date.now();
            const modelInfo = this.models.get(modelName);

            if (!modelInfo) {
                console.error(`[ERROR] Model not found: ${modelName}`);
                return null;
            }

            const modelPath = path.join(MODEL_DIR, modelInfo.filename);

            // Save image to temporary file
            tempImagePath = path.join(MODEL_DIR, `temp_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`);
            fs.writeFileSync(tempImagePath, imageBuffer);

            // Run Python prediction
            const command = `python "${this.pythonScriptPath}" "${modelPath}" "${tempImagePath}"`;

            console.log(`[INFO] Running prediction with ${modelName}...`);

            const { stdout, stderr } = await execAsync(command, {
                maxBuffer: 1024 * 1024 * 10,
                timeout: 120000
            });

            if (stderr) {
                console.log(`[PYTHON] ${stderr}`);
            }

            // Parse JSON output
            const jsonRegex = /\{[\s\S]*\}/;
            const jsonMatch = jsonRegex.exec(stdout);

            if (!jsonMatch) {
                console.error('[ERROR] No JSON output from Python script');
                return null;
            }

            const result = JSON.parse(jsonMatch[0]);

            if (!result.success) {
                console.error(`[ERROR] Prediction failed: ${result.error}`);
                return null;
            }

            const executionTime = Date.now() - startTime;

            return {
                modelName: modelName,
                disease: result.disease,
                confidence: result.confidence,
                executionTime,
                diseaseProbabilities: result.diseaseProbabilities || {}
            };
        } catch (error) {
            console.error(`[ERROR] Prediction with ${modelName} failed:`, error);
            return null;
        } finally {
            if (tempImagePath && fs.existsSync(tempImagePath)) {
                try {
                    fs.unlinkSync(tempImagePath);
                } catch {
                    // Ignore cleanup errors
                }
            }
        }
    }

    private async createPythonPredictionScript(): Promise<void> {
        const pythonCode = `#!/usr/bin/env python3
"""
Unified Model Prediction Script
Handles .h5, .weights.h5, .keras, and .tflite models
"""

import os
import sys
import json
import numpy as np
from PIL import Image
import tensorflow as tf
from tensorflow.keras.models import load_model

# Disease mapping
DISEASE_MAPPING = {
    0: 'Bệnh lá khỏe mạnh',
    1: 'Bệnh đốm lá',
    2: 'Bệnh rỉ sét',
    3: 'Bệnh phấn trắng',
    4: 'Bệnh lở nâu',
    5: 'Bệnh khảm lá',
    6: 'Bệnh sạ lá',
    7: 'Bệnh cháy lá',
    8: 'Bệnh cuộn lá',
    9: 'Bệnh vết loét'
}

def load_model_safe(model_path):
    """Load model safely, handling different formats"""
    try:
        # Try loading as standard Keras model
        if model_path.endswith('.keras'):
            model = load_model(model_path)
        elif model_path.endswith('.tflite'):
            # TFLite requires special handling
            interpreter = tf.lite.Interpreter(model_path=model_path)
            interpreter.allocate_tensors()
            return interpreter
        else:
            # Handle .h5 and .weights.h5
            model = load_model(model_path, compile=False)
        
        print(f"[OK] Loaded model: {os.path.basename(model_path)}", file=sys.stderr)
        return model
    except Exception as e:
        print(f"[ERROR] Failed to load model: {e}", file=sys.stderr)
        return None

def preprocess_image(image_path, target_size=(224, 224)):
    """Preprocess image from file"""
    try:
        img = Image.open(image_path)
        if img.mode != 'RGB':
            img = img.convert('RGB')
        img = img.resize(target_size, Image.Resampling.LANCZOS)
        
        img_array = np.array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        
        return img_array.astype(np.float32)
    except Exception as e:
        print(f"[ERROR] Image preprocessing failed: {e}", file=sys.stderr)
        return None

def predict_with_model(model, image_array):
    """Run prediction"""
    try:
        if isinstance(model, tf.lite.Interpreter):
            # TFLite prediction
            input_details = model.get_input_details()
            output_details = model.get_output_details()
            model.set_tensor(input_details[0]['index'], image_array)
            model.invoke()
            predictions = model.get_tensor(output_details[0]['index'])
        else:
            # Keras model prediction
            predictions = model.predict(image_array, verbose=0)
        
        class_probs = predictions[0]
        predicted_class = np.argmax(class_probs)
        confidence = float(class_probs[predicted_class])
        
        disease_name = DISEASE_MAPPING.get(int(predicted_class), f'Class {predicted_class}')
        
        disease_probs = {}
        for idx, prob in enumerate(class_probs):
            disease_probs[DISEASE_MAPPING.get(idx, f'Class {idx}')] = float(prob)
        
        return {
            'disease': disease_name,
            'confidence': min(confidence, 1.0),
            'class_index': int(predicted_class),
            'diseaseProbabilities': disease_probs
        }
    except Exception as e:
        print(f"[ERROR] Prediction failed: {e}", file=sys.stderr)
        return None

def main():
    if len(sys.argv) < 3:
        print("[ERROR] Usage: python unified_predict.py <model_path> <image_path>", file=sys.stderr)
        sys.exit(1)
    
    model_path = sys.argv[1]
    image_path = sys.argv[2]
    
    # Load model
    model = load_model_safe(model_path)
    if model is None:
        print(json.dumps({'success': False, 'error': 'Failed to load model'}))
        sys.exit(1)
    
    # Preprocess image
    img_array = preprocess_image(image_path)
    if img_array is None:
        print(json.dumps({'success': False, 'error': 'Failed to preprocess image'}))
        sys.exit(1)
    
    # Predict
    prediction = predict_with_model(model, img_array)
    if prediction is None:
        print(json.dumps({'success': False, 'error': 'Prediction failed'}))
        sys.exit(1)
    
    # Return result
    result = {
        'success': True,
        'disease': prediction['disease'],
        'confidence': prediction['confidence'],
        'classIndex': prediction['class_index'],
        'diseaseProbabilities': prediction['diseaseProbabilities']
    }
    
    print(json.dumps(result))

if __name__ == '__main__':
    main()
`;

        try {
            if (!fs.existsSync(this.pythonScriptPath)) {
                fs.writeFileSync(this.pythonScriptPath, pythonCode);
                console.log('[OK] Unified prediction Python script created');
            }
        } catch (error) {
            console.error('[WARN] Could not create Python script:', error);
        }
    }

    getAvailableModels(): ModelInfo[] {
        return Array.from(this.models.values());
    }

    getModelInfo(modelName: string): ModelInfo | undefined {
        return this.models.get(modelName);
    }
}

export default new NewModelService();
