import type { DayTrack, Challenge, ConceptPrimerData, TestCase } from '../../types';

export type { DayTrack, Challenge, ConceptPrimerData, TestCase };

const challenge1TestCases: TestCase[] = [
  {
    id: 't1',
    name: 'Standard 4-Panel Model Diagnostics',
    inputDescription: 'epochs=[1, 2, 3, 4], train_loss=[0.8, 0.5, 0.3, 0.2], val_loss=[0.85, 0.55, 0.38, 0.32], fpr=[0, 0.1, 0.3, 1], tpr=[0, 0.6, 0.85, 1], conf_matrix=[[85, 15], [10, 90]]',
    expectedOutput: '(fig, axes) with 4 distinct subplots: ROC, PR, Loss, and Confusion Matrix with cell numbers'
  },
  {
    id: 't2',
    name: 'Invalid Confusion Matrix Shape',
    inputDescription: 'conf_matrix=[[1, 2, 3]] (not 2x2)',
    expectedOutput: 'Raises ValueError("conf_matrix must be 2x2")'
  },
  {
    id: 't3',
    name: 'Empty Sequence Validation',
    inputDescription: 'epochs=[], train_loss=[]',
    expectedOutput: 'Raises ValueError("Inputs cannot be empty")'
  }
];

const challenge2TestCases: TestCase[] = [
  {
    id: 't1',
    name: 'Financial Price and Volume Tracking',
    inputDescription: 'dates=["D1", "D2", "D3", "D4", "D5"], prices=[150, 153, 149, 155, 158], volumes=[1.2e6, 1.8e6, 9.4e5, 2.1e6, 1.6e6]',
    expectedOutput: '(fig, (ax_vol, ax_price)) with primary volume bars and secondary price line sharing X axis'
  },
  {
    id: 't2',
    name: 'Mismatched Sequence Lengths',
    inputDescription: 'dates=["D1", "D2"], prices=[150, 153, 149], volumes=[1.2e6, 1.8e6]',
    expectedOutput: 'Raises ValueError("Sequence lengths must match")'
  },
  {
    id: 't3',
    name: 'Empty Inputs Check',
    inputDescription: 'dates=[], prices=[], volumes=[]',
    expectedOutput: 'Raises ValueError("Inputs cannot be empty")'
  }
];

export const testCases: TestCase[] = [...challenge1TestCases, ...challenge2TestCases];

export const DAY03_TRACK: DayTrack = {
  partNumber: 3,
  partId: 3,
  dayNumber: 3,
  id: 3,
  title: 'Part 3: Subplots & Multi-Panel Grids',
  subtitle: 'Master 2D subplot grids, multi-panel diagnostic dashboards, and secondary twin axes',
  description: 'Learn how to construct multi-panel dashboards using plt.subplots(nrows, ncols). Master 2D axes array indexing ax[row, col], shared coordinate axes (sharex, sharey), heatmaps with ax.imshow() and text overlays, and dual-scale time series using ax.twinx().',
  iconName: 'LayoutGrid',
  badge: 'Part 3 • Subplots & Grids',
  libraryMechanics: {
    libraryName: 'Matplotlib Subplots & Multi-Panel Grids',
    tagline: 'Multi-Panel Dashboards & Synchronized Coordinate Spaces',
    overview: `### 📊 Moving Beyond Single Plots: The Multi-Panel Grid
Production machine learning models require multi-faceted evaluation: an ROC curve alone does not tell you calibration, loss curves do not show precision-recall trade-offs, and confusion matrices require categorical breakdown.

### 📐 The 2D Array of Axes
When you request a grid with \`plt.subplots(nrows, ncols)\`:
- Matplotlib returns a 2D NumPy array of \`Axes\` objects with shape \`(nrows, ncols)\`.
- You index panels using matrix coordinates: \`axes[row, col]\`.
- For loops can traverse all panels cleanly using \`axes.ravel()\`.

### 🔄 Dual Scales with ax.twinx()
When comparing quantities with different units across the same time window (e.g. trading volume in millions of shares vs stock price in dollars), secondary twin axes allow dual independent Y-scales over a shared X-axis.`,
    whyItExists: `Complex analytics require presenting multiple related perspectives at once.
Without subplots, you are forced to generate disjointed image files that cannot be reviewed simultaneously.
Subplots give you a single unified Figure that aligns axes, shares scales, and exports as a coherent artifact.`,
    coreAnatomy: {
      objectName: 'Subplot Grid & Twin Axes',
      description: 'The grid array of Axes objects and secondary twin coordinate systems.',
      fields: [
        {
          name: 'axes[row, col]',
          type: 'np.ndarray of matplotlib.axes.Axes',
          role: '2D array allowing matrix-like coordinate access to each panel in the grid.'
        },
        {
          name: 'ax.twinx()',
          type: 'matplotlib.axes.Axes',
          role: 'A secondary invisible Axes sharing the primary X-axis but with independent Y-axis scale on the right.'
        },
        {
          name: 'AxesImage',
          type: 'matplotlib.image.AxesImage',
          role: 'Artist created by ax.imshow() for raster heatmaps and matrix representations.'
        },
        {
          name: 'fig.tight_layout()',
          type: 'method',
          role: 'Automatically computes padding between subplots to prevent overlapping titles and tick labels.'
        }
      ],
      memoryDiagramAscii: `+-------------------------------------------------------------+
|                2x2 Subplot Grid: axes[row, col]             |
|  +---------------------------+ +-------------------------+  |
|  | axes[0, 0]: ROC Curve     | | axes[0, 1]: PR Curve    |  |
|  +---------------------------+ +-------------------------+  |
|  +---------------------------+ +-------------------------+  |
|  | axes[1, 0]: Loss Curves   | | axes[1, 1]: Confusion M.|  |
|  +---------------------------+ +-------------------------+  |
|               fig.tight_layout() clears margins              |
+-------------------------------------------------------------+`
    },
    chapters: [
      {
        id: 'ch1-grid-indexing',
        title: '2D Subplot Grid Indexing',
        icon: 'Grid',
        summary: 'Mastering plt.subplots(nrows, ncols) and matrix-style indexing.',
        markdownContent: `### Matrix Indexing of Subplots

When creating multi-panel grids:
\`\`\`python
fig, axes = plt.subplots(2, 2, figsize=(10, 8))

# Access panels by row and column
axes[0, 0].plot(roc_fpr, roc_tpr)    # Top-Left
axes[0, 1].plot(pr_recall, pr_prec)  # Top-Right
axes[1, 0].plot(epochs, loss)        # Bottom-Left
axes[1, 1].imshow(conf_matrix)       # Bottom-Right

fig.tight_layout()
\`\`\`

> **Note:** If \`nrows=1\` or \`ncols=1\`, Matplotlib returns a 1D array. When both are 1, it returns a scalar \`Axes\`. When \`nrows > 1\` and \`ncols > 1\`, it returns a 2D array.`
      },
      {
        id: 'ch2-heatmaps-confusion-matrices',
        title: 'Confusion Matrices with ax.imshow()',
        icon: 'Table',
        summary: 'Rendering matrix heatmaps and overlaying high-contrast numerical text.',
        markdownContent: `### Heatmaps and Dynamic Text Contrast

\`ax.imshow()\` displays numerical matrices as colormapped pixels.
To display numerical counts inside each cell:
\`\`\`python
ax.imshow(cm, cmap="Blues")
thresh = cm.max() / 2.0

for i in range(cm.shape[0]):
    for j in range(cm.shape[1]):
        val = cm[i, j]
        color = "white" if val > thresh else "black"
        ax.text(j, i, str(val), ha="center", va="center", color=color, fontweight="bold")
\`\`\``
      },
      {
        id: 'ch3-twinx-axes',
        title: 'Dual-Scale Secondary Axes (ax.twinx)',
        icon: 'TrendingUp',
        summary: 'Plotting volume and price on different Y scales over a shared X-axis.',
        markdownContent: `### Merging Dual Y-Scales

When plotting volume and price:
\`\`\`python
fig, ax1 = plt.subplots(figsize=(10, 5))
ax2 = ax1.twinx()

# Primary axis: Volume bars
ax1.bar(dates, volume, alpha=0.3, color="gray", label="Volume")
ax1.set_ylabel("Volume (Shares)")

# Secondary axis: Price line
ax2.plot(dates, price, color="#2563eb", linewidth=2, label="Price ($)")
ax2.set_ylabel("Price ($)")

# Unified legend
h1, l1 = ax1.get_legend_handles_labels()
h2, l2 = ax2.get_legend_handles_labels()
ax2.legend(h1 + h2, l1 + l2, loc="upper left")
\`\`\``
      }
    ],
    commonTraps: [
      {
        title: 'Indexing 1D subplots with 2D coordinates',
        badSnippet: `fig, axes = plt.subplots(1, 2)
axes[0, 0].plot(x, y)  # IndexError: too many indices for array!`,
        badExplanation: 'When nrows=1 or ncols=1, axes is 1D (shape: (2,)). Indexing with [0, 0] crashes.',
        goodSnippet: `fig, (ax1, ax2) = plt.subplots(1, 2)
# or: fig, axes = plt.subplots(2, 2) -> axes[0, 0] works for 2D grids`,
        goodExplanation: 'Unpack 1D subplots as a tuple (ax1, ax2) or use 2D indexing only when both nrows > 1 and ncols > 1.',
        perfImpact: 'Eliminates unexpected IndexError crashes.'
      },
      {
        title: 'Forgetting fig.tight_layout() on multi-panel grids',
        badSnippet: `# Subplots rendered without layout adjustment:
# Titles collide with tick marks of the row above!`,
        badExplanation: 'Matplotlib defaults can cause subplot titles and axis labels to overlap.',
        goodSnippet: `fig, axes = plt.subplots(2, 2)
# ... populate panels ...
fig.tight_layout()`,
        goodExplanation: 'tight_layout automatically recalculates subplots padding to ensure all labels remain distinct.',
        perfImpact: 'Guarantees clean, publication-ready alignment.'
      }
    ],
    apiCheatSheet: [
      {
        name: 'plt.subplots',
        category: 'Grid Creation',
        signature: 'plt.subplots(nrows, ncols, sharex=False, sharey=False, figsize=None, ...)',
        summary: 'Create a Figure and a 2D or 1D array of subplots.',
        parameters: [
          { name: 'nrows', type: 'int', desc: 'Number of rows in the grid.' },
          { name: 'ncols', type: 'int', desc: 'Number of columns in the grid.' },
          { name: 'sharex, sharey', type: 'bool', desc: 'Share x or y axis coordinates across panels.' }
        ],
        returns: '(fig, axes) where axes is an ndarray of Axes.',
        exampleSnippet: `fig, axes = plt.subplots(2, 2, figsize=(11, 9))`
      },
      {
        name: 'ax.twinx',
        category: 'Secondary Axis',
        signature: 'ax.twinx()',
        summary: 'Create a twin Axes sharing the X-axis with independent Y-axis.',
        parameters: [],
        returns: 'matplotlib.axes.Axes object.',
        exampleSnippet: `ax_price = ax_vol.twinx()`
      },
      {
        name: 'ax.imshow',
        category: 'Images & Matrices',
        signature: 'ax.imshow(X, cmap=None, aspect=None, interpolation=None, ...)',
        summary: 'Display data as an image on a 2D regular raster.',
        parameters: [
          { name: 'X', type: 'array-like', desc: '2D matrix of numerical values.' },
          { name: 'cmap', type: 'str | Colormap', desc: 'Colormap for heatmap mapping.' }
        ],
        returns: 'AxesImage artist.',
        exampleSnippet: `im = ax.imshow(conf_matrix, cmap="Blues")`
      },
      {
        name: 'fig.tight_layout',
        category: 'Layout',
        signature: 'fig.tight_layout(pad=1.08, h_pad=None, w_pad=None, ...)',
        summary: 'Adjust subplot parameters to give specified padding.',
        parameters: [
          { name: 'pad', type: 'float', desc: 'Padding between figure edge and edges of subplots.' }
        ],
        returns: 'None.',
        exampleSnippet: `fig.tight_layout()`
      }
    ],
    interactiveWidgetType: 'matplotlib-artists'
  },
  challenges: [
    {
      id: 'mpl-p3-c1',
      dayId: 3,
      partId: 3,
      title: '2x2 Model Diagnostic Grid',
      slug: 'model-diagnostic-grid',
      difficulty: 'Advanced',
      category: 'Subplots & Grids',
      summary: 'Construct a publication-grade 4-panel ML diagnostic dashboard featuring ROC curve, PR curve, Loss curves, and a Confusion Matrix with cell annotations.',
      mentalModel5s: 'Index axes[r, c] for each panel: (0,0) ROC, (0,1) PR, (1,0) Loss, (1,1) Confusion Matrix.',
      visualAnalogy: 'A flight simulator instrument dashboard: flight horizon, altimeter, engine RPM, and GPS radar all in their dedicated quadrant.',
      pitfalls: [
        'Overlapping text labels between subplots (always call fig.tight_layout()).',
        'Not converting confusion matrix cell text color based on cell brightness threshold.'
      ],
      progressiveHints: [
        'Check that input arrays are non-empty and conf_matrix has shape (2, 2).',
        'Call fig, axes = plt.subplots(2, 2, figsize=(11, 9)).',
        'Plot ROC on axes[0, 0] and baseline [0, 1] vs [0, 1].',
        'Plot PR on axes[0, 1].',
        'Plot Train Loss and Val Loss on axes[1, 0].',
        'Display conf_matrix on axes[1, 1] with imshow and iterate with text() for cell numbers.',
        'Apply fig.tight_layout() and return (fig, axes).'
      ],
      deepInternals: {
        title: 'Tight Layout & Transform Geometries',
        content: 'fig.tight_layout() performs a bounding box calculation of all text and tick artists in figure pixel space, automatically adjusting subplots margins (left, right, bottom, top, wspace, hspace).',
        keyRule: 'Always call fig.tight_layout() after adding all text, legends, and colorbars.'
      },
      instructions: `In production machine learning, summarizing model performance in a single multi-panel diagnostic figure is the gold standard for model evaluation reports.

Write a function \`create_diagnostic_grid(epochs: list, train_loss: list, val_loss: list, fpr: np.ndarray, tpr: np.ndarray, precision: np.ndarray, recall: np.ndarray, conf_matrix: np.ndarray) -> tuple[plt.Figure, np.ndarray]\` that:
1. Validates inputs:
   - If any sequence is empty, raise \`ValueError("Inputs cannot be empty")\`.
   - If \`conf_matrix\` is not a 2D array of shape \`(2, 2)\`, raise \`ValueError("conf_matrix must be 2x2")\`.
2. Creates a 2x2 grid of subplot axes with a figure size of 11 by 9 inches (\`figsize=(11, 9)\`).
3. Panel (0, 0) - ROC Curve:
   - Plots \`fpr\` vs \`tpr\` with \`color="#2563eb"\`, \`linewidth=2\`, and \`label="ROC"\`.
   - Plots dashed chance baseline \`[0, 1]\` vs \`[0, 1]\` with \`color="gray"\` and \`linestyle="--"\`.
   - Sets the title to \`"ROC Curve"\`, the x-axis label to \`"False Positive Rate"\`, the y-axis label to \`"True Positive Rate"\`, and enables the legend and grid.
4. Panel (0, 1) - Precision-Recall Curve:
   - Plots \`recall\` vs \`precision\` with \`color="#059669"\`, \`linewidth=2\`, and \`label="PR"\`.
   - Sets the title to \`"Precision-Recall Curve"\`, the x-axis label to \`"Recall"\`, the y-axis label to \`"Precision"\`, and enables the legend and grid.
5. Panel (1, 0) - Loss Curves:
   - Plots \`epochs\` vs \`train_loss\` (\`color="#2563eb"\`, \`label="Train Loss"\`).
   - Plots \`epochs\` vs \`val_loss\` (\`color="#dc2626"\`, \`linestyle="--"\`, \`label="Val Loss"\`).
   - Sets the title to \`"Epoch Loss"\`, the x-axis label to \`"Epoch"\`, the y-axis label to \`"Loss"\`, and enables the legend and grid.
6. Panel (1, 1) - Confusion Matrix:
   - Displays the confusion matrix as a heatmap image (\`cmap="Blues"\`).
   - Annotates each cell $(i, j)$ with its integer value centered within the cell in bold text, using white text if \`val > conf_matrix.max() / 2\` else black for contrast.
   - Sets x-ticks and y-ticks to \`[0, 1]\` with tick labels \`["Pred 0", "Pred 1"]\` and \`["True 0", "True 1"]\`.
   - Sets the title to \`"Confusion Matrix"\`, the x-axis label to \`"Predicted"\`, and the y-axis label to \`"Actual"\`.
7. Applies tight layout padding and returns \`(fig, axes)\`.`,
      hints: [
        'Access panels with axes[0, 0], axes[0, 1], axes[1, 0], axes[1, 1].',
        'Use imshow(conf_matrix, cmap="Blues") for the confusion matrix.',
        'Use nested loops for i in range(2): for j in range(2): to write numbers in each matrix cell.'
      ],
      starterCode: `import matplotlib.pyplot as plt
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
`,
      solutionCode: `import matplotlib.pyplot as plt
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
`,
      testCases: challenge1TestCases,
      conceptPrimer: {
        title: 'Multi-Panel Diagnostic Layouts',
        subtitle: 'Holistic model evaluation across 4 complementary views',
        overview: 'Build complete model performance profiles combining classification thresholds, learning dynamics, and error matrices.',
        mentalModel5s: 'Group related diagnostic metrics into a 2x2 grid with tight_layout.',
        visualAnalogy: 'A car dashboard displaying speedometer, fuel gauge, engine temp, and oil pressure side-by-side.',
        pitfalls: [
          'Forgetting tight_layout leading to overlapping titles.',
          'Hardcoding text colors in heatmaps causing illegible contrast on dark cells.'
        ],
        progressiveHints: [
          'Verify input shapes and dimensions.',
          'Create 2x2 grid via plt.subplots(2, 2).',
          'Populate each quadrant independently.',
          'Format confusion matrix ticks and callouts.'
        ],
        mathFormulas: [
          {
            title: 'Confusion Matrix Precision & Recall',
            latex: '\\text{Precision} = \\frac{TP}{TP + FP}, \\quad \\text{Recall} = \\frac{TP}{TP + FN}',
            explanation: 'Metrics plotted across diagnostic curves in panels 1 and 2.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Displaying 4 plots across 4 separate files
plt.plot(fpr, tpr)
plt.savefig("roc.png")
plt.plot(rec, prec)
plt.savefig("pr.png")`,
          naiveExplanation: 'Disjointed images require cumbersome manual comparison.',
          idiomaticCode: `# Integrated 2x2 diagnostic grid
fig, axes = plt.subplots(2, 2, figsize=(11, 9))
# Plot all 4 panels in one figure
fig.tight_layout()`,
          idiomaticExplanation: 'One cohesive figure presenting all performance aspects simultaneously.',
          speedupText: 'Unified 4-in-1 artifact'
        },
        memoryLayout: {
          title: '2D Axes Array Layout',
          content: 'plt.subplots(2, 2) creates a (2, 2) NumPy array of Axes pointers.',
          diagramAscii: `axes = [[ Axes(0,0), Axes(0,1) ],
        [ Axes(1,0), Axes(1,1) ]]`,
          keyRule: 'Index subplots using 2D coordinates: axes[row, col].'
        },
        keyTakeaways: [
          'Use 2x2 grids for holistic diagnostic reporting.',
          'Use cell text contrast switching in confusion matrix heatmaps.',
          'Always call fig.tight_layout() to prevent label overlap.'
        ]
      },
      benchmarkTargetMs: 120,
      memoryTargetMb: 30
    },
    {
      id: 'mpl-p3-c2',
      dayId: 3,
      partId: 3,
      title: 'Twin-Axes Multi-Scale Visualizer',
      slug: 'twin-axes-volume-price',
      difficulty: 'Intermediate',
      category: 'Subplots & Grids',
      summary: 'Pair primary and secondary axes to plot trading volume bars and stock price curves across a shared timeline.',
      mentalModel5s: 'A secondary twin axis shares the horizontal X space while decoupling the vertical Y scales.',
      visualAnalogy: 'Two transparent film sheets laid over each other: sheet 1 has volume bars, sheet 2 has price line.',
      pitfalls: [
        'Plotting volume and price on the same axis, causing the smaller metric to flatten into a horizontal line.',
        'Having separate disjointed legends instead of a unified merged legend.'
      ],
      progressiveHints: [
        'Check that dates, prices, and volumes are non-empty and equal length.',
        'Create primary ax_vol with plt.subplots(), then create ax_price = ax_vol.twinx().',
        'Plot volume as bars on ax_vol and price as a line on ax_price.',
        'Combine handles and labels: h1, l1 = ax_vol.get_legend_handles_labels() and h2, l2 = ax_price.get_legend_handles_labels().',
        'Display unified legend on ax_price with ax_price.legend(h1 + h2, l1 + l2).'
      ],
      deepInternals: {
        title: 'Twin Axes Coordinate Coupling',
        content: 'ax.twinx() creates an independent Axes object that shares the primary Axes XAxis data transform while maintaining its own YAxis scale and ticks on the right spine.',
        keyRule: 'Set independent Y labels on both axes: ax_vol.set_ylabel() and ax_price.set_ylabel().'
      },
      instructions: `In quantitative finance and operations monitoring, you frequently track high-magnitude counts (e.g. trading volume in millions) alongside continuous values (e.g. stock price in dollars).

Write a function \`plot_volume_price_twin(dates: list, prices: list, volumes: list) -> tuple[plt.Figure, tuple[plt.Axes, plt.Axes]]\` that:
1. Validates inputs:
   - If \`len(dates) == 0\`, \`len(prices) == 0\`, or \`len(volumes) == 0\`, raise \`ValueError("Inputs cannot be empty")\`.
   - If lengths do not match (\`len(dates) != len(prices)\` or \`len(dates) != len(volumes)\`), raise \`ValueError("Sequence lengths must match")\`.
2. Initializes a primary Figure and single Axes with a figure size of 10 by 5 inches (\`figsize=(10, 5)\`).
3. Creates a secondary y-axis sharing the same x-axis (\`ax_price\`).
4. Primary Axis (\`ax_vol\`):
   - Renders trading volume as a bar chart (\`color="#94a3b8"\`, \`alpha=0.4\`, \`width=0.6\`, \`label="Volume"\`).
   - Sets the y-axis label to \`"Volume (Shares)"\` and the x-axis label to \`"Date"\`.
   - Sets the chart title to \`"Price & Volume History"\`.
5. Secondary Axis (\`ax_price\`):
   - Plots closing price as a line curve across \`dates\` (\`color="#2563eb"\`, \`linewidth=2.2\`, \`label="Price ($)"\`).
   - Sets the secondary y-axis label to \`"Price ($)"\`.
6. Unified Legend:
   - Combines artist handles and labels from both the primary volume axis and secondary price axis to display a single consolidated legend on either axis.
7. Returns the \`(fig, (ax_vol, ax_price))\` tuple.`,
      hints: [
        'Call ax_price = ax_vol.twinx() to make the secondary axis.',
        'Use ax_vol.bar for volume and ax_price.plot for price.',
        'To merge legends: h1, l1 = ax_vol.get_legend_handles_labels(), h2, l2 = ax_price.get_legend_handles_labels(), then ax_price.legend(h1 + h2, l1 + l2).'
      ],
      starterCode: `import matplotlib.pyplot as plt
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
`,
      solutionCode: `import matplotlib.pyplot as plt
from typing import List, Tuple

def plot_volume_price_twin(
    dates: List[str],
    prices: List[float],
    volumes: List[int]
) -> Tuple[plt.Figure, Tuple[plt.Axes, plt.Axes]]:
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
`,
      testCases: challenge2TestCases,
      conceptPrimer: {
        title: 'Twin-Axes Multi-Scale Visualizations',
        subtitle: 'Decoupling vertical scales over a shared time horizon',
        overview: 'Plot quantities with different units and scales on a shared X axis without flattening either signal.',
        mentalModel5s: 'ax.twinx() shares X coordinates while giving each metric its own independent Y scale.',
        visualAnalogy: 'Displaying temperature (Celsius) and rainfall (millimeters) on the same weather forecast chart.',
        pitfalls: [
          'Trying to plot volume (millions) and price (tens) on one Y scale.',
          'Missing labels on the secondary Y axis.'
        ],
        progressiveHints: [
          'Create primary ax with plt.subplots().',
          'Create secondary ax with ax.twinx().',
          'Plot bars on primary and line on secondary.',
          'Extract and combine legend handles.'
        ],
        mathFormulas: [
          {
            title: 'Decoupled Linear Normalization',
            latex: 'y_1 \\in [\\min(V), \\max(V)], \\quad y_2 \\in [\\min(P), \\max(P)]',
            explanation: 'Each axis manages its own independent data-to-pixel transform.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Single axis for both volume and price
ax.plot(dates, prices)
ax.bar(dates, volumes)  # Prices flattened to the floor at y=0!`,
          naiveExplanation: 'Price variation is invisible because volume scale dominates.',
          idiomaticCode: `# Decoupled twin axes
ax_vol = fig.add_subplot()
ax_price = ax_vol.twinx()
ax_vol.bar(dates, volumes)
ax_price.plot(dates, prices)`,
          idiomaticExplanation: 'Both metrics retain full vertical dynamic range.',
          speedupText: 'Dual readable scales'
        },
        memoryLayout: {
          title: 'Twin Axes Layout',
          content: 'Figure holds two Axes objects occupying the exact same bounding box.',
          diagramAscii: `Figure.axes = [ ax_vol (Y-left), ax_price (Y-right) ]`,
          keyRule: 'Shared XAxis; independent YAxis on left and right spines.'
        },
        keyTakeaways: [
          'Use ax.twinx() whenever units or magnitudes differ significantly.',
          'Label both left and right Y-axes clearly.',
          'Combine handles from both axes for a unified legend.'
        ]
      },
      benchmarkTargetMs: 90,
      memoryTargetMb: 25
    }
  ]
};

export const MATPLOTLIB_PART03_TRACK = DAY03_TRACK;
export default DAY03_TRACK;
