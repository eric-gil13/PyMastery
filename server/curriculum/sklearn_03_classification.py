"""
Part 3: Supervised Classification & Metrics
PyMastery Progressive Zero-to-Hero Scikit-Learn Curriculum
"""

import numpy as np
from typing import Dict, Any, List, Optional
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

DAY_METADATA = {
    "day_id": "sklearn_03",
    "day_number": 3,
    "title": "Part 3: Supervised Classification & Metrics",
    "tagline": "Train linear classifiers and decision trees, and diagnose performance with precision, recall, and confusion matrices.",
    "estimated_time": "1-2 hours",
    "concepts_covered": [
        "Binary and multiclass classification paradigms",
        "Logistic Regression and sigmoid decision thresholds",
        "Decision Trees, Gini impurity, and feature importances",
        "The Accuracy Paradox in imbalanced datasets",
        "Comprehensive evaluation: Precision, Recall, F1-Score, and Confusion Matrix"
    ]
}

CONCEPT_PRIMER = r"""# Part 3 Concept Primer: Supervised Classification & Evaluation Metrics

## 1. Classification vs Regression
In supervised classification, the target variable $y$ represents discrete categorical labels rather than continuous numbers:
* **Binary Classification:** Two classes, conventionally labeled $0$ (negative/normal) and $1$ (positive/event), such as fraud detection, cancer diagnosis, or customer churn.
* **Multiclass Classification:** Three or more mutually exclusive classes (e.g., classifying images into cat, dog, or horse).

---

## 2. Core Classification Algorithms

### Logistic Regression
Despite its name, Logistic Regression is a linear classification algorithm. It computes a linear combination of inputs and passes it through the logistic sigmoid function $\sigma(z) = \frac{1}{1 + e^{-z}}$ to estimate class probabilities:
$$P(y=1|x) = \frac{1}{1 + e^{-(\mathbf{w}^T \mathbf{x} + b)}}$$
* **Decision Boundary:** By default, if $P(y=1|x) \ge 0.5$, the model predicts class 1.
* **Interpretability:** Coefficients $w_i$ indicate the log-odds impact of each feature.

### Decision Trees (`DecisionTreeClassifier`)
Decision trees partition feature space through recursive orthogonal splits that maximize purity:
* **Gini Impurity:** $I_G(p) = 1 - \sum_{k=1}^K p_k^2$. Measures the likelihood that a randomly chosen element would be incorrectly labeled.
* **Feature Importance (`feature_importances_`):** Sum of impurity reductions brought by each feature across all tree nodes, normalized to sum to 1.0. Higher values indicate more influential features.

---

## 3. Beyond Accuracy: The Evaluation Matrix
In imbalanced datasets, **Accuracy** ($\frac{TP+TN}{Total}$) is dangerously misleading. In a dataset where 99% of transactions are legitimate, a dummy model that always predicts "legitimate" gets 99% accuracy while catching 0% of fraud!

### The Confusion Matrix
```
                    Predicted Negative (0)    Predicted Positive (1)
Actual Negative (0) [ True Negative (TN)   |   False Positive (FP)   ]
Actual Positive (1) [ False Negative (FN)  |   True Positive (TP)    ]
```

### Essential Classification Metrics
1. **Precision:** $\frac{TP}{TP + FP}$ — "Out of all instances predicted positive, how many were truly positive?" (Crucial when false alarms are costly, e.g., spam filters).
2. **Recall (Sensitivity):** $\frac{TP}{TP + FN}$ — "Out of all actual positive instances, how many did the model catch?" (Crucial when missing positives is fatal, e.g., cancer screening).
3. **F1-Score:** Harmonic mean of Precision and Recall:
   $$F_1 = 2 \times \frac{\text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}}$$
   Provides a single balanced metric that penalizes extreme imbalance between precision and recall.
"""

WALKTHROUGH = r"""# Part 3 Code Walkthrough: Training and Evaluating Classifiers

```python
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

# 1. Synthetic dataset
np.random.seed(42)
X_train = np.random.randn(200, 3)
# Target depends strongly on feature 0
y_train = (X_train[:, 0] + 0.5 * X_train[:, 1] > 0.2).astype(int)

X_test = np.random.randn(50, 3)
y_test = (X_test[:, 0] + 0.5 * X_test[:, 1] > 0.2).astype(int)

# 2. Train Logistic Regression
log_clf = LogisticRegression(random_state=42)
log_clf.fit(X_train, y_train)
y_pred_log = log_clf.predict(X_test)

print("Logistic Regression Metrics:")
print("Accuracy: ", accuracy_score(y_test, y_pred_log))
print("Precision:", precision_score(y_test, y_pred_log))
print("Recall:   ", recall_score(y_test, y_pred_log))
print("F1 Score: ", f1_score(y_test, y_pred_log))
print("Confusion Matrix:\n", confusion_matrix(y_test, y_pred_log))

# 3. Train Decision Tree and Inspect Importances
tree_clf = DecisionTreeClassifier(max_depth=3, random_state=42)
tree_clf.fit(X_train, y_train)

feature_names = ["usage_hours", "support_calls", "contract_length"]
for name, importance in zip(feature_names, tree_clf.feature_importances_):
    print(f"Feature: {name:16s} Importance: {importance:.4f}")
```
"""

# -----------------------------------------------------------------------------
# Challenge 1: Customer Churn Classifier
# -----------------------------------------------------------------------------

CHALLENGE_1 = {
    "id": "sk-p3-c1",
    "title": "Customer Churn Classifier",
    "difficulty": "Beginner",
    "category": "Classification",
    "description": (
        "Train a Logistic Regression classifier on customer usage data, generate test predictions, "
        "and calculate comprehensive diagnostic metrics: accuracy, precision, recall, F1-score, "
        "and the confusion matrix."
    ),
    "instructions": (
        "Write a function `train_churn_classifier(X_train: np.ndarray, y_train: np.ndarray, X_test: np.ndarray, y_test: np.ndarray, random_state: int = 42) -> dict` that:\n"
        "1. Validates inputs:\n"
        "   - If `len(X_train) != len(y_train)`, raise `ValueError(\"X_train and y_train length mismatch\")`.\n"
        "   - If `len(X_test) != len(y_test)`, raise `ValueError(\"X_test and y_test length mismatch\")`.\n"
        "   - If `len(X_train) == 0` or `len(X_test) == 0`, raise `ValueError(\"Arrays must contain at least 1 sample\")`.\n"
        "2. Fits a `LogisticRegression(max_iter=1000, random_state=random_state)` on `(X_train, y_train)`.\n"
        "3. Predicts test classes: `y_pred = model.predict(X_test)`.\n"
        "4. Computes:\n"
        "   - `accuracy`: float from `accuracy_score(y_test, y_pred)`\n"
        "   - `precision`: float from `precision_score(y_test, y_pred, zero_division=0)`\n"
        "   - `recall`: float from `recall_score(y_test, y_pred, zero_division=0)`\n"
        "   - `f1`: float from `f1_score(y_test, y_pred, zero_division=0)`\n"
        "   - `confusion_matrix`: ndarray from `confusion_matrix(y_test, y_pred)`\n"
        "5. Returns a dictionary:\n"
        "   `{\"model\": model, \"y_pred\": y_pred, \"accuracy\": accuracy, \"precision\": precision, \"recall\": recall, \"f1\": f1, \"confusion_matrix\": confusion_matrix}`"
    ),
    "starter_code": r'''import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

def train_churn_classifier(X_train: np.ndarray, y_train: np.ndarray, X_test: np.ndarray, y_test: np.ndarray, random_state: int = 42) -> dict:
    """
    Train Logistic Regression churn classifier and compute diagnostic metrics.

    Args:
        X_train: Training features of shape (n_samples, n_features)
        y_train: Binary training labels (0 or 1)
        X_test: Testing features
        y_test: Binary testing labels
        random_state: Seed for reproducibility

    Returns:
        dict with model, y_pred, accuracy, precision, recall, f1, confusion_matrix
    """
    # TODO: Validate inputs, fit model, predict, compute metrics, return dict
    pass
''',
    "reference_solution": r'''import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

def train_churn_classifier(X_train: np.ndarray, y_train: np.ndarray, X_test: np.ndarray, y_test: np.ndarray, random_state: int = 42) -> dict:
    if len(X_train) != len(y_train):
        raise ValueError("X_train and y_train length mismatch")
    if len(X_test) != len(y_test):
        raise ValueError("X_test and y_test length mismatch")
    if len(X_train) == 0 or len(X_test) == 0:
        raise ValueError("Arrays must contain at least 1 sample")

    model = LogisticRegression(max_iter=1000, random_state=random_state)
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    return {
        "model": model,
        "y_pred": y_pred,
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "precision": float(precision_score(y_test, y_pred, zero_division=0)),
        "recall": float(recall_score(y_test, y_pred, zero_division=0)),
        "f1": float(f1_score(y_test, y_pred, zero_division=0)),
        "confusion_matrix": confusion_matrix(y_test, y_pred),
    }
''',
    "test_suite": r'''import numpy as np
from sklearn.linear_model import LogisticRegression

def run_tests(candidate_func):
    report = {"passed": True, "tests_run": 0, "errors": []}

    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Test 1: Synthetic binary classification problem
    np.random.seed(42)
    X_tr = np.array([[-2.0], [-1.0], [1.0], [2.0]])
    y_tr = np.array([0, 0, 1, 1])
    X_te = np.array([[-1.5], [1.5]])
    y_te = np.array([0, 1])

    res = candidate_func(X_tr, y_tr, X_te, y_te, random_state=42)

    assert_test(isinstance(res, dict), "Result must be a dictionary")
    assert_test(isinstance(res.get("model"), LogisticRegression), "model must be LogisticRegression instance")
    assert_test(np.array_equal(res["y_pred"], [0, 1]), "y_pred predictions mismatch")
    assert_test(abs(res["accuracy"] - 1.0) < 1e-6, "Accuracy should be 1.0")
    assert_test(abs(res["f1"] - 1.0) < 1e-6, "F1 score should be 1.0")
    assert_test(res["confusion_matrix"].shape == (2, 2), "Confusion matrix shape should be (2, 2)")
    assert_test(res["confusion_matrix"][0, 0] == 1 and res["confusion_matrix"][1, 1] == 1, "Confusion matrix elements mismatch")

    # Test 2: Input length mismatch validation
    raised_mismatch = False
    try:
        candidate_func(np.ones((5, 2)), np.ones(4), X_te, y_te)
    except ValueError:
        raised_mismatch = True
    assert_test(raised_mismatch, "Must raise ValueError when X_train and y_train length differs")

    # Test 3: Empty inputs validation
    raised_empty = False
    try:
        candidate_func(np.empty((0, 2)), np.empty(0), X_te, y_te)
    except ValueError:
        raised_empty = True
    assert_test(raised_empty, "Must raise ValueError for empty inputs")

    return report
''',
    "hints": [
        "Instantiate LogisticRegression(max_iter=1000, random_state=random_state) and call .fit(X_train, y_train).",
        "Use y_pred = model.predict(X_test).",
        "Compute metrics using accuracy_score, precision_score, recall_score, f1_score, and confusion_matrix."
    ]
}

# -----------------------------------------------------------------------------
# Challenge 2: Decision Tree Feature Importance Inspector
# -----------------------------------------------------------------------------

CHALLENGE_2 = {
    "id": "sk-p3-c2",
    "title": "Decision Tree Feature Importance Inspector",
    "difficulty": "Beginner",
    "category": "Classification",
    "description": (
        "Train a DecisionTreeClassifier, extract Gini impurity-based feature importances, and rank "
        "features in descending order to identify the most predictive driver."
    ),
    "instructions": (
        "Write a function `inspect_tree_feature_importances(X_train: np.ndarray, y_train: np.ndarray, feature_names: list[str], max_depth: Optional[int] = None, random_state: int = 42) -> dict` that:\n"
        "1. Validates inputs:\n"
        "   - If `len(X_train) != len(y_train)`, raise `ValueError(\"X_train and y_train length mismatch\")`.\n"
        "   - If `X_train.shape[1] != len(feature_names)`, raise `ValueError(\"feature_names count must match number of columns in X_train\")`.\n"
        "   - If `len(feature_names) == 0`, raise `ValueError(\"feature_names cannot be empty\")`.\n"
        "2. Fits a `DecisionTreeClassifier(max_depth=max_depth, random_state=random_state)` on `(X_train, y_train)`.\n"
        "3. Extracts `tree.feature_importances_`.\n"
        "4. Ranks features from highest importance to lowest importance.\n"
        "5. Returns a dictionary:\n"
        "   - `\"model\"`: fitted DecisionTreeClassifier\n"
        "   - `\"feature_importances\"`: dict mapping each feature name to its float importance\n"
        "   - `\"ranked_features\"`: list of feature names sorted descending by importance\n"
        "   - `\"top_feature\"`: string name of the feature with the highest importance"
    ),
    "starter_code": r'''import numpy as np
from typing import Optional
from sklearn.tree import DecisionTreeClassifier

def inspect_tree_feature_importances(X_train: np.ndarray, y_train: np.ndarray, feature_names: list[str], max_depth: Optional[int] = None, random_state: int = 42) -> dict:
    """
    Train a DecisionTreeClassifier and rank features by Gini importance.

    Args:
        X_train: Training feature matrix
        y_train: Training labels
        feature_names: List of column names corresponding to X_train columns
        max_depth: Maximum tree depth
        random_state: Seed for reproducibility

    Returns:
        dict with model, feature_importances, ranked_features, top_feature
    """
    # TODO: Validate inputs, fit decision tree, extract and rank importances, return dict
    pass
''',
    "reference_solution": r'''import numpy as np
from typing import Optional
from sklearn.tree import DecisionTreeClassifier

def inspect_tree_feature_importances(X_train: np.ndarray, y_train: np.ndarray, feature_names: list[str], max_depth: Optional[int] = None, random_state: int = 42) -> dict:
    if len(X_train) != len(y_train):
        raise ValueError("X_train and y_train length mismatch")
    if len(feature_names) == 0:
        raise ValueError("feature_names cannot be empty")
    if X_train.shape[1] != len(feature_names):
        raise ValueError("feature_names count must match number of columns in X_train")

    tree = DecisionTreeClassifier(max_depth=max_depth, random_state=random_state)
    tree.fit(X_train, y_train)

    importances = tree.feature_importances_
    sorted_indices = np.argsort(importances)[::-1]
    ranked_features = [feature_names[i] for i in sorted_indices]
    importance_dict = {feature_names[i]: float(importances[i]) for i in range(len(feature_names))}

    return {
        "model": tree,
        "feature_importances": importance_dict,
        "ranked_features": ranked_features,
        "top_feature": ranked_features[0],
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

    # Test 1: Feature 1 is the primary deterministic split
    X_tr = np.array([
        [0.1, 10.0, 0.0],
        [0.2, 20.0, 1.0],
        [0.9, 80.0, 0.0],
        [0.8, 90.0, 1.0]
    ])
    # Target is strictly determined by feature index 1 (threshold 50.0)
    y_tr = np.array([0, 0, 1, 1])
    fnames = ["noise_a", "signal_b", "noise_c"]

    res = candidate_func(X_tr, y_tr, fnames, max_depth=2, random_state=42)

    assert_test(isinstance(res, dict), "Result must be a dictionary")
    assert_test(isinstance(res.get("model"), DecisionTreeClassifier), "model must be DecisionTreeClassifier")
    assert_test("feature_importances" in res, "Missing feature_importances key")
    assert_test("ranked_features" in res, "Missing ranked_features key")
    assert_test(res.get("top_feature") == "signal_b", f"Expected top_feature 'signal_b', got {res.get('top_feature')}")
    assert_test(res["ranked_features"][0] == "signal_b", "First element of ranked_features must be 'signal_b'")

    # Check sum of importances is ~1.0
    total_imp = sum(res["feature_importances"].values())
    assert_test(abs(total_imp - 1.0) < 1e-5, f"Sum of importances must be 1.0, got {total_imp}")

    # Test 2: Dimension mismatch validation
    raised_dim = False
    try:
        candidate_func(X_tr, y_tr, ["f1", "f2"], max_depth=2)
    except ValueError:
        raised_dim = True
    assert_test(raised_dim, "Must raise ValueError when feature_names length != num columns")

    # Test 3: Length mismatch validation
    raised_len = False
    try:
        candidate_func(X_tr, np.array([0, 1]), fnames)
    except ValueError:
        raised_len = True
    assert_test(raised_len, "Must raise ValueError when len(X) != len(y)")

    return report
''',
    "hints": [
        "Instantiate DecisionTreeClassifier(max_depth=max_depth, random_state=random_state) and fit.",
        "Retrieve tree.feature_importances_ and use np.argsort(importances)[::-1] to rank indices.",
        "Map sorted indices back to feature_names to get ranked_features."
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
