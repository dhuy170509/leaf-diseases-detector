# AgriAI — Leaf Disease Detector

Web app nhận diện bệnh lá cây qua ảnh. Upload ảnh lá, nhận phân tích + gợi ý xử lý.

> Trạng thái hiện tại: backend Node/Express chạy **đúng 1 pipeline thật duy nhất
> (`pixel-analysis-v1`, phân tích điểm ảnh bằng Jimp)**. Không còn endpoint trả
> cứng `NO_MODEL_INSTALLED`. Không claim độ chính xác % nào chưa được đo kiểm.

## Chạy nhanh (production stack: Node + frontend2)

Yêu cầu: Node.js 18+.

```bash
cd server
npm install
npm run build
npm start          # mặc định PORT 8765
```

- UI: http://localhost:8765/frontend2/predict.html (dự đoán), `disease.html`,
  `support.html`, `admin.html`, `index.html` — 5 trang URL riêng, bottom nav
  chung, back/forward/refresh native. `/test-upload` redirect về predict.
- Health: `GET /`, `GET /api/test-predict`

## API (Node/Express)

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/predict` | Nhận `multipart/form-data` field `image` (tối đa 10MB) → trả prediction + confidence + severity + thời gian xử lý thật + timestamp thật |
| GET | `/api/models` | Liệt kê đúng 1 model đang chạy (`pixel-analysis-v1`) |
| GET | `/api/test-predict` | Trạng thái model |
| POST | `/api/contact` | Nhận liên hệ/góp ý `{type, name, email, message, rating}` → lưu `database/contact_messages.jsonl` + timestamp thật |
| GET | `/api/weather?lat=..&lon=..&days=3` | Dự báo thời tiết |
| POST | `/api/feedback` | Ghi nhận đúng/sai của dự đoán |
| GET | `/api/models/performance`, `/api/models/weights` | Hiệu năng/bình chọn ensemble (legacy, giữ nguyên) |

Ví dụ:

```bash
curl -X POST http://localhost:8765/api/predict -F "image=@leaf.jpg"
```

Response thật (rút gọn):

```json
{
  "success": true,
  "status": "OK",
  "model": "pixel-analysis-v1",
  "prediction": "Lá khỏe mạnh (Healthy Leaf)",
  "confidence": 0.95,
  "severity": "HEALTHY",
  "processing_time_ms": 51,
  "timestamp": "2026-09-16T12:15:50.287Z"
}
```

## Pipeline dự đoán duy nhất

- File: `server/src/services/pixelAnalysisService.ts` (Jimp, quét từng pixel,
  phân loại màu xanh/nâu/đỏ/vàng/đen, tính severity + spatial pattern).
- Controller: `server/src/controllers/predictController.ts` — không delay giả,
  không mock, ảnh xanh cho `Healthy`, ảnh nâu cho `Brown Spot` (đã test thật).
- Đây là **heuristic cổ điển, không phải CNN đã huấn luyện** — đừng kỳ vọng độ
  chính xác như model học sâu. Muốn CNN thật: xem mục Python bên dưới.

## Backend Python (tùy chọn, không phải production)

- `app.py` + `hf_model.py`: Flask + HuggingFace ViT
  (`wambugu71/crop_leaf_diseases_vit`), có cache theo hash ảnh, phát hiện ảnh mờ.
  Cần `torch`, `transformers`, tải model ~hàng trăm MB.
- `api_server.py`: FastAPI thử nghiệm (engine ensemble). Lưu ý: file này
  hard-code `MODELS_ROOT = D:/huy/...` và tự `sys.exit(1)` khi model lỗi nên
  **sẽ crash trên Render/Railway** nếu chạy nguyên trạng.
- Production hiện tại là **Node/Express** (theo `vercel.json` + CI). Các file
  `render.yaml` / `railway.json` vẫn trỏ `uvicorn api_server:app` — cần cập nhật
  khi chốt deploy Python hoặc chuyển hẳn sang Node.

## Deploy (production duy nhất: Node/Express)

- **Vercel**: import repo, framework preset "Other", `installCommand`
  `npm --prefix server install`, `buildCommand` `npm --prefix server run build`
  (đã khai trong `vercel.json` — Vercel tự đọc). Function Node
  `server/dist/index.js` + static `frontend2/**`. Không cần biến môi trường.
- **Render**: dùng `render.yaml` (Blueprint) — `env: node`,
  build `npm --prefix server install && npm --prefix server run build`,
  start `node server/dist/index.js`, health check `/health`. Auto-deploy theo
  nhánh main.
- **Railway**: dùng `railway.json` — Nixpacks build + start tương tự, health
  check `/health`.
- CI (`.github/workflows/deploy.yml`): cài server deps → build → E2E smoke
  (predict ảnh thật, không mock) → deploy Vercel CLI (cần secret
  `VERCEL_TOKEN`, kèm `VERCEL_ORG_ID`/`VERCEL_PROJECT_ID` nếu project đã link)
  → trigger Render (nếu có `RENDER_API_KEY`, `RENDER_SERVICE_ID`).
- Server đọc `PORT` từ môi trường và bind `0.0.0.0` nên chạy được mọi host.
- Backend Python (`api_server.py`, `app.py`) chỉ dùng local, không deploy.

## Cấu trúc

```
server/            # Node/Express backend (production)
  src/controllers/predictController.ts
  src/routes/api.ts
  src/services/pixelAnalysisService.ts  # pipeline thật duy nhất
  src/services/diseaseService.ts        # tra cứu bệnh
  src/services/weatherService.ts
frontend2/         # UI production (static HTML): predict/disease/admin/...
models/            # disease_database.json, disease_info.json
database/          # SQLite (gitignored *.db)
tests/             # test API (đang viết lại, xem CHANGELOG)
_archive/          # client/, frontend/, web/, templates/, root-src/, docs/ cũ
```

## Bảo mật

- `.env.tunnel` từng bị commit kèm `CLOUDFLARE_API_TOKEN` thật. Đã gỡ khỏi git
  index + gitignore + thay bằng placeholder. **Phải revoke/rotate token cũ trên
  Cloudflare dashboard** vì token vẫn nằm trong lịch sử git cho tới khi purge.
- `.env.production` chỉ chứa placeholder, cũng đã gỡ khỏi index.

## Hạn chế đã biết (trung thực)

- Pipeline hiện tại là heuristic màu sắc — phân biệt được lá xanh khỏe vs lá
  nâu/vàng bệnh, nhưng **không có số liệu accuracy đo trên tập test có nhãn**.
  Mọi con số 93–97% trong tài liệu cũ (đã chuyển vào `_archive/docs/`) là chưa
  kiểm chứng, không còn hiệu lực.
- Test: `tests/server/predict.test.ts` upload ảnh lá khỏe + lá bệnh thật (tạo bằng
  Jimp), assert prediction khác nhau và không phải `NO_MODEL_INSTALLED`.
  Chạy: `npm install` ở root rồi `npx jest tests/server/predict.test.ts`.
  (E2E tương đương đã chạy local 17/17 pass ngày 2026-09-16.)
- E2E trên domain live (`agri-ai-lyart.vercel.app`) chưa chạy lại sau deploy.
