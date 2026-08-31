import React, { useState, useRef } from 'react';
import {
  User,
  Lock,
  X,
  LogIn,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Cloud,
  Key,
  Copy,
  Check,
  UploadCloud,
  RefreshCw,
} from 'lucide-react';
import type { UserProgress } from '../types';
import { generateSyncKey, importProgressFromJson } from '../utils/storage';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (token: string, userId: string, username: string) => void;
  currentUser?: { username: string; userId: string; token?: string } | null;
  onLogout: () => void;
  userProgress?: UserProgress;
  onUpdateProgress?: (newProgress: UserProgress) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  currentUser,
  onLogout,
  userProgress,
  onUpdateProgress,
}) => {
  const [activeTab, setActiveTab] = useState<'account' | 'synckey'>('account');
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const endpoint = isLogin ? 'http://localhost:8000/api/auth/login' : 'http://localhost:8000/api/auth/register';

    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.detail || data.message || 'Authentication failed');
      }

      setSuccessMsg(isLogin ? `Welcome back, ${data.username}!` : `Account created! Logged in as ${data.username}`);
      setTimeout(() => {
        onAuthSuccess(data.token, data.user_id, data.username);
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error connecting to backend');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySyncKey = () => {
    const key = userProgress?.syncKey || generateSyncKey(currentUser?.username || 'USER');
    navigator.clipboard.writeText(key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleGenerateNewKey = () => {
    if (!onUpdateProgress || !userProgress) return;
    const newKey = generateSyncKey(currentUser?.username || 'USER');
    const updated: UserProgress = {
      ...userProgress,
      syncKey: newKey,
    };
    onUpdateProgress(updated);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleDropJson = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!onUpdateProgress) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const content = evt.target?.result as string;
          const imported = importProgressFromJson(content);
          onUpdateProgress(imported);
          setSuccessMsg('State and code solutions successfully restored from JSON!');
          setTimeout(() => {
            setSuccessMsg(null);
            onClose();
          }, 1400);
        } catch (err: any) {
          setErrorMsg(err.message || 'Invalid JSON file');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateProgress) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const content = evt.target?.result as string;
        const imported = importProgressFromJson(content);
        onUpdateProgress(imported);
        setSuccessMsg('State and code solutions successfully restored from JSON!');
        setTimeout(() => {
          setSuccessMsg(null);
          onClose();
        }, 1400);
      } catch (err: any) {
        setErrorMsg(err.message || 'Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  const currentSyncKey = userProgress?.syncKey || 'PYM-7821-USER-2026';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in text-zinc-100">
      <div className="bg-[#16161b] border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-100 p-1.5 rounded-lg hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Tabs */}
        <div className="flex border-b border-zinc-800 mb-5 gap-4">
          <button
            onClick={() => setActiveTab('account')}
            className={`pb-2.5 text-xs font-semibold transition border-b-2 ${
              activeTab === 'account'
                ? 'border-indigo-500 text-indigo-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {currentUser ? 'Student Account' : 'Account Login / Sign Up'}
          </button>
          <button
            onClick={() => setActiveTab('synckey')}
            className={`pb-2.5 text-xs font-semibold transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'synckey'
                ? 'border-indigo-500 text-indigo-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>1-Click Sync Key & JSON</span>
          </button>
        </div>

        {activeTab === 'account' ? (
          currentUser ? (
            <div className="text-center py-3 space-y-4">
              <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20 shadow-md">
                <Cloud className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-100">Account Synced</h2>
                <p className="text-sm text-zinc-400 mt-1">
                  Logged in as <span className="font-semibold text-emerald-400">{currentUser.username}</span>
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Your study progress and code auto-sync to all your connected devices.
                </p>
              </div>

              {/* Sync Key Quick Card */}
              <div className="p-3 bg-[#101014] border border-zinc-800 rounded-xl text-left space-y-1.5">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-semibold">Associated Device Sync Key</span>
                  <button
                    onClick={handleCopySyncKey}
                    className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-[11px]"
                  >
                    {copiedKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="font-mono text-xs font-bold text-indigo-300">
                  {currentSyncKey}
                </div>
              </div>

              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="w-full py-2.5 px-4 bg-zinc-800 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 border border-zinc-700 rounded-xl text-sm font-medium transition text-zinc-300"
              >
                Sign Out on this Device
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-500/20 shrink-0">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-zinc-100">
                    {isLogin ? 'Sign In to Sync' : 'Create Student Account'}
                  </h2>
                  <p className="text-xs text-zinc-400">
                    {isLogin
                      ? 'Continue your Part 1–7 progress from any computer.'
                      : 'Sync your code, lessons, and notes across all your devices.'}
                  </p>
                </div>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2.5 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2.5 text-emerald-300 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Username</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. senior_dev"
                      className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : isLogin ? (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Sign In & Sync</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Create Account & Start</span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-4 pt-3 border-t border-zinc-800/80 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-xs text-zinc-400 hover:text-indigo-400 transition"
                >
                  {isLogin ? "Don't have an account? Create one" : 'Already have an account? Sign In'}
                </button>
              </div>
            </div>
          )
        ) : (
          /* 1-Click Sync Key & JSON Drag-and-Drop View */
          <div className="space-y-4">
            <div className="p-3.5 bg-[#121217] border border-zinc-800 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-zinc-200 uppercase tracking-wide">
                    1-Click Sync Key Generator
                  </span>
                </div>
                {onUpdateProgress && (
                  <button
                    onClick={handleGenerateNewKey}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>New Key</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 bg-[#0d0d10] border border-zinc-750 rounded-xl px-3.5 py-2 font-mono text-xs font-bold text-indigo-300 tracking-wider">
                  {currentSyncKey}
                </div>
                <button
                  onClick={handleCopySyncKey}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-semibold text-zinc-200 rounded-xl flex items-center gap-1"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Drag & Drop JSON */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDropJson}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-indigo-400 bg-indigo-500/10'
                  : 'border-zinc-700 hover:border-indigo-500/60 bg-[#101014]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
              <UploadCloud className="w-6 h-6 text-indigo-400 mx-auto mb-1" />
              <p className="text-xs font-semibold text-zinc-200">
                Drag-and-Drop Backup JSON File
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                or click to browse from device
              </p>
            </div>

            {successMsg && (
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
