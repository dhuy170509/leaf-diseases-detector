/**
 * Best Model (H5 Format)
 * Primary model for disease detection
 * Input: 224x224 RGB images
 * Output: Disease class + confidence
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import fs from 'node:fs';
import { BaseAIModel, ModelConfig, ModelPredictionResult } from './BaseAIModel.js';

const execAsync = promisify(exec);

export class BestModelH5 extends BaseAIModel {
    private pythonScriptPath: string;
    private modelPath: string;
    private MODEL_DIR: string;

    constructor(config: ModelConfig) {
        super(config);
        this.MODEL_DIR = path.join(process.cwd(), 'model');
        this.modelPath = path.join(this.MODEL_DIR, config.filename);
        this.pythonScriptPath = path.join(this.MODEL_DIR, 'best_model_predict.py');
    }

    async initialize(): Promise<void> {
        console.log(`[INFO] Initializing ${this.config.name}...`);

        // Create Python prediction script
        await this.createPythonScript();

        // Verify model exists
        if (!fs.existsSync(this.modelPath)) {
            throw new Error(`Model file not found: ${this.modelPath}`);
        }

        // Health check
        const isHealthy = await this.healthCheck();
        if (!isHealthy) {
            throw new Error(`${this.config.name} health check failed`);
        }

        this.isLoaded = true;
        console.log(`[OK] ${this.config.name} loaded successfully`);
    }

    async predict(imageBuffer: Buffer): Promise<ModelPredictionResult | null> {
        if (!this.isLoaded) {
            console.error(`[ERROR] ${this.config.name} not initialized`);
            return null;
        }

        let tempImagePath: string | null = null;

        try {
            const startTime = Date.now();

            // Save image to temp file
            tempImagePath = path.join(this.MODEL_DIR, `temp_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`);
            fs.writeFileSync(tempImagePath, imageBuffer);

            // Run prediction
            const command = `python "${this.pythonScriptPath}" "${this.modelPath}" "${tempImagePath}"`;

            const { stdout, stderr } = await execAsync(command, {
                maxBuffer: 1024 * 1024 * 10,
                timeout: 120000
            });

            if (stderr) {
                console.log(`[PYTHON] ${stderr}`);
            }

            // Parse result
            const jsonRegex = /\{[\s\S]*\}/;
            const jsonMatch = jsonRegex.exec(stdout);

            if (!jsonMatch) {
                console.error('[ERROR] No JSON output from Python');
                return null;
            }

            const result = JSON.parse(jsonMatch[0]);

            if (!result.success) {
                console.error(`[ERROR] Prediction failed: ${result.error}`);
                return null;
            }

            const executionTime = Date.now() - startTime;

            return {
                modelName: this.config.name,
                disease: result.disease,
                confidence: result.confidence,
                executionTime,
                diseaseProbabilities: result.diseaseProbabilities || {},
                metadata: {
                    inputShape: '(None, 224, 224, 3)',
                    framework: 'TensorFlow',
                    modelSize: `${this.config.size} MB`
                }
            };
        } catch (error) {
            console.error(`[ERROR] ${this.config.name} prediction failed:`, error);
            return null;
        } finally {
            // Cleanup temp file
            if (tempImagePath && fs.existsSync(tempImagePath)) {
                try {
                    fs.unlinkSync(tempImagePath);
                } catch {
                    // Ignore cleanup errors
                }
            }
        }
    }

    async cleanup(): Promise<void> {
        console.log(`[INFO] Cleaning up ${this.config.name}`);
        this.isLoaded = false;
    }

    async healthCheck(): Promise<boolean> {
        try {
            const testCommand = `python -c "from tensorflow.keras.models import load_model; m = load_model('${this.modelPath}'); print('OK')"`;
            const { stdout } = await execAsync(testCommand, { timeout: 30000 });
            return stdout.includes('OK');
        } catch (error) {
            console.error(`[ERROR] ${this.config.name} health check failed:`, error);
            return false;
        }
    }

    private async createPythonScript(): Promise<void> {
        if (fs.existsSync(this.pythonScriptPath)) {
            return; // Already created
        }

        const pythonCode = `#!/usr/bin/env python3
"""Best Model Prediction Script"""
import sys
import json
import numpy as np
from PIL import Image
from tensorflow.keras.models import load_model

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

def predict(model_path, image_path):
    try:
        model = load_model(model_path)
        img = Image.open(image_path).convert('RGB').resize((224, 224))
        img_array = np.array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0).astype(np.float32)
        
        predictions = model.predict(img_array, verbose=0)
        class_probs = predictions[0]
        predicted_class = np.argmax(class_probs)
        confidence = float(class_probs[predicted_class])
        
        disease_name = DISEASE_MAPPING.get(int(predicted_class), f'Class {predicted_class}')
        disease_probs = {DISEASE_MAPPING.get(i, f'Class {i}'): float(p) for i, p in enumerate(class_probs)}
        
        return {
            'success': True,
            'disease': disease_name,
            'confidence': min(confidence, 1.0),
            'diseaseProbabilities': disease_probs
        }
    except Exception as e:
        return {'success': False, 'error': str(e)}

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print(json.dumps({'success': False, 'error': 'Invalid arguments'}))
        sys.exit(1)
    
    result = predict(sys.argv[1], sys.argv[2])
    print(json.dumps(result))
`;

        fs.writeFileSync(this.pythonScriptPath, pythonCode);
        console.log(`[OK] Created Python script: ${this.pythonScriptPath}`);
    }
}
