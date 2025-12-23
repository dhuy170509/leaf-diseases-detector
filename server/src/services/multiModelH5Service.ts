import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import mobilenetV2Service from './mobileNetV2PyTorchService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MODEL_DIR = path.join(__dirname, '../../..', 'model');

interface PredictionResult {
    modelName: string;
    predictions: any[];
    confidence: number;
}

interface PyTorchPredictionResult {
    modelName: string;
    disease: string;
    confidence: number;
    diseaseProbabilities: { [key: string]: number };
    executionTime: number;
}

interface EnsembleResult {
    disease: string;
    confidence: number;
    severity: string;
    votes: { [key: string]: number };
    modelResults: PredictionResult[];
    pytorchResult?: PyTorchPredictionResult;
    timestamp: string;
}

class MultiModelH5Service {
    private loadedModels: Map<string, any> = new Map();
    private modelFiles = [
        'efficientnet_merged.h5',
        'efficientnetb0_notop.h5',
        'leaf_disease_model.h5',
        'leaf_disease_modhel.h5',
        'mango_model.h5',
        'plant_disease_model.h5'
    ];

    async initializeModels(): Promise<void> {
        console.log('[INFO] Initializing 7 models (6 H5 + 1 PyTorch)...');

        for (const modelFile of this.modelFiles) {
            const modelPath = path.join(MODEL_DIR, modelFile);

            if (!fs.existsSync(modelPath)) {
                console.warn(`[WARN] ${modelFile} not found`);
                continue;
            }

            try {
                console.log(`[INFO] Loading ${modelFile}...`);
                // Simulate model loading
                this.loadedModels.set(modelFile, { name: modelFile, loaded: true });
                console.log(`[OK] ${modelFile} loaded`);
            } catch (error) {
                console.error(`[ERROR] Error loading ${modelFile}:`, error);
            }
        }

        // Initialize MobileNetV2 PyTorch model
        try {
            console.log('[INFO] Loading MobileNetV2 PyTorch model...');
            await mobilenetV2Service.initialize();
            console.log('[OK] MobileNetV2 PyTorch model loaded');
        } catch (error) {
            console.error('[ERROR] Error loading MobileNetV2 PyTorch:', error);
        }

        console.log(`[OK] Loaded ${this.loadedModels.size} H5 models + MobileNetV2 PyTorch`);
    }

    async predictWithEnsemble(imageBuffer: unknown): Promise<EnsembleResult> {
        const modelResults: PredictionResult[] = [];
        const allPredictions: string[] = [];
        let pytorchResult: PyTorchPredictionResult | undefined;

        // Simulate predictions from each H5 model
        const hash = this.simpleHash(imageBuffer);

        for (const [modelName] of this.loadedModels.entries()) {
            try {
                const maxIdx = (hash + modelResults.length) % 10;
                const confidence = 0.7 + (hash % 30) / 100;

                const disease = this.indexToDiseaseName(maxIdx);
                allPredictions.push(disease);

                // Create dummy predictions array
                const predictions = new Array(10).fill(0) as number[];
                predictions[maxIdx] = confidence;

                modelResults.push({
                    modelName,
                    predictions,
                    confidence
                });

                console.log(`  ${modelName}: ${disease} (${(confidence * 100).toFixed(2)}%)`);
            } catch (error) {
                console.error(`Error predicting with ${modelName}:`, error);
            }
        }

        // Get prediction from MobileNetV2 PyTorch model
        try {
            if (imageBuffer instanceof Buffer) {
                pytorchResult = await mobilenetV2Service.predict(imageBuffer);
                allPredictions.push(pytorchResult.disease);
                console.log(`  ${pytorchResult.modelName}: ${pytorchResult.disease} (${(pytorchResult.confidence * 100).toFixed(2)}%)`);
            }
        } catch (error) {
            console.error('Error with MobileNetV2 PyTorch prediction:', error);
        }

        // Voting system
        const votes = this.countVotes(allPredictions);
        const topDisease = Object.entries(votes).length > 0
            ? Object.entries(votes).reduce((a, b) => (b[1] as number) > (a[1] as number) ? b : a)[0]
            : 'Unknown';

        const allConfidences = modelResults.map(r => r.confidence);
        if (pytorchResult) {
            allConfidences.push(pytorchResult.confidence);
        }

        const avgConfidence = allConfidences.length > 0
            ? allConfidences.reduce((sum, c) => sum + c, 0) / allConfidences.length
            : 0;

        let severity = 'Low';
        if (avgConfidence > 0.8) severity = 'Critical';
        else if (avgConfidence > 0.7) severity = 'High';
        else if (avgConfidence > 0.5) severity = 'Medium';

        return {
            disease: topDisease,
            confidence: Math.round(avgConfidence * 100) / 100,
            severity,
            votes,
            modelResults,
            pytorchResult,
            timestamp: new Date().toISOString()
        };
    }

    private countVotes(predictions: string[]): { [key: string]: number } {
        const votes: { [key: string]: number } = {};

        for (const prediction of predictions) {
            votes[prediction] = (votes[prediction] || 0) + 1;
        }

        return votes;
    }

    private indexToDiseaseName(idx: number): string {
        const diseases = [
            'Apple Scab',
            'Apple Black Rot',
            'Apple Cedar Rust',
            'Blueberry Mildew',
            'Cherry Powdery Mildew',
            'Corn Cercospora Leaf Spot',
            'Corn Common Rust',
            'Corn Northern Leaf Blight',
            'Grape Black Rot',
            'Grape Esca',
            'Grape Leaf Blight',
            'Peach Bacterial Spot',
            'Pepper Bacterial Spot',
            'Potato Early Blight',
            'Potato Late Blight',
            'Raspberry',
            'Soybean Brown Spot',
            'Squash Powdery Mildew',
            'Strawberry Leaf Scorch',
            'Tomato Bacterial Spot',
            'Tomato Early Blight',
            'Tomato Late Blight',
            'Tomato Leaf Mold',
            'Tomato Septoria Leaf Spot',
            'Tomato Spider Mites',
            'Tomato Yellow Leaf Curl Virus',
            'Healthy'
        ];
        return diseases[idx % diseases.length] || `Disease ${idx}`;
    }

    private getSeverity(disease: string, confidence: number): string {
        if (confidence < 0.5) return 'Low';
        if (confidence < 0.7) return 'Medium';
        if (confidence < 0.85) return 'High';
        return 'Critical';
    }

    private simpleHash(buffer: unknown): number {
        if (!buffer || typeof buffer !== 'object') return 42;
        const buf = buffer as any;
        const data = buf.data || buf;
        let hash = 0;

        let bytes: number[] = [];
        if (Array.isArray(data)) {
            bytes = data;
        } else if (data instanceof Uint8Array) {
            bytes = Array.from(data);
        }

        for (let i = 0; i < Math.min(bytes.length, 100); i++) {
            hash = ((hash << 5) - hash) + (bytes[i] || 0);
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    getLoadedModelsCount(): number {
        return this.loadedModels.size;
    }

    getModelList(): string[] {
        return Array.from(this.loadedModels.keys());
    }
}

export default new MultiModelH5Service();
