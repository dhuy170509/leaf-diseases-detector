import argparse
import json
import os
import sys
import hashlib
from pathlib import Path
import requests

# Simple promote helper: verify hashes locally then call /hot_swap

API_BASE = os.environ.get("HOTPROMOTE_API", "http://127.0.0.1:8000")


def hash_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def verify_release(release: Path):
    summary = []
    for p in release.rglob("*"):
        if p.suffix.lower() not in {".tflite", ".h5", ".keras"}:
            continue
        summary.append({"file": str(p), "sha256": hash_file(p)})
    return summary


def promote(version: str, base: str):
    url = f"{base}/hot_swap"
    r = requests.post(url, params={"version": version})
    if not r.ok:
        raise SystemExit(f"promote failed: {r.status_code} {r.text}")
    print(r.json())


def main():
    parser = argparse.ArgumentParser(description="Promote a new model release with integrity check")
    parser.add_argument("version", help="Release version folder under models/releases")
    parser.add_argument("--root", default=".", help="Project root (default .)")
    parser.add_argument("--api", default=API_BASE, help="Hot-swap API base")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    release = root / "models" / "releases" / args.version
    if not release.exists():
        raise SystemExit(f"Release not found: {release}")

    print("Verifying release...")
    summary = verify_release(release)
    print(json.dumps(summary, indent=2))

    print("Calling /hot_swap ...")
    promote(args.version, args.api)

if __name__ == "__main__":
    main()
