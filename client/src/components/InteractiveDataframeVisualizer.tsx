import React, { useState } from 'react';
import {
  Database,
  Layers,
  Split,
  Zap,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Flame,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface ColumnMeta {
  id: string;
  name: string;
  cardinality: number; // unique values
  isCategory: boolean;
  baseDtype: 'object' | 'int64' | 'float64' | 'bool';
  uniqueValues: string[];
}

export const InteractiveDataframeVisualizer: React.FC = () => {
  // Active primary tab
  const [activeTab, setActiveTab] = useState<'categorical' | 'blockmanager' | 'groupby' | 'arrow'>('categorical');

  // Categorical RAM Saver State
  const [numRows, setNumRows] = useState<number>(1_000_000);
  const [columns, setColumns] = useState<ColumnMeta[]>([
    {
      id: 'country',
      name: 'country',
      cardinality: 8,
      isCategory: false,
      baseDtype: 'object',
      uniqueValues: ['US', 'UK', 'DE', 'FR', 'JP', 'CA', 'AU', 'IN'],
    },
    {
      id: 'subscription_tier',
      name: 'tier',
      cardinality: 4,
      isCategory: false,
      baseDtype: 'object',
      uniqueValues: ['Free', 'Pro', 'Enterprise', 'VIP'],
    },
    {
      id: 'device_type',
      name: 'device',
      cardinality: 3,
      isCategory: false,
      baseDtype: 'object',
      uniqueValues: ['Mobile', 'Desktop', 'Tablet'],
    },
    {
      id: 'user_id',
      name: 'user_id',
      cardinality: 1_000_000,
      isCategory: false,
      baseDtype: 'int64',
      uniqueValues: [],
    },
    {
      id: 'monthly_spend',
      name: 'monthly_spend',
      cardinality: 50_000,
      isCategory: false,
      baseDtype: 'float64',
      uniqueValues: [],
    },
    {
      id: 'is_active',
      name: 'is_active',
      cardinality: 2,
      isCategory: false,
      baseDtype: 'bool',
      uniqueValues: ['True', 'False'],
    },
  ]);

  // BlockManager Consolidation State
  const [isConsolidated, setIsConsolidated] = useState<boolean>(true);
  const [hasMutatedColumn, setHasMutatedColumn] = useState<boolean>(false);

  // GroupBy State
  const [groupbyStep, setGroupbyStep] = useState<'raw' | 'split' | 'apply' | 'combine'>('raw');

  // Helper functions for memory calculation
  const toggleColumnCategory = (id: string) => {
    setColumns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isCategory: !c.isCategory } : c))
    );
  };

  const convertAllCategoricals = (enable: boolean) => {
    setColumns((prev) =>
      prev.map((c) => (c.baseDtype === 'object' ? { ...c, isCategory: enable } : c))
    );
  };

  // Memory calculation formula:
  // object dtype: 8 bytes (pointer in 1D array) + ~54 bytes (PyASCIIObject heap overhead) = 62 bytes/row
  // category dtype: 1 byte (int8 codes array) + (cardinality * 60 bytes / numRows) ≈ 1.0001 byte/row
  // int64: 8 bytes/row
  // float64: 8 bytes/row
  // bool: 1 byte/row
  const calculateColumnBytes = (col: ColumnMeta, rows: number): { bytes: number; baselineBytes: number } => {
    if (col.baseDtype === 'object') {
      const baseline = rows * 62;
      const actual = col.isCategory ? rows * 1 + col.cardinality * 60 : baseline;
      return { bytes: actual, baselineBytes: baseline };
    }
    if (col.baseDtype === 'int64' || col.baseDtype === 'float64') {
      const bytes = rows * 8;
      return { bytes, baselineBytes: bytes };
    }
    const bytes = rows * 1;
    return { bytes, baselineBytes: bytes };
  };

  let totalBaselineBytes = 0;
  let totalCurrentBytes = 0;

  columns.forEach((c) => {
    const { bytes, baselineBytes } = calculateColumnBytes(c, numRows);
    totalCurrentBytes += bytes;
    totalBaselineBytes += baselineBytes;
  });

  const totalBaselineMB = totalBaselineBytes / (1024 * 1024);
  const totalCurrentMB = totalCurrentBytes / (1024 * 1024);
  const totalSavedMB = Math.max(0, totalBaselineMB - totalCurrentMB);
  const percentageSaved = totalBaselineMB > 0 ? (totalSavedMB / totalBaselineMB) * 100 : 0;

  // Sample data for preview
  const sampleRows = [
    { id: 101, country: 'US', tier: 'Pro', device: 'Desktop', user_id: 88401, monthly_spend: 149.5, is_active: 'True' },
    { id: 102, country: 'UK', tier: 'Free', device: 'Mobile', user_id: 88402, monthly_spend: 0.0, is_active: 'False' },
    { id: 103, country: 'DE', tier: 'Enterprise', device: 'Desktop', user_id: 88403, monthly_spend: 899.0, is_active: 'True' },
    { id: 104, country: 'US', tier: 'Pro', device: 'Tablet', user_id: 88404, monthly_spend: 149.5, is_active: 'True' },
    { id: 105, country: 'JP', tier: 'VIP', device: 'Mobile', user_id: 88405, monthly_spend: 420.0, is_active: 'True' },
  ];

  return (
    <div className="space-y-6 text-zinc-100">
      {/* Top Main Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.07] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('categorical')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
            activeTab === 'categorical'
              ? 'bg-brand-matrix text-surface-base shadow-lg shadow-brand-matrix/20 font-bold'
              : 'bg-surface-panel text-zinc-400 hover:text-zinc-200 border border-white/[0.05]'
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          <span>1. Categorical RAM Saver (94% Reduction)</span>
        </button>

        <button
          onClick={() => setActiveTab('blockmanager')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
            activeTab === 'blockmanager'
              ? 'bg-brand-torch text-white shadow-lg shadow-brand-torch/20 font-bold'
              : 'bg-surface-panel text-zinc-400 hover:text-zinc-200 border border-white/[0.05]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>2. BlockManager 2D Array Layout</span>
        </button>

        <button
          onClick={() => setActiveTab('arrow')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
            activeTab === 'arrow'
              ? 'bg-brand-data text-surface-base shadow-lg shadow-brand-data/20 font-bold'
              : 'bg-surface-panel text-zinc-400 hover:text-zinc-200 border border-white/[0.05]'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>3. Apache Arrow (Zero-Copy Columnar)</span>
        </button>

        <button
          onClick={() => setActiveTab('groupby')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
            activeTab === 'groupby'
              ? 'bg-brand-viz text-surface-base shadow-lg shadow-brand-viz/20 font-bold'
              : 'bg-surface-panel text-zinc-400 hover:text-zinc-200 border border-white/[0.05]'
          }`}
        >
          <Split className="w-4 h-4" />
          <span>4. Split-Apply-Combine Engine</span>
        </button>
      </div>

      {/* TAB 1: Categorical RAM Saver Lab */}
      {activeTab === 'categorical' && (
        <div className="space-y-5 animate-fade-in">
          {/* Header Card */}
          <div className="rounded-2xl border border-white/[0.07] bg-surface-panel/90 p-5 space-y-5 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/[0.07] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-matrix/10 border border-brand-matrix/30 flex items-center justify-center text-brand-matrix shadow-lg shadow-brand-matrix/10">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white tracking-tight">
                      Pandas Categorical RAM Optimizer Simulator
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-matrix/10 text-brand-matrix border border-brand-matrix/20 font-semibold">
                      Live Heap Profiler
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Compare Python <code className="text-brand-error font-mono">object</code> string pointers vs <code className="text-brand-matrix font-mono">category</code> 8-bit integer codes with instant RAM saving benchmarks.
                  </p>
                </div>
              </div>

              {/* Row Count Slider / Presets */}
              <div className="flex items-center gap-2 bg-surface-base border border-white/[0.07] rounded-xl p-1 text-xs">
                <span className="text-[10px] text-zinc-500 font-mono px-2 uppercase font-semibold">Rows:</span>
                {[250_000, 500_000, 1_000_000, 2_000_000].map((count) => (
                  <button
                    key={count}
                    onClick={() => setNumRows(count)}
                    className={`px-2.5 py-1 rounded-lg font-mono transition ${
                      numRows === count
                        ? 'bg-brand-matrix text-surface-base font-bold shadow'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {(count / 1_000_000).toFixed(count >= 1_000_000 ? 1 : 2)}M
                  </button>
                ))}
              </div>
            </div>

            {/* Live RAM Summary Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3.5 bg-surface-base border border-white/[0.07] rounded-xl space-y-1">
                <span className="text-[10px] text-zinc-500 font-mono uppercase font-semibold">Unoptimized Baseline</span>
                <div className="text-lg font-bold font-mono text-brand-error">
                  {totalBaselineMB.toFixed(1)} MB
                </div>
                <span className="text-[10px] text-zinc-400">All string columns as object</span>
              </div>

              <div className="p-3.5 bg-surface-base border border-white/[0.07] rounded-xl space-y-1">
                <span className="text-[10px] text-zinc-500 font-mono uppercase font-semibold">Current RAM Footprint</span>
                <div className="text-lg font-bold font-mono text-brand-matrix">
                  {totalCurrentMB.toFixed(1)} MB
                </div>
                <span className="text-[10px] text-zinc-400">Active DataFrame in RAM</span>
              </div>

              <div className="p-3.5 bg-surface-base border border-white/[0.07] rounded-xl space-y-1">
                <span className="text-[10px] text-zinc-500 font-mono uppercase font-semibold">Instant RAM Saved</span>
                <div className="text-lg font-bold font-mono text-brand-data">
                  -{totalSavedMB.toFixed(1)} MB
                </div>
                <span className="text-[10px] text-zinc-400">Freed from Heap allocator</span>
              </div>

              <div className="p-3.5 bg-surface-base border border-brand-matrix/30 rounded-xl space-y-1 bg-brand-matrix/5">
                <span className="text-[10px] text-brand-matrix font-mono uppercase font-bold">Reduction Ratio</span>
                <div className="text-lg font-bold font-mono text-brand-matrix">
                  {percentageSaved.toFixed(1)}% SAVED
                </div>
                <span className="text-[10px] text-brand-matrix font-mono">
                  {percentageSaved > 50 ? '🟢 MASSIVE MEMORY SAVINGS' : '🟡 PARTIALLY OPTIMIZED'}
                </span>
              </div>
            </div>

            {/* Quick Action Toggles */}
            <div className="flex items-center justify-between flex-wrap gap-3 p-3 bg-surface-canvas rounded-xl border border-white/[0.05]">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-zinc-400">Interactive Columns:</span>
                <button
                  onClick={() => convertAllCategoricals(true)}
                  className="px-3 py-1 bg-brand-matrix/15 hover:bg-brand-matrix/25 text-brand-matrix border border-brand-matrix/30 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>⚡ Convert All to Category</span>
                </button>
                <button
                  onClick={() => convertAllCategoricals(false)}
                  className="px-3 py-1 bg-surface-panel hover:bg-surface-card text-zinc-400 hover:text-zinc-200 border border-white/[0.07] rounded-lg text-xs font-mono transition"
                >
                  Reset to Object
                </button>
              </div>

              <div className="text-[11px] font-mono text-zinc-400">
                Dataset: <strong>{numRows.toLocaleString()} rows × {columns.length} columns</strong>
              </div>
            </div>

            {/* Interactive Columns Table & Individual Toggles */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                Column Memory Inspector & Category Converter
              </span>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {columns.map((col) => {
                  const { bytes, baselineBytes } = calculateColumnBytes(col, numRows);
                  const colMB = bytes / (1024 * 1024);
                  const baseMB = baselineBytes / (1024 * 1024);
                  const colSavedPct = baseMB > 0 ? ((baseMB - colMB) / baseMB) * 100 : 0;
                  const isConvertible = col.baseDtype === 'object';

                  return (
                    <div
                      key={col.id}
                      className={`p-4 rounded-xl border transition-all duration-200 space-y-3 ${
                        col.isCategory
                          ? 'bg-brand-matrix/5 border-brand-matrix/40 shadow-lg shadow-brand-matrix/5 ring-1 ring-brand-matrix/20'
                          : 'bg-surface-base border-white/[0.07] hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono font-bold text-white">.{col.name}</code>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                              col.isCategory
                                ? 'bg-brand-matrix text-surface-base'
                                : col.baseDtype === 'object'
                                ? 'bg-brand-error/20 text-brand-error border border-brand-error/30'
                                : 'bg-brand-data/20 text-brand-data border border-brand-data/30'
                            }`}
                          >
                            {col.isCategory ? 'category (int8)' : col.baseDtype}
                          </span>
                        </div>

                        {isConvertible && (
                          <button
                            onClick={() => toggleColumnCategory(col.id)}
                            className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg transition border ${
                              col.isCategory
                                ? 'bg-brand-matrix text-surface-base border-brand-matrix'
                                : 'bg-surface-panel text-zinc-300 border-white/[0.1] hover:bg-surface-card'
                            }`}
                          >
                            {col.isCategory ? 'Categorical ✓' : 'Convert ⚡'}
                          </button>
                        )}
                      </div>

                      {/* Memory Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-zinc-500">RAM Usage:</span>
                          <span className={col.isCategory ? 'text-brand-matrix font-bold' : 'text-zinc-300'}>
                            {colMB.toFixed(1)} MB {colSavedPct > 0 && `(-${colSavedPct.toFixed(0)}%)`}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-surface-canvas rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              col.isCategory
                                ? 'bg-brand-matrix'
                                : col.baseDtype === 'object'
                                ? 'bg-brand-error'
                                : 'bg-brand-data'
                            }`}
                            style={{
                              width: `${Math.max(4, (colMB / baseMB) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Details / Under the hood */}
                      <div className="text-[10px] text-zinc-400 font-mono pt-1 border-t border-white/[0.04] space-y-0.5">
                        {isConvertible ? (
                          col.isCategory ? (
                            <div className="text-brand-matrix">
                              ▶ Codes array: 1 Byte/row + {col.cardinality} categories dictionary
                            </div>
                          ) : (
                            <div className="text-brand-error/90">
                              ⚠️ 8B PyObject* pointer + ~54B heap object per row
                            </div>
                          )
                        ) : (
                          <div className="text-zinc-500">
                            Fixed native NumPy dtype ({col.baseDtype === 'bool' ? '1 Byte' : '8 Bytes'}/row)
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Generated Python Idiomatic Code */}
            <div className="p-4 bg-surface-base border border-white/[0.07] rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-zinc-300 font-mono flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-brand-matrix" />
                  <span>Production Idiom for 94% RAM Savings:</span>
                </span>
                <span className="text-[10px] font-mono text-zinc-500">Python 3.11+ / Pandas 2.x</span>
              </div>
              <pre className="p-3 bg-surface-canvas border border-white/[0.05] rounded-lg text-[11px] font-mono text-brand-matrix overflow-x-auto">
{`# Convert low-cardinality string object columns into Category dtype
${columns
  .filter((c) => c.baseDtype === 'object')
  .map((c) => `df['${c.name}'] = df['${c.name}'].astype('category')`)
  .join('\n')}

# Total RAM drops from ${totalBaselineMB.toFixed(1)} MB -> ${totalCurrentMB.toFixed(1)} MB (${percentageSaved.toFixed(1)}% memory reduction!)`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BlockManager Internal 2D Ndarray Architecture */}
      {activeTab === 'blockmanager' && (
        <div className="rounded-2xl border border-white/[0.07] bg-surface-panel/90 p-5 space-y-5 shadow-2xl backdrop-blur-xl animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.07] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-torch/10 border border-brand-torch/30 flex items-center justify-center text-brand-torch">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Pandas BlockManager 2D Heterogeneous Ndarray Architecture
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Understand how pandas consolidates columns of identical dtypes into 2D NumPy arrays under the hood.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsConsolidated(true);
                  setHasMutatedColumn(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono transition border ${
                  isConsolidated && !hasMutatedColumn
                    ? 'bg-brand-matrix/20 text-brand-matrix border-brand-matrix/40 font-bold'
                    : 'bg-surface-base text-zinc-400 border-white/[0.07]'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
                <span>Consolidated State</span>
              </button>

              <button
                onClick={() => {
                  setIsConsolidated(false);
                  setHasMutatedColumn(true);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono transition border ${
                  hasMutatedColumn
                    ? 'bg-brand-error/20 text-brand-error border-brand-error/40 font-bold'
                    : 'bg-surface-base text-zinc-400 border-white/[0.07] hover:text-rose-300'
                }`}
              >
                <Flame className="w-3.5 h-3.5 inline mr-1" />
                <span>Mutate Column In-Place (Unconsolidate)</span>
              </button>
            </div>
          </div>

          {/* Block Diagram */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Block 1: IntBlock */}
            <div className="p-4 bg-surface-base border border-brand-data/30 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-brand-data uppercase">
                  Int64Block (2D NumPy ndarray)
                </span>
                <span className="text-[10px] font-mono text-zinc-500">shape: (1, {numRows.toLocaleString()})</span>
              </div>
              <div className="p-2.5 bg-surface-canvas rounded-lg font-mono text-xs text-zinc-300 space-y-1">
                <div>• Column: <strong className="text-white">['user_id']</strong></div>
                <div>• mgr_locs: <code className="text-brand-data">[3]</code></div>
                <div>• Layout: Contiguous C-Order in RAM</div>
              </div>
              <span className="text-[10px] text-zinc-400 block">
                Zero overhead native C integer arithmetic.
              </span>
            </div>

            {/* Block 2: FloatBlock */}
            <div className="p-4 bg-surface-base border border-brand-viz/30 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-brand-viz uppercase">
                  Float64Block (2D NumPy ndarray)
                </span>
                <span className="text-[10px] font-mono text-zinc-500">shape: (1, {numRows.toLocaleString()})</span>
              </div>
              <div className="p-2.5 bg-surface-canvas rounded-lg font-mono text-xs text-zinc-300 space-y-1">
                <div>• Column: <strong className="text-white">['monthly_spend']</strong></div>
                <div>• mgr_locs: <code className="text-brand-viz">[4]</code></div>
                <div>• Layout: Contiguous C-Order in RAM</div>
              </div>
              <span className="text-[10px] text-zinc-400 block">
                SIMD AVX-512 vectorized vector floating-point computations.
              </span>
            </div>

            {/* Block 3: ObjectBlock / CategoricalBlock */}
            <div className={`p-4 bg-surface-base rounded-xl space-y-3 border ${
              isConsolidated
                ? 'border-brand-torch/30'
                : 'border-brand-error/50 bg-brand-error/5'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-mono font-bold uppercase ${
                  isConsolidated ? 'text-brand-torch' : 'text-brand-error'
                }`}>
                  {isConsolidated ? 'ObjectBlock (Consolidated 2D)' : '⚠️ Fragmented 1D Blocks'}
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                  {isConsolidated ? `shape: (3, ${numRows.toLocaleString()})` : 'Split into 3 separate 1D blocks!'}
                </span>
              </div>
              <div className="p-2.5 bg-surface-canvas rounded-lg font-mono text-xs text-zinc-300 space-y-1">
                <div>• Columns: <strong className="text-white">['country', 'tier', 'device']</strong></div>
                <div>• mgr_locs: <code className={isConsolidated ? 'text-brand-torch' : 'text-brand-error'}>[0, 1, 2]</code></div>
                <div>• State: {isConsolidated ? 'Single contiguous pointer block' : '❌ Unconsolidated memory leak'}</div>
              </div>
              <span className="text-[10px] text-zinc-400 block">
                {isConsolidated
                  ? '3 string columns unified into single block.'
                  : '⚠️ Modifying a slice split the block, triggering SettingWithCopyWarning!'}
              </span>
            </div>
          </div>

          {/* Warning Banner */}
          {hasMutatedColumn && (
            <div className="p-4 bg-brand-error/10 border border-brand-error/30 rounded-xl space-y-2 text-xs text-brand-error">
              <div className="flex items-center gap-2 font-bold font-mono">
                <AlertTriangle className="w-4 h-4" />
                <span>SettingWithCopyWarning & Memory Fragmentation Detected:</span>
              </div>
              <p className="text-zinc-300 leading-relaxed">
                When you assign <code className="text-white font-mono">df['tier'][0] = 'VIP'</code> directly to a DataFrame view, Pandas is forced to un-consolidate the shared 2D ObjectBlock, copy memory into a new 1D array, and detach it from the parent BlockManager.
                Always use <code className="text-brand-matrix font-mono">df.loc[row_indexer, 'tier'] = 'VIP'</code> or PyArrow columnar arrays!
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Apache Arrow Columnar Layout */}
      {activeTab === 'arrow' && (
        <div className="rounded-2xl border border-white/[0.07] bg-surface-panel/90 p-5 space-y-5 shadow-2xl backdrop-blur-xl animate-fade-in">
          <div className="flex items-center gap-3 border-b border-white/[0.07] pb-4">
            <div className="w-9 h-9 rounded-xl bg-brand-data/10 border border-brand-data/30 flex items-center justify-center text-brand-data">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Apache Arrow Engine (<code className="text-brand-data font-mono font-normal">dtype_backend="pyarrow"</code>)
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                The modern memory standard replacing BlockManager: zero-copy inter-process communication & contiguous columnar buffers.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-surface-base border border-white/[0.07] rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-brand-error">
                <AlertTriangle className="w-4 h-4" />
                <span>Legacy Pandas BlockManager (NumPy)</span>
              </div>
              <ul className="text-xs text-zinc-300 space-y-2 list-disc list-inside">
                <li>Consolidates heterogeneous columns into complex 2D blocks.</li>
                <li>Strings stored as individual Python heap objects (54 bytes overhead per string).</li>
                <li>Missing values require float NaN casting (cannot represent integer nulls without Float casting).</li>
                <li>Zero-copy sharing with PyTorch, DuckDB, or Polars is impossible without deep serialization copy.</li>
              </ul>
            </div>

            <div className="p-4 bg-surface-base border border-brand-data/30 rounded-xl space-y-3 bg-brand-data/5">
              <div className="flex items-center gap-2 text-xs font-bold text-brand-data">
                <CheckCircle2 className="w-4 h-4" />
                <span>Modern Apache Arrow Columnar Engine</span>
              </div>
              <ul className="text-xs text-zinc-200 space-y-2 list-disc list-inside">
                <li>1D contiguous ChunkedArray per column — eliminating BlockManager fragmentation.</li>
                <li>Strings stored as flat contiguous UTF-8 byte arrays with 32-bit offset arrays (saving 80%+ RAM).</li>
                <li>Native 1-bit boolean validity masks for any dtype (true integer & boolean nulls).</li>
                <li>Instant $O(1)$ zero-copy transfer into PyTorch tensors and GPU CUDA memory buffers!</li>
              </ul>
            </div>
          </div>

          <div className="p-4 bg-surface-base border border-white/[0.07] rounded-xl space-y-2">
            <span className="text-xs font-bold text-zinc-300 font-mono">Enabling PyArrow Backend in Pandas 2.x:</span>
            <pre className="p-3 bg-surface-canvas border border-white/[0.05] rounded-lg text-xs font-mono text-brand-data overflow-x-auto">
{`# 1. Read CSV directly into Apache Arrow memory chunks
df = pd.read_csv("telemetry.csv", engine="pyarrow", dtype_backend="pyarrow")

# 2. Or convert existing DataFrame to PyArrow types with 1-bit null masks
df = df.convert_dtypes(dtype_backend="pyarrow")`}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 4: Split-Apply-Combine GroupBy Pipeline */}
      {activeTab === 'groupby' && (
        <div className="rounded-2xl border border-white/[0.07] bg-surface-panel/90 p-5 space-y-5 shadow-2xl backdrop-blur-xl animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.07] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-viz/10 border border-brand-viz/30 flex items-center justify-center text-brand-viz">
                <Split className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  GroupBy Split-Apply-Combine Engine Step-Through
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Trace hash table partitions, accumulator registers, and reduction combinations.
                </p>
              </div>
            </div>

            <div className="flex items-center bg-surface-base border border-white/[0.07] rounded-xl p-1 text-xs">
              <button
                onClick={() => setGroupbyStep('raw')}
                className={`px-3 py-1 rounded-lg transition ${
                  groupbyStep === 'raw' ? 'bg-surface-card-hover text-white font-bold' : 'text-zinc-400'
                }`}
              >
                1. Raw Table
              </button>
              <button
                onClick={() => setGroupbyStep('split')}
                className={`px-3 py-1 rounded-lg transition ${
                  groupbyStep === 'split' ? 'bg-brand-data text-surface-base font-bold' : 'text-zinc-400'
                }`}
              >
                2. Split (Hash)
              </button>
              <button
                onClick={() => setGroupbyStep('apply')}
                className={`px-3 py-1 rounded-lg transition ${
                  groupbyStep === 'apply' ? 'bg-brand-torch text-white font-bold' : 'text-zinc-400'
                }`}
              >
                3. Apply (Agg)
              </button>
              <button
                onClick={() => setGroupbyStep('combine')}
                className={`px-3 py-1 rounded-lg transition ${
                  groupbyStep === 'combine' ? 'bg-brand-matrix text-surface-base font-bold' : 'text-zinc-400'
                }`}
              >
                4. Combine
              </button>
            </div>
          </div>

          <div className="p-4 bg-surface-base border border-white/[0.07] rounded-xl space-y-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-brand-viz">Operation:</span>
              <code className="font-mono bg-surface-canvas px-2.5 py-1 rounded-lg border border-white/[0.07] text-brand-matrix">
                df.groupby('tier')['monthly_spend'].agg(['mean', 'count', 'sum'])
              </code>
            </div>

            {groupbyStep === 'raw' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-[11px]">
                  <thead className="bg-surface-canvas text-zinc-400 border-b border-white/[0.07]">
                    <tr>
                      <th className="p-2.5">id</th>
                      <th className="p-2.5">country</th>
                      <th className="p-2.5">tier</th>
                      <th className="p-2.5">device</th>
                      <th className="p-2.5">monthly_spend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] text-zinc-300">
                    {sampleRows.map((r) => (
                      <tr key={r.id} className="hover:bg-surface-panel/50">
                        <td className="p-2.5 text-zinc-500">{r.id}</td>
                        <td className="p-2.5 text-brand-data">{r.country}</td>
                        <td className="p-2.5 text-brand-torch font-semibold">{r.tier}</td>
                        <td className="p-2.5 text-zinc-400">{r.device}</td>
                        <td className="p-2.5 text-brand-matrix font-semibold">${r.monthly_spend.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {groupbyStep === 'split' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-surface-panel rounded-xl border border-brand-torch/40 space-y-2">
                  <span className="font-bold text-brand-torch font-mono">Bucket: Pro Tier (Indices [0, 3])</span>
                  <div className="text-[11px] font-mono text-zinc-300 space-y-1">
                    <div>• Row 0: $149.50 (US, Desktop)</div>
                    <div>• Row 3: $149.50 (US, Tablet)</div>
                  </div>
                </div>

                <div className="p-3 bg-surface-panel rounded-xl border border-brand-data/40 space-y-2">
                  <span className="font-bold text-brand-data font-mono">Bucket: Free Tier (Index [1])</span>
                  <div className="text-[11px] font-mono text-zinc-300 space-y-1">
                    <div>• Row 1: $0.00 (UK, Mobile)</div>
                  </div>
                </div>

                <div className="p-3 bg-surface-panel rounded-xl border border-brand-viz/40 space-y-2">
                  <span className="font-bold text-brand-viz font-mono">Bucket: Enterprise (Index [2])</span>
                  <div className="text-[11px] font-mono text-zinc-300 space-y-1">
                    <div>• Row 2: $899.00 (DE, Desktop)</div>
                  </div>
                </div>
              </div>
            )}

            {groupbyStep === 'apply' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] font-mono">
                <div className="p-3 bg-surface-panel rounded-xl border border-brand-matrix/30 space-y-1">
                  <div className="text-brand-matrix font-bold">Pro Reductions:</div>
                  <div>mean = (149.5 + 149.5) / 2 = <strong>$149.50</strong></div>
                  <div>sum = $299.00 | count = 2</div>
                </div>

                <div className="p-3 bg-surface-panel rounded-xl border border-brand-matrix/30 space-y-1">
                  <div className="text-brand-matrix font-bold">Free Reductions:</div>
                  <div>mean = $0.00 | sum = $0.00 | count = 1</div>
                </div>

                <div className="p-3 bg-surface-panel rounded-xl border border-brand-matrix/30 space-y-1">
                  <div className="text-brand-matrix font-bold">Enterprise Reductions:</div>
                  <div>mean = $899.00 | sum = $899.00 | count = 1</div>
                </div>
              </div>
            )}

            {groupbyStep === 'combine' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-[11px]">
                  <thead className="bg-brand-matrix/10 text-brand-matrix border-b border-brand-matrix/20">
                    <tr>
                      <th className="p-2.5">tier (Index)</th>
                      <th className="p-2.5">mean</th>
                      <th className="p-2.5">sum</th>
                      <th className="p-2.5">count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.07] text-zinc-200">
                    <tr>
                      <td className="p-2.5 font-bold text-brand-torch">Pro</td>
                      <td className="p-2.5 text-brand-matrix font-semibold">$149.50</td>
                      <td className="p-2.5">$299.00</td>
                      <td className="p-2.5 text-brand-data">2</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-brand-torch">Enterprise</td>
                      <td className="p-2.5 text-brand-matrix font-semibold">$899.00</td>
                      <td className="p-2.5">$899.00</td>
                      <td className="p-2.5 text-brand-data">1</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-brand-torch">VIP</td>
                      <td className="p-2.5 text-brand-matrix font-semibold">$420.00</td>
                      <td className="p-2.5">$420.00</td>
                      <td className="p-2.5 text-brand-data">1</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-brand-torch">Free</td>
                      <td className="p-2.5 text-brand-matrix font-semibold">$0.00</td>
                      <td className="p-2.5">$0.00</td>
                      <td className="p-2.5 text-brand-data">1</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveDataframeVisualizer;

