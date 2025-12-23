import { Request, Response } from 'express';
import { predictImage } from '../services/modelService.js';
import { generateDetailedAnalysis, formatAnalysisReport } from '../services/analysisService.js';
import databaseService from '../services/databaseService.js';
import mlModelsServiceV2 from '../services/mlModelsService-v2.js';
import { getDiseaseInfo } from '../data/diseaseDatabase.js';

export const predictController = async (req: Request, res: Response) => {
    const startTime = Date.now();
    try {
        const image = req.file?.buffer;
        if (!image) {
            return res.status(400).json({
                error: 'No image provided',
                message: 'Please upload an image file using the "image" field'
            });
        }

        // Get options from request
        const plantPart = req.body.plantPart || 'leaves';
        const validParts = ['leaves', 'stem', 'root', 'flower', 'fruit', 'whole'];
        const selectedPart = validParts.includes(plantPart) ? plantPart : 'leaves';

        const environmentalCondition = req.body.environmentalCondition || 'normal';
        const diseaseHistory = req.body.diseaseHistory || 'none';
        const treatmentAttempted = req.body.treatmentAttempted || 'none';
        const urgencyLevel = req.body.urgencyLevel || 'normal';
        const region = req.body.region || 'unknown';

        console.log(`🌿 Plant part: ${selectedPart} | Condition: ${environmentalCondition} | Urgency: ${urgencyLevel}`);

        const imageData = {
            buffer: image,
            filename: req.file?.originalname || 'uploaded-image',
            contentType: req.file?.mimetype || 'image/jpeg',
            plantPart: selectedPart,
            environmentalCondition,
            diseaseHistory,
            treatmentAttempted,
            urgencyLevel,
            region
        };

        // Run prediction using adaptive model manager
        console.log('🤖 Running prediction with Model Manager...');
        const ensemblePrediction = await mlModelsServiceV2.predictWithEnsemble(image);

        console.log('✅ Prediction complete:');
        console.log(`   Disease: ${ensemblePrediction.finalDisease}`);
        console.log(`   Confidence: ${(ensemblePrediction.finalConfidence * 100).toFixed(1)}%`);
        console.log(`   Severity: ${ensemblePrediction.severity}`);
        console.log(`   Model Used: ${ensemblePrediction.votingDetails.modelUsed}`);

        const metadata = {
            filename: imageData.filename,
            contentType: imageData.contentType,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            userId: req.body.userId || null,
            plantPart: selectedPart,
            environmentalCondition,
            urgencyLevel,
            region
        };

        console.log(`Processing image: ${imageData.filename} (${imageData.contentType}`);

        const predictionResponse = (await predictImage(imageData)) as any;
        const prediction = predictionResponse.prediction || predictionResponse;
        const processingTime = Date.now() - startTime;

        console.log('📤 Response structure:', {
            hasPrediction: !!predictionResponse.prediction,
            diseaseName: prediction?.prediction,
            confidence: prediction?.confidence
        });

        // Generate detailed analysis
        const detailedAnalysis = generateDetailedAnalysis(
            prediction,
            environmentalCondition,
            diseaseHistory,
            treatmentAttempted,
            urgencyLevel,
            region
        );

        const analysisFormatted = formatAnalysisReport(detailedAnalysis);

        // Get detailed disease information from database
        const diseaseInfo = getDiseaseInfo(prediction.prediction);

        const result = {
            success: true,
            prediction: {
                ...prediction,
                processingTime: processingTime,
                detailedAnalysisReport: detailedAnalysis,
                detailedAnalysisFormatted: analysisFormatted,
                // Add disease information
                diseaseInfo: diseaseInfo ? {
                    name: prediction.prediction,
                    aliases: diseaseInfo.aliases || [],
                    commonNames: diseaseInfo.commonNames || [],
                    symptoms: diseaseInfo.symptoms || [],
                    causes: diseaseInfo.causes || '',
                    treatment: diseaseInfo.treatment || [],
                    prevention: diseaseInfo.prevention || [],
                    severity: diseaseInfo.severity || 'Unknown',
                    affectedCrops: diseaseInfo.affectedCrops || [],
                    economicImpact: diseaseInfo.economicImpact || ''
                } : null,
                // Ensemble model data
                ensembleData: {
                    finalDisease: ensemblePrediction.finalDisease,
                    finalConfidence: ensemblePrediction.finalConfidence,
                    confidencePercentage: (ensemblePrediction.finalConfidence * 100).toFixed(1) + '%',
                    severity: ensemblePrediction.severity,
                    confidenceLevel: ensemblePrediction.confidenceLevel,
                    unanimousVote: ensemblePrediction.votingDetails.unanimousVote,
                    recommendedTreatment: ensemblePrediction.recommendedTreatment,
                    modelBreakdown: ensemblePrediction.modelBreakdown.map((m: any) => ({
                        modelName: m.modelName,
                        disease: m.disease,
                        confidence: (m.confidence * 100).toFixed(1) + '%',
                        executionTime: m.executionTime + 'ms'
                    })),
                    modelsUsed: 3,
                    modelNames: ['ResNet50', 'MobileNetV2', 'InceptionV3']
                }
            },
            imageInfo: {
                filename: imageData.filename,
                size: image.length,
                contentType: imageData.contentType
            },
            timestamp: new Date().toISOString()
        };

        // Lưu vào database (nếu chưa được lưu trong modelLoader)
        try {
            await databaseService.savePrediction({
                userId: metadata.userId,
                imageFilename: imageData.filename,
                imageSize: image.length,
                contentType: imageData.contentType,
                predictionResult: prediction.prediction,
                confidenceScore: prediction.confidence,
                originalPrediction: prediction.originalPrediction,
                source: prediction.source || 'api',
                modelName: prediction.modelInfo?.name || 'Unknown Model',
                modelVersion: prediction.modelInfo?.version || '1.0.0',
                modelsUsed: prediction.modelInfo?.modelsUsed || 1,
                totalModels: prediction.modelInfo?.totalModels || 1,
                processingTimeMs: processingTime,
                ipAddress: metadata.ipAddress,
                userAgent: metadata.userAgent
            });
        } catch (dbError) {
            console.error('❌ Lỗi lưu database (không ảnh hưởng kết quả):', dbError);
        }

        // Check if request accepts HTML (from form submission)
        if (req.headers.accept?.includes('text/html')) {
            return res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>🌿 Kết Quả Nhận Diện Bệnh Lá Cây</title>
                    <meta charset="UTF-8">
                    <style>
                        body { 
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                            margin: 0; 
                            padding: 20px;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            min-height: 100vh;
                        }
                        .container {
                            max-width: 800px;
                            margin: 0 auto;
                            background: white;
                            border-radius: 20px;
                            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                            overflow: hidden;
                        }
                        .header {
                            background: linear-gradient(45deg, #10b981, #059669);
                            color: white;
                            padding: 30px;
                            text-align: center;
                        }
                        .header h1 {
                            margin: 0;
                            font-size: 2em;
                        }
                        .content {
                            padding: 30px;
                        }
                        .prediction {
                            background: #f0f9ff;
                            padding: 25px;
                            border-radius: 15px;
                            border-left: 5px solid #0284c7;
                            margin: 20px 0;
                        }
                        .prediction-text {
                            font-size: 28px;
                            color: #059669;
                            font-weight: bold;
                            margin-bottom: 10px;
                        }
                        .confidence {
                            font-size: 20px;
                            color: #0284c7;
                            margin-bottom: 15px;
                        }
                        .accuracy-badge {
                            display: inline-block;
                            padding: 8px 16px;
                            border-radius: 20px;
                            color: white;
                            font-weight: bold;
                            ${prediction.confidence >= 0.9 ? 'background: #10b981;' :
                    prediction.confidence >= 0.7 ? 'background: #f59e0b;' : 'background: #ef4444;'}
                        }
                        .info-grid {
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 20px;
                            margin: 25px 0;
                        }
                        .info-card {
                            background: #f8fafc;
                            padding: 20px;
                            border-radius: 10px;
                            border: 1px solid #e2e8f0;
                        }
                        .info-label {
                            font-weight: bold;
                            color: #475569;
                            margin-bottom: 8px;
                        }
                        .info-value {
                            color: #1e293b;
                            font-size: 16px;
                        }
                        .model-info {
                            background: #fef3c7;
                            padding: 20px;
                            border-radius: 10px;
                            margin: 20px 0;
                        }
                        .back-button {
                            display: inline-block;
                            background: linear-gradient(45deg, #4CAF50, #45a049);
                            color: white;
                            padding: 15px 30px;
                            text-decoration: none;
                            border-radius: 50px;
                            transition: transform 0.3s;
                            font-weight: bold;
                            box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
                        }
                        .back-button:hover {
                            transform: translateY(-2px);
                            box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
                        }
                        .details {
                            background: #f1f5f9;
                            padding: 15px;
                            border-radius: 8px;
                            margin-top: 20px;
                            font-family: monospace;
                            font-size: 12px;
                            color: #64748b;
                            max-height: 200px;
                            overflow-y: auto;
                        }
                        @media (max-width: 768px) {
                            .info-grid { grid-template-columns: 1fr; }
                            .prediction-text { font-size: 24px; }
                            .confidence { font-size: 18px; }
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🌿 Kết Quả Nhận Diện Bệnh Lá Cây</h1>
                            <p>Hệ thống AI tiên tiến với độ chính xác cao</p>
                        </div>
                        
                        <div class="content">
                            <div class="prediction">
                                <div class="prediction-text">
                                    📋 Chẩn đoán: ${prediction.prediction}
                                </div>
                                
                                <div class="confidence">
                                    🎯 Độ tin cậy: ${(prediction.confidence * 100).toFixed(1)}%
                                    <span class="accuracy-badge">
                                        ${prediction.confidence >= 0.9 ? '🎉 Rất chính xác' :
                    prediction.confidence >= 0.7 ? '👍 Khá chính xác' : '⚠️ Cần kiểm tra thêm'}
                                    </span>
                                </div>
                                
                                ${(prediction as any).modelInfo?.modelsUsed ? `
                                <div style="margin-top: 15px; color: #6b7280;">
                                    🤖 Sử dụng ${(prediction as any).modelInfo?.modelsUsed}/${(prediction as any).modelInfo?.totalModels} AI models
                                </div>` : ''}
                            </div>
                            
                            <!-- ENSEMBLE MODELS SECTION -->
                            <div style="background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); padding: 20px; border-radius: 15px; margin-top: 20px; border: 2px solid #667eea;">
                                <h3 style="margin-top: 0; color: #667eea; display: flex; align-items: center; gap: 10px;">
                                    🧠 Ensemble Learning - Dự Đoán Từ 3 AI Models
                                </h3>
                                <div style="background: white; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                                    <p style="margin: 0;"><strong>🎯 Chẩn đoán cuối cùng:</strong> <span style="color: #059669; font-size: 18px; font-weight: bold;">${result.prediction.ensembleData.finalDisease}</span></p>
                                    <p style="margin: 8px 0 0 0;"><strong>📊 Độ tin cậy:</strong> <span style="color: #0284c7; font-size: 16px; font-weight: bold;">${result.prediction.ensembleData.confidencePercentage}</span></p>
                                    <p style="margin: 8px 0 0 0;"><strong>⚠️ Mức độ nghiêm trọng:</strong> <span style="color: #dc2626; font-weight: bold;">${result.prediction.ensembleData.severity}</span></p>
                                    <p style="margin: 8px 0 0 0;"><strong>🔍 Độ tin tưởng:</strong> <span style="color: #667eea; font-weight: bold;">${result.prediction.ensembleData.confidenceLevel}</span></p>
                                    <p style="margin: 8px 0 0 0;"><strong>🗳️ Bỏ phiếu thống nhất:</strong> <span style="color: ${result.prediction.ensembleData.unanimousVote ? '#10b981' : '#f97316'}; font-weight: bold;">${result.prediction.ensembleData.unanimousVote ? '✅ Có' : '⚠️ Không (Models không đồng ý)'}</span></p>
                                </div>
                                
                                <h4 style="color: #667eea; margin: 15px 0 10px 0;">📋 Chi tiết dự đoán của từng model - 🗳️ Bỏ phiếu cho kết quả đúng:</h4>
                                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
                                    ' + result.prediction.ensembleData.modelBreakdown.map((model: any, idx: number) => {
                                        return '<div style="background: white; padding: 15px; border-radius: 10px; border-left: 5px solid #667eea; position: relative;">' +
                                            '<div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">' +
                                            '<div>' +
                                            '<p style="margin: 0 0 8px 0;"><strong style="font-size: 16px;">' + model.modelName + '</strong></p>' +
                                            '<p style="margin: 3px 0;"><span style="color: #666;">📊 Chẩn đoán:</span> <strong>' + model.disease + '</strong></p>' +
                                            '<p style="margin: 3px 0;"><span style="color: #666;">📈 Độ tin cậy:</span> <strong>' + model.confidence + '</strong></p>' +
                                            '<p style="margin: 3px 0;"><span style="color: #666;">⏱️ Thời gian:</span> <strong>' + model.executionTime + '</strong></p>' +
                                            '</div>' +
                                            '</div>' +
                                            '<button onclick="window.voteForModel(' + "'" + model.modelName + "'" + ', ' + "'" + model.disease + "'" + ')" style="width: 100%; padding: 10px; margin-top: 12px; background: linear-gradient(45deg, #10b981, #059669); color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; transition: all 0.3s ease;">' +
                                            '✅ Model này ĐÚNG' +
                                            '</button>' +
                                            '</div>';
                                    }).join('') + '
                                </div>
                                
                                <div id="feedbackResult" style="display: none; margin-top: 20px; padding: 15px; background: #f0fdf4; border-left: 4px solid #10b981; border-radius: 8px;"></div>
                                
                                <h4 style="color: #667eea; margin: 20px 0 10px 0;">💊 Khuyến nghị điều trị:</h4>
                                <div style="background: #f1f5f9; padding: 15px; border-radius: 10px; border-left: 4px solid #10b981;">
                                    <p style="margin: 0; line-height: 1.6;">${result.prediction.ensembleData.recommendedTreatment}</p>
                                </div>
                            </div>
                            
                            <div class="info-grid">
                                <div class="info-card">
                                    <div class="info-label">📁 Tên file</div>
                                    <div class="info-value">${imageData.filename}</div>
                                </div>
                                
                                <div class="info-card">
                                    <div class="info-label">📏 Kích thước</div>
                                    <div class="info-value">${(image.length / 1024).toFixed(2)} KB</div>
                                </div>
                                
                                <div class="info-card">
                                    <div class="info-label">⏱️ Thời gian xử lý</div>
                                    <div class="info-value">${processingTime} ms</div>
                                </div>
                                
                                <div class="info-card">
                                    <div class="info-label">🕐 Thời gian</div>
                                    <div class="info-value">${new Date().toLocaleString('vi-VN')}</div>
                                </div>
                            </div>
                            
                            ${(prediction as any).modelInfo ? `
                            <div class="model-info">
                                <h3 style="margin-top: 0; color: #92400e;">🧠 Thông tin AI Model</h3>
                                <p><strong>Tên:</strong> ${(prediction as any).modelInfo.name}</p>
                                <p><strong>Phiên bản:</strong> ${(prediction as any).modelInfo.version || 'N/A'}</p>
                                <p><strong>Nguồn:</strong> ${(prediction as any).source || 'Demo'}</p>
                                ${(prediction as any).modelInfo.modelsUsed ? `<p><strong>Models sử dụng:</strong> ${(prediction as any).modelInfo.modelsUsed}/${(prediction as any).modelInfo.totalModels}</p>` : ''}
                            </div>` : ''}
                            
                            <div style="text-align: center; margin-top: 30px;">
                                <a href="/test-upload" class="back-button">
                                    🔙 Thử ảnh khác
                                </a>
                                <a href="/" class="back-button" style="margin-left: 15px;">
                                    🏠 Trang chủ
                                </a>
                            </div>
                            
                            <div class="details">
                                <strong>Chi tiết kỹ thuật:</strong><br>
                                ${JSON.stringify(result, null, 2)}
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `);
        }

        // Return JSON for API calls
        return res.status(200).json(result);
    } catch (error) {
        const errorTime = Date.now() - startTime;

        // Log error vào database
        try {
            await databaseService.logSystem(
                'ERROR',
                'predictController',
                'Prediction failed',
                error instanceof Error ? error.message : 'Unknown error',
                undefined,
                req.ip
            );
        } catch (logError) {
            console.error('❌ Lỗi log database:', logError);
        }

        console.error('Prediction error:', error);
        return res.status(500).json({
            success: false,
            error: 'An error occurred while processing the image',
            message: error instanceof Error ? error.message : 'Unknown error',
            processingTime: errorTime
        });
    }
};