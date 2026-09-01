"""
Part 7: Broadcasting & Practical Linear Algebra
PyMastery Progressive NumPy Curriculum

A learner-friendly, highly intuitive guide to shape stretching,
elementwise operations vs matrix multiplication (@), transpositions,
and practical linear algebra applications.
"""

import numpy as np
import time
from typing import Dict, Any, List

DAY_METADATA = {
    "day_id": "day07",
    "day_number": 7,
    "title": "Part 7: Broadcasting & Practical Linear Algebra",
    "tagline": "Master intuitive shape stretching, matrix multiplication (@), and practical linear algebra without pointer complexity.",
    "estimated_time": "2-3 hours",
    "concepts_covered": [
        "Broadcasting rules & the intuitive rubber-sheet model",
        "Row-wise vs column-wise 1D vector stretching",
        "Elementwise multiplication (*) vs matrix multiplication (@)",
        "Matrix transposition (.T) & dot products",
        "Feature normalization (Min-Max scaling & Z-score standardization)",
        "Fast pairwise Euclidean distance matrix via matrix expansion"
    ]
}

CONCEPT_PRIMER = r"""# Part 7 Concept Primer: Broadcasting & Practical Linear Algebra

Welcome to Part 7! In this chapter, we explore two of NumPy's most powerful superpowers:
1. **Broadcasting**: Making arrays of different shapes work together seamlessly with zero memory copying.
2. **Practical Linear Algebra**: Knowing when to use elementwise arithmetic (`*`) vs true matrix multiplication (`@`), transpositions (`.T`), and dot products.

Forget intimidating C-level pointer arithmetic—we will build clean, intuitive visual models that any programmer can immediately understand.

---

## 1. The Intuitive Mental Model: The Rubber-Sheet Principle

Imagine you have a 2D grid (a matrix with 3 rows and 4 columns) and a single strip of 4 numbers (a 1D vector of length 4):

```
Matrix A (3 rows, 4 cols):         Vector v (4 elements):
[ 10,  20,  30,  40 ]              [ 1,  2,  3,  4 ]
[ 50,  60,  70,  80 ]
[ 90, 100, 110, 120 ]
```

In a traditional programming language like standard Python, C, or Java, if you wanted to add `v` to every row of `A`, you would write a nested `for` loop:
```python
# Slow, repetitive Python loop:
for i in range(3):
    for j in range(4):
        A[i, j] += v[j]
```

In NumPy, you simply write:
```python
result = A + v
```

### How does NumPy do this?
Think of vector `v` as a rubber strip. NumPy notices that `A` has 3 rows and `v` only has 1 row. Instead of copying `v` into memory 3 times, NumPy **virtually stretches** `v` down across all 3 rows:

```
[ 1, 2, 3, 4 ]  --> stretched to row 0
[ 1, 2, 3, 4 ]  --> stretched to row 1
[ 1, 2, 3, 4 ]  --> stretched to row 2
```

Then it performs the addition in lightning-fast compiled machine code. Even better: **zero extra memory is allocated**. NumPy simply repeats access to the same 4 numbers.

---

## 2. The Two Golden Rules of Broadcasting

When can two arrays broadcast together? NumPy follows two simple, unambiguous rules:

### Rule 1: Align shapes from Right to Left (Trailing Dimensions)
Compare the dimension sizes of both arrays starting from the **rightmost (trailing) axis** and working backwards towards the left:

```
Array A:   ( 3 ,  4 )
Array B:          ( 4 )
             ^    ^
             |    Match! Rightmost dimensions are both 4.
             Left dimension of B is missing, so NumPy assumes 1!
```

### Rule 2: Dimensions are Compatible if:
1. They are **equal**, OR
2. One of them is **1** (or missing).

If a dimension is `1` (or missing), NumPy stretches that dimension to match the larger size. If neither condition is met (for example, comparing `4` with `3`), NumPy raises a `ValueError: operands could not be broadcast together`.

---

## 3. Stretching Across Rows vs Stretching Across Columns

This is the most common hurdle for beginners, and once you visualize it, you will never get stuck again!

### Scenario A: Stretching Across Rows (Default for 1D vectors)
- Matrix shape: `(3, 4)`  (3 rows, 4 columns)
- Vector shape: `(4,)`    (4 numbers)

Comparing from right to left:
- Trailing axis: `4` vs `4` (Match!)
- Leading axis: `3` vs `missing` (Vector stretches across 3 rows)

The vector is applied to **each row**.

### Scenario B: Stretching Across Columns (Needs shape `(3, 1)`)
What if you have 3 numbers (one for each row) and want to subtract them from each column?
- Matrix shape: `(3, 4)`
- Vector shape: `(3,)`

Let's check Rule 1:
```
Matrix:  ( 3 , 4 )
Vector:        ( 3 )
               ^
               4 != 3! Incompatible!
```
NumPy throws an error because it aligns from the right!
To fix this, we must tell NumPy that the 3 numbers correspond to **rows**, meaning our vector should be a column vector of shape `(3, 1)`:

```python
col_vector = v[:, np.newaxis]  # or v.reshape(3, 1) or v[:, None]
# Shape is now (3, 1)
```

Now compare:
```
Matrix:      ( 3 , 4 )
Col Vector:  ( 3 , 1 )
               ^   ^
               |   1 stretches to 4 (stretches across columns!)
               Equal (3 == 3)
```
Now NumPy stretches the single column horizontally across all 4 columns!

---

## 4. Elementwise (`*`) vs Matrix Multiplication (`@`)

One of the most critical distinctions in practical scientific programming is knowing when to use `*` and when to use `@`.

| Operator | Name | What it does | Shape Requirement |
| :--- | :--- | :--- | :--- |
| `A * B` | Elementwise (Hadamard) | Multiplies matching elements: `C[i,j] = A[i,j] * B[i,j]` | Shapes must be identical or broadcastable |
| `A @ B` | Matrix Multiplication (GEMM) | Computes dot products of rows of A and columns of B | Inner dimensions must match: `(M, K) @ (K, N) -> (M, N)` |

### Visualizing Elementwise `*`:
```
[[1, 2],    *    [[10, 20],    =    [[1*10, 2*20],    =    [[10,  40],
 [3, 4]]          [30, 40]]          [3*30, 4*40]]          [90, 160]]
```

### Visualizing Matrix Product `@`:
```
[[1, 2],    @    [[10, 20],    =    [[1*10 + 2*30,  1*20 + 2*40],    =    [[ 70, 100],
 [3, 4]]          [30, 40]]          [3*10 + 4*30,  3*20 + 4*40]]          [150, 220]]
```

Use `*` when you want to scale or weight values element-by-element (e.g. applying a mask, discount rate, or conversion factor).
Use `@` when performing linear algebra, rotating vectors, combining asset portfolios, or applying linear neural network layers.

---

## 5. Transposition (`.T`) and Dot Products

### Transpose: Swapping Axes
Calling `A.T` swaps the rows and columns of a 2D matrix:
- If `A` has shape `(100, 10)`, `A.T` has shape `(10, 100)`.
- Crucially, `A.T` is an **instantaneous zero-copy view**: NumPy doesn't move any numbers in memory, it simply swaps the dimension order!

### Dot Product: The Core Primitive
For two 1D vectors `u` and `v` of length $N$:
$$\mathbf{u} \cdot \mathbf{v} = \sum_{i=1}^N u_i v_i$$
In NumPy, this is cleanly expressed as `u @ v` or `np.dot(u, v)`.

---

## 6. Practical Feature Normalization

In machine learning and data science, raw datasets contain features with drastically different scales (e.g., Age in years [18-80] vs Salary in dollars [30,000-200,000]). Models train poorly when one feature dominates the scale.

We normalize datasets along columns (`axis=0`, across all samples):

1. **Min-Max Scaling** (scales values into $[0, 1]$):
   $$X_{\text{norm}} = \frac{X - \min(X, \text{axis}=0)}{\max(X, \text{axis}=0) - \min(X, \text{axis}=0) + \epsilon}$$

2. **Z-Score Standardization** (scales to mean 0, variance 1):
   $$X_{\text{norm}} = \frac{X - \mu}{\sigma + \epsilon}$$
   where $\mu = \text{mean}(X, \text{axis}=0)$ and $\sigma = \text{std}(X, \text{axis}=0)$.

Because $\min$, $\max$, $\mu$, and $\sigma$ computed along `axis=0` return a 1D vector of shape `(D,)`, NumPy's broadcasting rules automatically stretch them down all `N` rows with zero loops!
"""

WALKTHROUGH = r"""# Part 7 Walkthrough: Hands-On Broadcasting & Linear Algebra

Let's test these concepts interactively in Python.

```python
import numpy as np

# 1. Understanding 1D Vector Stretching
data = np.array([
    [10.0, 20.0, 30.0],
    [40.0, 50.0, 60.0],
    [70.0, 80.0, 90.0]
])  # Shape: (3, 3)

row_shift = np.array([1.0, 2.0, 3.0])  # Shape: (3,)
# Stretches across rows (applied to each row):
print("Row-wise addition:")
print(data + row_shift)
# [[11., 22., 33.],
#  [41., 52., 63.],
#  [71., 82., 93.]]

# 2. Stretching a Column Vector across Columns
col_shift = np.array([100.0, 200.0, 300.0])[:, np.newaxis]  # Shape: (3, 1)
print("\nColumn-wise addition:")
print(data + col_shift)
# [[110., 120., 130.],
#  [240., 250., 260.],
#  [370., 380., 390.]]

# 3. Elementwise (*) vs Matrix Multiplication (@)
weights = np.array([0.2, 0.5, 0.3])  # Shape: (3,)

# Elementwise: Scales each column by its weight
weighted_data = data * weights
print("\nElementwise scaling (data * weights):")
print(weighted_data)

# Matrix Multiplication: Computes weighted sum per row in one operation
row_weighted_totals = data @ weights  # Shape: (3, 3) @ (3,) -> Shape (3,)
print("\nWeighted total per row (data @ weights):")
print(row_weighted_totals)

# 4. Feature Normalization without Loops
means = np.mean(data, axis=0)  # Shape: (3,)
stds = np.std(data, axis=0)    # Shape: (3,)
standardized = (data - means) / (stds + 1e-8)
print("\nStandardized Features (mean ~0, std ~1):")
print(standardized)
```
"""

# -----------------------------------------------------------------------------
# Challenge 1: Feature Matrix Normalizer
# -----------------------------------------------------------------------------

CHALLENGE_1 = {
    "id": "d7-c1",
    "title": "Feature Matrix Normalizer",
    "difficulty": "Intermediate",
    "category": "Broadcasting & Data Preprocessing",
    "description": (
        "In machine learning, datasets must be normalized so features with large values "
        "(e.g., house prices in hundreds of thousands) do not overpower smaller features "
        "(e.g., number of bedrooms). Implement `normalize_features(X, method='minmax', eps=1e-8)` "
        "to normalize a 2D dataset along each feature column using NumPy broadcasting with ZERO loops."
    ),
    "instructions": (
        "1. Implement `normalize_features(X: np.ndarray, method: str = 'minmax', eps: float = 1e-8) -> np.ndarray`.\n"
        "2. Input `X` is a 2D array of shape `(N, D)` representing `N` samples and `D` features. If `X` is not 2D, raise `ValueError`.\n"
        "3. Supported `method` values:\n"
        "   - `'minmax'`: Scale each feature column into the range $[0, 1]$:\n"
        "     $$X_{\\text{norm}} = \\frac{X - \\min(X, \\text{axis}=0)}{\\max(X, \\text{axis}=0) - \\min(X, \\text{axis}=0) + \\epsilon}$$\n"
        "   - `'zscore'` (or `'standard'`): Standardize each column to have zero mean and unit variance:\n"
        "     $$X_{\\text{norm}} = \\frac{X - \\text{mean}(X, \\text{axis}=0)}{\\text{std}(X, \\text{axis}=0) + \\epsilon}$$\n"
        "   - If an unknown method name is passed, raise `ValueError`.\n"
        "4. Use `eps` to prevent division by zero for constant feature columns.\n"
        "5. Return a new `float64` array of shape `(N, D)`.\n"
        "6. STRICT REQUIREMENT: No `for` or `while` loops."
    ),
    "starter_code": r'''import numpy as np

def normalize_features(X: np.ndarray, method: str = 'minmax', eps: float = 1e-8) -> np.ndarray:
    """
    Normalize features in 2D matrix X along axis 0 using broadcasting.
    
    Args:
        X: (N, D) 2D array of samples and features
        method: 'minmax' for [0, 1] scaling or 'zscore' / 'standard' for zero-mean unit-variance
        eps: small epsilon added to denominator to avoid division by zero
        
    Returns:
        (N, D) float64 normalized array
    """
    # TODO: Implement vectorized feature normalization using broadcasting
    pass
''',
    "reference_solution": r'''import numpy as np

def normalize_features(X: np.ndarray, method: str = 'minmax', eps: float = 1e-8) -> np.ndarray:
    """
    Normalize features in 2D matrix X along axis 0 using broadcasting.
    """
    X_arr = np.asarray(X, dtype=np.float64)
    if X_arr.ndim != 2:
        raise ValueError(f"Expected 2D array, got ndim={X_arr.ndim}")
        
    m = method.lower()
    if m == 'minmax':
        col_min = np.min(X_arr, axis=0)
        col_max = np.max(X_arr, axis=0)
        return (X_arr - col_min) / (col_max - col_min + eps)
    elif m in ('zscore', 'standard'):
        col_mean = np.mean(X_arr, axis=0)
        col_std = np.std(X_arr, axis=0)
        return (X_arr - col_mean) / (col_std + eps)
    else:
        raise ValueError(f"Unknown normalization method '{method}'. Choose 'minmax' or 'zscore'.")
''',
    "test_suite": r'''import numpy as np

def run_tests(candidate_func):
    """
    Comprehensive test suite for Feature Matrix Normalizer
    """
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # 1. Min-Max Scaling on standard 2D matrix
    X = np.array([[10.0, 200.0],
                  [20.0, 100.0],
                  [30.0, 300.0]], dtype=np.float64)
    res_mm = candidate_func(X, method="minmax")
    assert_test(res_mm.shape == (3, 2), f"MinMax shape mismatch: expected (3, 2), got {res_mm.shape}")
    expected_col0 = np.array([0.0, 0.5, 1.0])
    expected_col1 = np.array([0.5, 0.0, 1.0])
    assert_test(np.allclose(res_mm[:, 0], expected_col0, atol=1e-6), "MinMax col 0 values incorrect")
    assert_test(np.allclose(res_mm[:, 1], expected_col1, atol=1e-6), "MinMax col 1 values incorrect")
    assert_test(np.all(res_mm >= 0.0) and np.all(res_mm <= 1.0), "MinMax values out of [0, 1] range")

    # 2. Z-Score Standardization
    res_zs = candidate_func(X, method="zscore")
    assert_test(res_zs.shape == (3, 2), f"Z-score shape mismatch: expected (3, 2), got {res_zs.shape}")
    assert_test(np.allclose(np.mean(res_zs, axis=0), 0.0, atol=1e-6), "Z-score standardized mean should be 0")
    assert_test(np.allclose(np.std(res_zs, axis=0), 1.0, atol=1e-6), "Z-score standardized std should be 1")

    # 3. 'standard' alias test
    res_std = candidate_func(X, method="standard")
    assert_test(np.allclose(res_std, res_zs, atol=1e-6), "'standard' alias should match 'zscore'")

    # 4. Constant feature column with epsilon stability
    X_const = np.array([[5.0, 1.0], [5.0, 2.0], [5.0, 3.0]])
    res_const_mm = candidate_func(X_const, method="minmax", eps=1e-8)
    assert_test(not np.any(np.isnan(res_const_mm)), "MinMax produced NaN on constant column")
    assert_test(np.allclose(res_const_mm[:, 0], 0.0, atol=1e-4), "Constant column should scale to ~0 in MinMax")
    res_const_zs = candidate_func(X_const, method="zscore", eps=1e-8)
    assert_test(not np.any(np.isnan(res_const_zs)), "Z-score produced NaN on constant column")

    # 5. Dimension check & Invalid inputs
    try:
        candidate_func(np.array([1.0, 2.0, 3.0]))
        assert_test(False, "Should raise ValueError for 1D input")
    except ValueError:
        report["tests_run"] += 1
    except Exception as e:
        assert_test(False, f"Expected ValueError for 1D input, got {type(e).__name__}")

    try:
        candidate_func(X, method="unknown_metric")
        assert_test(False, "Should raise ValueError for invalid method name")
    except ValueError:
        report["tests_run"] += 1
    except Exception as e:
        assert_test(False, f"Expected ValueError for invalid method name, got {type(e).__name__}")

    return report
''',
    "hints": [
        "Calculate column statistics along `axis=0` (e.g. `col_min = np.min(X, axis=0)`).",
        "The resulting 1D statistic array of shape (D,) automatically broadcasts across all N rows.",
        "Add `eps` directly to the denominator `(col_max - col_min + eps)` or `(col_std + eps)`."
    ]
}

# -----------------------------------------------------------------------------
# Challenge 2: Weighted Portfolio Multiplier
# -----------------------------------------------------------------------------

CHALLENGE_2 = {
    "id": "d7-c2",
    "title": "Weighted Portfolio Multiplier",
    "difficulty": "Intermediate",
    "category": "Matrix Multiplication & Finance",
    "description": (
        "In algorithmic trading and asset management, evaluating portfolio performance requires "
        "combining individual asset returns by their allocation weights. Compute multi-period weighted "
        "portfolio returns in a single operation using NumPy matrix multiplication (@)."
    ),
    "instructions": (
        "1. Implement `compute_portfolio_returns(returns: np.ndarray, weights: np.ndarray) -> np.ndarray`.\n"
        "2. `returns` is a 2D array of shape `(T, N)` representing `N` asset returns across `T` time periods. If `returns` is not 2D, raise `ValueError`.\n"
        "3. `weights` can be:\n"
        "   - A 1D array of shape `(N,)` for a single portfolio allocation.\n"
        "   - A 2D array of shape `(N, P)` representing `P` different portfolio strategies.\n"
        "4. Ensure weights are normalized so they sum to 1.0 along the asset axis (`axis=0`). If the sum of weights is zero or close to zero, raise `ValueError('Weights sum to zero')`.\n"
        "5. Verify dimension alignment: the number of assets in `returns` (`shape[1]`) must equal the number of assets in `weights` (`shape[0]`). If not, raise `ValueError`.\n"
        "6. Compute the portfolio return using the matrix multiplication operator `@`:\n"
        "   - For 1D weights `(N,)`, returns a 1D array of shape `(T,)`.\n"
        "   - For 2D weights `(N, P)`, returns a 2D array of shape `(T, P)`.\n"
        "7. STRICT REQUIREMENT: No Python loops."
    ),
    "starter_code": r'''import numpy as np

def compute_portfolio_returns(returns: np.ndarray, weights: np.ndarray) -> np.ndarray:
    """
    Compute weighted portfolio returns using matrix multiplication (@).
    
    Args:
        returns: (T, N) array of asset returns over T time periods
        weights: (N,) or (N, P) array of asset allocation weights
        
    Returns:
        (T,) or (T, P) float64 array of weighted portfolio returns
    """
    # TODO: Normalize weights and compute portfolio returns via matrix multiplication
    pass
''',
    "reference_solution": r'''import numpy as np

def compute_portfolio_returns(returns: np.ndarray, weights: np.ndarray) -> np.ndarray:
    """
    Compute weighted portfolio returns using matrix multiplication (@).
    """
    R = np.asarray(returns, dtype=np.float64)
    W = np.asarray(weights, dtype=np.float64)
    
    if R.ndim != 2:
        raise ValueError(f"Returns must be a 2D array (T, N), got ndim={R.ndim}")
        
    # Check weight sum along asset axis
    w_sum = np.sum(W, axis=0, keepdims=True)
    if np.any(np.isclose(w_sum, 0.0)):
        raise ValueError("Weights sum to zero")
        
    W_norm = W / w_sum
    if W.ndim == 1:
        W_norm = W_norm.squeeze()
        
    if R.shape[1] != W.shape[0]:
        raise ValueError(f"Asset count mismatch: returns has {R.shape[1]} assets, weights has {W.shape[0]}")
        
    return R @ W_norm
''',
    "test_suite": r'''import numpy as np

def run_tests(candidate_func):
    """
    Comprehensive test suite for Weighted Portfolio Multiplier
    """
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # 1. Basic 1D weights on (T, N) returns
    returns = np.array([
        [0.01, 0.02, 0.03],
        [-0.02, 0.01, 0.04],
        [0.00, -0.01, 0.02],
        [0.05, 0.03, -0.02]
    ], dtype=np.float64)
    weights = np.array([1/3, 1/3, 1/3], dtype=np.float64)
    port_ret = candidate_func(returns, weights)
    assert_test(port_ret.shape == (4,), f"Expected shape (4,), got {port_ret.shape}")
    expected_ret = np.mean(returns, axis=1)
    assert_test(np.allclose(port_ret, expected_ret, atol=1e-6), "Equal weighted portfolio returns mismatch")

    # 2. Unnormalized weights auto-normalized
    unnorm_weights = np.array([2.0, 3.0, 5.0])  # sum = 10.0 -> [0.2, 0.3, 0.5]
    res_unnorm = candidate_func(returns, unnorm_weights)
    expected_unnorm = returns @ np.array([0.2, 0.3, 0.5])
    assert_test(np.allclose(res_unnorm, expected_unnorm, atol=1e-6), "Unnormalized weights auto-scaling failed")

    # 3. Multiple portfolio allocation strategies (2D weights: (N, P))
    weights_2d = np.array([
        [0.8, 0.1],
        [0.1, 0.3],
        [0.1, 0.6]
    ])
    res_multi = candidate_func(returns, weights_2d)
    assert_test(res_multi.shape == (4, 2), f"Expected shape (4, 2) for multi-portfolio, got {res_multi.shape}")
    assert_test(np.allclose(res_multi[:, 0], returns @ weights_2d[:, 0], atol=1e-6), "Portfolio 1 returns mismatch")
    assert_test(np.allclose(res_multi[:, 1], returns @ weights_2d[:, 1], atol=1e-6), "Portfolio 2 returns mismatch")

    # 4. Dimension mismatch check
    bad_weights = np.array([0.5, 0.5])  # 2 weights for 3 assets
    try:
        candidate_func(returns, bad_weights)
        assert_test(False, "Should raise ValueError when asset count != weight count")
    except ValueError:
        report["tests_run"] += 1
    except Exception as e:
        assert_test(False, f"Expected ValueError, got {type(e).__name__}")

    # 5. Zero sum weights check
    zero_weights = np.array([0.0, 0.0, 0.0])
    try:
        candidate_func(returns, zero_weights)
        assert_test(False, "Should raise ValueError when sum of weights is 0")
    except ValueError:
        report["tests_run"] += 1
    except Exception as e:
        assert_test(False, f"Expected ValueError, got {type(e).__name__}")

    return report
''',
    "hints": [
        "Normalize weights by dividing by `np.sum(weights, axis=0, keepdims=True)`.",
        "Check that `returns.shape[1] == weights.shape[0]` before multiplying.",
        "Use the matrix multiplication operator: `returns @ normalized_weights`."
    ]
}

# -----------------------------------------------------------------------------
# Challenge 3: Fast Pairwise Euclidean Distance Matrix (Bonus Capstone)
# -----------------------------------------------------------------------------

CHALLENGE_3 = {
    "id": "d7-c3",
    "title": "Fast Pairwise Euclidean Distance Matrix (Bonus Capstone)",
    "difficulty": "Advanced",
    "category": "Broadcasting & Matrix Algebra Capstone",
    "description": (
        "OPTIONAL BONUS CAPSTONE: In clustering (K-Means), spatial indexing (KNN), and physics simulations, "
        "calculating all pairwise distances between two sets of points is fundamental. Given point set X "
        "of shape (N, D) and Y of shape (M, D), compute the (N, M) distance matrix using binomial expansion, "
        "broadcasting, and matrix multiplication (@) with ZERO Python loops."
    ),
    "instructions": (
        "1. Implement `pairwise_euclidean_distance(X: np.ndarray, Y: np.ndarray) -> np.ndarray`.\n"
        "2. Input `X` has shape `(N, D)` and `Y` has shape `(M, D)`. If inputs are not 2D or feature dimensions differ, raise `ValueError`.\n"
        "3. Output is a 2D float64 array of shape `(N, M)` where element `(i, j)` is the Euclidean distance $\\|X_i - Y_j\\|_2$.\n"
        "4. Use the binomial expansion formula:\n"
        "   $$\\|X_i - Y_j\\|^2 = \\|X_i\\|^2 + \\|Y_j\\|^2 - 2 (X_i \\cdot Y_j)$$\n"
        "   - Compute row squared norms of `X` as shape `(N, 1)`: `np.sum(X**2, axis=1, keepdims=True)`\n"
        "   - Compute row squared norms of `Y` as shape `(1, M)`: `np.sum(Y**2, axis=1, keepdims=True).T`\n"
        "   - Compute cross dot products via matrix multiplication: `X @ Y.T` of shape `(N, M)`\n"
        "5. Clamp squared distances using `np.maximum(dist_sq, 0.0)` before `np.sqrt` to prevent negative values from floating-point inaccuracies.\n"
        "6. STRICT REQUIREMENT: No `for` or `while` loops."
    ),
    "starter_code": r'''import numpy as np

def pairwise_euclidean_distance(X: np.ndarray, Y: np.ndarray) -> np.ndarray:
    """
    Compute pairwise Euclidean distance between point sets X and Y.
    
    Args:
        X: (N, D) float64 array of N points
        Y: (M, D) float64 array of M points
        
    Returns:
        (N, M) float64 array of pairwise Euclidean distances
    """
    # TODO: Implement zero-loop pairwise distance using expansion, broadcasting, and @
    pass
''',
    "reference_solution": r'''import numpy as np

def pairwise_euclidean_distance(X: np.ndarray, Y: np.ndarray) -> np.ndarray:
    """
    Compute pairwise Euclidean distance using the algebraic expansion:
    ||x - y||^2 = ||x||^2 + ||y||^2 - 2(x . y)
    """
    X_arr = np.asarray(X, dtype=np.float64)
    Y_arr = np.asarray(Y, dtype=np.float64)
    
    if X_arr.ndim != 2 or Y_arr.ndim != 2:
        raise ValueError(f"Expected 2D arrays, got X={X_arr.ndim}D, Y={Y_arr.ndim}D")
    if X_arr.shape[1] != Y_arr.shape[1]:
        raise ValueError(f"Feature dimension mismatch: X has {X_arr.shape[1]}, Y has {Y_arr.shape[1]}")
        
    x_sq = np.sum(X_arr ** 2, axis=1, keepdims=True)   # Shape (N, 1)
    y_sq = np.sum(Y_arr ** 2, axis=1, keepdims=True).T  # Shape (1, M)
    cross = X_arr @ Y_arr.T                             # Shape (N, M)
    
    dist_sq = np.maximum(x_sq + y_sq - 2.0 * cross, 0.0)
    return np.sqrt(dist_sq)
''',
    "test_suite": r'''import numpy as np

def run_tests(candidate_func):
    """
    Comprehensive test suite for Pairwise Euclidean Distance Matrix (Bonus Capstone)
    """
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # 1. Simple known 2D points: Pythagorean triples
    A = np.array([[0.0, 0.0], [3.0, 4.0]], dtype=np.float64)
    B = np.array([[0.0, 0.0], [6.0, 8.0], [3.0, 0.0]], dtype=np.float64)
    res = candidate_func(A, B)
    assert_test(res.shape == (2, 3), f"Expected shape (2, 3), got {res.shape}")
    expected = np.array([
        [0.0, 10.0, 3.0],
        [5.0, 5.0, 4.0]
    ])
    assert_test(np.allclose(res, expected, atol=1e-6), "Pythagorean points distance mismatch")

    # 2. Self-distance symmetry and diagonal zero
    np.random.seed(42)
    X_rand = np.random.randn(50, 8)
    self_dist = candidate_func(X_rand, X_rand)
    assert_test(self_dist.shape == (50, 50), f"Expected self distance shape (50, 50), got {self_dist.shape}")
    assert_test(np.allclose(np.diag(self_dist), 0.0, atol=1e-6), "Diagonal of self distance must be zero")
    assert_test(np.allclose(self_dist, self_dist.T, atol=1e-6), "Self distance matrix must be symmetric")

    # 3. High-dimensional accuracy check against broadcasting ground truth
    N, M, D = 100, 80, 32
    X_high = np.random.randn(N, D)
    Y_high = np.random.randn(M, D)
    dist_high = candidate_func(X_high, Y_high)
    ground_truth = np.sqrt(np.sum((X_high[:, np.newaxis, :] - Y_high[np.newaxis, :, :]) ** 2, axis=-1))
    assert_test(dist_high.shape == (N, M), f"Shape mismatch: {dist_high.shape} vs {(N, M)}")
    assert_test(np.allclose(dist_high, ground_truth, atol=1e-5), "High-dimensional values failed against broadcast ground truth")

    # 4. Dimension mismatch check
    Z_bad = np.random.randn(20, 16)
    try:
        candidate_func(X_high, Z_bad)
        assert_test(False, "Should raise ValueError when feature dimension D mismatches")
    except ValueError:
        report["tests_run"] += 1
    except Exception as e:
        assert_test(False, f"Expected ValueError, got {type(e).__name__}")

    # 5. Non-2D inputs check
    try:
        candidate_func(np.array([1.0, 2.0]), np.array([3.0, 4.0]))
        assert_test(False, "Should raise ValueError for 1D inputs")
    except ValueError:
        report["tests_run"] += 1
    except Exception as e:
        assert_test(False, f"Expected ValueError, got {type(e).__name__}")

    return report
''',
    "hints": [
        "Use `np.sum(X**2, axis=1, keepdims=True)` to get shape (N, 1).",
        "Use `np.sum(Y**2, axis=1, keepdims=True).T` to get shape (1, M).",
        "Compute the cross dot product as `X @ Y.T`.",
        "Add them up: `(N, 1) + (1, M) - 2 * (N, M)` automatically broadcasts to (N, M).",
        "Wrap the sum in `np.maximum(..., 0.0)` before taking `np.sqrt`."
    ]
}

CHALLENGES = [CHALLENGE_1, CHALLENGE_2, CHALLENGE_3]

CURRICULUM_DATA = {
    **DAY_METADATA,
    "concept_primer": CONCEPT_PRIMER,
    "walkthrough": WALKTHROUGH,
    "challenges": CHALLENGES
}

def get_curriculum() -> Dict[str, Any]:
    """Returns the Part 7 curriculum dictionary."""
    return CURRICULUM_DATA
