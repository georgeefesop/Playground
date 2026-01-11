# Server Diagnostic Script
Write-Host "=== Server Diagnostics ===" -ForegroundColor Cyan

# Check if port 8000 is in use
Write-Host "`nChecking if port 8000 is in use..." -ForegroundColor Yellow
$port8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($port8000) {
    Write-Host "Port 8000 is in use by:" -ForegroundColor Green
    $port8000 | Format-Table -AutoSize
} else {
    Write-Host "Port 8000 is not in use" -ForegroundColor Red
}

# Check if index.html exists
Write-Host "`nChecking for index.html..." -ForegroundColor Yellow
if (Test-Path "index.html") {
    Write-Host "index.html exists" -ForegroundColor Green
} else {
    Write-Host "index.html NOT FOUND!" -ForegroundColor Red
}

# Check Python version
Write-Host "`nChecking Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Python version: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "Python not found in PATH" -ForegroundColor Red
}

# Check for common files
Write-Host "`nChecking required files..." -ForegroundColor Yellow
$requiredFiles = @("index.html", "js/main.js", "js/Game.js", "styles/main.css")
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✓ $file" -ForegroundColor Green
    } else {
        Write-Host "✗ $file MISSING" -ForegroundColor Red
    }
}

Write-Host "`n=== Diagnostic Complete ===" -ForegroundColor Cyan
Write-Host "`nTry these URLs:" -ForegroundColor Yellow
Write-Host "  http://127.0.0.1:8000" -ForegroundColor White
Write-Host "  http://localhost:8000" -ForegroundColor White
Write-Host "  http://127.0.0.1:8000/index.html" -ForegroundColor White
