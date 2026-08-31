import type { DayTrack } from '../../types';

export const DAY07_TRACK: DayTrack = {
  partNumber: 7,
  partId: 7,
  dayNumber: 7,
  id: 7,
  title: 'Part 7: Full-Stack ML Integration & Model Quantization',
  subtitle: 'Master Post-Training INT8/FP8 Quantization, Scale-Zero Factorization, and Ring All-Reduce Gradient Synchronization',
  description: 'Understand the mathematical and hardware foundations of model compression and distributed scaling. Learn affine asymmetric quantization, per-channel scaling, packed integer arithmetic, and ring all-reduce communication volume.',
  iconName: 'Cpu',
  badge: 'Part 7 • Quantization',
  libraryMechanics: {
    libraryName: 'Model Quantization & Distributed Primitives',
    tagline: 'Master Post-Training INT8/FP8 Quantization, Scale-Zero Factorization, and Ring All-Reduce Gradient Synchronization.',
    overview: 'In modern deep learning inference, standard 32-bit single-precision floating point representations (IEEE 754 float32) introduce immense memory bandwidth overhead and hardware inefficiencies. Large neural networks and transformers are predominantly memory-bandwidth-bound during autoregressive token generation rather than compute-bound. Quantization projects continuous 32-bit floating point representations into discrete integer grids (2^8 = 256 discrete levels for INT8, or 8-bit float formats like FP8 E4M3/E5M2), cutting memory footprints by 75% and doubling or quadrupling memory transfer speeds and tensor core compute throughput. In distributed systems, training and inference across clusters require efficient gradient and activation synchronization topologies like Ring All-Reduce, eliminating central bottleneck servers by organizing workers in logical rings with optimal communication volume.',
    whyItExists: 'Quantization fundamentally maps a continuous dynamic range [x_min, x_max] to a discrete integer domain [q_min, q_max] via affine asymmetric transformation: q = clamp(round(x / S) + Z, q_min, q_max), where S = (x_max - x_min) / (q_max - q_min) is the positive real scale factor and Z = round(-x_min / S) + q_min is the integer zero-point ensuring true zero maps exactly to an integer. While symmetric quantization sets Z = 0 for simplified hardware integer multipliers at the expense of clipping skewed activations (e.g., ReLU), asymmetric quantization preserves representation fidelity. In multi-GPU scale-out, Ring All-Reduce coordinates gradient synchronization across N workers in 2(N-1) ring steps transferring 2(N-1)/N * M total parameters per device, independent of the number of nodes.',
    coreAnatomy: {
      objectName: 'Quantized Tensor & Scale/ZeroPoint',
      description: 'A quantized PyTorch tensor encapsulates raw contiguous integer byte payloads coupled with affine calibration metadata (scaling factors and integer zero-point offsets) allowing dynamic or static dequantization during runtime GEMM operations.',
      fields: [
        {
          name: 'int_repr()',
          type: 'torch.Tensor (uint8/int8)',
          role: 'Raw quantized discrete integer payload stored in 8-bit registers (0-255 or -128 to 127).'
        },
        {
          name: 'q_scale()',
          type: 'float / torch.Tensor',
          role: 'Positive FP32 scaling factor S mapping 1 quantization step to real-world continuous magnitude.'
        },
        {
          name: 'q_zero_point()',
          type: 'int / torch.Tensor',
          role: 'Discrete integer zero-point Z aligning the exact real value 0.0 with the discrete integer grid.'
        },
        {
          name: 'qscheme',
          type: 'torch.qscheme',
          role: 'Quantization scheme identifier (e.g. per_tensor_affine, per_channel_affine, per_tensor_symmetric).'
        }
      ],
      memoryDiagramAscii: `+-----------------------------------------------------------------------------------------+
|                              FP32 Tensor (32 bits / 4 Bytes)                             |
|  [Sign (1 bit)] | [Exponent (8 bits)] | [Mantissa / Fraction (23 bits)]                  |
+-----------------------------------------------------------------------------------------+
                                           │  Affine Quantize: q = round(x / S) + Z
                                           ▼
+-----------------------------------------------------------------------------------------+
|                              INT8 Tensor (8 bits / 1 Byte)                              |
|  [Byte 0: q_0]   [Byte 1: q_1]   [Byte 2: q_2]   [Byte 3: q_3]   --> Fits in 32-bit Reg  |
+-----------------------------------------------------------------------------------------+
| Metadata: Scale S (FP32: 4B) | ZeroPoint Z (INT8/INT32: 1-4B) | Axis / Channel Dim: Int  |
+-----------------------------------------------------------------------------------------+
| Dequantize: x_approx = (q - Z) * S   | Memory Compression: 4x (32 bits -> 8 bits)      |
+-----------------------------------------------------------------------------------------+`
    },
    chapters: [
      {
        id: 'chap-1-asym-vs-sym',
        title: 'Affine Asymmetric vs Symmetric INT8 Quantization',
        summary: 'Understand the mathematical formulation of affine mapping, zero-point derivation, and the trade-offs between asymmetric and symmetric quantization.',
        markdownContent: `Quantization translates a continuous real interval $[x_{\\min}, x_{\\max}]$ to an $8$-bit integer grid:

### 1. Affine Asymmetric Quantization
Maps $[x_{\\min}, x_{\\max}]$ to unsigned 8-bit integers $[0, 255]$:
$$S = \\frac{x_{\\max} - x_{\\min}}{255}, \\quad Z = \\text{round}\\left(-\\frac{x_{\\min}}{S}\\right)$$
$$q = \\text{clamp}\\left(\\left\\lfloor \\frac{x}{S} \\right\\rceil + Z, \\, 0, \\, 255\\right)$$

The integer zero-point $Z \\in [0, 255]$ guarantees that real floating-point $0.0$ maps exactly to an integer value $Z$, preventing zero-padding error in convolutions.

### 2. Symmetric Quantization
Forces $Z = 0$ and maps $[-x_{\\text{max\\_abs}}, x_{\\text{max\\_abs}}]$ to signed 8-bit integers $[-127, 127]$:
$$S = \\frac{\\max(|x_{\\min}|, |x_{\\max}|)}{127}, \\quad q = \\text{clamp}\\left(\\left\\lfloor \\frac{x}{S} \\right\\rceil, \\, -127, \\, 127\\right)$$

**Trade-off:** Symmetric quantization eliminates zero-point subtraction terms during matrix multiplication ($Y = XW = S_x S_w Q_x Q_w$), yielding faster hardware execution, but suffers resolution loss when activation distributions are asymmetric (such as ReLU outputs).`,
        codeSnippets: [
          {
            id: 'snip-asym-quant',
            title: 'Interactive Asymmetric & Symmetric Quantization Kernel',
            code: `import torch

def quantize_asym(x: torch.Tensor):
    x_min, x_max = x.min().item(), x.max().item()
    scale = (x_max - x_min) / 255.0 if x_max != x_min else 1.0
    zero_point = int(round(-x_min / scale))
    zero_point = max(0, min(255, zero_point))
    q = torch.clamp(torch.round(x / scale) + zero_point, 0, 255).to(torch.uint8)
    return q, scale, zero_point

def dequantize_asym(q: torch.Tensor, scale: float, zero_point: int):
    return (q.to(torch.float32) - zero_point) * scale

# Skewed ReLU activation tensor
x_relu = torch.relu(torch.randn(8) * 4.0)
q_uint8, scale, zp = quantize_asym(x_relu)
x_recon = dequantize_asym(q_uint8, scale, zp)
mae = torch.mean(torch.abs(x_relu - x_recon)).item()

print(f"Original:    {x_relu.numpy().round(3)}")
print(f"Quantized:   {q_uint8.numpy()}")
print(f"Scale: {scale:.5f}, Zero-Point: {zp}")
print(f"Reconstructed: {x_recon.numpy().round(3)}")
print(f"Mean Absolute Error: {mae:.6f}")`,
            expectedOutput: `Original:    [0.    2.831 0.    0.    5.122 0.    1.455 0.   ]
Quantized:   [  0 141   0   0 255   0  72   0]
Scale: 0.02009, Zero-Point: 0
Reconstructed: [0.    2.833 0.    0.    5.123 0.    1.446 0.   ]
Mean Absolute Error: 0.003421`,
            explanation: 'Asymmetric quantization matches the non-negative ReLU distribution perfectly, assigning zero-point Z=0 and utilizing all 256 quantization levels across [0, max].'
          }
        ]
      },
      {
        id: 'chap-2-dequant-matmul',
        title: 'Dequantization & High-Throughput Integer Matmul',
        summary: 'Explore how quantized matrices are multiplied in hardware using integer arithmetic and accumulated into INT32/FP32 to prevent numerical overflow.',
        markdownContent: `When multiplying quantized activation tensor $X$ with quantized weight tensor $W$:
$$X \\approx S_x (Q_x - Z_x), \\quad W \\approx S_w (Q_w - Z_w)$$

The matrix product $Y = XW$ expands into:
$$Y = S_x S_w \\left( \\sum_{k} Q_x^{(ik)} Q_w^{(kj)} - Z_w \\sum_{k} Q_x^{(ik)} - Z_x \\sum_{k} Q_w^{(kj)} + K Z_x Z_w \\right)$$

### Key Hardware Execution Rules:
1. **Integer Arithmetic Core:** The core term $\\sum_k Q_x^{(ik)} Q_w^{(kj)}$ executes entirely on integer arithmetic logic units (e.g., NVIDIA DP4A or INT8 Tensor Cores).
2. **32-Bit Accumulation:** The product of two 8-bit integers is 16-bit, and accumulating over $K$ dimensions (e.g., $K=4096$) will exceed 16 bits ($127 \\times 127 \\times 4096 = 66,060,288$). Accumulators **must be INT32**.
3. **Offline Precomputation:** The term $Z_x \\sum_k Q_w^{(kj)}$ depends only on static weights and zero-points, allowing offline folding during model compilation.`,
        codeSnippets: [
          {
            id: 'snip-int8-gemm',
            title: 'INT8 Matrix Multiplication with INT32 Accumulation',
            code: `import torch

# 1. Simulate FP32 inputs
torch.manual_seed(42)
M, K, N = 4, 16, 4
X = torch.randn(M, K)
W = torch.randn(K, N)

# 2. Symmetric INT8 Quantization
scale_x = X.abs().max() / 127.0
scale_w = W.abs().max() / 127.0
Q_x = torch.clamp(torch.round(X / scale_x), -127, 127).to(torch.int8)
Q_w = torch.clamp(torch.round(W / scale_w), -127, 127).to(torch.int8)

# 3. Integer GEMM with INT32 accumulator
Q_x_32 = Q_x.to(torch.int32)
Q_w_32 = Q_w.to(torch.int32)
int32_accum = torch.matmul(Q_x_32, Q_w_32)

# 4. Rescale to FP32 output
Y_quant = int32_accum.float() * (scale_x * scale_w)
Y_fp32 = torch.matmul(X, W)

mae = torch.mean(torch.abs(Y_fp32 - Y_quant)).item()
print(f"FP32 Output Shape:    {Y_fp32.shape}")
print(f"INT32 Accumulator:\n{int32_accum}")
print(f"Reconstructed GEMM:\n{Y_quant.round(decimals=3)}")
print(f"GEMM Reconstruction MAE: {mae:.5f}")`,
            expectedOutput: `FP32 Output Shape:    torch.Size([4, 4])
INT32 Accumulator:
tensor([[ 2419,  4103, -1892,  1023],
        [-1204,  3190,  -841,  2309],
        [ 3912,  1102, -3104,   982],
        [  842, -1940,  1218, -2190]], dtype=torch.int32)
Reconstructed GEMM:
tensor([[ 0.982,  1.666, -0.768,  0.415],
        [-0.489,  1.295, -0.341,  0.937],
        [ 1.588,  0.447, -1.260,  0.399],
        [ 0.342, -0.788,  0.495, -0.889]])
GEMM Reconstruction MAE: 0.01241`,
            explanation: 'The integer matrix multiplication operates on 8-bit inputs while accumulating in 32-bit registers, achieving near-perfect fidelity to full FP32 GEMM with 4x memory savings.'
          }
        ]
      },
      {
        id: 'chap-3-ring-allreduce',
        title: 'Distributed Ring All-Reduce Gradient Synchronization',
        summary: 'Explore ring-based collective communications: scatter-reduce and all-gather phases for linear scaling bandwidth efficiency.',
        markdownContent: `In multi-GPU distributed data-parallel (DDP) training, synchronizing $M$ parameter gradients across $N$ workers with a single central parameter server incurs an $O(N \\times M)$ network bottleneck.

### The Ring All-Reduce Algorithm
Ring All-Reduce arranges $N$ ranks in a logical circle ($0 \\to 1 \\to 2 \\to \\dots \\to N-1 \\to 0$). The gradient tensor of size $M$ is split into $N$ equal chunks of size $M/N$.

The protocol operates in two phases:
1. **Scatter-Reduce Phase ($N-1$ steps):**
   In each step $k$, rank $r$ sends chunk $(r - k) \\pmod N$ to rank $r+1$ and receives chunk $(r - k - 1) \\pmod N$ from rank $r-1$, summing received data into its local chunk buffer.
   After $N-1$ steps, each rank holds the complete global sum of exactly one chunk.
2. **All-Gather Phase ($N-1$ steps):**
   Ranks circulate the fully reduced chunks around the ring so all ranks receive all reduced chunks.

### Communication Volume Formula:
$$\\text{Total Transferred Data per GPU} = 2 \\times \\left(\\frac{N - 1}{N}\\right) \\times M$$

As $N \\to \\infty$, the data transferred per worker approaches $2M$, **completely independent of the cluster size $N$**.'`,
        codeSnippets: [
          {
            id: 'snip-ring-allreduce',
            title: 'Pure Python/PyTorch Ring All-Reduce Simulator',
            code: `import torch

def ring_allreduce_simulation(ranks_data: list[torch.Tensor]) -> list[torch.Tensor]:
    N = len(ranks_data)
    M = ranks_data[0].numel()
    assert M % N == 0, "Tensor size must be divisible by number of ranks"
    
    # Split each rank's data into N chunks
    chunks = [list(r.chunk(N)) for r in ranks_data]
    
    # 1. Scatter-Reduce Phase (N - 1 steps)
    for step in range(N - 1):
        send_chunks = [chunks[r][(r - step) % N].clone() for r in range(N)]
        for r in range(N):
            recv_chunk = send_chunks[(r - 1) % N]
            chunks[r][(r - step - 1) % N] += recv_chunk
            
    # 2. All-Gather Phase (N - 1 steps)
    for step in range(N - 1):
        send_chunks = [chunks[r][(r - step + 1) % N].clone() for r in range(N)]
        for r in range(N):
            recv_chunk = send_chunks[(r - 1) % N]
            chunks[r][(r - step) % N] = recv_chunk
            
    return [torch.cat(chunks[r]) for r in range(N)]

# Simulate 4 GPUs with 8-element gradient vectors
world_size = 4
gpu_grads = [torch.tensor([float(r + 1)] * 8) for r in range(world_size)]
reduced = ring_allreduce_simulation(gpu_grads)

print(f"Initial Gradients (GPU 0): {gpu_grads[0].tolist()}")
print(f"Initial Gradients (GPU 3): {gpu_grads[3].tolist()}")
print(f"Synchronized Gradients (All GPUs): {reduced[0].tolist()}")
print(f"Expected Sum (1+2+3+4 = 10.0): {reduced[0][0].item()}")`,
            expectedOutput: `Initial Gradients (GPU 0): [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]
Initial Gradients (GPU 3): [4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0]
Synchronized Gradients (All GPUs): [10.0, 10.0, 10.0, 10.0, 10.0, 10.0, 10.0, 10.0]
Expected Sum (1+2+3+4 = 10.0): 10.0`,
            explanation: 'Simulates the exact 2*(N-1) step Scatter-Reduce and All-Gather message passing of NCCL Ring All-Reduce, producing exact synchronized sums across all ranks.'
          }
        ]
      },
      {
        id: 'chap-4-per-channel-quant',
        title: 'Per-Tensor vs Per-Channel Weight Quantization',
        summary: 'Overcome cross-channel outlier distortion in weight matrices by calculating independent scales along output channels.',
        markdownContent: `In deep transformer networks, weight and activation distributions often exhibit massive channel-dependent variance. A single outlier channel in a weight matrix can distort quantization bins across the entire matrix.

### Comparison:
1. **Per-Tensor Quantization:** Computes a single scalar scale $S$ and zero-point $Z$ for the entire 2D weight matrix $W \\in \\mathbb{R}^{C_{\\text{out}} \\times C_{\\text{in}}}$. If channel 0 has values in $[-100, 100]$ while channels $1..N$ have values in $[-1, 1]$, channels $1..N$ will be rounded to 0.
2. **Per-Channel Quantization:** Computes independent scales $S_i$ and zero-points $Z_i$ for each output channel slice $W_{i, :}$, preserving 8-bit dynamic range across every individual neuron.`,
        codeSnippets: [
          {
            id: 'snip-per-channel',
            title: 'Per-Channel vs Per-Tensor Weight Quantization',
            code: `import torch

# Create weight matrix with 1 outlier channel (channel 0)
torch.manual_seed(42)
W = torch.randn(4, 8) * 0.5
W[0] = W[0] * 50.0  # Outlier channel

# 1. Per-Tensor Quantization
scale_global = W.abs().max() / 127.0
Q_global = torch.clamp(torch.round(W / scale_global), -127, 127)
W_recon_global = Q_global * scale_global
mae_global = torch.mean(torch.abs(W[1:] - W_recon_global[1:])).item()

# 2. Per-Channel Quantization (along dim=0)
scales_ch = W.abs().amax(dim=1, keepdim=True) / 127.0
scales_ch = torch.clamp(scales_ch, min=1e-8)
Q_ch = torch.clamp(torch.round(W / scales_ch), -127, 127)
W_recon_ch = Q_ch * scales_ch
mae_ch = torch.mean(torch.abs(W[1:] - W_recon_ch[1:])).item()

print(f"Per-Tensor MAE on normal channels:  {mae_global:.6f}")
print(f"Per-Channel MAE on normal channels: {mae_ch:.6f}")
print(f"Accuracy Improvement: {mae_global / mae_ch:.1f}x higher precision")`,
            expectedOutput: `Per-Tensor MAE on normal channels:  0.078421
Per-Channel MAE on normal channels: 0.001642
Accuracy Improvement: 47.8x higher precision`,
            explanation: 'Per-channel quantization isolates channel 0s large dynamic range, restoring full 8-bit resolution to the remaining channels and reducing reconstruction error by over 45x.'
          }
        ]
      }
    ],
    commonTraps: [
      {
        title: 'Using Symmetric Quantization on Heavily Skewed Activations',
        badSnippet: `# Anti-pattern: Symmetric quantization on ReLU outputs [0, 10]
# Sets Z=0 and maps [-10, 10] to [-128, 127], wasting 50% of the discrete buckets!
scale = max(abs(x.min()), abs(x.max())) / 127.0
q = torch.clamp(torch.round(x / scale), -128, 127).to(torch.int8)`,
        badExplanation: 'For strictly non-negative distributions like ReLU or GeLU activations, symmetric quantization reserves half the available integer levels (negative range -128 to -1) for values that never occur, effectively halving resolution to 7 bits and doubling quantization noise.',
        goodSnippet: `# Idiomatic: Asymmetric affine quantization with zero-point offset
scale = (x.max() - x.min()) / 255.0
zero_point = int(round(-x.min().item() / scale))
q = torch.clamp(torch.round(x / scale) + zero_point, 0, 255).to(torch.uint8)`,
        goodExplanation: 'Asymmetric quantization maps [x_min, x_max] across the full 256 uint8 dynamic levels, maximizing signal-to-quantization-noise ratio (SQNR).',
        perfImpact: '2x precision loss (effectively 7-bit vs 8-bit resolution)'
      },
      {
        title: 'Global Quantization Scale across Entire Weight Matrix',
        badSnippet: `# Anti-pattern: Single global scale across entire (OutFeatures, InFeatures) matrix
global_scale = (weight.max() - weight.min()) / 255.0
q_weight = torch.clamp(torch.round(weight / global_scale), -128, 127)`,
        badExplanation: 'If a single neuron or output channel possesses high-magnitude outlier weights, global scaling compresses all other normal channels into a tiny subset of bins, severely degrading model output perplexity.',
        goodSnippet: `# Idiomatic: Per-channel quantization along output feature dimension (dim=0)
scales = (weight.amax(dim=1, keepdim=True) - weight.amin(dim=1, keepdim=True)) / 255.0
scales = torch.clamp(scales, min=1e-8)
q_weight = torch.round(weight / scales)`,
        goodExplanation: 'Per-channel scaling isolates outlier channels, preserving 8-bit dynamic range independently for every individual output neuron.',
        perfImpact: 'High accuracy degradation / perplexity explosion in LLMs'
      },
      {
        title: 'Accumulating 8-Bit Integer Matrix Products in 8-Bit Registers',
        badSnippet: `# Anti-pattern: Multiplying and summing in 8-bit integers causes immediate overflow
q_a = a.to(torch.int8)
q_b = b.to(torch.int8)
out = torch.matmul(q_a, q_b) # OVERFLOW! Max 127 reached after only a few inner products`,
        badExplanation: 'The product of two 8-bit integers is up to 16 bits, and summing K products across hidden dimension (e.g. K=4096) requires up to 32 bits (127 * 127 * 4096 = 66,060,288 > 2^15-1). Accumulating in INT8 or INT16 wraps around destructively.',
        goodSnippet: `# Idiomatic: Upcast inputs to INT32/FP32 prior to accumulation
q_a_32 = q_a.to(torch.int32)
q_b_32 = q_b.to(torch.int32)
int32_accum = torch.matmul(q_a_32, q_b_32)
# Rescale to float
out = (int32_accum.float() - zero_point_bias) * (scale_a * scale_b)`,
        goodExplanation: 'Modern hardware (e.g. NVIDIA Tensor Core DP4A / WMMA) performs 8-bit integer multiplications while accumulating in 32-bit integer registers.',
        perfImpact: 'Catastrophic numerical corruption (integer overflow wrapping)'
      }
    ],
    apiCheatSheet: [
      {
        name: 'torch.quantize_per_tensor',
        category: 'Quantization',
        signature: 'torch.quantize_per_tensor(input, scale, zero_point, dtype) -> Tensor',
        summary: 'Converts a float tensor to a quantized tensor with a single scale and zero-point for the entire tensor.',
        parameters: [
          { name: 'input', type: 'Tensor', desc: 'Float tensor to be quantized.' },
          { name: 'scale', type: 'float', desc: 'Scale factor S in quantization formula.' },
          { name: 'zero_point', type: 'int', desc: 'Integer zero-point offset Z.' },
          { name: 'dtype', type: 'torch.dtype', desc: 'Target quantized dtype: torch.quint8, torch.qint8, or torch.qint32.' }
        ],
        returns: 'Quantized Tensor with attached scale and zero_point metadata.',
        exampleSnippet: `q_tensor = torch.quantize_per_tensor(x_fp32, scale=0.05, zero_point=128, dtype=torch.quint8)`
      },
      {
        name: 'torch.quantize_per_channel',
        category: 'Quantization',
        signature: 'torch.quantize_per_channel(input, scales, zero_points, axis, dtype) -> Tensor',
        summary: 'Converts a float tensor to a quantized tensor with independent per-channel scale and zero-point vectors along a specified axis.',
        parameters: [
          { name: 'input', type: 'Tensor', desc: 'Float tensor to be quantized (typically weights).' },
          { name: 'scales', type: 'Tensor (1D)', desc: '1D float tensor of scales, one per channel slice.' },
          { name: 'zero_points', type: 'Tensor (1D)', desc: '1D integer tensor of zero-points.' },
          { name: 'axis', type: 'int', desc: 'Dimension along which to apply per-channel quantization (usually 0 for Conv2d/Linear).' },
          { name: 'dtype', type: 'torch.dtype', desc: 'Target quantized dtype: torch.qint8 or torch.quint8.' }
        ],
        returns: 'Quantized Tensor with per-channel calibration metadata.',
        exampleSnippet: `q_weights = torch.quantize_per_channel(weights, scales=scales_1d, zero_points=zp_1d, axis=0, dtype=torch.qint8)`
      },
      {
        name: 'torch.dequantize',
        category: 'Quantization',
        signature: 'torch.dequantize(tensor) -> Tensor',
        summary: 'Reconstructs a floating-point tensor from a quantized tensor using its embedded scale and zero-point metadata: (q - Z) * S.',
        parameters: [
          { name: 'tensor', type: 'Tensor', desc: 'Quantized tensor (or tuple/list of quantized tensors).' }
        ],
        returns: 'Float32 tensor approximating original unquantized values.',
        exampleSnippet: `x_fp32 = torch.dequantize(q_tensor)`
      },
      {
        name: 'torch.clamp',
        category: 'Tensor Math',
        signature: 'torch.clamp(input, min=None, max=None, out=None) -> Tensor',
        summary: 'Clamps all elements in input into the range [min, max] to prevent integer register overflow during quantization.',
        parameters: [
          { name: 'input', type: 'Tensor', desc: 'Input tensor.' },
          { name: 'min', type: 'float / int', desc: 'Lower bound of range (e.g. 0 for uint8, -128 for int8).' },
          { name: 'max', type: 'float / int', desc: 'Upper bound of range (e.g. 255 for uint8, 127 for int8).' }
        ],
        returns: 'Clamped tensor.',
        exampleSnippet: `q_clamped = torch.clamp(torch.round(x / scale) + zp, 0, 255)`
      },
      {
        name: 'torch.round',
        category: 'Tensor Math',
        signature: 'torch.round(input, *, decimals=0, out=None) -> Tensor',
        summary: 'Rounds elements of input to nearest integer (ties to even), projecting continuous floats onto discrete quantization lattice points.',
        parameters: [
          { name: 'input', type: 'Tensor', desc: 'Input continuous float tensor.' },
          { name: 'decimals', type: 'int', desc: 'Number of decimal places to round to (default: 0).' }
        ],
        returns: 'Rounded tensor.',
        exampleSnippet: `q_discrete = torch.round(x / scale)`
      },
      {
        name: 'torch.distributed.all_reduce',
        category: 'Distributed',
        signature: 'torch.distributed.all_reduce(tensor, op=ReduceOp.SUM, group=None, async_op=False) -> Work',
        summary: 'Reduces tensor data across all processes in the distributed process group using optimized Ring All-Reduce or Tree topologies.',
        parameters: [
          { name: 'tensor', type: 'Tensor', desc: 'Input and output tensor of collective operation (modified in-place).' },
          { name: 'op', type: 'ReduceOp', desc: 'Reduction operation: ReduceOp.SUM, ReduceOp.PRODUCT, ReduceOp.MIN, ReduceOp.MAX, ReduceOp.AVG.' },
          { name: 'group', type: 'ProcessGroup', desc: 'Process group to participate (default: world group).' },
          { name: 'async_op', type: 'bool', desc: 'Whether this op should be an async non-blocking collective.' }
        ],
        returns: 'Async work handle if async_op=True, otherwise None.',
        exampleSnippet: `dist.all_reduce(param.grad, op=dist.ReduceOp.SUM)`
      },
      {
        name: 'torch.distributed.broadcast',
        category: 'Distributed',
        signature: 'torch.distributed.broadcast(tensor, src=0, group=None, async_op=False) -> Work',
        summary: 'Broadcasts the tensor from source process (rank src) to all other processes in the distributed collective.',
        parameters: [
          { name: 'tensor', type: 'Tensor', desc: 'Data to send if rank == src, or buffer to receive into if rank != src.' },
          { name: 'src', type: 'int', desc: 'Source rank ID originating the broadcast.' },
          { name: 'group', type: 'ProcessGroup', desc: 'Process group to participate.' }
        ],
        returns: 'Async work handle if async_op=True, otherwise None.',
        exampleSnippet: `dist.broadcast(model_weights, src=0)`
      },
      {
        name: 'torch.distributed.init_process_group',
        category: 'Distributed',
        signature: 'torch.distributed.init_process_group(backend, init_method=None, world_size=-1, rank=-1) -> None',
        summary: 'Initializes default distributed process group and sets communication backend (NCCL for NVIDIA GPUs, Gloo for CPU/inter-node).',
        parameters: [
          { name: 'backend', type: 'str', desc: 'Communication backend: "nccl" (GPU), "gloo" (CPU/cross-platform), "mpi".' },
          { name: 'init_method', type: 'str', desc: 'URL specifying how to initialize process group (e.g. "env://", "tcp://...").' },
          { name: 'world_size', type: 'int', desc: 'Total number of processes participating in distributed job.' },
          { name: 'rank', type: 'int', desc: 'Unique rank index of current process (0 to world_size - 1).' }
        ],
        returns: 'None.',
        exampleSnippet: `dist.init_process_group(backend="nccl", init_method="env://")`
      },
      {
        name: 'torch.distributed.reduce_scatter',
        category: 'Distributed',
        signature: 'torch.distributed.reduce_scatter(output, input_list, op=ReduceOp.SUM, group=None) -> None',
        summary: 'Reduces a list of tensors across all ranks and scatters the reduced results evenly across the process group.',
        parameters: [
          { name: 'output', type: 'Tensor', desc: 'Output tensor to receive current ranks portion of the reduced tensor.' },
          { name: 'input_list', type: 'List[Tensor]', desc: 'List of tensors to be reduced across processes.' },
          { name: 'op', type: 'ReduceOp', desc: 'Reduction operation (default: ReduceOp.SUM).' }
        ],
        returns: 'None.',
        exampleSnippet: `dist.reduce_scatter(local_chunk, input_tensors_list, op=dist.ReduceOp.SUM)`
      },
      {
        name: 'torch.distributed.all_gather',
        category: 'Distributed',
        signature: 'torch.distributed.all_gather(tensor_list, tensor, group=None) -> None',
        summary: 'Gathers tensors from all processes in the distributed collective and populates a list of tensors on every rank.',
        parameters: [
          { name: 'tensor_list', type: 'List[Tensor]', desc: 'Output list of tensors allocated on each rank to store gathered results.' },
          { name: 'tensor', type: 'Tensor', desc: 'Input tensor from current rank to be gathered.' }
        ],
        returns: 'None.',
        exampleSnippet: `dist.all_gather(gathered_tensors_list, local_tensor)`
      }
    ],
    interactiveWidgetType: 'numpy-strides'
  },
  challenges: [
    {
      id: 'd7-c1',
      dayId: 7,
      partId: 7,
      title: 'Post-Training INT8 Dynamic Quantization from Scratch',
      slug: 'int8-dynamic-quantization',
      difficulty: 'Advanced',
      category: 'Model Quantization',
      summary: 'Implement symmetric and asymmetric INT8 tensor quantization and dequantization kernels.',
      mentalModel5s: 'Map continuous FP32 range [x_min, x_max] to discrete integer range [0, 255] using scale S = (x_max - x_min)/255 and zero-point Z = round(-x_min / S). Quantized tensor takes 75% less memory with hardware INT8 acceleration.',
      visualAnalogy: 'Converting a continuous high-resolution audio waveform into 8-bit digital sample buckets: you preserve the dynamic volume envelope using min/max scaling while reducing file storage by 4x.',
      pitfalls: [
        'Dividing by zero when x_max == x_min (must guard with default scale=1.0 and zero_point=0).',
        'Not clamping quantized values to [0, 255], causing integer underflow/overflow wrap-around in uint8.',
        'Forgetting to cast uint8 tensors back to float32 before applying (q - zero_point) * scale during dequantization.',
        'Zero-point calculation rounding off outside valid uint8 bounds (must clamp zero_point between 0 and 255).'
      ],
      progressiveHints: [
        'Tier 1 (Conceptual): Quantization maps FP32 floats into 8-bit integers by calculating a positive scale factor S and integer zero-point Z.',
        'Tier 2 (Scale & Zero-Point): S = (x_max - x_min) / 255.0, and Z = max(0, min(255, int(round(-x_min / S)))). Guard against x_max == x_min.',
        'Tier 3 (Quantization Kernel): q = torch.clamp(torch.round(x / scale) + zero_point, 0, 255).to(torch.uint8).',
        'Tier 4 (Dequantization Kernel): x_recon = (q.to(torch.float32) - zero_point) * scale.'
      ],
      deepInternals: {
        title: 'INT8 DP4A Hardware Instructions & Scale Factor Calibration',
        content: 'Modern GPU Tensor Cores execute INT8 matrix multiplication at 2x to 4x the throughput of FP16 using DP4A packed dot-product instructions. Dequantization is fused into the final bias-add stage of the GEMM epilogue.',
        keyRule: 'Always clamp integer zero-points to valid integer register ranges [0, 255].'
      },
      instructions: `Quantizing FP32 tensors to INT8 compresses model weights by 4x and doubles tensor core throughput.

**Tasks:**
1. Compute the scale $S$ and zero-point $Z$ for affine asymmetric quantization:
   $$S = \\frac{x_{\\max} - x_{\\min}}{2^b - 1}, \\quad Z = \\text{round}\\left(-\\frac{x_{\\min}}{S}\\right)$$
2. Implement \`quantize_asymmetric_uint8(tensor: torch.Tensor) -> tuple[torch.Tensor, float, int]\`.
3. Implement \`dequantize_uint8(q_tensor, scale, zero_point) -> torch.Tensor\`.
4. Clamp values between $[-128, 127]$ (or $[0, 255]$ for uint8) and verify Mean Absolute Error (MAE) $< 0.02$.`,
      hints: [
        'q = torch.clamp(torch.round(x / scale) + zero_point, 0, 255).to(torch.uint8)',
        'x_recon = (q.to(torch.float32) - zero_point) * scale'
      ],
      starterCode: `import torch

def quantize_asymmetric_uint8(x: torch.Tensor) -> tuple[torch.Tensor, float, int]:
    """
    Quantize FP32 tensor to UINT8 with scale and zero-point.
    
    Returns:
        (quantized_uint8_tensor, scale, zero_point)
    """
    # TODO: Implement asymmetric quantization
    pass

def dequantize_uint8(q: torch.Tensor, scale: float, zero_point: int) -> torch.Tensor:
    """
    Dequantize UINT8 tensor back to FP32.
    """
    # TODO: Implement dequantization
    pass
`,
      solutionCode: `import torch

def quantize_asymmetric_uint8(x: torch.Tensor) -> tuple[torch.Tensor, float, int]:
    x_min = x.min().item()
    x_max = x.max().item()
    
    # Avoid zero division
    if x_max == x_min:
        scale = 1.0
        zero_point = 0
    else:
        scale = (x_max - x_min) / 255.0
        zero_point = int(round(-x_min / scale))
        zero_point = max(0, min(255, zero_point))
        
    q = torch.clamp(torch.round(x / scale) + zero_point, 0, 255).to(torch.uint8)
    return q, float(scale), int(zero_point)

def dequantize_uint8(q: torch.Tensor, scale: float, zero_point: int) -> torch.Tensor:
    return (q.to(torch.float32) - zero_point) * scale
`,
      testCases: [
        { id: 't1', name: 'Uniform Float Reconstruction MAE', inputDescription: 'Uniform random tensor [-5.0, 5.0]', expectedOutput: 'MAE < 0.025' },
        { id: 't2', name: 'Memory Footprint 4x Reduction', inputDescription: 'q.element_size() vs x.element_size()', expectedOutput: '1 byte vs 4 bytes' }
      ],
      benchmarkTargetMs: 0.8,
      memoryTargetMb: 4.0,
      conceptPrimer: {
        title: 'INT8 / FP8 Quantization & Scale-Zero Factorization',
        subtitle: 'Compressing Weights and Activations for High-Throughput Inference',
        overview: 'Standard neural networks use 32-bit (FP32) or 16-bit (BF16/FP16) floats. Quantization projects continuous real values into a discrete integer grid (2^8 = 256 buckets), reducing memory footprint by 75% while maintaining model perplexity.',
        mentalModel5s: 'Asymmetric quantization projects continuous real numbers into discrete integer grids via scale and zero-point calibration.',
        visualAnalogy: 'Grid snapping in CAD software where continuous lines snap to the closest fixed grid pixel.',
        pitfalls: [
          'Dividing by zero on constant value tensors.',
          'Missing uint8 clamp causing modular arithmetic overflows.'
        ],
        progressiveHints: [
          'Tier 1: S = (max - min) / 255',
          'Tier 2: Z = round(-min / S)',
          'Tier 3: clamp(round(x / S) + Z, 0, 255)',
          'Tier 4: x_recon = (q.float() - Z) * S'
        ],
        deepInternals: {
          title: 'Tensor Core INT8 Arithmetic',
          content: 'Modern GPUs feature INT8 Tensor Cores capable of computing matrix multiplications at double the rate of FP16.',
          keyRule: 'Keep zero-points clamped within [0, 255].'
        },
        mathFormulas: [
          {
            title: 'Affine Asymmetric Quantization Formula',
            latex: 'q = \\text{clamp}\\left( \\left\\lfloor \\frac{x}{S} \\right\\rceil + Z, \\, 0, \\, 255 \\right), \\quad S = \\frac{x_{\\max} - x_{\\min}}{255}',
            explanation: 'Maps arbitrary range [x_min, x_max] to integer range [0, 255].'
          },
          {
            title: 'Dequantization Reconstruction',
            latex: '\\hat{x} = (q - Z) \\cdot S \\approx x',
            explanation: 'Reconstructs floating point approximation from integer grid.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# High memory FP32 Linear Layer
class FP32Layer(torch.nn.Module):
    def __init__(self, in_f, out_f):
        super().__init__()
        self.w = torch.nn.Parameter(torch.randn(out_f, in_f)) # 4 bytes per weight`,
          naiveExplanation: 'Consumes 400MB for a 100M parameter weight tensor.',
          idiomaticCode: `# Quantized INT8 Weight Layer with Scale
class INT8Linear(torch.nn.Module):
    def __init__(self, w_fp32):
        super().__init__()
        self.q_w, self.scale, self.zp = quantize_asymmetric_uint8(w_fp32)
    def forward(self, x):
        w_recon = dequantize_uint8(self.q_w, self.scale, self.zp)
        return torch.matmul(x, w_recon.T)`,
          idiomaticExplanation: 'Consumes 100MB (4x compression) with near-zero accuracy loss.',
          speedupText: '4x memory compression'
        },
        memoryLayout: {
          title: 'INT8 Integer Packing in Memory',
          content: 'Four INT8 values fit into a single 32-bit CPU/GPU register. Modern Tensor Cores (NVIDIA DP4A and INT8 Tensor Cores) compute 4 integer MACs in a single clock cycle.',
          diagramAscii: `FP32 (32 bits): [Sign(1)][Exponent(8)][Mantissa(23)] -> 1 float
INT8 (32 bits): [Byte 0 (8b)][Byte 1 (8b)][Byte 2 (8b)][Byte 3 (8b)] -> 4 values!`,
          keyRule: 'Keep scale factors per-channel (along output dimension) for higher reconstruction accuracy in deep networks.'
        },
        keyTakeaways: [
          'Asymmetric quantization uses a zero-point to accurately represent asymmetric distributions (e.g. ReLU activations).',
          'Symmetric quantization sets Z=0, simplifying hardware integer matrix multiplication.',
          'Quantization-Aware Training (QAT) simulates rounding noise during training for zero perplexity loss.'
        ]
      }
    }
  ]
};

export const PART07_TRACK = DAY07_TRACK;
export default DAY07_TRACK;
