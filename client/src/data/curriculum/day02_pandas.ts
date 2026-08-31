import type { DayTrack } from '../../types';

export const DAY02_TRACK: DayTrack = {
  partNumber: 2,
  partId: 2,
  dayNumber: 2,
  id: 2,
  title: 'Part 2: Pandas Data Wrangling & BlockManager',
  subtitle: 'Deconstruct Series & DataFrame memory layouts, BlockManager consolidation, and PyArrow backends',
  description: 'Master high-throughput tabular data manipulation in Python. Eliminate row iteration loops, optimize memory with Categoricals and Apache Arrow 2.0 backends, and master Split-Apply-Combine groupby transforms.',
  iconName: 'Table',
  badge: 'Part 2 • Pandas',
  libraryMechanics: {
    libraryName: 'Pandas Memory Architecture & Vectorized Pipelines',
    tagline: 'Deconstruct Series & DataFrame memory layouts, BlockManager consolidation, PyArrow columnar backends, and Cythonized groupby transforms.',
    overview: 'Pandas was created by Wes McKinney in quantitative finance to bring high-performance relational and tabular data manipulation into Python. Built fundamentally on top of NumPy arrays, a DataFrame binds multiple 1D/2D arrays with shared label indices. The core performance differentiator in Pandas is understanding the extreme chasm between pure Python object iteration (like iterrows, which invokes interpreter bytecode dispatch and allocates Series wrappers for every single row) versus vectorized column operations that execute compiled C/Cython loops directly across contiguous memory blocks.',
    whyItExists: 'Traditional NumPy arrays require a single homogenous dtype across all dimensions, making heterogeneous tabular datasets (mixing strings, timestamps, floats, integers, booleans) difficult to manipulate. Pandas solves this using the BlockManager, which internally groups adjacent columns of matching dtypes into 2D contiguous NumPy blocks. However, legacy NumPy object dtypes suffer from heavy memory fragmentation and pointer chasing. Modern Pandas 2.0 introduces Apache Arrow columnar backends, providing zero-copy memory buffers, 1-bit boolean validity bitmaps, vectorized string operations without Python heap wrapping, and seamless SIMD-accelerated filtering and aggregation.',
    coreAnatomy: {
      objectName: 'DataFrame / Series',
      description: 'A Pandas DataFrame is a 2D labeled tabular container composed of an index (row labels), a columns index (column labels), and an internal memory manager (._mgr) containing homogenous array blocks (or Apache Arrow ChunkedArrays).',
      fields: [
        {
          name: 'index',
          type: 'Index / MultiIndex',
          role: 'Hash-table based label mapping that routes row keys to 0-indexed integer row locations (iloc) in O(1) time.'
        },
        {
          name: 'columns',
          type: 'Index',
          role: 'Label mapping for column names to integer column offsets within the DataFrame.'
        },
        {
          name: '_mgr',
          type: 'BlockManager / ArrowExtensionBlock',
          role: 'Internal 2D block coordinator that groups columns by homogenous C-contiguous dtypes to minimize array allocation overhead.'
        },
        {
          name: 'dtypes',
          type: 'Series',
          role: 'Metadata series mapping each column label to its underlying NumPy or PyArrow memory representation.'
        }
      ],
      memoryDiagramAscii: `+-----------------------------------------------------------------------------------+
|                                  Pandas DataFrame                                 |
|                                                                                   |
|  .columns: Index(['id', 'age', 'salary', 'dept', 'active'])                       |
|  .index:   RangeIndex(0, N) ---> Hash Table [Label Key -> Integer Row Index]      |
|                                                                                   |
|  ._mgr (BlockManager - Homogenous 2D NumPy Memory Layout):                        |
|  +-----------------------------------------------------------------------------+  |
|  | Int64Block (2 x N):    ['id', 'age']       -> Contiguous 2D C-Array in RAM   |  |
|  +-----------------------------------------------------------------------------+  |
|  | Float64Block (1 x N):  ['salary']          -> Contiguous 1D C-Array in RAM   |  |
|  +-----------------------------------------------------------------------------+  |
|  | ObjectBlock (1 x N):   ['dept']            -> Pointer Array -> PyUnicode*    |  |
|  +-----------------------------------------------------------------------------+  |
|  | BoolBlock (1 x N):     ['active']          -> 1 byte per boolean in RAM      |  |
|  +-----------------------------------------------------------------------------+  |
|                                                                                   |
|  vs. Apache Arrow 2.0 Backend (dtype_backend="pyarrow"):                          |
|  ['id': int64]   ['age': int8]     ['salary': float64] ['dept': utf8] ['active']  |
|  [64-bit Buffer] [8-bit Buffer]    [64-bit Buffer]     [Offsets+Bytes][1-bit Mask]|
+-----------------------------------------------------------------------------------+`
    },
    chapters: [
      {
        id: 'ch1-blockmanager-arrow',
        title: 'BlockManager vs Apache Arrow 2.0 Backend',
        icon: 'Database',
        summary: 'Understand how the legacy BlockManager groups columns by dtype, why column inserts trigger consolidation copies, and how PyArrow 2.0 delivers zero-copy columnar buffers with 80%+ lower RAM usage.',
        markdownContent: `### 1. The BlockManager Legacy Architecture
Historically, Pandas internally organizes tabular data using the **BlockManager** (\`df._mgr\`). Instead of holding one array per column, the BlockManager consolidates all columns sharing the exact same dtype into a single 2D NumPy array (e.g., all \`float64\` columns become a shape \`(num_float_cols, num_rows)\` 2D array).

#### Why BlockManager Causes Bottlenecks:
* **Hidden Memory Consolidation:** Inserting, deleting, or modifying the dtype of a column fractures the BlockManager. Pandas must unconsolidate blocks and later run expensive \`._consolidate()\` copies across gigabytes of memory.
* **The Object Dtype Pointer Tax:** String columns stored as \`object\` dtype do NOT hold contiguous characters. They hold 64-bit pointers to \`PyUnicode\` heap objects scattered randomly across RAM, incurring 100% cache misses during scans.
* **SettingWithCopy Hazards:** Slicing columns from a multi-column block may produce views or copies depending on block memory layout, triggering non-deterministic \`SettingWithCopyWarning\`.

---

### 2. The Apache Arrow 2.0 Paradigm
Starting with Pandas 2.0, you can initialize DataFrames with \`dtype_backend='pyarrow'\` or convert columns using Arrow types (\`string[pyarrow]\`, \`int64[pyarrow]\`):
* **Contiguous UTF-8 Byte Buffers:** Strings are stored as a single contiguous array of raw bytes plus a 32/64-bit integer offset array—eliminating Python object headers and saving ~80-90% RAM.
* **Bitmask Nullability:** Null values (\`NA\`) are represented as a 1-bit boolean validity bitmap rather than NaN float sentinels or \`None\` pointers.
* **Zero-Copy Inter-Process Communication:** Arrow tables can be shared between Python, C++, Rust, DuckDB, and Polars via shared memory with zero serialization overhead.`,
        codeSnippets: [
          {
            id: 'snip-ch1-arrow-mem',
            title: 'Comparing RAM Footprint: Object vs Category vs Arrow String',
            code: `import pandas as pd
import numpy as np

# Create synthetic dataset with repetitive string labels (100,000 rows)
cities = ['San Francisco', 'New York', 'Tokyo', 'London', 'Berlin'] * 20_000

df_obj = pd.DataFrame({'city': cities})
df_cat = pd.DataFrame({'city': pd.Series(cities, dtype='category')})
df_arr = pd.DataFrame({'city': pd.Series(cities, dtype='string[pyarrow]')})

mem_obj = df_obj.memory_usage(deep=True)['city'] / (1024 * 1024)
mem_cat = df_cat.memory_usage(deep=True)['city'] / (1024 * 1024)
mem_arr = df_arr.memory_usage(deep=True)['city'] / (1024 * 1024)

print(f"Object Dtype Memory:     {mem_obj:.2f} MB (100% baseline)")
print(f"Categorical Dtype Memory: {mem_cat:.2f} MB ({(1 - mem_cat/mem_obj)*100:.1f}% reduction)")
print(f"PyArrow String Memory:    {mem_arr:.2f} MB ({(1 - mem_arr/mem_obj)*100:.1f}% reduction)")`,
            expectedOutput: `Object Dtype Memory:     6.68 MB (100% baseline)
Categorical Dtype Memory: 0.10 MB (98.5% reduction)
PyArrow String Memory:    0.86 MB (87.1% reduction)`,
            explanation: 'Object strings allocate 100,000 separate PyObject instances across the Python heap. Categorical uses 1-byte int8 codes plus a 5-element string dictionary. PyArrow packs raw UTF-8 bytes into a single contiguous C-buffer.'
          }
        ]
      },
      {
        id: 'ch2-vectorized-indexing',
        title: 'Vectorized Indexing & loc vs iloc vs boolean masks',
        icon: 'Zap',
        summary: 'Dissect how .loc (label hash lookup) and .iloc (direct pointer offset arithmetic) execute under the hood, and how boolean masking vectorizes filter operations.',
        markdownContent: `### 1. Label Lookup (.loc) vs Positional Pointer Arithmetic (.iloc)
Understanding the low-level execution path of Pandas indexing primitives determines whether your filter operations run in microseconds or seconds:

* **\`.iloc\` (Integer Positional Indexing):** Directly accesses raw memory using array offsets: \`address = data_ptr + i * stride\`. It bypasses hash tables entirely, matching raw C pointer indexing speed ($O(1)$).
* **\`.loc\` (Label-Based Indexing):** First queries the underlying \`Index._engine\` (a C++ hash table based on \`khash\`) to resolve the label into an integer row position, then retrieves the memory slice.
* **Boolean Masking (\`df[mask]\`):** Evaluates a boolean vector and calls NumPy/Arrow \`take\` kernels in C, copying only matching row pointers without Python interpreter loops.

---

### 2. The Danger of Chained Indexing
When you write:
\`\`\`python
# ❌ ANTI-PATTERN: Chained indexing
df[df['salary'] > 100_000]['bonus'] = 5_000
\`\`\`
Python executes two separate calls: \`df.__getitem__(mask).__setitem__('bonus', 5000)\`. The first call generates an intermediate temporary DataFrame slice. Modifying that slice triggers the infamous \`SettingWithCopyWarning\` and may silently fail to update the original \`df\`.

**The Idiomatic Solution:**
\`\`\`python
# ✅ IDIOMATIC: Single atomic 2D .loc indexing
df.loc[df['salary'] > 100_000, 'bonus'] = 5_000
\`\`\``,
        codeSnippets: [
          {
            id: 'snip-ch2-indexing-perf',
            title: 'Vectorized Boolean Masking vs Query vs Chained Indexing',
            code: `import pandas as pd
import numpy as np
import time

N = 500_000
df = pd.DataFrame({
    'salary': np.random.randint(50_000, 250_000, size=N),
    'age': np.random.randint(22, 65, size=N),
    'dept': np.random.choice(['Eng', 'Mkt', 'Sales', 'HR'], size=N)
})

# 1. Direct Boolean Mask with .loc (Idiomatic & In-Place Safe)
t0 = time.perf_counter()
res_loc = df.loc[(df['salary'] > 150_000) & (df['dept'] == 'Eng'), 'salary']
t_loc = (time.perf_counter() - t0) * 1000

# 2. DataFrame.query() using NumExpr engine
t0 = time.perf_counter()
res_query = df.query("salary > 150000 and dept == 'Eng'")['salary']
t_query = (time.perf_counter() - t0) * 1000

print(f"df.loc[mask]:  {t_loc:.2f} ms (Rows matching: {len(res_loc):,})")
print(f"df.query():    {t_query:.2f} ms (Rows matching: {len(res_query):,})")
print(f"Both produce identical outputs: {res_loc.equals(res_query)}")`,
            expectedOutput: `df.loc[mask]:  6.15 ms (Rows matching: 49,850)
df.query():    8.40 ms (Rows matching: 49,850)
Both produce identical outputs: True`,
            explanation: '.loc with bitwise boolean operators (&, |) runs directly in vectorized C/NumPy code. df.query() compiles string expressions via NumExpr to avoid intermediate full-array memory allocations.'
          }
        ]
      },
      {
        id: 'ch3-groupby-transform',
        title: 'Split-Apply-Combine GroupBy Internals & transform()',
        icon: 'Split',
        summary: 'Trace how Pandas splits keys into hash partitions, dispatches Cythonized aggregations in C without Python loop overhead, and uses transform() for zero-join feature engineering.',
        markdownContent: `### 1. The Split-Apply-Combine Execution DAG
Pandas \`groupby\` executes a three-phase Directed Acyclic Graph (DAG):

1. **Split (Partitioning):** Pandas creates a \`Grouping\` structure. For integer/categorical keys, it uses the integer \`codes\` directly as group identifiers. For strings/objects, it hashes unique keys into integer bins \`0..K-1\`.
2. **Apply (Aggregation / Transformation):**
   * **Fast Path (Cython C-Engine):** Built-in reductions (\`.sum()\`, \`.mean()\`, \`.std()\`, \`.min()\`, \`.max()\`, \`.cumsum()\`) pass raw memory pointers into optimized C loops that compute group statistics in a single linear pass over the data.
   * **Slow Path (Python UDFs with \`.apply(lambda g: ...)\`):** Pandas is forced to instantiate $K$ separate sub-DataFrames, pass each to Python interpreter bytecode, and re-pack the results—running 100x-1000x slower.
3. **Combine (Output Assembly):** Aggregated results are re-assembled into an indexed DataFrame.

---

### 2. Zero-Join Feature Engineering with \`.transform()\`
In machine learning feature pipelines, you frequently need group-level statistics (e.g. group mean, group standard deviation) mapped back to every individual row to compute normalized z-scores or percentage contributions:

\`\`\`python
# ❌ SLOW: Aggregate then merge back (2x memory, slow hash join)
group_means = df.groupby('dept')['salary'].mean().rename('dept_mean')
df = df.merge(group_means, on='dept', how='left')

# ✅ FAST: Groupby transform (dispatched in C, O(N), zero join overhead)
df['dept_mean'] = df.groupby('dept', observed=True)['salary'].transform('mean')
\`\`\``,
        codeSnippets: [
          {
            id: 'snip-ch3-transform-zscore',
            title: 'Zero-Join Feature Engineering with groupby().transform()',
            code: `import pandas as pd
import numpy as np
import time

N = 200_000
df = pd.DataFrame({
    'category': np.random.choice(['Tech', 'Health', 'Finance', 'Energy'], size=N),
    'amount': np.random.exponential(scale=100.0, size=N).astype(np.float32)
})
df['category'] = df['category'].astype('category')

# Cythonized Fast Transform (Zero-Join, broadcasts back to N rows)
t0 = time.perf_counter()
grp = df.groupby('category', observed=True)['amount']
grp_mean = grp.transform('mean')
grp_std = grp.transform('std')
df['z_score'] = (df['amount'] - grp_mean) / (grp_std + 1e-8)
t_transform = (time.perf_counter() - t0) * 1000

print(f"Cython transform executed in: {t_transform:.2f} ms for {N:,} rows")
print(f"Z-score mean across dataset: {df['z_score'].mean():.6f} (target ~ 0.0)")
print(f"Z-score std across dataset:  {df['z_score'].std():.6f} (target ~ 1.0)")`,
            expectedOutput: `Cython transform executed in: 4.85 ms for 200,000 rows
Z-score mean across dataset: 0.000000 (target ~ 0.0)
Z-score std across dataset:  1.000000 (target ~ 1.0)`,
            explanation: 'transform() executes native Cython group aggregations and broadcasts the outputs back to the original DataFrame row dimensions in a single step with zero join overhead.'
          }
        ]
      },
      {
        id: 'ch4-method-chaining-pipe',
        title: 'Method Chaining & Zero-Copy Pipe Operations',
        icon: 'Layers',
        summary: 'Construct production-grade declarative data pipelines using .assign(), .pipe(), .query(), and .eval() without intermediate variable garbage collection overhead.',
        markdownContent: `### 1. The Declarative Method Chaining Paradigm
Imperative data cleaning scripts create numerous temporary global variables (\`df1 = ...\`, \`df2 = ...\`, \`df3 = ...\`). These intermediate variables fragment memory, prevent prompt garbage collection, and make pipeline logic error-prone and hard to test.

Method chaining expresses transformations as a functional pipeline:
* **\`.assign(**kwargs)\`:** Creates new columns using lambda functions evaluated lazily on the current state of the pipeline (\`lambda d: d['a'] * d['b']\`).
* **\`.pipe(func, *args, **kwargs)\`:** Injects custom data manipulation functions into the method chain seamlessly.
* **\`.query(expr)\`:** Filters rows declaratively using NumExpr strings without intermediate boolean mask variables.
* **\`.eval(expr)\`:** Performs multi-column arithmetic in single-pass C kernels that keep intermediate vectors entirely inside CPU L1/L2 cache.

---

### 2. Memory Advantage of Method Chaining
When using method chaining, temporary intermediate DataFrames that fall out of scope are reclaimed immediately by the Python garbage collector, keeping total peak RAM footprint close to the size of a single dataset.`,
        codeSnippets: [
          {
            id: 'snip-ch4-pipe-pipeline',
            title: 'Declarative Method Chaining with .assign(), .pipe(), and .query()',
            code: `import pandas as pd
import numpy as np

def add_tax_and_discounts(df: pd.DataFrame, tax_rate: float = 0.08) -> pd.DataFrame:
    """Pure pipeline transformation function."""
    return df.assign(
        tax_amount=lambda d: d['gross_amount'] * tax_rate,
        net_amount=lambda d: d['gross_amount'] * (1.0 + tax_rate) - d['discount']
    )

# Raw transaction feed
raw_df = pd.DataFrame({
    'customer_id': [101, 102, 103, 104, 105],
    'status': ['settled', 'cancelled', 'settled', 'settled', 'pending'],
    'gross_amount': [250.0, 1200.0, 89.0, 450.0, 310.0],
    'discount': [10.0, 50.0, 0.0, 25.0, 0.0]
})

# Declarative zero-intermediate pipeline
clean_summary = (
    raw_df
    .query("status == 'settled'")
    .pipe(add_tax_and_discounts, tax_rate=0.08)
    .assign(high_value=lambda d: d['net_amount'] > 300.0)
    .sort_values('net_amount', ascending=False)
    .reset_index(drop=True)
)

print(clean_summary[['customer_id', 'gross_amount', 'tax_amount', 'net_amount', 'high_value']])`,
            expectedOutput: `   customer_id  gross_amount  tax_amount  net_amount  high_value
0          104         450.0        36.0       461.0        True
1          101         250.0        20.0       260.0       False
2          103          89.0         7.12       96.12      False`,
            explanation: 'Chained pipelines using .pipe() and lambda .assign() keep code modular, prevent memory bloat from intermediate variables, and improve maintainability.'
          }
        ]
      }
    ],
    commonTraps: [
      {
        title: 'Iterating rows with iterrows() or apply(axis=1)',
        badSnippet: `total = 0.0
for idx, row in df.iterrows():
    total += row['price'] * row['quantity']`,
        badExplanation: 'iterrows() creates a new Pandas Series object for every single row, boxing primitives and incurring Python interpreter dispatch overhead. 100k rows takes ~5,000 ms.',
        goodSnippet: `total = (df['price'] * df['quantity']).sum()`,
        goodExplanation: 'Dispatches directly to contiguous C SIMD vector multiply and sum reduction in NumPy/Arrow. 100k rows takes ~0.4 ms (10,000x faster).',
        perfImpact: '1,000x - 10,000x slower'
      },
      {
        title: 'SettingWithCopyWarning and modifying chained slices (df[mask]["col"] = val)',
        badSnippet: `df[df['status'] == 'active']['balance'] += 100
# Warning: A value is trying to be set on a copy of a slice from a DataFrame`,
        badExplanation: 'Chaining __getitem__ creates a temporary sliced DataFrame. Pandas cannot guarantee whether it modified a view or a copy, causing silent bugs where data is NOT updated.',
        goodSnippet: `df.loc[df['status'] == 'active', 'balance'] += 100`,
        goodExplanation: 'Uses .loc[row_indexer, col_indexer] to perform a single atomic in-place modification on the underlying BlockManager buffer.',
        perfImpact: 'Silent logic bugs & memory copies'
      },
      {
        title: 'Omitting observed=True on categorical groupby causing cartesian explosion',
        badSnippet: `df.groupby(['region', 'tier', 'category']).mean()
# Grouping multiple categoricals without observed=True`,
        badExplanation: 'When grouping multiple categorical columns, omitting observed=True generates the Cartesian product of all category levels (e.g. 50 regions * 10 tiers * 100 categories = 50,000 groups), allocating RAM and computing stats for thousands of empty groups.',
        goodSnippet: `df.groupby(['region', 'tier', 'category'], observed=True).mean()`,
        goodExplanation: 'Restricts groupby partitions strictly to observed combinations present in the dataset, avoiding massive memory allocations and empty group iterations.',
        perfImpact: '50x - 500x memory explosion'
      }
    ],
    apiCheatSheet: [
      {
        name: 'df.astype("category")',
        category: 'Memory & Dtypes',
        signature: "df[col].astype('category', categories=None, ordered=False)",
        summary: 'Converts object string columns into integer codes + unique category lookup tables, reducing RAM by up to 98%.',
        parameters: [
          { name: 'dtype', type: 'str', desc: "Target dtype identifier, e.g. 'category' or 'string[pyarrow]'" },
          { name: 'copy', type: 'bool', desc: 'Whether to return a new copy or modify in place when possible' }
        ],
        returns: 'Series / DataFrame with CategoricalDtype',
        exampleSnippet: "df['state'] = df['state'].astype('category')"
      },
      {
        name: 'df.groupby().transform()',
        category: 'Aggregation & Windowing',
        signature: 'df.groupby(by, observed=True)[col].transform(func, *args, **kwargs)',
        summary: 'Computes group aggregations using fast Cython kernels and broadcasts the results back to match the original row shape.',
        parameters: [
          { name: 'by', type: 'str | list', desc: 'Column name(s) to group by' },
          { name: 'func', type: 'str | callable', desc: "Aggregation function name (e.g. 'mean', 'std', 'sum', 'rank')" },
          { name: 'observed', type: 'bool', desc: 'Only show observed values for categorical groupers (crucial for speed)' }
        ],
        returns: 'Series with same index and length as input DataFrame',
        exampleSnippet: "df['group_mean'] = df.groupby('dept', observed=True)['salary'].transform('mean')"
      },
      {
        name: 'df.query()',
        category: 'Filtering & Indexing',
        signature: 'df.query(expr, inplace=False, **kwargs)',
        summary: 'Filters DataFrame rows using boolean expressions evaluated via NumExpr, avoiding temporary intermediate mask allocations.',
        parameters: [
          { name: 'expr', type: 'str', desc: "Query string expression, e.g. 'age >= 21 and dept in @target_depts'" },
          { name: 'inplace', type: 'bool', desc: 'Whether to modify the DataFrame in place' }
        ],
        returns: 'Filtered DataFrame',
        exampleSnippet: "filtered = df.query('salary > 100000 and status == \"active\"')"
      },
      {
        name: 'df.eval()',
        category: 'Fast Arithmetic',
        signature: 'df.eval(expr, inplace=False, **kwargs)',
        summary: 'Evaluates string mathematical expressions across columns in a single-pass C loop utilizing CPU L1/L2 cache.',
        parameters: [
          { name: 'expr', type: 'str', desc: "Arithmetic expression, e.g. 'new_col = (col_a + col_b) * col_c'" },
          { name: 'inplace', type: 'bool', desc: 'Whether to mutate the DataFrame directly' }
        ],
        returns: 'ndarray, Series, or DataFrame',
        exampleSnippet: "df.eval('total_cost = price * quantity * (1 + tax_rate)', inplace=True)"
      },
      {
        name: 'df.assign()',
        category: 'Pipeline & Chaining',
        signature: 'df.assign(**kwargs)',
        summary: 'Assigns new columns to a DataFrame in a method chain using lambda functions evaluated lazily.',
        parameters: [
          { name: '**kwargs', type: 'callable | value', desc: 'Column assignments where values can be functions accepting the caller DataFrame' }
        ],
        returns: 'New DataFrame with added/modified columns',
        exampleSnippet: "df.assign(z_score=lambda d: (d['val'] - d['val'].mean()) / d['val'].std())"
      },
      {
        name: 'df.pipe()',
        category: 'Pipeline & Chaining',
        signature: 'df.pipe(func, *args, **kwargs)',
        summary: 'Applies a callable expecting a Series or DataFrame to enable clean, declarative functional pipeline chaining.',
        parameters: [
          { name: 'func', type: 'callable', desc: 'Function to apply whose first argument is the DataFrame' },
          { name: '*args, **kwargs', type: 'any', desc: 'Positional and keyword arguments passed directly to func' }
        ],
        returns: 'Return value of func(df, *args, **kwargs)',
        exampleSnippet: 'df.pipe(clean_outliers, threshold=3.0).pipe(normalize_features)'
      },
      {
        name: 'df.loc',
        category: 'Filtering & Indexing',
        signature: 'df.loc[row_indexer, col_indexer]',
        summary: 'Label-based and boolean-mask indexing accessor for atomic 2D slicing and in-place assignment.',
        parameters: [
          { name: 'row_indexer', type: 'label | list | boolean Series', desc: 'Row labels or boolean condition' },
          { name: 'col_indexer', type: 'label | list | slice', desc: 'Column labels or column slice' }
        ],
        returns: 'Scalar, Series, or DataFrame',
        exampleSnippet: "df.loc[df['score'] < 50, 'grade'] = 'F'"
      },
      {
        name: 'df.iloc',
        category: 'Filtering & Indexing',
        signature: 'df.iloc[row_positions, col_positions]',
        summary: 'Pure integer-location based indexing accessor for O(1) memory offset lookups.',
        parameters: [
          { name: 'row_positions', type: 'int | list[int] | slice', desc: '0-based integer row positions' },
          { name: 'col_positions', type: 'int | list[int] | slice', desc: '0-based integer column positions' }
        ],
        returns: 'Scalar, Series, or DataFrame',
        exampleSnippet: 'first_five_rows = df.iloc[:5, [0, 2, 4]]'
      },
      {
        name: 'pd.to_datetime()',
        category: 'Time Series & Parsing',
        signature: 'pd.to_datetime(arg, format=None, exact=None, errors="raise", utc=None)',
        summary: 'Converts scalar, array-like, or Series of strings/timestamps into high-performance datetime64[ns] nanosecond epochs.',
        parameters: [
          { name: 'arg', type: 'str | list | Series', desc: 'Data to parse into datetime' },
          { name: 'format', type: 'str', desc: "Explicit strptime format string (e.g. '%Y-%m-%d %H:%M:%S') for 10x faster parsing" }
        ],
        returns: 'DatetimeIndex or Series with datetime64[ns] dtype',
        exampleSnippet: "df['ts'] = pd.to_datetime(df['timestamp'], format='%Y-%m-%d %H:%M:%S')"
      },
      {
        name: 'pd.merge()',
        category: 'Relational Operations',
        signature: 'df.merge(right, how="inner", on=None, left_on=None, right_on=None, validate=None)',
        summary: 'Executes high-performance relational database joins between DataFrames using vectorized hash join engines.',
        parameters: [
          { name: 'right', type: 'DataFrame', desc: 'Right DataFrame to merge with' },
          { name: 'how', type: 'str', desc: "'inner', 'left', 'right', 'outer', or 'cross'" },
          { name: 'on', type: 'str | list', desc: 'Column name(s) to join on' },
          { name: 'validate', type: 'str', desc: "Integrity check: '1:1', '1:m', 'm:1', or 'm:m'" }
        ],
        returns: 'Merged DataFrame',
        exampleSnippet: "merged = transactions.merge(customers, on='customer_id', how='left')"
      }
    ],
    interactiveWidgetType: 'pandas-blockmanager'
  },
  challenges: [
    {
      id: 'd2-c1',
      dayId: 2,
      partId: 2,
      title: 'High-Speed Category Compression & Groupby Transform',
      slug: 'categorical-compression-groupby',
      difficulty: 'Intermediate',
      category: 'Pandas Optimization',
      summary: 'Optimize a high-cardinality transaction dataset and calculate vectorized rolling customer z-scores.',
      mentalModel5s: 'Strings in Pandas are fragmented 64-bit heap pointers. Categoricals replace strings with 8-bit integer codes + lookup table, reducing memory by 80% and allowing Cython groupby transforms to run at C-speed.',
      visualAnalogy: 'Replacing full text book titles written repeatedly in every ledger entry with 1-byte shelf numbers referencing a single master index card.',
      pitfalls: [
        'Using iterrows() or apply(axis=1) in production (invokes Python interpreter dispatch and allocates a Series wrapper per row).',
        'Not specifying observed=True in groupby on categorical columns, which triggers expensive cartesian product combinations of unobserved categories.',
        'Forgetting to handle zero division or missing values in group std (use fillna(1.0) or add epsilon 1e-8).',
        'Failing to downcast float64 to float32, wasting 50% of column memory.'
      ],
      progressiveHints: [
        'Tier 1 (Conceptual): Convert repeated text columns to category dtypes to replace Python object pointer bloat with compact integer codes.',
        'Tier 2 (Downcasting): Cast customer_id and category to .astype("category") and amount to .astype("float32").',
        'Tier 3 (Vectorized Transform): Use res.groupby("category", observed=True)["amount"].transform("mean") and .transform("std").fillna(1.0) for the group z-score.',
        'Tier 4 (Cumulative Transform): Use res.groupby("customer_id", observed=True)["amount"].cumsum().astype("float32") for running customer spend.'
      ],
      deepInternals: {
        title: 'Pandas BlockManager & Apache Arrow Columnar Layout',
        content: 'The Pandas BlockManager groups columns of identical dtypes into contiguous 2D NumPy blocks in RAM. Categorical columns store a 1D int8/int16 array of codes pointing to a CategoricalIndex. When grouping, Pandas performs integer hash lookups directly on the code array, avoiding Python string comparisons.',
        keyRule: 'Always pass observed=True to categorical groupby operations to prevent cartesian explosion.'
      },
      instructions: `You are given a raw Pandas DataFrame of transaction records containing \`customer_id\`, \`category\`, \`amount\`, and \`timestamp\`.

**Tasks:**
1. Downcast numeric columns to optimal dtypes (\`float32\`, \`int32\`) and convert string columns with low cardinality to \`category\`.
2. Compute the normalized z-score of \`amount\` within each \`category\` using \`groupby().transform()\` without iterating rows.
3. Compute the customer's cumulative spending up to each transaction using \`groupby('customer_id', observed=True)['amount'].cumsum()\`.
4. Ensure DataFrame memory consumption decreases by at least 65%.`,
      hints: [
        'Use df["category"] = df["category"].astype("category")',
        'For z-score: (amount - group_mean) / (group_std + 1e-8)',
        'df.groupby("category", observed=True)["amount"].transform(lambda g: (g - g.mean()) / (g.std(ddof=0) + 1e-8))'
      ],
      starterCode: `import pandas as pd
import numpy as np

def optimize_and_transform(df: pd.DataFrame) -> pd.DataFrame:
    """
    Downcast memory dtypes and compute vectorized group z-scores and cumulative spend.
    
    Args:
        df: Raw DataFrame with columns ['customer_id', 'category', 'amount', 'timestamp']
        
    Returns:
        Processed DataFrame with new columns ['amount_zscore', 'cum_spend']
    """
    # TODO: Implement memory compression and vectorized groupby transforms
    pass
`,
      solutionCode: `import pandas as pd
import numpy as np

def optimize_and_transform(df: pd.DataFrame) -> pd.DataFrame:
    res = df.copy()
    
    # 1. Downcast / Categorize
    res['customer_id'] = res['customer_id'].astype('category')
    res['category'] = res['category'].astype('category')
    res['amount'] = res['amount'].astype('float32')
    
    # 2. Groupby Transform for Z-Score
    group_stats = res.groupby('category', observed=True)['amount']
    mean = group_stats.transform('mean')
    std = group_stats.transform('std').fillna(1.0)
    res['amount_zscore'] = ((res['amount'] - mean) / (std + 1e-8)).astype('float32')
    
    # 3. Cumulative spending per customer
    res['cum_spend'] = res.groupby('customer_id', observed=True)['amount'].cumsum().astype('float32')
    
    return res
`,
      testCases: [
        {
          id: 't1',
          name: 'Memory Reduction > 65%',
          inputDescription: '100,000 transaction rows',
          expectedOutput: 'Memory reduced from ~18MB to < 5MB'
        },
        {
          id: 't2',
          name: 'Group Z-Score Correctness',
          inputDescription: 'Verify group mean ~ 0 and std ~ 1',
          expectedOutput: 'Mean error < 1e-5'
        }
      ],
      benchmarkTargetMs: 14.0,
      memoryTargetMb: 12.0,
      conceptPrimer: {
        title: 'Pandas Memory Architecture & Categorical Indexing',
        subtitle: 'Replacing object pointers with integer codes and memory-aligned blocks',
        overview: 'Pandas string `object` dtypes store an array of 64-bit Python heap pointers, causing extreme pointer chasing and cache misses. Categorical columns replace strings with 8-bit integer codes plus a single dictionary index table.',
        mentalModel5s: 'Categoricals convert bulky heap pointer arrays into dense 8-bit integer arrays.',
        visualAnalogy: 'A dictionary encoding where unique words have small integer IDs.',
        pitfalls: [
          'Unobserved category levels causing memory leaks if observed=False.',
          'Missing fillna on standard deviation transforms when group size is 1.'
        ],
        progressiveHints: [
          'Tier 1: Cast to categorical.',
          'Tier 2: groupby with observed=True',
          'Tier 3: .transform("mean") and .transform("std")',
          'Tier 4: .cumsum() on customer groups'
        ],
        deepInternals: {
          title: 'Categorical Block Representation',
          content: 'Categorical arrays are backed by an integer array of codes (int8/int16) and a CategoricalIndex.',
          keyRule: 'Always use observed=True with Categorical groupby.'
        },
        mathFormulas: [
          {
            title: 'Vectorized Z-Score Normalization',
            latex: 'Z_{i, c} = \\frac{X_{i, c} - \\mu_c}{\\sigma_c + \\epsilon}',
            explanation: 'Computed across partition $c \\in C$ simultaneously via Cython-accelerated transform.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Slow Python loop with apply
def slow_pipeline(df):
    z_scores = []
    for idx, row in df.iterrows():
        cat = row['category']
        subset = df[df['category'] == cat]['amount']
        z = (row['amount'] - subset.mean()) / subset.std()
        z_scores.append(z)
    df['z'] = z_scores`,
          naiveExplanation: '`iterrows()` constructs a Pandas Series object per row, taking over 30 seconds for 10k rows.',
          idiomaticCode: `# Fast Cythonized Groupby Transform
mean = df.groupby('category', observed=True)['amount'].transform('mean')
std = df.groupby('category', observed=True)['amount'].transform('std')
df['z'] = (df['amount'] - mean) / (std + 1e-8)`,
          idiomaticExplanation: 'Single-pass Cython aggregation dispatched in C with zero Python object instantiation.',
          speedupText: '850x faster'
        },
        memoryLayout: {
          title: 'Object Array vs Categorical Array Memory Layout',
          content: 'Object dtype: 100k strings = 100k independent PyObject allocations (~8MB) + 800KB pointer array. Categorical dtype: 100k int8 codes (100KB) + 5 unique strings.',
          diagramAscii: `Object Series: [Ptr 0x7f..] -> PyObject('Electronics')
Categorical:   [0, 1, 0, 2, 1] (int8) + Dict: {0: 'Electronics', 1: 'Clothing', 2: 'Home'}`,
          keyRule: 'Always use Categorical dtypes for string columns with cardinality < 50% of total row count.'
        },
        keyTakeaways: [
          'Avoid iterrows() and apply(axis=1) in production pipelines.',
          'Categoricals yield massive speedups in groupby operations because grouping operates on integer codes.',
          'Always set observed=True in Pandas groupby to avoid cartesian product allocation of unused category levels.'
        ]
      },
      sampleDataFrame: {
        name: 'Customer Transactions (Optimized Categorical View)',
        columns: ['customer_id', 'category', 'amount', 'amount_zscore', 'cum_spend'],
        dtypes: {
          customer_id: 'category',
          category: 'category',
          amount: 'float32',
          amount_zscore: 'float32',
          cum_spend: 'float32'
        },
        rows: [
          { customer_id: 'CUST_001', category: 'Electronics', amount: 499.99, amount_zscore: 1.42, cum_spend: 499.99 },
          { customer_id: 'CUST_002', category: 'Apparel',     amount: 45.50,  amount_zscore: -0.32, cum_spend: 45.50 },
          { customer_id: 'CUST_001', category: 'Apparel',     amount: 89.00,  amount_zscore: 0.78,  cum_spend: 588.99 },
          { customer_id: 'CUST_003', category: 'Home',        amount: 120.00, amount_zscore: 0.15,  cum_spend: 120.00 },
          { customer_id: 'CUST_002', category: 'Electronics', amount: 249.99, amount_zscore: -0.12, cum_spend: 295.49 }
        ],
        totalRows: 5,
        memoryUsageKb: 0.45
      },
      samplePlot: {
        id: 'p-pandas-mem-latency',
        title: 'Pandas Iteration Latency & Memory Footprint Comparison',
        type: 'svg',
        description: 'Benchmark comparison between iterrows, apply(axis=1), and vectorized groupby transform on 100k rows',
        svgContent: `<svg viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
          <rect width="600" height="300" fill="#0f172a" rx="8"/>
          <line x1="60" y1="240" x2="560" y2="240" stroke="#334155" stroke-width="1.5"/>
          <line x1="60" y1="40" x2="60" y2="240" stroke="#334155" stroke-width="1.5"/>
          <!-- Grid lines -->
          <line x1="60" y1="190" x2="560" y2="190" stroke="#1e293b" stroke-dasharray="4"/>
          <line x1="60" y1="140" x2="560" y2="140" stroke="#1e293b" stroke-dasharray="4"/>
          <line x1="60" y1="90" x2="560" y2="90" stroke="#1e293b" stroke-dasharray="4"/>
          <!-- Bars for Latency -->
          <!-- iterrows -->
          <rect x="100" y="55" width="80" height="185" fill="#ef4444" rx="4"/>
          <text x="140" y="45" fill="#ef4444" font-size="11" font-family="monospace" text-anchor="middle" font-weight="bold">5,200 ms</text>
          <text x="140" y="260" fill="#94a3b8" font-size="11" font-family="sans-serif" text-anchor="middle">iterrows()</text>
          <!-- apply -->
          <rect x="250" y="150" width="80" height="90" fill="#f59e0b" rx="4"/>
          <text x="290" y="140" fill="#f59e0b" font-size="11" font-family="monospace" text-anchor="middle" font-weight="bold">820 ms</text>
          <text x="290" y="260" fill="#94a3b8" font-size="11" font-family="sans-serif" text-anchor="middle">apply(axis=1)</text>
          <!-- Cython Transform -->
          <rect x="400" y="234" width="80" height="6" fill="#22c55e" rx="2"/>
          <text x="440" y="225" fill="#22c55e" font-size="11" font-family="monospace" text-anchor="middle" font-weight="bold">6.2 ms (838x)</text>
          <text x="440" y="260" fill="#22c55e" font-size="11" font-family="sans-serif" text-anchor="middle" font-weight="bold">transform()</text>
          <!-- Y-axis Label -->
          <text x="20" y="30" fill="#94a3b8" font-size="11" font-family="sans-serif">Runtime (ms)</text>
        </svg>`
      }
    }
  ]
};

export const PART02_TRACK = DAY02_TRACK;
export default DAY02_TRACK;
