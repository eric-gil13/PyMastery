import type { DayTrack, Challenge, ConceptPrimerData, TestCase } from '../../types';

export type { DayTrack, Challenge, ConceptPrimerData, TestCase };

export const DAY05_TRACK: DayTrack = {
  partNumber: 5,
  partId: 5,
  dayNumber: 5,
  id: 5,
  title: 'Part 5: Merging, Joining & Combining Tables',
  subtitle: 'Master pd.concat for stacking and pd.merge for SQL-style relational joins across distributed tables',
  description: 'Learn how to combine real-world distributed datasets with confidence. Understand the mechanical difference between stacking rows with pd.concat and database joins with pd.merge. Master inner, left, right, and outer joins, handle overlapping column names with suffixes, and resolve missing values.',
  iconName: 'GitMerge',
  badge: 'Part 5 • Pandas Merging',
  libraryMechanics: {
    libraryName: 'Pandas Relational Operations & Table Concatenation',
    tagline: 'Combine, merge, and reconcile multi-source tabular data with high-performance C-hash joins.',
    overview: `### 🌟 Welcome to Part 5: Connecting the Dots Across Tables
In earlier lessons, you worked with single, isolated DataFrames. In the real world, enterprise systems never store all their data in one gigantic table:
- **Normalized Databases:** To prevent data redundancy, user profiles live in a \`users\` table, transactions in an \`orders\` table, and products in a \`catalog\` table.
- **Log Shards:** Web analytics and point-of-sale systems record events in separate daily, weekly, or quarterly files (\`q1_sales.csv\`, \`q2_sales.csv\`).
- **Multi-Source Ingestion:** Combining internal CRM records with third-party postal codes, tax rates, or demographic data.

Pandas gives you two essential operations to bring this data together:
1. **\`pd.concat()\`**: Gluing or stacking tables along rows (vertical) or columns (horizontal).
2. **\`pd.merge()\`**: Relational database-style joins using common key columns (inner, left, right, and full outer joins).`,
    whyItExists: `Without relational tools, combining datasets requires manual nested Python loops and dictionary lookups—which are slow (O(N*M)), memory-heavy, and error-prone.
Pandas executes joins using compiled C-level hash tables:
- **O(N + M) Speed:** Joins millions of rows in milliseconds by hashing join keys.
- **Null Safety:** Automatically aligns mismatched keys and inserts NaN sentinels where data is absent.
- **Memory Efficiency:** Avoids duplicating unchanged columns, preserving underlying NumPy/Arrow memory buffers.`,
    coreAnatomy: {
      objectName: 'pd.merge & pd.concat Engine',
      description: 'The relational merge engine matches rows between two DataFrames using an internal hash table built from the join keys, routing values into contiguous output blocks.',
      fields: [
        {
          name: 'how',
          type: "'inner' | 'left' | 'right' | 'outer' | 'cross'",
          role: 'Determines which keys are preserved in the output table. Default is "inner".'
        },
        {
          name: 'on / left_on / right_on',
          type: 'str | list[str]',
          role: 'Specifies the common key column(s) used to match rows between the left and right tables.'
        },
        {
          name: 'suffixes',
          type: 'tuple[str, str]',
          role: 'Suffixes appended to overlapping non-key column names (default is ("_x", "_y")).'
        },
        {
          name: 'axis',
          type: '0 (rows) | 1 (columns)',
          role: 'For pd.concat: determines whether tables are stacked vertically (axis=0) or horizontally (axis=1).'
        }
      ],
      memoryDiagramAscii: `+-------------------------------------------------------------------------------+
|                      pd.merge Hash Join Mechanics                             |
|                                                                               |
|  LEFT (Customers: 3 rows)               RIGHT (Orders: 4 rows)                |
|  [ id: 101, name: Alice ]  -----+      [ order: 1, id: 101, amount: $50  ]    |
|  [ id: 102, name: Bob   ]  ----+|      [ order: 2, id: 101, amount: $80  ]    |
|  [ id: 103, name: Clara ]      ||      [ order: 3, id: 102, amount: $120 ]    |
|                                ||      [ order: 4, id: 999, amount: $40  ]    |
|                                v|                     |                       |
|                   [ Hash Table: Key -> Row Indices ]  |                       |
|                   101 -> [Row 0]                      |                       |
|                   102 -> [Row 1] <--------------------+                       |
|                   103 -> [Row 2]                                              |
|                                                                               |
|  INNER JOIN RESULT: Matches only (101, 102)                                  |
|  [ order: 1, id: 101, name: Alice, amount: $50  ]                             |
|  [ order: 2, id: 101, name: Alice, amount: $80  ]                             |
|  [ order: 3, id: 102, name: Bob,   amount: $120 ]                             |
+-------------------------------------------------------------------------------+`
    },
    chapters: [
      {
        id: 'ch1-concat-vs-merge',
        title: 'Stacking (pd.concat) vs Joining (pd.merge)',
        icon: 'Layers',
        summary: 'Understand the fundamental mental model difference between stacking sheets of paper and linking records by ID.',
        markdownContent: `### The Two Core Mental Models
1. **\`pd.concat\` = Physical Stacking**
   Imagine having four printed quarterly sales reports sitting on your desk. You put Q1 on top, Q2 below it, Q3 below that, and staple them together. That is \`pd.concat([q1, q2, q3], axis=0, ignore_index=True)\`.
   - Use when tables share the **same columns** and you want to append new rows.
   - Always remember **\`ignore_index=True\`** so row indices don't reset to 0 for every sub-table!

2. **\`pd.merge\` = Relational Linking (VLOOKUP / SQL JOIN)**
   Imagine you have a receipts slip that says \`customer_id: 101\`. You look over at your customer directory card to look up who customer 101 is ("Alice from New York"). That is \`pd.merge(orders, customers, on='customer_id')\`.
   - Use when tables have **different columns** and you want to connect them using a shared identifier (the "foreign key").`,
        codeSnippets: [
          {
            id: 'snip-concat-example',
            title: 'Stacking quarterly sales logs with pd.concat',
            code: `import pandas as pd

q1 = pd.DataFrame({'store': ['A', 'B'], 'rev': [100, 150]})
q2 = pd.DataFrame({'store': ['A', 'B'], 'rev': [110, 170]})

# Stack rows vertically with a fresh continuous index
annual = pd.concat([q1, q2], ignore_index=True)
print(annual)`,
            expectedOutput: `  store  rev
0     A  100
1     B  150
2     A  110
3     B  170`,
            explanation: 'pd.concat(..., axis=0, ignore_index=True) creates a single unified table.'
          }
        ]
      },
      {
        id: 'ch2-join-types',
        title: 'Mastering Join Types: Inner, Left, Right, and Outer',
        icon: 'GitFork',
        summary: 'Choosing the right join type to avoid dropping important records or misrepresenting zeros.',
        markdownContent: `### Which Rows Survive the Merge?
- **\`how='inner'\` (Intersection):** Keeps only keys that exist in **both** tables. Unregistered guest orders are dropped; customers who have not made an order are dropped.
- **\`how='left'\` (Left Preservation):** Keeps **every single row** from the left table. If no match exists on the right, Pandas fills missing fields with \`NaN\`. Perfect for calculating metrics over all registered customers.
- **\`how='outer'\` (Union):** Keeps all rows from both tables. Unmatched keys on either side are retained with \`NaN\` fillers. Ideal for reconciliation audits.

\`\`\`python
# Left join ensures customers with 0 orders stay in the dataset:
customer_activity = pd.merge(customers, orders, on='customer_id', how='left')
# Fill missing amounts with 0.0
customer_activity['amount'] = customer_activity['amount'].fillna(0.0)
\`\`\``,
        codeSnippets: [
          {
            id: 'snip-left-join',
            title: 'Preserving inactive users with a left join',
            code: `import pandas as pd

users = pd.DataFrame({'id': [1, 2, 3], 'name': ['Alice', 'Bob', 'Charlie']})
purchases = pd.DataFrame({'id': [1, 1], 'item': ['Book', 'Pen']})

merged = pd.merge(users, purchases, on='id', how='left')
print(merged)`,
            expectedOutput: `   id     name  item
0   1    Alice  Book
1   1    Alice   Pen
2   2      Bob   NaN
3   3  Charlie   NaN`,
            explanation: 'Bob and Charlie remain in the output with NaN for purchased items.'
          }
        ]
      }
    ],
    commonTraps: [
      {
        title: 'Forgetting ignore_index=True on pd.concat',
        badSnippet: `combined = pd.concat([df1, df2])\n# index has duplicate 0, 1, 0, 1`,
        badExplanation: 'Preserving old indices causes duplicate label lookups and subtle bugs in downstream indexing.',
        goodSnippet: `combined = pd.concat([df1, df2], ignore_index=True)`,
        goodExplanation: 'Re-indexes the concatenated table cleanly from 0 to N-1.',
        perfImpact: 'Eliminates hash collisions and unexpected MultiIndex behaviors.'
      },
      {
        title: 'Accidentally using inner join instead of left join',
        badSnippet: `summary = pd.merge(all_users, orders, on='user_id') # drops users with 0 orders`,
        badExplanation: 'Silently ignores inactive customers, causing conversion rates and churn metrics to be artificially inflated.',
        goodSnippet: `summary = pd.merge(all_users, orders, on='user_id', how='left')\nsummary['amount'] = summary['amount'].fillna(0.0)`,
        goodExplanation: 'Keeps all customers and properly models zero-spend behavior.',
        perfImpact: 'Ensures business metrics accurately represent the entire user base.'
      }
    ],
    apiCheatSheet: [
      {
        name: 'pd.concat',
        category: 'Combining',
        signature: 'pd.concat(objs, axis=0, ignore_index=False, join="outer")',
        summary: 'Concatenate pandas objects along a particular axis (rows=0, columns=1).',
        parameters: [
          { name: 'objs', type: 'list[DataFrame | Series]', desc: 'Sequence of objects to concatenate.' },
          { name: 'axis', type: '0 | 1', desc: '0 for rows, 1 for columns.' },
          { name: 'ignore_index', type: 'bool', desc: 'If True, allocate 0..N-1 sequential index.' }
        ],
        returns: 'Concatenated DataFrame or Series.',
        exampleSnippet: `df_all = pd.concat([q1, q2], ignore_index=True)`
      },
      {
        name: 'pd.merge',
        category: 'Relational',
        signature: 'pd.merge(left, right, how="inner", on=None, left_on=None, right_on=None, suffixes=("_x", "_y"))',
        summary: 'Database-style join of two DataFrames using key column(s) or indices.',
        parameters: [
          { name: 'left', type: 'DataFrame', desc: 'Left table.' },
          { name: 'right', type: 'DataFrame', desc: 'Right table.' },
          { name: 'how', type: '"inner"|"left"|"right"|"outer"', desc: 'Join type.' },
          { name: 'on', type: 'str | list[str]', desc: 'Key column(s) present in both tables.' },
          { name: 'suffixes', type: 'tuple[str, str]', desc: 'Suffixes for conflicting column names.' }
        ],
        returns: 'Merged DataFrame.',
        exampleSnippet: `joined = pd.merge(orders, customers, on="cust_id", how="left")`
      }
    ],
    interactiveWidgetType: 'pandas-blockmanager'
  },
  challenges: [
    {
      id: 'pandas-p5-c1',
      dayId: 5,
      partId: 5,
      title: 'Customer Order Joiner',
      slug: 'customer-order-joiner',
      difficulty: 'Beginner',
      category: 'Merging & Joining',
      summary: 'Join transactional order records with customer profile metadata using inner and left joins, computing per-customer order totals.',
      mentalModel5s: 'Inner join is what both tables share; left join keeps everyone from the left table and fills missing values with NaN. Fill with 0.0 for zero spenders!',
      visualAnalogy: 'Think of customers as students with ID badges and orders as library book checkouts. An inner join lists only students currently holding books; a left join lists the entire school roster, noting zero checkouts for those without books.',
      pitfalls: [
        'Using an inner join when you need to track customers who have zero purchases.',
        'Forgetting to fillna(0.0) on numerical columns after a left join.',
        'Using .count() vs .sum()—count counts non-null rows (order count), while sum totals numerical values (dollar spend).'
      ],
      progressiveHints: [
        'Tier 1 (Inner join): Use pd.merge(orders, customers, on="customer_id", how="inner").',
        'Tier 2 (Left join): Use pd.merge(customers, orders, on="customer_id", how="left") and fillna on amount.',
        'Tier 3 (Aggregation): Use .groupby(["customer_id", "name"], as_index=False).agg(total_spend=("amount", "sum"), order_count=("order_id", "count")).',
        'Tier 4 (Completed spend): Mask amount where status == "completed" before grouping.'
      ],
      deepInternals: {
        title: 'Hash Joins in Pandas',
        content: 'Pandas executes joins by constructing a hash table over the smaller table\'s join keys, achieving O(N + M) average time complexity. Left joins preserve the memory order of the left DataFrame.',
        keyRule: 'Always perform left joins when calculating retention or customer lifetime value to avoid dropping inactive users.'
      },
      instructions: `In e-commerce analytics, transaction logs and customer profiles live in separate tables. Your task is to link these tables and generate spending summaries.

Write a function \`join_customer_orders(customers: pd.DataFrame, orders: pd.DataFrame) -> dict\` that:
1. **\`inner_merged\`**: Performs an inner join between \`orders\` and \`customers\` matching on the customer identifier (\`'customer_id'\`). Only orders linked to registered customers should be included.
2. **\`customer_orders_all\`**: Performs a left join starting with \`customers\` on the left and \`orders\` on the right matching on the customer identifier (\`'customer_id'\`), ensuring every customer is kept. Imputes missing values in the \`'amount'\` column with \`0.0\`.
3. **\`customer_summary\`**: Aggregates \`customer_orders_all\` grouped by customer identifier and name (\`['customer_id', 'name']\`) to compute:
   - \`'total_spend'\`: sum of \`'amount'\` (float, rounded to 2 decimal places).
   - \`'order_count'\`: count of valid \`'order_id'\` entries (customers with no orders must have count \`0\`).
   - \`'completed_spend'\`: sum of \`'amount'\` where \`'status' == 'completed'\` (if none, \`0.0\`).
   Resets the index so \`customer_id\` and \`name\` are columns, and sorts ascending by \`'customer_id'\`.
4. Returns a dictionary:
   \`{"inner_merged": inner_merged, "customer_orders_all": customer_orders_all, "customer_summary": customer_summary}\``,
      hints: [
        'Use pd.merge(orders, customers, on="customer_id", how="inner") for inner join.',
        'Use pd.merge(customers, orders, on="customer_id", how="left") and customer_orders_all["amount"].fillna(0.0).',
        'Use .where(status == "completed", 0.0) to compute completed spend per row before grouping.'
      ],
      starterCode: `import pandas as pd
import numpy as np

def join_customer_orders(customers: pd.DataFrame, orders: pd.DataFrame) -> dict:
    """
    Join customer metadata with orders and compute per-customer spending summaries.

    Args:
        customers: DataFrame with ['customer_id', 'name', 'city', 'signup_date']
        orders: DataFrame with ['order_id', 'customer_id', 'order_date', 'amount', 'status']

    Returns:
        dict with 'inner_merged', 'customer_orders_all', and 'customer_summary'
    """
    # TODO: Perform inner join, left join with missing value handling, and customer summary aggregation
    pass
`,
      solutionCode: `import pandas as pd
import numpy as np

def join_customer_orders(customers: pd.DataFrame, orders: pd.DataFrame) -> dict:
    # 1. Inner join
    inner_merged = pd.merge(orders, customers, on="customer_id", how="inner")

    # 2. Left join
    customer_orders_all = pd.merge(customers, orders, on="customer_id", how="left")
    customer_orders_all["amount"] = customer_orders_all["amount"].fillna(0.0)

    # 3. Customer summary aggregation
    calc_df = customer_orders_all.copy()
    calc_df["completed_amount"] = calc_df["amount"].where(calc_df["status"] == "completed", 0.0)

    customer_summary = calc_df.groupby(["customer_id", "name"], as_index=False).agg(
        total_spend=("amount", "sum"),
        order_count=("order_id", "count"),
        completed_spend=("completed_amount", "sum")
    )
    customer_summary["total_spend"] = customer_summary["total_spend"].round(2)
    customer_summary["completed_spend"] = customer_summary["completed_spend"].round(2)
    customer_summary = customer_summary.sort_values("customer_id").reset_index(drop=True)

    return {
        "inner_merged": inner_merged,
        "customer_orders_all": customer_orders_all,
        "customer_summary": customer_summary,
    }
`,
      testCases: [
        {
          id: 't1',
          name: 'Standard Customer Orders',
          inputDescription: '4 customers, 5 orders (including guest order and customer with 0 orders)',
          expectedOutput: 'inner_merged has 4 rows, customer_orders_all has 5 rows, customer_summary has 4 rows with Diana at 0 spend'
        },
        {
          id: 't2',
          name: 'All Customers Active',
          inputDescription: 'All registered customers have placed at least one completed order',
          expectedOutput: 'order_count > 0 for all customers, completed_spend matches total_spend'
        }
      ],
      benchmarkTargetMs: 5.0,
      memoryTargetMb: 2.0,
      conceptPrimer: {
        title: 'Relational Joins & Missing Data',
        subtitle: 'From separate tables to actionable business insights',
        overview: 'Merging combines tables by matching keys. An inner join keeps matches; a left join keeps all left records and pads missing values with NaN.',
        mentalModel5s: 'Inner join = intersection; Left join = preserve left table completely.',
        visualAnalogy: 'Matching student IDs on exam papers with student registration cards.',
        pitfalls: [
          'Using inner join when inactive customers need to be retained.',
          'Not replacing NaNs with 0.0 in financial totals.'
        ],
        progressiveHints: [
          'Step 1: Perform pd.merge(orders, customers, on="customer_id", how="inner").',
          'Step 2: Perform pd.merge(customers, orders, on="customer_id", how="left").',
          'Step 3: Fillna on amount.',
          'Step 4: Groupby customer_id and name with .agg().'
        ],
        mathFormulas: [
          {
            title: 'Customer Total Spend',
            latex: '\\text{Spend}_i = \\sum_{j \\in \\text{Orders}_i} \\text{Amount}_j',
            explanation: 'Sum of all transaction amounts belonging to customer i.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Slow manual loop join
result = []
for _, cust in customers.iterrows():
    cust_orders = orders[orders['customer_id'] == cust['customer_id']]
    total = cust_orders['amount'].sum()
    result.append({'id': cust['customer_id'], 'total': total})`,
          naiveExplanation: 'Iterating with iterrows() runs in slow Python bytecode and takes O(N*M) time.',
          idiomaticCode: `# Fast vectorized C-hash join & groupby
merged = pd.merge(customers, orders, on='customer_id', how='left')
summary = merged.groupby('customer_id')['amount'].sum()`,
          idiomaticExplanation: 'Runs compiled C hash joins in O(N + M) time with zero per-row Python overhead.',
          speedupText: '60x faster'
        },
        memoryLayout: {
          title: 'C-Contiguous Join Buffer',
          content: 'The merge engine matches indices via a C hash table and copies matching blocks into a consolidated memory layout.',
          keyRule: 'Left joins preserve the index order and row cardinality of the primary table.'
        },
        keyTakeaways: [
          'pd.merge defaults to how="inner".',
          'Use how="left" when preserving all entities from the primary table is required.',
          'Always handle NaNs generated by unmatched keys using .fillna().'
        ]
      }
    },
    {
      id: 'pandas-p5-c2',
      dayId: 5,
      partId: 5,
      title: 'Multi-Source Data Combiner',
      slug: 'multi-source-data-combiner',
      difficulty: 'Intermediate',
      category: 'Merging & Joining',
      summary: 'Concatenate quarterly sales tables vertically and enrich them with store location metadata via relational joins.',
      mentalModel5s: 'Stack quarterly tables vertically with pd.concat(..., ignore_index=True), then attach location metadata using a left join on store_id.',
      visualAnalogy: 'Stacking 4 quarterly accounting binders into one annual binder, then stamping each store with its regional headquarters address.',
      pitfalls: [
        'Forgetting ignore_index=True, causing duplicated row indices in the combined sales table.',
        'Confusing total store count with unique store count (use nunique() for unique stores).',
        'Not sorting the regional summary by total_revenue descending.'
      ],
      progressiveHints: [
        'Tier 1 (Concatenation): Use pd.concat(quarterly_dfs, ignore_index=True) to stack all quarterly DataFrames.',
        'Tier 2 (Metadata Join): Merge annual_sales with store_locations on "store_id" using how="left".',
        'Tier 3 (Aggregations): Group by "region" and aggregate revenue sum, units sum, revenue mean, and store_id nunique.',
        'Tier 4 (Sorting): Sort by total_revenue descending and reset index.'
      ],
      deepInternals: {
        title: 'BlockManager Consolidation during Concat',
        content: 'When pd.concat stacks multiple DataFrames, it checks column dtypes across all inputs. If columns share dtypes, they are combined into single 2D C-arrays without unnecessary type casting.',
        keyRule: 'Passing ignore_index=True creates a contiguous 0..N RangeIndex, saving memory and preventing duplicate index lookups.'
      },
      instructions: `Retail enterprises track sales across separate quarterly sheets. Your task is to combine these sheets into an annual master table, attach store location metadata, and generate regional performance reports.

Write a function \`combine_retail_data(quarterly_dfs: list, store_locations: pd.DataFrame) -> dict\` that:
1. **\`annual_sales\`**: Vertically stacks and concatenates the list of quarterly DataFrames (\`quarterly_dfs\`) into a unified table with a fresh, sequential row index.
2. **\`enriched_sales\`**: Performs a left join between \`annual_sales\` and \`store_locations\` matching on the store identifier (\`'store_id'\`) to attach \`'city'\`, \`'region'\`, and \`'manager'\`.
3. **\`region_summary\`**: Groups \`enriched_sales\` by \`'region'\` and calculates:
   - \`'total_revenue'\`: sum of \`'revenue'\` (float, rounded to 2 decimal places).
   - \`'total_units'\`: sum of \`'units_sold'\` (int).
   - \`'avg_quarterly_revenue'\`: mean of \`'revenue'\` (float, rounded to 2 decimal places).
   - \`'store_count'\`: number of distinct stores in the region (int).
   Resets the row index, and sorts descending by \`'total_revenue'\`.
4. Returns a dictionary:
   \`{"annual_sales": annual_sales, "enriched_sales": enriched_sales, "region_summary": region_summary}\``,
      hints: [
        'Use pd.concat(quarterly_dfs, ignore_index=True) to stack tables.',
        'Use pd.merge(annual_sales, store_locations, on="store_id", how="left").',
        'In groupby.agg, use store_count=("store_id", "nunique").',
        'Sort with .sort_values("total_revenue", ascending=False).reset_index(drop=True).'
      ],
      starterCode: `import pandas as pd
import numpy as np

def combine_retail_data(quarterly_dfs: list, store_locations: pd.DataFrame) -> dict:
    """
    Concatenate quarterly sales records, enrich with location metadata, and summarize by region.

    Args:
        quarterly_dfs: List of DataFrames, each with ['store_id', 'quarter', 'revenue', 'units_sold']
        store_locations: DataFrame with ['store_id', 'city', 'region', 'manager']

    Returns:
        dict with 'annual_sales', 'enriched_sales', and 'region_summary'
    """
    # TODO: Concatenate quarterly DataFrames, merge store locations, and produce regional summary
    pass
`,
      solutionCode: `import pandas as pd
import numpy as np

def combine_retail_data(quarterly_dfs: list, store_locations: pd.DataFrame) -> dict:
    # 1. Concatenate quarterly DataFrames vertically
    annual_sales = pd.concat(quarterly_dfs, ignore_index=True)

    # 2. Enrich with store location metadata via left join
    enriched_sales = pd.merge(annual_sales, store_locations, on="store_id", how="left")

    # 3. Regional summary aggregation
    region_summary = enriched_sales.groupby("region", as_index=False).agg(
        total_revenue=("revenue", "sum"),
        total_units=("units_sold", "sum"),
        avg_quarterly_revenue=("revenue", "mean"),
        store_count=("store_id", "nunique")
    )
    region_summary["total_revenue"] = region_summary["total_revenue"].round(2)
    region_summary["avg_quarterly_revenue"] = region_summary["avg_quarterly_revenue"].round(2)
    region_summary = region_summary.sort_values("total_revenue", ascending=False).reset_index(drop=True)

    return {
        "annual_sales": annual_sales,
        "enriched_sales": enriched_sales,
        "region_summary": region_summary,
    }
`,
      testCases: [
        {
          id: 't1',
          name: 'Multi-Quarter Multi-Region Stores',
          inputDescription: '3 quarterly tables, 4 retail stores across West and South regions',
          expectedOutput: 'annual_sales has 9 rows, region_summary has West first with highest revenue'
        },
        {
          id: 't2',
          name: 'Clean RangeIndex Verification',
          inputDescription: 'Quarterly inputs have non-zero or duplicated indices',
          expectedOutput: 'annual_sales has clean 0..N-1 index with ignore_index=True'
        }
      ],
      benchmarkTargetMs: 5.0,
      memoryTargetMb: 2.0,
      conceptPrimer: {
        title: 'Vertical Stacking & Relational Enrichment',
        subtitle: 'From quarterly reports to regional executive scorecards',
        overview: 'Stack homogeneous data shards with pd.concat(..., ignore_index=True), then enrich with location dimensions using pd.merge.',
        mentalModel5s: 'Stack sheets with pd.concat; enrich rows with pd.merge.',
        visualAnalogy: 'Putting together all monthly receipts into one folder, then looking up store cities from the corporate registry.',
        pitfalls: [
          'Duplicate index issues when forgetting ignore_index=True.',
          'Using count instead of nunique for store count.'
        ],
        progressiveHints: [
          'Step 1: pd.concat(quarterly_dfs, ignore_index=True).',
          'Step 2: pd.merge(annual_sales, store_locations, on="store_id", how="left").',
          'Step 3: .groupby("region", as_index=False).agg(...).',
          'Step 4: Sort descending by total_revenue.'
        ],
        mathFormulas: [
          {
            title: 'Average Quarterly Revenue',
            latex: '\\bar{R}_{\\text{region}} = \\frac{1}{K} \\sum_{k=1}^K R_k',
            explanation: 'Mean revenue across all quarterly records belonging to a region.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Appending rows one by one in a loop
master = pd.DataFrame()
for q in quarterly_dfs:
    master = master.append(q)  # Extremely slow! O(N^2)`,
          naiveExplanation: 'Iterative appending reallocates the entire table on every iteration, leading to quadratic memory churn.',
          idiomaticCode: `# High performance single-pass concatenation
annual = pd.concat(quarterly_dfs, ignore_index=True)`,
          idiomaticExplanation: 'Allocates the final memory buffer once and copies all blocks in a single C-level sweep.',
          speedupText: '40x faster'
        },
        memoryLayout: {
          title: 'Contiguous Block Stacking',
          content: 'pd.concat inspects all input chunks, determines the total row count, pre-allocates contiguous memory arrays, and copies data linearly.',
          keyRule: 'Never append to a DataFrame inside a loop; collect tables into a list and call pd.concat once.'
        },
        keyTakeaways: [
          'Use pd.concat([df1, df2, ...], ignore_index=True) for vertical stacking.',
          'Use nunique() when counting distinct entities in aggregations.',
          'Always sort KPI summary tables by the primary financial metric.'
        ]
      }
    }
  ]
};

export const PANDAS_PART05_TRACK = DAY05_TRACK;
export const testCases = [...DAY05_TRACK.challenges[0].testCases, ...DAY05_TRACK.challenges[1].testCases];
export default DAY05_TRACK;
