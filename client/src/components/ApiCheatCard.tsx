import React, { useState, useMemo } from 'react';
import { Search, BookMarked, Copy, Check } from 'lucide-react';
import type { ApiCheatItem } from '../types';

interface ApiCheatCardProps {
  items: ApiCheatItem[];
  libraryName: string;
}

export const ApiCheatCard: React.FC<ApiCheatCardProps> = ({ items, libraryName }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedName, setCopiedName] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => set.add(item.category));
    return ['All', ...Array.from(set)];
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
      const matchSearch =
        search.trim() === '' ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.summary.toLowerCase().includes(search.toLowerCase()) ||
        item.signature.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [items, selectedCategory, search]);

  const handleCopy = (snippet: string, name: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedName(name);
    setTimeout(() => setCopiedName(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Header */}
      <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookMarked className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-zinc-100">{libraryName} API Quick Reference & Cheat-Sheet</h3>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search ${libraryName} functions...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 text-xs rounded-lg transition ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Functions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.name}
            className="p-4 bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl space-y-3 transition flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  {item.name}
                </span>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                  {item.category}
                </span>
              </div>

              <div className="font-mono text-[11px] text-zinc-300 bg-zinc-950 p-2 rounded-lg border border-zinc-800/80 overflow-x-auto whitespace-pre">
                {item.signature}
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">{item.summary}</p>

              {/* Parameter Table */}
              {item.parameters && item.parameters.length > 0 && (
                <div className="pt-1 space-y-1">
                  <span className="text-[10px] uppercase font-mono text-zinc-500 font-bold">Key Parameters:</span>
                  <div className="space-y-1">
                    {item.parameters.map((p) => (
                      <div key={p.name} className="text-[11px] font-mono text-zinc-300 flex items-start gap-1.5">
                        <code className="text-cyan-400 font-semibold shrink-0">{p.name}</code>
                        <span className="text-zinc-500 text-[10px]">({p.type}):</span>
                        <span className="text-zinc-400 font-sans text-[11px]">{p.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Example Snippet with Copy Button */}
            <div className="pt-2 border-t border-zinc-800/60">
              <div className="flex items-center justify-between mb-1 text-[10px] text-zinc-500">
                <span className="font-mono">Example Usage</span>
                <button
                  onClick={() => handleCopy(item.exampleSnippet, item.name)}
                  className="flex items-center gap-1 text-zinc-400 hover:text-white transition"
                >
                  {copiedName === item.name ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedName === item.name ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-2.5 bg-zinc-950 border border-zinc-800/80 rounded-xl font-mono text-[11px] text-emerald-300 overflow-x-auto whitespace-pre-wrap">
                {item.exampleSnippet}
              </pre>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="p-8 text-center bg-zinc-900/40 border border-zinc-800 rounded-2xl text-zinc-400 text-xs">
          No API items found matching "{search}".
        </div>
      )}
    </div>
  );
};

export default ApiCheatCard;
