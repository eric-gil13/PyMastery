import type { DayTrack, Challenge, ConceptPrimerData, TestCase } from '../../types';

export type { DayTrack, Challenge, ConceptPrimerData, TestCase };

export const DAY06_TRACK: DayTrack = {
  partNumber: 6,
  partId: 6,
  dayNumber: 6,
  id: 6,
  title: 'Part 6: DateTime & Time Series Analysis',
  subtitle: 'Master timestamp parsing, the .dt accessor, rolling moving averages, and temporal resampling',
  description: 'Unlock the dimension of time in Pandas. Convert raw string timestamps to nanosecond datetime64 objects, extract calendar attributes with the .dt accessor, leverage DatetimeIndex for date slicing, calculate rolling moving averages and volatility to smooth noisy data, and resample high-frequency logs to executive monthly reports.',
  iconName: 'Clock',
  badge: 'Part 6 • Pandas Time Series',
  libraryMechanics: {
    libraryName: 'Pandas DateTime & Time Series Architecture',
    tagline: 'High-precision temporal indexing, rolling window mathematics, and frequency resampling.',
    overview: `### 🌟 Welcome to Part 6: Conquering the Dimension of Time
Almost every important dataset in modern business, science, and AI has a temporal component:
- **Financial Markets:** High-frequency trade ticks, price trends, daily returns, and rolling volatility.
- **E-Commerce & User Logs:** Peak purchasing hours, weekend cart abandonment, seasonal product demand.
- **IoT & Telemetry:** Sensor heartbeats, CPU utilization spikes, battery discharge degradation.

When you load data from a CSV or database, timestamps almost always arrive as plain strings (\`"2024-03-15 14:30:00"\`).
If left as strings:
- You cannot perform arithmetic (e.g. *"how many days until delivery?"*).
- You cannot extract calendar semantics (e.g. *"is this a Saturday or a Monday?"*).
- String sorting fails when formats vary (\`"3/4/2024"\` vs \`"12/1/2023"\`).

Pandas converts strings into high-precision **\`datetime64[ns]\`** objects, enabling vectorized calendar extraction, rolling mathematical windows, and lightning-fast temporal downsampling.`,
    whyItExists: `Standard Python provides the built-in \`datetime\` module, but doing date math on millions of individual \`datetime.datetime\` objects is prohibitively slow because each date is an independent Python object in memory.
Pandas builds directly on NumPy's vectorized datetime64 engine:
- **Vectorized C Representation:** Each timestamp is stored as a 64-bit integer representing nanoseconds since the Unix epoch (January 1, 1970).
- **The .dt Accessor:** Extract year, month, day name, and quarter across millions of rows without a single Python loop.
- **DatetimeIndex:** Promotes time to a primary index, unlocking natural language string slicing like \`df['2024-03']\`.
- **Cythonized Resampling & Rolling:** Calculate moving averages and monthly totals in compiled C loops.`,
    coreAnatomy: {
      objectName: 'DatetimeIndex & Rolling/Resample Buffer',
      description: 'A DatetimeIndex stores timestamps as a contiguous 64-bit integer array of nanoseconds, backed by frequency metadata (e.g. daily, monthly) and calendar offset rules.',
      fields: [
        {
          name: 'values',
          type: 'int64[ns]',
          role: 'Contiguous 64-bit integer array representing nanoseconds since 1970-01-01T00:00:00Z.'
        },
        {
          name: 'freq',
          type: 'BaseOffset | None',
          role: 'Optional regular frequency descriptor (e.g., "D" for daily, "ME" for month-end, "h" for hourly).'
        },
        {
          name: 'tz',
          type: 'tzinfo | None',
          role: 'Timezone localization metadata (e.g. "UTC", "America/New_York").'
        }
      ],
      memoryDiagramAscii: `+-------------------------------------------------------------------------------+
|                       Pandas Datetime Architecture                            |
|                                                                               |
|  String Column:    ["2024-01-01", "2024-01-02", "2024-01-03"]                 |
|                               |                                               |
|                    pd.to_datetime(df['date'])                                 |
|                               v                                               |
|  datetime64[ns]:   [1704067200000000000, 1704153600000000000, ...]            |
|                    (Contiguous 8-byte ints in RAM - Fast vectorized math)      |
|                                                                               |
|  Rolling Window (window=3):                                                   |
|  Day 1: [ 100 ] -------------> NaN (Window not yet full)                      |
|  Day 2: [ 100, 102 ] ---------> NaN (Window not yet full)                      |
|  Day 3: [ 100, 102, 104 ] ----> 102.0 (Mean of window)                        |
|  Day 4:      [ 102, 104, 106 ] > 104.0 (Window slides forward)                 |
+-------------------------------------------------------------------------------+`
    },
    chapters: [
      {
        id: 'ch1-dt-accessor',
        title: 'Parsing & The .dt Calendar Accessor',
        icon: 'Calendar',
        summary: 'Turn messy date strings into datetime64 objects and instantly extract year, month, and day names.',
        markdownContent: `### Parsing Strings into Time
Always convert date columns as early as possible using \`pd.to_datetime()\`:
\`\`\`python
df['date'] = pd.to_datetime(df['date'])
\`\`\`

### The Magical \`.dt\` Accessor
Just as strings have \`.str\`, datetime Series have \`.dt\`:
\`\`\`python
df['year']        = df['date'].dt.year        # 2024 (int)
df['month']       = df['date'].dt.month       # 1 to 12 (int)
df['day_name']    = df['date'].dt.day_name()  # 'Monday', 'Friday' (str)
df['day_of_week'] = df['date'].dt.dayofweek  # 0=Monday, 6=Sunday (int)
df['hour']        = df['date'].dt.hour        # 0 to 23 (int)
\`\`\``,
        codeSnippets: [
          {
            id: 'snip-dt-extract',
            title: 'Extracting calendar components from dates',
            code: `import pandas as pd

dates = pd.Series(['2024-01-01', '2024-02-14', '2024-07-04'])
ts = pd.to_datetime(dates)

print("Day names:", ts.dt.day_name().tolist())
print("Months:   ", ts.dt.month.tolist())`,
            expectedOutput: `Day names: ['Monday', 'Wednesday', 'Thursday']
Months:    [1, 2, 7]`,
            explanation: 'The .dt accessor computes calendar properties in compiled C speed across the entire column.'
          }
        ]
      },
      {
        id: 'ch2-rolling-and-resample',
        title: 'Rolling Windows vs Frequency Resampling',
        icon: 'TrendingUp',
        summary: 'Learn when to smooth trends with rolling moving averages vs when to aggregate with resample.',
        markdownContent: `### 1. Rolling Windows: Smoothing Trends Without Changing Row Count
A **rolling window** slides across your chronological data. If your input has 100 rows, your output still has 100 rows!
- Great for: Moving averages (\`df['close'].rolling(7).mean()\`), Bollinger bands, volatility.
- The first \`window - 1\` rows will naturally be \`NaN\` because there aren't enough prior days yet to fill the window.

### 2. Resampling: Changing Frequency (Downsampling)
Think of \`resample()\` as **\`groupby\` for dates**. It collapses multiple rows into periodic summary buckets!
- Great for: Taking 10,000 hourly sensor readings and converting them into 12 monthly totals.
- Modern Pandas standard frequency codes:
  - **\`'ME'\`**: Month End (use this in modern Pandas 2.2+ / 3.0 instead of deprecated \`'M'\`).
  - **\`'W'\`**: Weekly.
  - **\`'D'\`**: Daily.
  - **\`'h'\`**: Hourly.`,
        codeSnippets: [
          {
            id: 'snip-resample-demo',
            title: 'Resampling daily data to monthly totals',
            code: `import pandas as pd

dates = pd.date_range('2024-01-01', periods=60, freq='D')
df = pd.DataFrame({'sales': range(60)}, index=dates)

# Resample to month end
monthly = df.resample('ME').sum()
print(monthly)`,
            expectedOutput: `            sales
2024-01-31    465
2024-02-29   1305`,
            explanation: 'resample("ME").sum() aggregates daily rows into calendar month end buckets.'
          }
        ]
      }
    ],
    commonTraps: [
      {
        title: 'Using deprecated "M" instead of "ME" for month end',
        badSnippet: `df.resample('M').sum() # Raises ValueError in Pandas 3.0+`,
        badExplanation: 'In modern Pandas 2.2+ and 3.0, "M" is deprecated or removed. You must use "ME" (Month End).',
        goodSnippet: `df.resample('ME').sum()`,
        goodExplanation: '"ME" explicitly defines Month End frequency in modern Pandas.',
        perfImpact: 'Eliminates deprecation warnings and prevents crashes on modern runtime environments.'
      },
      {
        title: 'Computing rolling averages on unsorted data',
        badSnippet: `df['ma'] = df['close'].rolling(7).mean() # without sorting by date!`,
        badExplanation: 'If rows are out of chronological order, rolling windows average random past and future dates together!',
        goodSnippet: `df = df.sort_values('date').reset_index(drop=True)\ndf['ma'] = df['close'].rolling(7).mean()`,
        goodExplanation: 'Guarantees the rolling window only looks at true consecutive historical days.',
        perfImpact: 'Prevents corrupted financial metrics and lookahead bias.'
      }
    ],
    apiCheatSheet: [
      {
        name: 'pd.to_datetime',
        category: 'Parsing',
        signature: 'pd.to_datetime(arg, format=None, errors="raise")',
        summary: 'Convert argument to datetime64[ns].',
        parameters: [
          { name: 'arg', type: 'Series | list | str', desc: 'Object to convert.' },
          { name: 'format', type: 'str, optional', desc: 'Explicit strftime format string (e.g. "%Y-%m-%d").' }
        ],
        returns: 'DatetimeIndex or Series of Timestamp objects.',
        exampleSnippet: `df['date'] = pd.to_datetime(df['date'])`
      },
      {
        name: 'df.rolling',
        category: 'Windowing',
        signature: 'df.rolling(window, min_periods=None, center=False)',
        summary: 'Provide rolling window calculations.',
        parameters: [
          { name: 'window', type: 'int', desc: 'Size of moving window in number of observations.' },
          { name: 'min_periods', type: 'int, optional', desc: 'Minimum observations required to have a value.' }
        ],
        returns: 'Rolling window object ready for .mean(), .std(), etc.',
        exampleSnippet: `df['ma7'] = df['close'].rolling(7).mean()`
      },
      {
        name: 'df.resample',
        category: 'Resampling',
        signature: 'df.resample(rule, axis=0, closed=None, label=None)',
        summary: 'Resample time-series data using datetime index.',
        parameters: [
          { name: 'rule', type: 'str', desc: 'Frequency string (e.g. "ME" for month end, "D" for daily).' }
        ],
        returns: 'Resampler object ready for .sum(), .mean(), etc.',
        exampleSnippet: `monthly = df.resample('ME').sum()`
      }
    ],
    interactiveWidgetType: 'pandas-blockmanager'
  },
  challenges: [
    {
      id: 'pandas-p6-c1',
      dayId: 6,
      partId: 6,
      title: 'Stock Volatility & Moving Average Calculator',
      slug: 'stock-volatility-moving-average',
      difficulty: 'Intermediate',
      category: 'Time Series',
      summary: 'Process financial market data by converting dates, sorting chronologically, and computing returns, rolling moving averages, and volatility.',
      mentalModel5s: 'Sort chronologically, compute pct_change for returns, apply .rolling().mean() for moving averages, and extract calendar names with .dt.day_name().',
      visualAnalogy: 'Smoothing out the bumpy road of daily stock prices with a rolling paint roller, while tagging every day with its calendar day name.',
      pitfalls: [
        'Computing rolling metrics before sorting chronologically by date.',
        'Expecting the first day to have a daily return (it must be NaN because there is no prior day).',
        'Expecting rolling volatility at index 6 to be non-NaN (the first return is NaN, so 7 valid returns complete at index 7).'
      ],
      progressiveHints: [
        'Tier 1 (Dates): Convert date column using pd.to_datetime(df["date"]).',
        'Tier 2 (Sorting): Sort by date ascending using df.sort_values("date").reset_index(drop=True).',
        'Tier 3 (Returns & Moving Avgs): Use df["close"].pct_change() and df["close"].rolling(window).mean().',
        'Tier 4 (Volatility & Day): Use rolling std on daily_return, and df["date"].dt.day_name().'
      ],
      deepInternals: {
        title: 'Rolling Windows in C',
        content: 'Pandas rolling windows maintain a running sum and variance accumulator in Cython, avoiding re-summing all elements for each row. This achieves O(N) overall calculation time.',
        keyRule: 'Always ensure your DataFrame is sorted monotonically by timestamp before calculating rolling metrics.'
      },
      instructions: `In quantitative finance, analysts track asset momentum and risk using moving averages and rolling return volatility.

Write a function \`calculate_stock_metrics(stock_df: pd.DataFrame, short_window: int = 7, long_window: int = 30) -> pd.DataFrame\` that:
1. Makes a copy of \`stock_df\` and converts the \`'date'\` column to datetime using \`pd.to_datetime()\`.
2. Sorts the DataFrame chronologically by \`'date'\` ascending and resets the index (\`drop=True\`).
3. Computes and adds the following 5 columns:
   - \`'daily_return'\`: Percentage change of \`'close'\` compared to the prior day (\`pct_change()\`, first value will be NaN).
   - \`'ma_short'\`: Rolling moving average of \`'close'\` using window size \`short_window\`.
   - \`'ma_long'\`: Rolling moving average of \`'close'\` using window size \`long_window\`.
   - \`'rolling_volatility'\`: Rolling standard deviation (\`.std()\`) of \`'daily_return'\` using window size \`short_window\`.
   - \`'day_of_week'\`: Name of the day of the week as a string (e.g., \`'Monday'\`, \`'Friday'\`) via \`date.dt.day_name()\`.
4. Returns the enriched DataFrame containing all original columns plus the 5 new columns.`,
      hints: [
        'Use pd.to_datetime(df["date"]) to convert dates.',
        'Sort with df.sort_values("date", ascending=True).reset_index(drop=True).',
        'Use df["close"].pct_change() for percentage return.',
        'Use .rolling(window=short_window).mean() for moving averages, and .rolling().std() for volatility.',
        'Extract day names with df["date"].dt.day_name().'
      ],
      starterCode: `import pandas as pd
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
`,
      solutionCode: `import pandas as pd
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
`,
      testCases: [
        {
          id: 't1',
          name: 'Multi-Day Stock Timeline',
          inputDescription: '40 days of daily stock prices initially in shuffled order',
          expectedOutput: 'Sorted ascending by date, daily returns computed, 7d and 30d moving averages calculated'
        },
        {
          id: 't2',
          name: 'Calendar Attributes & Rolling Window Bounds',
          inputDescription: 'Verification of day_of_week string and initial NaNs in rolling window columns',
          expectedOutput: 'Monday/Friday correct, first (window-1) values of moving averages are NaN'
        }
      ],
      benchmarkTargetMs: 5.0,
      memoryTargetMb: 2.0,
      conceptPrimer: {
        title: 'Time Series Windows & Returns',
        subtitle: 'From daily price ticks to momentum and volatility signals',
        overview: 'Convert timestamps to datetime64, sort chronologically, and compute sliding window statistics to reveal trends and risk profiles.',
        mentalModel5s: 'Sort first, compute pct_change, slide rolling window forward.',
        visualAnalogy: 'Smoothing a jagged mountain outline into a gentle rolling hill.',
        pitfalls: [
          'Calculating rolling metrics on unsorted timestamps.',
          'Not expecting initial NaNs in rolling windows.'
        ],
        progressiveHints: [
          'Step 1: pd.to_datetime on date.',
          'Step 2: sort_values("date").reset_index(drop=True).',
          'Step 3: pct_change on close.',
          'Step 4: rolling(window).mean() and rolling(window).std().'
        ],
        mathFormulas: [
          {
            title: 'Percentage Daily Return',
            latex: 'R_t = \\frac{P_t - P_{t-1}}{P_{t-1}}',
            explanation: 'Relative price change between consecutive trading days.'
          },
          {
            title: 'Simple Moving Average (SMA)',
            latex: '\\text{SMA}_t = \\frac{1}{W} \\sum_{i=0}^{W-1} P_{t-i}',
            explanation: 'Mean price over the preceding W observation days.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Manual Python loop for moving average
ma = []
for i in range(len(df)):
    if i < 6:
        ma.append(None)
    else:
        ma.append(sum(df['close'].iloc[i-6:i+1]) / 7)`,
          naiveExplanation: 'Iterating over slices with Python loops is extremely slow and recomputes sums redundantly.',
          idiomaticCode: `# Vectorized rolling window in Cython
df['ma_7'] = df['close'].rolling(7).mean()`,
          idiomaticExplanation: 'Runs an O(N) rolling accumulator directly across contiguous float64 memory.',
          speedupText: '50x faster'
        },
        memoryLayout: {
          title: 'Fixed-Stride Datetime64 Buffer',
          content: 'Timestamps occupy 8 contiguous bytes each, allowing instant O(1) index lookups and cache-friendly window scans.',
          keyRule: 'Sorted timestamps guarantee cache locality during rolling window scans.'
        },
        keyTakeaways: [
          'Always sort chronologically before applying .rolling().',
          'The first window - 1 rows of a rolling calculation evaluate to NaN.',
          'Use .dt.day_name() for readable day labels.'
        ]
      }
    },
    {
      id: 'pandas-p6-c2',
      dayId: 6,
      partId: 6,
      title: 'Monthly Sales Resampler & Peak Detector',
      slug: 'monthly-sales-resampler',
      difficulty: 'Intermediate',
      category: 'Time Series',
      summary: 'Resample high-frequency transaction logs to monthly financial summaries and automatically identify peak sales months.',
      mentalModel5s: 'Promote timestamp to index, call .resample("ME").agg(...), and use idxmax() to identify the peak revenue month.',
      visualAnalogy: 'Pouring thousands of hourly coin drops into 12 monthly piggy banks, then crowning the piggy bank with the largest pile.',
      pitfalls: [
        'Using deprecated "M" instead of "ME" for month end in modern Pandas.',
        'Forgetting that resample requires a DatetimeIndex.',
        'Not converting the peak timestamp to a formatted "%Y-%m" string.'
      ],
      progressiveHints: [
        'Tier 1 (Index): Convert timestamp to datetime and set as index using df.set_index("timestamp").',
        'Tier 2 (Resampling): Use df.resample("ME").agg({"sales_amount": "sum", "transaction_count": "sum"}).',
        'Tier 3 (Metrics): Add avg_transaction_value = total_sales / total_transactions.',
        'Tier 4 (Peaks): Use idxmax() on total_sales and format with .strftime("%Y-%m").'
      ],
      deepInternals: {
        title: 'Temporal Binning in Resample',
        content: 'Resample bins timestamps into continuous calendar bins using interval arithmetic, emitting aligned month-end dates and computing reductions in compiled Cython.',
        keyRule: 'Resample requires a DatetimeIndex (or on="column_name") to group rows temporally.'
      },
      instructions: `E-commerce platforms log millions of raw hourly transactions. Your task is to downsample hourly records into monthly financial performance summaries and detect peak sales months.

Write a function \`resample_sales_and_detect_peaks(transactions_df: pd.DataFrame) -> dict\` that:
1. Makes a copy of \`transactions_df\`, converts \`'timestamp'\` to datetime, and sets \`'timestamp'\` as the DataFrame index.
2. Resamples the data to monthly frequency (\`'ME'\` for Month End, or \`'M'\`) and aggregates:
   - \`'total_sales'\`: sum of \`'sales_amount'\` (float, rounded to 2 decimal places).
   - \`'total_transactions'\`: sum of \`'transaction_count'\` (int).
3. Adds a column \`'avg_transaction_value'\` to the resampled DataFrame: \`'total_sales' / 'total_transactions'\` (float, rounded to 2 decimal places).
4. Identifies peak and lowest sales periods:
   - \`'peak_month'\`: The year-month string (\`'%Y-%m'\`, e.g., \`'2024-03'\`) corresponding to the month with the highest \`'total_sales'\`.
   - \`'peak_sales'\`: The maximum \`'total_sales'\` value (float, rounded to 2 decimal places).
   - \`'lowest_month'\`: The year-month string (\`'%Y-%m'\`, e.g., \`'2024-01'\`) corresponding to the month with the lowest \`'total_sales'\`.
5. Returns a dictionary:
   \`{"monthly_sales": monthly_sales, "peak_month": peak_month, "peak_sales": peak_sales, "lowest_month": lowest_month}\``,
      hints: [
        'Convert timestamp with pd.to_datetime(df["timestamp"]).',
        'Set timestamp as index using df.set_index("timestamp").',
        'Use df.resample("ME") for month-end resampling.',
        'Use idxmax() on "total_sales" to find the peak index, then .strftime("%Y-%m").'
      ],
      starterCode: `import pandas as pd
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
`,
      solutionCode: `import pandas as pd
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
`,
      testCases: [
        {
          id: 't1',
          name: 'Multi-Month Resampling & Peak Detection',
          inputDescription: 'Transactions spanning Jan, Feb, Mar, Apr with March having the highest revenue',
          expectedOutput: 'monthly_sales has 4 rows, peak_month is 2024-03, lowest_month is 2024-04'
        },
        {
          id: 't2',
          name: 'Average Transaction Value Calculation',
          inputDescription: 'Verification of total_sales / total_transactions metric rounding',
          expectedOutput: 'avg_transaction_value is accurate to 2 decimal places'
        }
      ],
      benchmarkTargetMs: 5.0,
      memoryTargetMb: 2.0,
      conceptPrimer: {
        title: 'Temporal Downsampling with Resample',
        subtitle: 'From continuous logs to periodic financial accounting',
        overview: 'Use resample("ME") on a DatetimeIndex to group records into calendar periods and compute financial KPIs.',
        mentalModel5s: 'Resample is groupby for time.',
        visualAnalogy: 'Grouping calendar days into monthly file folders.',
        pitfalls: [
          'Using resample without a DatetimeIndex.',
          'Using deprecated "M" offset.'
        ],
        progressiveHints: [
          'Step 1: Convert timestamp and set as index.',
          'Step 2: Resample with "ME".',
          'Step 3: Rename columns to total_sales and total_transactions.',
          'Step 4: Use idxmax() for peak month.'
        ],
        mathFormulas: [
          {
            title: 'Average Transaction Value',
            latex: '\\text{ATV}_m = \\frac{\\text{Total Sales}_m}{\\text{Total Transactions}_m}',
            explanation: 'Mean revenue generated per customer transaction in month m.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Manual Python month parsing and dictionary grouping
monthly_map = {}
for _, row in df.iterrows():
    m = row['timestamp'][:7]
    monthly_map[m] = monthly_map.get(m, 0) + row['sales_amount']`,
          naiveExplanation: 'Incurs heavy string parsing overhead and dictionary hashing in pure Python.',
          idiomaticCode: `# High performance C resampling
monthly = df.resample('ME')['sales_amount'].sum()`,
          idiomaticExplanation: 'Bins binary timestamps in C and executes vector reductions directly.',
          speedupText: '45x faster'
        },
        memoryLayout: {
          title: 'DatetimeIndex Bucketing',
          content: 'The resample engine calculates calendar period boundaries using integer division on nanoseconds, mapping rows to bin IDs in a single vectorized pass.',
          keyRule: 'Resample produces continuous periodic intervals even if some dates have zero events.'
        },
        keyTakeaways: [
          'Set the timestamp column as index before resampling.',
          'Use "ME" for month end in modern Pandas.',
          'idxmax() and idxmin() return the timestamp index of the extreme values.'
        ]
      }
    }
  ]
};

export const PANDAS_PART06_TRACK = DAY06_TRACK;
export const testCases = [...DAY06_TRACK.challenges[0].testCases, ...DAY06_TRACK.challenges[1].testCases];
export default DAY06_TRACK;
