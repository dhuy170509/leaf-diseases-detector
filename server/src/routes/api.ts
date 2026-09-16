import express from 'express';
import fs from 'fs';
import multer from 'multer';
import { predictController, PREDICT_MODEL_NAME, PREDICT_MODEL_TYPE } from '../controllers/predictController.js';
import weatherService from '../services/weatherService.js';
import modelPerformanceService from '../services/modelPerformanceService.js';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for image uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

router.post('/predict', upload.single('image'), predictController);

// Ensure modelPerformanceService is exported for use
export { modelPerformanceService };

// GET /api/weather - Auto-detect location or use lat/lon
// Parameters:
//   ?lat=10.5&lon=106.5&days=3 - specific location
//   ?auto=true&days=3 - auto-detect from IP
//   ?city=HaNoi&days=3 - search city (optional)
router.get('/weather', async (req, res) => {
    try {
        let lat = parseFloat(req.query.lat as string);
        let lon = parseFloat(req.query.lon as string);
        const days = Math.min(7, Math.max(1, parseInt((req.query.days as string) || '3', 10)));
        const autoDetect = req.query.auto === 'true' || req.query.auto === '1';

        // Auto-detect location from IP if requested or if no coordinates provided
        if (autoDetect || (Number.isNaN(lat) && Number.isNaN(lon))) {
            console.log('🌍 Auto-detecting location from IP...');
            const location = await weatherService.detectLocationFromIP(req.ip);
            lat = location.lat;
            lon = location.lon;
            console.log(`✅ Detected location: ${location.name} (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
        }

        if (Number.isNaN(lat) || Number.isNaN(lon)) {
            return res.status(400).json({
                success: false,
                error: 'Missing or invalid lat/lon query parameters. Use ?lat=10.5&lon=106.5 or ?auto=true'
            });
        }

        const forecast = await weatherService.getWeatherForecast(lat, lon, days);
        return res.json({
            success: true,
            location: forecast.location,
            source: forecast.source,
            generatedAt: forecast.generatedAt,
            daily: forecast.daily
        });
    } catch (err) {
        console.error('❌ Weather endpoint error:', err);
        return res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
    }
});

// GET /api/weather/detect - Detect current user location
router.get('/weather/detect', async (req, res) => {
    try {
        console.log('📍 Detecting user location...');
        const location = await weatherService.detectLocationFromIP(req.ip);
        return res.json({
            success: true,
            location,
            ip: req.ip
        });
    } catch (err) {
        console.error('❌ Location detect error:', err);
        return res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
    }
});

// POST /api/feedback - Record user feedback on model predictions
// Body: { modelName, predictedDisease, userSelectedDisease, imageFilename }
router.post('/feedback', async (req, res) => {
    try {
        const { modelName, predictedDisease, userSelectedDisease, imageFilename } = req.body;

        if (!modelName || !predictedDisease || !userSelectedDisease) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: modelName, predictedDisease, userSelectedDisease'
            });
        }

        const isCorrect = predictedDisease === userSelectedDisease;

        await modelPerformanceService.recordFeedback({
            predictionId: Date.now().toString(),
            imageFilename: imageFilename || 'unknown',
            modelName,
            predictedDisease,
            userSelectedDisease,
            isCorrect,
            timestamp: new Date().toISOString(),
            userIP: req.ip
        });

        const performance = modelPerformanceService.getModelPerformance(modelName);

        return res.json({
            success: true,
            feedback: {
                modelName,
                isCorrect,
                message: isCorrect
                    ? `✅ ${modelName} was correct!`
                    : `❌ ${modelName} predicted wrong. Correct: ${userSelectedDisease}`,
                modelAccuracy: performance ? (performance.accuracy * 100).toFixed(1) + '%' : 'N/A',
                modelWeight: performance ? performance.votingWeight.toFixed(2) + 'x' : 'N/A'
            }
        });
    } catch (error) {
        console.error('❌ Feedback endpoint error:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// GET /api/models/performance - Get model performance leaderboard
router.get('/models/performance', async (req, res) => {
    try {
        const performances = modelPerformanceService.getModelPerformances();
        const leaderboard = modelPerformanceService.getLeaderboard();

        return res.json({
            success: true,
            summary: modelPerformanceService.getPerformanceSummary(),
            models: performances,
            leaderboard: leaderboard.map((model, index) => ({
                rank: index + 1,
                medal: index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉',
                ...model
            }))
        });
    } catch (error) {
        console.error('❌ Performance endpoint error:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// GET /api/models/weights - Get current voting weights
router.get('/models/weights', async (req, res) => {
    try {
        const weights = modelPerformanceService.getVotingWeights();

        return res.json({
            success: true,
            weights,
            description: 'Current voting weights for ensemble model predictions'
        });
    } catch (error) {
        console.error('❌ Weights endpoint error:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// POST /api/predict - Single real prediction pipeline (pixel-analysis-v1)
router.post('/predict', upload.single('image'), predictController);

// Legacy empty-model endpoints removed (predict-h5, predict-plant,
// predict-mango, predict-multi, predict-best). They previously returned
// hardcoded NO_MODEL_INSTALLED and misled about system capabilities.
// Use POST /api/predict instead.

// GET /api/models - List available models (single real pipeline)
router.get('/models', (req, res) => {
    return res.json({
        success: true,
        models: [
            {
                name: PREDICT_MODEL_NAME,
                type: PREDICT_MODEL_TYPE,
                status: 'OK',
                endpoint: '/api/predict'
            }
        ]
    });
});

// POST /api/contact - Receive contact/feedback messages (support page).
// Stores to database/contact_messages.jsonl with real timestamp. No fake reply.
router.post('/contact', async (req, res) => {
    try {
        const { name, email, message, rating, type } = req.body || {};
        if (!message || typeof message !== 'string' || !message.trim()) {
            return res.status(400).json({ success: false, error: 'Nội dung (message) là bắt buộc' });
        }
        const entry = {
            type: type || 'contact',
            name: name || null,
            email: email || null,
            message: message.trim().slice(0, 2000),
            rating: rating === undefined || rating === '' ? null : Number(rating),
            timestamp: new Date().toISOString(),
            ip: req.ip
        };
        const dbDir = path.join(__dirname, '../../../database');
        try { fs.mkdirSync(dbDir, { recursive: true }); } catch { /* ignore */ }
        fs.appendFileSync(path.join(dbDir, 'contact_messages.jsonl'), JSON.stringify(entry) + '\n');
        return res.json({ success: true, timestamp: entry.timestamp });
    } catch (error) {
        console.error('❌ Contact endpoint error:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;