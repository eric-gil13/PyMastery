import type { DayTrack, Challenge, ConceptPrimerData, TestCase } from '../../types';

export type { DayTrack, Challenge, ConceptPrimerData };

export const SKLEARN_PART04_TRACK: DayTrack = {
  partNumber: 4,
  partId: 4,
  dayNumber: 4,
  id: 4,
  title: 'Part 4: Supervised Regression & Metrics',
  subtitle: 'Model continuous targets with Linear Regression, combat overfitting with Ridge L2 regularization',
  description: 'Learn to model continuous response variables using Linear Regression and Ridge regularized regression. Calculate regression evaluation metrics including Mean Absolute Error (MAE), Mean Squared Error (MSE), Root Mean Squared Error (RMSE), and R-squared (R2), and observe how L2 penalties shrink feature coefficients.',
  iconName: 'TrendingUp',
  badge: 'Part 4 • Regression',
  libraryMechanics: {
    libraryName: 'Scikit-Learn Supervised Regression & Regularization',
    tagline: 'Fit continuous relationships and stabilize collinear weights with L2 shrinkage.',
    overview: `### 📈 Modeling Continuous Real-Valued Targets
Regression algorithms predict numeric quantities: real estate valuations, delivery durations, temperature trajectories, and revenue forecasts.
The goal is to find parameter weights that minimize the discrepancy between predictions $\\hat{y}$ and true measurements $y$.

### 🛡️ Combating Multicollinearity with Regularization
When input features are correlated, Ordinary Least Squares (OLS) produces massive, wildly unstable coefficients.
**Ridge Regression** introduces an L2 penalty $\\alpha \\|\\mathbf{w}\\|^2_2$ that pulls weights toward zero, trading a tiny amount of bias for a dramatic drop in model variance.`,
    whyItExists: `Scikit-Learn makes regression both mathematically rigorous and easy to use:
- Analytical closed-form solvers using LAPACK routines for instant training.
- Native calculation of MAE, MSE, RMSE, and $R^2$ variance explanation.
- Seamless hyperparameter control over regularization strength via $\\alpha$.`,
    coreAnatomy: {
      objectName: 'LinearRegression & Ridge',
      description: 'The core linear regression estimators optimizing Ordinary Least Squares and Tikhonov L2 regularized objectives.',
      fields: [
        {
          name: 'coef_',
          type: 'ndarray of shape (n_features,)',
          role: 'Estimated slope weights for each input feature.'
        },
        {
          name: 'intercept_',
          type: 'float or ndarray',
          role: 'Independent bias term representing expected value of y when all features are zero.'
        },
        {
          name: 'alpha',
          type: 'float (Ridge only)',
          role: 'Regularization strength multiplier. Larger values produce stronger shrinkage.'
        }
      ],
      memoryDiagramAscii: `+-------------------------------------------------------------+
|               Linear Regression Plane: y = w*x + b          |
|    y ^                                                      |
|      |               * (Actual)                             |
|      |              /|                                      |
|      |             / | Residual (Error = y - y_hat)         |
|      |            *--+-------- (Fitted Regression Line)     |
|      |           /                                          |
|      +-------------------------> x                          |
+-------------------------------------------------------------+
 MSE = Mean(Residuals^2)        RMSE = sqrt(MSE)
 MAE = Mean(|Residuals|)        R2 = 1 - (SS_res / SS_tot)`
    },
    chapters: [
      {
        id: 'ch1-ols-formulation',
        title: 'Ordinary Least Squares & Normal Equation',
        icon: 'TrendingUp',
        summary: 'Minimizing residual sum of squares across continuous targets.',
        markdownContent: `### Analytical OLS

Linear regression models $y = \\mathbf{w}^T \\mathbf{x} + b$.
Scikit-Learn minimizes the sum of squared differences:
$$\\mathcal{L}_{\\text{OLS}}(\\mathbf{w}) = \\|\\mathbf{y} - \\mathbf{X}\\mathbf{w}\\|_2^2$$

\`\`\`python
from sklearn.linear_model import LinearRegression

model = LinearRegression()
model.fit(X_train, y_train)

print("Weights:", model.coef_)
print("Bias:   ", model.intercept_)
preds = model.predict(X_test)
\`\`\``
      },
      {
        id: 'ch2-error-metrics',
        title: 'MAE vs MSE vs RMSE vs R-squared',
        icon: 'BarChart2',
        summary: 'Dissecting residual errors and variance explanation.',
        markdownContent: `### Metric Selection Guide

- **MAE (Mean Absolute Error):** Robust to occasional extreme outliers; expressed in original target units.
- **MSE (Mean Squared Error):** Quadratically penalizes large errors.
- **RMSE (Root MSE):** Square root of MSE; penalizes large errors while remaining in original target units.
- **R-squared ($R^2$):** Proportion of variance in $y$ explained by features ($1.0$ is perfect; $0.0$ equals baseline mean predictor).`
      },
      {
        id: 'ch3-ridge-regularization',
        title: 'Ridge L2 Regularization & Weight Shrinkage',
        icon: 'Shield',
        summary: 'Shrinking coefficient norms to tame multicollinearity.',
        markdownContent: `### Tikhonov Regularization

Ridge penalizes large coefficients by minimizing:
$$\\mathcal{L}_{\\text{Ridge}}(\\mathbf{w}) = \\|\\mathbf{y} - \\mathbf{X}\\mathbf{w}\\|_2^2 + \\alpha \\|\\mathbf{w}\\|_2^2$$

\`\`\`python
from sklearn.linear_model import Ridge

ridge = Ridge(alpha=10.0, random_state=42)
ridge.fit(X_train, y_train)

# Compare coefficient magnitudes
print("OLS L2 norm:  ", np.linalg.norm(ols.coef_))
print("Ridge L2 norm:", np.linalg.norm(ridge.coef_))
\`\`\``
      }
    ],
    commonTraps: [
      {
        title: 'Interpreting Negative R-squared as a Bug',
        badSnippet: `r2 = r2_score(y_test, y_pred) # -0.45`,
        badExplanation: 'Assuming R2 is always bounded in [0, 1] and that negative numbers indicate software errors.',
        goodSnippet: `if r2 < 0: print("Model performs worse than simply predicting the mean!")`,
        goodExplanation: 'On test data, a poorly fitted or overfitted model can produce errors worse than a horizontal mean line.',
        perfImpact: 'Crucial diagnostic signal that model is severely overfitting.'
      }
    ],
    apiCheatSheet: [
      {
        name: 'LinearRegression',
        category: 'Linear Models',
        signature: 'LinearRegression(*, fit_intercept=True, copy_X=True)',
        summary: 'Ordinary least squares Linear Regression.',
        parameters: [
          { name: 'fit_intercept', type: 'bool', desc: 'Whether to calculate the intercept for this model.' }
        ],
        returns: 'Estimator instance.',
        exampleSnippet: `reg = LinearRegression().fit(X_train, y_train)`
      },
      {
        name: 'Ridge',
        category: 'Linear Models',
        signature: 'Ridge(alpha=1.0, *, fit_intercept=True, random_state=None)',
        summary: 'Linear least squares with L2 regularization.',
        parameters: [
          { name: 'alpha', type: 'float', desc: 'Regularization strength; must be a positive float.' }
        ],
        returns: 'Estimator instance.',
        exampleSnippet: `ridge = Ridge(alpha=1.0).fit(X_train, y_train)`
      }
    ],
    interactiveWidgetType: 'sklearn-pipeline'
  },
  challenges: [
    {
      id: 'sk-p4-c1',
      dayId: 4,
      partId: 4,
      title: 'Housing Price Regressor',
      slug: 'housing-price-regressor',
      difficulty: 'Beginner',
      category: 'Regression',
      summary: 'Fit an Ordinary Least Squares regression model and compute complete regression performance metrics (MAE, MSE, RMSE, R2).',
      mentalModel5s: 'Find the optimal linear plane that minimizes the sum of squared distances to continuous target points.',
      visualAnalogy: 'Drawing a straight line through a scatterplot such that rubber bands tied from each point to the line have minimum total tension.',
      pitfalls: [
        'Array dimension mismatches between feature matrix and target vector.',
        'Confusing MAE with MSE.'
      ],
      progressiveHints: [
        'Tier 1 (Validation): Validate lengths of X_train == y_train and X_test == y_test.',
        'Tier 2 (Model): Instantiate LinearRegression() and fit on train.',
        'Tier 3 (Predict): y_pred = model.predict(X_test).',
        'Tier 4 (Metrics): Compute MAE, MSE, RMSE (via float(np.sqrt(mse))), and R2.'
      ],
      deepInternals: {
        title: 'Analytical Matrix Inversion via SVD',
        content: 'Scikit-Learn computes OLS using scipy.linalg.lstsq, which relies on Singular Value Decomposition (SVD) for numerical stability.',
        keyRule: 'Computes w = (X^T X)^-1 X^T y in O(N * D^2) time.'
      },
      instructions: `Write a function \`train_housing_regressor(X_train: np.ndarray, y_train: np.ndarray, X_test: np.ndarray, y_test: np.ndarray) -> dict\` that:
1. Validates inputs:
   - If \`len(X_train) != len(y_train)\`, raise \`ValueError("X_train and y_train length mismatch")\`.
   - If \`len(X_test) != len(y_test)\`, raise \`ValueError("X_test and y_test length mismatch")\`.
   - If \`len(X_train) == 0\` or \`len(X_test) == 0\`, raise \`ValueError("Arrays must contain at least 1 sample")\`.
2. Fits a \`LinearRegression()\` model on \`(X_train, y_train)\`.
3. Computes test set predictions: \`y_pred = model.predict(X_test)\`.
4. Computes:
   - \`mae\`: float from \`mean_absolute_error(y_test, y_pred)\`
   - \`mse\`: float from \`mean_squared_error(y_test, y_pred)\`
   - \`rmse\`: float computed as \`float(np.sqrt(mse))\`
   - \`r2\`: float from \`r2_score(y_test, y_pred)\`
5. Returns a dictionary:
   \`{"model": model, "y_pred": y_pred, "mae": mae, "mse": mse, "rmse": rmse, "r2": r2}\`.`,
      hints: [
        'Import LinearRegression from sklearn.linear_model.',
        'Import mean_squared_error, mean_absolute_error, r2_score from sklearn.metrics.',
        'Compute rmse with float(np.sqrt(mse)).'
      ],
      starterCode: `import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

def train_housing_regressor(X_train: np.ndarray, y_train: np.ndarray, X_test: np.ndarray, y_test: np.ndarray) -> dict:
    """
    Fit LinearRegression model and compute MAE, MSE, RMSE, and R2 metrics.

    Args:
        X_train: Training features of shape (n_samples, n_features)
        y_train: Continuous target values of shape (n_samples,)
        X_test: Testing features
        y_test: Testing continuous targets

    Returns:
        dict with model, y_pred, mae, mse, rmse, r2
    """
    # TODO: Validate inputs, fit LinearRegression, predict, compute metrics, return dict
    pass
`,
      solutionCode: `import numpy as np
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
`,
      testCases: [
        {
          id: 't1',
          name: 'Exact Linear Fit',
          inputDescription: 'Linear relationship y = 2*x1 + 3*x2 + 5',
          expectedOutput: 'mae ~ 0.0, mse ~ 0.0, rmse ~ 0.0, r2 ~ 1.0, exact predictions'
        },
        {
          id: 't2',
          name: 'Length Mismatch Validation',
          inputDescription: 'len(X_train) != len(y_train)',
          expectedOutput: 'Raises ValueError'
        }
      ],
      benchmarkTargetMs: 1.0,
      memoryTargetMb: 0.5,
      conceptPrimer: {
        title: 'Ordinary Least Squares & Error Metrics',
        subtitle: 'Quantifying continuous regression errors',
        overview: 'Linear Regression minimizes squared residuals between predictions and real-valued targets. Evaluating regression requires analyzing both absolute magnitude errors and explained variance.',
        mentalModel5s: 'Minimize the sum of squared vertical distances from observations to the fitted hyperplane.',
        visualAnalogy: 'Fitting a rigid metal bar through a cloud of suspended beads.',
        pitfalls: [
          'Extreme outliers exert disproportionate leverage on squared errors.'
        ],
        progressiveHints: [
          'Fit LinearRegression() on train.',
          'Evaluate metrics using sklearn.metrics functions.'
        ],
        mathFormulas: [
          {
            title: 'R-Squared Score',
            latex: 'R^2 = 1 - \\frac{\\sum (y_i - \\hat{y}_i)^2}{\\sum (y_i - \\bar{y})^2}',
            explanation: 'Proportion of total variance explained by model predictions.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Manual residual loops
residuals = [y - p for y, p in zip(y_test, y_pred)]
mse = sum(r**2 for r in residuals) / len(residuals)`,
          naiveExplanation: 'Slow Python loop prone to rounding inaccuracies.',
          idiomaticCode: `# Clean Vectorized Metrics
mse = mean_squared_error(y_test, y_pred)
rmse = np.sqrt(mse)`,
          idiomaticExplanation: 'Compiled C-level calculation with complete numerical stability.',
          speedupText: 'Fast and numerically stable'
        },
        memoryLayout: {
          title: 'Coefficient Storage',
          content: 'Stores float64 coefficients vector and scalar intercept.',
          keyRule: 'y_pred = X @ model.coef_ + model.intercept_.'
        },
        keyTakeaways: [
          'Linear Regression provides straightforward, interpretable continuous modeling.',
          'MAE expresses average deviation in target units.',
          'R-squared measures percentage of explained variance.'
        ]
      },
      expectedTensors: [
        { name: 'y_pred', shape: '(2,)', dtype: 'float64' }
      ]
    },
    {
      id: 'sk-p4-c2',
      dayId: 4,
      partId: 4,
      title: 'Regularized Ridge Predictor',
      slug: 'regularized-ridge-predictor',
      difficulty: 'Beginner',
      category: 'Regression',
      summary: 'Apply L2 Ridge regularization to collinear features and observe coefficient norm shrinkage compared to OLS.',
      mentalModel5s: 'Ridge puts rubber bands on the model weights, pulling them toward zero so no single correlated feature explodes.',
      visualAnalogy: 'Tying stabilizing guy-wires to a tall radio antenna so high winds (noise) do not blow it over.',
      pitfalls: [
        'Negative alpha values, which are mathematically invalid.',
        'Not standardizing features prior to Ridge, which can unfairly penalize features with smaller natural scales.'
      ],
      progressiveHints: [
        'Tier 1 (Validation): Check alpha >= 0.0 and validate input shapes.',
        'Tier 2 (Fit OLS): Fit ols = LinearRegression().fit(X_train, y_train).',
        'Tier 3 (Fit Ridge): Fit ridge = Ridge(alpha=alpha, random_state=42).fit(X_train, y_train).',
        'Tier 4 (Norms & Metrics): Compute r2_score for both, and np.linalg.norm(model.coef_) for both.'
      ],
      deepInternals: {
        title: 'Tikhonov Matrix Conditioning',
        content: 'Ridge adds alpha * I to the matrix X^T X, guaranteeing positive definiteness and invertibility even when columns in X are perfectly collinear.',
        keyRule: 'As alpha approaches infinity, all coefficients shrink asymptotically to zero.'
      },
      instructions: `Write a function \`compare_ols_and_ridge(X_train: np.ndarray, y_train: np.ndarray, X_test: np.ndarray, y_test: np.ndarray, alpha: float = 1.0) -> dict\` that:
1. Validates inputs:
   - If \`alpha < 0.0\`, raise \`ValueError("alpha must be non-negative")\`.
   - If \`len(X_train) != len(y_train)\`, raise \`ValueError("X_train and y_train length mismatch")\`.
   - If \`len(X_test) != len(y_test)\`, raise \`ValueError("X_test and y_test length mismatch")\`.
   - If \`len(X_train) == 0\` or \`len(X_test) == 0\`, raise \`ValueError("Arrays must contain at least 1 sample")\`.
2. Fits an Ordinary Least Squares model: \`ols = LinearRegression()\`, fitted on \`(X_train, y_train)\`.
3. Fits a Ridge model: \`ridge = Ridge(alpha=alpha, random_state=42)\`, fitted on \`(X_train, y_train)\`.
4. Computes test set predictions and R2 scores (\`ols_r2\` and \`ridge_r2\`).
5. Computes Euclidean L2 norms of the coefficients (\`float(np.linalg.norm(ols.coef_))\` and \`float(np.linalg.norm(ridge.coef_))\`).
6. Returns a dictionary:
   \`{"ols_model": ols, "ridge_model": ridge, "ols_coef": ols.coef_, "ridge_coef": ridge.coef_, "ols_r2": ols_r2, "ridge_r2": ridge_r2, "ols_norm": ols_norm, "ridge_norm": ridge_norm}\`.`,
      hints: [
        'Import Ridge from sklearn.linear_model.',
        'Use np.linalg.norm(model.coef_) to calculate L2 norm of weight vector.',
        'Notice that ridge_norm is smaller than ols_norm.'
      ],
      starterCode: `import numpy as np
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.metrics import r2_score

def compare_ols_and_ridge(X_train: np.ndarray, y_train: np.ndarray, X_test: np.ndarray, y_test: np.ndarray, alpha: float = 1.0) -> dict:
    """
    Compare Ordinary Least Squares and Ridge L2 regularized regression.

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
`,
      solutionCode: `import numpy as np
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
`,
      testCases: [
        {
          id: 't1',
          name: 'Coefficient Shrinkage on Collinear Features',
          inputDescription: 'X with 2 collinear features, alpha=10.0',
          expectedOutput: 'ridge_norm strictly less than ols_norm'
        },
        {
          id: 't2',
          name: 'Negative Alpha Validation',
          inputDescription: 'alpha=-1.0',
          expectedOutput: 'Raises ValueError'
        }
      ],
      benchmarkTargetMs: 1.5,
      memoryTargetMb: 0.5,
      conceptPrimer: {
        title: 'Ridge Regression & L2 Penalty',
        subtitle: 'Controlling weight variance in collinear systems',
        overview: 'Correlated predictors inflate OLS parameter variance. Adding an L2 penalty stabilizes matrix inversion and yields robust test predictions.',
        mentalModel5s: 'L2 regularization compresses the weight vector toward zero to prevent overfitting.',
        visualAnalogy: 'Adding a shock absorber to a car suspension to damp out erratic road bumps.',
        pitfalls: [
          'Using unscaled features with Ridge causes features with large scales to escape regularization.'
        ],
        progressiveHints: [
          'Fit LinearRegression and Ridge(alpha=alpha, random_state=42).',
          'Evaluate np.linalg.norm on coef_ for both.'
        ],
        mathFormulas: [
          {
            title: 'Ridge Analytical Solution',
            latex: '\\mathbf{w}^* = (\\mathbf{X}^T \\mathbf{X} + \\alpha \\mathbf{I})^{-1} \\mathbf{X}^T \\mathbf{y}',
            explanation: 'The diagonal loading alpha * I prevents singularity.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Manual gradient descent with L2 penalty`,
          naiveExplanation: 'Manual loops are inefficient when closed-form SVD solves Ridge instantly.',
          idiomaticCode: `# Scikit-Learn Ridge
ridge = Ridge(alpha=1.0).fit(X, y)`,
          idiomaticExplanation: 'Direct LAPACK solve with automatic dispatch to SVD/lsqr.',
          speedupText: 'Optimized LAPACK'
        },
        memoryLayout: {
          title: 'Weight Vector Norm',
          content: 'L2 norm equals sqrt(sum(w_i^2)).',
          keyRule: 'Larger alpha implies smaller L2 norm.'
        },
        keyTakeaways: [
          'Ridge stabilizes regression on collinear data.',
          'alpha controls the bias-variance trade-off.',
          'L2 regularization shrinks coefficients toward zero without setting them strictly to zero.'
        ]
      },
      expectedTensors: []
    }
  ]
};

export const DAY04_TRACK = SKLEARN_PART04_TRACK;
export const testCases: TestCase[] = SKLEARN_PART04_TRACK.challenges.flatMap(c => c.testCases);
export default SKLEARN_PART04_TRACK;
