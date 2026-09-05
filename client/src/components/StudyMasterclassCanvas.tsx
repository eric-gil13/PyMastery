import React, { useState } from 'react';
import {
  BookOpen,
  Zap,
  BookMarked,
  Target,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  HardDrive,
  Code2,
} from 'lucide-react';
import type { DayTrack, Challenge } from '../types';
import MathRenderer from './MathRenderer';
import RunnableSnippet from './RunnableSnippet';
import ApiCheatCard from './ApiCheatCard';
import InteractiveArrayVisualizer from './InteractiveArrayVisualizer';
import InteractiveDataframeVisualizer from './InteractiveDataframeVisualizer';
import InteractiveAutogradVisualizer from './InteractiveAutogradVisualizer';
import InteractivePythonMemoryVisualizer from './InteractivePythonMemoryVisualizer';
import MarkdownGuideRenderer from './MarkdownGuideRenderer';

interface StudyMasterclassCanvasProps {
  currentDay: DayTrack;
  activeChallenge: Challenge;
  onSwitchToCode: () => void;
}

export const StudyMasterclassCanvas: React.FC<StudyMasterclassCanvasProps> = ({
  currentDay,
  activeChallenge,
  onSwitchToCode,
}) => {
  const [activeTab, setActiveTab] = useState<'mechanics' | 'interactive' | 'cheatsheet' | 'challenge'>('mechanics');

  const mechanics = currentDay.libraryMechanics;

  // Render appropriate interactive visualizer widget based on track
  const renderInteractiveWidget = () => {
    if (!mechanics) return null;
    const widgetType = mechanics.interactiveWidgetType;
    const isPython = activeChallenge.id.startsWith('python-') || mechanics.libraryName.toLowerCase().includes('python');

    if (widgetType === 'python-memory' || isPython) {
      return <InteractivePythonMemoryVisualizer />;
    }
    if (widgetType === 'numpy-strides' || (currentDay.dayNumber === 1 && !activeChallenge.id.startsWith('pandas-'))) {
      return <InteractiveArrayVisualizer />;
    }
    if (widgetType === 'pandas-blockmanager' || currentDay.dayNumber === 2) {
      return <InteractiveDataframeVisualizer />;
    }
    if (widgetType === 'pytorch-autograd' || currentDay.dayNumber === 5 || currentDay.dayNumber === 6) {
      return <InteractiveAutogradVisualizer />;
    }

    // Default fallback to array visualizer
    return <InteractiveArrayVisualizer />;
  };

  return (
    <div className="flex-1 overflow-y-auto p-5 sm:p-8 max-w-5xl mx-auto w-full space-y-7 animate-fade-in text-zinc-100">
      {/* Header Banner */}
      <div className="border-b border-zinc-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30">
              Part {currentDay.partNumber || currentDay.dayNumber} Masterclass
            </span>
            <span>•</span>
            <span className="text-zinc-400">{currentDay.badge}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {mechanics ? mechanics.libraryName : currentDay.title}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
            {mechanics ? mechanics.tagline : currentDay.subtitle}
          </p>
        </div>

        <button
          onClick={onSwitchToCode}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition shrink-0 self-start md:self-auto"
        >
          <Code2 className="w-4 h-4" />
          <span>Jump to Code & Test →</span>
        </button>
      </div>

      {/* Primary Study Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-px overflow-x-auto">
        <button
          onClick={() => setActiveTab('mechanics')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'mechanics'
              ? 'border-indigo-500 text-indigo-300'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>1. Library Mechanics & Architecture</span>
        </button>

        <button
          onClick={() => setActiveTab('interactive')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'interactive'
              ? 'border-purple-500 text-purple-300'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Zap className="w-4 h-4 text-purple-400" />
          <span>2. Interactive Lab & Visualizers</span>
        </button>

        <button
          onClick={() => setActiveTab('cheatsheet')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'cheatsheet'
              ? 'border-emerald-500 text-emerald-300'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <BookMarked className="w-4 h-4 text-emerald-400" />
          <span>3. API Reference & Cheat Card</span>
        </button>

        <button
          onClick={() => setActiveTab('challenge')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'challenge'
              ? 'border-amber-500 text-amber-300'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Target className="w-4 h-4 text-amber-400" />
          <span>4. Challenge Deep-Dive: {activeChallenge.title}</span>
        </button>
      </div>

      {/* TAB 1: Library Mechanics & Architecture */}
      {activeTab === 'mechanics' && (
        <div className="space-y-8 animate-fade-in">
          {/* Why It Exists & Mental Model */}
          {mechanics && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-6 space-y-4">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>The Core Mental Model & Why This Library Exists</span>
              </div>
              <MarkdownGuideRenderer content={mechanics.overview} />
              <div className="p-4 bg-zinc-950 border border-zinc-800/90 rounded-xl space-y-2">
                <div className="font-semibold text-zinc-200 uppercase text-[11px] font-mono mb-2">
                  The Low-Level Architecture & Hardware Mechanics:
                </div>
                <MarkdownGuideRenderer content={mechanics.whyItExists} />
              </div>
            </div>
          )}

          {/* Data Object Anatomy */}
          {mechanics && mechanics.coreAnatomy && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                  <HardDrive className="w-4 h-4" />
                  <span>Anatomy of the Core Object: <code className="text-white font-mono">{mechanics.coreAnatomy.objectName}</code></span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase">Under the Hood</span>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                {mechanics.coreAnatomy.description}
              </p>

              {/* Memory Diagram ASCII */}
              {mechanics.coreAnatomy.memoryDiagramAscii && (
                <pre className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl font-mono text-[11px] text-cyan-300 overflow-x-auto whitespace-pre leading-normal">
                  {mechanics.coreAnatomy.memoryDiagramAscii}
                </pre>
              )}

              {/* Fields Table */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                {mechanics.coreAnatomy.fields.map((f) => (
                  <div key={f.name} className="p-3.5 bg-zinc-950 border border-zinc-800/80 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <code className="text-xs font-mono font-bold text-indigo-400">.{f.name}</code>
                      <span className="text-[10px] font-mono text-zinc-500">[{f.type}]</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">{f.role}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deep-Dive Chapters with Runnable Snippets */}
          {mechanics && mechanics.chapters && (
            <div className="space-y-6">
              <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>Foundational Mechanics Chapters</span>
              </h2>

              {mechanics.chapters.map((chap, idx) => (
                <div key={chap.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-400 font-mono">
                      {idx + 1}
                    </div>
                    <h3 className="text-base font-bold text-zinc-100">{chap.title}</h3>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed">{chap.summary}</p>

                  <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/60">
                    <MarkdownGuideRenderer content={chap.markdownContent} />
                  </div>

                  {/* Embed Runnable Snippets */}
                  {chap.codeSnippets && chap.codeSnippets.length > 0 && (
                    <div className="pt-2 space-y-3">
                      {chap.codeSnippets.map((snip) => (
                        <RunnableSnippet key={snip.id} snippet={snip} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Common Traps & Anti-Patterns */}
          {mechanics && mechanics.commonTraps && mechanics.commonTraps.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Critical Anti-Patterns & Performance Traps</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mechanics.commonTraps.map((trap, idx) => (
                  <div key={idx} className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-zinc-100">{trap.title}</h4>
                      <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                        {trap.perfImpact}
                      </span>
                    </div>

                    {/* Bad snippet */}
                    <div className="p-3 bg-rose-950/20 border border-rose-900/40 rounded-xl space-y-1">
                      <span className="text-[10px] uppercase font-bold font-mono text-rose-400">❌ Anti-Pattern</span>
                      <pre className="font-mono text-[11px] text-rose-200 overflow-x-auto whitespace-pre-wrap">
                        {trap.badSnippet}
                      </pre>
                      <p className="text-[11px] text-zinc-400">{trap.badExplanation}</p>
                    </div>

                    {/* Good snippet */}
                    <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-xl space-y-1">
                      <span className="text-[10px] uppercase font-bold font-mono text-emerald-400">✅ Idiomatic Solution</span>
                      <pre className="font-mono text-[11px] text-emerald-200 overflow-x-auto whitespace-pre-wrap">
                        {trap.goodSnippet}
                      </pre>
                      <p className="text-[11px] text-zinc-400">{trap.goodExplanation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Interactive Lab & Visualizers */}
      {activeTab === 'interactive' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-4 bg-purple-950/20 border border-purple-900/40 rounded-2xl flex items-center gap-3">
            <Zap className="w-5 h-5 text-purple-400 shrink-0" />
            <p className="text-xs text-purple-200">
              <strong>Interactive Studio:</strong> Experiment with live parameters, inspect hardware byte offsets, and watch how memory pointers transform without allocating RAM.
            </p>
          </div>

          {renderInteractiveWidget()}
        </div>
      )}

      {/* TAB 3: API Reference & Cheat Card */}
      {activeTab === 'cheatsheet' && (
        <div className="animate-fade-in">
          {mechanics && mechanics.apiCheatSheet ? (
            <ApiCheatCard items={mechanics.apiCheatSheet} libraryName={mechanics.libraryName} />
          ) : (
            <div className="p-8 text-center bg-zinc-900/40 border border-zinc-800 rounded-2xl text-zinc-400 text-xs">
              No API cheat sheet loaded for this module.
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Challenge Deep-Dive & Mathematical Intuition */}
      {activeTab === 'challenge' && (
        <div className="space-y-8 animate-fade-in">
          {/* Challenge Overview */}
          <div className="p-6 bg-zinc-900/90 border border-zinc-800 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
              <Target className="w-4 h-4" />
              <span>Target Challenge: {activeChallenge.title}</span>
            </div>
            <MarkdownGuideRenderer content={activeChallenge.conceptPrimer.overview} />
          </div>

          {/* Mathematical Formulas */}
          {activeChallenge.conceptPrimer.mathFormulas && activeChallenge.conceptPrimer.mathFormulas.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <span>📐</span>
                <span>Mathematical Formulations & Expansions</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeChallenge.conceptPrimer.mathFormulas.map((f, idx) => (
                  <div key={idx} className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3">
                    <h4 className="text-xs font-bold text-zinc-200">{f.title}</h4>
                    <div className="p-3.5 bg-zinc-950 border border-zinc-800/80 rounded-xl text-center overflow-x-auto text-indigo-300 py-4">
                      <MathRenderer latex={f.latex} displayMode={true} />
                    </div>
                    <p className="text-xs text-zinc-400">{f.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Naive vs Idiomatic Side-by-Side */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Language Pattern: Slow Naive Loop vs Expressive Idiom</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-rose-950/20 border border-rose-900/40 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-rose-300">Slow / Naive Implementation</span>
                  <span className="text-[10px] text-rose-400 font-mono">Interpreter Overhead</span>
                </div>
                <pre className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl font-mono text-[11px] text-rose-200 overflow-x-auto whitespace-pre-wrap">
                  {activeChallenge.conceptPrimer.naiveVsIdiomatic.naiveCode}
                </pre>
                <p className="text-[11px] text-zinc-400">
                  {activeChallenge.conceptPrimer.naiveVsIdiomatic.naiveExplanation}
                </p>
              </div>

              <div className="p-5 bg-emerald-950/20 border border-emerald-900/40 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-300">Expressive Idiom</span>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    {activeChallenge.conceptPrimer.naiveVsIdiomatic.speedupText || '200x Faster'}
                  </span>
                </div>
                <pre className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl font-mono text-[11px] text-emerald-200 overflow-x-auto whitespace-pre-wrap">
                  {activeChallenge.conceptPrimer.naiveVsIdiomatic.idiomaticCode}
                </pre>
                <p className="text-[11px] text-zinc-400">
                  {activeChallenge.conceptPrimer.naiveVsIdiomatic.idiomaticExplanation}
                </p>
              </div>
            </div>
          </div>

          {/* Under-The-Hood Mechanics */}
          <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3 text-xs leading-relaxed text-zinc-300">
            <h4 className="font-semibold text-zinc-100">{activeChallenge.conceptPrimer.memoryLayout.title}</h4>
            <p className="text-zinc-400">{activeChallenge.conceptPrimer.memoryLayout.content}</p>

            {activeChallenge.conceptPrimer.memoryLayout.diagramAscii && (
              <pre className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl font-mono text-[11px] text-cyan-300 overflow-x-auto">
                {activeChallenge.conceptPrimer.memoryLayout.diagramAscii}
              </pre>
            )}

            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-300 font-medium text-[11px]">
              💡 <strong>Core Rule:</strong> {activeChallenge.conceptPrimer.memoryLayout.keyRule}
            </div>
          </div>

          {/* Ready to Code CTA */}
          <div className="p-6 bg-gradient-to-r from-indigo-950/40 via-zinc-900 to-zinc-900 border border-indigo-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-100">Ready to solve and benchmark {activeChallenge.title}?</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Target runtime: <strong className="text-emerald-400 font-mono">{activeChallenge.benchmarkTargetMs} ms</strong> • Target memory: <strong className="text-cyan-400 font-mono">{activeChallenge.memoryTargetMb} MB</strong>
              </p>
            </div>
            <button
              onClick={onSwitchToCode}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-indigo-600/30 shrink-0"
            >
              Start Coding & Testing →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyMasterclassCanvas;
