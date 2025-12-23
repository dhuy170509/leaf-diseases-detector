/**
 * Mango Disease Model H5 Service
 * Tích hợp model mango_model.h5 để phát hiện bệnh lá xoài
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface MangoModelPrediction {
    label: string;
    confidence: number;
    is_valid: boolean;
    topk: Array<{
        label: string;
        confidence: number;
    }>;
    info: {
        [key: string]: any;
    };
}

/**
 * Dự đoán hình ảnh bằng Mango Disease Model
 */
export async function predictWithMangoModel(imagePath: string): Promise<MangoModelPrediction> {
    try {
        // Kiểm tra file model
        const modelPath = path.join(__dirname, '../../model/mango_model.h5');

        if (!fs.existsSync(modelPath)) {
            throw new Error(`Mango model file not found: ${modelPath}`);
        }

        // Kiểm tra file ảnh
        if (!fs.existsSync(imagePath)) {
            throw new Error(`Image file not found: ${imagePath}`);
        }

        // Đường dẫn script Python
        const scriptPath = path.join(__dirname, '../../model/predict_h5.py');
        const diseaseInfoPath = path.join(__dirname, '../../models/disease_info.json');

        // Tạo command
        let command = `python "${scriptPath}" --model "${modelPath}" --image "${imagePath}" --json-output`;

        if (fs.existsSync(diseaseInfoPath)) {
            command += ` --disease-info "${diseaseInfoPath}"`;
        }

        console.log('🔍 Đang dự đoán với Mango Disease Model...');
        console.log(`   Image: ${imagePath}`);
        console.log(`   Model: ${modelPath}`);

        // Execute Python script
        const { stdout, stderr } = await execAsync(command, {
            timeout: 30000,
            maxBuffer: 10 * 1024 * 1024
        });

        // Parse output
        let prediction: MangoModelPrediction;

        try {
            const jsonRegex = /\{[\s\S]*\}/;
            const jsonMatch = jsonRegex.exec(stdout);
            if (!jsonMatch) {
                throw new Error('No JSON output found');
            }
            prediction = JSON.parse(jsonMatch[0]);
        } catch (error) {
            console.error('❌ Parse JSON error:', error);
            console.error('   stdout:', stdout);
            console.error('   stderr:', stderr);
            throw error;
        }

        console.log('✅ Dự đoán thành công!');
        console.log(`   Bệnh xoài: ${prediction.label}`);
        console.log(`   Độ tin cậy: ${(prediction.confidence * 100).toFixed(1)}%`);

        return prediction;
    } catch (error) {
        console.error('❌ Mango disease model prediction error:', error);
        throw error;
    }
}

/**
 * Dự đoán với retry
 */
export async function predictWithMangoModelSafe(imagePath: string, maxRetries: number = 2): Promise<MangoModelPrediction> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`🔄 Attempt ${attempt}/${maxRetries}...`);
            return await predictWithMangoModel(imagePath);
        } catch (error) {
            lastError = error as Error;
            console.warn(`⚠️  Attempt ${attempt} failed:`, lastError.message);

            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    throw lastError || new Error('Prediction failed after retries');
}

/**
 * Format prediction result cho frontend
 */
export function formatMangoModelResult(prediction: MangoModelPrediction): any {
    // Determine severity based on confidence
    const determineSeverity = (confidence: number): string => {
        if (confidence > 0.9) return 'CRITICAL';
        if (confidence > 0.8) return 'SEVERE';
        if (confidence > 0.7) return 'MODERATE';
        if (confidence > 0.6) return 'MILD';
        return 'SUSPECTED';
    };

    return {
        success: true,
        disease: prediction.label,
        confidence: prediction.confidence,
        confidence_percent: `${(prediction.confidence * 100).toFixed(1)}%`,
        is_valid: prediction.is_valid,
        severity: prediction.is_valid ? determineSeverity(prediction.confidence) : 'UNKNOWN',
        topk_predictions: prediction.topk.map((p, idx) => ({
            rank: idx + 1,
            disease: p.label,
            confidence: p.confidence,
            confidence_percent: `${(p.confidence * 100).toFixed(1)}%`
        })),
        disease_info: prediction.info || {},
        model_type: 'MangoDisease',
        crop_type: 'Mango',
        timestamp: new Date().toISOString()
    };
}

export { MangoModelPrediction };
