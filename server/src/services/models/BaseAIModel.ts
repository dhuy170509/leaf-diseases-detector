/**
 * Abstract Model Interface - Adapter Pattern
 * Tất cả models phải implement interface này
 */

export interface ModelPredictionResult {
    modelName: string;
    disease: string;
    confidence: number;
    executionTime: number;
    diseaseProbabilities?: { [key: string]: number };
    metadata?: {
        inputShape?: string;
        outputShape?: string;
        modelSize?: string;
        framework?: string;
    };
}

export interface ModelConfig {
    name: string;
    filename: string;
    type: 'h5' | 'weights.h5' | 'keras' | 'tflite';
    size: number; // MB
    description: string;
    framework: 'tensorflow' | 'pytorch' | 'onnx';
    priority: number; // 1 = highest priority (primary model)
    enabled: boolean;
}

/**
 * Abstract base class cho tất cả AI models
 * Tất cả models phải extend class này
 */
export abstract class BaseAIModel {
    protected config: ModelConfig;
    protected isLoaded: boolean = false;

    constructor(config: ModelConfig) {
        this.config = config;
    }

    /**
     * Initialize model (load weights, setup)
     */
    abstract initialize(): Promise<void>;

    /**
     * Run prediction on image
     */
    abstract predict(imageBuffer: Buffer): Promise<ModelPredictionResult | null>;

    /**
     * Get model info
     */
    getConfig(): ModelConfig {
        return this.config;
    }

    /**
     * Check if model is loaded
     */
    isModelLoaded(): boolean {
        return this.isLoaded;
    }

    /**
     * Cleanup resources
     */
    abstract cleanup(): Promise<void>;

    /**
     * Health check
     */
    abstract healthCheck(): Promise<boolean>;
}

/**
 * Model Manager - Factory pattern
 * Manages all available models
 */
export interface IModelManager {
    initialize(): Promise<void>;
    getPrimaryModel(): BaseAIModel | null;
    getFallbackModels(): BaseAIModel[];
    predict(imageBuffer: Buffer): Promise<ModelPredictionResult | null>;
    getAvailableModels(): ModelConfig[];
    getModelByName(name: string): BaseAIModel | null;
    getAllModels(): BaseAIModel[];
}
