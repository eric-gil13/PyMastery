import type { DayTrack } from '../../types';

export const DAY06_TRACK: DayTrack = {
  partNumber: 6,
  partId: 6,
  dayNumber: 6,
  id: 6,
  title: 'Part 6: Boolean Masking, Filtering & Conditional Logic',
  subtitle: 'Master element-wise comparison masks, bitwise combination (&, |, ~), arr[mask] filtering, and np.where branching',
  description: 'Harness the power of boolean indexing in NumPy. Learn why standard Python "and/or" fails on arrays, master parentheses and bitwise operators, filter multi-dimensional data like a sieve, and execute blazing fast conditional replacement using np.where.',
  iconName: 'Filter',
  badge: 'Part 6 • Boolean Masking',
  libraryMechanics: {
    libraryName: 'NumPy Boolean Masking, Filtering & Conditional Branching',
    tagline: 'Sieve and transform data without loops: element-wise predicates, bitwise logic, and instant vectorized branching.',
    overview: `### 🔍 The Stencil Mental Model
In standard Python, filtering a list requires looping over each element and checking an \`if\` condition:
\`\`\`python
# The slow Python loop way:
passing = [x for x in scores if x >= 70]
\`\`\`

In NumPy, you filter data with a **Boolean Mask**.
Think of a boolean mask like a physical cardboard **stencil** placed over your array:
1. **The Predicate:** Evaluating \`scores >= 70\` creates a boolean array of \`True\` and \`False\` flags of identical shape.
2. **The Stencil:** Passing the mask into brackets \`scores[scores >= 70]\` lets only numbers aligned with \`True\` holes pass through.
3. **The Speedup:** Evaluated in pre-compiled C, filtering 10 million rows takes milliseconds instead of seconds.

### ⚠️ The Python \`and\` / \`or\` Trap vs Bitwise \`&\` / \`|\`
If you write \`arr > 50 and arr < 80\`, Python crashes with:
> \`ValueError: The truth value of an array with more than one element is ambiguous. Use a.any() or a.all()\`

**Why?**
Python's \`and\` evaluates whether the *entire array object* is truthy. But an array contains both \`True\` and \`False\` entries!
In NumPy, you must use **bitwise operators** which operate element-wise:
- \`&\` for element-wise **AND**
- \`|\` for element-wise **OR**
- \`~\` for element-wise **NOT** (inversion)

**The Parentheses Rule:**
Because \`&\` and \`|\` have higher operator precedence than \`<\` or \`>\`, you **must** wrap each comparison in parentheses:
\`\`\`python
# CORRECT:
mask = (arr > 50) & (arr < 80)
# WRONG (Evaluates 50 & arr first!):
mask = arr > 50 & arr < 80
\`\`\`

### ⚡ Vectorized If-Else: \`np.where\`
Instead of filtering elements out, what if you want to conditionally transform them?
\`np.where(condition, if_true, if_false)\` is the vectorized ternary operator (\`cond ? x : y\`):
\`\`\`python
# Replace negative readings with 0, leaving positive numbers untouched:
cleaned = np.where(readings < 0, 0, readings)
\`\`\``,
    whyItExists: `Boolean masking replaces procedural filtering loops with vectorized SIMD memory selection.
- Zero Interpreter Overhead: Millions of comparison predicates evaluate in single CPU clock cycles.
- Declarative Expressiveness: Multi-criteria filtering expressions read like clean mathematical predicates.
- Fast Mask Aggregation: np.any, np.all, and np.sum(mask) summarize truth values instantly without search loops.`,
    coreAnatomy: {
      objectName: 'Boolean Mask & Indexing',
      description: 'A boolean ndarray of dtype bool that acts as a selector mask to filter, slice, count, or conditionally update elements of another array.',
      fields: [
        {
          name: 'mask',
          type: 'np.ndarray[bool]',
          role: 'Boolean array with matching or broadcast-compatible shape indicating selected elements.'
        },
        {
          name: 'arr[mask]',
          type: 'np.ndarray',
          role: 'Extracts a 1D array of only those elements where mask evaluates to True.'
        },
        {
          name: 'np.where(cond, x, y)',
          type: 'np.ndarray',
          role: 'Returns an array with elements chosen from x where cond is True, and y where cond is False.'
        },
        {
          name: 'np.count_nonzero(mask)',
          type: 'int',
          role: 'Counts the number of True occurrences in the boolean mask.'
        }
      ],
      memoryDiagramAscii: `+-------------------------------------------------------------------------------+
|                       The Stencil Model of Boolean Masking                    |
+-------------------------------------------------------------------------------+
Original Array:     [  85  |  42  |  90  |  68  |  95  ]
                           |      |      |      |
Comparison (> 70):  [ True | False| True | False| True ]   <-- The Stencil (Mask)
                           |             |             |
Filtered (arr[m]):  [  85  |             |  90  |      |  95  ]  ==> [ 85, 90, 95 ]

np.where(m, 'Pass', 'Fail'):
                    [ Pass | Fail | Pass | Fail | Pass ]   <-- Conditional Replacement`
    },
    chapters: [
      {
        id: 'ch1-predicates-and-masks',
        title: 'Building Boolean Masks with Comparison Predicates',
        icon: 'CheckSquare',
        summary: 'How vectorized comparison operators return boolean arrays without loops.',
        markdownContent: `### Vectorized Comparisons
Applying standard comparison operators (\`>\`, \`<\`, \`>=\`, \`<=\`, \`==\`, \`!=\`) to a NumPy array returns a boolean array of the identical shape:
\`\`\`python
arr = np.array([10, 25, 50, 75, 100])
mask = arr > 40
# array([False, False,  True,  True,  True])
\`\`\`

### Counting Matches with \`sum\`
In Python and NumPy, boolean \`True\` is treated numerically as \`1\` and \`False\` as \`0\`.
Therefore:
* \`np.sum(mask)\` counts how many elements matched the condition!
* \`np.mean(mask)\` computes the percentage (ratio from 0.0 to 1.0) of elements that matched!`,
        codeSnippets: [
          {
            id: 'snip-mask-creation',
            title: 'Creating and Counting Masks',
            code: `import numpy as np

temps = np.array([18.5, 22.0, 31.5, 27.0, 35.2, 19.8])
hot_days = temps > 25.0

print("Temps:", temps)
print("Hot Days Mask:", hot_days)
print("Number of Hot Days:", np.sum(hot_days))
print(f"Percentage Hot Days: {np.mean(hot_days) * 100:.1f}%")`,
            expectedOutput: `Temps: [18.5 22.  31.5 27.  35.2 19.8]
Hot Days Mask: [False False  True  True  True False]
Number of Hot Days: 3
Percentage Hot Days: 50.0%`,
            explanation: 'np.sum counts True values; np.mean computes the proportion of elements satisfying the predicate.'
          }
        ]
      },
      {
        id: 'ch2-combining-conditions',
        title: 'Combining Conditions with Bitwise Operators',
        icon: 'GitMerge',
        summary: 'Why Python and/or fail on arrays, and how to combine predicates using &, |, ~, and parentheses.',
        markdownContent: `### Bitwise Operators: \`&\`, \`|\`, \`~\`
To combine multiple criteria:
* **AND (\`&\`):** Both conditions must be True: \`(arr >= 10) & (arr <= 50)\`
* **OR (\`|\`):** At least one condition must be True: \`(arr < 0) | (arr > 100)\`
* **NOT (\`~\`):** Inverts True to False: \`~mask\`

### Always Wrap in Parentheses!
Because bitwise \`&\` has higher precedence than comparison \`>\`:
\`arr > 10 & arr < 50\` evaluates \`10 & arr\` first and crashes!
Always write: \`(arr > 10) & (arr < 50)\`.`,
        codeSnippets: [
          {
            id: 'snip-bitwise-demo',
            title: 'Combining Multiple Conditions',
            code: `import numpy as np

scores = np.array([45, 72, 88, 95, 60, 82])

# Find students scoring between 70 and 90 (inclusive)
good_scores_mask = (scores >= 70) & (scores <= 90)
print("Between 70 and 90 mask:", good_scores_mask)
print("Scores between 70 and 90:", scores[good_scores_mask])

# Outlier scores (below 50 or above 90)
outliers_mask = (scores < 50) | (scores > 90)
print("Outliers:", scores[outliers_mask])`,
            expectedOutput: `Between 70 and 90 mask: [False  True  True False False  True]
Scores between 70 and 90: [72 88 82]
Outliers: [45 95]`,
            explanation: '& combines conditions element-wise; arr[mask] sifts the matching numbers.'
          }
        ]
      },
      {
        id: 'ch3-filtering-and-slicing',
        title: 'Filtering Subsets & Fast Truth Checks',
        icon: 'Sliders',
        summary: 'Extract filtered arrays with arr[mask] and test global states with np.any and np.all.',
        markdownContent: `### Filtering 2D Tables
When filtering a 2D matrix (e.g. server telemetry or customer records) using a 1D mask:
\`\`\`python
# telemetry: shape (N, 5), high_cpu_mask: shape (N,)
problem_servers = telemetry[high_cpu_mask]  # Returns all columns for matching rows
\`\`\`

### Global Truth Checks: \`any\` and \`all\`
* \`np.any(mask)\`: Returns \`True\` if **at least one** element is True.
* \`np.all(mask)\`: Returns \`True\` if **every single** element is True.`,
        codeSnippets: [
          {
            id: 'snip-any-all-demo',
            title: 'Row Filtering and any/all Checks',
            code: `import numpy as np

# Server metrics: [Server_ID, CPU_Percent]
servers = np.array([
    [101, 45.0],
    [102, 92.0],
    [103, 78.0],
    [104, 30.0]
])

overheated = servers[:, 1] > 90.0
print("Any server overheated?", np.any(overheated))
print("All servers normal (<95)?", np.all(servers[:, 1] < 95.0))
print("Overheated server rows:\\n", servers[overheated])`,
            expectedOutput: `Any server overheated? True
All servers normal (<95)? True
Overheated server rows:
 [[102.  92.]]`,
            explanation: 'np.any and np.all provide instant global boolean assertions without iteration.'
          }
        ]
      },
      {
        id: 'ch4-np-where-branching',
        title: 'Vectorized Branching with np.where',
        icon: 'Zap',
        summary: 'Execute conditional replacements and multi-tier categorization without if-else loops.',
        markdownContent: `### The Vectorized If-Else
\`np.where(condition, x, y)\` evaluates \`condition\` element-wise.
Where \`True\`, it takes values from \`x\`; where \`False\`, it takes values from \`y\`.

### Clipping and Chaining
You can nest \`np.where\` calls to categorize data into multiple tiers:
\`\`\`python
# Grade categorization:
status = np.where(scores >= 90, "A",
         np.where(scores >= 80, "B", "C"))
\`\`\``,
        codeSnippets: [
          {
            id: 'snip-where-demo',
            title: 'Conditional Replacement and Nested np.where',
            code: `import numpy as np

readings = np.array([-5.0, 12.0, 25.0, 110.0, 45.0])

# Clamp readings outside [0, 100] to boundaries
clamped = np.where(readings < 0.0, 0.0, np.where(readings > 100.0, 100.0, readings))
print("Raw Readings:    ", readings)
print("Clamped Readings:", clamped)

# Categorize: 0=Low, 1=Normal, 2=High
categories = np.where(clamped < 20.0, 0, np.where(clamped > 80.0, 2, 1))
print("Categories:      ", categories)`,
            expectedOutput: `Raw Readings:     [ -5.  12.  25. 110.  45.]
Clamped Readings: [  0.  12.  25. 100.  45.]
Categories:       [0 0 1 2 1]`,
            explanation: 'np.where avoids Python if-statements, transforming entire arrays in a single vectorized pass.'
          }
        ]
      }
    ],
    commonTraps: [
      {
        title: 'Using Python and/or Instead of Bitwise &/|',
        badSnippet: `# Using Python logical keyword:
mask = (arr > 10) and (arr < 50)  # CRASH! ValueError: ambiguous truth value`,
        badExplanation: "Python's 'and' expects a single boolean truth value from the entire array object, raising ValueError.",
        goodSnippet: `# Use bitwise operator &:
mask = (arr > 10) & (arr < 50)    # Clean element-wise boolean array`,
        goodExplanation: 'NumPy overloads &, |, and ~ to perform element-wise logical operations.',
        perfImpact: 'Prevents fatal runtime ValueError crashes.'
      },
      {
        title: 'Forgetting Parentheses Around Bitwise Conditions',
        badSnippet: `# Missing parentheses:
mask = arr > 10 & arr < 50  # Evaluates 10 & arr first!`,
        badExplanation: 'Bitwise & has higher operator precedence than comparison operators (> or <), completely corrupting the logic.',
        goodSnippet: `# Always wrap comparisons in parentheses:
mask = (arr > 10) & (arr < 50)`,
        goodExplanation: 'Parentheses guarantee that comparisons evaluate before bitwise conjunction.',
        perfImpact: 'Eliminates silent logical corruption and TypeError exceptions.'
      },
      {
        title: 'Expecting arr[mask] on 2D Arrays to Retain 2D Shape',
        badSnippet: `# 2D array filtered by 2D mask:
grid = np.array([[1, 2], [3, 4]])
sub = grid[grid > 1]  # Returns 1D array [2, 3, 4], NOT a 2D matrix!`,
        badExplanation: 'Because the number of True values per row can vary, NumPy flattens the result to 1D to prevent ragged arrays.',
        goodSnippet: `# To preserve 2D shape during replacement, use np.where:
masked_grid = np.where(grid > 1, grid, 0)  # Retains (2, 2) shape`,
        goodExplanation: 'np.where preserves array shape; boolean indexing arr[mask] flattens to 1D.',
        perfImpact: 'Maintains required tensor dimensions across computational pipelines.'
      }
    ],
    apiCheatSheet: [
      {
        name: 'arr > val',
        category: 'Comparison',
        signature: 'arr > val (ndarray.__gt__)',
        summary: 'Element-wise greater-than comparison returning boolean array of same shape.',
        parameters: [
          { name: 'val', type: 'scalar | array_like', desc: 'Threshold value or broadcast-compatible array.' }
        ],
        returns: 'Boolean ndarray.',
        exampleSnippet: `# Boolean mask for positive numbers
mask = arr > 0`
      },
      {
        name: '& (Bitwise AND)',
        category: 'Logic',
        signature: '(cond1) & (cond2)',
        summary: 'Element-wise logical conjunction of two boolean arrays.',
        parameters: [
          { name: 'cond1', type: 'ndarray[bool]', desc: 'First boolean condition.' },
          { name: 'cond2', type: 'ndarray[bool]', desc: 'Second boolean condition.' }
        ],
        returns: 'Combined boolean ndarray.',
        exampleSnippet: `# Within range [10, 50]
in_range = (arr >= 10) & (arr <= 50)`
      },
      {
        name: '| (Bitwise OR)',
        category: 'Logic',
        signature: '(cond1) | (cond2)',
        summary: 'Element-wise logical disjunction of two boolean arrays.',
        parameters: [
          { name: 'cond1', type: 'ndarray[bool]', desc: 'First boolean condition.' },
          { name: 'cond2', type: 'ndarray[bool]', desc: 'Second boolean condition.' }
        ],
        returns: 'Combined boolean ndarray.',
        exampleSnippet: `# Outlier detection (below min or above max)
outliers = (arr < lower) | (arr > upper)`
      },
      {
        name: '~ (Bitwise NOT)',
        category: 'Logic',
        signature: '~cond',
        summary: 'Element-wise logical inversion (True becomes False, False becomes True).',
        parameters: [
          { name: 'cond', type: 'ndarray[bool]', desc: 'Boolean array to invert.' }
        ],
        returns: 'Inverted boolean ndarray.',
        exampleSnippet: `# Filter valid elements
valid = arr[~anomaly_mask]`
      },
      {
        name: 'arr[mask]',
        category: 'Indexing',
        signature: 'arr[mask]',
        summary: 'Extract elements where boolean mask is True (flattens arbitrary shapes to 1D).',
        parameters: [
          { name: 'mask', type: 'ndarray[bool]', desc: 'Boolean selector mask.' }
        ],
        returns: '1D array of extracted values.',
        exampleSnippet: `# Extract values greater than threshold
passing_scores = scores[scores >= 70]`
      },
      {
        name: 'np.where',
        category: 'Conditional',
        signature: 'np.where(condition, [x, y])',
        summary: 'Return elements chosen from x or y depending on condition.',
        parameters: [
          { name: 'condition', type: 'ndarray[bool]', desc: 'Where True, yield x, otherwise yield y.' },
          { name: 'x', type: 'scalar | array_like', desc: 'Values if True.' },
          { name: 'y', type: 'scalar | array_like', desc: 'Values if False.' }
        ],
        returns: 'Array with shape determined by broadcasting condition, x, and y.',
        exampleSnippet: `# Replace negative values with zero
non_negative = np.where(arr < 0, 0, arr)`
      },
      {
        name: 'np.any',
        category: 'Aggregation',
        signature: 'np.any(a, axis=None, keepdims=False)',
        summary: 'Test whether any array element along a given axis evaluates to True.',
        parameters: [
          { name: 'a', type: 'array_like', desc: 'Input array.' }
        ],
        returns: 'Boolean scalar or array.',
        exampleSnippet: `# Check if any anomaly exists
has_faults = bool(np.any(anomaly_mask))`
      },
      {
        name: 'np.all',
        category: 'Aggregation',
        signature: 'np.all(a, axis=None, keepdims=False)',
        summary: 'Test whether all array elements along a given axis evaluate to True.',
        parameters: [
          { name: 'a', type: 'array_like', desc: 'Input array.' }
        ],
        returns: 'Boolean scalar or array.',
        exampleSnippet: `# Check if all elements are valid
all_ok = bool(np.all(~anomaly_mask))`
      }
    ],
    interactiveWidgetType: 'numpy-strides'
  },
  challenges: [
    {
      id: 'd6-c1',
      dayId: 6,
      partId: 6,
      title: 'Sensor Anomaly Detector & Clipper',
      slug: 'sensor-anomaly-detector-clipper',
      difficulty: 'Beginner',
      category: 'Boolean Masking & Filtering',
      summary: 'Detect corrupted IoT sensor spikes, count anomalies, extract valid subsets, and repair faulty readings without loops.',
      mentalModel5s: 'Combine (arr < low) | (arr > high) for anomaly mask. Use arr[~mask] for clean data and np.where for conditional repair and clipping.',
      visualAnalogy: 'A quality-control scanner on a factory conveyor belt tagging defective parts with red laser dots, discarding the bad ones, and trimming rough edges.',
      pitfalls: [
        'Using Python "or" instead of bitwise "|".',
        'Forgetting parentheses around comparisons, corrupting the bitwise evaluation.',
        'Using Python for loops to check and replace values individually.'
      ],
      progressiveHints: [
        'Tier 1 (Mask): Combine conditions with bitwise OR: anomaly_mask = (readings < lower_limit) | (readings > upper_limit).',
        'Tier 2 (Stats): Count with np.sum(anomaly_mask), check presence with np.any(anomaly_mask), check purity with np.all(~anomaly_mask).',
        'Tier 3 (Filter): Extract valid readings via readings[~anomaly_mask].',
        'Tier 4 (np.where): Replace with np.where(anomaly_mask, fill_value, readings). Clip with nested np.where.'
      ],
      deepInternals: {
        title: 'Vectorized SIMD Masking',
        content: 'NumPy executes boolean comparison predicates in parallel using AVX vector comparison instructions (VPCMPGTD), generating boolean bitmasks in single CPU clock cycles.',
        keyRule: 'Always use & and | with parentheses for element-wise boolean operations.'
      },
      instructions: `An IoT smart factory monitoring system collects temperature and vibration measurements. Sensors occasionally produce corrupted dropouts or surges. Write a clean vectorized cleaner:

**Requirements:**
1. Compute \`anomaly_mask\`: boolean array matching \`readings.shape\` where values are \`< lower_limit\` OR \`> upper_limit\`.
2. Compute \`anomaly_count\`: integer representing the total count of anomalies.
3. Compute \`has_anomalies\`: bool indicating whether any anomaly exists.
4. Compute \`all_valid\`: bool indicating whether all readings are valid.
5. Compute \`valid_readings\`: 1D array containing only the valid readings extracted via boolean indexing.
6. Compute \`replaced_readings\`: array matching \`readings.shape\`, conditionally replacing elements matching \`anomaly_mask\` with \`fill_value\`, otherwise \`readings\`.
7. Compute \`clipped_readings\`: array matching \`readings.shape\`, clamped within the specified lower and upper bounds.
8. Return all outputs in a dictionary. NO Python loops allowed!`,
      hints: [
        'Build the mask via `(readings < lower_limit) | (readings > upper_limit)`.',
        'Wrap each comparison in parentheses to guarantee correct precedence.',
        'Use `np.sum(anomaly_mask)` to count anomalies and `np.any(anomaly_mask)` to test existence.',
        'Filter valid entries using `readings[~anomaly_mask]`.',
        'Use `np.where(anomaly_mask, fill_value, readings)` to replace values.',
        'Use nested `np.where` to clamp values to limits.'
      ],
      starterCode: `import numpy as np

def clean_sensor_readings(
    readings: np.ndarray,
    lower_limit: float,
    upper_limit: float,
    fill_value: float = 0.0
) -> dict:
    """
    Detect, count, filter, and conditionally replace sensor anomalies using boolean masking.
    
    Args:
        readings: NumPy array (1D or 2D) of numeric sensor values.
        lower_limit: Minimum valid physical threshold.
        upper_limit: Maximum valid physical threshold.
        fill_value: Replacement value for corrupted entries (default 0.0).
        
    Returns:
        dict with keys:
            - 'anomaly_mask': bool array matching readings shape
            - 'anomaly_count': int total count of anomalies
            - 'has_anomalies': bool True if any anomaly exists
            - 'all_valid': bool True if no anomalies exist
            - 'valid_readings': 1D array of only valid values
            - 'replaced_readings': array with anomalies replaced by fill_value
            - 'clipped_readings': array with values clamped to [lower_limit, upper_limit]
    """
    # TODO: Implement boolean masks, any/all, filtering, and conditional replacement without Python loops
    pass
`,
      solutionCode: `import numpy as np

def clean_sensor_readings(
    readings: np.ndarray,
    lower_limit: float,
    upper_limit: float,
    fill_value: float = 0.0
) -> dict:
    arr = np.asarray(readings, dtype=np.float64)
    if lower_limit > upper_limit:
        raise ValueError(f"lower_limit ({lower_limit}) cannot exceed upper_limit ({upper_limit})")
        
    # Build masks combining conditions with bitwise OR (|)
    low_mask = arr < lower_limit
    high_mask = arr > upper_limit
    anomaly_mask = low_mask | high_mask
    valid_mask = ~anomaly_mask
    
    anomaly_count = int(np.sum(anomaly_mask))
    has_anomalies = bool(np.any(anomaly_mask))
    all_valid = bool(np.all(valid_mask))
    
    # Filter valid readings (returns 1D array)
    valid_readings = arr[valid_mask]
    
    # Conditional replacement via np.where
    replaced_readings = np.where(anomaly_mask, fill_value, arr)
    
    # Double conditional clamp via nested np.where
    clipped_readings = np.where(low_mask, lower_limit, np.where(high_mask, upper_limit, arr))
    
    return {
        "anomaly_mask": anomaly_mask,
        "anomaly_count": anomaly_count,
        "has_anomalies": has_anomalies,
        "all_valid": all_valid,
        "valid_readings": valid_readings,
        "replaced_readings": replaced_readings,
        "clipped_readings": clipped_readings,
    }
`,
      testCases: [
        {
          id: 't1',
          name: '1D Sensor Sequence with 2 Anomalies',
          inputDescription: 'readings = [5, 15, 30, 55, 20], limits=[10, 50]',
          expectedOutput: 'anomaly_count=2, valid_readings=[15, 30, 20]'
        },
        {
          id: 't2',
          name: '2D Sensor Grid Shape Preservation',
          inputDescription: '3x2 array with positive and negative spikes',
          expectedOutput: 'replaced_readings shape (3, 2), valid_readings 1D'
        },
        {
          id: 't3',
          name: 'Completely Clean Dataset',
          inputDescription: 'All readings within valid limits',
          expectedOutput: 'has_anomalies=False, all_valid=True, anomaly_count=0'
        }
      ],
      benchmarkTargetMs: 0.6,
      memoryTargetMb: 0.4,
      conceptPrimer: {
        title: 'Boolean Masking & Vectorized Data Cleaning',
        subtitle: 'From procedural if-else loops to declarative SIMD predicates',
        overview: 'Boolean masking evaluates logical predicates across contiguous memory arrays. By indexing with boolean arrays or applying np.where, anomalies are detected and transformed without procedural branching.',
        mentalModel5s: 'Create True/False stencil; sieve valid elements with arr[~mask]; replace outliers with np.where.',
        visualAnalogy: 'A gold panner mesh sieve letting fine sediment pass through while catching gold nuggets.',
        pitfalls: [
          'Using "and/or" instead of bitwise "&/|".',
          'Omitting parentheses around comparison expressions.'
        ],
        progressiveHints: [
          'Tier 1: (arr < lower) | (arr > upper)',
          'Tier 2: np.sum(mask) for count',
          'Tier 3: arr[~mask] for valid array',
          'Tier 4: np.where(mask, fill, arr)'
        ],
        deepInternals: {
          title: 'Branchless Execution & CPU Pipelines',
          content: 'Traditional if-statements cause CPU branch misprediction penalties. np.where compiles to conditional move (CMOV) instructions, eliminating branch stalls entirely.',
          keyRule: 'Always wrap comparison operands in parentheses when using & and |.'
        },
        mathFormulas: [
          {
            title: 'Logical Disjunction Mask',
            latex: 'M_i = (X_i < L) \\lor (X_i > U)',
            explanation: 'Flags an element as anomalous if it falls outside the lower or upper boundary.'
          },
          {
            title: 'Vectorized Conditional Assignment',
            latex: 'Y_i = \\begin{cases} F & \\text{if } M_i = \\text{True} \\\\ X_i & \\text{if } M_i = \\text{False} \\end{cases}',
            explanation: 'The mathematical specification of np.where(M, F, X).'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Procedural Python loop with if statements
def naive_clean(readings, low, high, fill):
    cleaned = []
    count = 0
    for x in readings:
        if x < low or x > high:
            cleaned.append(fill)
            count += 1
        else:
            cleaned.append(x)
    return np.array(cleaned), count`,
          naiveExplanation: 'Incurs branch prediction stalls and list resizing overhead on every element.',
          idiomaticCode: `# Idiomatic NumPy Masking & np.where
def idiomatic_clean(readings, low, high, fill):
    mask = (readings < low) | (readings > high)
    return np.where(mask, fill, readings), int(np.sum(mask))`,
          idiomaticExplanation: 'Compiled branchless SIMD execution (45x faster).',
          speedupText: '45x faster'
        },
        memoryLayout: {
          title: 'Boolean Array Representation in Memory',
          content: 'NumPy represents booleans as 1 byte (8 bits) per element (np.bool_). This enables fast byte-level AVX SIMD vector register operations.',
          diagramAscii: `Input: [ 5.0 ] [ 15.0 ] [ 30.0 ] [ 55.0 ]
           |        |        |        |
Mask:  [0x01 ]  [0x00 ]  [0x00 ]  [0x01 ]  (1 byte per boolean)`,
          keyRule: 'Boolean masks maintain 1-byte alignment for maximum CPU vectorized throughput.'
        },
        keyTakeaways: [
          'Bitwise & and | require parentheses around each comparison.',
          'np.sum(mask) directly counts True occurrences.',
          'np.where(condition, x, y) provides branchless ternary selection.',
          'arr[mask] extracts filtered subsets in a single vectorized expression.'
        ]
      },
      sampleDataFrame: {
        name: 'Sensor Health Log Sample',
        columns: ['Sensor_ID', 'Raw_Reading', 'Is_Anomaly', 'Repaired_Value', 'Clipped_Value'],
        dtypes: { Sensor_ID: 'int64', Raw_Reading: 'float64', Is_Anomaly: 'boolean', Repaired_Value: 'float64', Clipped_Value: 'float64' },
        rows: [
          { Sensor_ID: 0, Raw_Reading: 5.0, Is_Anomaly: true, Repaired_Value: 0.0, Clipped_Value: 10.0 },
          { Sensor_ID: 1, Raw_Reading: 15.0, Is_Anomaly: false, Repaired_Value: 15.0, Clipped_Value: 15.0 },
          { Sensor_ID: 2, Raw_Reading: 30.0, Is_Anomaly: false, Repaired_Value: 30.0, Clipped_Value: 30.0 },
          { Sensor_ID: 3, Raw_Reading: 55.0, Is_Anomaly: true, Repaired_Value: 0.0, Clipped_Value: 50.0 },
          { Sensor_ID: 4, Raw_Reading: 20.0, Is_Anomaly: false, Repaired_Value: 20.0, Clipped_Value: 20.0 }
        ],
        totalRows: 5,
        memoryUsageKb: 0.5
      },
      samplePlot: {
        id: 'p3',
        title: 'Sensor Time-Series & Anomaly Threshold Boundaries',
        type: 'svg',
        description: 'Readings timeline with upper/lower threshold boundaries and anomaly flags',
        svgContent: `<svg viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
          <rect width="600" height="300" fill="#0f172a" rx="8"/>
          <line x1="60" y1="240" x2="550" y2="240" stroke="#334155" stroke-width="1.5"/>
          <line x1="60" y1="40" x2="60" y2="240" stroke="#334155" stroke-width="1.5"/>
          <!-- Threshold limits -->
          <line x1="60" y1="80" x2="550" y2="80" stroke="#ef4444" stroke-dasharray="4" stroke-width="1.5"/>
          <text x="500" y="72" fill="#ef4444" font-size="11" font-weight="bold">Upper Limit (50.0)</text>
          <line x1="60" y1="200" x2="550" y2="200" stroke="#ef4444" stroke-dasharray="4" stroke-width="1.5"/>
          <text x="500" y="215" fill="#ef4444" font-size="11" font-weight="bold">Lower Limit (10.0)</text>
          <!-- Valid Zone shading -->
          <rect x="60" y="80" width="490" height="120" fill="#22c55e" fill-opacity="0.05"/>
          <!-- Sensor reading points and line -->
          <polyline points="100,225 180,175 270,120 360,55 450,150" fill="none" stroke="#38bdf8" stroke-width="2.5"/>
          <!-- Anomaly markers -->
          <circle cx="100" cy="225" r="7" fill="#ef4444"/>
          <text x="100" y="255" fill="#ef4444" font-size="11" text-anchor="middle" font-weight="bold">Dropout (5.0)</text>
          <circle cx="180" cy="175" r="5" fill="#22c55e"/>
          <circle cx="270" cy="120" r="5" fill="#22c55e"/>
          <circle cx="360" cy="55" r="7" fill="#ef4444"/>
          <text x="360" y="45" fill="#ef4444" font-size="11" text-anchor="middle" font-weight="bold">Surge (55.0)</text>
          <circle cx="450" cy="150" r="5" fill="#22c55e"/>
          <text x="35" y="35" fill="#94a3b8" font-size="11">Sensor Value</text>
          <text x="510" y="260" fill="#94a3b8" font-size="11">Sample</text>
        </svg>`
      },
      expectedTensors: [
        { name: 'readings', shape: '(5,)', dtype: 'float64' },
        { name: 'anomaly_mask', shape: '(5,)', dtype: 'bool' },
        { name: 'clipped_readings', shape: '(5,)', dtype: 'float64' }
      ]
    },
    {
      id: 'd6-c2',
      dayId: 6,
      partId: 6,
      title: 'Multi-Condition Data Sieve',
      slug: 'multi-condition-data-sieve',
      difficulty: 'Intermediate',
      category: 'Advanced Boolean Indexing & Conditional Branching',
      summary: 'Sieve server telemetry into Critical, Warning, and Healthy states using simultaneous bitwise conditions and conditional branching without loops.',
      mentalModel5s: 'Combine multiple column criteria with & and | to partition rows into mutually exclusive health tiers with zero loops.',
      visualAnalogy: 'An airport security baggage scanner sorting luggage into Green (clear), Yellow (hand check), and Red (hazard) belts simultaneously.',
      pitfalls: [
        'Missing parentheses in compound boolean expressions.',
        'Overlapping tier definitions violating mutually exclusive partitioning.',
        'Writing procedural for-loops to classify servers one by one.'
      ],
      progressiveHints: [
        'Tier 1 (Columns): Slice columns: cpu = data[:, 1], mem = data[:, 2], errors = data[:, 4].',
        'Tier 2 (Critical): critical_mask = ((cpu >= cpu_limit) & (mem >= mem_limit)) | (errors > max_errors).',
        'Tier 3 (Healthy): healthy_mask = (cpu < cpu_limit) & (mem < mem_limit) & (errors == 0.0).',
        'Tier 4 (Warning & Codes): warning_mask = ~critical_mask & ~healthy_mask. Use nested np.where for status codes.'
      ],
      deepInternals: {
        title: 'Mutually Exclusive Array Partitions',
        content: 'By defining warning_mask as ~critical_mask & ~healthy_mask, the union of all three masks covers 100% of the dataset with zero overlap, creating a mathematically rigorous partition.',
        keyRule: 'Partition multi-state systems with inverted conjunctions (~A & ~B) to prevent classification gaps.'
      },
      instructions: `You are building an automated triage engine for a Kubernetes cloud cluster. A 2D array contains telemetry for $N$ servers across 5 columns:
- Column 0: \`server_id\`
- Column 1: \`cpu_percent\`
- Column 2: \`mem_percent\`
- Column 3: \`disk_io_mbps\`
- Column 4: \`error_rate_per_sec\`

**Requirements:**
1. Compute \`critical_mask\`: True if \`(cpu >= cpu_limit AND mem >= mem_limit) OR (errors > max_errors)\`.
2. Compute \`healthy_mask\`: True if \`cpu < cpu_limit AND mem < mem_limit AND errors == 0.0\`.
3. Compute \`warning_mask\`: True where servers are neither Critical nor Healthy.
4. Extract \`critical_servers\`: 2D array of all rows corresponding to critical servers.
5. Extract \`critical_ids\`: 1D array of server IDs matching \`critical_mask\`.
6. Extract \`healthy_ids\`: 1D array of server IDs matching \`healthy_mask\`.
7. Compute \`status_codes\`: 1D integer array where each server is assigned a status code (0=Healthy, 1=Warning, 2=Critical) via conditional selection.
8. Compute \`triage_summary\`: dict containing integer counts \`total_servers\`, \`critical_count\`, \`warning_count\`, \`healthy_count\`.
9. Return all outputs in a dictionary. NO Python loops allowed!`,
      hints: [
        'Slice columns using `cpu = telemetry[:, 1]`, `mem = telemetry[:, 2]`, `errors = telemetry[:, 4]`.',
        'Construct `critical_mask = ((cpu >= cpu_limit) & (mem >= mem_limit)) | (errors > max_errors)`.',
        'Construct `healthy_mask = (cpu < cpu_limit) & (mem < mem_limit) & (errors == 0.0)`.',
        'Extract rows using `telemetry[critical_mask]` and IDs via `telemetry[critical_mask, 0]`.',
        'Assign status codes with `np.where(critical_mask, 2, np.where(warning_mask, 1, 0))`.'
      ],
      starterCode: `import numpy as np

def sieve_server_telemetry(
    telemetry: np.ndarray,
    cpu_limit: float = 85.0,
    mem_limit: float = 90.0,
    max_errors: float = 5.0
) -> dict:
    """
    Sieve multi-column server telemetry records into critical, warning, and healthy tiers
    using multi-condition boolean indexing and vectorized conditional branching.
    
    Columns:
        0: server_id, 1: cpu_percent, 2: mem_percent, 3: disk_io_mbps, 4: error_rate_per_sec
        
    Criteria:
        - Critical: (cpu >= cpu_limit AND mem >= mem_limit) OR (error_rate > max_errors)
        - Healthy: cpu < cpu_limit AND mem < mem_limit AND error_rate == 0.0
        - Warning: not critical and not healthy
        
    Returns:
        dict with keys:
            - 'critical_mask': 1D bool array
            - 'healthy_mask': 1D bool array
            - 'warning_mask': 1D bool array
            - 'critical_servers': 2D array of critical server rows
            - 'critical_ids': 1D array of critical server IDs
            - 'healthy_ids': 1D array of healthy server IDs
            - 'status_codes': 1D int array (0=Healthy, 1=Warning, 2=Critical)
            - 'triage_summary': dict of count totals
    """
    # TODO: Implement multi-condition boolean indexing and conditional selection without Python loops
    pass
`,
      solutionCode: `import numpy as np

def sieve_server_telemetry(
    telemetry: np.ndarray,
    cpu_limit: float = 85.0,
    mem_limit: float = 90.0,
    max_errors: float = 5.0
) -> dict:
    data = np.asarray(telemetry, dtype=np.float64)
    if data.ndim != 2 or data.shape[1] < 5:
        raise ValueError(f"Expected 2D array with at least 5 columns, got shape {data.shape}")
        
    server_ids = data[:, 0]
    cpu = data[:, 1]
    mem = data[:, 2]
    errors = data[:, 4]
    
    # 1. Critical condition: (high CPU & high Mem) OR error spike
    critical_mask = ((cpu >= cpu_limit) & (mem >= mem_limit)) | (errors > max_errors)
    
    # 2. Healthy condition: low CPU & low Mem & zero errors
    healthy_mask = (cpu < cpu_limit) & (mem < mem_limit) & (errors == 0.0)
    
    # 3. Warning condition: neither critical nor fully healthy
    warning_mask = ~critical_mask & ~healthy_mask
    
    # Sieve row subsets
    critical_servers = data[critical_mask]
    critical_ids = server_ids[critical_mask]
    healthy_ids = server_ids[healthy_mask]
    
    # Categorize status codes: 0 = Healthy, 1 = Warning, 2 = Critical
    status_codes = np.where(critical_mask, 2, np.where(warning_mask, 1, 0)).astype(np.int64)
    
    triage_summary = {
        "total_servers": int(len(data)),
        "critical_count": int(np.sum(critical_mask)),
        "warning_count": int(np.sum(warning_mask)),
        "healthy_count": int(np.sum(healthy_mask)),
    }
    
    return {
        "critical_mask": critical_mask,
        "healthy_mask": healthy_mask,
        "warning_mask": warning_mask,
        "critical_servers": critical_servers,
        "critical_ids": critical_ids,
        "healthy_ids": healthy_ids,
        "status_codes": status_codes,
        "triage_summary": triage_summary,
    }
`,
      testCases: [
        {
          id: 't1',
          name: 'Handcrafted 5-Server Triage Matrix',
          inputDescription: '5 servers covering Healthy, Critical (Load), Critical (Errors), and Warnings',
          expectedOutput: 'critical_count=2, warning_count=2, healthy_count=1'
        },
        {
          id: 't2',
          name: 'Partition Completeness & Exclusivity',
          inputDescription: 'Check sum of masks == 1 for every server',
          expectedOutput: 'All servers assigned to exactly one status tier'
        },
        {
          id: 't3',
          name: 'Large-scale 20,000 Node Cluster Benchmark',
          inputDescription: '20,000 server telemetry rows',
          expectedOutput: 'Vectorized execution under 15ms'
        }
      ],
      benchmarkTargetMs: 1.2,
      memoryTargetMb: 1.5,
      conceptPrimer: {
        title: 'Multi-Condition Indexing & Triage Sieving',
        subtitle: 'Combining multi-column boolean predicates without procedural loops',
        overview: 'In enterprise telemetry processing, data points must be categorized against complex criteria. Boolean masking evaluates compound predicates across columns simultaneously, extracting matching rows instantly.',
        mentalModel5s: 'Slice columns; combine predicates with bitwise & and |; partition rows with mask indexing.',
        visualAnalogy: 'A three-way sorting conveyor belt diverting boxes into Red, Yellow, or Green bins based on weight, height, and fragility checks.',
        pitfalls: [
          'Using "and/or" instead of "&/|".',
          'Forgetting parentheses around comparison sub-expressions.'
        ],
        progressiveHints: [
          'Tier 1: Extract columns with data[:, col_idx]',
          'Tier 2: Compound mask: ((cpu >= limit) & (mem >= limit)) | (errors > max_err)',
          'Tier 3: Invert for remaining tiers: ~critical & ~healthy',
          'Tier 4: Status codes: np.where(crit, 2, np.where(warn, 1, 0))'
        ],
        deepInternals: {
          title: 'Row Mask Indexing in C',
          content: 'NumPy evaluates telemetry[mask] by creating an index buffer of matching row pointers and copying selected rows into a contiguous output buffer, executing at hardware memory speed.',
          keyRule: 'Row masks must match dimension 0 of the indexed 2D matrix.'
        },
        mathFormulas: [
          {
            title: 'Critical Triage Predicate',
            latex: 'C_i = (\\text{cpu}_i \\ge L_{\\text{cpu}} \\land \\text{mem}_i \\ge L_{\\text{mem}}) \\lor (\\text{err}_i > L_{\\text{err}})',
            explanation: 'Boolean logic for identifying severe infrastructure risk.'
          },
          {
            title: 'Partition Completeness Identity',
            latex: 'C_i + W_i + H_i = 1, \\quad \\forall i \\in \\{0, \\dots, N-1\\}',
            explanation: 'Ensures that every node belongs to exactly one mutual status tier.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Procedural loop over server rows
def naive_sieve(telemetry):
    crit_ids = []
    for row in telemetry:
        sid, cpu, mem, _, err = row
        if (cpu >= 85 and mem >= 90) or err > 5:
            crit_ids.append(sid)
    return np.array(crit_ids)`,
          naiveExplanation: 'Incurs row unpacking and dynamic list appends for every server.',
          idiomaticCode: `# Idiomatic Boolean Vectorization
def idiomatic_sieve(telemetry):
    mask = ((telemetry[:, 1] >= 85) & (telemetry[:, 2] >= 90)) | (telemetry[:, 4] > 5)
    return telemetry[mask, 0]`,
          idiomaticExplanation: 'Single vectorized pass in pre-compiled C (55x faster).',
          speedupText: '55x faster'
        },
        memoryLayout: {
          title: 'Columnar Slicing vs Row Filtering',
          content: 'telemetry[:, 1] creates a strided view of column 1. Once the mask is computed, telemetry[mask] gathers selected rows into a new contiguous array.',
          diagramAscii: `Telemetry Matrix (N x 5):
[ ID0, CPU0, MEM0, IO0, ERR0 ]  --> Mask[0]: False
[ ID1, CPU1, MEM1, IO1, ERR1 ]  --> Mask[1]: True   ===> Gather into Critical Array
[ ID2, CPU2, MEM2, IO2, ERR2 ]  --> Mask[2]: False`,
          keyRule: 'Slicing columns is a zero-copy view; boolean row indexing returns a fresh contiguous copy.'
        },
        keyTakeaways: [
          'Compound conditions require bitwise operators & and | with parentheses.',
          'Sieve rows cleanly with data[mask].',
          'Extract specific columns of filtered rows via data[mask, col_idx].',
          'Nested np.where produces multi-tier integer status codes in a single line.'
        ]
      },
      sampleDataFrame: {
        name: 'Cluster Node Telemetry Sample',
        columns: ['Server_ID', 'CPU_Load_Pct', 'Memory_Pct', 'Disk_IO_MBps', 'Error_Rate', 'Status_Code'],
        dtypes: { Server_ID: 'int64', CPU_Load_Pct: 'float64', Memory_Pct: 'float64', Disk_IO_MBps: 'float64', Error_Rate: 'float64', Status_Code: 'int64' },
        rows: [
          { Server_ID: 101, CPU_Load_Pct: 40.0, Memory_Pct: 50.0, Disk_IO_MBps: 100.0, Error_Rate: 0.0, Status_Code: 0 },
          { Server_ID: 102, CPU_Load_Pct: 90.0, Memory_Pct: 95.0, Disk_IO_MBps: 200.0, Error_Rate: 1.0, Status_Code: 2 },
          { Server_ID: 103, CPU_Load_Pct: 50.0, Memory_Pct: 60.0, Disk_IO_MBps: 150.0, Error_Rate: 8.0, Status_Code: 2 },
          { Server_ID: 104, CPU_Load_Pct: 88.0, Memory_Pct: 70.0, Disk_IO_MBps: 120.0, Error_Rate: 0.0, Status_Code: 1 },
          { Server_ID: 105, CPU_Load_Pct: 30.0, Memory_Pct: 40.0, Disk_IO_MBps: 80.0, Error_Rate: 2.0, Status_Code: 1 }
        ],
        totalRows: 5,
        memoryUsageKb: 0.6
      },
      samplePlot: {
        id: 'p4',
        title: 'Cluster Health Triage Distribution',
        type: 'svg',
        description: 'Server nodes mapped by CPU and Memory load, color-coded by health tier',
        svgContent: `<svg viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
          <rect width="600" height="300" fill="#0f172a" rx="8"/>
          <line x1="60" y1="240" x2="550" y2="240" stroke="#334155" stroke-width="1.5"/>
          <line x1="60" y1="40" x2="60" y2="240" stroke="#334155" stroke-width="1.5"/>
          <!-- Critical threshold zone (CPU >= 85, Mem >= 90) -->
          <rect x="440" y="40" width="110" height="60" fill="#ef4444" fill-opacity="0.2" rx="4"/>
          <text x="495" y="75" fill="#ef4444" font-size="11" text-anchor="middle" font-weight="bold">Critical Zone</text>
          <!-- Server nodes -->
          <!-- Server 101: 40% CPU, 50% Mem -> Healthy -->
          <circle cx="240" cy="160" r="7" fill="#22c55e"/>
          <text x="240" y="180" fill="#86efac" font-size="10" text-anchor="middle">S101 (Healthy)</text>
          <!-- Server 102: 90% CPU, 95% Mem -> Critical -->
          <circle cx="480" cy="55" r="8" fill="#ef4444"/>
          <text x="480" y="40" fill="#fca5a5" font-size="10" text-anchor="middle" font-weight="bold">S102 (Critical)</text>
          <!-- Server 103: Error Spike -> Critical -->
          <circle cx="280" cy="140" r="8" fill="#ef4444"/>
          <text x="280" y="125" fill="#fca5a5" font-size="10" text-anchor="middle" font-weight="bold">S103 (Errors)</text>
          <!-- Server 104: 88% CPU, 70% Mem -> Warning -->
          <circle cx="460" cy="120" r="7" fill="#f59e0b"/>
          <text x="460" y="140" fill="#fcd34d" font-size="10" text-anchor="middle">S104 (Warning)</text>
          <!-- Server 105: 30% CPU, 40% Mem, 2 err -> Warning -->
          <circle cx="180" cy="180" r="7" fill="#f59e0b"/>
          <text x="180" y="200" fill="#fcd34d" font-size="10" text-anchor="middle">S105 (Warning)</text>
          <text x="35" y="35" fill="#94a3b8" font-size="11">Memory %</text>
          <text x="510" y="260" fill="#94a3b8" font-size="11">CPU %</text>
        </svg>`
      },
      expectedTensors: [
        { name: 'telemetry', shape: '(5, 5)', dtype: 'float64' },
        { name: 'critical_mask', shape: '(5,)', dtype: 'bool' },
        { name: 'status_codes', shape: '(5,)', dtype: 'int64' }
      ]
    }
  ]
};

export const PART06_TRACK = DAY06_TRACK;
export const DAY06_BOOLEAN_MASKING_TRACK = DAY06_TRACK;
export const PART06_BOOLEAN_MASKING_TRACK = DAY06_TRACK;
export default DAY06_TRACK;
