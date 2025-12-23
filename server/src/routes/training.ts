import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Configure multer for training data
const trainingDataDir = path.join(__dirname, '../../..', 'training_data');
fs.mkdirSync(trainingDataDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const diseaseLabel = req.body.diseaseLabel || 'unknown';
        const labelDir = path.join(trainingDataDir, diseaseLabel);
        fs.mkdirSync(labelDir, { recursive: true });
        cb(null, labelDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files allowed!'));
        }
    }
});

// Training status tracker
let trainingInProgress = false;
let trainingProgress = {
    status: 'idle',
    model: '',
    progress: 0,
    startTime: null as number | null,
    estimatedTime: null as number | null
};

/**
 * POST /api/training/upload-data
 * Upload training image for specific disease class
 * 
 * Body: { diseaseLabel: string }
 * File: image file
 */
router.post('/upload-data', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No image provided'
            });
        }

        const diseaseLabel = req.body.diseaseLabel || 'unknown';
        const filePath = req.file.path;

        console.log(`✓ Training data uploaded: ${diseaseLabel}/${req.file.filename}`);

        return res.json({
            success: true,
            message: 'Training image uploaded',
            diseaseLabel,
            filename: req.file.filename,
            filepath: filePath,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Upload error:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed'
        });
    }
});

/**
 * POST /api/training/retrain
 * Trigger model retraining with uploaded data
 * 
 * Body: { epochs?: number, models?: string[] }
 */
router.post('/retrain', async (req, res) => {
    try {
        if (trainingInProgress) {
            return res.status(409).json({
                success: false,
                error: 'Training already in progress',
                progress: trainingProgress
            });
        }

        const epochs = parseInt(req.body.epochs) || 5;
        const modelsToTrain = req.body.models || ['all'];

        // Check if training data exists
        const trainingDataExists = fs.readdirSync(trainingDataDir).length > 0;
        if (!trainingDataExists) {
            return res.status(400).json({
                success: false,
                error: 'No training data uploaded yet',
                message: 'Please upload training images first using /api/training/upload-data'
            });
        }

        trainingInProgress = true;
        trainingProgress = {
            status: 'starting',
            model: 'all',
            progress: 0,
            startTime: Date.now() as number,
            estimatedTime: (epochs * 60000) as number // Rough estimate: 1 min per epoch
        };

        console.log(`\n🚀 Starting model retraining...`);
        console.log(`   Epochs: ${epochs}`);
        console.log(`   Models: ${modelsToTrain.join(', ')}`);
        console.log(`   Data: ${trainingDataDir}`);

        // Run training script in background
        const modelDir = path.join(__dirname, '../../..', 'model');
        const scriptPath = path.join(modelDir, 'auto_train.py');

        const pythonProcess = spawn('python', [scriptPath, '--epochs', epochs.toString()], {
            cwd: modelDir,
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';

        pythonProcess.stdout?.on('data', (data) => {
            const line = data.toString();
            stdout += line;
            console.log(`[Training] ${line.trim()}`);

            // Update progress
            if (line.includes('Epoch')) {
                const match = line.match(/Epoch (\d+)\/(\d+)/);
                if (match) {
                    const current = parseInt(match[1]);
                    const total = parseInt(match[2]);
                    trainingProgress.progress = Math.round((current / total) * 100);
                }
            }
        });

        pythonProcess.stderr?.on('data', (data) => {
            stderr += data.toString();
            console.error(`[Training Error] ${data}`);
        });

        pythonProcess.on('close', (code) => {
            trainingInProgress = false;

            if (code === 0) {
                trainingProgress.status = 'completed';
                console.log('✅ Training completed successfully');

                return res.json({
                    success: true,
                    message: 'Model retraining completed',
                    output: stdout,
                    elapsedTime: Date.now() - (trainingProgress.startTime || 0),
                    timestamp: new Date().toISOString()
                });
            } else {
                trainingProgress.status = 'failed';
                console.error('❌ Training failed');

                return res.status(500).json({
                    success: false,
                    error: 'Training process failed',
                    output: stdout,
                    error_output: stderr
                });
            }
        });

        // Return immediately with progress tracking URL
        return res.json({
            success: true,
            message: 'Training started',
            statusUrl: '/api/training/status',
            estimatedTime: trainingProgress.estimatedTime,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        trainingInProgress = false;
        console.error('Retrain error:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Retraining failed'
        });
    }
});

/**
 * GET /api/training/status
 * Get current training status and progress
 */
router.get('/status', (req, res) => {
    const elapsed = trainingProgress.startTime ? Date.now() - trainingProgress.startTime : 0;

    return res.json({
        success: true,
        training: trainingInProgress,
        progress: {
            ...trainingProgress,
            elapsedTime: elapsed,
            remainingTime: Math.max(0, (trainingProgress.estimatedTime || 0) - elapsed)
        }
    });
});

/**
 * GET /api/training/stats
 * Get training statistics
 */
router.get('/stats', (req, res) => {
    try {
        const statsFile = path.join(path.dirname(require.main?.filename || ''), '../../model/training_history.json');

        let stats = {
            totalSessions: 0,
            totalEpochs: 0,
            bestAccuracy: 0,
            lastSession: null
        };

        if (fs.existsSync(statsFile)) {
            const history = JSON.parse(fs.readFileSync(statsFile, 'utf-8'));
            stats.totalSessions = history.training_sessions?.length || 0;
            stats.totalEpochs = history.total_epochs || 0;
            stats.bestAccuracy = history.best_accuracy || 0;
            stats.lastSession = history.training_sessions?.[history.training_sessions.length - 1] || null;
        }

        return res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Stats error:', error);
        return res.status(500).json({
            success: false,
            error: 'Cannot retrieve stats'
        });
    }
});

/**
 * GET /api/training/data-count
 * Get count of training images by disease class
 */
router.get('/data-count', (req, res) => {
    try {
        const dataCounts: { [key: string]: number } = {};

        if (fs.existsSync(trainingDataDir)) {
            fs.readdirSync(trainingDataDir).forEach(disease => {
                const diseaseDir = path.join(trainingDataDir, disease);
                if (fs.statSync(diseaseDir).isDirectory()) {
                    dataCounts[disease] = fs.readdirSync(diseaseDir).length;
                }
            });
        }

        return res.json({
            success: true,
            dataCounts,
            totalImages: Object.values(dataCounts).reduce((a, b) => a + b, 0),
            readyForTraining: Object.values(dataCounts).some(count => count > 5)
        });
    } catch (error) {
        console.error('Data count error:', error);
        return res.status(500).json({
            success: false,
            error: 'Cannot count training data'
        });
    }
});

export default router;
