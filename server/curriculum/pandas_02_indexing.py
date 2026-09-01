"""
Part 2: Column Selection & Indexing
PyMastery Progressive Zero-to-Hero Pandas Curriculum
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List

DAY_METADATA = {
    "day_id": "pandas_02",
    "day_number": 2,
    "title": "Part 2: Column Selection & Indexing",
    "tagline": "Master label-based .loc, integer-based .iloc, boolean filtering, and avoid SettingWithCopyWarning.",
    "estimated_time": "1-2 hours",
    "concepts_covered": [
        "Single vs multiple column selection: df['col'] vs df[['col1', 'col2']]",
        "Label-based indexing with .loc (rows & columns)",
        "Position-based indexing with .iloc (integer coordinate slicing)",
        "Compound boolean filtering with &, |, ~ and parentheses",
        "Understanding SettingWithCopyWarning and defensive copying with .copy()"
    ]
}

CONCEPT_PRIMER = r"""# Part 2: Column Selection & Indexing

Once your data is inside a DataFrame, the most common everyday task is **selecting specific subsets**:
- Which rows meet our business criteria?
- Which specific columns do we care about?
- How do we grab exact coordinates without confusing labels and row numbers?

In this part, we master `.loc`, `.iloc`, and boolean filtering with complete clarity.

---

## 1. Selecting Columns: Series vs DataFrame

How you use square brackets determines what you get back:

```python
# Single brackets -> Returns a 1D Series
names = df["name"]

# Double brackets -> Returns a 2D DataFrame (even with just one column!)
sub_table = df[["name", "salary"]]
single_col_df = df[["name"]]
```

> **Mental Model:** One pair of brackets `[col]` grabs an individual column as a Series. Two pairs of brackets `[[col1, col2]]` extracts a subset table as a DataFrame.

---

## 2. The Great Divide: `.loc` vs. `.iloc`

Pandas gives you two primary indexers. Remembering the difference is simple:

| Indexer | Stood For | What it takes | Example |
| :--- | :--- | :--- | :--- |
| **`.loc`** | **Loc**ation (Labels) | Row labels & column names | `df.loc[0:5, "salary"]` |
| **`.iloc`** | **I**nteger **Loc**ation | Zero-indexed integer coordinates | `df.iloc[0:5, 2]` |

### The Syntax Pattern: `[row_selector, column_selector]`
Both indexers take two arguments separated by a comma:
```python
# .loc[rows_by_label, columns_by_name]
df.loc[df["age"] > 30, ["name", "salary"]]

# .iloc[rows_by_integer_position, columns_by_integer_position]
df.iloc[0:10, 0:3]  # First 10 rows, first 3 columns
```

---

## 3. Boolean Filtering (Row Queries)

To filter rows, create a boolean mask (a Series of `True`/`False` values) and feed it into `.loc`:

```python
# 1. Condition: Age over 30
mask = df["age"] > 30

# 2. Compound conditions: MUST use bitwise operators &, |, ~ AND parentheses ()!
senior_engineers = (df["age"] > 30) & (df["department"] == "Engineering")

# 3. Apply with .loc to filter rows and pick columns:
results = df.loc[senior_engineers, ["name", "salary"]]
```

> **⚠️ Pitfall: Python `and` vs Bitwise `&`**
> In Python, `and` evaluates truthiness of the entire object. In Pandas, you MUST use `&` (bitwise AND) and `|` (bitwise OR) so Pandas evaluates each row element-by-element. Always wrap each comparison in parentheses: `(cond1) & (cond2)`.

---

## 4. Avoiding the Feared `SettingWithCopyWarning`

Have you ever seen this warning?
`SettingWithCopyWarning: A value is trying to be set on a copy of a slice from a DataFrame.`

This happens when you chain square brackets to filter and then modify the result:
```python
# ❌ DANGEROUS: Chained indexing
subset = df[df["salary"] > 80000]
subset["bonus"] = 5000  # Will trigger SettingWithCopyWarning!
```

### The Fix: Defensive Copying with `.copy()`
Whenever you create a filtered sub-table that you plan to modify or return, explicitly call `.copy()`:
```python
# ✅ SAFE & IDIOMATIC:
subset = df.loc[df["salary"] > 80000, ["name", "salary"]].copy()
subset["bonus"] = 5000  # Perfectly safe!
```
"""

WALKTHROUGH = r"""# Part 2 Code Walkthrough: Selecting and Slicing Tables

Let's test `.loc`, `.iloc`, and boolean filtering in action:

```python
import pandas as pd

data = {
    "name": ["Aria", "Ben", "Cora", "Dan", "Elena"],
    "department": ["Sales", "Engineering", "Engineering", "Marketing", "Sales"],
    "salary": [65000, 98000, 115000, 72000, 88000],
    "years_experience": [2, 5, 8, 3, 6],
    "remote": [True, True, False, False, True]
}
df = pd.DataFrame(data)

# 1. Label-based selection with .loc
print("--- Senior Engineers with .loc ---")
mask = (df["department"] == "Engineering") & (df["years_experience"] >= 5)
engineers = df.loc[mask, ["name", "salary"]].copy()
print(engineers)

# 2. Position-based cropping with .iloc
print("\n--- Sub-table with .iloc (rows 1:4, cols 0:3) ---")
cropped = df.iloc[1:4, 0:3]
print(cropped)

# 3. Accessing exact coordinates
print("\nTop-left of slice:", cropped.iloc[0, 0])
print("Bottom-right of slice:", cropped.iloc[-1, -1])
```
"""

# -----------------------------------------------------------------------------
# Challenge 1: High-Earner Filter (.loc)
# -----------------------------------------------------------------------------

CHALLENGE_1 = {
    "id": "pandas-p2-c1",
    "title": "High-Earner Filter with .loc",
    "difficulty": "Beginner",
    "category": "Boolean Filtering & Selection",
    "description": (
        "Filter records meeting compound salary and experience conditions using .loc, "
        "project target columns safely with defensive copying, and reset the index."
    ),
    "instructions": (
        "Write a function `filter_high_earners(df: pd.DataFrame, min_salary: float, min_experience: int, target_columns: list) -> pd.DataFrame` that:\n"
        "1. Validates inputs:\n"
        "   - If `df` is not a `pd.DataFrame`, raise `ValueError(\"df must be a pandas DataFrame\")`.\n"
        "   - If `min_salary < 0` or `min_experience < 0`, raise `ValueError(\"Thresholds must be non-negative\")`.\n"
        "   - If any column in `target_columns` is not present in `df.columns`, raise `ValueError(\"Target column not found in DataFrame\")`.\n"
        "2. Filters rows where `(df['salary'] >= min_salary) & (df['years_experience'] >= min_experience)`.\n"
        "3. Uses `.loc` to select only `target_columns` and calls `.copy()` to avoid SettingWithCopyWarning.\n"
        "4. Resets the index with `.reset_index(drop=True)`.\n"
        "5. Returns the filtered DataFrame."
    ),
    "starter_code": r'''import pandas as pd

def filter_high_earners(df: pd.DataFrame, min_salary: float, min_experience: int, target_columns: list) -> pd.DataFrame:
    """
    Filter DataFrame by salary and experience thresholds and return projected columns.
    
    Args:
        df: Input pandas DataFrame containing 'salary' and 'years_experience' columns.
        min_salary: Minimum salary threshold (inclusive).
        min_experience: Minimum years of experience threshold (inclusive).
        target_columns: List of column names to keep in the output.
        
    Returns:
        Filtered, copied DataFrame with reset index.
    """
    # TODO: Validate inputs, apply boolean mask with .loc, copy, and reset index
    pass
''',
    "reference_solution": r'''import pandas as pd

def filter_high_earners(df: pd.DataFrame, min_salary: float, min_experience: int, target_columns: list) -> pd.DataFrame:
    if not isinstance(df, pd.DataFrame):
        raise ValueError("df must be a pandas DataFrame")
    if min_salary < 0 or min_experience < 0:
        raise ValueError("Thresholds must be non-negative")
    if not set(target_columns).issubset(set(df.columns)):
        raise ValueError("Target column not found in DataFrame")
        
    mask = (df["salary"] >= min_salary) & (df["years_experience"] >= min_experience)
    filtered = df.loc[mask, target_columns].copy()
    return filtered.reset_index(drop=True)
''',
    "test_suite": r'''import pandas as pd
import numpy as np

def run_tests(candidate_func):
    """
    Automated test harness for High-Earner Filter (pandas-p2-c1).
    """
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Test 1: Standard filtering
    data = {
        "name": ["Alice", "Bob", "Charlie", "Diana", "Evan"],
        "salary": [90000, 65000, 120000, 85000, 110000],
        "years_experience": [4, 2, 8, 5, 3],
        "department": ["Eng", "HR", "Eng", "Mkt", "Eng"]
    }
    df = pd.DataFrame(data)
    
    # Filter: salary >= 85000 and experience >= 4
    # Alice (90k, 4 exp) -> YES
    # Bob (65k, 2 exp) -> NO
    # Charlie (120k, 8 exp) -> YES
    # Diana (85k, 5 exp) -> YES
    # Evan (110k, 3 exp) -> NO (exp < 4)
    cols = ["name", "salary", "department"]
    res = candidate_func(df, 85000, 4, cols)
    
    assert_test(isinstance(res, pd.DataFrame), "Output must be a pandas DataFrame")
    assert_test(list(res.columns) == cols, f"Columns mismatch: expected {cols}, got {list(res.columns)}")
    assert_test(len(res) == 3, f"Expected 3 rows matching, got {len(res)}")
    assert_test(list(res["name"]) == ["Alice", "Charlie", "Diana"], f"Filtered names mismatch: got {list(res['name'])}")
    assert_test(list(res.index) == [0, 1, 2], "Index must be cleanly reset to 0, 1, 2")

    # Test 2: No rows match (returns empty DataFrame with target columns)
    empty_res = candidate_func(df, 200000, 10, ["name", "salary"])
    assert_test(len(empty_res) == 0, "Expected empty DataFrame when no rows match")
    assert_test(list(empty_res.columns) == ["name", "salary"], "Columns must be preserved even when empty")

    # Test 3: Defensive copying (modifying result does not alter original df)
    res_copy = candidate_func(df, 85000, 4, cols)
    res_copy.loc[0, "salary"] = 999999
    assert_test(df.loc[0, "salary"] == 90000, "Mutating result modified original DataFrame! Must use .copy()")

    # Test 4: Validation on invalid thresholds
    for neg_val in [-1, -100]:
        raised = False
        try:
            candidate_func(df, neg_val, 2, cols)
        except ValueError:
            raised = True
        assert_test(raised, "Expected ValueError for negative min_salary")

    # Test 5: Validation on missing columns
    raised_col = False
    try:
        candidate_func(df, 50000, 1, ["name", "non_existent_column"])
    except ValueError:
        raised_col = True
    assert_test(raised_col, "Expected ValueError when target column is not in DataFrame")

    return report
''',
    "hints": [
        "Combine conditions with `&`: `(df['salary'] >= min_salary) & (df['years_experience'] >= min_experience)`.",
        "Pass the mask and column list to `.loc`: `df.loc[mask, target_columns].copy()`.",
        "Reset index using `.reset_index(drop=True)`.",
        "Check `set(target_columns).issubset(set(df.columns))` for column validation."
    ]
}

# -----------------------------------------------------------------------------
# Challenge 2: Sub-Table Slicer with .iloc
# -----------------------------------------------------------------------------

CHALLENGE_2 = {
    "id": "pandas-p2-c2",
    "title": "Sub-Table Slicer with .iloc",
    "difficulty": "Beginner",
    "category": "Positional Indexing",
    "description": (
        "Extract sub-tables and corner coordinates using purely integer positional indexing (.iloc), "
        "with robust boundary checking."
    ),
    "instructions": (
        "Write a function `slice_subtable(df: pd.DataFrame, row_start: int, row_end: int, col_indices: list) -> dict` that:\n"
        "1. Validates inputs:\n"
        "   - If `df` is not a `pd.DataFrame`, raise `ValueError(\"df must be a pandas DataFrame\")`.\n"
        "   - If `row_start < 0` or `row_end > len(df)` or `row_start >= row_end`, raise `IndexError(\"Invalid row slice boundaries\")`.\n"
        "   - If any index in `col_indices` is `< 0` or `>= df.shape[1]`, raise `IndexError(\"Column index out of bounds\")`.\n"
        "2. Extracts the sub-table using `.iloc[row_start:row_end, col_indices].copy()`.\n"
        "3. Extracts the scalar value at the top-left: `sub_df.iloc[0, 0]`.\n"
        "4. Extracts the scalar value at the bottom-right: `sub_df.iloc[-1, -1]`.\n"
        "5. Computes the shape as a tuple of ints: `(int(sub_df.shape[0]), int(sub_df.shape[1]))`.\n"
        "6. Returns a dictionary with keys: `\"sub_table\"`, `\"top_left\"`, `\"bottom_right\"`, `\"shape\"`."
    ),
    "starter_code": r'''import pandas as pd

def slice_subtable(df: pd.DataFrame, row_start: int, row_end: int, col_indices: list) -> dict:
    """
    Extract a sub-table and its corner elements using integer positional indexing (.iloc).
    
    Args:
        df: Input pandas DataFrame.
        row_start: Integer starting row index (inclusive).
        row_end: Integer ending row index (exclusive).
        col_indices: List of integer column positions to extract.
        
    Returns:
        Dictionary with keys: 'sub_table', 'top_left', 'bottom_right', 'shape'.
    """
    # TODO: Validate boundaries, slice sub-table with .iloc, extract corners, and return dict
    pass
''',
    "reference_solution": r'''import pandas as pd

def slice_subtable(df: pd.DataFrame, row_start: int, row_end: int, col_indices: list) -> dict:
    if not isinstance(df, pd.DataFrame):
        raise ValueError("df must be a pandas DataFrame")
    if row_start < 0 or row_end > len(df) or row_start >= row_end:
        raise IndexError("Invalid row slice boundaries")
    if any(c < 0 or c >= df.shape[1] for c in col_indices):
        raise IndexError("Column index out of bounds")
        
    sub_df = df.iloc[row_start:row_end, col_indices].copy()
    return {
        "sub_table": sub_df,
        "top_left": sub_df.iloc[0, 0],
        "bottom_right": sub_df.iloc[-1, -1],
        "shape": (int(sub_df.shape[0]), int(sub_df.shape[1])),
    }
''',
    "test_suite": r'''import pandas as pd
import numpy as np

def run_tests(candidate_func):
    """
    Automated test harness for Sub-Table Slicer with .iloc (pandas-p2-c2).
    """
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Test 1: Standard sub-table slice
    test_df = pd.DataFrame({
        "A": [10, 20, 30, 40, 50],
        "B": [1.1, 2.2, 3.3, 4.4, 5.5],
        "C": ["alpha", "beta", "gamma", "delta", "epsilon"],
        "D": [True, False, True, False, True]
    })
    
    # Slice rows 1 to 4 (rows 1, 2, 3) and columns 0 and 2 ("A" and "C")
    res = candidate_func(test_df, 1, 4, [0, 2])
    assert_test(isinstance(res, dict), "Result must be a Python dictionary")
    expected_keys = {"sub_table", "top_left", "bottom_right", "shape"}
    assert_test(expected_keys.issubset(res.keys()), f"Missing expected keys: {expected_keys - set(res.keys())}")
    
    sub = res["sub_table"]
    assert_test(res["shape"] == (3, 2), f"Shape mismatch: expected (3, 2), got {res['shape']}")
    assert_test(res["top_left"] == 20, f"top_left mismatch: expected 20, got {res['top_left']}")
    assert_test(res["bottom_right"] == "delta", f"bottom_right mismatch: expected 'delta', got {res['bottom_right']}")
    assert_test(list(sub.columns) == ["A", "C"], "Columns in sub_table do not match requested indices")

    # Test 2: 1x1 sub-table slice
    res_1x1 = candidate_func(test_df, 2, 3, [1])
    assert_test(res_1x1["shape"] == (1, 1), "Shape of 1x1 slice mismatch")
    assert_test(res_1x1["top_left"] == 3.3, "top_left in 1x1 slice mismatch")
    assert_test(res_1x1["bottom_right"] == 3.3, "bottom_right in 1x1 slice mismatch")

    # Test 3: Boundary validation on invalid row slices (raise IndexError)
    for invalid_rows in [(-1, 3), (3, 2), (2, 2), (0, 10)]:
        raised = False
        try:
            candidate_func(test_df, invalid_rows[0], invalid_rows[1], [0, 1])
        except IndexError:
            raised = True
        assert_test(raised, f"Expected IndexError for invalid row slice: {invalid_rows}")

    # Test 4: Boundary validation on invalid column indices (raise IndexError)
    for invalid_cols in [[-1], [0, 4], [10]]:
        raised = False
        try:
            candidate_func(test_df, 0, 2, invalid_cols)
        except IndexError:
            raised = True
        assert_test(raised, f"Expected IndexError for column out of bounds: {invalid_cols}")

    # Test 5: Non-DataFrame validation (raise ValueError)
    raised_type = False
    try:
        candidate_func("not_a_df", 0, 1, [0])
    except ValueError:
        raised_type = True
    assert_test(raised_type, "Expected ValueError for non-DataFrame input")

    return report
''',
    "hints": [
        "Remember that `.iloc` uses 0-based integer positions, like Python lists.",
        "Slice rows and columns with `df.iloc[row_start:row_end, col_indices]`.",
        "Access the top-left value with `.iloc[0, 0]` and bottom-right with `.iloc[-1, -1]`.",
        "Validate boundaries: `row_start < 0`, `row_end > len(df)`, `row_start >= row_end`, and `c < 0 or c >= df.shape[1]`."
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
