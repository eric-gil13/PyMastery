"""
Part 1: Array Foundations & Creation
PyMastery Progressive NumPy Curriculum
"""

import numpy as np
from typing import Dict, Any, List

DAY_METADATA = {
    "day_id": "day01",
    "day_number": 1,
    "title": "Part 1: Array Foundations & Creation",
    "tagline": "Understand 1D arrays, data types, and fast buffer initialization.",
    "estimated_time": "1-2 hours",
    "concepts_covered": [
        "1D arrays and contiguous memory",
        "Python lists vs NumPy ndarrays",
        "Data types (dtypes): float64 vs int32",
        "Pre-allocation with np.zeros and np.ones",
        "Sequence generation with np.arange vs np.linspace"
    ]
}

CONCEPT_PRIMER = r"""# Part 1 Concept Primer: Array Foundations & Creation

## 1. Why NumPy? Lists vs ndarrays
Standard Python lists are versatile general-purpose containers. You can store strings, floats, integers, or even other lists inside a single list:
```python
mixed_list = [10, "sensor_ok", 3.1415]
```

However, this flexibility comes with a hidden cost:
* **The Pointer Problem:** A Python list doesn't store raw numbers next to each other. Instead, it stores an array of memory addresses (pointers), each pointing to a separate `PyObject` somewhere in RAM.
* **Type Checking Overhead:** Whenever Python adds two numbers in a list, it has to inspect what kind of object each one is, find its addition method, and create a brand-new object for the result.
* **Loop Slowness:** Running a standard Python `for` loop over 1,000,000 numbers repeats this type-checking and pointer-lookup 1,000,000 times!

### The NumPy ndarray (N-Dimensional Array)
NumPy arrays solve this by introducing two key principles:
1. **Contiguous Storage:** All numbers sit directly beside each other in one continuous block of memory.
2. **Uniform Data Type (dtype):** Every single element in an array has the exact same type (e.g. all 64-bit floats).

Because NumPy knows all elements are identical, calculations run at compiled C speed across the entire array in a single sweep!

```
Python List:  [ ptr ] --------> [ 21.5 ] (Heap Object)
              [ ptr ] --------> [ 22.0 ] (Heap Object)
              [ ptr ] --------> [ 19.8 ] (Heap Object)

NumPy Array:  | 21.5 | 22.0 | 19.8 |  (Contiguous 8-byte slots in RAM)
```

---

## 2. Understanding Data Types (dtypes)
In Python, you rarely think about bytes or precision because Python automatically manages numbers for you. In NumPy, data types (`dtypes`) give you direct control over memory and numerical precision:

* **`np.float64`**: 64-bit floating point (double precision). Default for decimals in Python. Can represent numbers with ~15-17 significant decimal digits.
* **`np.float32`**: 32-bit floating point (single precision). Uses half the memory of float64. Standard in deep learning and 3D graphics.
* **`np.int32`**: 32-bit signed integer (range: -2,147,483,648 to 2,147,483,647).
* **`np.int64`**: 64-bit signed integer for whole numbers of virtually any magnitude.
* **`bool`**: Boolean (`True` or `False`), stored as 1 byte each.

### Specifying and Converting Types
```python
# Create an array with a specific dtype:
arr = np.array([1, 2, 3], dtype=np.float64)  # array([1., 2., 3.])

# Convert an existing array using .astype():
int_arr = arr.astype(np.int32)               # array([1, 2, 3], dtype=int32)
```

> **Note on Integer Casting:** Casting floats to integers using `.astype(np.int32)` truncates decimals toward zero without rounding: `np.array([3.9]).astype(np.int32)` produces `3`.

---

## 3. Fast Buffer Creation: `np.zeros` and `np.ones`
Frequently in engineering, robotics, or data science, you need to allocate empty or baseline arrays of a known size before streaming data arrives:

* **`np.zeros(size, dtype=float)`**: Creates an array filled with `0.0`.
* **`np.ones(size, dtype=float)`**: Creates an array filled with `1.0`.

```python
baseline = np.zeros(5, dtype=np.float64)  # array([0., 0., 0., 0., 0.])
multipliers = np.ones(3, dtype=np.float64) # array([1., 1., 1.])
```

---

## 4. Sequence Generators: `np.arange` vs `np.linspace`
Generating a progression of numbers is one of the most common tasks in computing. NumPy gives you two functions designed for two different mindsets:

### 1. `np.arange(start, stop, step)` — Step-Driven
* **Mental Model:** "Take steps of size `step` starting from `start` until just before `stop`."
* Like Python's `range()`, **`stop` is excluded**.
* Best used when the **step size** is what matters to you (e.g. advance every 2 seconds).
* Example: `np.arange(0, 10, 2)` produces `[0, 2, 4, 6, 8]`.

### 2. `np.linspace(start, stop, num)` — Count-Driven
* **Mental Model:** "Place exactly `num` markers evenly spaced between `start` and `stop`."
* By default, **both `start` and `stop` are included**.
* Best used when the **total number of points** is what matters to you (e.g. sample 50 points on a curve).
* Example: `np.linspace(0, 10, 5)` produces `[0.0, 2.5, 5.0, 7.5, 10.0]`.

| Feature | `np.arange` | `np.linspace` |
| :--- | :--- | :--- |
| **You specify:** | Step size (`step`) | Total point count (`num`) |
| **Is \`stop\` included?** | No (half-open: `[start, stop)`) | Yes (closed: `[start, stop]`) |
| **With decimals:** | Can suffer tiny float rounding issues | Numerically stable and exact |
| **Common use case:** | Grid loops, fixed stride indices | Graph plotting, audio waveforms, physics models |
"""

WALKTHROUGH = r"""# Part 1 Code Walkthrough: Getting Started with NumPy

Let's explore basic array creation, dtypes, and sequence generation interactively:

```python
import numpy as np

# 1. Converting a Python list to a typed NumPy array
readings = [19.2, 21.5, 20.8, 22.1]
arr = np.array(readings, dtype=np.float64)
print("Array values:", arr)
print("Data type:", arr.dtype)
print("Shape:", arr.shape)
print("Size (total elements):", arr.size)

# 2. Type casting with astype()
truncated = arr.astype(np.int32)
print("Integer codes:", truncated)

# 3. Allocating buffers with zeros and ones
zero_buf = np.zeros(5, dtype=np.float64)
one_buf = np.ones(len(readings), dtype=np.float64)
print("Zeros buffer:", zero_buf)
print("Ones buffer:", one_buf)

# 4. Step-based sequences with np.arange
# Step by 0.5 from 0 up to 3.0 (3.0 is excluded!)
steps = np.arange(0.0, 3.0, 0.5)
print("np.arange steps:", steps)

# 5. Count-based sampling with np.linspace
# Exactly 5 points between 0.0 and 3.0 (3.0 is included!)
samples = np.linspace(0.0, 3.0, 5)
print("np.linspace samples:", samples)
```
"""

# -----------------------------------------------------------------------------
# Challenge 1: Sensor Reading Initializer
# -----------------------------------------------------------------------------

CHALLENGE_1 = {
    "id": "d1-c1",
    "title": "Sensor Reading Initializer",
    "difficulty": "Beginner",
    "category": "Array Foundations",
    "description": (
        "Convert raw sensor readings into typed NumPy arrays, and initialize zero and one reference buffers. "
        "Learn the basics of creating 1D arrays from Python lists, selecting explicit dtypes (float64, int32), "
        "and allocating constant baseline buffers."
    ),
    "instructions": (
        "Write a function `init_sensor_data(raw_readings: list, baseline_count: int = 5) -> dict` that:\n"
        "1. Converts `raw_readings` into a NumPy array named `\"readings\"` with `dtype=np.float64`.\n"
        "2. Creates an array of zeros named `\"baseline_zeros\"` of length `baseline_count` with `dtype=np.float64`.\n"
        "3. Creates an array of ones named `\"scale_ones\"` of length equal to the number of elements in `raw_readings` with `dtype=np.float64`.\n"
        "4. Creates an array of 32-bit integer status codes named `\"int_codes\"` by converting `raw_readings` to `dtype=np.int32`.\n"
        "5. Returns a dictionary containing all four arrays:\n"
        "   `{\"readings\": ..., \"baseline_zeros\": ..., \"scale_ones\": ..., \"int_codes\": ...}`"
    ),
    "starter_code": r'''import numpy as np

def init_sensor_data(raw_readings: list, baseline_count: int = 5) -> dict:
    """
    Initialize sensor buffers and typed arrays from raw readings.
    
    Args:
        raw_readings: List of float/int sensor readings
        baseline_count: Number of baseline zero readings to allocate (default 5)
        
    Returns:
        Dictionary with 'readings', 'baseline_zeros', 'scale_ones', 'int_codes'
    """
    # TODO: Create the four NumPy arrays and return them in a dictionary
    pass
''',
    "reference_solution": r'''import numpy as np

def init_sensor_data(raw_readings: list, baseline_count: int = 5) -> dict:
    """
    Convert raw sensor readings into typed float64/int32 arrays and initialize zero/one buffers.
    """
    readings = np.array(raw_readings, dtype=np.float64)
    baseline_zeros = np.zeros(baseline_count, dtype=np.float64)
    scale_ones = np.ones(len(raw_readings), dtype=np.float64)
    int_codes = np.array(raw_readings, dtype=np.int32)
    return {
        "readings": readings,
        "baseline_zeros": baseline_zeros,
        "scale_ones": scale_ones,
        "int_codes": int_codes,
    }
''',
    "test_suite": r'''import numpy as np

def run_tests(candidate_func):
    """
    Automated test harness for Sensor Reading Initializer (d1-c1).
    """
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Test 1: Standard input with custom baseline_count
    readings_input = [21.5, 22.0, 19.8, 24.2]
    res = candidate_func(readings_input, 4)
    assert_test(isinstance(res, dict), "Result must be a Python dictionary")
    
    expected_keys = {"readings", "baseline_zeros", "scale_ones", "int_codes"}
    assert_test(expected_keys.issubset(res.keys()), f"Missing expected keys: {expected_keys - set(res.keys())}")
    
    for key in expected_keys:
        assert_test(isinstance(res[key], np.ndarray), f"Value for '{key}' must be a numpy.ndarray")
        
    assert_test(res["readings"].dtype == np.float64, f"readings dtype must be float64, got {res['readings'].dtype}")
    assert_test(res["readings"].shape == (4,), f"readings shape mismatch: expected (4,), got {res['readings'].shape}")
    assert_test(np.allclose(res["readings"], readings_input), "readings values do not match input")
    
    assert_test(res["baseline_zeros"].dtype == np.float64, "baseline_zeros dtype must be float64")
    assert_test(res["baseline_zeros"].shape == (4,), f"baseline_zeros shape mismatch: expected (4,), got {res['baseline_zeros'].shape}")
    assert_test(np.all(res["baseline_zeros"] == 0.0), "baseline_zeros elements must all be 0.0")
    
    assert_test(res["scale_ones"].dtype == np.float64, "scale_ones dtype must be float64")
    assert_test(res["scale_ones"].shape == (4,), f"scale_ones shape mismatch: expected (4,), got {res['scale_ones'].shape}")
    assert_test(np.all(res["scale_ones"] == 1.0), "scale_ones elements must all be 1.0")
    
    assert_test(res["int_codes"].dtype == np.int32, f"int_codes dtype must be int32, got {res['int_codes'].dtype}")
    assert_test(np.array_equal(res["int_codes"], np.array([21, 22, 19, 24], dtype=np.int32)), "int_codes values mismatch")

    # Test 2: Default baseline_count behavior
    res_def = candidate_func([10.5, 12.8])
    assert_test(res_def["baseline_zeros"].shape == (5,), f"Default baseline_zeros length must be 5, got {res_def['baseline_zeros'].shape[0]}")
    assert_test(res_def["scale_ones"].shape == (2,), "scale_ones length must match raw_readings length")

    # Test 3: Empty input list
    res_empty = candidate_func([], 3)
    assert_test(res_empty["readings"].shape == (0,), "Empty readings should yield shape (0,)")
    assert_test(res_empty["scale_ones"].shape == (0,), "Empty scale_ones should yield shape (0,)")
    assert_test(res_empty["baseline_zeros"].shape == (3,), "baseline_zeros length should be 3 even with empty readings")

    # Test 4: Truncation check
    res_trunc = candidate_func([0.9, 1.1, -2.9, 3.0], 2)
    assert_test(np.array_equal(res_trunc["int_codes"], np.array([0, 1, -2, 3], dtype=np.int32)), "Float to int32 truncation failed")

    return report
''',
    "hints": [
        "Use np.array(raw_readings, dtype=np.float64) for the readings.",
        "Use np.zeros(baseline_count, dtype=np.float64) for the baseline.",
        "Use np.ones(len(raw_readings), dtype=np.float64) for the scaling array.",
        "Use np.array(raw_readings, dtype=np.int32) or readings.astype(np.int32) for the integer codes."
    ]
}

# -----------------------------------------------------------------------------
# Challenge 2: Range & Sampling Generator
# -----------------------------------------------------------------------------

CHALLENGE_2 = {
    "id": "d1-c2",
    "title": "Range & Sampling Generator",
    "difficulty": "Beginner",
    "category": "Array Creation",
    "description": (
        "Generate linear stepped intervals and evenly spaced coordinate samples. "
        "Learn the distinction between step-driven sequences and count-driven sequences, "
        "and validate numeric inputs against invalid bounds."
    ),
    "instructions": (
        "Write a function `generate_range_and_samples(start: float, stop: float, step: float, num_samples: int) -> dict` that:\n"
        "1. Validates inputs:\n"
        "   - If `step <= 0`, raise `ValueError(\"Step size must be positive\")`.\n"
        "   - If `num_samples < 1`, raise `ValueError(\"num_samples must be at least 1\")`.\n"
        "2. Generates a 1D array named `\"stepped_range\"` containing values starting from start, stopping before stop, incrementing by step.\n"
        "3. Generates a 1D array named `\"linear_samples\"` containing num_samples evenly spaced values across [start, stop].\n"
        "4. Generates a 1D array named `\"unit_intervals\"` containing num_samples evenly spaced values across [0.0, 1.0].\n"
        "5. Calculates `\"step_count\"` as an integer representing the total count of elements in `stepped_range`.\n"
        "6. Returns a dictionary:\n"
        "   `{\"stepped_range\": ..., \"linear_samples\": ..., \"unit_intervals\": ..., \"step_count\": ...}`"
    ),
    "starter_code": r'''import numpy as np

def generate_range_and_samples(start: float, stop: float, step: float, num_samples: int) -> dict:
    """
    Generate stepped ranges and linear sample points.
    
    Args:
        start: Start of the interval
        stop: End of the interval
        step: Step size between sequence values
        num_samples: Total number of evenly spaced sample points
        
    Returns:
        Dictionary with 'stepped_range', 'linear_samples', 'unit_intervals', 'step_count'
    """
    # TODO: Validate inputs, generate arrays, and return the dictionary
    pass
''',
    "reference_solution": r'''import numpy as np

def generate_range_and_samples(start: float, stop: float, step: float, num_samples: int) -> dict:
    """
    Generate stepped intervals with np.arange and evenly spaced points with np.linspace.
    """
    if step <= 0:
        raise ValueError("Step size must be positive")
    if num_samples < 1:
        raise ValueError("num_samples must be at least 1")
        
    stepped_range = np.arange(start, stop, step)
    linear_samples = np.linspace(start, stop, num_samples)
    unit_intervals = np.linspace(0.0, 1.0, num_samples)
    
    return {
        "stepped_range": stepped_range,
        "linear_samples": linear_samples,
        "unit_intervals": unit_intervals,
        "step_count": int(stepped_range.size),
    }
''',
    "test_suite": r'''import numpy as np

def run_tests(candidate_func):
    """
    Automated test harness for Range & Sampling Generator (d1-c2).
    """
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Test 1: Standard even step inputs
    res = candidate_func(0.0, 10.0, 2.0, 5)
    assert_test(isinstance(res, dict), "Result must be a Python dictionary")
    expected_keys = {"stepped_range", "linear_samples", "unit_intervals", "step_count"}
    assert_test(expected_keys.issubset(res.keys()), f"Missing expected keys: {expected_keys - set(res.keys())}")
    
    expected_stepped = np.array([0.0, 2.0, 4.0, 6.0, 8.0])
    expected_linear = np.array([0.0, 2.5, 5.0, 7.5, 10.0])
    expected_unit = np.array([0.0, 0.25, 0.5, 0.75, 1.0])
    
    assert_test(np.allclose(res["stepped_range"], expected_stepped), f"stepped_range mismatch: got {res['stepped_range']}")
    assert_test(np.allclose(res["linear_samples"], expected_linear), f"linear_samples mismatch: got {res['linear_samples']}")
    assert_test(np.allclose(res["unit_intervals"], expected_unit), f"unit_intervals mismatch: got {res['unit_intervals']}")
    assert_test(res["step_count"] == 5, f"step_count mismatch: expected 5, got {res['step_count']}")

    # Test 2: Fractional steps
    res2 = candidate_func(0.0, 1.0, 0.25, 3)
    assert_test(res2["step_count"] == 4, f"Fractional step count mismatch: expected 4, got {res2['step_count']}")
    assert_test(res2["linear_samples"].shape == (3,), "linear_samples shape mismatch")
    assert_test(np.allclose(res2["linear_samples"], np.array([0.0, 0.5, 1.0])), "linear_samples values mismatch")

    # Test 3: Validation on negative step
    raised_step = False
    try:
        candidate_func(0.0, 10.0, -1.0, 5)
    except ValueError:
        raised_step = True
    assert_test(raised_step, "Expected ValueError when step <= 0")

    # Test 4: Validation on invalid num_samples
    raised_num = False
    try:
        candidate_func(0.0, 10.0, 1.0, 0)
    except ValueError:
        raised_num = True
    assert_test(raised_num, "Expected ValueError when num_samples < 1")

    return report
''',
    "hints": [
        "np.arange(start, stop, step) takes start, stop, and step.",
        "np.linspace(start, stop, num_samples) takes start, stop, and the number of points.",
        "Use int(stepped_range.size) to get the total number of items in stepped_range."
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
