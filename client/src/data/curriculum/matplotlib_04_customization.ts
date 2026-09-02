import type { DayTrack, Challenge, ConceptPrimerData, TestCase } from '../../types';

export type { DayTrack, Challenge, ConceptPrimerData, TestCase };

const challenge1TestCases: TestCase[] = [
  {
    id: 't1',
    name: 'Peak Anomaly Detection & Arrow Callout',
    inputDescription: 'timestamps=np.linspace(0, 10, 50), signal=np.sin(t) with spike 5.0 at t=25, label_text="Spike Error"',
    expectedOutput: '(fig, ax) with signal Line2D, anomaly scatter point, and Annotation artist with arrowprops'
  },
  {
    id: 't2',
    name: 'Mismatched Lengths Validation',
    inputDescription: 'timestamps=[0, 1, 2], signal=[1.0, 2.0]',
    expectedOutput: 'Raises ValueError("Timestamps and signal must have identical length")'
  },
  {
    id: 't3',
    name: 'Empty Input Validation',
    inputDescription: 'timestamps=[], signal=[]',
    expectedOutput: 'Raises ValueError("Inputs cannot be empty")'
  }
];

const challenge2TestCases: TestCase[] = [
  {
    id: 't1',
    name: 'Publication Figure PNG Export',
    inputDescription: 'x=[1, 2, 3, 4, 5], y=[2.1, 4.3, 6.0, 8.2, 10.5], y_err=[0.2, 0.3, 0.25, 0.4, 0.35], export_format="png", dpi=150',
    expectedOutput: '(fig, image_bytes) with despined top/right, error bars, and non-empty PNG bytes (> 5000 bytes)'
  },
  {
    id: 't2',
    name: 'Vector SVG Export',
    inputDescription: 'x=[1, 2, 3], y=[2, 4, 6], y_err=[0.1, 0.1, 0.1], export_format="svg"',
    expectedOutput: 'Valid SVG byte buffer containing "<svg" tag'
  },
  {
    id: 't3',
    name: 'Unsupported Export Format',
    inputDescription: 'export_format="bmp"',
    expectedOutput: 'Raises ValueError("Unsupported export format: bmp")'
  },
  {
    id: 't4',
    name: 'Invalid DPI (< 72)',
    inputDescription: 'dpi=50',
    expectedOutput: 'Raises ValueError("DPI must be at least 72")'
  }
];

export const testCases: TestCase[] = [...challenge1TestCases, ...challenge2TestCases];

export const DAY04_TRACK: DayTrack = {
  partNumber: 4,
  partId: 4,
  dayNumber: 4,
  id: 4,
  title: 'Part 4: Customization, Annotations & Export',
  subtitle: 'Master arrow annotations, spines cleanup, styling sheets, and publication-ready exports',
  description: 'Elevate your visualizations from exploratory drafts to publication-ready artifacts. Master pinpoint arrow annotations with ax.annotate(), Tufte minimalist spines cleanup, tick mark geometry, error bars, and in-memory export to high-resolution PNG and vector SVG formats.',
  iconName: 'Palette',
  badge: 'Part 4 • Customization & Export',
  libraryMechanics: {
    libraryName: 'Matplotlib Customization & Export',
    tagline: 'Publication-Grade Aesthetics & Headless Buffer Export',
    overview: `### 🎨 The Final 10%: Turning Charts into Publication Artifacts
In academic journals, executive presentations, and production dashboards, standard Matplotlib defaults (heavy gray boxes, default ticks, unannotated lines) fall short.

### 🏹 Point-to-Point Annotations
While basic text labels sit in coordinate space, \`ax.annotate()\` connects an arbitrary text offset (\`xytext\`) to an exact data coordinate (\`xy\`) with custom arrow styles (\`arrowprops\`).

### ✂️ The Tufte Minimalist Standard: Despining
Eliminating visual clutter increases the data-ink ratio. Top and right spines rarely carry information. Hiding them focuses the reader's attention directly onto the data curve.

### 💾 High-Res & Vector Export
Learn how to safely render figures to in-memory byte buffers (\`io.BytesIO\`) as 300 DPI raster PNGs or vector SVGs without saving temporary files to disk.`,
    whyItExists: `Production applications require saving images in memory to stream to web frontends, embed in PDFs, or store in S3 buckets.
Understanding figure export parameters (\`dpi\`, \`bbox_inches='tight'\`, \`format\`) ensures that labels are never clipped and diagrams look crisp on retina screens.`,
    coreAnatomy: {
      objectName: 'Annotation & Export Engine',
      description: 'The annotation artists, spine boundaries, and backend rendering pipeline.',
      fields: [
        {
          name: 'Annotation',
          type: 'matplotlib.text.Annotation',
          role: 'Composite artist pairing text with an arrow patch connecting xytext to xy.'
        },
        {
          name: 'Spines',
          type: 'dict[str, matplotlib.spines.Spine]',
          role: 'The four boundary lines enclosing the coordinate space (top, bottom, left, right).'
        },
        {
          name: 'Tick Parameters',
          type: 'ax.tick_params()',
          role: 'Controls tick mark length, width, direction (in vs out), and label font sizes.'
        },
        {
          name: 'fig.savefig()',
          type: 'method',
          role: 'Renders the figure through a backend canvas into a file or in-memory BytesIO buffer.'
        }
      ],
      memoryDiagramAscii: `+-------------------------------------------------------------+
|                 Publication Figure Architecture             |
|                                                             |
|           (Top spine hidden: set_visible(False))            |
|                                                             |
|    Y ^                 [xytext: "Anomaly Spike!"]           |
|      |                        \\                              |
|      |                         \\---> [xy: (x, y)] (Scatter) |
|      |    /--+--\\                                            |
|      |   /   |   \\ (Error bars)                              |
|      |  *    *    *                                         |
|      +-------------------------------------------> X        |
|     (Thickened left/bottom spine)   (Right spine hidden)    |
|                                                             |
|     fig.savefig(buf, format="png", dpi=300, bbox_inches="tight") |
+-------------------------------------------------------------+`
    },
    chapters: [
      {
        id: 'ch1-pinpoint-annotations',
        title: 'Pinpoint Annotations with ax.annotate()',
        icon: 'Navigation',
        summary: 'Direct reader attention with customizable arrows and offset callout text.',
        markdownContent: `### Connecting Text to Data Points with Arrows

\`ax.annotate()\` requires two coordinates:
1. \`xy\`: The exact data point the arrow points to.
2. \`xytext\`: The position where the text box is placed.

\`\`\`python
ax.annotate(
    text="Flash Anomaly (+4.2σ)",
    xy=(peak_x, peak_y),
    xytext=(peak_x + 1.5, peak_y + 0.8),
    arrowprops=dict(
        arrowstyle="->",
        color="#dc2626",
        lw=1.8
    ),
    fontweight="bold",
    color="#dc2626"
)
\`\`\``
      },
      {
        id: 'ch2-spines-and-ticks',
        title: 'Tufte Minimalist Despining',
        icon: 'Scissors',
        summary: 'Hide top and right spines and refine outward tick geometry.',
        markdownContent: `### Maximizing Data-Ink Ratio

Remove distracting box borders:
\`\`\`python
# Hide top and right spines
ax.spines["top"].set_visible(False)
ax.spines["right"].set_visible(False)

# Emphasize data axes
ax.spines["left"].set_linewidth(1.2)
ax.spines["bottom"].set_linewidth(1.2)

# Point ticks outward
ax.tick_params(direction="out", length=5, width=1.2)
\`\`\``
      },
      {
        id: 'ch3-in-memory-export',
        title: 'In-Memory Buffer Export (PNG & SVG)',
        icon: 'Download',
        summary: 'Render high-resolution raster and vector figures directly to memory without disk I/O.',
        markdownContent: `### Server-Safe In-Memory Rendering

Instead of writing to disk with a file path, save to an \`io.BytesIO\` buffer:

\`\`\`python
import io

buf = io.BytesIO()
fig.savefig(buf, format="png", dpi=300, bbox_inches="tight")
buf.seek(0)
image_bytes = buf.getvalue()
\`\`\`

- **\`dpi=300\`**: Publication quality resolution.
- **\`bbox_inches='tight'\`**: Prevents margin clipping.
- **\`format='svg'\`**: Infinite scalability for web frontends.`
      }
    ],
    commonTraps: [
      {
        title: 'Omitting bbox_inches="tight" on export',
        badSnippet: `# Figure exported without tight bounding box:
fig.savefig("figure.png", dpi=300)`,
        badExplanation: 'Long axis labels or rotated tick labels near the figure edge can get chopped off.',
        goodSnippet: `# Always specify bbox_inches="tight"
fig.savefig("figure.png", dpi=300, bbox_inches="tight")`,
        goodExplanation: 'Recalculates bounding box to ensure all annotations and labels are fully contained.',
        perfImpact: 'Prevents clipped text in exported figures.'
      },
      {
        title: 'Saving temporary image files to disk in server endpoints',
        badSnippet: `# Inefficient and causes race conditions across server workers
fig.savefig("/tmp/temp_plot.png")
with open("/tmp/temp_plot.png", "rb") as f:
    data = f.read()`,
        badExplanation: 'Incurs disk I/O latency and file locking issues in concurrent servers.',
        goodSnippet: `# Fast in-memory buffer
buf = io.BytesIO()
fig.savefig(buf, format="png", bbox_inches="tight")
return buf.getvalue()`,
        goodExplanation: 'Operates entirely in RAM with zero disk overhead and thread safety.',
        perfImpact: '10x faster rendering with zero disk contention.'
      }
    ],
    apiCheatSheet: [
      {
        name: 'ax.annotate',
        category: 'Annotation',
        signature: 'ax.annotate(text, xy, xytext=None, arrowprops=None, ...)',
        summary: 'Annotate the point xy with text s, with an optional arrow.',
        parameters: [
          { name: 'text', type: 'str', desc: 'The text of the annotation.' },
          { name: 'xy', type: 'tuple[float, float]', desc: 'The point (x, y) to annotate.' },
          { name: 'xytext', type: 'tuple[float, float]', desc: 'The position (x, y) to place the text at.' },
          { name: 'arrowprops', type: 'dict', desc: 'Dict of properties for ArrowPatch connecting xy to xytext.' }
        ],
        returns: 'Annotation artist.',
        exampleSnippet: `ax.annotate("Peak", xy=(x0, y0), xytext=(x0+1, y0+2), arrowprops=dict(arrowstyle="->"))`
      },
      {
        name: 'ax.spines',
        category: 'Geometry',
        signature: 'ax.spines[side].set_visible(bool)',
        summary: 'Control visibility and styling of axis boundary lines (top, bottom, left, right).',
        parameters: [
          { name: 'side', type: 'str', desc: '"top", "bottom", "left", or "right".' }
        ],
        returns: 'None.',
        exampleSnippet: `ax.spines["top"].set_visible(False)`
      },
      {
        name: 'ax.errorbar',
        category: 'Error & Confidence',
        signature: 'ax.errorbar(x, y, yerr=None, xerr=None, fmt="", ...)',
        summary: 'Plot y versus x as lines and/or markers with attached errorbars.',
        parameters: [
          { name: 'x, y', type: 'array-like', desc: 'Data positions.' },
          { name: 'yerr', type: 'array-like', desc: 'Error bar sizes along Y.' },
          { name: 'capsize', type: 'float', desc: 'Length of the error bar caps in points.' }
        ],
        returns: 'ErrorbarContainer artist.',
        exampleSnippet: `ax.errorbar(x, y, yerr=err, fmt="-o", capsize=4)`
      },
      {
        name: 'fig.savefig',
        category: 'Export',
        signature: 'fig.savefig(fname, dpi=None, format=None, bbox_inches=None, ...)',
        summary: 'Save the current figure to file or file-like buffer.',
        parameters: [
          { name: 'fname', type: 'str | BytesIO', desc: 'Destination file path or in-memory BytesIO buffer.' },
          { name: 'dpi', type: 'int', desc: 'Dots per inch for raster formats.' },
          { name: 'bbox_inches', type: 'str', desc: 'Set to "tight" for automatic margin cropping.' }
        ],
        returns: 'None.',
        exampleSnippet: `fig.savefig(buf, format="png", dpi=300, bbox_inches="tight")`
      }
    ],
    interactiveWidgetType: 'matplotlib-artists'
  },
  challenges: [
    {
      id: 'mpl-p4-c1',
      dayId: 4,
      partId: 4,
      title: 'Anomaly Annotation & Arrow Highlighter',
      slug: 'anomaly-annotation-arrow',
      difficulty: 'Intermediate',
      category: 'Customization & Export',
      summary: 'Detect the peak anomaly in a signal series, mark it with a distinct scatter point, and attach an arrow annotation with custom text.',
      mentalModel5s: 'Compute peak deviation index, plot scatter at (peak_x, peak_y), and point arrow with ax.annotate.',
      visualAnalogy: 'A weather radar pointing a bright red arrow directly at the epicenter of a thunderstorm.',
      pitfalls: [
        'Pointing the arrow to the wrong coordinate (xy must be the anomaly point, not the text point).',
        'Not validating that timestamps and signal have identical lengths.'
      ],
      progressiveHints: [
        'Find peak deviation: peak_idx = int(np.argmax(np.abs(signal - np.mean(signal)))).',
        'Extract coordinates: peak_x, peak_y = timestamps[peak_idx], signal[peak_idx].',
        'Plot signal with ax.plot() and mark anomaly with ax.scatter(peak_x, peak_y).',
        'Call ax.annotate(text, xy=(peak_x, peak_y), xytext=..., arrowprops=dict(arrowstyle="->", ...)).',
        'Decorate axes and return (fig, ax).'
      ],
      deepInternals: {
        title: 'Annotation Transform Blending',
        content: 'ax.annotate() by default interprets xy in data coordinates (ax.transData) while allowing xytext to be in data or display offset coordinates. The ArrowPatch artist is dynamically updated whenever axis limits change.',
        keyRule: 'xy specifies the target data point; xytext specifies the callout text box position.'
      },
      instructions: `In industrial telemetry and operational monitoring, automated anomaly alerts must pinpoint the exact timing and magnitude of unexpected signal spikes.

Write a function \`annotate_peak_anomaly(timestamps: np.ndarray, signal: np.ndarray, label_text: str = "Peak Anomaly") -> tuple[plt.Figure, plt.Axes]\` that:
1. Validates inputs:
   - If \`len(timestamps) == 0\` or \`len(signal) == 0\`, raise \`ValueError("Inputs cannot be empty")\`.
   - If \`len(timestamps) != len(signal)\`, raise \`ValueError("Timestamps and signal must have identical length")\`.
2. Identifies the peak anomaly index as the point with maximum absolute deviation from the mean (\`int(np.argmax(np.abs(signal - np.mean(signal))))\`).
3. Initializes a Figure and single Axes with a figure size of 10 by 5 inches (\`figsize=(10, 5)\`).
4. Plots the telemetry signal curve across timestamps (\`color="#2563eb"\`, \`linewidth=1.8\`, and \`label="Signal"\`).
5. Highlights the peak anomaly coordinate \`(peak_x, peak_y)\` with a prominent scatter point (\`color="#dc2626"\`, \`s=80\`, \`zorder=5\`, and \`label="Anomaly"\`).
6. Annotates the peak anomaly coordinate with an arrow callout featuring:
   - Formatted text: \`f"{label_text}: {peak_y:.2f}"\`
   - Target arrow coordinate: \`xy=(peak_x, peak_y)\`
   - Callout text position: \`xytext=(peak_x + (timestamps.max() - timestamps.min()) * 0.08, peak_y + (signal.max() - signal.min()) * 0.15)\`
   - Arrow properties: \`arrowprops=dict(arrowstyle="->", color="#dc2626", lw=1.8)\`
   - Bold typography: \`fontweight="bold"\`
7. Sets the title to \`"Signal Anomaly Detection"\`, the x-axis label to \`"Time (s)"\`, and the y-axis label to \`"Amplitude"\`.
8. Enables grid lines, displays the legend, and returns the \`(fig, ax)\` tuple.`,
      hints: [
        'Use np.argmax(np.abs(signal - np.mean(signal))) to locate the peak.',
        'Use ax.scatter(peak_x, peak_y, color="#dc2626", s=80, zorder=5).',
        'Pass arrowprops=dict(arrowstyle="->", color="#dc2626", lw=1.8) into ax.annotate().'
      ],
      starterCode: `import matplotlib.pyplot as plt
import numpy as np
from typing import Tuple, Any

def annotate_peak_anomaly(
    timestamps: np.ndarray,
    signal: np.ndarray,
    label_text: str = "Peak Anomaly"
) -> Tuple[plt.Figure, plt.Axes]:
    """
    Detect peak anomaly and attach arrow annotation with callout text.
    
    Returns:
        (fig, ax) tuple
    """
    # TODO: Validate inputs, find anomaly peak, plot signal and scatter, annotate with arrow callout, and return (fig, ax)
    pass
`,
      solutionCode: `import matplotlib.pyplot as plt
import numpy as np
from typing import Tuple

def annotate_peak_anomaly(
    timestamps: np.ndarray,
    signal: np.ndarray,
    label_text: str = "Peak Anomaly"
) -> Tuple[plt.Figure, plt.Axes]:
    t = np.asarray(timestamps, dtype=float)
    s = np.asarray(signal, dtype=float)
    
    if len(t) == 0 or len(s) == 0:
        raise ValueError("Inputs cannot be empty")
    if len(t) != len(s):
        raise ValueError("Timestamps and signal must have identical length")
        
    mean_val = float(np.mean(s))
    peak_idx = int(np.argmax(np.abs(s - mean_val)))
    peak_x, peak_y = float(t[peak_idx]), float(s[peak_idx])
    
    fig, ax = plt.subplots(figsize=(10, 5))
    
    # Main signal line
    ax.plot(t, s, color="#2563eb", linewidth=1.8, label="Signal")
    
    # Highlight anomaly scatter point
    ax.scatter(peak_x, peak_y, color="#dc2626", s=80, zorder=5, label="Anomaly")
    
    # Offset calculation
    x_span = float(t.max() - t.min()) if (t.max() - t.min()) > 0 else 1.0
    y_span = float(s.max() - s.min()) if (s.max() - s.min()) > 0 else 1.0
    
    ax.annotate(
        text=f"{label_text}: {peak_y:.2f}",
        xy=(peak_x, peak_y),
        xytext=(peak_x + x_span * 0.08, peak_y + y_span * 0.15),
        arrowprops=dict(arrowstyle="->", color="#dc2626", lw=1.8),
        fontweight="bold"
    )
    
    ax.set_title("Signal Anomaly Detection")
    ax.set_xlabel("Time (s)")
    ax.set_ylabel("Amplitude")
    ax.grid(True, linestyle=":", alpha=0.5)
    ax.legend(loc="upper right")
    
    return fig, ax
`,
      testCases: challenge1TestCases,
      conceptPrimer: {
        title: 'Pinpoint Annotations with Arrows',
        subtitle: 'Guiding reader attention to critical data anomalies',
        overview: 'Annotating specific data points with arrows transforms charts into storytelling tools.',
        mentalModel5s: 'xy is where the arrow lands; xytext is where the label sits.',
        visualAnalogy: 'A pushpin on a map with a red string leading to a handwritten note.',
        pitfalls: [
          'Confusing xy and xytext coordinates.',
          'Placing the text box outside the visible axis limits.'
        ],
        progressiveHints: [
          'Calculate deviation from mean.',
          'Find index with argmax.',
          'Plot signal curve and anomaly scatter.',
          'Attach arrow annotation.'
        ],
        mathFormulas: [
          {
            title: 'Absolute Deviation Anomaly Metric',
            latex: 'i^* = \\operatorname{argmax}_i |y_i - \\bar{y}|',
            explanation: 'Index of the most extreme deviation from the central mean.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Manual text placed arbitrarily
ax.text(peak_x, peak_y, "Anomaly")  # Overlaps the data point!`,
          naiveExplanation: 'Text collides directly with data markers and obscures the curve.',
          idiomaticCode: `# Clean arrow callout with offset
ax.annotate("Anomaly", xy=(peak_x, peak_y), xytext=(peak_x + dx, peak_y + dy),
            arrowprops=dict(arrowstyle="->"))`,
          idiomaticExplanation: 'Clear separation between label text and target coordinate.',
          speedupText: 'Unambiguous callout'
        },
        memoryLayout: {
          title: 'Annotation Artist',
          content: 'The Annotation artist manages both a Text instance and an ArrowPatch instance.',
          diagramAscii: `Annotation -> [ Text("Peak Anomaly"), ArrowPatch(xytext -> xy) ]`,
          keyRule: 'Stored in ax.texts collection.'
        },
        keyTakeaways: [
          'Use ax.annotate() whenever highlighting specific events or anomalies.',
          'Separate xy from xytext to avoid visual collisions.',
          'Set zorder=5 on key scatter highlights to ensure they sit above grid lines.'
        ]
      },
      benchmarkTargetMs: 80,
      memoryTargetMb: 20
    },
    {
      id: 'mpl-p4-c2',
      dayId: 4,
      partId: 4,
      title: 'Publication-Ready Scientific Figure',
      slug: 'publication-ready-figure',
      difficulty: 'Advanced',
      category: 'Customization & Export',
      summary: 'Construct an academic publication figure with error bars, Tufte minimalist spines, outward tick marks, and in-memory export to PNG/SVG.',
      mentalModel5s: 'Despine top and right boundary lines, attach error bars, and save to BytesIO buffer.',
      visualAnalogy: 'Framing a masterpiece: removing gaudy gold borders and using a museum-grade minimalist mount.',
      pitfalls: [
        'Saving temporary files to disk instead of using io.BytesIO.',
        'Not setting bbox_inches="tight", causing labels to get clipped at borders.'
      ],
      progressiveHints: [
        'Validate export_format is in ("png", "svg", "pdf") and dpi >= 72.',
        'Create fig, ax = plt.subplots(figsize=(7, 4.5), dpi=dpi).',
        'Plot error bars using ax.errorbar().',
        'Despine: ax.spines["top"].set_visible(False) and ax.spines["right"].set_visible(False).',
        'Thicken left and bottom spines, configure tick_params(direction="out").',
        'Save to BytesIO using fig.savefig(buf, format=fmt, dpi=dpi, bbox_inches="tight") and return (fig, buf.getvalue()).'
      ],
      deepInternals: {
        title: 'Vector vs Raster Export Backends',
        content: 'Matplotlib routes figure rendering through specialized Canvas backends: FigureCanvasAgg converts primitives into anti-aliased RGBA pixel buffers, while FigureCanvasSVG writes XML vector paths.',
        keyRule: 'Use SVG for crisp vector scaling on web displays; use 300+ DPI PNG for print publications.'
      },
      instructions: `In academic publishing (Nature, IEEE, ACM) and executive briefing decks, figures must follow strict aesthetic guidelines: minimal visual clutter, explicit error margins, and high resolution.

Write a function \`build_publication_figure(x: np.ndarray, y: np.ndarray, y_err: np.ndarray, export_format: str = "png", dpi: int = 300) -> tuple[plt.Figure, bytes]\` that:
1. Validates inputs:
   - If \`export_format.lower()\` is not in \`("png", "svg", "pdf")\`, raise \`ValueError("Unsupported export format")\`.
   - If \`len(x) == 0\`, \`len(y) == 0\`, or \`len(y_err) == 0\`, raise \`ValueError("Inputs cannot be empty")\`.
   - If \`len(x) != len(y)\` or \`len(x) != len(y_err)\`, raise \`ValueError("Array lengths must match")\`.
   - If \`dpi < 72\`, raise \`ValueError("DPI must be at least 72")\`.
2. Initializes a Figure and single Axes with a figure size of 7 by 4.5 inches at the specified resolution (\`figsize=(7, 4.5)\`, \`dpi=dpi\`).
3. Plots data points with error bars (\`yerr=y_err\`, marker and line format \`"-o"\`, \`color="#0f172a"\`, \`ecolor="#64748b"\`, \`elinewidth=1.5\`, \`capsize=4\`, \`capthick=1.5\`, \`markersize=5\`, \`label="Measurements"\`).
4. Restyles chart spines following clean publication standards:
   - Remove the top and right chart spines
   - Set left spine linewidth to 1.2
   - Set bottom spine linewidth to 1.2
5. Configures axis tick marks to point outward with a length of 5 and width of 1.2 (\`direction="out"\`, \`length=5\`, \`width=1.2\`).
6. Sets the title to \`"Experimental Response Function"\`, the x-axis label to \`"Independent Variable (X)"\`, and the y-axis label to \`"Response (Y)"\`.
7. Adds a borderless legend (\`frameon=False\`).
8. Applies tight layout padding.
9. Renders the figure into an in-memory byte buffer in the requested export format with a tight bounding box (\`bbox_inches="tight"\`).
10. Returns a tuple containing the Figure object and the serialized bytes \`(fig, image_bytes)\`.`,
      hints: [
        'Validate format with export_format.lower() in ("png", "svg", "pdf").',
        'Use ax.errorbar with capsize=4 and elinewidth=1.5.',
        'Use ax.spines["top"].set_visible(False) to hide borders.',
        'Write to buf = io.BytesIO() with fig.savefig(buf, bbox_inches="tight") and return buf.getvalue().'
      ],
      starterCode: `import matplotlib.pyplot as plt
import numpy as np
from typing import Tuple, Any

def build_publication_figure(
    x: np.ndarray,
    y: np.ndarray,
    y_err: np.ndarray,
    export_format: str = "png",
    dpi: int = 300
) -> Tuple[plt.Figure, bytes]:
    """
    Construct a publication-ready figure with error bars, despined axes, and in-memory export.
    
    Returns:
        (fig, image_bytes)
    """
    # TODO: Validate format and inputs, plot error bars, remove top and right spines, export to in-memory buffer, and return (fig, bytes)
    pass
`,
      solutionCode: `import matplotlib.pyplot as plt
import numpy as np
import io
from typing import Tuple

def build_publication_figure(
    x: np.ndarray,
    y: np.ndarray,
    y_err: np.ndarray,
    export_format: str = "png",
    dpi: int = 300
) -> Tuple[plt.Figure, bytes]:
    fmt = export_format.lower().strip()
    if fmt not in ("png", "svg", "pdf"):
        raise ValueError(f"Unsupported export format: {export_format}")
    if len(x) == 0 or len(y) == 0 or len(y_err) == 0:
        raise ValueError("Inputs cannot be empty")
    if len(x) != len(y) or len(x) != len(y_err):
        raise ValueError("Array lengths must match")
    if dpi < 72:
        raise ValueError("DPI must be at least 72")
        
    fig, ax = plt.subplots(figsize=(7, 4.5), dpi=dpi)
    
    ax.errorbar(
        x, y, yerr=y_err,
        fmt="-o",
        color="#0f172a",
        ecolor="#64748b",
        elinewidth=1.5,
        capsize=4,
        capthick=1.5,
        markersize=5,
        label="Measurements"
    )
    
    # Despine top and right
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_linewidth(1.2)
    ax.spines["bottom"].set_linewidth(1.2)
    
    ax.tick_params(direction="out", length=5, width=1.2)
    
    ax.set_title("Experimental Response Function")
    ax.set_xlabel("Independent Variable (X)")
    ax.set_ylabel("Response (Y)")
    ax.legend(frameon=False)
    
    fig.tight_layout()
    
    buf = io.BytesIO()
    fig.savefig(buf, format=fmt, dpi=dpi, bbox_inches="tight")
    buf.seek(0)
    image_bytes = buf.getvalue()
    
    return fig, image_bytes
`,
      testCases: challenge2TestCases,
      conceptPrimer: {
        title: 'Publication Standards & Headless Export',
        subtitle: 'Tufte minimalism, error metrics, and high-resolution buffer rendering',
        overview: 'Transform standard plots into publication-ready scientific figures with error bars, clean borders, and in-memory export.',
        mentalModel5s: 'Remove non-data ink (top/right spines), communicate uncertainty (error bars), and render to BytesIO.',
        visualAnalogy: 'Polishing rough cut gemstones into museum-quality display jewels.',
        pitfalls: [
          'Writing temporary files to disk in server environments.',
          'Missing bbox_inches="tight" causing clipped labels.'
        ],
        progressiveHints: [
          'Validate input lengths and format string.',
          'Plot errorbar with capsize and formatting.',
          'Hide top and right spines.',
          'Save to BytesIO buffer and return raw bytes.'
        ],
        mathFormulas: [
          {
            title: 'Sample Standard Error of the Mean (SEM)',
            latex: '\\text{SEM} = \\frac{\\sigma}{\\sqrt{n}}',
            explanation: 'The standard error metric plotted on the error bars.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Cluttered defaults and disk write
plt.plot(x, y)
plt.savefig("plot.png")  # Cluttered spines, low DPI, disk I/O`,
          naiveExplanation: 'Heavy borders, no error indicators, and slow disk I/O.',
          idiomaticCode: `# Clean publication standards with in-memory export
ax.errorbar(x, y, yerr=err, capsize=4)
ax.spines["top"].set_visible(False)
ax.spines["right"].set_visible(False)
buf = io.BytesIO()
fig.savefig(buf, format="png", dpi=300, bbox_inches="tight")`,
          idiomaticExplanation: 'Minimalist Tufte aesthetic with high-res in-memory rendering.',
          speedupText: 'Publication-ready artifact'
        },
        memoryLayout: {
          title: 'BytesIO In-Memory Stream',
          content: 'FigureCanvas streams binary encoded image data directly into a RAM buffer.',
          diagramAscii: `Figure -> Canvas.print_png() -> io.BytesIO -> bytes buffer`,
          keyRule: 'Use buf.getvalue() to extract the final raw byte sequence.'
        },
        keyTakeaways: [
          'Always despine top and right borders for scientific publications.',
          'Use ax.errorbar() to represent experimental uncertainty.',
          'Use io.BytesIO() for zero-disk-overhead rendering in web backends.'
        ]
      },
      benchmarkTargetMs: 120,
      memoryTargetMb: 25
    }
  ]
};

export const MATPLOTLIB_PART04_TRACK = DAY04_TRACK;
export default DAY04_TRACK;
