"""
Part 2: Essential Chart Types (Scatter, Bar & Histogram)
PyMastery Progressive Matplotlib Curriculum
"""

import matplotlib
matplotlib.use("Agg")  # Non-interactive headless backend for server execution
import matplotlib.pyplot as plt
import numpy as np
import io
from typing import Dict, Any, List, Tuple, Optional, Union

DAY_METADATA = {
    "day_id": "mpl_part02",
    "part_number": 2,
    "day_number": 2,
    "title": "Part 2: Essential Chart Types",
    "tagline": "Master scatter plots for correlation, bar charts for categories, and histograms for distributions.",
    "estimated_time": "1-2 hours",
    "concepts_covered": [
        "Choosing visual encodings: correlation vs discrete counts vs continuous distributions",
        "Scatter plots with ax.scatter(): sizes (s), colormaps (cmap), and colorbars",
        "Categorical bar charts with ax.bar() and ax.barh()",
        "Frequency and probability density histograms with ax.hist()",
        "Fitting and overlaying analytical normal density curves"
    ]
}

CONCEPT_PRIMER = r"""# Part 2 Concept Primer: Essential Chart Types

## 1. Choosing the Right Visual Representation
Data visualization in data science and machine learning boils down to three primary data relationships:

1. **Correlation & Continuous Relationships:** *Scatter Plots* (`ax.scatter`)
   - Visualizing two continuous variables $(X, Y)$ to reveal clusters, non-linear relationships, or outliers.
   - Encodings: point position $(x, y)$, color value ($c$), size ($s$), and opacity ($\alpha$).
2. **Discrete Categories & Comparisons:** *Bar Charts* (`ax.bar` / `ax.barh`)
   - Comparing quantities across distinct categories, model types, or classes.
   - Vertical vs horizontal orientations, bar widths, and error margins.
3. **Empirical Distributions & Densities:** *Histograms* (`ax.hist`)
   - Visualizing probability densities, frequency counts, skewness, and multi-modal distributions.
   - Normalizing by total area (`density=True`) to enable direct comparison with theoretical probability densities.

---

## 2. Scatter Plots with Color Mapping
While `ax.plot(x, y, 'o')` draws points, `ax.scatter()` treats each point as an independent element in a `PathCollection`:
```python
scatter = ax.scatter(x, y, c=target, cmap="viridis", s=60, alpha=0.75, edgecolors="none")
cbar = fig.colorbar(scatter, ax=ax)
cbar.set_label("Target Value")
```
* **`c`**: Array of numerical values mapped through a colormap (e.g. `'viridis'`, `'plasma'`, `'coolwarm'`).
* **`s`**: Marker size in points squared (can be a scalar or per-point array).
* **`alpha`**: Transparency in [0, 1], crucial for resolving overplotting in dense datasets.

---

## 3. Categorical Bar Charts
Use `ax.bar(categories, values)` to compare distinct buckets:
```python
categories = ["SVM", "Random Forest", "GBDT", "Transformer"]
f1_scores = [0.81, 0.88, 0.93, 0.96]

bars = ax.bar(categories, f1_scores, color="#4f46e5", width=0.6, edgecolor="black")
ax.set_ylabel("F1-Score")
ax.set_ylim(0.0, 1.0)
```

---

## 4. Histograms & Analytical Density Curves
When analyzing feature distributions or prediction residuals, normalizing empirical data by area (`density=True`) allows overlaying theoretical distributions (such as a Gaussian fit):

$$f(x) = \frac{1}{\sigma \sqrt{2\pi}} \exp\left(-\frac{(x - \mu)^2}{2\sigma^2}\right)$$

```python
# Empirical histogram
n, bins, patches = ax.hist(data, bins=30, density=True, color="#93c5fd", edgecolor="white", alpha=0.7)

# Theoretical overlay
x_axis = np.linspace(data.min(), data.max(), 200)
pdf = (1.0 / (sigma * np.sqrt(2 * np.pi))) * np.exp(-0.5 * ((x_axis - mu) / sigma) ** 2)
ax.plot(x_axis, pdf, color="#dc2626", linewidth=2, label="Gaussian Fit")
```
"""

WALKTHROUGH = r"""# Part 2 Code Walkthrough: Multi-Type Data Exploration

Here is how you combine a feature correlation scatter plot and a category distribution bar chart in a single cohesive figure:

```python
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

# 1. Generate synthetic feature data
np.random.seed(42)
N = 150
feat_x = np.random.normal(50, 15, N)
feat_y = 2.5 * feat_x + np.random.normal(0, 20, N)
cats = np.random.choice(["Tier A", "Tier B", "Tier C"], size=N)

# 2. Build 1x2 panel layout
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))

# 3. Left Panel: Scatter plot with viridis colormap
sc = ax1.scatter(feat_x, feat_y, c=feat_y, cmap="viridis", alpha=0.7, s=40)
cbar = fig.colorbar(sc, ax=ax1)
cbar.set_label("Feature Y Scale")
ax1.set_title("Feature X vs Y Correlation", fontweight="bold")
ax1.set_xlabel("Feature X (Input)")
ax1.set_ylabel("Feature Y (Output)")
ax1.grid(True, linestyle=":", alpha=0.5)

# 4. Right Panel: Categorical frequency bar chart
unique_cats, counts = np.unique(cats, return_counts=True)
ax2.bar(unique_cats, counts, color="#059669", edgecolor="#064e3b", alpha=0.85, width=0.55)
ax2.set_title("Samples Per Category Tier", fontweight="bold")
ax2.set_xlabel("Category Tier")
ax2.set_ylabel("Frequency Count")
ax2.grid(axis="y", linestyle=":", alpha=0.5)

# 5. Clean layout
fig.tight_layout()
```
"""

# -----------------------------------------------------------------------------
# Challenge 1: Feature Correlation Scatter & Bar Chart
# -----------------------------------------------------------------------------

CHALLENGE_1 = {
    "id": "mpl-p2-c1",
    "title": "Feature Correlation Scatter & Bar Chart",
    "difficulty": "Intermediate",
    "category": "Essential Chart Types",
    "description": (
        "Create a 1x2 side-by-side visualization panel. The left subplot displays a scatter plot "
        "of two continuous features with optional color mapping and a colorbar. The right subplot "
        "displays a bar chart showing the frequency distribution of categorical labels."
    ),
    "instructions": (
        "Write a function `plot_scatter_and_bar(x: np.ndarray, y: np.ndarray, categories: list, color_values: Optional[np.ndarray] = None) -> tuple[plt.Figure, tuple[plt.Axes, plt.Axes]]` that:\n"
        "1. Validates inputs:\n"
        "   - If `len(x) == 0`, `len(y) == 0`, or `len(categories) == 0`, raise `ValueError(\"Inputs cannot be empty\")`.\n"
        "   - If lengths do not match (`len(x) != len(y)` or `len(x) != len(categories)`), raise `ValueError(\"Length mismatch between features and categories\")`.\n"
        "   - If `color_values` is provided and `len(color_values) != len(x)`, raise `ValueError(\"color_values length must match feature length\")`.\n"
        "2. Creates a 1-row by 2-column figure: `fig, (ax_scatter, ax_bar) = plt.subplots(1, 2, figsize=(12, 5))`.\n"
        "3. Left Subplot (`ax_scatter`):\n"
        "   - If `color_values` is provided, call `sc = ax_scatter.scatter(x, y, c=color_values, cmap=\"viridis\", alpha=0.7, s=50)` and add a colorbar to `ax_scatter` with `fig.colorbar(sc, ax=ax_scatter)`.\n"
        "   - If `color_values` is None, call `ax_scatter.scatter(x, y, color=\"#4f46e5\", alpha=0.7, s=50)`.\n"
        "   - Sets title to `\"Feature Correlation\"`, x-label to `\"Feature X\"`, y-label to `\"Feature Y\"`. Enables grid.\n"
        "4. Right Subplot (`ax_bar`):\n"
        "   - Counts occurrences of each unique category in `categories` (sorted alphabetically).\n"
        "   - Plots a vertical bar chart using `ax_bar.bar(unique_cats, counts, color=\"#059669\", alpha=0.85, edgecolor=\"#064e3b\", width=0.6)`.\n"
        "   - Sets title to `\"Category Distribution\"`, x-label to `\"Category\"`, y-label to `\"Count\"`. Enables y-axis grid.\n"
        "5. Applies `fig.tight_layout()` and returns `(fig, (ax_scatter, ax_bar))`."
    ),
    "starter_code": r'''import matplotlib.pyplot as plt
import numpy as np
from typing import List, Tuple, Optional, Any

def plot_scatter_and_bar(
    x: np.ndarray,
    y: np.ndarray,
    categories: List[str],
    color_values: Optional[np.ndarray] = None
) -> Tuple[plt.Figure, Tuple[plt.Axes, plt.Axes]]:
    """
    Create a 1x2 panel with feature scatter plot and category frequency bar chart.
    
    Args:
        x: 1D array of x-coordinates
        y: 1D array of y-coordinates
        categories: List of category string labels
        color_values: Optional 1D array for continuous color mapping in scatter plot
        
    Returns:
        (fig, (ax_scatter, ax_bar))
    """
    # TODO: Validate inputs, create 1x2 subplots, plot scatter and bar charts, return (fig, (ax_scatter, ax_bar))
    pass
''',
    "reference_solution": r'''import matplotlib.pyplot as plt
import numpy as np
from typing import List, Tuple, Optional

def plot_scatter_and_bar(
    x: np.ndarray,
    y: np.ndarray,
    categories: List[str],
    color_values: Optional[np.ndarray] = None
) -> Tuple[plt.Figure, Tuple[plt.Axes, plt.Axes]]:
    """
    Create a 1x2 panel with feature correlation scatter and category distribution bar chart.
    """
    x_arr = np.asarray(x)
    y_arr = np.asarray(y)
    
    if len(x_arr) == 0 or len(y_arr) == 0 or len(categories) == 0:
        raise ValueError("Inputs cannot be empty")
    if len(x_arr) != len(y_arr) or len(x_arr) != len(categories):
        raise ValueError("Length mismatch between features and categories")
    if color_values is not None and len(color_values) != len(x_arr):
        raise ValueError("color_values length must match feature length")
        
    fig, (ax_scatter, ax_bar) = plt.subplots(1, 2, figsize=(12, 5))
    
    # Left subplot: Scatter
    if color_values is not None:
        sc = ax_scatter.scatter(x_arr, y_arr, c=color_values, cmap="viridis", alpha=0.7, s=50)
        fig.colorbar(sc, ax=ax_scatter)
    else:
        ax_scatter.scatter(x_arr, y_arr, color="#4f46e5", alpha=0.7, s=50)
        
    ax_scatter.set_title("Feature Correlation")
    ax_scatter.set_xlabel("Feature X")
    ax_scatter.set_ylabel("Feature Y")
    ax_scatter.grid(True, linestyle=":", alpha=0.5)
    
    # Right subplot: Categorical Bar Chart
    unique_cats = sorted(list(set(categories)))
    counts = [categories.count(c) for c in unique_cats]
    
    ax_bar.bar(unique_cats, counts, color="#059669", alpha=0.85, edgecolor="#064e3b", width=0.6)
    ax_bar.set_title("Category Distribution")
    ax_bar.set_xlabel("Category")
    ax_bar.set_ylabel("Count")
    ax_bar.grid(axis="y", linestyle=":", alpha=0.5)
    
    fig.tight_layout()
    return fig, (ax_scatter, ax_bar)
''',
    "test_suite": r'''import matplotlib.pyplot as plt
import numpy as np
import io

def run_tests(candidate_func):
    """
    Automated test harness for Feature Correlation Scatter & Bar Chart (mpl-p2-c1).
    """
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Test 1: Standard input with colormapping
    x = np.array([1.0, 2.0, 3.0, 4.0, 5.0, 6.0])
    y = np.array([2.5, 3.8, 5.1, 7.2, 8.9, 11.0])
    cats = ["Alpha", "Beta", "Alpha", "Gamma", "Beta", "Alpha"]
    cvals = np.array([10, 20, 15, 40, 25, 12])
    
    result = candidate_func(x, y, cats, cvals)
    
    if isinstance(result, tuple) and len(result) == 2:
        fig, axes = result
    elif isinstance(result, plt.Figure):
        fig = result
        axes = fig.axes[:2]
    else:
        assert_test(False, f"Expected (fig, (ax1, ax2)) tuple, got {type(result)}")
        return report

    assert_test(isinstance(fig, plt.Figure), "First returned element must be Figure")
    
    if isinstance(axes, (list, tuple, np.ndarray)):
        ax_sc, ax_bar = axes[0], axes[1]
    else:
        ax_sc, ax_bar = fig.axes[0], fig.axes[1]
        
    # Check scatter plot
    collections = ax_sc.collections
    assert_test(len(collections) >= 1, "ax_scatter must contain PathCollection (scatter plot)")
    sc_offsets = collections[0].get_offsets()
    assert_test(len(sc_offsets) == len(x), f"Scatter point count mismatch: expected {len(x)}, got {len(sc_offsets)}")
    np.testing.assert_allclose(sc_offsets[:, 0], x, err_msg="Scatter x-coordinates mismatch")
    np.testing.assert_allclose(sc_offsets[:, 1], y, err_msg="Scatter y-coordinates mismatch")
    
    # Check scatter labels and title
    assert_test("correlation" in ax_sc.get_title().lower(), "Scatter title should mention 'Correlation'")
    assert_test(len(ax_sc.get_xlabel().strip()) > 0, "Scatter x-label cannot be empty")
    assert_test(len(ax_sc.get_ylabel().strip()) > 0, "Scatter y-label cannot be empty")
    
    # Check bar chart
    patches = ax_bar.patches
    assert_test(len(patches) == 3, f"Expected 3 bars for 3 unique categories, found {len(patches)}")
    
    # Expected counts: Alpha=3, Beta=2, Gamma=1
    heights = sorted([p.get_height() for p in patches], reverse=True)
    assert_test(heights == [3, 2, 1], f"Bar heights mismatch: expected [3, 2, 1], got {heights}")
    
    # Check bar labels and title
    assert_test("category" in ax_bar.get_title().lower() or "distribution" in ax_bar.get_title().lower(), "Bar title should mention Category/Distribution")
    
    # Check rendering
    buf = io.BytesIO()
    fig.savefig(buf, format="png")
    assert_test(buf.tell() > 1000, "Figure rendering failed")
    plt.close(fig)

    # Test 2: Input without color_values (default color)
    fig2, (ax_sc2, ax_bar2) = candidate_func(x, y, cats, None)
    assert_test(len(ax_sc2.collections) >= 1, "Scatter must work when color_values is None")
    plt.close(fig2)

    # Test 3: Validation on mismatched lengths
    raised_mismatch = False
    try:
        candidate_func(x[:3], y, cats)
    except ValueError:
        raised_mismatch = True
    assert_test(raised_mismatch, "Expected ValueError on length mismatch between x and y")

    # Test 4: Validation on empty inputs
    raised_empty = False
    try:
        candidate_func(np.array([]), np.array([]), [])
    except ValueError:
        raised_empty = True
    assert_test(raised_empty, "Expected ValueError on empty inputs")

    return report
''',
    "hints": [
        "Use `plt.subplots(1, 2, figsize=(12, 5))` to create the side-by-side canvas.",
        "For scatter: `ax_scatter.scatter(x, y, c=color_values, cmap='viridis')`.",
        "For bar: count unique categories using `sorted(set(categories))` and `categories.count()`."
    ]
}

# -----------------------------------------------------------------------------
# Challenge 2: Distribution Histogram with Density Curve
# -----------------------------------------------------------------------------

CHALLENGE_2 = {
    "id": "mpl-p2-c2",
    "title": "Distribution Histogram with Density Curve",
    "difficulty": "Intermediate",
    "category": "Essential Chart Types",
    "description": (
        "Plot an empirical frequency distribution using a normalized density histogram, and overlay "
        "an analytical Gaussian (normal) probability density curve matching the sample mean and variance. "
        "Add a distinct vertical reference line marking the mean."
    ),
    "instructions": (
        "Write a function `plot_distribution_with_density(data: np.ndarray, bins: int = 30) -> tuple[plt.Figure, plt.Axes]` that:\n"
        "1. Validates inputs:\n"
        "   - If `len(data) < 2`, raise `ValueError(\"data must contain at least 2 points\")`.\n"
        "   - If `bins < 1`, raise `ValueError(\"bins must be at least 1\")`.\n"
        "   - If standard deviation of data is 0 (`np.std(data) == 0`), raise `ValueError(\"Data must have non-zero variance\")`.\n"
        "2. Calculates sample mean (`mu = np.mean(data)`) and standard deviation (`sigma = np.std(data)`).\n"
        "3. Creates `fig, ax = plt.subplots(figsize=(8, 5))`.\n"
        "4. Plots histogram with `density=True`, `bins=bins`, `color=\"#60a5fa\"`, `alpha=0.6`, `edgecolor=\"white\"`, and `label=\"Empirical Density\"`.\n"
        "5. Computes Gaussian PDF over 200 evenly spaced points from `min(data)` to `max(data)` using:\n"
        "   `pdf = (1.0 / (sigma * np.sqrt(2 * np.pi))) * np.exp(-0.5 * ((x_eval - mu) / sigma) ** 2)`.\n"
        "6. Plots the Gaussian curve on `ax` with `color=\"#dc2626\"`, `linewidth=2.2`, and `label=f\"Normal Fit (μ={mu:.2f}, σ={sigma:.2f})\"`.\n"
        "7. Adds a vertical dashed line for the mean: `ax.axvline(mu, color=\"#1e3a8a\", linestyle=\"--\", linewidth=1.8, label=f\"Mean = {mu:.2f}\")`.\n"
        "8. Sets title to `\"Distribution with Fitted Normal Density\"`, x-label to `\"Value\"`, and y-label to `\"Probability Density\"`.\n"
        "9. Adds grid and legend, then returns `(fig, ax)`."
    ),
    "starter_code": r'''import matplotlib.pyplot as plt
import numpy as np
from typing import Tuple, Any

def plot_distribution_with_density(
    data: np.ndarray,
    bins: int = 30
) -> Tuple[plt.Figure, plt.Axes]:
    """
    Plot normalized distribution histogram with overlaid theoretical Gaussian curve.
    
    Args:
        data: 1D array of numerical observations
        bins: Number of histogram bins (default 30)
        
    Returns:
        (fig, ax) tuple
    """
    # TODO: Validate inputs, compute mean/std, plot histogram, overlay PDF, add mean line, return (fig, ax)
    pass
''',
    "reference_solution": r'''import matplotlib.pyplot as plt
import numpy as np
from typing import Tuple

def plot_distribution_with_density(
    data: np.ndarray,
    bins: int = 30
) -> Tuple[plt.Figure, plt.Axes]:
    """
    Plot normalized distribution histogram with overlaid theoretical Gaussian curve.
    """
    arr = np.asarray(data, dtype=float).flatten()
    if len(arr) < 2:
        raise ValueError("data must contain at least 2 points")
    if bins < 1:
        raise ValueError("bins must be at least 1")
        
    mu = float(np.mean(arr))
    sigma = float(np.std(arr))
    if sigma == 0:
        raise ValueError("Data must have non-zero variance")
        
    fig, ax = plt.subplots(figsize=(8, 5))
    
    # Normalized histogram
    ax.hist(arr, bins=bins, density=True, color="#60a5fa", alpha=0.6, edgecolor="white", label="Empirical Density")
    
    # Theoretical normal PDF
    x_eval = np.linspace(float(np.min(arr)), float(np.max(arr)), 200)
    pdf = (1.0 / (sigma * np.sqrt(2 * np.pi))) * np.exp(-0.5 * ((x_eval - mu) / sigma) ** 2)
    ax.plot(x_eval, pdf, color="#dc2626", linewidth=2.2, label=f"Normal Fit (μ={mu:.2f}, σ={sigma:.2f})")
    
    # Vertical line for mean
    ax.axvline(mu, color="#1e3a8a", linestyle="--", linewidth=1.8, label=f"Mean = {mu:.2f}")
    
    ax.set_title("Distribution with Fitted Normal Density")
    ax.set_xlabel("Value")
    ax.set_ylabel("Probability Density")
    ax.grid(True, linestyle=":", alpha=0.5)
    ax.legend(loc="upper right")
    
    return fig, ax
''',
    "test_suite": r'''import matplotlib.pyplot as plt
import numpy as np
import io

def run_tests(candidate_func):
    """
    Automated test harness for Distribution Histogram with Density Curve (mpl-p2-c2).
    """
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Test 1: Standard normal sample
    np.random.seed(42)
    data = np.random.normal(loc=10.0, scale=2.5, size=500)
    
    result = candidate_func(data, bins=25)
    if isinstance(result, tuple) and len(result) == 2:
        fig, ax = result
    elif isinstance(result, plt.Figure):
        fig = result
        ax = fig.axes[0]
    else:
        assert_test(False, f"Expected (fig, ax) tuple, got {type(result)}")
        return report

    assert_test(isinstance(fig, plt.Figure), "First returned item must be Figure")
    assert_test(isinstance(ax, plt.Axes), "Second returned item must be Axes")
    
    # Verify histogram patches exist
    patches = ax.patches
    assert_test(len(patches) == 25, f"Expected 25 histogram bins/patches, found {len(patches)}")
    
    # Verify total integral of density histogram is approximately 1.0
    total_area = sum(p.get_width() * p.get_height() for p in patches)
    assert_test(np.isclose(total_area, 1.0, atol=0.05), f"Density histogram area should be ~1.0, got {total_area}")
    
    # Verify lines: density curve + mean axvline
    lines = ax.get_lines()
    assert_test(len(lines) >= 1, "Must contain at least 1 Line2D artist for the fitted curve")
    
    # Verify mean line position
    sample_mean = float(np.mean(data))
    mean_lines = [l for l in lines if len(l.get_xdata()) == 2 and np.allclose(l.get_xdata(), sample_mean, atol=0.01)]
    assert_test(len(mean_lines) >= 1, "Must contain axvline at sample mean")
    
    # Verify labels
    assert_test("distribution" in ax.get_title().lower() or "density" in ax.get_title().lower(), "Title must mention distribution/density")
    assert_test(len(ax.get_xlabel().strip()) > 0, "X-label cannot be empty")
    assert_test("density" in ax.get_ylabel().lower(), "Y-label should mention density")
    
    # Check legend
    legend = ax.get_legend()
    assert_test(legend is not None, "Legend must be present")
    
    # Check rendering
    buf = io.BytesIO()
    fig.savefig(buf, format="png")
    assert_test(buf.tell() > 1000, "Figure rendering failed")
    plt.close(fig)

    # Test 2: Validation on small data (< 2 elements)
    raised_small = False
    try:
        candidate_func(np.array([5.0]))
    except ValueError:
        raised_small = True
    assert_test(raised_small, "Expected ValueError when data has < 2 elements")

    # Test 3: Validation on zero variance data
    raised_zero_var = False
    try:
        candidate_func(np.array([4.0, 4.0, 4.0, 4.0]))
    except ValueError:
        raised_zero_var = True
    assert_test(raised_zero_var, "Expected ValueError on zero variance data")

    # Test 4: Validation on invalid bins
    raised_bins = False
    try:
        candidate_func(data, bins=0)
    except ValueError:
        raised_bins = True
    assert_test(raised_bins, "Expected ValueError when bins < 1")

    return report
''',
    "hints": [
        "Set `density=True` in `ax.hist()` so the histogram is normalized as a probability density.",
        "Use `np.linspace(data.min(), data.max(), 200)` to generate smooth x-coordinates for the normal PDF.",
        "Use `ax.axvline(mu, linestyle='--', color=...)` to mark the distribution mean."
    ]
}

CHALLENGES = [CHALLENGE_1, CHALLENGE_2]

CURRICULUM_DATA = {
    **DAY_METADATA,
    "concept_primer": CONCEPT_PRIMER,
    "walkthrough": WALKTHROUGH,
    "challenges": CHALLENGES
}

def get_curriculum() -> Dict[str, Any]:
    return CURRICULUM_DATA
