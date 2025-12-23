/**
 * Crop Management Service
 * Quản lý hồ sơ cây trồng và lịch sử bệnh
 */

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, '../../../database/disease_detector.db');

let db: sqlite3.Database;

/**
 * Initialize database connection
 */
export function initCropDb(database: sqlite3.Database) {
    db = database;
}

/**
 * Tạo hồ sơ cây trồng mới
 */
export async function createCrop(userId: number, cropData: {
    crop_name: string;
    crop_type: string;
    location: string;
    latitude?: number;
    longitude?: number;
    area_hectare: number;
    planting_date: string;
    variety?: string;
}): Promise<number> {
    return new Promise((resolve, reject) => {
        const query = `
            INSERT INTO crops 
            (user_id, crop_name, crop_type, location, latitude, longitude, area_hectare, planting_date, variety)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.run(query, [
            userId,
            cropData.crop_name,
            cropData.crop_type,
            cropData.location,
            cropData.latitude || null,
            cropData.longitude || null,
            cropData.area_hectare,
            cropData.planting_date,
            cropData.variety || null
        ], function (err) {
            if (err) reject(err);
            else resolve(this.lastID);
        });
    });
}

/**
 * Lấy danh sách cây trồng của user
 */
export async function getUserCrops(userId: number): Promise<any[]> {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT 
                c.*,
                COUNT(DISTINCT dh.id) as disease_count,
                COUNT(DISTINCT CASE WHEN dh.resolved = 0 THEN dh.id END) as active_diseases,
                MAX(dh.detected_date) as last_disease_date
            FROM crops c
            LEFT JOIN disease_history dh ON c.id = dh.crop_id
            WHERE c.user_id = ?
            GROUP BY c.id
            ORDER BY c.created_at DESC
        `;

        db.all(query, [userId], (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
}

/**
 * Lấy chi tiết một cây trồng
 */
export async function getCropDetail(cropId: number): Promise<any> {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT c.*, 
                   COUNT(DISTINCT dh.id) as total_diseases,
                   COUNT(DISTINCT CASE WHEN dh.resolved = 1 THEN dh.id END) as treated_diseases
            FROM crops c
            LEFT JOIN disease_history dh ON c.id = dh.crop_id
            WHERE c.id = ?
            GROUP BY c.id
        `;

        db.get(query, [cropId], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

/**
 * Cập nhật thông tin cây trồng
 */
export async function updateCrop(cropId: number, updates: any): Promise<void> {
    return new Promise((resolve, reject) => {
        const fields = [];
        const values = [];

        for (const [key, value] of Object.entries(updates)) {
            if (key !== 'id' && key !== 'created_at') {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }

        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(cropId);

        const query = `UPDATE crops SET ${fields.join(', ')} WHERE id = ?`;

        db.run(query, values, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

/**
 * Xóa cây trồng
 */
export async function deleteCrop(cropId: number): Promise<void> {
    return new Promise((resolve, reject) => {
        db.run('DELETE FROM crops WHERE id = ?', [cropId], (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

/**
 * Thêm bệnh vào lịch sử
 */
export async function addDiseaseHistory(cropId: number, diseaseData: {
    disease_name: string;
    disease_severity: 'mild' | 'moderate' | 'severe' | 'critical';
    confidence_score: number;
    image_path?: string;
    description?: string;
}): Promise<number> {
    return new Promise((resolve, reject) => {
        const query = `
            INSERT INTO disease_history 
            (crop_id, disease_name, disease_severity, confidence_score, image_path, description)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        db.run(query, [
            cropId,
            diseaseData.disease_name,
            diseaseData.disease_severity,
            diseaseData.confidence_score,
            diseaseData.image_path || null,
            diseaseData.description || null
        ], function (err) {
            if (err) reject(err);
            else resolve(this.lastID);
        });
    });
}

/**
 * Lấy lịch sử bệnh của cây
 */
export async function getDiseaseHistory(cropId: number): Promise<any[]> {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT * FROM disease_history 
            WHERE crop_id = ? 
            ORDER BY detected_date DESC
        `;

        db.all(query, [cropId], (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
}

/**
 * Cập nhật trạng thái xử lý bệnh
 */
export async function updateDiseaseStatus(historyId: number, updates: {
    treatment_given?: string;
    treatment_date?: string;
    treatment_effectiveness?: 'poor' | 'fair' | 'good' | 'excellent';
    resolved?: boolean;
    resolved_date?: string;
}): Promise<void> {
    return new Promise((resolve, reject) => {
        const fields = ['updated_at = CURRENT_TIMESTAMP'];
        const values = [];

        if (updates.treatment_given) {
            fields.push('treatment_given = ?');
            values.push(updates.treatment_given);
        }
        if (updates.treatment_date) {
            fields.push('treatment_date = ?');
            values.push(updates.treatment_date);
        }
        if (updates.treatment_effectiveness) {
            fields.push('treatment_effectiveness = ?');
            values.push(updates.treatment_effectiveness);
        }
        if (updates.resolved !== undefined) {
            fields.push('resolved = ?');
            values.push(updates.resolved ? 1 : 0);
        }
        if (updates.resolved_date) {
            fields.push('resolved_date = ?');
            values.push(updates.resolved_date);
        }

        values.push(historyId);
        const query = `UPDATE disease_history SET ${fields.join(', ')} WHERE id = ?`;

        db.run(query, values, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

/**
 * Lấy thống kê cây trồng
 */
export async function getCropStatistics(cropId: number): Promise<any> {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT
                c.id,
                c.crop_name,
                COUNT(DISTINCT dh.id) as total_diseases,
                COUNT(DISTINCT CASE WHEN dh.resolved = 1 THEN dh.id END) as resolved_diseases,
                COUNT(DISTINCT CASE WHEN dh.resolved = 0 THEN dh.id END) as active_diseases,
                AVG(CASE WHEN dh.confidence_score IS NOT NULL THEN dh.confidence_score END) as avg_disease_confidence,
                COUNT(DISTINCT CASE WHEN dh.treatment_effectiveness = 'excellent' THEN dh.id END) as excellent_treatments,
                COUNT(DISTINCT CASE WHEN dh.treatment_effectiveness = 'good' THEN dh.id END) as good_treatments
            FROM crops c
            LEFT JOIN disease_history dh ON c.id = dh.crop_id
            WHERE c.id = ?
            GROUP BY c.id
        `;

        db.get(query, [cropId], (err, row: any) => {
            if (err) reject(err);
            else {
                if (row) {
                    row.treatment_success_rate = row.total_diseases > 0
                        ? ((row.resolved_diseases / row.total_diseases) * 100).toFixed(1)
                        : 0;
                }
                resolve(row);
            }
        });
    });
}

/**
 * Tìm kiếm cây trồng
 */
export async function searchCrops(userId: number, query: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
        const searchQuery = `
            SELECT * FROM crops 
            WHERE user_id = ? AND (
                crop_name LIKE ? OR 
                crop_type LIKE ? OR 
                location LIKE ? OR
                variety LIKE ?
            )
            ORDER BY created_at DESC
        `;

        const searchTerm = `%${query}%`;
        db.all(searchQuery, [userId, searchTerm, searchTerm, searchTerm, searchTerm], (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
}

/**
 * Lấy các cây gần vị trí GPS
 */
export async function getCropsNearLocation(lat: number, lon: number, radiusKm: number = 5): Promise<any[]> {
    return new Promise((resolve, reject) => {
        // Simple distance calculation using Haversine formula
        const query = `
            SELECT *,
                   (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * 
                   cos(radians(longitude) - radians(?)) + 
                   sin(radians(?)) * sin(radians(latitude)))) AS distance_km
            FROM crops
            WHERE latitude IS NOT NULL AND longitude IS NOT NULL
            HAVING distance_km <= ?
            ORDER BY distance_km ASC
        `;

        db.all(query, [lat, lon, lat, radiusKm], (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
}

export default {
    createCrop,
    getUserCrops,
    getCropDetail,
    updateCrop,
    deleteCrop,
    addDiseaseHistory,
    getDiseaseHistory,
    updateDiseaseStatus,
    getCropStatistics,
    searchCrops,
    getCropsNearLocation
};
