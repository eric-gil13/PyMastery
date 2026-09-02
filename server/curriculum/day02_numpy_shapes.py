"""
Part 2: Shapes, Dimensions & Vectors
PyMastery Progressive NumPy Curriculum
"""

import numpy as np
from typing import Dict, Any, List

DAY_METADATA = {
    "day_id": "day02",
    "day_number": 2,
    "title": "Part 2: Shapes, Dimensions & Vectors",
    "tagline": "Master 1D vectors, 2D matrices, 3D tensors, and flexible shape transformations.",
    "estimated_time": "1-2 hours",
    "concepts_covered": [
        "1D vectors vs 2D matrices",
        "3D multi-channel tensors",
        ".shape, .ndim, .size inspection",
        ".reshape() with -1 auto-inference",
        ".flatten() restoration"
    ]
}

CONCEPT_PRIMER = r"""# Part 2 Concept Primer: Shapes, Dimensions & Vectors

## 1. What is Dimension in NumPy?
In mathematics and computing, "dimension" has two distinct meanings that often confuse beginners:
1. **The length of a list:** A 3D coordinate like `[x, y, z]` has 3 numbers.
2. **The number of axes of an array:** In NumPy, `ndim` refers to the **number of axes** (indexes needed to find a number).

Let's look at the three primary tiers of arrays in NumPy:

### 1D Array (Vector) — `shape: (N,)`
* **Axes (`ndim`):** 1 axis.
* **Indexed by:** A single integer: `arr[i]`.
* Represents a simple sequence of values (e.g. sensor readings over time, a list of weights).
* Note the trailing comma in `(5,)`: this tells Python it's a 1-element tuple, meaning 1 dimension!

### 2D Array (Matrix) — `shape: (Rows, Columns)`
* **Axes (`ndim`):** 2 axes (Row axis 0, Column axis 1).
* **Indexed by:** Two integers: `arr[row, col]`.
* Represents a grid, spreadsheet table, coordinate matrix, or grayscale image.

### 3D Array (Tensor) — `shape: (Channels, Height, Width)`
* **Axes (`ndim`):** 3 axes.
* **Indexed by:** Three integers: `arr[channel, row, col]`.
* Represents a stack of 2D matrices. For example, a color digital photo has 3 channels: Red, Green, and Blue.

```
1D Vector (shape: (4,)):
[ 10 | 20 | 30 | 40 ]

2D Matrix (shape: (2, 4)):
[[ 10, 20, 30, 40 ],
 [ 50, 60, 70, 80 ]]

3D Tensor (shape: (2, 2, 4)):
Two stacked (2, 4) matrix pages!
```

---

## 2. Inspecting Any Array: `.shape`, `.ndim`, and `.size`
When inspecting arrays, three properties tell you everything about their geometry:

```python
grid = np.zeros((3, 5))

print(grid.shape)  # (3, 5)   -> 3 rows and 5 columns
print(grid.ndim)   # 2        -> 2 dimensions / axes
print(grid.size)   # 15       -> 3 * 5 = 15 total numbers
```

> **The Golden Rule of Reshaping:**
> Whenever you reshape an array, the **total number of elements (`size`) must remain identical**. You can reshape 12 numbers into `(3, 4)`, `(6, 2)`, `(2, 6)`, `(12, 1)`, or `(2, 2, 3)`. You cannot reshape 12 numbers into `(5, 5)` because $5 \times 5 = 25 \neq 12$.

---

## 3. Reshaping and the Magic of `-1`
Typing out row and column counts manually can be tedious, especially when the total number of items changes dynamically. NumPy provides the `-1` auto-inference trick:

```python
stream = np.arange(24)

# "Reshape to 6 columns, and figure out the rows for me!"
grid = stream.reshape(-1, 6)
print(grid.shape)  # (4, 6) -> NumPy automatically inferred 24 / 6 = 4 rows!

# "Reshape to 2 channels, 3 rows, and figure out the width!"
tensor = stream.reshape(2, 3, -1)
print(tensor.shape)  # (2, 3, 4) -> 24 / (2 * 3) = 4 width!
```

### Key Rules for `-1`:
1. You can use `-1` for **at most one** dimension in a reshape call.
2. The total element count must divide evenly by the product of all other specified dimensions.

---

## 4. Flattening: Going Back to 1D
After performing multi-dimensional operations (like processing image patches or matrix convolutions), you often need to collapse everything back into a single flat stream:

* **`.flatten()`**: Returns a clean, flat 1D copy of the array.
* Order: Elements are unrolled row by row (C-order by default).

```python
matrix = np.array([[1, 2, 3], [4, 5, 6]])
flat = matrix.flatten()
print(flat)        # array([1, 2, 3, 4, 5, 6])
print(flat.shape)  # (6,)
```
"""

WALKTHROUGH = r"""# Part 2 Code Walkthrough: Working with Dimensions

Let's test reshaping, shape inference, and tensor slicing:

```python
import numpy as np

# 1. Start with a flat 1D stream of 12 values
raw_stream = np.arange(12)
print("Raw stream:", raw_stream)
print("Stream shape:", raw_stream.shape, "ndim:", raw_stream.ndim, "size:", raw_stream.size)

# 2. Reshape into 2D grid with -1 inference
grid = raw_stream.reshape(-1, 4)
print("\nReshaped 2D Grid (rows inferred with -1, 4 cols):")
print(grid)
print("Grid shape:", grid.shape)

# 3. Flatten back to 1D
recovered = grid.flatten()
print("\nRecovered flat 1D stream:", recovered)
print("Does it match raw stream?", np.array_equal(raw_stream, recovered))

# 4. Building a 3D Multi-Channel Tensor
# Suppose we have 2 sensor channels of a 2x3 grid
tensor_3d = raw_stream.reshape(2, 2, 3)
print("\n3D Multi-Channel Tensor shape:", tensor_3d.shape)
print("Channel 0:")
print(tensor_3d[0])
print("Channel 1:")
print(tensor_3d[1])

# 5. Calculating average values per channel
ch0_mean = np.mean(tensor_3d[0])
ch1_mean = np.mean(tensor_3d[1])
print(f"Channel 0 mean: {ch0_mean}, Channel 1 mean: {ch1_mean}")
```
"""

# -----------------------------------------------------------------------------
# Challenge 1: Image / Grid Reshaper
# -----------------------------------------------------------------------------

CHALLENGE_1 = {
    "id": "d2-c1",
    "title": "Image / Grid Reshaper",
    "difficulty": "Beginner",
    "category": "Shapes & Reshaping",
    "description": (
        "Transform flat 1D data streams into 2D matrices by automatically inferring dimensions and unfolding them back. "
        "Learn to validate dimensions, inspect .shape and .ndim, infer row counts dynamically, "
        "and restore flat sequences."
    ),
    "instructions": (
        "Write a function `reshape_stream_to_grid(stream: np.ndarray, num_cols: int) -> dict` that:\n"
        "1. Validates the inputs:\n"
        "   - If `stream.ndim != 1`, raise `ValueError(\"Input stream must be a 1D array\")`.\n"
        "   - If `num_cols <= 0`, raise `ValueError(\"num_cols must be positive\")`.\n"
        "   - If `stream.size % num_cols != 0`, raise `ValueError(f\"Stream of size {stream.size} cannot be reshaped into {num_cols} columns\")`.\n"
        "2. Reshapes `stream` into a 2D matrix named `\"grid\"` with `num_cols` columns, automatically inferring the row count.\n"
        "3. Flattens `grid` back into a 1D array named `\"recovered_flat\"`, unfolded into a flat 1D sequence.\n"
        "4. Returns a dictionary with:\n"
        "   `{\"original_shape\": stream.shape, \"original_ndim\": int(stream.ndim), \"grid\": grid, \"grid_shape\": grid.shape, \"grid_rows\": int(grid.shape[0]), \"grid_cols\": int(grid.shape[1]), \"recovered_flat\": recovered_flat}`"
    ),
    "starter_code": r'''import numpy as np

def reshape_stream_to_grid(stream: np.ndarray, num_cols: int) -> dict:
    """
    Reshape a flat 1D stream into a 2D grid matrix with inferred row count.
    
    Args:
        stream: 1D numpy array
        num_cols: Desired number of columns in the 2D grid
        
    Returns:
        Dictionary containing metadata, reshaped grid, and recovered 1D array
    """
    # TODO: Validate inputs, reshape to a 2D grid with inferred row count, flatten back to 1D, and return dict
    pass
''',
    "reference_solution": r'''import numpy as np

def reshape_stream_to_grid(stream: np.ndarray, num_cols: int) -> dict:
    """
    Reshape a 1D array into a 2D grid with -1 auto-inferred row count and flatten back.
    """
    if stream.ndim != 1:
        raise ValueError("Input stream must be a 1D array")
    if num_cols <= 0:
        raise ValueError("num_cols must be positive")
    if stream.size % num_cols != 0:
        raise ValueError(f"Stream of size {stream.size} cannot be reshaped into {num_cols} columns")
        
    grid = stream.reshape(-1, num_cols)
    recovered = grid.flatten()
    
    return {
        "original_shape": stream.shape,
        "original_ndim": int(stream.ndim),
        "grid": grid,
        "grid_shape": grid.shape,
        "grid_rows": int(grid.shape[0]),
        "grid_cols": int(grid.shape[1]),
        "recovered_flat": recovered,
    }
''',
    "test_suite": r'''import numpy as np

def run_tests(candidate_func):
    """
    Automated test harness for Image / Grid Reshaper (d2-c1).
    """
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Test 1: Standard 12 elements into 4 columns
    stream_12 = np.arange(12)
    res = candidate_func(stream_12, 4)
    assert_test(isinstance(res, dict), "Result must be a dictionary")
    expected_keys = {"original_shape", "original_ndim", "grid", "grid_shape", "grid_rows", "grid_cols", "recovered_flat"}
    assert_test(expected_keys.issubset(res.keys()), f"Missing expected keys: {expected_keys - set(res.keys())}")
    assert_test(res["grid_shape"] == (3, 4), f"Expected grid_shape (3, 4), got {res.get('grid_shape')}")
    assert_test(res["grid_rows"] == 3, f"Expected 3 rows, got {res.get('grid_rows')}")
    assert_test(res["grid_cols"] == 4, f"Expected 4 cols, got {res.get('grid_cols')}")
    assert_test(res["original_ndim"] == 1, "original_ndim should be 1")
    assert_test(isinstance(res["grid"], np.ndarray), "grid must be an ndarray")
    assert_test(res["grid"].ndim == 2, "grid must be a 2D array")
    assert_test(np.array_equal(res["recovered_flat"], stream_12), "recovered_flat must match original stream")

    # Test 2: 20 floats into 5 columns
    stream_float = np.linspace(0.0, 100.0, 20)
    res2 = candidate_func(stream_float, 5)
    assert_test(res2["grid_shape"] == (4, 5), f"Expected grid_shape (4, 5), got {res2.get('grid_shape')}")
    assert_test(res2["grid_rows"] == 4, "grid_rows mismatch")
    assert_test(np.allclose(res2["recovered_flat"], stream_float), "recovered_flat values mismatch for floats")

    # Test 3: Validation on non-1D array
    raised_ndim = False
    try:
        candidate_func(np.zeros((3, 3)), 3)
    except ValueError:
        raised_ndim = True
    assert_test(raised_ndim, "Expected ValueError when stream.ndim != 1")

    # Test 4: Validation on non-divisible size
    raised_div = False
    try:
        candidate_func(np.arange(10), 3)
    except ValueError:
        raised_div = True
    assert_test(raised_div, "Expected ValueError when size % num_cols != 0")

    # Test 5: Validation on invalid num_cols <= 0
    raised_cols = False
    try:
        candidate_func(np.arange(10), 0)
    except ValueError:
        raised_cols = True
    assert_test(raised_cols, "Expected ValueError when num_cols <= 0")

    return report
''',
    "hints": [
        "Check stream.ndim == 1 before reshaping.",
        "Check stream.size % num_cols == 0 to ensure clean division.",
        "Use stream.reshape(-1, num_cols) to let NumPy auto-calculate rows.",
        "Use grid.flatten() to get a flat 1D array back."
    ]
}

# -----------------------------------------------------------------------------
# Challenge 2: Multi-Channel Tensor Formatter
# -----------------------------------------------------------------------------

CHALLENGE_2 = {
    "id": "d2-c2",
    "title": "Multi-Channel Tensor Formatter",
    "difficulty": "Intermediate",
    "category": "Tensor Dimensions",
    "description": (
        "Organize flat data streams into 3D multi-channel tensors (Channels, Height, Width) and inspect slices. "
        "Learn how 3D tensors stack 2D matrices, extract single-channel 2D slices, and compute channel statistics."
    ),
    "instructions": (
        "Write a function `format_multichannel_tensor(raw_stream: np.ndarray, num_channels: int, height: int, width: int = -1) -> dict` that:\n"
        "1. Normalizes input: If `raw_stream` has more than 1 dimension, flatten it first into a 1D array named `raw`; otherwise `raw = raw_stream`.\n"
        "2. Validates parameters:\n"
        "   - If `num_channels <= 0` or `height <= 0`, raise `ValueError(\"Channels and height must be positive integers\")`.\n"
        "   - If `width == -1`: verify that `raw.size % (num_channels * height) == 0`. If not, raise `ValueError(f\"Data of size {raw.size} cannot be divided into {num_channels} channels of height {height}\")`.\n"
        "   - If `width > 0`: verify that `raw.size == num_channels * height * width`. If not, raise `ValueError(f\"Expected {num_channels * height * width} elements, but got {raw.size}\")`.\n"
        "   - If `width <= 0` and `width != -1`: raise `ValueError(\"width must be positive or -1\")`.\n"
        "3. Reshapes `raw` into a 3D tensor of shape `(num_channels, height, inferred_or_given_width)`.\n"
        "4. Extracts the 2D slice for channel 0 named `\"channel_0\"` (shape `(height, width)`).\n"
        "5. Computes `channel_means` as a list of float values representing the mean of each channel across all its elements.\n"
        "6. Returns a dictionary with:\n"
        "   `{\"tensor\": tensor, \"shape\": tensor.shape, \"ndim\": int(tensor.ndim), \"size\": int(tensor.size), \"channel_0\": channel_0, \"channel_means\": channel_means}`"
    ),
    "starter_code": r'''import numpy as np

def format_multichannel_tensor(raw_stream: np.ndarray, num_channels: int, height: int, width: int = -1) -> dict:
    """
    Format a data stream into a 3D multi-channel tensor (Channels, Height, Width).
    
    Args:
        raw_stream: 1D (or multi-D) numpy array
        num_channels: Number of channels/modalities (C)
        height: Spatial height / rows per channel (H)
        width: Spatial width / columns per channel (W). Inferred if -1.
        
    Returns:
        Dictionary with tensor, shape, ndim, size, channel_0, and channel_means
    """
    # TODO: Validate dimensions, reshape to 3D tensor, extract channel 0, and return dict
    pass
''',
    "reference_solution": r'''import numpy as np

def format_multichannel_tensor(raw_stream: np.ndarray, num_channels: int, height: int, width: int = -1) -> dict:
    """
    Format flat data into a 3D multi-channel tensor (Channels, Height, Width).
    """
    raw = raw_stream.flatten() if raw_stream.ndim > 1 else raw_stream
    
    if num_channels <= 0 or height <= 0:
        raise ValueError("Channels and height must be positive integers")
        
    if width == -1:
        if raw.size % (num_channels * height) != 0:
            raise ValueError(f"Data of size {raw.size} cannot be divided into {num_channels} channels of height {height}")
        tensor = raw.reshape(num_channels, height, -1)
    else:
        if width <= 0:
            raise ValueError("width must be positive or -1")
        if raw.size != num_channels * height * width:
            raise ValueError(f"Expected {num_channels * height * width} elements, but got {raw.size}")
        tensor = raw.reshape(num_channels, height, width)
        
    channel_0 = tensor[0, :, :]
    channel_means = [float(np.mean(tensor[c])) for c in range(num_channels)]
    
    return {
        "tensor": tensor,
        "shape": tensor.shape,
        "ndim": int(tensor.ndim),
        "size": int(tensor.size),
        "channel_0": channel_0,
        "channel_means": channel_means,
    }
''',
    "test_suite": r'''import numpy as np

def run_tests(candidate_func):
    """
    Automated test harness for Multi-Channel Tensor Formatter (d2-c2).
    """
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Test 1: Inferred width (-1)
    raw = np.arange(24)
    res = candidate_func(raw, 2, 3, -1)
    assert_test(isinstance(res, dict), "Result must be a dictionary")
    expected_keys = {"tensor", "shape", "ndim", "size", "channel_0", "channel_means"}
    assert_test(expected_keys.issubset(res.keys()), f"Missing expected keys: {expected_keys - set(res.keys())}")
    assert_test(res["shape"] == (2, 3, 4), f"Expected shape (2, 3, 4), got {res.get('shape')}")
    assert_test(res["ndim"] == 3, f"ndim must be 3, got {res.get('ndim')}")
    assert_test(res["size"] == 24, f"size must be 24, got {res.get('size')}")
    assert_test(res["channel_0"].shape == (3, 4), f"channel_0 shape mismatch: expected (3, 4), got {res['channel_0'].shape}")
    assert_test(np.array_equal(res["channel_0"], raw[:12].reshape(3, 4)), "channel_0 values mismatch")
    assert_test(np.allclose(res["channel_means"], [5.5, 17.5]), f"channel_means mismatch: got {res.get('channel_means')}")

    # Test 2: Explicit width
    raw30 = np.arange(30)
    res2 = candidate_func(raw30, 3, 2, 5)
    assert_test(res2["shape"] == (3, 2, 5), f"Expected shape (3, 2, 5), got {res2.get('shape')}")
    assert_test(len(res2["channel_means"]) == 3, "Expected 3 channel means")

    # Test 3: Multi-dimensional input flattened automatically
    raw_2d = np.arange(24).reshape(4, 6)
    res3 = candidate_func(raw_2d, 2, 3, 4)
    assert_test(res3["shape"] == (2, 3, 4), "Flattening 2D input into 3D tensor failed")

    # Test 4: Validation on non-divisible size with -1
    raised_div = False
    try:
        candidate_func(np.arange(25), 2, 3, -1)
    except ValueError:
        raised_div = True
    assert_test(raised_div, "Expected ValueError when size % (channels * height) != 0")

    # Test 5: Validation on mismatched explicit width
    raised_exp = False
    try:
        candidate_func(np.arange(24), 3, 3, 3)
    except ValueError:
        raised_exp = True
    assert_test(raised_exp, "Expected ValueError when size != channels * height * width")

    # Test 6: Validation on non-positive channels
    raised_ch = False
    try:
        candidate_func(np.arange(24), 0, 3)
    except ValueError:
        raised_ch = True
    assert_test(raised_ch, "Expected ValueError when num_channels <= 0")

    return report
''',
    "hints": [
        "Use raw.flatten() if raw.ndim > 1.",
        "Use raw.reshape(num_channels, height, -1) when width is -1.",
        "tensor[0] or tensor[0, :, :] extracts the 2D slice for the first channel.",
        "Use float(np.mean(tensor[c])) to calculate average values per channel."
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
