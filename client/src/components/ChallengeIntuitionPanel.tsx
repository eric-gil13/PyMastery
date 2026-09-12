import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Lightbulb,
  FlaskConical,
  GraduationCap,
  Cpu,
  Bot,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import type { Challenge, DayTrack } from '../types';
import MathRenderer from './MathRenderer';
import InteractiveArrayVisualizer from './InteractiveArrayVisualizer';
import InteractiveDataframeVisualizer from './InteractiveDataframeVisualizer';
import InteractiveAutogradVisualizer from './InteractiveAutogradVisualizer';
import InteractivePythonMemoryVisualizer from './InteractivePythonMemoryVisualizer';
import InteractiveMatplotlibVisualizer from './InteractiveMatplotlibVisualizer';
import InteractiveSklearnVisualizer from './InteractiveSklearnVisualizer';
import MarkdownGuideRenderer from './MarkdownGuideRenderer';
import ApiCheatCard from './ApiCheatCard';

export interface ChallengeIntuitionPanelProps {
  challenge: Challenge;
  currentDay?: DayTrack;
  onOpenStudyMasterclass?: () => void;
  onOpenPrimer?: () => void;
  onOpenMentor?: () => void;
  onInsertStarterSnippet?: (snippet: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export const ChallengeIntuitionPanel: React.FC<ChallengeIntuitionPanelProps> = ({
  challenge,
  currentDay,
  onOpenStudyMasterclass,
  onOpenMentor,
  className = '',
}) => {
  // Progressive disclosure accordion states
  const [hintsOpen, setHintsOpen] = useState(false);
  const [labOpen, setLabOpen] = useState(false);
  const [systemsOpen, setSystemsOpen] = useState(false);
  const [masterclassOpen, setMasterclassOpen] = useState(false);

  // Progressive hint counter
  const [revealedHints, setRevealedHints] = useState(0);
  const [copiedInput, setCopiedInput] = useState(false);

  // Reset hint count when challenge changes
  React.useEffect(() => {
    setRevealedHints(0);
    setHintsOpen(false);
    setLabOpen(false);
    setSystemsOpen(false);
    setMasterclassOpen(false);
  }, [challenge.id]);

  // Render appropriate interactive visualizer widget based on track & challenge
  const renderInteractiveWidget = () => {
    const libName = currentDay?.libraryMechanics?.libraryName?.toLowerCase() || '';
    const chId = challenge.id.toLowerCase();
    const widgetType = currentDay?.libraryMechanics?.interactiveWidgetType;

    if (chId.startsWith('python-') || libName.includes('python') || widgetType === 'python-memory') {
      return <InteractivePythonMemoryVisualizer />;
    }
    if (chId.startsWith('matplotlib-') || libName.includes('matplotlib') || widgetType === 'matplotlib-artists') {
      return <InteractiveMatplotlibVisualizer />;
    }
    if (chId.startsWith('sklearn-') || libName.includes('sklearn') || libName.includes('scikit') || widgetType === 'sklearn-pipeline') {
      return <InteractiveSklearnVisualizer />;
    }
    if (chId.startsWith('pytorch-') || libName.includes('pytorch') || libName.includes('torch') || widgetType === 'pytorch-autograd' || widgetType === 'pytorch-nn') {
      return <InteractiveAutogradVisualizer />;
    }
    if (chId.startsWith('pandas-') || libName.includes('pandas') || widgetType === 'pandas-blockmanager') {
      return <InteractiveDataframeVisualizer />;
    }
    if (chId.startsWith('numpy-') || libName.includes('numpy') || widgetType === 'numpy-strides') {
      return <InteractiveArrayVisualizer />;
    }

    return <InteractiveArrayVisualizer />;
  };

  const handleCopyInput = () => {
    const starterInput =
      challenge.conceptPrimer?.starterInputSnippet ||
      challenge.testCases[0]?.inputDescription ||
      'X = np.array([[0, 0], [1, 1]])';
    navigator.clipboard.writeText(starterInput);
    setCopiedInput(true);
    setTimeout(() => setCopiedInput(false), 2000);
  };

  const getDifficultyBadge = (diff: string) => {
    switch (diff.toLowerCase()) {
      case 'beginner':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'intermediate':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'advanced':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'expert':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  return (
    <div
      className={`h-full flex flex-col bg-surface-panel text-zinc-200 select-text overflow-hidden ${className}`}
    >
      {/* 1. Clean Article Header */}
      <div className="px-6 py-4 border-b border-surface-border bg-surface-panel flex items-center justify-between flex-shrink-0 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-accent-indigo">
              Part {currentDay?.dayNumber || 1} • {challenge.category}
            </span>
            <span className="text-zinc-600">•</span>
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${getDifficultyBadge(
                challenge.difficulty
              )}`}
            >
              {challenge.difficulty}
            </span>
          </div>
          <h1 className="text-lg font-bold text-white mt-1 leading-snug">
            {challenge.title}
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenStudyMasterclass && (
            <button
              onClick={onOpenStudyMasterclass}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white bg-surface-elevated hover:bg-surface-hover border border-surface-border transition shadow-xs"
              title="Open full Part Guide & Interactive Masterclass (⌘3)"
            >
              <BookOpen className="w-3.5 h-3.5 text-accent-indigo" />
              <span>Full Guide</span>
            </button>
          )}

          {onOpenMentor && (
            <button
              onClick={onOpenMentor}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-accent-indigo hover:text-white bg-accent-indigo/10 hover:bg-accent-indigo/20 border border-accent-indigo/30 transition shadow-xs"
              title="Ask AI Mentor for a friendly nudge (⌘/)"
            >
              <Bot className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AI Mentor</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Scrollable Problem Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-sm leading-relaxed text-zinc-300">
        
        {/* Main Problem Description */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Problem Description
          </h2>
          <div className="text-zinc-200 text-sm leading-relaxed space-y-2">
            <MarkdownGuideRenderer content={challenge.instructions || challenge.summary} />
          </div>
        </div>

        {/* 5-Second Mental Model / Intuition Box */}
        {challenge.conceptPrimer?.mentalModel5s && (
          <div className="p-4 bg-surface-elevated border border-surface-border rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
              <Sparkles className="w-4 h-4" />
              <span>Core Mental Model</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {challenge.conceptPrimer.mentalModel5s}
            </p>
          </div>
        )}

        {/* Expected Input & Output Contract */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Example Input & Output
            </h2>
            <button
              onClick={handleCopyInput}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition"
              title="Copy starter input data"
            >
              {copiedInput ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Input</span>
                </>
              )}
            </button>
          </div>

          <div className="p-3.5 bg-surface-base border border-surface-border rounded-xl font-mono text-xs text-zinc-300 space-y-2 overflow-x-auto">
            <div>
              <span className="text-zinc-500"># Input:</span>
              <div className="text-emerald-400 mt-0.5">
                {challenge.conceptPrimer?.starterInputSnippet || challenge.testCases[0]?.inputDescription || 'X = np.array([[0, 0], [1, 1]])'}
              </div>
            </div>
            <div className="pt-1.5 border-t border-surface-border/50">
              <span className="text-zinc-500"># Expected Output:</span>
              <div className="text-cyan-400 mt-0.5">
                {challenge.testCases[0]?.expectedOutput || 'array([[0.0, 1.414], [1.414, 0.0]])'}
              </div>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* QUIET PROGRESSIVE ACCORDIONS                                  */}
        {/* ------------------------------------------------------------- */}
        <div className="space-y-3 pt-2">
          
          {/* 1. Hints Accordion */}
          <div className="border border-surface-border rounded-xl overflow-hidden bg-surface-elevated">
            <button
              onClick={() => setHintsOpen(!hintsOpen)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-surface-hover transition text-left"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span>Need a Hint? ({challenge.hints.length} available)</span>
              </div>
              {hintsOpen ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
            </button>

            {hintsOpen && (
              <div className="px-4 pb-4 pt-1 space-y-3 border-t border-surface-border">
                {revealedHints > 0 ? (
                  <div className="space-y-2">
                    {challenge.hints.slice(0, revealedHints).map((hint, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-200 leading-relaxed flex items-start gap-2"
                      >
                        <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="flex-1">{hint}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 py-1">
                    Hints are hidden to avoid spoilers. Click below to reveal step-by-step.
                  </p>
                )}

                <div className="flex items-center gap-2 pt-1">
                  {revealedHints < challenge.hints.length && (
                    <button
                      onClick={() => setRevealedHints((prev) => prev + 1)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg text-xs transition"
                    >
                      Reveal Hint {revealedHints + 1}
                    </button>
                  )}
                  {revealedHints > 0 && (
                    <button
                      onClick={() => setRevealedHints(revealedHints === challenge.hints.length ? 0 : challenge.hints.length)}
                      className="px-3 py-1.5 bg-surface-base hover:bg-surface-hover text-zinc-300 rounded-lg text-xs transition border border-surface-border"
                    >
                      {revealedHints === challenge.hints.length ? 'Hide All' : 'Show All'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 2. Interactive Simulator Accordion */}
          <div className="border border-surface-border rounded-xl overflow-hidden bg-surface-elevated">
            <button
              onClick={() => setLabOpen(!labOpen)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-surface-hover transition text-left"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <FlaskConical className="w-4 h-4 text-emerald-400" />
                <span>Interactive Visualizer & Architecture Lab</span>
              </div>
              {labOpen ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
            </button>

            {labOpen && (
              <div className="p-4 border-t border-surface-border space-y-3">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Experiment with strides, block structures, or autograd graphs in real time:
                </p>
                {renderInteractiveWidget()}
              </div>
            )}
          </div>

          {/* 3. Deep Internals Accordion (For Senior Devs) */}
          <div className="border border-surface-border rounded-xl overflow-hidden bg-surface-elevated">
            <button
              onClick={() => setSystemsOpen(!systemsOpen)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-surface-hover transition text-left"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                <Cpu className="w-4 h-4 text-indigo-400" />
                <span>Under the Hood: C Memory, Cache Lines & Formulas</span>
              </div>
              {systemsOpen ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
            </button>

            {systemsOpen && (
              <div className="p-4 border-t border-surface-border space-y-4">
                {/* Math Formulas */}
                {challenge.conceptPrimer?.mathFormulas && challenge.conceptPrimer.mathFormulas.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                      Mathematical Formulation
                    </h3>
                    {challenge.conceptPrimer.mathFormulas.map((f, idx) => (
                      <div key={idx} className="p-3 bg-surface-base border border-surface-border rounded-lg space-y-1">
                        <div className="text-xs font-bold text-zinc-200">{f.title}</div>
                        <div className="py-1 overflow-x-auto text-indigo-300">
                          <MathRenderer latex={f.latex} displayMode={true} />
                        </div>
                        <p className="text-xs text-zinc-400">{f.explanation}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Memory Layout */}
                {challenge.conceptPrimer?.memoryLayout && (
                  <div className="space-y-1.5 p-3 bg-surface-base border border-surface-border rounded-lg">
                    <div className="text-xs font-bold text-zinc-200">
                      {challenge.conceptPrimer.memoryLayout.title}
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {challenge.conceptPrimer.memoryLayout.content}
                    </p>
                    {challenge.conceptPrimer.memoryLayout.keyRule && (
                      <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded text-xs text-indigo-300 font-mono">
                        Hardware Rule: {challenge.conceptPrimer.memoryLayout.keyRule}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 4. Part Masterclass Accordion */}
          {currentDay?.libraryMechanics && (
            <div className="border border-surface-border rounded-xl overflow-hidden bg-surface-elevated">
              <button
                onClick={() => setMasterclassOpen(!masterclassOpen)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-surface-hover transition text-left"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
                  <GraduationCap className="w-4 h-4 text-cyan-400" />
                  <span>Part {currentDay.dayNumber} Masterclass & Core API</span>
                </div>
                {masterclassOpen ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
              </button>

              {masterclassOpen && (
                <div className="p-4 border-t border-surface-border space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {currentDay.libraryMechanics.libraryName}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {currentDay.libraryMechanics.tagline}
                    </p>
                  </div>
                  <div className="text-xs text-zinc-300 leading-relaxed">
                    <MarkdownGuideRenderer content={currentDay.libraryMechanics.overview} />
                  </div>
                  {currentDay.libraryMechanics.apiCheatSheet && currentDay.libraryMechanics.apiCheatSheet.length > 0 && (
                    <ApiCheatCard
                      items={currentDay.libraryMechanics.apiCheatSheet}
                      libraryName={currentDay.libraryMechanics.libraryName}
                    />
                  )}

                  {onOpenStudyMasterclass && (
                    <button
                      onClick={onOpenStudyMasterclass}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-surface-base hover:bg-surface-hover border border-surface-border text-xs font-semibold text-accent-indigo hover:text-white rounded-lg transition"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Open Full-Screen Part Guide & Interactive Labs →</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default ChallengeIntuitionPanel;
