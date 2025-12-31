import json
import os
from pathlib import Path
from typing import Dict

# Root directory that must contain all production models
MODELS_ROOT = Path(os.getenv("MODELS_DIR", r"D:/huy/leaf-disease-detector-1/models")).resolve()

# Only these crops/models are allowed (no demos)
ALLOWED_BASES = {
    "corn": "corn",
    "chili": "chili",
    "chili_ai_model_package": "chili",
    "peanut": "peanut",
    "potato": "potato",
    "rice": "rice",
    "rice_ai_model_package": "rice",
    "tomato": "tomato",
    "pumpkinleaf_ai_system_final_ready": "pumpkin",
}

SUPPORTED_EXT = {
    ".h5": ("cnn", 224),
    ".keras": ("cnn", 224),
    ".tflite": ("tflite", 224),
    ".safetensors": ("vit", 224),
}

HF_MARKERS = {"config.json", "model.safetensors", "pytorch_model.bin"}


def _guess_input_size(path: Path, default: int) -> int:
    for token in ("128", "160", "192", "224", "256", "320", "448", "512"):
        if token in path.name:
            try:
                return int(token)
            except ValueError:
                continue
    return default


def _make_key(name: str, registry: Dict[str, object]) -> str:
    base = name.lower().replace(" ", "_")
    key = base
    suffix = 2
    while key in registry:
        key = f"{base}_{suffix}"
        suffix += 1
    return key


def _add_entry(registry: Dict[str, Dict[str, object]], key: str, path: Path, arch: str, input_size: int) -> None:
    registry[key] = {
        "path": path.as_posix(),
        "type": arch,
        "input": int(input_size),
    }


def build_registry(models_root: Path = MODELS_ROOT) -> Dict[str, Dict[str, object]]:
    registry: Dict[str, Dict[str, object]] = {}
    if not models_root.exists():
        return registry

    for path in sorted(models_root.rglob("*")):
        if path.is_dir():
            rel_parts = path.relative_to(models_root).parts
            if not rel_parts:
                continue
            base_raw = Path(rel_parts[0]).stem.lower()
            crop = ALLOWED_BASES.get(base_raw)
            if crop is None:
                continue
            if any((path / marker).exists() for marker in HF_MARKERS):
                key = _make_key(crop, registry)
                _add_entry(registry, key, path, "vit", _guess_input_size(path, 224))
            continue

        ext = path.suffix.lower()
        if ext not in SUPPORTED_EXT:
            continue

        rel_parts = path.relative_to(models_root).parts
        if not rel_parts:
            continue
        base_raw = Path(rel_parts[0]).stem.lower()
        crop = ALLOWED_BASES.get(base_raw)
        if crop is None:
            continue

        arch, default_input = SUPPORTED_EXT[ext]
        input_size = _guess_input_size(path, default_input)
        key = _make_key(crop, registry)
        _add_entry(registry, key, path, arch, input_size)

    return registry


def dump_registry_json(registry: Dict[str, Dict[str, object]], destination: Path | None = None) -> Path:
    target = destination or MODELS_ROOT.parent / "model_registry.discovered.json"
    target.write_text(json.dumps(registry, indent=2, ensure_ascii=False), encoding="utf-8")
    return target


MODEL_REGISTRY = build_registry()


if __name__ == "__main__":
    snapshot = dump_registry_json(MODEL_REGISTRY)
    print(f"Wrote registry snapshot to {snapshot}")
