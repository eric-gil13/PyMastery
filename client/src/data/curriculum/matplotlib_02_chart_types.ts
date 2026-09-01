import type { DayTrack, Challenge, ConceptPrimerData, TestCase } from '../../types';

export type { DayTrack, Challenge, ConceptPrimerData, TestCase };

const challenge1TestCases: TestCase[] = [
  {
    id: 't1',
    name: 'Feature Correlation with Color Mapping',
    inputDescription: 'x=[1, 2, 3, 4, 5, 6], y=[2.5, 3.8, 5.1, 7.2, 8.9, 11.0], categories=["Alpha", "Beta", "Alpha", "Gamma", "Beta", "Alpha"], color_values=[10, 20, 15, 40, 25, 12]',
    expectedOutput: '(fig, (ax_scatter, ax_bar)) with PathCollection on left and BarContainer on right'
  },
  {
    id: 't2',
    name: 'Without Color Values (Default Solid Color)',
    inputDescription: 'x=[1, 2, 3], y=[4, 5, 6], categories=["A", "B", "A"], color_values=None',
    expectedOutput: 'Scatter plot rendered with default color without error'
  },
  {
    id: 't3',
    name: 'Empty Sequence Validation',
    inputDescription: 'x=[], y=[], categories=[]',
    expectedOutput: 'Raises ValueError("Inputs cannot be empty")'
  },
  {
    id: 't4',
    name: 'Mismatched Feature Lengths',
    inputDescription: 'x=[1, 2], y=[1, 2, 3], categories=["A", "B"]',
    expectedOutput: 'Raises ValueError("Length mismatch between features and categories")'
  }
];

const challenge2TestCases: TestCase[] = [
  {
    id: 't1',
    name: 'Normal Distribution Sample',
    inputDescription: 'data=np.random.normal(10, 2.5, 500), bins=25',
    expectedOutput: '(fig, ax) with normalized density histogram, theoretical Gaussian line, and mean axvline'
  },
  {
    id: 't2',
    name: 'Small Sample Size (< 2 points)',
    inputDescription: 'data=[42.0], bins=10',
    expectedOutput: 'Raises ValueError("data must contain at least 2 points")'
  },
  {
    id: 't3',
    name: 'Zero Variance Constant Data',
    inputDescription: 'data=[5.0, 5.0, 5.0, 5.0], bins=10',
    expectedOutput: 'Raises ValueError("Data must have non-zero variance")'
  },
  {
    id: 't4',
    name: 'Invalid Bins (< 1)',
    inputDescription: 'data=[1.0, 2.0, 3.0], bins=0',
    expectedOutput: 'Raises ValueError("bins must be at least 1")'
  }
];

export const testCases: TestCase[] = [...challenge1TestCases, ...challenge2TestCases];

export const DAY02_TRACK: DayTrack = {
  partNumber: 2,
  partId: 2,
  dayNumber: 2,
  id: 2,
  title: 'Part 2: Essential Chart Types',
  subtitle: 'Master scatter plots for correlation, bar charts for categories, and histograms for distributions',
  description: 'Learn how to choose the right chart type for your data. Construct scatter plots with continuous colormaps, compare categorical frequencies with vertical and horizontal bar charts, and plot normalized density histograms overlaid with analytical normal distributions.',
  iconName: 'BarChart3',
  badge: 'Part 2 • Essential Chart Types',
  libraryMechanics: {
    libraryName: 'Matplotlib Chart Types',
    tagline: 'Choosing the Right Visual Encoding for Your Data',
    overview: `### 🎯 The Art of Visual Encodings
In applied data science, choosing the wrong chart type obscures insights and confuses decision-makers.

Matplotlib provides specialized artist constructors for the three fundamental relationships:
1. **Correlation & Continuous Relationships**: \`ax.scatter()\` treats each observation as an individual point in a \`PathCollection\`, allowing per-point color mapping (\`c\`) and scaling (\`s\`).
2. **Discrete Categories & Comparisons**: \`ax.bar()\` and \`ax.barh()\` render \`BarContainer\` objects with rectangular \`Rectangle\` patches.
3. **Probability Distributions & Densities**: \`ax.hist()\` partitions continuous values into discrete bins and computes empirical densities (\`density=True\`).`,
    whyItExists: `Different data types require different geometry:
- Scatter plots map continuous numbers to Cartesian coordinates $(X, Y)$ and color gradients.
- Bar charts map categorical factors to discrete, evenly spaced intervals.
- Histograms perform runtime mathematical binning and frequency accumulation directly inside Matplotlib.`,
    coreAnatomy: {
      objectName: 'Visual Artist Constructors',
      description: 'The specialized Artist containers created by scatter, bar, and histogram functions.',
      fields: [
        {
          name: 'PathCollection',
          type: 'matplotlib.collections.PathCollection',
          role: 'Collection of 2D glyphs used by ax.scatter() for fast rendering of thousands of individual points.'
        },
        {
          name: 'BarContainer',
          type: 'matplotlib.container.BarContainer',
          role: 'Container holding Rectangle patches representing the individual bars of a bar chart.'
        },
        {
          name: 'Polygon / Patches',
          type: 'list[matplotlib.patches.Rectangle]',
          role: 'List of rectangular area patches representing the bins of an empirical histogram.'
        },
        {
          name: 'Colorbar',
          type: 'matplotlib.colorbar.Colorbar',
          role: 'Visual scale key mapping scalar numerical values to colormap colors.'
        }
      ],
      memoryDiagramAscii: `+-------------------------------------------------------------+
|                 Visual Encodings Comparison                 |
|                                                             |
|   [Scatter: PathCollection]       [Bar: BarContainer]       |
|    Y ^      *  *                   Y ^  +---+               |
|      |    *      *                   |  |   |  +---+        |
|      |  *          *                 |  |   |  |   |        |
|      +----------------> X            +--+---+--+---+--> X   |
|                                         Cat A   Cat B       |
|                                                             |
|   [Histogram + Normal PDF]                                  |
|    p ^      __---__                                         |
|      |    /+-+-+-+-+\\  (Empirical bins + Analytical PDF)    |
|      |   / | | | | | \\                                      |
|      +---+-+-+-+-+-+--> X                                   |
+-------------------------------------------------------------+`
    },
    chapters: [
      {
        id: 'ch1-scatter-colormaps',
        title: 'Scatter Plots & Colormapping',
        icon: 'ScatterPlot',
        summary: 'Mapping continuous features to point position, colors, sizes, and colorbars.',
        markdownContent: `### Continuous Correlation with ax.scatter()

When analyzing feature correlations, you often want to encode a third variable using color:

\`\`\`python
# c maps target values to a colormap
scatter = ax.scatter(x, y, c=target, cmap="viridis", s=60, alpha=0.75)
cbar = fig.colorbar(scatter, ax=ax)
cbar.set_label("Target Value")
\`\`\`

- **\`cmap\`**: Colormap name (\`"viridis"\`, \`"plasma"\`, \`"coolwarm"\`).
- **\`s\`**: Marker size (points squared).
- **\`alpha\`**: Opacity for resolving overlapping points.`
      },
      {
        id: 'ch2-categorical-bars',
        title: 'Categorical Bar Charts',
        icon: 'BarChart',
        summary: 'Comparing discrete groups, setting bar widths, and labeling categories.',
        markdownContent: `### Comparing Discrete Categories

Use \`ax.bar()\` for vertical bars and \`ax.barh()\` for horizontal bars:

\`\`\`python
categories = ["Model A", "Model B", "Model C"]
accuracies = [0.84, 0.91, 0.95]

bars = ax.bar(categories, accuracies, color="#4f46e5", width=0.55, edgecolor="black")
ax.set_ylabel("Accuracy")
ax.set_ylim(0.0, 1.0)
\`\`\``
      },
      {
        id: 'ch3-histograms-densities',
        title: 'Histograms & Normal Density Fitting',
        icon: 'TrendingUp',
        summary: 'Binning continuous values and overlaying theoretical normal density curves.',
        markdownContent: `### Normalizing Histograms with density=True

To compare an empirical sample against a theoretical distribution, set \`density=True\` so the total area under the histogram integrates to 1:

\`\`\`python
# Density histogram
n, bins, patches = ax.hist(data, bins=30, density=True, color="#93c5fd", alpha=0.6, edgecolor="white")

# Overlay theoretical Gaussian curve
mu, sigma = data.mean(), data.std()
x_eval = np.linspace(data.min(), data.max(), 200)
pdf = (1.0 / (sigma * np.sqrt(2 * np.pi))) * np.exp(-0.5 * ((x_eval - mu) / sigma) ** 2)
ax.plot(x_eval, pdf, color="#dc2626", linewidth=2, label="Gaussian Fit")
\`\`\``
      }
    ],
    commonTraps: [
      {
        title: 'Using ax.plot() instead of ax.scatter() for unordered data',
        badSnippet: `# Accidentally creates chaotic zigzag lines between points
ax.plot(feat_x, feat_y, marker="o")`,
        badExplanation: 'ax.plot() connects points in sequential order. If points are not sorted by x, you get a tangled web of lines.',
        goodSnippet: `# Explicit scatter plot
ax.scatter(feat_x, feat_y, color="#2563eb", alpha=0.7)`,
        goodExplanation: 'ax.scatter() plots isolated points without connecting lines.',
        perfImpact: 'Eliminates misleading visual artifacts.'
      },
      {
        title: 'Confusing density=True with percentage of counts',
        badSnippet: `# Expecting density histogram heights to be percentages < 1.0:
# For small bin widths (e.g. 0.01), density heights can be > 50!`,
        badExplanation: 'Probability density is count / (total * bin_width). The integral (height * width) equals 1, not the raw heights.',
        goodSnippet: `# Understanding probability density
ax.hist(data, bins=30, density=True)
# To get exact percentages instead, use weights=np.ones(len(data))/len(data)`,
        goodExplanation: 'density=True is mathematically required when overlaying probability density functions (PDFs).',
        perfImpact: 'Ensures correct mathematical alignment with analytical curves.'
      }
    ],
    apiCheatSheet: [
      {
        name: 'ax.scatter',
        category: 'Scatter',
        signature: 'ax.scatter(x, y, s=None, c=None, marker=None, cmap=None, alpha=None, ...)',
        summary: 'A scatter plot of y vs x with varying marker size and/or color.',
        parameters: [
          { name: 'x, y', type: 'array-like', desc: 'Data point coordinates.' },
          { name: 'c', type: 'array-like | color', desc: 'Colors mapped to colormap or fixed color.' },
          { name: 's', type: 'float | array-like', desc: 'Marker size in points squared.' },
          { name: 'cmap', type: 'str | Colormap', desc: 'Colormap to translate c to colors.' }
        ],
        returns: 'PathCollection artist.',
        exampleSnippet: `sc = ax.scatter(x, y, c=z, cmap="viridis", alpha=0.7)`
      },
      {
        name: 'ax.bar',
        category: 'Bar',
        signature: 'ax.bar(x, height, width=0.8, bottom=None, *, align="center", data=None, **kwargs)',
        summary: 'Make a vertical bar plot.',
        parameters: [
          { name: 'x', type: 'sequence', desc: 'The x coordinates or category labels of the bars.' },
          { name: 'height', type: 'sequence', desc: 'The height(s) of the bars.' },
          { name: 'width', type: 'float', desc: 'The width(s) of the bars.' }
        ],
        returns: 'BarContainer containing the Rectangle artists.',
        exampleSnippet: `bars = ax.bar(["A", "B", "C"], [10, 25, 18], color="#4f46e5")`
      },
      {
        name: 'ax.hist',
        category: 'Distribution',
        signature: 'ax.hist(x, bins=None, range=None, density=False, weights=None, cumulative=False, ...)',
        summary: 'Compute and draw the histogram of x.',
        parameters: [
          { name: 'x', type: 'array-like', desc: 'Input values to bin.' },
          { name: 'bins', type: 'int | sequence', desc: 'Number of equal-width bins or bin edges.' },
          { name: 'density', type: 'bool', desc: 'If True, normalize area under histogram to 1.' }
        ],
        returns: '(n, bins, patches) tuple.',
        exampleSnippet: `n, bins, patches = ax.hist(data, bins=30, density=True)`
      },
      {
        name: 'ax.axvline',
        category: 'Reference Lines',
        signature: 'ax.axvline(x=0, ymin=0, ymax=1, **kwargs)',
        summary: 'Add a vertical line across the axes.',
        parameters: [
          { name: 'x', type: 'float', desc: 'x position in data coordinates.' },
          { name: 'linestyle', type: 'str', desc: 'Line style ("--", ":", etc.).' }
        ],
        returns: 'Line2D artist.',
        exampleSnippet: `ax.axvline(mean_val, linestyle="--", color="red")`
      }
    ],
    interactiveWidgetType: 'matplotlib-artists'
  },
  challenges: [
    {
      id: 'mpl-p2-c1',
      dayId: 2,
      partId: 2,
      title: 'Feature Correlation Scatter & Bar Chart',
      slug: 'feature-correlation-scatter-bar',
      difficulty: 'Intermediate',
      category: 'Essential Chart Types',
      summary: 'Build a 1x2 side-by-side dashboard containing a feature scatter plot with colormapping and a categorical frequency bar chart.',
      mentalModel5s: 'Left panel maps continuous points with colormap; right panel aggregates discrete categories into bar heights.',
      visualAnalogy: 'A dual microscope: looking at individual cells on the left, and counting total cell types into sorted test tubes on the right.',
      pitfalls: [
        'Passing color_values of different length than x or y.',
        'Not sorting categories alphabetically before plotting bars.',
        'IndexError when indexing 1D array of axes returned by subplots(1, 2).'
      ],
      progressiveHints: [
        'Validate that x, y, categories are non-empty and matching in length.',
        'Create 1x2 subplots: fig, (ax_scatter, ax_bar) = plt.subplots(1, 2, figsize=(12, 5)).',
        'In ax_scatter: call scatter() with cmap="viridis" and fig.colorbar if color_values is provided.',
        'In ax_bar: count occurrences of each sorted unique category and call ax_bar.bar().',
        'Apply fig.tight_layout() and return (fig, (ax_scatter, ax_bar)).'
      ],
      deepInternals: {
        title: 'Colormap Normalization & ScalarMappables',
        content: 'When you pass c=values to ax.scatter(), Matplotlib internally creates a Normalize instance mapping values to [0, 1], then looks up RGBA quadruplets from the Colormap lookup table (LUT).',
        keyRule: 'Always attach colorbars to the specific Axes containing the Scatter artist.'
      },
      instructions: `In exploratory data analysis (EDA), you frequently need to visualize both continuous feature relationships and discrete class representations side-by-side.

Write a function \`plot_scatter_and_bar(x: np.ndarray, y: np.ndarray, categories: list, color_values: Optional[np.ndarray] = None) -> tuple[plt.Figure, tuple[plt.Axes, plt.Axes]]\` that:
1. Validates inputs:
   - If \`len(x) == 0\`, \`len(y) == 0\`, or \`len(categories) == 0\`, raise \`ValueError("Inputs cannot be empty")\`.
   - If lengths do not match (\`len(x) != len(y)\` or \`len(x) != len(categories)\`), raise \`ValueError("Length mismatch between features and categories")\`.
   - If \`color_values\` is provided and \`len(color_values) != len(x)\`, raise \`ValueError("color_values length must match feature length")\`.
2. Creates a 1-row by 2-column figure: \`fig, (ax_scatter, ax_bar) = plt.subplots(1, 2, figsize=(12, 5))\`.
3. Left Subplot (\`ax_scatter\`):
   - If \`color_values\` is provided, call \`sc = ax_scatter.scatter(x, y, c=color_values, cmap="viridis", alpha=0.7, s=50)\` and add a colorbar to \`ax_scatter\` with \`fig.colorbar(sc, ax=ax_scatter)\`.
   - If \`color_values\` is None, call \`ax_scatter.scatter(x, y, color="#4f46e5", alpha=0.7, s=50)\`.
   - Sets title to \`"Feature Correlation"\`, x-label to \`"Feature X"\`, y-label to \`"Feature Y"\`. Enables grid.
4. Right Subplot (\`ax_bar\`):
   - Counts occurrences of each unique category in \`categories\` (sorted alphabetically).
   - Plots a vertical bar chart using \`ax_bar.bar(unique_cats, counts, color="#059669", alpha=0.85, edgecolor="#064e3b", width=0.6)\`.
   - Sets title to \`"Category Distribution"\`, x-label to \`"Category"\`, y-label to \`"Count"\`. Enables y-axis grid.
5. Applies \`fig.tight_layout()\` and returns \`(fig, (ax_scatter, ax_bar))\`.`,
      hints: [
        'Use plt.subplots(1, 2, figsize=(12, 5)) for side-by-side plots.',
        'Use sorted(list(set(categories))) to get alphabetical category labels.',
        'Count occurrences with [categories.count(c) for c in unique_cats].'
      ],
      starterCode: `import matplotlib.pyplot as plt
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
`,
      solutionCode: `import matplotlib.pyplot as plt
import numpy as np
from typing import List, Tuple, Optional

def plot_scatter_and_bar(
    x: np.ndarray,
    y: np.ndarray,
    categories: List[str],
    color_values: Optional[np.ndarray] = None
) -> Tuple[plt.Figure, Tuple[plt.Axes, plt.Axes]]:
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
`,
      testCases: challenge1TestCases,
      conceptPrimer: {
        title: 'Scatter Plots & Categorical Comparisons',
        subtitle: 'Dual-panel EDA with continuous and categorical dimensions',
        overview: 'Master pairing continuous correlation analysis with categorical summaries.',
        mentalModel5s: 'Scatter on the left for continuous pairs; bars on the right for discrete counts.',
        visualAnalogy: 'Viewing satellite imagery on the left, and category acreage stats on the right.',
        pitfalls: [
          'Forgetting to attach the colorbar to the specific scatter axes.',
          'Not sorting categories leading to unpredictable bar order.'
        ],
        progressiveHints: [
          'Verify input array dimensions.',
          'Unpack the 1x2 subplot tuple: fig, (ax1, ax2) = plt.subplots(1, 2).',
          'Use ax1.scatter with cmap="viridis".',
          'Use ax2.bar with sorted unique categories.'
        ],
        mathFormulas: [
          {
            title: 'Pearson Correlation Co-distribution',
            latex: 'r_{xy} = \\frac{\\sum (x_i - \\bar{x})(y_i - \\bar{y})}{\\sqrt{\\sum (x_i - \\bar{x})^2 \\sum (y_i - \\bar{y})^2}}',
            explanation: 'Quantifies linear relationship visualized by the scatter plot.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Two separate unaligned figures
plt.figure()
plt.scatter(x, y)
plt.figure()
plt.bar(cats, counts)`,
          naiveExplanation: 'Generates disjointed windows that cannot be exported or reviewed together.',
          idiomaticCode: `# Integrated 1x2 panel layout
fig, (ax_sc, ax_bar) = plt.subplots(1, 2, figsize=(12, 5))
ax_sc.scatter(x, y)
ax_bar.bar(cats, counts)
fig.tight_layout()`,
          idiomaticExplanation: 'Single integrated figure with coordinated layout and export.',
          speedupText: 'Unified multi-panel artifact'
        },
        memoryLayout: {
          title: 'Subplot Tuple Layout',
          content: 'plt.subplots(1, 2) yields a 1D NumPy array of Axes with length 2, unpacked cleanly into two variables.',
          diagramAscii: `Figure -> [ Axes_Left (Scatter), Axes_Right (Bar) ]`,
          keyRule: 'Unpack subplots(1, 2) into (ax1, ax2) directly.'
        },
        keyTakeaways: [
          'Use scatter plots with colormaps for 3D continuous data.',
          'Sort categories alphabetically for reproducible bar order.',
          'Always use fig.tight_layout() on multi-panel plots.'
        ]
      },
      benchmarkTargetMs: 100,
      memoryTargetMb: 25
    },
    {
      id: 'mpl-p2-c2',
      dayId: 2,
      partId: 2,
      title: 'Distribution Histogram with Density Curve',
      slug: 'distribution-histogram-density',
      difficulty: 'Intermediate',
      category: 'Essential Chart Types',
      summary: 'Plot an empirical density histogram and overlay a theoretical Gaussian curve matching sample mean and variance.',
      mentalModel5s: 'density=True scales histogram area to 1.0, enabling direct overlay of the continuous Gaussian PDF.',
      visualAnalogy: 'Laying a smooth silk blanket (theoretical PDF) over a row of building blocks (empirical histogram bins).',
      pitfalls: [
        'Forgetting density=True so the histogram counts are in thousands while the PDF is in decimals.',
        'Division by zero if data has zero variance (sigma == 0).'
      ],
      progressiveHints: [
        'Check len(data) >= 2, bins >= 1, and np.std(data) > 0.',
        'Compute mu = np.mean(data) and sigma = np.std(data).',
        'Plot histogram with ax.hist(..., density=True).',
        'Generate x_eval with np.linspace(min, max, 200) and compute Gaussian PDF.',
        'Plot curve with ax.plot() and add vertical line with ax.axvline(mu).'
      ],
      deepInternals: {
        title: 'Histogram Bin Width Normalization',
        content: 'When density=True, each bin height is computed as h = count / (total_samples * bin_width). This ensures the sum of (height * width) across all bins exactly equals 1.0.',
        keyRule: 'Never overlay a probability density function onto a raw count histogram.'
      },
      instructions: `In statistical modeling, verifying whether residuals or features follow a normal distribution is a crucial diagnostic step.

Write a function \`plot_distribution_with_density(data: np.ndarray, bins: int = 30) -> tuple[plt.Figure, plt.Axes]\` that:
1. Validates inputs:
   - If \`len(data) < 2\`, raise \`ValueError("data must contain at least 2 points")\`.
   - If \`bins < 1\`, raise \`ValueError("bins must be at least 1")\`.
   - If standard deviation of data is 0 (\`np.std(data) == 0\`), raise \`ValueError("Data must have non-zero variance")\`.
2. Calculates sample mean (\`mu = np.mean(data)\`) and standard deviation (\`sigma = np.std(data)\`).
3. Creates \`fig, ax = plt.subplots(figsize=(8, 5))\`.
4. Plots histogram with \`density=True\`, \`bins=bins\`, \`color="#60a5fa"\`, \`alpha=0.6\`, \`edgecolor="white"\`, and \`label="Empirical Density"\`.
5. Computes Gaussian PDF over 200 evenly spaced points from \`min(data)\` to \`max(data)\` using:
   \`pdf = (1.0 / (sigma * np.sqrt(2 * np.pi))) * np.exp(-0.5 * ((x_eval - mu) / sigma) ** 2)\`.
6. Plots the Gaussian curve on \`ax\` with \`color="#dc2626"\`, \`linewidth=2.2\`, and \`label=f"Normal Fit (μ={mu:.2f}, σ={sigma:.2f})"\`.
7. Adds a vertical dashed line for the mean: \`ax.axvline(mu, color="#1e3a8a", linestyle="--", linewidth=1.8, label=f"Mean = {mu:.2f}")\`.
8. Sets title to \`"Distribution with Fitted Normal Density"\`, x-label to \`"Value"\`, and y-label to \`"Probability Density"\`.
9. Adds grid and legend, then returns \`(fig, ax)\`.`,
      hints: [
        'Set density=True in ax.hist().',
        'Use np.linspace(arr.min(), arr.max(), 200) for smooth PDF evaluation.',
        'Use ax.axvline(mu, linestyle="--") for the mean indicator line.'
      ],
      starterCode: `import matplotlib.pyplot as plt
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
`,
      solutionCode: `import matplotlib.pyplot as plt
import numpy as np
from typing import Tuple

def plot_distribution_with_density(
    data: np.ndarray,
    bins: int = 30
) -> Tuple[plt.Figure, plt.Axes]:
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
`,
      testCases: challenge2TestCases,
      conceptPrimer: {
        title: 'Empirical Histograms & Density Overlay',
        subtitle: 'Comparing continuous data against analytical distributions',
        overview: 'Bridge raw empirical data and theoretical probability distributions using normalized histogram binning.',
        mentalModel5s: 'Scale histogram to area 1.0 so normal PDF overlays on the same vertical scale.',
        visualAnalogy: 'Pouring sand into bins and tracing the smooth natural dome curve over the top.',
        pitfalls: [
          'Plotting raw counts on the Y-axis when overlaying continuous probability density.',
          'Not handling zero variance constant inputs.'
        ],
        progressiveHints: [
          'Flatten data array and compute mean/std.',
          'Use ax.hist with density=True.',
          'Calculate normal PDF using formula with np.exp and np.sqrt.',
          'Mark mean with ax.axvline.'
        ],
        mathFormulas: [
          {
            title: 'Gaussian Probability Density Function',
            latex: 'f(x) = \\frac{1}{\\sigma \\sqrt{2\\pi}} \\exp\\left(-\\frac{(x - \\mu)^2}{2\\sigma^2}\\right)',
            explanation: 'Continuous theoretical bell curve distribution.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Raw counts: PDF cannot overlay correctly!
ax.hist(data, bins=30)
ax.plot(x, pdf)  # PDF peaks around 0.4 while hist peaks at 1500!`,
          naiveExplanation: 'Vertical scales differ by orders of magnitude.',
          idiomaticCode: `# Normalized density
ax.hist(data, bins=30, density=True)
ax.plot(x, pdf)  # Perfectly aligned!`,
          idiomaticExplanation: 'Both empirical and theoretical distributions integrate to 1.0.',
          speedupText: 'Mathematically sound alignment'
        },
        memoryLayout: {
          title: 'Histogram Patch List',
          content: 'ax.hist returns (n, bins, patches) where patches is a list of Rectangle objects for each bin.',
          diagramAscii: `Axes.patches = [ Rect(bin_0), Rect(bin_1), ..., Rect(bin_N) ]`,
          keyRule: 'sum(p.get_width() * p.get_height() for p in patches) == 1.0 when density=True.'
        },
        keyTakeaways: [
          'Always use density=True when comparing histograms with continuous curves.',
          'Use ax.axvline to highlight distribution central tendencies.',
          'Verify non-zero variance before computing Gaussian fits.'
        ]
      },
      benchmarkTargetMs: 90,
      memoryTargetMb: 20
    }
  ]
};

export const MATPLOTLIB_PART02_TRACK = DAY02_TRACK;
export default DAY02_TRACK;
