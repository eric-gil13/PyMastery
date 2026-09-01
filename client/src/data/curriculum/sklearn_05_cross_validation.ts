import type { DayTrack, Challenge, ConceptPrimerData, TestCase } from '../../types';

export type { DayTrack, Challenge, ConceptPrimerData };

export const SKLEARN_PART05_TRACK: DayTrack = {
  partNumber: 5,
  partId: 5,
  dayNumber: 5,
  id: 5,
  title: 'Part 5: Cross-Validation & Hyperparameter Search',
  subtitle: 'Evaluate model variance with K-Fold cross-validation and find optimal configurations with GridSearchCV',
  description: 'Move beyond single train/test splits. Utilize K-Fold and StratifiedKFold cross-validation with cross_val_score to reliably estimate generalization error and model stability. Master hyperparameter optimization using GridSearchCV to systematically discover peak predictive configurations.',
  iconName: 'Grid',
  badge: 'Part 5 • Tuning & CV',
  libraryMechanics: {
    libraryName: 'Scikit-Learn Model Selection & Search',
    tagline: 'Rotate validation splits to diagnose variance and systematically tune hyperparameters.',
    overview: `### 🔄 The Fragility of Single Holdout Splits
Relying on a single train/test split leaves your performance estimates vulnerable to lucky or unlucky sampling quirks.
A model might perform brilliantly because the test set happened to receive easy samples, only to collapse in production.

### 🛡️ K-Fold Cross-Validation: Complete Coverage
Cross-validation partitions data into $K$ distinct folds:
- Every sample is used in the validation fold exactly once.
- We obtain $K$ independent performance estimates, allowing us to calculate both **mean performance** and **model variance (stability)**.`,
    whyItExists: `Manual loops over cross-validation folds and nested hyperparameter loops are notoriously error-prone.
Scikit-Learn automates this via:
- \`cross_val_score\`: runs full K-fold validation in a single line.
- \`StratifiedKFold\`: ensures class ratios remain stable across all folds.
- \`GridSearchCV\`: evaluates the Cartesian product of hyperparameter candidates and automatically refits the best estimator on the full dataset.`,
    coreAnatomy: {
      objectName: 'GridSearchCV',
      description: 'Exhaustive search over specified parameter values for an estimator, scoring via cross-validation.',
      fields: [
        {
          name: 'param_grid',
          type: 'dict or list of dicts',
          role: 'Dictionary with parameter names as keys and lists of parameter settings to try as values.'
        },
        {
          name: 'best_params_',
          type: 'dict',
          role: 'Parameter setting that gave the best results on the hold out data.'
        },
        {
          name: 'best_score_',
          type: 'float',
          role: 'Mean cross-validated score of the best_estimator.'
        },
        {
          name: 'best_estimator_',
          type: 'Estimator',
          role: 'Estimator chosen by the search that was refitted on the whole dataset.'
        }
      ],
      memoryDiagramAscii: `+-------------------------------------------------------------+
|               5-Fold Cross-Validation Matrix                |
|  Fold 1:  [ VAL  | TRAIN | TRAIN | TRAIN | TRAIN ] -> 0.88  |
|  Fold 2:  [ TRAIN|  VAL  | TRAIN | TRAIN | TRAIN ] -> 0.85  |
|  Fold 3:  [ TRAIN| TRAIN |  VAL  | TRAIN | TRAIN ] -> 0.91  |
|  Fold 4:  [ TRAIN| TRAIN | TRAIN |  VAL  | TRAIN ] -> 0.87  |
|  Fold 5:  [ TRAIN| TRAIN | TRAIN | TRAIN |  VAL  ] -> 0.89  |
+-------------------------------------------------------------+
 Mean Accuracy = 0.8800 (+/- 0.0200 std)`
    },
    chapters: [
      {
        id: 'ch1-cross-val-score',
        title: 'Evaluating Generalization with cross_val_score',
        icon: 'Repeat',
        summary: 'Estimating performance distribution across multiple validation folds.',
        markdownContent: `### Running Cross-Validation

\`\`\`python
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.tree import DecisionTreeClassifier

clf = DecisionTreeClassifier(max_depth=3, random_state=42)
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

scores = cross_val_score(clf, X, y, cv=cv, scoring="accuracy")

print("Folds:", scores)
print(f"Accuracy: {scores.mean():.3f} +/- {scores.std():.3f}")
\`\`\``
      },
      {
        id: 'ch2-grid-search',
        title: 'Exhaustive Hyperparameter Tuning with GridSearchCV',
        icon: 'Grid',
        summary: 'Automating Cartesian parameter search and model refitting.',
        markdownContent: `### Tuning Parameters

\`\`\`python
from sklearn.model_selection import GridSearchCV
from sklearn.tree import DecisionTreeClassifier

param_grid = {
    'max_depth': [2, 3, 5, 10],
    'min_samples_split': [2, 5, 10]
}

grid = GridSearchCV(
    estimator=DecisionTreeClassifier(random_state=42),
    param_grid=param_grid,
    cv=5,
    scoring='f1_weighted'
)
grid.fit(X, y)

print("Best Parameters:", grid.best_params_)
print("Best CV Score:  ", grid.best_score_)
best_model = grid.best_estimator_
\`\`\``
      }
    ],
    commonTraps: [
      {
        title: 'Tuning Hyperparameters on the Final Test Set',
        badSnippet: `for depth in [2, 5, 10]:\n    model = DecisionTree(max_depth=depth).fit(X_tr)\n    score = model.score(X_te)`,
        badExplanation: 'Evaluating multiple parameter settings directly on the test set overfits the test set.',
        goodSnippet: `grid = GridSearchCV(estimator, param_grid, cv=5)\ngrid.fit(X_tr, y_tr)\nfinal_score = grid.best_estimator_.score(X_te, y_te)`,
        goodExplanation: 'Use cross-validation on the training set to choose parameters, then evaluate the winner once on the untouched test set.',
        perfImpact: 'Eliminates hyperparameter snooping bias.'
      }
    ],
    apiCheatSheet: [
      {
        name: 'cross_val_score',
        category: 'Model Selection',
        signature: 'cross_val_score(estimator, X, y=None, *, scoring=None, cv=None, n_jobs=None)',
        summary: 'Evaluate a score by cross-validation.',
        parameters: [
          { name: 'estimator', type: 'Estimator', desc: 'Object implementing .fit().' },
          { name: 'cv', type: 'int or CV splitter', desc: 'Determines the cross-validation splitting strategy.' },
          { name: 'scoring', type: 'str or callable', desc: 'Scoring metric name (e.g. "accuracy", "f1").' }
        ],
        returns: 'Array of scores for each run of cross validation.',
        exampleSnippet: `scores = cross_val_score(model, X, y, cv=5)`
      },
      {
        name: 'GridSearchCV',
        category: 'Model Selection',
        signature: 'GridSearchCV(estimator, param_grid, *, scoring=None, n_jobs=None, cv=None, refit=True)',
        summary: 'Exhaustive search over specified parameter values for an estimator.',
        parameters: [
          { name: 'estimator', type: 'Estimator', desc: 'Model instance to optimize.' },
          { name: 'param_grid', type: 'dict', desc: 'Dictionary with parameters to test.' },
          { name: 'refit', type: 'bool', desc: 'Refit an estimator using the best found parameters on the whole dataset.' }
        ],
        returns: 'Search estimator instance.',
        exampleSnippet: `grid = GridSearchCV(tree, {'max_depth': [3, 5]}, cv=5).fit(X, y)`
      }
    ],
    interactiveWidgetType: 'sklearn-pipeline'
  },
  challenges: [
    {
      id: 'sk-p5-c1',
      dayId: 5,
      partId: 5,
      title: '5-Fold Stratified Cross-Validator',
      slug: 'stratified-cross-validator',
      difficulty: 'Beginner',
      category: 'Model Selection',
      summary: 'Evaluate model generalization variance using Stratified K-Fold cross-validation and compute summary performance statistics.',
      mentalModel5s: 'Rotate 5 folds so every single sample gets evaluated once, then calculate the average and stability.',
      visualAnalogy: 'Asking 5 different judges to evaluate an ice skater and computing both the average score and the consistency across judges.',
      pitfalls: [
        'Passing n_splits < 2.',
        'Not setting shuffle=True when creating StratifiedKFold.'
      ],
      progressiveHints: [
        'Tier 1 (Validation): Check n_splits >= 2, len(X) == len(y), len(X) > 0.',
        'Tier 2 (Splitter): Set cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=random_state).',
        'Tier 3 (Scores): scores = cross_val_score(estimator, X, y, cv=cv, scoring=scoring).',
        'Tier 4 (Summary): Compute float(np.mean(scores)), float(np.std(scores)), min, and max.'
      ],
      deepInternals: {
        title: 'Fold Index Partitioning',
        content: 'StratifiedKFold splits indices such that the class ratio in each fold is approximately equal to the population ratio.',
        keyRule: 'Cross-validation evaluates pipeline stability, not just mean accuracy.'
      },
      instructions: `Write a function \`evaluate_model_cv(estimator, X: np.ndarray, y: np.ndarray, n_splits: int = 5, scoring: str = "accuracy", random_state: int = 42) -> dict\` that:
1. Validates inputs:
   - If \`n_splits < 2\`, raise \`ValueError("n_splits must be at least 2")\`.
   - If \`len(X) != len(y)\`, raise \`ValueError("X and y length mismatch")\`.
   - If \`len(X) == 0\`, raise \`ValueError("Arrays cannot be empty")\`.
2. Sets up \`cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=random_state)\`.
3. Computes cross-validation scores via \`cross_val_score(estimator, X, y, cv=cv, scoring=scoring)\`.
4. Calculates summary statistics:
   - \`mean_score\`: float from \`np.mean(scores)\`
   - \`std_score\`: float from \`np.std(scores)\`
   - \`min_score\`: float from \`np.min(scores)\`
   - \`max_score\`: float from \`np.max(scores)\`
5. Returns a dictionary:
   \`{"cv_scores": scores, "mean_score": mean_score, "std_score": std_score, "min_score": min_score, "max_score": max_score}\`.`,
      hints: [
        'Import StratifiedKFold and cross_val_score from sklearn.model_selection.',
        'Pass cv into cross_val_score.',
        'Compute mean, std, min, and max of the returned scores array.'
      ],
      starterCode: `import numpy as np
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
`,
      solutionCode: `import numpy as np
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
`,
      testCases: [
        {
          id: 't1',
          name: '5-Fold Evaluation Stability',
          inputDescription: 'X: (100, 3), y: binary targets, n_splits=5',
          expectedOutput: 'cv_scores length 5, mean_score in [0, 1], min <= mean <= max'
        },
        {
          id: 't2',
          name: 'Invalid Splits Count',
          inputDescription: 'n_splits=1',
          expectedOutput: 'Raises ValueError'
        }
      ],
      benchmarkTargetMs: 5.0,
      memoryTargetMb: 1.0,
      conceptPrimer: {
        title: 'K-Fold Cross-Validation',
        subtitle: 'Diagnosing model stability and avoiding sampling luck',
        overview: 'Cross-validation rotates validation folds so every observation is tested. The standard deviation across folds quantifies sensitivity to training data fluctuations.',
        mentalModel5s: 'Rotate K test subsets, measure K scores, compute mean and variance.',
        visualAnalogy: 'Testing a bridge under five different weather conditions rather than just one sunny afternoon.',
        pitfalls: [
          'Using unstratified KFold on imbalanced targets.'
        ],
        progressiveHints: [
          'Build StratifiedKFold with n_splits and shuffle=True.',
          'Call cross_val_score and aggregate statistics.'
        ],
        mathFormulas: [
          {
            title: 'Cross-Validation Mean Score',
            latex: '\\bar{s} = \\frac{1}{K} \\sum_{k=1}^K s_k',
            explanation: 'Average validation score across all K holdout iterations.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Manual fold splitting loops
for train_idx, val_idx in kfold.split(X, y):
    clf.fit(X[train_idx], y[train_idx])
    scores.append(clf.score(X[val_idx], y[val_idx]))`,
          naiveExplanation: 'Re-implementing cross-validation loops is verbose.',
          idiomaticCode: `# Clean cross_val_score
scores = cross_val_score(clf, X, y, cv=cv)`,
          idiomaticExplanation: 'Runs multi-fold evaluation with parallelization support.',
          speedupText: 'Standardized and parallelized'
        },
        memoryLayout: {
          title: 'Fold Score Array',
          content: 'Stores 1D float64 array of length K.',
          keyRule: 'Always evaluate standard deviation alongside mean.'
        },
        keyTakeaways: [
          'K-Fold CV eliminates single-split sampling bias.',
          'StratifiedKFold maintains class distributions across all folds.',
          'cross_val_score automates the full train/eval loop.'
        ]
      },
      expectedTensors: []
    },
    {
      id: 'sk-p5-c2',
      dayId: 5,
      partId: 5,
      title: 'Hyperparameter Grid Search Optimizer',
      slug: 'hyperparameter-grid-search-optimizer',
      difficulty: 'Beginner',
      category: 'Model Selection',
      summary: 'Systematically optimize DecisionTreeClassifier hyperparameters over a grid of candidate configurations using GridSearchCV.',
      mentalModel5s: 'GridSearchCV tests every parameter recipe across multiple folds and returns the winning model baked on the whole dataset.',
      visualAnalogy: 'A chef systematically testing different combinations of oven temperature and baking time to find the crispiest cookie recipe.',
      pitfalls: [
        'Passing an empty param_grid dictionary.',
        'Forgetting that GridSearchCV refits the winning model on the full dataset by default.'
      ],
      progressiveHints: [
        'Tier 1 (Validation): Check param_grid is a non-empty dict, len(X) == len(y), cv >= 2.',
        'Tier 2 (Estimator): Instantiate base DecisionTreeClassifier(random_state=random_state).',
        'Tier 3 (GridSearchCV): Build GridSearchCV(estimator=tree, param_grid=param_grid, cv=cv, scoring=scoring, n_jobs=1).',
        'Tier 4 (Fit & Return): Fit on (X, y) and return dict with grid_search, best_params, best_score, best_estimator.'
      ],
      deepInternals: {
        title: 'Automatic Model Refitting',
        content: 'When refit=True (default), GridSearchCV automatically fits the winning hyperparameter configuration on the entire dataset (X, y) after cross-validation completes.',
        keyRule: 'grid.best_estimator_ is ready for immediate deployment and inference.'
      },
      instructions: `Write a function \`tune_decision_tree_grid(X: np.ndarray, y: np.ndarray, param_grid: dict, cv: int = 5, scoring: str = "f1_weighted", random_state: int = 42) -> dict\` that:
1. Validates inputs:
   - If \`param_grid\` is empty or not a dict, raise \`ValueError("param_grid cannot be empty")\`.
   - If \`len(X) != len(y)\`, raise \`ValueError("X and y length mismatch")\`.
   - If \`cv < 2\`, raise \`ValueError("cv must be at least 2")\`.
2. Instantiates base estimator \`tree = DecisionTreeClassifier(random_state=random_state)\`.
3. Creates \`GridSearchCV(estimator=tree, param_grid=param_grid, cv=cv, scoring=scoring, n_jobs=1)\`.
4. Fits the grid search on \`(X, y)\`.
5. Returns a dictionary:
   - \`"grid_search"\`: the fitted GridSearchCV instance
   - \`"best_params"\`: dict of best parameters (\`grid.best_params_\`)
   - \`"best_score"\`: float average validation score (\`float(grid.best_score_)\`)
   - \`"best_estimator"\`: the refitted best estimator (\`grid.best_estimator_\`).`,
      hints: [
        'Import GridSearchCV from sklearn.model_selection.',
        'Pass n_jobs=1 into GridSearchCV.',
        'Access grid.best_params_, grid.best_score_, and grid.best_estimator_.'
      ],
      starterCode: `import numpy as np
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
`,
      solutionCode: `import numpy as np
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
`,
      testCases: [
        {
          id: 't1',
          name: 'Tree Depth Optimization',
          inputDescription: 'param_grid={"max_depth": [1, 2, 4]}, cv=3',
          expectedOutput: 'best_params contains max_depth from candidate list, best_score in [0, 1]'
        },
        {
          id: 't2',
          name: 'Empty Param Grid Validation',
          inputDescription: 'param_grid={}',
          expectedOutput: 'Raises ValueError'
        }
      ],
      benchmarkTargetMs: 10.0,
      memoryTargetMb: 1.0,
      conceptPrimer: {
        title: 'Hyperparameter Grid Search',
        subtitle: 'Systematic parameter space exploration',
        overview: 'Hyperparameters cannot be learned directly through gradient optimization. GridSearchCV evaluates candidate combinations across cross-validation folds to discover optimal tuning.',
        mentalModel5s: 'Test the Cartesian grid of parameter choices across all folds, then deploy the best performer.',
        visualAnalogy: 'Tuning multiple radio dials together until the signal is crystal clear.',
        pitfalls: [
          'Combinatorial explosion: searching 5 parameters with 4 choices each produces 4^5 = 1024 configurations.'
        ],
        progressiveHints: [
          'Validate non-empty dictionary.',
          'Instantiate GridSearchCV and call .fit(X, y).'
        ],
        mathFormulas: [
          {
            title: 'Cartesian Configuration Count',
            latex: 'C = \\prod_{p=1}^P |V_p| \\times K',
            explanation: 'Total model training runs required across P parameters and K folds.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Nested for-loops over parameters`,
          naiveExplanation: 'Prone to index bugs and missing the automatic refitting step.',
          idiomaticCode: `# Clean GridSearchCV
grid = GridSearchCV(estimator, param_grid, cv=5).fit(X, y)`,
          idiomaticExplanation: 'Automates evaluation, tracking, and refitting in one shot.',
          speedupText: 'Automated search'
        },
        memoryLayout: {
          title: 'CV Results Table',
          content: 'Stores detailed fold scores in cv_results_ dictionary.',
          keyRule: 'best_estimator_ is retrained on the full dataset.'
        },
        keyTakeaways: [
          'GridSearchCV systematically explores parameter spaces.',
          'Cross-validation inside grid search prevents test set overfitting.',
          'Automatic refit produces a production-ready winning estimator.'
        ]
      },
      expectedTensors: []
    }
  ]
};

export const DAY05_TRACK = SKLEARN_PART05_TRACK;
export const testCases: TestCase[] = SKLEARN_PART05_TRACK.challenges.flatMap(c => c.testCases);
export default SKLEARN_PART05_TRACK;
