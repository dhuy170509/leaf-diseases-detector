#!/usr/bin/env python3
"""
Upload all models to HuggingFace Hub
"""

import os
import sys
from pathlib import Path
from huggingface_hub import HfApi, create_repo

HF_USERNAME = "huyhuy07"
REPO_NAME = "leaf-disease-detector-models"
REPO_ID = f"{HF_USERNAME}/{REPO_NAME}"

MODEL_DIR = os.path.join(os.path.dirname(__file__), 'model')

MODELS = [
    'best_leaf_ai.h5',
    'efficientnet_merged.h5',
    'efficientnetb0_notop.h5',
    'leaf_disease_model.h5',
    'leaf_disease_modhel.h5',
    'mango_model.h5',
    'plant_disease_model.h5',
    'mobilenetv2_leaf_offline_15ep.pth'
]

def upload_models():
    """Upload all models to HuggingFace"""
    
    print("=" * 70)
    print("📤 UPLOADING MODELS TO HUGGINGFACE HUB")
    print("=" * 70)
    print()
    
    api = HfApi()
    
    # Check if repo exists, create if not
    try:
        print(f"[INFO] Checking repository: {REPO_ID}")
        api.repo_info(repo_id=REPO_ID, repo_type="model")
        print(f"[OK] Repository exists")
    except Exception as e:
        print(f"[INFO] Creating repository: {REPO_ID}")
        try:
            create_repo(repo_id=REPO_ID, repo_type="model", private=False)
            print(f"[OK] Repository created")
        except Exception as e:
            print(f"[ERROR] Failed to create repository: {e}")
            return False
    
    print()
    uploaded = 0
    failed = 0
    
    for model_file in MODELS:
        model_path = os.path.join(MODEL_DIR, model_file)
        
        # Check if file exists
        if not os.path.exists(model_path):
            print(f"[SKIP] {model_file} - file not found")
            continue
        
        size_mb = os.path.getsize(model_path) / (1024 * 1024)
        
        try:
            print(f"[INFO] Uploading {model_file} ({size_mb:.2f} MB)...", end=" ", flush=True)
            
            api.upload_file(
                path_or_fileobj=model_path,
                path_in_repo=model_file,
                repo_id=REPO_ID,
                repo_type="model",
                commit_message=f"Add {model_file}"
            )
            
            print(f"[OK]")
            uploaded += 1
            
        except Exception as e:
            print(f"[ERROR] {e}")
            failed += 1
    
    print()
    print("=" * 70)
    print(f"✅ Upload Complete:")
    print(f"   Uploaded: {uploaded}")
    print(f"   Failed: {failed}")
    print(f"   Total: {len(MODELS)}")
    print(f"   Repository: https://huggingface.co/{REPO_ID}")
    print("=" * 70)
    
    return failed == 0

if __name__ == "__main__":
    success = upload_models()
    sys.exit(0 if success else 1)
