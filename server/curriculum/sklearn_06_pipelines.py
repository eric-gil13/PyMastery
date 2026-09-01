"""
Part 6: End-to-End Scikit-Learn Pipelines
PyMastery Progressive Zero-to-Hero Scikit-Learn Curriculum
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, List
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score

DAY_METADATA = {
    "day_id": "sklearn_06",
    "day_number": 6,
    "title": "Part 6: End-to-End Scikit-Learn Pipelines",
    "tagline": "Encapsulate imputation, scaling, categorical encoding, and modeling into unified production pipelines.",
    "estimated_time": "2-3 hours",
    "concepts_covered": [
        "Why raw scripts fail in production: the necessity of unified pipelines",
        "The Pipeline sequential execution contract (fit, transform, predict)",
        "ColumnTransformer integration for heterogeneous tabular schemas",
        "Handling real-world missing values safely with SimpleImputer",
        "End-to-end deployment: atomic serialization and single-call .predict()"
    ]
}

CONCEPT_PRIMER = r"""# Part 6 Concept Primer: End-to-End Production Pipelines

## 1. Why Ad-Hoc Scripts Fail in Production
In experimental notebooks, machine learning practitioners often preprocess data using manual scripts:
```python
# FRAGILE AD-HOC SCRIPTING:
df['age'].fillna(df['age'].mean(), inplace=True)
df_scaled = scaler.fit_transform(df[['age', 'income']])
df_encoded = pd.get_dummies(df['city'])
# When a new inference request arrives in production:
# - How do we recreate the exact same one-hot columns?
# - What if the inference payload has missing values or unseen categories?
# - How do we guarantee the scaler uses training means without saving 20 loose pickle files?
```

---

## 2. The Scikit-Learn `Pipeline` Contract
A Scikit-Learn `Pipeline` chains multiple transformers and an optional final estimator into a single, cohesive Python object:
1. **Intermediate Steps:** Must implement `.fit()` and `.transform()` (or inherit from `TransformerMixin`).
2. **Final Step:** Can be an estimator implementing `.predict()`, `.predict_proba()`, or `.score()`.
3. **Execution Semantics:**
   * When `.fit(X, y)` is called on the Pipeline:
     $$\text{Step}_1.\text{fit\_transform}(X) \longrightarrow \text{Step}_2.\text{fit\_transform}(X') \longrightarrow \dots \longrightarrow \text{Final Estimator}.\text{fit}(X^{(n)}, y)$$
   * When `.predict(X)` is called:
     $$\text{Step}_1.\text{transform}(X) \longrightarrow \text{Step}_2.\text{transform}(X') \longrightarrow \dots \longrightarrow \text{Final Estimator}.\text{predict}(X^{(n)})$$

---

## 3. The Full Heterogeneous Architecture
Modern machine learning pipelines combine `ColumnTransformer`, nested sub-pipelines, and estimators:

```
                          Incoming Raw Tabular DataFrame (Pandas)
                                             |
                  +--------------------------+--------------------------+
                  | (numeric columns)                                   | (categorical columns)
                  v                                                     v
       +----------------------+                              +----------------------+
       | SimpleImputer(median)|                              | SimpleImputer(mode)  |
       +----------------------+                              +----------------------+
                  |                                                     |
                  v                                                     v
       +----------------------+                              +----------------------+
       |    StandardScaler    |                              | OneHotEncoder(ignore)|
       +----------------------+                              +----------------------+
                  |                                                     |
                  +--------------------------+--------------------------+
                                             | (concatenated dense matrix)
                                             v
                           +-----------------------------------+
                           | Classifier (RandomForest / LogReg)|
                           +-----------------------------------+
                                             |
                                             v
                                  Final Predictions [0, 1]
```

* **Zero Leakage:** Cross-validation on the pipeline recalculates imputations and scalers inside each fold automatically.
* **Production Simplicity:** Saving `pipeline.pkl` serializes every single transformation rule and weight into one self-contained asset.
"""

WALKTHROUGH = r"""# Part 6 Code Walkthrough: Building an End-to-End Capstone Pipeline

```python
import pandas as pd
import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier

# 1. Messy real-world data with missing values and mixed types
train_df = pd.DataFrame({
    'age': [25.0, np.nan, 45.0, 30.0, 60.0],
    'income': [50000.0, 65000.0, np.nan, 80000.0, 120000.0],
    'tier': ['bronze', 'silver', 'gold', np.nan, 'gold'],
    'churn': [0, 0, 1, 0, 1]
})

test_df = pd.DataFrame({
    'age': [32.0, 50.0],
    'income': [np.nan, 110000.0],
    'tier': ['platinum', 'silver'],  # 'platinum' was never seen in training!
    'churn': [0, 1]
})

# 2. Build sub-pipelines
num_pipeline = Pipeline([
    ('imputer', SimpleImputer(strategy='median')),
    ('scaler', StandardScaler())
])

cat_pipeline = Pipeline([
    ('imputer', SimpleImputer(strategy='most_frequent')),
    ('encoder', OneHotEncoder(sparse_output=False, handle_unknown='ignore'))
])

# 3. Combine in ColumnTransformer
preprocessor = ColumnTransformer(transformers=[
    ('num', num_pipeline, ['age', 'income']),
    ('cat', cat_pipeline, ['tier'])
])

# 4. Final end-to-end Pipeline
full_pipeline = Pipeline([
    ('preprocessor', preprocessor),
    ('classifier', RandomForestClassifier(n_estimators=50, random_state=42))
])

# 5. Fit on Train and Predict on Test with One Line
X_train = train_df.drop(columns=['churn'])
y_train = train_df['churn']
X_test = test_df.drop(columns=['churn'])

full_pipeline.fit(X_train, y_train)
predictions = full_pipeline.predict(X_test)
print("Test Predictions:", predictions)
```
"""

# -----------------------------------------------------------------------------
# Challenge 1: Production Preprocessing & Model Pipeline
# -----------------------------------------------------------------------------

CHALLENGE_1 = {
    "id": "sk-p6-c1",
    "title": "Production Preprocessing & Model Pipeline",
    "difficulty": "Intermediate",
    "category": "Pipelines",
    "description": (
        "Construct a production-ready Scikit-Learn Pipeline combining a ColumnTransformer "
        "(StandardScaler for numbers, OneHotEncoder for categories) and a LogisticRegression classifier."
    ),
    "instructions": (
        "Write a function `build_preprocessing_classifier_pipeline(numeric_cols: list[str], categorical_cols: list[str], random_state: int = 42) -> Pipeline` that:\n"
        "1. Validates inputs:\n"
        "   - If `len(numeric_cols) == 0 and len(categorical_cols) == 0`, raise `ValueError(\"At least one numeric or categorical column required\")`.\n"
        "2. Constructs a `ColumnTransformer` named `\"preprocessor\"`:\n"
        "   - If `numeric_cols` is not empty, includes `(\"num\", StandardScaler(), numeric_cols)`.\n"
        "   - If `categorical_cols` is not empty, includes `(\"cat\", OneHotEncoder(sparse_output=False, handle_unknown=\"ignore\"), categorical_cols)`.\n"
        "3. Constructs and returns a `Pipeline` with steps:\n"
        "   - `(\"preprocessor\", preprocessor)`\n"
        "   - `(\"classifier\", LogisticRegression(random_state=random_state, max_iter=1000))`"
    ),
    "starter_code": r'''from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.linear_model import LogisticRegression

def build_preprocessing_classifier_pipeline(numeric_cols: list[str], categorical_cols: list[str], random_state: int = 42) -> Pipeline:
    """
    Build a Pipeline chaining ColumnTransformer preprocessing and LogisticRegression.

    Args:
        numeric_cols: List of numerical column names
        categorical_cols: List of categorical column names
        random_state: Seed for classifier reproducibility

    Returns:
        Configured, unfitted Pipeline instance
    """
    # TODO: Validate inputs, build ColumnTransformer, assemble Pipeline, return pipeline
    pass
''',
    "reference_solution": r'''from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.linear_model import LogisticRegression

def build_preprocessing_classifier_pipeline(numeric_cols: list[str], categorical_cols: list[str], random_state: int = 42) -> Pipeline:
    if len(numeric_cols) == 0 and len(categorical_cols) == 0:
        raise ValueError("At least one numeric or categorical column required")

    transformers = []
    if numeric_cols:
        transformers.append(("num", StandardScaler(), numeric_cols))
    if categorical_cols:
        transformers.append(("cat", OneHotEncoder(sparse_output=False, handle_unknown="ignore"), categorical_cols))

    preprocessor = ColumnTransformer(transformers=transformers)
    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", LogisticRegression(random_state=random_state, max_iter=1000))
    ])

    return pipeline
''',
    "test_suite": r'''import pandas as pd
import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression

def run_tests(candidate_func):
    report = {"passed": True, "tests_run": 0, "errors": []}

    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Test 1: Construct and verify pipeline execution
    num_cols = ["age", "balance"]
    cat_cols = ["job"]
    pipe = candidate_func(num_cols, cat_cols, random_state=42)

    assert_test(isinstance(pipe, Pipeline), "Result must be a scikit-learn Pipeline instance")
    assert_test("preprocessor" in pipe.named_steps, "Pipeline must contain 'preprocessor' step")
    assert_test("classifier" in pipe.named_steps, "Pipeline must contain 'classifier' step")
    assert_test(isinstance(pipe.named_steps["classifier"], LogisticRegression), "classifier step must be LogisticRegression")

    # Fit and test on synthetic DataFrame
    df_train = pd.DataFrame({
        "age": [25.0, 45.0, 35.0, 50.0],
        "balance": [1000.0, 5000.0, 2000.0, 8000.0],
        "job": ["admin", "tech", "admin", "tech"]
    })
    y_train = np.array([0, 1, 0, 1])

    pipe.fit(df_train, y_train)
    df_test = pd.DataFrame({
        "age": [30.0],
        "balance": [3000.0],
        "job": ["management"]  # Unseen category
    })
    pred = pipe.predict(df_test)
    assert_test(len(pred) == 1, "Predict must succeed on test DataFrame with unseen category")

    # Test 2: Validation on empty column lists
    raised_empty = False
    try:
        candidate_func([], [])
    except ValueError:
        raised_empty = True
    assert_test(raised_empty, "Must raise ValueError when both column lists are empty")

    return report
''',
    "hints": [
        "Create ColumnTransformer with ('num', StandardScaler(), numeric_cols) and ('cat', OneHotEncoder(sparse_output=False, handle_unknown='ignore'), categorical_cols).",
        "Assemble Pipeline with ('preprocessor', preprocessor) and ('classifier', LogisticRegression(...)).",
        "Return the configured Pipeline instance."
    ]
}

# -----------------------------------------------------------------------------
# Challenge 2: Full ML Capstone Pipeline
# -----------------------------------------------------------------------------

CHALLENGE_2 = {
    "id": "sk-p6-c2",
    "title": "Full ML Capstone Pipeline",
    "difficulty": "Intermediate",
    "category": "Pipelines",
    "description": (
        "Build and evaluate an end-to-end production ML pipeline that handles missing values "
        "(SimpleImputer), scales numeric columns, one-hot encodes categorical columns, fits a "
        "RandomForestClassifier, and evaluates on test data."
    ),
    "instructions": (
        "Write a function `build_and_evaluate_capstone_pipeline(train_df: pd.DataFrame, test_df: pd.DataFrame, numeric_cols: list[str], categorical_cols: list[str], target_col: str, random_state: int = 42) -> dict` that:\n"
        "1. Validates inputs:\n"
        "   - If `target_col not in train_df.columns or target_col not in test_df.columns`, raise `ValueError(\"target_col must be present in both train_df and test_df\")`.\n"
        "   - If `len(numeric_cols) == 0 and len(categorical_cols) == 0`, raise `ValueError(\"At least one feature column required\")`.\n"
        "   - Check that all columns in `numeric_cols` and `categorical_cols` exist in both DataFrames; if not, raise `ValueError(\"Specified feature column missing in DataFrame\")`.\n"
        "2. Builds sub-pipelines:\n"
        "   - Numeric pipeline: `Pipeline([(\"imputer\", SimpleImputer(strategy=\"median\")), (\"scaler\", StandardScaler())])`\n"
        "   - Categorical pipeline: `Pipeline([(\"imputer\", SimpleImputer(strategy=\"most_frequent\")), (\"encoder\", OneHotEncoder(sparse_output=False, handle_unknown=\"ignore\"))])`\n"
        "3. Combines sub-pipelines into a `ColumnTransformer` named `\"preprocessor\"` for the specified columns.\n"
        "4. Constructs a full `Pipeline`:\n"
        "   - `(\"preprocessor\", preprocessor)`\n"
        "   - `(\"classifier\", RandomForestClassifier(n_estimators=50, random_state=random_state))`\n"
        "5. Separates features and target:\n"
        "   - `X_train = train_df.drop(columns=[target_col])`, `y_train = train_df[target_col]`\n"
        "   - `X_test = test_df.drop(columns=[target_col])`, `y_test = test_df[target_col]`\n"
        "6. Fits the full pipeline on `(X_train, y_train)` and predicts on `X_test`.\n"
        "7. Computes:\n"
        "   - `test_accuracy`: float from `accuracy_score(y_test, y_pred)`\n"
        "   - `test_f1`: float from `f1_score(y_test, y_pred, average=\"weighted\", zero_division=0)`\n"
        "8. Returns a dictionary:\n"
        "   `{\"pipeline\": pipeline, \"y_pred\": y_pred, \"test_accuracy\": test_accuracy, \"test_f1\": test_f1}`"
    ),
    "starter_code": r'''import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score

def build_and_evaluate_capstone_pipeline(train_df: pd.DataFrame, test_df: pd.DataFrame, numeric_cols: list[str], categorical_cols: list[str], target_col: str, random_state: int = 42) -> dict:
    """
    Build and evaluate an end-to-end imputation, scaling, encoding, and RF classifier pipeline.

    Args:
        train_df: Training DataFrame including target column
        test_df: Testing DataFrame including target column
        numeric_cols: List of numeric column names
        categorical_cols: List of categorical column names
        target_col: Name of the target label column
        random_state: Random seed for model reproducibility

    Returns:
        dict with pipeline, y_pred, test_accuracy, test_f1
    """
    # TODO: Validate inputs, build sub-pipelines and ColumnTransformer, train full pipeline, evaluate, return dict
    pass
''',
    "reference_solution": r'''import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score

def build_and_evaluate_capstone_pipeline(train_df: pd.DataFrame, test_df: pd.DataFrame, numeric_cols: list[str], categorical_cols: list[str], target_col: str, random_state: int = 42) -> dict:
    if target_col not in train_df.columns or target_col not in test_df.columns:
        raise ValueError("target_col must be present in both train_df and test_df")
    if len(numeric_cols) == 0 and len(categorical_cols) == 0:
        raise ValueError("At least one feature column required")

    for col in numeric_cols + categorical_cols:
        if col not in train_df.columns or col not in test_df.columns:
            raise ValueError("Specified feature column missing in DataFrame")

    transformers = []
    if numeric_cols:
        num_pipeline = Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler())
        ])
        transformers.append(("num", num_pipeline, numeric_cols))

    if categorical_cols:
        cat_pipeline = Pipeline([
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("encoder", OneHotEncoder(sparse_output=False, handle_unknown="ignore"))
        ])
        transformers.append(("cat", cat_pipeline, categorical_cols))

    preprocessor = ColumnTransformer(transformers=transformers)
    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", RandomForestClassifier(n_estimators=50, random_state=random_state))
    ])

    X_train = train_df.drop(columns=[target_col])
    y_train = train_df[target_col]
    X_test = test_df.drop(columns=[target_col])
    y_test = test_df[target_col]

    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)

    test_accuracy = float(accuracy_score(y_test, y_pred))
    test_f1 = float(f1_score(y_test, y_pred, average="weighted", zero_division=0))

    return {
        "pipeline": pipeline,
        "y_pred": y_pred,
        "test_accuracy": test_accuracy,
        "test_f1": test_f1,
    }
''',
    "test_suite": r'''import pandas as pd
import numpy as np
from sklearn.pipeline import Pipeline

def run_tests(candidate_func):
    report = {"passed": True, "tests_run": 0, "errors": []}

    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Test 1: Complete pipeline with missing values and new category
    train_df = pd.DataFrame({
        "age": [22.0, np.nan, 40.0, 55.0, 30.0, 60.0],
        "income": [45000.0, 60000.0, np.nan, 120000.0, 75000.0, 150000.0],
        "tier": ["standard", "premium", "standard", np.nan, "premium", "vip"],
        "target": [0, 0, 0, 1, 0, 1]
    })
    test_df = pd.DataFrame({
        "age": [28.0, 52.0],
        "income": [np.nan, 130000.0],
        "tier": ["standard", "international"],  # "international" is unseen!
        "target": [0, 1]
    })

    res = candidate_func(train_df, test_df, ["age", "income"], ["tier"], "target", random_state=42)

    assert_test(isinstance(res, dict), "Result must be a dictionary")
    assert_test(isinstance(res.get("pipeline"), Pipeline), "pipeline must be a Pipeline instance")
    assert_test("y_pred" in res, "Missing y_pred in result")
    assert_test(len(res["y_pred"]) == 2, "Expected 2 test predictions")
    assert_test(0.0 <= res["test_accuracy"] <= 1.0, "test_accuracy out of range")
    assert_test(0.0 <= res["test_f1"] <= 1.0, "test_f1 out of range")

    # Test 2: Target column missing validation
    raised_target = False
    try:
        candidate_func(train_df.drop(columns=["target"]), test_df, ["age"], ["tier"], "target")
    except ValueError:
        raised_target = True
    assert_test(raised_target, "Must raise ValueError when target_col is missing in train_df")

    # Test 3: Feature column missing validation
    raised_missing = False
    try:
        candidate_func(train_df, test_df, ["non_existent"], ["tier"], "target")
    except ValueError:
        raised_missing = True
    assert_test(raised_missing, "Must raise ValueError when feature column missing")

    return report
''',
    "hints": [
        "Create numeric pipeline with SimpleImputer(strategy='median') and StandardScaler().",
        "Create categorical pipeline with SimpleImputer(strategy='most_frequent') and OneHotEncoder(sparse_output=False, handle_unknown='ignore').",
        "Combine in ColumnTransformer, chain with RandomForestClassifier(n_estimators=50, random_state=random_state), fit, and score."
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
