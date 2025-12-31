/**
 * Plant Disease Model H5 Service
 * Tích hợp model plant_disease_model.h5 đã được huấn luyện
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface PlantModelPrediction {
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
 * Dự đoán hình ảnh bằng Plant Disease Model
 */
// Minimal PlantModel H5 service stub (HARD RESET)

export async function predictWithPlantModel(_imagePath: string): Promise<null> {
    // No model execution during HARD RESET
    return null;
}

export async function predictWithPlantModelSafe(_imagePath: string, _maxRetries: number = 2): Promise<null> {
    return null;
}

export function formatPlantModelResult(_prediction: any): any {
    return null;
}

export { };
