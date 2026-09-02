"""
Part 4: Supervised Regression & Metrics
PyMastery Progressive Zero-to-Hero Scikit-Learn Curriculum
"""

import numpy as np
from typing import Dict, Any, List
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

DAY_METADATA = {
    "day_id": "sklearn_04",
    "day_number": 4,
    "title": "Part 4: Supervised Regression & Metrics",
    "tagline": "Fit continuous targets with Linear Regression and penalize multicollinearity with Ridge L2 regularization.",
    "estimated_time": "1-2 hours",
    "concepts_covered": [
        "Ordinary Least Squares (OLS) formulation and assumptions",
        "Error metrics: Mean Absolute Error (MAE) vs Mean Squared Error (MSE) vs RMSE",
        "R-squared (R2) coefficient of determination: proportion of explained variance",
        "The problem of multicollinearity and inflated parameter variance",
        "Ridge (L2) Regularization: shrinkage of coefficient norms"
    ]
}

CONCEPT_PRIMER = r"""# Part 4 Concept Primer: Supervised Regression & Regularization

## 1. Linear Regression & Ordinary Least Squares (OLS)
In regression, the objective is to predict a continuous target variable $y \in \mathbb{R}$ from feature vector $\mathbf{x} \in \mathbb{R}^D$:
$$\hat{y} = w_0 + w_1 x_1 + w_2 x_2 + \dots + w_D x_D = \mathbf{w}^T \mathbf{x} + b$$
Ordinary Least Squares solves for $\mathbf{w}$ by minimizing the Residual Sum of Squares (RSS):
$$\mathcal{L}_{\text{OLS}}(\mathbf{w}) = \sum_{i=1}^N (y_i - \hat{y}_i)^2 = \|\mathbf{y} - \mathbf{X}\mathbf{w}\|_2^2$$

The closed-form analytical solution is the Normal Equation:
$$\mathbf{w}^* = (\mathbf{X}^T \mathbf{X})^{-1} \mathbf{X}^T \mathbf{y}$$

---

## 2. Regression Evaluation Metrics
Evaluating regression predictions $\hat{y}$ against ground truth $y$:

1. **Mean Absolute Error (MAE):**
   $$\text{MAE} = \frac{1}{N}\sum_{i=1}^N |y_i - \hat{y}_i|$$
   Linear penalty; robust to outliers and easy to interpret in the original units of $y$.

2. **Mean Squared Error (MSE) & Root MSE (RMSE):**
   $$\text{MSE} = \frac{1}{N}\sum_{i=1}^N (y_i - \hat{y}_i)^2, \quad \text{RMSE} = \sqrt{\text{MSE}}$$
   Quadratic penalty; heavily punishes large errors. RMSE returns the error to the original scale of $y$.

3. **Coefficient of Determination ($R^2$ Score):**
   $$R^2 = 1 - \frac{\sum (y_i - \hat{y}_i)^2}{\sum (y_i - \bar{y})^2} = 1 - \frac{\text{SS}_{\text{res}}}{\text{SS}_{\text{tot}}}$$
   * $R^2 = 1.0$: Perfect predictions.
   * $R^2 = 0.0$: Equivalent to always predicting the baseline mean $\bar{y}$.
   * $R^2 < 0.0$: Model performs worse than the simple sample mean!

---

## 3. Multicollinearity & Ridge (L2) Regularization
When features are strongly correlated, the matrix $\mathbf{X}^T \mathbf{X}$ becomes nearly singular (ill-conditioned). OLS coefficients explode in magnitude, making the model hyper-sensitive to small changes in input data.

**Ridge Regression** adds an L2 penalty on weight magnitudes controlled by hyperparameter $\alpha \ge 0$:
$$\mathcal{L}_{\text{Ridge}}(\mathbf{w}) = \|\mathbf{y} - \mathbf{X}\mathbf{w}\|_2^2 + \alpha \|\mathbf{w}\|_2^2$$

Closed-form solution:
$$\mathbf{w}^*_{\text{Ridge}} = (\mathbf{X}^T \mathbf{X} + \alpha \mathbf{I})^{-1} \mathbf{X}^T \mathbf{y}$$

* As $\alpha$ increases, coefficients $\mathbf{w}$ shrink toward zero ($\|\mathbf{w}\|_2$ decreases).
* This introduces slight bias in exchange for a dramatic reduction in variance, preventing overfitting on noisy or collinear data.
"""

WALKTHROUGH = r"""# Part 4 Code Walkthrough: OLS vs Ridge Regression

```python
import numpy as np
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

# 1. Synthetic dataset with collinear features
np.random.seed(42)
N = 100
x1 = np.random.randn(N, 1)
x2 = x1 + np.random.randn(N, 1) * 0.05  # Highly correlated with x1
X = np.hstack([x1, x2])
y = 3.0 * x1[:, 0] + 2.0 * x2[:, 0] + np.random.randn(N) * 0.5

# 2. Fit Ordinary Least Squares (LinearRegression)
ols = LinearRegression().fit(X, y)
y_pred_ols = ols.predict(X)
print("OLS Coefficients:", ols.coef_)
print("OLS L2 Norm:    ", np.linalg.norm(ols.coef_))
print("OLS R2 Score:   ", r2_score(y, y_pred_ols))
print("OLS RMSE:       ", np.sqrt(mean_squared_error(y, y_pred_ols)))

# 3. Fit Ridge Regression with L2 Regularization
ridge = Ridge(alpha=10.0, random_state=42).fit(X, y)
y_pred_ridge = ridge.predict(X)
print("\nRidge Coefficients:", ridge.coef_)
print("Ridge L2 Norm:    ", np.linalg.norm(ridge.coef_))
print("Ridge R2 Score:   ", r2_score(y, y_pred_ridge))
print("Ridge RMSE:       ", np.sqrt(mean_squared_error(y, y_pred_ridge)))
```
"""

# -----------------------------------------------------------------------------
# Challenge 1: Housing Price Regressor
# -----------------------------------------------------------------------------

CHALLENGE_1 = {
    "id": "sk-p4-c1",
    "title": "Housing Price Regressor",
    "difficulty": "Beginner",
    "category": "Regression",
    "description": (
        "Train an ordinary least squares regression model on continuous housing features, predict "
        "test set target values, and evaluate standard continuous error metrics: MAE, MSE, RMSE, and R-squared."
    ),
    "instructions": (
        "Write a function `train_housing_regressor(X_train: np.ndarray, y_train: np.ndarray, X_test: np.ndarray, y_test: np.ndarray) -> dict` that:\n"
        "1. Validates inputs:\n"
        "   - If `len(X_train) != len(y_train)`, raise `ValueError(\"X_train and y_train length mismatch\")`.\n"
        "   - If `len(X_test) != len(y_test)`, raise `ValueError(\"X_test and y_test length mismatch\")`.\n"
        "   - If `len(X_train) == 0` or `len(X_test) == 0`, raise `ValueError(\"Arrays must contain at least 1 sample\")`.\n"
        "2. Trains an ordinary least squares linear regression model on the training split `(X_train, y_train)`.\n"
        "3. Generates continuous predictions on the test features (`X_test`) into `y_pred`.\n"
        "4. Computes regression evaluation metrics comparing test targets and predictions:\n"
        "   - `mae`: float mean absolute error\n"
        "   - `mse`: float mean squared error\n"
        "   - `rmse`: float root mean squared error (square root of MSE)\n"
        "   - `r2`: float coefficient of determination (R-squared score)\n"
        "5. Returns a dictionary:\n"
        "   `{\"model\": model, \"y_pred\": y_pred, \"mae\": mae, \"mse\": mse, \"rmse\": rmse, \"r2\": r2}`"
    ),
    "starter_code": r'''import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

def train_housing_regressor(X_train: np.ndarray, y_train: np.ndarray, X_test: np.ndarray, y_test: np.ndarray) -> dict:
    """
    Train an ordinary least squares regression model and compute MAE, MSE, RMSE, and R2 metrics.

    Args:
        X_train: Training features of shape (n_samples, n_features)
        y_train: Continuous target values of shape (n_samples,)
        X_test: Testing features
        y_test: Testing continuous targets

    Returns:
        dict with model, y_pred, mae, mse, rmse, r2
    """
    # TODO: Validate inputs, fit regression model, predict, compute metrics, return dict
    pass
''',
    "reference_solution": r'''import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

def train_housing_regressor(X_train: np.ndarray, y_train: np.ndarray, X_test: np.ndarray, y_test: np.ndarray) -> dict:
    if len(X_train) != len(y_train):
        raise ValueError("X_train and y_train length mismatch")
    if len(X_test) != len(y_test):
        raise ValueError("X_test and y_test length mismatch")
    if len(X_train) == 0 or len(X_test) == 0:
        raise ValueError("Arrays must contain at least 1 sample")

    model = LinearRegression()
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    mae = float(mean_absolute_error(y_test, y_pred))
    mse = float(mean_squared_error(y_test, y_pred))
    rmse = float(np.sqrt(mse))
    r2 = float(r2_score(y_test, y_pred))

    return {
        "model": model,
        "y_pred": y_pred,
        "mae": mae,
        "mse": mse,
        "rmse": rmse,
        "r2": r2,
    }
''',
    "test_suite": r'''import numpy as np
from sklearn.linear_model import LinearRegression

def run_tests(candidate_func):
    report = {"passed": True, "tests_run": 0, "errors": []}

    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Test 1: Exact linear function y = 2*x1 + 3*x2 + 5
    X_tr = np.array([[1.0, 2.0], [2.0, 0.0], [0.0, 1.0], [3.0, 3.0]])
    y_tr = np.array([13.0, 9.0, 8.0, 20.0])
    X_te = np.array([[1.0, 1.0], [2.0, 2.0]])
    y_te = np.array([10.0, 15.0])

    res = candidate_func(X_tr, y_tr, X_te, y_te)

    assert_test(isinstance(res, dict), "Result must be a dictionary")
    assert_test(isinstance(res.get("model"), LinearRegression), "model must be LinearRegression instance")
    assert_test(np.allclose(res["y_pred"], [10.0, 15.0], atol=1e-5), f"y_pred mismatch: got {res['y_pred']}")
    assert_test(abs(res["mae"]) < 1e-5, f"MAE should be ~0.0, got {res['mae']}")
    assert_test(abs(res["mse"]) < 1e-5, f"MSE should be ~0.0, got {res['mse']}")
    assert_test(abs(res["rmse"]) < 1e-5, f"RMSE should be ~0.0, got {res['rmse']}")
    assert_test(abs(res["r2"] - 1.0) < 1e-5, f"R2 should be ~1.0, got {res['r2']}")

    # Test 2: Input length mismatch validation
    raised_len = False
    try:
        candidate_func(np.ones((4, 2)), np.ones(3), X_te, y_te)
    except ValueError:
        raised_len = True
    assert_test(raised_len, "Must raise ValueError on train length mismatch")

    # Test 3: Empty inputs validation
    raised_empty = False
    try:
        candidate_func(np.empty((0, 2)), np.empty(0), X_te, y_te)
    except ValueError:
        raised_empty = True
    assert_test(raised_empty, "Must raise ValueError on empty inputs")

    return report
''',
    "hints": [
        "Instantiate LinearRegression() and fit on (X_train, y_train).",
        "Predict with y_pred = model.predict(X_test).",
        "Compute MAE, MSE, RMSE, and R2 using scikit-learn metrics and np.sqrt(mse)."
    ]
}

# -----------------------------------------------------------------------------
# Challenge 2: Regularized Ridge Predictor
# -----------------------------------------------------------------------------

CHALLENGE_2 = {
    "id": "sk-p4-c2",
    "title": "Regularized Ridge Predictor",
    "difficulty": "Beginner",
    "category": "Regression",
    "description": (
        "Train both an unregularized ordinary least squares model and an L2-regularized linear model on "
        "collinear feature data, and evaluate coefficient shrinkage alongside generalization performance."
    ),
    "instructions": (
        "Write a function `compare_ols_and_ridge(X_train: np.ndarray, y_train: np.ndarray, X_test: np.ndarray, y_test: np.ndarray, alpha: float = 1.0) -> dict` that:\n"
        "1. Validates inputs:\n"
        "   - If `alpha < 0.0`, raise `ValueError(\"alpha must be non-negative\")`.\n"
        "   - If `len(X_train) != len(y_train)`, raise `ValueError(\"X_train and y_train length mismatch\")`.\n"
        "   - If `len(X_test) != len(y_test)`, raise `ValueError(\"X_test and y_test length mismatch\")`.\n"
        "   - If `len(X_train) == 0` or `len(X_test) == 0`, raise `ValueError(\"Arrays must contain at least 1 sample\")`.\n"
        "2. Trains an unregularized ordinary least squares model (`ols`) on `(X_train, y_train)`.\n"
        "3. Trains an L2-regularized linear regression model (`ridge`) on `(X_train, y_train)` with the specified regularization strength `alpha` and `random_state=42`.\n"
        "4. Evaluates continuous predictions on the test split (`X_test`) for both models and computes their respective test R-squared scores (`ols_r2` and `ridge_r2`).\n"
        "5. Computes the Euclidean L2 norm of the learned coefficient weight vectors (`ols_norm` and `ridge_norm`).\n"
        "6. Returns a dictionary:\n"
        "   `{\"ols_model\": ols, \"ridge_model\": ridge, \"ols_coef\": ols.coef_, \"ridge_coef\": ridge.coef_, \"ols_r2\": ols_r2, \"ridge_r2\": ridge_r2, \"ols_norm\": ols_norm, \"ridge_norm\": ridge_norm}`"
    ),
    "starter_code": r'''import numpy as np
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.metrics import r2_score

def compare_ols_and_ridge(X_train: np.ndarray, y_train: np.ndarray, X_test: np.ndarray, y_test: np.ndarray, alpha: float = 1.0) -> dict:
    """
    Compare unregularized ordinary least squares and L2-regularized ridge regression.

    Args:
        X_train: Training features
        y_train: Training targets
        X_test: Testing features
        y_test: Testing targets
        alpha: L2 regularization strength

    Returns:
        dict with ols_model, ridge_model, ols_coef, ridge_coef, ols_r2, ridge_r2, ols_norm, ridge_norm
    """
    # TODO: Validate inputs, fit both models, compute predictions, R2, and L2 norms, return dict
    pass
''',
    "reference_solution": r'''import numpy as np
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.metrics import r2_score

def compare_ols_and_ridge(X_train: np.ndarray, y_train: np.ndarray, X_test: np.ndarray, y_test: np.ndarray, alpha: float = 1.0) -> dict:
    if alpha < 0.0:
        raise ValueError("alpha must be non-negative")
    if len(X_train) != len(y_train):
        raise ValueError("X_train and y_train length mismatch")
    if len(X_test) != len(y_test):
        raise ValueError("X_test and y_test length mismatch")
    if len(X_train) == 0 or len(X_test) == 0:
        raise ValueError("Arrays must contain at least 1 sample")

    ols = LinearRegression().fit(X_train, y_train)
    ridge = Ridge(alpha=alpha, random_state=42).fit(X_train, y_train)

    ols_pred = ols.predict(X_test)
    ridge_pred = ridge.predict(X_test)

    ols_r2 = float(r2_score(y_test, ols_pred))
    ridge_r2 = float(r2_score(y_test, ridge_pred))

    ols_norm = float(np.linalg.norm(ols.coef_))
    ridge_norm = float(np.linalg.norm(ridge.coef_))

    return {
        "ols_model": ols,
        "ridge_model": ridge,
        "ols_coef": ols.coef_,
        "ridge_coef": ridge.coef_,
        "ols_r2": ols_r2,
        "ridge_r2": ridge_r2,
        "ols_norm": ols_norm,
        "ridge_norm": ridge_norm,
    }
''',
    "test_suite": r'''import numpy as np
from sklearn.linear_model import LinearRegression, Ridge

def run_tests(candidate_func):
    report = {"passed": True, "tests_run": 0, "errors": []}

    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Test 1: Collinear features to observe L2 coefficient shrinkage
    np.random.seed(42)
    x1 = np.random.randn(80, 1)
    x2 = x1 + np.random.randn(80, 1) * 0.01  # Almost duplicate of x1
    X_tr = np.hstack([x1, x2])
    y_tr = 5.0 * x1[:, 0] + 3.0 * x2[:, 0] + np.random.randn(80) * 0.1

    x1_te = np.random.randn(20, 1)
    x2_te = x1_te + np.random.randn(20, 1) * 0.01
    X_te = np.hstack([x1_te, x2_te])
    y_te = 5.0 * x1_te[:, 0] + 3.0 * x2_te[:, 0] + np.random.randn(20) * 0.1

    res = candidate_func(X_tr, y_tr, X_te, y_te, alpha=10.0)

    assert_test(isinstance(res, dict), "Result must be a dictionary")
    assert_test(isinstance(res.get("ols_model"), LinearRegression), "ols_model must be LinearRegression")
    assert_test(isinstance(res.get("ridge_model"), Ridge), "ridge_model must be Ridge")
    assert_test("ols_r2" in res and "ridge_r2" in res, "Missing R2 scores")
    assert_test("ols_norm" in res and "ridge_norm" in res, "Missing L2 norms")

    # In regularized Ridge with alpha=10.0, the L2 norm of weights should be strictly less than OLS
    assert_test(res["ridge_norm"] < res["ols_norm"], f"Ridge norm ({res['ridge_norm']}) must be smaller than OLS norm ({res['ols_norm']}) due to L2 shrinkage!")

    # Test 2: Invalid negative alpha validation
    raised_alpha = False
    try:
        candidate_func(X_tr, y_tr, X_te, y_te, alpha=-1.0)
    except ValueError:
        raised_alpha = True
    assert_test(raised_alpha, "Must raise ValueError when alpha < 0")

    return report
''',
    "hints": [
        "Fit LinearRegression() and Ridge(alpha=alpha, random_state=42) on (X_train, y_train).",
        "Compute predictions on X_test and evaluate r2_score(y_test, pred).",
        "Use np.linalg.norm(model.coef_) to compute the Euclidean L2 norm of the weights."
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
