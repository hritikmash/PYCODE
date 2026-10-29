import React, { useState, useRef } from 'react';
import { 
  AlertTriangle, 
  AlertOctagon, 
  Copy, 
  Check, 
  Code2, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp,
  ArrowRight,
  GitBranch,
  Calculator,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { CodeErrorItem } from '../types';
import { calculateCyclomaticComplexity } from '../utils/cyclomaticComplexity';

interface SubmittedCodeErrorHighlighterProps {
  originalCode: string;
  errors: CodeErrorItem[];
  title?: string;
}

export const SubmittedCodeErrorHighlighter: React.FC<SubmittedCodeErrorHighlighterProps> = ({
  originalCode,
  errors = [],
  title = 'Submitted Python Code'
}) => {
  const [copied, setCopied] = useState(false);
  const [expandedErrors, setExpandedErrors] = useState<Record<number, boolean>>({});
  const [showComplexityDetails, setShowComplexityDetails] = useState(false);
  const codeScrollRef = useRef<HTMLDivElement>(null);

  const lines = originalCode ? originalCode.split('\n') : [];
  const complexity = calculateCyclomaticComplexity(originalCode);

  const handleScrollUp = () => {
    if (codeScrollRef.current) {
      codeScrollRef.current.scrollBy({ top: -200, behavior: 'smooth' });
    }
  };

  const handleScrollDown = () => {
    if (codeScrollRef.current) {
      codeScrollRef.current.scrollBy({ top: 200, behavior: 'smooth' });
    }
  };

  const handleScrollToTop = () => {
    if (codeScrollRef.current) {
      codeScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleScrollToBottom = () => {
    if (codeScrollRef.current) {
      codeScrollRef.current.scrollTo({ top: codeScrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  const handleCopy = async () => {
    if (!originalCode) return;
    await navigator.clipboard.writeText(originalCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleExpand = (lineNum: number) => {
    setExpandedErrors(prev => ({
      ...prev,
      [lineNum]: !prev[lineNum]
    }));
  };

  // Match error to line number or snippet
  const getErrorForLine = (line: string, lineNum: number): CodeErrorItem | undefined => {
    const directMatch = errors.find(e => e.line === lineNum);
    if (directMatch) return directMatch;

    const trimmed = line.trim();
    if (trimmed.length > 3) {
      return errors.find(e => {
        if (!e.originalSnippet) return false;
        const snip = e.originalSnippet.trim();
        return snip === trimmed || (snip.length > 5 && trimmed.includes(snip));
      });
    }
    return undefined;
  };

  return (
    <div className="w-full max-w-full rounded-2xl border border-[#282a2c] bg-[#161718] overflow-hidden shadow-md font-mono text-xs">
      {/* Header bar - Responsive on mobile to take device size cleanly */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 sm:px-4 sm:py-2.5 bg-[#1e1f20] border-b border-[#282a2c] text-xs">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5">
            <Code2 className="w-4 h-4 text-[#a8c7fa] shrink-0" />
            <span className="font-semibold text-white font-sans text-xs sm:text-sm truncate">{title}</span>
            <span className="text-[#8e918f]">·</span>
            <span className="text-[#8e918f] font-mono text-[11px] whitespace-nowrap">
              {lines.length} {lines.length === 1 ? 'line' : 'lines'}
            </span>
          </div>

          {/* Cyclomatic Complexity Badge */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowComplexityDetails(!showComplexityDetails)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-sans font-medium transition-all cursor-pointer shadow-xs ${complexity.badgeClass} hover:brightness-110 active:scale-95`}
              title="Click to view Cyclomatic Complexity breakdown"
            >
              <Calculator className="w-3 h-3 shrink-0" />
              <span>Complexity: <strong className="font-mono">{complexity.score}</strong> ({complexity.rating})</span>
            </button>

            {/* Complexity Popover Breakdown */}
            {showComplexityDetails && (
              <div className="absolute left-0 top-full mt-1.5 z-40 w-64 p-3 rounded-xl bg-[#1e1f20] border border-[#37393b] shadow-2xl text-[11px] font-sans text-[#c4c7c5] space-y-2 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-[#282a2c] pb-1.5 font-semibold text-white">
                  <span>Cyclomatic Complexity</span>
                  <span className={`px-1.5 py-0.2 rounded font-mono ${complexity.colorClass}`}>
                    Score: {complexity.score}
                  </span>
                </div>
                <p className="text-[11px] text-[#8e918f] leading-snug">
                  {complexity.description}
                </p>
                <div className="space-y-1 pt-1 text-[10px] font-mono border-t border-[#282a2c]">
                  <div className="flex justify-between">
                    <span>Branches (if/elif):</span>
                    <span className="text-white">{complexity.breakdown.branches}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Loops (for/while):</span>
                    <span className="text-white">{complexity.breakdown.loops}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Logical Ops (and/or):</span>
                    <span className="text-white">{complexity.breakdown.logicalOps}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Exceptions & Others:</span>
                    <span className="text-white">{complexity.breakdown.exceptions + complexity.breakdown.others}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Issue or Syntax Status Badge */}
          {errors.length > 0 ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-950/70 border border-red-800 text-red-300 font-sans text-[11px] font-semibold">
              <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
              <span>{errors.length} {errors.length === 1 ? 'issue' : 'issues'}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-300 font-sans text-[11px]">
              <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="hidden sm:inline">No syntax issues</span>
              <span className="sm:hidden">Valid</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          {/* Scroll Up & Down Controls */}
          <div className="flex items-center gap-0.5 bg-[#131314] px-1 py-0.5 rounded-full border border-[#282a2c]">
            <button
              type="button"
              onClick={handleScrollUp}
              className="p-1 text-[#8e918f] hover:text-white hover:bg-[#282a2c] rounded-full transition-colors cursor-pointer"
              title="Scroll up"
              aria-label="Scroll code up"
            >
              <ArrowUp className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={handleScrollDown}
              className="p-1 text-[#8e918f] hover:text-white hover:bg-[#282a2c] rounded-full transition-colors cursor-pointer"
              title="Scroll down"
              aria-label="Scroll code down"
            >
              <ArrowDown className="w-3 h-3" />
            </button>
            <span className="w-px h-3 bg-[#282a2c]" />
            <button
              type="button"
              onClick={handleScrollToTop}
              className="px-1.5 py-0.5 text-[10px] text-[#8e918f] hover:text-[#a8c7fa] hover:bg-[#282a2c] rounded transition-colors cursor-pointer"
              title="Scroll to top"
            >
              Top
            </button>
            <button
              type="button"
              onClick={handleScrollToBottom}
              className="px-1.5 py-0.5 text-[10px] text-[#8e918f] hover:text-[#a8c7fa] hover:bg-[#282a2c] rounded transition-colors cursor-pointer"
              title="Scroll to bottom"
            >
              Bottom
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-slate-300 hover:text-white bg-[#282a2c] hover:bg-[#37393b] font-sans text-[11px] transition-colors cursor-pointer"
            title="Copy original code"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Display with Inline Error Annotations - Full device width on mobile & scrollable */}
      <div
        ref={codeScrollRef}
        className="p-2 sm:p-3 overflow-x-auto max-h-[460px] overflow-y-auto scroll-smooth leading-relaxed w-full max-w-full relative"
      >
        {lines.length === 0 ? (
          <div className="p-4 text-center text-[#8e918f] font-sans text-xs">
            No code lines to display.
          </div>
        ) : (
          <>
            {lines.map((line, idx) => {
              const lineNum = idx + 1;
              const err = getErrorForLine(line, lineNum);
              const isError = Boolean(err);
              const isExpanded = expandedErrors[lineNum] !== false; // expanded by default

              return (
                <div key={lineNum} className="flex flex-col mb-0.5 w-full">
                  {/* Code line row */}
                  <div 
                    className={`flex items-start rounded-md transition-colors w-full ${
                      isError 
                        ? 'bg-red-950/75 border-l-4 border-red-500 pl-1 sm:pl-2 pr-2 sm:pr-3 py-1 shadow-[inset_0_0_8px_rgba(239,68,68,0.15)] text-red-100 font-semibold' 
                        : 'text-[#d6d9d7] hover:bg-[#1f2022] px-1 sm:px-2 py-0.5'
                    }`}
                  >
                    {/* Line Number Gutter */}
                    <div className="w-6 sm:w-8 shrink-0 select-none text-right pr-2 sm:pr-3 font-mono text-[10px] sm:text-[11px] text-[#8e918f] flex items-center justify-end gap-1">
                      {isError && <AlertOctagon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-400 animate-pulse shrink-0" />}
                      <span>{lineNum}</span>
                    </div>

                    {/* Code Line text */}
                    <pre className="flex-1 overflow-x-auto text-[11px] sm:text-xs font-mono font-normal">
                      {line || ' '}
                    </pre>
                  </div>

                  {/* Inline Error Annotation Banner */}
                  {isError && err && (
                    <div className="ml-6 sm:ml-8 my-1 p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-red-950/90 via-[#200c0e] to-red-950/90 border border-red-800 text-red-200 text-xs font-sans shadow-lg animate-in slide-in-from-top-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-bold text-red-300 text-xs">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          <span className="uppercase tracking-wider">Line {lineNum} Issue:</span>
                          <span className="font-mono text-red-200">{err.errorType.toUpperCase()}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleExpand(lineNum)}
                          className="text-[10px] text-red-400 hover:text-white flex items-center gap-0.5 cursor-pointer"
                        >
                          {isExpanded ? (
                            <><span>Hide</span><ChevronUp className="w-3 h-3" /></>
                          ) : (
                            <><span>Explain</span><ChevronDown className="w-3 h-3" /></>
                          )}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="mt-2 space-y-2 border-t border-red-900/60 pt-2 text-[11px] sm:text-xs">
                          <p className="leading-relaxed text-red-100">
                            <strong>Why it failed:</strong> {err.explanation}
                          </p>

                          {err.correctedSnippet && (
                            <div className="p-2 rounded-lg bg-black/60 border border-emerald-800/60 font-mono text-emerald-300 flex flex-wrap items-center gap-2 overflow-x-auto">
                              <span className="text-[10px] text-emerald-400 font-sans font-bold uppercase shrink-0">
                                Suggested Fix:
                              </span>
                              <code className="text-white text-xs">{err.correctedSnippet}</code>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Floating quick-scroll pill inside container */}
            {lines.length > 10 && (
              <div className="sticky bottom-2 float-right mr-1 flex items-center gap-1 bg-[#18191a]/95 backdrop-blur-xs px-2 py-1 rounded-full border border-[#37393b] shadow-xl z-10 text-xs">
                <button
                  type="button"
                  onClick={handleScrollUp}
                  className="p-1 text-[#8e918f] hover:text-white hover:bg-[#282a2c] rounded-full transition-colors cursor-pointer"
                  title="Scroll up"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={handleScrollDown}
                  className="p-1 text-[#8e918f] hover:text-white hover:bg-[#282a2c] rounded-full transition-colors cursor-pointer"
                  title="Scroll down"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
