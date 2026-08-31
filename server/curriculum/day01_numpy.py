"""
Day 1: High-Performance NumPy Internals & Vectorization
PyMastery 7-Day Curriculum
"""

import numpy as np
import time
from typing import Dict, Any, List

DAY_METADATA = {
    "day_id": "day01",
    "day_number": 1,
    "title": "Day 1: High-Performance NumPy Internals & Vectorization",
    "tagline": "Master memory layouts, strides, SIMD broadcasting, and zero-copy views for peak computational throughput.",
    "estimated_time": "3-4 hours",
    "concepts_covered": [
        "C vs Fortran memory order (Row-major vs Column-major)",
        "Memory strides & byte-offset pointer arithmetic",
        "SIMD vectorization & NumPy broadcasting rules",
        "Zero-copy views vs memory allocations (np.shares_memory)",
        "Sliding window views with stride tricks (np.lib.stride_tricks.as_strided)",
        "Cache line locality & memory profiling"
    ]
}

CONCEPT_PRIMER = r"""# Day 1 Concept Primer: NumPy Memory Architecture & Vectorization

## 1. C-Order vs Fortran-Order Memory Layout
In physical RAM, multi-dimensional arrays are laid out as a flat, contiguous 1D sequence of bytes. The two primary conventions for mapping multi-dimensional indices $(i, j)$ to 1D physical offsets are:

* **C-Order (Row-Major)**: Consecutive elements of a row are contiguous in memory. As you traverse elements horizontally across columns (`arr[i, 0], arr[i, 1], ...`), the memory address increases by `itemsize`. The last dimension changes fastest.
* **Fortran-Order (Column-Major)**: Consecutive elements of a column are contiguous in memory. As you traverse elements vertically across rows (`arr[0, j], arr[1, j], ...`), memory address increases by `itemsize`. The first dimension changes fastest.

```
2x3 Array: [[1, 2, 3],
            [4, 5, 6]]

C-Order memory layout:       [ 1 | 2 | 3 | 4 | 5 | 6 ]   (offset = i * 3 + j)
Fortran-Order memory layout: [ 1 | 4 | 2 | 5 | 3 | 6 ]   (offset = j * 2 + i)
```

### CPU Cache Line Locality
Modern CPUs load data from RAM into L1/L2/L3 caches in **cache lines** (typically 64 bytes = 8 double-precision floats).
* Accessing memory contiguously (stride = 1 element) achieves near 100% cache line utilization (1 memory fetch serves 8 operations).
* Accessing memory with large non-unit strides causes frequent **cache misses**, stalling CPU execution by 100-300 cycles per access.

## 2. Strides and Pointer Arithmetic
An `ndarray` consists of a Python object wrapper referencing a contiguous or strided memory buffer (the data pointer) along with metadata:
* `shape`: Tuple of dimension sizes $(d_0, d_1, \dots, d_{k-1})$.
* `dtype`: Data type specifying element size in bytes (e.g. `float64` = 8 bytes).
* `strides`: Tuple of byte steps $(s_0, s_1, \dots, s_{k-1})$ required to move 1 index forward along each dimension.

### Address Formula
For an array with base address pointer $P_{\text{base}}$, the byte address of element $(i_0, i_1, \dots, i_{k-1})$ is:
$$\text{Address}(i_0, i_1, \dots, i_{k-1}) = P_{\text{base}} + \sum_{m=0}^{k-1} i_m \times s_m$$

For a 2D float64 C-contiguous array of shape $(N, M)$:
* $s_0 = M \times 8 \text{ bytes}$
* $s_1 = 1 \times 8 = 8 \text{ bytes}$

When transposing an array (`arr.T`), NumPy **does not allocate or copy data**. It simply swaps `shape` and `strides`:
$$\text{shape: } (N, M) \to (M, N), \quad \text{strides: } (s_0, s_1) \to (s_1, s_0)$$

## 3. SIMD & Broadcasting Rules
Broadcasting enables element-wise operations on arrays of different shapes without copying data. NumPy compares shapes element-wise starting from the **trailing (rightmost) dimension** backwards:

Two dimensions are compatible if:
1. They are equal: $d_{1, k} == d_{2, k}$
2. One of them is 1: $d_{1, k} == 1$ or $d_{2, k} == 1$

When a dimension is 1, NumPy broadcasts it by setting the stride for that dimension to **0 bytes**. When the index increases, the byte offset formula adds $i \times 0 = 0$, repeatedly referencing the exact same memory address across SIMD registers without duplicating memory in RAM.

## 4. Slicing vs Views vs Copies
* **Basic Slicing (`arr[::2, 1:4]`)**: Returns a **View**. Shares the underlying data buffer with the original array (`np.shares_memory(arr, slice) == True`). Modifying the view modifies the original array!
* **Advanced / Fancy Indexing (`arr[[0, 2], :]` or `arr[arr > 0]`)**: Always allocates new memory and returns a **Copy**.
* **Contiguity**: Slicing or transposing creates non-contiguous arrays (`arr.flags.c_contiguous == False`). If you pass non-contiguous arrays to C extensions or BLAS routines that expect contiguous memory, NumPy implicitly copies the array, incurring hidden overhead. Fix with `np.ascontiguousarray(arr)`.
"""

WALKTHROUGH = r"""# Day 1 Walkthrough: Memory Profiling & Vectorization Benchmarking

Let's profile the runtime and cache behavior of pure Python loops vs vectorized operations.

```python
import numpy as np
import time

def benchmark_row_vs_col_major():
    # 5000 x 5000 float64 array (approx 200 MB)
    size = 5000
    c_arr = np.ones((size, size), dtype=np.float64, order='C')
    f_arr = np.ones((size, size), dtype=np.float64, order='F')

    # Row-wise traversal across C-order array (cache-friendly)
    t0 = time.perf_counter()
    sum_c_row = np.sum(c_arr, axis=1) # iterates row-wise
    t_c_row = time.perf_counter() - t0

    # Column-wise traversal across C-order array (stride jump, cache-unfriendly)
    t0 = time.perf_counter()
    sum_c_col = np.sum(c_arr, axis=0) # iterates column-wise
    t_c_col = time.perf_counter() - t0

    print(f"C-order Row Sum (stride 8B): {t_c_row*1000:.2f} ms")
    print(f"C-order Col Sum (stride 40KB): {t_c_col*1000:.2f} ms")
    print(f"Speedup: {t_c_col / t_c_row:.2f}x")

# Zero-Copy Sliding Window using Stride Tricks
def demonstrate_strides():
    arr = np.arange(10, dtype=np.int32)
    # Shape: (10,), Strides: (4,)
    print(f"Original shape: {arr.shape}, strides: {arr.strides}")

    # Sliding window of size 3 with step 1
    # We want output shape: (8, 3) -> 8 windows of 3 elements
    window_size = 3
    num_windows = len(arr) - window_size + 1
    
    # Stride along windows is 4 bytes (step 1 element)
    # Stride inside window is 4 bytes (step 1 element)
    windows = np.lib.stride_tricks.as_strided(
        arr,
        shape=(num_windows, window_size),
        strides=(arr.strides[0], arr.strides[0]),
        writeable=False
    )
    print(f"Windows shape: {windows.shape}, strides: {windows.strides}")
    print(f"Shares memory: {np.shares_memory(arr, windows)}")
    print(windows)
```
"""

# -----------------------------------------------------------------------------
# Challenge 1: Fast Pairwise Euclidean Distance Matrix
# -----------------------------------------------------------------------------

CHALLENGE_1 = {
    "id": "day01_ch01_pairwise_distance",
    "title": "Fast Pairwise Euclidean Distance Matrix",
    "difficulty": "Medium",
    "category": "Vectorization & Broadcasting",
    "description": (
        "Given matrix X of shape (N, D) and matrix Y of shape (M, D), compute the pairwise "
        "Euclidean distance matrix D of shape (N, M), where D[i, j] = ||X[i] - Y[j]||_2. "
        "The solution must be strictly vectorized with ZERO Python loops, robust against "
        "floating-point precision issues (negative values under sqrt), and optimized for SIMD throughput."
    ),
    "instructions": (
        "1. Implement `pairwise_euclidean_distance(X: np.ndarray, Y: np.ndarray) -> np.ndarray`.\n"
        "2. Input `X` has shape `(N, D)` and `Y` has shape `(M, D)` with dtype `float32` or `float64`.\n"
        "3. Return distance matrix `D` of shape `(N, M)`.\n"
        "4. Must NOT contain any `for`, `while`, or list comprehensions.\n"
        "5. Consider the expansion formula: ||x - y||^2 = ||x||^2 + ||y||^2 - 2 * <x, y> for O(N*M*D) matrix multiplications.\n"
        "6. Ensure values under square root are clamped to 0.0 to avoid NaN from minor numerical inaccuracies."
    ),
    "starter_code": r'''import numpy as np

def pairwise_euclidean_distance(X: np.ndarray, Y: np.ndarray) -> np.ndarray:
    """
    Compute the pairwise Euclidean distance matrix between X and Y.
    
    Args:
        X: np.ndarray of shape (N, D)
        Y: np.ndarray of shape (M, D)
        
    Returns:
        np.ndarray of shape (N, M) where element (i, j) is ||X[i] - Y[j]||_2
    """
    # TODO: Implement zero-loop vectorized pairwise Euclidean distance
    pass
''',
    "reference_solution": r'''import numpy as np

def pairwise_euclidean_distance(X: np.ndarray, Y: np.ndarray) -> np.ndarray:
    """
    Compute pairwise Euclidean distance using the algebraic expansion:
    ||x - y||^2 = ||x||^2 + ||y||^2 - 2(x . y)
    
    This replaces O(N*M*D) element-wise operations with a highly optimized BLAS GEMM (np.dot)
    plus O(N) and O(M) norm calculations.
    """
    if X.ndim != 2 or Y.ndim != 2:
        raise ValueError(f"Expected 2D arrays, got X.shape={X.shape}, Y.shape={Y.shape}")
    if X.shape[1] != Y.shape[1]:
        raise ValueError(f"Feature dimensions must match: X has {X.shape[1]}, Y has {Y.shape[1]}")
    
    # Compute squared L2 norms along feature axis
    # X_norm_sq shape: (N, 1), Y_norm_sq shape: (1, M)
    x_norm_sq = np.sum(X ** 2, axis=1, keepdims=True)
    y_norm_sq = np.sum(Y ** 2, axis=1, keepdims=True).T
    
    # Fast BLAS level-3 matrix multiplication: (N, D) @ (D, M) -> (N, M)
    gram_matrix = np.dot(X, Y.T)
    
    # Expansion: ||x||^2 + ||y||^2 - 2 <x, y>
    dist_sq = x_norm_sq + y_norm_sq - 2.0 * gram_matrix
    
    # Clamp negative values to zero due to numerical precision
    dist_sq = np.maximum(dist_sq, 0.0)
    
    return np.sqrt(dist_sq)
''',
    "test_suite": r'''import numpy as np
import time

def run_tests(candidate_func):
    """
    Comprehensive test suite for Pairwise Euclidean Distance
    """
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # 1. Basic Correctness Test
    X = np.array([[0.0, 0.0], [1.0, 1.0], [2.0, 2.0]], dtype=np.float64)
    Y = np.array([[0.0, 0.0], [1.0, 1.0]], dtype=np.float64)
    expected = np.array([
        [0.0, np.sqrt(2.0)],
        [np.sqrt(2.0), 0.0],
        [np.sqrt(8.0), np.sqrt(2.0)]
    ])
    result = candidate_func(X, Y)
    assert_test(result.shape == (3, 2), f"Shape mismatch: expected (3, 2), got {result.shape}")
    assert_test(np.allclose(result, expected, atol=1e-7), "Basic correctness values failed")
    
    # 2. Identical Points & Diagonal Zero Check
    N, D = 100, 32
    X_rand = np.random.randn(N, D)
    dist_self = candidate_func(X_rand, X_rand)
    assert_test(dist_self.shape == (N, N), "Self distance shape mismatch")
    assert_test(np.allclose(np.diag(dist_self), 0.0, atol=1e-5), "Diagonal of self-distance must be strictly 0")
    assert_test(np.allclose(dist_self, dist_self.T, atol=1e-5), "Self-distance matrix must be symmetric")
    
    # 3. High-Dimensional & Large Scale Benchmark
    N, M, D = 500, 400, 128
    X_large = np.random.randn(N, D).astype(np.float64)
    Y_large = np.random.randn(M, D).astype(np.float64)
    
    t0 = time.perf_counter()
    dist_large = candidate_func(X_large, Y_large)
    elapsed = time.perf_counter() - t0
    
    # Ground truth reference via scipy/broadcasting
    diff = X_large[:, np.newaxis, :] - Y_large[np.newaxis, :, :]
    expected_large = np.sqrt(np.sum(diff ** 2, axis=-1))
    
    assert_test(np.allclose(dist_large, expected_large, atol=1e-5), "Large-scale values failed against broadcast ground truth")
    assert_test(elapsed < 0.25, f"Performance budget exceeded: took {elapsed:.4f}s for 500x400x128")
    
    # 4. Edge Cases: Single point inputs (1, D) and (1, D)
    X_single = np.array([[3.0, 4.0]])
    Y_single = np.array([[0.0, 0.0]])
    res_single = candidate_func(X_single, Y_single)
    assert_test(res_single.shape == (1, 1), f"Single point shape mismatch: {res_single.shape}")
    assert_test(np.isclose(res_single[0, 0], 5.0, atol=1e-7), f"Expected distance 5.0, got {res_single[0, 0]}")

    return report
''',
    "hints": [
        "Use algebraic expansion: ||x - y||^2 = ||x||^2 + ||y||^2 - 2 * (x . y).",
        "Compute X norms as (N, 1) and Y norms as (1, M), then use matrix dot product X @ Y.T.",
        "Remember to call `np.maximum(dist_sq, 0.0)` before `np.sqrt` to avoid negative square roots caused by floating-point rounding."
    ]
}

# -----------------------------------------------------------------------------
# Challenge 2: Custom 2D Convolution Kernel via Vectorized Stride Tricks
# -----------------------------------------------------------------------------

CHALLENGE_2 = {
    "id": "day01_ch02_strided_conv2d",
    "title": "Custom 2D Convolution Kernel via Zero-Copy Strides",
    "difficulty": "Hard",
    "category": "Strides & Memory Manipulation",
    "description": (
        "Implement a 2D single-channel convolution operation `conv2d(image, kernel, stride=1, padding=0)` "
        "using `np.lib.stride_tricks.as_strided` or `np.lib.stride_tricks.sliding_window_view` to extract "
        "all receptive fields as a zero-copy strided view, followed by vectorized tensor multiplication. "
        "NO Python loops over spatial dimensions (H, W) are allowed."
    ),
    "instructions": (
        "1. Implement `conv2d(image: np.ndarray, kernel: np.ndarray, stride: int = 1, padding: int = 0) -> np.ndarray`.\n"
        "2. `image` is 2D with shape `(H, W)`, `kernel` is 2D with shape `(kH, kW)`.\n"
        "3. If `padding > 0`, apply zero-padding to all 4 borders of `image` (`np.pad`).\n"
        "4. Calculate output dimensions: `out_H = (H + 2*p - kH) // stride + 1`, `out_W = (W + 2*p - kW) // stride + 1`.\n"
        "5. Use `as_strided` to create a 4D view of shape `(out_H, out_W, kH, kW)`.\n"
        "6. Compute output via `np.tensordot` or `np.einsum('ijkl,kl->ij')` or element-wise sum.\n"
        "7. Ensure memory safety (strides calculation must match input image byte strides)."
    ),
    "starter_code": r'''import numpy as np

def conv2d(image: np.ndarray, kernel: np.ndarray, stride: int = 1, padding: int = 0) -> np.ndarray:
    """
    Perform 2D convolution with zero spatial Python loops.
    
    Args:
        image: 2D array of shape (H, W)
        kernel: 2D array of shape (kH, kW)
        stride: Integer spatial stride step
        padding: Integer zero-padding amount applied to borders
        
    Returns:
        2D array of shape (out_H, out_W)
    """
    # TODO: Implement zero-copy strided 2D convolution
    pass
''',
    "reference_solution": r'''import numpy as np

def conv2d(image: np.ndarray, kernel: np.ndarray, stride: int = 1, padding: int = 0) -> np.ndarray:
    """
    Perform 2D convolution using numpy stride tricks and tensor contraction.
    """
    if image.ndim != 2 or kernel.ndim != 2:
        raise ValueError(f"image and kernel must both be 2D, got image: {image.ndim}D, kernel: {kernel.ndim}D")
    
    # 1. Apply padding if requested
    if padding > 0:
        padded_img = np.pad(image, pad_width=padding, mode='constant', constant_values=0)
    else:
        padded_img = image
        
    # Ensure C-contiguous memory layout for accurate stride stepping
    padded_img = np.ascontiguousarray(padded_img)
    
    H, W = padded_img.shape
    kH, kW = kernel.shape
    
    if kH > H or kW > W:
        raise ValueError(f"Kernel dimensions ({kH}, {kW}) exceed padded image dimensions ({H}, {W})")
    
    out_H = (H - kH) // stride + 1
    out_W = (W - kW) // stride + 1
    
    s_row, s_col = padded_img.strides
    
    # Construct 4D sliding window view: (out_H, out_W, kH, kW)
    # Stride to next window row: s_row * stride
    # Stride to next window col: s_col * stride
    # Stride within window row: s_row
    # Stride within window col: s_col
    view_shape = (out_H, out_W, kH, kW)
    view_strides = (s_row * stride, s_col * stride, s_row, s_col)
    
    windows = np.lib.stride_tricks.as_strided(
        padded_img,
        shape=view_shape,
        strides=view_strides,
        writeable=False
    )
    
    # Tensor contraction: multiply kernel along (kH, kW) axes and sum
    # Einstein summation: (out_H, out_W, kH, kW) x (kH, kW) -> (out_H, out_W)
    output = np.einsum('ijkl,kl->ij', windows, kernel)
    
    return output
''',
    "test_suite": r'''import numpy as np

def run_tests(candidate_func):
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # 1. Identity / Dirac Delta Kernel Test
    img = np.arange(25, dtype=np.float64).reshape(5, 5)
    delta_kernel = np.array([[0, 0, 0],
                             [0, 1, 0],
                             [0, 0, 0]], dtype=np.float64)
    # Valid conv without padding
    out_valid = candidate_func(img, delta_kernel, stride=1, padding=0)
    assert_test(out_valid.shape == (3, 3), f"Expected (3, 3), got {out_valid.shape}")
    assert_test(np.allclose(out_valid, img[1:4, 1:4]), "Dirac delta identity test failed")
    
    # 2. Same-Padding with Sobel Filter
    sobel_x = np.array([[-1, 0, 1],
                        [-2, 0, 2],
                        [-1, 0, 1]], dtype=np.float64)
    out_same = candidate_func(img, sobel_x, stride=1, padding=1)
    assert_test(out_same.shape == (5, 5), f"Same padding shape mismatch: expected (5, 5), got {out_same.shape}")
    
    # 3. Strided Convolution Check (stride=2)
    large_img = np.random.randn(10, 10)
    kernel_3x3 = np.random.randn(3, 3)
    out_strided = candidate_func(large_img, kernel_3x3, stride=2, padding=1)
    # out_dim = (10 + 2*1 - 3) // 2 + 1 = 5
    assert_test(out_strided.shape == (5, 5), f"Strided output shape mismatch: expected (5, 5), got {out_strided.shape}")
    
    # 4. Numerical verification against explicit loop ground truth
    H, W = large_img.shape
    kH, kW = kernel_3x3.shape
    p = 1
    s = 2
    pad_img = np.pad(large_img, p, mode='constant', constant_values=0)
    expected_loop = np.zeros((5, 5))
    for i in range(5):
        for j in range(5):
            r_start = i * s
            c_start = j * s
            window = pad_img[r_start:r_start+kH, c_start:c_start+kW]
            expected_loop[i, j] = np.sum(window * kernel_3x3)
            
    assert_test(np.allclose(out_strided, expected_loop, atol=1e-7), "Stride=2 conv numerical values mismatch loop baseline")

    return report
''',
    "hints": [
        "Ensure `image` is C-contiguous using `np.ascontiguousarray` before extracting strides.",
        "The strides for the 4D view are `(s_row * stride, s_col * stride, s_row, s_col)` where `(s_row, s_col) = padded_img.strides`.",
        "`np.einsum('ijkl,kl->ij', windows, kernel)` or `np.tensordot(windows, kernel, axes=((2, 3), (0, 1)))` performs the vectorized contraction."
    ]
}

CURRICULUM_DATA = {
    **DAY_METADATA,
    "concept_primer": CONCEPT_PRIMER,
    "walkthrough": WALKTHROUGH,
    "challenges": [CHALLENGE_1, CHALLENGE_2]
}

def get_curriculum() -> Dict[str, Any]:
    return CURRICULUM_DATA
