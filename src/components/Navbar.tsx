import React from 'react';
import { Terminal, BookOpen, GitFork, RefreshCw, Sparkles } from 'lucide-react';
import { AnalysisMode } from '../types';

interface NavbarProps {
  mode: AnalysisMode;
  onModeChange: (mode: AnalysisMode) => void;
  onReset: () => void;
  hasResults: boolean;
  onScrollToSection?: (sectionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  mode,
  onModeChange,
  onReset,
  hasResults,
  onScrollToSection
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Brand Zone: 1-line wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              <span className="font-mono">&gt;_</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
                pythonDecode
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                AI Python Learning & Code Studio
              </span>
            </div>
          </div>

          {/* Navigation Links / Section shortcuts */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            {hasResults ? (
              <>
                <button
                  type="button"
                  onClick={() => onScrollToSection?.('errors-section')}
                  className="hover:text-blue-600 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  Error Diff
                </button>
                <button
                  type="button"
                  onClick={() => onScrollToSection?.('functions-section')}
                  className="hover:text-blue-600 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  Functions Explained
                </button>
                <button
                  type="button"
                  onClick={() => onScrollToSection?.('flowchart-section')}
                  className="hover:text-blue-600 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
                >
                  <GitFork className="w-3.5 h-3.5 text-indigo-600" />
                  Execution Flowchart
                </button>
                <button
                  type="button"
                  onClick={() => onScrollToSection?.('terminal-section')}
                  className="hover:text-blue-600 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
                >
                  <Terminal className="w-3.5 h-3.5 text-slate-700" />
                  Output
                </button>
              </>
            ) : (
              <span className="text-xs text-slate-400">
                Paste Python code or ask any conceptual question below
              </span>
            )}
          </nav>

          {/* Action Zone: Layout selector & Reset button */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Layout mode switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => onModeChange('both')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
                  mode === 'both'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Split screen: Theory on left, Code on right"
              >
                Theory + Code
              </button>
              <button
                type="button"
                onClick={() => onModeChange('code_only')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
                  mode === 'code_only'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Full screen code editor and explanations"
              >
                Code
              </button>
              <button
                type="button"
                onClick={() => onModeChange('theory_only')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
                  mode === 'theory_only'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Full screen conceptual answer"
              >
                Theory
              </button>
            </div>

            <button
              type="button"
              onClick={onReset}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title="Reset workspace"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
