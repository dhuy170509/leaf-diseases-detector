import io
import json
import logging
import shutil
import time
import hashlib
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np
from PIL import Image
try:
    import psutil
except Exception:  # pragma: no cover - optional dependency
    psutil = None

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


HF_MODEL = "wambugu71/crop_leaf_diseases_vit"
DEFAULT_IMG_SIZE = 224
BLUR_THRESHOLD = 60.0
LIGHTING_MEAN_BOUNDS = (45.0, 215.0)
LIGHTING_MID_FRACTION_MIN = 0.55
GREEN_RATIO_MIN = 0.28
GREEN_DOMINANCE_MIN = 0.78
HIGH_FREQ_RATIO_MAX = 0.45
JPEG_DELTA_MAX = 0.12
ENTROPY_MAX = 2.2
MAHAL_COLOR_MAX = 3.2
RELIABILITY_FLOOR = 0.35


@dataclass
class ModelRunner:
    name: str
    path: Path
    labels: List[str]
    weight: float = 1.0
    temperature: float = 1.0
    input_name: Optional[str] = None
    output_name: Optional[str] = None
    session: Optional[object] = None
    arch: str = "unknown"
    sha256: Optional[str] = None
    file_size: Optional[int] = None
    cold_start_ms: Optional[float] = None
    last_health: Dict[str, object] = field(default_factory=dict)

    def predict(self, pixel_values: np.ndarray) -> np.ndarray:
        if self.session is None or self.input_name is None or self.output_name is None:
            raise RuntimeError(f"Model {self.name} not initialized")
        logits = self.session.run([self.output_name], {self.input_name: pixel_values})[0]
        if logits.ndim > 2:
            logits = logits.reshape(logits.shape[0], -1)
        logits = logits / max(self.temperature, 1e-6)
        logits = logits - np.max(logits, axis=1, keepdims=True)
        exp = np.exp(logits)
        probs = exp / np.sum(exp, axis=1, keepdims=True)
        return probs[0]


class EnsembleEngine:
    def __init__(self, models_dir: str = "models", onnx_dir: str = "artifacts/onnx", meta_path: str = "artifacts/models.json"):
        from transformers import AutoImageProcessor

        self.models_dir = Path(models_dir)
        self.onnx_dir = Path(onnx_dir)
        self.meta_path = Path(meta_path)
        self.onnx_dir.mkdir(parents=True, exist_ok=True)
        self.meta_path.parent.mkdir(parents=True, exist_ok=True)

        self.processor = AutoImageProcessor.from_pretrained(HF_MODEL)
        self.id2label: List[str] = []
        self.label_to_idx: Dict[str, int] = {}
        self.runners: List[ModelRunner] = []
        self.health_snapshot: Dict[str, object] = {}

        self.ingest()

    # Helpers ------------------------------------------------------
    def _infer_arch(self, name: str) -> str:
        lower = name.lower()
        if "vit" in lower:
            return "vit"
        if "dense" in lower:
            return "densenet"
        if "mobilenet" in lower or "cnn" in lower or "resnet" in lower:
            return "cnn"
        return "unknown"

    def _lighting_metrics(self, img: Image.Image) -> Tuple[float, float]:
        gray = np.asarray(img.convert("L"), dtype=np.float32)
        mean = float(np.mean(gray))
        mid_fraction = float(np.mean((gray >= 35) & (gray <= 220)))
        return mean, mid_fraction

    def _green_ratio(self, img: Image.Image) -> Tuple[float, float]:
        arr = np.asarray(img.convert("RGB"), dtype=np.float32)
        r = float(np.mean(arr[:, :, 0]))
        g = float(np.mean(arr[:, :, 1]))
        b = float(np.mean(arr[:, :, 2]))
        total = r + g + b + 1e-6
        ratio = g / total
        dominance = g / (r + b + 1e-6)
        return ratio, dominance

    def _fourier_high_freq_ratio(self, img: Image.Image) -> float:
        small = img.convert("L").resize((128, 128))
        arr = np.asarray(small, dtype=np.float32)
        freq = np.fft.fftshift(np.fft.fft2(arr))
        mag = np.abs(freq)
        h, w = mag.shape
        center = mag[h // 2 - 8 : h // 2 + 8, w // 2 - 8 : w // 2 + 8]
        total_energy = float(np.sum(mag)) + 1e-6
        low_energy = float(np.sum(center))
        high_energy = max(total_energy - low_energy, 0.0)
        return high_energy / total_energy

    def _file_hash(self, path: Path) -> Optional[str]:
        try:
            h = hashlib.sha256()
            with path.open("rb") as f:
                for chunk in iter(lambda: f.read(8192), b""):
                    h.update(chunk)
            return h.hexdigest()
        except Exception:
            return None

    def _memory_info(self) -> Dict[str, float]:
        if psutil is None:
            return {"used_mb": 0.0, "avail_mb": 0.0, "percent": 0.0}
        vm = psutil.virtual_memory()
        return {"used_mb": vm.used / 1e6, "avail_mb": vm.available / 1e6, "percent": vm.percent}

    def _gpu_status(self) -> Dict[str, object]:
        status = {"available": False, "name": None, "memory_total_mb": None, "memory_free_mb": None}
        try:
            import torch

            if torch.cuda.is_available():
                status["available"] = True
                idx = torch.cuda.current_device()
                status["name"] = torch.cuda.get_device_name(idx)
                status["memory_total_mb"] = float(torch.cuda.get_device_properties(idx).total_memory / 1e6)
                status["memory_free_mb"] = float(torch.cuda.mem_get_info()[0] / 1e6)
        except Exception:
            pass
        return status

    def _jpeg_delta(self, img: Image.Image) -> float:
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=72)
        buf.seek(0)
        comp = Image.open(buf).convert("RGB")
        a = np.asarray(img.resize(comp.size), dtype=np.float32)
        b = np.asarray(comp, dtype=np.float32)
        return float(np.mean(np.abs(a - b)) / 255.0)

    def _entropy(self, probs: np.ndarray) -> float:
        safe = np.clip(probs, 1e-9, 1.0)
        return float(-np.sum(safe * np.log(safe)))

    def _mahalanobis_color(self, img: Image.Image) -> float:
        arr = np.asarray(img.convert("RGB").resize((DEFAULT_IMG_SIZE, DEFAULT_IMG_SIZE)), dtype=np.float32) / 255.0
        mean_vec = np.mean(arr.reshape(-1, 3), axis=0)
        ref_mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        ref_var = np.square(np.array([0.229, 0.224, 0.225], dtype=np.float32))
        diff = mean_vec - ref_mean
        dist = float(np.sqrt(np.sum((diff * diff) / (ref_var + 1e-6))))
        return dist

    # Ingestion -----------------------------------------------------
    def ingest(self) -> None:
        logger.info("Starting model ingestion")
        hf_labels = self._convert_hf_to_onnx()
        if hf_labels:
            self._ensure_label_space(hf_labels)
        for kind, path in self._discover_models():
            try:
                onnx_path, labels = self._convert_to_onnx(kind, path)
                if onnx_path and labels:
                    self._ensure_label_space(labels)
            except Exception as exc:
                logger.warning("Skip conversion for %s: %s", path, exc)
        self._load_onnx_models()
        self._save_meta()

    def _discover_models(self) -> List[Tuple[str, Path]]:
        candidates: List[Tuple[str, Path]] = []
        if not self.models_dir.exists():
            return candidates
        for p in self.models_dir.rglob("*"):
            if not p.is_file():
                continue
            suffix = p.suffix.lower()
            if suffix in {".onnx"}:
                candidates.append(("onnx", p))
            elif suffix in {".pt", ".pth"}:
                candidates.append(("torch", p))
            elif suffix in {".h5", ".hdf5"}:
                candidates.append(("keras", p))
        return candidates

    def _convert_hf_to_onnx(self) -> List[str]:
        onnx_path = self.onnx_dir / "hf_vit.onnx"
        labels_path = self.onnx_dir / "hf_vit.labels.json"
        if onnx_path.exists() and labels_path.exists():
            return json.loads(labels_path.read_text())

        try:
            import torch
            from transformers import AutoModelForImageClassification

            model = AutoModelForImageClassification.from_pretrained(HF_MODEL)
            labels = [v for _, v in sorted(model.config.id2label.items())]
            dummy = torch.zeros(1, 3, DEFAULT_IMG_SIZE, DEFAULT_IMG_SIZE, dtype=torch.float32)
            torch.onnx.export(
                model,
                dummy,
                onnx_path,
                input_names=["pixel_values"],
                output_names=["logits"],
                opset_version=14,
                dynamic_axes={"pixel_values": {0: "batch"}, "logits": {0: "batch"}},
            )
            labels_path.write_text(json.dumps(labels, ensure_ascii=False))
            logger.info("Exported HF model to %s", onnx_path)
            return labels
        except Exception as exc:
            logger.warning("HF export failed: %s", exc)
            return []

    def _convert_to_onnx(self, kind: str, path: Path) -> Tuple[Optional[Path], List[str]]:
        target = self.onnx_dir / f"{path.stem}.onnx"
        labels = self._load_sidecar_labels(path)
        if kind == "onnx":
            shutil.copy(path, target)
            return target, labels
        if kind == "torch":
            return self._convert_torch(path, target, labels)
        if kind == "keras":
            return self._convert_keras(path, target, labels)
        return None, []

    def _convert_torch(self, path: Path, target: Path, labels: List[str]) -> Tuple[Optional[Path], List[str]]:
        try:
            import torch

            model = torch.jit.load(str(path), map_location="cpu")
        except Exception:
            try:
                import torch
                obj = torch.load(str(path), map_location="cpu")
                model = obj.get("model") if isinstance(obj, dict) else obj
            except Exception as exc:
                logger.warning("Torch load failed for %s: %s", path, exc)
                return None, []

        if not hasattr(model, "eval"):
            logger.warning("Torch model %s missing eval", path)
            return None, []

        model.eval()
        dummy = torch.zeros(1, 3, DEFAULT_IMG_SIZE, DEFAULT_IMG_SIZE, dtype=torch.float32)
        try:
            torch.onnx.export(
                model,
                dummy,
                target,
                input_names=["pixel_values"],
                output_names=["logits"],
                opset_version=14,
                dynamic_axes={"pixel_values": {0: "batch"}, "logits": {0: "batch"}},
            )
            logger.info("Converted torch model %s -> %s", path.name, target)
            return target, labels
        except Exception as exc:
            logger.warning("Torch export failed for %s: %s", path, exc)
            return None, []

    def _convert_keras(self, path: Path, target: Path, labels: List[str]) -> Tuple[Optional[Path], List[str]]:
        try:
            import tensorflow as tf
            import tf2onnx
        except Exception as exc:
            logger.warning("TensorFlow not available for %s: %s", path, exc)
            return None, []

        model = tf.keras.models.load_model(path, compile=False)
        spec = (tf.TensorSpec((None, DEFAULT_IMG_SIZE, DEFAULT_IMG_SIZE, 3), tf.float32, name="pixel_values"),)
        try:
            model_proto, _ = tf2onnx.convert.from_keras(model, input_signature=spec, opset=14, output_path=str(target))
            logger.info("Converted keras model %s -> %s", path.name, target)
            return target, labels
        except Exception as exc:
            logger.warning("Keras export failed for %s: %s", path, exc)
            return None, []

    def _load_sidecar_labels(self, path: Path) -> List[str]:
        txt = path.with_suffix(".labels.txt")
        js = path.with_suffix(".labels.json")
        if js.exists():
            try:
                return json.loads(js.read_text())
            except Exception:
                pass
        if txt.exists():
            try:
                return [line.strip() for line in txt.read_text().splitlines() if line.strip()]
            except Exception:
                pass
        return []

    # Loading -------------------------------------------------------
    def _load_onnx_models(self) -> None:
        import onnxruntime as ort

        for onnx_file in sorted(self.onnx_dir.glob("*.onnx")):
            labels = self._load_sidecar_labels(onnx_file)
            if not labels and self.id2label:
                labels = self.id2label
            try:
                start = time.perf_counter()
                session_options = ort.SessionOptions()
                session_options.intra_op_num_threads = 1
                session_options.inter_op_num_threads = 1
                session = ort.InferenceSession(str(onnx_file), sess_options=session_options, providers=["CPUExecutionProvider"])
                input_name = session.get_inputs()[0].name
                output_name = session.get_outputs()[0].name
                cold_ms = (time.perf_counter() - start) * 1000.0
                file_size = onnx_file.stat().st_size if onnx_file.exists() else None
                runner = ModelRunner(
                    name=onnx_file.stem,
                    path=onnx_file,
                    labels=labels,
                    weight=1.0,
                    temperature=1.0,
                    input_name=input_name,
                    output_name=output_name,
                    session=session,
                    arch=self._infer_arch(onnx_file.stem),
                    sha256=self._file_hash(onnx_file),
                    file_size=file_size,
                    cold_start_ms=cold_ms,
                )
                self.runners.append(runner)
                logger.info("Loaded ONNX runner %s", onnx_file.name)
            except Exception as exc:
                logger.warning("Failed to load %s: %s", onnx_file, exc)

    def _ensure_label_space(self, labels: List[str]) -> None:
        if not labels:
            return
        if not self.id2label:
            self.id2label = list(labels)
        else:
            for lbl in labels:
                if lbl not in self.id2label:
                    self.id2label.append(lbl)
        self.label_to_idx = {lbl: idx for idx, lbl in enumerate(self.id2label)}

    def _save_meta(self) -> None:
        meta = {
            "models": [
                {
                    "name": r.name,
                    "path": str(r.path),
                    "labels": r.labels,
                    "weight": r.weight,
                    "temperature": r.temperature,
                }
                for r in self.runners
            ],
            "label_space": self.id2label,
        }
        self.meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2))

    # Preprocess ----------------------------------------------------
    def _blur_score(self, img: Image.Image) -> float:
        gray = np.asarray(img.convert("L"), dtype=np.float32)
        if gray.size < 9:
            return 0.0
        center = gray[1:-1, 1:-1] * -4
        lap = center + gray[:-2, 1:-1] + gray[2:, 1:-1] + gray[1:-1, :-2] + gray[1:-1, 2:]
        return float(np.var(lap))

    def preprocess(self, img: Image.Image) -> Dict[str, object]:
        blur_score = self._blur_score(img)
        lighting_mean, lighting_mid = self._lighting_metrics(img)
        green_ratio, green_dom = self._green_ratio(img)
        encoded = self.processor(images=img.convert("RGB"), return_tensors="np")
        pixel_values = encoded["pixel_values"].astype(np.float32)
        return {
            "pixel_values": pixel_values,
            "blur_score": blur_score,
            "lighting_mean": lighting_mean,
            "lighting_mid": lighting_mid,
            "green_ratio": green_ratio,
            "green_dominance": green_dom,
        }

    # Predict -------------------------------------------------------
    def predict(self, img: Image.Image) -> Dict[str, object]:
        prep = self.preprocess(img)

        if not self.runners:
            return {"error": "Không tìm thấy model", "is_blurry": False}

        if not self.id2label:
            return {"error": "Không tìm thấy không gian nhãn"}

        pixel_values = prep["pixel_values"]
        total_weight = 0.0
        agg = np.zeros(len(self.id2label), dtype=np.float32)
        per_model: List[Dict[str, object]] = []

        for runner in self.runners:
            try:
                probs = runner.predict(pixel_values)
                aligned = np.zeros_like(agg)
                for i, lbl in enumerate(runner.labels):
                    if lbl in self.label_to_idx and i < probs.shape[0]:
                        aligned[self.label_to_idx[lbl]] = probs[i]
                weight = max(runner.weight, 0.0) or 1.0
                agg += weight * aligned
                total_weight += weight
                top_idx = int(np.argmax(aligned)) if aligned.any() else -1
                per_model.append({
                    "name": runner.name,
                    "arch": runner.arch,
                    "top_label": self.id2label[top_idx] if top_idx >= 0 else None,
                    "confidence": float(aligned[top_idx]) if top_idx >= 0 else 0.0,
                })
            except Exception as exc:
                logger.warning("Inference failed for %s: %s", runner.name, exc)

        if total_weight <= 0:
            return {"error": "Không thể suy luận"}

        probs = agg / total_weight
        top = int(np.argmax(probs))
        confidence = float(probs[top])
        label = self.id2label[top]

        # Validators ------------------------------------------------
        agreement = 0.0
        consensus_pass = False
        consensus_reason = ""
        if per_model:
            vote_counts: Dict[str, int] = {}
            for entry in per_model:
                if entry.get("top_label"):
                    vote_counts[entry["top_label"]] = vote_counts.get(entry["top_label"], 0) + 1
            if vote_counts:
                max_vote = max(vote_counts.values())
                agreement = max_vote / max(len(per_model), 1)
                has_required = {"vit", "cnn", "densenet"}.issubset({m.get("arch", "") for m in per_model})
                consensus_pass = len(per_model) >= 3 and agreement >= (2.0 / 3.0) and has_required
                if not has_required:
                    consensus_reason = "Thiếu đủ 3 kiến trúc (ViT/CNN/DenseNet)"
                elif len(per_model) < 3:
                    consensus_reason = "Cần tối thiểu 3 model để bỏ phiếu"
                elif agreement < (2.0 / 3.0):
                    consensus_reason = "Các model không đồng thuận ≥2/3"

        entropy = self._entropy(probs)
        mahal_color = self._mahalanobis_color(img)
        ood_pass = entropy <= ENTROPY_MAX and mahal_color <= MAHAL_COLOR_MAX

        high_freq_ratio = self._fourier_high_freq_ratio(img)
        jpeg_delta = self._jpeg_delta(img)
        adversarial_pass = high_freq_ratio <= HIGH_FREQ_RATIO_MAX and jpeg_delta <= JPEG_DELTA_MAX

        quality_pass = (
            prep.get("blur_score", 0.0) >= BLUR_THRESHOLD
            and LIGHTING_MEAN_BOUNDS[0] <= prep.get("lighting_mean", 0.0) <= LIGHTING_MEAN_BOUNDS[1]
            and prep.get("lighting_mid", 0.0) >= LIGHTING_MID_FRACTION_MIN
            and prep.get("green_ratio", 0.0) >= GREEN_RATIO_MIN
            and prep.get("green_dominance", 0.0) >= GREEN_DOMINANCE_MIN
        )

        calibrated_confidence = float(1.0 / (1.0 + np.exp(-(confidence - 0.5) * 8.0)))
        bayesian_reliability = float(max(0.0, min(1.0, 1.0 - entropy / (np.log(len(self.id2label) + 1e-6)))))

        consensus_factor = agreement if consensus_pass else agreement * 0.5
        quality_factor = 1.0 if quality_pass else 0.35
        ood_factor = 1.0 if ood_pass else 0.4
        adversarial_factor = 1.0 if adversarial_pass else 0.4
        reliability_score = float(np.clip(np.mean([
            calibrated_confidence,
            bayesian_reliability,
            consensus_factor,
            quality_factor,
            ood_factor,
            adversarial_factor,
        ]), 0.0, 1.0))

        fail_safe_reasons: List[str] = []
        if not quality_pass:
            fail_safe_reasons.append("Chất lượng ảnh kém (mờ/ánh sáng/không phải lá)")
        if not consensus_pass:
            fail_safe_reasons.append(consensus_reason or "Model không đủ đồng thuận")
        if not ood_pass:
            fail_safe_reasons.append("Nghi ngờ ảnh ngoài phân bố (entropy/Mahalanobis)")
        if not adversarial_pass:
            fail_safe_reasons.append("Nghi ngờ nhiễu đối kháng")
        if reliability_score < RELIABILITY_FLOOR:
            fail_safe_reasons.append("Độ tin cậy tổng hợp thấp")

        fail_safe = len(fail_safe_reasons) > 0
        rejection_reason = fail_safe_reasons[0] if fail_safe_reasons else ""

        validators = {
            "consensus": {
                "passed": consensus_pass,
                "agreement": agreement,
                "required_models": [m.get("arch") for m in per_model],
                "detail": consensus_reason,
            },
            "ood": {
                "passed": ood_pass,
                "entropy": entropy,
                "entropy_max": ENTROPY_MAX,
                "mahalanobis_color": mahal_color,
                "mahalanobis_max": MAHAL_COLOR_MAX,
            },
            "adversarial": {
                "passed": adversarial_pass,
                "high_freq_ratio": high_freq_ratio,
                "high_freq_max": HIGH_FREQ_RATIO_MAX,
                "jpeg_delta": jpeg_delta,
                "jpeg_delta_max": JPEG_DELTA_MAX,
            },
            "quality": {
                "passed": quality_pass,
                "blur_score": prep.get("blur_score"),
                "blur_min": BLUR_THRESHOLD,
                "lighting_mean": prep.get("lighting_mean"),
                "lighting_mid_fraction": prep.get("lighting_mid"),
                "lighting_bounds": LIGHTING_MEAN_BOUNDS,
                "green_ratio": prep.get("green_ratio"),
                "green_ratio_min": GREEN_RATIO_MIN,
                "green_dominance": prep.get("green_dominance"),
                "green_dominance_min": GREEN_DOMINANCE_MIN,
            },
            "calibration": {
                "passed": reliability_score >= 0.5,
                "calibrated_confidence": calibrated_confidence,
                "bayesian_reliability": bayesian_reliability,
            },
        }

        reliability_label = "Cao" if reliability_score >= 0.75 else "Trung bình" if reliability_score >= 0.55 else "Thấp"
        uncertain = reliability_score < 0.6 or not consensus_pass or not quality_pass

        return {
            "label": label,
            "label_vi": label,
            "confidence": confidence,
            "calibrated_confidence": calibrated_confidence,
            "reliability_score": reliability_score,
            "reliability_label": reliability_label,
            "uncertain": uncertain,
            "fail_safe": fail_safe,
            "message": "Chụp lại ảnh" if fail_safe else "Đã nhận diện",
            "rejection_reason": rejection_reason,
            "models": per_model,
            "probs": {self.id2label[i]: float(p) for i, p in enumerate(probs)},
            "validators": validators,
            "blur_score": prep.get("blur_score"),
        }

    # Health --------------------------------------------------------
    def _softmax_valid(self, probs: np.ndarray) -> bool:
        if not np.isfinite(probs).all():
            return False
        s = float(np.sum(probs))
        return 0.95 <= s <= 1.05 and np.all(probs >= -1e-6)

    def _dummy_pixel_values(self) -> np.ndarray:
        dummy = Image.new("RGB", (DEFAULT_IMG_SIZE, DEFAULT_IMG_SIZE), (96, 128, 96))
        enc = self.processor(images=dummy, return_tensors="np")
        return enc["pixel_values"].astype(np.float32)

    def _run_dummy_inference(self, runner: ModelRunner, pixel_values: np.ndarray) -> Dict[str, object]:
        start = time.perf_counter()
        logits = runner.session.run([runner.output_name], {runner.input_name: pixel_values})[0]
        dur_ms = (time.perf_counter() - start) * 1000.0
        if logits.ndim > 2:
            logits = logits.reshape(logits.shape[0], -1)
        if logits.shape[1] != len(self.id2label):
            raise ValueError(f"Output shape mismatch: {logits.shape}")
        probs = logits / max(runner.temperature, 1e-6)
        probs = probs - np.max(probs, axis=1, keepdims=True)
        probs = np.exp(probs)
        probs = probs / np.sum(probs, axis=1, keepdims=True)
        if not self._softmax_valid(probs):
            raise ValueError("Softmax invalid (nan/inf/sum!=1)")
        if not np.isfinite(logits).all():
            raise ValueError("Logits contain nan/inf")
        return {
            "ms": dur_ms,
            "shape": list(logits.shape),
            "probs_sum": float(np.sum(probs)),
            "top": self.id2label[int(np.argmax(probs))],
        }

    def _benchmark_runner(self, runner: ModelRunner, pixel_values: np.ndarray, iters: int = 5) -> Dict[str, object]:
        times = []
        for _ in range(iters):
            t0 = time.perf_counter()
            runner.session.run([runner.output_name], {runner.input_name: pixel_values})
            times.append((time.perf_counter() - t0) * 1000.0)
        avg_ms = float(np.mean(times)) if times else 0.0
        fps = 1000.0 / avg_ms if avg_ms > 0 else 0.0
        return {"avg_ms": avg_ms, "fps": fps, "iters": iters}

    def _gradient_check(self, runner: ModelRunner, pixel_values: np.ndarray) -> str:
        # ONNX sessions are not trainable; mark as not applicable.
        return "N/A (ONNX)"

    def _reload_runner(self, runner: ModelRunner) -> bool:
        import onnxruntime as ort

        try:
            if runner.session:
                del runner.session
            session_options = ort.SessionOptions()
            session_options.intra_op_num_threads = 1
            session_options.inter_op_num_threads = 1
            runner.session = ort.InferenceSession(str(runner.path), sess_options=session_options, providers=["CPUExecutionProvider"])
            runner.input_name = runner.session.get_inputs()[0].name
            runner.output_name = runner.session.get_outputs()[0].name
            runner.cold_start_ms = None
            return True
        except Exception as exc:
            logger.warning("Reload failed for %s: %s", runner.name, exc)
            return False

    def _clear_cuda(self) -> None:
        try:
            import torch

            if torch.cuda.is_available():
                torch.cuda.empty_cache()
        except Exception:
            pass

    def health(self) -> Dict[str, object]:
        pixel_values = self._dummy_pixel_values()
        gpu = self._gpu_status()
        mem = self._memory_info()

        statuses: Dict[str, str] = {"vit": "UNKNOWN", "cnn": "UNKNOWN", "densenet": "UNKNOWN", "dsvm": "UNKNOWN", "dknn": "UNKNOWN"}
        models_info: List[Dict[str, object]] = []
        aggregate_fps: List[float] = []
        load_failures = 0

        for runner in self.runners:
            health = {
                "name": runner.name,
                "arch": runner.arch,
                "sha256": runner.sha256,
                "file_size": runner.file_size,
            }
            try:
                if runner.session is None:
                    raise RuntimeError("Session missing")
                dummy = self._run_dummy_inference(runner, pixel_values)
                bench = self._benchmark_runner(runner, pixel_values, iters=3)
                grad_status = self._gradient_check(runner, pixel_values)
                health.update({
                    "status": "OK",
                    "dummy": dummy,
                    "benchmark": bench,
                    "gradient": grad_status,
                })
                aggregate_fps.append(bench.get("fps", 0.0))
            except Exception as exc:
                logger.warning("Health check failed for %s: %s", runner.name, exc)
                load_failures += 1
                self._clear_cuda()
                recovered = self._reload_runner(runner)
                health.update({
                    "status": "FAIL",
                    "error": str(exc),
                    "recovered": recovered,
                })
                if recovered:
                    try:
                        dummy = self._run_dummy_inference(runner, pixel_values)
                        bench = self._benchmark_runner(runner, pixel_values, iters=1)
                        health.update({"status": "OK", "dummy": dummy, "benchmark": bench})
                    except Exception as exc2:
                        health.update({"status": "FAIL", "error": f"After recovery: {exc2}"})

            runner.last_health = health
            models_info.append(health)
            arch = runner.arch
            if arch in statuses:
                statuses[arch] = health.get("status", "FAIL")

        fps_avg = float(np.mean(aggregate_fps)) if aggregate_fps else 0.0
        cold_start_max = max([r.cold_start_ms or 0.0 for r in self.runners], default=0.0)

        snapshot = {
            "statuses": statuses,
            "gpu": "OK" if gpu.get("available") else "CPU",
            "gpu_detail": gpu,
            "memory": mem,
            "memory_status": "OK" if mem.get("percent", 0) < 90 else "HIGH",
            "models": models_info,
            "fps_avg": fps_avg,
            "cold_start_max_ms": cold_start_max,
            "load_failures": load_failures,
        }
        self.health_snapshot = snapshot
        return snapshot


engine_singleton: Optional[EnsembleEngine] = None


def get_engine() -> EnsembleEngine:
    global engine_singleton
    if engine_singleton is None:
        engine_singleton = EnsembleEngine()
    return engine_singleton
