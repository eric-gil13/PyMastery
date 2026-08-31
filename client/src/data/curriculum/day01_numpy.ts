import type { DayTrack } from '../../types';

export const DAY01_TRACK: DayTrack = {
  partNumber: 1,
  partId: 1,
  dayNumber: 1,
  id: 1,
  title: 'Part 1: NumPy Internals & High-Performance Vectorization',
  subtitle: 'Master ndarray memory layouts, pointer strides, SIMD broadcasting, and zero-copy views',
  description: 'Dive deep into C-order vs Fortran-order memory buffers, linear stride pointer arithmetic, CPU L1/L2 cache lines, SIMD AVX registers, and zero-copy slicing tricks to eliminate Python interpreter loops.',
  iconName: 'Cpu',
  badge: 'Part 1 • NumPy',
  libraryMechanics: {
    libraryName: 'NumPy Internals & Memory Vectorization',
    tagline: 'Master ndarray memory buffers, strides, SIMD broadcasting, and zero-copy views for peak computational throughput.',
    overview: `### 🧠 The Hidden Bottleneck of Standard Python Lists
In standard Python, lists do not store raw numbers directly in contiguous RAM. Instead, a Python list is **an array of 64-bit pointers** pointing to fragmented objects scattered across the heap:

1. **Massive Memory Bloat:** While a raw 64-bit float is 8 bytes, a standard Python \`float\` object requires **24 to 28 bytes** due to object metadata (reference counting, type pointers, and value boxing).
2. **The Pointer-Chasing Penalty:** To loop through \`[1.0, 2.0, 3.0]\`, the CPU must dereference individual heap pointers. This fragments memory access and stalls the CPU with constant **L1/L2/L3 cache misses**.
3. **Dynamic Type Checking Overhead:** On every step of a Python loop \`a + b\`, the interpreter must check object types, look up method tables, and handle dynamic dispatch bytecode opcodes.

### ⚡ The NumPy Breakthrough: Flat Contiguous C Buffers
NumPy's \`ndarray\` solves this by allocating **one contiguous block of raw memory** in RAM (exactly 8 bytes per \`float64\`):

- **Zero Pointer Chasing:** All numbers sit sequentially in adjacent byte addresses.
- **Hardware SIMD Vectorization:** AVX-256 and AVX-512 CPU registers process 4 to 8 numbers simultaneously in a single clock cycle.
- **Direct Hardware BLAS:** Array crunching runs directly in pre-compiled C/Fortran kernels, releasing the Global Interpreter Lock (GIL) for multi-core scalability.`,
    whyItExists: `NumPy is the universal mathematical foundation of the entire scientific Python ecosystem (Pandas, PyTorch, SciPy, Scikit-Learn).

At the hardware level, NumPy provides three core pillars:
- **64-Byte Cache Line Locality:** Modern CPUs load RAM in 64-byte chunks. A contiguous \`float64\` array packs **8 floats per cache line**, achieving near 100% cache hit rates.
- **BLAS/LAPACK Matrix Kernels:** Operations like \`@\` and \`np.dot\` dispatch directly to assembly-optimized BLAS libraries (OpenBLAS, Intel MKL) utilizing cache-blocked tile matrix multiplication.
- **Zero-Copy View Architecture:** Reshaping, slicing, transposing (\`arr.T\`), and broadcasting only manipulate lightweight metadata (shape and strides) without re-allocating or copying data buffers in RAM.`,
    coreAnatomy: {
      objectName: 'ndarray',
      description: 'A NumPy ndarray is a Python wrapper around a PyArrayObject C-struct that manages a raw, contiguous or strided memory buffer in RAM described by shape, dtype, strides, and memory flags.',
      fields: [
        {
          name: 'data',
          type: 'char* (void pointer)',
          role: 'Points to the starting raw linear byte address of the memory buffer in physical RAM.'
        },
        {
          name: 'shape',
          type: 'tuple[int, ...]',
          role: 'Defines the number of elements along each dimension/axis (e.g. (3, 4) for 3 rows and 4 columns).'
        },
        {
          name: 'dtype',
          type: 'np.dtype descriptor',
          role: 'Defines the element data type (e.g. float64, int32), byte size (itemsize), alignment, and endianness.'
        },
        {
          name: 'strides',
          type: 'tuple[int, ...]',
          role: 'Number of bytes to jump in memory along each axis to advance to the next element.'
        },
        {
          name: 'flags',
          type: 'FlagsObj',
          role: 'Memory layout flags: C_CONTIGUOUS, F_CONTIGUOUS, OWNDATA, WRITEABLE, and ALIGNED.'
        }
      ],
      memoryDiagramAscii: `+-------------------------------------------------------------------------------+
|                             PyArrayObject Structure                           |
+-------------------------------------------------------------------------------+
|  *data      --> Points to 0x7FFF0010 (Raw Memory Buffer in RAM)               |
|  shape     --> (3, 4)                                                         |
|  strides   --> (32, 8)     [Step 32 bytes for next row, 8 bytes for next col] |
|  dtype     --> float64 (8 bytes per item, little-endian)                      |
|  flags     --> C_CONTIGUOUS=True, F_CONTIGUOUS=False, OWNDATA=True            |
+-------------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------------+
|                     Contiguous Linear Byte Buffer in RAM                      |
+-------+-------+-------+-------+-------+-------+-------+-------+-------+-------+
| (0,0) | (0,1) | (0,2) | (0,3) | (1,0) | (1,1) | (1,2) | (1,3) | (2,0) | (2,1) |
|  0.0  |  1.0  |  2.0  |  3.0  |  4.0  |  5.0  |  6.0  |  7.0  |  8.0  |  9.0  |
|  8 B  |  8 B  |  8 B  |  8 B  |  8 B  |  8 B  |  8 B  |  8 B  |  8 B  |  8 B  |
+-------+-------+-------+-------+-------+-------+-------+-------+-------+-------+
|<--- Row 0 (32 Bytes) -------->|<--- Row 1 (32 Bytes) -------->|`
    },
    chapters: [
      {
        id: 'ch1-memory-layout',
        title: 'Physical Memory Layout & CPU Cache Lines',
        icon: 'HardDrive',
        summary: 'Understand row-major (C-order) vs column-major (Fortran-order), 64-byte cache lines, spatial locality, and stride-1 loop ordering.',
        markdownContent: `### Contiguous Memory Buffers & RAM Layout

Computer memory (RAM) is a flat, 1-dimensional sequence of byte addresses. Multi-dimensional matrices must be mapped onto this 1D address space using an ordering convention:

1. **C-Order (Row-Major)**: Elements of each row are stored contiguously in memory. Moving along the last axis (columns) advances adjacent memory addresses (+8 bytes for \`float64\`).
2. **Fortran-Order (Column-Major)**: Elements of each column are stored contiguously. Moving along the first axis (rows) advances adjacent memory addresses.

### CPU Caches & The 64-Byte Cache Line

Modern CPUs do not fetch individual floats from RAM. When the CPU reads a memory address:
- It fetches an entire **64-byte cache line** into the L1 data cache.
- For an array of \`float64\` (8 bytes each), one cache line contains **8 consecutive floats**.

When traversing an array along its **stride-1 contiguous axis**:
- Reading element 0 triggers a cache miss and loads 8 numbers.
- Reading elements 1 through 7 are **instant L1 cache hits** (0.5 ns latency).
- Hardware prefetchers detect the sequential stride and stream subsequent cache lines from RAM ahead of time.

If you traverse along a non-contiguous axis (e.g. stepping across columns in row-major order with stride $N \\times 8$ bytes), every single access jumps to a different memory page, causing cache thrashing and reducing compute throughput by **10x to 50x**.`,
        codeSnippets: [
          {
            id: 'snip-cache-lines',
            title: 'Measuring Cache Miss Penalty: Row-Major vs Column-Major Traversal',
            code: `import numpy as np
import time

# Allocate a 4096 x 4096 float64 array (128 MB)
N = 4096
A = np.ones((N, N), dtype=np.float64, order='C')

# 1. Stride-1 Row traversal (Sequential C-order, high L1 cache hit rate)
t0 = time.perf_counter()
row_sum = np.sum(A, axis=1)
t_row = (time.perf_counter() - t0) * 1000

# 2. Stride-N Column traversal (Strided non-sequential, L1 cache misses)
t0 = time.perf_counter()
col_sum = np.sum(A, axis=0)
t_col = (time.perf_counter() - t0) * 1000

print(f"Array Shape: {A.shape}, Strides: {A.strides}")
print(f"Axis 1 (Stride-1 Sequential): {t_row:.2f} ms")
print(f"Axis 0 (Stride-{N} Non-sequential): {t_col:.2f} ms")
print(f"Speedup from CPU Cache Locality: {t_col / t_row:.1f}x")`,
            expectedOutput: `Array Shape: (4096, 4096), Strides: (32768, 8)
Axis 1 (Stride-1 Sequential): ~4.2 ms
Axis 0 (Stride-4096 Non-sequential): ~48.5 ms
Speedup from CPU Cache Locality: ~11.5x`,
            explanation: 'Axis 1 sum accesses sequential elements spaced by 8 bytes (stride 1), achieving an 87.5% L1 cache line hit rate. Axis 0 sum jumps 32,768 bytes per step, missing cache lines and stalling the CPU.'
          }
        ]
      },
      {
        id: 'ch2-strides-pointer-arithmetic',
        title: 'Strides & Pointer Arithmetic',
        icon: 'Cpu',
        summary: 'How multidimensional indexing resolves into linear byte addresses via $P_{\\text{base}} + \\sum i_k s_k$, enabling zero-copy transpositions and sliding windows.',
        markdownContent: `### The Fundamental Linear Byte Address Formula

To access an element at multi-dimensional index $(i_0, i_1, \\dots, i_{d-1})$, NumPy computes the exact raw physical RAM address via:

$$\\text{Address}(i_0, i_1, \\dots, i_{d-1}) = P_{\\text{base}} + \\sum_{k=0}^{d-1} i_k \\cdot s_k$$

where:
- $P_{\\text{base}}$ is the starting pointer address (\`arr.ctypes.data\`).
- $s_k$ is the stride (in bytes) along dimension $k$ (\`arr.strides[k]\`).

### Zero-Copy Transposition (\`arr.T\`)

Transposing a 2D matrix of shape $(H, W)$ with strides $(s_0, s_1)$ does **not** reorder bytes in memory. NumPy simply creates a new \`ndarray\` wrapper that swaps metadata:
- **New Shape**: $(W, H)$
- **New Strides**: $(s_1, s_0)$
- **Execution Time**: $O(1)$ constant time (nanoseconds), 0 bytes allocated!

### Sliding Windows with \`as_strided\`

The stride trick allows creating overlapping sliding window views over arrays without duplicating data. By mapping repeating strides into higher dimensions:
$$\\text{Shape: } (H - k_h + 1, W - k_w + 1, k_h, k_w), \\quad \\text{Strides: } (s_0, s_1, s_0, s_1)$$
NumPy can represent every overlapping 2D image patch or 1D time-series window in $O(1)$ time.`,
        codeSnippets: [
          {
            id: 'snip-strides-ptr',
            title: 'Pointer Arithmetic & Zero-Copy Transpose with Strides',
            code: `import numpy as np
from numpy.lib.stride_tricks import as_strided

# 3x4 float64 array (8 bytes per element)
x = np.arange(12, dtype=np.float64).reshape(3, 4)

print("Original Array:")
print(x)
print(f"Shape: {x.shape}, Strides: {x.strides}, C_CONTIGUOUS: {x.flags.c_contiguous}")

# Transpose swaps shape and strides without copying memory
x_t = x.T
print("\nTransposed Array (arr.T):")
print(f"Shape: {x_t.shape}, Strides: {x_t.strides}, Shares Memory: {np.shares_memory(x, x_t)}")

# 1D Sliding Window via as_strided: window size = 3
vec = np.arange(6)
win = as_strided(vec, shape=(4, 3), strides=(vec.strides[0], vec.strides[0]), writeable=False)
print("\nStrided Rolling Window (4x3):")
print(win)
print(f"Shares base with vec: {win.base is vec}")`,
            expectedOutput: `Original Array:
[[ 0.  1.  2.  3.]
 [ 4.  5.  6.  7.]
 [ 8.  9. 10. 11.]]
Shape: (3, 4), Strides: (32, 8), C_CONTIGUOUS: True

Transposed Array (arr.T):
Shape: (4, 3), Strides: (8, 32), Shares Memory: True

Strided Rolling Window (4x3):
[[0 1 2]
 [1 2 3]
 [2 3 4]
 [3 4 5]]
Shares base with vec: True`,
            explanation: 'Transposing simply swaps the strides tuple from (32, 8) to (8, 32). as_strided repeats stride steps to generate virtual higher-dimensional tensors without allocating extra RAM.'
          }
        ]
      },
      {
        id: 'ch3-simd-broadcasting',
        title: 'SIMD Broadcasting Rules & Zero-Stride Arithmetic',
        icon: 'Maximize',
        summary: 'How NumPy operates on arrays of differing shapes by setting stride=0 along singleton dimensions without duplicating memory.',
        markdownContent: `### The Two Broadcasting Rules

When operating on two arrays $A$ and $B$, NumPy compares their shapes element-wise starting from the **trailing (rightmost)** dimensions and working backwards:

1. Two dimensions are compatible if they are **equal**, or if **one of them is 1**.
2. If an array has fewer dimensions, its shape is prepended with 1s on the left until shapes match in dimensionality.

### The Zero-Stride Secret

When an array with shape $(N, 1)$ is broadcasted against $(1, M)$ to produce shape $(N, M)$, NumPy does **not** duplicate data $M$ times in RAM.

Instead, it creates an internal view where the stride for the broadcasted axis is set to **0 bytes**:
- **Array A** $(N, 1) \\to$ Strides $(8, 0)$
- **Array B** $(1, M) \\to$ Strides $(0, 8)$

During compiled C execution loops, stepping along an axis with stride 0 re-reads the exact same CPU register or L1 cache line repeatedly. This eliminates memory bandwidth overhead and lets SIMD vector registers compute outer operations at peak hardware speed.`,
        codeSnippets: [
          {
            id: 'snip-broadcasting',
            title: 'SIMD Broadcasting & 0-Stride Virtual Expansion',
            code: `import numpy as np

# Column vector (3, 1) and Row vector (4,)
a = np.array([[10], [20], [30]])  # Shape (3, 1)
b = np.array([1, 2, 3, 4])        # Shape (4,)

print(f"a shape: {a.shape}, strides: {a.strides}")
print(f"b shape: {b.shape}, strides: {b.strides}")

# Broadcast 'a' to shape (3, 4) without copying data
a_broadcast = np.broadcast_to(a, (3, 4))
print(f"\na_broadcast shape: {a_broadcast.shape}, strides: {a_broadcast.strides}")
print("Notice stride along axis 1 is 0 bytes! Reading column elements reuses the exact same memory address.")

# Vectorized Outer Addition: (3, 1) + (1, 4) -> (3, 4)
grid = a + b
print("\nBroadcasting Addition Result (3x4):")
print(grid)`,
            expectedOutput: `a shape: (3, 1), strides: (8, 8)
b shape: (4,), strides: (8,)

a_broadcast shape: (3, 4), strides: (8, 0)
Notice stride along axis 1 is 0 bytes! Reading column elements reuses the exact same memory address.

Broadcasting Addition Result (3x4):
[[11 12 13 14]
 [21 22 23 24]
 [31 32 33 34]]`,
            explanation: 'NumPy sets stride=0 along broadcasted axes, allowing CPU vector registers to reuse values directly from cache without copying memory buffers.'
          }
        ]
      },
      {
        id: 'ch4-views-vs-copies',
        title: 'Zero-Copy Views vs Memory Copies',
        icon: 'Copy',
        summary: 'Distinguish basic slicing (views) from fancy indexing and boolean masking (copies), avoiding accidental memory bloat and unintended mutations.',
        markdownContent: `### Basic Slicing vs Advanced (Fancy) Indexing

Understanding when NumPy returns a **view** versus a **copy** is critical for both performance and avoiding mutation bugs:

| Operation Type | Example | Result | Memory Allocated | \`out.base\` |
| :--- | :--- | :--- | :--- | :--- |
| **Basic Slicing** | \`arr[2:8:2]\`, \`arr[:, 0]\` | **View** | 0 bytes (instant) | Points to parent \`arr\` |
| **Transposition** | \`arr.T\`, \`arr.swapaxes(0,1)\` | **View** | 0 bytes (instant) | Points to parent \`arr\` |
| **Reshaping** | \`arr.reshape(3, 4)\` | **View** (if contiguous) | 0 bytes | Points to parent \`arr\` |
| **Integer Indexing**| \`arr[[0, 2, 4]]\` | **Copy** | New heap allocation | \`None\` |
| **Boolean Masking** | \`arr[arr > 5]\` | **Copy** | New heap allocation | \`None\` |

### BLAS Contiguity Requirements

Dense linear algebra operations like matrix multiplication (\`A @ B\`, \`np.dot\`) require data to be contiguous in memory. If you pass a strided non-contiguous slice (e.g. \`A[::2, ::2]\`), NumPy is forced to allocate a temporary contiguous copy behind the scenes before dispatching to BLAS GEMM.

Use \`np.ascontiguousarray()\` explicitly when preparing strided slices for repeated linear algebra computations.`,
        codeSnippets: [
          {
            id: 'snip-views-copies',
            title: 'Zero-Copy Views vs Memory Copies & Base Pointer Inspection',
            code: `import numpy as np

arr = np.arange(10)

# 1. Basic Slicing -> View (Shares Buffer)
slice_view = arr[2:7]
print(f"Slice view.base is arr: {slice_view.base is arr}")

# Mutating view affects original array!
slice_view[0] = 999
print(f"Original arr after view mutation: {arr}")

# 2. Fancy (Integer) Indexing -> Memory Copy (Allocates new buffer)
fancy_copy = arr[[0, 2, 4]]
print(f"\nFancy indexing fancy_copy.base is None: {fancy_copy.base is None}")
fancy_copy[0] = -111
print(f"Original arr after fancy copy mutation (unchanged): {arr}")

# 3. Restoring Contiguity for BLAS
non_contig = arr[::2]
print(f"\nSubsampled slice C_CONTIGUOUS: {non_contig.flags.c_contiguous}")
contig = np.ascontiguousarray(non_contig)
print(f"ascontiguousarray C_CONTIGUOUS: {contig.flags.c_contiguous}")`,
            expectedOutput: `Slice view.base is arr: True
Original arr after view mutation: [  0   1 999   3   4   5   6   7   8   9]

Fancy indexing fancy_copy.base is None: True
Original arr after fancy copy mutation (unchanged): [  0   1 999   3   4   5   6   7   8   9]

Subsampled slice C_CONTIGUOUS: False
ascontiguousarray C_CONTIGUOUS: True`,
            explanation: 'Basic slicing creates zero-copy views sharing the underlying buffer (.base is arr). Fancy indexing allocates fresh copies. np.ascontiguousarray creates a contiguous memory layout.'
          }
        ]
      }
    ],
    commonTraps: [
      {
        title: 'Dynamic Array Resizing with np.append in Loops',
        badSnippet: `# Disastrous O(N^2) memory reallocation loop
result = np.array([])
for x in data_stream:
    # Allocates a new array & copies all existing items every step!
    result = np.append(result, process(x))`,
        badExplanation: 'np.append does not mutate in-place; it allocates a brand new memory buffer and copies every element on each iteration, causing O(N^2) runtime and massive RAM churn.',
        goodSnippet: `# Pre-allocated contiguous buffer in O(N) time
result = np.empty(len(data_stream), dtype=np.float64)
for i, x in enumerate(data_stream):
    result[i] = process(x)
# Or accumulate in Python list and convert once:
# result = np.asarray([process(x) for x in data_stream], dtype=np.float64)`,
        goodExplanation: 'Pre-allocating the full buffer with np.empty/np.zeros creates a single memory block, avoiding repeated memory reallocations and copies.',
        perfImpact: 'Up to 5,000x faster for N=100,000; eliminates quadratic allocation churn.'
      },
      {
        title: 'Passing Non-Contiguous Slices into BLAS/LAPACK Operations',
        badSnippet: `# Non-contiguous strided matrix into GEMM
A_sub = large_matrix[::2, ::2]  # Non-contiguous strided view
for _ in range(100):
    # Silently allocates and copies temporary contiguous buffers 100 times!
    res = A_sub @ B`,
        badExplanation: 'BLAS GEMM kernels require stride-1 contiguous row or column vectors. Passing a non-contiguous slice forces NumPy to silently allocate a contiguous temporary buffer on every multiplication.',
        goodSnippet: `# Explicit contiguity before compute-heavy BLAS
A_sub = np.ascontiguousarray(large_matrix[::2, ::2])
for _ in range(100):
    res = A_sub @ B  # Direct zero-overhead GEMM dispatch`,
        goodExplanation: 'Calling np.ascontiguousarray once upfront creates a contiguous buffer, avoiding repeated implicit allocations in tight loops.',
        perfImpact: '2x-4x speedup in repeated matrix algebra by eliminating hidden copies.'
      },
      {
        title: 'Silent Float32 to Float64 Upcasting in Mixed Operations',
        badSnippet: `# float32 array silently upcast to float64
weights = np.ones((4096, 4096), dtype=np.float32)
bias = 0.5  # Python float literal is 64-bit IEEE 754 double
output = weights * bias + 1.0  # Silently produces float64 (128 MB instead of 64 MB)`,
        badExplanation: 'Operating on a float32 array with Python float literals silently upcasts the result to float64, doubling RAM usage and halving SIMD vectorization lane throughput.',
        goodSnippet: `# Enforce single-precision typing
weights = np.ones((4096, 4096), dtype=np.float32)
bias = np.float32(0.5)
output = weights * bias + np.float32(1.0)
# Or in-place: weights *= 0.5`,
        goodExplanation: 'Ensure scalar constants use np.float32 or specify output dtype to preserve 32-bit single-precision layout and maximize AVX SIMD lane capacity.',
        perfImpact: '2x memory reduction and 2x higher arithmetic throughput on SIMD execution units.'
      }
    ],
    apiCheatSheet: [
      {
        name: 'np.zeros',
        category: 'Creation',
        signature: "np.zeros(shape, dtype=float, order='C')",
        summary: 'Allocate a new ndarray of given shape and dtype initialized with all zeros.',
        parameters: [
          { name: 'shape', type: 'int | tuple[int, ...]', desc: 'Shape of the new array (e.g. (3, 4) or 10).' },
          { name: 'dtype', type: 'data-type, optional', desc: 'Desired data type, default is np.float64.' },
          { name: 'order', type: "'C' | 'F', optional", desc: 'Row-major (C-order) or column-major (Fortran-order).' }
        ],
        returns: 'np.ndarray of zeros with given shape, dtype, and memory order.',
        exampleSnippet: `# 3x3 float32 contiguous zero matrix
mat = np.zeros((3, 3), dtype=np.float32, order='C')`
      },
      {
        name: 'np.arange',
        category: 'Creation',
        signature: 'np.arange([start,] stop[, step,], dtype=None)',
        summary: 'Return evenly spaced values within a given half-open interval [start, stop).',
        parameters: [
          { name: 'start', type: 'number, optional', desc: 'Start of interval. Default is 0.' },
          { name: 'stop', type: 'number', desc: 'End of interval (exclusive).' },
          { name: 'step', type: 'number, optional', desc: 'Spacing between consecutive values. Default is 1.' },
          { name: 'dtype', type: 'dtype, optional', desc: 'Data type of output array.' }
        ],
        returns: '1D np.ndarray of evenly spaced values.',
        exampleSnippet: `# Array of integers from 0 to 9
arr = np.arange(0, 10, 1, dtype=np.int64)`
      },
      {
        name: 'np.linspace',
        category: 'Creation',
        signature: 'np.linspace(start, stop, num=50, endpoint=True, dtype=None)',
        summary: 'Return evenly spaced numbers over a specified closed interval [start, stop].',
        parameters: [
          { name: 'start', type: 'scalar', desc: 'Starting value of the sequence.' },
          { name: 'stop', type: 'scalar', desc: 'Ending value of the sequence.' },
          { name: 'num', type: 'int, optional', desc: 'Number of samples to generate. Default is 50.' },
          { name: 'endpoint', type: 'bool, optional', desc: 'If True, stop is the last sample. Default True.' }
        ],
        returns: 'np.ndarray of num equally spaced samples.',
        exampleSnippet: `# 100 points evenly spaced between 0.0 and 1.0
samples = np.linspace(0.0, 1.0, num=100, dtype=np.float64)`
      },
      {
        name: 'np.reshape',
        category: 'Reshaping',
        signature: "np.reshape(a, newshape, order='C')",
        summary: 'Gives a new shape to an array without changing its data (returns a view if possible).',
        parameters: [
          { name: 'a', type: 'array_like', desc: 'Array to be reshaped.' },
          { name: 'newshape', type: 'int | tuple[int, ...]', desc: 'The new shape. One dimension can be -1 (inferred).' },
          { name: 'order', type: "'C' | 'F' | 'A'", desc: 'Read elements using C/Fortran index order.' }
        ],
        returns: 'Reshaped array (view when buffer is contiguous, copy otherwise).',
        exampleSnippet: `# Reshape 1D vector of 12 elements to 3x4 matrix
mat = np.arange(12).reshape((3, 4))`
      },
      {
        name: 'arr.T',
        category: 'Reshaping',
        signature: 'arr.T',
        summary: 'View of the array with axes reversed (transposed) in zero memory allocation time.',
        parameters: [],
        returns: 'Zero-copy transposed view with reversed shape and strides.',
        exampleSnippet: `# Zero-copy transpose: swaps shape and strides metadata
A = np.zeros((100, 50))
A_T = A.T  # Shape: (50, 100), 0 bytes allocated`
      },
      {
        name: 'np.expand_dims',
        category: 'Reshaping',
        signature: 'np.expand_dims(a, axis)',
        summary: 'Expand the shape of an array by inserting a new singleton dimension of size 1 at axis.',
        parameters: [
          { name: 'a', type: 'array_like', desc: 'Input array.' },
          { name: 'axis', type: 'int | tuple[int, ...]', desc: 'Position in the expanded axes where the new axis is placed.' }
        ],
        returns: 'View of a with the number of dimensions increased.',
        exampleSnippet: `# Expand (N,) to (N, 1) for column-wise broadcasting
vec = np.arange(5)
col_vec = np.expand_dims(vec, axis=1)  # Shape (5, 1)`
      },
      {
        name: 'np.ascontiguousarray',
        category: 'Slicing',
        signature: 'np.ascontiguousarray(a, dtype=None)',
        summary: 'Return a contiguous array (C-order) in memory. Copies data if non-contiguous.',
        parameters: [
          { name: 'a', type: 'array_like', desc: 'Input array.' },
          { name: 'dtype', type: 'data-type, optional', desc: 'Data-type of returned array.' }
        ],
        returns: 'Contiguous array with stride-1 along the last axis.',
        exampleSnippet: `# Convert non-contiguous strided slice to C-contiguous buffer
strided = np.arange(20)[::2]
contiguous_arr = np.ascontiguousarray(strided)`
      },
      {
        name: 'np.dot',
        category: 'Algebra',
        signature: 'np.dot(a, b, out=None)',
        summary: 'Dot product of two arrays. For 2D arrays it computes matrix multiplication via BLAS.',
        parameters: [
          { name: 'a', type: 'array_like', desc: 'First input matrix or vector.' },
          { name: 'b', type: 'array_like', desc: 'Second input matrix or vector.' },
          { name: 'out', type: 'ndarray, optional', desc: 'Output argument for storing result.' }
        ],
        returns: 'Dot product / matrix multiplication result.',
        exampleSnippet: `# Matrix multiplication of two 2D arrays
res = np.dot(matrix_a, matrix_b)`
      },
      {
        name: '@',
        category: 'Algebra',
        signature: 'a @ b (ndarray.__matmul__)',
        summary: 'Python infix matrix multiplication operator dispatching to optimized BLAS GEMM kernels.',
        parameters: [
          { name: 'a', type: 'ndarray', desc: 'Left tensor (M, K).' },
          { name: 'b', type: 'ndarray', desc: 'Right tensor (K, N).' }
        ],
        returns: 'Matrix product of shape (M, N).',
        exampleSnippet: `# Hardware-accelerated GEMM matrix multiplication
A = np.random.randn(512, 256)
B = np.random.randn(256, 128)
C = A @ B  # Dispatches to OpenBLAS/MKL GEMM`
      },
      {
        name: 'np.sum(keepdims=True)',
        category: 'Reduction',
        signature: 'np.sum(a, axis=None, keepdims=False)',
        summary: 'Sum array elements over a given axis, retaining reduced dimensions as size 1 for broadcasting.',
        parameters: [
          { name: 'a', type: 'array_like', desc: 'Elements to sum.' },
          { name: 'axis', type: 'None | int | tuple[int, ...]', desc: 'Axis or axes along which sum is performed.' },
          { name: 'keepdims', type: 'bool, optional', desc: 'If True, reduced axes are left as dimensions of size 1.' }
        ],
        returns: 'Array of sum reduction with broadcast-compatible shape.',
        exampleSnippet: `# Vectorized row norm keeping (N, 1) shape for broadcasting
X = np.random.randn(100, 32)
row_sq_norm = np.sum(X**2, axis=1, keepdims=True)  # Shape (100, 1)`
      }
    ],
    interactiveWidgetType: 'numpy-strides'
  },
  challenges: [
    {
      id: 'd1-c1',
      dayId: 1,
      partId: 1,
      title: 'Vectorized Pairwise Euclidean Distance Matrix',
      slug: 'vectorized-pairwise-distance',
      difficulty: 'Intermediate',
      category: 'NumPy Vectorization',
      summary: 'Compute NxM distance matrix between points without any Python loops using broadcasting.',
      mentalModel5s: 'Expand ||a - b||^2 into ||a||^2 + ||b||^2 - 2(a·b^T). Use row-wise sums broadcasted as (N, 1) and (1, M) combined with BLAS GEMM matrix multiplication to eliminate all O(N*M) Python loops.',
      visualAnalogy: 'Instead of looping point-by-point like measuring distances one ruler at a time, project all vectors into a high-dimensional dot product grid where AVX registers compute entire rows of distances in parallel.',
      pitfalls: [
        'Using nested for-loops in Python (incurs 10^6 bytecode dispatch cycles and drops performance by >1000x).',
        'Forgetting keepdims=True when calculating norms, causing shapes to collapse to (N,) and broadcasting incorrectly.',
        'Negative values inside square root due to floating-point truncation (must use np.maximum(0.0, dist_sq) before np.sqrt).',
        'Creating intermediate broadcasted 3D tensors (N, M, D) which wastes huge amounts of RAM.'
      ],
      progressiveHints: [
        'Tier 1 (Conceptual): The squared Euclidean distance between two vectors a and b is ||a - b||^2 = ||a||^2 + ||b||^2 - 2*(a·b).',
        'Tier 2 (Shapes): Compute a2 = np.sum(A**2, axis=1, keepdims=True) -> shape (N, 1), and b2 = np.sum(B**2, axis=1, keepdims=True).T -> shape (1, M).',
        'Tier 3 (BLAS GEMM): Compute the cross term via matrix multiply: ab = A @ B.T -> shape (N, M).',
        'Tier 4 (Numerical Stability): Floating point precision issues can cause tiny negative numbers (e.g. -1e-16); wrap the sum in np.maximum(0.0, ...) before np.sqrt.'
      ],
      deepInternals: {
        title: 'BLAS GEMM & SIMD Vectorization Lanes',
        content: 'When evaluating A @ B.T, NumPy dispatches directly to OpenBLAS/Intel MKL assembly kernels. These utilize CPU AVX-512 FMA (Fused Multiply-Add) instructions that operate on 8 doubles per cycle, loading contiguous C-order cache lines into L1 without cache thrashing.',
        keyRule: 'Formulate pairwise algorithms as GEMM operations to leverage cache-blocked assembly kernels.'
      },
      instructions: `Given two 2D NumPy arrays $A$ of shape $(N, D)$ and $B$ of shape $(M, D)$, compute the pairwise Euclidean distance matrix $D_{ij} = \\|A_i - B_j\\|_2$ of shape $(N, M)$.

**Requirements:**
1. Do not use any Python \`for\` or \`while\` loops.
2. Use the mathematical expansion $\\|A_i - B_j\\|^2 = \\|A_i\\|^2 + \\|B_j\\|^2 - 2 A_i \\cdot B_j^T$ with NumPy broadcasting and matrix multiplication (\`@\`).
3. Ensure numerical stability by clipping negative floating point values to 0 before taking \`np.sqrt\`.
4. Must execute under 5ms for $N=1000, M=1000, D=64$.`,
      hints: [
        'Compute squared norms: A_norm = np.sum(A**2, axis=1, keepdims=True) of shape (N, 1)',
        'Compute B_norm = np.sum(B**2, axis=1, keepdims=True).T of shape (1, M)',
        'Compute dot product: dot = A @ B.T of shape (N, M)',
        'D2 = np.maximum(0.0, A_norm + B_norm - 2 * dot)',
        'Return np.sqrt(D2)'
      ],
      starterCode: `import numpy as np

def pairwise_distance(A: np.ndarray, B: np.ndarray) -> np.ndarray:
    """
    Compute pairwise Euclidean distance between point sets A and B.
    
    Args:
        A: (N, D) float64 array of N points
        B: (M, D) float64 array of M points
        
    Returns:
        (N, M) float64 array containing Euclidean distances
    """
    # TODO: Implement vectorized distance calculation without Python loops
    pass
`,
      solutionCode: `import numpy as np

def pairwise_distance(A: np.ndarray, B: np.ndarray) -> np.ndarray:
    """
    Vectorized computation using binomial expansion: ||a - b||^2 = ||a||^2 + ||b||^2 - 2(a . b)
    """
    a2 = np.sum(A ** 2, axis=1, keepdims=True)       # Shape (N, 1)
    b2 = np.sum(B ** 2, axis=1, keepdims=True).T     # Shape (1, M)
    ab = A @ B.T                                      # Shape (N, M)
    dist_sq = np.maximum(0.0, a2 + b2 - 2.0 * ab)
    return np.sqrt(dist_sq)
`,
      testCases: [
        { id: 't1', name: 'Identical 1D Points', inputDescription: 'A=[[0],[3]], B=[[0],[4]]', expectedOutput: '[[0.0, 4.0], [3.0, 1.0]]' },
        { id: 't2', name: 'High-dimensional Points (D=128)', inputDescription: 'Random N=100, M=50, D=128', expectedOutput: 'Matches scipy.spatial.distance.cdist' },
        { id: 't3', name: 'Zero-distance self-check', inputDescription: 'A=X, B=X -> Diagonal must be zero', expectedOutput: 'All diagonal entries == 0.0' }
      ],
      benchmarkTargetMs: 4.5,
      memoryTargetMb: 18.0,
      conceptPrimer: {
        title: 'Pairwise Distance & Vectorized Matrix Algebra',
        subtitle: 'Replacing $O(N \\times M)$ nested loops with $O(1)$ BLAS GEMM calls',
        overview: 'Python interpreter loops incur huge dynamic dispatch overhead. By formulating pairwise operations into standard GEMM (General Matrix Multiply) operations, execution is delegated to optimized multi-threaded BLAS/LAPACK kernels utilizing CPU SIMD (AVX-512) registers.',
        mentalModel5s: 'Binomial matrix expansion turns O(N*M*D) triple-loops into O(1) BLAS C-kernel calls.',
        visualAnalogy: 'Broadcasting (N,1) and (1,M) forms a 2D coordinate grid with 0 extra memory allocation.',
        pitfalls: [
          'Forgetting to clip tiny negative values resulting from float precision before np.sqrt.',
          'Not using keepdims=True on norm reductions.'
        ],
        progressiveHints: [
          'Tier 1: a2 + b2 - 2*ab',
          'Tier 2: np.sum(A**2, axis=1, keepdims=True)',
          'Tier 3: A @ B.T',
          'Tier 4: np.sqrt(np.maximum(0.0, dist_sq))'
        ],
        deepInternals: {
          title: 'SIMD AVX-512 Fused Multiply-Add',
          content: 'BLAS GEMM divides matrix multiplication into L1 cache-sized tiles, keeping data inside CPU registers.',
          keyRule: 'Always formulate multi-point Euclidean computations using GEMM.'
        },
        mathFormulas: [
          {
            title: 'Binomial Expansion of Euclidean Distance',
            latex: '\\|\\mathbf{a} - \\mathbf{b}\\|^2 = \\sum_{k=1}^D (a_k - b_k)^2 = \\sum_{k=1}^D a_k^2 + \\sum_{k=1}^D b_k^2 - 2\\sum_{k=1}^D a_k b_k = \\|\\mathbf{a}\\|^2 + \\|\\mathbf{b}\\|^2 - 2\\mathbf{a}^T\\mathbf{b}',
            explanation: 'Expands the quadratic term into point-wise norms plus a matrix product.'
          },
          {
            title: 'Broadcasting Dimension Shapes',
            latex: '(N, 1) + (1, M) - 2(N, M) \\longrightarrow (N, M)',
            explanation: 'NumPy broadcasts (N,1) and (1,M) along singleton dimensions with zero memory duplication.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Naive nested loop: 1,000 x 1,000 points -> 1,000,000 iterations
def naive_distance(A, B):
    N, D = A.shape
    M, _ = B.shape
    dist = np.zeros((N, M))
    for i in range(N):
        for j in range(M):
            acc = 0.0
            for k in range(D):
                acc += (A[i, k] - B[j, k]) ** 2
            dist[i, j] = np.sqrt(acc)
    return dist`,
          naiveExplanation: 'Incurs 10^6 Python function dispatches and bytecode interpretation cycles. Execution takes ~4,200 ms.',
          idiomaticCode: `# Idiomatic Vectorized BLAS GEMM
def idiomatic_distance(A, B):
    a2 = np.sum(A**2, axis=1, keepdims=True)
    b2 = np.sum(B**2, axis=1, keepdims=True).T
    return np.sqrt(np.maximum(0.0, a2 + b2 - 2 * (A @ B.T)))`,
          idiomaticExplanation: 'Dispatches directly to OpenBLAS / MKL GEMM with AVX2/AVX512 vectorization. Execution takes ~3.8 ms (1100x speedup).',
          speedupText: '1105x faster'
        },
        memoryLayout: {
          title: 'CPU Cache Lines & Contiguous C-Order',
          content: 'In C-contiguous arrays (row-major), elements along the last axis are adjacent in RAM. When a CPU loads `A[i, k]`, it fetches an entire 64-byte cache line (8 float64s). Vectorizing with matrix multiply ensures sequential memory access with optimal L1/L2 cache prefetching.',
          diagramAscii: `Memory Buffer (Row-Major):
[A(0,0)][A(0,1)][A(0,2)] ... [A(0,D-1)]  --> Loaded in one 64-byte cache line
[A(1,0)][A(1,1)][A(1,2)] ... [A(1,D-1)]`,
          keyRule: 'Always access memory along the stride-1 contiguous axis to maximize CPU L1 cache line hits.'
        },
        keyTakeaways: [
          'Vectorization eliminates Python bytecode interpretation overhead.',
          'Broadcasting does not copy data; it creates views with stride=0.',
          'Clip intermediate squared distances to 0 to prevent NaN from tiny negative floating point errors.',
          'Leverage GEMM (A @ B.T) to utilize optimized hardware instruction sets.'
        ]
      },
      sampleDataFrame: {
        name: 'Distance Benchmark Matrix (N=5, M=5)',
        columns: ['Point_ID', 'Dist_to_B0', 'Dist_to_B1', 'Dist_to_B2', 'Dist_to_B3', 'Dist_to_B4'],
        dtypes: { Point_ID: 'int64', Dist_to_B0: 'float64', Dist_to_B1: 'float64', Dist_to_B2: 'float64', Dist_to_B3: 'float64', Dist_to_B4: 'float64' },
        rows: [
          { Point_ID: 0, Dist_to_B0: 0.000, Dist_to_B1: 2.341, Dist_to_B2: 5.892, Dist_to_B3: 3.120, Dist_to_B4: 7.451 },
          { Point_ID: 1, Dist_to_B0: 2.341, Dist_to_B1: 0.000, Dist_to_B2: 4.115, Dist_to_B3: 1.890, Dist_to_B4: 6.204 },
          { Point_ID: 2, Dist_to_B0: 5.892, Dist_to_B1: 4.115, Dist_to_B2: 0.000, Dist_to_B3: 3.901, Dist_to_B4: 2.781 },
          { Point_ID: 3, Dist_to_B0: 3.120, Dist_to_B1: 1.890, Dist_to_B2: 3.901, Dist_to_B3: 0.000, Dist_to_B4: 5.112 },
          { Point_ID: 4, Dist_to_B0: 7.451, Dist_to_B1: 6.204, Dist_to_B2: 2.781, Dist_to_B3: 5.112, Dist_to_B4: 0.000 }
        ],
        totalRows: 5,
        memoryUsageKb: 1.2
      },
      samplePlot: {
        id: 'p1',
        title: 'Pairwise Distance Latency: Loop vs Vectorized vs GEMM',
        type: 'svg',
        description: 'Benchmark comparison across point counts (N = 100 to 5,000)',
        svgContent: `<svg viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
          <rect width="600" height="300" fill="#0f172a" rx="8"/>
          <line x1="60" y1="240" x2="560" y2="240" stroke="#334155" stroke-width="1.5"/>
          <line x1="60" y1="40" x2="60" y2="240" stroke="#334155" stroke-width="1.5"/>
          <!-- Grid lines -->
          <line x1="60" y1="190" x2="560" y2="190" stroke="#1e293b" stroke-dasharray="4"/>
          <line x1="60" y1="140" x2="560" y2="140" stroke="#1e293b" stroke-dasharray="4"/>
          <line x1="60" y1="90" x2="560" y2="90" stroke="#1e293b" stroke-dasharray="4"/>
          <!-- Loop Curve (Red) -->
          <path d="M 80 235 Q 200 220, 300 160 T 520 50" fill="none" stroke="#ef4444" stroke-width="3"/>
          <!-- Vectorized (Amber) -->
          <path d="M 80 238 Q 200 235, 300 220 T 520 180" fill="none" stroke="#f59e0b" stroke-width="3"/>
          <!-- GEMM BLAS (Green) -->
          <path d="M 80 239 L 520 236" fill="none" stroke="#22c55e" stroke-width="3.5"/>
          <!-- Labels -->
          <text x="530" y="55" fill="#ef4444" font-size="11" font-family="monospace">Python Loop (3.8s)</text>
          <text x="530" y="180" fill="#f59e0b" font-size="11" font-family="monospace">NumPy Broadcast (120ms)</text>
          <text x="530" y="235" fill="#22c55e" font-weight="bold" font-size="11" font-family="monospace">GEMM BLAS (3.4ms)</text>
          <text x="30" y="35" fill="#94a3b8" font-size="11">Time (ms)</text>
          <text x="510" y="260" fill="#94a3b8" font-size="11">Points N</text>
        </svg>`
      },
      expectedTensors: [
        { name: 'A', shape: '(1000, 64)', dtype: 'float64' },
        { name: 'B', shape: '(1000, 64)', dtype: 'float64' },
        { name: 'Output Distance Matrix', shape: '(1000, 1000)', dtype: 'float64' }
      ]
    },
    {
      id: 'd1-c2',
      dayId: 1,
      partId: 1,
      title: 'Zero-Copy 2D Rolling Window via `as_strided`',
      slug: 'zero-copy-strided-rolling-window',
      difficulty: 'Advanced',
      category: 'Strides & Memory Views',
      summary: 'Extract a sliding window view over a 2D image matrix without allocating duplicate memory buffers.',
      mentalModel5s: 'An ndarray is just a 1D pointer buffer + shape & strides metadata. By duplicating stride values into a 4D shape tuple via as_strided, we create overlapping sliding window views in O(1) time with 0 extra bytes allocated.',
      visualAnalogy: 'A magnifying glass sliding over a printed newspaper. You do not photocopy the newspaper for every window position; you just shift the lens coordinates over the existing paper.',
      pitfalls: [
        'Writing to an overlapping strided view, which corrupts neighboring overlapping windows in memory (always set writeable=False).',
        'Using naive Python slicing or appending arrays in loops, causing hundreds of megabytes of duplicate RAM allocations.',
        'Miscalculating strides by assuming element count rather than byte offsets (strides = arr.strides).',
        'Reading past memory boundaries when window dimensions exceed array dimensions.'
      ],
      progressiveHints: [
        'Tier 1 (Conceptual): Strides represent the number of bytes to advance in RAM along each dimension. Re-mapping strides lets you traverse the same 1D memory buffer across multiple virtual axes.',
        'Tier 2 (Dimensions): For input (H, W) and window (kh, kw), the output 4D shape is (H - kh + 1, W - kw + 1, kh, kw).',
        'Tier 3 (Stride Mapping): The strides tuple maps row and column jumps for both window placement and internal window navigation: (s_row, s_col, s_row, s_col).',
        'Tier 4 (Memory Safety): Pass writeable=False to np.lib.stride_tricks.as_strided to guarantee immutability on shared underlying memory buffers.'
      ],
      deepInternals: {
        title: 'C-Order Memory Pointer Arithmetic',
        content: 'NumPy maps index (i, j, ki, kj) to byte address P_base + i*s_0 + j*s_1 + ki*s_0 + kj*s_1. Because both window index i and inner offset ki step by s_0 (the row stride), the CPU reads contiguous memory segments without buffer copies.',
        keyRule: 'Overlapping strided views must always be flagged read-only (writeable=False) to prevent memory corruption.'
      },
      instructions: `Given a 2D matrix $X$ of shape $(H, W)$ and window size $(k_h, k_w)$, construct a 4D view of shape $(H - k_h + 1, W - k_w + 1, k_h, k_w)$ using \`np.lib.stride_tricks.as_strided\`.

**Requirements:**
1. Zero memory allocation: the returned array must share the exact same underlying buffer (\`out.base is X\` or shares base).
2. Calculate new strides based on original itemsize and row/column strides.
3. Compute 2D moving average over all windows in $O(1)$ view creation time.`,
      hints: [
        'Original strides are (s_row, s_col) = X.strides',
        'New shape is (H - kh + 1, W - kw + 1, kh, kw)',
        'New strides are (s_row, s_col, s_row, s_col)',
        'np.lib.stride_tricks.as_strided(X, shape=new_shape, strides=new_strides, writeable=False)'
      ],
      starterCode: `import numpy as np
from numpy.lib.stride_tricks import as_strided

def rolling_window_2d(arr: np.ndarray, window_shape: tuple[int, int]) -> np.ndarray:
    """
    Create a zero-copy 4D sliding window view over a 2D array.
    
    Args:
        arr: 2D numpy array of shape (H, W)
        window_shape: (kh, kw) tuple specifying window height and width
        
    Returns:
        4D array of shape (H - kh + 1, W - kw + 1, kh, kw)
    """
    # TODO: Implement zero-copy sliding window using as_strided
    pass
`,
      solutionCode: `import numpy as np
from numpy.lib.stride_tricks import as_strided

def rolling_window_2d(arr: np.ndarray, window_shape: tuple[int, int]) -> np.ndarray:
    kh, kw = window_shape
    H, W = arr.shape
    if kh > H or kw > W:
        raise ValueError("Window dimensions exceed array shape")
        
    out_h = H - kh + 1
    out_w = W - kw + 1
    s_row, s_col = arr.strides
    
    new_shape = (out_h, out_w, kh, kw)
    new_strides = (s_row, s_col, s_row, s_col)
    
    return as_strided(arr, shape=new_shape, strides=new_strides, writeable=False)
`,
      testCases: [
        { id: 't1', name: '4x4 Array with 2x2 Window', inputDescription: 'arr=np.arange(16).reshape(4,4), win=(2,2)', expectedOutput: 'Shape (3,3,2,2) with first window [[0,1],[4,5]]' },
        { id: 't2', name: 'Zero Memory Duplication Check', inputDescription: 'view.nbytes vs actual allocation', expectedOutput: 'Memory overhead < 1KB' }
      ],
      benchmarkTargetMs: 0.12,
      memoryTargetMb: 0.05,
      conceptPrimer: {
        title: 'NumPy Memory Strides & Zero-Copy Views',
        subtitle: 'How multidimensional indexing maps to 1D linear RAM addresses',
        overview: 'Every NumPy ndarray is composed of a 1D raw memory buffer and metadata: shape, dtype, and strides. Strides define the byte step required to advance one element along each dimension.',
        mentalModel5s: 'Strides define byte offsets in RAM. Reordering strides lets you view data in new shapes with zero memory duplication.',
        visualAnalogy: 'A virtual index table referencing fixed physical memory cells without cloning data.',
        pitfalls: [
          'Writing to overlapping views corrupts adjacent windows.',
          'Using byte strides incorrectly when array itemsize differs from standard 8 bytes.'
        ],
        progressiveHints: [
          'Tier 1: Strides map coordinates to RAM byte offsets.',
          'Tier 2: New shape = (H-kh+1, W-kw+1, kh, kw)',
          'Tier 3: New strides = (s_r, s_c, s_r, s_c)',
          'Tier 4: Use writeable=False'
        ],
        deepInternals: {
          title: 'Memory Stride Calculations',
          content: 'The stride array stores the byte jump per index increment. as_strided directly updates this tuple.',
          keyRule: 'Always set writeable=False on overlapping views.'
        },
        mathFormulas: [
          {
            title: 'Linear Byte Offset Formula',
            latex: '\\text{Byte Offset}(i_0, i_1, \\dots, i_{d-1}) = \\sum_{k=0}^{d-1} i_k \\times \\text{stride}_k',
            explanation: 'Pointer arithmetic in C: address = data_ptr + sum(indices * strides).'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Naive nested array copying
def naive_windows(arr, kh, kw):
    H, W = arr.shape
    windows = []
    for r in range(H - kh + 1):
        for c in range(W - kw + 1):
            windows.append(arr[r:r+kh, c:c+kw]) # Allocates new slices
    return np.array(windows).reshape(H-kh+1, W-kw+1, kh, kw)`,
          naiveExplanation: 'Allocates massive memory duplicates (e.g. 500MB for 1080p image).',
          idiomaticCode: `# Zero-copy stride trick
def strided_windows(arr, kh, kw):
    s_r, s_c = arr.strides
    return as_strided(arr, shape=(arr.shape[0]-kh+1, arr.shape[1]-kw+1, kh, kw),
                      strides=(s_r, s_c, s_r, s_c), writeable=False)`,
          idiomaticExplanation: 'Instantaneous pointer remapping with 0 bytes of heap allocation.',
          speedupText: '450x faster'
        },
        memoryLayout: {
          title: 'Stride Mapping in Linear RAM',
          content: 'By repeating the stride tuple `(s_row, s_col, s_row, s_col)`, we step across windows along dimensions 0 and 1, while stepping inside each window along dimensions 2 and 3.',
          diagramAscii: `Array 4x4 (Row Stride=32B, Col Stride=8B):
Row 0: [ 0,  1,  2,  3]
Row 1: [ 4,  5,  6,  7]
Window 0: [[0,1],[4,5]] -> Strides (32, 8, 32, 8)`,
          keyRule: 'Always mark strided views as `writeable=False` to prevent memory corruption from overlapping window writes.'
        },
        keyTakeaways: [
          'Strides dictate byte offsets without touching the underlying array buffer.',
          'as_strided unlocks sliding windows, convolution im2col, and dilated convolutions in zero time.',
          'Never write to overlapping views!'
        ]
      }
    }
  ]
};

export const PART01_TRACK = DAY01_TRACK;
export default DAY01_TRACK;
