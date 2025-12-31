# ============================================================================
# 🍃 AI Leaf Disease Detector - Public Server Launcher
# ============================================================================
# This script automatically starts your local AI server and exposes it
# to the internet via Cloudflare Tunnel (no port forwarding needed)
# ============================================================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  🍃 AI Leaf Disease Detector Launcher  " -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if Python venv exists
$venvPath = "D:\huy\leaf-disease-detector-1\.venv\Scripts\python.exe"
if (-not (Test-Path $venvPath)) {
    Write-Host "❌ Python venv not found at: $venvPath" -ForegroundColor Red
    Write-Host "Please create venv first: python -m venv .venv" -ForegroundColor Yellow
    exit 1
}

# Check if cloudflared is installed
$cloudflaredInstalled = Get-Command cloudflared -ErrorAction SilentlyContinue
if (-not $cloudflaredInstalled) {
    Write-Host "⚠️  Cloudflared not found. Installing..." -ForegroundColor Yellow
    Write-Host ""
    
    $downloadUrl = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
    $installPath = "C:\Windows\System32\cloudflared.exe"
    
    try {
        Write-Host "📥 Downloading cloudflared..." -ForegroundColor Cyan
        Invoke-WebRequest -Uri $downloadUrl -OutFile $installPath -UseBasicParsing
        Write-Host "✅ Cloudflared installed successfully!" -ForegroundColor Green
        Write-Host ""
    }
    catch {
        Write-Host "❌ Failed to install cloudflared automatically." -ForegroundColor Red
        Write-Host "Please install manually from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "✅ All prerequisites met!" -ForegroundColor Green
Write-Host ""

# Start API server in background
Write-Host "🚀 Starting FastAPI server..." -ForegroundColor Cyan
$apiJob = Start-Job -ScriptBlock {
    Set-Location "D:\huy\leaf-disease-detector-1"
    & "D:\huy\leaf-disease-detector-1\.venv\Scripts\python.exe" "api_server.py"
}

Write-Host "⏳ Waiting for API server to start (5 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Test if server is running
try {
    $healthCheck = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ API server is running!" -ForegroundColor Green
    Write-Host ""
}
catch {
    Write-Host "❌ API server failed to start. Check for errors:" -ForegroundColor Red
    Receive-Job -Job $apiJob
    Stop-Job -Job $apiJob
    Remove-Job -Job $apiJob
    exit 1
}

# Start Cloudflare Tunnel
Write-Host "🌐 Starting Cloudflare Tunnel..." -ForegroundColor Cyan
Write-Host "⏳ Generating public HTTPS URL..." -ForegroundColor Yellow
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  YOUR PUBLIC URL WILL APPEAR BELOW" -ForegroundColor White
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

# Run cloudflared tunnel (this will block and show the URL)
try {
    cloudflared tunnel --url http://localhost:8000
}
catch {
    Write-Host ""
    Write-Host "❌ Cloudflare Tunnel stopped" -ForegroundColor Red
}
finally {
    Write-Host ""
    Write-Host "🛑 Stopping API server..." -ForegroundColor Yellow
    Stop-Job -Job $apiJob
    Remove-Job -Job $apiJob
    Write-Host "✅ All services stopped" -ForegroundColor Green
}
