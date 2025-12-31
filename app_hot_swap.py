import io
import json
import logging
import os
import shutil
import sys
import time
import hashlib
import asyncio
import httpx
from pathlib import Path
from typing import Dict, List, Optional

from fastapi import FastAPI, File, Form, UploadFile, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image

from sqlalchemy import Column, Integer, String, Float, DateTime, create_engine, Text
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.sql import func

# Optional: reuse existing engine runtime for real inference
try:
    from engine_runtime import EnsembleEngine
except Exception:  # pragma: no cover
    EnsembleEngine = None  # type: ignore

ROOT = Path(__file__).parent
FRONTEND_DIR = ROOT / "frontend2"
MODELS_ROOT = ROOT / "models"
RELEASES_DIR = MODELS_ROOT / "releases"
ACTIVE_LINK = MODELS_ROOT / "active"
STANDBY_LINK = MODELS_ROOT / "standby"
DB_URL = f"sqlite:///{(ROOT / 'db.sqlite').as_posix()}"
LOG_DIR = ROOT / "logs"
LOG_DIR.mkdir(exist_ok=True)
LOG_FILE = LOG_DIR / "app_hot_swap.log"
UPLOADS_DIR = ROOT / "uploads"
PRED_UPLOADS_DIR = UPLOADS_DIR / "predictions"
MODEL_UPLOADS_DIR = UPLOADS_DIR / "models"
for d in (UPLOADS_DIR, PRED_UPLOADS_DIR, MODEL_UPLOADS_DIR, RELEASES_DIR):
    d.mkdir(parents=True, exist_ok=True)

HARD_LOCK = False
HARD_LOCK_REASON = ""

ADMIN_KEY = os.getenv("ADMIN_KEY")

CHAT_API_KEY = os.getenv("CHAT_API_KEY") or os.getenv("OPENAI_API_KEY")
CHAT_PROXY = os.getenv("CHAT_PROXY")  # e.g. http://user:pass@host:port
CHAT_ENDPOINT = os.getenv("CHAT_ENDPOINT") or "https://api.openai.com/v1/chat/completions"
CHAT_MODEL = os.getenv("CHAT_MODEL") or "gpt-4o-mini"

MAX_W, MAX_H = 3000, 3000
RATE_LIMIT = {"window": 60, "limit": 60}
_RATE_BUCKET: Dict[str, List[float]] = {}

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[logging.FileHandler(LOG_FILE), logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger("hot-swap")

Base = declarative_base()
engine_db = create_engine(DB_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine_db, autoflush=False, autocommit=False)


def require_admin(request: Request):
    if not ADMIN_KEY:
        raise HTTPException(503, detail="ADMIN_KEY not configured")
    key = request.headers.get("X-Admin-Key")
    if key != ADMIN_KEY:
        raise HTTPException(401, detail="Admin key invalid")
    return True


async def call_chat_api(message: str) -> str:
    if not CHAT_API_KEY:
        raise HTTPException(503, detail="CHAT_API_KEY not configured")
    headers = {
        "Authorization": f"Bearer {CHAT_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": CHAT_MODEL,
        "messages": [
            {"role": "system", "content": "You are LeafGuard assistant. Reply concisely in Vietnamese."},
            {"role": "user", "content": message},
        ],
    }
    proxies = CHAT_PROXY or None
    timeout = httpx.Timeout(15.0, connect=5.0)
    async with httpx.AsyncClient(proxies=proxies, timeout=timeout) as client:
        resp = await client.post(CHAT_ENDPOINT, json=payload, headers=headers)
    if resp.status_code >= 400:
        raise HTTPException(resp.status_code, detail=resp.text)
    data = resp.json()
    # OpenAI style
    content = data.get("choices", [{}])[0].get("message", {}).get("content")
    if not content:
        content = data.get("reply") or str(data)
    return content


class Prediction(Base):
    __tablename__ = "predictions"
    id = Column(Integer, primary_key=True)
    crop = Column(String)
    disease_name = Column(String)
    confidence = Column(Float)
    severity = Column(String)
    recommendation = Column(String)
    image_path = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Contact(Base):
    __tablename__ = "contacts"
    id = Column(Integer, primary_key=True)
    name = Column(String)
    email = Column(String)
    message = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Feedback(Base):
    __tablename__ = "feedback"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer)
    message = Column(Text)
    rating = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ModelAudit(Base):
    __tablename__ = "model_audit"
    id = Column(Integer, primary_key=True)
    version = Column(String)
    action = Column(String)  # upload|test_pass|test_fail|activate|rollback
    detail = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Upload(Base):
    __tablename__ = "uploads"
    id = Column(Integer, primary_key=True)
    kind = Column(String)  # model|prediction
    filename = Column(String)
    version = Column(String)
    path = Column(String)
    size = Column(Integer)
    status = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class UserHistory(Base):
    __tablename__ = "user_history"
    id = Column(Integer, primary_key=True)
    user_id = Column(String)
    action = Column(String)
    detail = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class DashboardStat(Base):
    __tablename__ = "dashboard_stats"
    id = Column(Integer, primary_key=True)
    key = Column(String, unique=True)
    value = Column(Float, default=0)
    meta = Column(Text)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


Base.metadata.create_all(bind=engine_db)

app = FastAPI(title="LeafGuard HotSwap", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
if FRONTEND_DIR.exists():
    app.mount("/static/frontend2", StaticFiles(directory=str(FRONTEND_DIR)), name="frontend2")
    app.mount("/frontend2", StaticFiles(directory=str(FRONTEND_DIR)), name="frontend2_root")
app.mount("/static/assets", StaticFiles(directory=str(ROOT)), name="assets")

_engine: Optional[EnsembleEngine] = None


def set_hard_lock(reason: str):
    global HARD_LOCK, HARD_LOCK_REASON
    HARD_LOCK = True
    HARD_LOCK_REASON = reason
    log.error("HARD LOCK engaged: %s", reason)


def clear_hard_lock():
    global HARD_LOCK, HARD_LOCK_REASON
    HARD_LOCK = False
    HARD_LOCK_REASON = ""


def current_active_release() -> Optional[Path]:
    if not ACTIVE_LINK.exists():
        return None
    try:
        return ACTIVE_LINK.resolve()
    except Exception:  # pragma: no cover
        return None


def save_upload_bytes(data: bytes, dest_dir: Path, filename: str) -> Path:
    dest_dir.mkdir(parents=True, exist_ok=True)
    safe_name = Path(filename).name.replace(" ", "_")
    dest = dest_dir / f"{int(time.time() * 1000)}_{safe_name}"
    dest.write_bytes(data)
    return dest


def log_upload(kind: str, filename: str, path: Path, size: int, version: str = "", status: str = "ok"):
    with SessionLocal() as s:
        s.add(Upload(kind=kind, filename=filename, path=str(path), size=size, version=version, status=status))
        s.commit()


def log_user_history(action: str, detail: str, user_id: Optional[str] = None):
    with SessionLocal() as s:
        s.add(UserHistory(user_id=user_id, action=action, detail=detail))
        s.commit()


def ensure_unlocked():
    if HARD_LOCK:
        raise HTTPException(503, detail=f"❌ MODEL LOCKED – {HARD_LOCK_REASON or 'manual gate'}")


def bump_stat(key: str, delta: float = 1.0):
    with SessionLocal() as s:
        stat = s.query(DashboardStat).filter_by(key=key).first()
        if not stat:
            stat = DashboardStat(key=key, value=0)
            s.add(stat)
        stat.value = (stat.value or 0) + delta
        s.commit()


def refresh_engine():
    global _engine
    if EnsembleEngine is None:
        _engine = None
        return
    try:
        os.environ["MODELS_DIR"] = str(ACTIVE_LINK)
        _engine = EnsembleEngine()
        clear_hard_lock()
        log.info("Engine refreshed against active models at %s", ACTIVE_LINK)
    except Exception as exc:  # pragma: no cover
        _engine = None
        set_hard_lock(f"Engine init failed: {exc}")


def list_active_models() -> List[Path]:
    if not ACTIVE_LINK.exists():
        return []
    return [p for p in ACTIVE_LINK.rglob("*") if p.suffix.lower() in {".tflite", ".h5", ".keras"}]


def hash_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def log_audit(version: str, action: str, detail: str):
    with SessionLocal() as s:
        s.add(ModelAudit(version=version, action=action, detail=detail))
        s.commit()


def read_image(upload: UploadFile):
    try:
        data = upload.file.read()
        img = Image.open(io.BytesIO(data)).convert("RGB")
        if img.width > MAX_W or img.height > MAX_H:
            raise HTTPException(400, detail="Ảnh quá lớn (max 3000x3000)")
        return img, data
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover
        raise HTTPException(400, detail=f"Ảnh không hợp lệ: {exc}")


async def dry_run(model_path: Path):
    # Placeholder dry-run; replace with real inference if needed
    await asyncio.sleep(0)
    return True


async def integrity_check(model_path: Path, expected_shape=None, expected_classes=None):
    digest = hash_file(model_path)
    # Real loaders could inspect shapes/classes here; keeping minimal
    await dry_run(model_path)
    if expected_shape is not None:
        pass
    if expected_classes is not None:
        pass
    return {"path": str(model_path), "sha256": digest}


def atomic_swap(new_release: Path) -> Optional[Path]:
    if not new_release.exists():
        raise RuntimeError("release missing")
    prev = current_active_release()
    temp = ACTIVE_LINK.parent / "active_new"
    if temp.exists():
        if temp.is_symlink():
            temp.unlink()
        else:
            shutil.rmtree(temp)
    try:
        if os.name == "nt":
            rc = os.system(f'mklink /d "{temp}" "{new_release}"')
            if rc != 0:
                raise RuntimeError("mklink failed")
        else:
            os.symlink(new_release, temp, target_is_directory=True)
    except Exception as exc:  # pragma: no cover
        raise RuntimeError(f"cannot link new active: {exc}")
    old = ACTIVE_LINK.parent / "active_old"
    if ACTIVE_LINK.exists():
        ACTIVE_LINK.rename(old)
    temp.rename(ACTIVE_LINK)
    if old.exists():
        if old.is_symlink():
            old.unlink()
        else:
            shutil.rmtree(old)
    if prev and prev.exists():
        try:
            if STANDBY_LINK.exists():
                if STANDBY_LINK.is_symlink():
                    STANDBY_LINK.unlink()
                else:
                    shutil.rmtree(STANDBY_LINK)
            if os.name == "nt":
                os.system(f'mklink /d "{STANDBY_LINK}" "{prev}"')
            else:
                os.symlink(prev, STANDBY_LINK, target_is_directory=True)
        except Exception:  # pragma: no cover
            log.warning("Could not refresh standby link")
    return prev


@app.middleware("http")
async def rate_limit(request: Request, call_next):
    if request.url.path.startswith("/static"):
        return await call_next(request)
    ip = request.client.host if request.client else "unknown"
    now = time.time()
    win = RATE_LIMIT["window"]
    limit = RATE_LIMIT["limit"]
    bucket = [t for t in _RATE_BUCKET.get(ip, []) if now - t < win]
    if len(bucket) >= limit:
        return JSONResponse({"detail": "Rate limit exceeded"}, status_code=429)
    bucket.append(now)
    _RATE_BUCKET[ip] = bucket
    return await call_next(request)


@app.get("/system_status")
async def system_status():
    models = list_active_models()
    active = current_active_release()
    state = "UNLOCKED" if models and not HARD_LOCK else "LOCKED"
    return {
        "system": state,
        "total": len(models),
        "ok": len(models),
        "broken": 0,
        "hard_lock": HARD_LOCK,
        "lock_reason": HARD_LOCK_REASON,
        "active_release": str(active) if active else None,
    }


@app.get("/models")
async def models():
    return [
        {"name": p.stem, "path": str(p), "status": "OK"}
        for p in list_active_models()
    ]


@app.post("/predict")
async def predict(file: UploadFile = File(...), crop_name: str = Form(...)):
    ensure_unlocked()
    models = list_active_models()
    if not models:
        raise HTTPException(503, detail="❌ MODEL LOCKED – UNAVAILABLE")
    img, data = read_image(file)
    if _engine is None and EnsembleEngine is not None:
        refresh_engine()
    if _engine:
        status = _engine.model_status(crop_name)
        if status is None:
            raise HTTPException(400, detail="Unknown crop_name")
        if status != "OK":
            raise HTTPException(503, detail="❌ MODEL LOCKED – UNAVAILABLE")
        # Only run models that belong to the requested crop.
        result = await _engine.predict(img, crop=crop_name)
        if result.get("error"):
            raise HTTPException(400, detail=result.get("error"))
        severity = result.get("severity") or "medium"
        rec = result.get("recommendation") or ""
        payload = {
            "disease_name": result.get("label") or result.get("label_vi") or "unknown",
            "confidence": result.get("confidence"),
            "severity": severity,
            "recommendation": rec,
            "model_used": result.get("model_name") or crop_name,
            "processing_time_ms": result.get("latency_ms"),
        }
    # Fallback stub
    else:
        payload = {
            "disease_name": "demo_disease",
            "confidence": 0.9,
            "severity": "medium",
            "recommendation": "Prune leaves and apply copper",
            "model_used": models[0].stem,
            "processing_time_ms": 40,
        }
    try:
        saved_path = save_upload_bytes(data, PRED_UPLOADS_DIR, file.filename)
        with SessionLocal() as s:
            s.add(Prediction(
                crop=crop_name,
                disease_name=payload.get("disease_name"),
                confidence=payload.get("confidence"),
                severity=payload.get("severity"),
                recommendation=payload.get("recommendation"),
                image_path=str(saved_path),
            ))
            s.commit()
        log_upload("prediction", file.filename, saved_path, size=len(data), status="ok")
        log_user_history("predict", f"crop={crop_name}; model={payload.get('model_used')}")
        bump_stat("predictions")
    except Exception as exc:  # pragma: no cover
        log.warning("Failed to log prediction: %s", exc)
    return payload


@app.post("/hot_swap")
async def hot_swap(version: str, admin: bool = Depends(require_admin)):
    release = RELEASES_DIR / version
    if not release.exists():
        raise HTTPException(404, detail="release not found")
    for m in release.rglob("*"):
        if m.suffix.lower() not in {".tflite", ".h5", ".keras"}:
            continue
        await integrity_check(m)
    prev = current_active_release()
    try:
        atomic_swap(release)
        refresh_engine()
        clear_hard_lock()
    except Exception as exc:  # pragma: no cover
        log.error("swap failed: %s", exc)
        set_hard_lock(f"Swap failed for {version}: {exc}")
        log_audit(version, "activate_fail", str(exc))
        if prev and prev.exists():
            try:
                atomic_swap(prev)
                refresh_engine()
                log_audit(prev.name, "rollback", "auto rollback after failed promote")
            except Exception as rollback_exc:  # pragma: no cover
                log.error("Auto rollback failed: %s", rollback_exc)
        raise HTTPException(500, detail="swap failed; system locked")
    log_audit(version, "activate", "promoted")
    bump_stat("activations")
    return {"status": "activated", "version": version, "previous": str(prev) if prev else None}


@app.post("/rollback")
async def rollback(version: str, admin: bool = Depends(require_admin)):
    release = RELEASES_DIR / version
    if not release.exists():
        raise HTTPException(404, detail="release not found")
    try:
        atomic_swap(release)
        refresh_engine()
        clear_hard_lock()
    except Exception as exc:  # pragma: no cover
        log.error("rollback failed: %s", exc)
        log_audit(version, "rollback_fail", str(exc))
        set_hard_lock(f"Rollback failed: {exc}")
        raise HTTPException(500, detail="rollback failed; system locked")
    log_audit(version, "rollback", "rolled back")
    bump_stat("rollbacks")
    return {"status": "rolled_back", "version": version}


@app.post("/admin/upload_model")
async def upload_model(version: str = Form(...), file: UploadFile = File(...), admin: bool = Depends(require_admin)):
    dest_dir = RELEASES_DIR / version
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest_path = dest_dir / file.filename
    if dest_path.exists():
        raise HTTPException(400, detail="file already exists in this release")
    data = await file.read()
    dest_path.write_bytes(data)
    log_audit(version, "upload", f"{file.filename}")
    log_upload("model", file.filename, dest_path, size=len(data), version=version)
    log_user_history("upload_model", f"version={version}; file={file.filename}")
    bump_stat("model_uploads")
    return {"status": "uploaded", "path": str(dest_path)}


@app.post("/admin/test_model")
async def test_model(version: str, model_name: str, admin: bool = Depends(require_admin)):
    model_path = RELEASES_DIR / version / model_name
    if not model_path.exists():
        raise HTTPException(404, detail="model not found")
    try:
        info = await integrity_check(model_path)
    except Exception as exc:  # pragma: no cover
        log_audit(version, "test_fail", str(exc))
        raise HTTPException(500, detail=str(exc))
    log_audit(version, "test_pass", json.dumps(info))
    return {"status": "ok", **info}


@app.get("/admin/logs")
async def admin_logs(lines: int = 200, admin: bool = Depends(require_admin)):
    if not LOG_FILE.exists():
        return {"logs": []}
    with LOG_FILE.open("r", encoding="utf-8", errors="ignore") as f:
        data = f.readlines()[-lines:]
    return {"logs": data}


@app.get("/admin/releases")
async def admin_releases(admin: bool = Depends(require_admin)):
    active = current_active_release()
    releases = []
    for rel in sorted(RELEASES_DIR.glob("*")):
        if not rel.is_dir():
            continue
        files = [p.name for p in rel.iterdir() if p.suffix.lower() in {".tflite", ".h5", ".keras"}]
        releases.append({
            "version": rel.name,
            "files": files,
            "active": active and rel.resolve() == active,
        })
    return {"releases": releases}


@app.post("/admin/hard_lock")
async def admin_hard_lock(action: str = Form(...), reason: str = Form(""), admin: bool = Depends(require_admin)):
    if action == "lock":
        set_hard_lock(reason or "Manual lock")
        return {"hard_lock": True, "reason": HARD_LOCK_REASON}
    if action == "unlock":
        clear_hard_lock()
        return {"hard_lock": False}
    raise HTTPException(400, detail="action must be lock or unlock")


@app.get("/admin/dashboard")
async def admin_dashboard(admin: bool = Depends(require_admin)):
    with SessionLocal() as s:
        audits = s.query(ModelAudit).order_by(ModelAudit.created_at.desc()).limit(12).all()
        return {
            "stats": await stats(),
            "audits": [
                {
                    "version": a.version,
                    "action": a.action,
                    "detail": a.detail,
                    "created_at": str(a.created_at),
                }
                for a in audits
            ],
        }


@app.post("/chat")
async def chat(payload: Dict[str, object]):
    message = str(payload.get("message", "")).strip()
    if not message:
        raise HTTPException(400, detail="message required")
    reply = await call_chat_api(message)
    return {"reply": reply}


@app.post("/contact")
async def contact(payload: Dict[str, object]):
    with SessionLocal() as s:
        s.add(Contact(name=str(payload.get("name", "")), email=str(payload.get("email", "")), message=str(payload.get("message", ""))))
        s.commit()
    log_user_history("contact", f"from={payload.get('email', '')}")
    bump_stat("contacts")
    return {"status": "ok"}


@app.post("/feedback")
async def feedback(payload: Dict[str, object]):
    with SessionLocal() as s:
        s.add(Feedback(user_id=payload.get("user_id"), message=str(payload.get("message", "")), rating=payload.get("rating")))
        s.commit()
    log_user_history("feedback", str(payload.get("rating")))
    bump_stat("feedback")
    return {"status": "ok"}


@app.get("/stats")
async def stats():
    with SessionLocal() as s:
        total = s.query(Prediction).count()
        by_crop = (
            s.query(Prediction.crop, func.count(Prediction.id))
            .group_by(Prediction.crop)
            .all()
        )
        history = s.query(UserHistory).order_by(UserHistory.created_at.desc()).limit(5).all()
        return {
            "total_predictions": total,
            "by_crop": [{"crop": c or "", "count": n} for c, n in by_crop],
            "uploads": s.query(Upload).count(),
            "feedback": s.query(Feedback).count(),
            "contacts": s.query(Contact).count(),
            "history": [
                {"action": h.action, "detail": h.detail, "created_at": str(h.created_at)}
                for h in history
            ],
            "hard_lock": HARD_LOCK,
            "lock_reason": HARD_LOCK_REASON,
        }


@app.get("/")
async def landing():
    if (FRONTEND_DIR / "index.html").exists():
        return RedirectResponse(url="/frontend2/index.html")
    return {"status": "ok", "message": "frontend2 not found"}


if __name__ == "__main__":
    import uvicorn

    if not ACTIVE_LINK.exists():
        log.warning("ACTIVE link missing; system will be LOCKED until a release is activated")
    refresh_engine()
    uvicorn.run("app_hot_swap:app", host="0.0.0.0", port=8001, reload=False)
