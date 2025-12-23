/**
 * Weather Routes - API endpoints for weather & disease risk
 * Lộ trình API thời tiết và cảnh báo bệnh
 */

import express, { Request, Response } from 'express';
import { getWeatherForecast, detectLocationFromIP } from '../services/weatherService.js';

const router = express.Router();

/**
 * GET /api/weather?lat=21.0285&lon=105.8542 
 * Lấy dự báo thời tiết 3 ngày
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const { lat, lon, days } = req.query;

        if (!lat || !lon) {
            return res.status(400).json({ error: 'Missing latitude or longitude' });
        }

        const forecast = await getWeatherForecast(
            Number.parseFloat(lat as string),
            Number.parseFloat(lon as string),
            days ? Number.parseInt(days as string) : 3
        );

        res.json({
            success: true,
            data: forecast
        });
    } catch (error: any) {
        console.error('❌ Error fetching weather:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/weather/auto-location
 * Tự động phát hiện vị trí từ IP
 */
router.get('/auto-location', async (req: Request, res: Response) => {
    try {
        const clientIp = req.ip || undefined;
        const location = await detectLocationFromIP(clientIp);

        res.json({
            success: true,
            data: location
        });
    } catch (error: any) {
        console.error('❌ Error detecting location:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/weather/forecast?lat=21.0285&lon=105.8542&days=5
 * Lấy dự báo thời tiết chi tiết
 */
router.get('/forecast', async (req: Request, res: Response) => {
    try {
        const { lat, lon, days } = req.query;

        if (!lat || !lon) {
            return res.status(400).json({ error: 'Missing latitude or longitude' });
        }

        const forecast = await getWeatherForecast(
            Number.parseFloat(lat as string),
            Number.parseFloat(lon as string),
            days ? Number.parseInt(days as string) : 5
        );

        res.json({
            success: true,
            data: forecast,
            description: 'Dự báo thời tiết chi tiết 5 ngày'
        });
    } catch (error: any) {
        console.error('❌ Error fetching forecast:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
