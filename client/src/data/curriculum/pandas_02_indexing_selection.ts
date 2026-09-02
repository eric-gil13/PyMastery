import type { DayTrack, Challenge, ConceptPrimerData, TestCase } from '../../types';

export const DAY02_TRACK: DayTrack = {
  partNumber: 2,
  partId: 2,
  dayNumber: 2,
  id: 2,
  title: 'Part 2: Column Selection & Indexing',
  subtitle: 'Master label-based .loc, integer-based .iloc, boolean filtering, and avoid SettingWithCopyWarning',
  description: 'Stop guessing between single brackets, double brackets, .loc, and .iloc. Discover the precise rules of Pandas indexing, master compound boolean row filtering with bitwise operators (&, |, ~), extract sub-tables with surgical accuracy, and learn why defensive copying with .copy() protects your code against the dreaded SettingWithCopyWarning.',
  iconName: 'Filter',
  badge: 'Part 2 • Pandas Indexing',
  libraryMechanics: {
    libraryName: 'Pandas Selection & Indexing Engine',
    tagline: 'Precision data retrieval with label-based .loc, integer-based .iloc, and vectorized boolean masks.',
    overview: `### 🎯 The Core Art of Data Selection in Pandas
Once tabular data is loaded, your daily work revolves around slicing, dicing, and filtering:
- Grabbing specific columns for analysis.
- Finding rows that meet strict business conditions (e.g. salary > $80k AND experience >= 5).
- Cropping a small window of cells for inspection.

### 🔑 The Golden Rule of Indexers
Pandas provides two dedicated indexers with distinct responsibilities:
1. **\`.loc\` (Label-based):** Looks up rows and columns by their **names / labels** (e.g. \`df.loc[mask, ["name", "salary"]]\`).
2. **\`.iloc\` (Integer-positional):** Looks up rows and columns by their **zero-indexed numerical coordinates** (e.g. \`df.iloc[0:10, 0:3]\`).`,
    whyItExists: `In vanilla Python, accessing items in a list uses integer indices (\`lst[0]\`), while dictionaries use key labels (\`d["key"]\`).
DataFrames have BOTH rows and columns, with both integer positions and human labels!
Using standard square brackets \`df[...]\` for everything causes subtle ambiguities: does \`df[0:5]\` mean row numbers 0 to 5 or column index 0 to 5?

By providing explicit indexers (\`.loc\` and \`.iloc\`), Pandas provides 100% predictable, unambiguous, and lightning-fast coordinate access.`,
    coreAnatomy: {
      objectName: 'DataFrame Indexers (.loc & .iloc)',
      description: 'Dual-axis lookup mechanisms supporting boolean masks, slices, lists of labels, and integer coordinates.',
      fields: [
        {
          name: '.loc[row_labels, col_labels]',
          type: 'Label Indexer',
          role: 'Selects data using row index labels, boolean masks, and column name strings.'
        },
        {
          name: '.iloc[row_positions, col_positions]',
          type: 'Positional Indexer',
          role: 'Selects data using 0-indexed integer coordinates, integer lists, and integer slices.'
        },
        {
          name: 'boolean mask',
          type: 'pd.Series[bool]',
          role: 'A Series of True/False values evaluated row-by-row to filter records.'
        }
      ],
      memoryDiagramAscii: `+-------------------------------------------------------------+
|               .loc (Labels) vs .iloc (Integers)             |
|                                                             |
|           col 0: "name"    col 1: "dept"     col 2: "salary"|
|  row 0 ->    Alice             Eng             85000        |
|  row 1 ->    Bob               HR              62000        |
|  row 2 ->    Charlie           Eng             95000        |
|                                                             |
|  df.loc[0, "salary"]  == 85000  (Row label 0, Column "salary")|
|  df.iloc[0, 2]        == 85000  (Row index 0, Column index 2)|
+-------------------------------------------------------------+`
    },
    chapters: [
      {
        id: 'ch1-brackets-explained',
        title: 'Single vs. Double Square Brackets',
        icon: 'Layers',
        summary: 'Extracting 1D Series vs 2D DataFrames with [col] and [[col1, col2]].',
        markdownContent: `### Square Brackets: Series vs DataFrame

When indexing directly on a DataFrame:
- \`df["col"]\` returns a **1D Series**.
- \`df[["col"]]\` returns a **2D DataFrame** with one column.
- \`df[["col1", "col2"]]\` returns a **2D DataFrame** with multiple columns.

\`\`\`python
# 1D Series (no column headers, just an index and values)
salaries = df["salary"]

# 2D DataFrame (preserves table structure)
salaries_table = df[["salary"]]
\`\`\``,
        codeSnippets: [
          {
            id: 'snip-brackets',
            title: 'Series vs DataFrame column projection',
            code: `import pandas as pd

df = pd.DataFrame({"name": ["Alice", "Bob"], "salary": [80000, 90000]})

s = df["salary"]
sub_df = df[["salary"]]

print("Type of df['salary']:", type(s))
print("Shape of df['salary']:", s.shape)
print("\\nType of df[['salary']]:", type(sub_df))
print("Shape of df[['salary']]:", sub_df.shape)`,
            expectedOutput: `Type of df['salary']: <class 'pandas.core.series.Series'>
Shape of df['salary']: (2,)

Type of df[['salary']]: <class 'pandas.core.frame.DataFrame'>
Shape of df[['salary']]: (2, 1)`,
            explanation: 'Single brackets extract a 1D column vector (Series), whereas double brackets retain the 2D tabular structure (DataFrame).'
          }
        ]
      },
      {
        id: 'ch2-loc-filtering',
        title: 'Label Indexing & Boolean Filtering with .loc',
        icon: 'Filter',
        summary: 'Querying rows with compound conditions using bitwise operators and selecting columns.',
        markdownContent: `### Filtering Rows with .loc

To query rows, pass a boolean condition into \`.loc\`:

\`\`\`python
# Single condition
mask = df["salary"] > 80000
high_earners = df.loc[mask, ["name", "salary"]]
\`\`\`

### Compound Conditions: \`&\`, \`|\`, and \`()\`
When combining multiple conditions:
- Use \`&\` for AND (not Python \`and\`).
- Use \`|\` for OR (not Python \`or\`).
- Use \`~\` for NOT (not Python \`not\`).
- **Always wrap each condition in parentheses \`()\`!**

\`\`\`python
# Compound mask: Salary >= 80k AND Department == 'Eng'
mask = (df["salary"] >= 80000) & (df["department"] == "Eng")
result = df.loc[mask, ["name", "salary"]]
\`\`\``,
        codeSnippets: [
          {
            id: 'snip-loc-filter',
            title: 'Compound filtering with .loc',
            code: `import pandas as pd

df = pd.DataFrame({
    "name": ["Aria", "Ben", "Cora", "Dan"],
    "salary": [95000, 60000, 105000, 75000],
    "experience": [4, 1, 6, 3]
})

mask = (df["salary"] >= 80000) & (df["experience"] >= 4)
senior_high_earners = df.loc[mask, ["name", "salary"]].copy()

print(senior_high_earners)`,
            expectedOutput: `     name  salary
0    Aria   95000
2    Cora  105000`,
            explanation: 'Only rows satisfying both conditions are selected, and only the requested columns are projected.'
          }
        ]
      },
      {
        id: 'ch3-iloc-positioning',
        title: 'Positional Cropping with .iloc',
        icon: 'Grid',
        summary: 'Cropping rectangular tabular regions using zero-based integer coordinates.',
        markdownContent: `### Positional Slicing with .iloc

When you do not care about column names or row labels and simply want the top 5 rows and first 3 columns, use \`.iloc\`:

\`\`\`python
# Top 5 rows, first 3 columns
crop = df.iloc[0:5, 0:3]

# Last row, last column
last_cell = df.iloc[-1, -1]

# Specific rows and specific columns by integer lists
sample = df.iloc[[0, 2, 4], [1, 3]]
\`\`\`

> **Key Rule:** \`.iloc\` follows standard Python slice semantics: \`start:stop\` excludes \`stop\`.`,
        codeSnippets: [
          {
            id: 'snip-iloc',
            title: 'Extracting sub-tables with .iloc',
            code: `import pandas as pd

df = pd.DataFrame({
    "A": [10, 20, 30, 40],
    "B": [100, 200, 300, 400],
    "C": [1000, 2000, 3000, 4000]
})

# Rows 1 to 3 (indices 1 and 2), columns 0 and 2 ("A" and "C")
sub = df.iloc[1:3, [0, 2]]
print(sub)
print("Top-left of slice:", sub.iloc[0, 0])
print("Bottom-right of slice:", sub.iloc[-1, -1])`,
            expectedOutput: `    A     C
1  20  2000
2  30  3000
Top-left of slice: 20
Bottom-right of slice: 3000`,
            explanation: '.iloc provides pure coordinate-based slicing identical to 2D NumPy array indexing.'
          }
        ]
      },
      {
        id: 'ch4-copy-warning',
        title: 'Defensive Copying & SettingWithCopyWarning',
        icon: 'AlertTriangle',
        summary: 'Understanding chained indexing hazards and why .copy() prevents memory corruption warnings.',
        markdownContent: `### SettingWithCopyWarning Demystified

Consider this code:
\`\`\`python
# ❌ Chained indexing
subset = df[df["salary"] > 80000]
subset["bonus"] = 5000  # WARNING!
\`\`\`

Pandas issues a warning because it cannot guarantee whether \`subset\` is a view into the original table or an independent memory copy. 

### The Solution: Always Use .copy()
Whenever you filter data that you intend to modify, transform, or return, make your intent explicit:
\`\`\`python
# ✅ Safe and clean:
subset = df.loc[df["salary"] > 80000, ["name", "salary"]].copy()
subset["bonus"] = 5000  # Clean, no warning!
\`\`\``,
        codeSnippets: [
          {
            id: 'snip-copy-safe',
            title: 'Defensive copy isolation',
            code: `import pandas as pd

df = pd.DataFrame({"name": ["Alice", "Bob"], "salary": [80000, 60000]})

# Create an isolated copy
high_earner = df.loc[df["salary"] >= 80000, ["name", "salary"]].copy()
high_earner["salary"] = 95000

print("Modified Copy:\\n", high_earner)
print("\\nOriginal Remains Intact:\\n", df)`,
            expectedOutput: `Modified Copy:
     name  salary
0  Alice   95000

Original Remains Intact:
     name  salary
0  Alice   80000
1    Bob   60000`,
            explanation: 'Calling .copy() guarantees the new DataFrame owns its own memory buffers.'
          }
        ]
      }
    ],
    commonTraps: [
      {
        title: 'Using Python "and" / "or" in boolean masks',
        badSnippet: `# ❌ Raises ValueError: The truth value of a Series is ambiguous
mask = df['salary'] > 50000 and df['age'] < 30`,
        badExplanation: 'Python "and" attempts to evaluate the boolean truth of the entire Series object at once.',
        goodSnippet: `# ✅ Use bitwise & and wrap each comparison in parentheses
mask = (df['salary'] > 50000) & (df['age'] < 30)`,
        goodExplanation: 'Bitwise & computes element-wise logical AND across every row in the Series.',
        perfImpact: 'Eliminates fatal runtime crashes and runs at vectorized C speeds.'
      },
      {
        title: 'Forgetting parentheses in compound conditions',
        badSnippet: `# ❌ Bitwise operator precedence binds before comparison operators!
mask = df['salary'] > 50000 & df['age'] < 30`,
        badExplanation: 'In Python, & has higher precedence than > and <, causing 50000 & df["age"] to evaluate first!',
        goodSnippet: `# ✅ Wrap every condition in parentheses
mask = (df['salary'] > 50000) & (df['age'] < 30)`,
        goodExplanation: 'Parentheses force each comparison to resolve into boolean Series before bitwise conjunction.',
        perfImpact: 'Prevents obscure type errors and incorrect filter results.'
      },
      {
        title: 'Modifying a filtered slice without .copy()',
        badSnippet: `# ❌ Triggers SettingWithCopyWarning
sub = df[df['active'] == True]
sub['status'] = 'verified'`,
        badExplanation: 'Chained indexing leaves Pandas uncertain whether memory changes should reflect in the parent DataFrame.',
        goodSnippet: `# ✅ Explicit defensive copy with .loc
sub = df.loc[df['active'] == True].copy()
sub['status'] = 'verified'`,
        goodExplanation: 'Explicitly copies memory, eliminating warnings and preventing unexpected mutations.',
        perfImpact: 'Ensures reliable, warning-free production code.'
      }
    ],
    apiCheatSheet: [
      {
        name: 'df.loc',
        category: 'Indexing',
        signature: 'df.loc[row_indexer, col_indexer]',
        summary: 'Access a group of rows and columns by label(s) or a boolean array.',
        parameters: [
          { name: 'row_indexer', type: 'label | list | boolean mask | slice', desc: 'Row selector.' },
          { name: 'col_indexer', type: 'label | list | slice', desc: 'Column selector.' }
        ],
        returns: 'pd.DataFrame or pd.Series.',
        exampleSnippet: 'df.loc[df["age"] > 30, ["name", "salary"]]'
      },
      {
        name: 'df.iloc',
        category: 'Indexing',
        signature: 'df.iloc[row_indexer, col_indexer]',
        summary: 'Purely integer-location based indexing for selection by position.',
        parameters: [
          { name: 'row_indexer', type: 'int | list[int] | slice', desc: '0-based integer row index.' },
          { name: 'col_indexer', type: 'int | list[int] | slice', desc: '0-based integer column index.' }
        ],
        returns: 'pd.DataFrame, pd.Series, or scalar.',
        exampleSnippet: 'df.iloc[0:5, [0, 2]]'
      },
      {
        name: 'df.reset_index',
        category: 'Transformation',
        signature: 'df.reset_index(drop=False)',
        summary: 'Reset the index of the DataFrame to default integer RangeIndex (0, 1, 2...).',
        parameters: [
          { name: 'drop', type: 'bool, default False', desc: 'Do not insert old index as a column.' }
        ],
        returns: 'pd.DataFrame with reset index.',
        exampleSnippet: 'filtered_df.reset_index(drop=True)'
      },
      {
        name: 'df.copy',
        category: 'Memory',
        signature: 'df.copy(deep=True)',
        summary: 'Make a copy of this object indices and data.',
        parameters: [
          { name: 'deep', type: 'bool, default True', desc: 'Make a deep copy of data buffers.' }
        ],
        returns: 'pd.DataFrame copied object.',
        exampleSnippet: 'clean_copy = df.copy()'
      }
    ]
  },
  challenges: [
    {
      id: 'pandas-p2-c1',
      dayId: 2,
      partId: 2,
      title: 'High-Earner Filter with .loc',
      slug: 'high-earner-filter-loc',
      difficulty: 'Beginner',
      category: 'Boolean Filtering & Selection',
      summary: 'Filter records meeting compound salary and experience conditions, project columns defensively, and reset the index.',
      mentalModel5s: 'Create a compound mask with & and (), pass it to .loc with the target columns, and call .copy().',
      visualAnalogy: 'A dual-sieve security checkpoint that checks both badge level and years of clearance before copying records into a private file.',
      pitfalls: [
        'Using Python "and" instead of bitwise "&".',
        'Omitting parentheses around boolean conditions.',
        'Not calling .copy(), risking SettingWithCopyWarning.'
      ],
      progressiveHints: [
        'Tier 1 (Validation): Check if df is a DataFrame, thresholds are non-negative, and target_columns exist in df.columns.',
        'Tier 2 (Compound mask): `mask = (df["salary"] >= min_salary) & (df["years_experience"] >= min_experience)`.',
        'Tier 3 (Projection & copy): `filtered = df.loc[mask, target_columns].copy()`.',
        'Tier 4 (Reset index): Return `filtered.reset_index(drop=True)`.'
      ],
      deepInternals: {
        title: 'Boolean Indexing Execution Path',
        content: 'When evaluating (df["salary"] >= min_salary) & (df["years_experience"] >= min_experience), Pandas produces two 1-byte boolean NumPy arrays and computes an element-wise bitwise AND in SIMD registers. Passing this mask to .loc extracts matching rows without iterating in Python.',
        keyRule: 'Always use .copy() when creating a sub-table from a boolean filter.'
      },
      instructions: `Filter an employee roster for high-earning experienced staff and return selected columns safely.

Write a function \`filter_high_earners(df: pd.DataFrame, min_salary: float, min_experience: int, target_columns: list) -> pd.DataFrame\` that:
1. Validates inputs:
   - If \`df\` is not a \`pd.DataFrame\`, raise \`ValueError("df must be a pandas DataFrame")\`.
   - If \`min_salary < 0\` or \`min_experience < 0\`, raise \`ValueError("Thresholds must be non-negative")\`.
   - If any column in \`target_columns\` is not in \`df.columns\`, raise \`ValueError("Target column not found in DataFrame")\`.
2. Filters rows where salary is greater than or equal to \`min_salary\`, and years of experience is greater than or equal to \`min_experience\`.
3. Selects only the columns specified in \`target_columns\` and creates a defensive copy of the subset to avoid SettingWithCopyWarning.
4. Resets the row index to a clean 0-based sequence (dropping the previous index).
5. Returns the filtered DataFrame.`,
      hints: [
        'Use bitwise `&` and wrap each comparison in parentheses.',
        'Select columns with `df.loc[mask, target_columns].copy()`.',
        'Reset index with `result.reset_index(drop=True)`.'
      ],
      starterCode: `import pandas as pd

def filter_high_earners(df: pd.DataFrame, min_salary: float, min_experience: int, target_columns: list) -> pd.DataFrame:
    """
    Filter DataFrame by salary and experience thresholds and return projected columns.
    
    Args:
        df: Input pandas DataFrame containing 'salary' and 'years_experience' columns.
        min_salary: Minimum salary threshold (inclusive).
        min_experience: Minimum years of experience threshold (inclusive).
        target_columns: List of column names to keep in the output.
        
    Returns:
        Filtered, copied DataFrame with reset index.
    """
    # TODO: Validate inputs, apply boolean filter, copy subset, and reset index
    pass
`,
      solutionCode: `import pandas as pd

def filter_high_earners(df: pd.DataFrame, min_salary: float, min_experience: int, target_columns: list) -> pd.DataFrame:
    if not isinstance(df, pd.DataFrame):
        raise ValueError("df must be a pandas DataFrame")
    if min_salary < 0 or min_experience < 0:
        raise ValueError("Thresholds must be non-negative")
    if not set(target_columns).issubset(set(df.columns)):
        raise ValueError("Target column not found in DataFrame")
        
    mask = (df["salary"] >= min_salary) & (df["years_experience"] >= min_experience)
    filtered = df.loc[mask, target_columns].copy()
    return filtered.reset_index(drop=True)
`,
      testCases: [
        {
          id: 't1',
          name: 'Standard Threshold Filter',
          inputDescription: 'min_salary=85000, min_experience=4',
          expectedOutput: 'Returns 3 matching rows with reset index [0, 1, 2]'
        },
        {
          id: 't2',
          name: 'No Matching Rows',
          inputDescription: 'Thresholds higher than any record',
          expectedOutput: 'Empty DataFrame with target columns preserved'
        },
        {
          id: 't3',
          name: 'Missing Column Validation',
          inputDescription: 'Requesting unknown column',
          expectedOutput: 'Raises ValueError'
        }
      ],
      benchmarkTargetMs: 0.5,
      memoryTargetMb: 0.2,
      conceptPrimer: {
        title: 'Boolean Masking and Projection with .loc',
        subtitle: 'Fast, safe querying of tabular records',
        overview: 'Combining boolean conditions with bitwise operators enables expressive row queries that execute without manual loops.',
        mentalModel5s: 'Build conditions in (), join with &, pass into .loc[mask, cols].copy().',
        visualAnalogy: 'Stenciling a pattern onto a grid and spray-painting only the matching cells.',
        pitfalls: [
          'Using "and" instead of "&".',
          'Forgetting parentheses around comparisons.'
        ],
        progressiveHints: [
          'Step 1: Validate input types and boundaries.',
          'Step 2: Construct the boolean Series.',
          'Step 3: Extract with df.loc[mask, cols].copy().',
          'Step 4: Reset index.'
        ],
        mathFormulas: [
          {
            title: 'Boolean Conjunction',
            latex: 'M_i = (\\text{salary}_i \\ge S) \\land (\\text{exp}_i \\ge E)',
            explanation: 'Evaluated row by row as an array of boolean flags.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Manual row iteration
matches = []
for idx, row in df.iterrows():
    if row['salary'] >= 85000 and row['years_experience'] >= 4:
        matches.append(row[target_columns])
res = pd.DataFrame(matches)`,
          naiveExplanation: 'Allocates Python objects on every row, running 80x slower.',
          idiomaticCode: `# Vectorized .loc filter
filtered = df.loc[(df['salary'] >= 85000) & (df['years_experience'] >= 4), target_columns].copy()`,
          idiomaticExplanation: 'Runs entirely in compiled C/NumPy with zero row allocation overhead.',
          speedupText: '80x faster'
        },
        memoryLayout: {
          title: 'Filtered Buffer Allocation',
          content: 'Calling .copy() creates new contiguous columnar buffers for the selected rows, completely unlinked from the source table.',
          diagramAscii: `Source DataFrame -> Boolean Mask [T, F, T] -> .loc -> .copy() -> Independent DataFrame Buffer`,
          keyRule: 'Always use .copy() on filtered subsets you intend to mutate or return.'
        },
        keyTakeaways: [
          'Use bitwise & and | with parentheses for compound filtering.',
          '.loc[rows, cols] selects both dimensions simultaneously.',
          'reset_index(drop=True) establishes a clean 0-indexed row sequence.'
        ]
      }
    },
    {
      id: 'pandas-p2-c2',
      dayId: 2,
      partId: 2,
      title: 'Sub-Table Slicer with .iloc',
      slug: 'sub-table-slicer-iloc',
      difficulty: 'Beginner',
      category: 'Positional Indexing',
      summary: 'Extract sub-tables and corner coordinates using integer positional indexing with boundary checking.',
      mentalModel5s: '.iloc uses 0-indexed integer coordinates like standard 2D arrays.',
      visualAnalogy: 'Cropping an image by specifying top, bottom, left, and right pixel coordinates.',
      pitfalls: [
        'Confusing .loc (labels) with .iloc (integer positions).',
        'Not checking for negative or out-of-bounds row and column boundaries.'
      ],
      progressiveHints: [
        'Tier 1 (Validation): Check if row_start < 0, row_end > len(df), row_start >= row_end, or any col_index is out of range.',
        'Tier 2 (Slicing): `sub_df = df.iloc[row_start:row_end, col_indices].copy()`.',
        'Tier 3 (Corners): Extract top-left with `sub_df.iloc[0, 0]` and bottom-right with `sub_df.iloc[-1, -1]`.',
        'Tier 4 (Return): Return dictionary with sub_table, top_left, bottom_right, and shape.'
      ],
      deepInternals: {
        title: 'Positional Memory Striding',
        content: 'Under the hood, .iloc translates row and column indices into integer memory offsets directly, bypassing the hash-table lookup required by label-based .loc.',
        keyRule: 'Use .iloc when you know the numerical coordinates or rank of rows and columns.'
      },
      instructions: `Extract a sub-table and identify its corner coordinates using positional indexing.

Write a function \`slice_subtable(df: pd.DataFrame, row_start: int, row_end: int, col_indices: list) -> dict\` that:
1. Validates inputs:
   - If \`df\` is not a \`pd.DataFrame\`, raise \`ValueError("df must be a pandas DataFrame")\`.
   - If \`row_start < 0\` or \`row_end > len(df)\` or \`row_start >= row_end\`, raise \`IndexError("Invalid row slice boundaries")\`.
   - If any column position in \`col_indices\` is \`< 0\` or \`>= df.shape[1]\`, raise \`IndexError("Column index out of bounds")\`.
2. Extracts the sub-table bounded by row positions \`[row_start:row_end]\` and column positions in \`col_indices\`, creating a defensive copy.
3. Extracts the scalar value at the top-left corner (\`top_left\`).
4. Extracts the scalar value at the bottom-right corner (\`bottom_right\`).
5. Computes the shape of the sliced sub-table as a tuple of integers (\`shape\`: \`(num_rows, num_cols)\`).
6. Returns a dictionary:
   \`{"sub_table": sub_df, "top_left": top_left, "bottom_right": bottom_right, "shape": shape}\`.`,
      hints: [
        'Remember that .iloc slices exclude the end index: `df.iloc[row_start:row_end, col_indices]`.',
        'Access corner values with `.iloc[0, 0]` and `.iloc[-1, -1]`.',
        'Validate bounds against `len(df)` and `df.shape[1]`.'
      ],
      starterCode: `import pandas as pd

def slice_subtable(df: pd.DataFrame, row_start: int, row_end: int, col_indices: list) -> dict:
    """
    Extract a sub-table and its corner elements using integer positional indexing.
    
    Args:
        df: Input pandas DataFrame.
        row_start: Integer starting row index (inclusive).
        row_end: Integer ending row index (exclusive).
        col_indices: List of integer column positions to extract.
        
    Returns:
        Dictionary with keys: 'sub_table', 'top_left', 'bottom_right', 'shape'.
    """
    # TODO: Validate boundaries, slice sub-table, extract corners, and return dict
    pass
`,
      solutionCode: `import pandas as pd

def slice_subtable(df: pd.DataFrame, row_start: int, row_end: int, col_indices: list) -> dict:
    if not isinstance(df, pd.DataFrame):
        raise ValueError("df must be a pandas DataFrame")
    if row_start < 0 or row_end > len(df) or row_start >= row_end:
        raise IndexError("Invalid row slice boundaries")
    if any(c < 0 or c >= df.shape[1] for c in col_indices):
        raise IndexError("Column index out of bounds")
        
    sub_df = df.iloc[row_start:row_end, col_indices].copy()
    return {
        "sub_table": sub_df,
        "top_left": sub_df.iloc[0, 0],
        "bottom_right": sub_df.iloc[-1, -1],
        "shape": (int(sub_df.shape[0]), int(sub_df.shape[1])),
    }
`,
      testCases: [
        {
          id: 't1',
          name: 'Middle Window Crop',
          inputDescription: 'row_start=1, row_end=4, col_indices=[0, 2]',
          expectedOutput: 'shape=(3, 2), top_left=20, bottom_right="delta"'
        },
        {
          id: 't2',
          name: '1x1 Slice',
          inputDescription: 'Single row and single column index',
          expectedOutput: 'shape=(1, 1), top_left == bottom_right'
        },
        {
          id: 't3',
          name: 'Boundary Out of Bounds',
          inputDescription: 'Negative or excessive row/column indices',
          expectedOutput: 'Raises IndexError'
        }
      ],
      benchmarkTargetMs: 0.5,
      memoryTargetMb: 0.2,
      conceptPrimer: {
        title: 'Positional Indexing with .iloc',
        subtitle: 'Coordinate-driven matrix extraction',
        overview: '.iloc operates strictly on integer coordinates, allowing precise matrix slicing without relying on string column names.',
        mentalModel5s: '.iloc takes integer rows and integer columns: df.iloc[rows, cols].',
        visualAnalogy: 'Cropping a photo by pixel coordinates rather than image metadata.',
        pitfalls: [
          'Confusing label names with integer positions.'
        ],
        progressiveHints: [
          'Step 1: Check row and column slice boundaries.',
          'Step 2: Slice with df.iloc[row_start:row_end, col_indices].',
          'Step 3: Access corners with .iloc[0, 0] and .iloc[-1, -1].'
        ],
        mathFormulas: [
          {
            title: 'Slice Dimensionality',
            latex: 'R = r_{\\text{end}} - r_{\\text{start}}, \\quad C = |\\text{col\\_indices}|',
            explanation: 'Resulting DataFrame shape is (R, C).'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Manual row and column extraction
rows = []
for r in range(row_start, row_end):
    row_data = [df.iloc[r, c] for c in col_indices]
    rows.append(row_data)
sub = pd.DataFrame(rows)`,
          naiveExplanation: 'Slow scalar lookups that allocate temporary Python lists.',
          idiomaticCode: `# Direct 2D positional slice
sub_df = df.iloc[row_start:row_end, col_indices].copy()`,
          idiomaticExplanation: 'Single memory block crop in C.',
          speedupText: '40x faster'
        },
        memoryLayout: {
          title: 'Positional Offset Calculation',
          content: '.iloc uses direct array indexing into the internal Column Block pointers.',
          diagramAscii: `df.iloc[1:4, [0, 2]] -> Direct pointer offset into Column 0 and Column 2 arrays`,
          keyRule: 'Negative indices like -1 count backward from the end.'
        },
        keyTakeaways: [
          '.iloc uses 0-based integer positions.',
          '.iloc[0, 0] accesses the scalar at row 0, col 0.',
          '.iloc[-1, -1] accesses the bottom-right scalar.'
        ]
      }
    }
  ]
};

export const DAY01_TRACK = DAY02_TRACK;
export const PANDAS_PART02_TRACK = DAY02_TRACK;
export const testCases = DAY02_TRACK.challenges.flatMap(c => c.testCases);
export type { DayTrack, Challenge, ConceptPrimerData, TestCase };
export default DAY02_TRACK;
