// Minimal ML Models Service (HARD RESET)
// All model loading/prediction logic removed. Exports minimal placeholders
// so remaining code paths can import without causing runtime model loads.

export interface EnsemblePrediction {
    finalDisease: string;
    finalConfidence: number;
    severity: string;
    modelBreakdown: any[];
    votingDetails: Record<string, any>;
    recommendedTreatment: string;
    confidenceLevel: string;
}

export async function predictWithEnsemble(_imageData: Buffer): Promise<EnsemblePrediction> {
    return {
        finalDisease: 'NO_MODEL_INSTALLED',
        finalConfidence: 0,
        severity: 'UNKNOWN',
        modelBreakdown: [],
        votingDetails: {},
        recommendedTreatment: 'No model installed',
        confidenceLevel: 'VERY_LOW'
    };
}

export function getAvailableModels() {
    return [] as any[];
}

export default {
    predictWithEnsemble,
    getAvailableModels
};
