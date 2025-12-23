/**
 * Crop Routes - API endpoints for crop management
 * Lộ trình quản lý hồ sơ cây trồng
 */

import express, { Request, Response } from 'express';
import cropService from '../services/cropService.js';

const router = express.Router();

/**
 * POST /api/crops - Tạo hồ sơ cây mới
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        const { userId, crop_name, crop_type, location, latitude, longitude, area_hectare, planting_date, variety } = req.body;

        if (!userId || !crop_name || !crop_type || !area_hectare) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const cropId = await cropService.createCrop(userId, {
            crop_name,
            crop_type,
            location,
            latitude,
            longitude,
            area_hectare,
            planting_date,
            variety
        });

        res.status(201).json({
            success: true,
            message: 'Tạo hồ sơ cây thành công',
            cropId
        });
    } catch (error: any) {
        console.error('❌ Error creating crop:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/crops/user/:userId - Lấy danh sách cây của user
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.userId);
        const crops = await cropService.getUserCrops(userId);

        res.json({
            success: true,
            data: crops,
            total: crops.length
        });
    } catch (error: any) {
        console.error('❌ Error fetching crops:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/crops/:cropId - Lấy chi tiết cây trồng
 */
router.get('/:cropId', async (req: Request, res: Response) => {
    try {
        const cropId = parseInt(req.params.cropId);
        const crop = await cropService.getCropDetail(cropId);

        if (!crop) {
            return res.status(404).json({ error: 'Crop not found' });
        }

        res.json({
            success: true,
            data: crop
        });
    } catch (error: any) {
        console.error('❌ Error fetching crop:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PUT /api/crops/:cropId - Cập nhật thông tin cây
 */
router.put('/:cropId', async (req: Request, res: Response) => {
    try {
        const cropId = parseInt(req.params.cropId);
        await cropService.updateCrop(cropId, req.body);

        res.json({
            success: true,
            message: 'Cập nhật cây trồng thành công'
        });
    } catch (error: any) {
        console.error('❌ Error updating crop:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/crops/:cropId - Xóa cây trồng
 */
router.delete('/:cropId', async (req: Request, res: Response) => {
    try {
        const cropId = parseInt(req.params.cropId);
        await cropService.deleteCrop(cropId);

        res.json({
            success: true,
            message: 'Xóa cây trồng thành công'
        });
    } catch (error: any) {
        console.error('❌ Error deleting crop:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/crops/:cropId/history - Lấy lịch sử bệnh
 */
router.get('/:cropId/history', async (req: Request, res: Response) => {
    try {
        const cropId = parseInt(req.params.cropId);
        const history = await cropService.getDiseaseHistory(cropId);

        res.json({
            success: true,
            data: history,
            total: history.length
        });
    } catch (error: any) {
        console.error('❌ Error fetching disease history:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/crops/:cropId/disease - Thêm bệnh mới vào lịch sử
 */
router.post('/:cropId/disease', async (req: Request, res: Response) => {
    try {
        const cropId = parseInt(req.params.cropId);
        const { disease_name, disease_severity, confidence_score, image_path, description } = req.body;

        if (!disease_name || !disease_severity) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const historyId = await cropService.addDiseaseHistory(cropId, {
            disease_name,
            disease_severity,
            confidence_score,
            image_path,
            description
        });

        res.status(201).json({
            success: true,
            message: 'Thêm bệnh vào lịch sử thành công',
            historyId
        });
    } catch (error: any) {
        console.error('❌ Error adding disease history:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PUT /api/crops/disease/:historyId - Cập nhật trạng thái xử lý bệnh
 */
router.put('/disease/:historyId', async (req: Request, res: Response) => {
    try {
        const historyId = parseInt(req.params.historyId);
        await cropService.updateDiseaseStatus(historyId, req.body);

        res.json({
            success: true,
            message: 'Cập nhật trạng thái xử lý bệnh thành công'
        });
    } catch (error: any) {
        console.error('❌ Error updating disease status:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/crops/:cropId/statistics - Lấy thống kê cây
 */
router.get('/:cropId/statistics', async (req: Request, res: Response) => {
    try {
        const cropId = parseInt(req.params.cropId);
        const stats = await cropService.getCropStatistics(cropId);

        res.json({
            success: true,
            data: stats
        });
    } catch (error: any) {
        console.error('❌ Error fetching crop statistics:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/crops/search?q=query&userId=1 - Tìm kiếm cây
 */
router.get('/search', async (req: Request, res: Response) => {
    try {
        const { q, userId } = req.query;

        if (!q || !userId) {
            return res.status(400).json({ error: 'Missing query or userId' });
        }

        const results = await cropService.searchCrops(parseInt(userId as string), q as string);

        res.json({
            success: true,
            data: results,
            total: results.length
        });
    } catch (error: any) {
        console.error('❌ Error searching crops:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/crops/nearby?lat=21.0&lon=105.0&radius=5 - Lấy cây gần vị trí
 */
router.get('/nearby', async (req: Request, res: Response) => {
    try {
        const { lat, lon, radius } = req.query;

        if (!lat || !lon) {
            return res.status(400).json({ error: 'Missing latitude or longitude' });
        }

        const crops = await cropService.getCropsNearLocation(
            parseFloat(lat as string),
            parseFloat(lon as string),
            radius ? parseFloat(radius as string) : 5
        );

        res.json({
            success: true,
            data: crops,
            total: crops.length
        });
    } catch (error: any) {
        console.error('❌ Error finding nearby crops:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
