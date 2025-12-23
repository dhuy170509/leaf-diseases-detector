#!/usr/bin/env pwsh
# Leaf Disease Detector - Startup Script
# Usage: .\STARTUP.ps1

param(
    [string]$Mode = "development",
    [int]$Port = 8765,
    [switch]$Build = $false,
    [switch]$InstallDeps = $false
)

Write-Host "🌿 Leaf Disease Detector - Startup Script" -ForegroundColor Green
Write-Host "==========================================`n" -ForegroundColor Green

# Set working directory
$rootPath = Split-Path -Parent $MyInvocation.MyCommandPath
Set-Location $rootPath

Write-Host "📁 Working directory: $rootPath`n" -ForegroundColor Yellow

# Step 1: Install Dependencies (Optional)
if ($InstallDeps) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Blue
    
    # Backend dependencies
    Write-Host "   Backend dependencies..." -ForegroundColor Cyan
    cd server
    npm install
    cd ..
    
    # Frontend dependencies
    Write-Host "   Frontend dependencies..." -ForegroundColor Cyan
    cd client
    npm install
    cd ..
    
    Write-Host "✅ Dependencies installed`n" -ForegroundColor Green
}

# Step 2: Build (Optional)
if ($Build) {
    Write-Host "🔨 Building project..." -ForegroundColor Blue
    
    # Build backend
    Write-Host "   Building backend..." -ForegroundColor Cyan
    cd server
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Backend build failed" -ForegroundColor Red
        exit 1
    }
    cd ..
    
    # Build frontend
    Write-Host "   Building frontend..." -ForegroundColor Cyan
    cd client
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Frontend build failed" -ForegroundColor Red
        exit 1
    }
    cd ..
    
    Write-Host "✅ Build completed`n" -ForegroundColor Green
}

# Step 3: Start Server
Write-Host "🚀 Starting server..." -ForegroundColor Blue
Write-Host "   Mode: $Mode" -ForegroundColor Cyan
Write-Host "   Port: $Port`n" -ForegroundColor Cyan

$env:NODE_ENV = $Mode
$env:PORT = $Port

# Start the server
npm start

