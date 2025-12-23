import { Request, Response } from 'express';
import databaseService from '../services/databaseService.js';

/**
 * Lấy lịch sử dự đoán
 */
export const getHistoryController = async (req: Request, res: Response) => {
    try {
        const { userId, limit = 50 } = req.query;
        const userIdNum = userId ? Number(userId) : undefined;
        const limitNum = Number(limit);

        const history = await databaseService.getPredictionHistory(userIdNum, limitNum);

        res.json({
            success: true,
            data: history,
            count: history.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Lỗi lấy history:', error);
        res.status(500).json({
            success: false,
            error: 'Không thể lấy lịch sử dự đoán',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * Lấy lịch sử chat
 */
export const getChatHistoryController = async (req: Request, res: Response) => {
    try {
        const { userId, predictionId, limit = 50 } = req.query;
        const userIdNum = userId ? Number(userId) : undefined;
        const predictionIdNum = predictionId ? Number(predictionId) : undefined;
        const limitNum = Number(limit);

        const chatHistory = await databaseService.getChatHistory(userIdNum, predictionIdNum, limitNum);

        res.json({
            success: true,
            data: chatHistory,
            count: chatHistory.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Lỗi lấy chat history:', error);
        res.status(500).json({
            success: false,
            error: 'Không thể lấy lịch sử chat',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * Lưu feedback từ người dùng
 */
export const saveFeedbackController = async (req: Request, res: Response) => {
    try {
        const {
            userId,
            predictionId,
            rating,
            accuracyRating,
            usefulnessRating,
            comment,
            actualDisease
        } = req.body;

        if (!predictionId || !rating) {
            return res.status(400).json({
                success: false,
                error: 'Thiếu thông tin bắt buộc',
                message: 'predictionId và rating là bắt buộc'
            });
        }

        const feedbackId = await databaseService.saveFeedback({
            userId: userId ? Number(userId) : undefined,
            predictionId: Number(predictionId),
            rating: Number(rating),
            accuracyRating: accuracyRating ? Number(accuracyRating) : undefined,
            usefulnessRating: usefulnessRating ? Number(usefulnessRating) : undefined,
            comment,
            actualDisease
        });

        res.json({
            success: true,
            feedbackId,
            message: 'Cảm ơn bạn đã gửi phản hồi!',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Lỗi lưu feedback:', error);
        res.status(500).json({
            success: false,
            error: 'Không thể lưu phản hồi',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * Tìm kiếm dự đoán
 */
export const searchPredictionsController = async (req: Request, res: Response) => {
    try {
        const { keyword, limit = 20 } = req.query;

        if (!keyword || typeof keyword !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Thiếu từ khóa tìm kiếm',
                message: 'Vui lòng cung cấp từ khóa tìm kiếm'
            });
        }

        const results = await databaseService.searchPredictions(keyword, Number(limit));

        res.json({
            success: true,
            data: results,
            count: results.length,
            keyword,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Lỗi tìm kiếm:', error);
        res.status(500).json({
            success: false,
            error: 'Không thể thực hiện tìm kiếm',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * Lấy thống kê hệ thống
 */
export const getStatsController = async (req: Request, res: Response) => {
    try {
        const stats = await databaseService.getSystemStats();

        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Lỗi lấy stats:', error);
        res.status(500).json({
            success: false,
            error: 'Không thể lấy thống kê hệ thống',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * Export danh sách dự đoán ra CSV
 */
export const exportPredictionsController = async (req: Request, res: Response) => {
    try {
        const { userId, limit = 1000 } = req.query;
        const userIdNum = userId ? Number(userId) : undefined;
        const limitNum = Number(limit);

        const predictions = await databaseService.getPredictionHistory(userIdNum, limitNum);

        // Tạo CSV content
        const csvHeader = 'ID,Tên File,Kết Quả Dự Đoán,Độ Tin Cậy,Model,Thời Gian Xử Lý,Ngày Tạo\n';
        const csvContent = predictions.map(p =>
            `${p.id},"${p.image_filename}","${p.prediction_result}",${p.confidence_score},"${p.model_name}",${p.processing_time_ms},"${p.created_at}"`
        ).join('\n');

        const csv = csvHeader + csvContent;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="disease_predictions_${new Date().toISOString().split('T')[0]}.csv"`);
        res.send('\uFEFF' + csv); // Add BOM for Excel UTF-8 support

    } catch (error) {
        console.error('❌ Lỗi export CSV:', error);
        res.status(500).json({
            success: false,
            error: 'Không thể export dữ liệu',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * Trang dashboard hiển thị thống kê
 */
export const dashboardController = async (req: Request, res: Response) => {
    try {
        const stats = await databaseService.getSystemStats();
        const recentPredictions = await databaseService.getPredictionHistory(undefined, 10);

        const html = `
      <!DOCTYPE html>
      <html>
      <head>
          <title>🌿 Dashboard - Hệ thống Nhận diện Bệnh Cây</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
              body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  margin: 0;
                  padding: 20px;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  min-height: 100vh;
              }
              .container {
                  max-width: 1200px;
                  margin: 0 auto;
              }
              .header {
                  background: white;
                  padding: 30px;
                  border-radius: 15px;
                  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                  margin-bottom: 30px;
                  text-align: center;
              }
              .stats-grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                  gap: 20px;
                  margin-bottom: 30px;
              }
              .stat-card {
                  background: white;
                  padding: 25px;
                  border-radius: 15px;
                  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                  text-align: center;
              }
              .stat-number {
                  font-size: 2.5em;
                  font-weight: bold;
                  color: #059669;
                  margin-bottom: 10px;
              }
              .stat-label {
                  color: #6b7280;
                  font-size: 1.1em;
              }
              .recent-section {
                  background: white;
                  padding: 30px;
                  border-radius: 15px;
                  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                  margin-bottom: 30px;
              }
              .table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 20px;
              }
              .table th, .table td {
                  padding: 12px;
                  text-align: left;
                  border-bottom: 1px solid #e5e7eb;
              }
              .table th {
                  background: #f9fafb;
                  font-weight: bold;
                  color: #374151;
              }
              .disease-name {
                  font-weight: bold;
                  color: #059669;
              }
              .confidence {
                  padding: 4px 8px;
                  border-radius: 20px;
                  color: white;
                  font-size: 0.9em;
              }
              .confidence.high { background: #10b981; }
              .confidence.medium { background: #f59e0b; }
              .confidence.low { background: #ef4444; }
              .nav-buttons {
                  text-align: center;
                  margin: 30px 0;
              }
              .nav-button {
                  display: inline-block;
                  background: #4CAF50;
                  color: white;
                  padding: 15px 30px;
                  text-decoration: none;
                  border-radius: 50px;
                  margin: 0 10px;
                  font-weight: bold;
                  box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
                  transition: transform 0.3s;
              }
              .nav-button:hover {
                  transform: translateY(-2px);
              }
              .chart-container {
                  background: white;
                  padding: 30px;
                  border-radius: 15px;
                  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                  margin-bottom: 30px;
              }
              @media (max-width: 768px) {
                  .stats-grid { grid-template-columns: 1fr; }
                  .table { font-size: 0.9em; }
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>🌿 Dashboard Hệ thống Nhận diện Bệnh Cây</h1>
                  <p>Thống kê hoạt động và hiệu suất hệ thống AI</p>
                  <small>Cập nhật: ${new Date().toLocaleString('vi-VN')}</small>
              </div>

              <div class="stats-grid">
                  <div class="stat-card">
                      <div class="stat-number">${stats.totalPredictions || 0}</div>
                      <div class="stat-label">📊 Tổng Dự Đoán</div>
                  </div>
                  <div class="stat-card">
                      <div class="stat-number">${stats.totalUsers || 0}</div>
                      <div class="stat-label">👥 Người Dùng</div>
                  </div>
                  <div class="stat-card">
                      <div class="stat-number">${stats.totalChatMessages || 0}</div>
                      <div class="stat-label">💬 Tin Nhắn Chat</div>
                  </div>
                  <div class="stat-card">
                      <div class="stat-number">${(stats.avgConfidence * 100).toFixed(1)}%</div>
                      <div class="stat-label">🎯 Độ Tin Cậy TB</div>
                  </div>
              </div>

              <div class="recent-section">
                  <h2>📈 Bệnh Phổ Biến Nhất</h2>
                  <table class="table">
                      <thead>
                          <tr>
                              <th>Loại Bệnh</th>
                              <th>Số Lần Phát Hiện</th>
                              <th>Tỷ Lệ</th>
                          </tr>
                      </thead>
                      <tbody>
                          ${(stats.topDiseases || []).map((disease: any) => `
                              <tr>
                                  <td class="disease-name">${disease.prediction_result}</td>
                                  <td>${disease.count}</td>
                                  <td>${((disease.count / stats.totalPredictions) * 100).toFixed(1)}%</td>
                              </tr>
                          `).join('')}
                      </tbody>
                  </table>
              </div>

              <div class="recent-section">
                  <h2>🕒 Dự Đoán Gần Đây</h2>
                  <table class="table">
                      <thead>
                          <tr>
                              <th>Thời Gian</th>
                              <th>File Ảnh</th>
                              <th>Kết Quả</th>
                              <th>Độ Tin Cậy</th>
                              <th>Model</th>
                          </tr>
                      </thead>
                      <tbody>
                          ${recentPredictions.map(p => `
                              <tr>
                                  <td>${new Date(p.created_at).toLocaleString('vi-VN')}</td>
                                  <td>${p.image_filename}</td>
                                  <td class="disease-name">${p.prediction_result}</td>
                                  <td>
                                      <span class="confidence ${p.confidence_score >= 0.9 ? 'high' : p.confidence_score >= 0.7 ? 'medium' : 'low'}">
                                          ${(p.confidence_score * 100).toFixed(1)}%
                                      </span>
                                  </td>
                                  <td>${p.model_name}</td>
                              </tr>
                          `).join('')}
                      </tbody>
                  </table>
              </div>

              <div class="nav-buttons">
                  <a href="/" class="nav-button">🏠 Trang Chủ</a>
                  <a href="/test-upload" class="nav-button">🧪 Test AI</a>
                  <a href="/api/history/export" class="nav-button">📥 Export CSV</a>
                  <a href="/api/history" class="nav-button">📊 API History</a>
              </div>
          </div>
      </body>
      </html>
    `;

        res.send(html);

    } catch (error) {
        console.error('❌ Lỗi dashboard:', error);
        res.status(500).json({
            success: false,
            error: 'Không thể tải dashboard',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};