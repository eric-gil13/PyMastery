import type { DayTrack, Challenge, ConceptPrimerData, TestCase } from '../../types';

export const DAY04_TRACK: DayTrack = {
  partNumber: 4,
  partId: 4,
  dayNumber: 4,
  id: 4,
  title: 'Part 4: GroupBy & Summary Aggregations',
  subtitle: 'Master the Split-Apply-Combine mental model, multi-column groupbys, and custom named aggregations',
  description: 'Unlock the analytical heart of Pandas: Split-Apply-Combine. Learn how to segment datasets by one or more categorical keys, calculate multi-metric summary tables using clean modern named aggregations, compute derived business metrics on aggregated groups, and rank top performers within each category without loops.',
  iconName: 'Layers',
  badge: 'Part 4 • GroupBy & Aggregations',
  libraryMechanics: {
    libraryName: 'Pandas GroupBy & Aggregation Engine',
    tagline: 'Partition, compute, and summarize millions of records with high-performance Cython groupby kernels.',
    overview: `### 📊 Split-Apply-Combine: The Foundation of Data Analytics
When analyzing business performance, scientific measurements, or web traffic, summary metrics rarely apply to an entire dataset uniformly. We want to know:
- *"What is the average salary and headcount per department?"*
- *"What are the top 3 selling product categories in each region?"*
- *"What is the monthly churn rate by customer tier?"*

### ⚡ The 3 Phases of GroupBy
1. **Split:** Pandas partitions rows into distinct buckets based on key values (e.g. "Engineering", "Sales", "HR").
2. **Apply:** A reduction or transformation function (like \`mean\`, \`sum\`, \`count\`, \`max\`) runs across each bucket in compiled C.
3. **Combine:** The calculated statistics are reassembled into a single clean summary DataFrame.`,
    whyItExists: `Doing group-level statistics in vanilla Python requires building dictionaries of lists, iterating over every row, and manually calculating sums and counts.
Pandas solves this with:
- **Zero-Copy Group Partitioning:** Group labels are mapped using fast integer hash buckets.
- **Cython-Accelerated Aggregations:** Built-in operations like \`.mean()\`, \`.sum()\`, and \`.count()\` run in C without Python loop overhead.
- **Named Aggregations:** \`new_col_name=(source_col, func)\` eliminates confusing multi-level column indexes.`,
    coreAnatomy: {
      objectName: 'DataFrameGroupBy',
      description: 'An intermediate grouped container that dispatches Cython aggregations across partitions.',
      fields: [
        {
          name: '.groupby(keys, as_index=False)',
          type: 'Method',
          role: 'Splits DataFrame rows into groups based on single or multiple column keys.'
        },
        {
          name: '.agg(**kwargs)',
          type: 'Method',
          role: 'Applies named aggregations: col_name=(source_column, aggregation_function).'
        },
        {
          name: '.head(n)',
          type: 'Method',
          role: 'Returns the top n rows of each group (ideal for group-level ranking).'
        }
      ],
      memoryDiagramAscii: `+-------------------------------------------------------------+
|               The Split-Apply-Combine Execution             |
|                                                             |
|  Original: [ (Eng, 100k), (Sales, 60k), (Eng, 120k) ]       |
|                                                             |
|  SPLIT:    Eng -> [100k, 120k]     Sales -> [60k]           |
|  APPLY:    Eng Mean = 110k         Sales Mean = 60k         |
|  COMBINE:  [ (Eng, 110k), (Sales, 60k) ]                    |
+-------------------------------------------------------------+`
    },
    chapters: [
      {
        id: 'ch1-split-apply-combine',
        title: 'The Split-Apply-Combine Mental Model',
        icon: 'Layers',
        summary: 'How Pandas segments, calculates, and recombines tabular data.',
        markdownContent: `### The 3 Steps of GroupBy

\`\`\`python
import pandas as pd

df = pd.DataFrame({
    "dept": ["Eng", "Sales", "Eng", "Sales", "Eng"],
    "salary": [100000, 70000, 120000, 75000, 110000]
})

# Single column groupby
summary = df.groupby("dept", as_index=False)["salary"].mean()
print(summary)
\`\`\`

> **Pro Tip: \`as_index=False\`**
> By default, Pandas makes the grouping column the index of the output DataFrame. Passing \`as_index=False\` keeps the grouping column as a standard column!`,
        codeSnippets: [
          {
            id: 'snip-basic-groupby',
            title: 'Simple GroupBy with as_index=False',
            code: `import pandas as pd

df = pd.DataFrame({
    "department": ["Engineering", "HR", "Engineering", "Marketing", "HR"],
    "salary": [95000, 62000, 105000, 75000, 68000]
})

avg_salaries = df.groupby("department", as_index=False)["salary"].mean()
print(avg_salaries)`,
            expectedOutput: `    department    salary
0  Engineering  100000.0
1           HR   65000.0
2    Marketing   75000.0`,
            explanation: 'Pandas groups rows by department and calculates the average salary for each group.'
          }
        ]
      },
      {
        id: 'ch2-named-aggregations',
        title: 'Modern Named Aggregations with .agg()',
        icon: 'ListPlus',
        summary: 'Compute multiple metrics per group with clean column names.',
        markdownContent: `### Why Named Aggregations?

In older versions of Pandas, running multiple aggregations created messy multi-level column tuples like \`('salary', 'mean')\`.

Modern Pandas provides **Named Aggregations**:
\`\`\`python
summary = df.groupby("department", as_index=False).agg(
    avg_salary=("salary", "mean"),
    max_salary=("salary", "max"),
    headcount=("employee_id", "count")
)
\`\`\`

Every output column is cleanly named and accessible directly!`,
        codeSnippets: [
          {
            id: 'snip-named-agg',
            title: 'Named aggregations in action',
            code: `import pandas as pd

df = pd.DataFrame({
    "emp_id": [1, 2, 3, 4, 5],
    "dept": ["Eng", "Sales", "Eng", "Sales", "Eng"],
    "salary": [90000, 60000, 110000, 80000, 100000]
})

summary = df.groupby("dept", as_index=False).agg(
    mean_salary=("salary", "mean"),
    max_salary=("salary", "max"),
    headcount=("emp_id", "count")
)
print(summary)`,
            expectedOutput: `    dept  mean_salary  max_salary  headcount
0    Eng     100000.0      110000          3
1  Sales      70000.0       80000          2`,
            explanation: 'Named aggregations produce flat, intuitive column headers in a single call.'
          }
        ]
      },
      {
        id: 'ch3-multi-column-groupby',
        title: 'Multi-Column GroupBy',
        icon: 'Grid',
        summary: 'Segmenting by multiple categorical dimensions simultaneously.',
        markdownContent: `### Grouping by Multiple Columns

To analyze data across multiple hierarchies (e.g. Region and Category), pass a list of column names:

\`\`\`python
regional_sales = df.groupby(["region", "category"], as_index=False).agg(
    total_revenue=("revenue", "sum"),
    total_profit=("profit", "sum")
)
\`\`\`

Now every unique pair of (region, category) has its own aggregated row!`,
        codeSnippets: [
          {
            id: 'snip-multi-group',
            title: 'Multi-column grouping',
            code: `import pandas as pd

sales = pd.DataFrame({
    "region": ["North", "North", "South", "South"],
    "category": ["Tech", "Office", "Tech", "Office"],
    "revenue": [5000, 2000, 7000, 3000]
})

result = sales.groupby(["region", "category"], as_index=False).agg(
    total_rev=("revenue", "sum")
)
print(result)`,
            expectedOutput: `  region category  total_rev
0  North   Office       2000
1  North     Tech       5000
2  South   Office       3000
3  South     Tech       7000`,
            explanation: 'Multi-column groupby groups records by the Cartesian combination of all specified keys.'
          }
        ]
      },
      {
        id: 'ch4-derived-ranking',
        title: 'Derived Metrics & Grouped Ranking',
        icon: 'TrendingUp',
        summary: 'Calculating margins on aggregated tables and ranking top performers per group.',
        markdownContent: `### Derived Metrics and Grouped Ranking

After aggregation, you often need to:
1. **Compute ratios:** \`agg_df["profit_margin"] = agg_df["profit"] / agg_df["revenue"]\`.
2. **Sort:** \`agg_df.sort_values(by=["region", "profit_margin"], ascending=[True, False])\`.
3. **Pick Top N per group:** \`agg_df.groupby("region").head(N)\`.

\`\`\`python
# Top 2 categories per region by margin
top_performers = (
    agg_df
    .sort_values(by=["region", "profit_margin"], ascending=[True, False])
    .groupby("region", as_index=False)
    .head(2)
)
\`\`\``,
        codeSnippets: [
          {
            id: 'snip-rank',
            title: 'Grouped ranking with .head()',
            code: `import pandas as pd

df = pd.DataFrame({
    "region": ["East", "East", "East", "West", "West"],
    "product": ["Widget A", "Widget B", "Widget C", "Widget X", "Widget Y"],
    "sales": [500, 800, 300, 950, 400]
})

# Sort by sales descending, then pick top 1 per region
top_per_region = (
    df.sort_values(by=["region", "sales"], ascending=[True, False])
    .groupby("region", as_index=False)
    .head(1)
)
print(top_per_region)`,
            expectedOutput: `  region   product  sales
1   East  Widget B    800
3   West  Widget X    950`,
            explanation: 'Sorting before groupby().head(n) returns the top n records for each group.'
          }
        ]
      }
    ],
    commonTraps: [
      {
        title: 'Omitting as_index=False and struggling with index columns',
        badSnippet: `# ❌ Grouping column becomes the DataFrame index
res = df.groupby('dept')['salary'].mean()
# res['dept'] -> KeyError!`,
        badExplanation: 'When as_index=True (the default), the grouping key is moved to the row index, breaking standard column lookups.',
        goodSnippet: `# ✅ Keep grouping keys as standard columns
res = df.groupby('dept', as_index=False)['salary'].mean()`,
        goodExplanation: 'as_index=False keeps the output as a flat, normal DataFrame.',
        perfImpact: 'Simplifies downstream column access and avoids unnecessary reset_index() calls.'
      },
      {
        title: 'Using manual loops instead of groupby',
        badSnippet: `# ❌ Slow and verbose
dept_salaries = {}
for idx, row in df.iterrows():
    dept_salaries.setdefault(row['dept'], []).append(row['salary'])
means = {d: sum(s)/len(s) for d, s in dept_salaries.items()}`,
        badExplanation: 'Manual dictionary aggregation is 100x slower and requires dozens of lines of error-prone boilerplate.',
        goodSnippet: `# ✅ One clean vectorized line
means = df.groupby('dept')['salary'].mean()`,
        goodExplanation: 'Pandas executes group reductions in optimized Cython/C kernels.',
        perfImpact: 'Runs up to 100x faster on large datasets.'
      },
      {
        title: 'Applying python functions instead of built-in string aggregations',
        badSnippet: `# ❌ Slow: .agg(lambda x: x.mean())
df.groupby('dept')['salary'].agg(lambda x: x.mean())`,
        badExplanation: 'Lambda functions force Pandas to exit compiled code and invoke Python bytecode for every group.',
        goodSnippet: `# ✅ Fast: Built-in Cython string kernel
df.groupby('dept')['salary'].agg('mean')`,
        goodExplanation: 'Passing string names like "mean", "sum", "max" triggers specialized C-level fast paths.',
        perfImpact: 'Up to 20x speedup compared to custom Python lambdas.'
      }
    ],
    apiCheatSheet: [
      {
        name: 'df.groupby',
        category: 'Aggregation',
        signature: 'df.groupby(by, as_index=True, sort=True)',
        summary: 'Group DataFrame using a mapper or by a Series of columns.',
        parameters: [
          { name: 'by', type: 'str | list[str]', desc: 'Column name or list of column names to group by.' },
          { name: 'as_index', type: 'bool, default True', desc: 'Return object with group labels as index.' }
        ],
        returns: 'DataFrameGroupBy object.',
        exampleSnippet: 'df.groupby("department", as_index=False)'
      },
      {
        name: 'groupby.agg',
        category: 'Aggregation',
        signature: 'groupby.agg(**kwargs)',
        summary: 'Aggregate using one or more operations with named columns.',
        parameters: [
          { name: 'kwargs', type: 'col_name=(source_col, func)', desc: 'Named aggregations.' }
        ],
        returns: 'pd.DataFrame of aggregated metrics.',
        exampleSnippet: 'df.groupby("dept", as_index=False).agg(avg_sal=("salary", "mean"))'
      },
      {
        name: 'groupby.head',
        category: 'Selection',
        signature: 'groupby.head(n=5)',
        summary: 'Return first n rows of each group.',
        parameters: [
          { name: 'n', type: 'int, default 5', desc: 'Number of rows to return from each group.' }
        ],
        returns: 'pd.DataFrame containing top n rows per group.',
        exampleSnippet: 'sorted_df.groupby("region", as_index=False).head(3)'
      },
      {
        name: 'df.sort_values',
        category: 'Sorting',
        signature: 'df.sort_values(by, ascending=True)',
        summary: 'Sort by the values along either axis.',
        parameters: [
          { name: 'by', type: 'str | list[str]', desc: 'Name or list of names to sort by.' },
          { name: 'ascending', type: 'bool | list[bool]', desc: 'Sort ascending vs descending.' }
        ],
        returns: 'pd.DataFrame with sorted values.',
        exampleSnippet: 'df.sort_values(by=["headcount", "salary"], ascending=[False, False])'
      }
    ]
  },
  challenges: [
    {
      id: 'pandas-p4-c1',
      dayId: 4,
      partId: 4,
      title: 'Department Salary & Headcount Aggregator',
      slug: 'department-salary-headcount-aggregator',
      difficulty: 'Intermediate',
      category: 'GroupBy & Aggregations',
      summary: 'Group employee records by department and compute the mean salary, maximum salary, and headcount using clean named aggregations.',
      mentalModel5s: 'Group by department, aggregate with named tuples, round mean_salary, and sort by headcount descending.',
      visualAnalogy: 'Sorting employees into departmental bins, calculating each bin summary card, and ranking the departments by team size.',
      pitfalls: [
        'Forgetting as_index=False, leaving department as the index.',
        'Not rounding mean_salary to 2 decimal places.',
        'Sorting in ascending order instead of descending order.'
      ],
      progressiveHints: [
        'Tier 1 (Validation): Check if df is a non-empty DataFrame and contains department, salary, and employee_id.',
        'Tier 2 (Aggregation): `df.groupby("department", as_index=False).agg(mean_salary=("salary", "mean"), max_salary=("salary", "max"), headcount=("employee_id", "count"))`.',
        'Tier 3 (Rounding): `agg_df["mean_salary"] = agg_df["mean_salary"].round(2)`.',
        'Tier 4 (Sorting): `agg_df.sort_values(by=["headcount", "mean_salary"], ascending=[False, False]).reset_index(drop=True)`.'
      ],
      deepInternals: {
        title: 'Cythonized Group Aggregations',
        content: 'When using named aggregations with string identifiers like "mean" and "count", Pandas routes execution to Cython reduction algorithms that bypass Python function dispatch entirely.',
        keyRule: 'Use named aggregations to produce clean, single-level column headers.'
      },
      instructions: `Analyze company payroll and team distributions across departments.

Write a function \`aggregate_department_metrics(df: pd.DataFrame) -> pd.DataFrame\` that:
1. Validates inputs:
   - If \`df\` is not a \`pd.DataFrame\` or \`df.empty\`, raise \`ValueError("df must be a non-empty DataFrame")\`.
   - If any of \`['department', 'salary', 'employee_id']\` are missing from \`df.columns\`, raise \`KeyError("Missing required columns")\`.
2. Groups records by department (retaining \`'department'\` as a standard column) and aggregates metrics:
   - \`'mean_salary'\`: average salary
   - \`'max_salary'\`: maximum salary
   - \`'headcount'\`: total count of employee IDs
3. Rounds \`'mean_salary'\` to 2 decimal places.
4. Sorts the resulting table by \`'headcount'\` descending, breaking ties by \`'mean_salary'\` descending.
5. Resets the row index to a sequential 0-based index.
6. Returns the aggregated DataFrame.`,
      hints: [
        'Use `df.groupby("department", as_index=False).agg(...)`.',
        'Specify named tuples: `mean_salary=("salary", "mean")`, etc.',
        'Round with `.round(2)` and sort with `.sort_values(by=["headcount", "mean_salary"], ascending=[False, False])`.'
      ],
      starterCode: `import pandas as pd

def aggregate_department_metrics(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute mean salary, max salary, and headcount per department using named aggregations.
    
    Args:
        df: Input pandas DataFrame with 'department', 'salary', and 'employee_id' columns.
        
    Returns:
        Aggregated, sorted pandas DataFrame with reset index.
    """
    # TODO: Validate inputs, aggregate department metrics, sort, and return DataFrame
    pass
`,
      solutionCode: `import pandas as pd

def aggregate_department_metrics(df: pd.DataFrame) -> pd.DataFrame:
    if not isinstance(df, pd.DataFrame) or df.empty:
        raise ValueError("df must be a non-empty DataFrame")
    required = {"department", "salary", "employee_id"}
    if not required.issubset(set(df.columns)):
        raise KeyError("Missing required columns")
        
    agg_df = df.groupby("department", as_index=False).agg(
        mean_salary=("salary", "mean"),
        max_salary=("salary", "max"),
        headcount=("employee_id", "count")
    )
    agg_df["mean_salary"] = agg_df["mean_salary"].round(2)
    agg_df = agg_df.sort_values(
        by=["headcount", "mean_salary"],
        ascending=[False, False]
    ).reset_index(drop=True)
    
    return agg_df
`,
      testCases: [
        {
          id: 't1',
          name: 'Multi-Department Aggregation',
          inputDescription: '7 employees across 4 departments',
          expectedOutput: 'Engineering top with headcount=3, mean_salary=103333.33'
        },
        {
          id: 't2',
          name: 'Tie Breaking by Mean Salary',
          inputDescription: 'Departments with equal headcount',
          expectedOutput: 'Sorted by mean_salary descending for tie breaking'
        },
        {
          id: 't3',
          name: 'Missing Columns Validation',
          inputDescription: 'DataFrame missing employee_id column',
          expectedOutput: 'Raises KeyError'
        }
      ],
      benchmarkTargetMs: 0.8,
      memoryTargetMb: 0.2,
      conceptPrimer: {
        title: 'Named Aggregations with GroupBy',
        subtitle: 'Producing clean, single-level summary tables',
        overview: 'Named aggregations allow data analysts to specify output column names, input columns, and statistical functions in one clean expression.',
        mentalModel5s: 'df.groupby(keys, as_index=False).agg(output_name=(input_col, func)).',
        visualAnalogy: 'Writing a multi-column summary report where you label each column header clearly.',
        pitfalls: [
          'Forgetting as_index=False.'
        ],
        progressiveHints: [
          'Step 1: Check required columns.',
          'Step 2: Group by department with as_index=False.',
          'Step 3: Define named aggregations.',
          'Step 4: Round mean_salary and sort values.'
        ],
        mathFormulas: [
          {
            title: 'Group Mean',
            latex: '\\mu_g = \\frac{1}{N_g} \\sum_{i \\in g} x_i',
            explanation: 'Calculated independently for each departmental partition.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Manual dictionary tracking
depts = {}
for idx, r in df.iterrows():
    depts.setdefault(r['dept'], []).append(r['salary'])
res = pd.DataFrame([{'dept': d, 'mean': sum(s)/len(s)} for d, s in depts.items()])`,
          naiveExplanation: 'Allocates numerous temporary Python lists and runs slowly.',
          idiomaticCode: `# Modern named aggregation
res = df.groupby('dept', as_index=False).agg(mean_salary=('salary', 'mean'))`,
          idiomaticExplanation: 'Single-pass compiled grouping and reduction in C.',
          speedupText: '70x faster'
        },
        memoryLayout: {
          title: 'Grouping Hash Map',
          content: 'Pandas maps categorical group labels to integer group codes, grouping memory pointers together before reduction.',
          diagramAscii: `Group Key -> Integer Code -> Dispatched C Aggregation Buffer -> Output Series`,
          keyRule: 'as_index=False retains grouping keys as DataFrame columns.'
        },
        keyTakeaways: [
          'Use named aggregations: col_name=(source, func).',
          'Use as_index=False to prevent grouping columns from becoming the index.',
          'Sort multiple columns with list of booleans: ascending=[False, False].'
        ]
      }
    },
    {
      id: 'pandas-p4-c2',
      dayId: 4,
      partId: 4,
      title: 'Regional Performance Ranker',
      slug: 'regional-performance-ranker',
      difficulty: 'Intermediate',
      category: 'Multi-Column GroupBy & Ranking',
      summary: 'Aggregate sales and profit across regions and categories, calculate profit margin, and rank the top N categories within each region.',
      mentalModel5s: 'Group by region and category, calculate margin, sort by margin, and pick top N per region with groupby().head(N).',
      visualAnalogy: 'A regional leaderboard showing the top 3 best-performing product lines in each sales territory.',
      pitfalls: [
        'Calculating profit margin before aggregating sums instead of after.',
        'Not validating that top_n is a positive integer.'
      ],
      progressiveHints: [
        'Tier 1 (Validation): Check if sales_df is non-empty, top_n > 0, and region, category, revenue, profit exist.',
        'Tier 2 (Multi-column groupby): `agg_df = sales_df.groupby(["region", "category"], as_index=False).agg(total_revenue=("revenue", "sum"), total_profit=("profit", "sum"))`.',
        'Tier 3 (Margin): `agg_df["profit_margin"] = (agg_df["total_profit"] / agg_df["total_revenue"]).round(4)`.',
        'Tier 4 (Ranking): Sort by region asc and profit_margin desc, then `sorted_df.groupby("region", as_index=False).head(top_n).reset_index(drop=True)`.'
      ],
      deepInternals: {
        title: 'Grouped Filtering with .head()',
        content: 'When calling .head(n) on a DataFrameGroupBy object, Pandas generates a running counter per group code and returns rows where counter <= n, retaining original DataFrame formatting.',
        keyRule: 'Sort by the ranking metric BEFORE calling groupby().head(n) to select top performers.'
      },
      instructions: `Calculate regional product profitability and rank top categories per territory.

Write a function \`rank_regional_performance(sales_df: pd.DataFrame, top_n: int = 3) -> pd.DataFrame\` that:
1. Validates inputs:
   - If \`sales_df\` is not a \`pd.DataFrame\` or \`sales_df.empty\`, raise \`ValueError("sales_df must be a non-empty DataFrame")\`.
   - If \`top_n <= 0\`, raise \`ValueError("top_n must be a positive integer")\`.
   - If any of \`['region', 'category', 'revenue', 'profit']\` are missing from \`sales_df.columns\`, raise \`KeyError("Missing required sales columns")\`.
2. Groups records by region and category (retaining grouping keys as regular columns) and aggregates metrics:
   - \`'total_revenue'\`: sum of revenue
   - \`'total_profit'\`: sum of profit
3. Computes \`'profit_margin'\` as total profit divided by total revenue, rounded to 4 decimal places.
4. Sorts the aggregated records by \`'region'\` ascending, breaking ties by \`'profit_margin'\` descending.
5. Extracts the top \`top_n\` highest-margin categories within each region.
6. Resets the row index to a clean 0-based sequence.
7. Returns the ranked DataFrame.`,
      hints: [
        'Multi-column groupby: `sales_df.groupby(["region", "category"], as_index=False).agg(...)`.',
        'Calculate margin: `(agg_df["total_profit"] / agg_df["total_revenue"]).round(4)`.',
        'Sort before head: `agg_df.sort_values(by=["region", "profit_margin"], ascending=[True, False])`.',
        'Select top rows: `sorted_df.groupby("region", as_index=False).head(top_n).reset_index(drop=True)`.'
      ],
      starterCode: `import pandas as pd

def rank_regional_performance(sales_df: pd.DataFrame, top_n: int = 3) -> pd.DataFrame:
    """
    Group by region and category, calculate profit margin, and return top N categories per region.
    
    Args:
        sales_df: Input pandas DataFrame with 'region', 'category', 'revenue', and 'profit' columns.
        top_n: Number of top categories to select per region (default 3).
        
    Returns:
        Ranked pandas DataFrame with reset index.
    """
    # TODO: Validate inputs, group by region and category, compute margin, rank top categories, and return DataFrame
    pass
`,
      solutionCode: `import pandas as pd

def rank_regional_performance(sales_df: pd.DataFrame, top_n: int = 3) -> pd.DataFrame:
    if not isinstance(sales_df, pd.DataFrame) or sales_df.empty:
        raise ValueError("sales_df must be a non-empty DataFrame")
    if top_n <= 0:
        raise ValueError("top_n must be a positive integer")
    required = {"region", "category", "revenue", "profit"}
    if not required.issubset(set(sales_df.columns)):
        raise KeyError("Missing required sales columns")
        
    agg_df = sales_df.groupby(["region", "category"], as_index=False).agg(
        total_revenue=("revenue", "sum"),
        total_profit=("profit", "sum")
    )
    agg_df["profit_margin"] = (agg_df["total_profit"] / agg_df["total_revenue"]).round(4)
    sorted_df = agg_df.sort_values(
        by=["region", "profit_margin"],
        ascending=[True, False]
    ).reset_index(drop=True)
    
    top_ranked = sorted_df.groupby("region", as_index=False).head(top_n).reset_index(drop=True)
    return top_ranked
`,
      testCases: [
        {
          id: 't1',
          name: 'Multi-Region Top 2 Rank',
          inputDescription: 'North and South regions with 4 categories each, top_n=2',
          expectedOutput: 'Exactly 4 rows returned, South Office top with margin=0.5000'
        },
        {
          id: 't2',
          name: 'Invalid top_n Parameter',
          inputDescription: 'top_n=0 or top_n=-1',
          expectedOutput: 'Raises ValueError'
        },
        {
          id: 't3',
          name: 'Missing Columns Error',
          inputDescription: 'Missing profit column',
          expectedOutput: 'Raises KeyError'
        }
      ],
      benchmarkTargetMs: 0.8,
      memoryTargetMb: 0.2,
      conceptPrimer: {
        title: 'Multi-Column GroupBy & Grouped Ranking',
        subtitle: 'Hierarchical analytics and subgroup ranking',
        overview: 'Grouping across multiple categorical dimensions allows detailed multi-factor segmentation, while groupby().head(n) provides grouped ranking without manual partitioning.',
        mentalModel5s: 'Sort by score -> groupby(region).head(N) extracts the top N per region.',
        visualAnalogy: 'Sorting runners in each age bracket by race time and awarding medals to the top 3 finishers in each bracket.',
        pitfalls: [
          'Forgetting to sort before calling groupby().head().'
        ],
        progressiveHints: [
          'Step 1: Check required columns and top_n > 0.',
          'Step 2: Group by [region, category] with sum aggregations.',
          'Step 3: Calculate profit_margin.',
          'Step 4: Sort and apply groupby("region").head(top_n).'
        ],
        mathFormulas: [
          {
            title: 'Profit Margin',
            latex: '\\text{Margin} = \\frac{\\sum \\text{profit}}{\\sum \\text{revenue}}',
            explanation: 'Ratio of total aggregate profit to total aggregate revenue.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Manual region loops
results = []
for reg in sales_df['region'].unique():
    sub = sales_df[sales_df['region'] == reg]
    # manual category loops...`,
          naiveExplanation: 'Incurs repetitive table scans and slow filtering.',
          idiomaticCode: `# Multi-column groupby and head
agg = df.groupby(['region', 'category'], as_index=False).agg(...)
top = agg.sort_values(by=['region', 'profit_margin'], ascending=[True, False]).groupby('region', as_index=False).head(top_n)`,
          idiomaticExplanation: 'Single grouped pass with vectorized sorting.',
          speedupText: '50x faster'
        },
        memoryLayout: {
          title: 'Composite Key Hashing',
          content: 'Pandas creates a composite key hash from (region, category) pairs to build partition groups efficiently.',
          diagramAscii: `(Region, Category) Tuple -> Hash Key -> Aggregate Sums -> Derived Margin -> Top N Group Head`,
          keyRule: 'Grouped head(N) filters the table directly.'
        },
        keyTakeaways: [
          'Group by multiple columns with a list: df.groupby([col1, col2]).',
          'Calculate derived metrics after aggregation sums.',
          'Sort first, then use .groupby(region).head(n) to rank top items per group.'
        ]
      }
    }
  ]
};

export const DAY01_TRACK = DAY04_TRACK;
export const PANDAS_PART04_TRACK = DAY04_TRACK;
export const testCases = DAY04_TRACK.challenges.flatMap(c => c.testCases);
export type { DayTrack, Challenge, ConceptPrimerData, TestCase };
export default DAY04_TRACK;
