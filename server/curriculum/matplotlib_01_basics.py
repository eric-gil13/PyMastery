"""
Part 1: Plotting Foundations & The Figure-Axes Model
PyMastery Progressive Matplotlib Curriculum
"""

import matplotlib
matplotlib.use("Agg")  # Non-interactive headless backend for server execution
import matplotlib.pyplot as plt
import numpy as np
import io
from typing import Dict, Any, List, Tuple, Union

DAY_METADATA = {
    "day_id": "mpl_part01",
    "part_number": 1,
    "day_number": 1,
    "title": "Part 1: Plotting Foundations & The Figure-Axes Model",
    "tagline": "Master the Figure & Axes hierarchy, Line2D artists, styling, legends, and grids.",
    "estimated_time": "1-2 hours",
    "concepts_covered": [
        "Figure vs Axes Object-Oriented hierarchy vs procedural plt state machine",
        "Line plots with ax.plot()",
        "Styling lines: colors, linestyles, line widths, and markers",
        "Axis labels (set_xlabel, set_ylabel), titles (set_title), and limits",
        "Legends (ax.legend) and grid styling (ax.grid)",
        "Headless rendering and memory management with plt.close()"
    ]
}

CONCEPT_PRIMER = r"""# Part 1 Concept Primer: Plotting Foundations & The Figure-Axes Model

## 1. The Core Mental Model: Figure vs Axes vs Axis
The most common point of confusion for Python beginners is mixing up Matplotlib's procedural state machine (`plt.plot()`) with its Object-Oriented (OOP) interface (`fig, ax = plt.subplots()`).

To build reliable data applications, web backends, and scientific figures, you must always think in terms of the **OOP hierarchy**:

```
Figure (The Canvas / Window)
 └── Axes (The Coordinate System / Plot Area)
      ├── XAxis & YAxis (Ticks, TickLabels, Scale)
      ├── Spines (Top, Bottom, Left, Right boundary lines)
      └── Artists (Line2D, Patches, Text, Collections)
```

1. **Figure (`plt.Figure`)**: The overall bounding canvas that holds everything. It controls overall dimensions (`figsize`), resolution (`dpi`), background color, and figure-level titles (`suptitle`).
2. **Axes (`plt.Axes`)**: The actual coordinate system where data lives. An Axes object contains the X and Y axes, ticks, grid lines, and plotted data. A single Figure can contain one or multiple Axes (subplots).
3. **Axis (`matplotlib.axis.Axis`)**: The individual 1D measurement lines (X-axis and Y-axis) controlling numerical scale, tick marks, and tick labels.
4. **Artists**: Everything visible on the plot is an Artist: lines (`Line2D`), bars, text labels, and legends.

### Why Procedural `plt.*` Fails in Production
When you call `plt.plot([1, 2], [3, 4])`:
- Matplotlib secretly checks an internal global state machine to find the "current" active figure and axes.
- If multiple requests or threads run concurrently, plots cross-talk and overwrite each other.
- Unclosed figures linger forever in `pyplot`'s global registry, causing catastrophic memory leaks.

**The Professional OOP Rule:** Always instantiate explicit figures and axes:
```python
fig, ax = plt.subplots(figsize=(8, 5))
ax.plot(x, y, label="Signal", color="#2563eb", linestyle="-", linewidth=2)
ax.set_xlabel("Time (s)")
ax.set_ylabel("Voltage (V)")
ax.set_title("Oscilloscope Reading")
ax.grid(True, linestyle=":", alpha=0.6)
ax.legend()
```

---

## 2. Line Plots & Line2D Properties
Calling `ax.plot(x, y, ...)` creates one or more `Line2D` artist objects attached to that `Axes`.

Key keyword arguments:
* **`color`**: Hex codes (`"#2563eb"`), named colors (`"royalblue"`), or RGBA tuples.
* **`linestyle`**: Solid (`"-"`), dashed (`"--"`), dash-dot (`"-."`), or dotted (`":"`).
* **`linewidth`**: Float specifying line thickness in points (e.g. `1.5`, `2.0`, `2.5`).
* **`marker`**: Marker symbol at data points: circle (`"o"`), square (`"s"`), triangle (`"^"`), diamond (`"D"`).
* **`markersize`**: Point size for markers (e.g. `6`, `8`).
* **`label`**: Name used when generating the legend.

---

## 3. Decorating the Coordinate System
A naked plot without labels or units is meaningless. The Axes object gives you direct methods to annotate the coordinate space:

* `ax.set_xlabel("Epoch", fontsize=11, fontweight="semibold")`
* `ax.set_ylabel("Cross-Entropy Loss", fontsize=11, fontweight="semibold")`
* `ax.set_title("Training Trajectory", fontsize=13, fontweight="bold", pad=10)`
* `ax.grid(True, linestyle="--", alpha=0.5)`
* `ax.legend(loc="upper right", frameon=True, framealpha=0.9)`
"""

WALKTHROUGH = r"""# Part 1 Code Walkthrough: Clean OOP Line Plotting

Let's build a clean training loss visualizer using Matplotlib's explicit OOP paradigm:

```python
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

# 1. Generate synthetic training progress data
epochs = np.arange(1, 11)
train_loss = 1.0 / np.sqrt(epochs) + 0.05 * np.random.randn(10)
val_loss = 1.1 / np.sqrt(epochs) + 0.15 + 0.05 * np.random.randn(10)

# 2. Instantiate explicit Figure and Axes
fig, ax = plt.subplots(figsize=(8, 5), dpi=100)

# 3. Add Line2D artists with explicit styling
ax.plot(epochs, train_loss, color="#2563eb", linestyle="-", linewidth=2.0, marker="o", markersize=5, label="Train Loss")
ax.plot(epochs, val_loss, color="#dc2626", linestyle="--", linewidth=2.0, marker="s", markersize=5, label="Validation Loss")

# 4. Polish labels, title, grid, and legend
ax.set_title("Model Convergence: Training vs Validation Loss", fontsize=12, fontweight="bold", pad=12)
ax.set_xlabel("Training Epoch", fontsize=10, fontweight="semibold")
ax.set_ylabel("Loss (Cross-Entropy)", fontsize=10, fontweight="semibold")
ax.grid(True, linestyle=":", alpha=0.6)
ax.legend(loc="upper right", frameon=True)

# 5. Clean up layout
fig.tight_layout()
```
"""

# -----------------------------------------------------------------------------
# Challenge 1: Metric Line Plot Generator
# -----------------------------------------------------------------------------

CHALLENGE_1 = {
    "id": "mpl-p1-c1",
    "title": "Metric Line Plot Generator",
    "difficulty": "Beginner",
    "category": "Plotting Foundations",
    "description": (
        "Construct an object-oriented visualization comparing model training and validation loss curves across epochs. "
        "Configure distinct line styles and widths, meaningful axis labels, a descriptive title, grid lines, "
        "and an informative legend."
    ),
    "instructions": (
        "Write a function `plot_metric_curves(epochs: list, train_loss: list, val_loss: list) -> tuple[plt.Figure, plt.Axes]` that:\n"
        "1. Validates inputs:\n"
        "   - If `len(epochs) == 0`, `len(train_loss) == 0`, or `len(val_loss) == 0`, raise `ValueError(\"Input sequences cannot be empty\")`.\n"
        "   - If lengths do not match (`len(epochs) != len(train_loss)` or `len(epochs) != len(val_loss)`), raise `ValueError(\"All input sequences must have identical length\")`.\n"
        "2. Initializes an explicit Figure and single Axes with a figure size of 8 by 5 inches (`figsize=(8, 5)`).\n"
        "3. Plots the training loss curve across epochs with label `\"Train Loss\"`, solid line style (`linestyle=\"-\"`), and line width of 2 (`linewidth=2`).\n"
        "4. Plots the validation loss curve across epochs with label `\"Validation Loss\"`, dashed line style (`linestyle=\"--\"`), and line width of 2 (`linewidth=2`).\n"
        "5. Sets the plot title to `\"Model Training vs Validation Loss\"`.\n"
        "6. Sets the x-axis label to `\"Epoch\"` and the y-axis label to `\"Loss\"`.\n"
        "7. Enables the chart grid lines.\n"
        "8. Displays the chart legend.\n"
        "9. Returns a tuple containing the Figure and Axes objects `(fig, ax)`."
    ),
    "starter_code": r'''import matplotlib.pyplot as plt
from typing import List, Tuple, Any

def plot_metric_curves(
    epochs: List[int],
    train_loss: List[float],
    val_loss: List[float]
) -> Tuple[plt.Figure, plt.Axes]:
    """
    Generate an OOP line plot comparing training and validation loss curves.
    
    Args:
        epochs: List or array of epoch numbers (e.g. [1, 2, 3, 4, 5])
        train_loss: List or array of training loss values
        val_loss: List or array of validation loss values
        
    Returns:
        (fig, ax) tuple containing the Figure and Axes objects
    """
    # TODO: Validate inputs, initialize figure/axes, plot metric curves, configure styling, and return (fig, ax)
    pass
''',
    "reference_solution": r'''import matplotlib.pyplot as plt
from typing import List, Tuple

def plot_metric_curves(
    epochs: List[int],
    train_loss: List[float],
    val_loss: List[float]
) -> Tuple[plt.Figure, plt.Axes]:
    """
    Generate an OOP line plot comparing training and validation loss curves.
    """
    if len(epochs) == 0 or len(train_loss) == 0 or len(val_loss) == 0:
        raise ValueError("Input sequences cannot be empty")
    if len(epochs) != len(train_loss) or len(epochs) != len(val_loss):
        raise ValueError("All input sequences must have identical length")
        
    fig, ax = plt.subplots(figsize=(8, 5))
    ax.plot(epochs, train_loss, label="Train Loss", linestyle="-", linewidth=2, color="#1f77b4")
    ax.plot(epochs, val_loss, label="Validation Loss", linestyle="--", linewidth=2, color="#d62728")
    
    ax.set_title("Model Training vs Validation Loss")
    ax.set_xlabel("Epoch")
    ax.set_ylabel("Loss")
    ax.grid(True)
    ax.legend()
    
    return fig, ax
''',
    "test_suite": r'''import matplotlib.pyplot as plt
import numpy as np
import io

def run_tests(candidate_func):
    """
    Automated test harness for Metric Line Plot Generator (mpl-p1-c1).
    """
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Test 1: Standard valid training series
    epochs = [1, 2, 3, 4, 5]
    train_loss = [0.95, 0.70, 0.52, 0.41, 0.35]
    val_loss = [0.98, 0.74, 0.59, 0.50, 0.48]
    
    result = candidate_func(epochs, train_loss, val_loss)
    
    if isinstance(result, tuple) and len(result) == 2:
        fig, ax = result
    elif isinstance(result, plt.Figure):
        fig = result
        ax = fig.axes[0]
    else:
        assert_test(False, f"Expected (fig, ax) tuple or Figure, got {type(result)}")
        return report

    assert_test(isinstance(fig, plt.Figure), "First returned element must be a matplotlib Figure")
    assert_test(isinstance(ax, plt.Axes), "Second returned element must be a matplotlib Axes")
    
    lines = ax.get_lines()
    assert_test(len(lines) == 2, f"Expected exactly 2 Line2D artists, found {len(lines)}")
    
    l1, l2 = lines[0], lines[1]
    np.testing.assert_allclose(l1.get_xdata(), epochs, err_msg="Line 1 x-data must match epochs")
    np.testing.assert_allclose(l1.get_ydata(), train_loss, err_msg="Line 1 y-data must match train_loss")
    np.testing.assert_allclose(l2.get_xdata(), epochs, err_msg="Line 2 x-data must match epochs")
    np.testing.assert_allclose(l2.get_ydata(), val_loss, err_msg="Line 2 y-data must match val_loss")
    
    styles = {l1.get_linestyle(), l2.get_linestyle()}
    assert_test("-" in styles, "One of the curves must have solid linestyle ('-')")
    assert_test("--" in styles, "One of the curves must have dashed linestyle ('--')")
    
    assert_test(len(ax.get_xlabel().strip()) > 0, "X-axis label must not be empty")
    assert_test("epoch" in ax.get_xlabel().lower(), f"X-axis label should mention 'Epoch', got '{ax.get_xlabel()}'")
    assert_test(len(ax.get_ylabel().strip()) > 0, "Y-axis label must not be empty")
    assert_test("loss" in ax.get_ylabel().lower(), f"Y-axis label should mention 'Loss', got '{ax.get_ylabel()}'")
    assert_test(len(ax.get_title().strip()) > 0, "Axes title must not be empty")
    
    legend = ax.get_legend()
    assert_test(legend is not None, "Legend must be created via ax.legend()")
    legend_texts = [t.get_text().lower() for t in legend.get_texts()]
    assert_test(any("train" in t for t in legend_texts), "Legend must include Train Loss label")
    assert_test(any("val" in t for t in legend_texts), "Legend must include Validation Loss label")
    
    x_gridlines = [g for g in ax.get_xgridlines() if g.get_visible()]
    assert_test(len(x_gridlines) > 0, "Grid lines should be visible")
    
    buf = io.BytesIO()
    fig.savefig(buf, format="png")
    assert_test(buf.tell() > 1000, "Figure failed to render a valid PNG")
    plt.close(fig)

    # Test 2: Input validation on empty lists
    raised_empty = False
    try:
        candidate_func([], [], [])
    except ValueError:
        raised_empty = True
    assert_test(raised_empty, "Expected ValueError on empty input sequences")

    # Test 3: Input validation on mismatched lengths
    raised_mismatch = False
    try:
        candidate_func([1, 2, 3], [0.5, 0.4], [0.6, 0.5, 0.4])
    except ValueError:
        raised_mismatch = True
    assert_test(raised_mismatch, "Expected ValueError on mismatched sequence lengths")

    return report
''',
    "hints": [
        "Call `fig, ax = plt.subplots(figsize=(8, 5))` to instantiate the canvas and axes.",
        "Use `ax.plot(epochs, train_loss, label='Train Loss', linestyle='-', linewidth=2)`.",
        "Use `ax.plot(epochs, val_loss, label='Validation Loss', linestyle='--', linewidth=2)`.",
        "Remember to call `ax.set_xlabel()`, `ax.set_ylabel()`, `ax.set_title()`, `ax.grid(True)`, and `ax.legend()` before returning."
    ]
}

# -----------------------------------------------------------------------------
# Challenge 2: Multi-Line Trajectory Visualizer
# -----------------------------------------------------------------------------

CHALLENGE_2 = {
    "id": "mpl-p1-c2",
    "title": "Multi-Line Trajectory Visualizer",
    "difficulty": "Beginner",
    "category": "Plotting Foundations",
    "description": (
        "Visualize multiple agent or sensor trajectories across common time steps. "
        "Iterate dynamically over an arbitrary dictionary of named trajectories, assigning "
        "distinct linestyles, markers, and labels to ensure unambiguous tracking."
    ),
    "instructions": (
        "Write a function `plot_trajectories(time_steps: list, trajectories: dict) -> tuple[plt.Figure, plt.Axes]` that:\n"
        "1. Validates inputs:\n"
        "   - If `len(time_steps) == 0` or `len(trajectories) == 0`, raise `ValueError(\"Inputs cannot be empty\")`.\n"
        "   - If any trajectory series has a length different from `len(time_steps)`, raise `ValueError(\"All trajectories must match time_steps length\")`.\n"
        "2. Initializes a Figure and single Axes with a figure size of 9 by 5 inches (`figsize=(9, 5)`).\n"
        "3. Cycles through distinct line styles (`[\"-\", \"--\", \"-.\", \":\"]`) and markers (`[\"o\", \"s\", \"^\", \"D\", \"v\"]`) "
        "   for each trajectory in `trajectories.items()`.\n"
        "4. Plots each trajectory curve across `time_steps` with its entity name as the legend label, applying the cycled line style and marker.\n"
        "5. Sets the plot title to `\"Multi-Agent Trajectory Tracking\"`.\n"
        "6. Sets the x-axis label to `\"Time (s)\"` and the y-axis label to `\"Position (m)\"`.\n"
        "7. Enables subtle dotted grid lines (`linestyle=\":\"`, `alpha=0.6`).\n"
        "8. Displays the legend positioned at the optimal automatic location (`loc=\"best\"`).\n"
        "9. Returns the `(fig, ax)` tuple."
    ),
    "starter_code": r'''import matplotlib.pyplot as plt
from typing import List, Dict, Tuple, Any

def plot_trajectories(
    time_steps: List[float],
    trajectories: Dict[str, List[float]]
) -> Tuple[plt.Figure, plt.Axes]:
    """
    Plot multiple trajectories with distinct linestyles and markers.
    
    Args:
        time_steps: List of timestamps (x-coordinates)
        trajectories: Dict mapping series names to lists of positions (y-coordinates)
        
    Returns:
        (fig, ax) tuple containing the Figure and Axes objects
    """
    # TODO: Validate inputs, initialize figure/axes, cycle styles and markers, plot trajectories, style, and return (fig, ax)
    pass
''',
    "reference_solution": r'''import matplotlib.pyplot as plt
from typing import List, Dict, Tuple

def plot_trajectories(
    time_steps: List[float],
    trajectories: Dict[str, List[float]]
) -> Tuple[plt.Figure, plt.Axes]:
    """
    Plot multiple trajectories with distinct linestyles and markers.
    """
    if len(time_steps) == 0 or len(trajectories) == 0:
        raise ValueError("Inputs cannot be empty")
        
    for name, series in trajectories.items():
        if len(series) != len(time_steps):
            raise ValueError(f"Trajectory '{name}' length does not match time_steps")
            
    fig, ax = plt.subplots(figsize=(9, 5))
    
    styles = ["-", "--", "-.", ":"]
    markers = ["o", "s", "^", "D", "v"]
    
    for i, (name, series) in enumerate(trajectories.items()):
        ls = styles[i % len(styles)]
        mk = markers[i % len(markers)]
        ax.plot(time_steps, series, label=name, linestyle=ls, marker=mk, markersize=5, linewidth=1.8)
        
    ax.set_title("Multi-Agent Trajectory Tracking")
    ax.set_xlabel("Time (s)")
    ax.set_ylabel("Position (m)")
    ax.grid(True, linestyle=":", alpha=0.6)
    ax.legend(loc="best")
    
    return fig, ax
''',
    "test_suite": r'''import matplotlib.pyplot as plt
import numpy as np
import io

def run_tests(candidate_func):
    """
    Automated test harness for Multi-Line Trajectory Visualizer (mpl-p1-c2).
    """
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Test 1: Standard dictionary with 3 agents
    t = [0.0, 1.0, 2.0, 3.0, 4.0]
    agents = {
        "Agent Alpha": [0.0, 2.1, 4.2, 5.8, 7.9],
        "Agent Beta":  [1.0, 1.8, 3.1, 4.5, 6.2],
        "Agent Gamma": [0.5, 1.2, 2.0, 3.4, 4.8]
    }
    
    result = candidate_func(t, agents)
    if isinstance(result, tuple) and len(result) == 2:
        fig, ax = result
    elif isinstance(result, plt.Figure):
        fig = result
        ax = fig.axes[0]
    else:
        assert_test(False, f"Expected (fig, ax) tuple or Figure, got {type(result)}")
        return report

    assert_test(isinstance(fig, plt.Figure), "First element must be Figure")
    assert_test(isinstance(ax, plt.Axes), "Second element must be Axes")
    
    lines = ax.get_lines()
    assert_test(len(lines) == 3, f"Expected 3 Line2D artists, found {len(lines)}")
    
    labels = {l.get_label() for l in lines}
    assert_test(labels == set(agents.keys()), f"Line labels mismatch: {labels} vs {set(agents.keys())}")
    
    for l in lines:
        name = l.get_label()
        np.testing.assert_allclose(l.get_xdata(), t, err_msg=f"{name} x-data mismatch")
        np.testing.assert_allclose(l.get_ydata(), agents[name], err_msg=f"{name} y-data mismatch")
        assert_test(l.get_marker() is not None and l.get_marker() != "", f"{name} must have a marker")
        
    assert_test("trajectory" in ax.get_title().lower(), "Title should mention 'Trajectory'")
    assert_test("time" in ax.get_xlabel().lower(), "X-label should mention 'Time'")
    assert_test("position" in ax.get_ylabel().lower(), "Y-label should mention 'Position'")
    
    legend = ax.get_legend()
    assert_test(legend is not None, "Legend must be present")
    assert_test(len(legend.get_texts()) == 3, "Legend should contain 3 entries")
    
    buf = io.BytesIO()
    fig.savefig(buf, format="png")
    assert_test(buf.tell() > 1000, "Figure rendering failed")
    plt.close(fig)

    # Test 2: Validation on empty inputs
    raised_empty = False
    try:
        candidate_func([], {})
    except ValueError:
        raised_empty = True
    assert_test(raised_empty, "Expected ValueError on empty inputs")

    # Test 3: Validation on mismatched series length
    raised_mismatch = False
    try:
        candidate_func([0.0, 1.0, 2.0], {"BadAgent": [1.0, 2.0]})
    except ValueError:
        raised_mismatch = True
    assert_test(raised_mismatch, "Expected ValueError on mismatched length")

    return report
''',
    "hints": [
        "Iterate over `trajectories.items()` using `enumerate` to cycle through linestyles and markers.",
        "Use `styles[i % len(styles)]` and `markers[i % len(markers)]` to avoid IndexErrors.",
        "Set `label=name` in `ax.plot()` so `ax.legend()` labels each trajectory automatically."
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
