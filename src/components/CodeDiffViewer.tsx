import React, { useState, useRef } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  Copy, 
  Check, 
  ShieldCheck, 
  Cpu, 
  Columns, 
  FileCode, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight,
  ExternalLink,
  Calculator,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { CodeErrorItem, CodeChange } from '../types';
import { calculateCyclomaticComplexity } from '../utils/cyclomaticComplexity';

interface CodeDiffViewerProps {
  originalCode: string;
  correctedCode: string;
  errors: CodeErrorItem[];
  whatChanged: CodeChange[];
}

export const CodeDiffViewer: React.FC<CodeDiffViewerProps> = ({
  originalCode,
  correctedCode,
  errors,
  whatChanged
}) => {
  // Tabs: 'original_full' | 'side_by_side' | 'corrected_full' | 'what_changed' | 'issues'
  const [activeTab, setActiveTab] = useState<'original_full' | 'side_by_side' | 'corrected_full' | 'what_changed' | 'issues'>(
    errors.length > 0 ? 'original_full' : 'side_by_side'
  );
  const [copiedCorrected, setCopiedCorrected] = useState(false);
  const [copiedOriginal, setCopiedOriginal] = useState(false);
  const [expandedErrorIds, setExpandedErrorIds] = useState<Record<string, boolean>>({});
  const [expandAllErrors, setExpandAllErrors] = useState<boolean>(true);

  const handleCopyCorrected = async () => {
    await navigator.clipboard.writeText(correctedCode);
    setCopiedCorrected(true);
    setTimeout(() => setCopiedCorrected(false), 2000);
  };

  const handleCopyOriginal = async () => {
    await navigator.clipboard.writeText(originalCode);
    setCopiedOriginal(true);
    setTimeout(() => setCopiedOriginal(false), 2000);
  };

  const toggleErrorExpand = (id: string) => {
    setExpandedErrorIds(prev => ({
      ...prev,
      [id]: prev[id] !== undefined ? !prev[id] : !expandAllErrors
    }));
  };

  const isErrorExpanded = (err: CodeErrorItem) => {
    if (expandedErrorIds[err.id] !== undefined) {
      return expandedErrorIds[err.id];
    }
    return expandAllErrors;
  };

  const verifiedCount = errors.filter(e => e.verification === 'execution_verified').length;
  const aiSuggestedCount = errors.filter(e => e.verification === 'ai_suggested').length;

  const origLines = originalCode ? originalCode.split('\n') : [];
  const corrLines = correctedCode ? correctedCode.split('\n') : [];

  const origComplexity = calculateCyclomaticComplexity(originalCode);
  const corrComplexity = calculateCyclomaticComplexity(correctedCode);

  // Scroll refs for code containers
  const origScrollRef = useRef<HTMLDivElement>(null);
  const corrScrollRef = useRef<HTMLDivElement>(null);
  const sideOrigScrollRef = useRef<HTMLDivElement>(null);
  const sideCorrScrollRef = useRef<HTMLDivElement>(null);

  const handleScrollUp = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollBy({ top: -220, behavior: 'smooth' });
    }
  };

  const handleScrollDown = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollBy({ top: 220, behavior: 'smooth' });
    }
  };

  const handleScrollToTop = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleScrollToBottom = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' });
    }
  };

  const renderScrollControls = (
    ref: React.RefObject<HTMLDivElement | null>,
    label: string = 'code'
  ) => (
    <div className="flex items-center gap-1 bg-[#131314] px-1.5 py-0.5 rounded-full border border-[#282a2c] text-xs">
      <button
        type="button"
        onClick={() => handleScrollUp(ref)}
        className="p-1 text-[#8e918f] hover:text-white hover:bg-[#282a2c] rounded-full transition-colors cursor-pointer"
        title={`Scroll up ${label}`}
        aria-label={`Scroll up ${label}`}
      >
        <ArrowUp className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => handleScrollDown(ref)}
        className="p-1 text-[#8e918f] hover:text-white hover:bg-[#282a2c] rounded-full transition-colors cursor-pointer"
        title={`Scroll down ${label}`}
        aria-label={`Scroll down ${label}`}
      >
        <ArrowDown className="w-3.5 h-3.5" />
      </button>
      <span className="w-px h-3 bg-[#282a2c]" />
      <button
        type="button"
        onClick={() => handleScrollToTop(ref)}
        className="px-1.5 py-0.5 text-[10px] text-[#8e918f] hover:text-[#a8c7fa] hover:bg-[#282a2c] rounded transition-colors cursor-pointer"
        title={`Scroll to top of ${label}`}
      >
        Top
      </button>
      <button
        type="button"
        onClick={() => handleScrollToBottom(ref)}
        className="px-1.5 py-0.5 text-[10px] text-[#8e918f] hover:text-[#a8c7fa] hover:bg-[#282a2c] rounded transition-colors cursor-pointer"
        title={`Scroll to bottom of ${label}`}
      >
        Bottom
      </button>
    </div>
  );

  // Helper to match an error with a line
  const findErrorForLine = (line: string, lineNum: number): CodeErrorItem | undefined => {
    const trimmedLine = line.trim();
    // 1. Match by explicit line number
    const byLine = errors.find(e => e.line === lineNum);
    if (byLine) return byLine;

    // 2. Match by snippet content if line number wasn't matched
    if (trimmedLine.length > 2) {
      const bySnippet = errors.find(e => {
        if (!e.originalSnippet) return false;
        const snip = e.originalSnippet.trim();
        return snip === trimmedLine || (snip.length > 5 && trimmedLine.includes(snip));
      });
      if (bySnippet) return bySnippet;
    }
    return undefined;
  };

  // Helper to match a change with a line in corrected code
  const findChangeForLine = (line: string, lineNum: number): CodeChange | undefined => {
    const trimmedLine = line.trim();
    const byLine = whatChanged.find(c => c.lineNumber === lineNum);
    if (byLine) return byLine;

    if (trimmedLine.length > 2) {
      return whatChanged.find(c => {
        if (!c.after) return false;
        const after = c.after.trim();
        return after === trimmedLine || (after.length > 5 && trimmedLine.includes(after));
      });
    }
    return undefined;
  };

  return (
    <div id="errors-section" className="w-full max-w-full space-y-4 text-[#e3e3e3]">
      {/* Top Header & Diagnostics Summary without outer box */}
      <div className="space-y-3 pb-3 border-b border-[#282a2c]/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-white">Code Diagnostics & Error Analysis</span>
              <span className="text-xs text-[#8e918f]">·</span>
              <span className={`text-xs font-medium tabular-nums ${errors.length > 0 ? 'text-red-400 font-semibold' : 'text-emerald-400'}`}>
                {errors.length} {errors.length === 1 ? 'error detected' : 'errors detected'}
              </span>
            </div>
            <p className="text-xs text-[#8e918f] mt-1">
              Highlighted in <span className="font-semibold text-red-400 bg-red-950/60 px-1 py-0.5 rounded">red</span> for original syntax & runtime issues and <span className="font-semibold text-emerald-400 bg-emerald-950/60 px-1 py-0.5 rounded">green</span> for corrections.
            </p>
          </div>

          {/* Verification Badges (Python 3.10 vs AI Logic) */}
          <div className="flex flex-wrap items-center gap-2">
            {verifiedCount > 0 && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/60 border border-red-800 text-red-300 text-xs font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
                <span>{verifiedCount} Verified by Python 3.10</span>
              </div>
            )}
            {aiSuggestedCount > 0 && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-800 text-blue-300 text-xs font-medium">
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                <span>{aiSuggestedCount} AI Logic Analysis</span>
              </div>
            )}
            {errors.length === 0 && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>No Errors Detected</span>
              </div>
            )}

            {/* Big-O Complexity Badge */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono font-medium shadow-xs ${origComplexity.badgeClass}`}>
              <Cpu className="w-3.5 h-3.5 shrink-0" />
              <span>Complexity: <strong className="font-semibold">{origComplexity.timeComplexity}</strong></span>
              {corrComplexity.timeComplexity !== origComplexity.timeComplexity && (
                <span className="text-[10px] opacity-90 font-mono">
                  → Fixed: <strong>{corrComplexity.timeComplexity}</strong>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* View Selection Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-[#282a2c] w-full max-w-full">
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 bg-[#131314] p-1 rounded-2xl sm:rounded-full border border-[#282a2c] overflow-x-auto w-full sm:w-auto scrollbar-none">
            {/* Tab: Original Code (Full View with Red Highlights) */}
            <button
              type="button"
              onClick={() => setActiveTab('original_full')}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'original_full'
                  ? 'bg-red-950/80 text-red-200 border border-red-700/60 font-semibold shadow-xs'
                  : 'text-[#8e918f] hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-red-400" />
              <span>Original Code (With Issues)</span>
              {errors.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {errors.length}
                </span>
              )}
            </button>

            {/* Tab: Side-by-Side Diff */}
            <button
              type="button"
              onClick={() => setActiveTab('side_by_side')}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'side_by_side'
                  ? 'bg-[#282a2c] text-white font-semibold'
                  : 'text-[#8e918f] hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5 text-[#a8c7fa]" />
              <span>Side-by-Side Diff</span>
            </button>

            {/* Tab: Corrected Code (Full View with Green Highlights) */}
            <button
              type="button"
              onClick={() => setActiveTab('corrected_full')}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'corrected_full'
                  ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-700/60 font-semibold shadow-xs'
                  : 'text-[#8e918f] hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Corrected Code</span>
            </button>

            {/* Tab: What Changed */}
            <button
              type="button"
              onClick={() => setActiveTab('what_changed')}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-all whitespace-nowrap ${
                activeTab === 'what_changed'
                  ? 'bg-[#282a2c] text-white font-semibold'
                  : 'text-[#8e918f] hover:text-white'
              }`}
            >
              What Changed ({whatChanged.length})
            </button>

            {/* Tab: Issues & Causes */}
            <button
              type="button"
              onClick={() => setActiveTab('issues')}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-all whitespace-nowrap ${
                activeTab === 'issues'
                  ? 'bg-[#282a2c] text-white font-semibold'
                  : 'text-[#8e918f] hover:text-white'
              }`}
            >
              Issues & Causes ({errors.length})
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {activeTab === 'original_full' && (
              <button
                type="button"
                onClick={() => setExpandAllErrors(!expandAllErrors)}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-[#c4c7c5] hover:text-white bg-[#131314] hover:bg-[#282a2c] border border-[#282a2c] rounded-full transition-colors"
              >
                {expandAllErrors ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5 text-red-400" />
                    <span>Collapse Inline Diagnoses</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5 text-red-400" />
                    <span>Expand All Diagnoses</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyCorrected}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-[#003355] bg-[#a8c7fa] hover:bg-white rounded-full transition-colors shadow-xs"
            >
              {copiedCorrected ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied Corrected Code!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Corrected Code</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Jump Bar for Detected Errors */}
        {errors.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 text-xs">
            <span className="text-[#8e918f] flex items-center gap-1 font-medium">
              <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
              <span>Jump to issue:</span>
            </span>
            {errors.map((err, i) => (
              <button
                key={err.id || i}
                type="button"
                onClick={() => {
                  setActiveTab('original_full');
                  setExpandedErrorIds(prev => ({ ...prev, [err.id]: true }));
                  const el = document.getElementById(`orig-line-${err.line}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="px-2.5 py-0.5 rounded bg-red-950/70 hover:bg-red-900 border border-red-800 text-red-300 font-mono text-[11px] transition-colors flex items-center gap-1"
              >
                <span className="font-bold text-red-400">Line {err.line}</span>
                <span className="text-red-400/70">·</span>
                <span className="truncate max-w-[140px] uppercase font-sans text-[10px] font-semibold">{err.errorType}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* VIEW 1: FULL ORIGINAL CODE WITH HIGHLIGHTED ERRORS (PRIMARY)   */}
      {/* ============================================================== */}
      {activeTab === 'original_full' && (
        <div className="flex flex-col bg-[#131314] font-mono text-[13px] rounded-2xl border border-[#282a2c] overflow-hidden shadow-xs">
          {/* Subheader */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[#18191a] border-b border-[#282a2c] text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-300 font-semibold font-sans">
                Original Code (With Issues Highlighted)
              </span>
              <span className="text-[#8e918f] font-mono text-[11px]">
                {origLines.length} {origLines.length === 1 ? 'line' : 'lines'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Scroll Up & Down Controls */}
              {renderScrollControls(origScrollRef, 'original code')}

              <button
                type="button"
                onClick={handleCopyOriginal}
                className="text-[#8e918f] hover:text-white flex items-center gap-1 text-[11px] font-sans px-2 py-1 rounded bg-[#1e1f20] hover:bg-[#282a2c] border border-[#282a2c] transition-colors cursor-pointer"
                title="Copy original code"
              >
                {copiedOriginal ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedOriginal ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Full Code Container with Vertical Scroll */}
          <div
            ref={origScrollRef}
            className="p-3 overflow-x-auto max-h-[520px] overflow-y-auto scroll-smooth leading-[1.65rem] relative"
          >
            {origLines.length === 0 ? (
              <div className="p-8 text-center text-[#8e918f] font-sans text-sm">
                No code provided to display.
              </div>
            ) : (
              <>
                {origLines.map((line, idx) => {
                  const lineNum = idx + 1;
                  const err = findErrorForLine(line, lineNum);
                  const isError = Boolean(err);
                  const isExpanded = err ? isErrorExpanded(err) : false;

                  return (
                    <div key={lineNum} id={`orig-line-${lineNum}`} className="flex flex-col">
                      {/* The Code Line */}
                      <div
                        className={`flex items-start group transition-colors rounded-xs ${
                          isError
                            ? 'bg-red-950/80 text-red-100 border-l-4 border-red-500 -mx-3 px-3 shadow-[inset_0_0_12px_rgba(239,68,68,0.12)]'
                            : 'text-[#d0d3d1] hover:bg-[#1a1b1c]'
                        }`}
                      >
                        {/* Gutter: Line Number + Error Icon */}
                        <span className="select-none text-[#8e918f] text-right pr-3 shrink-0 tabular-nums w-12 text-xs pt-0.5 flex items-center justify-end gap-1.5 font-mono">
                          {isError && (
                            <AlertOctagon className="w-3.5 h-3.5 text-red-400 shrink-0 animate-pulse" />
                          )}
                          <span>{lineNum}</span>
                        </span>

                        {/* Code Content */}
                        <span className={`whitespace-pre flex-1 ${isError ? 'font-semibold text-red-200' : ''}`}>
                          {line || ' '}
                        </span>

                        {/* Error Tag & Diagnosis Toggle Button */}
                        {err && (
                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            <span className="text-[10px] uppercase font-sans font-bold px-2 py-0.5 rounded bg-red-900 border border-red-700 text-red-200 shadow-xs">
                              {err.errorType} ERROR
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleErrorExpand(err.id)}
                              className="text-[11px] font-sans font-medium text-red-300 hover:text-white bg-red-900/60 hover:bg-red-800 px-2 py-0.5 rounded border border-red-700 flex items-center gap-1 transition-colors cursor-pointer"
                              title="Toggle diagnostic details"
                            >
                              <span>{isExpanded ? 'Hide' : 'Details'}</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Inline Error Diagnostic Card (Rendered Directly Below the Buggy Line) */}
                      {err && isExpanded && (
                        <div className="my-2 ml-12 mr-2 p-3.5 rounded-xl bg-[#231517] border border-red-800/80 text-xs font-sans shadow-md animate-in fade-in slide-in-from-top-1 duration-150">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-red-900/50">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-full bg-red-900 text-red-200 text-[11px] font-bold uppercase font-mono">
                                Issue on Line {err.line}
                              </span>
                              <span className="font-semibold text-red-200">
                                {err.explanation}
                              </span>
                            </div>

                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-800">
                              {err.verificationBadge}
                            </span>
                          </div>

                          {/* Root Cause */}
                          <div className="mb-2 text-[#e3e3e3] leading-relaxed">
                            <span className="font-semibold text-red-300">Why it failed: </span>
                            <span>{err.whyItFailed}</span>
                          </div>

                          {/* Side by side snippet comparison for this error */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 font-mono text-xs">
                            <div className="p-2 rounded-lg bg-red-950/90 border border-red-800 text-red-200 overflow-x-auto">
                              <div className="text-[10px] uppercase font-sans font-bold text-red-400 mb-0.5">
                                Buggy Original:
                              </div>
                              <code>{err.originalSnippet}</code>
                            </div>

                            <div className="p-2 rounded-lg bg-emerald-950/90 border border-emerald-800 text-emerald-200 overflow-x-auto">
                              <div className="text-[10px] uppercase font-sans font-bold text-emerald-400 mb-0.5 flex items-center justify-between">
                                <span>Corrected Fix:</span>
                                <Check className="w-3 h-3 text-emerald-400" />
                              </div>
                              <code>{err.correctedSnippet}</code>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Floating scroll pill inside container */}
                {origLines.length > 12 && (
                  <div className="sticky bottom-2 float-right mr-1 flex items-center gap-1 bg-[#18191a]/95 backdrop-blur-xs px-2 py-1 rounded-full border border-[#37393b] shadow-xl z-10 text-xs">
                    <button
                      type="button"
                      onClick={() => handleScrollUp(origScrollRef)}
                      className="p-1 text-[#8e918f] hover:text-white hover:bg-[#282a2c] rounded-full transition-colors cursor-pointer"
                      title="Scroll up"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleScrollDown(origScrollRef)}
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
      )}

      {/* ============================================================== */}
      {/* VIEW 2: SIDE-BY-SIDE DIFF (ORIGINAL WITH ISSUES VS CORRECTED)   */}
      {/* ============================================================== */}
      {activeTab === 'side_by_side' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#282a2c] bg-[#131314] font-mono text-[13px] rounded-2xl border border-[#282a2c] overflow-hidden shadow-xs">
          {/* Left: Original Code (With Issues) */}
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[#18191a] border-b border-[#282a2c] text-xs">
              <div className="flex items-center gap-2">
                <span className="text-red-400 font-semibold flex items-center gap-1.5 font-sans">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  Original Code
                </span>
                <span className="text-[#8e918f] text-[11px] font-mono">{origLines.length} lines</span>
              </div>
              {renderScrollControls(sideOrigScrollRef, 'original')}
            </div>

            <div
              ref={sideOrigScrollRef}
              className="p-3 overflow-x-auto max-h-[520px] overflow-y-auto scroll-smooth leading-[1.625rem] relative"
            >
              {origLines.map((line, idx) => {
                const lineNum = idx + 1;
                const err = findErrorForLine(line, lineNum);
                const isError = Boolean(err);

                return (
                  <div key={lineNum} className="flex flex-col">
                    <div
                      className={`flex items-start group ${
                        isError
                          ? 'bg-red-950/75 text-red-100 border-l-2 border-red-500 -mx-3 px-3'
                          : 'text-[#c4c7c5] hover:bg-[#1a1b1c]'
                      }`}
                    >
                      <span className="select-none text-[#8e918f] text-right pr-3 shrink-0 tabular-nums w-8 text-xs pt-0.5">
                        {lineNum}
                      </span>
                      <span className="whitespace-pre flex-1">{line || ' '}</span>
                      {err && (
                        <span className="text-[10px] uppercase font-sans font-bold px-1.5 py-0.2 rounded bg-red-900 text-red-200 shrink-0 ml-2">
                          {err.errorType}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Corrected & Rewritten Code */}
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[#18191a] border-b border-[#282a2c] text-xs">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5 font-sans">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Corrected Code
                </span>
                <span className="text-[#8e918f] text-[11px] font-mono">{corrLines.length} lines</span>
              </div>
              {renderScrollControls(sideCorrScrollRef, 'corrected')}
            </div>

            <div
              ref={sideCorrScrollRef}
              className="p-3 overflow-x-auto max-h-[520px] overflow-y-auto scroll-smooth leading-[1.625rem] relative"
            >
              {corrLines.map((line, idx) => {
                const lineNum = idx + 1;
                const change = findChangeForLine(line, lineNum);
                const isChanged = Boolean(change);

                return (
                  <div
                    key={lineNum}
                    className={`flex items-start group ${
                      isChanged
                        ? 'bg-emerald-950/75 text-emerald-100 border-l-2 border-emerald-500 -mx-3 px-3'
                        : 'text-[#c4c7c5] hover:bg-[#1a1b1c]'
                    }`}
                  >
                    <span className="select-none text-[#8e918f] text-right pr-3 shrink-0 tabular-nums w-8 text-xs pt-0.5">
                      {lineNum}
                    </span>
                    <span className="whitespace-pre flex-1">{line || ' '}</span>
                    {isChanged && (
                      <span className="text-[10px] uppercase font-sans font-bold px-1.5 py-0.2 rounded bg-emerald-900 text-emerald-200 shrink-0 ml-2">
                        Fixed
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 3: FULL CORRECTED CODE                                     */}
      {/* ============================================================== */}
      {activeTab === 'corrected_full' && (
        <div className="flex flex-col bg-[#131314] font-mono text-[13px] rounded-2xl border border-[#282a2c] overflow-hidden shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[#18191a] border-b border-[#282a2c] text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-emerald-300 font-semibold font-sans">
                Cleaned, Fixed & Tested Code
              </span>
              <span className="text-[#8e918f] font-mono text-[11px]">{corrLines.length} lines</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Scroll Up & Down Controls */}
              {renderScrollControls(corrScrollRef, 'corrected code')}

              <button
                type="button"
                onClick={handleCopyCorrected}
                className="text-emerald-400 hover:text-white flex items-center gap-1 text-[11px] font-sans px-2.5 py-1 rounded bg-[#1e1f20] hover:bg-[#282a2c] border border-[#282a2c] transition-colors cursor-pointer"
                title="Copy corrected code"
              >
                {copiedCorrected ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCorrected ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div
            ref={corrScrollRef}
            className="p-3 overflow-x-auto max-h-[520px] overflow-y-auto scroll-smooth leading-[1.65rem] relative"
          >
            {corrLines.map((line, idx) => {
              const lineNum = idx + 1;
              const change = findChangeForLine(line, lineNum);
              const isChanged = Boolean(change);

              return (
                <div
                  key={lineNum}
                  className={`flex items-start group ${
                    isChanged
                      ? 'bg-emerald-950/60 text-emerald-100 border-l-4 border-emerald-500 -mx-3 px-3'
                      : 'text-[#d0d3d1] hover:bg-[#1a1b1c]'
                  }`}
                >
                  <span className="select-none text-[#8e918f] text-right pr-3 shrink-0 tabular-nums w-10 text-xs pt-0.5">
                    {lineNum}
                  </span>
                  <span className="whitespace-pre flex-1">{line || ' '}</span>
                  {isChanged && (
                    <span className="text-[10px] uppercase font-sans font-bold px-2 py-0.5 rounded bg-emerald-900 border border-emerald-700 text-emerald-200 shrink-0 ml-2">
                      Corrected
                    </span>
                  )}
                </div>
              );
            })}

            {/* Floating scroll pill inside container */}
            {corrLines.length > 12 && (
              <div className="sticky bottom-2 float-right mr-1 flex items-center gap-1 bg-[#18191a]/95 backdrop-blur-xs px-2 py-1 rounded-full border border-[#37393b] shadow-xl z-10 text-xs">
                <button
                  type="button"
                  onClick={() => handleScrollUp(corrScrollRef)}
                  className="p-1 text-[#8e918f] hover:text-white hover:bg-[#282a2c] rounded-full transition-colors cursor-pointer"
                  title="Scroll up"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleScrollDown(corrScrollRef)}
                  className="p-1 text-[#8e918f] hover:text-white hover:bg-[#282a2c] rounded-full transition-colors cursor-pointer"
                  title="Scroll down"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 4: WHAT CHANGED (OLD WORDING -> NEW WORDING)               */}
      {/* ============================================================== */}
      {activeTab === 'what_changed' && (
        <div className="p-5 space-y-4">
          <div className="text-xs text-[#8e918f]">
            Every code transformation applied to resolve bugs, syntax violations, or bad practices:
          </div>

          {whatChanged.length === 0 ? (
            <p className="text-sm text-[#8e918f] italic">No modifications were required for this code snippet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {whatChanged.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-[#282a2c] p-4 bg-[#131314] hover:border-[#37393b] transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold text-white">
                      Change #{idx + 1}
                      {item.lineNumber ? ` (Line ${item.lineNumber})` : ''}
                    </span>
                    <span className="text-xs text-[#a8c7fa]">{item.reason}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs mt-2">
                    {/* Before (Grey) */}
                    <div className="p-3 rounded-lg bg-[#1e1f20] border border-[#282a2c] text-[#8e918f] overflow-x-auto">
                      <div className="text-[10px] font-sans font-bold text-[#8e918f] uppercase tracking-wider mb-1">
                        Before (Old Wording)
                      </div>
                      <code>{item.before || '(Empty)'}</code>
                    </div>

                    {/* After (Green) */}
                    <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800 text-emerald-300 overflow-x-auto">
                      <div className="text-[10px] font-sans font-bold text-emerald-400 uppercase tracking-wider mb-1">
                        After (New Wording)
                      </div>
                      <code>{item.after}</code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 5: ISSUES & ROOT CAUSES LIST                              */}
      {/* ============================================================== */}
      {activeTab === 'issues' && (
        <div className="p-5 space-y-4">
          {errors.length === 0 ? (
            <div className="p-6 text-center text-[#8e918f] text-sm">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <span>Great job! No errors were detected in your code.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {errors.map((err) => (
                <div
                  key={err.id}
                  className={`rounded-xl border p-4 transition-colors ${
                    err.verification === 'execution_verified'
                      ? 'border-red-800/80 bg-red-950/30'
                      : 'border-amber-800/80 bg-amber-950/30'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {err.verification === 'execution_verified' ? (
                        <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                      <span className="font-semibold text-sm text-white">
                        Line {err.line}: {err.errorType.toUpperCase()} ERROR
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                          err.verification === 'execution_verified'
                            ? 'bg-red-900/60 text-red-200 border border-red-700'
                            : 'bg-blue-900/60 text-blue-200 border border-blue-700'
                        }`}
                      >
                        {err.verificationBadge}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('original_full');
                          setExpandedErrorIds(prev => ({ ...prev, [err.id]: true }));
                          const el = document.getElementById(`orig-line-${err.line}`);
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        className="text-[11px] text-[#a8c7fa] hover:text-white flex items-center gap-1 underline underline-offset-2 ml-1"
                      >
                        <span>View in full code</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-[#c4c7c5] mb-2 leading-relaxed">
                    {err.explanation}
                  </p>

                  <div className="text-xs text-[#e3e3e3] mb-3 bg-[#131314] p-3 rounded-lg border border-[#282a2c]">
                    <span className="font-semibold text-[#a8c7fa]">Why it failed: </span>
                    {err.whyItFailed}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                    <div className="bg-red-950/90 text-red-300 p-2.5 rounded-lg overflow-x-auto border border-red-800">
                      <div className="text-[10px] font-sans text-red-400 font-bold mb-0.5">Buggy line:</div>
                      <code>{err.originalSnippet}</code>
                    </div>
                    <div className="bg-emerald-950/90 text-emerald-300 p-2.5 rounded-lg overflow-x-auto border border-emerald-800">
                      <div className="text-[10px] font-sans text-emerald-400 font-bold mb-0.5">Corrected line:</div>
                      <code>{err.correctedSnippet}</code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
