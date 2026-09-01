"""
Part 6: Boolean Masking, Filtering & Conditional Logic
PyMastery Progressive NumPy Curriculum
"""

import numpy as np
import time
from typing import Dict, Any, List

DAY_METADATA = {
    "day_id": "day06",
    "day_number": 6,
    "title": "Part 6: Boolean Masking, Filtering & Conditional Logic",
    "tagline": "Sieve and reshape data without loops: element-wise predicates, bitwise logic, and instant vectorized branching.",
    "estimated_time": "2-3 hours",
    "concepts_covered": [
        "Boolean arrays and comparison predicates (arr > threshold)",
        "Bitwise logical operators (&, |, ~) vs Python logical keywords (and, or, not)",
        "Operator precedence and the critical role of parentheses",
        "Boolean indexing and data sieving (arr[mask])",
        "Vectorized conditional branching with np.where(condition, x, y)",
        "Fast truth verification with np.any() and np.all()",
        "Counting matches using boolean summation (np.sum(mask))"
    ]
}

CONCEPT_PRIMER = r"""# Part 6 Concept Primer: Boolean Masking, Filtering & Conditional Logic

## 1. The Stencil Mental Model: What is a Boolean Mask?
In traditional Python programming, filtering a list requires looping through every single item and writing an `if` statement:
```python
# The slow Python loop way:
passing_grades = []
for score in exam_scores:
    if score >= 70:
        passing_grades.append(score)
```

In NumPy, you filter data using a **Boolean Mask**.
Think of a boolean mask like a physical cardboard **stencil** placed over your array:
1. **The Predicate:** You apply a comparison condition to the array, which creates a matching array of `True` and `False` values.
2. **The Stencil:** You pass the mask into square brackets `arr[mask]`.
3. **The Result:** Only the numbers aligned with `True` holes pass through the stencil!

```
Original Array:   [ 85,  42,  90,  68,  95 ]
Predicate (> 70): [ True, False, True, False, True ]   <-- The Stencil (Boolean Mask)
                  ---------------------------------
arr[mask]:        [ 85,       90,       95 ]           <-- Filtered Output
```

Because this operation is implemented in optimized C, filtering 10 million rows takes milliseconds instead of seconds.

---

## 2. Combining Conditions: Why `and` / `or` Crash and `&` / `|` Rule
One of the most frequent hurdles for developers transitioning to NumPy is combining multiple conditions.

### The Pitfall: Python Keywords (`and`, `or`, `not`)
If you write:
```python
mask = arr > 50 and arr < 80  # CRASH!
```
Python immediately raises:
`ValueError: The truth value of an array with more than one element is ambiguous. Use a.any() or a.all()`

**Why does this happen?**
In Python, the keyword `and` evaluates whether the *entire object* as a whole is truthy or falsy. But an array contains dozens or millions of booleans—some `True`, some `False`. Python does not know how to collapse an array into a single boolean decision for an `if` branch.

### The Solution: Bitwise Operators (`&`, `|`, `~`)
NumPy overrides Python's bitwise operators to perform **element-wise logical operations**:
* `&` is element-wise **AND** (both must be True)
* `|` is element-wise **OR** (at least one is True)
* `~` is element-wise **NOT** (inverts True to False and vice versa)

### Crucial Rule: Always Use Parentheses!
In Python's operator precedence table, `&` and `|` have higher precedence than comparison operators like `<` or `>`.
* `arr > 50 & arr < 80` is parsed as: `arr > (50 & arr) < 80` (Syntax / Type error!).
* `(arr > 50) & (arr < 80)` evaluates both comparisons first, then combines them element-wise!

---

## 3. Fast Truth Checks: `np.any()`, `np.all()`, and Counting
Once you have a boolean mask, you can query global properties instantly without writing search loops:

* **`np.any(mask)`:** Does **at least one** element satisfy the condition? (Returns a single Python `bool`).
* **`np.all(mask)`:** Do **all** elements satisfy the condition? (Returns a single Python `bool`).
* **Counting Matches (`np.sum(mask)` or `np.count_nonzero(mask)`):**
  In Python and NumPy, boolean `True` evaluates to integer `1`, and `False` evaluates to integer `0`.
  Therefore, summing a boolean array counts exactly how many elements satisfied the condition:
  ```python
  num_passing = np.sum(scores >= 70)  # Total count of passing students!
  pass_rate = np.mean(scores >= 70)   # Passing percentage (0.0 to 1.0)!
  ```

---

## 4. Vectorized If-Else: `np.where(condition, if_true, if_false)`
What if you don't want to filter out rows, but instead want to **replace** or **transform** elements based on a condition?
That is what `np.where` is built for. It is the vectorized equivalent of the ternary operator `cond ? x : y`.

```python
# Clamp negative temperatures to 0, leaving positive temperatures unchanged:
cleaned_temps = np.where(temps < 0, 0, temps)
```

You can even chain `np.where` for multi-category classification:
```python
# Categorize customer churn risk:
risk = np.where(inactive_days > 90, "High Risk",
         np.where(inactive_days > 30, "Medium Risk", "Low Risk"))
```

---

## 5. Filtering Rows in 2D Matrices
When you filter a 2D matrix with a 1D boolean mask matching the number of rows:
```python
# matrix shape: (N, 5), mask shape: (N,)
critical_rows = matrix[mask]  # Returns all columns for rows where mask is True!
```
This is the foundational pattern behind SQL-like filtering in NumPy and Pandas.
"""

WALKTHROUGH = r"""# Part 6 Walkthrough: Boolean Indexing & Conditional Branching

Let's walk through real-world examples of boolean masks, operator precedence, and `np.where`.

```python
import numpy as np

# 1. IoT Sensor Measurements (Temperature in Celsius)
# Valid operating range: 15.0°C to 45.0°C
readings = np.array([
    [22.4, 28.1, -99.9, 31.0],  # Note the corrupted negative spike (-99.9)
    [18.5, 44.2, 19.8, 120.5],  # Note the electrical surge (120.5)
    [30.2, 25.0, 27.6, 29.1]
])

print("Raw Sensor Grid (3x4):")
print(readings)

# 2. Creating Single and Combined Boolean Masks
low_anomalies = readings < 15.0
high_anomalies = readings > 45.0

# Combine with bitwise OR (|)
anomaly_mask = (readings < 15.0) | (readings > 45.0)
print("\nAnomaly Mask (True indicates faulty reading):")
print(anomaly_mask)

# 3. Aggregating the Mask
total_anomalies = np.sum(anomaly_mask)
has_faults = np.any(anomaly_mask)
is_all_clean = np.all(~anomaly_mask)
print(f"\nTotal Anomalies: {total_anomalies}")
print(f"Has Faults: {has_faults}")
print(f"Is All Clean: {is_all_clean}")

# 4. Sifting Valid Values (arr[mask] flattens to 1D)
valid_data = readings[~anomaly_mask]
print("\nValid Readings Only (Sieved through stencil):")
print(valid_data)
print(f"Valid Data Mean: {np.mean(valid_data):.2f}°C")

# 5. Vectorized Repair with np.where
# Replace corrupted readings with the mean of valid readings:
safe_mean = np.mean(valid_data)
repaired = np.where(anomaly_mask, safe_mean, readings)
print(f"\nRepaired Sensor Grid (Replaced faulty entries with {safe_mean:.1f}°C):")
print(repaired)

# 6. Multi-Column Server Log Filtering
# Columns: [Server_ID, CPU_Load, Memory_Usage, Active_Connections]
cluster_telemetry = np.array([
    [101, 45.0, 50.0, 120],
    [102, 92.0, 88.0, 450],  # Overloaded!
    [103, 78.0, 60.0, 210],
    [104, 95.0, 91.0, 800],  # Overloaded!
    [105, 30.0, 40.0, 80]
])

# Find servers where CPU > 85 AND Memory > 80
overload_mask = (cluster_telemetry[:, 1] > 85.0) & (cluster_telemetry[:, 2] > 80.0)
overloaded_servers = cluster_telemetry[overload_mask]
overloaded_ids = cluster_telemetry[overload_mask, 0].astype(int)

print(f"\nTotal Servers: {len(cluster_telemetry)}")
print(f"Overloaded Server IDs: {overloaded_ids}")
print("Overloaded Rows:")
print(overloaded_servers)
```
"""

# -----------------------------------------------------------------------------
# Challenge 1: Sensor Anomaly Detector & Clipper
# -----------------------------------------------------------------------------

CHALLENGE_1 = {
    "id": "d6-c1",
    "title": "Sensor Anomaly Detector & Clipper",
    "difficulty": "Beginner",
    "category": "Boolean Masking & Filtering",
    "description": (
        "An industrial IoT monitoring system samples temperatures and pressures across factory floor units. "
        "Due to electrical noise and sensor disconnections, data occasionally contains invalid dropouts or "
        "dangerous surges outside physical limits. You must write a vectorized function to detect anomalies, "
        "count occurrences, filter valid subsets, and repair faulty values using conditional replacement and clipping."
    ),
    "instructions": (
        "Implement `clean_sensor_readings(readings: np.ndarray, lower_limit: float, upper_limit: float, fill_value: float = 0.0) -> dict` with:\n"
        "1. Input `readings` is a NumPy array (1D or 2D) of numeric measurements.\n"
        "2. Compute `anomaly_mask`: boolean array matching `readings.shape` where values are `< lower_limit` OR `> upper_limit`.\n"
        "3. Compute `anomaly_count`: int representing the total number of anomalous values (`np.sum` or `np.count_nonzero`).\n"
        "4. Compute `has_anomalies`: bool indicating whether ANY anomaly exists (`np.any`).\n"
        "5. Compute `all_valid`: bool indicating whether ALL elements are within valid limits (`np.all`).\n"
        "6. Compute `valid_readings`: 1D array of only the valid readings extracted via boolean indexing (`readings[~anomaly_mask]`).\n"
        "7. Compute `replaced_readings`: array matching `readings.shape` where anomalies are replaced by `fill_value` using `np.where`.\n"
        "8. Compute `clipped_readings`: array matching `readings.shape` where values below `lower_limit` are set to `lower_limit` and values above `upper_limit` are set to `upper_limit` using `np.where`.\n"
        "9. Return all results in a dictionary. NO Python loops allowed!"
    ),
    "starter_code": r'''import numpy as np

def clean_sensor_readings(
    readings: np.ndarray,
    lower_limit: float,
    upper_limit: float,
    fill_value: float = 0.0
) -> dict:
    """
    Detect, count, filter, and conditionally replace sensor anomalies using boolean masking.
    
    Args:
        readings: NumPy array (1D or 2D) of numeric sensor values.
        lower_limit: Minimum valid physical threshold.
        upper_limit: Maximum valid physical threshold.
        fill_value: Replacement value for corrupted entries (default 0.0).
        
    Returns:
        dict with keys:
            - 'anomaly_mask': bool array matching readings shape
            - 'anomaly_count': int total count of anomalies
            - 'has_anomalies': bool True if any anomaly exists
            - 'all_valid': bool True if no anomalies exist
            - 'valid_readings': 1D array of only valid values
            - 'replaced_readings': array with anomalies replaced by fill_value via np.where
            - 'clipped_readings': array with values clamped to [lower_limit, upper_limit] via np.where
    """
    # TODO: Implement boolean masks, any/all, filtering, and np.where without Python loops
    pass
''',
    "reference_solution": r'''import numpy as np

def clean_sensor_readings(
    readings: np.ndarray,
    lower_limit: float,
    upper_limit: float,
    fill_value: float = 0.0
) -> dict:
    arr = np.asarray(readings, dtype=np.float64)
    if lower_limit > upper_limit:
        raise ValueError(f"lower_limit ({lower_limit}) cannot exceed upper_limit ({upper_limit})")
        
    # Build masks combining conditions with bitwise OR (|)
    low_mask = arr < lower_limit
    high_mask = arr > upper_limit
    anomaly_mask = low_mask | high_mask
    valid_mask = ~anomaly_mask
    
    anomaly_count = int(np.sum(anomaly_mask))
    has_anomalies = bool(np.any(anomaly_mask))
    all_valid = bool(np.all(valid_mask))
    
    # Filter valid readings (returns 1D array)
    valid_readings = arr[valid_mask]
    
    # Conditional replacement via np.where
    replaced_readings = np.where(anomaly_mask, fill_value, arr)
    
    # Double conditional clamp via nested np.where
    clipped_readings = np.where(low_mask, lower_limit, np.where(high_mask, upper_limit, arr))
    
    return {
        "anomaly_mask": anomaly_mask,
        "anomaly_count": anomaly_count,
        "has_anomalies": has_anomalies,
        "all_valid": all_valid,
        "valid_readings": valid_readings,
        "replaced_readings": replaced_readings,
        "clipped_readings": clipped_readings,
    }
''',
    "test_suite": r'''import numpy as np

def run_tests(candidate_func):
    """
    Test suite for Challenge 'd6-c1': Sensor Anomaly Detector & Clipper
    """
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # 1. 1D Test with known values
    # limits: [10.0, 50.0]
    # data: [5.0, 15.0, 30.0, 55.0, 20.0]
    # anomalies: index 0 (5.0 < 10), index 3 (55.0 > 50) -> count = 2
    raw_1d = np.array([5.0, 15.0, 30.0, 55.0, 20.0])
    res_1d = candidate_func(raw_1d, lower_limit=10.0, upper_limit=50.0, fill_value=-1.0)
    
    assert_test(isinstance(res_1d, dict), "Result must be a dictionary")
    assert_test(res_1d["anomaly_count"] == 2, f"Expected 2 anomalies, got {res_1d['anomaly_count']}")
    assert_test(res_1d["has_anomalies"] is True, "has_anomalies should be True")
    assert_test(res_1d["all_valid"] is False, "all_valid should be False")
    
    expected_valid = np.array([15.0, 30.0, 20.0])
    assert_test(np.allclose(res_1d["valid_readings"], expected_valid), "valid_readings content mismatch")
    
    expected_replaced = np.array([-1.0, 15.0, 30.0, -1.0, 20.0])
    assert_test(np.allclose(res_1d["replaced_readings"], expected_replaced), "replaced_readings content mismatch")
    
    expected_clipped = np.array([10.0, 15.0, 30.0, 50.0, 20.0])
    assert_test(np.allclose(res_1d["clipped_readings"], expected_clipped), "clipped_readings content mismatch")

    # 2. 2D Array Shape Preservation Test
    raw_2d = np.array([
        [12.0, 150.0],
        [-5.0, 40.0],
        [25.0, 35.0]
    ])
    res_2d = candidate_func(raw_2d, lower_limit=0.0, upper_limit=100.0, fill_value=0.0)
    assert_test(res_2d["anomaly_mask"].shape == (3, 2), f"anomaly_mask shape mismatch: {res_2d['anomaly_mask'].shape}")
    assert_test(res_2d["replaced_readings"].shape == (3, 2), "replaced_readings shape mismatch")
    assert_test(res_2d["clipped_readings"].shape == (3, 2), "clipped_readings shape mismatch")
    assert_test(res_2d["valid_readings"].ndim == 1, "valid_readings must be flattened 1D array")
    assert_test(len(res_2d["valid_readings"]) == 4, f"Expected 4 valid readings, got {len(res_2d['valid_readings'])}")

    # 3. Completely Clean Array Test
    clean_data = np.array([20.0, 25.0, 30.0, 35.0])
    res_clean = candidate_func(clean_data, lower_limit=10.0, upper_limit=50.0)
    assert_test(res_clean["anomaly_count"] == 0, "Clean array must have 0 anomalies")
    assert_test(res_clean["has_anomalies"] is False, "Clean array has_anomalies must be False")
    assert_test(res_clean["all_valid"] is True, "Clean array all_valid must be True")
    assert_test(len(res_clean["valid_readings"]) == 4, "All elements should be in valid_readings")
    assert_test(np.allclose(res_clean["clipped_readings"], clean_data), "Clipped clean array should match original")

    # 4. Completely Corrupted Array Test
    bad_data = np.array([100.0, 200.0, -50.0])
    res_bad = candidate_func(bad_data, lower_limit=0.0, upper_limit=50.0, fill_value=999.0)
    assert_test(res_bad["anomaly_count"] == 3, "All elements must be flagged as anomalies")
    assert_test(res_bad["has_anomalies"] is True, "has_anomalies must be True")
    assert_test(res_bad["all_valid"] is False, "all_valid must be False")
    assert_test(len(res_bad["valid_readings"]) == 0, "Valid readings must be empty")
    assert_test(np.all(res_bad["replaced_readings"] == 999.0), "All replaced values must equal fill_value")

    # 5. Invalid Limit Validation
    try:
        candidate_func(np.array([1.0, 2.0]), lower_limit=50.0, upper_limit=10.0)
        assert_test(False, "Should raise ValueError when lower_limit > upper_limit")
    except (ValueError, AssertionError) as e:
        if isinstance(e, AssertionError) and "Should raise" in str(e):
            raise
        assert_test(True, "Correctly caught invalid limit order")

    return report
''',
    "hints": [
        "Create the anomaly mask using bitwise OR: `(readings < lower_limit) | (readings > upper_limit)`.",
        "Remember to wrap each comparison in parentheses to respect Python's operator precedence.",
        "Use `np.sum(anomaly_mask)` to count True entries, `np.any(anomaly_mask)` for existence, and `np.all(~anomaly_mask)` for purity.",
        "Filter valid values with `readings[~anomaly_mask]`.",
        "Use `np.where(anomaly_mask, fill_value, readings)` for replacement.",
        "For clipping, nest `np.where`: `np.where(readings < lower, lower, np.where(readings > upper, upper, readings))`."
    ]
}

# -----------------------------------------------------------------------------
# Challenge 2: Multi-Condition Data Sieve
# -----------------------------------------------------------------------------

CHALLENGE_2 = {
    "id": "d6-c2",
    "title": "Multi-Condition Data Sieve",
    "difficulty": "Intermediate",
    "category": "Advanced Boolean Indexing & Conditional Branching",
    "description": (
        "You are designing the automated health triage monitor for an enterprise Kubernetes cluster. "
        "A 2D NumPy array contains telemetry for N servers across 5 metrics. Without writing a single loop, "
        "you must sieve servers into Critical, Warning, and Healthy states by combining multiple simultaneous "
        "conditions with bitwise operators, extracting row subsets with boolean indexing, and assigning status "
        "codes using vectorized conditional branching."
    ),
    "instructions": (
        "Implement `sieve_server_telemetry(telemetry: np.ndarray, cpu_limit: float = 85.0, mem_limit: float = 90.0, max_errors: float = 5.0) -> dict` with:\n"
        "1. Input `telemetry` is a 2D array of shape `(N, 5)` with columns:\n"
        "   - Column 0: `server_id` (float / int)\n"
        "   - Column 1: `cpu_percent` (0.0 to 100.0)\n"
        "   - Column 2: `mem_percent` (0.0 to 100.0)\n"
        "   - Column 3: `disk_io_mbps` (MB/s throughput)\n"
        "   - Column 4: `error_rate_per_sec` (errors per second)\n"
        "2. Define `critical_mask` (1D bool array of shape `(N,)`): A server is Critical if:\n"
        "   `(cpu >= cpu_limit AND mem >= mem_limit) OR (error_rate > max_errors)`.\n"
        "3. Define `healthy_mask` (1D bool array of shape `(N,)`): A server is Healthy if:\n"
        "   `cpu < cpu_limit AND mem < mem_limit AND error_rate == 0.0`.\n"
        "4. Define `warning_mask` (1D bool array of shape `(N,)`): A server is Warning if it is NOT Critical and NOT Healthy:\n"
        "   `~critical_mask & ~healthy_mask`.\n"
        "5. Extract `critical_servers`: 2D array of all rows where `critical_mask` is True (`telemetry[critical_mask]`).\n"
        "6. Extract `critical_ids`: 1D array of `server_id` values for critical servers (`telemetry[critical_mask, 0]`).\n"
        "7. Extract `healthy_ids`: 1D array of `server_id` values for healthy servers (`telemetry[healthy_mask, 0]`).\n"
        "8. Compute `status_codes`: 1D int array of shape `(N,)` where Healthy=0, Warning=1, and Critical=2 using nested `np.where`.\n"
        "9. Compute `triage_summary`: dictionary with integer counts `total_servers`, `critical_count`, `warning_count`, `healthy_count`.\n"
        "10. Return all outputs in a dictionary. NO Python loops allowed!"
    ),
    "starter_code": r'''import numpy as np

def sieve_server_telemetry(
    telemetry: np.ndarray,
    cpu_limit: float = 85.0,
    mem_limit: float = 90.0,
    max_errors: float = 5.0
) -> dict:
    """
    Sieve multi-column server telemetry records into critical, warning, and healthy tiers
    using multi-condition boolean indexing and vectorized conditional branching.
    
    Columns:
        0: server_id, 1: cpu_percent, 2: mem_percent, 3: disk_io_mbps, 4: error_rate_per_sec
        
    Criteria:
        - Critical: (cpu >= cpu_limit AND mem >= mem_limit) OR (error_rate > max_errors)
        - Healthy: cpu < cpu_limit AND mem < mem_limit AND error_rate == 0.0
        - Warning: not critical and not healthy
        
    Returns:
        dict with keys:
            - 'critical_mask': 1D bool array
            - 'healthy_mask': 1D bool array
            - 'warning_mask': 1D bool array
            - 'critical_servers': 2D array of critical server rows
            - 'critical_ids': 1D array of critical server IDs
            - 'healthy_ids': 1D array of healthy server IDs
            - 'status_codes': 1D int array (0=Healthy, 1=Warning, 2=Critical)
            - 'triage_summary': dict of count totals
    """
    # TODO: Implement multi-condition boolean indexing and np.where without Python loops
    pass
''',
    "reference_solution": r'''import numpy as np

def sieve_server_telemetry(
    telemetry: np.ndarray,
    cpu_limit: float = 85.0,
    mem_limit: float = 90.0,
    max_errors: float = 5.0
) -> dict:
    data = np.asarray(telemetry, dtype=np.float64)
    if data.ndim != 2 or data.shape[1] < 5:
        raise ValueError(f"Expected 2D array with at least 5 columns, got shape {data.shape}")
        
    server_ids = data[:, 0]
    cpu = data[:, 1]
    mem = data[:, 2]
    errors = data[:, 4]
    
    # 1. Critical condition: (high CPU & high Mem) OR error spike
    critical_mask = ((cpu >= cpu_limit) & (mem >= mem_limit)) | (errors > max_errors)
    
    # 2. Healthy condition: low CPU & low Mem & zero errors
    healthy_mask = (cpu < cpu_limit) & (mem < mem_limit) & (errors == 0.0)
    
    # 3. Warning condition: neither critical nor fully healthy
    warning_mask = ~critical_mask & ~healthy_mask
    
    # Sieve row subsets
    critical_servers = data[critical_mask]
    critical_ids = server_ids[critical_mask]
    healthy_ids = server_ids[healthy_mask]
    
    # Categorize status codes: 0 = Healthy, 1 = Warning, 2 = Critical
    status_codes = np.where(critical_mask, 2, np.where(warning_mask, 1, 0)).astype(np.int64)
    
    triage_summary = {
        "total_servers": int(len(data)),
        "critical_count": int(np.sum(critical_mask)),
        "warning_count": int(np.sum(warning_mask)),
        "healthy_count": int(np.sum(healthy_mask)),
    }
    
    return {
        "critical_mask": critical_mask,
        "healthy_mask": healthy_mask,
        "warning_mask": warning_mask,
        "critical_servers": critical_servers,
        "critical_ids": critical_ids,
        "healthy_ids": healthy_ids,
        "status_codes": status_codes,
        "triage_summary": triage_summary,
    }
''',
    "test_suite": r'''import numpy as np
import time

def run_tests(candidate_func):
    """
    Test suite for Challenge 'd6-c2': Multi-Condition Data Sieve
    """
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # 1. Handcrafted test matrix with 5 distinct server profiles:
    # Col 0: ID, Col 1: CPU, Col 2: MEM, Col 3: IO, Col 4: ERRORS
    # Limits: cpu=85, mem=90, errors=5
    telemetry = np.array([
        [101.0, 40.0, 50.0, 100.0, 0.0],  # Server 101: Healthy (all below, 0 err) -> Code 0
        [102.0, 90.0, 95.0, 200.0, 1.0],  # Server 102: Critical (CPU>=85 & MEM>=90) -> Code 2
        [103.0, 50.0, 60.0, 150.0, 8.0],  # Server 103: Critical (Errors > 5.0) -> Code 2
        [104.0, 88.0, 70.0, 120.0, 0.0],  # Server 104: Warning (CPU high, but MEM ok & 0 err) -> Code 1
        [105.0, 30.0, 40.0,  80.0, 2.0],  # Server 105: Warning (All ok, but errors > 0 and <= 5) -> Code 1
    ])
    
    res = candidate_func(telemetry, cpu_limit=85.0, mem_limit=90.0, max_errors=5.0)
    assert_test(isinstance(res, dict), "Result must be a dictionary")
    
    expected_keys = [
        "critical_mask", "healthy_mask", "warning_mask",
        "critical_servers", "critical_ids", "healthy_ids",
        "status_codes", "triage_summary"
    ]
    for k in expected_keys:
        assert_test(k in res, f"Missing required key '{k}'")

    # Verify counts
    summary = res["triage_summary"]
    assert_test(summary["total_servers"] == 5, f"Expected total 5, got {summary['total_servers']}")
    assert_test(summary["critical_count"] == 2, f"Expected 2 critical, got {summary['critical_count']}")
    assert_test(summary["warning_count"] == 2, f"Expected 2 warnings, got {summary['warning_count']}")
    assert_test(summary["healthy_count"] == 1, f"Expected 1 healthy, got {summary['healthy_count']}")

    # 2. Partition Property: Every server belongs to exactly ONE tier
    crit_m = res["critical_mask"]
    warn_m = res["warning_mask"]
    hlth_m = res["healthy_mask"]
    
    # Sum of booleans per server must be exactly 1
    sum_masks = crit_m.astype(int) + warn_m.astype(int) + hlth_m.astype(int)
    assert_test(np.all(sum_masks == 1), "Disjoint partition violated: every server must be in exactly 1 tier")
    assert_test(summary["critical_count"] + summary["warning_count"] + summary["healthy_count"] == summary["total_servers"],
                "Total count mismatch in triage summary")

    # Verify IDs
    assert_test(np.allclose(res["critical_ids"], np.array([102.0, 103.0])), "critical_ids mismatch")
    assert_test(np.allclose(res["healthy_ids"], np.array([101.0])), "healthy_ids mismatch")

    # Verify Status Codes (0=Healthy, 1=Warning, 2=Critical)
    expected_status = np.array([0, 2, 2, 1, 1])
    assert_test(np.allclose(res["status_codes"], expected_status), f"status_codes mismatch: {res['status_codes']}")

    # 3. Shape and Subsetting Checks
    assert_test(res["critical_servers"].shape == (2, 5), f"critical_servers shape mismatch: {res['critical_servers'].shape}")
    assert_test(np.allclose(res["critical_servers"][0], telemetry[1]), "critical_servers row 0 mismatch")
    assert_test(np.allclose(res["critical_servers"][1], telemetry[2]), "critical_servers row 1 mismatch")

    # 4. Large-scale Performance Benchmark (20,000 servers)
    N = 20000
    np.random.seed(42)
    large_data = np.column_stack([
        np.arange(N),
        np.random.uniform(10.0, 100.0, size=N),
        np.random.uniform(10.0, 100.0, size=N),
        np.random.uniform(10.0, 500.0, size=N),
        np.random.exponential(scale=2.0, size=N)
    ])
    
    t0 = time.perf_counter()
    res_large = candidate_func(large_data)
    elapsed = time.perf_counter() - t0
    
    assert_test(elapsed < 0.1, f"Performance budget exceeded: took {elapsed:.4f}s for 20,000 rows (must be < 100ms)")
    assert_test(res_large["triage_summary"]["total_servers"] == N, "Large scale total count mismatch")
    
    total_partition = (res_large["triage_summary"]["critical_count"] + 
                       res_large["triage_summary"]["warning_count"] + 
                       res_large["triage_summary"]["healthy_count"])
    assert_test(total_partition == N, "Large scale partition completeness failed")

    return report
''',
    "hints": [
        "Extract columns using slicing: `cpu = telemetry[:, 1]`, `mem = telemetry[:, 2]`, `errors = telemetry[:, 4]`.",
        "Build `critical_mask`: `((cpu >= cpu_limit) & (mem >= mem_limit)) | (errors > max_errors)`.",
        "Build `healthy_mask`: `(cpu < cpu_limit) & (mem < mem_limit) & (errors == 0.0)`.",
        "Build `warning_mask`: `~critical_mask & ~healthy_mask`.",
        "Index rows using boolean masks: `telemetry[critical_mask]` and server IDs via `telemetry[critical_mask, 0]`.",
        "Use nested `np.where`: `np.where(critical_mask, 2, np.where(warning_mask, 1, 0))` for status codes."
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
