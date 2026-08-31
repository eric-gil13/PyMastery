"""
Day 3: Publication-Grade Scientific Visualization with Matplotlib
PyMastery 7-Day Curriculum
"""

import matplotlib
matplotlib.use("Agg")  # Non-interactive headless backend for server safety
import matplotlib.pyplot as plt
import matplotlib.transforms as mtransforms
from matplotlib.colors import LinearSegmentedColormap, Normalize, TwoSlopeNorm
import numpy as np
import io
from typing import Dict, Any, List, Optional, Tuple

DAY_METADATA = {
    "day_id": "day03",
    "day_number": 3,
    "title": "Day 3: Publication-Grade Scientific Visualization with Matplotlib",
    "tagline": "Master the OOP Artist hierarchy, coordinate transforms, dynamic multi-panel layouts, and memory-leak-free server rendering.",
    "estimated_time": "3-4 hours",
    "concepts_covered": [
        "OOP Figure/Axes/Artist hierarchy vs procedural plt state machine",
        "Coordinate transform systems (transData, transAxes, transFigure, blended transforms)",
        "Twin axes (twinx, twiny) & secondary coordinate systems",
        "Custom colormaps (LinearSegmentedColormap) & diverging normalizations (TwoSlopeNorm)",
        "Server-safe rendering, thread safety, and memory leak prevention (plt.close)",
        "Multi-panel diagnostic layouts with GridSpec"
    ]
}

CONCEPT_PRIMER = r"""# Day 3 Concept Primer: Matplotlib Architecture & Publication Visuals

## 1. The Object-Oriented (OOP) Hierarchy vs Procedural `plt`
Matplotlib has two distinct interfaces:
1. **Procedural (`pyplot` / `plt.*`)**: State-machine tracking the "current" figure and axes. Convenient for interactive notebooks, but dangerous in production servers (hidden global state, race conditions across threads, and memory leaks).
2. **Object-Oriented (OOP)**: Explicitly instantiating and manipulating `Figure`, `Axes`, and `Artist` objects.

```
Figure (The Canvas)
 └── GridSpec / Subplots
      └── Axes (The coordinate system / plot area)
           ├── XAxis / YAxis (Ticks, TickLabels, Axis Labels)
           ├── Spines (Top, Bottom, Left, Right boundary lines)
           └── Artists (Line2D, Patch, Text, Collections, Images)
```

### Preventing Memory Leaks in Server Backends
In web services, calling `plt.figure()` adds the figure to a global internal registry in `pyplot`. If you only do `fig.savefig()` without `plt.close(fig)`, the figure **is never garbage collected**, leaking MBs per request until the server crashes with Out Of Memory (OOM).

**The Safe Production Pattern**:
```python
import io
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

def generate_plot_bytes() -> bytes:
    fig, ax = plt.subplots(figsize=(6, 4), dpi=150)
    try:
        ax.plot([1, 2, 3], [4, 5, 6], color='#2563eb')
        buf = io.BytesIO()
        fig.savefig(buf, format='png', bbox_inches='tight')
        buf.seek(0)
        return buf.getvalue()
    finally:
        plt.close(fig)  # Mandatory: removes from pyplot registry & frees memory
```

---

## 2. Coordinate Transformation Systems
Matplotlib uses distinct coordinate systems connected by mathematical transforms:

| Transform | Attribute | Coordinate Space | Use Case |
| :--- | :--- | :--- | :--- |
| **Data** | `ax.transData` | Raw data values $(x, y)$ | Positioning data points, error bars |
| **Axes** | `ax.transAxes` | $(0, 0)$ bottom-left to $(1, 1)$ top-right of the Axes box | Subplot titles, panel labels ("(A)", "(B)") |
| **Figure** | `fig.transFigure` | $(0, 0)$ bottom-left to $(1, 1)$ top-right of the entire window | Figure super-titles, overall watermarks |
| **Display** | `None` (identity) | Physical pixel coordinates on the screen | Pixel-precise UI offsets |

### Blended Transforms
Combine $X$ in data space with $Y$ in axes relative space (e.g. vertical threshold lines spanning full height regardless of $Y$ data scale):
```python
trans = mtransforms.blended_transform_factory(ax.transData, ax.transAxes)
ax.text(x=threshold_val, y=0.95, s="Threshold", transform=trans)
```

---

## 3. Dual Axes (`ax.twinx()`)
When plotting two metrics on different scales (e.g., Loss $\in [0, 2.5]$ vs Accuracy $\in [0\%, 100\%]$) across the same epochs:
```python
fig, ax1 = plt.subplots()
ax2 = ax1.twinx() # Shares same X-axis, independent Y-axis on the right

l1 = ax1.plot(epochs, loss, 'b-', label='Train Loss')
l2 = ax2.plot(epochs, acc, 'g--', label='Accuracy')

# Merge legends from both axes
lines = l1 + l2
labels = [l.get_label() for l in lines]
ax1.legend(lines, labels, loc='upper right')
```

---

## 4. Normalizations & Colormaps
* `Normalize(vmin, vmax)`: Linear scaling $[vmin, vmax] \to [0, 1]$.
* `TwoSlopeNorm(vcenter=0.0, vmin=-1.0, vmax=1.0)`: Diverging colormap centered at zero, ensuring negative values map to cool colors and positive to warm colors even if asymmetric.
"""

WALKTHROUGH = r"""# Day 3 Walkthrough: Building a Custom Themed Scientific Plot

```python
import matplotlib.pyplot as plt
import numpy as np

def create_publication_theme_plot():
    # 1. High DPI and publication styling
    plt.rcParams.update({
        'font.family': 'sans-serif',
        'font.size': 10,
        'axes.linewidth': 1.0,
        'grid.alpha': 0.3,
        'grid.linestyle': '--'
    })
    
    fig, ax = plt.subplots(figsize=(7, 4), dpi=200)
    
    x = np.linspace(0, 10, 200)
    y = np.sin(x) * np.exp(-0.15 * x)
    
    ax.plot(x, y, color='#1e40af', lw=2, label='Damped Oscillation')
    ax.fill_between(x, y - 0.1, y + 0.1, color='#93c5fd', alpha=0.3, label='Confidence Interval')
    
    # Clean spines: remove top and right spines
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    
    # Add annotated callout
    min_idx = np.argmin(y)
    ax.annotate(
        f'Local Minimum: ({x[min_idx]:.2f}, {y[min_idx]:.2f})',
        xy=(x[min_idx], y[min_idx]),
        xytext=(x[min_idx] + 1.0, y[min_idx] + 0.3),
        arrowprops=dict(facecolor='#dc2626', shrink=0.05, width=1, headwidth=6),
        fontweight='bold',
        color='#991b1b'
    )
    
    ax.set_title("Publication-Grade Signal Response", fontsize=12, fontweight='bold', pad=12)
    ax.set_xlabel("Time (s)", fontweight='semibold')
    ax.set_ylabel("Amplitude", fontweight='semibold')
    ax.grid(True)
    ax.legend(frameon=True, framealpha=0.9)
    
    fig.tight_layout()
    return fig
```
"""

# -----------------------------------------------------------------------------
# Challenge 1: Publication-Grade Multi-Panel ML Diagnostic Dashboard
# -----------------------------------------------------------------------------

CHALLENGE_1 = {
    "id": "day03_ch01_ml_diagnostic_dashboard",
    "title": "Publication-Grade Multi-Panel ML Diagnostic Dashboard",
    "difficulty": "Hard",
    "category": "Scientific Visualization & Layouts",
    "description": (
        "Construct a publication-ready 4-panel ML Diagnostic Dashboard using Matplotlib's OOP interface "
        "and `GridSpec`. The dashboard must incorporate dual-axis loss/accuracy curves with callout annotations, "
        "a normalized confusion matrix heatmap with dynamic contrast text, ROC/AUC curve with optimal threshold marker, "
        "and class probability distributions."
    ),
    "instructions": (
        "1. Implement `create_diagnostic_dashboard(history: dict, y_true: np.ndarray, y_pred: np.ndarray, y_prob: np.ndarray, class_names: list = None) -> plt.Figure`.\n"
        "2. Create a 2x2 grid figure with `figsize=(14, 10)` and `dpi=150`.\n"
        "3. **Panel 1 (Top-Left)**: Learning Curves\n"
        "   - Plot `train_loss` (solid blue) and `val_loss` (dashed blue) on primary Y-axis.\n"
        "   - Use `ax.twinx()` to plot `train_acc` (solid green) and `val_acc` (dashed green) on secondary Y-axis.\n"
        "   - Annotate the minimum validation loss epoch with an arrow callout.\n"
        "   - Add merged legend.\n"
        "4. **Panel 2 (Top-Right)**: Normalized Confusion Matrix\n"
        "   - Compute normalized confusion matrix ($C_{ij} / \\sum_j C_{ij}$).\n"
        "   - Display with `ax.imshow` using a custom or `'Blues'` colormap.\n"
        "   - Overlay cell text with raw count and percentage. Text color must be white on dark cells ($>0.5$) and black on light cells ($<=0.5$).\n"
        "   - Set accurate tick labels from `class_names`.\n"
        "5. **Panel 3 (Bottom-Left)**: ROC Curve & AUC\n"
        "   - Compute True Positive Rate (TPR) and False Positive Rate (FPR) over sorted thresholds (or via sklearn).\n"
        "   - Plot ROC curve with AUC score annotated in the legend.\n"
        "   - Plot dashed diagonal reference line ($y = x$) for random chance.\n"
        "   - Mark the optimal Youden's J point ($\\max(\\text{TPR} - \\text{FPR})$) with a red scatter point.\n"
        "6. **Panel 4 (Bottom-Right)**: Class Prediction Probability Distribution\n"
        "   - Plot probability histograms for Class 0 vs Class 1 with `alpha=0.6`.\n"
        "   - Add vertical dashed line at decision threshold $p = 0.5$ using blended transforms.\n"
        "7. Clean up spines (despine top/right where applicable), apply `fig.tight_layout()`, and return the `Figure` object."
    ),
    "starter_code": r'''import matplotlib.pyplot as plt
import numpy as np
from typing import Dict, List, Optional

def create_diagnostic_dashboard(
    history: Dict[str, List[float]],
    y_true: np.ndarray,
    y_pred: np.ndarray,
    y_prob: np.ndarray,
    class_names: Optional[List[str]] = None
) -> plt.Figure:
    """
    Generate a 4-panel ML diagnostic dashboard.
    
    Args:
        history: Dict with keys 'train_loss', 'val_loss', 'train_acc', 'val_acc'
        y_true: 1D ground truth binary labels (0 or 1)
        y_pred: 1D predicted binary labels (0 or 1)
        y_prob: 1D predicted probabilities for class 1
        class_names: Optional list of class names, defaults to ['Class 0', 'Class 1']
        
    Returns:
        matplotlib.figure.Figure object
    """
    # TODO: Implement 4-panel diagnostic dashboard
    pass
''',
    "reference_solution": r'''import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
import matplotlib.transforms as mtransforms
import numpy as np
from typing import Dict, List, Optional

def create_diagnostic_dashboard(
    history: Dict[str, List[float]],
    y_true: np.ndarray,
    y_pred: np.ndarray,
    y_prob: np.ndarray,
    class_names: Optional[List[str]] = None
) -> plt.Figure:
    if class_names is None:
        class_names = ["Negative (0)", "Positive (1)"]
        
    fig = plt.figure(figsize=(14, 10), dpi=150)
    gs = gridspec.GridSpec(2, 2, figure=fig, hspace=0.3, wspace=0.25)
    
    # ----------------------------------------------------
    # Panel 1: Learning Curves (Dual Axis)
    # ----------------------------------------------------
    ax1 = fig.add_subplot(gs[0, 0])
    ax1_twin = ax1.twinx()
    
    epochs = np.arange(1, len(history["train_loss"]) + 1)
    
    # Plot loss on primary axis
    l1 = ax1.plot(epochs, history["train_loss"], color="#2563eb", lw=2, label="Train Loss")
    l2 = ax1.plot(epochs, history["val_loss"], color="#1d4ed8", lw=2, linestyle="--", label="Val Loss")
    ax1.set_xlabel("Epoch", fontweight="semibold")
    ax1.set_ylabel("Loss", color="#1e40af", fontweight="semibold")
    ax1.tick_params(axis="y", labelcolor="#1e40af")
    ax1.grid(True, linestyle=":", alpha=0.5)
    
    # Plot accuracy on twin axis
    l3 = ax1_twin.plot(epochs, history["train_acc"], color="#059669", lw=2, label="Train Acc")
    l4 = ax1_twin.plot(epochs, history["val_acc"], color="#047857", lw=2, linestyle="--", label="Val Acc")
    ax1_twin.set_ylabel("Accuracy", color="#047857", fontweight="semibold")
    ax1_twin.tick_params(axis="y", labelcolor="#047857")
    
    # Annotate minimum validation loss
    min_val_idx = int(np.argmin(history["val_loss"]))
    min_epoch = epochs[min_val_idx]
    min_val_loss = history["val_loss"][min_val_idx]
    
    ax1.annotate(
        f"Best Val: {min_val_loss:.3f}",
        xy=(min_epoch, min_val_loss),
        xytext=(min_epoch + 1, min_val_loss + 0.15 * (max(history["val_loss"]) - min_val_loss + 1e-4)),
        arrowprops=dict(arrowstyle="->", color="#dc2626", lw=1.5),
        fontweight="bold",
        color="#dc2626",
        bbox=dict(boxstyle="round,pad=0.2", facecolor="#fee2e2", edgecolor="#dc2626", alpha=0.8)
    )
    
    # Merged legend
    lines = l1 + l2 + l3 + l4
    labels = [line.get_label() for line in lines]
    ax1.legend(lines, labels, loc="upper right", framealpha=0.9, fontsize=8)
    ax1.set_title("A. Training & Validation Dynamics", fontweight="bold", fontsize=11)
    
    # ----------------------------------------------------
    # Panel 2: Normalized Confusion Matrix Heatmap
    # ----------------------------------------------------
    ax2 = fig.add_subplot(gs[0, 1])
    
    # Compute confusion matrix
    cm = np.zeros((2, 2), dtype=int)
    for t, p in zip(y_true, y_pred):
        cm[int(t), int(p)] += 1
        
    cm_norm = cm.astype(float) / np.maximum(cm.sum(axis=1, keepdims=True), 1e-9)
    
    im = ax2.imshow(cm_norm, cmap="Blues", vmin=0.0, vmax=1.0)
    plt.colorbar(im, ax=ax2, fraction=0.046, pad=0.04)
    
    ax2.set_xticks([0, 1])
    ax2.set_yticks([0, 1])
    ax2.set_xticklabels(class_names, fontweight="semibold")
    ax2.set_yticklabels(class_names, fontweight="semibold")
    ax2.set_xlabel("Predicted Label", fontweight="semibold")
    ax2.set_ylabel("True Label", fontweight="semibold")
    
    # Text overlays with dynamic contrast
    for i in range(2):
        for j in range(2):
            val_pct = cm_norm[i, j] * 100
            val_count = cm[i, j]
            txt_color = "white" if cm_norm[i, j] > 0.5 else "black"
            ax2.text(
                j, i, f"{val_count}\n({val_pct:.1f}%)",
                ha="center", va="center", color=txt_color, fontweight="bold", fontsize=11
            )
            
    ax2.set_title("B. Normalized Confusion Matrix", fontweight="bold", fontsize=11)
    
    # ----------------------------------------------------
    # Panel 3: ROC Curve & Optimal Threshold
    # ----------------------------------------------------
    ax3 = fig.add_subplot(gs[1, 0])
    
    # Vectorized ROC computation
    sort_idx = np.argsort(-y_prob)
    y_true_sorted = y_true[sort_idx]
    
    tps = np.cumsum(y_true_sorted == 1)
    fps = np.cumsum(y_true_sorted == 0)
    
    total_p = max(1, np.sum(y_true == 1))
    total_n = max(1, np.sum(y_true == 0))
    
    tpr = np.r_[0, tps / total_p]
    fpr = np.r_[0, fps / total_n]
    
    # Trapezoidal AUC
    auc_score = float(np.trapezoid(tpr, fpr)) if hasattr(np, 'trapezoid') else float(np.trapz(tpr, fpr))
    
    ax3.plot(fpr, tpr, color="#4f46e5", lw=2.5, label=f"ROC (AUC = {auc_score:.3f})")
    ax3.plot([0, 1], [0, 1], color="#9ca3af", linestyle="--", lw=1.5, label="Random Baseline")
    
    # Optimal threshold (Youden's J statistic)
    youden_j = tpr - fpr
    best_idx = np.argmax(youden_j)
    ax3.scatter(fpr[best_idx], tpr[best_idx], color="#dc2626", s=70, zorder=5, label=f"Optimal J ({fpr[best_idx]:.2f}, {tpr[best_idx]:.2f})")
    
    ax3.set_xlim([-0.02, 1.02])
    ax3.set_ylim([-0.02, 1.02])
    ax3.set_xlabel("False Positive Rate (1 - Specificity)", fontweight="semibold")
    ax3.set_ylabel("True Positive Rate (Sensitivity)", fontweight="semibold")
    ax3.set_title("C. Receiver Operating Characteristic (ROC)", fontweight="bold", fontsize=11)
    ax3.grid(True, linestyle=":", alpha=0.5)
    ax3.legend(loc="lower right", framealpha=0.9, fontsize=9)
    
    # ----------------------------------------------------
    # Panel 4: Prediction Distribution & Calibration
    # ----------------------------------------------------
    ax4 = fig.add_subplot(gs[1, 1])
    
    prob_class0 = y_prob[y_true == 0]
    prob_class1 = y_prob[y_true == 1]
    
    bins = np.linspace(0, 1, 25)
    ax4.hist(prob_class0, bins=bins, color="#3b82f6", alpha=0.6, label=class_names[0], edgecolor="white")
    ax4.hist(prob_class1, bins=bins, color="#ef4444", alpha=0.6, label=class_names[1], edgecolor="white")
    
    # Threshold vertical line using blended transform
    trans = mtransforms.blended_transform_factory(ax4.transData, ax4.transAxes)
    ax4.axvline(0.5, color="#111827", linestyle="--", lw=1.8)
    ax4.text(0.51, 0.90, "Decision Threshold (0.5)", transform=trans, fontweight="bold", fontsize=8, color="#111827")
    
    ax4.set_xlabel("Predicted Probability P(Class=1)", fontweight="semibold")
    ax4.set_ylabel("Frequency", fontweight="semibold")
    ax4.set_title("D. Class Separation Distribution", fontweight="bold", fontsize=11)
    ax4.grid(True, linestyle=":", alpha=0.5)
    ax4.legend(loc="upper center", framealpha=0.9, fontsize=9)
    
    # Global polish
    fig.suptitle("Model Evaluation & Diagnostic Report", fontsize=14, fontweight="bold", y=0.98)
    
    return fig
''',
    "test_suite": r'''import matplotlib.pyplot as plt
import numpy as np
import io

def run_tests(candidate_func):
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # 1. Synthetic test data
    np.random.seed(42)
    N = 200
    y_true = np.random.binomial(1, 0.5, size=N)
    # Simulate predicted probabilities correlated with ground truth
    y_prob = np.clip(y_true * 0.6 + np.random.uniform(0.1, 0.4, size=N), 0.0, 1.0)
    y_pred = (y_prob >= 0.5).astype(int)
    
    history = {
        "train_loss": [0.8, 0.6, 0.45, 0.35, 0.28, 0.22, 0.18, 0.15],
        "val_loss":   [0.82, 0.63, 0.49, 0.40, 0.37, 0.36, 0.38, 0.41],
        "train_acc":  [0.60, 0.70, 0.80, 0.85, 0.89, 0.92, 0.94, 0.96],
        "val_acc":    [0.58, 0.68, 0.78, 0.82, 0.84, 0.85, 0.83, 0.82]
    }
    
    fig = candidate_func(history, y_true, y_pred, y_prob, class_names=["Normal", "Anomaly"])
    
    # Validate returned figure object
    assert_test(isinstance(fig, plt.Figure), f"Expected plt.Figure instance, got {type(fig)}")
    
    # Assert minimum number of axes (4 main + 1 twinx = at least 4-5 axes)
    axes = fig.get_axes()
    assert_test(len(axes) >= 4, f"Expected at least 4 axes in dashboard, found {len(axes)}")
    
    # Validate renderability to PNG in-memory without GUI errors
    buf = io.BytesIO()
    fig.savefig(buf, format='png', dpi=100)
    plt.close(fig)
    
    assert_test(buf.tell() > 10_000, f"Rendered PNG artifact is empty or too small: {buf.tell()} bytes")

    return report
''',
    "hints": [
        "Use `plt.figure(figsize=(14, 10))` and `gridspec.GridSpec(2, 2)` for structured subplots.",
        "For panel 1, use `ax1.twinx()` to create a secondary Y-axis for accuracy metrics.",
        "For cell contrast in confusion matrix, check `cm_norm[i, j] > 0.5` to switch between white and black text.",
        "Always call `plt.close(fig)` when discarding figures in test suites to prevent memory leaks."
    ]
}

CURRICULUM_DATA = {
    **DAY_METADATA,
    "concept_primer": CONCEPT_PRIMER,
    "walkthrough": WALKTHROUGH,
    "challenges": [CHALLENGE_1]
}

def get_curriculum() -> Dict[str, Any]:
    return CURRICULUM_DATA
