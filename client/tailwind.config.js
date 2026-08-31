/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // High-legibility, calm developer palette (GitHub Dark / Linear style)
        surface: {
          base: '#0D1117',      // Deep calm background
          panel: '#161B22',     // Primary card & panel surface
          elevated: '#21262D',  // Elevated containers & inputs
          hover: '#30363D',     // Hover states
          border: '#30363D',    // Subtle clean border
          'border-strong': '#484F58',
        },
        // High-contrast, accessible accent colors
        accent: {
          indigo: '#58A6FF',
          'indigo-hover': '#388BFD',
          emerald: '#2EA043',
          'emerald-bg': 'rgba(46, 160, 67, 0.15)',
          rose: '#F85149',
          'rose-bg': 'rgba(248, 81, 73, 0.15)',
          amber: '#D29922',
          'amber-bg': 'rgba(210, 153, 34, 0.15)',
          cyan: '#388BFD',
          'cyan-bg': 'rgba(56, 139, 253, 0.15)',
        },
        // Legacy fallback mappings
        'surface-base': '#0D1117',
        'surface-canvas': '#0D1117',
        'surface-panel': '#161B22',
        'surface-card': '#21262D',
        'surface-card-hover': '#30363D',
        'border-subtle': '#30363D',
        'border-strong': '#484F58',
        'brand-matrix': '#2EA043',
        'brand-torch': '#BC8CFF',
        'brand-data': '#58A6FF',
        'brand-viz': '#D29922',
        'brand-error': '#F85149',
        brand: {
          matrix: '#10B981',
          torch: '#8B5CF6',
          data: '#06B6D4',
          viz: '#F59E0B',
          error: '#F43F5E',
          500: '#6366F1',
          600: '#4F46E5',
        },
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          850: '#172033',
          900: '#11131A',
          950: '#090A0F',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'Monaco', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

