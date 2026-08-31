import React, { useState } from 'react';
import { Play, RotateCcw, Check, Copy, Terminal, Zap, Clock } from 'lucide-react';
import type { RunnableCodeSnippet } from '../types';
import { executeRawSnippetApi } from '../services/api';

interface RunnableSnippetProps {
  snippet: RunnableCodeSnippet;
}

export const RunnableSnippet: React.FC<RunnableSnippetProps> = ({ snippet }) => {
  const [code, setCode] = useState(snippet.code);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string | null>(snippet.expectedOutput || null);
  const [isError, setIsError] = useState(false);
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const handleRun = async () => {
    setIsRunning(true);
    setIsError(false);
    try {
      const res = await executeRawSnippetApi(code);
      if (!res.success || res.stderr) {
        setIsError(true);
        setOutput(res.stderr || res.stdout);
      } else {
        setIsError(false);
        setOutput(res.stdout);
      }
      if (res.executionDurationMs !== undefined) {
        setExecutionTimeMs(res.executionDurationMs);
      }
    } catch (err: any) {
      setIsError(true);
      setOutput(`Execution Error: ${err?.message || 'Failed to execute code'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setCode(snippet.code);
    setOutput(snippet.expectedOutput || null);
    setIsError(false);
    setExecutionTimeMs(null);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-xl border border-zinc-800 bg-zinc-950/80 overflow-hidden shadow-lg shadow-black/20">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-zinc-900/90 border-b border-zinc-800 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-zinc-200">{snippet.title}</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded">
            Interactive Snippet
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            title="Copy code"
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleReset}
            title="Reset to original snippet"
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-md text-xs font-semibold shadow transition shadow-emerald-600/30"
          >
            {isRunning ? (
              <>
                <Zap className="w-3 h-3 animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span>Run Snippet</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editable Code Editor */}
      <div className="p-3 bg-zinc-950 font-mono text-xs">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          rows={Math.max(3, Math.min(14, code.split('\n').length))}
          className="w-full bg-transparent text-emerald-300 font-mono text-xs focus:outline-none resize-y selection:bg-indigo-500/30 selection:text-white leading-relaxed font-semibold"
          spellCheck={false}
        />
      </div>

      {/* Explanation Footer */}
      <div className="px-3.5 py-2 bg-zinc-900/40 border-t border-zinc-800/60 text-[11px] text-zinc-400 flex items-start gap-1.5">
        <span className="text-indigo-400 font-bold shrink-0">Insight:</span>
        <span>{snippet.explanation}</span>
      </div>

      {/* Live Output Terminal */}
      {output !== null && (
        <div className="border-t border-zinc-800 bg-[#09090c] p-3 text-xs font-mono">
          <div className="flex items-center justify-between mb-1.5 text-[10px] text-zinc-500 uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <Terminal className="w-3 h-3 text-zinc-400" />
              <span>Console Output</span>
            </div>
            {executionTimeMs !== null && (
              <div className="flex items-center gap-1 text-emerald-400 font-mono">
                <Clock className="w-3 h-3" />
                <span>{executionTimeMs.toFixed(2)} ms</span>
              </div>
            )}
          </div>
          <pre
            className={`overflow-x-auto whitespace-pre-wrap ${
              isError ? 'text-rose-400' : 'text-zinc-200'
            }`}
          >
            {output}
          </pre>
        </div>
      )}
    </div>
  );
};

export default RunnableSnippet;
