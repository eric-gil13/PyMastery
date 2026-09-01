import type { DayTrack, Challenge, ConceptPrimerData, TestCase } from '../../types';

export type { DayTrack, Challenge, ConceptPrimerData };

export const SKLEARN_PART01_TRACK: DayTrack = {
  partNumber: 1,
  partId: 1,
  dayNumber: 1,
  id: 1,
  title: 'Part 1: ML Workflow & Data Splitting',
  subtitle: 'Master features X vs target y, deterministic train_test_split, and class-preserving stratification',
  description: 'Understand the fundamental supervised learning workflow in Scikit-Learn. Learn to partition feature matrices X and target vectors y, ensure reproducible experimentation with random_state, preserve minority class distributions using stratify, and safely partition temporal records without lookahead data leakage.',
  iconName: 'Scissors',
  badge: 'Part 1 • ML Workflow',
  libraryMechanics: {
    libraryName: 'Scikit-Learn ML Workflow & Splitting',
    tagline: 'Isolate training from evaluation to measure true generalization error without leakage.',
    overview: `### 🌟 Welcome to Scikit-Learn: The Industry Standard for Machine Learning
Scikit-Learn provides clean, consistent Python tools for predictive data analysis. At the center of the library lies the supervised learning paradigm:
mapping a 2D matrix of observed input features $X$ to a 1D target vector $y$.

### 🛡️ The Cardinal Law of Machine Learning
A model that is tested on the exact same data it learned from can score deceptively high simply by memorizing noise.
To measure **generalization performance** on genuinely unseen data, we must strictly partition our dataset:
1. **Training Partition (\`X_train\`, \`y_train\`):** The estimator optimizes its internal parameters exclusively on this partition.
2. **Testing Partition (\`X_test\`, \`y_test\`):** Kept strictly locked away until final validation.`,
    whyItExists: `Before Scikit-Learn, data partitioning and model evaluation in Python required error-prone manual array slicing and homebrewed random indexing.

Scikit-Learn established standardized, battle-tested utilities:
- **Consistent API:** All estimators adhere to \`.fit()\`, \`.predict()\`, and \`.score()\`.
- **Reproducibility:** Seeded pseudo-random generation via \`random_state\` ensures that experiments can be audited and reproduced.
- **Distribution Integrity:** Stratification prevents minority class extinction in imbalanced datasets.`,
    coreAnatomy: {
      objectName: 'train_test_split',
      description: 'The primary partition utility that slices feature matrices and target arrays into non-overlapping training and testing subsets.',
      fields: [
        {
          name: 'X',
          type: 'np.ndarray | pd.DataFrame',
          role: '2D feature matrix of shape (n_samples, n_features).'
        },
        {
          name: 'y',
          type: 'np.ndarray | pd.Series',
          role: '1D target vector of shape (n_samples,) containing class labels or continuous response values.'
        },
        {
          name: 'test_size',
          type: 'float | int',
          role: 'Proportion (e.g. 0.2 for 20%) or absolute sample count to allocate to the test subset.'
        },
        {
          name: 'random_state',
          type: 'int | None',
          role: 'Seed for the random number generator guaranteeing deterministic, reproducible splits.'
        },
        {
          name: 'stratify',
          type: 'array-like | None',
          role: 'Target array whose class proportions must be matched exactly in both train and test splits.'
        }
      ],
      memoryDiagramAscii: `+-------------------------------------------------------------+
|                Original Dataset (100 Samples)               |
|  [ Features X (100, 4) ] --------> [ Target y (100,) ]      |
+-------------------------------------------------------------+
                               |
               train_test_split(stratify=y, test_size=0.2)
                               v
+-------------------------------+  +--------------------------+
|       X_train (80, 4)         |  |      X_test (20, 4)      |
|       y_train (80,)           |  |      y_test (20,)        |
|  Class 0: 80% | Class 1: 20%  |  | Class 0: 80% | Cls 1: 20%|
+-------------------------------+  +--------------------------+`
    },
    chapters: [
      {
        id: 'ch1-features-vs-target',
        title: 'Features Matrix X vs Target Vector y',
        icon: 'Layers',
        summary: 'Understanding the dimensional contracts of Scikit-Learn inputs.',
        markdownContent: `### Matrix Dimensions Matter

In Scikit-Learn:
- **\`X\` must always be 2-Dimensional** with shape \`(n_samples, n_features)\`. Even if you have only 1 feature, it must be shaped as \`(N, 1)\`, never \`(N,)\`.
- **\`y\` must be 1-Dimensional** with shape \`(n_samples,)\`.

\`\`\`python
import numpy as np

# Correct 2D feature matrix
X = np.array([[25.0, 50000.0], [45.0, 120000.0], [35.0, 70000.0]])
# Correct 1D target vector
y = np.array([0, 1, 0])

print("X shape:", X.shape)  # (3, 2)
print("y shape:", y.shape)  # (3,)
\`\`\``
      },
      {
        id: 'ch2-stratification',
        title: 'Class Imbalance & Stratified Splitting',
        icon: 'Filter',
        summary: 'Preserving minority event distributions in classification datasets.',
        markdownContent: `### The Risk of Naive Random Shuffling

If only 5% of your dataset represents fraud, a naive random split might place all 5 fraud instances into the test split and zero into the training split!

Passing \`stratify=y\` instructs Scikit-Learn to partition each class independently:
\`\`\`python
from sklearn.model_selection import train_test_split

X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.25,
    random_state=42,
    stratify=y
)
\`\`\``
      },
      {
        id: 'ch3-temporal-splitting',
        title: 'Sequential & Time-Series Data Partitioning',
        icon: 'Clock',
        summary: 'Preventing lookahead data leakage when records are chronologically ordered.',
        markdownContent: `### Lookahead Data Leakage

When records represent a timeline (e.g. stock prices, daily telemetry, web traffic), random shuffling causes the model to train on future timestamps to predict the past.

**Cardinal Rule for Sequential Data:** Split chronologically without shuffling.
\`\`\`python
split_idx = int(len(X) * 0.8)
X_train, X_val = X[:split_idx], X[split_idx:]
y_train, y_val = y[:split_idx], y[split_idx:]
\`\`\``
      }
    ],
    commonTraps: [
      {
        title: 'Omitting random_state in Research Code',
        badSnippet: `X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)`,
        badExplanation: 'Every run produces different partitions, making debugging and hyperparameter comparisons non-deterministic.',
        goodSnippet: `X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)`,
        goodExplanation: 'Seeding random_state guarantees identical, reproducible train/test subsets across runs.',
        perfImpact: 'Critical for experiment auditability and reproducible scientific benchmarks.'
      },
      {
        title: 'Random Shuffling on Time-Series Data',
        badSnippet: `X_train, X_test = train_test_split(time_series_X, shuffle=True)`,
        badExplanation: 'Future events leak into training, causing severe lookahead data leakage.',
        goodSnippet: `split_idx = int(len(X) * 0.8)\nX_train, X_test = X[:split_idx], X[split_idx:]`,
        goodExplanation: 'Preserves the arrow of time, training only on historical records.',
        perfImpact: 'Prevents catastrophic real-world failure when deploying temporal models.'
      }
    ],
    apiCheatSheet: [
      {
        name: 'train_test_split',
        category: 'Model Selection',
        signature: 'train_test_split(*arrays, test_size=None, train_size=None, random_state=None, shuffle=True, stratify=None)',
        summary: 'Split arrays or matrices into random train and test subsets.',
        parameters: [
          { name: '*arrays', type: 'sequence of indexables', desc: 'Lists, numpy arrays, or pandas DataFrames with identical first dimension.' },
          { name: 'test_size', type: 'float or int', desc: 'Proportion (0.0 to 1.0) or absolute count of test samples.' },
          { name: 'stratify', type: 'array-like', desc: 'Array of labels to preserve class proportions.' }
        ],
        returns: 'List containing train-test splits of inputs.',
        exampleSnippet: `X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)`
      }
    ],
    interactiveWidgetType: 'sklearn-pipeline'
  },
  challenges: [
    {
      id: 'sk-p1-c1',
      dayId: 1,
      partId: 1,
      title: 'Stratified Dataset Splitter',
      slug: 'stratified-dataset-splitter',
      difficulty: 'Beginner',
      category: 'Data Partitioning',
      summary: 'Partition an imbalanced classification dataset while preserving exact class proportions in both train and test splits.',
      mentalModel5s: 'Stratify acts like a demographic quota: it ensures both train and test sets have the exact same percentage of each label as the original population.',
      visualAnalogy: 'Dealing cards from a deck such that both players receive exactly 80% red cards and 20% black cards, mirroring the master deck.',
      pitfalls: [
        'Forgetting to pass stratify=y into train_test_split.',
        'Not validating that every class has at least 2 samples.',
        'Confusing test_size proportions with sample counts.'
      ],
      progressiveHints: [
        'Tier 1 (Validation): Check that len(X) == len(y), 0.0 < test_size < 1.0, and len(np.unique(y)) >= 2.',
        'Tier 2 (Splitting): Call train_test_split(X, y, test_size=test_size, random_state=random_state, stratify=y).',
        'Tier 3 (Proportions): For both y_train and y_test, calculate the ratio of each unique class: float(np.sum(arr == cls) / len(arr)).',
        'Tier 4 (Return dict): Package into {"X_train": X_train, "X_test": X_test, "y_train": y_train, "y_test": y_test, "train_proportions": ..., "test_proportions": ...}.'
      ],
      deepInternals: {
        title: 'Stratified Sampling Algorithm',
        content: 'train_test_split with stratify groups indices by class label, applies the specified test_size split to each class subgroup individually, and then rejoins the selected indices.',
        keyRule: 'Every class in y must contain at least 2 instances, or stratified splitting cannot form both train and test sets.'
      },
      instructions: `Write a function \`stratified_train_test_split(X: np.ndarray, y: np.ndarray, test_size: float = 0.2, random_state: int = 42) -> dict\` that:
1. Validates inputs:
   - If \`len(X) != len(y)\`, raise \`ValueError("X and y must have the same number of samples")\`.
   - If \`test_size <= 0.0\` or \`test_size >= 1.0\`, raise \`ValueError("test_size must be between 0.0 and 1.0")\`.
   - If \`len(np.unique(y)) < 2\`, raise \`ValueError("y must contain at least 2 distinct classes")\`.
   - If any class in \`y\` has fewer than 2 samples, raise \`ValueError("Each class must have at least 2 samples for stratified splitting")\`.
2. Splits dataset using \`train_test_split(X, y, test_size=test_size, random_state=random_state, stratify=y)\`.
3. Computes class proportion dictionaries for \`y_train\` and \`y_test\` mapping each class label to its float fraction (\`count / total\`).
4. Returns a dictionary:
   \`{"X_train": X_train, "X_test": X_test, "y_train": y_train, "y_test": y_test, "train_proportions": train_props, "test_proportions": test_props}\`.`,
      hints: [
        'Import train_test_split from sklearn.model_selection.',
        'Pass stratify=y to ensure proportional class balance.',
        'Use np.unique(y, return_counts=True) to inspect class frequencies.'
      ],
      starterCode: `import numpy as np
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
`,
      solutionCode: `import numpy as np
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
`,
      testCases: [
        {
          id: 't1',
          name: 'Binary Imbalanced Split',
          inputDescription: 'X: (100, 4), y: 80% class 0, 20% class 1, test_size=0.2',
          expectedOutput: 'X_train (80, 4), X_test (20, 4), class 0 ratio = 0.8 in both train and test'
        },
        {
          id: 't2',
          name: 'Multiclass Preservation',
          inputDescription: 'X: (100, 2), y: 3 classes (50%, 30%, 20%), test_size=0.3',
          expectedOutput: 'Preserves ratios across all 3 classes in both train and test subsets'
        },
        {
          id: 't3',
          name: 'Dimension Mismatch Validation',
          inputDescription: 'len(X) != len(y)',
          expectedOutput: 'Raises ValueError'
        }
      ],
      benchmarkTargetMs: 2.0,
      memoryTargetMb: 1.0,
      conceptPrimer: {
        title: 'Preserving Class Ratios with Stratification',
        subtitle: 'Why random sampling fails on skewed distributions',
        overview: 'Class imbalance is pervasive in real-world ML. Stratification guarantees that the distribution of target classes remains identical across training and evaluation splits.',
        mentalModel5s: 'Stratify preserves group percentages across every split.',
        visualAnalogy: 'Separating red and blue marbles into two bowls such that each bowl contains the exact same ratio of red to blue marbles.',
        pitfalls: [
          'Using unstratified random splits on rare event data leads to zero positive samples in the test fold.'
        ],
        progressiveHints: [
          'Step 1: Check length equality and test_size range.',
          'Step 2: Ensure y has >= 2 classes with >= 2 instances each.',
          'Step 3: Call train_test_split with stratify=y.'
        ],
        mathFormulas: [
          {
            title: 'Class Proportion Formula',
            latex: 'P(y = c) = \\frac{1}{N} \\sum_{i=1}^N \\mathbb{I}(y_i = c)',
            explanation: 'The proportion of samples in class c relative to total samples N.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Manual filtering and random sampling loops
indices_0 = [i for i, label in enumerate(y) if label == 0]
indices_1 = [i for i, label in enumerate(y) if label == 1]
# Slicing each manually...`,
          naiveExplanation: 'Verbose, error-prone, and slow compared to optimized C-level scikit-learn routines.',
          idiomaticCode: `# Clean Scikit-Learn Stratified Split
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)`,
          idiomaticExplanation: 'Single vectorized call with guaranteed class balance preservation.',
          speedupText: '10x faster and zero bug risk'
        },
        memoryLayout: {
          title: 'Contiguous Index Partitions',
          content: 'train_test_split computes disjoint integer index arrays and extracts NumPy views/copies for train and test slices.',
          keyRule: 'Always pass stratify=y for classification tasks.'
        },
        keyTakeaways: [
          'Supervised ML requires separate training and testing subsets.',
          'random_state ensures experiment repeatability.',
          'stratify=y prevents class distribution shift in imbalanced datasets.'
        ]
      },
      expectedTensors: [
        { name: 'X_train', shape: '(80, 4)', dtype: 'float64' },
        { name: 'X_test', shape: '(20, 4)', dtype: 'float64' }
      ]
    },
    {
      id: 'sk-p1-c2',
      dayId: 1,
      partId: 1,
      title: 'Time-Aware Sequential Splitter',
      slug: 'time-aware-sequential-splitter',
      difficulty: 'Beginner',
      category: 'Data Partitioning',
      summary: 'Partition sequential chronological records into training and validation sets without shuffling to eliminate lookahead data leakage.',
      mentalModel5s: 'You cannot train a model on tomorrow to predict yesterday. Time series splits must always respect chronological order.',
      visualAnalogy: 'Cutting a timeline ribbon at the 80% mark: the left side is the past (training), the right side is the future (testing).',
      pitfalls: [
        'Shuffling sequential records, which leaks future information into past predictions.',
        'Not validating that the split point creates non-empty partitions.'
      ],
      progressiveHints: [
        'Tier 1 (Validation): Validate len(X) == len(y), 0 < train_ratio < 1.0, and len(X) >= 2.',
        'Tier 2 (Split point): Calculate split_index = int(len(X) * train_ratio).',
        'Tier 3 (Slicing): Slice without shuffling: X[:split_index], X[split_index:], y[:split_index], y[split_index:].',
        'Tier 4 (Return): Return dictionary with X_train, X_val, y_train, y_val, and split_index.'
      ],
      deepInternals: {
        title: 'Temporal Lookahead Leakage',
        content: 'In autoregressive or trend-following data, future observations contain information about past noise and state transitions. Shuffling causes evaluation metrics to be unrealistically optimistic.',
        keyRule: 'Never shuffle time-series data when splitting.'
      },
      instructions: `Write a function \`temporal_train_test_split(X: np.ndarray, y: np.ndarray, train_ratio: float = 0.8) -> dict\` that:
1. Validates inputs:
   - If \`len(X) != len(y)\`, raise \`ValueError("X and y must have the same length")\`.
   - If \`train_ratio <= 0.0\` or \`train_ratio >= 1.0\`, raise \`ValueError("train_ratio must be between 0.0 and 1.0")\`.
   - If \`len(X) < 2\`, raise \`ValueError("At least 2 samples required")\`.
2. Computes the chronological split index: \`split_index = int(len(X) * train_ratio)\`.
3. Validates that \`split_index > 0\` and \`split_index < len(X)\`; if not, raise \`ValueError("Split ratio results in an empty split")\`.
4. Slices arrays strictly by index without shuffling:
   - \`X_train = X[:split_index]\`, \`X_val = X[split_index:]\`
   - \`y_train = y[:split_index]\`, \`y_val = y[split_index:]\`
5. Returns a dictionary:
   \`{"X_train": X_train, "X_val": X_val, "y_train": y_train, "y_val": y_val, "split_index": split_index}\`.`,
      hints: [
        'Calculate split_index using int(len(X) * train_ratio).',
        'Use Python array slicing [:split_index] and [split_index:].',
        'Do not apply random permutation.'
      ],
      starterCode: `import numpy as np

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
`,
      solutionCode: `import numpy as np

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
`,
      testCases: [
        {
          id: 't1',
          name: 'Chronological Split',
          inputDescription: 'X: 100 sequential steps, y: 100 targets, train_ratio=0.75',
          expectedOutput: 'split_index=75, X_train length 75, X_val length 25, no overlap in indices'
        },
        {
          id: 't2',
          name: 'Length Mismatch Validation',
          inputDescription: 'len(X) != len(y)',
          expectedOutput: 'Raises ValueError'
        },
        {
          id: 't3',
          name: 'Invalid Ratio Validation',
          inputDescription: 'train_ratio=0.0',
          expectedOutput: 'Raises ValueError'
        }
      ],
      benchmarkTargetMs: 0.5,
      memoryTargetMb: 0.5,
      conceptPrimer: {
        title: 'Time-Aware Data Partitioning',
        subtitle: 'Preserving temporal causality in machine learning',
        overview: 'Time-series forecasting and sequential events demand strict temporal partitioning. Any random shuffling leaks future events into past model training.',
        mentalModel5s: 'The future cannot leak into the past.',
        visualAnalogy: 'Reading a mystery novel in order vs reading chapter 20 before chapter 5.',
        pitfalls: [
          'Using train_test_split with default shuffle=True on time-series records.'
        ],
        progressiveHints: [
          'Calculate split_index = int(len(X) * train_ratio).',
          'Slice X and y using :split_index and split_index:.'
        ],
        mathFormulas: [
          {
            title: 'Chronological Boundary Condition',
            latex: '\\max(t_{\\text{train}}) < \\min(t_{\\text{val}})',
            explanation: 'The latest training timestamp must strictly precede the earliest validation timestamp.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Random shuffling leaks future records
X_tr, X_val, y_tr, y_val = train_test_split(time_data, y, shuffle=True)`,
          naiveExplanation: 'Destroys temporal structure and introduces catastrophic lookahead bias.',
          idiomaticCode: `# Clean chronological slice
idx = int(len(X) * train_ratio)
X_tr, X_val = X[:idx], X[idx:]`,
          idiomaticExplanation: 'Strictly preserves temporal causality with zero future leakage.',
          speedupText: 'Instantaneous O(1) slicing'
        },
        memoryLayout: {
          title: 'Direct Strided Slices',
          content: 'Slicing contiguous 1D/2D arrays in NumPy produces zero-copy views.',
          keyRule: 'Never shuffle time-dependent observations.'
        },
        keyTakeaways: [
          'Time series data must be split chronologically.',
          'Shuffling produces artificial, non-reproducible performance metrics.',
          'Early data trains the model; later data tests generalization.'
        ]
      },
      expectedTensors: [
        { name: 'X_train', shape: '(75, 2)', dtype: 'int64' },
        { name: 'X_val', shape: '(25, 2)', dtype: 'int64' }
      ]
    }
  ]
};

export const DAY01_TRACK = SKLEARN_PART01_TRACK;
export const testCases: TestCase[] = SKLEARN_PART01_TRACK.challenges.flatMap(c => c.testCases);
export default SKLEARN_PART01_TRACK;
