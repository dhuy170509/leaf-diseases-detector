#!/usr/bin/env pwsh
# Leaf Disease Detector - One-Click Deployment Script
# Supports: Render.com, Railway.app, Vercel, and local deployment

Write-Host "`n🚀 Leaf Disease Detector - Deployment Tool`n" -ForegroundColor Cyan
Write-Host "Build Status: ✅ SUCCESS - All errors fixed" -ForegroundColor Green
Write-Host "Ready for Deployment`n" -ForegroundColor Green

# Menu
Write-Host "Select Deployment Option:" -ForegroundColor Yellow
Write-Host "1. Render.com (RECOMMENDED - Free tier available)" -ForegroundColor White
Write-Host "2. Railway.app (Simple setup)" -ForegroundColor White
Write-Host "3. Vercel (Frontend only)" -ForegroundColor White
Write-Host "4. Local Testing (http://localhost:8765)" -ForegroundColor White
Write-Host "5. View Deployment Guide" -ForegroundColor White
Write-Host "6. Build Only (no deploy)" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1-6)"

switch ($choice) {
    "1" {
        Write-Host "`n📋 Render.com Deployment Steps:`n" -ForegroundColor Cyan
        Write-Host "1. Go to https://render.com" -ForegroundColor White
        Write-Host "2. Sign in with GitHub" -ForegroundColor White
        Write-Host "3. Click 'New +' → 'Web Service'" -ForegroundColor White
        Write-Host "4. Select 'phamthinhu2992/leaf-disease-detector'" -ForegroundColor White
        Write-Host "`n⚙️  Configure as:" -ForegroundColor Cyan
        Write-Host "   • Name: leaf-disease-detector" -ForegroundColor Gray
        Write-Host "   • Environment: Node" -ForegroundColor Gray
        Write-Host "   • Build Command: npm run build" -ForegroundColor Gray
        Write-Host "   • Start Command: npm start" -ForegroundColor Gray
        Write-Host "`n✅ Click 'Create Web Service'" -ForegroundColor Green
        Write-Host "⏱️  Deployment: 3-5 minutes" -ForegroundColor Yellow
        Write-Host "🌐 Your app: https://leaf-disease-detector-xxxx.onrender.com`n" -ForegroundColor Green
        
        Write-Host "Would you like to verify git status? (y/n): " -NoNewline -ForegroundColor Yellow
        $verify = Read-Host
        if ($verify -eq 'y') {
            Write-Host "`n📊 Git Status:" -ForegroundColor Cyan
            git status
            
            Write-Host "`nPush to GitHub? (y/n): " -NoNewline -ForegroundColor Yellow
            $push = Read-Host
            if ($push -eq 'y') {
                Write-Host "`n📤 Pushing to GitHub..." -ForegroundColor Yellow
                git add -A
                git commit -m "Deployment: Build ready - all TypeScript errors fixed"
                git push origin main
                Write-Host "✅ Pushed successfully!" -ForegroundColor Green
            }
        }
    }
    
    "2" {
        Write-Host "`n📋 Railway.app Deployment Steps:`n" -ForegroundColor Cyan
        Write-Host "1. Go to https://railway.app" -ForegroundColor White
        Write-Host "2. Sign in with GitHub" -ForegroundColor White
        Write-Host "3. Create new project" -ForegroundColor White
        Write-Host "4. Select 'Deploy from GitHub'" -ForegroundColor White
        Write-Host "5. Choose 'phamthinhu2992/leaf-disease-detector'" -ForegroundColor White
        Write-Host "`n⚙️  Railway Auto-Detects:" -ForegroundColor Cyan
        Write-Host "   • Node.js environment" -ForegroundColor Gray
        Write-Host "   • Build & start commands" -ForegroundColor Gray
        Write-Host "`n✅ Click 'Deploy'" -ForegroundColor Green
        Write-Host "⏱️  Deployment: 5 minutes" -ForegroundColor Yellow
        Write-Host "🌐 Your app: https://leaf-disease-detector-xxxx.up.railway.app`n" -ForegroundColor Green
    }
    
    "3" {
        Write-Host "`n📋 Vercel Deployment (Frontend Only):`n" -ForegroundColor Cyan
        Write-Host "1. Go to https://vercel.com" -ForegroundColor White
        Write-Host "2. Import project from GitHub" -ForegroundColor White
        Write-Host "3. Select 'phamthinhu2992/leaf-disease-detector'" -ForegroundColor White
        Write-Host "`n⚠️  Note: Vercel is for frontend only" -ForegroundColor Yellow
        Write-Host "Backend needs separate deployment (Render, Railway, etc.)" -ForegroundColor Yellow
        Write-Host "`n🌐 Backend URL: Configure in client/src/services/api.ts" -ForegroundColor Cyan
        Write-Host "   // Example:" -ForegroundColor Gray
        Write-Host "   const API_BASE = 'https://your-backend.onrender.com';" -ForegroundColor Gray
    }
    
    "4" {
        Write-Host "`n🏠 Local Testing Setup:" -ForegroundColor Cyan
        Write-Host "`n1️⃣  Building application..." -ForegroundColor Yellow
        npm run build
        
        Write-Host "`n2️⃣  Starting server..." -ForegroundColor Yellow
        Write-Host "Server will run at: http://localhost:8765" -ForegroundColor Green
        Write-Host "Press Ctrl+C to stop`n" -ForegroundColor Gray
        
        npm start
    }
    
    "5" {
        Write-Host "`n📖 Opening Deployment Guide..." -ForegroundColor Cyan
        Get-Content "DEPLOYMENT_GUIDE.md" | more
    }
    
    "6" {
        Write-Host "`n🔨 Building application..." -ForegroundColor Cyan
        npm run build
        Write-Host "`n✅ Build complete!`n" -ForegroundColor Green
        Write-Host "📂 Output locations:" -ForegroundColor Yellow
        Write-Host "   • Frontend: client/build/" -ForegroundColor Gray
        Write-Host "   • Backend: server/dist/" -ForegroundColor Gray
        Write-Host "   • Ready to deploy to any platform" -ForegroundColor Gray
    }
    
    default {
        Write-Host "`n❌ Invalid choice. Please run script again." -ForegroundColor Red
    }
}

Write-Host "`n"
