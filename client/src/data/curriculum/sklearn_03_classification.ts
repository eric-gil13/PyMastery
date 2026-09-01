import type { DayTrack, Challenge, ConceptPrimerData, TestCase } from '../../types';

export type { DayTrack, Challenge, ConceptPrimerData };

export const SKLEARN_PART03_TRACK: DayTrack = {
  partNumber: 3,
  partId: 3,
  dayNumber: 3,
  id: 3,
  title: 'Part 3: Supervised Classification & Metrics',
  subtitle: 'Train linear classifiers and decision trees, evaluate with confusion matrices, precision, recall, and F1',
  description: 'Dive into supervised classification algorithms in Scikit-Learn. Train LogisticRegression and DecisionTreeClassifier models, inspect tree feature importances, and navigate beyond naive accuracy using precision, recall, F1-score, and confusion matrices.',
  iconName: 'BarChart3',
  badge: 'Part 3 • Classification',
  libraryMechanics: {
    libraryName: 'Scikit-Learn Supervised Classification',
    tagline: 'Predict discrete category labels and diagnose classification errors with precision.',
    overview: `### 🎯 Supervised Classification
In classification, models learn to separate discrete qualitative categories.
Whether flagging transaction fraud ($y \\in \\{0, 1\\}$) or identifying disease stages, classification requires distinct models and evaluation metrics compared to numeric regression.

### ⚠️ The Accuracy Trap
If 98% of credit card transactions are legitimate, a useless model that blindly predicts "legitimate" on every sample achieves 98% accuracy while catching zero fraud.
Understanding the trade-offs between **Precision**, **Recall**, and **F1-Score** is essential for any applied ML engineer.`,
    whyItExists: `Scikit-Learn standardizes diverse classification algorithms under a unified interface:
- **Consistent Methods:** \`fit(X, y)\`, \`predict(X)\`, and \`predict_proba(X)\`.
- **Diagnostic Metrics:** \`precision_score\`, \`recall_score\`, \`f1_score\`, and \`confusion_matrix\` seamlessly handle zero divisions and class weighting.
- **Model Explainability:** Extract linear weights via \`coef_\` or tree split influence via \`feature_importances_\`.`,
    coreAnatomy: {
      objectName: 'LogisticRegression & DecisionTreeClassifier',
      description: 'The foundational linear and non-linear classification estimators in Scikit-Learn.',
      fields: [
        {
          name: 'classes_',
          type: 'ndarray of shape (n_classes,)',
          role: 'Distinct class labels discovered during .fit().'
        },
        {
          name: 'coef_ & intercept_',
          type: 'ndarray (LogisticRegression)',
          role: 'Hyperplane normal weights and bias term determining the decision boundary.'
        },
        {
          name: 'feature_importances_',
          type: 'ndarray of shape (n_features,) (DecisionTreeClassifier)',
          role: 'Normalized Gini impurity reduction contributed by each feature.'
        }
      ],
      memoryDiagramAscii: `+-------------------------------------------------------------+
|                     Confusion Matrix (2x2)                  |
|                      Predicted 0          Predicted 1       |
|  Actual 0         [ True Negative (TN)  | False Positive (FP)] |
|  Actual 1         [ False Negative (FN) | True Positive (TP) ] |
+-------------------------------------------------------------+
 Precision = TP / (TP + FP)       Recall = TP / (TP + FN)
 F1-Score = 2 * (Precision * Recall) / (Precision + Recall)`
    },
    chapters: [
      {
        id: 'ch1-logistic-regression',
        title: 'Logistic Regression & Sigmoid Probabilities',
        icon: 'TrendingUp',
        summary: 'Mapping linear combinations into calibrated probabilities.',
        markdownContent: `### Linear Probabilistic Modeling

Logistic Regression calculates a linear score $z = \\mathbf{w}^T \\mathbf{x} + b$ and maps it into $[0, 1]$ via the sigmoid function:
$$P(y=1|\\mathbf{x}) = \\frac{1}{1 + e^{-z}}$$

\`\`\`python
from sklearn.linear_model import LogisticRegression

clf = LogisticRegression(max_iter=1000, random_state=42)
clf.fit(X_train, y_train)

# Continuous probabilities
probs = clf.predict_proba(X_test)
# Hard thresholding at 0.5
preds = clf.predict(X_test)
\`\`\``
      },
      {
        id: 'ch2-decision-trees',
        title: 'Decision Trees & Feature Importances',
        icon: 'GitBranch',
        summary: 'Recursive splitting on Gini impurity and ranking feature utility.',
        markdownContent: `### Tree Mechanics

Decision trees recursively split nodes on the feature that maximizes Gini impurity reduction.
The total reduction contributed by each feature is normalized into \`feature_importances_\`:
\`\`\`python
from sklearn.tree import DecisionTreeClassifier

tree = DecisionTreeClassifier(max_depth=3, random_state=42)
tree.fit(X_train, y_train)

for name, imp in zip(feature_names, tree.feature_importances_):
    print(f"{name}: {imp:.4f}")
\`\`\``
      },
      {
        id: 'ch3-metrics-tradeoffs',
        title: 'Precision, Recall, and Confusion Matrices',
        icon: 'BarChart2',
        summary: 'Balancing false alarms vs missed detections.',
        markdownContent: `### Choosing the Right Metric

- **Precision:** $\\frac{TP}{TP + FP}$. Use when False Positives are catastrophic (e.g. spam filter deleting valid client contracts).
- **Recall:** $\\frac{TP}{TP + FN}$. Use when False Negatives are fatal (e.g. cancer detection, security breaches).
- **F1-Score:** Harmonic mean that balances precision and recall.`
      }
    ],
    commonTraps: [
      {
        title: 'Evaluating Imbalanced Data on Pure Accuracy',
        badSnippet: `acc = accuracy_score(y_test, y_pred)`,
        badExplanation: 'Accuracy conceals the fact that minority classes might never be predicted.',
        goodSnippet: `f1 = f1_score(y_test, y_pred, zero_division=0)\ncm = confusion_matrix(y_test, y_pred)`,
        goodExplanation: 'F1-score and confusion matrix reveal false negatives and false positives transparently.',
        perfImpact: 'Prevents silent model failure in critical business domains.'
      }
    ],
    apiCheatSheet: [
      {
        name: 'f1_score',
        category: 'Metrics',
        signature: 'f1_score(y_true, y_pred, *, average="binary", zero_division="warn")',
        summary: 'Compute the F1 score (harmonic mean of precision and recall).',
        parameters: [
          { name: 'y_true', type: '1D array-like', desc: 'Ground truth target values.' },
          { name: 'y_pred', type: '1D array-like', desc: 'Estimated targets returned by a classifier.' },
          { name: 'zero_division', type: '0 or 1', desc: 'Value to return when no positive predictions occur.' }
        ],
        returns: 'float F1 score.',
        exampleSnippet: `score = f1_score(y_true, y_pred, zero_division=0)`
      },
      {
        name: 'confusion_matrix',
        category: 'Metrics',
        signature: 'confusion_matrix(y_true, y_pred, *, labels=None)',
        summary: 'Compute confusion matrix to evaluate classification accuracy.',
        parameters: [
          { name: 'y_true', type: '1D array-like', desc: 'Ground truth targets.' },
          { name: 'y_pred', type: '1D array-like', desc: 'Predicted targets.' }
        ],
        returns: 'ndarray of shape (n_classes, n_classes).',
        exampleSnippet: `cm = confusion_matrix(y_test, y_pred)`
      }
    ],
    interactiveWidgetType: 'sklearn-pipeline'
  },
  challenges: [
    {
      id: 'sk-p3-c1',
      dayId: 3,
      partId: 3,
      title: 'Customer Churn Classifier',
      slug: 'customer-churn-classifier',
      difficulty: 'Beginner',
      category: 'Classification',
      summary: 'Train a Logistic Regression model on customer behavioral metrics and generate full diagnostic evaluation metrics.',
      mentalModel5s: 'Fit a linear boundary to separate churners from retainers, then dissect error types with a confusion matrix.',
      visualAnalogy: 'A security guard checking bags at an airport: precision is how many alarms were real threats; recall is what fraction of all threats were caught.',
      pitfalls: [
        'Not setting zero_division=0 when computing precision/recall/F1, which triggers divide-by-zero warnings on degenerate predictions.',
        'Array length mismatches between X and y.'
      ],
      progressiveHints: [
        'Tier 1 (Validation): Validate lengths of X_train == y_train and X_test == y_test.',
        'Tier 2 (Model): Instantiate LogisticRegression(max_iter=1000, random_state=random_state) and fit on train.',
        'Tier 3 (Predict): Compute y_pred = model.predict(X_test).',
        'Tier 4 (Metrics): Evaluate accuracy_score, precision_score, recall_score, f1_score, and confusion_matrix.'
      ],
      deepInternals: {
        title: 'L-BFGS Optimization in Logistic Regression',
        content: 'Scikit-Learn solves LogisticRegression using the quasi-Newton L-BFGS optimizer by default, approximating the Hessian matrix without high memory overhead.',
        keyRule: 'max_iter=1000 ensures the optimizer converges on scaled feature distributions.'
      },
      instructions: `Write a function \`train_churn_classifier(X_train: np.ndarray, y_train: np.ndarray, X_test: np.ndarray, y_test: np.ndarray, random_state: int = 42) -> dict\` that:
1. Validates inputs:
   - If \`len(X_train) != len(y_train)\`, raise \`ValueError("X_train and y_train length mismatch")\`.
   - If \`len(X_test) != len(y_test)\`, raise \`ValueError("X_test and y_test length mismatch")\`.
   - If \`len(X_train) == 0\` or \`len(X_test) == 0\`, raise \`ValueError("Arrays must contain at least 1 sample")\`.
2. Fits a \`LogisticRegression(max_iter=1000, random_state=random_state)\` on \`(X_train, y_train)\`.
3. Predicts test classes: \`y_pred = model.predict(X_test)\`.
4. Computes:
   - \`accuracy\`: float from \`accuracy_score(y_test, y_pred)\`
   - \`precision\`: float from \`precision_score(y_test, y_pred, zero_division=0)\`
   - \`recall\`: float from \`recall_score(y_test, y_pred, zero_division=0)\`
   - \`f1\`: float from \`f1_score(y_test, y_pred, zero_division=0)\`
   - \`confusion_matrix\`: ndarray from \`confusion_matrix(y_test, y_pred)\`
5. Returns a dictionary:
   \`{"model": model, "y_pred": y_pred, "accuracy": accuracy, "precision": precision, "recall": recall, "f1": f1, "confusion_matrix": confusion_matrix}\`.`,
      hints: [
        'Import LogisticRegression from sklearn.linear_model.',
        'Use zero_division=0 inside precision_score, recall_score, and f1_score.',
        'Return confusion_matrix(y_test, y_pred) as an ndarray.'
      ],
      starterCode: `import numpy as np
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
`,
      solutionCode: `import numpy as np
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
`,
      testCases: [
        {
          id: 't1',
          name: 'Separable Binary Classification',
          inputDescription: 'X_tr: [[-2], [-1], [1], [2]], y_tr: [0, 0, 1, 1], X_te: [[-1.5], [1.5]], y_te: [0, 1]',
          expectedOutput: 'y_pred=[0, 1], accuracy=1.0, f1=1.0, confusion_matrix=[[1, 0], [0, 1]]'
        },
        {
          id: 't2',
          name: 'Input Length Mismatch',
          inputDescription: 'len(X_tr) != len(y_tr)',
          expectedOutput: 'Raises ValueError'
        }
      ],
      benchmarkTargetMs: 2.0,
      memoryTargetMb: 1.0,
      conceptPrimer: {
        title: 'Binary Classification & Diagnostic Metrics',
        subtitle: 'Beyond accuracy: precision, recall, and confusion matrix',
        overview: 'Supervised classification trains algorithms to map features to discrete categories. Evaluating models on accuracy alone hides critical false negatives.',
        mentalModel5s: 'Accuracy counts total right answers; precision and recall dissect which mistakes were made.',
        visualAnalogy: 'A fishing net: recall is catching all the fish in the lake; precision is ensuring you catch fish instead of old boots.',
        pitfalls: [
          'High accuracy with zero recall on imbalanced datasets.'
        ],
        progressiveHints: [
          'Fit LogisticRegression(max_iter=1000, random_state=random_state).',
          'Use zero_division=0 to prevent warnings.'
        ],
        mathFormulas: [
          {
            title: 'F1 Score Formula',
            latex: 'F_1 = 2 \\cdot \\frac{\\text{Precision} \\cdot \\text{Recall}}{\\text{Precision} + \\text{Recall}}',
            explanation: 'The harmonic mean penalizes systems with one strong and one terrible score.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Manual loop metric calculations
tp = sum(1 for y, p in zip(y_test, y_pred) if y == 1 and p == 1)`,
          naiveExplanation: 'Manual loops are bug-prone and slow.',
          idiomaticCode: `# Clean Scikit-Learn Metrics
acc = accuracy_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred, zero_division=0)`,
          idiomaticExplanation: 'Optimized C-backed vectorized calculations.',
          speedupText: 'Instantaneous evaluation'
        },
        memoryLayout: {
          title: 'Weight and Bias Vectors',
          content: 'LogisticRegression stores coef_ of shape (1, n_features) and intercept_ of shape (1,).',
          keyRule: 'Linear decision boundary where w * x + b = 0.'
        },
        keyTakeaways: [
          'LogisticRegression produces calibrated class probabilities.',
          'Always inspect confusion_matrix for error distribution.',
          'Use F1-score for balanced performance assessment.'
        ]
      },
      expectedTensors: [
        { name: 'confusion_matrix', shape: '(2, 2)', dtype: 'int64' }
      ]
    },
    {
      id: 'sk-p3-c2',
      dayId: 3,
      partId: 3,
      title: 'Decision Tree Feature Importance Inspector',
      slug: 'decision-tree-feature-importance-inspector',
      difficulty: 'Beginner',
      category: 'Classification',
      summary: 'Train a DecisionTreeClassifier and rank features in descending order by their Gini impurity reduction.',
      mentalModel5s: 'Features that sit at the top of a decision tree and split the largest purest subgroups have the highest importance.',
      visualAnalogy: 'A game of 20 Questions: the first question ("Is it an animal?") narrows down the possibilities most and has the highest importance.',
      pitfalls: [
        'Mismatched feature_names length with X_train column count.',
        'Not handling ties or zero-importance features properly.'
      ],
      progressiveHints: [
        'Tier 1 (Validation): Ensure len(feature_names) == X_train.shape[1].',
        'Tier 2 (Fit): Train DecisionTreeClassifier(max_depth=max_depth, random_state=random_state).',
        'Tier 3 (Importances): Extract tree.feature_importances_.',
        'Tier 4 (Ranking): Use np.argsort(importances)[::-1] to sort feature names descending.'
      ],
      deepInternals: {
        title: 'Mean Decrease in Impurity (MDI)',
        content: 'Decision tree feature importance measures the normalized total reduction of the Gini criterion brought by that feature across all split nodes.',
        keyRule: 'The sum of all feature_importances_ in a DecisionTree is always 1.0.'
      },
      instructions: `Write a function \`inspect_tree_feature_importances(X_train: np.ndarray, y_train: np.ndarray, feature_names: list[str], max_depth: Optional[int] = None, random_state: int = 42) -> dict\` that:
1. Validates inputs:
   - If \`len(X_train) != len(y_train)\`, raise \`ValueError("X_train and y_train length mismatch")\`.
   - If \`X_train.shape[1] != len(feature_names)\`, raise \`ValueError("feature_names count must match number of columns in X_train")\`.
   - If \`len(feature_names) == 0\`, raise \`ValueError("feature_names cannot be empty")\`.
2. Fits a \`DecisionTreeClassifier(max_depth=max_depth, random_state=random_state)\` on \`(X_train, y_train)\`.
3. Extracts \`tree.feature_importances_\`.
4. Ranks features from highest importance to lowest importance.
5. Returns a dictionary:
   - \`"model"\`: fitted DecisionTreeClassifier
   - \`"feature_importances"\`: dict mapping each feature name to its float importance
   - \`"ranked_features"\`: list of feature names sorted descending by importance
   - \`"top_feature"\`: string name of the feature with the highest importance.`,
      hints: [
        'Import DecisionTreeClassifier from sklearn.tree.',
        'Sort indices with np.argsort(importances)[::-1].',
        'Map sorted indices back to feature_names.'
      ],
      starterCode: `import numpy as np
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
`,
      solutionCode: `import numpy as np
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
`,
      testCases: [
        {
          id: 't1',
          name: 'Dominant Feature Identification',
          inputDescription: '4 samples, signal_b determines the target label completely',
          expectedOutput: 'top_feature="signal_b", ranked_features starts with "signal_b", sum of importances is 1.0'
        },
        {
          id: 't2',
          name: 'Feature Names Count Mismatch',
          inputDescription: 'X has 3 columns but feature_names has 2 entries',
          expectedOutput: 'Raises ValueError'
        }
      ],
      benchmarkTargetMs: 2.0,
      memoryTargetMb: 1.0,
      conceptPrimer: {
        title: 'Decision Tree Gini Importance',
        subtitle: 'Quantifying feature contribution to impurity reduction',
        overview: 'Decision trees partition the input space orthogonally. Features that split large populations with significant purity gains receive high importance weights.',
        mentalModel5s: 'The feature that best separates the target classes sits at the top of the tree.',
        visualAnalogy: 'Sorting recyclable materials: the conveyor first splits metals with a magnet (highest importance), then glass by color.',
        pitfalls: [
          'High cardinality continuous features can bias Gini importance upward.'
        ],
        progressiveHints: [
          'Train DecisionTreeClassifier.',
          'Extract tree.feature_importances_ and sort with np.argsort()[::-1].'
        ],
        mathFormulas: [
          {
            title: 'Gini Impurity',
            latex: 'I_G(p) = 1 - \\sum_{k=1}^K p_k^2',
            explanation: 'Measures class heterogeneity at each node.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Trying to manually inspect splits in loops
# Hard to calculate tree impurity contributions manually`,
          naiveExplanation: 'Re-implementing tree traversal is tedious and slow.',
          idiomaticCode: `# Built-in feature_importances_
tree.fit(X, y)
ranks = np.argsort(tree.feature_importances_)[::-1]`,
          idiomaticExplanation: 'Direct O(1) attribute access to precomputed impurity drops.',
          speedupText: 'Zero-overhead extraction'
        },
        memoryLayout: {
          title: 'Tree Node Structure',
          content: 'The decision tree stores split thresholds, feature indices, and value arrays in compact Cython structs.',
          keyRule: 'Sum of feature_importances_ across all features equals 1.0.'
        },
        keyTakeaways: [
          'Decision trees provide intuitive non-linear modeling.',
          'feature_importances_ pinpoints key predictive drivers.',
          'Ranking features reveals redundant or noisy variables.'
        ]
      },
      expectedTensors: []
    }
  ]
};

export const DAY03_TRACK = SKLEARN_PART03_TRACK;
export const testCases: TestCase[] = SKLEARN_PART03_TRACK.challenges.flatMap(c => c.testCases);
export default SKLEARN_PART03_TRACK;
