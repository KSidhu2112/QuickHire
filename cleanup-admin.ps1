# QuickHire Cleanup Script
# This script stops the admin dev server and removes the admin folder

Write-Host "🧹 QuickHire Cleanup Script" -ForegroundColor Cyan
Write-Host "============================`n" -ForegroundColor Cyan

# Step 1: Find and stop admin dev server
Write-Host "Step 1: Checking for admin dev server..." -ForegroundColor Yellow

$adminProcesses = Get-Process node -ErrorAction SilentlyContinue | Where-Object {
    $_.Path -like "*QuickHire\admin*"
}

if ($adminProcesses) {
    Write-Host "Found admin dev server process(es). Stopping..." -ForegroundColor Yellow
    $adminProcesses | ForEach-Object {
        Write-Host "  Stopping process ID: $($_.Id)" -ForegroundColor Gray
        Stop-Process -Id $_.Id -Force
    }
    Write-Host "✅ Admin dev server stopped" -ForegroundColor Green
    Start-Sleep -Seconds 2
} else {
    Write-Host "ℹ️  No admin dev server process found" -ForegroundColor Gray
}

# Step 2: Remove admin folder
Write-Host "`nStep 2: Removing admin folder..." -ForegroundColor Yellow

$adminPath = "c:\Users\siddu\OneDrive\Desktop\QuickHire\admin"

if (Test-Path $adminPath) {
    try {
        Remove-Item -Path $adminPath -Recurse -Force -ErrorAction Stop
        Write-Host "✅ Admin folder deleted successfully" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Could not delete admin folder automatically" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "`n   Please delete manually:" -ForegroundColor Yellow
        Write-Host "   1. Close all terminals and editors" -ForegroundColor Yellow
        Write-Host "   2. Navigate to: c:\Users\siddu\OneDrive\Desktop\QuickHire\" -ForegroundColor Yellow
        Write-Host "   3. Right-click 'admin' folder and select Delete" -ForegroundColor Yellow
    }
} else {
    Write-Host "ℹ️  Admin folder not found (already deleted)" -ForegroundColor Gray
}

# Step 3: Verify cleanup
Write-Host "`nStep 3: Verifying cleanup..." -ForegroundColor Yellow

$stillExists = Test-Path $adminPath
if (-not $stillExists) {
    Write-Host "✅ Admin folder successfully removed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Admin folder still exists - manual deletion required" -ForegroundColor Yellow
}

# Step 4: Check running services
Write-Host "`nStep 4: Checking running services..." -ForegroundColor Yellow

$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
$backendRunning = $false
$frontendRunning = $false

foreach ($proc in $nodeProcesses) {
    if ($proc.Path -like "*QuickHire\backend*") {
        $backendRunning = $true
    }
    if ($proc.Path -like "*QuickHire\frontend*") {
        $frontendRunning = $true
    }
}

Write-Host "`nService Status:" -ForegroundColor Cyan
Write-Host "  Backend (port 5000):  $(if ($backendRunning) { '✅ Running' } else { '❌ Not Running' })" -ForegroundColor $(if ($backendRunning) { 'Green' } else { 'Red' })
Write-Host "  Frontend (port 5173): $(if ($frontendRunning) { '✅ Running' } else { '❌ Not Running' })" -ForegroundColor $(if ($frontendRunning) { 'Green' } else { 'Red' })

# Final summary
Write-Host "`n============================`n" -ForegroundColor Cyan
Write-Host "🎉 Cleanup Complete!" -ForegroundColor Green
Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "  1. Verify backend is running: http://localhost:5000/api/health" -ForegroundColor White
Write-Host "  2. Verify frontend is running: http://localhost:5173" -ForegroundColor White
Write-Host "  3. Test your application" -ForegroundColor White
Write-Host "`nFor detailed information, see: ERROR_RESOLUTION.md`n" -ForegroundColor Gray
