"""
Part 3: Data Cleaning & Missing Values
PyMastery Progressive Zero-to-Hero Pandas Curriculum
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List

DAY_METADATA = {
    "day_id": "pandas_03",
    "day_number": 3,
    "title": "Part 3: Data Cleaning & Missing Values",
    "tagline": "Detect nulls with .isna(), impute with .fillna(), drop unrecoverable rows, and vectorize text cleaning with .str.",
    "estimated_time": "1-2 hours",
    "concepts_covered": [
        "Detecting missing data with .isna(), .notna(), and .isna().sum()",
        "Dropping rows with .dropna(subset=...)",
        "Imputing missing values with .fillna(mean/median)",
        "Vectorized string operations with the .str accessor",
        "Splitting text and extracting tokens with .str.split()"
    ]
}

CONCEPT_PRIMER = r"""# Part 3: Data Cleaning & Missing Values

Real-world data is almost never clean. It arrives with missing fields (`NaN`, `None`), inconsistent string casing (`"JOHN"`, `"john "`), and leading or trailing whitespace.

Data cleaning is often 80% of a data practitioner's daily work. Fortunately, Pandas makes cleaning fast, expressive, and vectorized.

---

## 1. Detecting Missing Data (`NaN` / `None`)

Pandas represents missing numbers and objects with `np.nan` (Not a Number) or `None`.

To detect missing data, never use `== np.nan` (in IEEE floating-point arithmetic, `NaN == NaN` is `False`!). Always use Pandas detection methods:

```python
# Returns True for every missing cell
df.isna()

# Count missing values per column
missing_per_col = df.isna().sum()

# Check total missing cells in entire DataFrame
total_missing = df.isna().sum().sum()
```

---

## 2. Dropping Missing Data with `.dropna()`

When a row is missing critical primary identifiers (such as `user_id` or `timestamp`), imputing is dangerous. You must drop the unrecoverable row:

```python
# Drop any row where ANY column is NaN
df.dropna()

# Drop rows ONLY if critical columns are NaN
df.dropna(subset=["user_id", "email"])

# Drop columns that are completely empty
df.dropna(axis=1, how="all")
```

---

## 3. Imputing Values with `.fillna()`

When missing values are non-critical numeric data (e.g. `age`, `income`, `rating`), dropping entire rows discards valuable signal. Instead, we **impute** (fill in) missing slots with a summary statistic like the column **median** or **mean**:

```python
# Calculate median (ignores NaNs automatically)
salary_median = df["salary"].median()

# Fill missing values with the median
df["salary"] = df["salary"].fillna(salary_median)
```

> **Why Median over Mean?**
> The median is robust against extreme outliers. If 9 employees earn $60,000 and the CEO earns $10,000,000, the mean is skewed to $1,054,000, but the median stays near $60,000!

---

## 4. Vectorized Text Cleaning with `.str`

Standard Python string methods like `.strip()`, `.lower()`, and `.split()` only work on one string at a time. 

Pandas equips Series with the **`.str` accessor**, allowing you to execute string transformations across millions of rows at compiled speed:

```python
# 1. Clean whitespace and casing
df["email"] = df["email"].str.strip().str.lower()

# 2. Extract domain from email (split on '@' and take second item)
df["domain"] = df["email"].str.split("@").str[1]

# 3. Capitalize names to Title Case
df["name"] = df["name"].str.strip().str.title()

# 4. Expand splits into multiple columns
name_parts = df["name"].str.split(" ", n=1, expand=True)
df["first_name"] = name_parts[0]
df["last_name"] = name_parts[1].fillna("")
```
"""

WALKTHROUGH = r"""# Part 3 Code Walkthrough: Cleaning Messy Records

Let's test auditing missing data, imputing medians, and normalizing strings interactively:

```python
import pandas as pd
import numpy as np

raw_customers = {
    "customer_id": [101, 102, np.nan, 104, 105],
    "full_name": ["  sarah CONNOR ", "john doe", "JAMES BOND", "ellen RIPLEY", "  Neo "],
    "email": [" SARAH@resistance.NET ", "JD@Work.COM", "007@mi6.gov.uk", np.nan, "neo@matrix.org "],
    "age": [29.0, np.nan, 38.0, 30.0, np.nan],
    "credit_score": [720.0, 680.0, np.nan, 750.0, 800.0]
}
df = pd.DataFrame(raw_customers)
print("=== Raw Messy DataFrame ===")
print(df)
print("\nMissing Values Audit:\n", df.isna().sum())

# 1. Drop records missing critical customer_id
df_clean = df.dropna(subset=["customer_id"]).copy()

# 2. Impute missing age with column median
age_median = df_clean["age"].median()
df_clean["age"] = df_clean["age"].fillna(age_median)

# 3. Clean strings with .str accessor
df_clean["email"] = df_clean["email"].fillna("unknown@domain.com").str.strip().str.lower()
df_clean["full_name"] = df_clean["full_name"].str.strip().str.title()
df_clean["domain"] = df_clean["email"].str.split("@").str[1]

print("\n=== Cleaned & Imputed DataFrame ===")
print(df_clean)
```
"""

# -----------------------------------------------------------------------------
# Challenge 1: Missing Data Imputer & Cleaner
# -----------------------------------------------------------------------------

CHALLENGE_1 = {
    "id": "pandas-p3-c1",
    "title": "Missing Data Imputer & Cleaner",
    "difficulty": "Intermediate",
    "category": "Data Cleaning & Imputation",
    "description": (
        "Audit missing values across a dataset, drop unrecoverable rows missing critical identifiers, "
        "and impute missing numeric values with column medians."
    ),
    "instructions": (
        "Write a function `clean_and_impute_dataset(df: pd.DataFrame, critical_cols: list, numeric_impute_cols: list) -> dict` that:\n"
        "1. Validates inputs:\n"
        "   - If `df` is not a `pd.DataFrame`, raise `ValueError(\"df must be a pandas DataFrame\")`.\n"
        "   - If any column in `critical_cols` or `numeric_impute_cols` is not present in `df.columns`, raise `KeyError(\"Specified column not found in DataFrame\")`.\n"
        "2. Audits initial missing values: creates a dictionary `initial_null_counts` mapping each column name to its integer count of missing/null values.\n"
        "3. Drops rows with unrecoverable missing values where any column in `critical_cols` contains null values.\n"
        "4. For each column in `numeric_impute_cols`, computes the median of that column across the filtered dataset and imputes missing values using the calculated column median.\n"
        "5. Computes `rows_dropped` as the integer difference in row count between the initial dataset and the filtered dataset.\n"
        "6. Computes `remaining_nulls` as an integer sum of nulls across the `numeric_impute_cols` in the cleaned DataFrame.\n"
        "7. Resets the index of the cleaned DataFrame to a sequential 0-based index.\n"
        "8. Returns a dictionary with keys: `\"cleaned_df\"`, `\"initial_null_counts\"`, `\"rows_dropped\"`, `\"remaining_nulls\"`."
    ),
    "starter_code": r'''import pandas as pd

def clean_and_impute_dataset(df: pd.DataFrame, critical_cols: list, numeric_impute_cols: list) -> dict:
    """
    Audit missing data, drop rows missing critical keys, and impute numeric gaps with median.
    
    Args:
        df: Input pandas DataFrame.
        critical_cols: List of column names where missing values require row removal.
        numeric_impute_cols: List of numeric column names to impute using column medians.
        
    Returns:
        Dictionary with keys: 'cleaned_df', 'initial_null_counts', 'rows_dropped', 'remaining_nulls'.
    """
    # TODO: Validate inputs, audit nulls, drop unrecoverable rows, impute medians, and return dict
    pass
''',
    "reference_solution": r'''import pandas as pd

def clean_and_impute_dataset(df: pd.DataFrame, critical_cols: list, numeric_impute_cols: list) -> dict:
    if not isinstance(df, pd.DataFrame):
        raise ValueError("df must be a pandas DataFrame")
    all_specified = set(critical_cols + numeric_impute_cols)
    if not all_specified.issubset(set(df.columns)):
        raise KeyError("Specified column not found in DataFrame")
        
    initial_null_counts = {str(col): int(df[col].isna().sum()) for col in df.columns}
    
    df_clean = df.dropna(subset=critical_cols).copy()
    rows_dropped = int(len(df) - len(df_clean))
    
    for col in numeric_impute_cols:
        median_val = df_clean[col].median()
        df_clean[col] = df_clean[col].fillna(median_val)
        
    remaining_nulls = int(df_clean[numeric_impute_cols].isna().sum().sum())
    
    return {
        "cleaned_df": df_clean.reset_index(drop=True),
        "initial_null_counts": initial_null_counts,
        "rows_dropped": rows_dropped,
        "remaining_nulls": remaining_nulls,
    }
''',
    "test_suite": r'''import pandas as pd
import numpy as np

def run_tests(candidate_func):
    """
    Automated test harness for Missing Data Imputer & Cleaner (pandas-p3-c1).
    """
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Test 1: Standard messy dataset
    data = {
        "user_id": [1, 2, np.nan, 4, 5, 6],
        "score": [80.0, np.nan, 95.0, 70.0, 90.0, np.nan],
        "age": [25.0, 30.0, 35.0, np.nan, 40.0, 50.0],
        "city": ["NY", "SF", "LA", "NY", "CHI", "MIA"]
    }
    df = pd.DataFrame(data)
    
    # Critical: user_id (row index 2 dropped)
    # Numeric impute: score, age
    # After dropping row 2:
    # scores remaining: 80, NaN, 70, 90, NaN -> median of [80, 70, 90] is 80.0
    # ages remaining: 25, 30, NaN, 40, 50 -> median of [25, 30, 40, 50] is 35.0
    res = candidate_func(df, ["user_id"], ["score", "age"])
    assert_test(isinstance(res, dict), "Result must be a Python dictionary")
    expected_keys = {"cleaned_df", "initial_null_counts", "rows_dropped", "remaining_nulls"}
    assert_test(expected_keys.issubset(res.keys()), f"Missing expected keys: {expected_keys - set(res.keys())}")
    
    assert_test(res["rows_dropped"] == 1, f"rows_dropped mismatch: expected 1, got {res['rows_dropped']}")
    assert_test(res["initial_null_counts"]["user_id"] == 1, "initial_null_counts for user_id mismatch")
    assert_test(res["initial_null_counts"]["score"] == 2, "initial_null_counts for score mismatch")
    assert_test(res["remaining_nulls"] == 0, f"remaining_nulls must be 0, got {res['remaining_nulls']}")
    
    clean_df = res["cleaned_df"]
    assert_test(len(clean_df) == 5, f"cleaned_df length mismatch: expected 5, got {len(clean_df)}")
    # Check imputed values
    assert_test(clean_df.loc[1, "score"] == 80.0, f"Imputed score mismatch: expected 80.0, got {clean_df.loc[1, 'score']}")
    assert_test(clean_df.loc[2, "age"] == 35.0, f"Imputed age mismatch: expected 35.0, got {clean_df.loc[2, 'age']}")

    # Test 2: Dataset with zero missing values
    pristine_df = pd.DataFrame({"user_id": [1, 2], "score": [100.0, 90.0]})
    res_pristine = candidate_func(pristine_df, ["user_id"], ["score"])
    assert_test(res_pristine["rows_dropped"] == 0, "rows_dropped must be 0 for complete data")
    assert_test(res_pristine["remaining_nulls"] == 0, "remaining_nulls must be 0")

    # Test 3: Validation on missing column (KeyError)
    raised_key = False
    try:
        candidate_func(df, ["unknown_column"], ["score"])
    except KeyError:
        raised_key = True
    assert_test(raised_key, "Expected KeyError when critical column is missing")

    # Test 4: Validation on non-DataFrame input (ValueError)
    raised_val = False
    try:
        candidate_func("not_a_df", ["user_id"], ["score"])
    except ValueError:
        raised_val = True
    assert_test(raised_val, "Expected ValueError when input is not a DataFrame")

    return report
''',
    "hints": [
        "Audit initial nulls with `{str(c): int(df[c].isna().sum()) for c in df.columns}`.",
        "Drop critical nulls using `df.dropna(subset=critical_cols)`.",
        "Compute median on the filtered DataFrame: `df_clean[col].median()`.",
        "Fill gaps with `df_clean[col] = df_clean[col].fillna(median_val)`."
    ]
}

# -----------------------------------------------------------------------------
# Challenge 2: Customer Email & Name Normalizer
# -----------------------------------------------------------------------------

CHALLENGE_2 = {
    "id": "pandas-p3-c2",
    "title": "Customer Email & Name Normalizer",
    "difficulty": "Beginner",
    "category": "String Cleaning (.str)",
    "description": (
        "Clean messy customer contact data using vectorized string operations, "
        "standardizing casing, stripping whitespace, and extracting domain and name components."
    ),
    "instructions": (
        "Write a function `normalize_customer_records(df: pd.DataFrame) -> pd.DataFrame` that:\n"
        "1. Validates inputs:\n"
        "   - If `df` is not a `pd.DataFrame`, raise `ValueError(\"df must be a pandas DataFrame\")`.\n"
        "   - If `'full_name'` or `'email'` is missing from `df.columns`, raise `KeyError(\"Missing 'full_name' or 'email' column\")`.\n"
        "2. Creates a copy of the DataFrame.\n"
        "3. Cleanses `'email'` text by trimming leading/trailing whitespace and converting all characters to lowercase.\n"
        "4. Extracts the `'email_domain'` by isolating the domain token following the `'@'` delimiter in the email address.\n"
        "5. Normalizes `'full_name'` by trimming whitespace and converting to Title Case.\n"
        "6. Splits `'full_name'` into separate `'first_name'` and `'last_name'` columns at the first whitespace delimiter (for single-word names, `'first_name'` takes the word and `'last_name'` should be an empty string `\"\"`).\n"
        "7. Returns the updated DataFrame."
    ),
    "starter_code": r'''import pandas as pd

def normalize_customer_records(df: pd.DataFrame) -> pd.DataFrame:
    """
    Standardize customer email casing, extract email domain, and split full names into first and last names.
    
    Args:
        df: Input pandas DataFrame containing 'full_name' and 'email' string columns.
        
    Returns:
        Cleaned pandas DataFrame with new 'email_domain', 'first_name', and 'last_name' columns.
    """
    # TODO: Validate inputs, normalize strings, and return cleaned DataFrame
    pass
''',
    "reference_solution": r'''import pandas as pd

def normalize_customer_records(df: pd.DataFrame) -> pd.DataFrame:
    if not isinstance(df, pd.DataFrame):
        raise ValueError("df must be a pandas DataFrame")
    if "full_name" not in df.columns or "email" not in df.columns:
        raise KeyError("Missing 'full_name' or 'email' column")
        
    clean_df = df.copy()
    clean_df["email"] = clean_df["email"].str.strip().str.lower()
    clean_df["email_domain"] = clean_df["email"].str.split("@").str[1]
    clean_df["full_name"] = clean_df["full_name"].str.strip().str.title()
    
    split_names = clean_df["full_name"].str.split(pat=" ", n=1, expand=True)
    clean_df["first_name"] = split_names[0]
    clean_df["last_name"] = split_names[1].fillna("")
    
    return clean_df
''',
    "test_suite": r'''import pandas as pd
import numpy as np

def run_tests(candidate_func):
    """
    Automated test harness for Customer Email & Name Normalizer (pandas-p3-c2).
    """
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Test 1: Standard messy records
    raw_data = {
        "full_name": ["  john DOE  ", "SARAH CONNOR", "cher", "  albus percival dumbledore "],
        "email": ["  JOHN@EXAMPLE.COM ", "sarah@Cyberdyne.org", "CHER@MUSIC.IO  ", "headmaster@hogwarts.edu "]
    }
    df = pd.DataFrame(raw_data)
    res = candidate_func(df)
    
    assert_test(isinstance(res, pd.DataFrame), "Output must be a pandas DataFrame")
    expected_cols = {"full_name", "email", "email_domain", "first_name", "last_name"}
    assert_test(expected_cols.issubset(set(res.columns)), f"Missing expected columns: {expected_cols - set(res.columns)}")
    
    # Check email cleaning
    assert_test(res["email"].iloc[0] == "john@example.com", f"email mismatch: got {res['email'].iloc[0]}")
    assert_test(res["email_domain"].iloc[0] == "example.com", f"domain mismatch: got {res['email_domain'].iloc[0]}")
    assert_test(res["email_domain"].iloc[1] == "cyberdyne.org", f"domain mismatch: got {res['email_domain'].iloc[1]}")

    # Check name cleaning and splitting
    assert_test(res["full_name"].iloc[0] == "John Doe", f"Title case mismatch: got {res['full_name'].iloc[0]}")
    assert_test(res["first_name"].iloc[0] == "John", f"first_name mismatch: got {res['first_name'].iloc[0]}")
    assert_test(res["last_name"].iloc[0] == "Doe", f"last_name mismatch: got {res['last_name'].iloc[0]}")

    # Check single name record ("cher")
    assert_test(res["first_name"].iloc[2] == "Cher", f"Single name first_name mismatch: got {res['first_name'].iloc[2]}")
    assert_test(res["last_name"].iloc[2] == "", f"Single name last_name must be empty string, got {res['last_name'].iloc[2]}")

    # Check multi-word name ("Albus Percival Dumbledore")
    assert_test(res["first_name"].iloc[3] == "Albus", f"Multi-word first_name mismatch: got {res['first_name'].iloc[3]}")
    assert_test(res["last_name"].iloc[3] == "Percival Dumbledore", f"Multi-word last_name mismatch: got {res['last_name'].iloc[3]}")

    # Test 2: Validation on missing required column (KeyError)
    raised_key = False
    try:
        candidate_func(pd.DataFrame({"name": ["Alice"], "mail": ["a@b.com"]}))
    except KeyError:
        raised_key = True
    assert_test(raised_key, "Expected KeyError when required column is missing")

    # Test 3: Validation on non-DataFrame input (ValueError)
    raised_val = False
    try:
        candidate_func("not_a_df")
    except ValueError:
        raised_val = True
    assert_test(raised_val, "Expected ValueError when input is not a DataFrame")

    return report
''',
    "hints": [
        "Chain string methods: `df['email'].str.strip().str.lower()`.",
        "Extract email domain: `df['email'].str.split('@').str[1]`.",
        "Split names: `df['full_name'].str.split(pat=' ', n=1, expand=True)`.",
        "Fill missing last names using `.fillna('')`."
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
