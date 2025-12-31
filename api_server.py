import io
import logging
import os
import sys
import time
from pathlib import Path
from typing import Dict, List

import torch
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image
from transformers import AutoImageProcessor, ResNetForImageClassification

from engine_runtime import get_engine, get_progress_bus
from disease_knowledge import LABEL_INFO

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

ROOT = Path(__file__).resolve().parent
MODELS_ROOT = Path(r"D:/huy/leaf-disease-detector-1/models")
os.environ.setdefault("MODELS_DIR", str(MODELS_ROOT))
STATIC_FILES = {"/style.css": ROOT / "style.css", "/main.js": ROOT / "main.js"}
FRONTEND_DIR = ROOT / "frontend"
RICE_RESNET_DIR = MODELS_ROOT / "rice_resnet152"
MAX_W, MAX_H = 3000, 3000
MIN_W, MIN_H = 64, 64
RATE_LIMIT = {"window": 60, "limit": 60}
_RATE_BUCKETS: Dict[str, List[float]] = {}

app = FastAPI(title="Meta Ensemble Inference", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/static", StaticFiles(directory=str(ROOT)), name="static")
if FRONTEND_DIR.exists():
    app.mount("/static/frontend", StaticFiles(directory=str(FRONTEND_DIR)), name="frontend")
engine = get_engine()
progress_bus = get_progress_bus()

# Load dedicated rice ResNet152 classifier (8 classes)
_rice_processor = None
_rice_model = None
_rice_labels = {
    0: "Bacterial Leaf Blight",
    1: "Brown Spot",
    2: "Healthy Rice Leaf",
    3: "Leaf Blast",
    4: "Leaf scald",
    5: "Narrow Brown Leaf Spot",
    6: "Rice Hispa",
    7: "Sheath Blight",
}

try:
    if RICE_RESNET_DIR.exists():
        _rice_processor = AutoImageProcessor.from_pretrained(str(RICE_RESNET_DIR), local_files_only=True)
        _rice_model = ResNetForImageClassification.from_pretrained(str(RICE_RESNET_DIR), local_files_only=True)
        _rice_model.eval()
        logger.info("Loaded rice_resnet152 model for direct inference")
    else:
        logger.warning("Rice ResNet directory not found: %s", RICE_RESNET_DIR)
except Exception as exc:  # pragma: no cover
    logger.error("Failed to load rice_resnet152: %s", exc)

# Log loaded models on startup for auditability
for m in engine.list_models():
    logger.info("Loaded model %s | input=%s | status=%s | path=%s", m.get("name"), m.get("input"), m.get("status"), m.get("path"))
logger.info("Model scan summary | total=%s | ok=%s | broken=%s", getattr(engine, "stats_total", 0), getattr(engine, "stats_ok", 0), getattr(engine, "stats_broken", 0))

# Safety gate: lock production if any model is broken
stats_total = getattr(engine, "stats_total", 0)
stats_ok = getattr(engine, "stats_ok", 0)
stats_broken = getattr(engine, "stats_broken", 0)
failed = [m.get("name") for m in engine.list_models() if m.get("status") == "BROKEN"]
if stats_broken > 0 or stats_total == 0 or stats_ok != stats_total:
    logger.error("❌ PRODUCTION LOCKED – BROKEN MODELS DETECTED")
    if failed:
        logger.error("Broken models: %s", ", ".join(failed))
    sys.exit(1)
else:
    logger.info("✅ ALL MODELS OK – PRODUCTION UNLOCKED")


def _read_image(upload: UploadFile) -> Image.Image:
    try:
        data = upload.file.read()
        img = Image.open(io.BytesIO(data)).convert("RGB")
        if img.width > MAX_W or img.height > MAX_H:
            raise HTTPException(status_code=400, detail="Ảnh quá lớn (max 3000x3000)")
        if img.width < MIN_W or img.height < MIN_H:
            raise HTTPException(status_code=400, detail="Ảnh quá nhỏ (min 64x64)")
        return img
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Ảnh không hợp lệ: {exc}")


@app.middleware("http")
async def rate_limit(request: Request, call_next):
    # lightweight in-memory bucket per client IP
    if request.url.path.startswith("/static"):
        return await call_next(request)
    ip = request.client.host if request.client else "unknown"
    now = time.time()
    window = RATE_LIMIT["window"]
    limit = RATE_LIMIT["limit"]
    bucket = [t for t in _RATE_BUCKETS.get(ip, []) if now - t < window]
    if len(bucket) >= limit:
        return JSONResponse({"detail": "Rate limit exceeded"}, status_code=429)
    bucket.append(now)
    _RATE_BUCKETS[ip] = bucket
    return await call_next(request)


@app.get("/", response_class=HTMLResponse)
async def root():
    index_path = ROOT / "index.html"
    if not index_path.exists():
        return HTMLResponse("UI not found", status_code=404)
    return FileResponse(index_path)


@app.get("/frontend/{page}")
async def serve_frontend(page: str):
    path = FRONTEND_DIR / page
    if not path.exists():
        raise HTTPException(status_code=404, detail="Not found")
    return FileResponse(path)


@app.get("/style.css")
async def css():
    return FileResponse(STATIC_FILES["/style.css"])


@app.get("/main.js")
async def js():
    return FileResponse(STATIC_FILES["/main.js"])


@app.get("/health")
async def health():
    snapshot = engine.health()
    return snapshot


@app.get("/system_status")
async def system_status():
    stats_total = getattr(engine, "stats_total", 0)
    stats_ok = getattr(engine, "stats_ok", 0)
    stats_broken = getattr(engine, "stats_broken", 0)
    system_state = "UNLOCKED" if stats_total > 0 and stats_broken == 0 and stats_ok == stats_total else "LOCKED"
    return {
        "system": system_state,
        "total_models": stats_total,
        "ok": stats_ok,
        "broken": stats_broken,
    }


@app.post("/predict")
async def predict(file: UploadFile = File(..., alias="image"), crop_name: str = Form(...)):
    # Require crop_name to match a loaded model group
    status = engine.model_status(crop_name)
    if status is None:
        raise HTTPException(status_code=400, detail="Unknown crop_name; no matching model")
    if status != "OK":
        raise HTTPException(status_code=503, detail="❌ MODEL LOCKED – UNAVAILABLE")

    start_ts = time.perf_counter()
    img = _read_image(file)
    result = await engine.predict(img, crop=crop_name)
    if result.get("error"):
        return JSONResponse(result, status_code=400)

    latency_ms = result.get("latency_ms") or (time.perf_counter() - start_ts) * 1000.0

    # Normalize response fields per requirement
    label_key = result.get("label")
    info = LABEL_INFO.get(label_key)

    return {
        "disease_name": result.get("label") or result.get("label_vi"),
        "confidence": result.get("confidence"),
        "model_used": result.get("model_name") or crop_name,
        "processing_time_ms": float(latency_ms),
        "disease_info": {
            "crop_vi": info.get("crop_vi") if info else None,
            "disease_vi": info.get("disease_vi") if info else None,
            "severity": info.get("severity") if info else None,
            "treatment": info.get("treatment", []) if info else [],
            "chemical_suggestions": info.get("chemical_suggestions", []) if info else [],
            "prevention": info.get("prevention", []) if info else [],
        },
        "raw": result,
    }


@app.post("/predict_rice_resnet152")
async def predict_rice_resnet152(file: UploadFile = File(...)):
    if _rice_model is None or _rice_processor is None:
        raise HTTPException(status_code=503, detail="Rice model unavailable")

    img = _read_image(file)
    inputs = _rice_processor(images=img, return_tensors="pt")
    with torch.no_grad():
        logits = _rice_model(**inputs).logits
    probs = torch.softmax(logits, dim=1)[0]
    top = int(torch.argmax(probs).item())
    conf = float(probs[top].item())

    label_text = _rice_labels.get(top, str(top))
    info = LABEL_INFO.get(label_text)

    return {
        "class_id": top,
        "label": label_text,
        "confidence": conf,
        "probs": {str(i): float(probs[i].item()) for i in range(probs.shape[0])},
        "disease_info": {
            "crop_vi": info.get("crop_vi") if info else None,
            "disease_vi": info.get("disease_vi") if info else None,
            "severity": info.get("severity") if info else None,
            "treatment": info.get("treatment", []) if info else [],
            "chemical_suggestions": info.get("chemical_suggestions", []) if info else [],
            "prevention": info.get("prevention", []) if info else [],
        },
    }


@app.post("/batch_predict")
async def batch_predict(files: List[UploadFile] = File(...)):
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    outputs: List[Dict[str, object]] = []
    for f in files:
        img = _read_image(f)
        outputs.append(await engine.predict(img))
    return {"predictions": outputs}


@app.get("/models")
async def models():
    return engine.list_models()


@app.post("/contact")
async def contact(payload: Dict[str, object]):
    logger.warning("Contact message: %s", payload)
    return {"status": "ok"}


@app.get("/stats")
async def stats():
    # placeholder: would normally query DB/analytics
    return {"by_crop": [], "total": 0}


@app.get("/progress")
async def progress_stream():
    queue = progress_bus.register()

    async def event_generator():
        while True:
            event = await queue.get()
            data = JSONResponse(content=event).body.decode("utf-8")
            yield f"data: {data}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("api_server:app", host="0.0.0.0", port=8000, reload=False)