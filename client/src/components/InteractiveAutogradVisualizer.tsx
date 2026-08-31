import React, { useState, useEffect } from 'react';
import {
  Network,
  RotateCcw,
  Play,
  Pause,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

type StepStage =
  | 0 // Reset / Leaf nodes initialized
  | 1 // Forward: z = w * x (MulBackward)
  | 2 // Forward: y = z + b (AddBackward)
  | 3 // Forward: Loss = 0.5 * (y - y_true)^2 (MseBackward)
  | 4 // Backward: Seed dL/dL = 1.0
  | 5 // Backward: dL/dy = y - y_true
  | 6 // Backward: dL/dz = dL/dy * 1, dL/db = dL/dy * 1 -> b.grad
  | 7 // Backward: dL/dw = dL/dz * x -> w.grad
  | 8; // Optimizer Step: w_new, b_new updated!

export const InteractiveAutogradVisualizer: React.FC = () => {
  const [xVal, setXVal] = useState<number>(2.0);
  const [wVal, setWVal] = useState<number>(3.0);
  const [bVal, setBVal] = useState<number>(1.0);
  const [yTarget, setYTarget] = useState<number>(10.0);
  const [learningRate, setLearningRate] = useState<number>(0.05);

  const [stepStage, setStepStage] = useState<StepStage>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const zVal = wVal * xVal;
  const yVal = zVal + bVal;
  const error = yVal - yTarget;
  const lossVal = 0.5 * Math.pow(error, 2);

  const dLoss_dy = error;
  const dLoss_dz = dLoss_dy * 1.0;
  const dLoss_db = dLoss_dy * 1.0;
  const dLoss_dw = dLoss_dz * xVal;

  const wNext = wVal - learningRate * dLoss_dw;
  const bNext = bVal - learningRate * dLoss_db;

  useEffect(() => {
    let timer: number | null = null;
    if (isPlaying) {
      timer = window.setInterval(() => {
        setStepStage((prev) => {
          if (prev >= 8) {
            setIsPlaying(false);
            return 8;
          }
          return (prev + 1) as StepStage;
        });
      }, 1500);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying]);

  const handleReset = () => {
    setStepStage(0);
    setIsPlaying(false);
  };

  const handleStepForward = () => {
    if (stepStage < 8) {
      setStepStage((prev) => (prev + 1) as StepStage);
    }
  };

  const handleStepBackward = () => {
    if (stepStage > 0) {
      setStepStage((prev) => (prev - 1) as StepStage);
    }
  };

  const handleApplyOptimizer = () => {
    setWVal(parseFloat(wNext.toFixed(2)));
    setBVal(parseFloat(bNext.toFixed(2)));
    setStepStage(0);
  };

  const isBackwardStarted = stepStage >= 4;

  const getStageDescription = () => {
    switch (stepStage) {
      case 0:
        return '🌱 Leaf Tensors Initialized: w (requires_grad=True), x, and b (requires_grad=True). Graph ready for forward execution.';
      case 1:
        return `⚡ Op 1 <MulBackward0>: z = w * x = ${wVal.toFixed(1)} × ${xVal.toFixed(1)} = ${zVal.toFixed(2)}. PyTorch saves input tensors into grad_fn context.`;
      case 2:
        return `⚡ Op 2 <AddBackward0>: y = z + b = ${zVal.toFixed(2)} + ${bVal.toFixed(1)} = ${yVal.toFixed(2)}. Prediction computed.`;
      case 3:
        return `🎯 Op 3 <MseLossBackward0>: Loss = 0.5 * (y - y_true)^2 = 0.5 * (${yVal.toFixed(2)} - ${yTarget.toFixed(1)})^2 = ${lossVal.toFixed(3)}. Forward pass complete!`;
      case 4:
        return `🩸 Backward Seeded: loss.backward() invoked. Seed gradient dLoss/dLoss = 1.0 injected at root Loss node.`;
      case 5:
        return `◀ Backprop through Loss: dLoss/dy = (y - y_true) = (${yVal.toFixed(2)} - ${yTarget.toFixed(1)}) = ${dLoss_dy.toFixed(2)}.`;
      case 6:
        return `◀ Backprop through <AddBackward0>: Jacobian splits into dLoss/dz = ${dLoss_dz.toFixed(2)} and accumulates leaf b.grad += ${dLoss_db.toFixed(2)}.`;
      case 7:
        return `◀ Backprop through <MulBackward0>: Chain rule dLoss/dw = dLoss/dz * x = ${dLoss_dz.toFixed(2)} × ${xVal.toFixed(1)} = ${dLoss_dw.toFixed(2)} accumulated into w.grad!`;
      case 8:
        return `🚀 Epoch Complete: All leaf gradients populated! Optimizer ready to step: w_new = ${wNext.toFixed(2)}, b_new = ${bNext.toFixed(2)}.`;
    }
  };

  return (
    <div className="space-y-6 text-zinc-100">
      {/* Top Banner & Control Deck */}
      <div className="rounded-2xl border border-white/[0.07] bg-surface-panel/90 p-5 space-y-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/[0.07] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-torch/10 border border-brand-torch/30 flex items-center justify-center text-brand-torch shadow-lg shadow-brand-torch/10">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  PyTorch Autograd Dynamic Computational Graph & Reverse-Mode DAG
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-torch/10 text-brand-torch border border-brand-torch/20 font-semibold">
                  Vector-Jacobian Product (VJP)
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Inspect dynamic computational graph construction during forward tensor evaluation and trace reverse gradient flow through <code className="text-brand-torch font-mono">grad_fn</code> pointers.
              </p>
            </div>
          </div>

          {/* Stepper Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-3 py-1.5 bg-surface-base hover:bg-surface-card text-zinc-300 border border-white/[0.07] rounded-xl text-xs font-mono transition"
              title="Reset Graph to Initial State"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <button
              onClick={handleStepBackward}
              disabled={stepStage === 0}
              className="flex items-center gap-1 px-3 py-1.5 bg-surface-base hover:bg-surface-card disabled:opacity-40 text-zinc-300 border border-white/[0.07] rounded-xl text-xs font-mono transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Step ◀</span>
            </button>

            <button
              onClick={handleStepForward}
              disabled={stepStage === 8}
              className="flex items-center gap-1 px-3 py-1.5 bg-brand-torch hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl text-xs font-mono font-bold transition shadow-lg shadow-brand-torch/20"
            >
              <span>Step ▶</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition border ${
                isPlaying
                  ? 'bg-brand-viz/20 text-brand-viz border-brand-viz/40'
                  : 'bg-surface-base text-zinc-300 border-white/[0.07] hover:bg-surface-card'
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Pause' : 'Auto Play'}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Parameter Tuning Controls */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 bg-surface-base border border-white/[0.07] rounded-xl space-y-1">
            <span className="text-[10px] text-brand-torch font-mono font-bold uppercase block">
              w (requires_grad=True)
            </span>
            <input
              type="number"
              step="0.5"
              value={wVal}
              onChange={(e) => setWVal(parseFloat(e.target.value) || 0)}
              className="w-full bg-transparent text-sm font-mono font-bold text-white focus:outline-none"
            />
            <span className="text-[9px] text-zinc-500 font-mono">Learnable Leaf</span>
          </div>

          <div className="p-3 bg-surface-base border border-white/[0.07] rounded-xl space-y-1">
            <span className="text-[10px] text-brand-data font-mono font-bold uppercase block">
              x (Input Feature)
            </span>
            <input
              type="number"
              step="0.5"
              value={xVal}
              onChange={(e) => setXVal(parseFloat(e.target.value) || 0)}
              className="w-full bg-transparent text-sm font-mono font-bold text-white focus:outline-none"
            />
            <span className="text-[9px] text-zinc-500 font-mono">Constant Input</span>
          </div>

          <div className="p-3 bg-surface-base border border-white/[0.07] rounded-xl space-y-1">
            <span className="text-[10px] text-brand-torch font-mono font-bold uppercase block">
              b (requires_grad=True)
            </span>
            <input
              type="number"
              step="0.5"
              value={bVal}
              onChange={(e) => setBVal(parseFloat(e.target.value) || 0)}
              className="w-full bg-transparent text-sm font-mono font-bold text-white focus:outline-none"
            />
            <span className="text-[9px] text-zinc-500 font-mono">Learnable Leaf</span>
          </div>

          <div className="p-3 bg-surface-base border border-white/[0.07] rounded-xl space-y-1">
            <span className="text-[10px] text-brand-error font-mono font-bold uppercase block">
              y_target (Ground Truth)
            </span>
            <input
              type="number"
              step="1.0"
              value={yTarget}
              onChange={(e) => setYTarget(parseFloat(e.target.value) || 0)}
              className="w-full bg-transparent text-sm font-mono font-bold text-white focus:outline-none"
            />
            <span className="text-[9px] text-zinc-500 font-mono">Supervision Label</span>
          </div>

          <div className="p-3 bg-surface-base border border-white/[0.07] rounded-xl space-y-1">
            <span className="text-[10px] text-brand-matrix font-mono font-bold uppercase block">
              Learning Rate (lr)
            </span>
            <input
              type="number"
              step="0.01"
              value={learningRate}
              onChange={(e) => setLearningRate(parseFloat(e.target.value) || 0)}
              className="w-full bg-transparent text-sm font-mono font-bold text-brand-matrix focus:outline-none"
            />
            <span className="text-[9px] text-zinc-500 font-mono">SGD Step Size</span>
          </div>
        </div>

        {/* Dynamic State Banner & Stage Indicator */}
        <div className="p-4 bg-surface-base rounded-xl border border-white/[0.07] space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-zinc-400 font-mono">Execution Phase:</span>
              <span
                className={`font-mono font-bold px-2 py-0.5 rounded-lg border ${
                  stepStage === 0
                    ? 'bg-surface-canvas text-zinc-300 border-white/[0.07]'
                    : stepStage <= 3
                    ? 'bg-brand-data/15 text-brand-data border-brand-data/30'
                    : stepStage <= 7
                    ? 'bg-brand-torch/15 text-brand-torch border-brand-torch/30'
                    : 'bg-brand-matrix/15 text-brand-matrix border-brand-matrix/30'
                }`}
              >
                {stepStage === 0 && '⚪ IDLE / READY'}
                {stepStage >= 1 && stepStage <= 3 && '🔵 FORWARD GRAPH PASS'}
                {stepStage >= 4 && stepStage <= 7 && '🟣 BACKWARD GRADIENT BACKPROP'}
                {stepStage === 8 && '🟢 OPTIMIZER READY'}
              </span>
            </div>

            <div className="flex items-center gap-1 font-mono text-[10px] text-zinc-400">
              <span>Step {stepStage} of 8</span>
            </div>
          </div>

          {/* Stepper Progress Indicator */}
          <div className="grid grid-cols-9 gap-1 h-1.5 w-full bg-surface-canvas rounded-full overflow-hidden">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={`bar-${i}`}
                className={`h-full transition-all duration-300 ${
                  i <= stepStage
                    ? i <= 3
                      ? 'bg-brand-data'
                      : i <= 7
                      ? 'bg-brand-torch'
                      : 'bg-brand-matrix'
                    : 'bg-white/[0.05]'
                }`}
              />
            ))}
          </div>

          <p className="text-xs text-zinc-200 leading-relaxed font-mono">
            {getStageDescription()}
          </p>
        </div>

        {/* Dynamic Computational Graph Visualizer */}
        <div className="p-5 bg-surface-base border border-white/[0.07] rounded-xl space-y-4">
          <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-white/[0.07] pb-2">
            <span className="font-semibold text-zinc-300">
              DAG Topology: <span className="text-brand-data">Forward (Left ➔ Right)</span> |{' '}
              <span className="text-brand-torch">Backward (Right ➔ Left)</span>
            </span>
            <span className="text-[10px] font-mono text-zinc-500">Live Tensor Nodes</span>
          </div>

          {/* Graph Nodes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-4 items-center">
            {/* Column 1: Leaf Inputs & Parameters */}
            <div className="space-y-3">
              {/* Node: Weight w */}
              <div
                className={`p-3.5 rounded-xl border transition-all duration-300 space-y-1 text-center ${
                  stepStage === 7 || stepStage === 8
                    ? 'bg-brand-torch/15 border-brand-torch shadow-lg shadow-brand-torch/20 ring-1 ring-brand-torch/40'
                    : 'bg-surface-panel border-white/[0.07]'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-brand-torch font-bold">Tensor: w</span>
                  <span className="text-zinc-500">[requires_grad]</span>
                </div>
                <div className="text-base font-bold font-mono text-white">{wVal.toFixed(2)}</div>
                <div className="text-[10px] font-mono pt-1 border-t border-white/[0.04] text-zinc-400">
                  w.grad ={' '}
                  <strong className={stepStage >= 7 ? 'text-brand-matrix' : 'text-zinc-600'}>
                    {stepStage >= 7 ? dLoss_dw.toFixed(2) : 'None'}
                  </strong>
                </div>
              </div>

              {/* Node: Input x */}
              <div
                className={`p-3.5 rounded-xl border transition-all duration-300 space-y-1 text-center ${
                  stepStage >= 1
                    ? 'bg-brand-data/10 border-brand-data/40'
                    : 'bg-surface-panel border-white/[0.07]'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-brand-data font-bold">Tensor: x</span>
                  <span className="text-zinc-500">[leaf]</span>
                </div>
                <div className="text-base font-bold font-mono text-white">{xVal.toFixed(2)}</div>
                <div className="text-[10px] font-mono pt-1 border-t border-white/[0.04] text-zinc-500">
                  requires_grad=False
                </div>
              </div>

              {/* Node: Bias b */}
              <div
                className={`p-3.5 rounded-xl border transition-all duration-300 space-y-1 text-center ${
                  stepStage >= 6
                    ? 'bg-brand-torch/15 border-brand-torch shadow-lg shadow-brand-torch/20 ring-1 ring-brand-torch/40'
                    : 'bg-surface-panel border-white/[0.07]'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-brand-torch font-bold">Tensor: b</span>
                  <span className="text-zinc-500">[requires_grad]</span>
                </div>
                <div className="text-base font-bold font-mono text-white">{bVal.toFixed(2)}</div>
                <div className="text-[10px] font-mono pt-1 border-t border-white/[0.04] text-zinc-400">
                  b.grad ={' '}
                  <strong className={stepStage >= 6 ? 'text-brand-matrix' : 'text-zinc-600'}>
                    {stepStage >= 6 ? dLoss_db.toFixed(2) : 'None'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Column 2: Op Node 1 <MulBackward0> */}
            <div className="flex flex-col items-center justify-center space-y-3">
              <div
                className={`w-full p-4 rounded-xl border transition-all duration-300 space-y-2 text-center ${
                  stepStage === 1
                    ? 'bg-brand-data/15 border-brand-data shadow-lg shadow-brand-data/20 ring-1 ring-brand-data/40'
                    : stepStage === 7
                    ? 'bg-brand-torch/15 border-brand-torch shadow-lg shadow-brand-torch/20'
                    : 'bg-surface-panel border-white/[0.07]'
                }`}
              >
                <div className="text-[10px] font-mono font-bold text-brand-data">
                  grad_fn: &lt;MulBackward0&gt;
                </div>
                <div className="text-xs font-mono text-zinc-300">z = w * x</div>
                <div className="text-sm font-bold font-mono text-white">
                  {stepStage >= 1 ? zVal.toFixed(2) : '--'}
                </div>
                <div className="text-[10px] font-mono text-zinc-400 pt-1 border-t border-white/[0.04]">
                  {stepStage >= 7 ? (
                    <span className="text-brand-torch font-bold">dL/dz = {dLoss_dz.toFixed(2)}</span>
                  ) : (
                    <span>Jacobian: dz/dw=x</span>
                  )}
                </div>
              </div>
            </div>

            {/* Column 3: Op Node 2 <AddBackward0> */}
            <div className="flex flex-col items-center justify-center space-y-3">
              <div
                className={`w-full p-4 rounded-xl border transition-all duration-300 space-y-2 text-center ${
                  stepStage === 2
                    ? 'bg-brand-data/15 border-brand-data shadow-lg shadow-brand-data/20 ring-1 ring-brand-data/40'
                    : stepStage === 6
                    ? 'bg-brand-torch/15 border-brand-torch shadow-lg shadow-brand-torch/20'
                    : 'bg-surface-panel border-white/[0.07]'
                }`}
              >
                <div className="text-[10px] font-mono font-bold text-brand-data">
                  grad_fn: &lt;AddBackward0&gt;
                </div>
                <div className="text-xs font-mono text-zinc-300">y = z + b</div>
                <div className="text-sm font-bold font-mono text-white">
                  {stepStage >= 2 ? yVal.toFixed(2) : '--'}
                </div>
                <div className="text-[10px] font-mono text-zinc-400 pt-1 border-t border-white/[0.04]">
                  {stepStage >= 5 ? (
                    <span className="text-brand-torch font-bold">dL/dy = {dLoss_dy.toFixed(2)}</span>
                  ) : (
                    <span>Jacobian: dy/dz=1</span>
                  )}
                </div>
              </div>
            </div>

            {/* Column 4: Loss Node <MseLossBackward0> */}
            <div className="flex flex-col items-center justify-center space-y-3">
              <div
                className={`w-full p-4 rounded-xl border transition-all duration-300 space-y-2 text-center ${
                  stepStage === 3
                    ? 'bg-brand-error/15 border-brand-error shadow-lg shadow-brand-error/20 ring-1 ring-brand-error/40'
                    : stepStage === 4 || stepStage === 5
                    ? 'bg-brand-torch/15 border-brand-torch shadow-lg shadow-brand-torch/20'
                    : 'bg-surface-panel border-white/[0.07]'
                }`}
              >
                <div className="text-[10px] font-mono font-bold text-brand-error">
                  Root: &lt;MseLossBackward0&gt;
                </div>
                <div className="text-xs font-mono text-zinc-300">L = 0.5*(y - y_true)²</div>
                <div className="text-base font-bold font-mono text-brand-error">
                  {stepStage >= 3 ? lossVal.toFixed(3) : '--'}
                </div>
                <div className="text-[10px] font-mono text-zinc-400 pt-1 border-t border-white/[0.04]">
                  {stepStage >= 4 ? (
                    <span className="text-brand-matrix font-bold">Seed dL/dL = 1.0</span>
                  ) : (
                    <span>target: {yTarget.toFixed(1)}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Optimizer Step Execution Card if Step 8 */}
          {stepStage === 8 && (
            <div className="p-4 bg-brand-matrix/10 border border-brand-matrix/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-brand-matrix font-mono">
                  ✨ Gradients Ready: Step Optimizer with Learning Rate η = {learningRate}
                </span>
                <div className="text-zinc-300 font-mono text-[11px] mt-0.5">
                  w_new = {wVal.toFixed(2)} - ({learningRate} × {dLoss_dw.toFixed(2)}) ={' '}
                  <strong className="text-white">{wNext.toFixed(2)}</strong> | b_new = {bVal.toFixed(2)} - (
                  {learningRate} × {dLoss_db.toFixed(2)}) ={' '}
                  <strong className="text-white">{bNext.toFixed(2)}</strong>
                </div>
              </div>

              <button
                onClick={handleApplyOptimizer}
                className="px-4 py-2 bg-brand-matrix text-surface-base font-mono font-bold rounded-xl shadow-lg shadow-brand-matrix/20 hover:opacity-95 transition shrink-0"
              >
                Apply Optimizer.step() & Reset ➔
              </button>
            </div>
          )}
        </div>

        {/* Vector-Jacobian Product Calculus Math Card */}
        <div className="p-4 bg-surface-base border border-white/[0.07] rounded-xl space-y-3">
          <span className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wider block">
            Calculus Chain Rule & Vector-Jacobian Product (VJP) Evaluator
          </span>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-[11px]">
            <div className="p-3 bg-surface-canvas rounded-xl border border-white/[0.05] space-y-1">
              <span className="text-zinc-500 text-[10px] uppercase font-bold">1. Loss Gradient</span>
              <div className="text-brand-error">∂L/∂y = y - y_true</div>
              <div className="text-zinc-300">
                = {yVal.toFixed(2)} - {yTarget.toFixed(1)} ={' '}
                <strong className={isBackwardStarted ? 'text-brand-matrix' : 'text-zinc-500'}>
                  {dLoss_dy.toFixed(2)}
                </strong>
              </div>
            </div>

            <div className="p-3 bg-surface-canvas rounded-xl border border-white/[0.05] space-y-1">
              <span className="text-zinc-500 text-[10px] uppercase font-bold">2. Bias Gradient</span>
              <div className="text-brand-torch">∂L/∂b = (∂L/∂y) × (∂y/∂b)</div>
              <div className="text-zinc-300">
                = {dLoss_dy.toFixed(2)} × 1.0 ={' '}
                <strong className={stepStage >= 6 ? 'text-brand-matrix' : 'text-zinc-500'}>
                  {dLoss_db.toFixed(2)}
                </strong>
              </div>
            </div>

            <div className="p-3 bg-surface-canvas rounded-xl border border-white/[0.05] space-y-1">
              <span className="text-zinc-500 text-[10px] uppercase font-bold">3. Weight Gradient</span>
              <div className="text-brand-torch">∂L/∂w = (∂L/∂z) × (∂z/∂w)</div>
              <div className="text-zinc-300">
                = {dLoss_dz.toFixed(2)} × {xVal.toFixed(1)} ={' '}
                <strong className={stepStage >= 7 ? 'text-brand-matrix' : 'text-zinc-500'}>
                  {dLoss_dw.toFixed(2)}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* PyTorch Python Code Sync */}
        <div className="p-4 bg-surface-base border border-white/[0.07] rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-brand-torch">
              PyTorch Python Execution Equivalent:
            </span>
            <span className="text-[10px] font-mono text-zinc-500">torch.autograd</span>
          </div>

          <pre className="p-3 bg-surface-canvas border border-white/[0.05] rounded-lg text-xs font-mono text-brand-matrix overflow-x-auto">
{`import torch

# 1. Initialize leaf tensors
w = torch.tensor(${wVal.toFixed(1)}, requires_grad=True)
x = torch.tensor(${xVal.toFixed(1)})
b = torch.tensor(${bVal.toFixed(1)}, requires_grad=True)

# 2. Forward pass (Constructs dynamic DAG with grad_fn pointers)
z = w * x                    # <MulBackward0>
y = z + b                    # <AddBackward0>
loss = 0.5 * (y - ${yTarget.toFixed(1)}) ** 2  # <MseLossBackward0>

# 3. Backward pass (Traverses DAG in reverse mode)
loss.backward()

# 4. Gradients accumulated into leaf tensors
print(w.grad)  # tensor(${dLoss_dw.toFixed(2)})
print(b.grad)  # tensor(${dLoss_db.toFixed(2)})`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default InteractiveAutogradVisualizer;
