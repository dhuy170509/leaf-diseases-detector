import argparse
import os
import sys
import random
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Dict, List, Optional, Sequence, Tuple

import numpy as np
from PIL import Image


# Force CPU usage and quieter TF logs for local inference
os.environ.setdefault("CUDA_VISIBLE_DEVICES", "-1")
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")


@dataclass
class ModelWrapper:
    name: str
    kind: str
    input_size: Tuple[int, int]
    num_classes: int
    predict_fn: Callable[[np.ndarray], np.ndarray]

    def predict(self, batch_nhwc: np.ndarray) -> np.ndarray:
        """Run inference and return logits/probs as numpy array."""
        return self.predict_fn(batch_nhwc)


def set_deterministic(seed: int = 0) -> None:
    random.seed(seed)
    np.random.seed(seed)
    try:
        import torch

        torch.manual_seed(seed)
        torch.set_num_threads(1)
        torch.use_deterministic_algorithms(True)
    except Exception:
        pass

    try:
        import tensorflow as tf

        tf.random.set_seed(seed)
    except Exception:
        pass


def softmax_logits(logits: np.ndarray) -> np.ndarray:
    logits = np.asarray(logits, dtype=np.float32)
    logits = logits - np.max(logits, axis=1, keepdims=True)
    exp = np.exp(logits)
    return exp / np.sum(exp, axis=1, keepdims=True)


def find_models(models_root: Path) -> List[Tuple[str, Path]]:
    """Recursively discover models under models_root.

    Supports SavedModel directories, Keras .h5/.hdf5, PyTorch .pt/.pth, and ONNX .onnx.
    """

    candidates: List[Tuple[str, Path]] = []
    if not models_root.exists():
        return candidates

    seen: set[Path] = set()
    for root, _, files in os.walk(models_root):
        root_path = Path(root)

        # TensorFlow SavedModel directory marker
        if "saved_model.pb" in files:
            if root_path not in seen:
                candidates.append(("tf_savedmodel", root_path))
                seen.add(root_path)

        for fname in files:
            path = root_path / fname
            if path in seen:
                continue
            suffix = path.suffix.lower()
            if suffix in {".h5", ".hdf5"}:
                candidates.append(("keras_h5", path))
                seen.add(path)
            elif suffix in {".pt", ".pth"}:
                candidates.append(("torch", path))
                seen.add(path)
            elif suffix == ".onnx":
                candidates.append(("onnx", path))
                seen.add(path)
    return candidates


def load_tf_saved_model(model_dir: Path) -> Optional[ModelWrapper]:
    try:
        import tensorflow as tf
    except ImportError as exc:
        print(f"[WARN] TensorFlow not installed: {exc}", file=sys.stderr)
        return None

    model = tf.saved_model.load(str(model_dir))
    signatures = model.signatures
    if not signatures:
        print(f"[WARN] No signatures in SavedModel: {model_dir}", file=sys.stderr)
        return None

    if "serving_default" in signatures:
        fn = signatures["serving_default"]
    else:
        fn = next(iter(signatures.values()))

    input_signature = fn.structured_input_signature[1]
    if not input_signature:
        print(f"[WARN] Cannot determine input for: {model_dir}", file=sys.stderr)
        return None

    input_key = next(iter(input_signature))
    input_spec = input_signature[input_key]
    h = int(input_spec.shape[1] or 224)
    w = int(input_spec.shape[2] or 224)

    output_key = next(iter(fn.structured_outputs))
    out_shape = fn.structured_outputs[output_key].shape
    num_classes = int(out_shape[-1]) if out_shape.rank and out_shape[-1] else 0

    def predict_fn(batch_nhwc: np.ndarray) -> np.ndarray:
        x = tf.convert_to_tensor(batch_nhwc, dtype=tf.float32)
        outputs = fn(**{input_key: x})
        result = outputs[output_key]
        return np.asarray(result.numpy())

    name = f"SavedModel:{model_dir.name}"
    return ModelWrapper(name=name, kind="tf_savedmodel", input_size=(h, w), num_classes=num_classes, predict_fn=predict_fn)


def load_keras_h5(model_path: Path) -> Optional[ModelWrapper]:
    try:
        import tensorflow as tf
    except ImportError as exc:
        print(f"[WARN] TensorFlow not installed: {exc}", file=sys.stderr)
        return None

    model = tf.keras.models.load_model(str(model_path), compile=False)
    input_shape = model.input_shape
    if input_shape is None or len(input_shape) < 3:
        print(f"[WARN] Cannot determine input shape for: {model_path}", file=sys.stderr)
        return None

    h = int(input_shape[1] or 224)
    w = int(input_shape[2] or 224)
    output_shape = model.output_shape
    num_classes = int(output_shape[-1]) if output_shape and output_shape[-1] else 0

    def predict_fn(batch_nhwc: np.ndarray) -> np.ndarray:
        preds = model.predict(batch_nhwc, verbose=0)
        return np.asarray(preds)

    name = f"KerasH5:{model_path.name}"
    return ModelWrapper(name=name, kind="keras_h5", input_size=(h, w), num_classes=num_classes, predict_fn=predict_fn)


def load_torch_model(model_path: Path) -> Optional[ModelWrapper]:
    try:
        import torch
    except ImportError as exc:
        print(f"[WARN] PyTorch not installed: {exc}", file=sys.stderr)
        return None

    model = None
    try:
        model = torch.jit.load(str(model_path), map_location="cpu")
    except Exception:
        try:
            model = torch.load(str(model_path), map_location="cpu")
        except Exception as exc:
            print(f"[WARN] Cannot load torch model {model_path}: {exc}", file=sys.stderr)
            return None

    if hasattr(model, "eval"):
        model.eval()

    # Attempt to infer class count via a dry run
    input_size = (224, 224)
    num_classes = 0
    try:
        dummy = torch.zeros(1, 3, input_size[0], input_size[1], dtype=torch.float32)
        with torch.no_grad():
            out = model(dummy)
        if isinstance(out, (list, tuple)):
            out = out[0]
        out_np = out.detach().cpu().numpy()
        if out_np.ndim >= 2:
            num_classes = int(out_np.shape[-1])
    except Exception as exc:
        print(f"[WARN] Torch model dry-run failed for {model_path}: {exc}", file=sys.stderr)

    def predict_fn(batch_nhwc: np.ndarray) -> np.ndarray:
        x = torch.from_numpy(batch_nhwc).permute(0, 3, 1, 2).contiguous()
        x = x.to(dtype=torch.float32)
        with torch.no_grad():
            out = model(x)
        if isinstance(out, (list, tuple)):
            out = out[0]
        return out.detach().cpu().numpy()

    name = f"Torch:{model_path.name}"
    return ModelWrapper(name=name, kind="torch", input_size=input_size, num_classes=num_classes, predict_fn=predict_fn)


def load_onnx_model(model_path: Path) -> Optional[ModelWrapper]:
    try:
        import onnxruntime as ort
    except ImportError as exc:
        print(f"[WARN] onnxruntime not installed: {exc}", file=sys.stderr)
        return None

    session_options = ort.SessionOptions()
    session_options.intra_op_num_threads = 1
    session_options.inter_op_num_threads = 1
    session = ort.InferenceSession(str(model_path), sess_options=session_options, providers=["CPUExecutionProvider"])

    input_meta = session.get_inputs()[0]
    input_shape = input_meta.shape
    h = int(input_shape[2] or 224) if len(input_shape) >= 3 else 224
    w = int(input_shape[3] or 224) if len(input_shape) >= 3 else 224
    num_classes = 0
    if session.get_outputs():
        out_shape = session.get_outputs()[0].shape
        if out_shape and len(out_shape) >= 2 and out_shape[-1]:
            num_classes = int(out_shape[-1])

    input_name = input_meta.name
    output_name = session.get_outputs()[0].name

    def predict_fn(batch_nhwc: np.ndarray) -> np.ndarray:
        chw = np.transpose(batch_nhwc, (0, 3, 1, 2)).astype(np.float32)
        outputs = session.run([output_name], {input_name: chw})
        return np.asarray(outputs[0])

    name = f"ONNX:{model_path.name}"
    return ModelWrapper(name=name, kind="onnx", input_size=(h, w), num_classes=num_classes, predict_fn=predict_fn)


def load_all_models(models_root: Path) -> List[ModelWrapper]:
    wrappers: List[ModelWrapper] = []
    for kind, path in find_models(models_root):
        loader = {
            "tf_savedmodel": load_tf_saved_model,
            "keras_h5": load_keras_h5,
            "torch": load_torch_model,
            "onnx": load_onnx_model,
        }.get(kind)
        if not loader:
            continue
        try:
            wrapper = loader(path)
            if wrapper:
                wrappers.append(wrapper)
                print(f"[INFO] Loaded {wrapper.kind} -> {wrapper.name} | size={wrapper.input_size} | classes={wrapper.num_classes}")
        except Exception as exc:
            print(f"[WARN] Failed to load {path}: {exc}", file=sys.stderr)
    return wrappers


def iter_image_paths(images_root: Path) -> List[Path]:
    exts = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
    return [p for p in sorted(images_root.iterdir()) if p.suffix.lower() in exts and p.is_file()]


def prepare_batch(image_paths: Sequence[Path], size: Tuple[int, int]) -> np.ndarray:
    h, w = size
    batch = np.zeros((len(image_paths), h, w, 3), dtype=np.float32)
    for idx, path in enumerate(image_paths):
        with Image.open(path) as img:
            img = img.convert("RGB")
            img = img.resize((w, h), resample=Image.BILINEAR)
            batch[idx] = np.asarray(img, dtype=np.float32) / 255.0
    return batch


def run_ensemble(models: List[ModelWrapper], images_root: Path, batch_size: int) -> None:
    image_paths = iter_image_paths(images_root)
    if not image_paths:
        print("[WARN] No images found to infer.")
        return

    print(f"[INFO] Found {len(image_paths)} images for inference.")
    results: List[Tuple[str, int, float]] = []

    for start in range(0, len(image_paths), batch_size):
        chunk = image_paths[start : start + batch_size]
        prepared_cache: Dict[Tuple[int, int], np.ndarray] = {}

        sum_probs: Optional[np.ndarray] = None
        used_models = 0
        reference_classes: Optional[int] = None

        for model in models:
            if model.input_size not in prepared_cache:
                prepared_cache[model.input_size] = prepare_batch(chunk, model.input_size)
            try:
                logits = model.predict(prepared_cache[model.input_size])
                probs = softmax_logits(logits)
            except Exception as exc:
                print(f"[WARN] Inference failed for {model.name}: {exc}", file=sys.stderr)
                continue

            if reference_classes is None:
                reference_classes = probs.shape[1]
            if probs.shape[1] != reference_classes:
                print(
                    f"[WARN] Skipping {model.name} due to class mismatch ({probs.shape[1]} vs {reference_classes}).",
                    file=sys.stderr,
                )
                continue

            sum_probs = probs if sum_probs is None else sum_probs + probs
            used_models += 1

        if used_models == 0 or sum_probs is None:
            print("CHƯA CÓ CƠ SỞ DỮ LIỆU")
            return

        avg_probs = sum_probs / float(used_models)

        for idx, path in enumerate(chunk):
            cls_idx = int(np.argmax(avg_probs[idx]))
            conf = float(avg_probs[idx, cls_idx])
            results.append((path.name, cls_idx, conf))

    print("\nPrediction Table (ensemble top-1):")
    print(f"{'Image':30} {'Class':>8} {'Confidence':>12}")
    for name, cls_idx, conf in results:
        print(f"{name:30} {cls_idx:8d} {conf:12.4f}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Local-only ensemble inference")
    parser.add_argument("--models-path", default="D:/huy/Model", help="Folder containing local models")
    parser.add_argument("--images-path", default="D:/huy/TestImages", help="Folder containing input images")
    parser.add_argument("--batch-size", type=int, default=8, help="Batch size for inference")
    parser.add_argument(
        "--target-classes",
        type=int,
        default=None,
        help="If set, only keep models whose num_classes matches this value",
    )
    args = parser.parse_args()

    set_deterministic(0)

    models_root = Path(args.models_path)
    images_root = Path(args.images_path)

    models = load_all_models(models_root)
    if not models:
        print("CHƯA CÓ CƠ SỞ DỮ LIỆU")
        return

    if args.target_classes is not None:
        models = [m for m in models if m.num_classes == args.target_classes]
        if not models:
            print(f"[WARN] Không có model nào đúng số lớp {args.target_classes}")
            return

    print("\nLoaded models:")
    for m in models:
        print(f"- {m.name} ({m.kind}) input={m.input_size} classes={m.num_classes}")

    run_ensemble(models, images_root, args.batch_size)


if __name__ == "__main__":
    main()
