import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  BookOpen,
  Code2,
  PanelsTopLeft,
  Bot,
  Play,
  Zap,
  RotateCcw,
  Cloud,
  User,
  Sliders,
  CheckCircle2,
  Circle,
  Sparkles,
  Layers,
  Cpu,
  Table,
  Network,
  Activity,
  ArrowRight,
  Command,
} from 'lucide-react';
import type { DayTrack, Challenge, UserProgress, LayoutMode, Medal } from '../types';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  curriculum: DayTrack[];
  currentDay: DayTrack;
  activeChallenge: Challenge;
  userProgress: UserProgress;
  layoutMode: LayoutMode;
  onSelectChallenge: (challenge: Challenge, day: DayTrack) => void;
  onSelectTrack: (day: DayTrack) => void;
  onOpenPrimer: (challenge?: Challenge) => void;
  onRunTests: () => void;
  onRunBenchmark?: () => void;
  onResetCode: () => void;
  onToggleMentor: () => void;
  onSetLayout: (mode: LayoutMode) => void;
  onOpenSync: () => void;
  onOpenAuth: () => void;
  onToggleSidebar: () => void;
}

type PaletteCategory =
  | 'Curriculum Tracks (Part 1 - 7)'
  | 'Challenges & Exercises'
  | 'Concept Primers & Visualizers'
  | 'Studio Quick Actions';

interface PaletteItem {
  id: string;
  title: string;
  subtitle?: string;
  category: PaletteCategory;
  shortcut?: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  medal?: Medal;
  isCompleted?: boolean;
  onSelect: () => void;
}

const getMedalEmoji = (medal?: Medal) => {
  if (medal === 'gold') return '🥇';
  if (medal === 'silver') return '🥈';
  if (medal === 'bronze') return '🥉';
  return null;
};

const getTrackIcon = (iconName: string) => {
  switch (iconName) {
    case 'Cpu':
      return <Cpu className="w-4 h-4 text-emerald-400" />;
    case 'Table':
      return <Table className="w-4 h-4 text-cyan-400" />;
    case 'Network':
      return <Network className="w-4 h-4 text-purple-400" />;
    case 'Zap':
      return <Zap className="w-4 h-4 text-amber-400" />;
    case 'Layers':
      return <Layers className="w-4 h-4 text-indigo-400" />;
    case 'Sparkles':
      return <Sparkles className="w-4 h-4 text-pink-400" />;
    default:
      return <BookOpen className="w-4 h-4 text-emerald-400" />;
  }
};

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  curriculum,
  activeChallenge,
  userProgress,
  onSelectChallenge,
  onSelectTrack,
  onOpenPrimer,
  onRunTests,
  onRunBenchmark,
  onResetCode,
  onToggleMentor,
  onSetLayout,
  onOpenSync,
  onOpenAuth,
  onToggleSidebar,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const modKey = isMac ? '⌘' : 'Ctrl';

  // Build full searchable item set
  const allItems = useMemo<PaletteItem[]>(() => {
    const items: PaletteItem[] = [];

    // 1. Studio Quick Actions
    items.push({
      id: 'action-run-tests',
      title: 'Run Unit Tests',
      subtitle: `Execute test harness for: ${activeChallenge.title}`,
      category: 'Studio Quick Actions',
      shortcut: `${modKey}↵`,
      icon: <Play className="w-4 h-4 text-emerald-400" />,
      badge: 'Test Runner',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      onSelect: onRunTests,
    });

    items.push({
      id: 'action-run-benchmark',
      title: 'Run Benchmark & Profiler',
      subtitle: `Measure execution speed against <${activeChallenge.benchmarkTargetMs}ms target`,
      category: 'Studio Quick Actions',
      shortcut: `${modKey}⇧↵`,
      icon: <Zap className="w-4 h-4 text-amber-400" />,
      badge: 'Benchmark',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      onSelect: () => (onRunBenchmark ? onRunBenchmark() : onRunTests()),
    });

    items.push({
      id: 'action-toggle-mentor',
      title: 'Toggle AI Study Mentor',
      subtitle: 'Ask questions, review Pythonic style, and debug logic',
      category: 'Studio Quick Actions',
      shortcut: `${modKey}/`,
      icon: <Bot className="w-4 h-4 text-indigo-400" />,
      badge: 'AI Tutor',
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
      onSelect: onToggleMentor,
    });

    items.push({
      id: 'action-reset-code',
      title: 'Reset Code to Starter Template',
      subtitle: 'Revert editor to clean boilerplate code',
      category: 'Studio Quick Actions',
      shortcut: `${modKey}⇧R`,
      icon: <RotateCcw className="w-4 h-4 text-rose-400" />,
      badge: 'Editor',
      badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      onSelect: onResetCode,
    });

    items.push({
      id: 'action-layout-guided',
      title: 'Layout: Guided Studio Mode',
      subtitle: 'Multi-panel layout with Code Workspace and Inspection Deck',
      category: 'Studio Quick Actions',
      shortcut: `${modKey}1`,
      icon: <PanelsTopLeft className="w-4 h-4 text-sky-400" />,
      onSelect: () => onSetLayout('guided'),
    });

    items.push({
      id: 'action-layout-focus',
      title: 'Layout: Focus Code Mode',
      subtitle: 'Maximized editor canvas for distraction-free implementation',
      category: 'Studio Quick Actions',
      shortcut: `${modKey}2`,
      icon: <Code2 className="w-4 h-4 text-cyan-400" />,
      onSelect: () => onSetLayout('focus'),
    });

    items.push({
      id: 'action-layout-masterclass',
      title: 'Layout: Masterclass Reader Mode',
      subtitle: 'Deep-dive theory, architectural diagrams, and interactive widgets',
      category: 'Studio Quick Actions',
      shortcut: `${modKey}3`,
      icon: <BookOpen className="w-4 h-4 text-purple-400" />,
      onSelect: () => onSetLayout('masterclass'),
    });

    items.push({
      id: 'action-cloud-sync',
      title: 'Cloud & Device Sync / JSON Backup',
      subtitle: 'Generate device sync key, export solutions, or restore backup',
      category: 'Studio Quick Actions',
      shortcut: `${modKey}S`,
      icon: <Cloud className="w-4 h-4 text-emerald-400" />,
      onSelect: onOpenSync,
    });

    items.push({
      id: 'action-user-auth',
      title: 'Student Account & Remote State',
      subtitle: 'Sign in to sync progress across laptops and workstations',
      category: 'Studio Quick Actions',
      icon: <User className="w-4 h-4 text-indigo-400" />,
      onSelect: onOpenAuth,
    });

    items.push({
      id: 'action-toggle-sidebar',
      title: 'Toggle Curriculum Sidebar',
      subtitle: 'Show or hide the track navigation sidebar',
      category: 'Studio Quick Actions',
      shortcut: `${modKey}B`,
      icon: <Sliders className="w-4 h-4 text-zinc-400" />,
      onSelect: onToggleSidebar,
    });

    // 2. Curriculum Tracks (Part 1 - 7)
    curriculum.forEach((day) => {
      const completedCount = day.challenges.filter((c) =>
        userProgress.completedChallenges.includes(c.id)
      ).length;

      items.push({
        id: `track-part-${day.dayNumber}`,
        title: `Part ${day.dayNumber}: ${day.title}`,
        subtitle: `${day.subtitle} • (${completedCount}/${day.challenges.length} completed)`,
        category: 'Curriculum Tracks (Part 1 - 7)',
        icon: getTrackIcon(day.iconName),
        badge: day.badge,
        badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
        onSelect: () => onSelectTrack(day),
      });
    });

    // 3. Concept Primers & Visualizers
    curriculum.forEach((day) => {
      const firstChallenge = day.challenges[0];
      if (firstChallenge) {
        items.push({
          id: `primer-part-${day.dayNumber}`,
          title: `Part ${day.dayNumber} Concept Primer: ${firstChallenge.conceptPrimer.title}`,
          subtitle: `${firstChallenge.conceptPrimer.subtitle} • Mathematical Formulas & Memory Layout`,
          category: 'Concept Primers & Visualizers',
          icon: <Sparkles className="w-4 h-4 text-amber-400" />,
          badge: `Part ${day.dayNumber} Primer`,
          badgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
          onSelect: () => {
            onSelectChallenge(firstChallenge, day);
            onOpenPrimer(firstChallenge);
          },
        });
      }
    });

    // Add Dedicated Visualizer Shortcuts
    items.push({
      id: 'visualizer-numpy-strides',
      title: 'Interactive Visualizer: NumPy Memory Strides & Buffer Slicing',
      subtitle: 'Explore C-order vs Fortran-order 1D/2D pointer offsets and cache lines',
      category: 'Concept Primers & Visualizers',
      icon: <Activity className="w-4 h-4 text-cyan-400" />,
      badge: 'Visualizer',
      badgeColor: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
      onSelect: () => {
        const p1 = curriculum.find((d) => d.dayNumber === 1);
        if (p1) {
          onSelectTrack(p1);
          onSetLayout('masterclass');
        }
      },
    });

    items.push({
      id: 'visualizer-pandas-blockmgr',
      title: 'Interactive Visualizer: Pandas BlockManager & Arrow Memory',
      subtitle: 'Analyze 2D column consolidation, PyArrow chunking, and Categorical bitmaps',
      category: 'Concept Primers & Visualizers',
      icon: <Table className="w-4 h-4 text-emerald-400" />,
      badge: 'Visualizer',
      badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
      onSelect: () => {
        const p2 = curriculum.find((d) => d.dayNumber === 2);
        if (p2) {
          onSelectTrack(p2);
          onSetLayout('masterclass');
        }
      },
    });

    items.push({
      id: 'visualizer-pytorch-autograd',
      title: 'Interactive Visualizer: Dynamic Autograd Computation Graph',
      subtitle: 'Trace forward tensor ops, node grad_fn closures, and backward backprop passes',
      category: 'Concept Primers & Visualizers',
      icon: <Network className="w-4 h-4 text-purple-400" />,
      badge: 'Visualizer',
      badgeColor: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
      onSelect: () => {
        const p3 = curriculum.find((d) => d.dayNumber === 3) || curriculum.find((d) => d.dayNumber === 5);
        if (p3) {
          onSelectTrack(p3);
          onSetLayout('masterclass');
        }
      },
    });

    // 4. Challenges & Exercises
    curriculum.forEach((day) => {
      day.challenges.forEach((challenge) => {
        const isSolved = userProgress.completedChallenges.includes(challenge.id);
        const medal = userProgress.medals[challenge.id];

        let diffBadgeColor = 'bg-zinc-800 text-zinc-300 border-zinc-700';
        if (challenge.difficulty === 'Beginner') diffBadgeColor = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
        if (challenge.difficulty === 'Intermediate') diffBadgeColor = 'bg-sky-500/10 text-sky-300 border-sky-500/30';
        if (challenge.difficulty === 'Advanced') diffBadgeColor = 'bg-amber-500/10 text-amber-300 border-amber-500/30';
        if (challenge.difficulty === 'Expert') diffBadgeColor = 'bg-rose-500/10 text-rose-300 border-rose-500/30';

        items.push({
          id: `challenge-${challenge.id}`,
          title: challenge.title,
          subtitle: `Part ${day.dayNumber}: ${day.title.split('&')[0].trim()} • ${challenge.category} • Target <${challenge.benchmarkTargetMs}ms`,
          category: 'Challenges & Exercises',
          icon: isSolved ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <Circle className="w-4 h-4 text-zinc-500" />
          ),
          badge: challenge.difficulty,
          badgeColor: diffBadgeColor,
          medal: medal,
          isCompleted: isSolved,
          onSelect: () => onSelectChallenge(challenge, day),
        });
      });
    });

    return items;
  }, [
    curriculum,
    activeChallenge,
    userProgress,
    modKey,
    onRunTests,
    onRunBenchmark,
    onToggleMentor,
    onResetCode,
    onSetLayout,
    onOpenSync,
    onOpenAuth,
    onToggleSidebar,
    onSelectTrack,
    onSelectChallenge,
    onOpenPrimer,
  ]);

  // Filter items based on user search query
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allItems;

    return allItems.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSub = item.subtitle ? item.subtitle.toLowerCase().includes(q) : false;
      const matchCat = item.category.toLowerCase().includes(q);
      const matchBadge = item.badge ? item.badge.toLowerCase().includes(q) : false;
      return matchTitle || matchSub || matchCat || matchBadge;
    });
  }, [allItems, query]);

  // Reset selected index when query changes or modal opens
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Keyboard navigation inside modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : Math.max(filteredItems.length - 1, 0)));
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredItems[selectedIndex];
        if (selected) {
          selected.onSelect();
          onClose();
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  // Group filtered items by category
  const categories: PaletteCategory[] = [
    'Studio Quick Actions',
    'Curriculum Tracks (Part 1 - 7)',
    'Challenges & Exercises',
    'Concept Primers & Visualizers',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/75 backdrop-blur-md animate-fade-in text-zinc-100">
      {/* Click outside backdrop to close */}
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-[#141418] border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh] z-10">
        {/* Top Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-zinc-800 bg-[#18181d]">
          <Search className="w-5 h-5 text-indigo-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, Part 1-7, challenge, or visualizer..."
            className="flex-1 bg-transparent text-sm sm:text-base text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs text-zinc-400 hover:text-zinc-200 px-2 py-0.5 rounded bg-zinc-800 mr-2"
            >
              Clear
            </button>
          )}
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold text-zinc-400 bg-zinc-800/90 border border-zinc-700 rounded shadow-xs">
              ESC
            </kbd>
          </div>
        </div>

        {/* Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-4 custom-scrollbar">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-zinc-500">
              <Command className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
              <p className="text-sm">No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-zinc-600 mt-1">Try searching for &ldquo;Part 1&rdquo;, &ldquo;Autograd&rdquo;, &ldquo;Benchmark&rdquo;, or &ldquo;Reset&rdquo;</p>
            </div>
          ) : (
            categories.map((category) => {
              const categoryItems = filteredItems.filter((item) => item.category === category);
              if (categoryItems.length === 0) return null;

              return (
                <div key={category} className="space-y-1">
                  <div className="px-3 py-1 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    {category}
                  </div>

                  <div className="space-y-0.5">
                    {categoryItems.map((item) => {
                      const itemGlobalIndex = filteredItems.indexOf(item);
                      const isSelected = itemGlobalIndex === selectedIndex;
                      const medalEmoji = getMedalEmoji(item.medal);

                      return (
                        <div
                          key={item.id}
                          data-index={itemGlobalIndex}
                          onClick={() => {
                            item.onSelect();
                            onClose();
                          }}
                          onMouseEnter={() => setSelectedIndex(itemGlobalIndex)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left cursor-pointer transition-all duration-100 ${
                            isSelected
                              ? 'bg-indigo-600/20 border border-indigo-500/50 text-zinc-100 shadow-sm'
                              : 'hover:bg-zinc-800/50 border border-transparent text-zinc-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                            <div
                              className={`p-1.5 rounded-lg shrink-0 ${
                                isSelected ? 'bg-indigo-500/20 text-indigo-300' : 'bg-zinc-800/80 text-zinc-400'
                              }`}
                            >
                              {item.icon}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs sm:text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-zinc-200'}`}>
                                  {item.title}
                                </span>
                                {item.badge && (
                                  <span
                                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded border shrink-0 ${
                                      item.badgeColor || 'bg-zinc-800 text-zinc-400 border-zinc-700'
                                    }`}
                                  >
                                    {item.badge}
                                  </span>
                                )}
                                {medalEmoji && <span className="text-xs shrink-0">{medalEmoji}</span>}
                              </div>
                              {item.subtitle && (
                                <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                                  {item.subtitle}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Right Action / Shortcut Badge */}
                          <div className="flex items-center gap-2 shrink-0">
                            {item.shortcut && (
                              <kbd
                                className={`px-2 py-0.5 text-[11px] font-mono font-semibold rounded border ${
                                  isSelected
                                    ? 'bg-indigo-500/30 text-indigo-200 border-indigo-400/40'
                                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                                }`}
                              >
                                {item.shortcut}
                              </kbd>
                            )}
                            {isSelected && <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-4 py-2.5 bg-[#101014] border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400 select-none">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded font-mono text-[10px]">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded font-mono text-[10px]">↓</kbd>
              <span className="text-zinc-500 ml-1">Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded font-mono text-[10px]">↵</kbd>
              <span className="text-zinc-500 ml-1">Select</span>
            </span>
            <span className="flex items-center gap-1 hidden sm:inline-flex">
              <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded font-mono text-[10px]">{modKey}K</kbd>
              <span className="text-zinc-500 ml-1">Toggle</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-zinc-500 font-mono">PyMastery Studio</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPaletteModal;
