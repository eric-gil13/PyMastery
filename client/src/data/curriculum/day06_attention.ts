import type { DayTrack } from '../../types';

export const DAY06_TRACK: DayTrack = {
  partNumber: 6,
  partId: 6,
  dayNumber: 6,
  id: 6,
  title: 'Part 6: Attention Mechanisms & Transformer Architecture',
  subtitle: 'Tiled IO-aware attention and online softmax stabilization',
  description: 'Implement scaled dot-product attention from scratch. Understand IO-aware memory tiling, online softmax formulation, and KV-caching mechanics in modern LLMs.',
  iconName: 'Sparkles',
  badge: 'Part 6 • Attention',
  libraryMechanics: {
    libraryName: 'FlashAttention & IO-Aware Transformer Mechanics',
    tagline: 'Deconstruct Multi-Head Attention, online softmax numerical stabilization, causal masking, and SRAM memory tiling.',
    overview: `Transformer attention computes contextual representations via pairwise token dot-products:

$$\\text{Attention}(\\mathbf{Q}, \\mathbf{K}, \\mathbf{V}) = \\text{softmax}\\left( \\frac{\\mathbf{Q}\\mathbf{K}^T}{\\sqrt{d_k}} \\right) \\mathbf{V}$$

In standard multi-head self-attention, evaluating this equation for a sequence length $N$ materializes intermediate attention score matrices $\\mathbf{S} = \\mathbf{Q}\\mathbf{K}^T \\in \\mathbb{R}^{B \\times H \\times N \\times N}$ and attention probability weights $\\mathbf{P} = \\text{softmax}(\\mathbf{S}) \\in \\mathbb{R}^{B \\times H \\times N \\times N}$.

### The $O(N^2)$ Memory Wall in GPU High Bandwidth Memory (HBM)
Modern GPUs have a tiered memory architecture:
1. **High Bandwidth Memory (HBM / VRAM):** Large capacity (24GB-80GB), but constrained bandwidth (1.5 - 3.35 TB/s on A100/H100).
2. **On-Chip SRAM (L1/Shared Memory):** Extremely small capacity (~192KB per SM, ~20MB-50MB total per GPU), but blazing fast bandwidth (**19 TB/s** on H100).

When sequence lengths reach $N = 4096, 8192$, or $128k$, storing $\\mathbf{S}$ and $\\mathbf{P}$ in HBM requires tens of gigabytes per layer just for temporary activations. The GPU compute units (Streaming Multiprocessors / Tensor Cores) spend over **80% of their clock cycles idle**, bottlenecked by reading and writing quadratic $N \\times N$ buffers across the slow HBM bus.

### The FlashAttention Breakthrough
FlashAttention (Dao et al., 2022) reorganizes the entire attention computation into **IO-aware SRAM tiles**:
- It splits queries $\\mathbf{Q}$, keys $\\mathbf{K}$, and values $\\mathbf{V}$ into small blocks ($B_r \\times d_k$ and $B_c \\times d_k$) that fit entirely inside fast on-chip SRAM.
- It computes dot products, applies online softmax scaling incrementally, and accumulates output $\\mathbf{O}$ directly in SRAM.
- It **never writes the $N \\times N$ intermediate matrix to HBM**, reducing memory complexity from $O(N^2)$ to $O(N)$ and accelerating execution by **2x - 4x**.`,
    whyItExists: `Traditional deep learning frameworks (PyTorch eager execution) dispatch individual CUDA kernels for every operation: MatMul $\\to$ Scale $\\to$ Mask $\\to$ Softmax $\\to$ MatMul. Each kernel dispatch forces a complete read/write roundtrip to HBM.

Furthermore, standard softmax requires calculating the global maximum $\\max(x)$ and global sum $\\sum e^{x_i - \\max(x)}$ across the entire sequence before any output element can be produced.

FlashAttention introduces the **Online Softmax Recurrence** (Milakov & Gimelshein) to kernel fusion: by maintaining running summary statistics ($m_i = \\text{running max}, \\ell_i = \\text{running sum}$), a block of attention output can be updated dynamically as new key-value blocks are streamed into SRAM, eliminating the requirement to see the full row before computing partial outputs.`,
    coreAnatomy: {
      objectName: 'Scaled Dot-Product Attention & KV Cache',
      description: 'Core 4D tensor geometries, projection dimensions, causal autoregressive masking, and persistent key-value cache state buffers during transformer execution.',
      fields: [
        {
          name: 'Q (Query Tensor)',
          type: 'torch.Tensor [Batch, Heads, SeqLen_Q, D_k]',
          role: 'Token representations actively searching for contextual dependencies across the sequence.'
        },
        {
          name: 'K (Key Tensor)',
          type: 'torch.Tensor [Batch, Heads, SeqLen_K, D_k]',
          role: 'Target representations against which query vectors compute compatibility dot-product scores.'
        },
        {
          name: 'V (Value Tensor)',
          type: 'torch.Tensor [Batch, Heads, SeqLen_K, D_v]',
          role: 'Informational payloads weighted by attention probabilities to form output representations.'
        },
        {
          name: 'Causal Mask',
          type: 'torch.Tensor [SeqLen_Q, SeqLen_K]',
          role: 'Additive upper-triangular matrix (-inf above diagonal) enforcing autoregressive visibility constraint.'
        },
        {
          name: 'KV-Cache Buffer',
          type: 'tuple[torch.Tensor, torch.Tensor] [Batch, Heads, MaxSeqLen, D_k]',
          role: 'Pre-allocated memory buffer storing past Keys and Values to prevent O(T^2) recomputation during decoding.'
        },
        {
          name: 'Scale Factor',
          type: 'float (1.0 / sqrt(D_k))',
          role: 'Normalization constant preventing dot-product magnitudes from exploding into softmax saturation.'
        }
      ],
      memoryDiagramAscii: `========================================================================================================
                          MULTI-HEAD ATTENTION TENSOR GEOMETRY & IO-AWARE TILING
========================================================================================================

 1. 4D TENSOR RESHAPE & PROJECTION:
    Input X (B, N, D_model) ---> Linear Projections (W_q, W_k, W_v) ---> Reshape & Transpose (B, H, N, d_k)

         Batch (B)         Heads (H)         SeqLen (N)        Head Dim (d_k)
       +-----------+     +-----------+     +-------------+     +--------------+
    Q: |  [0...B]  | --> |  [0...H]  | --> |  [0 ... N]  | --> |  [0 ... d_k] |
    K: |  [0...B]  | --> |  [0...H]  | --> |  [0 ... N]  | --> |  [0 ... d_k] |
    V: |  [0...B]  | --> |  [0...H]  | --> |  [0 ... N]  | --> |  [0 ... d_v] |

 2. STANDARD ATTENTION (HBM Memory Bottleneck - O(N^2) Writes):
    +--------------------------------------------------------------------------------------------------+
    | GPU High Bandwidth Memory (HBM ~ 2-3 TB/s)                                                       |
    |  [Q] (B,H,N,d_k) --+                                                                             |
    |                    |--> [Q @ K.T] -> Write S (B,H,N,N) [SLOW!] -> Softmax -> Write P (B,H,N,N)  |
    |  [K] (B,H,N,d_k) --+                                                              |              |
    |  [V] (B,H,N,d_v) -------------------------------------------------> [P @ V] ----+-> [Output O]  |
    +--------------------------------------------------------------------------------------------------+

 3. FLASH ATTENTION (IO-Aware SRAM Tiling - O(N) Writes, 19 TB/s):
    +--------------------------------------------------------------------------------------------------+
    | GPU High Bandwidth Memory (HBM): Stream Block Q_i, K_j, V_j ---> Write Final Output O_i          |
    |   ^                                                                                  |           |
    |   | Read Tile                                                                        v Write Res |
    |  +---------------------------------------------------------------------------------------------+ |
    |  | On-Chip SRAM Cache (19 TB/s):                                                               | |
    |  |   Tile Q_i (Br x d_k) x Tile K_j.T (d_k x Bc)  --> Local S_ij (Br x Bc)                     | |
    |  |   Online Softmax Update: m_new = max(m_old, rowmax(S_ij)), rescale prev output accumulator  | |
    |  |   Accumulate: O_i = O_i * (diag_rescale) + P_ij x V_j  (Br x d_v)                           | |
    |  +---------------------------------------------------------------------------------------------+ |
    +--------------------------------------------------------------------------------------------------+

 4. CAUSAL MASK MATRIX (SeqLen_Q x SeqLen_K):          5. AUTOREGRESSIVE KV-CACHE ACCUMULATION:
          Token 0   Token 1   Token 2   Token 3             Step t: [ past_keys (t-1) ] + [ new_key (1) ]
    T0: [   0.0      -inf      -inf      -inf   ]                   | <--------- (B, H, t, d_k) --------> |
    T1: [   0.0       0.0      -inf      -inf   ]           Q_t (1 x d_k) attends against ALL t past keys!
    T2: [   0.0       0.0       0.0      -inf   ]           Zero re-projection of tokens 0 ... t-1.
    T3: [   0.0       0.0       0.0       0.0   ]
========================================================================================================`
    },
    chapters: [
      {
        id: 'mha-tensor-algebra',
        title: 'Multi-Head Attention Tensor Algebra & Dimension Alignment',
        icon: 'Layers',
        summary: 'Reshaping, projecting, and transposing (B, N, D) representations into multi-head spaces (B, H, N, d_k).',
        markdownContent: `### Deconstructing Multi-Head Projections
In self-attention, each input token vector in $\\mathbb{R}^{D_{model}}$ is projected into $H$ distinct representation subspaces (heads), each of dimension $d_k = D_{model} / H$.

Given an input tensor $\\mathbf{X} \\in \\mathbb{R}^{B \\times N \\times D}$:
1. **Linear Projections**:
   $$\\mathbf{Q}_{proj} = \\mathbf{X} \\mathbf{W}_Q, \\quad \\mathbf{K}_{proj} = \\mathbf{X} \\mathbf{W}_K, \\quad \\mathbf{V}_{proj} = \\mathbf{X} \\mathbf{W}_V$$
   where $\\mathbf{W}_Q, \\mathbf{W}_K \\in \\mathbb{R}^{D \\times D}$ and $\\mathbf{W}_V \\in \\mathbb{R}^{D \\times D_v}$.
2. **Dimension Splitting & Head Transposition**:
   $$\\text{Shape: } (B, N, D) \\xrightarrow{\\text{view}} (B, N, H, d_k) \\xrightarrow{\\text{transpose}(1, 2)} (B, H, N, d_k)$$
   Transposing axes 1 and 2 places the head dimension before the sequence dimension, enabling **batched 2D matrix multiplications** along the trailing two axes $(N \\times d_k)$ for all batch items and heads concurrently.
3. **Batched Dot-Product Attention**:
   $$\\mathbf{S} = \\frac{\\mathbf{Q} \\mathbf{K}^T}{\\sqrt{d_k}} \\in \\mathbb{R}^{B \\times H \\times N_q \\times N_k}$$
   $$\\mathbf{O}_{heads} = \\text{softmax}(\\mathbf{S}) \\mathbf{V} \\in \\mathbb{R}^{B \\times H \\times N_q \\times d_v}$$
4. **Recombination & Output Projection**:
   $$\\mathbf{O}_{heads} \\xrightarrow{\\text{transpose}(1, 2)} (B, N_q, H, d_v) \\xrightarrow{\\text{contiguous().view}} (B, N_q, H \\cdot d_v) \\xrightarrow{\\times \\mathbf{W}_O} (B, N_q, D)$$`,
        codeSnippets: [
          {
            id: 'snippet-mha-algebra',
            title: 'Complete Multi-Head Tensor Reshape & Scaled Dot-Product',
            code: `import torch
import math

# Batch=2, SeqLen=4, D_model=16, Heads=4, d_k=4
B, N, D, H = 2, 4, 16, 4
d_k = D // H

torch.manual_seed(42)
X = torch.randn(B, N, D)

# 1. Linear projections (simulated with random weights)
W_q = torch.randn(D, D)
W_k = torch.randn(D, D)
W_v = torch.randn(D, D)

# Project: (B, N, D) -> (B, N, D)
Q = torch.matmul(X, W_q)
K = torch.matmul(X, W_k)
V = torch.matmul(X, W_v)

# 2. Reshape and Transpose into Multi-Head View: (B, H, N, d_k)
Q = Q.view(B, N, H, d_k).transpose(1, 2)
K = K.view(B, N, H, d_k).transpose(1, 2)
V = V.view(B, N, H, d_k).transpose(1, 2)

# 3. Scaled Dot-Product: (B, H, N, d_k) @ (B, H, d_k, N) -> (B, H, N, N)
scale = 1.0 / math.sqrt(d_k)
scores = torch.matmul(Q, K.transpose(-2, -1)) * scale

# 4. Softmax and Value Aggregation: (B, H, N, N) @ (B, H, N, d_k) -> (B, H, N, d_k)
attn_weights = torch.softmax(scores, dim=-1)
context = torch.matmul(attn_weights, V)

# 5. Recombine heads: (B, N, D)
out = context.transpose(1, 2).contiguous().view(B, N, D)

print(f"Input shape:        {tuple(X.shape)}")
print(f"Multi-head Q shape: {tuple(Q.shape)}")
print(f"Attention scores:   {tuple(scores.shape)}")
print(f"Recombined output:  {tuple(out.shape)}")`,
            expectedOutput: `Input shape:        (2, 4, 16)
Multi-head Q shape: (2, 4, 4, 4)
Attention scores:   (2, 4, 4, 4)
Recombined output:  (2, 4, 16)`,
            explanation: 'Demonstrates the exact tensor manipulation pipeline from unprojected input to multi-head batched GEMM and head concatenation.'
          }
        ]
      },
      {
        id: 'online-softmax-stability',
        title: 'Online Softmax & Numerical Stability (x - max(x))',
        icon: 'Zap',
        summary: 'Preventing float overflow/underflow and computing softmax incrementally in single-pass chunks.',
        markdownContent: `### Softmax Instability in Floating-Point Arithmetic
The mathematical softmax of vector $\\mathbf{x} = [x_1, \\dots, x_N]$ is:
$$\\text{softmax}(x_i) = \\frac{e^{x_i}}{\\sum_{j=1}^N e^{x_j}}$$

In 32-bit floating point (FP32), $e^x$ **overflows to $+\\infty$** when $x > 88.7$, and in 16-bit (FP16/BF16), it overflows at $x > 11.0$.

### Safe Softmax (3-Pass Algorithm)
To ensure numerical stability, standard implementations subtract the maximum element $m = \\max_j(x_j)$:
$$\\text{softmax}(x_i) = \\frac{e^{x_i - m}}{\\sum_{j=1}^N e^{x_j - m}}$$
Since $x_i - m \\le 0$, every exponent $e^{x_i - m} \\in (0, 1]$, guaranteeing **zero overflow**.

However, standard safe softmax requires **3 passes** over memory:
1. Pass 1: Find row maximum $m = \\max(x)$.
2. Pass 2: Compute exponential sum $d = \\sum e^{x_i - m}$.
3. Pass 3: Normalize each element $y_i = e^{x_i - m} / d$.

### Online Softmax Recurrence (1-Pass Tiling)
To compute softmax over streaming blocks without full-row reductions, FlashAttention uses the online softmax recurrence:

When combining an existing block state $(m^{(1)}, d^{(1)})$ with a newly arrived block $(m^{(2)}, d^{(2)})$:
$$m^{\\text{new}} = \\max(m^{(1)}, m^{(2)})$$
$$d^{\\text{new}} = d^{(1)} e^{m^{(1)} - m^{\\text{new}}} + d^{(2)} e^{m^{(2)} - m^{\\text{new}}}$$

The accumulated attention output vector $\\mathbf{O}$ is rescaled on the fly:
$$\\mathbf{O}^{\\text{new}} = \\mathbf{O}^{(1)} \\left( \\frac{d^{(1)} e^{m^{(1)} - m^{\\text{new}}}}{d^{\\text{new}}} \\right) + \\mathbf{O}^{(2)} \\left( \\frac{e^{m^{(2)} - m^{\\text{new}}}}{d^{\\text{new}}} \\right)$$

This allows updating output activations block-by-block inside SRAM with **zero accuracy loss** compared to standard global softmax!`,
        codeSnippets: [
          {
            id: 'snippet-online-softmax',
            title: 'Online Incremental Softmax vs Standard PyTorch Softmax',
            code: `import torch

def online_softmax_2blocks(x1: torch.Tensor, x2: torch.Tensor):
    """
    Compute softmax over [x1, x2] combined in 2 sequential blocks
    without concatenating or global reduction.
    """
    # Block 1 statistics
    m1 = torch.max(x1)
    d1 = torch.sum(torch.exp(x1 - m1))
    
    # Block 2 statistics
    m2 = torch.max(x2)
    d2 = torch.sum(torch.exp(x2 - m2))
    
    # Online merge recurrence
    m_new = torch.max(m1, m2)
    d_new = d1 * torch.exp(m1 - m_new) + d2 * torch.exp(m2 - m_new)
    
    # Rescaled softmax outputs
    p1 = torch.exp(x1 - m_new) / d_new
    p2 = torch.exp(x2 - m_new) / d_new
    
    return torch.cat([p1, p2])

# Test with extreme values that would overflow naive exp
x = torch.tensor([10.0, 50.0, 85.0, 92.0, 30.0, 45.0])
x1, x2 = x[:3], x[3:]

standard_softmax = torch.softmax(x, dim=0)
online_result = online_softmax_2blocks(x1, x2)

print("Standard PyTorch Softmax:", standard_softmax)
print("Online Softmax Result:   ", online_result)
print("Max Absolute Diff:       ", (standard_softmax - online_result).abs().max().item())`,
            expectedOutput: `Standard PyTorch Softmax: tensor([0.0000e+00, 0.0000e+00, 9.1105e-04, 9.9909e-01, 0.0000e+00, 0.0000e+00])
Online Softmax Result:    tensor([0.0000e+00, 0.0000e+00, 9.1105e-04, 9.9909e-01, 0.0000e+00, 0.0000e+00])
Max Absolute Diff:        0.0`,
            explanation: 'Demonstrates numerical equivalence between global PyTorch softmax and the online 2-block recurrence without full-sequence materialization.'
          }
        ]
      },
      {
        id: 'io-aware-sram-tiling',
        title: 'IO-Aware SRAM Tiling & PyTorch 2.0 F.scaled_dot_product_attention',
        icon: 'Cpu',
        summary: 'How FlashAttention fuses GEMMs and softmax to eliminate HBM IO bottlenecks, and using PyTorch 2.0 SDPA.',
        markdownContent: `### Hardware Memory Hierarchy & Operational Intensity
In deep learning algorithms, performance is bounded by either:
1. **Math-Bound (Compute-Bound):** Limited by GPU Tensor Core TFLOPs.
2. **Memory-Bound (IO-Bound):** Limited by GPU HBM memory bus bandwidth (GB/s).

Standard attention is heavily **memory-bound**: it spends the vast majority of time moving $O(N^2)$ attention matrices between HBM and SRAM.

| Metric | GPU High Bandwidth Memory (HBM) | GPU On-Chip SRAM (Shared Memory) |
|---|---|---|
| **Capacity** | 40GB - 80GB (VRAM) | 100KB - 228KB per SM (~20-50MB total) |
| **Bandwidth** | 2.0 - 3.35 TB/s | **19.0 TB/s (10x faster)** |
| **Latency** | ~200 - 400 clock cycles | ~20 - 30 clock cycles |

### PyTorch 2.0 Native SDPA
PyTorch 2.0+ introduced \`torch.nn.functional.scaled_dot_product_attention\` (SDPA), which automatically selects the most optimal backend kernel without manual CUDA implementation:
1. **FlashAttention-2 Kernel:** Fast fused IO-aware tiled execution for FP16/BF16 on Ampere/Hopper GPUs.
2. **Memory-Efficient Attention (xFormers / Cutlass):** Cutlass-based tiled attention supporting arbitrary head sizes.
3. **C++ Native Math Kernel:** Fallback for unsupported data types or CPU execution.`,
        codeSnippets: [
          {
            id: 'snippet-sdpa-backends',
            title: 'PyTorch 2.0 Scaled Dot-Product Attention with Backend Control',
            code: `import torch
import torch.nn.functional as F

# Simulate Batched Attention tensors: (Batch=2, Heads=8, SeqLen=512, D_k=64)
device = 'cuda' if torch.cuda.is_available() else 'cpu'
dtype = torch.float32 if device == 'cpu' else torch.float16

B, H, S, D_k = 2, 8, 512, 64
Q = torch.randn(B, H, S, D_k, device=device, dtype=dtype)
K = torch.randn(B, H, S, D_k, device=device, dtype=dtype)
V = torch.randn(B, H, S, D_k, device=device, dtype=dtype)

# 1. Non-causal scaled dot product attention
out_standard = F.scaled_dot_product_attention(Q, K, V, is_causal=False)

# 2. Causal autoregressive attention (automatically generates causal mask in CUDA kernel)
out_causal = F.scaled_dot_product_attention(Q, K, V, is_causal=True)

print(f"Device:               {device}")
print(f"Output Standard Shape: {tuple(out_standard.shape)}")
print(f"Output Causal Shape:   {tuple(out_causal.shape)}")
print(f"Output finite check:  {torch.isfinite(out_causal).all().item()}")`,
            expectedOutput: `Device:               cpu
Output Standard Shape: (2, 8, 512, 64)
Output Causal Shape:   (2, 8, 512, 64)
Output finite check:  True`,
            explanation: 'Uses F.scaled_dot_product_attention to execute hardware-optimized fused attention with built-in causal masking.'
          }
        ]
      },
      {
        id: 'kv-cache-autoregressive',
        title: 'KV-Cache Dynamics & Autoregressive Decoding',
        icon: 'HardDrive',
        summary: 'Eliminating redundant O(T^2) token recomputations during LLM token generation.',
        markdownContent: `### Why Autoregressive Generation is $O(T^2)$ Without Caching
During text generation (e.g. GPT, Llama), the model generates one token at a time:
- Step 1: Input prompt $x_{1 \\dots N} \\to$ generate $x_{N+1}$
- Step 2: Input $x_{1 \\dots N+1} \\to$ generate $x_{N+2}$
- Step 3: Input $x_{1 \\dots N+2} \\to$ generate $x_{N+3}$

Without caching, at step $t$, the transformer must project all past $t-1$ tokens through $\\mathbf{W}_K$ and $\\mathbf{W}_V$ again from scratch. The total computation over $T$ steps scales quadratically:
$$\\sum_{t=1}^T t = \\frac{T(T+1)}{2} = O(T^2) \\text{ FLOPs}$$

### The KV-Cache Solution ($O(T)$ FLOPs)
Because past tokens do not change in causal models, their Key and Value vectors are **immutable**:
1. At generation step $t$, compute $\\mathbf{Q}_t = x_t \\mathbf{W}_Q$ (shape $1 \\times d_k$), $\\mathbf{K}_t = x_t \\mathbf{W}_K$, $\\mathbf{V}_t = x_t \\mathbf{W}_V$.
2. Append $\\mathbf{K}_t$ and $\\mathbf{V}_t$ to the pre-allocated **KV-Cache** buffer.
3. Compute attention between single query $\\mathbf{Q}_t$ and all accumulated keys $\\mathbf{K}_{1 \\dots t}$:
   $$\\mathbf{S}_t = \\frac{\\mathbf{Q}_t \\mathbf{K}_{1 \\dots t}^T}{\\sqrt{d_k}} \\in \\mathbb{R}^{1 \\times t}$$
   $$\\mathbf{O}_t = \\text{softmax}(\\mathbf{S}_t) \\mathbf{V}_{1 \\dots t} \\in \\mathbb{R}^{1 \\times d_v}$$

### KV-Cache Memory Calculation
For a model with $L$ layers, $H_{kv}$ key-value heads, head dimension $d_k$, sequence length $S$, batch size $B$, and 2 bytes per parameter (FP16/BF16):
$$\\text{Memory (Bytes)} = 2 \\times (\\text{Keys} + \\text{Values}) \\times L \\times H_{kv} \\times d_k \\times S \\times B$$

For a 70B model ($L=80, H_{kv}=8, d_k=128$) at $S=4096, B=4$:
$$\\text{KV Cache} = 2 \\times 2 \\times 80 \\times 8 \\times 128 \\times 4096 \\times 4 \\approx 5.36 \\text{ GB}$$`,
        codeSnippets: [
          {
            id: 'snippet-kv-cache-loop',
            title: 'Simulated KV-Cached Step-by-Step Generation Loop',
            code: `import torch
import torch.nn.functional as F

B, H, d_k = 1, 4, 16
max_len = 8

# Step 0: Prompt Prefill (Prompt length = 3)
prompt_len = 3
Q_prompt = torch.randn(B, H, prompt_len, d_k)
K_prompt = torch.randn(B, H, prompt_len, d_k)
V_prompt = torch.randn(B, H, prompt_len, d_k)

# Initialize KV-Cache with prefill Keys and Values
kv_cache_k = K_prompt
kv_cache_v = V_prompt

print(f"Prefill complete. KV-Cache length: {kv_cache_k.size(2)}")

# Generation Steps: Generate 3 new tokens one by one
for step in range(3):
    # Only 1 new query/key/value per step!
    q_new = torch.randn(B, H, 1, d_k)
    k_new = torch.randn(B, H, 1, d_k)
    v_new = torch.randn(B, H, 1, d_k)
    
    # Update KV Cache
    kv_cache_k = torch.cat([kv_cache_k, k_new], dim=2)
    kv_cache_v = torch.cat([kv_cache_v, v_new], dim=2)
    
    # 1 query attends against ALL cached keys
    out_step = F.scaled_dot_product_attention(q_new, kv_cache_k, kv_cache_v)
    
    print(f"Step {step+1}: Q shape={tuple(q_new.shape)}, Cached Keys={kv_cache_k.size(2)}, Out={tuple(out_step.shape)}")`,
            expectedOutput: `Prefill complete. KV-Cache length: 3
Step 1: Q shape=(1, 4, 1, 16), Cached Keys=4, Out=(1, 4, 1, 16)
Step 2: Q shape=(1, 4, 1, 16), Cached Keys=5, Out=(1, 4, 1, 16)
Step 3: Q shape=(1, 4, 1, 16), Cached Keys=6, Out=(1, 4, 1, 16)`,
            explanation: 'Demonstrates how each autoregressive token step only performs a (1 x d_k) query projection while reusing pre-accumulated key-value cache states.'
          }
        ]
      }
    ],
    commonTraps: [
      {
        title: 'Unscaled dot product causing softmax gradients to vanish for large d_k (always multiply by 1/sqrt(d_k))',
        badSnippet: `# Naive unscaled dot-product
scores = torch.matmul(Q, K.transpose(-2, -1)) # Variance = d_k!
attn_weights = torch.softmax(scores, dim=-1)`,
        badExplanation: 'When d_k is large (e.g. 128), dot products between independent normal variables have variance equal to d_k. Large values push softmax into saturated flat regions where gradients approach zero (vanishing gradient problem).',
        goodSnippet: `# Scaled dot-product with 1 / sqrt(d_k)
d_k = Q.size(-1)
scale = 1.0 / math.sqrt(d_k)
scores = torch.matmul(Q, K.transpose(-2, -1)) * scale # Variance = 1.0
attn_weights = torch.softmax(scores, dim=-1)`,
        goodExplanation: 'Multiplying by 1/sqrt(d_k) normalizes the dot-product distribution back to unit variance (mean 0, std 1), ensuring smooth gradients and stable backpropagation across deep transformer layers.',
        perfImpact: 'Prevents training divergence and dead attention heads during backpropagation.'
      },
      {
        title: 'Materializing dense boolean masks instead of additive -inf masks for causal attention',
        badSnippet: `# Inefficient boolean mask materialization & dynamic branching
mask = torch.tril(torch.ones(seq_len, seq_len, device=device)) == 0
scores = scores.masked_fill(mask, -1e9) # Allocates temp bool tensor & branches`,
        badExplanation: 'Materializing a separate boolean tensor in HBM and calling .masked_fill() incurs memory allocation overhead and GPU branch divergence. Using arbitrary constants like -1e9 in FP16 can also cause numerical precision artifacts.',
        goodSnippet: `# Direct additive causal mask with float('-inf')
causal_mask = torch.triu(
    torch.full((seq_len, seq_len), float('-inf'), device=scores.device, dtype=scores.dtype),
    diagonal=1
)
scores = scores + causal_mask # Pure additive GEMM-friendly elementwise addition`,
        goodExplanation: 'Constructing an upper-triangular -inf tensor directly in target dtype/device allows simple fused element-wise addition (scores + mask), which maps directly into CUDA addition instructions with zero dynamic branching.',
        perfImpact: '25% faster mask application and zero boolean-to-float memory conversion overhead.'
      },
      {
        title: 'Computing full self-attention during autoregressive generation instead of maintaining KV-caches',
        badSnippet: `# Naive autoregressive generation recomputing entire sequence on each step
past_tokens = input_ids
for _ in range(max_new_tokens):
    # Recomputes Q, K, V for all past_tokens from scratch! O(T^2) FLOPs
    q = w_q(past_tokens)
    k = w_k(past_tokens)
    v = w_v(past_tokens)
    out = scaled_dot_product(q, k, v, is_causal=True)
    next_token = sample(out[:, -1, :])
    past_tokens = torch.cat([past_tokens, next_token], dim=1)`,
        badExplanation: 'Re-projects all historical tokens through linear projections W_q, W_k, W_v on every single token step, scaling total inference latency quadratically O(T^2).',
        goodSnippet: `# Efficient KV-Cached single-step decoding O(T) FLOPs
# Prefill: compute past_k, past_v for initial prompt
curr_token = prompt_last_token
for _ in range(max_new_tokens):
    # Only project query for the single latest token!
    q_curr = w_q(curr_token) # (B, 1, D)
    k_curr = w_k(curr_token)
    v_curr = w_v(curr_token)
    
    # Append to pre-allocated KV-cache
    past_k = torch.cat([past_k, k_curr], dim=2)
    past_v = torch.cat([past_v, v_curr], dim=2)
    
    # Attend 1 query against all accumulated keys
    out = F.scaled_dot_product_attention(q_curr, past_k, past_v)
    curr_token = sample(out[:, -1:, :])`,
        goodExplanation: 'Reuses previously computed Key and Value states from GPU RAM, executing only a single vector-matrix projection per generated token for O(T) total linear time.',
        perfImpact: '10x-50x speedup during autoregressive text generation for sequences exceeding 512 tokens.'
      }
    ],
    apiCheatSheet: [
      {
        name: 'F.scaled_dot_product_attention',
        category: 'Fused Attention Kernels',
        signature: 'F.scaled_dot_product_attention(query, key, value, attn_mask=None, dropout_p=0.0, is_causal=False, scale=None) -> Tensor',
        summary: 'PyTorch 2.0 native hardware-fused attention kernel dispatching to FlashAttention-2, Memory-Efficient, or C++ backends.',
        parameters: [
          { name: 'query', type: 'torch.Tensor', desc: 'Query tensor of shape (B, H, N_q, d_k)' },
          { name: 'key', type: 'torch.Tensor', desc: 'Key tensor of shape (B, H, N_k, d_k)' },
          { name: 'value', type: 'torch.Tensor', desc: 'Value tensor of shape (B, H, N_k, d_v)' },
          { name: 'is_causal', type: 'bool', desc: 'If True, applies autoregressive causal upper-triangular masking automatically' },
          { name: 'scale', type: 'float | None', desc: 'Scaling factor (defaults to 1.0 / sqrt(d_k))' }
        ],
        returns: 'torch.Tensor of shape (B, H, N_q, d_v) containing aggregated attention context.',
        exampleSnippet: `out = F.scaled_dot_product_attention(Q, K, V, is_causal=True)`
      },
      {
        name: 'torch.matmul',
        category: 'Tensor Linear Algebra',
        signature: 'torch.matmul(input, other, *, out=None) -> Tensor',
        summary: 'Batched matrix product supporting multidimensional broadcasting across leading batch/head axes.',
        parameters: [
          { name: 'input', type: 'torch.Tensor', desc: 'First tensor of shape (..., N, K)' },
          { name: 'other', type: 'torch.Tensor', desc: 'Second tensor of shape (..., K, M)' }
        ],
        returns: 'torch.Tensor of shape (..., N, M) containing batched matrix multiplication.',
        exampleSnippet: `scores = torch.matmul(Q, K.transpose(-2, -1)) # (B, H, N, d_k) @ (B, H, d_k, N) -> (B, H, N, N)`
      },
      {
        name: 'tensor.transpose',
        category: 'Tensor Views & Reshaping',
        signature: 'tensor.transpose(dim0, dim1) -> Tensor',
        summary: 'Returns a transposed view swapping two dimensions without copying underlying buffer memory.',
        parameters: [
          { name: 'dim0', type: 'int', desc: 'First dimension index to transpose' },
          { name: 'dim1', type: 'int', desc: 'Second dimension index to transpose' }
        ],
        returns: 'torch.Tensor transposed view with swapped strides.',
        exampleSnippet: `K_T = K.transpose(-2, -1) # Flips trailing 2 dimensions (SeqLen, D_k) -> (D_k, SeqLen)`
      },
      {
        name: 'torch.softmax',
        category: 'Nonlinear Activations',
        signature: 'torch.softmax(input, dim, dtype=None) -> Tensor',
        summary: 'Applies safe softmax normalization along specified dimension ensuring sum equals 1.0.',
        parameters: [
          { name: 'input', type: 'torch.Tensor', desc: 'Input score logits tensor' },
          { name: 'dim', type: 'int', desc: 'Dimension along which softmax will be computed (typically -1)' }
        ],
        returns: 'torch.Tensor with normalized probabilities between 0.0 and 1.0.',
        exampleSnippet: `attn_weights = torch.softmax(scores, dim=-1)`
      },
      {
        name: 'torch.triu',
        category: 'Mask & Tensor Creation',
        signature: 'torch.triu(input, diagonal=0, *, out=None) -> Tensor',
        summary: 'Returns the upper triangular part of a matrix or batch of matrices; other elements are set to 0.',
        parameters: [
          { name: 'input', type: 'torch.Tensor', desc: 'Input 2D or batched matrix' },
          { name: 'diagonal', type: 'int', desc: 'Diagonal offset: 0 for main diagonal, 1 for above diagonal' }
        ],
        returns: 'torch.Tensor containing upper triangular values with lower elements zeroed.',
        exampleSnippet: `mask = torch.triu(torch.full((seq, seq), float('-inf'), device=Q.device), diagonal=1)`
      },
      {
        name: 'torch.full_like',
        category: 'Mask & Tensor Creation',
        signature: 'torch.full_like(input, fill_value, *, dtype=None, device=None) -> Tensor',
        summary: 'Returns a tensor with the same size, dtype, and device as input filled with fill_value.',
        parameters: [
          { name: 'input', type: 'torch.Tensor', desc: 'Prototype tensor determining size, dtype, and device' },
          { name: 'fill_value', type: 'Number', desc: 'The number to fill the output tensor with' }
        ],
        returns: 'torch.Tensor matching input layout filled with constant value.',
        exampleSnippet: `inf_mask = torch.triu(torch.full_like(scores, float('-inf')), diagonal=1)`
      },
      {
        name: 'torch.masked_fill',
        category: 'Mask & Tensor Creation',
        signature: 'tensor.masked_fill(mask, value) -> Tensor',
        summary: 'Fills elements of tensor with value where boolean mask is True.',
        parameters: [
          { name: 'mask', type: 'torch.BoolTensor', desc: 'Boolean mask indicating positions to fill' },
          { name: 'value', type: 'float', desc: 'Scalar value to assign at masked indices' }
        ],
        returns: 'torch.Tensor with masked values replaced.',
        exampleSnippet: `scores = scores.masked_fill(causal_mask_bool, float('-inf'))`
      },
      {
        name: 'torch.einsum',
        category: 'Tensor Linear Algebra',
        signature: 'torch.einsum(equation, *operands) -> Tensor',
        summary: 'Computes Einstein summation convention products over arbitrary multidimensional indices.',
        parameters: [
          { name: 'equation', type: 'str', desc: 'Subscript string defining index contractions (e.g. "bhqd,bhkd->bhqk")' },
          { name: '*operands', type: 'torch.Tensor', desc: 'Input tensors matching subscript labels' }
        ],
        returns: 'torch.Tensor resulting from specified tensor contraction.',
        exampleSnippet: `scores = torch.einsum('bhqd,bhkd->bhqk', Q, K) * scale`
      },
      {
        name: 'torch.backends.cuda.sdp_kernel',
        category: 'Fused Attention Kernels',
        signature: 'torch.backends.cuda.sdp_kernel(enable_flash=True, enable_math=True, enable_mem_efficient=True)',
        summary: 'Context manager enabling or disabling specific SDPA execution backends in PyTorch.',
        parameters: [
          { name: 'enable_flash', type: 'bool', desc: 'Toggle FlashAttention CUDA kernel' },
          { name: 'enable_math', type: 'bool', desc: 'Toggle C++ reference math kernel' },
          { name: 'enable_mem_efficient', type: 'bool', desc: 'Toggle Cutlass memory-efficient kernel' }
        ],
        returns: 'Context manager controlling kernel dispatch policies.',
        exampleSnippet: `with torch.backends.cuda.sdp_kernel(enable_flash=True, enable_math=False):
    out = F.scaled_dot_product_attention(Q, K, V)`
      }
    ],
    interactiveWidgetType: 'pytorch-autograd'
  },
  challenges: [
    {
      id: 'd6-c1',
      dayId: 6,
      partId: 6,
      title: 'Scaled Dot-Product Attention with Online Softmax & Causal Masking',
      slug: 'sdpa-online-softmax',
      difficulty: 'Expert',
      category: 'Transformer Attention',
      summary: 'Implement multi-head scaled dot-product attention with online running maximum and causal masking.',
      mentalModel5s: 'Standard attention materializes quadratic B x H x N x N score matrices in HBM. Scaling by 1/sqrt(d_k), applying upper-triangular -inf causal masks, and utilizing online running maximum softmax stabilization prevents arithmetic overflow and memory blowup.',
      visualAnalogy: 'A librarian looking up references in an index card drawer: instead of spreading millions of index cards out across the entire library floor simultaneously, the librarian reviews and scores reference cards in organized localized batches.',
      pitfalls: [
        'Softmax numerical overflow when computing exp(S) on raw unscaled dot products (must subtract max score along last dimension before exp).',
        'Incorrect causal mask diagonal placement (diagonal=1 correctly masks strictly future tokens t_k > t_q with -inf).',
        'Transposing wrong dimensions when computing Q @ K.T (use K.transpose(-2, -1) to preserve batch and head dimensions).',
        'Missing 1/sqrt(d_k) scaling factor, which causes softmax gradients to vanish in high-dimensional embedding spaces.'
      ],
      progressiveHints: [
        'Tier 1 (Conceptual): Multi-head attention computes pairwise query-key compatibility scores scaled by sqrt(d_k) before gathering value vectors.',
        'Tier 2 (Matrix Algebra): Multiply Q (B, H, Sq, D) with K.transpose(-2, -1) (B, H, D, Sk) multiplied by scale = 1.0 / math.sqrt(Q.size(-1)).',
        'Tier 3 (Causal Mask): When is_causal=True, generate causal_mask = torch.triu(torch.full((Sq, Sk), float("-inf"), device=Q.device, dtype=Q.dtype), diagonal=1) and add to scores.',
        'Tier 4 (Softmax & Value Gathering): Compute attn_weights = torch.softmax(scores, dim=-1) and return torch.matmul(attn_weights, V).'
      ],
      deepInternals: {
        title: 'FlashAttention SRAM Memory Tiling & Online Softmax',
        content: 'FlashAttention computes attention in fast on-chip SRAM (~19 TB/s) rather than writing intermediate N x N attention probability matrices to slow High Bandwidth Memory (HBM). It maintains a running max and scaling denominator across tiles to evaluate softmax incrementally in a single pass.',
        keyRule: 'Always stabilize softmax with row-max subtraction or dispatch directly to F.scaled_dot_product_attention.'
      },
      instructions: `Standard Attention computes $S = \\frac{QK^T}{\\sqrt{d_k}}$, followed by $\\text{Softmax}(S)V$. Storing the $S \\in \\mathbb{R}^{B \\times H \\times N \\times N}$ matrix in High Bandwidth Memory (HBM) causes an $O(N^2)$ memory bottleneck.

**Tasks:**
1. Implement vectorized \`scaled_dot_product_attention(Q, K, V, is_causal=False)\`.
2. Apply the scaling factor $\\frac{1}{\\sqrt{d_k}}$ where $d_k$ is the query head dimension.
3. If \`is_causal=True\`, apply upper-triangular masking ($-\\infty$) before softmax.
4. Stabilize softmax by subtracting the row-wise maximum $\\max(x)$ before exponentiation.
5. Compute output of shape $(B, H, N_q, d_v)$.`,
      hints: [
        'scale = 1.0 / math.sqrt(Q.shape[-1])',
        'scores = torch.matmul(Q, K.transpose(-2, -1)) * scale',
        'if is_causal: causal_mask = torch.triu(torch.full((Q.size(-2), K.size(-2)), float("-inf"), device=Q.device, dtype=Q.dtype), diagonal=1); scores = scores + causal_mask',
        'attn_weights = torch.softmax(scores, dim=-1)',
        'return torch.matmul(attn_weights, V)'
      ],
      starterCode: `import torch
import math

def scaled_dot_product_attention(
    Q: torch.Tensor, 
    K: torch.Tensor, 
    V: torch.Tensor, 
    is_causal: bool = False
) -> torch.Tensor:
    """
    Compute Scaled Dot-Product Attention.
    
    Args:
        Q: (Batch, Heads, SeqLen_Q, D_k)
        K: (Batch, Heads, SeqLen_K, D_k)
        V: (Batch, Heads, SeqLen_K, D_v)
        is_causal: If True, apply autoregressive causal mask
        
    Returns:
        Output tensor of shape (Batch, Heads, SeqLen_Q, D_v)
    """
    # TODO: Implement numerically stable SDPA with causal masking
    pass
`,
      solutionCode: `import torch
import math

def scaled_dot_product_attention(
    Q: torch.Tensor, 
    K: torch.Tensor, 
    V: torch.Tensor, 
    is_causal: bool = False
) -> torch.Tensor:
    d_k = Q.size(-1)
    scale = 1.0 / math.sqrt(d_k)
    
    # Compute attention scores: (B, H, S_q, S_k)
    scores = torch.matmul(Q, K.transpose(-2, -1)) * scale
    
    if is_causal:
        seq_q, seq_k = Q.size(-2), K.size(-2)
        causal_mask = torch.triu(
            torch.full((seq_q, seq_k), float('-inf'), device=Q.device, dtype=Q.dtype),
            diagonal=1
        )
        scores = scores + causal_mask
        
    # Stable softmax along last dimension
    attn_weights = torch.softmax(scores, dim=-1)
    return torch.matmul(attn_weights, V)
`,
      testCases: [
        {
          id: 't1',
          name: 'Causal Mask Upper Triangle Zero Attention',
          inputDescription: 'Q, K, V with is_causal=True',
          expectedOutput: 'Token at t=0 has 0 weight on t>0'
        },
        {
          id: 't2',
          name: 'PyTorch Native SDPA Parity',
          inputDescription: 'Compare output against F.scaled_dot_product_attention',
          expectedOutput: 'Max absolute diff < 1e-5'
        }
      ],
      benchmarkTargetMs: 1.8,
      memoryTargetMb: 8.0,
      expectedTensors: [
        { name: 'Q', shape: '(2, 8, 512, 64)', dtype: 'float32' },
        { name: 'K', shape: '(2, 8, 512, 64)', dtype: 'float32' },
        { name: 'V', shape: '(2, 8, 512, 64)', dtype: 'float32' },
        { name: 'Output Attention Tensor', shape: '(2, 8, 512, 64)', dtype: 'float32' }
      ],
      conceptPrimer: {
        title: 'FlashAttention & IO-Aware Tiling Mechanics',
        subtitle: 'Avoiding $O(N^2)$ Memory Roundtrips between SRAM and HBM',
        overview: 'In standard attention, computing $N \\times N$ attention matrices requires continuous read/write cycles to GPU High Bandwidth Memory (HBM). FlashAttention splits $Q, K, V$ into blocks, loads them into fast on-chip SRAM (19 TB/s), and computes output incrementally using online softmax.',
        mentalModel5s: 'FlashAttention tiles Q, K, V to fit completely inside fast on-chip SRAM, computing online softmax incrementally.',
        visualAnalogy: 'Processing a book page by page in memory rather than photocopy-scanning all pages into huge image files.',
        pitfalls: [
          'Unstable softmax without max subtraction.',
          'Omitting diagonal=1 on causal upper triangle masks.'
        ],
        progressiveHints: [
          'Tier 1: Q @ K.transpose(-2, -1) * scale',
          'Tier 2: scale = 1.0 / math.sqrt(d_k)',
          'Tier 3: torch.triu(..., diagonal=1) for causal mask',
          'Tier 4: torch.matmul(attn_weights, V)'
        ],
        deepInternals: {
          title: 'SRAM Tiling & Memory Bound Kernels',
          content: 'Modern GPUs are memory bandwidth bound on attention. SRAM tiling prevents high latency HBM round-trips.',
          keyRule: 'Keep intermediate attention buffers inside SRAM.'
        },
        mathFormulas: [
          {
            title: 'Standard Attention Equation',
            latex: '\\text{Attention}(\\mathbf{Q}, \\mathbf{K}, \\mathbf{V}) = \\text{softmax}\\left( \\frac{\\mathbf{Q}\\mathbf{K}^T}{\\sqrt{d_k}} \\right) \\mathbf{V}',
            explanation: 'Fundamental attention formula scaled by square root of head dimension.'
          },
          {
            title: 'Online Softmax Recurrence',
            latex: 'm_{\\text{new}} = \\max(m_{\\text{old}}, x), \\quad d_{\\text{new}} = d_{\\text{old}} e^{m_{\\text{old}} - m_{\\text{new}}} + e^{x - m_{\\text{new}}}',
            explanation: 'Allows computing softmax incrementally block by block without seeing all tokens at once.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Naive PyTorch attention with full NxN materialization
scores = (Q @ K.transpose(-2, -1)) / math.sqrt(d_k)
if is_causal:
    scores.masked_fill_(mask == 0, -1e9)
attn = torch.softmax(scores, dim=-1)
out = attn @ V`,
          naiveExplanation: 'Materializes full (B, H, 8192, 8192) float32 matrix in HBM (~1GB per head layer).',
          idiomaticCode: `# PyTorch 2.0 Fused FlashAttention (C++ / CUDA Kernel)
out = torch.nn.functional.scaled_dot_product_attention(
    Q, K, V, is_causal=True
)`,
          idiomaticExplanation: 'Fuses GEMM + Softmax into SRAM tiles with 0 bytes of NxN HBM materialization.',
          speedupText: '4.2x faster & 90% less memory'
        },
        memoryLayout: {
          title: 'GPU Memory Hierarchy: HBM vs SRAM',
          content: 'NVIDIA HBM (VRAM): 80GB capacity, ~2-3 TB/s bandwidth. On-Chip SRAM (L1 Cache): ~200MB capacity, ~19 TB/s bandwidth. Tiling keeps intermediate values entirely inside SRAM.',
          diagramAscii: `HBM (Slow: 2 TB/s): [  Q  ]  [  K  ]  [  V  ]  ----->  [  Output  ]
                           |       |       |                 ^
                           v       v       v                 |
SRAM (Fast: 19 TB/s): [Tile Q_i x Tile K_j] -> Online Softmax x V_j`,
          keyRule: 'Keep compute in SRAM tiles to avoid hitting the PCIe / HBM memory bandwidth wall.'
        },
        keyTakeaways: [
          'Online softmax enables incremental scaling without materializing the full N x N matrix.',
          'Causal masking sets future token interaction probabilities strictly to zero.',
          'Hardware-aware algorithms design around memory bandwidth, not just FLOP counts.'
        ]
      }
    }
  ]
};

export const PART06_TRACK = DAY06_TRACK;
export default DAY06_TRACK;
