import asyncio
import base64
import hashlib
import io
import json
import logging
import os
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Tuple

import numpy as np
from PIL import Image

try:
    import psutil
except Exception:  # pragma: no cover
    psutil = None

try:
    import tensorflow as tf
except Exception:  # pragma: no cover
    tf = None

try:
    import torch
    from transformers import AutoImageProcessor, AutoModelForImageClassification
except Exception:  # pragma: no cover
    torch = None
    AutoImageProcessor = None
    AutoModelForImageClassification = None

from model_registry import MODELS_ROOT as REGISTRY_ROOT, build_registry, dump_registry_json

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

WORKSPACE = Path(__file__).resolve().parent
MODELS_ROOT = REGISTRY_ROOT
MODEL_DISCOVERY_SNAPSHOT = WORKSPACE / "model_registry.discovered.json"
BROKEN_MODELS_LOG = WORKSPACE / "logs" / "broken_models.log"
IGNORE_DIRS = {"node_modules", "__pycache__", ".git", ".venv", "artifacts", "build", "dist", "data", "client"}
MODEL_REGISTRY_PATH = WORKSPACE / "model_registry.json"
CROP_REGISTRY_PATH = WORKSPACE / "crop_registry.json"


class ProgressBus:
    def __init__(self) -> None:
        self.queues: List[asyncio.Queue] = []

    def register(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue()
        self.queues.append(q)
        return q

    async def send(self, event: str, detail: Optional[str] = None, progress: Optional[float] = None) -> None:
        payload = {"event": event, "detail": detail, "progress": progress}
        drop: List[asyncio.Queue] = []
        for q in self.queues:
            try:
                await q.put(payload)
            except Exception:
                drop.append(q)
        for q in drop:
            if q in self.queues:
                self.queues.remove(q)


progress_bus = ProgressBus()


@dataclass
class ModelSpec:
    plant: str
    path: Path
    arch: str
    input_size: int
    crop: Optional[str] = None
    weight: float = 1.0


@dataclass
class ModelRunner:
    spec: ModelSpec
    backend: str
    model: object
    processor: Optional[object] = None
    labels: List[str] = field(default_factory=list)
    preprocess: Optional[Callable[[Image.Image], object]] = None
    sha256: Optional[str] = None
    file_size: Optional[int] = None
    grad_cam_supported: bool = False
    validation_score: float = 1.0
    status: str = "OK"

    def predict(self, img: Image.Image) -> Tuple[np.ndarray, float]:
        if self.backend == "hf":
            return self._predict_hf(img)
        if self.backend == "tf":
            return self._predict_tf(img)
        if self.backend == "tflite":
            return self._predict_tflite(img)
        if self.backend == "torch":
            return self._predict_torch(img)
        raise RuntimeError("Unsupported backend")

    def _predict_hf(self, img: Image.Image) -> Tuple[np.ndarray, float]:
        if torch is None or self.processor is None or self.model is None:
            raise RuntimeError("Transformers backend not available")
        inputs = self.processor(images=img.convert("RGB"), size=self.spec.input_size, return_tensors="pt")
        with torch.no_grad():
            start = time.perf_counter()
            outputs = self.model(**inputs)
            logits = outputs.logits
            probs = torch.softmax(logits, dim=-1)[0].cpu().numpy()
            latency_ms = (time.perf_counter() - start) * 1000.0
        return probs, latency_ms

    def _predict_tf(self, img: Image.Image) -> Tuple[np.ndarray, float]:
        if tf is None or self.model is None:
            raise RuntimeError("TensorFlow backend not available")
        if self.preprocess:
            arr = self.preprocess(img)
        else:
            arr = np.asarray(img.convert("RGB").resize((self.spec.input_size, self.spec.input_size)), dtype=np.float32) / 255.0
            arr = np.expand_dims(arr, axis=0)
        start = time.perf_counter()
        preds = self.model(arr, training=False)
        latency_ms = (time.perf_counter() - start) * 1000.0
        logits = preds.numpy() if hasattr(preds, "numpy") else np.array(preds)
        if logits.ndim > 2:
            logits = logits.reshape(logits.shape[0], -1)
        probs = logits - np.max(logits, axis=1, keepdims=True)
        probs = np.exp(probs)
        probs = probs / np.sum(probs, axis=1, keepdims=True)
        return probs[0], latency_ms

    def _predict_tflite(self, img: Image.Image) -> Tuple[np.ndarray, float]:
        if tf is None or self.model is None:
            raise RuntimeError("TFLite backend not available")
        interpreter: "tf.lite.Interpreter" = self.model  # type: ignore[assignment]
        input_details = interpreter.get_input_details()[0]
        shape = input_details.get("shape", [])
        arr = np.asarray(img.convert("RGB").resize((self.spec.input_size, self.spec.input_size)), dtype=np.float32) / 255.0
        if len(shape) == 4 and shape[1] == 3:
            arr = np.transpose(arr, (2, 0, 1))
        arr = np.expand_dims(arr, 0)
        interpreter.set_tensor(input_details["index"], arr.astype(input_details["dtype"]))
        start = time.perf_counter()
        interpreter.invoke()
        latency_ms = (time.perf_counter() - start) * 1000.0
        output_details = interpreter.get_output_details()[0]
        logits = interpreter.get_tensor(output_details["index"])
        if logits.ndim > 2:
            logits = logits.reshape(logits.shape[0], -1)
        probs = logits - np.max(logits, axis=1, keepdims=True)
        probs = np.exp(probs)
        probs = probs / np.sum(probs, axis=1, keepdims=True)
        return probs[0], latency_ms

    def _predict_torch(self, img: Image.Image) -> Tuple[np.ndarray, float]:
        if torch is None or self.model is None:
            raise RuntimeError("PyTorch backend not available")
        if self.preprocess:
            arr = self.preprocess(img)
        else:
            arr = np.asarray(img.convert("RGB").resize((self.spec.input_size, self.spec.input_size)), dtype=np.float32) / 255.0
            arr = torch.from_numpy(arr).permute(2, 0, 1).unsqueeze(0).float()
        start = time.perf_counter()
        with torch.no_grad():
            logits = self.model(arr)
        latency_ms = (time.perf_counter() - start) * 1000.0
        if isinstance(logits, (list, tuple)):
            logits = logits[0]
        if hasattr(logits, "detach"):
            logits = logits.detach()
        logits = logits.cpu().numpy()
        if logits.ndim > 2:
            logits = logits.reshape(logits.shape[0], -1)
        probs = logits - np.max(logits, axis=1, keepdims=True)
        probs = np.exp(probs)
        probs = probs / np.sum(probs, axis=1, keepdims=True)
        return probs[0], latency_ms

    def grad_cam(self, img: Image.Image) -> Optional[np.ndarray]:
        if self.backend != "tf" or tf is None:
            return None
        model = self.model
        last_conv = None
        for layer in reversed(model.layers):
            if "conv" in layer.name and hasattr(layer, "output_shape") and len(layer.output_shape) == 4:
                last_conv = layer
                break
        if last_conv is None:
            return None
        processed = np.asarray(img.convert("RGB").resize((self.spec.input_size, self.spec.input_size)), dtype=np.float32) / 255.0
        processed = np.expand_dims(processed, axis=0)
        grad_model = tf.keras.models.Model([model.inputs], [last_conv.output, model.output])
        with tf.GradientTape() as tape:
            conv_outputs, predictions = grad_model(processed)
            top_class = tf.argmax(predictions[0])
            loss = predictions[:, top_class]
        grads = tape.gradient(loss, conv_outputs)
        if grads is None:
            return None
        pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
        conv_outputs = conv_outputs[0]
        conv_outputs *= pooled_grads
        heatmap = tf.reduce_mean(conv_outputs, axis=-1).numpy()
        heatmap = np.maximum(heatmap, 0)
        if heatmap.max() > 0:
            heatmap /= heatmap.max()
        return heatmap


class ModelRegistry:
    def __init__(self, path: Path) -> None:
        self.path = path
        self.data: Dict[str, Dict[str, object]] = {}
        self._load()

    def _load(self) -> None:
        try:
            if self.path.exists():
                self.data = json.loads(self.path.read_text(encoding="utf-8"))
        except Exception as exc:
            logger.warning("Registry load failed: %s", exc)
            self.data = {}

    def save(self) -> None:
        try:
            self.path.write_text(json.dumps(self.data, indent=2, ensure_ascii=False), encoding="utf-8")
        except Exception as exc:
            logger.warning("Registry save failed: %s", exc)

    def key(self, path: Path) -> str:
        return str(path.resolve())

    def is_blacklisted(self, path: Path) -> bool:
        entry = self.data.get(self.key(path)) or {}
        return bool(entry.get("blacklist"))

    def update(self, path: Path, status: str, backend: str, input_size: int, labels: List[str], validation_score: float, error: Optional[str] = None, blacklist: bool = False) -> None:
        self.data[self.key(path)] = {
            "status": status,
            "backend": backend,
            "input_size": input_size,
            "labels": labels,
            "validation_score": validation_score,
            "last_error": error,
            "blacklist": blacklist,
            "updated_ts": time.time(),
        }
        self.save()


class EnsembleEngine:
    def __init__(self) -> None:
        self.runners: List[ModelRunner] = []
        self.failed: List[Dict[str, object]] = []
        self.id2label: List[str] = []
        self.label_to_idx: Dict[str, int] = {}
        self.stats_total: int = 0
        self.stats_ok: int = 0
        self.stats_broken: int = 0
        self.registry = ModelRegistry(MODEL_REGISTRY_PATH)
        self.crop_registry: Dict[str, Dict[str, object]] = self._load_crop_registry()
        self.model_to_crop: Dict[str, str] = self._build_model_crop_index()
        self.crop_sizes: Dict[str, int] = {k: int(v.get("size", 224)) for k, v in self.crop_registry.items()}
        self._init_models()

    def _sha256(self, path: Path) -> Optional[str]:
        try:
            h = hashlib.sha256()
            with path.open("rb") as f:
                for chunk in iter(lambda: f.read(8192), b""):
                    h.update(chunk)
            return h.hexdigest()
        except Exception:
            return None

    def _load_crop_registry(self) -> Dict[str, Dict[str, object]]:
        try:
            if CROP_REGISTRY_PATH.exists():
                return json.loads(CROP_REGISTRY_PATH.read_text(encoding="utf-8"))
        except Exception as exc:
            logger.warning("Failed to load crop registry: %s", exc)
        return {}

    def _build_model_crop_index(self) -> Dict[str, str]:
        mapping: Dict[str, str] = {}
        for crop, cfg in self.crop_registry.items():
            models = cfg.get("models", []) if isinstance(cfg, dict) else []
            for name in models:
                mapping[str(name).lower()] = crop
        return mapping

    def _infer_tf_input_size(self, model: Any, default: int = 224) -> int:
        try:
            shape = getattr(model, "input_shape", None) or (model.inputs[0].shape if model.inputs else None)
            if shape and len(shape) >= 3:
                h = int(shape[1]) if shape[1] is not None else None
                w = int(shape[2]) if shape[2] is not None else None
                if h and w and h == w:
                    return h
                if h:
                    return h
            return default
        except Exception:
            return default

    def _infer_hf_input_size(self, processor: object, default: int = 224) -> int:
        try:
            size = getattr(processor, "size", None)
            if isinstance(size, dict):
                h = size.get("height") or size.get("shortest_edge")
                if h:
                    return int(h)
            image_size = getattr(processor, "image_size", None)
            if isinstance(image_size, int):
                return int(image_size)
            if isinstance(image_size, (list, tuple)) and len(image_size) >= 2:
                return int(image_size[0])
            return default
        except Exception:
            return default

    def _infer_tflite_input(self, interpreter: Any, default: int = 224) -> Tuple[int, bool]:
        try:
            info = interpreter.get_input_details()[0]
            shape = info.get("shape", [])
            if len(shape) == 4:
                # NCHW if channel index 1, else NHWC
                if shape[1] == 3:
                    return int(shape[2]), True
                if shape[3] == 3:
                    return int(shape[1]), False
            return default, False
        except Exception:
            return default, False

    def _log_broken_model(self, path: Path, error: str, name: Optional[str] = None) -> None:
        try:
            BROKEN_MODELS_LOG.parent.mkdir(parents=True, exist_ok=True)
            with BROKEN_MODELS_LOG.open("a", encoding="utf-8") as fh:
                fh.write(f"{time.time()}\t{name or path.stem}\t{path.as_posix()}\t{error}\n")
        except Exception as exc:
            logger.warning("Failed to log broken model %s: %s", path, exc)

    def _discover_models(self) -> List[ModelSpec]:
        registry = build_registry(MODELS_ROOT)
        dump_registry_json(registry, MODEL_DISCOVERY_SNAPSHOT)

        specs: List[ModelSpec] = []
        for plant, meta in registry.items():
            path = Path(meta.get("path", ""))
            if not path.exists():
                logger.warning("Model path missing: %s", path)
                self._log_broken_model(path, "Path missing", name=plant)
                continue

            arch = str(meta.get("type", "cnn"))
            input_size = int(meta.get("input", 224) or 224)
            crop = self.model_to_crop.get(path.name.lower())
            if crop and crop in self.crop_sizes:
                input_size = self.crop_sizes[crop]
            weight = 1.2 if arch == "vit" else 1.0
            specs.append(ModelSpec(plant=plant, path=path, arch=arch, input_size=input_size, crop=crop, weight=weight))

        if not specs:
            logger.warning("No models discovered in %s", MODELS_ROOT)

        return specs

    def _load_tf_runner(self, spec: ModelSpec) -> Optional[ModelRunner]:
        if tf is None:
            logger.warning("TensorFlow not available, skip %s", spec.path)
            return None
        try:
            model = tf.keras.models.load_model(spec.path, compile=False)
            spec.input_size = self._infer_tf_input_size(model, default=spec.input_size)
            preprocess = lambda im: np.expand_dims(np.asarray(im.convert("RGB").resize((spec.input_size, spec.input_size)), dtype=np.float32) / 255.0, 0)
            dummy = preprocess(Image.new("RGB", (spec.input_size, spec.input_size), (64, 96, 64)))
            logits = model(dummy, training=False)
            logits = logits.numpy() if hasattr(logits, "numpy") else np.array(logits)
            if logits.ndim > 2:
                logits = logits.reshape(logits.shape[0], -1)
            num_classes = logits.shape[1]
            labels = [f"class_{i}" for i in range(num_classes)]
            heatmap_supported = True
            return ModelRunner(
                spec=spec,
                backend="tf",
                model=model,
                processor=None,
                labels=labels,
                preprocess=preprocess,
                sha256=self._sha256(spec.path),
                file_size=spec.path.stat().st_size if spec.path.exists() else None,
                grad_cam_supported=heatmap_supported,
            )
        except Exception as exc:
            logger.warning("Failed to load TF model %s: %s", spec.path, exc)
            return None

    def _load_hf_runner(self, spec: ModelSpec) -> Optional[ModelRunner]:
        if torch is None or AutoModelForImageClassification is None or AutoImageProcessor is None:
            logger.warning("Transformers not available, skip %s", spec.path)
            return None
        try:
            model_dir = spec.path if spec.path.is_dir() else spec.path.parent
            processor = AutoImageProcessor.from_pretrained(model_dir)
            model = AutoModelForImageClassification.from_pretrained(model_dir)
            spec.input_size = self._infer_hf_input_size(processor, default=spec.input_size)
            id2label = getattr(model.config, "id2label", None) or {}
            labels = [v for _, v in sorted(id2label.items())] if id2label else [f"class_{i}" for i in range(model.config.num_labels)]
            return ModelRunner(
                spec=spec,
                backend="hf",
                model=model,
                processor=processor,
                labels=labels,
                preprocess=None,
                sha256=self._sha256(spec.path if spec.path.exists() else model_dir / "model.safetensors"),
                file_size=spec.path.stat().st_size if spec.path.exists() else None,
                grad_cam_supported=False,
            )
        except Exception as exc:
            logger.warning("Failed to load HF model %s: %s", spec.path, exc)
            return None

    def _load_torch_runner(self, spec: ModelSpec) -> Optional[ModelRunner]:
        if torch is None:
            logger.warning("Torch not available, skip %s", spec.path)
            return None
        model_file = None
        for cand in [spec.path / "model.pt", spec.path / "best.pt", spec.path]:
            if cand.is_file():
                model_file = cand
                break
        if model_file is None:
            logger.warning("No torch model file inside %s", spec.path)
            return None
        try:
            model = torch.jit.load(str(model_file), map_location="cpu")
            model.eval()
            preprocess = lambda im: torch.from_numpy(np.asarray(im.convert("RGB").resize((spec.input_size, spec.input_size)), dtype=np.float32) / 255.0).permute(2, 0, 1).unsqueeze(0)
            dummy = preprocess(Image.new("RGB", (spec.input_size, spec.input_size), (64, 96, 64)))
            with torch.no_grad():
                logits = model(dummy)
            if isinstance(logits, (list, tuple)):
                logits = logits[0]
            if hasattr(logits, "detach"):
                logits = logits.detach()
            logits = logits.cpu().numpy()
            if logits.ndim > 2:
                logits = logits.reshape(logits.shape[0], -1)
            num_classes = logits.shape[1]
            labels = [f"class_{i}" for i in range(num_classes)]
            return ModelRunner(
                spec=spec,
                backend="torch",
                model=model,
                processor=None,
                labels=labels,
                preprocess=preprocess,
                sha256=self._sha256(model_file),
                file_size=model_file.stat().st_size if model_file.exists() else None,
                grad_cam_supported=False,
            )
        except Exception as exc:
            logger.warning("Failed to load torch model %s: %s", spec.path, exc)
            return None

    def _load_tflite_runner(self, spec: ModelSpec) -> Optional[ModelRunner]:
        if tf is None:
            logger.warning("TensorFlow not available for TFLite, skip %s", spec.path)
            return None
        try:
            interpreter = tf.lite.Interpreter(model_path=str(spec.path))
            interpreter.allocate_tensors()
            input_size, is_nchw = self._infer_tflite_input(interpreter, default=spec.input_size)
            spec.input_size = input_size

            def preprocess(im: Image.Image) -> np.ndarray:
                arr = np.asarray(im.convert("RGB").resize((spec.input_size, spec.input_size)), dtype=np.float32) / 255.0
                if is_nchw:
                    arr = np.transpose(arr, (2, 0, 1))
                return np.expand_dims(arr, 0)

            dummy = preprocess(Image.new("RGB", (spec.input_size, spec.input_size), (64, 96, 64)))
            input_details = interpreter.get_input_details()[0]
            interpreter.set_tensor(input_details["index"], dummy.astype(input_details["dtype"]))
            interpreter.invoke()
            output_details = interpreter.get_output_details()[0]
            logits = interpreter.get_tensor(output_details["index"])
            if logits.ndim > 2:
                logits = logits.reshape(logits.shape[0], -1)
            num_classes = logits.shape[1]
            labels = [f"class_{i}" for i in range(num_classes)]
            return ModelRunner(
                spec=spec,
                backend="tflite",
                model=interpreter,
                processor=None,
                labels=labels,
                preprocess=preprocess,
                sha256=self._sha256(spec.path),
                file_size=spec.path.stat().st_size if spec.path.exists() else None,
                grad_cam_supported=False,
            )
        except Exception as exc:
            logger.warning("Failed to load TFLite model %s: %s", spec.path, exc)
            return None

    def _init_models(self) -> None:
        specs = self._discover_models()
        self.stats_total = len(specs)
        for spec in specs:
            runner: Optional[ModelRunner] = None
            if spec.arch == "cnn":
                runner = self._load_tf_runner(spec)
            elif spec.arch == "vit":
                runner = self._load_hf_runner(spec)
            elif spec.arch == "tflite":
                runner = self._load_tflite_runner(spec)
            else:
                runner = self._load_torch_runner(spec) or self._load_hf_runner(spec)

            if runner is None:
                self._log_broken_model(spec.path, "Load failed", name=spec.plant)
                self.failed.append({
                    "plant": spec.plant,
                    "path": str(spec.path),
                    "arch": spec.arch,
                    "input_size": spec.input_size,
                    "status": "BROKEN",
                    "error": "Load failed",
                })
                self.registry.update(spec.path, status="FAIL", backend=spec.arch, input_size=spec.input_size, labels=[], validation_score=0.0, error="Load failed", blacklist=True)
                continue

            ok, score, err = self._validate_runner(runner)
            if not ok:
                logger.warning("Dry test failed for %s: %s", spec.path, err)
                self._log_broken_model(spec.path, err or "Validation failed", name=spec.plant)
                self.failed.append({
                    "plant": spec.plant,
                    "path": str(spec.path),
                    "arch": runner.backend,
                    "input_size": runner.spec.input_size,
                    "status": "BROKEN",
                    "error": err or "Validation failed",
                })
                self.registry.update(spec.path, status="FAIL", backend=runner.backend, input_size=runner.spec.input_size, labels=runner.labels, validation_score=score, error=err, blacklist=True)
                continue

            runner.validation_score = score
            self.runners.append(runner)
            self.stats_ok += 1
            self.registry.update(spec.path, status="OK", backend=runner.backend, input_size=runner.spec.input_size, labels=runner.labels, validation_score=score, error=None, blacklist=False)
            self._merge_labels(runner.labels)
        self.stats_broken = self.stats_total - self.stats_ok
        logger.info("Model scan summary | total=%s | ok=%s | broken=%s", self.stats_total, self.stats_ok, self.stats_broken)
        if not self.runners:
            logger.warning("No models loaded after discovery")

    def _merge_labels(self, labels: List[str]) -> None:
        if not labels:
            return
        if not self.id2label:
            self.id2label = list(labels)
        elif len(labels) == len(self.id2label):
            return
        else:
            for i in range(len(self.id2label), max(len(self.id2label), len(labels))):
                self.id2label.append(f"class_{i}")
        self.label_to_idx = {lbl: idx for idx, lbl in enumerate(self.id2label)}

    def _preprocess_for_runner(self, runner: ModelRunner, img: Image.Image) -> Image.Image:
        target = runner.spec.input_size
        return img.resize((target, target)).convert("RGB")

    def _softmax_valid(self, probs: np.ndarray) -> bool:
        if not np.isfinite(probs).all():
            return False
        s = float(np.sum(probs))
        return 0.95 <= s <= 1.05

    def _align_probs(self, runner: ModelRunner, probs: np.ndarray) -> np.ndarray:
        labels = runner.labels
        for i in range(len(probs)):
            lbl = labels[i] if i < len(labels) else f"class_{i}"
            if lbl not in self.label_to_idx:
                self.id2label.append(lbl)
                self.label_to_idx[lbl] = len(self.id2label) - 1
        vec = np.zeros(len(self.id2label))
        for i, p in enumerate(probs):
            lbl = labels[i] if i < len(labels) else f"class_{i}"
            idx = self.label_to_idx.get(lbl)
            if idx is not None:
                vec[idx] = p
        return vec

    def _validate_runner(self, runner: ModelRunner) -> Tuple[bool, float, Optional[str]]:
        try:
            sample = Image.fromarray(np.random.randint(0, 255, size=(runner.spec.input_size, runner.spec.input_size, 3), dtype=np.uint8))
            probs, _ = runner.predict(sample)
            if not self._softmax_valid(probs):
                return False, 0.0, "Softmax invalid"
            score = float(np.clip(np.max(probs), 0.0, 1.0))
            return True, score, None
        except Exception as exc:
            return False, 0.0, str(exc)

    def _disable_runner(self, runner: ModelRunner, error: str) -> None:
        runner.status = "CRASH"
        self.registry.update(runner.spec.path, status="CRASH", backend=runner.backend, input_size=runner.spec.input_size, labels=runner.labels, validation_score=runner.validation_score, error=error, blacklist=True)
        self._log_broken_model(runner.spec.path, error, name=runner.spec.plant)
        self.failed.append({
            "plant": runner.spec.plant,
            "path": str(runner.spec.path),
            "arch": runner.backend,
            "input_size": runner.spec.input_size,
            "status": "BROKEN",
            "error": error,
        })
        self.stats_broken = max(self.stats_broken, len(self.failed))
        try:
            self.runners.remove(runner)
        except ValueError:
            pass

    def _heatmap_url(self, heatmap: np.ndarray, target_size: Tuple[int, int]) -> Optional[str]:
        try:
            arr = np.clip(heatmap, 0.0, 1.0)
            arr = (arr * 255).astype(np.uint8)
            img = Image.fromarray(arr, mode="L").resize(target_size, resample=Image.BILINEAR)
            r = img
            g = Image.new("L", img.size, 0)
            b = Image.new("L", img.size, 0)
            a = img.point(lambda x: int(x * 0.7))
            rgba = Image.merge("RGBA", (r, g, b, a))
            buf = io.BytesIO()
            rgba.save(buf, format="PNG")
            encoded = base64.b64encode(buf.getvalue()).decode("ascii")
            return f"data:image/png;base64,{encoded}"
        except Exception:
            return None

    async def predict(self, img: Image.Image, crop: Optional[str] = None) -> Dict[str, object]:
        if not self.runners:
            return {"error": "Không tìm thấy model"}

        active_runners = [r for r in self.runners if (crop is None or r.spec.plant == crop)]
        if not active_runners:
            return {"error": "Không tìm thấy model cho cây đã chọn"}

        await progress_bus.send("predict_start", detail="Bắt đầu suy luận", progress=0.02)
        await progress_bus.send("preprocess", detail="Tiền xử lý", progress=0.08)

        results = []
        votes: Dict[str, int] = {}
        ensemble_scores = np.zeros(len(self.id2label) or 1, dtype=np.float32)
        total_weight = 0.0
        original_size = img.size

        for idx, runner in enumerate(list(active_runners)):
            try:
                await progress_bus.send("model_start", detail=f"{runner.spec.plant}", progress=0.12 + 0.6 * (idx / max(1, len(self.runners))))
                pre_img = self._preprocess_for_runner(runner, img)
                probs, latency = runner.predict(pre_img)
                if not self._softmax_valid(probs):
                    raise ValueError("Softmax invalid")

                aligned = self._align_probs(runner, probs)
                if ensemble_scores.shape[0] < aligned.shape[0]:
                    new_scores = np.zeros_like(aligned)
                    new_scores[: ensemble_scores.shape[0]] = ensemble_scores
                    ensemble_scores = new_scores
                weight = runner.spec.weight * max(0.2, runner.validation_score)
                ensemble_scores += aligned * weight
                total_weight += weight

                top_idx = int(np.argmax(probs))
                label = runner.labels[top_idx] if top_idx < len(runner.labels) else f"class_{top_idx}"
                prob = float(probs[top_idx])
                votes[label] = votes.get(label, 0) + 1
                results.append({
                    "model_name": runner.spec.plant,
                    "arch": runner.spec.arch,
                    "label": label,
                    "class_id": top_idx,
                    "probability": prob,
                    "latency_ms": latency,
                    "validation_score": runner.validation_score,
                })
                await progress_bus.send("model_done", detail=f"{runner.spec.plant} ✓", progress=0.12 + 0.6 * ((idx + 1) / max(1, len(self.runners))))
            except Exception as exc:
                logger.warning("Inference failed for %s: %s", runner.spec.path, exc)
                self._disable_runner(runner, str(exc))
                await progress_bus.send("model_fail", detail=f"{runner.spec.plant} lỗi", progress=0.12 + 0.6 * ((idx + 1) / max(1, len(self.runners))))

        if not results or total_weight <= 0:
            await progress_bus.send("predict_fail", detail="Không thể suy luận", progress=1.0)
            return {"error": "Không thể suy luận"}

        ensemble_probs = ensemble_scores / max(1e-6, float(np.sum(ensemble_scores)))
        top_indices = list(np.argsort(ensemble_probs)[::-1][:3])
        majority_idx = top_indices[0]
        majority_label = self.id2label[majority_idx] if majority_idx < len(self.id2label) else f"class_{majority_idx}"
        vote_ratio = votes.get(majority_label, 0) / max(1, len(results))
        confidence = float(ensemble_probs[majority_idx])

        low_confidence = confidence < 0.35
        if low_confidence:
            # Warn but still return best-effort result instead of failing hard.
            await progress_bus.send("predict_warn", detail="Độ tin cậy thấp, vẫn trả kết quả", progress=0.92)

        top3 = []
        for idx in top_indices:
            lbl = self.id2label[idx] if idx < len(self.id2label) else f"class_{idx}"
            top3.append({"label": lbl, "probability": float(ensemble_probs[idx])})

        top_result = max(results, key=lambda r: r["probability"])
        consensus_pass = len(results) >= 3 and vote_ratio >= (2.0 / 3.0)
        fail_safe = (confidence < 0.6) or (not consensus_pass)
        reliability = float(np.clip(np.mean([vote_ratio, confidence, min(1.0, total_weight / max(1, len(self.runners)))]), 0.0, 1.0))

        heatmap_url = None
        try:
            top_runner = next((r for r in self.runners if r.spec.plant == top_result["model_name"]), None)
            if top_runner and top_runner.grad_cam_supported:
                cam = top_runner.grad_cam(self._preprocess_for_runner(top_runner, img))
                if cam is not None:
                    heatmap_url = self._heatmap_url(cam, original_size)
        except Exception:
            heatmap_url = None

        await progress_bus.send("ensemble", detail="Tổng hợp kết quả", progress=0.85)
        await progress_bus.send("predict_done", detail="Hoàn tất", progress=1.0)

        return {
            "label": majority_label,
            "label_vi": majority_label,
            "class_id": top_result["class_id"],
            "probability": confidence,
            "confidence": confidence,
            "uncertain": fail_safe,
            "model_name": top_result["model_name"],
            "latency_ms": top_result["latency_ms"],
            "models": results,
            "top3": top3,
            "consensus_ratio": vote_ratio,
            "reliability_score": reliability,
            "reliability_label": "Cao" if reliability >= 0.75 else "Trung bình" if reliability >= 0.55 else "Thấp",
            "fail_safe": fail_safe,
            "rejection_reason": "Chụp lại ảnh, không đủ điều kiện" if fail_safe else "",
            "validators": {
                "consensus": {"passed": consensus_pass, "ratio": vote_ratio, "required": "≥3 models, >=2/3 votes"},
                "confidence": {"passed": confidence >= 0.6, "value": confidence},
            },
            "heatmap_url": heatmap_url,
            "message": "Chụp lại ảnh, không đủ điều kiện" if fail_safe else "Đã nhận diện",
        }

    def health(self) -> Dict[str, object]:
        memory = self._memory_info()
        gpu = self._gpu_status()
        statuses = {"vit": "UNKNOWN", "cnn": "UNKNOWN", "densenet": "UNKNOWN", "dsvm": "UNKNOWN", "dknn": "UNKNOWN"}
        details: List[Dict[str, object]] = []

        dummy = Image.new("RGB", (224, 224), (96, 128, 96))
        for runner in self.runners:
            stat = {"name": runner.spec.plant, "arch": runner.spec.arch, "path": str(runner.spec.path)}
            try:
                pre = self._preprocess_for_runner(runner, dummy)
                probs, latency = runner.predict(pre)
                ok = self._softmax_valid(probs)
                stat.update({"status": "OK" if ok else "FAIL", "latency_ms": latency, "probs_sum": float(np.sum(probs))})
            except Exception as exc:
                stat.update({"status": "FAIL", "error": str(exc)})
            details.append(stat)
            key = runner.spec.arch if runner.spec.arch in statuses else None
            if key:
                statuses[key] = stat["status"]

        summary = statuses
        summary.update({
            "gpu": "OK" if gpu.get("available") else "CPU",
            "memory": "OK" if memory.get("percent", 0) < 90 else "HIGH",
        })
        return {"summary": summary, "detail": {"models": details, "memory": memory, "gpu": gpu}}

    def list_models(self) -> List[Dict[str, object]]:
        def _fmt_type(arch: str) -> str:
            if arch == "cnn":
                return "keras"
            if arch == "vit":
                return "vit"
            return arch

        models: List[Dict[str, object]] = []
        for r in self.runners:
            models.append({
                "name": r.spec.plant,
                "type": _fmt_type(r.spec.arch),
                "input": f"{r.spec.input_size}x{r.spec.input_size}",
                "path": str(r.spec.path),
                "status": "OK",
            })

        for f in self.failed:
            models.append({
                "name": f.get("plant"),
                "type": _fmt_type(str(f.get("arch", ""))),
                "input": f"{f.get('input_size', 'n/a')}x{f.get('input_size', 'n/a')}",
                "path": f.get("path"),
                "status": "BROKEN",
                "error": f.get("error"),
            })

        return models

    def model_status(self, name: str) -> Optional[str]:
        for m in self.list_models():
            if m.get("name") == name:
                return str(m.get("status"))
        return None

    def _memory_info(self) -> Dict[str, float]:
        if psutil is None:
            return {"used_mb": 0.0, "avail_mb": 0.0, "percent": 0.0}
        vm = psutil.virtual_memory()
        return {"used_mb": vm.used / 1e6, "avail_mb": vm.available / 1e6, "percent": vm.percent}

    def _gpu_status(self) -> Dict[str, object]:
        status = {"available": False, "name": None, "memory_total_mb": None, "memory_free_mb": None}
        try:
            if torch is not None and torch.cuda.is_available():
                status["available"] = True
                idx = torch.cuda.current_device()
                status["name"] = torch.cuda.get_device_name(idx)
                status["memory_total_mb"] = float(torch.cuda.get_device_properties(idx).total_memory / 1e6)
                status["memory_free_mb"] = float(torch.cuda.mem_get_info()[0] / 1e6)
        except Exception:
            pass
        return status


def get_progress_bus() -> ProgressBus:
    return progress_bus


engine_singleton: Optional[EnsembleEngine] = None


def get_engine() -> EnsembleEngine:
    global engine_singleton
    if engine_singleton is None:
        engine_singleton = EnsembleEngine()
    return engine_singleton
