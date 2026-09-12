import React, { useState, useMemo } from 'react';
import {
  GitMerge,
  Sliders,
  RotateCcw,
  Copy,
  Check,
  Split,
  Activity,
  ShieldCheck,
} from 'lucide-react';

type SklearnTab = 'pipeline' | 'boundary' | 'crossval';
type DatasetType = 'blobs' | 'moons' | 'circles';
type ModelType = 'logistic' | 'tree' | 'knn';

interface Point2D {
  x: number;
  y: number;
  label: 0 | 1;
}

export const InteractiveSklearnVisualizer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SklearnTab>('boundary');

  // Pipeline builder state
  const [imputer, setImputer] = useState<'none' | 'mean' | 'median'>('mean');
  const [scaler, setScaler] = useState<'none' | 'standard' | 'minmax'>('standard');
  const [featureEng, setFeatureEng] = useState<'none' | 'pca' | 'poly'>('pca');
  const [classifier, setClassifier] = useState<'logistic' | 'tree' | 'knn'>('logistic');
  const [copiedPipeCode, setCopiedPipeCode] = useState<boolean>(false);

  // Decision Boundary playground state
  const [datasetType, setDatasetType] = useState<DatasetType>('moons');
  const [modelType, setModelType] = useState<ModelType>('knn');
  const [cParam, setCParam] = useState<number>(1.0);
  const [maxDepth, setMaxDepth] = useState<number>(3);
  const [kNeighbors, setKNeighbors] = useState<number>(5);

  // Cross-validation state
  const [kFolds, setKFolds] = useState<number>(5);
  const [shuffleFolds, setShuffleFolds] = useState<boolean>(true);

  // Generate synthetic 2D points
  const points: Point2D[] = useMemo(() => {
    const pts: Point2D[] = [];
    const n = 36;

    if (datasetType === 'blobs') {
      for (let i = 0; i < n; i++) {
        const isC1 = i >= n / 2;
        const cx = isC1 ? 6.5 : 3.5;
        const cy = isC1 ? 6.5 : 3.5;
        const rx = (Math.sin(i * 3.7) * 1.5 + Math.cos(i * 1.3) * 0.5);
        const ry = (Math.cos(i * 2.9) * 1.5 + Math.sin(i * 4.1) * 0.5);
        pts.push({
          x: Math.max(0.5, Math.min(9.5, cx + rx)),
          y: Math.max(0.5, Math.min(9.5, cy + ry)),
          label: isC1 ? 1 : 0,
        });
      }
    } else if (datasetType === 'moons') {
      const half = n / 2;
      for (let i = 0; i < half; i++) {
        const angle = (i / (half - 1)) * Math.PI;
        const noiseX = (Math.sin(i * 5) * 0.35);
        const noiseY = (Math.cos(i * 7) * 0.35);
        pts.push({
          x: 2.5 + Math.cos(angle) * 2.2 + noiseX,
          y: 4.0 + Math.sin(angle) * 2.2 + noiseY,
          label: 0,
        });
      }
      for (let i = 0; i < half; i++) {
        const angle = (i / (half - 1)) * Math.PI;
        const noiseX = (Math.cos(i * 4) * 0.35);
        const noiseY = (Math.sin(i * 6) * 0.35);
        pts.push({
          x: 4.8 + Math.cos(angle) * 2.2 + noiseX,
          y: 6.2 - Math.sin(angle) * 2.2 + noiseY,
          label: 1,
        });
      }
    } else {
      // Circles
      const half = n / 2;
      for (let i = 0; i < half; i++) {
        const angle = (i / half) * Math.PI * 2;
        const r = 1.6 + (Math.sin(i * 3) * 0.25);
        pts.push({
          x: 5.0 + Math.cos(angle) * r,
          y: 5.0 + Math.sin(angle) * r,
          label: 0,
        });
      }
      for (let i = 0; i < half; i++) {
        const angle = (i / half) * Math.PI * 2;
        const r = 3.6 + (Math.cos(i * 4) * 0.3);
        pts.push({
          x: 5.0 + Math.cos(angle) * r,
          y: 5.0 + Math.sin(angle) * r,
          label: 1,
        });
      }
    }
    return pts;
  }, [datasetType]);

  // Model prediction function at any (x, y)
  const predictPoint = (x: number, y: number): 0 | 1 => {
    if (modelType === 'logistic') {
      // Linear hyperplane decision boundary
      let score = 0;
      if (datasetType === 'blobs') {
        score = (x - 5.0) + (y - 5.0) * (cParam >= 1 ? 1.2 : 0.6);
      } else if (datasetType === 'moons') {
        score = (y - 5.0) - (x - 4.0) * 0.5 * cParam;
      } else {
        // Circles: logistic regression fails linearly without polynomial features!
        score = (x + y - 10) * cParam;
      }
      return score >= 0 ? 1 : 0;
    }

    if (modelType === 'tree') {
      // Axis-aligned orthogonal splits
      if (maxDepth === 1) {
        return x >= 5.0 ? 1 : 0;
      } else if (maxDepth === 2) {
        if (x < 4.5) return y > 4.5 ? 0 : 1;
        return y > 5.5 ? 1 : 0;
      } else {
        // Higher depth splits
        if (datasetType === 'circles') {
          const inBox = x >= 3.2 && x <= 6.8 && y >= 3.2 && y <= 6.8;
          return inBox ? 0 : 1;
        }
        if (datasetType === 'moons') {
          if (x < 3.5) return 0;
          if (x > 6.0) return 1;
          return y < 5.2 ? 0 : 1;
        }
        return (x > 4.5 && y > 4.5) ? 1 : 0;
      }
    }

    // k-NN
    const distances = points.map((p) => ({
      d2: Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2),
      label: p.label,
    }));
    distances.sort((a, b) => a.d2 - b.d2);
    const topK = distances.slice(0, Math.min(kNeighbors, points.length));
    const votes1 = topK.filter((item) => item.label === 1).length;
    return votes1 >= topK.length / 2 ? 1 : 0;
  };

  // Compute confusion matrix & metrics
  const metrics = useMemo(() => {
    let tp = 0;
    let fp = 0;
    let tn = 0;
    let fn = 0;

    points.forEach((p) => {
      const pred = predictPoint(p.x, p.y);
      if (p.label === 1 && pred === 1) tp++;
      else if (p.label === 0 && pred === 1) fp++;
      else if (p.label === 0 && pred === 0) tn++;
      else if (p.label === 1 && pred === 0) fn++;
    });

    const total = points.length;
    const accuracy = ((tp + tn) / total) * 100;
    const precision = tp + fp > 0 ? (tp / (tp + fp)) * 100 : 0;
    const recall = tp + fn > 0 ? (tp / (tp + fn)) * 100 : 0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    return { tp, fp, tn, fn, accuracy, precision, recall, f1 };
  }, [points, modelType, cParam, maxDepth, kNeighbors, datasetType]);

  // Grid background cells for decision boundary raster
  const gridResolution = 24;
  const gridCells = useMemo(() => {
    const cells: Array<{ x: number; y: number; pred: 0 | 1 }> = [];
    for (let i = 0; i < gridResolution; i++) {
      for (let j = 0; j < gridResolution; j++) {
        const x = (i / (gridResolution - 1)) * 10;
        const y = (j / (gridResolution - 1)) * 10;
        cells.push({ x, y, pred: predictPoint(x, y) });
      }
    }
    return cells;
  }, [gridResolution, modelType, cParam, maxDepth, kNeighbors, datasetType, points]);

  // SVG Scalers
  const svgSize = 340;
  const scale = (val: number) => (val / 10) * svgSize;

  // Pipeline Code
  const generatedPipelineCode = useMemo(() => {
    const steps: string[] = [];
    const imports = ['from sklearn.pipeline import Pipeline'];

    if (imputer !== 'none') {
      imports.push('from sklearn.impute import SimpleImputer');
      steps.push(`    ('imputer', SimpleImputer(strategy='${imputer}'))`);
    }
    if (scaler !== 'none') {
      const scalerClass = scaler === 'standard' ? 'StandardScaler' : 'MinMaxScaler';
      imports.push(`from sklearn.preprocessing import ${scalerClass}`);
      steps.push(`    ('scaler', ${scalerClass}())`);
    }
    if (featureEng === 'pca') {
      imports.push('from sklearn.decomposition import PCA');
      steps.push(`    ('pca', PCA(n_components=2))`);
    } else if (featureEng === 'poly') {
      imports.push('from sklearn.preprocessing import PolynomialFeatures');
      steps.push(`    ('poly', PolynomialFeatures(degree=2, include_bias=False))`);
    }

    if (classifier === 'logistic') {
      imports.push('from sklearn.linear_model import LogisticRegression');
      steps.push(`    ('model', LogisticRegression(C=1.0, max_iter=500))`);
    } else if (classifier === 'tree') {
      imports.push('from sklearn.tree import DecisionTreeClassifier');
      steps.push(`    ('model', DecisionTreeClassifier(max_depth=4))`);
    } else {
      imports.push('from sklearn.neighbors import KNeighborsClassifier');
      steps.push(`    ('model', KNeighborsClassifier(n_neighbors=5))`);
    }

    return `${Array.from(new Set(imports)).join('\n')}

# End-to-end Pipeline: prevents data leakage between train & test sets!
model_pipeline = Pipeline([
${steps.join(',\n')}
])

# Fit on training data & evaluate
model_pipeline.fit(X_train, y_train)
accuracy = model_pipeline.score(X_test, y_test)
print(f"Pipeline Test Accuracy: {accuracy:.4f}")`;
  }, [imputer, scaler, featureEng, classifier]);

  return (
    <div className="bg-surface-elevated border border-surface-border rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-surface-border bg-surface-base px-4 py-3 gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-100 flex items-center gap-2">
              <span>Scikit-Learn Pipeline & ML Studio</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                Pipeline(fit, predict)
              </span>
            </div>
            <div className="text-[11px] text-zinc-400">
              Interactive decision boundaries, confusion matrix metrics & leakage-free pipelines
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-surface-panel p-1 rounded-xl border border-surface-border">
          <button
            onClick={() => setActiveTab('boundary')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'boundary'
                ? 'bg-emerald-500 text-zinc-950 font-bold shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Decision Boundary</span>
          </button>

          <button
            onClick={() => setActiveTab('pipeline')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'pipeline'
                ? 'bg-emerald-500 text-zinc-950 font-bold shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <GitMerge className="w-3.5 h-3.5" />
            <span>Pipeline Builder</span>
          </button>

          <button
            onClick={() => setActiveTab('crossval')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'crossval'
                ? 'bg-emerald-500 text-zinc-950 font-bold shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Split className="w-3.5 h-3.5" />
            <span>K-Fold Cross-Val</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: DECISION BOUNDARY & CONFUSION MATRIX PLAYGROUND        */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'boundary' && (
        <div className="p-5 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: 2D Decision Boundary Canvas */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col items-center shadow-inner">
                <div className="w-full flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-mono font-semibold text-zinc-200">
                      Feature Space [x₁, x₂]
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-mono">
                    <span className="flex items-center gap-1 text-indigo-400">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" /> Class 0
                    </span>
                    <span className="flex items-center gap-1 text-amber-400">
                      <span className="w-2 h-2 rounded-full bg-amber-500" /> Class 1
                    </span>
                  </div>
                </div>

                {/* SVG 2D Canvas */}
                <div className="relative border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
                  <svg
                    width={svgSize}
                    height={svgSize}
                    className="select-none bg-zinc-900"
                  >
                    {/* Shaded decision boundary tiles */}
                    {gridCells.map((cell, idx) => {
                      const cellSize = svgSize / (gridResolution - 1);
                      return (
                        <rect
                          key={`tile-${idx}`}
                          x={scale(cell.x) - cellSize / 2}
                          y={svgSize - scale(cell.y) - cellSize / 2}
                          width={cellSize}
                          height={cellSize}
                          fill={cell.pred === 1 ? '#f59e0b' : '#6366f1'}
                          fillOpacity="0.18"
                        />
                      );
                    })}

                    {/* Coordinate axes */}
                    <line x1={0} y1={svgSize / 2} x2={svgSize} y2={svgSize / 2} stroke="#27272a" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1={svgSize / 2} y1={0} x2={svgSize / 2} y2={svgSize} stroke="#27272a" strokeWidth="1" strokeDasharray="4 4" />

                    {/* Data Points */}
                    {points.map((p, idx) => {
                      const pred = predictPoint(p.x, p.y);
                      const isCorrect = pred === p.label;
                      const cx = scale(p.x);
                      const cy = svgSize - scale(p.y);
                      return (
                        <g key={`pt-${idx}`}>
                          <circle
                            cx={cx}
                            cy={cy}
                            r={isCorrect ? 5 : 6.5}
                            fill={p.label === 1 ? '#f59e0b' : '#6366f1'}
                            stroke={isCorrect ? '#18181b' : '#ef4444'}
                            strokeWidth={isCorrect ? 1.5 : 2.5}
                            className="transition-transform hover:scale-150"
                          />
                          {!isCorrect && (
                            <circle
                              cx={cx}
                              cy={cy}
                              r={8.5}
                              fill="none"
                              stroke="#ef4444"
                              strokeWidth="1"
                              strokeDasharray="2 2"
                            />
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* Confusion Matrix & Metrics Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-surface-base border border-surface-border rounded-xl text-center space-y-1">
                  <div className="text-[10px] uppercase font-mono text-zinc-500">Accuracy</div>
                  <div className="text-base font-bold font-mono text-emerald-400">
                    {metrics.accuracy.toFixed(1)}%
                  </div>
                </div>
                <div className="p-3 bg-surface-base border border-surface-border rounded-xl text-center space-y-1">
                  <div className="text-[10px] uppercase font-mono text-zinc-500">Precision</div>
                  <div className="text-base font-bold font-mono text-sky-400">
                    {metrics.precision.toFixed(1)}%
                  </div>
                </div>
                <div className="p-3 bg-surface-base border border-surface-border rounded-xl text-center space-y-1">
                  <div className="text-[10px] uppercase font-mono text-zinc-500">Recall</div>
                  <div className="text-base font-bold font-mono text-indigo-400">
                    {metrics.recall.toFixed(1)}%
                  </div>
                </div>
                <div className="p-3 bg-surface-base border border-surface-border rounded-xl text-center space-y-1">
                  <div className="text-[10px] uppercase font-mono text-zinc-500">F1-Score</div>
                  <div className="text-base font-bold font-mono text-amber-400">
                    {metrics.f1.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Hyperparameter & Algorithm Controls */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-4 bg-surface-base border border-surface-border rounded-xl space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-surface-border">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-200">
                    <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Classifier & Data Settings</span>
                  </div>
                  <button
                    onClick={() => {
                      setDatasetType('moons');
                      setModelType('knn');
                      setCParam(1.0);
                      setMaxDepth(3);
                      setKNeighbors(5);
                    }}
                    className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 transition"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>

                {/* Dataset Preset */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Synthetic Distribution
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'moons', label: 'Moons' },
                      { id: 'circles', label: 'Concentric' },
                      { id: 'blobs', label: 'Blobs' },
                    ].map((d) => (
                      <button
                        key={d.id}
                        onClick={() => setDatasetType(d.id as DatasetType)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition ${
                          datasetType === d.id
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                            : 'bg-surface-elevated border-surface-border text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Model Selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Estimator Algorithm
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'logistic', label: 'Logistic' },
                      { id: 'tree', label: 'Tree' },
                      { id: 'knn', label: 'k-NN' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setModelType(m.id as ModelType)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition ${
                          modelType === m.id
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                            : 'bg-surface-elevated border-surface-border text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hyperparameter Sliders */}
                <div className="space-y-3 pt-2 border-t border-surface-border">
                  {modelType === 'logistic' && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-400">Regularization Inverse (C)</span>
                        <span className="font-mono text-zinc-300">{cParam.toFixed(1)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="3.0"
                        step="0.1"
                        value={cParam}
                        onChange={(e) => setCParam(Number(e.target.value))}
                        className="w-full accent-emerald-500"
                      />
                      <p className="text-[10px] text-zinc-500">
                        Higher C = weaker regularization (tighter fit to points).
                      </p>
                    </div>
                  )}

                  {modelType === 'tree' && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-400">Maximum Tree Depth (max_depth)</span>
                        <span className="font-mono text-zinc-300">{maxDepth}</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={maxDepth}
                        onChange={(e) => setMaxDepth(Number(e.target.value))}
                        className="w-full accent-emerald-500"
                      />
                      <p className="text-[10px] text-zinc-500">
                        Depth 1 = Decision Stump. High depth = risk of overfitting.
                      </p>
                    </div>
                  )}

                  {modelType === 'knn' && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-400">Neighbors Count (n_neighbors)</span>
                        <span className="font-mono text-zinc-300">{kNeighbors}</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="15"
                        step="2"
                        value={kNeighbors}
                        onChange={(e) => setKNeighbors(Number(e.target.value))}
                        className="w-full accent-emerald-500"
                      />
                      <p className="text-[10px] text-zinc-500">
                        Odd numbers avoid voting ties. k=1 creates sharp Voronoi boundaries.
                      </p>
                    </div>
                  )}
                </div>

                {/* Live Confusion Matrix Mini-table */}
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
                  <span className="text-[11px] font-mono font-semibold text-zinc-300 uppercase">
                    Confusion Matrix
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
                    <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg">
                      <div className="text-[10px] text-zinc-500">True Neg (TN)</div>
                      <div className="text-indigo-400 font-bold text-sm">{metrics.tn}</div>
                    </div>
                    <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg">
                      <div className="text-[10px] text-rose-400">False Pos (FP)</div>
                      <div className="text-rose-400 font-bold text-sm">{metrics.fp}</div>
                    </div>
                    <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg">
                      <div className="text-[10px] text-rose-400">False Neg (FN)</div>
                      <div className="text-rose-400 font-bold text-sm">{metrics.fn}</div>
                    </div>
                    <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg">
                      <div className="text-[10px] text-zinc-500">True Pos (TP)</div>
                      <div className="text-amber-400 font-bold text-sm">{metrics.tp}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: PIPELINE BUILDER                                       */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'pipeline' && (
        <div className="p-5 space-y-6">
          {/* Pipeline Stage Architecture Flow */}
          <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-4 shadow-inner">
            <div className="text-xs font-mono font-semibold text-zinc-300 uppercase">
              Live Scikit-Learn Sequential Transformer Pipeline
            </div>

            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 overflow-x-auto py-2">
              {/* Step 0: Raw Data */}
              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1 shrink-0 w-44">
                <div className="text-[10px] font-mono text-zinc-500 uppercase">Input Matrix</div>
                <div className="text-xs font-bold text-zinc-200">Raw Data X</div>
                <div className="text-[11px] font-mono text-zinc-400">Shape: (N, 4)</div>
                <div className="text-[10px] text-rose-400 font-mono">Contains NaNs & Skew</div>
              </div>

              <div className="hidden md:block text-zinc-600 font-bold">→</div>

              {/* Step 1: Imputer */}
              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2 shrink-0 w-48">
                <div className="text-[10px] font-mono text-emerald-400 uppercase">1. Imputation</div>
                <select
                  value={imputer}
                  onChange={(e) => setImputer(e.target.value as any)}
                  className="w-full p-1 bg-zinc-950 border border-zinc-700 rounded text-xs text-zinc-200 font-mono"
                >
                  <option value="none">None (Skip)</option>
                  <option value="mean">SimpleImputer('mean')</option>
                  <option value="median">SimpleImputer('median')</option>
                </select>
                <div className="text-[10px] text-zinc-400">
                  {imputer === 'none' ? 'No missing value fill' : 'Fills NaN with col stat'}
                </div>
              </div>

              <div className="hidden md:block text-zinc-600 font-bold">→</div>

              {/* Step 2: Scaler */}
              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2 shrink-0 w-48">
                <div className="text-[10px] font-mono text-sky-400 uppercase">2. Scaling</div>
                <select
                  value={scaler}
                  onChange={(e) => setScaler(e.target.value as any)}
                  className="w-full p-1 bg-zinc-950 border border-zinc-700 rounded text-xs text-zinc-200 font-mono"
                >
                  <option value="none">None (Raw scales)</option>
                  <option value="standard">StandardScaler (μ=0, σ=1)</option>
                  <option value="minmax">MinMaxScaler [0, 1]</option>
                </select>
                <div className="text-[10px] text-zinc-400">
                  Prevents high-magnitude feature dominance
                </div>
              </div>

              <div className="hidden md:block text-zinc-600 font-bold">→</div>

              {/* Step 3: Feature Eng */}
              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2 shrink-0 w-48">
                <div className="text-[10px] font-mono text-purple-400 uppercase">3. Decomposition</div>
                <select
                  value={featureEng}
                  onChange={(e) => setFeatureEng(e.target.value as any)}
                  className="w-full p-1 bg-zinc-950 border border-zinc-700 rounded text-xs text-zinc-200 font-mono"
                >
                  <option value="none">None (Pass through)</option>
                  <option value="pca">PCA(n_components=2)</option>
                  <option value="poly">PolynomialFeatures(d=2)</option>
                </select>
                <div className="text-[10px] text-zinc-400">
                  {featureEng === 'pca' ? 'Orthogonal max-variance projection' : 'Feature interaction expansion'}
                </div>
              </div>

              <div className="hidden md:block text-zinc-600 font-bold">→</div>

              {/* Step 4: Estimator */}
              <div className="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-xl space-y-2 shrink-0 w-48">
                <div className="text-[10px] font-mono text-amber-400 uppercase">4. Estimator Model</div>
                <select
                  value={classifier}
                  onChange={(e) => setClassifier(e.target.value as any)}
                  className="w-full p-1 bg-zinc-950 border border-zinc-700 rounded text-xs text-zinc-200 font-mono"
                >
                  <option value="logistic">LogisticRegression()</option>
                  <option value="tree">DecisionTreeClassifier()</option>
                  <option value="knn">KNeighborsClassifier()</option>
                </select>
                <div className="text-[10px] text-emerald-300 font-mono">Calls: .fit() / .predict()</div>
              </div>
            </div>
          </div>

          {/* Generated Python Pipeline Code */}
          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-emerald-400">
                Executable Scikit-Learn Pipeline Script
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedPipelineCode);
                  setCopiedPipeCode(true);
                  setTimeout(() => setCopiedPipeCode(false), 2000);
                }}
                className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 transition"
              >
                {copiedPipeCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPipeCode ? 'Copied' : 'Copy Snippet'}</span>
              </button>
            </div>
            <pre className="text-xs font-mono text-zinc-300 overflow-x-auto whitespace-pre leading-relaxed">
              {generatedPipelineCode}
            </pre>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: K-FOLD CROSS-VALIDATION                                */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'crossval' && (
        <div className="p-5 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-4">
              <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-4 shadow-inner">
                <div className="flex items-center justify-between text-xs font-mono text-zinc-400 pb-2 border-b border-zinc-800">
                  <span>{kFolds}-Fold Cross Validation Matrix</span>
                  <span className="text-emerald-400">Train size: {(((kFolds - 1) / kFolds) * 100).toFixed(0)}% | Test size: {((1 / kFolds) * 100).toFixed(0)}%</span>
                </div>

                {/* Folds Diagram */}
                <div className="space-y-2.5">
                  {Array.from({ length: kFolds }).map((_, foldIdx) => (
                    <div key={foldIdx} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                        <span>Iteration #{foldIdx + 1}</span>
                        <span className="text-emerald-400 font-semibold">
                          Val Fold: #{foldIdx + 1}
                        </span>
                      </div>
                      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${kFolds}, 1fr)` }}>
                        {Array.from({ length: kFolds }).map((_, colIdx) => {
                          const isValidation = foldIdx === colIdx;
                          return (
                            <div
                              key={colIdx}
                              className={`h-8 rounded-lg flex items-center justify-center font-mono text-[10px] font-bold border transition ${
                                isValidation
                                  ? 'bg-amber-500/20 border-amber-500/80 text-amber-300 shadow-md ring-1 ring-amber-500/30'
                                  : 'bg-indigo-950/40 border-indigo-900/60 text-indigo-300'
                              }`}
                            >
                              {isValidation ? 'VAL' : 'TRAIN'}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-4">
              <div className="p-4 bg-surface-base border border-surface-border rounded-xl space-y-4">
                <div className="text-xs font-bold text-zinc-200 pb-2 border-b border-surface-border">
                  Cross-Validation Controls
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Number of Folds (K)</span>
                    <span className="font-mono text-zinc-200 font-bold">{kFolds} Folds</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[3, 5, 8, 10].map((k) => (
                      <button
                        key={k}
                        onClick={() => setKFolds(k)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${
                          kFolds === k
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                            : 'bg-surface-elevated border-surface-border text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-surface-border space-y-2">
                  <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shuffleFolds}
                      onChange={(e) => setShuffleFolds(e.target.checked)}
                      className="rounded accent-emerald-500"
                    />
                    <span>shuffle=True (random_state=42)</span>
                  </label>
                </div>

                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1.5 text-xs text-zinc-400 leading-relaxed">
                  <div className="font-semibold text-emerald-400 text-[11px] font-mono">
                    Why K-Fold Matters:
                  </div>
                  <div>
                    A single train/test split can suffer from sampling luck. K-Fold cross-validation runs{' '}
                    <strong className="text-zinc-200">{kFolds} fits</strong>, using each slice as validation exactly once, giving a robust mean and standard deviation.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveSklearnVisualizer;
