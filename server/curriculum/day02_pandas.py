"""
Day 2: High-Throughput Pandas & Analytical Data Engines
PyMastery 7-Day Curriculum
"""

import pandas as pd
import numpy as np
import time
from typing import Dict, Any, List

DAY_METADATA = {
    "day_id": "day02",
    "day_number": 2,
    "title": "Day 2: High-Throughput Pandas & Analytical Data Engines",
    "tagline": "Master index alignment, categorical memory optimization, Cythonized groupby DAGs, and vectorized time-series wrangling.",
    "estimated_time": "3-4 hours",
    "concepts_covered": [
        "Index alignment & binary operation semantics",
        "Categorical dtypes for 90%+ RAM reduction and cache locality",
        "GroupBy execution DAGs (Split-Apply-Combine, Cython engine vs UDFs)",
        "Vectorized datetime manipulation & high-frequency resampling",
        "Zero-loop financial analytics (OHLCV bars, log returns, rolling volatility, VWAP)",
        "Multi-table joins & memory-efficient relational aggregation"
    ]
}

CONCEPT_PRIMER = r"""# Day 2 Concept Primer: High-Performance Pandas Internals

## 1. Index Alignment Mechanics
Unlike NumPy arrays which align purely by integer position, Pandas `Series` and `DataFrame` align on **index and column labels** during any arithmetic or binary operation:

```python
s1 = pd.Series([10, 20, 30], index=['a', 'b', 'c'])
s2 = pd.Series([1, 2, 4], index=['b', 'c', 'd'])
s3 = s1 + s2
# Result index is union: ['a', 'b', 'c', 'd']
# Values: a: NaN, b: 21, c: 32, d: NaN
```

### The Cost of Alignment
Label alignment requires hashing or sorting indices to construct the union index. When performing millions of operations:
* If indices are already identical and monotonic, alignment is fast.
* If indices differ or have duplicate labels, alignment incurs substantial memory allocations and can trigger accidental $O(N \times M)$ Cartesian products.
* **Pro-tip**: When raw speed is needed and shapes match, drop to NumPy (`df['a'].to_numpy() + df['b'].to_numpy()`) to bypass index alignment overhead.

---

## 2. Categorical Dtypes: 90%+ RAM Reduction
By default, string columns in Pandas are stored as `object` dtype—an array of 64-bit pointers pointing to fragmented Python `PyUnicode` objects scattered across the heap.

```
Object Column (1,000,000 rows, 4 unique states: 'CA', 'NY', 'TX', 'FL'):
RAM: 1,000,000 pointers (8 MB) + 1,000,000 string objects (~50 MB) = ~58 MB
Cache misses: ~100% (pointers point to random heap addresses)

Categorical Column:
RAM: Categories array (4 strings: ~200 bytes) + Codes array (1,000,000 int8: 1 MB) = ~1 MB
Compression: ~98% reduction!
Cache misses: Minimal (1MB contiguous int8 array fits in L2/L3 CPU cache)
```

### Converting to Categorical:
```python
df['state'] = df['state'].astype('category')
```
* GroupBy operations on Categorical columns use direct integer indexing over codes (`int8`), running 10x-50x faster than string hashing.
* **Important**: Always use `observed=True` in modern Pandas groupby:
  `df.groupby('state', observed=True).mean()` to avoid generating combinations of unobserved categories.

---

## 3. GroupBy Execution DAG: Cython vs Python UDFs
Pandas `groupby` follows the **Split-Apply-Combine** pattern:

1. **Split**: Compute hash/code partitions for keys.
2. **Apply**: Execute transformation or reduction.
3. **Combine**: Concatenate partition outputs into result DataFrame.

### Fast Path (Cython C-Engine)
Native aggregations (`.sum()`, `.mean()`, `.std()`, `.min()`, `.max()`, `.prod()`, `.count()`, `.first()`, `.last()`, `.agg(['mean', 'std'])`) run in pre-compiled C/Cython loops with zero Python interpreter overhead.

### Slow Path (Python UDF `.apply()`)
```python
# SLOW (Spawns Python interpreter function call for EVERY group):
df.groupby('symbol').apply(lambda g: g['price'].mean())

# FAST (Cythonized aggregation directly on internal blocks):
df.groupby('symbol')['price'].mean()
```

### Vectorized Group Windowing: `.transform()`
To compute group-level statistics and broadcast them back to original row dimensions without merging:
```python
# Normalized price within each symbol
df['norm_price'] = df['price'] / df.groupby('symbol')['price'].transform('mean')
```

---

## 4. High-Frequency Resampling & Time-Series
Pandas `.resample()` provides high-performance bucketed aggregation over datetime indices:
* `df.set_index('timestamp').groupby('symbol').resample('1min').agg({'price': 'ohlc', 'volume': 'sum'})`
* **Log Returns**: $r_t = \ln\left(\frac{P_t}{P_{t-1}}\right) = \ln(P_t) - \ln(P_{t-1})$
* **Annualized Rolling Volatility**:
  $$\sigma = \text{RollingStd}(r_t, \text{window}=N) \times \sqrt{\text{Trading Periods Per Year}}$$
  For 1-minute bars during standard 6.5 hour US trading days:
  $$\text{Annual Factor} = \sqrt{252 \text{ days} \times 390 \text{ minutes/day}} = \sqrt{98,280} \approx 313.496$$
"""

WALKTHROUGH = r"""# Day 2 Walkthrough: Benchmarking Iterrows vs Apply vs Vectorization

```python
import pandas as pd
import numpy as np
import time

def benchmark_pandas_iteration():
    N = 100_000
    df = pd.DataFrame({
        'price': np.random.uniform(10.0, 100.0, size=N),
        'volume': np.random.randint(1, 1000, size=N),
        'category': np.random.choice(['Tech', 'Health', 'Finance', 'Energy'], size=N)
    })
    
    # 1. Slowest: iterrows()
    t0 = time.perf_counter()
    # sum(row['price'] * row['volume'] for _, row in df.iloc[:1000].iterrows())
    # (Only 1000 rows to prevent freezing)
    t_iter = (time.perf_counter() - t0) * 100  # estimated for 100k
    
    # 2. Medium: apply(lambda)
    t0 = time.perf_counter()
    res_apply = df.apply(lambda r: r['price'] * r['volume'], axis=1)
    t_apply = time.perf_counter() - t0
    
    # 3. Fastest: Vectorized Series multiplication
    t0 = time.perf_counter()
    res_vec = df['price'] * df['volume']
    t_vec = time.perf_counter() - t0
    
    print(f"Apply (axis=1): {t_apply*1000:.2f} ms")
    print(f"Vectorized:     {t_vec*1000:.2f} ms")
    print(f"Speedup:        {t_apply / t_vec:.1f}x faster than apply!")

def demonstrate_categorical_savings():
    N = 500_000
    cities = ['New York', 'San Francisco', 'London', 'Tokyo', 'Singapore']
    
    df_obj = pd.DataFrame({'city': np.random.choice(cities, size=N)})
    mem_obj = df_obj.memory_usage(deep=True)['city'] / (1024 * 1024)
    
    df_cat = df_obj.copy()
    df_cat['city'] = df_cat['city'].astype('category')
    mem_cat = df_cat.memory_usage(deep=True)['city'] / (1024 * 1024)
    
    print(f"Object Memory:      {mem_obj:.2f} MB")
    print(f"Categorical Memory: {mem_cat:.2f} MB")
    print(f"Memory Reduction:   {(1 - mem_cat/mem_obj)*100:.1f}%")
```
"""

# -----------------------------------------------------------------------------
# Challenge 1: Financial Time-Series Resampling & Rolling Volatility
# -----------------------------------------------------------------------------

CHALLENGE_1 = {
    "id": "day02_ch01_financial_resampling",
    "title": "High-Throughput Financial Resampling & Rolling Volatility",
    "difficulty": "Hard",
    "category": "Time-Series & Resampling",
    "description": (
        "Given high-frequency financial tick data with columns `['timestamp', 'symbol', 'price', 'volume']`, "
        "build a vectorized pipeline `resample_and_compute_metrics(df_ticks, freq='1min', rolling_window=20)` "
        "that generates complete OHLCV bars, computes log returns, calculates rolling annualized volatility, "
        "and evaluates Volume Weighted Average Price (VWAP) with ZERO `iterrows()` or Python loops."
    ),
    "instructions": (
        "1. Implement `resample_and_compute_metrics(df_ticks: pd.DataFrame, freq: str = '1min', rolling_window: int = 20) -> pd.DataFrame`.\n"
        "2. Parse `timestamp` as datetime, sort if necessary, and resample per `symbol` to frequency `freq`.\n"
        "3. Compute OHLCV columns:\n"
        "   - `open`: first price\n"
        "   - `high`: max price\n"
        "   - `low`: min price\n"
        "   - `close`: last price\n"
        "   - `volume`: sum of volume\n"
        "   - `vwap`: sum(price * volume) / sum(volume) per bar (if volume == 0, fallback to `close`).\n"
        "4. Calculate per-symbol log returns: $r_t = \\ln(\\text{close}_t / \\text{close}_{t-1})$.\n"
        "5. Calculate per-symbol rolling annualized volatility over `rolling_window` bars:\n"
        "   $$\\text{volatility} = \\text{rolling\\_std}(r_t, \\text{window}=\\text{rolling\\_window}, \\text{min\\_periods}=\\text{rolling\\_window}) \\times \\sqrt{252 \\times 390}$$\n"
        "6. Return DataFrame indexed by `(symbol, timestamp)` with columns: `['open', 'high', 'low', 'close', 'volume', 'vwap', 'log_return', 'volatility']`.\n"
        "7. Strict performance budget: Must process 100,000 ticks in < 150ms."
    ),
    "starter_code": r'''import pandas as pd
import numpy as np

def resample_and_compute_metrics(
    df_ticks: pd.DataFrame,
    freq: str = "1min",
    rolling_window: int = 20
) -> pd.DataFrame:
    """
    Resample tick data into OHLCV bars and compute financial indicators.
    
    Args:
        df_ticks: DataFrame with ['timestamp', 'symbol', 'price', 'volume']
        freq: Pandas offset string, e.g. '1min' or '5min'
        rolling_window: Number of periods for rolling volatility calculation
        
    Returns:
        DataFrame with MultiIndex (symbol, timestamp) and computed metric columns.
    """
    # TODO: Implement zero-loop financial resampling & rolling metrics
    pass
''',
    "reference_solution": r'''import pandas as pd
import numpy as np

def resample_and_compute_metrics(
    df_ticks: pd.DataFrame,
    freq: str = "1min",
    rolling_window: int = 20
) -> pd.DataFrame:
    """
    Vectorized OHLCV aggregation, VWAP, log returns, and rolling volatility.
    """
    df = df_ticks.copy()
    
    # 1. Vectorized datetime parsing and dollar volume computation
    if not pd.api.types.is_datetime64_any_dtype(df["timestamp"]):
        df["timestamp"] = pd.to_datetime(df["timestamp"])
        
    df["dollar_volume"] = df["price"] * df["volume"]
    
    # 2. Resample per symbol using groupby and resampler
    # Set timestamp as index for fast bucketed aggregation
    df = df.set_index("timestamp").sort_index()
    
    grouped = df.groupby("symbol", observed=True)
    
    def _resample_symbol(group):
        resampled = group.resample(freq)
        ohlc = resampled["price"].ohlc()
        vol = resampled["volume"].sum().rename("volume")
        dollar_vol = resampled["dollar_volume"].sum()
        
        # Calculate VWAP vectorized
        with np.errstate(divide="ignore", invalid="ignore"):
            vwap = np.where(vol > 0, dollar_vol / vol, ohlc["close"])
            
        bar_df = ohlc.copy()
        bar_df["volume"] = vol
        bar_df["vwap"] = vwap
        
        # Log returns: ln(close_t / close_{t-1})
        bar_df["log_return"] = np.log(bar_df["close"] / bar_df["close"].shift(1))
        
        # Annualized rolling volatility: factor for 1-minute bars in 252 trading days x 390 mins/day
        annual_factor = np.sqrt(252 * 390)
        rolling_std = bar_df["log_return"].rolling(window=rolling_window, min_periods=rolling_window).std(ddof=1)
        bar_df["volatility"] = rolling_std * annual_factor
        
        return bar_df

    result = grouped.apply(_resample_symbol, include_groups=False)
    
    # Ensure standard MultiIndex names: (symbol, timestamp)
    result.index.names = ["symbol", "timestamp"]
    return result
''',
    "test_suite": r'''import pandas as pd
import numpy as np
import time

def run_tests(candidate_func):
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # 1. Deterministic Known OHLCV Test
    timestamps = pd.date_range("2026-01-01 09:30:00", periods=6, freq="10s")
    ticks = pd.DataFrame({
        "timestamp": timestamps,
        "symbol": ["AAPL"] * 6,
        "price": [150.0, 152.0, 149.0, 151.0, 153.0, 150.5],
        "volume": [100, 200, 150, 50, 300, 100]
    })
    
    res = candidate_func(ticks, freq="1min", rolling_window=2)
    assert_test("AAPL" in res.index.get_level_values("symbol"), "Missing AAPL in index")
    aapl_bar = res.loc["AAPL"].iloc[0]
    
    assert_test(aapl_bar["open"] == 150.0, f"Expected open 150.0, got {aapl_bar['open']}")
    assert_test(aapl_bar["high"] == 153.0, f"Expected high 153.0, got {aapl_bar['high']}")
    assert_test(aapl_bar["low"] == 149.0, f"Expected low 149.0, got {aapl_bar['low']}")
    assert_test(aapl_bar["close"] == 150.5, f"Expected close 150.5, got {aapl_bar['close']}")
    assert_test(aapl_bar["volume"] == 900, f"Expected volume 900, got {aapl_bar['volume']}")
    
    expected_vwap = (150*100 + 152*200 + 149*150 + 151*50 + 153*300 + 150.5*100) / 900
    assert_test(np.isclose(aapl_bar["vwap"], expected_vwap, atol=1e-4), f"VWAP mismatch: {aapl_bar['vwap']} vs {expected_vwap}")

    # 2. Multi-Symbol & Rolling Volatility Check
    np.random.seed(42)
    N = 3000
    ts = pd.date_range("2026-01-01 09:30:00", periods=N, freq="1s")
    symbols = np.random.choice(["AAPL", "GOOG", "MSFT"], size=N)
    prices = 100.0 + np.cumsum(np.random.randn(N) * 0.1)
    volumes = np.random.randint(10, 500, size=N)
    
    df_multi = pd.DataFrame({
        "timestamp": ts,
        "symbol": symbols,
        "price": prices,
        "volume": volumes
    })
    
    t0 = time.perf_counter()
    res_multi = candidate_func(df_multi, freq="1min", rolling_window=5)
    elapsed = time.perf_counter() - t0
    
    assert_test(len(res_multi) > 0, "Empty result returned for multi-symbol")
    assert_test(elapsed < 0.5, f"Execution too slow: took {elapsed:.4f}s")
    assert_test("volatility" in res_multi.columns, "volatility column missing")
    assert_test("log_return" in res_multi.columns, "log_return column missing")
    
    # Check that first 4 bars have NaN volatility (due to min_periods=5)
    for sym in ["AAPL", "GOOG", "MSFT"]:
        sym_df = res_multi.loc[sym]
        if len(sym_df) >= 5:
            assert_test(pd.isna(sym_df["volatility"].iloc[0]), "First bar volatility must be NaN")
            assert_test(not pd.isna(sym_df["volatility"].iloc[4]), "5th bar volatility must be calculated")

    return report
''',
    "hints": [
        "Use `df.set_index('timestamp').groupby('symbol').resample(freq)` to aggregate bars per symbol.",
        "Compute `price.ohlc()` to extract Open, High, Low, Close in a single vectorized step.",
        "Calculate log returns with `np.log(close / close.shift(1))` and rolling std with `rolling(window, min_periods=window).std()` multiplied by `np.sqrt(252 * 390)`."
    ]
}

# -----------------------------------------------------------------------------
# Challenge 2: Multi-Table Relational Pipeline with Categorical Optimization
# -----------------------------------------------------------------------------

CHALLENGE_2 = {
    "id": "day02_ch02_categorical_pipeline",
    "title": "Optimized Multi-Table Pipeline & Customer Lifetime Value (CLV)",
    "difficulty": "Hard",
    "category": "Relational Joins & Memory Optimization",
    "description": (
        "Construct a high-throughput ETL & aggregation pipeline that ingests three tables "
        "(`transactions`, `customers`, `products`), converts repetitive text fields to `category` dtypes "
        "asserting >75% memory reduction, performs zero-copy categorical merges, and computes "
        "customer RFM metrics (Recency, Frequency, Monetary) alongside category preferences."
    ),
    "instructions": (
        "1. Implement `build_customer_analytics_pipeline(transactions: pd.DataFrame, customers: pd.DataFrame, products: pd.DataFrame) -> Dict[str, Any]`.\n"
        "2. Optimize memory: Automatically detect and convert object/string columns with repeated values (`region`, `tier`, `category`, `status`) to `category` dtype.\n"
        "3. Assert memory reduction on the `transactions` table is $\\ge 75\\%$.\n"
        "4. Merge `transactions` with `customers` on `customer_id` and `products` on `product_id`.\n"
        "5. Filter out cancelled transactions (`status == 'cancelled'`).\n"
        "6. Calculate per-customer analytics:\n"
        "   - `frequency`: Total count of valid transactions.\n"
        "   - `monetary_total`: Total spend (`quantity * unit_price`).\n"
        "   - `avg_order_value`: Mean spend per transaction.\n"
        "   - `favorite_category`: Product category with the highest total spend for that customer.\n"
        "7. Return dictionary with `{'analytics_df': df_result, 'memory_saved_pct': float, 'merged_rows': int}`."
    ),
    "starter_code": r'''import pandas as pd
import numpy as np
from typing import Dict, Any

def build_customer_analytics_pipeline(
    transactions: pd.DataFrame,
    customers: pd.DataFrame,
    products: pd.DataFrame
) -> Dict[str, Any]:
    """
    Execute categorical optimization and compute RFM / customer preference metrics.
    
    Returns:
        Dict containing 'analytics_df', 'memory_saved_pct', and 'merged_rows'.
    """
    # TODO: Implement categorical conversion & relational aggregation
    pass
''',
    "reference_solution": r'''import pandas as pd
import numpy as np
from typing import Dict, Any

def build_customer_analytics_pipeline(
    transactions: pd.DataFrame,
    customers: pd.DataFrame,
    products: pd.DataFrame
) -> Dict[str, Any]:
    # 1. Measure initial memory of transactions
    initial_mem = transactions.memory_usage(deep=True).sum()
    
    tx = transactions.copy()
    cust = customers.copy()
    prod = products.copy()
    
    # 2. Convert repetitive object columns to Categorical
    for col in tx.select_dtypes(include=["object"]).columns:
        tx[col] = tx[col].astype("category")
        
    for col in cust.select_dtypes(include=["object"]).columns:
        cust[col] = cust[col].astype("category")
        
    for col in prod.select_dtypes(include=["object"]).columns:
        prod[col] = prod[col].astype("category")
        
    optimized_mem = tx.memory_usage(deep=True).sum()
    memory_saved_pct = float((1.0 - optimized_mem / initial_mem) * 100.0)
    
    # 3. Filter valid transactions
    valid_tx = tx[tx["status"] != "cancelled"].copy()
    
    # 4. Merges
    merged = valid_tx.merge(prod, on="product_id", how="inner")
    merged = merged.merge(cust, on="customer_id", how="inner")
    
    merged["total_spend"] = merged["quantity"] * merged["unit_price"]
    
    # 5. Customer level aggregations
    # Compute frequency, monetary_total, avg_order_value
    cust_agg = merged.groupby("customer_id", observed=True).agg(
        frequency=("transaction_id", "count"),
        monetary_total=("total_spend", "sum"),
        avg_order_value=("total_spend", "mean")
    )
    
    # 6. Favorite category per customer (category with highest spend)
    cat_spend = (
        merged.groupby(["customer_id", "category"], observed=True)["total_spend"]
        .sum()
        .reset_index()
    )
    # Sort and take top category per customer
    favorite_cat = (
        cat_spend.sort_values(["customer_id", "total_spend"], ascending=[True, False])
        .drop_duplicates(subset=["customer_id"])
        .set_index("customer_id")["category"]
    )
    
    cust_agg["favorite_category"] = favorite_cat
    
    return {
        "analytics_df": cust_agg,
        "memory_saved_pct": memory_saved_pct,
        "merged_rows": len(merged)
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

    # 1. Synthetic dataset creation
    N = 20_000
    customer_ids = [f"CUST_{i:04d}" for i in range(100)]
    product_ids = [f"PROD_{i:03d}" for i in range(50)]
    categories = ["Electronics", "Apparel", "Home", "Books", "Beauty"]
    statuses = ["completed", "completed", "completed", "refunded", "cancelled"]
    
    tx_df = pd.DataFrame({
        "transaction_id": [f"TX_{i:06d}" for i in range(N)],
        "customer_id": np.random.choice(customer_ids, size=N),
        "product_id": np.random.choice(product_ids, size=N),
        "quantity": np.random.randint(1, 5, size=N),
        "status": np.random.choice(statuses, size=N)
    })
    
    cust_df = pd.DataFrame({
        "customer_id": customer_ids,
        "region": np.random.choice(["North", "South", "East", "West"], size=len(customer_ids)),
        "tier": np.random.choice(["Bronze", "Silver", "Gold", "Platinum"], size=len(customer_ids))
    })
    
    prod_df = pd.DataFrame({
        "product_id": product_ids,
        "category": np.random.choice(categories, size=len(product_ids)),
        "unit_price": np.random.uniform(10.0, 500.0, size=len(product_ids)).round(2)
    })
    
    result = candidate_func(tx_df, cust_df, prod_df)
    
    assert_test(isinstance(result, dict), "Result must be a dictionary")
    assert_test("analytics_df" in result, "Missing 'analytics_df' in result")
    assert_test("memory_saved_pct" in result, "Missing 'memory_saved_pct'")
    assert_test(result["memory_saved_pct"] >= 50.0, f"Expected significant memory reduction, got {result['memory_saved_pct']:.1f}%")
    
    analytics_df = result["analytics_df"]
    assert_test("frequency" in analytics_df.columns, "frequency column missing")
    assert_test("monetary_total" in analytics_df.columns, "monetary_total column missing")
    assert_test("avg_order_value" in analytics_df.columns, "avg_order_value column missing")
    assert_test("favorite_category" in analytics_df.columns, "favorite_category column missing")
    assert_test(len(analytics_df) <= len(customer_ids), "Customer count exceeds input count")

    return report
''',
    "hints": [
        "Identify object columns with `.select_dtypes(include=['object']).columns` and cast to `.astype('category')`.",
        "Filter `tx[tx['status'] != 'cancelled']` before merging to save join memory.",
        "For favorite category, group by `['customer_id', 'category']`, sum total spend, sort descending by spend, and call `.drop_duplicates(subset=['customer_id'])`."
    ]
}

CURRICULUM_DATA = {
    **DAY_METADATA,
    "concept_primer": CONCEPT_PRIMER,
    "walkthrough": WALKTHROUGH,
    "challenges": [CHALLENGE_1, CHALLENGE_2]
}

def get_curriculum() -> Dict[str, Any]:
    return CURRICULUM_DATA
