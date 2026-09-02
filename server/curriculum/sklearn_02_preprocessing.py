"""
Part 2: Feature Preprocessing & Scaling
PyMastery Progressive Zero-to-Hero Scikit-Learn Curriculum
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, List
from sklearn.preprocessing import StandardScaler, MinMaxScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer

DAY_METADATA = {
    "day_id": "sklearn_02",
    "day_number": 2,
    "title": "Part 2: Feature Preprocessing & Scaling",
    "tagline": "Scale numeric features and encode categories without leaking test statistics into training.",
    "estimated_time": "1-2 hours",
    "concepts_covered": [
        "Feature scaling: StandardScaler (Z-score) vs MinMaxScaler (0 to 1)",
        "The Cardinal Rule of ML: fit on train, transform on test",
        "Data leakage: how fitting scalers on the full dataset corrupts validation",
        "Categorical variables: OneHotEncoder with handle_unknown='ignore'",
        "ColumnTransformer: composition across heterogeneous DataFrame columns"
    ]
}

CONCEPT_PRIMER = r"""# Part 2 Concept Primer: Feature Preprocessing & Preventing Data Leakage

## 1. Why Feature Scaling Matters
Most machine learning algorithms (Linear Regression, Logistic Regression, Neural Networks, SVMs, PCA, k-NN) rely on distance metrics or gradient descent optimization.
When features live on vastly different scales (e.g., `Age` in $[18, 80]$ vs `Annual Income` in $[20000, 500000]$):
* The feature with larger magnitudes dominates Euclidean distance calculations.
* Gradient descent oscillates uncontrollably along steep gradients and crawls along flat gradients.

### Common Scaling Strategies
1. **StandardScaler (Z-Score Normalization):**
   $$z = \frac{x - \mu}{\sigma}$$
   Centers data around mean $\mu = 0$ with unit variance $\sigma = 1$. Well-suited for normally distributed features and linear models with L1/L2 penalties.

2. **MinMaxScaler (Range Normalization):**
   $$x_{norm} = \frac{x - x_{min}}{x_{max} - x_{min}}$$
   Compresses features strictly into a fixed interval $[0, 1]$. Highly sensitive to extreme outliers.

---

## 2. The Cardinal Rule: Preventing Preprocessing Leakage
**Data Leakage** occurs whenever information from the test/validation set leaks into the model training pipeline.

```
WRONG (LEAKAGE):
  Full Data [Train + Test] ---> fit_transform(Scaler) ---> Train Model on Train Split
  * The scaler computed mean and std using TEST observations!
  * Test distribution information leaked into the training features.

CORRECT (LEAK-FREE):
  Train Split --------------> fit_transform(Scaler) ----> Train Model
                                     | (learned mu, sigma)
  Test Split  --------------> transform(Scaler) --------> Evaluate Model
```

* **Rule:** Never call `.fit()` or `.fit_transform()` on validation or test sets. Compute statistics exclusively from `X_train`, and use those stored parameters to `.transform(X_test)`.

---

## 3. Categorical Encoding: OneHotEncoder
Machine learning models compute dot products and matrix operations; they cannot process strings like `"Paris"`, `"Tokyo"`, or `"New York"` directly.
* **One-Hot Encoding:** Creates a binary indicator column for each distinct category.
* **Unseen Categories:** In production, test data may contain a category not present during training. Setting `handle_unknown='ignore'` outputs an all-zero vector for unknown categories instead of crashing.
* **Dense Output:** Modern scikit-learn uses `sparse_output=False` to produce standard NumPy arrays.

---

## 4. Heterogeneous Data: ColumnTransformer
Real-world datasets contain a mixture of continuous floats, discrete integers, and categorical strings.
`ColumnTransformer` routes specific column subsets to dedicated transformers and concatenates the results horizontally into a unified feature matrix:
```python
preprocessor = ColumnTransformer(
    transformers=[
        ('num', StandardScaler(), ['age', 'income']),
        ('cat', OneHotEncoder(sparse_output=False, handle_unknown='ignore'), ['city', 'tier'])
    ]
)
```
"""

WALKTHROUGH = r"""# Part 2 Code Walkthrough: Preprocessing and ColumnTransformer

```python
import pandas as pd
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer

# 1. Create a heterogeneous sample dataset
train_df = pd.DataFrame({
    'age': [25.0, 48.0, 32.0, 55.0],
    'income': [50000.0, 120000.0, 65000.0, 140000.0],
    'department': ['Sales', 'Engineering', 'Engineering', 'Marketing']
})

test_df = pd.DataFrame({
    'age': [30.0, 60.0],
    'income': [55000.0, 150000.0],
    'department': ['Sales', 'HR']  # 'HR' was never seen during training!
})

# 2. Build ColumnTransformer
preprocessor = ColumnTransformer(
    transformers=[
        ('num', StandardScaler(), ['age', 'income']),
        ('cat', OneHotEncoder(sparse_output=False, handle_unknown='ignore'), ['department'])
    ]
)

# 3. Fit on Train, Transform on Test (Zero Leakage)
X_train_proc = preprocessor.fit_transform(train_df)
X_test_proc = preprocessor.transform(test_df)

print("Processed Train Shape:", X_train_proc.shape)
print("Processed Test Shape: ", X_test_proc.shape)
print("Feature Names:", preprocessor.get_feature_names_out())
```
"""

# -----------------------------------------------------------------------------
# Challenge 1: Leak-Free Numerical Scaler
# -----------------------------------------------------------------------------

CHALLENGE_1 = {
    "id": "sk-p2-c1",
    "title": "Leak-Free Numerical Scaler",
    "difficulty": "Beginner",
    "category": "Preprocessing",
    "description": (
        "Standardize or normalize numeric training and testing features while rigorously preventing "
        "data leakage: fit the scaler exclusively on training data and transform the test data using "
        "the fitted parameters."
    ),
    "instructions": (
        "Write a function `scale_features_leak_free(X_train: np.ndarray, X_test: np.ndarray, method: str = \"standard\") -> dict` that:\n"
        "1. Validates inputs:\n"
        "   - If `method` is not `\"standard\"` and not `\"minmax\"`, raise `ValueError(\"method must be 'standard' or 'minmax'\")`.\n"
        "   - If `X_train.ndim != 2` or `X_test.ndim != 2` or `X_train.shape[1] != X_test.shape[1]`, raise `ValueError(\"X_train and X_test must be 2D arrays with identical feature counts\")`.\n"
        "   - If `len(X_train) == 0` or `len(X_test) == 0`, raise `ValueError(\"Arrays must have at least 1 sample\")`.\n"
        "2. Selects the feature scaling transformer based on `method`: standard score z-normalization when `\"standard\"`, or bounded range normalization when `\"minmax\"`.\n"
        "3. Fits feature scaling statistics strictly on the training set (`X_train`) to prevent data leakage and transforms `X_train` into `X_train_scaled`.\n"
        "4. Transforms the testing split (`X_test`) into `X_test_scaled` using the parameters learned from the training split without refitting.\n"
        "5. Returns a dictionary:\n"
        "   `{\"scaler\": scaler, \"X_train_scaled\": X_train_scaled, \"X_test_scaled\": X_test_scaled}`"
    ),
    "starter_code": r'''import numpy as np
from sklearn.preprocessing import StandardScaler, MinMaxScaler

def scale_features_leak_free(X_train: np.ndarray, X_test: np.ndarray, method: str = "standard") -> dict:
    """
    Scale numeric features without leaking test set statistics.

    Args:
        X_train: 2D array of training samples
        X_test: 2D array of testing samples
        method: Scaling algorithm, either 'standard' or 'minmax'

    Returns:
        dict with scaler, X_train_scaled, X_test_scaled
    """
    # TODO: Validate inputs, fit scaler on train, transform test, return dict
    pass
''',
    "reference_solution": r'''import numpy as np
from sklearn.preprocessing import StandardScaler, MinMaxScaler

def scale_features_leak_free(X_train: np.ndarray, X_test: np.ndarray, method: str = "standard") -> dict:
    if method not in ("standard", "minmax"):
        raise ValueError("method must be 'standard' or 'minmax'")
    if X_train.ndim != 2 or X_test.ndim != 2 or X_train.shape[1] != X_test.shape[1]:
        raise ValueError("X_train and X_test must be 2D arrays with identical feature counts")
    if len(X_train) == 0 or len(X_test) == 0:
        raise ValueError("Arrays must have at least 1 sample")

    scaler = StandardScaler() if method == "standard" else MinMaxScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    return {
        "scaler": scaler,
        "X_train_scaled": X_train_scaled,
        "X_test_scaled": X_test_scaled,
    }
''',
    "test_suite": r'''import numpy as np
from sklearn.preprocessing import StandardScaler, MinMaxScaler

def run_tests(candidate_func):
    report = {"passed": True, "tests_run": 0, "errors": []}

    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Test 1: Standard scaling accuracy and zero leakage
    X_tr = np.array([[10.0, 100.0], [20.0, 200.0], [30.0, 300.0]])
    X_te = np.array([[15.0, 150.0], [40.0, 400.0]])
    res = candidate_func(X_tr, X_te, method="standard")

    assert_test(isinstance(res, dict), "Output must be a dictionary")
    assert_test(isinstance(res.get("scaler"), StandardScaler), "Scaler must be StandardScaler")
    assert_test("X_train_scaled" in res and "X_test_scaled" in res, "Missing scaled arrays in result")

    # Verify scaler parameters were derived exclusively from X_tr
    expected_mean = np.mean(X_tr, axis=0)  # [20.0, 200.0]
    assert_test(np.allclose(res["scaler"].mean_, expected_mean), "Scaler mean_ must equal X_train mean only!")

    # Check scaled train mean is ~0 and std is ~1
    assert_test(np.allclose(np.mean(res["X_train_scaled"], axis=0), [0.0, 0.0], atol=1e-6), "X_train_scaled mean should be 0")
    assert_test(np.allclose(np.std(res["X_train_scaled"], axis=0), [1.0, 1.0], atol=1e-6), "X_train_scaled std should be 1")

    # Check that test set was transformed using train parameters
    expected_te_scaled = (X_te - expected_mean) / np.std(X_tr, axis=0)
    assert_test(np.allclose(res["X_test_scaled"], expected_te_scaled), "X_test_scaled calculation mismatch")

    # Test 2: MinMaxScaler
    res_mm = candidate_func(X_tr, X_te, method="minmax")
    assert_test(isinstance(res_mm.get("scaler"), MinMaxScaler), "Scaler must be MinMaxScaler")
    assert_test(np.allclose(np.min(res_mm["X_train_scaled"], axis=0), [0.0, 0.0]), "MinMax train min must be 0")
    assert_test(np.allclose(np.max(res_mm["X_train_scaled"], axis=0), [1.0, 1.0]), "MinMax train max must be 1")

    # Test 3: Invalid method validation
    raised_method = False
    try:
        candidate_func(X_tr, X_te, method="invalid_scaler")
    except ValueError:
        raised_method = True
    assert_test(raised_method, "Must raise ValueError for invalid method name")

    # Test 4: Shape mismatch validation
    raised_shape = False
    try:
        candidate_func(X_tr, np.ones((2, 3)), method="standard")
    except ValueError:
        raised_shape = True
    assert_test(raised_shape, "Must raise ValueError when column counts differ")

    return report
''',
    "hints": [
        "Instantiate StandardScaler() or MinMaxScaler() based on method.",
        "Call fit_transform on X_train, but only transform on X_test.",
        "Do not fit on test data or concatenated data to prevent data leakage."
    ]
}

# -----------------------------------------------------------------------------
# Challenge 2: Mixed Categorical & Numeric Preprocessor
# -----------------------------------------------------------------------------

CHALLENGE_2 = {
    "id": "sk-p2-c2",
    "title": "Mixed Column Preprocessor",
    "difficulty": "Beginner",
    "category": "Preprocessing",
    "description": (
        "Construct a composite column transformation workflow that applies standard numeric "
        "normalization to continuous features and one-hot binary indicator encoding to categorical "
        "features, robustly handling unseen test categories without data leakage."
    ),
    "instructions": (
        "Write a function `preprocess_mixed_features(train_df: pd.DataFrame, test_df: pd.DataFrame, numeric_cols: list[str], categorical_cols: list[str]) -> dict` that:\n"
        "1. Validates inputs:\n"
        "   - Check that all columns in `numeric_cols` and `categorical_cols` exist in both `train_df` and `test_df`. If any are missing, raise `ValueError(\"Missing specified column in dataframe\")`.\n"
        "   - If `len(numeric_cols) == 0 and len(categorical_cols) == 0`, raise `ValueError(\"At least one numeric or categorical column required\")`.\n"
        "2. Constructs a composite column transformer with two sub-transformers:\n"
        "   - Continuous feature standardizer named `\"num\"` targeting `numeric_cols` (when `numeric_cols` is non-empty)\n"
        "   - Categorical encoder named `\"cat\"` targeting `categorical_cols` (when `categorical_cols` is non-empty) that produces dense binary indicator matrices and safely ignores unknown categories during inference\n"
        "3. Fits the preprocessor strictly on the training split (`train_df`) and transforms both `train_df` and `test_df` into processed feature matrices `X_train_proc` and `X_test_proc`.\n"
        "4. Extracts output feature names from the fitted preprocessor as a list of strings.\n"
        "5. Returns a dictionary:\n"
        "   `{\"preprocessor\": preprocessor, \"X_train_proc\": X_train_proc, \"X_test_proc\": X_test_proc, \"feature_names\": feature_names}`"
    ),
    "starter_code": r'''import pandas as pd
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer

def preprocess_mixed_features(train_df: pd.DataFrame, test_df: pd.DataFrame, numeric_cols: list[str], categorical_cols: list[str]) -> dict:
    """
    Build a composite column transformation workflow for mixed numeric and categorical tabular features.

    Args:
        train_df: Training DataFrame
        test_df: Testing DataFrame
        numeric_cols: Column names to scale with standard normalization
        categorical_cols: Column names to encode into one-hot binary indicator matrices

    Returns:
        dict with preprocessor, X_train_proc, X_test_proc, feature_names
    """
    # TODO: Validate inputs, build column transformers, fit on train, transform test, return dict
    pass
''',
    "reference_solution": r'''import pandas as pd
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer

def preprocess_mixed_features(train_df: pd.DataFrame, test_df: pd.DataFrame, numeric_cols: list[str], categorical_cols: list[str]) -> dict:
    if len(numeric_cols) == 0 and len(categorical_cols) == 0:
        raise ValueError("At least one numeric or categorical column required")

    all_cols = numeric_cols + categorical_cols
    for col in all_cols:
        if col not in train_df.columns or col not in test_df.columns:
            raise ValueError("Missing specified column in dataframe")

    transformers = []
    if numeric_cols:
        transformers.append(("num", StandardScaler(), numeric_cols))
    if categorical_cols:
        transformers.append(("cat", OneHotEncoder(sparse_output=False, handle_unknown="ignore"), categorical_cols))

    preprocessor = ColumnTransformer(transformers=transformers)
    X_train_proc = preprocessor.fit_transform(train_df)
    X_test_proc = preprocessor.transform(test_df)
    feature_names = list(preprocessor.get_feature_names_out())

    return {
        "preprocessor": preprocessor,
        "X_train_proc": X_train_proc,
        "X_test_proc": X_test_proc,
        "feature_names": feature_names,
    }
''',
    "test_suite": r'''import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer

def run_tests(candidate_func):
    report = {"passed": True, "tests_run": 0, "errors": []}

    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Test 1: Standard mixed table with unseen category in test set
    train_df = pd.DataFrame({
        "age": [20.0, 30.0, 40.0],
        "score": [100.0, 200.0, 300.0],
        "city": ["NY", "London", "Paris"]
    })
    test_df = pd.DataFrame({
        "age": [25.0],
        "score": [150.0],
        "city": ["Berlin"]  # Unseen category! Should be handled via ignore
    })

    res = candidate_func(train_df, test_df, ["age", "score"], ["city"])

    assert_test(isinstance(res, dict), "Result must be a dictionary")
    assert_test(isinstance(res.get("preprocessor"), ColumnTransformer), "preprocessor must be ColumnTransformer")
    assert_test("X_train_proc" in res and "X_test_proc" in res, "Missing processed matrices")
    assert_test("feature_names" in res, "Missing feature_names")

    # Train should have 2 numeric + 3 one-hot columns = 5 columns
    assert_test(res["X_train_proc"].shape == (3, 5), f"Expected train shape (3, 5), got {res['X_train_proc'].shape}")
    # Test should have 1 row and 5 columns (unseen Berlin represented as all zeros for city one-hot)
    assert_test(res["X_test_proc"].shape == (1, 5), f"Expected test shape (1, 5), got {res['X_test_proc'].shape}")
    assert_test(np.all(res["X_test_proc"][0, 2:] == 0.0), "Unseen category 'Berlin' should produce all-zero one-hot encoding")

    # Feature names check
    assert_test(len(res["feature_names"]) == 5, f"Expected 5 feature names, got {len(res['feature_names'])}")

    # Test 2: Missing column validation
    raised_missing = False
    try:
        candidate_func(train_df, test_df, ["non_existent_col"], ["city"])
    except ValueError:
        raised_missing = True
    assert_test(raised_missing, "Must raise ValueError for missing column")

    # Test 3: Empty column lists validation
    raised_empty = False
    try:
        candidate_func(train_df, test_df, [], [])
    except ValueError:
        raised_empty = True
    assert_test(raised_empty, "Must raise ValueError when both column lists are empty")

    return report
''',
    "hints": [
        "Use OneHotEncoder(sparse_output=False, handle_unknown='ignore') for categorical columns.",
        "Pass ColumnTransformer(transformers=[('num', StandardScaler(), numeric_cols), ('cat', OneHotEncoder(...), categorical_cols)]).",
        "Extract feature names with list(preprocessor.get_feature_names_out())."
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
