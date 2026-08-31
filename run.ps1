# PyMastery Launch Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "       Launching PyMastery Studio       " -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$pythonPath = "$scriptDir\.venv\Scripts\python.exe"

Write-Host "[1/2] Starting FastAPI Backend on http://localhost:8000..." -ForegroundColor Green
$backendProcess = Start-Process -FilePath "$pythonPath" -ArgumentList "-m", "uvicorn", "server.main:app", "--host", "127.0.0.1", "--port", "8000", "--reload" -WorkingDirectory "$scriptDir" -PassThru

Write-Host "[2/2] Starting React Vite Frontend on http://localhost:5173..." -ForegroundColor Green
$frontendProcess = Start-Process -FilePath "npm.cmd" -ArgumentList "run", "dev" -WorkingDirectory "$scriptDir\client" -PassThru

Write-Host "`nPyMastery Studio is running!" -ForegroundColor Cyan
Write-Host "  -> Web App: http://localhost:5173" -ForegroundColor White
Write-Host "  -> Backend API: http://localhost:8000/docs`n" -ForegroundColor White
Write-Host "Press Ctrl+C in this window or close it to stop." -ForegroundColor Gray

Start-Process "http://localhost:5173"

try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host "Stopping servers..." -ForegroundColor Yellow
    if ($backendProcess -and -not $backendProcess.HasExited) { Stop-Process -Id $backendProcess.Id -Force }
    if ($frontendProcess -and -not $frontendProcess.HasExited) { Stop-Process -Id $frontendProcess.Id -Force }
}
