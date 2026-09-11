import React from 'react';
import {
  BookOpen,
  Code2,
  PanelsTopLeft,
  Bot,
  Cloud,
  Menu,
  Search,
  LogIn,
} from 'lucide-react';
import type { DayTrack, Challenge, LayoutMode, LibraryId } from '../types';

interface HeaderProps {
  currentDay: DayTrack;
  activeChallenge: Challenge;
  selectedLibrary?: LibraryId;
  layoutMode?: LayoutMode;
  onChangeLayout?: (mode: LayoutMode) => void;
  mentorOpen: boolean;
  onToggleMentor: () => void;
  onToggleSidebar: () => void;
  onOpenSearch: () => void;
  currentUser: { username: string; userId: string; token?: string } | null;
  onOpenAuth: () => void;
  onOpenSync?: () => void;
}

const getDifficultyBadge = (difficulty: string) => {
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

export const Header: React.FC<HeaderProps> = ({
  currentDay,
  activeChallenge,
  selectedLibrary: _selectedLibrary = 'python',
  layoutMode = 'guided',
  onChangeLayout,
  mentorOpen,
  onToggleMentor,
  onToggleSidebar,
  onOpenSearch,
  currentUser,
  onOpenAuth,
}) => {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const modKey = isMac ? '⌘' : 'Ctrl';

  return (
    <header className="h-13 border-b border-surface-border bg-surface-panel px-4 flex items-center justify-between select-none z-20 gap-3">
      {/* Left: Brand & Sidebar toggle & Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white bg-surface-elevated hover:bg-surface-hover border border-surface-border transition text-xs font-medium"
          title="Toggle Part 1–7 Curriculum (⌘B)"
        >
          <Menu className="w-4 h-4 text-accent-indigo" />
          <span>Curriculum</span>
        </button>

        {/* Brand Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-6 h-6 rounded-md bg-accent-indigo flex items-center justify-center text-white font-bold text-xs shadow-xs">
            Py
          </div>
          <span className="font-bold text-sm text-white tracking-tight hidden sm:inline">
            PyMastery
          </span>
        </div>

        {/* Breadcrumb: Part & Challenge */}
        <div className="h-4 w-px bg-surface-border mx-0.5 hidden md:block" />

        <div className="hidden md:flex items-center gap-2 text-xs min-w-0">
          <span className="text-zinc-400 font-medium whitespace-nowrap">
            Part {currentDay.partNumber || currentDay.dayNumber}: {currentDay.title.replace(/^Part\s+\d+:\s*/i, '').split('&')[0].trim()}
          </span>
          <span className="text-zinc-600">›</span>
          <span className="text-white font-semibold truncate max-w-[200px] lg:max-w-[280px]">
            {activeChallenge.title}
          </span>
          <span
            className={`text-[10px] font-mono px-2 py-0.2 rounded border uppercase shrink-0 ${getDifficultyBadge(
              activeChallenge.difficulty
            )}`}
          >
            {activeChallenge.difficulty}
          </span>
        </div>
      </div>

      {/* Center: View Switcher (Studio vs Full Guide vs Focus) */}
      {onChangeLayout && (
        <div className="flex items-center bg-surface-base border border-surface-border p-0.5 rounded-lg">
          <button
            onClick={() => onChangeLayout('guided')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition ${
              layoutMode === 'guided'
                ? 'bg-surface-elevated text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Split Studio: Problem & Code side-by-side (⌘1)"
          >
            <PanelsTopLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Studio</span>
          </button>

          <button
            onClick={() => onChangeLayout('masterclass')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition ${
              layoutMode === 'masterclass'
                ? 'bg-accent-indigo text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Full Part Guide & Masterclass (⌘3)"
          >
            <BookOpen
              className={`w-3.5 h-3.5 ${
                layoutMode === 'masterclass'
                  ? 'text-white'
                  : 'text-zinc-400 group-hover:text-zinc-200'
              }`}
            />
            <span className={layoutMode === 'masterclass' ? 'font-semibold text-white' : 'font-medium'}>
              Full Guide
            </span>
          </button>

          <button
            onClick={() => onChangeLayout('focus')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition ${
              layoutMode === 'focus'
                ? 'bg-surface-elevated text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Focus Code & Tests (⌘2)"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Focus</span>
          </button>
        </div>
      )}

      {/* Right: Global Search, AI Mentor & Sync */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Global Search / Command Palette */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-2.5 py-1.5 bg-surface-elevated hover:bg-surface-hover border border-surface-border rounded-lg text-xs text-zinc-400 hover:text-zinc-200 transition"
          title={`Global Search & Actions (${modKey}+K)`}
        >
          <Search className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden sm:inline text-zinc-300">Search</span>
          <kbd className="px-1.5 py-0.2 text-[10px] font-mono text-zinc-400 bg-surface-base border border-surface-border rounded">
            {modKey}K
          </kbd>
        </button>

        {/* AI Study Mentor Trigger */}
        <button
          onClick={onToggleMentor}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
            mentorOpen
              ? 'bg-accent-indigo text-white border-accent-indigo shadow-xs'
              : 'bg-accent-indigo/10 hover:bg-accent-indigo/20 text-accent-indigo border-accent-indigo/30'
          }`}
          title={`AI Study Mentor (${modKey}+/)`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">AI Mentor</span>
          <kbd className="hidden lg:inline px-1 py-0.2 text-[9px] font-mono opacity-80">
            {modKey}/
          </kbd>
        </button>

        <div className="h-4 w-px bg-surface-border hidden sm:block" />

        {/* User Account / Auth Button */}
        {currentUser ? (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 transition"
            title="Account Synced. Click to manage profile or log out."
          >
            <Cloud className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-medium max-w-[80px] sm:max-w-[110px] truncate">
              {currentUser.username}
            </span>
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-xl text-xs font-medium text-zinc-300 hover:text-zinc-100 transition shadow-xs"
            title="Sign In to PyMastery"
          >
            <LogIn className="w-3.5 h-3.5 text-zinc-400" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
