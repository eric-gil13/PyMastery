import React, { useState, useRef, useCallback } from 'react';
import {
  X,
  Cloud,
  Copy,
  Check,
  Download,
  Key,
  CheckCircle2,
  AlertCircle,
  FileJson,
  RefreshCw,
  UploadCloud,
  FileText,
} from 'lucide-react';
import type { UserProgress } from '../types';
import {
  exportProgressToJson,
  importProgressFromJson,
  generateSyncKey,
} from '../utils/storage';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProgress: UserProgress;
  onUpdateProgress: (newProgress: UserProgress) => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  userProgress,
  onUpdateProgress,
}) => {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showPasteArea, setShowPasteArea] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processJsonContent = useCallback((content: string) => {
    try {
      setImportError(null);
      const imported = importProgressFromJson(content);
      onUpdateProgress(imported);
      setImportSuccess(true);
      setTimeout(() => {
        setImportSuccess(false);
        onClose();
      }, 1400);
    } catch (err: any) {
      setImportError(err.message || 'Invalid PyMastery backup JSON file.');
    }
  }, [onClose, onUpdateProgress]);

  if (!isOpen) return null;

  const handleCopySyncKey = () => {
    navigator.clipboard.writeText(userProgress.syncKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleExportDownload = () => {
    const jsonStr = exportProgressToJson(userProgress);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pymastery-backup-${userProgress.syncKey}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyJson = () => {
    const jsonStr = exportProgressToJson(userProgress);
    navigator.clipboard.writeText(jsonStr);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleGenerateNewKey = () => {
    const newKey = generateSyncKey('USER');
    const updated: UserProgress = {
      ...userProgress,
      syncKey: newKey,
    };
    onUpdateProgress(updated);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      processJsonContent(content);
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (!file.name.endsWith('.json') && file.type !== 'application/json') {
        setImportError('Please drop a valid .json PyMastery backup file.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => {
        const content = evt.target?.result as string;
        processJsonContent(content);
      };
      reader.readAsText(file);
    }
  };

  const completedCount = userProgress.completedChallenges.length;
  const medalsCount = Object.keys(userProgress.medals || {}).length;
  const codeDraftsCount = Object.keys(userProgress.codeSubmissions || {}).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in text-zinc-100">
      <div className="w-full max-w-2xl bg-[#141419] border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-[#18181f]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-100 tracking-tight">
                  Cross-Device Sync & State Backup
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 rounded">
                  Cloud State
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Transfer your solutions, benchmark medals, and notes across laptops and desktops.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-sm text-zinc-300 custom-scrollbar">
          {/* Section 1: 1-Click Sync Key Generator */}
          <div className="p-4 rounded-xl bg-[#18181e] border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-zinc-200 uppercase tracking-wide">
                  Device Unique Sync Key
                </span>
              </div>
              <button
                onClick={handleGenerateNewKey}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition font-medium"
                title="Generate a fresh sync key"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>1-Click Generate Key</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 bg-[#101014] border border-zinc-750 rounded-xl px-4 py-2.5 font-mono text-sm font-bold text-indigo-300 tracking-wider select-all shadow-inner">
                {userProgress.syncKey}
              </div>
              <button
                onClick={handleCopySyncKey}
                className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition shrink-0"
              >
                {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
              </button>
            </div>

            <p className="text-[11px] text-zinc-400">
              Format: <code className="text-indigo-300 font-mono">PYM-XXXX-USER-2026</code>. Use this key to pair instances across your workstations.
            </p>
          </div>

          {/* Section 2: 1-Click State Export */}
          <div className="p-4 rounded-xl bg-[#18181e] border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-zinc-200 uppercase tracking-wide">
                  1-Click State Export
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400">
                <span>{completedCount} solved</span>
                <span>•</span>
                <span>{medalsCount} medals</span>
                <span>•</span>
                <span>{codeDraftsCount} drafts</span>
              </div>
            </div>

            <p className="text-xs text-zinc-400">
              Export all your written code solutions, test history, custom notes, and earned benchmark medals into an offline JSON snapshot.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={handleExportDownload}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-emerald-950/40"
              >
                <FileJson className="w-4 h-4" />
                <span>Download .JSON Backup File</span>
              </button>
              <button
                onClick={handleCopyJson}
                className="py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition shrink-0"
              >
                {copiedJson ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedJson ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>
          </div>

          {/* Section 3: Drag-and-Drop JSON Import */}
          <div className="p-4 rounded-xl bg-[#18181e] border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-zinc-200 uppercase tracking-wide">
                  Drag-and-Drop JSON Import
                </span>
              </div>
              <button
                onClick={() => setShowPasteArea(!showPasteArea)}
                className="text-[11px] text-zinc-400 hover:text-amber-300 transition flex items-center gap-1"
              >
                <FileText className="w-3 h-3" />
                <span>{showPasteArea ? 'Hide Text Area' : 'Paste JSON Text'}</span>
              </button>
            </div>

            {/* Interactive Dropzone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 ${
                isDragging
                  ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
                  : 'border-zinc-700 hover:border-amber-500/60 bg-[#101014]/60 hover:bg-zinc-900/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className={`p-3 rounded-full ${isDragging ? 'bg-amber-400/20 text-amber-300' : 'bg-zinc-800 text-zinc-400'}`}>
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-200">
                  {isDragging ? 'Drop your JSON backup file here' : 'Drop your PyMastery JSON backup file here'}
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  or <span className="text-amber-400 underline font-medium">browse from your computer</span>
                </p>
              </div>
            </div>

            {/* Paste JSON Fallback Textarea */}
            {showPasteArea && (
              <div className="space-y-2 pt-1 animate-fade-in">
                <textarea
                  rows={3}
                  placeholder="Paste PyMastery backup JSON content here..."
                  value={importJsonText}
                  onChange={(e) => {
                    setImportJsonText(e.target.value);
                    setImportError(null);
                  }}
                  className="w-full bg-[#101014] border border-zinc-750 rounded-xl p-3 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500 custom-scrollbar"
                />
                <button
                  onClick={() => processJsonContent(importJsonText)}
                  disabled={!importJsonText.trim()}
                  className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-zinc-950 font-bold text-xs transition"
                >
                  Restore & Merge Pasted JSON
                </button>
              </div>
            )}

            {importError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2.5 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {importSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Progress, solutions, and medals successfully restored! Closing...</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-[#141418] flex items-center justify-between text-xs text-zinc-400">
          <span>Last local backup: {new Date(userProgress.lastSyncedAt || Date.now()).toLocaleDateString()}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SyncModal;
