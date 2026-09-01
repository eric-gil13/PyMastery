#!/bin/bash
set -e

echo "========================================"
echo "       Launching PyMastery Studio"
echo "========================================"

# Go to the directory containing this script
REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO_DIR"

# Ensure local and homebrew binary directories are in PATH
export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

# 1. Verify Node.js & npm
if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
    echo "[x] Node.js and npm are required but not found in PATH."
    echo "    Please install Node.js (>=20.12) to run the PyMastery client."
    exit 1
fi

# 2. Check / Create Virtual Environment
RECREATE_VENV=0
if [ -f ".venv/bin/python" ]; then
    # Verify the venv python version is >= 3.12
    VENV_PY_VER=$(.venv/bin/python -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')" 2>/dev/null || echo "0.0")
    MAJOR=$(echo "$VENV_PY_VER" | cut -d. -f1)
    MINOR=$(echo "$VENV_PY_VER" | cut -d. -f2)
    if [ "$MAJOR" -lt 3 ] || { [ "$MAJOR" -eq 3 ] && [ "$MINOR" -lt 12 ]; }; then
        echo "[!] Existing .venv is Python $VENV_PY_VER (requires >= 3.12). Recreating..."
        rm -rf .venv
        RECREATE_VENV=1
    fi
else
    RECREATE_VENV=1
fi

if [ "$RECREATE_VENV" -eq 1 ]; then
    # Find suitable python >= 3.12
    PYTHON_CMD=""
    for cand in python3.12 python3.13 python3.14 python3; do
        if command -v "$cand" >/dev/null 2>&1; then
            VER=$("$cand" -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')" 2>/dev/null || echo "0.0")
            C_MAJ=$(echo "$VER" | cut -d. -f1)
            C_MIN=$(echo "$VER" | cut -d. -f2)
            if [ "$C_MAJ" -eq 3 ] && [ "$C_MIN" -ge 12 ]; then
                PYTHON_CMD="$cand"
                break
            fi
        fi
    done

    if [ -z "$PYTHON_CMD" ]; then
        echo "[x] Python >= 3.12 is required but not found."
        echo "    Please install Python 3.12 or newer."
        exit 1
    fi

    echo "[!] Creating virtual environment with $($PYTHON_CMD --version)..."
    "$PYTHON_CMD" -m venv .venv
fi

# 3. Check / Install Python Dependencies
if ! .venv/bin/python -c "import uvicorn, fastapi, torch, pandas, numpy" >/dev/null 2>&1; then
    echo "[!] Python dependencies not fully installed. Installing..."
    .venv/bin/python -m pip install --upgrade pip
    .venv/bin/pip install -e .
fi

# 4. Check / Install Frontend Dependencies
if [ ! -d "client/node_modules" ]; then
    echo "[!] Frontend node_modules not found. Installing via npm..."
    (cd client && npm install)
fi

# 5. Start Backend & Frontend
echo "[1/2] Starting FastAPI Backend on http://127.0.0.1:8000..."
.venv/bin/python -m uvicorn server.main:app \
    --host 127.0.0.1 \
    --port 8000 \
    --reload &
BACKEND_PID=$!

echo "[2/2] Starting React Vite Frontend on http://localhost:5173..."
(cd client && npm run dev) &
FRONTEND_PID=$!

# Clean up both processes when the script exits or receives INT/TERM
cleanup() {
    echo ""
    echo "Stopping PyMastery servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    wait $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 0
}
trap cleanup EXIT INT TERM

# Give servers a moment to start
sleep 2

echo ""
echo "PyMastery Studio is starting!"
echo "Studio:  http://localhost:5173"
echo "API Doc: http://localhost:8000/docs"
echo ""

# Open in browser
if command -v open >/dev/null 2>&1; then
    open http://localhost:5173 || true
elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open http://localhost:5173 || true
fi

echo "Both servers are running."
echo "Press Ctrl+C to stop them."

wait
