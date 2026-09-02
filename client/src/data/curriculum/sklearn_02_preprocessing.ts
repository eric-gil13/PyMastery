import type { DayTrack, Challenge, ConceptPrimerData, TestCase } from '../../types';

export type { DayTrack, Challenge, ConceptPrimerData };

export const SKLEARN_PART02_TRACK: DayTrack = {
  partNumber: 2,
  partId: 2,
  dayNumber: 2,
  id: 2,
  title: 'Part 2: Feature Preprocessing & Scaling',
  subtitle: 'Scale numeric features and encode categories without leaking test statistics into training',
  description: 'Master numerical normalization and categorical encoding using StandardScaler, MinMaxScaler, and OneHotEncoder. Learn the cardinal rule of machine learning preprocessing: always fit scalers exclusively on training data and transform test data using the fitted parameters to prevent catastrophic data leakage.',
  iconName: 'Filter',
  badge: 'Part 2 • Preprocessing',
  libraryMechanics: {
    libraryName: 'Scikit-Learn Feature Preprocessing',
    tagline: 'Normalize continuous distributions and encode categorical factors safely.',
    overview: `### 🎯 Why Preprocessing Dictates Model Accuracy
Raw data is rarely ready for linear algebra. Continuous columns exist on disparate scales (e.g., Age $[18, 80]$ vs Salary $[20000, 300000]$), while categorical variables exist as text strings.

Distance-based algorithms (k-NN, SVM) and gradient-based estimators (Logistic Regression, Neural Nets) will treat large-magnitude features as infinitely more important unless features are standardized.

### 🛡️ The Danger of Preprocessing Leakage
Calculating the mean $\\mu$ or min/max on the whole dataset before splitting leaks information about the test distribution into the training process.
**Golden Rule:** Compute transformations strictly using \`X_train\`, then apply those exact parameters to \`X_test\`.`,
    whyItExists: `Manual scaling and dummy variable generation with raw pandas causes production failures:
- Inconsistent dummy columns when test data lacks rare categories.
- Code crashes when encountering unseen categories at inference time.
- Silent statistical leakage when normalizing prior to cross-validation folds.

Scikit-Learn transformers solve this with the \`fit()\` and \`transform()\` contract, \`ColumnTransformer\`, and resilient \`handle_unknown='ignore'\` configurations.`,
    coreAnatomy: {
      objectName: 'ColumnTransformer',
      description: 'Applies transformers to columns of an array or pandas DataFrame, concatenating the transformed outputs into a single feature matrix.',
      fields: [
        {
          name: 'transformers',
          type: 'list of (name, transformer, columns) tuples',
          role: 'Defines dedicated transformation pipelines for specific column slices.'
        },
        {
          name: 'remainder',
          type: "'drop' | 'passthrough' | Estimator",
          role: 'Specifies how to handle non-explicitly listed columns.'
        },
        {
          name: 'sparse_threshold',
          type: 'float',
          role: 'Determines whether the concatenated matrix is stored as a sparse matrix or dense ndarray.'
        }
      ],
      memoryDiagramAscii: `+-------------------------------------------------------------+
|              Incoming Heterogeneous DataFrame               |
|   [ Age (float) | Income (float) ]    [ City (categorical) ]|
+-----------------------------------+-------------------------+
                  |                               |
       StandardScaler.fit()              OneHotEncoder.fit()
                  v                               v
         [ Normalized Floats ]           [ Binary Indicator 0/1 ]
                  \\                             /
                   +---------------------------+
                   | Horizontally Stacked (2D) |
                   +---------------------------+`
    },
    chapters: [
      {
        id: 'ch1-standard-vs-minmax',
        title: 'StandardScaler vs MinMaxScaler',
        icon: 'Layers',
        summary: 'Choosing between Z-score centering and bounded range normalization.',
        markdownContent: `### StandardScaler (Z-Score)
Transforms values to mean $\\mu = 0$ and unit variance $\\sigma = 1$:
$$z = \\frac{x - \\mu}{\\sigma}$$
Well-suited for normal distributions and models with regularized weights.

### MinMaxScaler
Compresses values into a fixed range (typically $[0, 1]$):
$$x_{norm} = \\frac{x - x_{min}}{x_{max} - x_{min}}$$
Very sensitive to extreme outliers, which crush non-outlier data into a microscopic interval.`
      },
      {
        id: 'ch2-one-hot-encoding',
        title: 'OneHotEncoder & Unseen Categories',
        icon: 'Grid',
        summary: 'Converting string labels to binary columns with defensive production flags.',
        markdownContent: `### Defensive Categorical Encoding

In real-world applications, inference payloads frequently introduce categories never seen during training (e.g. a newly launched store branch).

Always configure:
\`\`\`python
from sklearn.preprocessing import OneHotEncoder

encoder = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
\`\`\`
- \`sparse_output=False\`: returns a dense NumPy array directly.
- \`handle_unknown='ignore'\`: outputs all zeros for unseen categories instead of throwing a ValueError.`
      },
      {
        id: 'ch3-column-transformer',
        title: 'ColumnTransformer Architecture',
        icon: 'Columns',
        summary: 'Routing columns to distinct transformers in parallel.',
        markdownContent: `### Combining Mixed Feature Types

\`\`\`python
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder

preprocessor = ColumnTransformer(
    transformers=[
        ('num', StandardScaler(), ['age', 'income']),
        ('cat', OneHotEncoder(sparse_output=False, handle_unknown='ignore'), ['city'])
    ]
)

X_train_proc = preprocessor.fit_transform(train_df)
X_test_proc = preprocessor.transform(test_df)
\`\`\``
      }
    ],
    commonTraps: [
      {
        title: 'Fitting Scaler on Entire Dataset Prior to Splitting',
        badSnippet: `scaler = StandardScaler()\nX_scaled = scaler.fit_transform(X)\nX_tr, X_te = train_test_split(X_scaled)`,
        badExplanation: 'The mean and variance of the test set are baked into the training set, causing data leakage.',
        goodSnippet: `X_tr, X_te = train_test_split(X)\nscaler = StandardScaler()\nX_tr_scaled = scaler.fit_transform(X_tr)\nX_te_scaled = scaler.transform(X_te)`,
        goodExplanation: 'The scaler learns parameters exclusively from training data and transforms test data blindly.',
        perfImpact: 'Guarantees reliable cross-validation and uncorrupted production benchmarks.'
      }
    ],
    apiCheatSheet: [
      {
        name: 'StandardScaler',
        category: 'Preprocessing',
        signature: 'StandardScaler(*, copy=True, with_mean=True, with_std=True)',
        summary: 'Standardize features by removing the mean and scaling to unit variance.',
        parameters: [
          { name: 'with_mean', type: 'bool', desc: 'If True, center data before scaling.' },
          { name: 'with_std', type: 'bool', desc: 'If True, scale data to unit variance.' }
        ],
        returns: 'Transformer instance.',
        exampleSnippet: `scaler = StandardScaler()\nX_train_scaled = scaler.fit_transform(X_train)\nX_test_scaled = scaler.transform(X_test)`
      },
      {
        name: 'ColumnTransformer',
        category: 'Compose',
        signature: 'ColumnTransformer(transformers, *, remainder="drop", sparse_threshold=0.3)',
        summary: 'Applies transformers to columns of an array or DataFrame.',
        parameters: [
          { name: 'transformers', type: 'list of tuples', desc: 'Tuples of (name, transformer, columns).' }
        ],
        returns: 'Composite transformer instance.',
        exampleSnippet: `ct = ColumnTransformer([('num', StandardScaler(), ['age']), ('cat', OneHotEncoder(), ['city'])])`
      }
    ],
    interactiveWidgetType: 'sklearn-pipeline'
  },
  challenges: [
    {
      id: 'sk-p2-c1',
      dayId: 2,
      partId: 2,
      title: 'Leak-Free Numerical Scaler',
      slug: 'leak-free-numerical-scaler',
      difficulty: 'Beginner',
      category: 'Preprocessing',
      summary: 'Standardize or normalize continuous feature matrices while strictly preventing data leakage across the train-test boundary.',
      mentalModel5s: 'Fit only on the training set. Transform both training and test sets using the training parameters.',
      visualAnalogy: 'Calibrating a thermometer using known ice water (training set), then measuring the temperature of a sealed thermos (test set) without recalibrating.',
      pitfalls: [
        'Calling fit or fit_transform on X_test.',
        'Accepting 1D inputs without validating that X is a 2D matrix.'
      ],
      progressiveHints: [
        'Tier 1 (Validation): Check that method is in ("standard", "minmax"), inputs are 2D, and column counts match.',
        'Tier 2 (Selection): Instantiate StandardScaler() for "standard", MinMaxScaler() for "minmax".',
        'Tier 3 (Fit on train): Call scaler.fit_transform(X_train).',
        'Tier 4 (Transform test): Call scaler.transform(X_test) — do NOT call fit on X_test!'
      ],
      deepInternals: {
        title: 'Fitted Attributes in Scikit-Learn',
        content: 'Transformers store learned parameters with a trailing underscore (e.g. scaler.mean_, scaler.scale_, scaler.data_min_). These values are computed during .fit() and utilized during .transform().',
        keyRule: 'Transforming test sets using stored training parameters prevents distribution leakage.'
      },
      instructions: `Write a function \`scale_features_leak_free(X_train: np.ndarray, X_test: np.ndarray, method: str = "standard") -> dict\` that:
1. Validates inputs:
   - If \`method\` is not \`"standard"\` and not \`"minmax"\`, raise \`ValueError("method must be 'standard' or 'minmax'")\`.
   - If \`X_train.ndim != 2\` or \`X_test.ndim != 2\` or \`X_train.shape[1] != X_test.shape[1]\`, raise \`ValueError("X_train and X_test must be 2D arrays with identical feature counts")\`.
   - If \`len(X_train) == 0\` or \`len(X_test) == 0\`, raise \`ValueError("Arrays must have at least 1 sample")\`.
2. Selects the feature scaling transformer based on \`method\`: standard score z-normalization when \`"standard"\`, or bounded range normalization when \`"minmax"\`.
3. Fits feature scaling statistics strictly on the training set (\`X_train\`) to prevent data leakage and transforms \`X_train\` into \`X_train_scaled\`.
4. Transforms the testing split (\`X_test\`) into \`X_test_scaled\` using the parameters learned from the training split without refitting.
5. Returns a dictionary:
   \`{"scaler": scaler, "X_train_scaled": X_train_scaled, "X_test_scaled": X_test_scaled}\`.`,
      hints: [
        'Instantiate StandardScaler or MinMaxScaler based on the method argument.',
        'Use scaler.fit_transform(X_train) and scaler.transform(X_test).',
        'Never call fit on X_test.'
      ],
      starterCode: `import numpy as np
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
`,
      solutionCode: `import numpy as np
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
`,
      testCases: [
        {
          id: 't1',
          name: 'Standard Scaling Leak-Free Verification',
          inputDescription: 'X_tr: [[10, 100], [20, 200], [30, 300]], X_te: [[15, 150], [40, 400]], method="standard"',
          expectedOutput: 'scaler.mean_ matches X_tr mean exactly [20, 200], X_train_scaled mean ~ 0 and std ~ 1'
        },
        {
          id: 't2',
          name: 'MinMax Scaling Verification',
          inputDescription: 'X_tr, X_te, method="minmax"',
          expectedOutput: 'X_train_scaled min is 0 and max is 1'
        },
        {
          id: 't3',
          name: 'Invalid Method Name',
          inputDescription: 'method="robust_unknown"',
          expectedOutput: 'Raises ValueError'
        }
      ],
      benchmarkTargetMs: 1.0,
      memoryTargetMb: 0.5,
      conceptPrimer: {
        title: 'Feature Scaling & Boundary Isolation',
        subtitle: 'Preventing distribution leakage during data transformation',
        overview: 'Normalizing numeric features is vital for distance metrics and gradient descent. Fitting scalers across the full dataset corrupts the boundary between training and testing.',
        mentalModel5s: 'Learn scaling parameters on training data only. Apply them blindly to test data.',
        visualAnalogy: 'Calibrating a scale on reference weights in a lab before weighing unknown parcels.',
        pitfalls: [
          'Calling fit_transform on the test set recalculates mean and scale from test data, destroying the benchmark.'
        ],
        progressiveHints: [
          'Check method in ("standard", "minmax").',
          'Use fit_transform on train, transform on test.'
        ],
        mathFormulas: [
          {
            title: 'Standard Normalization',
            latex: 'z = \\frac{x - \\mu_{\\text{train}}}{\\sigma_{\\text{train}}}',
            explanation: 'Both train and test samples are normalized using training statistics.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Leaking test set statistics
scaler = StandardScaler()
X_all = scaler.fit_transform(np.vstack([X_tr, X_te]))`,
          naiveExplanation: 'Test set statistics leak into the training features.',
          idiomaticCode: `# Clean, leak-free transformation
scaler = StandardScaler()
X_tr_s = scaler.fit_transform(X_tr)
X_te_s = scaler.transform(X_te)`,
          idiomaticExplanation: 'Completely isolates test data from the parameter learning step.',
          speedupText: 'Prevents distribution leakage'
        },
        memoryLayout: {
          title: 'Stored Parameter Vectors',
          content: 'The scaler stores 1D float64 vectors for mean_ and scale_ of size (n_features,).',
          keyRule: 'Never call .fit() on validation or test folds.'
        },
        keyTakeaways: [
          'Feature scaling accelerates convergence and balances feature contributions.',
          'StandardScaler centers data to mean 0 and std 1.',
          'Always fit scalers on training data only.'
        ]
      },
      expectedTensors: [
        { name: 'X_train_scaled', shape: '(3, 2)', dtype: 'float64' },
        { name: 'X_test_scaled', shape: '(2, 2)', dtype: 'float64' }
      ]
    },
    {
      id: 'sk-p2-c2',
      dayId: 2,
      partId: 2,
      title: 'Mixed Column Preprocessor',
      slug: 'mixed-column-preprocessor',
      difficulty: 'Beginner',
      category: 'Preprocessing',
      summary: 'Build a composite column transformer that normalizes continuous features and encodes categorical strings into one-hot binary matrices.',
      mentalModel5s: 'ColumnTransformer is an air traffic controller that directs each column to its specialized transformer.',
      visualAnalogy: 'A conveyor belt that splits mail: packages go to the scale, letters go to the barcode stamper, and both exit in a combined shipment.',
      pitfalls: [
        'Omitting handle_unknown="ignore", which causes crashes on unseen test categories.',
        'Forgetting sparse_output=False, returning a SciPy sparse matrix instead of a NumPy array.'
      ],
      progressiveHints: [
        'Tier 1 (Validation): Check that numeric_cols and categorical_cols exist in both train_df and test_df.',
        'Tier 2 (Transformers): Create list with ("num", StandardScaler(), numeric_cols) and ("cat", OneHotEncoder(sparse_output=False, handle_unknown="ignore"), categorical_cols).',
        'Tier 3 (ColumnTransformer): Instantiate ColumnTransformer(transformers=transformers).',
        'Tier 4 (Fit & Transform): Call preprocessor.fit_transform(train_df) and preprocessor.transform(test_df).'
      ],
      deepInternals: {
        title: 'Column Routing in ColumnTransformer',
        content: 'ColumnTransformer isolates column sub-arrays, applies each transformer independently, and joins outputs horizontally using np.hstack.',
        keyRule: 'OneHotEncoder(handle_unknown="ignore", sparse_output=False) is standard for robust pipelines.'
      },
      instructions: `Write a function \`preprocess_mixed_features(train_df: pd.DataFrame, test_df: pd.DataFrame, numeric_cols: list[str], categorical_cols: list[str]) -> dict\` that:
1. Validates inputs:
   - Check that all columns in \`numeric_cols\` and \`categorical_cols\` exist in both \`train_df\` and \`test_df\`. If any are missing, raise \`ValueError("Missing specified column in dataframe")\`.
   - If \`len(numeric_cols) == 0 and len(categorical_cols) == 0\`, raise \`ValueError("At least one numeric or categorical column required")\`.
2. Constructs a composite column transformer with two sub-transformers:
   - Continuous feature standardizer named \`"num"\` targeting \`numeric_cols\` (when \`numeric_cols\` is non-empty).
   - Categorical encoder named \`"cat"\` targeting \`categorical_cols\` (when \`categorical_cols\` is non-empty) that produces dense binary indicator matrices and safely ignores unknown categories during inference.
3. Fits the preprocessor strictly on the training split (\`train_df\`) and transforms both \`train_df\` and \`test_df\` into processed feature matrices \`X_train_proc\` and \`X_test_proc\`.
4. Extracts output feature names from the fitted preprocessor as a list of strings.
5. Returns a dictionary:
   \`{"preprocessor": preprocessor, "X_train_proc": X_train_proc, "X_test_proc": X_test_proc, "feature_names": feature_names}\`.`,
      hints: [
        'Import ColumnTransformer from sklearn.compose and OneHotEncoder, StandardScaler from sklearn.preprocessing.',
        'Configure OneHotEncoder(sparse_output=False, handle_unknown="ignore").',
        'Extract names with list(preprocessor.get_feature_names_out()).'
      ],
      starterCode: `import pandas as pd
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
`,
      solutionCode: `import pandas as pd
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
`,
      testCases: [
        {
          id: 't1',
          name: 'Mixed Tabular Transformation',
          inputDescription: 'train_df with age, score (numeric) and city (categorical), test_df with unseen city',
          expectedOutput: 'X_train_proc (3, 5), X_test_proc (1, 5) with zero-encoding for unseen category'
        },
        {
          id: 't2',
          name: 'Missing Column Validation',
          inputDescription: 'numeric_cols contains column not present in DataFrame',
          expectedOutput: 'Raises ValueError'
        }
      ],
      benchmarkTargetMs: 2.0,
      memoryTargetMb: 1.0,
      conceptPrimer: {
        title: 'ColumnTransformer for Heterogeneous Data',
        subtitle: 'Parallel preprocessing pipelines across tabular columns',
        overview: 'Real-world data contains a blend of numbers, categories, dates, and text. ColumnTransformer cleanly compartmentalizes the transformations applied to each column type.',
        mentalModel5s: 'Route each column type to its dedicated transformer, then merge side-by-side.',
        visualAnalogy: 'A multi-lane highway where cars, buses, and trucks each take specialized lanes before merging into the main tunnel.',
        pitfalls: [
          'Using get_dummies instead of OneHotEncoder, which leads to column misalignment between train and test sets.'
        ],
        progressiveHints: [
          'Build transformers list with ("num", StandardScaler(), numeric_cols).',
          'Add ("cat", OneHotEncoder(sparse_output=False, handle_unknown="ignore"), categorical_cols).'
        ],
        mathFormulas: [
          {
            title: 'One-Hot Vector Mapping',
            latex: '\\mathbf{x}_{\\text{cat}} \\in \\{0, 1\\}^K',
            explanation: 'Each discrete category maps to a binary indicator dimension.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Manual pandas get_dummies mismatch
df_tr_dum = pd.get_dummies(df_tr)
df_te_dum = pd.get_dummies(df_te)  # Columns do not align!`,
          naiveExplanation: 'Test data with different categories creates misaligned columns and crashes models.',
          idiomaticCode: `# Resilient ColumnTransformer
ct = ColumnTransformer([
    ('cat', OneHotEncoder(sparse_output=False, handle_unknown='ignore'), cat_cols)
])`,
          idiomaticExplanation: 'Guarantees strictly consistent column alignment and handles unseen test categories safely.',
          speedupText: 'Production safe'
        },
        memoryLayout: {
          title: 'Horizontal Concatenation',
          content: 'ColumnTransformer produces a unified dense 2D ndarray by joining scaled numeric floats and binary one-hot indicators.',
          keyRule: 'Use get_feature_names_out() to trace transformed column origins.'
        },
        keyTakeaways: [
          'ColumnTransformer processes heterogeneous tabular features in parallel.',
          'OneHotEncoder handles string categories cleanly.',
          'handle_unknown="ignore" prevents runtime crashes on new categories.'
        ]
      },
      expectedTensors: [
        { name: 'X_train_proc', shape: '(3, 5)', dtype: 'float64' },
        { name: 'X_test_proc', shape: '(1, 5)', dtype: 'float64' }
      ]
    }
  ]
};

export const DAY02_TRACK = SKLEARN_PART02_TRACK;
export const testCases: TestCase[] = SKLEARN_PART02_TRACK.challenges.flatMap(c => c.testCases);
export default SKLEARN_PART02_TRACK;
