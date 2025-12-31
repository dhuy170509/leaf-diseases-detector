# Auto-start script for AI Farm Orchestration System
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path ".venv")) {
    Write-Error "Virtual environment .venv not found. Create it before starting."
}
if (Test-Path ".venv/Scripts/Activate.ps1") {
    . .\.venv\Scripts\Activate.ps1
}
else {
    Write-Error "Activate.ps1 not found under .venv/Scripts"
}

$hostParam = "0.0.0.0"
$portParam = "8000"

Write-Host "Starting uvicorn at http://${hostParam}:${portParam}" -ForegroundColor Green
python -m uvicorn api_server:app --host $hostParam --port $portParam
