import type { UserProgress, LibraryId } from '../types';

const STORAGE_KEY = 'pymastery_user_progress_v1';
const ACTIVE_SESSION_KEY = 'pymastery_active_session_v1';

export function generateSyncKey(userTag = 'USER'): string {
  const digits = '0123456789';
  let randDigits = '';
  for (let i = 0; i < 4; i++) {
    randDigits += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  const cleanTag = userTag.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'USER';
  const currentYear = new Date().getFullYear();
  return `PYM-${randDigits}-${cleanTag}-${currentYear}`;
}

export function loadUserProgress(): UserProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.syncKey) {
        parsed.syncKey = generateSyncKey();
      }
      return {
        completedChallenges: parsed.completedChallenges || [],
        medals: parsed.medals || {},
        codeSubmissions: parsed.codeSubmissions || {},
        syncKey: parsed.syncKey,
        lastSyncedAt: parsed.lastSyncedAt,
        customNotes: parsed.customNotes || {},
      };
    }
  } catch (e) {
    console.warn('Failed to load user progress from localStorage:', e);
  }

  const defaultProgress: UserProgress = {
    completedChallenges: [],
    medals: {},
    codeSubmissions: {},
    syncKey: generateSyncKey(),
    lastSyncedAt: new Date().toISOString(),
    customNotes: {},
  };
  saveUserProgress(defaultProgress);
  return defaultProgress;
}

export function saveUserProgress(progress: UserProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save user progress:', e);
  }
}

export function exportProgressToJson(progress: UserProgress): string {
  return JSON.stringify(
    {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      data: progress,
    },
    null,
    2
  );
}

export function importProgressFromJson(jsonString: string): UserProgress {
  const parsed = JSON.parse(jsonString);
  const data = parsed.data || parsed;
  if (!data.syncKey && !data.completedChallenges) {
    throw new Error('Invalid PyMastery backup file format');
  }

  const validProgress: UserProgress = {
    completedChallenges: Array.isArray(data.completedChallenges) ? data.completedChallenges : [],
    medals: (data.medals && typeof data.medals === 'object') ? data.medals : {},
    codeSubmissions: (data.codeSubmissions && typeof data.codeSubmissions === 'object') ? data.codeSubmissions : {},
    syncKey: typeof data.syncKey === 'string' ? data.syncKey : generateSyncKey(),
    lastSyncedAt: new Date().toISOString(),
    customNotes: (data.customNotes && typeof data.customNotes === 'object') ? data.customNotes : {},
  };

  saveUserProgress(validProgress);
  return validProgress;
}

export interface ActiveSessionState {
  libraryId: LibraryId;
  dayId: number;
  challengeId: string;
}

export function saveActiveSession(session: ActiveSessionState): void {
  try {
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
  } catch (e) {
    console.error('Failed to save active session:', e);
  }
}

export function loadActiveSession(): ActiveSessionState | null {
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.libraryId && parsed.dayId !== undefined && parsed.challengeId) {
        return parsed as ActiveSessionState;
      }
    }
  } catch (e) {
    console.warn('Failed to load active session:', e);
  }
  return null;
}
