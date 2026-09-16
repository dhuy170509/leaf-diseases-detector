import { Request, Response } from 'express';
import { analyzeImagePixelByPixel } from '../services/pixelAnalysisService.js';

/**
 * Single real prediction pipeline — pixel-analysis-v1
 * - Receives image buffer via multer memory storage
 * - Runs real pixel-by-pixel analysis (Jimp, no mock, no fake delay)
 * - Returns real prediction + confidence + real processing time + timestamp
 */
export const PREDICT_MODEL_NAME = 'pixel-analysis-v1';
export const PREDICT_MODEL_TYPE = 'heuristic-pixel-analysis (Jimp)';

export const predictController = async (req: Request, res: Response) => {
    const startTime = Date.now();
    try {
        const image = req.file?.buffer;
        if (!image) {
            return res.status(400).json({
                success: false,
                error: 'No image provided',
                message: 'Please upload an image file using the "image" field'
            });
        }

        const analysis = await analyzeImagePixelByPixel(image);
        const top = analysis.predictedDiseases[0] || {
            name: 'Không xác định (Unknown)',
            confidence: 0.5,
            markers: [] as string[]
        };

        return res.status(200).json({
            success: true,
            status: 'OK',
            model: PREDICT_MODEL_NAME,
            model_type: PREDICT_MODEL_TYPE,
            prediction: top.name,
            confidence: top.confidence,
            severity: analysis.leafHealthMetrics.severity,
            healthy_ratio: analysis.leafHealthMetrics.healthyPixelRatio,
            diseased_ratio: analysis.leafHealthMetrics.diseasedPixelRatio,
            anomaly_score: analysis.leafHealthMetrics.anomalyScore,
            color_distribution: analysis.colorDistribution,
            disease_markers: analysis.diseaseMarkers,
            spatial_analysis: analysis.spatialAnalysis,
            top_predictions: analysis.predictedDiseases,
            pixel_count: analysis.pixelCount,
            processing_time_ms: Date.now() - startTime,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            status: 'ERROR',
            message: err instanceof Error ? err.message : 'Unknown error',
            processing_time_ms: Date.now() - startTime,
            timestamp: new Date().toISOString()
        });
    }
};