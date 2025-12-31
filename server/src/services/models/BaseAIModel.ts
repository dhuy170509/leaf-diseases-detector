// BaseAIModel removed during HARD RESET.
// This file now contains minimal type placeholders to avoid compile errors
// but does not expose any executable model logic.

export type ModelPredictionResult = {
    status: string;
    message: string;
};

export type ModelConfig = { name?: string };

export interface IModelManager {
    initialize(): Promise<void>;
    predict(imageBuffer: Buffer): Promise<{ status: string; message: string }>;
    getAvailableModels(): any[];
    getPrimaryModel(): null;
    getFallbackModels(): any[];
    getModelByName(name: string): null;
    getAllModels(): any[];
}
