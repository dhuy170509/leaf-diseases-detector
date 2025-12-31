// EfficientNet H5 service disabled: project is in NO_MODEL_INSTALLED state.
// This module provides no executable model code.

export type H5Prediction = any;

export async function predictWithH5Safe(_imagePath: string, _maxRetries: number = 2): Promise<H5Prediction> {
    throw new Error('Model support disabled (NO_MODEL_INSTALLED)');
}

export async function loadDiseaseInfo(): Promise<{ [key: string]: any }> {
    return {};
}

export function formatPredictionResult(_prediction: H5Prediction): any {
    throw new Error('Model support disabled (NO_MODEL_INSTALLED)');
}

export { H5Prediction };
