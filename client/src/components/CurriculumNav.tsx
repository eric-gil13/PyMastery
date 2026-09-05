import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  Sparkles,
  Search,
  BookOpen,
  Flame,
  Cpu,
  Layers,
  Table,
  Zap,
  Network,
  Cloud,
  ArrowUpRight,
  Clock,
  X,
} from 'lucide-react';
import type { DayTrack, Challenge, UserProgress, Difficulty, Medal, LibraryId } from '../types';

interface CurriculumNavProps {
  curriculum: DayTrack[];
  currentDay: DayTrack;
  activeChallenge: Challenge;
  userProgress: UserProgress;
  selectedLibrary?: LibraryId;
  onSelectLibrary?: (lib: LibraryId) => void;
  onSelectChallenge: (challenge: Challenge, day: DayTrack) => void;
  onOpenPrimer: (challenge?: Challenge) => void;
  onOpenSync?: () => void;
}

const getDifficultyBadge = (difficulty: Difficulty) => {
  switch (difficulty) {
    case 'Beginner':
      return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
    case 'Intermediate':
      return 'bg-sky-500/10 text-sky-300 border-sky-500/30';
    case 'Advanced':
      return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
    case 'Expert':
      return 'bg-rose-500/10 text-rose-300 border-rose-500/30';
    default:
      return 'bg-zinc-800 text-zinc-400 border-zinc-700';
  }
};

const getMedalIcon = (medal?: Medal) => {
  if (medal === 'gold') return <span title="Gold Benchmark Beaten" className="text-xs">🥇</span>;
  if (medal === 'silver') return <span title="Silver Benchmark Achieved" className="text-xs">🥈</span>;
  if (medal === 'bronze') return <span title="Bronze Benchmark Achieved" className="text-xs">🥉</span>;
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

const getEstimatedTime = (challenge: Challenge): string => {
  if (challenge.estimatedTime) return challenge.estimatedTime;
  switch (challenge.difficulty) {
    case 'Beginner':
      return '15 min';
    case 'Intermediate':
      return '20 min';
    case 'Advanced':
      return '25 min';
    case 'Expert':
      return '35 min';
    default:
      return '20 min';
  }
};

const LIBRARIES: Array<{ id: LibraryId; name: string; icon: string; badge: string; color: string }> = [
  { id: 'python', name: 'Python', icon: '🐍', badge: '7 Parts', color: 'from-blue-500/20 to-yellow-500/10 border-blue-500/30 text-blue-300' },
  { id: 'numpy', name: 'NumPy', icon: '⚡', badge: '7 Parts', color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-300' },
  { id: 'pandas', name: 'Pandas', icon: '📊', badge: '7 Parts', color: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-300' },
  { id: 'matplotlib', name: 'Matplotlib', icon: '📈', badge: '4 Parts', color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-300' },
  { id: 'sklearn', name: 'Scikit-Learn', icon: '🛡️', badge: '6 Parts', color: 'from-indigo-500/20 to-violet-500/10 border-indigo-500/30 text-indigo-300' },
  { id: 'pytorch', name: 'PyTorch', icon: '🔥', badge: '7 Parts', color: 'from-rose-500/20 to-pink-500/10 border-rose-500/30 text-rose-300' },
];

export const CurriculumNav: React.FC<CurriculumNavProps> = ({
  curriculum,
  currentDay,
  activeChallenge,
  userProgress,
  selectedLibrary = 'python',
  onSelectLibrary,
  onSelectChallenge,
  onOpenPrimer,
  onOpenSync,
}) => {
  const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>({
    [currentDay.dayNumber]: true,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'unsolved' | 'needs-gold'>('all');

  const toggleDay = (dayNumber: number) => {
    setExpandedDays((prev) => ({
      ...prev,
      [dayNumber]: !prev[dayNumber],
    }));
  };

  // Progress Calculations
  const totalChallenges = useMemo(
    () => curriculum.reduce((acc, d) => acc + d.challenges.length, 0),
    [curriculum]
  );
  const totalCompleted = userProgress.completedChallenges.length;
  const progressPercent = Math.round((totalCompleted / Math.max(totalChallenges, 1)) * 100);

  // Medal Summaries
  const goldCount = useMemo(
    () => Object.values(userProgress.medals || {}).filter((m) => m === 'gold').length,
    [userProgress.medals]
  );
  const silverCount = useMemo(
    () => Object.values(userProgress.medals || {}).filter((m) => m === 'silver').length,
    [userProgress.medals]
  );
  const bronzeCount = useMemo(
    () => Object.values(userProgress.medals || {}).filter((m) => m === 'bronze').length,
    [userProgress.medals]
  );

  return (
    <aside className="w-80 h-full bg-surface-panel border-r border-surface-border flex flex-col shrink-0 select-none overflow-hidden text-zinc-100">
      {/* Sidebar Header & Overall Progress Deck */}
      <div className="p-3.5 border-b border-surface-border bg-surface-panel space-y-2.5">
        {/* Library Switcher Bar */}
        <div className="space-y-1.5 pb-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-zinc-300 uppercase tracking-wider text-[10px]">
              Library
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">
              Zero-to-Hero
            </span>
          </div>
          <div className="grid grid-cols-6 gap-1">
            {LIBRARIES.map((lib) => {
              const isActive = selectedLibrary === lib.id;
              return (
                <button
                  key={lib.id}
                  onClick={() => onSelectLibrary?.(lib.id)}
                  title={`${lib.name} (${lib.badge})`}
                  className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-lg border transition-all ${
                    isActive
                      ? `bg-gradient-to-b ${lib.color} ring-1 ring-white/20 font-bold shadow-xs scale-[1.02]`
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                  }`}
                >
                  <span className="text-sm leading-none">{lib.icon}</span>
                  <span className="text-[9px] mt-1 font-medium truncate max-w-full">
                    {lib.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
              {LIBRARIES.find((l) => l.id === selectedLibrary)?.name || 'Curriculum'} Tracks
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            {progressPercent}%
          </span>
        </div>

        {/* Linear Progress Bar */}
        <div className="w-full bg-zinc-800/80 rounded-full h-2 overflow-hidden shadow-inner">
          <div
            className="bg-gradient-to-r from-indigo-500 via-emerald-400 to-cyan-400 h-full transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Progress Counts & Medal Badges */}
        <div className="flex items-center justify-between text-[11px] pt-0.5">
          <span className="text-zinc-400 font-medium">
            <strong className="text-zinc-200">{totalCompleted}</strong> of {totalChallenges} Completed
          </span>

          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span title="Gold Medals" className="flex items-center gap-0.5 bg-amber-500/10 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/20">
              🥇 {goldCount}
            </span>
            <span title="Silver Medals" className="flex items-center gap-0.5 bg-slate-500/10 text-slate-300 px-1.5 py-0.2 rounded border border-slate-500/20">
              🥈 {silverCount}
            </span>
            <span title="Bronze Medals" className="flex items-center gap-0.5 bg-orange-500/10 text-orange-300 px-1.5 py-0.2 rounded border border-orange-500/20">
              🥉 {bronzeCount}
            </span>
          </div>
        </div>

        {/* Search Bar & Filter Chips */}
        <div className="space-y-2 pt-1">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Part 1–7 exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/90 border border-zinc-800 rounded-lg pl-8 pr-7 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500/70"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 custom-scrollbar">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 text-[10px] font-medium rounded-lg transition whitespace-nowrap ${
                filterMode === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 border border-zinc-750'
              }`}
            >
              All ({totalChallenges})
            </button>
            <button
              onClick={() => setFilterMode('unsolved')}
              className={`px-2.5 py-1 text-[10px] font-medium rounded-lg transition whitespace-nowrap ${
                filterMode === 'unsolved'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 border border-zinc-750'
              }`}
            >
              Unsolved ({totalChallenges - totalCompleted})
            </button>
            <button
              onClick={() => setFilterMode('needs-gold')}
              className={`px-2.5 py-1 text-[10px] font-medium rounded-lg transition whitespace-nowrap flex items-center gap-1 ${
                filterMode === 'needs-gold'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 border border-zinc-750'
              }`}
              title="Challenges not yet achieved Gold Benchmark speed"
            >
              <span>🥇 Needs Gold</span>
            </button>
          </div>
        </div>
      </div>

      {/* Accordion List for Tracks (Part 1 - 7) */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
        {curriculum.map((day) => {
          const isExpanded = !!expandedDays[day.dayNumber];
          const completedInDay = day.challenges.filter((c) =>
            userProgress.completedChallenges.includes(c.id)
          ).length;
          const dayDone = completedInDay === day.challenges.length && day.challenges.length > 0;

          // Filter challenges
          const filteredChallenges = day.challenges.filter((c) => {
            const matchesSearch =
              c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
              c.difficulty.toLowerCase().includes(searchQuery.toLowerCase()) ||
              `part ${day.dayNumber}`.includes(searchQuery.toLowerCase());

            const isSolved = userProgress.completedChallenges.includes(c.id);
            const medal = userProgress.medals[c.id];

            if (filterMode === 'unsolved') return matchesSearch && !isSolved;
            if (filterMode === 'needs-gold') return matchesSearch && medal !== 'gold';
            return matchesSearch;
          });

          if (searchQuery && filteredChallenges.length === 0) {
            return null;
          }

          return (
            <div
              key={day.id}
              className={`rounded-xl border transition-all duration-150 overflow-hidden ${
                day.id === currentDay.id
                  ? 'border-indigo-500/40 bg-zinc-900/80 shadow-md shadow-indigo-950/20'
                  : 'border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700'
              }`}
            >
              {/* Part Header Accordion Toggle */}
              <div
                onClick={() => toggleDay(day.dayNumber)}
                className="w-full flex items-center justify-between p-2.5 cursor-pointer hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-lg bg-zinc-800/90 border border-zinc-700/60 shrink-0">
                    {getTrackIcon(day.iconName)}
                  </div>
                  <div className="min-w-0 text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-indigo-400">
                        Part {day.dayNumber}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        ({completedInDay}/{day.challenges.length})
                      </span>
                    </div>
                    <p className="text-xs font-medium text-zinc-200 truncate max-w-[170px]">
                      {day.title}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {dayDone && (
                    <span title="All track challenges completed!">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                  )}
                </div>
              </div>

              {/* Part Body / Challenges List */}
              {isExpanded && (
                <div className="p-1.5 pt-0 space-y-1">
                  {/* Part Concept Primer & Visualizer Shortcut */}
                  {day.challenges[0] && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenPrimer(day.challenges[0]);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-950/40 to-violet-950/30 hover:from-indigo-900/50 hover:to-violet-900/40 border border-indigo-800/30 text-[11px] text-indigo-300 flex items-center justify-between transition-colors mb-1 shadow-xs"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate font-medium">Part {day.dayNumber} Primer & Visualizer</span>
                      </div>
                      <span className="text-[10px] font-mono text-indigo-400 flex items-center gap-0.5">
                        Study <ArrowUpRight className="w-3 h-3" />
                      </span>
                    </button>
                  )}

                  {/* Challenges List */}
                  {filteredChallenges.map((challenge) => {
                    const isSelected = activeChallenge.id === challenge.id;
                    const isSolved = userProgress.completedChallenges.includes(challenge.id);
                    const medal = userProgress.medals[challenge.id];
                    const estTime = getEstimatedTime(challenge);

                    return (
                      <div
                        key={challenge.id}
                        onClick={() => onSelectChallenge(challenge, day)}
                        className={`w-full text-left p-2 rounded-lg cursor-pointer transition-all flex items-center justify-between gap-2 border ${
                          isSelected
                            ? 'bg-indigo-600/20 border-indigo-500/60 shadow-sm text-zinc-100'
                            : 'bg-zinc-900/40 hover:bg-zinc-800/60 border-transparent hover:border-zinc-800 text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {isSolved ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className={`text-xs font-medium truncate leading-snug ${isSelected ? 'text-white' : 'text-zinc-200'}`}>
                              {challenge.title}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[10px]">
                              <span
                                className={`text-[9px] px-1 py-0.2 rounded border font-mono ${getDifficultyBadge(
                                  challenge.difficulty
                                )}`}
                              >
                                {challenge.difficulty}
                              </span>
                              <span className="text-zinc-500 flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" />
                                {estTime}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Medal & Benchmark Target */}
                        <div className="flex items-center gap-1.5 shrink-0 text-right">
                          {medal && getMedalIcon(medal)}
                          <span className="text-[10px] font-mono text-zinc-500">
                            &lt;{challenge.benchmarkTargetMs}ms
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Cloud Auto-Sync Status Bar */}
      <div className="p-2.5 border-t border-zinc-800 bg-[#121216] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Cloud className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-zinc-200">Cloud Auto-Sync</span>
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            </div>
            <p className="text-[10px] font-mono text-zinc-500 truncate max-w-[140px]">
              {userProgress.syncKey || 'Active'}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenSync}
          className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 hover:text-white border border-zinc-700 rounded-lg text-[11px] font-medium transition shadow-xs flex items-center gap-1"
          title="Open Cloud State & Backup"
        >
          <span>Sync / Export</span>
        </button>
      </div>
    </aside>
  );
};

export default CurriculumNav;
