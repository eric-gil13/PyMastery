import React, { useState, useMemo } from 'react';
import {
  Layers,
  LineChart,
  BarChart2,
  Grid3X3,
  Sliders,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Copy,
  Check,
  Settings2,
} from 'lucide-react';

type MatplotlibTab = 'anatomy' | 'studio' | 'subplots';
type PlotType = 'line' | 'scatter' | 'bar' | 'step';
type DatasetPreset = 'sine' | 'linear_noisy' | 'exponential' | 'sales_distribution';

interface ArtistComponent {
  id: string;
  name: string;
  level: 'Figure' | 'Axes' | 'Axis' | 'Artist';
  description: string;
  pythonAccess: string;
  exampleSnippet: string;
  color: string;
}

const ARTIST_COMPONENTS: ArtistComponent[] = [
  {
    id: 'figure',
    name: 'Figure (Top-level canvas)',
    level: 'Figure',
    description: 'The whole window or page. Holds all subplots, colorbars, suptitles, and canvas renderers.',
    pythonAccess: 'fig = plt.figure(figsize=(8, 5), dpi=100)',
    exampleSnippet: 'fig.suptitle("Global Title", fontsize=14, y=0.98)',
    color: '#818cf8', // Indigo
  },
  {
    id: 'axes',
    name: 'Axes (The Plot Area)',
    level: 'Axes',
    description: 'The actual graphing region with coordinates. A Figure can have 1 or 50 Axes. Contains all data artists.',
    pythonAccess: 'ax = fig.add_subplot(1, 1, 1) or fig, ax = plt.subplots()',
    exampleSnippet: 'ax.set_title("Sensor Reading")\nax.set_facecolor("#18181b")',
    color: '#38bdf8', // Sky
  },
  {
    id: 'spines',
    name: 'Spines (Coordinate Boundaries)',
    level: 'Axis',
    description: 'The four boundary lines connecting axis tick marks and bounding the data area (top, bottom, left, right).',
    pythonAccess: "ax.spines['top'].set_visible(False)\nax.spines['right'].set_visible(False)",
    exampleSnippet: "ax.spines['left'].set_color('#6366f1')",
    color: '#a855f7', // Purple
  },
  {
    id: 'ticks',
    name: 'Axis Ticks & Locators',
    level: 'Axis',
    description: 'Determines where marks appear on axes (Locator) and what text labels they get (Formatter).',
    pythonAccess: 'ax.xaxis.set_major_locator(plt.MultipleLocator(1.0))\nax.set_xticks([0, 2, 4, 6])',
    exampleSnippet: 'ax.tick_params(colors="#a1a1aa", labelsize=10)',
    color: '#34d399', // Emerald
  },
  {
    id: 'artists',
    name: 'Primitive Artists (Lines, Patches, Collections)',
    level: 'Artist',
    description: 'The geometric primitives that draw data points: Line2D, Rectangle patches, PathCollection for scatter.',
    pythonAccess: "line, = ax.plot(x, y, color='cyan', lw=2)\nax.scatter(x, y, alpha=0.8)",
    exampleSnippet: 'line.set_antialiased(True)\nline.set_alpha(0.85)',
    color: '#f59e0b', // Amber
  },
  {
    id: 'legend',
    name: 'Legend & Text Annotations',
    level: 'Artist',
    description: 'High-level artist mapping series labels to visual symbols, plus text/arrow annotations.',
    pythonAccess: "ax.legend(loc='upper right', frameon=False)\nax.annotate('Peak', xy=(2, 8), xytext=(3, 10))",
    exampleSnippet: "ax.legend(facecolor='#27272a', edgecolor='none')",
    color: '#f43f5e', // Rose
  },
];

export const InteractiveMatplotlibVisualizer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MatplotlibTab>('studio');

  // Anatomy state
  const [selectedArtistId, setSelectedArtistId] = useState<string>('axes');

  // Live Studio state
  const [plotType, setPlotType] = useState<PlotType>('line');
  const [datasetPreset, setDatasetPreset] = useState<DatasetPreset>('sine');
  const [pointCount, setPointCount] = useState<number>(16);
  const [primaryColor, setPrimaryColor] = useState<string>('#6366f1');
  const [lineWidth, setLineWidth] = useState<number>(2.5);
  const [markerSize, setMarkerSize] = useState<number>(5);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showLegend, setShowLegend] = useState<boolean>(true);
  const [hideTopRightSpines, setHideTopRightSpines] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Subplots state
  const [subRows, setSubRows] = useState<number>(2);
  const [subCols, setSubCols] = useState<number>(2);
  const [shareX, setShareX] = useState<boolean>(false);
  const [shareY, setShareY] = useState<boolean>(false);
  const [selectedSubplot, setSelectedSubplot] = useState<{ r: number; c: number }>({ r: 0, c: 0 });

  // Generate synthetic points based on preset
  const dataPoints = useMemo(() => {
    const points: Array<{ x: number; y: number; label: string }> = [];
    for (let i = 0; i < pointCount; i++) {
      const t = i / (pointCount - 1);
      const x = Number((t * 10).toFixed(2));
      let y = 0;
      if (datasetPreset === 'sine') {
        y = Math.sin(t * Math.PI * 2) * 4 + 5;
      } else if (datasetPreset === 'linear_noisy') {
        const noise = (Math.sin(i * 1.7) * 0.7 + Math.cos(i * 3.1) * 0.3);
        y = t * 8 + 1 + noise;
      } else if (datasetPreset === 'exponential') {
        y = Math.exp(t * 2.3) * 0.9;
      } else {
        // Sales distribution
        const catVals = [3, 7, 4, 9, 6, 8, 11, 7, 10, 12, 8, 14, 11, 15, 13, 17];
        y = catVals[i % catVals.length];
      }
      points.push({ x, y: Number(y.toFixed(2)), label: `P${i}` });
    }
    return points;
  }, [pointCount, datasetPreset]);

  const selectedArtist = ARTIST_COMPONENTS.find((a) => a.id === selectedArtistId) || ARTIST_COMPONENTS[1];

  // SVG dimensions for plot
  const svgWidth = 520;
  const svgHeight = 280;
  const padL = 45;
  const padR = 25;
  const padT = 30;
  const padB = 40;
  const plotW = svgWidth - padL - padR;
  const plotH = svgHeight - padT - padB;

  // Min / Max
  const minY = Math.min(0, ...dataPoints.map((d) => d.y));
  const maxY = Math.max(10, ...dataPoints.map((d) => d.y));
  const minX = 0;
  const maxX = 10;

  const scaleX = (x: number) => padL + ((x - minX) / (maxX - minX)) * plotW;
  const scaleY = (y: number) => padT + plotH - ((y - minY) / (maxY - minY)) * plotH;

  const generatedCode = useMemo(() => {
    const lines = [
      'import matplotlib.pyplot as plt',
      'import numpy as np',
      '',
      `# 1. Create Figure and primary Axes`,
      `fig, ax = plt.subplots(figsize=(8, 4.5), dpi=100)`,
      '',
      `# 2. Plot Data (${plotType})`,
    ];

    if (plotType === 'line') {
      lines.push(`ax.plot(x, y, color='${primaryColor}', linewidth=${lineWidth}, marker='o', markersize=${markerSize}, label='Signal Alpha')`);
    } else if (plotType === 'scatter') {
      lines.push(`ax.scatter(x, y, color='${primaryColor}', s=${markerSize * 8}, alpha=0.85, edgecolors='none', label='Samples')`);
    } else if (plotType === 'bar') {
      lines.push(`ax.bar(x, y, color='${primaryColor}', width=0.4, alpha=0.9, label='Volume')`);
    } else {
      lines.push(`ax.step(x, y, color='${primaryColor}', where='mid', linewidth=${lineWidth}, label='Step Trace')`);
    }

    if (showGrid) {
      lines.push(`ax.grid(True, linestyle='--', alpha=0.3, color='#71717a')`);
    }
    if (hideTopRightSpines) {
      lines.push(`ax.spines['top'].set_visible(False)`);
      lines.push(`ax.spines['right'].set_visible(False)`);
    }
    if (showLegend) {
      lines.push(`ax.legend(frameon=False, loc='upper left')`);
    }
    lines.push(`ax.set_title("${datasetPreset.replace('_', ' ').toUpperCase()} Analysis", fontsize=12, pad=10)`);
    lines.push(`ax.set_xlabel("Time / Sequence (t)")`);
    lines.push(`ax.set_ylabel("Amplitude")`);
    lines.push(`plt.tight_layout()`);
    lines.push(`plt.show()`);
    return lines.join('\n');
  }, [plotType, primaryColor, lineWidth, markerSize, showGrid, hideTopRightSpines, showLegend, datasetPreset]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="bg-surface-elevated border border-surface-border rounded-2xl overflow-hidden shadow-2xl">
      {/* Studio Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-surface-border bg-surface-base px-4 py-3 gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <BarChart2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-100 flex items-center gap-2">
              <span>Matplotlib Artist & Plot Studio</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-mono">
                plt.subplots()
              </span>
            </div>
            <div className="text-[11px] text-zinc-400">
              Interactive Artist hierarchy, live reactive plotting canvas & subplot layout arranger
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-surface-panel p-1 rounded-xl border border-surface-border">
          <button
            onClick={() => setActiveTab('studio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'studio'
                ? 'bg-orange-500 text-zinc-950 font-bold shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <LineChart className="w-3.5 h-3.5" />
            <span>Live Plot Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('anatomy')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'anatomy'
                ? 'bg-orange-500 text-zinc-950 font-bold shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Artist Hierarchy</span>
          </button>

          <button
            onClick={() => setActiveTab('subplots')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'subplots'
                ? 'bg-orange-500 text-zinc-950 font-bold shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            <span>Subplots Matrix</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: LIVE PLOT STUDIO                                       */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'studio' && (
        <div className="p-5 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Visual Canvas */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-4 bg-zinc-950 border border-zinc-800/90 rounded-2xl relative shadow-inner">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-pulse" />
                    <span className="text-xs font-mono font-semibold text-zinc-300">Figure 1 (100 DPI)</span>
                  </div>
                  <div className="text-[11px] font-mono text-zinc-500">
                    Points: {dataPoints.length} | Range: [0.0, 10.0]
                  </div>
                </div>

                {/* SVG Matplotlib Simulation Canvas */}
                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="w-full h-auto select-none overflow-visible font-sans"
                >
                  {/* Axes Background */}
                  <rect
                    x={padL}
                    y={padT}
                    width={plotW}
                    height={plotH}
                    fill="#121214"
                    stroke={hideTopRightSpines ? 'none' : '#27272a'}
                  />

                  {/* Grid Lines */}
                  {showGrid && (
                    <g stroke="#27272a" strokeWidth="1" strokeDasharray="3 3">
                      {[0, 2.5, 5, 7.5, 10].map((v) => (
                        <line
                          key={`gx-${v}`}
                          x1={scaleX(v)}
                          y1={padT}
                          x2={scaleX(v)}
                          y2={padT + plotH}
                        />
                      ))}
                      {[0, 3, 6, 9, 12, 15].map((v) => (
                        <line
                          key={`gy-${v}`}
                          x1={padL}
                          y1={scaleY(v)}
                          x2={padL + plotW}
                          y2={scaleY(v)}
                        />
                      ))}
                    </g>
                  )}

                  {/* Bottom Spines & Left Spines */}
                  <line
                    x1={padL}
                    y1={padT + plotH}
                    x2={padL + plotW}
                    y2={padT + plotH}
                    stroke="#52525b"
                    strokeWidth="1.5"
                  />
                  <line
                    x1={padL}
                    y1={padT}
                    x2={padL + plotH}
                    stroke="#52525b"
                    strokeWidth="1.5"
                  />
                  {!hideTopRightSpines && (
                    <>
                      <line
                        x1={padL}
                        y1={padT}
                        x2={padL + plotW}
                        y2={padT}
                        stroke="#3f3f46"
                        strokeWidth="1"
                      />
                      <line
                        x1={padL + plotW}
                        y1={padT}
                        x2={padL + plotW}
                        y2={padT + plotH}
                        stroke="#3f3f46"
                        strokeWidth="1"
                      />
                    </>
                  )}

                  {/* X Axis Ticks & Labels */}
                  {[0, 2, 4, 6, 8, 10].map((val) => {
                    const x = scaleX(val);
                    return (
                      <g key={`xtick-${val}`}>
                        <line x1={x} y1={padT + plotH} x2={x} y2={padT + plotH + 4} stroke="#71717a" strokeWidth="1" />
                        <text
                          x={x}
                          y={padT + plotH + 16}
                          textAnchor="middle"
                          fill="#a1a1aa"
                          fontSize="10"
                          fontFamily="monospace"
                        >
                          {val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Y Axis Ticks & Labels */}
                  {[0, 4, 8, 12, 16].map((val) => {
                    const y = scaleY(val);
                    return (
                      <g key={`ytick-${val}`}>
                        <line x1={padL - 4} y1={y} x2={padL} y2={y} stroke="#71717a" strokeWidth="1" />
                        <text
                          x={padL - 8}
                          y={y + 3}
                          textAnchor="end"
                          fill="#a1a1aa"
                          fontSize="10"
                          fontFamily="monospace"
                        >
                          {val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Axis Title */}
                  <text
                    x={padL + plotW / 2}
                    y={padT - 10}
                    textAnchor="middle"
                    fill="#f4f4f5"
                    fontSize="11"
                    fontWeight="600"
                  >
                    {datasetPreset.replace('_', ' ').toUpperCase()} Trace
                  </text>

                  {/* Axis Labels */}
                  <text
                    x={padL + plotW / 2}
                    y={svgHeight - 8}
                    textAnchor="middle"
                    fill="#71717a"
                    fontSize="10"
                  >
                    Time Index (t)
                  </text>
                  <text
                    x={12}
                    y={padT + plotH / 2}
                    textAnchor="middle"
                    fill="#71717a"
                    fontSize="10"
                    transform={`rotate(-90 12 ${padT + plotH / 2})`}
                  >
                    Value (y)
                  </text>

                  {/* DATA ARTISTS RENDERING */}
                  {plotType === 'line' && (
                    <>
                      <polyline
                        fill="none"
                        stroke={primaryColor}
                        strokeWidth={lineWidth}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={dataPoints.map((d) => `${scaleX(d.x)},${scaleY(d.y)}`).join(' ')}
                      />
                      {dataPoints.map((d, i) => (
                        <circle
                          key={i}
                          cx={scaleX(d.x)}
                          cy={scaleY(d.y)}
                          r={markerSize}
                          fill={primaryColor}
                          stroke="#18181b"
                          strokeWidth="1.5"
                          className="transition-all hover:scale-125"
                        />
                      ))}
                    </>
                  )}

                  {plotType === 'scatter' && (
                    <g>
                      {dataPoints.map((d, i) => (
                        <circle
                          key={i}
                          cx={scaleX(d.x)}
                          cy={scaleY(d.y)}
                          r={markerSize * 1.5}
                          fill={primaryColor}
                          fillOpacity="0.8"
                          stroke={primaryColor}
                          strokeWidth="1"
                        />
                      ))}
                    </g>
                  )}

                  {plotType === 'bar' && (
                    <g>
                      {dataPoints.map((d, i) => {
                        const barW = Math.max(6, (plotW / dataPoints.length) * 0.7);
                        const x = scaleX(d.x) - barW / 2;
                        const y = scaleY(d.y);
                        const h = padT + plotH - y;
                        return (
                          <rect
                            key={i}
                            x={x}
                            y={y}
                            width={barW}
                            height={h}
                            fill={primaryColor}
                            fillOpacity="0.85"
                            rx="2"
                          />
                        );
                      })}
                    </g>
                  )}

                  {plotType === 'step' && (
                    <g>
                      {(() => {
                        let pathD = `M ${scaleX(dataPoints[0].x)} ${scaleY(dataPoints[0].y)}`;
                        for (let i = 1; i < dataPoints.length; i++) {
                          const prev = dataPoints[i - 1];
                          const curr = dataPoints[i];
                          const midX = scaleX((prev.x + curr.x) / 2);
                          pathD += ` H ${midX} V ${scaleY(curr.y)} H ${scaleX(curr.x)}`;
                        }
                        return (
                          <path
                            d={pathD}
                            fill="none"
                            stroke={primaryColor}
                            strokeWidth={lineWidth}
                          />
                        );
                      })()}
                    </g>
                  )}

                  {/* Legend Box */}
                  {showLegend && (
                    <g transform={`translate(${padL + 12}, ${padT + 12})`}>
                      <rect
                        width="115"
                        height="32"
                        rx="6"
                        fill="#18181b"
                        stroke="#27272a"
                        fillOpacity="0.9"
                      />
                      <line
                        x1="10"
                        y1="16"
                        x2="28"
                        y2="16"
                        stroke={primaryColor}
                        strokeWidth="2.5"
                      />
                      <circle cx="19" cy="16" r="3" fill={primaryColor} />
                      <text x="36" y="20" fill="#e4e4e7" fontSize="10" fontFamily="sans-serif">
                        Signal Alpha
                      </text>
                    </g>
                  )}
                </svg>
              </div>

              {/* Intuition Callout */}
              <div className="p-3.5 bg-orange-950/20 border border-orange-900/30 rounded-xl text-xs text-orange-200/90 leading-relaxed flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Object-Oriented Matplotlib Rule:</strong> Always instantiate{' '}
                  <code className="bg-orange-900/40 px-1 py-0.5 rounded text-orange-300">fig, ax = plt.subplots()</code>{' '}
                  rather than using implicit <code className="bg-orange-900/40 px-1 py-0.5 rounded text-orange-300">plt.plot()</code>.
                  This ensures full programmatic control over Spines, Axes tick locators, and multiple data layers!
                </div>
              </div>
            </div>

            {/* Right Column: Controls & Code Generator */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-4 bg-surface-base border border-surface-border rounded-xl space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-surface-border">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-200">
                    <Sliders className="w-3.5 h-3.5 text-orange-400" />
                    <span>Live Parameters</span>
                  </div>
                  <button
                    onClick={() => {
                      setPlotType('line');
                      setDatasetPreset('sine');
                      setPrimaryColor('#6366f1');
                      setLineWidth(2.5);
                      setMarkerSize(5);
                      setShowGrid(true);
                      setShowLegend(true);
                      setHideTopRightSpines(true);
                    }}
                    className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 transition"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>

                {/* Plot Type Selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Plot Primitive
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['line', 'scatter', 'bar', 'step'] as PlotType[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setPlotType(t)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold capitalize border transition ${
                          plotType === t
                            ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                            : 'bg-surface-elevated border-surface-border text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dataset Preset */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Synthetic Dataset
                  </label>
                  <select
                    value={datasetPreset}
                    onChange={(e) => setDatasetPreset(e.target.value as DatasetPreset)}
                    className="w-full px-3 py-2 bg-surface-elevated border border-surface-border rounded-lg text-xs text-zinc-200 font-mono focus:outline-none focus:border-orange-500"
                  >
                    <option value="sine">Sine Wave (Harmonic)</option>
                    <option value="linear_noisy">Noisy Linear Trend</option>
                    <option value="exponential">Exponential Growth</option>
                    <option value="sales_distribution">Categorical Sales</option>
                  </select>
                </div>

                {/* Color Palette */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Color Palette
                  </label>
                  <div className="flex items-center gap-2">
                    {[
                      { hex: '#6366f1', label: 'Indigo' },
                      { hex: '#10b981', label: 'Emerald' },
                      { hex: '#f59e0b', label: 'Amber' },
                      { hex: '#f43f5e', label: 'Rose' },
                      { hex: '#06b6d4', label: 'Cyan' },
                    ].map((c) => (
                      <button
                        key={c.hex}
                        onClick={() => setPrimaryColor(c.hex)}
                        title={c.label}
                        className={`w-6 h-6 rounded-full border-2 transition ${
                          primaryColor === c.hex ? 'border-white scale-110' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                </div>

                {/* Sliders */}
                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">Line Width</span>
                      <span className="font-mono text-zinc-300">{lineWidth}px</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="6"
                      step="0.5"
                      value={lineWidth}
                      onChange={(e) => setLineWidth(Number(e.target.value))}
                      className="w-full accent-orange-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">Marker / Point Size</span>
                      <span className="font-mono text-zinc-300">{markerSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="10"
                      value={markerSize}
                      onChange={(e) => setMarkerSize(Number(e.target.value))}
                      className="w-full accent-orange-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">Number of Points</span>
                      <span className="font-mono text-zinc-300">{pointCount}</span>
                    </div>
                    <input
                      type="range"
                      min="8"
                      max="32"
                      value={pointCount}
                      onChange={(e) => setPointCount(Number(e.target.value))}
                      className="w-full accent-orange-500"
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-surface-border">
                  <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showGrid}
                      onChange={(e) => setShowGrid(e.target.checked)}
                      className="rounded accent-orange-500"
                    />
                    <span>Show Grid</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showLegend}
                      onChange={(e) => setShowLegend(e.target.checked)}
                      className="rounded accent-orange-500"
                    />
                    <span>Show Legend</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer col-span-2">
                    <input
                      type="checkbox"
                      checked={hideTopRightSpines}
                      onChange={(e) => setHideTopRightSpines(e.target.checked)}
                      className="rounded accent-orange-500"
                    />
                    <span>Despine (Hide Top & Right borders)</span>
                  </label>
                </div>
              </div>

              {/* Generated Python Snippet */}
              <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-semibold text-orange-400">Equivalent Python Script</span>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-200 transition"
                  >
                    {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="text-[11px] font-mono text-zinc-300 overflow-x-auto max-h-44 custom-scrollbar whitespace-pre">
                  {generatedCode}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: ARTIST HIERARCHY ANATOMY                               */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'anatomy' && (
        <div className="p-5 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {ARTIST_COMPONENTS.map((comp) => {
              const isSelected = comp.id === selectedArtistId;
              return (
                <button
                  key={comp.id}
                  onClick={() => setSelectedArtistId(comp.id)}
                  className={`p-4 rounded-xl text-left border transition space-y-2 ${
                    isSelected
                      ? 'bg-surface-base border-orange-500 shadow-md ring-1 ring-orange-500/30'
                      : 'bg-surface-elevated border-surface-border hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold"
                      style={{
                        backgroundColor: `${comp.color}20`,
                        color: comp.color,
                        border: `1px solid ${comp.color}40`,
                      }}
                    >
                      {comp.level}
                    </span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-orange-400" />}
                  </div>
                  <div className="text-xs font-bold text-zinc-100">{comp.name}</div>
                  <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                    {comp.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Detailed Inspector for Selected Artist */}
          <div className="p-6 bg-surface-base border border-surface-border rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: selectedArtist.color }}
                />
                <h3 className="text-sm font-bold text-white">{selectedArtist.name}</h3>
              </div>
              <span className="text-xs font-mono text-zinc-400">Object Type: {selectedArtist.level}</span>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">{selectedArtist.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
                <div className="text-[11px] font-mono font-semibold text-sky-400 uppercase">
                  How to Access / Instantiate:
                </div>
                <pre className="text-xs font-mono text-zinc-200 overflow-x-auto whitespace-pre">
                  {selectedArtist.pythonAccess}
                </pre>
              </div>

              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
                <div className="text-[11px] font-mono font-semibold text-emerald-400 uppercase">
                  Common Customization Idiom:
                </div>
                <pre className="text-xs font-mono text-zinc-200 overflow-x-auto whitespace-pre">
                  {selectedArtist.exampleSnippet}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: SUBPLOTS MATRIX                                        */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'subplots' && (
        <div className="p-5 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Grid Layout View */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-3 shadow-inner">
                <div className="flex items-center justify-between text-xs text-zinc-400 font-mono pb-2 border-b border-zinc-800">
                  <span>Figure Canvas ({subRows} × {subCols} Grid = {subRows * subCols} Axes)</span>
                  <span className="text-orange-400">
                    Selected: ax[{selectedSubplot.r}, {selectedSubplot.c}]
                  </span>
                </div>

                {/* Interactive Grid of Axes */}
                <div
                  className="grid gap-3 select-none"
                  style={{
                    gridTemplateRows: `repeat(${subRows}, minmax(80px, 1fr))`,
                    gridTemplateColumns: `repeat(${subCols}, minmax(80px, 1fr))`,
                  }}
                >
                  {Array.from({ length: subRows }).map((_, r) =>
                    Array.from({ length: subCols }).map((_, c) => {
                      const isSelected = selectedSubplot.r === r && selectedSubplot.c === c;
                      return (
                        <div
                          key={`${r}-${c}`}
                          onClick={() => setSelectedSubplot({ r, c })}
                          className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition ${
                            isSelected
                              ? 'bg-orange-950/30 border-orange-500 shadow-md'
                              : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className={isSelected ? 'text-orange-300 font-bold' : 'text-zinc-400'}>
                              ax[{r}, {c}]
                            </span>
                            <span className="text-[10px] text-zinc-500">Idx: {r * subCols + c}</span>
                          </div>

                          {/* Mini Plot Mockup */}
                          <div className="h-10 flex items-end justify-between px-1 border-b border-l border-zinc-700">
                            <div className="w-1.5 h-3 bg-orange-400/40 rounded-t" />
                            <div className="w-1.5 h-6 bg-orange-400/60 rounded-t" />
                            <div className="w-1.5 h-4 bg-orange-400/50 rounded-t" />
                            <div className="w-1.5 h-8 bg-orange-400/80 rounded-t" />
                          </div>

                          <div className="text-[10px] text-zinc-500 font-mono text-center">
                            Subplot ({r + 1}, {c + 1})
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Subplot Configuration */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-4 bg-surface-base border border-surface-border rounded-xl space-y-4">
                <div className="text-xs font-bold text-zinc-200 flex items-center gap-1.5 pb-2 border-b border-surface-border">
                  <Settings2 className="w-3.5 h-3.5 text-orange-400" />
                  <span>Subplot Configuration</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-400">Rows (nrows)</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3].map((num) => (
                        <button
                          key={num}
                          onClick={() => setSubRows(num)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${
                            subRows === num
                              ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                              : 'bg-surface-elevated border-surface-border text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-400">Columns (ncols)</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4].map((num) => (
                        <button
                          key={num}
                          onClick={() => setSubCols(num)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${
                            subCols === num
                              ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                              : 'bg-surface-elevated border-surface-border text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-surface-border">
                  <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shareX}
                      onChange={(e) => setShareX(e.target.checked)}
                      className="rounded accent-orange-500"
                    />
                    <span>sharex=True (All subplots share same X scale)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shareY}
                      onChange={(e) => setShareY(e.target.checked)}
                      className="rounded accent-orange-500"
                    />
                    <span>sharey=True (All subplots share same Y scale)</span>
                  </label>
                </div>
              </div>

              {/* Subplots Python Snippet */}
              <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
                <span className="text-[11px] font-mono font-semibold text-orange-400">
                  Subplots Initialization Idiom
                </span>
                <pre className="text-[11px] font-mono text-zinc-300 overflow-x-auto whitespace-pre leading-relaxed">
{`fig, axes = plt.subplots(
    nrows=${subRows}, 
    ncols=${subCols}, 
    sharex=${shareX ? 'True' : 'False'}, 
    sharey=${shareY ? 'True' : 'False'},
    figsize=(${subCols * 3.5}, ${subRows * 2.5})
)

# Accessing selected subplot:
target_ax = axes[${selectedSubplot.r}, ${selectedSubplot.c}]
target_ax.plot(x, y, color='tab:orange')
target_ax.set_title("Panel (${selectedSubplot.r}, ${selectedSubplot.c})")

plt.tight_layout()`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveMatplotlibVisualizer;
