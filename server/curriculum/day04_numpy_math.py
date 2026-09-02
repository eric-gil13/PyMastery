"""
Day 4: Vectorized Arithmetic & Fast Ufuncs
PyMastery Progressive NumPy Curriculum
"""

import numpy as np
import time
from typing import Dict, Any, List

DAY_METADATA = {
    "day_id": "day04",
    "day_number": 4,
    "title": "Day 4: Vectorized Arithmetic & Fast Ufuncs",
    "tagline": "Banish Python loops forever with SIMD-accelerated universal functions and vectorized arithmetic.",
    "estimated_time": "2-3 hours",
    "concepts_covered": [
        "Why Python loops are slow (interpreter bytecode dispatch, dynamic boxing)",
        "Vectorization: executing whole-array operations simultaneously",
        "Scalar arithmetic across ndarrays (arr * 2, arr + 10)",
        "Element-wise array arithmetic (A + B, A - B, A * B, A / B)",
        "Universal functions (ufuncs): np.sqrt, np.exp, np.clip, np.abs",
        "High-throughput numerical computing with zero Python loops"
    ]
}

CONCEPT_PRIMER = r"""# Day 4 Concept Primer: Vectorized Arithmetic & Fast Ufuncs

Welcome to Day 4! Today, you unlock the core reason NumPy is the engine behind all of modern AI, data science, and quantitative finance: **Vectorization** and **Universal Functions (ufuncs)**.

---

## 1. Why Are Plain Python Loops Slow?

Imagine you have a list of 1,000,000 prices and you want to double each of them. In plain Python, you might write:

```python
doubled = [price * 2 for price in prices]
```

Under the hood, Python must perform a mountain of work for **every single number**:
1. **Fetch bytecode:** The interpreter reads the `FOR_ITER` and `BINARY_MULTIPLY` opcodes.
2. **Dynamic type inspection:** "Is `price` a float? An int? A custom class?"
3. **Method lookup:** It checks the `__mul__` method table.
4. **Memory allocation:** It creates a brand-new `PyFloat` heap object (24+ bytes of metadata) to hold the result.
5. **Pointer appending:** It stores a pointer to that new object in the output list.

For 1,000,000 numbers, Python executes over **10 million CPU instructions**, taking ~100 to 200 milliseconds!

---

## 2. The NumPy Miracle: Vectorization

In NumPy, you write:

```python
doubled = prices * 2
```

What happens under the hood?
* All 1,000,000 numbers are stored **consecutively in contiguous memory** (exactly 8 bytes per `float64`).
* NumPy skips the Python interpreter completely! It passes the entire memory buffer directly to pre-compiled C/Fortran assembly routines.
* Modern CPUs utilize **SIMD (Single Instruction, Multiple Data)** registers (such as AVX-256 and AVX-512) to compute 4 to 8 multiplications **in a single CPU clock cycle**.
* Execution drops from 150 ms down to **under 1 millisecond** (over 100x speedup)!

---

## 3. The Two Flavors of Vectorized Arithmetic

### A. Scalar Arithmetic (Array + Number)
When you combine an array with a single scalar number, NumPy applies that scalar to **every single element** across the array:

```python
arr = np.array([10.0, 20.0, 30.0])

arr + 5    # [15.0, 25.0, 35.0]  (Addition)
arr * 2    # [20.0, 40.0, 60.0]  (Multiplication)
arr / 10   # [ 1.0,  2.0,  3.0]  (Division)
arr ** 2   # [100.0, 400.0, 900.0] (Exponentiation)
```

### B. Element-Wise Arithmetic (Array + Array)
When two arrays have the same shape, binary operators combine matching elements pair-by-pair:

```python
a = np.array([10, 20, 30])
b = np.array([ 1,  2,  3])

a + b   # [11, 22, 33]
a - b   # [ 9, 18, 27]
a * b   # [10, 40, 90]   <-- Element-wise product! (Not matrix multiply)
a / b   # [10.0, 10.0, 10.0]
```

---

## 4. Universal Functions (Ufuncs): C-Speed Mathematical Powerhouses

A **ufunc** (Universal Function) is a compiled function that operates element-by-element across ndarrays at hardware speed.

Here are the most essential ufuncs:

| Function | Operation | Example | Result |
|---|---|---|---|
| `np.abs(x)` | Absolute value $\|x\|$ | `np.abs([-5, 3])` | `[5, 3]` |
| `np.sqrt(x)` | Square root $\sqrt{x}$ | `np.sqrt([4, 9, 16])` | `[2.0, 3.0, 4.0]` |
| `np.exp(x)` | Exponential $e^x$ | `np.exp([0, 1])` | `[1.0, 2.718...]` |
| `np.log(x)` | Natural logarithm $\ln(x)$ | `np.log([1, np.e])` | `[0.0, 1.0]` |
| `np.clip(x, low, high)` | Clamp values between $[low, high]$ | `np.clip([-10, 5, 20], 0, 10)` | `[0, 5, 10]` |

### The Power of `np.clip`: Guardrails for Real-World Data
In financial models, neural networks, and physical simulations, values can explode or drop below zero. `np.clip(arr, min_val, max_val)` clamps outliers instantly:
* Any value below `min_val` becomes `min_val`.
* Any value above `max_val` becomes `max_val`.
* All values in between remain untouched.

### Chaining Vectorized Operations
Because NumPy expressions return ndarrays, you can chain them into concise mathematical pipelines:

$$y = \text{clip}\left(\text{scale} \cdot e^{-\lambda x} + \text{bias}, \, y_{\min}, \, y_{\max}\right)$$

In Python:
```python
y = np.clip(scale * np.exp(-decay * x) + bias, min_val, max_val)
```
Notice how natural this reads! It directly matches mathematical notation, executes in pure C, and uses zero loops.
"""

WALKTHROUGH = r"""# Day 4 Walkthrough: Measuring Vectorization Speedups & Ufunc Pipelines

Let's benchmark the performance difference between standard Python loops and NumPy vectorization, and build a clamped mathematical pipeline.

```python
import numpy as np
import time

# 1. Benchmark: Python Loop vs NumPy Vectorization
N = 1_000_000
python_list = [float(i) for i in range(N)]
numpy_arr = np.arange(N, dtype=np.float64)

# Pure Python loop
t0 = time.perf_counter()
py_result = [x * 1.5 + 10.0 for x in python_list]
t_python = (time.perf_counter() - t0) * 1000

# Vectorized NumPy expression
t0 = time.perf_counter()
np_result = numpy_arr * 1.5 + 10.0
t_numpy = (time.perf_counter() - t0) * 1000

print(f"Python list comprehension: {t_python:.2f} ms")
print(f"NumPy vectorized math:    {t_numpy:.2f} ms")
print(f"Speedup factor:           {t_python / t_numpy:.1f}x faster!")

# 2. Financial Return & Clamping Example
baseline_prices = np.array([100.0, 50.0, 200.0, 80.0])
current_prices  = np.array([125.0, 45.0, 220.0, 60.0])

# Percentage returns: (current - baseline) / baseline
pct_returns = (current_prices - baseline_prices) / baseline_prices
print("\nPercentage Returns:", pct_returns * 100, "%")

# Apply 10% discount and clamp between $50 and $150
discounted = current_prices * 0.90
capped = np.clip(discounted, 50.0, 150.0)
print("Discounted & Capped Prices:", capped)

# 3. Clamped Exponential Decay
x = np.linspace(0.0, 10.0, 5)
decay_signal = np.clip(np.exp(-0.5 * x), 0.1, 0.9)
print("\nClamped Exponential Decay:", decay_signal)
```
"""

# -----------------------------------------------------------------------------
# Challenge 1: Financial Return & Discount Calculator
# -----------------------------------------------------------------------------

CHALLENGE_1 = {
    "id": "d4-c1",
    "title": "Financial Return & Discount Calculator",
    "difficulty": "Beginner",
    "category": "Vectorized Math",
    "description": (
        "In algorithmic trading and retail analytics, pricing engines must process millions of quote updates per second. "
        "Your task is to write `compute_financial_metrics` to calculate percentage returns, absolute price changes, "
        "promotional discounts, and enforce regulatory price caps using vectorized NumPy operations with ZERO Python loops."
    ),
    "instructions": (
        "1. Implement `compute_financial_metrics(current_prices: np.ndarray, baseline_prices: np.ndarray, discount_rate: float = 0.15, min_price_cap: float = 5.0, max_price_cap: float = 500.0) -> dict`.\n"
        "2. Input arrays `current_prices` and `baseline_prices` have identical shapes.\n"
        "3. Compute `'pct_return'`: percentage change relative to baseline prices ((current - baseline) / baseline).\n"
        "4. Compute `'abs_diff'`: absolute price difference between current and baseline prices.\n"
        "5. Compute `'discounted'`: promotional prices after applying the fractional discount rate.\n"
        "6. Compute `'capped_prices'`: discounted prices clamped within [min_price_cap, max_price_cap].\n"
        "7. Return a dictionary containing all 4 metric arrays.\n"
        "8. Absolutely NO `for`, `while`, or list comprehensions are permitted."
    ),
    "starter_code": r'''import numpy as np

def compute_financial_metrics(
    current_prices: np.ndarray,
    baseline_prices: np.ndarray,
    discount_rate: float = 0.15,
    min_price_cap: float = 5.0,
    max_price_cap: float = 500.0
) -> dict:
    """
    Compute financial metrics using zero Python loops:
    1. Percentage return: relative change compared to baseline prices
    2. Absolute price change: absolute difference between current and baseline prices
    3. Discounted prices: prices after applying the specified discount rate
    4. Capped prices: discounted prices clamped within [min_price_cap, max_price_cap]
    
    Args:
        current_prices: numpy array of current prices
        baseline_prices: numpy array of same shape with baseline prices
        discount_rate: float percentage discount to apply (e.g. 0.15 for 15%)
        min_price_cap: minimum price floor
        max_price_cap: maximum price ceiling
        
    Returns:
        dict containing:
            'pct_return': percentage return array
            'abs_diff': absolute difference array
            'discounted': prices after discount
            'capped_prices': discounted prices clamped within [min_price_cap, max_price_cap]
    """
    # TODO: Implement zero-loop vectorized financial calculations
    pass
''',
    "reference_solution": r'''import numpy as np

def compute_financial_metrics(
    current_prices: np.ndarray,
    baseline_prices: np.ndarray,
    discount_rate: float = 0.15,
    min_price_cap: float = 5.0,
    max_price_cap: float = 500.0
) -> dict:
    """
    Vectorized financial metrics computation with element-wise arithmetic and ufuncs.
    """
    if current_prices.shape != baseline_prices.shape:
        raise ValueError("current_prices and baseline_prices must have identical shapes")
        
    # Element-wise percentage change
    pct_return = (current_prices - baseline_prices) / baseline_prices
    
    # Universal function: absolute value
    abs_diff = np.abs(current_prices - baseline_prices)
    
    # Scalar multiplication for discount
    discounted = current_prices * (1.0 - discount_rate)
    
    # Universal function: clamping within min and max price guardrails
    capped_prices = np.clip(discounted, min_price_cap, max_price_cap)
    
    return {
        "pct_return": pct_return,
        "abs_diff": abs_diff,
        "discounted": discounted,
        "capped_prices": capped_prices,
    }
''',
    "test_suite": r'''import numpy as np
import time

def run_tests(candidate_func):
    """
    Automated test harness for Challenge d4-c1: Financial Return & Discount Calculator.
    """
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # 1. Basic known calculation
    curr = np.array([100.0, 200.0, 3.0, 1000.0])
    base = np.array([80.0, 250.0, 4.0, 800.0])
    res = candidate_func(curr, base, discount_rate=0.15, min_price_cap=5.0, max_price_cap=500.0)
    
    assert_test(isinstance(res, dict), "Result must be a dictionary")
    for k in ["pct_return", "abs_diff", "discounted", "capped_prices"]:
        assert_test(k in res, f"Missing key in result dictionary: '{k}'")
        
    expected_pct = np.array([0.25, -0.2, -0.25, 0.25])
    expected_abs = np.array([20.0, 50.0, 1.0, 200.0])
    expected_disc = np.array([85.0, 170.0, 2.55, 850.0])
    expected_capped = np.array([85.0, 170.0, 5.0, 500.0])
    
    assert_test(np.allclose(res["pct_return"], expected_pct, atol=1e-6), "Percentage return values mismatch")
    assert_test(np.allclose(res["abs_diff"], expected_abs, atol=1e-6), "Absolute difference values mismatch")
    assert_test(np.allclose(res["discounted"], expected_disc, atol=1e-6), "Discounted price values mismatch")
    assert_test(np.allclose(res["capped_prices"], expected_capped, atol=1e-6), "Capped prices values mismatch")
    
    # 2. 2D array support and shape preservation
    curr_2d = np.array([[50.0, 600.0], [10.0, 2.0]])
    base_2d = np.array([[40.0, 500.0], [20.0, 4.0]])
    res_2d = candidate_func(curr_2d, base_2d, discount_rate=0.10, min_price_cap=5.0, max_price_cap=400.0)
    assert_test(res_2d["pct_return"].shape == (2, 2), "2D shape must be preserved across calculations")
    assert_test(res_2d["capped_prices"][0, 1] == 400.0, "Ceiling clamp failed on 2D array")
    assert_test(res_2d["capped_prices"][1, 1] == 5.0, "Floor clamp failed on 2D array")
    
    # 3. High-throughput vectorization benchmark on 250,000 quotes
    N = 250_000
    curr_large = np.random.uniform(10.0, 1000.0, size=N)
    base_large = np.random.uniform(10.0, 1000.0, size=N)
    
    t0 = time.perf_counter()
    res_large = candidate_func(curr_large, base_large, discount_rate=0.20, min_price_cap=15.0, max_price_cap=800.0)
    elapsed = time.perf_counter() - t0
    
    assert_test(elapsed < 0.25, f"Performance budget exceeded: took {elapsed:.4f}s for {N} items")
    assert_test(np.all(res_large["capped_prices"] >= 15.0), "Values below min_price_cap found")
    assert_test(np.all(res_large["capped_prices"] <= 800.0), "Values above max_price_cap found")

    return report
''',
    "hints": [
        "Calculate percentage return using element-wise subtraction and division: `(current_prices - baseline_prices) / baseline_prices`.",
        "Use `np.abs(current_prices - baseline_prices)` to find the absolute difference.",
        "Compute discounted prices using scalar multiplication: `current_prices * (1.0 - discount_rate)`.",
        "Clamp prices within bounds using `np.clip(discounted, min_price_cap, max_price_cap)`."
    ]
}

# -----------------------------------------------------------------------------
# Challenge 2: Clamped Activation Function
# -----------------------------------------------------------------------------

CHALLENGE_2 = {
    "id": "d4-c2",
    "title": "Clamped Activation Function",
    "difficulty": "Intermediate",
    "category": "Universal Functions",
    "description": (
        "In deep learning and neural signal processing, activation functions transform input activations into bounded "
        "ranges while preventing exploding or vanishing values. Your task is to implement `clamped_exp_activation`, "
        "a custom mathematical transformation that computes an exponential decay with optional bias, strictly clamped "
        "within specified upper and lower thresholds using vectorized exponential operations and bounding functions with zero Python loops."
    ),
    "instructions": (
        "1. Implement `clamped_exp_activation(x: np.ndarray, scale: float = 1.0, decay: float = 0.5, bias: float = 0.0, min_val: float = 0.01, max_val: float = 0.99) -> np.ndarray`.\n"
        "2. Compute the raw exponential transformation: scale times the exponential of (-decay * x) plus bias.\n"
        "3. Clamp the values within [min_val, max_val].\n"
        "4. Return the resulting array with the exact same shape as input `x`.\n"
        "5. The function must work seamlessly on arrays of any shape (1D, 2D, 3D, etc.) and handle large positive or negative values without errors."
    ),
    "starter_code": r'''import numpy as np

def clamped_exp_activation(
    x: np.ndarray,
    scale: float = 1.0,
    decay: float = 0.5,
    bias: float = 0.0,
    min_val: float = 0.01,
    max_val: float = 0.99
) -> np.ndarray:
    """
    Compute clamped exponential decay activation using fast ufuncs:
    y = scale * exp(-decay * x) + bias, clamped within [min_val, max_val]
    
    Args:
        x: input numpy array of arbitrary shape
        scale: scalar amplitude multiplier
        decay: decay rate parameter
        bias: scalar or broadcastable bias offset added to the raw exponential
        min_val: lower clamping threshold
        max_val: upper clamping threshold
        
    Returns:
        np.ndarray: clamped activated values with the same shape as x
    """
    # TODO: Implement vectorized clamped exponential activation
    pass
''',
    "reference_solution": r'''import numpy as np

def clamped_exp_activation(
    x: np.ndarray,
    scale: float = 1.0,
    decay: float = 0.5,
    bias: float = 0.0,
    min_val: float = 0.01,
    max_val: float = 0.99
) -> np.ndarray:
    """
    Vectorized clamped exponential decay activation function.
    """
    raw = scale * np.exp(-decay * x) + bias
    return np.clip(raw, min_val, max_val)
''',
    "test_suite": r'''import numpy as np
import time

def run_tests(candidate_func):
    """
    Automated test harness for Challenge d4-c2: Clamped Activation Function.
    """
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # 1. Basic known values and clamping verification
    x_test = np.array([-10.0, 0.0, 2.0, 50.0])
    out = candidate_func(x_test, scale=1.0, decay=0.5, bias=0.0, min_val=0.01, max_val=0.99)
    assert_test(out.shape == x_test.shape, "Output shape must match input shape")
    assert_test(out[0] == 0.99, "Negative input should produce large value clamped to max_val (0.99)")
    assert_test(np.isclose(out[1], 0.99, atol=0.02), "x=0 must produce scale (1.0) clamped to max_val (0.99)")
    assert_test(out[-1] == 0.01, "Large positive input should decay to near 0 and clamp to min_val (0.01)")
    
    # 2. In-range transformation without clipping
    x_mid = np.array([1.0, 2.0, 3.0])
    out_mid = candidate_func(x_mid, scale=0.8, decay=0.5, bias=0.1, min_val=0.0, max_val=1.0)
    expected_mid = np.clip(0.8 * np.exp(-0.5 * x_mid) + 0.1, 0.0, 1.0)
    assert_test(np.allclose(out_mid, expected_mid, atol=1e-6), "Intermediate unclipped values mismatch")
    
    # 3. Arbitrary dimensionality check (3D array preservation)
    x_3d = np.random.randn(4, 5, 6)
    out_3d = candidate_func(x_3d, scale=2.0, decay=1.0, bias=-0.5, min_val=0.1, max_val=0.8)
    assert_test(out_3d.shape == (4, 5, 6), f"3D shape mismatch: expected (4,5,6), got {out_3d.shape}")
    assert_test(np.all(out_3d >= 0.1), "Output values below min_val found")
    assert_test(np.all(out_3d <= 0.8), "Output values above max_val found")
    
    # 4. Extreme values and boundary stability
    x_extreme = np.array([-50.0, -20.0, 0.0, 20.0, 50.0])
    out_extreme = candidate_func(x_extreme, scale=1.0, decay=1.0, min_val=0.01, max_val=10.0)
    assert_test(not np.any(np.isnan(out_extreme)), "NaN encountered on extreme values")
    assert_test(out_extreme[0] == 10.0, "Extreme negative input should clamp to max_val")
    assert_test(out_extreme[-1] == 0.01, "Extreme positive input should clamp to min_val")
    
    # 5. Benchmark throughput on 500,000 floats
    x_large = np.linspace(-5.0, 5.0, 500_000)
    t0 = time.perf_counter()
    out_large = candidate_func(x_large, scale=1.5, decay=0.8, min_val=0.05, max_val=0.95)
    elapsed = time.perf_counter() - t0
    assert_test(elapsed < 0.15, f"Performance budget exceeded: took {elapsed:.4f}s for 500,000 items")

    return report
''',
    "hints": [
        "Compute the raw decaying value using `scale * np.exp(-decay * x) + bias`.",
        "Pass the raw array into `np.clip(raw, min_val, max_val)`.",
        "Do not use loops; `np.exp` and `np.clip` work across arrays of any shape automatically."
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
