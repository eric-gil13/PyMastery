"""
Part 7: End-to-End Practical Analytics Pipeline
PyMastery Progressive Pandas Curriculum
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List

DAY_METADATA = {
    "day_id": "pandas_day07",
    "day_number": 7,
    "title": "Part 7: End-to-End Practical Analytics Pipeline",
    "tagline": "Build production-grade data pipelines: chain transformations, clean messy inputs, engineer metrics, and generate executive KPI reports.",
    "estimated_time": "2-3 hours",
    "concepts_covered": [
        "Method chaining and modular pipeline architecture (.pipe())",
        "Robust data cleaning: handling nulls (dropna, fillna) and type coercion",
        "Domain feature engineering and financial unit economics",
        "Customer cohort & RFM (Recency, Frequency, Monetary) segmentation",
        "Multi-table pipeline orchestration (joining transactions, catalogs, and users)",
        "Temporal rolling trend aggregation and category KPI rollups"
    ]
}

CONCEPT_PRIMER = r"""# Part 7 Concept Primer: End-to-End Practical Analytics Pipeline

## 1. From Ad-Hoc Scripts to Production Pipelines
Throughout Parts 1 through 6, you learned individual Pandas tools in isolation:
- Creating DataFrames and Series
- Indexing and filtering with boolean masks
- Grouping, aggregating, and reshaping
- Merging and combining multi-source tables
- Handling timestamps, rolling windows, and resampling

In industry, data analysts and machine learning engineers don't just run one-line snippets. They build **end-to-end data pipelines** that ingest dirty, incomplete data from multiple production databases, clean it, engineer business metrics, and output clean dashboards and executive summaries.

---

## 2. The Power of Pipeline Design & Method Chaining

Beginner code often creates dozens of intermediate throwaway variables:
```python
# Messy procedural script:
df1 = raw_df.dropna(subset=['customer_id'])
df2 = df1[df1['amount'] > 0]
df3 = df2.copy()
df3['tax'] = df3['amount'] * 0.08
df4 = df3.merge(users, on='customer_id')
```
This clutters memory and makes code difficult to read, debug, and test.

### Modern Idiom: Functional Steps with `.pipe()`
Pandas provides `.pipe()`, which lets you compose functions in a clean pipeline:
```python
def clean_orders(df):
    return df.dropna(subset=['customer_id']).query("amount > 0")

def add_tax(df):
    return df.assign(tax=df['amount'] * 0.08)

def enrich_users(df, users_df):
    return df.merge(users_df, on='customer_id', how='left')

# Beautiful, readable, testable pipeline:
final_df = (
    raw_df
    .pipe(clean_orders)
    .pipe(add_tax)
    .pipe(enrich_users, users_df=users)
)
```

---

## 3. Customer Analytics: The RFM Framework

One of the most famous analytics patterns in e-commerce and SaaS is **RFM Analysis**:
- **R (Recency):** How recently did the customer place an order? (`snapshot_date - last_order_date`). Recent buyers are much more likely to purchase again.
- **F (Frequency):** How often do they buy? (`count` of completed orders). Highly frequent buyers are brand advocates.
- **M (Monetary):** How much money did they spend? (`sum` of order revenue).

```
                      +-----------------------------+
                      | Raw Orders Transaction Log  |
                      +-----------------------------+
                                     |
                     Filter status == 'completed'
                                     v
                      +-----------------------------+
                      | Group by 'customer_id'      |
                      | - max(order_date) -> Recency|
                      | - count(order_id) -> Freq   |
                      | - sum(amount)     -> Money  |
                      +-----------------------------+
                                     |
               +---------------------+---------------------+
               |                     |                     |
        Recency > 90d          Freq >= 3 orders        Otherwise
               v                     v                     v
          [ At-Risk ]             [ VIP ]             [ Regular ]
```

---

## 4. Multi-Table Unit Economics

When tracking corporate KPIs, revenue alone does not tell the full story:
1. **Gross Revenue** = `Quantity * Unit Price`
2. **Net Revenue** = `Gross Revenue * (1 - Discount Rate)`
3. **Total COGS (Cost of Goods Sold)** = `Quantity * Unit Cost`
4. **Gross Profit** = `Net Revenue - Total COGS`
5. **Gross Margin %** = `Gross Profit / Net Revenue`

A production pipeline integrates the product catalog (costs, categories) and user attributes (acquisition channel, geography) to provide complete visibility to the C-suite.
"""

WALKTHROUGH = r"""# Part 7 Code Walkthrough: Building an Analytics Pipeline

Let's build a mini end-to-end analytical pipeline from raw dirty transactions:

```python
import pandas as pd
import numpy as np

# 1. Simulate raw orders table with dirty data (missing user, negative amount, cancelled order)
raw_orders = pd.DataFrame({
    'order_id': [101, 102, 103, 104, 105],
    'customer_id': ['U1', 'U2', None, 'U1', 'U2'],
    'order_date': ['2024-01-10', '2024-02-15', '2024-03-01', '2024-05-20', '2024-06-01'],
    'amount': [120.0, 50.0, 80.0, -10.0, 200.0],
    'status': ['completed', 'completed', 'completed', 'refunded', 'completed']
})

print("--- Raw Orders ---")
print(raw_orders)

# 2. Pipeline Step 1: Cleaning & Validation
def clean_transactions(df: pd.DataFrame) -> pd.DataFrame:
    cleaned = df.dropna(subset=['customer_id']).copy()
    cleaned = cleaned[(cleaned['amount'] > 0) & (cleaned['status'] == 'completed')]
    cleaned['order_date'] = pd.to_datetime(cleaned['order_date'])
    return cleaned

clean_df = clean_transactions(raw_orders)
print("\n--- Cleaned Orders ---")
print(clean_df)

# 3. Pipeline Step 2: RFM Aggregation
def compute_rfm(df: pd.DataFrame, snapshot_date='2024-07-01') -> pd.DataFrame:
    snap = pd.to_datetime(snapshot_date)
    rfm = df.groupby('customer_id', as_index=False).agg(
        last_order=('order_date', 'max'),
        frequency=('order_id', 'count'),
        monetary=('amount', 'sum')
    )
    rfm['recency_days'] = (snap - rfm['last_order']).dt.days
    rfm['segment'] = np.where(rfm['recency_days'] > 60, 'At-Risk', 'Active')
    return rfm

rfm_table = compute_rfm(clean_df)
print("\n--- RFM Summary Table ---")
print(rfm_table[['customer_id', 'recency_days', 'frequency', 'monetary', 'segment']])
```
"""

# -----------------------------------------------------------------------------
# Challenge 1: E-Commerce Churn & Retention Analytics (pandas-p7-c1)
# -----------------------------------------------------------------------------

CHALLENGE_1 = {
    "id": "pandas-p7-c1",
    "title": "E-Commerce Churn & Retention Analytics",
    "difficulty": "Intermediate",
    "category": "Analytics Pipeline",
    "description": (
        "Construct an end-to-end customer retention and RFM segmentation pipeline. "
        "Filter invalid transactions, compute days since last purchase, categorize customers into behavioral segments, "
        "and calculate executive churn and revenue share metrics."
    ),
    "instructions": (
        "Write a function `build_rfm_pipeline(orders_df: pd.DataFrame, snapshot_date: str = '2024-07-01', churn_threshold_days: int = 90) -> dict` that:\n"
        "1. **Clean & Filter**:\n"
        "   - Drop rows where `'customer_id'` or `'order_amount'` is missing/null.\n"
        "   - Filter to keep only positive orders where `'status' != 'cancelled'` and `'order_amount' > 0`.\n"
        "   - Parse `'order_date'` into datetime timestamps.\n"
        "2. **RFM Aggregation**:\n"
        "   Group the cleaned orders by `'customer_id'` and compute:\n"
        "   - `'last_order'`: maximum `'order_date'`\n"
        "   - `'frequency'`: count of valid `'order_id'` (int)\n"
        "   - `'monetary_total'`: sum of `'order_amount'` (float, rounded to 2 decimal places)\n"
        "   - `'avg_order_value'`: mean of `'order_amount'` (float, rounded to 2 decimal places)\n"
        "3. **Recency & Segmentation**:\n"
        "   - `'recency_days'`: integer elapsed days between the snapshot reference date and the customer's `'last_order'`.\n"
        "   - `'is_churned'`: boolean flag `True` if `recency_days > churn_threshold_days`, else `False`.\n"
        "   - `'segment'`: Categorize each user as:\n"
        "     * `'At-Risk'` if `is_churned` is `True`\n"
        "     * `'VIP'` if `is_churned` is `False` and `frequency >= 3`\n"
        "     * `'Regular'` otherwise\n"
        "   Sort `rfm_table` ascending by `'customer_id'` and reset the row index.\n"
        "4. **Executive Summary Metrics** (dict):\n"
        "   - `'total_customers'`: Total number of unique customers (int).\n"
        "   - `'churn_rate'`: Fraction of customers with `is_churned == True` (float rounded to 4 decimal places).\n"
        "   - `'vip_revenue_share'`: Sum of `monetary_total` for VIP customers divided by total `monetary_total` (float rounded to 4 decimals, or 0.0 if total is 0).\n"
        "   - `'overall_avg_order_value'`: Mean of `'avg_order_value'` across all customers (float rounded to 2 decimal places).\n"
        "5. Returns a dictionary:\n"
        "   `{\"cleaned_orders\": cleaned_orders, \"rfm_table\": rfm_table, \"summary_metrics\": summary_metrics}`"
    ),
    "starter_code": r'''import pandas as pd
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
''',
    "reference_solution": r'''import pandas as pd
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
''',
    "test_suite": r'''import pandas as pd
import numpy as np

def run_tests(candidate_func):
    report = {"passed": True, "tests_run": 0, "errors": []}

    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Raw transactions test dataset
    orders = pd.DataFrame({
        "order_id": ["O1", "O2", "O3", "O4", "O5", "O6", "O7", "O8", "O9"],
        "customer_id": ["C1", "C1", "C2", "C2", "C2", "C3", None, "C4", "C4"],
        "order_date": [
            "2024-01-10", "2024-02-15", # C1: last 2024-02-15 (recency 137d > 90d -> At-Risk)
            "2024-06-01", "2024-06-15", "2024-06-25", # C2: last 2024-06-25 (recency 6d, freq=3 -> VIP)
            "2024-01-05", # C3: last 2024-01-05 (recency 178d -> At-Risk)
            "2024-05-01", # Missing customer_id -> should be dropped
            "2024-06-20", "2024-06-28"  # C4: last 2024-06-28 (recency 3d, freq=2 -> Regular)
        ],
        "order_amount": [100.0, 150.0, 50.0, 75.0, 125.0, 200.0, 50.0, 80.0, 120.0],
        "status": ["completed", "completed", "completed", "completed", "completed", "completed", "completed", "cancelled", "completed"]
    })
    # Notice O8 for C4 is cancelled! So C4 valid orders = 1 (O9 only, 120.0, recency 3d -> Regular)

    res = candidate_func(orders, snapshot_date="2024-07-01", churn_threshold_days=90)
    assert_test(isinstance(res, dict), "Result must be a Python dictionary")
    for k in ["cleaned_orders", "rfm_table", "summary_metrics"]:
        assert_test(k in res, f"Result missing key '{k}'")

    clean = res["cleaned_orders"]
    rfm = res["rfm_table"]
    metrics = res["summary_metrics"]

    # Test 1: Cleaning drops null customer_id and cancelled orders
    assert_test(len(clean) == 7, f"Cleaned orders should have 7 rows, got {len(clean)}")
    assert_test("cancelled" not in clean["status"].values, "Cleaned orders must not contain cancelled orders")
    assert_test(clean["customer_id"].isna().sum() == 0, "Cleaned orders must have 0 null customer_ids")

    # Test 2: RFM table structure & customer count
    assert_test(len(rfm) == 4, f"rfm_table should have 4 customers (C1, C2, C3, C4), got {len(rfm)}")
    assert_test(list(rfm["customer_id"]) == ["C1", "C2", "C3", "C4"], "rfm_table must be sorted ascending by customer_id")

    # Test 3: Validate customer segments
    c1_row = rfm[rfm["customer_id"] == "C1"].iloc[0]
    assert_test(c1_row["frequency"] == 2, f"C1 frequency expected 2, got {c1_row['frequency']}")
    assert_test(c1_row["recency_days"] == 137, f"C1 recency_days expected 137, got {c1_row['recency_days']}")
    assert_test(c1_row["is_churned"] == True, "C1 should be flagged is_churned=True")
    assert_test(c1_row["segment"] == "At-Risk", f"C1 segment expected 'At-Risk', got '{c1_row['segment']}'")

    c2_row = rfm[rfm["customer_id"] == "C2"].iloc[0]
    assert_test(c2_row["frequency"] == 3, f"C2 frequency expected 3, got {c2_row['frequency']}")
    assert_test(c2_row["is_churned"] == False, "C2 should be flagged is_churned=False")
    assert_test(c2_row["segment"] == "VIP", f"C2 segment expected 'VIP', got '{c2_row['segment']}'")

    c4_row = rfm[rfm["customer_id"] == "C4"].iloc[0]
    assert_test(c4_row["frequency"] == 1, f"C4 frequency expected 1 (1 cancelled excluded), got {c4_row['frequency']}")
    assert_test(c4_row["segment"] == "Regular", f"C4 segment expected 'Regular', got '{c4_row['segment']}'")

    # Test 4: Executive summary KPIs
    assert_test(metrics["total_customers"] == 4, f"total_customers expected 4, got {metrics['total_customers']}")
    # 2 out of 4 customers are churned (C1 and C3) -> 0.50
    assert_test(np.isclose(metrics["churn_rate"], 0.50), f"churn_rate expected 0.50, got {metrics['churn_rate']}")

    # Total spend: C1=250, C2=250, C3=200, C4=120 -> 820.0. VIP (C2) spend = 250.0. 250/820 = 0.3049
    expected_vip_share = round(250.0 / 820.0, 4)
    assert_test(np.isclose(metrics["vip_revenue_share"], expected_vip_share, atol=1e-3),
                f"vip_revenue_share expected {expected_vip_share}, got {metrics['vip_revenue_share']}")

    return report
''',
    "hints": [
        "Filter out null customer_id and cancelled orders first using .dropna() and boolean indexing.",
        "Use .groupby('customer_id', as_index=False).agg(...) with max, count, sum, and mean.",
        "Calculate recency_days using (pd.to_datetime(snapshot_date) - rfm['last_order']).dt.days.",
        "Apply segment logic: if is_churned -> 'At-Risk', elif frequency >= 3 -> 'VIP', else 'Regular'."
    ]
}

# -----------------------------------------------------------------------------
# Challenge 2: Production KPI Pipeline Capstone (pandas-p7-c2)
# -----------------------------------------------------------------------------

CHALLENGE_2 = {
    "id": "pandas-p7-c2",
    "title": "Production KPI Pipeline Capstone",
    "difficulty": "Advanced",
    "category": "Analytics Pipeline",
    "description": (
        "Architect a multi-table production financial analytics pipeline. "
        "Ingest transactions, product catalog costs, and user demographics; clean and merge relational data; "
        "engineer revenue and gross profit unit economics; compute 7-day rolling revenue trends; and generate executive KPI summaries."
    ),
    "instructions": (
        "Write a function `build_production_kpi_pipeline(transactions: pd.DataFrame, products: pd.DataFrame, users: pd.DataFrame) -> dict` that executes the full pipeline:\n\n"
        "1. **Cleaning & Preprocessing**:\n"
        "   - Drop transaction rows where `'transaction_id'`, `'user_id'`, or `'product_id'` is null.\n"
        "   - Filter transactions to retain only records where `'quantity' >= 1`.\n"
        "   - Impute missing `'discount_rate'` values with `0.0`.\n"
        "   - Parse `'timestamp'` into datetime timestamps.\n\n"
        "2. **Multi-Table Relational Merges**:\n"
        "   - Perform a left join between `transactions` and `products` matching on `'product_id'`.\n"
        "   - Perform a left join between the resulting table and `users` matching on `'user_id'`.\n"
        "   - Impute missing `'country'` values with `'Unknown'` and missing `'acquisition_channel'` values with `'Organic'`.\n\n"
        "3. **Unit Economics & Feature Engineering**:\n"
        "   - `'gross_revenue'`: gross revenue calculated as `quantity * unit_price`, rounded to 2 decimal places.\n"
        "   - `'net_revenue'`: gross revenue discounted by `discount_rate` (`gross_revenue * (1.0 - discount_rate)`), rounded to 2 decimal places.\n"
        "   - `'total_cost'`: total cost of goods sold (`quantity * cogs`), rounded to 2 decimal places.\n"
        "   - `'profit'`: net revenue minus total cost (`net_revenue - total_cost`), rounded to 2 decimal places.\n"
        "   - `'profit_margin'`: profit divided by net revenue where net revenue > 0 (otherwise `0.0`), rounded to 4 decimal places.\n\n"
        "4. **Daily Rolling Trend**:\n"
        "   - Sort chronologically by `'timestamp'` ascending and set `'timestamp'` as the index.\n"
        "   - Resample transactions to daily intervals (`'D'`) and sum `'net_revenue'` and `'profit'`.\n"
        "   - Rename columns to `'daily_net_revenue'` and `'daily_profit'`.\n"
        "   - Add `'rolling_7d_revenue'`: 7-day rolling moving average of `'daily_net_revenue'` (accounting for initial days with `min_periods=1`), rounded to 2 decimal places.\n"
        "   - Reset index so `'timestamp'` is preserved as a column in the output `daily_trend` DataFrame.\n\n"
        "5. **Category KPI Summary**:\n"
        "   - Group the merged table by `'category'` and aggregate:\n"
        "     * `'total_net_revenue'`: sum of `'net_revenue'` (round 2)\n"
        "     * `'total_profit'`: sum of `'profit'` (round 2)\n"
        "     * `'order_volume'`: count of `'transaction_id'` (int)\n"
        "   - Add `'overall_profit_margin'`: `'total_profit'` divided by `'total_net_revenue'`, rounded to 4 decimal places.\n"
        "   - Sort by `'total_net_revenue'` descending and reset the row index.\n\n"
        "6. **Executive Metrics** (dict):\n"
        "   - `'total_net_revenue'`: float rounded to 2 decimal places.\n"
        "   - `'total_gross_profit'`: float rounded to 2 decimal places.\n"
        "   - `'overall_margin'`: total gross profit divided by total net revenue, rounded to 4 decimal places.\n"
        "   - `'active_countries'`: int count of unique `'country'` values.\n\n"
        "7. Return a dictionary:\n"
        "   `{\"enriched_transactions\": enriched, \"daily_trend\": daily_trend, \"category_kpis\": category_kpis, \"executive_metrics\": executive_metrics}`"
    ),
    "starter_code": r'''import pandas as pd
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
''',
    "reference_solution": r'''import pandas as pd
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
''',
    "test_suite": r'''import pandas as pd
import numpy as np

def run_tests(candidate_func):
    report = {"passed": True, "tests_run": 0, "errors": []}

    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Fixtures
    tx = pd.DataFrame({
        "transaction_id": ["T1", "T2", "T3", "T4", "T5", "T6_bad", "T7_zero"],
        "user_id": ["U1", "U2", "U1", "U3", "U2", None, "U1"],
        "product_id": ["P1", "P2", "P1", "P3", "P2", "P1", "P1"],
        "timestamp": [
            "2024-03-01 10:00:00", "2024-03-01 14:00:00",
            "2024-03-02 09:00:00", "2024-03-03 11:00:00",
            "2024-03-04 15:00:00", "2024-03-05 12:00:00",
            "2024-03-05 13:00:00"
        ],
        "quantity": [2, 1, 3, 1, 2, 1, 0], # T6 has null user, T7 has quantity=0
        "discount_rate": [0.1, 0.0, None, 0.2, 0.0, 0.0, 0.0]
    })

    products = pd.DataFrame({
        "product_id": ["P1", "P2", "P3"],
        "category": ["Electronics", "Home", "Electronics"],
        "unit_price": [100.0, 50.0, 200.0],
        "cogs": [60.0, 25.0, 110.0]
    })

    users = pd.DataFrame({
        "user_id": ["U1", "U2"], # Note: U3 is missing from users (guest)
        "country": ["US", "CA"],
        "acquisition_channel": ["Paid Search", "Referral"]
    })

    res = candidate_func(tx, products, users)
    assert_test(isinstance(res, dict), "Result must be a Python dictionary")
    for k in ["enriched_transactions", "daily_trend", "category_kpis", "executive_metrics"]:
        assert_test(k in res, f"Result dictionary missing key '{k}'")

    enriched = res["enriched_transactions"]
    daily = res["daily_trend"]
    cat_kpis = res["category_kpis"]
    exec_m = res["executive_metrics"]

    # Test 1: Cleaning dropped bad rows
    assert_test(len(enriched) == 5, f"Enriched transactions should have 5 rows (T6 and T7 dropped), got {len(enriched)}")
    assert_test("T6_bad" not in enriched["transaction_id"].values, "T6_bad with null user_id must be dropped")
    assert_test("T7_zero" not in enriched["transaction_id"].values, "T7_zero with quantity=0 must be dropped")

    # Test 2: Unmatched user handled gracefully
    u3_row = enriched[enriched["user_id"] == "U3"].iloc[0]
    assert_test(u3_row["country"] == "Unknown", f"Unmatched user country should be 'Unknown', got '{u3_row['country']}'")
    assert_test(u3_row["acquisition_channel"] == "Organic", f"Unmatched user channel should be 'Organic', got '{u3_row['acquisition_channel']}'")

    # Test 3: Financial unit economics verification
    # T1: P1 ($100), qty=2, discount=0.1 -> gross=200, net=180, cogs=120, profit=60
    t1_row = enriched[enriched["transaction_id"] == "T1"].iloc[0]
    assert_test(np.isclose(t1_row["gross_revenue"], 200.0), f"T1 gross_revenue expected 200.0, got {t1_row['gross_revenue']}")
    assert_test(np.isclose(t1_row["net_revenue"], 180.0), f"T1 net_revenue expected 180.0, got {t1_row['net_revenue']}")
    assert_test(np.isclose(t1_row["total_cost"], 120.0), f"T1 total_cost expected 120.0, got {t1_row['total_cost']}")
    assert_test(np.isclose(t1_row["profit"], 60.0), f"T1 profit expected 60.0, got {t1_row['profit']}")

    # Test 4: Executive metrics
    # Total net: T1(180) + T2(50) + T3(300) + T4(160) + T5(100) = 790.0
    assert_test(np.isclose(exec_m["total_net_revenue"], 790.0), f"total_net_revenue expected 790.0, got {exec_m['total_net_revenue']}")
    # Total profit: T1(60) + T2(25) + T3(120) + T4(50) + T5(50) = 305.0
    assert_test(np.isclose(exec_m["total_gross_profit"], 305.0), f"total_gross_profit expected 305.0, got {exec_m['total_gross_profit']}")
    assert_test(np.isclose(exec_m["overall_margin"], round(305.0 / 790.0, 4)), f"overall_margin mismatch")
    assert_test(exec_m["active_countries"] == 3, f"active_countries expected 3 ('US', 'CA', 'Unknown'), got {exec_m['active_countries']}")

    # Test 5: Category KPIs
    assert_test(len(cat_kpis) == 2, f"category_kpis should have 2 categories, got {len(cat_kpis)}")
    assert_test(cat_kpis.iloc[0]["category"] == "Electronics", "Electronics should be first category by revenue")
    elec = cat_kpis[cat_kpis["category"] == "Electronics"].iloc[0]
    # Electronics net: T1(180) + T3(300) + T4(160) = 640.0, profit = 60+120+50 = 230.0
    assert_test(np.isclose(elec["total_net_revenue"], 640.0), f"Electronics net expected 640.0, got {elec['total_net_revenue']}")
    assert_test(np.isclose(elec["total_profit"], 230.0), f"Electronics profit expected 230.0, got {elec['total_profit']}")

    # Test 6: Daily trend
    assert_test("timestamp" in daily.columns, "daily_trend must have 'timestamp' as a column (reset_index)")
    assert_test("rolling_7d_revenue" in daily.columns, "daily_trend missing 'rolling_7d_revenue'")
    assert_test(len(daily) == 4, f"daily_trend should cover 4 days (Mar 1 to Mar 4), got {len(daily)}")

    return report
''',
    "hints": [
        "Clean transactions: use dropna(subset=['transaction_id', 'user_id', 'product_id']) and filter quantity >= 1.",
        "Perform left merges: transactions.merge(products, on='product_id', how='left').merge(users, on='user_id', how='left').",
        "Fill missing values: discount_rate with 0.0, country with 'Unknown', acquisition_channel with 'Organic'.",
        "Calculate unit economics: gross_revenue = quantity * unit_price, net_revenue = gross * (1 - discount), etc.",
        "For daily trend: resample with 'D' and compute 7-day rolling average with min_periods=1."
    ]
}

CHALLENGES = [CHALLENGE_1, CHALLENGE_2]

CURRICULUM_DATA = {
    **DAY_METADATA,
    "concept_primer": CONCEPT_PRIMER,
    "walkthrough": WALKTHROUGH,
    "challenges": CHALLENGES,
}

def get_curriculum() -> Dict[str, Any]:
    return CURRICULUM_DATA
