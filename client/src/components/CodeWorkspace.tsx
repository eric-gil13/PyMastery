import React, { useState, useRef, useEffect, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import type { Monaco, OnMount } from '@monaco-editor/react';
import {
  Play,
  Zap,
  RotateCcw,
  Eye,
  EyeOff,
  Copy,
  Check,
  CheckCircle2,
  FileCode,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Sparkles,
  AlertCircle,
  X,
} from 'lucide-react';
import type { Challenge } from '../types';

interface CodeWorkspaceProps {
  challenge: Challenge;
  code: string;
  onChangeCode: (code: string) => void;
  onRunCode?: () => void;
  onRun: () => void;
  onSubmit: () => void;
  isRunningCode?: boolean;
  isRunning: boolean;
  isSubmitting: boolean;
  onOpenPrimer: () => void;
  onNextProblem?: () => void;
  hasNextProblem?: boolean;
  testsPassed?: boolean;
}

const CursorPositionIndicator: React.FC<{ editor: any }> = ({ editor }) => {
  const [pos, setPos] = useState({ line: 1, col: 1 });

  useEffect(() => {
    if (!editor) return;
    const disposable = editor.onDidChangeCursorPosition((e: any) => {
      setPos({ line: e.position.lineNumber, col: e.position.column });
    });
    return () => {
      disposable?.dispose?.();
    };
  }, [editor]);

  return (
    <span className="font-mono text-zinc-300">
      Ln {pos.line}, Col {pos.col}
    </span>
  );
};

export const CodeWorkspace: React.FC<CodeWorkspaceProps> = ({
  challenge,
  code,
  onChangeCode,
  onRunCode,
  onRun,
  onSubmit,
  isRunningCode = false,
  isRunning,
  isSubmitting,
  onOpenPrimer,
  onNextProblem,
  hasNextProblem,
  testsPassed,
}) => {
  const [showSolution, setShowSolution] = useState(false);
  const [fontSize, setFontSize] = useState(13);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedSolution, setCopiedSolution] = useState(false);
  const [editorInstance, setEditorInstance] = useState<any>(null);
  const [dismissedSentinel, setDismissedSentinel] = useState<string | null>(null);
  const editorRef = useRef<any>(null);
  const lastEmittedValueRef = useRef<string>((code || '').replace(/\r\n/g, '\n'));

  // Close solution view whenever challenge switches
  useEffect(() => {
    setShowSolution(false);
    setDismissedSentinel(null);
  }, [challenge.id]);

  // Handle Fullscreen ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Real-time Anti-Pattern Sentinel Analysis
  const detectedAntiPattern = useMemo(() => {
    if (!code) return null;

    const category = (challenge.category || '').toLowerCase();
    const title = (challenge.title || '').toLowerCase();
    const isNumPy = category.includes('numpy') || title.includes('numpy') || category.includes('stride') || category.includes('broadcasting') || challenge.id.startsWith('d1');
    const isPandas = category.includes('pandas') || title.includes('pandas') || category.includes('dataframe') || challenge.id.startsWith('d2');
    const isPyTorch = category.includes('torch') || category.includes('autograd') || category.includes('cuda') || challenge.id.startsWith('d3') || challenge.id.startsWith('d4') || challenge.id.startsWith('d5');

    // 1. NumPy: Explicit Python for loops or while loops
    if (isNumPy && (/\bfor\s+\w+\s+in\s+/i.test(code) || /\bwhile\s+/i.test(code))) {
      return {
        id: 'numpy-loop',
        type: 'NumPy Vectorization Alert',
        message: 'Explicit Python loop detected in NumPy exercise. NumPy executes pure array expressions in compiled C/SIMD.',
        suggestion: 'Replace Python iteration with vectorized array broadcasting (e.g., `[:, None]`) or matrix multiplication (`@`) for a 30x–100x speedup.',
        severity: 'warning',
      };
    }

    // 2. Pandas: .apply() or .iterrows() or .itertuples()
    if (isPandas && (code.includes('.apply(') || code.includes('.iterrows(') || code.includes('.itertuples('))) {
      return {
        id: 'pandas-apply',
        type: 'Pandas Performance Trap',
        message: '`.apply()` or row iteration detected in Pandas exercise. `.apply()` runs standard Python loops internally.',
        suggestion: 'Use vectorized Series arithmetic, boolean masking, or NumPy underlying buffer operations (`.values` / `.to_numpy()`) for 10x–50x throughput.',
        severity: 'warning',
      };
    }

    // 3. PyTorch Autograd: .numpy() or .item() inside tensor compute
    if (isPyTorch && (code.includes('.numpy()') || code.includes('.item()') || code.includes('.tolist()'))) {
      if (code.includes('forward(') || code.includes('backward(') || code.includes('def ')) {
        return {
          id: 'torch-sync',
          type: 'PyTorch Graph Break Warning',
          message: 'Synchronous `.numpy()` or `.item()` call detected. This breaks the Autograd computation graph and causes CPU-GPU synchronization stalls.',
          suggestion: 'Maintain pure PyTorch tensor operations (`torch.where`, `torch.matmul`, `torch.exp`) to preserve graph autograd derivatives.',
          severity: 'warning',
        };
      }
    }

    // 4. Pure Python: Mutable default argument trap (def foo(x=[]))
    if (/def\s+\w+\s*\([^)]*=\s*(\[\]|\{\})/i.test(code)) {
      return {
        id: 'py-mutable-default',
        type: 'Python Mutable Default Parameter Alert',
        message: 'Mutable default argument (`[]` or `{}`) detected in function definition. Default arguments are evaluated once at function definition time, not call time.',
        suggestion: 'Use `None` as the default value (e.g. `arg=None`) and initialize inside the function: `if arg is None: arg = []`.',
        severity: 'warning',
      };
    }

    // 5. Pure Python: type(x) == y anti-pattern
    if (/type\s*\([^)]+\)\s*==\s*(list|dict|int|str|float|tuple|set)\b/.test(code)) {
      return {
        id: 'py-type-equality',
        type: 'Python Idiom Warning',
        message: '`type(x) == Type` detected. This prevents subclass polymorphism.',
        suggestion: 'Use idiomatic `isinstance(x, Type)` to correctly support subclasses and Python type hierarchies.',
        severity: 'info',
      };
    }

    return null;
  }, [code, challenge]);

  const showSentinel = detectedAntiPattern && dismissedSentinel !== detectedAntiPattern.id;

  const handleEditorDidMount: OnMount = (editor, monaco: Monaco) => {
    editorRef.current = editor;
    setEditorInstance(editor);

    // Normalize Monaco model line endings to LF explicitly
    const model = editor.getModel();
    if (model) {
      model.setEOL(monaco.editor.EndOfLineSequence.LF);
    }

    // Define Monaco Deep Obsidian Theme
    monaco.editor.defineTheme('deep-obsidian', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '64748B', fontStyle: 'italic' },
        { token: 'keyword', foreground: '38BDF8', fontStyle: 'bold' },
        { token: 'keyword.python', foreground: '38BDF8', fontStyle: 'bold' },
        { token: 'identifier', foreground: 'F8FAFC' },
        { token: 'string', foreground: '86EFAC' },
        { token: 'string.escape', foreground: 'FDE047' },
        { token: 'number', foreground: 'F472B6' },
        { token: 'type', foreground: '93C5FD' },
        { token: 'function', foreground: '34D399' },
        { token: 'delimiter', foreground: '94A3B8' },
        { token: 'operator', foreground: 'F59E0B' },
        { token: 'tag', foreground: '818CF8' },
      ],
      colors: {
        'editor.background': '#090A0F',
        'editor.foreground': '#E2E8F0',
        'editor.lineHighlightBackground': '#131620',
        'editor.lineHighlightBorder': '#00000000',
        'editorCursor.foreground': '#6366F1',
        'editorSelection.background': '#252B42',
        'editorSelection.inactiveBackground': '#1B2030',
        'editorWhitespace.foreground': '#272B38',
        'editorIndentGuide.background': '#1B1E28',
        'editorIndentGuide.activeBackground': '#374151',
        'editorLineNumber.foreground': '#4B5563',
        'editorLineNumber.activeForeground': '#818CF8',
        'editorGutter.background': '#0D0F15',
        'scrollbarSlider.background': '#1F293D80',
        'scrollbarSlider.hoverBackground': '#334155B0',
        'scrollbarSlider.activeBackground': '#475569E0',
      },
    });

    monaco.editor.setTheme('deep-obsidian');

    // Register keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      if (onRunCode) {
        onRunCode();
      } else {
        onRun();
      }
    });

    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter,
      () => {
        onRun();
      }
    );

    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.Enter,
      () => {
        onSubmit();
      }
    );
  };

  // Only switch model content when active challenge.id actually changes
  const prevChallengeIdRef = useRef(challenge.id);
  useEffect(() => {
    if (prevChallengeIdRef.current !== challenge.id) {
      prevChallengeIdRef.current = challenge.id;
      const editor = editorRef.current;
      if (editor) {
        const normalized = (code || '').replace(/\r\n/g, '\n');
        editor.setValue(normalized);
        const model = editor.getModel();
        if (model) {
          model.setEOL(0); // EndOfLineSequence.LF
        }
        editor.setPosition({ lineNumber: 1, column: 1 });
        editor.setScrollTop(0);
      }
    }
  }, [challenge.id, code]);

  const handleEditorChange = (val: string | undefined) => {
    const nextVal = (val || '').replace(/\r\n/g, '\n');
    lastEmittedValueRef.current = nextVal;
    onChangeCode(nextVal);
  };

  const handleResetCode = () => {
    if (window.confirm('Reset code to original starter template? Current edits will be overwritten.')) {
      const normalizedStarter = (challenge.starterCode || '').replace(/\r\n/g, '\n');
      if (editorRef.current) {
        editorRef.current.setValue(normalizedStarter);
        editorRef.current.setPosition({ lineNumber: 1, column: 1 });
        editorRef.current.setScrollTop(0);
      }
      lastEmittedValueRef.current = normalizedStarter;
      onChangeCode(normalizedStarter);
    }
  };

  const handleCopySolution = () => {
    navigator.clipboard.writeText(challenge.solutionCode);
    setCopiedSolution(true);
    setTimeout(() => setCopiedSolution(false), 2000);
  };

  const handleApplySolution = () => {
    if (window.confirm('Replace your current workspace code with the golden reference solution?')) {
      const normalizedSolution = (challenge.solutionCode || '').replace(/\r\n/g, '\n');
      if (editorRef.current) {
        editorRef.current.setValue(normalizedSolution);
        editorRef.current.setPosition({ lineNumber: 1, column: 1 });
        editorRef.current.setScrollTop(0);
      }
      lastEmittedValueRef.current = normalizedSolution;
      onChangeCode(normalizedSolution);
      setShowSolution(false);
    }
  };

  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const modKey = isMac ? '⌘' : 'Ctrl';

  return (
    <div
      className={`flex-1 flex flex-col h-full bg-surface-base overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50' : 'relative'
      }`}
    >
      {/* 1. TOP ACTION BAR */}
      <div className="h-10 bg-surface-panel border-b border-surface-border px-3 flex items-center justify-between flex-shrink-0 select-none">
        {/* Left: Challenge Filename */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-elevated border border-surface-border text-zinc-300">
            <FileCode className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="text-xs font-mono font-medium text-white truncate">
              {challenge.slug}.py
            </span>
          </div>
        </div>

        {/* Right: Workspace Toolbar Controls */}
        <div className="flex items-center gap-1.5">
          {/* Primer Shortcut */}
          <button
            onClick={onOpenPrimer}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-medium transition-all"
            title="Open Interactive Concept Primer"
          >
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span className="hidden sm:inline">Concept Primer</span>
          </button>

          {/* Solution Toggle */}
          <button
            onClick={() => setShowSolution(!showSolution)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
              showSolution
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/20'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800 hover:border-zinc-700'
            }`}
            title="Toggle Reference Solution"
          >
            {showSolution ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5 text-zinc-400" />}
            <span className="hidden sm:inline">{showSolution ? 'Hide Solution' : 'Solution'}</span>
          </button>

          {/* Reset Code */}
          <button
            onClick={handleResetCode}
            className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-900 rounded-lg transition-colors border border-transparent hover:border-zinc-800"
            title="Reset to Starter Code"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-[1px] bg-zinc-800 mx-0.5" />

          {/* Font Size Controls */}
          <div className="flex items-center bg-zinc-900 rounded-lg border border-zinc-800 px-1 py-0.5">
            <button
              onClick={() => setFontSize((s) => Math.max(11, s - 1))}
              className="p-1 text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Decrease Font Size"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="text-[10px] font-mono text-zinc-400 px-1 min-w-[28px] text-center">
              {fontSize}px
            </span>
            <button
              onClick={() => setFontSize((s) => Math.min(22, s + 1))}
              className="p-1 text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Increase Font Size"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 rounded-lg transition-colors border border-transparent hover:border-zinc-800"
            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen Workspace'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. REAL-TIME ANTI-PATTERN SENTINEL BANNER */}
      {showSentinel && (
        <div className="bg-amber-950/40 border-b border-amber-500/40 px-3.5 py-2 flex items-start justify-between gap-3 text-xs text-amber-200 backdrop-blur-sm animate-in slide-in-from-top duration-200">
          <div className="flex items-start gap-2.5 min-w-0">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-300 font-mono text-[11px] uppercase tracking-wider">
                  {detectedAntiPattern.type}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded font-semibold">
                  Interpreter Overhead
                </span>
              </div>
              <p className="text-[11px] text-amber-200/90 mt-0.5">
                {detectedAntiPattern.message}{' '}
                <span className="text-amber-100 font-medium">{detectedAntiPattern.suggestion}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setDismissedSentinel(detectedAntiPattern.id)}
            className="text-amber-400/80 hover:text-amber-200 p-1 hover:bg-amber-900/40 rounded transition"
            title="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. MAIN CODE WORKSPACE / MONACO EDITOR */}
      <div className="flex-1 relative overflow-hidden">
        <Editor
          height="100%"
          language="python"
          defaultValue={(code || '').replace(/\r\n/g, '\n')}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme="deep-obsidian"
          options={{
            fontSize,
            fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, monospace',
            fontLigatures: true,
            tabSize: 4,
            insertSpaces: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            lineNumbers: 'on',
            renderLineHighlight: 'all',
            padding: { top: 14, bottom: 14 },
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            cursorWidth: 2,
            suggestOnTriggerCharacters: true,
            bracketPairColorization: { enabled: true },
            guides: { bracketPairs: true, indentation: true },
            scrollbar: {
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
          }}
        />

        {/* REFERENCE SOLUTION SLIDE-OVER DRAWER */}
        {showSolution && (
          <div className="absolute inset-y-0 right-0 w-full sm:w-[500px] bg-[#0E1118]/98 backdrop-blur-xl border-l border-zinc-800 shadow-2xl flex flex-col z-20 animate-in slide-in-from-right duration-200">
            <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between bg-[#11141E]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-300 font-mono flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Golden Reference Solution
                </span>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30 font-semibold">
                  &lt;{challenge.benchmarkTargetMs}ms
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopySolution}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 transition-colors border border-zinc-700"
                  title="Copy Solution Code"
                >
                  {copiedSolution ? <Check className="w-3 h-3 text-[#00E599]" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSolution ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleApplySolution}
                  className="px-2.5 py-1 rounded-lg bg-[#00E599] hover:bg-[#00c985] text-xs font-bold text-zinc-950 transition-colors shadow-sm shadow-[#00E599]/30"
                  title="Apply Solution to Editor"
                >
                  Apply to Editor
                </button>
                <button
                  onClick={() => setShowSolution(false)}
                  className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-[#090B10] font-mono text-xs text-emerald-300 leading-relaxed custom-scrollbar select-text cursor-text">
              <pre className="select-text">
                <code className="select-text">{challenge.solutionCode}</code>
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* 3. BOTTOM STATUS & PRIMARY ACTION BAR */}
      <div className="h-11 bg-surface-panel border-t border-surface-border px-3 flex items-center justify-between flex-shrink-0 select-none">
        {/* Left: Environment status and shortcuts */}
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <CursorPositionIndicator editor={editorInstance} />

          <div className="h-3 w-[1px] bg-surface-border" />

          <div className="flex items-center gap-1.5 text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-accent-emerald" />
            <span className="text-xs font-semibold text-zinc-200">Python 3.11</span>
          </div>

          <div className="h-3 w-[1px] bg-surface-border hidden md:block" />

          {/* Keyboard Shortcuts Legend */}
          <div className="hidden md:flex items-center gap-3 text-zinc-400 text-xs">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-surface-base border border-surface-border text-zinc-300 text-[10px]">
                {modKey}+Enter
              </kbd>{' '}
              Run Code
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-surface-base border border-surface-border text-zinc-300 text-[10px]">
                {modKey}+Shift+Enter
              </kbd>{' '}
              Run Tests
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-surface-base border border-surface-border text-zinc-300 text-[10px]">
                {modKey}+Alt+Enter
              </kbd>{' '}
              Benchmark
            </span>
          </div>
        </div>

        {/* Right: Run Code, Run Tests, Benchmark, and Next Problem Buttons */}
        <div className="flex items-center gap-2">
          {/* Run Code (Sandbox) Button */}
          <button
            onClick={onRunCode}
            disabled={isRunningCode || isRunning || isSubmitting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface-hover border border-surface-border text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-all disabled:opacity-50 shadow-xs active:scale-[0.99] cursor-pointer"
            title={`Run Code in Sandbox (${modKey}+Enter)`}
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isRunningCode ? 'animate-spin' : ''}`} />
            <span>{isRunningCode ? 'Executing...' : 'Run Code'}</span>
          </button>

          {/* Run Tests Button */}
          <button
            onClick={onRun}
            disabled={isRunningCode || isRunning || isSubmitting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-accent-emerald hover:bg-emerald-600 text-xs font-bold text-white transition-all disabled:opacity-50 shadow-xs active:scale-[0.99] cursor-pointer"
            title={`Run Test Suite (${modKey}+Shift+Enter)`}
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Testing...' : 'Run Tests'}</span>
          </button>

          {/* Submit & Benchmark Button */}
          <button
            onClick={onSubmit}
            disabled={isRunningCode || isRunning || isSubmitting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface-hover border border-surface-border text-xs font-semibold text-zinc-200 transition-all disabled:opacity-50 cursor-pointer"
            title={`Submit & Run SIMD Benchmark (${modKey}+Alt+Enter)`}
          >
            <Zap className={`w-3.5 h-3.5 text-amber-400 ${isSubmitting ? 'animate-bounce' : ''}`} />
            <span>{isSubmitting ? 'Benchmarking...' : 'Benchmark'}</span>
          </button>

          {/* Next Problem Button (when tests passed or hasNextProblem is true) */}
          {onNextProblem && (hasNextProblem || testsPassed) && (
            <button
              onClick={onNextProblem}
              disabled={hasNextProblem === false}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#00E599] hover:bg-[#00c985] text-zinc-950 text-xs font-bold transition-all shadow-sm shadow-[#00E599]/30 active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Proceed to Next Problem"
            >
              <span>Next Problem</span>
              <span className="text-sm font-bold">→</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeWorkspace;
