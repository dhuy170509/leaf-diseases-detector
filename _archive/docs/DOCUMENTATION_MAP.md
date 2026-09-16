# 📖 Documentation Map & Navigation Guide

## 🎯 Quick Start by Role

### **End Users** (Want to use the app)
1. Go to: http://192.168.1.11:8765
2. Upload image
3. View results
4. Expand disease details for information

### **Developers** (Want to contribute)
1. Read: [README_v2.md](README_v2.md)
2. Architecture: Backend → [server/src/services/models/](server/src/services/models/)
3. Frontend: [FRONTEND_UI_GUIDE.md](FRONTEND_UI_GUIDE.md)
4. Run: `npm install && npm run build && npm start`

### **DevOps** (Want to deploy)
1. Read: [DEPLOYMENT_QUICK_START.md](DEPLOYMENT_QUICK_START.md)
2. Choose: Local, Docker, or Cloud
3. Follow: Step-by-step deployment guide
4. Verify: Health check and monitoring

### **QA/Testers** (Want to test)
1. Read: [TESTING_IMPLEMENTATION.md](TESTING_IMPLEMENTATION.md)
2. Create test cases
3. Run tests: `npm test`
4. Report results

---

## 📚 Documentation Files

| File | Purpose | Audience | Pages |
|------|---------|----------|-------|
| **[README_v2.md](README_v2.md)** | Project overview & guide | Everyone | 50+ |
| **[FINAL_STATUS_REPORT.md](FINAL_STATUS_REPORT.md)** | Complete status & metrics | Managers/Leads | 60+ |
| **[API_REFACTORED.md](API_REFACTORED.md)** | API reference | Developers | 40+ |
| **[FRONTEND_UI_GUIDE.md](FRONTEND_UI_GUIDE.md)** | UI components guide | Frontend devs | 20+ |
| **[DEPLOYMENT_QUICK_START.md](DEPLOYMENT_QUICK_START.md)** | Deployment guide | DevOps | 20+ |
| **[TESTING_IMPLEMENTATION.md](TESTING_IMPLEMENTATION.md)** | Testing strategy | QA/Developers | 20+ |
| **[PHASE_COMPLETION_SUMMARY.md](PHASE_COMPLETION_SUMMARY.md)** | Phase summary | Managers | 40+ |

---

## 🔍 Find What You Need

**"How do I..."**

- Deploy? → [DEPLOYMENT_QUICK_START.md](DEPLOYMENT_QUICK_START.md)
- Use the API? → [API_REFACTORED.md](API_REFACTORED.md)
- Understand the architecture? → [README_v2.md](README_v2.md#🏗️-architecture)
- Customize the UI? → [FRONTEND_UI_GUIDE.md](FRONTEND_UI_GUIDE.md)
- Write tests? → [TESTING_IMPLEMENTATION.md](TESTING_IMPLEMENTATION.md)
- Fix an error? → [README_v2.md](README_v2.md#troubleshooting)
- Add a new model? → [README_v2.md](README_v2.md#adding-new-models)
- Check status? → [FINAL_STATUS_REPORT.md](FINAL_STATUS_REPORT.md)

---

## 📂 Code Organization

**Backend** (TypeScript)
- Models: [server/src/services/models/](server/src/services/models/)
  - BaseAIModel.ts (Abstract)
  - BestModelH5.ts (Implementation)
  - ModelManager.ts (Factory)

**Frontend** (React)
- Components: [client/src/components/](client/src/components/)
- Styles: [client/src/styles/app.css](client/src/styles/app.css)

**AI Models** (H5/Keras)
- Models: [model/](model/)
- 7 total models, 785.6 MB

---

## ⭐ Recommended Reading Order

1. This file (2 min) ← You are here
2. [README_v2.md](README_v2.md) (20 min)
3. [FINAL_STATUS_REPORT.md](FINAL_STATUS_REPORT.md) (20 min)
4. Then choose your path:
   - **Developer**: [FRONTEND_UI_GUIDE.md](FRONTEND_UI_GUIDE.md) + [API_REFACTORED.md](API_REFACTORED.md)
   - **DevOps**: [DEPLOYMENT_QUICK_START.md](DEPLOYMENT_QUICK_START.md)
   - **QA**: [TESTING_IMPLEMENTATION.md](TESTING_IMPLEMENTATION.md)

---

**For complete documentation, start with [README_v2.md](README_v2.md)**

