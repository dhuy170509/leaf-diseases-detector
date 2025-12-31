import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { networkInterfaces } from 'os';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/api.js';
import cropsRoutes from './routes/crops.js';
import weatherRoutes from './routes/weather.js';
import chatbotRoutes from './routes/chatbot.js';
import trainingRoutes from './routes/training.js';
import openaiService from './services/openaiService.js';
import diseaseService from './services/diseaseService.js';
import { initDatabase } from './services/databaseService.js';

// Get directory name (compatible with commonjs)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number.parseInt(process.env.PORT || '8765', 10);

// Function to get local network IP address
function getLocalIP(): string {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    const netInfo = nets[name];
    if (netInfo) {
      for (const net of netInfo) {
        // Skip over non-IPv4 and internal addresses
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
  }
  return 'localhost';
}

// Enable CORS for all routes
app.use(cors());

// Redirect old .html pages to root (before static middleware)
app.use((req, res, next) => {
  if (req.path.endsWith('.html')) {
    return res.redirect('/');
  }
  next();
});

// Serve static files from client build folder
const clientBuildPath = path.join(__dirname, '../../client/build');
app.use(express.static(clientBuildPath));

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Root route for testing
app.get('/', (req, res) => {
  console.log(`🔥 GOT REQUEST TO /${' | Path: ' + req.path}`);
  res.json({
    message: '🌿 API Máy Dò Bệnh Lá Cây',
    version: '1.0.0',
    status: 'đang chạy',
    endpoints: {
      predict: '/api/predict',
      test: '/test-upload',
      diseases: '/api/diseases',
      chat: '/api/chat'
    },
    usage: {
      predict: 'POST /api/predict với file ảnh',
      test: 'GET /test-upload cho form tải lên',
      diseases: 'GET /api/diseases để xem tất cả bệnh',
      search: 'GET /api/diseases/search?q=keyword để tìm kiếm'
    }
  });
});

// Test API quickly (returns NO_MODEL_INSTALLED status)
app.get('/api/test-predict', async (req, res) => {
  try {
    console.log('🧪 Test endpoint hit - no model installed');
    res.json({ success: false, status: 'NO_MODEL_INSTALLED', message: 'No AI model is currently installed.' });
  } catch (error) {
    console.error('❌ Test error:', error);
    res.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Test upload page with chatbot
app.get('/test-upload', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <title>🌿 AI Nhận Diện Bệnh Lá Cây</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <!-- Leaflet CSS -->
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
      <!-- Leaflet JS -->
      <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
      <!-- Windy Plugin -->
      <script src="https://cdnjs.cloudflare.com/ajax/libs/windycom/1.0.0/windycom.min.js"></script>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          margin: 0; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          color: #333;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .main-panel { background: white; border-radius: 15px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .upload-area { border: 3px dashed #4CAF50; padding: 40px; text-align: center; border-radius: 10px; background: #f9f9f9; }
        .upload-area:hover { background: #f0f8ff; border-color: #45a049; }
        button { background: linear-gradient(45deg, #4CAF50, #45a049); color: white; padding: 15px 30px; border: none; border-radius: 25px; font-size: 16px; cursor: pointer; transition: all 0.3s; }
        button:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(76,175,80,0.4); }
        .chatbot { background: white; border-radius: 15px; padding: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); margin-top: 20px; }
        .chat-messages { height: 300px; overflow-y: auto; border: 1px solid #eee; border-radius: 10px; padding: 15px; margin: 15px 0; background: #fafafa; }
        .message { margin: 10px 0; padding: 10px; border-radius: 10px; }
        .bot-message { background: #e3f2fd; text-align: left; }
        .user-message { background: #c8e6c9; text-align: right; }
        .chat-input { display: flex; gap: 10px; }
        .chat-input input { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 20px; }
        .chat-input button { padding: 10px 20px; background: #2196F3; }
        .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .feature { background: #f8f9fa; padding: 20px; border-radius: 10px; text-align: center; border-left: 4px solid #4CAF50; }
        .disease-search { background: white; border-radius: 15px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); margin: 20px 0; }
        .search-box { display: flex; gap: 10px; margin: 20px 0; }
        .search-box input { flex: 1; padding: 15px; border: 2px solid #ddd; border-radius: 25px; font-size: 16px; }
        .search-box button { padding: 15px 30px; background: #2196F3; color: white; border: none; border-radius: 25px; cursor: pointer; }
        .disease-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; margin: 20px 0; }
        .disease-item { background: #f8f9fa; padding: 20px; border-radius: 10px; border-left: 4px solid #FF9800; }
        .disease-item h4 { margin: 0 0 10px 0; color: #FF9800; }
        .disease-item .scientific { font-style: italic; color: #666; font-size: 14px; }
        .disease-item .description { margin: 10px 0; }
        .external-links { margin: 10px 0; }
        .external-links a { display: inline-block; margin: 5px 10px 5px 0; padding: 8px 15px; background: #4CAF50; color: white; text-decoration: none; border-radius: 15px; font-size: 12px; }
        .external-links a:hover { background: #45a049; }
        
        /* Leaflet map styles */
        #weatherMap { 
          height: 500px; 
          border-radius: 15px; 
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          margin: 20px 0;
        }
        .leaflet-popup-content { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .weather-info { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
          color: white; 
          padding: 20px; 
          border-radius: 15px; 
          margin: 20px 0;
        }
        .weather-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
          margin: 15px 0;
        }
        .weather-card {
          background: rgba(255,255,255,0.1);
          padding: 15px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.3);
          text-align: center;
          backdrop-filter: blur(10px);
        }
        .weather-card h4 {
          margin: 0 0 10px 0;
          font-size: 14px;
          opacity: 0.9;
        }
        .weather-card .value {
          font-size: 22px;
          font-weight: bold;
        }
        .location-selector {
          background: white;
          padding: 20px;
          border-radius: 15px;
          margin: 20px 0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .location-selector input {
          width: 100%;
          padding: 12px;
          border: 2px solid #ddd;
          border-radius: 8px;
          margin: 10px 0;
          font-size: 14px;
        }
        .location-selector button {
          background: linear-gradient(45deg, #FF6B6B, #ee5a6f);
          margin: 10px 5px 10px 0;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 20px;
          cursor: pointer;
          font-weight: bold;
        }
        .location-selector button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255,107,107,0.4);
        }
        .forecast-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin: 20px 0;
        }
        .forecast-card {
          background: white;
          padding: 15px;
          border-radius: 10px;
          border-left: 4px solid #FF9800;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .forecast-card h4 {
          margin: 0 0 10px 0;
          color: #FF9800;
        }
        .forecast-card .weather-data {
          font-size: 12px;
          line-height: 1.8;
        }
        
        /* Enhanced UI Customizations */
        .theme-toggle {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 999;
          background: white;
          border-radius: 50px;
          padding: 10px 15px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          cursor: pointer;
          display: flex;
          gap: 10px;
          align-items: center;
          transition: all 0.3s ease;
        }
        .theme-toggle:hover {
          box-shadow: 0 6px 20px rgba(0,0,0,0.2);
          transform: scale(1.05);
        }
        .theme-toggle button {
          background: transparent;
          border: 2px solid #ddd;
          padding: 8px 12px;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 16px;
        }
        .theme-toggle button:hover {
          border-color: #667eea;
          background: #f0f0f0;
        }
        .theme-toggle button.active {
          background: #667eea;
          color: white;
          border-color: #667eea;
        }
        
        /* Dark mode */
        body.dark-theme {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          color: #f0f0f0;
        }
        body.dark-theme .container {
          color: #f0f0f0;
        }
        body.dark-theme .main-panel,
        body.dark-theme .chatbot,
        body.dark-theme .disease-search,
        body.dark-theme .location-selector {
          background: #0f3460;
          color: #f0f0f0;
        }
        body.dark-theme .upload-area {
          background: #1a1a2e;
          border-color: #667eea;
        }
        body.dark-theme button {
          color: white;
        }
        body.dark-theme .disease-item,
        body.dark-theme .forecast-card {
          background: #16213e;
          color: #f0f0f0;
        }
        
        /* Glassmorphism cards */
        .glass-card {
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 15px;
          padding: 20px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        }
        
        /* Animated gradient backgrounds */
        .gradient-text {
          background: linear-gradient(45deg, #667eea, #764ba2, #f093fb, #667eea);
          background-size: 300% 300%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradientShift 3s ease infinite;
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        /* Floating animations */
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .float-animation {
          animation: float 3s ease-in-out infinite;
        }
        
        /* Pulse effect */
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .pulse {
          animation: pulse 2s ease-in-out infinite;
        }
        
        /* Shimmer loading effect */
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .shimmer-loading {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 1000px 100%;
          animation: shimmer 2s infinite;
          border-radius: 10px;
          height: 20px;
          margin: 10px 0;
        }
        
        /* Neumorphism buttons */
        .neumorphic-btn {
          background: linear-gradient(145deg, #f0f0f0, #ffffff);
          border: 1px solid rgba(0,0,0,0.1);
          box-shadow: 0 4px 15px rgba(0,0,0,0.2), inset 0 -2px 5px rgba(0,0,0,0.1);
          border-radius: 20px;
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .neumorphic-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.3), inset 0 -2px 5px rgba(0,0,0,0.1);
        }
        .neumorphic-btn:active {
          transform: translateY(0);
          box-shadow: 0 2px 5px rgba(0,0,0,0.2), inset 0 2px 5px rgba(0,0,0,0.2);
        }
        
        /* Tooltip styling */
        .tooltip {
          position: relative;
          display: inline-block;
          cursor: help;
          border-bottom: 1px dotted #667eea;
        }
        .tooltip .tooltiptext {
          visibility: hidden;
          width: 200px;
          background-color: #333;
          color: #fff;
          text-align: center;
          border-radius: 8px;
          padding: 10px;
          position: absolute;
          z-index: 1;
          bottom: 125%;
          left: 50%;
          margin-left: -100px;
          opacity: 0;
          transition: opacity 0.3s;
          font-size: 12px;
          white-space: normal;
        }
        .tooltip .tooltiptext::after {
          content: "";
          position: absolute;
          top: 100%;
          left: 50%;
          margin-left: -5px;
          border-width: 5px;
          border-style: solid;
          border-color: #333 transparent transparent transparent;
        }
        .tooltip:hover .tooltiptext {
          visibility: visible;
          opacity: 1;
        }
        
        /* Tabs styling */
        .tabs-container {
          display: flex;
          gap: 10px;
          margin: 20px 0;
          border-bottom: 2px solid #eee;
          overflow-x: auto;
        }
        .tab-button {
          padding: 12px 20px;
          background: transparent;
          border: none;
          border-bottom: 3px solid transparent;
          cursor: pointer;
          font-weight: 600;
          color: #666;
          transition: all 0.3s ease;
          white-space: nowrap;
        }
        .tab-button:hover {
          color: #667eea;
          border-bottom-color: #667eea;
        }
        .tab-button.active {
          color: #667eea;
          border-bottom-color: #667eea;
        }
        .tab-content {
          display: none;
          animation: fadeIn 0.3s ease-in-out;
        }
        .tab-content.active {
          display: block;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        /* Progress bar */
        .progress-bar {
          width: 100%;
          height: 8px;
          background: #eee;
          border-radius: 10px;
          overflow: hidden;
          margin: 10px 0;
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea, #764ba2);
          width: 0%;
          transition: width 0.5s ease;
          border-radius: 10px;
        }
        
        /* Modal/Dialog */
        .modal {
          display: none;
          position: fixed;
          z-index: 2000;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0,0,0,0.5);
          animation: fadeIn 0.3s ease-in-out;
        }
        .modal-content {
          background-color: white;
          margin: 10% auto;
          padding: 30px;
          border-radius: 20px;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
          animation: slideDown 0.3s ease-out;
        }
        @keyframes slideDown {
          from { transform: translateY(-50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .close-btn {
          color: #aaa;
          float: right;
          font-size: 28px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .close-btn:hover,
        .close-btn:focus {
          color: #667eea;
          transform: scale(1.2);
        }
        
        /* Accordion */
        .accordion-item {
          border: 1px solid #eee;
          border-radius: 10px;
          margin: 10px 0;
          overflow: hidden;
        }
        .accordion-header {
          padding: 15px;
          background: #f8f9fa;
          cursor: pointer;
          font-weight: 600;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.3s ease;
        }
        .accordion-header:hover {
          background: #e8f0ff;
          color: #667eea;
        }
        .accordion-header.active {
          background: #667eea;
          color: white;
        }
        .accordion-content {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease;
          padding: 0 15px;
        }
        .accordion-content.active {
          max-height: 500px;
          padding: 15px;
          background: #f8f9fa;
        }
        
        /* Badge */
        .badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          margin: 5px;
        }
        .badge-success {
          background: #d4edda;
          color: #155724;
        }
        .badge-warning {
          background: #fff3cd;
          color: #856404;
        }
        .badge-danger {
          background: #f8d7da;
          color: #721c24;
        }
        .badge-info {
          background: #d1ecf1;
          color: #0c5460;
        }
        
        /* Hover card effect */
        .hover-card {
          transition: all 0.3s ease;
          cursor: pointer;
        }
        .hover-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.15);
        }
        
        /* Loading spinner */
        .spinner {
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Camera and capture styles */
        .camera-container { position: relative; display: inline-block; }
        .capture-overlay { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.7); color: white; padding: 10px; border-radius: 5px; font-size: 14px; display: none; }
        .result-card { animation: slideIn 0.3s ease-out; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        
        /* Plant part selector styles */
        input[type="radio"]:checked + span { font-weight: bold; }
        .plant-part-label { transition: all 0.2s ease; }
        .plant-part-label:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
        
        /* Button animations */
        button { transition: all 0.2s ease; }
        button:hover { transform: translateY(-1px); }
        button:active { transform: translateY(0); }
        
        /* Mobile optimizations */
        @media (max-width: 768px) { 
          .container { padding: 10px; } 
          .main-panel, .chatbot, .disease-search { padding: 20px; }
          .plant-parts { grid-template-columns: repeat(2, 1fr); }
          video { width: 100%; max-width: 300px; }
        }
        
        @media (max-width: 480px) {
          .plant-parts { grid-template-columns: 1fr; }
          .features { grid-template-columns: 1fr; }
        }
      </style>
    </head>
    <body>
      <!-- Theme Toggle -->
      <div class="theme-toggle">
        <span>🌓 Chế độ:</span>
        <button class="active" id="lightThemeBtn" onclick="window.setTheme('light')">☀️ Sáng</button>
        <button id="darkThemeBtn" onclick="window.setTheme('dark')">🌙 Tối</button>
      </div>
      
      <div class="container">
        <!-- Weather & Location Section -->
        <div class="main-panel">
          <h1 class="gradient-text">🌍 Bản Đồ Thời Tiết & Vị Trí Cao Cấp</h1>
          <p style="color: #666; margin-bottom: 20px;">🌤️ Xem thời tiết tại vị trí của bạn và dự báo thích hợp cho sức khỏe cây trồng</p>
          
          <!-- Tabs -->
          <div class="tabs-container">
            <button class="tab-button active" onclick="window.switchTab('location')">📍 Vị Trí</button>
            <button class="tab-button" onclick="window.switchTab('weather')">🌤️ Thời Tiết</button>
            <button class="tab-button" onclick="window.switchTab('forecast')">📅 Dự Báo</button>
            <button class="tab-button" onclick="window.switchTab('risk')">⚠️ Đánh Giá Rủi Ro</button>
          </div>
          
          <!-- Tab 1: Location -->
          <div id="location-tab" class="tab-content active">
            <div class="location-selector">
              <h3>📍 Chọn Vị Trí Hoặc Xác Định Tự Động</h3>
              <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button class="neumorphic-btn" onclick="window.autoDetectLocation()" style="background: linear-gradient(145deg, #4CAF50, #45a049); color: white; box-shadow: 0 4px 15px rgba(76,175,80,0.3), inset 0 -2px 5px rgba(0,0,0,0.1);">📍 Xác Định Tự Động</button>
                <button class="neumorphic-btn" onclick="window.showMapSearch()" style="background: linear-gradient(145deg, #2196F3, #0b7dda); color: white; box-shadow: 0 4px 15px rgba(33,150,243,0.3), inset 0 -2px 5px rgba(0,0,0,0.1);">🔍 Tìm Kiếm</button>
                <button class="neumorphic-btn" onclick="window.useDefaultLocation()" style="background: linear-gradient(145deg, #FF9800, #e68900); color: white; box-shadow: 0 4px 15px rgba(255,152,0,0.3), inset 0 -2px 5px rgba(0,0,0,0.1);">📌 Mặc Định (Hà Nội)</button>
              </div>
              
              <div style="margin-top: 20px;">
                <h4>📐 Nhập Tọa Độ Hoặc Cho Phép Vị Trí</h4>
                <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 15px;">
                  <button class="neumorphic-btn" onclick="window.requestBrowserLocation()" style="background: linear-gradient(145deg, #e91e63, #c2185b); color: white; box-shadow: 0 4px 15px rgba(233,30,99,0.3), inset 0 -2px 5px rgba(0,0,0,0.1); flex: 1; min-width: 150px;">📱 Xin Quyền Vị Trí</button>
                  <button class="neumorphic-btn" onclick="window.searchLocationByName()" style="background: linear-gradient(145deg, #9c27b0, #7b1fa2); color: white; box-shadow: 0 4px 15px rgba(156,39,176,0.3), inset 0 -2px 5px rgba(0,0,0,0.1); flex: 1; min-width: 150px;">🔎 Tìm Kiếm Địa Điểm</button>
                </div>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                  <input type="number" id="latInput" placeholder="Latitude (-90 đến 90)" step="0.0001" style="flex: 1; min-width: 150px; padding: 12px; border: 2px solid #ddd; border-radius: 8px; transition: all 0.3s ease;" onkeypress="if(event.key==='Enter') window.loadWeatherByCoords()">
                  <input type="number" id="lonInput" placeholder="Longitude (-180 đến 180)" step="0.0001" style="flex: 1; min-width: 150px; padding: 12px; border: 2px solid #ddd; border-radius: 8px; transition: all 0.3s ease;" onkeypress="if(event.key==='Enter') window.loadWeatherByCoords()">
                  <button class="neumorphic-btn" onclick="window.loadWeatherByCoords()" style="padding: 12px 25px;">🔄 Tải Dữ Liệu</button>
                </div>
              </div>
              
              <div id="locationInfo" style="margin-top: 15px; padding: 15px; background: linear-gradient(135deg, #f0f8ff, #e6f3ff); border-radius: 10px; display: none; border-left: 4px solid #2196F3;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span style="font-size: 20px;">📍</span>
                  <div>
                    <strong id="locationName" style="color: #2196F3; font-size: 16px;">Vị trí: Đang tải...</strong>
                    <p id="locationCoords" style="margin: 5px 0 0 0; color: #666; font-size: 12px;"></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Tab 2: Weather -->
          <div id="weather-tab" class="tab-content">
            <!-- Leaflet Map -->
            <div id="weatherMap" style="height: 500px; border-radius: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); margin: 20px 0;"></div>
            
            <!-- Weather Info Cards -->
            <div id="weatherInfo" style="display: none;">
              <h3 style="margin-top: 0;">🌤️ Điều Kiện Thời Tiết Hiện Tại</h3>
              <div class="weather-grid">
                <div class="weather-card hover-card">
                  <h4>🌡️ Nhiệt Độ</h4>
                  <div class="value" id="tempValue" style="font-size: 28px;">--°C</div>
                  <p style="margin: 5px 0 0 0; font-size: 11px; opacity: 0.8;" id="tempRange"></p>
                </div>
                <div class="weather-card hover-card">
                  <h4>💧 Độ Ẩm</h4>
                  <div class="value" id="humidityValue" style="font-size: 28px;">--%</div>
                  <div class="progress-bar" style="margin: 5px 0 0 0;">
                    <div class="progress-fill" id="humidityBar"></div>
                  </div>
                </div>
                <div class="weather-card hover-card">
                  <h4>💨 Gió</h4>
                  <div class="value" id="windValue" style="font-size: 28px;">-- m/s</div>
                  <p style="margin: 5px 0 0 0; font-size: 11px; opacity: 0.8;" id="windDesc"></p>
                </div>
                <div class="weather-card hover-card">
                  <h4>🌧️ Xác Suất Mưa</h4>
                  <div class="value" id="rainValue" style="font-size: 28px;">--%</div>
                  <div class="progress-bar" style="margin: 5px 0 0 0;">
                    <div class="progress-fill" id="rainBar" style="background: linear-gradient(90deg, #3b82f6, #60a5fa);"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Tab 3: Forecast -->
          <div id="forecast-tab" class="tab-content">
            <div id="forecastSection" style="display: none;">
              <h3 style="margin-top: 0;">📅 Dự Báo Thời Tiết 7 Ngày</h3>
              <div class="forecast-grid" id="forecastGrid">
                <!-- Forecast cards will be inserted here -->
              </div>
            </div>
          </div>
          
          <!-- Tab 4: Risk Assessment -->
          <div id="risk-tab" class="tab-content">
            <div id="riskSection" style="display: none;">
              <h3 style="margin-top: 0;">⚠️ Đánh Giá Rủi Ro Bệnh</h3>
              <p style="color: #666; margin: 10px 0;">Dựa trên dữ liệu thời tiết để tính toán mức độ rủi ro bệnh cho cây trồng</p>
              
              <div style="margin: 20px 0;">
                <h4>📊 Bảng Rủi Ro</h4>
                <div id="riskChart" style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
                  <div class="shimmer-loading"></div>
                </div>
              </div>
              
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin: 20px 0;">
                <div class="glass-card">
                  <h4>🍄 Bệnh Nấm (Fungal)</h4>
                  <p style="font-size: 12px; margin: 10px 0;">Xuất hiện khi: Độ ẩm cao, nhiệt độ 20-28°C</p>
                  <div class="progress-bar">
                    <div class="progress-fill" id="fungalRisk" style="width: 0%; background: linear-gradient(90deg, #8b5cf6, #a78bfa);"></div>
                  </div>
                  <p id="fungalRiskText" style="font-size: 12px; margin: 5px 0;">Thấp</p>
                </div>
                <div class="glass-card">
                  <h4>🦠 Bệnh Khuẩn (Bacterial)</h4>
                  <p style="font-size: 12px; margin: 10px 0;">Xuất hiện khi: Lạnh, ẩm, mưa kéo dài</p>
                  <div class="progress-bar">
                    <div class="progress-fill" id="bacterialRisk" style="width: 0%; background: linear-gradient(90deg, #ef4444, #f87171);"></div>
                  </div>
                  <p id="bacterialRiskText" style="font-size: 12px; margin: 5px 0;">Thấp</p>
                </div>
                <div class="glass-card">
                  <h4>🦟 Sâu Bệnh (Insect)</h4>
                  <p style="font-size: 12px; margin: 10px 0;">Xuất hiện khi: Nóng, khô, mưa ít</p>
                  <div class="progress-bar">
                    <div class="progress-fill" id="insectRisk" style="width: 0%; background: linear-gradient(90deg, #f59e0b, #fbbf24);"></div>
                  </div>
                  <p id="insectRiskText" style="font-size: 12px; margin: 5px 0;">Thấp</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="main-panel">
          <h1>🌿 AI Nhận Diện Bệnh Lá Cây</h1>
          
          <div class="features">
            <div class="feature">
              <h3>🔍 Nhận Diện Thông Minh</h3>
              <p>Phân tích hơn 30+ loại bệnh cây bằng AI</p>
            </div>
            <div class="feature">
              <h3>⚡ Kết Quả Tức Thì</h3>
              <p>Có dự đoán trong vài mili giây</p>
            </div>
            <div class="feature">
              <h3>📊 Điểm Tin Cậy</h3>
              <p>Xem mức độ tin cậy của AI</p>
            </div>
          </div>
          
          <div class="upload-area">
            <h2>🌿 Phân Tích Toàn Diện Cây Trồng</h2>
            <p style="margin-bottom: 20px; color: #666;">Chọn bộ phận cây cần kiểm tra:</p>
            
            <div class="plant-parts" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin: 20px 0;">
              <label style="text-align: center; cursor: pointer; padding: 10px; border: 2px solid #ddd; border-radius: 10px; background: #f9f9f9;">
                <input type="radio" name="plantPart" value="leaves" checked style="margin-right: 5px;">
                🍃 Lá
              </label>
              <label style="text-align: center; cursor: pointer; padding: 10px; border: 2px solid #ddd; border-radius: 10px; background: #f9f9f9;">
                <input type="radio" name="plantPart" value="stem" style="margin-right: 5px;">
                🌱 Thân/Cành
              </label>
              <label style="text-align: center; cursor: pointer; padding: 10px; border: 2px solid #ddd; border-radius: 10px; background: #f9f9f9;">
                <input type="radio" name="plantPart" value="root" style="margin-right: 5px;">
                🌳 Rễ
              </label>
              <label style="text-align: center; cursor: pointer; padding: 10px; border: 2px solid #ddd; border-radius: 10px; background: #f9f9f9;">
                <input type="radio" name="plantPart" value="flower" style="margin-right: 5px;">
                🌸 Hoa
              </label>
              <label style="text-align: center; cursor: pointer; padding: 10px; border: 2px solid #ddd; border-radius: 10px; background: #f9f9f9;">
                <input type="radio" name="plantPart" value="fruit" style="margin-right: 5px;">
                🍎 Quả
              </label>
              <label style="text-align: center; cursor: pointer; padding: 10px; border: 2px solid #ddd; border-radius: 10px; background: #f9f9f9;">
                <input type="radio" name="plantPart" value="whole" style="margin-right: 5px;">
                🌿 Toàn bộ
              </label>
            </div>
            
            <div style="display: flex; gap: 20px; align-items: flex-start; justify-content: center; margin: 20px 0; flex-wrap: wrap;">
              <div style="text-align: center; min-width: 320px;">
                <h3>📱 Chụp Ảnh Trực Tiếp</h3>
                <div id="cameraSupport" style="margin: 10px 0; font-size: 12px; color: #666;"></div>
                <button type="button" id="captureBtn" style="background: #FF6B6B; margin-bottom: 10px; font-size: 16px; padding: 12px 20px;">📸 Kiểm Tra Camera</button>
                <br>
                <video id="video" style="display: none; width: 320px; height: 240px; border: 3px solid #4CAF50; border-radius: 15px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);"></video>
                <canvas id="canvas" style="display: none;"></canvas>
                <div id="captureControls" style="display: none; margin: 10px 0; gap: 10px;">
                  <button id="takePictureBtn" style="background: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 25px; font-size: 14px; cursor: pointer;">📷 Chụp Ngay</button>
                  <button id="switchCameraBtn" style="background: #2196F3; color: white; border: none; padding: 10px 20px; border-radius: 25px; font-size: 14px; cursor: pointer;">🔄 Đổi Camera</button>
                </div>
                <div id="capturedImage" style="margin-top: 15px; min-height: 50px;"></div>
                
                <!-- Camera troubleshooting tips -->
                <div style="margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 8px; font-size: 12px; text-align: left;">
                  <strong>💡 Mẹo sử dụng camera:</strong><br>
                  • Cho phép truy cập camera khi trình duyệt hỏi<br>
                  • Camera hoạt động tốt nhất trên HTTPS<br>
                  • Thử làm mới trang nếu gặp lỗi<br>
                  • Trên mobile: sử dụng camera sau để chụp rõ hơn
                </div>
              </div>
              
              <div style="text-align: center;">
                <h3>📁 Tải Ảnh Từ Thiết Bị</h3>
                <form action="/api/predict" method="post" enctype="multipart/form-data" id="uploadForm">
                  <input type="file" name="image" accept="image/*" id="fileInput" style="margin: 20px 0;">
                  <input type="hidden" name="plantPart" id="hiddenPlantPart" value="leaves">
                  <br>
                  <button type="submit">🔍 Phân Tích Ngay</button>
                </form>
              </div>
            </div>
          </div>
          
          <div style="margin-top: 20px; font-size: 14px; color: #666;">
            <p><strong>Hỗ trợ:</strong> Ảnh JPG, PNG, WEBP tối đa 10MB</p>
            <p><strong>Kết quả tốt nhất:</strong> Ảnh rõ nét của từng lá với ánh sáng tốt</p>
          </div>
        </div>
        
        <div class="disease-search">
          <h2>📚 Cơ Sở Dữ Liệu Bệnh Cây Trồng</h2>
          <p>Tìm hiểu về các loại bệnh phổ biến trên cây trồng và cách điều trị</p>
          
          <div class="search-container">
            <input type="text" id="diseaseSearchInput" placeholder="Tìm kiếm bệnh (VD: đốm lá, cháy lá, thối rễ...)">
            <button onclick="window.searchDiseases()">🔍 Tìm Kiếm</button>
          </div>
          
          <div id="diseaseResults" class="disease-list">
            <!-- Disease results will be loaded here -->
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            <button onclick="window.loadAllDiseases()" style="background: #FF9800;">📖 Xem Tất Cả Bệnh</button>
          </div>
        </div>
        
        <div class="chatbot">
          <h2>🤖 Bác Sĩ Cây Trồng AI</h2>
          <div class="chat-messages" id="chatMessages">
            <div class="message bot-message">
              <strong>🌱 Bác Sĩ Cây:</strong> Xin chào! Tôi ở đây để giúp bạn về các vấn đề bệnh cây. Tải lên ảnh hoặc hỏi tôi bất kỳ điều gì về sức khỏe cây trồng!
            </div>
          </div>
          <div class="chat-input">
            <input type="text" id="chatInput" placeholder="Hỏi về bệnh cây trồng..." onkeypress="if(event.key==='Enter') window.sendMessage()">
            <button onclick="window.sendMessage()">Gửi</button>
          </div>
          
          <div style="margin-top: 15px;">
            <h4>💡 Câu Hỏi Nhanh:</h4>
            <button onclick="window.testJS()" style="font-size: 12px; padding: 5px 10px; margin: 2px; background: #ff5722; color: white;">🧪 Test JS</button>
            <button onclick="window.askQuestion('Nguyên nhân đốm lá?')" style="font-size: 12px; padding: 5px 10px; margin: 2px;">Đốm lá?</button>
            <button onclick="window.askQuestion('Cách phòng bệnh cây?')" style="font-size: 12px; padding: 5px 10px; margin: 2px;">Phòng bệnh?</button>
            <button onclick="window.askQuestion('Khi nào tưới nước?')" style="font-size: 12px; padding: 5px 10px; margin: 2px;">Tưới nước?</button>
          </div>
        </div>
      </div>

      <script>
        // ========== THEME MANAGEMENT ==========
        window.setTheme = function(theme) {
          document.body.classList.remove('dark-theme');
          document.getElementById('lightThemeBtn').classList.remove('active');
          document.getElementById('darkThemeBtn').classList.remove('active');
          
          if (theme === 'dark') {
            document.body.classList.add('dark-theme');
            document.getElementById('darkThemeBtn').classList.add('active');
          } else {
            document.getElementById('lightThemeBtn').classList.add('active');
          }
          
          localStorage.setItem('theme', theme);
        };
        
        // Load saved theme
        window.addEventListener('load', function() {
          const savedTheme = localStorage.getItem('theme') || 'light';
          window.setTheme(savedTheme);
        });
        
        // ========== TAB MANAGEMENT ==========
        window.switchTab = function(tabName) {
          // Hide all tabs
          document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
          });
          document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
          });
          
          // Show selected tab
          document.getElementById(tabName + '-tab').classList.add('active');
          event.target.classList.add('active');
          
          // Resize map if weather tab
          if (tabName === 'weather' && window.map) {
            setTimeout(() => window.map.invalidateSize(), 100);
          }
        };
        
        // ========== LEAFLET & WEATHER MAP ==========
        let map = null;
        let currentMarker = null;
        let currentLocation = { lat: 21.0285, lon: 105.8542, name: 'Hà Nội, Việt Nam' };
        let windyPlugin = null;
        
        function initMap() {
          // Initialize Leaflet map
          map = L.map('weatherMap').setView([currentLocation.lat, currentLocation.lon], 10);
          
          // Add OSM tiles
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
          }).addTo(map);
          
          // Add initial marker
          updateMapMarker();
          
          // Try to add Windy layer if available
          setTimeout(loadWindyLayer, 500);
        }
        
        function updateMapMarker() {
          if (currentMarker) {
            map.removeLayer(currentMarker);
          }
          
          const marker = L.circleMarker([currentLocation.lat, currentLocation.lon], {
            radius: 12,
            fillColor: '#FF6B6B',
            color: 'white',
            weight: 3,
            opacity: 1,
            fillOpacity: 0.8
          }).addTo(map);
          
          marker.bindPopup(\`
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 10px;">
              <h4 style="margin: 0 0 10px 0; color: #FF6B6B;">📍 \${currentLocation.name}</h4>
              <p style="margin: 5px 0;"><strong>Vĩ độ:</strong> \${currentLocation.lat.toFixed(4)}</p>
              <p style="margin: 5px 0;"><strong>Kinh độ:</strong> \${currentLocation.lon.toFixed(4)}</p>
              <button onclick="window.loadWeatherForMarker()" style="margin-top: 10px; background: #FF6B6B; color: white; padding: 8px 15px; border: none; border-radius: 15px; cursor: pointer; font-weight: bold;">🔄 Tải Dữ Liệu</button>
            </div>
          \`).openPopup();
          
          currentMarker = marker;
          map.setView([currentLocation.lat, currentLocation.lon], 10);
        }
        
        function loadWindyLayer() {
          // Load Windy weather layer overlay
          if (typeof windyAPI !== 'undefined') {
            try {
              windyAPI.init({
                key: 'YOUR_WINDY_KEY',
                lat: currentLocation.lat,
                lon: currentLocation.lon,
                zoom: 10,
                level: '850h'
              }, function(error) {
                if (error) {
                  console.warn('Windy layer not available:', error);
                } else {
                  console.log('✅ Windy layer loaded');
                }
              });
            } catch (e) {
              console.warn('Windy initialization failed:', e);
            }
          }
        }
        
        window.autoDetectLocation = async function() {
          console.log('🔍 Auto-detecting location from IP...');
          document.getElementById('locationName').innerHTML = '<span class="spinner"></span> Đang xác định vị trí...';
          try {
            const res = await fetch('/api/weather/detect');
            const data = await res.json();
            
            if (data && data.location) {
              currentLocation = data.location;
              document.getElementById('latInput').value = currentLocation.lat.toFixed(4);
              document.getElementById('lonInput').value = currentLocation.lon.toFixed(4);
              document.getElementById('locationName').innerHTML = '📍 <strong>' + currentLocation.name + '</strong>';
              document.getElementById('locationCoords').innerHTML = '🌐 Vĩ độ: ' + currentLocation.lat.toFixed(4) + ' | Kinh độ: ' + currentLocation.lon.toFixed(4);
              document.getElementById('locationInfo').style.display = 'block';
              
              if (map) {
                updateMapMarker();
              }
              
              await window.loadWeatherByCoords();
            }
          } catch (error) {
            console.error('❌ Auto-detect failed:', error);
            document.getElementById('locationName').innerHTML = '❌ Không thể xác định vị trí';
            alert('❌ Không thể xác định vị trí tự động. Vui lòng nhập tọa độ hoặc chọn vị trí mặc định.');
          }
        };
        
        window.useDefaultLocation = function() {
          currentLocation = { lat: 21.0285, lon: 105.8542, name: 'Hà Nội, Việt Nam' };
          document.getElementById('latInput').value = currentLocation.lat.toFixed(4);
          document.getElementById('lonInput').value = currentLocation.lon.toFixed(4);
          document.getElementById('locationName').innerHTML = '📍 <strong>' + currentLocation.name + '</strong> (Mặc định)';
          document.getElementById('locationCoords').innerHTML = '🌐 Vĩ độ: ' + currentLocation.lat.toFixed(4) + ' | Kinh độ: ' + currentLocation.lon.toFixed(4);
          document.getElementById('locationInfo').style.display = 'block';
          
          if (map) {
            updateMapMarker();
          }
          
          window.loadWeatherByCoords();
        };
        
        window.requestBrowserLocation = function() {
          if (!navigator.geolocation) {
            alert('❌ Trình duyệt này không hỗ trợ geolocation');
            return;
          }
          
          console.log('📍 Requesting browser geolocation...');
          document.getElementById('locationName').innerHTML = '<span class="spinner"></span> Đang xin quyền vị trí...';
          
          navigator.geolocation.getCurrentPosition(
            function(position) {
              const lat = position.coords.latitude;
              const lon = position.coords.longitude;
              const accuracy = position.coords.accuracy;
              
              console.log('✅ Location acquired: ' + lat + ', ' + lon + ' (accuracy: ' + accuracy + 'm)');
              
              currentLocation = { lat, lon, name: 'Vị trí của bạn (Độ chính xác: ±' + Math.round(accuracy) + 'm)' };
              document.getElementById('latInput').value = lat.toFixed(4);
              document.getElementById('lonInput').value = lon.toFixed(4);
              document.getElementById('locationName').innerHTML = '📍 <strong>' + currentLocation.name + '</strong>';
              document.getElementById('locationCoords').innerHTML = '🌐 Vĩ độ: ' + lat.toFixed(4) + ' | Kinh độ: ' + lon.toFixed(4);
              document.getElementById('locationInfo').style.display = 'block';
              
              if (map) {
                updateMapMarker();
              }
              
              window.loadWeatherByCoords();
            },
            function(error) {
              console.error('❌ Geolocation error:', error.message);
              let errorMsg = '';
              
              switch(error.code) {
                case error.PERMISSION_DENIED:
                  errorMsg = '❌ Bạn đã từ chối quyền truy cập vị trí.\\n\\nĐể bật lại:\\n1. Nhấp vào 🔒 trong thanh địa chỉ\\n2. Chọn "Vị trí" → "Cho phép"\\n3. Làm mới trang';
                  break;
                case error.POSITION_UNAVAILABLE:
                  errorMsg = '❌ Không thể xác định vị trí của bạn.\\n\\nThử:\\n- Bật định vị GPS\\n- Kiểm tra kết nối mạng\\n- Chuyển sang mạng WiFi';
                  break;
                case error.TIMEOUT:
                  errorMsg = '❌ Yêu cầu vị trí hết thời gian chờ.\\n\\nVui lòng thử lại.';
                  break;
                default:
                  errorMsg = '❌ Lỗi: ' + error.message;
              }
              
              alert(errorMsg);
              document.getElementById('locationName').innerHTML = '❌ Không thể xác định vị trí';
              
              // Fallback to auto-detect
              console.log('Falling back to IP geolocation...');
              window.autoDetectLocation();
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            }
          );
        };
        
        window.searchLocationByName = async function() {
          const cityName = prompt('Nhập tên thành phố hoặc địa điểm:\\n\\nVD: Hà Nội, TP.HCM, Đà Nẵng, Sapa...');
          if (!cityName) return;
          
          console.log('🔍 Searching for location:', cityName);
          document.getElementById('locationName').innerHTML = '<span class="spinner"></span> Đang tìm kiếm "' + cityName + '"...';
          
          try {
            // Use Nominatim (OpenStreetMap) geocoding API
            const url = 'https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(cityName) + '&format=json&limit=5';
            
            const res = await fetch(url, { timeout: 5000 });
            const results = await res.json();
            
            if (!results || results.length === 0) {
              alert('❌ Không tìm thấy địa điểm "' + cityName + '"');
              document.getElementById('locationName').innerHTML = '❌ Không tìm thấy địa điểm';
              return;
            }
            
            // If only one result, use it directly
            if (results.length === 1) {
              const result = results[0];
              window.applySearchLocation(result);
              return;
            }
            
            // If multiple results, let user choose
            let options = 'Tìm thấy ' + results.length + ' kết quả. Chọn một:\\n\\n';
            results.forEach((r, idx) => {
              options += (idx + 1) + '. ' + (r.name || r.display_name).substring(0, 60) + '\\n';
            });
            options += '\\nNhập số (1-' + results.length + '):';
            
            const choice = prompt(options);
            if (!choice) return;
            
            const idx = parseInt(choice) - 1;
            if (idx < 0 || idx >= results.length) {
              alert('❌ Lựa chọn không hợp lệ');
              return;
            }
            
            window.applySearchLocation(results[idx]);
          } catch (error) {
            console.error('❌ Search error:', error);
            alert('❌ Lỗi tìm kiếm địa điểm. Vui lòng thử lại hoặc nhập tọa độ trực tiếp.');
            document.getElementById('locationName').innerHTML = '❌ Tìm kiếm không thành công';
          }
        };
        
        window.applySearchLocation = function(result) {
          const lat = parseFloat(result.lat);
          const lon = parseFloat(result.lon);
          const displayName = (result.name || result.display_name || '').substring(0, 80);
          
          currentLocation = { lat, lon, name: displayName };
          document.getElementById('latInput').value = lat.toFixed(4);
          document.getElementById('lonInput').value = lon.toFixed(4);
          document.getElementById('locationName').innerHTML = '📍 <strong>' + displayName + '</strong>';
          document.getElementById('locationCoords').innerHTML = '🌐 Vĩ độ: ' + lat.toFixed(4) + ' | Kinh độ: ' + lon.toFixed(4);
          document.getElementById('locationInfo').style.display = 'block';
          
          if (map) {
            updateMapMarker();
          }
          
          console.log('✅ Location set to:', displayName);
          window.loadWeatherByCoords();
        };
        
        window.showMapSearch = function() {
          const lat = prompt('Nhập vĩ độ (Latitude):', currentLocation.lat.toString());
          if (lat === null) return;
          
          const lon = prompt('Nhập kinh độ (Longitude):', currentLocation.lon.toString());
          if (lon === null) return;
          
          document.getElementById('latInput').value = lat;
          document.getElementById('lonInput').value = lon;
          window.loadWeatherByCoords();
        };
        
        window.loadWeatherByCoords = async function() {
          const lat = parseFloat(document.getElementById('latInput').value);
          const lon = parseFloat(document.getElementById('lonInput').value);
          
          if (isNaN(lat) || isNaN(lon)) {
            alert('❌ Vui lòng nhập tọa độ hợp lệ');
            return;
          }
          
          if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            alert('❌ Tọa độ ngoài phạm vi hợp lệ');
            return;
          }
          
          currentLocation = { lat, lon, name: lat.toFixed(4) + ', ' + lon.toFixed(4) };
          document.getElementById('locationName').innerHTML = '📍 Vị trí: <strong>' + currentLocation.name + '</strong>';
          document.getElementById('locationInfo').style.display = 'block';
          
          if (map) {
            updateMapMarker();
          }
          
          await window.loadWeatherData(lat, lon);
        };
        
        window.loadWeatherForMarker = function() {
          window.loadWeatherData(currentLocation.lat, currentLocation.lon);
        };
        
        window.loadWeatherData = async function(lat, lon) {
          console.log('🌤️ Loading weather data for', lat, lon);
          try {
            const res = await fetch('/api/weather?lat=' + lat + '&lon=' + lon + '&days=7');
            const data = await res.json();
            
            if (data && data.daily) {
              window.displayWeatherData(data);
            } else {
              throw new Error('Invalid weather response');
            }
          } catch (error) {
            console.error('❌ Weather data load failed:', error);
            alert('❌ Không thể tải dữ liệu thời tiết. Vui lòng thử lại.');
          }
        };
        
        window.displayWeatherData = function(weatherData) {
          console.log('📊 Weather data:', weatherData);
          
          const daily = weatherData.daily || [];
          if (daily.length === 0) {
            alert('❌ Không có dữ liệu thời tiết');
            return;
          }
          
          // Display current weather (first day)
          const today = daily[0];
          const avgTemp = Math.round((today.temp.min + today.temp.max) / 2);
          const humidity = Math.round((today.humidity || 0.5) * 100);
          const windSpeed = (today.windSpeed || 0).toFixed(1);
          const rainProb = Math.round((today.precipitationProbability || 0) * 100);
          
          document.getElementById('tempValue').textContent = avgTemp + '°C';
          document.getElementById('tempRange').textContent = today.temp.min + '°C - ' + today.temp.max + '°C';
          document.getElementById('humidityValue').textContent = humidity + '%';
          document.getElementById('humidityBar').style.width = humidity + '%';
          document.getElementById('windValue').textContent = windSpeed + ' m/s';
          
          // Wind description
          let windDesc = 'Êm dịu';
          if (windSpeed < 2) windDesc = 'Hầu như không gió';
          else if (windSpeed < 5) windDesc = 'Gió nhẹ';
          else if (windSpeed < 10) windDesc = 'Gió vừa phải';
          else if (windSpeed < 15) windDesc = 'Gió mạnh';
          else windDesc = 'Gió rất mạnh';
          document.getElementById('windDesc').textContent = windDesc;
          
          document.getElementById('rainValue').textContent = rainProb + '%';
          document.getElementById('rainBar').style.width = rainProb + '%';
          document.getElementById('weatherInfo').style.display = 'block';
          
          // Display forecast
          let forecastHtml = '';
          daily.forEach(function(day, idx) {
            const riskData = window.calculateDiseaseRisk(day);
            const riskColor = riskData.level === 'Cao' ? '#f44336' : riskData.level === 'Trung Bình' ? '#FF9800' : '#4CAF50';
            const riskIcon = riskData.level === 'Cao' ? '⛔' : riskData.level === 'Trung Bình' ? '⚠️' : '✅';
            
            forecastHtml += '<div class="forecast-card hover-card"><h4>📅 ' + window.formatDate(day.date) + '</h4><div class="weather-data"><p>🌡️ <strong>' + day.temp.min + '°C - ' + day.temp.max + '°C</strong> (Avg: ' + day.temp.avg + '°C)</p><p>💧 Độ ẩm: <strong>' + Math.round((day.humidity || 0.5) * 100) + '%</strong></p><p>💨 Gió: <strong>' + (day.windSpeed || 0).toFixed(1) + ' m/s</strong></p><p>🌧️ Mưa: <strong>' + Math.round((day.precipitationProbability || 0) * 100) + '%</strong></p><p style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;"><span style="display: inline-block; background: ' + riskColor + '; color: white; padding: 6px 14px; border-radius: 12px; font-size: 12px; font-weight: bold;">' + riskIcon + ' ' + riskData.level + '</span><br><small style="color: #666; margin-top: 5px; display: block;">' + riskData.description + '</small></p></div></div>';
          });
          
          document.getElementById('forecastGrid').innerHTML = forecastHtml;
          document.getElementById('forecastSection').style.display = 'block';
          
          // Update risk section
          window.updateRiskAssessment(daily);
          
          console.log('✅ Weather display updated');
        };
        
        window.calculateDiseaseRisk = function(day) {
          let fungalRisk = 0;
          let bacterialRisk = 0;
          let insectRisk = 0;
          let description = '';
          
          const humidity = day.humidity || 0.5;
          const temp = day.temp.avg;
          const rain = day.precipitationProbability || 0;
          const wind = day.windSpeed || 0;
          
          // Fungal disease risk (high humidity + moderate temp)
          if (humidity > 0.7 && temp >= 20 && temp <= 28) {
            fungalRisk = 3;
          } else if (humidity > 0.6 && temp >= 18 && temp <= 30) {
            fungalRisk = 2;
          } else if (humidity > 0.5) {
            fungalRisk = 1;
          }
          
          // Bacterial disease risk (cold + humid + rain)
          if (temp < 15 && humidity > 0.6 && rain > 0.3) {
            bacterialRisk = 3;
          } else if (temp < 20 && humidity > 0.6) {
            bacterialRisk = 2;
          } else if (humidity > 0.7 && rain > 0.5) {
            bacterialRisk = 2;
          }
          
          // Insect pest risk (warm + dry)
          if (temp > 25 && humidity < 0.5 && rain < 0.2) {
            insectRisk = 3;
          } else if (temp > 20 && humidity < 0.6) {
            insectRisk = 2;
          }
          
          // Rain spreads diseases
          if (rain > 0.7) {
            fungalRisk += 1;
            bacterialRisk += 1;
          }
          
          // High wind spreads diseases
          if (wind > 5) {
            fungalRisk += 0.5;
            bacterialRisk += 0.5;
          }
          
          const totalRisk = (fungalRisk + bacterialRisk + insectRisk) / 3;
          
          if (totalRisk >= 2.5) {
            return { level: 'Cao', description: '⛔ Điều kiện lý tưởng cho bệnh - Cần theo dõi sát sao', total: totalRisk, fungal: fungalRisk, bacterial: bacterialRisk, insect: insectRisk };
          } else if (totalRisk >= 1.5) {
            return { level: 'Trung Bình', description: '⚠️ Điều kiện thuận lợi cho bệnh - Cần giám sát', total: totalRisk, fungal: fungalRisk, bacterial: bacterialRisk, insect: insectRisk };
          } else {
            return { level: 'Thấp', description: '✅ Điều kiện tốt - Tiếp tục theo dõi', total: totalRisk, fungal: fungalRisk, bacterial: bacterialRisk, insect: insectRisk };
          }
        };
        
        window.updateRiskAssessment = function(daily) {
          if (!daily || daily.length === 0) return;
          
          const today = daily[0];
          const riskData = window.calculateDiseaseRisk(today);
          
          // Update fungal risk
          const fungalPercent = Math.min(100, (riskData.fungal / 3) * 100);
          document.getElementById('fungalRisk').style.width = fungalPercent + '%';
          document.getElementById('fungalRiskText').textContent = fungalPercent > 66 ? '🔴 Cao' : fungalPercent > 33 ? '🟡 Trung Bình' : '🟢 Thấp';
          
          // Update bacterial risk
          const bacterialPercent = Math.min(100, (riskData.bacterial / 3) * 100);
          document.getElementById('bacterialRisk').style.width = bacterialPercent + '%';
          document.getElementById('bacterialRiskText').textContent = bacterialPercent > 66 ? '🔴 Cao' : bacterialPercent > 33 ? '🟡 Trung Bình' : '🟢 Thấp';
          
          // Update insect risk
          const insectPercent = Math.min(100, (riskData.insect / 3) * 100);
          document.getElementById('insectRisk').style.width = insectPercent + '%';
          document.getElementById('insectRiskText').textContent = insectPercent > 66 ? '🔴 Cao' : insectPercent > 33 ? '🟡 Trung Bình' : '🟢 Thấp';
          
          document.getElementById('riskSection').style.display = 'block';
        };
        
            window.formatDate = function(dateStr) {
          const date = new Date(dateStr);
          const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
          const dayName = days[date.getDay()];
          return dateStr + ' (' + dayName + ')';
        };        // Initialize map and weather on page load
        window.addEventListener('load', function() {
          console.log('📍 Initializing map...');
          initMap();
          setTimeout(window.autoDetectLocation, 1000);
        });
        
        // ========== ORIGINAL PLANT DISEASE DETECTION CODE ==========
        
        let stream = null;
        let currentFacingMode = 'environment'; // Start with back camera
        let video = document.getElementById('video');
        let canvas = document.getElementById('canvas');
        let captureBtn = document.getElementById('captureBtn');
        let takePictureBtn = document.getElementById('takePictureBtn');
        let switchCameraBtn = document.getElementById('switchCameraBtn');
        let captureControls = document.getElementById('captureControls');
        let cameraSupport = document.getElementById('cameraSupport');
        
        // Check camera support on page load
        window.addEventListener('load', function() {
          checkCameraSupport();
        });
        
        function checkCameraSupport() {
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            cameraSupport.innerHTML = '❌ Trình duyệt không hỗ trợ camera';
            cameraSupport.style.color = '#f44336';
            captureBtn.textContent = '❌ Camera Không Hỗ Trợ';
            captureBtn.disabled = true;
            captureBtn.style.background = '#ccc';
          } else if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
            cameraSupport.innerHTML = '⚠️ Camera cần HTTPS để hoạt động';
            cameraSupport.style.color = '#ff9800';
            captureBtn.textContent = '⚠️ Cần HTTPS';
          } else {
            cameraSupport.innerHTML = '✅ Camera sẵn sàng';
            cameraSupport.style.color = '#4CAF50';
            captureBtn.textContent = '📸 Mở Camera';
          }
        }
        
        captureBtn.addEventListener('click', async function() {
          if (stream) {
            stopCamera();
          } else {
            await startCamera();
          }
        });
        
        takePictureBtn.addEventListener('click', function() {
          takePicture();
        });
        
        switchCameraBtn.addEventListener('click', async function() {
          currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
          if (stream) {
            stopCamera();
            await startCamera();
          }
        });
        
        async function startCamera() {
          try {
            // Check if getUserMedia is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
              throw new Error('Camera API không được hỗ trợ trên trình duyệt này');
            }
            
            // Try to get camera permission with fallback options
            let constraints = { 
              video: { 
                facingMode: currentFacingMode,
                width: { ideal: 1280, min: 320 },
                height: { ideal: 720, min: 240 }
              } 
            };
            
            try {
              stream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (specificError) {
              console.warn('Specific camera failed, trying basic:', specificError);
              // Fallback to basic video without facingMode
              stream = await navigator.mediaDevices.getUserMedia({ video: true });
            }
            
            video.srcObject = stream;
            video.style.display = 'block';
            captureControls.style.display = 'flex';
            captureControls.style.justifyContent = 'center';
            
            // Wait for video to load
            video.onloadedmetadata = function() {
              video.play().then(() => {
                captureBtn.textContent = '❌ Đóng Camera';
                captureBtn.style.background = '#f44336';
                video.style.border = '3px solid #4CAF50';
                document.getElementById('capturedImage').innerHTML = 
                  '<p style="color: #4CAF50; background: #f0f8ff; padding: 10px; border-radius: 8px;">📹 Camera đã sẵn sàng - Nhấn "📷 Chụp Ngay" để chụp ảnh</p>';
              }).catch(playError => {
                console.error('Video play error:', playError);
                document.getElementById('capturedImage').innerHTML = 
                  '<p style="color: #f44336;">❌ Lỗi phát video: ' + playError.message + '</p>';
              });
            };
            
          } catch (err) {
            console.error('Camera error details:', err);
            let errorMsg = 'Không thể truy cập camera: ' + err.message;
            
            if (err.name === 'NotAllowedError') {
              errorMsg = '❌ Quyền truy cập camera bị từ chối.\\n\\n' +
                'Để sử dụng camera:\\n' +
                '1. Nhấn vào biểu tượng 🔒 hoặc 📹 trên thanh địa chỉ\\n' +
                '2. Chọn "Cho phép" camera\\n' +
                '3. Làm mới trang và thử lại';
            } else if (err.name === 'NotFoundError') {
              errorMsg = '❌ Không tìm thấy camera trên thiết bị';
            } else if (err.name === 'NotReadableError') {
              errorMsg = '❌ Camera đang được sử dụng bởi ứng dụng khác';
            } else if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
              errorMsg = '❌ Camera chỉ hoạt động trên HTTPS hoặc localhost\\n\\nTruy cập: https://your-domain.com hoặc localhost';
            }
            
            alert(errorMsg);
            document.getElementById('capturedImage').innerHTML = 
              '<div style="background: #ffebee; color: #c62828; padding: 15px; border-radius: 8px; border-left: 4px solid #f44336;">' +
              '<p><strong>❌ Lỗi Camera:</strong> ' + err.message + '</p>' +
              '<p><small>Kiểm tra quyền truy cập camera trong cài đặt trình duyệt</small></p>' +
              '</div>';
          }
        }
        
        function stopCamera() {
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
            video.style.display = 'none';
            captureControls.style.display = 'none';
            captureBtn.textContent = '📸 Mở Camera';
            captureBtn.style.background = '#FF6B6B';
            stream = null;
            document.getElementById('capturedImage').innerHTML = '';
          }
        }
        
        function takePicture() {
          if (stream && video.videoWidth > 0) {
            // Setup canvas
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            let ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);
            
            // Show preview
            let imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
            document.getElementById('capturedImage').innerHTML = 
              '<div style="background: #f0f8ff; padding: 15px; border-radius: 10px;">' +
              '<h4>📸 Ảnh vừa chụp:</h4>' +
              '<img src="' + imageDataUrl + '" style="max-width: 300px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">' +
              '<br><p style="margin: 10px 0;">🔄 Đang phân tích...</p></div>';
            
            // Convert to blob and upload
            canvas.toBlob(function(blob) {
              uploadCapturedImage(blob);
            }, 'image/jpeg', 0.8);
            
            // Optional: Stop camera after taking picture
            stopCamera();
          } else {
            alert('Camera chưa sẵn sàng. Vui lòng đợi một chút...');
          }
        }
        
        function uploadCapturedImage(blob) {
          let formData = new FormData();
          formData.append('image', blob, 'captured-photo.jpg');
          
          // Get selected plant part
          let selectedPart = document.querySelector('input[name="plantPart"]:checked').value;
          formData.append('plantPart', selectedPart);
          
          // Show loading
          document.getElementById('capturedImage').innerHTML = '<p>🔄 Đang phân tích...</p>';
          
          fetch('/api/predict', {
            method: 'POST',
            body: formData
          })
          .then(response => response.json())
          .then(data => {
            displayResult(data);
          })
          .catch(error => {
            document.getElementById('capturedImage').innerHTML = '<p>❌ Lỗi: ' + error.message + '</p>';
          });
        }
        
        function displayResult(data) {
          let diseaseName = data.prediction || data.label || 'Không xác định';
          let confidence = ((data.confidence || data.score || 0) * 100).toFixed(1);
          
          let resultHtml = '<div style="background: linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%); padding: 20px; border-radius: 15px; margin: 15px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">';
          
          // Header với confidence color
          let confidenceColor = confidence >= 70 ? '#4CAF50' : confidence >= 50 ? '#FF9800' : '#f44336';
          resultHtml += '<h3 style="margin: 0 0 15px 0; color: ' + confidenceColor + ';">🎯 Kết Quả Phân Tích AI v3.0</h3>';
          
          // Diagnosis
          resultHtml += '<div style="background: white; padding: 15px; border-radius: 10px; margin: 10px 0; border-left: 4px solid ' + confidenceColor + ';">';
          resultHtml += '<p style="margin: 0;"><strong>🔍 Chẩn đoán:</strong> <span style="color: ' + confidenceColor + '; font-size: 18px;">' + diseaseName + '</span></p>';
          resultHtml += '<p style="margin: 5px 0 0 0;"><strong>📊 Độ tin cậy:</strong> <span style="color: ' + confidenceColor + ';">' + confidence + '%</span></p>';
          if (data.severity) {
            resultHtml += '<p style="margin: 5px 0 0 0;"><strong>⚠️ Mức độ:</strong> ' + data.severity + '</p>';
          }
          resultHtml += '</div>';

          // Disease description - Mô tả chi tiết về bệnh
          if (data.diseaseDescription) {
            resultHtml += '<div style="background: #e3f2fd; padding: 15px; border-radius: 10px; margin: 10px 0; border-left: 4px solid #2196F3;">';
            resultHtml += '<p><strong>� Thông tin về bệnh:</strong></p>';
            resultHtml += '<p style="margin: 5px 0; line-height: 1.6;">' + data.diseaseDescription + '</p>';
            resultHtml += '</div>';
          }

          // Detailed diagnosis - Chẩn đoán chi tiết
          if (data.detailedDiagnosis) {
            resultHtml += '<div style="background: #f3e5f5; padding: 15px; border-radius: 10px; margin: 10px 0; border-left: 4px solid #9c27b0;">';
            resultHtml += '<div style="white-space: pre-line;">' + data.detailedDiagnosis + '</div>';
            resultHtml += '</div>';
          }
          
          if (data.symptoms && Array.isArray(data.symptoms)) {
            resultHtml += '<div style="background: white; padding: 15px; border-radius: 10px; margin: 10px 0;">';
            resultHtml += '<p><strong>🔍 Triệu chứng:</strong></p>';
            resultHtml += '<ul style="margin: 5px 0; padding-left: 20px;">';
            data.symptoms.forEach(function(symptom) {
              resultHtml += '<li>' + symptom + '</li>';
            });
            resultHtml += '</ul>';
            resultHtml += '</div>';
          }
          
          if (data.treatment) {
            resultHtml += '<div style="background: #f1f8e9; padding: 15px; border-radius: 10px; margin: 10px 0; border-left: 4px solid #4CAF50;">';
            resultHtml += '<p><strong>💊 Điều trị:</strong> ' + data.treatment + '</p>';
            resultHtml += '</div>';
          }
          
          if (data.prevention) {
            resultHtml += '<div style="background: #fff3e0; padding: 15px; border-radius: 10px; margin: 10px 0; border-left: 4px solid #FF9800;">';
            resultHtml += '<p><strong>🛡️ Phòng ngừa:</strong> ' + data.prevention + '</p>';
            resultHtml += '</div>';
          }
          
          // Action buttons
          resultHtml += '<div style="margin: 15px 0; text-align: center;">';
          
          // Google search button
          let googleQuery = encodeURIComponent(diseaseName + ' bệnh cây điều trị phòng chống');
          resultHtml += '<a href="https://www.google.com/search?q=' + googleQuery + '" target="_blank" ';
          resultHtml += 'style="display: inline-block; background: #4285f4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 25px; margin: 5px; font-size: 14px;">🔍 Tìm Google</a>';
          
          // Wikipedia button  
          let wikiQuery = encodeURIComponent(diseaseName);
          resultHtml += '<a href="https://vi.wikipedia.org/wiki/Special:Search?search=' + wikiQuery + '" target="_blank" ';
          resultHtml += 'style="display: inline-block; background: #000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 25px; margin: 5px; font-size: 14px;">📖 Wikipedia</a>';
          
          // Detailed description toggle button
          resultHtml += '<button onclick="window.toggleDetailedInfo(' + JSON.stringify(diseaseName) + ')" ';
          resultHtml += 'style="background: #10b981; color: white; padding: 10px 20px; border: none; border-radius: 25px; margin: 5px; font-size: 14px; cursor: pointer;">📚 Xem Chi Tiết</button>';
          
          resultHtml += '</div>';
          
          // Placeholder for detailed info
          resultHtml += '<div id="detailedInfo" style="display: none; background: #f8f9fa; padding: 15px; border-radius: 10px; margin: 10px 0;"></div>';
          
          resultHtml += '</div>';
          
          document.getElementById('capturedImage').innerHTML = resultHtml;
        }
        
        // Detailed disease information database
        const diseaseDetailDatabase = {
          'Bệnh đạo ôn lúa': {
            description: 'Bệnh nấm nghiêm trọng nhất trên lúa do Magnaporthe oryzae gây ra, có thể làm giảm 10-50% năng suất.',
            causes: 'Nấm Magnaporthe oryzae, thời tiết ẩm ướt (độ ẩm >85%), nhiệt độ 25-28°C, mưa phùn kéo dài',
            symptoms: ['Đốm nâu hình thoi trên lá', 'Viền vàng quanh đốm bệnh', 'Cổ bông gãy đổ', 'Hạt lúa bị khô, lép'],
            treatment: 'Phun Tricyclazole 75% WP (2-3g/l), Isoprothiolane 40% EC (1.5-2ml/l), hoặc Kasugamycin 2% SL (2-3ml/l)',
            prevention: 'Sử dụng giống kháng bệnh, luân canh cây họ đậu, tránh bón đạm thừa, dẫn nước hợp lý'
          },
          'Bệnh đốm nâu lúa': {
            description: 'Bệnh phổ biến trên lúa do nấm Bipolaris oryzae, thường xuất hiện giai đoạn cuối vụ khi lúa thiếu kali.',
            causes: 'Nấm Bipolaris oryzae, thiếu kali, thời tiết hanh khô, cây già yếu',
            symptoms: ['Đốm tròn màu nâu trên lá', 'Tâm đốm màu xám nhạt', 'Lá vàng và khô dần từ dưới lên'],
            treatment: 'Phun Mancozeb 80% WP (3g/l) + bón phân kali bổ sung (KCl 50kg/ha)',
            prevention: 'Cân đối phân bón NPK, tăng cường kali, giữ ẩm ruộng, tránh để cây già quá'
          },
          'Bệnh cháy lá sớm cà chua': {
            description: 'Bệnh nấm Alternaria solani phổ biến trên cà chua, gây thiệt hại lớn từ giai đoạn ra hoa.',
            causes: 'Nấm Alternaria solani, độ ẩm cao (>80%), nhiệt độ 24-29°C, cây yếu thiếu dinh dưỡng',
            symptoms: ['Đốm nâu đen tròn trên lá già', 'Vòng tròn đồng tâm đặc trưng', 'Lá vàng và rụng từ dưới lên'],
            treatment: 'Phun Chlorothalonil 72% SC (2ml/l) hoặc Mancozeb 80% WP (3g/l), 7-10 ngày/lần',
            prevention: 'Tránh tưới ngập lá, đảm bảo thông gió, thu dọn lá bệnh đốt bỏ, bón phân cân đối'
          }
        };
        
        // Model voting function
        window.voteForModel = async function(modelName, disease) {
          console.log('🗳️ User voting for model:', modelName, 'Disease:', disease);
          
          try {
            const response = await fetch('/api/feedback', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                modelName: modelName,
                predictedDisease: disease,
                userSelectedDisease: disease,
                imageFilename: 'web-upload'
              })
            });

            const result = await response.json();
            
            if (result.success) {
              const feedback = result.feedback;
              let feedbackHtml = '<strong style="font-size: 16px;">✅ ' + feedback.message + '</strong><br>';
              feedbackHtml += '<p style="margin: 10px 0 0 0;"><span style="color: #666;">Model Accuracy:</span> ' + feedback.modelAccuracy + ' | ';
              feedbackHtml += '<span style="color: #666;">Voting Weight:</span> <strong style="color: #667eea;">' + feedback.modelWeight + '</strong></p>';
              
              const feedbackDiv = document.getElementById('feedbackResult');
              feedbackDiv.innerHTML = feedbackHtml;
              feedbackDiv.style.display = 'block';
              feedbackDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              
              setTimeout(function() {
                feedbackDiv.style.display = 'none';
              }, 5000);
            }
          } catch (error) {
            console.error('❌ Voting error:', error);
            alert('❌ Lỗi gửi phiếu bầu. Vui lòng thử lại.');
          }
        };
        
        // Get model performance leaderboard
        window.showModelLeaderboard = async function() {
          try {
            const response = await fetch('/api/models/performance');
            const result = await response.json();
            
            if (result.success) {
              let html = '<h3 style="color: #667eea;">🏆 Model Performance Leaderboard</h3>';
              html += result.summary.replace(/\n/g, '<br>');
              alert(html);
            }
          } catch (error) {
            console.error('Error fetching leaderboard:', error);
          }
        };
        
        window.toggleDetailedInfo = function(diseaseName) {
          let detailedDiv = document.getElementById('detailedInfo');
          if (detailedDiv.style.display === 'none') {
            let info = diseaseDetailDatabase[diseaseName];
            if (info) {
              let html = '<h4 style="color: #10b981; margin: 0 0 15px 0;">📋 Thông Tin Chi Tiết: ' + diseaseName + '</h4>';
              
              html += '<div style="margin: 10px 0;"><strong>🔬 Mô tả:</strong><br>' + info.description + '</div>';
              
              html += '<div style="margin: 10px 0;"><strong>🧬 Nguyên nhân:</strong><br>' + info.causes + '</div>';
              
              html += '<div style="margin: 10px 0;"><strong>🔍 Triệu chứng chi tiết:</strong><ul>';
              info.symptoms.forEach(function(symptom) {
                html += '<li>' + symptom + '</li>';
              });
              html += '</ul></div>';
              
              html += '<div style="margin: 10px 0;"><strong>💊 Điều trị chi tiết:</strong><br>' + info.treatment + '</div>';
              
              html += '<div style="margin: 10px 0;"><strong>🛡️ Phòng ngừa chi tiết:</strong><br>' + info.prevention + '</div>';
              
              detailedDiv.innerHTML = html;
              detailedDiv.style.display = 'block';
            } else {
              detailedDiv.innerHTML = '<p>📚 Thông tin chi tiết cho "' + diseaseName + '" đang được cập nhật...</p>';
              detailedDiv.style.display = 'block';
            }
          } else {
            detailedDiv.style.display = 'none';
          }
        };

        // Update hidden field when plant part selection changes
        document.querySelectorAll('input[name="plantPart"]').forEach(function(radio) {
          radio.addEventListener('change', function() {
            document.getElementById('hiddenPlantPart').value = this.value;
            // Update labels styling
            document.querySelectorAll('label').forEach(label => {
              label.style.background = '#f9f9f9';
              label.style.borderColor = '#ddd';
            });
            this.parentElement.style.background = '#e8f5e8';
            this.parentElement.style.borderColor = '#4CAF50';
          });
        });

        // Global functions - Define directly on window object
        window.testJS = function() {
          alert('JavaScript đã hoạt động!');
          console.log('JavaScript test OK');
        };

        // Chatbot functions
        window.sendMessage = async function() {
          console.log('sendMessage called');
          const input = document.getElementById('chatInput');
          const message = input.value.trim();
          if (!message) return;
          
          window.addMessage(message, 'user');
          input.value = '';
          
          window.addMessage('Đang suy nghĩ...', 'bot');
          
          try {
            const response = await fetch('/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: message })
            });
            
            const data = await response.json();
            const messages = document.getElementById('chatMessages');
            messages.removeChild(messages.lastChild);
            window.addMessage(data.message, 'bot');
            
          } catch (error) {
            const messages = document.getElementById('chatMessages');
            messages.removeChild(messages.lastChild);
            window.addMessage('Xin lỗi, tôi gặp sự cố. Vui lòng thử lại.', 'bot');
          }
        };
        
        window.askQuestion = function(question) {
          document.getElementById('chatInput').value = question;
          window.sendMessage();
        };
        
        window.addMessage = function(message, type) {
          const messagesDiv = document.getElementById('chatMessages');
          const messageDiv = document.createElement('div');
          messageDiv.className = 'message ' + type + '-message';
          
          if (type === 'bot') {
            messageDiv.innerHTML = '<strong>🌱 Bác Sĩ Cây:</strong> ' + message;
          } else {
            messageDiv.innerHTML = '<strong>Bạn:</strong> ' + message;
          }
          
          messagesDiv.appendChild(messageDiv);
          messagesDiv.scrollTop = messagesDiv.scrollHeight;
        };

        // Disease search functions
        window.searchDiseases = async function() {
          console.log('searchDiseases called');
          const query = document.getElementById('diseaseSearchInput').value.trim();
          if (!query) {
            window.loadAllDiseases();
            return;
          }
          
          try {
            const response = await fetch('/api/diseases/search?q=' + encodeURIComponent(query));
            const data = await response.json();
            window.displayDiseases(data.diseases);
          } catch (error) {
            console.error('Lỗi tìm kiếm:', error);
            document.getElementById('diseaseResults').innerHTML = '<p>Lỗi khi tìm kiếm. Vui lòng thử lại.</p>';
          }
        };
        
        window.loadAllDiseases = async function() {
          try {
            const response = await fetch('/api/diseases');
            const data = await response.json();
            window.displayDiseases(data.diseases);
          } catch (error) {
            console.error('Lỗi tải danh sách bệnh:', error);
            document.getElementById('diseaseResults').innerHTML = '<p>Lỗi khi tải dữ liệu. Vui lòng thử lại.</p>';
          }
        };
        
        window.displayDiseases = function(diseases) {
          const container = document.getElementById('diseaseResults');
          
          if (!diseases || diseases.length === 0) {
            container.innerHTML = '<p>Không tìm thấy bệnh nào.</p>';
            return;
          }
          
          let html = '';
          diseases.forEach(function(disease) {
            const symptomsText = disease.symptoms.slice(0, 2).join(', ') + (disease.symptoms.length > 2 ? '...' : '');
            const googleUrl = 'https://www.google.com/search?q=' + encodeURIComponent(disease.name + ' bệnh cây trồng điều trị phòng chống');
            const wikiUrl = 'https://vi.wikipedia.org/wiki/Special:Search?search=' + encodeURIComponent(disease.name);
            
            html += '<div class="disease-item">';
            html += '<h4>' + disease.name + '</h4>';
            html += '<div class="scientific">' + disease.scientificName + '</div>';
            html += '<div class="description">' + disease.description + '</div>';
            html += '<div style="margin: 10px 0;"><strong>Triệu chứng:</strong> ' + symptomsText + '</div>';
            html += '<div class="external-links">';
            html += '<a href="' + googleUrl + '" target="_blank">🔍 Google</a>';
            html += '<a href="' + wikiUrl + '" target="_blank">📖 Wikipedia</a>';
            html += '</div>';
            html += '</div>';
          });
          
          container.innerHTML = html;
        };
        
        // Load all diseases on page load
        window.addEventListener('load', function() {
          console.log('Page loaded, initializing...');
          window.loadAllDiseases();
          
          // Search on Enter key
          const searchInput = document.getElementById('diseaseSearchInput');
          if (searchInput) {
            searchInput.addEventListener('keypress', function(e) {
              if (e.key === 'Enter') {
                window.searchDiseases();
              }
            });
          }

          // Add Enter key support for chat
          const chatInput = document.getElementById('chatInput');
          if (chatInput) {
            chatInput.addEventListener('keypress', function(e) {
              if (e.key === 'Enter') {
                sendMessage();
              }
            });
          }
        });
      </script>
      
      <!-- Navigation Buttons -->
      <style>
        .navbar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(180deg, rgba(102, 126, 234, 0.95) 0%, rgba(118, 75, 162, 0.95) 100%);
          border-top: 3px solid #10b981;
          padding: 15px 0;
          display: flex;
          justify-content: center;
          gap: 15px;
          flex-wrap: wrap;
          box-shadow: 0 -5px 15px rgba(0,0,0,0.2);
          z-index: 1000;
        }
        .navbar a, .navbar button {
          color: white;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 25px;
          border: 2px solid white;
          background: transparent;
          cursor: pointer;
          font-size: 14px;
          font-weight: bold;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .navbar a:hover, .navbar button:hover {
          background: white;
          color: #667eea;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .navbar .active {
          background: white;
          color: #667eea;
          font-weight: bold;
        }
        .container {
          padding-bottom: 120px;
        }
      </style>
      
      <div class="navbar">
        <a href="/" class="nav-btn">🏠 Trang Chủ</a>
        <button class="nav-btn" onclick="document.querySelector('.upload-area').scrollIntoView({behavior: 'smooth'})">📸 Phân Tích Ảnh</button>
        <button class="nav-btn" onclick="document.querySelector('.disease-search').scrollIntoView({behavior: 'smooth'})">📚 Thư Viện Bệnh</button>
        <button class="nav-btn" onclick="document.querySelector('.chatbot').scrollIntoView({behavior: 'smooth'})">🤖 AI Chat</button>
        <a href="/api/diseases" class="nav-btn" target="_blank">📊 API</a>
      </div>
    </body>
    </html>
  `);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'khỏe mạnh',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '1.0.0'
  });
});

// Disease database API endpoints
app.get('/api/diseases', (req, res) => {
  try {
    const diseases = diseaseService.getAllDiseases();
    res.json({ diseases });
  } catch (error) {
    console.error('❌ Lỗi lấy danh sách bệnh:', error);
    res.status(500).json({ error: 'Không thể lấy danh sách bệnh' });
  }
});

app.get('/api/diseases/search', (req, res) => {
  try {
    const query = req.query.q as string || '';
    const diseases = diseaseService.searchDiseases(query);
    res.json({ diseases, query });
  } catch (error) {
    console.error('❌ Lỗi tìm kiếm bệnh:', error);
    res.status(500).json({ error: 'Không thể tìm kiếm bệnh' });
  }
});

app.get('/api/diseases/:id', (req, res) => {
  try {
    const diseaseId = req.params.id;
    const disease = diseaseService.getDiseaseInfo(diseaseId);

    if (!disease) {
      return res.status(404).json({ error: 'Không tìm thấy thông tin bệnh' });
    }

    res.json({ disease });
  } catch (error) {
    console.error('❌ Lỗi lấy thông tin bệnh:', error);
    res.status(500).json({ error: 'Không thể lấy thông tin bệnh' });
  }
});

// Chatbot API endpoint
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Tin nhắn là bắt buộc' });
  }

  try {
    const response = await openaiService.getChatbotResponse(message);
    res.json({
      message: response,
      timestamp: new Date().toISOString(),
      source: 'openai'
    });
  } catch (error: any) {
    console.error('❌ Lỗi chatbot:', error.message);

    res.json({
      message: "Xin lỗi, tôi đang gặp vấn đề kỹ thuật. Vui lòng thử lại hoặc tải ảnh lên để được phân tích tự động.",
      timestamp: new Date().toISOString(),
      source: 'fallback'
    });
  }
});

// Mount API routes (predict endpoint from apiRoutes)
app.use('/api', apiRoutes);
app.use('/api/crops', cropsRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/training', trainingRoutes);


// SPA Fallback: Serve index.html for all non-API routes
app.get('*', (req, res) => {
  // Don't serve index.html for API routes or test-upload
  if (req.path.startsWith('/api') || req.path.includes('/test-upload')) {
    return res.status(404).json({ error: 'Not found' });
  }

  // Serve React index.html for all other routes (SPA routing)
  const indexPath = path.join(clientBuildPath, 'index.html');
  res.sendFile(indexPath, (err: any) => {
    if (err) {
      console.error('❌ Lỗi serve index.html:', err);
      res.status(500).json({ error: 'Could not serve index.html' });
    }
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Xử lý lỗi toàn cục:', error);

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File quá lớn. Kích thước tối đa là 10MB.' });
    }
    return res.status(400).json({ error: 'Lỗi tải file: ' + error.message });
  }

  res.status(500).json({
    error: 'Lỗi máy chủ nội bộ',
    message: error.message || 'Lỗi không xác định'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Không tìm thấy',
    message: 'Endpoint được yêu cầu không tồn tại',
    availableEndpoints: [
      'GET /',
      'GET /health',
      'GET /test-upload',
      'POST /api/predict',
      'POST /api/chat',
      'GET /api/diseases',
      'GET /api/diseases/search'
    ]
  });
});

// Khởi tạo database trước khi chạy server
async function startServer() {
  try {
    await initDatabase();
    console.log('📊 Database đã sẵn sàng');
  } catch (error) {
    console.error('❌ Lỗi khởi tạo database:', error);
    console.log('⚠️ Server sẽ chạy mà không có database');
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('📡 Callback fired!!! Server is now listening...');
    const localIP = getLocalIP();
    console.log('🌿 Máy Chủ Nhận Diện Bệnh Lá Cây Đã Khởi Động!');
    console.log(`📍 Server (Local): http://localhost:${PORT}`);
    console.log(`🌐 Server (Network): http://${localIP}:${PORT}`);
    console.log(`📱 Mobile/Tablet: http://${localIP}:${PORT}/test-upload`);
    console.log(`🧪 Giao diện test: http://localhost:${PORT}/test-upload`);
    console.log(`🏥 Health check: http://${localIP}:${PORT}/health`);
    console.log(`🔍 API dự đoán: http://${localIP}:${PORT}/api/predict`);
    console.log(`💬 API chatbot: http://${localIP}:${PORT}/api/chat`);
    console.log(`📚 API bệnh cây: http://${localIP}:${PORT}/api/diseases`);
    console.log(`⏰ Khởi động lúc: ${new Date().toLocaleString('vi-VN')}`);
    console.log(`\n🔗 Chia sẻ link này cho mọi người: http://${localIP}:${PORT}/test-upload`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use! Please use a different port.`);
      console.error('   Try: kill the existing process or set PORT environment variable');
      process.exit(1);
    } else {
      console.error('❌ Server error:', err);
      process.exit(1);
    }
  });

  return server;
}

// Bắt đầu server
startServer();