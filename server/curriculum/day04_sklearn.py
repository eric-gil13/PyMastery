"""
Day 4: Production Scikit-Learn Architectures & Anti-Leakage Pipelines
PyMastery 7-Day Curriculum
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional, Tuple
from sklearn.base import BaseEstimator, TransformerMixin, ClassifierMixin, clone
from sklearn.utils.validation import check_is_fitted
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.model_selection import StratifiedKFold, GridSearchCV
from sklearn.metrics import roc_auc_score, f1_score

DAY_METADATA = {
    "day_id": "day04",
    "day_number": 4,
    "title": "Day 4: Production Scikit-Learn Architectures & Anti-Leakage Pipelines",
    "tagline": "Master the BaseEstimator & TransformerMixin protocols, ColumnTransformers, target encoding with smoothing, and leakage-free cross-validation.",
    "estimated_time": "3-4 hours",
    "concepts_covered": [
        "Estimator & Transformer API protocols (fit, transform, fit_transform)",
        "BaseEstimator contract (get_params, set_params, clone compatibility)",
        "Learned state conventions (trailing underscores, check_is_fitted)",
        "Target encoding with empirical Bayes / m-estimate smoothing",
        "Data leakage prevention (train-test boundary isolation)",
        "ColumnTransformer integration & Stratified cross-validation pipelines"
    ]
}

CONCEPT_PRIMER = r"""# Day 4 Concept Primer: Scikit-Learn Extensibility & Leakage Prevention

## 1. The Estimator & Transformer Protocol
Scikit-Learn achieves modular composability through strict object-oriented API contracts:

### The `BaseEstimator` Contract
* Every argument in `__init__` must be an explicit keyword argument (NO `*args` or `**kwargs`).
* In `__init__`, save arguments as attributes of the **exact same name** without modification:
  ```python
  def __init__(self, alpha: float = 1.0, scale: bool = True):
      self.alpha = alpha
      self.scale = scale
  ```
* Do **NOT** compute any data-dependent state in `__init__`.
* Learned state from data must ONLY be computed in `.fit(X, y)` and saved with a **trailing underscore** (e.g., `self.mean_`, `self.bounds_`).
* `.fit()` must return `self` to support method chaining.

### The `TransformerMixin` Contract
* Automatically generates `fit_transform(X, y=None)` using `fit(X, y).transform(X)`.
* `transform(X)` must validate that the estimator is fitted via `check_is_fitted(self)` and accept both pandas DataFrames and numpy arrays.

---

## 2. Preventing Data Leakage
**Data Leakage** occurs when information from outside the training dataset (such as validation/test folds or future timestamps) is inadvertently used to train the model.

```
WRONG (Leaky Pipeline):
[ Full Dataset (Train + Val) ] ──> [ Fit Scaler / Target Encoder ] ──> [ Split Train / Val ] ──> [ Train Model ]
* Validation mean/distribution leaked into training features! *

CORRECT (Anti-Leakage Pipeline):
[ Full Dataset ] ──> [ Split Train / Val ]
                            │
               ┌────────────┴─────────────┐
               ▼                          ▼
     [ Train Fold Only ]           [ Val Fold Only ]
               │                          │
  [ Fit Scaler / Encoder ]                │
               │                          │
[ Transform Train Fold ]         [ Transform Val Fold (using Train stats) ]
               │                          │
       [ Train Model ] ───────────> [ Evaluate Val ]
```

By wrapping all preprocessing inside a `Pipeline` or `ColumnTransformer`, Scikit-Learn guarantees that preprocessing parameters (`mean_`, `std_`, target statistics) are computed **strictly inside each training fold** during cross-validation.

---

## 3. Regularized Smooth Target Encoding (M-Estimate)
Target encoding replaces a high-cardinality categorical category $c$ with the expected value of target $y$. However, rare categories with few samples (e.g. $n_c = 1$) cause severe overfitting.

**Empirical Bayes Smoothing (M-Estimate)**:
$$\hat{S}(c) = \frac{n_c \cdot \bar{y}_c + m \cdot \bar{y}_{\text{global}}}{n_c + m}$$

Where:
* $n_c$: Number of training instances with category $c$.
* $\bar{y}_c$: Mean target value for category $c$.
* $\bar{y}_{\text{global}}$: Overall global target mean across the entire training set.
* $m$: Smoothing weight (hyperparameter). When $n_c \gg m$, the estimate approaches the category mean; when $n_c \to 0$, it gracefully falls back to the global prior.
"""

WALKTHROUGH = r"""# Day 4 Walkthrough: Authoring a Compliant Custom Transformer

```python
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.utils.validation import check_is_fitted
import numpy as np
import pandas as pd

class CustomLogScaler(BaseEstimator, TransformerMixin):
    def __init__(self, offset: float = 1.0):
        self.offset = offset
        
    def fit(self, X, y=None):
        # Validate input and record learned features
        X_arr = np.asarray(X)
        self.n_features_in_ = X_arr.shape[1]
        self.min_val_ = float(np.min(X_arr))
        return self
        
    def transform(self, X):
        check_is_fitted(self, attributes=["n_features_in_", "min_val_"])
        X_arr = np.asarray(X)
        if X_arr.shape[1] != self.n_features_in_:
            raise ValueError(f"Feature count mismatch: expected {self.n_features_in_}, got {X_arr.shape[1]}")
        return np.log1p(np.maximum(0.0, X_arr + self.offset))

# Test scikit-learn clone compatibility
from sklearn.base import clone
scaler = CustomLogScaler(offset=2.5)
cloned_scaler = clone(scaler)
assert cloned_scaler.offset == 2.5
```
"""

class RobustOutlierTargetEncoder(BaseEstimator, TransformerMixin):
    def __init__(
        self,
        iqr_multiplier: float = 1.5,
        smoothing: float = 10.0,
        numeric_cols: Optional[List[str]] = None,
        categorical_cols: Optional[List[str]] = None
    ):
        self.iqr_multiplier = iqr_multiplier
        self.smoothing = smoothing
        self.numeric_cols = numeric_cols
        self.categorical_cols = categorical_cols

    def fit(self, X, y):
        if y is None:
            raise ValueError("RobustOutlierTargetEncoder requires target y for fitting.")
            
        df_x = pd.DataFrame(X)
        y_arr = np.asarray(y, dtype=np.float64)
        
        num_cols = self.numeric_cols if self.numeric_cols is not None else list(df_x.select_dtypes(include=[np.number]).columns)
        cat_cols = self.categorical_cols if self.categorical_cols is not None else [c for c in df_x.columns if c not in num_cols]
        
        self.num_cols_ = list(num_cols)
        self.cat_cols_ = list(cat_cols)
        self.global_mean_ = float(np.mean(y_arr))
        
        self.bounds_ = {}
        for col in self.num_cols_:
            vals = df_x[col].to_numpy(dtype=np.float64)
            q25, q75 = np.percentile(vals, [25, 75])
            iqr = q75 - q25
            lower = q25 - self.iqr_multiplier * iqr
            upper = q75 + self.iqr_multiplier * iqr
            self.bounds_[col] = (lower, upper)
            
        self.encodings_ = {}
        for col in self.cat_cols_:
            col_series = df_x[col]
            temp_df = pd.DataFrame({"cat": col_series, "y": y_arr})
            grouped = temp_df.groupby("cat", observed=True)["y"].agg(["count", "mean"])
            
            m = self.smoothing
            smooth_values = (grouped["count"] * grouped["mean"] + m * self.global_mean_) / (grouped["count"] + m)
            self.encodings_[col] = smooth_values.to_dict()
            
        self.n_features_out_ = len(self.num_cols_) + len(self.cat_cols_)
        return self

    def transform(self, X):
        check_is_fitted(self, attributes=["bounds_", "encodings_", "global_mean_", "num_cols_", "cat_cols_"])
        df_x = pd.DataFrame(X)
        
        transformed_parts = []
        
        for col in self.num_cols_:
            lower, upper = self.bounds_[col]
            vals = df_x[col].to_numpy(dtype=np.float64)
            clipped = np.clip(vals, lower, upper)
            transformed_parts.append(clipped.reshape(-1, 1))
            
        for col in self.cat_cols_:
            mapping = self.encodings_[col]
            mapped = df_x[col].map(mapping).fillna(self.global_mean_).to_numpy(dtype=np.float64)
            transformed_parts.append(mapped.reshape(-1, 1))
            
        if len(transformed_parts) == 0:
            return np.empty((len(df_x), 0), dtype=np.float64)
            
        return np.hstack(transformed_parts).astype(np.float64)

# -----------------------------------------------------------------------------
# Challenge 1: Custom Outlier-Clipping & Target-Encoding Transformer
# -----------------------------------------------------------------------------

CHALLENGE_1 = {
    "id": "day04_ch01_robust_target_encoder",
    "title": "Custom Outlier-Clipping & Smooth Target-Encoder",
    "difficulty": "Hard",
    "category": "Custom Transformers & Feature Engineering",
    "description": (
        "Implement a fully Scikit-Learn compliant transformer `RobustOutlierTargetEncoder` inheriting from "
        "`BaseEstimator` and `TransformerMixin`. The transformer must apply IQR-based Winsorization to numeric "
        "features and smoothed M-estimate target encoding to categorical features, with full support for unseen "
        "categories and `sklearn.base.clone`."
    ),
    "instructions": (
        "1. Implement `RobustOutlierTargetEncoder(BaseEstimator, TransformerMixin)`.\n"
        "2. `__init__(self, iqr_multiplier: float = 1.5, smoothing: float = 10.0, numeric_cols: list = None, categorical_cols: list = None)`:\n"
        "   - Store all arguments as attributes with identical names.\n"
        "3. `fit(self, X, y)`:\n"
        "   - Calculate IQR bounds $[Q_1 - k \\cdot \\text{IQR}, Q_3 + k \\cdot \\text{IQR}]$ for each numeric column.\n"
        "   - Compute global target mean $\\bar{y}_{\\text{global}} = \\text{mean}(y)$.\n"
        "   - Compute smoothed target encoding for each category $c$ in categorical columns:\n"
        "     $$S(c) = \\frac{n_c \\cdot \\bar{y}_c + m \\cdot \\bar{y}_{\\text{global}}}{n_c + m}$$\n"
        "   - Store learned state in `self.bounds_`, `self.encodings_`, and `self.global_mean_`.\n"
        "   - Return `self`.\n"
        "4. `transform(self, X)`:\n"
        "   - Check fitted status with `check_is_fitted`.\n"
        "   - Clip numeric features to learned `[lower, upper]` bounds.\n"
        "   - Map categorical features to smoothed target values (fallback to `self.global_mean_` for unseen categories).\n"
        "   - Return a 2D float64 NumPy array of shape `(N, n_numeric + n_categorical)`.\n"
        "5. Guarantee full compatibility with `sklearn.base.clone(encoder)`."
    ),
    "starter_code": r'''import numpy as np
import pandas as pd
from typing import List, Optional
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.utils.validation import check_is_fitted

class RobustOutlierTargetEncoder(BaseEstimator, TransformerMixin):
    def __init__(
        self,
        iqr_multiplier: float = 1.5,
        smoothing: float = 10.0,
        numeric_cols: Optional[List[str]] = None,
        categorical_cols: Optional[List[str]] = None
    ):
        self.iqr_multiplier = iqr_multiplier
        self.smoothing = smoothing
        self.numeric_cols = numeric_cols
        self.categorical_cols = categorical_cols

    def fit(self, X, y):
        # TODO: Implement IQR fitting and smoothed target statistics
        return self

    def transform(self, X):
        # TODO: Implement clipping, categorical mapping, and array return
        pass
''',
    "reference_solution": r'''import numpy as np
import pandas as pd
from typing import List, Optional
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.utils.validation import check_is_fitted

class RobustOutlierTargetEncoder(BaseEstimator, TransformerMixin):
    def __init__(
        self,
        iqr_multiplier: float = 1.5,
        smoothing: float = 10.0,
        numeric_cols: Optional[List[str]] = None,
        categorical_cols: Optional[List[str]] = None
    ):
        self.iqr_multiplier = iqr_multiplier
        self.smoothing = smoothing
        self.numeric_cols = numeric_cols
        self.categorical_cols = categorical_cols

    def fit(self, X, y):
        if y is None:
            raise ValueError("RobustOutlierTargetEncoder requires target y for fitting.")
            
        df_x = pd.DataFrame(X)
        y_arr = np.asarray(y, dtype=np.float64)
        
        num_cols = self.numeric_cols if self.numeric_cols is not None else list(df_x.select_dtypes(include=[np.number]).columns)
        cat_cols = self.categorical_cols if self.categorical_cols is not None else [c for c in df_x.columns if c not in num_cols]
        
        self.num_cols_ = list(num_cols)
        self.cat_cols_ = list(cat_cols)
        self.global_mean_ = float(np.mean(y_arr))
        
        # 1. Fit IQR bounds for numeric columns
        self.bounds_ = {}
        for col in self.num_cols_:
            vals = df_x[col].to_numpy(dtype=np.float64)
            q25, q75 = np.percentile(vals, [25, 75])
            iqr = q75 - q25
            lower = q25 - self.iqr_multiplier * iqr
            upper = q75 + self.iqr_multiplier * iqr
            self.bounds_[col] = (lower, upper)
            
        # 2. Fit smoothed target encoding for categorical columns
        self.encodings_ = {}
        for col in self.cat_cols_:
            col_series = df_x[col]
            # Group by category and compute counts & sums of target
            temp_df = pd.DataFrame({"cat": col_series, "y": y_arr})
            grouped = temp_df.groupby("cat", observed=True)["y"].agg(["count", "mean"])
            
            # M-estimate smoothing: (count * mean + m * global_mean) / (count + m)
            m = self.smoothing
            smooth_values = (grouped["count"] * grouped["mean"] + m * self.global_mean_) / (grouped["count"] + m)
            self.encodings_[col] = smooth_values.to_dict()
            
        self.n_features_out_ = len(self.num_cols_) + len(self.cat_cols_)
        return self

    def transform(self, X):
        check_is_fitted(self, attributes=["bounds_", "encodings_", "global_mean_", "num_cols_", "cat_cols_"])
        df_x = pd.DataFrame(X)
        
        transformed_parts = []
        
        # 1. Transform numeric cols (clipping)
        for col in self.num_cols_:
            lower, upper = self.bounds_[col]
            vals = df_x[col].to_numpy(dtype=np.float64)
            clipped = np.clip(vals, lower, upper)
            transformed_parts.append(clipped.reshape(-1, 1))
            
        # 2. Transform categorical cols (smoothed lookup)
        for col in self.cat_cols_:
            mapping = self.encodings_[col]
            mapped = df_x[col].map(mapping).fillna(self.global_mean_).to_numpy(dtype=np.float64)
            transformed_parts.append(mapped.reshape(-1, 1))
            
        if len(transformed_parts) == 0:
            return np.empty((len(df_x), 0), dtype=np.float64)
            
        return np.hstack(transformed_parts).astype(np.float64)
''',
    "test_suite": r'''import numpy as np
import pandas as pd
from sklearn.base import clone

def run_tests(candidate_class):
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # 1. Cloneability Test
    transformer = candidate_class(iqr_multiplier=2.0, smoothing=5.0, numeric_cols=["age"], categorical_cols=["job"])
    cloned = clone(transformer)
    assert_test(cloned.iqr_multiplier == 2.0, "Cloned iqr_multiplier mismatch")
    assert_test(cloned.smoothing == 5.0, "Cloned smoothing mismatch")
    
    # 2. Functional Correctness
    df_train = pd.DataFrame({
        "age": [20, 22, 21, 23, 100],  # 100 is an outlier
        "job": ["dev", "dev", "dev", "mgr", "mgr"]
    })
    y_train = np.array([1, 1, 1, 0, 0], dtype=float)
    
    transformer.fit(df_train, y_train)
    assert_test(hasattr(transformer, "bounds_"), "Missing bounds_ after fit")
    assert_test(hasattr(transformer, "encodings_"), "Missing encodings_ after fit")
    
    transformed_train = transformer.transform(df_train)
    assert_test(transformed_train.shape == (5, 2), f"Expected shape (5, 2), got {transformed_train.shape}")
    
    # Verify outlier was clipped below 100
    assert_test(transformed_train[4, 0] < 100.0, f"Outlier 100 was not clipped: got {transformed_train[4, 0]}")
    
    # 3. Handling Unseen Categories in Test Data
    df_test = pd.DataFrame({
        "age": [25, 30],
        "job": ["intern", "ceo"]  # Unseen categories
    })
    transformed_test = transformer.transform(df_test)
    assert_test(transformed_test.shape == (2, 2), "Test transform shape mismatch")
    # Unseen categories should receive global mean (3/5 = 0.6)
    expected_global = 3.0 / 5.0
    assert_test(np.isclose(transformed_test[0, 1], expected_global, atol=1e-5), "Unseen category did not fallback to global mean")

    return report
''',
    "hints": [
        "Store constructor args directly on `self` to maintain `sklearn.base.clone` compatibility.",
        "Compute $Q_1, Q_3$ via `np.percentile` and clip with `np.clip`.",
        "For smoothing, use $(n \\cdot \\bar{y}_c + m \\cdot \\bar{y}_{\\text{global}}) / (n + m)$ and `.fillna(self.global_mean_)` in transform."
    ]
}

# -----------------------------------------------------------------------------
# Challenge 2: Production Classification Pipeline with Stratified CV
# -----------------------------------------------------------------------------

CHALLENGE_2 = {
    "id": "day04_ch02_cv_classification_pipeline",
    "title": "Production Classification Pipeline with GridSearch & CV Assertions",
    "difficulty": "Hard",
    "category": "Pipelines & Model Selection",
    "description": (
        "Construct an end-to-end scikit-learn `Pipeline` integrating `RobustOutlierTargetEncoder`, "
        "`StandardScaler`, and `HistGradientBoostingClassifier`. Tune hyperparameters using 5-fold "
        "`StratifiedKFold` cross-validation with `GridSearchCV` to achieve ROC-AUC > 0.85 on imbalanced data."
    ),
    "instructions": (
        "1. Implement `build_and_tune_pipeline(X: pd.DataFrame, y: pd.Series, numeric_cols: list, categorical_cols: list) -> dict`.\n"
        "2. Create a `Pipeline` with steps:\n"
        "   - `'encoder'`: `RobustOutlierTargetEncoder(numeric_cols=numeric_cols, categorical_cols=categorical_cols)`\n"
        "   - `'scaler'`: `StandardScaler()`\n"
        "   - `'classifier'`: `HistGradientBoostingClassifier(random_state=42)`\n"
        "3. Set up parameter grid tuning `'encoder__smoothing'` in `[5.0, 15.0]`, `'classifier__max_iter'` in `[30, 60]`, `'classifier__learning_rate'` in `[0.05, 0.1]`.\n"
        "4. Perform `GridSearchCV` with 5-fold `StratifiedKFold(shuffle=True, random_state=42)` scoring `'roc_auc'`.\n"
        "5. Return dictionary with `{'best_model': grid_search.best_estimator_, 'best_params': grid_search.best_params_, 'best_cv_roc_auc': grid_search.best_score_}`."
    ),
    "starter_code": r'''import pandas as pd
import numpy as np
from typing import Dict, Any, List
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.model_selection import StratifiedKFold, GridSearchCV

def build_and_tune_pipeline(
    X: pd.DataFrame,
    y: pd.Series,
    numeric_cols: List[str],
    categorical_cols: List[str]
) -> Dict[str, Any]:
    """
    Build and cross-validate an anti-leakage classification pipeline.
    """
    # TODO: Implement Pipeline, StratifiedKFold, and GridSearchCV
    pass
''',
    "reference_solution": r'''import pandas as pd
import numpy as np
from typing import Dict, Any, List
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.model_selection import StratifiedKFold, GridSearchCV
from server.curriculum.day04_sklearn import RobustOutlierTargetEncoder

def build_and_tune_pipeline(
    X: pd.DataFrame,
    y: pd.Series,
    numeric_cols: List[str],
    categorical_cols: List[str]
) -> Dict[str, Any]:
    pipeline = Pipeline([
        ("encoder", RobustOutlierTargetEncoder(numeric_cols=numeric_cols, categorical_cols=categorical_cols)),
        ("scaler", StandardScaler()),
        ("classifier", HistGradientBoostingClassifier(random_state=42))
    ])
    
    param_grid = {
        "encoder__smoothing": [5.0, 15.0],
        "classifier__max_iter": [30, 60],
        "classifier__learning_rate": [0.05, 0.1]
    }
    
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    grid_search = GridSearchCV(
        estimator=pipeline,
        param_grid=param_grid,
        scoring="roc_auc",
        cv=cv,
        n_jobs=-1
    )
    
    grid_search.fit(X, y)
    
    return {
        "best_model": grid_search.best_estimator_,
        "best_params": grid_search.best_params_,
        "best_cv_roc_auc": float(grid_search.best_score_)
    }
''',
    "test_suite": r'''import pandas as pd
import numpy as np

def run_tests(candidate_func):
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # 1. Generate realistic synthetic classification problem
    np.random.seed(42)
    N = 400
    numeric_cols = ["credit_score", "annual_income", "debt_ratio"]
    categorical_cols = ["employment_type", "home_ownership"]
    
    df_x = pd.DataFrame({
        "credit_score": np.random.normal(650, 50, size=N),
        "annual_income": np.random.exponential(50000, size=N),
        "debt_ratio": np.random.uniform(0.1, 0.8, size=N),
        "employment_type": np.random.choice(["Full-Time", "Self-Employed", "Part-Time", "Unemployed"], size=N),
        "home_ownership": np.random.choice(["RENT", "OWN", "MORTGAGE"], size=N)
    })
    
    # Generate ground truth target correlated with features
    logits = (
        (df_x["credit_score"] - 650) / 40.0 +
        (df_x["annual_income"] - 50000) / 30000.0 -
        (df_x["debt_ratio"] - 0.4) * 4.0 +
        (df_x["employment_type"] == "Full-Time").astype(float) * 1.5
    )
    probs = 1.0 / (1.0 + np.exp(-logits))
    y = pd.Series((probs >= 0.5).astype(int), name="default")
    
    res = candidate_func(df_x, y, numeric_cols, categorical_cols)
    
    assert_test(isinstance(res, dict), "Result must be a dictionary")
    assert_test("best_model" in res, "Missing 'best_model'")
    assert_test("best_cv_roc_auc" in res, "Missing 'best_cv_roc_auc'")
    assert_test(res["best_cv_roc_auc"] > 0.80, f"Expected ROC-AUC > 0.80, got {res['best_cv_roc_auc']:.3f}")
    
    # Verify predictions on test set
    best_model = res["best_model"]
    test_preds = best_model.predict_proba(df_x.iloc[:10])
    assert_test(test_preds.shape == (10, 2), f"Prediction shape mismatch: {test_preds.shape}")

    return report
''',
    "hints": [
        "Use `sklearn.pipeline.Pipeline` with steps `[('encoder', RobustOutlierTargetEncoder(...)), ('scaler', StandardScaler()), ('classifier', HistGradientBoostingClassifier())]`.",
        "Set `cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)` in `GridSearchCV`.",
        "Pass `scoring='roc_auc'` to optimize area under the ROC curve."
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
