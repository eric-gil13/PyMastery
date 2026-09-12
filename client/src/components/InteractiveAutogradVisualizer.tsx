import React, { useState, useEffect } from 'react';
import {
  Network,
  RotateCcw,
  Play,
  Pause,
  ArrowRight,
  ArrowLeft,
  Layers,
  Sliders,
  Copy,
  Check,
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
  const [torchTab, setTorchTab] = useState<'autograd' | 'nn'>('autograd');

  // NN Architecture state
  const [batchSize, setBatchSize] = useState<number>(32);
  const [inFeatures, setInFeatures] = useState<number>(128);
  const [hiddenFeatures, setHiddenFeatures] = useState<number>(256);
  const [numClasses, setNumClasses] = useState<number>(10);
  const [useBatchNorm, setUseBatchNorm] = useState<boolean>(true);
  const [useDropout, setUseDropout] = useState<boolean>(true);
  const [copiedNNCode, setCopiedNNCode] = useState<boolean>(false);
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

  const linear1Params = inFeatures * hiddenFeatures + hiddenFeatures;
  const bnParams = useBatchNorm ? 2 * hiddenFeatures : 0;
  const linear2Params = hiddenFeatures * numClasses + numClasses;
  const totalParams = linear1Params + bnParams + linear2Params;
  const paramMemoryKb = ((totalParams * 4) / 1024).toFixed(1);

  const generatedNNCode = `import torch
import torch.nn as nn

class ClassifierMLP(nn.Module):
    def __init__(self, in_features=${inFeatures}, hidden_dim=${hiddenFeatures}, num_classes=${numClasses}):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(in_features, hidden_dim),${useBatchNorm ? '\n            nn.BatchNorm1d(hidden_dim),' : ''}
            nn.ReLU(),${useDropout ? '\n            nn.Dropout(p=0.25),' : ''}
            nn.Linear(hidden_dim, num_classes)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # Input shape: [${batchSize}, ${inFeatures}]
        logits = self.net(x)
        # Output shape: [${batchSize}, ${numClasses}]
        return logits

# Initialize model & inspect shape propagation
model = ClassifierMLP()
dummy_batch = torch.randn(${batchSize}, ${inFeatures})
out = model(dummy_batch)
print("Output logits shape:", out.shape)  # torch.Size([${batchSize}, ${numClasses}])
print("Total Trainable Parameters:", sum(p.numel() for p in model.parameters() if p.requires_grad))`;

  return (
    <div className="space-y-6 text-zinc-100">
      {/* PyTorch Sub-Tab Switcher */}
      <div className="flex items-center justify-between border-b border-surface-border pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTorchTab('autograd')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition ${
              torchTab === 'autograd'
                ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow'
                : 'bg-surface-elevated border-surface-border text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Autograd Graph (DAG)</span>
          </button>
          <button
            onClick={() => setTorchTab('nn')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition ${
              torchTab === 'nn'
                ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow'
                : 'bg-surface-elevated border-surface-border text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Neural Network Layers & Shapes</span>
          </button>
        </div>
      </div>

      {torchTab === 'autograd' ? (
      <>
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
      </>
      ) : (
      /* ------------------------------------------------------------- */
      /* TAB: NEURAL NETWORK ARCHITECTURE & TENSOR SHAPES              */
      /* ------------------------------------------------------------- */
      <div className="space-y-6">
        {/* Top Architecture Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 bg-surface-panel border border-white/[0.07] rounded-2xl space-y-1">
            <div className="text-[10px] font-mono uppercase text-zinc-500">Total Trainable Parameters</div>
            <div className="text-xl font-bold font-mono text-rose-400">
              {totalParams.toLocaleString()}
            </div>
            <div className="text-[11px] text-zinc-400">Weights + Biases across all layers</div>
          </div>

          <div className="p-4 bg-surface-panel border border-white/[0.07] rounded-2xl space-y-1">
            <div className="text-[10px] font-mono uppercase text-zinc-500">Weights Memory Footprint</div>
            <div className="text-xl font-bold font-mono text-amber-400">
              {paramMemoryKb} KB
            </div>
            <div className="text-[11px] text-zinc-400">Float32 (4 bytes per parameter)</div>
          </div>

          <div className="p-4 bg-surface-panel border border-white/[0.07] rounded-2xl space-y-1">
            <div className="text-[10px] font-mono uppercase text-zinc-500">Batch Tensor Dimension</div>
            <div className="text-xl font-bold font-mono text-cyan-400">
              [{batchSize}, {numClasses}]
            </div>
            <div className="text-[11px] text-zinc-400">Output class prediction logits</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Layer Stack Visualizer */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-3 shadow-inner">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-400 pb-2 border-b border-zinc-800">
                <span>Layer Architecture & Forward Shape Propagation</span>
                <span className="text-rose-400">Sequential Execution</span>
              </div>

              {/* Layer 0: Input Tensor */}
              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono text-zinc-500 uppercase">Input Batch</div>
                  <div className="text-xs font-bold text-zinc-200">torch.Tensor</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-sky-400">
                    [{batchSize}, {inFeatures}]
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500">Batch × Features</div>
                </div>
              </div>

              <div className="text-center text-zinc-600 font-bold text-xs">↓</div>

              {/* Layer 1: nn.Linear */}
              <div className="p-3 bg-rose-950/20 border border-rose-900/40 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono text-rose-400 uppercase">Linear Layer 1</div>
                  <div className="text-xs font-bold text-zinc-200">nn.Linear({inFeatures}, {hiddenFeatures})</div>
                  <div className="text-[10px] text-zinc-400">
                    Params: {inFeatures} × {hiddenFeatures} + {hiddenFeatures} = {linear1Params.toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-rose-300">
                    [{batchSize}, {hiddenFeatures}]
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500">Affine Projection</div>
                </div>
              </div>

              {useBatchNorm && (
                <>
                  <div className="text-center text-zinc-600 font-bold text-xs">↓</div>
                  <div className="p-3 bg-indigo-950/20 border border-indigo-900/40 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-mono text-indigo-400 uppercase">Normalization</div>
                      <div className="text-xs font-bold text-zinc-200">nn.BatchNorm1d({hiddenFeatures})</div>
                      <div className="text-[10px] text-zinc-400">
                        Learnable γ & β: {bnParams} params
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-indigo-300">
                        [{batchSize}, {hiddenFeatures}]
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500">Zero Mean / Unit Var</div>
                    </div>
                  </div>
                </>
              )}

              <div className="text-center text-zinc-600 font-bold text-xs">↓</div>

              {/* Layer 3: ReLU */}
              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono text-emerald-400 uppercase">Activation</div>
                  <div className="text-xs font-bold text-zinc-200">nn.ReLU()</div>
                  <div className="text-[10px] text-zinc-400">Non-linear elementwise max(0, x) (0 params)</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-emerald-300">
                    [{batchSize}, {hiddenFeatures}]
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500">Non-linearity</div>
                </div>
              </div>

              {useDropout && (
                <>
                  <div className="text-center text-zinc-600 font-bold text-xs">↓</div>
                  <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-mono text-amber-400 uppercase">Regularization</div>
                      <div className="text-xs font-bold text-zinc-200">nn.Dropout(p=0.25)</div>
                      <div className="text-[10px] text-zinc-400">Randomly zeros 25% activations in training</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-amber-300">
                        [{batchSize}, {hiddenFeatures}]
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500">Stochastic Mask</div>
                    </div>
                  </div>
                </>
              )}

              <div className="text-center text-zinc-600 font-bold text-xs">↓</div>

              {/* Layer 5: nn.Linear Output */}
              <div className="p-3 bg-rose-950/20 border border-rose-900/40 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono text-rose-400 uppercase">Linear Output Head</div>
                  <div className="text-xs font-bold text-zinc-200">nn.Linear({hiddenFeatures}, {numClasses})</div>
                  <div className="text-[10px] text-zinc-400">
                    Params: {hiddenFeatures} × {numClasses} + {numClasses} = {linear2Params.toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-rose-300">
                    [{batchSize}, {numClasses}]
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500">Classification Logits</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Dimension & Architecture Controls */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 bg-surface-panel border border-white/[0.07] rounded-xl space-y-4">
              <div className="text-xs font-bold text-zinc-200 flex items-center gap-1.5 pb-2 border-b border-surface-border">
                <Sliders className="w-3.5 h-3.5 text-rose-400" />
                <span>Tensor & Layer Parameters</span>
              </div>

              {/* Batch Size */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Batch Size (B)</span>
                  <span className="font-mono text-zinc-200 font-bold">{batchSize}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[8, 16, 32, 64].map((b) => (
                    <button
                      key={b}
                      onClick={() => setBatchSize(b)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${
                        batchSize === b
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                          : 'bg-surface-elevated border-surface-border text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* In Features */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Input Dimension (In)</span>
                  <span className="font-mono text-zinc-200 font-bold">{inFeatures}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[64, 128, 256, 784].map((dim) => (
                    <button
                      key={dim}
                      onClick={() => setInFeatures(dim)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${
                        inFeatures === dim
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                          : 'bg-surface-elevated border-surface-border text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {dim}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hidden Dim */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Hidden Layer Dimension (H)</span>
                  <span className="font-mono text-zinc-200 font-bold">{hiddenFeatures}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[64, 128, 256, 512].map((dim) => (
                    <button
                      key={dim}
                      onClick={() => setHiddenFeatures(dim)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${
                        hiddenFeatures === dim
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                          : 'bg-surface-elevated border-surface-border text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {dim}
                    </button>
                  ))}
                </div>
              </div>

              {/* Num Classes */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Target Classes (Out)</span>
                  <span className="font-mono text-zinc-200 font-bold">{numClasses}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[2, 10, 100].map((cls) => (
                    <button
                      key={cls}
                      onClick={() => setNumClasses(cls)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${
                        numClasses === cls
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                          : 'bg-surface-elevated border-surface-border text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {cls}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2 pt-2 border-t border-surface-border">
                <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useBatchNorm}
                    onChange={(e) => setUseBatchNorm(e.target.checked)}
                    className="rounded accent-rose-500"
                  />
                  <span>Include nn.BatchNorm1d</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useDropout}
                    onChange={(e) => setUseDropout(e.target.checked)}
                    className="rounded accent-rose-500"
                  />
                  <span>Include nn.Dropout(p=0.25)</span>
                </label>
              </div>
            </div>

            {/* Generated PyTorch Module Snippet */}
            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-semibold text-rose-400">
                  PyTorch nn.Module Implementation
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedNNCode);
                    setCopiedNNCode(true);
                    setTimeout(() => setCopiedNNCode(false), 2000);
                  }}
                  className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-200 transition"
                >
                  {copiedNNCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedNNCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="text-[11px] font-mono text-zinc-300 overflow-x-auto max-h-56 custom-scrollbar whitespace-pre">
                {generatedNNCode}
              </pre>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default InteractiveAutogradVisualizer;

