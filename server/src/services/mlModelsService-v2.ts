// mlModelsService-v2 inert stub after HARD RESET
// This module intentionally contains no model loading or prediction logic.

export async function predictWithEnsemble(_imageData: Buffer) {
    return {
        status: 'NO_MODEL_INSTALLED',
        message: 'No AI model is currently installed.'
    };
}

export function getAvailableModels() {
    return [];
}

export function getModelStatus() {
    return {
        status: 'NO_MODEL_INSTALLED',
        message: 'No AI model is currently installed.'
    };
}

export default {
    predictWithEnsemble,
    getAvailableModels,
    getModelStatus
};
