/**
 * BestLeafAI Python Service
 * Real H5 model inference using actual best_leaf_ai.h5 model
 * 
 * This service loads and runs the best_leaf_ai.h5 model via Python backend
 * for accurate disease detection
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

const execAsync = promisify(exec);

interface BestLeafAIPrediction {
    modelName: string;
    disease: string;
    confidence: number;
    executionTime: number;
    diseaseProbabilities: { [key: string]: number };
}

const MODEL_DIR = path.join(process.cwd(), 'model');

class BestLeafAIPythonService {
    private pythonScriptPath: string;

    constructor() {
        this.pythonScriptPath = path.join(MODEL_DIR, 'best_leaf_ai_inference.py');
    }

    async initialize(): Promise<void> {
        // Create Python inference script if it doesn't exist
        await this.createPythonInferenceScript();
    }

    private async createPythonInferenceScript(): Promise<void> {
        const pythonCode = `#!/usr/bin/env python3
"""
BestLeafAI Model Inference Script
Loads and runs best_leaf_ai.h5 model for disease detection
Reads image from file path instead of base64 to avoid command line length issues
"""

import os
import sys
import json
import numpy as np
from PIL import Image
import tensorflow as tf
from tensorflow.keras.models import load_model

# Disease mapping for best_leaf_ai model
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

def load_best_leaf_ai_model(model_path):
    """Load the best_leaf_ai.h5 model"""
    if not os.path.exists(model_path):
        return None
    
    try:
        model = load_model(model_path)
        print(f"[OK] Loaded best_leaf_ai.h5 model from {model_path}", file=sys.stderr)
        return model
    except Exception as e:
        print(f"[ERROR] Failed to load model: {e}", file=sys.stderr)
        return None

def preprocess_image(image_path, target_size=(224, 224)):
    """Preprocess image from file for model inference"""
    try:
        # Load image from file
        img = Image.open(image_path)
        
        # Convert to RGB if necessary
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Resize to target size
        img = img.resize(target_size, Image.Resampling.LANCZOS)
        
        # Convert to numpy array and normalize
        img_array = np.array(img) / 255.0
        
        # Add batch dimension
        img_array = np.expand_dims(img_array, axis=0)
        
        return img_array
    except Exception as e:
        print(f"[ERROR] Image preprocessing failed: {e}", file=sys.stderr)
        return None

def predict_disease(model, image_array):
    """Run prediction on preprocessed image"""
    try:
        predictions = model.predict(image_array, verbose=0)
        
        # Get class probabilities
        class_probabilities = predictions[0]
        predicted_class = np.argmax(class_probabilities)
        confidence = float(class_probabilities[predicted_class])
        
        # Get disease name
        disease_name = DISEASE_MAPPING.get(int(predicted_class), 'Unknown Disease')
        
        # Create probability distribution
        disease_probs = {}
        for idx, prob in enumerate(class_probabilities):
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
        print("[ERROR] Usage: python best_leaf_ai_inference.py <model_path> <image_file_path>", file=sys.stderr)
        sys.exit(1)
    
    model_path = sys.argv[1]
    image_file_path = sys.argv[2]
    
    # Load model
    model = load_best_leaf_ai_model(model_path)
    if model is None:
        result = {
            'success': False,
            'error': 'Failed to load model'
        }
        print(json.dumps(result))
        sys.exit(1)
    
    # Preprocess image
    img_array = preprocess_image(image_file_path)
    if img_array is None:
        result = {
            'success': False,
            'error': 'Failed to preprocess image'
        }
        print(json.dumps(result))
        sys.exit(1)
    
    # Run prediction
    prediction = predict_disease(model, img_array)
    if prediction is None:
        result = {
            'success': False,
            'error': 'Prediction failed'
        }
        print(json.dumps(result))
        sys.exit(1)
    
    # Return result
    result = {
        'success': True,
        'modelName': 'best_leaf_ai.h5',
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
                console.log('[OK] BestLeafAI Python inference script created');
            }
        } catch (error) {
            console.error('[WARN] Could not create Python script:', error);
        }
    }

    async predict(imageBuffer: Buffer): Promise<BestLeafAIPrediction | null> {
        let tempImagePath: string | null = null;
        try {
            const startTime = Date.now();
            const modelPath = path.join(MODEL_DIR, 'best_leaf_ai.h5');

            // Save image to temporary file instead of passing as base64 argument
            // This avoids Windows command line length limit (~8192 chars)
            tempImagePath = path.join(MODEL_DIR, `temp_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`);
            fs.writeFileSync(tempImagePath, imageBuffer);

            // Pass only file paths to avoid command line length issues
            const command = `python "${this.pythonScriptPath}" "${modelPath}" "${tempImagePath}"`;

            console.log('[INFO] Running best_leaf_ai.h5 prediction...');

            const { stdout, stderr } = await execAsync(command, {
                maxBuffer: 1024 * 1024 * 10,
                timeout: 60000
            });

            if (stderr) {
                console.log('[PYTHON] ' + stderr);
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
                console.error('[ERROR] Prediction failed:', result.error);
                return null;
            }

            const executionTime = Date.now() - startTime;

            return {
                modelName: 'best_leaf_ai.h5',
                disease: result.disease,
                confidence: result.confidence,
                executionTime,
                diseaseProbabilities: result.diseaseProbabilities || {}
            };
        } catch (error) {
            console.error('[ERROR] BestLeafAI prediction error:', error);
            return null;
        } finally {
            // Clean up temporary file
            if (tempImagePath && fs.existsSync(tempImagePath)) {
                try {
                    fs.unlinkSync(tempImagePath);
                } catch {
                    // Ignore cleanup errors
                }
            }
        }
    }
}

export default new BestLeafAIPythonService();
