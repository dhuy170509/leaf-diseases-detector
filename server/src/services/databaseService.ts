import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Database configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, '../../../database/disease_detector.db');
const SCHEMA_PATH = path.resolve(__dirname, '../../../database/schema.sql');

// Ensure database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

let db: sqlite3.Database;

/**
 * Khởi tạo kết nối database
 */
export async function initDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                console.error('❌ Lỗi kết nối database:', err.message);
                reject(err);
            } else {
                console.log('✅ Đã kết nối SQLite database thành công');

                // Đọc và chạy schema
                if (fs.existsSync(SCHEMA_PATH)) {
                    const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
                    db.exec(schema, (err) => {
                        if (err) {
                            console.error('❌ Lỗi tạo schema:', err.message);
                            reject(err);
                        } else {
                            console.log('✅ Database schema đã được tạo/cập nhật');
                            resolve();
                        }
                    });
                } else {
                    console.warn('⚠️ Không tìm thấy file schema.sql');
                    resolve();
                }
            }
        });
    });
}

/**
 * Lưu kết quả dự đoán vào database
 */
export async function savePrediction(data: {
    userId?: number;
    imageFilename: string;
    imagePath?: string;
    imageSize: number;
    contentType: string;
    predictionResult: string;
    confidenceScore: number;
    originalPrediction?: string;
    source: string;
    modelName: string;
    modelVersion?: string;
    modelsUsed?: number;
    totalModels?: number;
    processingTimeMs: number;
    ipAddress?: string;
    userAgent?: string;
    latitude?: number;
    longitude?: number;
}): Promise<number> {
    return new Promise((resolve, reject) => {
        const query = `
      INSERT INTO predictions (
        user_id, image_filename, image_path, image_size, content_type,
        prediction_result, confidence_score, original_prediction, source,
        model_name, model_version, models_used, total_models, processing_time_ms,
        ip_address, user_agent, latitude, longitude
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

        db.run(query, [
            data.userId || null,
            data.imageFilename,
            data.imagePath || null,
            data.imageSize,
            data.contentType,
            data.predictionResult,
            data.confidenceScore,
            data.originalPrediction || null,
            data.source,
            data.modelName,
            data.modelVersion || null,
            data.modelsUsed || 1,
            data.totalModels || 1,
            data.processingTimeMs,
            data.ipAddress || null,
            data.userAgent || null,
            data.latitude || null,
            data.longitude || null
        ], function (err) {
            if (err) {
                console.error('❌ Lỗi lưu prediction:', err.message);
                reject(err);
            } else {
                console.log(`✅ Đã lưu prediction với ID: ${this.lastID}`);
                resolve(this.lastID);
            }
        });
    });
}

/**
 * Lưu lịch sử chat vào database
 */
export async function saveChatMessage(data: {
    userId?: number;
    predictionId?: number;
    userMessage: string;
    botResponse: string;
    messageType?: string;
    responseSource?: string;
    responseTimeMs?: number;
    tokensUsed?: number;
}): Promise<number> {
    return new Promise((resolve, reject) => {
        const query = `
      INSERT INTO chat_history (
        user_id, prediction_id, user_message, bot_response,
        message_type, response_source, response_time_ms, tokens_used
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

        db.run(query, [
            data.userId || null,
            data.predictionId || null,
            data.userMessage,
            data.botResponse,
            data.messageType || 'disease_consultation',
            data.responseSource || 'openai',
            data.responseTimeMs || null,
            data.tokensUsed || null
        ], function (err) {
            if (err) {
                console.error('❌ Lỗi lưu chat message:', err.message);
                reject(err);
            } else {
                console.log(`✅ Đã lưu chat message với ID: ${this.lastID}`);
                resolve(this.lastID);
            }
        });
    });
}

/**
 * Lấy lịch sử dự đoán theo user
 */
export async function getPredictionHistory(userId?: number, limit: number = 50): Promise<any[]> {
    return new Promise((resolve, reject) => {
        let query = `
      SELECT p.*, u.name as user_name, u.email as user_email
      FROM predictions p
      LEFT JOIN users u ON p.user_id = u.id
    `;
        const params: any[] = [];

        if (userId) {
            query += ' WHERE p.user_id = ?';
            params.push(userId);
        }

        query += ' ORDER BY p.created_at DESC LIMIT ?';
        params.push(limit);

        db.all(query, params, (err, rows) => {
            if (err) {
                console.error('❌ Lỗi lấy prediction history:', err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

/**
 * Lấy lịch sử chat theo user hoặc prediction
 */
export async function getChatHistory(userId?: number, predictionId?: number, limit: number = 50): Promise<any[]> {
    return new Promise((resolve, reject) => {
        let query = `
      SELECT c.*, u.name as user_name, p.prediction_result
      FROM chat_history c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN predictions p ON c.prediction_id = p.id
      WHERE 1=1
    `;
        const params: any[] = [];

        if (userId) {
            query += ' AND c.user_id = ?';
            params.push(userId);
        }

        if (predictionId) {
            query += ' AND c.prediction_id = ?';
            params.push(predictionId);
        }

        query += ' ORDER BY c.created_at DESC LIMIT ?';
        params.push(limit);

        db.all(query, params, (err, rows) => {
            if (err) {
                console.error('❌ Lỗi lấy chat history:', err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

/**
 * Lưu feedback từ người dùng
 */
export async function saveFeedback(data: {
    userId?: number;
    predictionId: number;
    rating: number;
    accuracyRating?: number;
    usefulnessRating?: number;
    comment?: string;
    actualDisease?: string;
}): Promise<number> {
    return new Promise((resolve, reject) => {
        const query = `
      INSERT INTO feedback (
        user_id, prediction_id, rating, accuracy_rating, usefulness_rating, comment, actual_disease
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

        db.run(query, [
            data.userId || null,
            data.predictionId,
            data.rating,
            data.accuracyRating || null,
            data.usefulnessRating || null,
            data.comment || null,
            data.actualDisease || null
        ], function (err) {
            if (err) {
                console.error('❌ Lỗi lưu feedback:', err.message);
                reject(err);
            } else {
                console.log(`✅ Đã lưu feedback với ID: ${this.lastID}`);
                resolve(this.lastID);
            }
        });
    });
}

/**
 * Lấy thống kê hệ thống
 */
export async function getSystemStats(): Promise<any> {
    return new Promise((resolve, reject) => {
        const queries = {
            totalPredictions: 'SELECT COUNT(*) as count FROM predictions',
            totalUsers: 'SELECT COUNT(*) as count FROM users',
            totalChatMessages: 'SELECT COUNT(*) as count FROM chat_history',
            avgConfidence: 'SELECT AVG(confidence_score) as avg FROM predictions',
            avgProcessingTime: 'SELECT AVG(processing_time_ms) as avg FROM predictions',
            topDiseases: `
        SELECT prediction_result, COUNT(*) as count 
        FROM predictions 
        GROUP BY prediction_result 
        ORDER BY count DESC 
        LIMIT 10
      `,
            recentActivity: `
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM predictions 
        WHERE created_at >= datetime('now', '-7 days')
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `
        };

        const stats: any = {};
        let completed = 0;
        const total = Object.keys(queries).length;

        for (const [key, query] of Object.entries(queries)) {
            if (key === 'topDiseases' || key === 'recentActivity') {
                db.all(query, [], (err, rows) => {
                    if (err) {
                        console.error(`❌ Lỗi lấy stats ${key}:`, err.message);
                        stats[key] = [];
                    } else {
                        stats[key] = rows;
                    }
                    completed++;
                    if (completed === total) resolve(stats);
                });
            } else {
                db.get(query, [], (err, row: any) => {
                    if (err) {
                        console.error(`❌ Lỗi lấy stats ${key}:`, err.message);
                        stats[key] = 0;
                    } else {
                        stats[key] = row?.count || row?.avg || 0;
                    }
                    completed++;
                    if (completed === total) resolve(stats);
                });
            }
        }
    });
}

/**
 * Tìm kiếm dự đoán theo từ khóa
 */
export async function searchPredictions(keyword: string, limit: number = 20): Promise<any[]> {
    return new Promise((resolve, reject) => {
        const query = `
      SELECT p.*, u.name as user_name
      FROM predictions p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.prediction_result LIKE ? OR p.original_prediction LIKE ?
      ORDER BY p.created_at DESC
      LIMIT ?
    `;

        const searchTerm = `%${keyword}%`;
        db.all(query, [searchTerm, searchTerm, limit], (err, rows) => {
            if (err) {
                console.error('❌ Lỗi tìm kiếm predictions:', err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

/**
 * Log hệ thống
 */
export async function logSystem(level: string, component: string, message: string, errorDetails?: string, userId?: number, ipAddress?: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const query = `
      INSERT INTO system_logs (log_level, component, message, error_details, user_id, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

        db.run(query, [level, component, message, errorDetails || null, userId || null, ipAddress || null], function (err) {
            if (err) {
                console.error('❌ Lỗi log system:', err.message);
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

/**
 * Đóng kết nối database
 */
export function closeDatabase(): void {
    if (db) {
        db.close((err) => {
            if (err) {
                console.error('❌ Lỗi đóng database:', err.message);
            } else {
                console.log('✅ Đã đóng kết nối database');
            }
        });
    }
}

// Export database instance cho advanced queries
export { db };

export default {
    initDatabase,
    savePrediction,
    saveChatMessage,
    getPredictionHistory,
    getChatHistory,
    saveFeedback,
    getSystemStats,
    searchPredictions,
    logSystem,
    closeDatabase
};