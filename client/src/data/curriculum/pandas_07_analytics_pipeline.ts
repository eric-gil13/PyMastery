import type { DayTrack, Challenge, ConceptPrimerData, TestCase } from '../../types';

export type { DayTrack, Challenge, ConceptPrimerData, TestCase };

export const DAY07_TRACK: DayTrack = {
  partNumber: 7,
  partId: 7,
  dayNumber: 7,
  id: 7,
  title: 'Part 7: End-to-End Practical Analytics Pipeline',
  subtitle: 'Master method chaining, the .pipe() architecture, multi-table unit economics, and executive KPI capstone pipelines',
  description: 'Bring every Pandas skill together into robust, production-grade analytics pipelines. Move from brittle procedural scripts to clean, composable data flows using .pipe(). Clean messy inputs defensively, engineer unit economics and financial metrics, segment customers with the industry-standard RFM framework, and deliver executive KPI reports.',
  iconName: 'Workflow',
  badge: 'Part 7 • Pandas Pipeline Capstone',
  libraryMechanics: {
    libraryName: 'Pandas Production Pipeline Engineering',
    tagline: 'Architect robust, testable, and composable data pipelines from raw ingestion to executive KPIs.',
    overview: `### 🌟 Welcome to the Grand Capstone: Building Production Pipelines
Congratulations on reaching Part 7! You have mastered:
1. Series & DataFrame creation, shapes, and indexing
2. Vectorized arithmetic, filtering, and conditional masking
3. Aggregations, groupbys, and multi-dimensional transforms
4. Concatenation and relational database joins
5. DateTime parsing, rolling moving averages, and resampling

Now, you will take the leap from writing isolated one-off commands to engineering **production analytics pipelines**.

In the software industry, data is rarely clean:
- Webhooks drop random null fields.
- Quantities contain accidental zeros or negatives.
- Customers arrive without addresses or acquisition tags.
- Disconnected tables must be unified to compute true unit economics (margins, churn, customer lifetime value).

You will learn how to structure your code using **method chaining** and **\`df.pipe()\`**, crafting modular, maintainable pipelines that turn chaotic raw databases into polished executive scorecards.`,
    whyItExists: `Beginners often write monolithic scripts with dozens of temporary variables (\`df1\`, \`df2\`, \`df3\`).
This procedural style has severe disadvantages:
- **Memory Waste:** Retaining intermediate DataFrames prevents Python's garbage collector from freeing memory.
- **Brittle Mutation:** Modifying columns in place triggers unpredictable \`SettingWithCopyWarning\` hazards.
- **Hard to Test:** If an error occurs on line 75 of a 200-line script, isolating which step broke is painful.

The \`.pipe()\` pattern solves this by treating DataFrames as immutable data streams passed through pure, single-purpose transformation functions.`,
    coreAnatomy: {
      objectName: 'Pipeline Flow & .pipe() Architecture',
      description: 'A callable pipeline passes a DataFrame sequentially through dedicated transformation stages: Ingest -> Clean & Filter -> Relational Merge -> Feature Engineering -> Aggregate & Rollup.',
      fields: [
        {
          name: 'pipe',
          type: 'df.pipe(func, *args, **kwargs)',
          role: 'Applies a callable func(df) to the DataFrame and returns the result, enabling fluent chaining.'
        },
        {
          name: 'assign',
          type: 'df.assign(**kwargs)',
          role: 'Creates new columns or overwrites existing ones in a vectorized, chain-safe manner without mutating in place.'
        },
        {
          name: 'dropna / fillna',
          type: 'df.dropna(subset=[...]) / df.fillna(...)',
          role: 'Sanitizes missing values defensively at pipeline boundaries.'
        },
        {
          name: 'groupby.agg',
          type: 'df.groupby(...).agg(...)',
          role: 'Reduces granular transaction events into executive KPI dimensions (categories, segments, cohorts).'
        }
      ],
      memoryDiagramAscii: `+-------------------------------------------------------------------------------+
|                    End-to-End Pipeline Execution Flow                         |
|                                                                               |
|  [ Raw Multi-Table Data ]                                                     |
|  - transactions.csv (missing keys, dirty rows, discounts)                     |
|  - products.csv (catalog costs, unit prices)                                  |
|  - users.csv (demographics, marketing channels)                               |
|                         |                                                     |
|                         v   Stage 1: Defensive Cleaning & Type Coercion       |
|  [ Cleaned Transactions ]  - dropna on primary keys, filter qty >= 1          |
|                         |  - pd.to_datetime timestamps                        |
|                         v   Stage 2: Relational Merging                       |
|  [ Enriched Master ]       - Left join products on product_id                 |
|                         |  - Left join users on user_id                       |
|                         v   Stage 3: Feature Engineering & Unit Economics    |
|  [ Feature Engineered ]    - Gross & Net Revenue, COGS, Gross Profit, Margins |
|                         |                                                     |
|       +-----------------+-----------------+                                   |
|       |                                   |                                   |
|       v                                   v                                   |
|  Stage 4: Time Series Trend         Stage 5: Category & Executive KPIs        |
|  - Resample('D') daily totals       - Groupby category                        |
|  - Rolling 7-day moving avg         - Overall profit margins & customer counts|
+-------------------------------------------------------------------------------+`
    },
    chapters: [
      {
        id: 'ch1-pipe-architecture',
        title: 'The .pipe() Architecture & Method Chaining',
        icon: 'Workflow',
        summary: 'Write clean, readable, functional transformation chains instead of messy spaghetti scripts.',
        markdownContent: `### Why Use .pipe()?
When you have multiple processing functions:
\`\`\`python
# Messy nested syntax:
result = report(summarize(clean(raw_df)))

# Messy variable sprawl:
df1 = clean(raw_df)
df2 = summarize(df1)
result = report(df2)
\`\`\`

With **\`.pipe()\`**, your code reads like an English recipe from top to bottom:
\`\`\`python
result = (
    raw_df
    .pipe(clean)
    .pipe(summarize)
    .pipe(report)
)
\`\`\``,
        codeSnippets: [
          {
            id: 'snip-pipe-demo',
            title: 'Chaining transformation steps with .pipe()',
            code: `import pandas as pd

def clean_data(df):
    return df.dropna().copy()

def add_total(df):
    df['total'] = df['qty'] * df['price']
    return df

raw = pd.DataFrame({'qty': [2, None, 4], 'price': [10.0, 15.0, 20.0]})
pipeline_result = raw.pipe(clean_data).pipe(add_total)
print(pipeline_result)`,
            expectedOutput: `   qty  price  total
0  2.0   10.0   20.0
2  4.0   20.0   80.0`,
            explanation: 'pipe passes the output of each function directly into the first argument of the next.'
          }
        ]
      },
      {
        id: 'ch2-rfm-analytics',
        title: 'Customer Lifetime & RFM Segmentation',
        icon: 'UserCheck',
        summary: 'Deconstruct customer behavior using Recency, Frequency, and Monetary value.',
        markdownContent: `### The RFM Framework in Practice
- **Recency (R):** How many days since the customer last bought? (\`snapshot_date - max(order_date)\`).
- **Frequency (F):** How many total orders did they place? (\`count(order_id)\`).
- **Monetary (M):** How much total revenue have they generated? (\`sum(amount)\`).

Segmentation Rules:
- **At-Risk / Churned:** Recency > 90 days (they haven't bought in 3 months!).
- **VIP:** Not churned, and Frequency >= 3 orders (repeat loyal buyers).
- **Regular:** Active users who have placed 1 or 2 orders.`,
        codeSnippets: [
          {
            id: 'snip-rfm-calc',
            title: 'Computing Recency Days in Pandas',
            code: `import pandas as pd

dates = pd.to_datetime(['2024-01-15', '2024-06-10'])
snapshot = pd.to_datetime('2024-07-01')

recency_days = (snapshot - dates).dt.days
print("Days since last order:", recency_days.tolist())`,
            expectedOutput: `Days since last order: [168, 21]`,
            explanation: '(snapshot - date).dt.days calculates integer day differences cleanly.'
          }
        ]
      }
    ],
    commonTraps: [
      {
        title: 'Modifying slices without .copy()',
        badSnippet: `clean = df[df['qty'] > 0]\nclean['discount'] = 0.0 # SettingWithCopyWarning!`,
        badExplanation: 'Modifying a filtered slice can trigger SettingWithCopyWarning because Pandas cannot guarantee if it is a view or copy.',
        goodSnippet: `clean = df[df['qty'] > 0].copy()\nclean['discount'] = 0.0`,
        goodExplanation: 'Calling .copy() explicitly decouples memory buffers, ensuring safe column assignment.',
        perfImpact: 'Eliminates subtle state corruption and annoying warnings.'
      },
      {
        title: 'Division by zero in margin calculations',
        badSnippet: `margin = profit / net_revenue # Fails with Inf when revenue is 0!`,
        badExplanation: 'Free trials or zero-revenue promotional orders produce division-by-zero Infinities.',
        goodSnippet: `margin = np.where(net_revenue > 0, profit / net_revenue, 0.0)`,
        goodExplanation: 'Guarantees valid numeric margins even when net revenue is zero.',
        perfImpact: 'Keeps executive KPI dashboards robust and error-free.'
      }
    ],
    apiCheatSheet: [
      {
        name: 'df.pipe',
        category: 'Chaining',
        signature: 'df.pipe(func, *args, **kwargs)',
        summary: 'Apply chainable functions to a DataFrame.',
        parameters: [
          { name: 'func', type: 'callable', desc: 'Function taking df as first argument.' }
        ],
        returns: 'Return value of func(df, *args, **kwargs).',
        exampleSnippet: `df_out = df.pipe(clean_step).pipe(engineer_step)`
      },
      {
        name: 'np.where',
        category: 'Vector Logic',
        signature: 'np.where(condition, x, y)',
        summary: 'Return elements chosen from x or y depending on condition.',
        parameters: [
          { name: 'condition', type: 'Series[bool]', desc: 'Boolean condition array.' },
          { name: 'x', type: 'scalar | Series', desc: 'Value when True.' },
          { name: 'y', type: 'scalar | Series', desc: 'Value when False.' }
        ],
        returns: 'Vectorized chosen array.',
        exampleSnippet: `df['segment'] = np.where(df['recency'] > 90, 'At-Risk', 'Active')`
      }
    ],
    interactiveWidgetType: 'production-pipeline'
  },
  challenges: [
    {
      id: 'pandas-p7-c1',
      dayId: 7,
      partId: 7,
      title: 'E-Commerce Churn & Retention Analytics',
      slug: 'ecommerce-churn-retention',
      difficulty: 'Intermediate',
      category: 'Analytics Pipeline',
      summary: 'Build an end-to-end RFM customer segmentation and retention pipeline to identify churned users and compute executive KPIs.',
      mentalModel5s: 'Clean orders, group by customer to compute Recency, Frequency, and Monetary metrics, segment into At-Risk/VIP/Regular, and rollup C-suite summary KPIs.',
      visualAnalogy: 'Sorting customer files into three colored folders (Red for At-Risk, Gold for VIP, Blue for Regular), then writing a one-page executive memo for the CEO.',
      pitfalls: [
        'Not filtering out cancelled orders before computing customer frequency and spend.',
        'Calculating recency using string dates instead of datetime differences (.dt.days).',
        'Not handling division by zero if total revenue across all customers is zero.'
      ],
      progressiveHints: [
        'Tier 1 (Clean): Drop null customer_id and order_amount, filter status != "cancelled" and amount > 0.',
        'Tier 2 (RFM): Groupby customer_id and compute last_order (max), frequency (count), and monetary_total (sum).',
        'Tier 3 (Recency & Segments): Compute recency_days = (snapshot - last_order).dt.days, then assign segment.',
        'Tier 4 (Executive Metrics): Compute total_customers, churn_rate, vip_revenue_share, and overall_avg_order_value.'
      ],
      deepInternals: {
        title: 'Vectorized Date Deltas',
        content: 'Subtracting a Timestamp from a DatetimeSeries yields a TimedeltaSeries backed by 64-bit nanosecond durations. Accessing .dt.days divides by 86,400,000,000,000 in compiled C without Python loop overhead.',
        keyRule: 'Clean dirty records at the very first step of your pipeline to prevent NaNs from propagating into group aggregations.'
      },
      instructions: `E-commerce companies rely on customer retention analytics to prioritize marketing campaigns and prevent churn.

Write a function \`build_rfm_pipeline(orders_df: pd.DataFrame, snapshot_date: str = '2024-07-01', churn_threshold_days: int = 90) -> dict\` that:
1. **Clean & Filter**:
   - Drop rows where \`'customer_id'\` or \`'order_amount'\` is missing/null.
   - Filter to keep only positive orders where \`'status' != 'cancelled'\` and \`'order_amount' > 0\`.
   - Parse \`'order_date'\` into datetime timestamps.
2. **RFM Aggregation**:
   Group the cleaned orders by \`'customer_id'\` and compute:
   - \`'last_order'\`: maximum \`'order_date'\`
   - \`'frequency'\`: count of valid \`'order_id'\` (int)
   - \`'monetary_total'\`: sum of \`'order_amount'\` (float, rounded to 2 decimal places)
   - \`'avg_order_value'\`: mean of \`'order_amount'\` (float, rounded to 2 decimal places)
3. **Recency & Segmentation**:
   - \`'recency_days'\`: integer elapsed days between the snapshot reference date and the customer's \`'last_order'\`.
   - \`'is_churned'\`: boolean flag \`True\` if \`recency_days > churn_threshold_days\`, else \`False\`.
   - \`'segment'\`: Categorize each user as:
     * \`'At-Risk'\` if \`is_churned\` is \`True\`
     * \`'VIP'\` if \`is_churned\` is \`False\` and \`frequency >= 3\`
     * \`'Regular'\` otherwise
   Sort \`rfm_table\` ascending by \`'customer_id'\` and reset the row index.
4. **Executive Summary Metrics** (dict):
   - \`'total_customers'\`: Total number of unique customers (int).
   - \`'churn_rate'\`: Fraction of customers with \`is_churned == True\` (float rounded to 4 decimal places).
   - \`'vip_revenue_share'\`: Sum of \`monetary_total\` for VIP customers divided by total \`monetary_total\` (float rounded to 4 decimals, or 0.0 if total is 0).
   - \`'overall_avg_order_value'\`: Mean of \`'avg_order_value'\` across all customers (float rounded to 2 decimal places).
5. Returns a dictionary:
   \`{"cleaned_orders": cleaned_orders, "rfm_table": rfm_table, "summary_metrics": summary_metrics}\``,
      hints: [
        'Filter out null customer_id and cancelled orders first using .dropna() and boolean indexing.',
        'Use .groupby("customer_id", as_index=False).agg(...) with max, count, sum, and mean.',
        'Calculate recency_days using (pd.to_datetime(snapshot_date) - rfm["last_order"]).dt.days.',
        'Apply segment logic: if is_churned -> "At-Risk", elif frequency >= 3 -> "VIP", else "Regular".'
      ],
      starterCode: `import pandas as pd
import numpy as np

def build_rfm_pipeline(orders_df: pd.DataFrame, snapshot_date: str = '2024-07-01', churn_threshold_days: int = 90) -> dict:
    """
    Build an end-to-end RFM customer segmentation and churn analytics pipeline.

    Args:
        orders_df: DataFrame with ['order_id', 'customer_id', 'order_date', 'order_amount', 'status']
        snapshot_date: Analysis reference date string (default '2024-07-01')
        churn_threshold_days: Inactivity day threshold for churn (default 90)

    Returns:
        dict with 'cleaned_orders', 'rfm_table', and 'summary_metrics'
    """
    # TODO: Clean orders, aggregate RFM, compute segmentation, and calculate summary metrics
    pass
`,
      solutionCode: `import pandas as pd
import numpy as np

def build_rfm_pipeline(orders_df: pd.DataFrame, snapshot_date: str = '2024-07-01', churn_threshold_days: int = 90) -> dict:
    # 1. Clean & Filter
    cleaned = orders_df.dropna(subset=["customer_id", "order_amount"]).copy()
    cleaned = cleaned[(cleaned["status"] != "cancelled") & (cleaned["order_amount"] > 0)]
    cleaned["order_date"] = pd.to_datetime(cleaned["order_date"])

    # 2. RFM Aggregation
    snap = pd.to_datetime(snapshot_date)
    rfm = cleaned.groupby("customer_id", as_index=False).agg(
        last_order=("order_date", "max"),
        frequency=("order_id", "count"),
        monetary_total=("order_amount", "sum"),
        avg_order_value=("order_amount", "mean")
    )
    rfm["monetary_total"] = rfm["monetary_total"].round(2)
    rfm["avg_order_value"] = rfm["avg_order_value"].round(2)

    # 3. Recency & Segmentation
    rfm["recency_days"] = (snap - rfm["last_order"]).dt.days
    rfm["is_churned"] = rfm["recency_days"] > churn_threshold_days

    def assign_segment(row):
        if row["is_churned"]:
            return "At-Risk"
        elif row["frequency"] >= 3:
            return "VIP"
        return "Regular"

    rfm["segment"] = rfm.apply(assign_segment, axis=1)
    rfm = rfm.sort_values("customer_id").reset_index(drop=True)

    # 4. Summary Metrics
    total_cust = int(len(rfm))
    churn_rate = round(float(rfm["is_churned"].mean()), 4) if total_cust > 0 else 0.0
    total_rev = float(rfm["monetary_total"].sum())
    vip_rev = float(rfm[rfm["segment"] == "VIP"]["monetary_total"].sum())
    vip_share = round(vip_rev / total_rev, 4) if total_rev > 0 else 0.0
    overall_aov = round(float(rfm["avg_order_value"].mean()), 2) if total_cust > 0 else 0.0

    summary_metrics = {
        "total_customers": total_cust,
        "churn_rate": churn_rate,
        "vip_revenue_share": vip_share,
        "overall_avg_order_value": overall_aov
    }

    return {
        "cleaned_orders": cleaned,
        "rfm_table": rfm,
        "summary_metrics": summary_metrics
    }
`,
      testCases: [
        {
          id: 't1',
          name: 'Multi-Customer RFM Segmentation',
          inputDescription: 'Orders with cancelled purchases, missing customer ID, and mixed purchase frequencies',
          expectedOutput: 'C1 and C3 are At-Risk, C2 is VIP, C4 is Regular; churn_rate=0.50'
        },
        {
          id: 't2',
          name: 'VIP Revenue Share & Executive Metrics',
          inputDescription: 'Verification of total_customers, vip_revenue_share, and overall_avg_order_value',
          expectedOutput: 'Metrics accurately match mathematical aggregates'
        }
      ],
      benchmarkTargetMs: 5.0,
      memoryTargetMb: 2.0,
      conceptPrimer: {
        title: 'Customer Segmentation & Churn Modeling',
        subtitle: 'From raw transaction logs to behavioral cohorts',
        overview: 'Clean transactional data, compute recency and frequency metrics, and calculate revenue concentration among top tiers.',
        mentalModel5s: 'Clean -> Groupby RFM -> Classify Segments -> Compute Executive Rollups.',
        visualAnalogy: 'Sorting customer cards by last visit date and visit count into VIP and At-Risk stacks.',
        pitfalls: [
          'Including cancelled orders in customer lifetime value.',
          'Not resetting index after grouping.'
        ],
        progressiveHints: [
          'Step 1: Clean and filter orders.',
          'Step 2: Group by customer_id for last_order, frequency, monetary_total.',
          'Step 3: Calculate recency_days and assign segments.',
          'Step 4: Compute summary metrics dictionary.'
        ],
        mathFormulas: [
          {
            title: 'Customer Churn Rate',
            latex: '\\text{Churn Rate} = \\frac{N_{\\text{churned}}}{N_{\\text{total}}}',
            explanation: 'Proportion of total customers who have exceeded the inactivity threshold.'
          },
          {
            title: 'VIP Revenue Concentration',
            latex: '\\text{Share}_{\\text{VIP}} = \\frac{\\sum_{i \\in \\text{VIP}} M_i}{\\sum_{\\text{all}} M_i}',
            explanation: 'Percentage of total company revenue contributed by VIP users.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Slow Python loop to check churn
churn_count = 0
for cust, orders in user_dict.items():
    if (snapshot - max(orders)).days > 90:
        churn_count += 1`,
          naiveExplanation: 'Incurs high Python dictionary overhead and per-element date math.',
          idiomaticCode: `# High speed vectorized timedelta comparison
rfm['is_churned'] = (snapshot - rfm['last_order']).dt.days > 90`,
          idiomaticExplanation: 'Runs vectorized integer comparisons across the entire column in C.',
          speedupText: '40x faster'
        },
        memoryLayout: {
          title: 'Segmented Summary Index',
          content: 'The aggregated table uses contiguous float and integer blocks, allowing fast summary statistics in a single pass.',
          keyRule: 'Always sort customer summary tables by ID or spend for deterministic reporting.'
        },
        keyTakeaways: [
          'Filter invalid records before calculating lifetime spend.',
          'Recency is measured from a fixed snapshot reference date.',
          'Summary metrics synthesize table-level data into executive KPIs.'
        ]
      }
    },
    {
      id: 'pandas-p7-c2',
      dayId: 7,
      partId: 7,
      title: 'Production KPI Pipeline Capstone',
      slug: 'production-kpi-pipeline-capstone',
      difficulty: 'Advanced',
      category: 'Analytics Pipeline',
      summary: 'Architect a multi-table production financial analytics pipeline combining relational joins, unit economics, daily rolling trends, and category KPIs.',
      mentalModel5s: 'Clean raw tables -> Multi-table left joins -> Engineer margins & unit profit -> Resample 7d rolling trends -> Executive category rollups.',
      visualAnalogy: 'An automated assembly line: dirty raw parts enter on one side, get washed, fitted with metadata, calculated for profit, and packaged into a polished executive dashboard.',
      pitfalls: [
        'Dropping legitimate transactions by using inner join instead of left join on users or products.',
        'Division by zero when computing profit margins on free or zero-revenue transactions.',
        'Not setting min_periods=1 on the rolling 7-day revenue trend.'
      ],
      progressiveHints: [
        'Tier 1 (Clean): Drop null transaction/user/product IDs, filter qty >= 1, fillna discount_rate with 0.0.',
        'Tier 2 (Merge): Left join products on product_id, left join users on user_id, fill missing country/channel.',
        'Tier 3 (Economics): Calculate gross_revenue, net_revenue, total_cost, profit, and profit_margin with np.where.',
        'Tier 4 (Daily Trend & Rollup): Resample "D" on timestamp for daily sums, add rolling 7d mean, and groupby category.'
      ],
      deepInternals: {
        title: 'Multi-Table Pipeline Orchestration',
        content: 'In enterprise pipelines, multi-table joins must be planned carefully to prevent row explosion. Left joins preserve the transaction grain while attaching dimensional attributes.',
        keyRule: 'Always perform financial calculations after all table enrichments are complete.'
      },
      instructions: `In this grand capstone challenge, you will architect a complete, multi-table production financial analytics pipeline.

Write a function \`build_production_kpi_pipeline(transactions: pd.DataFrame, products: pd.DataFrame, users: pd.DataFrame) -> dict\` that executes the full pipeline:

1. **Cleaning & Preprocessing**:
   - Drop transaction rows where \`'transaction_id'\`, \`'user_id'\`, or \`'product_id'\` is null.
   - Filter transactions to retain only records where \`'quantity' >= 1\`.
   - Impute missing \`'discount_rate'\` values with \`0.0\`.
   - Parse \`'timestamp'\` into datetime timestamps.

2. **Multi-Table Relational Merges**:
   - Perform a left join between \`transactions\` and \`products\` matching on \`'product_id'\`.
   - Perform a left join between the resulting table and \`users\` matching on \`'user_id'\`.
   - Impute missing \`'country'\` values with \`'Unknown'\` and missing \`'acquisition_channel'\` values with \`'Organic'\`.

3. **Unit Economics & Feature Engineering**:
   - \`'gross_revenue'\`: gross revenue calculated as \`quantity * unit_price\`, rounded to 2 decimal places.
   - \`'net_revenue'\`: gross revenue discounted by \`discount_rate\` (\`gross_revenue * (1.0 - discount_rate)\`), rounded to 2 decimal places.
   - \`'total_cost'\`: total cost of goods sold (\`quantity * cogs\`), rounded to 2 decimal places.
   - \`'profit'\`: net revenue minus total cost (\`net_revenue - total_cost\`), rounded to 2 decimal places.
   - \`'profit_margin'\`: profit divided by net revenue where net revenue > 0 (otherwise \`0.0\`), rounded to 4 decimal places.

4. **Daily Rolling Trend**:
   - Sort chronologically by \`'timestamp'\` ascending and set \`'timestamp'\` as the index.
   - Resample transactions to daily intervals (\`'D'\`) and sum \`'net_revenue'\` and \`'profit'\`.
   - Rename columns to \`'daily_net_revenue'\` and \`'daily_profit'\`.
   - Add \`'rolling_7d_revenue'\`: 7-day rolling moving average of \`'daily_net_revenue'\` (accounting for initial days with \`min_periods=1\`), rounded to 2 decimal places.
   - Reset index so \`'timestamp'\` is preserved as a column in the output \`daily_trend\` DataFrame.

5. **Category KPI Summary**:
   - Group the merged table by \`'category'\` and aggregate:
     * \`'total_net_revenue'\`: sum of \`'net_revenue'\` (round 2)
     * \`'total_profit'\`: sum of \`'profit'\` (round 2)
     * \`'order_volume'\`: count of \`'transaction_id'\` (int)
   - Add \`'overall_profit_margin'\`: \`'total_profit'\` divided by \`'total_net_revenue'\`, rounded to 4 decimal places.
   - Sort by \`'total_net_revenue'\` descending and reset the row index.

6. **Executive Metrics** (dict):
   - \`'total_net_revenue'\`: float rounded to 2 decimal places.
   - \`'total_gross_profit'\`: float rounded to 2 decimal places.
   - \`'overall_margin'\`: total gross profit divided by total net revenue, rounded to 4 decimal places.
   - \`'active_countries'\`: int count of unique \`'country'\` values.

7. Return a dictionary:
   \`{"enriched_transactions": enriched, "daily_trend": daily_trend, "category_kpis": category_kpis, "executive_metrics": executive_metrics}\``,
      hints: [
        'Clean transactions: use dropna(subset=["transaction_id", "user_id", "product_id"]) and filter quantity >= 1.',
        'Perform left merges: transactions.merge(products, on="product_id", how="left").merge(users, on="user_id", how="left").',
        'Fill missing values: discount_rate with 0.0, country with "Unknown", acquisition_channel with "Organic".',
        'Calculate unit economics: gross_revenue = quantity * unit_price, net_revenue = gross * (1 - discount), etc.',
        'For daily trend: resample with "D" and compute 7-day rolling average with min_periods=1.'
      ],
      starterCode: `import pandas as pd
import numpy as np

def build_production_kpi_pipeline(transactions: pd.DataFrame, products: pd.DataFrame, users: pd.DataFrame) -> dict:
    """
    Execute a multi-table production financial analytics pipeline.

    Args:
        transactions: DataFrame with ['transaction_id', 'user_id', 'product_id', 'timestamp', 'quantity', 'discount_rate']
        products: DataFrame with ['product_id', 'category', 'unit_price', 'cogs']
        users: DataFrame with ['user_id', 'country', 'acquisition_channel']

    Returns:
        dict with 'enriched_transactions', 'daily_trend', 'category_kpis', 'executive_metrics'
    """
    # TODO: Clean, merge multi-tables, compute unit economics, resample daily trend, and summarize KPIs
    pass
`,
      solutionCode: `import pandas as pd
import numpy as np

def build_production_kpi_pipeline(transactions: pd.DataFrame, products: pd.DataFrame, users: pd.DataFrame) -> dict:
    # 1. Cleaning & Preprocessing
    clean_tx = transactions.dropna(subset=["transaction_id", "user_id", "product_id"]).copy()
    clean_tx = clean_tx[clean_tx["quantity"] >= 1].copy()
    clean_tx["discount_rate"] = clean_tx["discount_rate"].fillna(0.0)
    clean_tx["timestamp"] = pd.to_datetime(clean_tx["timestamp"])

    # 2. Multi-Table Relational Merges
    merged = pd.merge(clean_tx, products, on="product_id", how="left")
    merged = pd.merge(merged, users, on="user_id", how="left")
    merged["country"] = merged["country"].fillna("Unknown")
    merged["acquisition_channel"] = merged["acquisition_channel"].fillna("Organic")

    # 3. Unit Economics & Feature Engineering
    merged["gross_revenue"] = (merged["quantity"] * merged["unit_price"]).round(2)
    merged["net_revenue"] = (merged["gross_revenue"] * (1.0 - merged["discount_rate"])).round(2)
    merged["total_cost"] = (merged["quantity"] * merged["cogs"]).round(2)
    merged["profit"] = (merged["net_revenue"] - merged["total_cost"]).round(2)
    merged["profit_margin"] = np.where(
        merged["net_revenue"] > 0,
        (merged["profit"] / merged["net_revenue"]).round(4),
        0.0
    )

    # 4. Daily Rolling Trend
    df_sorted = merged.sort_values("timestamp").copy()
    df_sorted = df_sorted.set_index("timestamp")
    daily = df_sorted.resample("D").agg({
        "net_revenue": "sum",
        "profit": "sum"
    }).rename(columns={
        "net_revenue": "daily_net_revenue",
        "profit": "daily_profit"
    })
    daily["daily_net_revenue"] = daily["daily_net_revenue"].round(2)
    daily["daily_profit"] = daily["daily_profit"].round(2)
    daily["rolling_7d_revenue"] = daily["daily_net_revenue"].rolling(window=7, min_periods=1).mean().round(2)
    daily_trend = daily.reset_index()

    # 5. Category KPI Summary
    category_kpis = merged.groupby("category", as_index=False).agg(
        total_net_revenue=("net_revenue", "sum"),
        total_profit=("profit", "sum"),
        order_volume=("transaction_id", "count")
    )
    category_kpis["total_net_revenue"] = category_kpis["total_net_revenue"].round(2)
    category_kpis["total_profit"] = category_kpis["total_profit"].round(2)
    category_kpis["overall_profit_margin"] = (
        category_kpis["total_profit"] / category_kpis["total_net_revenue"]
    ).round(4)
    category_kpis = category_kpis.sort_values("total_net_revenue", ascending=False).reset_index(drop=True)

    # 6. Executive Metrics
    total_net = round(float(merged["net_revenue"].sum()), 2)
    total_prof = round(float(merged["profit"].sum()), 2)
    margin = round(total_prof / total_net, 4) if total_net > 0 else 0.0
    active_countries = int(merged["country"].nunique())

    executive_metrics = {
        "total_net_revenue": total_net,
        "total_gross_profit": total_prof,
        "overall_margin": margin,
        "active_countries": active_countries
    }

    return {
        "enriched_transactions": merged,
        "daily_trend": daily_trend,
        "category_kpis": category_kpis,
        "executive_metrics": executive_metrics
    }
`,
      testCases: [
        {
          id: 't1',
          name: 'Multi-Table Pipeline Ingestion & Cleaning',
          inputDescription: 'Transactions with bad IDs, zero quantity, product catalog COGS, and user countries',
          expectedOutput: 'Bad transactions dropped, unit economics accurately calculated, country filled Unknown'
        },
        {
          id: 't2',
          name: 'Daily Rolling Trend & Category KPIs',
          inputDescription: 'Daily 7-day rolling revenue trend and category profitability ranking',
          expectedOutput: 'daily_trend has timestamp column, category_kpis sorted by total_net_revenue descending'
        }
      ],
      benchmarkTargetMs: 8.0,
      memoryTargetMb: 3.0,
      conceptPrimer: {
        title: 'Full Production Pipeline Architecture',
        subtitle: 'From messy raw databases to C-suite executive dashboards',
        overview: 'Combine data hygiene, multi-table joins, unit economics feature engineering, daily resampling, and rolling averages in one unified architecture.',
        mentalModel5s: 'Ingest -> Clean -> Merge -> Calculate Economics -> Rollup KPIs.',
        visualAnalogy: 'A refinery turning raw crude oil into high-octane gasoline, engine oil, and jet fuel.',
        pitfalls: [
          'Using inner joins instead of left joins for catalogs.',
          'Division by zero when margins are computed on zero revenue.'
        ],
        progressiveHints: [
          'Step 1: Clean transactions and filter quantity >= 1.',
          'Step 2: Merge products and users with how="left".',
          'Step 3: Engineer gross_revenue, net_revenue, profit, profit_margin.',
          'Step 4: Resample daily and compute rolling 7-day revenue.',
          'Step 5: Groupby category and compute executive metrics.'
        ],
        mathFormulas: [
          {
            title: 'Net Profit Margin',
            latex: '\\text{Margin} = \\frac{\\text{Net Revenue} - \\text{COGS}}{\\text{Net Revenue}}',
            explanation: 'Percentage of net sales dollars converted to company profit.'
          },
          {
            title: '7-Day Rolling Revenue',
            latex: '\\text{Rev}_{7d}(t) = \\frac{1}{\\min(t, 7)} \\sum_{i=0}^{\\min(t-1, 6)} \\text{DailyRev}(t - i)',
            explanation: '7-day moving average of daily net sales with expanding warmup.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Manual row iteration to compute unit profit
profits = []
for _, row in tx.iterrows():
    p = catalog[row['prod_id']]
    profits.append(row['qty'] * (p['price'] - p['cogs']))`,
          naiveExplanation: 'Iterating over millions of rows with Python dictionaries is 100x slower than vectorized columnar math.',
          idiomaticCode: `# Vectorized relational merge and arithmetic
merged = tx.merge(catalog, on='prod_id', how='left')
merged['profit'] = merged['net_revenue'] - (merged['qty'] * merged['cogs'])`,
          idiomaticExplanation: 'Runs compiled C hash joins and SIMD-accelerated column arithmetic.',
          speedupText: '70x faster'
        },
        memoryLayout: {
          title: 'Relational BlockManager Layout',
          content: 'Merged DataFrames organize columns into consolidated numeric blocks (float64 for revenue, int64 for counts) and PyArrow/Categorical string blocks.',
          keyRule: 'Batch compute column transformations to allow Pandas to optimize underlying BlockManager allocations.'
        },
        keyTakeaways: [
          'Use left joins to avoid dropping transaction records.',
          'Calculate unit economics column-wise using vectorized math.',
          'Always guard margin divisions against zero revenue with np.where().',
          'Executive KPI dictionaries should contain rounded scalar values.'
        ]
      }
    }
  ]
};

export const PANDAS_PART07_TRACK = DAY07_TRACK;
export const testCases = [...DAY07_TRACK.challenges[0].testCases, ...DAY07_TRACK.challenges[1].testCases];
export default DAY07_TRACK;
