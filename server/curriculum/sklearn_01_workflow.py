"""
Part 1: ML Workflow & Data Splitting
PyMastery Progressive Zero-to-Hero Scikit-Learn Curriculum
"""

import numpy as np
from typing import Dict, Any, List
from sklearn.model_selection import train_test_split

DAY_METADATA = {
    "day_id": "sklearn_01",
    "day_number": 1,
    "title": "Part 1: ML Workflow & Data Splitting",
    "tagline": "Master the train/test split boundary, random states, and stratification to prevent silent distribution shift.",
    "estimated_time": "1-2 hours",
    "concepts_covered": [
        "Feature matrix X vs Target vector y conventions",
        "Generalization error and train-test partition isolation",
        "Deterministic reproducibility with random_state",
        "Class imbalance preservation using stratify",
        "Temporal sequential splitting without lookahead data leakage"
    ]
}

CONCEPT_PRIMER = r"""# Part 1 Concept Primer: ML Workflow & Data Splitting

## 1. The Core Scikit-Learn Paradigm: Features (X) vs Target (y)
In machine learning, supervised algorithms learn mathematical mapping functions $f(X) \approx y$:
* **$X$ (Feature Matrix):** A 2-dimensional array or DataFrame of shape `(n_samples, n_features)`. Rows represent independent observations (e.g., customers, sensor snapshots, patients); columns represent measurable attributes (e.g., age, income, voltage).
* **$y$ (Target Vector):** A 1-dimensional array or Series of length `n_samples`. In classification, $y$ contains discrete class labels (e.g., `0` for retained, `1` for churned); in regression, $y$ contains continuous real values (e.g., house prices, temperatures).

```
         Features Matrix X (n_samples, n_features)       Target y (n_samples,)
         +---------------------------------------+       +-------------------+
sample 0 |   2.5   |   100.2  |   0.14  |  ...   |  -->  |         1         |
sample 1 |   1.1   |    85.0  |   0.02  |  ...   |  -->  |         0         |
sample 2 |   4.8   |   140.9  |   0.88  |  ...   |  -->  |         1         |
         +---------------------------------------+       +-------------------+
```

---

## 2. Generalization Error & The Cardinal Train/Test Rule
A model evaluated on the exact data it learned from can achieve misleadingly high scores simply by memorizing noise. To measure true **generalization performance** on unseen real-world data, we partition available data into separate sets:
1. **Training Set (`X_train`, `y_train`):** Used exclusively by the estimator during `.fit()`.
2. **Testing Set (`X_test`, `y_test`):** Kept strictly hidden until evaluation time using `.predict()` or `.score()`.

### The Role of `random_state`
Randomized splits without a fixed random seed produce different data partitions on every run, making hyperparameter comparisons and debugging impossible. Passing an integer (e.g., `random_state=42`) seeds the pseudo-random generator, guaranteeing identical partitions across runs.

---

## 3. Class Imbalance & Stratified Splitting
When dealing with rare events (such as fraud detection at 1% prevalence or churn at 10%), naive random shuffling can catastrophically alter the class distribution. A random split might place all positive cases into the training set and zero into the test set!

**Stratified Splitting** (`stratify=y`) guarantees that both training and testing partitions retain the exact same percentage of each class as the original dataset.

```
Original y (100 samples):  [ 80 Class 0 (80%) | 20 Class 1 (20%) ]
                                     |
                       train_test_split(stratify=y)
                                     v
Train (80 samples):        [ 64 Class 0 (80%) | 16 Class 1 (20%) ]
Test (20 samples):         [ 16 Class 0 (80%) |  4 Class 1 (20%) ]
```

---

## 4. Sequential & Time-Series Data: Avoiding Lookahead Leakage
When observations are ordered chronologically (such as daily stock prices, energy consumption logs, or user session events), standard random splitting is disastrous:
* Shuffling allows the model to train on future timestamps to predict past timestamps.
* This is known as **lookahead data leakage** and creates unrealistically optimistic evaluation scores that crash in production.
* **Rule:** For time-dependent data, always split chronologically: use the earliest records for training and the latest contiguous records for validation/test without shuffling.
"""

WALKTHROUGH = r"""# Part 1 Code Walkthrough: Data Splitting in Practice

```python
import numpy as np
from sklearn.model_selection import train_test_split

# 1. Generate synthetic binary classification dataset
np.random.seed(42)
X = np.random.randn(100, 3)
# Imbalanced classes: 80% negative (0), 20% positive (1)
y = np.array([0] * 80 + [1] * 20)

# 2. Standard vs Stratified Split
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.25,
    random_state=42,
    stratify=y
)

print(f"X_train shape: {X_train.shape}, X_test shape: {X_test.shape}")
print(f"Train class 1 ratio: {np.mean(y_train == 1):.2%}")
print(f"Test class 1 ratio:  {np.mean(y_test == 1):.2%}")

# 3. Time-Aware Chronological Splitting
time_steps = np.arange(100)
train_ratio = 0.8
split_point = int(len(time_steps) * train_ratio)

train_series = time_steps[:split_point]  # Steps 0 to 79
val_series = time_steps[split_point:]    # Steps 80 to 99
print(f"Train steps range: {train_series.min()} to {train_series.max()}")
print(f"Val steps range:   {val_series.min()} to {val_series.max()}")
```
"""

# -----------------------------------------------------------------------------
# Challenge 1: Stratified Dataset Splitter
# -----------------------------------------------------------------------------

CHALLENGE_1 = {
    "id": "sk-p1-c1",
    "title": "Stratified Dataset Splitter",
    "difficulty": "Beginner",
    "category": "Data Partitioning",
    "description": (
        "Partition an imbalanced classification dataset into training and testing subsets using "
        "Scikit-Learn's train_test_split while guaranteeing that class proportions are preserved "
        "in both subsets via stratification."
    ),
    "instructions": (
        "Write a function `stratified_train_test_split(X: np.ndarray, y: np.ndarray, test_size: float = 0.2, random_state: int = 42) -> dict` that:\n"
        "1. Validates inputs:\n"
        "   - If `len(X) != len(y)`, raise `ValueError(\"X and y must have the same number of samples\")`.\n"
        "   - If `test_size <= 0.0` or `test_size >= 1.0`, raise `ValueError(\"test_size must be between 0.0 and 1.0\")`.\n"
        "   - If `len(np.unique(y)) < 2`, raise `ValueError(\"y must contain at least 2 distinct classes\")`.\n"
        "   - If any class in `y` has fewer than 2 samples, raise `ValueError(\"Each class must have at least 2 samples for stratified splitting\")`.\n"
        "2. Performs a stratified split using `train_test_split(X, y, test_size=test_size, random_state=random_state, stratify=y)`.\n"
        "3. Computes class distribution dictionaries for `y_train` and `y_test` mapping each unique class label to its float proportion (count / total_samples in that subset).\n"
        "4. Returns a dictionary with keys:\n"
        "   - `\"X_train\"`: ndarray\n"
        "   - `\"X_test\"`: ndarray\n"
        "   - `\"y_train\"`: ndarray\n"
        "   - `\"y_test\"`: ndarray\n"
        "   - `\"train_proportions\"`: dict mapping class label to float proportion\n"
        "   - `\"test_proportions\"`: dict mapping class label to float proportion"
    ),
    "starter_code": r'''import numpy as np
from sklearn.model_selection import train_test_split

def stratified_train_test_split(X: np.ndarray, y: np.ndarray, test_size: float = 0.2, random_state: int = 42) -> dict:
    """
    Partition dataset into train and test sets preserving class distribution.

    Args:
        X: Feature matrix of shape (n_samples, n_features)
        y: Target vector of shape (n_samples,)
        test_size: Proportion of dataset to include in test split (0.0 to 1.0)
        random_state: Seed for reproducible random shuffling

    Returns:
        dict with X_train, X_test, y_train, y_test, train_proportions, test_proportions
    """
    # TODO: Validate inputs, perform stratified split, calculate proportions, return dict
    pass
''',
    "reference_solution": r'''import numpy as np
from sklearn.model_selection import train_test_split

def stratified_train_test_split(X: np.ndarray, y: np.ndarray, test_size: float = 0.2, random_state: int = 42) -> dict:
    if len(X) != len(y):
        raise ValueError("X and y must have the same number of samples")
    if not (0.0 < test_size < 1.0):
        raise ValueError("test_size must be between 0.0 and 1.0")

    classes, counts = np.unique(y, return_counts=True)
    if len(classes) < 2:
        raise ValueError("y must contain at least 2 distinct classes")
    if np.min(counts) < 2:
        raise ValueError("Each class must have at least 2 samples for stratified splitting")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=y
    )

    def calc_proportions(arr: np.ndarray) -> dict:
        total = len(arr)
        return {cls: float(np.sum(arr == cls) / total) for cls in classes}

    return {
        "X_train": X_train,
        "X_test": X_test,
        "y_train": y_train,
        "y_test": y_test,
        "train_proportions": calc_proportions(y_train),
        "test_proportions": calc_proportions(y_test)
    }
''',
    "test_suite": r'''import numpy as np
from sklearn.model_selection import train_test_split

def run_tests(candidate_func):
    report = {"passed": True, "tests_run": 0, "errors": []}

    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Test 1: Standard binary imbalanced split
    np.random.seed(0)
    X = np.random.randn(100, 4)
    y = np.array([0] * 80 + [1] * 20)
    res = candidate_func(X, y, test_size=0.2, random_state=42)

    assert_test(isinstance(res, dict), "Output must be a dictionary")
    for k in ["X_train", "X_test", "y_train", "y_test", "train_proportions", "test_proportions"]:
        assert_test(k in res, f"Missing key '{k}' in result dictionary")

    assert_test(res["X_train"].shape == (80, 4), f"X_train shape expected (80, 4), got {res['X_train'].shape}")
    assert_test(res["X_test"].shape == (20, 4), f"X_test shape expected (20, 4), got {res['X_test'].shape}")
    assert_test(res["y_train"].shape == (80,), f"y_train shape expected (80,), got {res['y_train'].shape}")
    assert_test(res["y_test"].shape == (20,), f"y_test shape expected (20,), got {res['y_test'].shape}")

    # Check stratification preservation: 80% class 0, 20% class 1
    assert_test(abs(res["train_proportions"][0] - 0.8) < 1e-4, "Train class 0 proportion must be 0.8")
    assert_test(abs(res["train_proportions"][1] - 0.2) < 1e-4, "Train class 1 proportion must be 0.2")
    assert_test(abs(res["test_proportions"][0] - 0.8) < 1e-4, "Test class 0 proportion must be 0.8")
    assert_test(abs(res["test_proportions"][1] - 0.2) < 1e-4, "Test class 1 proportion must be 0.2")

    # Test 2: Multiclass dataset (3 classes)
    y_multi = np.array([0] * 50 + [1] * 30 + [2] * 20)
    X_multi = np.random.randn(100, 2)
    res_m = candidate_func(X_multi, y_multi, test_size=0.3, random_state=42)
    assert_test(len(res_m["train_proportions"]) == 3, "Multiclass train proportions must have 3 entries")
    assert_test(abs(res_m["train_proportions"][0] - 0.5) < 0.05, "Class 0 ratio preserved")
    assert_test(abs(res_m["train_proportions"][1] - 0.3) < 0.05, "Class 1 ratio preserved")
    assert_test(abs(res_m["train_proportions"][2] - 0.2) < 0.05, "Class 2 ratio preserved")

    # Test 3: Input length mismatch validation
    raised_len = False
    try:
        candidate_func(np.ones((10, 2)), np.ones(8), test_size=0.2)
    except ValueError:
        raised_len = True
    assert_test(raised_len, "Must raise ValueError when len(X) != len(y)")

    # Test 4: Invalid test_size validation
    raised_size = False
    try:
        candidate_func(X, y, test_size=1.5)
    except ValueError:
        raised_size = True
    assert_test(raised_size, "Must raise ValueError when test_size >= 1.0")

    # Test 5: Single class validation
    raised_single = False
    try:
        candidate_func(np.ones((20, 2)), np.zeros(20), test_size=0.2)
    except ValueError:
        raised_single = True
    assert_test(raised_single, "Must raise ValueError when y contains only 1 class")

    return report
''',
    "hints": [
        "Pass stratify=y into sklearn.model_selection.train_test_split.",
        "Calculate class proportions by counting occurrences of each class and dividing by len(y_split).",
        "Validate input lengths and test_size bounds before calling train_test_split."
    ]
}

# -----------------------------------------------------------------------------
# Challenge 2: Time-Aware Train/Validation Splitter
# -----------------------------------------------------------------------------

CHALLENGE_2 = {
    "id": "sk-p1-c2",
    "title": "Time-Aware Sequential Splitter",
    "difficulty": "Beginner",
    "category": "Data Partitioning",
    "description": (
        "Partition chronologically ordered time-series records into training and validation sets "
        "without shuffling to guarantee zero lookahead data leakage."
    ),
    "instructions": (
        "Write a function `temporal_train_test_split(X: np.ndarray, y: np.ndarray, train_ratio: float = 0.8) -> dict` that:\n"
        "1. Validates inputs:\n"
        "   - If `len(X) != len(y)`, raise `ValueError(\"X and y must have the same length\")`.\n"
        "   - If `train_ratio <= 0.0` or `train_ratio >= 1.0`, raise `ValueError(\"train_ratio must be between 0.0 and 1.0\")`.\n"
        "   - If `len(X) < 2`, raise `ValueError(\"At least 2 samples required\")`.\n"
        "2. Computes the chronological split index: `split_index = int(len(X) * train_ratio)`.\n"
        "3. Validates that `split_index > 0` and `split_index < len(X)`; if not, raise `ValueError(\"Split ratio results in an empty split\")`.\n"
        "4. Slices arrays strictly by time without shuffling:\n"
        "   - `X_train = X[:split_index]`, `X_val = X[split_index:]`\n"
        "   - `y_train = y[:split_index]`, `y_val = y[split_index:]`\n"
        "5. Returns a dictionary:\n"
        "   `{\"X_train\": X_train, \"X_val\": X_val, \"y_train\": y_train, \"y_val\": y_val, \"split_index\": split_index}`"
    ),
    "starter_code": r'''import numpy as np

def temporal_train_test_split(X: np.ndarray, y: np.ndarray, train_ratio: float = 0.8) -> dict:
    """
    Split sequential data into train and validation sets preserving chronological order.

    Args:
        X: Feature matrix of shape (n_samples, n_features)
        y: Target vector of shape (n_samples,)
        train_ratio: Fraction of early samples to allocate to training (0.0 to 1.0)

    Returns:
        dict with X_train, X_val, y_train, y_val, split_index
    """
    # TODO: Validate inputs, compute split index, slice arrays sequentially, return dict
    pass
''',
    "reference_solution": r'''import numpy as np

def temporal_train_test_split(X: np.ndarray, y: np.ndarray, train_ratio: float = 0.8) -> dict:
    if len(X) != len(y):
        raise ValueError("X and y must have the same length")
    if not (0.0 < train_ratio < 1.0):
        raise ValueError("train_ratio must be between 0.0 and 1.0")
    if len(X) < 2:
        raise ValueError("At least 2 samples required")

    split_index = int(len(X) * train_ratio)
    if split_index == 0 or split_index >= len(X):
        raise ValueError("Split ratio results in an empty split")

    return {
        "X_train": X[:split_index],
        "X_val": X[split_index:],
        "y_train": y[:split_index],
        "y_val": y[split_index:],
        "split_index": split_index,
    }
''',
    "test_suite": r'''import numpy as np

def run_tests(candidate_func):
    report = {"passed": True, "tests_run": 0, "errors": []}

    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Test 1: Standard sequential temporal split
    X = np.arange(200).reshape(100, 2)
    y = np.arange(100)
    res = candidate_func(X, y, train_ratio=0.75)

    assert_test(isinstance(res, dict), "Result must be a dictionary")
    assert_test(res["split_index"] == 75, f"Expected split_index 75, got {res.get('split_index')}")
    assert_test(res["X_train"].shape == (75, 2), "X_train shape mismatch")
    assert_test(res["X_val"].shape == (25, 2), "X_val shape mismatch")
    assert_test(res["y_train"].shape == (75,), "y_train shape mismatch")
    assert_test(res["y_val"].shape == (25,), "y_val shape mismatch")

    # Verify no lookahead: max train index strictly less than min val index
    assert_test(np.max(res["y_train"]) < np.min(res["y_val"]), "Lookahead leakage detected! Train and val overlap.")
    assert_test(np.max(res["y_train"]) == 74, "y_train should end at index 74")
    assert_test(np.min(res["y_val"]) == 75, "y_val should start at index 75")

    # Test 2: Input length mismatch validation
    raised_len = False
    try:
        candidate_func(np.ones((10, 2)), np.ones(5), train_ratio=0.8)
    except ValueError:
        raised_len = True
    assert_test(raised_len, "Must raise ValueError when len(X) != len(y)")

    # Test 3: Invalid train_ratio bounds
    raised_ratio = False
    try:
        candidate_func(X, y, train_ratio=0.0)
    except ValueError:
        raised_ratio = True
    assert_test(raised_ratio, "Must raise ValueError when train_ratio <= 0")

    # Test 4: Too few samples validation
    raised_samples = False
    try:
        candidate_func(np.ones((1, 2)), np.ones(1), train_ratio=0.5)
    except ValueError:
        raised_samples = True
    assert_test(raised_samples, "Must raise ValueError when len(X) < 2")

    return report
''',
    "hints": [
        "Compute split_index = int(len(X) * train_ratio).",
        "Slice arrays directly using [:split_index] and [split_index:].",
        "Do NOT shuffle the arrays—temporal ordering must remain chronological."
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
