@echo off
title PyMastery Studio Launcher
echo ========================================
echo        Launching PyMastery Studio        
echo ========================================

cd /d "%~dp0"
set "PYTHON_EXE=%~dp0.venv\Scripts\python.exe"

if not exist "%PYTHON_EXE%" (
    echo [!] Virtual environment not found. Initializing with uv...
    "C:\Users\theru\.local\bin\uv.exe" venv --python 3.12 .venv
    call .venv\Scripts\activate
    pip install -e .
)

echo [1/2] Starting FastAPI Backend on http://localhost:8000...
start "PyMastery Backend" "%PYTHON_EXE%" -m uvicorn server.main:app --host 127.0.0.1 --port 8000 --reload

echo [2/2] Starting React Vite Frontend on http://localhost:5173...
cd client
start "PyMastery Frontend" cmd /c "npm run dev"

echo.
echo PyMastery Studio is starting!
echo Opening http://localhost:5173 in your default browser...
timeout /t 2 /nobreak >nul
start http://localhost:5173

echo.
echo Both servers are running in separate terminal windows.
echo Close those terminal windows to stop the servers.
