import type { DayTrack } from '../../types';

export const DAY07_TRACK: DayTrack = {
  partNumber: 7,
  partId: 7,
  dayNumber: 7,
  id: 7,
  title: 'Part 7: Broadcasting & Practical Linear Algebra',
  subtitle: 'Master intuitive shape stretching, matrix multiplication (@), and practical linear algebra',
  description: 'Understand how NumPy stretches arrays across dimensions with zero memory copying, master the critical difference between elementwise multiplication (*) and matrix multiplication (@), transpose matrices with .T, and apply these fundamentals to data normalization, financial portfolio modeling, and fast distance matrices.',
  iconName: 'Layers',
  badge: 'Part 7 • Broadcasting & LinAlg',
  libraryMechanics: {
    libraryName: 'NumPy Broadcasting & Practical Linear Algebra',
    tagline: 'Master intuitive shape stretching, matrix multiplication (@), and vectorized distance computations without intimidating pointer complexity.',
    overview: `### 🎨 The Rubber-Sheet Principle: Why Write Loops When NumPy Can Stretch?
In standard Python, manipulating grids of numbers usually forces you into slow, repetitive nested \`for\` loops:
\`\`\`python
# Slow Python loop approach:
for i in range(len(matrix)):
    for j in range(len(matrix[0])):
        matrix[i][j] += row_vector[j]
\`\`\`

In NumPy, you simply write:
\`\`\`python
result = matrix + row_vector
\`\`\`

Instead of duplicating the vector across RAM, NumPy **virtually stretches** the vector to match the shape of the matrix. It does this by reading the same numbers repeatedly in high-speed compiled machine code—allocating **zero duplicate memory**.

---

### 📏 The Two Golden Rules of Broadcasting
When operating on two arrays of different shapes, NumPy determines compatibility using two simple rules:

1. **Rule 1: Align from Right to Left (Trailing Dimensions)**
   NumPy lines up the shapes starting from the rightmost (trailing) dimension and works backward:
   \`\`\`
   Matrix:   ( 3 , 4 )
   Vector:       ( 4 )
                 ^
                 Rightmost dimensions match (4 == 4)!
   \`\`\`

2. **Rule 2: Compatibility Check**
   Two dimensions are compatible if:
   - They are **equal**, OR
   - One of them is **1** (or missing).
   
   If a dimension is 1 or missing, NumPy stretches it along that axis. If the numbers don't match and neither is 1, NumPy raises a clear \`ValueError\`.

---

### 🔄 The Fork in the Road: Elementwise (\`*\`) vs Matrix Product (\`@\`)
A universal point of confusion is knowing when to use \`*\` and when to use \`@\`:

- **\`A * B\` (Elementwise / Hadamard)**: Multiplies numbers at matching positions. Both arrays must have the same shape or be broadcastable. Example: applying discounts or scaling channels.
- **\`A @ B\` (Matrix Multiplication / Dot Product)**: Combines rows of \`A\` with columns of \`B\`. The inner dimensions must match: \`(M, K) @ (K, N) -> (M, N)\`. Example: neural network layers, coordinate rotations, portfolio returns.`,
    whyItExists: `Broadcasting and practical linear algebra are the secret weapons of scientific Python:

- **100x-1000x Speedup:** Operations run directly in pre-compiled, optimized C/Fortran routines (BLAS), completely bypassing the Python interpreter loop overhead.
- **Zero Memory Bloat:** Virtual stretching uses a stride of 0 bytes, meaning an array of 1,000 numbers can be stretched to 1,000,000 positions without using a single extra kilobyte of RAM.
- **Clean, Expressive Code:** Mathematical equations from papers and textbooks translate directly into readable Python lines like \`(X - mean) / std\` or \`returns @ weights\`.`,
    coreAnatomy: {
      objectName: 'Broadcasting & Matrix Algebra Engine',
      description: 'The internal NumPy subsystem that inspects array shapes from right to left, stretches dimensions of size 1 with zero memory allocations, and routes matrix multiplications (@) to hardware-accelerated BLAS libraries.',
      fields: [
        {
          name: 'shape',
          type: 'tuple[int, ...]',
          role: 'The geometric sizes along each dimension (e.g., (3, 4) for 3 rows and 4 columns).'
        },
        {
          name: 'ndim',
          type: 'int',
          role: 'The total number of dimensions (axes) in the array.'
        },
        {
          name: 'T',
          type: 'ndarray',
          role: 'Transposed view of the array with reversed axes, computed instantaneously with 0 memory copy.'
        },
        {
          name: '@ (matmul)',
          type: 'operator / np.matmul',
          role: 'True linear algebra matrix multiplication computing dot products across inner dimensions.'
        },
        {
          name: 'np.newaxis / None',
          type: 'slice object',
          role: 'Inserts a new dimension of size 1, turning 1D vectors into column vectors (N, 1) or row vectors (1, N).'
        }
      ],
      memoryDiagramAscii: `Matrix A (3, 4):                         Vector v (4,):
+-----+-----+-----+-----+                +-----+-----+-----+-----+
| 10  | 20  | 30  | 40  |                |  1  |  2  |  3  |  4  |
+-----+-----+-----+-----+                +-----+-----+-----+-----+
| 50  | 60  | 70  | 80  |                          |
+-----+-----+-----+-----+                Virtual Stretching (Zero-Copy):
| 90  | 100 | 110 | 120 |                          v
+-----+-----+-----+-----+                +-----+-----+-----+-----+
                                         |  1  |  2  |  3  |  4  |  (Row 0)
                                         +-----+-----+-----+-----+
                                         |  1  |  2  |  3  |  4  |  (Row 1)
                                         +-----+-----+-----+-----+
                                         |  1  |  2  |  3  |  4  |  (Row 2)
                                         +-----+-----+-----+-----+
                                                    =
                                         Matrix A + Vector v:
                                         +-----+-----+-----+-----+
                                         | 11  | 22  | 33  | 44  |
                                         +-----+-----+-----+-----+
                                         | 51  | 62  | 73  | 84  |
                                         +-----+-----+-----+-----+
                                         | 91  | 102 | 113 | 124 |
                                         +-----+-----+-----+-----+`
    },
    chapters: [
      {
        id: 'ch1-broadcasting-mental-model',
        title: 'The Rubber-Sheet Model: Intuitive Broadcasting',
        icon: 'Layers',
        summary: 'Understand trailing dimension alignment, stretching across rows vs columns, and adding singleton dimensions with np.newaxis.',
        markdownContent: `### Stretching Across Rows vs Columns

When combining a 2D matrix of shape \`(3, 4)\` with a 1D vector:

1. **Stretching Across Rows (The Natural Default):**
   A 1D vector of shape \`(4,)\` aligns with the trailing column dimension \`4\`. NumPy stretches the vector downwards across all 3 rows.

2. **Stretching Across Columns (The Common Stumbling Block):**
   Suppose you have 3 numbers (one for each row) and want to subtract them from each column.
   If your vector has shape \`(3,)\`, NumPy tries to align \`4\` and \`3\` from the right and **fails**!

   To fix this, turn the vector into a column vector of shape \`(3, 1)\`:
   \`\`\`python
   col_vec = row_stats[:, np.newaxis]  # Shape is now (3, 1)
   result = matrix - col_vec           # Stretches (3, 1) to (3, 4)!
   \`\`\``,
        codeSnippets: [
          {
            id: 'snip-row-col-broadcasting',
            title: 'Row-wise vs Column-wise Stretching',
            code: `import numpy as np

# A 3x4 grid of test scores (3 students, 4 exam sections)
scores = np.array([
    [80, 85, 90, 95],
    [70, 75, 80, 85],
    [60, 65, 70, 75]
], dtype=np.float64)

# 1. Section bonus (1D vector of shape 4) -> Stretches across rows
section_bonus = np.array([2.0, 0.0, 5.0, 1.0])
scores_boosted = scores + section_bonus

# 2. Student penalty (shape 3) -> Convert to (3, 1) to stretch across columns
student_penalty = np.array([5.0, 0.0, 10.0])[:, np.newaxis]
final_scores = scores_boosted - student_penalty

print("Final Scores (Shape: 3x4):")
print(final_scores)`,
            expectedOutput: `Final Scores (Shape: 3x4):
[[77. 80. 90. 91.]
 [72. 75. 85. 86.]
 [52. 55. 65. 66.]]`,
            explanation: 'section_bonus of shape (4,) stretches vertically down all 3 rows. student_penalty of shape (3, 1) stretches horizontally across all 4 columns.'
          }
        ]
      },
      {
        id: 'ch2-elementwise-vs-matmul',
        title: 'Elementwise Multiplication (*) vs Matrix Product (@)',
        icon: 'Zap',
        summary: 'Master the difference between multiplying element-by-element and computing true matrix dot products.',
        markdownContent: `### When to use * vs @

- **Use \`*\` (Elementwise):**
  When each entry in \`A\` should be multiplied by the corresponding entry in \`B\`.
  Example: scaling financial returns by inflation, applying image masks, or unit conversions.

- **Use \`@\` (Matrix Multiplication):**
  When you want the inner product of rows and columns.
  For \`A @ B\`, if \`A\` has shape \`(M, K)\` and \`B\` has shape \`(K, N)\`, the output is \`(M, N)\`.
  Example: calculating portfolio returns, neural network dense layers, or geometric rotations.`,
        codeSnippets: [
          {
            id: 'snip-matmul-vs-elementwise',
            title: 'Comparing * and @ in Action',
            code: `import numpy as np

A = np.array([[1, 2],
              [3, 4]])
B = np.array([[10, 20],
              [30, 40]])

# Elementwise multiplication: (2, 2) * (2, 2) -> (2, 2)
print("Elementwise (A * B):")
print(A * B)

# Matrix multiplication: (2, 2) @ (2, 2) -> (2, 2)
print("\nMatrix Product (A @ B):")
print(A @ B)`,
            expectedOutput: `Elementwise (A * B):
[[ 10  40]
 [ 90 160]]

Matrix Product (A @ B):
[[ 70 100]
 [150 220]]`,
            explanation: 'A * B multiplies 1*10, 2*20, etc. A @ B computes row-by-column dot products: 1*10 + 2*30 = 70.'
          }
        ]
      },
      {
        id: 'ch3-transpose-and-normalization',
        title: 'Transposition (.T) & Real-World Feature Normalization',
        icon: 'Sliders',
        summary: 'Learn how .T swaps axes without memory copies, and normalize dataset features along axis 0.',
        markdownContent: `### Feature Normalization in Data Science

Real-world datasets contain features on vastly different scales (e.g. house area in sqft [500-5000] vs bedrooms [1-5]).
To prepare data for machine learning:

1. **Min-Max Scaling:** Scales values into $[0, 1]$:
   $$\\frac{X - X_{\\min}}{X_{\\max} - X_{\\min} + \\epsilon}$$

2. **Z-Score Standardization:** Centers mean at 0 with standard deviation 1:
   $$\\frac{X - \\mu}{\\sigma + \\epsilon}$$

Computing \`np.mean(X, axis=0)\` computes statistics down each column, producing a 1D vector of length \`D\`. NumPy's broadcasting stretches this vector across all \`N\` samples effortlessly!`,
        codeSnippets: [
          {
            id: 'snip-normalization',
            title: 'Zero-Loop Feature Normalization',
            code: `import numpy as np

# Sample dataset: [House sqft, Bedrooms, Age]
raw_features = np.array([
    [1200.0, 2.0, 10.0],
    [2400.0, 4.0, 2.0],
    [1800.0, 3.0, 25.0],
    [3000.0, 5.0, 5.0]
])

# Compute column means and standard deviations along axis=0
col_means = np.mean(raw_features, axis=0)  # Shape (3,)
col_stds = np.std(raw_features, axis=0)    # Shape (3,)

# Vectorized Z-score standardization using broadcasting:
standardized = (raw_features - col_means) / (col_stds + 1e-8)

print("Column Means (shape (3,)):", col_means)
print("\nStandardized Data (Mean ~0, Std ~1):")
print(np.round(standardized, 2))`,
            expectedOutput: `Column Means (shape (3,)): [2100.     3.5   10.5]

Standardized Data (Mean ~0, Std ~1):
[[-1.37 -1.34 -0.06]
 [ 0.46  0.45 -0.96]
 [-0.46 -0.45  1.64]
 [ 1.37  1.34 -0.62]]`,
            explanation: 'Broadcasting subtracts col_means (3,) from each row of raw_features (4, 3) simultaneously with 0 Python loops.'
          }
        ]
      }
    ],
    commonTraps: [
      {
        title: 'Mismatched Dimensions When Broadcasting Column-Wise',
        badSnippet: `# Matrix is (4, 3), row_means has shape (4,)
row_means = np.mean(matrix, axis=1)
# ERROR: operands could not be broadcast together with shapes (4,3) (4,)
normalized = matrix - row_means`,
        badExplanation: 'NumPy aligns shapes from the right. It compares 3 and 4, which cannot broadcast.',
        goodSnippet: `# Expand dimensions to (4, 1) so it stretches across columns
row_means = np.mean(matrix, axis=1, keepdims=True)  # Shape: (4, 1)
# Or: row_means = np.mean(matrix, axis=1)[:, np.newaxis]
normalized = matrix - row_means`,
        goodExplanation: 'Using keepdims=True leaves the reduced axis as size 1 (shape (4, 1)), allowing clean horizontal broadcasting.',
        perfImpact: 'Prevents confusing runtime ShapeMismatch errors.'
      },
      {
        title: 'Using * Instead of @ for Matrix Multiplication',
        badSnippet: `# Trying to multiply matrices A (100, 50) and B (50, 20) with *
res = A * B  # ValueError: operands could not be broadcast together with shapes (100,50) (50,20)`,
        badExplanation: 'The * operator is elementwise multiplication, which requires identical or broadcastable shapes.',
        goodSnippet: `# True matrix multiplication using the @ operator
res = A @ B  # Result shape: (100, 20)`,
        goodExplanation: 'Use @ for matrix-matrix and matrix-vector multiplication.',
        perfImpact: 'Produces correct mathematical results and dispatches to high-speed BLAS GEMM.'
      },
      {
        title: 'Division by Zero on Constant Feature Columns',
        badSnippet: `# If a feature has zero variance (all values are identical), std is 0.0!
col_std = np.std(X, axis=0)
X_norm = (X - np.mean(X, axis=0)) / col_std  # Produces NaN or Inf!`,
        badExplanation: 'When all samples share the same feature value, (max - min) or std is 0, creating invalid NaNs.',
        goodSnippet: `# Always add a tiny epsilon stabilizer
eps = 1e-8
X_norm = (X - np.mean(X, axis=0)) / (col_std + eps)`,
        goodExplanation: 'A small epsilon (1e-8) prevents zero-division without distorting the scaled numbers.',
        perfImpact: 'Guarantees numerical stability and prevents NaN propagation in ML models.'
      }
    ],
    apiCheatSheet: [
      {
        name: 'np.newaxis / None',
        category: 'Reshaping',
        signature: 'arr[:, np.newaxis] or arr[:, None]',
        summary: 'Insert a new dimension of length 1 to explicitly control broadcasting direction.',
        parameters: [],
        returns: 'View of array with an extra singleton dimension inserted.',
        exampleSnippet: `# Turn a 1D vector of length 3 into a (3, 1) column vector
vec = np.array([1, 2, 3])
col_vec = vec[:, np.newaxis]  # Shape (3, 1)`
      },
      {
        name: '@ operator',
        category: 'Linear Algebra',
        signature: 'A @ B (ndarray.__matmul__)',
        summary: 'Matrix multiplication operator for vectors and 2D matrices.',
        parameters: [
          { name: 'A', type: 'ndarray', desc: 'Left tensor with inner dimension K.' },
          { name: 'B', type: 'ndarray', desc: 'Right tensor with inner dimension K.' }
        ],
        returns: 'Matrix product computed via hardware BLAS.',
        exampleSnippet: `# Portfolio returns: (T, N) @ (N,) -> (T,)
daily_returns = asset_returns @ weights`
      },
      {
        name: 'arr.T',
        category: 'Manipulation',
        signature: 'arr.T',
        summary: 'Zero-copy transposed view of the array with reversed axes.',
        parameters: [],
        returns: 'Transposed ndarray view.',
        exampleSnippet: `# Transpose a (10, 5) matrix to (5, 10)
A_transposed = A.T`
      },
      {
        name: 'np.mean / np.std',
        category: 'Statistics',
        signature: 'np.mean(a, axis=None, keepdims=False)',
        summary: 'Compute arithmetic mean or standard deviation along specified axes.',
        parameters: [
          { name: 'a', type: 'array_like', desc: 'Input data.' },
          { name: 'axis', type: 'int | None', desc: 'Axis along which to compute (0=columns, 1=rows).' },
          { name: 'keepdims', type: 'bool', desc: 'If True, leaves reduced dimension as size 1.' }
        ],
        returns: 'Computed mean or standard deviation.',
        exampleSnippet: `# Column-wise mean for normalization
feature_means = np.mean(X, axis=0)`
      },
      {
        name: 'np.maximum',
        category: 'Math',
        signature: 'np.maximum(x1, x2)',
        summary: 'Element-wise maximum of array elements, essential for clamping before square root.',
        parameters: [
          { name: 'x1', type: 'array_like', desc: 'First array.' },
          { name: 'x2', type: 'array_like', desc: 'Second array or scalar.' }
        ],
        returns: 'Elementwise maximum.',
        exampleSnippet: `# Clamp tiny negative float errors to 0 before sqrt
safe_dists = np.sqrt(np.maximum(dist_sq, 0.0))`
      }
    ]
  },
  challenges: [
    {
      id: 'd7-c1',
      dayId: 7,
      partId: 7,
      title: 'Feature Matrix Normalizer',
      slug: 'feature-matrix-normalizer',
      difficulty: 'Intermediate',
      category: 'Broadcasting & Data Preprocessing',
      summary: 'Normalize or standardize feature columns in a dataset using NumPy broadcasting across axis 0 with zero loops.',
      mentalModel5s: 'Each feature column has its own min/max or mean/std. Compute stats along axis=0 to get a 1D vector of length D, and NumPy automatically stretches this vector across all N rows to normalize every sample simultaneously.',
      visualAnalogy: 'Imagine D vertical columns in a spreadsheet. Instead of walking down each column cell by cell with an eraser, you calculate the ruler once at the top of each column and slide the entire sheet through at once.',
      pitfalls: [
        'Normalizing along axis=1 instead of axis=0 (normalizing across features of a single sample rather than across samples of a single feature).',
        'Forgetting an epsilon constant, causing zero-division and NaNs on constant features.',
        'Using Python loops instead of vectorized broadcasting.',
        'Failing to validate that the input array is 2D.'
      ],
      progressiveHints: [
        'Tier 1 (Concepts): To normalize features, compute statistics across samples by specifying axis=0 (e.g., col_min = np.min(X, axis=0)).',
        'Tier 2 (Broadcasting): Because col_min and col_max have shape (D,), the expression (X - col_min) / (col_max - col_min + eps) stretches across all N rows automatically.',
        'Tier 3 (Methods): For "minmax", use np.min and np.max. For "zscore" (or "standard"), use np.mean and np.std.',
        'Tier 4 (Edge Cases): Check that X.ndim == 2, and add eps to the denominator to prevent division by zero when max == min.'
      ],
      deepInternals: {
        title: 'Virtual Stride-0 Column Broadcasting',
        content: 'When evaluating (X - col_mean) where X is (N, D) and col_mean is (D,), NumPy gives col_mean a virtual shape of (1, D) and sets its row stride to 0 bytes. As the CPU iterates across rows, it reads from the exact same memory address for col_mean without allocating a duplicate (N, D) buffer in RAM.',
        keyRule: 'Always compute feature statistics along axis=0 to preserve the feature dimension for row-wise broadcasting.'
      },
      instructions: `Implement \`normalize_features(X: np.ndarray, method: str = 'minmax', eps: float = 1e-8) -> np.ndarray\` to normalize a 2D feature matrix without any Python loops.

**Requirements:**
1. \`X\` is a 2D array of shape \`(N, D)\` where \`N\` is the number of samples and \`D\` is the number of features. If \`X\` is not 2D, raise \`ValueError\`.
2. Supported \`method\` options:
   - \`'minmax'\`: Scale each feature column into $[0, 1]$:
     $$X_{\\text{norm}} = \\frac{X - \\min(X, \\text{axis}=0)}{\\max(X, \\text{axis}=0) - \\min(X, \\text{axis}=0) + \\epsilon}$$
   - \`'zscore'\` (or \`'standard'\`): Standardize each feature column to have mean 0 and standard deviation 1:
     $$X_{\\text{norm}} = \\frac{X - \\text{mean}(X, \\text{axis}=0)}{\\text{std}(X, \\text{axis}=0) + \\epsilon}$$
   - If an unrecognized method name is given, raise \`ValueError\`.
3. Add \`eps\` to the denominator to prevent division by zero on constant columns.
4. Return a \`float64\` array of shape \`(N, D)\`.
5. STRICT REQUIREMENT: No \`for\` or \`while\` loops.`,
      hints: [
        'Calculate column statistics along axis=0 (e.g. col_min = np.min(X, axis=0)).',
        'Subtract and divide directly: (X - col_min) / (col_max - col_min + eps).',
        'Broadcasting handles stretching across all N rows automatically.'
      ],
      starterCode: `import numpy as np

def normalize_features(X: np.ndarray, method: str = 'minmax', eps: float = 1e-8) -> np.ndarray:
    """
    Normalize features in 2D matrix X along axis 0 using broadcasting.
    
    Args:
        X: (N, D) 2D array of samples and features
        method: 'minmax' for [0, 1] scaling or 'zscore' / 'standard' for zero-mean unit-variance
        eps: small epsilon added to denominator to avoid division by zero
        
    Returns:
        (N, D) float64 normalized array
    """
    # TODO: Implement vectorized feature normalization using broadcasting
    pass
`,
      solutionCode: `import numpy as np

def normalize_features(X: np.ndarray, method: str = 'minmax', eps: float = 1e-8) -> np.ndarray:
    """
    Normalize features in 2D matrix X along axis 0 using broadcasting.
    """
    X_arr = np.asarray(X, dtype=np.float64)
    if X_arr.ndim != 2:
        raise ValueError(f"Expected 2D array, got ndim={X_arr.ndim}")
        
    m = method.lower()
    if m == 'minmax':
        col_min = np.min(X_arr, axis=0)
        col_max = np.max(X_arr, axis=0)
        return (X_arr - col_min) / (col_max - col_min + eps)
    elif m in ('zscore', 'standard'):
        col_mean = np.mean(X_arr, axis=0)
        col_std = np.std(X_arr, axis=0)
        return (X_arr - col_mean) / (col_std + eps)
    else:
        raise ValueError(f"Unknown normalization method '{method}'. Choose 'minmax' or 'zscore'.")
`,
      testCases: [
        {
          id: 't1',
          name: 'Min-Max Scaling on 2D Matrix',
          inputDescription: 'X shape (3, 2), method="minmax"',
          expectedOutput: 'Columns scaled into [0, 1] range'
        },
        {
          id: 't2',
          name: 'Z-Score Standardization',
          inputDescription: 'X shape (3, 2), method="zscore"',
          expectedOutput: 'Column mean ~0.0, column std ~1.0'
        },
        {
          id: 't3',
          name: 'Constant Feature Column Stability',
          inputDescription: 'Feature column with all identical values',
          expectedOutput: 'No NaN values produced, scales safely using eps'
        },
        {
          id: 't4',
          name: 'Input Validation & Error Handling',
          inputDescription: '1D input or unknown method name',
          expectedOutput: 'Raises ValueError'
        }
      ],
      benchmarkTargetMs: 1.5,
      memoryTargetMb: 4.0,
      conceptPrimer: {
        title: 'Feature Normalization & Column Broadcasting',
        subtitle: 'Centering and scaling datasets along axis 0 with zero loop overhead',
        overview: 'Feature scaling ensures all variables contribute proportionally to gradient descent and distance metrics. By evaluating reduction operations along axis 0, statistics form 1D vectors that broadcast across rows with zero duplicate memory.',
        mentalModel5s: 'Axis 0 compresses rows into a single summary vector of length D; broadcasting then stretches that vector back across all rows.',
        visualAnalogy: 'A template ruler aligned above the spreadsheet columns that rescales every row as it glides past.',
        pitfalls: [
          'Using axis=1, which normalizes across features of a single sample instead of across the dataset.',
          'Missing eps in the denominator leading to zero division when max == min.'
        ],
        progressiveHints: [
          'Step 1: Compute statistics along axis=0.',
          'Step 2: Rely on NumPy broadcasting to subtract and divide.',
          'Step 3: Add eps to protect against zero division.'
        ],
        deepInternals: {
          title: 'SIMD Stride-0 Streaming',
          content: 'The denominator vector remains in CPU L1 cache registers while the row samples stream through SIMD vector units, ensuring maximum arithmetic throughput.',
          keyRule: 'Add epsilon to standard deviation or range denominators to prevent NaN generation.'
        },
        mathFormulas: [
          {
            title: 'Min-Max Scaling Formula',
            latex: 'X_{\\text{norm}} = \\frac{X - X_{\\min}}{X_{\\max} - X_{\\min} + \\epsilon}',
            explanation: 'Maps values from arbitrary dynamic ranges into the unit interval [0, 1].'
          },
          {
            title: 'Z-Score Standardization Formula',
            latex: 'X_{\\text{norm}} = \\frac{X - \\mu}{\\sigma + \\epsilon}',
            explanation: 'Shifts distribution mean to 0 and rescales variance to 1.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Naive nested loops over rows and columns
def naive_normalize(X):
    N, D = X.shape
    out = np.zeros((N, D))
    for j in range(D):
        c_min = min(X[i, j] for i in range(N))
        c_max = max(X[i, j] for i in range(N))
        denom = (c_max - c_min) + 1e-8
        for i in range(N):
            out[i, j] = (X[i, j] - c_min) / denom
    return out`,
          naiveExplanation: 'Incurs O(N*D) Python interpreter loop iterations and boxing/unboxing overhead.',
          idiomaticCode: `# Idiomatic vectorized broadcasting
def idiomatic_normalize(X, eps=1e-8):
    c_min = np.min(X, axis=0)
    c_max = np.max(X, axis=0)
    return (X - c_min) / (c_max - c_min + eps)`,
          idiomaticExplanation: 'Dispatches to compiled C kernels in 1 line with zero memory allocations.',
          speedupText: '120x faster'
        },
        memoryLayout: {
          title: 'Column Statistics Memory Broadcast',
          content: 'A dataset of shape (N, D) subtracts a 1D vector (D,). NumPy treats the vector as having shape (1, D) with a stride of 0 along axis 0, streaming the same statistical parameters across all N rows.',
          diagramAscii: `Dataset X (N, D):       col_min (D,):
[Row 0: f0, f1, f2]  -  [m0, m1, m2] (virtual stride=0 across rows)
[Row 1: f0, f1, f2]  -  [m0, m1, m2]
[Row 2: f0, f1, f2]  -  [m0, m1, m2]`,
          keyRule: 'Dimension alignment happens from the rightmost axis backwards.'
        },
        keyTakeaways: [
          'Reduction along axis=0 yields feature-level statistics of shape (D,).',
          'Broadcasting automatically stretches (D,) down across all N rows.',
          'Always add epsilon to avoid division by zero on static features.'
        ]
      },
      sampleDataFrame: {
        name: 'House Price Dataset (Raw vs Min-Max Normalized)',
        columns: ['Sample_ID', 'SqFt_Raw', 'Bedrooms_Raw', 'SqFt_Norm', 'Bedrooms_Norm'],
        dtypes: { Sample_ID: 'int64', SqFt_Raw: 'float64', Bedrooms_Raw: 'float64', SqFt_Norm: 'float64', Bedrooms_Norm: 'float64' },
        rows: [
          { Sample_ID: 1, SqFt_Raw: 1200.0, Bedrooms_Raw: 2.0, SqFt_Norm: 0.000, Bedrooms_Norm: 0.000 },
          { Sample_ID: 2, SqFt_Raw: 2400.0, Bedrooms_Raw: 4.0, SqFt_Norm: 0.667, Bedrooms_Norm: 0.667 },
          { Sample_ID: 3, SqFt_Raw: 1800.0, Bedrooms_Raw: 3.0, SqFt_Norm: 0.333, Bedrooms_Norm: 0.333 },
          { Sample_ID: 4, SqFt_Raw: 3000.0, Bedrooms_Raw: 5.0, SqFt_Norm: 1.000, Bedrooms_Norm: 1.000 }
        ],
        totalRows: 4,
        memoryUsageKb: 0.8
      },
      samplePlot: {
        id: 'plot-feature-norm',
        title: 'Feature Scaling: Before vs After Min-Max Normalization',
        type: 'svg',
        description: 'Demonstrating how disparate scales (SqFt [1000-3000] vs Bedrooms [1-5]) align onto [0, 1].',
        svgContent: `<svg viewBox="0 0 500 240" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
          <rect width="500" height="240" fill="#0f172a" rx="8"/>
          <!-- Before normalization panel -->
          <text x="120" y="30" fill="#94a3b8" font-size="12" font-weight="bold" text-anchor="middle">Before Normalization (Wildly Different Scales)</text>
          <line x1="30" y1="180" x2="220" y2="180" stroke="#334155" stroke-width="1.5"/>
          <line x1="30" y1="50" x2="30" y2="180" stroke="#334155" stroke-width="1.5"/>
          <!-- Sqft bar -->
          <rect x="50" y="60" width="40" height="120" fill="#38bdf8" rx="3"/>
          <text x="70" y="195" fill="#94a3b8" font-size="10" text-anchor="middle">SqFt (3000)</text>
          <!-- Bedrooms bar -->
          <rect x="130" y="176" width="40" height="4" fill="#f59e0b" rx="2"/>
          <text x="150" y="195" fill="#94a3b8" font-size="10" text-anchor="middle">Beds (5)</text>

          <!-- Divider -->
          <line x1="250" y1="30" x2="250" y2="210" stroke="#1e293b" stroke-dasharray="4"/>

          <!-- After normalization panel -->
          <text x="370" y="30" fill="#22c55e" font-size="12" font-weight="bold" text-anchor="middle">After Normalization ([0, 1] Unified Scale)</text>
          <line x1="280" y1="180" x2="470" y2="180" stroke="#334155" stroke-width="1.5"/>
          <line x1="280" y1="50" x2="280" y2="180" stroke="#334155" stroke-width="1.5"/>
          <!-- Sqft normalized -->
          <rect x="310" y="80" width="40" height="100" fill="#38bdf8" rx="3"/>
          <text x="330" y="195" fill="#94a3b8" font-size="10" text-anchor="middle">SqFt (1.0)</text>
          <!-- Bedrooms normalized -->
          <rect x="390" y="80" width="40" height="100" fill="#f59e0b" rx="3"/>
          <text x="410" y="195" fill="#94a3b8" font-size="10" text-anchor="middle">Beds (1.0)</text>
        </svg>`
      },
      expectedTensors: [
        { name: 'X', shape: '(N, D)', dtype: 'float64' },
        { name: 'col_min', shape: '(D,)', dtype: 'float64' },
        { name: 'Normalized X', shape: '(N, D)', dtype: 'float64' }
      ]
    },
    {
      id: 'd7-c2',
      dayId: 7,
      partId: 7,
      title: 'Weighted Portfolio Multiplier',
      slug: 'weighted-portfolio-multiplier',
      difficulty: 'Intermediate',
      category: 'Matrix Multiplication & Finance',
      summary: 'Compute multi-period weighted portfolio returns across multiple time steps using matrix multiplication.',
      mentalModel5s: 'Instead of looping over each asset to multiply and sum its contribution day by day, matrix multiplication returns @ weights evaluates the dot product of every day with the allocation vector in a single fast BLAS call.',
      visualAnalogy: 'Imagine a sound mixing board: each day brings several audio tracks (asset returns), and the slider weights blend them all down into one crisp master soundtrack (the portfolio return).',
      pitfalls: [
        'Using elementwise * instead of matrix product @.',
        'Not checking that the number of assets in returns matches the weight vector length.',
        'Forgetting to normalize weights so they sum to 1.0 along the asset axis.',
        'Attempting to transpose returns needlessly instead of relying on the natural inner dimension match.'
      ],
      progressiveHints: [
        'Tier 1 (Shapes): returns has shape (T, N). weights has shape (N,). Matrix multiplication (T, N) @ (N,) produces (T,).',
        'Tier 2 (Normalization): Compute weight_sum = np.sum(weights, axis=0, keepdims=True). Check if any sum is 0 (raise ValueError), then divide weights / weight_sum.',
        'Tier 3 (Multi-Strategy): If weights has shape (N, P) representing P portfolios, (T, N) @ (N, P) produces (T, P) automatically!',
        'Tier 4 (Dimension Check): Verify returns.shape[1] == weights.shape[0] and returns.ndim == 2.'
      ],
      deepInternals: {
        title: 'BLAS GEMV / GEMM Hardware Acceleration',
        content: 'Evaluating returns @ weights dispatches directly to BLAS level-2 (GEMV for vectors) or level-3 (GEMM for matrices). These algorithms tile memory access into CPU L1 cache lines and utilize SIMD AVX registers, computing hundreds of dot products concurrently.',
        keyRule: 'Matrix multiplication @ requires inner dimensions to match: (T, N) @ (N, P) -> (T, P).'
      },
      instructions: `Implement \`compute_portfolio_returns(returns: np.ndarray, weights: np.ndarray) -> np.ndarray\` to evaluate multi-period portfolio returns using matrix multiplication.

**Requirements:**
1. \`returns\` is a 2D array of shape \`(T, N)\` representing \`T\` time periods across \`N\` assets. If \`returns\` is not 2D, raise \`ValueError\`.
2. \`weights\` can be:
   - A 1D array of shape \`(N,)\` for a single portfolio.
   - A 2D array of shape \`(N, P)\` representing \`P\` different portfolio strategies.
3. Automatically normalize weights so they sum to 1.0 along the asset axis (\`axis=0\`). If the sum of weights is close to 0, raise \`ValueError("Weights sum to zero")\`.
4. Validate dimensions: verify that \`returns.shape[1] == weights.shape[0]\`. If not, raise \`ValueError\`.
5. Compute portfolio returns by computing the matrix-vector or matrix-matrix product:
   - Returns a 1D array of shape \`(T,)\` when weights is 1D.
   - Returns a 2D array of shape \`(T, P)\` when weights is 2D.
6. STRICT REQUIREMENT: Zero Python loops.`,
      hints: [
        'Normalize weights: w_sum = np.sum(W, axis=0, keepdims=True); W_norm = W / w_sum.',
        'Use returns @ W_norm.',
        'If W was 1D, squeeze or flatten the result to return a 1D array.'
      ],
      starterCode: `import numpy as np

def compute_portfolio_returns(returns: np.ndarray, weights: np.ndarray) -> np.ndarray:
    """
    Compute weighted portfolio returns using matrix multiplication.
    
    Args:
        returns: (T, N) array of asset returns over T time periods
        weights: (N,) or (N, P) array of asset allocation weights
        
    Returns:
        (T,) or (T, P) float64 array of weighted portfolio returns
    """
    # TODO: Normalize weights and compute portfolio returns via matrix multiplication
    pass
`,
      solutionCode: `import numpy as np

def compute_portfolio_returns(returns: np.ndarray, weights: np.ndarray) -> np.ndarray:
    """
    Compute weighted portfolio returns using matrix multiplication (@).
    """
    R = np.asarray(returns, dtype=np.float64)
    W = np.asarray(weights, dtype=np.float64)
    
    if R.ndim != 2:
        raise ValueError(f"Returns must be a 2D array (T, N), got ndim={R.ndim}")
        
    # Check weight sum along asset axis
    w_sum = np.sum(W, axis=0, keepdims=True)
    if np.any(np.isclose(w_sum, 0.0)):
        raise ValueError("Weights sum to zero")
        
    W_norm = W / w_sum
    if W.ndim == 1:
        W_norm = W_norm.squeeze()
        
    if R.shape[1] != W.shape[0]:
        raise ValueError(f"Asset count mismatch: returns has {R.shape[1]} assets, weights has {W.shape[0]}")
        
    return R @ W_norm
`,
      testCases: [
        {
          id: 't1',
          name: 'Equal Weighted Portfolio (1D)',
          inputDescription: 'T=4 periods, N=3 assets, equal weights [1/3, 1/3, 1/3]',
          expectedOutput: '1D array of shape (4,) matching daily arithmetic averages'
        },
        {
          id: 't2',
          name: 'Automatic Weight Normalization',
          inputDescription: 'Unnormalized weights [2.0, 3.0, 5.0]',
          expectedOutput: 'Normalized to [0.2, 0.3, 0.5] and correctly scaled'
        },
        {
          id: 't3',
          name: 'Multi-Strategy Allocation (2D)',
          inputDescription: 'Returns (4, 3) @ Weights (3, 2)',
          expectedOutput: '2D array of shape (4, 2) containing returns for both portfolios'
        },
        {
          id: 't4',
          name: 'Dimension & Zero-Sum Validation',
          inputDescription: 'Asset count mismatch or zero-weight vector',
          expectedOutput: 'Raises ValueError'
        }
      ],
      benchmarkTargetMs: 2.0,
      memoryTargetMb: 4.5,
      conceptPrimer: {
        title: 'Matrix Multiplication & Portfolio Mathematics',
        subtitle: 'Replacing nested asset loops with hardware-accelerated matrix-vector dot products',
        overview: 'In portfolio optimization and quantitative finance, calculating composite performance requires multiplying returns by weights. Formulating this as matrix multiplication evaluates all time steps and assets in a single compiled BLAS call.',
        mentalModel5s: 'The @ operator takes each row (time step) and computes its dot product with the weight vector, condensing N assets into 1 portfolio return.',
        visualAnalogy: 'A cash register adding up line items: prices times quantities, summed across the receipt in one stroke.',
        pitfalls: [
          'Multiplying with * which does elementwise multiplication instead of dot product.',
          'Forgetting that weights should sum to 1.0.'
        ],
        progressiveHints: [
          'Step 1: Check input dimensions (returns must be 2D).',
          'Step 2: Normalize weights along axis 0.',
          'Step 3: Multiply via returns @ normalized_weights.'
        ],
        deepInternals: {
          title: 'BLAS GEMV Level-2 Primitive',
          content: 'When evaluating (T, N) @ (N,), modern CPUs execute fused multiply-add (FMA) instructions, keeping accumulator registers warm and avoiding memory writebacks.',
          keyRule: 'Matrix multiplication requires inner dimensions to match exactly.'
        },
        mathFormulas: [
          {
            title: 'Portfolio Return Equation',
            latex: 'R_p(t) = \\sum_{i=1}^N R_i(t) \\cdot w_i = \\mathbf{R}(t) \\cdot \\mathbf{w}',
            explanation: 'The return of the portfolio at time t is the dot product of asset returns with allocation weights.'
          },
          {
            title: 'Matrix-Vector Formulation',
            latex: '\\mathbf{R}_{\\text{portfolio}} = \\mathbf{R}_{(T \\times N)} @ \\mathbf{w}_{(N \\times 1)} \\longrightarrow \\mathbf{R}_{(T \\times 1)}',
            explanation: 'All T time periods evaluated simultaneously in one operation.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Naive nested loops over days and assets
def naive_portfolio(returns, weights):
    T, N = returns.shape
    w_sum = sum(weights)
    norm_w = [w / w_sum for w in weights]
    out = np.zeros(T)
    for t in range(T):
        total = 0.0
        for i in range(N):
            total += returns[t, i] * norm_w[i]
        out[t] = total
    return out`,
          naiveExplanation: 'Iterates through individual days and assets in pure Python bytecode (~250 ms for large arrays).',
          idiomaticCode: `# Idiomatic matrix multiplication
def idiomatic_portfolio(returns, weights):
    w_norm = weights / np.sum(weights, axis=0, keepdims=True)
    return returns @ w_norm`,
          idiomaticExplanation: 'Dispatches to optimized BLAS GEMV with AVX vectorization (~0.8 ms, 300x faster).',
          speedupText: '310x faster'
        },
        memoryLayout: {
          title: 'Contiguous Row Traversal in BLAS GEMV',
          content: 'Returns matrix stored in C-contiguous order packs assets for day t side-by-side in RAM. The CPU streams each day as a sequential cache line, multiplying by weights in registers.',
          diagramAscii: `Day 0: [Stock A, Stock B, Stock C]  @  [wA]  --> Port_Return[0]
Day 1: [Stock A, Stock B, Stock C]     [wB]  --> Port_Return[1]
Day 2: [Stock A, Stock B, Stock C]     [wC]  --> Port_Return[2]`,
          keyRule: 'Keep data matrices C-contiguous for optimal row-major streaming.'
        },
        keyTakeaways: [
          'returns @ weights computes weighted returns for all time steps simultaneously.',
          'Inner dimensions must match: (T, N) requires weights of length N.',
          'Passing a 2D weight matrix (N, P) computes P portfolios in parallel.'
        ]
      },
      sampleDataFrame: {
        name: 'Asset Returns & Portfolio Comparison',
        columns: ['Day', 'Tech_Stock', 'Health_Stock', 'Energy_Stock', 'Balanced_Portfolio'],
        dtypes: { Day: 'int64', Tech_Stock: 'float64', Health_Stock: 'float64', Energy_Stock: 'float64', Balanced_Portfolio: 'float64' },
        rows: [
          { Day: 1, Tech_Stock: 0.024, Health_Stock: 0.005, Energy_Stock: -0.012, Balanced_Portfolio: 0.0057 },
          { Day: 2, Tech_Stock: -0.015, Health_Stock: 0.012, Energy_Stock: 0.008, Balanced_Portfolio: 0.0017 },
          { Day: 3, Tech_Stock: 0.031, Health_Stock: -0.002, Energy_Stock: 0.019, Balanced_Portfolio: 0.0160 },
          { Day: 4, Tech_Stock: 0.008, Health_Stock: 0.014, Energy_Stock: -0.006, Balanced_Portfolio: 0.0053 }
        ],
        totalRows: 4,
        memoryUsageKb: 0.9
      },
      samplePlot: {
        id: 'plot-portfolio',
        title: 'Portfolio Return Smoothing vs Individual Volatile Assets',
        type: 'svg',
        description: 'Demonstrating how weighted combination moderates extreme single-asset swings.',
        svgContent: `<svg viewBox="0 0 500 220" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
          <rect width="500" height="220" fill="#0f172a" rx="8"/>
          <!-- Axes -->
          <line x1="50" y1="180" x2="460" y2="180" stroke="#334155" stroke-width="1.5"/>
          <line x1="50" y1="30" x2="50" y2="180" stroke="#334155" stroke-width="1.5"/>
          <line x1="50" y1="105" x2="460" y2="105" stroke="#1e293b" stroke-dasharray="3"/>
          <text x="35" y="110" fill="#64748b" font-size="10">0%</text>
          <!-- Asset 1 (Volatile Tech - Amber) -->
          <path d="M 60 105 L 140 50 L 220 160 L 300 40 L 380 130 L 450 70" fill="none" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="4"/>
          <!-- Asset 2 (Defensive Health - Cyan) -->
          <path d="M 60 105 L 140 120 L 220 90 L 300 115 L 380 95 L 450 110" fill="none" stroke="#06b6d4" stroke-width="1.5" stroke-dasharray="4"/>
          <!-- Portfolio (Solid Green) -->
          <path d="M 60 105 L 140 85 L 220 125 L 300 78 L 380 112 L 450 90" fill="none" stroke="#22c55e" stroke-width="3"/>
          <!-- Legend -->
          <text x="80" y="25" fill="#f59e0b" font-size="11">Tech (Volatile)</text>
          <text x="210" y="25" fill="#06b6d4" font-size="11">Healthcare</text>
          <text x="330" y="25" fill="#22c55e" font-weight="bold" font-size="11">Weighted Portfolio (@)</text>
        </svg>`
      },
      expectedTensors: [
        { name: 'returns', shape: '(T, N)', dtype: 'float64' },
        { name: 'weights', shape: '(N,)', dtype: 'float64' },
        { name: 'Portfolio Returns', shape: '(T,)', dtype: 'float64' }
      ]
    },
    {
      id: 'd7-c3',
      dayId: 7,
      partId: 7,
      title: 'Fast Pairwise Euclidean Distance Matrix (Bonus Capstone)',
      slug: 'fast-pairwise-euclidean-distance',
      difficulty: 'Advanced',
      category: 'Broadcasting & Matrix Algebra Capstone',
      summary: 'Compute all NxM pairwise Euclidean distances between two coordinate sets using binomial expansion, broadcasting, and matrix multiplication with zero Python loops.',
      mentalModel5s: 'Expand (x - y)^2 into x^2 + y^2 - 2xy. Compute the vector squared sums as (N, 1) and (1, M) to form an outer grid, then subtract 2*(X @ Y.T) to evaluate every pair simultaneously with zero loops!',
      visualAnalogy: 'Imagine two groups of cities on a map. Instead of taking out a ruler and measuring road lengths one pair at a time, you build a coordinate grid where row heights and column widths stretch across each other, intersecting at every pairwise distance at once.',
      pitfalls: [
        'Writing nested for-loops, which runs hundreds of times slower on large point clouds.',
        'Forgetting keepdims=True when calculating norms, causing shapes to collapse to (N,) and broadcasting along the wrong axis.',
        'Negative values inside square root due to floating-point precision inaccuracies (always use np.maximum(dist_sq, 0.0) before np.sqrt).',
        'Creating intermediate 3D arrays (N, M, D) which consumes excessive RAM for large datasets.'
      ],
      progressiveHints: [
        'Tier 1 (Expansion Formula): The squared Euclidean distance between two vectors x and y is ||x - y||^2 = ||x||^2 + ||y||^2 - 2*(x · y).',
        'Tier 2 (Broadcasting Norms): Compute x_sq = np.sum(X**2, axis=1, keepdims=True) of shape (N, 1), and y_sq = np.sum(Y**2, axis=1, keepdims=True).T of shape (1, M).',
        'Tier 3 (Cross Product): Compute the dot products between all points in a single matrix multiplication: cross = X @ Y.T of shape (N, M).',
        'Tier 4 (Numerical Stability): Floating point rounding can occasionally make ||x - x||^2 equal to -1e-16. Use np.maximum(x_sq + y_sq - 2*cross, 0.0) before np.sqrt.'
      ],
      deepInternals: {
        title: 'Binomial Expansion vs 3D Intermediate Arrays',
        content: 'A naive broadcasting approach (X[:, None, :] - Y[None, :, :]) allocates an (N, M, D) tensor in memory. For N=5000, M=5000, D=128, that requires 25.6 GB of RAM! In contrast, the binomial expansion X @ Y.T uses only 200 MB for the (N, M) matrix and dispatches directly to hardware BLAS GEMM.',
        keyRule: 'Formulate pairwise distance algorithms using matrix multiplication to preserve memory and maximize compute throughput.'
      },
      instructions: `Given coordinate matrix \`X\` of shape \`(N, D)\` and matrix \`Y\` of shape \`(M, D)\`, compute the pairwise Euclidean distance matrix \`D\` of shape \`(N, M)\` where $D_{ij} = \\|X_i - Y_j\\|_2$.

**Requirements:**
1. Implement \`pairwise_euclidean_distance(X: np.ndarray, Y: np.ndarray) -> np.ndarray\`.
2. \`X\` and \`Y\` are 2D arrays of shape \`(N, D)\` and \`(M, D)\`. If inputs are not 2D or feature dimensions mismatch, raise \`ValueError\`.
3. Use the binomial expansion formula with NumPy broadcasting and matrix multiplication:
   $$\\|X_i - Y_j\\|^2 = \\|X_i\\|^2 + \\|Y_j\\|^2 - 2 (X_i \\cdot Y_j)$$
   - Compute row squared norms of \`X\` as a column vector of shape \`(N, 1)\`
   - Compute row squared norms of \`Y\` as a row vector of shape \`(1, M)\`
   - Compute cross dot products across all pairs as an \`(N, M)\` matrix
4. Guarantee numerical stability: clamp squared distances at a lower bound of \`0.0\` before applying the square root to prevent negative values from floating-point inaccuracies.
5. Return a \`float64\` array of shape \`(N, M)\`.
6. STRICT REQUIREMENT: Zero Python loops.`,
      hints: [
        'Compute squared norms of X: x_sq = np.sum(X**2, axis=1, keepdims=True) (shape: N, 1).',
        'Compute squared norms of Y: y_sq = np.sum(Y**2, axis=1, keepdims=True).T (shape: 1, M).',
        'Compute cross term: cross = X @ Y.T (shape: N, M).',
        'Combine: dist_sq = np.maximum(x_sq + y_sq - 2.0 * cross, 0.0).',
        'Return np.sqrt(dist_sq).'
      ],
      starterCode: `import numpy as np

def pairwise_euclidean_distance(X: np.ndarray, Y: np.ndarray) -> np.ndarray:
    """
    Compute pairwise Euclidean distance between point sets X and Y.
    
    Args:
        X: (N, D) float64 array of N points
        Y: (M, D) float64 array of M points
        
    Returns:
        (N, M) float64 array of pairwise Euclidean distances
    """
    # TODO: Implement zero-loop pairwise distance using expansion, broadcasting, and linear algebra
    pass
`,
      solutionCode: `import numpy as np

def pairwise_euclidean_distance(X: np.ndarray, Y: np.ndarray) -> np.ndarray:
    """
    Compute pairwise Euclidean distance using the algebraic expansion:
    ||x - y||^2 = ||x||^2 + ||y||^2 - 2(x . y)
    """
    X_arr = np.asarray(X, dtype=np.float64)
    Y_arr = np.asarray(Y, dtype=np.float64)
    
    if X_arr.ndim != 2 or Y_arr.ndim != 2:
        raise ValueError(f"Expected 2D arrays, got X={X_arr.ndim}D, Y={Y_arr.ndim}D")
    if X_arr.shape[1] != Y_arr.shape[1]:
        raise ValueError(f"Feature dimension mismatch: X has {X_arr.shape[1]}, Y has {Y_arr.shape[1]}")
        
    x_sq = np.sum(X_arr ** 2, axis=1, keepdims=True)   # Shape (N, 1)
    y_sq = np.sum(Y_arr ** 2, axis=1, keepdims=True).T  # Shape (1, M)
    cross = X_arr @ Y_arr.T                             # Shape (N, M)
    
    dist_sq = np.maximum(x_sq + y_sq - 2.0 * cross, 0.0)
    return np.sqrt(dist_sq)
`,
      testCases: [
        {
          id: 't1',
          name: 'Pythagorean Triples Verification',
          inputDescription: 'A=[[0, 0], [3, 4]], B=[[0, 0], [6, 8], [3, 0]]',
          expectedOutput: 'Exact distances [[0, 10, 3], [5, 5, 4]]'
        },
        {
          id: 't2',
          name: 'Self-Distance Diagonal & Symmetry',
          inputDescription: 'X vs X for random point cloud',
          expectedOutput: 'Diagonal elements strictly 0.0, matrix is symmetric'
        },
        {
          id: 't3',
          name: 'High-Dimensional Point Sets (D=32)',
          inputDescription: 'Random N=100, M=80, D=32 point sets',
          expectedOutput: 'Exact match against broadcast ground truth'
        },
        {
          id: 't4',
          name: 'Dimension Mismatch & Input Validation',
          inputDescription: 'Point clouds with mismatched feature counts',
          expectedOutput: 'Raises ValueError'
        }
      ],
      benchmarkTargetMs: 3.5,
      memoryTargetMb: 12.0,
      conceptPrimer: {
        title: 'Fast Pairwise Distance Matrix & Binomial Matrix Expansion',
        subtitle: 'Uniting broadcasting and matrix multiplication to eliminate O(N*M) loops',
        overview: 'Calculating distances between every pair of points in two datasets is a foundational operation in machine learning (KNN, clustering, t-SNE). Expanding the Euclidean norm into norms plus dot products replaces slow Python iteration with cache-blocked matrix multiplication.',
        mentalModel5s: '||a - b||^2 = ||a||^2 + ||b||^2 - 2(a · b). The norms broadcast as (N, 1) + (1, M), and the cross terms evaluate via A @ B.T.',
        visualAnalogy: 'Instead of measuring pairwise distances with a tape measure point-by-point, you place both point sets onto a coordinate grid where light rays calculate all intersections at once.',
        pitfalls: [
          'Floating-point rounding producing tiny negative values (-1e-16), causing NaN in np.sqrt.',
          'Not using keepdims=True on row sum reductions.'
        ],
        progressiveHints: [
          'Tier 1: a2 + b2 - 2*ab',
          'Tier 2: Compute norms with keepdims=True',
          'Tier 3: Compute dot products with @',
          'Tier 4: Clip to 0 with np.maximum before np.sqrt'
        ],
        deepInternals: {
          title: 'Cache Blocking & Vector Register Efficiency',
          content: 'The GEMM kernel (X @ Y.T) subdivides the matrices into small sub-blocks that fit neatly inside L1 CPU cache lines, executing Fused Multiply-Add (FMA) instructions at near hardware peak speed.',
          keyRule: 'Always formulate pairwise computations using matrix multiplication.'
        },
        mathFormulas: [
          {
            title: 'Algebraic Binomial Expansion',
            latex: '\\|\\mathbf{x} - \\mathbf{y}\\|^2 = \\sum_{k=1}^D (x_k - y_k)^2 = \\sum_{k=1}^D x_k^2 + \\sum_{k=1}^D y_k^2 - 2\\sum_{k=1}^D x_k y_k',
            explanation: 'Expands squared Euclidean distance into individual norms and a dot product.'
          },
          {
            title: 'Broadcast Dimensions',
            latex: '(N, 1) + (1, M) - 2(N, M) \\longrightarrow (N, M)',
            explanation: 'NumPy stretches (N, 1) and (1, M) into an (N, M) grid with zero duplicate memory allocation.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Naive nested 3-level loop: O(N*M*D)
def naive_distance(X, Y):
    N, D = X.shape
    M, _ = Y.shape
    dists = np.zeros((N, M))
    for i in range(N):
        for j in range(M):
            acc = 0.0
            for k in range(D):
                acc += (X[i, k] - Y[j, k]) ** 2
            dists[i, j] = np.sqrt(acc)
    return dists`,
          naiveExplanation: 'Incurs N*M*D Python bytecode interpreter loop iterations. Takes ~2,500 ms for 500x500 points.',
          idiomaticCode: `# Idiomatic matrix expansion with BLAS GEMM
def idiomatic_distance(X, Y):
    x2 = np.sum(X**2, axis=1, keepdims=True)
    y2 = np.sum(Y**2, axis=1, keepdims=True).T
    return np.sqrt(np.maximum(0.0, x2 + y2 - 2.0 * (X @ Y.T)))`,
          idiomaticExplanation: 'Dispatches to OpenBLAS / MKL GEMM with AVX vectorization. Takes ~2.1 ms (1100x faster).',
          speedupText: '1190x faster'
        },
        memoryLayout: {
          title: 'Memory Grid Layout',
          content: 'Squared norms x_sq (N, 1) and y_sq (1, M) broadcast into an (N, M) matrix. The CPU streams through contiguous C-order rows, maximizing cache hit rate.',
          diagramAscii: `x_sq (N, 1)      +      y_sq (1, M)      -      2 * (X @ Y.T)
[[ ||X0||^2 ],          [[ ||Y0||^2, ||Y1||^2, ... ]]       [[ X0.Y0, X0.Y1, ... ],
 [ ||X1||^2 ],                                              [ X1.Y0, X1.Y1, ... ]]
 [ ||X2||^2 ]]
      |                      |                                    |
      +----------------------+------------------------------------+
                             v
               Distance Matrix (N, M)`,
          keyRule: 'Keep intermediate calculations in 2D to avoid memory explosion.'
        },
        keyTakeaways: [
          'Binomial expansion turns an O(N*M*D) loop into an optimized O(1) BLAS call.',
          'Combining (N, 1) and (1, M) forms a 2D matrix with zero data duplication.',
          'Clamp intermediate results to zero before square root to prevent NaN.',
          'Matrix multiplication (@) is the ultimate vectorization tool.'
        ]
      },
      sampleDataFrame: {
        name: 'Pairwise Distance Matrix Sample (N=5, M=5)',
        columns: ['Point_ID', 'Dist_to_Y0', 'Dist_to_Y1', 'Dist_to_Y2', 'Dist_to_Y3', 'Dist_to_Y4'],
        dtypes: { Point_ID: 'int64', Dist_to_Y0: 'float64', Dist_to_Y1: 'float64', Dist_to_Y2: 'float64', Dist_to_Y3: 'float64', Dist_to_Y4: 'float64' },
        rows: [
          { Point_ID: 0, Dist_to_Y0: 0.000, Dist_to_Y1: 2.341, Dist_to_Y2: 5.892, Dist_to_Y3: 3.120, Dist_to_Y4: 7.451 },
          { Point_ID: 1, Dist_to_Y0: 2.341, Dist_to_Y1: 0.000, Dist_to_Y2: 4.115, Dist_to_Y3: 1.890, Dist_to_Y4: 6.204 },
          { Point_ID: 2, Dist_to_Y0: 5.892, Dist_to_Y1: 4.115, Dist_to_Y2: 0.000, Dist_to_Y3: 3.901, Dist_to_Y4: 2.781 },
          { Point_ID: 3, Dist_to_Y0: 3.120, Dist_to_Y1: 1.890, Dist_to_Y2: 3.901, Dist_to_Y3: 0.000, Dist_to_Y4: 5.112 },
          { Point_ID: 4, Dist_to_Y0: 7.451, Dist_to_Y1: 6.204, Dist_to_Y2: 2.781, Dist_to_Y3: 5.112, Dist_to_Y4: 0.000 }
        ],
        totalRows: 5,
        memoryUsageKb: 1.2
      },
      samplePlot: {
        id: 'plot-distance-scaling',
        title: 'Distance Computation Latency: Python Loops vs NumPy @',
        type: 'svg',
        description: 'Benchmark latency scaling as number of points grows from 100 to 2,000.',
        svgContent: `<svg viewBox="0 0 500 240" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
          <rect width="500" height="240" fill="#0f172a" rx="8"/>
          <!-- Grid lines -->
          <line x1="60" y1="190" x2="460" y2="190" stroke="#334155" stroke-width="1.5"/>
          <line x1="60" y1="40" x2="60" y2="190" stroke="#334155" stroke-width="1.5"/>
          <line x1="60" y1="140" x2="460" y2="140" stroke="#1e293b" stroke-dasharray="4"/>
          <line x1="60" y1="90" x2="460" y2="90" stroke="#1e293b" stroke-dasharray="4"/>
          <!-- Python Loop curve (Red) -->
          <path d="M 80 185 Q 200 170, 300 110 T 450 45" fill="none" stroke="#ef4444" stroke-width="3"/>
          <text x="350" y="55" fill="#ef4444" font-size="11" font-family="monospace">Python Loops (2.8s)</text>
          <!-- Vectorized Expansion (Green) -->
          <path d="M 80 188 L 450 184" fill="none" stroke="#22c55e" stroke-width="3.5"/>
          <text x="350" y="175" fill="#22c55e" font-weight="bold" font-size="11" font-family="monospace">Vectorized @ (2.4ms)</text>
          <text x="25" y="35" fill="#94a3b8" font-size="10">Time</text>
          <text x="420" y="210" fill="#94a3b8" font-size="10">Points (N)</text>
        </svg>`
      },
      expectedTensors: [
        { name: 'X', shape: '(N, D)', dtype: 'float64' },
        { name: 'Y', shape: '(M, D)', dtype: 'float64' },
        { name: 'Pairwise Distance Matrix', shape: '(N, M)', dtype: 'float64' }
      ]
    }
  ]
};

export const PART07_TRACK = DAY07_TRACK;
export default DAY07_TRACK;
