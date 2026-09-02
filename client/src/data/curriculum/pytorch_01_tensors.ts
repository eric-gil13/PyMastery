import type { DayTrack, Challenge, ConceptPrimerData, TestCase } from '../../types';

export const CHALLENGE_1: Challenge = {
  id: 'torch-p1-c1',
  dayId: 1,
  partId: 1,
  title: 'Multi-Dimensional Tensor Initializer',
  slug: 'multi-dimensional-tensor-initializer',
  difficulty: 'Beginner',
  category: 'Tensor Foundations',
  summary: 'Create typed float32 tensors from nested lists, validate dimensional compatibility, and perform matrix multiplication between tensors.',
  mentalModel5s: 'NumPy has ndarrays; PyTorch has Tensors. Tensors are typed arrays that execute on GPUs and record computation graphs for automatic differentiation.',
  visualAnalogy: 'Think of standard Python lists as loose folders of loose papers, while a PyTorch Tensor is an industrialized steel tray of identical numeric blocks ready for GPU factory processing.',
  pitfalls: [
    'Confusing element-wise multiplication (*) with matrix multiplication (torch.matmul or @).',
    'Forgetting to enforce dtype=torch.float32 during tensor instantiation.',
    'Ignoring 2D shape validation or multiplying matrices with mismatched inner dimensions.'
  ],
  progressiveHints: [
    'Tier 1: Convert matrix_a and matrix_b using torch.tensor(..., dtype=torch.float32).',
    'Tier 2: Check that tensor_a.ndim == 2 and tensor_b.ndim == 2; otherwise raise ValueError("Inputs must be 2D matrices").',
    'Tier 3: Ensure tensor_a.shape[1] == tensor_b.shape[0]; otherwise raise ValueError with an informative error message.',
    'Tier 4: Compute product = torch.matmul(tensor_a, tensor_b) and allocate zeros_tensor = torch.zeros(zeros_shape, dtype=torch.float32).'
  ],
  deepInternals: {
    title: 'BLAS & GEMM Hardware Acceleration',
    content: 'torch.matmul leverages highly optimized GEMM (General Matrix Multiply) routines from Intel MKL / Apple Accelerate on CPU and cuBLAS on NVIDIA GPUs, achieving orders of magnitude faster throughput than nested loops.',
    keyRule: 'Inner dimensions must strictly match: (M x K) @ (K x N) yields (M x N).'
  },
  instructions: `In deep learning, every layer transforms input representations via linear algebraic matrix projections: Y = X @ W + b.

Write a function \`init_tensor_matrices(matrix_a: list, matrix_b: list, zeros_shape: tuple = (2, 2)) -> dict\` that:
1. Converts \`matrix_a\` to a 32-bit floating point PyTorch tensor named \`"tensor_a"\`.
2. Converts \`matrix_b\` to a 32-bit floating point PyTorch tensor named \`"tensor_b"\`.
3. Validates that both tensors are 2-dimensional. If either tensor is not 2-dimensional, raise \`ValueError("Inputs must be 2D matrices")\`.
4. Validates that the inner dimensions match for matrix multiplication (\`tensor_a.shape[1] == tensor_b.shape[0]\`). If not, raise \`ValueError("Incompatible shapes for matmul")\`.
5. Computes the matrix multiplication product between \`tensor_a\` and \`tensor_b\` as \`product\`.
6. Allocates an all-zeros 32-bit floating point tensor named \`"zeros_tensor"\` with the specified \`zeros_shape\`.
7. Returns a dictionary containing:
   \`{"tensor_a": tensor_a, "tensor_b": tensor_b, "product": product, "zeros_tensor": zeros_tensor, "shape_product": tuple(product.shape)}\``,
  hints: [
    'Use torch.tensor(matrix_a, dtype=torch.float32) for float32 initialization.',
    'Check tensor_a.ndim == 2 to verify matrix dimensionality.',
    'Verify that tensor_a.shape[1] == tensor_b.shape[0] before multiplying.',
    'Compute matrix multiplication with torch.matmul(tensor_a, tensor_b) or tensor_a @ tensor_b.'
  ],
  starterCode: `import torch

def init_tensor_matrices(matrix_a: list, matrix_b: list, zeros_shape: tuple = (2, 2)) -> dict:
    """
    Create float32 tensors, validate shapes, and compute matrix multiplication.
    
    Args:
        matrix_a: 2D list of numbers for matrix A
        matrix_b: 2D list of numbers for matrix B
        zeros_shape: Shape tuple for pre-allocated zero tensor
        
    Returns:
        Dictionary with 'tensor_a', 'tensor_b', 'product', 'zeros_tensor', 'shape_product'
    """
    # TODO: Implement tensor initialization, validation, matrix multiplication, and zeros buffer
    pass
`,
  solutionCode: `import torch

def init_tensor_matrices(matrix_a: list, matrix_b: list, zeros_shape: tuple = (2, 2)) -> dict:
    tensor_a = torch.tensor(matrix_a, dtype=torch.float32)
    tensor_b = torch.tensor(matrix_b, dtype=torch.float32)
    
    if tensor_a.ndim != 2 or tensor_b.ndim != 2:
        raise ValueError("Inputs must be 2D matrices")
        
    if tensor_a.shape[1] != tensor_b.shape[0]:
        raise ValueError(f"Incompatible shapes for matmul: {tensor_a.shape} and {tensor_b.shape}")
        
    product = torch.matmul(tensor_a, tensor_b)
    zeros_tensor = torch.zeros(zeros_shape, dtype=torch.float32)
    
    return {
        "tensor_a": tensor_a,
        "tensor_b": tensor_b,
        "product": product,
        "zeros_tensor": zeros_tensor,
        "shape_product": tuple(product.shape),
    }
`,
  testCases: [
    {
      id: 't1',
      name: 'Standard (2x3) @ (3x2) Multiplication',
      inputDescription: 'matrix_a: [[1, 2, 3], [4, 5, 6]], matrix_b: [[7, 8], [9, 1], [2, 3]], zeros_shape: (3, 3)',
      expectedOutput: 'product shape (2, 2) with values [[31, 19], [85, 55]], zeros_tensor shape (3, 3)'
    },
    {
      id: 't2',
      name: 'Dimension Mismatch Error',
      inputDescription: 'matrix_a (2x3) and matrix_b (2x2) with incompatible inner dimensions',
      expectedOutput: 'Raises ValueError("Incompatible shapes for matmul")'
    },
    {
      id: 't3',
      name: 'Non-2D Input Error',
      inputDescription: '1D lists [1.0, 2.0] passed instead of 2D matrices',
      expectedOutput: 'Raises ValueError("Inputs must be 2D matrices")'
    }
  ],
  benchmarkTargetMs: 0.1,
  memoryTargetMb: 0.1,
  conceptPrimer: {
    title: 'PyTorch Tensor Basics & Linear Algebra',
    subtitle: 'From nested Python lists to compiled GEMM matrix operations',
    overview: 'Tensors are the universal currency of deep learning. Unlike NumPy arrays, PyTorch tensors are native first-class citizens on GPU hardware and automatically record operation histories for backpropagation.',
    mentalModel5s: 'A Tensor is a typed, multi-dimensional array capable of GPU execution and automatic differentiation.',
    visualAnalogy: 'NumPy is a skilled artisan working by hand on a desktop workbench (CPU); PyTorch is a robotic assembly line capable of deploying work instantly to thousands of parallel GPU worker arms.',
    pitfalls: [
      'Using Python * when matrix multiplication @ is intended.',
      'Allowing implicit double precision (float64) to double memory usage and halve GPU throughput.'
    ],
    progressiveHints: [
      'Step 1: Wrap inputs with torch.tensor(..., dtype=torch.float32).',
      'Step 2: Check .ndim == 2 for both inputs.',
      'Step 3: Check tensor_a.shape[1] == tensor_b.shape[0].',
      'Step 4: Return torch.matmul(tensor_a, tensor_b) alongside torch.zeros(zeros_shape).'
    ],
    mathFormulas: [
      {
        title: 'Matrix Multiplication Definition',
        latex: 'C_{i,j} = \\sum_{k=1}^K A_{i,k} B_{k,j}',
        explanation: 'Each element of product matrix C is the inner dot product of row i of A and column j of B.'
      }
    ],
    naiveVsIdiomatic: {
      naiveCode: `# Slow Python nested loops
C = [[sum(a * b for a, b in zip(row_a, col_b)) for col_b in zip(*B)] for row_a in A]`,
      naiveExplanation: 'O(M*N*K) slow Python object operations without vectorization or parallel cache locality.',
      idiomaticCode: `# PyTorch GEMM accelerated
C = torch.matmul(tensor_a, tensor_b)`,
      idiomaticExplanation: 'Dispatches directly to compiled SIMD/BLAS routines in microseconds.',
      speedupText: '100x+ faster'
    },
    memoryLayout: {
      title: 'Contiguous Row-Major Memory Storage',
      content: 'Tensors store elements in contiguous 1D memory buffers. Element (i, j) in a shape (M, N) matrix sits at memory offset i * N + j.',
      diagramAscii: `[Row 0: 0, 1, 2] -> [Row 1: 3, 4, 5] in contiguous 32-bit float storage`,
      keyRule: 'Tensors are row-major (C-contiguous) by default in PyTorch.'
    },
    keyTakeaways: [
      'Always default to torch.float32 for neural network operations unless specifically needing float64.',
      'Use torch.matmul or @ for matrix multiplication, not *.',
      'Validate tensor shapes before performing linear transformations.'
    ]
  },
  expectedTensors: [
    { name: 'tensor_a', shape: '(M, K)', dtype: 'float32' },
    { name: 'tensor_b', shape: '(K, N)', dtype: 'float32' },
    { name: 'product', shape: '(M, N)', dtype: 'float32' },
    { name: 'zeros_tensor', shape: '(R, C)', dtype: 'float32' }
  ]
};

export const CHALLENGE_2: Challenge = {
  id: 'torch-p1-c2',
  dayId: 1,
  partId: 1,
  title: 'NumPy to Tensor Bridge & Device Handler',
  slug: 'numpy-to-tensor-bridge-device-handler',
  difficulty: 'Beginner',
  category: 'Tensor Foundations',
  summary: 'Bridge NumPy arrays and PyTorch tensors with zero-copy memory sharing, verify memory synchronization, and manage safe device placement.',
  mentalModel5s: 'torch.from_numpy shares the exact physical memory pointer with NumPy. .clone() severs the link, and .to(device) transfers data to GPU VRAM.',
  visualAnalogy: 'torch.from_numpy is like two window panes looking into the same room; modifying the furniture from either window changes the room. .clone() builds an exact replica in a separate building.',
  pitfalls: [
    'Assuming torch.tensor(np_arr) shares memory (it copies data; use torch.from_numpy for zero-copy sharing).',
    'Failing to verify torch.cuda.is_available() before targeting CUDA devices, causing runtime crashes on CPU-only machines.',
    'Accidentally mutating a NumPy array after bridging when independent data was required.'
  ],
  progressiveHints: [
    'Tier 1: Check isinstance(np_arr, np.ndarray) and raise TypeError if false.',
    'Tier 2: Use torch.from_numpy(np_arr) to create the zero-copy bridged tensor.',
    'Tier 3: Check memory sharing using np.shares_memory(np_arr, tensor.numpy()).',
    'Tier 4: Check target_device against torch.cuda.is_available() to safely fallback to "cpu" before calling .to(device).'
  ],
  deepInternals: {
    title: 'Shared Storage & Unified Memory Buffers',
    content: 'torch.from_numpy wraps the existing C-array data pointer from numpy ndarray in a PyTorch UntypedStorage without allocating new heap memory. Both libraries access the same physical RAM addresses.',
    keyRule: 'Zero-copy sharing only works on CPU memory. Transferring to CUDA always allocates a distinct VRAM buffer.'
  },
  instructions: `Modern ML workflows ingest data via NumPy (e.g. OpenCV, Pandas, SciPy) and feed it into PyTorch for model training and GPU inference. Understanding memory sharing and device management is critical.

Write a function \`bridge_numpy_to_tensor(np_arr: np.ndarray, target_device: str = "cpu") -> dict\` that:
1. Validates that \`np_arr\` is an instance of \`np.ndarray\`. If not, raise \`TypeError("Input must be a numpy.ndarray")\`.
2. Creates a PyTorch tensor named \`"tensor"\` that shares underlying memory with the NumPy array \`np_arr\`.
3. Verifies whether the NumPy array and tensor share the same underlying memory buffer, storing the boolean result in \`"shares_memory"\`.
4. Safely resolves \`target_device\`: if CUDA is requested but unavailable on the host system, fallback to \`"cpu"\`. Construct the corresponding device object.
5. Transfers the tensor to the resolved target device, storing it as \`"device_tensor"\`.
6. Creates an independent clone of the tensor named \`"cloned_tensor"\` that does not share memory with \`np_arr\`.
7. Returns a dictionary containing:
   \`{"tensor": tensor, "device_tensor": device_tensor, "cloned_tensor": cloned_tensor, "shares_memory": shares_memory, "device": str(device_tensor.device)}\``,
  hints: [
    'Check isinstance(np_arr, np.ndarray) to enforce NumPy inputs.',
    'Use torch.from_numpy(np_arr) for zero-copy tensor wrapping.',
    'Use np.shares_memory(np_arr, tensor.numpy()) to confirm shared memory.',
    'Safely check torch.cuda.is_available() before transferring to CUDA.'
  ],
  starterCode: `import numpy as np
import torch

def bridge_numpy_to_tensor(np_arr: np.ndarray, target_device: str = "cpu") -> dict:
    """
    Convert NumPy array to PyTorch tensor with zero-copy memory sharing and device management.
    
    Args:
        np_arr: NumPy ndarray
        target_device: Desired target device string ('cpu', 'cuda', etc.)
        
    Returns:
        Dictionary with 'tensor', 'device_tensor', 'cloned_tensor', 'shares_memory', 'device'
    """
    # TODO: Implement zero-copy conversion, memory sharing check, device placement, and clone
    pass
`,
  solutionCode: `import numpy as np
import torch

def bridge_numpy_to_tensor(np_arr: np.ndarray, target_device: str = "cpu") -> dict:
    if not isinstance(np_arr, np.ndarray):
        raise TypeError("Input must be a numpy.ndarray")
        
    tensor_bridge = torch.from_numpy(np_arr)
    shares_memory = bool(np.shares_memory(np_arr, tensor_bridge.numpy()))
    
    resolved_device = target_device
    if target_device.startswith("cuda") and not torch.cuda.is_available():
        resolved_device = "cpu"
        
    device = torch.device(resolved_device)
    device_tensor = tensor_bridge.to(device)
    cloned_tensor = tensor_bridge.clone()
    
    return {
        "tensor": tensor_bridge,
        "device_tensor": device_tensor,
        "cloned_tensor": cloned_tensor,
        "shares_memory": shares_memory,
        "device": str(device_tensor.device),
    }
`,
  testCases: [
    {
      id: 't1',
      name: 'Zero-Copy Shared Memory Verification',
      inputDescription: 'np_arr = np.array([10.0, 20.0, 30.0], dtype=np.float32), target_device="cpu"',
      expectedOutput: 'shares_memory is True, mutating np_arr updates tensor but not cloned_tensor'
    },
    {
      id: 't2',
      name: 'Safe Hardware Device Fallback',
      inputDescription: 'target_device="cuda" on non-GPU environment',
      expectedOutput: 'Falls back gracefully to "cpu" device without raising exceptions'
    },
    {
      id: 't3',
      name: 'Type Validation Guard',
      inputDescription: 'Passing a Python list [1.0, 2.0] instead of np.ndarray',
      expectedOutput: 'Raises TypeError("Input must be a numpy.ndarray")'
    }
  ],
  benchmarkTargetMs: 0.1,
  memoryTargetMb: 0.1,
  conceptPrimer: {
    title: 'The NumPy-PyTorch Memory Bridge & Accelerator Devices',
    subtitle: 'Zero-copy sharing, data cloning, and hardware device targeting',
    overview: 'PyTorch tensors and NumPy ndarrays can share the same underlying memory buffer on CPU. Moving tensors to GPU hardware requires explicit device transfers with .to(device).',
    mentalModel5s: 'torch.from_numpy points to existing CPU memory. .clone() makes a copy. .to("cuda") transfers to GPU VRAM.',
    visualAnalogy: 'Two people sharing the same physical notebook (zero-copy) vs photocopying the notebook to take home (.clone()) vs emailing it to a remote supercomputer (.to(device)).',
    pitfalls: [
      'Assuming torch.tensor(x) does zero-copy (it copies data; use torch.from_numpy).',
      'Attempting binary operations between tensors on different devices (e.g. CPU + CUDA).'
    ],
    progressiveHints: [
      'Step 1: Validate input with isinstance(np_arr, np.ndarray).',
      'Step 2: Create tensor with torch.from_numpy(np_arr).',
      'Step 3: Verify sharing with np.shares_memory.',
      'Step 4: Handle device fallback with torch.cuda.is_available() and transfer with .to().'
    ],
    mathFormulas: [
      {
        title: 'Memory Pointer Equality in Zero-Copy',
        latex: '\\text{data\\_ptr}(\\text{tensor}) = \\text{data\\_pointer}(\\text{ndarray})',
        explanation: 'Both data structures reference the identical 64-bit virtual memory address.'
      }
    ],
    naiveVsIdiomatic: {
      naiveCode: `# Inefficient copy through Python constructor
tensor = torch.tensor(np_arr)  # Allocates new memory buffer!`,
      naiveExplanation: 'Duplicates memory allocation in RAM, causing memory overhead on large datasets.',
      idiomaticCode: `# Zero-copy instantaneous bridge
tensor = torch.from_numpy(np_arr)`,
      idiomaticExplanation: 'Reuses existing memory buffer in 0 milliseconds.',
      speedupText: 'Instantaneous (0 memory allocation)'
    },
    memoryLayout: {
      title: 'Shared UntypedStorage Buffer',
      content: 'NumPy ndarray data pointer is directly encapsulated by c10::Storage in PyTorch core C++ implementation.',
      diagramAscii: `[NumPy ndarray] ──┐
                   ├──► [Contiguous 1D Physical RAM Buffer]
[torch.Tensor]   ──┘`,
      keyRule: 'Mutating array values in-place reflects across both references.'
    },
    keyTakeaways: [
      'Use torch.from_numpy() for instant zero-copy tensor conversion on CPU.',
      'Always check torch.cuda.is_available() before directing code to CUDA.',
      'Use .clone() when you need a decoupled tensor that will not mutate the parent array.'
    ]
  },
  expectedTensors: [
    { name: 'tensor', shape: '(N,)', dtype: 'float32' },
    { name: 'device_tensor', shape: '(N,)', dtype: 'float32' },
    { name: 'cloned_tensor', shape: '(N,)', dtype: 'float32' }
  ]
};

export const DAY01_TRACK: DayTrack = {
  partNumber: 1,
  partId: 1,
  dayNumber: 1,
  id: 1,
  title: 'Part 1: Tensor Foundations & Math',
  subtitle: 'Understand multi-dimensional tensors, dtypes, device placement, and the NumPy bridge',
  description: 'Master PyTorch tensor foundations: create multi-dimensional tensors, control floating-point precision, perform accelerated matrix multiplication, bridge NumPy with zero-copy memory sharing, and handle device placement safely.',
  iconName: 'Cpu',
  badge: 'Part 1 • Tensor Foundations',
  libraryMechanics: {
    libraryName: 'PyTorch Core Tensors',
    tagline: 'High-performance n-dimensional numerical arrays with GPU acceleration and Autograd.',
    overview: `### 🌟 Welcome to PyTorch: The Modern Engine of AI
PyTorch is the premier open-source deep learning framework created by Meta AI and the open-source community. At its core lies the **Tensor**: a multi-dimensional array designed specifically for fast mathematical computations and automatic differentiation.

While PyTorch feels intuitive like NumPy, it provides two transformative capabilities:
1. **GPU Acceleration:** Execute matrix math tens to hundreds of times faster on modern accelerators (NVIDIA CUDA, Apple MPS, AMD ROCm).
2. **Dynamic Autograd Tape:** Automatically track mathematical operations to compute gradients via reverse-mode automatic differentiation.`,
    whyItExists: `NumPy revolutionised scientific computing in Python, but it cannot run on GPUs and does not compute gradients.

PyTorch bridges this gap with an intuitive Pythonic API:
- Seamless zero-copy interoperability with NumPy via \`torch.from_numpy\`.
- Hardware-agnostic device management via \`.to(device)\`.
- Compiled BLAS/LAPACK matrix routines that maximize memory bandwidth and FLOPS.`,
    coreAnatomy: {
      objectName: 'torch.Tensor',
      description: 'A contiguous multidimensional buffer of numbers characterized by storage, shape, stride, dtype, and device.',
      fields: [
        {
          name: 'dtype',
          type: 'torch.dtype descriptor',
          role: 'Numerical precision (e.g. torch.float32 for weights, torch.int64 for classification labels).'
        },
        {
          name: 'shape',
          type: 'torch.Size',
          role: 'Tuple of dimension sizes (e.g. torch.Size([32, 128]) for batch size 32, feature dimension 128).'
        },
        {
          name: 'device',
          type: 'torch.device',
          role: 'Hardware device where tensor memory resides (e.g. cpu, cuda:0, mps).'
        },
        {
          name: 'requires_grad',
          type: 'bool',
          role: 'Tracks whether the autograd engine records operations on this tensor for gradient computation.'
        }
      ],
      memoryDiagramAscii: `+-------------------------------------------------------------+
|               PyTorch Tensor Layout & Storage               |
|  [ torch.Tensor Metadata: shape=(2,3), strides=(3,1) ]      |
|                                |                            |
|                                v                            |
|  [ UntypedStorage: 6 x 4-byte Float32 in contiguous RAM/VRAM]|
|  | 1.0 | 2.0 | 3.0 | 4.0 | 5.0 | 6.0 |                      |
+-------------------------------------------------------------+`
    },
    chapters: [
      {
        id: 'ch1-tensors-vs-ndarrays',
        title: 'PyTorch Tensors vs NumPy ndarrays',
        icon: 'Layers',
        summary: 'Understand how PyTorch tensors mirror NumPy syntax while unlocking GPU acceleration.',
        markdownContent: `### PyTorch Tensors vs NumPy Arrays

If you know NumPy, you already know 90% of PyTorch!

| Task | NumPy | PyTorch |
| :--- | :--- | :--- |
| Create from list | \`np.array([1, 2])\` | \`torch.tensor([1, 2])\` |
| All zeros | \`np.zeros((3, 3))\` | \`torch.zeros((3, 3))\` |
| Matrix multiply | \`A @ B\` or \`np.matmul(A, B)\` | \`A @ B\` or \`torch.matmul(A, B)\` |
| Check shape | \`arr.shape\` | \`tensor.shape\` |
| Hardware | CPU only | CPU, CUDA, MPS, TPU |

\`\`\`python
import torch

# Create a float32 tensor
x = torch.tensor([[1.0, 2.0], [3.0, 4.0]], dtype=torch.float32)
print("Shape:", x.shape)
print("Device:", x.device)
\`\`\``,
        codeSnippets: [
          {
            id: 'snip-tensor-creation',
            title: 'Creating and multiplying tensors',
            code: `import torch

A = torch.tensor([[1.0, 2.0], [3.0, 4.0]], dtype=torch.float32)
B = torch.tensor([[5.0, 6.0], [7.0, 8.0]], dtype=torch.float32)

product = torch.matmul(A, B)
print("Product:\\n", product)`,
            expectedOutput: `Product:
 tensor([[19., 22.],
        [43., 50.]])`,
            explanation: 'torch.matmul computes the matrix product of 2D tensors.'
          }
        ]
      },
      {
        id: 'ch2-device-placement',
        title: 'Device Semantics: CPU and CUDA',
        icon: 'Cpu',
        summary: 'Managing tensor allocation between CPU system RAM and GPU video RAM (VRAM).',
        markdownContent: `### Device Management

Tensors can reside on different hardware devices. Before transferring, always check if CUDA is available:

\`\`\`python
import torch

# Dynamic device selection
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

x = torch.ones((3, 3), dtype=torch.float32)
x_dev = x.to(device)
print("Tensor is on:", x_dev.device)
\`\`\`

> **Crucial Rule:** All operands in a tensor operation must reside on the **same device**. Mixing CPU and CUDA tensors will raise an error!`,
        codeSnippets: [
          {
            id: 'snip-device-check',
            title: 'Checking hardware devices',
            code: `import torch

print("CUDA available?", torch.cuda.is_available())
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
t = torch.zeros((2, 2)).to(device)
print("Tensor device:", t.device)`,
            expectedOutput: `CUDA available? False
Tensor device: cpu`,
            explanation: 'Gracefully fallbacks to CPU when no NVIDIA GPU is detected.'
          }
        ]
      }
    ],
    commonTraps: [
      {
        title: 'Confusing Element-wise Multiplication with Matrix Multiplication',
        badSnippet: `# Intended matrix multiplication:
C = A * B  # Computes element-wise Hadamard product!`,
        badExplanation: 'Using * multiplies matching elements position-by-position, not matrix dot products.',
        goodSnippet: `# Use @ or torch.matmul
C = torch.matmul(A, B)
# or: C = A @ B`,
        goodExplanation: 'torch.matmul performs proper linear algebraic matrix multiplication.',
        perfImpact: 'Prevents silent dimensional bugs and mathematically incorrect transformations.'
      },
      {
        title: 'Mixing Devices in Tensor Operations',
        badSnippet: `a = torch.tensor([1.0]).to('cpu')
b = torch.tensor([2.0]).to('cuda')
c = a + b  # Crashes with RuntimeError!`,
        badExplanation: 'PyTorch cannot perform cross-device arithmetic without explicit data transfer.',
        goodSnippet: `b_cpu = b.to('cpu')
c = a + b_cpu`,
        goodExplanation: 'Ensure all inputs are transferred to the same device prior to execution.',
        perfImpact: 'Eliminates fatal device mismatch runtime errors.'
      }
    ],
    apiCheatSheet: [
      {
        name: 'torch.tensor',
        category: 'Creation',
        signature: 'torch.tensor(data, dtype=None, device=None, requires_grad=False)',
        summary: 'Construct a tensor from Python lists, tuples, or NumPy arrays.',
        parameters: [
          { name: 'data', type: 'array_like', desc: 'Initial data for the tensor.' },
          { name: 'dtype', type: 'torch.dtype', desc: 'Desired data type (e.g. torch.float32).' }
        ],
        returns: 'torch.Tensor containing the data.',
        exampleSnippet: 'x = torch.tensor([[1.0, 2.0], [3.0, 4.0]], dtype=torch.float32)'
      },
      {
        name: 'torch.matmul',
        category: 'Math',
        signature: 'torch.matmul(input, other)',
        summary: 'Matrix product of two tensors (or @ operator).',
        parameters: [
          { name: 'input', type: 'Tensor', desc: 'First tensor.' },
          { name: 'other', type: 'Tensor', desc: 'Second tensor.' }
        ],
        returns: 'torch.Tensor result of matrix multiplication.',
        exampleSnippet: 'C = torch.matmul(A, B)'
      },
      {
        name: 'torch.from_numpy',
        category: 'Conversion',
        signature: 'torch.from_numpy(ndarray)',
        summary: 'Creates a Tensor from a numpy.ndarray sharing the underlying memory buffer.',
        parameters: [
          { name: 'ndarray', type: 'numpy.ndarray', desc: 'The input NumPy array.' }
        ],
        returns: 'torch.Tensor sharing memory with the array.',
        exampleSnippet: 't = torch.from_numpy(np_array)'
      },
      {
        name: 'tensor.to',
        category: 'Device',
        signature: 'tensor.to(device, dtype=None)',
        summary: 'Performs Tensor dtype and/or device conversion.',
        parameters: [
          { name: 'device', type: 'torch.device | str', desc: 'Destination device (e.g. cpu, cuda).' }
        ],
        returns: 'Tensor transferred to destination device.',
        exampleSnippet: 'x_gpu = x.to("cuda")'
      }
    ],
    interactiveWidgetType: 'numpy-strides'
  },
  challenges: [CHALLENGE_1, CHALLENGE_2]
};

export const PYTORCH_PART01_TRACK = DAY01_TRACK;
export const testCases = [...CHALLENGE_1.testCases, ...CHALLENGE_2.testCases];
export type { DayTrack, Challenge, ConceptPrimerData, TestCase };
export default DAY01_TRACK;
