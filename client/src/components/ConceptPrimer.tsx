import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Sparkles,
  BookOpen,
  Cpu,
  CheckCircle,
  Copy,
  Check,
  Zap,
  HardDrive,
  Info,
  Lightbulb,
  FileCode2,
  AlertTriangle,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';
import type { ConceptPrimerData, Challenge } from '../types';
import MathRenderer from './MathRenderer';

interface ConceptPrimerProps {
  isOpen: boolean;
  onClose: () => void;
  primerData: ConceptPrimerData;
  challenge?: Challenge;
}

export const ConceptPrimer: React.FC<ConceptPrimerProps> = ({
  isOpen,
  onClose,
  primerData,
  challenge,
}) => {
  const [activeTier, setActiveTier] = useState<'all' | 't1' | 't2' | 't3' | 't4'>('all');
  const [copiedNaive, setCopiedNaive] = useState(false);
  const [copiedIdiomatic, setCopiedIdiomatic] = useState(false);
  const [copiedInput, setCopiedInput] = useState(false);
  const [revealedHints, setRevealedHints] = useState<number>(0);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset hint reveals on modal open / primerData change
  useEffect(() => {
    setRevealedHints(0);
  }, [primerData, isOpen]);

  // Real-world analogy resolver
  const realWorldAnalogy = useMemo(() => {
    if (primerData.analogy) return primerData.analogy;
    const title = (primerData.title || '').toLowerCase();
    const overview = (primerData.overview || '').toLowerCase();

    if (title.includes('distance') || overview.includes('euclidean') || title.includes('numpy')) {
      return 'Think of computing a city-wide flight matrix: rather than dispatching a courier to measure every pair individually, a satellite computes the entire coordinate distance grid in a single hardware sweep.';
    }
    if (title.includes('strid') || title.includes('window') || overview.includes('strides')) {
      return 'Think of a magnifying glass scanning across a film strip: you do not print duplicate film reels; you simply slide your lens over the existing film in zero time with zero extra memory.';
    }
    if (title.includes('pandas') || overview.includes('dataframe') || overview.includes('blockmanager')) {
      return 'Think of an automated package sorting center: packages are grouped into uniform color bins first, processed in bulk assembly lines, and stamped simultaneously.';
    }
    if (title.includes('autograd') || overview.includes('gradient') || overview.includes('graph')) {
      return 'Think of dropping GPS markers during a hike: to return to the trailhead, you simply walk backward following the recorded topological graph in reverse order.';
    }
    if (title.includes('attention') || overview.includes('transformer') || overview.includes('softmax')) {
      return 'Think of a research librarian matching keywords: query tokens calculate relevance scores against index keys to fetch weighted summary chapters.';
    }
    return 'Think of transforming single-item iterative loops into an assembly-line batch transform running directly in compiled CPU SIMD registers.';
  }, [primerData]);

  // Starter Input snippet generator
  const starterInputSnippet = useMemo(() => {
    if (primerData.starterInputSnippet) return primerData.starterInputSnippet;
    if (challenge?.starterCode) {
      const title = primerData.title.toLowerCase();
      if (title.includes('distance')) {
        return `# Starter Test Input (N=1000, M=1000, D=64)
import numpy as np

A = np.random.randn(1000, 64)
B = np.random.randn(1000, 64)
# Expected Return: (1000, 1000) float64 Euclidean Distance Matrix`;
      }
      if (title.includes('strid') || title.includes('window')) {
        return `# Starter Test Input (Zero-Copy Strides)
import numpy as np

arr = np.arange(16, dtype=np.float64).reshape(4, 4)
window_shape = (2, 2)
# Expected Return: 4D view of shape (3, 3, 2, 2)`;
      }
    }
    return `# Starter Test Verification Input
import numpy as np

sample_data = np.random.randn(100, 32)`;
  }, [primerData, challenge]);

  // Pitfalls generator
  const pitfalls = useMemo(() => {
    if (primerData.pitfalls && primerData.pitfalls.length > 0) {
      return primerData.pitfalls;
    }
    return [
      '❌ Avoid Python for-loops (`for i in range(N)`): Triggers dynamic bytecode dispatch on every element and disables hardware vectorization.',
      '❌ Avoid intermediate memory copies: Churning heap allocations stalls the CPU with garbage collection pauses.',
      '❌ Numerical Precision: Always guard against floating-point epsilon underflow before taking square roots or logarithms.',
    ];
  }, [primerData]);

  if (!isOpen) return null;

  const copyCode = (code: string, isNaive: boolean) => {
    navigator.clipboard.writeText(code);
    if (isNaive) {
      setCopiedNaive(true);
      setTimeout(() => setCopiedNaive(false), 2000);
    } else {
      setCopiedIdiomatic(true);
      setTimeout(() => setCopiedIdiomatic(false), 2000);
    }
  };

  const copyStarterInput = () => {
    navigator.clipboard.writeText(starterInputSnippet);
    setCopiedInput(true);
    setTimeout(() => setCopiedInput(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-[#101014] border border-zinc-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-[#14141a]/95">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight truncate">
                  {primerData.title}
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 rounded flex-shrink-0">
                  4-Tier Intuition
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 truncate">{primerData.subtitle}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors flex-shrink-0 ml-2"
            title="Close Primer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4-Tier Navigation Bar */}
        <div className="flex border-b border-zinc-800 bg-[#0c0c0f] px-4 gap-2 sm:gap-4 overflow-x-auto select-none">
          <button
            onClick={() => setActiveTier('all')}
            className={`py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTier === 'all'
                ? 'border-indigo-500 text-indigo-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Full Story (All 4 Tiers)</span>
          </button>

          <button
            onClick={() => setActiveTier('t1')}
            className={`py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTier === 't1'
                ? 'border-indigo-400 text-indigo-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5 text-indigo-400" />
            <span>1. Mental Model</span>
          </button>

          <button
            onClick={() => setActiveTier('t2')}
            className={`py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTier === 't2'
                ? 'border-cyan-500 text-cyan-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>2. I/O Contract</span>
          </button>

          <button
            onClick={() => setActiveTier('t3')}
            className={`py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTier === 't3'
                ? 'border-amber-500 text-amber-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>3. Pitfalls & Idioms</span>
          </button>

          <button
            onClick={() => setActiveTier('t4')}
            className={`py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTier === 't4'
                ? 'border-emerald-500 text-emerald-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>4. Systems Mastery</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6 text-sm text-zinc-300 custom-scrollbar">
          
          {/* ======================================================= */}
          {/* TIER 1: 5-Second Mental Model                           */}
          {/* ======================================================= */}
          {(activeTier === 'all' || activeTier === 't1') && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                  <Lightbulb className="w-4 h-4" />
                  <span>Tier 1: 5-Second Mental Model (For Everyone)</span>
                </div>
                <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  Zero Jargon
                </span>
              </div>

              {/* Core Concept Callout */}
              <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 leading-relaxed text-xs sm:text-sm text-zinc-200 flex gap-3">
                <Info className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white">The Core Intuition: </span>
                  {primerData.overview}
                </div>
              </div>

              {/* Real-World Analogy */}
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-700/30 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Real-World Analogy:</span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-300 italic leading-relaxed">
                  "{realWorldAnalogy}"
                </p>
              </div>

              {/* Visual Diagram */}
              {primerData.memoryLayout.diagramAscii && (
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                    <span>Visual Transformation & Memory Flow:</span>
                    <span className="text-indigo-400">Contiguous Buffer</span>
                  </div>
                  <pre className="p-3 rounded-lg bg-[#0a0c10] border border-zinc-800/80 font-mono text-xs text-cyan-300 overflow-x-auto leading-relaxed">
                    {primerData.memoryLayout.diagramAscii}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* ======================================================= */}
          {/* TIER 2: Expected I/O Contract & Data Signatures         */}
          {/* ======================================================= */}
          {(activeTier === 'all' || activeTier === 't2') && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                  <FileCode2 className="w-4 h-4" />
                  <span>Tier 2: Expected I/O Contract & Test Harness</span>
                </div>
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  Strict Shapes
                </span>
              </div>

              {/* Starter Input Box with Copy Button */}
              <div className="rounded-xl border border-cyan-900/40 bg-zinc-950/80 overflow-hidden">
                <div className="px-4 py-2.5 bg-cyan-950/30 border-b border-cyan-900/40 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-300">
                    Starter Input Data & Shape Contract
                  </span>
                  <button
                    onClick={copyStarterInput}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/70 border border-cyan-700/40 text-xs text-cyan-200 transition"
                  >
                    {copiedInput ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>📋 Copy Starter Input</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3.5 text-xs font-mono text-zinc-300 overflow-x-auto leading-relaxed bg-[#0b0d12]">
                  <code>{starterInputSnippet}</code>
                </pre>
              </div>

              {/* Invariant Rules */}
              <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 text-xs text-zinc-300 flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <div>
                  <strong className="text-white">Contract Rule: </strong>
                  Ensure all operations preserve matching dimension ranks and avoid unintended type promotion (e.g. float32 &rarr; float64).
                </div>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* TIER 3: Pitfalls & Idiomatic Vectorization              */}
          {/* ======================================================= */}
          {(activeTier === 'all' || activeTier === 't3') && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Tier 3: Common Pitfalls & Idiomatic Solutions</span>
                </div>
                <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Performance & Anti-Patterns
                </span>
              </div>

              {/* Pitfalls Callout */}
              <div className="space-y-2">
                {pitfalls.map((pitfall, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/30 text-xs text-zinc-300 flex items-start gap-2.5 leading-relaxed"
                  >
                    <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    <span>{pitfall}</span>
                  </div>
                ))}
              </div>

              {/* Speedup Badge */}
              {primerData.naiveVsIdiomatic.speedupText && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-600/40 text-emerald-300 text-xs font-mono font-bold w-fit">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span>Benchmark Acceleration: {primerData.naiveVsIdiomatic.speedupText}</span>
                </div>
              )}

              {/* Side-by-Side Naive vs Idiomatic */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Naive Box */}
                <div className="rounded-xl border border-rose-900/50 bg-zinc-950/80 flex flex-col overflow-hidden">
                  <div className="px-3.5 py-2.5 bg-rose-950/30 border-b border-rose-900/40 flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-rose-400">
                      ✗ Naive Anti-Pattern (Slow Loop)
                    </span>
                    <button
                      onClick={() => copyCode(primerData.naiveVsIdiomatic.naiveCode, true)}
                      className="p-1 text-zinc-400 hover:text-white transition-colors"
                      title="Copy code"
                    >
                      {copiedNaive ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <pre className="p-3 text-xs font-mono text-zinc-300 overflow-x-auto leading-relaxed bg-[#0b0d12]">
                    <code>{primerData.naiveVsIdiomatic.naiveCode}</code>
                  </pre>
                  <div className="p-3 border-t border-zinc-800 bg-zinc-900/40 text-xs text-rose-300/80">
                    {primerData.naiveVsIdiomatic.naiveExplanation}
                  </div>
                </div>

                {/* Idiomatic Box */}
                <div className="rounded-xl border border-emerald-800/60 bg-zinc-950/80 flex flex-col overflow-hidden">
                  <div className="px-3.5 py-2.5 bg-emerald-950/30 border-b border-emerald-900/40 flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      ✓ Idiomatic Vectorized / Fused
                    </span>
                    <button
                      onClick={() => copyCode(primerData.naiveVsIdiomatic.idiomaticCode, false)}
                      className="p-1 text-zinc-400 hover:text-white transition-colors"
                      title="Copy code"
                    >
                      {copiedIdiomatic ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <pre className="p-3 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed bg-[#0b0d12]">
                    <code>{primerData.naiveVsIdiomatic.idiomaticCode}</code>
                  </pre>
                  <div className="p-3 border-t border-zinc-800 bg-zinc-900/40 text-xs text-emerald-300/90">
                    {primerData.naiveVsIdiomatic.idiomaticExplanation}
                  </div>
                </div>
              </div>

              {/* Hints Revealer */}
              {challenge?.hints && challenge.hints.length > 0 && (
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3 mt-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
                      <HelpCircle className="w-4 h-4 text-amber-400" />
                      <span>Sequential Progressive Hints</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {revealedHints} / {challenge.hints.length} Revealed
                    </span>
                  </div>

                  {revealedHints > 0 && (
                    <div className="space-y-2">
                      {challenge.hints.slice(0, revealedHints).map((hint: string, idx: number) => (
                        <div
                          key={idx}
                          className="p-2.5 bg-amber-950/20 border border-amber-800/30 rounded-lg text-xs text-amber-200/90 leading-relaxed flex items-start gap-2"
                        >
                          <span className="font-mono text-amber-400 font-bold">{idx + 1}.</span>
                          <span>{hint}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {revealedHints < challenge.hints.length && (
                    <button
                      onClick={() => setRevealedHints((prev) => prev + 1)}
                      className="w-full py-2 px-3 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-2"
                    >
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                      <span>Reveal Hint {revealedHints + 1} of {challenge.hints.length}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ======================================================= */}
          {/* TIER 4: Under the Hood (For Senior Devs / Systems Mastery) */}
          {/* ======================================================= */}
          {(activeTier === 'all' || activeTier === 't4') && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <Cpu className="w-4 h-4" />
                  <span>Tier 4: Systems Mastery & Under the Hood</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  C-Strides & Hardware Lines
                </span>
              </div>

              {/* KaTeX Mathematical Formulations */}
              {primerData.mathFormulas && primerData.mathFormulas.length > 0 && (
                <div className="space-y-3">
                  <div className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span>📐</span>
                    <span>Mathematical Formulations (KaTeX)</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {primerData.mathFormulas.map((formula, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2"
                      >
                        <div className="text-xs font-bold font-mono text-emerald-400 uppercase tracking-wide">
                          {idx + 1}. {formula.title}
                        </div>
                        <div className="py-2.5 px-3 bg-[#0a0c10] rounded-lg border border-zinc-850 flex items-center justify-center overflow-x-auto text-indigo-300">
                          <MathRenderer latex={formula.latex} displayMode={true} />
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          {formula.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Memory Layout & Cache Locality */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">
                    {primerData.memoryLayout.title}
                  </h3>
                </div>
                <p className="text-xs leading-relaxed text-zinc-300">
                  {primerData.memoryLayout.content}
                </p>

                {primerData.memoryLayout.diagramAscii && (
                  <div className="mt-2 p-3 rounded-lg bg-[#0a0c10] border border-zinc-800 font-mono text-xs text-cyan-300 overflow-x-auto">
                    <pre className="leading-relaxed">{primerData.memoryLayout.diagramAscii}</pre>
                  </div>
                )}

                <div className="mt-2 p-3 rounded-lg bg-cyan-950/30 border border-cyan-700/40 text-xs text-cyan-200 font-mono">
                  <span className="font-bold text-cyan-400">Golden Hardware Rule: </span>
                  {primerData.memoryLayout.keyRule}
                </div>
              </div>

              {/* Key Takeaways */}
              {primerData.keyTakeaways && primerData.keyTakeaways.length > 0 && (
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-amber-400" />
                    Architectural Best Practices & Checklist
                  </h3>
                  <ul className="space-y-2 text-xs text-zinc-300">
                    {primerData.keyTakeaways.map((takeaway, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <span className="leading-relaxed">{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-[#121216] flex items-center justify-between text-xs">
          <span className="text-zinc-400">
            Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono">Esc</kbd> to close
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-bold rounded-xl transition shadow-lg shadow-emerald-950/40"
          >
            Ready to Code →
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConceptPrimer;
