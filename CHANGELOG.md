# Changelog

## Unreleased (2026-09-16) — Khôi phục sau HARD RESET

### Khôi phục pipeline dự đoán (Ưu tiên 1)
- `server/src/controllers/predictController.ts`: viết lại, chạy thật
  `pixelAnalysisService` (Jimp), trả prediction + confidence + severity +
  `processing_time_ms` đo thật + `timestamp` thật. Xóa `NO_MODEL_INSTALLED`.
- `server/src/routes/api.ts`: xóa 5 endpoint rỗng (`/predict-h5`,
  `/predict-plant`, `/predict-mango`, `/predict-multi`, `/predict-best`).
  Giữ đúng 1 endpoint `POST /api/predict`. `/models` trả 1 model
  `pixel-analysis-v1`.
- `server/src/index.ts`: `/api/test-predict` trả `OK`; serve `frontend2` qua
  `/frontend2` + `/static/frontend2` (tự dò nhiều candidate dir); bỏ redirect
  mù mọi `.html` về `/` (nguyên nhân 404); `client/build` chỉ serve khi tồn tại.
- Xóa 13 file chết: `mlModelsService.ts`, `mlModelsService-v2.ts`,
  `efficientNetH5Service.ts`, `mangoModelH5Service.ts`,
  `mobileNetV2PyTorchService.ts`, `multiModelH5Service.ts`,
  `plantModelH5Service.ts`, `bestLeafAIService.ts`, `bestLeafAIPythonService.ts`,
  `newModelService.ts`, `cropDetectionService.ts`, `modelService.ts`,
  `utils/modelLoader.ts`. Đã grep không còn import.
- `server/src` hết `setTimeout` giả lập và hết `NO_MODEL_INSTALLED`.
- Test thật local: ảnh xanh 224px → `Healthy Leaf` 0.95/HEALTHY; ảnh nâu 224px →
  `Brown Spot` 0.96/CRITICAL; `/predict-h5` 404 đúng; `/models` 1 model OK.

### Frontend/deploy (Ưu tiên 1)
- `vercel.json`: thêm build `@vercel/static` cho `frontend2/**`, route
  `/static/frontend2/*` → `/frontend2/*`, `/frontend2/*` serve tĩnh, còn lại về
  Node. Fix 404 `predict.html`/`disease.html`/`admin.html` (local verify 200).
- Archive UI trùng lặp vào `_archive/`: `client/`, `frontend/`, `web/`,
  `templates/`, `src/` (root-src). UI canonical: `frontend2/`.
- Ghi nhận mâu thuẫn backend: production = Node/Express; `api_server.py`
  (FastAPI) hard-code `D:/huy/...` + `sys.exit(1)` khi model lỗi; `render.yaml` +
  `railway.json` vẫn trỏ `uvicorn api_server:app` — chưa đổi, cần quyết định deploy.

### Bảo mật (Ưu tiên 2)
- `git rm --cached .env.tunnel .env.production`; `.gitignore` thêm `.env.*` +
  `!.env.example`; `.env.tunnel` thay bằng placeholder.
- CẢNH BÁO: token Cloudflare cũ vẫn nằm trong lịch sử git — phải revoke/rotate
  trên dashboard, rồi purge history (git filter-repo/BFG) + force-push. Chưa làm
  bước purge vì cần xác nhận.

### Tài liệu (Ưu tiên 3)
- Chuyển 92 file MD root vào `_archive/docs/`, chỉ giữ `README.md` (viết lại,
  trung thực, không claim accuracy) + file này.
- Mọi số liệu 93–97% trong docs cũ là chưa kiểm chứng, hết hiệu lực.

### Còn lại (Ưu tiên 4 + nâng cấp)
- `tests/server/predict.test.ts` đã viết lại (ảnh khỏe/bệnh tạo bằng Jimp,
  assert prediction khác nhau + không `NO_MODEL_INSTALLED` + `/models` 1 model).
  `jest.config.js` chuyển sang `testEnvironment: node`, bỏ `setupTests` của CRA,
  `tests/client/` (trỏ vào `src/` đã archive) chuyển vào `_archive/tests-client/`.
  E2E tương đương chạy local ngày 2026-09-16: **17/17 pass** (healthy `Healthy
  Leaf` 0.95 vs diseased `Brown Spot` 0.96; 5 endpoint cũ 404; 3 trang + CSS 200).
  Lưu ý: root `node_modules` chưa cài nên `npx jest` cần `npm install` trước.
- E2E trên domain live sau deploy.
- Chưa làm: loading thật, cache theo hash (Python đã có), rate-limit `/predict`,
  trang accuracy thật, CI test predict thật, mobile polish.

## Ưu tiên 5 — UI/UX & điều hướng (2026-09-16)

### 16. Kiểm kê UI
- Bản chính thức duy nhất: `frontend2/` (5 trang). `client/`, `frontend/`,
  `web/`, `templates/`, `src/` (root), `tests/client/` đã ở `_archive/`.
- Trang inline `/test-upload` trong `server/src/index.ts` (bản song song chạy
  qua LAN) → redirect 302 về `/frontend2/predict.html`, handler cũ đổi tên
  thành `/test-upload-legacy-disabled` (không còn route nào tới nó).
- SPA fallback khi `client/build` đã archive: trả JSON 404 chỉ về
  `/frontend2/predict.html` thay vì 500.

### 17. Design tokens (`frontend2/style.css`)
- Một nguồn duy nhất: `--primary` xanh lá `#35c26e`, `--accent` nâu đất
  `#d99a3d` (tối đa 1 accent), `--danger`, trung tính
  (`--bg/--card/--text/--muted/--border/--glass/--on-bright`) + bộ ba RGB để
  dùng trong `rgba()`. Xóa hết hex/rgba hardcode cũ (mint/cyan/cam).
- Xóa 4 rule trùng thắng cascade (`.pill-lg.accent`, `.stat-row`, `.stat-bar`,
  `.section-title` định nghĩa 2 lần).

### 18. Router thật + bottom nav
- Toàn site là MPA (mỗi trang URL riêng) nên back/forward/refresh hoạt động
  native. Thêm `initBottomNav()` trong `frontend2/app.js`: render bottom nav
  5 nút (Trang Chủ / Phân Tích Ảnh / Thư Viện Bệnh / Hỗ Trợ / Quản Trị) bằng
  thẻ `<a>` thật + `aria-current`, active theo `location.pathname`. Cả 5 trang
  đã gọi. Top nav thống nhất đủ 5 link mọi trang.
- Chat nổi + chat trang Hỗ trợ nối `POST /api/chat` thật (server thử OpenAI,
  thiếu key trả fallback có ghi `source`); xóa bot demo trả cứng + delay giả.

### 19. Test nav (local, 2026-09-16): 49/49 pass
- 5 trang 200, đủ 25 link top-nav, `app.js` chứa ROUTES, mọi href/src nội bộ
  200, `/test-upload` 302, route lạ JSON 404, `/api/contact` (200 + 400),
  `/api/chat`, `/api/diseases` + `/search` có dữ liệu. E2E cũ 17/17 pass.
  (Lưu ý: 1 lần xuất hiện `UV_HANDLE_CLOSING` khi node tắt trên Windows sau
  khi test đã pass — flake khi shutdown, không ảnh hưởng kết quả.)

### 20. Gộp CTA / sửa contract API
- `predict.html`: endpoint `/predict`+field `file` (chết) → `/api/predict` +
  field `image`; bỏ dropdown chọn cây (không có API danh mục); map response
  thật (`prediction/top_predictions/processing_time_ms`); thêm lịch sử 10 mục,
  số liệu model/latency thật; bỏ chip "Ensemble/CNN".
- `disease.html`: bỏ 2 bệnh hardcode + carousel picsum ngoài → danh sách +
  tìm kiếm thật từ `/api/diseases` + `/search`.
- `admin.html`: bỏ Chart.js CDN + toàn bộ form gọi API Python chết
  (`/system_status`, `/admin/*`, `/hot_swap`, `/rollback`, hard-lock, logs) →
  trạng thái + models + leaderboard thật từ `/api/*` + thẻ "chưa khả dụng".
- `support.html`: form liên hệ/góp ý → `POST /api/contact` thật (mới,
  lưu `database/contact_messages.jsonl` + timestamp); chat → `/api/chat` thật.
- `index.html`: "API: Flask" → "Node/Express", chip route chết → route thật,
  CTA "Mô hình sẵn sàng" (link lệch) → "Thư viện bệnh", thẻ tính năng Rossi
  (hot-swap/rollback/integrity) → tính năng thật.

## Ưu tiên 6 — Design kiểu Apple (2026-09-16)

- Font: system stack (`-apple-system … "SF Pro Display" … "Inter" …`) để hiện
  đúng San Francisco trên máy Apple, Inter (Google Fonts, 400/500/600/700) cho
  máy khác; letter-spacing -0.01em (tiêu đề -0.02em), line-height 1.5.
- Màu: đúng 1 accent xanh lá (`#30D158` dark / `#1A7F37` light, giữ bản sắc
  nông nghiệp thay vì xanh dương Apple); đỏ chỉ dùng cho danger/severe; nền
  phẳng `#000000`/`#F5F5F7`, text `#F5F5F7`/`#1D1D1F`; xóa hết mint/cyan/cam
  hardcode; nav + bottom-nav frosted (`blur(20px) saturate(180%)`).
  Sáng/tối qua `data-theme` + toggle ở bottom nav + theo hệ điều hành.
- Bo góc 12–24px, card padding 24px, shadow 2 lớp mờ; bỏ nền gradient/orb/grid.
- Motion: spring `cubic-bezier(0.32,0.72,0,1)`; nút `:active scale(0.96)`;
  card hover `translateY(-4px)`; vào trang fade+slide 350ms; reveal duy nhất
  qua Intersection Observer; chỉ animate transform/opacity;
  `prefers-reduced-motion` tắt animation.
- Bỏ GSAP CDN (từng là SPOF làm chết toàn bộ script trang khi offline) →
  vanilla rAF/IO cùng tên hàm; icon emoji trong nav/nút → SVG stroke mảnh;
  class `pill-lg.accent` → `pill-lg.primary`.
- Không dùng Framer Motion/React/Radix (site là MPA tĩnh, viết lại React vượt
  phạm vi) — tương đương vanilla đã áp dụng; khoảng cách section desktop
  64–96px chưa đạt hết (inline margin cũ) — việc tiếp theo.
- Test local 2026-09-16: P5 49/49 + E2E 17/17 pass; `app.js` qua `node --check`;
  grep hết `accent2`/màu cũ/GSAP/picsum.

## Deploy web (2026-09-16)

- `vercel.json`: thêm `installCommand`/`buildCommand` cho server (trước đây
  thiếu nên `server/dist` không bao giờ được build trên Vercel).
- `render.yaml` + `railway.json`: chuyển từ `uvicorn api_server:app` (FastAPI
  cũ, hard-code `D:/huy/...`, tự `exit(1)`) sang Node
  (`node server/dist/index.js`) + health check `/health` + `NODE_ENV`.
- CI: cài/build đúng thư mục server, E2E smoke bằng ảnh thật (Pillow tạo ảnh
  xanh/nâu, assert prediction khác nhau, `/models`, 3 trang 200), Vercel CLI
  hỗ trợ project đã link, bỏ bước build trùng.

## Lịch sử trước đây (từ git log)

- 2025-12-31 `377762e4` Deploy: add python api and render config
- 2025-12-23 `43e045e9` chore: add deploy configs, CI/CD workflow; ignore .env
  and remove from index
- 2025-11-12 `7924216c` Add best_leaf_ai.h5 premium model endpoint
- 2025-11-12 `534cd69a` Add auto-training system with incremental learning
- 2025-11-05 `59c95b11` Add HuggingFace model download on startup - 6 H5 models
- 2025-11-05 `52d4c9f9` Add multi-model ensemble endpoint with 6 H5 models
- 2025-11-04 `22264573` Remove large model files (auto-download from HuggingFace)
- 2025-11-04 `e1fce96f` Leaf disease detector - Ready for deployment
- 2025-10-15 `17a9d233` / `429f7e98` Init repo
