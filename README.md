# PyMastery Studio: High-Density Python & ML Architecture Platform

PyMastery is an interactive, browser-based notebook studio engineered for experienced senior developers to rapidly master the Python scientific and machine learning stack (`NumPy`, `Pandas`, `Matplotlib`, `Scikit-Learn`, `PyTorch`) within a **1-week accelerated timeline**.

---

## Features
- **Part 1-7 Mastery Track**:
  - **Part 1: NumPy Internals & High-Performance Vectorization** (C vs Fortran contiguous layout, pointer strides, zero-copy sliding windows, BLAS GEMM pairwise distance).
  - **Part 2: Pandas Data Wrangling & BlockManager** (Series & DataFrame memory layouts, Categorical dtypes for 80% RAM reduction, vectorized groupby transforms).
  - **Part 3: PyTorch Autograd & Computational Graph DAGs** (Dynamic computation graphs, custom `torch.autograd.Function` forward/backward with gradcheck, memory-efficient SwiGLU).
  - **Part 4: Production Pipelines & CUDA Streams** (Pinned page-locked host memory, asynchronous non-blocking DMA transfers, double-buffered prefetching).
  - **Part 5: PyTorch Autograd & Modular Neural Networks** (Layer gradient flow hooks, activation rematerialization checkpointing, VRAM profiling).
  - **Part 6: Attention Mechanisms & Transformer Architecture** (Scaled dot-product attention, online softmax numerical stabilization, causal masking, SRAM memory tiling).
  - **Part 7: Full-Stack ML Integration & Model Quantization** (Post-training INT8 dynamic asymmetric quantization, scale-zero calibration, Ring All-Reduce).
- **Concept Primers**: Mathematical formulations ($\LaTeX$), naive vs idiomatic code diffs, memory layout ASCII schematics.
- **Process-Isolated Execution**: 5.0-second watchdog timer, memory cap, stdout/stderr streaming.
- **Multi-Modal Inspection Deck**: Real-time test assertion matrix, interactive Matplotlib SVG charts, Pandas DataFrame preview table, and performance profiler.
- **In-App AI Mentor & Senior Reviewer**: Real-time code critique checking for vectorization anti-patterns, time/space complexity, and Socratic Q&A chat.
- **Multi-Device Progress Sync**: 1-Click JSON Export & Import and Sync Key generation across multiple computers.

---

## Quick Start

### 1. Launch PyMastery
Run the PowerShell launcher:
```powershell
.\run.ps1
```
Or start backend and frontend individually:
```powershell
# Terminal 1 (Backend)
.\.venv\Scripts\python.exe -m uvicorn server.main:app --port 8000 --reload

# Terminal 2 (Frontend)
cd client
npm run dev
```

### 2. Open in Browser
- **Studio Interface**: [http://localhost:5173](http://localhost:5173)
- **FastAPI Backend Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Keyboard Shortcuts
- `Ctrl + Enter`: Run Code & Evaluate Test Suite
- `Ctrl + Shift + Enter`: Submit & Benchmark Performance
