# 🌾 LEAF DISEASE DETECTOR - ADVANCED FEATURES ROADMAP
**Phiên bản nâng cao cho Nông nghiệp Hiện đại**

═══════════════════════════════════════════════════════════════════════════════

## 📋 YÊU CẦU NÂNG CẤP

### ✅ 1. Mô hình nhẹ cho điện thoại
- [ ] Optimize MobileNetV2 cho mobile (~10-20MB)
- [ ] TensorFlow Lite conversion
- [ ] React Native app (iOS/Android)
- [ ] Offline prediction capability

### ✅ 2. Hệ thống mở, dễ mở rộng
- [ ] Plugin system cho loại cây mới
- [ ] Thêm 10+ loại cây: Cà phê, tiêu, dứa, nho, cà chua, khoai...
- [ ] Database bệnh gồm 50+ loại bệnh
- [ ] Admin panel để quản lý crops/diseases

### ✅ 3. Lưu lịch sử bệnh & hồ sơ cây
- [ ] User authentication (email/phone)
- [ ] Crop profile (tên, vị trí, diện tích)
- [ ] Disease history timeline
- [ ] Treatment history và effectiveness tracking
- [ ] Export reports (PDF/Excel)

### ✅ 4. Dự báo thời tiết thực tế
- [ ] OpenWeather API integration
- [ ] GPS location detection
- [ ] Weather-based disease risk prediction
- [ ] Seasonal recommendations
- [ ] Irrigation & spray schedule

### ✅ 5. AI Chatbot hỏi-đáp
- [ ] OpenAI GPT-4 / Google Gemini integration
- [ ] Vietnamese language support
- [ ] Context from crop/disease data
- [ ] Expert farming advice
- [ ] Multi-turn conversation

═══════════════════════════════════════════════════════════════════════════════

## 🏗️ ARCHITECTURE

```
┌─────────────────────────────────────────┐
│     MOBILE APP (React Native)           │
│  iOS / Android                          │
│  - Camera capture                       │
│  - Offline prediction (TFLite)          │
│  - GPS location                         │
│  - Push notifications                   │
└──────────────┬──────────────────────────┘
               │
┌──────────────────────────────────────────────┐
│         WEB + API SERVER (Node.js)          │
├──────────────────────────────────────────────┤
│ Express.js Routes:                          │
│ • POST /api/predict - Prediction            │
│ • GET /api/crops - List crops               │
│ • POST /api/crops - Create crop profile     │
│ • GET /api/crop/:id/history - Disease log  │
│ • POST /api/weather - Get weather/risk     │
│ • POST /api/chat - AI chatbot               │
│ • GET /api/user/profile - User info        │
└──────────────┬───────────────────────────────┘
               │
       ┌───────┴───────┬─────────────┬──────────────┐
       ↓               ↓             ↓              ↓
┌────────────┐  ┌─────────────┐ ┌──────────┐ ┌──────────┐
│   SQLite   │  │  OpenWeather│ │  OpenAI  │ │  Gemini  │
│ Database   │  │   API       │ │  GPT-4   │ │  API     │
│ (Users,    │  │ (Real-time) │ │          │ │          │
│ Crops,     │  │             │ │          │ │          │
│ History)   │  │             │ │          │ │          │
└────────────┘  └─────────────┘ └──────────┘ └──────────┘
       │
    ML Models
    - ResNet50
    - MobileNetV2
    - InceptionV3
```

═══════════════════════════════════════════════════════════════════════════════

## 📱 MOBILE OPTIMIZATION

### Screen Sizes
```
• Phone: 320px - 480px (Portrait)
• Tablet: 768px - 1024px
• Desktop: 1024px+
```

### React Components (Responsive)
```
client/src/components/
├── mobile/
│   ├── CameraCapture.tsx      # Chụp ảnh từ camera
│   ├── QuickAnalysis.tsx       # Phân tích nhanh
│   ├── CropSelector.tsx        # Chọn loại cây
│   └── MobileMenu.tsx          # Menu mobile
├── common/
│   ├── LoadingSpinner.tsx
│   ├── ResultCard.tsx
│   └── WeatherCard.tsx
└── features/
    ├── CropHistory.tsx         # Lịch sử bệnh
    ├── UserProfile.tsx         # Hồ sơ người dùng
    └── ChatBot.tsx             # AI hỏi-đáp
```

═══════════════════════════════════════════════════════════════════════════════

## 🗄️ DATABASE SCHEMA (NEW)

```sql
-- Users
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email TEXT UNIQUE,
  phone TEXT,
  name TEXT,
  location TEXT,
  created_at TIMESTAMP
);

-- Crop Profiles
CREATE TABLE crops (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  crop_name TEXT,
  crop_type TEXT,      -- 'tomato', 'pepper', 'potato', etc.
  location TEXT,
  latitude REAL,
  longitude REAL,
  area_hectare REAL,
  planting_date DATE,
  created_at TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Disease History
CREATE TABLE disease_history (
  id INTEGER PRIMARY KEY,
  crop_id INTEGER,
  disease_name TEXT,
  confidence REAL,
  detected_date TIMESTAMP,
  image_path TEXT,
  treatment TEXT,
  result TEXT,         -- 'recovered', 'spreading', 'treated'
  FOREIGN KEY(crop_id) REFERENCES crops(id)
);

-- Treatment Logs
CREATE TABLE treatments (
  id INTEGER PRIMARY KEY,
  history_id INTEGER,
  treatment_type TEXT,
  chemical TEXT,
  dosage TEXT,
  applied_date TIMESTAMP,
  effectiveness REAL,
  notes TEXT,
  FOREIGN KEY(history_id) REFERENCES disease_history(id)
);

-- Seasonal Data
CREATE TABLE seasonal_info (
  id INTEGER PRIMARY KEY,
  crop_id INTEGER,
  season TEXT,
  start_date DATE,
  end_date DATE,
  weather_conditions TEXT,
  disease_risk REAL,
  recommendations TEXT,
  FOREIGN KEY(crop_id) REFERENCES crops(id)
);
```

═══════════════════════════════════════════════════════════════════════════════

## 🌦️ WEATHER INTEGRATION

### API: OpenWeatherMap

```typescript
// server/src/services/weatherService.ts

interface WeatherData {
  location: string;
  temp: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
  uvIndex: number;
}

interface DiseaseRisk {
  disease: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  recommendations: string[];
}

export async function getDiseaseRiskByWeather(
  lat: number,
  lon: number,
  cropType: string
): Promise<DiseaseRisk[]> {
  // Get weather data
  const weather = await getWeatherForecast(lat, lon);
  
  // Calculate risk based on:
  // - High humidity + warm → High blight risk
  // - High temp + dry → Mite/spider risk
  // - Heavy rain → Fungal disease risk
  
  return calculateRisks(weather, cropType);
}
```

### Disease-Weather Mapping
```
TOMATO:
├─ Early Blight: Humidity > 85% + Temp 15-25°C → HIGH RISK
├─ Late Blight: Humidity > 95% + Rain + Cool → CRITICAL
├─ Powdery Mildew: Dry + 20-25°C → MEDIUM RISK
└─ Yellowing: Intense UV + Stress → LOW-MEDIUM

PEPPER:
├─ Bacterial Spot: Rain + Humidity → HIGH RISK
└─ Anthracnose: Warm + Wet → HIGH RISK

POTATO:
├─ Late Blight: Rain + Cool 15-20°C → CRITICAL
└─ Early Blight: Humidity > 80% → MEDIUM RISK
```

═══════════════════════════════════════════════════════════════════════════════

## 🤖 AI CHATBOT

### Features
```
1. Expert Q&A
   User: "Cà chua bị bệnh gì khi có đốm nâu?"
   Bot: "Đó có thể là Early Blight. Biểu hiện... Xử lý..."

2. Treatment Advice
   User: "Dùng thuốc gì cho bệnh nấm?"
   Bot: "Khuyến cáo: Mancozeb 1% hoặc Copper sulfate..."

3. Prevention Tips
   User: "Cách phòng chống bệnh?"
   Bot: "Thay đổi cây trồng, quản lý nước tưới..."

4. Weather-based Alerts
   User: "Thời tiết ảnh hưởng thế nào?"
   Bot: "Mưa nhiều hôm nay → Risk bệnh bạc lá cao"

5. Seasonal Planning
   User: "Kế hoạch trồng tháng 5?"
   Bot: "Tháng 5 là mùa mưa... khuyến cáo..."
```

### Implementation
```typescript
// server/src/services/aiChatbotService.ts

const systemPrompt = `Bạn là chuyên gia nông học AI chuyên tư vấn về bệnh cây trồng.
Hãy trả lời tiếng Việt, ngắn gọn nhưng chi tiết.
Dựa trên bối cảnh: loại cây, khu vực, thời tiết hiện tại.`;

async function chat(message: string, context: ChatContext): Promise<string> {
  const contextStr = `
    Loại cây: ${context.cropType}
    Khu vực: ${context.location}
    Thời tiết hiện tại: ${context.weather}
    Bệnh gần đây: ${context.recentDiseases}
  `;
  
  const response = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: contextStr + "\n" + message }
    ]
  });
  
  return response.choices[0].message.content;
}
```

═══════════════════════════════════════════════════════════════════════════════

## 📊 DASHBOARD FEATURES

### Home Screen
```
┌─────────────────────────────────┐
│  Xin chào, Tên người dùng!      │
├─────────────────────────────────┤
│ 🌱 Cây trồng của bạn            │
│  • Cà chua (3 ha) - Bạc lá x1   │
│  • Tiêu (1 ha) - Khỏe mạnh      │
│                                 │
│ ⚠️  Cảnh báo                    │
│  • Mưa hôm nay → Nguy hiểm bệnh │
│  • Kiểm tra Cà chua ngay!       │
│                                 │
│ 🩺 Lịch sử gần đây              │
│  • 2 ngày trước: Early Blight   │
│  • Điều trị: Mancozeb - Tốt     │
└─────────────────────────────────┘
```

### Crop Profile
```
┌─────────────────────────────────┐
│ 🌱 Cà chua - Chi tiết           │
├─────────────────────────────────┤
│ Vị trí: Ba Vì, Hà Nội          │
│ Diện tích: 3 ha                 │
│ Giống: T16                      │
│ Ngày trồng: 01/09/2025          │
│                                 │
│ 📈 Thống kê                     │
│ • Bệnh phát hiện: 3 lần         │
│ • Bệnh lành: 2 lần              │
│ • % Hiệu quả điều trị: 85%      │
│                                 │
│ 🔄 Lịch sử bệnh                 │
│ ├─ Early Blight (25/10)         │
│ ├─ Bacterial Speck (18/10)      │
│ └─ Powdery Mildew (10/10)       │
└─────────────────────────────────┘
```

═══════════════════════════════════════════════════════════════════════════════

## 🔄 IMPLEMENTATION STEPS

### Phase 1: Database & Backend (1-2 tuần)
```bash
# 1. Update database schema
server/src/services/databaseService.ts
- Add users, crops, disease_history tables
- Add migration scripts

# 2. Create new API endpoints
server/src/routes/
- auth.ts (login/register)
- crops.ts (CRUD crops)
- history.ts (disease history)
- weather.ts (weather/risk)
- chat.ts (chatbot)

# 3. Implement services
server/src/services/
- authService.ts
- cropService.ts
- weatherService.ts
- aiChatbotService.ts
```

### Phase 2: Frontend - Web (1 tuần)
```bash
# 1. Create new pages
client/src/pages/
- Dashboard.tsx
- CropManagement.tsx
- DiseaseHistory.tsx
- ProfilePage.tsx

# 2. Add mobile responsive
client/src/styles/
- responsive.css (mobile-first)
- tailwind.config.js updates

# 3. Integrate APIs
client/src/services/
- authApi.ts
- cropApi.ts
- weatherApi.ts
```

### Phase 3: Mobile Optimization (1 tuần)
```bash
# 1. TensorFlow Lite conversion
python model/convert_tflite.py

# 2. React Native project
npx create-expo-app leaf-disease-mobile

# 3. Core components
mobile/
├── CameraCapture.tsx
├── PredictionScreen.tsx
└── HistoryScreen.tsx
```

### Phase 4: Advanced Features (1-2 tuần)
```bash
# 1. Weather Integration
npm install openweathermap-js

# 2. AI Chatbot
npm install openai

# 3. Authentication
npm install jsonwebtoken bcryptjs

# 4. Export/Reports
npm install pdfkit xlsx
```

═══════════════════════════════════════════════════════════════════════════════

## 🚀 QUICK START FOR PHASE 1

```bash
# 1. Database backup
cp database/predictions.db database/predictions.backup.db

# 2. Run migrations
node server/scripts/migrate.js

# 3. Test endpoints
npm run dev

# 4. Test weather API
curl http://localhost:8765/api/weather?lat=21.0285&lon=105.8542

# 5. Test chatbot
curl -X POST http://localhost:8765/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Cà chua bị bệnh gì?", "cropType":"tomato"}'
```

═══════════════════════════════════════════════════════════════════════════════

## 💡 TECHNOLOGY STACK

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React + TypeScript | Web UI |
| Mobile | React Native | iOS/Android |
| Backend | Node.js/Express | API Server |
| Database | SQLite | Local storage |
| ML | TensorFlow/Keras | Predictions |
| ML Mobile | TF Lite | On-device inference |
| Weather | OpenWeather API | Real-time weather |
| AI | OpenAI/Gemini | Chatbot |
| Auth | JWT + bcrypt | Security |
| Deployment | Docker | Containerization |

═══════════════════════════════════════════════════════════════════════════════

## 📈 EXPECTED OUTCOMES

✅ **1 tháng**: Web app hoàn chỉnh với lịch sử bệnh + weather  
✅ **6 tuần**: Mobile app (iOS/Android) alpha version  
✅ **2 tháng**: Production deployment cho 100+ farmers  
✅ **3 tháng**: 500+ crop profiles, 1000+ disease records  
✅ **6 tháng**: Full AI expert system cho toàn khu vực

═══════════════════════════════════════════════════════════════════════════════

## 📞 SUPPORT FEATURES

- **FAQ Database**: 100+ câu hỏi thường gặp
- **Video Tutorials**: Hướng dẫn sử dụng chi tiết
- **Farmer Hotline**: Support qua chat/email
- **Community Forum**: Chia sẻ kinh nghiệm giữa farmers
- **Expert Consultation**: Booking với chuyên gia nông học

═══════════════════════════════════════════════════════════════════════════════
