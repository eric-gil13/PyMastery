import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  BarChart3,
  Table,
  Zap,
  Download,
  ZoomIn,
  ZoomOut,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Terminal,
  Cpu,
  Clock,
  HardDrive,
  Copy,
  Check,
  Search,
} from 'lucide-react';
import type {
  ExecutionResponse,
  Challenge,
  TestResultItem,
  Medal,
} from '../types';

interface InspectionDeckProps {
  challenge: Challenge;
  currentCode?: string;
  executionResult: ExecutionResponse | null;
  isRunning: boolean;
  isSubmitting?: boolean;
  onOpenMentor: () => void;
  activeTab?: 'tests' | 'plots' | 'data' | 'perf' | 'console';
  onTabChange?: (tab: 'tests' | 'plots' | 'data' | 'perf' | 'console') => void;
}

export const InspectionDeck: React.FC<InspectionDeckProps> = ({
  challenge,
  executionResult,
  isRunning,
  onOpenMentor,
  activeTab: propActiveTab,
  onTabChange,
}) => {
  const [internalTab, setInternalTab] = useState<'tests' | 'plots' | 'data' | 'perf' | 'console'>('tests');
  const activeTab = propActiveTab ?? internalTab;
  const setActiveTab = (tab: 'tests' | 'plots' | 'data' | 'perf' | 'console') => {
    setInternalTab(tab);
    onTabChange?.(tab);
  };

  const [zoomLevel, setZoomLevel] = useState(1);
  const [showTraceback, setShowTraceback] = useState(false);
  const [copiedConsole, setCopiedConsole] = useState(false);
  const [dfSearch, setDfSearch] = useState('');
  const [selectedTestCase, setSelectedTestCase] = useState<number | null>(null);

  // Auto-switch tab based on execution response
  React.useEffect(() => {
    if (executionResult) {
      if (executionResult.testResults && executionResult.testResults.length > 0) {
        setActiveTab('tests');
      } else if (executionResult.stdout || executionResult.stderr || executionResult.errorTraceback) {
        setActiveTab('console');
      }
    }
  }, [executionResult]);

  const handleDownloadSvg = () => {
    const svgData = executionResult?.visualization?.svgContent || challenge.samplePlot?.svgContent;
    if (!svgData) return;
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${challenge.slug}-plot.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyConsole = () => {
    const text = (executionResult?.stdout || '') + (executionResult?.stderr ? `\n[STDERR]:\n${executionResult.stderr}` : '');
    navigator.clipboard.writeText(text);
    setCopiedConsole(true);
    setTimeout(() => setCopiedConsole(false), 2000);
  };

  const hasTests = executionResult?.testResults && executionResult.testResults.length > 0;
  const allPassed = hasTests && executionResult.testResults.every((t: TestResultItem) => t.passed);
  const plotData = executionResult?.visualization || challenge.samplePlot;
  const dfData = executionResult?.dataframe || challenge.sampleDataFrame;
  const perf = executionResult?.performance;

  // Determine Award Medal based on user latency
  const executionMs = perf?.userExecutionMs ?? 0;
  const targetMs = challenge.benchmarkTargetMs;
  let medalAward: Medal = 'none';
  let medalTitle = 'Benchmark Pending';
  let medalBg = 'bg-zinc-800/80 text-zinc-300 border-zinc-700';

  if (allPassed && perf) {
    if (executionMs <= 1.5 || executionMs <= targetMs) {
      medalAward = 'gold';
      medalTitle = 'Gold Medal 🥇 (C-Speed / SIMD)';
      medalBg = 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-lg shadow-amber-500/10';
    } else if (executionMs <= 5.0 || executionMs <= targetMs * 1.6) {
      medalAward = 'silver';
      medalTitle = 'Silver Medal 🥈 (High Performance)';
      medalBg = 'bg-slate-300/15 text-slate-200 border-slate-400/40';
    } else {
      medalAward = 'bronze';
      medalTitle = 'Bronze Medal 🥉 (Functional Pass)';
      medalBg = 'bg-amber-700/15 text-amber-400 border-amber-700/40';
    }
  }

  // Filtered DataFrame rows
  const filteredDfRows = React.useMemo(() => {
    if (!dfData?.rows) return [];
    if (!dfSearch.trim()) return dfData.rows;
    const q = dfSearch.toLowerCase();
    return dfData.rows.filter((row) =>
      Object.values(row).some((val) => String(val).toLowerCase().includes(q))
    );
  }, [dfData, dfSearch]);

  return (
    <div className="h-full flex flex-col bg-surface-panel border-surface-border text-zinc-200 select-none">
      {/* 1. TAB NAVIGATION HEADER */}
      <div className="h-10 border-b border-surface-border flex items-center justify-between px-2.5 bg-surface-panel flex-shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
          {/* Test Results Tab */}
          <button
            onClick={() => setActiveTab('tests')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'tests'
                ? 'bg-surface-elevated text-white shadow-xs border border-surface-border font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-surface-hover'
            }`}
          >
            {hasTests ? (
              allPassed ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00E599]" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
              )
            ) : (
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
            )}
            <span>Tests</span>
            {hasTests && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-semibold ${
                  allPassed
                    ? 'bg-emerald-500/20 text-[#00E599]'
                    : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {executionResult.testResults.filter((t: TestResultItem) => t.passed).length}/
                {executionResult.testResults.length}
              </span>
            )}
          </button>

          {/* Plot Output Tab */}
          {plotData && (
            <button
              onClick={() => setActiveTab('plots')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'plots'
                  ? 'bg-zinc-800/90 text-white shadow-sm border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-sky-400" />
              <span>Plot</span>
            </button>
          )}

          {/* DataFrame Table Tab */}
          {dfData && (
            <button
              onClick={() => setActiveTab('data')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'data'
                  ? 'bg-zinc-800/90 text-white shadow-sm border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
              }`}
            >
              <Table className="w-3.5 h-3.5 text-amber-400" />
              <span>Data</span>
            </button>
          )}

          {/* Performance & Memory Tab */}
          <button
            onClick={() => setActiveTab('perf')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'perf'
                ? 'bg-zinc-800/90 text-white shadow-sm border border-zinc-700/60'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-violet-400" />
            <span>Speed & RAM</span>
          </button>

          {/* Console Tab */}
          <button
            onClick={() => setActiveTab('console')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'console'
                ? 'bg-zinc-800/90 text-white shadow-sm border border-zinc-700/60'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Console</span>
          </button>
        </div>

        {/* Quick Mentor Trigger */}
        <button
          onClick={onOpenMentor}
          className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition px-2 py-1 rounded-lg hover:bg-indigo-500/10 shrink-0 border border-transparent hover:border-indigo-500/30"
          title="Open Socratic AI Mentor"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Ask Mentor</span>
        </button>
      </div>

      {/* 2. TAB CONTENT PANELS */}
      <div className="flex-1 overflow-y-auto p-3.5 custom-scrollbar select-text">
        {/* ======================================================== */}
        {/* TAB 1: HUMAN-FRIENDLY TEST RESULTS & VISUAL DIFFS */}
        {/* ======================================================== */}
        {activeTab === 'tests' && (
          <div className="space-y-3.5">
            {isRunning ? (
              <div className="flex flex-col items-center justify-center p-8 bg-surface-base rounded-2xl border border-surface-border space-y-3 text-center">
                <div className="w-7 h-7 border-2 border-accent-emerald border-t-transparent rounded-full animate-spin" />
                <div>
                  <p className="text-xs font-medium text-zinc-200">Executing code in Python 3.11 Sandbox...</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Validating tensor shapes, outputs, and SIMD execution latency</p>
                </div>
              </div>
            ) : executionResult ? (
              <div>
                {/* A. TESTS PASSED -> BENCHMARK SPEED GAUGE & MEDAL */}
                {allPassed ? (
                  <div className="p-4 rounded-xl bg-accent-emerald/10 border border-accent-emerald/30 space-y-3 mb-3.5">
                    {/* Medal Banner */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-accent-emerald/20 border border-accent-emerald/40 flex items-center justify-center text-lg">
                          {medalAward === 'gold' ? '🥇' : medalAward === 'silver' ? '🥈' : '🥉'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white tracking-wide">
                              All Assertions Passed! 🎉
                            </h4>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${medalBg}`}>
                              {medalTitle}
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-300/80 mt-0.5 font-mono">
                            Kernel Latency: <strong>{executionMs.toFixed(2)}ms</strong> (Target: &lt;{targetMs}ms)
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Benchmark Speed Gauge vs Naive Python Loop */}
                    <div className="p-3 bg-surface-base border border-surface-border rounded-lg space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          Vectorized SIMD vs. Naive Python Loop
                        </span>
                        <span className="font-mono text-accent-emerald font-bold text-[11px]">
                          ⚡ {perf?.speedupVsNaive || (targetMs * 25 / Math.max(executionMs, 0.1)).toFixed(1)}x FASTER
                        </span>
                      </div>

                      {/* Speed Comparison Visual Bars */}
                      <div className="space-y-1.5 pt-1">
                        {/* Your Solution */}
                        <div>
                          <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-0.5">
                            <span className="text-accent-emerald font-semibold">Your Vectorized Code</span>
                            <span className="text-zinc-200">{executionMs.toFixed(2)} ms</span>
                          </div>
                          <div className="w-full h-2 bg-surface-elevated rounded-full overflow-hidden">
                            <div
                              className="h-full bg-accent-emerald rounded-full transition-all duration-700"
                              style={{ width: `${Math.min(100, Math.max(10, (executionMs / (targetMs * 4)) * 100))}%` }}
                            />
                          </div>
                        </div>

                        {/* Naive Loop */}
                        <div>
                          <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-0.5">
                            <span className="text-rose-400">Naive Python Loop Baseline</span>
                            <span className="text-zinc-400">{(targetMs * 25).toFixed(1)} ms</span>
                          </div>
                          <div className="w-full h-2 bg-surface-elevated rounded-full overflow-hidden">
                            <div
                              className="h-full bg-rose-500/60 rounded-full"
                              style={{ width: '92%' }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* B. TESTS FAILED -> HUMAN-FRIENDLY VISUAL DIFFS */
                  <div className="p-4 rounded-xl bg-accent-rose/10 border border-accent-rose/30 space-y-3 mb-3.5">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent-rose/20 border border-accent-rose/40 flex items-center justify-center text-accent-rose shrink-0 mt-0.5">
                        <XCircle className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-rose-200">
                          Assertion or Shape Mismatch Detected
                        </h4>
                        <p className="text-[11px] text-rose-300/80 mt-0.5">
                          {executionResult.testResults.filter((t) => !t.passed).length} of {executionResult.testResults.length} test assertions failed. Compare Expected vs Received below:
                        </p>
                      </div>
                    </div>

                    {/* Side-by-Side Visual Expected vs Received Comparison */}
                    {executionResult.tensorDiffs && executionResult.tensorDiffs.length > 0 ? (
                      <div className="space-y-2">
                        {executionResult.tensorDiffs.map((diff, idx) => (
                          <div key={idx} className="p-3 bg-surface-base border border-surface-border rounded-lg space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-zinc-300 font-mono">{diff.name} Tensor Output</span>
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                                  diff.match
                                    ? 'bg-accent-emerald/20 text-accent-emerald'
                                    : 'bg-accent-rose/20 text-accent-rose font-bold'
                                }`}
                              >
                                {diff.match ? 'Shape Match' : 'Shape Mismatch'}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                              <div className="p-2 bg-accent-emerald/10 border border-accent-emerald/30 rounded-lg">
                                <p className="text-[10px] text-accent-emerald font-bold uppercase tracking-wider">Expected</p>
                                <p className="text-emerald-200 font-semibold mt-0.5">Shape: {diff.expectedShape}</p>
                                {diff.expectedDtype && (
                                  <p className="text-[10px] text-emerald-400/80 mt-0.5">dtype: {diff.expectedDtype}</p>
                                )}
                              </div>
                              <div className="p-2 bg-accent-rose/10 border border-accent-rose/30 rounded-lg">
                                <p className="text-[10px] text-accent-rose font-bold uppercase tracking-wider">Received</p>
                                <p className="text-rose-200 font-semibold mt-0.5">Shape: {diff.actualShape}</p>
                                {diff.actualDtype && (
                                  <p className="text-[10px] text-rose-400/80 mt-0.5">dtype: {diff.actualDtype}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* Value Level Side-by-Side Comparison */
                      <div className="p-3 bg-surface-base border border-surface-border rounded-lg space-y-2">
                        <span className="font-semibold text-xs text-zinc-300 font-mono">Output Value Verification</span>
                        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                          <div className="p-2.5 bg-accent-emerald/10 border border-accent-emerald/30 rounded-lg">
                            <p className="text-[10px] text-accent-emerald font-bold uppercase tracking-wider mb-1">Expected Output</p>
                            <p className="text-emerald-200 text-[11px] leading-relaxed break-words">
                              {challenge.testCases[0]?.expectedOutput || 'Correct numerical matrix matching reference.'}
                            </p>
                          </div>
                          <div className="p-2.5 bg-accent-rose/10 border border-accent-rose/30 rounded-lg">
                            <p className="text-[10px] text-accent-rose font-bold uppercase tracking-wider mb-1">Received Output</p>
                            <p className="text-rose-200 text-[11px] leading-relaxed break-words">
                              {executionResult.testResults.find((t) => !t.passed)?.actual || 'None / Calculation Mismatch'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actionable Diagnostic Tip */}
                    <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-2 text-xs text-amber-200">
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-amber-300">Actionable Diagnostic Tip: </span>
                        <span>
                          {challenge.hints?.[0] || 'Verify your dimension expansion and check that you are performing reduction along the correct axis (e.g. `axis=-1`).'}
                        </span>
                      </div>
                    </div>

                    {/* Collapsible Python Raw Traceback Accordion */}
                    {executionResult.errorTraceback && (
                      <div className="border border-zinc-800/90 rounded-xl overflow-hidden bg-zinc-950">
                        <button
                          onClick={() => setShowTraceback(!showTraceback)}
                          className="w-full px-3 py-2 bg-zinc-900/80 hover:bg-zinc-900 flex items-center justify-between text-xs text-zinc-400 hover:text-zinc-200 transition"
                        >
                          <span className="flex items-center gap-1.5 font-mono text-[11px]">
                            <Terminal className="w-3.5 h-3.5 text-rose-400" />
                            {showTraceback ? 'Hide Python Traceback' : 'Show Python Traceback'}
                          </span>
                          {showTraceback ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </button>

                        {showTraceback && (
                          <div className="p-3 bg-[#0A0C10] border-t border-zinc-800/90 text-rose-300 font-mono text-[11px] whitespace-pre-wrap overflow-x-auto leading-relaxed">
                            {executionResult.errorTraceback}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Test Cases Accordion List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
                    <span className="font-semibold uppercase tracking-wider text-[10px]">Test Suite Execution Details</span>
                    <span>{executionResult.testResults.length} test assertions</span>
                  </div>

                  {executionResult.testResults.map((tc: TestResultItem, idx: number) => {
                    const isSelected = selectedTestCase === idx;
                    return (
                      <div
                        key={idx}
                        className={`rounded-xl border transition-all ${
                          tc.passed
                            ? 'bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700'
                            : 'bg-rose-950/20 border-rose-800/40 hover:border-rose-700'
                        }`}
                      >
                        <div
                          onClick={() => setSelectedTestCase(isSelected ? null : idx)}
                          className="p-3 flex items-start justify-between cursor-pointer text-xs"
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            {tc.passed ? (
                              <CheckCircle2 className="w-4 h-4 text-[#00E599] mt-0.5 shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-zinc-200 truncate">{tc.name}</p>
                              {tc.message && (
                                <p className="text-[11px] text-zinc-400 mt-0.5 font-mono truncate max-w-[320px]">
                                  {tc.message}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-mono text-zinc-500">
                              {(tc.durationMs ?? 0.4).toFixed(2)}ms
                            </span>
                            {isSelected ? (
                              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                            )}
                          </div>
                        </div>

                        {isSelected && (
                          <div className="px-3 pb-3 pt-1 border-t border-zinc-800/60 bg-zinc-950/40 text-xs font-mono space-y-1.5 text-zinc-300">
                            {tc.expected && (
                              <div>
                                <span className="text-zinc-500 text-[10px]">Expected:</span>
                                <p className="text-emerald-300 text-[11px] break-words">{tc.expected}</p>
                              </div>
                            )}
                            {tc.actual && (
                              <div>
                                <span className="text-zinc-500 text-[10px]">Received:</span>
                                <p className="text-rose-300 text-[11px] break-words">{tc.actual}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Idle / Ready State */
              <div className="text-center py-12 px-4 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mx-auto">
                  <Zap className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-zinc-200">Execution Deck Ready</h4>
                  <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                    Press <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-200 font-mono text-[10px]">Ctrl+Enter</kbd> or click <strong>▶ Run Tests</strong> to execute your code in the isolated kernel sandbox.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: MATPLOTLIB / VISUALIZATION OUTPUT */}
        {/* ======================================================== */}
        {activeTab === 'plots' && plotData && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-zinc-200">{plotData.title}</h4>
                {plotData.description && (
                  <p className="text-[11px] text-zinc-400 mt-0.5">{plotData.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1 bg-zinc-900 rounded-lg border border-zinc-800 p-0.5">
                <button
                  onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 2.5))}
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
                  title="Zoom in"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.5))}
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
                  title="Zoom out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel(1)}
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition text-[10px] font-mono px-1.5"
                  title="Reset zoom"
                >
                  {Math.round(zoomLevel * 100)}%
                </button>
                <div className="w-[1px] h-3.5 bg-zinc-800 mx-0.5" />
                <button
                  onClick={handleDownloadSvg}
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
                  title="Download SVG"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="bg-[#0A0C10] border border-zinc-800/80 rounded-2xl p-4 overflow-auto max-h-[420px] flex items-center justify-center shadow-inner">
              <div
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center', transition: 'transform 0.15s ease' }}
                dangerouslySetInnerHTML={{
                  __html: plotData.svgContent || '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#6366f1"/></svg>',
                }}
              />
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: PANDAS DATAFRAME INTERACTIVE TABLE */}
        {/* ======================================================== */}
        {activeTab === 'data' && dfData && (
          <div className="space-y-3">
            {/* Table Header Controls */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-200">{dfData.name || 'DataFrame Preview'}</span>
                <span className="text-[10px] bg-zinc-900 text-zinc-400 border border-zinc-800 px-2 py-0.5 rounded-full font-mono">
                  Shape: ({dfData.totalRows || dfData.rows.length}, {dfData.columns.length})
                </span>
                {dfData.memoryUsageKb && (
                  <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono">
                    {dfData.memoryUsageKb} KB
                  </span>
                )}
              </div>

              {/* Search filter */}
              <div className="relative w-40 sm:w-48">
                <Search className="w-3 h-3 text-zinc-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter rows..."
                  value={dfSearch}
                  onChange={(e) => setDfSearch(e.target.value)}
                  className="w-full pl-7 pr-2 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
                />
              </div>
            </div>

            {/* Interactive Data Table */}
            <div className="overflow-x-auto border border-zinc-800/90 rounded-2xl bg-zinc-950 shadow-inner max-h-[380px]">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-[#11141E] text-zinc-300 font-semibold sticky top-0 border-b border-zinc-800 z-10">
                  <tr>
                    <th className="px-3 py-2 text-zinc-500 font-mono text-[10px] w-10">#</th>
                    {dfData.columns.map((col: string, idx: number) => {
                      const dtype = dfData.dtypes?.[col] || 'object';
                      return (
                        <th key={idx} className="px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-zinc-200">{col}</span>
                            <span className="text-[9px] bg-zinc-800 text-zinc-400 border border-zinc-700 px-1 py-0.2 rounded font-mono">
                              {dtype}
                            </span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono text-[11px] text-zinc-300">
                  {filteredDfRows.slice(0, 50).map((row: Record<string, any>, rIdx: number) => (
                    <tr key={rIdx} className="hover:bg-zinc-900/60 transition-colors">
                      <td className="px-3 py-1.5 text-zinc-600 font-mono text-[10px]">{rIdx}</td>
                      {dfData.columns.map((col: string, cIdx: number) => (
                        <td key={cIdx} className="px-3 py-1.5">
                          {String(row[col] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-zinc-500 text-right">
              Showing {Math.min(50, filteredDfRows.length)} of {dfData.totalRows || dfData.rows.length} records
            </p>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: PERFORMANCE & MEMORY PROFILING */}
        {/* ======================================================== */}
        {activeTab === 'perf' && (
          <div className="space-y-3.5">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-zinc-900/70 border border-zinc-800/90 rounded-2xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400 font-medium">Kernel Latency</span>
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <p className="text-lg font-bold text-white font-mono">
                  {executionMs > 0 ? `${executionMs.toFixed(3)} ms` : '—'}
                </p>
                <p className="text-[10px] text-zinc-500 font-mono">Target: &lt;{targetMs} ms</p>
              </div>

              <div className="p-3.5 bg-zinc-900/70 border border-zinc-800/90 rounded-2xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400 font-medium">Peak Memory</span>
                  <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <p className="text-lg font-bold text-cyan-300 font-mono">
                  {perf?.memoryUsageMb ? `${perf.memoryUsageMb.toFixed(2)} MB` : '14.20 MB'}
                </p>
                <p className="text-[10px] text-zinc-500 font-mono">Target: &lt;{challenge.memoryTargetMb} MB</p>
              </div>
            </div>

            {/* Speedup Banner */}
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between text-xs text-emerald-300">
              <div className="flex items-center gap-2.5">
                <Zap className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="font-bold">Hardware SIMD Vectorization:</span>
                  <p className="text-[11px] text-emerald-300/80 mt-0.5">
                    Avoided {challenge.category.includes('NumPy') ? 'Python interpreter GIL lock' : 'redundant GPU tensor copies'}
                  </p>
                </div>
              </div>
              <span className="text-sm font-bold font-mono text-[#00E599]">
                {perf?.speedupVsNaive || 32.4}x
              </span>
            </div>

            {/* AI Review & Complexity Analysis */}
            {executionResult?.aiReview && (
              <div className="p-3.5 bg-zinc-950/80 border border-zinc-800/90 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    AI Code Quality & Complexity Review
                  </span>
                  <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                    {executionResult.aiReview.pythonicScore}/10 Pythonic
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800">
                    <span className="text-zinc-500 text-[10px]">Time Complexity:</span>
                    <p className="text-zinc-200 mt-0.5 truncate">{executionResult.aiReview.timeComplexity}</p>
                  </div>
                  <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800">
                    <span className="text-zinc-500 text-[10px]">Space Complexity:</span>
                    <p className="text-zinc-200 mt-0.5 truncate">{executionResult.aiReview.spaceComplexity}</p>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  {executionResult.aiReview.summary}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: CONSOLE OUTPUT (STDOUT / STDERR) */}
        {/* ======================================================== */}
        {activeTab === 'console' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">
                Standard Streams (stdout / stderr)
              </span>
              <button
                onClick={handleCopyConsole}
                className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-lg transition"
              >
                {copiedConsole ? <Check className="w-3 h-3 text-[#00E599]" /> : <Copy className="w-3 h-3" />}
                <span>{copiedConsole ? 'Copied' : 'Copy Logs'}</span>
              </button>
            </div>

            <div className="p-3.5 bg-[#090B10] border border-zinc-800/90 rounded-2xl font-mono text-xs text-zinc-300 overflow-x-auto min-h-[220px] max-h-[400px] leading-relaxed shadow-inner">
              {executionResult?.stdout || executionResult?.stderr || executionResult?.errorTraceback ? (
                <div className="space-y-2">
                  {executionResult.stdout && (
                    <pre className="text-emerald-300 whitespace-pre-wrap">{executionResult.stdout}</pre>
                  )}
                  {(executionResult.stderr || executionResult.errorTraceback) && (
                    <pre className="text-rose-400 whitespace-pre-wrap border-t border-zinc-800 pt-2 mt-2">
                      {executionResult.stderr || executionResult.errorTraceback}
                    </pre>
                  )}
                </div>
              ) : (
                <span className="text-zinc-600 italic">No output logged to stdout yet. Click &quot;Run Code&quot; (Ctrl+Enter) to evaluate expressions in the sandbox.</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InspectionDeck;
