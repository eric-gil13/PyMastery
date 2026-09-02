"""
Part 3: Subplots & Multi-Panel Grids
PyMastery Progressive Matplotlib Curriculum
"""

import matplotlib
matplotlib.use("Agg")  # Non-interactive headless backend for server execution
import matplotlib.pyplot as plt
import numpy as np
import io
from typing import Dict, Any, List, Tuple, Optional, Union

DAY_METADATA = {
    "day_id": "mpl_part03",
    "part_number": 3,
    "day_number": 3,
    "title": "Part 3: Subplots & Multi-Panel Grids",
    "tagline": "Master 2D subplot grids, multi-panel diagnostic dashboards, and secondary twin axes.",
    "estimated_time": "1-2 hours",
    "concepts_covered": [
        "Multi-axes grids with plt.subplots(nrows, ncols)",
        "2D array indexing ax[row, col] vs flattened iteration ax.ravel()",
        "Shared axes (sharex, sharey) for synchronizing scales and reducing clutter",
        "Heatmaps with ax.imshow() and text contrast overlays",
        "Secondary twin axes with ax.twinx() for dual-scale time series"
    ]
}

CONCEPT_PRIMER = r"""# Part 3 Concept Primer: Subplots & Multi-Panel Grids

## 1. Multi-Panel Layouts: The `plt.subplots(nrows, ncols)` Paradigm
Real-world machine learning dashboards and scientific figures rarely contain just one plot. Instead, they present 2 to 6 synchronized panels comparing distinct facets of the same experiment.

Matplotlib creates multi-panel layouts via `plt.subplots(nrows, ncols)`:
```python
fig, axes = plt.subplots(2, 2, figsize=(10, 8))
```

### The Return Value: A NumPy Array of Axes
When `nrows > 1` and `ncols > 1`, `axes` is a 2D NumPy array with shape `(nrows, ncols)`:
* `axes[0, 0]`: Top-Left subplot
* `axes[0, 1]`: Top-Right subplot
* `axes[1, 0]`: Bottom-Left subplot
* `axes[1, 1]`: Bottom-Right subplot

> **Pro Tip: Flattening for Loops**
> If you need to populate subplots in a loop, flatten the 2D array with `axes.ravel()`:
> ```python
> for i, ax in enumerate(axes.ravel()):
>     ax.plot(data[i])
>     ax.set_title(f"Channel {i+1}")
> ```

---

## 2. Shared Axes: `sharex` and `sharey`
When comparing signals across the same time window or distributions on the same scale, set `sharex=True` or `sharey=True`:
```python
fig, (ax1, ax2) = plt.subplots(2, 1, sharex=True, figsize=(8, 6))
```
**Benefits:**
- Ticks and labels on the top subplot's shared axis are automatically hidden, eliminating clutter.
- Pan and zoom interactions in interactive viewers stay synchronized across panels.

---

## 3. Heatmaps & Confusion Matrices
To display a 2D matrix (such as a confusion matrix, covariance matrix, or attention map), use `ax.imshow()`:
```python
im = ax.imshow(matrix, cmap="Blues")
fig.colorbar(im, ax=ax)

# Overlay numeric text inside each cell
for i in range(matrix.shape[0]):
    for j in range(matrix.shape[1]):
        val = matrix[i, j]
        color = "white" if val > matrix.max() / 2 else "black"
        ax.text(j, i, f"{val}", ha="center", va="center", color=color, fontweight="bold")
```

---

## 4. Secondary Axes (`ax.twinx()`)
When two metrics share the same X-axis (e.g. trading days) but operate on wildly different units and scales (e.g. Daily Trading Volume in millions of shares vs Stock Price in dollars), putting them on the same Y-axis flattens one of the curves into an unreadable line.

`ax.twinx()` creates a secondary invisible Axes that shares the exact same X-axis coordinate space, but has an independent Y-axis on the right:
```python
fig, ax1 = plt.subplots()
ax2 = ax1.twinx()

# Plot volume as bars on primary axis
ax1.bar(dates, volume, alpha=0.3, color="gray", label="Volume")
ax1.set_ylabel("Volume (Shares)")

# Plot price as line on secondary axis
ax2.plot(dates, price, color="blue", lw=2, label="Price")
ax2.set_ylabel("Price ($)")
```
"""

WALKTHROUGH = r"""# Part 3 Code Walkthrough: Building Multi-Panel Grids

Here is how you construct a synchronized 2-panel figure with shared x-axis:

```python
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

# 1. Generate multi-channel signal data
time = np.linspace(0, 10, 200)
signal = np.sin(time)
noise = np.random.normal(0, 0.2, size=200)
noisy_signal = signal + noise

# 2. Instantiate stacked subplots sharing X
fig, (ax_top, ax_bottom) = plt.subplots(2, 1, figsize=(8, 6), sharex=True)

# 3. Top panel: Raw vs clean signal
ax_top.plot(time, noisy_signal, color="#94a3b8", alpha=0.7, label="Noisy Input")
ax_top.plot(time, signal, color="#2563eb", linewidth=2.0, label="True Signal")
ax_top.set_title("Sensor Filtering Analysis", fontweight="bold")
ax_top.set_ylabel("Amplitude")
ax_top.grid(True, linestyle=":", alpha=0.5)
ax_top.legend(loc="upper right")

# 4. Bottom panel: Residual error
residuals = noisy_signal - signal
ax_bottom.plot(time, residuals, color="#dc2626", linewidth=1.2, label="Residuals")
ax_bottom.axhline(0, color="black", linestyle="--", linewidth=1.0)
ax_bottom.set_xlabel("Time (s)")
ax_bottom.set_ylabel("Error")
ax_bottom.grid(True, linestyle=":", alpha=0.5)
ax_bottom.legend(loc="upper right")

# 5. Clean up layout
fig.tight_layout()
```
"""

# -----------------------------------------------------------------------------
# Challenge 1: 2x2 Model Diagnostic Grid
# -----------------------------------------------------------------------------

CHALLENGE_1 = {
    "id": "mpl-p3-c1",
    "title": "2x2 Model Diagnostic Grid",
    "difficulty": "Advanced",
    "category": "Subplots & Layouts",
    "description": (
        "Construct a comprehensive 4-panel ML diagnostic dashboard in a 2x2 grid. "
        "Top-left: ROC Curve with random chance baseline. Top-right: Precision-Recall Curve. "
        "Bottom-left: Epoch Loss curves. Bottom-right: Confusion Matrix heatmap with dynamic contrast cell text."
    ),
    "instructions": (
        "Write a function `create_diagnostic_grid(epochs: list, train_loss: list, val_loss: list, fpr: np.ndarray, tpr: np.ndarray, precision: np.ndarray, recall: np.ndarray, conf_matrix: np.ndarray) -> tuple[plt.Figure, np.ndarray]` that:\n"
        "1. Validates inputs:\n"
        "   - If any sequence is empty, raise `ValueError(\"Inputs cannot be empty\")`.\n"
        "   - If `conf_matrix` is not a 2D array of shape `(2, 2)`, raise `ValueError(\"conf_matrix must be 2x2\")`.\n"
        "2. Creates a 2x2 grid of subplot axes with a figure size of 11 by 9 inches (`figsize=(11, 9)`).\n"
        "3. Panel (0, 0) - ROC Curve:\n"
        "   - Plots `fpr` vs `tpr` with `color=\"#2563eb\"`, `linewidth=2`, and `label=\"ROC\"`.\n"
        "   - Plots dashed chance baseline `[0, 1]` vs `[0, 1]` with `color=\"gray\"` and `linestyle=\"--\"`.\n"
        "   - Sets the title to `\"ROC Curve\"`, the x-axis label to `\"False Positive Rate\"`, the y-axis label to `\"True Positive Rate\"`, and enables the legend and grid.\n"
        "4. Panel (0, 1) - Precision-Recall Curve:\n"
        "   - Plots `recall` vs `precision` with `color=\"#059669\"`, `linewidth=2`, and `label=\"PR\"`.\n"
        "   - Sets the title to `\"Precision-Recall Curve\"`, the x-axis label to `\"Recall\"`, the y-axis label to `\"Precision\"`, and enables the legend and grid.\n"
        "5. Panel (1, 0) - Loss Curves:\n"
        "   - Plots `epochs` vs `train_loss` (`color=\"#2563eb\"`, `label=\"Train Loss\"`).\n"
        "   - Plots `epochs` vs `val_loss` (`color=\"#dc2626\"`, `linestyle=\"--\"`, `label=\"Val Loss\"`).\n"
        "   - Sets the title to `\"Epoch Loss\"`, the x-axis label to `\"Epoch\"`, the y-axis label to `\"Loss\"`, and enables the legend and grid.\n"
        "6. Panel (1, 1) - Confusion Matrix:\n"
        "   - Displays the confusion matrix as a heatmap image (`cmap=\"Blues\"`).\n"
        "   - Annotates each cell $(i, j)$ with its integer value centered within the cell in bold text, using white text if `val > conf_matrix.max() / 2` else black for contrast.\n"
        "   - Sets x-ticks and y-ticks to `[0, 1]` with tick labels `[\"Pred 0\", \"Pred 1\"]` and `[\"True 0\", \"True 1\"]`.\n"
        "   - Sets the title to `\"Confusion Matrix\"`, the x-axis label to `\"Predicted\"`, and the y-axis label to `\"Actual\"`.\n"
        "7. Applies tight layout padding and returns `(fig, axes)`."
    ),
    "starter_code": r'''import matplotlib.pyplot as plt
import numpy as np
from typing import List, Tuple, Any

def create_diagnostic_grid(
    epochs: List[int],
    train_loss: List[float],
    val_loss: List[float],
    fpr: np.ndarray,
    tpr: np.ndarray,
    precision: np.ndarray,
    recall: np.ndarray,
    conf_matrix: np.ndarray
) -> Tuple[plt.Figure, np.ndarray]:
    """
    Generate a 2x2 model diagnostic dashboard.
    
    Returns:
        (fig, axes) where axes is a 2x2 ndarray of Axes
    """
    # TODO: Validate inputs, create 2x2 grid of subplot axes, populate all panels, apply tight layout, and return (fig, axes)
    pass
''',
    "reference_solution": r'''import matplotlib.pyplot as plt
import numpy as np
from typing import List, Tuple

def create_diagnostic_grid(
    epochs: List[int],
    train_loss: List[float],
    val_loss: List[float],
    fpr: np.ndarray,
    tpr: np.ndarray,
    precision: np.ndarray,
    recall: np.ndarray,
    conf_matrix: np.ndarray
) -> Tuple[plt.Figure, np.ndarray]:
    """
    Generate a 2x2 model diagnostic dashboard.
    """
    cm = np.asarray(conf_matrix)
    if (len(epochs) == 0 or len(train_loss) == 0 or len(val_loss) == 0 or
        len(fpr) == 0 or len(tpr) == 0 or len(precision) == 0 or len(recall) == 0):
        raise ValueError("Inputs cannot be empty")
    if cm.shape != (2, 2):
        raise ValueError("conf_matrix must be 2x2")
        
    fig, axes = plt.subplots(2, 2, figsize=(11, 9))
    
    # 1. ROC Curve (0, 0)
    ax_roc = axes[0, 0]
    ax_roc.plot(fpr, tpr, color="#2563eb", linewidth=2, label="ROC")
    ax_roc.plot([0, 1], [0, 1], color="gray", linestyle="--", label="Chance")
    ax_roc.set_title("ROC Curve")
    ax_roc.set_xlabel("False Positive Rate")
    ax_roc.set_ylabel("True Positive Rate")
    ax_roc.grid(True, linestyle=":", alpha=0.5)
    ax_roc.legend(loc="lower right")
    
    # 2. PR Curve (0, 1)
    ax_pr = axes[0, 1]
    ax_pr.plot(recall, precision, color="#059669", linewidth=2, label="PR")
    ax_pr.set_title("Precision-Recall Curve")
    ax_pr.set_xlabel("Recall")
    ax_pr.set_ylabel("Precision")
    ax_pr.grid(True, linestyle=":", alpha=0.5)
    ax_pr.legend(loc="lower left")
    
    # 3. Epoch Loss (1, 0)
    ax_loss = axes[1, 0]
    ax_loss.plot(epochs, train_loss, color="#2563eb", label="Train Loss")
    ax_loss.plot(epochs, val_loss, color="#dc2626", linestyle="--", label="Val Loss")
    ax_loss.set_title("Epoch Loss")
    ax_loss.set_xlabel("Epoch")
    ax_loss.set_ylabel("Loss")
    ax_loss.grid(True, linestyle=":", alpha=0.5)
    ax_loss.legend(loc="upper right")
    
    # 4. Confusion Matrix (1, 1)
    ax_cm = axes[1, 1]
    ax_cm.imshow(cm, cmap="Blues")
    threshold = cm.max() / 2.0 if cm.max() > 0 else 0.5
    for i in range(2):
        for j in range(2):
            val = cm[i, j]
            color = "white" if val > threshold else "black"
            ax_cm.text(j, i, str(val), ha="center", va="center", color=color, fontweight="bold", fontsize=12)
            
    ax_cm.set_xticks([0, 1])
    ax_cm.set_xticklabels(["Pred 0", "Pred 1"])
    ax_cm.set_yticks([0, 1])
    ax_cm.set_yticklabels(["True 0", "True 1"])
    ax_cm.set_title("Confusion Matrix")
    ax_cm.set_xlabel("Predicted")
    ax_cm.set_ylabel("Actual")
    
    fig.tight_layout()
    return fig, axes
''',
    "test_suite": r'''import matplotlib.pyplot as plt
import numpy as np
import io

def run_tests(candidate_func):
    """
    Automated test harness for 2x2 Model Diagnostic Grid (mpl-p3-c1).
    """
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Test 1: Standard diagnostic input
    epochs = [1, 2, 3, 4]
    train_loss = [0.8, 0.5, 0.3, 0.2]
    val_loss = [0.85, 0.55, 0.38, 0.32]
    fpr = np.array([0.0, 0.1, 0.3, 1.0])
    tpr = np.array([0.0, 0.6, 0.85, 1.0])
    recall = np.array([0.0, 0.4, 0.8, 1.0])
    precision = np.array([1.0, 0.85, 0.70, 0.5])
    cm = np.array([[85, 15], [10, 90]])
    
    result = candidate_func(epochs, train_loss, val_loss, fpr, tpr, precision, recall, cm)
    
    if isinstance(result, tuple) and len(result) == 2:
        fig, axes = result
    elif isinstance(result, plt.Figure):
        fig = result
        axes = fig.axes
    else:
        assert_test(False, f"Expected (fig, axes), got {type(result)}")
        return report

    assert_test(isinstance(fig, plt.Figure), "First returned item must be Figure")
    
    # Validate 4 subplots
    all_axes = fig.axes
    assert_test(len(all_axes) >= 4, f"Expected 4 subplots, found {len(all_axes)}")
    
    # Validate ROC panel lines
    ax_roc = all_axes[0]
    assert_test(len(ax_roc.get_lines()) >= 2, "ROC panel must have ROC curve and baseline")
    assert_test("roc" in ax_roc.get_title().lower(), "Top-left panel title should mention ROC")
    
    # Validate PR panel lines
    ax_pr = all_axes[1]
    assert_test(len(ax_pr.get_lines()) >= 1, "PR panel must have PR curve")
    assert_test("precision" in ax_pr.get_title().lower() or "pr" in ax_pr.get_title().lower(), "Top-right panel title should mention PR/Precision")
    
    # Validate Loss panel lines
    ax_loss = all_axes[2]
    assert_test(len(ax_loss.get_lines()) >= 2, "Loss panel must have train and val loss lines")
    assert_test("loss" in ax_loss.get_title().lower(), "Bottom-left panel title should mention Loss")
    
    # Validate Confusion Matrix panel (AxesImage + text annotations)
    ax_cm = all_axes[3]
    assert_test(len(ax_cm.images) >= 1, "Confusion matrix panel must have an imshow image")
    texts = ax_cm.texts
    assert_test(len(texts) >= 4, f"Confusion matrix panel must have 4 cell text labels, found {len(texts)}")
    cell_values = {t.get_text() for t in texts}
    assert_test({"85", "15", "10", "90"}.issubset(cell_values), "Cell text values mismatch")
    
    # Check rendering
    buf = io.BytesIO()
    fig.savefig(buf, format="png")
    assert_test(buf.tell() > 1000, "Figure rendering failed")
    plt.close(fig)

    # Test 2: Validation on invalid CM shape
    raised_cm = False
    try:
        candidate_func(epochs, train_loss, val_loss, fpr, tpr, precision, recall, np.array([[1, 2, 3]]))
    except ValueError:
        raised_cm = True
    assert_test(raised_cm, "Expected ValueError when conf_matrix is not 2x2")

    # Test 3: Validation on empty inputs
    raised_empty = False
    try:
        candidate_func([], [], [], fpr, tpr, precision, recall, cm)
    except ValueError:
        raised_empty = True
    assert_test(raised_empty, "Expected ValueError on empty inputs")

    return report
''',
    "hints": [
        "Use `plt.subplots(2, 2, figsize=(11, 9))` to initialize the 4-panel grid.",
        "Index `axes[0, 0]` for ROC, `axes[0, 1]` for PR, `axes[1, 0]` for loss, and `axes[1, 1]` for confusion matrix.",
        "In the confusion matrix, use `ax.text(j, i, str(cm[i, j]), ha='center', va='center')`."
    ]
}

# -----------------------------------------------------------------------------
# Challenge 2: Twin-Axes Multi-Scale Visualizer
# -----------------------------------------------------------------------------

CHALLENGE_2 = {
    "id": "mpl-p3-c2",
    "title": "Twin-Axes Multi-Scale Visualizer",
    "difficulty": "Intermediate",
    "category": "Subplots & Layouts",
    "description": (
        "Visualize multi-scale financial time series data by pairing primary and secondary axes. "
        "Plot trading volume as a semi-transparent bar chart on the primary axis, and overlay "
        "closing stock prices as a clean line plot on a secondary twinx() axis. Unify both legends."
    ),
    "instructions": (
        "Write a function `plot_volume_price_twin(dates: list, prices: list, volumes: list) -> tuple[plt.Figure, tuple[plt.Axes, plt.Axes]]` that:\n"
        "1. Validates inputs:\n"
        "   - If `len(dates) == 0`, `len(prices) == 0`, or `len(volumes) == 0`, raise `ValueError(\"Inputs cannot be empty\")`.\n"
        "   - If lengths do not match (`len(dates) != len(prices)` or `len(dates) != len(volumes)`), raise `ValueError(\"Sequence lengths must match\")`.\n"
        "2. Initializes a primary Figure and single Axes with a figure size of 10 by 5 inches (`figsize=(10, 5)`).\n"
        "3. Creates a secondary y-axis sharing the same x-axis (`ax_price`).\n"
        "4. Primary Axis (`ax_vol`):\n"
        "   - Renders trading volume as a bar chart (`color=\"#94a3b8\"`, `alpha=0.4`, `width=0.6`, `label=\"Volume\"`).\n"
        "   - Sets the y-axis label to `\"Volume (Shares)\"` and the x-axis label to `\"Date\"`.\n"
        "   - Sets the chart title to `\"Price & Volume History\"`.\n"
        "5. Secondary Axis (`ax_price`):\n"
        "   - Plots closing price as a line curve across `dates` (`color=\"#2563eb\"`, `linewidth=2.2`, `label=\"Price ($)\"`).\n"
        "   - Sets the secondary y-axis label to `\"Price ($)\"`.\n"
        "6. Unified Legend:\n"
        "   - Combines artist handles and labels from both the primary volume axis and secondary price axis to display a single consolidated legend on either axis.\n"
        "7. Returns the `(fig, (ax_vol, ax_price))` tuple."
    ),
    "starter_code": r'''import matplotlib.pyplot as plt
from typing import List, Tuple, Any

def plot_volume_price_twin(
    dates: List[str],
    prices: List[float],
    volumes: List[int]
) -> Tuple[plt.Figure, Tuple[plt.Axes, plt.Axes]]:
    """
    Plot trading volume and stock price on shared X with dual Y axes.
    
    Returns:
        (fig, (ax_vol, ax_price))
    """
    # TODO: Validate inputs, create a secondary y-axis sharing the same x-axis, plot volume bars and price line, merge legend, and return (fig, (ax_vol, ax_price))
    pass
''',
    "reference_solution": r'''import matplotlib.pyplot as plt
from typing import List, Tuple

def plot_volume_price_twin(
    dates: List[str],
    prices: List[float],
    volumes: List[int]
) -> Tuple[plt.Figure, Tuple[plt.Axes, plt.Axes]]:
    """
    Plot trading volume and stock price on shared X with dual Y axes.
    """
    if len(dates) == 0 or len(prices) == 0 or len(volumes) == 0:
        raise ValueError("Inputs cannot be empty")
    if len(dates) != len(prices) or len(dates) != len(volumes):
        raise ValueError("Sequence lengths must match")
        
    fig, ax_vol = plt.subplots(figsize=(10, 5))
    ax_price = ax_vol.twinx()
    
    # Primary axis: volume bars
    bar_cont = ax_vol.bar(dates, volumes, color="#94a3b8", alpha=0.4, width=0.6, label="Volume")
    ax_vol.set_ylabel("Volume (Shares)")
    ax_vol.set_xlabel("Date")
    ax_vol.set_title("Price & Volume History")
    ax_vol.grid(True, linestyle=":", alpha=0.3)
    
    # Secondary axis: price line
    line = ax_price.plot(dates, prices, color="#2563eb", linewidth=2.2, label="Price ($)")
    ax_price.set_ylabel("Price ($)")
    
    # Merged legend
    h1, l1 = ax_vol.get_legend_handles_labels()
    h2, l2 = ax_price.get_legend_handles_labels()
    ax_price.legend(h1 + h2, l1 + l2, loc="upper left")
    
    return fig, (ax_vol, ax_price)
''',
    "test_suite": r'''import matplotlib.pyplot as plt
import numpy as np
import io

def run_tests(candidate_func):
    """
    Automated test harness for Twin-Axes Multi-Scale Visualizer (mpl-p3-c2).
    """
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Test 1: Standard financial time series
    dates = ["2026-01-01", "2026-01-02", "2026-01-03", "2026-01-04", "2026-01-05"]
    prices = [150.2, 153.8, 149.5, 155.1, 158.4]
    volumes = [1200000, 1850000, 940000, 2100000, 1650000]
    
    result = candidate_func(dates, prices, volumes)
    if isinstance(result, tuple) and len(result) == 2:
        fig, axes = result
    elif isinstance(result, plt.Figure):
        fig = result
        axes = fig.axes
    else:
        assert_test(False, f"Expected (fig, (ax_vol, ax_price)), got {type(result)}")
        return report

    assert_test(isinstance(fig, plt.Figure), "First element must be Figure")
    
    # Check that 2 axes exist in figure
    fig_axes = fig.axes
    assert_test(len(fig_axes) >= 2, f"Expected 2 axes for twinx visualizer, found {len(fig_axes)}")
    
    ax_vol = fig_axes[0]
    ax_price = fig_axes[1]
    
    # Check volume bars on ax_vol
    assert_test(len(ax_vol.patches) == len(dates), f"Expected {len(dates)} volume bars, found {len(ax_vol.patches)}")
    assert_test("volume" in ax_vol.get_ylabel().lower(), f"ax_vol y-label should mention 'Volume', got '{ax_vol.get_ylabel()}'")
    
    # Check price line on ax_price
    assert_test(len(ax_price.get_lines()) >= 1, "ax_price must contain Line2D artist for price")
    assert_test("price" in ax_price.get_ylabel().lower(), f"ax_price y-label should mention 'Price', got '{ax_price.get_ylabel()}'")
    
    # Check title and x-label
    assert_test(len(ax_vol.get_title().strip()) > 0, "Title must not be empty")
    assert_test("date" in ax_vol.get_xlabel().lower(), "X-label should mention Date")
    
    # Check merged legend
    legend = ax_price.get_legend() or ax_vol.get_legend()
    assert_test(legend is not None, "Legend must be present on either ax_price or ax_vol")
    legend_texts = [t.get_text().lower() for t in legend.get_texts()]
    assert_test(any("volume" in t for t in legend_texts), "Legend must include Volume")
    assert_test(any("price" in t for t in legend_texts), "Legend must include Price")
    
    # Check rendering
    buf = io.BytesIO()
    fig.savefig(buf, format="png")
    assert_test(buf.tell() > 1000, "Figure rendering failed")
    plt.close(fig)

    # Test 2: Validation on mismatched lengths
    raised_mismatch = False
    try:
        candidate_func(dates, prices[:3], volumes)
    except ValueError:
        raised_mismatch = True
    assert_test(raised_mismatch, "Expected ValueError on mismatched sequence lengths")

    # Test 3: Validation on empty inputs
    raised_empty = False
    try:
        candidate_func([], [], [])
    except ValueError:
        raised_empty = True
    assert_test(raised_empty, "Expected ValueError on empty inputs")

    return report
''',
    "hints": [
        "Create the secondary axis with `ax_price = ax_vol.twinx()`.",
        "Plot volume with `ax_vol.bar()` and price with `ax_price.plot()`.",
        "To combine legends: `h1, l1 = ax_vol.get_legend_handles_labels()` and `h2, l2 = ax_price.get_legend_handles_labels()`, then `ax_price.legend(h1 + h2, l1 + l2)`."
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
