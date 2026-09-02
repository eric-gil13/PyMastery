"""
Part 1: Series & DataFrame Foundations
PyMastery Progressive Zero-to-Hero Pandas Curriculum
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List

DAY_METADATA = {
    "day_id": "pandas_01",
    "day_number": 1,
    "title": "Part 1: Series & DataFrame Foundations",
    "tagline": "Build tables from scratch, explore columns & indices, and inspect dataset shapes with zero loops.",
    "estimated_time": "1-2 hours",
    "concepts_covered": [
        "Series vs DataFrame mental models",
        "Constructing DataFrames from dictionaries and lists",
        "Essential attributes: .columns, .index, .dtypes, .shape",
        "Inspection tools: .head(), .tail(), .info()",
        "Vectorized summary statistics: .describe(), .mean(), .std()"
    ]
}

CONCEPT_PRIMER = r"""# Part 1: Series & DataFrame Foundations

Welcome to Pandas! If you have ever worked with spreadsheets (like Microsoft Excel or Google Sheets) or SQL databases, you already know the core mental models of Pandas. 

Pandas brings that tabular superpower directly into Python, supercharged by high-performance NumPy arrays running under the hood.

---

## 1. The Two Core Objects: Series vs. DataFrame

In Pandas, almost everything boils down to two objects:

### A. The Series: A 1D Labeled Column
A **Series** is a single column of data. Think of it as a Python list with superpowers:
- Every element has a **data type** (dtype), such as integers (`int64`), decimals (`float64`), or text (`object` or `string`).
- Every element has an associated **label** called an **index** (by default, `0, 1, 2, 3...`).

```python
import pandas as pd

# Create a Series from a list
ages = pd.Series([25, 31, 42, 19], name="age")
print(ages)
# Output:
# 0    25
# 1    31
# 2    42
# 3    19
# Name: age, dtype: int64
```

### B. The DataFrame: A 2D Labeled Table
A **DataFrame** is a full spreadsheet table! It is simply a collection of Series that share the same row index.

```
       columns: ['name',    'age',   'dept']
index:
  0            ['Alice',      25,     'Engineering']
  1            ['Bob',        31,     'Marketing']
  2            ['Charlie',    42,     'Sales']
```

---

## 2. Creating DataFrames from Scratch

The most common and intuitive way to construct a DataFrame is from a standard Python dictionary where:
- **Keys** become column names.
- **Values** are lists containing the column data.

```python
data = {
    "name": ["Alice", "Bob", "Charlie"],
    "age": [25, 31, 42],
    "salary": [75000, 62000, 91000]
}

df = pd.DataFrame(data)
print(df)
```

---

## 3. The Big Five Inspection Attributes

When loading any dataset, professional data analysts immediately inspect five core attributes:

1. **`df.shape`**: A tuple `(num_rows, num_columns)`. Example: `(100, 5)` means 100 rows and 5 columns.
2. **`df.columns`**: The index of column names (e.g. `Index(['name', 'age', 'salary'], dtype='object')`).
3. **`df.index`**: The row labels (default is `RangeIndex(start=0, stop=3, step=1)`).
4. **`df.dtypes`**: The data type for each column (e.g. `salary: int64`, `name: object`).
5. **`df.head(n)`**: Returns the first `n` rows (defaults to 5) so you can preview the data.

---

## 4. Vectorized Column Math (Zero Loops!)

In standard Python, calculating a 10% bonus requires writing a `for` loop:
```python
# The Slow Python Way:
bonuses = []
for s in salaries:
    bonuses.append(s * 0.10)
```

In Pandas, operations automatically happen across every single row simultaneously at compiled speed:
```python
# The Fast, Clean Pandas Way:
df["bonus"] = df["salary"] * 0.10
df["total_pay"] = df["salary"] + df["bonus"]
```

---

## 5. Instant Summary Statistics

Pandas provides built-in statistical functions that ignore missing values and compute in C:
- `df["salary"].mean()`: Average value
- `df["salary"].median()`: Middle value
- `df["salary"].std()`: Sample standard deviation
- `df["salary"].min()` / `df["salary"].max()`: Smallest / largest values
- `df.describe()`: Generates a complete statistical breakdown across all numeric columns!
"""

WALKTHROUGH = r"""# Part 1 Code Walkthrough: Building Your First DataFrame

Let's test creating a DataFrame, adding computed columns, and inspecting attributes interactively:

```python
import pandas as pd

# 1. Create from a dictionary of lists
employees = {
    "name": ["Maya", "Liam", "Sophia", "Noah"],
    "department": ["Engineering", "Design", "Engineering", "Finance"],
    "salary": [92000, 78000, 105000, 84000],
    "years_exp": [4, 3, 6, 2]
}

df = pd.DataFrame(employees)
print("=== Initial DataFrame ===")
print(df)

# 2. Inspecting dimensions and data types
print("\nDimensions (rows, cols):", df.shape)
print("Columns:", list(df.columns))
print("Column Types:\n", df.dtypes)

# 3. Adding a calculated column without a for loop
df["tax_withheld"] = df["salary"] * 0.22
df["take_home"] = df["salary"] - df["tax_withheld"]

print("\n=== After Vectorized Math ===")
print(df[["name", "salary", "take_home"]])

# 4. Extracting summary metrics
print("\nMean Salary:", df["salary"].mean())
print("Total Payroll:", df["salary"].sum())
print("Experience Range:", df["years_exp"].min(), "to", df["years_exp"].max(), "years")
```
"""

# -----------------------------------------------------------------------------
# Challenge 1: Employee Directory Creator
# -----------------------------------------------------------------------------

CHALLENGE_1 = {
    "id": "pandas-p1-c1",
    "title": "Employee Directory Creator",
    "difficulty": "Beginner",
    "category": "DataFrame Creation",
    "description": (
        "Construct a pandas DataFrame from a dictionary of employee records, inspect its dimensions, "
        "and calculate a new total compensation column using vectorized arithmetic."
    ),
    "instructions": (
        "Write a function `build_employee_directory(raw_data: dict, bonus_rate: float = 0.10) -> dict` that:\n"
        "1. Validates inputs: If `raw_data` is not a dict or is empty, raise `ValueError(\"raw_data must be a non-empty dictionary\")`. "
        "If `bonus_rate < 0`, raise `ValueError(\"bonus_rate must be non-negative\")`.\n"
        "2. Constructs a DataFrame table from `raw_data`.\n"
        "3. Adds a new column named `\"total_compensation\"` computed as `salary + (salary * bonus_rate)`.\n"
        "4. Extracts the integer row count (`num_rows`) and column count (`num_cols`).\n"
        "5. Extracts the column names as a list of strings (`columns`).\n"
        "6. Calculates total payroll as a float (`total_payroll`) representing the sum of all employee total compensation values.\n"
        "7. Returns a dictionary with keys: `\"dataframe\"`, `\"num_rows\"`, `\"num_cols\"`, `\"columns\"`, `\"total_payroll\"`."
    ),
    "starter_code": r'''import pandas as pd

def build_employee_directory(raw_data: dict, bonus_rate: float = 0.10) -> dict:
    """
    Construct a DataFrame from employee records and calculate total compensation.
    
    Args:
        raw_data: Dictionary mapping column names to lists of values.
                  Expected keys: 'name', 'department', 'salary', 'years_experience'.
        bonus_rate: Fractional bonus to apply to salary (default 0.10).
        
    Returns:
        Dictionary with keys: 'dataframe', 'num_rows', 'num_cols', 'columns', 'total_payroll'.
    """
    # TODO: Validate inputs, construct DataFrame, add calculated column, and return dictionary
    pass
''',
    "reference_solution": r'''import pandas as pd

def build_employee_directory(raw_data: dict, bonus_rate: float = 0.10) -> dict:
    if not isinstance(raw_data, dict) or not raw_data:
        raise ValueError("raw_data must be a non-empty dictionary")
    if bonus_rate < 0:
        raise ValueError("bonus_rate must be non-negative")
        
    df = pd.DataFrame(raw_data)
    df["total_compensation"] = df["salary"] + (df["salary"] * bonus_rate)
    
    return {
        "dataframe": df,
        "num_rows": int(df.shape[0]),
        "num_cols": int(df.shape[1]),
        "columns": list(df.columns),
        "total_payroll": float(df["total_compensation"].sum()),
    }
''',
    "test_suite": r'''import pandas as pd
import numpy as np

def run_tests(candidate_func):
    """
    Automated test harness for Employee Directory Creator (pandas-p1-c1).
    """
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Test 1: Standard employee dictionary
    raw_data = {
        "name": ["Alice", "Bob", "Charlie", "Diana"],
        "department": ["Engineering", "HR", "Engineering", "Marketing"],
        "salary": [85000, 62000, 95000, 71000],
        "years_experience": [3, 5, 7, 2]
    }
    res = candidate_func(raw_data, 0.10)
    assert_test(isinstance(res, dict), "Result must be a Python dictionary")
    expected_keys = {"dataframe", "num_rows", "num_cols", "columns", "total_payroll"}
    assert_test(expected_keys.issubset(res.keys()), f"Missing expected keys: {expected_keys - set(res.keys())}")
    
    df = res["dataframe"]
    assert_test(isinstance(df, pd.DataFrame), "dataframe value must be a pandas DataFrame")
    assert_test(res["num_rows"] == 4, f"num_rows mismatch: expected 4, got {res['num_rows']}")
    assert_test(res["num_cols"] == 5, f"num_cols mismatch: expected 5, got {res['num_cols']}")
    assert_test("total_compensation" in df.columns, "'total_compensation' column missing from DataFrame")
    assert_test(res["columns"] == list(df.columns), "columns list does not match DataFrame.columns")
    
    # Verify calculated column values
    expected_comp = [85000 * 1.10, 62000 * 1.10, 95000 * 1.10, 71000 * 1.10]
    assert_test(np.allclose(df["total_compensation"].values, expected_comp), "total_compensation values are incorrect")
    assert_test(abs(res["total_payroll"] - sum(expected_comp)) < 1e-4, f"total_payroll mismatch: expected {sum(expected_comp)}, got {res['total_payroll']}")

    # Test 2: Custom bonus rate (0.25)
    res2 = candidate_func(raw_data, 0.25)
    assert_test(abs(res2["total_payroll"] - (313000 * 1.25)) < 1e-4, "total_payroll incorrect with bonus_rate=0.25")

    # Test 3: Input validation on empty or invalid raw_data
    for invalid in [{}, None, "not_a_dict", []]:
        raised = False
        try:
            candidate_func(invalid, 0.10)
        except ValueError:
            raised = True
        assert_test(raised, f"Expected ValueError for invalid raw_data: {invalid}")

    # Test 4: Input validation on negative bonus rate
    raised_bonus = False
    try:
        candidate_func(raw_data, -0.05)
    except ValueError:
        raised_bonus = True
    assert_test(raised_bonus, "Expected ValueError when bonus_rate < 0")

    return report
''',
    "hints": [
        "Create the DataFrame using `pd.DataFrame(raw_data)`.",
        "Add the column using vectorized addition: `df['total_compensation'] = df['salary'] + (df['salary'] * bonus_rate)`.",
        "Use `df.shape[0]` for rows, `df.shape[1]` for columns, and `list(df.columns)` for column names.",
        "Sum the compensation series using `float(df['total_compensation'].sum())`."
    ]
}

# -----------------------------------------------------------------------------
# Challenge 2: Summary Stats Inspector
# -----------------------------------------------------------------------------

CHALLENGE_2 = {
    "id": "pandas-p1-c2",
    "title": "Summary Stats Inspector",
    "difficulty": "Beginner",
    "category": "Data Inspection",
    "description": (
        "Inspect a DataFrame's structural properties, identify numeric columns dynamically, "
        "and calculate summary statistics (mean, std, min, max) without writing any loops over rows."
    ),
    "instructions": (
        "Write a function `inspect_dataframe(df: pd.DataFrame) -> dict` that:\n"
        "1. Validates input: If `df` is not a `pd.DataFrame` or `df.empty`, raise `ValueError(\"df must be a non-empty pandas DataFrame\")`.\n"
        "2. Extracts dimensions as an integer tuple `shape` containing `(num_rows, num_cols)`.\n"
        "3. Extracts data types as a dictionary `dtypes` mapping column name strings to their string data type representation.\n"
        "4. Identifies numeric columns dynamically as a list of strings (`numeric_columns`).\n"
        "5. Computes summary stats for each numeric column in a dictionary `stats`:\n"
        "   - `\"mean\"`: average value across the column as a float\n"
        "   - `\"std\"`: sample standard deviation (using 1 degree of freedom, `ddof=1`) as a float if row count > 1, else `0.0`\n"
        "   - `\"min\"`: minimum value in the column as a float\n"
        "   - `\"max\"`: maximum value in the column as a float\n"
        "6. Extracts the first row as a dictionary (`first_row`) mapping column names to their values.\n"
        "7. Returns a dictionary: `{\"shape\": shape, \"dtypes\": dtypes, \"numeric_columns\": numeric_cols, \"stats\": stats, \"first_row\": first_row}`."
    ),
    "starter_code": r'''import pandas as pd

def inspect_dataframe(df: pd.DataFrame) -> dict:
    """
    Extract dimensions, data types, numeric columns, and summary statistics.
    
    Args:
        df: A pandas DataFrame to inspect.
        
    Returns:
        Dictionary with keys: 'shape', 'dtypes', 'numeric_columns', 'stats', 'first_row'.
    """
    # TODO: Validate input and extract summary metrics
    pass
''',
    "reference_solution": r'''import pandas as pd

def inspect_dataframe(df: pd.DataFrame) -> dict:
    if not isinstance(df, pd.DataFrame) or df.empty:
        raise ValueError("df must be a non-empty pandas DataFrame")
        
    shape = (int(df.shape[0]), int(df.shape[1]))
    dtypes = {col: str(dtype) for col, dtype in df.dtypes.items()}
    numeric_cols = list(df.select_dtypes(include="number").columns)
    
    stats = {}
    for col in numeric_cols:
        stats[col] = {
            "mean": float(df[col].mean()),
            "std": float(df[col].std(ddof=1)) if len(df) > 1 else 0.0,
            "min": float(df[col].min()),
            "max": float(df[col].max()),
        }
        
    first_row = df.iloc[0].to_dict()
    
    return {
        "shape": shape,
        "dtypes": dtypes,
        "numeric_columns": numeric_cols,
        "stats": stats,
        "first_row": first_row,
    }
''',
    "test_suite": r'''import pandas as pd
import numpy as np

def run_tests(candidate_func):
    """
    Automated test harness for Summary Stats Inspector (pandas-p1-c2).
    """
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Test 1: Mixed DataFrame (numbers and strings)
    df_test = pd.DataFrame({
        "city": ["New York", "London", "Tokyo", "Paris"],
        "population_m": [8.33, 8.98, 13.96, 2.16],
        "metro_stations": [472, 272, 285, 308]
    })
    res = candidate_func(df_test)
    assert_test(isinstance(res, dict), "Result must be a Python dictionary")
    expected_keys = {"shape", "dtypes", "numeric_columns", "stats", "first_row"}
    assert_test(expected_keys.issubset(res.keys()), f"Missing expected keys: {expected_keys - set(res.keys())}")
    
    assert_test(res["shape"] == (4, 3), f"Shape mismatch: expected (4, 3), got {res['shape']}")
    assert_test(res["numeric_columns"] == ["population_m", "metro_stations"], f"numeric_columns mismatch: got {res['numeric_columns']}")
    assert_test("city" in res["dtypes"], "Missing 'city' in dtypes dictionary")
    
    # Check stats values
    stats = res["stats"]
    assert_test("population_m" in stats and "metro_stations" in stats, "stats missing numeric column entries")
    assert_test(abs(stats["population_m"]["min"] - 2.16) < 1e-4, "population_m min mismatch")
    assert_test(abs(stats["population_m"]["max"] - 13.96) < 1e-4, "population_m max mismatch")
    assert_test(abs(stats["metro_stations"]["mean"] - 334.25) < 1e-2, "metro_stations mean mismatch")
    assert_test(res["first_row"]["city"] == "New York", "first_row contents mismatch")

    # Test 2: Single row DataFrame (std should be 0.0)
    single_df = pd.DataFrame({"score": [95.0]})
    res_single = candidate_func(single_df)
    assert_test(res_single["stats"]["score"]["std"] == 0.0, "std on single row must be 0.0")
    assert_test(res_single["stats"]["score"]["mean"] == 95.0, "mean on single row mismatch")

    # Test 3: Input validation on empty or non-DataFrame inputs
    for invalid in [pd.DataFrame(), None, "not_df", [1, 2, 3]]:
        raised = False
        try:
            candidate_func(invalid)
        except ValueError:
            raised = True
        assert_test(raised, f"Expected ValueError for invalid input: {type(invalid)}")

    return report
''',
    "hints": [
        "Use `df.select_dtypes(include='number').columns` to dynamically detect numeric columns.",
        "Use `df[col].mean()`, `df[col].std(ddof=1)`, `df[col].min()`, and `df[col].max()`.",
        "Extract the first row as a dict using `df.iloc[0].to_dict()`.",
        "Check `if not isinstance(df, pd.DataFrame) or df.empty:` to validate input."
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
