import React, { useState } from 'react';
import { Copy, Check, Terminal, Sparkles, ChevronRight } from 'lucide-react';
import MathRenderer from './MathRenderer';

interface ChatMessageRendererProps {
  content: string;
  onApplyCode?: (code: string) => void;
}

export const ChatMessageRenderer: React.FC<ChatMessageRendererProps> = ({
  content,
  onApplyCode,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [appliedIndex, setAppliedIndex] = useState<number | null>(null);

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleApply = (code: string, index: number) => {
    if (onApplyCode) {
      onApplyCode(code);
      setAppliedIndex(index);
      setTimeout(() => setAppliedIndex(null), 2500);
    }
  };

  // 1. Split content by code blocks ```lang ... ``` and display math blocks $$ ... $$ or \[ ... \]
  const majorBlocks = content.split(/(```[\s\S]*?```|\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\])/g);

  return (
    <div className="space-y-3 leading-relaxed text-xs text-zinc-200">
      {majorBlocks.map((block, bIdx) => {
        if (!block) return null;

        // Code Block: ```python ... ```
        if (block.startsWith('```') && block.endsWith('```')) {
          const firstLineEnd = block.indexOf('\n');
          const lang = (block.slice(3, firstLineEnd).trim() || 'python').toLowerCase();
          const code = block.slice(firstLineEnd + 1, -3).trim();
          const isExecutableCode =
            ['python', 'py', 'numpy', 'pandas', 'torch'].includes(lang) ||
            code.includes('def ') ||
            code.includes('import ') ||
            code.includes('=');

          return (
            <div
              key={bIdx}
              className="my-2.5 rounded-xl overflow-hidden border border-zinc-700/80 bg-[#09090c] shadow-lg shadow-black/40"
            >
              <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900/90 border-b border-zinc-800/80 text-[11px] font-mono text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-accent-indigo" />
                  <span className="text-zinc-300 font-semibold">{lang}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {onApplyCode && isExecutableCode && (
                    <button
                      onClick={() => handleApply(code, bIdx)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                        appliedIndex === bIdx
                          ? 'bg-emerald-500 text-zinc-950 shadow-sm shadow-emerald-500/40'
                          : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50'
                      }`}
                      title="Apply this suggested code directly to Monaco Editor"
                    >
                      {appliedIndex === bIdx ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Applied!</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" />
                          <span>🚀 Apply to Editor</span>
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => handleCopyCode(code, bIdx)}
                    className="flex items-center gap-1 hover:text-zinc-100 text-zinc-400 px-1.5 py-0.5 rounded hover:bg-zinc-800 transition"
                    title="Copy code"
                  >
                    {copiedIndex === bIdx ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px] text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span className="text-[10px]">Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              <pre className="p-3.5 font-mono text-xs text-emerald-300 overflow-x-auto whitespace-pre leading-relaxed bg-[#0a0c10]">
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        // Display Math Block: $$ ... $$ or \[ ... \]
        if (
          (block.startsWith('$$') && block.endsWith('$$')) ||
          (block.startsWith('\\[') && block.endsWith('\\]'))
        ) {
          const formula = block.startsWith('$$') ? block.slice(2, -2).trim() : block.slice(2, -2).trim();
          return (
            <div
              key={bIdx}
              className="my-3 p-3 bg-[#080a10] border border-zinc-800/90 rounded-xl overflow-x-auto text-center shadow-inner text-indigo-300"
            >
              <MathRenderer latex={formula} displayMode={true} />
            </div>
          );
        }

        // 2. Parse Markdown paragraphs, lists, headers, and rules
        const sections = block.split(/\n\s*\n/);

        return (
          <div key={bIdx} className="space-y-2.5">
            {sections.map((section, sIdx) => {
              const trimmed = section.trim();
              if (!trimmed) return null;

              // Horizontal Rule: --- or ***
              if (/^[-*_]{3,}$/.test(trimmed)) {
                return <hr key={sIdx} className="border-t border-zinc-800/90 my-2" />;
              }

              // Headings: ### Title, ## Title, # Title
              if (trimmed.startsWith('### ')) {
                return (
                  <h3 key={sIdx} className="text-xs sm:text-sm font-bold text-white pt-2 pb-0.5 flex items-center gap-1.5 text-accent-indigo">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-indigo" />
                    <span>{renderInlineTokens(trimmed.slice(4))}</span>
                  </h3>
                );
              }
              if (trimmed.startsWith('## ')) {
                return (
                  <h2 key={sIdx} className="text-sm font-bold text-white pt-2.5 pb-1 border-b border-zinc-800 flex items-center gap-1.5">
                    <span>{renderInlineTokens(trimmed.slice(3))}</span>
                  </h2>
                );
              }
              if (trimmed.startsWith('# ')) {
                return (
                  <h1 key={sIdx} className="text-base font-bold text-white pt-3 pb-1 border-b border-zinc-700 flex items-center gap-2">
                    <span>{renderInlineTokens(trimmed.slice(2))}</span>
                  </h1>
                );
              }

              // Blockquote: > text
              if (trimmed.startsWith('> ')) {
                const quote = trimmed.replace(/^>\s*/gm, '');
                return (
                  <div key={sIdx} className="pl-3 py-1.5 my-1.5 border-l-2 border-accent-indigo bg-accent-indigo/5 rounded-r-lg text-zinc-300">
                    {renderInlineTokens(quote)}
                  </div>
                );
              }

              // Unordered List: - item or * item
              if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                const items = trimmed.split(/\n(?=[-*\+]\s+)/);
                return (
                  <ul key={sIdx} className="space-y-1.5 my-1.5 pl-1">
                    {items.map((item, iIdx) => {
                      const clean = item.replace(/^[-*\+]\s+/, '').trim();
                      return (
                        <li key={iIdx} className="flex items-start gap-2 text-zinc-300">
                          <ChevronRight className="w-3.5 h-3.5 text-accent-indigo shrink-0 mt-0.5" />
                          <div className="flex-1 leading-relaxed">{renderInlineTokens(clean)}</div>
                        </li>
                      );
                    })}
                  </ul>
                );
              }

              // Ordered List: 1. item, 2. item
              if (/^\d+\.\s/.test(trimmed)) {
                const items = trimmed.split(/\n(?=\d+\.\s)/);
                return (
                  <ol key={sIdx} className="space-y-1.5 my-1.5 pl-1">
                    {items.map((item, iIdx) => {
                      const match = item.match(/^(\d+)\.\s+([\s\S]*)/);
                      const num = match ? match[1] : `${iIdx + 1}`;
                      const text = match ? match[2].trim() : item;
                      return (
                        <li key={iIdx} className="flex items-start gap-2 text-zinc-300">
                          <span className="w-4 h-4 rounded bg-zinc-800/90 border border-zinc-700 text-[10px] font-mono font-bold text-accent-indigo flex items-center justify-center shrink-0 mt-0.5">
                            {num}
                          </span>
                          <div className="flex-1 leading-relaxed">{renderInlineTokens(text)}</div>
                        </li>
                      );
                    })}
                  </ol>
                );
              }

              // Standard Paragraph (handle single newlines inside paragraph smoothly)
              const lines = trimmed.split('\n');
              return (
                <p key={sIdx} className="text-zinc-300 leading-relaxed">
                  {lines.map((line, lIdx) => (
                    <React.Fragment key={lIdx}>
                      {lIdx > 0 && <br />}
                      {renderInlineTokens(line)}
                    </React.Fragment>
                  ))}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

/**
 * Tokenizes and renders inline elements:
 * - KaTeX Math: $formula$ and \(formula\)
 * - Bold: **text**
 * - Italic: *text*
 * - Inline Code: `code`
 */
function renderInlineTokens(text: string): React.ReactNode[] {

  if (!text) return [];

  // Robust tokenizer regex supporting inline math, bold, inline code, italic
  const regex = /(\$(?:[^\s$][^$\n]*?[^\s$]|[^\s$])\$|\\\(.*?\\\)|\*\*.*?\*\*|__.*?__|`.*?`|\*[^*\n]+?\*)/g;
  const tokens = text.split(regex);

  return tokens.map((token, i) => {
    if (!token) return null;

    // 1. Inline KaTeX Math: $formula$
    if (token.startsWith('$') && token.endsWith('$') && token.length >= 3) {
      const latex = token.slice(1, -1).trim();
      return (
        <span key={i} className="inline font-serif text-indigo-300 align-baseline">
          <MathRenderer latex={latex} displayMode={false} />
        </span>
      );
    }

    // Inline KaTeX Math: \(formula\)
    if (token.startsWith('\\(') && token.endsWith('\\)') && token.length >= 5) {
      const latex = token.slice(2, -2).trim();
      return (
        <span key={i} className="inline font-serif text-indigo-300 align-baseline">
          <MathRenderer latex={latex} displayMode={false} />
        </span>
      );
    }

    // 2. Bold: **text** or __text__ (Recursively parse nested math/code inside bold)
    if (
      (token.startsWith('**') && token.endsWith('**') && token.length >= 4) ||
      (token.startsWith('__') && token.endsWith('__') && token.length >= 4)
    ) {
      return (
        <strong key={i} className="font-bold text-white tracking-tight">
          {renderInlineTokens(token.slice(2, -2))}
        </strong>
      );
    }

    // 3. Inline Code: `code`
    if (token.startsWith('`') && token.endsWith('`') && token.length >= 2) {
      return (
        <code
          key={i}
          className="font-mono text-[11px] bg-zinc-800/90 text-indigo-300 px-1.5 py-0.5 rounded border border-zinc-700/60 font-medium inline-block my-0.5"
        >
          {token.slice(1, -1)}
        </code>
      );
    }

    // 4. Italic: *text* (Recursively parse nested math/code inside italic)
    if (token.startsWith('*') && token.endsWith('*') && token.length >= 2 && !token.startsWith('**')) {
      return (
        <em key={i} className="italic text-zinc-200">
          {renderInlineTokens(token.slice(1, -1))}
        </em>
      );
    }

    // Regular Text
    return <React.Fragment key={i}>{token}</React.Fragment>;
  });
}

export default ChatMessageRenderer;

