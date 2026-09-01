import type { DayTrack, Challenge, ConceptPrimerData, TestCase } from '../../types';

export type { DayTrack, Challenge, ConceptPrimerData, TestCase };

const challenge1TestCases: TestCase[] = [
  {
    id: 't1',
    name: 'Standard Loss Trajectory',
    inputDescription: 'epochs=[1, 2, 3, 4, 5], train_loss=[0.95, 0.70, 0.52, 0.41, 0.35], val_loss=[0.98, 0.74, 0.59, 0.50, 0.48]',
    expectedOutput: '(fig, ax) with 2 styled Line2D curves, title, labels, grid, and legend'
  },
  {
    id: 't2',
    name: 'Empty Sequence Validation',
    inputDescription: 'epochs=[], train_loss=[], val_loss=[]',
    expectedOutput: 'Raises ValueError("Input sequences cannot be empty")'
  },
  {
    id: 't3',
    name: 'Mismatched Sequence Lengths',
    inputDescription: 'epochs=[1, 2, 3], train_loss=[0.5, 0.4], val_loss=[0.6, 0.5, 0.4]',
    expectedOutput: 'Raises ValueError("All input sequences must have identical length")'
  }
];

const challenge2TestCases: TestCase[] = [
  {
    id: 't1',
    name: 'Multi-Agent Trajectory Tracking',
    inputDescription: 'time_steps=[0, 1, 2, 3, 4], trajectories={"Agent Alpha": [...], "Agent Beta": [...], "Agent Gamma": [...]}',
    expectedOutput: '(fig, ax) with 3 styled trajectory curves with markers and distinct linestyles'
  },
  {
    id: 't2',
    name: 'Empty Inputs Check',
    inputDescription: 'time_steps=[], trajectories={}',
    expectedOutput: 'Raises ValueError("Inputs cannot be empty")'
  },
  {
    id: 't3',
    name: 'Mismatched Trajectory Length',
    inputDescription: 'time_steps=[0, 1, 2], trajectories={"BadAgent": [1, 2]}',
    expectedOutput: 'Raises ValueError'
  }
];

export const testCases: TestCase[] = [...challenge1TestCases, ...challenge2TestCases];

export const DAY01_TRACK: DayTrack = {
  partNumber: 1,
  partId: 1,
  dayNumber: 1,
  id: 1,
  title: 'Part 1: Plotting Foundations & The Figure-Axes Model',
  subtitle: 'Master the Figure & Axes hierarchy, Line2D artists, legends, and clean labels',
  description: 'Learn why procedural plt.plot() causes bugs in production and master the professional Object-Oriented (OOP) Figure & Axes paradigm. Style multi-line metric curves with colors, linestyles, markers, titles, labels, grids, and legends.',
  iconName: 'LineChart',
  badge: 'Part 1 • Matplotlib Foundations',
  libraryMechanics: {
    libraryName: 'Matplotlib Foundations',
    tagline: 'The Figure & Axes Mental Model: Professional Data Visualization',
    overview: `### 🌟 Welcome to Matplotlib: The Canvas of Scientific Python
Matplotlib is the foundational visualization engine of the Python data ecosystem. Libraries like Seaborn, Pandas plotting, and Yellowbrick all construct their visualizations on top of Matplotlib artists.

### ⚡ Procedural State Machine vs Object-Oriented Hierarchy
Beginners often use \`plt.plot(x, y)\`. While convenient in interactive scratchpads, calling global \`plt.*\` functions relies on a hidden state machine that tracks the "current active figure".
- In web servers or background pipelines, concurrent execution will cause plots to bleed across requests.
- Figures not explicitly closed linger in memory, leading to out-of-memory crashes.

### 🏛️ The Professional Standard: The OOP Paradigm
Professional scientific plotting always instantiates an explicit canvas and coordinate system:
\`\`\`python
fig, ax = plt.subplots(figsize=(8, 5))
ax.plot(epochs, loss, label="Train Loss", color="#2563eb", linestyle="-", linewidth=2)
ax.set_title("Training Loss")
ax.set_xlabel("Epoch")
ax.set_ylabel("Loss")
ax.grid(True)
ax.legend()
\`\`\``,
    whyItExists: `Matplotlib was built to bring Matlab-grade scientific plotting into Python.
It separates the high-level representation of data from low-level graphics rendering engines (backends like Agg, SVG, PDF, and interactive Qt/WebAgg).

The Object-Oriented interface allows fine-grained control over every single visual element: from spines and tick marks to legends and multi-panel alignment.`,
    coreAnatomy: {
      objectName: 'Figure & Axes Hierarchy',
      description: 'The two core objects in any Matplotlib visualization: the Figure (canvas container) and the Axes (coordinate space containing data and artists).',
      fields: [
        {
          name: 'Figure',
          type: 'matplotlib.figure.Figure',
          role: 'The overall window/canvas. Controls figure size (figsize), pixel density (dpi), background color, and figure-level titles (suptitle).'
        },
        {
          name: 'Axes',
          type: 'matplotlib.axes.Axes',
          role: 'The coordinate system containing plotted data, X/Y axes, tick marks, grid lines, and data bounds.'
        },
        {
          name: 'Line2D',
          type: 'matplotlib.lines.Line2D',
          role: 'The artist object representing plotted line segments, linestyles, colors, line widths, and marker symbols.'
        },
        {
          name: 'Spines',
          type: 'dict[str, matplotlib.spines.Spine]',
          role: 'The four boundary lines enclosing the coordinate space (top, bottom, left, right).'
        }
      ],
      memoryDiagramAscii: `+-------------------------------------------------------------+
|                     Figure (Canvas Container)               |
|  +-------------------------------------------------------+  |
|  |             Axes (Coordinate Space / Subplot)         |  |
|  |   Title: ax.set_title(...)                            |  |
|  |                                                       |  |
|  |   Y-Axis ^                                            |  |
|  |          |       /--- Line2D (Validation Loss)       |  |
|  |          |      /                                     |  |
|  |          |     *---- Line2D (Train Loss)              |  |
|  |          +-----------------------------------> X-Axis |  |
|  |            Ticks & Labels: ax.set_xlabel(...)         |  |
|  +-------------------------------------------------------+  |
+-------------------------------------------------------------+`
    },
    chapters: [
      {
        id: 'ch1-figure-vs-axes',
        title: 'Figure vs Axes: The Core Hierarchy',
        icon: 'Layers',
        summary: 'Understanding why fig, ax = plt.subplots() is the foundation of robust Python visualization.',
        markdownContent: `### The Mental Model: Canvas vs Coordinate System

Think of a **Figure** as the physical wooden frame and canvas hung on a gallery wall.
An **Axes** is the coordinate grid drawn onto that canvas where data points actually live.

A Figure can hold:
- Exactly 1 Axes (a standalone plot)
- 2 Axes (side-by-side or stacked plots)
- 4, 9, or more Axes (a dashboard or grid)

\`\`\`python
# Instantiate a Figure and a single Axes
fig, ax = plt.subplots(figsize=(8, 5), dpi=100)

# ax is your direct handle to draw data!
ax.plot([1, 2, 3], [10, 20, 30])
\`\`\``,
        codeSnippets: [
          {
            id: 'snip-fig-ax-creation',
            title: 'Creating and inspecting Figure & Axes',
            code: `import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

fig, ax = plt.subplots(figsize=(6, 4))
print("Figure type:", type(fig).__name__)
print("Axes type:", type(ax).__name__)
print("Axes in Figure:", len(fig.axes))
plt.close(fig)`,
            expectedOutput: `Figure type: Figure
Axes type: Axes
Axes in Figure: 1`,
            explanation: 'plt.subplots() creates both the Figure container and the Axes plotting area in one atomic call.'
          }
        ]
      },
      {
        id: 'ch2-line-styling',
        title: 'Styling Lines: Colors, Styles & Markers',
        icon: 'Palette',
        summary: 'Control linestyles, line thickness, color palettes, and data point markers.',
        markdownContent: `### Customizing Line2D Artists

When plotting lines with \`ax.plot()\`, several keyword arguments control appearance:

- **\`color\`**: Hex codes (\`"#2563eb"\`), CSS names (\`"crimson"\`), or RGB tuples.
- **\`linestyle\`**: Solid (\`"-"\`), dashed (\`"--"\`), dash-dot (\`"-."\`), or dotted (\`":"\`).
- **\`linewidth\`**: Line thickness in points (\`1.5\`, \`2.0\`, \`3.0\`).
- **\`marker\`**: Point shape (\`"o"\` circle, \`"s"\` square, \`"^"\` triangle, \`"D"\` diamond).
- **\`markersize\`**: Size of data point symbols in points.

\`\`\`python
ax.plot(x, y, color="#2563eb", linestyle="-", linewidth=2.0, marker="o", markersize=6, label="Series A")
\`\`\``,
        codeSnippets: [
          {
            id: 'snip-styling-lines',
            title: 'Plotting styled multi-curves',
            code: `import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

x = np.array([1, 2, 3, 4, 5])
y1 = x ** 2
y2 = 2 * x + 5

fig, ax = plt.subplots()
ax.plot(x, y1, color="#2563eb", linestyle="-", marker="o", label="Quadratic")
ax.plot(x, y2, color="#dc2626", linestyle="--", marker="s", label="Linear")
ax.legend()
print("Plotted lines count:", len(ax.get_lines()))
plt.close(fig)`,
            expectedOutput: `Plotted lines count: 2`,
            explanation: 'Each ax.plot() call adds a new Line2D artist to the Axes artist list.'
          }
        ]
      },
      {
        id: 'ch3-labels-and-legends',
        title: 'Polishing the Coordinate System',
        icon: 'Sparkles',
        summary: 'Adding clear axis labels, titles, gridlines, and positioned legends.',
        markdownContent: `### Never Ship an Unlabeled Chart!

An unadorned line without context is meaningless. Always configure:
1. **Title**: \`ax.set_title("Descriptive Title", fontweight="bold", pad=10)\`
2. **Axis Labels**: \`ax.set_xlabel("Time (s)")\` and \`ax.set_ylabel("Amplitude (V)")\`
3. **Grid**: \`ax.grid(True, linestyle=":", alpha=0.6)\`
4. **Legend**: \`ax.legend(loc="upper right", frameon=True)\`

\`\`\`python
ax.set_title("Model Loss Progression", fontsize=12, fontweight="bold")
ax.set_xlabel("Epoch", fontsize=10)
ax.set_ylabel("Cross-Entropy Loss", fontsize=10)
ax.grid(True, linestyle=":", alpha=0.6)
ax.legend(loc="upper right")
\`\`\``
      }
    ],
    commonTraps: [
      {
        title: 'Using procedural plt.plot() in web services or notebooks',
        badSnippet: `# Global state machine: causes cross-talk between requests
plt.figure()
plt.plot(x, y)
plt.title("My Plot")
plt.savefig("out.png")`,
        badExplanation: 'Procedural plt.* relies on hidden global state. If two requests run concurrently, lines from one plot can appear on another.',
        goodSnippet: `# Explicit OOP instantiation
fig, ax = plt.subplots(figsize=(8, 5))
try:
    ax.plot(x, y)
    ax.set_title("My Plot")
    fig.savefig("out.png")
finally:
    plt.close(fig)`,
        goodExplanation: 'Instantiating explicit fig, ax isolates the canvas completely and frees memory reliably.',
        perfImpact: 'Eliminates cross-talk race conditions and memory leaks.'
      },
      {
        title: 'Forgetting to call plt.close(fig) in server backends',
        badSnippet: `def generate_chart(data):
    fig, ax = plt.subplots()
    ax.plot(data)
    return fig.canvas.draw()  # Leaks memory!`,
        badExplanation: 'Matplotlib keeps an internal reference to every created Figure. Unclosed figures are never garbage collected.',
        goodSnippet: `def generate_chart(data):
    fig, ax = plt.subplots()
    try:
        ax.plot(data)
        buf = io.BytesIO()
        fig.savefig(buf, format="png")
        return buf.getvalue()
    finally:
        plt.close(fig)  # Crucial!`,
        goodExplanation: 'Calling plt.close(fig) removes the figure from Matplotlib internal tracking and frees buffers.',
        perfImpact: 'Prevents Out-Of-Memory server crashes.'
      }
    ],
    apiCheatSheet: [
      {
        name: 'plt.subplots',
        category: 'Creation',
        signature: 'plt.subplots(nrows=1, ncols=1, figsize=None, dpi=None, ...)',
        summary: 'Create a Figure and a set of subplots (Axes).',
        parameters: [
          { name: 'nrows, ncols', type: 'int', desc: 'Number of rows/columns of the subplot grid.' },
          { name: 'figsize', type: 'tuple[float, float]', desc: 'Width and height in inches (e.g. (8, 5)).' },
          { name: 'dpi', type: 'int', desc: 'Dots per inch resolution (default 100).' }
        ],
        returns: '(fig, ax) tuple or (fig, axes_array).',
        exampleSnippet: `fig, ax = plt.subplots(figsize=(8, 5))`
      },
      {
        name: 'ax.plot',
        category: 'Artists',
        signature: 'ax.plot(*args, scalex=True, scaley=True, data=None, **kwargs)',
        summary: 'Plot y versus x as lines and/or markers.',
        parameters: [
          { name: 'x, y', type: 'array-like', desc: 'Horizontal and vertical coordinates of data points.' },
          { name: 'color', type: 'color', desc: 'Line color (hex, name, or RGB).' },
          { name: 'linestyle', type: 'str', desc: 'Line style ("-", "--", "-.", ":").' },
          { name: 'linewidth', type: 'float', desc: 'Line thickness in points.' },
          { name: 'marker', type: 'str', desc: 'Marker style ("o", "s", "^", "D").' },
          { name: 'label', type: 'str', desc: 'Text label for legend.' }
        ],
        returns: 'List of Line2D objects representing plotted data.',
        exampleSnippet: `ax.plot(x, y, label="Train", color="#2563eb", linestyle="-", linewidth=2)`
      },
      {
        name: 'ax.set_title',
        category: 'Labels',
        signature: 'ax.set_title(label, fontdict=None, loc="center", pad=None, ...)',
        summary: 'Set a title for the axes.',
        parameters: [
          { name: 'label', type: 'str', desc: 'Title text string.' },
          { name: 'fontweight', type: 'str', desc: 'Font weight (e.g. "bold", "semibold").' }
        ],
        returns: 'matplotlib.text.Text object.',
        exampleSnippet: `ax.set_title("Training Trajectory", fontweight="bold")`
      },
      {
        name: 'ax.legend',
        category: 'Decorations',
        signature: 'ax.legend(*args, **kwargs)',
        summary: 'Place a legend on the axes.',
        parameters: [
          { name: 'loc', type: 'str', desc: 'Legend location (e.g. "upper right", "best").' },
          { name: 'frameon', type: 'bool', desc: 'Whether to draw a background box.' }
        ],
        returns: 'matplotlib.legend.Legend object.',
        exampleSnippet: `ax.legend(loc="upper right", frameon=True)`
      }
    ],
    interactiveWidgetType: 'matplotlib-artists'
  },
  challenges: [
    {
      id: 'mpl-p1-c1',
      dayId: 1,
      partId: 1,
      title: 'Metric Line Plot Generator',
      slug: 'metric-line-plot-generator',
      difficulty: 'Beginner',
      category: 'Plotting Foundations',
      summary: 'Build an OOP line plot comparing training and validation loss curves over epochs.',
      mentalModel5s: 'fig is the canvas, ax is the grid. Use ax.plot for lines, set titles and labels, enable the grid, and add a legend.',
      visualAnalogy: 'Think of the Figure as a picture frame and canvas, while the Axes is the grid drawn on the canvas where the curves are painted.',
      pitfalls: [
        'Calling plt.plot() instead of ax.plot() on the created Axes object.',
        'Forgetting to assign labels to lines before calling ax.legend().',
        'Not validating that input sequences are non-empty and of matching lengths.'
      ],
      progressiveHints: [
        'Validate inputs first: raise ValueError if epochs, train_loss, or val_loss are empty or have unequal lengths.',
        'Instantiate canvas and axes using fig, ax = plt.subplots(figsize=(8, 5)).',
        'Call ax.plot(epochs, train_loss, label="Train Loss", linestyle="-", linewidth=2, color="#1f77b4").',
        'Call ax.plot(epochs, val_loss, label="Validation Loss", linestyle="--", linewidth=2, color="#d62728").',
        'Set title, xlabel, ylabel, ax.grid(True), and ax.legend(), then return (fig, ax).'
      ],
      deepInternals: {
        title: 'Line2D Artists & Axes Registration',
        content: 'When ax.plot() executes, Matplotlib creates Line2D artist instances and registers them with the Axes. The Axes updates its data limits automatically and creates tick marks according to the bounding box of all registered artists.',
        keyRule: 'Always use explicit Axes methods (ax.set_xlabel) rather than global procedural functions (plt.xlabel).'
      },
      instructions: `In machine learning model development, tracking training versus validation loss is the single most common diagnostic visualization.

Write a function \`plot_metric_curves(epochs: list, train_loss: list, val_loss: list) -> tuple[plt.Figure, plt.Axes]\` that:
1. Validates inputs:
   - If \`len(epochs) == 0\`, \`len(train_loss) == 0\`, or \`len(val_loss) == 0\`, raise \`ValueError("Input sequences cannot be empty")\`.
   - If lengths do not match (\`len(epochs) != len(train_loss)\` or \`len(epochs) != len(val_loss)\`), raise \`ValueError("All input sequences must have identical length")\`.
2. Creates an explicit Figure and Axes using \`fig, ax = plt.subplots(figsize=(8, 5))\`.
3. Plots \`train_loss\` vs \`epochs\` with \`label="Train Loss"\`, solid line (\`linestyle="-"\`), and \`linewidth=2\`.
4. Plots \`val_loss\` vs \`epochs\` with \`label="Validation Loss"\`, dashed line (\`linestyle="--"\`), and \`linewidth=2\`.
5. Sets the title to \`"Model Training vs Validation Loss"\`.
6. Sets x-axis label to \`"Epoch"\` and y-axis label to \`"Loss"\`.
7. Enables the grid with \`ax.grid(True)\`.
8. Adds a legend with \`ax.legend()\`.
9. Returns the \`(fig, ax)\` tuple.`,
      hints: [
        'Call fig, ax = plt.subplots(figsize=(8, 5)) to create the figure and axes.',
        'Use ax.plot(epochs, train_loss, label="Train Loss", linestyle="-", linewidth=2).',
        'Use ax.plot(epochs, val_loss, label="Validation Loss", linestyle="--", linewidth=2).',
        'Remember ax.set_xlabel(), ax.set_ylabel(), ax.set_title(), ax.grid(True), and ax.legend().'
      ],
      starterCode: `import matplotlib.pyplot as plt
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
    # TODO: Validate inputs, create figure/axes, plot curves, style, and return (fig, ax)
    pass
`,
      solutionCode: `import matplotlib.pyplot as plt
from typing import List, Tuple

def plot_metric_curves(
    epochs: List[int],
    train_loss: List[float],
    val_loss: List[float]
) -> Tuple[plt.Figure, plt.Axes]:
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
`,
      testCases: challenge1TestCases,
      conceptPrimer: {
        title: 'Line Plots & The Figure-Axes Mental Model',
        subtitle: 'From procedural scripts to production-grade OOP visualization',
        overview: 'Mastering the Figure & Axes hierarchy guarantees thread-safe, memory-safe, and publication-ready plots.',
        mentalModel5s: 'fig is the canvas, ax is the coordinate system.',
        visualAnalogy: 'Figure is the picture frame; Axes is the canvas inside with coordinate marks and curves painted upon it.',
        pitfalls: [
          'Using procedural plt.plot() inside multi-threaded servers causing visual cross-talk.',
          'Not calling plt.close(fig) causing unbounded memory consumption.'
        ],
        progressiveHints: [
          'Step 1: Check len(epochs) > 0 and lengths match.',
          'Step 2: Instantiate fig, ax = plt.subplots().',
          'Step 3: Call ax.plot() twice with distinct labels and linestyles.',
          'Step 4: Decorate axes with title, labels, grid, and legend.'
        ],
        mathFormulas: [
          {
            title: 'Linear Data Range Mapping',
            latex: 'x_{\\text{display}} = x_{\\text{data}} \\cdot S_x + T_x',
            explanation: 'How Matplotlib maps data values into display pixel coordinates via affine transforms.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Procedural state-machine pattern
plt.figure()
plt.plot(epochs, train_loss)
plt.plot(epochs, val_loss)
plt.show()`,
          naiveExplanation: 'Pollutes global state, difficult to embed in services or test harnesses.',
          idiomaticCode: `# Clean OOP Figure & Axes pattern
fig, ax = plt.subplots(figsize=(8, 5))
ax.plot(epochs, train_loss, label="Train Loss", linestyle="-")
ax.plot(epochs, val_loss, label="Validation Loss", linestyle="--")
ax.legend()`,
          idiomaticExplanation: 'Thread-safe, testable, and explicitly manages resources.',
          speedupText: 'Thread-safe & zero memory leak'
        },
        memoryLayout: {
          title: 'Figure Artist Hierarchy',
          content: 'The Figure contains a list of Axes, and each Axes maintains its own collections of Line2D, Text, and Spine artists.',
          diagramAscii: `Figure -> [ Axes_0, Axes_1 ] -> [ Line2D_1, Line2D_2, Legend, Spines ]`,
          keyRule: 'Every visual element on an Axes is an Artist child of that Axes.'
        },
        keyTakeaways: [
          'Always use fig, ax = plt.subplots() for clean OOP isolation.',
          'Assign label="..." to every line you want featured in the legend.',
          'Always decorate axes with titles and units on axis labels.'
        ]
      },
      benchmarkTargetMs: 80,
      memoryTargetMb: 20
    },
    {
      id: 'mpl-p1-c2',
      dayId: 1,
      partId: 1,
      title: 'Multi-Line Trajectory Visualizer',
      slug: 'multi-line-trajectory-visualizer',
      difficulty: 'Beginner',
      category: 'Plotting Foundations',
      summary: 'Dynamically iterate through an arbitrary dictionary of series, assigning distinct linestyles and markers.',
      mentalModel5s: 'Cycle through style and marker arrays with modulo indexing while iterating over trajectories.',
      visualAnalogy: 'Giving each runner in a race a unique colored jersey and numbered badge so spectators can track them individually.',
      pitfalls: [
        'Hardcoding a fixed number of series instead of dynamically looping over trajectories.items().',
        'IndexError when the number of trajectories exceeds the length of styles list (use modulo i % len(styles)).'
      ],
      progressiveHints: [
        'Check that time_steps and trajectories are non-empty and every series matches time_steps length.',
        'Define cycling lists: styles = ["-", "--", "-.", ":"] and markers = ["o", "s", "^", "D", "v"].',
        'Loop with for i, (name, series) in enumerate(trajectories.items()):',
        'Plot each series with ax.plot(time_steps, series, label=name, linestyle=styles[i % len(styles)], marker=markers[i % len(markers)]).',
        'Add title, xlabel, ylabel, grid, and legend.'
      ],
      deepInternals: {
        title: 'Marker Ingestion & Line2D Rendering',
        content: 'Matplotlib Line2D artists optimize marker rendering by stamping pre-compiled path templates along vertex positions, avoiding repeated path recalculations.',
        keyRule: 'Use markers alongside linestyles to make charts accessible in black-and-white printing or for color-blind readers.'
      },
      instructions: `In robotics, multi-agent reinforcement learning, and financial forecasting, you frequently track multiple entities evolving across identical timestamps.

Write a function \`plot_trajectories(time_steps: list, trajectories: dict) -> tuple[plt.Figure, plt.Axes]\` that:
1. Validates inputs:
   - If \`len(time_steps) == 0\` or \`len(trajectories) == 0\`, raise \`ValueError("Inputs cannot be empty")\`.
   - If any trajectory series has a length different from \`len(time_steps)\`, raise \`ValueError("All trajectories must match time_steps length")\`.
2. Creates \`fig, ax = plt.subplots(figsize=(9, 5))\`.
3. Cycles through distinct linestyles (\`["-", "--", "-.", ":"]\`) and markers (\`["o", "s", "^", "D", "v"]\`) for each trajectory in \`trajectories.items()\`.
4. Plots each trajectory series with its corresponding name as the label.
5. Sets title to \`"Multi-Agent Trajectory Tracking"\`.
6. Sets x-axis label to \`"Time (s)"\` and y-axis label to \`"Position (m)"\`.
7. Enables grid with \`ax.grid(True, linestyle=":", alpha=0.6)\`.
8. Places the legend with \`ax.legend(loc="best")\`.
9. Returns the \`(fig, ax)\` tuple.`,
      hints: [
        'Use enumerate(trajectories.items()) to get an index for cycling styles.',
        'Use i % len(styles) and i % len(markers) to avoid out-of-bounds indexing.',
        'Pass label=name to ax.plot() so the legend picks up names automatically.'
      ],
      starterCode: `import matplotlib.pyplot as plt
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
    # TODO: Validate inputs, cycle styles/markers, plot each trajectory, style, and return (fig, ax)
    pass
`,
      solutionCode: `import matplotlib.pyplot as plt
from typing import List, Dict, Tuple

def plot_trajectories(
    time_steps: List[float],
    trajectories: Dict[str, List[float]]
) -> Tuple[plt.Figure, plt.Axes]:
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
`,
      testCases: challenge2TestCases,
      conceptPrimer: {
        title: 'Multi-Series Dynamics & Marker Differentiation',
        subtitle: 'Tracking multiple agents or sensors across a shared time horizon',
        overview: 'Learn how to handle arbitrary dictionaries of data series dynamically with cycling visual encodings.',
        mentalModel5s: 'Cycle markers and linestyles to keep curves readable without relying solely on color.',
        visualAnalogy: 'Giving each car in a telemetry race both a distinct paint color and roof decal pattern.',
        pitfalls: [
          'Hardcoding keys assuming a fixed set of trajectories.',
          'Not validating series lengths before plotting.'
        ],
        progressiveHints: [
          'Iterate over trajectories with enumerate.',
          'Use modulo arithmetic to cycle through markers and styles.',
          'Ensure ax.legend() is called to render series names.'
        ],
        mathFormulas: [
          {
            title: 'Cycling Modulo Formula',
            latex: 'k = i \\pmod M',
            explanation: 'Safely cycles an arbitrary series index i through M style choices.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Hardcoded manual plots
ax.plot(t, traj["agent1"])
ax.plot(t, traj["agent2"])`,
          naiveExplanation: 'Breaks immediately when dataset keys change dynamically.',
          idiomaticCode: `# Dynamic cycling loop
for i, (name, series) in enumerate(trajectories.items()):
    ax.plot(t, series, label=name, linestyle=styles[i % len(styles)])`,
          idiomaticExplanation: 'Adapts dynamically to any number of series with clean visual contrast.',
          speedupText: 'Scales to N series'
        },
        memoryLayout: {
          title: 'Line2D Collection in Axes',
          content: 'Axes maintains an internal list of Line2D artists that can be inspected via ax.get_lines().',
          diagramAscii: `Axes.lines = [ Line2D(Agent1), Line2D(Agent2), Line2D(Agent3) ]`,
          keyRule: 'Each ax.plot() appends to the Axes.lines list.'
        },
        keyTakeaways: [
          'Always cycle linestyles and markers for accessibility.',
          'Use enumerate with modulo for dynamic styling.',
          'Keep legends legible with loc="best".'
        ]
      },
      benchmarkTargetMs: 80,
      memoryTargetMb: 20
    }
  ]
};

export const MATPLOTLIB_PART01_TRACK = DAY01_TRACK;
export default DAY01_TRACK;
