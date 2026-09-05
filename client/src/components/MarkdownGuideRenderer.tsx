import React, { useState } from 'react';
import { Terminal, Copy, Check, Info, Sparkles, ChevronRight } from 'lucide-react';
import MathRenderer from './MathRenderer';

interface MarkdownGuideRendererProps {
  content: string;
  className?: string;
}

export const MarkdownGuideRenderer: React.FC<MarkdownGuideRendererProps> = ({
  content,
  className = '',
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Split by code blocks and math display blocks
  const parts = content.split(/(```[\s\S]*?```|\$\$[\s\S]*?\$\$)/g);

  return (
    <div className={`space-y-4 text-xs sm:text-[13px] leading-relaxed text-zinc-300 ${className}`}>
      {parts.map((part, idx) => {
        if (!part) return null;

        // 1. Code Block: ```lang ... ```
        if (part.startsWith('```') && part.endsWith('```')) {
          const firstLineEnd = part.indexOf('\n');
          const lang = part.slice(3, firstLineEnd).trim() || 'python';
          const code = part.slice(firstLineEnd + 1, -3).trim();

          return (
            <div
              key={idx}
              className="my-3 rounded-xl overflow-hidden border border-zinc-800 bg-[#09090c] shadow-lg"
            >
              <div className="flex items-center justify-between px-3.5 py-1.5 bg-zinc-900/90 border-b border-zinc-800/80 text-[11px] font-mono text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-zinc-300 font-semibold">{lang}</span>
                </div>
                <button
                  onClick={() => handleCopyCode(code, idx)}
                  className="flex items-center gap-1 hover:text-zinc-100 text-zinc-400 px-2 py-0.5 rounded hover:bg-zinc-800 transition text-[11px]"
                  title="Copy code"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 font-mono text-xs text-emerald-300 overflow-x-auto whitespace-pre leading-relaxed font-medium">
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        // 2. Math Block: $$ ... $$
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const formula = part.slice(2, -2).trim();
          return (
            <div
              key={idx}
              className="my-3 p-4 bg-zinc-950 border border-zinc-800 rounded-xl overflow-x-auto text-center text-indigo-300"
            >
              <MathRenderer latex={formula} displayMode={true} />
            </div>
          );
        }

        // 3. Regular Markdown Content
        // Normalize headings, lists, blockquotes, and hr blocks so they don't merge into single paragraphs
        let normalizedPart = part.replace(/\r\n/g, '\n');
        normalizedPart = normalizedPart.replace(/(^|\n)(#{1,6}\s[^\n]+)\n(?!\n)/g, '$1$2\n\n');
        normalizedPart = normalizedPart.replace(/([^\n])\n(#{1,6}\s)/g, '$1\n\n$2');
        normalizedPart = normalizedPart.replace(/(^[^*\-\s\d>].*)\n([*-]\s)/gm, '$1\n\n$2');
        normalizedPart = normalizedPart.replace(/(^[*-]\s.*)\n([^*\-\s\d>])/gm, '$1\n\n$2');
        normalizedPart = normalizedPart.replace(/([^\n>][^\n]*)\n(>\s)/g, '$1\n\n$2');

        const paragraphs = normalizedPart.split(/\n\s*\n/);

        return (
          <React.Fragment key={idx}>
            {paragraphs.map((para, pIdx) => {
              const trimmed = para.trim();
              if (!trimmed) return null;

              // Horizontal Rule: --- or ***
              if (/^[-*_]{3,}$/.test(trimmed)) {
                return <hr key={pIdx} className="border-t border-zinc-800 my-3" />;
              }

              // H3 Heading: ### Title
              if (trimmed.startsWith('### ')) {
                return (
                  <h3
                    key={pIdx}
                    className="text-sm font-bold text-zinc-100 pt-3 pb-1 flex items-center gap-2 border-b border-zinc-800/80"
                  >
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span>{renderInline(trimmed.replace(/^###\s+/, ''))}</span>
                  </h3>
                );
              }

              // H2 Heading: ## Title
              if (trimmed.startsWith('## ')) {
                return (
                  <h2
                    key={pIdx}
                    className="text-base font-bold text-zinc-100 pt-4 pb-1.5 flex items-center gap-2 border-b border-zinc-800"
                  >
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>{renderInline(trimmed.replace(/^##\s+/, ''))}</span>
                  </h2>
                );
              }

              // H1 Heading: # Title
              if (trimmed.startsWith('# ')) {
                return (
                  <h1
                    key={pIdx}
                    className="text-lg font-bold text-zinc-100 pt-4 pb-2 flex items-center gap-2 border-b border-zinc-700"
                  >
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>{renderInline(trimmed.replace(/^#\s+/, ''))}</span>
                  </h1>
                );
              }

              // Blockquote / Alert: > Text
              if (trimmed.startsWith('>')) {
                const quoteText = trimmed.replace(/^>\s*/gm, '');
                return (
                  <div
                    key={pIdx}
                    className="my-3 p-3.5 bg-indigo-950/20 border-l-4 border-indigo-500 rounded-r-xl text-xs text-indigo-200 space-y-1"
                  >
                    <div className="flex items-center gap-1.5 font-bold text-indigo-400 uppercase text-[10px] tracking-wider">
                      <Info className="w-3.5 h-3.5" />
                      <span>Key Engineering Principle</span>
                    </div>
                    <div>{renderInline(quoteText)}</div>
                  </div>
                );
              }

              // Bullet List: - item or * item
              if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                const items = trimmed.split(/\n(?=\s*[-*]\s+)/);
                return (
                  <ul key={pIdx} className="space-y-2 my-2.5 pl-1">
                    {items.map((item, iIdx) => {
                      const cleanItem = item.replace(/^\s*[-*]\s+/, '').trim();
                      return (
                        <li key={iIdx} className="flex items-start gap-2 text-zinc-300">
                          <ChevronRight className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                          <div className="flex-1">{renderInline(cleanItem)}</div>
                        </li>
                      );
                    })}
                  </ul>
                );
              }

              // Numbered List: 1. item
              if (/^\d+\.\s/.test(trimmed)) {
                const items = trimmed.split(/\n(?=\d+\.\s)/);
                return (
                  <ol key={pIdx} className="space-y-2 my-2.5 pl-1">
                    {items.map((item, iIdx) => {
                      const numMatch = item.match(/^(\d+)\.\s+(.*)/s);
                      const num = numMatch ? numMatch[1] : `${iIdx + 1}`;
                      const text = numMatch ? numMatch[2] : item;
                      return (
                        <li key={iIdx} className="flex items-start gap-2.5 text-zinc-300">
                          <span className="w-5 h-5 rounded-md bg-zinc-800 border border-zinc-700 text-[10px] font-mono font-bold text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                            {num}
                          </span>
                          <div className="flex-1 whitespace-pre-line">{renderInline(text)}</div>
                        </li>
                      );
                    })}
                  </ol>
                );
              }

              // Regular Paragraph
              return (
                <p key={pIdx} className="text-zinc-300 leading-relaxed font-sans">
                  {renderInline(trimmed)}
                </p>
              );
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
};

/**
 * Format inline tokens:
 * - Math: $latex$ and \(latex\)
 * - Inline Code: `code`
 * - Bold: **text** and __text__
 * - Italic: *text* and _text_
 */
function renderInline(text: string): React.ReactNode[] {
  if (!text) return [];

  // Match inline math, code, bold-italic, bold, and italic tokens
  const regex = /(\$(?:[^\s$][^$\n]*?[^\s$]|[^\s$])\$|\\\(.*?\\\)|\`[^\`\n]+?\`|\*\*\*(?:[^\s*].*?[^\s*]|[^\s*])\*\*\*|\*\*(?:[^\s*].*?[^\s*]|[^\s*])\*\*|(?<=^|[^\w])__(?:[^\s_].*?[^\s_]|[^\s_])__(?=[^\w]|$)|(?<!\*)\*(?:[^\s*][^*\n]*?[^\s*]|[^\s*])\*(?!\*)|(?<=^|[^\w])_(?:[^\s_][^_\n]*?[^\s_]|[^\s_])_(?=[^\w]|$))/g;

  const tokens = text.split(regex);

  return tokens.map((token, i) => {
    if (!token) return null;

    // 1. Inline Math: $latex$
    if (token.startsWith('$') && token.endsWith('$') && token.length > 2) {
      const latex = token.slice(1, -1).trim();
      return (
        <span key={i} className="inline-block px-1 text-indigo-300">
          <MathRenderer latex={latex} displayMode={false} />
        </span>
      );
    }

    // Inline Math: \(latex\)
    if (token.startsWith('\\(') && token.endsWith('\\)') && token.length >= 5) {
      const latex = token.slice(2, -2).trim();
      return (
        <span key={i} className="inline-block px-1 text-indigo-300">
          <MathRenderer latex={latex} displayMode={false} />
        </span>
      );
    }

    // 2. Inline Code: `code`
    if (token.startsWith('`') && token.endsWith('`') && token.length >= 2) {
      return (
        <code
          key={i}
          className="font-mono text-[11px] bg-zinc-800/90 text-indigo-300 px-1.5 py-0.5 rounded border border-zinc-700/60 font-semibold inline-block my-0.5"
        >
          {token.slice(1, -1)}
        </code>
      );
    }

    // 3. Bold-Italic: ***text***
    if (token.startsWith('***') && token.endsWith('***') && token.length >= 6) {
      return (
        <strong key={i} className="font-bold text-white tracking-tight">
          <em className="italic text-zinc-200">
            {renderInline(token.slice(3, -3))}
          </em>
        </strong>
      );
    }

    // 4. Bold: **text** or __text__
    if (
      (token.startsWith('**') && token.endsWith('**') && token.length >= 4) ||
      (token.startsWith('__') && token.endsWith('__') && token.length >= 4)
    ) {
      return (
        <strong key={i} className="font-bold text-white tracking-tight">
          {renderInline(token.slice(2, -2))}
        </strong>
      );
    }

    // 5. Italic: *text* or _text_
    if (
      (token.startsWith('*') && token.endsWith('*') && token.length >= 2 && !token.startsWith('**')) ||
      (token.startsWith('_') && token.endsWith('_') && token.length >= 2 && !token.startsWith('__'))
    ) {
      return (
        <em key={i} className="italic text-zinc-200">
          {renderInline(token.slice(1, -1))}
        </em>
      );
    }

    return <React.Fragment key={i}>{token}</React.Fragment>;
  });
}

export default MarkdownGuideRenderer;
