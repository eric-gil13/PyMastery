import type { DayTrack } from '../../types';

export const DAY05_TRACK: DayTrack = {
  partNumber: 5,
  partId: 5,
  dayNumber: 5,
  id: 5,
  title: 'Part 5: Aggregations, Statistics & Multi-Dimensional Axes',
  subtitle: 'Master axis reduction, directional statistics, argmax/argmin, and cumulative operations with intuitive visual models',
  description: 'Develop rock-solid intuition for the axis parameter in NumPy: visualize collapsing rows down columns (axis=0) vs collapsing columns across rows (axis=1). Compute means, standard deviations, find extreme value indices with argmax, and calculate running cumulative totals without writing a single Python loop.',
  iconName: 'BarChart2',
  badge: 'Part 5 • NumPy Axes',
  libraryMechanics: {
    libraryName: 'NumPy Aggregations, Statistics & Multi-Dimensional Axes',
    tagline: 'Squash dimensions with confidence: intuitive visual mental models for multi-dimensional reductions, statistics, and running totals.',
    overview: `### 📊 The Spreadsheet Intuition
Think of a 2D NumPy array as an Excel spreadsheet or a teacher's gradebook.
- Rows represent individual students.
- Columns represent exams taken throughout the semester.

When you want summary statistics, there are two distinct questions:
1. *"How did each student perform across all exams?"* (You average horizontally across columns $\\rightarrow$ **axis=1**).
2. *"How difficult was each exam for the whole class?"* (You average vertically down rows $\\rightarrow$ **axis=0**).

### ⚡ The "Collapsing Dimension" Mental Model
The most common point of confusion for beginners is remembering whether \`axis=0\` affects rows or columns.
Here is the universal rule:
> **The axis you specify is the dimension that gets collapsed (squashed away).**

- If your array has shape \`(3, 4)\` (3 rows, 4 columns):
  - \`np.mean(arr, axis=0)\` collapses the rows (dimension 0 disappears), leaving you with **4** column means (shape \`(4,)\`).
  - \`np.mean(arr, axis=1)\` collapses the columns (dimension 1 disappears), leaving you with **3** row means (shape \`(3,)\`).
  - \`np.mean(arr, axis=None)\` collapses everything into a single overall scalar.

### 📐 Broadcasting with keepdims=True
When you calculate row averages with \`arr.mean(axis=1)\`, NumPy produces a 1D vector of shape \`(N,)\`.
If you try to subtract this from \`arr\` (to center each row around its personal mean), NumPy tries to broadcast along the trailing dimension and throws an error!

By setting \`keepdims=True\`, NumPy keeps the collapsed axis as size 1: shape \`(N, 1)\`.
Now \`(N, M) - (N, 1)\` broadcasts cleanly across every column without any extra reshaping or copying!`,
    whyItExists: `Aggregations are the engine of all statistical analysis, machine learning metrics, and data processing.
- Vectorized C Loops: NumPy compiles reductions into tight C loops that run 50x to 200x faster than pure Python loops.
- SIMD Parallelism: Vector registers compute sums and averages across multiple numbers per clock cycle.
- Memory Efficiency: Aggregating in-place or along axes avoids creating huge intermediate lists and objects.`,
    coreAnatomy: {
      objectName: 'Reduction Axis Operations',
      description: 'NumPy aggregation functions (sum, mean, std, min, max, argmin, argmax, cumsum) take an axis parameter that determines along which dimension array elements are accumulated and collapsed.',
      fields: [
        {
          name: 'axis',
          type: 'int | tuple[int, ...] | None',
          role: 'The axis or axes along which values are accumulated. None flattens the array and reduces to a scalar.'
        },
        {
          name: 'keepdims',
          type: 'bool',
          role: 'If True, reduced axes are retained in the result as dimensions with size 1, preserving broadcast compatibility.'
        },
        {
          name: 'dtype',
          type: 'data-type, optional',
          role: 'The type used to compute the reduction (e.g. np.float64 to avoid integer overflow in large sums).'
        },
        {
          name: 'out',
          type: 'ndarray, optional',
          role: 'Alternative output array in which to place the result directly without reallocating memory.'
        }
      ],
      memoryDiagramAscii: `+-------------------------------------------------------------------------------+
|                       The Axis Mental Model (Collapsing)                      |
+-------------------------------------------------------------------------------+
                 axis = 1  --> (Collapses columns across each row)
                              Exam 0   Exam 1   Exam 2   Exam 3
                +--------+--------+--------+--------+
    Student 0   |   85   |   90   |   78   |   92   |  ==> Row Mean = 86.25  [shape (3,)]
                +--------+--------+--------+--------+
    Student 1   |   92   |   88   |   95   |   98   |  ==> Row Mean = 93.25
                +--------+--------+--------+--------+
    Student 2   |   70   |   65   |   80   |   75   |  ==> Row Mean = 72.50
                +--------+--------+--------+--------+
                     |        |        |        |
                     v        v        v        v
axis = 0 =====>    82.33    81.00    84.33    88.33     [shape (4,)]
(Collapses rows down each column -> Exam Class Averages)`
    },
    chapters: [
      {
        id: 'ch1-axis-intuition',
        title: 'The Golden Rule of Axes: What Gets Collapsed?',
        icon: 'Layers',
        summary: 'Understand how axis=0 collapses rows down columns while axis=1 collapses columns across rows.',
        markdownContent: `### Understanding the Axis Parameter
When working with 2D tables:
* **\`axis=0\` (Down columns):** You move vertically through rows. The row dimension is eliminated, producing one summary statistic per column.
* **\`axis=1\` (Across rows):** You move horizontally through columns. The column dimension is eliminated, producing one summary statistic per row.
* **\`axis=None\` (Global reduction):** Every number in the entire array is aggregated into a single scalar value.

### Higher Dimensions: 3D and Beyond
In a 3D array of shape \`(Batch, Height, Width)\`:
* \`mean(axis=0)\` computes the average image across the batch: shape \`(Height, Width)\`.
* \`mean(axis=(1, 2))\` computes the mean pixel value for each image in the batch: shape \`(Batch,)\`.`,
        codeSnippets: [
          {
            id: 'snip-axes-demo',
            title: 'Collapsing Rows vs Columns',
            code: `import numpy as np

# 3 students x 4 exams
grades = np.array([
    [85, 90, 78, 92],
    [92, 88, 95, 98],
    [70, 65, 80, 75]
])

print("Overall GPA (axis=None):", grades.mean())
print("Class Average per Exam (axis=0):", grades.mean(axis=0))
print("Each Student's GPA (axis=1):", grades.mean(axis=1))`,
            expectedOutput: `Overall GPA (axis=None): 84.0
Class Average per Exam (axis=0): [82.33333333 81.         84.33333333 88.33333333]
Each Student's GPA (axis=1): [86.25 93.25 72.5 ]`,
            explanation: 'axis=0 squashes the 3 rows down to 4 column averages. axis=1 squashes the 4 columns across to 3 row averages.'
          }
        ]
      },
      {
        id: 'ch2-summary-statistics',
        title: 'Core Statistical Functions',
        icon: 'BarChart2',
        summary: 'Master mean, std, var, min, and max along any axis.',
        markdownContent: `### The Standard Statistical Toolkit
NumPy provides blazing-fast statistical aggregators:
* \`np.sum(arr, axis)\`: Total sum
* \`np.mean(arr, axis)\`: Arithmetic average $\\mu = \\frac{1}{N} \\sum x_i$
* \`np.std(arr, axis, ddof=0)\`: Standard deviation $\\sigma = \\sqrt{\\frac{1}{N} \\sum (x_i - \\mu)^2}$
* \`np.var(arr, axis)\`: Variance $\\sigma^2$
* \`np.min(arr, axis)\` / \`np.max(arr, axis)\`: Extremes

### Degrees of Freedom (\`ddof\`)
By default, NumPy's \`np.std\` uses population standard deviation (\`ddof=0\`, dividing by $N$).
If you need sample standard deviation (dividing by $N - 1$), pass \`ddof=1\`.`,
        codeSnippets: [
          {
            id: 'snip-stats-demo',
            title: 'Computing Dispersion & Extremes',
            code: `import numpy as np

data = np.array([[10, 20, 30], [40, 50, 60]], dtype=float)

print("Mean:", np.mean(data, axis=0))
print("Std Dev:", np.std(data, axis=0))
print("Min per row:", np.min(data, axis=1))
print("Max per row:", np.max(data, axis=1))`,
            expectedOutput: `Mean: [25. 35. 45.]
Std Dev: [15. 15. 15.]
Min per row: [10. 40.]
Max per row: [30. 60.]`,
            explanation: 'All statistical functions accept the axis parameter, giving column-wise or row-wise reductions with identical syntax.'
          }
        ]
      },
      {
        id: 'ch3-finding-extremes',
        title: 'Position Tracking: argmin & argmax',
        icon: 'Target',
        summary: 'Find the exact index locations of minimum and maximum values without sorting.',
        markdownContent: `### Finding the "Winner" with argmax
Often you do not just want to know *what* the maximum number is—you want to know *who* scored it or *when* it happened:
* \`np.max(scores)\` returns the highest score (e.g. \`98\`).
* \`np.argmax(scores, axis=0)\` returns the student index with the highest grade for each exam.
* \`np.argmin(scores, axis=0)\` returns the student index with the lowest grade for each exam.

When applied to a 1D array, \`np.argmax\` returns a single integer index. Along an axis, it returns an array of indices.`,
        codeSnippets: [
          {
            id: 'snip-argmax-demo',
            title: 'Finding Indices of Extremes',
            code: `import numpy as np

scores = np.array([
    [85, 90, 78],  # Student 0
    [92, 88, 95],  # Student 1 (Top student overall)
    [70, 65, 80]   # Student 2
])

# Which student scored highest on each exam? (axis=0)
top_students = np.argmax(scores, axis=0)
print("Top student index for each exam (axis=0):", top_students)

# Which exam was each student's best? (axis=1)
best_exams = np.argmax(scores, axis=1)
print("Best exam index for each student (axis=1):", best_exams)`,
            expectedOutput: `Top student index for each exam (axis=0): [1 0 1]
Best exam index for each student (axis=1): [1 2 2]`,
            explanation: 'argmax gives direct index lookups in O(N) time without sorting overhead.'
          }
        ]
      },
      {
        id: 'ch4-running-totals',
        title: 'Running Totals & Broadcasting with keepdims',
        icon: 'TrendingUp',
        summary: 'Calculate cumulative running totals with cumsum and zero-center data with keepdims=True.',
        markdownContent: `### Cumulative Aggregations: \`np.cumsum\`
Unlike \`np.sum\` which collapses the array to a smaller shape, \`np.cumsum\` keeps the original shape and computes running cumulative totals:
\`\`\`python
transactions = np.array([100, -30, 50, -20])
balance = np.cumsum(transactions)
# [100, 70, 120, 100]
\`\`\`

### The \`keepdims=True\` Superpower
To normalize or zero-center each row of a 2D matrix (subtracting each row's mean):
\`\`\`python
# Without keepdims: shape is (N,) -> shape mismatch during broadcasting!
# With keepdims: shape is (N, 1) -> broadcasts cleanly across (N, M)!
centered = matrix - matrix.mean(axis=1, keepdims=True)
\`\`\``,
        codeSnippets: [
          {
            id: 'snip-cumsum-keepdims',
            title: 'Cumsum & Centering with keepdims',
            code: `import numpy as np

# Cumulative cash balance
daily_flows = np.array([250, -50, 100, -150, 300])
running_balance = np.cumsum(daily_flows)
print("Running Balance:", running_balance)

# Zero-centering student scores
grades = np.array([[80, 90, 100], [60, 70, 80]], dtype=float)
student_means = grades.mean(axis=1, keepdims=True)
print("Student means shape:", student_means.shape)
centered = grades - student_means
print("Centered grades (row means are 0.0):\\n", centered)`,
            expectedOutput: `Running Balance: [250 200 300 150 450]
Student means shape: (2, 1)
Centered grades (row means are 0.0):
 [[-10.   0.  10.]
 [-10.   0.  10.]]`,
            explanation: 'keepdims=True retains shape (2, 1), allowing seamless broadcasting subtraction from (2, 3).'
          }
        ]
      }
    ],
    commonTraps: [
      {
        title: "Confusing axis=0 with 'across rows'",
        badSnippet: `# Intending to compute average of each student (across columns)
# But accidentally passing axis=0:
student_averages = grades.mean(axis=0)  # WRONG: gives exam averages!`,
        badExplanation: "Beginners think 'axis 0 is rows, so axis=0 must mean row averages'. But axis=0 collapses the rows, which computes column statistics.",
        goodSnippet: `# Use axis=1 to collapse columns across each individual row:
student_averages = grades.mean(axis=1)  # CORRECT: gives 1 average per student`,
        goodExplanation: 'Always remember: the axis you name is the axis that disappears.',
        perfImpact: 'Produces completely wrong business metrics (exam difficulty instead of student GPA).'
      },
      {
        title: 'Forgetting keepdims=True during Row Normalization',
        badSnippet: `# Subtracting row mean without keepdims:
row_means = matrix.mean(axis=1)  # Shape (N,)
centered = matrix - row_means     # ValueError or subtle broadcasting error!`,
        badExplanation: 'NumPy aligns trailing dimensions from the right. Matching (N,) against (N, M) fails unless N == M, and if N == M it subtracts column-wise by accident!',
        goodSnippet: `# Retain (N, 1) shape for clean broadcasting:
row_means = matrix.mean(axis=1, keepdims=True)  # Shape (N, 1)
centered = matrix - row_means                   # Clean, safe subtraction`,
        goodExplanation: 'keepdims=True ensures the reduced dimension stays size 1, making column-wise broadcasting bulletproof.',
        perfImpact: 'Prevents ValueError exceptions and silent mathematical bugs.'
      },
      {
        title: 'Integer Overflow in np.sum with Small Dtypes',
        badSnippet: `# Summing int8 or int16 numbers:
small_ints = np.array([100, 100, 100], dtype=np.int8)
total = small_ints.sum()  # Overflows! int8 max is 127 -> returns -156`,
        badExplanation: 'np.sum preserves integer dtypes by default on some platforms, causing silent wrap-around overflow.',
        goodSnippet: `# Explicitly specify accumulator dtype:
total = small_ints.sum(dtype=np.int64)  # Returns 300 cleanly`,
        goodExplanation: 'Passing dtype=np.int64 or converting to float prevents numerical overflow in large reductions.',
        perfImpact: 'Guarantees numerical integrity in large dataset aggregations.'
      }
    ],
    apiCheatSheet: [
      {
        name: 'np.mean',
        category: 'Statistics',
        signature: 'np.mean(a, axis=None, dtype=None, keepdims=False)',
        summary: 'Compute the arithmetic mean along the specified axis.',
        parameters: [
          { name: 'a', type: 'array_like', desc: 'Array containing numbers whose mean is desired.' },
          { name: 'axis', type: 'None | int | tuple[int, ...]', desc: 'Axis or axes along which the means are computed.' },
          { name: 'keepdims', type: 'bool, optional', desc: 'If True, reduced axes are left with dimension size 1.' }
        ],
        returns: 'Mean of array elements along the specified axis.',
        exampleSnippet: `# Row means retaining (N, 1) shape
means = np.mean(scores, axis=1, keepdims=True)`
      },
      {
        name: 'np.sum',
        category: 'Reduction',
        signature: 'np.sum(a, axis=None, dtype=None, keepdims=False)',
        summary: 'Sum of array elements over a given axis.',
        parameters: [
          { name: 'a', type: 'array_like', desc: 'Elements to sum.' },
          { name: 'axis', type: 'None | int | tuple[int, ...]', desc: 'Axis along which sum is computed.' },
          { name: 'keepdims', type: 'bool, optional', desc: 'Retain reduced dimension as size 1.' }
        ],
        returns: 'Sum of elements along the specified axis.',
        exampleSnippet: `# Column totals
totals = np.sum(matrix, axis=0)`
      },
      {
        name: 'np.std',
        category: 'Statistics',
        signature: 'np.std(a, axis=None, ddof=0, keepdims=False)',
        summary: 'Compute the standard deviation along the specified axis.',
        parameters: [
          { name: 'a', type: 'array_like', desc: 'Input array.' },
          { name: 'axis', type: 'None | int | tuple[int, ...]', desc: 'Axis along which standard deviation is computed.' },
          { name: 'ddof', type: 'int, optional', desc: 'Delta Degrees of Freedom (ddof=0 for population, 1 for sample).' }
        ],
        returns: 'Standard deviation of array elements.',
        exampleSnippet: `# Exam score standard deviations
spread = np.std(scores, axis=0)`
      },
      {
        name: 'np.argmax',
        category: 'Search & Extremes',
        signature: 'np.argmax(a, axis=None, keepdims=False)',
        summary: 'Returns the indices of the maximum values along an axis.',
        parameters: [
          { name: 'a', type: 'array_like', desc: 'Input array.' },
          { name: 'axis', type: 'None | int, optional', desc: 'By default, index is into flattened array, otherwise along axis.' }
        ],
        returns: 'Array of indices or scalar integer.',
        exampleSnippet: `# Find index of highest scoring student
top_idx = int(np.argmax(student_averages))`
      },
      {
        name: 'np.argmin',
        category: 'Search & Extremes',
        signature: 'np.argmin(a, axis=None, keepdims=False)',
        summary: 'Returns the indices of the minimum values along an axis.',
        parameters: [
          { name: 'a', type: 'array_like', desc: 'Input array.' },
          { name: 'axis', type: 'None | int, optional', desc: 'By default, index is into flattened array, otherwise along axis.' }
        ],
        returns: 'Array of indices or scalar integer.',
        exampleSnippet: `# Find index of hardest exam
hardest_idx = int(np.argmin(exam_means))`
      },
      {
        name: 'np.cumsum',
        category: 'Cumulative',
        signature: 'np.cumsum(a, axis=None, dtype=None)',
        summary: 'Return the cumulative sum of the elements along a given axis.',
        parameters: [
          { name: 'a', type: 'array_like', desc: 'Input array.' },
          { name: 'axis', type: 'None | int, optional', desc: 'Axis along which cumulative sum is computed.' }
        ],
        returns: 'Array with running cumulative totals.',
        exampleSnippet: `# Cumulative cash balance over time
balance = np.cumsum(daily_cashflows)`
      }
    ],
    interactiveWidgetType: 'numpy-strides'
  },
  challenges: [
    {
      id: 'd5-c1',
      dayId: 5,
      partId: 5,
      title: 'Student Scorecard Aggregator',
      slug: 'student-scorecard-aggregator',
      difficulty: 'Beginner',
      category: 'Aggregations & Statistics',
      summary: 'Compute student averages, exam difficulty, find top performers, and zero-center grades across multi-dimensional axes without loops.',
      mentalModel5s: 'Collapse columns across rows (axis=1) for student GPAs; collapse rows down columns (axis=0) for exam averages. Use keepdims=True to broadcast centered scores.',
      visualAnalogy: 'Like scanning across a gradebook spreadsheet row by row with a ruler to calculate student report cards, then scanning down column by column to grade the teachers.',
      pitfalls: [
        'Confusing axis=0 (exam means down columns) with axis=1 (student averages across rows).',
        'Forgetting keepdims=True when computing mean_centered_scores, causing a broadcasting shape mismatch.',
        'Using Python for-loops to iterate over rows or columns.'
      ],
      progressiveHints: [
        'Tier 1 (Axes): Use np.mean(scores, axis=1) for student averages and np.mean(scores, axis=0) for exam means.',
        'Tier 2 (Extremes): np.argmax and np.argmin locate the index of the highest and lowest values.',
        'Tier 3 (Centering): To center scores, compute student_means_2d = np.mean(scores, axis=1, keepdims=True) and return scores - student_means_2d.'
      ],
      deepInternals: {
        title: 'SIMD Reductions & Cache Locality',
        content: 'When summing along axis=1 (the contiguous row dimension in C-order), modern CPUs load 8 floats per 64-byte cache line, enabling AVX-256/512 vector registers to accumulate row sums at maximum memory bandwidth.',
        keyRule: 'Always use keepdims=True on reductions when the result must be broadcast back against the original array.'
      },
      instructions: `Given a 2D NumPy array \`scores\` of shape \`(N, M)\` representing exam scores for $N$ students across $M$ exams, compute summary analytics:

**Requirements:**
1. Compute \`student_averages\`: 1D array of shape \`(N,)\` with each student's average across all exams (\`axis=1\`).
2. Compute \`exam_means\`: 1D array of shape \`(M,)\` with the class average for each exam (\`axis=0\`).
3. Compute \`exam_stds\`: 1D array of shape \`(M,)\` with the standard deviation for each exam (\`axis=0\`).
4. Identify \`top_student_idx\`: integer index of the student with the highest average score (\`np.argmax\`).
5. Identify \`hardest_exam_idx\`: integer index of the exam with the lowest average score (\`np.argmin\`).
6. Compute \`mean_centered_scores\`: 2D array of shape \`(N, M)\` where each student's personal mean is subtracted from their scores (use \`keepdims=True\` for clean broadcasting).
7. Return all 6 outputs in a dictionary. NO Python loops allowed!`,
      hints: [
        'Use `np.mean(scores, axis=1)` to average across exams for each student.',
        'Use `np.mean(scores, axis=0)` and `np.std(scores, axis=0)` for exam statistics.',
        'Use `int(np.argmax(student_averages))` to retrieve the top student index.',
        'Use `scores - np.mean(scores, axis=1, keepdims=True)` to center scores around each student average.'
      ],
      starterCode: `import numpy as np

def aggregate_scorecard(scores: np.ndarray) -> dict:
    """
    Compute comprehensive gradebook analytics across students and exams without Python loops.
    
    Args:
        scores: 2D numpy array of shape (N, M) representing N students and M exams.
        
    Returns:
        dict with keys:
            - 'student_averages': 1D float array of shape (N,)
            - 'exam_means': 1D float array of shape (M,)
            - 'exam_stds': 1D float array of shape (M,)
            - 'top_student_idx': int index of student with highest average
            - 'hardest_exam_idx': int index of exam with lowest mean
            - 'mean_centered_scores': 2D float array of shape (N, M)
    """
    # TODO: Implement vectorized aggregations along axis=0 and axis=1
    pass
`,
      solutionCode: `import numpy as np

def aggregate_scorecard(scores: np.ndarray) -> dict:
    scores = np.asarray(scores, dtype=np.float64)
    if scores.ndim != 2:
        raise ValueError(f"Expected 2D array of scores, got shape {scores.shape}")
    
    # axis=1 collapses columns horizontally across each row -> shape (N,)
    student_averages = np.mean(scores, axis=1)
    
    # axis=0 collapses rows vertically down each column -> shape (M,)
    exam_means = np.mean(scores, axis=0)
    exam_stds = np.std(scores, axis=0)
    
    # Find indices of extreme values
    top_student_idx = int(np.argmax(student_averages))
    hardest_exam_idx = int(np.argmin(exam_means))
    
    # keepdims=True retains shape (N, 1) to enable column-wise broadcasting across (N, M)
    student_means_2d = np.mean(scores, axis=1, keepdims=True)
    mean_centered_scores = scores - student_means_2d
    
    return {
        "student_averages": student_averages,
        "exam_means": exam_means,
        "exam_stds": exam_stds,
        "top_student_idx": top_student_idx,
        "hardest_exam_idx": hardest_exam_idx,
        "mean_centered_scores": mean_centered_scores,
    }
`,
      testCases: [
        {
          id: 't1',
          name: 'Small 3x4 Gradebook Matrix',
          inputDescription: 'scores = [[80,90,100,70],[60,65,70,75],[90,95,85,90]]',
          expectedOutput: 'top_student_idx=2, hardest_exam_idx=0'
        },
        {
          id: 't2',
          name: 'Zero-Centered Score Verification',
          inputDescription: 'Check that row averages of mean_centered_scores are identically 0.0',
          expectedOutput: 'All row means == 0.0'
        },
        {
          id: 't3',
          name: 'Large 1,000x50 Benchmark',
          inputDescription: '1,000 students across 50 exams',
          expectedOutput: 'Vectorized execution under 5ms'
        }
      ],
      benchmarkTargetMs: 0.8,
      memoryTargetMb: 0.5,
      conceptPrimer: {
        title: 'Multi-Axis Aggregations & Dimension Collapsing',
        subtitle: 'From nested Python loops to single-cycle vectorized reductions',
        overview: 'Aggregating along axes is the cornerstone of array computation. Choosing axis=0 aggregates over rows (vertical reduction down columns), while axis=1 aggregates over columns (horizontal reduction across rows).',
        mentalModel5s: 'The axis you name is the dimension that gets squashed down into a single summary number.',
        visualAnalogy: 'A hydraulic press squashing a 2D sheet into a 1D strip either from top to bottom (axis=0) or from right to left (axis=1).',
        pitfalls: [
          'Confusing axis 0 and 1.',
          'Omitting keepdims=True when performing broadcast subtractions.'
        ],
        progressiveHints: [
          'Tier 1: np.mean(scores, axis=1)',
          'Tier 2: np.mean(scores, axis=0)',
          'Tier 3: np.argmax and np.argmin',
          'Tier 4: scores - np.mean(scores, axis=1, keepdims=True)'
        ],
        deepInternals: {
          title: 'Contiguous Memory Reductions',
          content: 'Summing across columns along axis=1 steps through contiguous C-memory with stride 1, hitting L1 cache lines with 100% efficiency.',
          keyRule: 'Always preserve rank with keepdims=True when broadcasting reduction results.'
        },
        mathFormulas: [
          {
            title: 'Row-wise Arithmetic Mean (Student Average)',
            latex: '\\mu_i = \\frac{1}{M} \\sum_{j=0}^{M-1} X_{i, j}, \\quad i = 0, \\dots, N-1',
            explanation: 'Collapses columns across axis 1, yielding a vector of N individual student averages.'
          },
          {
            title: 'Column-wise Arithmetic Mean (Exam Difficulty)',
            latex: '\\bar{X}_j = \\frac{1}{N} \\sum_{i=0}^{N-1} X_{i, j}, \\quad j = 0, \\dots, M-1',
            explanation: 'Collapses rows along axis 0, yielding a vector of M exam averages.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Slow Python nested loops
def naive_scorecard(scores):
    N, M = scores.shape
    student_avgs = []
    for i in range(N):
        total = 0.0
        for j in range(M):
            total += scores[i, j]
        student_avgs.append(total / M)
    return np.array(student_avgs)`,
          naiveExplanation: 'Incurs dynamic Python bytecode overhead on every single cell access (N x M iterations).',
          idiomaticCode: `# Idiomatic Vectorized Aggregation
def idiomatic_scorecard(scores):
    return scores.mean(axis=1)`,
          idiomaticExplanation: 'Single call dispatched to optimized C loop utilizing SIMD registers (50x faster).',
          speedupText: '52x faster'
        },
        memoryLayout: {
          title: 'Memory Stride During Axis Reductions',
          content: 'In standard row-major (C-order) arrays, stepping along axis 1 accesses consecutive memory addresses (stride = 8 bytes), while stepping along axis 0 jumps by row size (stride = M * 8 bytes).',
          diagramAscii: `Row-Major Memory Buffer:
[ (0,0), (0,1), (0,2) ] [ (1,0), (1,1), (1,2) ]
<-- axis=1 stride 8B --> <-- next row jump -->`,
          keyRule: 'Row reductions enjoy optimal CPU spatial locality in C-order arrays.'
        },
        keyTakeaways: [
          'axis=0 collapses rows vertically down each column.',
          'axis=1 collapses columns horizontally across each row.',
          'np.argmax and np.argmin return integer index locations of extremes.',
          'keepdims=True keeps collapsed dimensions as size 1 for effortless broadcasting.'
        ]
      },
      sampleDataFrame: {
        name: 'Gradebook Matrix (3 Students x 4 Exams)',
        columns: ['Student_ID', 'Exam_0', 'Exam_1', 'Exam_2', 'Exam_3', 'Student_Avg'],
        dtypes: { Student_ID: 'int64', Exam_0: 'float64', Exam_1: 'float64', Exam_2: 'float64', Exam_3: 'float64', Student_Avg: 'float64' },
        rows: [
          { Student_ID: 0, Exam_0: 80.0, Exam_1: 90.0, Exam_2: 100.0, Exam_3: 70.0, Student_Avg: 85.0 },
          { Student_ID: 1, Exam_0: 60.0, Exam_1: 65.0, Exam_2: 70.0, Exam_3: 75.0, Student_Avg: 67.5 },
          { Student_ID: 2, Exam_0: 90.0, Exam_1: 95.0, Exam_2: 85.0, Exam_3: 90.0, Student_Avg: 90.0 }
        ],
        totalRows: 3,
        memoryUsageKb: 0.4
      },
      samplePlot: {
        id: 'p1',
        title: 'Student Performance & Exam Averages',
        type: 'svg',
        description: 'Visual breakdown of student GPAs vs exam class difficulty',
        svgContent: `<svg viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
          <rect width="600" height="300" fill="#0f172a" rx="8"/>
          <line x1="60" y1="240" x2="550" y2="240" stroke="#334155" stroke-width="1.5"/>
          <line x1="60" y1="40" x2="60" y2="240" stroke="#334155" stroke-width="1.5"/>
          <!-- Grid lines -->
          <line x1="60" y1="190" x2="550" y2="190" stroke="#1e293b" stroke-dasharray="4"/>
          <line x1="60" y1="140" x2="550" y2="140" stroke="#1e293b" stroke-dasharray="4"/>
          <line x1="60" y1="90" x2="550" y2="90" stroke="#1e293b" stroke-dasharray="4"/>
          <!-- Bars for Student Averages -->
          <rect x="100" y="70" width="50" height="170" fill="#3b82f6" rx="4"/>
          <text x="125" y="60" fill="#93c5fd" font-size="12" text-anchor="middle" font-weight="bold">85.0</text>
          <text x="125" y="260" fill="#94a3b8" font-size="11" text-anchor="middle">Student 0</text>
          <rect x="200" y="105" width="50" height="135" fill="#64748b" rx="4"/>
          <text x="225" y="95" fill="#cbd5e1" font-size="12" text-anchor="middle" font-weight="bold">67.5</text>
          <text x="225" y="260" fill="#94a3b8" font-size="11" text-anchor="middle">Student 1</text>
          <rect x="300" y="60" width="50" height="180" fill="#22c55e" rx="4"/>
          <text x="325" y="50" fill="#86efac" font-size="12" text-anchor="middle" font-weight="bold">90.0 ★</text>
          <text x="325" y="260" fill="#86efac" font-size="11" text-anchor="middle">Student 2 (Top)</text>
          <!-- Exam difficulty indicator -->
          <line x1="420" y1="87" x2="520" y2="87" stroke="#f59e0b" stroke-width="3"/>
          <text x="470" y="75" fill="#f59e0b" font-size="12" text-anchor="middle" font-weight="bold">Exam 2 Avg: 85.0</text>
          <line x1="420" y1="104" x2="520" y2="104" stroke="#ef4444" stroke-width="3"/>
          <text x="470" y="125" fill="#ef4444" font-size="12" text-anchor="middle" font-weight="bold">Exam 0 Avg: 76.7 (Hardest)</text>
          <text x="30" y="35" fill="#94a3b8" font-size="11">Grade (%)</text>
        </svg>`
      },
      expectedTensors: [
        { name: 'scores', shape: '(3, 4)', dtype: 'float64' },
        { name: 'student_averages', shape: '(3,)', dtype: 'float64' },
        { name: 'exam_means', shape: '(4,)', dtype: 'float64' }
      ]
    },
    {
      id: 'd5-c2',
      dayId: 5,
      partId: 5,
      title: 'Cumulative Cashflow & Outlier Flagging',
      slug: 'cumulative-cashflow-outlier-flagging',
      difficulty: 'Intermediate',
      category: 'Cumulative Operations & Statistics',
      summary: 'Track running treasury balances with cumsum and detect extreme transaction outliers using standard deviation thresholds without loops.',
      mentalModel5s: 'np.cumsum accumulates running balance across time. Flag transactions whose absolute distance from the mean exceeds k * std.',
      visualAnalogy: 'Like watching a bank account balance line chart rise and fall with every paycheck and bill, while an automated fraud detector flags unexpected giant spikes.',
      pitfalls: [
        'Iterating through transactions with a Python loop to maintain a running balance accumulator.',
        'Using np.sum instead of np.cumsum for running balances.',
        'Forgetting np.abs when measuring deviation from the mean, missing negative outlier withdrawals.'
      ],
      progressiveHints: [
        'Tier 1 (Cumulative): np.cumsum(transactions) computes the running balance at every step.',
        'Tier 2 (Extremes): Use np.argmin and np.argmax on the running balance to find peak and trough days.',
        'Tier 3 (Outliers): An outlier satisfies np.abs(transactions - mean) > threshold_std * std.',
        'Tier 4 (Indices): Use np.flatnonzero(outlier_mask) to extract integer indices.'
      ],
      deepInternals: {
        title: 'Prefix Sum Parallelism & SIMD',
        content: 'NumPy cumsum implements an optimized prefix sum algorithm that computes cumulative totals in cache-coherent linear sweeps, executing orders of magnitude faster than Python loops.',
        keyRule: 'Use np.flatnonzero(mask) to extract 1D indices directly and quickly.'
      },
      instructions: `A quantitative hedge fund tracks a sequence of daily cashflow events (deposits as positive values, withdrawals as negative values). Build a vectorized analytics function:

**Requirements:**
1. Compute \`running_balance\`: 1D array of cumulative balances over time using \`np.cumsum\`.
2. Compute \`net_cashflow\`: float total net cash moved (\`np.sum\`).
3. Compute \`mean_transaction\`: float mean of transactions (\`np.mean\`).
4. Compute \`std_transaction\`: float standard deviation of transactions (\`np.std\`).
5. Identify \`min_balance_idx\`: integer index where \`running_balance\` dipped to its lowest point (\`np.argmin\`).
6. Identify \`max_balance_idx\`: integer index where \`running_balance\` reached its peak (\`np.argmax\`).
7. Compute \`outlier_mask\`: 1D boolean array where \`True\` flags transactions where $|\\text{tx} - \\text{mean}| > \\text{threshold\\_std} \\times \\text{std}$.
8. Compute \`outlier_indices\`: 1D integer array containing the index locations of outliers (\`np.flatnonzero\`).
9. Return all metrics in a dictionary. NO Python loops allowed!`,
      hints: [
        'Compute running balance via `np.cumsum(transactions)`.',
        'Use `np.argmin(running_balance)` and `np.argmax(running_balance)` for lowest and peak balance steps.',
        'Flag outliers via `np.abs(transactions - mean_val) > threshold_std * std_val`.',
        'Extract outlier index locations using `np.flatnonzero(outlier_mask)`.'
      ],
      starterCode: `import numpy as np

def analyze_cashflow(transactions: np.ndarray, threshold_std: float = 2.0) -> dict:
    """
    Analyze cumulative cashflow balances and detect statistical outlier transactions.
    
    Args:
        transactions: 1D numpy array of numerical cashflow amounts.
        threshold_std: Multiplier for standard deviation outlier boundary (default 2.0).
        
    Returns:
        dict with keys:
            - 'running_balance': 1D float array of cumulative balances
            - 'net_cashflow': float total net cashflow
            - 'mean_transaction': float mean of transactions
            - 'std_transaction': float standard deviation of transactions
            - 'min_balance_idx': int index where balance was lowest
            - 'max_balance_idx': int index where balance was highest
            - 'outlier_mask': 1D bool array flagging outlier transactions
            - 'outlier_indices': 1D int array containing indices of outliers
    """
    # TODO: Implement cumulative and statistical calculations without Python loops
    pass
`,
      solutionCode: `import numpy as np

def analyze_cashflow(transactions: np.ndarray, threshold_std: float = 2.0) -> dict:
    tx = np.asarray(transactions, dtype=np.float64)
    if tx.ndim != 1:
        raise ValueError(f"Expected 1D transaction array, got shape {tx.shape}")
    if len(tx) == 0:
        raise ValueError("Transaction array cannot be empty")
        
    running_balance = np.cumsum(tx)
    net_cashflow = float(np.sum(tx))
    mean_val = float(np.mean(tx))
    std_val = float(np.std(tx))
    
    min_idx = int(np.argmin(running_balance))
    max_idx = int(np.argmax(running_balance))
    
    # Statistical outlier mask: transactions further than threshold_std * std from the mean
    deviations = np.abs(tx - mean_val)
    cutoff = threshold_std * std_val
    outlier_mask = deviations > cutoff
    outlier_indices = np.flatnonzero(outlier_mask)
    
    return {
        "running_balance": running_balance,
        "net_cashflow": net_cashflow,
        "mean_transaction": mean_val,
        "std_transaction": std_val,
        "min_balance_idx": min_idx,
        "max_balance_idx": max_idx,
        "outlier_mask": outlier_mask,
        "outlier_indices": outlier_indices,
    }
`,
      testCases: [
        {
          id: 't1',
          name: 'Known 5-Transaction Sequence',
          inputDescription: 'tx = [100, -50, 200, -300, 400]',
          expectedOutput: 'running_balance=[100, 50, 250, -50, 350], min_idx=3, max_idx=4'
        },
        {
          id: 't2',
          name: 'Injected 3-Sigma Outlier Spikes',
          inputDescription: '100 transactions with spikes at index 10 and 50',
          expectedOutput: 'outlier_indices contains [10, 50]'
        },
        {
          id: 't3',
          name: 'Large-scale 50,000 Event Benchmark',
          inputDescription: '50,000 high-frequency transactions',
          expectedOutput: 'Execution time < 20ms'
        }
      ],
      benchmarkTargetMs: 0.9,
      memoryTargetMb: 0.8,
      conceptPrimer: {
        title: 'Cumulative Operations & 2-Sigma Outlier Detection',
        subtitle: 'Tracking temporal accumulators and statistical anomalies without iteration',
        overview: 'Cumulative sums compute the rolling integral of a discrete signal. Statistical outlier flagging uses Z-score deviation from the sample mean to isolate extreme events.',
        mentalModel5s: 'cumsum turns deltas into balances; distance from mean > k*std flags anomalies.',
        visualAnalogy: 'A water reservoir meter recording hourly inflow and outflow, alerting engineers when an abnormal surge enters the system.',
        pitfalls: [
          'Using a Python for loop with an accumulator variable.',
          'Missing negative outliers by forgetting the absolute value.'
        ],
        progressiveHints: [
          'Tier 1: np.cumsum(transactions)',
          'Tier 2: net_cashflow = np.sum(transactions)',
          'Tier 3: np.argmin and np.argmax on running_balance',
          'Tier 4: np.abs(tx - mean) > threshold * std'
        ],
        deepInternals: {
          title: 'Z-Score Distance Calculation',
          content: 'By computing (tx - mean) / std > threshold in vector registers, NumPy checks 8 transactions per clock cycle with zero heap allocations.',
          keyRule: 'Vectorized absolute difference captures both positive surges and catastrophic negative drops.'
        },
        mathFormulas: [
          {
            title: 'Cumulative Balance Formula',
            latex: 'B_t = \\sum_{k=0}^t T_k, \\quad t = 0, \\dots, N-1',
            explanation: 'The balance at time t is the cumulative sum of all transactions up to t.'
          },
          {
            title: 'Statistical Outlier Boundary',
            latex: '|T_k - \\mu| > k \\cdot \\sigma',
            explanation: 'Flags any transaction whose deviation from the mean exceeds k standard deviations.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Slow Python loop with running balance
def naive_cashflow(tx):
    balance = []
    current = 0.0
    for x in tx:
        current += x
        balance.append(current)
    return np.array(balance)`,
          naiveExplanation: 'Allocates and appends Python list nodes, triggering repeated dynamic resizing.',
          idiomaticCode: `# Idiomatic NumPy cumsum
def idiomatic_cashflow(tx):
    return np.cumsum(tx)`,
          idiomaticExplanation: 'Single vectorized operation in contiguous memory with zero allocations.',
          speedupText: '68x faster'
        },
        memoryLayout: {
          title: 'Sequential Memory Access in cumsum',
          content: 'NumPy streams through the 1D transaction array sequentially, achieving 100% L1 cache line hits.',
          diagramAscii: `Transactions: [ +100 ] [ -50 ] [ +200 ] [ -300 ]
                    |       |        |        |
Cumsum Buffer: [  100 ] [  50 ] [  250 ] [  -50 ]`,
          keyRule: '1D sequential arrays maximize hardware memory prefetching.'
        },
        keyTakeaways: [
          'np.cumsum computes running cumulative totals at hardware speed.',
          'np.argmin and np.argmax identify where balance extremes occurred.',
          'Standard deviation boundaries mean ± k*std identify anomalies without training complex models.'
        ]
      },
      sampleDataFrame: {
        name: 'Transaction Ledger Sample',
        columns: ['Step', 'Transaction_Amount', 'Running_Balance', 'Is_Outlier'],
        dtypes: { Step: 'int64', Transaction_Amount: 'float64', Running_Balance: 'float64', Is_Outlier: 'boolean' },
        rows: [
          { Step: 0, Transaction_Amount: 100.0, Running_Balance: 100.0, Is_Outlier: false },
          { Step: 1, Transaction_Amount: -50.0, Running_Balance: 50.0, Is_Outlier: false },
          { Step: 2, Transaction_Amount: 200.0, Running_Balance: 250.0, Is_Outlier: false },
          { Step: 3, Transaction_Amount: -300.0, Running_Balance: -50.0, Is_Outlier: false },
          { Step: 4, Transaction_Amount: 400.0, Running_Balance: 350.0, Is_Outlier: true }
        ],
        totalRows: 5,
        memoryUsageKb: 0.5
      },
      samplePlot: {
        id: 'p2',
        title: 'Running Cash Balance & Anomaly Spikes',
        type: 'svg',
        description: 'Cumulative balance curve with peak and trough annotations',
        svgContent: `<svg viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
          <rect width="600" height="300" fill="#0f172a" rx="8"/>
          <line x1="60" y1="200" x2="550" y2="200" stroke="#334155" stroke-width="1.5"/>
          <line x1="60" y1="40" x2="60" y2="260" stroke="#334155" stroke-width="1.5"/>
          <!-- Zero Balance reference line -->
          <line x1="60" y1="180" x2="550" y2="180" stroke="#475569" stroke-dasharray="4"/>
          <text x="35" y="185" fill="#94a3b8" font-size="11">$0</text>
          <!-- Balance path -->
          <polyline points="60,140 140,160 240,80 340,210 440,50 540,60" fill="none" stroke="#38bdf8" stroke-width="3"/>
          <!-- Min balance point -->
          <circle cx="340" cy="210" r="6" fill="#ef4444"/>
          <text x="340" y="235" fill="#ef4444" font-size="11" text-anchor="middle" font-weight="bold">Trough (-$50)</text>
          <!-- Max balance point -->
          <circle cx="440" cy="50" r="6" fill="#22c55e"/>
          <text x="440" y="38" fill="#22c55e" font-size="11" text-anchor="middle" font-weight="bold">Peak ($350)</text>
          <text x="50" y="25" fill="#94a3b8" font-size="11">Balance ($)</text>
          <text x="510" y="225" fill="#94a3b8" font-size="11">Time Step</text>
        </svg>`
      },
      expectedTensors: [
        { name: 'transactions', shape: '(5,)', dtype: 'float64' },
        { name: 'running_balance', shape: '(5,)', dtype: 'float64' },
        { name: 'outlier_mask', shape: '(5,)', dtype: 'bool' }
      ]
    }
  ]
};

export const PART05_TRACK = DAY05_TRACK;
export const DAY05_AGGREGATIONS_AXES_TRACK = DAY05_TRACK;
export const PART05_AGGREGATIONS_AXES_TRACK = DAY05_TRACK;
export default DAY05_TRACK;
