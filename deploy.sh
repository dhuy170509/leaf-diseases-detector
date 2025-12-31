#!/usr/bin/env bash
set -euo pipefail

# Simple deploy script for FastAPI app
python -m pip install --upgrade pip
pip install --no-cache-dir -r requirements.txt
uvicorn api_server:app --host 0.0.0.0 --port "${PORT:-8000}"
