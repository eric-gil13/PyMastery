"""
Part 1: PyTorch Tensor Foundations & Device Mechanics
PyMastery Progressive Zero-to-Hero PyTorch Curriculum
"""

import numpy as np
import torch
from typing import Dict, Any, List

DAY_METADATA = {
    "day_id": "pytorch01",
    "day_number": 1,
    "title": "Part 1: Tensor Foundations & Math",
    "tagline": "Master multidimensional tensors, dtypes, device placement (.to), and the NumPy bridge.",
    "estimated_time": "2-3 hours",
    "concepts_covered": [
        "PyTorch Tensor anatomy: storage, stride, shape, dtype",
        "Tensor initialization: torch.tensor, torch.zeros, torch.ones, torch.randn",
        "Matrix multiplication: torch.matmul vs element-wise multiplication (*)",
        "Zero-copy NumPy bridge: torch.from_numpy and memory sharing",
        "Device semantics: CPU vs CUDA hardware accelerators and .to(device)"
    ]
}

CONCEPT_PRIMER = r"""# Part 1 Concept Primer: PyTorch Tensor Foundations & Math

## 1. What is a Tensor?
In deep learning, data representations—from audio waveforms and image pixels to LLM embeddings and neural network weights—are organized into multidimensional arrays called **Tensors**.

While conceptually similar to NumPy `ndarray`s, PyTorch `torch.Tensor` objects offer two superpowers essential for modern artificial intelligence:
1. **Hardware Acceleration:** Seamless execution on GPUs (CUDA), Apple Silicon (MPS), and TPUs with massive parallel throughput.
2. **Automatic Differentiation (Autograd):** Built-in tape-based recording of mathematical operations for backpropagation.

```
0D Tensor (Scalar):       42.0                  shape: ()
1D Tensor (Vector):       [1.0, 2.0, 3.0]       shape: (3,)
2D Tensor (Matrix):       [[1, 2], [3, 4]]      shape: (2, 2)
3D Tensor (Batch/Seq):    [[[1, 2], [3, 4]]]    shape: (1, 2, 2)
4D Tensor (Vision NCHW):  (Batch, Channels, Height, Width)
```

---

## 2. Tensor Data Types & Memory
Every tensor is stored as a contiguous flat block of raw bytes in memory (called an `UntypedStorage`), wrapped by metadata including `shape`, `stride`, and `dtype`:

* `torch.float32` (`torch.float`): 32-bit floating point (single precision). **Default for deep learning weights and activations.**
* `torch.float64` (`torch.double`): 64-bit floating point (double precision). Used for high-precision scientific computing.
* `torch.int64` (`torch.long`): 64-bit signed integer. **Standard in PyTorch for classification labels, embedding indices, and tokens.**
* `torch.int32` (`torch.int`): 32-bit signed integer.
* `torch.bool`: Boolean mask tensor.

```python
x = torch.tensor([1.5, 2.5, 3.5], dtype=torch.float32)
labels = torch.tensor([0, 2, 1], dtype=torch.int64)
```

---

## 3. Matrix Multiplication: `torch.matmul` vs `*`
A fundamental mathematical distinction in deep learning:
* **Element-wise multiplication (`*` or `torch.mul`):** Multiplies elements at matching positions. Tensors must be the same shape or broadcastable.
* **Matrix multiplication (`@` or `torch.matmul`):** Performs linear algebraic dot-product contraction. For $(M \times K)$ and $(K \times N)$, the inner dimension $K$ must match, yielding $(M \times N)$.

```python
A = torch.tensor([[1.0, 2.0], [3.0, 4.0]])  # Shape (2, 2)
B = torch.tensor([[5.0, 6.0], [7.0, 8.0]])  # Shape (2, 2)

elem = A * B       # [[ 5., 12.], [21., 32.]]
matmul = A @ B     # [[19., 22.], [43., 50.]]
```

---

## 4. The NumPy Bridge & Zero-Copy Memory Sharing
PyTorch and NumPy share a seamless zero-copy bridge on CPU:
* `torch.from_numpy(np_arr)` creates a tensor pointing to the **exact same memory buffer** as the NumPy array. Modifying one instantly updates the other without allocating extra RAM!
* `tensor.numpy()` converts a CPU tensor back to a NumPy array sharing memory.
* If you need an independent copy that does not share memory, invoke `.clone()`.

```python
import numpy as np

np_arr = np.array([1.0, 2.0, 3.0], dtype=np.float32)
torch_t = torch.from_numpy(np_arr)

# Zero-copy verification:
np_arr[0] = 99.0
print(torch_t[0])  # Prints 99.0!
```

---

## 5. Device Placement: CPU and CUDA
Deep learning computations are accelerated by moving tensors from host system RAM (CPU) to dedicated GPU VRAM (CUDA):
* Check accelerator availability: `torch.cuda.is_available()`
* Target device: `device = torch.device("cuda" if torch.cuda.is_available() else "cpu")`
* Transfer tensor: `x_gpu = x.to(device)`

> **Memory Rule:** All operands in an operation must reside on the **same device**. Attempting `cpu_tensor + cuda_tensor` raises a `RuntimeError: Expected all tensors to be on the same device`.
"""

WALKTHROUGH = r"""# Part 1 Code Walkthrough: Tensor Mechanics & Device Transfers

Let's practice creating tensors, testing device placement, and bridging with NumPy:

```python
import torch
import numpy as np

# 1. Creating multi-dimensional tensors
A = torch.tensor([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]], dtype=torch.float32)
print("Tensor A shape:", A.shape)
print("Tensor A dtype:", A.dtype)
print("Tensor A device:", A.device)

# 2. Pre-allocating zero buffers
Z = torch.zeros((2, 3), dtype=torch.float32)
print("Zero buffer:\n", Z)

# 3. Matrix Multiplication
B = torch.tensor([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]], dtype=torch.float32)
# (2 x 3) @ (3 x 2) -> (2 x 2)
C = torch.matmul(A, B)
print("Matrix product A @ B:\n", C)
print("Product shape:", C.shape)

# 4. Zero-copy NumPy Bridge
np_data = np.ones((3,), dtype=np.float32)
t_bridge = torch.from_numpy(np_data)
print("Memory shared?", np.shares_memory(np_data, t_bridge.numpy()))

# Mutating NumPy array directly affects the PyTorch tensor
np_data[1] = 42.0
print("Updated tensor through NumPy mutation:", t_bridge)

# 5. Device placement
target_dev = "cuda" if torch.cuda.is_available() else "cpu"
device = torch.device(target_dev)
t_dev = t_bridge.to(device)
print(f"Tensor successfully transferred to: {t_dev.device}")
```
"""

# -----------------------------------------------------------------------------
# Challenge 1: Multi-Dimensional Tensor Initializer
# -----------------------------------------------------------------------------

CHALLENGE_1 = {
    "id": "torch-p1-c1",
    "title": "Multi-Dimensional Tensor Initializer",
    "difficulty": "Beginner",
    "category": "Tensor Foundations",
    "description": (
        "Construct typed 2D PyTorch tensors from nested Python lists, validate dimensional "
        "compatibility for linear algebra, and execute matrix multiplication with torch.matmul."
    ),
    "instructions": (
        "Write a function `init_tensor_matrices(matrix_a: list, matrix_b: list, zeros_shape: tuple = (2, 2)) -> dict` that:\n"
        "1. Converts `matrix_a` to a PyTorch tensor with `dtype=torch.float32`.\n"
        "2. Converts `matrix_b` to a PyTorch tensor with `dtype=torch.float32`.\n"
        "3. Validates that both tensors are 2-dimensional. If either `tensor_a.ndim != 2` or `tensor_b.ndim != 2`, "
        "raise `ValueError(\"Inputs must be 2D matrices\")`.\n"
        "4. Validates that the inner dimensions match for matrix multiplication (`tensor_a.shape[1] == tensor_b.shape[0]`). "
        "If not, raise `ValueError(\"Incompatible shapes for matmul\")`.\n"
        "5. Computes the matrix multiplication product using `torch.matmul(tensor_a, tensor_b)`.\n"
        "6. Allocates an all-zeros tensor named `zeros_tensor` with the specified `zeros_shape` and `dtype=torch.float32`.\n"
        "7. Returns a dictionary containing:\n"
        "   `{\"tensor_a\": tensor_a, \"tensor_b\": tensor_b, \"product\": product, \"zeros_tensor\": zeros_tensor, \"shape_product\": tuple(product.shape)}`"
    ),
    "starter_code": r'''import torch

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
    # TODO: Implement tensor initialization, validation, matmul, and zeros buffer
    pass
''',
    "reference_solution": r'''import torch

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
''',
    "test_suite": r'''import torch

def run_tests(candidate_func=None):
    """Automated test harness for Multi-Dimensional Tensor Initializer (torch-p1-c1)."""
    if candidate_func is None:
        candidate_func = globals().get("init_tensor_matrices")
    report = {"passed": True, "tests_run": 0, "errors": []}

    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Test 1: Standard (2x3) @ (3x2) matrix multiplication
    mA = [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]]
    mB = [[7.0, 8.0], [9.0, 1.0], [2.0, 3.0]]
    res = candidate_func(mA, mB, zeros_shape=(3, 3))
    
    assert_test(isinstance(res, dict), "Output must be a dictionary")
    expected_keys = {"tensor_a", "tensor_b", "product", "zeros_tensor", "shape_product"}
    assert_test(expected_keys.issubset(res.keys()), f"Missing keys: {expected_keys - set(res.keys())}")
    
    tA, tB, prod, zeros, s_prod = res["tensor_a"], res["tensor_b"], res["product"], res["zeros_tensor"], res["shape_product"]
    assert_test(isinstance(tA, torch.Tensor) and tA.dtype == torch.float32, "tensor_a must be a float32 torch.Tensor")
    assert_test(isinstance(tB, torch.Tensor) and tB.dtype == torch.float32, "tensor_b must be a float32 torch.Tensor")
    assert_test(isinstance(prod, torch.Tensor) and prod.dtype == torch.float32, "product must be a float32 torch.Tensor")
    assert_test(s_prod == (2, 2), f"Product shape must be (2, 2), got {s_prod}")
    
    # Expected: [[1*7 + 2*9 + 3*2, 1*8 + 2*1 + 3*3], [4*7 + 5*9 + 6*2, 4*8 + 5*1 + 6*3]]
    # = [[7 + 18 + 6, 8 + 2 + 9], [28 + 45 + 12, 32 + 5 + 18]] = [[31, 19], [85, 55]]
    expected_prod = torch.tensor([[31.0, 19.0], [85.0, 55.0]], dtype=torch.float32)
    assert_test(torch.allclose(prod, expected_prod), f"Product values incorrect: got {prod}, expected {expected_prod}")
    
    assert_test(zeros.shape == (3, 3), f"zeros_tensor shape must be (3, 3), got {zeros.shape}")
    assert_test(torch.all(zeros == 0.0), "zeros_tensor must be filled entirely with 0.0")

    # Test 2: Incompatible matrix dimensions raise ValueError
    try:
        incompatible_B = [[1.0, 2.0], [3.0, 4.0]]  # (2x2) incompatible with A (2x3)
        candidate_func(mA, incompatible_B)
        assert_test(False, "Expected ValueError for incompatible matrix dimensions")
    except ValueError:
        report["tests_run"] += 1

    # Test 3: Non-2D inputs raise ValueError
    try:
        candidate_func([1.0, 2.0], [3.0, 4.0])
        assert_test(False, "Expected ValueError for 1D inputs")
    except ValueError:
        report["tests_run"] += 1

    return report
''',
    "hints": [
        "Use torch.tensor(matrix_a, dtype=torch.float32) to initialize tensors.",
        "Check tensor.ndim == 2 to verify 2-dimensional matrix structure.",
        "Matrix multiplication requires tensor_a.shape[1] == tensor_b.shape[0].",
        "Perform multiplication using torch.matmul(tensor_a, tensor_b) or tensor_a @ tensor_b."
    ]
}

# -----------------------------------------------------------------------------
# Challenge 2: NumPy to Tensor Bridge & Device Handler
# -----------------------------------------------------------------------------

CHALLENGE_2 = {
    "id": "torch-p1-c2",
    "title": "NumPy to Tensor Bridge & Device Handler",
    "difficulty": "Beginner",
    "category": "Tensor Foundations",
    "description": (
        "Bridge NumPy arrays and PyTorch tensors with zero-copy memory sharing, verify "
        "in-place memory synchronization, and handle target device placement safely."
    ),
    "instructions": (
        "Write a function `bridge_numpy_to_tensor(np_arr: np.ndarray, target_device: str = \"cpu\") -> dict` that:\n"
        "1. Validates that `np_arr` is an instance of `np.ndarray`. If not, raise `TypeError(\"Input must be a numpy.ndarray\")`.\n"
        "2. Converts `np_arr` to a PyTorch tensor named `tensor` using `torch.from_numpy(np_arr)` (zero-copy memory sharing).\n"
        "3. Verifies zero-copy memory sharing by checking `np.shares_memory(np_arr, tensor.numpy())` and stores boolean `shares_memory`.\n"
        "4. Safely resolves `target_device`: If `target_device.startswith(\"cuda\")` and `not torch.cuda.is_available()`, "
        "fallback to `\"cpu\"`. Create a device object `device = torch.device(resolved_device)`.\n"
        "5. Transfers the tensor to the resolved device: `device_tensor = tensor.to(device)`.\n"
        "6. Creates an independent, cloned tensor `cloned_tensor = tensor.clone()` that does not share memory with `np_arr`.\n"
        "7. Returns a dictionary containing:\n"
        "   `{\"tensor\": tensor, \"device_tensor\": device_tensor, \"cloned_tensor\": cloned_tensor, \"shares_memory\": shares_memory, \"device\": str(device_tensor.device)}`"
    ),
    "starter_code": r'''import numpy as np
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
''',
    "reference_solution": r'''import numpy as np
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
''',
    "test_suite": r'''import numpy as np
import torch

def run_tests(candidate_func=None):
    """Automated test harness for NumPy Bridge & Device Handler (torch-p1-c2)."""
    if candidate_func is None:
        candidate_func = globals().get("bridge_numpy_to_tensor")
    report = {"passed": True, "tests_run": 0, "errors": []}

    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Test 1: Standard conversion and zero-copy memory verification
    arr = np.array([10.0, 20.0, 30.0], dtype=np.float32)
    res = candidate_func(arr, target_device="cpu")
    
    assert_test(isinstance(res, dict), "Result must be a dictionary")
    expected_keys = {"tensor", "device_tensor", "cloned_tensor", "shares_memory", "device"}
    assert_test(expected_keys.issubset(res.keys()), f"Missing keys: {expected_keys - set(res.keys())}")
    
    assert_test(isinstance(res["tensor"], torch.Tensor), "tensor must be a torch.Tensor")
    assert_test(res["shares_memory"] is True, "shares_memory must be True for torch.from_numpy")
    assert_test(res["device"] == "cpu", f"Device string should be 'cpu', got {res['device']}")
    
    # Test zero-copy mutation: modifying arr modifies res['tensor']
    orig_val = arr[0]
    arr[0] = 999.0
    assert_test(float(res["tensor"][0]) == 999.0, "Mutating numpy array must reflect in bridged tensor (zero-copy)")
    # But cloned_tensor must NOT have mutated
    assert_test(float(res["cloned_tensor"][0]) == orig_val, "Cloned tensor must be independent of original array")
    arr[0] = orig_val  # restore

    # Test 2: Safe device fallback when CUDA is requested
    res_cuda = candidate_func(arr, target_device="cuda")
    if torch.cuda.is_available():
        assert_test("cuda" in res_cuda["device"], "Expected CUDA device when CUDA is available")
    else:
        assert_test(res_cuda["device"] == "cpu", "Expected fallback to 'cpu' when CUDA is unavailable")

    # Test 3: Type validation
    try:
        candidate_func([1.0, 2.0, 3.0])
        assert_test(False, "Expected TypeError when passing standard Python list instead of ndarray")
    except TypeError:
        report["tests_run"] += 1

    return report
''',
    "hints": [
        "Check isinstance(np_arr, np.ndarray) to enforce NumPy input.",
        "Use torch.from_numpy(np_arr) for zero-copy tensor creation.",
        "Use np.shares_memory(np_arr, tensor.numpy()) to confirm memory sharing.",
        "Check torch.cuda.is_available() before targeting CUDA devices."
    ]
}

CHALLENGES = [CHALLENGE_1, CHALLENGE_2]

CURRICULUM_DATA = {
    **DAY_METADATA,
    "concept_primer": CONCEPT_PRIMER,
    "walkthrough": WALKTHROUGH,
    "challenges": CHALLENGES
}

def get_curriculum() -> Dict[str, Any]:
    return CURRICULUM_DATA
