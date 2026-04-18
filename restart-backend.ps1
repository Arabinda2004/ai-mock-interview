#!/usr/bin/env powershell
# Restart Backend Server Script
# This will stop all running Node.js processes and start the backend server fresh

Write-Host "🔄 Restarting AI Interview Backend Server..." -ForegroundColor Cyan
Write-Host ""

# Stop all Node.js processes
Write-Host "🛑 Stopping existing Node.js processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Navigate to backend directory
Set-Location -Path "$PSScriptRoot\backend"

# Start the backend server
Write-Host "🚀 Starting backend server..." -ForegroundColor Green
Write-Host ""
Write-Host "📍 Server will run on http://localhost:5001" -ForegroundColor Cyan
Write-Host "📝 Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the server
node src/server.js
