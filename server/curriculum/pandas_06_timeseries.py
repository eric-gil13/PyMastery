"""
Part 6: DateTime & Time Series Analysis
PyMastery Progressive Pandas Curriculum
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List

DAY_METADATA = {
    "day_id": "pandas_day06",
    "day_number": 6,
    "title": "Part 6: DateTime & Time Series Analysis",
    "tagline": "Unlock the dimension of time: parse timestamps, extract calendar components, compute rolling moving averages, and resample frequencies.",
    "estimated_time": "2-3 hours",
    "concepts_covered": [
        "Parsing timestamps with pd.to_datetime (ISO formats, error handling)",
        "Extracting calendar components using the .dt accessor (.dt.year, .dt.month, .dt.day_name())",
        "Setting and sorting by a DatetimeIndex for fast temporal slicing",
        "Rolling window calculations (.rolling().mean(), .rolling().std())",
        "Computing percentage changes (.pct_change()) for financial returns",
        "Frequency conversion and downsampling with .resample('ME', 'D', 'h')",
        "Detecting historical peaks, troughs, and seasonal anomalies"
    ]
}

CONCEPT_PRIMER = r"""# Part 6 Concept Primer: DateTime & Time Series Analysis

## 1. Why Time Series Requires Special Handling
Time is omnipresent in data science:
- **Finance:** Stock ticks, crypto trades, portfolio volatility.
- **E-Commerce & Retail:** Hourly sales surges, black Friday traffic, weekend seasonality.
- **IoT & Infrastructure:** CPU loads, temperature readings, battery discharge curves.

When you load data from a CSV, dates usually arrive as standard strings: `"2024-03-15 14:30:00"`.
If you leave them as strings:
- You cannot easily answer: *"What day of the week was this?"*
- You cannot calculate: *"How many days passed between order and delivery?"*
- String sorting fails when date formats vary (`"3/4/2024"` vs `"12/1/2023"`).

Pandas transforms messy strings into high-precision, nanosecond-resolution **`datetime64[ns]`** objects.

---

## 2. Converting Strings to Dates: `pd.to_datetime`

```python
# Convert an entire Series of date strings in one vectorized call
df['timestamp'] = pd.to_datetime(df['timestamp'])
```

### The `.dt` Accessor: Instant Calendar Extraction
Just like `.str` allows string operations in Pandas, `.dt` unlocks temporal properties:

```python
df['year']        = df['timestamp'].dt.year          # 2024 (int)
df['month']       = df['timestamp'].dt.month         # 3 (1-12)
df['day_name']    = df['timestamp'].dt.day_name()    # 'Friday' (str)
df['day_of_week'] = df['timestamp'].dt.dayofweek    # 4 (0=Mon, 6=Sun)
df['hour']        = df['timestamp'].dt.hour          # 14 (0-23)
```

---

## 3. The DatetimeIndex: Supercharged Temporal Slicing

When you promote a datetime column to be the DataFrame index, Pandas unlocks natural language time slicing:

```python
df = df.set_index('timestamp').sort_index()

# Slice an entire month with a simple string:
march_sales = df['2024-03']

# Slice a date range effortlessly:
q1_data = df['2024-01':'2024-03']
```

---

## 4. Rolling Window Calculations: Smoothing Noise

Real-world metrics fluctuate wildly from day to day (e.g., lower sales on Mondays, huge spikes on Saturdays).
To uncover underlying trends, analysts use **Rolling Moving Averages (RMA)**:

```
Window Size = 3:
Day:      [ Mon   Tue   Wed ]  Thu   Fri
Sales:    [ 100   120   110 ]  150   140
Avg:             110.0

Slide Window Forward:
Day:        Mon [ Tue   Wed   Thu ]  Fri
Sales:      100 [ 120   110   150 ]  140
Avg:                   126.7
```

In Pandas:
```python
# 7-day rolling moving average of closing price
df['ma_7'] = df['close'].rolling(window=7).mean()

# Rolling standard deviation (volatility)
df['volatility_7'] = df['daily_return'].rolling(window=7).std()
```

> **Note on Initial NaNs:** The first `window - 1` rows will be `NaN` because there aren't enough prior data points to fill the window. You can control this with `min_periods=1`.

---

## 5. Resampling: Changing Time Frequency

What if you have **hourly** telemetry or sales data, but management wants a **monthly** financial report?
That is where **`resample()`** shines!

Think of `resample()` as a `groupby` specifically engineered for time:
- `'ME'` (Month End - formerly `'M'` in older Pandas): Group into monthly buckets.
- `'W'` (Weekly): Group into 7-day chunks.
- `'D'` (Daily): Downsample high-frequency ticks to 1 row per day.
- `'h'` (Hourly): Group minute-by-minute logs into hourly summaries.

```python
# Group hourly transactions by Month End ('ME') and aggregate totals
monthly_summary = df.resample('ME').agg({
    'sales_amount': 'sum',
    'transaction_count': 'sum'
})
```
"""

WALKTHROUGH = r"""# Part 6 Code Walkthrough: DateTime & Time Series in Action

Let's walk through temporal parsing, rolling calculations, and frequency resampling:

```python
import pandas as pd
import numpy as np

# 1. Create a sample daily stock price table with string dates
raw_data = {
    'date': ['2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05', '2024-01-08'],
    'close': [100.0, 102.5, 101.0, 105.0, 108.0],
    'volume': [12000, 15000, 11000, 18000, 22000]
}
stock_df = pd.DataFrame(raw_data)

# 2. Convert date string to datetime64[ns]
stock_df['date'] = pd.to_datetime(stock_df['date'])
print("Converted dtypes:\n", stock_df.dtypes)

# 3. Extract calendar attributes
stock_df['day_name'] = stock_df['date'].dt.day_name()
print("\n--- Calendar Components ---")
print(stock_df[['date', 'day_name', 'close']])

# 4. Compute daily percentage returns
stock_df['daily_return'] = stock_df['close'].pct_change()
print("\n--- Daily Returns ---")
print(stock_df[['close', 'daily_return']])

# 5. Compute rolling moving average (window=3)
stock_df['ma_3'] = stock_df['close'].rolling(window=3).mean()
print("\n--- 3-Day Moving Average ---")
print(stock_df[['close', 'ma_3']])

# 6. Resampling to weekly frequency
stock_df_indexed = stock_df.set_index('date')
weekly = stock_df_indexed.resample('W').agg({'close': 'last', 'volume': 'sum'})
print("\n--- Weekly Resampled Summary ---")
print(weekly)
```
"""

# -----------------------------------------------------------------------------
# Challenge 1: Stock Volatility & Moving Average Calculator (pandas-p6-c1)
# -----------------------------------------------------------------------------

CHALLENGE_1 = {
    "id": "pandas-p6-c1",
    "title": "Stock Volatility & Moving Average Calculator",
    "difficulty": "Intermediate",
    "category": "Time Series",
    "description": (
        "Process financial market data by converting dates, sorting chronologically, and computing percentage returns. "
        "Calculate short-term (7-day) and long-term (30-day) rolling moving averages and rolling volatility metrics."
    ),
    "instructions": (
        "Write a function `calculate_stock_metrics(stock_df: pd.DataFrame, short_window: int = 7, long_window: int = 30) -> pd.DataFrame` that:\n"
        "1. Makes a copy of `stock_df` and parses the `'date'` column into proper datetime timestamps.\n"
        "2. Sorts the records chronologically by `'date'` in ascending order and resets the row index.\n"
        "3. Computes and adds the following 5 columns:\n"
        "   - `'daily_return'`: Percentage return of `'close'` compared to the previous trading day (the initial entry will be missing/NaN).\n"
        "   - `'ma_short'`: Rolling moving average of `'close'` using window size `short_window`.\n"
        "   - `'ma_long'`: Rolling moving average of `'close'` using window size `long_window`.\n"
        "   - `'rolling_volatility'`: Rolling standard deviation of `'daily_return'` using window size `short_window`.\n"
        "   - `'day_of_week'`: Name of the day of the week as a string (e.g., `'Monday'`, `'Friday'`) extracted from the date.\n"
        "4. Returns the enriched DataFrame containing all original columns plus the 5 new columns."
    ),
    "starter_code": r'''import pandas as pd
import numpy as np

def calculate_stock_metrics(stock_df: pd.DataFrame, short_window: int = 7, long_window: int = 30) -> pd.DataFrame:
    """
    Calculate financial indicators: returns, moving averages, and rolling volatility.

    Args:
        stock_df: DataFrame with ['date', 'ticker', 'close', 'volume']
        short_window: Size of short rolling window (default 7)
        long_window: Size of long rolling window (default 30)

    Returns:
        Enriched DataFrame with daily_return, ma_short, ma_long, rolling_volatility, day_of_week
    """
    # TODO: Convert date, sort chronologically, compute rolling indicators and calendar features
    pass
''',
    "reference_solution": r'''import pandas as pd
import numpy as np

def calculate_stock_metrics(stock_df: pd.DataFrame, short_window: int = 7, long_window: int = 30) -> pd.DataFrame:
    df = stock_df.copy()
    # 1. Convert date to datetime
    df["date"] = pd.to_datetime(df["date"])

    # 2. Sort chronologically and reset index
    df = df.sort_values("date", ascending=True).reset_index(drop=True)

    # 3. Calculate financial metrics
    df["daily_return"] = df["close"].pct_change()
    df["ma_short"] = df["close"].rolling(window=short_window).mean()
    df["ma_long"] = df["close"].rolling(window=long_window).mean()
    df["rolling_volatility"] = df["daily_return"].rolling(window=short_window).std()
    df["day_of_week"] = df["date"].dt.day_name()

    return df
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

    # Generate synthetic 40-day stock data (unsorted initially)
    dates = pd.date_range("2024-01-01", periods=40, freq="D").strftime("%Y-%m-%d").tolist()
    # Shuffle order to ensure candidate sorts properly
    shuffled_indices = list(range(len(dates)))
    shuffled_indices.reverse()
    
    shuffled_dates = [dates[i] for i in shuffled_indices]
    base_price = 100.0
    prices = [base_price + i * 1.5 for i in range(40)]
    shuffled_prices = [prices[i] for i in shuffled_indices]

    test_df = pd.DataFrame({
        "date": shuffled_dates,
        "ticker": ["AAPL"] * 40,
        "close": shuffled_prices,
        "volume": [10000 + i * 100 for i in range(40)]
    })

    result = candidate_func(test_df, short_window=7, long_window=30)
    assert_test(isinstance(result, pd.DataFrame), "Output must be a pandas DataFrame")

    # Test 1: Date column is datetime and sorted
    assert_test(pd.api.types.is_datetime64_any_dtype(result["date"]), "date column must be converted to datetime64")
    assert_test(result["date"].is_monotonic_increasing, "DataFrame must be sorted chronologically ascending by date")

    # Test 2: Check expected columns
    expected_cols = ["date", "ticker", "close", "volume", "daily_return", "ma_short", "ma_long", "rolling_volatility", "day_of_week"]
    for col in expected_cols:
        assert_test(col in result.columns, f"Missing required column: {col}")

    # Test 3: Daily return verification
    assert_test(pd.isna(result["daily_return"].iloc[0]), "First daily_return value must be NaN")
    # Day 1 price = 100.0, Day 2 price = 101.5 -> return = 1.5 / 100.0 = 0.015
    expected_ret_1 = (101.5 - 100.0) / 100.0
    assert_test(np.isclose(result["daily_return"].iloc[1], expected_ret_1), f"Expected daily return {expected_ret_1}, got {result['daily_return'].iloc[1]}")

    # Test 4: Moving averages verification
    # For window=7, first 6 values of ma_short should be NaN, 7th (idx 6) should be mean of first 7 prices
    assert_test(result["ma_short"].iloc[:6].isna().all(), "First (short_window - 1) rows of ma_short must be NaN")
    expected_ma7_idx6 = np.mean(prices[:7])
    assert_test(np.isclose(result["ma_short"].iloc[6], expected_ma7_idx6), f"ma_short at index 6 expected {expected_ma7_idx6}, got {result['ma_short'].iloc[6]}")

    # For window=30, first 29 values of ma_long should be NaN, 30th (idx 29) should be mean of first 30 prices
    assert_test(result["ma_long"].iloc[:29].isna().all(), "First (long_window - 1) rows of ma_long must be NaN")
    expected_ma30_idx29 = np.mean(prices[:30])
    assert_test(np.isclose(result["ma_long"].iloc[29], expected_ma30_idx29), f"ma_long at index 29 expected {expected_ma30_idx29}, got {result['ma_long'].iloc[29]}")

    # Test 5: Day of week verification
    # 2024-01-01 was a Monday
    assert_test(result["day_of_week"].iloc[0] == "Monday", f"2024-01-01 should be 'Monday', got {result['day_of_week'].iloc[0]}")
    # 2024-01-07 was a Sunday
    assert_test(result["day_of_week"].iloc[6] == "Sunday", f"2024-01-07 should be 'Sunday', got {result['day_of_week'].iloc[6]}")

    # Test 6: Rolling volatility is standard deviation of daily_return
    # Note: Because daily_return at index 0 is NaN, the first 7 rows (0..6) of rolling_volatility will be NaN.
    # The first valid 7-window standard deviation is at index 7.
    assert_test(result["rolling_volatility"].iloc[:7].isna().all(), "First 7 rows of rolling_volatility must be NaN")
    vol_7 = result["rolling_volatility"].iloc[7]
    expected_vol = np.std(result["daily_return"].iloc[1:8].values, ddof=1) # pandas uses ddof=1
    assert_test(np.isclose(vol_7, expected_vol), f"rolling_volatility at index 7 expected {expected_vol}, got {vol_7}")

    return report
''',
    "hints": [
        "Use pd.to_datetime(df['date']) to convert date strings.",
        "Sort with df.sort_values('date', ascending=True).reset_index(drop=True).",
        "Use df['close'].pct_change() for percentage return.",
        "Use .rolling(window=short_window).mean() for moving averages, and .rolling().std() for volatility.",
        "Extract day names with df['date'].dt.day_name()."
    ]
}

# -----------------------------------------------------------------------------
# Challenge 2: Monthly Sales Resampler & Peak Detector (pandas-p6-c2)
# -----------------------------------------------------------------------------

CHALLENGE_2 = {
    "id": "pandas-p6-c2",
    "title": "Monthly Sales Resampler & Peak Detector",
    "difficulty": "Intermediate",
    "category": "Time Series",
    "description": (
        "Aggregate high-frequency transaction logs to monthly financial summaries using Pandas resampling. "
        "Calculate total revenue, transaction counts, average order values, and automatically identify the historical peak sales month."
    ),
    "instructions": (
        "Write a function `resample_sales_and_detect_peaks(transactions_df: pd.DataFrame) -> dict` that:\n"
        "1. Makes a copy of `transactions_df`, parses `'timestamp'` into datetime objects, and promotes `'timestamp'` to be the DataFrame index.\n"
        "2. Resamples transactions into monthly intervals (month-end) and aggregates metrics:\n"
        "   - `'total_sales'`: total sum of sales amount across the month (float, rounded to 2 decimal places).\n"
        "   - `'total_transactions'`: total sum of transaction counts across the month (int).\n"
        "3. Adds a column `'avg_transaction_value'` to the resampled DataFrame, calculated as `'total_sales'` divided by `'total_transactions'`, rounded to 2 decimal places.\n"
        "4. Identifies peak and lowest sales periods:\n"
        "   - `'peak_month'`: The year-month string in `YYYY-MM` format (e.g., `'2024-03'`) corresponding to the month with the highest `'total_sales'`.\n"
        "   - `'peak_sales'`: The maximum `'total_sales'` value (float, rounded to 2 decimal places).\n"
        "   - `'lowest_month'`: The year-month string in `YYYY-MM` format (e.g., `'2024-01'`) corresponding to the month with the lowest `'total_sales'`.\n"
        "5. Returns a dictionary:\n"
        "   `{\"monthly_sales\": monthly_sales, \"peak_month\": peak_month, \"peak_sales\": peak_sales, \"lowest_month\": lowest_month}`"
    ),
    "starter_code": r'''import pandas as pd
import numpy as np

def resample_sales_and_detect_peaks(transactions_df: pd.DataFrame) -> dict:
    """
    Resample high-frequency transactions to monthly totals and find peak sales month.

    Args:
        transactions_df: DataFrame with ['timestamp', 'store_id', 'sales_amount', 'transaction_count']

    Returns:
        dict with 'monthly_sales', 'peak_month', 'peak_sales', 'lowest_month'
    """
    # TODO: Convert timestamp, set as index, resample monthly, and detect peaks
    pass
''',
    "reference_solution": r'''import pandas as pd
import numpy as np

def resample_sales_and_detect_peaks(transactions_df: pd.DataFrame) -> dict:
    df = transactions_df.copy()
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.set_index("timestamp").sort_index()

    # Resample to month end ('ME' in modern pandas 2.2+, fallback to 'M')
    try:
        monthly = df.resample("ME").agg({
            "sales_amount": "sum",
            "transaction_count": "sum"
        })
    except (ValueError, KeyError):
        monthly = df.resample("M").agg({
            "sales_amount": "sum",
            "transaction_count": "sum"
        })

    monthly.rename(columns={
        "sales_amount": "total_sales",
        "transaction_count": "total_transactions"
    }, inplace=True)

    monthly["total_sales"] = monthly["total_sales"].round(2)
    monthly["avg_transaction_value"] = (monthly["total_sales"] / monthly["total_transactions"]).round(2)

    # Detect peaks and lowest month
    peak_idx = monthly["total_sales"].idxmax()
    lowest_idx = monthly["total_sales"].idxmin()

    peak_month = peak_idx.strftime("%Y-%m")
    lowest_month = lowest_idx.strftime("%Y-%m")
    peak_sales = round(float(monthly.loc[peak_idx, "total_sales"]), 2)

    return {
        "monthly_sales": monthly,
        "peak_month": peak_month,
        "peak_sales": peak_sales,
        "lowest_month": lowest_month,
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

    # Multi-month transaction dataset (Jan, Feb, Mar, Apr 2024)
    data = {
        "timestamp": [
            "2024-01-10 09:30:00", "2024-01-25 14:15:00",
            "2024-02-05 11:00:00", "2024-02-14 16:45:00", "2024-02-28 18:20:00",
            "2024-03-02 10:00:00", "2024-03-15 12:30:00", "2024-03-22 15:00:00", "2024-03-30 20:00:00",
            "2024-04-12 13:00:00"
        ],
        "store_id": ["S1", "S2", "S1", "S2", "S1", "S1", "S2", "S1", "S2", "S1"],
        "sales_amount": [
            120.50, 80.00,    # Jan total = 200.50, tx = 4
            300.00, 450.00, 250.00, # Feb total = 1000.00, tx = 20
            600.00, 850.00, 400.00, 950.00, # Mar total = 2800.00 (Peak), tx = 50
            150.00            # Apr total = 150.00 (Lowest), tx = 3
        ],
        "transaction_count": [
            2, 2,             # Jan = 4
            6, 9, 5,          # Feb = 20
            10, 15, 8, 17,    # Mar = 50
            3                 # Apr = 3
        ]
    }
    tx_df = pd.DataFrame(data)

    res = candidate_func(tx_df)
    assert_test(isinstance(res, dict), "Result must be a Python dictionary")
    for k in ["monthly_sales", "peak_month", "peak_sales", "lowest_month"]:
        assert_test(k in res, f"Result dictionary missing key '{k}'")

    monthly = res["monthly_sales"]
    assert_test(isinstance(monthly, pd.DataFrame), "monthly_sales must be a pandas DataFrame")
    assert_test(len(monthly) == 4, f"monthly_sales should have 4 rows (Jan-Apr), got {len(monthly)}")

    # Check columns in monthly
    for col in ["total_sales", "total_transactions", "avg_transaction_value"]:
        assert_test(col in monthly.columns, f"monthly_sales missing column '{col}'")

    # Test peak and lowest month detection
    assert_test(res["peak_month"] == "2024-03", f"peak_month expected '2024-03', got '{res['peak_month']}'")
    assert_test(np.isclose(res["peak_sales"], 2800.00), f"peak_sales expected 2800.00, got {res['peak_sales']}")
    assert_test(res["lowest_month"] == "2024-04", f"lowest_month expected '2024-04', got '{res['lowest_month']}'")

    # Test monthly calculated metrics
    # March avg_transaction_value = 2800.00 / 50 = 56.0
    mar_row = monthly[monthly.index.strftime("%Y-%m") == "2024-03"].iloc[0]
    assert_test(np.isclose(mar_row["total_sales"], 2800.00), f"March total_sales mismatch")
    assert_test(mar_row["total_transactions"] == 50, f"March total_transactions mismatch")
    assert_test(np.isclose(mar_row["avg_transaction_value"], 56.00), f"March avg_transaction_value expected 56.00, got {mar_row['avg_transaction_value']}")

    # January avg_transaction_value = 200.50 / 4 = 50.125 -> 50.12 or 50.13
    jan_row = monthly[monthly.index.strftime("%Y-%m") == "2024-01"].iloc[0]
    assert_test(np.isclose(jan_row["total_sales"], 200.50), f"January total_sales mismatch")
    assert_test(jan_row["total_transactions"] == 4, f"January total_transactions mismatch")

    return report
''',
    "hints": [
        "Convert timestamp with pd.to_datetime(df['timestamp']).",
        "Set timestamp as index using df.set_index('timestamp').",
        "Use df.resample('ME') for month-end resampling (or 'M' in older pandas).",
        "Use idxmax() on 'total_sales' to find the index of the peak month, then .strftime('%Y-%m') to format."
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
