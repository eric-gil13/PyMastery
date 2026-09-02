import type { DayTrack, Challenge, ConceptPrimerData, TestCase } from '../../types';

export const DAY03_TRACK: DayTrack = {
  partNumber: 3,
  partId: 3,
  dayNumber: 3,
  id: 3,
  title: 'Part 3: Data Cleaning & Missing Values',
  subtitle: 'Detect nulls with .isna(), impute with .fillna(), drop unrecoverable rows, and vectorize text cleaning with .str',
  description: 'Turn messy, incomplete real-world tables into pristine, analysis-ready datasets. Audit missing values with .isna(), strategically drop corrupted rows with .dropna(), impute numeric gaps with statistical medians using .fillna(), and vectorize text cleanup and token extraction using the powerful .str accessor.',
  iconName: 'Sparkles',
  badge: 'Part 3 • Data Cleaning',
  libraryMechanics: {
    libraryName: 'Pandas Data Cleansing & String Engine',
    tagline: 'Vectorized null auditing, statistical imputation, and regex-powered string manipulation.',
    overview: `### 🧹 Real-World Data is Messy
Raw data from web forms, legacy databases, or third-party APIs almost always suffers from:
- Missing numbers and empty strings (\`NaN\`, \`None\`, \`""\`).
- Leading and trailing spaces (\`"  john doe  "\`).
- Inconsistent casing (\`"NEW YORK"\`, \`"new york"\`, \`"New York"\`).
- Composite fields requiring parsing (like splitting an email into username and domain).

### ⚡ Vectorized Cleansing
Pandas provides two specialized subsystems for sanitizing data:
1. **Missing Data Handlers (\`.isna()\`, \`.dropna()\`, \`.fillna()\`):** Detect, remove, or impute missing cells with compiled performance.
2. **String Accessor (\`.str\`):** Exposes Python's full string library across entire columns simultaneously.`,
    whyItExists: `In standard Python, sanitizing 500,000 text records requires writing nested for-loops, handling AttributeError on None objects, and creating huge temporary lists.
Pandas solves this with:
- **Automatic Missing Value Handling:** String functions on Series with missing values preserve \`NaN\` without crashing.
- **Compiled String Routines:** \`.str.lower()\`, \`.str.strip()\`, and \`.str.split()\` execute in optimized C loops.
- **Statistical Imputation:** \`.fillna()\` seamlessly fills missing slots using column medians or means.`,
    coreAnatomy: {
      objectName: 'Data Cleaning Subsystems',
      description: 'Built-in null detection masks and string transformation accessors for columnar Series.',
      fields: [
        {
          name: '.isna() / .notna()',
          type: 'Method',
          role: 'Returns a boolean mask identifying null / non-null values.'
        },
        {
          name: '.dropna(subset=...)',
          type: 'Method',
          role: 'Drops rows or columns containing missing values based on specified thresholds.'
        },
        {
          name: '.fillna(value)',
          type: 'Method',
          role: 'Replaces null values with a constant or calculated statistic (mean, median).'
        },
        {
          name: '.str accessor',
          type: 'Series Accessor',
          role: 'Vectorized string operations (strip, lower, upper, title, split, replace).'
        }
      ],
      memoryDiagramAscii: `+-------------------------------------------------------------+
|               Data Cleaning & Imputation Pipeline           |
|                                                             |
|  Raw Column:      [  80.0  |   NaN   |  95.0  |   NaN   ]   |
|  .isna():         [ False  |  True   | False  |  True   ]   |
|  Median (87.5):   Ignored NaNs -> (80 + 95) / 2             |
|  .fillna(87.5):   [  80.0  |  87.5   |  95.0  |  87.5   ]   |
+-------------------------------------------------------------+`
    },
    chapters: [
      {
        id: 'ch1-detecting-nulls',
        title: 'Auditing Missing Data with .isna()',
        icon: 'Search',
        summary: 'Detecting and counting nulls across columns.',
        markdownContent: `### Never Use \`== np.nan\`!

In computer science (IEEE floating point standard), \`NaN != NaN\`. Therefore:
\`\`\`python
# ❌ NEVER DO THIS:
df[df["salary"] == np.nan]  # Always empty!

# ✅ DO THIS:
df["salary"].isna()
\`\`\`

To audit an entire DataFrame, chain \`.isna().sum()\`:
\`\`\`python
# Missing counts per column
print(df.isna().sum())

# Total missing values in the entire table
print(df.isna().sum().sum())
\`\`\``,
        codeSnippets: [
          {
            id: 'snip-isna',
            title: 'Auditing missing data',
            code: `import pandas as pd
import numpy as np

df = pd.DataFrame({
    "user_id": [101, 102, np.nan, 104],
    "email": ["a@b.com", np.nan, "c@d.com", "e@f.com"],
    "score": [95.0, 80.0, np.nan, np.nan]
})

print("Missing values per column:\\n", df.isna().sum())
print("\\nTotal missing cells:", df.isna().sum().sum())`,
            expectedOutput: `Missing values per column:
 user_id    1
email      1
score      2
dtype: int64

Total missing cells: 4`,
            explanation: '.isna().sum() sums True (1) and False (0) across each column to report null counts.'
          }
        ]
      },
      {
        id: 'ch2-dropping-imputing',
        title: 'Dropping vs. Imputing with .dropna() & .fillna()',
        icon: 'Sliders',
        summary: 'When to discard rows vs when to fill numeric gaps with medians.',
        markdownContent: `### The Strategic Decision

1. **Critical IDs (user_id, timestamp):** Drop rows if missing.
\`\`\`python
df_clean = df.dropna(subset=["user_id"]).copy()
\`\`\`

2. **Metrics & Measurements (salary, age, score):** Impute with median to preserve sample size.
\`\`\`python
median_val = df_clean["score"].median()
df_clean["score"] = df_clean["score"].fillna(median_val)
\`\`\`

> **Why Median?** Medians resist outliers. If 9 workers earn $50k and 1 CEO earns $5M, the median is $50k, but the mean is $545k!`,
        codeSnippets: [
          {
            id: 'snip-drop-impute',
            title: 'Dropping and median imputation',
            code: `import pandas as pd
import numpy as np

df = pd.DataFrame({
    "id": [1, 2, np.nan, 4],
    "salary": [60000.0, np.nan, 70000.0, 80000.0]
})

# Drop missing ID
clean = df.dropna(subset=["id"]).copy()

# Fill salary with median of valid records
med = clean["salary"].median()
clean["salary"] = clean["salary"].fillna(med)

print(clean)`,
            expectedOutput: `    id   salary
0  1.0  60000.0
1  2.0  70000.0
3  4.0  80000.0`,
            explanation: 'Row index 2 is removed because of missing ID, and row 1 has its salary imputed with the median of [60k, 80k] = 70k.'
          }
        ]
      },
      {
        id: 'ch3-str-casing-stripping',
        title: 'Vectorized Text Cleaning with .str',
        icon: 'Type',
        summary: 'Trimming whitespace and normalizing casing across millions of rows.',
        markdownContent: `### The .str Accessor

To apply string operations to a Series, prefix the method with \`.str\`:
\`\`\`python
# Trim whitespace
df["email"] = df["email"].str.strip()

# Standardize to lowercase
df["email"] = df["email"].str.lower()

# Capitalize to Title Case
df["name"] = df["name"].str.title()
\`\`\`

Methods can be chained seamlessly:
\`\`\`python
df["clean_email"] = df["email"].str.strip().str.lower()
\`\`\``,
        codeSnippets: [
          {
            id: 'snip-str-clean',
            title: 'Cleaning text columns with .str',
            code: `import pandas as pd

df = pd.DataFrame({
    "name": ["  sarah CONNOR ", "john DOE  "],
    "email": ["  SARAH@SKYNET.COM ", "JD@WORK.ORG  "]
})

df["name"] = df["name"].str.strip().str.title()
df["email"] = df["email"].str.strip().str.lower()

print(df)`,
            expectedOutput: `           name              email
0  Sarah Connor   sarah@skynet.com
1      John Doe        jd@work.org`,
            explanation: '.str accessor methods run vectorized across every row in the column.'
          }
        ]
      },
      {
        id: 'ch4-str-split-extract',
        title: 'Splitting and Token Extraction with .str.split()',
        icon: 'Scissors',
        summary: 'Splitting text into multiple columns or picking specific tokens.',
        markdownContent: `### Splitting Text Strings

You can split text on delimiters and extract tokens:

1. **Extracting a single piece (e.g. email domain):**
\`\`\`python
# Split on '@' and take item at index 1
df["domain"] = df["email"].str.split("@").str[1]
\`\`\`

2. **Splitting into multiple columns (expand=True):**
\`\`\`python
# Split full name into first and last name
split_cols = df["name"].str.split(" ", n=1, expand=True)
df["first_name"] = split_cols[0]
df["last_name"] = split_cols[1].fillna("")
\`\`\``,
        codeSnippets: [
          {
            id: 'snip-split',
            title: 'Splitting emails and names',
            code: `import pandas as pd

df = pd.DataFrame({
    "full_name": ["Alice Walker", "Bob Marley", "Cher"],
    "email": ["alice@company.com", "bob@music.org", "cher@diva.net"]
})

df["domain"] = df["email"].str.split("@").str[1]
name_parts = df["full_name"].str.split(" ", n=1, expand=True)
df["first_name"] = name_parts[0]
df["last_name"] = name_parts[1].fillna("")

print(df[["first_name", "last_name", "domain"]])`,
            expectedOutput: `  first_name last_name        domain
0      Alice    Walker   company.com
1        Bob    Marley     music.org
2       Cher                diva.net`,
            explanation: 'expand=True creates a multi-column DataFrame, and .fillna("") cleanly handles single-word names.'
          }
        ]
      }
    ],
    commonTraps: [
      {
        title: 'Comparing values against np.nan using ==',
        badSnippet: `# ❌ Returns False for every row, even missing ones!
missing_rows = df[df['score'] == np.nan]`,
        badExplanation: 'In IEEE 754 floating point arithmetic, NaN is never equal to NaN.',
        goodSnippet: `# ✅ Use .isna()
missing_rows = df[df['score'].isna()]`,
        goodExplanation: '.isna() correctly identifies all forms of null and missing values in Pandas.',
        perfImpact: 'Prevents silent logic bugs where missing data goes undetected.'
      },
      {
        title: 'Computing mean for imputation in skewed data',
        badSnippet: `# ❌ Skewed by extreme outliers
impute_val = df['income'].mean()`,
        badExplanation: 'If a billionaire is in the dataset, the mean is drastically inflated, corrupting imputed values.',
        goodSnippet: `# ✅ Use median for robust imputation
impute_val = df['income'].median()`,
        goodExplanation: 'The median represents the central tendency without being affected by extreme outliers.',
        perfImpact: 'Maintains statistical integrity of machine learning features.'
      },
      {
        title: 'Forgetting .str accessor when calling string methods',
        badSnippet: `# ❌ AttributeError: 'Series' object has no attribute 'lower'
df['email'] = df['email'].lower()`,
        badExplanation: 'A Series is not a string; it is a container of strings. You must access string methods via .str.',
        goodSnippet: `# ✅ Use the .str accessor
df['email'] = df['email'].str.lower()`,
        goodExplanation: 'The .str accessor routes string operations element-by-element across the Series.',
        perfImpact: 'Eliminates runtime syntax and attribute crashes.'
      }
    ],
    apiCheatSheet: [
      {
        name: 'df.isna',
        category: 'Cleaning',
        signature: 'df.isna()',
        summary: 'Detect missing values across all elements in the DataFrame.',
        parameters: [],
        returns: 'DataFrame of booleans (True where NaN).',
        exampleSnippet: 'null_mask = df.isna()'
      },
      {
        name: 'df.dropna',
        category: 'Cleaning',
        signature: 'df.dropna(axis=0, how="any", subset=None)',
        summary: 'Remove missing values along a specified axis.',
        parameters: [
          { name: 'subset', type: 'list[str], optional', desc: 'Columns to consider when checking for nulls.' },
          { name: 'how', type: '"any" | "all"', desc: 'Whether to drop if any or all cells are null.' }
        ],
        returns: 'pd.DataFrame with null rows/columns removed.',
        exampleSnippet: 'df.dropna(subset=["user_id"])'
      },
      {
        name: 'series.fillna',
        category: 'Cleaning',
        signature: 'series.fillna(value=None)',
        summary: 'Fill NA/NaN values using the specified value or method.',
        parameters: [
          { name: 'value', type: 'scalar | dict | Series', desc: 'Value to use to fill holes.' }
        ],
        returns: 'Series with nulls filled.',
        exampleSnippet: 'df["age"] = df["age"].fillna(df["age"].median())'
      },
      {
        name: 'series.str.split',
        category: 'String',
        signature: 'series.str.split(pat=None, n=-1, expand=False)',
        summary: 'Split strings around given separator/delimiter.',
        parameters: [
          { name: 'pat', type: 'str', desc: 'String or regular expression to split on.' },
          { name: 'n', type: 'int, default -1', desc: 'Limit number of splits in output.' },
          { name: 'expand', type: 'bool, default False', desc: 'Expand the split strings into separate columns.' }
        ],
        returns: 'Series or DataFrame of split tokens.',
        exampleSnippet: 'df["name"].str.split(" ", n=1, expand=True)'
      }
    ]
  },
  challenges: [
    {
      id: 'pandas-p3-c1',
      dayId: 3,
      partId: 3,
      title: 'Missing Data Imputer & Cleaner',
      slug: 'missing-data-imputer-cleaner',
      difficulty: 'Intermediate',
      category: 'Data Cleaning & Imputation',
      summary: 'Audit missing values across a dataset, drop unrecoverable rows missing critical identifiers, and impute numeric gaps with column medians.',
      mentalModel5s: 'Audit with isna().sum(), drop critical nulls with dropna(subset=...), and fill numeric gaps with median.',
      visualAnalogy: 'A quality control pipeline on an assembly line: discarding defective products that lack serial numbers, and filling minor cosmetic gaps with standard sealant.',
      pitfalls: [
        'Calculating median before dropping corrupted rows instead of after.',
        'Not converting initial_null_counts to standard Python ints.'
      ],
      progressiveHints: [
        'Tier 1 (Validation): Check if df is a DataFrame and all critical_cols + numeric_impute_cols exist in df.columns.',
        'Tier 2 (Audit): `initial_null_counts = {str(col): int(df[col].isna().sum()) for col in df.columns}`.',
        'Tier 3 (Drop critical): `df_clean = df.dropna(subset=critical_cols).copy()`.',
        'Tier 4 (Impute medians): For each col in numeric_impute_cols: `df_clean[col] = df_clean[col].fillna(df_clean[col].median())`.'
      ],
      deepInternals: {
        title: 'NaN Representation in Memory',
        content: 'In Pandas, floating-point NaNs use the standard IEEE 754 float representation. When computing .median(), Pandas leverages Cython code that skips NaN bitmasks in single-pass linear scans.',
        keyRule: 'Always perform dropna on critical keys before computing summary statistics for imputation.'
      },
      instructions: `Audit and sanitize a messy dataset with missing values.

Write a function \`clean_and_impute_dataset(df: pd.DataFrame, critical_cols: list, numeric_impute_cols: list) -> dict\` that:
1. Validates inputs:
   - If \`df\` is not a \`pd.DataFrame\`, raise \`ValueError("df must be a pandas DataFrame")\`.
   - If any column in \`critical_cols\` or \`numeric_impute_cols\` is not in \`df.columns\`, raise \`KeyError("Specified column not found in DataFrame")\`.
2. Audits initial missing values: computes a dictionary \`initial_null_counts\` mapping each column name to its integer count of missing/null values.
3. Drops rows with unrecoverable missing values where any column in \`critical_cols\` contains null values.
4. For each column in \`numeric_impute_cols\`, computes the median of that column across the filtered dataset and imputes missing values using the calculated column median.
5. Computes \`rows_dropped\` as the integer difference in row count between the initial dataset and the filtered dataset.
6. Computes \`remaining_nulls\` as an integer sum of nulls across the \`numeric_impute_cols\` in the cleaned DataFrame.
7. Resets the index of the cleaned DataFrame to a sequential 0-based index.
8. Returns a dictionary:
   \`{"cleaned_df": df_clean, "initial_null_counts": initial_null_counts, "rows_dropped": rows_dropped, "remaining_nulls": remaining_nulls}\`.`,
      hints: [
        'Compute initial counts: `{str(c): int(df[c].isna().sum()) for c in df.columns}`.',
        'Drop critical nulls: `df.dropna(subset=critical_cols).copy()`.',
        'Fill each numeric column: `df_clean[c] = df_clean[c].fillna(df_clean[c].median())`.'
      ],
      starterCode: `import pandas as pd

def clean_and_impute_dataset(df: pd.DataFrame, critical_cols: list, numeric_impute_cols: list) -> dict:
    """
    Audit missing data, drop rows missing critical keys, and impute numeric gaps with median.
    
    Args:
        df: Input pandas DataFrame.
        critical_cols: List of column names where missing values require row removal.
        numeric_impute_cols: List of numeric column names to impute using column medians.
        
    Returns:
        Dictionary with keys: 'cleaned_df', 'initial_null_counts', 'rows_dropped', 'remaining_nulls'.
    """
    # TODO: Validate inputs, audit nulls, drop unrecoverable rows, impute medians, and return dict
    pass
`,
      solutionCode: `import pandas as pd

def clean_and_impute_dataset(df: pd.DataFrame, critical_cols: list, numeric_impute_cols: list) -> dict:
    if not isinstance(df, pd.DataFrame):
        raise ValueError("df must be a pandas DataFrame")
    all_specified = set(critical_cols + numeric_impute_cols)
    if not all_specified.issubset(set(df.columns)):
        raise KeyError("Specified column not found in DataFrame")
        
    initial_null_counts = {str(col): int(df[col].isna().sum()) for col in df.columns}
    
    df_clean = df.dropna(subset=critical_cols).copy()
    rows_dropped = int(len(df) - len(df_clean))
    
    for col in numeric_impute_cols:
        median_val = df_clean[col].median()
        df_clean[col] = df_clean[col].fillna(median_val)
        
    remaining_nulls = int(df_clean[numeric_impute_cols].isna().sum().sum())
    
    return {
        "cleaned_df": df_clean.reset_index(drop=True),
        "initial_null_counts": initial_null_counts,
        "rows_dropped": rows_dropped,
        "remaining_nulls": remaining_nulls,
    }
`,
      testCases: [
        {
          id: 't1',
          name: 'Messy Data Imputation',
          inputDescription: 'Dataset with null user_ids and null scores/ages',
          expectedOutput: 'rows_dropped=1, remaining_nulls=0, imputed with medians 80.0 and 35.0'
        },
        {
          id: 't2',
          name: 'Complete Pristine Data',
          inputDescription: 'Dataset with zero missing values',
          expectedOutput: 'rows_dropped=0, remaining_nulls=0'
        },
        {
          id: 't3',
          name: 'Missing Column Error',
          inputDescription: 'Column not present in DataFrame',
          expectedOutput: 'Raises KeyError'
        }
      ],
      benchmarkTargetMs: 0.8,
      memoryTargetMb: 0.2,
      conceptPrimer: {
        title: 'Data Auditing and Imputation',
        subtitle: 'Production strategies for handling incomplete datasets',
        overview: 'Systematic data cleaning separates unrecoverable records from imputable measurements, preserving dataset power while ensuring data integrity.',
        mentalModel5s: 'Audit -> Drop unrecoverable records -> Impute valid numeric columns with medians.',
        visualAnalogy: 'Sorting incoming mail: discarding unaddressed envelopes and looking up missing zip codes in an index.',
        pitfalls: [
          'Using == np.nan which is always False.'
        ],
        progressiveHints: [
          'Step 1: Check column existence in df.columns.',
          'Step 2: Calculate isna().sum() for all columns.',
          'Step 3: Drop rows with dropna(subset=critical_cols).',
          'Step 4: Impute medians with fillna.'
        ],
        mathFormulas: [
          {
            title: 'Sample Median',
            latex: '\\tilde{x} = \\begin{cases} x_{(n+1)/2} & \\text{if } n \\text{ is odd} \\\\ \\frac{x_{n/2} + x_{n/2+1}}{2} & \\text{if } n \\text{ is even} \\end{cases}',
            explanation: 'The median is resistant to extreme outliers in numerical columns.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Looping to find and replace NaNs
for i in range(len(df)):
    if np.isnan(df.loc[i, 'score']):
        df.loc[i, 'score'] = median_score`,
          naiveExplanation: 'Extremely slow row indexing.',
          idiomaticCode: `# Vectorized C imputation
df['score'] = df['score'].fillna(df['score'].median())`,
          idiomaticExplanation: 'Compiled memory replacement in a single operation.',
          speedupText: '60x faster'
        },
        memoryLayout: {
          title: 'Bitmap Validity Masks',
          content: 'Modern Pandas uses 1-bit boolean bitmaps to track NaN presence without modifying underlying memory buffers.',
          diagramAscii: `Data Buffer: [80.0, 0.0, 95.0] + Null Bitmap: [1, 0, 1] -> fillna replaces 0 bits`,
          keyRule: 'fillna directly updates valid slots.'
        },
        keyTakeaways: [
          '.isna().sum() counts missing values per column.',
          'Use .dropna(subset=...) to target specific critical keys.',
          'Use .fillna(median) for outlier-robust numeric imputation.'
        ]
      }
    },
    {
      id: 'pandas-p3-c2',
      dayId: 3,
      partId: 3,
      title: 'Customer Email & Name Normalizer',
      slug: 'customer-email-name-normalizer',
      difficulty: 'Beginner',
      category: 'String Cleaning (.str)',
      summary: 'Clean customer records using vectorized string operations, standardizing casing, stripping whitespace, and extracting domain and name components.',
      mentalModel5s: 'Use .str to apply string methods across entire columns: .str.strip(), .str.lower(), .str.split().',
      visualAnalogy: 'A postal sorting machine that cleans smudges, standardizes capitalization, and stamps routing codes on every envelope.',
      pitfalls: [
        'Calling string methods directly on the Series without the .str accessor.',
        'Not handling single-word names when extracting first and last names.'
      ],
      progressiveHints: [
        'Tier 1 (Validation): Check if full_name and email columns exist in df.',
        'Tier 2 (Email): `clean_df["email"] = clean_df["email"].str.strip().str.lower()`.',
        'Tier 3 (Domain): `clean_df["email_domain"] = clean_df["email"].str.split("@").str[1]`.',
        'Tier 4 (Names): Split full_name with `clean_df["full_name"].str.split(pat=" ", n=1, expand=True)` and fill last_name nulls with "".'
      ],
      deepInternals: {
        title: 'The .str Accessor Architecture',
        content: 'The .str accessor wraps string methods and delegates execution to compiled Cython loops, bypassing Python object iteration while handling null values gracefully.',
        keyRule: 'Always use expand=True with .str.split() when creating new columns from split parts.'
      },
      instructions: `Clean and standardize customer contact data using vectorized string methods.

Write a function \`normalize_customer_records(df: pd.DataFrame) -> pd.DataFrame\` that:
1. Validates inputs:
   - If \`df\` is not a \`pd.DataFrame\`, raise \`ValueError("df must be a pandas DataFrame")\`.
   - If \`'full_name'\` or \`'email'\` is missing from \`df.columns\`, raise \`KeyError("Missing 'full_name' or 'email' column")\`.
2. Creates a copy of the DataFrame.
3. Cleanses \`'email'\` text by trimming leading/trailing whitespace and converting all characters to lowercase.
4. Extracts the \`'email_domain'\` by isolating the domain token following the \`'@'\` delimiter in the email address.
5. Normalizes \`'full_name'\` by trimming whitespace and converting to Title Case.
6. Splits \`'full_name'\` into separate \`'first_name'\` and \`'last_name'\` columns at the first whitespace delimiter (for single-word names, \`'first_name'\` takes the word and \`'last_name'\` should be an empty string \`""\`).
7. Returns the updated DataFrame.`,
      hints: [
        'Chain email operations: `df["email"].str.strip().str.lower()`.',
        'Extract domain: `df["email"].str.split("@").str[1]`.',
        'Use `str.split(pat=" ", n=1, expand=True)` for names, and `.fillna("")` for single-word names.'
      ],
      starterCode: `import pandas as pd

def normalize_customer_records(df: pd.DataFrame) -> pd.DataFrame:
    """
    Standardize customer email casing, extract email domain, and split full names into first and last names.
    
    Args:
        df: Input pandas DataFrame containing 'full_name' and 'email' string columns.
        
    Returns:
        Cleaned pandas DataFrame with new 'email_domain', 'first_name', and 'last_name' columns.
    """
    # TODO: Validate inputs, normalize strings, and return cleaned DataFrame
    pass
`,
      solutionCode: `import pandas as pd

def normalize_customer_records(df: pd.DataFrame) -> pd.DataFrame:
    if not isinstance(df, pd.DataFrame):
        raise ValueError("df must be a pandas DataFrame")
    if "full_name" not in df.columns or "email" not in df.columns:
        raise KeyError("Missing 'full_name' or 'email' column")
        
    clean_df = df.copy()
    clean_df["email"] = clean_df["email"].str.strip().str.lower()
    clean_df["email_domain"] = clean_df["email"].str.split("@").str[1]
    clean_df["full_name"] = clean_df["full_name"].str.strip().str.title()
    
    split_names = clean_df["full_name"].str.split(pat=" ", n=1, expand=True)
    clean_df["first_name"] = split_names[0]
    clean_df["last_name"] = split_names[1].fillna("")
    
    return clean_df
`,
      testCases: [
        {
          id: 't1',
          name: 'Messy Name & Email Strings',
          inputDescription: 'Names with extra spaces, uppercase emails',
          expectedOutput: 'email lowercased, domain extracted, full_name title-cased'
        },
        {
          id: 't2',
          name: 'Single-Word Name',
          inputDescription: 'Record with full_name="cher"',
          expectedOutput: 'first_name="Cher", last_name=""'
        },
        {
          id: 't3',
          name: 'Missing Columns Error',
          inputDescription: 'Missing full_name or email column',
          expectedOutput: 'Raises KeyError'
        }
      ],
      benchmarkTargetMs: 0.8,
      memoryTargetMb: 0.2,
      conceptPrimer: {
        title: 'Vectorized String Manipulation with .str',
        subtitle: 'High-performance text cleaning across columns',
        overview: 'Pandas exposes standard Python string methods via the .str accessor, allowing vectorized string transformations that handle missing values cleanly.',
        mentalModel5s: 'df[col].str.<method>() transforms every text element simultaneously.',
        visualAnalogy: 'Running a text formatter on an entire spreadsheet column with a single click.',
        pitfalls: [
          'Forgetting .str when calling string methods on a Series.'
        ],
        progressiveHints: [
          'Step 1: Check full_name and email columns.',
          'Step 2: Clean email with .str.strip().str.lower().',
          'Step 3: Extract domain with .str.split("@").str[1].',
          'Step 4: Title-case full_name and split into first/last.'
        ],
        mathFormulas: [
          {
            title: 'String Partitioning',
            latex: '\\text{email} = u \\mathbin{\\Vert} \\text{"@"} \\mathbin{\\Vert} d \\implies d = \\text{split}(\\text{email}, \\text{"@"})_{[1]}',
            explanation: 'Extracting domain from email via delimiter splitting.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Python loop over strings
domains = []
for em in df['email']:
    domains.append(em.strip().lower().split('@')[1])
df['domain'] = domains`,
          naiveExplanation: 'Fails if any email is None or missing, and runs slowly.',
          idiomaticCode: `# Vectorized .str accessor
df['domain'] = df['email'].str.strip().str.lower().str.split('@').str[1]`,
          idiomaticExplanation: 'Safe against missing values and executed in compiled C.',
          speedupText: '40x faster'
        },
        memoryLayout: {
          title: 'String Array Pointers',
          content: 'The .str accessor operates on arrays of string pointers, allocating new string objects in contiguous batches.',
          diagramAscii: `Email Series -> .str.split("@") -> Split List Series -> .str[1] -> Domain Series`,
          keyRule: 'expand=True turns split results directly into DataFrame columns.'
        },
        keyTakeaways: [
          'Use .str.strip().str.lower() to normalize text.',
          '.str.split(pat, expand=True) creates multiple columns directly.',
          'Chain .fillna("") on string columns to replace NaN with empty strings.'
        ]
      }
    }
  ]
};

export const DAY01_TRACK = DAY03_TRACK;
export const PANDAS_PART03_TRACK = DAY03_TRACK;
export const testCases = DAY03_TRACK.challenges.flatMap(c => c.testCases);
export type { DayTrack, Challenge, ConceptPrimerData, TestCase };
export default DAY03_TRACK;
