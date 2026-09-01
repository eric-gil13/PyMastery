import type { DayTrack } from '../../types';

export const DAY04_TRACK: DayTrack = {
  partNumber: 4,
  partId: 4,
  dayNumber: 4,
  id: 4,
  title: 'Part 4: Vectorized Arithmetic & Ufuncs',
  subtitle: 'Why Python loops are slow, vectorization, scalar math, element-wise arithmetic, and universal functions',
  description: 'Banish slow Python loops forever. Learn how NumPy executes lightning-fast element-wise arithmetic, scalar operations, and universal functions (ufuncs) across millions of numbers in milliseconds.',
  iconName: 'Cpu',
  badge: 'Part 4 • NumPy',
  libraryMechanics: {
    libraryName: 'NumPy Vectorized Arithmetic & Ufuncs',
    tagline: 'Banish Python loops forever with SIMD-accelerated universal functions and vectorized arithmetic.',
    overview: `### 🐌 The Python Loop Tax
When you loop over a standard Python list using \`for x in my_list\`, the Python interpreter must:
1. Fetch and interpret bytecode instructions for every single element.
2. Dynamically check object types and inspect method tables.
3. Unbox pointer references scattered unpredictably across heap RAM.
4. Allocate new \`PyObject\` containers for each calculation result.

For a dataset of 1,000,000 elements, Python executes over **10 million CPU instructions**, causing high CPU cache miss rates and taking hundreds of milliseconds.

### ⚡ The Power of Vectorization
NumPy stores numbers consecutively in **contiguous memory blocks** where all elements share the exact same data type (e.g. \`float64\`). 

When you write \`arr * 2\`:
- NumPy skips the Python interpreter loop entirely.
- It hands the raw memory pointer to pre-compiled C/Fortran routines.
- Modern CPUs use **SIMD (Single Instruction, Multiple Data)** hardware registers (AVX-256 and AVX-512) to compute 4 to 8 operations **in a single CPU clock cycle**!
- Calculations complete **50x to 200x faster** with clean, one-line expressions.`,
    whyItExists: `NumPy was built to eliminate the performance gap between Python's high-level syntax and C/Fortran's raw execution speed.

Universal Functions (**ufuncs**) like \`np.sqrt\`, \`np.exp\`, \`np.clip\`, and \`np.abs\` represent the engine of high-performance scientific Python:
- They operate element-by-element across arrays of any dimensionality without nested loops.
- They support scalar broadcasting seamlessly.
- They keep computation inside CPU L1/L2 caches, maximizing throughput for machine learning, statistics, and financial modeling.`,
    coreAnatomy: {
      objectName: 'ufunc (Universal Function)',
      description: 'A compiled C routine that executes element-by-element mathematical operations across ndarrays with hardware SIMD acceleration.',
      fields: [
        {
          name: 'nin',
          type: 'int',
          role: 'Number of input arguments (1 for unary functions like np.sqrt, 2 for binary functions like np.add).'
        },
        {
          name: 'nout',
          type: 'int',
          role: 'Number of output arrays produced by the ufunc.'
        },
        {
          name: 'nargs',
          type: 'int',
          role: 'Total number of arguments (nin + nout).'
        },
        {
          name: 'types',
          type: 'list[str]',
          role: 'Supported type signatures (e.g., "dd->d" for double-precision float in, double out).'
        }
      ],
      memoryDiagramAscii: `+-------------------------------------------------------------------------------+
|                       Vectorized SIMD Arithmetic in RAM                       |
+-------+-------+-------+-------+-------+-------+-------+-------+-------+-------+
|  A[0] |  A[1] |  A[2] |  A[3] |   +   |  B[0] |  B[1] |  B[2] |  B[3] |   =   |
|  10.0 |  20.0 |  30.0 |  40.0 |       |   1.0 |   2.0 |   3.0 |   4.0 |       |
+-------+-------+-------+-------+-------+-------+-------+-------+-------+-------+
                                    |
                    [ 256-bit AVX CPU Register ]
                    (4 Floats Processed Simultaneously in 1 Cycle)
                                    v
+-------+-------+-------+-------+-------+-------+-------+-------+-------+-------+
|  C[0] |  C[1] |  C[2] |  C[3] |  --> [ 11.0,  22.0,  33.0,  44.0 ]            |
+-------+-------+-------+-------+-------+-------+-------+-------+-------+-------+`
    },
    chapters: [
      {
        id: 'ch1-loop-tax-vectorization',
        title: 'The Python Loop Tax vs. Contiguous Vectorization',
        icon: 'Cpu',
        summary: 'Understand why pure Python loops are slow and how contiguous memory buffers enable hardware SIMD vectorization.',
        markdownContent: `### The Python Interpreter Loop Overhead
When you write:
\`\`\`python
# Pure Python list multiplication
result = [x * 2.0 for x in prices]
\`\`\`
Python must unbox each float object from heap memory, verify its type, invoke \`__mul__\`, allocate a new float object, and append it to a list.

### Whole-Array Math with NumPy
In NumPy, you simply write:
\`\`\`python
# Vectorized NumPy multiplication
result = prices * 2.0
\`\`\`
Because NumPy arrays are contiguous blocks of homogenous memory:
1. Zero type-checking inside the loop.
2. The CPU streams data sequentially into L1 cache.
3. Hardware SIMD registers calculate multiple elements per cycle.`,
        codeSnippets: [
          {
            id: 'snip-vectorization-speed',
            title: 'Benchmarking Vectorized Math vs Python List Comprehension',
            code: `import numpy as np
import time

N = 500_000
py_list = list(range(N))
np_arr = np.arange(N, dtype=np.float64)

# Python loop
t0 = time.perf_counter()
_ = [x * 2.5 + 1.0 for x in py_list]
t_py = (time.perf_counter() - t0) * 1000

# NumPy vectorized
t0 = time.perf_counter()
_ = np_arr * 2.5 + 1.0
t_np = (time.perf_counter() - t0) * 1000

print(f"Python loop: {t_py:.2f} ms")
print(f"NumPy math:  {t_np:.2f} ms")
print(f"Speedup:     {t_py / t_np:.1f}x")`,
            expectedOutput: `Python loop: ~45.0 ms
NumPy math:  ~0.4 ms
Speedup:     ~110x`,
            explanation: 'NumPy executes pre-compiled C loops with SIMD vectorization, running over 100x faster than the Python bytecode interpreter.'
          }
        ]
      },
      {
        id: 'ch2-scalar-elementwise',
        title: 'Scalar & Element-Wise Arithmetic: Whole-Array Math',
        icon: 'Layers',
        summary: 'Master scalar arithmetic (arr * 2) and parallel element-wise arithmetic (A + B, A - B, A * B, A / B).',
        markdownContent: `### Scalar Operations: Broadcasting a Number
Any scalar applied to an array affects every element automatically:
\`\`\`python
arr = np.array([10.0, 20.0, 30.0])

print(arr + 5)    # [15.0, 25.0, 35.0]
print(arr * 0.5)  # [ 5.0, 10.0, 15.0]
print(arr ** 2)   # [100.0, 400.0, 900.0]
\`\`\`

### Element-Wise Operations: Pairing Matching Elements
When two arrays have identical shapes, arithmetic operators pair corresponding elements:
\`\`\`python
a = np.array([100, 200, 300])
b = np.array([ 20,  50, 100])

print(a + b)  # [120, 250, 400]
print(a - b)  # [ 80, 150, 200]
print(a / b)  # [5.0, 4.0, 3.0]
\`\`\`

> **Key Rule:** In NumPy, \`A * B\` is **element-wise multiplication**, NOT matrix dot product! For matrix multiplication, use the \`@\` operator.`,
        codeSnippets: [
          {
            id: 'snip-elementwise',
            title: 'Element-Wise Financial Returns',
            code: `import numpy as np

current_prices = np.array([120.0, 85.0, 240.0])
baseline_prices = np.array([100.0, 100.0, 200.0])

# Calculate percentage return: (current - baseline) / baseline
returns = (current_prices - baseline_prices) / baseline_prices
print("Returns:", returns * 100, "%")`,
            expectedOutput: `Returns: [ 20. -15.  20.] %`,
            explanation: 'Subtractions and divisions happen element-by-element simultaneously across all items.'
          }
        ]
      },
      {
        id: 'ch3-ufuncs-fast-math',
        title: 'Universal Functions (Ufuncs): Fast Math with np.sqrt, np.exp, np.clip',
        icon: 'Sparkles',
        summary: 'Leverage universal functions like np.sqrt, np.exp, np.clip, and np.abs to construct vectorized pipelines.',
        markdownContent: `### Essential Universal Functions (Ufuncs)
NumPy provides fast C-level implementations of standard mathematical functions:

- \`np.abs(x)\`: Computes absolute value $|x|$.
- \`np.sqrt(x)\`: Computes square root $\\sqrt{x}$.
- \`np.exp(x)\`: Computes exponential $e^x$.
- \`np.clip(x, min_val, max_val)\`: Clamps values within bounds $[min, max]$.

### Data Guardrails with np.clip
In financial engineering, machine learning, and physical simulations, values can blow up or drop below zero:
\`\`\`python
prices = np.array([-5.0, 45.0, 120.0, 850.0])
# Guardrail prices between $10 and $500
guarded = np.clip(prices, 10.0, 500.0)
print(guarded)  # [ 10.  45. 120. 500.]
\`\`\`

### Chaining Math Pipelines
You can compose ufuncs naturally into clean mathematical formulas:
\`\`\`python
# Clamped exponential decay: y = clip(scale * exp(-decay * x), min_val, max_val)
y = np.clip(1.5 * np.exp(-0.2 * x), 0.05, 0.95)
\`\`\``,
        codeSnippets: [
          {
            id: 'snip-ufunc-pipeline',
            title: 'Composing Ufuncs in a Single Expression',
            code: `import numpy as np

x = np.array([-2.0, 0.0, 1.0, 5.0])
# Compute scale * exp(-0.5 * x) clamped to [0.1, 0.9]
out = np.clip(np.exp(-0.5 * x), 0.1, 0.9)
print("Clamped exp activations:", out)`,
            expectedOutput: `Clamped exp activations: [0.9        0.9        0.60653066 0.1       ]`,
            explanation: 'np.exp calculates exponentials across all elements, and np.clip enforces lower and upper boundaries.'
          }
        ]
      }
    ],
    commonTraps: [
      {
        title: 'Using Python math Module Functions on NumPy Arrays',
        badSnippet: `import math\n# TypeError: only size-1 arrays can be converted to Python scalars\ny = math.sqrt(arr)`,
        badExplanation: 'Python standard library math functions (math.sqrt, math.exp) only accept single scalar numbers.',
        goodSnippet: `import numpy as np\ny = np.sqrt(arr)  # Works on whole arrays instantly`,
        goodExplanation: 'NumPy ufuncs (np.sqrt, np.exp, np.abs) are designed specifically for whole-array evaluation.',
        perfImpact: 'Eliminate runtime crashes and unlock 100x SIMD speedups.'
      },
      {
        title: 'Writing for-loops for Element-Wise Operations',
        badSnippet: `diff = np.zeros(len(A))\nfor i in range(len(A)):\n    diff[i] = abs(A[i] - B[i])`,
        badExplanation: 'Iterating through ndarrays with a Python for loop is slow and defeats the entire purpose of NumPy.',
        goodSnippet: `diff = np.abs(A - B)  # Vectorized in one clean line`,
        goodExplanation: 'Delegates loop execution to compiled C SIMD kernels.',
        perfImpact: 'Over 50x to 150x faster execution.'
      },
      {
        title: 'Accidental Integer Division Truncation',
        badSnippet: `returns = (current_int - base_int) // base_int  # Floor division truncates to 0!`,
        badExplanation: 'Using integer floor division // discards fractional percentages (e.g. 15 / 100 becomes 0).',
        goodSnippet: `returns = (current_int.astype(float) - base_int) / base_int`,
        goodExplanation: 'Ensure float division / is used for accurate financial percentage changes.',
        perfImpact: 'Prevents catastrophic silent rounding bugs in financial metrics.'
      }
    ],
    apiCheatSheet: [
      {
        name: 'np.clip()',
        category: 'Ufunc / Clamping',
        signature: 'np.clip(a, a_min, a_max, out=None)',
        summary: 'Clip (limit) the values in an array between a minimum and maximum threshold.',
        parameters: [
          { name: 'a', type: 'array_like', desc: 'Array containing elements to clip.' },
          { name: 'a_min', type: 'scalar or array_like', desc: 'Minimum value threshold.' },
          { name: 'a_max', type: 'scalar or array_like', desc: 'Maximum value threshold.' }
        ],
        returns: 'An array with values outside the interval clipped to the boundary edges.',
        exampleSnippet: `x = np.array([1, 5, 10, 20])\nnp.clip(x, 3, 12)  # array([ 3,  5, 10, 12])`
      },
      {
        name: 'np.abs()',
        category: 'Ufunc / Math',
        signature: 'np.abs(x, out=None)',
        summary: 'Calculate the absolute value element-wise.',
        parameters: [
          { name: 'x', type: 'array_like', desc: 'Input array.' }
        ],
        returns: 'Absolute values of array elements.',
        exampleSnippet: `np.abs(np.array([-1.5, 2.0, -3.0]))  # array([1.5, 2.0, 3.0])`
      },
      {
        name: 'np.exp()',
        category: 'Ufunc / Math',
        signature: 'np.exp(x, out=None)',
        summary: 'Calculate the exponential of all elements in the input array (e^x).',
        parameters: [
          { name: 'x', type: 'array_like', desc: 'Input values.' }
        ],
        returns: 'Element-wise exponential of x.',
        exampleSnippet: `np.exp(np.array([0.0, 1.0]))  # array([1.0, 2.71828183])`
      },
      {
        name: 'np.sqrt()',
        category: 'Ufunc / Math',
        signature: 'np.sqrt(x, out=None)',
        summary: 'Return the non-negative square root of an array, element-wise.',
        parameters: [
          { name: 'x', type: 'array_like', desc: 'Input values.' }
        ],
        returns: 'Square root of each element in x.',
        exampleSnippet: `np.sqrt(np.array([4.0, 9.0, 16.0]))  # array([2.0, 3.0, 4.0])`
      }
    ],
    interactiveWidgetType: 'numpy-strides'
  },
  challenges: [
    {
      id: 'd4-c1',
      dayId: 4,
      partId: 4,
      title: 'Financial Return & Discount Calculator',
      slug: 'financial-return-discount-calculator',
      difficulty: 'Beginner',
      category: 'Vectorized Math',
      summary: 'Calculate percentage returns, absolute price changes, promotional discounts, and bound caps with zero Python loops.',
      mentalModel5s: 'Apply operations directly to whole arrays (current - baseline) / baseline. NumPy computes every element in parallel with no loops!',
      visualAnalogy: 'Instead of walking to 10,000 cash registers one by one with a pocket calculator, a single switch flips and applies a 15% discount across all store prices simultaneously.',
      pitfalls: [
        'Using Python for-loops instead of vectorized array expressions.',
        'Using floor division // instead of true division / for percentage calculations.',
        'Using math.abs instead of np.abs.',
        'Forgetting that shapes of current_prices and baseline_prices must match.'
      ],
      progressiveHints: [
        'Tier 1 (Percentage Returns): Compute percentage change via (current_prices - baseline_prices) / baseline_prices.',
        'Tier 2 (Absolute Change): Use the ufunc np.abs(current_prices - baseline_prices).',
        'Tier 3 (Discount): Calculate discounted prices using scalar multiplication: current_prices * (1.0 - discount_rate).',
        'Tier 4 (Clamping): Enforce price caps with np.clip(discounted, min_price_cap, max_price_cap).'
      ],
      deepInternals: {
        title: 'CPU SIMD Vector Registers',
        content: 'When evaluating (A - B) / B, modern compilers emit AVX instructions that compute vector subtractions and divisions across 4 double-precision floats in parallel, eliminating interpreter overhead.',
        keyRule: 'Formulate tabular arithmetic as whole-array expressions to leverage hardware SIMD.'
      },
      instructions: `Implement \`compute_financial_metrics\` to calculate essential pricing analytics using vectorized NumPy operations with ZERO Python loops.

**Requirements:**
1. Calculate \`'pct_return'\`: Percentage change \`(current_prices - baseline_prices) / baseline_prices\`.
2. Calculate \`'abs_diff'\`: Absolute price movement \`np.abs(current_prices - baseline_prices)\`.
3. Calculate \`'discounted'\`: Promotional prices \`current_prices * (1.0 - discount_rate)\`.
4. Calculate \`'capped_prices'\`: Discounted prices clamped within \`[min_price_cap, max_price_cap]\` using \`np.clip\`.
5. Return a dictionary with keys: \`'pct_return'\`, \`'abs_diff'\`, \`'discounted'\`, and \`'capped_prices'\`.
6. Works seamlessly across both 1D and 2D pricing matrices.
7. Must NOT contain any \`for\` or \`while\` loops.`,
      hints: [
        'Compute pct_return using element-wise division: (current_prices - baseline_prices) / baseline_prices.',
        'Use np.abs(...) for absolute differences.',
        'Apply discount using current_prices * (1.0 - discount_rate).',
        'Use np.clip(discounted, min_price_cap, max_price_cap) for bounding.'
      ],
      starterCode: `import numpy as np

def compute_financial_metrics(
    current_prices: np.ndarray,
    baseline_prices: np.ndarray,
    discount_rate: float = 0.15,
    min_price_cap: float = 5.0,
    max_price_cap: float = 500.0
) -> dict:
    """
    Compute financial metrics using zero Python loops:
    1. Percentage return: (current_prices - baseline_prices) / baseline_prices
    2. Absolute price change: |current_prices - baseline_prices|
    3. Discounted prices: current_prices * (1.0 - discount_rate)
    4. Capped prices: discounted prices clamped to [min_price_cap, max_price_cap] using np.clip
    
    Args:
        current_prices: numpy array of current prices
        baseline_prices: numpy array of same shape with baseline prices
        discount_rate: float percentage discount to apply (e.g. 0.15 for 15%)
        min_price_cap: minimum price floor
        max_price_cap: maximum price ceiling
        
    Returns:
        dict containing:
            'pct_return': percentage return array
            'abs_diff': absolute difference array
            'discounted': prices after discount
            'capped_prices': discounted prices clamped within [min_price_cap, max_price_cap]
    """
    # TODO: Implement zero-loop vectorized financial calculations
    pass
`,
      solutionCode: `import numpy as np

def compute_financial_metrics(
    current_prices: np.ndarray,
    baseline_prices: np.ndarray,
    discount_rate: float = 0.15,
    min_price_cap: float = 5.0,
    max_price_cap: float = 500.0
) -> dict:
    """
    Vectorized financial metrics computation with element-wise arithmetic and ufuncs.
    """
    if current_prices.shape != baseline_prices.shape:
        raise ValueError("current_prices and baseline_prices must have identical shapes")
        
    pct_return = (current_prices - baseline_prices) / baseline_prices
    abs_diff = np.abs(current_prices - baseline_prices)
    discounted = current_prices * (1.0 - discount_rate)
    capped_prices = np.clip(discounted, min_price_cap, max_price_cap)
    
    return {
        "pct_return": pct_return,
        "abs_diff": abs_diff,
        "discounted": discounted,
        "capped_prices": capped_prices,
    }
`,
      testCases: [
        { id: 't1', name: 'Basic Financial Metrics Verification', inputDescription: 'curr=[100, 200, 3, 1000], base=[80, 250, 4, 800]', expectedOutput: 'pct_return=[0.25, -0.2, -0.25, 0.25], capped=[85, 170, 5, 500]' },
        { id: 't2', name: '2D Matrix Shape Preservation', inputDescription: 'curr_2d shape (2,2), base_2d shape (2,2)', expectedOutput: 'All result arrays retain (2,2) shape' },
        { id: 't3', name: 'Large Scale Zero-Loop Benchmark', inputDescription: '250,000 prices', expectedOutput: 'Executes under 150ms' }
      ],
      benchmarkTargetMs: 0.25,
      memoryTargetMb: 0.15,
      conceptPrimer: {
        title: 'Vectorized Arithmetic in Financial Computing',
        subtitle: 'Replacing iterative row-by-row loops with whole-array math',
        overview: 'Vectorized arithmetic allows performing element-wise arithmetic and ufunc evaluations directly across multi-dimensional arrays at compiled C speed, eliminating Python loop overhead.',
        mentalModel5s: 'Mathematical expressions apply across entire arrays simultaneously.',
        visualAnalogy: 'A pricing scanner updating all shelf tags in an entire department store with one button push.',
        pitfalls: [
          'Using loops when array expressions are available.',
          'Forgetting to clamp values when bounds are specified.'
        ],
        progressiveHints: [
          'Tier 1: (curr - base) / base gives percentage returns.',
          'Tier 2: np.abs(curr - base) computes absolute deviations.',
          'Tier 3: curr * (1.0 - discount_rate) applies discounts.',
          'Tier 4: np.clip(discounted, min_cap, max_cap) clamps prices.'
        ],
        deepInternals: {
          title: 'Memory Locality & Loop Unrolling',
          content: 'Contiguous arrays enable CPU cache prefetchers to stream 64-byte cache lines without memory page thrashing.',
          keyRule: 'Always perform whole-array operations instead of item-by-item Python loops.'
        },
        mathFormulas: [
          {
            title: 'Percentage Return Formula',
            latex: 'R_i = \\frac{P_{\\text{curr}, i} - P_{\\text{base}, i}}{P_{\\text{base}, i}}',
            explanation: 'Computes normalized financial return for asset i.'
          },
          {
            title: 'Clamped Discount Formula',
            latex: 'P_{\\text{capped}, i} = \\text{clip}\\left(P_{\\text{curr}, i} \\times (1 - d), \\, P_{\\min}, \\, P_{\\max}\\right)',
            explanation: 'Applies discount rate d and clamps within regulatory boundaries.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Naive Python loop computation
def naive_metrics(curr, base, d, min_c, max_c):
    pct = []
    capped = []
    for i in range(len(curr)):
        pct.append((curr[i] - base[i]) / base[i])
        disc = curr[i] * (1.0 - d)
        if disc < min_c: disc = min_c
        elif disc > max_c: disc = max_c
        capped.append(disc)
    return pct, capped`,
          naiveExplanation: 'Incurs dynamic dispatch, object boxing, and append overhead on every iteration.',
          idiomaticCode: `# Vectorized NumPy math
def idiomatic_metrics(curr, base, d, min_c, max_c):
    pct = (curr - base) / base
    capped = np.clip(curr * (1.0 - d), min_c, max_c)
    return pct, capped`,
          idiomaticExplanation: 'Runs compiled C loops in AVX registers with zero Python interpreter overhead.',
          speedupText: '95x faster'
        },
        memoryLayout: {
          title: 'SIMD Contiguous Memory Alignment',
          content: 'Float64 elements are packed sequentially. One AVX-512 register loads 8 floats and calculates all 8 returns in one cycle.',
          diagramAscii: `Contiguous Buffer: [ P0 | P1 | P2 | P3 | P4 | P5 | P6 | P7 ]
                     ||   ||   ||   ||   ||   ||   ||   ||
AVX Operation:       [ * (1 - discount_rate) in 1 clock cycle ]`,
          keyRule: 'Hardware vectorization requires contiguous arrays of uniform datatype.'
        },
        keyTakeaways: [
          'Vectorization replaces Python loops with hardware-accelerated C routines.',
          'Scalar operations apply to every element automatically.',
          'Element-wise arithmetic requires matching array dimensions.',
          'np.clip provides fast upper and lower boundaries.'
        ]
      },
      sampleDataFrame: {
        name: 'Asset Pricing & Metrics Table',
        columns: ['Asset_Ticker', 'Baseline_Price', 'Current_Price', 'Return_Pct', 'Discounted_Price', 'Capped_Price'],
        dtypes: { Asset_Ticker: 'string', Baseline_Price: 'float64', Current_Price: 'float64', Return_Pct: 'float64', Discounted_Price: 'float64', Capped_Price: 'float64' },
        rows: [
          { Asset_Ticker: 'AAPL', Baseline_Price: 150.0, Current_Price: 180.0, Return_Pct: 20.0, Discounted_Price: 153.0, Capped_Price: 153.0 },
          { Asset_Ticker: 'GOOGL', Baseline_Price: 140.0, Current_Price: 133.0, Return_Pct: -5.0, Discounted_Price: 113.05, Capped_Price: 113.05 },
          { Asset_Ticker: 'PENNY', Baseline_Price: 2.0, Current_Price: 3.0, Return_Pct: 50.0, Discounted_Price: 2.55, Capped_Price: 5.0 }
        ],
        totalRows: 3,
        memoryUsageKb: 1.1
      },
      samplePlot: {
        id: 'p-financial',
        title: 'Vectorized Price Distribution & Clamping Thresholds',
        type: 'svg',
        description: 'Comparison of raw discounted prices vs clamped bounds across price brackets',
        svgContent: `<svg viewBox="0 0 600 320" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
          <rect width="600" height="320" fill="#0f172a" rx="8"/>
          <text x="30" y="35" fill="#f8fafc" font-size="16" font-weight="bold" font-family="system-ui">Vectorized Price Bounding: np.clip(prices, min, max)</text>
          <text x="30" y="58" fill="#94a3b8" font-size="12" font-family="system-ui">Zero-loop clamping enforces floor ($5.0) and ceiling ($500.0) guardrails</text>
          
          <!-- Axes -->
          <g transform="translate(60, 80)">
            <line x1="0" y1="180" x2="480" y2="180" stroke="#334155" stroke-width="1.5"/>
            <line x1="0" y1="0" x2="0" y2="180" stroke="#334155" stroke-width="1.5"/>
            
            <!-- Grid lines -->
            <line x1="0" y1="140" x2="480" y2="140" stroke="#1e293b" stroke-dasharray="4"/>
            <line x1="0" y1="90" x2="480" y2="90" stroke="#1e293b" stroke-dasharray="4"/>
            <line x1="0" y1="40" x2="480" y2="40" stroke="#1e293b" stroke-dasharray="4"/>
            
            <!-- Min clamp threshold (Floor) -->
            <line x1="0" y1="160" x2="480" y2="160" stroke="#ef4444" stroke-width="2" stroke-dasharray="5"/>
            <text x="400" y="153" fill="#ef4444" font-size="11" font-family="monospace">Floor: $5.0</text>
            
            <!-- Max clamp threshold (Ceiling) -->
            <line x1="0" y1="30" x2="480" y2="30" stroke="#38bdf8" stroke-width="2" stroke-dasharray="5"/>
            <text x="390" y="24" fill="#38bdf8" font-size="11" font-family="monospace">Ceiling: $500.0</text>
            
            <!-- Unclamped curve (Amber dashed) -->
            <path d="M 10 178 L 100 150 L 220 100 L 350 45 L 450 10" fill="none" stroke="#f59e0b" stroke-width="2" stroke-dasharray="3"/>
            <!-- Clamped curve (Green solid) -->
            <path d="M 10 160 L 50 160 L 100 150 L 220 100 L 350 45 L 390 30 L 450 30" fill="none" stroke="#10b981" stroke-width="3.5"/>
            
            <!-- Labels -->
            <text x="430" y="198" fill="#94a3b8" font-size="11" font-family="system-ui">Asset ID</text>
            <text x="-40" y="10" fill="#94a3b8" font-size="11" font-family="system-ui">Price ($)</text>
          </g>
          
          <!-- Legend -->
          <g transform="translate(100, 285)">
            <line x1="0" y1="10" x2="25" y2="10" stroke="#f59e0b" stroke-width="2" stroke-dasharray="3"/>
            <text x="32" y="14" fill="#94a3b8" font-size="11" font-family="system-ui">Raw Discounted Price</text>
            
            <line x1="180" y1="10" x2="205" y2="10" stroke="#10b981" stroke-width="3"/>
            <text x="212" y="14" fill="#10b981" font-weight="bold" font-size="11" font-family="system-ui">Capped Price (np.clip)</text>
          </g>
        </svg>`
      },
      expectedTensors: [
        { name: 'current_prices', shape: '(4,)', dtype: 'float64' },
        { name: 'pct_return', shape: '(4,)', dtype: 'float64' },
        { name: 'capped_prices', shape: '(4,)', dtype: 'float64' }
      ]
    },
    {
      id: 'd4-c2',
      dayId: 4,
      partId: 4,
      title: 'Clamped Activation Function',
      slug: 'clamped-activation-function',
      difficulty: 'Intermediate',
      category: 'Universal Functions',
      summary: 'Implement a custom clamped exponential decay activation function using np.clip and np.exp.',
      mentalModel5s: 'Chain ufuncs: np.clip(scale * np.exp(-decay * x) + bias, min_val, max_val). Each ufunc passes contiguous array data through fast C kernels.',
      visualAnalogy: 'A natural damping spring that smoothly decays large inputs toward zero, equipped with physical upper and lower stoppers (clamps) that prevent overshooting.',
      pitfalls: [
        'Using Python math.exp instead of np.exp (causes TypeError on array inputs).',
        'Writing loops over elements instead of vectorized expressions.',
        'Not maintaining the exact array dimensionality (e.g. flattening 3D tensors).'
      ],
      progressiveHints: [
        'Tier 1 (Decay Term): Compute the exponential argument via -decay * x.',
        'Tier 2 (Exponential Ufunc): Pass the decayed argument to np.exp(-decay * x).',
        'Tier 3 (Scale and Bias): Formulate raw = scale * np.exp(-decay * x) + bias.',
        'Tier 4 (Clamping): Enforce boundaries via np.clip(raw, min_val, max_val).'
      ],
      deepInternals: {
        title: 'Ufunc Pipeline Fusion',
        content: 'NumPy ufuncs evaluate element-by-element without allocating intermediate Python objects, preserving CPU data locality.',
        keyRule: 'Vectorize non-linear functions using standard ufuncs for seamless multidimensional broadcasting.'
      },
      instructions: `Implement \`clamped_exp_activation\` to compute a custom non-linear activation transformation:

$$y = \\text{clip}\\left(\\text{scale} \\cdot e^{-\\text{decay} \\cdot x} + \\text{bias}, \\, \\text{min\\_val}, \\, \\text{max\\_val}\\right)$$

**Requirements:**
1. Calculate the raw transformation using \`scale * np.exp(-decay * x) + bias\`.
2. Clamp values within \`[min_val, max_val]\` using \`np.clip\`.
3. Return the clamped activation array with the identical shape as input \`x\`.
4. Support arrays of any shape (1D, 2D, 3D) with zero Python loops.`,
      hints: [
        'Use -decay * x as the input to np.exp.',
        'Multiply the exponential result by scale and add bias.',
        'Pass the entire expression into np.clip(raw, min_val, max_val).'
      ],
      starterCode: `import numpy as np

def clamped_exp_activation(
    x: np.ndarray,
    scale: float = 1.0,
    decay: float = 0.5,
    bias: float = 0.0,
    min_val: float = 0.01,
    max_val: float = 0.99
) -> np.ndarray:
    """
    Compute clamped exponential decay activation using fast ufuncs:
    y = np.clip(scale * np.exp(-decay * x) + bias, min_val, max_val)
    
    Args:
        x: input numpy array of arbitrary shape
        scale: scalar amplitude multiplier
        decay: decay rate parameter
        bias: scalar or broadcastable bias offset added to the raw exponential
        min_val: lower clamping threshold
        max_val: upper clamping threshold
        
    Returns:
        np.ndarray: clamped activated values with the same shape as x
    """
    # TODO: Implement vectorized clamped exponential activation
    pass
`,
      solutionCode: `import numpy as np

def clamped_exp_activation(
    x: np.ndarray,
    scale: float = 1.0,
    decay: float = 0.5,
    bias: float = 0.0,
    min_val: float = 0.01,
    max_val: float = 0.99
) -> np.ndarray:
    """
    Vectorized clamped exponential decay activation function.
    """
    raw = scale * np.exp(-decay * x) + bias
    return np.clip(raw, min_val, max_val)
`,
      testCases: [
        { id: 't1', name: 'Boundary Clamping Check', inputDescription: 'x=[-10.0, 0.0, 2.0, 50.0]', expectedOutput: 'out[0]=0.99 (clamped max), out[-1]=0.01 (clamped min)' },
        { id: 't2', name: '3D Tensor Shape Preservation', inputDescription: 'x shape (4, 5, 6)', expectedOutput: 'Output shape (4, 5, 6) preserved' },
        { id: 't3', name: 'Large-Scale Performance Benchmark', inputDescription: '500,000 floats', expectedOutput: 'Executes under 150ms' }
      ],
      benchmarkTargetMs: 0.20,
      memoryTargetMb: 0.10,
      conceptPrimer: {
        title: 'Non-Linear Activations & Universal Function Composition',
        subtitle: 'Building custom mathematical transforms without Python loops',
        overview: 'Custom activations are common in neural networks and signal modeling. Composing ufuncs like np.exp and np.clip enables fast execution across multi-dimensional tensors.',
        mentalModel5s: 'Exponential decay smoothly dampens signals; np.clip sets strict upper and lower walls.',
        visualAnalogy: 'A spring with physical floor and ceiling bumpers preventing extreme oscillations.',
        pitfalls: [
          'Using Python math module instead of np.exp.',
          'Forgetting to clamp extreme values.'
        ],
        progressiveHints: [
          'Tier 1: Calculate -decay * x.',
          'Tier 2: Use np.exp(-decay * x).',
          'Tier 3: Add scale and bias.',
          'Tier 4: Wrap with np.clip(raw, min_val, max_val).'
        ],
        deepInternals: {
          title: 'SIMD Mathematical Vector Kernels',
          content: 'NumPy maps np.exp directly to vectorized C math library kernels (SVML/SLEEF) providing high-precision approximations in CPU registers.',
          keyRule: 'Keep activation formulas expressed in pure ufunc operations.'
        },
        mathFormulas: [
          {
            title: 'Clamped Activation Mathematical Definition',
            latex: 'f(x) = \\begin{cases} y_{\\max}, & \\text{if } \\alpha e^{-\\lambda x} + b > y_{\\max} \\\\ \\alpha e^{-\\lambda x} + b, & \\text{if } y_{\\min} \\le \\alpha e^{-\\lambda x} + b \\le y_{\\max} \\\\ y_{\\min}, & \\text{if } \\alpha e^{-\\lambda x} + b < y_{\\min} \\end{cases}',
            explanation: 'Piecewise mathematical representation of the clamped exponential function.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Naive nested loop implementation
def naive_activation(x, s, d, b, min_v, max_v):
    out = np.zeros_like(x, dtype=float)
    it = np.nditer(x, flags=['multi_index'])
    while not it.finished:
        val = s * np.exp(-d * it[0]) + b
        out[it.multi_index] = min(max_v, max(min_v, val))
        it.iternext()
    return out`,
          naiveExplanation: 'Using nditer loops in Python incurs massive per-element function call overhead.',
          idiomaticCode: `# Vectorized ufunc composition
def idiomatic_activation(x, s, d, b, min_v, max_v):
    return np.clip(s * np.exp(-d * x) + b, min_v, max_v)`,
          idiomaticExplanation: 'Dispatches directly to SIMD vectorized C routines in one line.',
          speedupText: '120x faster'
        },
        memoryLayout: {
          title: 'In-Register Activation Streaming',
          content: 'Ufuncs compute activations on streaming memory buffers, maximizing L1 data cache residency.',
          diagramAscii: `Input Stream:   [ x0 | x1 | x2 | x3 ]
                     |    |    |    |   --> [ np.exp(-decay * x) ]
Clamped Stream: [ y0 | y1 | y2 | y3 ]   --> [ np.clip(..., min, max) ]`,
          keyRule: 'Preserve input shapes and let NumPy handle vectorization across all axes.'
        },
        keyTakeaways: [
          'np.exp executes element-wise exponential transformations.',
          'np.clip prevents numerical instability and exploding activations.',
          'Ufunc chaining works seamlessly across tensors of any dimensionality.',
          'Zero loops ensure maximum performance.'
        ]
      },
      sampleDataFrame: {
        name: 'Activation Output Sampling',
        columns: ['Input_X', 'Decay_Rate', 'Raw_Exp', 'Clamped_Activation'],
        dtypes: { Input_X: 'float64', Decay_Rate: 'float64', Raw_Exp: 'float64', Clamped_Activation: 'float64' },
        rows: [
          { Input_X: -10.0, Decay_Rate: 0.5, Raw_Exp: 148.41, Clamped_Activation: 0.99 },
          { Input_X: 0.0, Decay_Rate: 0.5, Raw_Exp: 1.0, Clamped_Activation: 0.99 },
          { Input_X: 2.0, Decay_Rate: 0.5, Raw_Exp: 0.368, Clamped_Activation: 0.368 },
          { Input_X: 50.0, Decay_Rate: 0.5, Raw_Exp: 1.38e-11, Clamped_Activation: 0.01 }
        ],
        totalRows: 4,
        memoryUsageKb: 1.2
      },
      samplePlot: {
        id: 'p-activation',
        title: 'Clamped Exponential Activation Function Curve',
        type: 'svg',
        description: 'Plot of the clamped exponential decay activation with upper and lower saturation limits',
        svgContent: `<svg viewBox="0 0 600 320" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
          <rect width="600" height="320" fill="#0f172a" rx="8"/>
          <text x="30" y="35" fill="#f8fafc" font-size="16" font-weight="bold" font-family="system-ui">Clamped Exponential Decay: np.clip(exp(-0.5 * x), 0.01, 0.99)</text>
          <text x="30" y="58" fill="#94a3b8" font-size="12" font-family="system-ui">Smooth non-linear transition with hard clamping saturation floors and ceilings</text>
          
          <g transform="translate(60, 80)">
            <line x1="0" y1="180" x2="480" y2="180" stroke="#334155" stroke-width="1.5"/>
            <line x1="160" y1="0" x2="160" y2="180" stroke="#334155" stroke-width="1.5"/>
            
            <!-- Horizontal Clamping Guides -->
            <line x1="0" y1="20" x2="480" y2="20" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="4"/>
            <text x="370" y="15" fill="#ef4444" font-size="11" font-family="monospace">max_val = 0.99</text>
            
            <line x1="0" y1="165" x2="480" y2="165" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="4"/>
            <text x="370" y="160" fill="#38bdf8" font-size="11" font-family="monospace">min_val = 0.01</text>
            
            <!-- Activation Curve -->
            <!-- Clamped flat region at top left -->
            <path d="M 10 20 L 120 20 Q 150 22 170 50 T 260 140 T 360 165 L 470 165" fill="none" stroke="#10b981" stroke-width="3.5"/>
            
            <!-- Axis tick labels -->
            <text x="155" y="198" fill="#94a3b8" font-size="11" font-family="monospace">0</text>
            <text x="80" y="198" fill="#94a3b8" font-size="11" font-family="monospace">-2</text>
            <text x="240" y="198" fill="#94a3b8" font-size="11" font-family="monospace">+2</text>
            <text x="340" y="198" fill="#94a3b8" font-size="11" font-family="monospace">+4</text>
            <text x="440" y="198" fill="#94a3b8" font-size="11" font-family="monospace">+6</text>
            
            <text x="450" y="215" fill="#94a3b8" font-size="11" font-family="system-ui">Input (x)</text>
            <text x="-40" y="10" fill="#94a3b8" font-size="11" font-family="system-ui">Output (y)</text>
          </g>
          
          <g transform="translate(100, 290)">
            <circle cx="10" cy="5" r="5" fill="#10b981"/>
            <text x="24" y="9" fill="#10b981" font-weight="bold" font-size="12" font-family="system-ui">Clamped Activation Output</text>
            
            <circle cx="230" cy="5" r="5" fill="#ef4444"/>
            <text x="244" y="9" fill="#ef4444" font-size="12" font-family="system-ui">Saturation Thresholds</text>
          </g>
        </svg>`
      },
      expectedTensors: [
        { name: 'x', shape: '(4,)', dtype: 'float64' },
        { name: 'out', shape: '(4,)', dtype: 'float64' }
      ]
    }
  ]
};

export const PART04_TRACK = DAY04_TRACK;
export const DAY04_VECTORIZED_MATH_TRACK = DAY04_TRACK;
export const PART04_VECTORIZED_MATH_TRACK = DAY04_TRACK;
export default DAY04_TRACK;
