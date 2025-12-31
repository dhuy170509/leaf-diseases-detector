import hashlib
import json
import logging
import os
from datetime import datetime, timezone
from typing import Dict, List

from flask import Flask, jsonify, render_template, request, send_from_directory
from werkzeug.utils import secure_filename

from hf_model import MODEL_NAME, PREDICT_THRESHOLD, load_model, predict_image

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
DATABASE_DIR = os.path.join(BASE_DIR, "database")
PREDICT_LOG = os.path.join(DATABASE_DIR, "predictions.jsonl")
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(DATABASE_DIR, exist_ok=True)
if not os.path.exists(PREDICT_LOG):
    open(PREDICT_LOG, "a", encoding="utf-8").close()

_cache: Dict[str, Dict[str, object]] = {}

load_model()

app = Flask(
    __name__,
    template_folder="templates",
    static_folder="static",
)


def _hash_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def _log_prediction(entry: Dict[str, object]) -> None:
    with open(PREDICT_LOG, "a", encoding="utf-8") as fh:
        fh.write(json.dumps(entry, ensure_ascii=False) + "\n")


def _read_history(limit: int = 20) -> List[Dict[str, object]]:
    if not os.path.exists(PREDICT_LOG):
        return []
    with open(PREDICT_LOG, "r", encoding="utf-8") as fh:
        lines = fh.readlines()[-limit:]
    return [json.loads(line) for line in lines if line.strip()]


@app.route("/", methods=["GET"])
def home():
    return render_template("result.html")


@app.route("/result.html", methods=["GET"])
def legacy_result():
    return render_template("result.html")


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": MODEL_NAME, "threshold": PREDICT_THRESHOLD})


@app.route("/uploads/<path:filename>", methods=["GET"])
def serve_upload(filename: str):
    return send_from_directory(UPLOAD_DIR, filename)


@app.route("/history", methods=["GET"])
def history():
    return jsonify(_read_history(limit=20))


@app.route("/predict", methods=["POST"])
def predict():
    if "file" not in request.files:
        return jsonify({"error": "Vui lòng chọn ảnh lá cây."}), 400

    file = request.files["file"]
    if not file.filename:
        return jsonify({"error": "Tên tệp không hợp lệ."}), 400

    safe_name = secure_filename(file.filename)
    timestamp = datetime.now(timezone.utc)
    filename = f"{timestamp.strftime('%Y%m%d_%H%M%S_%f')}_{safe_name or 'upload.jpg'}"
    save_path = os.path.join(UPLOAD_DIR, filename)
    file.save(save_path)

    file_hash = _hash_file(save_path)

    if file_hash in _cache:
        result = _cache[file_hash]
    else:
        result = predict_image(save_path)
        _cache[file_hash] = result

    if result.get("is_blurry"):
        return jsonify({
            "error": "Ảnh bị mờ, vui lòng chụp lại rõ nét.",
            "label": "Không chắc chắn",
            "uncertain": True,
        }), 400

    response = {
        "label": result.get("label_vi") or result.get("label"),
        "label_en": result.get("label"),
        "crop": result.get("crop_vi"),
        "disease": result.get("disease_vi"),
        "confidence": result.get("confidence"),
        "severity": result.get("severity"),
        "treatment": result.get("treatment"),
        "chemical_suggestions": result.get("chemical_suggestions"),
        "prevention": result.get("prevention"),
        "uncertain": result.get("uncertain", False),
        "image_url": f"/uploads/{filename}",
        "timestamp": timestamp.isoformat(),
        "hash": file_hash,
    }

    if response["uncertain"]:
        response["message"] = "Không chắc chắn (độ tin cậy thấp). Vui lòng thử ảnh khác."

    _log_prediction(response)

    return jsonify(response)


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=False)