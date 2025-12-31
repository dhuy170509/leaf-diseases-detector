import logging
from typing import Dict, Tuple

import numpy as np
import torch
from PIL import Image
from transformers import ViTFeatureExtractor, ViTForImageClassification

from disease_knowledge import LABEL_INFO

MODEL_NAME = "wambugu71/crop_leaf_diseases_vit"
PREDICT_THRESHOLD = 0.60
BLUR_THRESHOLD = 25.0  # lower variance => blurrier

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")


class _HFSingleton:
    extractor: ViTFeatureExtractor = None
    model: ViTForImageClassification = None
    device: torch.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")


def load_model() -> None:
    if _HFSingleton.model is not None:
        return
    logging.info("Loading HuggingFace model: %s on %s", MODEL_NAME, _HFSingleton.device)
    _HFSingleton.extractor = ViTFeatureExtractor.from_pretrained(MODEL_NAME)
    _HFSingleton.model = ViTForImageClassification.from_pretrained(MODEL_NAME)
    _HFSingleton.model.to(_HFSingleton.device)
    _HFSingleton.model.eval()
    _warmup()


def _warmup() -> None:
    dummy = Image.new("RGB", (224, 224), color=(0, 128, 0))
    _predict_internal(dummy)


def _softmax(t: torch.Tensor) -> torch.Tensor:
    return torch.nn.functional.softmax(t, dim=-1)


def _is_blurry(image: Image.Image) -> Tuple[bool, float]:
    gray = image.convert("L")
    arr = np.asarray(gray, dtype=np.float32)
    gy, gx = np.gradient(arr)
    focus = float(np.var(gx) + np.var(gy))
    return focus < BLUR_THRESHOLD, focus


def _predict_internal(image: Image.Image) -> Tuple[str, float]:
    inputs = _HFSingleton.extractor(images=image, return_tensors="pt")
    inputs = {k: v.to(_HFSingleton.device) for k, v in inputs.items()}
    with torch.no_grad():
        logits = _HFSingleton.model(**inputs).logits
        probs = _softmax(logits)[0]
        conf, idx = torch.max(probs, dim=-1)
    label = _HFSingleton.model.config.id2label[idx.item()]
    return label, float(conf.item())


def predict_image(path: str) -> Dict[str, object]:
    load_model()
    image = Image.open(path).convert("RGB")
    resized = image.resize((224, 224), Image.BILINEAR)

    is_blurry, focus = _is_blurry(image)
    if is_blurry:
        return {
            "label": "Uncertain",
            "label_vi": "Không chắc chắn (ảnh mờ)",
            "crop_vi": None,
            "disease_vi": None,
            "confidence": 0.0,
            "severity": "Không xác định",
            "treatment": [],
            "chemical_suggestions": [],
            "prevention": [],
            "uncertain": True,
            "is_blurry": True,
            "blur_score": round(focus, 4),
        }

    label, confidence = _predict_internal(resized)
    info = LABEL_INFO.get(label)
    uncertain = confidence < PREDICT_THRESHOLD or info is None

    if uncertain:
        return {
            "label": label,
            "label_vi": "Không chắc chắn",
            "crop_vi": info.get("crop_vi") if info else None,
            "disease_vi": None,
            "confidence": round(confidence, 4),
            "severity": "Không xác định",
            "treatment": [],
            "chemical_suggestions": [],
            "prevention": [],
            "uncertain": True,
            "is_blurry": False,
        }

    return {
        "label": label,
        "label_vi": info.get("disease_vi"),
        "crop_vi": info.get("crop_vi"),
        "disease_vi": info.get("disease_vi"),
        "confidence": round(confidence, 4),
        "severity": info.get("severity"),
        "treatment": info.get("treatment", []),
        "chemical_suggestions": info.get("chemical_suggestions", []),
        "prevention": info.get("prevention", []),
        "uncertain": False,
        "is_blurry": False,
    }


__all__ = [
    "MODEL_NAME",
    "PREDICT_THRESHOLD",
    "load_model",
    "predict_image",
]
