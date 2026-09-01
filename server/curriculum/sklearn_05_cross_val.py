"""
Part 5: Cross-Validation & Hyperparameter Search
PyMastery Progressive Zero-to-Hero Scikit-Learn Curriculum
"""

import numpy as np
from typing import Dict, Any, List
from sklearn.model_selection import StratifiedKFold, cross_val_score, GridSearchCV
from sklearn.tree import DecisionTreeClassifier

DAY_METADATA = {
    "day_id": "sklearn_05",
    "day_number": 5,
    "title": "Part 5: Cross-Validation & Hyperparameter Search",
    "tagline": "Evaluate model variance across K-folds and systematically optimize hyperparameter grids.",
    "estimated_time": "1-2 hours",
    "concepts_covered": [
        "The instability of single holdout train/test splits",
        "K-Fold vs Stratified K-Fold cross-validation",
        "Evaluating generalization variance with cross_val_score",
        "Hyperparameter search spaces: max_depth, min_samples_split",
        "Exhaustive search and refitting with GridSearchCV"
    ]
}

CONCEPT_PRIMER = r"""# Part 5 Concept Primer: Cross-Validation & Hyperparameter Optimization

## 1. The Single Split Vulnerability
A single train/test partition is subject to **sampling variance**:
* By luck, an easy subset of samples may land in the test set, inflating accuracy.
* Conversely, rare difficult edge cases may cluster in the test set, underestimating model capability.
* Evaluating hyperparameters on a single test set leads to **overfitting the test set**.

---

## 2. K-Fold & Stratified K-Fold Cross-Validation
Cross-validation divides the dataset of $N$ samples into $K$ equal-sized partitions ("folds"):
1. The model is trained on $K-1$ folds and evaluated on the remaining fold.
2. This process repeats $K$ times, rotating the validation fold.
3. Every single sample is used for validation exactly once.

```
Total Dataset: [ Fold 1 | Fold 2 | Fold 3 | Fold 4 | Fold 5 ]
Iteration 1:   [  TEST  |  TRAIN |  TRAIN |  TRAIN |  TRAIN ] -> Score 1
Iteration 2:   [  TRAIN |  TEST  |  TRAIN |  TRAIN |  TRAIN ] -> Score 2
Iteration 3:   [  TRAIN |  TRAIN |  TEST  |  TRAIN |  TRAIN ] -> Score 3
Iteration 4:   [  TRAIN |  TRAIN |  TRAIN |  TEST  |  TRAIN ] -> Score 4
Iteration 5:   [  TRAIN |  TRAIN |  TRAIN |  TRAIN |  TEST  ] -> Score 5

Final Validation Estimate: Mean(Scores) ± Std(Scores)
```

* **`StratifiedKFold`:** Ensures each fold contains approximately the same percentage of target classes as the complete dataset. Essential for classification.

---

## 3. Systematic Tuning: GridSearchCV
Machine learning models contain **hyperparameters** that cannot be learned directly by gradient descent (e.g., maximum tree depth, regularization penalty $\alpha$, number of neighbors $k$).

`GridSearchCV` performs an exhaustive Cartesian product search over a dictionary of specified parameter values:
* For each candidate parameter combination, it runs $K$-fold cross-validation.
* Identifies the configuration with highest average validation score (`best_params_`).
* Automatically retrains the winning estimator on the full dataset (`best_estimator_`).
"""

WALKTHROUGH = r"""# Part 5 Code Walkthrough: Cross-Validation and GridSearchCV

```python
import numpy as np
from sklearn.datasets import make_classification
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import StratifiedKFold, cross_val_score, GridSearchCV

# 1. Generate synthetic dataset
X, y = make_classification(
    n_samples=200, n_features=5, n_informative=3,
    n_classes=2, weights=[0.7, 0.3], random_state=42
)

# 2. Stratified 5-Fold Cross-Validation
tree = DecisionTreeClassifier(max_depth=3, random_state=42)
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
scores = cross_val_score(tree, X, y, cv=cv, scoring="accuracy")

print("CV Accuracy Scores:", scores)
print(f"Mean Score: {scores.mean():.4f} (+/- {scores.std():.4f})")

# 3. Exhaustive Hyperparameter Tuning with GridSearchCV
param_grid = {
    "max_depth": [2, 3, 5, None],
    "min_samples_split": [2, 5, 10]
}

grid_search = GridSearchCV(
    estimator=DecisionTreeClassifier(random_state=42),
    param_grid=param_grid,
    cv=cv,
    scoring="f1_weighted",
    n_jobs=1
)
grid_search.fit(X, y)

print("\nBest Parameters:", grid_search.best_params_)
print(f"Best CV F1 Score: {grid_search.best_score_:.4f}")
print("Best Estimator: ", grid_search.best_estimator_)
```
"""

# -----------------------------------------------------------------------------
# Challenge 1: 5-Fold Stratified Cross-Validator
# -----------------------------------------------------------------------------

CHALLENGE_1 = {
    "id": "sk-p5-c1",
    "title": "5-Fold Stratified Cross-Validator",
    "difficulty": "Beginner",
    "category": "Model Selection",
    "description": (
        "Evaluate the generalization stability of any Scikit-Learn estimator using Stratified K-Fold "
        "cross-validation and compute summary performance statistics (mean, std, min, max)."
    ),
    "instructions": (
        "Write a function `evaluate_model_cv(estimator, X: np.ndarray, y: np.ndarray, n_splits: int = 5, scoring: str = \"accuracy\", random_state: int = 42) -> dict` that:\n"
        "1. Validates inputs:\n"
        "   - If `n_splits < 2`, raise `ValueError(\"n_splits must be at least 2\")`.\n"
        "   - If `len(X) != len(y)`, raise `ValueError(\"X and y length mismatch\")`.\n"
        "   - If `len(X) == 0`, raise `ValueError(\"Arrays cannot be empty\")`.\n"
        "2. Configures `cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=random_state)`.\n"
        "3. Computes cross-validation scores via `cross_val_score(estimator, X, y, cv=cv, scoring=scoring)`.\n"
        "4. Calculates summary statistics:\n"
        "   - `mean_score`: float from `np.mean(scores)`\n"
        "   - `std_score`: float from `np.std(scores)`\n"
        "   - `min_score`: float from `np.min(scores)`\n"
        "   - `max_score`: float from `np.max(scores)`\n"
        "5. Returns a dictionary:\n"
        "   `{\"cv_scores\": scores, \"mean_score\": mean_score, \"std_score\": std_score, \"min_score\": min_score, \"max_score\": max_score}`"
    ),
    "starter_code": r'''import numpy as np
from sklearn.model_selection import StratifiedKFold, cross_val_score

def evaluate_model_cv(estimator, X: np.ndarray, y: np.ndarray, n_splits: int = 5, scoring: str = "accuracy", random_state: int = 42) -> dict:
    """
    Evaluate estimator performance using Stratified K-Fold cross-validation.

    Args:
        estimator: Scikit-learn classifier
        X: Feature matrix of shape (n_samples, n_features)
        y: Discrete target labels of shape (n_samples,)
        n_splits: Number of cross-validation folds (default 5)
        scoring: Evaluation metric name (default 'accuracy')
        random_state: Random seed for fold shuffling

    Returns:
        dict with cv_scores, mean_score, std_score, min_score, max_score
    """
    # TODO: Validate inputs, run StratifiedKFold cross_val_score, compute stats, return dict
    pass
''',
    "reference_solution": r'''import numpy as np
from sklearn.model_selection import StratifiedKFold, cross_val_score

def evaluate_model_cv(estimator, X: np.ndarray, y: np.ndarray, n_splits: int = 5, scoring: str = "accuracy", random_state: int = 42) -> dict:
    if n_splits < 2:
        raise ValueError("n_splits must be at least 2")
    if len(X) != len(y):
        raise ValueError("X and y length mismatch")
    if len(X) == 0:
        raise ValueError("Arrays cannot be empty")

    cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=random_state)
    scores = cross_val_score(estimator, X, y, cv=cv, scoring=scoring)

    return {
        "cv_scores": scores,
        "mean_score": float(np.mean(scores)),
        "std_score": float(np.std(scores)),
        "min_score": float(np.min(scores)),
        "max_score": float(np.max(scores)),
    }
''',
    "test_suite": r'''import numpy as np
from sklearn.tree import DecisionTreeClassifier

def run_tests(candidate_func):
    report = {"passed": True, "tests_run": 0, "errors": []}

    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Test 1: 5-Fold CV on binary classification problem
    np.random.seed(42)
    X = np.random.randn(100, 3)
    y = (X[:, 0] > 0).astype(int)
    clf = DecisionTreeClassifier(max_depth=2, random_state=42)

    res = candidate_func(clf, X, y, n_splits=5, scoring="accuracy", random_state=42)

    assert_test(isinstance(res, dict), "Result must be a dictionary")
    assert_test(len(res["cv_scores"]) == 5, f"Expected 5 fold scores, got {len(res['cv_scores'])}")
    assert_test(0.0 <= res["mean_score"] <= 1.0, "mean_score out of range")
    assert_test(res["min_score"] <= res["mean_score"] <= res["max_score"], "Min/Mean/Max inequality violated")
    assert_test(res["std_score"] >= 0.0, "std_score cannot be negative")

    # Test 2: Invalid n_splits validation
    raised_splits = False
    try:
        candidate_func(clf, X, y, n_splits=1)
    except ValueError:
        raised_splits = True
    assert_test(raised_splits, "Must raise ValueError when n_splits < 2")

    # Test 3: Length mismatch validation
    raised_len = False
    try:
        candidate_func(clf, X, np.ones(10), n_splits=5)
    except ValueError:
        raised_len = True
    assert_test(raised_len, "Must raise ValueError when X and y lengths differ")

    return report
''',
    "hints": [
        "Instantiate StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=random_state).",
        "Pass cv into cross_val_score(estimator, X, y, cv=cv, scoring=scoring).",
        "Compute mean, std, min, and max of the returned scores array."
    ]
}

# -----------------------------------------------------------------------------
# Challenge 2: Hyperparameter Grid Search Optimizer
# -----------------------------------------------------------------------------

CHALLENGE_2 = {
    "id": "sk-p5-c2",
    "title": "Hyperparameter Grid Search Optimizer",
    "difficulty": "Beginner",
    "category": "Model Selection",
    "description": (
        "Systematically optimize DecisionTreeClassifier hyperparameters over a grid of candidates "
        "using GridSearchCV and extract the best parameters, score, and fitted estimator."
    ),
    "instructions": (
        "Write a function `tune_decision_tree_grid(X: np.ndarray, y: np.ndarray, param_grid: dict, cv: int = 5, scoring: str = \"f1_weighted\", random_state: int = 42) -> dict` that:\n"
        "1. Validates inputs:\n"
        "   - If `param_grid` is empty or not a dict, raise `ValueError(\"param_grid cannot be empty\")`.\n"
        "   - If `len(X) != len(y)`, raise `ValueError(\"X and y length mismatch\")`.\n"
        "   - If `cv < 2`, raise `ValueError(\"cv must be at least 2\")`.\n"
        "2. Instantiates base estimator `tree = DecisionTreeClassifier(random_state=random_state)`.\n"
        "3. Creates `GridSearchCV(estimator=tree, param_grid=param_grid, cv=cv, scoring=scoring, n_jobs=1)`.\n"
        "4. Fits the grid search on `(X, y)`.\n"
        "5. Returns a dictionary:\n"
        "   - `\"grid_search\"`: the fitted GridSearchCV instance\n"
        "   - `\"best_params\"`: dict of best parameters (`grid.best_params_`)\n"
        "   - `\"best_score\"`: float average validation score (`float(grid.best_score_)`)\n"
        "   - `\"best_estimator\"`: the refitted best estimator (`grid.best_estimator_`)"
    ),
    "starter_code": r'''import numpy as np
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import GridSearchCV

def tune_decision_tree_grid(X: np.ndarray, y: np.ndarray, param_grid: dict, cv: int = 5, scoring: str = "f1_weighted", random_state: int = 42) -> dict:
    """
    Tune DecisionTreeClassifier hyperparameters using exhaustive grid search.

    Args:
        X: Feature matrix
        y: Target vector
        param_grid: Dictionary mapping hyperparameter names to candidate values
        cv: Number of cross-validation folds
        scoring: Scoring metric string
        random_state: Seed for tree reproducibility

    Returns:
        dict with grid_search, best_params, best_score, best_estimator
    """
    # TODO: Validate inputs, instantiate DecisionTreeClassifier and GridSearchCV, fit, return dict
    pass
''',
    "reference_solution": r'''import numpy as np
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import GridSearchCV

def tune_decision_tree_grid(X: np.ndarray, y: np.ndarray, param_grid: dict, cv: int = 5, scoring: str = "f1_weighted", random_state: int = 42) -> dict:
    if not isinstance(param_grid, dict) or len(param_grid) == 0:
        raise ValueError("param_grid cannot be empty")
    if len(X) != len(y):
        raise ValueError("X and y length mismatch")
    if cv < 2:
        raise ValueError("cv must be at least 2")

    tree = DecisionTreeClassifier(random_state=random_state)
    grid = GridSearchCV(estimator=tree, param_grid=param_grid, cv=cv, scoring=scoring, n_jobs=1)
    grid.fit(X, y)

    return {
        "grid_search": grid,
        "best_params": grid.best_params_,
        "best_score": float(grid.best_score_),
        "best_estimator": grid.best_estimator_,
    }
''',
    "test_suite": r'''import numpy as np
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import GridSearchCV

def run_tests(candidate_func):
    report = {"passed": True, "tests_run": 0, "errors": []}

    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Test 1: Optimize depth on synthetic data
    np.random.seed(42)
    X = np.random.randn(80, 2)
    y = ((X[:, 0] > 0) & (X[:, 1] > 0)).astype(int)
    grid_params = {"max_depth": [1, 2, 4]}

    res = candidate_func(X, y, grid_params, cv=3, scoring="accuracy", random_state=42)

    assert_test(isinstance(res, dict), "Result must be a dictionary")
    assert_test(isinstance(res.get("grid_search"), GridSearchCV), "grid_search must be GridSearchCV")
    assert_test(isinstance(res.get("best_estimator"), DecisionTreeClassifier), "best_estimator must be DecisionTreeClassifier")
    assert_test("max_depth" in res["best_params"], "best_params should contain 'max_depth'")
    assert_test(res["best_params"]["max_depth"] in [1, 2, 4], "Selected parameter must be from candidates")
    assert_test(0.0 <= res["best_score"] <= 1.0, "best_score out of valid bounds")

    # Test 2: Empty param_grid validation
    raised_empty = False
    try:
        candidate_func(X, y, {})
    except ValueError:
        raised_empty = True
    assert_test(raised_empty, "Must raise ValueError for empty param_grid")

    # Test 3: Invalid cv validation
    raised_cv = False
    try:
        candidate_func(X, y, grid_params, cv=1)
    except ValueError:
        raised_cv = True
    assert_test(raised_cv, "Must raise ValueError when cv < 2")

    return report
''',
    "hints": [
        "Instantiate DecisionTreeClassifier(random_state=random_state).",
        "Build GridSearchCV(estimator=tree, param_grid=param_grid, cv=cv, scoring=scoring, n_jobs=1).",
        "Fit grid on (X, y) and return best_params_, best_score_, best_estimator_."
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
