import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  X,
  Zap,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  BookOpen,
  Settings,
  Key,
} from 'lucide-react';
import type { Challenge, ChatMessage, ExecutionResponse } from '../types';
import ChatMessageRenderer from './ChatMessageRenderer';
import { API_BASE_URL, testAiConnectionApi } from '../services/api';

interface AIMentorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  challenge: Challenge;
  currentCode: string;
  executionResult: ExecutionResponse | null;
  onApplyCode?: (code: string) => void;
}

export const AIMentorPanel: React.FC<AIMentorPanelProps> = ({
  isOpen,
  onClose,
  challenge,
  currentCode,
  executionResult,
  onApplyCode,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content: `Hey! I'm your Socratic Senior Mentor pairing with you on **${challenge.title}**.\n\nI can help you build intuition around array broadcasting, zero-copy memory views, autograd mathematics, and C-level optimization.\n\nClick any quick prompt below or ask me anything!`,
      timestamp: 'Just now',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [byokKey, setByokKey] = useState(() => localStorage.getItem('pymastery_byok_key') || '');
  const [byokProvider, setByokProvider] = useState(() => localStorage.getItem('pymastery_byok_provider') || 'auto');
  const [byokModel, setByokModel] = useState(() => {
    const saved = localStorage.getItem('pymastery_byok_model') || '';
    return (saved === 'gemini-2.5-flash' || saved === 'gemini-2.5') ? 'gemini-3.6-flash' : saved;
  });
  const [byokBaseUrl, setByokBaseUrl] = useState(() => localStorage.getItem('pymastery_byok_base_url') || '');
  const [lastApiError, setLastApiError] = useState<string | null>(null);
  const [testState, setTestState] = useState<{
    loading: boolean;
    success: boolean | null;
    message: string | null;
  }>({ loading: false, success: null, message: null });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const saveAiSettings = (key: string, provider: string, model: string, baseUrl: string = byokBaseUrl) => {
    setByokKey(key);
    setByokProvider(provider);
    setByokModel(model);
    setByokBaseUrl(baseUrl);
    localStorage.setItem('pymastery_byok_key', key);
    localStorage.setItem('pymastery_byok_provider', provider);
    localStorage.setItem('pymastery_byok_model', model);
    localStorage.setItem('pymastery_byok_base_url', baseUrl);
  };

  const handleTestConnection = async () => {
    if (!byokKey.trim() && byokProvider !== 'custom') {
      setTestState({
        loading: false,
        success: false,
        message: 'Please enter an API key first.',
      });
      return;
    }
    setTestState({ loading: true, success: null, message: null });
    try {
      const res = await testAiConnectionApi(byokKey, byokProvider, byokModel, byokBaseUrl);
      setTestState({
        loading: false,
        success: res.success,
        message: res.message,
      });
      if (res.success) {
        setLastApiError(null);
      }
    } catch (err: any) {
      setTestState({
        loading: false,
        success: false,
        message: err?.message || 'Connection failed',
      });
    }
  };


  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Reset or update greeting when challenge changes
  useEffect(() => {
    setMessages([
      {
        id: `init-${challenge.id}`,
        role: 'assistant',
        content: `Hey! Ready to master **${challenge.title}** (${challenge.category})?\n\nTarget latency is **<${challenge.benchmarkTargetMs}ms**. What concept or mathematical step can we unpack together?`,
        timestamp: 'Just now',
      },
    ]);
  }, [challenge.id]);

  if (!isOpen) return null;

  const testStatus = executionResult?.testResults && executionResult.testResults.length > 0
    ? executionResult.testResults.every((t) => t.passed)
      ? 'passed'
      : 'failed'
    : 'untested';

  // Quick Action Pills with dynamic context injection
  const quickPills = [
    {
      label: 'Give me a small nudge',
      icon: Sparkles,
      color: 'text-amber-400',
      prompt: `Give me a small conceptual nudge for "${challenge.title}" without giving away the entire code solution. Point me to the key array transformation or formula.`,
    },
    {
      label: 'Why did my test fail?',
      icon: AlertCircle,
      color: 'text-rose-400',
      prompt: `My tests for "${challenge.title}" ${testStatus === 'failed' ? 'failed' : 'have issues'}. Here is my current code:\n\`\`\`python\n${currentCode}\n\`\`\`\n${
        executionResult?.errorTraceback
          ? `Error Traceback:\n\`\`\`\n${executionResult.errorTraceback}\n\`\`\`\n`
          : ''
      }Explain why it failed conceptually and guide me to fix it.`,
    },
    {
      label: 'How do I make it faster?',
      icon: Zap,
      color: 'text-emerald-400',
      prompt: `How do I optimize my solution for "${challenge.title}" to achieve the Gold medal (<${challenge.benchmarkTargetMs}ms)? My current code is:\n\`\`\`python\n${currentCode}\n\`\`\`\nExplain the memory layout and vectorization technique.`,
    },
    {
      label: 'Explain the math in simple terms',
      icon: BookOpen,
      color: 'text-sky-400',
      prompt: `Explain the mathematical intuition behind "${challenge.title}" in simple, intuitive terms with KaTeX formulas and visual analogies.`,
    },
  ];

  const handleSend = async (customText?: string) => {
    const textToSend = (customText || input).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInput('');
    setIsLoading(true);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (byokKey.trim()) headers['X-AI-Key'] = byokKey.trim();
      if (byokProvider && byokProvider !== 'auto') headers['X-AI-Provider'] = byokProvider;
      if (byokModel.trim()) headers['X-AI-Model'] = byokModel.trim();
      if (byokBaseUrl.trim()) headers['X-AI-Base-URL'] = byokBaseUrl.trim();


      const resp = await fetch(`${API_BASE_URL}/ai/tutor`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          challenge_id: challenge.id,
          challenge_title: challenge.title,
          category: challenge.category,
          user_code: currentCode,
          question: textToSend,
          failed_tests: executionResult?.testResults?.filter((t) => !t.passed),
          error_traceback: executionResult?.errorTraceback,
          messages: [
            ...messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content: textToSend },
          ],
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`Backend AI returned error (${resp.status}): ${errText}`);
      }

      const data = await resp.json();
      if (data.error_message) {
        setLastApiError(data.error_message);
      } else {
        setLastApiError(null);
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: data.reply || data.response || 'Here is the Socratic guidance for this challenge...',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      if (byokKey.trim() || (byokProvider && byokProvider !== 'auto')) {
        setLastApiError(err?.message || 'Could not connect to AI service. Using offline mentor fallback.');
      }
      // High quality Socratic offline tutor
      const fallbackReply = generateSocraticResponse(textToSend, challenge, currentCode, executionResult);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: fallbackReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Dark Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
      />
      {/* Drawer Panel */}
      <div className="relative z-50 w-full sm:w-[480px] lg:w-[520px] h-full bg-surface-panel border-l border-surface-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 text-zinc-100 select-none">
        {/* 1. HEADER */}
        <div className="p-3.5 border-b border-surface-border bg-surface-panel flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-indigo/20 border border-accent-indigo/30 text-accent-indigo flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">Socratic AI Mentor</h2>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.2 rounded-full border ${
                  lastApiError && byokKey.trim()
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-accent-indigo/10 text-accent-indigo border-accent-indigo/30'
                }`}>
                  {byokKey.trim() ? (lastApiError ? 'Fallback Active' : (byokProvider === 'auto' ? 'Custom Key' : byokProvider.toUpperCase())) : 'Auto / Free'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 truncate max-w-[240px]">
                {challenge.title} • {challenge.category}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-1.5 rounded-lg transition ${
                showSettings
                  ? 'text-accent-indigo bg-accent-indigo/10'
                  : 'text-zinc-400 hover:text-white hover:bg-surface-hover'
              }`}
              title="AI Key & Model Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-surface-hover transition"
              title="Close Mentor Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 1B. SETTINGS POPOVER (BYOK) */}
        {showSettings && (
          <div className="p-3.5 bg-[#0e121e] border-b border-surface-border space-y-3 animate-in fade-in duration-150 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-accent-indigo" />
                AI Model & API Key Configuration
              </span>
              <span className="text-[10px] text-zinc-400">Stored locally in browser</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-semibold">Provider</label>
                <select
                  value={byokProvider}
                  onChange={(e) => saveAiSettings(byokKey, e.target.value, byokModel, byokBaseUrl)}
                  className="w-full mt-1 bg-surface-base border border-surface-border rounded-lg px-2 py-1.5 text-zinc-200 text-xs focus:border-accent-indigo outline-none"
                >
                  <option value="auto">Auto-Detect (Server Default)</option>
                  <option value="custom">Custom / Local Network (Qwen, Ollama, vLLM)</option>
                  <option value="gemini">Google Gemini (AI Studio)</option>
                  <option value="openai">OpenAI</option>
                  <option value="groq">Groq (Ultra-fast)</option>
                  <option value="deepseek">DeepSeek</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-semibold">Model Name</label>
                <input
                  type="text"
                  placeholder={
                    byokProvider === 'custom'
                      ? 'e.g. qwen2.5-coder-32b'
                      : byokProvider === 'openai'
                      ? 'e.g. gpt-4o-mini'
                      : byokProvider === 'groq'
                      ? 'e.g. llama-3.3-70b-versatile'
                      : byokProvider === 'deepseek'
                      ? 'e.g. deepseek-chat'
                      : 'e.g. gemini-3.6-flash'
                  }
                  value={byokModel}
                  onChange={(e) => saveAiSettings(byokKey, byokProvider, e.target.value, byokBaseUrl)}
                  className="w-full mt-1 bg-surface-base border border-surface-border rounded-lg px-2 py-1.5 text-zinc-200 text-xs focus:border-accent-indigo outline-none"
                />
                {/* Model Presets */}
                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                  <span className="text-[9px] text-zinc-500 font-medium">Presets:</span>
                  {(byokProvider === 'gemini' || byokProvider === 'auto'
                    ? ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-1.5-flash']
                    : byokProvider === 'openai'
                    ? ['gpt-4o-mini', 'gpt-4o']
                    : byokProvider === 'groq'
                    ? ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant']
                    : byokProvider === 'deepseek'
                    ? ['deepseek-chat', 'deepseek-coder']
                    : ['qwen2.5-coder-32b']
                  ).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => saveAiSettings(byokKey, byokProvider, preset, byokBaseUrl)}
                      className={`text-[9px] px-1.5 py-0.5 rounded border transition cursor-pointer ${
                        byokModel === preset || (!byokModel && preset === 'gemini-3.6-flash' && (byokProvider === 'gemini' || byokProvider === 'auto'))
                          ? 'bg-accent-indigo/25 border-accent-indigo text-accent-indigo font-semibold'
                          : 'bg-surface-base border-surface-border text-zinc-400 hover:text-zinc-200 hover:border-zinc-500'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {(byokProvider === 'custom' || byokBaseUrl.trim()) && (
              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-semibold flex items-center justify-between">
                  <span>Custom Network Endpoint / Base URL</span>
                  <span className="text-[9px] text-accent-indigo">OpenAI-compatible</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. http://192.168.1.50:8000/v1 or http://localhost:11434/v1"
                  value={byokBaseUrl}
                  onChange={(e) => saveAiSettings(byokKey, byokProvider, byokModel, e.target.value)}
                  className="w-full mt-1 bg-surface-base border border-surface-border rounded-lg px-2.5 py-1.5 text-zinc-200 text-xs focus:border-accent-indigo outline-none font-mono"
                />
                <p className="mt-1 text-[10px] text-zinc-400">
                  Connect to self-hosted Qwen, vLLM, Ollama, LM Studio, or a private LAN endpoint.
                </p>
              </div>
            )}

            <div>
              <label className="text-[10px] text-zinc-400 uppercase font-semibold">
                API Key {byokProvider === 'custom' ? '(Optional for Local LAN)' : '(BYOK)'}
              </label>
              <input
                type="password"
                placeholder={byokProvider === 'custom' ? 'Optional (leave blank if local server has no auth)' : 'Leave blank to use Server / Free Tier default'}
                value={byokKey}
                onChange={(e) => saveAiSettings(e.target.value, byokProvider, byokModel, byokBaseUrl)}
                className="w-full mt-1 bg-surface-base border border-surface-border rounded-lg px-2.5 py-1.5 text-zinc-200 text-xs focus:border-accent-indigo outline-none font-mono"
              />
              <p className="mt-1 text-[10px] text-zinc-400">
                {byokProvider === 'custom'
                  ? 'Key is forwarded via Bearer authorization if provided.'
                  : 'Get a free Gemini key at aistudio.google.com or use personal keys for OpenAI/Groq.'}
              </p>
            </div>

            {/* Test Connection Button */}
            <div className="pt-2 border-t border-surface-border flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testState.loading || (!byokKey.trim() && byokProvider !== 'custom')}
                  className="px-2.5 py-1.5 bg-accent-indigo/20 hover:bg-accent-indigo/30 border border-accent-indigo/40 text-accent-indigo rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {testState.loading ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Testing...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3 h-3" />
                      <span>Test Connection</span>
                    </>
                  )}
                </button>

                {testState.message && (
                  <div
                    className={`text-[11px] truncate max-w-[260px] flex items-center gap-1 ${
                      testState.success ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                    title={testState.message}
                  >
                    {testState.success ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                    )}
                    <span className="truncate">{testState.message}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}



      {/* 2. CONTEXT STATUS BANNER */}
      <div className="px-3.5 py-2 bg-surface-base border-b border-surface-border flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 text-[11px]">Workspace Status:</span>
          {testStatus === 'passed' ? (
            <span className="text-accent-emerald font-semibold text-[11px] flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> All Tests Passed
            </span>
          ) : testStatus === 'failed' ? (
            <span className="text-accent-rose font-semibold text-[11px] flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Test Failures Present
            </span>
          ) : (
            <span className="text-zinc-400 text-[11px]">Ready for Execution</span>
          )}
        </div>
        <span className="text-[10px] font-mono text-amber-400 font-semibold">
          Target &lt;{challenge.benchmarkTargetMs}ms
        </span>
      </div>

      {/* 3. QUICK REPLY ACTION PILLS */}
      <div className="p-3 border-b border-surface-border bg-surface-panel">
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 px-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-accent-indigo" />
          Quick Mentor Actions
        </p>
        <div className="flex flex-wrap gap-1.5">
          {quickPills.map((pill, idx) => {
            const Icon = pill.icon;
            return (
              <button
                key={idx}
                onClick={() => handleSend(pill.prompt)}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-elevated hover:bg-surface-hover hover:border-accent-indigo/50 border border-surface-border rounded-lg text-xs text-zinc-300 hover:text-white transition-all text-left shadow-xs disabled:opacity-50"
              >
                <Icon className={`w-3.5 h-3.5 ${pill.color} shrink-0`} />
                <span>{pill.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. MESSAGES SCROLL AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 select-text custom-scrollbar">
        {lastApiError && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-start justify-between gap-2.5 animate-in fade-in duration-150 shadow-xs">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-200">Custom AI Key Error</p>
                <p className="text-[11px] text-amber-300/80 mt-0.5 break-words">{lastApiError}</p>
                <p className="text-[10px] text-zinc-400 mt-1">
                  Mentor is operating in offline mode. Check your key & model in Settings (⚙️).
                </p>
              </div>
            </div>
            <button
              onClick={() => setLastApiError(null)}
              className="p-1 text-amber-400 hover:text-white rounded transition cursor-pointer"
              title="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-xs font-semibold ${
                  isUser
                    ? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                    : 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-md'
                    : 'bg-[#151924] border border-zinc-800/90 text-zinc-200 rounded-tl-none shadow-md'
                }`}
              >
                <ChatMessageRenderer
                  content={m.content}
                  onApplyCode={onApplyCode}
                />

                <div
                  className={`mt-2 flex items-center justify-end text-[10px] ${
                    isUser ? 'text-indigo-200' : 'text-zinc-500'
                  }`}
                >
                  <span>{m.timestamp}</span>
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="bg-[#151924] border border-zinc-800 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1.5">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 5. INPUT FORM */}
      <div className="p-3 border-t border-zinc-800/90 bg-[#141824]/90 backdrop-blur flex-shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask mentor about memory layout, formulas, or vectorization..."
            className="w-full bg-[#0A0C12] border border-zinc-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl pl-3.5 pr-11 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 outline-none transition"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-1.5 top-1.5 p-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white rounded-lg transition"
            title="Send question"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  </div>
);
};

// Socratic pedagogical generator for offline / fallback mode
function generateSocraticResponse(
  question: string,
  challenge: Challenge,
  currentCode: string,
  _executionResult: ExecutionResponse | null
): string {
  const q = question.toLowerCase();

  // 1. Math Explanation Request
  if (q.includes('math') || q.includes('formula') || q.includes('simple terms')) {
    if (challenge.id === 'd1-c1' || challenge.title.includes('Euclidean')) {
      return `### Mathematical Intuition: Euclidean Distance Matrix\n\n` +
        `The Euclidean distance between two vectors $u$ and $v$ is:\n\n` +
        `$$d(u, v) = \\sqrt{\\|u - v\\|^2}$$\n\n` +
        `Instead of computing element-wise differences across $N \\times M$ pairs in a slow Python loop, expand the binomial norm:\n\n` +
        `$$\\|u - v\\|^2 = \\|u\\|^2 + \\|v\\|^2 - 2(u \\cdot v)$$\n\n` +
        `**Why this is a superpower:**\n` +
        `- $\\|u\\|^2$ is computed once for all $N$ rows as a $(N, 1)$ column vector: \`np.sum(A**2, axis=1, keepdims=True)\`\n` +
        `- $\\|v\\|^2$ is computed once for all $M$ rows as a $(1, M)$ row vector: \`np.sum(B**2, axis=1, keepdims=True).T\`\n` +
        `- $u \\cdot v$ across all pairs is computed in a single multi-threaded BLAS matrix multiplication: \`A @ B.T\`\n\n` +
        `Here is how to apply this idiomatically:\n\n` +
        `\`\`\`python\n` +
        `import numpy as np\n\n` +
        `def euclidean_distance_matrix(A: np.ndarray, B: np.ndarray) -> np.ndarray:\n` +
        `    # Binomial expansion avoids 3D memory buffers\n` +
        `    a_sq = np.sum(A ** 2, axis=1, keepdims=True)\n` +
        `    b_sq = np.sum(B ** 2, axis=1, keepdims=True).T\n` +
        `    sq_dist = a_sq + b_sq - 2.0 * (A @ B.T)\n` +
        `    return np.sqrt(np.maximum(sq_dist, 0.0))\n` +
        `\`\`\``;
    }

    if (challenge.id === 'd1-c2' || challenge.title.includes('Sliding')) {
      return `### Mathematical Intuition: Strided 2D Convolutions\n\n` +
        `In image processing, a 2D sliding window of size $(k_h, k_w)$ across input $(H, W)$ produces an output shape of:\n\n` +
        `$$\\text{Out} = (H - k_h + 1, W - k_w + 1, k_h, k_w)$$\n\n` +
        `Instead of copying patches, we manipulate the **strides** byte pointers:\n\n` +
        `\`\`\`python\n` +
        `import numpy as np\n` +
        `from numpy.lib.stride_tricks import as_strided\n\n` +
        `def sliding_window_2d(arr: np.ndarray, window_shape: tuple[int, int]) -> np.ndarray:\n` +
        `    H, W = arr.shape\n` +
        `    kh, kw = window_shape\n` +
        `    s_row, s_col = arr.strides\n` +
        `    out_shape = (H - kh + 1, W - kw + 1, kh, kw)\n` +
        `    out_strides = (s_row, s_col, s_row, s_col)\n` +
        `    return as_strided(arr, shape=out_shape, strides=out_strides, writeable=False)\n` +
        `\`\`\``;
    }

    if (challenge.id === 'd3-c1' || challenge.title.includes('SwiGLU')) {
      return `### Mathematical Intuition: SwiGLU Activation\n\n` +
        `SwiGLU splits the input $X$ along the hidden dimension into $A$ and $B$, then applies:\n\n` +
        `$$\\text{SwiGLU}(A, B) = \\text{Swish}(A) \\odot B = (A \\cdot \\sigma(A)) \\odot B$$\n\n` +
        `In the backward pass, we calculate the Vector-Jacobian Products via the product rule:\n\n` +
        `$$\\frac{\\partial L}{\\partial B} = G \\odot \\text{Swish}(A)$$\n` +
        `$$\\frac{\\partial L}{\\partial A} = G \\odot B \\odot (\\sigma(A) + A \\odot \\sigma(A)(1 - \\sigma(A)))$$\n\n` +
        `\`\`\`python\n` +
        `import torch\n\n` +
        `class SwiGLUFunction(torch.autograd.Function):\n` +
        `    @staticmethod\n` +
        `    def forward(ctx, a, b):\n` +
        `        sig_a = torch.sigmoid(a)\n` +
        `        swish_a = a * sig_a\n` +
        `        ctx.save_for_backward(a, sig_a, b)\n` +
        `        return swish_a * b\n\n` +
        `    @staticmethod\n` +
        `    def backward(ctx, grad_out):\n` +
        `        a, sig_a, b = ctx.saved_tensors\n` +
        `        grad_b = grad_out * (a * sig_a)\n` +
        `        grad_swish = grad_out * b\n` +
        `        d_swish_da = sig_a * (1.0 + a * (1.0 - sig_a))\n` +
        `        grad_a = grad_swish * d_swish_da\n` +
        `        return grad_a, grad_b\n` +
        `\`\`\``;
    }
  }

  // 2. Failed Tests Diagnosis
  if (q.includes('fail') || q.includes('error') || q.includes('test')) {
    if (currentCode.includes('for ') || currentCode.includes('while ')) {
      return `### Diagnostic: Python Loops in Vectorized Challenges\n\n` +
        `Your test suite failed because explicit Python iteration was detected:\n` +
        `- When you write \`for i in ...\`, Python performs interpreter dynamic dispatch on every step.\n` +
        `- In **${challenge.title}**, all assertions require vectorized matrix broadcasting running at C-speed.\n\n` +
        `Try replacing the loop with vectorized broadcasting or matrix operations. Click **🚀 Apply to Editor** below to see the vectorized formulation!`;
    }

    return `### Diagnostic Breakdown for ${challenge.title}\n\n` +
      `Reviewing your submission against the challenge specification:\n\n` +
      `1. **Dimension Alignment**: Ensure that your reduction axes match the expected shape (e.g. \`axis=-1\` or \`axis=1\`).\n` +
      `2. **Numerical Stability**: When taking square roots or logarithms, guard against tiny negative floating point values using \`np.maximum(x, 0.0)\` or \`torch.clamp(x, min=0.0)\`.\n` +
      `3. **Memory Ownership**: If utilizing strided views or views, make sure you don't mutate shared memory buffers.`;
  }

  // 3. Optimization / Speedup Guidance
  if (q.includes('fast') || q.includes('speed') || q.includes('c-speed') || q.includes('benchmark')) {
    return `### Achieving Gold Medal (<${challenge.benchmarkTargetMs}ms) Speed\n\n` +
      `To reach sub-millisecond execution for **${challenge.title}**:\n\n` +
      `1. **Zero Intermediate Memory Allocations**: Avoid creating giant 3D temporary arrays like \`A[:, None, :] - B[None, :, :]\` which trigger page faults and cache evictions on large matrices.\n` +
      `2. **Hardware BLAS SIMD Dispatch**: Use \`@\` (matrix multiplication) so OpenBLAS/MKL can use AVX-512 vector registers.\n` +
      `3. **Contiguous Memory (C-Contiguous)**: Keep arrays in row-major contiguous memory so the CPU cache line fetches all contiguous floats in a single memory cycle.`;
  }

  // 4. Subtle Nudge
  return `### Senior Nudge for ${challenge.title}\n\n` +
    `Think about the problem in terms of **tensor shapes** rather than individual array indices.\n\n` +
    `- What is the input shape? \n` +
    `- What is the target output shape?\n` +
    `- Which single NumPy / PyTorch primitive computes this transformation in compiled C?\n\n` +
    `Check the **Concept Primer** (or press the Primer button on top) to review the memory layout diagram!`;
}

export default AIMentorPanel;
