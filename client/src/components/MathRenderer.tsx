import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathRendererProps {
  latex: string;
  displayMode?: boolean;
  className?: string;
}

export const MathRenderer: React.FC<MathRendererProps> = ({
  latex,
  displayMode = false,
  className = '',
}) => {
  const html = useMemo(() => {
    if (!latex || !latex.trim()) return '';
    try {
      return katex.renderToString(latex.trim(), {
        displayMode,
        throwOnError: false,
        strict: false,
        output: 'html',
      });
    } catch (err) {
      console.error('KaTeX rendering error for:', latex, err);
      return `<span class="text-indigo-300 font-serif italic">${latex}</span>`;
    }
  }, [latex, displayMode]);

  return (
    <span
      className={`${displayMode ? 'block my-2 text-center' : 'inline font-serif text-indigo-300 align-baseline'} select-text ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default MathRenderer;


