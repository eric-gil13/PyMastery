"""
Part 4: GroupBy & Summary Aggregations
PyMastery Progressive Zero-to-Hero Pandas Curriculum
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List

DAY_METADATA = {
    "day_id": "pandas_04",
    "day_number": 4,
    "title": "Part 4: GroupBy & Summary Aggregations",
    "tagline": "Master the Split-Apply-Combine mental model, multi-column groupbys, and custom named aggregations.",
    "estimated_time": "1-2 hours",
    "concepts_covered": [
        "The Split-Apply-Combine mental model",
        "Single-column grouping: df.groupby('department')",
        "Multi-column grouping: df.groupby(['region', 'category'])",
        "Named aggregations: .agg(mean_val=('col', 'mean'))",
        "Derived metrics from aggregated groups",
        "Grouped ranking and filtering with .head(n)"
    ]
}

CONCEPT_PRIMER = r"""# Part 4: GroupBy & Summary Aggregations

In real-world data analysis, you rarely analyze all records as one homogeneous group. Instead, business questions sound like:
- *"What is the average salary in each department?"*
- *"Which product categories generate the highest profit margin in each sales region?"*
- *"How many orders did each customer place this quarter?"*

In Pandas, these questions are answered using the legendary **Split-Apply-Combine** pattern via `.groupby()`.

---

## 1. The Split-Apply-Combine Mental Model

Conceptually, a groupby operation happens in three distinct phases:

```
Original Table:
   Dept      Salary
0  Eng       100k
1  Sales      60k
2  Eng       120k
3  Sales      80k

Phase 1: SPLIT (divide rows into buckets by key)
   [Eng Group]       [Sales Group]
   0: 100k           1: 60k
   2: 120k           3: 80k

Phase 2: APPLY (compute summary statistics for each bucket)
   Eng Mean = 110k   Sales Mean = 70k

Phase 3: COMBINE (stitch results back into a clean DataFrame)
   Dept    mean_salary
0  Eng     110k
1  Sales    70k
```

---

## 2. Basic GroupBy vs `as_index=False`

By default, Pandas sets the grouping column as the row index of the output table. To keep the grouping column as a normal, clean DataFrame column, pass `as_index=False`:

```python
# Grouping column becomes row index
df.groupby("department")["salary"].mean()

# Grouping column stays as a regular column (recommended!)
df.groupby("department", as_index=False)["salary"].mean()
```

---

## 3. Modern Named Aggregations with `.agg()`

In older Pandas code, applying multiple aggregations created complicated nested multi-index column headers (`('salary', 'mean')`, `('salary', 'max')`).

Modern Pandas introduced **Named Aggregation** syntax: `new_col_name=(source_col, agg_func)`. It is clean, readable, and yields flat, beautifully named columns in one step:

```python
summary = df.groupby("department", as_index=False).agg(
    avg_salary=("salary", "mean"),
    highest_salary=("salary", "max"),
    headcount=("employee_id", "count")
)
```

Common aggregation functions include:
- `"mean"` / `"median"`: Average or middle value
- `"sum"`: Total sum
- `"min"` / `"max"`: Extremes
- `"count"`: Count of non-null elements
- `"std"`: Sample standard deviation

---

## 4. Multi-Column GroupBy & Grouped Ranking

You can group by multiple columns simultaneously by passing a list of column names:

```python
regional_sales = df.groupby(["region", "category"], as_index=False).agg(
    total_sales=("sales", "sum"),
    total_profit=("profit", "sum")
)

# Calculate derived margin
regional_sales["margin"] = regional_sales["total_profit"] / regional_sales["total_sales"]

# Rank top 3 categories per region:
top_performers = (
    regional_sales
    .sort_values(by=["region", "margin"], ascending=[True, False])
    .groupby("region", as_index=False)
    .head(3)
)
```
"""

WALKTHROUGH = r"""# Part 4 Code Walkthrough: GroupBy in Action

Let's test single-column and multi-column groupbys with named aggregations interactively:

```python
import pandas as pd

orders = pd.DataFrame({
    "order_id": [1001, 1002, 1003, 1004, 1005, 1006],
    "region": ["East", "East", "West", "West", "East", "West"],
    "category": ["Electronics", "Furniture", "Electronics", "Furniture", "Electronics", "Electronics"],
    "revenue": [500.0, 300.0, 800.0, 450.0, 1200.0, 650.0],
    "profit": [150.0, 40.0, 260.0, 90.0, 380.0, 210.0]
})
print("=== Raw Orders ===")
print(orders)

# 1. Single-column groupby with named aggregation
dept_summary = orders.groupby("region", as_index=False).agg(
    order_count=("order_id", "count"),
    total_revenue=("revenue", "sum"),
    avg_profit=("profit", "mean")
)
print("\n=== Regional Summary ===")
print(dept_summary)

# 2. Multi-column groupby: Region & Category
cat_summary = orders.groupby(["region", "category"], as_index=False).agg(
    total_revenue=("revenue", "sum"),
    total_profit=("profit", "sum")
)
cat_summary["profit_margin"] = (cat_summary["total_profit"] / cat_summary["total_revenue"]).round(4)
print("\n=== Region & Category Breakdown ===")
print(cat_summary)
```
"""

# -----------------------------------------------------------------------------
# Challenge 1: Department Salary & Headcount Aggregator
# -----------------------------------------------------------------------------

CHALLENGE_1 = {
    "id": "pandas-p4-c1",
    "title": "Department Salary & Headcount Aggregator",
    "difficulty": "Intermediate",
    "category": "GroupBy & Aggregations",
    "description": (
        "Group employee records by department and compute the mean salary, maximum salary, "
        "and headcount using clean named aggregations."
    ),
    "instructions": (
        "Write a function `aggregate_department_metrics(df: pd.DataFrame) -> pd.DataFrame` that:\n"
        "1. Validates inputs:\n"
        "   - If `df` is not a `pd.DataFrame` or `df.empty`, raise `ValueError(\"df must be a non-empty DataFrame\")`.\n"
        "   - If any of `['department', 'salary', 'employee_id']` are missing from `df.columns`, raise `KeyError(\"Missing required columns\")`.\n"
        "2. Groups by `'department'` with `as_index=False` and applies named aggregations:\n"
        "   - `'mean_salary'`: mean of `'salary'`\n"
        "   - `'max_salary'`: max of `'salary'`\n"
        "   - `'headcount'`: count of `'employee_id'`\n"
        "3. Rounds `'mean_salary'` to 2 decimal places (`.round(2)`).\n"
        "4. Sorts the output table by `'headcount'` descending, breaking ties by `'mean_salary'` descending (`ascending=[False, False]`).\n"
        "5. Resets the index with `.reset_index(drop=True)`.\n"
        "6. Returns the aggregated DataFrame."
    ),
    "starter_code": r'''import pandas as pd

def aggregate_department_metrics(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute mean salary, max salary, and headcount per department using named aggregations.
    
    Args:
        df: Input pandas DataFrame with 'department', 'salary', and 'employee_id' columns.
        
    Returns:
        Aggregated, sorted pandas DataFrame with reset index.
    """
    # TODO: Validate inputs, perform groupby named aggregation, sort, and return DataFrame
    pass
''',
    "reference_solution": r'''import pandas as pd

def aggregate_department_metrics(df: pd.DataFrame) -> pd.DataFrame:
    if not isinstance(df, pd.DataFrame) or df.empty:
        raise ValueError("df must be a non-empty DataFrame")
    required = {"department", "salary", "employee_id"}
    if not required.issubset(set(df.columns)):
        raise KeyError("Missing required columns")
        
    agg_df = df.groupby("department", as_index=False).agg(
        mean_salary=("salary", "mean"),
        max_salary=("salary", "max"),
        headcount=("employee_id", "count")
    )
    agg_df["mean_salary"] = agg_df["mean_salary"].round(2)
    agg_df = agg_df.sort_values(
        by=["headcount", "mean_salary"],
        ascending=[False, False]
    ).reset_index(drop=True)
    
    return agg_df
''',
    "test_suite": r'''import pandas as pd
import numpy as np

def run_tests(candidate_func):
    """
    Automated test harness for Department Salary & Headcount Aggregator (pandas-p4-c1).
    """
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Test 1: Standard department data
    data = {
        "employee_id": [101, 102, 103, 104, 105, 106, 107],
        "department": ["Engineering", "Sales", "Engineering", "Marketing", "Engineering", "Sales", "HR"],
        "salary": [95000.0, 70000.0, 110000.0, 80000.0, 105000.0, 75000.0, 65000.0]
    }
    df = pd.DataFrame(data)
    res = candidate_func(df)
    
    assert_test(isinstance(res, pd.DataFrame), "Result must be a pandas DataFrame")
    expected_cols = ["department", "mean_salary", "max_salary", "headcount"]
    assert_test(list(res.columns) == expected_cols, f"Columns mismatch: expected {expected_cols}, got {list(res.columns)}")
    
    # Engineering: 3 employees, mean = (95+110+105)/3 = 310/3 = 103333.33, max = 110000
    # Sales: 2 employees, mean = (70+75)/2 = 72500.0, max = 75000
    # Marketing: 1 employee, mean = 80000.0, max = 80000
    # HR: 1 employee, mean = 65000.0, max = 65000
    assert_test(len(res) == 4, f"Expected 4 departments, got {len(res)}")
    
    # Check top row (Engineering: highest headcount = 3)
    top_row = res.iloc[0]
    assert_test(top_row["department"] == "Engineering", f"Top department must be Engineering, got {top_row['department']}")
    assert_test(top_row["headcount"] == 3, f"Engineering headcount mismatch: expected 3, got {top_row['headcount']}")
    assert_test(abs(top_row["mean_salary"] - 103333.33) < 1e-2, f"Engineering mean mismatch: expected 103333.33, got {top_row['mean_salary']}")
    assert_test(top_row["max_salary"] == 110000.0, "Engineering max_salary mismatch")

    # Check tie breaking between Marketing and HR (both headcount = 1; Marketing mean 80k > HR mean 65k)
    assert_test(res.iloc[2]["department"] == "Marketing", "Marketing should rank above HR due to higher mean salary")
    assert_test(res.iloc[3]["department"] == "HR", "HR should be last row")

    # Test 2: Validation on empty DataFrame (ValueError)
    raised_empty = False
    try:
        candidate_func(pd.DataFrame())
    except ValueError:
        raised_empty = True
    assert_test(raised_empty, "Expected ValueError for empty DataFrame")

    # Test 3: Validation on missing required column (KeyError)
    raised_col = False
    try:
        candidate_func(pd.DataFrame({"department": ["Eng"], "salary": [1000]}))
    except KeyError:
        raised_col = True
    assert_test(raised_col, "Expected KeyError when 'employee_id' is missing")

    # Test 4: Validation on non-DataFrame input (ValueError)
    raised_type = False
    try:
        candidate_func("not_a_df")
    except ValueError:
        raised_type = True
    assert_test(raised_type, "Expected ValueError for non-DataFrame input")

    return report
''',
    "hints": [
        "Use `df.groupby('department', as_index=False).agg(...)` with named arguments.",
        "Pass tuples: `mean_salary=('salary', 'mean')`, `max_salary=('salary', 'max')`, `headcount=('employee_id', 'count')`.",
        "Round using `.round(2)`.",
        "Sort using `.sort_values(by=['headcount', 'mean_salary'], ascending=[False, False]).reset_index(drop=True)`."
    ]
}

# -----------------------------------------------------------------------------
# Challenge 2: Regional Performance Ranker
# -----------------------------------------------------------------------------

CHALLENGE_2 = {
    "id": "pandas-p4-c2",
    "title": "Regional Performance Ranker",
    "difficulty": "Intermediate",
    "category": "Multi-Column GroupBy & Ranking",
    "description": (
        "Aggregate sales and profit across regions and categories, calculate profit margin, "
        "and rank the top N categories within each region."
    ),
    "instructions": (
        "Write a function `rank_regional_performance(sales_df: pd.DataFrame, top_n: int = 3) -> pd.DataFrame` that:\n"
        "1. Validates inputs:\n"
        "   - If `sales_df` is not a `pd.DataFrame` or `sales_df.empty`, raise `ValueError(\"sales_df must be a non-empty DataFrame\")`.\n"
        "   - If `top_n <= 0`, raise `ValueError(\"top_n must be a positive integer\")`.\n"
        "   - If any of `['region', 'category', 'revenue', 'profit']` are missing from `sales_df.columns`, raise `KeyError(\"Missing required sales columns\")`.\n"
        "2. Groups by `['region', 'category']` with `as_index=False` and aggregates:\n"
        "   - `'total_revenue'`: sum of `'revenue'`\n"
        "   - `'total_profit'`: sum of `'profit'`\n"
        "3. Computes `'profit_margin'` as `(total_profit / total_revenue).round(4)`.\n"
        "4. Sorts by `'region'` ascending and `'profit_margin'` descending (`by=['region', 'profit_margin'], ascending=[True, False]`).\n"
        "5. Selects the top `top_n` rows per region using `.groupby('region', as_index=False).head(top_n)`.\n"
        "6. Resets the index with `.reset_index(drop=True)`.\n"
        "7. Returns the ranked DataFrame."
    ),
    "starter_code": r'''import pandas as pd

def rank_regional_performance(sales_df: pd.DataFrame, top_n: int = 3) -> pd.DataFrame:
    """
    Group by region and category, calculate profit margin, and return top N categories per region.
    
    Args:
        sales_df: Input pandas DataFrame with 'region', 'category', 'revenue', and 'profit' columns.
        top_n: Number of top categories to select per region (default 3).
        
    Returns:
        Ranked pandas DataFrame with reset index.
    """
    # TODO: Validate inputs, multi-column groupby, compute margin, rank with head(top_n), and return DataFrame
    pass
''',
    "reference_solution": r'''import pandas as pd

def rank_regional_performance(sales_df: pd.DataFrame, top_n: int = 3) -> pd.DataFrame:
    if not isinstance(sales_df, pd.DataFrame) or sales_df.empty:
        raise ValueError("sales_df must be a non-empty DataFrame")
    if top_n <= 0:
        raise ValueError("top_n must be a positive integer")
    required = {"region", "category", "revenue", "profit"}
    if not required.issubset(set(sales_df.columns)):
        raise KeyError("Missing required sales columns")
        
    agg_df = sales_df.groupby(["region", "category"], as_index=False).agg(
        total_revenue=("revenue", "sum"),
        total_profit=("profit", "sum")
    )
    agg_df["profit_margin"] = (agg_df["total_profit"] / agg_df["total_revenue"]).round(4)
    sorted_df = agg_df.sort_values(
        by=["region", "profit_margin"],
        ascending=[True, False]
    ).reset_index(drop=True)
    
    top_ranked = sorted_df.groupby("region", as_index=False).head(top_n).reset_index(drop=True)
    return top_ranked
''',
    "test_suite": r'''import pandas as pd
import numpy as np

def run_tests(candidate_func):
    """
    Automated test harness for Regional Performance Ranker (pandas-p4-c2).
    """
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Test 1: Multi-region, multi-category sales dataset
    raw_sales = {
        "region": ["North", "North", "North", "North", "South", "South", "South", "South"],
        "category": ["Electronics", "Furniture", "Office", "Toys", "Electronics", "Furniture", "Office", "Toys"],
        "revenue": [1000.0, 500.0, 200.0, 300.0, 1200.0, 800.0, 400.0, 600.0],
        "profit":  [400.0, 100.0, 80.0,  30.0,  360.0, 320.0, 200.0, 60.0]
    }
    # Margins:
    # North:
    #   Office: 80/200 = 0.4000
    #   Electronics: 400/1000 = 0.4000 (tie with Office, preserves sort)
    #   Furniture: 100/500 = 0.2000
    #   Toys: 30/300 = 0.1000
    # South:
    #   Office: 200/400 = 0.5000
    #   Furniture: 320/800 = 0.4000
    #   Electronics: 360/1200 = 0.3000
    #   Toys: 60/600 = 0.1000
    df = pd.DataFrame(raw_sales)
    
    # Request top 2 per region
    res = candidate_func(df, top_n=2)
    assert_test(isinstance(res, pd.DataFrame), "Output must be a pandas DataFrame")
    assert_test(len(res) == 4, f"Expected 4 rows (2 per region), got {len(res)}")
    
    expected_cols = ["region", "category", "total_revenue", "total_profit", "profit_margin"]
    assert_test(list(res.columns) == expected_cols, f"Columns mismatch: expected {expected_cols}, got {list(res.columns)}")
    
    # Check South top category is Office (0.50 margin)
    south_rows = res[res["region"] == "South"]
    assert_test(len(south_rows) == 2, f"Expected 2 South rows, got {len(south_rows)}")
    assert_test(south_rows.iloc[0]["category"] == "Office", f"Top South category must be Office, got {south_rows.iloc[0]['category']}")
    assert_test(abs(south_rows.iloc[0]["profit_margin"] - 0.5000) < 1e-4, "South Office margin mismatch")
    assert_test(south_rows.iloc[1]["category"] == "Furniture", f"Second South category must be Furniture, got {south_rows.iloc[1]['category']}")

    # Test 2: Validation on invalid top_n (ValueError)
    for invalid_n in [0, -1, -5]:
        raised = False
        try:
            candidate_func(df, top_n=invalid_n)
        except ValueError:
            raised = True
        assert_test(raised, f"Expected ValueError for invalid top_n: {invalid_n}")

    # Test 3: Validation on empty DataFrame (ValueError)
    raised_empty = False
    try:
        candidate_func(pd.DataFrame(), top_n=3)
    except ValueError:
        raised_empty = True
    assert_test(raised_empty, "Expected ValueError for empty DataFrame")

    # Test 4: Validation on missing required column (KeyError)
    raised_key = False
    try:
        candidate_func(pd.DataFrame({"region": ["East"], "category": ["Tech"]}), top_n=3)
    except KeyError:
        raised_key = True
    assert_test(raised_key, "Expected KeyError when required column is missing")

    return report
''',
    "hints": [
        "Group by multiple columns: `sales_df.groupby(['region', 'category'], as_index=False).agg(...)`.",
        "Calculate margin: `agg_df['profit_margin'] = (agg_df['total_profit'] / agg_df['total_revenue']).round(4)`.",
        "Sort: `agg_df.sort_values(by=['region', 'profit_margin'], ascending=[True, False])`.",
        "Take top N per region: `sorted_df.groupby('region', as_index=False).head(top_n).reset_index(drop=True)`."
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
