import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { CURRICULUM_DATA, LIBRARY_CURRICULA } from './data/curriculumData';
import type {
  DayTrack,
  Challenge,
  UserProgress,
  ExecutionResponse,
  Medal,
  LayoutMode,
  LibraryId,
} from './types';
import {
  loadUserProgress,
  saveUserProgress,
} from './utils/storage';
import {
  executeCodeApi,
} from './services/api';

import Header from './components/Header';
import CurriculumNav from './components/CurriculumNav';
import CodeWorkspace from './components/CodeWorkspace';
import InspectionDeck from './components/InspectionDeck';
import ConceptPrimer from './components/ConceptPrimer';
import AIMentorPanel from './components/AIMentorPanel';
import AuthModal from './components/AuthModal';
import SyncModal from './components/SyncModal';
import CommandPaletteModal from './components/CommandPaletteModal';
import StudyMasterclassCanvas from './components/StudyMasterclassCanvas';
import ChallengeIntuitionPanel from './components/ChallengeIntuitionPanel';

export function App() {
  // Curriculum & Active Challenge State
  const [selectedLibrary, setSelectedLibrary] = useState<LibraryId>('numpy');
  const curriculum = LIBRARY_CURRICULA[selectedLibrary] || CURRICULUM_DATA;
  const [currentDay, setCurrentDay] = useState<DayTrack>(CURRICULUM_DATA[0]);
  const [activeChallenge, setActiveChallenge] = useState<Challenge>(
    CURRICULUM_DATA[0].challenges[0]
  );

  // 3 Studio Layout Modes: 'guided' | 'focus' | 'masterclass'
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('guided');

  // User Code State (keyed by challenge.id)
  const [userCodeMap, setUserCodeMap] = useState<Record<string, string>>({});
  const [currentCode, setCurrentCode] = useState<string>(activeChallenge.starterCode);

  // User Progress & Auth State
  const [userProgress, setUserProgress] = useState<UserProgress>(loadUserProgress);
  const [currentUser, setCurrentUser] = useState<{ username: string; userId: string; token?: string } | null>(null);

  // Execution & Testing State
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResponse | null>(null);

  // UI Modals & Drawers
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mentorOpen, setMentorOpen] = useState(false);
  const [primerOpen, setPrimerOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const autoSaveTimerRef = useRef<any>(null);

  // 1. Initial Load & Auth Restore
  useEffect(() => {
    const loaded = loadUserProgress();
    setUserProgress(loaded);

    // Initialize code map with saved code or starter code
    const initialCodeMap: Record<string, string> = { ...loaded.codeSubmissions };
    curriculum.forEach((day) => {
      day.challenges.forEach((ch) => {
        if (!initialCodeMap[ch.id]) {
          initialCodeMap[ch.id] = ch.starterCode;
        }
      });
    });
    setUserCodeMap(initialCodeMap);
    setCurrentCode(initialCodeMap[activeChallenge.id] || activeChallenge.starterCode);

    // Check stored user token
    const storedAuth = localStorage.getItem('pymastery_auth');
    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth);
        setCurrentUser(parsed);
        fetch(`http://localhost:8000/api/user/state?user_id=${parsed.userId}`, {
          headers: { Authorization: `Bearer ${parsed.token}` },
        })
          .then((r) => r.json())
          .then((remote) => {
            if (remote && remote.drafts) {
              setUserCodeMap((prev) => ({ ...prev, ...remote.drafts }));
              if (remote.drafts[activeChallenge.id]) {
                setCurrentCode(remote.drafts[activeChallenge.id]);
              }
            }
          })
          .catch(() => {});
      } catch {}
    }
  }, []);

  // 2. Switch Challenge
  const handleSelectChallenge = useCallback(
    (challenge: Challenge, day: DayTrack) => {
      setUserCodeMap((prev) => ({
        ...prev,
        [activeChallenge.id]: currentCode,
      }));

      setCurrentDay(day);
      setActiveChallenge(challenge);
      const nextCode = userCodeMap[challenge.id] || challenge.starterCode;
      setCurrentCode(nextCode);
      setExecutionResult(null);
    },
    [activeChallenge.id, currentCode, userCodeMap]
  );

  // 3. Switch Track
  const handleSelectTrack = useCallback(
    (day: DayTrack) => {
      setCurrentDay(day);
      if (day.challenges.length > 0) {
        const firstChallenge = day.challenges[0];
        handleSelectChallenge(firstChallenge, day);
      }
    },
    [handleSelectChallenge]
  );

  // 3b. Switch Library Focus (NumPy, Pandas, Matplotlib, Scikit-Learn, PyTorch)
  const handleSelectLibrary = useCallback(
    (lib: LibraryId) => {
      setSelectedLibrary(lib);
      const libTracks = LIBRARY_CURRICULA[lib];
      if (libTracks && libTracks.length > 0) {
        const firstTrack = libTracks[0];
        setCurrentDay(firstTrack);
        if (firstTrack.challenges && firstTrack.challenges.length > 0) {
          handleSelectChallenge(firstTrack.challenges[0], firstTrack);
        }
      }
    },
    [handleSelectChallenge]
  );

  // 3c. Next Problem Navigation (Issue 1)
  const allChallengesWithTrack = useMemo(() => {
    const list: { challenge: Challenge; track: DayTrack }[] = [];
    for (const track of curriculum) {
      for (const ch of track.challenges) {
        list.push({ challenge: ch, track });
      }
    }
    return list;
  }, [curriculum]);

  const currentChallengeIndex = allChallengesWithTrack.findIndex(
    (item) => item.challenge.id === activeChallenge.id
  );
  const hasNextProblem =
    currentChallengeIndex >= 0 &&
    currentChallengeIndex < allChallengesWithTrack.length - 1;

  const handleNextProblem = useCallback(() => {
    if (
      currentChallengeIndex >= 0 &&
      currentChallengeIndex < allChallengesWithTrack.length - 1
    ) {
      const next = allChallengesWithTrack[currentChallengeIndex + 1];
      handleSelectChallenge(next.challenge, next.track);
    }
  }, [currentChallengeIndex, allChallengesWithTrack, handleSelectChallenge]);

  const testsPassed = Boolean(
    executionResult?.testResults &&
    executionResult.testResults.length > 0 &&
    executionResult.testResults.every((t) => t.passed)
  );

  // 4. Auto-save code edits to backend & localStorage
  const handleCodeChange = useCallback(
    (newCode: string) => {
      setCurrentCode(newCode);
      setUserCodeMap((prev) => ({
        ...prev,
        [activeChallenge.id]: newCode,
      }));

      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        const updated = {
          ...userProgress,
          codeSubmissions: {
            ...userProgress.codeSubmissions,
            [activeChallenge.id]: newCode,
          },
        };
        saveUserProgress(updated);

        fetch('http://localhost:8000/api/user/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(currentUser?.token ? { Authorization: `Bearer ${currentUser.token}` } : {}),
          },
          body: JSON.stringify({
            user_id: currentUser?.userId || 'default_user',
            challenge_id: activeChallenge.id,
            code: newCode,
          }),
        }).catch(() => {});
      }, 800);
    },
    [activeChallenge.id, currentUser, userProgress]
  );

  // 5. Run Code in Sandbox Mode
  const handleRunCode = useCallback(async () => {
    if (isRunningCode || isRunning || isSubmitting) return;
    setIsRunningCode(true);

    try {
      const resp = await executeCodeApi(activeChallenge, currentCode, 'run');
      setExecutionResult(resp);
    } catch (err: any) {
      setExecutionResult({
        success: false,
        stdout: '',
        stderr: err.message || 'Execution error',
        errorTraceback: err.message || 'Failed to execute',
        testsTotal: 0,
        testsPassed: 0,
        testResults: [],
        performance: {
          userExecutionMs: 0,
          benchmarkTargetMs: activeChallenge.benchmarkTargetMs,
          memoryUsageMb: 0,
          medal: 'none',
        },
      });
    } finally {
      setIsRunningCode(false);
    }
  }, [activeChallenge, currentCode, isRunningCode, isRunning, isSubmitting]);

  // 6. Run Code Tests
  const handleRunTests = useCallback(async () => {
    if (isRunningCode || isRunning || isSubmitting) return;
    setIsRunning(true);

    try {
      const resp = await executeCodeApi(activeChallenge, currentCode, 'test');
      setExecutionResult(resp);

      if (resp.testResults && resp.testResults.length > 0 && resp.testResults.every((t) => t.passed)) {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
        });

        if (!userProgress.completedChallenges.includes(activeChallenge.id)) {
          const updated = {
            ...userProgress,
            completedChallenges: [...userProgress.completedChallenges, activeChallenge.id],
          };
          setUserProgress(updated);
          saveUserProgress(updated);
        }
      }
    } catch (err: any) {
      setExecutionResult({
        success: false,
        stdout: '',
        stderr: err.message || 'Execution error',
        errorTraceback: err.message || 'Failed to execute',
        testsTotal: 0,
        testsPassed: 0,
        testResults: [],
        performance: {
          userExecutionMs: 0,
          benchmarkTargetMs: activeChallenge.benchmarkTargetMs,
          memoryUsageMb: 0,
          medal: 'none',
        },
      });
    } finally {
      setIsRunning(false);
    }
  }, [activeChallenge, currentCode, isRunningCode, isRunning, isSubmitting, userProgress]);

  // 7. Submit & Benchmark Execution
  const handleSubmitBenchmark = useCallback(async () => {
    if (isRunningCode || isRunning || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const resp = await executeCodeApi(activeChallenge, currentCode, 'benchmark');
      setExecutionResult(resp);

      if (resp.testResults && resp.testResults.length > 0 && resp.testResults.every((t) => t.passed)) {
        const medal: Medal = resp.performance?.medal || (resp.performance.userExecutionMs <= activeChallenge.benchmarkTargetMs ? 'gold' : 'silver');

        if (medal === 'gold') {
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.7 },
            colors: ['#00E599', '#FDE047', '#38BDF8', '#818CF8'],
          });
        } else {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.8 },
          });
        }

        const updated: UserProgress = {
          ...userProgress,
          completedChallenges: userProgress.completedChallenges.includes(activeChallenge.id)
            ? userProgress.completedChallenges
            : [...userProgress.completedChallenges, activeChallenge.id],
          medals: {
            ...userProgress.medals,
            [activeChallenge.id]: medal,
          },
        };
        setUserProgress(updated);
        saveUserProgress(updated);
      }
    } catch (err: any) {
      setExecutionResult({
        success: false,
        stdout: '',
        stderr: err.message || 'Benchmark error',
        errorTraceback: err.message || 'Benchmark failed',
        testsTotal: 0,
        testsPassed: 0,
        testResults: [],
        performance: {
          userExecutionMs: 0,
          benchmarkTargetMs: activeChallenge.benchmarkTargetMs,
          memoryUsageMb: 0,
          medal: 'none',
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [activeChallenge, currentCode, isRunningCode, isRunning, isSubmitting, userProgress]);

  // 7. Reset Code
  const handleResetActiveCode = useCallback(() => {
    if (window.confirm(`Reset code for "${activeChallenge.title}" to clean starter boilerplate?`)) {
      handleCodeChange(activeChallenge.starterCode);
    }
  }, [activeChallenge, handleCodeChange]);

  // 8. Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      // ⌘+K / Ctrl+K: Command Palette
      if (isCmdOrCtrl && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
      // ⌘+/ / Ctrl+/: Toggle AI Mentor
      else if (isCmdOrCtrl && e.key === '/') {
        e.preventDefault();
        setMentorOpen((prev) => !prev);
      }
      // ⌘+1: Guided Mode
      else if (isCmdOrCtrl && e.key === '1') {
        e.preventDefault();
        setLayoutMode('guided');
      }
      // ⌘+2: Focus Code Mode
      else if (isCmdOrCtrl && e.key === '2') {
        e.preventDefault();
        setLayoutMode('focus');
      }
      // ⌘+3: Masterclass Mode
      else if (isCmdOrCtrl && e.key === '3') {
        e.preventDefault();
        setLayoutMode('masterclass');
      }
      // ⌘+B: Toggle Sidebar
      else if (isCmdOrCtrl && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
      }
      // ⌘+Shift+Enter: Submit & Benchmark
      else if (isCmdOrCtrl && e.shiftKey && e.key === 'Enter') {
        e.preventDefault();
        handleSubmitBenchmark();
      }
      // ⌘+Enter: Run Tests
      else if (isCmdOrCtrl && !e.shiftKey && e.key === 'Enter') {
        e.preventDefault();
        handleRunTests();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRunTests, handleSubmitBenchmark]);

  // 9. Auth Success Handler
  const handleAuthSuccess = (token: string, userId: string, username: string) => {
    const authData = { token, userId, username };
    setCurrentUser(authData);
    localStorage.setItem('pymastery_auth', JSON.stringify(authData));

    fetch(`http://localhost:8000/api/user/state?user_id=${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((remote) => {
        if (remote && remote.drafts) {
          setUserCodeMap((prev) => ({ ...prev, ...remote.drafts }));
          if (remote.drafts[activeChallenge.id]) {
            setCurrentCode(remote.drafts[activeChallenge.id]);
          }
        }
      })
      .catch(() => {});
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('pymastery_auth');
  };

  return (
    <div className="h-screen w-screen bg-surface-base text-zinc-100 flex flex-col overflow-hidden font-sans select-none">
      {/* Studio Header */}
      <Header
        currentDay={currentDay}
        activeChallenge={activeChallenge}
        selectedLibrary={selectedLibrary}
        layoutMode={layoutMode}
        onChangeLayout={setLayoutMode}
        mentorOpen={mentorOpen}
        onToggleMentor={() => setMentorOpen(!mentorOpen)}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onOpenSearch={() => setCommandPaletteOpen(true)}
        currentUser={currentUser}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenSync={() => setSyncModalOpen(true)}
      />

      {/* Main Studio Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Slide-Over Curriculum Navigator (Part 1 - 7) */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 flex">
            {/* Dark Backdrop */}
            <div
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
            />
            {/* Drawer Content */}
            <div className="relative z-50 w-80 max-w-[85vw] h-full shadow-2xl animate-in slide-in-from-left duration-200">
              <CurriculumNav
                curriculum={curriculum}
                currentDay={currentDay}
                activeChallenge={activeChallenge}
                userProgress={userProgress}
                selectedLibrary={selectedLibrary}
                onSelectLibrary={handleSelectLibrary}
                onSelectChallenge={(ch, d) => {
                  handleSelectChallenge(ch, d);
                  setSidebarOpen(false);
                }}
                onOpenPrimer={(challenge) => {
                  if (challenge) setActiveChallenge(challenge);
                  setPrimerOpen(true);
                }}
                onOpenSync={() => setSyncModalOpen(true)}
              />
            </div>
          </div>
        )}

        {/* Center: Main Multi-Mode Canvas */}
        <main className="flex-1 flex flex-col min-w-0 bg-surface-base overflow-hidden">
          {layoutMode === 'masterclass' ? (
            /* 1. MASTERCLASS MODE: Full Interactive Masterclass Canvas */
            <StudyMasterclassCanvas
              currentDay={currentDay}
              activeChallenge={activeChallenge}
              onSwitchToCode={() => setLayoutMode('guided')}
            />
          ) : layoutMode === 'guided' ? (
            /* 2. GUIDED SPLIT STUDIO: Left Problem & Visualizer Deck (50%) + Right Editor & Tests (50%) */
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              {/* Left Column: Problem, Intuition, Interactive Lab, Masterclass Tabs */}
              <div className="w-full lg:w-[48%] xl:w-[45%] flex flex-col border-b lg:border-b-0 lg:border-r border-surface-border bg-surface-panel overflow-hidden shrink-0">
                <ChallengeIntuitionPanel
                  challenge={activeChallenge}
                  currentDay={currentDay}
                  onOpenStudyMasterclass={() => setLayoutMode('masterclass')}
                  onOpenPrimer={() => setPrimerOpen(true)}
                  onOpenMentor={() => setMentorOpen(true)}
                  onInsertStarterSnippet={(snip: string) => handleCodeChange(snip)}
                />
              </div>

              {/* Right Column: Code Workspace (Top) + Inspection Deck (Bottom) */}
              <div className="flex-1 flex flex-col min-w-0 bg-surface-base overflow-hidden">
                {/* Code Workspace */}
                <div className="flex-1 flex flex-col min-h-[280px] border-b border-surface-border overflow-hidden">
                  <CodeWorkspace
                    challenge={activeChallenge}
                    code={currentCode}
                    onChangeCode={handleCodeChange}
                    onRunCode={handleRunCode}
                    onRun={handleRunTests}
                    onSubmit={handleSubmitBenchmark}
                    isRunningCode={isRunningCode}
                    isRunning={isRunning}
                    isSubmitting={isSubmitting}
                    onOpenPrimer={() => setPrimerOpen(true)}
                    onNextProblem={handleNextProblem}
                    hasNextProblem={hasNextProblem}
                    testsPassed={testsPassed}
                  />
                </div>

                {/* Inspection Deck */}
                <div className="h-[280px] lg:h-[320px] flex flex-col bg-surface-panel shrink-0 overflow-hidden">
                  <InspectionDeck
                    challenge={activeChallenge}
                    executionResult={executionResult}
                    isRunning={isRunningCode || isRunning || isSubmitting}
                    onOpenMentor={() => setMentorOpen(true)}
                    onNextProblem={handleNextProblem}
                    hasNextProblem={hasNextProblem}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* 3. FOCUS CODE MODE: Full Editor (Top) + Inspection Deck (Bottom) */
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Maximized Editor */}
              <div className="flex-1 flex flex-col min-w-0 border-b border-surface-border overflow-hidden">
                <CodeWorkspace
                  challenge={activeChallenge}
                  code={currentCode}
                  onChangeCode={handleCodeChange}
                  onRunCode={handleRunCode}
                  onRun={handleRunTests}
                  onSubmit={handleSubmitBenchmark}
                  isRunningCode={isRunningCode}
                  isRunning={isRunning}
                  isSubmitting={isSubmitting}
                  onOpenPrimer={() => setPrimerOpen(true)}
                  onNextProblem={handleNextProblem}
                  hasNextProblem={hasNextProblem}
                  testsPassed={testsPassed}
                />
              </div>

              {/* Inspection Deck */}
              <div className="h-[300px] lg:h-[340px] flex flex-col bg-surface-panel shrink-0 overflow-hidden">
                <InspectionDeck
                  challenge={activeChallenge}
                  executionResult={executionResult}
                  isRunning={isRunningCode || isRunning || isSubmitting}
                  onOpenMentor={() => setMentorOpen(true)}
                  onNextProblem={handleNextProblem}
                  hasNextProblem={hasNextProblem}
                />
              </div>
            </div>
          )}
        </main>

        {/* Dedicated Socratic AI Study Mentor Panel */}
        <AIMentorPanel
          isOpen={mentorOpen}
          onClose={() => setMentorOpen(false)}
          challenge={activeChallenge}
          currentCode={currentCode}
          executionResult={executionResult}
          onApplyCode={handleCodeChange}
        />
      </div>

      {/* Concept Primer Modal */}
      {primerOpen && (
        <ConceptPrimer
          isOpen={primerOpen}
          onClose={() => setPrimerOpen(false)}
          primerData={activeChallenge.conceptPrimer}
        />
      )}

      {/* Global Command Palette Modal (⌘+K / Ctrl+K) */}
      <CommandPaletteModal
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        curriculum={curriculum}
        currentDay={currentDay}
        activeChallenge={activeChallenge}
        userProgress={userProgress}
        layoutMode={layoutMode}
        onSelectChallenge={handleSelectChallenge}
        onSelectTrack={handleSelectTrack}
        onOpenPrimer={(challenge) => {
          if (challenge) setActiveChallenge(challenge);
          setPrimerOpen(true);
        }}
        onRunTests={handleRunTests}
        onRunBenchmark={handleSubmitBenchmark}
        onResetCode={handleResetActiveCode}
        onToggleMentor={() => setMentorOpen((prev) => !prev)}
        onSetLayout={setLayoutMode}
        onOpenSync={() => setSyncModalOpen(true)}
        onOpenAuth={() => setAuthModalOpen(true)}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
      />

      {/* Cloud & Device Sync Modal */}
      <SyncModal
        isOpen={syncModalOpen}
        onClose={() => setSyncModalOpen(false)}
        userProgress={userProgress}
        onUpdateProgress={(newProgress) => {
          setUserProgress(newProgress);
          saveUserProgress(newProgress);
          if (newProgress.codeSubmissions[activeChallenge.id]) {
            setCurrentCode(newProgress.codeSubmissions[activeChallenge.id]);
          }
        }}
      />

      {/* User Login & Auto-Sync Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        currentUser={currentUser}
        onLogout={handleLogout}
        userProgress={userProgress}
        onUpdateProgress={(newProgress) => {
          setUserProgress(newProgress);
          saveUserProgress(newProgress);
        }}
      />
    </div>
  );
}

export default App;
