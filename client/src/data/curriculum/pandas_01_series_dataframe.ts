import type { DayTrack, Challenge, ConceptPrimerData, TestCase } from '../../types';

export const DAY01_TRACK: DayTrack = {
  partNumber: 1,
  partId: 1,
  dayNumber: 1,
  id: 1,
  title: 'Part 1: Series & DataFrame Foundations',
  subtitle: 'Build tables from scratch, explore columns & indices, and inspect dataset shapes with zero loops',
  description: 'Master the fundamental building blocks of Pandas: 1D Series and 2D DataFrames. Learn how Pandas integrates the speed of NumPy with the intuitive structure of spreadsheets, explore essential inspection attributes like .shape and .dtypes, and perform vectorized column arithmetic without loops.',
  iconName: 'Table',
  badge: 'Part 1 • Pandas Foundations',
  libraryMechanics: {
    libraryName: 'Pandas Tabular Foundations',
    tagline: 'Supercharge spreadsheet-style tabular data with high-speed vectorized Python computing.',
    overview: `### 🌟 Welcome to Pandas: High-Performance Data Analysis in Python
When working with tabular records (like spreadsheets, CSV files, or database query results), raw Python lists and dictionaries quickly become clunky and slow. 

Pandas was created to bring high-performance relational and statistical data manipulation directly into Python.

### ⚡ The Two Core Structures: Series & DataFrame
1. **Series (1D):** A single labeled column of data with a uniform data type and an index.
2. **DataFrame (2D):** A complete table composed of multiple Series sharing a common row index.
3. **Zero-Loop Vectorization:** Operations happen across all rows simultaneously via compiled C and NumPy routines.`,
    whyItExists: `Traditional Python dictionaries and lists lack unified array math, alignment by label, and fast columnar storage.
NumPy solves math speed, but requires all cells in a matrix to share the exact same data type (e.g. all floats).

Pandas bridges this gap:
- **Heterogeneous Columns:** Column A can be employee names (strings), Column B can be ages (integers), and Column C can be salaries (floats).
- **Relational Labeling:** Every row and column has human-readable labels for intuitive querying.
- **Compiled Vector Speed:** Column additions, filters, and statistical aggregations execute at C-level speed.`,
    coreAnatomy: {
      objectName: 'DataFrame & Series',
      description: 'A 2D labeled tabular container composed of column names, an index of row labels, and contiguous memory blocks of data.',
      fields: [
        {
          name: 'columns',
          type: 'pd.Index',
          role: 'Labels for each column in the table (e.g., Index(["name", "age", "salary"])).'
        },
        {
          name: 'index',
          type: 'pd.Index',
          role: 'Labels for each row in the table (default is RangeIndex: 0, 1, 2, ...).'
        },
        {
          name: 'dtypes',
          type: 'pd.Series',
          role: 'Maps each column label to its underlying data type (e.g., int64, float64, object).'
        },
        {
          name: 'shape',
          type: 'tuple[int, int]',
          role: 'Dimensions of the DataFrame as (number_of_rows, number_of_columns).'
        }
      ],
      memoryDiagramAscii: `+-------------------------------------------------------------+
|                     Pandas DataFrame Structure              |
|  .columns -> ['name',        'age',         'salary']       |
|  .index   -> [0, 1, 2]                                      |
+-------------------------------------------------------------+
|    Index    |   'name' (object) | 'age' (int64) | 'salary'  |
|      0      |       Alice       |      25       |  85000.0  |
|      1      |       Bob         |      31       |  62000.0  |
|      2      |       Charlie     |      42       |  95000.0  |
+-------------------------------------------------------------+`
    },
    chapters: [
      {
        id: 'ch1-series-vs-dataframe',
        title: 'Series vs. DataFrame Mental Model',
        icon: 'Layers',
        summary: 'Understanding 1D Series columns versus 2D DataFrame tables.',
        markdownContent: `### The Mental Model: Columns and Tables

Think of a **Series** as a single column cut out of a spreadsheet. It has values, a data type, and a row label index:

\`\`\`python
import pandas as pd

# A Series of temperatures
temps = pd.Series([21.5, 23.0, 19.8], name="temperature")
print(temps)
\`\`\`

A **DataFrame** is the entire spreadsheet page. It is made up of multiple Series aligned along the same row index:

\`\`\`python
# A DataFrame with 2 columns
weather = pd.DataFrame({
    "city": ["Tokyo", "Paris", "New York"],
    "temperature": [21.5, 23.0, 19.8]
})
print(weather)
\`\`\``,
        codeSnippets: [
          {
            id: 'snip-series-df',
            title: 'Creating a Series and DataFrame',
            code: `import pandas as pd

s = pd.Series([10, 20, 30], name="quantities")
df = pd.DataFrame({"item": ["Apples", "Bananas", "Oranges"], "qty": s})

print("Series:\\n", s)
print("\\nDataFrame:\\n", df)`,
            expectedOutput: `Series:
 0    10
1    20
2    30
Name: quantities, dtype: int64

DataFrame:
       item  qty
0   Apples   10
1  Bananas   20
2  Oranges   30`,
            explanation: 'A Series represents a 1D labeled array, while a DataFrame binds multiple Series into a labeled 2D table.'
          }
        ]
      },
      {
        id: 'ch2-dataframe-creation',
        title: 'Creating DataFrames from Dictionaries',
        icon: 'Table',
        summary: 'Constructing tabular datasets from Python dictionaries and lists.',
        markdownContent: `### From Python Dictionaries to DataFrames

The most intuitive way to build a DataFrame in Python is with a dictionary where:
- Each **key** is a column name (string).
- Each **value** is a list containing the column values.

\`\`\`python
import pandas as pd

data = {
    "name": ["Alice", "Bob", "Charlie"],
    "department": ["Engineering", "HR", "Design"],
    "salary": [95000, 62000, 78000]
}

df = pd.DataFrame(data)
\`\`\`

Every list in the dictionary must have the exact same length!`,
        codeSnippets: [
          {
            id: 'snip-df-dict',
            title: 'Constructing a DataFrame from a dictionary',
            code: `import pandas as pd

employees = {
    "emp_id": [101, 102, 103],
    "name": ["Sarah", "Alex", "Jordan"],
    "active": [True, True, False]
}

df = pd.DataFrame(employees)
print(df)
print("\\nDataFrame Shape (rows, cols):", df.shape)`,
            expectedOutput: `   emp_id    name  active
0     101   Sarah    True
1     102    Alex    True
2     103  Jordan   False

DataFrame Shape (rows, cols): (3, 3)`,
            explanation: 'The dictionary keys become the column headers, and each list forms a column aligned by index 0, 1, 2.'
          }
        ]
      },
      {
        id: 'ch3-inspection-tools',
        title: 'Essential Dataset Inspection Tools',
        icon: 'Search',
        summary: 'Previewing rows and checking structural properties with .head(), .shape, and .dtypes.',
        markdownContent: `### Inspecting a New Dataset

When you first load data, always run these quick diagnostic checks:
1. \`df.shape\`: Returns \`(rows, columns)\`.
2. \`df.columns\`: List of all column headers.
3. \`df.dtypes\`: Data type of each column.
4. \`df.head(n)\`: First \`n\` rows (default 5).
5. \`df.tail(n)\`: Last \`n\` rows.
6. \`df.info()\`: Memory usage, non-null counts, and dtypes.`,
        codeSnippets: [
          {
            id: 'snip-inspect',
            title: 'Diagnostic inspection methods',
            code: `import pandas as pd

df = pd.DataFrame({
    "product": ["Keyboard", "Mouse", "Monitor", "Headset"],
    "price": [89.99, 49.99, 299.99, 79.99],
    "in_stock": [15, 42, 8, 23]
})

print("Shape:", df.shape)
print("Columns:", list(df.columns))
print("First 2 rows:\\n", df.head(2))`,
            expectedOutput: `Shape: (4, 3)
Columns: ['product', 'price', 'in_stock']
First 2 rows:
     product  price  in_stock
0  Keyboard  89.99        15
1     Mouse  49.99        42`,
            explanation: '.shape gives exact dimensions and .head() provides an immediate preview of the top rows.'
          }
        ]
      },
      {
        id: 'ch4-summary-statistics',
        title: 'Instant Summary Statistics & Vectorized Math',
        icon: 'BarChart2',
        summary: 'Compute column math and summary metrics without manual for-loops.',
        markdownContent: `### Vectorized Math & Summary Metrics

In standard Python, computing bonuses or discounts requires looping through every item. In Pandas, mathematical operations are **vectorized**:

\`\`\`python
# Vectorized column creation
df["discounted_price"] = df["price"] * 0.90
\`\`\`

Pandas also provides instant summary statistical reductions:
- \`df["price"].mean()\`: Arithmetic average
- \`df["price"].median()\`: Middle value
- \`df["price"].std()\`: Standard deviation
- \`df["price"].sum()\`: Total sum
- \`df.describe()\`: Statistical summary of all numeric columns`,
        codeSnippets: [
          {
            id: 'snip-stats',
            title: 'Vectorized math and statistics',
            code: `import pandas as pd

df = pd.DataFrame({"salary": [60000, 75000, 90000, 115000]})

df["bonus"] = df["salary"] * 0.15
df["total"] = df["salary"] + df["bonus"]

print(df)
print("\\nAverage Salary:", df["salary"].mean())
print("Max Total Pay:", df["total"].max())`,
            expectedOutput: `   salary    bonus     total
0   60000   9000.0   69000.0
1   75000  11250.0   86250.0
2   90000  13500.0  103500.0
3  115000  17250.0  132250.0

Average Salary: 85000.0
Max Total Pay: 132250.0`,
            explanation: 'Math executes across all rows simultaneously without writing a single Python for loop.'
          }
        ]
      }
    ],
    commonTraps: [
      {
        title: 'Writing manual loops to compute column values',
        badSnippet: `# ❌ Slow and un-pythonic
totals = []
for index, row in df.iterrows():
    totals.append(row['salary'] * 1.1)
df['total'] = totals`,
        badExplanation: 'Iterating with for-loops or iterrows() executes Python bytecode on every row, running 100x slower.',
        goodSnippet: `# ✅ Fast, vectorized column arithmetic
df['total'] = df['salary'] * 1.1`,
        goodExplanation: 'Pandas column operations pass contiguous memory blocks directly to compiled C/NumPy kernels.',
        perfImpact: 'Vectorized column math is up to 100x faster than iterrows().'
      },
      {
        title: 'Confusing Series with DataFrame single-column selection',
        badSnippet: `# Returns a 1D Series:
s = df['salary']  # shape is (N,)`,
        badExplanation: 'Passing a single string inside brackets returns a 1D Series, not a 2D DataFrame.',
        goodSnippet: `# Returns a 2D DataFrame with one column:
sub_df = df[['salary']]  # shape is (N, 1)`,
        goodExplanation: 'Double brackets [["col"]] preserve the 2D DataFrame structure.',
        perfImpact: 'Prevents attribute errors when methods expect DataFrame methods rather than Series methods.'
      },
      {
        title: 'Mismatching list lengths when creating DataFrames',
        badSnippet: `# ❌ Raises ValueError: All arrays must be of the same length
df = pd.DataFrame({
    'name': ['Alice', 'Bob'],
    'age': [25, 30, 35]
})`,
        badExplanation: 'Pandas requires all column lists to have the exact same number of elements to construct a valid table grid.',
        goodSnippet: `# ✅ Consistent lengths across all columns
df = pd.DataFrame({
    'name': ['Alice', 'Bob', 'Charlie'],
    'age': [25, 30, 35]
})`,
        goodExplanation: 'Ensure all lists in the dictionary have matching length prior to DataFrame creation.',
        perfImpact: 'Avoids runtime construction crashes.'
      }
    ],
    apiCheatSheet: [
      {
        name: 'pd.DataFrame',
        category: 'Creation',
        signature: 'pd.DataFrame(data=None, index=None, columns=None, dtype=None)',
        summary: 'Construct a two-dimensional, size-mutable, tabular data structure.',
        parameters: [
          { name: 'data', type: 'dict | list | ndarray', desc: 'Dictionary of lists, list of dicts, or 2D array.' },
          { name: 'columns', type: 'Index | list, optional', desc: 'Column labels to use for resulting frame.' }
        ],
        returns: 'pd.DataFrame table.',
        exampleSnippet: 'df = pd.DataFrame({"name": ["Alice", "Bob"], "age": [25, 30]})'
      },
      {
        name: 'pd.Series',
        category: 'Creation',
        signature: 'pd.Series(data=None, index=None, dtype=None, name=None)',
        summary: 'Construct a one-dimensional ndarray with axis labels.',
        parameters: [
          { name: 'data', type: 'list | ndarray | scalar', desc: 'Data values contained in Series.' },
          { name: 'name', type: 'str, optional', desc: 'Label/name of the Series.' }
        ],
        returns: 'pd.Series column.',
        exampleSnippet: 's = pd.Series([10, 20, 30], name="counts")'
      },
      {
        name: 'df.shape',
        category: 'Inspection',
        signature: 'df.shape',
        summary: 'Return a tuple representing the dimensionality of the DataFrame (rows, columns).',
        parameters: [],
        returns: 'tuple[int, int]',
        exampleSnippet: 'num_rows, num_cols = df.shape'
      },
      {
        name: 'df.select_dtypes',
        category: 'Inspection',
        signature: 'df.select_dtypes(include=None, exclude=None)',
        summary: 'Subset DataFrame columns based on their data type.',
        parameters: [
          { name: 'include', type: 'type | str | list', desc: 'A selection of dtypes or strings to be included (e.g. "number").' }
        ],
        returns: 'pd.DataFrame containing matching columns.',
        exampleSnippet: 'numeric_df = df.select_dtypes(include="number")'
      }
    ]
  },
  challenges: [
    {
      id: 'pandas-p1-c1',
      dayId: 1,
      partId: 1,
      title: 'Employee Directory Creator',
      slug: 'employee-directory-creator',
      difficulty: 'Beginner',
      category: 'DataFrame Creation',
      summary: 'Construct a DataFrame from a dictionary of employee records, inspect its dimensions, and calculate total compensation.',
      mentalModel5s: 'Dictionary keys become column headers, values become vertical column Series, and math runs across all rows at once.',
      visualAnalogy: 'Writing columns onto a brand new blank spreadsheet, then adding a calculated formula column at the end.',
      pitfalls: [
        'Iterating through rows with a for loop instead of using vectorized addition.',
        'Not validating that raw_data is a non-empty dictionary or that bonus_rate is non-negative.',
        'Forgetting to convert total_payroll to a standard float.'
      ],
      progressiveHints: [
        'Tier 1 (Validation): Check `if not isinstance(raw_data, dict) or not raw_data:` and `if bonus_rate < 0:` to raise ValueError.',
        'Tier 2 (Creation): Create the DataFrame with `df = pd.DataFrame(raw_data)`.',
        'Tier 3 (Vectorized column): Add the column with `df["total_compensation"] = df["salary"] + (df["salary"] * bonus_rate)`.',
        'Tier 4 (Packaging): Return a dictionary with dataframe, num_rows, num_cols, columns, and total_payroll.'
      ],
      deepInternals: {
        title: 'DataFrame Memory Representation',
        content: 'When you construct a DataFrame from a dictionary of lists, Pandas creates internal contiguous 1D array buffers for each column. Adding a calculated column performs SIMD-accelerated array addition in compiled C code.',
        keyRule: 'Always perform column-wise arithmetic directly: df["c"] = df["a"] + df["b"].'
      },
      instructions: `Construct a company employee directory from raw employee data and calculate total compensation packages.

Write a function \`build_employee_directory(raw_data: dict, bonus_rate: float = 0.10) -> dict\` that:
1. Validates inputs: If \`raw_data\` is not a dict or is empty, raise \`ValueError("raw_data must be a non-empty dictionary")\`. If \`bonus_rate < 0\`, raise \`ValueError("bonus_rate must be non-negative")\`.
2. Constructs a DataFrame table from \`raw_data\`.
3. Adds a new column named \`"total_compensation"\` computed as \`salary + (salary * bonus_rate)\`.
4. Extracts the integer row count (\`num_rows\`) and column count (\`num_cols\`).
5. Extracts the column names as a list of strings (\`columns\`).
6. Calculates total payroll as a float (\`total_payroll\`) representing the sum of all employee total compensation values.
7. Returns a dictionary:
   \`{"dataframe": df, "num_rows": num_rows, "num_cols": num_cols, "columns": columns, "total_payroll": total_payroll}\`.`,
      hints: [
        'Use `pd.DataFrame(raw_data)` to build the table.',
        'Add the new column: `df["total_compensation"] = df["salary"] + (df["salary"] * bonus_rate)`.',
        'Extract shape components using `df.shape[0]` and `df.shape[1]`.'
      ],
      starterCode: `import pandas as pd

def build_employee_directory(raw_data: dict, bonus_rate: float = 0.10) -> dict:
    """
    Construct a DataFrame from employee records and calculate total compensation.
    
    Args:
        raw_data: Dictionary mapping column names to lists of values.
                  Expected keys: 'name', 'department', 'salary', 'years_experience'.
        bonus_rate: Fractional bonus to apply to salary (default 0.10).
        
    Returns:
        Dictionary with keys: 'dataframe', 'num_rows', 'num_cols', 'columns', 'total_payroll'.
    """
    # TODO: Validate inputs, construct DataFrame, add calculated column, and return dictionary
    pass
`,
      solutionCode: `import pandas as pd

def build_employee_directory(raw_data: dict, bonus_rate: float = 0.10) -> dict:
    if not isinstance(raw_data, dict) or not raw_data:
        raise ValueError("raw_data must be a non-empty dictionary")
    if bonus_rate < 0:
        raise ValueError("bonus_rate must be non-negative")
        
    df = pd.DataFrame(raw_data)
    df["total_compensation"] = df["salary"] + (df["salary"] * bonus_rate)
    
    return {
        "dataframe": df,
        "num_rows": int(df.shape[0]),
        "num_cols": int(df.shape[1]),
        "columns": list(df.columns),
        "total_payroll": float(df["total_compensation"].sum()),
    }
`,
      testCases: [
        {
          id: 't1',
          name: 'Standard Employee Directory',
          inputDescription: '4 employees, bonus_rate=0.10',
          expectedOutput: 'num_rows=4, num_cols=5, total_payroll=344300.0'
        },
        {
          id: 't2',
          name: 'Custom 25% Bonus Rate',
          inputDescription: '4 employees, bonus_rate=0.25',
          expectedOutput: 'total_payroll=391250.0'
        },
        {
          id: 't3',
          name: 'Input Validation',
          inputDescription: 'Empty dict or negative bonus rate',
          expectedOutput: 'Raises ValueError with descriptive message'
        }
      ],
      benchmarkTargetMs: 0.5,
      memoryTargetMb: 0.2,
      conceptPrimer: {
        title: 'Constructing DataFrames and Vectorized Arithmetic',
        subtitle: 'From raw Python data structures to high-speed labeled tables',
        overview: 'DataFrames bind independent column arrays with shared row indices, enabling instant arithmetic across all rows at once.',
        mentalModel5s: 'Columns are Series; tables are DataFrames; math is vectorized.',
        visualAnalogy: 'A spreadsheet grid where adding a formula to a column computes the result for every row simultaneously.',
        pitfalls: [
          'Using for loops to calculate new column values instead of vectorized pandas operations.'
        ],
        progressiveHints: [
          'Step 1: Validate inputs.',
          'Step 2: Initialize pd.DataFrame(raw_data).',
          'Step 3: Vectorized column addition.',
          'Step 4: Package into return dictionary.'
        ],
        mathFormulas: [
          {
            title: 'Total Compensation Formula',
            latex: '\\text{comp}_i = \\text{salary}_i \\times (1 + \\text{bonus\\_rate})',
            explanation: 'Computed across all rows in parallel using vectorized scalar multiplication.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Slow loop over rows
comp = []
for idx, row in df.iterrows():
    comp.append(row['salary'] * (1 + bonus_rate))
df['total_compensation'] = comp`,
          naiveExplanation: 'Incurs Python interpreter bytecode dispatch overhead on every single row.',
          idiomaticCode: `# Fast, vectorized column arithmetic
df['total_compensation'] = df['salary'] + (df['salary'] * bonus_rate)`,
          idiomaticExplanation: 'Dispatched to contiguous C memory buffers with SIMD acceleration.',
          speedupText: '80x faster'
        },
        memoryLayout: {
          title: 'Columnar Memory Architecture',
          content: 'Each column is held in contiguous memory blocks, allowing the CPU cache to stream numeric data smoothly.',
          diagramAscii: `[salary: 85k, 62k, 95k] -> (x 1.1) -> [total_compensation: 93.5k, 68.2k, 104.5k]`,
          keyRule: 'Vectorized column expressions compute in C without creating Python object wrappers.'
        },
        keyTakeaways: [
          'Construct DataFrames directly from dictionaries: pd.DataFrame(dict).',
          'df.shape gives (rows, columns).',
          'Always use vectorized operations for column calculations.'
        ]
      }
    },
    {
      id: 'pandas-p1-c2',
      dayId: 1,
      partId: 1,
      title: 'Summary Stats Inspector',
      slug: 'summary-stats-inspector',
      difficulty: 'Beginner',
      category: 'Data Inspection',
      summary: 'Inspect structural properties, detect numeric columns dynamically, and extract summary metrics without loops.',
      mentalModel5s: 'Let Pandas calculate the statistics in C across columns instead of iterating manually.',
      visualAnalogy: 'An automated diagnostic scanner that inspects the dimensions, wiring, and telemetry of a vehicle instantly.',
      pitfalls: [
        'Iterating through rows or columns with manual loops to calculate averages.',
        'Not handling single-row DataFrames where standard deviation would divide by zero.'
      ],
      progressiveHints: [
        'Tier 1 (Validation): Ensure `if not isinstance(df, pd.DataFrame) or df.empty:` raises ValueError.',
        'Tier 2 (Dimensions): `shape = (int(df.shape[0]), int(df.shape[1]))`.',
        'Tier 3 (Detect numeric columns): `df.select_dtypes(include="number").columns`.',
        'Tier 4 (Stats): Compute mean, std, min, max for each numeric column.'
      ],
      deepInternals: {
        title: 'Vectorized Statistical Reductions',
        content: 'Functions like .mean() and .std() in Pandas call optimized C/Cython reduction kernels that skip NaN values and compute two-pass numerically stable variance in microseconds.',
        keyRule: 'Use df.select_dtypes(include="number") to inspect numeric subsets dynamically.'
      },
      instructions: `Write a diagnostic tool to inspect any incoming DataFrame, determine its data types, and compute summary statistics.

Write a function \`inspect_dataframe(df: pd.DataFrame) -> dict\` that:
1. Validates input: If \`df\` is not a \`pd.DataFrame\` or \`df.empty\`, raise \`ValueError("df must be a non-empty pandas DataFrame")\`.
2. Extracts dimensions as an integer tuple \`shape\` containing \`(num_rows, num_cols)\`.
3. Extracts data types as a dictionary \`dtypes\` mapping column names to dtype strings.
4. Identifies numeric columns dynamically as a list of strings (\`numeric_columns\`).
5. Computes summary stats for each numeric column in a dictionary \`stats\`:
   - \`"mean"\`: average value across the column as a float
   - \`"std"\`: sample standard deviation (using 1 degree of freedom, \`ddof=1\`) as a float if row count > 1, else \`0.0\`
   - \`"min"\`: minimum value in the column as a float
   - \`"max"\`: maximum value in the column as a float
6. Extracts the first row as a dictionary: \`first_row\` mapping column names to their values.
7. Returns a dictionary:
   \`{"shape": shape, "dtypes": dtypes, "numeric_columns": numeric_cols, "stats": stats, "first_row": first_row}\`.`,
      hints: [
        'Find numeric columns with `df.select_dtypes(include="number").columns`.',
        'Compute metrics with `df[col].mean()`, `df[col].std(ddof=1)`, etc.',
        'Extract the first row as a dict with `df.iloc[0].to_dict()`.'
      ],
      starterCode: `import pandas as pd

def inspect_dataframe(df: pd.DataFrame) -> dict:
    """
    Extract dimensions, data types, numeric columns, and summary statistics.
    
    Args:
        df: A pandas DataFrame to inspect.
        
    Returns:
        Dictionary with keys: 'shape', 'dtypes', 'numeric_columns', 'stats', 'first_row'.
    """
    # TODO: Validate input and extract summary metrics
    pass
`,
      solutionCode: `import pandas as pd

def inspect_dataframe(df: pd.DataFrame) -> dict:
    if not isinstance(df, pd.DataFrame) or df.empty:
        raise ValueError("df must be a non-empty pandas DataFrame")
        
    shape = (int(df.shape[0]), int(df.shape[1]))
    dtypes = {col: str(dtype) for col, dtype in df.dtypes.items()}
    numeric_cols = list(df.select_dtypes(include="number").columns)
    
    stats = {}
    for col in numeric_cols:
        stats[col] = {
            "mean": float(df[col].mean()),
            "std": float(df[col].std(ddof=1)) if len(df) > 1 else 0.0,
            "min": float(df[col].min()),
            "max": float(df[col].max()),
        }
        
    first_row = df.iloc[0].to_dict()
    
    return {
        "shape": shape,
        "dtypes": dtypes,
        "numeric_columns": numeric_cols,
        "stats": stats,
        "first_row": first_row,
    }
`,
      testCases: [
        {
          id: 't1',
          name: 'Mixed Tabular Dataset',
          inputDescription: 'Cities table with text and numeric columns',
          expectedOutput: 'shape=(4, 3), numeric_columns=["population_m", "metro_stations"]'
        },
        {
          id: 't2',
          name: 'Single Row Dataset',
          inputDescription: 'DataFrame with 1 row',
          expectedOutput: 'std=0.0, mean matches single value'
        },
        {
          id: 't3',
          name: 'Empty DataFrame Validation',
          inputDescription: 'Empty DataFrame',
          expectedOutput: 'Raises ValueError'
        }
      ],
      benchmarkTargetMs: 0.8,
      memoryTargetMb: 0.2,
      conceptPrimer: {
        title: 'Introspecting DataFrames',
        subtitle: 'Dynamic schema inspection and statistical summarization',
        overview: 'Automated data pipelines inspect columns dynamically using dtypes and select_dtypes to prepare data for machine learning and reporting.',
        mentalModel5s: 'Query metadata dynamically: shape for grid dimensions, dtypes for types, select_dtypes for numeric filtering.',
        visualAnalogy: 'An X-ray of a data table revealing its structure, types, and summary distributions without touching the raw records.',
        pitfalls: [
          'Hardcoding column names instead of dynamically discovering numeric columns.'
        ],
        progressiveHints: [
          'Step 1: Check if df is valid and non-empty.',
          'Step 2: Extract shape and dtypes mapping.',
          'Step 3: Filter numeric columns with select_dtypes.',
          'Step 4: Compute summary stats and first row dictionary.'
        ],
        mathFormulas: [
          {
            title: 'Sample Standard Deviation',
            latex: 's = \\sqrt{\\frac{1}{N - 1} \\sum_{i=1}^N (x_i - \\bar{x})^2}',
            explanation: 'Pandas uses ddof=1 by default for unbiased sample standard deviation.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Manual looping over rows to compute mean
total = 0
count = 0
for val in df['metric']:
    total += val
    count += 1
mean_val = total / count`,
          naiveExplanation: 'Extremely slow and prone to division-by-zero on empty sets.',
          idiomaticCode: `# Built-in C reduction
mean_val = df['metric'].mean()`,
          idiomaticExplanation: 'Single-pass compiled reduction that automatically handles missing values.',
          speedupText: '50x faster'
        },
        memoryLayout: {
          title: 'Memory Type Inspection',
          content: 'dtypes stores reference descriptors for the BlockManager backing arrays.',
          diagramAscii: `df.dtypes: [colA -> int64 (8 bytes), colB -> float64 (8 bytes), colC -> object (pointer)]`,
          keyRule: 'select_dtypes(include="number") isolates numeric arrays in a single step.'
        },
        keyTakeaways: [
          'Use select_dtypes(include="number") to find all numeric columns.',
          'df.iloc[0].to_dict() gives a clean dictionary representation of the first row.',
          'Always validate DataFrame inputs with isinstance(df, pd.DataFrame) and not df.empty.'
        ]
      }
    }
  ]
};

export const PANDAS_PART01_TRACK = DAY01_TRACK;
export const testCases = DAY01_TRACK.challenges.flatMap(c => c.testCases);
export type { DayTrack, Challenge, ConceptPrimerData, TestCase };
export default DAY01_TRACK;
