# ==============================================================================
# Stage 1: Build the React + Vite Frontend
# ==============================================================================
FROM node:20-slim AS frontend-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build

# ==============================================================================
# Stage 2: Production Python Backend with PyTorch CPU & Execution Engine
# ==============================================================================
FROM python:3.12-slim

# Avoid prompts from apt
ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PORT=7860

# Install system utilities needed for scientific packages and compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Hugging Face Spaces runs as user with UID 1000
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR $HOME/app

# Upgrade pip
RUN pip install --no-cache-dir --upgrade pip

# Install PyTorch CPU-only wheel first to keep image lightweight and fast
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# Install application dependencies
RUN pip install --no-cache-dir \
    fastapi>=0.110.0 \
    uvicorn>=0.29.0 \
    pydantic>=2.6.0 \
    psutil>=5.9.0 \
    numpy>=1.26.0 \
    pandas>=2.2.0 \
    matplotlib>=3.8.0 \
    scikit-learn>=1.4.0 \
    httpx>=0.27.0

# Copy application source code
COPY --chown=user:user server/ ./server/
COPY --chown=user:user pyproject.toml ./

# Copy compiled frontend from Stage 1
COPY --chown=user:user --from=frontend-builder /app/client/dist ./client/dist

# Expose default Hugging Face Spaces port
EXPOSE 7860

# Start FastAPI server on port 7860
CMD ["uvicorn", "server.main:app", "--host", "0.0.0.0", "--port", "7860"]
