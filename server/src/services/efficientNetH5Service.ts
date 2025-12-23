/**
 * EfficientNetB0 H5 Model Service
 * Tích hợp model H5 đã được huấn luyện
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface H5Prediction {
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
 * Load class names từ file
 */
async function loadClassNames(): Promise<string[]> {
    const classNamesPath = path.join(__dirname, '../../model/class_names.json');

    try {
        if (fs.existsSync(classNamesPath)) {
            const data = fs.readFileSync(classNamesPath, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.warn('⚠️  Không tải được class_names.json:', error);
    }

    return [];
}

/**
 * Dự đoán hình ảnh bằng EfficientNetB0 H5
 */
export async function predictWithH5(imagePath: string): Promise<H5Prediction> {
    try {
        // Kiểm tra file model
        const modelPath = path.join(__dirname, '../../model/efficientnetb0_notop.h5');

        if (!fs.existsSync(modelPath)) {
            throw new Error(`Model file not found: ${modelPath}`);
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

        // Load class names nếu có
        const classNames = await loadClassNames();

        if (classNames.length > 0) {
            const classNamesPath = path.join(__dirname, '../../model/class_names.json');
            command += ` --classes "${classNamesPath}"`;
        }

        console.log('🔍 Đang dự đoán với EfficientNetB0...');
        console.log(`   Image: ${imagePath}`);
        console.log(`   Model: ${modelPath}`);

        // Execute Python script
        const { stdout, stderr } = await execAsync(command, {
            timeout: 30000, // 30 seconds timeout
            maxBuffer: 10 * 1024 * 1024 // 10MB buffer
        });

        // Parse output
        let prediction: H5Prediction;

        try {
            // Tìm JSON object trong output
            const jsonMatch = stdout.match(/\{[\s\S]*\}/);
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
        console.log(`   Bệnh: ${prediction.label}`);
        console.log(`   Độ tin cậy: ${(prediction.confidence * 100).toFixed(1)}%`);

        return prediction;
    } catch (error) {
        console.error('❌ EfficientNetB0 prediction error:', error);
        throw error;
    }
}

/**
 * Dự đoán với timeout và retry
 */
export async function predictWithH5Safe(imagePath: string, maxRetries: number = 2): Promise<H5Prediction> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`🔄 Attempt ${attempt}/${maxRetries}...`);
            return await predictWithH5(imagePath);
        } catch (error) {
            lastError = error as Error;
            console.warn(`⚠️  Attempt ${attempt} failed:`, lastError.message);

            if (attempt < maxRetries) {
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    throw lastError || new Error('Prediction failed after retries');
}

/**
 * Load disease information
 */
export async function loadDiseaseInfo(): Promise<{ [key: string]: any }> {
    const paths = [
        path.join(__dirname, '../../models/disease_info.json'),
        path.join(__dirname, '../../model/disease_info.json'),
    ];

    for (const p of paths) {
        try {
            if (fs.existsSync(p)) {
                const data = fs.readFileSync(p, 'utf-8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.warn(`⚠️  Cannot load disease info from ${p}:`, error);
        }
    }

    return {};
}

/**
 * Format prediction result for frontend
 */
export function formatPredictionResult(prediction: H5Prediction): any {
    return {
        success: true,
        disease: prediction.label,
        confidence: prediction.confidence,
        confidence_percent: `${(prediction.confidence * 100).toFixed(1)}%`,
        is_valid: prediction.is_valid,
        severity: prediction.is_valid ? (
            prediction.confidence > 0.9 ? 'CRITICAL' :
                prediction.confidence > 0.8 ? 'SEVERE' :
                    prediction.confidence > 0.7 ? 'MODERATE' :
                        prediction.confidence > 0.6 ? 'MILD' :
                            'SUSPECTED'
        ) : 'UNKNOWN',
        topk_predictions: prediction.topk.map((p, idx) => ({
            rank: idx + 1,
            disease: p.label,
            confidence: p.confidence,
            confidence_percent: `${(p.confidence * 100).toFixed(1)}%`
        })),
        disease_info: prediction.info || {},
        model_type: 'EfficientNetB0',
        timestamp: new Date().toISOString()
    };
}

export { H5Prediction };
