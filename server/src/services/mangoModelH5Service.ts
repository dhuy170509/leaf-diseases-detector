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
    throw new Error('Model support disabled (NO_MODEL_INSTALLED)');
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
