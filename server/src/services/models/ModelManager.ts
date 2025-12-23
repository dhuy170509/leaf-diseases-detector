/**
 * Model Manager - Factory Pattern
 * Manages loading, initialization, and switching between models
 */

import path from 'node:path';
import fs from 'node:fs';
import { BaseAIModel, ModelConfig, ModelPredictionResult, IModelManager } from './BaseAIModel.js';
import { BestModelH5 } from './BestModelH5.js';

export class ModelManager implements IModelManager {
    private models: Map<string, BaseAIModel> = new Map();
    private primaryModel: BaseAIModel | null = null;
    private fallbackModels: BaseAIModel[] = [];
    private modelConfigs: ModelConfig[] = [];

    constructor() {
        this.initializeModelConfigs();
    }

    private initializeModelConfigs(): void {
        this.modelConfigs = [
            {
                name: 'best_model',
                filename: 'best_model.weights.h5',
                type: 'weights.h5',
                size: 257.7,
                description: 'Best general model for disease detection',
                framework: 'tensorflow',
                priority: 1,
                enabled: true
            },
            {
                name: 'best_mtl_model',
                filename: 'best_mtl_model.weights.h5',
                type: 'weights.h5',
                size: 67.1,
                description: 'Multi-task learning model',
                framework: 'tensorflow',
                priority: 2,
                enabled: true
            },
            {
                name: 'best_mtl_model_phase1',
                filename: 'best_mtl_model_phase1.weights.h5',
                type: 'weights.h5',
                size: 64.2,
                description: 'MTL Phase 1 model',
                framework: 'tensorflow',
                priority: 3,
                enabled: true
            },
            {
                name: 'best_mtl_model_phase2',
                filename: 'best_mtl_model_phase2.weights.h5',
                type: 'weights.h5',
                size: 36.5,
                description: 'MTL Phase 2 model',
                framework: 'tensorflow',
                priority: 4,
                enabled: true
            },
            {
                name: 'efficientnetb0',
                filename: 'efficientnetb0_notop (1).h5',
                type: 'h5',
                size: 16.7,
                description: 'EfficientNet B0 backbone',
                framework: 'tensorflow',
                priority: 5,
                enabled: true
            },
            {
                name: 'segmentation_mtl',
                filename: 'segmentation_multi_task_model.keras',
                type: 'keras',
                size: 257.9,
                description: 'Segmentation with multi-task learning',
                framework: 'tensorflow',
                priority: 6,
                enabled: true
            }
        ];
    }

    async initialize(): Promise<void> {
        console.log('[INFO] Initializing Model Manager...');

        // Filter and sort enabled models by priority
        const enabledConfigs = this.modelConfigs
            .filter(c => c.enabled && this.modelExists(c))
            .sort((a, b) => a.priority - b.priority);

        console.log(`[INFO] Found ${enabledConfigs.length} available models`);

        // Create model instances
        for (const config of enabledConfigs) {
            try {
                const model = this.createModel(config);
                await model.initialize();
                this.models.set(config.name, model);

                // Set primary model (lowest priority = highest priority)
                if (!this.primaryModel) {
                    this.primaryModel = model;
                    console.log(`[OK] Primary model set: ${config.name}`);
                } else {
                    this.fallbackModels.push(model);
                    console.log(`[OK] Fallback model: ${config.name}`);
                }
            } catch (error) {
                console.error(`[ERROR] Failed to initialize ${config.name}:`, error);
            }
        }

        if (!this.primaryModel) {
            throw new Error('No models could be initialized!');
        }

        console.log(`[OK] Model Manager initialized with ${this.models.size} models`);
    }

    async predict(imageBuffer: Buffer): Promise<ModelPredictionResult | null> {
        if (!this.primaryModel) {
            console.error('[ERROR] Primary model not initialized');
            return null;
        }

        // Try primary model
        console.log(`[INFO] Using primary model: ${this.primaryModel.getConfig().name}`);
        let result = await this.primaryModel.predict(imageBuffer);

        if (result) {
            return result;
        }

        // Fallback to other models
        console.log('[WARN] Primary model failed, trying fallback models...');

        for (const model of this.fallbackModels) {
            console.log(`[INFO] Trying fallback model: ${model.getConfig().name}`);
            result = await model.predict(imageBuffer);
            if (result) {
                return result;
            }
        }

        console.error('[ERROR] All models failed');
        return null;
    }

    getPrimaryModel(): BaseAIModel | null {
        return this.primaryModel;
    }

    getFallbackModels(): BaseAIModel[] {
        return this.fallbackModels;
    }

    getAvailableModels(): ModelConfig[] {
        return this.modelConfigs.filter(c => this.models.has(c.name));
    }

    getModelByName(name: string): BaseAIModel | null {
        return this.models.get(name) || null;
    }

    getAllModels(): BaseAIModel[] {
        return Array.from(this.models.values());
    }

    private modelExists(config: ModelConfig): boolean {
        const modelPath = path.join(process.cwd(), 'model', config.filename);
        return fs.existsSync(modelPath);
    }

    private createModel(config: ModelConfig): BaseAIModel {
        switch (config.type) {
            case 'h5':
            case 'weights.h5':
                return new BestModelH5(config);
            case 'keras':
                return new BestModelH5(config); // Reuse for now, can extend later
            case 'tflite':
                // TODO: Implement TFLite model
                return new BestModelH5(config);
            default:
                throw new Error(`Unsupported model type: ${config.type}`);
        }
    }

    async cleanup(): Promise<void> {
        console.log('[INFO] Cleaning up all models...');
        for (const model of this.models.values()) {
            await model.cleanup();
        }
        this.models.clear();
        this.primaryModel = null;
        this.fallbackModels = [];
    }
}

// Export singleton instance
export const modelManager = new ModelManager();
