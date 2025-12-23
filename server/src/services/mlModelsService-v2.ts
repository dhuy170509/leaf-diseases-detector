/**
 * ML Models Service - Refactored with Adapter Pattern
 * Now using ModelManager for better extensibility
 */

import { modelManager } from './models/ModelManager.js';
import diseaseService from './diseaseService.js';

interface ModelPrediction {
    modelName: string;
    disease: string;
    confidence: number;
    diseaseProbabilities: { [key: string]: number };
    executionTime: number;
}

interface EnsemblePrediction {
    finalDisease: string;
    finalConfidence: number;
    severity: string;
    modelBreakdown: ModelPrediction[];
    votingDetails: {
        primaryModel: string;
        fallbackModels: string[];
        modelUsed: string;
        unanimousVote?: boolean;
    };
    recommendedTreatment: string;
    confidenceLevel: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
}

/**
 * Main prediction function using new model adapter
 */
export async function predictWithEnsemble(imageData: Buffer): Promise<EnsemblePrediction> {
    try {
        // Use ModelManager for prediction
        const prediction = await modelManager.predict(imageData);

        if (!prediction) {
            throw new Error('All models failed to predict');
        }

        // Determine severity based on confidence
        let severity = 'MEDIUM';
        if (prediction.confidence >= 0.9) severity = 'HIGH';
        else if (prediction.confidence >= 0.7) severity = 'MEDIUM';
        else severity = 'LOW';

        // Get disease info
        let recommendedTreatment = `Sử dụng biện pháp xử lý phù hợp với ${prediction.disease}`;
        try {
            const diseaseInfo = await diseaseService.searchDiseaseByName(prediction.disease);
            if (diseaseInfo) {
                const t = (diseaseInfo.treatment as any);
                recommendedTreatment = Array.isArray(t) ? t.join(', ') : (t || recommendedTreatment);
            }
        } catch {
            // Fallback to default treatment
        }

        const primaryModel = modelManager.getPrimaryModel();
        const fallbackModels = modelManager.getFallbackModels();

        const ensemble: EnsemblePrediction = {
            finalDisease: prediction.disease,
            finalConfidence: Math.min(prediction.confidence, 1.0),
            severity: severity,
            modelBreakdown: [{
                modelName: prediction.modelName,
                disease: prediction.disease,
                confidence: prediction.confidence,
                diseaseProbabilities: prediction.diseaseProbabilities || {},
                executionTime: prediction.executionTime
            }],
            votingDetails: {
                primaryModel: primaryModel?.getConfig().name || 'unknown',
                fallbackModels: fallbackModels.map(m => m.getConfig().name),
                modelUsed: prediction.modelName,
                unanimousVote: false
            },
            recommendedTreatment: recommendedTreatment,
            confidenceLevel: prediction.confidence >= 0.9 ? 'VERY_HIGH' :
                prediction.confidence >= 0.7 ? 'HIGH' :
                    prediction.confidence >= 0.5 ? 'MEDIUM' : 'LOW'
        };

        console.log(`✅ Prediction Result:`);
        console.log(`   Disease: ${ensemble.finalDisease}`);
        console.log(`   Confidence: ${(ensemble.finalConfidence * 100).toFixed(1)}%`);
        console.log(`   Severity: ${ensemble.severity}`);
        console.log(`   Model Used: ${prediction.modelName}`);

        return ensemble;
    } catch (error) {
        console.error('❌ Prediction error:', error);

        return {
            finalDisease: 'Không xác định - Vui lòng thử lại',
            finalConfidence: 0,
            severity: 'UNKNOWN',
            modelBreakdown: [],
            votingDetails: {
                primaryModel: modelManager.getPrimaryModel()?.getConfig().name || 'unknown',
                fallbackModels: modelManager.getFallbackModels().map(m => m.getConfig().name),
                modelUsed: 'none'
            },
            recommendedTreatment: 'Vui lòng liên hệ chuyên gia phòng dịch địa phương',
            confidenceLevel: 'VERY_LOW'
        };
    }
}

/**
 * Get available models info
 */
export function getAvailableModels() {
    return modelManager.getAvailableModels();
}

/**
 * Get model status
 */
export function getModelStatus() {
    const primary = modelManager.getPrimaryModel();
    const fallbacks = modelManager.getFallbackModels();

    return {
        primary: primary ? primary.getConfig() : null,
        fallbacks: fallbacks.map(m => m.getConfig()),
        total: modelManager.getAllModels().length,
        status: 'operational'
    };
}

export default {
    predictWithEnsemble,
    getAvailableModels,
    getModelStatus,
    modelManager
};
