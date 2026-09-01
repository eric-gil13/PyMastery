"""
Day 3: Indexing, Slicing & Views
PyMastery Progressive NumPy Curriculum
"""

import numpy as np
import time
from typing import Dict, Any, List

DAY_METADATA = {
    "day_id": "day03",
    "day_number": 3,
    "title": "Day 3: Indexing, Slicing & Views",
    "tagline": "Master 1D & 2D slicing, row/column extraction, stepping strides, and memory views vs copies.",
    "estimated_time": "2-3 hours",
    "concepts_covered": [
        "1D indexing & negative indices (arr[0], arr[-1])",
        "2D grid coordinate indexing (arr[row, col])",
        "Full row & column extraction (arr[r, :], arr[:, c])",
        "Sub-matrix region slicing (arr[r_start:r_end, c_start:c_end])",
        "Stride stepping & decimation (arr[::2], arr[::-1])",
        "Memory views vs independent copies (arr.copy(), np.shares_memory)"
    ]
}

CONCEPT_PRIMER = r"""# Day 3 Concept Primer: Indexing, Slicing & Views in NumPy

Welcome to Day 3! Today, we demystify how to navigate and extract data from NumPy arrays. Whether you are extracting a patch of an image, selecting a specific column from a dataset, or downsampling sensor readings, indexing and slicing are your everyday tools.

---

## 1. Navigating 1D Arrays: Think of a Train of Boxes

In standard Python and NumPy, arrays are 0-indexed. Imagine a train of cargo boxes:

```
Index:       0      1      2      3      4
          +------+------+------+------+------+
Values:   |  10  |  20  |  30  |  40  |  50  |
          +------+------+------+------+------+
Negative:   -5     -4     -3     -2     -1
```

* `arr[0]` grabs the very first element (`10`).
* `arr[-1]` grabs the very last element (`50`), wrapping around from the right!
* Negative indices make it effortless to grab elements from the tail without calculating `len(arr) - 1`.

---

## 2. Navigating 2D Arrays: The Spreadsheet Grid

A 2D NumPy array is like a spreadsheet or a digital photo made of pixels:
**Always remember: Row comes first, Column comes second! `arr[row, col]`**

```
                  Col 0    Col 1    Col 2    Col 3
               +--------+--------+--------+--------+
Row 0:         |   11   |   12   |   13   |   14   |
               +--------+--------+--------+--------+
Row 1:         |   21   |   22   |   23   |   24   |
               +--------+--------+--------+--------+
Row 2:         |   31   |   32   |   33   |   34   |
               +--------+--------+--------+--------+
```

* Single cell: `arr[1, 2]` gives `23` (Row 1, Column 2).
* Top-left corner: `arr[0, 0]` gives `11`.
* Bottom-right corner: `arr[-1, -1]` gives `34`.

> **Beginner Tip:** In plain Python lists, you would write `matrix[1][2]`. In NumPy, always write `matrix[1, 2]`. It is faster, more concise, and avoids creating temporary list wrappers!

---

## 3. Slicing: The Transparent Window Frame

Slicing lets you extract a portion of an array using the syntax:
`start:stop:step`

* `start`: Index where the slice begins (inclusive). If omitted, defaults to `0`.
* `stop`: Index where the slice ends (**exclusive**—stops just before this index).
* `step`: How many elements to jump forward (defaults to `1`).

### Extracting Entire Rows and Columns with the Colon `:`
A lone colon `:` means "give me everything along this axis":

* **Entire Row `r`:** `arr[r, :]`
  * Example: `arr[0, :]` -> `[11, 12, 13, 14]`
* **Entire Column `c`:** `arr[:, c]`
  * Example: `arr[:, 1]` -> `[12, 22, 32]`

### 2D Sub-matrix Bounding Boxes
You can slice rows and columns simultaneously:
`subgrid = arr[0:2, 1:3]`
This extracts rows 0 through 1, and columns 1 through 2:
```
[[12, 13],
 [22, 23]]
```

### Stride Stepping & Decimation
* `arr[::2]`: Grabs every 2nd element (`0, 2, 4, ...`). Perfect for downsampling audio or sensor data.
* `arr[1::2]`: Grabs alternating elements starting from index 1 (`1, 3, 5, ...`).
* `arr[::-1]`: Reverses the array! A negative step walks backwards from tail to head.

---

## 4. The Golden Rule: Views vs. Copies

This is one of NumPy's greatest superpowers, but also the most common source of bugs:

> **Basic slicing in NumPy returns a VIEW, NOT a copy!**

When you create a slice like `sub = arr[1:4]`:
* NumPy does **NOT** allocate new memory or duplicate numbers.
* Instead, it creates a lightweight "viewing window" looking directly into the original array's memory.
* **If you modify elements in `sub`, the original array `arr` WILL CHANGE TOO!**

```python
original = np.array([10, 20, 30, 40, 50])
view_slice = original[1:4]   # [20, 30, 40]
view_slice[0] = 999          # Modify the view!

print(original)
# Output: [ 10, 999,  30,  40,  50]  <-- Original was modified!
```

### When You Need an Independent Canvas: Use `.copy()`
If you want to edit your slice safely without touching the original data, make an explicit copy:

```python
safe_copy = original[1:4].copy()
safe_copy[0] = 42

print(original[1])  # Still 999! Original is untouched!
```

You can check if two arrays share memory using `np.shares_memory(a, b)`:
* `np.shares_memory(original, view_slice)` -> `True`
* `np.shares_memory(original, safe_copy)` -> `False`
"""

WALKTHROUGH = r"""# Day 3 Walkthrough: Hands-On Slicing & Views Playground

Let's explore 2D slicing, row/column extraction, and verify view memory sharing in code:

```python
import numpy as np

# 1. Create a 5x5 grid of integers 0 to 24
grid = np.arange(25).reshape(5, 5)
print("Original 5x5 Grid:\n", grid)

# 2. Extract a 3x3 subgrid from rows 1..3 and cols 2..4
# Remember: stop index 4 is exclusive, so rows 1, 2, 3 and cols 2, 3, 4
crop = grid[1:4, 2:5]
print("\nCropped 3x3 Region:\n", crop)

# 3. Extract the top row and last column of the cropped region
top_row = crop[0, :]
last_col = crop[:, -1]
print("\nTop row of crop:", top_row)
print("Last column of crop:", last_col)

# 4. Prove that 'crop' is a VIEW sharing memory with 'grid'
print("\nDoes crop share memory with grid?", np.shares_memory(grid, crop))  # True

# Modify crop and observe grid change
crop[0, 0] = 777
print("After crop[0,0] = 777, grid[1, 2] is:", grid[1, 2])  # 777!

# 5. Stride Stepping: Downsample every 2nd row and column
decimated_view = grid[::2, ::2]
print("\nDecimated 3x3 (every 2nd item):\n", decimated_view)

# 6. Create an isolated independent copy
safe_isolated = decimated_view.copy()
safe_isolated[0, 0] = -1
print("Does isolated copy share memory with grid?", np.shares_memory(grid, safe_isolated))  # False
print("grid[0, 0] remains untouched:", grid[0, 0])  # 0
```
"""

# -----------------------------------------------------------------------------
# Challenge 1: Sub-Grid Bounding Box Cropper
# -----------------------------------------------------------------------------

CHALLENGE_1 = {
    "id": "d3-c1",
    "title": "Sub-Grid Bounding Box Cropper",
    "difficulty": "Beginner",
    "category": "Indexing & Slicing",
    "description": (
        "In image processing and computer vision, bounding boxes isolate regions of interest (like faces or objects). "
        "Your task is to write a function `crop_bounding_box` that extracts a rectangular subgrid specified by row and "
        "column coordinate bounds from a 2D matrix, along with its 4 perimeter boundaries (top row, bottom row, left column, "
        "and right column), strictly using clean NumPy 2D slicing syntax without any loops."
    ),
    "instructions": (
        "1. Implement `crop_bounding_box(grid: np.ndarray, row_start: int, row_end: int, col_start: int, col_end: int) -> dict`.\n"
        "2. `grid` is a 2D NumPy array of shape (H, W).\n"
        "3. Slice the subgrid using `grid[row_start:row_end, col_start:col_end]`.\n"
        "4. Extract the boundaries of the cropped subgrid:\n"
        "   - `'top_row'`: the 1D first row of the crop (`crop[0, :]`)\n"
        "   - `'bottom_row'`: the 1D last row of the crop (`crop[-1, :]`)\n"
        "   - `'left_col'`: the 1D first column of the crop (`crop[:, 0]`)\n"
        "   - `'right_col'`: the 1D last column of the crop (`crop[:, -1]`)\n"
        "5. Return a dictionary with keys `'cropped'`, `'top_row'`, `'bottom_row'`, `'left_col'`, and `'right_col'`.\n"
        "6. Do not copy the arrays; return zero-copy views directly from slicing."
    ),
    "starter_code": r'''import numpy as np

def crop_bounding_box(
    grid: np.ndarray,
    row_start: int,
    row_end: int,
    col_start: int,
    col_end: int
) -> dict:
    """
    Extract a rectangular bounding-box subgrid from a 2D array along with its boundary rows and columns.
    
    Args:
        grid: 2D numpy array of shape (H, W)
        row_start: starting row index (inclusive)
        row_end: ending row index (exclusive)
        col_start: starting col index (inclusive)
        col_end: ending col index (exclusive)
        
    Returns:
        dict containing:
            'cropped': 2D subgrid view of shape (row_end - row_start, col_end - col_start)
            'top_row': 1D top boundary row (first row of cropped region)
            'bottom_row': 1D bottom boundary row (last row of cropped region)
            'left_col': 1D left boundary column (first column of cropped region)
            'right_col': 1D last column of cropped region)
    """
    # TODO: Extract cropped subgrid and its 4 perimeter edges using 2D slicing
    pass
''',
    "reference_solution": r'''import numpy as np

def crop_bounding_box(
    grid: np.ndarray,
    row_start: int,
    row_end: int,
    col_start: int,
    col_end: int
) -> dict:
    """
    Extract a rectangular bounding-box subgrid and its perimeter boundaries using 2D slicing.
    """
    if grid.ndim != 2:
        raise ValueError(f"Expected 2D array, got {grid.ndim}D")
        
    # Extract 2D sub-matrix view
    cropped = grid[row_start:row_end, col_start:col_end]
    if cropped.size == 0:
        raise ValueError("Cropped bounding box is empty")
        
    # Extract perimeter boundary rows and columns using 1D & 2D indexing
    top_row = cropped[0, :]
    bottom_row = cropped[-1, :]
    left_col = cropped[:, 0]
    right_col = cropped[:, -1]
    
    return {
        "cropped": cropped,
        "top_row": top_row,
        "bottom_row": bottom_row,
        "left_col": left_col,
        "right_col": right_col,
    }
''',
    "test_suite": r'''import numpy as np

def run_tests(candidate_func):
    """
    Automated test harness for Challenge d3-c1: Sub-Grid Bounding Box Cropper.
    """
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # 1. Basic subgrid crop on a 6x6 matrix
    grid = np.arange(36).reshape(6, 6)
    res = candidate_func(grid, 1, 5, 2, 6)
    
    assert_test(isinstance(res, dict), "Result must be a dictionary")
    for key in ["cropped", "top_row", "bottom_row", "left_col", "right_col"]:
        assert_test(key in res, f"Missing key in result dictionary: '{key}'")
        
    assert_test(res["cropped"].shape == (4, 4), f"Expected cropped shape (4, 4), got {res['cropped'].shape}")
    assert_test(np.array_equal(res["cropped"], grid[1:5, 2:6]), "Cropped region values mismatch")
    
    # 2. Perimeter row and column boundary verification
    assert_test(res["top_row"].shape == (4,), f"Expected top_row shape (4,), got {res['top_row'].shape}")
    assert_test(np.array_equal(res["top_row"], grid[1, 2:6]), "Top row values mismatch")
    assert_test(res["bottom_row"].shape == (4,), f"Expected bottom_row shape (4,), got {res['bottom_row'].shape}")
    assert_test(np.array_equal(res["bottom_row"], grid[4, 2:6]), "Bottom row values mismatch")
    assert_test(res["left_col"].shape == (4,), f"Expected left_col shape (4,), got {res['left_col'].shape}")
    assert_test(np.array_equal(res["left_col"], grid[1:5, 2]), "Left column values mismatch")
    assert_test(res["right_col"].shape == (4,), f"Expected right_col shape (4,), got {res['right_col'].shape}")
    assert_test(np.array_equal(res["right_col"], grid[1:5, 5]), "Right column values mismatch")
    
    # 3. Zero-copy view check: Slicing must share memory with the original grid
    assert_test(np.shares_memory(grid, res["cropped"]), "Cropped array must be a zero-copy view of the input grid")
    assert_test(np.shares_memory(grid, res["top_row"]), "Top row must share memory with the input grid")
    assert_test(np.shares_memory(grid, res["left_col"]), "Left col must share memory with the input grid")
    
    # 4. Single cell 1x1 crop
    small_grid = np.array([[10, 20, 30], [40, 50, 60], [70, 80, 90]])
    res_small = candidate_func(small_grid, 1, 2, 1, 2)
    assert_test(res_small["cropped"].shape == (1, 1), "1x1 crop shape mismatch")
    assert_test(res_small["cropped"][0, 0] == 50, "1x1 crop value mismatch")
    assert_test(res_small["top_row"][0] == 50, "1x1 top row value mismatch")
    assert_test(res_small["left_col"][0] == 50, "1x1 left col value mismatch")
    
    # 5. View mutation semantics: Modifying the view reflects in source array
    scratch = np.zeros((4, 4), dtype=int)
    res_scratch = candidate_func(scratch, 1, 3, 1, 3)
    res_scratch["cropped"][0, 0] = 777
    assert_test(scratch[1, 1] == 777, "Modifying the cropped view must update the underlying array (view semantics)")

    return report
''',
    "hints": [
        "Slice the 2D matrix using `grid[row_start:row_end, col_start:col_end]`.",
        "From the cropped region, use `crop[0, :]` to get the top row and `crop[-1, :]` for the bottom row.",
        "Use `crop[:, 0]` to get the left column and `crop[:, -1]` for the right column."
    ]
}

# -----------------------------------------------------------------------------
# Challenge 2: Alternating Pattern & Decimation
# -----------------------------------------------------------------------------

CHALLENGE_2 = {
    "id": "d3-c2",
    "title": "Alternating Pattern & Decimation",
    "difficulty": "Intermediate",
    "category": "Striding & Views",
    "description": (
        "In signal processing and image manipulation, downsampling (decimation) skips elements at regular intervals. "
        "Your task is to write `decimate_and_isolate` which downsamples a 2D matrix using stride stepping (`::step`), "
        "extracts alternating patterns (even indices, odd indices, and full reversal), and produces an independent "
        "detached copy using `.copy()` so that subsequent mutations will not affect the original array."
    ),
    "instructions": (
        "1. Implement `decimate_and_isolate(grid: np.ndarray, step: int = 2) -> dict`.\n"
        "2. Input `grid` is a 2D NumPy array, and `step` is a positive integer decimation factor.\n"
        "3. Extract `'even_sample'`: a 2D view taking every `step` element starting from index 0 across both axes (`grid[::step, ::step]`).\n"
        "4. Extract `'odd_sample'`: a 2D view taking every `step` element starting from index 1 across both axes (`grid[1::step, 1::step]`).\n"
        "5. Extract `'reversed_grid'`: a 2D view with all rows and columns reversed (`grid[::-1, ::-1]`).\n"
        "6. Create `'isolated_copy'`: an independent deep copy of `even_sample` using `.copy()`.\n"
        "7. Return a dictionary containing these 4 keys.\n"
        "8. Verify that `even_sample`, `odd_sample`, and `reversed_grid` share memory with `grid`, but `isolated_copy` does NOT."
    ),
    "starter_code": r'''import numpy as np

def decimate_and_isolate(grid: np.ndarray, step: int = 2) -> dict:
    """
    Downsample a 2D array using stride stepping, extract alternating patterns,
    and isolate an independent copy.
    
    Args:
        grid: 2D numpy array of shape (H, W)
        step: positive integer decimation step (e.g. 2 for every second element)
        
    Returns:
        dict containing:
            'even_sample': 2D view taking every `step` element from index 0: grid[::step, ::step]
            'odd_sample': 2D view taking every `step` element from index 1: grid[1::step, 1::step]
            'reversed_grid': 2D view with all rows and columns reversed: grid[::-1, ::-1]
            'isolated_copy': an independent deep copy of 'even_sample' using .copy()
    """
    # TODO: Implement stride stepping and independent copy isolation
    pass
''',
    "reference_solution": r'''import numpy as np

def decimate_and_isolate(grid: np.ndarray, step: int = 2) -> dict:
    """
    Downsample a 2D array using stride stepping, extract alternating patterns, and isolate a copy.
    """
    if grid.ndim != 2:
        raise ValueError("Input grid must be 2D")
    if step <= 0:
        raise ValueError("Step must be positive")
        
    even_sample = grid[::step, ::step]
    odd_sample = grid[1::step, 1::step]
    reversed_grid = grid[::-1, ::-1]
    isolated_copy = even_sample.copy()
    
    return {
        "even_sample": even_sample,
        "odd_sample": odd_sample,
        "reversed_grid": reversed_grid,
        "isolated_copy": isolated_copy,
    }
''',
    "test_suite": r'''import numpy as np

def run_tests(candidate_func):
    """
    Automated test harness for Challenge d3-c2: Alternating Pattern & Decimation.
    """
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # 1. Decimation on an 8x8 grid with step=2
    grid = np.arange(64).reshape(8, 8)
    res = candidate_func(grid, step=2)
    assert_test(isinstance(res, dict), "Output must be a dictionary")
    for k in ["even_sample", "odd_sample", "reversed_grid", "isolated_copy"]:
        assert_test(k in res, f"Missing key: '{k}'")
        
    assert_test(res["even_sample"].shape == (4, 4), f"Expected even_sample (4, 4), got {res['even_sample'].shape}")
    assert_test(res["odd_sample"].shape == (4, 4), f"Expected odd_sample (4, 4), got {res['odd_sample'].shape}")
    assert_test(res["reversed_grid"].shape == (8, 8), f"Expected reversed_grid (8, 8), got {res['reversed_grid'].shape}")
    assert_test(res["isolated_copy"].shape == (4, 4), f"Expected isolated_copy (4, 4), got {res['isolated_copy'].shape}")
    
    # 2. Value correctness
    assert_test(res["even_sample"][0, 0] == grid[0, 0], "Even sample (0,0) mismatch")
    assert_test(res["even_sample"][1, 1] == grid[2, 2], "Even sample (1,1) mismatch")
    assert_test(res["odd_sample"][0, 0] == grid[1, 1], "Odd sample (0,0) mismatch")
    assert_test(res["odd_sample"][1, 1] == grid[3, 3], "Odd sample (1,1) mismatch")
    assert_test(res["reversed_grid"][0, 0] == grid[-1, -1], "Reversed grid (0,0) mismatch")
    assert_test(res["reversed_grid"][-1, -1] == grid[0, 0], "Reversed grid (-1,-1) mismatch")
    assert_test(np.array_equal(res["even_sample"], res["isolated_copy"]), "Isolated copy values must equal even_sample")
    
    # 3. Views vs. Copy memory sharing check
    assert_test(np.shares_memory(grid, res["even_sample"]), "even_sample must be a view sharing memory with grid")
    assert_test(np.shares_memory(grid, res["odd_sample"]), "odd_sample must be a view sharing memory with grid")
    assert_test(np.shares_memory(grid, res["reversed_grid"]), "reversed_grid must be a view sharing memory with grid")
    assert_test(not np.shares_memory(grid, res["isolated_copy"]), "isolated_copy must NOT share memory with grid (must be an independent copy)")
    
    # 4. Mutation isolation test: Mutating isolated_copy must NOT affect grid
    grid_copy = grid.copy()
    res_mut = candidate_func(grid_copy, step=2)
    res_mut["isolated_copy"][0, 0] = 99999
    assert_test(grid_copy[0, 0] != 99999, "Mutating isolated_copy must NOT mutate original grid!")
    assert_test(res_mut["even_sample"][0, 0] != 99999, "Mutating isolated_copy must NOT mutate even_sample view!")
    
    # 5. Non-square matrix with step=3
    rect = np.arange(54).reshape(6, 9)
    res_rect = candidate_func(rect, step=3)
    assert_test(res_rect["even_sample"].shape == (2, 3), f"Expected (2, 3) for step 3, got {res_rect['even_sample'].shape}")
    assert_test(res_rect["odd_sample"].shape == (2, 3), f"Expected (2, 3) for odd sample, got {res_rect['odd_sample'].shape}")

    return report
''',
    "hints": [
        "Use `grid[::step, ::step]` to sample every `step` rows and columns starting from index 0.",
        "Use `grid[1::step, 1::step]` to sample starting from index 1.",
        "Use `grid[::-1, ::-1]` to reverse rows and columns with a negative step.",
        "Call `.copy()` on `even_sample` to create an independent array that does not share memory with the original."
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
