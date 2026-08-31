import React, { useState } from 'react';
import {
  Cpu,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  FlipHorizontal,
  Scissors,
  Maximize2,
  ArrowRight,
  RotateCcw,
  Info,
  Sliders,
} from 'lucide-react';

type OperationMode = 'base' | 'transpose' | 'slice' | 'broadcast' | 'reshape' | 'copy';
type DType = 'int32' | 'float64' | 'int8' | 'float32';

interface DTypeConfig {
  name: string;
  itemSize: number; // in bytes
  label: string;
}

const DTYPE_MAP: Record<DType, DTypeConfig> = {
  int32: { name: 'int32', itemSize: 4, label: '32-bit Integer (4 Bytes)' },
  float64: { name: 'float64', itemSize: 8, label: '64-bit Float (8 Bytes)' },
  float32: { name: 'float32', itemSize: 4, label: '32-bit Float (4 Bytes)' },
  int8: { name: 'int8', itemSize: 1, label: '8-bit Integer (1 Byte)' },
};

export const InteractiveArrayVisualizer: React.FC = () => {
  // Base array configuration
  const [baseRows, setBaseRows] = useState<number>(3);
  const [baseCols, setBaseCols] = useState<number>(4);
  const [dtype, setDtype] = useState<DType>('int32');
  const [order, setOrder] = useState<'C' | 'F'>('C');
  const [operation, setOperation] = useState<OperationMode>('base');

  // Slice parameters
  const [sliceStepR, setSliceStepR] = useState<number>(2);
  const [sliceStepC, setSliceStepC] = useState<number>(1);

  // Reshape parameters
  const [reshapeShape, setReshapeShape] = useState<string>('2, 6');

  // Active cell selection / hovering
  const [hoveredLogical, setHoveredLogical] = useState<{ r: number; c: number } | null>({ r: 0, c: 1 });
  const [hoveredPhysicalIndex, setHoveredPhysicalIndex] = useState<number | null>(null);

  // Axis reduction simulator state
  const [selectedAxis, setSelectedAxis] = useState<number | null>(null);
  const [keepDims, setKeepDims] = useState<boolean>(false);

  // Broadcasting simulator state
  const [bShapeA, setBShapeA] = useState<string>('3, 1');
  const [bShapeB, setBShapeB] = useState<string>('1, 4');

  const itemSize = DTYPE_MAP[dtype].itemSize;
  const baseTotalElements = baseRows * baseCols;

  // Base raw buffer values (1-indexed for clarity)
  const baseBuffer = Array.from({ length: baseTotalElements }, (_, i) => {
    let r = 0;
    let c = 0;
    if (order === 'C') {
      r = Math.floor(i / baseCols);
      c = i % baseCols;
    } else {
      c = Math.floor(i / baseRows);
      r = i % baseRows;
    }
    const val = r * baseCols + c + 1;
    return {
      physicalIndex: i,
      baseByteOffset: i * itemSize,
      val,
      r,
      c,
    };
  });

  // Calculate effective shape, strides, memory flags and cell mappings based on operation
  let effShape: number[] = [baseRows, baseCols];
  let effStrides: number[] = [];
  let isZeroCopy = true;
  let copyReason = '';
  let operationCode = 'arr';
  let memoryNotes = '';
  let isCContiguous = true;
  let isFContiguous = false;

  // Base C-order strides
  const baseStride0 = order === 'C' ? baseCols * itemSize : itemSize;
  const baseStride1 = order === 'C' ? itemSize : baseRows * itemSize;

  if (operation === 'base') {
    effShape = [baseRows, baseCols];
    effStrides = [baseStride0, baseStride1];
    isZeroCopy = true;
    operationCode = `arr  # shape (${baseRows}, ${baseCols}), ${dtype}`;
    memoryNotes = 'Points directly to contiguous memory block. Base pointer: 0x7FFF5820.';
    isCContiguous = order === 'C';
    isFContiguous = order === 'F';
  } else if (operation === 'transpose') {
    // .T swaps axes
    effShape = [baseCols, baseRows];
    effStrides = [baseStride1, baseStride0];
    isZeroCopy = true;
    operationCode = 'arr.T  # Transpose';
    memoryNotes =
      'Zero-copy view! Swapped strides without touching physical RAM. base is original array.';
    isCContiguous = false;
    isFContiguous = order === 'C';
  } else if (operation === 'slice') {
    // Strides are multiplied by step sizes
    const numRows = Math.ceil(baseRows / sliceStepR);
    const numCols = Math.ceil(baseCols / sliceStepC);
    effShape = [numRows, numCols];
    effStrides = [baseStride0 * sliceStepR, baseStride1 * sliceStepC];
    isZeroCopy = true;
    operationCode = `arr[::${sliceStepR}, ::${sliceStepC}]  # Strided Slice`;
    memoryNotes = `Strides scaled to (${effStrides[0]}, ${effStrides[1]})B. Unindexed bytes remain skipped in cache line.`;
    isCContiguous = sliceStepR === 1 && sliceStepC === 1;
    isFContiguous = false;
  } else if (operation === 'broadcast') {
    // Broadcast: insert 1-dim or expansion (stride 0)
    effShape = [baseRows, 4, baseCols];
    effStrides = [baseStride0, 0, baseStride1];
    isZeroCopy = true;
    operationCode = 'arr[:, np.newaxis, :]  # Stride-0 Broadcast';
    memoryNotes =
      'Dimension 1 has Stride = 0 Bytes! All 4 elements in dimension 1 reference the EXACT same byte in physical RAM with zero memory overhead.';
    isCContiguous = false;
    isFContiguous = false;
  } else if (operation === 'reshape') {
    // Check if reshape matches total elements
    const parts = reshapeShape.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));
    const prod = parts.reduce((acc, v) => acc * v, 1);
    if (parts.length > 0 && prod === baseTotalElements) {
      effShape = parts;
      if (parts.length === 2) {
        effStrides = [parts[1] * itemSize, itemSize];
      } else if (parts.length === 1) {
        effStrides = [itemSize];
      } else {
        effStrides = [parts[1] * parts[2] * itemSize, parts[2] * itemSize, itemSize];
      }
      isZeroCopy = true;
      operationCode = `arr.reshape(${parts.join(', ')})  # Contiguous Reshape`;
      memoryNotes = 'Array is contiguous in memory, so reshape produces a Zero-Copy View with updated shape metadata.';
      isCContiguous = true;
      isFContiguous = false;
    } else {
      effShape = [2, Math.floor(baseTotalElements / 2)];
      effStrides = [effShape[1] * itemSize, itemSize];
      isZeroCopy = true;
      operationCode = `arr.reshape(2, ${effShape[1]})`;
      memoryNotes = 'Reshaped view generated.';
    }
  } else if (operation === 'copy') {
    // Explicit deep copy
    effShape = [baseRows, baseCols];
    effStrides = [baseStride0, baseStride1];
    isZeroCopy = false;
    copyReason = 'Explicit .copy() allocates a brand-new contiguous memory block on the heap.';
    operationCode = 'arr.copy()  # Deep Memory Allocation';
    memoryNotes = `Allocated ${baseTotalElements * itemSize} bytes in a new buffer at 0x7FFF99A0. Modifying this array will NOT mutate original.`;
    isCContiguous = true;
    isFContiguous = false;
  }

  // Construct 2D logical grid data for visual rendering
  const renderRows = effShape.length >= 2 ? effShape[0] : 1;
  const renderCols = effShape.length >= 2 ? effShape[1] : effShape[0];

  interface LogicalCell {
    r: number;
    c: number;
    val: number;
    physicalOffset: number;
    physicalIndex: number;
    formula: string;
  }

  const logicalGrid: LogicalCell[][] = [];

  for (let r = 0; r < renderRows; r++) {
    const rowList: LogicalCell[] = [];
    for (let c = 0; c < renderCols; c++) {
      let byteOffset = 0;
      let val = 0;

      if (operation === 'base') {
        byteOffset = r * effStrides[0] + c * effStrides[1];
        const origR = order === 'C' ? r : c;
        const origC = order === 'C' ? c : r;
        val = origR * baseCols + origC + 1;
      } else if (operation === 'transpose') {
        byteOffset = r * effStrides[0] + c * effStrides[1];
        // Swapped coordinates
        val = c * baseCols + r + 1;
      } else if (operation === 'slice') {
        const actualR = r * sliceStepR;
        const actualC = c * sliceStepC;
        byteOffset = actualR * baseStride0 + actualC * baseStride1;
        val = actualR * baseCols + actualC + 1;
      } else if (operation === 'broadcast') {
        // Dimension 1 has stride 0
        byteOffset = r * baseStride0 + 0 + c * baseStride1;
        val = r * baseCols + c + 1;
      } else if (operation === 'reshape') {
        const flatIdx = r * renderCols + c;
        byteOffset = flatIdx * itemSize;
        val = flatIdx + 1;
      } else if (operation === 'copy') {
        byteOffset = r * effStrides[0] + c * effStrides[1];
        val = r * baseCols + c + 1;
      }

      const physicalIndex = Math.floor(byteOffset / itemSize);
      const formula = `${r} × ${effStrides[0]}B + ${c} × ${effStrides[1]}B = ${byteOffset}B`;

      rowList.push({
        r,
        c,
        val,
        physicalOffset: byteOffset,
        physicalIndex,
        formula,
      });
    }
    logicalGrid.push(rowList);
  }

  // Active highlighted byte offset
  let activeByteOffset: number | null = null;
  if (hoveredLogical) {
    const r = Math.min(hoveredLogical.r, renderRows - 1);
    const c = Math.min(hoveredLogical.c, renderCols - 1);
    if (logicalGrid[r] && logicalGrid[r][c]) {
      activeByteOffset = logicalGrid[r][c].physicalOffset;
    }
  } else if (hoveredPhysicalIndex !== null) {
    activeByteOffset = hoveredPhysicalIndex * itemSize;
  }

  // Broadcasting Tester calculation
  const parseShape = (str: string) =>
    str
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n > 0);

  const shapeA = parseShape(bShapeA);
  const shapeB = parseShape(bShapeB);

  const computeBroadcasting = () => {
    if (shapeA.length === 0 || shapeB.length === 0) {
      return { compatible: false, result: 'Invalid shapes', steps: [] };
    }
    const maxLen = Math.max(shapeA.length, shapeB.length);
    const padA = Array(maxLen - shapeA.length)
      .fill(1)
      .concat(shapeA);
    const padB = Array(maxLen - shapeB.length)
      .fill(1)
      .concat(shapeB);
    const resultShape: number[] = [];
    const steps: { dim: number; desc: string; ok: boolean }[] = [];

    for (let i = maxLen - 1; i >= 0; i--) {
      const dimA = padA[i];
      const dimB = padB[i];
      const alignIdx = maxLen - 1 - i;

      if (dimA === dimB) {
        resultShape.unshift(dimA);
        steps.unshift({
          dim: alignIdx,
          desc: `Dim -${alignIdx + 1}: ${dimA} == ${dimB} (Equal dimension, compatible)`,
          ok: true,
        });
      } else if (dimA === 1) {
        resultShape.unshift(dimB);
        steps.unshift({
          dim: alignIdx,
          desc: `Dim -${alignIdx + 1}: ${dimA} vs ${dimB} (Array A broadcasts via 0-stride to ${dimB})`,
          ok: true,
        });
      } else if (dimB === 1) {
        resultShape.unshift(dimA);
        steps.unshift({
          dim: alignIdx,
          desc: `Dim -${alignIdx + 1}: ${dimA} vs ${dimB} (Array B broadcasts via 0-stride to ${dimA})`,
          ok: true,
        });
      } else {
        return {
          compatible: false,
          result: `Shape Mismatch at Dim -${alignIdx + 1} (${dimA} ≠ ${dimB})`,
          steps: steps.concat([
            {
              dim: alignIdx,
              desc: `Dim -${alignIdx + 1}: Incompatible! ${dimA} ≠ ${dimB} and neither is 1`,
              ok: false,
            },
          ]),
        };
      }
    }
    return {
      compatible: true,
      result: `(${resultShape.join(', ')})`,
      steps,
    };
  };

  const broadcastResult = computeBroadcasting();

  return (
    <div className="space-y-6 text-zinc-100">
      {/* Top Banner & Control Deck */}
      <div className="rounded-2xl border border-white/[0.07] bg-surface-panel/90 p-5 space-y-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/[0.07] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-matrix/10 border border-brand-matrix/30 flex items-center justify-center text-brand-matrix shadow-lg shadow-brand-matrix/10">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  NumPy Memory Strides & ndarray Buffer Simulator
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-matrix/10 text-brand-matrix border border-brand-matrix/20 font-semibold">
                  NumPy 2.x Architecture
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Inspect physical RAM byte addresses, memory strides, $O(1)$ zero-copy views, and hardware cache lines.
              </p>
            </div>
          </div>

          {/* Dtype & Base Shape Selectors */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-surface-base border border-white/[0.07] rounded-xl p-1 text-xs">
              <span className="text-[10px] text-zinc-500 font-mono px-2 uppercase font-semibold">Shape:</span>
              <button
                onClick={() => {
                  setBaseRows(3);
                  setBaseCols(4);
                }}
                className={`px-2.5 py-1 rounded-lg font-mono transition ${
                  baseRows === 3 && baseCols === 4
                    ? 'bg-indigo-600 text-white font-bold shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                3×4
              </button>
              <button
                onClick={() => {
                  setBaseRows(2);
                  setBaseCols(3);
                }}
                className={`px-2.5 py-1 rounded-lg font-mono transition ${
                  baseRows === 2 && baseCols === 3
                    ? 'bg-indigo-600 text-white font-bold shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                2×3
              </button>
              <button
                onClick={() => {
                  setBaseRows(4);
                  setBaseCols(3);
                }}
                className={`px-2.5 py-1 rounded-lg font-mono transition ${
                  baseRows === 4 && baseCols === 3
                    ? 'bg-indigo-600 text-white font-bold shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                4×3
              </button>
            </div>

            <div className="flex items-center bg-surface-base border border-white/[0.07] rounded-xl p-1 text-xs">
              <span className="text-[10px] text-zinc-500 font-mono px-2 uppercase font-semibold">Dtype:</span>
              <button
                onClick={() => setDtype('int32')}
                className={`px-2 py-1 rounded-lg font-mono transition ${
                  dtype === 'int32' ? 'bg-cyan-600 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="int32 = 4 bytes"
              >
                int32 (4B)
              </button>
              <button
                onClick={() => setDtype('float64')}
                className={`px-2 py-1 rounded-lg font-mono transition ${
                  dtype === 'float64' ? 'bg-cyan-600 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="float64 = 8 bytes"
              >
                float64 (8B)
              </button>
            </div>

            <div className="flex items-center bg-surface-base border border-white/[0.07] rounded-xl p-1 text-xs">
              <button
                onClick={() => setOrder('C')}
                className={`px-2 py-1 rounded-lg font-mono transition ${
                  order === 'C' ? 'bg-brand-matrix text-surface-base font-bold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Row-Major C Order"
              >
                C-Order
              </button>
              <button
                onClick={() => setOrder('F')}
                className={`px-2 py-1 rounded-lg font-mono transition ${
                  order === 'F' ? 'bg-brand-viz text-surface-base font-bold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Column-Major Fortran Order"
              >
                F-Order
              </button>
            </div>
          </div>
        </div>

        {/* Interactive Operation Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setOperation('base')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition border ${
              operation === 'base'
                ? 'bg-surface-card-hover text-white border-white/20 shadow-md ring-1 ring-white/10'
                : 'bg-surface-base text-zinc-400 border-white/[0.07] hover:text-zinc-200 hover:bg-surface-card'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Base (arr)</span>
          </button>

          <button
            onClick={() => setOperation('transpose')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition border ${
              operation === 'transpose'
                ? 'bg-brand-torch/20 text-brand-torch border-brand-torch/50 shadow-md ring-1 ring-brand-torch/30'
                : 'bg-surface-base text-zinc-400 border-white/[0.07] hover:text-purple-300 hover:bg-surface-card'
            }`}
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
            <span>Transpose (.T)</span>
          </button>

          <button
            onClick={() => setOperation('slice')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition border ${
              operation === 'slice'
                ? 'bg-brand-data/20 text-brand-data border-brand-data/50 shadow-md ring-1 ring-brand-data/30'
                : 'bg-surface-base text-zinc-400 border-white/[0.07] hover:text-cyan-300 hover:bg-surface-card'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Slice (arr[::{sliceStepR}, ::{sliceStepC}])</span>
          </button>

          <button
            onClick={() => setOperation('broadcast')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition border ${
              operation === 'broadcast'
                ? 'bg-brand-viz/20 text-brand-viz border-brand-viz/50 shadow-md ring-1 ring-brand-viz/30'
                : 'bg-surface-base text-zinc-400 border-white/[0.07] hover:text-amber-300 hover:bg-surface-card'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Broadcast (arr[:, None])</span>
          </button>

          <button
            onClick={() => {
              setOperation('reshape');
              setReshapeShape('2, 6');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition border ${
              operation === 'reshape'
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/30'
                : 'bg-surface-base text-zinc-400 border-white/[0.07] hover:text-indigo-300 hover:bg-surface-card'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Reshape ({reshapeShape})</span>
          </button>

          <button
            onClick={() => setOperation('copy')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition border ${
              operation === 'copy'
                ? 'bg-brand-error/20 text-brand-error border-brand-error/50 shadow-md ring-1 ring-brand-error/30'
                : 'bg-surface-base text-zinc-400 border-white/[0.07] hover:text-rose-300 hover:bg-surface-card'
            }`}
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Deep Copy (.copy())</span>
          </button>
        </div>

        {/* Slice Sub-Controls if Slice is active */}
        {operation === 'slice' && (
          <div className="p-3 bg-surface-canvas rounded-xl border border-brand-data/30 flex flex-wrap items-center gap-4 text-xs">
            <span className="font-mono text-brand-data font-bold">Slice Configurator:</span>
            <div className="flex items-center gap-2">
              <span className="text-zinc-400 font-mono">Row Step:</span>
              {[1, 2, 3].map((step) => (
                <button
                  key={`r-step-${step}`}
                  onClick={() => setSliceStepR(step)}
                  className={`px-2 py-0.5 rounded font-mono ${
                    sliceStepR === step ? 'bg-brand-data text-surface-base font-bold' : 'bg-surface-panel text-zinc-400'
                  }`}
                >
                  ::{step}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-400 font-mono">Col Step:</span>
              {[1, 2, 3].map((step) => (
                <button
                  key={`c-step-${step}`}
                  onClick={() => setSliceStepC(step)}
                  className={`px-2 py-0.5 rounded font-mono ${
                    sliceStepC === step ? 'bg-brand-data text-surface-base font-bold' : 'bg-surface-panel text-zinc-400'
                  }`}
                >
                  ::{step}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Reshape Sub-Controls if Reshape is active */}
        {operation === 'reshape' && (
          <div className="p-3 bg-surface-canvas rounded-xl border border-indigo-500/30 flex flex-wrap items-center gap-3 text-xs">
            <span className="font-mono text-indigo-300 font-bold">Target Shape:</span>
            <div className="flex items-center gap-2">
              {['2, 6', '4, 3', '6, 2', '12', '2, 2, 3'].map((sh) => (
                <button
                  key={`reshape-${sh}`}
                  onClick={() => setReshapeShape(sh)}
                  className={`px-2.5 py-1 rounded-lg font-mono transition ${
                    reshapeShape === sh ? 'bg-indigo-600 text-white font-bold shadow' : 'bg-surface-panel text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  ({sh})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Live Memory Metadata Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {/* Status Badge */}
          <div className="col-span-2 md:col-span-1 p-3 bg-surface-base border border-white/[0.07] rounded-xl flex flex-col justify-between">
            <span className="text-[10px] text-zinc-500 font-mono uppercase font-semibold">Memory Mode</span>
            {isZeroCopy ? (
              <div className="flex items-center gap-1.5 text-brand-matrix font-bold font-mono text-xs mt-1">
                <span className="inline-block w-2 h-2 rounded-full bg-brand-matrix animate-ping" />
                <span>🟢 ZERO-COPY VIEW</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-brand-error font-bold font-mono text-xs mt-1">
                <span className="inline-block w-2 h-2 rounded-full bg-brand-error" />
                <span>⚠️ MEMORY COPY</span>
              </div>
            )}
            <span className="text-[10px] text-zinc-400 mt-1">
              {isZeroCopy ? '0 Bytes allocated ($O(1)$)' : `${baseTotalElements * itemSize} Bytes copied on Heap`}
            </span>
          </div>

          {/* Shape Card */}
          <div className="p-3 bg-surface-base border border-white/[0.07] rounded-xl space-y-1">
            <span className="text-[10px] text-zinc-500 font-mono uppercase font-semibold">Shape</span>
            <div className="text-sm font-bold font-mono text-brand-data">
              ({effShape.join(', ')})
            </div>
            <span className="text-[10px] text-zinc-400">
              {effShape.reduce((a, b) => a * b, 1)} elements
            </span>
          </div>

          {/* Strides Card */}
          <div className="p-3 bg-surface-base border border-white/[0.07] rounded-xl space-y-1">
            <span className="text-[10px] text-zinc-500 font-mono uppercase font-semibold">Strides (Bytes)</span>
            <div className="text-sm font-bold font-mono text-brand-torch">
              ({effStrides.join(', ')})
            </div>
            <span className="text-[10px] text-zinc-400">
              Step sizes in RAM
            </span>
          </div>

          {/* Memory Flags */}
          <div className="p-3 bg-surface-base border border-white/[0.07] rounded-xl space-y-1">
            <span className="text-[10px] text-zinc-500 font-mono uppercase font-semibold">Memory Flags</span>
            <div className="text-xs font-mono font-bold text-zinc-200">
              {isCContiguous ? 'C_CONTIGUOUS' : isFContiguous ? 'F_CONTIGUOUS' : 'NON-CONTIGUOUS'}
            </div>
            <span className="text-[10px] text-zinc-400">
              OWNDATA: <strong className={isZeroCopy && operation !== 'base' ? 'text-brand-viz' : 'text-brand-matrix'}>{isZeroCopy && operation !== 'base' ? 'False' : 'True'}</strong>
            </span>
          </div>

          {/* Hover Pointer Address */}
          <div className="p-3 bg-surface-base border border-white/[0.07] rounded-xl space-y-1">
            <span className="text-[10px] text-zinc-500 font-mono uppercase font-semibold">Active Byte Pointer</span>
            <div className="text-sm font-bold font-mono text-brand-viz">
              {activeByteOffset !== null ? `+${activeByteOffset} B` : '--'}
            </div>
            <span className="text-[10px] text-zinc-400 font-mono truncate block">
              {activeByteOffset !== null ? `0x7FFF5820 + ${activeByteOffset}` : 'Hover any cell'}
            </span>
          </div>
        </div>

        {/* Dynamic Code & Memory Explanation */}
        <div className="p-3.5 bg-surface-canvas border border-white/[0.07] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 font-mono font-semibold">Python:</span>
            <code className="font-mono text-brand-matrix bg-surface-panel px-2.5 py-1 rounded-lg border border-white/[0.07]">
              {operationCode}
            </code>
          </div>
          <p className="text-[11px] text-zinc-300 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-brand-data shrink-0" />
            <span>{copyReason || memoryNotes}</span>
          </p>
        </div>

        {/* 2D Logical View vs 1D Physical RAM Strip */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 pt-1">
          {/* 1. Logical 2D Matrix */}
          <div className="p-4 bg-surface-base/80 border border-white/[0.07] rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-data" />
                <span className="text-xs font-bold text-zinc-200">
                  Logical ndarray View <code className="font-mono text-brand-data font-normal">arr[i, j]</code>
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">
                Hover coordinate to trace RAM pointer
              </span>
            </div>

            <div
              className="grid gap-2 p-3 bg-surface-canvas rounded-xl border border-white/[0.05]"
              style={{ gridTemplateColumns: `repeat(${renderCols}, minmax(0, 1fr))` }}
            >
              {logicalGrid.flatMap((row) =>
                row.map((cell) => {
                  const isSelected =
                    hoveredLogical?.r === cell.r && hoveredLogical?.c === cell.c;
                  const isByteMatched = cell.physicalOffset === activeByteOffset;

                  return (
                    <div
                      key={`logical-${cell.r}-${cell.c}`}
                      onMouseEnter={() => {
                        setHoveredLogical({ r: cell.r, c: cell.c });
                        setHoveredPhysicalIndex(null);
                      }}
                      className={`p-3 rounded-xl border text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${
                        isSelected || isByteMatched
                          ? 'bg-brand-matrix/15 border-brand-matrix text-white shadow-lg shadow-brand-matrix/20 scale-105 ring-1 ring-brand-matrix/40'
                          : 'bg-surface-panel border-white/[0.07] text-zinc-300 hover:border-white/20 hover:bg-surface-card'
                      }`}
                    >
                      <span className="text-sm font-mono font-bold text-white">{cell.val}</span>
                      <div className="text-[9px] font-mono text-zinc-400 mt-1 flex items-center justify-center gap-1">
                        <span>[{cell.r},{cell.c}]</span>
                        <span className="text-brand-torch">+{cell.physicalOffset}B</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Formula Breakdown for Hovered Cell */}
            <div className="p-3 bg-surface-panel rounded-xl border border-white/[0.05] text-[11px] font-mono space-y-1">
              <span className="text-zinc-400 text-[10px] uppercase font-semibold">Pointer Arithmetic Formula:</span>
              <div className="text-zinc-200">
                <span className="text-brand-matrix">Byte_Address(i, j)</span> = Base + i × {effStrides[0]}B + j × {effStrides[1]}B
              </div>
              {hoveredLogical && (
                <div className="text-brand-viz font-semibold pt-0.5">
                  ▶ Evaluated for [{hoveredLogical.r}, {hoveredLogical.c}]:{' '}
                  <span className="text-white">
                    0x7FFF5820 + {hoveredLogical.r} × {effStrides[0]}B + {hoveredLogical.c} × {effStrides[1]}B = 0x7FFF5820 +{' '}
                    {hoveredLogical.r * effStrides[0] + hoveredLogical.c * effStrides[1]}B
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 2. Physical 1D Contiguous RAM Strip */}
          <div className="p-4 bg-surface-base/80 border border-white/[0.07] rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-matrix" />
                <span className="text-xs font-bold text-zinc-200">
                  Physical 1D Contiguous RAM Buffer <code className="font-mono text-brand-matrix font-normal">P_base + offset</code>
                </span>
              </div>
              <span className="text-[10px] font-mono text-brand-matrix bg-brand-matrix/10 px-2 py-0.5 rounded border border-brand-matrix/20">
                64-Byte Cache Aligned
              </span>
            </div>

            <div className="flex gap-1.5 overflow-x-auto p-3 bg-surface-canvas rounded-xl border border-white/[0.05] min-h-[90px] items-center">
              {baseBuffer.map((b) => {
                const isSelected = b.baseByteOffset === activeByteOffset;

                // Check if this byte is actually mapped in current view
                const isReferenced = logicalGrid.some((row) =>
                  row.some((c) => c.physicalOffset === b.baseByteOffset)
                );

                return (
                  <div
                    key={`ram-${b.physicalIndex}`}
                    onMouseEnter={() => {
                      setHoveredPhysicalIndex(b.physicalIndex);
                      setHoveredLogical(null);
                    }}
                    className={`flex-1 min-w-[56px] p-2.5 rounded-xl border text-center transition-all duration-200 flex flex-col items-center justify-center cursor-pointer ${
                      isSelected
                        ? 'bg-brand-viz/20 border-brand-viz text-brand-viz shadow-lg shadow-brand-viz/25 scale-110 ring-2 ring-brand-viz/50 z-10'
                        : isReferenced
                        ? 'bg-surface-panel border-white/[0.07] text-zinc-300 hover:border-brand-matrix/50 hover:bg-surface-card'
                        : 'bg-surface-panel/40 border-white/[0.03] text-zinc-600 opacity-40'
                    }`}
                  >
                    <span className="text-xs font-mono font-bold text-white">{b.val}</span>
                    <span className="text-[8px] font-mono text-brand-torch font-semibold mt-1">
                      +{b.baseByteOffset}B
                    </span>
                    <span className="text-[7px] font-mono text-zinc-500 mt-0.5">
                      #{b.physicalIndex}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-surface-panel rounded-xl border border-white/[0.05] text-[11px] text-zinc-300 leading-relaxed space-y-1.5">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-matrix" />
                <span>Why NumPy is blazing fast:</span>
              </div>
              <p>
                When you execute operations like <code className="text-brand-torch font-mono">arr.T</code> or <code className="text-brand-data font-mono">arr[::2]</code>, NumPy <strong>never mutates or reorders physical RAM bytes</strong>!
                It only constructs a light C-struct wrapper (<code className="text-brand-matrix font-mono">PyArrayObject</code>) updating <code className="text-zinc-200 font-mono">strides</code> and <code className="text-zinc-200 font-mono">shape</code> pointers in CPU registers.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Axis Reduction Simulator */}
      <div className="rounded-2xl border border-white/[0.07] bg-surface-panel/90 p-5 space-y-4 shadow-xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.07] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-matrix/10 border border-brand-matrix/30 flex items-center justify-center text-brand-matrix">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Axis Reduction & Dimension Collapse Simulator
              </h3>
              <p className="text-xs text-zinc-400">
                Visualize how NumPy collapses axes horizontally, vertically, or completely.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-surface-base border border-white/[0.07] rounded-xl p-1 text-xs">
              <button
                onClick={() => setSelectedAxis(null)}
                className={`px-2.5 py-1 rounded-lg transition ${
                  selectedAxis === null ? 'bg-zinc-700 text-white font-bold' : 'text-zinc-400'
                }`}
              >
                No Reduction
              </button>
              <button
                onClick={() => setSelectedAxis(0)}
                className={`px-2.5 py-1 rounded-lg font-mono transition ${
                  selectedAxis === 0 ? 'bg-brand-matrix text-surface-base font-bold' : 'text-zinc-400'
                }`}
              >
                axis=0 (Rows)
              </button>
              <button
                onClick={() => setSelectedAxis(1)}
                className={`px-2.5 py-1 rounded-lg font-mono transition ${
                  selectedAxis === 1 ? 'bg-brand-data text-surface-base font-bold' : 'text-zinc-400'
                }`}
              >
                axis=1 (Cols)
              </button>
            </div>

            <button
              onClick={() => setKeepDims(!keepDims)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition border ${
                keepDims
                  ? 'bg-brand-torch/20 text-brand-torch border-brand-torch/50 font-bold'
                  : 'bg-surface-base text-zinc-400 border-white/[0.07]'
              }`}
            >
              keepdims={keepDims ? 'True' : 'False'}
            </button>
          </div>
        </div>

        <div className="p-4 bg-surface-base rounded-xl border border-white/[0.07] space-y-3 text-xs">
          <div className="flex items-center gap-2 text-zinc-200 flex-wrap">
            <span className="font-bold text-brand-matrix">Python Invocation:</span>
            <code className="font-mono bg-surface-canvas px-2.5 py-1 rounded-lg border border-white/[0.07] text-brand-torch">
              np.sum(arr, axis={selectedAxis === null ? 'None' : selectedAxis}, keepdims={keepDims ? 'True' : 'False'})
            </code>
            <ArrowRight className="w-4 h-4 text-zinc-500" />
            <span className="font-mono text-brand-data font-bold">
              Output Shape:{' '}
              {selectedAxis === null
                ? keepDims
                  ? '(1, 1)'
                  : '()'
                : selectedAxis === 0
                ? keepDims
                  ? `(1, ${baseCols})`
                  : `(${baseCols},)`
                : keepDims
                ? `(${baseRows}, 1)`
                : `(${baseRows},)`}
            </span>
          </div>

          <div className="p-3 bg-brand-matrix/5 border border-brand-matrix/20 rounded-xl text-[11px] text-zinc-300 leading-relaxed">
            💡 <strong>The Ironclad Rule of Axis:</strong> The axis specified is the dimension that gets <strong>collapsed / eliminated</strong>!
            {selectedAxis === 0 && ' axis=0 sums vertically down each column, reducing (M, N) into (N,).'}
            {selectedAxis === 1 && ' axis=1 sums horizontally across each row, reducing (M, N) into (M,).'}
            {selectedAxis === null && ' axis=None collapses all elements into a scalar!'}
          </div>
        </div>
      </div>

      {/* Broadcasting Compatibility Checker */}
      <div className="rounded-2xl border border-white/[0.07] bg-surface-panel/90 p-5 space-y-4 shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-2.5 border-b border-white/[0.07] pb-3">
          <div className="w-8 h-8 rounded-xl bg-brand-viz/10 border border-brand-viz/30 flex items-center justify-center text-brand-viz">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Live SIMD Broadcasting Compatibility Engine
            </h3>
            <p className="text-xs text-zinc-400">
              Test two arbitrary ndarray tensor shapes and evaluate automatic stride-0 expansion rules.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-medium">Shape Array A (comma separated):</label>
            <input
              type="text"
              value={bShapeA}
              onChange={(e) => setBShapeA(e.target.value)}
              className="w-full bg-surface-base border border-white/[0.07] rounded-xl px-3.5 py-2 text-xs font-mono text-brand-data focus:outline-none focus:border-brand-data/50 focus:ring-1 focus:ring-brand-data/30"
              placeholder="e.g. 3, 1"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-medium">Shape Array B (comma separated):</label>
            <input
              type="text"
              value={bShapeB}
              onChange={(e) => setBShapeB(e.target.value)}
              className="w-full bg-surface-base border border-white/[0.07] rounded-xl px-3.5 py-2 text-xs font-mono text-brand-torch focus:outline-none focus:border-brand-torch/50 focus:ring-1 focus:ring-brand-torch/30"
              placeholder="e.g. 1, 4"
            />
          </div>
        </div>

        <div className="p-4 bg-surface-base border border-white/[0.07] rounded-xl space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              {broadcastResult.compatible ? (
                <CheckCircle2 className="w-4 h-4 text-brand-matrix" />
              ) : (
                <AlertCircle className="w-4 h-4 text-brand-error" />
              )}
              <span
                className={`text-xs font-bold ${
                  broadcastResult.compatible ? 'text-brand-matrix' : 'text-brand-error'
                }`}
              >
                {broadcastResult.compatible ? 'Compatible for Broadcasting' : 'Broadcasting Error (ValueError: operands could not be broadcast)'}
              </span>
            </div>

            {broadcastResult.compatible && (
              <span className="text-xs font-mono text-brand-data font-bold">
                Resulting Broadcast Shape: {broadcastResult.result}
              </span>
            )}
          </div>

          <div className="space-y-1.5 pt-1">
            {broadcastResult.steps.map((step, idx) => (
              <div
                key={idx}
                className={`text-[11px] font-mono flex items-center gap-2 p-1.5 rounded-lg ${
                  step.ok ? 'bg-surface-panel/60 text-zinc-300' : 'bg-brand-error/10 text-brand-error'
                }`}
              >
                <span>{step.ok ? '✓' : '✗'}</span>
                <span>{step.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveArrayVisualizer;
