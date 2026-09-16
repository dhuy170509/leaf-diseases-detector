# 🧪 Phase 3: End-to-End Testing Guide

**Status:** Ready for Comprehensive Testing  
**Date:** November 2, 2025

---

## ✅ Testing Checklist

### 1. Server Startup Test
- [x] Database initialized successfully
- [x] Schema created (9 tables)
- [x] Server starts on port 8765
- [x] Logs show "Server is now listening"
- [x] No errors in startup sequence

### 2. API Root Endpoint
```bash
# Test: GET http://localhost:8765/
Expected Response:
{
  "message": "🌿 API Máy Dò Bệnh Lá Cây",
  "version": "1.0.0",
  "status": "đang chạy",
  "endpoints": { ... }
}
```

### 3. Static Files Serving
```bash
# Access: http://localhost:8765/
# Expected: React app loads (index.html from client/build/)
# Check: Browser console should show no 404 errors
```

### 4. Test Prediction APIs
```bash
# Test 1: GET /api/test-predict (simple test)
curl http://localhost:8765/api/test-predict
# Expected: Test prediction result

# Test 2: GET /api/diseases (list all diseases)
curl http://localhost:8765/api/diseases
# Expected: List of diseases in JSON

# Test 3: GET /api/diseases/search?q=early
curl "http://localhost:8765/api/diseases/search?q=early"
# Expected: Diseases matching "early"
```

### 5. Crop Management APIs

#### Create Crop
```bash
curl -X POST http://localhost:8765/api/crops \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "crop_name": "Test Tomato",
    "crop_type": "tomato",
    "location": "Da Lat",
    "area_hectare": 2.5,
    "planting_date": "2025-09-01"
  }'
```

#### List Crops
```bash
curl http://localhost:8765/api/crops/user/1
```

#### Get Crop Details
```bash
curl http://localhost:8765/api/crops/1
```

#### Add Disease
```bash
curl -X POST http://localhost:8765/api/crops/1/disease \
  -H "Content-Type: application/json" \
  -d '{
    "disease_name": "Early Blight",
    "disease_severity": "moderate",
    "confidence_score": 0.85
  }'
```

#### Get Crop History
```bash
curl http://localhost:8765/api/crops/1/history
```

#### Get Crop Statistics
```bash
curl http://localhost:8765/api/crops/1/statistics
```

### 6. Weather APIs
```bash
# Get forecast
curl http://localhost:8765/api/weather/forecast?lat=11.94&lon=109.19

# Auto-detect location
curl http://localhost:8765/api/weather/auto-location
```

### 7. Chatbot APIs
```bash
# Ask question
curl -X POST http://localhost:8765/api/chatbot/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What is early blight?", "crop_type": "tomato"}'

# Get suggestions
curl http://localhost:8765/api/chatbot/suggestions?crop_type=tomato

# Get disease info
curl "http://localhost:8765/api/chatbot/disease-info/early_blight"

# Health check
curl http://localhost:8765/api/chatbot/health
```

### 8. Chat API
```bash
# Send message
curl -X POST http://localhost:8765/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "message": "How to treat late blight?"
  }'

# Get history
curl http://localhost:8765/api/chat/history?user_id=1
```

---

## 🌐 Browser Testing

### Test 1: Load Application
1. Open browser
2. Navigate to: `http://localhost:8765`
3. Should see: React app with tabs
4. Tabs: "📷 Phân tích ảnh" and "🌱 Quản lý cây"

### Test 2: Image Upload
1. Click "Phân tích ảnh" tab
2. Upload an image (JPG, PNG)
3. Wait for prediction
4. Should see: Disease name, confidence, description

### Test 3: Crop Management
1. Click "Quản lý cây" tab
2. See: Empty crop list (first time)
3. Click "Thêm cây mới" button
4. Fill form with crop details
5. Click "Tạo"
6. Should see: New crop in list

### Test 4: Chatbot
1. Look for: Floating chatbot button (bottom-right)
2. Click: Chat button
3. Type: "What is early blight?"
4. Should see: AI response

### Test 5: Responsiveness
1. Open on mobile device
2. Should adapt to small screen
3. Buttons clickable
4. Forms readable

---

## 📊 Performance Testing

### Load Time Test
```bash
# Measure initial load
time curl http://localhost:8765

# Expected: <500ms for root
# Expected: <1s for full page load with React
```

### API Response Time
```bash
# Test API speed
time curl http://localhost:8765/api/diseases

# Expected: <100ms for cached data
# Expected: <200ms for database queries
```

### Database Performance
```bash
# Check if indexes are working
# Should have <50ms response for indexed queries
```

### Memory Usage
```bash
# Monitor while running
# Server should use: <150MB
# React app should use: <50MB
```

---

## 🔍 Debugging Guide

### Issue: Server won't start
```bash
# Check Node.js version
node --version  # Should be 18+

# Check port 8765 not in use
netstat -ano | findstr :8765

# Kill process if needed
taskkill /PID <processid> /F

# Reinstall dependencies
npm install
npm run build
npm start
```

### Issue: Database errors
```bash
# Reinitialize database
python init_db.py

# Check database file
dir database/disease_detector.db

# Verify tables
sqlite3 database/disease_detector.db ".tables"
```

### Issue: API errors
```bash
# Check server logs for error messages
# Look for lines starting with ❌ or ⚠️

# Test specific endpoint with detailed error
curl -v http://localhost:8765/api/crops/user/1
```

### Issue: React not loading
```bash
# Check if static files exist
dir client/build/

# Check browser console for errors (F12)

# Rebuild if needed
cd client && npm run build
```

---

## 📈 Success Criteria

### ✅ Server Level
- [x] Starts in <3 seconds
- [x] No error messages on startup
- [x] Database initializes
- [x] All routes register
- [ ] Handles 100+ requests/minute

### ✅ API Level
- [ ] All 17 endpoints respond
- [ ] Response time <200ms
- [ ] Error handling works
- [ ] CORS headers correct
- [ ] Data validation working

### ✅ Frontend Level
- [ ] Page loads in browser
- [ ] Tabs navigate correctly
- [ ] Image upload works
- [ ] Crop CRUD functions work
- [ ] Chatbot responds

### ✅ Database Level
- [ ] Can insert data
- [ ] Can read data
- [ ] Can update data
- [ ] Can delete data
- [ ] Queries use indexes

### ✅ ML Model
- [ ] Model loads successfully
- [ ] Prediction works
- [ ] Confidence scores reasonable
- [ ] No inference errors
- [ ] Response time <3 seconds

---

## 🚀 Production Validation

Before deploying to production:

### Security Checklist
- [ ] Validate all user input
- [ ] Sanitize database queries
- [ ] CORS properly restricted
- [ ] No sensitive data in logs
- [ ] Error messages don't leak info
- [ ] HTTPS ready (for prod)
- [ ] Environment variables set
- [ ] No hardcoded credentials

### Performance Checklist
- [ ] API response <200ms
- [ ] Database queries optimized
- [ ] Static files cached
- [ ] Memory under 200MB
- [ ] CPU usage <50%
- [ ] No memory leaks
- [ ] Logging not excessive

### Reliability Checklist
- [ ] Error handling comprehensive
- [ ] Graceful shutdown
- [ ] Database connection pooling
- [ ] Retry logic for failures
- [ ] Monitoring in place
- [ ] Backup strategy
- [ ] Recovery procedures

---

## 📋 Test Results Template

```
Test Date: ___________
Tester: ___________
Environment: Development / Production
Browser: ___________

API Tests:
- Root endpoint: [ ] Pass [ ] Fail
- Prediction API: [ ] Pass [ ] Fail
- Crops CRUD: [ ] Pass [ ] Fail
- Chatbot: [ ] Pass [ ] Fail
- Weather: [ ] Pass [ ] Fail

Frontend Tests:
- Page loads: [ ] Pass [ ] Fail
- Tabs work: [ ] Pass [ ] Fail
- Image upload: [ ] Pass [ ] Fail
- Crop management: [ ] Pass [ ] Fail
- Chatbot widget: [ ] Pass [ ] Fail
- Responsive design: [ ] Pass [ ] Fail

Performance:
- Page load time: _______ ms
- API response time: _______ ms
- Memory usage: _______ MB
- CPU usage: _______ %

Issues Found:
1. ___________
2. ___________
3. ___________

Status: [ ] Ready [ ] Needs Fixes
```

---

## 🎯 Next Actions

After successful testing:

1. **Document Results**
   - [ ] Create test report
   - [ ] List any issues found
   - [ ] Recommended fixes

2. **Deploy to Cloud**
   - [ ] Setup cloud account
   - [ ] Configure environment
   - [ ] Deploy application
   - [ ] Setup monitoring

3. **User Acceptance**
   - [ ] Demo to stakeholders
   - [ ] Collect feedback
   - [ ] Implement improvements

4. **Phase 4 Planning**
   - [ ] Mobile app development
   - [ ] TensorFlow Lite conversion
   - [ ] User authentication
   - [ ] Advanced features

---

## 📞 Testing Support

**If tests fail:**

1. Check server logs
2. Review error messages
3. Check database status
4. Verify file permissions
5. Restart services

**Common Issues & Solutions:**

| Issue | Solution |
|-------|----------|
| Port already in use | Kill process on 8765 |
| Database locked | Delete and reinit |
| React not loading | Rebuild with npm run build |
| API timeouts | Check server logs |
| CORS errors | Verify origin settings |

---

## ✅ Testing Complete

Once all tests pass:
- ✅ System is production-ready
- ✅ Ready for cloud deployment
- ✅ Ready for user access
- ✅ Ready for Phase 4 features

**System Status: 🚀 READY FOR DEPLOYMENT**
