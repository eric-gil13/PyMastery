"""
Part 5: Aggregations, Statistics & Multi-Dimensional Axes
PyMastery Progressive NumPy Curriculum
"""

import numpy as np
import time
from typing import Dict, Any, List

DAY_METADATA = {
    "day_id": "day05",
    "day_number": 5,
    "title": "Part 5: Aggregations, Statistics & Multi-Dimensional Axes",
    "tagline": "Squash dimensions with confidence: master axis reduction, summary statistics, argmax/argmin, and running totals.",
    "estimated_time": "2-3 hours",
    "concepts_covered": [
        "The Axis Mental Model (Collapsing dimensions: axis=0 down columns vs axis=1 across rows)",
        "Summary statistics (np.sum, np.mean, np.std, np.var, np.min, np.max)",
        "Extreme value location with np.argmax and np.argmin",
        "Preserving broadcast compatibility with keepdims=True",
        "Cumulative aggregations with np.cumsum and np.cumprod",
        "Zero-centering and statistical outlier detection without loops"
    ]
}

CONCEPT_PRIMER = r"""# Part 5 Concept Primer: Aggregations, Statistics & Multi-Dimensional Axes

## 1. The Big Picture: Why Vectorized Aggregations Matter
In data science, machine learning, and quantitative engineering, almost every analytical pipeline ends in an aggregation:
* Calculating the average loss across a batch of training images
* Computing the standard deviation of daily stock returns to evaluate risk
* Finding which student achieved the highest grade or which server experienced peak traffic

In standard Python, computing these metrics on a 2D list requires nested `for` loops with accumulator variables. In NumPy, aggregations run inside pre-compiled C loops that execute dozens of times faster and require only a single, expressive line of code.

---

## 2. The Golden Rule of Axes: "What Gets Collapsed?"
The single most common question beginners ask in NumPy is:
> *"Does `axis=0` mean rows or columns?"*

The easiest mental model is:
**The axis you specify is the dimension that gets collapsed (squashed down).**

Imagine a 2D gradebook with 3 students (rows) and 4 exams (columns):

```
                   axis = 1  --> (Collapses columns horizontally across each row)
                                Exam 0   Exam 1   Exam 2   Exam 3
                  +--------+--------+--------+--------+
      Student 0   |   85   |   90   |   78   |   92   |  ==> Student 0 Average = 86.25
                  +--------+--------+--------+--------+
      Student 1   |   92   |   88   |   95   |   98   |  ==> Student 1 Average = 93.25
                  +--------+--------+--------+--------+
      Student 2   |   70   |   65   |   80   |   75   |  ==> Student 2 Average = 72.50
                  +--------+--------+--------+--------+
                       |        |        |        |
                       v        v        v        v
axis = 0  ======>    82.33    81.00    84.33    88.33
(Collapses rows down each column -> Class Average per Exam)
```

### Summary of the Axis Rule:
1. **`axis=None` (Default):** Flattens the entire array and computes a single scalar across all elements (e.g. `scores.mean()` returns overall class GPA).
2. **`axis=0`:** Collapses the **first dimension** (rows). You move vertically down each column. The row dimension disappears, leaving 1 result per column:
   $$\text{Shape } (3, 4) \xrightarrow{\text{axis}=0} (4,)$$
3. **`axis=1`:** Collapses the **second dimension** (columns). You move horizontally across each row. The column dimension disappears, leaving 1 result per row:
   $$\text{Shape } (3, 4) \xrightarrow{\text{axis}=1} (3,)$$

---

## 3. The Power of `keepdims=True`
When you perform an aggregation like `scores.mean(axis=1)`, NumPy reduces a 2D array of shape `(3, 4)` into a 1D vector of shape `(3,)`.

What happens if you want to subtract each student's average from their individual exam scores (to see which exams were above or below their personal baseline)?
```python
# Naive attempt:
student_means = scores.mean(axis=1)       # Shape: (3,)
centered = scores - student_means          # ValueError! Operands could not be broadcast together with shapes (3,4) (3,)
```
Because trailing dimensions are aligned during broadcasting, NumPy tries to match `(3,)` against the last dimension (4 columns), causing a shape mismatch error!

### The Solution: `keepdims=True`
By setting `keepdims=True`, the reduced axis is retained with size 1:
```python
student_means_2d = scores.mean(axis=1, keepdims=True)  # Shape: (3, 1)
centered = scores - student_means_2d                   # Perfect! (3, 4) - (3, 1) -> (3, 4)
```
Each row now has its personal average subtracted with zero extra code and zero memory copies.

---

## 4. Finding Extreme Positions: `argmin` and `argmax`
Sometimes you don't just want the maximum value; you want to know **where** that maximum value is located:
* `np.max(scores)` returns `98` (the highest score).
* `np.argmax(scores, axis=1)` returns `[3, 3, 2]`, indicating the exam index where each student performed best!
* `np.argmin(scores.mean(axis=0))` returns `1`, telling the professor that Exam 1 had the lowest average score (hardest exam).

---

## 5. Running Totals: `cumsum` (Cumulative Sum)
Instead of collapsing an array into a single summary number, cumulative operations compute a running tally across time:
```python
cashflows = np.array([100, -30, 50, -20])
balance = np.cumsum(cashflows)
# balance -> [100, 70, 120, 100]
```
`np.cumsum` preserves the original array shape and is heavily used for financial balances, cumulative probability distributions (CDFs), and physical trajectory tracking.
"""

WALKTHROUGH = r"""# Part 5 Walkthrough: Hands-On Aggregations & Axes

Let's test these concepts with practical, interactive code examples.

```python
import numpy as np

# 1. Create a 3x4 Gradebook: 3 students, 4 exams
scores = np.array([
    [85.0, 90.0, 78.0, 92.0],
    [92.0, 88.0, 95.0, 98.0],
    [70.0, 65.0, 80.0, 75.0]
])

print("Original Gradebook (3 Students x 4 Exams):")
print(scores)

# 2. Overall Class Summary (axis=None flattens array)
overall_mean = np.mean(scores)
overall_std = np.std(scores)
print(f"\nOverall Class Mean: {overall_mean:.2f}")
print(f"Overall Class Std Dev: {overall_std:.2f}")

# 3. Student Averages (axis=1 collapses columns across rows)
student_averages = np.mean(scores, axis=1)
print(f"\nStudent Averages (axis=1): {student_averages}")

# 4. Exam Difficulty (axis=0 collapses rows down columns)
exam_means = np.mean(scores, axis=0)
exam_stds = np.std(scores, axis=0)
print(f"Exam Means (axis=0): {exam_means}")
print(f"Exam Stds (axis=0):  {exam_stds}")

# 5. Identifying Key Individuals and Exams
valedictorian_idx = np.argmax(student_averages)
hardest_exam_idx = np.argmin(exam_means)
print(f"\nTop Student Index: {valedictorian_idx} (Average: {student_averages[valedictorian_idx]:.2f})")
print(f"Hardest Exam Index: {hardest_exam_idx} (Mean: {exam_means[hardest_exam_idx]:.2f})")

# 6. Centering Scores with keepdims=True
student_means_2d = np.mean(scores, axis=1, keepdims=True)
print(f"\nStudent Means with keepdims=True shape: {student_means_2d.shape}")
zero_centered = scores - student_means_2d
print("Scores Centered Around Each Student's Average:")
print(zero_centered)
print("Row Means of Centered Matrix (should all be 0.0):", np.mean(zero_centered, axis=1))

# 7. Running Cumulative Cashflow
daily_pnl = np.array([500.0, -120.0, 350.0, -400.0, 800.0])
cumulative_wealth = np.cumsum(daily_pnl)
print(f"\nDaily PnL: {daily_pnl}")
print(f"Cumulative Balance: {cumulative_wealth}")
print(f"Peak Wealth Day: Step {np.argmax(cumulative_wealth)} with balance ${np.max(cumulative_wealth):.2f}")
```
"""

# -----------------------------------------------------------------------------
# Challenge 1: Student Scorecard Aggregator
# -----------------------------------------------------------------------------

CHALLENGE_1 = {
    "id": "d5-c1",
    "title": "Student Scorecard Aggregator",
    "difficulty": "Beginner",
    "category": "Aggregations & Statistics",
    "description": (
        "You are tasked with building the analytical engine for an automated academic gradebook. "
        "Given a 2D NumPy array representing exam scores for N students across M exams, compute "
        "student averages, exam difficulties, find the top-performing student and hardest exam, "
        "and zero-center each student's scores using broadcasting with keepdims."
    ),
    "instructions": (
        "Implement `aggregate_scorecard(scores: np.ndarray) -> dict` with the following requirements:\n"
        "1. Input `scores` is a 2D array of shape `(N, M)` with numerical scores.\n"
        "2. Compute `student_averages`: 1D array of shape `(N,)` with each student's average across all exams (`axis=1`).\n"
        "3. Compute `exam_means`: 1D array of shape `(M,)` with the class average for each exam (`axis=0`).\n"
        "4. Compute `exam_stds`: 1D array of shape `(M,)` with the standard deviation for each exam (`axis=0`).\n"
        "5. Identify `top_student_idx`: `int` index of the student with the highest average score (`np.argmax`).\n"
        "6. Identify `hardest_exam_idx`: `int` index of the exam with the lowest average score (`np.argmin`).\n"
        "7. Compute `mean_centered_scores`: 2D array of shape `(N, M)` where each student's personal mean is subtracted from their exam scores. Use `keepdims=True` for clean broadcasting.\n"
        "8. Return a dictionary containing all 6 calculated metrics.\n"
        "9. NO Python `for` or `while` loops are allowed!"
    ),
    "starter_code": r'''import numpy as np

def aggregate_scorecard(scores: np.ndarray) -> dict:
    """
    Compute comprehensive gradebook analytics across students and exams without Python loops.
    
    Args:
        scores: 2D numpy array of shape (N, M) representing N students and M exams.
        
    Returns:
        dict with keys:
            - 'student_averages': 1D float array of shape (N,)
            - 'exam_means': 1D float array of shape (M,)
            - 'exam_stds': 1D float array of shape (M,)
            - 'top_student_idx': int index of student with highest average
            - 'hardest_exam_idx': int index of exam with lowest mean
            - 'mean_centered_scores': 2D float array of shape (N, M)
    """
    # TODO: Implement vectorized aggregations along axis=0 and axis=1
    pass
''',
    "reference_solution": r'''import numpy as np

def aggregate_scorecard(scores: np.ndarray) -> dict:
    scores = np.asarray(scores, dtype=np.float64)
    if scores.ndim != 2:
        raise ValueError(f"Expected 2D array of scores, got shape {scores.shape}")
    
    # axis=1 collapses columns horizontally across each row -> shape (N,)
    student_averages = np.mean(scores, axis=1)
    
    # axis=0 collapses rows vertically down each column -> shape (M,)
    exam_means = np.mean(scores, axis=0)
    exam_stds = np.std(scores, axis=0)
    
    # Find indices of extreme values
    top_student_idx = int(np.argmax(student_averages))
    hardest_exam_idx = int(np.argmin(exam_means))
    
    # keepdims=True retains shape (N, 1) to enable column-wise broadcasting across (N, M)
    student_means_2d = np.mean(scores, axis=1, keepdims=True)
    mean_centered_scores = scores - student_means_2d
    
    return {
        "student_averages": student_averages,
        "exam_means": exam_means,
        "exam_stds": exam_stds,
        "top_student_idx": top_student_idx,
        "hardest_exam_idx": hardest_exam_idx,
        "mean_centered_scores": mean_centered_scores,
    }
''',
    "test_suite": r'''import numpy as np

def run_tests(candidate_func):
    """
    Test suite for Challenge 'd5-c1': Student Scorecard Aggregator
    """
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # 1. Basic Correctness Test on small 3x4 matrix
    scores = np.array([
        [80.0, 90.0, 100.0, 70.0],  # avg = 85.0
        [60.0, 65.0, 70.0, 75.0],   # avg = 67.5
        [90.0, 95.0, 85.0, 90.0]    # avg = 90.0 (top student: index 2)
    ], dtype=np.float64)
    # Exam means: [76.666..., 83.333..., 85.0, 78.333...] -> hardest exam: index 0 (mean 76.67)

    res = candidate_func(scores)
    assert_test(isinstance(res, dict), "Result must be a dictionary")
    
    # Check keys
    expected_keys = [
        "student_averages", "exam_means", "exam_stds",
        "top_student_idx", "hardest_exam_idx", "mean_centered_scores"
    ]
    for k in expected_keys:
        assert_test(k in res, f"Missing required key '{k}' in result dictionary")

    # Verify shapes
    assert_test(res["student_averages"].shape == (3,), f"student_averages shape mismatch: {res['student_averages'].shape}")
    assert_test(res["exam_means"].shape == (4,), f"exam_means shape mismatch: {res['exam_means'].shape}")
    assert_test(res["exam_stds"].shape == (4,), f"exam_stds shape mismatch: {res['exam_stds'].shape}")
    assert_test(res["mean_centered_scores"].shape == (3, 4), f"mean_centered_scores shape mismatch: {res['mean_centered_scores'].shape}")

    # Verify values
    expected_student_avgs = np.array([85.0, 67.5, 90.0])
    assert_test(np.allclose(res["student_averages"], expected_student_avgs, atol=1e-5), "student_averages numerical values mismatch")

    expected_exam_means = np.array([76.66666667, 83.33333333, 85.0, 78.33333333])
    assert_test(np.allclose(res["exam_means"], expected_exam_means, atol=1e-5), "exam_means numerical values mismatch")

    # Verify indices
    assert_test(int(res["top_student_idx"]) == 2, f"Expected top_student_idx=2, got {res['top_student_idx']}")
    assert_test(int(res["hardest_exam_idx"]) == 0, f"Expected hardest_exam_idx=0, got {res['hardest_exam_idx']}")

    # 2. Centering Property Test: Each student's centered scores must have mean 0
    centered = res["mean_centered_scores"]
    row_means_of_centered = np.mean(centered, axis=1)
    assert_test(np.allclose(row_means_of_centered, 0.0, atol=1e-7), "mean_centered_scores must have row means equal to 0.0")

    # 3. High-dimensional / Large-scale Benchmark (1,000 students x 50 exams)
    N, M = 1000, 50
    np.random.seed(42)
    large_scores = np.random.uniform(50.0, 100.0, size=(N, M))
    res_large = candidate_func(large_scores)
    assert_test(res_large["student_averages"].shape == (N,), "Large scale student_averages shape mismatch")
    assert_test(res_large["exam_means"].shape == (M,), "Large scale exam_means shape mismatch")
    assert_test(0 <= res_large["top_student_idx"] < N, "Large scale top_student_idx out of bounds")
    assert_test(0 <= res_large["hardest_exam_idx"] < M, "Large scale hardest_exam_idx out of bounds")

    # 4. Error handling for non-2D input
    try:
        candidate_func(np.array([1.0, 2.0, 3.0]))
        assert_test(False, "Should raise ValueError for 1D input array")
    except (ValueError, AssertionError) as e:
        if isinstance(e, AssertionError) and "Should raise" in str(e):
            raise
        assert_test(True, "Correctly raised error on invalid input dimensions")

    return report
''',
    "hints": [
        "Use `np.mean(scores, axis=1)` to average across exams (collapsing columns) for each student.",
        "Use `np.mean(scores, axis=0)` and `np.std(scores, axis=0)` to compute exam statistics (collapsing rows).",
        "Use `int(np.argmax(student_averages))` and `int(np.argmin(exam_means))` to retrieve integer indices.",
        "For centered scores, compute `scores - np.mean(scores, axis=1, keepdims=True)` to broadcast cleanly."
    ]
}

# -----------------------------------------------------------------------------
# Challenge 2: Cumulative Cashflow & Outlier Flagging
# -----------------------------------------------------------------------------

CHALLENGE_2 = {
    "id": "d5-c2",
    "title": "Cumulative Cashflow & Outlier Flagging",
    "difficulty": "Intermediate",
    "category": "Cumulative Operations & Statistics",
    "description": (
        "A quantitative hedge fund processes a high-frequency sequence of daily net cashflow events "
        "(deposits and withdrawals). You must compute the running cumulative treasury balance, find the "
        "peak and trough balance points, and automatically flag statistical transaction outliers that exceed "
        "a configurable standard deviation threshold (mean ± k * std)."
    ),
    "instructions": (
        "Implement `analyze_cashflow(transactions: np.ndarray, threshold_std: float = 2.0) -> dict` with the following:\n"
        "1. Input `transactions` is a 1D array of numerical cash values (positive for deposits, negative for withdrawals).\n"
        "2. Compute `running_balance`: 1D array of cumulative balances over time using `np.cumsum`.\n"
        "3. Compute `net_cashflow`: float representing total cash moved (`np.sum`).\n"
        "4. Compute `mean_transaction`: float average of individual transactions (`np.mean`).\n"
        "5. Compute `std_transaction`: float standard deviation of transactions (`np.std`).\n"
        "6. Identify `min_balance_idx`: int index where `running_balance` reached its minimum (`np.argmin`).\n"
        "7. Identify `max_balance_idx`: int index where `running_balance` reached its peak (`np.argmax`).\n"
        "8. Compute `outlier_mask`: 1D boolean array where `True` indicates $|\\text{tx} - \\text{mean}| > \\text{threshold\\_std} \\times \\text{std}$.\n"
        "9. Compute `outlier_indices`: 1D integer array containing the index locations of outliers (`np.flatnonzero` or `np.where(outlier_mask)[0]`).\n"
        "10. Return all metrics in a dictionary. Avoid all Python loops!"
    ),
    "starter_code": r'''import numpy as np

def analyze_cashflow(transactions: np.ndarray, threshold_std: float = 2.0) -> dict:
    """
    Analyze cumulative cashflow balances and detect statistical outlier transactions.
    
    Args:
        transactions: 1D numpy array of numerical cashflow amounts.
        threshold_std: Multiplier for standard deviation outlier boundary (default 2.0).
        
    Returns:
        dict with keys:
            - 'running_balance': 1D float array of cumulative balances
            - 'net_cashflow': float total net cashflow
            - 'mean_transaction': float mean of transactions
            - 'std_transaction': float standard deviation of transactions
            - 'min_balance_idx': int index where balance was lowest
            - 'max_balance_idx': int index where balance was highest
            - 'outlier_mask': 1D bool array flagging outlier transactions
            - 'outlier_indices': 1D int array containing indices of outliers
    """
    # TODO: Implement cumulative and statistical calculations without Python loops
    pass
''',
    "reference_solution": r'''import numpy as np

def analyze_cashflow(transactions: np.ndarray, threshold_std: float = 2.0) -> dict:
    tx = np.asarray(transactions, dtype=np.float64)
    if tx.ndim != 1:
        raise ValueError(f"Expected 1D transaction array, got shape {tx.shape}")
    if len(tx) == 0:
        raise ValueError("Transaction array cannot be empty")
        
    running_balance = np.cumsum(tx)
    net_cashflow = float(np.sum(tx))
    mean_val = float(np.mean(tx))
    std_val = float(np.std(tx))
    
    min_idx = int(np.argmin(running_balance))
    max_idx = int(np.argmax(running_balance))
    
    # Statistical outlier mask: transactions further than threshold_std * std from the mean
    deviations = np.abs(tx - mean_val)
    cutoff = threshold_std * std_val
    outlier_mask = deviations > cutoff
    outlier_indices = np.flatnonzero(outlier_mask)
    
    return {
        "running_balance": running_balance,
        "net_cashflow": net_cashflow,
        "mean_transaction": mean_val,
        "std_transaction": std_val,
        "min_balance_idx": min_idx,
        "max_balance_idx": max_idx,
        "outlier_mask": outlier_mask,
        "outlier_indices": outlier_indices,
    }
''',
    "test_suite": r'''import numpy as np
import time

def run_tests(candidate_func):
    """
    Test suite for Challenge 'd5-c2': Cumulative Cashflow & Outlier Flagging
    """
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # 1. Deterministic sequence with known transactions
    # tx = [100, -50, 200, -300, 400]
    # cumsum = [100, 50, 250, -50, 350]
    # min balance at index 3 (-50), max balance at index 4 (350)
    tx_simple = np.array([100.0, -50.0, 200.0, -300.0, 400.0])
    res = candidate_func(tx_simple, threshold_std=2.0)
    
    assert_test(isinstance(res, dict), "Result must be a dictionary")
    expected_balance = np.array([100.0, 50.0, 250.0, -50.0, 350.0])
    assert_test(np.allclose(res["running_balance"], expected_balance), "running_balance calculation mismatch")
    assert_test(np.isclose(res["net_cashflow"], 350.0), f"Expected net_cashflow 350.0, got {res['net_cashflow']}")
    assert_test(int(res["min_balance_idx"]) == 3, f"Expected min_balance_idx 3, got {res['min_balance_idx']}")
    assert_test(int(res["max_balance_idx"]) == 4, f"Expected max_balance_idx 4, got {res['max_balance_idx']}")
    assert_test(np.isclose(res["mean_transaction"], 70.0), f"Expected mean 70.0, got {res['mean_transaction']}")

    # 2. Outlier Detection Test: Injected extreme spikes
    # Normal distribution with 2 massive outliers injected at index 10 and 50
    np.random.seed(1337)
    base_tx = np.random.normal(loc=10.0, scale=5.0, size=100)
    base_tx[10] = 500.0   # Extreme deposit (+98 std deviations)
    base_tx[50] = -400.0  # Extreme withdrawal (-82 std deviations)

    res_outliers = candidate_func(base_tx, threshold_std=3.0)
    outlier_idx = res_outliers["outlier_indices"]
    
    assert_test(10 in outlier_idx, "Failed to detect injected high positive outlier at index 10")
    assert_test(50 in outlier_idx, "Failed to detect injected extreme negative outlier at index 50")
    assert_test(res_outliers["outlier_mask"][10] == True, "outlier_mask[10] must be True")
    assert_test(res_outliers["outlier_mask"][50] == True, "outlier_mask[50] must be True")
    assert_test(res_outliers["outlier_mask"].dtype == bool, "outlier_mask must have dtype bool")

    # 3. Constant array edge case (std == 0, zero outliers)
    constant_tx = np.array([25.0, 25.0, 25.0, 25.0])
    res_const = candidate_func(constant_tx, threshold_std=2.0)
    assert_test(len(res_const["outlier_indices"]) == 0, "Constant sequence should yield 0 outliers")
    assert_test(res_const["std_transaction"] == 0.0, "Standard deviation of constant array should be 0.0")

    # 4. Large-scale performance verification (50,000 transactions)
    large_tx = np.random.randn(50000)
    t0 = time.perf_counter()
    res_perf = candidate_func(large_tx)
    elapsed = time.perf_counter() - t0
    assert_test(elapsed < 0.1, f"Execution too slow: took {elapsed:.4f}s for 50,000 items (must be < 100ms)")
    assert_test(len(res_perf["running_balance"]) == 50000, "Large scale balance length mismatch")

    return report
''',
    "hints": [
        "Use `np.cumsum(transactions)` to compute the running balance in one fast vectorized step.",
        "Use `np.sum(transactions)`, `np.mean(transactions)`, and `np.std(transactions)` for basic metrics.",
        "Use `int(np.argmin(running_balance))` and `int(np.argmax(running_balance))` for peak/trough steps.",
        "Compute the deviation from the mean via `np.abs(transactions - mean)` and compare to `threshold_std * std`.",
        "Extract the integer locations with `np.flatnonzero(outlier_mask)`."
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
